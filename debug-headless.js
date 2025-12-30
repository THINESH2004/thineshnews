(async () => {
  const playwright = await import('playwright');
  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('CONSOLE', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGEERROR', err && err.stack ? err.stack : String(err));
  });
  page.on('response', res => {
    if (res.status() >= 400) console.log('RESPONSE', res.status(), res.url());
  });

  try {
    const resp = await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' , timeout: 20000});
    console.log('STATUS', resp && resp.status());
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await browser.close();
  }
})();