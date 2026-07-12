---
read_when:
    - 選擇新手引導流程
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 初始設定選項與流程概覽
title: 新手設定概覽
x-i18n:
    generated_at: "2026-07-12T14:49:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 提供終端與 macOS 應用程式的新手設定流程。兩者都會先建立推論功能：
它們會偵測現有的 AI 存取權、要求完成一次即時回應，之後才會啟動
Crestodian 來設定其餘項目。若可連線且已設定的閘道，其預設代理程式
已有設定完成的模型，則會略過新手設定流程並開啟一般的代理程式
使用者介面。終端流程也提供完整的傳統精靈，以進行詳細設定。

## 我該使用哪種方式？

|                | 命令列介面新手設定流程                 | macOS 應用程式新手設定流程       |
| -------------- | -------------------------------------- | -------------------------------- |
| **平台**       | macOS、Linux、Windows（原生或 WSL2）   | 僅限 macOS                       |
| **介面**       | 推論設定，接著使用 Crestodian          | 推論設定，接著使用 Crestodian    |
| **最適合**     | 伺服器、無頭環境、完整控制             | 桌面 Mac、視覺化設定             |
| **自動化**     | 指令碼可使用 `--non-interactive`       | 僅限手動                         |
| **命令**       | `openclaw onboard`                     | 啟動應用程式                     |

大多數使用者應從**命令列介面新手設定流程**開始——它適用於所有環境，並讓
你擁有最大的控制權。

## 新手設定流程會設定哪些項目

引導式推論階段僅會建立：

1. **模型供應商與驗證**——偵測到的存取權或已驗證的 API 金鑰
2. **已驗證的推論**——使用預設代理程式實際生效的模型完成一次真實
   回應

完成並通過後，Crestodian 可設定工作區、閘道、
閘道服務、頻道、代理程式、外掛及其他選用功能。

傳統命令列介面精靈還可額外設定：

1. **頻道**（選用）——內建及隨附的聊天頻道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
2. **進階閘道控制項**——遠端模式、網路設定及常駐程式選項

## 命令列介面新手設定流程

在任何終端中執行：

```bash
openclaw onboard
```

引導式流程會偵測現有的 AI 存取權、依序即時測試候選項目、
失敗時繼續嘗試下一個，並提供遮罩顯示的手動金鑰輸入方式。只有在完成一次
通過測試的回應後，才會儲存模型與認證資訊，接著啟動 Crestodian
來設定工作區、閘道、頻道、代理程式、外掛及其他
選用功能。流程不會在推論前啟動 Crestodian，也沒有略過 AI 的路徑或
流程內轉交至傳統精靈的選項。若要改用傳統精靈，請退出並執行
`openclaw onboard --classic`。

推論通過後，Crestodian 可以將頻道設定交給輸入遮罩的終端機
精靈。它不會開啟引導式或傳統供應商設定；請退出 Crestodian，然後
執行 `openclaw onboard` 以變更模型供應商或其驗證方式。

使用 `openclaw onboard --classic` 進行詳細的模型／驗證、頻道、技能、
遠端閘道或匯入設定。加入 `--install-daemon` 也會選用
傳統流程，並一次完成背景服務的安裝。使用 `openclaw
crestodian` 進行對話式的非推論設定與修復。`openclaw
onboard --modern` 是相容性別名，使用相同的即時推論
閘門。

完整參考：[新手設定（命令列介面）](/zh-TW/start/wizard)
命令列介面指令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS 應用程式新手設定

開啟 OpenClaw 應用程式。如果其設定的本機或遠端閘道可連線，
且預設代理程式已有設定完成的模型，應用程式會略過新手設定
和 Crestodian，並立即開啟一般的代理程式使用者介面。

對於全新或設定不完整的閘道，首次執行流程會偵測現有的 AI
存取方式（Claude Code、Codex 或 API 金鑰），對最佳
選項進行即時測試，並僅在收到實際回覆後儲存——若失敗會自動改用其他選項，
且在找不到任何選項時，提供經過驗證的手動 API 金鑰步驟。敏感
認證資訊會使用輸入遮罩。推論通過後，Crestodian 便會啟動，
並協助設定其餘項目。

設定完成後，一般代理程式仍可使用 Gemini CLI，但此推論閘門
不會提供該選項，因為它無法強制執行不使用工具的探測。

完整參考：[新手引導（macOS App）](/zh-TW/start/onboarding)

## 自訂或未列出的供應商

如果你的供應商未列出，請執行 `openclaw onboard --classic`、選擇
**自訂供應商**，並輸入：

- 端點相容性：OpenAI 相容（`/chat/completions`）、OpenAI Responses 相容（`/responses`）、Anthropic 相容（`/messages`），或未知（探測全部三種並自動偵測）
- 基礎 URL 和 API 金鑰（如果端點不要求 API 金鑰，則可省略）
- 模型 ID 和選用的模型別名

可以同時使用多個自訂端點——每個端點都會取得自己的端點 ID。

## 相關內容

- [開始使用](/zh-TW/start/getting-started)
- [命令列介面設定參考](/zh-TW/start/wizard-cli-reference)
