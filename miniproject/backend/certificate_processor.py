import pytesseract
import cv2
import re
from utils.constants import POINTS_MAPPING

# Tesseract OCR path setup
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_image(image_path):
    """Extract text from an image using Tesseract OCR with improved preprocessing."""
    image = cv2.imread(image_path)
    if image is None:
        print("Error: Could not load image. Check the file path!")
        return ""

    # Preprocessing for better OCR results
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 3)  # Noise reduction
    _, thresholded = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    text = pytesseract.image_to_string(thresholded, config="--psm 6")

    print("Extracted Text:", text)  # For debugging
    return text.lower()

def clean_text(text):
    """Clean extracted text by removing noise and unwanted symbols."""
    text = re.sub(r"[^\w\s]", " ", text)  # Remove non-alphanumeric symbols
    text = re.sub(r"\s+", " ", text).strip()  # Remove extra spaces
    return text.lower()

def extract_keywords(text):
    """Improved keyword extraction with flexible patterns."""
    keywords = set()
    text = clean_text(text)
    words = text.split()

    # Special case matching for complex text
    if re.search(r"ncc.*?c\s*cert[i|l|1]ficate", text):
        keywords.add("ncc_c-certificate")
    if re.search(r"nptel.*?8\s*week", text):
        keywords.add("nptel + 8 week")
    if re.search(r"nptel.*?12\s*week", text):
        keywords.add("nptel + 12 week")
    if re.search(r"nptel.*?4\s*week", text):
        keywords.add("nptel + 4 week")

    # General keyword matching with improved regex
    for key in POINTS_MAPPING:
        if re.search(rf"\b{re.escape(key)}\b", text, re.IGNORECASE):
            keywords.add(key)

    print(f"Extracted Keywords: {keywords}")
    return keywords

def assign_points(keywords):
    """Assign points based on extracted keywords."""
    total_points = sum(POINTS_MAPPING.get(keyword, 0) for keyword in keywords)
    return total_points
