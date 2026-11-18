# Render 公開部署（需你登入 Render 並授權 GitHub）

1. 建立新的 **私有 GitHub 儲存庫** `zuoxing-ig-studio`（不要放入 stock-analysis）。上傳本資料夾內的檔案，保持 `render.yaml` 位於儲存庫根目錄。
2. 進入 https://dashboard.render.com/，選 **New → Blueprint**，授權 GitHub 並選取此儲存庫。
3. 在 Render 環境設定填入 `IG_STUDIO_PASSWORD`（強密碼）。選擇性填入 `OPENAI_API_KEY`；**請不要貼在聊天或提交至 GitHub**。
4. 部署成功後，使用 Render 顯示的 `https://...onrender.com/` 連結。瀏覽器會要求帳號密碼：帳號任意，密碼使用 `IG_STUDIO_PASSWORD`。
5. 開啟頁面，確認 `/api/status` 及研究和單張 PNG 下載功能。AI 生圖可能耗時；Render Free 方案休眠、檔案持久性、配額和開支依官方規則。

## 注意事項
- 未設定 `IG_STUDIO_PASSWORD` 時，Render 上的服務會回傳 503，不會無密碼開放。
- Basic Auth 透過 HTTPS 傳送；若多人共用密碼，請改用正式的使用者帳號與權限系統。
- Render Blueprint 目前設定 free，如方案不適用請在 Render 自行調整。
- `healthCheckPath` 會需要 Basic Auth，可能無法通過自動健康檢查；如有問題請在 Render 取消 healthCheckPath。
- 此版本的熱門資料是新聞 RSS 線索，非 IG 全平台即時排名；Top10帳號需匯入已驗證資料。
