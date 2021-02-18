declare namespace ApiFarm {



    interface gmResponse<T, F> {
        RSP_HEAD: T,
        RSP_BODY: F
    }

    interface headRes {
        TRAN_SUCCESS: string,
        ERROR_CODE: string,
        ERROR_MESSAGE: string
    }

    interface sm3Request {
        plain: string
    }

    interface sm3Response {
        cryptoRet: string
    }

    interface zipAtomResult {
        filename: string,
        filepath: string,
        bytes: number,
        modifyTs: number,
        modifyTsDesc: string,
        pageCode?: string
    }

    interface cc0003req {
        processCode: string,
        pageConfigList: Array<{
            pageCode: string,
            fileTime: string
        }>
    }

    interface zipPageResult extends zipAtomResult {
        pageCode: string
    }


    interface ConfHighPri{
        pageCode: string,
        digest: string,
        cdnURL: string,
        fileName: string,
        modifyTs: string,
        modifyTsString: string
    }
}

