---
read_when:
    - 選擇入門設定路徑
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 入門設定選項與流程概覽
title: 上手流程總覽
x-i18n:
    generated_at: "2026-07-05T17:42:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c41a83d23341504ef8c8279530c33a7e9b73c466eb7128775756acd800849e61
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 有兩種入門設定路徑。兩者都會設定驗證、閘道，以及
選用的聊天頻道 — 差別只在於你與設定流程互動的方式。

## 我該使用哪一種路徑？

|                | 命令列介面入門設定                     | macOS 應用程式入門設定       |
| -------------- | -------------------------------------- | --------------------------- |
| **平台**       | macOS、Linux、Windows（原生或 WSL2）   | 僅限 macOS                  |
| **介面**       | 終端機精靈                             | 引導式 UI + Crestodian 聊天 |
| **最適合**     | 伺服器、無頭環境、完整控制             | 桌面 Mac、視覺化設定        |
| **自動化**     | 用於腳本的 `--non-interactive`         | 僅限手動                    |
| **命令**       | `openclaw onboard`                     | 啟動應用程式                |

大多數使用者應從 **命令列介面入門設定** 開始 — 它適用於所有環境，並提供
最多控制權。

## 入門設定會設定什麼

無論你選擇哪種路徑，入門設定都會設置：

1. **模型供應商與驗證** — 你所選供應商的 API 金鑰、OAuth，或設定權杖
2. **工作區** — 用於代理檔案、啟動範本與記憶的目錄
3. **閘道** — 連接埠、綁定位址、驗證模式
4. **頻道**（選用）— 內建與隨附的聊天頻道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **常駐程式**（選用）— 背景服務，讓閘道自動啟動

## 命令列介面入門設定

在任何終端機執行：

```bash
openclaw onboard
```

加入 `--install-daemon` 可在同一步驟中一併安裝背景服務。

完整參考：[入門設定（命令列介面）](/zh-TW/start/wizard)
命令列介面命令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS 應用程式入門設定

開啟 OpenClaw 應用程式。針對本機設定，首次執行流程會啟動閘道、
偵測既有的 AI 存取權（Claude Code、Codex、Gemini CLI 或 API 金鑰）、
即時測試最佳選項，並且只在取得真實回覆後才儲存 — 若未找到任何項目，
則會自動退回並提供經驗證的手動 API 金鑰步驟。敏感憑證會使用遮罩輸入。
遠端設定則會連線到已設定好的閘道，且相同的 AI 檢查會針對該閘道執行。

完整參考：[入門設定（macOS 應用程式）](/zh-TW/start/onboarding)

## 自訂或未列出的供應商

如果你的供應商未列在入門設定中，請選擇 **自訂供應商** 並輸入：

- 端點相容性：OpenAI 相容（`/chat/completions`）、OpenAI Responses 相容（`/responses`）、Anthropic 相容（`/messages`），或未知（探測全部三者並自動偵測）
- 基底 URL 與 API 金鑰（如果端點不需要，API 金鑰可省略）
- 模型 ID 與選用的模型別名

多個自訂端點可以共存 — 每個端點都有自己的端點 ID。

## 相關

- [開始使用](/zh-TW/start/getting-started)
- [命令列介面設定參考](/zh-TW/start/wizard-cli-reference)
