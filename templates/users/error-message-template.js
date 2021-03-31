module.exports = Object.freeze({
    PASSWORD_NOT_MATCH: '密碼不相符',
    FIELD_EMPTY: '請填入全部欄位',
    WRONG_FILE_TYPE: '僅允許上傳圖片檔案！',
    WRONG_PASSWORD_FORMAT: '密碼需要由大小寫英文、數字、符號組成，並至少八位',
    USER_ALREASDY_EXIST: '使用此email的用戶已存在！請使用另外的電子郵件或是登入',
    REGISTRY_ERROR: '在註冊時發生錯誤，請過幾分鐘後再試，或是聯繫網站管理員：' + process.env.CUSTOMER_SUPPORT_EMAIL,
    WRONG_REGISTRY_URL: '不正確或是過期的連結',
    INTERNAL_SERVER_ERROR:  '伺服器錯誤，請聯繫網站管理員： ' + process.env.CUSTOMER_SUPPORT_EMAIL,
    CHANGE_PASSWORD_ERROR: '更改密碼時發生錯誤，請過幾分鐘後再試，或是聯繫網站管理員： '+ process.env.CUSTOMER_SUPPORT_EMAIL,
    USER_NOT_FOUND:'用戶不存在！請註冊',
});