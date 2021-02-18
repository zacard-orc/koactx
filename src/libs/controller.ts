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

    const toDelCode = ctx.body?.toDelCode
    if (ctx.body) {
        delete ctx?.body['toDelCode']
    }

    const ret: ApiFarm.gmResponse<any, any> = {
        RSP_HEAD: {
            ...toDelCode
        },
        RSP_BODY: ctx.body
    }

    logger.info('=> body %s', JSON.stringify(ret, null, 2));
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
 高优先级接口-原始
 */
export const ctrConfHighPri = async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const prefix = '../src/Files';
    const prefixDown = 'http://localhost:5000'
    const {sm3} = sm;


    const dir = fs.readdirSync(path.resolve(__dirname, prefix));

    const flist = dir.filter(el => el.includes('.json'));

    const prAll = flist.map(el => {
        const fnameprefix = el.split('.')[0];

        return zipFiles(path.resolve(__dirname, prefix), [el], fnameprefix);
    })

    const zipRet = await Promise.all(prAll)

    ctx.body = zipRet.map(el => {
        const buff = fs.readFileSync(el.filepath)
        const digest = sm3(buff.toString())

        return {
            ...el,
            digest,
            downUrl: `${prefixDown}/${el.filename}`,
        }
    })
    await next();
}


/*
 高优先级接口
 wifi: http://172.30.139.50:5000/high/
 inner: http://169.254.201.130:5000/high/
 */
export const ctrCC0001 = async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const prefix = '../src/Files/high';
    const prefixDown = 'http://172.30.139.50:5000/high'
    const {sm3} = sm;


    const dir = fs.readdirSync(path.resolve(__dirname, prefix));

    const flist = dir.filter(el => el.includes('.json'));

    const prAll = flist.map(el => {
        const fnameprefix = el.split('.')[0];

        const targetState = fs.statSync(`${path.resolve(__dirname, prefix)}/${el}`)
        const mtime = targetState.mtimeMs.toString().split('.')[0]

        const buff = fs.readFileSync(`${path.resolve(__dirname, prefix)}/${el}`)
        const buffObj = JSON.parse(buff.toString())

        return zipFiles(path.resolve(__dirname, prefix), [el], `${fnameprefix}.${mtime}`, buffObj?.pageCode);
    })

    const zipRet = await Promise.all(prAll)

    const pageConfigList = zipRet.map(el => {
        const buff = fs.readFileSync(el.filepath)

        const fileSign = sm3(buff.toString())

        return {
            pageCode: el.pageCode,
            fileSign,
            filePath: `${prefixDown}/${el.filename}`,
            fileTime: el.modifyTs.toString()
        }
    })

    const prefixOther = '../src/Files';

    const otherList = [
        {
            fileName: 'app.json',
            fileKey: 'appConfigMap'
        },
        {
            fileName: 'route.json',
            fileKey: 'routeConfigMap'
        }
    ]

    const otherObj = otherList.reduce((prev, el) => {
        const buff = fs.readFileSync(`${path.resolve(__dirname, prefixOther)}/${el.fileName}`)
        const objSet = prev as any;
        objSet[el.fileKey] = JSON.parse(buff.toString())
        return prev
    }, {})

    const toDelCode: ApiFarm.headRes = {
        TRAN_SUCCESS: '0000',
        ERROR_CODE: '0000',
        ERROR_MESSAGE: '0000'
    }

    if (ctx.query?.mock === 'error') {
        toDelCode.TRAN_SUCCESS = '5001'
        toDelCode.ERROR_CODE = '5001'
        toDelCode.ERROR_MESSAGE = 'mock error'
    }

    ctx.body = {
        pageConfigList,
        ...otherObj,
        toDelCode
    }
    await next();
}


/*
 低优先级接口
 wifi: http://172.30.139.50:5000/high/
 inner: http://169.254.201.130:5000/high/
 */
export const ctrCC0002 = async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const prefix = '../src/Files/low';
    const prefixDown = 'http://172.30.139.50:5000/low'
    const {sm3} = sm;


    const dir = fs.readdirSync(path.resolve(__dirname, prefix));
    const flist = dir.filter(el => el.includes('.json'));

    const prAll = flist.map(el => {
        const fnameprefix = el.split('.')[0];

        const targetState = fs.statSync(`${path.resolve(__dirname, prefix)}/${el}`)
        const mtime = targetState.mtimeMs.toString().split('.')[0]

        const buff = fs.readFileSync(`${path.resolve(__dirname, prefix)}/${el}`)
        const buffObj = JSON.parse(buff.toString())

        return zipFiles(path.resolve(__dirname, prefix), [el], `${fnameprefix}.${mtime}`, buffObj?.pageCode);

    })

    const zipRet = await Promise.all(prAll)

    const pageConfigList = zipRet.map(el => {
        const buff = fs.readFileSync(el.filepath)
        const fileSign = sm3(buff.toString())

        return {
            pageCode: el.pageCode,
            fileSign,
            filePath: `${prefixDown}/${el.filename}`,
            fileTime: el.modifyTs.toString(),
            operateFlag: '2'
        }
    })


    const toDelCode: ApiFarm.headRes = {
        TRAN_SUCCESS: '0000',
        ERROR_CODE: '0000',
        ERROR_MESSAGE: '0000'
    }

    if (ctx.query?.mock === 'error') {
        toDelCode.TRAN_SUCCESS = '5001'
        toDelCode.ERROR_CODE = '5001'
        toDelCode.ERROR_MESSAGE = 'mock error'
    }

    ctx.body = {
        pageConfigList,
        toDelCode
    }
    await next();
}


/*
 补偿接口
 wifi: http://172.30.139.50:5000/high/
 inner: http://169.254.201.130:5000/high/
 */
export const ctrCC0003 = async (ctx: Koa.ExtendableContext, next: Koa.Next) => {

    const priv = {
        'SYJ0001': 'high',
        'SYJ0003': 'high',
        'BUS0005': 'low',
        'TRJ0003': 'low',
    }

    const {pageConfigList} = ctx.request.body as ApiFarm.cc0003req;
    const ret = [];

    for (const el of pageConfigList) {

        const pageCode = el.pageCode;
        const wPriv = (priv as any)[el.pageCode]

        const prefix = '../src/Files/' + wPriv;
        const prefixDown = 'http://172.30.139.50:5000/' + wPriv;
        const {sm3} = sm;

        const targetState = fs.statSync(`${path.resolve(__dirname, prefix)}/${pageCode}.json`)
        const mtime = targetState.mtimeMs.toString().split('.')[0]

        const buff = fs.readFileSync(`${path.resolve(__dirname, prefix)}/${pageCode}.json`)
        const buffObj = JSON.parse(buff.toString())

        const zipRet = await zipFiles(path.resolve(__dirname, prefix),
            [`${pageCode}.json`],
            `${pageCode}.${mtime}`,
            buffObj?.pageCode);


        const fileSign = sm3(buff.toString())

        ret.push({
            pageCode: zipRet.pageCode,
            fileSign,
            filePath: `${prefixDown}/${pageCode}.json`,
            fileTime: zipRet.modifyTs.toString(),
            operateFlag: '2',
            detailMap: {
                ...buffObj
            }
        })
    }


    const toDelCode: ApiFarm.headRes = {
        TRAN_SUCCESS: '0000',
        ERROR_CODE: '0000',
        ERROR_MESSAGE: '0000'
    }

    if (ctx.query?.mock === 'error') {
        toDelCode.TRAN_SUCCESS = '5001'
        toDelCode.ERROR_CODE = '5001'
        toDelCode.ERROR_MESSAGE = 'mock error'
    }

    ctx.body = {
        pageConfigList: ret,
        toDelCode
    }
    await next();
}
