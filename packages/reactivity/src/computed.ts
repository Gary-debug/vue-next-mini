import { isFunction } from "@vue/shared";
import { Dep } from "./dep";
import { ReactiverEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

// 计算属性类
export class ComputedRefImpl<T> {

  public dep?: Dep = undefined
  private _value!: T;

  public readonly effect: ReactiverEffect<T>;

  public readonly __v_isRef = true;

  public _dirty = true; // 脏变量，为 false 时表示需要触发依赖。为 true 时表示需要重新执行 run 方法，获取数据。

  constructor(getter) {
    this.effect = new ReactiverEffect(getter, () => {
      // 判断当前脏的状态，如果为 false，表示需要触发依赖
      if(!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
    this.effect.computed = this;
  }

  get value() {
    trackRefValue(this)
    // 判断当前脏的状态，如果为 true，表示需要重新执行 run，获取最新数据
    if(this._dirty) {
      this._dirty = false;
      // 执行 run 函数
      this._value = this.effect.run();
    }

    // 返回计算之后的真实值
    return this._value;
  }
}

// 计算属性
export function computed(getterOrOptions) {
  let getter;

  const onlyGetter = isFunction(getterOrOptions);

  if(onlyGetter) {
    getter = getterOrOptions;
  }

  const Cref = new ComputedRefImpl(getter);

  return Cref;
}