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


interface ConfHighPri{
    pageCode: string,
    digest: string,
    cdnURL: string,
    fileName: string,
    modifyTs: string,
    modifyTsString: string
}

