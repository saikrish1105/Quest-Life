const { chromium } = require('playwright');
(async () => {
    const b = await chromium.launch(); 
    const p = await b.newPage(); 
    p.on('pageerror', e => console.error('PAGE ERROR CRASH:', e)); 
    p.on('console', m => console.log('LOG:', m.text()));
    
    await p.goto('http://localhost:5174/');
    await p.waitForTimeout(3000); // wait for splash

    // Step 1: Main Quest
    const card = p.locator('.glass-card-heavy').first();
    const box = await card.boundingBox();
    if (box) {
        await p.mouse.move(box.x+box.width/2, box.y+box.height/2);
        await p.mouse.down();
        await p.mouse.move(box.x+box.width+300, box.y+box.height/2);
        await p.mouse.up();
        console.log('Swiped right!');
    }
    await p.waitForTimeout(1000);

    // Step 2
    await p.getByRole('button',{name:/Continue/i}).click();
    console.log('Side quests continued');
    await p.waitForTimeout(1000);
    
    // Step 3
    await p.getByRole('button',{name:/Continue/i}).click();
    console.log('Vices continued');
    await p.waitForTimeout(1000);

    // Step 4
    await p.getByRole('button',{name:/Begin Quest Life/i}).click();
    console.log('Begin clicked!');
    
    // Wait to see if crash occurs or if we land on home page
    await p.waitForTimeout(5000);
    
    console.log("FINAL HTML SNIPPET:", await p.evaluate(() => document.body.innerHTML.substring(0, 500)));
    await b.close();
})();
