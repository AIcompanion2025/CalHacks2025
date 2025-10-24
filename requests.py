import requests

def get_api_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error making API request: {e}")
        return None
username = "alaeddine13"

# Example usage:
api_endpoint = "https://lichess.org/api/games/user/{username}?max=100&evals=true"  # A public test API
data = get_api_data(api_endpoint)

if data:
    print("Received data:")
    print(data)