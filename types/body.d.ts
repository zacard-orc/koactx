
interface sm3Request {
    plain: string
}

interface sm3Response {
    cryptoRet: string
}

interface gmResponse<T, F> {
    RSP_HEAD: T,
    RSP_BODY: F
}