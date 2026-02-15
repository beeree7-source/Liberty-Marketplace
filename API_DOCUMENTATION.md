# Phase 4 Features - API Documentation

Complete API reference for all Phase 4 enterprise features.

## Base URL
```
http://localhost:4000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Email Notifications API

### Send Test Email
Send a test email to verify email configuration.

**Endpoint:** `POST /protected/notifications/email/test`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "1234567890"
}
```

### Get Notification Settings
Retrieve notification preferences for the authenticated user.

**Endpoint:** `GET /protected/notifications/settings`

**Response:**
```json
{
  "user_id": 1,
  "email_alerts": 1,
  "sms_alerts": 0,
  "low_stock_alert": 1,
  "order_confirmation": 1,
  "shipment_notification": 1,
  "payment_reminder": 1,
  "weekly_summary": 1
}
```

### Update Notification Settings
Update notification preferences.

**Endpoint:** `PUT /protected/notifications/settings`

**Request:**
```json
{
  "email_alerts": true,
  "low_stock_alert": true,
  "order_confirmation": true,
  "shipment_notification": true,
  "payment_reminder": false,
  "weekly_summary": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### Get Notification History
Retrieve sent notifications history.

**Endpoint:** `GET /protected/notifications/history`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by notification type

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "type": "order_confirmation",
      "subject": "Order Confirmation #123",
      "body": "...",
      "sent_at": "2026-02-15T10:00:00Z",
      "status": "sent"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

## Invoice API

### Generate Invoice for Order
Create an invoice for a specific order.

**Endpoint:** `POST /protected/orders/:id/invoice`

**Request:**
```json
{
  "discount": 5,
  "taxRate": 0.08,
  "paymentTerms": "Net 30",
  "notes": "Thank you for your business"
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": 1,
    "invoice_number": "INV-2026-001",
    "order_id": 123,
    "subtotal": 1000.00,
    "discount": 50.00,
    "tax": 76.00,
    "total": 1026.00,
    "due_date": "2026-03-17",
    "status": "unpaid",
    "payment_terms": "Net 30",
    "notes": "Thank you for your business"
  }
}
```

### Get All Invoices
List all invoices with optional filtering.

**Endpoint:** `GET /protected/invoices`

**Query Parameters:**
- `status` (optional): Filter by status (paid, unpaid)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "invoices": [
    {
      "id": 1,
      "invoice_number": "INV-2026-001",
      "order_id": 123,
      "total": 1026.00,
      "status": "unpaid",
      "due_date": "2026-03-17",
      "retailer_name": "Retail Store Inc",
      "retailer_email": "retailer@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

### Get Invoice Details
Retrieve detailed information about a specific invoice.

**Endpoint:** `GET /protected/invoices/:id`

**Response:**
```json
{
  "id": 1,
  "invoice_number": "INV-2026-001",
  "order_id": 123,
  "subtotal": 1000.00,
  "discount": 50.00,
  "tax": 76.00,
  "total": 1026.00,
  "due_date": "2026-03-17",
  "status": "unpaid",
  "payment_terms": "Net 30",
  "notes": "Thank you for your business",
  "items": [
    {
      "name": "Premium Cigars",
      "sku": "CIG-001",
      "quantity": 100,
      "price": 10.00
    }
  ],
  "retailer_name": "Retail Store Inc",
  "supplier_name": "Premium Tobacco Co"
}
```

### Download Invoice PDF
Download invoice as PDF (currently returns plain text).

**Endpoint:** `GET /protected/invoices/:id/pdf`

**Response:** Plain text invoice (in production: PDF file)

### Send Invoice via Email
Email an invoice to the customer.

**Endpoint:** `POST /protected/invoices/:id/send`

**Response:**
```json
{
  "success": true,
  "message": "Invoice email sent successfully"
}
```

### Mark Invoice as Paid
Update invoice payment status.

**Endpoint:** `PUT /protected/invoices/:id/mark-paid`

**Request:**
```json
{
  "status": "paid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice marked as paid"
}
```

---

## Supplier Dashboard API

### Get All Suppliers
List all suppliers with their metrics.

**Endpoint:** `GET /protected/suppliers`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "suppliers": [
    {
      "id": 1,
      "name": "Premium Tobacco Co",
      "email": "supplier@example.com",
      "approved": 1,
      "total_orders": 150,
      "on_time_percentage": 95.5,
      "quality_rating": 4.8,
      "total_revenue": 125000.00,
      "outstanding_balance": 5000.00,
      "credit_limit": 50000.00,
      "payment_terms": "Net 30"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

### Get Supplier Analytics
Detailed analytics for a specific supplier.

**Endpoint:** `GET /protected/suppliers/:id/analytics`

**Response:**
```json
{
  "supplier": {
    "id": 1,
    "name": "Premium Tobacco Co",
    "email": "supplier@example.com",
    "on_time_percentage": 95.5,
    "quality_rating": 4.8,
    "total_revenue": 125000.00
  },
  "analytics": {
    "orders": {
      "total_orders": 150,
      "completed_orders": 140,
      "pending_orders": 8,
      "cancelled_orders": 2
    },
    "monthlyTrend": [
      { "month": "2026-02", "order_count": 25 },
      { "month": "2026-01", "order_count": 30 }
    ],
    "topProducts": [
      {
        "id": 1,
        "name": "Premium Cigars",
        "sku": "CIG-001",
        "price": 10.00,
        "stock": 500
      }
    ],
    "performance": {
      "on_time_percentage": 95.5,
      "quality_rating": 4.8,
      "total_revenue": 125000.00,
      "outstanding_balance": 5000.00
    }
  }
}
```

### Get Supplier Orders
List all orders from a specific supplier.

**Endpoint:** `GET /protected/suppliers/:id/orders`

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "orders": [
    {
      "id": 123,
      "retailer_id": 5,
      "retailer_name": "Retail Store Inc",
      "retailer_email": "retailer@example.com",
      "items": [...],
      "status": "completed",
      "created_at": "2026-02-10T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Get Supplier Balance
Get supplier balance and payment information.

**Endpoint:** `GET /protected/suppliers/:id/balance`

**Response:**
```json
{
  "balance": {
    "name": "Premium Tobacco Co",
    "email": "supplier@example.com",
    "outstanding_balance": 5000.00,
    "credit_limit": 50000.00,
    "payment_terms": "Net 30",
    "available_credit": 45000.00
  },
  "payments": [
    {
      "id": 1,
      "amount": 10000.00,
      "payment_date": "2026-02-01T10:00:00Z",
      "payment_method": "Bank Transfer",
      "reference_number": "TXN-12345"
    }
  ]
}
```

### Update Supplier Terms
Update payment terms and credit limit.

**Endpoint:** `PUT /protected/suppliers/:id/terms`

**Request:**
```json
{
  "credit_limit": 75000.00,
  "payment_terms": "Net 45"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment terms updated successfully"
}
```

---

## Advanced Reports API

### Quarterly Revenue Report
Get revenue breakdown by quarter.

**Endpoint:** `GET /protected/reports/quarterly`

**Query Parameters:**
- `year` (optional): Year (default: current year)

**Response:**
```json
{
  "year": 2026,
  "quarters": [
    {
      "quarter": "Q1",
      "year": 2026,
      "revenue": 125000.00,
      "order_count": 450
    },
    {
      "quarter": "Q2",
      "year": 2026,
      "revenue": 0,
      "order_count": 0
    }
  ],
  "total": 125000.00
}
```

### Supplier Performance Report
Analyze supplier performance metrics.

**Endpoint:** `GET /protected/reports/supplier-performance`

**Response:**
```json
{
  "suppliers": [
    {
      "id": 1,
      "name": "Premium Tobacco Co",
      "email": "supplier@example.com",
      "total_orders": 150,
      "completed_orders": 140,
      "completion_rate": 93,
      "on_time_percentage": 95.5,
      "quality_rating": 4.8,
      "total_revenue": 125000.00
    }
  ],
  "summary": {
    "total_suppliers": 5,
    "avg_completion_rate": 91.2,
    "avg_quality_rating": 4.6
  }
}
```

### Customer Lifetime Value (LTV)
Calculate customer lifetime value and metrics.

**Endpoint:** `GET /protected/reports/customer-ltv`

**Response:**
```json
{
  "customers": [
    {
      "id": 1,
      "name": "Retail Store Inc",
      "email": "retailer@example.com",
      "total_orders": 50,
      "lifetime_value": 25000.00,
      "avg_order_value": 500.00,
      "days_as_customer": 365,
      "orders_per_month": 4.11
    }
  ],
  "summary": {
    "total_customers": 20,
    "avg_ltv": 15000.00,
    "total_revenue": 300000.00
  }
}
```

### Profit Analysis
Analyze profit margins by product.

**Endpoint:** `GET /protected/reports/profit-analysis`

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Premium Cigars",
      "sku": "CIG-001",
      "supplier_name": "Premium Tobacco Co",
      "times_ordered": 45,
      "total_quantity_sold": 4500,
      "current_price": 10.00,
      "total_revenue": 45000.00,
      "estimated_cost": 7.00,
      "estimated_profit": 13500.00,
      "margin_percentage": 30.00
    }
  ],
  "summary": {
    "total_revenue": 125000.00,
    "total_profit": 37500.00,
    "avg_margin": 30.00
  }
}
```

### Tax Summary Report
Generate tax calculations for a specific year.

**Endpoint:** `GET /protected/reports/tax-summary`

**Query Parameters:**
- `year` (optional): Year (default: current year)

**Response:**
```json
{
  "year": 2026,
  "monthly": [
    {
      "month": "Jan",
      "month_num": "01",
      "gross_sales": 50000.00,
      "sales_tax": 4000.00,
      "total_discounts": 2500.00,
      "net_revenue": 51500.00,
      "invoice_count": 150
    }
  ],
  "annual_totals": {
    "gross_sales": 500000.00,
    "sales_tax": 40000.00,
    "total_discounts": 25000.00,
    "net_revenue": 515000.00,
    "invoice_count": 1500
  }
}
```

### Year-over-Year Comparison
Compare current year performance to previous year.

**Endpoint:** `GET /protected/reports/yoy-comparison`

**Response:**
```json
{
  "current_year": {
    "year": 2026,
    "total_orders": 150,
    "unique_customers": 25,
    "revenue": 125000.00
  },
  "previous_year": {
    "year": 2025,
    "total_orders": 120,
    "unique_customers": 20,
    "revenue": 100000.00
  },
  "growth": {
    "orders": 25.00,
    "customers": 25.00,
    "revenue": 25.00
  }
}
```

---

## QuickBooks Integration API

### Connect to QuickBooks
Initiate OAuth flow to connect QuickBooks.

**Endpoint:** `GET /protected/quickbooks/connect`

**Response:**
```json
{
  "authUrl": "https://appcenter.intuit.com/connect/oauth2?...",
  "message": "Redirect user to this URL to authorize QuickBooks access",
  "note": "This is a mock implementation"
}
```

### OAuth Callback
Handle OAuth callback (called by QuickBooks).

**Endpoint:** `GET /protected/quickbooks/callback`

**Query Parameters:**
- `code`: Authorization code
- `realmId`: QuickBooks realm ID
- `state`: Security token

**Response:**
```json
{
  "success": true,
  "message": "QuickBooks connected successfully",
  "realm_id": "123456789"
}
```

### Trigger Full Sync
Start a full synchronization with QuickBooks.

**Endpoint:** `POST /protected/quickbooks/sync`

**Response:**
```json
{
  "success": true,
  "message": "Sync started",
  "sync_log_id": 1
}
```

### Get Sync Status
Check current synchronization status.

**Endpoint:** `GET /protected/quickbooks/status`

**Response:**
```json
{
  "connected": true,
  "status": "synced",
  "realm_id": "123456789",
  "last_sync": "2026-02-15T10:00:00Z",
  "token_expires_at": "2026-02-15T11:00:00Z",
  "recent_syncs": [
    {
      "id": 1,
      "sync_type": "full_sync",
      "status": "completed",
      "items_synced": 45,
      "last_sync": "2026-02-15T10:00:00Z"
    }
  ]
}
```

### Sync Orders to QuickBooks
Sync orders from last 30 days.

**Endpoint:** `POST /protected/quickbooks/sync-orders`

**Response:**
```json
{
  "success": true,
  "message": "Synced 25 orders to QuickBooks",
  "orders_synced": 25,
  "sync_log_id": 2
}
```

### Sync Customers to QuickBooks
Sync all customer (retailer) accounts.

**Endpoint:** `POST /protected/quickbooks/sync-customers`

**Response:**
```json
{
  "success": true,
  "message": "Synced 20 customers to QuickBooks",
  "customers_synced": 20
}
```

### Get Account Mappings
Retrieve chart of accounts mappings.

**Endpoint:** `GET /protected/quickbooks/mapping`

**Response:**
```json
{
  "mappings": [
    {
      "id": 1,
      "local_account": "Sales Revenue",
      "qb_account_id": "80",
      "qb_account_name": "Sales",
      "category": "revenue"
    }
  ],
  "categories": ["revenue", "expense", "asset", "liability", "equity"]
}
```

### Update Account Mapping
Create or update an account mapping.

**Endpoint:** `PUT /protected/quickbooks/mapping`

**Request:**
```json
{
  "local_account": "Sales Revenue",
  "qb_account_id": "80",
  "qb_account_name": "Sales",
  "category": "revenue"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mapping updated successfully"
}
```

### Get Reconciliation Data
View reconciliation status and discrepancies.

**Endpoint:** `GET /protected/quickbooks/reconciliation`

**Response:**
```json
{
  "last_reconciliation": "2026-02-15",
  "local_transactions": 156,
  "qb_transactions": 156,
  "matched": 150,
  "unmatched_local": 6,
  "unmatched_qb": 6,
  "discrepancies": [
    {
      "type": "missing_in_qb",
      "local_id": "ORD-123",
      "amount": 450.00,
      "date": "2026-02-10"
    },
    {
      "type": "amount_mismatch",
      "local_id": "ORD-145",
      "qb_id": "INV-998",
      "local_amount": 320.00,
      "qb_amount": 325.00,
      "difference": 5.00
    }
  ]
}
```

---

## Testing with cURL

### Test Email Notification
```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supplier@test.com","password":"password123"}' \
  | jq -r '.token')

# Send test email
curl -X POST http://localhost:4000/api/protected/notifications/email/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Generate Invoice
```bash
curl -X POST http://localhost:4000/api/protected/orders/1/invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "discount": 5,
    "taxRate": 0.08,
    "paymentTerms": "Net 30",
    "notes": "Thank you for your business"
  }'
```

### Get Supplier Analytics
```bash
curl http://localhost:4000/api/protected/suppliers/1/analytics \
  -H "Authorization: Bearer $TOKEN"
```

### Get Quarterly Revenue
```bash
curl "http://localhost:4000/api/protected/reports/quarterly?year=2026" \
  -H "Authorization: Bearer $TOKEN"
```

### Trigger QuickBooks Sync
```bash
curl -X POST http://localhost:4000/api/protected/quickbooks/sync \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider:
- 100 requests per minute per user
- 1000 requests per hour per user
- Separate limits for expensive operations (PDF generation, sync)

---

## Notes

- All mock implementations are marked as such in responses
- In production, replace mock email service with Nodemailer/SendGrid
- In production, replace mock QuickBooks with intuit-oauth package
- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in USD
- PDF generation currently returns plain text (implement PDFKit in production)
