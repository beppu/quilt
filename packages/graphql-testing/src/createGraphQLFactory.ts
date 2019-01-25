import {GraphQLRequest} from 'apollo-link';
import {
  ApolloReducerConfig,
  InMemoryCache,
  IntrospectionFragmentMatcher,
} from 'apollo-cache-inmemory';

import MockGraphQLClient from './MockGraphQLClient';
import MockApolloLink from './MockApolloLink';
import {GraphQLMock} from './types';

export interface Options {
  unionOrIntersectionTypes?: any[];
  cacheOptions?: ApolloReducerConfig;
}

function defaultGraphQLMock({operationName}: GraphQLRequest) {
  return new Error(
    `Can’t perform GraphQL operation '${operationName ||
      ''}' because no mocks were set.`,
  );
}

class GraphQL {
  client: MockGraphQLClient;
  private afterResolver: (() => void) | undefined;

  constructor(
    mock: GraphQLMock,
    {unionOrIntersectionTypes = [], cacheOptions = {}}: Options = {},
  ) {
    const cache = new InMemoryCache({
      fragmentMatcher: new IntrospectionFragmentMatcher({
        introspectionQueryResultData: {
          __schema: {
            types: unionOrIntersectionTypes,
          },
        },
      }),
      ...cacheOptions,
    });

    const mockLink = new MockApolloLink(mock);

    this.client = new MockGraphQLClient({
      link: mockLink,
      cache,
    });
  }

  afterResolve(resolver: () => void) {
    this.afterResolver = resolver;
  }

  async resolveAll() {
    await this.client.resolveAll();

    if (this.afterResolver) {
      this.afterResolver();
    }
  }
}

export default function createGraphQLFactory(options?: Options) {
  return function createGraphQLClient(mock: GraphQLMock = defaultGraphQLMock) {
    return new GraphQL(mock, options);
  };
}
