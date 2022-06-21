export type ErrorType = "abort" | "timeout" | "service";
export type HTTPMethod = "GET" | "PUT" | "POST" | "DELETE";
export class HTTPError {
    readonly type: ErrorType;
    readonly info?: any; //the error detail info
    readonly status: number;
    readonly message?: string; //the error description
    private constructor();
    static readonly abort: (status: number) => HTTPError;
    static readonly timeout: (status: number) => HTTPError;
    static readonly service: (status: number, info: any) => HTTPError;
}
export interface Upload {
    readonly name: string;
    readonly data: Blob | File;
    readonly type?: string; //content-type
    readonly opts?: Options;
    readonly params?: Record<string, any>;
}
export interface Request<T = any> {
    readonly path: string;
    readonly meta?: IMetaClass<T>;
    readonly data?: any;
    readonly opts?: Options;
}
export interface Options {
    /** @description use for override global methods */
    readonly method?: HTTPMethod;
    /**
     * @description define the key of maptask and mapreq
     * @default 'id'
     */
    readonly mapkey?: "id" | string;
    /** @description use for override global headers */
    readonly headers?: Record<string, string>;
    /** @default 0 wait forever */
    readonly timeout?: number;
    /**
     * @description auto show loading or not
     * @notice You must provide your loading UI in before or after hock. otherwith it does't work!
     * @see Network.before @see Network.after.
     * @default false
     */
    readonly loading?: boolean;
    /**
     * @description the response type for xhr.responseType
     * @default 'json'
     */
    readonly restype?: "json" | "text";

    /** @description use for override global reslove method */
    readonly parser?: (resp: any) => any;
}

export interface DataTask<T> {
    readonly then: <TResult1 = T, TResult2 = never>(
        onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
        onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
    ) => Promise<TResult1 | TResult2>;
    readonly catch: <TResult = never>(
        onrejected?: (reason: any) => TResult | PromiseLike<TResult>
    ) => Promise<T | TResult>;
    readonly abort: () => void;
    readonly onProgress: (func: (evt: ProgressEvent) => void) => void;
}
export interface UploadTask<T> extends DataTask<T> {
    readonly onProgress: (func: (evt: ProgressEvent) => void) => void;
}
/**
 * @description encode object to query string
 * @param params must be a plan key value object. the value of key suport plan array.
 * @warn plan value means string number boolean bigint
 * @example
 * const param = { a: 1, b: 2, c: [4, 5, 'haa'], d: true }
 * console.log(Network.encodeQuery(param)) // ?a=1&b=2&c=4&c=5&c=haa&d=true
 */
export const encodeQuery: (params: object) => string;
/**
 * @description replace your custome network implementation
 * @param impl You must provide your custome network implementation
 */
export const replaceImpl: (impl: {
    request: (
        url: string,
        data: any,
        opts: Options
    ) => [
        Promise<any>,
        { abort: () => void; onprogress: (evt: ProgressEvent) => void }
    ];
}) => void;
export interface IMetaClass<T> {
    new (json?: any): T;
}
export default abstract class Network {
    /**
     * @description define the key of maptask and mapreq
     * @default 'id'
     */
    protected get mapkey(): "id" | string;
    /**
     * @description auto show loading or not
     * @notice You must provide your loading UI in before or after hock. otherwith it does't work!
     * @see Network.before @see Network.after.
     * @default false
     */
    protected get loading(): boolean;
    /**
     * @description wait time out settings
     * @default 0 wait forever
     */
    protected get timeout(): number;
    /**
     * @description the response type for xhr.responseType
     * @default 'json'
     */
    protected get restype(): "json" | "text";
    /**
     * @description the global http request method
     * @override you shoud override this property and provide you custom headers
     * @default "POST"
     * @example
     * protected get method(): any {
     *     return 'POST'
     * }
     */
    protected get method(): HTTPMethod;
    /**
     * @description the global http headers. every request will include this headers
     * @override you shoud overwrite this property and provide you custom headers
     * @example
     * protected get headers(): any {
     *     return {
     *         token:'yourtoken',
     *         userId:'yourUserId'
     *     }
     * }
     */
    protected get headers(): Record<string, string>;

    /**
     * @description the global request body data reslover
     * @override override point
     * @param data the user request data
     * @return the finnal request data
     */
    protected params(data: any): any;
    /**
     * @description the global hock before every request
     * @override override point
     * @param path the relative uri
     * @param opts the request options
     * @returns go on request or not @default true
     */
    protected before(path: string, opts?: Options): boolean;
    /**
     * @description the global hock after every request
     * @override override point
     * @param path the relative uri
     * @param resp the response data or error
     */
    protected after(path: string, resp?: any | Error | HTTPError): void;
    /**
     * @description global resove relative uri to full url
     * @param path the relative uri
     */
    protected url(path: string): string;
    /**
     * @description resolve the data
     * @default retrun json
     * @param json the jsoned respons data
     */
    protected resolve(json: any): any | Promise<any>;
    /**
     * @description transform the service error
     * @param error the origin network error
     * @default 'throw the origin error';
     * @warn You must throw a new error for custom otherwise you can't get error message
     */
    protected reject(error: Error | HTTPError): void;

    /** @description upload simple file */
    readonly upload: <T = any>(path: string, upload: Upload) => UploadTask<T>;
    /** @description request simple object data */
    readonly objreq: <T>(req: Request<T>) => DataTask<T>;
    /** @description request object array data */
    readonly aryreq: <T>(req: Request<T>) => DataTask<T[]>;
    /** @description request dictionary data */
    readonly mapreq: <T>(req: Request<T>) => DataTask<Record<keyof any, T>>;
    /** @description request any type data */
    readonly anyreq: <T>(req: Omit<Request<T>, "meta">) => DataTask<T>;
}
