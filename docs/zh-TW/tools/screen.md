---
read_when:
    - 你想要代理程式分割、聚焦、關閉或導覽 Control UI 窗格
    - 你想要代理顯示或隱藏側邊欄、終端機或瀏覽器面板
    - 你需要 `ui.command` 功能與扇出契約
sidebarTitle: Screen
summary: 讓代理程式配置已連線的控制介面
title: 螢幕
x-i18n:
    generated_at: "2026-07-19T14:06:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df2215db96af29fa6b0db8abad79a0a2787a194dab6d00f9ef32f45521907ae1
    source_path: tools/screen.md
    workflow: 16
---

`screen` 工具可讓代理安排瀏覽器式控制介面的版面。它是具型別的版面配置與導覽介面，而非螢幕截圖擷取或瀏覽器自動化工具。

只有當來源用戶端宣告 `ui-commands` 能力時，才會提供此工具。工具執行時，仍須至少有一個具備該能力的控制介面保持連線；否則閘道會傳回 `UNAVAILABLE`。

## 動作

| 動作                              | 效果                                       | 選用輸入                                       |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| `split_right`                     | 將目標工作階段窗格向右分割                 | `sessionKey`（預設為目前工作階段） |
| `split_down`                      | 將目標工作階段窗格向下分割                 | `sessionKey`（預設為目前工作階段） |
| `close_pane`                      | 關閉目標工作階段窗格                       | `sessionKey`（預設為目前工作階段） |
| `focus`                           | 聚焦目標工作階段窗格                       | `sessionKey`（預設為目前工作階段） |
| `navigate`                        | 開啟目標工作階段                           | `sessionKey`（預設為目前工作階段） |
| `sidebar_show` / `sidebar_hide`   | 顯示或隱藏主側邊欄                         | -                                              |
| `terminal_show` / `terminal_hide` | 顯示或隱藏操作員終端面板                   | 顯示時使用 `dock`（`bottom` 或 `right`）      |
| `browser_show` / `browser_hide`   | 顯示或隱藏瀏覽器面板                       | 顯示時使用 `dock`（`bottom` 或 `right`）      |

命令成功後，閘道會廣播具型別的 `ui.command` 事件，接著傳回 `{ "ok": true }`。

## 路由與安全性

通訊協定 v1 會刻意將命令傳送給每個已連線且宣告 `ui-commands` 的控制介面；它不會以單一瀏覽器分頁為目標。當同一位操作員開啟數個儀表板時，這一點很重要。

閘道 RPC 需要 `operator.write`。此工具只能變更呈現狀態：它無法讀取像素、擷取螢幕截圖、點擊任意頁面內容，或繞過所選工作階段與操作員面板的權限。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [閘道通訊協定](/zh-TW/gateway/protocol#method-families)
- [瀏覽器工具](/zh-TW/tools/browser)
