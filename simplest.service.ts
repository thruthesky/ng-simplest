import { Injectable, Inject } from '@angular/core';
import { SimplestConfigToken } from './simplest.config';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaderResponse, HttpEventType } from '@angular/common/http';
import {
    SimplestConfig, File, FileCreateOptions, Response, FileDeleteOptions,
    ImageGenerateOptions,
    UserRegister,
    User,
    UserLogin,
    UserProfile,
    ErrorObject
} from './simplest.interface';
import { Observable, throwError } from 'rxjs';
import { map, filter, catchError, tap } from 'rxjs/operators';

import { docCookies as cookie } from './simple.cookie';
import { SimplestLibrary } from './simplest.library';


const USER_KEY = '_user';
@Injectable()
export class SimplestService extends SimplestLibrary {

    constructor(
        private http: HttpClient,
        @Inject(SimplestConfigToken) private config: SimplestConfig
    ) {
        super();
        console.log('SimplestService::constructor() : config: ', this.config);
    }

    /**
     * It returns if the input object is a success data from backend.
     * @param obj returned data from backend
     * @return
     *  true if success
     *  false if error
     */
    isSuccess(obj): boolean {
        if (!obj) {
            return false;
        }
        if (this.isError(obj)) {
            return false;
        }
        if (typeof obj === 'number') {
            return false;
        }
        if (typeof obj === 'string') {
            return false;
        }
        return true;
    }

    /**
     * Return true if the input object is an error object.
     * @param obj error object or anything
     */
    isError(obj: ErrorObject): boolean {
        if (!obj) {
            return false;
        }
        if (typeof obj !== 'object') {
            return false;
        }
        if (obj.error_code === void 0) {
            return false;
        }
        if (!obj.error_code) {
            return false;
        }
        return true;
    }

    /**
     * Returns an error object
     * @param code error code
     * @param message error string
     */
    createError(code: string, message: string): ErrorObject {
        return { error_code: code, error_message: message };
    }

    get backendUrl() {
        return this.config.backendUrl;
    }


    /**
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
     *  If error, error object will be returned.
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
                 * If error, throw that error. So, catchError will catch.
                 */
                if (this.isSuccess(res)) {
                    return res;
                } else {
                    throw res;
                }
            }),
            catchError(e => {
                /**
                 * If this is an error from backend, just throw.
                 */
                if (this.isError(e)) {
                    return throwError(e);
                }
                /**
                 * If this is not an error from backend,
                 *  - No internet
                 *  - Server down
                 *  - PHP script error
                 */
                console.error(e);
                return throwError(this.createError('not-server-error', 'Please check your Internet.'));
            })
        );
    }



    /**
     * Saves user response data
     * @param user user response data from backend
     */
    private setUser(user: User) {
        if (this.config.enableLoginToAllSubdomains) {
            cookie.setItem(USER_KEY, JSON.stringify(user), Infinity, '/', '.' + this.currentRootDomain());
        } else {
            this.set(USER_KEY, user);
        }
    }
    /**
     * Returns user response data
     */
    private getUser(): User {
        if (this.config.enableLoginToAllSubdomains) {
            const val = cookie.getItem(USER_KEY);
            if (val) {
                try {
                    return JSON.parse(val);
                } catch {
                    return null;
                }
            }
            console.log('Got user from cookie: ', val);
        } else {
            return this.get(USER_KEY);
        }
    }



    /**
     * Returns user data in localStorage saved when user register/update/login from backend.
     * @return
     *  user data
     *  or empty object if user didn't logged in to make it safe to use.
     */
    get user(): User {
        const data = this.getUser();
        // console.log('data: ', data);
        if (data) {
            return data;
        } else {
            return <User><any>{};
        }
    }

    /**
     * Returns true if user has logged in.
     */
    get isLoggedIn(): boolean {
        const user = this.getUser();
        // console.log('isLoggedIn() user:', user);
        if (user && user.session_id) {
            return true;
        } else {
            return false;
        }
    }

    register(user: UserRegister): Observable<User> {
        user.run = 'user.register';
        return this.post(user).pipe(
            tap(res => this.setUser(res))
        );
    }

    login(email, password): Observable<User> {
        const data: UserLogin = {
            run: 'user.login',
            email: email,
            password: password
        };
        return this.post(data).pipe(
            tap(res => this.setUser(res))
        );
    }

    logout() {
        this.setUser(null);
    }

    profile(): Observable<User> {
        const data: UserProfile = {
            run: 'user.profile',
            session_id: this.user.session_id
        };
        console.log('request data: ', data, this.user);
        return this.post(data).pipe(
            tap(res => this.setUser(res))
        );
    }
    profileUpdate(user: User): Observable<User> {
        user.run = 'user.update';
        user.session_id = this.user.session_id;
        return this.post(user).pipe(
            tap(res => this.setUser(res))
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
        if (options.session_id) {
            formData.append('session_id', options.session_id);
        }

        const req = new HttpRequest('POST', this.backendUrl, formData, {
            reportProgress: true,
            responseType: 'json'
        });

        return this.http.request(req).pipe(
            map(e => {
                if (e instanceof HttpResponse) { // success event. upload finished.
                    // console.log('e instanceof HttpResponse: ', e);
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

    /**
     * File deletes.
     * @param options options to delete a file.
     */
    fileDelete(options: FileDeleteOptions) {
        options.run = 'file.delete';
        // console.log('options: ', options);
        return this.post(options);
    }


    /**
     * This generates an image into a different size.
     * @param options options to delete
     */
    imageGenerate(options: ImageGenerateOptions) {
        options.run = 'file.image-generate';
        return this.post(options);
    }

}



