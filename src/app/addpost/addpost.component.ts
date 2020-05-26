import { Component, OnInit } from '@angular/core';
import {FormGroup,FormControl,Validators} from "@angular/forms";
import { Router } from "@angular/router";
//Service
import { FirebaseService } from "../firebase.service";
//Post Model
import { Post } from "../models/Post";

@Component({
  selector: 'app-addpost',
  templateUrl: './addpost.component.html',
  styleUrls: ['./addpost.component.css']
})
export class AddpostComponent implements OnInit {

  constructor(private firebaseservice:FirebaseService,private router:Router) { }
  
  public tags:any[]=[];
  public image:any;

  public pertencetage:any=this.firebaseservice.percentage;
  
  public postForm=new FormGroup({
    title:new FormControl('',Validators.required),
    content:new FormControl('',Validators.required),
    cover:new FormControl('',Validators.required),
    tags:new FormControl('',Validators.required)
  });
  
  public handleInput($event:Event){ //manejara la entra del archivo - imagen
    this.image=$event.target["files"];
    console.log(this.image)
  }

  public async addPost(FormData:Post){
    await this.firebaseservice.addPost(FormData,this.image);
  }
  

  ngOnInit(): void {
    this.firebaseservice.getAllTags().then(tags=>{
     this.tags=tags;
    });
    this.firebaseservice.percentageChanges.subscribe(x=>this.pertencetage=x);
  }

}
