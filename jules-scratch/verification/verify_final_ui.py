
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:8000")
            await page.wait_for_load_state('networkidle')

            # Ambil tangkapan layar desktop
            await page.screenshot(path="jules-scratch/verification/desktop_view.png")
            print("Desktop screenshot captured.")

            # Ubah ukuran viewport ke seluler dan ambil tangkapan layar
            await page.set_viewport_size({"width": 375, "height": 812}) # iPhone X
            await page.wait_for_load_state('networkidle')
            await page.screenshot(path="jules-scratch/verification/mobile_view.png")
            print("Mobile screenshot captured.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
