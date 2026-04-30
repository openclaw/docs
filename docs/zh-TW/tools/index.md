---
read_when:
    - 您想了解 OpenClaw 提供哪些工具
    - 你需要設定、允許或拒絕工具
    - 你正在內建工具、Skills 與 Plugin 之間做選擇
summary: OpenClaw 工具與 Plugin 概覽：代理程式能做什麼，以及如何擴充它
title: 工具與 Plugin
x-i18n:
    generated_at: "2026-04-30T03:45:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

代理在產生文字以外所做的一切，都透過**工具**完成。
工具讓代理能讀取檔案、執行命令、瀏覽網頁、傳送
訊息，並與裝置互動。

## 工具、Skills 與 Plugin

OpenClaw 有三個協同運作的層次：

<Steps>
  <Step title="工具是代理呼叫的項目">
    工具是代理可以叫用的型別化函式（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 隨附一組**內建工具**，
    Plugin 可以註冊額外工具。

    代理會將工具視為傳送給模型 API 的結構化函式定義。

  </Step>

  <Step title="Skills 教導代理何時以及如何使用">
    skill 是注入系統提示中的 markdown 檔案（`SKILL.md`）。
    Skills 會提供代理有效使用工具所需的脈絡、限制與逐步指引。
    Skills 可以位於你的工作區、共享資料夾中，或隨 Plugin 一起提供。

    [Skills 參考](/zh-TW/tools/skills) | [建立 Skills](/zh-TW/tools/creating-skills)

  </Step>

  <Step title="Plugin 將所有內容封裝在一起">
    Plugin 是可以註冊任意能力組合的套件：
    頻道、模型供應商、工具、Skills、語音、即時轉錄、
    即時語音、媒體理解、圖像生成、影片生成、
    網頁擷取、網頁搜尋等。有些 Plugin 是**核心**（隨 OpenClaw
    提供），其他則是**外部**（由社群發布在 npm 上）。

    [安裝並設定 Plugin](/zh-TW/tools/plugin) | [建置你自己的 Plugin](/zh-TW/plugins/building-plugins)

  </Step>
</Steps>

## 內建工具

這些工具隨 OpenClaw 提供，不需安裝任何 Plugin 即可使用：

| 工具                                       | 功能                                                                  | 頁面                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 執行 shell 命令、管理背景程序                                        | [Exec](/zh-TW/tools/exec), [Exec 核准](/zh-TW/tools/exec-approvals) |
| `code_execution`                           | 執行沙盒化遠端 Python 分析                                           | [程式碼執行](/zh-TW/tools/code-execution)                      |
| `browser`                                  | 控制 Chromium 瀏覽器（導覽、點擊、截圖）                             | [瀏覽器](/zh-TW/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 搜尋網頁、搜尋 X 貼文、擷取頁面內容                                  | [網頁](/zh-TW/tools/web), [網頁擷取](/zh-TW/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 工作區中的檔案 I/O                                                    |                                                              |
| `apply_patch`                              | 多區塊檔案修補                                                       | [套用修補](/zh-TW/tools/apply-patch)                            |
| `message`                                  | 跨所有頻道傳送訊息                                                   | [代理傳送](/zh-TW/tools/agent-send)                              |
| `canvas`                                   | 驅動 Node Canvas（present、eval、snapshot）                           |                                                              |
| `nodes`                                    | 探索並指定已配對裝置                                                 |                                                              |
| `cron` / `gateway`                         | 管理排程工作；檢查、修補、重新啟動或更新 Gateway                     |                                                              |
| `image` / `image_generate`                 | 分析或生成圖像                                                       | [圖像生成](/zh-TW/tools/image-generation)                  |
| `music_generate`                           | 生成音樂曲目                                                         | [音樂生成](/zh-TW/tools/music-generation)                  |
| `video_generate`                           | 生成影片                                                             | [影片生成](/zh-TW/tools/video-generation)                  |
| `tts`                                      | 一次性文字轉語音轉換                                                 | [TTS](/zh-TW/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 工作階段管理、狀態與子代理編排                                       | [子代理](/zh-TW/tools/subagents)                               |
| `session_status`                           | 輕量的 `/status` 風格讀回與工作階段模型覆寫                          | [工作階段工具](/zh-TW/concepts/session-tool)                      |

處理圖像時，使用 `image` 進行分析，使用 `image_generate` 進行生成或編輯。如果你指定 `openai/*`、`google/*`、`fal/*` 或其他非預設圖像供應商，請先設定該供應商的驗證/API 金鑰。

處理音樂時，使用 `music_generate`。如果你指定 `google/*`、`minimax/*` 或其他非預設音樂供應商，請先設定該供應商的驗證/API 金鑰。

處理影片時，使用 `video_generate`。如果你指定 `qwen/*` 或其他非預設影片供應商，請先設定該供應商的驗證/API 金鑰。

對於工作流程驅動的音訊生成，當 ComfyUI 等 Plugin 註冊
`music_generate` 時，請使用它。這與文字轉語音的 `tts` 是分開的。

`session_status` 是 sessions 群組中的輕量狀態/讀回工具。
它會回答目前工作階段中 `/status` 風格的問題，並可
選擇性設定每個工作階段的模型覆寫；`model=default` 會清除該
覆寫。與 `/status` 一樣，它可以從最新逐字稿用量項目回填稀疏的 token/快取計數器，以及
作用中執行階段模型標籤。

`gateway` 是 Gateway 操作的僅限擁有者執行階段工具：

- `config.schema.lookup` 用於編輯前的一個路徑範圍設定子樹
- `config.get` 用於目前設定快照 + 雜湊
- `config.patch` 用於部分設定更新並重新啟動
- `config.apply` 僅用於完整設定取代
- `update.run` 用於明確自我更新 + 重新啟動

對於部分變更，優先使用 `config.schema.lookup`，再使用 `config.patch`。只有在你有意取代整個設定時，才使用
`config.apply`。
如需更廣泛的設定文件，請閱讀[設定](/zh-TW/gateway/configuration)與
[設定參考](/zh-TW/gateway/configuration-reference)。
此工具也會拒絕變更 `tools.exec.ask` 或 `tools.exec.security`；
舊版 `tools.bash.*` 別名會正規化為相同受保護的 exec 路徑。

### Plugin 提供的工具

Plugin 可以註冊額外工具。一些範例：

- [差異](/zh-TW/tools/diffs) — 差異檢視器與轉譯器
- [LLM 任務](/zh-TW/tools/llm-task) — 用於結構化輸出的僅 JSON LLM 步驟
- [Lobster](/zh-TW/tools/lobster) — 具可恢復核准的型別化工作流程執行階段
- [音樂生成](/zh-TW/tools/music-generation) — 由工作流程支援供應商共用的 `music_generate` 工具
- [OpenProse](/zh-TW/prose) — markdown 優先的工作流程編排
- [Tokenjuice](/zh-TW/tools/tokenjuice) — 壓縮嘈雜的 `exec` 與 `bash` 工具結果

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

當明確允許清單解析不到任何可呼叫工具時，OpenClaw 會以關閉狀態失敗。
例如，`tools.allow: ["query_db"]` 只有在已載入的 Plugin 確實
註冊 `query_db` 時才會運作。如果沒有內建、Plugin 或捆綁的 MCP 工具符合
允許清單，執行會在模型呼叫前停止，而不是繼續成為
可能幻覺出工具結果的純文字執行。

### 工具設定檔

`tools.profile` 會先設定基礎允許清單，再套用 `allow`/`deny`。
每個代理覆寫：`agents.list[].tools.profile`。

| 設定檔      | 包含內容                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 較廣泛命令/控制存取的無限制基準；與未設定 `tools.profile` 相同                                                   |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                         |
| `minimal`   | 僅 `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` 對於以頻道為重點的
代理有意保持狹窄。它排除了更廣泛的命令/控制工具，例如檔案系統、執行階段、
瀏覽器、canvas、nodes、Cron 與 Gateway 控制。使用 `tools.profile: "full"`
作為較廣泛命令/控制存取的無限制基準，然後在需要時使用
`tools.allow` / `tools.deny` 修剪存取權。
</Note>

`coding` 包含輕量網頁工具（`web_search`、`web_fetch`、`x_search`），
但不包含完整的瀏覽器控制工具。瀏覽器自動化可以驅動真實
工作階段與已登入的設定檔，因此請透過
`tools.alsoAllow: ["browser"]` 或每個代理的
`agents.list[].tools.alsoAllow: ["browser"]` 明確加入它。

`coding` 與 `messaging` 設定檔也允許已設定的捆綁 MCP 工具，
Plugin 金鑰為 `bundle-mcp`。當你希望
設定檔保留其一般內建項目、但隱藏所有已設定 MCP 工具時，請加入 `tools.deny: ["bundle-mcp"]`。
`minimal` 設定檔不包含捆綁 MCP 工具。

範例（預設為最廣泛的工具介面）：

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
| `group:runtime`    | exec, process, code_execution（`bash` 可作為 `exec` 的別名）                                              |
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

`sessions_history` 會傳回有界且經安全篩選的回憶檢視。它會從助理文字中移除
思考標籤、`<relevant-memories>` 架構、純文字工具呼叫 XML
承載內容（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊）、
降級的工具呼叫架構、洩漏的 ASCII／全形模型控制
權杖，以及格式錯誤的 MiniMax 工具呼叫 XML，然後套用
遮蔽／截斷，以及可能的超大列預留位置，而不是充當原始逐字記錄傾印。

### 供應商專屬限制

使用 `tools.byProvider` 針對特定供應商限制工具，而不
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
