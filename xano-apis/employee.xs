// Employee CRUD API Endpoints
// Copy this to Xano's API group: erp

query "employee" verb=GET {
  description = "Get all employees with pagination"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=20 filters=min:1|max:100 {
      description = "Items per page"
    }
    text search? filters=trim {
      description = "Search by name, email, or department"
    }
  }
  
  stack {
    conditional {
      if ($input.search != null && ($input.search|strlen) > 0) {
        db.query "employee" {
          where = ($db.employee.name|to_lower)|contains:($input.search|to_lower) || ($db.employee.email|to_lower)|contains:($input.search|to_lower) || ($db.employee.department|to_lower)|contains:($input.search|to_lower)
          sort = {employee.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $employees
      }
      else {
        db.query "employee" {
          sort = {employee.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $employees
      }
    }
  }
  
  response = $employees
}

query "employee/{employee_id}" verb=GET {
  description = "Get a single employee by ID"
  
  input {
    int employee_id {
      description = "Employee ID"
    }
  }
  
  stack {
    db.get "employee" {
      field_name = "id"
      field_value = $input.employee_id
    } as $employee
    
    precondition ($employee != null) {
      error_type = "notfound"
      error = "Employee not found"
    }
  }
  
  response = $employee
}

query "employee" verb=POST {
  description = "Create a new employee"
  
  input {
    text name filters=trim|min:1 {
      description = "Employee full name"
    }
    email email filters=trim|lower {
      description = "Employee email"
    }
    text phone? filters=trim {
      description = "Employee phone"
    }
    text department? filters=trim {
      description = "Department name"
    }
    text designation? filters=trim {
      description = "Job designation/title"
    }
    text date_of_joining? {
      description = "Date of joining (YYYY-MM-DD)"
    }
    decimal monthly_salary?=0 {
      description = "Monthly salary amount"
    }
    text bank_account? filters=trim {
      description = "Bank account details"
    }
    text address? filters=trim {
      description = "Employee address"
    }
  }
  
  stack {
    db.add "employee" {
      data = {
        name: $input.name,
        email: $input.email,
        phone: $input.phone,
        department: $input.department,
        designation: $input.designation,
        date_of_joining: $input.date_of_joining,
        monthly_salary: $input.monthly_salary,
        bank_account: $input.bank_account,
        address: $input.address,
        created_at: now
      }
    } as $new_employee
  }
  
  response = $new_employee
}

query "employee/{employee_id}" verb=PATCH {
  description = "Update an employee"
  
  input {
    int employee_id {
      description = "Employee ID"
    }
    text name? filters=trim {
      description = "Employee full name"
    }
    email email? filters=trim|lower {
      description = "Employee email"
    }
    text phone? filters=trim {
      description = "Employee phone"
    }
    text department? filters=trim {
      description = "Department name"
    }
    text designation? filters=trim {
      description = "Job designation/title"
    }
    text date_of_joining? {
      description = "Date of joining"
    }
    decimal monthly_salary? {
      description = "Monthly salary amount"
    }
    text bank_account? filters=trim {
      description = "Bank account details"
    }
    text address? filters=trim {
      description = "Employee address"
    }
  }
  
  stack {
    db.get "employee" {
      field_name = "id"
      field_value = $input.employee_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Employee not found"
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
      if ($input.department != null) {
        var.update $update_data { value = $update_data|set:"department":$input.department }
      }
    }
    conditional {
      if ($input.designation != null) {
        var.update $update_data { value = $update_data|set:"designation":$input.designation }
      }
    }
    conditional {
      if ($input.date_of_joining != null) {
        var.update $update_data { value = $update_data|set:"date_of_joining":$input.date_of_joining }
      }
    }
    conditional {
      if ($input.monthly_salary != null) {
        var.update $update_data { value = $update_data|set:"monthly_salary":$input.monthly_salary }
      }
    }
    conditional {
      if ($input.bank_account != null) {
        var.update $update_data { value = $update_data|set:"bank_account":$input.bank_account }
      }
    }
    conditional {
      if ($input.address != null) {
        var.update $update_data { value = $update_data|set:"address":$input.address }
      }
    }
    
    db.edit "employee" {
      field_name = "id"
      field_value = $input.employee_id
      data = $update_data
    } as $updated_employee
  }
  
  response = $updated_employee
}

query "employee/{employee_id}" verb=DELETE {
  description = "Delete an employee"
  
  input {
    int employee_id {
      description = "Employee ID"
    }
  }
  
  stack {
    db.get "employee" {
      field_name = "id"
      field_value = $input.employee_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Employee not found"
    }
    
    // Also delete related salary payments
    db.query "salary_payment" {
      where = $db.salary_payment.employee_id == $input.employee_id
      return = {type: "list"}
    } as $related_payments
    
    foreach $related_payments as $payment {
      db.delete "salary_payment" {
        field_name = "id"
        field_value = $payment.id
      }
    }
    
    db.delete "employee" {
      field_name = "id"
      field_value = $input.employee_id
    }
  }
  
  response = {success: true, message: "Employee deleted"}
}
