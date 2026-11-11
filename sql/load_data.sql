USE churn_db;

-- Replace each placeholder with an absolute path on the machine running the MySQL client.
LOAD DATA LOCAL INFILE '/path/to/cleaned_churn_data.csv'
INTO TABLE customer_sales
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    customer_id,
    gender,
    senior_citizen,
    partner,
    dependents,
    tenure,
    phone_service,
    multiple_lines,
    internet_service,
    online_security,
    online_backup,
    device_protection,
    tech_support,
    streaming_tv,
    streaming_movies,
    contract,
    paperless_billing,
    payment_method,
    monthly_charges,
    total_charges,
    churn,
    tenure_group,
    risk_score
);

LOAD DATA LOCAL INFILE '/path/to/quarterly_churn_events.csv'
INTO TABLE quarterly_churn_events
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    customer_id,
    quarter_start,
    quarter_label,
    active_at_start,
    churned_this_quarter,
    monthly_charges,
    contract,
    payment_method,
    tenure_group,
    risk_score
);