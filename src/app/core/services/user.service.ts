import { Injectable } from '@angular/core';
import { Observable ,  BehaviorSubject ,  ReplaySubject } from 'rxjs';
import { HttpParams, HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { User } from '../models';
import { map ,  distinctUntilChanged } from 'rxjs/operators';


@Injectable()
export class UserService {
  private currentUserSubject = new BehaviorSubject<User>({} as User);
  public currentUser = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();

  constructor (
    private apiService: ApiService,
    private http: HttpClient,
    private jwtService: JwtService
  ) {}

  // Verify JWT in localstorage with server & load user's info.
  // This runs once on application startup.
  populate() {
    // If JWT detected, attempt to get & store user's info
    if (this.jwtService.getToken()) {
      this.apiService.get('/user')
      .subscribe(
        data => this.setAuth(data.user),
        err => this.purgeAuth()
      );
    } else {
      // Remove any potential remnants of previous auth states
      this.purgeAuth();
    }
  }

  setAuth(user: User) {
    // Save JWT sent from server in localstorage
    this.jwtService.saveToken(user);
    // Set current user data into observable
    this.currentUserSubject.next(user);
    // Set isAuthenticated to true
    this.isAuthenticatedSubject.next(true);
  }

  purgeAuth() {
    // Remove JWT from localstorage
    this.jwtService.destroyToken();
    // Set current user to an empty object
    this.currentUserSubject.next({} as User);
    // Set auth status to false
    this.isAuthenticatedSubject.next(false);
  }

  attemptAuth(type, credentials): Observable<User> {
    /*const params = new HttpParams()
      .set('username', username)
      .set('password', password)
      .set('grant_type', 'password');*/
    const params = new HttpParams()
      .set('username', credentials.email)
      .set('password', credentials.password)
      .set('grant_type', 'password');
    // const route = (type === 'login') ? '/login' : '';
    return this.apiService.postForToken('/oauth/token?username='
      + credentials.email + '&password=' + credentials.password
      + '&grant_type=password', {user: credentials})
      .pipe(map(
      data => {
        this.setAuth(data);
        return data;
      }
    ));

   /* return this.http.get<any>(`http://localhost:9191/api/oauth/token`,
      {
        headers: {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
          'Authorization': `Basic  Y2hpbGRjYXJlYXBwOnRlbXBvcmFyeQ==`
        },
        params: params
      });*/


  }

  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  // Update the user on the server (email, pass, etc)
  update(user): Observable<User> {
    return this.apiService
    .put('/user', { user })
    .pipe(map(data => {
      // Update the currentUser observable
      this.currentUserSubject.next(data.user);
      return data.user;
    }));
  }

}