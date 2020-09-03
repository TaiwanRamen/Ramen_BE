require('dotenv').config()
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Store = require('./models/store');
require("./db/connectDB");
//==========================================================================================
//check for run time 
//==========================================================================================
const { PerformanceObserver, performance } = require('perf_hooks');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
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

            var largeImage = [];
            var smallImage = [];
            page.on('response', async response => {
                const url = response.url();
                try {
                    const req = response.request();
                    const orig = req.url();
                    const text = await response.text();
                    const status = response.status();
                    if (/https:\/\/lh3\.ggpht\.com[\s\S]*s1536/.test(orig)) {
                        //console.log("large image:\n:", { orig, status, text: text.length });
                        largeImage.push(orig);

                    } else if (/https:\/\/lh3\.ggpht\.com[\s\S]*s512/.test(orig)) {
                        //console.log("small image:\n:", { orig, status, text: text.length });
                        smallImage.push(orig)
                    }


                } catch (err) {

                }
            });
            var exclude = [
                '山形心心-萬華店(六月開幕)',
                '黑田屋拉麵(八月未定)',
                '麵處田治(九月預定)',
                '勝王-烹星(九月未定)',
                '東京油組総本店 高雄巨蛋組(十月預定)',
                '辣麻味噌沾麵 鬼金棒(總店沾麵部)',
                '辣麻味噌拉麵 鬼金棒(松江南京店)',
                '淺草咖哩蛋包',
                '鶏そば本舗【梓山azusayama】',
                '雞玉錦拉麵-南港車站店',
                '大井屋',
                '東京家系 衛門府豚骨ラーメン專門店',
                '今鶏 制湯所',
                '熱烈一番拉麵',
                '(0824停業)MEN monster'
            ]
            await page.goto('https://www.google.com.tw/maps/place');
            await page.waitForSelector("#pane")
            let stores = await Store.find({});
            for (const store of stores) {
                try {
                    await page.setDefaultNavigationTimeout(3000000);
                    if (!exclude.includes(store.name)) {
                        if (store.imageSmall.length === 0 || store.imageLarge.length === 0) {
                            await page.goto('https://www.google.com.tw/maps/place');

                            await page.waitForSelector("#searchboxinput")
                            await page.focus('#searchboxinput')
                            //===================================
                            // Search
                            //===================================
                            let name = '';
                            /* if (/[\s\S]*\(/.test(store.name)) {
                                let toDelete = store.name.match(/\([\s\S]*\)/);
                                name = store.name.replace(toDelete, '')
                                await page.keyboard.type(name)
                            } else { */
                            await page.keyboard.type(store.name)
                            /* } */

                            await page.click("#searchbox-searchbutton");
                            await page.waitForSelector("#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-hero-header-image > div.section-hero-header-image-hero-container.collapsible-hero-image > button", { timeout: 0 })
                            await page.waitFor(500);
                            //===================================
                            // Go to image Page
                            //===================================
                            await page.waitForSelector("#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-hero-header-image > div.section-hero-header-image-hero-container.collapsible-hero-image > button")
                            await page.click("#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-hero-header-image > div.section-hero-header-image-hero-container.collapsible-hero-image > button")
                            await page.waitForSelector('#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-layout.section-scrollbox.scrollable-y.scrollable-show > div.section-layout > div:nth-child(4) > div > a')
                            //===================================
                            // Click first 5 image
                            //===================================
                            for (let i = 1; i < 7; i++) {
                                await page.waitFor(100);
                                await page.click('#pane > div > div.widget-pane-content.scrollable-y > div > div > div.section-layout.section-scrollbox.scrollable-y.scrollable-show > div.section-layout > div:nth-child(' + i + ') > div > a')
                                await page.waitForNavigation({ waitUntil: "networkidle0" });
                            }

                            await page.waitForNavigation({ waitUntil: "networkidle2" });
                            await page.waitFor(5000);


                            await console.log(smallImage);
                            await console.log(largeImage);

                            store.imageSmall = smallImage;
                            store.imageLarge = largeImage;
                            await store.save()

                        }
                        smallImage = [];
                        largeImage = [];
                    }
                } catch (error) {
                    console.log(error)
                    exclude.push(store.name)
                    continue;
                };




            }

        } catch (err) {
            console.log(err)

        }
    })()

} catch (err) {
    console.log('error in fb_scrap.js')
    console.log(error)
    //browser.close();
}