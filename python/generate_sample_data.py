import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from build_dashboard_data import build_dashboard_data
from etl_wrangling import run_etl


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
DEFAULT_ROWS = 15_000
QUARTER_STARTS = pd.to_datetime(
    ["2025-01-01", "2025-04-01", "2025-07-01", "2025-10-01"]
)


def build_quarterly_churn(df, risk_score, rng):
    active = np.ones(len(df), dtype=bool)
    baseline_hazards = [0.035, 0.045, 0.055, 0.065]
    risk_lift = (risk_score - 2) * 0.015
    quarterly_rows = []

    for quarter_index, quarter_start in enumerate(QUARTER_STARTS):
        active_at_start = active.copy()
        churn_probability = baseline_hazards[quarter_index] + risk_lift
        churned_this_quarter = active_at_start & (
            rng.random(len(df)) < churn_probability
        )
        quarter_number = (quarter_start.month - 1) // 3 + 1
        quarterly_rows.append(
            pd.DataFrame(
                {
                    "CustomerID": df["customerID"],
                    "QuarterStart": quarter_start.date().isoformat(),
                    "QuarterLabel": f"{quarter_start.year}-Q{quarter_number}",
                    "ActiveAtStart": active_at_start.astype("int8"),
                    "ChurnedThisQuarter": churned_this_quarter.astype("int8"),
                    "MonthlyCharges": df["MonthlyCharges"],
                    "Contract": df["Contract"],
                    "PaymentMethod": df["PaymentMethod"],
                    "TenureGroup": pd.cut(
                        df["tenure"],
                        bins=[-1, 12, 24, 48, 73],
                        labels=["0-12 Mos", "13-24 Mos", "25-48 Mos", "49-72 Mos"],
                    ).astype(str),
                    "RiskScore": risk_score,
                }
            )
        )
        active &= ~churned_this_quarter

    return pd.concat(quarterly_rows, ignore_index=True), active


def generate_sample_data(rows=DEFAULT_ROWS, seed=42):
    if rows < 1:
        raise ValueError("rows must be a positive integer")

    rng = np.random.default_rng(seed)
    df = pd.DataFrame(
        {
            "customerID": [f"7590-WB{i:04d}" for i in range(1, rows + 1)],
            "gender": rng.choice(["Female", "Male"], size=rows),
            "SeniorCitizen": rng.choice([0, 1], size=rows, p=[0.84, 0.16]),
            "Partner": rng.choice(["Yes", "No"], size=rows),
            "Dependents": rng.choice(["Yes", "No"], size=rows),
            "tenure": rng.integers(1, 73, size=rows),
            "PhoneService": rng.choice(["Yes", "No"], size=rows),
            "MultipleLines": rng.choice(
                ["No phone service", "No", "Yes"], size=rows
            ),
            "InternetService": rng.choice(
                ["DSL", "Fiber optic", "No"], size=rows
            ),
            "OnlineSecurity": rng.choice(
                ["No", "Yes", "No internet service"], size=rows
            ),
            "OnlineBackup": rng.choice(
                ["No", "Yes", "No internet service"], size=rows
            ),
            "DeviceProtection": rng.choice(
                ["No", "Yes", "No internet service"], size=rows
            ),
            "TechSupport": rng.choice(
                ["No", "Yes", "No internet service"], size=rows
            ),
            "StreamingTV": rng.choice(
                ["No", "Yes", "No internet service"], size=rows
            ),
            "StreamingMovies": rng.choice(
                ["No", "Yes", "No internet service"], size=rows
            ),
            "Contract": rng.choice(
                ["Month-to-month", "One year", "Two year"], size=rows
            ),
            "PaperlessBilling": rng.choice(["Yes", "No"], size=rows),
            "PaymentMethod": rng.choice(
                [
                    "Electronic check",
                    "Mailed check",
                    "Bank transfer (automatic)",
                    "Credit card (automatic)",
                ],
                size=rows,
            ),
            "MonthlyCharges": np.round(rng.uniform(18.25, 118.75, size=rows), 2),
        }
    )
    df["TotalCharges"] = np.round(df["MonthlyCharges"] * df["tenure"], 2)
    risk_score = np.where(df["Contract"] == "Month-to-month", 2, 1) + np.where(
        df["PaymentMethod"] == "Electronic check", 2, 1
    )
    quarterly_churn, active = build_quarterly_churn(df, risk_score, rng)
    df["Churn"] = np.where(active, "No", "Yes")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_DIR / "telco_customer_churn.csv", index=False)
    quarterly_churn.to_csv(DATA_DIR / "quarterly_churn_events.csv", index=False)
    print(f"Generated {rows:,} sample customers with seed {seed}.")
    print(f"Generated {len(quarterly_churn):,} synthetic quarterly exposure rows.")
    run_etl()
    build_dashboard_data()


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic churn data and rebuild project outputs."
    )
    parser.add_argument(
        "--rows", type=int, default=DEFAULT_ROWS, help="Number of customers to generate."
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()
    generate_sample_data(rows=args.rows, seed=args.seed)


if __name__ == "__main__":
    main()