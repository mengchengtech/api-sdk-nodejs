import { AxiosRequestConfig, AxiosResponse } from 'axios'

declare interface SignatureOption {
  accessId: string
  secret: string
  /**
   * api调用的完整url信息，包含query
   */
  resourceUrl: URL
  /**
   * 设置REST调用签名中的method信息
   */
  method: string
  /**
   * 设置REST调用中的content-type头。如果传入值为空，当http请求中包含body内容，则默认值为'application/json; charset=UTF-8'。其它情况默认值为undefined
   */
  contentType?: string
  /**
   * 请求的headers头，用于'header'签名方式下提取生成api调用签名的原始信息
   */
  headers?: Record<string, any>
}

declare interface ResponseTypeMap {
  string: TypedRequestResult
  buffer: TypedRequestResult
  json: TypedRequestResult
  stream: StreamRequestResult
}
declare type JSONObject = any[] | Record<string, any>

/**
 * 签名传递方式
 */
declare type SignatureMode = 'query' | 'header'

declare interface QuerySignatureParams {
  /**
   * 生成的签名有效持续时间（秒）
   */
  duration: number
}

declare interface SignedByHeader {
  mode: 'header'
}

declare interface SignedByQuery {
  mode: 'query'
  /**
   * 生成query格式签名用到的参数
   */
  parameters?: QuerySignatureParams
}

declare type SignedBy = SignedByHeader | SignedByQuery

declare interface RequestOption<T extends keyof ResponseTypeMap = 'json'> {
  query?: Record<string, string>
  /**
   * 调用超时时间
   */
  timeout?: number
  responseType?: T
  contentType?: string
  headers?: Record<string, string>
  body?: string | JSONObject | NodeJS.ReadableStream
  /**
   * api调用签名信息传递方式。默认值为'header'
   */
  signedBy?: SignatureMode | SignedBy
}

export class OpenApiClient {
  constructor(baseUri: string | URL, accessId: string, secretKey: string)

  get<T extends keyof ResponseTypeMap = 'json'>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  post<T extends keyof ResponseTypeMap = 'json'>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  delete<T extends keyof ResponseTypeMap = 'json'>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  patch<T extends keyof ResponseTypeMap = 'json'>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  put<T extends keyof ResponseTypeMap = 'json'>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  request<T extends keyof ResponseTypeMap = 'json'>(
    req: AxiosRequestConfig,
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>
}

declare interface ApiGatewayErrorData {
  readonly Code: string
  readonly Message: string
  readonly ClientIP: string
  readonly StringToSignBytes?: string
  readonly SignatureProvided?: string
  readonly StringToSign?: string
  readonly AccessKeyId?: string
}

declare class OpenApiResponseError extends Error {
  readonly name: 'OpenApiResponseError'
  readonly status: number
  readonly rawError: Error
  readonly data: ApiGatewayErrorData
}

declare class OpenApiClientError extends Error {
  readonly name: 'OpenApiClientError'
}

declare interface SignedData {
  signable: string
  signature: string
}

declare interface QuerySignedInfo {
  mode: 'query'
  signed: SignedData
  query: {
    AccessId: string
    Expires: number
    Signature: string
  }
}

declare interface HeaderSignedInfo {
  mode: 'header'
  signed: SignedData
  headers: {
    Date: string
    Authorization: string
  }
}

declare namespace utility {
  function generateSignature(
    signedBy: SignedByHeader | 'header',
    option: SignatureOption
  ): HeaderSignedInfo
  function generateSignature(
    signedBy: SignedByQuery | 'query',
    option: SignatureOption,
    duration?: number
  ): QuerySignedInfo
  function resolveError(xml: string): ApiGatewayErrorData
}

declare interface RequestResult {
  /**
   * 返回结果状态码
   */
  get status(): number

  /**
   * 获取内容的ContentType
   */
  get contentType(): string
}

declare interface TypedRequestResult extends RequestResult {
  /**
   * 如果结果是字符串，则返回字符串。否则抛出不支持的异常
   */
  getString(): string
  /**
   * 如果结果是Buffer，则返回Buffer。否则抛出不支持的异常
   */
  getBuffer(): Buffer
  /**
   * 如果结果是json对象，则返回json。否则抛出不支持的异常
   */
  getJson(): any
  /**
   * 以上方法的综合体，不区分类型
   */
  getRaw(): any
}

/**
 * 请求参数中responseType为'stream'返回的对象
 */
declare interface StreamRequestResult extends RequestResult {
  /**
   * 以字符串方式获取返回的文本内容
   */
  getString(): Promise<string>
  /**
   * @returns {Promise<Buffer>}
   */
  getBuffer(): Promise<Buffer>
  getJson(): Promise<any>
  openRead(): NodeJS.ReadableStream
}
