-- ============================================
-- Communication System Schema
-- Migration 009
-- Tables: messages, call_logs, conversation_threads, message_read_status
-- ============================================

-- 1. Conversation Threads Table
-- Groups messages between two users into a conversation
CREATE TABLE IF NOT EXISTS conversation_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(user2_id) REFERENCES users(id) ON DELETE CASCADE,
  -- Ensure unique conversation between two users (order independent)
  UNIQUE(user1_id, user2_id)
);

-- 2. Messages Table
-- Store all messages between users
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  message_type TEXT CHECK(message_type IN ('text', 'file', 'attachment')) DEFAULT 'text',
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  deleted_by_sender BOOLEAN DEFAULT 0,
  deleted_by_recipient BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE,
  FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Message Read Status Table
-- Track when messages were read by recipients
CREATE TABLE IF NOT EXISTS message_read_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(message_id, user_id)
);

-- 4. Call Logs Table
-- Track all calls between users
CREATE TABLE IF NOT EXISTS call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  call_type TEXT CHECK(call_type IN ('inbound', 'outbound', 'missed')) NOT NULL,
  status TEXT CHECK(status IN ('initiated', 'ringing', 'answered', 'missed', 'completed', 'failed')) DEFAULT 'initiated',
  duration INTEGER DEFAULT 0, -- Duration in seconds
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(caller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_threads_user1 ON conversation_threads(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_user2 ON conversation_threads(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_last_message ON conversation_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_caller_id ON call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_recipient_id ON call_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_type ON call_logs(call_type);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_start_time ON call_logs(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);
