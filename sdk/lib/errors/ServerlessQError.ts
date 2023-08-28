export default class ServerlessQError extends Error {
  public code?: number 

  constructor(message: string, code?: number) {
    super(message)

    this.name = this.constructor.name
    this.code = code 

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor)
  }
}
