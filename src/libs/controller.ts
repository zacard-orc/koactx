import Koa from "koa";

import fs from 'fs';
import path from 'path';


import logger from "./logger";
import {Socket} from "net";
import {zipFiles, wait} from './utils'
import {modMeta,PREFIX_DOWN_URI} from "./constant";

import sm from 'sm-crypto'

const confMtime: ApiFarm.ConfState = {}

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
        const digest = sm3(buff.toString('binary'))

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
 hotspot: http://172.20.10.11:5000/high/
 inner: http://169.254.201.130:5000/high/
 */
export const ctrCC0001 = async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const prefix = '../src/Files/high';
    const prefixDown = `${PREFIX_DOWN_URI}/high`
    const {sm3} = sm;


    const dir = fs.readdirSync(path.resolve(__dirname, prefix));
    const flist = dir.filter(el => !el.includes('.'));

    const prAll = flist.map(el => {
        const fnameprefix = el.split('.')[0];

        // 按模块merge所有文件
        const mergeObj:any = {}
        for(let modEl of modMeta){
            const modElFullPath = path.resolve(__dirname, `${prefix}/${el}/${modEl}`);
            mergeObj[modEl.split('.')[0]] = fs.readFileSync(modElFullPath).toString()


            const modState = fs.statSync(modElFullPath)
            if(!confMtime[el]){
                confMtime[el]=modState.mtimeMs
                continue
            }
            if(modState.mtimeMs>confMtime[el]){
                confMtime[el]=modState.mtimeMs
            }
        }

        const mtime = confMtime[el].toString().split('.')[0];

        const mergeFilePath = path.resolve(__dirname, `${prefix}/${el}`)
        const mergeFileName = `${el}.json`
        const mergeFileFullPath = `${mergeFilePath}/${mergeFileName}`

        fs.writeFileSync(mergeFileFullPath,JSON.stringify(mergeObj))

        return zipFiles(mergeFilePath,
            [mergeFileName],
            `${fnameprefix}.${mtime}`,
            el);
    })

    const zipRet = await Promise.all(prAll)

    const pageConfigList = zipRet.map(el => {
        const buff = fs.readFileSync(el.filepath)
        const prefixDownMod = `${prefixDown}/${el.pageCode}`

        const fileSign = sm3(buff.toString('binary'))

        const fullpath = el.filepath.split('/').slice(0,-2)
        fullpath.push(`${el.pageCode}/${el.pageCode}.json`);
        // console.log(fullpath.join('/'))
        const fullbuff = fs.readFileSync(fullpath.join('/')).toString()

        return {
            confId: el.pageCode,
            confType: 'page',
            fileSign,
            filePath: `${prefixDownMod}/${el.filename}`,
            fileTime: el.filename.split('.')[1],
            detailMap: JSON.parse(fullbuff.toString())
            // effectiveTime: '1609486316000',
            // invalidTime: '4070935916000'
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
    console.log(prefixOther,otherList)

    // const otherObj = otherList.reduce((prev, el) => {
    //     const buff = fs.readFileSync(`${path.resolve(__dirname, prefixOther)}/${el.fileName}`)
    //     const objSet = prev as any;
    //     objSet[el.fileKey] = JSON.parse(buff.toString())
    //     return prev
    // }, {})

    // const otherObj = otherList.map(( el) => {
    //     const buff = fs.readFileSync(`${path.resolve(__dirname, prefixOther)}/${el.fileName}`).toString()
    //     const dtl = JSON.parse(buff)
    //
    //     return {
    //         fileTime: dtl.version,
    //         confId: el.fileKey,
    //         confType: el.fileKey,
    //         detailMap: dtl,
    //         fileSign:'xxxx',
    //         filePath: 'sssdfsdfs',
    //     }
    // })

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


    pageConfigList.pop()

    ctx.body = {
        confList: [
            ...pageConfigList,
            // ...otherObj,
        ],
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
    const priv = {
        'SYJ0001': 'high',
        'SYJ0003': 'high',
        'BUS0005': 'low',
        'TRJ0003': 'low',
    }

    // const {pageConfigList} = ctx.request.body as ApiFarm.cc0003req;

    const pageConfigList = [
        {pageCode:'SYJ0001'},
        {pageCode:'SYJ0003'},
        {pageCode:'BUS0005'},
        {pageCode:'TRJ0003'}
    ]
    const ret = [];
    // let i = 0;

    for (const el of pageConfigList) {

        const pageCode = el.pageCode;
        const wPriv = (priv as any)[el.pageCode]

        const prefix = '../src/Files/' + wPriv + '/' + pageCode;
        const prefixDown = PREFIX_DOWN_URI+'/' + wPriv+ '/' + pageCode;
        const {sm3} = sm;

        // const mtime = Date.now()


        // 按模块merge所有文件
        const mergeObj:any = {}
        for(let modEl of modMeta){
            const modElFullPath = path.resolve(__dirname, `${prefix}/${modEl}`);
            mergeObj[modEl.split('.')[0]] = fs.readFileSync(modElFullPath).toString()

            const modState = fs.statSync(modElFullPath)
            if(!confMtime[pageCode]){
                confMtime[pageCode]=modState.mtimeMs
                continue
            }
            if(modState.mtimeMs>confMtime[pageCode]){
                confMtime[pageCode]=modState.mtimeMs
            }
        }

        const mtime = confMtime[pageCode].toString().split('.')[0];

        const mergeFilePath = path.resolve(__dirname, `${prefix}`)
        const mergeFileName = `${pageCode}.json`
        const mergeFileFullPath = `${mergeFilePath}/${mergeFileName}`

        fs.writeFileSync(mergeFileFullPath,JSON.stringify(mergeObj))

        const zipRet = await zipFiles(mergeFilePath,
            [mergeFileName],
            `${pageCode}.${mtime}`,
            pageCode);

        const zipBuff = fs.readFileSync(zipRet.filepath)
        const fileSign = sm3(zipBuff.toString('binary'))


        ret.push({
            confId: zipRet.pageCode,
            fileSign,
            filePath: `${prefixDown}/${zipRet.filename}`,
            fileTime:mtime,
            // operateFlag: i%2==0?'1':'2',
            operateFlag: '1',
            // effectiveTime: '1609486316000',
            // invalidTime: '4070935916000'
        })

        // i+=1;
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
        confList: ret,
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

        const prefix = '../src/Files/' + wPriv + '/' + pageCode;
        const prefix2 = './src/Files/' + wPriv + '/' + pageCode;
        const prefixDown = PREFIX_DOWN_URI+'/' + wPriv+ '/' + pageCode;
        const {sm3} = sm;


        // 按模块merge所有文件
        const mergeObj:any = {}
        for(let modEl of modMeta){
            const modElFullPath = path.resolve(__dirname, `${prefix}/${modEl}`);
            mergeObj[modEl.split('.')[0]] = fs.readFileSync(modElFullPath).toString()

            const modState = fs.statSync(modElFullPath)
            if(!confMtime[pageCode]){
                confMtime[pageCode]=modState.mtimeMs
                continue
            }
            if(modState.mtimeMs>confMtime[pageCode]){
                confMtime[pageCode]=modState.mtimeMs
            }
        }

        const mtime = confMtime[pageCode].toString().split('.')[0];

        const mergeFilePath = path.resolve(__dirname, `${prefix}`)
        const mergeFileName = `${pageCode}.json`
        const mergeFileFullPath = `${mergeFilePath}/${mergeFileName}`

        fs.writeFileSync(mergeFileFullPath,JSON.stringify(mergeObj))

        const zipRet = await zipFiles(mergeFilePath,
            [mergeFileName],
            `${pageCode}.${mtime}`,
            pageCode);

        const zipBuff = fs.readFileSync(zipRet.filepath)
        const fileSign = sm3(zipBuff.toString('binary'))

        const detailMap = modMeta.reduce((prev, el) => {
            const modBuff = fs.readFileSync(path.resolve(`${prefix2}/${el}`)).toString()
            const modName = el.split('.')[0];
            (prev as any)[modName] = modBuff
            return prev;
        }, {})


        ret.push({
            confId: zipRet.pageCode,
            confType: 'Page',
            fileSign,
            filePath: `${prefixDown}/${zipRet.filename}`,
            fileTime: mtime,
            operateFlag: '1',
            detailMap,
            // effectiveTime: '1609486316000',
            // invalidTime: '4070935916000'
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
        confList: ret,
        toDelCode
    }
    await next();
}
