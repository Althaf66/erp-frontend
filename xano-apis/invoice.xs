// Invoice CRUD API Endpoints
// Copy this to Xano's API group: erp

query "invoice" verb=GET {
  description = "Get all invoices with pagination"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=20 filters=min:1|max:100 {
      description = "Items per page"
    }
    text status? filters=trim {
      description = "Filter by status (draft, sent, paid, overdue, cancelled)"
    }
    int customer_id? {
      description = "Filter by customer ID"
    }
  }
  
  stack {
    conditional {
      if ($input.status != null && ($input.status|strlen) > 0) {
        db.query "invoice" {
          where = $db.invoice.status == $input.status
          sort = {invoice.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $invoices
      }
      elseif ($input.customer_id != null) {
        db.query "invoice" {
          where = $db.invoice.customer_id == $input.customer_id
          sort = {invoice.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $invoices
      }
      else {
        db.query "invoice" {
          sort = {invoice.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $invoices
      }
    }
  }
  
  response = $invoices
}

query "invoice/{invoice_id}" verb=GET {
  description = "Get a single invoice by ID with details"
  
  input {
    int invoice_id {
      description = "Invoice ID"
    }
  }
  
  stack {
    db.get "invoice" {
      field_name = "id"
      field_value = $input.invoice_id
    } as $invoice
    
    precondition ($invoice != null) {
      error_type = "notfound"
      error = "Invoice not found"
    }
    
    db.get "customer" {
      field_name = "id"
      field_value = $invoice.customer_id
    } as $customer
    
    db.get "order" {
      field_name = "id"
      field_value = $invoice.order_id
    } as $order
    
    var $result {
      value = $invoice|set:"customer":$customer|set:"order":$order
    }
  }
  
  response = $result
}

query "invoice" verb=POST {
  description = "Create a new invoice"
  
  input {
    int customer_id {
      description = "Customer ID"
    }
    int order_id? {
      description = "Associated order ID (optional)"
    }
    decimal amount filters=min:0 {
      description = "Invoice amount"
    }
    decimal tax?=0 filters=min:0 {
      description = "Tax amount"
    }
    timestamp due_date {
      description = "Payment due date"
    }
    text notes? filters=trim {
      description = "Invoice notes"
    }
  }
  
  stack {
    db.get "customer" {
      field_name = "id"
      field_value = $input.customer_id
    } as $customer
    
    precondition ($customer != null) {
      error_type = "inputerror"
      error = "Customer not found"
    }
    
    var $total {
      value = $input.amount + $input.tax
    }
    
    // Generate invoice number
    db.query "invoice" {
      sort = {invoice.id: "desc"}
      return = {type: "list", paging: {page: 1, per_page: 1}}
    } as $last_invoice
    
    var $invoice_number {
      value = "INV-" ~ (now|format_date:"Ymd") ~ "-" ~ (($last_invoice|count) > 0 ? ($last_invoice|first|get:"id" + 1) : 1)
    }
    
    db.add "invoice" {
      data = {
        invoice_number: $invoice_number,
        customer_id: $input.customer_id,
        order_id: $input.order_id,
        amount: $input.amount,
        tax: $input.tax,
        total: $total,
        status: "draft",
        due_date: $input.due_date,
        notes: $input.notes,
        invoice_date: now,
        created_at: now
      }
    } as $new_invoice
  }
  
  response = $new_invoice
}

query "invoice/{invoice_id}" verb=PATCH {
  description = "Update an invoice"
  
  input {
    int invoice_id {
      description = "Invoice ID"
    }
    text status? filters=trim {
      description = "Invoice status"
    }
    decimal amount? filters=min:0 {
      description = "Invoice amount"
    }
    decimal tax? filters=min:0 {
      description = "Tax amount"
    }
    timestamp due_date? {
      description = "Payment due date"
    }
    text notes? filters=trim {
      description = "Invoice notes"
    }
  }
  
  stack {
    db.get "invoice" {
      field_name = "id"
      field_value = $input.invoice_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Invoice not found"
    }
    
    var $update_data {
      value = {}
    }
    
    conditional {
      if ($input.status != null) {
        var.update $update_data { value = $update_data|set:"status":$input.status }
      }
    }
    conditional {
      if ($input.amount != null) {
        var.update $update_data { value = $update_data|set:"amount":$input.amount }
        var $new_total {
          value = $input.amount + ($input.tax != null ? $input.tax : $existing.tax)
        }
        var.update $update_data { value = $update_data|set:"total":$new_total }
      }
    }
    conditional {
      if ($input.tax != null) {
        var.update $update_data { value = $update_data|set:"tax":$input.tax }
        var $new_total {
          value = ($input.amount != null ? $input.amount : $existing.amount) + $input.tax
        }
        var.update $update_data { value = $update_data|set:"total":$new_total }
      }
    }
    conditional {
      if ($input.due_date != null) {
        var.update $update_data { value = $update_data|set:"due_date":$input.due_date }
      }
    }
    conditional {
      if ($input.notes != null) {
        var.update $update_data { value = $update_data|set:"notes":$input.notes }
      }
    }
    
    db.edit "invoice" {
      field_name = "id"
      field_value = $input.invoice_id
      data = $update_data
    } as $updated_invoice
  }
  
  response = $updated_invoice
}

query "invoice/{invoice_id}" verb=DELETE {
  description = "Delete an invoice"
  
  input {
    int invoice_id {
      description = "Invoice ID"
    }
  }
  
  stack {
    db.get "invoice" {
      field_name = "id"
      field_value = $input.invoice_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Invoice not found"
    }
    
    db.delete "invoice" {
      field_name = "id"
      field_value = $input.invoice_id
    }
  }
  
  response = {success: true, message: "Invoice deleted"}
}
