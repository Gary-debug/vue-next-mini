import {ReactiverEffect, effect} from './effect'

export type Dep = Set<ReactiverEffect>

export const createDep = (effects?: ReactiverEffect[]): Dep => {
  const dep = new Set<ReactiverEffect>(effects) as Dep;

  return dep;
}