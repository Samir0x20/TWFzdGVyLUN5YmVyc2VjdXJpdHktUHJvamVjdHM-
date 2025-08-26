import numpy as np
import cv2
import os
import sys

# Ensure file path is provided as an argument
if len(sys.argv) < 2:
    print("Usage: python script.py <path_to_raw_image>")
    exit()

file_path = sys.argv[1]

# Check if file exists
if not os.path.isfile(file_path):
    print("Error: File not found.")
    exit()

# Define image dimensions (modify if needed)
width, height = 1024, 1024

# Read the RAW image file
try:
    with open(file_path, 'rb') as f:
        raw_data = f.read()
    
    # Convert raw data to NumPy array and reshape
    image_data = np.frombuffer(raw_data, dtype=np.uint8).reshape((height, width))
    
    # Display the image
    cv2.imshow('Grayscale Image', image_data)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
except Exception as e:
    print(f"Error reading or processing file: {e}")