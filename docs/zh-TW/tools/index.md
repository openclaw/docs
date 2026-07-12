---
doc-schema-version: 1
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你正在內建工具、Skills 和外掛之間做選擇
    - 你需要找到關於工具政策、自動化或代理協調的正確文件入口點
summary: OpenClaw 工具、Skills 與外掛概覽：代理程式可呼叫的功能及其擴充方式
title: 概覽
x-i18n:
    generated_at: "2026-07-12T14:52:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

使用此頁面選擇合適的能力介面。**工具**是可呼叫的動作，**Skills** 教導代理如何工作，而**外掛**則新增工具、供應商、頻道、掛鉤及封裝式 Skills 等執行階段能力。

這是概覽與導覽頁面。如需完整的工具政策、預設值、群組成員、供應商限制及設定欄位，請參閱[工具與自訂供應商](/zh-TW/gateway/config-tools)。

## 從這裡開始

對大多數代理而言，請從內建工具類別開始，只有在代理應看到較少工具或需要明確的主機存取權時，才調整政策。

| 如果你需要……                              | 請先使用                                       | 接著閱讀                                                                                                            |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 讓代理使用現有能力執行動作                  | [內建工具](#built-in-tool-categories)          | [工具類別](#built-in-tool-categories)                                                                               |
| 控制代理可以呼叫的項目                      | [工具政策](#configure-access-and-approvals)    | [工具與自訂供應商](/zh-TW/gateway/config-tools)                                                                           |
| 教導代理工作流程                            | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/zh-TW/tools/skills)、[建立 Skills](/zh-TW/tools/creating-skills)及 [Skill 工作坊](/zh-TW/tools/skill-workshop)              |
| 新增整合或執行階段介面                      | [外掛](#extend-capabilities)                   | [外掛](/zh-TW/tools/plugin)及[建置外掛](/zh-TW/plugins/building-plugins)                                                        |
| 稍後或在背景執行工作                        | [自動化](/zh-TW/automation)                          | [自動化概覽](/zh-TW/automation)                                                                                           |
| 協調多個代理或工作框架                      | [子代理](/zh-TW/tools/subagents)                     | [ACP 代理](/zh-TW/tools/acp-agents)及[代理傳送](/zh-TW/tools/agent-send)                                                        |
| 搜尋大型 OpenClaw 工具目錄                  | [工具搜尋](/zh-TW/tools/tool-search)                 | [工具搜尋](/zh-TW/tools/tool-search)                                                                                      |

## 選擇工具、Skills 或外掛

<Steps>
  <Step title="當代理需要執行動作時使用工具">
    工具是代理可呼叫的具型別函式，例如 `exec`、`browser`、
    `web_search`、`message` 或 `image_generate`。當代理需要讀取資料、
    變更檔案、傳送訊息、呼叫供應商或操作其他系統時，請使用工具。
    可見工具會以結構化函式定義傳送給模型。

    模型只能看到經過作用中設定檔、允許／拒絕政策、供應商限制、
    沙箱狀態、頻道權限及外掛可用性篩選後保留下來的工具。

  </Step>

  <Step title="當代理需要指示時使用 Skill">
    Skill 是載入代理提示詞中的 `SKILL.md` 指示套件。當代理已具備所需工具，
    但需要可重複使用的工作流程、審查準則、命令順序或操作限制時，
    請使用 Skill。

    Skills 可位於工作區、共用 Skill 目錄、受管理的 OpenClaw Skill 根目錄
    或外掛套件中。

    [Skills](/zh-TW/tools/skills) | [Skill 工作坊](/zh-TW/tools/skill-workshop) | [建立 Skills](/zh-TW/tools/creating-skills) | [Skills 設定](/zh-TW/tools/skills-config)

  </Step>

  <Step title="當 OpenClaw 需要新能力時使用外掛">
    外掛可以新增工具、Skills、頻道、模型供應商、語音、即時語音、
    媒體生成、網頁搜尋、網頁擷取、掛鉤及其他執行階段能力。
    當該能力包含程式碼、認證資訊、生命週期掛鉤、資訊清單中繼資料
    或可安裝封裝時，請使用外掛。現有外掛可從 ClawHub、npm、git、
    本機目錄或封存檔安裝。

    [安裝及設定外掛](/zh-TW/tools/plugin) | [建置外掛](/zh-TW/plugins/building-plugins) | [外掛 SDK](/zh-TW/plugins/sdk-overview)

  </Step>
</Steps>

## 內建工具類別

下表列出代表性工具，協助你辨識可用介面。這並非完整的政策參考。
如需確切群組、預設值及允許／拒絕語意，請參閱[工具與自訂供應商](/zh-TW/gateway/config-tools)。

| 類別                    | 適用於代理需要……                                                            | 代表性工具                                                                                           | 接著閱讀                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 執行階段                | 執行命令、管理程序或使用由供應商支援的 Python 分析                            | `exec`、`process`、`code_execution`                                                                  | [Exec](/zh-TW/tools/exec)、[程式碼執行](/zh-TW/tools/code-execution)                                      |
| 檔案                    | 讀取及變更工作區檔案                                                          | `read`、`write`、`edit`、`apply_patch`                                                               | [套用修補程式](/zh-TW/tools/apply-patch)                                                            |
| 網頁                    | 搜尋網頁、搜尋 X 貼文或擷取可讀取的頁面內容                                   | `web_search`、`x_search`、`web_fetch`                                                                | [網頁工具](/zh-TW/tools/web)、[網頁擷取](/zh-TW/tools/web-fetch)                                          |
| 瀏覽器                  | 操作瀏覽器工作階段                                                            | `browser`                                                                                            | [瀏覽器](/zh-TW/tools/browser)                                                                      |
| 訊息與頻道              | 傳送回覆或頻道動作                                                            | `message`                                                                                            | [代理傳送](/zh-TW/tools/agent-send)                                                                 |
| 工作階段與代理          | 檢查工作階段、委派工作、引導另一個執行作業或回報狀態                          | `sessions_*`、`subagents`、`agents_list`、`session_status`、`get_goal`、`create_goal`、`update_goal` | [目標](/zh-TW/tools/goal)、[子代理](/zh-TW/tools/subagents)、[工作階段工具](/zh-TW/concepts/session-tool)        |
| 自動化                  | 排程工作或回應背景事件                                                        | `cron`、`heartbeat_respond`                                                                          | [自動化](/zh-TW/automation)                                                                         |
| 閘道與節點              | 檢查閘道狀態或已配對的目標裝置                                                | `gateway`、`nodes`                                                                                   | [閘道設定](/zh-TW/gateway/configuration)、[節點](/zh-TW/nodes)                                            |
| 媒體                    | 分析、生成媒體或將媒體轉為語音                                                | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                 | [媒體概覽](/zh-TW/tools/media-overview)                                                             |
| 大型 OpenClaw 目錄      | 搜尋並呼叫許多符合資格的工具，而不將每個結構描述傳送給模型                    | `tool_search_code`、`tool_search`、`tool_describe`                                                   | [工具搜尋](/zh-TW/tools/tool-search)                                                                |

<Note>
工具搜尋是實驗性的 OpenClaw 代理介面。Codex 工作框架執行作業會使用
Codex 原生程式碼模式、原生工具搜尋、延後載入的動態工具及巢狀工具呼叫，
而非 `tools.toolSearch`。
</Note>

## 外掛提供的工具

外掛可以註冊額外工具。外掛作者透過 `api.registerTool(...)`
及資訊清單的 `contracts.tools` 連接工具；如需合約詳細資訊，請參閱
[外掛 SDK](/zh-TW/plugins/sdk-overview)及[外掛資訊清單](/zh-TW/plugins/manifest)。

常見的外掛提供工具包括：

- [差異](/zh-TW/tools/diffs)，用於呈現檔案及 Markdown 差異
- [顯示小工具](/tools/show-widget)，用於在網頁聊天中顯示獨立的內嵌 SVG 與 HTML
- [LLM 任務](/zh-TW/tools/llm-task)，用於僅使用 JSON 的工作流程步驟
- [Lobster](/zh-TW/tools/lobster)，用於支援可續接核准流程的具型別工作流程
- [Tokenjuice](/zh-TW/tools/tokenjuice)，用於壓縮雜訊過多的 `exec` 及 `bash` 工具
  輸出
- [工具搜尋](/zh-TW/tools/tool-search)，用於探索及呼叫大型工具目錄，
  而不將每個結構描述放入提示詞
- [畫布](/zh-TW/plugins/reference/canvas)，用於節點 Canvas 控制及 A2UI
  算繪

## 設定存取權與核准

工具政策會在呼叫模型前強制執行。如果政策移除某項工具，模型在該回合
不會收到該工具的結構描述。執行作業可能因全域設定、個別代理設定、
頻道政策、供應商限制、沙箱規則、頻道／執行階段政策或外掛可用性而失去工具。

- [工具與自訂供應商](/zh-TW/gateway/config-tools)記載工具設定檔、
  允許／拒絕清單、供應商專屬限制、迴圈偵測及由供應商支援的工具設定。
- [Exec 核准](/zh-TW/tools/exec-approvals)記載主機命令核准政策。
- [提升權限的 Exec](/zh-TW/tools/elevated)記載沙箱外的受控執行。
- [沙箱、工具政策與提升權限的差異](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
  說明哪一層控制檔案及程序存取權。
- [個別代理的沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)
  記載委派執行作業的代理專屬限制。

## 擴充能力

根據你需要 OpenClaw 完成的工作選擇擴充途徑：

- 使用[外掛](/zh-TW/tools/plugin)安裝或管理現有外掛。
- 使用[建置外掛](/zh-TW/plugins/building-plugins)建立新的整合、供應商、頻道、工具或掛鉤。
- 使用 [Skills](/zh-TW/tools/skills)及[建立 Skills](/zh-TW/tools/creating-skills)
  新增或調整可重複使用的代理指示。
- 需要實作合約時，請使用[外掛 SDK](/zh-TW/plugins/sdk-overview)及
  [外掛資訊清單](/zh-TW/plugins/manifest)。

## 疑難排解缺少的工具

如果模型無法看到或呼叫某項工具，請先檢查目前回合的有效政策：

1. 在[工具與自訂供應商](/zh-TW/gateway/config-tools)中檢查作用中的設定檔、
   `tools.allow` 及 `tools.deny`。
2. 在[工具與自訂供應商](/zh-TW/gateway/config-tools)中檢查供應商專屬限制，
   並確認所選的[模型供應商](/zh-TW/concepts/model-providers)支援該工具形式。
3. 使用[沙箱、工具政策與提升權限的差異](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
   及[提升權限的 Exec](/zh-TW/tools/elevated)，檢查頻道權限、沙箱狀態及提升權限存取。
4. 在[外掛](/zh-TW/tools/plugin)中檢查擁有該工具的外掛是否已安裝並啟用。
5. 對於委派的執行作業，請在[個別代理的沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)
   中檢查個別代理限制。
6. 對於大型 OpenClaw 目錄，請確認執行作業使用的是直接公開工具，
   還是[工具搜尋](/zh-TW/tools/tool-search)。

## 相關內容

- [自動化](/zh-TW/automation)：涵蓋排程、任務、心跳偵測、承諾、掛鉤、
  常設指令及 Task Flow
- [代理程式](/zh-TW/concepts/agent)：涵蓋代理程式模型、工作階段、記憶及
  多代理程式協調
- [工具與自訂提供者](/zh-TW/gateway/config-tools)：提供標準工具
  政策參考
- [外掛](/zh-TW/tools/plugin)：涵蓋外掛安裝與管理
- [外掛 SDK](/zh-TW/plugins/sdk-overview)：提供外掛作者參考
- [Skills](/zh-TW/tools/skills)：涵蓋技能載入順序、門控及設定
- [技能工作坊](/zh-TW/tools/skill-workshop)：用於建立經產生及審查的技能
- [工具搜尋](/zh-TW/tools/tool-search)：用於精簡探索 OpenClaw 工具目錄
