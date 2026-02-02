import requests
import sys

url = "https://jbkfsvinitavzyflcuwg.supabase.co/functions/v1/tripo-file-proxy"
params = {"url": "https://www.google.com/robots.txt"}

try:
    print(f"Requesting {url} with params {params}...")
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    print("Response Headers:", response.headers)
    print("Response Body:", response.text)
except Exception as e:
    print(f"Error: {e}")
