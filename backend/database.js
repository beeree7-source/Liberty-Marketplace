const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "cigar-hub.db");
const db = new sqlite3.Database(dbPath);

// Create users table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('retailer', 'supplier')) NOT NULL,
      approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      retailer_id INTEGER,
      supplier_id INTEGER,
      items TEXT NOT NULL,  -- JSON string
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(retailer_id) REFERENCES users(id)
    )
  `);

  // Create licenses table
  db.run(`
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      license_number TEXT,
      expiration_date TEXT,
      file_name TEXT,
      verified BOOLEAN DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplierId INTEGER,
      name TEXT,
      sku TEXT UNIQUE,
      price REAL,
      stock INTEGER,
      imageUrl TEXT,
      description TEXT,
      FOREIGN KEY(supplierId) REFERENCES users(id)
    )
  `);

  // Create stock_history table for inventory tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      user_id INTEGER,
      adjustment INTEGER,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Create notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      subject TEXT,
      body TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'sent',
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Create notification_settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      email_alerts BOOLEAN DEFAULT 1,
      sms_alerts BOOLEAN DEFAULT 0,
      low_stock_alert BOOLEAN DEFAULT 1,
      order_confirmation BOOLEAN DEFAULT 1,
      shipment_notification BOOLEAN DEFAULT 1,
      payment_reminder BOOLEAN DEFAULT 1,
      weekly_summary BOOLEAN DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Create invoices table
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE,
      invoice_number TEXT UNIQUE NOT NULL,
      total REAL NOT NULL,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'unpaid',
      payment_terms TEXT DEFAULT 'Net 30',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);

  // Create quickbooks_config table
  db.run(`
    CREATE TABLE IF NOT EXISTS quickbooks_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT UNIQUE,
      access_token TEXT,
      refresh_token TEXT,
      realm_id TEXT,
      sync_status TEXT DEFAULT 'not_connected',
      last_sync DATETIME,
      token_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create qb_sync_log table
  db.run(`
    CREATE TABLE IF NOT EXISTS qb_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      items_synced INTEGER DEFAULT 0,
      last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create account_mapping table
  db.run(`
    CREATE TABLE IF NOT EXISTS account_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_account TEXT NOT NULL,
      qb_account_id TEXT,
      qb_account_name TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create supplier_metrics table
  db.run(`
    CREATE TABLE IF NOT EXISTS supplier_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER UNIQUE,
      total_orders INTEGER DEFAULT 0,
      on_time_deliveries INTEGER DEFAULT 0,
      total_deliveries INTEGER DEFAULT 0,
      on_time_percentage REAL DEFAULT 100.0,
      quality_rating REAL DEFAULT 5.0,
      total_revenue REAL DEFAULT 0,
      outstanding_balance REAL DEFAULT 0,
      credit_limit REAL DEFAULT 0,
      payment_terms TEXT DEFAULT 'Net 30',
      last_order_date DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES users(id)
    )
  `);

  // Create supplier_payments table
  db.run(`
    CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER,
      order_id INTEGER,
      amount REAL NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT,
      reference_number TEXT,
      notes TEXT,
      FOREIGN KEY(supplier_id) REFERENCES users(id),
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);

  // ============================================
  // Communication System Tables
  // ============================================

  // Create conversation_threads table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(user2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user1_id, user2_id)
    )
  `);

  // Create messages table
  db.run(`
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
    )
  `);

  // Create message_read_status table
  db.run(`
    CREATE TABLE IF NOT EXISTS message_read_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(message_id, user_id)
    )
  `);

  // Create call_logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caller_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      call_type TEXT CHECK(call_type IN ('inbound', 'outbound', 'missed')) NOT NULL,
      status TEXT CHECK(status IN ('initiated', 'ringing', 'answered', 'missed', 'completed', 'failed')) DEFAULT 'initiated',
      duration INTEGER DEFAULT 0,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(caller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_conversation_threads_user1 ON conversation_threads(user1_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_conversation_threads_user2 ON conversation_threads(user2_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_conversation_threads_last_message ON conversation_threads(last_message_at DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_call_logs_caller_id ON call_logs(caller_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_call_logs_recipient_id ON call_logs(recipient_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_call_logs_call_type ON call_logs(call_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_call_logs_start_time ON call_logs(start_time DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id)`);
});

module.exports = db;
