export type EventCallback<T> = (data: T) => void;
export type UnsubscribeCb = () => void;

class EventPublisher<T> {
  private readonly subscribers = new Map<string, Array<EventCallback<T>>>();

  subscribe (eventType: string, callback: EventCallback<T>): UnsubscribeCb {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)?.push(callback);
    return () => { this.unsubscribe(eventType, callback); };
  }

  unsubscribe (eventType: string, callback: EventCallback<T>): void {
    const subscriberCallbacks = this.subscribers.get(eventType);
    if (subscriberCallbacks == null) return;
    const index = subscriberCallbacks.indexOf(callback);
    if (index > -1) {
      console.log(':::::: unsub', index, eventType);
      subscriberCallbacks.splice(index, 1);
    }
  }

  publish (eventType: string, data: T): void {
    const subscriberCallbacks = this.subscribers.get(eventType);
    if (subscriberCallbacks != null) {
      subscriberCallbacks.forEach(callback => { callback(data); });
    }
  }
}

export default EventPublisher;
