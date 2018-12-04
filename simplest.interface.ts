

export const CONFIG_NAME = 'SimplestConfig';


export interface SimplestConfig {
    backendUrl: string;
    enableLoginToAllSubdomains: boolean;
}


export interface Request {
    run?: string;        // strip string to run. format: "folder.file.function"
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
}




export interface FileCreateOptions extends Request {
    taxonomy?: string;
    relation?: any;
    code?: string;
}
export interface FileDeleteOptions extends Request {
    idx: string;            // files.idx
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
    posts_per_page?: string;
}
export type Categories = Array<Category>;








export interface Domain {
    domain: string;
    reason: string;
    status: string;
}


export interface Site extends Request {
    idx?: any;               // site.idx
    user_ID?: string;            // Wordpress user ID
    terms_id_in_order?: string;
    domain?: string;            // Needed to create a site.
    domains?: Array<Domain>;    // Avaiable on response
    name?: string;              // site name
    author?: string;            // poster/writer name. mostly blog owner's nickname.
    title?: string;             // html title
    description?: string;
    keywords?: string;
    categories?: Categories;

    // HTML for site head.
    // @see https://docs.google.com/document/d/1nOEJVDilLbF0sNCkkRGcDwdT3rDLZp3h59oQ77BIdp4/edit#heading=h.bn3bu2qkurcu
    meta?: any;

    //
    favicon_url?: string;        // favicon url
    app_name?: string;
    app_short_name?: string;
    app_theme_color?: string;
    app_icon_url?: string;      //
    app_icon_url_72?: string;            //
    app_icon_url_96?: string;            //
    app_icon_url_128?: string;          //
    app_icon_url_144?: string;          //
    app_icon_url_152?: string;          //
    app_icon_url_192?: string;          //
    app_icon_url_384?: string;          //
    app_icon_url_512?: string;          //
    logo_url?: string;
    preview_image_url?: string;
    desktop_banner_width_image_url?: string;  //
    mobile_banner_width_image_url?: string;  //
    widget_desktop_comments?: 'Y' | '';
    widget_mobile_comments?: 'Y' | '';
    widget_desktop_posts?: 'Y' | '';
    widget_mobile_posts?: 'Y' | '';
    global_settings?: SiteGlobalSettings;
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
    domains_in_progress: number;
    default_domains: Array<string>;
}

export interface Sites {
    global_settings?: SiteGlobalSettings;
    sites?: Array<Site>;
}

export interface File {
    idx: string;             // unique id to identify the uploaded file.
    idx_user: string;            // user no
    relation: string;
    code: string;
    name: string;           // file name
    type: string;       // mime type of the file.
    size: string;           // file size in bytes
    complete: 'y' | '';       // y | ''
    path: string;           // saved file name or save path in server HDD
    url: string;            // url of the file.
    stamp_created: string;  // time of saved
    stamp_updated: string;  // time of updated.
}

export type Files = Array<File>;


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

    /**
     * Properties below are available only on Angular.
     */
    view?: boolean; // to show content or not.
    viewCommentEditor?: boolean; // To show comment input box or not.
    photo: string;
}

export type Posts = Array<Post>;



export interface Comment extends Request {
    idx?: string;
    readonly idx_root?: string;                 // No to pass to backend.
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

    show?: any;     // This exists only on client end to show or not.
    photo: string;
}


export type Comments = Array<Comment>;

export interface PostList extends Request {
    idx_user?: any;
    idx_category?: string;
    slug?: string;
    taxonomy?: string;
    relation?: any;
    page?: number;
    limit?: number;
    posts?: Array<Post>;
}

