# SQL Scripts Directory

This directory contains SQL scripts organized by purpose:

## Folder Structure

- **`setup/`** - Initial database setup and configuration scripts
- **`migrations/`** - Database schema changes and data migrations
- **`temp/`** - Temporary SQL scripts (excluded from git)

## Usage

- Keep important SQL scripts organized in appropriate folders
- Use descriptive names with dates: `YYYY-MM-DD_description.sql`
- Temporary scripts go in `temp/` folder and are not committed

## Examples

```
sql-scripts/
├── setup/
│   ├── 2025-09-24_initial_auth_setup.sql
│   └── 2025-09-24_create_admin_user.sql
├── migrations/
│   ├── 2025-09-21_add_metadata_column.sql
│   └── 2025-09-23_setup_authentication.sql
└── temp/
    └── test_queries.sql (not committed)
```