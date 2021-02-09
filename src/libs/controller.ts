import Koa from "koa";

import fs from 'fs';
import path from 'path';
// import dayjs from 'dayjs';
//


import logger from "./logger";
import {Socket} from "net";
import {zipFiles} from './utils'

import sm from 'sm-crypto'

export const ctrPerf = (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const {
        url
    } = ctx.request;
    logger.debug('<= url %s', url)
    logger.debug('<= headers %j', ctx.request.headers)
    if (ctx.request.body) {
        logger.debug('<= body %j', ctx.request.body)
    }

    const tsStart = Date.now();

    (ctx.res.socket as Socket).on('finish', () => {
        const tsDiff = Date.now() - tsStart
        logger.debug('=> url %s ttl=%d', url, tsDiff)
    })

    next()
}

export const ctrHello = (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    ctx.append('resultCode', '0000');
    ctx.body = 'Hello 7777'
    next();
}

export const ctrSM3 = (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const payload: sm3Request = (ctx.request.body as sm3Request);
    const {
        plain
    } = payload;
    const {sm3} = sm;

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

/*
 高优先级接口
 */
export const ctrConfHighPri = async (_ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const prefix = '../src/Files';
    const dir = fs.readdirSync(path.resolve(__dirname, prefix));

    const flist = dir.filter(el => el.includes('.json'));

    zipFiles(path.resolve(__dirname, prefix), flist, 'mike')
        .then(res=>{
            logger.info('zip result => %s', res);
        })
        .catch(e=>{
            logger.error('zip error => %s', e.message);
        })

    next();
}
