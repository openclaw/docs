---
read_when:
    - 選擇新手引導流程
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引導選項與流程概覽
title: 新手設定概覽
x-i18n:
    generated_at: "2026-07-16T12:02:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 提供終端機與 macOS App 的初始設定流程。兩者都會先建立推論：
偵測現有的 AI 存取權、要求完成一次即時回覆，然後才啟動
OpenClaw 以完成其餘設定。若已設定且可連線的閘道中，
預設代理程式已有設定好的模型，則會略過初始設定，並開啟
一般代理程式 UI。終端機流程也提供完整的傳統精靈，以進行
詳細設定。

## 我該使用哪種方式？

|                | 命令列介面初始設定                         | macOS App 初始設定           |
| -------------- | -------------------------------------- | ------------------------------ |
| **平台**  | macOS、Linux、Windows（原生或 WSL2） | 僅限 macOS                     |
| **介面**  | 先設定推論，再設定 OpenClaw         | 先設定推論，再設定 OpenClaw |
| **最適合**   | 伺服器、無頭環境、完整控制        | 桌面 Mac、視覺化設定      |
| **自動化** | `--non-interactive`，適用於指令碼        | 僅限手動                    |
| **命令**    | `openclaw onboard`                     | 啟動 App                 |

大多數使用者應從**命令列介面初始設定**開始——它適用於所有環境，並能讓
你擁有最大的控制權。

## 初始設定會設定哪些項目

引導式推論階段只會建立：

1. **模型供應商與驗證**——偵測到的存取權，或經驗證的供應商登入、
   API 金鑰或權杖
2. **已驗證的推論**——使用預設代理程式實際生效的
   模型完成一次真實回覆

該次回覆通過後，OpenClaw 即可設定工作區、閘道、
閘道服務、頻道、代理程式、外掛及其他選用功能。

傳統命令列介面精靈還可設定：

1. **頻道**（選用）——內建及隨附的聊天頻道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
2. **進階閘道控制項**——遠端模式、網路設定及常駐程式選項

## 命令列介面初始設定

在任一終端機中執行：

```bash
openclaw onboard
```

引導式流程會偵測現有的 AI 存取權，依序即時測試候選項目，
並在失敗時繼續嘗試下一個選項。若偵測完所有選項仍無結果，會先顯示 OpenAI、
Anthropic、xAI（Grok）、Google 與 OpenRouter。**更多…**包含其餘
依供應商群組分類的供應商，第二層選單則列出地區、方案及支援的
瀏覽器、裝置、API 金鑰或權杖方式。只有在回覆測試通過後，才會儲存模型
與認證資訊，接著啟動 OpenClaw 以設定工作區、閘道、頻道、代理程式、外掛
及其他選用功能。**暫時略過**會直接結束而不啟動 OpenClaw。流程中
不會轉交至傳統精靈；若要改用傳統精靈，請結束並執行 `openclaw onboard --classic`。

推論通過後，OpenClaw 可將頻道設定交由隱藏輸入內容的終端機
精靈處理。它不會開啟引導式或傳統供應商設定；若要變更模型供應商
或其驗證方式，請結束 OpenClaw 並執行 `openclaw onboard`。

使用 `openclaw onboard --classic` 進行詳細的模型／驗證、頻道、Skills、
遠端閘道或匯入設定。加上 `--install-daemon` 也會選取
傳統流程，並在同一步驟安裝背景服務。使用 `openclaw
openclaw` 進行對話式的非推論設定與修復。`openclaw
onboard --modern` 是使用相同即時推論
閘門的相容性別名。

完整參考資料：[初始設定（命令列介面）](/zh-TW/start/wizard)
命令列介面命令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS App 初始設定

開啟 OpenClaw App。如果其設定的本機或遠端閘道可連線，
且預設代理程式已有設定好的模型，App 會略過初始設定
與 OpenClaw 設定，立即開啟一般代理程式 UI。

對於全新或未完整設定的閘道，首次執行流程會偵測現有的 AI
存取權（Claude Code、Codex 或 API 金鑰）、即時測試最佳
選項，並僅在取得真實回覆後儲存——若失敗則自動改用其他選項，
且在未找到任何項目時提供經驗證的手動 API 金鑰步驟。敏感的
認證資訊會使用遮蔽輸入。推論通過後，OpenClaw 便會啟動並
協助完成其餘設定。

設定完成後，一般代理程式仍可使用 Gemini 命令列介面，但此推論
閘門不會提供該選項，因為它無法強制執行不使用工具的探測。

完整參考資料：[初始設定（macOS App）](/zh-TW/start/onboarding)

## 自訂或未列出的供應商

如果你的供應商未列出，請執行 `openclaw onboard --classic`、選擇
**自訂供應商**，然後輸入：

- 端點相容性：OpenAI 相容（`/chat/completions`）、OpenAI Responses 相容（`/responses`）、Anthropic 相容（`/messages`），或未知（探測全部三種並自動偵測）
- 基礎 URL 與 API 金鑰（若端點不要求 API 金鑰，則可不填）
- 模型 ID 與選用的模型別名

可同時使用多個自訂端點——每個端點都會取得自己的端點 ID。

## 相關內容

- [開始使用](/zh-TW/start/getting-started)
- [命令列介面設定參考資料](/zh-TW/start/wizard-cli-reference)
