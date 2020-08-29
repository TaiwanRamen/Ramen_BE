const puppeteer = require('puppeteer');


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


(async () => {
    try {
        // set some options (set headless to false so we can see 
        // this automated browsing experience)
        let launchOptions = {
            headless: false
            //executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', // because we are using puppeteer-core so we must define this option
            //args: ['--start-maximized']
        };


        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // set viewport and user agent (just in case for nice viewing)
        await page.setViewport({ width: 1366, height: 768 });
        const address = '桃園市興仁路二段15號'
        // go to the target web
        await page.goto("https://map.tgos.tw/TGOSCloud/Web/Map/TGOSViewer_Map.aspx?addr=" + address);
        await page.waitForXPath('//*[@id="MapBox"]/div[1]/div[2]/div/p[1]')

        page.evaluate(() => console.log('hello', 5, { foo: 'bar' }));
        const [getXpath] = await page.$x('//*[@id="MapBox"]/div[1]/div[2]/div/p[1]')
        let getMsg = await page.evaluate(name => name.innerText, getXpath);


        let re = /\uff1a[\u4e00-\u9fcc_\d_\.]+/g

        getMsg = getMsg.match(re)

        for (let i = 0; i < getMsg.length; i++) {
            getMsg[i] = getMsg[i].replace('：', '')
        }

        console.log(getMsg)

        let x = parseFloat(getMsg[1])
        let y = parseFloat(getMsg[2])
        const tw97tolatlon = require('./utils/tw97tolatlon')
        console.log(tw97tolatlon(x, y))
        await browser.close();

        //==========================================================================================
        //check for run time 
        //==========================================================================================
        performance.mark('B');
        performance.measure('A to B', 'A', 'B');
        //==========================================================================================
        //check for run time 
        //==========================================================================================  
    } catch (error) {
        console.log(error.massage)
        console.log('TGOS 花太長時間回應，請稍後再試試。')
    }
})();

//averaging runtime: 7700ms