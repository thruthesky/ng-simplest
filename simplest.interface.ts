export const CONFIG_NAME = 'SimplestConfig';

export interface SimplestConfig {
  backendUrl: string;
  enableLoginToAllSubdomains: boolean;
}

export interface Request {
  run?: string; // strip string to run. format: "folder.file.function"
  session_id?: string;
}

export interface ErrorObject {
  error_code?: string;
  error_message?: string;
}

export interface Response extends ErrorObject {
  idx?: string;
}

// export interface UserRegister extends Request {
//     email: string;
//     password: string;
//     name?: string;
//     nickname?: string;
//     gender?: string;
//     birthday?: string;
//     mobile?: string;
//     landline?: string;
//     country?: string;
//     province?: string;
//     city?: string;
//     address?: string;
// }
export interface UserLogin extends Request {
  email: string;
  password: string;
}

export interface UserProfile {
  run: string;
  session_id?: string;
}

export interface User extends Response {
  run?: string;
  session_id?: string;
  idx_site?: string;
  idx?: string;
  email?: string;
  password?: string;
  name?: string;
  nickname?: string;
  gender?: string;
  birthday?: string;
  mobile?: string;
  landline?: string;
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  photo?: File;
  stamp_created?: string;
}

export interface ChangePassword extends Request {
  old_password?: string;
  new_password?: string;
}
export interface ForgotPassword extends Request {
  email?: string;
}

export interface FileCreateOptions extends Request {
  taxonomy?: string;
  relation?: any;
  code?: string;
}
export interface FileDeleteOptions extends Request {
  idx: string; // files.idx
}

// export interface ImageGenerateOptions extends Request {
//     idx: string;
//     width: any;
//     height: any;
//     quality: any;
//     mode: 'crop' | 'resize';
//     relation: any;
//     code: any;
//     user_no: any;
// }

export interface FileImageResize extends Request {
  idx: string;
  width: any;
  height: any;
  quality: any;
  mode: 'crop' | 'resize';
  taxonomy: string;
  relation: any;
  code: string;
}

export type PostListStyle = '' | 'title+content' | 'title+content+few-comments';

export interface Category extends Request {
  idx?: any;
  taxonomy?: string; //
  relation?: string;
  slug?: string;
  name?: string;
  list_style?: PostListStyle;
  philgo?: string;
  posts_per_page?: string;
  menu_theme?: string;
  good?: any;
  bad?: any;
}
export type Categories = Array<Category>;

export interface Domain {
  domain: string;
  reason: string;
  status: string;
}

export interface SiteGlobalAdvertisement {
  url: string;
  src: string;
  title: string;
  description: string;
}

export interface Site extends Request {
  idx?: any; // site.idx
  user_ID?: string; // Wordpress user ID
  idx_user?: string; // site owner idx.
  terms_id_in_order?: string;
  domain?: string; // Needed to create a site.
  domains?: Array<Domain>; // Available on response
  name?: string; // site name
  author?: string; // poster/writer name. mostly blog owner's nickname.
  title?: string; // html title
  title_on_desktop?: '' | '1'; // to display title on desktop browser.
  title_on_mobile?: '' | '1'; // to display title on mobile.
  description?: string;
  keywords?: string;
  categories?: Categories;

  // HTML for site head.
  // @see https://docs.google.com/document/d/1nOEJVDilLbF0sNCkkRGcDwdT3rDLZp3h59oQ77BIdp4/edit#heading=h.bn3bu2qkurcu
  meta?: any;

  //
  favicon_url?: string; // favicon url
  app_name?: string;
  app_short_name?: string;
  app_theme_color?: string;
  app_icon_url?: string; //
  app_icon_url_72?: string; //
  app_icon_url_96?: string; //
  app_icon_url_128?: string; //
  app_icon_url_144?: string; //
  app_icon_url_152?: string; //
  app_icon_url_192?: string; //
  app_icon_url_384?: string; //
  app_icon_url_512?: string; //
  logo_url?: string;
  preview_image_url?: string;
  desktop_banner_image_url?: string; //
  mobile_banner_image_url?: string; //
  desktop_banner_click_url?: string;
  mobile_banner_click_url?: string;
  widget_desktop_comments?: 'Y' | '';
  widget_mobile_comments?: 'Y' | '';
  widget_desktop_posts?: 'Y' | '';
  widget_mobile_posts?: 'Y' | '';
  global_settings?: SiteGlobalSettings;

  // this is for advertisement
  adv_desktop?: SiteGlobalAdvertisement;
  adv_mobile?: SiteGlobalAdvertisement;

  // this is for chat
  chat_greeting?: string;
  chat_enabled?: string;

  footer?: string;

  no_of_posts?: string; // total number of posts of the site
  no_of_comments?: string; // total number of comments of the site

  pre?: boolean; // true if the site information has been preprocessed. This is only for client use.
  isNewSite?: boolean; // true if the site is newly created. This is only for client use.


  //
  notificationAdminNewPost?: string; // send push to admin on new post
  notificationAdminNewComment?: string; // send push to admin on new comment
  notificationParents?: string; // send push to parents on new comment
  notificationAllUsersNewPost?: string; // send push to all users on new post

  menu_default_theme?: string;

  backgroundColor?: string; // site background color
}

export interface SiteDashboard extends Request {
  idx?: string;
  no_of_users?: string;
  no_of_subscribers?: string;
  no_of_unique_visitor?: string;
  no_of_posts?: {
    idx?: string;
    name?: string;
    daily?: Array<string>;
  };
  total_no_of_posts?: {
    daily: Array<string>;
    total: string;
  };
  no_of_comments?: string;
  latest_posts?: Posts;
  latest_comment?: Comments;
}
export interface DomainApply extends Request {
  idx_site: string;
  domain: string;
}

export interface SiteGlobalSettings {
  max_domains: number;
  max_sites: number;
  available_domains: number;
  available_sites: number;
  domains_in_progress: string;
  root_domains: Array<string>;
}

export interface Sites {
  global_settings?: SiteGlobalSettings;
  sites?: Array<Site>;
}

export interface File {
  idx: string; // unique id to identify the uploaded file.
  idx_user: string; // user no
  relation: string;
  code: string;
  name: string; // file name
  type: string; // mime type of the file.
  size: string; // file size in bytes
  complete: 'y' | ''; // y | ''
  path: string; // saved file name or save path in server HDD
  url: string; // url of the file.
  stamp_created: string; // time of saved
  stamp_updated: string; // time of updated.
}

export type Files = Array<File>;
export interface PostUser {
  idx: string;
  name: string;
  stamp_create: string;
  photo_url: string;
}
export interface Post extends Request {
  idx?: string;
  idx_user?: string;
  idx_category?: string;
  idx_parent?: string;
  taxonomy?: string;
  relation?: any;
  slug?: string;
  title?: string;
  content?: string;
  content_stripped?: string;
  stamp_created?: number;
  stamp_updated?: number;
  stamp_deleted?: number;
  // This will only be available from backend. It must be empty array or undefined when it is sent to the backend.
  files?: Files;
  // This is for information backend which files to set to the post.
  files_idx?: Array<string>;
  comments?: Comments;
  good?: any;
  bad?: any;

  /**
   * Properties below are available only on Angular.
   */
  view?: boolean; // to show content or not.
  viewCommentEditor?: boolean; // To show comment input box or not.
  name?: string;
  // nickname?: string;
  // photo?: string;
  user?: PostUser;
  editor?: string; // to mark which editor (or what kind of wysiwyg editor) the post created with.
}

export type Posts = Array<Post>;

export interface Comment extends Request {
  idx?: string;
  readonly idx_root?: string; // No to pass to backend.
  idx_parent?: any;
  idx_user?: string;
  content?: string;
  content_stripped?: string;
  stamp_created?: string;
  stamp_updated?: string;
  stamp_deleted?: string;
  // This will only be available from backend. It must be empty array or undefined when it is sent to the backend.
  files?: Files;
  // This is for information backend which files to set to the post.
  files_idx?: Array<string>;
  depth?: string;

  show?: any; // This exists only on client end to show or not.
  photo?: string;
  name?: string;
  nickname?: string;
  good?: string;
  bad?: string;
}

export type Comments = Array<Comment>;

export interface PostList extends Request {
  idx_user?: any;
  idx_category?: string;
  slug?: string;
  taxonomy?: string;
  relation?: any;
  where?: string; // costum SQL where query.
  page?: number;
  limit?: any;
  posts?: Array<Post>;
}

export interface ChangeCategory extends Request {
  idx_post?: string;
  idx_category?: string;
}

export interface UserList extends Request {
  idx_site?: any;
  page?: number;
  limit?: any;
  users?: Array<User>;
}

export interface Vote extends Request {
  idx_post?: string;
  vote?: 'G' | 'B';
}

export interface VoteResponse extends Response {
  good: string;
  bad: string;
}

export interface LogGet extends Request {
  domain: string;
  Ymd: string;
  for: string;
}
export interface Log {
  Ymd: string;
  visit: string;
}

export type Logs = Array<Log>;
