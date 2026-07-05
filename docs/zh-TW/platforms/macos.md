---
read_when:
    - 安裝 macOS 應用程式
    - 在 macOS 上決定使用本機或遠端閘道模式
    - 正在尋找 macOS 應用程式發行版下載
summary: 安裝並使用 OpenClaw macOS 選單列應用程式
title: macOS 應用程式
x-i18n:
    generated_at: "2026-07-05T11:29:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b34bade53181819a32edf6eefb075b38ba92cf1ae739da4d497c31c410ce0edb
    source_path: platforms/macos.md
    workflow: 16
---

macOS 應用程式是 OpenClaw **選單列 companion**：原生系統匣 UI、macOS
權限提示、通知、WebChat、語音輸入、Canvas，以及
Mac 代管的節點工具，例如 `system.run`。

只需要命令列介面和閘道？請從[入門](/zh-TW/start/getting-started)開始。

## 下載

從 [OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases) 取得 macOS 應用程式建置版本。
當發行版本包含 macOS 應用程式資產時，請尋找：

- `OpenClaw-<version>.dmg`（建議）
- `OpenClaw-<version>.zip`

有些發行版本只包含命令列介面、證據或 Windows 資產。如果最新發行版本
沒有 macOS 應用程式資產，請使用最新且有該資產的版本，或依照
[macOS 開發設定](/zh-TW/platforms/mac/dev-setup)從原始碼建置。

## 首次執行

1. 安裝並啟動 **OpenClaw.app**。
2. 為本機閘道選擇 **This Mac**，或連線至遠端閘道。
3. 本機模式：請等待應用程式安裝其使用者空間執行階段和閘道。
4. 完成提供者設定與 macOS 權限檢查清單。
5. 傳送上線設定測試訊息。

若要使用命令列介面/閘道設定路徑，請參閱[入門](/zh-TW/start/getting-started)。
若要復原權限，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 選擇閘道模式

| 模式   | 使用時機                                                                    | 詳細頁面                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 本機  | 這台 Mac 應執行閘道，並透過 launchd 讓它持續運作。                | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway) |
| 遠端 | 另一台主機執行閘道；這台 Mac 透過 SSH、LAN 或 Tailnet 控制它。 | [遠端控制](/zh-TW/platforms/mac/remote)            |

本機模式需要已安裝的 `openclaw` 命令列介面。在全新的 Mac 上，應用程式會在啟動閘道精靈前，
自動安裝相符的命令列介面和執行階段。
如需手動復原，請參閱 [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)。

## 應用程式負責的範圍

- 選單列狀態、通知、健康狀態和 WebChat。
- macOS 對螢幕、麥克風、語音、automation 和輔助使用的權限提示。
- 本機節點工具：Canvas、相機/螢幕擷取、通知和 `system.run`。
- Mac 代管命令的 exec 核准提示。
- 遠端模式 SSH 通道或直接閘道連線。

此應用程式**不會**取代閘道或一般命令列介面文件。閘道
設定、提供者、外掛、頻道、工具和安全性各自有專屬文件。

## macOS 詳細頁面

| 工作                                     | 閱讀                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安裝或偵錯命令列介面/閘道服務 | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)                                          |
| 讓狀態遠離雲端同步資料夾   | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 偵錯應用程式探索和連線能力     | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| 了解 launchd 行為              | [閘道生命週期](/zh-TW/platforms/mac/child-process)                                           |
| 修正權限或簽署/TCC 問題    | [macOS 權限](/zh-TW/platforms/mac/permissions)                                             |
| 連線至遠端閘道              | [遠端控制](/zh-TW/platforms/mac/remote)                                                     |
| 讀取選單列狀態和健康狀態檢查   | [選單列](/zh-TW/platforms/mac/menu-bar), [健康狀態檢查](/zh-TW/platforms/mac/health)                 |
| 使用嵌入式聊天 UI                 | [WebChat](/zh-TW/platforms/mac/webchat)                                                           |
| 使用語音喚醒或按鍵通話           | [語音喚醒](/zh-TW/platforms/mac/voicewake)                                                      |
| 使用 Canvas 和 Canvas 深層連結         | [Canvas](/zh-TW/platforms/mac/canvas)                                                             |
| 代管 PeekabooBridge 以進行 UI automation    | [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)                                                  |
| 設定命令核准              | [Exec 核准](/zh-TW/tools/exec-approvals), [進階詳細資料](/zh-TW/tools/exec-approvals-advanced) |
| 檢查 Mac 節點命令和應用程式 IPC    | [macOS IPC](/zh-TW/platforms/mac/xpc)                                                             |
| 擷取記錄                             | [macOS 記錄](/zh-TW/platforms/mac/logging)                                                     |
| 從原始碼建置                        | [macOS 開發設定](/zh-TW/platforms/mac/dev-setup)                                                 |

## 相關

- [平台](/zh-TW/platforms)
- [入門](/zh-TW/start/getting-started)
- [閘道](/zh-TW/gateway)
- [Exec 核准](/zh-TW/tools/exec-approvals)
