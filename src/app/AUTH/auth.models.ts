export interface Auth {
  uid: string;
  displayName: string;
  emailVerified: boolean;
  email: string;
  phoneNumber: string;
  photoURL: string;
  providerData: any[];
}