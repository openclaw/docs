---
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 你需要設定、允許或拒絕工具
    - 您正在內建工具、Skills 和 Plugin 之間做選擇
summary: OpenClaw 工具與 Plugin 概覽：代理程式能做什麼以及如何擴充它
title: 工具與 Plugin
x-i18n:
    generated_at: "2026-05-02T21:05:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

代理除了生成文字以外所做的一切，都透過**工具**完成。
工具讓代理能讀取檔案、執行命令、瀏覽網頁、傳送
訊息，以及與裝置互動。

## 工具、Skills 與 Plugin

OpenClaw 有三個協同運作的層次：

<Steps>
  <Step title="工具是代理呼叫的項目">
    工具是代理可以叫用的型別化函式（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 內建一組**內建工具**，
    Plugin 可以註冊額外工具。

    代理會將工具視為傳送給模型 API 的結構化函式定義。

  </Step>

  <Step title="Skills 教導代理何時以及如何使用">
    Skill 是注入系統提示的 markdown 檔案（`SKILL.md`）。
    Skills 會為代理提供有效使用工具所需的情境、限制與
    逐步指引。Skills 存放在你的工作區、共享資料夾中，
    或隨 Plugin 一起提供。

    [Skills 參考](/zh-TW/tools/skills) | [建立 Skills](/zh-TW/tools/creating-skills)

  </Step>

  <Step title="Plugin 將所有內容封裝在一起">
    Plugin 是可以註冊任意能力組合的套件：
    頻道、模型供應商、工具、Skills、語音、即時轉錄、
    即時語音、媒體理解、影像生成、影片生成、
    網頁擷取、網頁搜尋，以及更多功能。有些 Plugin 是**核心**（隨
    OpenClaw 提供），其他則是**外部**（由社群發佈在 npm 上）。

    [安裝並設定 Plugin](/zh-TW/tools/plugin) | [建構你自己的 Plugin](/zh-TW/plugins/building-plugins)

  </Step>
</Steps>

## 內建工具

這些工具隨 OpenClaw 提供，不需安裝任何 Plugin 即可使用：

| 工具                                       | 功能                                                                  | 頁面                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 執行 shell 命令、管理背景程序                                         | [Exec](/zh-TW/tools/exec), [Exec 核准](/zh-TW/tools/exec-approvals) |
| `code_execution`                           | 執行沙箱化遠端 Python 分析                                            | [程式碼執行](/zh-TW/tools/code-execution)                      |
| `browser`                                  | 控制 Chromium 瀏覽器（導覽、點擊、截圖）                              | [瀏覽器](/zh-TW/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 搜尋網頁、搜尋 X 貼文、擷取頁面內容                                   | [網頁](/zh-TW/tools/web), [網頁擷取](/zh-TW/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 工作區中的檔案 I/O                                                    |                                                              |
| `apply_patch`                              | 多區塊檔案修補                                                        | [Apply Patch](/zh-TW/tools/apply-patch)                            |
| `message`                                  | 跨所有頻道傳送訊息                                                    | [代理傳送](/zh-TW/tools/agent-send)                              |
| `canvas`                                   | 驅動 Node Canvas（呈現、eval、快照）                                  |                                                              |
| `nodes`                                    | 探索並指定已配對裝置                                                  |                                                              |
| `cron` / `gateway`                         | 管理排程工作；檢查、修補、重新啟動或更新 Gateway                      |                                                              |
| `image` / `image_generate`                 | 分析或生成影像                                                        | [影像生成](/zh-TW/tools/image-generation)                  |
| `music_generate`                           | 生成音樂曲目                                                          | [音樂生成](/zh-TW/tools/music-generation)                  |
| `video_generate`                           | 生成影片                                                              | [影片生成](/zh-TW/tools/video-generation)                  |
| `tts`                                      | 一次性文字轉語音轉換                                                  | [TTS](/zh-TW/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 工作階段管理、狀態與子代理協調                                        | [子代理](/zh-TW/tools/subagents)                               |
| `session_status`                           | 輕量的 `/status` 風格回讀與工作階段模型覆寫                           | [工作階段工具](/zh-TW/concepts/session-tool)                      |

影像工作請使用 `image` 進行分析，並使用 `image_generate` 進行生成或編輯。如果你指定 `openai/*`、`google/*`、`fal/*`，或其他非預設影像供應商，請先設定該供應商的驗證/API 金鑰。

音樂工作請使用 `music_generate`。如果你指定 `google/*`、`minimax/*`，或其他非預設音樂供應商，請先設定該供應商的驗證/API 金鑰。

影片工作請使用 `video_generate`。如果你指定 `qwen/*` 或其他非預設影片供應商，請先設定該供應商的驗證/API 金鑰。

對於工作流程驅動的音訊生成，當 ComfyUI 等 Plugin 註冊
`music_generate` 時，請使用 `music_generate`。這與 `tts` 分開，後者是文字轉語音。

`session_status` 是工作階段群組中的輕量狀態/回讀工具。
它會回答目前工作階段的 `/status` 風格問題，並可
選擇性設定每個工作階段的模型覆寫；`model=default` 會清除該
覆寫。和 `/status` 一樣，它可以從最新的逐字稿用量項目中，
回填稀疏的 token/快取計數器與作用中的執行階段模型標籤。

`gateway` 是僅限擁有者使用的 Gateway 操作執行階段工具：

- 編輯前，對一個以路徑為範圍的 config 子樹使用 `config.schema.lookup`
- 對目前的 config 快照 + hash 使用 `config.get`
- 對需要重新啟動的局部 config 更新使用 `config.patch`
- 僅在完整 config 替換時使用 `config.apply`
- 對明確的自我更新 + 重新啟動使用 `update.run`

對於局部變更，優先使用 `config.schema.lookup`，接著使用 `config.patch`。只有在你有意替換整個 config 時，才使用
`config.apply`。
如需更廣泛的 config 文件，請閱讀 [Configuration](/zh-TW/gateway/configuration) 和
[Configuration reference](/zh-TW/gateway/configuration-reference)。
此工具也會拒絕變更 `tools.exec.ask` 或 `tools.exec.security`；
舊版 `tools.bash.*` 別名會正規化為相同受保護的 exec 路徑。

### Plugin 提供的工具

Plugins 可以註冊其他工具。範例如下：

- [Diffs](/zh-TW/tools/diffs) — diff 檢視器和渲染器
- [LLM Task](/zh-TW/tools/llm-task) — 用於結構化輸出的僅 JSON LLM 步驟
- [Lobster](/zh-TW/tools/lobster) — 具有可恢復核准的型別化工作流程執行階段
- [Music Generation](/zh-TW/tools/music-generation) — 由工作流程支援的提供者共用的 `music_generate` 工具
- [OpenProse](/zh-TW/prose) — 以 markdown 為優先的工作流程編排
- [Tokenjuice](/zh-TW/tools/tokenjuice) — 壓縮雜訊多的 `exec` 和 `bash` 工具結果

Plugin 工具仍然以 `api.registerTool(...)` 撰寫，並在
Plugin manifest 的 `contracts.tools` 清單中宣告。OpenClaw 會在探索期間擷取已驗證的
工具描述元，並依 Plugin 來源和合約快取，因此
後續的工具規劃可以略過 Plugin 執行階段載入。工具執行仍會載入
擁有該工具的 Plugin，並呼叫即時註冊的實作。

## 工具設定

### 允許與拒絕清單

透過 config 中的 `tools.allow` / `tools.deny` 控制代理可以呼叫哪些工具。
拒絕一律優先於允許。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

當明確的允許清單解析後沒有可呼叫工具時，OpenClaw 會以封閉方式失敗。
例如，`tools.allow: ["query_db"]` 只有在已載入的 Plugin 確實
註冊 `query_db` 時才有效。如果沒有內建工具、Plugin 或 bundled MCP 工具符合
允許清單，執行會在模型呼叫前停止，而不是繼續成為
可能幻覺出工具結果的純文字執行。

### 工具設定檔

`tools.profile` 會在套用 `allow`/`deny` 前設定基礎允許清單。
每個代理的覆寫：`agents.list[].tools.profile`。

| 設定檔      | 包含內容                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 適用於更廣泛命令/控制存取的非限制基準；等同於未設定 `tools.profile`                                                                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | 僅 `session_status`                                                                                                                               |

<Note>
`tools.profile: "messaging"` 對於專注於通道的代理是刻意收窄的。
它排除了更廣泛的命令/控制工具，例如檔案系統、執行階段、
瀏覽器、canvas、nodes、cron 和 Gateway 控制。將 `tools.profile: "full"`
作為更廣泛命令/控制存取的非限制基準，然後在需要時
使用 `tools.allow` / `tools.deny` 修剪存取權。
</Note>

`coding` 包含輕量 Web 工具（`web_search`、`web_fetch`、`x_search`），
但不包含完整的瀏覽器控制工具。瀏覽器自動化可以驅動真實
工作階段和已登入的設定檔，因此請使用
`tools.alsoAllow: ["browser"]` 或每個代理的
`agents.list[].tools.alsoAllow: ["browser"]` 明確加入。

<Note>
在限制性設定檔（`messaging`、`minimal`）下設定 `tools.exec` 或 `tools.fs`，不會隱含擴大該設定檔的允許清單。當你希望限制性設定檔使用這些已設定區段時，請加入明確的 `tools.alsoAllow` 項目（例如 exec 的 `["exec", "process"]`，或 fs 的 `["read", "write", "edit"]`）。當 config 區段存在但沒有相符的 `alsoAllow` 授權時，OpenClaw 會記錄啟動警告。
</Note>

`coding` 和 `messaging` 設定檔也允許在
Plugin key `bundle-mcp` 下設定的 bundled MCP 工具。當你
希望設定檔保留其一般內建工具但隱藏所有已設定的 MCP 工具時，請加入 `tools.deny: ["bundle-mcp"]`。
`minimal` 設定檔不包含 bundled MCP 工具。

範例（預設為最廣的工具介面）：

```json5
{
  tools: {
    profile: "full",
  },
}
```

### 工具群組

在允許/拒絕清單中使用 `group:*` 簡寫：

| 群組               | 工具                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` 可作為 `exec` 的別名）                                             |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 所有內建 OpenClaw 工具（不包含 Plugin 工具）                                                             |

`sessions_history` 會傳回有界限、經安全篩選的回憶檢視。它會從助理文字中移除
思考標籤、`<relevant-memories>` 架構、純文字工具呼叫 XML
承載內容（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、
降級的工具呼叫架構、外洩的 ASCII／全形模型控制
權杖，以及格式錯誤的 MiniMax 工具呼叫 XML，然後套用
遮蔽／截斷，並可能使用過大的列佔位符，而不是作為
原始逐字記錄傾印。

### 供應商專屬限制

使用 `tools.byProvider` 限制特定供應商的工具，而不
變更全域預設值：

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
