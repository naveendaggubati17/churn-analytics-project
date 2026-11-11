# Power BI Report Setup

## Load the dataset
1. Open Power BI Desktop and choose **Get data > Text/CSV**.
2. Select `data/cleaned_churn_data.csv` and load it.
3. In the model pane, rename the imported table to `Customer Churn`.
4. Set `MonthlyCharges` and `TotalCharges` to decimal number, and `tenure`, `SeniorCitizen`, and `RiskScore` to whole number.
5. From **View > Themes > Browse for themes**, import `powerbi/theme.json`.
6. Add the measures in `powerbi/measures.dax` to the `Customer Churn` table. Format `Churn Rate` as a percentage and the revenue measures as currency.

## Suggested report page
- KPI cards: `Churn Rate`, `Churned Customers`, `Monthly Revenue at Risk`, and `Average Tenure (Months)`.
- Clustered column chart: `TenureGroup` by `Churn Rate`.
- Bar chart: `Contract` by `Churn Rate`.
- Bar chart: `PaymentMethod` by `Churn Rate`.
- Doughnut chart: `Churn` by `Total Customers`.
- Slicers: `Contract`, `PaymentMethod`, and `TenureGroup`.

The repository also includes an interactive browser preview under `dashboard/`. The source data is synthetic and its churn labels are randomly assigned, so the report is for demonstrating the workflow rather than making business claims.