---
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 您需要設定、允許或拒絕工具
    - 您正在內建工具、Skills 和 Plugin 之間做選擇
summary: OpenClaw 工具與 Plugin 概觀：代理程式能做什麼，以及如何擴充它
title: 工具與 Plugin
x-i18n:
    generated_at: "2026-05-03T21:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

OpenClaw 的工具：模型可呼叫的功能，用於執行實際工作

代理除了產生文字以外所做的一切，都是透過**工具**完成。
工具讓代理能夠讀取檔案、執行命令、瀏覽網頁、傳送
訊息，並與裝置互動。

## 工具、Skills 和 Plugin

OpenClaw 有三個相互配合的層：

<Steps>
  <Step title="Tools are what the agent calls">
    工具是代理可以叫用的型別化函式（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 內建一組**內建工具**，
    Plugin 也可以註冊其他工具。

    代理會將工具視為傳送給模型 API 的結構化函式定義。

  </Step>

  <Step title="Skills teach the agent when and how">
    Skill 是一個注入系統提示詞的 Markdown 檔案（`SKILL.md`）。
    Skills 會提供代理背景脈絡、限制，以及有效使用工具的逐步指引。
    Skills 可以位於你的工作區、共享資料夾，或隨 Plugin 一起提供。

    [Skills 參考](/zh-TW/tools/skills) | [建立 Skills](/zh-TW/tools/creating-skills)

  </Step>

  <Step title="Plugins package everything together">
    Plugin 是可以註冊任意能力組合的套件：
    頻道、模型供應商、工具、Skills、語音、即時轉錄、
    即時語音、媒體理解、影像生成、影片生成、
    網頁擷取、網頁搜尋等等。有些 Plugin 是**核心**（隨
    OpenClaw 一起提供），其他則是**外部**（由社群發佈到 npm）。

    [安裝並設定 Plugin](/zh-TW/tools/plugin) | [建置自己的 Plugin](/zh-TW/plugins/building-plugins)

  </Step>
</Steps>

## 內建工具

這些工具隨 OpenClaw 一起提供，不需要安裝任何 Plugin 即可使用：

| 工具                                       | 功能                                                                  | 頁面                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 執行 shell 命令，管理背景程序                                        | [Exec](/zh-TW/tools/exec), [Exec Approvals](/zh-TW/tools/exec-approvals) |
| `code_execution`                           | 執行沙盒化的遠端 Python 分析                                          | [Code Execution](/zh-TW/tools/code-execution)                      |
| `browser`                                  | 控制 Chromium 瀏覽器（導覽、點擊、截圖）                              | [Browser](/zh-TW/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 搜尋網頁、搜尋 X 貼文、擷取頁面內容                                   | [Web](/zh-TW/tools/web), [Web Fetch](/zh-TW/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 工作區中的檔案 I/O                                                    |                                                              |
| `apply_patch`                              | 多區塊檔案修補                                                        | [Apply Patch](/zh-TW/tools/apply-patch)                            |
| `message`                                  | 跨所有頻道傳送訊息                                                    | [Agent Send](/zh-TW/tools/agent-send)                              |
| `canvas`                                   | 驅動 node Canvas（呈現、求值、快照）                                  |                                                              |
| `nodes`                                    | 探索並指定已配對裝置                                                  |                                                              |
| `cron` / `gateway`                         | 管理排程工作；檢查、修補、重新啟動或更新 Gateway                      |                                                              |
| `image` / `image_generate`                 | 分析或生成影像                                                        | [Image Generation](/zh-TW/tools/image-generation)                  |
| `music_generate`                           | 生成音樂曲目                                                          | [Music Generation](/zh-TW/tools/music-generation)                  |
| `video_generate`                           | 生成影片                                                              | [Video Generation](/zh-TW/tools/video-generation)                  |
| `tts`                                      | 一次性文字轉語音轉換                                                  | [TTS](/zh-TW/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 工作階段管理、狀態，以及子代理協調                                    | [子代理](/zh-TW/tools/subagents)                                   |
| `session_status`                           | 輕量級 `/status` 風格回讀與工作階段模型覆寫                           | [工作階段工具](/zh-TW/concepts/session-tool)                      |

處理影像工作時，使用 `image` 進行分析，使用 `image_generate` 進行生成或編輯。如果你指定 `openai/*`、`google/*`、`fal/*` 或其他非預設影像供應商，請先設定該供應商的驗證/API 金鑰。

處理音樂工作時，使用 `music_generate`。如果你指定 `google/*`、`minimax/*` 或其他非預設音樂供應商，請先設定該供應商的驗證/API 金鑰。

處理影片工作時，使用 `video_generate`。如果你指定 `qwen/*` 或其他非預設影片供應商，請先設定該供應商的驗證/API 金鑰。

對於工作流程驅動的音訊生成，當 ComfyUI 等 Plugin 註冊它時，請使用
`music_generate`。這與文字轉語音的 `tts` 不同。

`session_status` 是工作階段群組中的輕量狀態/回讀工具。
它可回答目前工作階段的 `/status` 風格問題，並可
選擇性設定每個工作階段的模型覆寫；`model=default` 會清除該
覆寫。與 `/status` 一樣，它可以從最新轉錄使用量項目回填稀疏的權杖/快取計數器，以及
作用中的執行階段模型標籤。

`gateway` 是僅限擁有者使用的 Gateway 操作執行階段工具：

- `config.schema.lookup`：在編輯前查詢一個路徑範圍內的設定子樹
- `config.get`：取得目前的設定快照 + 雜湊
- `config.patch`：進行部分設定更新並重新啟動
- `config.apply`：僅用於完整設定替換
- `update.run`：明確執行自我更新 + 重新啟動

對於部分變更，優先使用 `config.schema.lookup`，再使用 `config.patch`。只有在你有意替換整個設定時，
才使用 `config.apply`。
如需更完整的設定文件，請閱讀[設定](/zh-TW/gateway/configuration)和
[設定參考](/zh-TW/gateway/configuration-reference)。
此工具也會拒絕變更 `tools.exec.ask` 或 `tools.exec.security`；
舊版 `tools.bash.*` 別名會正規化為相同受保護的 exec 路徑。

### Plugin 提供的工具

Plugin 可以註冊其他工具。一些範例：

- [差異](/zh-TW/tools/diffs) — 差異檢視器與轉譯器
- [LLM 任務](/zh-TW/tools/llm-task) — 用於結構化輸出的純 JSON LLM 步驟
- [Lobster](/zh-TW/tools/lobster) — 具備可恢復核准的型別化工作流程執行階段
- [音樂生成](/zh-TW/tools/music-generation) — 由工作流程支援的供應商共用的 `music_generate` 工具
- [OpenProse](/zh-TW/prose) — Markdown 優先的工作流程協調
- [Tokenjuice](/zh-TW/tools/tokenjuice) — 壓縮冗長的 `exec` 和 `bash` 工具結果

Plugin 工具仍然使用 `api.registerTool(...)` 編寫，並在
Plugin manifest 的 `contracts.tools` 清單中宣告。OpenClaw 會在探索期間擷取已驗證的
工具描述元，並依 Plugin 來源與合約快取，因此
後續工具規劃可以略過 Plugin 執行階段載入。工具執行仍會載入
擁有該工具的 Plugin，並呼叫即時註冊的實作。

## 工具設定

### 允許與拒絕清單

透過設定中的 `tools.allow` / `tools.deny` 控制代理可以呼叫哪些工具。
拒絕一律優先於允許。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

當明確的允許清單解析後沒有任何可呼叫工具時，OpenClaw 會以封閉方式失敗。
例如，`tools.allow: ["query_db"]` 只有在已載入的 Plugin 實際
註冊 `query_db` 時才有效。如果沒有內建工具、Plugin 或 bundled MCP 工具符合
允許清單，執行會在模型呼叫前停止，而不是繼續成為
可能幻覺工具結果的純文字執行。

### 工具設定檔

`tools.profile` 會在套用 `allow`/`deny` 之前設定基礎允許清單。
每個代理覆寫：`agents.list[].tools.profile`。

| 設定檔      | 包含內容                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 所有核心與選用 Plugin 工具；提供更廣泛命令/控制存取的未受限基準                                                                                 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | 僅 `session_status`                                                                                                                               |

<Note>
`tools.profile: "messaging"` 針對以頻道為重點的
代理刻意保持狹窄。它排除了較廣泛的命令/控制工具，例如檔案系統、執行階段、
瀏覽器、canvas、nodes、cron 和 Gateway 控制。使用 `tools.profile: "full"`
作為更廣泛命令/控制存取的未受限基準，然後在需要時
用 `tools.allow` / `tools.deny` 修剪
存取權。
</Note>

`coding` 包含輕量網頁工具（`web_search`、`web_fetch`、`x_search`），
但不包含完整的瀏覽器控制工具。瀏覽器自動化可以驅動真實
工作階段和已登入的設定檔，因此請使用
`tools.alsoAllow: ["browser"]` 或每個代理的
`agents.list[].tools.alsoAllow: ["browser"]` 明確加入它。

<Note>
在限制性設定檔（`messaging`、`minimal`）下設定 `tools.exec` 或 `tools.fs`，不會隱含擴大該設定檔的允許清單。當你想讓限制性設定檔使用那些已設定區段時，請加入明確的 `tools.alsoAllow` 項目（例如 exec 使用 `["exec", "process"]`，或 fs 使用 `["read", "write", "edit"]`）。當設定區段存在但沒有相符的 `alsoAllow` 授權時，OpenClaw 會記錄啟動警告。
</Note>

`coding` 和 `messaging` 設定檔也允許在
Plugin key `bundle-mcp` 下設定的 bundle MCP 工具。當你
想讓設定檔保留其一般內建工具但隱藏所有已設定的 MCP 工具時，請加入 `tools.deny: ["bundle-mcp"]`。
`minimal` 設定檔不包含 bundle MCP 工具。

範例（預設使用最廣泛的工具介面）：

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
| `group:openclaw`   | 所有內建 OpenClaw 工具（不含 Plugin 工具）                                                               |

`sessions_history` 會回傳有界且經安全性篩選的召回檢視。它會從助理文字中移除
thinking 標籤、`<relevant-memories>` 框架、純文字工具呼叫 XML
酬載（包含 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、
已降級的工具呼叫框架、洩漏的 ASCII/全形模型控制
權杖，以及格式錯誤的 MiniMax 工具呼叫 XML，然後套用
遮罩/截斷和可能的超大型資料列預留位置，而不是作為原始逐字稿傾印。

### 供應商特定限制

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
