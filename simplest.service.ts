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
  Comment,
  UserList,
  // ChatRoom,
  ChangeCategory, ChangePassword, Vote, VoteResponse, LogGet, Logs, SiteDashboard, EventAction, PostListOptions, PostQueryOption
  // Rooms
} from './simplest.interface';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, filter, catchError, tap } from 'rxjs/operators';

import { docCookies } from './simple.cookie';
import { SimplestLibrary } from './simplest.library';

const USER_KEY = '_user';
const SITE_KEY = '_site';
// const SPCHAT = 'simplest-firebase-chat.';

@Injectable()
export class SimplestService extends SimplestLibrary {
  /**
   * System settings.
   * @desc It is updated on every site.get/site.update
   * @desc You may need to call site.get on boot to set/save the site info from backend.
   */
  siteSettings: Site = {};
  /**
   * Fires event on site event
   */
  siteEvent = new BehaviorSubject<Site>(null);
  /**
   * Fires user event on register, login, logout, profile upload and profile is loaded from backend.
   */
  userEvent = new BehaviorSubject<User>(null);

  /**
   * Store the current link
   */
  siteCurrentPage = '';

  constructor(private http: HttpClient, @Inject(SimplestConfigToken) private config: SimplestConfig) {
    super();
    // console.log('SimplestService::constructor() : config: ', this.config);
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
   *
   * @note it fires user event on register, login, logout, profile upload and when profile is loaded from backend.
   * @fix 2019-01-14 cookie not work on localhost ( localhost domain does not need leading dot )
   */
  private setUser(user: User, ev: EventAction) {
    if (this.config.enableLoginToAllSubdomains) {
      const data = JSON.stringify(user);
      let domain = this.currentRootDomain();
      if (domain !== 'localhost') {
        domain = '.' + domain;
      }
      // console.log(USER_KEY, data, Infinity, '/', domain);
      docCookies.setItem(USER_KEY, data, Infinity, '/', domain);
    } else {
      this.set(USER_KEY, user);
    }

    if (user) {
      user.event = ev;
    }
    this.userEvent.next(user);
  }
  /**
   * Returns user response data or a field or user data.
   *
   * @example
   *  const user = this.getUser<User>();
   *  const idx = this.getUser('idx');
   *
   * @fix @since 2019-01-31 When this method users localStorage, it only returns the user record object even if 'field' is set.
   *  It now returns the value of the field if it is set on localStorage.
   *
   */
  private getUser<T>(field = null): T {
    if (this.config.enableLoginToAllSubdomains) {
      const val = docCookies.getItem(USER_KEY);
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
        } catch (e) {
          return null;
        }
      }
      // console.log('Got user from cookie: ', val);
    } else {
      const user = this.get(USER_KEY);
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
    }
  }

  /**
   * Returns user data in localStorage saved when user register/update/login from backend.
   * @return
   *  user data
   *  or empty object if user didn't logged in to make it safe to use.
   * @example
   *    sp.user; // will return user record object.
   *    sp.user.name; // will return user name or `undefined` if not set.
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
   *
   * Returns log in user's session id.
   * Not tested.
   * @todo test.
   * @return
   *  - A string of user login session id.
   *  - undefined if user has not logged in.
   */
  get mySessionId(): string {
    return this.user.session_id;
  }

  /**
   *
   * Returns login user's idx in string.
   * @return
   *  empty string if the user didn't logged in.
   *
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

  /**
   *
   * Returns user name
   * @since 2019-01-14
   */
  get myName(): string {
    return this.getUser('name');
  }

  get myPhotoUrl(): string {
    const photo = this.getUser('photo');
    if (photo && photo['url']) {
      return photo['url'];
    }
    return '';
  }

  /**
   *
   * Returns nickname
   *
   */
  get myNickname(): string {
    return this.getUser('nickname');
  }
  /**
   *
   */
  get myEmail(): string {
    return this.getUser('email');
  }

  register(user: User): Observable<User> {
    user.run = 'user.register';
    return this.post(user).pipe(tap(res => this.setUser(res, 'register')));
  }
  resign(): Observable<any> {
    return this.post({ run: 'user.resign' }).pipe(
      tap(x => {
        this.logout();
      })
    );
  }

  login(email, password): Observable<User> {
    const data: UserLogin = {
      run: 'user.login',
      email: email,
      password: password
    };
    return this.post(data).pipe(tap(res => this.setUser(res, 'login')));
  }

  logout() {
    this.setUser(null, 'logout');
  }

  profile(): Observable<User> {
    const data: UserProfile = {
      run: 'user.profile'
    };
    // console.log('request data: ', data, this.user);
    return this.post(data).pipe(tap(res => this.setUser(res, 'profile')));
  }
  profileUpdate(user: User): Observable<User> {
    user.run = 'user.update';
    return this.post(user).pipe(tap(res => this.setUser(res, 'profileUpdate')));
  }

  /**
   * this will update user password.
   * @since 01-15-19
   * @approval
   */
  changePassword(data: ChangePassword): Observable<{ idx_user: string }> {
    data['run'] = 'user.change-password';
    return this.post(data).pipe(tap(res => this.setUser(res, 'passwordChange')));
  }

  /**
   * this will reset user password and send new password to user email
   */
  forgotPassword(email: string): Observable<any> {
    const data = {
      email: email,
      run: 'user.forgot-password',
      domain: this.currentDomain()
    };
    return this.post(data).pipe(tap(res => this.setUser(res, 'forgotPassword')));
  }

  file(options: { idx?; taxonomy?; relation?; code?}): Observable<File> {
    options['run'] = 'file.get';
    return this.post(options);
  }

  /**
   * Uploads a file using Custom API
   * @desc I cannot understand wordpress Media API. so I impementing my own file upload api.
   * @param files HTML FileList
   * @param options Options to upload file
   * @see https://docs.google.com/document/d/1nOEJVDilLbF0sNCkkRGcDwdT3rDLZp3h59oQ77BIdp4/edit#heading=h.8fvprdfjs0v5
   */
  fileUpload(files: FileList, options: FileCreateOptions): Observable<File> {
    // console.log('SimplestService::fileUpload()', files, options);
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
            // console.log('upload percentage: ', percentage);
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
  site(idx_site_or_domain: string, callback?: any): Observable<Site> {
    // console.log(`   ===>>> site `, idx_site_or_domain);
    if (typeof callback === 'function') {
      const cache = this.get(SITE_KEY);
      if (cache) {
        // console.log('callback with: ', cache);
        cache['cache'] = true;
        this.siteSettings = cache;

        this.siteEvent.next(cache);
        callback(cache);
      }
    }
    return this.post({ run: 'site.get', idx_site_or_domain: idx_site_or_domain }).pipe(
      tap(s => {
        // console.log('site.get: ', s);
        this.siteSettings = s;
        this.set(SITE_KEY, s);
        this.siteEvent.next(s);
      })
    );
  }

  /**
   * @return Observable of global settings.
   */
  siteGlobalSettings(): Observable<Site> {
    return this.post({ run: 'site.global-settings' }).pipe(
      tap(g => {
        this.siteSettings.global_settings = g;
      })
    );
  }

  /**
   * Get site information.
   * @attention the difference between site() and siteGet() is that
   *    - site() will loads the current site settings and apply it to global variable
   *    - while siteGet() only gets the site's setting but does not affect the current site.
   * @param idx_site_or_domain site idx or domain
   * @usage Use this method when you need to load site settngs but don't want to re-apply(or refresh) the current site state.
   */
  siteGet(idx_site_or_domain: string): Observable<Site> {
    return this.post({ run: 'site.get', idx_site_or_domain: idx_site_or_domain });
  }

  /**
   * Returns true if the input has correct site settings
   * @param site site settings
   */
  siteCheck(site: Site): boolean {
    if (site && site.idx !== void 0 && site.idx) {
      return true;
    } else {
      return false;
    }
  }

  siteUpdate(data: Site): Observable<Site> {
    // console.log(`   ===>>> site Update`, data);
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

  siteDashboard(data: SiteDashboard): Observable<SiteDashboard> {
    data.run = 'site.dashboard';
    return this.post(data);
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
   * @param comp component name
   * @param options options
   *  options['idx'] must be site.idx
   */
  siteComponent(comp, options) {
    options['run'] = 'site.components/' + comp;
    // console.log('siteComponent: ', options);
    return this.post(options); // .pipe(tap(r => console.log('r: ', r)));
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

  /**
   * Get posts.
   * @param data post list data condition
   * @param options extra options
   *
   * @examples to list all posts of a site
   *  this.postList({ idx_category: '', taxonomy: 'sites', relation: this.a.site.idx;}).subscribe();
   */
  postList(data: PostList, options: PostListOptions = {}): Observable<PostList> {

    data.run = 'post.list';

    if (options.cache) {
      if (options.cacheId === void 0) {
        options.cacheId = `${data.idx_category}-${data.slug}-${data.page}`;
      }
      const cachedData = this.get(options.cacheId);
      if (cachedData) {
        cachedData['cache'] = true;
        cachedData['cacheId'] = options.cacheId;
      }
      // console.log(options, cachedData);
      const subject = new BehaviorSubject(cachedData);
      this.post(data).subscribe(res => {
        this.set(options.cacheId, res);
        subject.next(res);
      }, e => subject.error(e));
      return subject;
    } else {
      // console.log('post.search without cache', data);
      return this.post(data);
    }
  }

  /**
   * post query
   * @param options options
   * @example of getting posts with access_code
   * s.postQuery({
    *   fields: '*',
    *   where: `taxonomy='sites' AND relation=${this.settings.siteIdx} AND access_code LIKE 'gallery-%'`,
    *   limit: '10',
    *   orderby: 'access_code asc'
    *  }).subscribe(res => {
    *      console.log('post.query: ', res);
    *  }, e => console.error(e));
    *
    * @example of getting all posts without access_code
    *     this.a.s.postQuery({
    *   fields: '*',
    *   where: `taxonomy='sites' AND relation=${this.a.settings.siteIdx} AND access_code IS NULL`,
    *   limit: '10',
    *   orderby: 'idx desc'
    *  }).subscribe(res => {
    *   console.log('forum: post.query: ', res);
    * }, e => console.error(e));
    *
    */
  postQuery(options: PostQueryOption): Observable<Post[]> {
    options['run'] = 'post.query';
    // let url = `https://api.sonub.com/api.php?run=post.query` +
    //   `&fields=${options.fields}` +
    //   `&where=${options.where}` +
    //   `&limit=${options.limit}`
    //   ;
    // if (options.orderby) {
    //   url += '&orderby=' + options.orderby;
    // }
    return this.post(options);
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

  postChangeCategory(data: ChangeCategory): Observable<ChangeCategory> {
    data.run = 'post.change-category';
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


  vote(data: Vote): Observable<VoteResponse> {
    data.run = 'post.vote';
    return this.post(data);
  }



  /**
   * Returns thumbnail URL
   * @param fileOrUrl file object or url of the image.
   * @warning fileOrUrl cannot be a post object.
   * @see etc/thumbnail/index.php for detail
   * @example
   *            a.sp.thumbnailUrl(file.url, {
    width: 100,
    height: 100,
    quality: 100,
    mode: 'crop'
  })
   */
  thumbnailUrl(
    fileOrUrl: any,
    options: { width?: number; height?: number; quality?: number; mode?: 'resize' | 'crop' } = {}
  ): string {
    // console.log('thumbnailUrl: ', fileOrUrl);

    if (!fileOrUrl) {
      return '';
    }

    const defaults = { width: 120, height: 120, quality: 80, mode: 'crop' };
    options = Object.assign(defaults, options);
    let url = '';
    if (typeof fileOrUrl === 'string') {
      url = fileOrUrl;
    } else if (fileOrUrl['url'] !== void 0) {
      url = fileOrUrl['url'];
    }

    if (!url) {
      return '';
    }

    // console.log('url: ', url);

    let path = url.substr(url.indexOf('/files/'));
    if (path.indexOf('?') !== -1) {
      path = path.substr(0, path.indexOf('?'));
    }
    // console.log('path: ', path);
    url =
      `${this.backendHomeUrl}etc/thumbnail/?src=../..${path}&width=${options.width}&height=${options.height}` +
      `&quality=${options.quality}&mode=${options.mode}`;
    // console.log('url: ', url);
    return url;
  }

  /**
   * Returns the first iamge url of the post from 'post.files' object.
   * @param post post
   * @return
   *    file url
   *    or empty string
   */
  postFirstImageUrl(post: Post): string {
    if (post && post.files && post.files.length) {
      for (const file of post.files) {
        if (file.type.indexOf('image/') !== -1) {
          return file.url;
        }
      }
    }
    return '';
  }

  /**
   * Returns true if the post has a photo.
   * @param post post
   */
  postHasImage(post: Post): boolean {
    return !!this.postFirstImageUrl(post);
  }

  pushNotificationTokenSave(req) {
    req['run'] = 'push-notification.token-save';
    return this.post(req);
  }
  pushNotificationSubscribeTopic(req) {
    req['run'] = 'push-notification.subscribe-topic';
    return this.post(req);
  }
  pushNotificationTokenUpdate(req) {
    req['run'] = 'push-notification.token-update';
    return this.post(req);
  }
  pushNotificationTokenDelete(req) {
    req['run'] = 'push-notification.token-delete';
    return this.post(req);
  }

  pushNotificationSendAll(req) {
    req['run'] = 'push-notification.send-all';
    return this.post(req);
  }

  userList(data: UserList): Observable<UserList> {
    data.run = 'site.user-list';
    return this.post(data);
  }

  pushNotificationSendCommentToParent(idx): Observable<any> {
    return this.post({
      run: 'push-notification.send-comment-notification-parents',
      idx: idx,
      idx_site: this.siteSettings.idx,
      domain: this.currentDomain()
    });
  }
  pushNotificationSendNewPost(idx): Observable<any> {
    return this.post({
      run: 'push-notification.send-new-post-notification',
      idx: idx,
      idx_site: this.siteSettings.idx,
      domain: this.currentDomain()
    });
  }
  sendPushNotification(req): Observable<any> {
    if (!req['click_action']) {
      req['click_action'] = this.currentDomain();
    }
    req['run'] = 'push-notification.send-notification';
    req['idx_site'] = this.siteSettings.idx;
    return this.post(req);
  }


  logGet(data: LogGet): Observable<Logs> {
    data.run = 'log.get';
    return this.post(data);
  }

}
