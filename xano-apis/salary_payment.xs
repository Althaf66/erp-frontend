// Salary Payment CRUD API Endpoints
// Copy this to Xano's API group: erp

query "salary_payment" verb=GET {
  description = "Get salary payments with optional employee filter"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=50 filters=min:1|max:100 {
      description = "Items per page"
    }
    int employee_id? {
      description = "Filter by employee ID"
    }
  }
  
  stack {
    conditional {
      if ($input.employee_id != null && $input.employee_id > 0) {
        db.query "salary_payment" {
          where = $db.salary_payment.employee_id == $input.employee_id
          sort = {salary_payment.payment_date: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $payments
      }
      else {
        db.query "salary_payment" {
          sort = {salary_payment.payment_date: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
        } as $payments
      }
    }
  }
  
  response = $payments
}

query "salary_payment" verb=POST {
  description = "Record a new salary payment"
  
  input {
    int employee_id {
      description = "Employee ID"
    }
    decimal amount filters=min:0 {
      description = "Payment amount"
    }
    text payment_date? {
      description = "Payment date (YYYY-MM-DD)"
    }
    text payment_method?="bank" filters=trim {
      description = "Payment method (bank, cash, upi, cheque)"
    }
    text month? filters=trim {
      description = "Salary month name"
    }
    int year? {
      description = "Salary year"
    }
    text notes? filters=trim {
      description = "Payment notes"
    }
  }
  
  stack {
    // Verify employee exists
    db.get "employee" {
      field_name = "id"
      field_value = $input.employee_id
    } as $employee
    
    precondition ($employee != null) {
      error_type = "notfound"
      error = "Employee not found"
    }
    
    db.add "salary_payment" {
      data = {
        employee_id: $input.employee_id,
        employee_name: $employee.name,
        amount: $input.amount,
        payment_date: $input.payment_date,
        payment_method: $input.payment_method,
        month: $input.month,
        year: $input.year,
        notes: $input.notes,
        created_at: now
      }
    } as $new_payment
  }
  
  response = $new_payment
}

query "salary_payment/{payment_id}" verb=DELETE {
  description = "Delete a salary payment record"
  
  input {
    int payment_id {
      description = "Salary Payment ID"
    }
  }
  
  stack {
    db.get "salary_payment" {
      field_name = "id"
      field_value = $input.payment_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Salary payment not found"
    }
    
    db.delete "salary_payment" {
      field_name = "id"
      field_value = $input.payment_id
    }
  }
  
  response = {success: true, message: "Salary payment deleted"}
}
