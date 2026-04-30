---
read_when:
    - 您想了解 OpenClaw 提供哪些工具
    - 您需要設定、允許或拒絕工具
    - 你正在內建工具、Skills 和 Plugin 之間做出選擇
summary: OpenClaw 工具與 Plugin 概覽：代理程式可以做什麼，以及如何擴充它
title: 工具與 Plugin
x-i18n:
    generated_at: "2026-04-30T16:30:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

OpenClaw 的代理除了產生文字之外，所有動作都透過**工具**完成。
工具讓代理能夠讀取檔案、執行命令、瀏覽網頁、傳送訊息，以及與裝置互動。

## 工具、Skills 和 Plugin

OpenClaw 有三個彼此協作的層次：

<Steps>
  <Step title="工具是代理呼叫的項目">
    工具是代理可以叫用的型別化函式（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 隨附一組**內建工具**，
    Plugin 可以註冊額外工具。

    代理會將工具視為傳送給模型 API 的結構化函式定義。

  </Step>

  <Step title="Skills 教導代理何時以及如何操作">
    skill 是注入系統提示的 markdown 檔案（`SKILL.md`）。
    Skills 會提供代理有效使用工具所需的脈絡、限制與逐步指引。
    Skills 可以位於你的工作區、共用資料夾中，或隨 Plugin 一起提供。

    [Skills 參考](/zh-TW/tools/skills) | [建立 Skills](/zh-TW/tools/creating-skills)

  </Step>

  <Step title="Plugin 將所有項目封裝在一起">
    Plugin 是可以註冊任意能力組合的套件：
    頻道、模型提供者、工具、Skills、語音、即時轉錄、
    即時語音、媒體理解、影像生成、影片生成、
    網頁擷取、網頁搜尋等等。有些 Plugin 是**核心**（隨
    OpenClaw 提供），其他則是**外部**（由社群發布在 npm 上）。

    [安裝和設定 Plugin](/zh-TW/tools/plugin) | [建置你自己的 Plugin](/zh-TW/plugins/building-plugins)

  </Step>
</Steps>

## 內建工具

這些工具隨 OpenClaw 提供，不需要安裝任何 Plugin 即可使用：

| 工具                                       | 功能                                                                  | 頁面                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 執行 shell 命令、管理背景程序                                         | [Exec](/zh-TW/tools/exec), [Exec Approvals](/zh-TW/tools/exec-approvals) |
| `code_execution`                           | 執行沙盒化遠端 Python 分析                                            | [Code Execution](/zh-TW/tools/code-execution)                      |
| `browser`                                  | 控制 Chromium 瀏覽器（導覽、點擊、螢幕截圖）                         | [Browser](/zh-TW/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 搜尋網頁、搜尋 X 貼文、擷取頁面內容                                  | [Web](/zh-TW/tools/web), [Web Fetch](/zh-TW/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 工作區中的檔案 I/O                                                    |                                                              |
| `apply_patch`                              | 多區塊檔案修補                                                       | [Apply Patch](/zh-TW/tools/apply-patch)                            |
| `message`                                  | 跨所有頻道傳送訊息                                                    | [Agent Send](/zh-TW/tools/agent-send)                              |
| `canvas`                                   | 驅動 node Canvas（present、eval、snapshot）                           |                                                              |
| `nodes`                                    | 探索並指定已配對裝置                                                  |                                                              |
| `cron` / `gateway`                         | 管理排程工作；檢查、修補、重新啟動或更新 Gateway                     |                                                              |
| `image` / `image_generate`                 | 分析或生成影像                                                        | [Image Generation](/zh-TW/tools/image-generation)                  |
| `music_generate`                           | 生成音樂曲目                                                          | [Music Generation](/zh-TW/tools/music-generation)                  |
| `video_generate`                           | 生成影片                                                              | [Video Generation](/zh-TW/tools/video-generation)                  |
| `tts`                                      | 一次性文字轉語音轉換                                                  | [TTS](/zh-TW/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 工作階段管理、狀態與子代理編排                                        | [Sub-agents](/zh-TW/tools/subagents)                               |
| `session_status`                           | 輕量級 `/status` 風格回讀與工作階段模型覆寫                          | [Session Tools](/zh-TW/concepts/session-tool)                      |

影像工作請使用 `image` 進行分析，使用 `image_generate` 進行生成或編輯。如果你指定 `openai/*`、`google/*`、`fal/*` 或其他非預設影像提供者，請先設定該提供者的 auth/API key。

音樂工作請使用 `music_generate`。如果你指定 `google/*`、`minimax/*` 或其他非預設音樂提供者，請先設定該提供者的 auth/API key。

影片工作請使用 `video_generate`。如果你指定 `qwen/*` 或其他非預設影片提供者，請先設定該提供者的 auth/API key。

對於工作流程驅動的音訊生成，當 ComfyUI 之類的 Plugin 註冊
`music_generate` 時請使用它。這與文字轉語音的 `tts` 分開。

`session_status` 是工作階段群組中的輕量級狀態/回讀工具。
它會回答關於目前工作階段的 `/status` 風格問題，並且可以
選擇性設定每個工作階段的模型覆寫；`model=default` 會清除該
覆寫。與 `/status` 類似，它可以從最新 transcript usage 項目
回填稀疏的 token/cache 計數器，以及作用中執行階段模型標籤。

`gateway` 是僅限擁有者使用的 Gateway 作業執行階段工具：

- `config.schema.lookup` 用於在編輯前查詢一個以路徑為範圍的設定子樹
- `config.get` 用於目前設定快照 + hash
- `config.patch` 用於帶有重新啟動的部分設定更新
- `config.apply` 僅用於完整設定替換
- `update.run` 用於明確自我更新 + 重新啟動

部分變更請優先使用 `config.schema.lookup`，然後使用 `config.patch`。只有在你有意替換整個設定時，才使用
`config.apply`。
如需更完整的設定文件，請閱讀[設定](/zh-TW/gateway/configuration)與
[設定參考](/zh-TW/gateway/configuration-reference)。
此工具也會拒絕變更 `tools.exec.ask` 或 `tools.exec.security`；
舊版 `tools.bash.*` 別名會正規化為相同的受保護 exec 路徑。

### Plugin 提供的工具

Plugin 可以註冊額外工具。一些範例：

- [Diffs](/zh-TW/tools/diffs) — 差異檢視器與轉譯器
- [LLM Task](/zh-TW/tools/llm-task) — 用於結構化輸出的僅 JSON LLM 步驟
- [Lobster](/zh-TW/tools/lobster) — 具備可恢復核准的型別化工作流程執行階段
- [Music Generation](/zh-TW/tools/music-generation) — 具備工作流程後端提供者的共用 `music_generate` 工具
- [OpenProse](/zh-TW/prose) — markdown 優先的工作流程編排
- [Tokenjuice](/zh-TW/tools/tokenjuice) — 壓縮雜訊較多的 `exec` 與 `bash` 工具結果

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

當明確 allowlist 解析後沒有任何可呼叫工具時，OpenClaw 會封閉失敗。
例如，`tools.allow: ["query_db"]` 只有在已載入的 Plugin 實際
註冊 `query_db` 時才會運作。如果沒有內建工具、Plugin 或 bundled MCP 工具
符合 allowlist，執行會在模型呼叫前停止，而不是繼續成為
可能幻覺出工具結果的純文字執行。

### 工具設定檔

`tools.profile` 會在套用 `allow`/`deny` 前設定基礎 allowlist。
每個代理覆寫：`agents.list[].tools.profile`。

| 設定檔      | 包含內容                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 用於更廣泛命令/控制存取的非受限基準；等同於未設定 `tools.profile`                                                                                |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                         |
| `minimal`   | 僅 `session_status`                                                                                                                               |

<Note>
`tools.profile: "messaging"` 對於以頻道為主的
代理刻意保持狹窄。它不包含較廣泛的命令/控制工具，例如檔案系統、執行階段、
瀏覽器、canvas、nodes、cron 與 Gateway 控制。使用 `tools.profile: "full"`
作為較廣泛命令/控制存取的非受限基準，然後在需要時透過
`tools.allow` / `tools.deny` 修剪
存取權。
</Note>

`coding` 包含輕量級網頁工具（`web_search`、`web_fetch`、`x_search`），
但不包含完整的瀏覽器控制工具。瀏覽器自動化可以驅動真實的
工作階段與已登入設定檔，因此請使用
`tools.alsoAllow: ["browser"]` 或每個代理的
`agents.list[].tools.alsoAllow: ["browser"]` 明確加入它。

<Note>
在限制性設定檔（`messaging`、`minimal`）下設定 `tools.exec` 或 `tools.fs`，不會隱含擴大該設定檔的 allowlist。當你希望限制性設定檔使用那些已設定區段時，請新增明確的 `tools.alsoAllow` 項目（例如 exec 使用 `["exec", "process"]`，或 fs 使用 `["read", "write", "edit"]`）。當設定區段存在但沒有相符的 `alsoAllow` 授權時，OpenClaw 會記錄啟動警告。
</Note>

`coding` 與 `messaging` 設定檔也允許設定在 Plugin key `bundle-mcp` 下的 bundled MCP 工具。
當你希望設定檔保留其一般內建工具，但隱藏所有已設定的 MCP 工具時，加入 `tools.deny: ["bundle-mcp"]`。
`minimal` 設定檔不包含 bundled MCP 工具。

範例（預設使用最廣泛的工具表面）：

```json5
{
  tools: {
    profile: "full",
  },
}
```

### 工具群組

在 allow/deny 清單中使用 `group:*` 簡寫：

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
| `group:openclaw`   | 所有內建 OpenClaw 工具（不包含 Plugin 工具）                                                             |

`sessions_history` 會回傳有界且經安全篩選的回憶檢視。它會從助理文字中移除
思考標籤、`<relevant-memories>` 鷹架、純文字工具呼叫 XML
酬載（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、
降級的工具呼叫鷹架、外洩的 ASCII／全形模型控制
權杖，以及格式錯誤的 MiniMax 工具呼叫 XML，接著套用
遮罩／截斷，並可能使用過大列預留位置，而不是當作
原始對話記錄傾印。

### 提供者專屬限制

使用 `tools.byProvider` 可限制特定提供者的工具，而不需
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
