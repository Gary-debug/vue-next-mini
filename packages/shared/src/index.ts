export * from './toDisplayString'

export const isArray = Array.isArray;

export const isObject = (val: unknown) => {
  return val !== null && typeof val === 'object'
}

/**
 * 对比两个数据是否发生改变
 * @param value 
 * @param oldValue 
 * @returns 
 */
export const hasChanged = (value: any, oldValue: any): boolean => {
  return !Object.is(value, oldValue)
}

export const isFunction = (val: unknown): val is Function => {
  return typeof val === 'function';
}

export const extend = Object.assign

export const EMPTY_OBJ: {readonly [key: string]: any} = {}

export const isString = (val: unknown): val is string => typeof val === 'string';

const onRe = /^on[^a-z]/;

// 是否 on 开头
export const isOn = (key: string) => onRe.test(key);