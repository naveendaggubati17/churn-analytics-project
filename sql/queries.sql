USE churn_db;

-- 1. Executive churn and revenue summary
SELECT
    contract AS Contract_Type,
    payment_method AS Payment_Method,
    COUNT(customer_id) AS Total_Customers,
    SUM(CASE WHEN churn = 'Yes' THEN 1 ELSE 0 END) AS Churned_Customers,
    ROUND(AVG(monthly_charges), 2) AS Avg_Monthly_Revenue,
    ROUND(SUM(CASE WHEN churn = 'Yes' THEN monthly_charges ELSE 0 END), 2) AS Monthly_Revenue_Lost,
    ROUND((SUM(CASE WHEN churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(customer_id), 0)), 2) AS Churn_Rate_Pct
FROM customer_sales
GROUP BY contract, payment_method
ORDER BY Churn_Rate_Pct DESC;

-- 2. Churn hotspots ranked by segment
WITH segment_rates AS (
    SELECT
        contract,
        payment_method,
        tenure_group,
        COUNT(*) AS customers,
        SUM(churn = 'Yes') AS churned_customers,
        ROUND(100.0 * SUM(churn = 'Yes') / NULLIF(COUNT(*), 0), 2) AS churn_rate_pct,
        ROUND(SUM(CASE WHEN churn = 'Yes' THEN monthly_charges ELSE 0 END), 2) AS monthly_revenue_at_risk
    FROM customer_sales
    GROUP BY contract, payment_method, tenure_group
)
SELECT
    segment_rates.*,
    DENSE_RANK() OVER (ORDER BY churn_rate_pct DESC, customers DESC) AS churn_priority_rank
FROM segment_rates
ORDER BY churn_priority_rank, monthly_revenue_at_risk DESC;

-- 3. Quarter-over-quarter churn trend using LAG and cumulative window totals
WITH quarter_metrics AS (
    SELECT
        quarter_start,
        quarter_label,
        SUM(active_at_start) AS customers_at_start,
        SUM(churned_this_quarter) AS churned_customers,
        ROUND(100.0 * SUM(churned_this_quarter) / NULLIF(SUM(active_at_start), 0), 2) AS churn_rate_pct
    FROM quarterly_churn_events
    GROUP BY quarter_start, quarter_label
), quarter_trend AS (
    SELECT
        quarter_start,
        quarter_label,
        customers_at_start,
        churned_customers,
        churn_rate_pct,
        LAG(churn_rate_pct) OVER (ORDER BY quarter_start) AS previous_quarter_rate_pct,
        SUM(churned_customers) OVER (
            ORDER BY quarter_start
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_churned_customers
    FROM quarter_metrics
)
SELECT
    quarter_label,
    customers_at_start,
    churned_customers,
    churn_rate_pct,
    previous_quarter_rate_pct,
    ROUND(churn_rate_pct - previous_quarter_rate_pct, 2) AS qoq_change_pp,
    cumulative_churned_customers
FROM quarter_trend
ORDER BY quarter_start;

-- 4. SQL Window Function: Lifetime Revenue Ranking within Contract
SELECT
    customer_id,
    contract,
    total_charges,
    DENSE_RANK() OVER (PARTITION BY contract ORDER BY total_charges DESC) AS Revenue_Rank
FROM customer_sales;

-- 5. Prioritized customer outreach list with within-contract risk ranking
SELECT
    customer_id,
    contract,
    payment_method,
    tenure_group,
    risk_score,
    monthly_charges,
    ROW_NUMBER() OVER (
        PARTITION BY contract
        ORDER BY risk_score DESC, monthly_charges DESC, customer_id
    ) AS outreach_rank
FROM customer_sales
WHERE churn = 'No'
ORDER BY risk_score DESC, monthly_charges DESC
LIMIT 500;