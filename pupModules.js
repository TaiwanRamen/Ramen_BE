const puppeteer = require('puppeteer');

const func = {}

func.getLink = async (page) => {
    // ===========================
    // HTMLText是當頁的所有發文的HTML
    // [發文1 HTML, 發文1 Text],
    // [發文2 HTML, 發文2 Text],
    // [發文3 HTML, 發文3 Text],        
    //============================
    // atag 裡面私密社團的結構：
    // 1. 作者，會有<a href="/jack527001 是本人的id https://www.facebook.com/jack527001
    // 2. 本社團的連結，不太重要
    // 2.5 更多(這個看文章長度不一定會有)
    // 3. 讚
    // 4. 傳達心情
    // 5. 留言
    // 6. 完整動態
    // 7. 儲存

    // 重點是""完整動態""的連結。
    // 連結ID: Regex: /permalink&amp;id=([0-9])\w+&amp/   https://www.facebook.com/groups/codingmeme/permalink/728573517981631/

    var groupUrl = "https://mbasic.facebook.com/groups/641801720068498"
    try {
        const HTMLText = await page.evaluate(() => {
            let data = []
            /** this can be changed for other website.*/
            const list = document.querySelectorAll('#m_group_stories_container > section > article');
            for (const a of list) {
                data.push([a.innerHTML, a.innerText])
            }
            return data;
        })

        //postLinks 裡面有所有當頁貼文的 link
        var postLinks = [];
        for (const post of HTMLText) {
            //fullPostatag = 完整動態atag
            let fullPostatag = post[0].match(/<a[^>]*>完整動態<\/a>/g)[0]
            //postId = 當篇貼文Id
            let postId = fullPostatag.match(/;id=[0-9]*/)[0]
            postId = postId.replace(';id=', '')
            //postlink = 當篇貼文連結
            let postlink = groupUrl + '/permalink/' + postId
            postLinks.push(postlink)
        }
        //console.log(postLinks)
        return postLinks

        /* 
                let page2 = await browser.newPage();
                await page2.goto(postLinks[0]);
                await page2.waitForSelector("#m_group_stories_container") */

    } catch (error) {
        console.log(error)
        await browser.close();
    }
}

module.exports = func;