---
doc-schema-version: 1
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你正在內建工具、Skills 和 Plugin 之間做選擇
    - 您需要適合工具政策、自動化或代理協調的正確文件入口點
summary: OpenClaw 工具、Skills 與 plugins 概覽：代理可以呼叫什麼，以及如何擴充它們
title: 概覽
x-i18n:
    generated_at: "2026-05-12T00:59:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

使用此頁面選擇正確的功能介面。**工具**是可呼叫的動作，**Skills**會教導代理如何工作，而**Plugin**會新增執行階段功能，例如工具、供應商、通道、Hook，以及封裝好的 Skills。

這是一個總覽與導覽頁面。如需完整的工具政策、預設值、群組成員資格、供應商限制與設定欄位，請使用
[工具與自訂供應商](/zh-TW/gateway/config-tools)。

## 從這裡開始

對大多數代理而言，請先從內建工具類別開始，然後只有在代理應看到較少工具或需要明確主機存取權時，才調整政策。

| 如果你需要...                           | 請先使用                                 | 接著閱讀                                                               |
| ------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 讓代理以現有功能執行動作 | [內建工具](#built-in-tool-categories)    | [工具類別](#built-in-tool-categories)                            |
| 控制代理可以呼叫什麼              | [工具政策](#configure-access-and-approvals) | [工具與自訂供應商](/zh-TW/gateway/config-tools)                     |
| 教導代理一套工作流程                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/zh-TW/tools/skills) 與 [建立 Skills](/zh-TW/tools/creating-skills)   |
| 新增新的整合或執行階段介面    | [Plugin](#extend-capabilities)                | [Plugin](/zh-TW/tools/plugin) 與 [建置 Plugin](/zh-TW/plugins/building-plugins) |
| 稍後或在背景執行工作         | [自動化](/zh-TW/automation)                      | [自動化總覽](/zh-TW/automation)                                      |
| 協調多個代理或 Harness     | [子代理](/zh-TW/tools/subagents)                 | [ACP 代理](/zh-TW/tools/acp-agents) 與 [代理傳送](/zh-TW/tools/agent-send)     |
| 搜尋大型 PI 工具目錄              | [工具搜尋](/zh-TW/tools/tool-search)              | [工具搜尋](/zh-TW/tools/tool-search)                                       |

## 選擇工具、Skills 或 Plugin

<Steps>
  <Step title="當代理需要執行動作時使用工具">
    工具是代理可以呼叫的型別化函式，例如 `exec`、`browser`、
    `web_search`、`message` 或 `image_generate`。當代理需要讀取資料、變更檔案、傳送訊息、呼叫供應商或操作另一個系統時，請使用工具。可見工具會以結構化函式定義傳送給模型。

    模型只會看到通過作用中設定檔、允許/拒絕政策、供應商限制、沙箱狀態、通道權限與 Plugin 可用性的工具。

  </Step>

  <Step title="當代理需要指示時使用 Skills">
    Skill 是載入代理提示中的 `SKILL.md` 指示包。當代理已擁有所需工具，但需要可重複的工作流程、審查準則、命令序列或操作限制時，請使用 Skill。

    Skills 可以位於工作區、共用 Skill 目錄、受管理的 OpenClaw Skill 根目錄，或 Plugin 套件中。

    [Skills](/zh-TW/tools/skills) | [建立 Skills](/zh-TW/tools/creating-skills) | [Skills 設定](/zh-TW/tools/skills-config)

  </Step>

  <Step title="當 OpenClaw 需要新功能時使用 Plugin">
    Plugin 可以新增工具、Skills、通道、模型供應商、語音、即時語音、媒體生成、網頁搜尋、網頁擷取、Hook，以及其他執行階段功能。當功能包含程式碼、憑證、生命週期 Hook、Manifest 中繼資料或可安裝封裝時，請使用 Plugin。現有 Plugin 可以從 ClawHub、npm、git、本機目錄或封存檔安裝。

    [安裝與設定 Plugin](/zh-TW/tools/plugin) | [建置 Plugin](/zh-TW/plugins/building-plugins) | [Plugin SDK](/zh-TW/plugins/sdk-overview)

  </Step>
</Steps>

## 內建工具類別

此表列出代表性工具，方便你辨識介面。它不是完整的政策參考。如需精確的群組、預設值與允許/拒絕語意，請使用 [工具與自訂供應商](/zh-TW/gateway/config-tools)。

| 類別               | 當代理需要...                                                | 代表性工具                                                 | 接著閱讀                                                              |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 執行階段                | 執行命令、管理程序，或使用由供應商支援的 Python 分析        | `exec`、`process`、`code_execution`                                  | [Exec](/zh-TW/tools/exec)、[程式碼執行](/zh-TW/tools/code-execution)           |
| 檔案                  | 讀取並變更工作區檔案                                               | `read`、`write`、`edit`、`apply_patch`                               | [套用 Patch](/zh-TW/tools/apply-patch)                                      |
| Web                    | 搜尋網頁、搜尋 X 貼文，或擷取可讀的頁面內容                | `web_search`、`x_search`、`web_fetch`                                | [Web 工具](/zh-TW/tools/web)、[Web 擷取](/zh-TW/tools/web-fetch)                 |
| 瀏覽器                | 操作瀏覽器工作階段                                                     | `browser`                                                            | [瀏覽器](/zh-TW/tools/browser)                                              |
| 訊息與通道 | 傳送回覆或通道動作                                               | `message`                                                            | [代理傳送](/zh-TW/tools/agent-send)                                        |
| 工作階段與代理    | 檢查工作階段、委派工作、引導另一個執行，或回報狀態          | `sessions_*`、`subagents`、`agents_list`、`session_status`           | [子代理](/zh-TW/tools/subagents)、[工作階段工具](/zh-TW/concepts/session-tool) |
| 自動化             | 排程工作或回應背景事件                                 | `cron`、`heartbeat_respond`                                          | [自動化](/zh-TW/automation)                                              |
| Gateway 與節點      | 檢查 Gateway 狀態或已配對的目標裝置                                | `gateway`、`nodes`                                                   | [Gateway 設定](/zh-TW/gateway/configuration)、[節點](/zh-TW/nodes)       |
| 媒體                  | 分析、生成或朗讀媒體                                             | `image`、`image_generate`、`music_generate`、`video_generate`、`tts` | [媒體總覽](/zh-TW/tools/media-overview)                                |
| 大型 PI 目錄      | 搜尋並呼叫許多符合資格的工具，而不將每個 Schema 傳送給模型 | `tool_search_code`、`tool_search`、`tool_describe`                   | [工具搜尋](/zh-TW/tools/tool-search)                                      |

<Note>
工具搜尋是實驗性的 PI 代理介面。Codex harness 執行會使用
Codex 原生程式碼模式、原生工具搜尋、延遲動態工具，以及巢狀工具呼叫，而不是 `tools.toolSearch`。
</Note>

## Plugin 提供的工具

Plugin 可以註冊額外工具。Plugin 作者會透過
`api.registerTool(...)` 和 Manifest 的 `contracts.tools` 串接工具；請使用
[Plugin SDK](/zh-TW/plugins/sdk-overview) 與 [Plugin Manifest](/zh-TW/plugins/manifest)
了解合約詳細資訊。

常見的 Plugin 提供工具包括：

- [Diffs](/zh-TW/tools/diffs)，用於呈現檔案與 Markdown Diff
- [LLM Task](/zh-TW/tools/llm-task)，用於僅 JSON 的工作流程步驟
- [Lobster](/zh-TW/tools/lobster)，用於具備可恢復核准流程的型別化工作流程
- [Tokenjuice](/zh-TW/tools/tokenjuice)，用於壓縮嘈雜的 `exec` 與 `bash` 工具輸出
- [工具搜尋](/zh-TW/tools/tool-search)，用於探索並呼叫大型工具目錄，而不把每個 Schema 放進提示中
- [Canvas](/zh-TW/plugins/reference/canvas)，用於節點 Canvas 控制與 A2UI 呈現

## 設定存取權與核准

工具政策會在模型呼叫之前強制執行。如果政策移除了某個工具，模型在該回合就不會收到該工具的 Schema。一次執行可能因為全域設定、個別代理設定、通道政策、供應商限制、沙箱規則、僅限擁有者的閘門控管或 Plugin 可用性而失去工具。

- [工具與自訂供應商](/zh-TW/gateway/config-tools) 記錄工具設定檔、允許/拒絕清單、供應商特定限制、迴圈偵測，以及由供應商支援的工具設定。
- [Exec 核准](/zh-TW/tools/exec-approvals) 記錄主機命令核准政策。
- [提升權限的 exec](/zh-TW/tools/elevated) 記錄沙箱外的受控執行。
- [沙箱 vs 工具政策 vs 提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) 說明哪一層控制檔案與程序存取。
- [個別代理沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)
  記錄委派執行的代理特定限制。

## 擴充功能

依照你需要 OpenClaw 執行的工作選擇擴充路徑：

- 使用 [Plugin](/zh-TW/tools/plugin) 安裝或管理現有 Plugin。
- 使用 [建置 Plugin](/zh-TW/plugins/building-plugins) 建立新的整合、供應商、通道、工具或 Hook。
- 使用 [Skills](/zh-TW/tools/skills) 與 [建立 Skills](/zh-TW/tools/creating-skills) 新增或調整可重複使用的代理指示。
- 當工作流程屬於由 Plugin 散佈的 Skill Bundle 時，使用
  [Skill workshop](/zh-TW/plugins/skill-workshop) 封裝可重複使用的工作流程素材。
- 當你需要實作合約時，請使用 [Plugin SDK](/zh-TW/plugins/sdk-overview) 與 [Plugin Manifest](/zh-TW/plugins/manifest)。

## 疑難排解遺失的工具

如果模型看不到或無法呼叫工具，請從目前回合的有效政策開始：

1. 檢查 [工具與自訂供應商](/zh-TW/gateway/config-tools) 中的作用中設定檔、`tools.allow` 與 `tools.deny`。
2. 檢查 [工具與自訂供應商](/zh-TW/gateway/config-tools) 中的供應商特定限制，並確認所選的 [模型供應商](/zh-TW/concepts/model-providers) 支援該工具形狀。
3. 使用 [沙箱 vs 工具政策 vs 提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) 與 [提升權限的 exec](/zh-TW/tools/elevated) 檢查通道權限、沙箱狀態與提升權限存取。
4. 檢查擁有該工具的 Plugin 是否已在 [Plugin](/zh-TW/tools/plugin) 中安裝並啟用。
5. 對於委派執行，請檢查 [個別代理沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools) 中的個別代理限制。
6. 對於大型 PI 目錄，請確認該執行使用直接工具暴露或 [工具搜尋](/zh-TW/tools/tool-search)。

## 相關

- [自動化](/zh-TW/automation)，涵蓋 cron、任務、heartbeat、承諾、Hook、常設指令與 Task Flow
- [代理](/zh-TW/concepts/agent)，涵蓋代理模型、工作階段、記憶體與多代理協調
- [工具與自訂供應商](/zh-TW/gateway/config-tools)，作為標準工具政策參考
- [Plugin](/zh-TW/tools/plugin)，用於 Plugin 安裝與管理
- [Plugin SDK](/zh-TW/plugins/sdk-overview)，作為 Plugin 作者參考
- [Skills](/zh-TW/tools/skills)，用於 Skill 載入順序、閘門控管與設定
- [工具搜尋](/zh-TW/tools/tool-search)，用於精簡的 PI 工具目錄探索
