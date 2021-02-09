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
  
=> 66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0
```