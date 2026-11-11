# Customer Churn & Sales Analytics Dashboard

## Overview
This project delivers an end-to-end churn analysis pipeline using Python, SQL, and Power BI visualization techniques.

## Technologies
- Python (Pandas, NumPy)
- MySQL (Window Functions, Aggregations)
- Power BI & HTML Data Storytelling
- Excel

## Structure
- `data/`: 15,000 customer records and four quarters of synthetic customer exposure events.
- `python/`: Reproducible data generation, Pandas ETL, and dashboard data export.
- `sql/`: MySQL schema, window analytics, and scheduled report refresh.
- `dashboard/`: Interactive browser dashboard and generated dashboard data.
- `powerbi/`: Power BI theme, DAX measures, and setup instructions.
- `README.md`: Project documentation.

## Dashboard
Open `dashboard/index.html` directly to explore churn, customer, and revenue metrics. The dashboard uses bundled local assets and generated data, so it does not need a web server or network access. Rebuild all data outputs with `python python/generate_sample_data.py`.

Generate 15,000 reproducible synthetic customers, 60,000 quarterly exposure rows, and rebuild the dashboard data with `python python/generate_sample_data.py`. Use `--rows` to choose another customer count and `--seed` to change the random seed.

The `powerbi/` folder contains a Power BI Project (`.pbip`) semantic model, its TMDL source, a report theme, reusable DAX measures, and setup instructions. The PBIP currently packages the semantic model; report pages and visuals still need to be authored in Power BI Desktop.

The quarterly event history is a synthetic scenario with intentionally rising churn hazards. It demonstrates window analytics and retention storytelling; it is not observed historical performance or causal evidence. Follow [sql/README.md](sql/README.md) for MySQL loading and scheduled report setup, and [powerbi/README.md](powerbi/README.md) for the executive report design.