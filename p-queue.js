(() => {
  let __defineProperty = Object.defineProperty;
  let __hasOwnProperty = Object.prototype.hasOwnProperty;
  let __commonJS = (callback, module) => () => {
    if (!module) {
      module = {exports: {}};
      callback(module.exports, module);
    }
    return module.exports;
  };
  let __markAsModule = (target) => {
    return __defineProperty(target, "__esModule", {value: true});
  };
  let __export = (target, all) => {
    __markAsModule(target);
    for (let name in all)
      __defineProperty(target, name, {get: all[name], enumerable: true});
  };
  let __exportStar = (target, module) => {
    __markAsModule(target);
    for (let key in module)
      if (__hasOwnProperty.call(module, key) && !__hasOwnProperty.call(target, key) && key !== "default")
        __defineProperty(target, key, {get: () => module[key], enumerable: true});
    return target;
  };
  let __toModule = (module) => {
    if (module && module.__esModule)
      return module;
    return __exportStar(__defineProperty({}, "default", {value: module, enumerable: true}), module);
  };

  // source/eventemitter3.ts
  var require_eventemitter3 = __commonJS((exports, module) => {
    module.exports = EventEmitter;
  });

  // source/p-timeout.ts
  var require_p_timeout = __commonJS((exports, module) => {
    module.exports = pTimeout;
  });

  // source/index.ts
  var require_index = __commonJS((exports) => {
    __export(exports, {
      default: () => PQueue
    });
    const p_timeout = __toModule(require_p_timeout());
    const EventEmitter2 = require_eventemitter3();
    const empty = () => {
    };
    const timeoutError = new p_timeout.TimeoutError();
    class PQueue extends EventEmitter2 {
      constructor(options3) {
        super();
        this._intervalCount = 0;
        this._intervalEnd = 0;
        this._pendingCount = 0;
        this._resolveEmpty = empty;
        this._resolveIdle = empty;
        options3 = {
          carryoverConcurrencyCount: false,
          intervalCap: Infinity,
          interval: 0,
          concurrency: Infinity,
          autoStart: true,
          queueClass: PriorityQueue,
          ...options3
        };
        if (!(typeof options3.intervalCap === "number" && options3.intervalCap >= 1)) {
          throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${options3.intervalCap?.toString() ?? ""}\` (${typeof options3.intervalCap})`);
        }
        if (options3.interval === void 0 || !(Number.isFinite(options3.interval) && options3.interval >= 0)) {
          throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${options3.interval?.toString() ?? ""}\` (${typeof options3.interval})`);
        }
        this._carryoverConcurrencyCount = options3.carryoverConcurrencyCount;
        this._isIntervalIgnored = options3.intervalCap === Infinity || options3.interval === 0;
        this._intervalCap = options3.intervalCap;
        this._interval = options3.interval;
        this._queue = new options3.queueClass();
        this._queueClass = options3.queueClass;
        this.concurrency = options3.concurrency;
        this._timeout = options3.timeout;
        this._throwOnTimeout = options3.throwOnTimeout === true;
        this._isPaused = options3.autoStart === false;
      }
      get _doesIntervalAllowAnother() {
        return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
      }
      get _doesConcurrentAllowAnother() {
        return this._pendingCount < this._concurrency;
      }
      _next() {
        this._pendingCount--;
        this._tryToStartAnother();
      }
      _resolvePromises() {
        this._resolveEmpty();
        this._resolveEmpty = empty;
        if (this._pendingCount === 0) {
          this._resolveIdle();
          this._resolveIdle = empty;
          this.emit("idle");
        }
      }
      _onResumeInterval() {
        this._onInterval();
        this._initializeIntervalIfNeeded();
        this._timeoutId = void 0;
      }
      _isIntervalPaused() {
        const now = Date.now();
        if (this._intervalId === void 0) {
          const delay = this._intervalEnd - now;
          if (delay < 0) {
            this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
          } else {
            if (this._timeoutId === void 0) {
              this._timeoutId = setTimeout(() => {
                this._onResumeInterval();
              }, delay);
            }
            return true;
          }
        }
        return false;
      }
      _tryToStartAnother() {
        if (this._queue.size === 0) {
          if (this._intervalId) {
            clearInterval(this._intervalId);
          }
          this._intervalId = void 0;
          this._resolvePromises();
          return false;
        }
        if (!this._isPaused) {
          const canInitializeInterval = !this._isIntervalPaused();
          if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
            this.emit("active");
            this._queue.dequeue()();
            if (canInitializeInterval) {
              this._initializeIntervalIfNeeded();
            }
            return true;
          }
        }
        return false;
      }
      _initializeIntervalIfNeeded() {
        if (this._isIntervalIgnored || this._intervalId !== void 0) {
          return;
        }
        this._intervalId = setInterval(() => {
          this._onInterval();
        }, this._interval);
        this._intervalEnd = Date.now() + this._interval;
      }
      _onInterval() {
        if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
          clearInterval(this._intervalId);
          this._intervalId = void 0;
        }
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
        this._processQueue();
      }
      _processQueue() {
        while (this._tryToStartAnother()) {
        }
      }
      get concurrency() {
        return this._concurrency;
      }
      set concurrency(newConcurrency) {
        if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
          throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
        }
        this._concurrency = newConcurrency;
        this._processQueue();
      }
      async add(fn, options3 = {}) {
        return new Promise((resolve, reject) => {
          const run = async () => {
            this._pendingCount++;
            this._intervalCount++;
            try {
              const operation = this._timeout === void 0 && options3.timeout === void 0 ? fn() : p_timeout.default(Promise.resolve(fn()), options3.timeout === void 0 ? this._timeout : options3.timeout, () => {
                if (options3.throwOnTimeout === void 0 ? this._throwOnTimeout : options3.throwOnTimeout) {
                  reject(timeoutError);
                }
                return void 0;
              });
              resolve(await operation);
            } catch (error) {
              reject(error);
            }
            this._next();
          };
          this._queue.enqueue(run, options3);
          this._tryToStartAnother();
        });
      }
      async addAll(functions, options3) {
        return Promise.all(functions.map(async (function_) => this.add(function_, options3)));
      }
      start() {
        if (!this._isPaused) {
          return this;
        }
        this._isPaused = false;
        this._processQueue();
        return this;
      }
      pause() {
        this._isPaused = true;
      }
      clear() {
        this._queue = new this._queueClass();
      }
      async onEmpty() {
        if (this._queue.size === 0) {
          return;
        }
        return new Promise((resolve) => {
          const existingResolve = this._resolveEmpty;
          this._resolveEmpty = () => {
            existingResolve();
            resolve();
          };
        });
      }
      async onIdle() {
        if (this._pendingCount === 0 && this._queue.size === 0) {
          return;
        }
        return new Promise((resolve) => {
          const existingResolve = this._resolveIdle;
          this._resolveIdle = () => {
            existingResolve();
            resolve();
          };
        });
      }
      get size() {
        return this._queue.size;
      }
      sizeBy(options3) {
        return this._queue.filter(options3).length;
      }
      get pending() {
        return this._pendingCount;
      }
      get isPaused() {
        return this._isPaused;
      }
      get timeout() {
        return this._timeout;
      }
      set timeout(milliseconds) {
        this._timeout = milliseconds;
      }
    }
  });

  // source/queue.ts

  // source/lower-bound.ts
  function lowerBound(array, value, comparator) {
    let first = 0;
    let count = array.length;
    while (count > 0) {
      const step = count / 2 | 0;
      let it = first + step;
      if (comparator(array[it], value) <= 0) {
        first = ++it;
        count -= step + 1;
      } else {
        count = step;
      }
    }
    return first;
  }

  // source/priority-queue.ts
  class PriorityQueue {
    constructor() {
      this._queue = [];
    }
    enqueue(run, options2) {
      options2 = {
        priority: 0,
        ...options2
      };
      const element = {
        priority: options2.priority,
        run
      };
      if (this.size && this._queue[this.size - 1].priority >= options2.priority) {
        this._queue.push(element);
        return;
      }
      const index = lowerBound(this._queue, element, (a, b) => b.priority - a.priority);
      this._queue.splice(index, 0, element);
    }
    dequeue() {
      const item = this._queue.shift();
      return item?.run;
    }
    filter(options2) {
      return this._queue.filter((element) => element.priority === options2.priority).map((element) => element.run);
    }
    get size() {
      return this._queue.length;
    }
  }

  // source/options.ts
  require_index();
})();
