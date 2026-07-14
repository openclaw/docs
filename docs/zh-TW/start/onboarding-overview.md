---
read_when:
    - 選擇新手引導流程
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引導選項與流程概覽
title: 新手引導概覽
x-i18n:
    generated_at: "2026-07-14T14:11:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e045bbbc4516cf2b89d5867978e9d88d83e744da3794748952375496c06f59c3
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 提供終端機與 macOS App 的新手設定流程。兩者都會先建立推論功能：
偵測現有的 AI 存取方式、要求成功完成即時回覆，之後才啟動
Crestodian 以設定其餘項目。如果可連線且已完成設定的閘道中，
預設代理已設定模型，則會略過新手設定，直接開啟一般代理 UI。
終端機流程也提供完整的傳統精靈，以進行詳細設定。

## 我該使用哪一種流程？

|                | 命令列介面新手設定                         | macOS App 新手設定             |
| -------------- | -------------------------------------- | -------------------------------- |
| **平台**  | macOS、Linux、Windows（原生或 WSL2） | 僅限 macOS                       |
| **介面**  | 先設定推論，再由 Crestodian 設定       | 先設定推論，再由 Crestodian 設定 |
| **最適合**   | 伺服器、無頭環境、完整控制        | 桌面版 Mac、視覺化設定        |
| **自動化** | 使用 `--non-interactive` 編寫指令碼        | 僅限手動                      |
| **命令**    | `openclaw onboard`                     | 啟動 App                   |

大多數使用者應從**命令列介面新手設定**開始——它可在所有環境中運作，並提供
最多的控制能力。

## 新手設定會設定哪些項目

引導式推論階段只會建立：

1. **模型供應商與身分驗證**——偵測到的存取方式，或經過驗證的供應商登入、
   API 金鑰或權杖
2. **已驗證的推論**——使用預設代理實際生效的模型完成一次真實回覆

該回覆通過後，Crestodian 即可設定工作區、閘道、
閘道服務、頻道、代理、外掛及其他選用功能。

傳統命令列介面精靈還可以設定：

1. **頻道**（選用）——內建及隨附的聊天頻道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
2. **進階閘道控制**——遠端模式、網路設定及常駐程式選項

## 命令列介面新手設定

在任何終端機中執行：

```bash
openclaw onboard
```

引導式流程會偵測現有的 AI 存取方式、依序進行即時測試，
並在失敗時嘗試下一個候選項目。如果所有偵測方式均已用盡，會優先顯示 OpenAI、
Anthropic、xAI（Grok）、Google 與 OpenRouter。**更多…**會在第二層選單中，
依供應商群組列出其餘供應商，以及區域、方案和支援的
瀏覽器、裝置、API 金鑰或權杖方式。只有在成功完成回覆後，才會儲存模型
與認證資訊，接著啟動 Crestodian 來設定
工作區、閘道、頻道、代理、外掛及其他選用
功能。**暫時略過**會直接結束，不啟動 Crestodian。流程內不會
轉交至傳統設定；若要改用傳統精靈，請結束後執行 `openclaw onboard --classic`。

推論通過後，Crestodian 可以將頻道設定交給使用遮罩輸入的終端機
精靈。它不會開啟引導式或傳統供應商設定；若要變更模型供應商或其
身分驗證方式，請結束 Crestodian 並執行 `openclaw onboard`。

若要詳細設定模型／身分驗證、頻道、Skill、
遠端閘道或匯入項目，請使用 `openclaw onboard --classic`。加上 `--install-daemon`
也會選擇傳統流程，並一次完成背景服務安裝。若要以對話方式進行非推論項目的設定與修復，請使用 `openclaw
crestodian`。`openclaw
onboard --modern` 是使用相同即時推論
閘門的相容性別名。

完整參考資料：[新手設定（命令列介面）](/zh-TW/start/wizard)
命令列介面命令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS App 新手設定

開啟 OpenClaw App。如果已設定的本機或遠端閘道可連線，
且預設代理已設定模型，App 會略過新手設定
與 Crestodian，立即開啟一般代理 UI。

若是全新或尚未完成設定的閘道，首次執行流程會偵測現有的 AI
存取方式（Claude Code、Codex 或 API 金鑰）、即時測試最佳
選項，並只在收到真實回覆後儲存——若失敗會自動嘗試其他選項，
且在找不到任何方式時提供經驗證的手動 API 金鑰步驟。敏感的
認證資訊會使用遮罩輸入。推論通過後，Crestodian 便會啟動並
協助完成其餘設定。

完成設定後，一般代理仍可使用 Gemini CLI，但此推論閘門
不會提供該選項，因為它無法強制執行不使用工具的探測。

完整參考資料：[新手設定（macOS App）](/zh-TW/start/onboarding)

## 自訂或未列出的供應商

如果你的供應商未列出，請執行 `openclaw onboard --classic`、選擇
**自訂供應商**，然後輸入：

- 端點相容性：OpenAI 相容（`/chat/completions`）、OpenAI Responses 相容（`/responses`）、Anthropic 相容（`/messages`），或未知（探測全部三種並自動偵測）
- 基底 URL 與 API 金鑰（如果端點不要求 API 金鑰，則可省略）
- 模型 ID 與選用的模型別名

可以同時使用多個自訂端點——每個端點都會取得專屬的端點 ID。

## 相關內容

- [開始使用](/zh-TW/start/getting-started)
- [命令列介面設定參考資料](/zh-TW/start/wizard-cli-reference)
