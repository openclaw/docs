---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件組合
sidebarTitle: Install and Configure
summary: 安裝、設定並管理 OpenClaw Plugin
title: Plugins
x-i18n:
    generated_at: "2026-04-30T03:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugin 會以新功能擴充 OpenClaw：通道、模型提供者、代理程式執行框架、工具、Skills、語音、即時轉錄、即時語音、媒體理解、影像生成、影片生成、網頁擷取、網頁搜尋等。有些 Plugin 是 **core**（隨 OpenClaw 出貨），其他則是 **外部**。大多數外部 Plugin 都透過 [ClawHub](/zh-TW/tools/clawhub) 發布與探索。在該遷移完成前，npm 仍支援直接安裝，以及一組暫時由 OpenClaw 擁有的 Plugin 套件。

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

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重新啟動 Gateway">
    ```bash
    openclaw gateway restart
    ```

    然後在設定檔中的 `plugins.entries.\<id\>.config` 底下進行設定。

  </Step>
</Steps>

如果你偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的解析器：本機路徑/封存檔、明確的 `clawhub:<pkg>`、明確的 `npm:<pkg>`，或裸套件規格（先 ClawHub，然後 npm 後援）。

如果設定無效，安裝通常會安全失敗，並指引你使用 `openclaw doctor --fix`。唯一的復原例外，是針對選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 所提供的窄範圍內建 Plugin 重新安裝路徑。
在 Gateway 啟動期間，單一 Plugin 的無效設定會隔離在該 Plugin：啟動會記錄 `plugins.entries.<id>.config` 問題，載入時略過該 Plugin，並讓其他 Plugin 和通道保持上線。執行 `openclaw doctor --fix` 可停用該 Plugin 項目並移除其無效設定內容，將有問題的 Plugin 設定隔離；一般設定備份會保留先前的值。
當通道設定參照了已無法探索的 Plugin，但同一個過期 Plugin id 仍存在於 Plugin 設定或安裝記錄中時，Gateway 啟動會記錄警告並略過該通道，而不是阻擋所有其他通道。執行 `openclaw doctor --fix` 可移除過期的通道/Plugin 項目；沒有過期 Plugin 證據的未知通道鍵仍會驗證失敗，讓錯字保持可見。
如果設定了 `plugins.enabled: false`，過期的 Plugin 參照會被視為非作用中：Gateway 啟動會略過 Plugin 探索/載入工作，而 `openclaw doctor` 會保留已停用的 Plugin 設定，而不是自動移除它。如果你想移除過期的 Plugin id，請先重新啟用 Plugin，再執行 doctor 清理。

封裝的 OpenClaw 安裝不會急切安裝每個內建 Plugin 的執行階段依賴樹。當 OpenClaw 擁有的內建 Plugin 因 Plugin 設定、舊版通道設定或預設啟用的 manifest 而處於作用中時，啟動只會在匯入它之前修復該 Plugin 宣告的執行階段依賴。
僅有持久化的通道驗證狀態，不會在 Gateway 啟動執行階段依賴修復時啟用內建通道。
明確停用仍然優先：`plugins.entries.<id>.enabled: false`、`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false` 會阻止該 Plugin/通道的自動內建執行階段依賴修復。
非空的 `plugins.allow` 也會限制預設啟用的內建執行階段依賴修復；明確啟用內建通道（`channels.<id>.enabled: true`）仍可修復該通道的 Plugin 依賴。
外部 Plugin 和自訂載入路徑仍必須透過 `openclaw plugins install` 安裝。

## Plugin 類型

OpenClaw 可辨識兩種 Plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 執行階段模組；在程序內執行               | 官方 Plugin、社群 npm 套件                             |
| **Bundle** | Codex/Claude/Cursor 相容配置；對應到 OpenClaw 功能                 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會顯示在 `openclaw plugins list` 底下。如需 Bundle 詳細資訊，請參閱 [Plugin Bundles](/zh-TW/plugins/bundles)。

如果你正在撰寫 Native Plugin，請從 [Building Plugins](/zh-TW/plugins/building-plugins) 和 [Plugin SDK Overview](/zh-TW/plugins/sdk-overview) 開始。

## 套件進入點

Native Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。每個項目都必須留在套件目錄內，並解析為可讀取的執行階段檔案，或解析為 TypeScript 原始檔，且具備可推斷的已建置 JavaScript 對應檔，例如 `src/index.ts` 到 `dist/index.js`。

當發布的執行階段檔案與原始項目不在相同路徑時，請使用 `openclaw.runtimeExtensions`。存在時，`runtimeExtensions` 必須針對每個 `extensions` 項目包含恰好一個項目。不相符的清單會讓安裝和 Plugin 探索失敗，而不是靜默退回到原始路徑。

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

ClawHub 是大多數 Plugin 的主要發行路徑。目前封裝的 OpenClaw 版本已內建許多官方 Plugin，因此在一般設定中不需要另外安裝 npm。在每個由 OpenClaw 擁有的 Plugin 都遷移到 ClawHub 之前，OpenClaw 仍會在 npm 上發布一些 `@openclaw/*` Plugin 套件，用於較舊/自訂安裝和直接 npm 工作流程。

如果 npm 回報某個 `@openclaw/*` Plugin 套件已棄用，該套件版本來自較舊的外部套件系列。請使用目前 OpenClaw 的內建 Plugin 或本機 checkout，直到新的 npm 套件發布。

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

### Core（隨 OpenClaw 出貨）

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
    - `memory-lancedb` — 隨需安裝的長期記憶體，具備自動回想/擷取（設定 `plugins.slots.memory = "memory-lancedb"`）

    如需 OpenAI 相容的嵌入設定、Ollama 範例、回想限制和疑難排解，請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb)。

  </Accordion>

  <Accordion title="語音提供者（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用於瀏覽器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、瀏覽器執行階段，以及預設瀏覽器控制服務的內建瀏覽器 Plugin（預設啟用；替換前請先停用）
    - `copilot-proxy` — VS Code Copilot Proxy 橋接器（預設停用）

  </Accordion>
</AccordionGroup>

在尋找第三方 Plugin？請參閱 [Community Plugins](/zh-TW/plugins/community)。

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
| `enabled`        | 主要切換（預設：`true`）                                  |
| `allow`          | Plugin 允許清單（選用）                                   |
| `deny`           | Plugin 拒絕清單（選用；拒絕優先）                         |
| `load.paths`     | 額外的 Plugin 檔案/目錄                                   |
| `slots`          | 獨占 slot 選擇器（例如 `memory`、`contextEngine`）         |
| `entries.\<id\>` | 每個 Plugin 的切換 + 設定                                 |

設定變更**需要重新啟動 gateway**。如果 Gateway 正以設定監看 + 程序內重新啟動啟用的方式執行（預設的 `openclaw gateway` 路徑），該重新啟動通常會在設定寫入落地後片刻自動執行。
Native Plugin 執行階段程式碼或生命週期 hook 沒有支援的熱重新載入路徑；在期待更新後的 `register(api)` 程式碼、`api.on(...)` hook、工具、服務或提供者/執行階段 hook 執行之前，請重新啟動正在服務即時通道的 Gateway 程序。

`openclaw plugins list` 是本機 Plugin registry/設定快照。那裡的 `enabled` Plugin 表示持久化 registry 和目前設定允許該 Plugin 參與。它不能證明已在執行的遠端 Gateway 子程序已重新啟動到相同的 Plugin 程式碼。在 VPS/容器設定中，如果有 wrapper 程序，請將重新啟動傳送到實際的 `openclaw gateway run` 程序，或針對執行中的 Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin 狀態：已停用、缺失、無效">
  - **已停用**：Plugin 存在，但啟用規則將它關閉。設定會保留。
  - **缺失**：設定參照了探索未找到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的 schema。Gateway 啟動只會略過該 Plugin；`openclaw doctor --fix` 可透過停用無效項目並移除其設定內容來隔離它。

</Accordion>

## 探索與優先順序

OpenClaw 會依此順序掃描 Plugin（第一個相符項目勝出）：

<Steps>
  <Step title="設定路徑">
    `plugins.load.paths` — 明確的檔案或目錄路徑。指回 OpenClaw 自己封裝的內建 Plugin 目錄的路徑會被忽略；執行 `openclaw doctor --fix` 可移除這些過期別名。
  </Step>

  <Step title="工作區 Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全域 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="隨附的 Plugin">
    隨 OpenClaw 一起提供。許多預設啟用（模型提供者、語音）。
    其他則需要明確啟用。
  </Step>
</Steps>

封裝安裝與 Docker 映像通常會從已編譯的 `dist/extensions` 樹解析隨附的 Plugin。如果隨附的 Plugin 原始碼目錄被 bind mount 到相符的封裝原始碼路徑上，例如 `/app/extensions/synology-chat`，OpenClaw 會將該掛載的原始碼目錄視為隨附原始碼覆蓋層，並在封裝的 `/app/dist/extensions/synology-chat` bundle 之前發現它。這可讓維護者容器迴圈持續運作，而不必把每個隨附 Plugin 都切回 TypeScript 原始碼。即使存在原始碼覆蓋掛載，也可設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 以強制使用封裝的 dist bundle。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 一律優先於 allow
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 工作區來源的 Plugin **預設停用**（必須明確啟用）
- 隨附的 Plugin 會遵循內建的預設啟用集合，除非被覆寫
- 專屬 slot 可強制啟用該 slot 選取的 Plugin
- 某些隨附的選擇性啟用 Plugin，會在設定命名 Plugin 擁有的介面時自動啟用，例如提供者模型參照、通道設定或 harness runtime
- 當 `plugins.enabled: false` 啟用時，過期的 Plugin 設定會被保留；若你想移除過期 id，請先重新啟用 Plugin 再執行 doctor cleanup
- OpenAI 系列 Codex 路由會保留個別的 Plugin 邊界：
  `openai-codex/*` 屬於 OpenAI Plugin，而隨附的 Codex app-server Plugin 則由 `agentRuntime.id: "codex"` 或舊版 `codex/*` 模型參照選取

## 疑難排解 runtime hook

如果某個 Plugin 出現在 `plugins list` 中，但 `register(api)` 副作用或 hook 沒有在即時聊天流量中執行，請先檢查下列項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的 Gateway URL、profile、設定路徑與程序都是你正在編輯的那些。
- 在 Plugin 安裝/設定/程式碼變更後重新啟動即時 Gateway。在 wrapper 容器中，PID 1 可能只是 supervisor；請重新啟動或向子 `openclaw gateway run` 程序發送 signal。
- 使用 `openclaw plugins inspect <id> --json` 確認 hook 註冊與診斷。非隨附的對話 hook，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 對於模型切換，優先使用 `before_model_resolve`。它會在 agent turn 的模型解析之前執行；`llm_output` 只會在模型嘗試產生 assistant 輸出後執行。
- 若要證明有效 session 模型，請使用 `openclaw sessions` 或 Gateway session/status 介面；在偵錯 provider payload 時，請以 `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### 重複的通道或工具所有權

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這表示有多個已啟用的 Plugin 嘗試擁有相同的通道、設定流程或工具名稱。最常見的原因是外部通道 Plugin 安裝在一個目前也提供相同通道 id 的隨附 Plugin 旁邊。

偵錯步驟：

- 執行 `openclaw plugins list --enabled --verbose` 查看每個已啟用 Plugin 與來源。
- 對每個疑似 Plugin 執行 `openclaw plugins inspect <id> --json`，並比較 `channels`、`channelConfigs`、`tools` 與診斷。
- 在安裝或移除 Plugin 套件後執行 `openclaw plugins registry --refresh`，讓持久化 metadata 反映目前安裝狀態。
- 在安裝、registry 或設定變更後重新啟動 Gateway。

修正選項：

- 如果某個 Plugin 有意取代另一個使用相同通道 id 的 Plugin，偏好的 Plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並指定較低優先順序的 Plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成的，請用 `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過期的 Plugin 安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該請求並回報衝突。請為通道選擇一個擁有者，或重新命名 Plugin 擁有的工具，讓 runtime 介面保持明確。

## Plugin slot（專屬類別）

某些類別是專屬的（一次只能啟用一個）：

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

| Slot            | 控制內容              | 預設值              |
| --------------- | --------------------- | ------------------- |
| `memory`        | 作用中的記憶體 Plugin | `memory-core`       |
| `contextEngine` | 作用中的脈絡引擎      | `legacy` (built-in) |

## CLI 參考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

隨附的 Plugin 會隨 OpenClaw 一起提供。許多預設啟用（例如隨附的模型提供者、隨附的語音提供者，以及隨附的瀏覽器 Plugin）。其他隨附的 Plugin 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫現有已安裝的 Plugin 或 hook pack。對於已追蹤 npm Plugin 的例行升級，請使用 `openclaw plugins update <id-or-npm-spec>`。它不支援與 `--link` 搭配使用，因為 `--link` 會重用原始碼路徑，而不是複製到受管理的安裝目標上。

當 `plugins.allow` 已經設定時，`openclaw plugins install` 會先把已安裝的 Plugin id 加到該 allowlist，再啟用它。如果相同 Plugin id 存在於 `plugins.deny` 中，install 會移除該過期 deny 項目，讓明確安裝在重新啟動後可立即載入。

OpenClaw 會保留一個持久化的本機 Plugin registry，作為 Plugin inventory、contribution 所有權與啟動規劃的 cold read model。Install、update、uninstall、enable 與 disable 流程會在變更 Plugin 狀態後重新整理該 registry。相同的 `plugins/installs.json` 檔案會在頂層 `installRecords` 中保留持久的安裝 metadata，並在 `plugins` 中保留可重建的 manifest metadata。如果 registry 遺失、過期或無效，`openclaw plugins registry --refresh` 會從安裝記錄、設定 policy，以及 manifest/package metadata 重建其 manifest view，而不載入 Plugin runtime module。`openclaw plugins update <id-or-npm-spec>` 適用於已追蹤的安裝。傳入帶有 dist-tag 或精確版本的 npm package spec 時，會把 package name 解析回已追蹤的 Plugin 記錄，並記錄新的 spec 供未來 update 使用。傳入不含版本的 package name，會將精確 pinned install 移回 registry 的預設 release line。如果已安裝的 npm Plugin 已符合解析出的版本與記錄的 artifact identity，OpenClaw 會略過 update，不下載、不重新安裝，也不重寫設定。

`--pin` 僅限 npm。它不支援與 `--marketplace` 搭配使用，因為 marketplace install 會持久保存 marketplace source metadata，而不是 npm spec。

`--dangerously-force-unsafe-install` 是一個 break-glass override，用於處理內建 dangerous-code scanner 的誤報。它允許 Plugin install 與 Plugin update 繞過內建的 `critical` finding 繼續進行，但仍不會繞過 Plugin `before_install` policy block 或 scan-failure blocking。Install scan 會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免封裝的測試 mock 被阻擋；已宣告的 Plugin runtime entrypoint 即使使用其中一個名稱，仍會被掃描。

此 CLI flag 只適用於 Plugin install/update 流程。Gateway 支援的 skill dependency install 會改用相符的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

如果你發布到 ClawHub 的 Plugin 被 scan 隱藏或封鎖，請開啟 ClawHub dashboard，或執行 `clawhub package rescan <name>` 要求 ClawHub 重新檢查。`--dangerously-force-unsafe-install` 只會影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描 Plugin，也不會讓被封鎖的 release 公開。

相容 bundle 會參與相同的 Plugin list/inspect/enable/disable 流程。目前 runtime 支援包含 bundle skill、Claude command-skill、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skill，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的 bundle capability，以及 bundle-backed Plugin 的支援或不支援 MCP 與 LSP server 項目。

Marketplace source 可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude known-marketplace 名稱、本機 marketplace root 或 `marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub shorthand、GitHub repo URL，或 git URL。對於遠端 marketplace，Plugin 項目必須留在複製的 marketplace repo 內，且只能使用相對路徑 source。

完整細節請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概觀

Native Plugin 會匯出一個 entry object，該 object 暴露 `register(api)`。較舊的 Plugin 可能仍使用 `activate(api)` 作為舊版 alias，但新的 Plugin 應使用 `register`。

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

OpenClaw 會載入 entry object，並在 Plugin activation 期間呼叫 `register(api)`。loader 仍會對較舊的 Plugin fallback 到 `activate(api)`，但隨附的 Plugin 與新的外部 Plugin 應將 `register` 視為公開 contract。

`api.registrationMode` 會告訴 Plugin 其 entry 為何被載入：

| 模式            | 意義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 執行階段啟用。註冊工具、hook、服務、命令、路由，以及其他即時副作用。                              |
| `discovery`     | 唯讀功能探索。註冊提供者與中繼資料；受信任的 Plugin 入口程式碼可能會載入，但會略過即時副作用。 |
| `setup-only`    | 透過輕量設定入口載入頻道設定中繼資料。                                                                |
| `setup-runtime` | 也需要執行階段入口的頻道設定載入。                                                                         |
| `cli-metadata`  | 僅收集 CLI 命令中繼資料。                                                                                            |

會開啟 socket、資料庫、背景工作程式或長生命週期用戶端的 Plugin 入口，
應使用 `api.registrationMode === "full"` 保護這些副作用。
探索載入會與啟用載入分開快取，且不會取代正在執行的 Gateway 登錄表。
探索不會啟用，但並非免匯入：
OpenClaw 可能會評估受信任的 Plugin 入口或頻道 Plugin 模組以建立
快照。保持模組頂層輕量且無副作用，並將
網路用戶端、子處理程序、監聽器、憑證讀取與服務啟動
移到完整執行階段路徑後方。

常見註冊方法：

| 方法                                  | 註冊內容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供者 (LLM)        |
| `registerChannel`                       | 聊天頻道                |
| `registerTool`                          | 代理工具                  |
| `registerHook` / `on(...)`              | 生命週期 hook             |
| `registerSpeechProvider`                | 文字轉語音 / STT        |
| `registerRealtimeTranscriptionProvider` | 串流 STT               |
| `registerRealtimeVoiceProvider`         | 雙工即時語音       |
| `registerMediaUnderstandingProvider`    | 圖片/音訊分析        |
| `registerImageGenerationProvider`       | 圖片生成            |
| `registerMusicGenerationProvider`       | 音樂生成            |
| `registerVideoGenerationProvider`       | 影片生成            |
| `registerWebFetchProvider`              | 網頁擷取 / 擷取提供者 |
| `registerWebSearchProvider`             | 網頁搜尋                  |
| `registerHttpRoute`                     | HTTP 端點               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | 背景服務          |

型別化生命週期 hook 的 hook 防護行為：

- `before_tool_call`: `{ block: true }` 是終止條件；會略過較低優先順序的處理常式。
- `before_tool_call`: `{ block: false }` 是無操作，且不會清除先前的封鎖。
- `before_install`: `{ block: true }` 是終止條件；會略過較低優先順序的處理常式。
- `before_install`: `{ block: false }` 是無操作，且不會清除先前的封鎖。
- `message_sending`: `{ cancel: true }` 是終止條件；會略過較低優先順序的處理常式。
- `message_sending`: `{ cancel: false }` 是無操作，且不會清除先前的取消。

原生 Codex app-server 會將 Codex 原生工具事件橋接回這個
hook 介面。Plugins 可以透過 `before_tool_call` 封鎖原生 Codex 工具，
透過 `after_tool_call` 觀察結果，並參與 Codex
`PermissionRequest` 核准。此橋接器尚不會重寫 Codex 原生工具
引數。確切的 Codex 執行階段支援邊界位於
[Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

完整的型別化 hook 行為，請參閱 [SDK 概觀](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 plugins](/zh-TW/plugins/building-plugins) — 建立你自己的 Plugin
- [Plugin bundle](/zh-TW/plugins/bundles) — Codex/Claude/Cursor bundle 相容性
- [Plugin manifest](/zh-TW/plugins/manifest) — manifest 結構描述
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) — 在 Plugin 中新增代理工具
- [Plugin 內部架構](/zh-TW/plugins/architecture) — 功能模型與載入管線
- [社群 plugins](/zh-TW/plugins/community) — 第三方列表
