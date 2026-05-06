---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 使用與 Codex/Claude 相容的 Plugin 套件組合
sidebarTitle: Install and Configure
summary: 安裝、設定並管理 OpenClaw Plugin
title: Plugin
x-i18n:
    generated_at: "2026-05-06T18:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin 以新功能擴充 OpenClaw：頻道、模型提供者、
代理程式框架、工具、Skills、語音、即時轉錄、即時
語音、媒體理解、影像生成、影片生成、網頁擷取、網頁
搜尋等。有些 Plugin 是 **核心**（隨 OpenClaw 一起提供），其他則是
**外部** Plugin。多數外部 Plugin 會透過
[ClawHub](/zh-TW/tools/clawhub) 發布與探索。Npm 仍支援直接安裝，以及在遷移完成前，
一組暫時由 OpenClaw 擁有的 Plugin 套件。

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
    表面，而新的代理程式回合會從已重新整理的登錄重新建置其工具清單。
    `/plugins install` 會變更 Plugin 原始碼，因此 Gateway 會要求重新啟動，
    而不是假裝目前程序可以安全地重新載入已匯入的模組。

  </Step>

  <Step title="驗證 Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、Gateway 方法、掛鉤或 Plugin 擁有的 CLI
    命令時，請使用 `--runtime`。一般的 `inspect` 是冷態
    manifest/registry 檢查，並刻意避免匯入 Plugin 執行階段。

  </Step>
</Steps>

如果你偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的解析器：本機路徑/封存、明確的
`clawhub:<pkg>`、明確的 `npm:<pkg>`、明確的 `npm-pack:<path.tgz>`、
明確的 `git:<repo>`，或透過 npm 的裸套件規格。

如果設定無效，安裝通常會失敗關閉，並指引你使用
`openclaw doctor --fix`。唯一的復原例外是一條狹窄的 bundled-plugin
重新安裝路徑，適用於選擇加入
`openclaw.install.allowInvalidConfigRecovery` 的 Plugin。
在 Gateway 啟動期間，無效的 Plugin 設定會像任何其他無效設定一樣失敗關閉。
執行 `openclaw doctor --fix`，即可透過停用該 Plugin 項目並移除其無效設定
承載內容來隔離不良 Plugin 設定；一般設定備份會保留先前的值。
當頻道設定參照的 Plugin 已無法探索，但相同的過期 Plugin id 仍保留在 Plugin
設定或安裝記錄中時，Gateway 啟動會記錄警告並略過該頻道，而不是阻塞所有其他頻道。
執行 `openclaw doctor --fix` 以移除過期的頻道/Plugin 項目；沒有過期 Plugin
證據的未知頻道鍵仍會驗證失敗，因此拼字錯誤會保持可見。
如果已設定 `plugins.enabled: false`，過期的 Plugin 參照會被視為惰性：
Gateway 啟動會略過 Plugin 探索/載入工作，而 `openclaw doctor` 會保留
已停用的 Plugin 設定，不會自動移除它。如果你想移除過期的 Plugin id，請在
執行 doctor 清理前重新啟用 Plugin。

Plugin 相依性安裝只會在明確安裝/更新或 doctor 修復流程期間發生。Gateway 啟動、
設定重新載入與執行階段檢查不會執行套件管理器或修復相依性樹。本機 Plugin 必須已經
安裝其相依性，而 npm、git 和 ClawHub Plugin 則會安裝在 OpenClaw 管理的
Plugin 根目錄下。npm 相依性可能會在 OpenClaw 管理的 npm 根目錄內提升；
install/update 會在信任前掃描該受管理根目錄，而 uninstall 會透過 npm 移除
npm 管理的套件。外部 Plugin 和自訂載入路徑仍必須透過
`openclaw plugins install` 安裝。使用 `openclaw plugins list --json` 可在不匯入
執行階段程式碼或修復相依性的情況下，查看每個可見 Plugin 的靜態
`dependencyStatus`。
請參閱 [Plugin 相依性解析](/zh-TW/plugins/dependency-resolution) 了解安裝時生命週期。

### 被封鎖的 Plugin 路徑擁有權

如果 Plugin 診斷顯示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且設定驗證接著顯示 `plugin present but blocked`，表示 OpenClaw 發現
Plugin 檔案的擁有者與載入它們的程序 Unix 使用者不同。請保留 Plugin 設定；
修正檔案系統擁有權，或以擁有狀態目錄的同一使用者執行 OpenClaw。

對於 Docker 安裝，官方映像檔會以 `node`（uid `1000`）執行，因此主機
bind-mounted 的 OpenClaw 設定與工作區目錄通常應由 uid `1000` 擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 執行 OpenClaw，請改為將受管理的 Plugin 根目錄修復為
root 擁有權：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正擁有權後，重新執行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，讓持久化的 Plugin 登錄與已修復的檔案相符。

對於 npm 安裝，像 `latest` 或 dist-tag 這類可變選擇器會先在安裝前解析，
然後釘選到 OpenClaw 管理的 npm 根目錄中精確驗證過的版本。npm 完成後，
OpenClaw 會驗證已安裝的 `package-lock.json` 項目仍符合解析後的版本與完整性。
如果 npm 寫入不同的套件中繼資料，安裝會失敗，並回復受管理的套件，而不是接受
不同的 Plugin 成品。
受管理的 npm 根目錄也會繼承 OpenClaw 套件層級的 npm `overrides`，因此保護
封裝主機的安全性釘選也會套用到已提升的外部 Plugin 相依性。

原始碼 checkout 是 pnpm 工作區。如果你 clone OpenClaw 來修改 bundled
Plugin，請執行 `pnpm install`；OpenClaw 接著會從 `extensions/<id>` 載入
bundled Plugin，因此編輯內容與套件本機相依性會被直接使用。
一般 npm 根目錄安裝適用於已封裝的 OpenClaw，不適用於原始碼 checkout 開發。

## Plugin 類型

OpenClaw 可辨識兩種 Plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 執行階段模組；在程序內執行       | 官方 Plugin、社群 npm 套件               |
| **Bundle** | Codex/Claude/Cursor 相容版面配置；對應到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會顯示在 `openclaw plugins list` 下。請參閱 [Plugin Bundles](/zh-TW/plugins/bundles) 了解 bundle 詳細資訊。

如果你正在撰寫原生 Plugin，請從 [建置 Plugin](/zh-TW/plugins/building-plugins)
和 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview) 開始。

## 套件進入點

原生 Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個項目都必須保留在套件目錄內，並解析為可讀取的執行階段檔案，或解析為具有推斷
建置後 JavaScript 對等檔的 TypeScript 原始碼檔案，例如從 `src/index.ts` 到
`dist/index.js`。
封裝安裝必須附帶該 JavaScript 執行階段輸出。TypeScript 原始碼 fallback
適用於原始碼 checkout 與本機開發路徑，不適用於安裝到 OpenClaw 管理的
Plugin 根目錄中的 npm 套件。

如果受管理套件警告指出它 `requires compiled runtime output for
TypeScript entry ...`，表示該套件發布時缺少 OpenClaw 在執行階段需要的
JavaScript 檔案。這是 Plugin 封裝問題，不是本機設定問題。請在發布者重新發布
已編譯的 JavaScript 後更新或重新安裝 Plugin，或停用/解除安裝該 Plugin，
直到修正版套件可用。

當已發布的執行階段檔案與原始碼項目不在相同路徑時，請使用
`openclaw.runtimeExtensions`。若存在，`runtimeExtensions` 必須為每個
`extensions` 項目精確包含一個項目。清單不相符會導致安裝與 Plugin 探索失敗，
而不是默默 fallback 到原始碼路徑。如果你也發布 `openclaw.setupEntry`，請為其
建置後的 JavaScript 對等檔使用 `openclaw.runtimeSetupEntry`；宣告後該檔案即為必要。

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

ClawHub 是多數 Plugin 的主要發佈路徑。目前已封裝的 OpenClaw 發行版本已經 bundle
許多官方 Plugin，因此在一般設定中不需要另外 npm 安裝。在每個 OpenClaw 擁有的
Plugin 都遷移到 ClawHub 之前，OpenClaw 仍會在 npm 上提供一些 `@openclaw/*`
Plugin 套件，用於較舊/自訂安裝與直接 npm 工作流程。

如果 npm 回報某個 `@openclaw/*` Plugin 套件已 deprecated，表示該套件版本來自
較舊的外部套件列車。請使用目前 OpenClaw 隨附的 bundled Plugin 或本機 checkout，
直到較新的 npm 套件發布為止。

| Plugin          | 套件                    | 文件                                       |
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
  <Accordion title="模型提供者（預設啟用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="記憶體 Plugin">
    - `memory-core` - 內建記憶體搜尋（預設透過 `plugins.slots.memory`）
    - `memory-lancedb` - 以 LanceDB 為後端、支援自動召回/擷取的長期記憶體（設定 `plugins.slots.memory = "memory-lancedb"`）

    請參閱 [Memory LanceDB](/zh-TW/plugins/memory-lancedb)，了解 OpenAI 相容的
    嵌入設定、Ollama 範例、召回限制與疑難排解。

  </Accordion>

  <Accordion title="語音提供者（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` - 用於瀏覽器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、瀏覽器執行階段，以及預設瀏覽器控制服務的內建瀏覽器 Plugin（預設啟用；替換前請先停用）
    - `copilot-proxy` - VS Code Copilot Proxy 橋接（預設停用）

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
| `enabled`          | 主開關（預設：`true`）                                   |
| `allow`            | Plugin 允許清單（選用）                                  |
| `bundledDiscovery` | 內建 Plugin 探索模式（預設為 `allowlist`）                |
| `deny`             | Plugin 拒絕清單（選用；拒絕優先）                        |
| `load.paths`       | 額外的 Plugin 檔案/目錄                                  |
| `slots`            | 互斥槽位選擇器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>`   | 個別 Plugin 開關 + 設定                                  |

`plugins.allow` 是排他的。當它不是空的時候，只有列出的 Plugin 可以載入
或公開工具，即使 `tools.allow` 包含 `"*"` 或特定 Plugin 擁有的
工具名稱。如果工具允許清單引用 Plugin 工具，請將擁有者 Plugin id
加入 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會對這種
形態提出警告。

新設定的 `plugins.bundledDiscovery` 預設為 `"allowlist"`，因此限制性的
`plugins.allow` 清單也會封鎖未列出的內建提供者
Plugin，包括執行階段 Web 搜尋提供者探索。Doctor 會在遷移期間，以 `"compat"` 標記較舊的
限制性允許清單設定，讓升級在操作者選擇加入更嚴格模式前，維持
舊版內建提供者行為。
空的 `plugins.allow` 仍會被視為未設定/開放。

透過 `/plugins enable` 或 `/plugins disable` 做出的設定變更，會觸發
程序內 Gateway Plugin 重新載入。新的代理回合會從
重新整理後的 Plugin registry 重建工具清單。安裝、
更新和解除安裝等變更來源的操作，仍會重新啟動 Gateway 程序，因為已匯入的
Plugin 模組無法安全地就地替換。

`openclaw plugins list` 是本機 Plugin registry/設定快照。其中
`enabled` 的 Plugin 代表持久化 registry 和目前設定允許該
Plugin 參與。這不證明已在執行的遠端 Gateway
已重新載入或重新啟動到相同的 Plugin 程式碼。在具有包裝程序的 VPS/容器設定中，
請將重新啟動或會觸發重新載入的寫入傳送給實際的
`openclaw gateway run` 程序，或在重新載入回報失敗時，對執行中的
Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin 狀態：已停用、遺失與無效">
  - **已停用**：Plugin 存在，但啟用規則將它關閉。設定會保留。
  - **遺失**：設定引用了探索找不到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的 schema。Gateway 啟動只會略過該 Plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定酬載，隔離無效項目。

</Accordion>

## 探索與優先順序

OpenClaw 會依下列順序掃描 Plugin（第一個相符項勝出）：

<Steps>
  <Step title="設定路徑">
    `plugins.load.paths` - 明確的檔案或目錄路徑。指回
    OpenClaw 自身封裝內建 Plugin 目錄的路徑會被忽略；
    執行 `openclaw doctor --fix` 以移除那些過時別名。
  </Step>

  <Step title="工作區 Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全域 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="內建 Plugin">
    隨 OpenClaw 出貨。許多預設啟用（模型提供者、語音）。
    其他則需要明確啟用。
  </Step>
</Steps>

封裝安裝和 Docker 映像通常會從編譯後的
`dist/extensions` 樹狀結構解析內建 Plugin。如果內建 Plugin 來源目錄
被 bind-mounted 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`，OpenClaw 會將該掛載的來源目錄
視為內建來源覆蓋層，並在封裝的
`/app/dist/extensions/synology-chat` bundle 之前探索它。這讓維護者的容器
循環能繼續運作，而不必把每個內建 Plugin 都切回 TypeScript 來源。
設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist bundle，
即使存在來源覆蓋層掛載也一樣。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 永遠優先於 allow
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 工作區來源 Plugin **預設停用**（必須明確啟用）
- 內建 Plugin 會遵循內建的預設開啟集合，除非被覆寫
- 互斥槽位可以強制啟用該槽位所選的 Plugin
- 當設定命名了 Plugin 擁有的介面時，某些內建選用 Plugin 會自動啟用，
  例如提供者模型參照、頻道設定或 harness
  執行階段
- 當 `plugins.enabled: false` 啟用時，過時的 Plugin 設定會被保留；
  如果你想移除過時 id，請在執行 doctor 清理前重新啟用 Plugin
- OpenAI 系列 Codex 路由會保持分離的 Plugin 邊界：
  `openai-codex/*` 屬於 OpenAI Plugin，而內建 Codex
  app-server Plugin 則由 `agentRuntime.id: "codex"` 或舊版
  `codex/*` 模型參照選取

## 疑難排解執行階段 hook

如果某個 Plugin 出現在 `plugins list` 中，但 `register(api)` 副作用或 hook
沒有在即時聊天流量中執行，請先檢查這些項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的
  Gateway URL、profile、設定路徑與程序就是你正在編輯的那些。
- 在 Plugin 安裝/設定/程式碼變更後，重新啟動即時 Gateway。在包裝
  容器中，PID 1 可能只是 supervisor；請重新啟動或傳送訊號給子
  `openclaw gateway run` 程序。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook 註冊與
  diagnostics。非內建對話 hook，例如 `before_model_resolve`、
  `before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、
  `before_agent_finalize` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 對於模型切換，建議使用 `before_model_resolve`。它會在代理回合的模型
  解析前執行；`llm_output` 只會在模型嘗試
  產生助理輸出後執行。
- 若要證明有效的工作階段模型，請使用 `openclaw sessions` 或
  Gateway 工作階段/狀態介面；偵錯提供者酬載時，請使用
  `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### Plugin 工具設定緩慢

如果代理回合看起來在準備工具時停滯，請啟用 trace 記錄並
檢查 Plugin 工具 factory 計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出總 factory 時間和最慢的 Plugin 工具 factory，
包括 Plugin id、宣告的工具名稱、結果形狀，以及該工具是否為
選用。當單一 factory 至少花費
1 秒，或 Plugin 工具 factory 準備總共至少花費 5 秒時，緩慢行會提升為警告。

OpenClaw 會針對相同有效請求情境的重複解析，快取成功的 Plugin 工具 factory 結果。
快取鍵包含有效的
執行階段設定、工作區、代理/工作階段 id、sandbox policy、瀏覽器設定、
傳遞情境、請求者身分和擁有權狀態，因此依賴這些受信任欄位的 factory
會在情境變更時重新執行。

如果某個 Plugin 主導計時，請檢查它的執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然後更新、重新安裝或停用該 Plugin。Plugin 作者應將
昂貴的相依載入移到工具執行路徑後方，而不是在
工具 factory 內執行。

### 重複的頻道或工具擁有權

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這表示超過一個已啟用的 Plugin 正嘗試擁有相同頻道、
設定流程或工具名稱。最常見原因是外部頻道 Plugin
安裝在某個現在提供相同頻道 id 的內建 Plugin 旁邊。

偵錯步驟：

- 執行 `openclaw plugins list --enabled --verbose` 查看每個已啟用的 Plugin
  與來源。
- 對每個可疑 Plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並
  比較 `channels`、`channelConfigs`、`tools` 與 diagnostics。
- 安裝或移除
  Plugin 套件後，執行 `openclaw plugins registry --refresh`，讓持久化 metadata 反映目前安裝。
- 在安裝、registry 或設定變更後重新啟動 Gateway。

修正選項：

- 如果一個 Plugin 有意針對相同頻道 id 取代另一個，
  偏好的 Plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並填入
  較低優先順序的 Plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成，請用
  `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過時的 Plugin
  安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該請求並
  回報衝突。請為該頻道選擇一個擁有者，或重新命名 Plugin 擁有的
  工具，讓執行階段介面明確無歧義。

## Plugin 槽位（互斥類別）

某些類別是互斥的（一次只能有一個作用中）：

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
| `memory`        | 作用中記憶體 Plugin   | `memory-core`       |
| `contextEngine` | 作用中情境引擎        | `legacy`（內建）    |

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

隨附的 Plugin 會隨 OpenClaw 一起出貨。許多預設已啟用（例如隨附的模型提供者、隨附的語音提供者，以及隨附的瀏覽器 Plugin）。其他隨附 Plugin 仍需要 `openclaw plugins enable <id>`。

`--force` 會就地覆寫現有已安裝的 Plugin 或 hook pack。對於受追蹤 npm Plugin 的例行升級，請使用 `openclaw plugins update <id-or-npm-spec>`。它不支援搭配 `--link` 使用，因為 `--link` 會重用來源路徑，而不是複製到受管理的安裝目標上。

當 `plugins.allow` 已設定時，`openclaw plugins install` 會先將已安裝的 Plugin ID 加入該允許清單，再啟用它。如果相同的 Plugin ID 存在於 `plugins.deny`，安裝會移除該過時的拒絕項目，讓明確安裝的 Plugin 在重新啟動後可立即載入。

OpenClaw 會保留一個持久化的本機 Plugin registry，作為 Plugin 清單、貢獻所有權與啟動規劃的冷讀取模型。安裝、更新、解除安裝、啟用與停用流程會在變更 Plugin 狀態後重新整理該 registry。同一個 `plugins/installs.json` 檔案會在頂層 `installRecords` 中保留持久安裝中繼資料，並在 `plugins` 中保留可重建的 manifest 中繼資料。如果 registry 遺失、過時或無效，`openclaw plugins registry --refresh` 會從安裝記錄、設定政策，以及 manifest/package 中繼資料重建其 manifest 視圖，而不載入 Plugin 執行階段模組。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，Plugin 生命週期變更操作會被停用。請改為透過該安裝的 Nix 來源管理 Plugin 套件選擇與設定；若使用 nix-openclaw，請從 agent-first 的 [快速開始](https://github.com/openclaw/nix-openclaw#quick-start) 入門。`openclaw plugins update <id-or-npm-spec>` 適用於受追蹤的安裝。傳入帶有 dist-tag 或精確版本的 npm 套件規格，會將套件名稱解析回受追蹤的 Plugin 記錄，並記錄新的規格供日後更新使用。傳入不含版本的套件名稱，會將精確釘選的安裝移回 registry 的預設發布線。如果已安裝的 npm Plugin 已符合解析出的版本與記錄的成品身分，OpenClaw 會略過更新，不會下載、重新安裝或重寫設定。
當 `openclaw update` 在 beta 頻道執行時，預設線的 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，若沒有 Plugin beta 發布版本，則回退到 default/latest。精確版本與明確標籤會保持釘選。

`--pin` 僅適用於 npm。它不支援搭配 `--marketplace` 使用，因為 marketplace 安裝會持久化 marketplace 來源中繼資料，而不是 npm 規格。

`--dangerously-force-unsafe-install` 是用於內建危險程式碼掃描器誤判的緊急覆寫。它允許 Plugin 安裝與 Plugin 更新在內建 `critical` 發現項目後繼續進行，但仍不會繞過 Plugin `before_install` 政策阻擋或掃描失敗阻擋。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 與 `*.spec.*`，以避免封裝的測試 mock 被阻擋；宣告的 Plugin 執行階段進入點即使使用這些名稱之一，仍會被掃描。

此 CLI 旗標只適用於 Plugin 安裝/更新流程。Gateway 支援的 Skill 相依套件安裝會改用相對應的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub Skill 下載/安裝流程。

如果你發佈到 ClawHub 的 Plugin 因掃描而被隱藏或阻擋，請開啟 ClawHub dashboard，或執行 `clawhub package rescan <name>` 要求 ClawHub 重新檢查。`--dangerously-force-unsafe-install` 只會影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描該 Plugin，也不會讓被阻擋的發布版本公開。

相容 bundle 會參與同一套 Plugin list/inspect/enable/disable 流程。目前的執行階段支援包含 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的 bundle 能力，以及 bundle 支援 Plugin 的受支援或不受支援 MCP 與 LSP server 項目。

Marketplace 來源可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱、本機 marketplace 根目錄或 `marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。對於遠端 marketplace，Plugin 項目必須保留在複製下來的 marketplace repo 內，且只能使用相對路徑來源。

完整詳細資訊請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概覽

原生 Plugin 會匯出一個公開 `register(api)` 的進入物件。較舊的 Plugin 可能仍使用 `activate(api)` 作為舊版別名，但新的 Plugin 應使用 `register`。

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

OpenClaw 會載入進入物件，並在 Plugin 啟用期間呼叫 `register(api)`。loader 仍會針對較舊的 Plugin 回退使用 `activate(api)`，但隨附 Plugin 與新的外部 Plugin 應將 `register` 視為公開契約。

`api.registrationMode` 會告訴 Plugin 其進入點被載入的原因：

| 模式            | 意義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 執行階段啟用。註冊工具、hook、服務、命令、路由與其他即時副作用。                              |
| `discovery`     | 唯讀能力探索。註冊提供者與中繼資料；受信任的 Plugin 進入程式碼可能會載入，但應略過即時副作用。 |
| `setup-only`    | 透過輕量 setup 進入點載入頻道設定中繼資料。                                                                |
| `setup-runtime` | 也需要執行階段進入點的頻道設定載入。                                                                         |
| `cli-metadata`  | 僅收集 CLI 命令中繼資料。                                                                                            |

會開啟 socket、資料庫、背景 worker 或長生命週期 client 的 Plugin 進入點，應使用 `api.registrationMode === "full"` 防護這些副作用。Discovery 載入會與啟用載入分開快取，且不會取代正在執行的 Gateway registry。Discovery 是非啟用的，但並非免 import：OpenClaw 可能會評估受信任的 Plugin 進入點或頻道 Plugin 模組來建構 snapshot。請保持模組頂層輕量且無副作用，並將網路 client、子程序、listener、憑證讀取與服務啟動移到完整執行階段路徑後方。

常見註冊方法：

| 方法                                  | 註冊內容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供者（LLM）        |
| `registerChannel`                       | 聊天頻道                |
| `registerTool`                          | Agent 工具                  |
| `registerHook` / `on(...)`              | 生命週期 hook             |
| `registerSpeechProvider`                | 文字轉語音 / STT        |
| `registerRealtimeTranscriptionProvider` | 串流 STT               |
| `registerRealtimeVoiceProvider`         | 雙工即時語音       |
| `registerMediaUnderstandingProvider`    | 圖像/音訊分析        |
| `registerImageGenerationProvider`       | 圖像生成            |
| `registerMusicGenerationProvider`       | 音樂生成            |
| `registerVideoGenerationProvider`       | 影片生成            |
| `registerWebFetchProvider`              | Web 擷取 / 抓取提供者 |
| `registerWebSearchProvider`             | Web 搜尋                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | 背景服務          |

型別化生命週期 hook 的 hook 防護行為：

- `before_tool_call`：`{ block: true }` 為終止性；較低優先順序的 handler 會被略過。
- `before_tool_call`：`{ block: false }` 是無操作，且不會清除較早的阻擋。
- `before_install`：`{ block: true }` 為終止性；較低優先順序的 handler 會被略過。
- `before_install`：`{ block: false }` 是無操作，且不會清除較早的阻擋。
- `message_sending`：`{ cancel: true }` 為終止性；較低優先順序的 handler 會被略過。
- `message_sending`：`{ cancel: false }` 是無操作，且不會清除較早的取消。

原生 Codex app-server 執行會將 Codex 原生工具事件橋接回這個 hook 介面。Plugin 可以透過 `before_tool_call` 封鎖原生 Codex 工具、透過 `after_tool_call` 觀察結果，並參與 Codex `PermissionRequest` 核准。此橋接尚未改寫 Codex 原生工具引數。確切的 Codex runtime 支援邊界位於 [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

如需完整的型別化 hook 行為，請參閱 [SDK 概觀](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) - 建立你自己的 Plugin
- [Plugin 套件組合](/zh-TW/plugins/bundles) - Codex/Claude/Cursor 套件相容性
- [Plugin manifest](/zh-TW/plugins/manifest) - manifest 結構描述
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) - 在 Plugin 中新增 agent 工具
- [Plugin 內部機制](/zh-TW/plugins/architecture) - capability model 與載入管線
- [社群 Plugin](/zh-TW/plugins/community) - 第三方清單
