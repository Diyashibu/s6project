import requests
import urllib.request

SUPABASE_URL = "https://wqgwrbyagueyuturnjez.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZ3dyYnlhZ3VleXV0dXJuamV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODA1OTIsImV4cCI6MjA1NTk1NjU5Mn0.ZTm8s0zTkG4REUXyIznBUhzog3P-ahm8Kt-IeEhJDI0"

# Headers for Supabase requests
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def get_certificate_url(student_id):
    """Fetch the certificate URL for the given student ID from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/certificates?student_id=eq.{student_id}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200 and response.json():
        return response.json()[0]['certificate']  # Extract URL from response
    else:
        print(f"Failed to retrieve certificate for {student_id}. Error: {response.text}")
        return None

def download_certificate(image_url, save_path):
    """Download the certificate image from the given URL."""
    try:
        urllib.request.urlretrieve(image_url, save_path)
        return save_path
    except Exception as e:
        print(f"Error downloading certificate: {e}")
        return None

def update_activity_points(student_id, points):
    """Update the activity points in the Supabase database."""
    data = {
        "activity_point": points
    }

    url = f"{SUPABASE_URL}/rest/v1/certificates?student_id=eq.{student_id}"
    response = requests.patch(url, json=data, headers=HEADERS)

    if response.status_code == 204:
        print(f"Updated activity points for {student_id} successfully.")
    else:
        print(f"Failed to update activity points. Error: {response.text}")
