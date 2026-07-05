---
doc-schema-version: 1
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你正在內建工具、Skills 與外掛之間做出選擇
    - 你需要適合工具政策、自動化或代理協調的正確文件入口點
summary: OpenClaw 工具、Skills 與外掛概覽：代理可呼叫的項目及其擴充方式
title: 概述
x-i18n:
    generated_at: "2026-07-05T11:50:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7bd288b897e95363106fd8d82e4012959176110537ec877259d7dc8e0c9c8540
    source_path: tools/index.md
    workflow: 16
---

使用本頁來選擇正確的功能介面。**工具**是可呼叫的動作，**Skills**會教代理如何工作，而**外掛**會加入執行階段功能，例如工具、供應商、頻道、鉤子，以及封裝的 Skills。

這是概覽與路由頁。若要查看完整的工具政策、預設值、群組成員資格、供應商限制與設定欄位，請使用[工具與自訂供應商](/zh-TW/gateway/config-tools)。

## 從這裡開始

對大多數代理而言，先從內建工具類別開始，然後只在代理應該看到較少工具或需要明確主機存取權時調整政策。

| 如果你需要……                              | 請先使用                                      | 接著閱讀                                                                                                        |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 讓代理使用現有功能執行動作 | [內建工具](#built-in-tool-categories)    | [工具類別](#built-in-tool-categories)                                                                    |
| 控制代理可以呼叫的內容              | [工具政策](#configure-access-and-approvals) | [工具與自訂供應商](/zh-TW/gateway/config-tools)                                                             |
| 教代理一個工作流程                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/zh-TW/tools/skills)、[建立 Skills](/zh-TW/tools/creating-skills)，以及 [Skill Workshop](/zh-TW/tools/skill-workshop) |
| 新增整合或執行階段介面    | [外掛](#extend-capabilities)                | [外掛](/zh-TW/tools/plugin)與[建置外掛](/zh-TW/plugins/building-plugins)                                         |
| 稍後或在背景執行工作         | [自動化](/zh-TW/automation)                      | [自動化概覽](/zh-TW/automation)                                                                              |
| 協調多個代理或測試框架     | [子代理](/zh-TW/tools/subagents)                 | [ACP 代理](/zh-TW/tools/acp-agents)與[代理傳送](/zh-TW/tools/agent-send)                                             |
| 搜尋大型 OpenClaw 工具目錄        | [工具搜尋](/zh-TW/tools/tool-search)              | [工具搜尋](/zh-TW/tools/tool-search)                                                                               |

## 選擇工具、Skills 或外掛

<Steps>
  <Step title="Use a tool when the agent needs to act">
    工具是代理可以呼叫的型別化函式，例如 `exec`、`browser`、
    `web_search`、`message` 或 `image_generate`。當代理需要讀取資料、
    變更檔案、傳送訊息、呼叫供應商，或操作另一個系統時，請使用工具。
    可見工具會以結構化函式定義的形式傳送給模型。

    模型只會看到通過作用中設定檔、允許/拒絕政策、供應商限制、沙箱狀態、
    頻道權限，以及外掛可用性篩選後的工具。

  </Step>

  <Step title="Use a skill when the agent needs instructions">
    Skill 是載入代理提示中的 `SKILL.md` 指令包。當代理已經具備所需工具，
    但需要可重複的工作流程、審查準則、命令序列或操作限制時，請使用
    Skill。

    Skills 可以存在於工作區、共用 Skill 目錄、受管理的 OpenClaw
    Skill 根目錄，或外掛套件中。

    [Skills](/zh-TW/tools/skills) | [Skill Workshop](/zh-TW/tools/skill-workshop) | [建立 Skills](/zh-TW/tools/creating-skills) | [Skills 設定](/zh-TW/tools/skills-config)

  </Step>

  <Step title="Use a plugin when OpenClaw needs a new capability">
    外掛可以新增工具、Skills、頻道、模型供應商、語音、即時語音、媒體生成、
    網頁搜尋、網頁擷取、鉤子，以及其他執行階段功能。當功能包含程式碼、
    認證、生命週期鉤子、清單中繼資料或可安裝封裝時，請使用外掛。
    現有外掛可以從 ClawHub、npm、git、本機目錄或封存檔安裝。

    [安裝與設定外掛](/zh-TW/tools/plugin) | [建置外掛](/zh-TW/plugins/building-plugins) | [外掛 SDK](/zh-TW/plugins/sdk-overview)

  </Step>
</Steps>

## 內建工具類別

此表列出代表性工具，讓你能辨識介面。它不是完整的政策參考。若要查看精確群組、
預設值，以及允許/拒絕語意，請使用[工具與自訂供應商](/zh-TW/gateway/config-tools)。

| 類別                | 當代理需要……時使用                                                | 代表性工具                                                                                 | 接著閱讀                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 執行階段                 | 執行命令、管理程序，或使用供應商支援的 Python 分析        | `exec`、`process`、`code_execution`                                                                  | [Exec](/zh-TW/tools/exec)、[程式碼執行](/zh-TW/tools/code-execution)                                |
| 檔案                   | 讀取與變更工作區檔案                                               | `read`、`write`、`edit`、`apply_patch`                                                               | [套用修補](/zh-TW/tools/apply-patch)                                                           |
| 網頁                     | 搜尋網頁、搜尋 X 貼文，或擷取可讀頁面內容                | `web_search`、`x_search`、`web_fetch`                                                                | [網頁工具](/zh-TW/tools/web)、[網頁擷取](/zh-TW/tools/web-fetch)                                      |
| 瀏覽器                 | 操作瀏覽器工作階段                                                     | `browser`                                                                                            | [瀏覽器](/zh-TW/tools/browser)                                                                   |
| 訊息與頻道  | 傳送回覆或頻道動作                                               | `message`                                                                                            | [代理傳送](/zh-TW/tools/agent-send)                                                             |
| 工作階段與代理     | 檢查工作階段、委派工作、引導另一個執行，或回報狀態          | `sessions_*`、`subagents`、`agents_list`、`session_status`、`get_goal`、`create_goal`、`update_goal` | [目標](/zh-TW/tools/goal)、[子代理](/zh-TW/tools/subagents)、[工作階段工具](/zh-TW/concepts/session-tool) |
| 自動化              | 排程工作或回應背景事件                                 | `cron`、`heartbeat_respond`                                                                          | [自動化](/zh-TW/automation)                                                                   |
| 閘道與節點       | 檢查閘道狀態或已配對的目標裝置                                | `gateway`、`nodes`                                                                                   | [閘道設定](/zh-TW/gateway/configuration)、[節點](/zh-TW/nodes)                            |
| 媒體                   | 分析、生成或朗讀媒體                                             | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                 | [媒體概覽](/zh-TW/tools/media-overview)                                                     |
| 大型 OpenClaw 目錄 | 搜尋並呼叫許多符合資格的工具，而不將每個結構描述傳送給模型 | `tool_search_code`、`tool_search`、`tool_describe`                                                   | [工具搜尋](/zh-TW/tools/tool-search)                                                           |

<Note>
工具搜尋是實驗性的 OpenClaw 代理介面。Codex 測試框架執行會使用
Codex 原生程式碼模式、原生工具搜尋、延遲動態工具，以及巢狀工具呼叫，
而不是 `tools.toolSearch`。
</Note>

## 外掛提供的工具

外掛可以註冊額外工具。外掛作者透過 `api.registerTool(...)` 與清單的
`contracts.tools` 連接工具；合約詳細資訊請使用[外掛 SDK](/zh-TW/plugins/sdk-overview)
與[外掛清單](/zh-TW/plugins/manifest)。

常見的外掛提供工具包括：

- [差異](/zh-TW/tools/diffs)，用於呈現檔案與 Markdown 差異
- [LLM 任務](/zh-TW/tools/llm-task)，用於僅限 JSON 的工作流程步驟
- [Lobster](/zh-TW/tools/lobster)，用於具備可恢復核准的型別化工作流程
- [Tokenjuice](/zh-TW/tools/tokenjuice)，用於壓縮嘈雜的 `exec` 與 `bash` 工具
  輸出
- [工具搜尋](/zh-TW/tools/tool-search)，用於探索並呼叫大型工具目錄，而不將每個結構描述放入提示
- [Canvas](/zh-TW/plugins/reference/canvas)，用於節點 Canvas 控制與 A2UI
  呈現

## 設定存取權與核准

工具政策會在模型呼叫之前強制執行。如果政策移除某個工具，模型在該回合不會收到該工具的結構描述。
一次執行可能因為全域設定、個別代理設定、頻道政策、供應商限制、沙箱規則、
頻道/執行階段政策，或外掛可用性而失去工具。

- [工具與自訂供應商](/zh-TW/gateway/config-tools)記錄工具設定檔、
  允許/拒絕清單、供應商特定限制、迴圈偵測，以及
  供應商支援的工具設定。
- [Exec 核准](/zh-TW/tools/exec-approvals)記錄主機命令核准
  政策。
- [提升權限 exec](/zh-TW/tools/elevated)記錄沙箱外的受控執行。
- [沙箱、工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
  說明哪一層控制檔案與程序存取。
- [個別代理沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)
  記錄委派執行的代理特定限制。

## 擴充功能

依照你需要 OpenClaw 執行的工作選擇擴充路徑：

- 使用[外掛](/zh-TW/tools/plugin)安裝或管理現有外掛。
- 使用[建置外掛](/zh-TW/plugins/building-plugins)建置新的整合、供應商、頻道、工具或鉤子。
- 使用 [Skills](/zh-TW/tools/skills) 與[建立 Skills](/zh-TW/tools/creating-skills)新增或調整可重複使用的代理指令。
- 當你需要實作合約時，使用[外掛 SDK](/zh-TW/plugins/sdk-overview)與
  [外掛清單](/zh-TW/plugins/manifest)。

## 疑難排解遺失的工具

如果模型看不到或無法呼叫某個工具，請先從目前回合的有效政策開始：

1. 檢查[工具與自訂供應商](/zh-TW/gateway/config-tools)中的作用中設定檔、
   `tools.allow` 與 `tools.deny`。
2. 檢查[工具與自訂供應商](/zh-TW/gateway/config-tools)中的供應商特定限制，
   並確認所選[模型供應商](/zh-TW/concepts/model-providers)支援該工具形狀。
3. 使用[沙箱、工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
   與[提升權限 exec](/zh-TW/tools/elevated)檢查頻道權限、沙箱狀態與提升權限存取。
4. 檢查擁有該工具的外掛是否已在[外掛](/zh-TW/tools/plugin)中安裝並啟用。
5. 對於委派執行，請檢查[個別代理沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)中的個別代理限制。
6. 對於大型 OpenClaw 目錄，請確認該執行使用直接工具暴露還是[工具搜尋](/zh-TW/tools/tool-search)。

## 相關

- [自動化](/zh-TW/automation) 用於排程、任務、心跳偵測、承諾、鉤子、
  固定指令和 Task Flow
- [代理](/zh-TW/concepts/agent) 用於代理模型、工作階段、記憶和
  多代理協調
- [工具與自訂提供者](/zh-TW/gateway/config-tools) 用於標準工具
  政策參考
- [外掛](/zh-TW/tools/plugin) 用於外掛安裝與管理
- [外掛 SDK](/zh-TW/plugins/sdk-overview) 用於外掛作者參考
- [Skills](/zh-TW/tools/skills) 用於技能載入順序、閘門控管和設定
- [技能工作坊](/zh-TW/tools/skill-workshop) 用於產生並經審查的技能
  建立
- [工具搜尋](/zh-TW/tools/tool-search) 用於精簡的 OpenClaw 工具目錄
  探索
