---
read_when:
    - 安裝 macOS 應用程式
    - 在 macOS 上決定使用本機或遠端閘道模式
    - 正在尋找 macOS 應用程式版本下載
summary: 安裝並使用 OpenClaw macOS 選單列應用程式
title: macOS 應用程式
x-i18n:
    generated_at: "2026-06-28T00:13:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

macOS App 是 OpenClaw **選單列 companion**。當你需要原生系統匣介面、macOS 權限提示、通知、WebChat、語音輸入、Canvas，或由 Mac 託管的節點工具（例如 `system.run`）時，請使用它。

如果你只需要命令列介面和閘道，請從[開始使用](/zh-TW/start/getting-started)開始。

## 下載

請從
[OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases)
下載 macOS App 組建。當某個版本包含 macOS App 資產時，請尋找：

- `OpenClaw-<version>.dmg`（建議）
- `OpenClaw-<version>.zip`

有些版本只包含命令列介面、證據或 Windows 資產。如果最新版本沒有 macOS App 資產，請使用最新且包含該資產的版本，或依照 [macOS 開發設定](/zh-TW/platforms/mac/dev-setup)從原始碼建置 App。

## 首次執行

1. 安裝並啟動 **OpenClaw.app**。
2. 完成 macOS 權限檢查清單。
3. 選擇 **Local** 或 **Remote** 模式。
4. 如果 App 要求，請安裝 `openclaw` 命令列介面。
5. 從選單列開啟 WebChat，並傳送測試訊息。

若要使用命令列介面／閘道設定路徑，請參閱[開始使用](/zh-TW/start/getting-started)。
若要復原權限，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 選擇閘道模式

| 模式   | 使用時機                                                                                | 詳細頁面                                           |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Local  | 這台 Mac 應執行閘道，並透過 launchd 讓它保持運作。                                     | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway) |
| Remote | 另一台主機會執行閘道，而這台 Mac 應透過 SSH、LAN 或 Tailnet 控制它。                   | [遠端控制](/zh-TW/platforms/mac/remote)                  |

Local 模式需要已安裝的 `openclaw` 命令列介面。App 可以安裝它，或者你可以依照 [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)操作。

## App 負責的內容

- 選單列狀態、通知、健康狀態和 WebChat。
- macOS 針對螢幕、麥克風、語音、自動化和輔助使用的權限提示。
- 本機節點工具，例如 Canvas、相機／螢幕擷取、通知和 `system.run`。
- Mac 託管命令的執行核准提示。
- Remote 模式的 SSH 通道或直接閘道連線。

此 App **不會**取代 OpenClaw 閘道或一般命令列介面文件。核心閘道設定、供應商、外掛、通道、工具和安全性都有各自的文件。

## macOS 詳細頁面

| 工作                                     | 閱讀                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安裝或偵錯命令列介面／閘道服務          | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)                                          |
| 避免將狀態放入雲端同步資料夾            | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 偵錯 App 探索與連線能力                  | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| 了解 launchd 行為                        | [閘道生命週期](/zh-TW/platforms/mac/child-process)                                               |
| 修正權限或簽署／TCC 問題                 | [macOS 權限](/zh-TW/platforms/mac/permissions)                                                    |
| 連線到遠端閘道                           | [遠端控制](/zh-TW/platforms/mac/remote)                                                          |
| 閱讀選單列狀態與健康檢查                 | [選單列](/zh-TW/platforms/mac/menu-bar), [健康檢查](/zh-TW/platforms/mac/health)                      |
| 使用內嵌聊天介面                         | [WebChat](/zh-TW/platforms/mac/webchat)                                                           |
| 使用語音喚醒或按住說話                   | [語音喚醒](/zh-TW/platforms/mac/voicewake)                                                       |
| 使用 Canvas 和 Canvas 深層連結           | [Canvas](/zh-TW/platforms/mac/canvas)                                                             |
| 託管 PeekabooBridge 以進行 UI 自動化      | [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)                                                  |
| 設定命令核准                             | [執行核准](/zh-TW/tools/exec-approvals), [進階詳細資訊](/zh-TW/tools/exec-approvals-advanced)          |
| 檢查 Mac 節點命令與 App IPC              | [macOS IPC](/zh-TW/platforms/mac/xpc)                                                             |
| 擷取記錄                                 | [macOS 記錄](/zh-TW/platforms/mac/logging)                                                        |
| 從原始碼建置                             | [macOS 開發設定](/zh-TW/platforms/mac/dev-setup)                                                  |

## 相關

- [平台](/zh-TW/platforms)
- [開始使用](/zh-TW/start/getting-started)
- [閘道](/zh-TW/gateway)
- [執行核准](/zh-TW/tools/exec-approvals)
