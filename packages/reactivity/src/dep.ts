import {ReactiverEffect, effect} from './effect'

export type Dep = Set<ReactiverEffect>

// 根据 effects 生成 dep 实例
export const createDep = (effects?: ReactiverEffect[]): Dep => {
  const dep = new Set<ReactiverEffect>(effects) as Dep;

  return dep;
}