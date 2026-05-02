---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件包
sidebarTitle: Install and Configure
summary: 安裝、設定及管理 OpenClaw Plugin
title: Plugin
x-i18n:
    generated_at: "2026-05-02T21:06:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugins 會為 OpenClaw 擴充新能力：頻道、模型供應商、
代理程式框架、工具、skills、語音、即時轉錄、即時
語音、媒體理解、影像生成、影片生成、網頁擷取、網頁
搜尋等。有些 plugins 是 **核心**（隨 OpenClaw 一起提供），其他則是
**外部**。大多數外部 plugins 會透過
[ClawHub](/zh-TW/tools/clawhub) 發布並被探索。Npm 仍支援直接安裝，也支援
一組暫時的 OpenClaw 擁有 plugin 套件，直到該遷移完成。

## 快速開始

如需可直接複製貼上的安裝、列出、解除安裝、更新與發布範例，請參閱
[管理 plugins](/zh-TW/plugins/manage-plugins)。

<Steps>
  <Step title="查看已載入的項目">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安裝 plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重新啟動 Gateway">
    ```bash
    openclaw gateway restart
    ```

    然後在你的設定檔中，於 `plugins.entries.\<id\>.config` 下設定。

  </Step>

  <Step title="聊天原生管理">
    在執行中的 Gateway 內，僅限擁有者使用的 `/plugins enable` 和 `/plugins disable`
    會觸發 Gateway 設定重新載入器。Gateway 會在程序內重新載入 plugin 執行階段
    介面，而新的代理程式回合會從重新整理後的登錄檔重建其工具清單。
    `/plugins install` 會變更 plugin 原始碼，因此 Gateway 會要求重新啟動，
    而不是假裝目前程序可以安全地重新載入已匯入的模組。

  </Step>

  <Step title="驗證 plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、gateway
    方法、hooks，或 plugin 擁有的 CLI 指令時，請使用 `--runtime`。單純的
    `inspect` 是冷啟動的 manifest/registry 檢查，並且刻意避免匯入 plugin 執行階段。

  </Step>
</Steps>

如果你偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的解析器：本機路徑/封存檔、明確的
`clawhub:<pkg>`、明確的 `npm:<pkg>`、明確的 `git:<repo>`，或透過 npm 的裸套件
規格。

如果設定無效，安裝通常會失敗並關閉，且指向
`openclaw doctor --fix`。唯一的復原例外是狹窄的內建 plugin
重新安裝路徑，適用於選擇加入
`openclaw.install.allowInvalidConfigRecovery` 的 plugins。
Gateway 啟動期間，某個 plugin 的無效設定會被隔離到該 plugin：
啟動會記錄 `plugins.entries.<id>.config` 問題，在載入時略過該 plugin，
並讓其他 plugins 和頻道維持在線。執行 `openclaw doctor --fix`
即可透過停用該 plugin 項目並移除其無效設定內容，來隔離不良 plugin
設定；一般設定備份會保留先前的值。
當頻道設定參照了已無法探索的 plugin，但相同的過時 plugin id 仍留在 plugin
設定或安裝記錄中時，Gateway 啟動會記錄警告並略過該頻道，而不是封鎖所有其他頻道。
執行 `openclaw doctor --fix` 以移除過時的頻道/plugin 項目；沒有過時 plugin
證據的未知頻道鍵仍會驗證失敗，因此拼字錯誤仍會顯示出來。
如果設定了 `plugins.enabled: false`，過時的 plugin 參照會被視為非作用中：
Gateway 啟動會略過 plugin 探索/載入工作，而 `openclaw doctor` 會保留
已停用的 plugin 設定，而不是自動移除。若你想移除過時的 plugin ids，
請先重新啟用 plugins 再執行 doctor 清理。

Plugin 相依項安裝只會在明確的安裝/更新或 doctor 修復流程中發生。
Gateway 啟動、設定重新載入與執行階段檢查不會執行套件管理器或修復相依樹。
本機 plugins 必須已安裝其相依項，而 npm、git 和 ClawHub plugins 會安裝在
OpenClaw 管理的 plugin roots 下。npm 相依項可能會在 OpenClaw 管理的 npm root
內提升；安裝/更新會在信任前掃描該受管理 root，而解除安裝會透過 npm
移除 npm 管理的套件。外部 plugins 和自訂載入路徑仍必須透過
`openclaw plugins install` 安裝。使用 `openclaw plugins list --json`
可查看每個可見 plugin 的靜態 `dependencyStatus`，而不匯入執行階段程式碼或修復相依項。
請參閱 [Plugin 相依項解析](/zh-TW/plugins/dependency-resolution) 了解
安裝期間的生命週期。

原始碼 checkout 是 pnpm 工作區。如果你 clone OpenClaw 來修改內建
plugins，請執行 `pnpm install`；OpenClaw 接著會從
`extensions/<id>` 載入內建 plugins，因此會直接使用編輯內容與套件本機相依項。
單純的 npm root 安裝適用於封裝版 OpenClaw，而不是原始碼 checkout
開發。

## Plugin 類型

OpenClaw 可辨識兩種 plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 執行階段模組；在程序內執行              | 官方 plugins、社群 npm 套件                            |
| **Bundle** | Codex/Claude/Cursor 相容配置；對應至 OpenClaw 功能                | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會顯示在 `openclaw plugins list` 下。請參閱 [Plugin Bundles](/zh-TW/plugins/bundles) 了解 bundle 詳情。

如果你正在撰寫 native plugin，請從 [建置 Plugins](/zh-TW/plugins/building-plugins)
和 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview) 開始。

## 套件進入點

Native plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個項目都必須留在套件目錄內，並解析為可讀取的執行階段檔案，
或解析為 TypeScript 原始檔，且具備推斷出的已建置 JavaScript
對應檔，例如 `src/index.ts` 對應 `dist/index.js`。

當已發布的執行階段檔案不在與原始項目相同的路徑時，請使用
`openclaw.runtimeExtensions`。若存在，`runtimeExtensions` 必須針對每個
`extensions` 項目包含剛好一個項目。不相符的清單會讓安裝和
plugin 探索失敗，而不是靜默退回到原始路徑。如果你也發布
`openclaw.setupEntry`，請為其已建置的 JavaScript 對應檔使用
`openclaw.runtimeSetupEntry`；宣告後該檔案即為必需。

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 官方 plugins

### 遷移期間由 OpenClaw 擁有的 npm 套件

ClawHub 是大多數 plugins 的主要發行路徑。目前封裝版
OpenClaw 發行已內建許多官方 plugins，因此在一般設定中不需要
另外安裝 npm。在所有由 OpenClaw 擁有的 plugin 都遷移到
ClawHub 前，OpenClaw 仍會在 npm 上發行一些 `@openclaw/*` plugin
套件，以支援較舊/自訂安裝與直接 npm 工作流程。

如果 npm 回報某個 `@openclaw/*` plugin 套件已被棄用，該套件
版本來自較舊的外部套件系列。請使用目前 OpenClaw 的內建 plugin
或本機 checkout，直到較新的 npm 套件發布。

| Plugin          | 套件                       | 文件                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/zh-TW/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/zh-TW/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/zh-TW/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/zh-TW/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/zh-TW/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/zh-TW/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/zh-TW/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/zh-TW/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/zh-TW/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/zh-TW/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/zh-TW/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/zh-TW/plugins/zalouser)         |

### 核心（隨 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型供應商（預設啟用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — 內建記憶體搜尋（預設透過 `plugins.slots.memory`）
    - `memory-lancedb` — 由 LanceDB 支援的長期記憶體，具備自動回想/擷取（設定 `plugins.slots.memory = "memory-lancedb"`）

    請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb) 了解 OpenAI 相容
    embedding 設定、Ollama 範例、回想限制與疑難排解。

  </Accordion>

  <Accordion title="語音供應商（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 內建瀏覽器 plugin，提供瀏覽器工具、`openclaw browser` CLI、`browser.request` gateway 方法、瀏覽器執行階段，以及預設瀏覽器控制服務（預設啟用；替換前請先停用）
    - `copilot-proxy` — VS Code Copilot Proxy 橋接器（預設停用）

  </Accordion>
</AccordionGroup>

在尋找第三方 plugins？請參閱 [社群 Plugins](/zh-TW/plugins/community)。

## 設定

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 欄位             | 說明                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主切換（預設：`true`）                                   |
| `allow`          | Plugin allowlist（選用）                                  |
| `deny`           | Plugin denylist（選用；deny 優先）                        |
| `load.paths`     | 額外的 plugin 檔案/目錄                                   |
| `slots`          | 排他 slot 選擇器（例如 `memory`、`contextEngine`）        |
| `entries.\<id\>` | 每個 plugin 的切換 + 設定                                 |

`plugins.allow` 是排他的。當它不是空的時，只有列出的 plugins 可以載入
或公開工具，即使 `tools.allow` 包含 `"*"` 或特定 plugin 擁有的
工具名稱也是如此。如果工具 allowlist 參照了 plugin 工具，請將擁有該工具的 plugin ids
加入 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會對這種
形狀提出警告。

透過 `/plugins enable` 或 `/plugins disable` 進行的設定變更會觸發處理程序內的 Gateway Plugin 重新載入。新的代理回合會從重新整理後的 Plugin 登錄重建其工具清單。安裝、更新和解除安裝等變更來源的操作仍會重新啟動 Gateway 處理程序，因為已匯入的 Plugin 模組無法安全地就地替換。

`openclaw plugins list` 是本機 Plugin 登錄/設定快照。那裡的 `enabled` Plugin 表示持久化登錄和目前設定允許該 Plugin 參與。這無法證明已在執行中的遠端 Gateway 已重新載入或重新啟動到相同的 Plugin 程式碼。在具有包裝程序的 VPS/容器設定中，請將重新啟動或觸發重新載入的寫入傳送到實際的 `openclaw gateway run` 處理程序，或在重新載入回報失敗時，對執行中的 Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **已停用**：Plugin 存在，但啟用規則將其關閉。設定會保留。
  - **遺失**：設定參照了探索未找到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的結構描述。Gateway 啟動只會略過該 Plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定承載來隔離無效項目。

</Accordion>

## 探索與優先順序

OpenClaw 會依此順序掃描 Plugin（第一個符合者勝出）：

<Steps>
  <Step title="設定路徑">
    `plugins.load.paths` — 明確的檔案或目錄路徑。指回 OpenClaw 自身封裝的 bundled Plugin 目錄的路徑會被忽略；請執行 `openclaw doctor --fix` 以移除那些過時別名。
  </Step>

  <Step title="工作區 Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全域 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="內建 Plugin">
    隨 OpenClaw 一起提供。許多預設啟用（模型提供者、語音）。其他則需要明確啟用。
  </Step>
</Steps>

封裝安裝和 Docker 映像通常會從已編譯的 `dist/extensions` 樹解析 bundled Plugin。如果 bundled Plugin 來源目錄被 bind mount 到相符的封裝來源路徑上，例如 `/app/extensions/synology-chat`，OpenClaw 會將該掛載的來源目錄視為 bundled source overlay，並在封裝的 `/app/dist/extensions/synology-chat` bundle 之前探索它。這能讓維護者容器迴圈持續運作，而無須將每個 bundled Plugin 都切回 TypeScript source。設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist bundle，即使存在來源 overlay 掛載也是如此。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 永遠優先於 allow
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 來自工作區的 Plugin **預設停用**（必須明確啟用）
- bundled Plugin 會遵循內建的預設開啟集合，除非被覆寫
- 排他插槽可以強制啟用該插槽選取的 Plugin
- 有些 bundled 選用 Plugin 會在設定命名 Plugin 擁有的介面時自動啟用，例如提供者模型參照、頻道設定或 harness runtime
- 當 `plugins.enabled: false` 啟用時，過時的 Plugin 設定會保留；如果你想移除過時 id，請先重新啟用 Plugin，再執行 doctor 清理
- OpenAI 系列 Codex 路由會保留分離的 Plugin 邊界：`openai-codex/*` 屬於 OpenAI Plugin，而 bundled Codex app-server Plugin 則由 `agentRuntime.id: "codex"` 或舊版 `codex/*` 模型參照選取

## 疑難排解 runtime hooks

如果某個 Plugin 出現在 `plugins list` 中，但 `register(api)` 副作用或 hook 沒有在即時聊天流量中執行，請先檢查這些項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的 Gateway URL、profile、設定路徑和處理程序，就是你正在編輯的那些。
- 在 Plugin 安裝/設定/程式碼變更後重新啟動即時 Gateway。在包裝容器中，PID 1 可能只是 supervisor；請重新啟動或傳送訊號給子 `openclaw gateway run` 處理程序。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook 註冊和診斷。非 bundled 對話 hook，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 對於模型切換，請偏好使用 `before_model_resolve`。它會在代理回合的模型解析前執行；`llm_output` 只會在模型嘗試產生助理輸出後執行。
- 若要證明有效的工作階段模型，請使用 `openclaw sessions` 或 Gateway 工作階段/狀態介面；偵錯提供者承載時，請使用 `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### 緩慢的 Plugin 工具設定

如果代理回合在準備工具時看似停滯，請啟用 trace 記錄並檢查 Plugin 工具 factory 計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出 factory 總時間和最慢的 Plugin 工具 factory，包括 Plugin id、宣告的工具名稱、結果形狀，以及該工具是否為選用。當單一 factory 至少花費 1 秒，或 Plugin 工具 factory 準備總時間至少花費 5 秒時，慢速行會提升為警告。

OpenClaw 會針對相同有效請求情境下的重複解析，快取成功的 Plugin 工具 factory 結果。快取鍵包含有效的 runtime 設定、工作區、代理/工作階段 id、sandbox 原則、瀏覽器設定、交付情境、請求者身分和擁有權狀態，因此依賴這些受信任欄位的 factory 會在情境變更時重新執行。

如果某個 Plugin 主導計時，請檢查其 runtime 註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然後更新、重新安裝或停用該 Plugin。Plugin 作者應將昂貴的依賴載入移到工具執行路徑後方，而不是在工具 factory 內執行。

### 重複的頻道或工具擁有權

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這些表示有多個已啟用的 Plugin 試圖擁有相同的頻道、設定流程或工具名稱。最常見的原因是外部頻道 Plugin 安裝在 bundled Plugin 旁邊，而後者現在提供相同的頻道 id。

偵錯步驟：

- 執行 `openclaw plugins list --enabled --verbose` 查看每個已啟用的 Plugin 和來源。
- 對每個疑似 Plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並比較 `channels`、`channelConfigs`、`tools` 和診斷。
- 安裝或移除 Plugin 套件後，執行 `openclaw plugins registry --refresh`，讓持久化中繼資料反映目前安裝。
- 在安裝、登錄或設定變更後重新啟動 Gateway。

修正選項：

- 如果某個 Plugin 有意替換另一個相同頻道 id 的 Plugin，偏好的 Plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並填入較低優先權的 Plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成，請使用 `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過時的 Plugin 安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該請求並回報衝突。請為該頻道選擇一個擁有者，或重新命名 Plugin 擁有的工具，讓 runtime 介面不含歧義。

## Plugin 插槽（排他類別）

有些類別是排他的（一次只能有一個作用中）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| 插槽            | 控制項目              | 預設                |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory Plugin  | `memory-core`       |
| `contextEngine` | 作用中的情境引擎      | `legacy`（內建）    |

## CLI 參考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

bundled Plugin 會隨 OpenClaw 一起提供。許多預設啟用（例如 bundled 模型提供者、bundled 語音提供者，以及 bundled 瀏覽器 Plugin）。其他 bundled Plugin 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫現有已安裝的 Plugin 或 hook pack。針對追蹤的 npm Plugin 例行升級，請使用 `openclaw plugins update <id-or-npm-spec>`。它不支援與 `--link` 搭配使用，因為 `--link` 會重用來源路徑，而不是複製到受管理的安裝目標上。

當 `plugins.allow` 已設定時，`openclaw plugins install` 會先將已安裝的 Plugin id 新增到該 allowlist，再啟用它。如果相同的 Plugin id 存在於 `plugins.deny` 中，install 會移除該過時的 deny 項目，使明確安裝在重新啟動後能立即載入。

OpenClaw 會保留一份持久化的本機 Plugin 登錄檔，作為 Plugin 清單、貢獻所有權與啟動規劃的冷讀取模型。安裝、更新、解除安裝、啟用與停用流程會在變更 Plugin 狀態後重新整理該登錄檔。同一個 `plugins/installs.json` 檔案會在頂層 `installRecords` 保留持久安裝中繼資料，並在 `plugins` 保留可重建的 manifest 中繼資料。如果登錄檔遺失、過舊或無效，`openclaw plugins registry --refresh` 會從安裝記錄、設定政策，以及 manifest/package 中繼資料重建其 manifest 檢視，而不載入 Plugin 執行階段模組。
`openclaw plugins update <id-or-npm-spec>` 適用於已追蹤的安裝。傳入帶有 dist-tag 或精確版本的 npm package spec 時，會將 package 名稱解析回已追蹤的 Plugin 記錄，並記錄新的 spec 供未來更新使用。傳入不含版本的 package 名稱，會將精確釘選的安裝移回登錄檔的預設發行線。如果已安裝的 npm Plugin 已符合解析後的版本與已記錄的成品身分，OpenClaw 會略過更新，不下載、不重新安裝，也不重寫設定。
當 `openclaw update` 在 beta channel 上執行時，預設線的 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，並在沒有 Plugin beta 發行版時退回 default/latest。精確版本與明確標籤會維持釘選。

`--pin` 僅適用於 npm。它不支援搭配 `--marketplace` 使用，因為 marketplace 安裝會持久保存 marketplace 來源中繼資料，而不是 npm spec。

`--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的緊急覆寫。它允許 Plugin 安裝與 Plugin 更新在內建 `critical` 發現項目後繼續，但仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免封鎖打包的測試 mock；已宣告的 Plugin 執行階段進入點即使用了其中一種名稱，仍會被掃描。

這個 CLI 旗標只適用於 Plugin 安裝/更新流程。由 Gateway 支援的 skill 相依項安裝會改用相符的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

如果你在 ClawHub 發佈的 Plugin 因掃描而被隱藏或封鎖，請開啟 ClawHub 儀表板，或執行 `clawhub package rescan <name>` 要求 ClawHub 再次檢查。`--dangerously-force-unsafe-install` 只會影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描該 Plugin，也不會讓被封鎖的發行版公開。

相容 bundle 會參與相同的 Plugin 清單/檢查/啟用/停用流程。目前的執行階段支援包含 bundle Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的 bundle 功能，以及 bundle 支援的 Plugin 所含受支援或不受支援的 MCP 與 LSP server 項目。

Marketplace 來源可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱、本機 marketplace root 或 `marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub shorthand、GitHub repo URL，或 git URL。對遠端 marketplace 來說，Plugin 項目必須保留在 clone 下來的 marketplace repo 內，且只能使用相對路徑來源。

完整詳細資訊請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概覽

原生 Plugin 會匯出一個 entry object，公開 `register(api)`。較舊的 Plugin 可能仍使用 `activate(api)` 作為 legacy alias，但新的 Plugin 應使用 `register`。

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw 會在 Plugin 啟用期間載入 entry object，並呼叫 `register(api)`。loader 仍會針對較舊的 Plugin 退回使用 `activate(api)`，但 bundled Plugin 與新的外部 Plugin 應將 `register` 視為公開合約。

`api.registrationMode` 會告訴 Plugin 其 entry 為何被載入：

| 模式            | 含義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 執行階段啟用。註冊工具、hook、服務、命令、路由與其他即時副作用。                              |
| `discovery`     | 唯讀功能探索。註冊 provider 與中繼資料；受信任的 Plugin entry code 可以載入，但應略過即時副作用。 |
| `setup-only`    | 透過輕量 setup entry 載入 channel setup 中繼資料。                                                                |
| `setup-runtime` | 也需要 runtime entry 的 channel setup 載入。                                                                         |
| `cli-metadata`  | 僅收集 CLI command 中繼資料。                                                                                            |

會開啟 socket、database、background worker 或長生命週期 client 的 Plugin entry，應以 `api.registrationMode === "full"` 保護這些副作用。探索載入會與啟用載入分開快取，且不會取代正在執行的 Gateway 登錄檔。探索是非啟用式的，但不是免 import：OpenClaw 可能會評估受信任的 Plugin entry 或 channel Plugin module 以建立 snapshot。請保持 module top level 輕量且無副作用，並將 network client、subprocess、listener、credential read 與 service startup 移到完整 runtime path 後方。

常見註冊方法：

| 方法                                  | 註冊內容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型 provider (LLM)        |
| `registerChannel`                       | Chat channel                |
| `registerTool`                          | Agent tool                  |
| `registerHook` / `on(...)`              | 生命週期 hook             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | 雙工即時語音       |
| `registerMediaUnderstandingProvider`    | 影像/音訊分析        |
| `registerImageGenerationProvider`       | 影像生成            |
| `registerMusicGenerationProvider`       | 音樂生成            |
| `registerVideoGenerationProvider`       | 影片生成            |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | Web 搜尋                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI commands                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | 背景服務          |

typed lifecycle hooks 的 hook guard 行為：

- `before_tool_call`：`{ block: true }` 為終止狀態；會略過較低優先順序的 handler。
- `before_tool_call`：`{ block: false }` 為 no-op，且不會清除先前的 block。
- `before_install`：`{ block: true }` 為終止狀態；會略過較低優先順序的 handler。
- `before_install`：`{ block: false }` 為 no-op，且不會清除先前的 block。
- `message_sending`：`{ cancel: true }` 為終止狀態；會略過較低優先順序的 handler。
- `message_sending`：`{ cancel: false }` 為 no-op，且不會清除先前的 cancel。

原生 Codex app-server 執行會將 Codex-native tool event 橋接回這個 hook surface。Plugin 可以透過 `before_tool_call` 封鎖原生 Codex tool，透過 `after_tool_call` 觀察結果，並參與 Codex `PermissionRequest` approval。bridge 尚不會重寫 Codex-native tool argument。確切的 Codex runtime 支援邊界位於 [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

完整 typed hook 行為請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立你自己的 Plugin
- [Plugin bundle](/zh-TW/plugins/bundles) — Codex/Claude/Cursor bundle 相容性
- [Plugin manifest](/zh-TW/plugins/manifest) — manifest schema
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) — 在 Plugin 中新增 agent tool
- [Plugin 內部架構](/zh-TW/plugins/architecture) — 功能模型與載入 pipeline
- [社群 Plugin](/zh-TW/plugins/community) — 第三方清單
