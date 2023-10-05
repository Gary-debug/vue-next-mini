import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers"

// 响应性 Map 缓存对象，key：target，value：proxy
export const reactiveMap = new WeakMap<object, any>();
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap) 
}

function createReactiveObject(
  target: object, 
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  // 如果该实例已经被代理，则直接读取
  const existingProxy = proxyMap.get(target)
  if(existingProxy) {
    return existingProxy;
  }
  // 未被代理则生成proxy实例
  const proxy = new Proxy(target, baseHandlers);
  proxy[ReactiveFlags.IS_REACTIVE] = true;
  // 缓存代理对象
  proxyMap.set(target, proxy);
  return proxy;
}

// 将指定数据变为 reactive 数据
export const ToReactive = <T extends unknown>(value: T): T => {
  return isObject(value) ? reactive(value as object) : value;
}

export function isReactive (value): boolean {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
} 