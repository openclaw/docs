---
read_when:
    - 選擇入門設定路徑
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 入門設定選項與流程概覽
title: 入門設定概覽
x-i18n:
    generated_at: "2026-07-05T11:47:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62fdb7768aff55620c6195b8017dd95baa1ef393b03e39e5a07b1a9b9e6ef5a4
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 有兩種入門設定路徑。兩者都會設定驗證、閘道，以及
選用的聊天頻道，只是你與設定流程互動的方式不同。

## 我應該使用哪種路徑？

|                | 命令列介面入門設定                     | macOS 應用程式入門設定      |
| -------------- | -------------------------------------- | --------------------------- |
| **平台**       | macOS、Linux、Windows（原生或 WSL2）   | 僅限 macOS                  |
| **介面**       | 終端機精靈                             | 引導式 UI + Crestodian 聊天 |
| **最適合**     | 伺服器、無頭環境、完整控制             | 桌面 Mac、視覺化設定        |
| **自動化**     | 腳本可用 `--non-interactive`           | 僅限手動                    |
| **命令**       | `openclaw onboard`                     | 啟動應用程式                |

多數使用者應從 **命令列介面入門設定** 開始，因為它可在各處運作，並提供
最多控制權。

## 入門設定會設定什麼

無論你選擇哪種路徑，入門設定都會設定：

1. **模型提供者與驗證** — 你所選提供者的 API 金鑰、OAuth 或設定權杖
2. **工作區** — 代理檔案、啟動範本和記憶的目錄
3. **閘道** — 連接埠、繫結位址、驗證模式
4. **頻道**（選用）— 內建與隨附的聊天頻道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **常駐程式**（選用）— 背景服務，讓閘道自動啟動

## 命令列介面入門設定

在任何終端機中執行：

```bash
openclaw onboard
```

加入 `--install-daemon` 可在同一步驟中一併安裝背景服務。

完整參考：[入門設定（命令列介面）](/zh-TW/start/wizard)
命令列介面命令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS 應用程式入門設定

開啟 OpenClaw 應用程式。若為本機設定，首次執行流程會啟動閘道，
接著開啟 Crestodian 對話，以偵測既有 AI 存取權、提出工作區與設定，
並在核准後套用方案。敏感憑證會使用遮罩輸入。遠端設定則會改為連線到
已設定完成的閘道。

完整參考：[入門設定（macOS 應用程式）](/zh-TW/start/onboarding)

## 自訂或未列出的提供者

如果你的提供者未列在入門設定中，請選擇 **自訂提供者** 並輸入：

- 端點相容性：OpenAI 相容（`/chat/completions`）、OpenAI Responses 相容（`/responses`）、Anthropic 相容（`/messages`），或未知（探測全部三種並自動偵測）
- 基礎 URL 與 API 金鑰（若端點不需要，API 金鑰可選填）
- 模型 ID 與選用的模型別名

可以同時存在多個自訂端點，每個端點都會取得自己的端點 ID。

## 相關內容

- [開始使用](/zh-TW/start/getting-started)
- [命令列介面設定參考](/zh-TW/start/wizard-cli-reference)
