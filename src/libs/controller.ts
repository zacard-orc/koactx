// import fs from 'fs';
// import dayjs from 'dayjs';
//
//

import logger from "./logger";
import Koa from "koa";
import {Socket} from "net";

import sm from 'sm-crypto'

export const ctrPerf = (ctx:Koa.ExtendableContext,next:Koa.Next)=>{
    const {
        url
    } = ctx.request;
    logger.debug('<= url %s',url)
    logger.debug('<= headers %j',ctx.request.headers)
    if(ctx.request.body){
        logger.debug('<= body %j',ctx.request.body)
    }

    const tsStart = Date.now();

    (ctx.res.socket as Socket).on('finish',()=>{
        const tsDiff = Date.now() - tsStart
        logger.debug('=> url %s ttl=%d',url, tsDiff)
    })

    next()
}

export const ctrHello = (ctx:Koa.ExtendableContext, next:Koa.Next) => {
    ctx.append('resultCode', '0000');
    ctx.body = 'Hello test'
    next();
}

export const ctrSM3 = (ctx:Koa.ExtendableContext,next:Koa.Next)=>{
    const payload: sm3Request = (ctx.request.body as sm3Request);
    const {
        plain
    } = payload;
    const { sm3 } = sm;

    const crypto: sm3Response = {
        cryptoRet: sm3(plain)
    }

    const ret: gmResponse<any, sm3Response> = {
        RSP_HEAD: {},
        RSP_BODY: crypto
    }
    ctx.body = ret

    next();
}