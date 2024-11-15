import { Component } from '@angular/core';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  countryList:country[] = [
    new country("1", "India"),
    new country('2', 'USA'),
    new country('3', 'England')
  ];

  onSubmit(){
    console.log(this.onSubmit)
  }
}

export class country {
  id:string;
  name:string;
 
  constructor(id:string, name:string) {
    this.id=id;
    this.name=name;
  }
}