// 对应 promise 的 pending 状态
let isFlushPending = false;
// promise.resolve()
const resolvedPromise = Promise.resolve() as Promise<any>;
// 代执行的任务队列
const pendingPreFlushCbs: Function[] = [];
// 当前的执行任务
let currentFlushPromise: Promise<void> | null=null;

// 队列预处理函数
export function queuePreFlushCb(cb: Function) {
  queueCb(cb, pendingPreFlushCbs)
}

// 队列处理函数
function queueCb(cb: Function, pendingQueue: Function[]) {
  // 将所有的回调函数，放入队列中
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
    // 去重
    let activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
    // 清空旧数据
    pendingPreFlushCbs.length = 0;

    // 循环处理
    for(let i=0; i<activePreFlushCbs.length; i++) {
      activePreFlushCbs[i]()
    }
  }
}