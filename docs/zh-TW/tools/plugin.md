---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件包
sidebarTitle: Install and Configure
summary: 安裝、設定並管理 OpenClaw Plugin
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:54:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Plugin 會以新功能擴充 OpenClaw：channels、model providers、
agent harnesses、tools、skills、speech、realtime transcription、realtime
voice、media-understanding、image generation、video generation、web fetch、web
search，以及更多功能。有些 Plugin 是 **core**（隨 OpenClaw 出貨），其他則是
**external**。大多數 external Plugin 會透過
[ClawHub](/zh-TW/tools/clawhub) 發布與探索。Npm 仍支援直接安裝，也會暫時支援一組
OpenClaw 擁有的 Plugin 套件，直到該遷移完成。

## 快速開始

如需可直接複製貼上的安裝、列出、解除安裝、更新與發布範例，請參閱
[管理 Plugin](/zh-TW/plugins/manage-plugins)。

<Steps>
  <Step title="查看已載入項目">
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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

    然後在設定檔中的 `plugins.entries.\<id\>.config` 底下進行設定。

  </Step>

  <Step title="聊天原生管理">
    在執行中的 Gateway 內，僅限擁有者使用的 `/plugins enable` 與 `/plugins disable`
    會觸發 Gateway 設定重新載入器。Gateway 會在程序內重新載入 Plugin runtime
    surface，而新的 agent turn 會從重新整理後的 registry 重建其工具清單。`/plugins install`
    會變更 Plugin 原始碼，因此 Gateway 會要求重新啟動，而不是假裝目前程序可以安全地重新載入已匯入的模組。

  </Step>

  <Step title="驗證 Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、gateway 方法、hooks，或 Plugin 擁有的 CLI
    命令時，請使用 `--runtime`。普通的 `inspect` 是冷啟動的
    manifest/registry 檢查，且會刻意避免匯入 Plugin runtime。

  </Step>
</Steps>

如果你偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的解析器：本機路徑/封存檔、明確的
`clawhub:<pkg>`、明確的 `npm:<pkg>`、明確的 `npm-pack:<path.tgz>`、
明確的 `git:<repo>`，或透過 npm 使用裸套件規格。

如果設定無效，安裝通常會封閉失敗，並指向
`openclaw doctor --fix`。唯一的復原例外是一條狹窄的 bundled-plugin
重新安裝路徑，適用於選擇加入
`openclaw.install.allowInvalidConfigRecovery` 的 Plugin。
在 Gateway 啟動期間，無效的 Plugin 設定會像任何其他無效設定一樣封閉失敗。
執行 `openclaw doctor --fix` 可透過停用該 Plugin entry 並移除其無效設定 payload
來隔離不良 Plugin 設定；一般設定備份會保留先前的值。
當 channel 設定參照已無法探索的 Plugin，但相同的過時 Plugin id 仍留在 Plugin
設定或安裝記錄中時，Gateway 啟動會記錄警告並略過該 channel，而不是封鎖所有其他 channel。
執行 `openclaw doctor --fix` 可移除過時的 channel/Plugin entry；沒有過時 Plugin
證據的未知 channel key 仍會驗證失敗，讓拼寫錯誤保持可見。
如果設定了 `plugins.enabled: false`，過時的 Plugin 參照會被視為惰性：
Gateway 啟動會略過 Plugin 探索/載入工作，而 `openclaw doctor` 會保留已停用的 Plugin
設定，而不是自動移除它。如果你想移除過時的 Plugin id，請先重新啟用 Plugin 再執行 doctor 清理。

Plugin 相依性安裝只會在明確的安裝/更新或 doctor 修復流程中發生。Gateway 啟動、設定重新載入與 runtime
檢查不會執行套件管理器，也不會修復相依性樹。本機 Plugin 必須已安裝其相依性，而 npm、git 與 ClawHub Plugin
會安裝在 OpenClaw 管理的 Plugin root 底下。npm 相依性可能會在 OpenClaw 管理的 npm root
內提升；安裝/更新會先掃描該受管理 root，再進行信任判定，而解除安裝會透過 npm 移除 npm 管理的套件。External Plugin
與自訂載入路徑仍必須透過 `openclaw plugins install` 安裝。
使用 `openclaw plugins list --json` 可查看每個可見 Plugin 的靜態 `dependencyStatus`，
而不匯入 runtime code 或修復相依性。
請參閱 [Plugin 相依性解析](/zh-TW/plugins/dependency-resolution) 了解安裝時 lifecycle。

### 被封鎖的 Plugin 路徑擁有權

如果 Plugin 診斷顯示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且設定驗證接著顯示 `plugin present but blocked`，表示 OpenClaw 找到由不同 Unix 使用者擁有的 Plugin 檔案，而該使用者不同於載入它們的程序使用者。請保留 Plugin 設定；修正檔案系統擁有權，或以擁有 state directory 的同一使用者執行 OpenClaw。

對於 Docker 安裝，官方映像檔會以 `node`（uid `1000`）執行，因此主機 bind-mounted 的 OpenClaw 設定與 workspace 目錄通常應由 uid `1000` 擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你刻意以 root 執行 OpenClaw，請改為將受管理的 Plugin root 修復為 root 擁有權：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正擁有權後，重新執行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，讓持久化的 Plugin registry 與已修復的檔案一致。

對於 npm 安裝，`latest` 或 dist-tag 這類可變 selector 會在安裝前解析，然後固定到 OpenClaw
管理的 npm root 中已精確驗證的版本。npm 完成後，OpenClaw 會驗證已安裝的
`package-lock.json` entry 仍符合解析版本與完整性。如果 npm 寫入不同的套件 metadata，安裝會失敗，受管理套件會回復，而不是接受不同的 Plugin artifact。
受管理的 npm root 也會繼承 OpenClaw 套件層級的 npm `overrides`，因此保護封裝 host 的安全性 pin 也會套用到提升的 external Plugin 相依性。

Source checkout 是 pnpm workspace。如果你 clone OpenClaw 來修改 bundled Plugin，請執行 `pnpm install`；OpenClaw 接著會從
`extensions/<id>` 載入 bundled Plugin，讓編輯內容與套件本機相依性直接被使用。
普通的 npm root 安裝適用於封裝版 OpenClaw，而不是 source checkout 開發。

## Plugin 類型

OpenClaw 識別兩種 Plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module；在程序內執行              | 官方 Plugin、社群 npm 套件                             |
| **Bundle** | Codex/Claude/Cursor 相容配置；對應到 OpenClaw 功能                 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會顯示在 `openclaw plugins list` 底下。Bundle 詳情請參閱 [Plugin Bundles](/zh-TW/plugins/bundles)。

如果你正在撰寫 native Plugin，請從 [建置 Plugin](/zh-TW/plugins/building-plugins)
與 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview) 開始。

## 套件 entrypoint

Native Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個 entry 都必須留在套件目錄內，並解析為可讀取的 runtime 檔案，或解析為 TypeScript 原始檔，且具有推斷出的已建置 JavaScript
peer，例如 `src/index.ts` 對應 `dist/index.js`。
封裝安裝必須出貨該 JavaScript runtime 輸出。TypeScript 原始檔 fallback 適用於 source checkout 與本機開發路徑，不適用於安裝到 OpenClaw 受管理 Plugin root 的 npm 套件。

如果受管理套件警告指出它 `requires compiled runtime output for
TypeScript entry ...`，表示該套件發布時缺少 OpenClaw 在 runtime 需要的 JavaScript 檔案。這是 Plugin 封裝問題，不是本機設定問題。請在發布者重新發布已編譯的 JavaScript 後更新或重新安裝 Plugin，或停用/解除安裝該 Plugin，直到可用的修正版套件發布。

當已發布 runtime 檔案的位置與原始 entry 不同時，請使用 `openclaw.runtimeExtensions`。存在時，`runtimeExtensions` 必須為每個 `extensions` entry
包含精確的一個 entry。清單不一致會導致安裝與 Plugin 探索失敗，而不是悄悄 fallback 到原始路徑。如果你也發布 `openclaw.setupEntry`，請為其已建置 JavaScript peer 使用 `openclaw.runtimeSetupEntry`；宣告該檔案時，它就是必要檔案。

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

ClawHub 是大多數 Plugin 的主要散布路徑。目前封裝版 OpenClaw 版本已經 bundle 許多官方 Plugin，因此在一般設定中不需要另外安裝 npm。直到所有 OpenClaw 擁有的 Plugin 都遷移到 ClawHub 之前，OpenClaw 仍會在 npm 上發布一些 `@openclaw/*` Plugin 套件，以支援較舊/自訂安裝與直接 npm workflow。

如果 npm 將某個 `@openclaw/*` Plugin 套件回報為 deprecated，表示該套件版本來自較舊的 external package train。請使用目前 OpenClaw 隨附的 bundled Plugin 或本機 checkout，直到較新的 npm 套件發布。

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
    - `memory-core` - 內建記憶體搜尋（預設透過 `plugins.slots.memory`）
    - `memory-lancedb` - 以 LanceDB 為後端、具備自動回想/擷取的長期記憶體（設定 `plugins.slots.memory = "memory-lancedb"`）

    請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb)，了解 OpenAI 相容的
    embedding 設定、Ollama 範例、回想限制與疑難排解。

  </Accordion>

  <Accordion title="語音提供者（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` - 用於瀏覽器工具、`openclaw browser` CLI、`browser.request` gateway 方法、瀏覽器執行階段，以及預設瀏覽器控制服務的內建瀏覽器 Plugin（預設啟用；替換前請先停用）
    - `copilot-proxy` - VS Code Copilot Proxy 橋接器（預設停用）

  </Accordion>
</AccordionGroup>

正在尋找第三方 Plugin？請參閱 [社群 Plugin](/zh-TW/plugins/community)。

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

| 欄位               | 說明                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | 主要切換開關（預設：`true`）                             |
| `allow`            | Plugin 允許清單（選用）                                  |
| `bundledDiscovery` | 內建 Plugin 探索模式（預設為 `allowlist`）               |
| `deny`             | Plugin 拒絕清單（選用；拒絕優先）                        |
| `load.paths`       | 額外的 Plugin 檔案/目錄                                  |
| `slots`            | 排他插槽選擇器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>`   | 個別 Plugin 的切換開關與設定                             |

`plugins.allow` 是排他的。當它非空時，只有列出的 Plugin 可以載入
或公開工具，即使 `tools.allow` 包含 `"*"` 或特定 Plugin 擁有的
工具名稱也是如此。如果工具允許清單參照 Plugin 工具，請將擁有該工具的 Plugin id
加入 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會針對這種
結構發出警告。

新設定中的 `plugins.bundledDiscovery` 預設為 `"allowlist"`，因此
限制性的 `plugins.allow` 清單也會封鎖未列出的內建提供者
Plugin，包括執行階段網頁搜尋提供者探索。Doctor 會在遷移期間，將較舊的
限制性允許清單設定標記為 `"compat"`，讓升級保留舊版內建提供者行為，
直到操作員選擇採用更嚴格的模式為止。
空的 `plugins.allow` 仍會被視為未設定/開放。

透過 `/plugins enable` 或 `/plugins disable` 做出的設定變更會觸發
同一行程內的 Gateway Plugin 重新載入。新的代理回合會從
重新整理後的 Plugin 登錄檔重建其工具清單。安裝、
更新和解除安裝等會變更來源的操作仍會重新啟動 Gateway 行程，因為已匯入的
Plugin 模組無法安全地就地替換。

`openclaw plugins list` 是本機 Plugin 登錄檔/設定快照。當中顯示
`enabled` 的 Plugin，表示持久化登錄檔和目前設定允許該
Plugin 參與。這不代表已在執行中的遠端 Gateway
已重新載入或重新啟動到相同的 Plugin 程式碼。在具有包裝行程的 VPS/容器設定中，
請將重新啟動或會觸發重新載入的寫入送往實際的
`openclaw gateway run` 行程，或在重新載入回報失敗時，對執行中的
Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin 狀態：已停用、缺失與無效">
  - **已停用**：Plugin 存在，但啟用規則將其關閉。設定會保留。
  - **缺失**：設定參照了探索程序找不到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的 schema。Gateway 啟動時只會略過該 Plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定 payload，隔離無效項目。

</Accordion>

## 探索與優先順序

OpenClaw 會依照以下順序掃描 Plugin（第一個符合者勝出）：

<Steps>
  <Step title="設定路徑">
    `plugins.load.paths` - 明確的檔案或目錄路徑。指回
    OpenClaw 自身封裝內建 Plugin 目錄的路徑會被忽略；
    執行 `openclaw doctor --fix` 以移除這些過時別名。
  </Step>

  <Step title="工作區 Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全域 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="內建 Plugin">
    隨 OpenClaw 一起提供。許多預設啟用（模型提供者、語音）。
    其他則需要明確啟用。
  </Step>
</Steps>

封裝安裝與 Docker 映像通常會從已編譯的
`dist/extensions` 樹解析內建 Plugin。如果內建 Plugin 原始碼目錄
被 bind-mounted 到相符的封裝原始碼路徑上，例如
`/app/extensions/synology-chat`，OpenClaw 會將該掛載的原始碼目錄
視為內建原始碼覆蓋層，並在封裝的
`/app/dist/extensions/synology-chat` bundle 之前探索它。這讓維護者容器
迴圈能正常運作，而不必將每個內建 Plugin 都切回 TypeScript 原始碼。
設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist bundle，
即使存在原始碼覆蓋掛載也一樣。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 永遠優先於 allow
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 來自工作區的 Plugin **預設停用**（必須明確啟用）
- 內建 Plugin 會遵循內建的預設開啟集合，除非被覆寫
- 排他插槽可以強制啟用該插槽所選的 Plugin
- 當設定命名了 Plugin 擁有的介面時，部分需要選擇加入的內建 Plugin
  會自動啟用，例如提供者模型參照、頻道設定或 harness
  執行階段
- 當 `plugins.enabled: false` 啟用時，過時的 Plugin 設定會保留；
  如果你想移除過時 id，請先重新啟用 Plugin，再執行 doctor 清理
- OpenAI 系列 Codex 路由會保留分離的 Plugin 邊界：
  `openai-codex/*` 屬於 OpenAI Plugin，而內建 Codex
  app-server Plugin 則由 `agentRuntime.id: "codex"` 或舊版
  `codex/*` 模型參照選取

## 疑難排解執行階段 hook

如果某個 Plugin 出現在 `plugins list`，但 `register(api)` 副作用或 hook
沒有在即時聊天流量中執行，請先檢查以下項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的
  Gateway URL、profile、設定路徑與行程就是你正在編輯的項目。
- 在 Plugin 安裝/設定/程式碼變更後重新啟動即時 Gateway。在包裝器
  容器中，PID 1 可能只是 supervisor；請重新啟動或向子
  `openclaw gateway run` 行程傳送訊號。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook 註冊與
  diagnostics。非內建的對話 hook，例如 `before_model_resolve`、
  `before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、
  `before_agent_finalize` 和 `agent_end` 需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 若要切換模型，請優先使用 `before_model_resolve`。它會在代理回合的模型
  解析之前執行；`llm_output` 只有在模型嘗試產生助理輸出後才會執行。
- 若要證明有效的工作階段模型，請使用 `openclaw sessions` 或
  Gateway 工作階段/狀態介面；在偵錯提供者 payload 時，請使用
  `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### 緩慢的 Plugin 工具設定

如果代理回合似乎在準備工具時停滯，請啟用 trace 記錄並
檢查 Plugin 工具 factory 計時列：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出 factory 總耗時與最慢的 Plugin 工具 factory，
包括 Plugin id、宣告的工具名稱、結果形狀，以及該工具是否為
選用。當單一 factory 耗時至少 1 秒，或 Plugin 工具 factory 準備總耗時至少 5 秒時，
緩慢列會提升為警告。

OpenClaw 會針對相同有效請求情境下的重複解析，快取成功的 Plugin 工具 factory 結果。
快取鍵包含有效的執行階段設定、工作區、代理/工作階段 id、sandbox policy、瀏覽器設定、
delivery context、requester identity 與 ownership state，因此依賴這些受信任欄位的
factory 會在情境變更時重新執行。

如果某個 Plugin 佔用了大部分耗時，請檢查其執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然後更新、重新安裝或停用該 Plugin。Plugin 作者應該將
昂貴的依賴載入移到工具執行路徑之後，而不是在工具 factory 中進行。

### 重複的頻道或工具擁有權

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這表示有多個已啟用的 Plugin 正試圖擁有相同的頻道、
設定流程或工具名稱。最常見的原因是外部頻道 Plugin
安裝在旁邊，而某個內建 Plugin 現在也提供相同的頻道 id。

偵錯步驟：

- 執行 `openclaw plugins list --enabled --verbose`，查看每個已啟用的 Plugin
  及其來源。
- 對每個疑似 Plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並
  比較 `channels`、`channelConfigs`、`tools` 與 diagnostics。
- 安裝或移除 Plugin 套件後，執行 `openclaw plugins registry --refresh`，
  讓持久化 metadata 反映目前安裝。
- 在安裝、登錄檔或設定變更後重新啟動 Gateway。

修正選項：

- 如果某個 Plugin 有意取代另一個相同 channel id 的 Plugin，
  偏好的 Plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並填入
  較低優先順序的 Plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成，請使用
  `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過時的 Plugin
  安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該請求並
  回報衝突。請為該頻道選擇一個擁有者，或重新命名 Plugin 擁有的
  工具，讓執行階段介面不會產生歧義。

## Plugin 插槽（排他類別）

某些類別是排他的（一次只能有一個作用中）：

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

| 插槽            | 控制內容             | 預設                |
| --------------- | -------------------- | ------------------- |
| `memory`        | 作用中的記憶體 Plugin | `memory-core`       |
| `contextEngine` | 作用中的 context engine | `legacy`（內建） |

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

隨附的 Plugin 會與 OpenClaw 一起提供。許多預設為啟用（例如隨附的模型提供者、隨附的語音提供者，以及隨附的瀏覽器 Plugin）。其他隨附的 Plugin 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫既有已安裝的 Plugin 或 hook pack。對於受追蹤 npm Plugin 的例行升級，請使用 `openclaw plugins update <id-or-npm-spec>`。它不支援搭配 `--link`，因為 `--link` 會重複使用來源路徑，而不是複製到受管理的安裝目標上。

當 `plugins.allow` 已設定時，`openclaw plugins install` 會在啟用已安裝的 Plugin 之前，將該 Plugin id 加入該允許清單。如果相同的 Plugin id 存在於 `plugins.deny`，安裝會移除該過時的拒絕項目，讓明確安裝的項目在重新啟動後可立即載入。

OpenClaw 會保留一個持久化的本機 Plugin registry，作為 Plugin 清單、貢獻歸屬與啟動規劃的冷讀取模型。安裝、更新、解除安裝、啟用與停用流程會在變更 Plugin 狀態後重新整理該 registry。同一個 `plugins/installs.json` 檔案會在頂層 `installRecords` 保留持久安裝中繼資料，並在 `plugins` 保留可重建的 manifest 中繼資料。如果 registry 遺失、過時或無效，`openclaw plugins registry --refresh` 會從安裝記錄、設定政策與 manifest/package 中繼資料重建其 manifest 檢視，而不載入 Plugin 執行階段模組。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，Plugin 生命週期變更操作會被停用。請改為透過該安裝的 Nix 來源管理 Plugin package 選擇與設定；若使用 nix-openclaw，請從 agent-first 的 [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) 開始。`openclaw plugins update <id-or-npm-spec>` 適用於受追蹤的安裝。傳入含有 dist-tag 或精確版本的 npm package spec，會將 package 名稱解析回受追蹤的 Plugin 記錄，並記錄新的 spec 供未來更新使用。傳入不含版本的 package 名稱，會將精確釘選的安裝移回 registry 的預設發行線。如果已安裝的 npm Plugin 已符合解析後的版本與已記錄的 artifact identity，OpenClaw 會略過更新，不下載、不重新安裝，也不重寫設定。當 `openclaw update` 在 beta channel 上執行時，預設線 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，並在沒有 Plugin beta release 時退回 default/latest。精確版本與明確標籤會維持釘選。

OpenClaw 尚未公開 LTS 或月度支援 Plugin channel。規劃中的月度支援線工作，需要 Plugin npm 與 ClawHub 標籤遵循與核心 package 相同的支援線，而不是默默使用 `latest`。

`--pin` 僅適用於 npm。它不支援搭配 `--marketplace`，因為 marketplace 安裝會持久保存 marketplace 來源中繼資料，而不是 npm spec。

`--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的緊急覆寫。它允許 Plugin 安裝與 Plugin 更新在內建 `critical` 發現項目之後繼續，但仍不會繞過 Plugin `before_install` 政策阻擋或掃描失敗阻擋。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 與 `*.spec.*`，避免封裝的測試 mock 造成阻擋；宣告的 Plugin 執行階段進入點即使使用其中一種名稱，仍會被掃描。

這個 CLI 旗標只適用於 Plugin 安裝/更新流程。Gateway 支援的 skill 相依安裝會改用相符的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

如果你在 ClawHub 發布的 Plugin 因掃描而被隱藏或阻擋，請開啟 ClawHub dashboard，或執行 `clawhub package rescan <name>` 要求 ClawHub 重新檢查。`--dangerously-force-unsafe-install` 只影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描該 Plugin，也不會讓被阻擋的 release 公開。

相容 bundle 會參與相同的 Plugin list/inspect/enable/disable 流程。目前的執行階段支援包含 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的 bundle capability，以及 bundle-backed Plugin 支援或不支援的 MCP 與 LSP server 項目。

Marketplace 來源可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱、本機 marketplace root 或 `marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。對於遠端 marketplace，Plugin 項目必須留在 cloned marketplace repo 內，且只能使用相對路徑來源。

完整詳細資訊請參閱 [`openclaw plugins` CLI reference](/zh-TW/cli/plugins)。

## Plugin API 概觀

原生 Plugin 會匯出一個公開 `register(api)` 的 entry object。較舊的 Plugin 仍可能使用 `activate(api)` 作為舊版 alias，但新的 Plugin 應使用 `register`。

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

OpenClaw 會載入 entry object，並在 Plugin 啟用期間呼叫 `register(api)`。loader 仍會針對較舊的 Plugin 退回使用 `activate(api)`，但隨附的 Plugin 與新的外部 Plugin 應將 `register` 視為公開契約。

`api.registrationMode` 會告訴 Plugin 其 entry 為何被載入：

| 模式            | 意義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 執行階段啟用。註冊工具、hook、服務、命令、route 與其他即時副作用。                              |
| `discovery`     | 唯讀 capability discovery。註冊提供者與中繼資料；受信任的 Plugin entry code 可能會載入，但應略過即時副作用。 |
| `setup-only`    | 透過輕量 setup entry 載入 channel setup 中繼資料。                                                                |
| `setup-runtime` | 也需要 runtime entry 的 channel setup 載入。                                                                         |
| `cli-metadata`  | 僅收集 CLI 命令中繼資料。                                                                                            |

會開啟 socket、資料庫、背景 worker 或長生命週期 client 的 Plugin entry，應以 `api.registrationMode === "full"` 保護這些副作用。Discovery 載入會與啟用載入分開快取，且不會取代正在執行的 Gateway registry。Discovery 是非啟用的，但不是免 import：OpenClaw 可能會評估受信任的 Plugin entry 或 channel Plugin 模組以建立 snapshot。請讓模組頂層保持輕量且無副作用，並將 network client、subprocess、listener、credential 讀取與 service startup 移到 full-runtime 路徑後方。

常見註冊方法：

| 方法                                  | 註冊內容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供者（LLM）        |
| `registerChannel`                       | 聊天 channel                |
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
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI commands                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | 背景服務          |

typed lifecycle hook 的 hook guard 行為：

- `before_tool_call`: `{ block: true }` 為終止狀態；較低優先順序的 handler 會被略過。
- `before_tool_call`: `{ block: false }` 為 no-op，且不會清除先前的 block。
- `before_install`: `{ block: true }` 為終止狀態；較低優先順序的 handler 會被略過。
- `before_install`: `{ block: false }` 為 no-op，且不會清除先前的 block。
- `message_sending`: `{ cancel: true }` 為終止狀態；較低優先順序的 handler 會被略過。
- `message_sending`: `{ cancel: false }` 為 no-op，且不會清除先前的 cancel。

原生 Codex app-server 執行會將 Codex 原生工具事件橋接回這個
hook 介面。Plugin 可以透過 `before_tool_call` 封鎖原生 Codex 工具、
透過 `after_tool_call` 觀察結果，並參與 Codex
`PermissionRequest` 核准。此橋接尚未重寫 Codex 原生工具
引數。確切的 Codex 執行階段支援邊界位於
[Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

如需完整的型別化 hook 行為，請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) - 建立你自己的 Plugin
- [Plugin 套件組合](/zh-TW/plugins/bundles) - Codex/Claude/Cursor 套件組合相容性
- [Plugin manifest](/zh-TW/plugins/manifest) - manifest 結構描述
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) - 在 Plugin 中新增代理工具
- [Plugin 內部機制](/zh-TW/plugins/architecture) - 能力模型與載入管線
- [社群 Plugin](/zh-TW/plugins/community) - 第三方列表
