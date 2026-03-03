from bs4 import BeautifulSoup
import requests

response = requests.get("https://github.com/vanshb03/Summer2026-Internships")


if response.status_code == 200:
    soup = BeautifulSoup(response.text, "html.parser")
    results = soup.find_all("tbody") # We want the second one
    tbody = results[1]
    
    rows = tbody.find_all("tr")
    
    for row in rows:
        if "🔒" not in str(row): # Filters the locked ones
            print(f"\n NEW ROW!!! --> {row} \n ")
            
    
    
