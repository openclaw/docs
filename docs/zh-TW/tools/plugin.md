---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件包
sidebarTitle: Install and Configure
summary: 安裝、設定並管理 OpenClaw Plugin
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:47:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugin 可為 OpenClaw 擴充新功能：通道、模型供應商、
代理程式執行框架、工具、Skills、語音、即時轉錄、即時
語音、媒體理解、圖像生成、影片生成、Web 擷取、Web
搜尋，以及更多功能。有些 Plugin 是 **核心**（隨 OpenClaw 提供），其他則是
**外部** Plugin。多數外部 Plugin 都透過
[ClawHub](/zh-TW/clawhub) 發布與探索。npm 仍支援直接安裝，以及在遷移完成前
暫時保留的一組 OpenClaw 擁有的 Plugin 套件。

## 快速開始

如需可直接複製貼上的安裝、列出、解除安裝、更新與發布範例，請參閱
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

    然後在設定檔的 `plugins.entries.\<id\>.config` 下進行設定。

  </Step>

  <Step title="聊天原生管理">
    在執行中的 Gateway 中，僅限擁有者使用的 `/plugins enable` 和 `/plugins disable`
    會觸發 Gateway 設定重新載入器。Gateway 會在程序內重新載入 Plugin 執行階段
    介面，而新的代理程式回合會從重新整理後的登錄檔重建其工具清單。`/plugins install`
    會變更 Plugin 原始碼，因此 Gateway 會要求重新啟動，而不是假裝目前程序能夠
    安全地重新載入已匯入的模組。

  </Step>

  <Step title="驗證 Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、gateway 方法、hook，或 Plugin 擁有的 CLI
    命令時，請使用 `--runtime`。一般的 `inspect` 是冷態
    manifest/registry 檢查，並且有意避免匯入 Plugin 執行階段。

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
明確的 `git:<repo>`，或透過 npm 的裸套件規格。

如果設定無效，安裝通常會以失敗關閉並指引你使用
`openclaw doctor --fix`。唯一的復原例外，是針對選擇加入
`openclaw.install.allowInvalidConfigRecovery` 的 Plugin 所提供的狹窄內建 Plugin
重新安裝路徑。
Gateway 啟動期間，無效的 Plugin 設定會像任何其他無效設定一樣以失敗關閉。
執行 `openclaw doctor --fix`，透過停用該 Plugin 項目並移除其無效設定酬載，
將有問題的 Plugin 設定隔離；一般設定備份會保留先前的值。
當通道設定參照已無法探索的 Plugin，但同一個過時 Plugin id 仍存在於 Plugin
設定或安裝記錄中時，Gateway 啟動會記錄警告並略過該通道，而不是阻擋所有其他通道。
執行 `openclaw doctor --fix` 以移除過時的通道/Plugin 項目；沒有過時 Plugin
證據的未知通道鍵仍會驗證失敗，讓拼字錯誤保持可見。
如果設定了 `plugins.enabled: false`，過時的 Plugin 參照會被視為惰性：
Gateway 啟動會略過 Plugin 探索/載入工作，而 `openclaw doctor` 會保留已停用的
Plugin 設定，而不是自動移除它。如果你想移除過時的 Plugin id，請先重新啟用
Plugin，再執行 doctor 清理。

Plugin 相依性安裝只會在明確的安裝/更新或 doctor 修復流程中發生。Gateway 啟動、
設定重新載入，以及執行階段檢查不會執行套件管理器，也不會修復相依性樹。
本機 Plugin 必須已安裝其相依性，而 npm、git 和 ClawHub Plugin 會安裝在
OpenClaw 的受管理 Plugin 根目錄下。npm 相依性可能會在 OpenClaw 的受管理 npm
根目錄內提升；安裝/更新會在信任前掃描該受管理根目錄，而解除安裝會透過 npm
移除 npm 管理的套件。外部 Plugin 和自訂載入路徑仍必須透過
`openclaw plugins install` 安裝。
使用 `openclaw plugins list --json` 可查看每個可見 Plugin 的靜態
`dependencyStatus`，而不會匯入執行階段程式碼或修復相依性。
如需安裝時生命週期，請參閱 [Plugin 相依性解析](/zh-TW/plugins/dependency-resolution)。

### 被封鎖的 Plugin 路徑擁有權

如果 Plugin 診斷顯示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且設定驗證接著顯示 `plugin present but blocked`，表示 OpenClaw 找到的
Plugin 檔案擁有者，與載入這些檔案的程序所屬 Unix 使用者不同。
請保留 Plugin 設定；修正檔案系統擁有權，或以擁有狀態目錄的同一使用者執行
OpenClaw。

對於 Docker 安裝，官方映像檔會以 `node`（uid `1000`）執行，因此主機
bind-mounted 的 OpenClaw 設定與工作區目錄通常應由 uid `1000` 擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你刻意以 root 執行 OpenClaw，請改為將受管理 Plugin 根目錄修復為
root 擁有權：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正擁有權後，重新執行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，讓持久化的 Plugin 登錄檔與修復後的檔案相符。

對於 npm 安裝，像 `latest` 或 dist-tag 這類可變選擇器會在安裝前解析，
然後固定為 OpenClaw 受管理 npm 根目錄中已驗證的精確版本。npm 完成後，
OpenClaw 會驗證已安裝的 `package-lock.json` 項目仍符合解析出的版本與完整性。
如果 npm 寫入不同的套件中繼資料，安裝會失敗並回復受管理套件，而不是接受不同的
Plugin 成品。
受管理 npm 根目錄也會繼承 OpenClaw 套件層級的 npm `overrides`，因此保護封裝主機的
安全釘選也會套用至提升的外部 Plugin 相依性。

原始碼 checkout 是 pnpm 工作區。如果你 clone OpenClaw 來修改內建 Plugin，
請執行 `pnpm install`；接著 OpenClaw 會從 `extensions/<id>` 載入內建 Plugin，
讓編輯內容與套件本機相依性可直接使用。
一般 npm 根目錄安裝適用於封裝版 OpenClaw，不適用於原始碼 checkout 開發。

## Plugin 類型

OpenClaw 識別兩種 Plugin 格式：

| 格式 | 運作方式 | 範例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 執行階段模組；在程序內執行 | 官方 Plugin、社群 npm 套件 |
| **Bundle** | 與 Codex/Claude/Cursor 相容的版面配置；對應到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會顯示在 `openclaw plugins list` 下。請參閱 [Plugin Bundles](/zh-TW/plugins/bundles) 了解 bundle 詳細資訊。

如果你正在撰寫原生 Plugin，請從 [建置 Plugin](/zh-TW/plugins/building-plugins)
和 [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview) 開始。

## 套件進入點

原生 Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個項目都必須留在套件目錄內，並解析為可讀取的執行階段檔案，或解析為具有推斷建置後
JavaScript 對應檔的 TypeScript 原始碼檔案，例如 `src/index.ts` 到 `dist/index.js`。
封裝安裝必須隨附該 JavaScript 執行階段輸出。TypeScript 原始碼 fallback 適用於
原始碼 checkout 和本機開發路徑，不適用於安裝到 OpenClaw 受管理 Plugin 根目錄的
npm 套件。

丟入全域擴充根目錄且未追蹤的目錄會被視為本機原始碼 checkout，並可直接載入
TypeScript 進入點。仍由安裝記錄命名的目錄，包括 `installPath` 或 `sourcePath`，
會保持受管理狀態，即使全域掃描看見它們，也仍保留編譯輸出需求。
如果你刻意將受管理安裝轉換為未追蹤的本機 checkout，請先透過解除安裝或 doctor
清理移除過時的安裝記錄。

如果受管理套件警告指出它 `requires compiled runtime output for
TypeScript entry ...`，表示該套件發布時缺少 OpenClaw 執行階段所需的 JavaScript
檔案。這是 Plugin 封裝問題，不是本機設定問題。請在發布者重新發布已編譯的
JavaScript 後更新或重新安裝 Plugin，或停用/解除安裝該 Plugin，直到修正版套件可用。

當已發布的執行階段檔案不在與原始碼項目相同的路徑時，請使用
`openclaw.runtimeExtensions`。如果存在，`runtimeExtensions` 必須為每個
`extensions` 項目精確包含一個項目。不相符的清單會讓安裝與 Plugin 探索失敗，
而不是默默 fallback 到原始碼路徑。如果你也發布 `openclaw.setupEntry`，請為其建置後的
JavaScript 對應檔使用 `openclaw.runtimeSetupEntry`；宣告時該檔案為必要項目。

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

ClawHub 是多數 Plugin 的主要發行路徑。目前封裝版 OpenClaw 版本已內建許多官方
Plugin，因此在一般設定中不需要另外 npm 安裝。在所有 OpenClaw 擁有的 Plugin
都遷移到 ClawHub 前，OpenClaw 仍會在 npm 上提供一些 `@openclaw/*` Plugin 套件，
供較舊/自訂安裝與直接 npm 工作流程使用。

如果 npm 回報某個 `@openclaw/*` Plugin 套件已棄用，該套件版本來自較舊的外部套件列。
請使用目前 OpenClaw 的內建 Plugin 或本機 checkout，直到較新的 npm 套件發布。

| Plugin | 套件 | 文件 |
| --------------- | -------------------------- | ------------------------------------------ |
| Discord | `@openclaw/discord` | [Discord](/zh-TW/channels/discord) |
| Feishu | `@openclaw/feishu` | [Feishu](/zh-TW/channels/feishu) |
| Matrix | `@openclaw/matrix` | [Matrix](/zh-TW/channels/matrix) |
| Mattermost | `@openclaw/mattermost` | [Mattermost](/zh-TW/channels/mattermost) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/zh-TW/channels/msteams) |
| Nextcloud Talk | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/zh-TW/channels/nextcloud-talk) |
| Nostr | `@openclaw/nostr` | [Nostr](/zh-TW/channels/nostr) |
| Synology Chat | `@openclaw/synology-chat` | [Synology Chat](/zh-TW/channels/synology-chat) |
| Tlon | `@openclaw/tlon` | [Tlon](/zh-TW/channels/tlon) |
| WhatsApp | `@openclaw/whatsapp` | [WhatsApp](/zh-TW/channels/whatsapp) |
| Zalo | `@openclaw/zalo` | [Zalo](/zh-TW/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/zh-TW/plugins/zalouser) |

### 核心（隨 OpenClaw 提供）

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
    - `memory-lancedb` - 由 LanceDB 支援、具備自動回想/擷取的長期記憶體（設定 `plugins.slots.memory = "memory-lancedb"`）

    請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb)，了解 OpenAI 相容的
    嵌入設定、Ollama 範例、回想限制與疑難排解。

  </Accordion>

  <Accordion title="語音提供者（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` - 用於瀏覽器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、瀏覽器執行階段，以及預設瀏覽器控制服務的內建瀏覽器 Plugin（預設啟用；替換前請先停用）
    - `copilot-proxy` - VS Code Copilot Proxy 橋接器（預設停用）

  </Accordion>
</AccordionGroup>

在尋找第三方 Plugin？請參閱 [ClawHub](/zh-TW/clawhub)。

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
| `enabled`          | 主開關（預設：`true`）                                    |
| `allow`            | Plugin 允許清單（選用）                                   |
| `bundledDiscovery` | 內建 Plugin 探索模式（預設為 `allowlist`）                |
| `deny`             | Plugin 拒絕清單（選用；拒絕優先）                         |
| `load.paths`       | 額外 Plugin 檔案/目錄                                     |
| `slots`            | 專屬插槽選擇器（例如 `memory`、`contextEngine`）           |
| `entries.\<id\>`   | 個別 Plugin 開關 + 設定                                   |

`plugins.allow` 是排他性的。當它非空時，只有列出的 Plugin 可以載入
或公開工具，即使 `tools.allow` 包含 `"*"` 或特定 Plugin 擁有的
工具名稱也一樣。如果工具允許清單參照 Plugin 工具，請將擁有該工具的 Plugin id
加入 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會對這種
結構發出警告。

新設定中的 `plugins.bundledDiscovery` 預設為 `"allowlist"`，因此
限制性的 `plugins.allow` 清單也會封鎖被省略的內建提供者
Plugin，包括執行階段網頁搜尋提供者探索。Doctor 會在遷移期間，為較舊的
限制性允許清單設定標記 `"compat"`，讓升級在操作員選擇採用更嚴格模式前，
保留舊版內建提供者行為。空的 `plugins.allow` 仍會被視為未設定/開放。

透過 `/plugins enable` 或 `/plugins disable` 進行的設定變更，會觸發
程序內 Gateway Plugin 重新載入。新的代理回合會從重新整理後的 Plugin 登錄
重建其工具清單。安裝、更新與解除安裝等會變更來源的操作，仍會重新啟動 Gateway
程序，因為已匯入的 Plugin 模組無法安全地就地替換。

`openclaw plugins list` 是本機 Plugin 登錄/設定快照。其中的
`enabled` Plugin 表示持久化登錄與目前設定允許該
Plugin 參與。它並不證明已在執行中的遠端 Gateway
已重新載入或重新啟動到相同的 Plugin 程式碼。在使用包裝程序的 VPS/容器設定中，
請將重新啟動或會觸發重新載入的寫入傳送到實際的
`openclaw gateway run` 程序，或在重新載入回報失敗時，對執行中的 Gateway 使用
`openclaw gateway restart`。

<Accordion title="Plugin 狀態：已停用、缺失、無效">
  - **已停用**：Plugin 存在，但啟用規則將其關閉。設定會保留。
  - **缺失**：設定參照了探索找不到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的結構描述。Gateway 啟動只會略過該 Plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定承載，隔離無效項目。

</Accordion>

## 探索與優先順序

OpenClaw 會依下列順序掃描 Plugin（第一個符合者勝出）：

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

封裝安裝與 Docker 映像通常會從已編譯的 `dist/extensions` 樹解析內建 Plugin。
如果內建 Plugin 來源目錄被 bind mount 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`，OpenClaw 會將該掛載的來源目錄
視為內建來源覆蓋，並在封裝的
`/app/dist/extensions/synology-chat` 套件之前探索它。這讓維護者容器
迴圈能持續運作，而不必把每個內建 Plugin 都切回 TypeScript 來源。
設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist 套件，
即使存在來源覆蓋掛載也一樣。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 一律優先於 allow
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 來源為工作區的 Plugin **預設停用**（必須明確啟用）
- 除非被覆寫，否則內建 Plugin 會遵循內建的預設啟用集合
- 專屬插槽可以強制啟用該插槽所選取的 Plugin
- 當設定命名了 Plugin 擁有的表面，例如提供者模型參照、頻道設定或 harness
  執行階段時，某些需要選擇加入的內建 Plugin 會自動啟用
- 當 `plugins.enabled: false` 啟用時，過時的 Plugin 設定會保留；
  如果你想移除過時 id，請先重新啟用 Plugin 再執行 doctor 清理
- OpenAI 家族的 Codex 路由會維持分離的 Plugin 邊界：
  `openai-codex/*` 屬於 OpenAI Plugin，而內建 Codex
  app-server Plugin 會由標準 `openai/*` 代理參照、明確的
  provider/model `agentRuntime.id: "codex"`，或舊版 `codex/*` 模型參照選取

## 疑難排解執行階段 hook

如果某個 Plugin 出現在 `plugins list` 中，但 `register(api)` 副作用或 hook
未在即時聊天流量中執行，請先檢查這些項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的
  Gateway URL、profile、設定路徑與程序就是你正在編輯的項目。
- 在 Plugin 安裝/設定/程式碼變更後，重新啟動即時 Gateway。在包裝
  容器中，PID 1 可能只是 supervisor；請重新啟動或傳送訊號給子
  `openclaw gateway run` 程序。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook 註冊與
  診斷。非內建對話 hook，例如 `before_model_resolve`、
  `before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、
  `before_agent_finalize` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 對於模型切換，優先使用 `before_model_resolve`。它會在代理回合的模型
  解析前執行；`llm_output` 只會在某次模型嘗試產生助理輸出後執行。
- 若要證明有效工作階段模型，請使用 `openclaw sessions` 或
  Gateway 工作階段/狀態表面；除錯提供者承載時，請以
  `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### 緩慢的 Plugin 工具設定

如果代理回合在準備工具時看似停滯，請啟用 trace 記錄並
檢查 Plugin 工具 factory 計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出總 factory 時間以及最慢的 Plugin 工具 factory，
包括 Plugin id、宣告的工具名稱、結果形狀，以及該工具是否為
選用。當單一 factory 至少花費 1 秒，或 Plugin 工具 factory 準備總計至少花費 5 秒時，
緩慢行會提升為警告。

OpenClaw 會快取成功的 Plugin 工具 factory 結果，以便在相同有效請求內容中
重複解析時使用。快取鍵包含有效的執行階段設定、工作區、代理/工作階段 id、
沙箱政策、瀏覽器設定、傳遞內容、請求者身分與所有權狀態，因此依賴
這些受信任欄位的 factory 會在內容變更時重新執行。

如果某個 Plugin 主導計時，請檢查其執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

接著更新、重新安裝或停用該 Plugin。Plugin 作者應將昂貴的相依性載入
移到工具執行路徑之後，而不是在工具 factory 內進行。

### 重複的頻道或工具所有權

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這些表示有多個已啟用的 Plugin 嘗試擁有相同的頻道、
設定流程或工具名稱。最常見的原因是外部頻道 Plugin
安裝在內建 Plugin 旁邊，而該內建 Plugin 現在提供相同的頻道 id。

除錯步驟：

- 執行 `openclaw plugins list --enabled --verbose`，查看每個已啟用的 Plugin
  與來源。
- 對每個疑似 Plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並
  比較 `channels`、`channelConfigs`、`tools` 和診斷。
- 在安裝或移除 Plugin 套件後，執行 `openclaw plugins registry --refresh`，
  讓持久化中繼資料反映目前安裝。
- 在安裝、登錄或設定變更後，重新啟動 Gateway。

修正選項：

- 如果某個 Plugin 有意替換另一個相同頻道 id 的 Plugin，偏好的
  Plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並指定
  較低優先順序的 Plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成，請使用
  `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過時的 Plugin
  安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該請求並
  回報衝突。請為該頻道選擇一個擁有者，或重新命名 Plugin 擁有的
  工具，讓執行階段表面明確無歧義。

## Plugin 插槽（專屬類別）

有些類別是專屬的（一次只能有一個作用中）：

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
| `memory`        | 作用中記憶體 Plugin   | `memory-core`       |
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

隨 OpenClaw 一起出貨的 bundled Plugin。許多預設已啟用（例如 bundled 模型提供者、bundled 語音提供者，以及 bundled 瀏覽器 Plugin）。其他 bundled Plugin 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫既有已安裝的 Plugin 或 Hook 套件。若要例行升級受追蹤的 npm Plugin，請使用 `openclaw plugins update <id-or-npm-spec>`。它不支援與 `--link` 搭配使用，因為 `--link` 會重用來源路徑，而不是複製到受管理的安裝目標上。

當 `plugins.allow` 已設定時，`openclaw plugins install` 會先把已安裝的 Plugin ID 加入該 allowlist，再啟用它。如果同一個 Plugin ID 出現在 `plugins.deny` 中，安裝會移除該過期的 deny 項目，讓明確安裝的 Plugin 在重新啟動後可立即載入。

OpenClaw 會保留一份持久化的本機 Plugin registry，作為 Plugin 清單、貢獻擁有權與啟動規劃的冷讀取模型。安裝、更新、解除安裝、啟用與停用流程會在變更 Plugin 狀態後重新整理該 registry。同一個 `plugins/installs.json` 檔案會在頂層 `installRecords` 中保存持久安裝中繼資料，並在 `plugins` 中保存可重建的 manifest 中繼資料。如果 registry 遺失、過期或無效，`openclaw plugins registry --refresh` 會從安裝記錄、設定政策與 manifest/package 中繼資料重建其 manifest 檢視，而不載入 Plugin 執行階段模組。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，Plugin 生命週期變更指令會被停用。請改為透過該安裝的 Nix 來源管理 Plugin 套件選擇與設定；若使用 nix-openclaw，請先閱讀以代理程式為優先的 [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw plugins update <id-or-npm-spec>` 適用於受追蹤的安裝。傳入含有 dist-tag 或精確版本的 npm package spec，會將 package 名稱解析回受追蹤的 Plugin 記錄，並記錄新的 spec 供未來更新使用。傳入不含版本的 package 名稱，會將精確 pin 住的安裝移回 registry 的預設發行線。如果已安裝的 npm Plugin 已符合解析後的版本與記錄的 artifact 身分，OpenClaw 會略過更新，不下載、不重新安裝，也不重寫設定。
當 `openclaw update` 在 beta 頻道上執行時，預設發行線的 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，並在沒有 Plugin beta 版本時回退到 default/latest。精確版本與明確標籤會維持 pin 住。

`--pin` 僅適用於 npm。它不支援與 `--marketplace` 搭配使用，因為 marketplace 安裝會保存 marketplace 來源中繼資料，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用於內建危險程式碼掃描器誤判的緊急覆寫。它允許 Plugin 安裝與 Plugin 更新在內建 `critical` 發現項目後繼續進行，但仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 與 `*.spec.*`，以避免封鎖封裝的測試 mock；宣告的 Plugin 執行階段進入點即使使用其中一種名稱，仍會被掃描。

此 CLI 旗標僅適用於 Plugin 安裝/更新流程。Gateway 支援的 skill 相依項安裝會改用對應的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

如果你在 ClawHub 發布的 Plugin 因掃描而被隱藏或封鎖，請開啟 ClawHub dashboard，或執行 `clawhub package rescan <name>` 要求 ClawHub 重新檢查。`--dangerously-force-unsafe-install` 只影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描該 Plugin，也不會讓被封鎖的發行版本公開。

相容的 bundles 會參與相同的 Plugin list/inspect/enable/disable 流程。目前的執行階段支援包含 bundle Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的 bundle 能力，以及 bundle 支援的 Plugin 的受支援或不受支援 MCP 與 LSP server 項目。

Marketplace 來源可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱、本機 marketplace root 或 `marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。對於遠端 marketplaces，Plugin 項目必須保留在複製出的 marketplace repo 內，且只能使用相對路徑來源。

完整詳細資訊請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概觀

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

OpenClaw 會在 Plugin 啟用期間載入 entry object，並呼叫 `register(api)`。loader 仍會對較舊的 Plugin 回退使用 `activate(api)`，但 bundled Plugin 與新的外部 Plugin 應將 `register` 視為公開合約。

`api.registrationMode` 會告訴 Plugin 其 entry 為何被載入：

| 模式 | 含義 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 執行階段啟用。註冊工具、hook、服務、命令、路由與其他即時副作用。 |
| `discovery` | 唯讀能力探索。註冊提供者與中繼資料；受信任的 Plugin entry 程式碼可能會載入，但應略過即時副作用。 |
| `setup-only` | 透過輕量 setup entry 載入通道 setup 中繼資料。 |
| `setup-runtime` | 也需要執行階段 entry 的通道 setup 載入。 |
| `cli-metadata` | 僅收集 CLI 命令中繼資料。 |

會開啟 socket、database、背景 worker 或長生命週期 client 的 Plugin entry，應使用 `api.registrationMode === "full"` 保護這些副作用。Discovery 載入會與啟用載入分開快取，且不會取代執行中的 Gateway registry。Discovery 是非啟用式的，但並非無匯入：OpenClaw 可能會評估受信任的 Plugin entry 或通道 Plugin 模組，以建立快照。請保持模組頂層輕量且無副作用，並將 network client、subprocess、listener、credential 讀取與 service 啟動移到完整執行階段路徑之後。

常見註冊方法：

| 方法 | 註冊內容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供者（LLM） |
| `registerChannel` | 聊天通道 |
| `registerTool` | 代理程式工具 |
| `registerHook` / `on(...)` | 生命週期 hooks |
| `registerSpeechProvider` | 文字轉語音 / STT |
| `registerRealtimeTranscriptionProvider` | 串流 STT |
| `registerRealtimeVoiceProvider` | 雙工即時語音 |
| `registerMediaUnderstandingProvider` | 影像/音訊分析 |
| `registerImageGenerationProvider` | 影像生成 |
| `registerMusicGenerationProvider` | 音樂生成 |
| `registerVideoGenerationProvider` | 影片生成 |
| `registerWebFetchProvider` | Web 擷取 / scrape 提供者 |
| `registerWebSearchProvider` | Web 搜尋 |
| `registerHttpRoute` | HTTP endpoint |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | Context engine |
| `registerService` | 背景服務 |

typed 生命週期 hooks 的 Hook guard 行為：

- `before_tool_call`：`{ block: true }` 為終止狀態；會略過較低優先順序的 handlers。
- `before_tool_call`：`{ block: false }` 為無操作，且不會清除先前的 block。
- `before_install`：`{ block: true }` 為終止狀態；會略過較低優先順序的 handlers。
- `before_install`：`{ block: false }` 為無操作，且不會清除先前的 block。
- `message_sending`：`{ cancel: true }` 為終止狀態；會略過較低優先順序的 handlers。
- `message_sending`：`{ cancel: false }` 為無操作，且不會清除先前的 cancel。

Codex 原生 app-server 會執行橋接，將 Codex 原生工具事件帶回這個
hook 介面。Plugin 可以透過 `before_tool_call` 封鎖 Codex 原生工具、
透過 `after_tool_call` 觀察結果，並參與 Codex
`PermissionRequest` 核准。此橋接尚不會改寫 Codex 原生工具
引數。確切的 Codex runtime 支援邊界位於
[Codex harness v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

如需完整的 typed hook 行為，請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建構 Plugin](/zh-TW/plugins/building-plugins) - 建立你自己的 Plugin
- [Plugin bundles](/zh-TW/plugins/bundles) - Codex/Claude/Cursor bundle 相容性
- [Plugin manifest](/zh-TW/plugins/manifest) - manifest schema
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) - 在 Plugin 中新增 agent 工具
- [Plugin 內部架構](/zh-TW/plugins/architecture) - capability 模型與載入流程
- [ClawHub](/zh-TW/clawhub) - 第三方 Plugin 探索
