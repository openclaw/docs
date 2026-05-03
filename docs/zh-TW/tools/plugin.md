---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件包
sidebarTitle: Install and Configure
summary: 安裝、設定和管理 OpenClaw Plugin
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins 為 OpenClaw 擴充新能力：頻道、模型供應商、
agent harness、工具、skills、語音、即時轉錄、即時
語音、媒體理解、圖片生成、影片生成、網頁擷取、網頁
搜尋等。有些 Plugin 是 **核心**（隨 OpenClaw 提供），其他則是
**外部** Plugin。大多數外部 Plugin 透過
[ClawHub](/zh-TW/tools/clawhub) 發布與探索。npm 仍支援直接安裝，以及在遷移完成前暫時支援一組由 OpenClaw 擁有的 Plugin 套件。

## 快速開始

如需可複製貼上的安裝、列出、解除安裝、更新與發布範例，請參閱
[管理 Plugin](/zh-TW/plugins/manage-plugins)。

<Steps>
  <Step title="查看已載入的項目">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安裝 Plugin">
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

    然後在設定檔中的 `plugins.entries.\<id\>.config` 下設定。

  </Step>

  <Step title="聊天原生管理">
    在執行中的 Gateway 內，僅限擁有者使用的 `/plugins enable` 與 `/plugins disable`
    會觸發 Gateway 設定重新載入器。Gateway 會在程序內重新載入 Plugin runtime
    介面，而新的 agent 回合會從重新整理後的登錄檔重建工具清單。`/plugins install`
    會變更 Plugin 原始碼，因此 Gateway 會要求重新啟動，而不是假裝目前程序可以安全地重新載入已匯入的模組。

  </Step>

  <Step title="驗證 Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、gateway
    方法、hook 或 Plugin 擁有的 CLI 命令時，請使用 `--runtime`。一般的 `inspect` 是冷態
    manifest/registry 檢查，並且刻意避免匯入 Plugin runtime。

  </Step>
</Steps>

如果你偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的解析器：本機路徑/封存檔、明確的
`clawhub:<pkg>`、明確的 `npm:<pkg>`、明確的 `git:<repo>`，或透過 npm 的裸套件規格。

如果設定無效，安裝通常會失敗關閉，並引導你使用
`openclaw doctor --fix`。唯一的復原例外是一條狹窄的 bundled-plugin
重新安裝路徑，僅適用於選擇加入
`openclaw.install.allowInvalidConfigRecovery` 的 Plugin。
Gateway 啟動期間，無效的 Plugin 設定會像其他無效設定一樣失敗關閉。
執行 `openclaw doctor --fix`，即可透過停用該 Plugin 項目並移除其無效設定 payload，隔離有問題的 Plugin 設定；一般設定備份會保留先前的值。
當頻道設定參照的 Plugin 已無法再探索到，但相同的過期 Plugin id 仍留在 Plugin 設定或安裝記錄中時，Gateway 啟動會記錄警告並略過該頻道，而不是阻擋所有其他頻道。
執行 `openclaw doctor --fix` 可移除過期的頻道/Plugin 項目；沒有過期 Plugin 證據的未知頻道鍵仍會驗證失敗，讓拼字錯誤保持可見。
如果設定了 `plugins.enabled: false`，過期的 Plugin 參照會被視為惰性：
Gateway 啟動會略過 Plugin 探索/載入工作，而 `openclaw doctor` 會保留已停用的 Plugin 設定，不會自動移除它。如果你想移除過期的 Plugin id，請先重新啟用 Plugin，再執行 doctor cleanup。

Plugin 相依性安裝只會在明確的安裝/更新或 doctor 修復流程期間發生。Gateway 啟動、設定重新載入與 runtime 檢查不會執行套件管理器，也不會修復相依性樹。本機 Plugin 必須已安裝其相依性，而 npm、git 與 ClawHub Plugin 會安裝在 OpenClaw 的受管理 Plugin 根目錄下。npm 相依性可能會在 OpenClaw 的受管理 npm 根目錄內 hoist；安裝/更新會先掃描該受管理根目錄再信任，解除安裝則會透過 npm 移除由 npm 管理的套件。外部 Plugin 與自訂載入路徑仍必須透過 `openclaw plugins install` 安裝。
使用 `openclaw plugins list --json` 可查看每個可見 Plugin 的靜態 `dependencyStatus`，而不需匯入 runtime 程式碼或修復相依性。
請參閱 [Plugin 相依性解析](/zh-TW/plugins/dependency-resolution) 了解安裝時生命週期。

對於 npm 安裝，像 `latest` 或 dist-tag 這類可變選擇器會在安裝前解析，然後固定到 OpenClaw 受管理 npm 根目錄中經過精確驗證的版本。npm 完成後，OpenClaw 會驗證已安裝的
`package-lock.json` 項目仍符合解析後的版本與 integrity。如果 npm 寫入不同的套件中繼資料，安裝會失敗，並回復受管理套件，而不是接受不同的 Plugin artifact。

原始碼 checkout 是 pnpm workspace。如果你 clone OpenClaw 來修改 bundled
Plugin，請執行 `pnpm install`；OpenClaw 之後會從
`extensions/<id>` 載入 bundled Plugin，因此編輯內容與套件本機相依性會被直接使用。
一般 npm 根目錄安裝適用於封裝版 OpenClaw，不適用於原始碼 checkout 開發。

## Plugin 類型

OpenClaw 可辨識兩種 Plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生**   | `openclaw.plugin.json` + runtime 模組；在程序內執行                | 官方 Plugin、社群 npm 套件                             |
| **Bundle** | Codex/Claude/Cursor 相容版面配置；對應到 OpenClaw 功能             | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

兩者都會出現在 `openclaw plugins list` 下。請參閱 [Plugin Bundle](/zh-TW/plugins/bundles) 了解 Bundle 詳細資訊。

如果你要撰寫原生 Plugin，請從 [建置 Plugin](/zh-TW/plugins/building-plugins)
與 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview) 開始。

## 套件進入點

原生 Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個項目都必須保持在套件目錄內，並解析為可讀取的 runtime
檔案，或解析為 TypeScript 原始檔，且有可推斷的已建置 JavaScript
對等檔案，例如 `src/index.ts` 到 `dist/index.js`。
封裝安裝必須隨附該 JavaScript runtime 輸出。TypeScript
原始碼 fallback 適用於原始碼 checkout 與本機開發路徑，不適用於安裝到 OpenClaw 受管理 Plugin 根目錄中的 npm 套件。

當已發布的 runtime 檔案不位於與來源項目相同的路徑時，請使用 `openclaw.runtimeExtensions`。存在時，`runtimeExtensions` 必須為每個 `extensions` 項目包含正好一個項目。不相符的清單會讓安裝與 Plugin 探索失敗，而不是靜默 fallback 到來源路徑。如果你也發布 `openclaw.setupEntry`，請為其已建置的
JavaScript 對等檔案使用 `openclaw.runtimeSetupEntry`；宣告時該檔案為必需。

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

### 遷移期間由 OpenClaw 擁有的 npm 套件

ClawHub 是大多數 Plugin 的主要發布路徑。目前封裝版
OpenClaw 版本已經隨附許多官方 Plugin，因此在一般設定中不需要另外安裝 npm。直到每個由 OpenClaw 擁有的 Plugin 都遷移到 ClawHub 前，OpenClaw 仍會在 npm 上發布一些 `@openclaw/*` Plugin 套件，供舊版/自訂安裝與直接 npm 工作流程使用。

如果 npm 將某個 `@openclaw/*` Plugin 套件回報為 deprecated，該套件版本來自較舊的外部套件列車。請使用目前 OpenClaw 隨附的 Plugin 或本機 checkout，直到較新的 npm 套件發布。

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

### 核心（隨 OpenClaw 提供）

<AccordionGroup>
  <Accordion title="模型供應商（預設啟用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` — 隨附的記憶體搜尋（透過 `plugins.slots.memory` 作為預設）
    - `memory-lancedb` — 由 LanceDB 支援的長期記憶體，具備自動回想/擷取功能（設定 `plugins.slots.memory = "memory-lancedb"`）

    請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb) 了解 OpenAI 相容的
    embedding 設定、Ollama 範例、回想限制與疑難排解。

  </Accordion>

  <Accordion title="語音供應商（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 隨附的瀏覽器 Plugin，用於瀏覽器工具、`openclaw browser` CLI、`browser.request` gateway 方法、瀏覽器 runtime，以及預設瀏覽器控制服務（預設啟用；替換前請先停用）
    - `copilot-proxy` — VS Code Copilot Proxy bridge（預設停用）

  </Accordion>
</AccordionGroup>

在找第三方 Plugin？請參閱 [社群 Plugin](/zh-TW/plugins/community)。

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
| `enabled`        | 主開關（預設：`true`）                                   |
| `allow`          | Plugin 允許清單（選用）                                  |
| `deny`           | Plugin 拒絕清單（選用；拒絕優先）                        |
| `load.paths`     | 額外的 Plugin 檔案/目錄                                  |
| `slots`          | 專屬槽位選擇器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>` | 每個 Plugin 的開關 + 設定                                |

`plugins.allow` 是排他的。當它非空時，只有列出的 Plugin 可以載入或公開工具，即使 `tools.allow` 包含 `"*"` 或特定 Plugin 擁有的工具名稱也是如此。如果工具允許清單參照 Plugin 工具，請將擁有該工具的 Plugin id 加到 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會對這種形態發出警告。

透過 `/plugins enable` 或 `/plugins disable` 進行的設定變更會觸發進程內 Gateway Plugin 重新載入。新的代理回合會從已重新整理的 Plugin registry 重建其工具清單。安裝、更新、解除安裝等會變更來源的操作仍會重新啟動 Gateway 程序，因為已匯入的 Plugin 模組無法安全地就地替換。

`openclaw plugins list` 是本機 Plugin registry/設定快照。那裡顯示為 `enabled` 的 Plugin，表示持久化 registry 和目前設定允許該 Plugin 參與。這並不證明已在執行中的遠端 Gateway 已重新載入或重新啟動到相同的 Plugin 程式碼。在使用包裝器程序的 VPS/容器設定中，請將重新啟動或會觸發重新載入的寫入送到實際的 `openclaw gateway run` 程序，或在重新載入回報失敗時，對執行中的 Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin 狀態：已停用、缺失、無效">
  - **已停用**：Plugin 存在，但啟用規則將其關閉。設定會保留。
  - **缺失**：設定參照了探索時找不到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的 schema。Gateway 啟動只會略過該 Plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定 payload，將無效項目隔離。

</Accordion>

## 探索與優先順序

OpenClaw 會依此順序掃描 Plugin（第一個符合者勝出）：

<Steps>
  <Step title="設定路徑">
    `plugins.load.paths` — 明確的檔案或目錄路徑。指回 OpenClaw 自身封裝的內建 Plugin 目錄的路徑會被忽略；執行 `openclaw doctor --fix` 以移除那些過期別名。
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

封裝安裝和 Docker 映像通常會從已編譯的 `dist/extensions` 樹解析內建 Plugin。如果某個內建 Plugin 來源目錄被 bind-mounted 到相符的封裝來源路徑上，例如 `/app/extensions/synology-chat`，OpenClaw 會將該掛載的來源目錄視為內建來源覆蓋，並在封裝的 `/app/dist/extensions/synology-chat` bundle 之前探索它。這能讓維護者容器迴圈持續運作，而不必把每個內建 Plugin 都切回 TypeScript 來源。設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist bundle，即使存在來源覆蓋掛載也是如此。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 一律優先於 allow
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 工作區來源的 Plugin **預設停用**（必須明確啟用）
- 內建 Plugin 會遵循內建預設啟用集合，除非被覆寫
- 專屬槽位可以強制啟用該槽位選取的 Plugin
- 當設定命名了 Plugin 擁有的介面時，部分內建選用 Plugin 會自動啟用，例如提供者模型 ref、通道設定，或 harness runtime
- 當 `plugins.enabled: false` 啟用時，過期 Plugin 設定會被保留；如果你希望移除過期 id，請先重新啟用 Plugin，再執行 doctor 清理
- OpenAI 系列 Codex 路由會保持獨立的 Plugin 邊界：`openai-codex/*` 屬於 OpenAI Plugin，而內建的 Codex app-server Plugin 則由 `agentRuntime.id: "codex"` 或舊版 `codex/*` 模型 refs 選取

## 疑難排解 runtime hooks

如果某個 Plugin 出現在 `plugins list` 中，但 `register(api)` 副作用或 hooks 沒有在即時聊天流量中執行，請先檢查這些項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的 Gateway URL、profile、設定路徑和程序就是你正在編輯的那些。
- 在 Plugin 安裝/設定/程式碼變更後，重新啟動即時 Gateway。在包裝器容器中，PID 1 可能只是 supervisor；請重新啟動或傳送 signal 給子 `openclaw gateway run` 程序。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook 註冊和診斷。非內建對話 hooks，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 對於模型切換，建議使用 `before_model_resolve`。它會在代理回合進行模型解析前執行；`llm_output` 只會在模型嘗試產生 assistant 輸出後執行。
- 若要證明有效的工作階段模型，請使用 `openclaw sessions` 或 Gateway 工作階段/狀態介面；在除錯提供者 payload 時，請使用 `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### Plugin 工具設定緩慢

如果代理回合在準備工具時看起來停滯，請啟用 trace logging 並檢查 Plugin 工具 factory timing 行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出總 factory 時間和最慢的 Plugin 工具 factories，包括 Plugin id、宣告的工具名稱、結果形態，以及該工具是否為選用。當單一 factory 至少花費 1 秒，或 Plugin 工具 factory 準備總時間至少花費 5 秒時，緩慢行會提升為警告。

OpenClaw 會針對相同有效請求內容脈絡的重複解析，快取成功的 Plugin 工具 factory 結果。快取鍵包含有效 runtime 設定、工作區、代理/工作階段 id、sandbox policy、瀏覽器設定、delivery context、requester identity 和 ownership state，因此依賴那些受信任欄位的 factories 會在內容脈絡變更時重新執行。

如果某個 Plugin 佔用了大部分時間，請檢查其 runtime 註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然後更新、重新安裝或停用該 Plugin。Plugin 作者應將昂貴的依賴載入移到工具執行路徑之後，而不是在工具 factory 內執行。

### 重複的通道或工具 ownership

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這些表示有多個已啟用的 Plugin 正嘗試擁有相同的通道、設定流程或工具名稱。最常見的原因是某個外部通道 Plugin 安裝在現在提供相同通道 id 的內建 Plugin 旁邊。

除錯步驟：

- 執行 `openclaw plugins list --enabled --verbose`，查看每個已啟用的 Plugin 及其來源。
- 針對每個可疑 Plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並比較 `channels`、`channelConfigs`、`tools` 和診斷。
- 安裝或移除 Plugin 套件後，執行 `openclaw plugins registry --refresh`，讓持久化 metadata 反映目前安裝。
- 在安裝、registry 或設定變更後重新啟動 Gateway。

修復選項：

- 如果某個 Plugin 有意替換另一個相同 channel id 的 Plugin，偏好的 Plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並填入較低優先順序的 Plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成，請使用 `plugins.entries.<plugin-id>.enabled: false` 停用其中一邊，或移除過期的 Plugin 安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該請求並回報衝突。請為該通道選擇一個 owner，或重新命名 Plugin 擁有的工具，讓 runtime 介面明確無歧義。

## Plugin 槽位（專屬類別）

部分類別是專屬的（一次只能有一個作用中）：

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

| 槽位            | 控制項目              | 預設                |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory Plugin  | `memory-core`       |
| `contextEngine` | 作用中內容引擎        | `legacy`（內建）    |

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

隨附 Plugin 會與 OpenClaw 一起提供。許多預設會啟用（例如隨附模型提供者、隨附語音提供者，以及隨附瀏覽器 Plugin）。其他隨附 Plugin 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫既有已安裝的 Plugin 或 hook pack。請使用 `openclaw plugins update <id-or-npm-spec>` 進行已追蹤 npm Plugin 的例行升級。它不支援與 `--link` 搭配使用，因為 `--link` 會重用來源路徑，而不是複製到受管理的安裝目標。

當 `plugins.allow` 已設定時，`openclaw plugins install` 會先將已安裝的 Plugin id 加入該允許清單，然後再啟用它。如果相同的 Plugin id 存在於 `plugins.deny`，安裝會移除該過時的拒絕項目，讓明確安裝的 Plugin 在重新啟動後可立即載入。

OpenClaw 會保留一份持久化的本機 Plugin registry，作為 Plugin 清單、貢獻擁有權與啟動規劃的冷讀取模型。安裝、更新、解除安裝、啟用與停用流程會在變更 Plugin 狀態後重新整理該 registry。同一個 `plugins/installs.json` 檔案會在頂層 `installRecords` 中保留持久安裝中繼資料，並在 `plugins` 中保留可重建的 manifest 中繼資料。如果 registry 遺失、過時或無效，`openclaw plugins registry --refresh` 會從安裝記錄、設定政策與 manifest/package 中繼資料重建其 manifest 檢視，而不載入 Plugin 執行階段模組。
`openclaw plugins update <id-or-npm-spec>` 適用於已追蹤的安裝。傳入帶有 dist-tag 或精確版本的 npm package spec 時，會將套件名稱解析回已追蹤的 Plugin 記錄，並記錄新的 spec 供未來更新使用。傳入未帶版本的套件名稱時，會將精確釘選的安裝移回 registry 的預設發行線。如果已安裝的 npm Plugin 已符合解析後的版本與已記錄的 artifact 身分，OpenClaw 會略過更新，不下載、不重新安裝，也不重寫設定。
當 `openclaw update` 在 beta 通道上執行時，預設線的 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，若沒有 Plugin beta 發行版，則回退到預設/latest。精確版本與明確標籤會維持釘選。

`--pin` 僅適用於 npm。它不支援與 `--marketplace` 搭配使用，因為 marketplace 安裝會保留 marketplace 來源中繼資料，而不是 npm spec。

`--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的緊急覆寫。它允許 Plugin 安裝與 Plugin 更新繼續越過內建 `critical` 發現，但仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 與 `*.spec.*`，以避免封鎖已封裝的測試 mock；宣告的 Plugin 執行階段進入點即使使用其中一個名稱，仍會被掃描。

此 CLI flag 僅適用於 Plugin 安裝/更新流程。由 Gateway 支援的 skill 相依項安裝改用對應的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

如果你在 ClawHub 發布的 Plugin 因掃描而被隱藏或封鎖，請開啟 ClawHub dashboard，或執行 `clawhub package rescan <name>` 要求 ClawHub 再次檢查它。`--dangerously-force-unsafe-install` 只影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描該 Plugin，也不會讓被封鎖的發行版公開。

相容套件組會參與相同的 Plugin 列表/檢查/啟用/停用流程。目前的執行階段支援包含套件組 Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的套件組能力，以及套件組支援 Plugin 的受支援或不受支援 MCP 與 LSP server 項目。

Marketplace 來源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名稱、本機 marketplace 根目錄或 `marketplace.json` 路徑、像 `owner/repo` 的 GitHub 簡寫、GitHub repo URL，或 git URL。對於遠端 marketplace，Plugin 項目必須保留在複製的 marketplace repo 內，且只能使用相對路徑來源。

完整詳細資訊請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概覽

原生 Plugin 會匯出一個公開 `register(api)` 的 entry object。較舊的 Plugin 可能仍使用 `activate(api)` 作為舊版別名，但新的 Plugin 應使用 `register`。

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

OpenClaw 會載入 entry object，並在 Plugin 啟用期間呼叫 `register(api)`。loader 仍會對較舊的 Plugin 回退到 `activate(api)`，但隨附 Plugin 與新的外部 Plugin 應將 `register` 視為公開契約。

`api.registrationMode` 會告訴 Plugin 其 entry 為何被載入：

| 模式            | 意義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 執行階段啟用。註冊工具、hook、服務、命令、路由與其他即時副作用。                              |
| `discovery`     | 唯讀能力探索。註冊提供者與中繼資料；受信任的 Plugin entry 程式碼可載入，但應略過即時副作用。 |
| `setup-only`    | 透過輕量 setup entry 載入通道 setup 中繼資料。                                                                |
| `setup-runtime` | 同時需要執行階段 entry 的通道 setup 載入。                                                                         |
| `cli-metadata`  | 僅收集 CLI 命令中繼資料。                                                                                            |

會開啟 socket、資料庫、背景 worker 或長生命週期 client 的 Plugin entry，應使用 `api.registrationMode === "full"` 保護這些副作用。探索載入會與啟用載入分開快取，且不會取代正在執行的 Gateway registry。探索是非啟用的，但不是免匯入：OpenClaw 可能會評估受信任的 Plugin entry 或通道 Plugin 模組來建立 snapshot。請保持模組頂層輕量且無副作用，並將網路 client、子程序、listener、憑證讀取與服務啟動移到完整執行階段路徑後方。

常見註冊方法：

| 方法                                  | 註冊內容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供者（LLM）        |
| `registerChannel`                       | 聊天通道                |
| `registerTool`                          | Agent 工具                  |
| `registerHook` / `on(...)`              | 生命週期 hook             |
| `registerSpeechProvider`                | 文字轉語音 / STT        |
| `registerRealtimeTranscriptionProvider` | 串流 STT               |
| `registerRealtimeVoiceProvider`         | 雙工即時語音       |
| `registerMediaUnderstandingProvider`    | 影像/音訊分析        |
| `registerImageGenerationProvider`       | 影像生成            |
| `registerMusicGenerationProvider`       | 音樂生成            |
| `registerVideoGenerationProvider`       | 影片生成            |
| `registerWebFetchProvider`              | Web 擷取 / scrape 提供者 |
| `registerWebSearchProvider`             | Web 搜尋                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | 背景服務          |

型別化生命週期 hook 的 hook guard 行為：

- `before_tool_call`: `{ block: true }` 是終止性的；較低優先順序的 handler 會被略過。
- `before_tool_call`: `{ block: false }` 是無操作，且不會清除先前的封鎖。
- `before_install`: `{ block: true }` 是終止性的；較低優先順序的 handler 會被略過。
- `before_install`: `{ block: false }` 是無操作，且不會清除先前的封鎖。
- `message_sending`: `{ cancel: true }` 是終止性的；較低優先順序的 handler 會被略過。
- `message_sending`: `{ cancel: false }` 是無操作，且不會清除先前的取消。

原生 Codex app-server 會將 Codex 原生工具事件橋接回這個 hook 介面。Plugin 可以透過 `before_tool_call` 封鎖原生 Codex 工具、透過 `after_tool_call` 觀察結果，並參與 Codex `PermissionRequest` 核准。該 bridge 尚未重寫 Codex 原生工具引數。確切的 Codex 執行階段支援邊界位於 [Codex harness v1 支援契約](/zh-TW/plugins/codex-harness#v1-support-contract)。

完整型別化 hook 行為請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立你自己的 Plugin
- [Plugin 套件組](/zh-TW/plugins/bundles) — Codex/Claude/Cursor 套件組相容性
- [Plugin manifest](/zh-TW/plugins/manifest) — manifest schema
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) — 在 Plugin 中新增 agent 工具
- [Plugin 內部架構](/zh-TW/plugins/architecture) — 能力模型與載入 pipeline
- [社群 Plugin](/zh-TW/plugins/community) — 第三方列表
