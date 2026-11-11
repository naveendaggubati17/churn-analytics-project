import json
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = PROJECT_ROOT / "data" / "cleaned_churn_data.csv"
QUARTERLY_SOURCE_PATH = PROJECT_ROOT / "data" / "quarterly_churn_events.csv"
OUTPUT_PATH = PROJECT_ROOT / "dashboard" / "dashboard_data.json"
SCRIPT_OUTPUT_PATH = PROJECT_ROOT / "dashboard" / "dashboard_data.js"


def build_dashboard_data():
    columns = [
        "customerID",
        "Churn",
        "Contract",
        "PaymentMethod",
        "TenureGroup",
        "MonthlyCharges",
        "TotalCharges",
        "tenure",
        "RiskScore",
        "SeniorCitizen",
        "InternetService",
    ]
    df = pd.read_csv(SOURCE_PATH, usecols=columns)
    quarterly = pd.read_csv(QUARTERLY_SOURCE_PATH)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(
        {
            "customers": df.to_dict(orient="records"),
            "quarterly": quarterly.to_dict(orient="records"),
        },
        separators=(",", ":"),
    )
    OUTPUT_PATH.write_text(payload, encoding="utf-8")
    SCRIPT_OUTPUT_PATH.write_text(
        f"window.CHURN_DASHBOARD_DATA = {payload};\n", encoding="utf-8"
    )
    print(f"Dashboard data written for {len(df)} customers.")


if __name__ == "__main__":
    build_dashboard_data()