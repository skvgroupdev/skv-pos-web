"""
TC002: Redirect unauthenticated user from protected routes
Verify unauthenticated users are redirected to /login when accessing /pos or /shop.
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
        await context.clear_cookies()
        page = await context.new_page()

        # Clear localStorage for this origin
        await page.goto(base_url, wait_until="domcontentloaded", timeout=15000)
        await page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        await page.wait_for_timeout(500)

        # Try /pos
        await page.goto(f"{base_url}/pos", wait_until="domcontentloaded", timeout=10000)
        await page.wait_for_timeout(2000)
        assert "/login" in page.url, f"Expected redirect to /login when visiting /pos without auth, got {page.url}"

        # Try /shop
        await page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        await page.goto(f"{base_url}/shop", wait_until="domcontentloaded", timeout=10000)
        await page.wait_for_timeout(2000)
        assert "/login" in page.url, f"Expected redirect to /login when visiting /shop without auth, got {page.url}"

        print("TC002 PASSED: Unauthenticated users redirected to /login")
    except Exception as e:
        print(f"TC002 FAILED: {e}")
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
