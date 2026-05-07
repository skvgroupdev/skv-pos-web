"""
TC001: Login success with valid test credentials
Verify that users can log in successfully using admin / adminpassword.
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
        await page.wait_for_timeout(1000)

        # Should be on login or redirect to login
        if "/login" not in page.url:
            await page.goto(f"{base_url}/login", wait_until="domcontentloaded", timeout=10000)

        # Fill credentials
        username = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i], input[placeholder*="email" i]').first
        password = page.locator('input[type="password"], input[name="password"]').first
        await username.fill("admin")
        await password.fill("adminpassword")

        # Submit (button with type submit or containing Login)
        submit = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("ກົດເຂົ້າສູ່ລະບົບ")').first
        await submit.click()
        await page.wait_for_timeout(3000)

        # Assert: redirected away from login
        assert "/login" not in page.url or page.url == base_url, "Expected redirect away from login after successful login"
        # Optional: check localStorage has token
        token = await page.evaluate("() => localStorage.getItem('token')")
        assert token, "Expected token in localStorage after login"

        print("TC001 PASSED: Login success with valid credentials")
    except Exception as e:
        print(f"TC001 FAILED: {e}")
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
