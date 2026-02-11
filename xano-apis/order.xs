// Order CRUD API Endpoints
// Copy this to Xano's API group: erp

query "order" verb=GET {
  description = "Get all orders with pagination"
  
  input {
    int page?=1 filters=min:1 {
      description = "Page number"
    }
    int per_page?=20 filters=min:1|max:100 {
      description = "Items per page"
    }
    text status? filters=trim {
      description = "Filter by status (pending, confirmed, shipped, delivered, cancelled)"
    }
    int customer_id? {
      description = "Filter by customer ID"
    }
  }
  
  stack {
    conditional {
      if ($input.status != null && ($input.status|strlen) > 0) {
        db.query "order" {
          where = $db.order.status == $input.status
          sort = {order.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
          addon = [{name: "customer", input: {customer_id: $output.customer_id}, as: "items.customer"}]
        } as $orders
      }
      elseif ($input.customer_id != null) {
        db.query "order" {
          where = $db.order.customer_id == $input.customer_id
          sort = {order.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
          addon = [{name: "customer", input: {customer_id: $output.customer_id}, as: "items.customer"}]
        } as $orders
      }
      else {
        db.query "order" {
          sort = {order.created_at: "desc"}
          return = {type: "list", paging: {page: $input.page, per_page: $input.per_page, totals: true}}
          addon = [{name: "customer", input: {customer_id: $output.customer_id}, as: "items.customer"}]
        } as $orders
      }
    }
  }
  
  response = $orders
}

query "order/{order_id}" verb=GET {
  description = "Get a single order by ID with items"
  
  input {
    int order_id {
      description = "Order ID"
    }
  }
  
  stack {
    db.get "order" {
      field_name = "id"
      field_value = $input.order_id
    } as $order
    
    precondition ($order != null) {
      error_type = "notfound"
      error = "Order not found"
    }
    
    db.get "customer" {
      field_name = "id"
      field_value = $order.customer_id
    } as $customer
    
    db.query "order_item" {
      where = $db.order_item.order_id == $input.order_id
      return = {type: "list"}
    } as $order_items
    
    var $result {
      value = $order|set:"customer":$customer|set:"items":$order_items
    }
  }
  
  response = $result
}

query "order" verb=POST {
  description = "Create a new order"
  
  input {
    int customer_id {
      description = "Customer ID"
    }
    json items {
      description = "Array of order items: [{item_id, quantity, price}]"
    }
    text notes? filters=trim {
      description = "Order notes"
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
      value = 0
    }
    
    foreach $input.items as $item {
      math.add $total {
        value = $item.quantity * $item.price
      }
    }
    
    db.add "order" {
      data = {
        customer_id: $input.customer_id,
        total: $total,
        status: "pending",
        notes: $input.notes,
        order_date: now,
        created_at: now
      }
    } as $new_order
    
    foreach $input.items as $item {
      db.add "order_item" {
        data = {
          order_id: $new_order.id,
          item_id: $item.item_id,
          quantity: $item.quantity,
          price: $item.price,
          subtotal: $item.quantity * $item.price
        }
      }
    }
  }
  
  response = $new_order
}

query "order/{order_id}" verb=PATCH {
  description = "Update an order"
  
  input {
    int order_id {
      description = "Order ID"
    }
    text status? filters=trim {
      description = "Order status"
    }
    text notes? filters=trim {
      description = "Order notes"
    }
  }
  
  stack {
    db.get "order" {
      field_name = "id"
      field_value = $input.order_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Order not found"
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
    
    db.edit "order" {
      field_name = "id"
      field_value = $input.order_id
      data = $update_data
    } as $updated_order
  }
  
  response = $updated_order
}

query "order/{order_id}" verb=DELETE {
  description = "Delete an order"
  
  input {
    int order_id {
      description = "Order ID"
    }
  }
  
  stack {
    db.get "order" {
      field_name = "id"
      field_value = $input.order_id
    } as $existing
    
    precondition ($existing != null) {
      error_type = "notfound"
      error = "Order not found"
    }
    
    // Delete order items first
    db.query "order_item" {
      where = $db.order_item.order_id == $input.order_id
      return = {type: "list"}
    } as $order_items
    
    foreach $order_items as $oi {
      db.delete "order_item" {
        field_name = "id"
        field_value = $oi.id
      }
    }
    
    db.delete "order" {
      field_name = "id"
      field_value = $input.order_id
    }
  }
  
  response = {success: true, message: "Order deleted"}
}
