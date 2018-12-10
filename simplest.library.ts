import { ErrorObject, Post } from './simplest.interface';

export class SimplestLibrary {



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


    /**
     * Returns current host name.
     */
    currentDomain(): string {
        return location.hostname;
    }
    /**
     * Returns current root domain based on hostname
     */
    currentRootDomain(): string {
        return this.rootDomain(location.hostname);
    }
    /**
     * Returns root domain only like
     * @example
     *    returns 'abc.com' from 'www.abc.com'
     *    retruns 'abc.co.kr' from 'www.abc.co.kr' or 'sub.abc.co.kr'
     *
     * @param domain domain including subdomain
     *
     * @desc When you set cookie for all subdomains, you can use this method to get current root domain.
     */
    rootDomain(domain: string) {
        const splitArr = domain.split('.');
        const arrLen = splitArr.length;

        // Extracting the root domain here if there is a subdomain

        // If there are more than 3 parts of domain like below
        // 'www'.'abc'.'com'
        // 'www'.'abc'.'co'.'kr'
        if (arrLen > 2) {
            // Get the last two parts (always)
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            // Check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".co.kr")
            // Then get 3rd part as root domain
            if (splitArr[arrLen - 2].length === 2 && splitArr[arrLen - 1].length === 2) {
                // This is using a ccTLD
                domain = splitArr[arrLen - 3] + '.' + domain;
            }
        }
        return domain;
    }



    httpBuildQuery(params): string | null {
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



    /**
     * Gets data from localStroage and returns after JSON.parse()
     * .set() automatically JSON.stringify()
     * .get() automatically JSON.parse()
     *
     * @return
     *      null if there is error or there is no value.
     *      Or value that were saved.
     */
    get(key: string): any {
        const value = localStorage.getItem(key);
        if (value !== null) {
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        }
        return null;
    }




    /**
     * Saves data to localStorage.
     *
     * It does `JSON.stringify()` before saving, so you don't need to do it by yourself.
     *
     * @param key key
     * @param data data to save in localStorage
     */
    set(key, data): void {
        localStorage.setItem(key, JSON.stringify(data));
    }


    /**
     * Returns a url of post photo.
     * @param post post to get image url from
     * @param n Get n'th image url
     */
    postPhotoUrl(post: Post, n: number = 0): string {
        if (post && post.files && post.files[n] !== void 0 && post.files[n]['url'] !== void 0 ) {
            return post.files[0]['url'];
        } else {
            return null;
        }
    }

}
