---
read_when:
    - 安裝或設定 Plugin
    - 了解 Plugin 探索與載入規則
    - 與 Codex/Claude 相容的 Plugin 套件
sidebarTitle: Install and Configure
summary: 安裝、設定並管理 OpenClaw Plugin
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Plugin 可為 OpenClaw 擴充新功能：通道、模型提供者、
代理程式執行框架、工具、Skills、語音、即時轉錄、即時
語音、媒體理解、影像生成、影片生成、網頁擷取、網頁
搜尋，以及更多功能。有些 Plugin 是**核心**（隨 OpenClaw 提供），其他
則是**外部**。大多數外部 Plugin 會透過
[ClawHub](/zh-TW/tools/clawhub) 發布與探索。Npm 仍支援直接安裝，也支援一組
暫時由 OpenClaw 擁有的 Plugin 套件，直到該遷移完成為止。

## 快速開始

如需可直接複製貼上的安裝、列出、解除安裝、更新和發布範例，請參閱
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

    然後在設定檔中的 `plugins.entries.\<id\>.config` 底下設定。

  </Step>

  <Step title="聊天原生管理">
    在執行中的 Gateway 裡，僅限擁有者使用的 `/plugins enable` 和 `/plugins disable`
    會觸發 Gateway 設定重新載入器。Gateway 會在程序內重新載入 Plugin 執行階段
    介面，而新的代理程式回合會從重新整理後的登錄重建工具清單。`/plugins install`
    會變更 Plugin 原始碼，因此 Gateway 會要求重新啟動，而不是假裝目前程序可以
    安全地重新載入已匯入的模組。

  </Step>

  <Step title="驗證 Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    當你需要證明已註冊的工具、服務、Gateway 方法、掛鉤，或 Plugin 擁有的 CLI 命令時，
    請使用 `--runtime`。單純的 `inspect` 是冷態資訊清單/登錄檢查，並刻意避免匯入
    Plugin 執行階段。

  </Step>
</Steps>

如果偏好聊天原生控制，請啟用 `commands.plugins: true` 並使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安裝路徑使用與 CLI 相同的解析器：本機路徑/封存檔、明確的
`clawhub:<pkg>`、明確的 `npm:<pkg>`、明確的 `git:<repo>`，或透過 npm 的裸套件
規格。

如果設定無效，安裝通常會以封閉模式失敗，並指引你執行
`openclaw doctor --fix`。唯一的復原例外是狹義的隨附 Plugin
重新安裝路徑，適用於選擇啟用
`openclaw.install.allowInvalidConfigRecovery` 的 Plugin。
在 Gateway 啟動期間，無效的 Plugin 設定會像其他無效設定一樣以封閉模式失敗。
執行 `openclaw doctor --fix` 可隔離不良的 Plugin 設定，做法是停用該 Plugin 項目
並移除其無效設定酬載；一般設定備份會保留先前的值。
當通道設定參照已無法探索的 Plugin，但相同的過時 Plugin ID 仍留在 Plugin 設定或安裝記錄中時，
Gateway 啟動會記錄警告並略過該通道，而不是封鎖其他所有通道。
執行 `openclaw doctor --fix` 可移除過時的通道/Plugin 項目；沒有過時 Plugin 證據的未知
通道鍵仍會驗證失敗，讓拼字錯誤保持可見。
如果設定了 `plugins.enabled: false`，過時的 Plugin 參照會被視為非作用中：
Gateway 啟動會略過 Plugin 探索/載入工作，而 `openclaw doctor` 會保留
已停用的 Plugin 設定，而不是自動移除它。如果你想移除過時的 Plugin ID，
請先重新啟用 Plugin，再執行 doctor 清理。

Plugin 依賴安裝只會在明確的安裝/更新或 doctor 修復流程期間發生。
Gateway 啟動、設定重新載入和執行階段檢查不會執行套件管理器，也不會修復依賴樹。
本機 Plugin 必須已經安裝其依賴，而 npm、git 和 ClawHub Plugin 會安裝在
OpenClaw 受管理的 Plugin 根目錄下。npm 依賴可能會提升到 OpenClaw 受管理的 npm 根目錄內；
安裝/更新會先掃描該受管理根目錄再信任它，而解除安裝會透過 npm 移除 npm 管理的套件。
外部 Plugin 和自訂載入路徑仍必須透過 `openclaw plugins install` 安裝。
使用 `openclaw plugins list --json` 可查看每個可見 Plugin 的靜態 `dependencyStatus`，
而不匯入執行階段程式碼或修復依賴。
如需安裝期間生命週期，請參閱 [Plugin 依賴解析](/zh-TW/plugins/dependency-resolution)。

對於 npm 安裝，像 `latest` 或發行標籤這類可變選擇器會在安裝前解析，
然後固定到 OpenClaw 受管理 npm 根目錄中已驗證的精確版本。npm 完成後，
OpenClaw 會驗證已安裝的 `package-lock.json` 項目仍符合解析後的版本與完整性。
如果 npm 寫入不同的套件中繼資料，安裝會失敗，且受管理套件會回復，而不是接受
不同的 Plugin 成品。

原始碼簽出是 pnpm 工作區。如果你複製 OpenClaw 來開發隨附 Plugin，
請執行 `pnpm install`；OpenClaw 接著會從 `extensions/<id>` 載入隨附 Plugin，
讓編輯內容和套件本機依賴可直接使用。
一般 npm 根目錄安裝適用於已打包的 OpenClaw，不適用於原始碼簽出開發。

## Plugin 類型

OpenClaw 可辨識兩種 Plugin 格式：

| 格式       | 運作方式                                                           | 範例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生**   | `openclaw.plugin.json` + 執行階段模組；在程序內執行               | 官方 Plugin、社群 npm 套件                             |
| **套件組合** | Codex/Claude/Cursor 相容結構；對應到 OpenClaw 功能               | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

兩者都會出現在 `openclaw plugins list` 下。如需套件組合詳細資訊，請參閱 [Plugin 套件組合](/zh-TW/plugins/bundles)。

如果你正在撰寫原生 Plugin，請從 [建置 Plugin](/zh-TW/plugins/building-plugins)
和 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview) 開始。

## 套件入口點

原生 Plugin npm 套件必須在 `package.json` 中宣告 `openclaw.extensions`。
每個項目都必須位於套件目錄內，並解析為可讀取的執行階段檔案，
或解析為 TypeScript 原始檔，且可推斷出建置後的 JavaScript 對應檔案，
例如從 `src/index.ts` 到 `dist/index.js`。
已打包安裝必須隨附該 JavaScript 執行階段輸出。TypeScript
原始碼後援適用於原始碼簽出和本機開發路徑，不適用於安裝到 OpenClaw
受管理 Plugin 根目錄中的 npm 套件。

當已發布的執行階段檔案不在原始碼項目的相同路徑時，請使用
`openclaw.runtimeExtensions`。存在時，`runtimeExtensions` 必須為每個
`extensions` 項目包含剛好一個項目。清單不相符會使安裝和 Plugin 探索失敗，
而不是默默後援到原始碼路徑。如果你也發布 `openclaw.setupEntry`，請使用
`openclaw.runtimeSetupEntry` 指向其建置後的 JavaScript 對應檔案；宣告後該檔案即為必要檔案。

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

ClawHub 是大多數 Plugin 的主要發行路徑。目前已打包的
OpenClaw 版本已隨附許多官方 Plugin，因此在一般設定中不需要
單獨的 npm 安裝。在每個由 OpenClaw 擁有的 Plugin 都遷移到
ClawHub 之前，OpenClaw 仍會在 npm 上提供一些 `@openclaw/*` Plugin 套件，
供較舊/自訂安裝和直接 npm 工作流程使用。

如果 npm 將某個 `@openclaw/*` Plugin 套件回報為已棄用，該套件
版本來自較舊的外部套件發行線。請使用目前 OpenClaw 中隨附的 Plugin，
或使用本機簽出，直到較新的 npm 套件發布為止。

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
  <Accordion title="模型提供者（預設啟用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="記憶 Plugin">
    - `memory-core` — 隨附的記憶搜尋（透過 `plugins.slots.memory` 預設使用）
    - `memory-lancedb` — 由 LanceDB 支援的長期記憶，具備自動召回/擷取（設定 `plugins.slots.memory = "memory-lancedb"`）

    如需與 OpenAI 相容的嵌入設定、Ollama 範例、召回限制和疑難排解，請參閱
    [Memory LanceDB](/zh-TW/plugins/memory-lancedb)。

  </Accordion>

  <Accordion title="語音提供者（預設啟用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 隨附的瀏覽器 Plugin，用於瀏覽器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、瀏覽器執行階段，以及預設瀏覽器控制服務（預設啟用；替換前請先停用）
    - `copilot-proxy` — VS Code Copilot Proxy 橋接器（預設停用）

  </Accordion>
</AccordionGroup>

正在尋找第三方 Plugin 嗎？請參閱 [社群 Plugin](/zh-TW/plugins/community)。

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

| 欄位               | 描述                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | 主開關（預設：`true`）                                   |
| `allow`            | Plugin 允許清單（可選）                                  |
| `bundledDiscovery` | 內建 Plugin 探索模式（預設為 `allowlist`）               |
| `deny`             | Plugin 拒絕清單（可選；拒絕優先）                       |
| `load.paths`       | 額外的 Plugin 檔案/目錄                                  |
| `slots`            | 專屬插槽選擇器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>`   | 個別 Plugin 開關 + 設定                                  |

`plugins.allow` 是排他的。當它非空時，只有列出的 Plugin 可以載入或公開工具，即使 `tools.allow` 包含 `"*"` 或特定由 Plugin 擁有的工具名稱也一樣。如果工具允許清單引用 Plugin 工具，請將擁有該工具的 Plugin id 加到 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 會針對這種形態發出警告。

`plugins.bundledDiscovery` 對新設定預設為 `"allowlist"`，因此限制性的 `plugins.allow` 清單也會封鎖未列入的內建提供者 Plugin，包括執行階段網頁搜尋提供者探索。Doctor 會在遷移期間將較舊的限制性允許清單設定標記為 `"compat"`，讓升級在操作者選擇更嚴格模式前，持續保留舊版內建提供者行為。空的 `plugins.allow` 仍會被視為未設定/開放。

透過 `/plugins enable` 或 `/plugins disable` 進行的設定變更會觸發程序內 Gateway Plugin 重新載入。新的代理回合會從重新整理後的 Plugin 登錄重新建構其工具清單。安裝、更新和解除安裝等變更來源的操作仍會重新啟動 Gateway 程序，因為已匯入的 Plugin 模組無法安全地原地替換。

`openclaw plugins list` 是本機 Plugin 登錄/設定快照。其中顯示為 `enabled` 的 Plugin 表示持久化登錄與目前設定允許該 Plugin 參與。這不代表已在執行中的遠端 Gateway 已重新載入或重新啟動到相同的 Plugin 程式碼。在使用包裝程序的 VPS/容器設定中，請將重新啟動或會觸發重新載入的寫入傳送到實際的 `openclaw gateway run` 程序，或在重新載入回報失敗時，對執行中的 Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **已停用**：Plugin 存在，但啟用規則將其關閉。設定會保留。
  - **遺失**：設定引用了探索未找到的 Plugin id。
  - **無效**：Plugin 存在，但其設定不符合宣告的結構描述。Gateway 啟動只會略過該 Plugin；`openclaw doctor --fix` 可以透過停用它並移除其設定酬載，將無效項目隔離。

</Accordion>

## 探索與優先順序

OpenClaw 會依照此順序掃描 Plugin（第一個符合者優先）：

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — 明確的檔案或目錄路徑。指回 OpenClaw 自身封裝內建 Plugin 目錄的路徑會被忽略；請執行 `openclaw doctor --fix` 以移除那些過時別名。
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Bundled plugins">
    隨 OpenClaw 出貨。許多預設啟用（模型提供者、語音）。其他則需要明確啟用。
  </Step>
</Steps>

封裝安裝與 Docker 映像通常會從編譯後的 `dist/extensions` 樹解析內建 Plugin。如果內建 Plugin 原始碼目錄被 bind mount 到相符的封裝原始碼路徑上，例如 `/app/extensions/synology-chat`，OpenClaw 會將該掛載的原始碼目錄視為內建原始碼覆蓋層，並在封裝的 `/app/dist/extensions/synology-chat` bundle 之前探索它。這能讓維護者容器迴圈持續運作，而不必將每個內建 Plugin 切回 TypeScript 原始碼。設定 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可強制使用封裝的 dist bundle，即使存在原始碼覆蓋層掛載也一樣。

### 啟用規則

- `plugins.enabled: false` 會停用所有 Plugin，並略過 Plugin 探索/載入工作
- `plugins.deny` 一律優先於允許
- `plugins.entries.\<id\>.enabled: false` 會停用該 Plugin
- 工作區來源的 Plugin **預設停用**（必須明確啟用）
- 內建 Plugin 會遵循內建的預設開啟集合，除非被覆寫
- 專屬插槽可以強制啟用該插槽所選的 Plugin
- 某些內建選擇加入 Plugin 會在設定指定由 Plugin 擁有的介面時自動啟用，例如提供者模型參照、頻道設定或測試框架執行階段
- 當 `plugins.enabled: false` 啟用時，過時的 Plugin 設定會被保留；如果你希望移除過時 id，請先重新啟用 Plugin 再執行 doctor 清理
- OpenAI 系列 Codex 路由會維持獨立的 Plugin 邊界：`openai-codex/*` 屬於 OpenAI Plugin，而內建 Codex app-server Plugin 由 `agentRuntime.id: "codex"` 或舊版 `codex/*` 模型參照選取

## 疑難排解執行階段 hook

如果某個 Plugin 出現在 `plugins list` 中，但 `register(api)` 副作用或 hook 未在即時聊天流量中執行，請先檢查以下項目：

- 執行 `openclaw gateway status --deep --require-rpc`，並確認作用中的 Gateway URL、設定檔、設定路徑與程序就是你正在編輯的那些。
- 在 Plugin 安裝/設定/程式碼變更後重新啟動即時 Gateway。在包裝容器中，PID 1 可能只是監督器；請重新啟動子 `openclaw gateway run` 程序或向其傳送訊號。
- 使用 `openclaw plugins inspect <id> --runtime --json` 確認 hook 註冊與診斷。非內建對話 hook，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 對於模型切換，請優先使用 `before_model_resolve`。它會在代理回合的模型解析前執行；`llm_output` 只會在一次模型嘗試產生助理輸出後執行。
- 若要證明有效的工作階段模型，請使用 `openclaw sessions` 或 Gateway 工作階段/狀態介面；偵錯提供者酬載時，請以 `--raw-stream --raw-stream-path <path>` 啟動 Gateway。

### 緩慢的 Plugin 工具設定

如果代理回合在準備工具時看似停滯，請啟用追蹤記錄並檢查 Plugin 工具工廠計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出總工廠時間與最慢的 Plugin 工具工廠，包括 Plugin id、宣告的工具名稱、結果形態，以及該工具是否為可選。當單一工廠耗時至少 1 秒，或 Plugin 工具工廠準備總耗時至少 5 秒時，緩慢行會提升為警告。

OpenClaw 會針對相同有效請求情境的重複解析，快取成功的 Plugin 工具工廠結果。快取鍵包含有效執行階段設定、工作區、代理/工作階段 id、沙箱政策、瀏覽器設定、遞送情境、請求者身分與擁有權狀態，因此依賴這些受信任欄位的工廠會在情境變更時重新執行。

如果某個 Plugin 佔據大部分計時，請檢查其執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

接著更新、重新安裝或停用該 Plugin。Plugin 作者應將昂貴的依賴載入移到工具執行路徑後方，而不是在工具工廠內完成。

### 重複的頻道或工具擁有權

症狀：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

這表示有多個已啟用的 Plugin 嘗試擁有相同的頻道、設定流程或工具名稱。最常見的原因是外部頻道 Plugin 與現在提供相同頻道 id 的內建 Plugin 並存安裝。

偵錯步驟：

- 執行 `openclaw plugins list --enabled --verbose`，查看每個已啟用的 Plugin 與來源。
- 對每個疑似 Plugin 執行 `openclaw plugins inspect <id> --runtime --json`，並比較 `channels`、`channelConfigs`、`tools` 與診斷。
- 安裝或移除 Plugin 套件後，執行 `openclaw plugins registry --refresh`，讓持久化中繼資料反映目前安裝。
- 在安裝、登錄或設定變更後重新啟動 Gateway。

修正選項：

- 如果某個 Plugin 有意替換另一個相同頻道 id 的 Plugin，偏好的 Plugin 應宣告 `channelConfigs.<channel-id>.preferOver`，並填入較低優先順序的 Plugin id。請參閱 [/plugins/manifest#replacing-another-channel-plugin](/zh-TW/plugins/manifest#replacing-another-channel-plugin)。
- 如果重複是意外造成，請使用 `plugins.entries.<plugin-id>.enabled: false` 停用其中一方，或移除過時的 Plugin 安裝。
- 如果你明確啟用了兩個 Plugin，OpenClaw 會保留該請求並回報衝突。請為該頻道選擇一個擁有者，或重新命名由 Plugin 擁有的工具，讓執行階段介面明確無歧義。

## Plugin 插槽（專屬類別）

某些類別是專屬的（同一時間只能有一個作用中）：

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

| 插槽            | 控制內容              | 預設                |
| --------------- | --------------------- | ------------------- |
| `memory`        | 作用中的記憶體 Plugin | `memory-core`       |
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

內建 Plugin 隨 OpenClaw 一起提供。許多預設為啟用（例如內建模型提供者、內建語音提供者，以及內建瀏覽器 Plugin）。其他內建 Plugin 仍需要執行 `openclaw plugins enable <id>`。

`--force` 會就地覆寫既有已安裝的 Plugin 或 hook pack。例行升級受追蹤的 npm Plugin 時，請使用 `openclaw plugins update <id-or-npm-spec>`。它不支援與 `--link` 搭配使用，因為 `--link` 會重用來源路徑，而不是複製到受管理的安裝目標上。

當已設定 `plugins.allow` 時，`openclaw plugins install` 會先將已安裝的 Plugin id 加入該允許清單，再啟用它。如果同一個 Plugin id 存在於 `plugins.deny`，安裝流程會移除該過時的拒絕項目，讓明確安裝的 Plugin 在重新啟動後可立即載入。

OpenClaw 會保留持久化的本機 Plugin 登錄，作為 Plugin 清單、貢獻歸屬與啟動規劃的冷讀取模型。安裝、更新、解除安裝、啟用與停用流程會在變更 Plugin 狀態後重新整理該登錄。同一個 `plugins/installs.json` 檔案會在頂層 `installRecords` 保留持久安裝中繼資料，並在 `plugins` 保留可重建的 manifest 中繼資料。如果登錄遺失、過時或無效，`openclaw plugins registry --refresh` 會從安裝記錄、設定政策，以及 manifest/package 中繼資料重建其 manifest 視圖，而不載入 Plugin runtime 模組。
`openclaw plugins update <id-or-npm-spec>` 適用於受追蹤的安裝。傳入帶有 dist-tag 或精確版本的 npm package spec，會將套件名稱解析回受追蹤的 Plugin 記錄，並記錄新的 spec 供未來更新使用。傳入不含版本的套件名稱，會將精確釘選的安裝移回登錄的預設發行線。如果已安裝的 npm Plugin 已符合解析後的版本與已記錄的 artifact 身分，OpenClaw 會略過更新，不下載、不重新安裝，也不重寫設定。
當 `openclaw update` 在 beta channel 執行時，預設線的 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，並在沒有 Plugin beta 發行版時退回預設/latest。精確版本與明確標籤會維持釘選。

`--pin` 僅適用於 npm。它不支援與 `--marketplace` 搭配使用，因為 marketplace 安裝會持久化 marketplace 來源中繼資料，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用於內建危險程式碼掃描器誤判的緊急覆寫。它允許 Plugin 安裝與 Plugin 更新在內建 `critical` 發現項目後繼續進行，但仍不會略過 Plugin `before_install` 政策封鎖或掃描失敗封鎖。安裝掃描會忽略常見測試檔案與目錄，例如 `tests/`、`__tests__/`、`*.test.*` 與 `*.spec.*`，以避免封鎖打包的測試 mock；宣告的 Plugin runtime 進入點即使使用上述名稱之一，仍會被掃描。

此 CLI 旗標只適用於 Plugin 安裝/更新流程。Gateway 支援的 skill 相依項安裝會改用對應的 `dangerouslyForceUnsafeInstall` request 覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

如果你在 ClawHub 發佈的 Plugin 因掃描而被隱藏或封鎖，請開啟 ClawHub 儀表板，或執行 `clawhub package rescan <name>` 要求 ClawHub 再次檢查。`--dangerously-force-unsafe-install` 只會影響你自己機器上的安裝；它不會要求 ClawHub 重新掃描 Plugin，也不會讓被封鎖的發行版公開。

相容 bundle 會參與相同的 Plugin list/inspect/enable/disable 流程。目前 runtime 支援包含 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` 與 manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄。

`openclaw plugins inspect <id>` 也會回報偵測到的 bundle 功能，以及 bundle 支援 Plugin 的已支援或不支援 MCP 與 LSP server 項目。

Marketplace 來源可以是來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱、本機 marketplace root 或 `marketplace.json` 路徑、像 `owner/repo` 這類 GitHub 簡寫、GitHub repo URL，或 git URL。對於遠端 marketplace，Plugin 項目必須留在已複製的 marketplace repo 內，且只能使用相對路徑來源。

完整細節請參閱 [`openclaw plugins` CLI 參考](/zh-TW/cli/plugins)。

## Plugin API 概覽

Native Plugin 會匯出一個 entry 物件，公開 `register(api)`。較舊的 Plugin 仍可使用 `activate(api)` 作為舊版別名，但新的 Plugin 應使用 `register`。

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

OpenClaw 會載入 entry 物件，並在 Plugin 啟用期間呼叫 `register(api)`。載入器仍會對較舊的 Plugin 退回使用 `activate(api)`，但內建 Plugin 與新的外部 Plugin 應將 `register` 視為公開合約。

`api.registrationMode` 會告訴 Plugin 其 entry 為何被載入：

| 模式            | 意義                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime 啟用。註冊工具、hook、服務、命令、路由與其他即時副作用。                              |
| `discovery`     | 唯讀功能探索。註冊提供者與中繼資料；受信任的 Plugin entry 程式碼可能會載入，但應略過即時副作用。 |
| `setup-only`    | 透過輕量 setup entry 載入 channel setup 中繼資料。                                                                |
| `setup-runtime` | 同時需要 runtime entry 的 channel setup 載入。                                                                         |
| `cli-metadata`  | 僅收集 CLI 命令中繼資料。                                                                                            |

會開啟 socket、database、background worker 或長生命週期 client 的 Plugin entry，應使用 `api.registrationMode === "full"` 保護這些副作用。Discovery 載入會與 activation 載入分開快取，且不會取代執行中的 Gateway 登錄。Discovery 是非啟用的，但不是免 import：OpenClaw 可能會評估受信任的 Plugin entry 或 channel Plugin 模組來建立 snapshot。請讓模組頂層保持輕量且無副作用，並將 network client、subprocess、listener、credential 讀取與 service startup 移到完整 runtime 路徑後方。

常見註冊方法：

| 方法                                  | 註冊項目           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供者 (LLM)        |
| `registerChannel`                       | 聊天 channel                |
| `registerTool`                          | Agent 工具                  |
| `registerHook` / `on(...)`              | 生命週期 hook             |
| `registerSpeechProvider`                | 文字轉語音 / STT        |
| `registerRealtimeTranscriptionProvider` | 串流 STT               |
| `registerRealtimeVoiceProvider`         | 雙工即時語音       |
| `registerMediaUnderstandingProvider`    | 影像/音訊分析        |
| `registerImageGenerationProvider`       | 影像生成            |
| `registerMusicGenerationProvider`       | 音樂生成            |
| `registerVideoGenerationProvider`       | 影片生成            |
| `registerWebFetchProvider`              | Web fetch / scrape 提供者 |
| `registerWebSearchProvider`             | Web 搜尋                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | 背景服務          |

Typed lifecycle hook 的 hook guard 行為：

- `before_tool_call`: `{ block: true }` 是終止性的；較低優先順序的 handler 會被略過。
- `before_tool_call`: `{ block: false }` 是 no-op，且不會清除先前的 block。
- `before_install`: `{ block: true }` 是終止性的；較低優先順序的 handler 會被略過。
- `before_install`: `{ block: false }` 是 no-op，且不會清除先前的 block。
- `message_sending`: `{ cancel: true }` 是終止性的；較低優先順序的 handler 會被略過。
- `message_sending`: `{ cancel: false }` 是 no-op，且不會清除先前的 cancel。

Native Codex app-server 會將 Codex-native tool event 橋接回此 hook 介面。Plugin 可以透過 `before_tool_call` 封鎖 native Codex tool，透過 `after_tool_call` 觀察結果，並參與 Codex `PermissionRequest` 核准。此橋接尚未重寫 Codex-native tool 引數。確切的 Codex runtime 支援邊界位於 [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

完整 typed hook 行為請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview#hook-decision-semantics)。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立你自己的 Plugin
- [Plugin 套件組合](/zh-TW/plugins/bundles) — Codex/Claude/Cursor 套件組合相容性
- [Plugin 資訊清單](/zh-TW/plugins/manifest) — 資訊清單結構描述
- [註冊工具](/zh-TW/plugins/building-plugins#registering-agent-tools) — 在 Plugin 中新增代理工具
- [Plugin 內部架構](/zh-TW/plugins/architecture) — 能力模型與載入管線
- [社群 Plugin](/zh-TW/plugins/community) — 第三方清單
