import requests

url = "https://statelystatic-siprakerin-embedding.hf.space/embed"
payload = {"text": "Hello world, this is a test"}

print(f"Testing custom embedding API")
print(f"URL: {url}")
print(f"Payload: {payload}")
print("\nSending request...")

try:
    response = requests.post(url, json=payload, timeout=30)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Success!")
        
        if "embedding" in result:
            embedding = result["embedding"]
            print(f"  - Dimensions: {len(embedding)}")
            print(f"  - First 5: {embedding[:5]}")
            print(f"  - Last 5: {embedding[-5:]}")
        else:
            print(f"  - Keys: {result.keys()}")
    else:
        print(f"❌ Error: {response.text}")
        
except Exception as e:
    print(f"❌ Exception: {e}")
