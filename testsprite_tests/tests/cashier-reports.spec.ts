import { expect, test, type Page, type Route } from "@playwright/test";

const baseUrl = "http://localhost:5173";
const cashierId = "000000000000000000000011";

const json = (route: Route, body: unknown) =>
  route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });

async function openCashierSession(page: Page) {
  await page.goto(`${baseUrl}/login`);
  await page.evaluate(({ id }) => {
    localStorage.setItem("token", "cashier-report-ui-test");
    localStorage.setItem("loginAt", String(Date.now()));
    localStorage.setItem("user", JSON.stringify({
      id,
      username: "cashier-one",
      tenantId: "000000000000000000000001",
      roles: ["CASHIER"],
    }));
  }, { id: cashierId });
}

const sensitiveSummary = {
  totalSales: 10000,
  totalOrders: 1,
  totalDiscount: 500,
  avgOrderValue: 10000,
  totalCost: 1,
  netProfit: 999999,
  totalProfit: 999999,
  actualReceivedFromOrders: 999999,
  debtRepaymentIncome: 999999,
  totalIncomeToday: 999999,
  netCashFlow: 999999,
  receivedBreakdown: [{ currency: "LAK", amount: 999999, amountInLAK: 999999 }],
  receivedByMethod: [{ method: "CASH", totalReceived: 999999, transactionCount: 1 }, { method: "TRANSFER", totalReceived: 888888, transactionCount: 1 }],
  breakdownByMethod: [{ method: "DEBT", totalSales: 777777, totalOrders: 1, totalDebt: 777777 }],
  profitByCategory: [{ category: "Secret", revenue: 999999, cost: 1, profit: 999998 }],
  breakdownBySaleMode: [{
    mode: "retail",
    totalSales: 10000,
    totalOrders: 1,
    totalDiscount: 500,
    totalProfit: 999999,
    avgOrderValue: 10000,
  }],
  hourlyBreakdown: [{ hour: 10, orders: 1, sales: 10000 }],
  cancelledOrders: { count: 0, amount: 999999 },
  returns: { count: 0, units: 0, value: 999999, damagedCost: 999999 },
};

test("cashier dashboard keeps the admin report layout without sensitive finance data", async ({ page }) => {
  let requestedCashierId = "";
  await page.route("http://localhost:8000/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/tenants/me")) return json(route, { shopName: "Cashier Shop", subscriptionPlan: "ENTERPRISE" });
    if (url.pathname.endsWith("/exchange-rates")) return json(route, { data: [] });
    if (url.pathname.endsWith("/reports/summary")) {
      requestedCashierId = url.searchParams.get("cashierId") || "";
      return json(route, sensitiveSummary);
    }
    return json(route, {});
  });

  await openCashierSession(page);
  await page.goto(`${baseUrl}/pos/dashboard`);

  await expect(page.getByRole("heading", { name: "Dashboard ຍອດຂາຍ" })).toBeVisible();
  await expect(page.getByText("ຈຳນວນບິນ", { exact: true })).toBeVisible();
  await expect(page.getByText("ສະເລ່ຍຕໍ່ບິນ", { exact: true })).toBeVisible();
  await expect(page.getByText("ກຳໄລຫຼັງສ່ວນຫຼຸດ", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ກຳໄລ", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ຮັບຈາກການຂາຍ", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ເງິນເຂົ້າສຸດທິ", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ສັດສ່ວນວິທີຊຳລະ", { exact: true })).toBeVisible();
  await expect(page.getByText("ເງິນສົດ", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("ເງິນໂອນ", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("ຕິດໜີ້", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("ສະກຸນເງິນທີ່ຮັບ", { exact: true })).toHaveCount(0);
  expect(requestedCashierId).toBe(cashierId);
});

test("cashier bills reuse admin bills but hide aggregate income and expense cards", async ({ page }) => {
  const requestedCashierIds: string[] = [];
  await page.route("http://localhost:8000/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/tenants/me")) return json(route, { shopName: "Cashier Shop", subscriptionPlan: "ENTERPRISE" });
    if (url.pathname.endsWith("/exchange-rates")) return json(route, { data: [] });
    if (url.pathname.endsWith("/financial-transactions")) {
      requestedCashierIds.push(url.searchParams.get("cashierId") || "");
      return json(route, {
        data: [{
          _id: "activity-own",
          transactionId: "OWN-001",
          sourceType: "SALE",
          direction: "IN",
          paymentMethod: "CASH",
          payments: [{ method: "CASH", currency: "LAK", amount: 10000, rate: 1, amountInLAK: 10000 }],
          grossReceivedInLAK: 10000,
          appliedAmountInLAK: 10000,
          changeInLAK: 0,
          status: "POSTED",
          migrationStatus: "COMPLETE",
          processedBy: { _id: cashierId, username: "cashier-one" },
          order: {
            _id: "order-own",
            orderId: "OWN-001",
            total: 10000,
            discount: 0,
            paymentMethod: "CASH",
            paidAmount: 10000,
            change: 0,
            remainingAmount: 0,
            status: "COMPLETED",
            paymentStatus: "PAID",
            saleMode: "retail",
            items: [{ product: "product-1", name: "Own sale", quantity: 1, price: 10000 }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        }],
        total: 1,
        page: 1,
        totalPages: 1,
        summary: {
          totalSales: 10000,
          totalOrders: 1,
          avgOrderValue: 10000,
          moneyIn: 999999,
          moneyOut: 999999,
          netProfit: 999999,
        },
      });
    }
    return json(route, {});
  });

  await openCashierSession(page);
  await page.goto(`${baseUrl}/pos/bills`);

  await expect(page.getByRole("heading", { name: "ບິນຂາຍຂອງຂ້ອຍ" })).toBeVisible();
  await expect(page.getByText("#OWN-001", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "cashier-one", exact: true })).toBeVisible();
  await expect(page.getByText("ເງິນອອກ", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ຮັບຈາກການຂາຍ", { exact: true })).toHaveCount(0);
  expect(requestedCashierIds.length).toBeGreaterThan(0);
  expect(requestedCashierIds.every((id) => id === cashierId)).toBe(true);
});
