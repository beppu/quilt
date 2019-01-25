import {ApolloLink, Observable, Operation, NextLink} from 'apollo-link';
import {MockRequest} from './types';

import Operations from './Operations';

export default class MemoryApolloLink extends ApolloLink {
  readonly requests = new Operations();
  private incompleteRequests = new Set<MockRequest>();

  constructor() {
    super();
  }

  request(operation: Operation, nextLink?: NextLink) {
    if (nextLink == null || !nextLink) {
      throw new Error('The memory link must not be a terminating link');
    }

    let resolver: Function;

    const promise = new Promise<void>(resolve => {
      resolver = resolve;
    });

    const request = {
      operation,
      resolve: () => {
        resolver();
        this.incompleteRequests.delete(request);

        return promise;
      },
    };

    this.requests.push(operation);
    this.incompleteRequests.add(request);

    return new Observable(observer => {
      return nextLink(operation).subscribe({
        complete() {
          const complete = observer.complete.bind(observer);
          promise.then(complete).catch(complete);
        },
        next(result) {
          const next = observer.next.bind(observer, result);
          promise.then(next).catch(next);
        },
        error(error) {
          const fail = observer.error.bind(observer, error);
          promise.then(fail).catch(fail);
        },
      });
    });
  }

  async resolveAll() {
    await Promise.all(
      Array.from(this.incompleteRequests).map(({resolve}) => resolve()),
    );
  }
}
