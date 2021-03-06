import * as React from 'react';

import {LoadProps} from '@shopify/async';
import {Async, AsyncPropsRuntime, DeferTiming} from '@shopify/react-async';
import {Omit} from '@shopify/useful-types';
import {DocumentNode} from 'graphql-typed';

import {Prefetch as PrefetchQuery} from './Prefetch';
import {Query} from './Query';
import {
  ConstantProps,
  AsyncQueryComponentType,
  QueryProps,
  VariableOptions,
} from './types';

interface QueryComponentOptions<Data, Variables>
  extends LoadProps<DocumentNode<Data, Variables>> {
  defer?: DeferTiming;
}

export function createAsyncQueryComponent<Data, Variables>({
  id,
  load,
  defer,
}: QueryComponentOptions<Data, Variables>): AsyncQueryComponentType<
  Data,
  Variables
> {
  function AsyncQuery(
    props: Omit<QueryProps<Data, Variables>, 'query'> & ConstantProps,
  ) {
    const [componentProps, asyncProps] = splitProps(props);

    return (
      <Async
        id={id}
        load={load}
        defer={defer}
        render={query =>
          query ? <Query query={query} {...componentProps as any} /> : null
        }
        {...asyncProps}
      />
    );
  }

  function Prefetch(props: VariableOptions<Variables> & ConstantProps) {
    const [componentProps, asyncProps] = splitProps(props);
    const {variables} = componentProps;

    return (
      <Async
        load={load}
        defer={DeferTiming.Mount}
        render={query =>
          query ? (
            <PrefetchQuery ignoreCache query={query} variables={variables} />
          ) : null
        }
        {...asyncProps}
      />
    );
  }

  function Preload(props: ConstantProps) {
    const asyncProps = splitProps(props)[1];
    return (
      <Async defer={DeferTiming.Idle} load={load} id={id} {...asyncProps} />
    );
  }

  type KeepFreshProps = VariableOptions<Variables> & {
    pollInterval?: number;
  };

  function KeepFresh(props: KeepFreshProps & ConstantProps) {
    const [componentProps, asyncProps] = splitProps(props);
    const {variables, pollInterval = 10_000} = componentProps;

    return (
      <Async
        load={load}
        defer={DeferTiming.Idle}
        render={query =>
          query ? (
            <PrefetchQuery
              query={query}
              pollInterval={pollInterval}
              variables={variables}
            />
          ) : null
        }
        {...asyncProps}
      />
    );
  }

  // Once we upgrade past TS 3.1, this will no longer be necessary,
  // because you can statically assign values to functions and TS
  // will know to augment its type
  const FinalComponent: AsyncQueryComponentType<
    Data,
    Variables
  > = AsyncQuery as any;

  FinalComponent.Preload = Preload;
  FinalComponent.Prefetch = Prefetch;
  FinalComponent.KeepFresh = KeepFresh;

  return FinalComponent;
}

function splitProps<Props>(
  props: Props & ConstantProps,
): [Props, AsyncPropsRuntime] {
  const {async, ...rest} = props as any;
  return [rest, async];
}
