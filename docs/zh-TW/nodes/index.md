---
read_when:
    - 將 iOS/watchOS/Android 節點與閘道配對
    - 使用節點畫布／相機提供代理程式情境資訊
    - 新增節點命令或命令列介面輔助工具
summary: 節點：配對、功能、權限，以及用於畫布／相機／螢幕／裝置／通知／系統的命令列介面輔助工具
title: 節點
x-i18n:
    generated_at: "2026-07-22T20:05:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b4f7c80491d713777e1ba5b8f55c88bd9fa48be602b504e6ac6ba00cd12a4313
    source_path: nodes/index.md
    workflow: 16
---

**節點**是連線至閘道的伴隨裝置（macOS/iOS/watchOS/Android/無介面），它使用 `role: "node"`，並透過 `node.invoke` 公開命令介面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。大多數節點使用操作員連接埠上的閘道 WebSocket。選用的直連 Apple Watch 節點則在相同連接埠上使用已簽署的 HTTPS 輪詢，因為 watchOS 會封鎖一般 App 的通用低階網路功能。通訊協定詳細資訊：[閘道通訊協定](/zh-TW/gateway/protocol)。

舊版傳輸方式：[橋接通訊協定](/zh-TW/gateway/bridge-protocol)（TCP JSONL；對目前的節點而言僅具歷史用途）。

macOS 也可以在**節點模式**下執行：選單列 App 會以一個節點的身分連線至閘道的
WS 伺服器（因此 `openclaw nodes …` 可對此 Mac 運作）。此 App
會將原生 Canvas、相機、螢幕、通知及電腦控制命令，
加入 `openclaw node run` 所使用的相同節點主機命令介面。請勿在該 Mac 上啟動
第二個命令列介面節點；此 App 會以內部工作程序執行對應的命令列介面節點主機執行階段，
並維持為唯一的閘道連線與節點身分。

節點是**周邊裝置**，不是閘道：它們不會執行閘道服務，而頻道訊息（Telegram、WhatsApp 等）會送達閘道，而非節點。

疑難排解手冊：[/nodes/troubleshooting](/zh-TW/nodes/troubleshooting)

## 配對與狀態

節點使用**裝置配對**。節點在連線期間會提供已簽署的裝置身分；閘道會為 `role: node` 建立裝置配對要求。請透過裝置命令列介面（或 UI）核准。直連 Apple Watch 的設定會使用由管理員簽發、短效且僅供節點使用的設定碼，核准其固定的低風險命令介面；日後擴充功能仍須依一般程序核准。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

待處理的配對要求會在裝置最後一次重試的 5 分鐘後到期——持續重新連線的裝置會讓其單一待處理要求（以及 `requestId`）保持有效，而非每隔幾分鐘建立新的提示；如需完整的要求／核准生命週期，請參閱[節點配對](/zh-TW/gateway/pairing)。如果節點以變更後的驗證詳細資料（角色／範圍／公開金鑰）重試，先前的待處理要求會被取代，並建立新的 `requestId`——用戶端會收到遭取代要求的 `device.pair.resolved` 事件，而你應先重新執行 `openclaw devices list` 再核准。

- `nodes status` 會在裝置配對角色包含 `node` 時，將節點標記為**已配對**。
- 已連線的原生 Mac 可在
  **Settings -> Permissions -> Active computer detection** 中選擇啟用合併的實體輸入活動。也必須具備「輔助使用」權限。閘道會將最近有活動且符合資格的 Mac 標記為
  `active`，為代理程式提供穩定的節點 ID 提示，並先將節點連線
  警示路由至該處，之後才延遲改用備援方式。如需設定、隱私權、時序及
  疑難排解資訊，請參閱[使用中電腦的存在狀態](/zh-TW/nodes/presence)。
- 裝置配對記錄是持久的已核准角色合約。權杖輪替仍受此合約約束；它無法將已配對節點升級為配對核准從未授予的角色。
- `node.pair.*`（命令列介面：`openclaw nodes pending/approve/reject/remove/rename`）是由閘道擁有的獨立節點配對儲存區，用來追蹤節點在重新連線之間已獲核准的命令／功能介面。它**不會**管控傳輸驗證——這由裝置配對負責。
- `openclaw nodes remove --node <id|name|ip>` 會移除節點配對。對於由裝置支援的節點，它會在已配對裝置儲存區中撤銷該裝置的 `node` 角色，並中斷該裝置具節點角色的工作階段：混合角色裝置會保留其資料列，且只失去 `node` 角色，而僅具節點角色的裝置資料列則會遭刪除。它也會清除獨立節點配對儲存區中的任何相符項目。`operator.pairing` 可移除其他裝置上的非操作員節點資料列；使用裝置權杖的呼叫端若要撤銷其混合角色裝置本身的節點角色，還需要 `operator.admin`。
- 核准範圍會依照待處理要求所宣告的命令：
  - 無命令要求：`operator.pairing`
  - 非執行類節點命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 版本差異與升級順序

閘道 WebSocket 可在 N-1 通訊協定版本範圍內接受已驗證的節點用戶端。
因此，目前的 v4 閘道會接受連線同時宣告
`role: "node"` 與 `client.mode: "node"` 的 v3 節點。操作員與 UI 工作階段
仍必須使用目前的通訊協定。

若要分階段升級裝置群，請先升級閘道，再逐一升級各節點。
N-1 節點在升級期間仍保持可見且可管理；閘道會記錄
帶有升級建議的 `legacy node protocol accepted`。配對、
裝置驗證、命令允許清單及執行核准仍然適用。
由外掛擁有的功能與命令會保持隱藏，直到節點升級至
目前的通訊協定。早於 N-1 的節點必須先透過頻外方式升級，
才能重新連線。

直連 watchOS HTTPS 傳輸需要目前的通訊協定版本；啟用直連模式前，
請同時更新 Watch App 與閘道。

## 遠端節點主機（system.run）

當閘道在一台機器上執行，而你希望命令在另一台機器上執行時，請使用**節點主機**。模型仍與**閘道**通訊；選取 `host=node` 時，閘道會將 `exec` 呼叫轉送至**節點主機**。

| 角色         | 責任                                                   |
| ------------ | ---------------------------------------------------------------- |
| 閘道主機 | 接收訊息、執行模型、路由工具呼叫。            |
| 節點主機    | 在節點機器上執行 `system.run`/`system.which`。        |
| 核准    | 透過 `~/.openclaw/exec-approvals.json` 在節點主機上強制執行。 |

核准注意事項：

- 以核准為依據的節點執行會繫結確切的要求內容。執行路徑會在核准前準備標準化的 `systemRunPlan`；核准後，閘道會轉送該已儲存的計畫，而非任何呼叫端稍後編輯的命令／目前工作目錄／工作階段欄位，並在執行前重新驗證工作目錄。
- 對於直接執行 Shell／執行階段檔案的情況，OpenClaw 也會盡力繫結一個具體的本機檔案運算元，若該檔案在執行前發生變更，便拒絕執行。
- 如果 OpenClaw 無法為直譯器／執行階段命令識別出恰好一個具體的本機檔案，以核准為依據的執行會遭拒絕，而不會假裝能完整涵蓋執行階段。若需要更廣泛的直譯器語意，請使用沙箱、獨立主機，或明確信任的允許清單／完整工作流程。

### 啟動節點主機（前景）

在節點機器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` 也接受 `--context-path`（閘道 WS 內容路徑）、`--tls`、`--tls-fingerprint <sha256>` 及 `--node-id`（覆寫舊版用戶端執行個體 ID；這不會重設配對）。在 macOS 上，傳入 `--share-installed-apps` 以宣告 `device.apps`；預設不啟用分享。使用 `--no-share-installed-apps` 可停用先前儲存的選擇啟用設定。

### 透過 SSH 通道連線至遠端閘道（迴路介面繫結）

如果閘道繫結至迴路介面（`gateway.bind=loopback`，本機模式的預設值），遠端節點主機便無法直接連線。請建立 SSH 通道，並將節點主機指向通道的本機端點。

範例（節點主機 -> 閘道主機）：

```bash
# 終端機 A（保持執行）：將本機 18790 轉送至閘道 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 終端機 B：匯出閘道權杖，並透過通道連線
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意事項：

- `openclaw node run` 支援權杖或密碼驗證。
- 建議使用環境變數：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定備援值為 `gateway.auth.token` / `gateway.auth.password`。
- 在本機模式下，節點主機會刻意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在遠端模式下，`gateway.remote.token` / `gateway.remote.password` 可依遠端優先順序規則使用。
- 如果已設定使用中的本機 `gateway.auth.*` SecretRefs，但無法解析，節點主機驗證會採取封閉式失敗。
- 節點主機驗證解析僅接受 `OPENCLAW_GATEWAY_*` 環境變數。

### 啟動節點主機（服務）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` 也接受 `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`（僅限舊版用戶端執行個體 ID）、`--share-installed-apps` / `--no-share-installed-apps`、`--runtime <node>`（預設：節點），以及用於重新安裝的 `--force`。亦可使用 `node status`、`node stop` 及 `node uninstall`。

### 配對與命名

在閘道主機上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果節點以變更後的驗證詳細資料重試，請重新執行 `openclaw devices list`，並核准目前的 `requestId`。

命名選項：

- `--display-name` 位於 `openclaw node run` / `openclaw node install`（會與用戶端執行個體 ID 及閘道連線中繼資料一同保存在共用的 `node_host_config` SQLite 資料列中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（閘道覆寫）。

### 節點託管的 MCP 伺服器

請在節點機器上的 `openclaw.json` 中設定 MCP 伺服器，而非在
閘道上設定：

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

無介面節點主機會啟動這些伺服器、列出其工具，並在連線後發布
描述元。工具呼叫會透過
`mcp.tools.call.v1` 返回該節點；閘道不需要相符的 MCP 設定或 JS
外掛。這個節點託管的 v1 路徑不支援 OAuth MCP 伺服器。

目前的節點主機會在初次配對期間宣告內建的 `mcp.tools.call.v1` 命令系列，
即使未設定任何 MCP 伺服器亦然。在較舊 OpenClaw 版本上配對的節點，
可能會在節點主機更新後要求一次性的命令介面升級。之後新增、移除或篩選伺服器
不需要重新配對，因為已核准的命令系列並未變更。重新啟動
`openclaw node run` 或 `openclaw node restart` 以套用節點 MCP 設定變更；
節點主機不會監看此設定。

閘道操作員可使用
`gateway.nodes.pluginTools.enabled: false`，忽略已配對節點發布的所有代理程式可見工具，
包括節點託管的 MCP 工具。精確的命令拒絕規則（例如
`gateway.nodes.commands.deny: ["mcp.tools.call.v1"]`）也會封鎖執行。

### 節點託管的 Skills

在節點機器目前啟用的 OpenClaw Skills 目錄下安裝 Skills，
預設為 `~/.openclaw/skills`。`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR` 和
`OPENCLAW_CONFIG_PATH` 會移動該啟用中的設定檔。對 Skills 而言，`OPENCLAW_STATE_DIR`
優先；否則，`skills/` 位於
`openclaw config file` 所輸出路徑的旁邊。無頭節點主機連線後會發布有效的
`SKILL.md` 檔案，而閘道僅會在該節點保持連線期間，將其加入代理程式的
Skills 快照。每個 Skills 目錄名稱都必須符合 `name`
frontmatter 欄位，讓抽象節點定位器可對應至單一項目，而不必新增
另一個協定欄位。

初始的節點角色配對會核准 Skills 發布。新增、移除或
變更 Skills 不需要再次配對，也不需要變更閘道設定。
變更節點 Skills 檔案後，請重新啟動 `openclaw node run` 或
`openclaw node restart`；節點主機不會監看 Skills 目錄。

由節點代管的 Skills 項目會識別其節點，並帶有其執行
位置。Skills 檔案、參照的相對路徑和二進位檔都保留在該
節點上。代理程式會使用一般的 `read` 工具讀取所公告的
`node://.../SKILL.md` 位置。`file_fetch` 接受操作員核准的絕對節點路徑，
而非節點 Skills 定位器；沒有一般讀取工具的執行階段，則可改為透過
`exec host=node node=<node-id>` 執行 `cat SKILL.md`，並以所公告的
`node://.../skills/<name>` 目錄作為 `workdir`。參照的檔案和二進位檔
使用相同的 exec 目標與工作目錄。節點主機會依據其目前啟用的 OpenClaw
狀態目錄解析該定位器，因此相對路徑會在節點上解析，而非在
閘道機器上解析。發布節點必須已核准 `system.run`，
且代理程式的 exec 原則必須允許 `host=node`；否則該 Skills 將不會
出現在該代理程式的快照中。

在節點上設定 `nodeHost.skills.enabled: false` 可停止發布。閘道
操作員可使用 `gateway.nodes.allowSkills: false` 忽略所有已配對節點的
Skills。

### 無頭身分狀態

無頭節點會在共用 SQLite 中保留三筆獨立的狀態記錄：

- `~/.openclaw/state/openclaw.sqlite`（`node_host_config`）：用戶端執行個體 ID、顯示名稱及閘道連線中繼資料。
- `~/.openclaw/state/openclaw.sqlite`（`device_identities`，索引鍵 `primary`）：已簽署的裝置金鑰組及衍生的密碼學裝置 ID。
- `~/.openclaw/state/openclaw.sqlite`（`device_auth_tokens`）：以密碼學裝置 ID 與角色為索引鍵的已配對裝置驗證權杖。

對於已簽署的節點，閘道會使用密碼學裝置 ID 進行配對和
節點路由。用戶端執行個體 ID 僅是連線中繼資料。因此，變更
`--node-id` 或移轉已停用的 `node.json` 並不會重設配對。請參閱
[身分與配對狀態](/zh-TW/cli/node#identity-and-pairing-state)，了解
支援的撤銷並重新配對流程及升級注意事項。

已停用的 `identity/device.json` 和 `identity/device-auth.json` 檔案是由
Doctor 管理的移轉輸入。停止節點主機並執行
`openclaw doctor --fix`；Doctor 會先將其資料列匯入 SQLite 並驗證，
再移除舊檔案。

### 將命令加入允許清單

Exec 核准是**依個別節點主機**設定。從閘道新增允許清單項目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

核准資訊儲存在節點主機的 `~/.openclaw/exec-approvals.json`。

### 將 exec 指向節點

設定預設值（閘道設定）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.mode allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或依工作階段設定：

```text
/exec host=node security=allowlist node=<id-or-name>
```

設定後，任何搭配 `host=node` 的 `exec` 呼叫都會在節點主機上執行（受節點允許清單／核准限制）。

`host=auto` 不會自行隱含選擇節點，但 `auto` 允許明確的單次呼叫 `host=node` 要求。如果要讓節點 exec 成為工作階段的預設值，請明確設定 `tools.exec.host=node` 或 `/exec host=node ...`。

相關內容：

- [節點主機命令列介面](/zh-TW/cli/node)
- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)

### 本機模型推論

桌面或伺服器節點可公開由該節點上的 Ollama 伺服器提供、支援聊天的模型。代理程式使用 Ollama 外掛的 `node_inference` 工具探索已安裝的模型，並從遠端執行有界提示；閘道不需要直接透過網路存取 Ollama。請參閱 [Ollama 節點本機推論](/zh-TW/providers/ollama#node-local-inference)，了解設定、模型篩選及直接驗證命令。

### Codex 工作階段與逐字記錄

官方 `codex` 外掛可在無頭節點主機或原生 macOS 節點上公開
未封存的 Codex 工作階段。目錄註冊不再依賴
`supervision.enabled`；該選項用於控制面向代理程式的監督工具。
在 Codex 外掛設定中設置 `sessionCatalog.enabled: false`，即可停用
操作員目錄和已配對節點目錄命令，而不會停用
提供者或操作框架。
兩台電腦上仍須啟用該外掛，而節點設定仍代表
本機同意：只在閘道上啟用，無法讀取另一台電腦的 Codex
狀態。

節點會公告具版本控制、唯讀的
`codex.appServer.threads.list.v1` 和
`codex.appServer.thread.turns.list.v1` 命令。可使用 Codex 命令列介面的原生節點主機
也會公告 `codex.terminal.resume.v1`。這些命令首次出現時，請核准節點配對
升級。閘道會透過一般的外掛節點原則呼叫這些命令，並依主機
隔離失敗。

已配對節點的資料列會在一般工作階段側邊欄中顯示為 **Codex** 群組。
在每台主機內，資料列預設會依專案資料夾分組；位於
`.claude/worktrees/<name>` 下的工作目錄會歸入其來源儲存庫，且專案
群組可像其他側邊欄區段一樣收合。使用目錄標頭中的資料夾圖示
可展平或還原專案群組。相同的分組方式也適用於
Claude 工作階段目錄。
預設情況下，選取資料列會開啟一般的聊天窗格，並透過有界、游標分頁的
`thread/turns/list` 呼叫，以完整項目投影讀取其持久化逐字記錄。使用資料列選單、檢視器標頭，或 **Open Codex/Claude sessions in** 偏好設定，可在擁有該工作階段的電腦上，於操作員終端機中啟動 `codex resume <thread-id>`。已配對節點的終端機路徑是由 Codex 外掛管理、已加入允許清單的 PTY 轉送，而非任意節點命令執行。

該轉送不提供完整的 OpenClaw 操作框架接續與封存擁有權合約。因此，遠端資料列無法使用**繼續**和**封存**。在閘道電腦上，已儲存且閒置的
資料列可啟動獨立且鎖定模型的聊天分支。兩者都只能在
操作員確認沒有其他 Codex 用戶端正在使用後才能封存；已儲存
資料列的即時活動仍屬未知。作用中的資料列無法建立分支或封存。

請參閱[監督 Codex 工作階段](/zh-TW/plugins/codex-supervision)，了解設定、
分頁、本機接續及中繼資料安全邊界。

### Claude 工作階段與逐字記錄

隨附的 `anthropic` 外掛預設會探索閘道和已配對節點上未封存的 Claude 命令列介面與 Claude
Desktop 工作階段。設定
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` 可停用
操作員目錄和已配對節點目錄命令，而不會停用 Anthropic
模型或 Claude 命令列介面後端。
遠端 macOS 應用程式節點會在 Anthropic 外掛已啟用且
`~/.claude/projects/` 存在時公告
`anthropic.claude.sessions.list.v1` 和 `anthropic.claude.sessions.read.v1`。
這些命令首次出現時，請核准節點配對升級。

可使用 Claude 命令列介面的原生節點主機也會公告
`anthropic.claude.terminal.resume.v1`。符合資格的命令列介面和 Desktop 資料列可在其所屬主機的
操作員終端機中開啟 `claude --resume <session-id>`。
這是接管原生工作階段；與 OpenClaw 採用不同，它不會
先分叉 Claude 工作階段。

目錄會合併有效的 Claude 命令列介面專案索引記錄，以及針對未建立索引的 JSONL 逐字記錄所提供的有界
中繼資料備援。該備援可識別並行、非側鏈的互動式（`cli`）和無頭 Agent SDK 命令列介面
（`sdk-cli`）工作階段。Claude Desktop 的本機中繼資料提供 Desktop 標題與封存
狀態。當兩個來源指向相同的 Claude Code
工作階段 ID 時，以 Desktop 中繼資料為準；僅存在於命令列介面的逐字記錄仍會顯示，因為命令列介面沒有封存
旗標。逐字記錄讀取會使用不透明的
位元組位移游標和有界的反向檔案讀取，因此選取大型
工作階段或載入較舊頁面時，不會將整個 JSONL 歷史記錄讀入單一
閘道回應。

列出和讀取命令皆為唯讀。它們僅會透過通用的 `sessions.catalog.list` 和
`sessions.catalog.read` 方法，向具備
`operator.write` 的已驗證操作員連線公開目錄中繼資料和逐字記錄
內容。可從一般的聊天
撰寫器採用閘道本機的 Claude 命令列介面資料列：OpenClaw 會匯入有界的可見歷史記錄，在
第一輪使用 `--fork-session` 繼續，並保持來源逐字記錄不變。

無頭節點主機可選擇加入相同的接續流程：

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

只有啟用此節點本機設定，且該節點可解析 `claude`
可執行檔時，節點才會公告 `agent.cli.claude.run.v1`。閘道無法
從遠端啟用此功能。該命令也會通過節點現有的 exec
核准原則。當三個 Claude 命令全都已公告，且獲得
閘道的節點命令原則允許時，該節點上的 Claude 命令列介面
資料列即可接續：OpenClaw 會匯入有界歷史記錄，將
採用的工作階段繫結至該節點及其目錄所回報的工作目錄，並在該處
執行每次單次的 `claude -p` 回合。第一輪仍使用
`--fork-session`，以保留來源逐字記錄。

配置於節點上的回合使用該節點的 Claude 預設值。在 v1 中，它們不會接收
閘道回送 MCP 設定或閘道 Skills 外掛，無法從
閘道逐字記錄重新植入，且會拒絕附件和圖片。Claude Desktop 資料列以及
未公告執行命令的節點仍僅供檢視。macOS 應用程式
節點尚未公告此命令，因此其資料列仍僅供檢視。

請參閱 [Anthropic：跨電腦的 Claude 工作階段](/zh-TW/providers/anthropic#claude-sessions-across-computers)，
了解控制介面行為和儲存來源。

### OpenCode 與 Pi 工作階段

隨附的 OpenCode 和 ACPX 外掛也會探索閘道及已配對節點上唯讀的原生工作階段
目錄。安裝 `opencode`
命令列介面時，節點會公告
`opencode.sessions.list.v1`／`opencode.sessions.read.v1`；Pi 的工作階段目錄存在時，則會公告
`acpx.pi.sessions.list.v1`／`acpx.pi.sessions.read.v1`。
新命令首次出現時，請核准節點配對升級。若相符的命令列介面也可使用，節點會新增
`opencode.terminal.resume.v1` 或 `acpx.pi.terminal.resume.v1`；之後即可透過現有的資料列
選單和檢視器標頭，使用 `opencode --session <id>` 或 `pi --session <id>`，在所屬
終端機中重新開啟選取的工作階段。

OpenCode 透過其官方命令列介面 JSON／匯出介面讀取。Pi 會讀取其
文件記載的 JSONL 工作階段儲存區，包括專案和全域 `settings.json`
工作階段目錄，以及 `PI_CODING_AGENT_DIR` 和
`PI_CODING_AGENT_SESSION_DIR` 覆寫。兩個目錄預設皆為啟用；
可在 Web UI 的 **Config > Plugins** 下將其關閉。

終端機恢復會使用已儲存的工作階段工作目錄，以及與 Codex 和 Claude 相同、
已加入允許清單的雙向 PTY 轉送。它不會公開任意
節點命令執行。

### 終端機檔案上傳

控制介面可將檔案拖曳到已開啟的配對節點終端機。原生節點主機會公告僅限管理員使用的 `terminal.upload` 命令；首次出現時，請核准配對升級。每個檔案的大小上限為 16 MiB，會暫存在該節點的私有暫存目錄中，並以經過 shell 引號處理的路徑傳回終端機，而不執行該檔案。

路徑插入支援 PowerShell、`cmd.exe`，以及可辨識的 POSIX shell（`sh`、Bash、Dash、Ash、Ksh、Zsh 和 Fish），包括 Windows 上的 Git Bash。系統會拒絕其他 shell 覆寫，因為無法安全推斷其引號規則；若要使用原生 WSL 路徑，請在 WSL 內執行節點主機。系統也會拒絕包含 `%` 或 `!` 的 `cmd.exe` 路徑，因為該 shell 即使在雙引號內仍會展開這些字元。

## 叫用命令

低階（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` 會封鎖 `system.run` 和 `system.run.prepare`；這些命令只能透過搭配 `host=node` 的 `exec` 工具執行（見上文）。常見的「為代理程式提供 MEDIA 附件」工作流程（下文的 Canvas、相機、螢幕、位置）有較高階的輔助工具可用。

長時間執行的串流節點命令會使用附加的 `node.invoke.progress`
事件。每個事件都包含叫用 ID、從零開始的序號，以及
有界限的 UTF-8 文字區塊；閘道會先排序區塊，再將其傳送給
呼叫端。現有的 `node.invoke.result` 仍是唯一的終端
回應。串流呼叫端可設定閒置期限，此期限會從
第一個進度事件開始，並在後續進度發生時重設，同時在核准與執行期間保留
該叫用各自獨立的硬性逾時。結果、硬性
逾時、閒置逾時及節點中斷連線都會捨棄待處理的串流
狀態。呼叫端取消時會發出 `node.invoke.cancel`；節點主機接著會
終止相符的處理程序樹。現有的請求／回應命令維持不變。

## 命令政策

節點命令必須通過兩道關卡才能叫用：

1. 節點必須在其已驗證的連線中繼資料（`connect.commands`）中宣告該命令。
2. 閘道根據平台與核准狀態衍生的允許清單，必須包含已宣告的命令。

各平台的預設允許清單（套用外掛預設值及 `commands.allow`/`commands.deny` 覆寫之前）：

| 平台 | 預設允許的命令                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`、`location.get`、`device.info`、`device.status`、`contacts.search`、`calendar.events`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer`、`system.notify`                                                                                                                        |
| watchOS  | `device.info`、`device.status`、`system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`、`location.get`、`notifications.list`、`notifications.actions`、`system.notify`、`device.info`、`device.status`、`device.permissions`、`device.health`、`device.apps`、`contacts.search`、`calendar.events`、`callLog.search`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer` |
| macOS    | `camera.list`、`location.get`、`device.info`、`device.status`、`device.apps`、`contacts.search`、`calendar.events`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer`、`system.notify`                                                                                                         |
| Windows  | `camera.list`、`location.get`、`device.info`、`device.status`、`system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（如 `system.run` 等節點主機命令須經核准，見下文）                                                                                                                                                                                                                                  |

這些列描述的是閘道政策上限，而非每個節點應用程式實作的命令。只有在已連線節點也宣告命令時，該命令才可使用。尤其是目前的 macOS 應用程式不會宣告 macOS 政策列中列出的裝置與個人資料系列命令。

`canvas.*` 命令（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）是 iOS、Android、macOS、Windows、Linux 及未知平台上的外掛預設值。Linux 節點只有在桌面應用程式的本機 Canvas 通訊端存在時才會宣告這些命令。所有 Canvas 命令在 iOS 上都限制為只能於前景執行。

對於任何公告 `talk` 功能或宣告 `talk.*` 命令的節點，無論其平台標籤為何，預設都允許 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`。

桌面主機命令（macOS/Windows/Linux 上的 `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`mcp.tools.call.v1` 和 `screen.snapshot`）不屬於上述靜態平台預設表。操作員核准宣告這些命令的配對請求後，這些命令便可使用，之後節點核准的命令集會在重新連線時繼續保留這些命令。

即使節點已宣告，危險或高度涉及隱私的命令仍須透過 `gateway.nodes.commands.allow` 明確選擇啟用：`camera.snap`、`camera.clip`、`screen.record`、`computer.act`、`contacts.add`、`calendar.add`、`reminders.add`、`health.summary`、`sms.send`、`sms.search`。`gateway.nodes.commands.deny` 的優先順序一律高於預設值及額外允許清單項目。如需瞭解 iPhone 的同意關卡，請參閱 [HealthKit 摘要](/zh-TW/platforms/ios-healthkit)；如需瞭解桌面輸入額外的功能、工具政策、啟用及平台執行端關卡，請參閱[電腦操作](/zh-TW/nodes/computer-use)。

外掛擁有的節點命令可以新增閘道節點叫用政策。該政策會在允許清單檢查之後、轉送至節點之前執行，因此原始 `node.invoke`、命令列介面輔助工具及專用代理程式工具會共用相同的外掛權限邊界。危險的外掛節點命令仍須透過 `gateway.nodes.commands.allow` 明確選擇啟用。

節點變更其宣告的命令清單後，請拒絕舊裝置配對並核准新請求，讓閘道儲存更新後的命令快照。

## 設定（`openclaw.json`）

節點相關設定位於 `gateway.nodes` 和 `tools.exec` 之下：

```json5
{
  gateway: {
    nodes: {
      // 自動核准來自受信任網路（CIDR 清單）的首次節點配對。
      // 未設定時停用。僅適用於沒有要求範圍的首次 role:node 請求；
      // 不會自動核准升級。
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // 經 SSH 驗證的自動核准（預設：啟用）。透過 SSH 讀回完全相符的
        // 裝置金鑰時，核准首次節點配對。
        sshVerify: true,
      },
      // 信任由已配對節點發布、代理程式可見的外掛工具（預設：true）。
      pluginTools: {
        enabled: true,
      },
      // 選擇啟用危險／高度涉及隱私的節點命令（camera.snap 等）。
      commands: {
        allow: ["camera.snap", "screen.record"],
        // 即使預設值或 commands.allow 包含命令，也封鎖完全相符的命令名稱。
        deny: ["camera.clip"],
      },
    },
  },
  tools: {
    exec: {
      // 預設 exec 主機："node" 會將所有 exec 呼叫路由至已配對節點。
      host: "node",
      // 節點 exec 的安全模式：僅允許已核准／已列入允許清單的命令。
      security: "allowlist",
      // 將 exec 鎖定至特定節點（ID 或名稱）。省略即可允許任何節點。
      node: "build-node",
    },
  },
}
```

請使用完全相符的節點命令名稱。即使平台預設值或 `commands.allow` 項目原本會允許命令，`commands.deny` 仍會將其移除。已配對節點預設可發布代理程式可見的外掛工具描述元，但每個描述元的命令仍必須位於節點已核准的命令介面中。設定 `gateway.nodes.pluginTools.enabled: false` 可忽略所有此類描述元。如需閘道節點配對與命令政策欄位的詳細資訊，請參閱[閘道設定參考](/zh-TW/gateway/configuration-reference#gateway)。

各代理程式的 exec 節點覆寫：

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

- `canvas present` 在支援本機路徑的節點上接受 URL 或本機檔案路徑（`--target`），另可選用 `--x/--y/--width/--height` 進行定位。Linux Canvas 接受 HTTP(S) URL 或其內建的 A2UI 轉譯器。
- `canvas eval` 接受內嵌 JS（`--js`）或位置引數。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意事項：

- 行動裝置與 Linux 桌面節點使用內建、由應用程式擁有的 A2UI 頁面，以進行支援動作的轉譯。
- 僅支援 A2UI v0.8 JSONL（會拒絕 v0.9/createSurface）。
- iOS 和 Android 會轉譯遠端閘道 Canvas 頁面，但只有內建、由應用程式擁有的 A2UI 頁面會分派 A2UI 按鈕動作。在這些行動用戶端上，由閘道託管的 HTTP/HTTPS A2UI 頁面僅供轉譯。
- macOS 可從應用程式選取、與功能範圍完全相符的閘道 A2UI 頁面分派動作。其他 HTTP/HTTPS 頁面仍僅供轉譯。
- Linux 只會從內建 A2UI 頁面分派動作。其他 HTTP/HTTPS 頁面仍僅供轉譯，而未安裝桌面應用程式的無頭 Linux 節點不會公告 Canvas。

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

- 節點必須位於**前景**，才能使用 `canvas.*` 和 `camera.*`（背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 節點會限制片段持續時間，以便將 base64 承載資料維持在可管理的大小（各平台的確切限制請參閱[相機擷取](/zh-TW/nodes/camera)）。`nodes` 代理程式工具在轉送呼叫前，還會將要求的 `durationMs` 上限設為 300000（5 分鐘）；節點本身則會強制執行更嚴格的限制。
- Android 會在可行時提示授予 `CAMERA`/`RECORD_AUDIO` 權限；若權限遭拒，將以 `*_PERMISSION_REQUIRED` 失敗。

## 螢幕錄影（節點）

支援的節點會公開 `screen.record`（mp4）。範例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意事項：

- `screen.record` 是否可用取決於節點平台。
- `nodes` 代理程式工具會將要求的 `durationMs` 上限設為 300000（5 分鐘）；節點可能會強制執行更嚴格的限制，以約束傳回的承載資料大小。
- `--no-audio` 會在支援的平台上停用麥克風擷取。
- 有多個螢幕可用時，請使用 `--screen <index>` 選取顯示器（0 = 主要顯示器）。

## 位置（節點）

在設定中啟用位置功能後，節點會公開 `location.get`。

命令列介面輔助指令：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意事項：

- 位置功能**預設為關閉**。
- “Always” 需要系統權限；背景擷取採盡力而為。
- 回應包含緯度／經度、精確度（公尺）和時間戳記。
- 完整的參數／回應格式與錯誤代碼：[位置命令](/zh-TW/nodes/location-command)。

## SMS（Android 節點）

當使用者授予 **SMS** 權限且裝置支援電話功能時，Android 節點可以公開 `sms.send` 和 `sms.search`。這兩個命令預設都視為危險命令：閘道操作人員還必須將它們加入 `gateway.nodes.commands.allow`，才能呼叫（請參閱[命令政策](#command-policy)）。

若要使用唯讀 SMS 搜尋，請在 `openclaw.json` 中明確選擇加入：

```json5
{
  gateway: {
    nodes: {
      commands: { allow: ["sms.search"] },
    },
  },
}
```

只有在節點也應能傳送訊息時，才另外加入 `sms.send`。Android 權限與閘道命令授權彼此獨立；授予手機權限不會修改閘道政策。

低階呼叫：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意事項：

- 可以在授予 `READ_SMS` 前宣告 `sms.search`，讓呼叫能傳回權限診斷；讀取訊息仍需要該 Android 權限。
- 不具電話功能的純 Wi-Fi 裝置不會通告 `sms.send`。
- `requires explicit gateway.nodes.commands.allow opt-in` 錯誤表示手機已宣告該命令，但閘道操作人員尚未授權。

## 裝置與個人資料命令

iOS 和 Android 節點預設會通告多個唯讀資料命令（請參閱[命令政策](#command-policy)表格）；Android 另外公開範圍更大的命令系列，並由其應用程式內設定管控。macOS 或無頭 Mac TypeScript 節點主機只有在操作人員使用 `--share-installed-apps` 啟用已安裝應用程式分享後，才會通告 `device.apps`。

可用系列：

- `device.status`、`device.info` — iOS、Android、Windows。
- `device.permissions`、`device.health` — 僅限 Android。
- `device.apps` — Android、macOS 和無頭 Mac 節點。Android 需要在 Settings 中啟用 Installed Apps 分享，且預設傳回啟動器中可見的應用程式。TypeScript 節點主機預設關閉分享，並接受 `query`、`limit` 和 `includeSystem`；macOS 結果包含 `label`、`bundleId`、`path` 和 `system`。
- `notifications.list`、`notifications.actions` — 僅限 Android。
- `photos.latest` — iOS、Android。
- `contacts.search` — iOS、Android（預設唯讀）；`contacts.add` 具有危險性，需要 `gateway.nodes.commands.allow`。
- `calendar.events` — iOS、Android（預設唯讀）；`calendar.add` 具有危險性，需要 `gateway.nodes.commands.allow`。
- `reminders.list` — iOS、Android（預設唯讀）；`reminders.add` 具有危險性，需要 `gateway.nodes.commands.allow`。
- `callLog.search` — 僅限 Android。
- `motion.activity`、`motion.pedometer` — iOS、Android；是否可用取決於感測器功能。

呼叫範例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## 系統命令（節點主機／Mac 節點）

macOS 節點會公開 `system.run`、`system.which`、`system.notify` 和 `system.execApprovals.get/set`。無頭節點主機會公開 `system.run.prepare`、`system.run`、`system.which` 和 `system.execApprovals.get/set`。

範例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

注意事項：

- `system.run` 會在承載資料中傳回 stdout、stderr 和結束代碼。
- Shell 執行現在會透過使用 `host=node` 的 `exec` 工具進行；`nodes` 仍是明確節點命令的直接 RPC 介面。
- `nodes invoke` 不會公開 `system.run` 或 `system.run.prepare`；這些功能僅保留在 exec 路徑上。
- exec 路徑會在核准前準備標準的 `systemRunPlan`。核准後，閘道會轉送該已儲存的計畫，而不是呼叫端之後編輯的任何命令／cwd／工作階段欄位。
- `system.notify` 會遵循 macOS 應用程式中的通知權限狀態；支援 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 無法辨識的節點 `platform` / `deviceFamily` 中繼資料會使用保守的預設允許清單，其中排除 `system.run` 和 `system.which`。如果你確實需要在未知平台上使用這些命令，請透過 `gateway.nodes.commands.allow` 明確加入。
- `system.run` 支援 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 對於 Shell 包裝程式（`bash|sh|zsh ... -c/-lc`），要求範圍內的 `--env` 值會縮減至明確的允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允許清單模式中選擇一律允許時，已知的分派包裝程式（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存內部可執行檔路徑，而非包裝程式路徑。若無法安全解除包裝，系統不會自動保存允許清單項目。
- 在允許清單模式下的 Windows 節點主機上，透過 `cmd.exe /c` 執行 Shell 包裝程式需要核准（僅有允許清單項目不會自動允許包裝程式形式）。
- 節點主機會忽略 `--env` 中的 `PATH` 覆寫，並在執行命令前移除一組龐大且持續維護的直譯器／Shell 啟動變數（例如 `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）。若需要額外的 PATH 項目，請設定節點主機服務環境（或將工具安裝在標準位置），不要透過 `--env` 傳遞 `PATH`。
- 在 macOS 節點模式中，`system.run` 受 macOS 應用程式中的 exec 核准管控（Settings → Exec approvals）。詢問／允許清單／完整模式的行為與無頭節點主機相同；遭拒的提示會傳回 `SYSTEM_RUN_DENIED`。
- 在無頭節點主機上，`system.run` 受 exec 核准（`~/.openclaw/exec-approvals.json`）管控；macOS 的具體資訊請參閱下方[無頭節點主機](#headless-node-host-cross-platform)中的 exec 主機路由環境變數。

## Exec 節點繫結

有多個節點可用時，你可以將 exec 繫結至特定節點。這會設定 `exec host=node` 的預設節點（也可以針對每個代理程式覆寫）。

全域預設值：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

每個代理程式的覆寫：

```bash
openclaw config get agents.entries
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
```

取消設定以允許任何節點：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.entries.main.tools.exec.node'
```

## 權限對應表

節點可以在 `node.list` / `node.describe` 中包含 `permissions` 對應表，以權限名稱（例如 `screenRecording`、`accessibility`、`location`）作為鍵，並使用布林值（`true` = 已授予）。

## 無頭節點主機（跨平台）

OpenClaw 可以執行**無頭節點主機**（無使用者介面），連線至閘道 WebSocket 並公開 `system.run` / `system.which`。這適用於 Linux／Windows，或在伺服器旁執行最小化節點。

啟動方式：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事項：

- 仍需進行配對（閘道會顯示裝置配對提示）。
- 用戶端執行個體中繼資料、已簽署的裝置身分與配對驗證會使用不同的狀態記錄；請參閱[無頭身分狀態](#headless-identity-state)。
- exec 核准會透過 `~/.openclaw/exec-approvals.json` 在本機強制執行（請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)）。
- 在 macOS 上，無頭節點主機預設會在本機執行 `system.run`。設定 `OPENCLAW_NODE_EXEC_HOST=app`，可透過配套應用程式的 exec 主機路由 `system.run`；加入 `OPENCLAW_NODE_EXEC_FALLBACK=0` 則會要求必須使用應用程式主機，若其無法使用便採取封閉式失敗。
- 閘道 WS 使用 TLS 時，請加入 `--tls` / `--tls-fingerprint`。

## Mac 節點模式

- macOS 選單列應用程式會以節點身分連線至閘道 WS 伺服器（因此 `openclaw nodes …` 可對此 Mac 運作）。
- 在遠端模式中，應用程式會為閘道連接埠開啟 SSH 通道，並連線至 `localhost`。
