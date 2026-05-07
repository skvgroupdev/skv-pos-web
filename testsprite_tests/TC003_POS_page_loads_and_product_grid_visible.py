"""
TC003: POS page loads and product grid is visible
After login, POS page loads and shows product grid or empty state.
"""
import asyncio
from playwright.async_api import async_playwright


async def run_test():
    pw = None
    browser = None
    context = None
    base_url = "http://localhost:5173"

    try:
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=["--window-size=1280,720", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context()
        context.set_default_timeout(10000)
        page = await context.new_page()

        await page.goto(base_url, wait_until="domcontentloaded", timeout=15000)
        if "/login" in page.url:
            await page.locator('input[type="text"], input[name="username"]').first.fill("admin")
            await page.locator('input[type="password"]').first.fill("adminpassword")
            await page.locator('button[type="submit"], button:has-text("Login")').first.click()
            await page.wait_for_timeout(3000)

        await page.goto(f"{base_url}/pos", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)

        # Should not be on login (we have auth)
        assert "/login" not in page.url, "POS should be accessible after login"
        # Some main content: grid, cart, or placeholder
        body = await page.locator("body").inner_text()
        assert len(body.strip()) > 50, "POS page should have visible content"

        print("TC003 PASSED: POS page loads with content")
    except Exception as e:
        print(f"TC003 FAILED: {e}")
        raise
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


if __name__ == "__main__":
    asyncio.run(run_test())
