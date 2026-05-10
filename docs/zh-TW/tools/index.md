---
read_when:
    - 你想了解 OpenClaw 提供哪些工具
    - 您需要設定、允許或拒絕工具
    - 你正在決定要使用內建工具、Skills 還是 Plugin
summary: OpenClaw 工具與 Plugin 概覽：代理程式可以做什麼，以及如何擴充它
title: 工具與 Plugin
x-i18n:
    generated_at: "2026-05-10T19:53:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

OpenClaw


代理在產生文字之外所做的一切，都透過**工具**完成。
工具是代理讀取檔案、執行命令、瀏覽網頁、傳送
訊息，以及與裝置互動的方式。

## 工具、Skills 與 plugins

OpenClaw 有三個協同運作的層級：

<Steps>
  <Step title="工具是代理呼叫的對象">
    工具是代理可以叫用的型別化函式（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 隨附一組**內建工具**，
    plugins 則可以註冊其他工具。

    代理會將工具視為傳送給模型 API 的結構化函式定義。

  </Step>

  <Step title="Skills 教導代理何時以及如何使用">
    Skill 是注入系統提示詞的 markdown 檔案（`SKILL.md`）。
    Skills 會提供代理有效使用工具所需的脈絡、限制與逐步指引。
    Skills 存放在你的工作區、共享資料夾，或隨 plugins 一起提供。

    [Skills 參考](/zh-TW/tools/skills) | [建立 Skills](/zh-TW/tools/creating-skills)

  </Step>

  <Step title="Plugins 將所有內容封裝在一起">
    Plugin 是一個可以註冊任意能力組合的套件：
    channels、模型提供者、工具、Skills、語音、即時轉錄、
    即時語音、媒體理解、圖片生成、影片生成、
    網頁擷取、網頁搜尋等等。有些 plugins 是**核心**（隨
    OpenClaw 提供），其他則是**外部**（由社群發布在 npm 上）。

    [安裝並設定 plugins](/zh-TW/tools/plugin) | [建置你自己的 Plugin](/zh-TW/plugins/building-plugins)

  </Step>
</Steps>

## 內建工具

這些工具隨 OpenClaw 提供，不需要安裝任何 plugins 即可使用：

| 工具                                       | 功能                                                                  | 頁面                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 執行 shell 命令、管理背景程序                                         | [Exec](/zh-TW/tools/exec), [Exec Approvals](/zh-TW/tools/exec-approvals) |
| `code_execution`                           | 執行沙盒化的遠端 Python 分析                                          | [程式碼執行](/zh-TW/tools/code-execution)                         |
| `browser`                                  | 控制 Chromium 瀏覽器（導覽、點擊、螢幕截圖）                         | [瀏覽器](/zh-TW/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 搜尋網頁、搜尋 X 貼文、擷取頁面內容                                  | [網頁](/zh-TW/tools/web), [Web Fetch](/zh-TW/tools/web-fetch)            |
| `read` / `write` / `edit`                  | 工作區中的檔案 I/O                                                    |                                                              |
| `apply_patch`                              | 多區塊檔案修補                                                       | [套用修補](/zh-TW/tools/apply-patch)                              |
| `message`                                  | 跨所有 channels 傳送訊息                                              | [代理傳送](/zh-TW/tools/agent-send)                               |
| `nodes`                                    | 探索並指定配對裝置                                                    |                                                              |
| `cron` / `gateway`                         | 管理排程工作；檢查、修補、重新啟動或更新 Gateway                     |                                                              |
| `image` / `image_generate`                 | 分析或生成圖片                                                        | [圖片生成](/zh-TW/tools/image-generation)                         |
| `music_generate`                           | 生成音樂曲目                                                          | [音樂生成](/zh-TW/tools/music-generation)                         |
| `video_generate`                           | 生成影片                                                              | [影片生成](/zh-TW/tools/video-generation)                         |
| `tts`                                      | 一次性文字轉語音轉換                                                  | [TTS](/zh-TW/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 工作階段管理、狀態與子代理協調                                        | [子代理](/zh-TW/tools/subagents)                                  |
| `session_status`                           | 輕量 `/status` 風格回讀與工作階段模型覆寫                            | [工作階段工具](/zh-TW/concepts/session-tool)                      |

對於圖片工作，使用 `image` 進行分析，使用 `image_generate` 進行生成或編輯。如果你指定 `openai/*`、`google/*`、`fal/*`，或其他非預設圖片提供者，請先設定該提供者的驗證/API 金鑰。

對於音樂工作，使用 `music_generate`。如果你指定 `google/*`、`minimax/*`，或其他非預設音樂提供者，請先設定該提供者的驗證/API 金鑰。

對於影片工作，使用 `video_generate`。如果你指定 `qwen/*` 或其他非預設影片提供者，請先設定該提供者的驗證/API 金鑰。

對於由工作流程驅動的音訊生成，當 ComfyUI 等 Plugin 註冊
`music_generate` 時使用它。這與文字轉語音的 `tts` 是分開的。

`session_status` 是 sessions 群組中的輕量狀態/回讀工具。
它會回答目前工作階段中 `/status` 風格的問題，並且可以
選擇性設定每個工作階段的模型覆寫；`model=default` 會清除該
覆寫。和 `/status` 一樣，它可以從最新的逐字稿用量項目回填
稀疏的 token/快取計數器，以及作用中的 runtime 模型標籤。

`gateway` 是僅限 owner 使用的 Gateway 操作 runtime 工具：

- `config.schema.lookup` 用於編輯前的一個路徑範圍設定子樹
- `config.get` 用於目前設定快照 + 雜湊
- `config.patch` 用於部分設定更新並重新啟動
- `config.apply` 僅用於完整設定取代
- `update.run` 用於明確自我更新 + 重新啟動

對於部分變更，偏好先使用 `config.schema.lookup`，再使用 `config.patch`。只有在你有意取代整份設定時，才使用
`config.apply`。如需更廣泛的設定文件，請閱讀[設定](/zh-TW/gateway/configuration)與
[設定參考](/zh-TW/gateway/configuration-reference)。
此工具也會拒絕變更 `tools.exec.ask` 或 `tools.exec.security`；
舊版 `tools.bash.*` 別名會正規化到相同的受保護 exec 路徑。

### Plugin 提供的工具

Plugins 可以註冊其他工具。一些範例：

- [Canvas](/zh-TW/plugins/reference/canvas) — 用於 Node Canvas 控制與 A2UI 算繪的實驗性隨附 Plugin
- [Diffs](/zh-TW/tools/diffs) — diff 檢視器與算繪器
- [LLM Task](/zh-TW/tools/llm-task) — 用於結構化輸出的純 JSON LLM 步驟
- [Lobster](/zh-TW/tools/lobster) — 具備可續傳核准的型別化工作流程 runtime
- [音樂生成](/zh-TW/tools/music-generation) — 具有工作流程後端提供者的共享 `music_generate` 工具
- [OpenProse](/zh-TW/prose) — markdown 優先的工作流程協調
- [Tokenjuice](/zh-TW/tools/tokenjuice) — 壓縮雜訊較多的 `exec` 與 `bash` 工具結果

Plugin 工具仍然使用 `api.registerTool(...)` 撰寫，並在
Plugin manifest 的 `contracts.tools` 清單中宣告。OpenClaw 會在探索期間擷取已驗證的
工具描述元，並依 Plugin 來源與合約快取它，因此
之後的工具規劃可以跳過 Plugin runtime 載入。工具執行仍會載入
擁有該工具的 Plugin，並呼叫即時註冊的實作。

[工具搜尋](/zh-TW/tools/tool-search) 是大型目錄的精簡介面。
OpenClaw 可以不把每個 OpenClaw、MCP 或用戶端工具
schema 放進提示詞，而是給模型一個隔離的 Node runtime，
其中包含 `openclaw.tools.search`、`openclaw.tools.describe` 與
`openclaw.tools.call`。呼叫仍會透過 Gateway 回流，因此工具
政策、核准、hooks 與工作階段記錄仍然具權威性。

## 工具設定

### 允許與拒絕清單

透過 config 中的 `tools.allow` / `tools.deny` 控制代理可以呼叫哪些工具。拒絕永遠優先於允許。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

當明確的允許清單解析後沒有任何可呼叫工具時，OpenClaw 會封閉失敗。
例如，`tools.allow: ["query_db"]` 只有在已載入的 Plugin 實際
註冊 `query_db` 時才有效。如果沒有內建工具、Plugin 或隨附 MCP 工具符合
允許清單，執行會在模型呼叫前停止，而不是繼續成為可能幻覺工具結果的
純文字執行。

### 工具設定檔

`tools.profile` 會在套用 `allow`/`deny` 前設定基礎允許清單。
每個代理覆寫：`agents.list[].tools.profile`。

| 設定檔      | 包含內容                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 所有核心與選用 Plugin 工具；用於較廣泛命令/控制存取的不受限制基準                                                                               |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                         |
| `minimal`   | 僅 `session_status`                                                                                                                               |

<Note>
`tools.profile: "messaging"` 針對以 channel 為重點的
代理刻意保持狹窄。它會排除較廣泛的命令/控制工具，例如檔案系統、runtime、
瀏覽器、canvas、nodes、cron 與 Gateway 控制。使用 `tools.profile: "full"`
作為較廣泛命令/控制存取的不受限制基準，然後在需要時用
`tools.allow` / `tools.deny` 修剪
存取權。
</Note>

`coding` 包含輕量網頁工具（`web_search`、`web_fetch`、`x_search`），
但不包含完整的瀏覽器控制工具。瀏覽器自動化可以驅動真實的
工作階段與已登入的設定檔，因此請使用
`tools.alsoAllow: ["browser"]` 或每個代理的
`agents.list[].tools.alsoAllow: ["browser"]` 明確加入它。

<Note>
在限制性設定檔（`messaging`、`minimal`）下設定 `tools.exec` 或 `tools.fs`，不會隱式擴大該設定檔的允許清單。當你希望限制性設定檔使用這些已設定區段時，請加入明確的 `tools.alsoAllow` 項目（例如 exec 使用 `["exec", "process"]`，或 fs 使用 `["read", "write", "edit"]`）。當設定區段存在但沒有相符的 `alsoAllow` 授權時，OpenClaw 會記錄啟動警告。
</Note>

`coding` 與 `messaging` 設定檔也允許在
Plugin key `bundle-mcp` 下設定的 bundle MCP 工具。當你
希望設定檔保留其一般內建工具，但隱藏所有已設定的 MCP 工具時，加入 `tools.deny: ["bundle-mcp"]`。
`minimal` 設定檔不包含 bundle MCP 工具。

範例（預設最廣的工具介面）：

```json5
{
  tools: {
    profile: "full",
  },
}
```

### 工具群組

在允許/拒絕清單中使用 `group:*` 縮寫：

| 群組               | 工具                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` 可作為 `exec` 的別名）                                              |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | 內建 Canvas Plugin 啟用時的 browser、canvas                                                              |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 所有內建 OpenClaw 工具（不包含 Plugin 工具）                                                             |

`sessions_history` 會傳回有界且經安全過濾的回憶檢視。它會移除思考標籤、`<relevant-memories>` 架構、純文字工具呼叫 XML
酬載（包含 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`，以及遭截斷的工具呼叫區塊）、
降級的工具呼叫架構、外洩的 ASCII／全形模型控制權杖，以及 assistant 文字中格式不正確的 MiniMax 工具呼叫 XML，接著套用遮罩／截斷，以及可能的超大列佔位符，而不是充當原始逐字記錄傾印。

### 供應商專屬限制

使用 `tools.byProvider` 限制特定供應商的工具，而不變更全域預設值：

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
