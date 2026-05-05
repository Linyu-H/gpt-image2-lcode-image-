以下是我看到的一个不需要登录就能抠图的网站的请求抓包：

点击抠图后 一共有四个请求出发：

hear：

```
Request URL
https://www.koukoutu.com/api/oss/signature
Request Method
POST
Status Code
200 OK
Remote Address
[::1]:7897
Referrer Policy
strict-origin-when-cross-origin
content-type
application/json
date
Tue, 05 May 2026 08:46:43 GMT
server
nginx
vary
Accept-Encoding
vary
RSC, Next-Router-State-Tree, Next-Router-Prefetch
x-cache-status
MISS from KS-CLOUD-CHANGZ-MP-01-22
x-cache-status
MISS from KS-CLOUD-CS-CT-73-03-L
x-cdn-request-id
308186756d4f30f6fb0667fa1c13f12f
x-link-via
csct73:443;changzmp01:80;
:authority
www.koukoutu.com
:method
POST
:path
/api/oss/signature
:scheme
https
accept
application/json, text/plain, */*
accept-encoding
gzip, deflate, br, zstd
accept-language
zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7
cache-control
no-cache
content-length
522
content-type
multipart/form-data; boundary=----WebKitFormBoundaryfklL91aMhFtA3p3p
cookie
__51vcke__3OTJa7WI4sy7bd8q=fe40e85f-e5b4-50b1-859e-fc7ae25a8518; __51vuft__3OTJa7WI4sy7bd8q=1775733616671; __51uvsct__3OTJa7WI4sy7bd8q=3; Hm_lvt_e43c83ba27d6f18f896dc53add1538d8=1775733617,1777481949,1777861514,1777970147; Hm_lpvt_e43c83ba27d6f18f896dc53add1538d8=1777970147; HMACCOUNT=5586D2CED5E30007
origin
https://www.koukoutu.com
pragma
no-cache
priority
u=1, i
referer
https://www.koukoutu.com/removebgtool/all
sec-ch-ua
"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"macOS"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36
```



Preview：	

```
{success: true, action: "ucoss",…}
action
: 
"ucoss"
message
: 
{code: 200, key: "2026-05-05/16/1777970803016YbZr5E6NvE.jpg", dir: "2026-05-05/16",…}
code
: 
200
dir
: 
"2026-05-05/16"
host
: 
"//ktimghb.koukoutu.com/"
key
: 
"2026-05-05/16/1777970803016YbZr5E6NvE.jpg"
token
: 
"UCloud TOKEN_20f44506-f2e2-420d-9dde-a46845f95657:VR3/P5k+pkkvNchkygt1WzSTiEw="
success
: 
true
```

response:

```
{
    "success": true,
    "action": "ucoss",
    "message": {
        "code": 200,
        "key": "2026-05-05/16/1777970803016YbZr5E6NvE.jpg",
        "dir": "2026-05-05/16",
        "host": "//ktimghb.koukoutu.com/",
        "token": "UCloud TOKEN_20f44506-f2e2-420d-9dde-a46845f95657:VR3/P5k+pkkvNchkygt1WzSTiEw="
    }
}
```



第二个请求：

header:

```
Request URL
https://www.koukoutu.com/api/oss/signature
Request Method
POST
Status Code
200 OK
Remote Address
[::1]:7897
Referrer Policy
strict-origin-when-cross-origin
content-type
application/json
date
Tue, 05 May 2026 08:46:43 GMT
server
nginx
vary
Accept-Encoding
vary
RSC, Next-Router-State-Tree, Next-Router-Prefetch
x-cache-status
MISS from KS-CLOUD-HUZ-MP-04-07
x-cache-status
MISS from KS-CLOUD-CS-CT-73-14-L
x-cdn-request-id
86c28b8a9237026369fa82c5a22b0e81
x-link-via
csct73:443;huzmp04:80;
:authority
www.koukoutu.com
:method
POST
:path
/api/oss/signature
:scheme
https
accept
application/json, text/plain, */*
accept-encoding
gzip, deflate, br, zstd
accept-language
zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7
cache-control
no-cache
content-length
619
content-type
multipart/form-data; boundary=----WebKitFormBoundary8NfvI1rTgV5pMEou
cookie
__51vcke__3OTJa7WI4sy7bd8q=fe40e85f-e5b4-50b1-859e-fc7ae25a8518; __51vuft__3OTJa7WI4sy7bd8q=1775733616671; __51uvsct__3OTJa7WI4sy7bd8q=3; Hm_lvt_e43c83ba27d6f18f896dc53add1538d8=1775733617,1777481949,1777861514,1777970147; Hm_lpvt_e43c83ba27d6f18f896dc53add1538d8=1777970147; HMACCOUNT=5586D2CED5E30007
origin
https://www.koukoutu.com
pragma
no-cache
priority
u=1, i
referer
https://www.koukoutu.com/removebgtool/all
sec-ch-ua
"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"macOS"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36
```

preview:

```
{success: true, action: "ucoss",…}
action
: 
"ucoss"
message
: 
{code: 200, key: "2026-05-05/16/1777970803213jn56pHk9Gu.jpg", dir: "2026-05-05/16",…}
code
: 
200
dir
: 
"2026-05-05/16"
host
: 
"//ktimghb.koukoutu.com/"
key
: 
"2026-05-05/16/1777970803213jn56pHk9Gu.jpg"
token
: 
"UCloud TOKEN_20f44506-f2e2-420d-9dde-a46845f95657:De342PqmaF1LzsFvQlccy1wXOVg="
success
: 
true
```

Response:

```	
{
    "success": true,
    "action": "ucoss",
    "message": {
        "code": 200,
        "key": "2026-05-05/16/1777970803213jn56pHk9Gu.jpg",
        "dir": "2026-05-05/16",
        "host": "//ktimghb.koukoutu.com/",
        "token": "UCloud TOKEN_20f44506-f2e2-420d-9dde-a46845f95657:De342PqmaF1LzsFvQlccy1wXOVg="
    }
}
```

第三个请求：

```
Request URL
https://www.koukoutu.com/api/segment
Request Method
POST
Status Code
200 OK
Remote Address
[::1]:7897
Referrer Policy
strict-origin-when-cross-origin
content-type
application/json
date
Tue, 05 May 2026 08:46:44 GMT
server
nginx
vary
Accept-Encoding
vary
RSC, Next-Router-State-Tree, Next-Router-Prefetch
x-cache-status
MISS from KS-CLOUD-JN-MP-31-15
x-cache-status
MISS from KS-CLOUD-CS-CT-73-07-L
x-cdn-request-id
67155b68cf9a0267a2ec33bf5f697837
x-link-via
csct73:443;jnmp31:80;
:authority
www.koukoutu.com
:method
POST
:path
/api/segment
:scheme
https
accept
application/json, text/plain, */*
accept-encoding
gzip, deflate, br, zstd
accept-language
zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7
authorization
cache-control
no-cache
content-length
9979
content-type
multipart/form-data; boundary=----WebKitFormBoundaryasPnEmpnxqooD1J6
cookie
__51vcke__3OTJa7WI4sy7bd8q=fe40e85f-e5b4-50b1-859e-fc7ae25a8518; __51vuft__3OTJa7WI4sy7bd8q=1775733616671; __51uvsct__3OTJa7WI4sy7bd8q=3; Hm_lvt_e43c83ba27d6f18f896dc53add1538d8=1775733617,1777481949,1777861514,1777970147; Hm_lpvt_e43c83ba27d6f18f896dc53add1538d8=1777970147; HMACCOUNT=5586D2CED5E30007
origin
https://www.koukoutu.com
pragma
no-cache
priority
u=1, i
referer
https://www.koukoutu.com/removebgtool/all
sec-ch-ua
"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"macOS"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36
```

preview:

```
{success: true, message: {code: 200, taskId: 31316126}}
message
: 
{code: 200, taskId: 31316126}
code
: 
200
taskId
: 
31316126
success
: 
true
```

response:

```
{"success":true,"message":{"code":200,"taskId":31316126}}
```



第四个请求：

Header:

```
Request URL
https://www.koukoutu.com/api/query
Request Method
POST
Status Code
200 OK
Remote Address
[::1]:7897
Referrer Policy
strict-origin-when-cross-origin
content-type
application/json
date
Tue, 05 May 2026 08:46:45 GMT
server
nginx
vary
Accept-Encoding
vary
RSC, Next-Router-State-Tree, Next-Router-Prefetch
x-cache-status
MISS from KS-CLOUD-YANC-MP-31-28
x-cache-status
MISS from KS-CLOUD-CS-CT-73-05-L
x-cdn-request-id
2fd18fa6bf56732fa1d0860c33705369
x-link-via
csct73:443;yancmp31:80;
:authority
www.koukoutu.com
:method
POST
:path
/api/query
:scheme
https
accept
application/json, text/plain, */*
accept-encoding
gzip, deflate, br, zstd
accept-language
zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7
cache-control
no-cache
content-length
332
content-type
multipart/form-data; boundary=----WebKitFormBoundarymoTe8yAyaHeE7mSV
cookie
__51vcke__3OTJa7WI4sy7bd8q=fe40e85f-e5b4-50b1-859e-fc7ae25a8518; __51vuft__3OTJa7WI4sy7bd8q=1775733616671; __51uvsct__3OTJa7WI4sy7bd8q=3; Hm_lvt_e43c83ba27d6f18f896dc53add1538d8=1775733617,1777481949,1777861514,1777970147; Hm_lpvt_e43c83ba27d6f18f896dc53add1538d8=1777970147; HMACCOUNT=5586D2CED5E30007
origin
https://www.koukoutu.com
pragma
no-cache
priority
u=1, i
referer
https://www.koukoutu.com/removebgtool/all
sec-ch-ua
"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"macOS"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36
```

Preview:

```
{success: true,…}
message
: 
{code: 200, message: "success", taskId: "31316126", detailinfo: "", process: 100, position: 0,…}
code
: 
200
detailinfo
: 
""
message
: 
"success"
position
: 
0
process
: 
100
resultpath
: 
"https://ktimghb.koukoutu.com/matting/2026/05/05/31316126uppmf.webp?UCloudPublicKey=TOKEN_20f44506-f2e2-420d-9dde-a46845f95657&Signature=6cRqEgB3ygYqJ8aSL1wtbX5rmzU%3D&Expires=1777972005"
taskId
: 
"31316126"
success
: 
true
```

response:

```
{
    "success": true,
    "message": {
        "code": 200,
        "message": "success",
        "taskId": "31316126",
        "detailinfo": "",
        "process": 100,
        "position": 0,
        "resultpath": "https://ktimghb.koukoutu.com/matting/2026/05/05/31316126uppmf.webp?UCloudPublicKey=TOKEN_20f44506-f2e2-420d-9dde-a46845f95657&Signature=6cRqEgB3ygYqJ8aSL1wtbX5rmzU%3D&Expires=1777972005"
    }
}
```

网站官网：https://www.koukoutu.com/