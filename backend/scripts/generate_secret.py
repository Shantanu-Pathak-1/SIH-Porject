#!/usr/bin/env python3
"""
GeoAlert-NER — Cryptographically Secure Secret Key Generator

Generates a 256-bit cryptographically secure random hex secret string
suitable for the SECRET_KEY setting in production environments.

Usage:
    python scripts/generate_secret.py

Safety:
    - This script only prints the generated secret to stdout.
    - It NEVER writes to, modifies, or overwrites any .env file.
    - NEVER commit the output of this script to version control.
"""

import secrets
import sys


def generate_secret_key(length_bytes: int = 32) -> str:
    """Generate a high-entropy hex-encoded secret token (default: 256 bits / 32 bytes)."""
    return secrets.token_hex(length_bytes)


def main():
    secret = generate_secret_key(32)
    # Output solely the secret token so it can be captured in shell scripts if desired
    # e.g., SECRET=$(python scripts/generate_secret.py)
    print(secret)


if __name__ == "__main__":
    main()
