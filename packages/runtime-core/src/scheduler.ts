let isFlushPending = false;
const resolvedPromise = Promise.resolve() as Promise<any>;
const pendingPreFlushCbs: Function[] = [];
let currentFlushPromise: Promise<void> | null=null;

export function queuePreFlushCb(cb: Function) {
  queueCb(cb, pendingPreFlushCbs)
}

function queueCb(cb: Function, pendingQueue: Function[]) {
  pendingQueue.push(cb);
  queueFlush();
}
// 依次执行队列中的函数
function queueFlush() {
  if(!isFlushPending) {
    isFlushPending = true;
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
// 回调函数，处理队列
function flushJobs() {
  isFlushPending = false;
  flushPreFlushCbs();
}
// 循环进行队列的处理
export function flushPreFlushCbs() {
  if(pendingPreFlushCbs.length) {
    let activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
    pendingPreFlushCbs.length = 0;

    for(let i=0; i<activePreFlushCbs.length; i++) {
      activePreFlushCbs[i]()
    }
  }
}