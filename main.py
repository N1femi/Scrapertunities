from bs4 import BeautifulSoup
import requests

response = requests.get("https://github.com/vanshb03/Summer2026-Internships")


if response.status_code == 200:
    soup = BeautifulSoup(response.text, "html.parser")
    results = soup.find_all("tbody") # We want the second one
    tbody = results[1]
    
    rows = tbody.find_all("tr")
    
    count = 0
    for row in rows:
        if "🔒" not in str(row): # Filters the locked ones
            count += 1
            cells = row.find_all("td")
            link_tag = cells[3].find("a")["href"]
            
            values = [cell.get_text(strip=True) for cell in cells]
            
            essential_info = [values[0], values[1], link_tag]
            
            if values[0] == "↳": # "Its a dropdown"
                essential_info = ["Unknown Company", values[1], link_tag]
                
            print(f"\n {essential_info}")

            
    
    
