export class AuthError extends Error {
  public code: string;
  public status?: number;

  constructor(message: string, code: string = 'auth_error', status?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

export class TokenError extends AuthError {
  constructor(message: string, status?: number) {
    super(message, 'token_error', status);
  }
}

export class ValidationError extends AuthError {
  constructor(message: string, status?: number) {
    super(message, 'validation_error', status);
  }
}

export class NetworkError extends AuthError {
  constructor(message: string, status?: number) {
    super(message, 'network_error', status);
  }
}
