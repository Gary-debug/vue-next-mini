import { extend, isArray } from "@vue/shared";
import { Dep, createDep } from "./dep";
import { ComputedRefImpl } from "./computed";

export type EffectScheduler = (...args: any[]) => any;

type KeyToDepMap = Map<any, Dep>
/**
 * 1. key：响应性对象
 * 2. value：Map 对象
 *  1. key：响应性对象的指定属性
 *  2. value：指定对象的指定属性的执行函数
 */
const targetMap = new WeakMap<any, KeyToDepMap>()

export interface ReactiverEffectOptions {
  lazy?: boolean;
  scheduler?: EffectScheduler
}

export function effect<T = any>(fn: () => T, options?: ReactiverEffectOptions) {
  const _effect = new ReactiverEffect(fn);

  if(options) {
    extend(_effect, options);
  }

  if(!options || !options.lazy) {
    _effect.run();
  }
}

export let activeEffect: ReactiverEffect | undefined;

export class ReactiverEffect<T = any> {
  computed?: ComputedRefImpl<T>

  constructor(public fn: () => T, public scheduler: EffectScheduler | null = null) {}

  run () {
    activeEffect = this;
    return this.fn();
  }
  stop () {
    
  }
}

/**
 * 收集依赖
 * @param target 
 * @param key 
 */
export function track(target: object, key: unknown) {
  // 如果不存在执行函数，则直接 return
  if(!activeEffect) return;
  // 尝试从 targetMap 中，根据 target 获取 map
  let depsMap = targetMap.get(target);
  // 如果获取到的 map 不存在，则生成新的 map 对象，并把该对象赋值给对应的 value
  if(!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key);
  if(!dep) {
    // 为指定 map 指定 key，设置回调函数
    depsMap.set(key, (dep = createDep()))
  }
  trackEffects(dep);
}
/**
 * 利用dep依次跟踪指定key的所有effect
 */
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!);
}

/**
 * 触发依赖
 * @param target 
 * @param key 
 * @param newValue 
 */
export function trigger(target: object, key: unknown, newValue: unknown) {
  // 根据 target 获取存储的 map 实例
  const depsMap = targetMap.get(target);
  // 如果 map 不存在，则直接 return
  if(!depsMap) return;

  // 根据key，从 depsMap 中取出 value，该 value 是一个 ReactiveEffect
  const dep: Dep | undefined = depsMap.get(key);

  // 如果 effect 不存在，则直接return
  if(!dep) {
    return;
  }
  triggerEffects(dep);
}
/**
 * 依次触发dep中保存的依赖
 * @param dep 
 */
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep];

  // 先执行计算属性effects
  for(const effect of effects) {
    if(effect.computed) {
      triggerEffect(effect);
    }
  }

  for(const effect of effects) {
    if(!effect.computed) {
      triggerEffect(effect);
    }
  }
}
/**
 * 触发指定依赖
 * @param effect 
 */
export function triggerEffect(effect: ReactiverEffect) {
  if(effect.scheduler) {
    effect.scheduler()
  } else {
      effect.run()
  }
}