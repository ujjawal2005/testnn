import { Injectable } from '@angular/core';
import {User} from '../models';


@Injectable()
export class JwtService {

  getToken(): String {
    return window.localStorage['currentUser'];
  }

  saveToken(currentUser: User) {
    window.localStorage['currentUser'] = currentUser;
  }

  destroyToken() {
    window.localStorage.removeItem('currentUser');
  }

}
