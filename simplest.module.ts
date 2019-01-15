import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { SimplestService } from './simplest.service';
import { SimplestConfig } from './simplest.interface';
import { SimplestConfigToken } from './simplest.config';

@NgModule({
    imports: [
        HttpClientModule
    ],
    exports: [
        HttpClientModule
    ],
    providers: [SimplestService],
})
export class SimplestModule {
    public static forRoot(config: SimplestConfig): ModuleWithProviders {
        return {
            ngModule: SimplestModule,
            providers: [
                SimplestService,
                { provide: SimplestConfigToken, useValue: config }
            ]
        };
    }
}

