import os
import time
import urllib.request
from supabase import create_client, Client
from certificate_processor import extract_text_from_image, extract_keywords, assign_points

SUPABASE_URL = "https://wqgwrbyagueyuturnjez.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZ3dyYnlhZ3VleXV0dXJuamV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODA1OTIsImV4cCI6MjA1NTk1NjU5Mn0.ZTm8s0zTkG4REUXyIznBUhzog3P-ahm8Kt-IeEhJDI0"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Ensure data folder exists
DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

def get_new_certificates():
    """Fetch newly added and unprocessed certificates from Supabase."""
    try:
        response = (
            supabase.table("certificates")
            .select("*")
            .filter("processed", "eq", False)  # Fetch where processed is False
            .execute()
        )

        if response.data:
            print(f"📥 Fetched {len(response.data)} new certificate(s).")
            return response.data
        else:
            print("✅ No new certificates found.")
            return []

    except Exception as e:
        print(f"❌ Error fetching certificates: {e}")
        return []

def download_certificate(image_url, save_path):
    """Download the certificate image from the given URL."""
    if not image_url.startswith("http"):
        print(f"❌ Invalid URL: {image_url}")
        return False
    try:
        urllib.request.urlretrieve(image_url, save_path)
        print(f"✅ Downloaded certificate: {save_path}")
        return True
    except Exception as e:
        print(f"❌ Error downloading certificate: {e}")
        return False

def update_certificate_status(record_id, activity_point):
    """Update certificate as processed and store activity points in Supabase."""
    try:
        data = {
            "processed": True,
            "activity_point": activity_point
        }

        response = (
            supabase.table("certificates")
            .update(data)
            .eq("id", record_id)  
            .execute()
        )

        if response.data:
            print(f"✅ Updated record {record_id} with {activity_point} points.")
        else:
            print(f"❌ Failed to update record {record_id}. Response: {response}")

    except Exception as e:
        print(f"❌ Error updating record {record_id}: {e}")

def process_certificates():
    """Process new certificates: download, extract text, and update status."""
    certificates = get_new_certificates()

    for record in certificates:
        print(f"🔄 Processing record ID {record['id']} for student {record['student_id']}")

        image_url = record["certificate"]
        filename = os.path.basename(image_url)
        save_path = os.path.join(DATA_DIR, filename)

        if download_certificate(image_url, save_path):
            # Extract text from image
            extracted_text = extract_text_from_image(save_path)
            print(f"📝 Extracted Text: {extracted_text}")

            # Extract keywords
            keywords = extract_keywords(extracted_text)
            print(f"🔑 Extracted Keywords: {keywords}")

            # Assign points
            activity_point = assign_points(keywords)
            print(f"🏆 Assigned Activity Points: {activity_point}")

            # Update database
            update_certificate_status(record["id"], activity_point)
        else:
            print(f"❌ Failed to process certificate for record ID {record['id']}")

def listen_for_new_certificates():
    """Continuously listen for new certificates and process them."""
    print("🚀 Listening for new certificates...")

    while True:
        process_certificates()
        time.sleep(2)  # Check every 10 seconds

if __name__ == "__main__":
    listen_for_new_certificates()
