import { getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";

type NumberInputCallback = (value: number) => void;

export interface NumberInputElement extends HTMLElement {
  getValue: () => number;
  setValue: (value: number) => void;
  onChange: (callback: NumberInputCallback) => () => void;
}

export interface NumberInputInstance {
  element: NumberInputElement;
  getValue: () => number;
  setValue: (value: number) => void;
  onChange: (callback: NumberInputCallback) => () => void;
}

type NumberInputConfig = {
  id: string;
  min?: number;
  max?: number;
  step: number;
  defaultValue: number;
};

type NumberInputMember = {
  element: NumberInputElement;
  input: HTMLInputElement;
  decrease: HTMLButtonElement;
  increase: HTMLButtonElement;
  config: NumberInputConfig;
  callbacks: Set<NumberInputCallback>;
};

type NumberInputGroup = {
  value: number;
  members: NumberInputMember[];
};

const initializedElements = new WeakSet<NumberInputElement>();
const groups = new Map<string, NumberInputGroup>();
let anonymousGroupId = 0;
const repeatDelay = 400;
const repeatInterval = 80;

const parseAttributeNumber = (element: HTMLElement, name: string): number | undefined => {
  const value = element.getAttribute(name);

  if (value === null || value.trim() === "") return undefined;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const normalizeValue = (value: number, config: NumberInputConfig): number => {
  const minimum = config.min ?? Number.NEGATIVE_INFINITY;
  const maximum = config.max ?? Number.POSITIVE_INFINITY;
  const clampedValue = Math.min(maximum, Math.max(minimum, value));
  const stepOrigin = config.min ?? 0;
  const steppedValue =
    stepOrigin + Math.round((clampedValue - stepOrigin) / config.step) * config.step;
  const normalizedValue = Math.min(maximum, Math.max(minimum, steppedValue));

  return Number(normalizedValue.toFixed(12));
};

const setButtonState = (button: HTMLButtonElement, disabled: boolean): void => {
  button.disabled = disabled;
  button.classList.toggle("is-disabled", disabled);
  button.setAttribute("aria-disabled", String(disabled));
};

const setAriaLabelIfMissing = (element: HTMLElement, label: string): void => {
  const ariaLabel = element.getAttribute("aria-label");

  if (!ariaLabel || ariaLabel.trim() === "") {
    element.setAttribute("aria-label", label);
  }
};

const addButtonInteraction = (button: HTMLButtonElement, change: () => void): void => {
  let repeatTimeout: number | undefined;
  let repeatIntervalId: number | undefined;
  let repeatStarted = false;
  let activePointerId: number | undefined;

  const stopRepeating = (): void => {
    if (repeatTimeout !== undefined) window.clearTimeout(repeatTimeout);
    if (repeatIntervalId !== undefined) window.clearInterval(repeatIntervalId);
    if (activePointerId !== undefined && button.hasPointerCapture(activePointerId)) {
      button.releasePointerCapture(activePointerId);
    }

    repeatTimeout = undefined;
    repeatIntervalId = undefined;
    activePointerId = undefined;
    window.removeEventListener("blur", stopRepeating);
    document.removeEventListener("visibilitychange", stopRepeating);
  };

  const startRepeating = (): void => {
    repeatStarted = true;
    change();
    repeatIntervalId = window.setInterval(() => {
      if (button.disabled) {
        stopRepeating();
        return;
      }

      change();
    }, repeatInterval);
  };

  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || button.disabled) return;

    repeatStarted = false;
    stopRepeating();
    activePointerId = event.pointerId;
    button.setPointerCapture(event.pointerId);
    repeatTimeout = window.setTimeout(startRepeating, repeatDelay);
    window.addEventListener("blur", stopRepeating);
    document.addEventListener("visibilitychange", stopRepeating);
  });

  const stopPointerInteraction = (): void => {
    stopRepeating();
  };

  button.addEventListener("pointerup", stopPointerInteraction);
  button.addEventListener("pointercancel", stopPointerInteraction);
  button.addEventListener("lostpointercapture", stopPointerInteraction);
  button.addEventListener("click", () => {
    if (repeatStarted) {
      repeatStarted = false;
      return;
    }

    change();
  });
};

const renderMember = (member: NumberInputMember, value: number): void => {
  member.input.value = String(value);
  member.input.setAttribute("aria-valuenow", String(value));

  const { min, max } = member.config;
  setButtonState(member.decrease, min !== undefined && value <= min);
  setButtonState(member.increase, max !== undefined && value >= max);
};

const updateGroup = (group: NumberInputGroup, value: number, notify: boolean): void => {
  const normalizedValue = normalizeValue(value, group.members[0].config);
  const changed = normalizedValue !== group.value;
  group.value = normalizedValue;

  group.members.forEach((member) => {
    renderMember(member, normalizedValue);

    if (notify && changed) {
      member.callbacks.forEach((callback) => callback(normalizedValue));
    }
  });
};

const getConfig = (element: HTMLElement): NumberInputConfig | null => {
  const min = parseAttributeNumber(element, "min");
  const max = parseAttributeNumber(element, "max");
  const step = parseAttributeNumber(element, "step") ?? 1;
  const defaultValue = parseAttributeNumber(element, "default-val") ?? min ?? 0;

  if (step <= 0 || (min !== undefined && max !== undefined && min > max)) {
    console.error("Invalid number input configuration", element);
    return null;
  }

  const anonymousId = anonymousGroupId;
  anonymousGroupId += 1;
  const config = {
    id: element.getAttribute("number-input-id") || `number-input-anonymous-${anonymousId}`,
    min,
    max,
    step,
    defaultValue,
  };

  if (!Number.isFinite(normalizeValue(defaultValue, config))) {
    console.error("Invalid number input default value", element);
    return null;
  }

  return config;
};

const initializeMember = (
  element: NumberInputElement,
  config: NumberInputConfig
): NumberInputMember | null => {
  const input = getHtmlElement<HTMLInputElement>({
    selector: '[number-input="input"]',
    parent: element,
    log: "error",
  });
  const decrease = getHtmlElement<HTMLButtonElement>({
    selector: '[number-input="decrease"]',
    parent: element,
    log: "error",
  });
  const increase = getHtmlElement<HTMLButtonElement>({
    selector: '[number-input="increase"]',
    parent: element,
    log: "error",
  });

  if (!input || !decrease || !increase) {
    console.error("Invalid number input elements", element);
    return null;
  }

  input.type = "number";
  input.removeAttribute("value");
  if (config.min !== undefined) input.min = String(config.min);
  if (config.max !== undefined) input.max = String(config.max);
  input.step = String(config.step);
  input.setAttribute("aria-valuemin", String(config.min ?? ""));
  input.setAttribute("aria-valuemax", String(config.max ?? ""));

  decrease.type = "button";
  increase.type = "button";

  setAriaLabelIfMissing(decrease, "Decrease value");
  setAriaLabelIfMissing(increase, "Increase value");

  const member: NumberInputMember = {
    element,
    input,
    decrease,
    increase,
    config,
    callbacks: new Set(),
  };
  const group = groups.get(config.id) ?? {
    value: normalizeValue(config.defaultValue, config),
    members: [],
  };

  group.members.push(member);
  groups.set(config.id, group);
  renderMember(member, group.value);

  const getValue = () => group.value;
  const setValue = (value: number) => {
    if (Number.isFinite(value)) updateGroup(group, value, true);
  };
  const onChange = (callback: NumberInputCallback) => {
    group.members.find((groupMember) => groupMember.element === element)?.callbacks.add(callback);
    return () => {
      member.callbacks.delete(callback);
    };
  };

  element.getValue = getValue;
  element.setValue = setValue;
  element.onChange = onChange;

  addButtonInteraction(decrease, () => setValue(group.value - config.step));
  addButtonInteraction(increase, () => setValue(group.value + config.step));
  input.addEventListener("change", () => {
    const value = Number(input.value);
    if (Number.isFinite(value)) {
      setValue(value);
      input.removeAttribute("aria-invalid");
      return;
    }

    input.setAttribute("aria-invalid", "true");
    renderMember(member, group.value);
  });

  initializedElements.add(element);
  return member;
};

export const initNumberInputs = (): NumberInputInstance[] => {
  const elements =
    getMultipleHtmlElements<NumberInputElement>({
      selector: '[number-input="wrap"]',
      log: false,
    }) || [];

  elements.forEach((element) => {
    if (initializedElements.has(element)) return;

    const config = getConfig(element);
    if (!config) return;
    initializeMember(element, config);
  });

  const instances: NumberInputInstance[] = [];
  elements.forEach((element) => {
    if (initializedElements.has(element)) {
      instances.push({
        element,
        getValue: element.getValue,
        setValue: element.setValue,
        onChange: element.onChange,
      });
    }
  });

  return instances;
};
