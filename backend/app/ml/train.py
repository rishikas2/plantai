"""
Training pipeline for PlantCare AI using MobileNetV2 Transfer Learning.

Usage
-----
# Real PlantVillage data (RECOMMENDED — gives 90%+ accuracy):
  python -m app.ml.train --data-dir path/to/PlantVillage

# Synthetic data (unit tests / CI only — accuracy will be low):
  python -m app.ml.train --synthetic

The PlantVillage dataset can be downloaded from Kaggle:
  https://www.kaggle.com/datasets/emmarex/plantdisease
  (folder name: PlantVillage)

After downloading and unzipping, point --data-dir at the inner folder that
contains one sub-folder per disease class, e.g.:
  --data-dir "C:/datasets/PlantVillage"
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models, optimizers, callbacks

from app.ml.dataset_loader import (
    IMAGE_SIZE,
    load_labels,
    load_real_dataset,
    build_augmentation_layer,
    generate_reproducible_sample_dataset,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

MODEL_SAVE_PATH = Path(__file__).parent / "plantcare_mobilenetv2.keras"
METRICS_SAVE_PATH = Path(__file__).parent / "training_metrics.json"


# ---------------------------------------------------------------------------
# Model architecture
# ---------------------------------------------------------------------------

def build_plantcare_model(num_classes: int):
    """
    MobileNetV2 transfer-learning model with a regularised classification head.
    Returns (model, base_model) so the base can be unfrozen for fine-tuning.
    """
    base_model = MobileNetV2(
        input_shape=(*IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False   # frozen for Phase 1

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3), name="input_image")
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.BatchNormalization(name="bn")(x)
    x = layers.Dense(256, activation="relu",
                     kernel_regularizer=tf.keras.regularizers.l2(1e-4),
                     name="dense_256")(x)
    x = layers.Dropout(0.4, name="dropout")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="PlantCare_MobileNetV2")
    return model, base_model


# ---------------------------------------------------------------------------
# Training with real image directory
# ---------------------------------------------------------------------------

def train_with_real_data(
    data_dir: str,
    phase1_epochs: int = 10,
    phase2_epochs: int = 10,
    batch_size: int = 32,
):
    """
    Full transfer-learning pipeline using real PlantVillage images.

    Phase 1 — train only the classification head (base frozen).
    Phase 2 — fine-tune the top layers of MobileNetV2 at a low LR.

    Expected accuracy on PlantVillage: 90–97 % after both phases.
    """
    labels = load_labels()
    num_classes = len(labels)
    logger.info(f"Labels: {num_classes} classes")

    # ── Data ──────────────────────────────────────────────────────────────
    train_ds, val_ds, matched_labels = load_real_dataset(
        data_dir=data_dir,
        labels=labels,
        validation_split=0.15,
        batch_size=batch_size,
    )
    # Update num_classes to what we actually have in the dataset
    actual_classes = len(matched_labels)
    logger.info(f"Matched {actual_classes} classes in dataset.")

    # Augmentation applied only on training batches
    augment = build_augmentation_layer()

    def augment_ds(image, label):
        image = augment(image, training=True)
        return image, label

    train_ds = train_ds.map(augment_ds, num_parallel_calls=tf.data.AUTOTUNE)

    # ── Model ─────────────────────────────────────────────────────────────
    model, base_model = build_plantcare_model(actual_classes)
    logger.info(model.summary())

    # ── Phase 1: head only ────────────────────────────────────────────────
    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    cb_early = callbacks.EarlyStopping(
        monitor="val_accuracy", patience=3, restore_best_weights=True, verbose=1
    )
    cb_reduce = callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=1
    )
    cb_ckpt = callbacks.ModelCheckpoint(
        filepath=str(MODEL_SAVE_PATH),
        monitor="val_accuracy",
        save_best_only=True,
        verbose=1,
    )

    logger.info("=== Phase 1: Training classification head ===")
    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=phase1_epochs,
        callbacks=[cb_early, cb_reduce, cb_ckpt],
    )

    # ── Phase 2: fine-tune top MobileNetV2 layers ─────────────────────────
    logger.info("=== Phase 2: Fine-tuning top MobileNetV2 layers ===")
    base_model.trainable = True
    # Keep bottom 100 layers frozen — only unfreeze the last ~54 layers
    for layer in base_model.layers[:100]:
        layer.trainable = False

    model.compile(
        optimizer=optimizers.Adam(learning_rate=5e-5),   # much lower LR for fine-tuning
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    cb_early2 = callbacks.EarlyStopping(
        monitor="val_accuracy", patience=5, restore_best_weights=True, verbose=1
    )
    cb_reduce2 = callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.3, patience=3, min_lr=1e-7, verbose=1
    )

    history2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=phase2_epochs,
        callbacks=[cb_early2, cb_reduce2, cb_ckpt],
    )

    # ── Final eval ────────────────────────────────────────────────────────
    val_loss, val_acc = model.evaluate(val_ds, verbose=0)
    logger.info(f"Best model — Val Loss: {val_loss:.4f}  Val Accuracy: {val_acc:.4f}")

    # Save metrics
    metrics = {
        "model_architecture": "MobileNetV2",
        "training_mode": "real_plantvillage",
        "num_classes": actual_classes,
        "classes": matched_labels,
        "input_shape": [*IMAGE_SIZE, 3],
        "final_val_loss": float(val_loss),
        "final_val_accuracy": float(val_acc),
        "phase1_history": _serialize_history(history1),
        "phase2_history": _serialize_history(history2),
    }
    with open(METRICS_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"Model saved → {MODEL_SAVE_PATH}")
    logger.info(f"Metrics saved → {METRICS_SAVE_PATH}")
    return model, metrics


# ---------------------------------------------------------------------------
# Training with synthetic data (for unit tests / CI only)
# ---------------------------------------------------------------------------

def train_with_synthetic_data(epochs: int = 5, batch_size: int = 16):
    """
    Trains on randomly generated synthetic images.
    Model accuracy will be very low (~5-25%).
    Use ONLY for structural testing — not for real plant diagnosis.
    """
    labels = load_labels()
    num_classes = len(labels)
    logger.warning("Training on SYNTHETIC data — predictions will be unreliable for real images!")

    x_train, y_train, x_val, y_val = generate_reproducible_sample_dataset(
        labels=labels, samples_per_class=12
    )
    logger.info(f"Synthetic dataset — Train: {len(x_train)}, Val: {len(x_val)}")

    model, base_model = build_plantcare_model(num_classes)

    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    history1 = model.fit(
        x_train, y_train,
        validation_data=(x_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        verbose=1,
    )

    # Fine-tuning phase
    base_model.trainable = True
    for layer in base_model.layers[:100]:
        layer.trainable = False

    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-4),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    history2 = model.fit(
        x_train, y_train,
        validation_data=(x_val, y_val),
        epochs=3,
        batch_size=batch_size,
        verbose=1,
    )

    val_loss, val_acc = model.evaluate(x_val, y_val, verbose=0)
    logger.info(f"Synthetic training complete — Val Accuracy: {val_acc:.4f}")

    model.save(str(MODEL_SAVE_PATH))

    metrics = {
        "model_architecture": "MobileNetV2",
        "training_mode": "synthetic_only",
        "num_classes": num_classes,
        "classes": labels,
        "input_shape": [*IMAGE_SIZE, 3],
        "final_val_loss": float(val_loss),
        "final_val_accuracy": float(val_acc),
        "phase1_history": _serialize_history(history1),
        "phase2_history": _serialize_history(history2),
    }
    with open(METRICS_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return model, metrics


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_history(history) -> dict:
    result = {}
    for key, values in history.history.items():
        result[key] = [float(v) for v in values]
    return result


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PlantCare AI — MobileNetV2 Training")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--data-dir",
        type=str,
        help="Path to PlantVillage dataset root (one sub-folder per class).",
    )
    group.add_argument(
        "--synthetic",
        action="store_true",
        help="Train on synthetic data only (for testing the pipeline, not for production).",
    )
    parser.add_argument("--phase1-epochs", type=int, default=10)
    parser.add_argument("--phase2-epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args()

    if args.synthetic:
        train_with_synthetic_data(epochs=args.phase1_epochs, batch_size=args.batch_size)
    else:
        train_with_real_data(
            data_dir=args.data_dir,
            phase1_epochs=args.phase1_epochs,
            phase2_epochs=args.phase2_epochs,
            batch_size=args.batch_size,
        )
