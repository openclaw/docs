---
read_when:
    - 偵錯 Mac 應用程式健康狀態指標
summary: macOS 應用程式如何回報 Gateway/Baileys 健康狀態
title: 健康檢查 (macOS)
x-i18n:
    generated_at: "2026-04-30T03:20:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS 上的健康檢查

如何從選單列應用程式查看已連結的通道是否健康。

## 選單列

- 狀態點現在會反映 Baileys 健康狀態：
  - 綠色：已連結 + 通訊端最近已開啟。
  - 橘色：正在連線/重試。
  - 紅色：已登出或探測失敗。
- 次要行會顯示「已連結 · 驗證 12 分鐘」，或顯示失敗原因。
- 「執行健康檢查」選單項目會觸發隨選探測。

## 設定

- 一般分頁新增健康狀態卡片，顯示：已連結的驗證年齡、session-store 路徑/數量、上次檢查時間、上次錯誤/狀態碼，以及執行健康檢查/顯示記錄的按鈕。
- 使用快取快照，讓 UI 立即載入，並在離線時優雅降級。
- **通道分頁**會顯示 WhatsApp/Telegram 的通道狀態 + 控制項（登入 QR、登出、探測、上次中斷連線/錯誤）。

## 探測如何運作

- 應用程式會透過 `ShellExecutor` 每約 60 秒及隨選執行 `openclaw health --json`。探測會載入憑證並回報狀態，而不會傳送訊息。
- 分別快取最後一個良好快照與最後一個錯誤，以避免閃爍；顯示各自的時間戳記。

## 無法判斷時

- 你仍可使用 [Gateway 健康狀態](/zh-TW/gateway/health)中的 CLI 流程（`openclaw status`、`openclaw status --deep`、`openclaw health --json`），並追蹤 `/tmp/openclaw/openclaw-*.log` 中的 `web-heartbeat` / `web-reconnect`。

## 相關

- [Gateway 健康狀態](/zh-TW/gateway/health)
- [macOS 應用程式](/zh-TW/platforms/macos)
