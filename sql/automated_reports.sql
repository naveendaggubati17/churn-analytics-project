USE churn_db;

CREATE TABLE IF NOT EXISTS quarterly_churn_report (
    quarter_start DATE PRIMARY KEY,
    quarter_label VARCHAR(7) NOT NULL,
    customers_at_start INT UNSIGNED NOT NULL,
    churned_customers INT UNSIGNED NOT NULL,
    churn_rate_pct DECIMAL(6,2) NOT NULL,
    previous_quarter_rate_pct DECIMAL(6,2) NULL,
    qoq_change_pp DECIMAL(6,2) NULL,
    refreshed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP PROCEDURE IF EXISTS refresh_quarterly_churn_report;
DELIMITER //
CREATE PROCEDURE refresh_quarterly_churn_report()
BEGIN
    DELETE FROM quarterly_churn_report;

    INSERT INTO quarterly_churn_report (
        quarter_start,
        quarter_label,
        customers_at_start,
        churned_customers,
        churn_rate_pct,
        previous_quarter_rate_pct,
        qoq_change_pp
    )
    SELECT
        quarter_start,
        quarter_label,
        customers_at_start,
        churned_customers,
        churn_rate_pct,
        previous_quarter_rate_pct,
        ROUND(churn_rate_pct - previous_quarter_rate_pct, 2)
    FROM (
        SELECT
            quarter_metrics.*,
            LAG(churn_rate_pct) OVER (ORDER BY quarter_start) AS previous_quarter_rate_pct
        FROM (
            SELECT
                quarter_start,
                quarter_label,
                SUM(active_at_start) AS customers_at_start,
                SUM(churned_this_quarter) AS churned_customers,
                ROUND(100.0 * SUM(churned_this_quarter) / NULLIF(SUM(active_at_start), 0), 2) AS churn_rate_pct
            FROM quarterly_churn_events
            GROUP BY quarter_start, quarter_label
        ) AS quarter_metrics
    ) AS quarter_trend;
END//
DELIMITER ;

CALL refresh_quarterly_churn_report();

-- Enable once per MySQL server (requires SYSTEM_VARIABLES_ADMIN or SUPER):
-- SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS ev_refresh_quarterly_churn_report_daily
    ON SCHEDULE EVERY 1 DAY
    STARTS CURRENT_TIMESTAMP + INTERVAL 1 DAY
    DO CALL refresh_quarterly_churn_report();