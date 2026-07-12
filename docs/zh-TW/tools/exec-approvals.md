---
read_when:
    - 設定 exec 核准或允許清單
    - 在 macOS App 中實作 exec 核准使用者體驗
    - 審查沙箱逃逸提示及其影響
sidebarTitle: Exec approvals
summary: 主機執行核准：原則設定、允許清單，以及 YOLO／嚴格工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-07-11T21:51:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

執行核准是讓沙箱化代理程式可在實體主機（`gateway` 或 `node`）上執行命令的**伴隨應用程式／節點主機防護機制**。只有在政策、允許清單及（選用的）使用者核准全數同意時，命令才會執行。核准機制疊加在工具政策與提升權限閘控**之上**（提升權限的 `full` 會略過這些機制）。

如需以模式為主的 `deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian 對應及 ACPX 測試框架權限概覽，請參閱[權限模式](/zh-TW/tools/permission-modes)。

<Note>
有效政策會採用 `tools.exec.*` 與核准預設值中**較嚴格**的一方：核准只能收緊由設定衍生的安全性／詢問政策，絕不能放寬。如果省略核准欄位，則使用 `tools.exec` 的值。主機執行也會使用該機器上的本機核准狀態——即使工作階段或設定預設值要求 `ask: "on-miss"`，執行主機核准檔案中的主機本機 `ask: "always"` 仍會持續提示。
</Note>

## 適用範圍

執行核准會在執行主機本機強制執行：

- **閘道主機** -> 閘道機器上的 `openclaw` 程序。
- **節點主機** -> 節點執行器（macOS 伴隨應用程式或無介面節點主機）。

### 信任模型

- 通過閘道驗證的呼叫端是該閘道的受信任操作員。
- 已配對的節點會將該受信任操作員能力延伸至節點主機。
- 核准可降低意外執行的風險，但**不是**個別使用者的驗證邊界，也不是檔案系統唯讀政策。
- 命令一經核准，即可依所選主機或沙箱檔案系統權限修改檔案。
- 已核准的節點主機執行會繫結標準執行情境：工作目錄、確切的 argv、存在時的環境變數繫結，以及適用時固定的可執行檔路徑。
- 對於 shell 指令碼及直接呼叫直譯器／執行階段檔案的情況，OpenClaw 也會嘗試繫結一個具體的本機檔案運算元。如果該檔案在核准後、執行前發生變更，系統會拒絕執行，而不會執行已偏移的內容。
- 檔案繫結是盡力而為，並非涵蓋每種直譯器／執行階段載入路徑的完整模型。如果無法識別恰好一個具體的本機檔案，OpenClaw 會拒絕建立以核准為依據的執行，而不會假裝已完整涵蓋。

### macOS 分工

- **節點主機服務**會透過本機 IPC 將 `system.run` 轉送至 **macOS 應用程式**。
- **macOS 應用程式**會強制執行核准，並在使用者介面情境中執行命令。

## 檢查有效政策

| 命令                                                             | 顯示內容                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的政策、主機政策來源及有效結果。                         |
| `openclaw exec-policy show`                                      | 本機的合併檢視。                                             |
| `openclaw exec-policy set` / `preset`                            | 一次同步本機要求的政策與本機主機核准檔案。                   |

<Note>
不包含個別工作階段的 `/exec` 覆寫。請在相關工作階段中執行 `/exec`，以檢查其目前的預設值。請參閱[工作階段覆寫](/zh-TW/tools/exec#session-overrides-exec)。
</Note>

完整的命令列介面參考（旗標、JSON 輸出、允許清單新增／移除）：[核准命令列介面](/zh-TW/cli/approvals)。

當本機範圍要求 `host=node` 時，`exec-policy show` 會將該範圍回報為執行階段由節點管理，而不會將本機核准檔案視為事實來源。

如果伴隨應用程式使用者介面**無法使用**，任何正常情況下會提示的要求，都會由**詢問備援**處理（預設：`deny`）。

<Tip>
原生聊天核准用戶端可在待處理核准訊息中預先加入特定頻道的操作選項。Matrix 會加入反應捷徑（`✅` 僅允許一次、`♾️` 永遠允許、`❌` 拒絕），同時仍在訊息中保留 `/approve ...` 作為備援。
</Tip>

## 設定與儲存

核准資料儲存在執行主機上的本機 JSON 檔案中。設定 `OPENCLAW_STATE_DIR` 時，檔案會位於該狀態目錄下；否則會使用預設的 OpenClaw 狀態目錄：

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# 否則
~/.openclaw/exec-approvals.json
```

預設核准通訊端採用相同的根目錄：
`$OPENCLAW_STATE_DIR/exec-approvals.sock`；若未設定該變數，則為
`~/.openclaw/exec-approvals.sock`。

2026.6.6 之前的版本一律將檔案儲存在 `~/.openclaw`。如果 `OPENCLAW_STATE_DIR` 指向其他位置，而預設目錄中仍存在核准檔案，請直接執行一次 `openclaw doctor --fix`，將其匯入狀態目錄（原始檔案會以 `.migrated` 後綴封存）。互動式 doctor 也可以預覽並確認匯入。自動更新與閘道監看修復執行絕不會跨狀態目錄匯入：暫存或預備環境狀態目錄不得取得預設安裝的核准資料。將舊版 `plugin-binding-approvals.json` 匯入共用 SQLite 狀態時，也適用相同邊界。

結構描述範例：

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 政策設定項

### `tools.exec.mode`

`tools.exec.mode` 是主機執行的首選標準化政策介面：

| 值          | 行為                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | 封鎖主機執行。                                                                                                                                                               |
| `allowlist` | 僅執行允許清單中的命令，不進行詢問。                                                                                                                                         |
| `ask`       | 使用允許清單政策，並在未命中時詢問。                                                                                                                                         |
| `auto`      | 使用允許清單政策、直接執行確定性相符項目，並先將未通過核准的項目交由 OpenClaw 原生自動審查器處理，再備援至人工核准途徑。                                                       |
| `full`      | 執行主機命令而不顯示核准提示。                                                                                                                                               |

舊版 `tools.exec.security`／`tools.exec.ask` 仍受支援，並且在該範圍未設定 `mode` 時繼續套用。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny`——封鎖所有主機執行要求。
  - `allowlist`——僅允許允許清單中的命令。
  - `full`——允許所有命令（等同於提升權限）。

閘道／節點主機的預設值為 `full`；`sandbox` 主機則預設為 `deny`。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  為主機執行設定的詢問政策。控制由 `tools.exec.ask` 與主機核准預設值所決定的基準核准提示行為。預設值為 `off`。個別呼叫的 `ask` 工具參數（請參閱[執行工具](/zh-TW/tools/exec#parameters)）只能收緊該基準；當有效的主機詢問設定為 `off` 時，來自頻道的模型呼叫會忽略此參數。

- `off`——永不提示。
- `on-miss`——僅在允許清單未相符時提示。
- `always`——每個命令都提示。當有效詢問模式為 `always` 時，`allow-always` 的持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但無法連線至任何使用者介面（或提示逾時）時的處理方式。省略時預設為 `deny`。

- `deny`——封鎖。
- `allowlist`——僅在允許清單相符時允許。
- `full`——允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  設為 `true` 時，即使直譯器二進位檔本身位於允許清單中，仍會將行內程式碼求值形式視為必須經過核准。這是針對無法明確對應至單一穩定檔案運算元的直譯器載入器所提供的縱深防禦。
</ParamField>

嚴格模式會攔截的範例：`python -c`、`node -e`／`--eval`／`-p`、`ruby -e`、`perl -e`／`-E`、`php -r`、`lua -e`、`osascript -e`（也包括 `awk`、`sed`、`make`、`find -exec` 及 `xargs` 的行內形式）。

在嚴格模式下，這些命令需要審查器或明確核准。使用 `tools.exec.mode: "auto"` 時，如果命令具有可強制執行的計畫，審查器可以核准一次低風險執行；否則 OpenClaw 會詢問人工操作員。
到達審查器備援的 `Codex app-server` 命令核准會詢問人工操作員，因為其核准要求不會公開可強制執行且已解析的可執行檔。
`allow-always` 不會為行內求值命令持久儲存新的允許清單項目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  僅影響呈現方式：啟用時，OpenClaw 可以附加由剖析器衍生的命令範圍，讓網頁核准提示醒目顯示命令詞元。這**不會**變更 `security`、`ask`、允許清單比對、嚴格行內求值行為、核准轉送或命令執行。
</ParamField>

可在 `tools.exec.commandHighlighting` 下進行全域設定，或在 `agents.list[].tools.exec.commandHighlighting` 下為個別代理程式設定。

## YOLO 模式（無核准）

若要在不顯示核准提示的情況下執行主機命令，必須同時開放**兩個**政策層：OpenClaw 設定中要求的執行政策（`tools.exec.*`），以及執行主機核准檔案中的主機本機核准政策。

省略 `askFallback` 時預設為 `deny`。若無使用者介面的核准提示應備援為允許，請明確將主機的 `askFallback` 設為 `full`。

| 層級                  | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`／`node` 上為 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要區別：**

- `tools.exec.host=auto` 選擇執行命令的**位置**：有沙箱時使用沙箱，否則使用閘道。
- YOLO 選擇核准主機執行的**方式**：`security=full` 加上 `ask=off`。
- YOLO **不會**在已設定的主機執行政策之上，另行加入啟發式命令混淆核准閘門或指令碼預先檢查拒絕層。
- `auto` 不會讓閘道路由成為沙箱化工作階段可任意使用的覆寫。從 `auto` 發出的個別呼叫 `host=node` 要求會被允許；只有在沒有作用中的沙箱執行階段時，`auto` 才允許 `host=gateway`。若需要穩定的非自動預設值，請設定 `tools.exec.host`，或明確使用 `/exec host=...`。

</Warning>

由命令列介面支援、且提供自身非互動式權限模式的提供者，也可以遵循此原則。當 OpenClaw 的有效執行原則為 YOLO 時，Claude 命令列介面會加入 `--permission-mode bypassPermissions`。對於由 OpenClaw 管理的 Claude 即時工作階段，OpenClaw 的有效執行原則優先於 Claude 的原生權限模式：YOLO 會將即時啟動正規化為 `--permission-mode bypassPermissions`；限制性的有效執行原則則會將即時啟動正規化為 `--permission-mode default`，即使原始 Claude 後端引數指定了其他模式亦然。

若要採用更保守的設定，請將 OpenClaw 執行原則收緊回
`allowlist` / `on-miss` 或 `deny`。

### 持久化的閘道主機「永不提示」設定

<Steps>
  <Step title="設定所需的組態原則">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="同步主機核准檔案">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### 本機捷徑

```bash
openclaw exec-policy preset yolo
```

同時更新本機的 `tools.exec.host/security/ask` 與本機核准檔案的預設值（包括 `askFallback: "full"`）。此功能刻意僅限本機使用。若要遠端變更閘道主機或節點主機的核准設定，請使用
`openclaw approvals set --gateway` 或 `openclaw approvals set --node
<id|name|ip>`。

其他內建預設集包括：`cautious`（`host=gateway`、`security=allowlist`、
`ask=on-miss`、`askFallback=deny`）以及 `deny-all`（`host=gateway`、
`security=deny`、`ask=off`、`askFallback=deny`）。套用方式相同：
`openclaw exec-policy preset cautious`。

若要設定個別欄位而非完整預設集，請使用
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>`，並可任意選用其中部分旗標。

### 節點主機

改為在節點上套用相同的核准檔案：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**僅限本機的限制：**

- `openclaw exec-policy` 不會同步節點核准設定。
- `openclaw exec-policy set --host node` 會遭到拒絕。
- 執行階段會從節點取得節點執行核准設定，因此以節點為目標的更新必須使用 `openclaw approvals --node ...`。

</Note>

### 僅限工作階段的捷徑

- `/exec security=full ask=off` 只會變更目前的工作階段。
- `/elevated full` 是緊急存取捷徑，只有在所要求的原則與主機核准檔案皆解析為 `security: "full"` 和 `ask: "off"` 時，才會略過執行核准。較嚴格的主機檔案（例如 `ask:
"always"`）仍會顯示提示。

若主機核准檔案的限制仍比組態更嚴格，便仍以較嚴格的主機原則為準。

## 允許清單（每個代理程式各自設定）

允許清單為**每個代理程式各自設定**。若有多個代理程式，請在 macOS 應用程式中切換目前要編輯的代理程式。模式採用 glob 比對。

模式可以是解析後的二進位檔路徑 glob，或單純的命令名稱 glob。
單純名稱只會比對透過 `PATH` 叫用的命令，因此當命令為 `rg` 時，`rg` 可以比對
`/opt/homebrew/bin/rg`，但**不會**比對 `./rg` 或
`/tmp/rg`。若只要信任特定位置的一個二進位檔，請使用路徑 glob。

舊版 `agents.default` 項目會在載入時遷移至 `agents.main`。
像 `echo ok && pwd` 這類 shell 命令鏈仍需要每個頂層區段都符合允許清單規則。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制引數

當允許清單項目應比對某個二進位檔及特定引數形式時，請加入 `argPattern`。OpenClaw 在所有主機上使用 ECMAScript（JavaScript）規則運算式語意，並針對已剖析的命令引數評估該運算式，但不包含可執行檔權杖（`argv[0]`）。
對於手動撰寫的項目，引數會以單一空格連接，因此需要完全比對時，請使用錨點限定模式。

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

該項目允許 `python3 safe.py`；`python3 other.py` 則不符合允許清單。
若同一二進位檔另有僅限路徑的項目，不相符的引數仍可回退至該僅限路徑的項目。若目標是將該二進位檔限制為只能使用宣告的引數，請省略僅限路徑的項目。

由核准流程儲存的項目會使用內部的分隔符格式，以精確比對 argv。
請優先透過使用者介面或核准流程重新產生這些項目，而非手動編輯編碼後的值。若 OpenClaw 無法剖析某個命令區段的 argv，含有 `argPattern` 的項目便不會相符。

每個允許清單項目支援：

| 欄位               | 意義                                                 |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | 解析後的二進位檔路徑 glob 或單純命令名稱 glob        |
| `argPattern`       | 選用的 ECMAScript argv 規則運算式；省略時僅比對路徑 |
| `id`               | 穩定的不透明識別碼；未提供時產生 UUID               |
| `source`           | 項目來源，例如 `allow-always`                        |
| `commandText`      | 舊版純文字輸入；載入時捨棄                           |
| `lastUsedAt`       | 上次使用時間戳記                                     |
| `lastUsedCommand`  | 上次相符的命令                                       |
| `lastResolvedPath` | 上次解析出的二進位檔路徑                             |

## 自動允許 Skills 命令列介面

啟用 **自動允許 Skills 命令列介面**（`autoAllowSkills`）時，已知 Skills 所參照的可執行檔會在節點（macOS 節點或無介面節點主機）上視為已列入允許清單。此功能會透過閘道 RPC 使用 `skills.bins` 取得 Skills 二進位檔清單。若要使用嚴格的手動允許清單，請停用此功能。

<Warning>
- 這是**隱含的便利性允許清單**，與手動路徑允許清單項目彼此獨立。
- 此功能適用於閘道與節點位於相同信任邊界內的受信任操作環境。
- 若需要嚴格的明確信任，請保持 `autoAllowSkills: false`，且僅使用手動路徑允許清單項目。

</Warning>

## 安全二進位檔與核准轉送

如需瞭解安全二進位檔（僅限 stdin 的快速路徑）、直譯器繫結細節，以及如何將核准提示轉送至 Slack/Discord/Telegram（或將它們作為原生核准用戶端執行），請參閱
[執行核准－進階](/zh-TW/tools/exec-approvals-advanced)。

## 控制介面編輯

使用**控制介面 -> 節點 -> 執行核准**卡片編輯預設值、各代理程式覆寫設定及允許清單。選擇範圍（預設值或某個代理程式）、調整原則、新增或移除允許清單模式，然後按一下**儲存**。介面會顯示每個模式的上次使用中繼資料，方便維持清單整潔。

目標選擇器可選擇**閘道**（本機核准）或**節點**。
節點必須公告 `system.execApprovals.get/set`（macOS 應用程式或無介面節點主機）。若節點尚未公告執行核准功能，請直接編輯其本機核准檔案。

部分節點主機（包括 Windows 搭配應用程式）採用不同的核准原則格式。控制介面會以唯讀方式顯示這些主機原生原則。請使用搭配應用程式，或搭配原生原則格式使用 `openclaw approvals set --node <id|name|ip>` 進行編輯；請參閱[核准命令列介面](/zh-TW/cli/approvals)。

命令列介面：`openclaw approvals` 支援編輯閘道或節點，請參閱
[核准命令列介面](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，閘道會向操作員用戶端廣播
`exec.approval.requested`。控制介面與 macOS
應用程式會透過 `exec.approval.resolve` 處理該要求，之後閘道會將已核准的要求轉送至節點主機。

對於 `host=node`，核准要求會包含標準的 `systemRunPlan`
承載內容。閘道在轉送已核准的 `system.run` 要求時，會將該計畫作為命令、cwd 與工作階段內容的權威依據：

- 節點執行路徑會預先準備一份標準計畫。
- 核准記錄會儲存該計畫及其繫結中繼資料。
- 核准後，最終轉送的 `system.run` 呼叫會重複使用儲存的計畫，而不會信任呼叫端後續的修改。
- 若呼叫端在建立核准要求後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，閘道會因核准不相符而拒絕轉送執行。

## 系統事件與拒絕

節點回報完成後，執行生命週期會在代理程式的工作階段中發布一則 `執行完成` 系統訊息。核准授予後，OpenClaw 也可以在
`tools.exec.approvalRunningNoticeMs` 經過後發出進行中通知（預設值為 `10000`，設為 `0` 可停用）。
遭拒絕的執行核准是該主機命令的終止結果：命令不會執行。

- 對於具有來源工作階段的主代理程式非同步核准，OpenClaw
  會將拒絕以內部後續訊息發布回該工作階段，讓代理程式停止等待非同步命令，並避免進行缺少結果的修復。
- 若沒有工作階段，或無法恢復該工作階段，OpenClaw
  仍可向操作員或直接聊天路由回報簡潔的拒絕訊息。
- 子代理程式與排程工作階段的拒絕不會發布回該工作階段。

閘道主機的執行核准會發出相同的完成生命週期事件。
受核准控管的執行會重複使用核准識別碼，以關聯待處理要求與其完成或拒絕訊息（`執行完成（閘道
id=...）` / `執行遭拒（閘道 id=...）`）。

## 影響

- **`full`** 功能強大；可行時請優先使用允許清單。
- **`ask`** 讓你保持掌握情況，同時仍可快速核准。
- 各代理程式的允許清單可防止某個代理程式的核准設定洩漏至其他代理程式。
- 核准只適用於來自**已授權傳送者**的主機執行要求。未授權傳送者無法發出 `/exec`。
- `/exec security=full` 是提供給已授權操作員的工作階段層級便利功能，設計上會略過核准。若要硬性封鎖主機執行，請將核准安全性設為 `deny`，或透過工具原則拒絕 `exec` 工具。

## 相關內容

<CardGroup cols={2}>
  <Card title="執行核准－進階" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全二進位檔、直譯器繫結，以及將核准轉送至聊天。
  </Card>
  <Card title="執行工具" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="提升權限模式" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    也會略過核准的緊急存取路徑。
  </Card>
  <Card title="沙箱化" href="/zh-TW/gateway/sandboxing" icon="box">
    沙箱模式與工作區存取。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="lock">
    安全模型與強化。
  </Card>
  <Card title="沙箱、工具原則與提升權限的比較" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    各項控制措施的適用時機。
  </Card>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="sparkles">
    由 Skills 支援的自動允許行為。
  </Card>
</CardGroup>
