# koavtx
koa 部分api实验环境，对应iOS Gateway项目  
koa+ts+tsdx

# How to use
```shell
yarn
yarn start # start tsdx watch
yarn ms # start mock server
```

# reference
## sm3摘要
```bash
curl -H "Content-Type: application/json" \
  -X POST \
  -d '{"plain":"abcd" }'  \
  "http://127.0.0.1:3000/api/sm3" -v
  
{
    "RSP_HEAD":{

    },
    "RSP_BODY":{
        "cryptoRet":"82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e"
    }
}

// 高优先级接口001
curl -H "Content-Type: application/json" \
  -X POST \
  -d '{"plain":"abcd" }'  \
  "http://127.0.0.1:3000/api/v1/CC0001" -v
  
// 增量接口002
curl -H "Content-Type: application/json" \
  -X POST \
  -d '{"processCode":"CC0002","pageConfigList":[{"pageCode":"BUS0005","fileTime":"33333"},{"pageCode":"TRJ0003","fileTime":"1231233"}]}'  \
  "http://127.0.0.1:3000/api/v1/CC0002" -v
 
// 补偿接口003
curl -H "Content-Type: application/json" \
  -X POST \
  -d '{"processCode":"CC0003","pageConfigList":[{"pageCode":"BUS0005","fileTime":"33333"}]}'  \
  "http://127.0.0.1:3000/api/v1/CC0003" -v
```
