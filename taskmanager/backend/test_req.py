import urllib.request, json, urllib.error
data=json.dumps({'name':'Lokesh Kumar Yadav','email':'ly1550546@gmail.com','password':'password123','role':'admin'}).encode('utf-8')
req=urllib.request.Request('http://localhost:8000/api/auth/signup', data=data, headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(e.read().decode())
