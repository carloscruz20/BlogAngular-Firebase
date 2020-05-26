import { Injectable } from '@angular/core';
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireStorage } from "@angular/fire/storage";
import { Router } from "@angular/router";
import { Observable,BehaviorSubject } from "rxjs";
import { map,take } from "rxjs/operators";
import { Post } from "./models/Post";


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private firestore:AngularFirestore,
    private storage:AngularFireStorage,
    private router:Router
  ) { }

  public filepath:any;
  public uploadPercent:Observable<number>;
  public downloadURL:Observable<string>;

  public percentage:any;
  public percentageChanges:BehaviorSubject<any>=new BehaviorSubject<any>(this.percentage);

  public setPercentage(percentage:any):void{
    this.percentage=percentage;
    this.percentageChanges.next(percentage);
  }

  //get all tags
  public async getAllTags(){
    let tags:any;
 
    await new Promise((resolver)=>{
      this.firestore.collection("tags").snapshotChanges().pipe(
        take(1),
        map(changes=>{
          let _tags=[];
          changes.forEach(t=>{
            _tags.push({id:t.payload.doc.id, ...t.payload.doc.data() as any})
          })
          return _tags;
        })
      ).subscribe(_tags=>{
        resolver();
        return  tags=_tags;
      }) 
    }).then(()=>{
      console.log("Tags fetched successfully");
    }).catch(err=>{
      console.log(err);
    })
    return tags;
  }

  public async uploadImage(files:any[]){
    const image=files[0];
    this.filepath=Date.now() + "-" + files[0]["name"];

    const fileRef=this.storage.ref(this.filepath);
    const task=this.storage.upload(this.filepath,image);

    this.uploadPercent=task.percentageChanges();
    this.uploadPercent.subscribe(percent=>{
      console.log("Percent:", percent);
      this.setPercentage(Math.trunc(percent));//convertir en decimal
    });
    await task.snapshotChanges().toPromise();
    this.downloadURL=await fileRef.getDownloadURL().toPromise();
  }

  public getPosts(){
    let posts=this.firestore.collection("Post").snapshotChanges();
    return posts.pipe(
      map(posts=>{
        let _posts =[];
        posts.forEach(p=>{
          _posts.push(p);
        });
        return _posts;
      })
    )
  }

  public async getPost(docId:string){
    let currentPost:any;
    await new Promise((resolver)=>{
      this.firestore.collection("Post").doc(docId).valueChanges().pipe(
        take(1),
        map(post=>{
          return post;
        })
      ).subscribe((post)=>{
        resolver();
        currentPost=post;
              });
    }).catch(err=>{
      console.log(err)
    })
    return currentPost;
  }
  
  public async getTagsName(tagsArray:any){
    let currenTags = tagsArray;
    let alltags =[];

    await new Promise((resolve)=>{
      this.firestore.collection("tags",ref=>ref.orderBy("name")).snapshotChanges().pipe(
        take(1),
        map(changes=>{
          let _tags=[];
          changes.forEach(t=>{
            if(currenTags.includes(t.payload.doc.id)){
              _tags.push({id:t.payload.doc.id, ... t.payload.doc.data() as any, status:true})
            }else{
              _tags.push({id:t.payload.doc.id, ... t.payload.doc.data() as any,status:false})
            }
          });
          return _tags;
        })
      ).subscribe(_tags=>{
        resolve();
        return alltags =_tags;
      })
    })
    return alltags
   }

  public async addPost(postObj:Post,files:any[]){
    await this.uploadImage(files);

    let newPost={
        tite:postObj["title"],
        content:postObj["content"],
        cover:this.downloadURL,
        fileref:this.filepath,
        tags:postObj["tags"]
    }

    await this.firestore.collection("Post").add(newPost);
    this.setPercentage(null);
    this.router.navigate(["/"]);
  }

  public async editPost(postObj: Post, files: any[], postId: string){
      
    let newTags;
    let editedTags = [];
    //console.log(postObj)
    
    //newObj
    let updatedPost = {
      title: postObj.title,
      content: postObj.content
    };
  
    //check if there are tags to add
    if(postObj.addTags.length > 0){
      newTags = postObj["tags"].concat(postObj["addTags"]);
      updatedPost["tags"] = newTags;
    }else{
      console.log("----> There are no tags to add")
    }

    //check if there are tags to remove
    if(postObj.removeTags.length > 0){
   
      if(updatedPost["tags"]){
      
        updatedPost["tags"].map((t) => {
          if(postObj.removeTags.indexOf(t) == -1){
            editedTags.push(t);
           }
        })
    

      }else{
        postObj["tags"].map((t)=> {
          if(postObj.removeTags.indexOf(t) == -1){
           editedTags.push(t);
          }
        })

      
      }
     
      if(editedTags.length == 0){
        console.log("a post must have at least one tag")
        return false;
      }else{
        updatedPost["tags"] = editedTags;
      }       
    }  

    if(files != null){
      await this.uploadImage(files);

      updatedPost["cover"] = this.downloadURL;
      updatedPost["fileref"] = this.filepath;

      const storageRef = this.storage.storage.ref();
      storageRef.child(postObj.fileref).delete()
      .then(()=>{
        console.log("image deleted")
      }).catch(err => {
        console.log(err)
      });
    }
    
    console.log(updatedPost)
    let p = await this.firestore.collection("posts").doc(postId).set(updatedPost, {merge: true});
 
  }

  public deletePost(postId:string,image:string){
    const storageRef=this.storage.storage.ref();
    storageRef.child(image).delete().then(()=>{
      console.log("Image delete")
    }).catch(err=>{
      console.log(err)
    });
    
    this.firestore.collection("Post").doc(postId).delete().then(()=>{
      console.log("Post Successfuly delete");
      this.router.navigate(["/"])
    }).catch(err=>{
      console.log(err)
    })

  }

}
