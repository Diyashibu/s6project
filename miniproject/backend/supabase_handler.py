import requests
import urllib.request

SUPABASE_URL = "https://wqgwrbyagueyuturnjez.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZ3dyYnlhZ3VleXV0dXJuamV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODA1OTIsImV4cCI6MjA1NTk1NjU5Mn0.ZTm8s0zTkG4REUXyIznBUhzog3P-ahm8Kt-IeEhJDI0"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def get_certificates():
    """Fetch all certificate records from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/certificates"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to retrieve certificates. Error: {response.text}")
        return []

import os

def download_certificate(image_url, save_path):
    """Download the certificate image from the given URL."""
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        urllib.request.urlretrieve(image_url, save_path)
        print(f"Downloaded certificate: {save_path}")
        return save_path
    except Exception as e:
        print(f"Error downloading certificate: {e}")
        return None

def update_certificate_points(record_id, points):
    """Update the activity points for each unique record in Supabase."""
    data = {
        "activity_point": points
    }

    url = f"{SUPABASE_URL}/rest/v1/certificates"
    data["id"] = record_id  # Ensure ID is included in the body

    response = requests.patch(url, json=[data], headers=HEADERS)  # Send as a list


    if response.status_code == 204:
        print(f"Updated activity points for record {record_id} successfully.")
    else:
        print(f"Failed to update activity points for record {record_id}. Error: {response.text}")
