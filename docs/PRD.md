# Product Requirements Document


## Product
DataSpeak


## Problem
Non-technical team members cannot independently query databases to get business answers, creating dependency on engineering teams and slowing down decision-making.


## Target Users
Operations managers, product managers, marketers, and business analysts with little to no SQL knowledge.


## Goal
Enable non-technical users to ask questions in plain English, safely query relational databases, and receive instant answers with data tables, charts, and plain-English summaries.


## Core Features


1. Conversational Natural Language to SQL Engine
2. Relational Database Connector (PostgreSQL including Neon & Supabase, MySQL, SQLite)
3. Strict Read-Only Safety Guardrails
4. Interactive Data Table Results
5. Automated Visual Charts & Graphs
6. AI-Generated Plain-English Summaries
7. Query History & Saved Questions
8. CSV Data Export


## MVP


- Connect to a single relational database (PostgreSQL including Neon & Supabase, MySQL, or SQLite)
- Auto-extract schema (tables, columns, relationships)
- Plain-English query prompt box
- Text-to-SQL conversion with SQL preview
- Strict read-only execution (blocks INSERT, UPDATE, DELETE, DROP)
- Interactive results table
- Auto-generated visual chart (bar, line, or pie based on query type)
- Plain-English summary explaining the findings
- Export results to CSV


## Out of Scope


- Database write operations or schema migrations
- Cloud data warehouses (Snowflake, BigQuery, Redshift)
- Cross-database federated queries
- Real-time streaming or automated alert triggers
- Mobile application
