import Koa from "koa";

import fs from 'fs';
import path from 'path';


import logger from "./logger";
import {Socket} from "net";
import {zipFiles, wait} from './utils'

import sm from 'sm-crypto'

export const ctrPerf = async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
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

    await next()
}

export const ctrSendDone = async (ctx: Koa.ExtendableContext) => {

    const ret: ApiFarm.gmResponse<any, any> = {
        RSP_HEAD: {},
        RSP_BODY: ctx.body
    }

    logger.info('=> body %j' ,ret);
    ctx.body = ret;
}

export const ctrHello = async (ctx: Koa.ExtendableContext) => {

    await wait(3000);

    ctx.append('resultCode', '0000');
    ctx.body = 'Hello 7777'
}

export const ctrSM3 = (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const payload: ApiFarm.sm3Request = (ctx.request.body as ApiFarm.sm3Request);
    const {
        plain
    } = payload;
    const {sm3} = sm;

    const crypto: ApiFarm.sm3Response = {
        cryptoRet: sm3(plain)
    }

    ctx.body = crypto

    next();
}

/*
 高优先级接口
 */
export const ctrConfHighPri = async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const prefix = '../src/Files';
    const dir = fs.readdirSync(path.resolve(__dirname, prefix));

    const flist = dir.filter(el => el.includes('.json'));
    console.log(flist)

    try{
        const zipret = await zipFiles(path.resolve(__dirname, prefix), flist, 'mike');
        logger.info('zip result => %j', zipret);

        ctx.body = zipret;
    } catch (e) {
        logger.error('zip error => %s', e.message);
    }

    await next();
}
