class ReqQueue {
    constructor(tick) {
        this.lock = false;
        this.reqs = [];
        this.tick = tick;
    }
    async add(req) {
        return new Promise((resolve, reject) => {
            // wrap request
            this.reqs.push(async () => {
                try {
                    return resolve(await req());
                }
                catch (err) {
                    return reject(err);
                }
            });
            this.tick ? setTimeout(async () => this.turn(), 0) : this.turn();
        });
    }
    async turn() {
        if (this.lock) {
            return;
        }
        const wrap = this.reqs.shift();
        if (!wrap) {1.05
            return;
        }
        this.lock = true;
        await wrap();
        this.lock = false;
        this.tick ? setTimeout(async () => this.turn(), 0) : this.turn();
    }
}
