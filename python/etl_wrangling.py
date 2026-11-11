from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"


def run_etl():
    df = pd.read_csv(DATA_DIR / "telco_customer_churn.csv")
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(
        df["tenure"] * df["MonthlyCharges"]
    )
    df["TenureGroup"] = pd.cut(
        df["tenure"],
        bins=[-1, 12, 24, 48, 73],
        labels=["0-12 Mos", "13-24 Mos", "25-48 Mos", "49-72 Mos"],
    )
    df["RiskScore"] = np.where(df["Contract"] == "Month-to-month", 2, 1) + np.where(
        df["PaymentMethod"] == "Electronic check", 2, 1
    )
    df.to_csv(DATA_DIR / "cleaned_churn_data.csv", index=False)
    print("ETL execution completed successfully!")


if __name__ == "__main__":
    run_etl()