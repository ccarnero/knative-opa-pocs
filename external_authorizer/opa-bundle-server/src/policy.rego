package authorization

default allow = false

allow = true {
    role = input.subject.roles[_] # // each role
    print("roles: ", role)
    role == "sales" # // allow = true if role matches "admin"
}

# allow {
#     print("http_request.method", http_request.method)
#     print("http_request.req_method", http_request.req_method)

#     http_request.method == "POST"
# }
