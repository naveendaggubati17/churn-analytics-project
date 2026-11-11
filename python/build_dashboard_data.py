import json
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = PROJECT_ROOT / "data" / "cleaned_churn_data.csv"
OUTPUT_PATH = PROJECT_ROOT / "dashboard" / "dashboard_data.json"


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
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps({"customers": df.to_dict(orient="records")}, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Dashboard data written for {len(df)} customers.")


if __name__ == "__main__":
    build_dashboard_data()