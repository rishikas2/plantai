"""
Dataset loader and preprocessing pipeline for PlantCare AI.

Supports:
  - Real PlantVillage images loaded from a local directory via tf.keras image_dataset_from_directory
  - A lightweight synthetic fixture dataset used for unit tests only (NOT for real training)

Directory layout expected for real data (standard PlantVillage format):
  dataset/
    Apple___Apple_scab/
      image1.jpg
      image2.jpg
      ...
    Apple___Black_rot/
      ...
    Tomato___healthy/
      ...

Pass the path to `dataset/` as `data_dir` to `load_real_dataset()`.
"""

import os
import json
import logging
from pathlib import Path
from typing import Tuple, List, Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Standard MobileNetV2 input dimensions
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32


# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------

def load_labels(labels_path: Optional[str] = None) -> List[str]:
    """Load class label list from labels.json."""
    if labels_path is None:
        labels_path = str(Path(__file__).parent / "labels.json")
    with open(labels_path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Preprocessing (used during inference by model_service.py)
# ---------------------------------------------------------------------------

def preprocess_image_bytes(image_bytes: bytes, target_size: Tuple[int, int] = IMAGE_SIZE) -> np.ndarray:
    """
    Validate and preprocess raw image bytes into a normalised MobileNetV2 tensor.
    MobileNetV2 expects pixel values scaled to [-1, 1].
    Returns array of shape (1, 224, 224, 3).
    """
    from io import BytesIO
    try:
        img = Image.open(BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")

    if img.mode != "RGB":
        img = img.convert("RGB")

    img = img.resize(target_size, Image.Resampling.BILINEAR)
    img_array = np.array(img, dtype=np.float32)

    # MobileNetV2 normalisation: (x / 127.5) - 1.0
    normalized = (img_array / 127.5) - 1.0
    return np.expand_dims(normalized, axis=0)


# ---------------------------------------------------------------------------
# Real dataset loader  ← USE THIS FOR TRAINING
# ---------------------------------------------------------------------------

def load_real_dataset(
    data_dir: str,
    labels: List[str],
    validation_split: float = 0.15,
    seed: int = 42,
    batch_size: int = BATCH_SIZE,
):
    """
    Load a real PlantVillage image directory using tf.keras utilities.

    Returns:
        train_ds, val_ds  — batched, prefetched tf.data.Dataset objects
        class_names       — list of class names as found in the directory

    The datasets yield (image_tensor, label_index) pairs where images are
    already normalised to [-1, 1] for MobileNetV2.

    Args:
        data_dir:         Path to the root folder containing one sub-folder per class.
        labels:           Expected ordered list of class names (from labels.json).
                          Folders present in data_dir but NOT in labels are skipped.
        validation_split: Fraction of data to use for validation (default 0.15).
        seed:             Random seed for reproducibility.
        batch_size:       Batch size for training (default 32).
    """
    import tensorflow as tf

    logger.info(f"Loading real dataset from: {data_dir}")

    # Verify the directory exists and has sub-folders
    root = Path(data_dir)
    if not root.exists():
        raise FileNotFoundError(f"Dataset directory not found: {data_dir}")

    found_folders = sorted([d.name for d in root.iterdir() if d.is_dir()])
    logger.info(f"Found {len(found_folders)} class folders in dataset directory.")

    # Keep only folders that match our labels.json — in the same order
    valid_labels = [lbl for lbl in labels if lbl in found_folders]
    missing = [lbl for lbl in labels if lbl not in found_folders]

    if missing:
        logger.warning(f"These labels are in labels.json but NOT in the dataset: {missing}")
    if not valid_labels:
        raise ValueError("No matching class folders found. Check that labels.json matches the dataset folder names.")

    logger.info(f"Training on {len(valid_labels)} matched classes.")

    # MobileNetV2 normalisation layer: scales [0,255] → [-1, 1]
    normalization_layer = tf.keras.layers.Rescaling(scale=1.0 / 127.5, offset=-1.0)

    def make_split(subset: str):
        ds = tf.keras.utils.image_dataset_from_directory(
            directory=str(root),
            labels="inferred",
            label_mode="int",
            class_names=valid_labels,   # enforces folder order = label index
            color_mode="rgb",
            batch_size=batch_size,
            image_size=IMAGE_SIZE,
            shuffle=True,
            seed=seed,
            validation_split=validation_split,
            subset=subset,
        )
        # Apply MobileNetV2 normalisation
        ds = ds.map(
            lambda x, y: (normalization_layer(x), y),
            num_parallel_calls=tf.data.AUTOTUNE,
        )
        ds = ds.prefetch(tf.data.AUTOTUNE)
        return ds

    train_ds = make_split("training")
    val_ds = make_split("validation")

    return train_ds, val_ds, valid_labels


# ---------------------------------------------------------------------------
# Data augmentation pipeline (applied to training set inside train.py)
# ---------------------------------------------------------------------------

def build_augmentation_layer():
    """
    Returns a Keras Sequential augmentation model applied during training.
    Covers common real-world variation: rotation, flips, zoom, brightness.
    """
    import tensorflow as tf
    return tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal_and_vertical"),
        tf.keras.layers.RandomRotation(0.15),
        tf.keras.layers.RandomZoom(0.10),
        tf.keras.layers.RandomBrightness(0.10),
        tf.keras.layers.RandomContrast(0.10),
    ], name="data_augmentation")


# ---------------------------------------------------------------------------
# Synthetic fixture dataset  ← UNIT TESTS ONLY, not for real training
# ---------------------------------------------------------------------------

def generate_reproducible_sample_dataset(
    labels: List[str],
    samples_per_class: int = 15,
    output_dir: Optional[str] = None,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Generates a tiny synthetic dataset of colour-coded noise images.
    Purpose: unit tests and CI pipelines only.
    DO NOT use this for real model training — accuracy will be near-random.
    """
    np.random.seed(42)
    x_data, y_data = [], []

    for class_idx, class_name in enumerate(labels):
        is_healthy = "healthy" in class_name.lower()
        is_rust = "rust" in class_name.lower()
        is_blight = "blight" in class_name.lower()
        is_spot = "spot" in class_name.lower()
        is_virus = "virus" in class_name.lower() or "curl" in class_name.lower()

        for _ in range(samples_per_class):
            img = np.zeros((224, 224, 3), dtype=np.float32)
            g_base = np.random.uniform(120, 190)
            r_base = np.random.uniform(40, 90)
            b_base = np.random.uniform(30, 70)
            img[:, :, 0] = r_base + np.random.normal(0, 10, (224, 224))
            img[:, :, 1] = g_base + np.random.normal(0, 12, (224, 224))
            img[:, :, 2] = b_base + np.random.normal(0, 8, (224, 224))

            if not is_healthy:
                for _ in range(np.random.randint(5, 18)):
                    cx, cy = np.random.randint(20, 204), np.random.randint(20, 204)
                    rad = np.random.randint(8, 25)
                    yy, xx = np.ogrid[:224, :224]
                    mask = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) <= rad
                    if is_rust:
                        img[mask, 0] = np.random.uniform(180, 220)
                        img[mask, 1] = np.random.uniform(90, 130)
                        img[mask, 2] = np.random.uniform(20, 45)
                    elif is_blight:
                        img[mask, 0] = np.random.uniform(35, 75)
                        img[mask, 1] = np.random.uniform(25, 60)
                        img[mask, 2] = np.random.uniform(15, 40)
                    elif is_spot:
                        img[mask, 0] = np.random.uniform(30, 60)
                        img[mask, 1] = np.random.uniform(20, 50)
                        img[mask, 2] = np.random.uniform(10, 30)
                    elif is_virus:
                        img[mask, 0] = np.random.uniform(190, 230)
                        img[mask, 1] = np.random.uniform(190, 230)
                        img[mask, 2] = np.random.uniform(40, 80)
                    else:
                        img[mask, 0] = np.random.uniform(60, 100)
                        img[mask, 1] = np.random.uniform(50, 90)
                        img[mask, 2] = np.random.uniform(30, 50)

            img = np.clip(img, 0, 255)
            x_data.append((img / 127.5) - 1.0)
            y_data.append(class_idx)

    x_arr = np.array(x_data, dtype=np.float32)
    y_arr = np.array(y_data, dtype=np.int32)

    indices = np.random.permutation(len(x_arr))
    x_arr, y_arr = x_arr[indices], y_arr[indices]

    split = int(0.8 * len(x_arr))
    return x_arr[:split], y_arr[:split], x_arr[split:], y_arr[split:]
