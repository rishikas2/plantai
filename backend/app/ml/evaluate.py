"""
Model evaluation module for PlantCare AI.
Calculates Accuracy, Precision, Recall, Macro F1-score, Confusion Matrix,
and Per-Class Performance metrics.

Usage:
  # Evaluate on real PlantVillage held-out split:
  python -m app.ml.evaluate --data-dir path/to/PlantVillage

  # Evaluate on synthetic data (unit tests only):
  python -m app.ml.evaluate --synthetic
"""

import os
import json
import argparse
import logging
from pathlib import Path
from typing import Optional

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
)

from app.ml.dataset_loader import (
    load_labels,
    load_real_dataset,
    generate_reproducible_sample_dataset,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "plantcare_mobilenetv2.keras"
REPORT_PATH = Path(__file__).parent / "evaluation_report.json"


def evaluate_plantcare_model(
    model_path: Optional[str] = None,
    data_dir: Optional[str] = None,
) -> dict:
    """
    Evaluate the trained model and write evaluation_report.json.

    Args:
        model_path: Path to the .keras model file (defaults to saved model path).
        data_dir:   Path to PlantVillage dataset root for real evaluation.
                    If None, uses synthetic test data (for unit tests only).
    """
    if model_path is None:
        model_path = str(MODEL_PATH)

    labels = load_labels()
    logger.info(f"Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path)

    # ── Collect ground-truth and predictions ────────────────────────────
    if data_dir is not None:
        logger.info(f"Evaluating on real dataset: {data_dir}")
        # Use the validation split as our test set
        _, val_ds, matched_labels = load_real_dataset(
            data_dir=data_dir,
            labels=labels,
            validation_split=0.15,
            batch_size=32,
        )
        y_true, y_pred_raw = [], []
        for batch_images, batch_labels in val_ds:
            preds = model.predict(batch_images, verbose=0)
            y_pred_raw.extend(np.argmax(preds, axis=1).tolist())
            y_true.extend(batch_labels.numpy().tolist())

        eval_labels = matched_labels
    else:
        logger.warning("No data-dir provided — evaluating on synthetic test fixtures.")
        np.random.seed(999)
        _, _, x_test, y_test = generate_reproducible_sample_dataset(
            labels=labels, samples_per_class=10
        )
        raw_preds = model.predict(x_test, batch_size=16, verbose=0)
        y_pred_raw = np.argmax(raw_preds, axis=1).tolist()
        y_true = y_test.tolist()
        eval_labels = labels

    y_true = np.array(y_true)
    y_pred = np.array(y_pred_raw)

    # ── Metrics ─────────────────────────────────────────────────────────
    acc = float(accuracy_score(y_true, y_pred))
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    _, _, f1_weighted, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )

    conf_mat = confusion_matrix(y_true, y_pred).tolist()

    p_per, r_per, f1_per, support = precision_recall_fscore_support(
        y_true, y_pred, average=None, zero_division=0
    )
    per_class = {}
    for idx, class_name in enumerate(eval_labels):
        per_class[class_name] = {
            "precision": float(p_per[idx]) if idx < len(p_per) else 0.0,
            "recall":    float(r_per[idx]) if idx < len(r_per) else 0.0,
            "f1_score":  float(f1_per[idx]) if idx < len(f1_per) else 0.0,
            "support":   int(support[idx])   if idx < len(support) else 0,
        }

    report = {
        "model_file": str(model_path),
        "evaluation_data": data_dir if data_dir else "synthetic",
        "total_test_samples": len(y_true),
        "overall_metrics": {
            "accuracy":          float(acc),
            "macro_precision":   float(precision_macro),
            "macro_recall":      float(recall_macro),
            "macro_f1_score":    float(f1_macro),
            "weighted_f1_score": float(f1_weighted),
        },
        "per_class_performance": per_class,
        "confusion_matrix": conf_mat,
        "evaluation_notes": [
            "Evaluated on the validation split of the specified dataset.",
            "Field conditions (mixed infections, lighting, shadows) may differ from lab images.",
            "Always recommend expert agricultural consultation for severe cases.",
        ],
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info(f"Evaluation complete!")
    logger.info(f"  Accuracy:   {acc:.4f}")
    logger.info(f"  Macro F1:   {f1_macro:.4f}")
    logger.info(f"  Report → {REPORT_PATH}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PlantCare AI — Model Evaluation")
    parser.add_argument("--data-dir", type=str, default=None,
                        help="Path to PlantVillage dataset root.")
    parser.add_argument("--model-path", type=str, default=None,
                        help="Path to .keras model file (default: saved model).")
    parser.add_argument("--synthetic", action="store_true",
                        help="Evaluate on synthetic test data (unit tests only).")
    args = parser.parse_args()

    evaluate_plantcare_model(
        model_path=args.model_path,
        data_dir=None if args.synthetic else args.data_dir,
    )
