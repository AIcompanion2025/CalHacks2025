import sys
sys.path.insert(0, '.')
from main import app

print('Routes registered:')
for route in app.routes:
    print(f'  {route.path}')