import { Injectable, Inject } from '@angular/core';
import { SimplestConfigToken } from './simplest.config';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaderResponse, HttpEventType } from '@angular/common/http';
import { SimplestConfig, File, FileCreateOptions, Response, FileDeleteOptions } from './simplest.interface';
import { Observable, throwError } from 'rxjs';
import { map, filter, catchError } from 'rxjs/operators';

@Injectable()
export class SimplestService {

    constructor(
        private http: HttpClient,
        @Inject(SimplestConfigToken) private config: SimplestConfig
    ) {
        console.log('SimplestService::constructor() : config: ', this.config);
    }


    createError(code: string, message: string) {
        return { code: code, message: message };
    }

    get backendUrl() {
        return this.config.backendUrl;
    }


    /**
     * 서버로 POST request 를 전송하고 결과를 받아서 데이터를 Observable 로 리턴하거나
     * 응답에 에러가 있거나 각종 상황에서 에러가 있으면 그 에러를 Observable 로 리턴한다.
     *
     * Request to server through POST method.
     * And returns response data observable or error observable.
     *
     * @param data request data
     *
     *      data['session_id'] - user session id
     *      data['route'] - route
     *
     * @return
     *      - 에러가 있으면 { code: number, message: string } 으로 Observable 이 리턴된다.
     */
    post(data): Observable<any> {
        if (data['debug']) {
            const q = this.httpBuildQuery(data);
            console.log('PhilGoApiService::post() url: ', this.backendUrl + '?' + q);
        }

        if (!this.backendUrl) {
            return throwError(this.createError('backendUrl', 'Server url is not set. Set it on App Module constructor().'));
        }
        return this.http.post(this.backendUrl, data).pipe(
            map((res: Response) => {
                /**
                 * PhilGo API 부터 잘 처리된 결과 데이터가 전달되었다면,
                 * 데이터만 Observable 로 리턴한다.
                 */
                if (res.code !== void 0 && res.code) {
                    // console.log('** PhilGoApiService -> post -> http.post -> pipe -> map -> res: ', res);
                    /**
                     * (인터넷 접속 에러나 서버 프로그램 에러가 아닌)
                     * PhilGo API 가 올바로 실행되었지만 결과에 성공적이지 못하다면
                     * Javascript 에러를 throw 해서 catchError() 에러 처리한다.
                     */
                    throw res;
                } else {
                    return res;
                }
            }),
            catchError(e => {
                // console.log('PhilGoApiService::post() => catchError()');
                // console.log('catchError: ', e);
                /**
                 * API 의 에러이면 그대로 Observable Error 를 리턴한다.
                 */
                if (e['code'] !== void 0 && e['code'] ) {
                    return throwError(e);
                }
                /**
                 * API 에러가 아니면, 인터넷 단절, 리눅스/웹서버 다운, PHP script 문법 에러 등이 있을 수 있다.
                 */
                return throwError( this.createError('not-server-error', 'Please check your Internet.'));
            })
        );
    }


    /**
     * Uploads a file using Custom API
     * @desc I cannot understand wordpress Media API. so I impementing my own file upload api.
     * @param files HTML FileList
     * @param options Options to upload file
     * @see https://docs.google.com/document/d/1nOEJVDilLbF0sNCkkRGcDwdT3rDLZp3h59oQ77BIdp4/edit#heading=h.8fvprdfjs0v5
     */
    fileUpload(files: FileList, options: FileCreateOptions): Observable<File> {
        console.log('SimplestService::fileUpload()', files, options);
        if (files === void 0 || !files.length || files[0] === void 0) {
            return throwError(this.createError('no-file-selected', 'Please, select a file'));
        }
        const file = files[0];


        const formData = new FormData();
        formData.append('run', 'file.upload');
        formData.append('file', file, file.name);
        if (options.relation) {
            formData.append('relation', options.relation);
        }
        if (options.code) {
            formData.append('code', options.code);
        }
        if (options.user_no) {
            formData.append('user_no', options.user_no);
        }

        const req = new HttpRequest('POST', this.backendUrl, formData, {
            reportProgress: true,
            responseType: 'json'
        });

        return this.http.request(req).pipe(
            map(e => {
                if (e instanceof HttpResponse) { // success event. upload finished.
                    console.log('e instanceof HttpResponse: ', e);
                    return e['body'];
                } else if (e instanceof HttpHeaderResponse) { // header event. It may be a header part from the server response.
                    // don't return anything about header.
                    // return e;
                } else if (e.type === HttpEventType.UploadProgress) { // progress event
                    const precentage = Math.round(100 * e.loaded / e.total);
                    if (isNaN(precentage)) {
                        // don't do here anything. this will never happens.
                        // console.log('file upload error. percentage is not number');
                        return <any>0;
                    } else {
                        // console.log('upload percentage: ', precentage);
                        return <any>precentage;
                    }
                } else {
                    // don't return other events.
                    // return e; // other events
                }
            }),
            filter(e => e)
        );

    }
    fileDelete(options: FileDeleteOptions) {
        options.run = 'file.delete';
        return this.post(options);
    }



    private httpBuildQuery(params): string | null {
        const keys = Object.keys(params);
        if (keys.length === 0) {
            return null; //
        }
        const esc = encodeURIComponent;
        const query = keys
            .map(k => esc(k) + '=' + esc(params[k]))
            .join('&');
        return query;
    }

}



