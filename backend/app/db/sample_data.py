"""
DataSpeak Backend — Sample E-Commerce Database Generator
Generates and seeds a realistic local SQLite e-commerce database for instant testing.
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

from app.core.logging import get_logger

logger = get_logger("sample_data")

# Default relative location inside backend folder
DEFAULT_SAMPLE_DB_PATH = Path(__file__).resolve().parent.parent.parent / "demo_ecommerce.db"


def get_sample_db_path() -> Path:
    """Return the absolute path to the demo SQLite file."""
    return DEFAULT_SAMPLE_DB_PATH


def create_sample_database(db_path: Path | str = DEFAULT_SAMPLE_DB_PATH, force_recreate: bool = False) -> str:
    """
    Creates and populates the sample SQLite e-commerce database if not present.
    Returns the absolute path string to the database file.
    """
    target_path = Path(db_path).resolve()

    if target_path.exists() and not force_recreate:
        logger.debug("Sample database already exists", path=str(target_path))
        return str(target_path)

    logger.info("Initializing sample e-commerce database", path=str(target_path))
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if target_path.exists():
        target_path.unlink()

    conn = sqlite3.connect(str(target_path))
    cursor = conn.cursor()

    try:
        # Enable Foreign Key enforcement in SQLite
        cursor.execute("PRAGMA foreign_keys = ON;")

        # ── 1. Create Tables ─────────────────────────────────────────────────
        cursor.execute("""
            CREATE TABLE customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                city TEXT NOT NULL,
                country TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT
            );
        """)

        cursor.execute("""
            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                price REAL NOT NULL,
                stock_quantity INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                order_date TIMESTAMP NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('completed', 'shipped', 'processing', 'cancelled')),
                total_amount REAL NOT NULL,
                shipping_city TEXT NOT NULL,
                FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                comment TEXT,
                review_date TIMESTAMP NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
            );
        """)

        # ── 2. Seed Categories ───────────────────────────────────────────────
        categories = [
            (1, "Electronics", "Computers, audio, smartphones, and gadgets"),
            (2, "Apparel", "Clothing, shoes, and lifestyle accessories"),
            (3, "Home & Kitchen", "Cookware, furniture, smart home, and decor"),
            (4, "Books", "Technical, business, and fiction books"),
            (5, "Fitness", "Gym equipment, athletic gear, and supplements"),
        ]
        cursor.executemany("INSERT INTO categories (id, name, description) VALUES (?, ?, ?);", categories)

        # ── 3. Seed Customers ────────────────────────────────────────────────
        now = datetime.now()
        customers = [
            (1, "Alice", "Smith", "alice.smith@example.com", "San Francisco", "USA", (now - timedelta(days=320)).isoformat()),
            (2, "Bob", "Jones", "bob.jones@example.com", "New York", "USA", (now - timedelta(days=280)).isoformat()),
            (3, "Clara", "Muller", "clara.muller@example.de", "Berlin", "Germany", (now - timedelta(days=250)).isoformat()),
            (4, "David", "Kim", "david.kim@example.kr", "Seoul", "South Korea", (now - timedelta(days=210)).isoformat()),
            (5, "Elena", "Rostova", "elena.rostova@example.com", "London", "UK", (now - timedelta(days=190)).isoformat()),
            (6, "Felipe", "Silva", "felipe.silva@example.br", "Sao Paulo", "Brazil", (now - timedelta(days=175)).isoformat()),
            (7, "Grace", "Hopper", "grace.hopper@example.com", "Boston", "USA", (now - timedelta(days=160)).isoformat()),
            (8, "Haruki", "Tanaka", "haruki.tanaka@example.jp", "Tokyo", "Japan", (now - timedelta(days=140)).isoformat()),
            (9, "Inez", "Garcia", "inez.garcia@example.es", "Madrid", "Spain", (now - timedelta(days=120)).isoformat()),
            (10, "Jamal", "Nasser", "jamal.nasser@example.ae", "Dubai", "UAE", (now - timedelta(days=100)).isoformat()),
            (11, "Karen", "Chen", "karen.chen@example.tw", "Taipei", "Taiwan", (now - timedelta(days=80)).isoformat()),
            (12, "Lucas", "Dubois", "lucas.dubois@example.fr", "Paris", "France", (now - timedelta(days=60)).isoformat()),
            (13, "Mia", "Patel", "mia.patel@example.in", "Mumbai", "India", (now - timedelta(days=40)).isoformat()),
            (14, "Noah", "Williams", "noah.williams@example.au", "Sydney", "Australia", (now - timedelta(days=30)).isoformat()),
            (15, "Olivia", "Brown", "olivia.brown@example.ca", "Toronto", "Canada", (now - timedelta(days=15)).isoformat()),
        ]
        cursor.executemany(
            "INSERT INTO customers (id, first_name, last_name, email, city, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);",
            customers,
        )

        # ── 4. Seed Products ─────────────────────────────────────────────────
        products = [
            (1, "Noise-Cancelling Headphones", 1, 299.99, 45, (now - timedelta(days=300)).isoformat()),
            (2, "Ultra-Wide Gaming Monitor 34-inch", 1, 649.50, 18, (now - timedelta(days=290)).isoformat()),
            (3, "Mechanical Ergonomic Keyboard", 1, 149.00, 80, (now - timedelta(days=270)).isoformat()),
            (4, "Wireless Vertical Mouse", 1, 79.99, 120, (now - timedelta(days=260)).isoformat()),
            (5, "Merino Wool Travel Hoodie", 2, 119.00, 65, (now - timedelta(days=250)).isoformat()),
            (6, "Breathable Running Shoes", 2, 139.95, 40, (now - timedelta(days=240)).isoformat()),
            (7, "Classic Cotton Oxford Shirt", 2, 65.00, 95, (now - timedelta(days=230)).isoformat()),
            (8, "Pour-Over Precision Coffee Maker", 3, 89.00, 35, (now - timedelta(days=220)).isoformat()),
            (9, "Cast Iron Dutch Oven 6-Quart", 3, 115.50, 25, (now - timedelta(days=210)).isoformat()),
            (10, "Smart Air Purifier with HEPA", 3, 199.00, 50, (now - timedelta(days=200)).isoformat()),
            (11, "Designing Data-Intensive Applications", 4, 44.99, 150, (now - timedelta(days=190)).isoformat()),
            (12, "Clean Code by Robert Martin", 4, 38.50, 110, (now - timedelta(days=180)).isoformat()),
            (13, "Site Reliability Engineering", 4, 49.00, 90, (now - timedelta(days=170)).isoformat()),
            (14, "Adjustable Quick-Select Dumbbell Set", 5, 349.00, 20, (now - timedelta(days=160)).isoformat()),
            (15, "Premium Non-Slip Yoga Mat", 5, 58.00, 75, (now - timedelta(days=150)).isoformat()),
            (16, "Hydro-Insulated Water Bottle 32oz", 5, 34.99, 140, (now - timedelta(days=140)).isoformat()),
            (17, "4K USB-C Streaming Webcam", 1, 129.99, 55, (now - timedelta(days=130)).isoformat()),
            (18, "Stainless Steel Kitchen Knife Block Set", 3, 169.00, 30, (now - timedelta(days=120)).isoformat()),
            (19, "Windproof Packable Jacket", 2, 89.95, 50, (now - timedelta(days=110)).isoformat()),
            (20, "Resistance Bands Exercise Set", 5, 29.99, 130, (now - timedelta(days=100)).isoformat()),
        ]
        cursor.executemany(
            "INSERT INTO products (id, name, category_id, price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?, ?);",
            products,
        )

        # ── 5. Seed Orders ───────────────────────────────────────────────────
        orders = [
            (1, 1, (now - timedelta(days=120)).isoformat(), "completed", 448.99, "San Francisco"),
            (2, 2, (now - timedelta(days=115)).isoformat(), "completed", 649.50, "New York"),
            (3, 3, (now - timedelta(days=110)).isoformat(), "completed", 163.99, "Berlin"),
            (4, 4, (now - timedelta(days=105)).isoformat(), "shipped", 149.00, "Seoul"),
            (5, 5, (now - timedelta(days=100)).isoformat(), "completed", 378.00, "London"),
            (6, 6, (now - timedelta(days=95)).isoformat(), "completed", 204.95, "Sao Paulo"),
            (7, 7, (now - timedelta(days=90)).isoformat(), "completed", 89.00, "Boston"),
            (8, 8, (now - timedelta(days=85)).isoformat(), "cancelled", 299.99, "Tokyo"),
            (9, 9, (now - timedelta(days=80)).isoformat(), "completed", 349.00, "Madrid"),
            (10, 10, (now - timedelta(days=75)).isoformat(), "completed", 428.99, "Dubai"),
            (11, 11, (now - timedelta(days=70)).isoformat(), "shipped", 92.99, "Taipei"),
            (12, 12, (now - timedelta(days=65)).isoformat(), "completed", 115.50, "Paris"),
            (13, 13, (now - timedelta(days=60)).isoformat(), "completed", 132.49, "Mumbai"),
            (14, 14, (now - timedelta(days=55)).isoformat(), "completed", 129.99, "Sydney"),
            (15, 15, (now - timedelta(days=50)).isoformat(), "processing", 199.00, "Toronto"),
            (16, 1, (now - timedelta(days=45)).isoformat(), "completed", 79.99, "San Francisco"),
            (17, 2, (now - timedelta(days=40)).isoformat(), "completed", 119.00, "New York"),
            (18, 3, (now - timedelta(days=35)).isoformat(), "shipped", 169.00, "Berlin"),
            (19, 4, (now - timedelta(days=30)).isoformat(), "completed", 299.99, "Seoul"),
            (20, 5, (now - timedelta(days=25)).isoformat(), "completed", 64.98, "London"),
            (21, 6, (now - timedelta(days=20)).isoformat(), "processing", 139.95, "Sao Paulo"),
            (22, 7, (now - timedelta(days=15)).isoformat(), "completed", 228.99, "Boston"),
            (23, 8, (now - timedelta(days=10)).isoformat(), "completed", 349.00, "Tokyo"),
            (24, 9, (now - timedelta(days=5)).isoformat(), "processing", 87.99, "Madrid"),
            (25, 10, (now - timedelta(days=2)).isoformat(), "processing", 149.00, "Dubai"),
        ]
        cursor.executemany(
            "INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (?, ?, ?, ?, ?, ?);",
            orders,
        )

        # ── 6. Seed Order Items ──────────────────────────────────────────────
        order_items = [
            (1, 1, 1, 1, 299.99),
            (2, 1, 3, 1, 149.00),
            (3, 2, 2, 1, 649.50),
            (4, 3, 5, 1, 119.00),
            (5, 3, 11, 1, 44.99),
            (6, 4, 3, 1, 149.00),
            (7, 5, 6, 2, 139.95),
            (8, 5, 12, 1, 38.50),
            (9, 6, 7, 1, 65.00),
            (10, 6, 6, 1, 139.95),
            (11, 7, 8, 1, 89.00),
            (12, 8, 1, 1, 299.99),
            (13, 9, 14, 1, 349.00),
            (14, 10, 1, 1, 299.99),
            (15, 10, 17, 1, 129.99),
            (16, 11, 15, 1, 58.00),
            (17, 11, 16, 1, 34.99),
            (18, 12, 9, 1, 115.50),
            (19, 13, 11, 1, 44.99),
            (20, 13, 12, 1, 38.50),
            (21, 13, 13, 1, 49.00),
            (22, 14, 17, 1, 129.99),
            (23, 15, 10, 1, 199.00),
            (24, 16, 4, 1, 79.99),
            (25, 17, 5, 1, 119.00),
            (26, 18, 18, 1, 169.00),
            (27, 19, 1, 1, 299.99),
            (28, 20, 16, 1, 34.99),
            (29, 20, 20, 1, 29.99),
            (30, 21, 6, 1, 139.95),
            (31, 22, 3, 1, 149.00),
            (32, 22, 4, 1, 79.99),
            (33, 23, 14, 1, 349.00),
            (34, 24, 15, 1, 58.00),
            (35, 24, 20, 1, 29.99),
            (36, 25, 3, 1, 149.00),
        ]
        cursor.executemany(
            "INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?);",
            order_items,
        )

        # ── 7. Seed Reviews ──────────────────────────────────────────────────
        reviews = [
            (1, 1, 1, 5, "Exceptional noise cancellation and battery life. Perfect for remote work.", (now - timedelta(days=100)).isoformat()),
            (2, 2, 2, 5, "Stunning colors and ultra-wide productivity space. Zero regrets.", (now - timedelta(days=95)).isoformat()),
            (3, 3, 4, 4, "Tactile switches feel fantastic, though takes a couple of days to get used to.", (now - timedelta(days=90)).isoformat()),
            (4, 5, 3, 5, "Soft, odor-resistant, and great fit for long international flights.", (now - timedelta(days=80)).isoformat()),
            (5, 8, 7, 4, "Brews exceptionally clean coffee. The glass carafe feels high quality.", (now - timedelta(days=70)).isoformat()),
            (6, 9, 12, 5, "Even heat distribution. Sturdy kitchen staple that will last decades.", (now - timedelta(days=60)).isoformat()),
            (7, 11, 13, 5, "Must-read for every backend and data engineer. Masterpiece.", (now - timedelta(days=50)).isoformat()),
            (8, 14, 9, 4, "Mechanism switches smoothly between weights. Saves huge amount of gym space.", (now - timedelta(days=40)).isoformat()),
            (9, 17, 10, 4, "Sharp 4K video and clear microphone audio for team video calls.", (now - timedelta(days=30)).isoformat()),
            (10, 16, 5, 5, "Keeps iced water freezing cold all day long in the gym.", (now - timedelta(days=20)).isoformat()),
        ]
        cursor.executemany(
            "INSERT INTO reviews (id, product_id, customer_id, rating, comment, review_date) VALUES (?, ?, ?, ?, ?, ?);",
            reviews,
        )

        conn.commit()
        logger.info("Sample e-commerce database seeded successfully", path=str(target_path))
        return str(target_path)

    finally:
        conn.close()
