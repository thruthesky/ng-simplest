export const CONFIG_NAME = 'SimplestConfig';


export interface SimplestConfig {
    backendUrl: string;
}


export interface Request {
    run?: string;        // strip string to run. format: "folder.file.function"
    user_no?: string;
    security_code?: string;
}

export interface Response {
    code: number;
    message?: string;
}


export interface FileCreateOptions extends Request {
    relation: string;       // the target object that this file is related to/in.
    code?: string;
}
export interface FileDeleteOptions extends Request {
    idx: string;            // files.idx
}

export interface File {
    idx: string;             // unique id to identify the uploaded file.
    user_no: string;            // user no
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





