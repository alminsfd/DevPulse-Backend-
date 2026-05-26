export interface IUser {

     name: string,
     email: string,
     password: string,
     role?: string

}

export interface ILogin {
     email: string,
     password: string,
}