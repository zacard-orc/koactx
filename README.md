# koavtx
koa 部分api实验环境，对应iOS Gateway项目  
koa+ts+tsdx

# reference
## sm3摘要
```bash
curl -H "Content-Type: application/json" \
  -X POST \
  -d '{"plain":"abcd" }'  \
  "http://127.0.0.1:3000/api/sm3" -v
  
{"RSP_HEAD":{},"RSP_BODY":{"cryptoRet":"82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e"}}
```