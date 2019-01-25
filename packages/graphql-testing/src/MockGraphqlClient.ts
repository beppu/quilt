import ApolloClient, {ApolloClientOptions} from 'apollo-client';

import Operations from './Operations';

import MemoryApolloLink from './MemoryApolloLink';

export default class MockGraphQLClient extends ApolloClient<unknown> {
  readonly graphQLRequests: Operations;
  private memoryLink: MemoryApolloLink;

  constructor(options: ApolloClientOptions<unknown>) {
    const memoryLink = new MemoryApolloLink();
    super({
      ...options,
      link: memoryLink.concat(options.link),
    });
    this.memoryLink = memoryLink;
    this.graphQLRequests = memoryLink.requests;
  }

  async resolveAll() {
    await this.memoryLink.resolveAll();
  }
}
