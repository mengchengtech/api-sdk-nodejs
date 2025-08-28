declare type ResponseTypeMap = import('../types').ResponseTypeMap
declare type RequestOption<T extends keyof ResponseTypeMap> =
  import('../types').RequestOption<T>
declare type SignatureOption = import('../types').SignatureOption
declare type ApiGatewayErrorData = import('../types').ApiGatewayErrorData
declare type SignedBy = import('../types').SignedBy
declare type SignedByHeader = import('../types').SignedByHeader
declare type SignedByQuery = import('../types').SignedByQuery
declare type SignatureMode = import('../types').SignatureMode
declare type SignedData = import('../types').SignedData

declare type HeaderSignedInfo = import('../types').HeaderSignedInfo
declare type QuerySignedInfo = import('../types').QuerySignedInfo

declare type TypedRequestResult = import('../types').TypedRequestResult
declare type StreamRequestResult = import('../types').StreamRequestResult

declare type ClientGenericMethod = <T extends ResponseTypeMap>(
  this: OpenApiClient,
  apiPath: string,
  option?: RequestOption<T>
) => Promise<ResponseTypeMap[T]>
