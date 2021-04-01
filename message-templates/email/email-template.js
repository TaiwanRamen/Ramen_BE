module.exports = Object.freeze({

    register: `<h2>您即將完成在台灣拉麵俱樂部的註冊</h2>
            <h4>驗證您的帳戶電子郵件地址</h4>
            <div style="word-break:break-all">
            <p style="font-size:13px;line-height:16px">您必須驗證電子郵件地址，才能使用 台灣拉麵俱樂部 的某些功能，並且在討論區中發表貼文。</p>
            <p style="font-size:13px;line-height:16px" >請點擊以下連結以驗證電子郵件</p>
            <a href="${url}">驗證電子郵件 </a>
            
            <p style="font-size:10px;line-height:16px"> 連結無法使用？請複製以下網址貼入搜尋列</p>
            <p style="font-size:10px;line-height:16px"> ${url}</p>
            <p>如果連結失效，請再次點擊<a href="${process.env.CLIENT_URL}/users/register">註冊</a>. 
            </p>
            <p style="font-size:13px;line-height:16px">如果您對Email 驗證有任何問題，請聯絡
            <a href="${process.env.CLIENT_URL}">技術支援</a> 
            </p>
            </div>
            `
});