# Development Rules


## General


- Use TypeScript for all frontend code.
- Use Python 3.11+ with strict type hints and Pydantic v2 schemas for backend code.
- Keep functions small, focused, and single-responsibility.
- Reuse existing components, hooks, and agent utilities.
- Do not duplicate logic across the codebase.
- Do not modify unrelated files during a task.


## Before Coding


- Read relevant documentation (PRD.md and ARCHITECTURE.md).
- Inspect existing implementations and established patterns before adding new code.
- Reuse existing tools, schema helpers, and components.
- Plan complex architectural or agent workflow changes before implementation.


## Database & SQL Guardrails


- Strictly enforce read-only queries using `sqlglot` AST validation.
- Never execute DDL or DML mutations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`).
- Always enforce an automatic query limit (default `LIMIT 100`) to protect database performance.
- Never interpolate raw user strings directly into SQL statements.
- Test connection credentials with read-only database roles where supported.
- Always enforce SSL/TLS encryption (`sslmode=require`) for cloud-hosted databases (Neon, Supabase).


## UI & Frontend


- Maintain clean, fully responsive layouts across mobile, tablet, and desktop.
- Always include loading states (skeletons/spinners) while AI models are generating SQL.
- Always include clear, actionable error states for invalid queries or database failures.
- Always include empty states for initial connection, empty query history, and zero-row results.
- Keep chart components modular and gracefully fallback to table views if chart rendering fails.


## Security & Authentication


- Never expose LLM API keys (Groq/OpenRouter) or database connection strings on the client.
- Always verify Clerk Bearer JWT tokens server-side on protected FastAPI endpoints.
- Validate all incoming request payloads with Pydantic models.
- Sanitize database error messages before returning them to non-technical end users.


## Testing


- Write unit tests for SQL AST guardrails to guarantee mutation queries are blocked.
- Write unit tests for LangGraph agent node state transitions.
- Write integration tests for API routes and database connection handlers.
- Run tests after implementation and fix all failing tests before completing a task.


## Git


- Make small, atomic commits.
- Use descriptive, conventional commit messages (e.g., `feat:`, `fix:`, `refactor:`, `test:`).
