// Purchase CRUD API Endpoints
// Copy this to Xano's API group: erp

query "purchase" verb=GET {
  description = "Get all purchases with pagination"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=20 filters=min:1|max:100 {
      description = "Items per page"
    }
    text status? filters=trim {
      description = "Filter by status (pending, ordered, received, cancelled)"
    }
    int supplier_id? {
      description = "Filter by supplier ID"
    }
  }
  
  stack {
    conditional {
      if ($input.status != null && ($input.status|strlen) > 0) {
        db.query "purchase" {
          where = $db.purchase.status == $input.status
          sort = {purchase.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $purchases
      }
      elseif ($input.supplier_id != null) {
        db.query "purchase" {
          where = $db.purchase.supplier_id == $input.supplier_id
          sort = {purchase.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $purchases
      }
      else {
        db.query "purchase" {
          sort = {purchase.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $purchases
      }
    }
  }
  
  response = $purchases
}

query "purchase/{purchase_id}" verb=GET {
  description = "Get a single purchase by ID with items"
  
  input {
    int purchase_id {
      description = "Purchase ID"
    }
  }
  
  stack {
    db.get "purchase" {
      field_name = "id"
      field_value = $input.purchase_id
    } as $purchase
    
    precondition ($purchase != null) {
      error_type = "notfound"
      error = "Purchase not found"
    }
    
    db.get "supplier" {
      field_name = "id"
      field_value = $purchase.supplier_id
    } as $supplier
    
    db.query "purchase_item" {
      where = $db.purchase_item.purchase_id == $input.purchase_id
      return = {type: "list"}
    } as $purchase_items
    
    var $result {
      value = $purchase|set:"supplier":$supplier|set:"items":$purchase_items
    }
  }
  
  response = $result
}

query "purchase" verb=POST {
  description = "Create a new purchase"
  
  input {
    int supplier_id {
      description = "Supplier ID"
    }
    json items {
      description = "Array of purchase items: [{item_id, quantity, cost}]"
    }
    text notes? filters=trim {
      description = "Purchase notes"
    }
  }
  
  stack {
    db.get "supplier" {
      field_name = "id"
      field_value = $input.supplier_id
    } as $supplier
    
    precondition ($supplier != null) {
      error_type = "inputerror"
      error = "Supplier not found"
    }
    
    var $total {
      value = 0
    }
    
    foreach $input.items as $item {
      math.add $total {
        value = $item.quantity * $item.cost
      }
    }
    
    db.add "purchase" {
      data = {
        supplier_id: $input.supplier_id,
        total: $total,
        status: "pending",
        notes: $input.notes,
        purchase_date: now,
        created_at: now
      }
    } as $new_purchase
    
    foreach $input.items as $item {
      db.add "purchase_item" {
        data = {
          purchase_id: $new_purchase.id,
          item_id: $item.item_id,
          quantity: $item.quantity,
          cost: $item.cost,
          subtotal: $item.quantity * $item.cost
        }
      }
    }
  }
  
  response = $new_purchase
}

query "purchase/{purchase_id}" verb=PATCH {
  description = "Update a purchase"
  
  input {
    int purchase_id {
      description = "Purchase ID"
    }
    text status? filters=trim {
      description = "Purchase status"
    }
    text notes? filters=trim {
      description = "Purchase notes"
    }
  }
  
  stack {
    db.get "purchase" {
      field_name = "id"
      field_value = $input.purchase_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Purchase not found"
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
      if ($input.notes != null) {
        var.update $update_data { value = $update_data|set:"notes":$input.notes }
      }
    }
    
    db.edit "purchase" {
      field_name = "id"
      field_value = $input.purchase_id
      data = $update_data
    } as $updated_purchase
  }
  
  response = $updated_purchase
}

query "purchase/{purchase_id}" verb=DELETE {
  description = "Delete a purchase"
  
  input {
    int purchase_id {
      description = "Purchase ID"
    }
  }
  
  stack {
    db.get "purchase" {
      field_name = "id"
      field_value = $input.purchase_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Purchase not found"
    }
    
    // Delete purchase items first
    db.query "purchase_item" {
      where = $db.purchase_item.purchase_id == $input.purchase_id
      return = {type: "list"}
    } as $purchase_items
    
    foreach $purchase_items as $pi {
      db.delete "purchase_item" {
        field_name = "id"
        field_value = $pi.id
      }
    }
    
    db.delete "purchase" {
      field_name = "id"
      field_value = $input.purchase_id
    }
  }
  
  response = {success: true, message: "Purchase deleted"}
}
