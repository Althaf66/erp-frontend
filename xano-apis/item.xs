// Item/Inventory CRUD API Endpoints
// Copy this to Xano's API group: erp

query "item" verb=GET {
  description = "Get all items with pagination"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=20 filters=min:1|max:100 {
      description = "Items per page"
    }
    text search? filters=trim {
      description = "Search by name or SKU"
    }
    text category? filters=trim {
      description = "Filter by category"
    }
  }
  
  stack {
    conditional {
      if ($input.search != null && ($input.search|strlen) > 0) {
        db.query "item" {
          where = ($db.item.name|to_lower)|contains:($input.search|to_lower) || ($db.item.sku|to_lower)|contains:($input.search|to_lower)
          sort = {item.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $items
      }
      elseif ($input.category != null && ($input.category|strlen) > 0) {
        db.query "item" {
          where = ($db.item.category|to_lower) == ($input.category|to_lower)
          sort = {item.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $items
      }
      else {
        db.query "item" {
          sort = {item.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $items
      }
    }
  }
  
  response = $items
}

query "item/{item_id}" verb=GET {
  description = "Get a single item by ID"
  
  input {
    int item_id {
      description = "Item ID"
    }
  }
  
  stack {
    db.get "item" {
      field_name = "id"
      field_value = $input.item_id
    } as $item
    
    precondition ($item != null) {
      error_type = "notfound"
      error = "Item not found"
    }
  }
  
  response = $item
}

query "item" verb=POST {
  description = "Create a new item"
  
  input {
    text name filters=trim|min:1 {
      description = "Item name"
    }
    text sku filters=trim|min:1 {
      description = "Stock Keeping Unit"
    }
    text category? filters=trim {
      description = "Item category"
    }
    decimal price filters=min:0 {
      description = "Item price"
    }
    decimal cost?=0 filters=min:0 {
      description = "Item cost"
    }
    int stock?=0 filters=min:0 {
      description = "Current stock quantity"
    }
    text unit?="pcs" filters=trim {
      description = "Unit of measurement"
    }
  }
  
  stack {
    db.add "item" {
      data = {
        name: $input.name,
        sku: $input.sku,
        category: $input.category,
        price: $input.price,
        cost: $input.cost,
        stock: $input.stock,
        unit: $input.unit,
        created_at: now
      }
    } as $new_item
  }
  
  response = $new_item
}

query "item/{item_id}" verb=PATCH {
  description = "Update an item"
  
  input {
    int item_id {
      description = "Item ID"
    }
    text name? filters=trim {
      description = "Item name"
    }
    text sku? filters=trim {
      description = "Stock Keeping Unit"
    }
    text category? filters=trim {
      description = "Item category"
    }
    decimal price? filters=min:0 {
      description = "Item price"
    }
    decimal cost? filters=min:0 {
      description = "Item cost"
    }
    int stock? filters=min:0 {
      description = "Current stock quantity"
    }
    text unit? filters=trim {
      description = "Unit of measurement"
    }
  }
  
  stack {
    db.get "item" {
      field_name = "id"
      field_value = $input.item_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Item not found"
    }
    
    var $update_data {
      value = {}
    }
    
    conditional {
      if ($input.name != null) {
        var.update $update_data { value = $update_data|set:"name":$input.name }
      }
    }
    conditional {
      if ($input.sku != null) {
        var.update $update_data { value = $update_data|set:"sku":$input.sku }
      }
    }
    conditional {
      if ($input.category != null) {
        var.update $update_data { value = $update_data|set:"category":$input.category }
      }
    }
    conditional {
      if ($input.price != null) {
        var.update $update_data { value = $update_data|set:"price":$input.price }
      }
    }
    conditional {
      if ($input.cost != null) {
        var.update $update_data { value = $update_data|set:"cost":$input.cost }
      }
    }
    conditional {
      if ($input.stock != null) {
        var.update $update_data { value = $update_data|set:"stock":$input.stock }
      }
    }
    conditional {
      if ($input.unit != null) {
        var.update $update_data { value = $update_data|set:"unit":$input.unit }
      }
    }
    
    db.edit "item" {
      field_name = "id"
      field_value = $input.item_id
      data = $update_data
    } as $updated_item
  }
  
  response = $updated_item
}

query "item/{item_id}" verb=DELETE {
  description = "Delete an item"
  
  input {
    int item_id {
      description = "Item ID"
    }
  }
  
  stack {
    db.get "item" {
      field_name = "id"
      field_value = $input.item_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Item not found"
    }
    
    db.delete "item" {
      field_name = "id"
      field_value = $input.item_id
    }
  }
  
  response = {success: true, message: "Item deleted"}
}
