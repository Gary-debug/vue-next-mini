import { LifecycleHooks } from "./component";

export function injectHook(
  type: LifecycleHooks,
  hook: Function,
  target
) {
  // 将 hook 注册到组件实例中
  if(target) {
    target[type] = hook;
    return hook;
  }
}

export const createHook = (lifecycle: LifecycleHooks) => {
  return (hook, target) => injectHook(lifecycle, hook, target);
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);