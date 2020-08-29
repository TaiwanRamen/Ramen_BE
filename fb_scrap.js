const puppeteer = require('puppeteer');
const fs = require('fs');
const pupModules = require('./pupModules');
const WAIT_FOR_PAGE = 5000;
const DELAY_USER_INPUT = 20;
const DELAY_PW_INPUT = 10;
const FB_USER = 'julianlin549@gmail.com';
const FB_PW = 'Test7625';
var allPosts = []

try {
    (async () => {
        // Viewport && Window size
        const width = 400
        const height = 300

        const browser = await puppeteer.launch({
            headless: false,
            args: [
                `--window-size=${ width },${ height }`
            ],
            defaultViewport: {
                width,
                height
            },
            userDataDir: "./userData"
        })

        const context = browser.defaultBrowserContext();
        context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
        let page = await browser.newPage();
        await page.setViewport({ width: width, height: width });

        //登入只有第一次需要做。
        /* await page.goto("https://www.facebook.com");
        await page.type('#email', FB_USER, { delay: DELAY_USER_INPUT });
        await page.type('#pass', FB_PW, { delay: DELAY_PW_INPUT });
        await page.click("#u_0_b");
        await page.waitFor(1000); */
        var groupUrl = "https://mbasic.facebook.com/groups/641801720068498"
        await page.goto(groupUrl);
        await page.waitForSelector("#m_group_stories_container")

        //下一頁按鈕一直按到底
        /* while (await page.$('#m_group_stories_container > div > a', { timeout: 5000 })) {
            await page.click('#m_group_stories_container > div > a')
            await page.waitForSelector('#m_group_stories_container')
        } */

        //pupModules.getLink(page) retrun link array for current page 
        postLinks.push(await pupModules.getLink(page))
        console.log(postLinks)

        //await browser.close();
    })();
} catch (error) {

}