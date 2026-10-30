const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  try {
    const context = await browser.newContext({viewport:{width:393,height:852}});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('console', message => { if(message.type()==='error')console.error(message.text()); });
    console.log('PWA : ouverture');
    await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:8765/');
    console.log('PWA : attente service worker');
    await page.evaluate(() => Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker non prêt après 15 secondes')), 15000))
    ]));
    await page.reload();
    console.log('PWA : cache prêt');
    assert.equal(await page.evaluate(() => !!navigator.serviceWorker.controller), true);
    assert.equal(await page.locator('.brand-cat').evaluate(img => img.complete && img.naturalWidth === 192), true);
    const manifest = await page.evaluate(async () => (await fetch('./manifest.webmanifest')).json());
    assert.equal(manifest.display, 'standalone');
    await page.locator('[data-action="start"]').click();
    await page.locator('#setup-form input[name="terms"]').check();
    await page.locator('#setup-form input[name="consent"]').check();
    await page.locator('#setup-form button[type="submit"]').click();
    await page.locator('[data-action="quickmood:Bien"]').click();
    const before = await page.evaluate(() => localStorage.getItem('mon-suivi-v1'));
    for (const label of ['Repas','Activité','Progrès','Profil','Aujourd’hui']) {
      await page.locator('nav [data-action="go:'+label+'"]').click();
      assert.equal(await page.locator('nav [aria-current="page"]').count(), 1);
      const box = await page.locator('nav').boundingBox();
      assert.ok(box.y + box.height < 852, 'Navigation détachée du bas');
    }
    await context.setOffline(true);
    await page.reload();
    await page.locator('[data-action="start"]').click();
    await page.locator('.hero-summary').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('mon-suivi-v1')), before);
    const cached = await page.evaluate(async () => (await caches.open('mon-suivi-shell-v4-2')).keys().then(keys => keys.map(k => k.url)));
    assert.ok(cached.length >= 15);
    assert.ok(cached.every(url => !url.includes('/api/')));
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('nav').evaluate(el => getComputedStyle(el,'::before').transitionDuration), '0s');
    console.log('PWA : icône chat, manifeste, navigation, mouvement réduit, cache hors ligne et données conservées OK.');
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
