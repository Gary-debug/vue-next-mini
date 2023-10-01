export function patchEvent(
  el: Element & {_vei?: Object},
  rawName: string,
  prevValue,
  nextValue
) {
  // vei = vue event invokers
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName];
  if(nextValue && existingInvoker) {
    // patch
    existingInvoker.value = nextValue
  } else {
    const name = parseName(rawName);
    if(nextValue) {
      // add
      const invoker = (invokers[rawName] = createInvoker(nextValue));
      el.addEventListener(name, invoker);
    } else if(existingInvoker) {
      // remove
      el.removeEventListener(name, existingInvoker);
      invokers[rawName] = undefined;
    }
  }
}

function parseName(name: string) {
  return name.slice(2).toLowerCase();
}

function createInvoker(initialValue) {
  const invoker = (e: Event) => {
    invoker.value && invoker.value();
  }

  invoker.value = initialValue;
  return invoker;
}