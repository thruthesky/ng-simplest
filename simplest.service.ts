import { Injectable, Inject } from '@angular/core';
import { SimplestConfigToken } from './simplest.config';
import { HttpClient } from '@angular/common/http';
import { SimplestConfig } from './simplest.interface';

@Injectable()
export class SimplestService {

    constructor(
        private http: HttpClient,
        @Inject(SimplestConfigToken) private config: SimplestConfig
    ) {
        console.log('SimplestService::constructor() : config: ', this.config);
    }
}



