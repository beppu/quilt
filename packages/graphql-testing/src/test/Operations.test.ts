import {Operation} from 'apollo-link';
import gql from 'graphql-tag';

import Operations from '../Operations';

function pushOperations(opertaions: Operations, opertaionList: Operation[]) {
  opertaionList.forEach(operation => opertaions.push(operation));
}

const Q1 = gql`
  {
    q1
  }
`;

const Q2 = gql`
  {
    q2
  }
`;

const Q3 = gql`
  {
    q3
  }
`;

const mockOperations: Operation[] = [
  {
    query: Q1,
    operationName: 'operation 1',
    variables: {},
    extensions: {},
    setContext: () => ({}),
    getContext: () => ({}),
    toKey: () => 'operation 1',
  },
  {
    query: Q2,
    operationName: 'operation 2',
    variables: {},
    extensions: {},
    setContext: () => ({}),
    getContext: () => ({}),
    toKey: () => 'operation 2',
  },
  {
    query: Q3,
    operationName: 'operation 2',
    variables: {},
    extensions: {},
    setContext: () => ({}),
    getContext: () => ({}),
    toKey: () => 'operation 2',
  },
];

const requests = new Operations();
pushOperations(requests, mockOperations);

describe('graphql-testing Operations', () => {
  it('gets last operation', () => {
    expect(requests.last().query).toBe(Q3);
  });

  it('gets nth operation', () => {
    expect(requests.nth(2).query).toBe(Q3);
    expect(requests.nth(-1).query).toBe(Q2);
  });

  it('gets all operations', () => {
    expect(requests.all().length).toBe(3);
  });

  it('gets all operations with name', () => {
    expect(requests.all('operation 1').length).toBe(1);
    expect(requests.all('operation 2').length).toBe(2);
  });

  it('throws an error when last operation of type does not exist', () => {
    const requests = new Operations();

    expect(() => requests.last('LostPet')).toThrow(
      "no requests with operation 'LostPet' were found.",
    );
  });
});
