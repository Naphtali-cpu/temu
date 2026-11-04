export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function assertValid(errors) {
  if (Object.keys(errors).length > 0) {
    throw new HttpError(422, 'Please correct the highlighted fields.', errors);
  }
}
