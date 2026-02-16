/**
 * Communication Service
 * Handles messaging and call logging between users
 */

const db = require('./database');
const { checkPermission, logAuditEvent } = require('./rbac');

// ============================================
// Helper Functions
// ============================================

/**
 * Get or create conversation thread between two users
 */
const getOrCreateThread = (user1Id, user2Id) => {
  return new Promise((resolve, reject) => {
    // Ensure consistent ordering (lower ID first)
    const [userId1, userId2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Check if thread exists
    db.get(
      `SELECT id FROM conversation_threads 
       WHERE user1_id = ? AND user2_id = ?`,
      [userId1, userId2],
      (err, row) => {
        if (err) return reject(err);

        if (row) {
          return resolve(row.id);
        }

        // Create new thread
        db.run(
          `INSERT INTO conversation_threads (user1_id, user2_id) VALUES (?, ?)`,
          [userId1, userId2],
          function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
          }
        );
      }
    );
  });
};

/**
 * Check if users can communicate (RBAC enforcement)
 */
const canCommunicate = async (user1Id, user2Id) => {
  // Get both users' information
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, role FROM users WHERE id IN (?, ?)`,
      [user1Id, user2Id],
      (err, users) => {
        if (err) return reject(err);
        if (users.length !== 2) return resolve(false);

        // Communication rules:
        // 1. Suppliers can message retailers and sales reps
        // 2. Retailers can message suppliers and sales reps
        // 3. Sales reps can message everyone
        const roles = users.map(u => u.role);
        
        // Allow if at least one is sales rep
        if (roles.includes('Sales') || roles.includes('sales_rep')) {
          return resolve(true);
        }

        // Allow supplier-retailer communication
        if (roles.includes('supplier') && roles.includes('retailer')) {
          return resolve(true);
        }

        resolve(false);
      }
    );
  });
};

/**
 * Sanitize message content
 */
const sanitizeContent = (content) => {
  if (!content) return '';
  // Basic sanitization - remove potential XSS
  return content.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
                .trim();
};

// ============================================
// Messaging Functions
// ============================================

/**
 * Send a message
 */
const sendMessage = async (senderId, recipientId, content, messageType = 'text', attachmentUrl = null, attachmentName = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate input
      if (!senderId || !recipientId || !content) {
        return reject(new Error('Missing required fields'));
      }

      if (!['text', 'file', 'attachment'].includes(messageType)) {
        return reject(new Error('Invalid message type'));
      }

      // Check if users can communicate
      const canComm = await canCommunicate(senderId, recipientId);
      if (!canComm) {
        return reject(new Error('Unauthorized: Users cannot communicate'));
      }

      // Sanitize content
      const sanitizedContent = sanitizeContent(content);

      // Get or create thread
      const threadId = await getOrCreateThread(senderId, recipientId);

      // Insert message
      db.run(
        `INSERT INTO messages 
         (thread_id, sender_id, recipient_id, message_type, content, attachment_url, attachment_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [threadId, senderId, recipientId, messageType, sanitizedContent, attachmentUrl, attachmentName],
        function(err) {
          if (err) return reject(err);

          const messageId = this.lastID;

          // Update thread last_message_at
          db.run(
            `UPDATE conversation_threads SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [threadId],
            (err) => {
              if (err) console.error('Failed to update thread timestamp:', err);
            }
          );

          // Log audit event
          logAuditEvent(senderId, 'send_message', 'messages', messageId, {
            recipientId,
            messageType
          }).catch(console.error);

          resolve({ 
            id: messageId, 
            threadId, 
            senderId, 
            recipientId, 
            messageType, 
            content: sanitizedContent,
            attachmentUrl,
            attachmentName,
            created_at: new Date().toISOString() 
          });
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get all conversations for a user
 */
const getConversations = (userId, page = 1, limit = 20) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        ct.id as thread_id,
        ct.last_message_at,
        CASE 
          WHEN ct.user1_id = ? THEN ct.user2_id 
          ELSE ct.user1_id 
        END as other_user_id,
        u.name as other_user_name,
        u.role as other_user_role,
        u.email as other_user_email,
        (SELECT COUNT(*) 
         FROM messages m 
         WHERE m.thread_id = ct.id 
           AND m.recipient_id = ? 
           AND m.is_read = 0
           AND m.deleted_by_recipient = 0) as unread_count,
        (SELECT content 
         FROM messages m 
         WHERE m.thread_id = ct.id 
         ORDER BY m.created_at DESC 
         LIMIT 1) as last_message_content,
        (SELECT created_at 
         FROM messages m 
         WHERE m.thread_id = ct.id 
         ORDER BY m.created_at DESC 
         LIMIT 1) as last_message_time
      FROM conversation_threads ct
      JOIN users u ON (
        CASE 
          WHEN ct.user1_id = ? THEN ct.user2_id 
          ELSE ct.user1_id 
        END = u.id
      )
      WHERE ct.user1_id = ? OR ct.user2_id = ?
      ORDER BY ct.last_message_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [userId, userId, userId, userId, userId, limit, offset], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

/**
 * Get message thread with specific user
 */
const getMessageThread = (currentUserId, otherUserId, page = 1, limit = 50) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if users can communicate
      const canComm = await canCommunicate(currentUserId, otherUserId);
      if (!canComm) {
        return reject(new Error('Unauthorized: Users cannot communicate'));
      }

      const offset = (page - 1) * limit;
      const [userId1, userId2] = currentUserId < otherUserId ? [currentUserId, otherUserId] : [otherUserId, currentUserId];

      const query = `
        SELECT 
          m.id,
          m.sender_id,
          m.recipient_id,
          m.message_type,
          m.content,
          m.attachment_url,
          m.attachment_name,
          m.is_read,
          m.read_at,
          m.created_at,
          u.name as sender_name,
          u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.thread_id = (
          SELECT id FROM conversation_threads 
          WHERE user1_id = ? AND user2_id = ?
        )
        AND (
          (m.sender_id = ? AND m.deleted_by_sender = 0) OR
          (m.recipient_id = ? AND m.deleted_by_recipient = 0)
        )
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.all(query, [userId1, userId2, currentUserId, currentUserId, limit, offset], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Mark message as read
 */
const markMessageAsRead = (messageId, userId) => {
  return new Promise((resolve, reject) => {
    // First verify the user is the recipient
    db.get(
      `SELECT id FROM messages WHERE id = ? AND recipient_id = ?`,
      [messageId, userId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Message not found or unauthorized'));

        // Update message
        db.run(
          `UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [messageId],
          function(err) {
            if (err) return reject(err);

            // Insert read status
            db.run(
              `INSERT OR IGNORE INTO message_read_status (message_id, user_id) VALUES (?, ?)`,
              [messageId, userId],
              (err) => {
                if (err) console.error('Failed to insert read status:', err);
              }
            );

            resolve({ success: true, messageId });
          }
        );
      }
    );
  });
};

/**
 * Delete a message (soft delete)
 */
const deleteMessage = (messageId, userId) => {
  return new Promise((resolve, reject) => {
    // Check if user is sender or recipient
    db.get(
      `SELECT sender_id, recipient_id FROM messages WHERE id = ?`,
      [messageId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Message not found'));

        let updateField = null;
        if (row.sender_id === userId) {
          updateField = 'deleted_by_sender';
        } else if (row.recipient_id === userId) {
          updateField = 'deleted_by_recipient';
        } else {
          return reject(new Error('Unauthorized'));
        }

        // Soft delete
        db.run(
          `UPDATE messages SET ${updateField} = 1 WHERE id = ?`,
          [messageId],
          function(err) {
            if (err) return reject(err);

            // Log audit event
            logAuditEvent(userId, 'delete_message', 'messages', messageId).catch(console.error);

            resolve({ success: true, messageId });
          }
        );
      }
    );
  });
};

/**
 * Get unread message count
 */
const getUnreadCount = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM messages 
       WHERE recipient_id = ? AND is_read = 0 AND deleted_by_recipient = 0`,
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.count : 0);
      }
    );
  });
};

// ============================================
// Call Logging Functions
// ============================================

/**
 * Initiate a call
 */
const initiateCall = async (callerId, recipientId, callType = 'outbound') => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate input
      if (!callerId || !recipientId) {
        return reject(new Error('Missing required fields'));
      }

      if (!['inbound', 'outbound', 'missed'].includes(callType)) {
        return reject(new Error('Invalid call type'));
      }

      // Check if users can communicate
      const canComm = await canCommunicate(callerId, recipientId);
      if (!canComm) {
        return reject(new Error('Unauthorized: Users cannot communicate'));
      }

      // Insert call log
      db.run(
        `INSERT INTO call_logs 
         (caller_id, recipient_id, call_type, status, start_time)
         VALUES (?, ?, ?, 'initiated', CURRENT_TIMESTAMP)`,
        [callerId, recipientId, callType],
        function(err) {
          if (err) return reject(err);

          const callId = this.lastID;

          // Log audit event
          logAuditEvent(callerId, 'initiate_call', 'call_logs', callId, {
            recipientId,
            callType
          }).catch(console.error);

          resolve({ 
            id: callId, 
            callerId, 
            recipientId, 
            callType, 
            status: 'initiated',
            start_time: new Date().toISOString() 
          });
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Complete call logging with details
 */
const logCallDetails = (callId, userId, status, duration = 0, notes = null) => {
  return new Promise((resolve, reject) => {
    // Verify user is caller or recipient
    db.get(
      `SELECT caller_id, recipient_id FROM call_logs WHERE id = ?`,
      [callId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Call not found'));
        if (row.caller_id !== userId && row.recipient_id !== userId) {
          return reject(new Error('Unauthorized'));
        }

        // Valid statuses
        const validStatuses = ['ringing', 'answered', 'missed', 'completed', 'failed'];
        if (!validStatuses.includes(status)) {
          return reject(new Error('Invalid status'));
        }

        // Update call log
        const sanitizedNotes = notes ? sanitizeContent(notes) : null;
        db.run(
          `UPDATE call_logs 
           SET status = ?, duration = ?, end_time = CURRENT_TIMESTAMP, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [status, duration, sanitizedNotes, callId],
          function(err) {
            if (err) return reject(err);

            // Log audit event
            logAuditEvent(userId, 'log_call_details', 'call_logs', callId, {
              status,
              duration
            }).catch(console.error);

            resolve({ success: true, callId, status, duration });
          }
        );
      }
    );
  });
};

/**
 * Get all call logs for current user
 */
const getCallLogs = (userId, page = 1, limit = 50, filters = {}) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    let whereConditions = [`(cl.caller_id = ? OR cl.recipient_id = ?)`];
    let params = [userId, userId];

    // Apply filters
    if (filters.callType) {
      whereConditions.push('cl.call_type = ?');
      params.push(filters.callType);
    }
    if (filters.status) {
      whereConditions.push('cl.status = ?');
      params.push(filters.status);
    }
    if (filters.startDate) {
      whereConditions.push('cl.start_time >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereConditions.push('cl.start_time <= ?');
      params.push(filters.endDate);
    }

    const whereClause = whereConditions.join(' AND ');
    params.push(limit, offset);

    const query = `
      SELECT 
        cl.id,
        cl.caller_id,
        cl.recipient_id,
        cl.call_type,
        cl.status,
        cl.duration,
        cl.start_time,
        cl.end_time,
        cl.notes,
        cl.created_at,
        caller.name as caller_name,
        caller.role as caller_role,
        recipient.name as recipient_name,
        recipient.role as recipient_role
      FROM call_logs cl
      JOIN users caller ON cl.caller_id = caller.id
      JOIN users recipient ON cl.recipient_id = recipient.id
      WHERE ${whereClause}
      ORDER BY cl.start_time DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

/**
 * Get call history with specific user
 */
const getCallHistoryWithUser = (currentUserId, otherUserId, page = 1, limit = 50) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if users can communicate
      const canComm = await canCommunicate(currentUserId, otherUserId);
      if (!canComm) {
        return reject(new Error('Unauthorized: Users cannot communicate'));
      }

      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          cl.id,
          cl.caller_id,
          cl.recipient_id,
          cl.call_type,
          cl.status,
          cl.duration,
          cl.start_time,
          cl.end_time,
          cl.notes,
          cl.created_at
        FROM call_logs cl
        WHERE (cl.caller_id = ? AND cl.recipient_id = ?) 
           OR (cl.caller_id = ? AND cl.recipient_id = ?)
        ORDER BY cl.start_time DESC
        LIMIT ? OFFSET ?
      `;

      db.all(query, [currentUserId, otherUserId, otherUserId, currentUserId, limit, offset], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get call analytics
 */
const getCallAnalytics = (userId, startDate = null, endDate = null) => {
  return new Promise((resolve, reject) => {
    let dateConditions = '';
    let params = [userId, userId];

    if (startDate) {
      dateConditions += ' AND cl.start_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateConditions += ' AND cl.start_time <= ?';
      params.push(endDate);
    }

    const query = `
      SELECT 
        COUNT(*) as total_calls,
        SUM(CASE WHEN cl.status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
        SUM(CASE WHEN cl.status = 'missed' THEN 1 ELSE 0 END) as missed_calls,
        SUM(CASE WHEN cl.call_type = 'inbound' THEN 1 ELSE 0 END) as inbound_calls,
        SUM(CASE WHEN cl.call_type = 'outbound' THEN 1 ELSE 0 END) as outbound_calls,
        AVG(CASE WHEN cl.duration > 0 THEN cl.duration ELSE NULL END) as avg_duration,
        SUM(cl.duration) as total_duration,
        MAX(cl.duration) as max_duration
      FROM call_logs cl
      WHERE (cl.caller_id = ? OR cl.recipient_id = ?)${dateConditions}
    `;

    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || {});
    });
  });
};

/**
 * Add or update notes on a call
 */
const updateCallNotes = (callId, userId, notes) => {
  return new Promise((resolve, reject) => {
    // Verify user is caller or recipient
    db.get(
      `SELECT caller_id, recipient_id FROM call_logs WHERE id = ?`,
      [callId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Call not found'));
        if (row.caller_id !== userId && row.recipient_id !== userId) {
          return reject(new Error('Unauthorized'));
        }

        // Update notes
        const sanitizedNotes = sanitizeContent(notes);
        db.run(
          `UPDATE call_logs SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [sanitizedNotes, callId],
          function(err) {
            if (err) return reject(err);

            // Log audit event
            logAuditEvent(userId, 'update_call_notes', 'call_logs', callId).catch(console.error);

            resolve({ success: true, callId, notes: sanitizedNotes });
          }
        );
      }
    );
  });
};

module.exports = {
  // Messaging
  sendMessage,
  getConversations,
  getMessageThread,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  
  // Call Logging
  initiateCall,
  logCallDetails,
  getCallLogs,
  getCallHistoryWithUser,
  getCallAnalytics,
  updateCallNotes
};
