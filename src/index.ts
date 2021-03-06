type ActionCollection<S, A> = {
  [type in keyof A]: (state: S, e: A[type]) => S;
};

export default class TypeRegi<S, A> {
  private state: S;

  private actionCollection: ActionCollection<S, A>;

  private subscriptions = new Map<number, (state: S) => void>();

  private timer: NodeJS.Timeout | null = null;

  private lastId: number = 0;

  public constructor(state: S, actionCollection: ActionCollection<S, A>) {
    this.state = state;
    this.actionCollection = actionCollection;
  }

  public dispatch<K extends keyof A>(type: K, payload: A[K]): void {
    const reducer = this.actionCollection[type];
    if (!reducer) {
      return;
    }
    const newState = reducer(this.state, payload);
    this.state = newState;

    this.fireTimer(() => {
      this.subscriptions.forEach(handler => handler(this.state));
    });
  }

  public getState() {
    return this.state;
  }

  public subscribe(handler: (state: S) => void): () => void {
    const id = this.lastId;
    this.lastId += 1;

    this.subscriptions.set(id, handler);

    // すでにsubscriptions実行のtimerがいるときはそれに任せる
    if (!this.timer) {
      this.fireTimer(() => {
        handler(this.state);
      });
    }

    return () => {
      this.subscriptions.delete(id);
    };
  }

  private fireTimer(fn: () => void) {
    if (this.timer) {
      this.clearTimer();
    }
    this.timer = setTimeout(() => {
      fn();
      this.clearTimer();
    }, 0);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = null;
  }
}
