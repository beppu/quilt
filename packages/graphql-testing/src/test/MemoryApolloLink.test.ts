import {ApolloLink} from 'apollo-link';
import {executeOnce, SimpleLink} from './utilities/apollo-link';

import MemoryApolloLink from '../MemoryApolloLink';
import petQuery from './fixtures/PetQuery.graphql';

describe('MemoryApolloLink', () => {
  it('adds query to requests when executed', () => {
    const memoryApolloLink = new MemoryApolloLink();

    executeOnce(
      ApolloLink.from([memoryApolloLink, new SimpleLink()]),
      petQuery,
    );

    const allRequests = memoryApolloLink.requests.all();
    expect(allRequests).toHaveLength(1);
  });

  it('resolves all queries when resolveAll is called', async () => {
    const memoryApolloLink = new MemoryApolloLink();

    const outcome = executeOnce(
      ApolloLink.from([memoryApolloLink, new SimpleLink()]),
      petQuery,
    );

    await memoryApolloLink.resolveAll();
    const results = await outcome;
    expect(results).toHaveProperty('operation.operationName', 'Pet');
  });
});
