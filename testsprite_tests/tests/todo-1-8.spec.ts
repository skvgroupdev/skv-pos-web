import { expect, test, type Page, type Route } from "@playwright/test";

const baseUrl = "http://localhost:5173";

async function openAdminSession(page: Page) {
  await page.goto(`${baseUrl}/login`);
  await page.evaluate(() => {
    localStorage.setItem("token", "todo-1-8-ui-test");
    localStorage.setItem("loginAt", String(Date.now()));
    localStorage.setItem("user", JSON.stringify({
      id: "000000000000000000000001",
      username: "todo-check",
      tenantId: "000000000000000000000001",
      roles: ["SHOP_ADMIN"],
    }));
  });
}

const json = (route: Route, body: unknown) =>
  route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });

const summaryResponse = {
  grossSales: 105000,
  totalSales: 100000,
  netSales: 100000,
  totalOrders: 2,
  totalDebt: 10000,
  totalDiscount: 5000,
  totalCost: 60000,
  netProfit: 40000,
  totalProfit: 40000,
  avgOrderValue: 50000,
  actualReceivedFromOrders: 90000,
  debtRepaymentIncome: 10000,
  debtRepaymentCount: 1,
  totalIncomeToday: 100000,
  netCashFlow: 100000,
  receivedBreakdown: [],
  receivedByMethod: [],
  profitByCategory: [],
  breakdownByMethod: [],
  breakdownBySaleMode: [],
  hourlyBreakdown: [],
  cancelledOrders: { count: 0, amount: 0 },
  returns: { count: 0, units: 0, value: 0, damagedCost: 0 },
};

test("overview, product movement and admin bills use the corrected reporting contract", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("http://localhost:8000/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/tenants/me")) return json(route, { shopName: "Todo Shop", subscriptionPlan: "ENTERPRISE" });
    if (url.includes("/reports/summary")) return json(route, summaryResponse);
    if (url.includes("/reports/inventory-valuation")) return json(route, {
      totalStock: 25,
      totalItems: 2,
      totalRetailValue: 250000,
      totalCostValue: 150000,
      lowStockCount: 1,
      costBreakdown: [],
      categoryBreakdown: [{ category: "General", stockCount: 25, productCount: 2 }],
    });
    if (url.includes("/reports/product-performance")) return json(route, {
      products: [{
        productId: "product-1",
        name: "Todo product",
        category: "General",
        currentStock: 10,
        minStock: 2,
        totalSold: 7,
        totalRevenue: 70000,
        totalCost: 40000,
        totalProfit: 30000,
        profitMargin: 42.8,
        ordersCount: 2,
        avgPrice: 10000,
        stockStatus: "normal",
        abcClass: "A",
        cumulativePercent: 70,
      }],
      categoryPerformance: [],
      summary: { totalProducts: 1, totalRevenue: 70000, totalProfit: 30000, totalUnitsSold: 7, avgProfitMargin: 42.8 },
    });
    if (url.includes("/reports/stock-movement")) return json(route, [
      { date: "2026-08-01", unitsSold: 3, ordersCount: 1 },
      { date: "2026-08-02", unitsSold: 4, ordersCount: 1 },
    ]);
    if (url.includes("/reports/low-stock-products")) return json(route, { data: [] });
    if (url.includes("/reports/customer-analytics")) return json(route, []);
    if (url.includes("/reports/customer-debt-summary")) return json(route, { customers: [] });
    if (url.includes("/financial-transactions")) return json(route, {
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
      summary: { ...summaryResponse, moneyIn: 100000, moneyOut: 0, change: 0, count: 2, net: 100000 },
    });
    if (url.includes("/returns")) return json(route, { data: [], total: 0, page: 1, totalPages: 1 });
    return json(route, {});
  });

  await openAdminSession(page);
  await page.goto(`${baseUrl}/admin`);
  await expect(page.getByText("ສ່ວນຫຼຸດໃຫ້ລູກຄ້າ", { exact: true })).toBeVisible();
  await expect(page.getByText("ກຳໄລຫຼັງສ່ວນຫຼຸດ", { exact: true })).toBeVisible();
  await expect(page.getByText("₭40,000", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "ສິນຄ້າ & ຄັງ" }).click();
  await expect(page.getByText("ການເຄື່ອນໄຫວສິນຄ້າ", { exact: true })).toBeVisible();
  await expect(page.getByText("Margin", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ກຳໄລລວມ", { exact: true })).toHaveCount(0);

  await page.goto(`${baseUrl}/admin/bills`);
  await expect(page.getByText("ສ່ວນຫຼຸດໃຫ້ລູກຄ້າ", { exact: true })).toBeVisible();
  await expect(page.getByText("ກຳໄລຫຼັງສ່ວນຫຼຸດ", { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("debt bill details render purchased items", async ({ page }) => {
  await page.route("http://localhost:8000/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/tenants/me")) return json(route, { shopName: "Todo Shop", subscriptionPlan: "ENTERPRISE" });
    if (url.includes("/debt/customers")) return json(route, {
      data: [{
        _id: "customer-1",
        name: "Debt customer",
        phone: "2055555555",
        totalDebt: 15000,
        unpaidOrders: 1,
        orderDebt: 15000,
        oldestDebt: "2026-08-01T00:00:00.000Z",
      }],
      total: 1,
      page: 1,
      totalPages: 1,
      summary: { totalDebt: 15000, customers: 1 },
    });
    if (url.includes("/debt/transactions")) return json(route, {
      transactions: [],
      total: 0,
      page: 1,
      totalPages: 1,
      analytics: { total: { totalAmount: 0, count: 0 }, byMethod: [], byCashier: [] },
    });
    if (url.includes("/debt/history/customer-1")) return json(route, []);
    if (url.includes("/orders") && url.includes("UNPAID_ALL")) return json(route, {
      data: [{
        _id: "order-1",
        orderId: "TODO-BILL-1",
        total: 20000,
        remainingAmount: 15000,
        payments: [{ currency: "LAK", amount: 5000, rate: 1, amountInLAK: 5000 }],
        items: [{ product: "product-1", name: "Purchased product", quantity: 2, price: 10000 }],
        saleMode: "retail",
        createdAt: "2026-08-01T00:00:00.000Z",
      }],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    if (url.includes("/exchange-rates")) return json(route, { data: [] });
    return json(route, {});
  });

  await openAdminSession(page);
  await page.goto(`${baseUrl}/admin/debts`);
  await page.getByRole("button", { name: "ເບິ່ງບິນ" }).click();
  await expect(page.getByText("Purchased product", { exact: true })).toBeVisible();
  await expect(page.getByText("10,000 ₭", { exact: true })).toBeVisible();
  await expect(page.getByText("20,000 ₭", { exact: true })).toHaveCount(2);
});

test("employee modal is responsive, validates login fields and sends a valid employee", async ({ page }) => {
  let employeePayload: Record<string, unknown> | undefined;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("http://localhost:8000/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/tenants/me")) return json(route, { shopName: "A very long shop name", subscriptionPlan: "ENTERPRISE" });
    if (url.includes("/users") && route.request().method() === "POST") {
      employeePayload = route.request().postDataJSON();
      return json(route, { _id: "employee-1", ...employeePayload });
    }
    if (url.includes("/users")) return json(route, {
      data: [{
        _id: "legacy-employee",
        username: "legacyemployee",
        name: "legacyemployee",
        roles: ["CASHIER"],
        userid: "LEG01",
        phone: "020 1111 1111",
        status: "ACTIVE",
      }],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    return json(route, {});
  });

  await openAdminSession(page);
  await page.goto(`${baseUrl}/admin/employees`);
  await expect(page.getByText("ຕ້ອງແກ້ເບີ Login", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ເພີ່ມພະນັກງານ" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox?.width).toBeLessThanOrEqual(390);

  await page.getByLabel("ຊື່ຜູ້ໃຊ້").fill("FreeUser");
  await page.getByLabel("ລະຫັດຜ່ານ *", { exact: true }).fill("123456");
  await page.getByLabel("ເບີໂທ Login *").fill("20123");
  await page.getByRole("button", { name: "ບັນທຶກ" }).click();

  await expect(page.getByText("ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 7 ຕົວ", { exact: true })).toBeVisible();
  await expect(page.getByText("ເບີໂທຕ້ອງເລີ່ມດ້ວຍ 20 ແລະ ມີ 10 ຕົວເລກ", { exact: true })).toBeVisible();
  expect(employeePayload).toBeUndefined();

  await page.getByLabel("ລະຫັດຜ່ານ *", { exact: true }).fill("secret7");
  await page.getByLabel("ເບີໂທ Login *").fill("2055555555");
  await page.getByRole("button", { name: "ບັນທຶກ" }).click();

  expect(employeePayload).toMatchObject({
    username: "freeuser",
    name: "freeuser",
    phone: "2055555555",
  });

  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}/login`);
  await expect(page.getByLabel("ເບີໂທ", { exact: true })).toHaveAttribute("placeholder", "20xxxxxxxx");
});
