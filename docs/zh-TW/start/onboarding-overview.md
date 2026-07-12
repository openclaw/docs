---
read_when:
    - 選擇新手引導流程
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引導選項與流程概覽
title: 新手引導概覽
x-i18n:
    generated_at: "2026-07-11T21:48:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 提供終端機與 macOS 應用程式的初始設定流程。兩者都會先建立推論能力：
偵測現有的 AI 存取權、要求即時完成一次推論，之後才會啟動
Crestodian 來完成其餘設定。若可連線且已設定的閘道中，
預設代理程式已設定模型，則會略過初始設定流程，直接開啟
一般代理程式介面。終端機流程也提供完整的傳統精靈，
可進行詳細設定。

## 我該使用哪種方式？

|                | 命令列介面初始設定                     | macOS 應用程式初始設定           |
| -------------- | -------------------------------------- | -------------------------------- |
| **平台**       | macOS、Linux、Windows（原生或 WSL2）   | 僅限 macOS                       |
| **介面**       | 推論設定，接著使用 Crestodian          | 推論設定，接著使用 Crestodian    |
| **最適合**     | 伺服器、無頭環境、完整控制             | 桌面 Mac、視覺化設定             |
| **自動化**     | 腳本可使用 `--non-interactive`         | 僅限手動                         |
| **命令**       | `openclaw onboard`                     | 啟動應用程式                     |

大多數使用者應從**命令列介面初始設定**開始——它適用於所有環境，
並能提供最完整的控制。

## 初始設定流程會設定哪些項目

引導式推論階段只會建立：

1. **模型供應商與驗證**——偵測到的存取權或已驗證的 API 金鑰
2. **已驗證的推論**——使用預設代理程式實際生效的模型，
   真正完成一次推論

該推論成功後，Crestodian 便可設定工作區、閘道、
閘道服務、頻道、代理程式、外掛及其他選用功能。

傳統命令列介面精靈還可設定：

1. **頻道**（選用）——內建及隨附的聊天頻道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
2. **進階閘道控制項**——遠端模式、網路設定及背景服務選項

## 命令列介面初始設定

在任意終端機中執行：

```bash
openclaw onboard
```

引導式流程會偵測現有的 AI 存取權、依序即時測試候選項目、
失敗時嘗試下一個選項，並提供遮蔽式的手動金鑰輸入。只有在完成一次
成功的推論後，才會儲存模型與憑證，接著啟動 Crestodian
以設定工作區、閘道、頻道、代理程式、外掛及其他
選用功能。此流程不會在推論前啟動 Crestodian，也無法略過 AI，
亦不會在流程中轉交給傳統精靈。若要改用傳統精靈，請退出並執行
`openclaw onboard --classic`。

推論成功後，Crestodian 可將頻道設定交由採用遮蔽輸入的終端機
精靈處理。它不會開啟引導式或傳統的供應商設定；若要變更模型供應商
或其驗證方式，請退出 Crestodian 並執行 `openclaw onboard`。

如需詳細的模型／驗證、頻道、Skill、遠端閘道或匯入設定，請使用
`openclaw onboard --classic`。加入 `--install-daemon` 也會選擇
傳統流程，並一次完成背景服務的安裝。若要透過對話進行非推論設定與修復，
請使用 `openclaw crestodian`。`openclaw onboard --modern`
是相容性別名，使用相同的即時推論檢查關卡。

完整參考資料：[初始設定（命令列介面）](/zh-TW/start/wizard)
命令列介面命令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS 應用程式初始設定

開啟 OpenClaw 應用程式。若其設定的本機或遠端閘道可連線，
且預設代理程式已設定模型，應用程式便會略過初始設定流程
及 Crestodian，立即開啟一般代理程式介面。

對於全新或設定不完整的閘道，首次執行流程會偵測現有的 AI
存取權（Claude Code、Codex 或 API 金鑰）、即時測試最佳
選項，並只在收到真實回覆後才儲存——若失敗則自動改用其他選項，
而在找不到任何選項時，提供經過驗證的手動 API 金鑰步驟。敏感
憑證會採用遮蔽輸入。推論成功後，Crestodian 便會啟動並
協助完成其餘設定。

設定完成後，一般代理程式仍可使用 Gemini CLI，但此推論檢查關卡
不提供該選項，因為它無法強制執行不使用工具的探測。

完整參考資料：[初始設定（macOS 應用程式）](/zh-TW/start/onboarding)

## 自訂或未列出的供應商

若清單中沒有您的供應商，請執行 `openclaw onboard --classic`，選擇
**Custom Provider**，然後輸入：

- 端點相容性：相容 OpenAI（`/chat/completions`）、相容 OpenAI Responses（`/responses`）、相容 Anthropic（`/messages`），或未知（探測全部三種並自動偵測）
- 基礎 URL 與 API 金鑰（若端點不要求金鑰，則 API 金鑰為選填）
- 模型 ID 與選用的模型別名

可同時使用多個自訂端點——每個端點都會取得專屬的端點 ID。

## 相關內容

- [開始使用](/zh-TW/start/getting-started)
- [命令列介面設定參考資料](/zh-TW/start/wizard-cli-reference)
