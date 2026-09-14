import "./number-input";

import { afterWebflowReady, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";

import type { NumberInputElement } from "./number-input";
import { initNumberInputs } from "./number-input";

const formatPrice = (price: number): string => {
  // Math.round is used inside to prevent floating point inaccuracies (e.g. 0.29 * 100 = 28.999999999999996)
  const truncated = Math.trunc(Math.round(price * 10000) / 100) / 100;
  const isInteger = Number.isInteger(truncated);

  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  }).format(truncated);
};

const getNumberFromAttribute = ({
  element,
  attributeName,
  isInteger,
}: {
  element: HTMLElement;
  attributeName: string;
  isInteger?: boolean;
}): number | null => {
  const attributeValue = element.getAttribute(attributeName);
  if (!attributeValue) {
    console.error(`Attribute "${attributeName}" is missing on element`, element);
    return null;
  }
  const numberValue = isInteger
    ? Number.parseInt(attributeValue)
    : Number.parseFloat(attributeValue);

  if (Number.isNaN(numberValue)) {
    console.error(`Attribute "${attributeName}" is not a valid number on element`, element);
    return null;
  }

  return numberValue;
};

const initPricingPackages = () => {
  const pricingPackageWrap = getHtmlElement({ selector: "[pricing-package=wrap]", log: "error" });

  if (!pricingPackageWrap) return;

  const standardPriceMonthly = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "standard-price-monthly",
  });

  const standardPriceYearly = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "standard-price-yearly",
  });

  const teamsPriceMonthly = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "teams-price-monthly",
  });

  const teamsPriceYearly = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "teams-price-yearly",
  });

  const extraPerUserMonthly = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "extra-per-user-monthly",
  });

  const extraPerUserYearly = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "extra-per-user-yearly",
  });

  const includedUsersInTeams = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "included-users-in-teams",
    isInteger: true,
  });

  const maxUsers = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "max-users",
    isInteger: true,
  });

  const minUsers = getNumberFromAttribute({
    element: pricingPackageWrap,
    attributeName: "min-users",
    isInteger: true,
  });

  if (
    standardPriceMonthly === null ||
    standardPriceYearly === null ||
    teamsPriceMonthly === null ||
    teamsPriceYearly === null ||
    extraPerUserMonthly === null ||
    extraPerUserYearly === null ||
    includedUsersInTeams === null ||
    maxUsers === null ||
    minUsers === null
  ) {
    console.error("Failed to initialize pricing packages");
    return;
  }

  const standardPriceElements = getMultipleHtmlElements({
    selector: "[pricing-package=standard-price]",
    log: "error",
  });

  const standardPriceSaveElements = getMultipleHtmlElements({
    selector: "[pricing-package=standard-price-save]",
    log: "error",
  });

  const teamsPriceElements = getMultipleHtmlElements({
    selector: "[pricing-package=teams-price]",
    log: "error",
  });

  const teamsPriceSaveElements = getMultipleHtmlElements({
    selector: "[pricing-package=teams-price-save]",
    log: "error",
  });

  const teamsSelectedUserNumberElements =
    getMultipleHtmlElements({
      selector: "[pricing-package=selected-user-number]",
      log: "error",
    }) || [];

  const extraUserPriceElements =
    getMultipleHtmlElements({
      selector: "[pricing-package=extra-user-price]",
      log: "error",
    }) || [];

  const monthlyOnlyElements =
    getMultipleHtmlElements({
      selector: "[pricing-package=monthly-only-element]",
      log: "error",
    }) || [];

  const yearlyOnlyElements =
    getMultipleHtmlElements({
      selector: "[pricing-package=yearly-only-element]",
      log: "error",
    }) || [];

  const packageTimeToggler = getHtmlElement({
    selector: "[pricing-package=time-toggler]",
    parent: pricingPackageWrap,
    log: "error",
  });

  if (
    !standardPriceElements ||
    !standardPriceSaveElements ||
    !teamsPriceElements ||
    !teamsPriceSaveElements ||
    !teamsSelectedUserNumberElements ||
    !packageTimeToggler
  ) {
    console.error("Failed to initialize pricing packages");
    return;
  }

  let isYearlyToggled = false;
  let currentSelectedUserNumber = includedUsersInTeams;

  const numberInputConfig = {
    min: minUsers,
    max: maxUsers,
    step: 1,
    defaultValue: includedUsersInTeams,
  };

  const initPricingPackageNumberInputs = () => {
    const numberInputWraps = getMultipleHtmlElements<NumberInputElement>({
      selector: "[number-input-id=teams]",
      log: "error",
    });

    if (!numberInputWraps) {
      console.error("Failed to find number input wraps");
      return;
    }

    numberInputWraps.forEach((wrap) => {
      wrap.setAttribute("min", `${numberInputConfig.min}`);
      wrap.setAttribute("max", `${numberInputConfig.max}`);
      wrap.setAttribute("step", `${numberInputConfig.step}`);
      wrap.setAttribute("default-val", `${numberInputConfig.defaultValue}`);
    });
  };

  const initTeamsSectionNumberInputs = () => {
    const numberInputWraps = getMultipleHtmlElements<NumberInputElement>({
      selector: "[number-input-id=teams-section]",
      log: "error",
    });

    if (!numberInputWraps) {
      console.error("Failed to find number input wraps");
      return;
    }

    numberInputWraps.forEach((wrap) => {
      wrap.setAttribute("min", `0`);
      wrap.setAttribute("max", `${numberInputConfig.max - numberInputConfig.defaultValue}`);
      wrap.setAttribute("step", `${numberInputConfig.step}`);
      wrap.setAttribute("default-val", `0`);
    });
  };

  initPricingPackageNumberInputs();
  initTeamsSectionNumberInputs();

  initNumberInputs();

  const getTeamsPrice = ({
    basePrice,
    extraUserPrice,
    userNumber,
  }: {
    basePrice: number;
    extraUserPrice: number;
    userNumber: number;
  }) => {
    const extraUsers = Math.max(0, userNumber - includedUsersInTeams);
    const extraUsersPrice = extraUsers * extraUserPrice;

    return {
      totalPrice: basePrice + extraUsersPrice,
      extraUsersPrice,
    };
  };

  type PackagePrices = {
    standardPrice: number;
    teamsPrice: number;
    teamsExtraUsersPrice: number;
  };

  const getMonthlyPrices = (): PackagePrices => {
    const teamsPrice = getTeamsPrice({
      basePrice: teamsPriceMonthly,
      extraUserPrice: extraPerUserMonthly,
      userNumber: currentSelectedUserNumber,
    });
    return {
      standardPrice: standardPriceMonthly,
      teamsPrice: teamsPrice.totalPrice,
      teamsExtraUsersPrice: teamsPrice.extraUsersPrice,
    };
  };

  const getYearlyPrices = (): PackagePrices => {
    const teamsPrice = getTeamsPrice({
      basePrice: teamsPriceYearly,
      extraUserPrice: extraPerUserYearly,
      userNumber: currentSelectedUserNumber,
    });
    return {
      standardPrice: standardPriceYearly,
      teamsPrice: teamsPrice.totalPrice,
      teamsExtraUsersPrice: teamsPrice.extraUsersPrice,
    };
  };

  const getYearlySavings = ({
    yearlyPrices,
    monthlyPrices,
  }: {
    yearlyPrices: PackagePrices;
    monthlyPrices: PackagePrices;
  }): { standardSavings: number; teamsSavings: number } => {
    const standardSavings = (monthlyPrices.standardPrice - yearlyPrices.standardPrice) * 12;
    const teamsSavings = (monthlyPrices.teamsPrice - yearlyPrices.teamsPrice) * 12;

    return {
      standardSavings,
      teamsSavings,
    };
  };

  const updatePricesWithUI = () => {
    const monthlyPrices = getMonthlyPrices();

    teamsSelectedUserNumberElements.forEach((element) => {
      element.textContent = `${currentSelectedUserNumber}`;
    });

    if (isYearlyToggled) {
      const yearlyPrices = getYearlyPrices();
      const savings = getYearlySavings({ yearlyPrices, monthlyPrices });

      standardPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(yearlyPrices.standardPrice)}`;
      });
      standardPriceSaveElements.forEach((element) => {
        element.textContent = `${formatPrice(savings.standardSavings)}`;
      });
      teamsPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(yearlyPrices.teamsPrice)}`;
      });
      teamsPriceSaveElements.forEach((element) => {
        element.textContent = `${formatPrice(savings.teamsSavings)}`;
      });
      extraUserPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(extraPerUserYearly)}`;
      });
      yearlyOnlyElements.forEach((element) => {
        element.classList.remove("is-hidden");
      });
      monthlyOnlyElements.forEach((element) => {
        element.classList.add("is-hidden");
      });
    } else {
      standardPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(monthlyPrices.standardPrice)}`;
      });
      teamsPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(monthlyPrices.teamsPrice)}`;
      });
      teamsPriceSaveElements.forEach((element) => {
        element.textContent = `${formatPrice(0)}`;
      });
      extraUserPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(extraPerUserMonthly)}`;
      });
      yearlyOnlyElements.forEach((element) => {
        element.classList.add("is-hidden");
      });
      monthlyOnlyElements.forEach((element) => {
        element.classList.remove("is-hidden");
      });
    }
  };

  const setupPackageTimeToggler = () => {
    packageTimeToggler.setAttribute("aria-checked", isYearlyToggled ? "true" : "false");

    packageTimeToggler.addEventListener("click", () => {
      isYearlyToggled = !isYearlyToggled;
      updatePricesWithUI();
    });
  };

  const handleUserNumberInputs = () => {
    const userNumberInputWrap = getHtmlElement<NumberInputElement>({
      selector: "[number-input-id=teams]",
      log: "error",
    });

    if (!userNumberInputWrap) {
      console.error("Failed to initialize user number input");
      return;
    }

    userNumberInputWrap.setValue(currentSelectedUserNumber);

    userNumberInputWrap.onChange((newValue) => {
      if (newValue < minUsers || newValue > maxUsers) {
        console.error(`User number must be between ${minUsers} and ${maxUsers}`);
        return;
      }
      currentSelectedUserNumber = newValue;

      updatePricesWithUI();
    });
  };

  // Initialize
  setupPackageTimeToggler();
  handleUserNumberInputs();

  isYearlyToggled = true;

  updatePricesWithUI();

  return {
    teamsPriceMonthly,
    teamsPriceYearly,
    extraPerUserMonthly,
    extraPerUserYearly,
    getTeamsPrice,
    numberInputConfig,
  };
};

const initTeamsSection = ({
  extraPerUserMonthly,
  extraPerUserYearly,
  getTeamsPrice,
  numberInputConfig,
  teamsPriceMonthly,
  teamsPriceYearly,
}: NonNullable<ReturnType<typeof initPricingPackages>>) => {
  const monthlyToggle = getHtmlElement({
    selector: "[teams-section=monthly-toggle]",
    log: "error",
  });
  const yearlyToggle = getHtmlElement({
    selector: "[teams-section=yearly-toggle]",
    log: "error",
  });
  const extraPerUserPriceElements = getMultipleHtmlElements({
    selector: "[teams-section=extra-user-price]",
    log: "error",
  });
  const additionalCostElements = getMultipleHtmlElements({
    selector: "[teams-section=additional-cost]",
    log: "error",
  });
  const baseCostElements = getMultipleHtmlElements({
    selector: "[teams-section=base-cost]",
    log: "error",
  });
  const totalCostElements = getMultipleHtmlElements({
    selector: "[teams-section=total-cost]",
    log: "error",
  });
  const additionalUsersElements = getMultipleHtmlElements({
    selector: "[teams-section=additional-users]",
    log: "error",
  });
  const includedUsersElements = getMultipleHtmlElements({
    selector: "[teams-section=included-users]",
    log: "error",
  });

  const teamsPriceSaveElements = getMultipleHtmlElements({
    selector: "[teams-section=teams-price-save]",
    log: "error",
  });

  const monthlyOnlyElements =
    getMultipleHtmlElements({
      selector: "[teams-section=monthly-only-element]",
      log: false,
    }) || [];

  const yearlyOnlyElements =
    getMultipleHtmlElements({
      selector: "[teams-section=yearly-only-element]",
      log: "error",
    }) || [];

  if (
    !monthlyToggle ||
    !yearlyToggle ||
    !extraPerUserPriceElements ||
    !additionalCostElements ||
    !baseCostElements ||
    !totalCostElements ||
    !additionalUsersElements ||
    !teamsPriceSaveElements ||
    !monthlyOnlyElements ||
    !yearlyOnlyElements ||
    !includedUsersElements
  ) {
    console.error("Failed to initialize teams section");
    return;
  }

  let isYearlyToggled = false;
  let currentAdditionalUsers = 0;

  const getCurrentUserNumber = () => {
    return numberInputConfig.defaultValue + currentAdditionalUsers;
  };

  const getMonthlyPrices = () => {
    const teamsPrice = getTeamsPrice({
      basePrice: teamsPriceMonthly,
      extraUserPrice: extraPerUserMonthly,
      userNumber: getCurrentUserNumber(),
    });
    return {
      baseCost: teamsPriceMonthly,
      totalCost: teamsPrice.totalPrice,
      additionalCost: teamsPrice.extraUsersPrice,
    };
  };

  const getYearlyPrices = () => {
    const teamsPrice = getTeamsPrice({
      basePrice: teamsPriceYearly,
      extraUserPrice: extraPerUserYearly,
      userNumber: getCurrentUserNumber(),
    });
    return {
      baseCost: teamsPriceYearly,
      totalCost: teamsPrice.totalPrice,
      additionalCost: teamsPrice.extraUsersPrice,
    };
  };

  const updatePricesWithUI = () => {
    const monthlyPrices = getMonthlyPrices();
    if (isYearlyToggled) {
      const yearlyPrices = getYearlyPrices();

      const yearlySavings = (monthlyPrices.totalCost - yearlyPrices.totalCost) * 12;

      additionalUsersElements.forEach((element) => {
        element.textContent = `${currentAdditionalUsers}`;
      });
      additionalCostElements.forEach((element) => {
        element.textContent = `${formatPrice(yearlyPrices.additionalCost)}`;
      });
      baseCostElements.forEach((element) => {
        element.textContent = `${formatPrice(yearlyPrices.baseCost)}`;
      });
      totalCostElements.forEach((element) => {
        element.textContent = `${formatPrice(yearlyPrices.totalCost)}`;
      });
      teamsPriceSaveElements.forEach((element) => {
        element.textContent = `${formatPrice(yearlySavings)}`;
      });

      yearlyOnlyElements.forEach((element) => {
        element.classList.remove("is-hidden");
      });
      monthlyOnlyElements.forEach((element) => {
        element.classList.add("is-hidden");
      });

      extraPerUserPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(extraPerUserYearly)}`;
      });

      yearlyToggle.setAttribute("aria-checked", "true");
      monthlyToggle.setAttribute("aria-checked", "false");
      yearlyToggle.classList.add("is-active");
      monthlyToggle.classList.remove("is-active");
    } else {
      additionalUsersElements.forEach((element) => {
        element.textContent = `${currentAdditionalUsers}`;
      });
      additionalCostElements.forEach((element) => {
        element.textContent = `${formatPrice(monthlyPrices.additionalCost)}`;
      });
      baseCostElements.forEach((element) => {
        element.textContent = `${formatPrice(monthlyPrices.baseCost)}`;
      });
      totalCostElements.forEach((element) => {
        element.textContent = `${formatPrice(monthlyPrices.totalCost)}`;
      });
      teamsPriceSaveElements.forEach((element) => {
        element.textContent = `${formatPrice(0)}`;
      });

      extraPerUserPriceElements.forEach((element) => {
        element.textContent = `${formatPrice(extraPerUserMonthly)}`;
      });

      yearlyOnlyElements.forEach((element) => {
        element.classList.add("is-hidden");
      });
      monthlyOnlyElements.forEach((element) => {
        element.classList.remove("is-hidden");
      });
      yearlyToggle.setAttribute("aria-checked", "false");
      monthlyToggle.setAttribute("aria-checked", "true");
      yearlyToggle.classList.remove("is-active");
      monthlyToggle.classList.add("is-active");
    }
  };

  const handleAdditionalUserInputs = () => {
    const additionalUserInputWrap = getHtmlElement<NumberInputElement>({
      selector: "[number-input-id=teams-section]",
      log: "error",
    });

    if (!additionalUserInputWrap) {
      console.error("Failed to initialize user number input");
      return;
    }

    additionalUserInputWrap.setValue(currentAdditionalUsers);

    additionalUserInputWrap.onChange((newValue) => {
      currentAdditionalUsers = newValue;

      updatePricesWithUI();
    });
  };

  const initialUiSetup = () => {
    includedUsersElements.forEach((element) => {
      element.textContent = `${numberInputConfig.defaultValue}`;
    });
  };

  const setupTimeToggles = () => {
    monthlyToggle.addEventListener("click", () => {
      isYearlyToggled = false;
      updatePricesWithUI();
    });
    yearlyToggle.addEventListener("click", () => {
      isYearlyToggled = true;
      updatePricesWithUI();
    });
  };

  // Initialize
  isYearlyToggled = true;
  initialUiSetup();
  setupTimeToggles();
  handleAdditionalUserInputs();
  updatePricesWithUI();
};

afterWebflowReady(() => {
  const pricingPackagesResult = initPricingPackages();

  if (!pricingPackagesResult) {
    console.error("Failed to initialize pricing packages");
    return;
  }

  initTeamsSection(pricingPackagesResult);
});
