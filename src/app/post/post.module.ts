import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import {PostRoutingModule} from './post-routing.module';
import { PostComponent } from "./post.component";
import { ReactiveFormsModule } from "@angular/forms";

@NgModule({
    imports:[
        PostRoutingModule,
        ReactiveFormsModule,
        CommonModule
    ],
    declarations:[PostComponent]
})

export class PostModule{}