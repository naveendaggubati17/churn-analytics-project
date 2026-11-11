USE churn_db;

-- 1. Churn Rate & Revenue Lost Summary
SELECT
    contract AS Contract_Type,
    payment_method AS Payment_Method,
    COUNT(customer_id) AS Total_Customers,
    SUM(CASE WHEN churn = 'Yes' THEN 1 ELSE 0 END) AS Churned_Customers,
    ROUND(AVG(monthly_charges), 2) AS Avg_Monthly_Revenue,
    ROUND(SUM(CASE WHEN churn = 'Yes' THEN monthly_charges ELSE 0 END), 2) AS Monthly_Revenue_Lost,
    ROUND((SUM(CASE WHEN churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(customer_id)), 2) AS Churn_Rate_Pct
FROM customer_sales
GROUP BY contract, payment_method
ORDER BY Churn_Rate_Pct DESC;

-- 2. SQL Window Function: Lifetime Revenue Ranking
SELECT
    customer_id,
    contract,
    total_charges,
    DENSE_RANK() OVER (PARTITION BY contract ORDER BY total_charges DESC) AS Revenue_Rank
FROM customer_sales;