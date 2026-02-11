// Expense CRUD API Endpoints
// Copy this to Xano's API group: erp

query "expense" verb=GET {
  description = "Get all expenses with pagination"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=20 filters=min:1|max:100 {
      description = "Items per page"
    }
    text category? filters=trim {
      description = "Filter by category"
    }
  }
  
  stack {
    conditional {
      if ($input.category != null && ($input.category|strlen) > 0) {
        db.query "expense" {
          where = ($db.expense.category|to_lower) == ($input.category|to_lower)
          sort = {expense.expense_date: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $expenses
      }
      else {
        db.query "expense" {
          sort = {expense.expense_date: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $expenses
      }
    }
  }
  
  response = $expenses
}

query "expense/{expense_id}" verb=GET {
  description = "Get a single expense by ID"
  
  input {
    int expense_id {
      description = "Expense ID"
    }
  }
  
  stack {
    db.get "expense" {
      field_name = "id"
      field_value = $input.expense_id
    } as $expense
    
    precondition ($expense != null) {
      error_type = "notfound"
      error = "Expense not found"
    }
  }
  
  response = $expense
}

query "expense" verb=POST {
  description = "Create a new expense"
  
  input {
    text description filters=trim|min:1 {
      description = "Expense description"
    }
    decimal amount filters=min:0 {
      description = "Expense amount"
    }
    text category filters=trim|min:1 {
      description = "Expense category (utilities, rent, salaries, supplies, marketing, other)"
    }
    timestamp expense_date?=now {
      description = "Date of expense"
    }
    text notes? filters=trim {
      description = "Additional notes"
    }
  }
  
  stack {
    db.add "expense" {
      data = {
        description: $input.description,
        amount: $input.amount,
        category: $input.category,
        expense_date: $input.expense_date,
        notes: $input.notes,
        created_at: now
      }
    } as $new_expense
  }
  
  response = $new_expense
}

query "expense/{expense_id}" verb=PATCH {
  description = "Update an expense"
  
  input {
    int expense_id {
      description = "Expense ID"
    }
    text description? filters=trim {
      description = "Expense description"
    }
    decimal amount? filters=min:0 {
      description = "Expense amount"
    }
    text category? filters=trim {
      description = "Expense category"
    }
    timestamp expense_date? {
      description = "Date of expense"
    }
    text notes? filters=trim {
      description = "Additional notes"
    }
  }
  
  stack {
    db.get "expense" {
      field_name = "id"
      field_value = $input.expense_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Expense not found"
    }
    
    var $update_data {
      value = {}
    }
    
    conditional {
      if ($input.description != null) {
        var.update $update_data { value = $update_data|set:"description":$input.description }
      }
    }
    conditional {
      if ($input.amount != null) {
        var.update $update_data { value = $update_data|set:"amount":$input.amount }
      }
    }
    conditional {
      if ($input.category != null) {
        var.update $update_data { value = $update_data|set:"category":$input.category }
      }
    }
    conditional {
      if ($input.expense_date != null) {
        var.update $update_data { value = $update_data|set:"expense_date":$input.expense_date }
      }
    }
    conditional {
      if ($input.notes != null) {
        var.update $update_data { value = $update_data|set:"notes":$input.notes }
      }
    }
    
    db.edit "expense" {
      field_name = "id"
      field_value = $input.expense_id
      data = $update_data
    } as $updated_expense
  }
  
  response = $updated_expense
}

query "expense/{expense_id}" verb=DELETE {
  description = "Delete an expense"
  
  input {
    int expense_id {
      description = "Expense ID"
    }
  }
  
  stack {
    db.get "expense" {
      field_name = "id"
      field_value = $input.expense_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Expense not found"
    }
    
    db.delete "expense" {
      field_name = "id"
      field_value = $input.expense_id
    }
  }
  
  response = {success: true, message: "Expense deleted"}
}
