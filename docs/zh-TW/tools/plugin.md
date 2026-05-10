---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件包
sidebarTitle: Install and Configure
summary: 安裝、設定並管理 OpenClaw Plugin
title: Plugins
x-i18n:
    generated_at: "2026-05-10T19:54:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Plugin 透過新功能擴充 OpenClaw：頻道、模型提供者、
代理 harness、工具、Skills、語音、即時轉錄、即時
語音、媒體理解、影像生成、影片生成、網頁擷取、網頁
搜尋，以及更多功能。有些 Plugin 是 **core**（隨 OpenClaw 發行），其他
則是 **external**。多數 external Plugin 會透過
[ClawHub](/zh-TW/clawhub) 發布與探索。Npm 仍支援直接安裝，也支援一組
暫時的 OpenClaw 自有 Plugin 套件，直到該遷移完成。

## 快速開始

若要複製貼上的安裝、列出、解除安裝、更新與發布範例，請參閱
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

    接著在你的設定檔中的 `plugins.entries.\<id\>.config` 下進行設定。

  </Step>

  <Step title="聊天原生管理">
    在執行中的 Gateway 中，僅限 owner 的 `/plugins enable` 與 `/plugins disable`
    會觸發 Gateway 設定重新載入器。Gateway 會在程序內重新載入 Plugin runtime
    surfaces，而新的代理回合會從已重新整理的 registry 重新建立其工具清單。
    `/plugins install` 會變更 Plugin 原始碼，因此 Gateway 會要求重新啟動，
    而不是假裝目前程序可以安全地重新載入已匯入的模組。

  </Step>

  <Step title="驗證 Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、gateway
    方法、hook，或 Plugin 擁有的 CLI 命令時，請使用 `--runtime`。一般的 `inspect`
    是 cold manifest/registry 檢查，並且刻意避免匯入 Plugin runtime。

  </Step>
</Steps>

如果你偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的 resolver：本機路徑/archive、明確的
`clawhub:<pkg>`、明確的 `npm:<pkg>`、明確的 `npm-pack:<path.tgz>`、
明確的 `git:<repo>`，或透過 npm 的裸套件規格。

如果設定無效，安裝通常會 fail closed，並指引你執行
`openclaw doctor --fix`。唯一的 recovery 例外，是針對選擇加入
`openclaw.install.allowInvalidConfigRecovery` 的 Plugin 的狹義 bundled-plugin
重新安裝路徑。
在 Gateway 啟動期間，無效的 Plugin 設定會像任何其他無效設定一樣 fail closed。
執行 `openclaw doctor --fix`，即可透過停用該 Plugin entry 並移除其無效設定 payload，
來隔離有問題的 Plugin 設定；一般設定備份會保留先前的值。
當頻道設定參照的 Plugin 已無法探索，但相同的過期 Plugin id 仍留在 Plugin 設定或安裝記錄中時，
Gateway 啟動會記錄警告並略過該頻道，而不是阻擋所有其他頻道。
執行 `openclaw doctor --fix` 以移除過期的 channel/plugin entry；沒有 stale-plugin 證據的未知
channel key 仍會驗證失敗，讓拼字錯誤保持可見。
如果設定了 `plugins.enabled: false`，過期的 Plugin 參照會被視為 inert：
Gateway 啟動會略過 Plugin discovery/load 工作，而 `openclaw doctor` 會保留
已停用的 Plugin 設定，而不是自動移除它。如果你想移除過期的 Plugin id，
請先重新啟用 Plugin，再執行 doctor cleanup。

Plugin 相依性安裝只會在明確的 install/update 或 doctor repair 流程中發生。
Gateway 啟動、設定重新載入與 runtime 檢查不會執行 package manager 或修復相依性樹。
本機 Plugin 必須已安裝其相依性，而 npm、git 與 ClawHub Plugin 則會安裝在
OpenClaw 的受管理 Plugin root 下。npm 相依性可能會在 OpenClaw 的受管理 npm root 內被 hoist；
install/update 會先掃描該受管理 root，再進行 trust，而 uninstall 會透過 npm 移除 npm-managed 套件。
External Plugin 與自訂載入路徑仍必須透過 `openclaw plugins install` 安裝。
使用 `openclaw plugins list --json` 可查看每個可見 Plugin 的靜態 `dependencyStatus`，
且不會匯入 runtime code 或修復相依性。
請參閱 [Plugin 相依性解析](/zh-TW/plugins/dependency-resolution) 了解
install-time lifecycle。

### 被封鎖的 Plugin 路徑所有權

如果 Plugin diagnostics 顯示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且 config validation 隨後顯示 `plugin present but blocked`，OpenClaw 發現
Plugin 檔案是由不同於載入它們之程序的 Unix 使用者擁有。
請保留 Plugin 設定；修正檔案系統所有權，或以擁有 state directory 的相同使用者執行
OpenClaw。

對於 Docker 安裝，官方 image 會以 `node`（uid `1000`）執行，因此
host bind-mounted OpenClaw 設定與 workspace 目錄通常應由 uid `1000` 擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你刻意以 root 執行 OpenClaw，請改為將受管理 Plugin root 修復為
root 所有權：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正所有權後，請重新執行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，讓持久化的 Plugin registry 符合
已修復的檔案。

對於 npm 安裝，像 `latest` 或 dist-tag 這類可變 selector 會先解析再安裝，
然後 pinned 到 OpenClaw 受管理 npm root 中經精確驗證的版本。npm 完成後，
OpenClaw 會驗證已安裝的 `package-lock.json` entry 仍符合解析出的版本與 integrity。
如果 npm 寫入不同的 package metadata，安裝會失敗，且受管理套件會被回復，
而不是接受不同的 Plugin artifact。
受管理 npm root 也會繼承 OpenClaw package-level npm `overrides`，因此
保護 packaged host 的安全 pin 也會套用到被 hoist 的 external
Plugin 相依性。

Source checkout 是 pnpm workspace。如果你 clone OpenClaw 以修改 bundled
Plugin，請執行 `pnpm install`；OpenClaw 接著會從
`extensions/<id>` 載入 bundled Plugin，因此會直接使用編輯內容與 package-local 相依性。
一般 npm root 安裝是給 packaged OpenClaw 使用，不是給 source checkout
開發使用。

## Plugin 類型

OpenClaw 識別兩種 Plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module；在程序內執行              | 官方 Plugin、社群 npm 套件                             |
| **Bundle** | Codex/Claude/Cursor 相容 layout；對應到 OpenClaw 功能              | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會出現在 `openclaw plugins list` 下。請參閱 [Plugin Bundle](/zh-TW/plugins/bundles) 了解 bundle 詳細資訊。

如果你正在撰寫 native Plugin，請從 [建置 Plugin](/zh-TW/plugins/building-plugins)
與 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview) 開始。

## Package entrypoint

Native Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個 entry 都必須留在 package directory 內，並解析為可讀取的
runtime file，或解析為 TypeScript source file，且有推斷出的 built JavaScript
peer，例如 `src/index.ts` 到 `dist/index.js`。
Packaged install 必須隨附該 JavaScript runtime output。TypeScript
source fallback 是供 source checkout 與本機開發路徑使用，不是給安裝到 OpenClaw
受管理 Plugin root 的 npm 套件使用。

如果受管理套件警告指出它 `requires compiled runtime output for
TypeScript entry ...`，代表該套件發布時缺少 OpenClaw 在 runtime 需要的 JavaScript 檔案。
這是 Plugin packaging 問題，不是本機設定問題。
請在發布者重新發布已編譯的 JavaScript 後更新或重新安裝該 Plugin，
或停用/解除安裝該 Plugin，直到修正版套件可用。

當已發布的 runtime file 與 source entry 不在相同路徑時，請使用 `openclaw.runtimeExtensions`。
當存在時，`runtimeExtensions` 必須為每個 `extensions` entry 包含
正好一個 entry。不相符的清單會讓 install 與 Plugin discovery 失敗，
而不是靜默 fallback 到 source path。如果你也發布 `openclaw.setupEntry`，
請使用 `openclaw.runtimeSetupEntry` 作為其 built JavaScript peer；宣告時該檔案為必要。

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

### 遷移期間的 OpenClaw-owned npm 套件

ClawHub 是多數 Plugin 的主要發布路徑。目前的 packaged
OpenClaw release 已內建許多官方 Plugin，因此在一般設定中不需要
額外的 npm 安裝。在每個 OpenClaw-owned Plugin 都遷移到 ClawHub 之前，
OpenClaw 仍會在 npm 上發布一些 `@openclaw/*` Plugin 套件，
供較舊/自訂安裝與直接 npm workflow 使用。

如果 npm 回報某個 `@openclaw/*` Plugin 套件已 deprecated，該套件版本
來自較舊的 external package train。請使用目前 OpenClaw 內建的 Plugin
或本機 checkout，直到較新的 npm 套件發布。

| Plugin          | 套件                       | 文件                                       |
| --------------- | -------------------------- | ------------------------------------------ |
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

### Core（隨 OpenClaw 發行）

<AccordionGroup>
  <Accordion title="模型提供者（預設啟用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` - 內建記憶搜尋（預設透過 `plugins.slots.memory`）
    - `memory-lancedb` - 由 LanceDB 支援、具備自動召回/擷取的長期記憶（設定 `plugins.slots.memory = "memory-lancedb"`）

    請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb)，了解 OpenAI 相容的
    embedding 設定、Ollama 範例、召回限制與疑難排解。

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - 內建瀏覽器 Plugin，供瀏覽器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、瀏覽器執行階段與預設瀏覽器控制服務使用（預設啟用；替換前請先停用）
    - `copilot-proxy` - VS Code Copilot Proxy 橋接（預設停用）

  </Accordion>
</AccordionGroup>

正在尋找第三方 Plugin？請參閱 [ClawHub](/zh-TW/clawhub)。

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
| `enabled`          | 主開關（預設：`true`）                                   |
| `allow`            | Plugin 允許清單（選用）                                  |
| `bundledDiscovery` | 內建 Plugin 探索模式（預設為 `allowlist`）               |
| `deny`             | Plugin 拒絕清單（選用；拒絕優先）                        |
| `load.paths`       | 額外的 Plugin 檔案/目錄                                  |
| `slots`            | 排他插槽選擇器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>`   | 個別 Plugin 開關 + 設定                                  |

`plugins.allow` 是排他的。當它非空時，只有列出的 Plugin 可以載入或公開工具，即使 `tools.allow` 包含 `"*"` 或特定 Plugin 擁有的工具名稱也一樣。如果工具允許清單參照 Plugin 工具，請將擁有該工具的 Plugin id 加入 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會對這種形態提出警告。

新設定中的 `plugins.bundledDiscovery` 預設為 `"allowlist"`，因此限制性的 `plugins.allow` 清單也會封鎖未列出的內建供應者 Plugin，包括執行階段網頁搜尋供應者探索。Doctor 會在遷移期間，將較舊的限制性允許清單設定標記為 `"compat"`，讓升級在操作員選擇採用更嚴格模式之前，仍保留舊版內建供應者行為。空的 `plugins.allow` 仍會被視為未設定/開放。

透過 `/plugins enable` 或 `/plugins disable` 進行的設定變更，會觸發處理程序內的 Gateway Plugin 重新載入。新的代理回合會從重新整理後的 Plugin 登錄檔重建其工具清單。安裝、更新與解除安裝等會變更來源的操作，仍會重新啟動 Gateway 程序，因為已匯入的 Plugin 模組無法安全地原地替換。

`openclaw plugins list` 是本機 Plugin 登錄檔/設定快照。其中顯示為 `enabled` 的 Plugin，表示持久化登錄檔與目前設定允許該 Plugin 參與。這不代表已在執行中的遠端 Gateway 已重新載入或重新啟動到相同的 Plugin 程式碼。在使用包裝程序的 VPS/container 設定中，請將重新啟動或會觸發重新載入的寫入傳送到實際的 `openclaw gateway run` 程序，或在重新載入回報失敗時，對執行中的 Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **已停用**：Plugin 存在，但啟用規則將其關閉。設定會被保留。
  - **缺少**：設定參照了探索未找到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的 schema。Gateway 啟動時只會略過該 Plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定 payload，將無效項目隔離。

</Accordion>

## 探索與優先順序

OpenClaw 會依下列順序掃描 Plugin（第一個符合者勝出）：

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - 明確的檔案或目錄路徑。指回 OpenClaw 自己封裝內建 Plugin 目錄的路徑會被忽略；請執行 `openclaw doctor --fix` 來移除這些過時別名。
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Bundled plugins">
    隨 OpenClaw 一併提供。許多預設啟用（模型供應者、語音）。
    其他則需要明確啟用。
  </Step>
</Steps>

封裝安裝與 Docker 映像通常會從編譯後的 `dist/extensions` 樹解析內建 Plugin。如果內建 Plugin 來源目錄被 bind-mounted 到相符的封裝來源路徑上，例如 `/app/extensions/synology-chat`，OpenClaw 會將該掛載的來源目錄視為內建來源覆蓋，並在封裝的 `/app/dist/extensions/synology-chat` bundle 之前探索它。這可讓維護者的容器迴圈正常運作，而不必將每個內建 Plugin 都切回 TypeScript 來源。設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist bundle，即使存在來源覆蓋掛載也是如此。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 永遠優先於允許
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 工作區來源的 Plugin **預設停用**（必須明確啟用）
- 內建 Plugin 會遵循內建的預設啟用集合，除非被覆寫
- 排他插槽可以強制啟用該插槽選取的 Plugin
- 當設定命名了 Plugin 擁有的表面時，例如供應者模型參照、channel 設定或 harness 執行階段，某些內建選用 Plugin 會自動啟用
- 當 `plugins.enabled: false` 啟用時，過時的 Plugin 設定會被保留；如果想移除過時 id，請先重新啟用 Plugin 再執行 doctor 清理
- OpenAI 系列 Codex 路由會維持分離的 Plugin 邊界：
  `openai-codex/*` 屬於 OpenAI Plugin，而內建 Codex
  app-server Plugin 會由標準 `openai/*` 代理參照、明確的供應者/模型 `agentRuntime.id: "codex"`，或舊版 `codex/*` 模型參照選取

## 疑難排解執行階段 hook

如果某個 Plugin 出現在 `plugins list` 中，但 `register(api)` 副作用或 hook 沒有在即時聊天流量中執行，請先檢查這些項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的 Gateway URL、profile、設定路徑與程序都是你正在編輯的那些。
- 在 Plugin 安裝/設定/程式碼變更後，重新啟動即時 Gateway。在包裝容器中，PID 1 可能只是 supervisor；請重新啟動或向子 `openclaw gateway run` 程序發送 signal。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook 註冊與診斷。非內建 conversation hook，例如 `before_model_resolve`、`before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 若要切換模型，優先使用 `before_model_resolve`。它會在代理回合的模型解析前執行；`llm_output` 只會在模型嘗試產生 assistant 輸出後執行。
- 若要證明有效的 session 模型，請使用 `openclaw sessions` 或 Gateway session/status 表面；在偵錯供應者 payload 時，請以 `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### 緩慢的 Plugin 工具設定

如果代理回合在準備工具時看似停滯，請啟用 trace logging 並檢查 Plugin 工具 factory timing 行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出總 factory 時間與最慢的 Plugin 工具 factory，包括 Plugin id、宣告的工具名稱、結果形態，以及該工具是否為選用。當單一 factory 至少耗時 1 秒，或 Plugin 工具 factory 準備總耗時至少 5 秒時，緩慢行會提升為警告。

OpenClaw 會針對相同有效請求 context 的重複解析，快取成功的 Plugin 工具 factory 結果。快取鍵包含有效執行階段設定、工作區、代理/session id、sandbox 政策、瀏覽器設定、delivery context、requester 身分與 ownership 狀態，因此依賴這些可信欄位的 factory 會在 context 變更時重新執行。

如果某個 Plugin 主導了耗時，請檢查其執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

接著更新、重新安裝或停用該 Plugin。Plugin 作者應將昂貴的依賴載入移到工具執行路徑之後，而不是在工具 factory 內執行。

### 重複的 channel 或工具 ownership

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這表示不只一個已啟用的 Plugin 正試圖擁有相同的 channel、設定流程或工具名稱。最常見的原因，是外部 channel Plugin 安裝在旁邊，而某個內建 Plugin 現在也提供相同的 channel id。

偵錯步驟：

- 執行 `openclaw plugins list --enabled --verbose`，查看每個已啟用的 Plugin 與來源。
- 對每個可疑的 Plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並比較 `channels`、`channelConfigs`、`tools` 與診斷。
- 安裝或移除 Plugin 套件後，執行 `openclaw plugins registry --refresh`，讓持久化中繼資料反映目前安裝狀態。
- 在安裝、登錄檔或設定變更後重新啟動 Gateway。

修正選項：

- 如果某個 Plugin 有意取代另一個相同 channel id 的 Plugin，偏好的 Plugin 應以較低優先序的 Plugin id 宣告 `channelConfigs.<channel-id>.preferOver`。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成的，請用 `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過時的 Plugin 安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該要求並回報衝突。請為該 channel 選擇一個擁有者，或重新命名 Plugin 擁有的工具，讓執行階段表面不含歧義。

## Plugin 插槽（排他類別）

某些類別是排他的（同一時間只能有一個作用中）：

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
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (built-in) |

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

隨附 Plugin 會與 OpenClaw 一起提供。許多預設啟用（例如隨附模型提供者、隨附語音提供者，以及隨附瀏覽器 Plugin）。其他隨附 Plugin 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫既有已安裝的 Plugin 或 hook pack。對於受追蹤 npm Plugin 的例行升級，請使用 `openclaw plugins update <id-or-npm-spec>`。它不支援與 `--link` 搭配使用，因為 `--link` 會重用來源路徑，而不是複製到受管理的安裝目標上。

當 `plugins.allow` 已設定時，`openclaw plugins install` 會先將已安裝的 Plugin ID 加入該允許清單，再啟用它。如果相同 Plugin ID 存在於 `plugins.deny` 中，安裝會移除該過時的 deny 項目，讓明確安裝的 Plugin 在重新啟動後立即可載入。

OpenClaw 會保留一份持久化的本機 Plugin registry，作為 Plugin inventory、contribution ownership 與 startup planning 的冷讀取模型。install、update、uninstall、enable 與 disable 流程會在變更 Plugin 狀態後重新整理該 registry。同一個 `plugins/installs.json` 檔案會在頂層 `installRecords` 中保存持久安裝 metadata，並在 `plugins` 中保存可重建的 manifest metadata。如果 registry 遺失、過時或無效，`openclaw plugins registry --refresh` 會從 install records、config policy，以及 manifest/package metadata 重建其 manifest view，而不載入 Plugin runtime modules。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，Plugin 生命週期變更器會被停用。請改為透過該安裝的 Nix source 管理 Plugin package selection 與 config；對於 nix-openclaw，請從以 agent 為優先的 [快速開始](https://github.com/openclaw/nix-openclaw#quick-start) 開始。`openclaw plugins update <id-or-npm-spec>` 適用於受追蹤的安裝。傳入含有 dist-tag 或確切版本的 npm package spec，會將 package name 解析回受追蹤的 Plugin record，並記錄新的 spec 以供未來更新。傳入不含版本的 package name，會將確切 pinned install 移回 registry 的預設 release line。如果已安裝的 npm Plugin 已符合解析後的版本與已記錄的 artifact identity，OpenClaw 會略過更新，不下載、不重新安裝，也不改寫 config。
當 `openclaw update` 在 beta channel 上執行時，default-line npm 與 ClawHub Plugin records 會先嘗試 `@beta`，若沒有 Plugin beta release，則退回 default/latest。確切版本與明確 tag 會維持 pinned。

`--pin` 僅適用於 npm。它不支援與 `--marketplace` 搭配使用，因為 marketplace 安裝會持久保存 marketplace source metadata，而不是 npm spec。

`--dangerously-force-unsafe-install` 是針對內建 dangerous-code scanner 誤判的緊急覆寫選項。它允許 Plugin 安裝與 Plugin 更新越過內建 `critical` findings 繼續進行，但仍不會繞過 Plugin `before_install` policy blocks 或 scan-failure blocking。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免封裝的測試 mock 阻擋安裝；宣告的 Plugin runtime entrypoints 仍會被掃描，即使它們使用其中一種名稱。

此 CLI 旗標僅適用於 Plugin install/update 流程。Gateway-backed Skills dependency installs 會改用相符的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub Skills download/install 流程。

如果你發佈到 ClawHub 的 Plugin 因掃描而被隱藏或封鎖，請開啟 ClawHub dashboard，或執行 `clawhub package rescan <name>` 要求 ClawHub 再次檢查它。`--dangerously-force-unsafe-install` 只影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描 Plugin，也不會讓被封鎖的 release 公開。

相容 bundle 會參與相同的 Plugin list/inspect/enable/disable 流程。目前 runtime 支援包括 bundle Skills、Claude command-skills、Claude `settings.json` defaults、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` defaults、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會報告偵測到的 bundle capabilities，以及 bundle-backed Plugin 的支援或不支援 MCP 與 LSP server entries。

Marketplace sources 可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude known-marketplace name、本機 marketplace root 或 `marketplace.json` path、像 `owner/repo` 這樣的 GitHub shorthand、GitHub repo URL，或 git URL。對於遠端 marketplaces，Plugin entries 必須留在 cloned marketplace repo 內，且只能使用相對 path sources。

完整細節請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概覽

Native Plugin 會匯出一個 entry object，公開 `register(api)`。較舊的 Plugin 仍可能使用 `activate(api)` 作為 legacy alias，但新的 Plugin 應使用 `register`。

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

OpenClaw 會載入 entry object，並在 Plugin 啟用期間呼叫 `register(api)`。loader 仍會對較舊的 Plugin fallback 到 `activate(api)`，但隨附 Plugin 與新的外部 Plugin 應將 `register` 視為公開 contract。

`api.registrationMode` 會告訴 Plugin 為何載入其 entry：

| 模式            | 意義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime 啟用。註冊 tools、hooks、services、commands、routes，以及其他即時 side effects。                              |
| `discovery`     | 唯讀 capability discovery。註冊 providers 與 metadata；受信任的 Plugin entry code 可能會載入，但略過即時 side effects。 |
| `setup-only`    | 透過輕量 setup entry 載入 channel setup metadata。                                                                |
| `setup-runtime` | 同時需要 runtime entry 的 channel setup loading。                                                                         |
| `cli-metadata`  | 僅收集 CLI command metadata。                                                                                            |

會開啟 sockets、databases、background workers 或 long-lived clients 的 Plugin entries，應使用 `api.registrationMode === "full"` 保護那些 side effects。Discovery loads 會與 activating loads 分開快取，且不會取代正在執行的 Gateway registry。Discovery 是非啟用式，但不是免匯入：OpenClaw 可能會評估受信任的 Plugin entry 或 channel Plugin module 來建立 snapshot。請保持 module top levels 輕量且無 side effects，並將 network clients、subprocesses、listeners、credential reads 與 service startup 移到 full-runtime paths 後方。

常見 registration methods：

| 方法                                  | 註冊項目           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供者（LLM）        |
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

Typed lifecycle hooks 的 hook guard 行為：

- `before_tool_call`: `{ block: true }` 是終止性的；較低優先序的 handlers 會被略過。
- `before_tool_call`: `{ block: false }` 是 no-op，且不會清除較早的 block。
- `before_install`: `{ block: true }` 是終止性的；較低優先序的 handlers 會被略過。
- `before_install`: `{ block: false }` 是 no-op，且不會清除較早的 block。
- `message_sending`: `{ cancel: true }` 是終止性的；較低優先序的 handlers 會被略過。
- `message_sending`: `{ cancel: false }` 是 no-op，且不會清除較早的 cancel。

原生 Codex app-server 會將 Codex 原生工具事件橋接回這個掛鉤介面。Plugin 可以透過 `before_tool_call` 封鎖原生 Codex 工具、透過 `after_tool_call` 觀察結果，並參與 Codex `PermissionRequest` 核准。橋接層目前尚不會重寫 Codex 原生工具引數。確切的 Codex 執行階段支援邊界位於
[Codex harness v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

如需完整的型別化掛鉤行為，請參閱 [SDK 概觀](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) - 建立你自己的 Plugin
- [Plugin 套件組合](/zh-TW/plugins/bundles) - Codex/Claude/Cursor 套件組合相容性
- [Plugin manifest](/zh-TW/plugins/manifest) - manifest 結構描述
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) - 在 Plugin 中新增代理工具
- [Plugin 內部機制](/zh-TW/plugins/architecture) - capability model 與載入管線
- [ClawHub](/zh-TW/clawhub) - 第三方 Plugin 探索
