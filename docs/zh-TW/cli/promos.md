---
read_when:
    - 你想試用 ClawHub 提供的免費促銷模型優惠
    - 你正透過促銷活動設定供應商，而不是使用新手引導流程
summary: '`openclaw promos` 的命令列介面參考（列出並領取促銷模型優惠）'
title: 促銷活動
x-i18n:
    generated_at: "2026-07-12T14:26:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

探索並領取 ClawHub 上發布的模型促銷優惠。領取促銷活動時，系統會設定供應商（必要時包括驗證與外掛），並註冊促銷活動的模型，而不需要重新執行初始設定，也不會變更你的預設模型，除非你明確要求。

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

列出目前有效的促銷活動，包括其模型、建議的預設模型、剩餘時間，以及確切的領取命令。`--json` 會輸出原始承載資料。

## `openclaw promos claim <slug>`

領取有效的促銷活動：

1. 從 ClawHub 取得促銷活動，並確認目前在其有效期間內。
2. 根據你已安裝的 OpenClaw 版本，驗證促銷活動的供應商、驗證方式及宣告的外掛套件。未知的 ID 或套件不符都會遭到拒絕——促銷活動絕不可能讓命令列介面執行任何它原本不知道如何執行的操作。
3. 如果你已有供應商認證資訊，就會沿用。否則，系統會引導你完成供應商的一般驗證流程（並先顯示促銷活動的註冊網址，以取得免費金鑰）。`--api-key <key>` 可在不顯示提示的情況下完成 API 金鑰驗證，行為與 `openclaw onboard` 的非互動式旗標一致；若要避免在命令列上輸入金鑰，請改為匯出供應商的環境變數（例如 `OPENROUTER_API_KEY`）——系統會自動偵測現有的環境認證資訊，不需要使用旗標。
4. 註冊促銷活動的模型及其別名。絕不會覆寫現有別名。
5. 詢問是否要將促銷活動建議的模型設為預設模型——`--set-default` 會略過詢問；否則你的預設設定不會有任何變更。

促銷活動的有效期間結束後，供應商會停止提供免費模型；你的設定與認證資訊不會受到影響。你可以隨時使用 `openclaw models set <model>` 切換回其他模型。

## 在 `models list` 中被動探索

`openclaw models list` 也會顯示促銷活動，不需要你直接查詢 ClawHub：

- 模型尚未設定的有效優惠，會顯示在表格下方的「可透過促銷活動使用」群組中，且每個優惠都會附上領取命令。
- 透過 `promos claim` 註冊的模型會帶有 `promo` 標籤；優惠的有效期間結束後，標籤會變為 `promo ended`。
- 第一次發現新優惠時，系統會顯示一次性通知，提示你使用 `openclaw promos list`。已列出或已領取的優惠絕不會再次通知。

此功能會讀取 ClawHub 託管促銷摘要的本機快取副本（通常每天透過條件式請求重新整理一次，或在快取快照到期時提前重新整理；重新整理失敗時會直接略過且不顯示錯誤）。更新過期快取最多等待 2.5 秒，且絕不會造成列表失敗。`--json` 與 `--plain` 的輸出會維持可供機器處理的純淨格式，不包含促銷活動區段或通知。領取時一律會向即時 ClawHub API 重新驗證，因此即使快取副本仍顯示某項優惠，若該優惠已提前撤回，領取要求仍會遭到拒絕。
