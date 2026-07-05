---
read_when:
    - 偵錯 Mac 應用程式健康狀態指標
summary: macOS 應用程式如何回報閘道/頻道健康狀態
title: 健康檢查（macOS）
x-i18n:
    generated_at: "2026-07-05T11:33:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS 上的健康檢查

如何從選單列應用程式讀取已連結頻道的健康狀態。

## 選單列

狀態點：

- 綠色：已連結 + 探測健康。
- 橘色：已連結，但頻道探測回報降級/未連線。
- 紅色：尚未連結。

次要行會顯示「已連結 · 驗證 12 分鐘」或顯示失敗原因。
選單中的「立即執行健康檢查」會觸發隨選探測。

## 設定

- 一般分頁會顯示健康狀態卡片：狀態點、摘要行（連結狀態 +
  驗證年齡），以及選用的失敗詳細資料行，並提供 **立即重試** 和
  **開啟記錄** 按鈕。
- **頻道分頁** 會顯示 WhatsApp 和 Telegram 的各頻道狀態與控制項（登入 QR、
  登出、探測、上次中斷連線/錯誤）。

## 探測的運作方式

應用程式會透過既有的 WebSocket 連線呼叫閘道的 `health` RPC
（不是以命令列介面 shell-out）約每 60 秒一次，並可隨選呼叫。RPC 會載入
憑證並回報狀態，而不會傳送訊息。應用程式會分別快取最後一次
良好快照與最後一次錯誤，因此 UI 能立即載入，且離線時不會閃爍。

## 無法確定時

使用 [閘道健康狀態](/zh-TW/gateway/health) 中的命令列介面流程（`openclaw status`、
`openclaw status --deep`、`openclaw health --json`），並 tail
`/tmp/openclaw/openclaw-*.log`，篩選 `web-heartbeat` / `web-reconnect`。

## 相關

- [閘道健康狀態](/zh-TW/gateway/health)
- [macOS 應用程式](/zh-TW/platforms/macos)
