---
read_when:
    - 將 iOS/watchOS/Android 節點配對至閘道
    - 使用節點畫布／相機提供代理程式情境資訊
    - 新增節點命令或命令列介面輔助工具
summary: 節點：配對、功能、權限，以及用於畫布／相機／螢幕／裝置／通知／系統的命令列介面輔助工具
title: 節點
x-i18n:
    generated_at: "2026-07-12T21:24:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c3a13a2b879bef2356a7b28fe207842d64061ba5333f14a1435cc65ae6da85f1
    source_path: nodes/index.md
    workflow: 16
---

**節點**是連線至閘道的搭配裝置（macOS/iOS/watchOS/Android/無頭裝置），使用 `role: "node"`，並透過 `node.invoke` 公開命令介面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。大多數節點會在操作員連接埠上使用閘道 WebSocket。選用的 Apple Watch 直接連線節點會在同一個連接埠上使用簽署的 HTTPS 輪詢，因為 watchOS 會阻擋一般 App 使用通用的低階網路功能。通訊協定詳細資訊：[閘道通訊協定](/zh-TW/gateway/protocol)。

舊版傳輸方式：[橋接通訊協定](/zh-TW/gateway/bridge-protocol)（TCP JSONL；對目前節點而言僅供歷史參考）。

macOS 也能以**節點模式**執行：選單列 App 會以一個節點連線至閘道的
WS 伺服器（因此 `openclaw nodes …` 可對這台 Mac 使用）。此 App
會將原生 Canvas、相機、螢幕、通知與電腦控制命令
新增至 `openclaw node run` 所使用的相同節點主機命令介面。請勿在
該 Mac 上啟動第二個命令列介面節點；此 App 會將對應的命令列介面節點主機執行階段作為
內部工作程序執行，並維持為唯一的閘道連線與節點身分。

節點是**周邊裝置**，不是閘道：它們不會執行閘道服務，而頻道訊息（Telegram、WhatsApp 等）會送達閘道，而非節點。

疑難排解操作手冊：[/nodes/troubleshooting](/zh-TW/nodes/troubleshooting)

## 配對與狀態

節點使用**裝置配對**。節點在連線期間會提供已簽署的裝置身分；閘道會為 `role: node` 建立裝置配對請求。請透過裝置命令列介面（或 UI）核准。Apple Watch 直接連線設定使用由管理員產生、短效且僅供節點使用的設定碼，核准其固定的低風險命令介面；後續擴充功能仍需要一般核准。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

待處理的配對請求會在裝置最後一次重試的 5 分鐘後到期——持續重新連線的裝置會維持其單一待處理請求（及 `requestId`）有效，而不是每隔幾分鐘產生新的提示；如需完整的請求／核准生命週期，請參閱[節點配對](/zh-TW/gateway/pairing)。如果節點使用已變更的驗證詳細資訊（角色／範圍／公開金鑰）重試，先前的待處理請求會被取代，並建立新的 `requestId`——用戶端會收到被取代請求的 `device.pair.resolved` 事件，而你應在核准前重新執行 `openclaw devices list`。

- 當裝置配對角色包含 `node` 時，`nodes status` 會將節點標示為**已配對**。
- 已連線且具備「輔助使用」權限的原生 Mac 可以回報合併後的
  實體輸入活動。閘道會將最近仍符合資格的 Mac 標示為
  `active`、提供代理程式穩定的節點 ID 提示，並優先將節點連線
  警示路由至該處，之後才延遲改用備援。設定、隱私權、時序與
  疑難排解資訊請參閱
  [使用中電腦的存在狀態](/zh-TW/nodes/presence)。
- 裝置配對記錄是持久的已核准角色契約。權杖輪替仍受該契約約束；它無法將已配對節點升級至配對核准從未授予的角色。
- `node.pair.*`（命令列介面：`openclaw nodes pending/approve/reject/remove/rename`）是另一個由閘道擁有的節點配對儲存區，用於追蹤節點在重新連線期間獲准的命令／功能介面。它**不會**控管傳輸驗證——這由裝置配對負責。
- `openclaw nodes remove --node <id|name|ip>` 會移除節點配對。對於由裝置支援的節點，它會在已配對裝置儲存區中撤銷該裝置的 `node` 角色，並中斷該裝置的節點角色工作階段：多角色裝置會保留其資料列，且只失去 `node` 角色；僅有節點角色的裝置資料列則會被刪除。它也會清除另一個節點配對儲存區中的所有相符項目。`operator.pairing` 可以移除其他裝置上的非操作員節點資料列；如果裝置權杖呼叫端要在多角色裝置上撤銷自己的節點角色，還需要 `operator.admin`。
- 核准範圍依待處理請求所宣告的命令而定：
  - 不含命令的請求：`operator.pairing`
  - 非執行類節點命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 版本落差與升級順序

閘道 WebSocket 可在 N-1 通訊協定範圍內接受已驗證的節點用戶端。
因此，目前的 v4 閘道可接受 v3 節點，前提是連線同時宣告
`role: "node"` 與 `client.mode: "node"`。操作員與 UI 工作階段仍
必須使用目前的通訊協定。

若要分階段升級裝置群組，請先升級閘道，再逐一升級各節點。
N-1 節點在升級期間仍可見且可管理；閘道會記錄
`legacy node protocol accepted`，並附上升級建議。配對、
裝置驗證、命令允許清單與執行核准仍然適用。
外掛擁有的功能與命令會保持隱藏，直到節點升級至
目前的通訊協定。早於 N-1 的節點必須先透過頻外方式升級，
才能重新連線。

watchOS 直接 HTTPS 傳輸需要目前的通訊協定版本；啟用直接模式前，
請一併更新 Watch App 與閘道。

## 遠端節點主機（system.run）

當閘道在一台機器上執行，而你希望在另一台機器上執行命令時，請使用**節點主機**。模型仍會與**閘道**通訊；選取 `host=node` 時，閘道會將 `exec` 呼叫轉送至**節點主機**。

| 角色         | 責任                                                             |
| ------------ | ---------------------------------------------------------------- |
| 閘道主機     | 接收訊息、執行模型、路由工具呼叫。                               |
| 節點主機     | 在節點機器上執行 `system.run`/`system.which`。                    |
| 核准         | 透過節點主機上的 `~/.openclaw/exec-approvals.json` 強制執行。     |

核准注意事項：

- 由核准支援的節點執行會綁定確切的請求情境。執行路徑會在核准前準備標準化的 `systemRunPlan`；授予核准後，閘道會轉送該已儲存的計畫，而不是呼叫端之後編輯的命令／cwd／工作階段欄位，並會在執行前重新驗證工作目錄。
- 對於直接執行 Shell／執行階段檔案的情況，OpenClaw 也會盡可能綁定一個具體的本機檔案運算元；若該檔案在執行前發生變更，就會拒絕執行。
- 如果 OpenClaw 無法為直譯器／執行階段命令精確識別出一個具體的本機檔案，由核准支援的執行將遭拒絕，而不會佯稱能完整涵蓋執行階段。若需要更廣泛的直譯器語意，請使用沙箱、獨立主機，或明確受信任的允許清單／完整工作流程。

### 啟動節點主機（前景）

在節點機器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` 也接受 `--context-path`（閘道 WS 情境路徑）、`--tls`、`--tls-fingerprint <sha256>` 與 `--node-id`（覆寫舊版用戶端執行個體 ID；這不會重設配對）。

### 透過 SSH 通道連線至遠端閘道（迴環綁定）

如果閘道綁定至迴環位址（`gateway.bind=loopback`，本機模式的預設值），遠端節點主機便無法直接連線。請建立 SSH 通道，並將節點主機指向通道的本機端點。

範例（節點主機 -> 閘道主機）：

```bash
# 終端機 A（保持執行）：將本機 18790 轉送至閘道 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 終端機 B：匯出閘道權杖並透過通道連線
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意事項：

- `openclaw node run` 支援權杖或密碼驗證。
- 建議使用環境變數：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定備援值為 `gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機會刻意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在遠端模式中，依照遠端優先順序規則，可以使用 `gateway.remote.token` / `gateway.remote.password`。
- 如果已設定使用中的本機 `gateway.auth.*` SecretRefs，但無法解析，節點主機驗證會以封閉方式失敗。
- 節點主機驗證解析只會採用 `OPENCLAW_GATEWAY_*` 環境變數。

### 啟動節點主機（服務）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` 也接受 `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`（僅限舊版用戶端執行個體 ID）、`--runtime <node|bun>`（預設值：node）與用於重新安裝的 `--force`。也可使用 `node status`、`node stop` 與 `node uninstall`。

### 配對與命名

在閘道主機上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果節點使用已變更的驗證詳細資訊重試，請重新執行 `openclaw devices list`，並核准目前的 `requestId`。

命名選項：

- 在 `openclaw node run` / `openclaw node install` 上使用 `--display-name`（會持久儲存在節點的 `~/.openclaw/node.json` 中，與用戶端執行個體 ID 和閘道連線中繼資料放在一起）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（閘道覆寫）。

### 節點託管的 MCP 伺服器

請在節點機器（而非
閘道）上的 `openclaw.json` 中設定 MCP 伺服器：

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

無頭節點主機會啟動這些伺服器、列出其工具，並在連線後發布
描述項。工具呼叫會透過 `mcp.tools.call.v1` 返回該節點；
閘道不需要相符的 MCP 設定或 JS 外掛。
此節點託管的 v1 路徑不支援 OAuth MCP 伺服器。

目前的節點主機即使未設定 MCP 伺服器，也會在初始配對期間宣告
內建的 `mcp.tools.call.v1` 命令系列。在較舊 OpenClaw 版本上配對的
節點，可能會在節點主機更新後請求一次性的命令介面升級。
之後新增、移除或篩選伺服器不需要重新配對，因為已核准的
命令系列並未變更。請重新啟動 `openclaw node run` 或執行
`openclaw node restart`，以套用節點 MCP 設定變更；
節點主機不會監看此設定。

閘道操作員可以使用
`gateway.nodes.pluginTools.enabled: false`，忽略已配對節點發布的所有代理程式可見工具，
包括節點託管的 MCP 工具。精確的命令拒絕設定，例如
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`，也會阻擋執行。

### 節點託管的 Skills

請將 Skills 安裝至節點機器使用中的 OpenClaw Skills 目錄，
預設為 `~/.openclaw/skills`。`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR` 與
`OPENCLAW_CONFIG_PATH` 會移動該使用中設定檔。對 Skills 而言，
`OPENCLAW_STATE_DIR` 優先；否則，`skills/` 會位於
`openclaw config file` 所輸出路徑的同一層。無頭節點主機會在
連線後發布有效的 `SKILL.md` 檔案，而閘道只會在該節點保持連線時，
將它們新增至代理程式 Skills 快照。每個 Skills 目錄名稱都必須符合
frontmatter 的 `name` 欄位，使抽象節點定位器可以對應至單一項目，
而不必新增另一個通訊協定欄位。

初始節點角色配對會核准 Skills 發布。新增、移除或
變更 Skills 不需要再次配對，也不需要變更閘道設定。
變更節點 Skills 檔案後，請重新啟動 `openclaw node run` 或執行
`openclaw node restart`；節點主機不會監看 Skills 目錄。

由節點託管的 Skill 項目會識別其節點並帶有執行位置。Skill 檔案、以相對路徑參照的檔案及二進位檔都會保留在該節點上。代理程式使用一般的 `read` 工具讀取公告的 `node://.../SKILL.md` 位置。`file_fetch` 接受經操作員核准的節點絕對路徑，而不接受節點 Skill 定位器；沒有一般 read 工具的執行環境可以改為透過 `exec host=node node=<node-id>` 執行 `cat SKILL.md`，並將公告的 `node://.../skills/<name>` 目錄設為 `workdir`。參照的檔案及二進位檔使用相同的 exec 目標與 workdir。節點主機會以其作用中的 OpenClaw 狀態目錄解析該定位器，因此相對路徑會在節點上解析，而不是在閘道電腦上解析。發布節點必須已核准 `system.run`，且代理程式的 exec 政策必須允許 `host=node`；否則該 Skill 不會出現在該代理程式的快照中。

在節點上設定 `nodeHost.skills.enabled: false` 可停止發布。閘道操作員可以使用 `gateway.nodes.skills.enabled: false` 忽略所有已配對節點的 Skill。

### 無介面身分狀態

無介面節點會保留三個獨立的狀態檔案：

- `~/.openclaw/node.json`：舊版用戶端執行個體 ID（儲存為 `nodeId`）、顯示名稱及閘道連線中繼資料。
- `~/.openclaw/identity/device.json`：已簽署的裝置金鑰組及衍生出的密碼學裝置 ID。
- `~/.openclaw/identity/device-auth.json`：以密碼學裝置 ID 和角色為索引鍵的已配對裝置驗證權杖。

對於已簽署的節點，閘道會使用密碼學裝置 ID 進行配對及節點路由。用戶端執行個體 ID 僅為連線中繼資料。因此，變更 `--node-id` 或只刪除 `node.json` 並不會重設配對。請參閱[身分與配對狀態](/zh-TW/cli/node#identity-and-pairing-state)，了解支援的撤銷並重新配對流程及升級注意事項。

### 將命令加入允許清單

Exec 核准是**針對每個節點主機**設定的。從閘道新增允許清單項目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

核准資訊儲存在節點主機的 `~/.openclaw/exec-approvals.json`。

### 將 exec 指向節點

設定預設值（閘道設定）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或針對個別工作階段設定：

```text
/exec host=node security=allowlist node=<id-or-name>
```

設定完成後，任何帶有 `host=node` 的 `exec` 呼叫都會在節點主機上執行（仍受節點允許清單／核准限制）。

`host=auto` 不會自行隱含選擇節點，但在 `auto` 模式下允許個別呼叫明確要求 `host=node`。如果要讓節點 exec 成為工作階段的預設值，請明確設定 `tools.exec.host=node` 或 `/exec host=node ...`。

相關內容：

- [節點主機命令列介面](/zh-TW/cli/node)
- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)

### 本機模型推論

桌面或伺服器節點可以公開由該節點上執行的 Ollama 伺服器所提供、支援聊天的模型。代理程式使用 Ollama 外掛的 `node_inference` 工具探索已安裝的模型，並在遠端執行有範圍限制的提示；閘道不需要能直接透過網路存取 Ollama。請參閱 [Ollama 節點本機推論](/zh-TW/providers/ollama#node-local-inference)，了解設定、模型篩選及直接驗證命令。

### Codex 工作階段與逐字記錄

官方 `codex` 外掛可以公開無介面節點主機或原生 macOS 節點上未封存的 Codex 工作階段。目錄註冊不再依賴 `supervision.enabled`；該選項控制代理程式可用的監督工具。這兩台電腦仍必須都啟用此外掛，而節點設定仍代表本機同意：只在閘道上啟用並無法讀取另一台電腦的 Codex 狀態。

節點會公告具版本的唯讀命令 `codex.appServer.threads.list.v1` 和 `codex.appServer.thread.turns.list.v1`。這些命令首次出現時，請核准節點配對升級。閘道會透過一般的外掛節點政策叫用它們，並依主機隔離失敗。

已配對節點的資料列會以 **Codex** 群組顯示在一般工作階段側邊欄中。選取資料列會開啟一般的聊天窗格，並透過有範圍限制、使用游標分頁且完整投影項目的 `thread/turns/list` 呼叫，讀取其持久保存的逐字記錄。節點叫用傳輸僅支援請求／回應，無法承載透過 Codex 控制框架繼續原生執行緒所需的串流輪次、即時事件或核准。因此，遠端資料列無法使用**繼續**和**封存**。在閘道電腦上，已儲存及閒置的資料列可以啟動獨立且鎖定模型的聊天分支。只有在操作員確認沒有其他 Codex 用戶端正在使用資料列後，才能封存任一種資料列；已儲存資料列的即時活動狀態仍屬未知。作用中的資料列無法建立分支或封存。

請參閱[監督 Codex 工作階段](/zh-TW/plugins/codex-supervision)，了解設定、分頁、本機接續及中繼資料安全邊界。

### Claude 工作階段與逐字記錄

隨附的 `anthropic` 外掛會探索閘道和已配對節點上未封存的 Claude 命令列介面及 Claude Desktop 工作階段。與 Codex 監督不同，這不需要另外選擇加入：當 Anthropic 外掛已啟用且 `~/.claude/projects/` 存在時，遠端 macOS 應用程式節點會公告 `anthropic.claude.sessions.list.v1` 和 `anthropic.claude.sessions.read.v1`。這些命令首次出現時，請核准節點配對升級。

目錄會結合有效的 Claude 命令列介面專案索引記錄，以及目前 `sdk-cli` JSONL 檔案中有範圍限制的中繼資料前綴。Claude Desktop 的本機中繼資料會提供 Desktop 標題及封存狀態。當兩個來源指向相同的 Claude Code 工作階段 ID 時，以 Desktop 中繼資料為準；只有命令列介面的逐字記錄仍會顯示，因為命令列介面沒有封存旗標。逐字記錄讀取使用不透明的位元組位移游標及有範圍限制的反向檔案讀取，因此選取大型工作階段或載入較舊頁面時，不會將整個 JSONL 歷程讀入單一閘道回應。

這兩個節點命令皆為唯讀。它們只會透過通用的 `sessions.catalog.list` 和 `sessions.catalog.read` 方法，向具有 `operator.write` 的已驗證操作員連線公開目錄中繼資料及逐字記錄內容。已配對節點的資料列維持僅供檢視。可以從一般聊天撰寫器接管閘道本機的 Claude 命令列介面資料列：OpenClaw 會匯入有範圍限制的可見歷程、在第一輪使用 `--fork-session` 繼續，並保持來源逐字記錄不變。Claude Desktop 資料列維持僅供檢視。

請參閱 [Anthropic：跨電腦的 Claude 工作階段](/zh-TW/providers/anthropic#claude-sessions-across-computers)，了解控制介面的行為及儲存來源。

## 叫用命令

低階（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` 會封鎖 `system.run` 和 `system.run.prepare`；這些命令只能透過帶有 `host=node` 的 `exec` 工具執行（請見上文）。針對常見的「為代理程式提供 MEDIA 附件」工作流程（畫布、相機、螢幕、位置，見下文），另有較高階的輔助功能可用。

## 命令政策

節點命令必須通過兩道關卡才能叫用：

1. 節點必須在其已驗證的連線中繼資料（`connect.commands`）中宣告該命令。
2. 閘道依平台及核准衍生出的允許清單必須包含已宣告的命令。

各平台的預設允許清單（套用外掛預設值及 `allowCommands`／`denyCommands` 覆寫之前）：

| 平台 | 預設允許的命令                                                                                                                                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（節點主機命令（例如 `system.run`）受核准限制，請見下文）                                                                                                                                                                                                                                              |

這些資料列描述的是閘道政策上限，而不是每個節點應用程式所實作的命令。只有在已連線節點也宣告該命令時，才能使用它。特別是目前的 macOS 應用程式並未宣告 macOS 政策資料列中列出的裝置及個人資料命令系列。

`canvas.*` 命令（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）在 iOS、Android、macOS、Windows 及未知平台（不含 Linux）上屬於外掛預設值；在 iOS 上，所有這些命令都只能在前景執行。

對於任何公告 `talk` 功能或宣告 `talk.*` 命令的節點，無論平台標籤為何，預設都允許 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`。

桌面主機命令（`system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`mcp.tools.call.v1`，以及 macOS／Windows 上的 `screen.snapshot`）不屬於上述靜態平台預設表。操作員核准宣告這些命令的配對要求後，它們便可供使用；之後節點已核准的命令集會在重新連線時繼續包含這些命令。

即使節點已宣告，危險或高度涉及隱私的命令仍需透過 `gateway.nodes.allowCommands` 明確選擇加入：`camera.snap`、`camera.clip`、`screen.record`、`computer.act`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` 的優先順序一律高於預設值及額外的允許清單項目。請參閱[電腦操作](/zh-TW/nodes/computer-use)，了解桌面輸入另有的 macOS、工具政策及啟用關卡。

外掛擁有的節點命令可以新增閘道節點叫用原則。該原則會在允許清單檢查之後、轉送至節點之前執行，因此原始 `node.invoke`、命令列介面輔助工具和專用代理程式工具會共用相同的外掛權限邊界。危險的外掛節點命令仍需明確透過 `gateway.nodes.allowCommands` 選擇啟用。

節點變更其宣告的命令清單後，請拒絕舊的裝置配對並核准新的要求，讓閘道儲存更新後的命令快照。

## 設定（`openclaw.json`）

節點相關設定位於 `gateway.nodes` 和 `tools.exec`：

```json5
{
  gateway: {
    nodes: {
      // 自動核准來自受信任網路（CIDR 清單）的首次節點配對。
      // 未設定時停用。僅適用於未要求任何範圍的首次 role:node 要求；
      // 不會自動核准升級。
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // 經 SSH 驗證的自動核准（預設：啟用）。透過 SSH 讀回並確認
        // 裝置金鑰完全相符時，核准首次節點配對。
        sshVerify: true,
      },
      // 信任已配對節點發布且代理程式可見的外掛工具（預設：true）。
      pluginTools: {
        enabled: true,
      },
      // 選擇啟用危險或高度涉及隱私的節點命令（camera.snap 等）。
      allowCommands: ["camera.snap", "screen.record"],
      // 即使預設值或 allowCommands 包含命令，也封鎖完全相符的命令名稱。
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // 預設執行主機："node" 會將所有執行呼叫路由至已配對節點。
      host: "node",
      // 節點執行的安全模式：僅允許已核准或列入允許清單的命令。
      security: "allowlist",
      // 將執行固定至特定節點（ID 或名稱）。省略可允許任何節點。
      node: "build-node",
    },
  },
}
```

請使用完全相符的節點命令名稱。即使平台預設值或 `allowCommands` 項目原本會允許某個命令，`denyCommands` 仍會將其移除。已配對節點預設可以發布代理程式可見的外掛工具描述元，但每個描述元的命令仍必須位於節點已核准的命令介面中。設定 `gateway.nodes.pluginTools.enabled: false` 可忽略所有這類描述元。如需閘道節點配對和命令原則欄位的詳細資訊，請參閱[閘道設定參考](/zh-TW/gateway/configuration-reference#gateway)。

各代理程式的執行節點覆寫：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## 螢幕擷取畫面（Canvas 快照）

如果節點正在顯示 Canvas（WebView），`canvas.snapshot` 會傳回 `{ format, base64 }`。

命令列介面輔助工具（寫入暫存檔並印出儲存路徑）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 控制項

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意事項：

- `canvas present` 接受 URL 或本機檔案路徑（`--target`），也可選用 `--x/--y/--width/--height` 來指定位置。
- `canvas eval` 接受行內 JS（`--js`）或位置引數。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意事項：

- 行動節點會使用內建且由應用程式擁有的 A2UI 頁面，進行支援動作的呈現。
- 僅支援 A2UI v0.8 JSONL（會拒絕 v0.9/createSurface）。
- iOS 和 Android 會呈現遠端閘道 Canvas 頁面，但 A2UI 按鈕動作只會從內建且由應用程式擁有的 A2UI 頁面分派。在這些行動用戶端上，由閘道託管的 HTTP/HTTPS A2UI 頁面只能呈現。
- macOS 可以從應用程式所選、完全符合能力範圍的閘道 A2UI 頁面分派動作。其他 HTTP/HTTPS 頁面仍只能呈現。

## 相片與影片（節點相機）

相片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 預設：前後鏡頭（2 行 MEDIA）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

影片片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意事項：

- 節點必須位於**前景**才能使用 `canvas.*` 和 `camera.*`（背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 節點會限制片段持續時間，以維持 base64 承載資料量在可管理範圍內（各平台的確切限制請參閱[相機擷取](/zh-TW/nodes/camera)）。`nodes` 代理程式工具還會在轉送呼叫前，將要求的 `durationMs` 上限設為 300000（5 分鐘）；節點本身會強制執行更嚴格的限制。
- Android 會在可能的情況下提示取得 `CAMERA`/`RECORD_AUDIO` 權限；若權限遭拒，則會以 `*_PERMISSION_REQUIRED` 失敗。

## 螢幕錄製（節點）

支援的節點會提供 `screen.record`（mp4）。範例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意事項：

- `screen.record` 的可用性取決於節點平台。
- `nodes` 代理程式工具會將要求的 `durationMs` 上限設為 300000（5 分鐘）；節點可能會強制執行更嚴格的限制，以控制傳回的承載資料量。
- `--no-audio` 會在支援的平台上停用麥克風擷取。
- 有多個螢幕可用時，請使用 `--screen <index>` 選取顯示器（0 = 主要顯示器）。

## 位置（節點）

在設定中啟用「位置」後，節點會提供 `location.get`。

命令列介面輔助工具：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意事項：

- 「位置」**預設為關閉**。
- “Always” 需要系統權限；背景擷取會盡力執行。
- 回應包含緯度／經度、精確度（公尺）和時間戳記。
- 完整的參數／回應結構和錯誤碼：[位置命令](/zh-TW/nodes/location-command)。

## SMS（Android 節點）

當使用者授予 **SMS** 權限且裝置支援電話功能時，Android 節點可以提供 `sms.send` 和 `sms.search`。這兩個命令預設均視為危險：閘道操作員也必須將它們加入 `gateway.nodes.allowCommands`，才能叫用（請參閱[命令原則](#command-policy)）。

若要使用唯讀 SMS 搜尋，請在 `openclaw.json` 中明確選擇啟用：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

只有當節點也應能傳送訊息時，才另外新增 `sms.send`。Android 權限與閘道命令授權彼此獨立；授予手機權限不會編輯閘道原則。

低階叫用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意事項：

- `sms.search` 可在授予 `READ_SMS` 前宣告，以便叫用時傳回權限診斷；讀取訊息仍需該 Android 權限。
- 不具電話功能的純 Wi-Fi 裝置不會公布 `sms.send`。
- `requires explicit gateway.nodes.allowCommands opt-in` 錯誤表示手機已宣告該命令，但閘道操作員尚未授權。

## 裝置與個人資料命令

iOS 和 Android 節點預設會公布數個唯讀資料命令（請參閱[命令原則](#command-policy)表格）；Android 還會提供較大的命令系列，並由其應用程式內設定控管。

可用系列：

- `device.status`、`device.info` — iOS、Android、Windows。
- `device.permissions`、`device.health`、`device.apps` — 僅限 Android；`device.apps` 需要在 Android Settings 中啟用 Installed Apps sharing，且預設傳回啟動器可見的應用程式。
- `notifications.list`、`notifications.actions` — 僅限 Android。
- `photos.latest` — iOS、Android。
- `contacts.search` — iOS、Android（預設唯讀）；`contacts.add` 具有危險性，且需要 `gateway.nodes.allowCommands`。
- `calendar.events` — iOS、Android（預設唯讀）；`calendar.add` 具有危險性，且需要 `gateway.nodes.allowCommands`。
- `reminders.list` — iOS、Android（預設唯讀）；`reminders.add` 具有危險性，且需要 `gateway.nodes.allowCommands`。
- `callLog.search` — 僅限 Android。
- `motion.activity`、`motion.pedometer` — iOS、Android；由可用感測器的能力控管。

叫用範例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## 系統命令（節點主機／Mac 節點）

macOS 節點提供 `system.run`、`system.which`、`system.notify` 和 `system.execApprovals.get/set`。無頭節點主機提供 `system.run.prepare`、`system.run`、`system.which` 和 `system.execApprovals.get/set`。

範例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

注意事項：

- `system.run` 會在承載資料中傳回 stdout/stderr/結束代碼。
- Shell 執行現在會透過 `host=node` 的 `exec` 工具進行；`nodes` 仍是明確節點命令的直接 RPC 介面。
- `nodes invoke` 不會公開 `system.run` 或 `system.run.prepare`；這些仍僅限於 exec 路徑。
- exec 路徑會在核准前準備標準的 `systemRunPlan`。核准後，閘道會轉送該已儲存的計畫，而非呼叫端稍後編輯的任何 command/cwd/session 欄位。
- `system.notify` 會遵循 macOS 應用程式中的通知權限狀態；支援 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 無法辨識的節點 `platform` / `deviceFamily` 中繼資料會使用保守的預設允許清單，其中不包含 `system.run` 和 `system.which`。如果你刻意需要在未知平台上使用這些命令，請透過 `gateway.nodes.allowCommands` 明確新增。
- `system.run` 支援 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 對於 Shell 包裝程式（`bash|sh|zsh ... -c/-lc`），要求範圍內的 `--env` 值會縮減為明確的允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允許清單模式下做出永遠允許的決定時，已知的分派包裝程式（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存內部可執行檔路徑，而非包裝程式路徑。如果無法安全解除包裝，則不會自動保存任何允許清單項目。
- 在允許清單模式下的 Windows 節點主機上，透過 `cmd.exe /c` 執行 Shell 包裝程式需要核准（僅有允許清單項目不會自動允許包裝程式形式）。
- 節點主機會忽略 `--env` 中的 `PATH` 覆寫，並在執行命令前移除大量持續維護的直譯器／Shell 啟動變數（例如 `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）。如果需要額外的 PATH 項目，請設定節點主機服務環境（或將工具安裝在標準位置），不要透過 `--env` 傳入 `PATH`。
- 在 macOS 節點模式下，`system.run` 受 macOS 應用程式中的 exec 核准控管（Settings → Exec approvals）。詢問／允許清單／完整模式的行為與無介面節點主機相同；遭拒絕的提示會傳回 `SYSTEM_RUN_DENIED`。
- 在無介面節點主機上，`system.run` 受 exec 核准（`~/.openclaw/exec-approvals.json`）控管；特別是在 macOS 上，請參閱下方[無介面節點主機](#headless-node-host-cross-platform)中的 exec 主機路由環境變數。

## Exec 節點繫結

當有多個節點可用時，你可以將 exec 繫結至特定節點。這會設定 `exec host=node` 的預設節點（並可依代理程式覆寫）。

全域預設值：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

依代理程式覆寫：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

取消設定以允許任何節點：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 權限對應表

節點可在 `node.list` / `node.describe` 中包含 `permissions` 對應表，以權限名稱（例如 `screenRecording`、`accessibility`、`location`）作為鍵，並使用布林值（`true` = 已授予）。

## 無介面節點主機（跨平台）

OpenClaw 可以執行連線至閘道 WebSocket 並公開 `system.run` / `system.which` 的**無介面節點主機**（無 UI）。這適合在 Linux/Windows 上使用，或與伺服器一起執行最小化節點。

啟動方式：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事項：

- 仍需配對（閘道會顯示裝置配對提示）。
- 用戶端執行個體中繼資料、已簽署的裝置身分和配對驗證會使用不同的檔案；請參閱[無介面身分狀態](#headless-identity-state)。
- exec 核准會透過 `~/.openclaw/exec-approvals.json` 在本機強制執行（請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)）。
- 在 macOS 上，無介面節點主機預設會在本機執行 `system.run`。設定 `OPENCLAW_NODE_EXEC_HOST=app` 可透過輔助應用程式的 exec 主機路由 `system.run`；再加入 `OPENCLAW_NODE_EXEC_FALLBACK=0`，即可強制要求使用應用程式主機，並在其無法使用時以封閉方式失敗。
- 當閘道 WS 使用 TLS 時，請加入 `--tls` / `--tls-fingerprint`。

## Mac 節點模式

- macOS 選單列應用程式會以節點身分連線至閘道 WS 伺服器（因此 `openclaw nodes …` 可針對這台 Mac 運作）。
- 在遠端模式下，應用程式會為閘道連接埠開啟 SSH 通道，並連線至 `localhost`。
