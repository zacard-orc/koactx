declare namespace ApiFarm {
    interface gmResponse<T, F> {
        RSP_HEAD: T,
        RSP_BODY: F
    }

    interface sm3Request {
        plain: string
    }

    interface sm3Response {
        cryptoRet: string
    }

    interface zipResult {
        filename: string,
        filepath: string,
        bytes: number,
        modifyTs: number,
        modifyTsDesc: string
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

