---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件組合
sidebarTitle: Install and Configure
summary: 安裝、設定及管理 OpenClaw Plugin
title: Plugin
x-i18n:
    generated_at: "2026-05-02T03:01:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e68612f5bf538ba8f38d96bd85a0b4f044e203ecf647caef070965a4a96d99b
    source_path: tools/plugin.md
    workflow: 16
---

Plugin 會為 OpenClaw 擴充新能力：頻道、模型提供者、
Agent harness、工具、Skills、語音、即時轉錄、即時
語音、媒體理解、影像生成、影片生成、Web 擷取、Web
搜尋，以及更多功能。有些 Plugin 是 **核心**（隨 OpenClaw 出貨），其他則是
**外部** Plugin。大多數外部 Plugin 會透過
[ClawHub](/zh-TW/tools/clawhub) 發布與探索。Npm 仍支援直接安裝，也支援
一組暫時的 OpenClaw 自有 Plugin 套件，直到該遷移完成為止。

## 快速開始

<Steps>
  <Step title="查看已載入的項目">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安裝 Plugin">
    ```bash
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

    然後在設定檔中的 `plugins.entries.\<id\>.config` 下進行設定。

  </Step>

  <Step title="驗證 Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、Gateway 方法、
    hook，或 Plugin 擁有的 CLI 命令時，請使用 `--runtime`。單純的 `inspect`
    是冷態 manifest/registry 檢查，並且刻意避免匯入 Plugin runtime。

  </Step>
</Steps>

如果你偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的解析器：本機路徑/封存檔、明確的
`clawhub:<pkg>`、明確的 `npm:<pkg>`、明確的 `git:<repo>`，或裸套件
規格（先 ClawHub，接著 npm fallback）。

如果設定無效，安裝通常會失敗關閉，並引導你執行
`openclaw doctor --fix`。唯一的復原例外，是針對選擇加入
`openclaw.install.allowInvalidConfigRecovery` 的 Plugin，提供狹義的內建 Plugin
重新安裝路徑。
在 Gateway 啟動期間，某個 Plugin 的無效設定會被隔離到該 Plugin：
啟動記錄會記下 `plugins.entries.<id>.config` 問題，在載入時略過該 Plugin，
並讓其他 Plugin 與頻道保持上線。執行 `openclaw doctor --fix`
可透過停用該 Plugin 項目並移除其無效設定 payload，來隔離錯誤的 Plugin 設定；
一般設定備份會保留先前的值。
當頻道設定參照了已無法探索的 Plugin，但同一個過期 Plugin id 仍留在 Plugin
設定或安裝記錄中時，Gateway 啟動會記錄警告並略過該頻道，而不是阻擋其他所有頻道。
執行 `openclaw doctor --fix` 可移除過期的頻道/Plugin 項目；沒有過期 Plugin
證據的未知頻道鍵仍會使驗證失敗，因此拼字錯誤仍會清楚顯示。
如果設定了 `plugins.enabled: false`，過期 Plugin 參照會被視為非作用中：
Gateway 啟動會略過 Plugin 探索/載入工作，而 `openclaw doctor` 會保留
已停用的 Plugin 設定，而不是自動移除它。如果你想移除過期 Plugin id，
請先重新啟用 Plugin，再執行 doctor 清理。

Plugin 依賴安裝只會在明確的安裝/更新或 doctor 修復流程中發生。Gateway 啟動、
設定重新載入與 runtime 檢查不會執行套件管理器，也不會修復依賴樹。本機 Plugin
必須已經安裝其依賴，而 npm、git 與 ClawHub Plugin 會安裝在 OpenClaw
管理的 Plugin root 下。npm 依賴可能會在 OpenClaw 管理的 npm root 內 hoist；
安裝/更新會在信任前掃描該受管理 root，解除安裝則會透過 npm 移除 npm 管理的套件。
外部 Plugin 與自訂載入路徑仍必須透過 `openclaw plugins install` 安裝。
請參閱 [Plugin 依賴解析](/zh-TW/plugins/dependency-resolution) 了解安裝時 lifecycle。

來源 checkout 是 pnpm workspace。如果你 clone OpenClaw 以修改內建
Plugin，請執行 `pnpm install`；OpenClaw 接著會從 `extensions/<id>` 載入
內建 Plugin，因此可直接使用編輯內容與套件本機依賴。
一般 npm root 安裝是供封裝後的 OpenClaw 使用，不適用於來源 checkout
開發。

## Plugin 類型

OpenClaw 識別兩種 Plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module；在處理程序內執行          | 官方 Plugin、社群 npm 套件                             |
| **Bundle** | Codex/Claude/Cursor 相容版面配置；對應到 OpenClaw 功能             | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會顯示在 `openclaw plugins list` 下。請參閱 [Plugin Bundle](/zh-TW/plugins/bundles) 了解 bundle 詳細資訊。

如果你正在撰寫 native Plugin，請從 [建置 Plugin](/zh-TW/plugins/building-plugins)
與 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview) 開始。

## 套件進入點

Native Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個項目都必須留在套件目錄內，並解析為可讀取的 runtime 檔案，或解析為
具有推斷建置 JavaScript 對應檔的 TypeScript 原始檔，例如從 `src/index.ts`
對應到 `dist/index.js`。

當發布的 runtime 檔案與來源項目不在相同路徑時，請使用
`openclaw.runtimeExtensions`。若存在，`runtimeExtensions` 必須為每個
`extensions` 項目包含剛好一個項目。不相符的清單會使安裝與 Plugin 探索失敗，
而不是靜默 fallback 到來源路徑。如果你也發布 `openclaw.setupEntry`，
請為其建置後的 JavaScript 對應檔使用 `openclaw.runtimeSetupEntry`；
宣告時該檔案為必要項目。

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 官方 Plugin

### 遷移期間的 OpenClaw 自有 npm 套件

ClawHub 是大多數 Plugin 的主要發行路徑。目前封裝的
OpenClaw 發行版已經內建許多官方 Plugin，因此一般設定中不需要
額外的 npm 安裝。在所有 OpenClaw 自有 Plugin 都遷移到 ClawHub 之前，
OpenClaw 仍會在 npm 上發布一些 `@openclaw/*` Plugin 套件，供較舊/自訂安裝
與直接 npm 工作流程使用。

如果 npm 回報某個 `@openclaw/*` Plugin 套件已棄用，該套件版本來自較舊的
外部套件列車。請使用目前 OpenClaw 的內建 Plugin 或本機 checkout，
直到發布更新的 npm 套件為止。

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

### 核心（隨 OpenClaw 出貨）

<AccordionGroup>
  <Accordion title="模型提供者（預設啟用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="記憶體 Plugin">
    - `memory-core` — 內建記憶體搜尋（預設透過 `plugins.slots.memory`）
    - `memory-lancedb` — 以 LanceDB 為後端、具備自動回想/擷取的長期記憶（設定 `plugins.slots.memory = "memory-lancedb"`）

    請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb) 了解 OpenAI 相容
    embedding 設定、Ollama 範例、回想限制與疑難排解。

  </Accordion>

  <Accordion title="語音提供者（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 供瀏覽器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、browser runtime，以及預設瀏覽器控制服務使用的內建瀏覽器 Plugin（預設啟用；替換前請先停用）
    - `copilot-proxy` — VS Code Copilot Proxy bridge（預設停用）

  </Accordion>
</AccordionGroup>

在尋找第三方 Plugin？請參閱 [社群 Plugin](/zh-TW/plugins/community)。

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
| `enabled`        | 主開關（預設：`true`）                                    |
| `allow`          | Plugin allowlist（選用）                                  |
| `deny`           | Plugin denylist（選用；deny 優先）                        |
| `load.paths`     | 額外 Plugin 檔案/目錄                                     |
| `slots`          | 互斥 slot selector（例如 `memory`、`contextEngine`）       |
| `entries.\<id\>` | 每個 Plugin 的開關 + 設定                                 |

`plugins.allow` 是排他性的。當它非空時，只有列出的 Plugin 可以載入
或公開工具，即使 `tools.allow` 包含 `"*"` 或特定 Plugin 擁有的
工具名稱也是如此。如果工具 allowlist 參照 Plugin 工具，請將擁有者 Plugin id
加入 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會對這種
形態提出警告。

設定變更**需要重新啟動 Gateway**。如果 Gateway 正以設定監看 + 處理程序內重新啟動
啟用的狀態執行（預設 `openclaw gateway` 路徑），該重新啟動通常會在設定寫入完成後
片刻自動執行。Native Plugin runtime code 或 lifecycle hook 沒有受支援的
hot-reload 路徑；在期待更新後的 `register(api)` code、`api.on(...)` hook、
工具、服務，或 provider/runtime hook 執行之前，請重新啟動正在服務 live channel
的 Gateway 處理程序。

`openclaw plugins list` 是本機 Plugin registry/config snapshot。其中的
`enabled` Plugin 表示持久化 registry 與目前設定允許該 Plugin 參與。
這並不證明已在執行的遠端 Gateway child 已重新啟動並使用相同 Plugin code。
在含有 wrapper process 的 VPS/container 設定中，請將重新啟動送到實際的
`openclaw gateway run` 處理程序，或對執行中的 Gateway 使用
`openclaw gateway restart`。

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **已停用**：plugin 存在，但啟用規則已將其關閉。設定會被保留。
  - **缺失**：設定參照了探索未找到的 plugin id。
  - **無效**：plugin 存在，但其設定不符合宣告的 schema。Gateway 啟動只會略過該 plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定 payload，將無效項目隔離。

</Accordion>

## 探索與優先順序

OpenClaw 會依此順序掃描 plugins（第一個符合者優先）：

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — 明確的檔案或目錄路徑。指回
    OpenClaw 自身封裝的內建 plugin 目錄的路徑會被忽略；
    執行 `openclaw doctor --fix` 以移除那些過時別名。
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Bundled plugins">
    隨 OpenClaw 出貨。許多預設啟用（模型 providers、語音）。
    其他則需要明確啟用。
  </Step>
</Steps>

封裝安裝與 Docker 映像通常會從已編譯的
`dist/extensions` 樹解析內建 plugins。如果內建 plugin 來源目錄
被 bind-mounted 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`，OpenClaw 會將該掛載的來源目錄
視為內建來源覆蓋，並在封裝的
`/app/dist/extensions/synology-chat` bundle 之前探索它。這讓維護者容器
迴圈可以繼續運作，而不必把每個內建 plugin 都切回 TypeScript 原始碼。
設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist bundles，
即使存在來源覆蓋掛載也是如此。

### 啟用規則

- `plugins.enabled: false` 會停用所有 plugins，並略過 plugin 探索/載入工作
- `plugins.deny` 永遠優先於 allow
- `plugins.entries.\<id\>.enabled: false` 會停用該 plugin
- 來源為工作區的 plugins **預設停用**（必須明確啟用）
- 內建 plugins 會遵循內建的預設開啟集合，除非被覆寫
- 獨佔槽位可以強制啟用該槽位所選的 plugin
- 某些內建選擇性啟用 plugins 會在設定指定
  plugin 擁有的 surface 時自動啟用，例如 provider model ref、channel config，或 harness
  runtime
- `plugins.enabled: false` 啟用時會保留過時 plugin 設定；
  如果你想移除過時 ids，請先重新啟用 plugins 再執行 doctor cleanup
- OpenAI-family Codex routes 會維持分離的 plugin 邊界：
  `openai-codex/*` 屬於 OpenAI plugin，而內建 Codex
  app-server plugin 則由 `agentRuntime.id: "codex"` 或舊版
  `codex/*` model refs 選取

## 疑難排解 runtime hooks

如果 plugin 出現在 `plugins list` 中，但 `register(api)` side effects 或 hooks
未在 live chat 流量中執行，請先檢查這些項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的
  Gateway URL、profile、config path 和 process 就是你正在編輯的那些。
- 在 plugin 安裝/設定/程式碼變更後重新啟動 live Gateway。在 wrapper
  containers 中，PID 1 可能只是 supervisor；請重新啟動或 signal 子
  `openclaw gateway run` process。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook registrations 和
  diagnostics。非內建 conversation hooks，例如 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 對於模型切換，偏好使用 `before_model_resolve`。它會在 agent turns 的 model
  resolution 之前執行；`llm_output` 只會在一次 model attempt
  產生 assistant output 後執行。
- 若要證明有效的 session model，請使用 `openclaw sessions` 或
  Gateway session/status surfaces；在除錯 provider payloads 時，請以
  `--raw-stream --raw-stream-path <path>` 啟動
  Gateway。

### 緩慢的 plugin tool 設定

如果 agent turns 在準備工具時似乎停住，請啟用 trace logging 並
檢查 plugin tool factory timing lines：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出總 factory time 與最慢的 plugin tool factories，
包含 plugin id、宣告的 tool names、result shape，以及該 tool 是否為
optional。當單一 factory 花費至少
1s，或總 plugin tool factory prep 至少花費 5s 時，slow lines 會升級為 warnings。

如果某個 plugin 主導了耗時，請檢查其 runtime registrations：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

接著更新、重新安裝，或停用該 plugin。Plugin 作者應將
昂貴的 dependency loading 移到 tool execution path 之後，而不是在
tool factory 內執行。

### 重複的 channel 或 tool 所有權

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這表示超過一個已啟用 plugin 正嘗試擁有同一個 channel、
setup flow 或 tool name。最常見原因是外部 channel plugin
與現在提供相同 channel id 的內建 plugin 並存安裝。

除錯步驟：

- 執行 `openclaw plugins list --enabled --verbose` 查看每個已啟用 plugin
  及其來源。
- 對每個可疑 plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並
  比較 `channels`、`channelConfigs`、`tools` 和 diagnostics。
- 安裝或移除 plugin packages 後，執行 `openclaw plugins registry --refresh`，
  讓已持久化 metadata 反映目前安裝狀態。
- 在安裝、registry 或設定變更後重新啟動 Gateway。

修復選項：

- 如果某個 plugin 有意取代另一個相同 channel id 的 plugin，
  偏好的 plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並指定
  較低優先序的 plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成，請用
  `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過時的 plugin
  install。
- 如果你明確啟用了兩個 plugins，OpenClaw 會保留該請求並
  回報衝突。請為該 channel 選擇一個 owner，或重新命名 plugin 擁有的
  tools，使 runtime surface 明確無歧義。

## Plugin 槽位（獨佔類別）

某些類別是獨佔的（一次只能有一個作用中）：

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

| 槽位            | 控制內容              | 預設                |
| --------------- | --------------------- | ------------------- |
| `memory`        | 作用中的記憶體 plugin | `memory-core`       |
| `contextEngine` | 作用中的內容引擎      | `legacy`（內建）    |

## CLI 參考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

內建 plugins 隨 OpenClaw 出貨。許多預設啟用（例如
內建模型 providers、內建語音 providers，以及內建瀏覽器
plugin）。其他內建 plugins 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫現有已安裝 plugin 或 hook pack。請使用
`openclaw plugins update <id-or-npm-spec>` 對受追蹤的 npm
plugins 進行例行升級。它不支援搭配 `--link`，因為後者會重用來源路徑，而不是
複製到受管理的安裝目標上。

當 `plugins.allow` 已設定時，`openclaw plugins install` 會先將
已安裝 plugin id 加入該 allowlist，再啟用它。如果相同 plugin id
存在於 `plugins.deny` 中，install 會移除該過時 deny 項目，讓
明確安裝在重新啟動後可以立即載入。

OpenClaw 會保留一個持久化的本機 plugin registry，作為
plugin inventory、contribution ownership 和 startup planning 的 cold read model。Install、update、
uninstall、enable 和 disable flows 會在變更 plugin
狀態後重新整理該 registry。同一個 `plugins/installs.json` 檔案會在
頂層 `installRecords` 保留 durable install metadata，並在 `plugins` 保留可重建的 manifest metadata。如果
registry 缺失、過時或無效，`openclaw plugins registry
--refresh` 會從 install records、config policy，以及
manifest/package metadata 重建其 manifest view，而不載入 plugin runtime modules。
`openclaw plugins update <id-or-npm-spec>` 適用於受追蹤的安裝。傳入
帶有 dist-tag 或確切版本的 npm package spec，會將 package name
解析回受追蹤的 plugin record，並記錄新的 spec 供未來更新使用。
傳入不含版本的 package name，會將確切 pinned install 移回
registry 的預設 release line。如果已安裝的 npm plugin 已符合
解析後版本與記錄的 artifact identity，OpenClaw 會略過更新，
不下載、不重新安裝，也不重寫設定。

`--pin` 僅適用於 npm。它不支援搭配 `--marketplace`，因為
marketplace installs 會持久化 marketplace source metadata，而不是 npm spec。

`--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的破玻璃覆寫。它允許 plugin 安裝和 plugin 更新在內建 `critical` 發現項目後繼續進行，但仍不會繞過 plugin `before_install` 政策封鎖或掃描失敗封鎖。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免封鎖套件化的測試 mock；宣告的 plugin runtime 進入點即使使用其中一種名稱，仍會被掃描。

這個 CLI 旗標只適用於 plugin 安裝/更新流程。Gateway 後端支援的 skill 依賴安裝改用相符的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

如果你在 ClawHub 發布的 plugin 被掃描隱藏或封鎖，請開啟 ClawHub dashboard，或執行 `clawhub package rescan <name>`，要求 ClawHub 再次檢查。`--dangerously-force-unsafe-install` 只會影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描 plugin，也不會讓被封鎖的 release 公開。

相容 bundle 會參與相同的 plugin 清單/檢查/啟用/停用流程。目前的 runtime 支援包含 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的 bundle 功能，以及 bundle-backed plugins 支援或不支援的 MCP 和 LSP server 項目。

Marketplace 來源可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱、本機 marketplace 根目錄或 `marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。對於遠端 marketplaces，plugin 項目必須留在 cloned marketplace repo 內，且只能使用相對路徑來源。

完整詳細資訊請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概觀

原生 plugins 會匯出一個 entry 物件，公開 `register(api)`。較舊的 plugins 可能仍使用 `activate(api)` 作為 legacy alias，但新的 plugins 應使用 `register`。

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

OpenClaw 會載入 entry 物件，並在 plugin 啟用期間呼叫 `register(api)`。loader 仍會對較舊的 plugins fallback 到 `activate(api)`，但 bundled plugins 與新的 external plugins 應將 `register` 視為 public contract。

`api.registrationMode` 會告訴 plugin 為何載入它的 entry：

| 模式            | 意義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime 啟用。註冊 tools、hooks、services、commands、routes 和其他即時 side effects。                              |
| `discovery`     | 唯讀功能探索。註冊 providers 與 metadata；受信任的 plugin entry code 可能會載入，但會略過即時 side effects。 |
| `setup-only`    | 透過輕量 setup entry 載入 channel setup metadata。                                                                |
| `setup-runtime` | 同時需要 runtime entry 的 channel setup 載入。                                                                         |
| `cli-metadata`  | 只收集 CLI command metadata。                                                                                            |

會開啟 sockets、databases、background workers 或長生命週期 clients 的 Plugin entries，應使用 `api.registrationMode === "full"` 保護這些 side effects。Discovery 載入會與啟用載入分開快取，且不會取代執行中的 Gateway registry。Discovery 是非啟用式，但不是免 import：OpenClaw 可能會評估受信任的 plugin entry 或 channel plugin module 來建立 snapshot。請保持 module top levels 輕量且沒有 side effects，並將 network clients、subprocesses、listeners、credential reads 和 service startup 移到 full-runtime paths 後方。

常見註冊方法：

| 方法                                  | 註冊項目           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model provider (LLM)        |
| `registerChannel`                       | Chat channel                |
| `registerTool`                          | Agent tool                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice       |
| `registerMediaUnderstandingProvider`    | Image/audio analysis        |
| `registerImageGenerationProvider`       | Image generation            |
| `registerMusicGenerationProvider`       | Music generation            |
| `registerVideoGenerationProvider`       | Video generation            |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI commands                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Background service          |

型別化 lifecycle hooks 的 hook guard 行為：

- `before_tool_call`: `{ block: true }` 是終止性結果；較低優先順序的 handlers 會被略過。
- `before_tool_call`: `{ block: false }` 是 no-op，且不會清除先前的 block。
- `before_install`: `{ block: true }` 是終止性結果；較低優先順序的 handlers 會被略過。
- `before_install`: `{ block: false }` 是 no-op，且不會清除先前的 block。
- `message_sending`: `{ cancel: true }` 是終止性結果；較低優先順序的 handlers 會被略過。
- `message_sending`: `{ cancel: false }` 是 no-op，且不會清除先前的 cancel。

原生 Codex app-server 會將 Codex-native tool events 橋接回這個 hook 介面。Plugins 可以透過 `before_tool_call` 封鎖原生 Codex tools、透過 `after_tool_call` 觀察結果，並參與 Codex `PermissionRequest` approvals。bridge 尚不會改寫 Codex-native tool arguments。確切的 Codex runtime 支援邊界記載於 [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

完整的型別化 hook 行為請參閱 [SDK 概觀](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 plugins](/zh-TW/plugins/building-plugins) — 建立你自己的 plugin
- [Plugin bundles](/zh-TW/plugins/bundles) — Codex/Claude/Cursor bundle 相容性
- [Plugin manifest](/zh-TW/plugins/manifest) — manifest schema
- [註冊 tools](/zh-TW/plugins/building-plugins#registering-agent-tools) — 在 plugin 中新增 agent tools
- [Plugin internals](/zh-TW/plugins/architecture) — 功能模型與載入 pipeline
- [Community plugins](/zh-TW/plugins/community) — 第三方 listings
