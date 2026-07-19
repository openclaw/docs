---
read_when:
    - 你想讓 OpenClaw 代理程式加入 Zoom 會議
    - 你正在為 Zoom 會議的回傳語音設定 Chrome、BlackHole 或 SoX
summary: Zoom 會議外掛：以 Chrome 瀏覽器訪客身分加入會議
title: Zoom 會議外掛
x-i18n:
    generated_at: "2026-07-19T14:01:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a647a135e908b8f56eacaaefd4b42ca87161f611edb8eac335553414850ebec2
    source_path: plugins/zoom-meetings.md
    workflow: 16
---

`zoom-meetings` 外掛會透過 OpenClaw Chrome 設定檔中的 Zoom Web App，以訪客身分加入 Zoom 會議連結。它接受 `zoom.us/j/...` 網域下的會議連結，以及 `example.zoom.us/j/...` 等帳戶子網域。它不會建立會議、電話撥入、使用 Zoom Meeting SDK 或錄製會議。

## 設定

語音回覆使用與 [Google Meet 外掛](/zh-TW/plugins/google-meet)相同的本機音訊先決條件：macOS、`BlackHole 2ch` 虛擬音訊裝置及 SoX。

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

啟用外掛，然後檢查設定：

```json5
{
  plugins: {
    entries: {
      "zoom-meetings": {
        enabled: true,
        config: {
          defaultMode: "agent",
          chrome: { guestName: "OpenClaw Agent" },
        },
      },
    },
  },
}
```

```bash
openclaw zoommeetings setup
openclaw zoommeetings join 'https://zoom.us/j/1234567890'
```

使用 `chromeNode.node`，在已配對的 macOS 節點上執行 Chrome、BlackHole 及 SoX。該節點必須允許 `zoommeetings.chrome` 和 `browser.proxy`。

## 模式

| 模式         | 行為                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `agent`      | 即時轉錄會諮詢已設定的 OpenClaw 代理程式；由 TTS 回覆。 |
| `bidi`       | 即時語音模型會直接聆聽並回覆。                        |
| `transcribe` | 以僅觀察模式加入，並取得即時字幕逐字稿快照。                   |

轉錄模式會在獲准進入後啟用 Zoom 即時字幕，並擷取受限範圍內的字幕顯示內容。`transcript` 動作會傳回目前 OpenClaw 會議工作階段的字幕緩衝區。

## 訪客加入限制

瀏覽器轉接器會選擇 **Join from browser**、填入訪客名稱、關閉攝影機、依所選模式設定麥克風，然後按一下 **Join**。Zoom Web App 會在 `app.zoom.us` 下執行；外掛會在導覽前授予該來源麥克風及喇叭選擇權限。通話中狀態使用 Zoom 的 Leave 控制項。等候室、登入、密碼、CAPTCHA 及裝置權限狀態會傳回明確的手動操作原因。

Zoom 主持人及帳戶政策可能會停用瀏覽器加入、要求驗證身分或電子郵件、顯示 CAPTCHA，或要求主持人准許進入。請在 OpenClaw Chrome 設定檔中完成該步驟，然後重試狀態檢查或語音功能。外掛不會規避 Zoom 政策。

Zoom Web App 已使用官方 Zoom 測試會議進行實際驗證，涵蓋應用程式插頁、iframe 訪客名稱輸入、加入前的麥克風與攝影機控制、加入、瀏覽器與 macOS 媒體權限、通話中偵測、啟用即時字幕，以及主持人結束會議的偵測。等候室及驗證狀態取決於主持人政策；若沒有穩定的 DOM 識別碼，則會保留文字備援機制。

## 工具與閘道介面

`zoom_meetings` 代理程式工具支援 `join`、`leave`、`status`、`transcript` 及 `speak`。閘道方法使用 `zoommeetings.*` 前綴。節點命令為 `zoommeetings.chrome`。

## 相關內容

- [會議外掛概覽](/plugins/meeting-plugins)
