---
doc-schema-version: 1
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你正在內建工具、Skills 與外掛之間做選擇
    - 你需要適合用於工具政策、自動化或代理協調的文件入口點
summary: OpenClaw 工具、Skills 與外掛概覽：代理程式可呼叫的項目及其擴充方式
title: 概覽
x-i18n:
    generated_at: "2026-07-22T10:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 45745bd5f2008a84cb6c4c1c9840073bfa8a9c40a0ff65bfefc682c5d99af09b
    source_path: tools/index.md
    workflow: 16
---

使用此頁面選擇合適的功能介面。**工具**是可呼叫的動作，**Skills** 教導代理程式如何工作，而**外掛**則新增工具、供應商、頻道、掛鉤及封裝式 Skills 等執行階段功能。

這是概覽與導覽頁面。如需完整的工具政策、預設值、群組成員資格、供應商限制及設定欄位，請參閱[工具與自訂供應商](/zh-TW/gateway/config-tools)。

## 從這裡開始

對大多數代理程式而言，請先使用內建工具類別，然後僅在代理程式應看到較少工具或需要明確的主機存取權時調整政策。

| 如果你需要……                                 | 請先使用                                       | 接著閱讀                                                                                                                                                  |
| -------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 讓代理程式運用現有功能                       | [內建工具](#built-in-tool-categories)          | [工具類別](#built-in-tool-categories)                                                                                                                     |
| 控制代理程式可呼叫的項目                     | [工具政策](#configure-access-and-approvals)    | [工具與自訂供應商](/zh-TW/gateway/config-tools)                                                                                                                 |
| 教導代理程式工作流程                         | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/zh-TW/tools/skills)、[建立 Skills](/zh-TW/tools/creating-skills)、[Skill 工作坊](/zh-TW/tools/skill-workshop)及[自我學習](/zh-TW/tools/self-learning)                    |
| 新增整合或執行階段介面                       | [外掛](#extend-capabilities)                   | [外掛](/zh-TW/tools/plugin)及[建置外掛](/zh-TW/plugins/building-plugins)                                                                                              |
| 稍後或在背景執行工作                         | [自動化](/zh-TW/automation)                          | [自動化概覽](/zh-TW/automation)                                                                                                                                 |
| 協調多個代理程式或控制框架                   | [子代理程式](/zh-TW/tools/subagents)                 | [ACP 代理程式](/zh-TW/tools/acp-agents)及[代理程式傳送](/zh-TW/tools/agent-send)                                                                                      |
| 從程式碼協調並行代理程式                     | [群集](/zh-TW/tools/swarm)                           | [程式碼模式](/zh-TW/tools/code-mode)及[子代理程式](/zh-TW/tools/subagents)                                                                                            |
| 搜尋大型 OpenClaw 工具目錄                   | [工具搜尋](/zh-TW/tools/tool-search)                 | [工具搜尋](/zh-TW/tools/tool-search)                                                                                                                            |
| 在一個精簡程式中結合多個工具                 | [程式碼模式](/zh-TW/tools/code-mode)                 | [程式碼模式](/zh-TW/tools/code-mode)                                                                                                                            |

## 選擇工具、Skills 或外掛

<Steps>
  <Step title="當代理程式需要採取動作時使用工具">
    工具是代理程式可呼叫的具型別函式，例如 `exec`、`browser`、
    `web_search`、`message` 或 `image_generate`。當代理程式
    需要讀取資料、變更檔案、傳送訊息、呼叫供應商或
    操作其他系統時，請使用工具。可見的工具會以結構化
    函式定義傳送至模型。

    模型只會看到通過目前設定檔、允許／拒絕
    政策、供應商限制、沙箱狀態、頻道權限及
    外掛可用性篩選的工具。

  </Step>

  <Step title="當代理程式需要指示時使用 Skill">
    Skill 是載入代理程式提示詞中的 `SKILL.md` 指示套件。當
    代理程式已具備所需工具，但需要
    可重複使用的工作流程、審查準則、命令順序或操作
    限制時，請使用 Skill。

    Skills 可位於工作區、共用 Skill 目錄、受管理的 OpenClaw
    Skill 根目錄或外掛套件中。

    [Skills](/zh-TW/tools/skills) | [Skill 工作坊](/zh-TW/tools/skill-workshop) | [自我學習](/zh-TW/tools/self-learning) | [建立 Skills](/zh-TW/tools/creating-skills) | [Skills 設定](/zh-TW/tools/skills-config)

  </Step>

  <Step title="當 OpenClaw 需要新功能時使用外掛">
    外掛可新增工具、Skills、頻道、模型供應商、語音、
    即時語音、媒體生成、網頁搜尋、網頁擷取、掛鉤及其他
    執行階段功能。當功能包含程式碼、
    認證資訊、生命週期掛鉤、資訊清單中繼資料或可安裝的
    封裝時，請使用外掛。現有外掛可從 ClawHub、npm、git、
    本機目錄或封存檔安裝。

    [安裝及設定外掛](/zh-TW/tools/plugin) | [建置外掛](/zh-TW/plugins/building-plugins) | [外掛 SDK](/zh-TW/plugins/sdk-overview)

  </Step>
</Steps>

## 內建工具類別

此表列出代表性工具，以便你識別相關介面。這
不是完整的政策參考。如需確切群組、預設值及允許／拒絕
語意，請參閱[工具與自訂供應商](/zh-TW/gateway/config-tools)。

| 類別                    | 適用於代理程式需要……                                                                         | 代表性工具                                                                                                          | 接著閱讀                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 執行階段                | 執行命令、管理程序或使用供應商支援的 Python 分析                                             | `exec`、`process`、`terminal`、`code_execution`                                     | [執行](/zh-TW/tools/exec)、[控制介面終端機](/zh-TW/web/control-ui#operator-terminal)、[程式碼執行](/zh-TW/tools/code-execution)                |
| 檔案                    | 讀取及變更工作區檔案                                                                         | `read`、`write`、`edit`、`apply_patch`                                     | [套用修補程式](/zh-TW/tools/apply-patch)                                                                                         |
| 人工輸入                | 暫停以等待由使用者決定的結構化決策                                                           | `ask_user`                                                                                                  | [詢問使用者](/zh-TW/tools/ask-user)                                                                                              |
| 網頁                    | 搜尋網頁、搜尋 X 貼文或擷取可閱讀的頁面內容                                                  | `web_search`、`x_search`、`web_fetch`                                                         | [網頁工具](/zh-TW/tools/web)、[網頁擷取](/zh-TW/tools/web-fetch)                                                                       |
| 瀏覽器                  | 操作瀏覽器工作階段                                                                           | `browser`                                                                                                  | [瀏覽器](/zh-TW/tools/browser)                                                                                                   |
| 操作介面                | 排列已連線的控制介面窗格、面板及導覽                                                         | `screen`                                                                                                  | [畫面](/zh-TW/tools/screen)                                                                                                      |
| 訊息與頻道              | 傳送回覆或頻道動作                                                                           | `message`                                                                                                  | [代理程式傳送](/zh-TW/tools/agent-send)                                                                                          |
| 工作階段與代理程式      | 檢查工作階段、委派工作、協調收集器、引導另一個執行作業或回報狀態                             | `sessions_*`、`agents_wait`、`subagents`、`agents_list`、`session_status`、`get_goal`、`create_goal`、`update_goal` | [目標](/zh-TW/tools/goal)、[群集](/zh-TW/tools/swarm)、[子代理程式](/zh-TW/tools/subagents)、[工作階段工具](/zh-TW/concepts/session-tool)            |
| 自動化                  | 排程工作或回應背景事件                                                                       | `cron`、`heartbeat_respond`                                                                              | [自動化](/zh-TW/automation)                                                                                                      |
| 閘道與節點              | 檢查閘道狀態或已配對的目標裝置                                                               | `gateway`、`nodes`                                                                              | [閘道設定](/zh-TW/gateway/configuration)、[節點](/zh-TW/nodes)                                                                          |
| 媒體                    | 分析、生成媒體或以語音朗讀                                                                   | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                 | [媒體概覽](/zh-TW/tools/media-overview)                                                                                          |
| 大型 OpenClaw 目錄      | 搜尋、呼叫及結合許多符合資格的工具，無須將每個結構描述都傳送至模型                           | `exec`、`wait`、`tool_search_code`、`tool_search`、`tool_describe`                 | [程式碼模式](/zh-TW/tools/code-mode)、[工具搜尋](/zh-TW/tools/tool-search)                                                              |

<Note>
程式碼模式和工具搜尋是實驗性的 OpenClaw 代理程式介面。Codex
控制框架執行會使用 Codex 原生程式碼模式、原生工具搜尋、延後的動態
工具及巢狀工具呼叫，而非 `tools.codeMode` 或 `tools.toolSearch`。
</Note>

## 外掛提供的工具

外掛可以註冊其他工具。外掛作者透過
`api.registerTool(...)` 及資訊清單的 `contracts.tools` 串接工具；請參閱
[外掛 SDK](/zh-TW/plugins/sdk-overview)及[外掛資訊清單](/zh-TW/plugins/manifest)
以瞭解合約詳細資料。

常見的外掛提供工具包括：

- [差異](/zh-TW/tools/diffs)，用於呈現檔案與 Markdown 差異
- [顯示小工具](/zh-TW/tools/show-widget)，用於在支援的聊天用戶端中呈現自包含的行內 SVG 與 HTML
- [螢幕](/zh-TW/tools/screen)，用於排列已連線的控制介面
- [LLM 任務](/zh-TW/tools/llm-task)，用於僅限 JSON 的工作流程步驟
- [Lobster](/zh-TW/tools/lobster)，用於具備可恢復核准機制的型別化工作流程
- [Tokenjuice](/zh-TW/tools/tokenjuice)，用於壓縮雜亂的 `exec` 與 `bash` 工具
  輸出
- [工具搜尋](/zh-TW/tools/tool-search)，用於探索並呼叫大型工具
  目錄，而不必將每個結構描述都放入提示詞
- [畫布](/zh-TW/plugins/reference/canvas)，用於節點畫布控制與 A2UI
  呈現

## 設定存取權與核准

工具政策會在模型呼叫前強制執行。如果政策移除某項工具，
模型在該回合就不會收到該工具的結構描述。一次執行可能會因
全域設定、個別代理程式設定、頻道政策、提供者
限制、沙箱規則、頻道／執行階段政策或外掛可用性而失去工具。

- [工具與自訂提供者](/zh-TW/gateway/config-tools)說明工具設定檔、
  允許／拒絕清單、提供者特定限制、迴圈偵測，以及
  提供者支援的工具設定。
- [執行核准](/zh-TW/tools/exec-approvals)說明主機命令核准
  政策。
- [提升權限執行](/zh-TW/tools/elevated)說明在沙箱外進行的受控
  執行。
- [沙箱、工具政策與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
  說明哪一層控制檔案與程序存取。
- [個別代理程式的沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)
  說明委派執行的代理程式特定限制。

## 擴充功能

依照你需要 OpenClaw 執行的工作選擇擴充方式：

- 使用[外掛](/zh-TW/tools/plugin)安裝或管理現有外掛。
- 使用[建置外掛](/zh-TW/plugins/building-plugins)建立新的整合、提供者、頻道、工具或鉤子。
- 使用 [Skills](/zh-TW/tools/skills) 與[建立 Skills](/zh-TW/tools/creating-skills)新增或調整可重複使用的代理程式指示。
- 需要實作合約時，請使用[外掛 SDK](/zh-TW/plugins/sdk-overview) 與
  [外掛資訊清單](/zh-TW/plugins/manifest)。

## 疑難排解缺少的工具

如果模型無法看到或呼叫某項工具，請先檢查目前回合的有效
政策：

1. 在[工具與自訂提供者](/zh-TW/gateway/config-tools)中檢查使用中的設定檔、`tools.allow` 與 `tools.deny`。
2. 在[工具與自訂提供者](/zh-TW/gateway/config-tools)中檢查提供者特定限制，並確認所選的[模型提供者](/zh-TW/concepts/model-providers)支援該工具
   形式。
3. 使用[沙箱、工具政策與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
   與[提升權限執行](/zh-TW/tools/elevated)，檢查頻道權限、沙箱狀態與提升權限存取。
4. 在[外掛](/zh-TW/tools/plugin)中檢查擁有該工具的外掛是否已安裝並啟用。
5. 針對委派執行，請在[個別代理程式的沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)中檢查個別代理程式限制。
6. 針對大型 OpenClaw 目錄，請確認該次執行使用的是直接公開工具、[程式碼模式](/zh-TW/tools/code-mode)或[工具搜尋](/zh-TW/tools/tool-search)。

## 相關內容

- [自動化](/zh-TW/automation)，涵蓋排程、任務、心跳偵測、鉤子、
  常設指令與 Task Flow
- [代理程式](/zh-TW/concepts/agent)，涵蓋代理程式模型、工作階段、記憶與
  多代理程式協調
- [工具與自訂提供者](/zh-TW/gateway/config-tools)，作為標準工具
  政策參考
- [外掛](/zh-TW/tools/plugin)，用於安裝與管理外掛
- [外掛 SDK](/zh-TW/plugins/sdk-overview)，作為外掛作者參考
- [Skills](/zh-TW/tools/skills)，涵蓋技能載入順序、門控與設定
- [技能工作坊](/zh-TW/tools/skill-workshop)，用於產生及審查技能
  建立作業
- [工具搜尋](/zh-TW/tools/tool-search)，用於精簡地探索 OpenClaw 工具
  目錄
- [程式碼模式](/zh-TW/tools/code-mode)，用於在隱藏的 OpenClaw 工具目錄上執行精簡的 JavaScript 或 TypeScript 工作流程
- [群集](/zh-TW/tools/swarm)，用於從程式碼模式進行結構化扇出與結果彙整
