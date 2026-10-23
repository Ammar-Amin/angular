import { HttpErrorResponse } from '@angular/common/http';

/** Turns a failed request into something we can show to a user. */
export function toUserMessage(error: unknown, action: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return `Could not reach the server while trying to ${action}. Check your connection and try again.`;
    }
    if (error.status === 404) {
      return `We couldn't find that task. It may have been deleted.`;
    }
    if (error.status >= 500) {
      return `The server ran into a problem while trying to ${action}. Please try again.`;
    }
  }
  return `Something went wrong while trying to ${action}. Please try again.`;
}
