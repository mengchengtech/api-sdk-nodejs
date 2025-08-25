import { AxiosRequestConfig, AxiosResponse } from 'axios'

declare interface SignatureOption {
  accessId: string
  secret: string
  /**
   * 设置REST调用签名中的url路径信息
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
   * 自定义的headers头
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

declare interface RequestOption<T> {
  query?: Record<string, string>
  /**
   * 调用超时时间
   */
  timeout?: number
  responseType: T
  contentType?: string
  headers?: Record<string, string>
  body?: string | JSONObject | NodeJS.ReadableStream
}

export class OpenApiClient {
  constructor(baseUri: string | URL, accessId: string, secretKey: string)

  get<T extends keyof ResponseTypeMap>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  post<T extends keyof ResponseTypeMap>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  delete<T extends keyof ResponseTypeMap>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  patch<T extends keyof ResponseTypeMap>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  put<T extends keyof ResponseTypeMap>(
    apiPath: string,
    option: RequestOption<T>
  ): Promise<ResponseTypeMap[T]>

  request<T extends keyof ResponseTypeMap>(
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

declare class OpenApiRequestError extends Error {
  readonly name: 'OpenApiRequestError'
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
  signed: SignedData
  query: {
    AccessId: string
    Expires: number
    Signature: string
  }
}

declare interface HeaderSignedInfo {
  signed: SignedData
  headers: {
    Date: string
    Authorization: string
  }
}

declare interface SignedInfoTypeMap {
  query: QuerySignedInfo
  header: HeaderSignedInfo
}

declare namespace utility {
  /**
   *
   * @param option
   * @param duration 生成的签名有效持续时间（秒）。默认值30秒
   */
  function generateQuerySignature(
    option: SignatureOption,
    duration?: number
  ): QuerySignedInfo

  function generateHeaderSignature(option: SignatureOption): HeaderSignedInfo
  function resolveError(xml: string): ApiGatewayErrorData
}
