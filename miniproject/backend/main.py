from certificate_processor import extract_text_from_image, extract_keywords, assign_points
from supabase_handler import get_certificates, download_certificate, update_certificate_points

import os

def process_certificates():
    """Complete pipeline: Download certificates, extract text, assign points, and update Supabase."""
    records = get_certificates()

    for record in records:
        student_id = record['student_id']
        certificate_url = record['certificate']

        # Unique filename for each certificate
        image_path = f"data/{student_id}_{record['id']}.png"

        # Download certificate
        if not download_certificate(certificate_url, image_path):
            print(f"Failed to download certificate {record['id']}.")
            continue

        # Extract text and calculate points
        extracted_text = extract_text_from_image(image_path)
        keywords = extract_keywords(extracted_text)
        points = assign_points(keywords)

        # Update activity points for each record
        update_certificate_points(record['id'], points)

        print({
            "Record ID": record['id'],
            "Student ID": student_id,
            "Keywords": list(keywords),
            "Total Points": points
        })

if __name__ == "__main__":
    process_certificates()
