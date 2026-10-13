# Security Requirements


## Authentication


- All private API routes require a valid Clerk Bearer JWT token.
- Verify JWT tokens server-side using Clerk JWKS public keys on every protected request.
- Reject unauthenticated, malformed, or expired tokens with HTTP 401 Unauthorized.


## Authorization


- Users can only access their own database connections, query histories, and saved bookmarks.
- Enforce strict tenant isolation so users cannot view or query databases configured by other accounts.


## Secrets


- Never expose LLM provider API keys (Groq, OpenRouter) to client-side code.
- Never return target database passwords or raw connection strings to the frontend.
- Store all server secrets in protected server-side environment variables (`.env`).


## Database Access


- Connect to target databases using read-only database roles and credentials whenever possible.
- Enforce mandatory SSL/TLS encryption (`sslmode=require`) for all cloud-hosted databases (Neon, Supabase, RDS).
- Enforce transaction rollback after each query execution to prevent state mutations.
- Enforce query execution timeouts (maximum 10 seconds) to prevent Denial of Service (DoS) from heavy queries.


## SQL Execution & Guardrails


- Parse every generated query's Abstract Syntax Tree (AST) using `sqlglot` prior to execution.
- Strictly allow only `SELECT` statements.
- Block all DDL and DML operations:
  - `INSERT`
  - `UPDATE`
  - `DELETE`
  - `DROP`
  - `ALTER`
  - `TRUNCATE`
- Reject multi-statement and semicolon-stacked SQL queries to eliminate SQL injection vectors.
- Automatically enforce query row limits (default `LIMIT 100`) on all executed queries.


## Input


- Validate all user prompts and database connection parameters before processing.
- Restrict natural language input length to prevent LLM prompt injection and token overflow attacks.


## APIs


- Validate all request payloads, query parameters, and path variables using Pydantic v2 models.
- Sanitize database error messages and stack traces to avoid leaking internal schema details to the client.
- Enforce Cross-Origin Resource Sharing (CORS) rules to only permit authorized frontend origins.


## Data Export


- Sanitize exported CSV content to prevent CSV formula injection (neutralize cells starting with `=`, `+`, `-`, or `@`).
- Restrict export endpoints to authenticated users who initiated the original query.
