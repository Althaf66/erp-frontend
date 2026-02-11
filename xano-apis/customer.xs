// Customer CRUD API Endpoints
// Copy this to Xano's API group: erp

query "customer" verb=GET {
  description = "Get all customers with pagination"
  
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
        db.query "customer" {
          where = ($db.customer.name|to_lower)|contains:($input.search|to_lower) || ($db.customer.email|to_lower)|contains:($input.search|to_lower)
          sort = {customer.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $customers
      }
      else {
        db.query "customer" {
          sort = {customer.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $customers
      }
    }
  }
  
  response = $customers
}

query "customer/{customer_id}" verb=GET {
  description = "Get a single customer by ID"
  
  input {
    int customer_id {
      description = "Customer ID"
    }
  }
  
  stack {
    db.get "customer" {
      field_name = "id"
      field_value = $input.customer_id
    } as $customer
    
    precondition ($customer != null) {
      error_type = "notfound"
      error = "Customer not found"
    }
  }
  
  response = $customer
}

query "customer" verb=POST {
  description = "Create a new customer"
  
  input {
    text name filters=trim|min:1 {
      description = "Customer name"
    }
    email email filters=trim|lower {
      description = "Customer email"
    }
    text phone? filters=trim {
      description = "Customer phone"
    }
    text address? filters=trim {
      description = "Customer address"
    }
  }
  
  stack {
    db.add "customer" {
      data = {
        name: $input.name,
        email: $input.email,
        phone: $input.phone,
        address: $input.address,
        created_at: now
      }
    } as $new_customer
  }
  
  response = $new_customer
}

query "customer/{customer_id}" verb=PATCH {
  description = "Update a customer"
  
  input {
    int customer_id {
      description = "Customer ID"
    }
    text name? filters=trim {
      description = "Customer name"
    }
    email email? filters=trim|lower {
      description = "Customer email"
    }
    text phone? filters=trim {
      description = "Customer phone"
    }
    text address? filters=trim {
      description = "Customer address"
    }
  }
  
  stack {
    db.get "customer" {
      field_name = "id"
      field_value = $input.customer_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Customer not found"
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
    
    db.edit "customer" {
      field_name = "id"
      field_value = $input.customer_id
      data = $update_data
    } as $updated_customer
  }
  
  response = $updated_customer
}

query "customer/{customer_id}" verb=DELETE {
  description = "Delete a customer"
  
  input {
    int customer_id {
      description = "Customer ID"
    }
  }
  
  stack {
    db.get "customer" {
      field_name = "id"
      field_value = $input.customer_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Customer not found"
    }
    
    db.delete "customer" {
      field_name = "id"
      field_value = $input.customer_id
    }
  }
  
  response = {success: true, message: "Customer deleted"}
}
