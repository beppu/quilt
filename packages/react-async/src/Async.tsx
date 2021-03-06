import * as React from 'react';
import {LoadProps} from '@shopify/async';
import {Omit} from '@shopify/useful-types';
import {Effect} from '@shopify/react-effect';

import {DeferTiming} from './shared';
import {AsyncAssetContext, AsyncAssetManager} from './context/assets';

export interface AsyncPropsRuntime {
  defer?: DeferTiming;
}

interface Props<Value> extends LoadProps<Value>, AsyncPropsRuntime {
  manager?: AsyncAssetManager;
  render?(value: Value | null): React.ReactNode;
  renderLoading?(): React.ReactNode;
}

interface State<Value> {
  resolved: Value | null;
  loading: boolean;
}

/* eslint-disable camelcase */
declare const __webpack_require__: (id: string) => any;
declare const __webpack_modules__: {[key: string]: any};
/* eslint-enable camelcase */

type RequestIdleCallbackHandle = any;

interface RequestIdleCallbackOptions {
  timeout: number;
}

interface RequestIdleCallbackDeadline {
  readonly didTimeout: boolean;
  timeRemaining: (() => number);
}

interface WindowWithRequestIdleCallback {
  requestIdleCallback: ((
    callback: ((deadline: RequestIdleCallbackDeadline) => void),
    opts?: RequestIdleCallbackOptions,
  ) => RequestIdleCallbackHandle);
  cancelIdleCallback: ((handle: RequestIdleCallbackHandle) => void);
}

class ConnectedAsync<Value> extends React.Component<
  Props<Value>,
  State<Value>
> {
  state: State<Value> = initialState(this.props);

  private mounted = true;
  private idleCallbackHandle?: RequestIdleCallbackHandle;

  componentWillUnmount() {
    this.mounted = false;

    if (this.idleCallbackHandle != null && 'cancelIdleCallback' in window) {
      (window as WindowWithRequestIdleCallback).cancelIdleCallback(
        this.idleCallbackHandle,
      );
    }
  }

  componentDidMount() {
    if (this.state.resolved != null) {
      return;
    }

    const load = async () => {
      try {
        const resolved = await this.props.load();

        if (this.mounted) {
          this.setState({resolved: normalize(resolved), loading: false});
        }
      } catch (error) {
        // Silently swallowing errors for now
      }
    };

    if (
      this.props.defer === DeferTiming.Idle &&
      'requestIdleCallback' in window
    ) {
      this.idleCallbackHandle = (window as WindowWithRequestIdleCallback).requestIdleCallback(
        load,
      );
    } else {
      load();
    }
  }

  render() {
    const {
      id,
      manager,
      render = defaultRender,
      renderLoading = defaultRender,
    } = this.props;
    const {resolved, loading} = this.state;

    const effect =
      resolved != null && id != null && manager != null ? (
        <Effect
          kind={manager.effect}
          perform={() => manager.markAsUsed(id())}
        />
      ) : null;

    const content = loading ? renderLoading() : render(resolved);

    return (
      <>
        {effect}
        {content}
      </>
    );
  }
}

export function Async<Value>(props: Omit<Props<Value>, 'manager'>) {
  return (
    <AsyncAssetContext.Consumer>
      {manager => <ConnectedAsync manager={manager} {...props} />}
    </AsyncAssetContext.Consumer>
  );
}

function initialState<Value>(props: Props<Value>): State<Value> {
  const canResolve = props.defer == null && props.id;
  const resolved = canResolve && props.id ? tryRequire(props.id()) : null;

  return {
    resolved,
    loading: !canResolve,
  };
}

function defaultRender() {
  return null;
}

function normalize(module: any) {
  if (module == null) {
    return null;
  }

  const value = 'default' in module ? module.default : module;
  return value == null ? null : value;
}

function tryRequire(id: string) {
  if (
    /* eslint-disable camelcase */
    typeof __webpack_require__ === 'function' &&
    typeof __webpack_modules__ === 'object' &&
    __webpack_modules__[id]
    /* eslint-enable camelcase */
  ) {
    try {
      return normalize(__webpack_require__(id));
    } catch {
      // Just ignore failures
    }
  }

  return undefined;
}
