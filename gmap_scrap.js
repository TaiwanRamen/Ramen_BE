require('dotenv').config()
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Store = require('./models/store');
require("./db/connectDB");
//==========================================================================================
//check for run time 
//==========================================================================================
const { PerformanceObserver, performance } = require('perf_hooks');
const obs = new PerformanceObserver((items) => {
    console.log('PerformanceObserver A to B', items.getEntries()[0].duration);
    performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });
performance.mark('A');
//==========================================================================================
//check for run time 
//==========================================================================================
var DELAY_TIME = 400
try {
    (async () => {
        // Viewport && Window size
        const width = 1375
        const height = 800

        const browser = await puppeteer.launch({
            headless: false,
            args: [
                `--window-size=${ width },${ height }`
            ],
            defaultViewport: {
                width,
                height
            },
            executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
        })
        const context = browser.defaultBrowserContext();
        context.overridePermissions("https://www.google.com/maps", ["geolocation", "notifications"]);
        let page = await browser.newPage();
        await page.setViewport({ width: width, height: width });
        try {
            await page.goto('https://www.google.com.tw/maps/@23.063131,122.0146571,8.25z');
            await page.waitForSelector("#pane")
            let stores = await Store.find({});
            for (const store of stores) {
                if (!store.address) {
                    await page.waitForSelector("#searchboxinput")
                    await page.focus('#searchboxinput')
                    await page.keyboard.type(store.name, { delay: 50 })

                    await page.click("#searchbox-searchbutton");
                    await page.waitForSelector("#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-hero-header-image > div.section-hero-header-image-hero-container.collapsible-hero-image > button")
                    await page.waitFor(500);
                    await page.click("#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-hero-header-image > div.section-hero-header-image-hero-container.collapsible-hero-image > button")




















                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');
                    await page.keyboard.press('Backspace');
                    await page.waitFor(3000);
                } else {
                    console.log('address already exist')
                }

            }
        } catch (err) {

        }

    })()

} catch (err) {
    console.log('error in fb_scrap.js')
    console.log(error)
    //browser.close();
}
//#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-layout.section-scrollbox.scrollable-y.scrollable-show > div.section-layout > div:nth-child(1) > div > a > div.gallery-image-low-res