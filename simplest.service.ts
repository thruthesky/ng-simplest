import { Injectable, Inject } from '@angular/core';
import { SimplestConfigToken } from './simplest.config';
import {
  HttpClient,
  HttpRequest,
  HttpResponse,
  HttpHeaderResponse,
  HttpEventType,
  HttpParams
} from '@angular/common/http';
import {
  SimplestConfig,
  File,
  FileCreateOptions,
  Response,
  FileDeleteOptions,
  User,
  UserLogin,
  UserProfile,
  Site,
  Domain,
  DomainApply,
  Sites,
  Categories,
  Category,
  PostList,
  Post,
  FileImageResize,
  Comment
} from './simplest.interface';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, filter, catchError, tap } from 'rxjs/operators';

import { docCookies as cookie } from './simple.cookie';
import { SimplestLibrary } from './simplest.library';

const USER_KEY = '_user';
const SITE_KEY = '_site';
const SPCHAT = 'simplest-firebase-chat.';

@Injectable()
export class SimplestService extends SimplestLibrary {


  /**
   * System settings.
   * @desc It is updated on every site.get/site.update
   * @desc You may need to call site.get on boot to set/save the site info from backend.
   */
  siteSettings: Site = {};
  siteEvent = new BehaviorSubject<Site>(null);

  constructor(
    private http: HttpClient,
    @Inject(SimplestConfigToken) private config: SimplestConfig
  ) {
    super();
    console.log('SimplestService::constructor() : config: ', this.config);
  }

  get backendUrl() {
    return this.config.backendUrl;
  }
  get backendHomeUrl(): string {
    return this.backendUrl.replace('api.php', '');
  }

  /**
   * Returns HTML from backend.
   * @param run script file name
   * @param idx_site site.idx
   */
  html(run, idx_site) {
    const req = {
      run: 'html.' + run,
      idx_site: idx_site
    };
    const params = new HttpParams({ fromObject: <any>req });
    return this.http.get(this.backendUrl, { responseType: 'text', params: params });
  }
  /**
   *
   * Request to server through POST method.
   * And returns response data observable or error observable.
   *
   * @param data request data
   *
   *      data['session_id'] - user session id. Optional.
   *              If it is not set and if the user has logged in
   *              Then it will automatically add 'session_id'
   *      data['route'] - route
   *
   * @return
   *  If error, error object will be returned.
   */
  post(data): Observable<any> {
    if (data['session_id'] === void 0 && this.isLoggedIn) {
      data['session_id'] = this.user.session_id;
    }
    if (data['debug']) {
      const q = this.httpBuildQuery(data);
      console.log('PhilGoApiService::post() url: ', this.backendUrl + '?' + q);
    }

    if (!this.backendUrl) {
      return throwError(
        this.createError('backendUrl', 'Server url is not set. Set it on App Module constructor().')
      );
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
   * Returns user response data or a field or user data.
   *
   * @example
   *  const user = this.getUser<User>();
   *  cosnt idx = this.getUser('idx');
   */
  private getUser<T>(field = null): T {
    if (this.config.enableLoginToAllSubdomains) {
      const val = cookie.getItem(USER_KEY);
      if (val) {
        try {
          const user = JSON.parse(val);
          if (user) {
            if (field === null) {
              return user;
            } else if (user[field] !== void 0) {
              return user[field];
            } else {
              return null;
            }
          } else {
            return null;
          }
        } catch {
          return null;
        }
      }
      // console.log('Got user from cookie: ', val);
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
      return <User>(<any>{});
    }
  }

  /**
   * Returns true if user has logged in.
   */
  get isLoggedIn(): boolean {
    const user = this.getUser<User>();
    // console.log('isLoggedIn() user:', user);
    if (user && user.session_id) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns login user's idx in string.
   * @return
   *  empty string if the user didn't logged in.
   */
  get myIdx(): string {
    return this.getUser('idx');
    // const user = this.getUser();
    // console.log('isLoggedIn() user:', user);
    // if (user && user.idx) {
    //     return user.idx;
    // } else {
    //     return '';
    // }
  }

  get myNickname(): string {
    return this.getUser('nickname');
  }

  register(user: User): Observable<User> {
    user.run = 'user.register';
    return this.post(user).pipe(tap(res => this.setUser(res)));
  }

  login(email, password): Observable<User> {
    const data: UserLogin = {
      run: 'user.login',
      email: email,
      password: password
    };
    return this.post(data).pipe(tap(res => this.setUser(res)));
  }

  logout() {
    this.setUser(null);
  }

  profile(): Observable<User> {
    const data: UserProfile = {
      run: 'user.profile'
    };
    console.log('request data: ', data, this.user);
    return this.post(data).pipe(tap(res => this.setUser(res)));
  }
  profileUpdate(user: User): Observable<User> {
    user.run = 'user.update';
    return this.post(user).pipe(tap(res => this.setUser(res)));
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
    if (options.taxonomy) {
      formData.append('taxonomy', options.taxonomy);
    }
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
        if (e instanceof HttpResponse) {
          // success event. upload finished.
          // console.log('e instanceof HttpResponse: ', e);
          const re = e['body'];
          if (this.isError(re)) {
            throw re;
          } else {
            return re;
          }
        } else if (e instanceof HttpHeaderResponse) {
          // header event. It may be a header part from the server response.
          // don't return anything about header.
          // return e;
        } else if (e.type === HttpEventType.UploadProgress) {
          // progress event
          const precentage = Math.round((100 * e.loaded) / e.total);
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
  // imageGenerate(options: ImageGenerateOptions) {
  //     options.run = 'file.image-generate';
  //     return this.post(options);
  // }

  fileImageResize(options: FileImageResize): Observable<File> {
    options.run = 'file.image-resize';
    return this.post(options);
  }

  /**
     * Load site settings.
     * @desc This method caches site data info localStorage and you can get it from callback to speed up site loading.
     * @param idx_site_or_domain idx or domain to load site settings
     *
     * @example Getting site data from cache first and loads real data from server.
        this.sp.site(this.sp.currentDomain(), s => this.site = s).subscribe(s => {
            this.site = s;
        }, e => this.error(e));
     */
  site(idx_site_or_domain, callback?): Observable<Site> {
    if (typeof callback === 'function') {
      const cache = this.get(SITE_KEY);
      if (cache) {
        // console.log('callback with: ', cache);
        this.siteSettings = cache;
        callback(cache);
      }
    }
    return this.post({ run: 'site.get', idx_site_or_domain: idx_site_or_domain, debug: true }).pipe(
      tap(s => {
        this.siteSettings = s;
        this.set(SITE_KEY, s);
        this.siteEvent.next(s);
      })
    );
  }

  siteUpdate(data: Site): Observable<Site> {
    data.run = 'site.update';
    return this.post(data).pipe(
      tap(s => {
        this.siteSettings = s;
        this.set(SITE_KEY, s);
        this.siteEvent.next(s);
      })
    );
  }

  sites(): Observable<Sites> {
    return this.post({ run: 'site.list' });
  }

  siteCreate(data: Site): Observable<Site> {
    data.run = 'site.create';
    return this.post(data);
  }

  siteDomainApply(data: DomainApply): Observable<Domain> {
    data.run = 'site.domain-apply';
    return this.post(data);
  }
  siteDomainDelete(domain): Observable<Domain> {
    const data = {
      run: 'site.domain-delete',
      domain: domain
    };
    return this.post(data);
  }

  siteSortCategories(idx, orders) {
    const data = {
      run: 'site.sort-categories',
      idx: idx,
      orders: orders
    };
    return this.post(data);
  }

  /**
   * Returns component data from backend.
   * @see document
   * @param idx site
   * @param comp component name
   */
  siteComponent(idx, comp) {
    const data = {
      run: 'site.components/' + comp,
      idx: idx,
      debug: true
    };
    console.log('siteComponent: ', data);
    return this.post(data); // .pipe(tap(r => console.log('r: ', r)));
  }

  category(category): Observable<Category> {
    return this.post({ run: 'category.get', category: category });
  }

  /**
     * @example
     *     this.a.sp.categoryList().subscribe( cats => {
      this.categories = cats;
    }, e => this.a.error(e));
     */
  categoryList(): Observable<Categories> {
    return this.post({ run: 'category.list' });
  }

  /**
     *
     * @param data data to create a category
     *
     * @example
     *
    this.a.sp.categoryCreate(this.form).subscribe( cat => {
      this.form = cat;
      this.a.alert('success');
    }, e => this.a.error(e));
     */
  categoryCreate(data: Category): Observable<Category> {
    data.run = 'category.create';
    return this.post(data);
  }

  categoryUpdate(data: Category): Observable<Category> {
    data.run = 'category.update';
    return this.post(data);
  }

  categoryDelete(idx: Category): Observable<Category> {
    const data = {
      run: 'category.delete',
      idx: idx
    };
    return this.post(data);
  }

  postList(data: PostList): Observable<PostList> {
    data.run = 'post.list';
    return this.post(data);
  }

  postCreate(data: Post): Observable<Post> {
    data.run = 'post.create';
    return this.post(data);
  }
  postGet(idx: any): Observable<Post> {
    const data = {
      run: 'post.get',
      idx: idx
    };
    return this.post(data);
  }

  postUpdate(data: Post): Observable<Post> {
    data.run = 'post.update';
    return this.post(data);
  }
  postDelete(idx: any): Observable<Post> {
    const data = {
      run: 'post.delete',
      idx: idx
    };
    return this.post(data);
  }

  commentCreate(comment: Comment): Observable<Comment> {
    comment.run = 'comment.create';
    return this.post(comment);
  }
  commentUpdate(comment: Comment): Observable<Comment> {
    comment.run = 'comment.update';
    return this.post(comment);
  }
  commentDelete(idx_comment: any): Observable<Comment> {
    return this.post({ run: 'comment.delete', idx: idx_comment });
  }

  /**
   * Chat functionality
   */

  /**
   * will retrive a room matching the idx.
   * @param idx reference to a room.
   */
  room(idx: any): Observable<any> {
    return this.post({ run: SPCHAT + 'room', idx: idx });
  }

  /**
   * get all rooms
   */
  rooms(): Observable<any> {
    return this.post({ run: SPCHAT + 'rooms' });
  }

  /**
   * will insert room in simplest db
   * @param room data to be store in simplest.
   */
  createRoom(room: any): Observable<any> {
    room.run = SPCHAT + 'create-room';
    return this.post(room);
  }

  // enterRoom(idx: any): Observable<any> {
  //   return this.post({ run: SPCHAT + 'enter-room', idx: idx });
  // }

  // leaveRoom(idx: any) {
  //   return this.post({ run: SPCHAT + 'leave-room', idx: idx });
  // }

  /**
   * will store message in simplest db.
   * @param data data to be store in simplest.
   */
  sendMessage(data: any): Observable<any> {
    data['run'] = SPCHAT + 'send-message';
    return this.post(data);
  }

  /**
   * will retrieve all message in this room.
   * @param name reference to room.
   */
  allMessage(name: any) {
    return this.post({ run: SPCHAT + 'all-message', name: name });
  }





  /**
   * Returns thumbnail URL
   * @param fileOrUrl file object or url of the image.
   * @see etc/thumbnail/index.php for detail
   */
  thumbnailUrl(fileOrUrl: any, options: { width?: number, height?: number, quality?: number, mode?: 'resize' | 'crop' } = {}): string {
    if (!fileOrUrl) {
      return '';
    }
    const defaults = { width: 120, height: 120, quality: 80, mode: 'crop' };
    options = Object.assign(defaults, options);
    let url: string;
    if (typeof fileOrUrl === 'string') {
      url = fileOrUrl;
    } else if (fileOrUrl['url'] !== void 0) {
      url = fileOrUrl['url'];
    } else {
      return '';
    }
    const path = url.substr(url.indexOf('/files/'));
    // console.log('path: ', path);
    url = `${this.backendHomeUrl}etc/thumbnail/?src=../..${path}&width=${options.width}&height=${options.height}`
      + `&quality=${options.quality}&mode=${options.mode}`;
    // console.log('url: ', url);
    return url;
  }
}
