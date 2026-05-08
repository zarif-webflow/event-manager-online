import { afterWebflowReady, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";

const formatPrice = (price: number): string => {
  // Math.round is used inside to prevent floating point inaccuracies (e.g. 0.29 * 100 = 28.999999999999996)
  const truncated = Math.trunc(Math.round(price * 10000) / 100) / 100;
  return truncated.toFixed(2);
};

const initPricingPackages = () => {
  const pricingPackageWrap = getHtmlElement({ selector: "[pricing-package=wrap]", log: "error" });

  if (!pricingPackageWrap) return;

  const yearlyOnlyElements =
    getMultipleHtmlElements({
      selector: "[pricing-package=yearly-only-element]",
    }) || [];

  const monthlyOnlyElements =
    getMultipleHtmlElements({
      selector: "[pricing-package=monthly-only-element]",
    }) || [];

  const standardPricingEl = getHtmlElement({
    selector: "[pricing-package=standard-price]",
    parent: pricingPackageWrap,
    log: "error",
  });
  const standardPriceSaveEl = getHtmlElement({
    selector: "[pricing-package=standard-price-save]",
    parent: pricingPackageWrap,
    log: "error",
  });

  const teamsPricingEl = getHtmlElement({
    selector: "[pricing-package=teams-price]",
    parent: pricingPackageWrap,
    log: "error",
  });
  const teamsPriceSaveEl = getHtmlElement({
    selector: "[pricing-package=teams-price-save]",
    parent: pricingPackageWrap,
    log: "error",
  });

  const teamsUserRangeInput = getHtmlElement({
    selector: "input[type=range]",
    log: "error",
    parent: pricingPackageWrap,
  });
  const teamsTotalPriceEl =
    getMultipleHtmlElements({
      selector: "[pricing-package=teams-total-price]",
      log: "error",
    }) || [];
  const teamsSelectedUserNumberEl =
    getMultipleHtmlElements({
      selector: "[pricing-package=selected-user-number]",
      log: "error",
    }) || [];
  const teamsTotalPriceBreakdownEl = getHtmlElement({
    selector: "[pricing-package=price-breakdown]",
    parent: pricingPackageWrap,
    log: "error",
  });

  const packageTimeToggler = getHtmlElement({
    selector: "[pricing-package=time-toggler]",
    parent: pricingPackageWrap,
    log: "error",
  });

  if (
    !standardPricingEl ||
    !standardPriceSaveEl ||
    !teamsPricingEl ||
    !teamsPriceSaveEl ||
    !teamsUserRangeInput ||
    !teamsTotalPriceEl ||
    !packageTimeToggler ||
    !yearlyOnlyElements ||
    !teamsTotalPriceBreakdownEl ||
    !teamsSelectedUserNumberEl ||
    !monthlyOnlyElements
  ) {
    console.error("Missing pricing packages elements");
    return;
  }

  const standardPricing = Number.parseFloat(standardPricingEl.textContent);
  const teamsPricing = Number.parseFloat(teamsPricingEl.textContent);

  const yearlySavePercentageStr = pricingPackageWrap.getAttribute("yearly-save-percentage") || "";
  const yearlySavePercentage = Number.parseFloat(yearlySavePercentageStr);

  const pricePerExtraUserStr = pricingPackageWrap.getAttribute("price-per-extra-user") || "";
  const pricePerExtraUser = Number.parseFloat(pricePerExtraUserStr);

  let isYearlyToggled = false;
  let currentSelectedUsers = 1;
  const maxNumberOfUsers = Number.parseInt(
    pricingPackageWrap.getAttribute("max-number-of-users") || ""
  );

  if (
    Number.isNaN(standardPricing) ||
    Number.isNaN(teamsPricing) ||
    Number.isNaN(yearlySavePercentage) ||
    Number.isNaN(maxNumberOfUsers) ||
    Number.isNaN(pricePerExtraUser)
  ) {
    console.error("Missing or invalid pricing packages numeric data");
    return;
  }

  const standardPricingYearlySave = standardPricing * (yearlySavePercentage / 100) * 12;

  const standardPricingYearly = standardPricing - standardPricing * (yearlySavePercentage / 100);
  const teamsPricingYearly = teamsPricing - teamsPricing * (yearlySavePercentage / 100);

  const showYearly = () => {
    standardPricingEl.textContent = formatPrice(standardPricingYearly);
    standardPriceSaveEl.textContent = formatPrice(standardPricingYearlySave);
    teamsPricingEl.textContent = formatPrice(teamsPricingYearly);

    yearlyOnlyElements.forEach((element) => {
      element.style.display = "block";
    });

    monthlyOnlyElements.forEach((element) => {
      element.style.display = "none";
    });
  };

  const showMonthly = () => {
    standardPricingEl.textContent = formatPrice(standardPricing);
    teamsPricingEl.textContent = formatPrice(teamsPricing);

    yearlyOnlyElements.forEach((element) => {
      element.style.display = "none";
    });

    monthlyOnlyElements.forEach((element) => {
      element.style.display = "block";
    });
  };

  const setUserValue = (userNumber: number) => {
    teamsSelectedUserNumberEl.forEach((element) => {
      element.textContent = `${userNumber}`;
    });

    if (userNumber > 1) {
      teamsTotalPriceBreakdownEl.style.display = "block";
    } else {
      teamsTotalPriceBreakdownEl.style.display = "none";
    }

    if (isYearlyToggled) {
      const teamsTotalPriceWithoutDiscount = teamsPricing + pricePerExtraUser * (userNumber - 1);

      const teamsPriceWithDiscount =
        teamsTotalPriceWithoutDiscount -
        teamsTotalPriceWithoutDiscount * (yearlySavePercentage / 100);
      teamsTotalPriceEl.forEach((element) => {
        element.textContent = `${formatPrice(teamsPriceWithDiscount)}`;
      });
      teamsPricingEl.textContent = `${formatPrice(teamsPriceWithDiscount)}`;

      teamsTotalPriceBreakdownEl.textContent = `(Basic €${formatPrice(teamsPricingYearly)} + ${userNumber - 1} x €${formatPrice(pricePerExtraUser - pricePerExtraUser * (yearlySavePercentage / 100))})`;

      teamsPriceSaveEl.textContent = formatPrice(
        teamsTotalPriceWithoutDiscount * (yearlySavePercentage / 100) * 12
      );
    } else {
      const teamsTotalPrice = teamsPricing + pricePerExtraUser * (userNumber - 1);

      teamsTotalPriceEl.forEach((element) => {
        element.textContent = `${formatPrice(teamsTotalPrice)}`;
      });
      teamsPricingEl.textContent = `${formatPrice(teamsTotalPrice)}`;

      teamsTotalPriceBreakdownEl.textContent = `(Basic €${formatPrice(teamsPricing)} + ${userNumber - 1} x €${formatPrice(pricePerExtraUser)})`;
    }
  };

  packageTimeToggler.addEventListener("click", () => {
    if (isYearlyToggled) {
      showMonthly();
    } else {
      showYearly();
    }
    isYearlyToggled = !isYearlyToggled;

    setUserValue(currentSelectedUsers);
  });

  isYearlyToggled = true;
  showYearly();
  setUserValue(currentSelectedUsers);

  teamsUserRangeInput.addEventListener("input", (event) => {
    const userNumber = Number.parseInt((event.target as HTMLInputElement).value);
    currentSelectedUsers = userNumber;
    setUserValue(userNumber);
  });
};

afterWebflowReady(() => {
  initPricingPackages();
});
