# Power BI Project

Open `ChurnAnalytics.pbip` in Power BI Desktop. Its semantic model contains `Customer Churn` and `Quarterly Churn`, sourced from the cleaned customer and quarterly event CSVs in this public GitHub repository. The Power Query partitions use the repository's raw CSV URLs; set the source credentials to **Anonymous** if prompted.

The model has typed columns, a many-to-one quarterly-event-to-customer relationship, and measures for customer counts, base churn rate, quarterly churn rate, quarter-over-quarter change, and revenue lost. The measures are listed in `measures.dax`, and `theme.json` provides the report palette.

## Executive Report Page
- KPI cards: `Total Customers`, `Churn Rate`, `Quarterly Churn Rate`, `QoQ Churn Change (pp)`, and `Quarterly Revenue Lost`.
- Line chart: `QuarterLabel` by `Quarterly Churn Rate`; add `Customers at Quarter Start` and `Quarterly Churned Customers` to tooltips.
- Bar charts: `TenureGroup`, `Contract`, and `PaymentMethod` by `Churn Rate`.
- Detail table: customer ID, contract, payment method, tenure group, risk score, and monthly charges; sort risk score descending.
- Slicers: `Contract`, `PaymentMethod`, and `TenureGroup`.
- Retention action panel: treat high-rate segments as hypotheses for controlled billing, contract, and onboarding experiments.

This PBIP currently contains the semantic model only; report pages and visuals must be created in Power BI Desktop. The quarterly event history is synthetic and intentionally has rising churn hazards to demonstrate trend analysis. It is not observed historical performance or causal evidence.