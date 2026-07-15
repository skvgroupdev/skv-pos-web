import { expect, test } from "@playwright/test";

const baseUrl = "http://127.0.0.1:5175";

async function openAdminSession(page: import("@playwright/test").Page) {
  await page.goto(`${baseUrl}/login`);
  await page.evaluate(() => {
    localStorage.setItem("token", "read-only-layout-test");
    localStorage.setItem("loginAt", String(Date.now()));
    localStorage.setItem("user", JSON.stringify({
      id: "000000000000000000000001",
      username: "layout-test",
      tenantId: "000000000000000000000001",
      roles: ["SHOP_ADMIN"],
    }));
  });
}

test("admin financial, debt and dashboard pages render", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await openAdminSession(page);

  await page.goto(`${baseUrl}/admin/bills`);
  await expect(page.getByRole("heading", { name: "ການເງິນ ແລະ ໃບບິນ" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "ຈຳນວນທີ່ຮັບ" })).toBeVisible();
  await page.screenshot({ path: "test-results/admin-bills-desktop.png", fullPage: true });

  await page.goto(`${baseUrl}/admin/debts`);
  await expect(page.getByRole("heading", { name: "ຄຸ້ມຄອງໜີ້" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "ລູກໜີ້" })).toBeVisible();

  await page.goto(`${baseUrl}/admin`);
  await expect(page.getByRole("heading", { name: "ພາບລວມຮ້ານຄ້າ" })).toBeVisible();
  await expect(page.getByText("ຮັບຊຳລະໜີ້", { exact: true })).toBeVisible();

  await page.goto(`${baseUrl}/admin/reports`);
  await expect(page.getByRole("heading", { name: "ລາຍງານການຂາຍ" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "ປະເພດການຂາຍ" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("admin bills remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAdminSession(page);
  await page.goto(`${baseUrl}/admin/bills`);
  await expect(page.getByRole("heading", { name: "ການເງິນ ແລະ ໃບບິນ" })).toBeVisible();
  await expect(page.getByText("ເງິນເຂົ້າ", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/admin-bills-mobile.png", fullPage: true });
});

test("admin debts accepts the wrapped exchange-rate response", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/exchange-rates")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ _id: "rate-thb", currency: "THB", rate: 650, isBase: false, updatedAt: new Date().toISOString() }],
        }),
      });
      return;
    }
    if (url.includes("/debt/customers")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: [], total: 0, page: 1, totalPages: 1, summary: { totalDebt: 0, customers: 0 } }),
      });
      return;
    }
    if (url.includes("/debt/transactions")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ transactions: [], total: 0, page: 1, totalPages: 1, analytics: { total: { totalAmount: 0, count: 0 }, byMethod: [], byCashier: [] } }),
      });
      return;
    }
    await route.continue();
  });

  await openAdminSession(page);
  await page.goto(`${baseUrl}/admin/debts`);
  await expect(page.getByRole("heading", { name: "ຄຸ້ມຄອງໜີ້" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("financial return details and sales receipt summary render from API totals", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/financial-transactions")) {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        data: [{
          _id: "sale-1", transactionId: "TX-SALE-1", sourceType: "SALE", direction: "IN",
          order: { _id: "order-1", orderId: "BILL-1", saleMode: "retail", total: 48000, paidAmount: 48000, change: 0, remainingAmount: 0, status: "COMPLETED", paymentStatus: "PAID", items: [{ product: "product-1", name: "Test item", quantity: 2, price: 24000 }] },
          paymentMethod: "CASH", payments: [{ method: "CASH", currency: "LAK", amount: 33000, rate: 1, amountInLAK: 33000 }],
          grossReceivedInLAK: 33000, appliedAmountInLAK: 33000, changeInLAK: 0, status: "POSTED", migrationStatus: "COMPLETE", createdAt: new Date().toISOString(),
        }],
        total: 1, page: 1, totalPages: 1, summary: { moneyIn: 48000, moneyOut: 15000, change: 0, count: 3, net: 33000 },
      }) });
      return;
    }
    if (url.includes("/returns")) {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        data: [{ returnId: "RT-1", order: { _id: "order-1", orderId: "BILL-1", total: 48000 }, items: [
          { product: "product-1", name: "Test item", quantity: 1, price: 24000, condition: "SELLABLE", disposition: "NO_RESTOCK" },
          { product: "product-2", name: "Damaged item", quantity: 1, price: 12000, condition: "DAMAGED", disposition: "WRITE_OFF" },
        ], refundAmount: 15000, reasonCode: "CUSTOMER_REQUEST", note: "partial return", createdAt: new Date().toISOString() }],
        total: 1, page: 1, totalPages: 1,
      }) });
      return;
    }
    if (url.includes("/orders?")) {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        data: [], total: 2, page: 1, totalPages: 1,
        summary: { totalSales: 48000, totalOrders: 2, totalDebt: 15000, totalPaid: 33000 },
      }) });
      return;
    }
    if (url.includes("/reports/summary")) {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        totalSales: 48000, totalOrders: 2, totalDiscount: 0, avgOrderValue: 24000, totalProfit: 18000, netSales: 48000, netCashFlow: 33000,
        receivedBreakdown: [], profitByCategory: [], breakdownByMethod: [], hourlyBreakdown: [],
        breakdownBySaleMode: [
          { mode: "retail", totalSales: 33000, totalOrders: 1, totalDiscount: 0, totalCost: 20000, totalProfit: 13000, avgOrderValue: 33000 },
          { mode: "wholesale", totalSales: 15000, totalOrders: 1, totalDiscount: 0, totalCost: 10000, totalProfit: 5000, avgOrderValue: 15000 },
        ],
      }) });
      return;
    }
    await route.continue();
  });

  await openAdminSession(page);
  await page.goto(`${baseUrl}/admin/bills`);
  await page.getByTitle("ລາຍລະອຽດ").click();
  await expect(page.getByText("ປະຫວັດຄືນບາງລາຍການ")).toBeVisible();
  await expect(page.getByText("#RT-1")).toBeVisible();
  await page.getByRole("button", { name: "ສິນຄ້າຄືນ (1)" }).click();
  await expect(page.getByText("ຮັບເຂົ້າ stock", { exact: true })).toBeVisible();
  await expect(page.getByText("ຕັດທິ້ງ", { exact: true })).toBeVisible();

  await page.goto(`${baseUrl}/admin/sales`);
  await expect(page.getByText("ເງິນຮັບຕອນຂາຍ")).toBeVisible();
  await expect(page.getByText("₭33,000", { exact: true })).toBeVisible();

  await page.goto(`${baseUrl}/admin/reports`);
  await expect(page.getByRole("cell", { name: "ຂາຍຍ່ອຍ" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "ຂາຍສົ່ງ" })).toBeVisible();
});

test("admin products forwards category and catalog filters to the API", async ({ page }) => {
  let capturedUrl = "";

  await page.route("**/api/products?**", async (route) => {
    if (!capturedUrl) {
      capturedUrl = route.request().url();
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        pagination: { total: 0, totalPages: 1 },
      }),
    });
  });

  await page.route("**/api/categories**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });

  await page.route("**/api/units**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });

  await openAdminSession(page);
  await page.evaluate(() => {
    localStorage.setItem("product-search", "scanner");
    localStorage.setItem("product-filters", JSON.stringify({
      category: "Beverages",
      unit: "Box",
      status: "active",
      stockLevel: "low",
      catalogNo: "12",
      catalogCode: "A1",
      catalogPage: "3",
      catalogNumber: "45",
    }));
  });

  await page.goto(`${baseUrl}/admin/products`);
  await expect(page.getByRole("heading", { name: "ລາຍຊື່ສິນຄ້າ" })).toBeVisible();

  expect(capturedUrl).toContain("category=Beverages");
  expect(capturedUrl).toContain("unit=Box");
  expect(capturedUrl).toContain("catalogNo=12");
  expect(capturedUrl).toContain("catalogCode=A1");
  expect(capturedUrl).toContain("catalogPage=3");
  expect(capturedUrl).toContain("catalogNumber=45");
  expect(capturedUrl).toContain("search=scanner");
});
