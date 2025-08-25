declare type ResponseTypeMap = import('../types').ResponseTypeMap
declare type RequestOption<T> = import('../types').RequestOption<T>
declare type SignatureOption = import('../types').SignatureOption
declare type ApiGatewayErrorData = import('../types').ApiGatewayErrorData
declare type SignedInfoTypeMap = import('../types').SignedInfoTypeMap

declare type ClientGenericMethod = <T extends ResponseTypeMap>(
  this: OpenApiClient,
  apiPath: string,
  option?: RequestOption<T>
) => Promise<ResponseTypeMap[T]>
