use std::str::{self};

extern crate actix_web;

use actix_web::http::Method;

use actix_web::web::Bytes;
use actix_web::{ HttpServer, web, App, HttpRequest, HttpResponse };
use serde_json::Value;

mod types;
use crate::types::EchoBody;

pub async fn echo(
    request: HttpRequest,
    req_method: Method,
    payload: Bytes
) -> HttpResponse {

    let mut hds = serde_json::Map::new(); // HashMap::new();
    for h in request.headers() {
        hds.insert(
            h.0.to_string(),
            Value::from(h.1.to_str().unwrap())
        );
    }
    let headers = Value::Object(hds);

    // let v = serde_json::json!({ "an": "object" });
    let pl =str::from_utf8(&payload).map(|v| if v != "" { v } else { "{}" }).unwrap().to_string();
    let body: serde_json::Value = serde_json::from_str(&pl).unwrap();    
    let response: EchoBody = EchoBody { 
        query: request.query_string().to_string(), 
        body: body,
        path: request.path().to_string(), 
        params: request.query_string().to_string(), 
        headers,
        method: req_method.to_string() 
    };
    log::info!("{:?}", response);
    HttpResponse::Ok()
        .content_type("application/json")
        .json(response)
}

async fn healthz() -> HttpResponse {
    HttpResponse::Ok().body("ok")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(|| {
        App::new()
        .route("/healthz", web::get().to(healthz))
        .default_service(web::to(echo))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
