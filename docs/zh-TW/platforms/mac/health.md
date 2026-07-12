---
read_when:
    - 偵錯 Mac 應用程式健康狀態指示器
summary: macOS App 如何回報閘道／頻道的健康狀態
title: 健康檢查（macOS）
x-i18n:
    generated_at: "2026-07-11T21:31:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS 上的健康檢查

如何從選單列應用程式讀取已連結頻道的健康狀態。

## 選單列

狀態圓點：

- 綠色：已連結且探測正常。
- 橙色：已連結，但頻道探測回報狀態降級或未連線。
- 紅色：尚未連結。

次要文字列會顯示「已連結 · 驗證 12 分鐘」，或顯示失敗原因。
選單中的「立即執行健康檢查」會觸發隨選探測。

## 設定

- 「一般」分頁會顯示健康狀態卡片：狀態圓點、摘要文字列（連結狀態 +
  驗證時間），以及選用的失敗詳細資訊文字列，並提供 **立即重試** 和
  **開啟日誌** 按鈕。
- **頻道分頁** 會顯示 WhatsApp 和 Telegram 各頻道的狀態與控制項目（登入 QR Code、
  登出、探測、上次中斷連線／錯誤）。

## 探測的運作方式

應用程式會透過現有的 WebSocket 連線（而非透過命令列介面呼叫 shell），約每 60 秒及隨選呼叫
閘道的 `health` RPC。RPC 會載入憑證並回報狀態，而不會傳送訊息。應用程式會分別快取最後一次
正常的快照與最後一次錯誤，讓使用者介面能立即載入，且在離線時不會閃爍。

## 如有疑問

請使用[閘道健康狀態](/zh-TW/gateway/health)中的命令列介面流程（`openclaw status`、
`openclaw status --deep`、`openclaw health --json`），並持續查看
`/tmp/openclaw/openclaw-*.log`，篩選 `web-heartbeat`／`web-reconnect`。

## 相關內容

- [閘道健康狀態](/zh-TW/gateway/health)
- [macOS 應用程式](/zh-TW/platforms/macos)
