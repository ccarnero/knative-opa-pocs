
use serde::{Serialize};
use serde_json::{Value};
#[derive(Debug, Serialize, Clone)]
pub struct EchoBody {
    pub query: String,
    pub body: Value,
    pub path: String,
    pub params: String,
    pub headers: Value,
    pub method: String
}

