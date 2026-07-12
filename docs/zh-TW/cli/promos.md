---
read_when:
    - 你想試用 ClawHub 提供的免費促銷模型優惠
    - 你正在透過促銷活動設定供應商，而不是進行初始設定
summary: '`openclaw promos` 的命令列介面參考（列出並領取促銷模型優惠）'
title: 促銷活動
x-i18n:
    generated_at: "2026-07-11T21:15:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

探索並領取 ClawHub 上發布的模型促銷優惠。領取促銷優惠會設定供應商（必要時包括驗證與外掛），並註冊該促銷優惠的模型——無須重新執行初始設定，也不會變更預設模型，除非你明確要求。

相關內容：

- 預設模型與備援模型：[模型](/zh-TW/cli/models)
- 供應商驗證設定：[開始使用](/zh-TW/start/getting-started)

## 命令

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

列出目前有效的促銷優惠，包括其模型、建議的預設模型、剩餘時間，以及確切的領取命令。`--json` 會輸出原始承載資料。

## `openclaw promos claim <slug>`

領取有效的促銷優惠：

1. 從 ClawHub 取得促銷優惠，並確認目前仍在有效期間內。
2. 根據你已安裝的 OpenClaw 版本，驗證促銷優惠的供應商、驗證方式，以及宣告的外掛套件。未知的 ID 或套件不相符時會拒絕執行——促銷優惠絕不會讓命令列介面執行任何其原本不知道如何執行的內容。
3. 若你已有供應商憑證，則會重複使用。否則會引導你完成供應商的一般驗證流程（並先顯示促銷優惠的註冊網址，以取得免費金鑰）。`--api-key <key>` 可在不顯示提示的情況下完成 API 金鑰驗證，與 `openclaw onboard` 的非互動式旗標一致；若要避免將金鑰放在命令列上，請改為匯出供應商的環境變數（例如 `OPENROUTER_API_KEY`）——系統會自動偵測既有的環境變數憑證，不需要任何旗標。
4. 使用促銷優惠模型的別名註冊這些模型。絕不會覆寫既有別名。
5. 詢問是否將促銷優惠建議的模型設為預設模型——`--set-default` 會略過詢問；否則你的預設設定不會有任何變更。

促銷優惠的有效期間結束後，供應商會停止提供免費模型；你的設定與憑證不會受到影響。你可以隨時使用 `openclaw models set <model>` 切換回其他模型。

## 在 `models list` 中被動探索

`openclaw models list` 也會在你未直接查詢 ClawHub 的情況下顯示促銷優惠：

- 你尚未設定其模型的有效優惠，會顯示在表格下方的「可透過促銷優惠取得」群組中，每項都附有領取命令。
- 透過 `promos claim` 註冊的模型會帶有 `promo` 標籤；優惠有效期間結束後，標籤會變為 `promo ended`。
- 首次發現新優惠時，會顯示一次性通知，引導你使用 `openclaw promos list`。已列出或領取過的優惠絕不會再次通知。

此功能會讀取 ClawHub 託管促銷資訊來源的本機快取副本（通常每天透過條件式請求重新整理一次，或在快取快照到期時提早重新整理；重新整理失敗時會直接略過，不顯示錯誤）。過期快取的重新整理最多等待 2.5 秒，且絕不會中斷清單顯示。`--json` 和 `--plain` 的輸出會維持適合機器處理的純淨格式：不含促銷優惠區段或通知。領取時一律會向即時 ClawHub API 重新驗證，因此即使快取副本仍顯示某項優惠，若該優惠已提前撤回，仍會拒絕領取。
