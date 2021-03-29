import Koa from "koa";
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser'

import Websocket from 'ws'


import logger from './libs/logger'
import {
    ctrPerf,
    ctrHello,
    ctrSM3,
    ctrConfHighPri,
    ctrSendDone,
    ctrCC0001,
    ctrCC0002,
    ctrCC0003,
} from './libs/controller';

const app = new Koa();
const router = new Router();


router.get('/', ctrHello);
router.post('/api/sm3', ctrSM3);
router.post('/api/v1/confHighPri', ctrConfHighPri);

// mock配置中心
router.post('/api/v1/CC0001', ctrCC0001);
router.post('/api/v1/CC0002', ctrCC0002);
router.post('/api/v1/CC0003', ctrCC0003);


app
    .use(bodyParser())
    .use(ctrPerf)
    .use(router.routes())
    .use(router.allowedMethods())
    .use(ctrSendDone)

//设置监听端口
app.listen(3000, () => {
    logger.info("Server Start 127.0.0.1:3000");
});

// export default app;

const wss = new Websocket.Server({port: 28080})
logger.info('ws started at 28080');

wss.on('connection',(ws: Websocket)=>{
    logger.info('ws found new conn: %s',ws);
    ws.on('message',(reqMsg:Websocket.Data)=>{
        logger.info('ws <= %j',reqMsg)
    })

    const replyData = {
        'Hello': 'somthing '+ Date.now()
    }
    ws.send(JSON.stringify(replyData))
    logger.info('ws => %j',replyData)
})
