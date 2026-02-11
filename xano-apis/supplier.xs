// Supplier CRUD API Endpoints
// Copy this to Xano's API group: erp

query "supplier" verb=GET {
  description = "Get all suppliers with pagination"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=20 filters=min:1|max:100 {
      description = "Items per page"
    }
    text search? filters=trim {
      description = "Search by name or email"
    }
  }
  
  stack {
    conditional {
      if ($input.search != null && ($input.search|strlen) > 0) {
        db.query "supplier" {
          where = ($db.supplier.name|to_lower)|contains:($input.search|to_lower) || ($db.supplier.email|to_lower)|contains:($input.search|to_lower)
          sort = {supplier.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $suppliers
      }
      else {
        db.query "supplier" {
          sort = {supplier.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $suppliers
      }
    }
  }
  
  response = $suppliers
}

query "supplier/{supplier_id}" verb=GET {
  description = "Get a single supplier by ID"
  
  input {
    int supplier_id {
      description = "Supplier ID"
    }
  }
  
  stack {
    db.get "supplier" {
      field_name = "id"
      field_value = $input.supplier_id
    } as $supplier
    
    precondition ($supplier != null) {
      error_type = "notfound"
      error = "Supplier not found"
    }
  }
  
  response = $supplier
}

query "supplier" verb=POST {
  description = "Create a new supplier"
  
  input {
    text name filters=trim|min:1 {
      description = "Supplier name"
    }
    email email filters=trim|lower {
      description = "Supplier email"
    }
    text phone? filters=trim {
      description = "Supplier phone"
    }
    text address? filters=trim {
      description = "Supplier address"
    }
  }
  
  stack {
    db.add "supplier" {
      data = {
        name: $input.name,
        email: $input.email,
        phone: $input.phone,
        address: $input.address,
        created_at: now
      }
    } as $new_supplier
  }
  
  response = $new_supplier
}

query "supplier/{supplier_id}" verb=PATCH {
  description = "Update a supplier"
  
  input {
    int supplier_id {
      description = "Supplier ID"
    }
    text name? filters=trim {
      description = "Supplier name"
    }
    email email? filters=trim|lower {
      description = "Supplier email"
    }
    text phone? filters=trim {
      description = "Supplier phone"
    }
    text address? filters=trim {
      description = "Supplier address"
    }
  }
  
  stack {
    db.get "supplier" {
      field_name = "id"
      field_value = $input.supplier_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Supplier not found"
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
      if ($input.email != null) {
        var.update $update_data { value = $update_data|set:"email":$input.email }
      }
    }
    conditional {
      if ($input.phone != null) {
        var.update $update_data { value = $update_data|set:"phone":$input.phone }
      }
    }
    conditional {
      if ($input.address != null) {
        var.update $update_data { value = $update_data|set:"address":$input.address }
      }
    }
    
    db.edit "supplier" {
      field_name = "id"
      field_value = $input.supplier_id
      data = $update_data
    } as $updated_supplier
  }
  
  response = $updated_supplier
}

query "supplier/{supplier_id}" verb=DELETE {
  description = "Delete a supplier"
  
  input {
    int supplier_id {
      description = "Supplier ID"
    }
  }
  
  stack {
    db.get "supplier" {
      field_name = "id"
      field_value = $input.supplier_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Supplier not found"
    }
    
    db.delete "supplier" {
      field_name = "id"
      field_value = $input.supplier_id
    }
  }
  
  response = {success: true, message: "Supplier deleted"}
}
