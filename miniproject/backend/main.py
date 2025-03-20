from certificate_processor import extract_text_from_image, extract_keywords, assign_points
from supabase_handler import get_certificate_url, download_certificate, update_activity_points
import os

def process_certificate(student_id):
    """Complete pipeline: Download certificate, extract text, assign points, and update Supabase."""
    certificate_url = get_certificate_url(student_id)
    if not certificate_url:
        print("Certificate URL not found.")
        return

    # Download and save the certificate locally
    image_path = f"data/{student_id}.png"
    if not download_certificate(certificate_url, image_path):
        print("Certificate download failed.")
        return

    # Extract text and calculate points
    extracted_text = extract_text_from_image(image_path)
    keywords = extract_keywords(extracted_text)
    points = assign_points(keywords)

    # Update Supabase
    update_activity_points(student_id, points)

    print({
        "Keywords": list(keywords),
        "Total Points": points
    })

if __name__ == "__main__":
    student_id = "MDL22CS075"
    process_certificate(student_id)
