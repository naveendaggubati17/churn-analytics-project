# MySQL Analytics

Requires MySQL 8.0+ for window functions and scheduled events.

1. Run `schema.sql` to create the database and tables.
2. Replace the two placeholder paths in `load_data.sql` with absolute paths to the cleaned customer and quarterly event CSVs, then run it with MySQL's `LOCAL INFILE` option enabled. The script maps the CSV columns and loads customers before quarterly rows.
3. Run `queries.sql` for segment churn rates, quarter-over-quarter `LAG` analysis, cumulative churn, customer ranking, and an outreach list.
4. Run `automated_reports.sql` to create and populate the quarterly report snapshot and schedule its daily refresh.

To enable CSV imports, allow `LOCAL INFILE` on both the MySQL server and client. To enable scheduled refreshes, a database administrator must enable MySQL's event scheduler with `SET GLOBAL event_scheduler = ON`. Without that server setting the procedure can still be run manually with `CALL refresh_quarterly_churn_report();`.

The quarterly event data is a synthetic scenario with increasing churn hazards, generated to demonstrate trend reporting. It is not measured historical performance.