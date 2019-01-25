import {Operation} from 'apollo-link';

export default class Operations {
  private requests: Operation[] = [];

  constructor(requests?: Operation[]) {
    this.requests = requests ? [...requests] : [];
  }

  [Symbol.iterator]() {
    return this.requests[Symbol.iterator]();
  }

  nth(index: number) {
    return index < 0
      ? this.requests[this.requests.length - 1 + index]
      : this.requests[index];
  }

  push(request: Operation) {
    this.requests.push(request);
  }

  all(operationName?: string): Operation[] {
    if (!operationName) {
      return this.requests;
    }

    const allMatchedOperations = this.requests.filter(
      req => req.operationName === operationName,
    );

    return allMatchedOperations;
  }

  last(operationName?: string): Operation {
    const lastOperation = operationName
      ? this.requests.reverse().find(req => req.operationName === operationName)
      : this.requests[this.requests.length - 1];

    if (lastOperation == null) {
      throw new Error(
        `no requests with operation '${operationName}' were found.`,
      );
    }

    return lastOperation;
  }
}
