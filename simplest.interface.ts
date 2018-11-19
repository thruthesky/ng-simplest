

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




export interface UserRegister extends Request {
    email: string;
    password: string;
    name?: string;
    nickname?: string;
}
export interface UserLogin extends Request {
    email: string;
    password: string;
}


export interface UserProfile {
    run: string;
    session_id: string;
}

export interface User extends Response {
    run?: string;
    session_id?: string;
    idx?: string;
    email?: string;
    password?: string;
    name?: string;
    nickname?: string;
}



export interface FileCreateOptions extends Request {
    relation: string;       // the target object that this file is related to/in.
    code?: string;
}
export interface FileDeleteOptions extends Request {
    idx: string;            // files.idx
}

export interface ImageGenerateOptions extends Request {
    idx: string;
    width: any;
    height: any;
    quality: any;
    mode: 'crop' | 'resize';
    relation: any;
    code: any;
    user_no: any;
}



export interface File {
    idx: string;             // unique id to identify the uploaded file.
    idx_user: string;            // user no
    relation: string;
    code: string;
    name: string;           // file name
    type: string;       // mime type of the file.
    size: string;           // file size in bytes
    complete: string;       // y | ''
    path: string;           // saved file name or save path in server HDD
    stamp_created: string;  // time of saved
    stamp_updated: string;  // time of updated.
    url: string;            // url of the file.
}






