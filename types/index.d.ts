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
  buffer: Buffer
  json: any
  text: string
  stream: NodeJS.ReadableStream
}
declare type JSONObject = any[] | Record<string, any>

/**
 * 签名传递方式
 */
declare type SignatureMode = 'query' | 'header'

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
  signedBy?: SignatureMode
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
  ): Promise<AxiosResponse>
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
    mode: 'header',
    option: SignatureOption
  ): HeaderSignedInfo
  function generateSignature(
    mode: 'query',
    option: SignatureOption,
    duration?: number
  ): QuerySignedInfo
  function resolveError(xml: string): ApiGatewayErrorData
}
