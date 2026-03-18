"""Scrapertunities scraper.

This script scrapes the GitHub repo tracking internship + scholarship listings and
writes the results to a local `listings.json` file.

Usage:
  python main.py

The front-end (app.js) loads `listings.json` at runtime and renders the cards.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup


GITHUB_LISTINGS_URL = "https://github.com/vanshb03/Summer2026-Internships"
LISTINGS_JSON_PATH = Path(__file__).resolve().parent / "listings.json"


def _parse_deadline(raw: str) -> date | None:
    """Parse a deadline like 'Mar 18' into a date (assumes current year)."""
    raw = raw.strip()
    if not raw:
        return None

    try:
        dt = datetime.strptime(raw, "%b %d")
    except ValueError:
        return None

    year = date.today().year
    parsed = date(year, dt.month, dt.day)

    # If the date already passed this year, assume it's next year.
    if parsed < date.today():
        parsed = date(year + 1, dt.month, dt.day)

    return parsed


def _normalize_location(raw: str) -> str:
    """Turn a location string into one of: remote, hybrid, onsite."""
    r = raw.strip().lower()
    if not r:
        return "remote"
    if "remote" in r:
        return "remote"
    if "hybrid" in r:
        return "hybrid"
    return "onsite"


def _infer_type(company: str, role: str) -> str:
    """Guess if a listing is an internship or scholarship."""
    text = f"{company} {role}".lower()
    return "scholarship" if "scholarship" in text else "internship"


def fetch_listings() -> list[dict[str, Any]]:
    """Fetch and parse the listing table from the GitHub repo."""

    resp = requests.get(GITHUB_LISTINGS_URL)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    tbodies = soup.find_all("tbody")
    if len(tbodies) < 2:
        raise RuntimeError(
            "Unexpected GitHub page structure; could not find the listings table."
        )

    tbody = tbodies[1]
    rows = tbody.find_all("tr")

    listings: list[dict[str, Any]] = []
    today = date.today()

    for row in rows:
        # Skip locked suggestions
        if "🔒" in str(row):
            continue

        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        company = cells[0].get_text(strip=True)
        role = cells[1].get_text(strip=True)
        location = cells[2].get_text(strip=True)
        deadline_raw = cells[4].get_text(strip=True)

        if company == "↳":
            company = "Unknown Company"

        deadline = _parse_deadline(deadline_raw)

        listings.append(
            {
                "company": company,
                "role": role,
                "location": _normalize_location(location),
                "deadline": deadline.isoformat() if deadline else "",
                "added": today.isoformat(),
                "type": _infer_type(company, role),
                "url": (cells[3].find("a")["href"] if cells[3].find("a") else ""),
            }
        )

    return listings


def main() -> None:
    listings = fetch_listings()

    if not listings:
        print("No listings found (the source table may have changed).")
        return

    LISTINGS_JSON_PATH.write_text(json.dumps(listings, indent=2), encoding="utf-8")
    print(f"Wrote {len(listings)} listings to {LISTINGS_JSON_PATH}")


if __name__ == "__main__":
    main()
