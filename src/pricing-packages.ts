import { afterWebflowReady, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";

const formatPrice = (price: number): string => {
  // Math.round is used inside to prevent floating point inaccuracies (e.g. 0.29 * 100 = 28.999999999999996)
  const truncated = Math.trunc(Math.round(price * 10000) / 100) / 100;
  return truncated.toFixed(2);
};

const initPricingPackages = () => {
  const pricingPackageWrap = getHtmlElement({ selector: "[pricing-package=wrap]", log: "error" });

  if (!pricingPackageWrap) return;

  const billedYearlyTexts = getMultipleHtmlElements({
    selector: "[pricing-package=billed-yearly-text]",
    parent: pricingPackageWrap,
  });

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
    selector: "div",
    log: "error",
    parent: pricingPackageWrap,
  });
  const teamsTotalPriceEl = getHtmlElement({
    selector: "div",
    parent: pricingPackageWrap,
    log: "error",
  });
  //   const teamsUserRangeInput = getHtmlElement({
  //     selector: "input[type=range]",
  //     log: "error",
  //     parent: pricingPackageWrap,
  //   });
  //   const teamsTotalPriceEl = getHtmlElement({
  //     selector: "[pricing-package=teams-total-price]",
  //     parent: pricingPackageWrap,
  //     log: "error",
  //   });

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
    !billedYearlyTexts
  ) {
    console.error("Missing pricing packages elements");
    return;
  }

  const standardPricing = Number.parseFloat(standardPricingEl.textContent);
  const teamsPricing = Number.parseFloat(teamsPricingEl.textContent);

  const yearlySavePercentageStr = pricingPackageWrap.getAttribute("yearly-save-percentage") || "";
  const yearlySavePercentage = Number.parseFloat(yearlySavePercentageStr);

  let isYearlyToggled = false;
  const defaultNumberOfUsers = 1;
  const maxNumberOfUsers = Number.parseInt(
    pricingPackageWrap.getAttribute("max-number-of-users") || ""
  );

  if (
    Number.isNaN(standardPricing) ||
    Number.isNaN(teamsPricing) ||
    Number.isNaN(yearlySavePercentage) ||
    Number.isNaN(maxNumberOfUsers)
  ) {
    console.error("Missing or invalid pricing packages numeric data");
    return;
  }

  const standardPricingYearlySave = standardPricing * (yearlySavePercentage / 100) * 12;
  const teamsPricingYearlySave = teamsPricing * (yearlySavePercentage / 100) * 12;

  const standardPricingYearly = standardPricing - standardPricing * (yearlySavePercentage / 100);
  const teamsPricingYearly = teamsPricing - teamsPricing * (yearlySavePercentage / 100);

  const showYearly = () => {
    standardPricingEl.textContent = formatPrice(standardPricingYearly);
    standardPriceSaveEl.textContent = formatPrice(standardPricingYearlySave);
    teamsPricingEl.textContent = formatPrice(teamsPricingYearly);
    teamsPriceSaveEl.textContent = formatPrice(teamsPricingYearlySave);

    billedYearlyTexts.forEach((textEl) => {
      textEl.style.display = "block";
    });
  };

  const showMonthly = () => {
    standardPricingEl.textContent = formatPrice(standardPricing);
    teamsPricingEl.textContent = formatPrice(teamsPricing);

    billedYearlyTexts.forEach((textEl) => {
      textEl.style.display = "none";
    });
  };

  packageTimeToggler.addEventListener("click", () => {
    if (isYearlyToggled) {
      showMonthly();
    } else {
      showYearly();
    }
    isYearlyToggled = !isYearlyToggled;
  });

  showYearly();
  isYearlyToggled = true;
};

afterWebflowReady(() => {
  initPricingPackages();
});
