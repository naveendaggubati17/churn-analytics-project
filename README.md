# Customer Churn & Sales Analytics Dashboard

## Overview
This project delivers an end-to-end churn analysis pipeline using Python, SQL, and Power BI visualization techniques.

## Technologies
- Python (Pandas, NumPy)
- MySQL (Window Functions, Aggregations)
- Power BI & HTML Data Storytelling
- Excel

## Structure
- `data/`: Raw and cleaned datasets.
- `python/`: Pandas ETL cleaning script.
- `sql/`: Database schema and analytical queries.
- `dashboard/`: Interactive browser dashboard and generated dashboard data.
- `powerbi/`: Power BI theme, DAX measures, and setup instructions.
- `README.md`: Project documentation.

## Dashboard
Open `dashboard/index.html` through a local web server to explore churn, customer, and revenue metrics. Rebuild its data file after updating the cleaned dataset with `python python/build_dashboard_data.py`.

The `powerbi/` folder contains a report theme, reusable DAX measures, and instructions for creating the equivalent report in Power BI Desktop. A native `.pbix` file is not included.

The sample churn labels are randomly generated and are intended for demonstrating the workflow, not for drawing business conclusions.