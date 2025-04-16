export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ success: true, value });
export const err = <E = Error>(error: E): Result<never, E> => ({
  success: false,
  error,
});

export const map = <T, U, E = Error>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  if (result.success) {
    return { success: true, value: fn(result.value) };
  }
  return result;
};

export const flatMap = <T, U, E = Error>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  if (result.success) {
    return fn(result.value);
  }
  return result;
};

export const getOrElse = <T, E = Error>(
  result: Result<T, E>,
  defaultValue: T
): T => {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
};

export const getOrThrow = <T, E = Error>(result: Result<T, E>): T => {
  if (result.success) {
    return result.value;
  }
  throw result.error;
};

export const fold = <T, E, U>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => U
): U => {
  if (result.success) {
    return onSuccess(result.value);
  }
  return onError(result.error);
};
