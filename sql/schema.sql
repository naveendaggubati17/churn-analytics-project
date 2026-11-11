CREATE DATABASE IF NOT EXISTS churn_db;
USE churn_db;

CREATE TABLE customer_sales (
    customer_id VARCHAR(50) PRIMARY KEY,
    gender VARCHAR(10),
    senior_citizen INT,
    partner VARCHAR(5),
    dependents VARCHAR(5),
    tenure INT,
    phone_service VARCHAR(5),
    multiple_lines VARCHAR(25),
    internet_service VARCHAR(25),
    online_security VARCHAR(25),
    online_backup VARCHAR(25),
    device_protection VARCHAR(25),
    tech_support VARCHAR(25),
    streaming_tv VARCHAR(25),
    streaming_movies VARCHAR(25),
    contract VARCHAR(25),
    paperless_billing VARCHAR(5),
    payment_method VARCHAR(50),
    monthly_charges DECIMAL(10,2),
    total_charges DECIMAL(10,2),
    churn VARCHAR(5),
    tenure_group VARCHAR(20),
    risk_score INT
);

CREATE TABLE quarterly_churn_events (
    customer_id VARCHAR(50) NOT NULL,
    quarter_start DATE NOT NULL,
    quarter_label VARCHAR(7) NOT NULL,
    active_at_start TINYINT UNSIGNED NOT NULL,
    churned_this_quarter TINYINT UNSIGNED NOT NULL,
    monthly_charges DECIMAL(10,2) NOT NULL,
    contract VARCHAR(25) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    tenure_group VARCHAR(20) NOT NULL,
    risk_score INT NOT NULL,
    PRIMARY KEY (customer_id, quarter_start),
    KEY idx_quarter_start (quarter_start),
    CONSTRAINT fk_quarterly_customer
        FOREIGN KEY (customer_id) REFERENCES customer_sales (customer_id),
    CONSTRAINT chk_active_at_start CHECK (active_at_start IN (0, 1)),
    CONSTRAINT chk_quarterly_churn CHECK (churned_this_quarter <= active_at_start)
);