(() => {
  let __defineProperty = Object.defineProperty;
  let __hasOwnProperty = Object.hasOwnProperty;
  let __modules = {};
  let __commonjs;
  let __require = (id) => {
    let module = __modules[id];
    if (!module) {
      module = __modules[id] = {
        exports: {}
      };
      __commonjs[id](module.exports, module);
    }
    return module.exports;
  };
  let __toModule = (module) => {
    if (module && module.__esModule) {
      return module;
    }
    let result = {};
    for (let key in module) {
      if (__hasOwnProperty.call(module, key)) {
        result[key] = module[key];
      }
    }
    result.default = module;
    return result;
  };
  let __import = (id) => {
    return __toModule(__require(id));
  };
  let __export = (target, all) => {
    __defineProperty(target, "__esModule", {
      value: true
    });
    for (let name in all) {
      __defineProperty(target, name, {
        get: all[name],
        enumerable: true
      });
    }
  };
  __commonjs = {
    0(exports, module) {
      // source/eventemitter3.ts
      module.exports = EventEmitter;
    },

    4(exports, module) {
      // source/p-timeout.ts
      module.exports = pTimeout;
    },

    1(index) {
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
        enqueue(run, options4) {
          options4 = {
            priority: 0,
            ...options4
          };
          const element = {
            priority: options4.priority,
            run
          };
          if (this.size && this._queue[this.size - 1].priority >= options4.priority) {
            this._queue.push(element);
            return;
          }
          const index2 = lowerBound(this._queue, element, (a, b) => b.priority - a.priority);
          this._queue.splice(index2, 0, element);
        }
        dequeue() {
          const item = this._queue.shift();
          return item?.run;
        }
        filter(options4) {
          return this._queue.filter((element) => element.priority === options4.priority).map((element) => element.run);
        }
        get size() {
          return this._queue.length;
        }
      }

      // source/options.ts

      // source/index.ts
      __export(index, {
        DefaultAddOptions: () => DefaultAddOptions,
        Options: () => Options,
        Queue: () => Queue,
        QueueAddOptions: () => QueueAddOptions,
        default: () => PQueue
      });
      const p_timeout = __import(4 /* ./p-timeout */);
      const EventEmitter = __require(0 /* ./eventemitter3 */);
      const empty = () => {
      };
      const timeoutError = new p_timeout.TimeoutError();
      class PQueue extends EventEmitter {
        constructor(options4) {
          super();
          this._intervalCount = 0;
          this._intervalEnd = 0;
          this._pendingCount = 0;
          this._resolveEmpty = empty;
          this._resolveIdle = empty;
          options4 = {
            carryoverConcurrencyCount: false,
            intervalCap: Infinity,
            interval: 0,
            concurrency: Infinity,
            autoStart: true,
            queueClass: PriorityQueue,
            ...options4
          };
          if (!(typeof options4.intervalCap === "number" && options4.intervalCap >= 1)) {
            throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${options4.intervalCap?.toString() ?? ""}\` (${typeof options4.intervalCap})`);
          }
          if (options4.interval === void 0 || !(Number.isFinite(options4.interval) && options4.interval >= 0)) {
            throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${options4.interval?.toString() ?? ""}\` (${typeof options4.interval})`);
          }
          this._carryoverConcurrencyCount = options4.carryoverConcurrencyCount;
          this._isIntervalIgnored = options4.intervalCap === Infinity || options4.interval === 0;
          this._intervalCap = options4.intervalCap;
          this._interval = options4.interval;
          this._queue = new options4.queueClass();
          this._queueClass = options4.queueClass;
          this.concurrency = options4.concurrency;
          this._timeout = options4.timeout;
          this._throwOnTimeout = options4.throwOnTimeout === true;
          this._isPaused = options4.autoStart === false;
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
        async add(fn, options4 = {}) {
          return new Promise((resolve, reject) => {
            const run = async () => {
              this._pendingCount++;
              this._intervalCount++;
              try {
                const operation = this._timeout === void 0 && options4.timeout === void 0 ? fn() : p_timeout.default(Promise.resolve(fn()), options4.timeout === void 0 ? this._timeout : options4.timeout, () => {
                  if (options4.throwOnTimeout === void 0 ? this._throwOnTimeout : options4.throwOnTimeout) {
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
            this._queue.enqueue(run, options4);
            this._tryToStartAnother();
          });
        }
        async addAll(functions, options4) {
          return Promise.all(functions.map(async (function_) => this.add(function_, options4)));
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
        sizeBy(options4) {
          return this._queue.filter(options4).length;
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
    }
  };
  return __require(1);
})();
