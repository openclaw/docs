---
read_when:
    - 設定 exec 核准或允許清單
    - 在 macOS 應用程式中實作 exec 核准使用者體驗
    - 審查沙盒逃逸提示及其影響
sidebarTitle: Exec approvals
summary: 主機執行核准：政策旋鈕、允許清單，以及 YOLO/嚴格工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-07-05T11:45:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ddbd4dc2229183fe5a9b12c5fe26e89c09f0259d9c929d37e1c3b85311123a2
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 核准是**配套應用程式／節點主機護欄**，用來讓受沙箱限制的代理程式在真實主機（`gateway` 或 `node`）上執行命令。只有在政策 + 允許清單 +（選用）使用者核准全都同意時，命令才會執行。核准會疊加在工具政策與提升權限閘控之上（提升權限的 `full` 會略過它們）。

如需以模式為主的 `deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian 對應，以及 ACPX 測試框架權限概覽，請參閱
[權限模式](/zh-TW/tools/permission-modes)。

<Note>
有效政策是 `tools.exec.*` 與核准預設值中**較嚴格**者：核准只能收緊由設定衍生的安全性／詢問行為，不能放寬。如果省略某個核准欄位，就會使用 `tools.exec` 值。主機 exec 也會使用該機器上的本機核准狀態 - 如果執行主機核准檔案中有主機本機的 `ask: "always"`，即使工作階段或設定預設值要求 `ask: "on-miss"`，仍會持續提示。
</Note>

## 適用位置

Exec 核准會在執行主機本機強制執行：

- **閘道主機** -> 閘道機器上的 `openclaw` 程序。
- **節點主機** -> 節點執行器（macOS 配套應用程式或無頭節點主機）。

### 信任模型

- 經閘道驗證的呼叫者是該閘道的可信任操作員。
- 已配對的節點會把該可信任操作員能力延伸到節點主機。
- 核准會降低意外執行風險，但**不是**逐使用者的驗證邊界或檔案系統唯讀政策。
- 一旦核准，命令就可以依所選主機或沙箱檔案系統權限變更檔案。
- 已核准的節點主機執行會繫結標準執行脈絡：cwd、精確 argv、存在時的 env 繫結，以及適用時的固定可執行檔路徑。
- 對於 shell 指令碼與直接的直譯器／執行階段檔案叫用，OpenClaw 也會嘗試繫結一個具體的本機檔案運算元。如果該檔案在核准後、執行前發生變更，該次執行會被拒絕，而不是執行已漂移的內容。
- 檔案繫結是盡力而為，不是每個直譯器／執行階段載入器路徑的完整模型。如果無法識別出剛好一個具體的本機檔案，OpenClaw 會拒絕鑄造由核准支援的執行，而不是假裝完整涵蓋。

### macOS 分離

- **節點主機服務**會透過本機 IPC 將 `system.run` 轉送到 **macOS 應用程式**。
- **macOS 應用程式**會強制執行核准，並在 UI 脈絡中執行命令。

## 檢查有效政策

| 命令                                                          | 顯示內容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的政策、主機政策來源，以及有效結果。                       |
| `openclaw exec-policy show`                                      | 本機機器合併檢視。                                                             |
| `openclaw exec-policy set` / `preset`                            | 一次同步本機要求的政策與本機主機核准檔案。 |

完整命令列介面參考（旗標、JSON 輸出、允許清單新增／移除）：[核准命令列介面](/zh-TW/cli/approvals)。

當本機範圍要求 `host=node` 時，`exec-policy show` 會在執行階段將該範圍回報為由節點管理，而不是把本機核准檔案視為真實來源。

如果配套應用程式 UI **無法使用**，任何通常會提示的要求都會由 **ask 備援**解決（預設：`deny`）。

<Tip>
原生聊天核准用戶端可以在待處理核准訊息上植入通道特定的操作捷徑。Matrix 會植入反應捷徑（`✅` 允許一次、`♾️` 永久允許、`❌` 拒絕），同時仍在訊息中保留 `/approve ...` 作為備援。
</Tip>

## 設定與儲存

核准會存放在執行主機上的本機 JSON 檔案中。設定 `OPENCLAW_STATE_DIR` 時，檔案會跟隨該狀態目錄；否則會使用預設 OpenClaw 狀態目錄：

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

預設核准 socket 會跟隨相同根目錄：
`$OPENCLAW_STATE_DIR/exec-approvals.sock`，或在未設定變數時使用
`~/.openclaw/exec-approvals.sock`。

範例結構描述：

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
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 政策旋鈕

### `tools.exec.mode`

`tools.exec.mode` 是主機 exec 偏好的正規化政策介面：

| 值       | 行為                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | 封鎖主機 exec。                                                                                                                                                          |
| `allowlist` | 只執行允許清單中的命令，不詢問。                                                                                                                             |
| `ask`       | 使用允許清單政策，並在未命中時詢問。                                                                                                                                   |
| `auto`      | 使用允許清單政策，直接執行確定性符合項目，並在回退到人工核准路徑前，將核准未命中項目送 through OpenClaw 的原生自動審查器。 |
| `full`      | 不顯示核准提示即可執行主機 exec。                                                                                                                                   |

舊版 `tools.exec.security` / `tools.exec.ask` 仍受支援，且在該範圍未設定 `mode` 的任何位置仍會套用。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 封鎖所有主機 exec 要求。
  - `allowlist` - 只允許允許清單中的命令。
  - `full` - 允許所有內容（等同於提升權限）。

閘道／節點主機的預設值是 `full`；`sandbox` 主機則預設為
`deny`。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  主機 exec 的已設定詢問政策。控制來自 `tools.exec.ask` 與主機核准預設值的基準核准提示行為。
  預設值是 `off`。逐次呼叫的 `ask` 工具參數（請參閱
  [Exec 工具](/zh-TW/tools/exec#parameters)）只能強化該基準，而通道來源的模型呼叫會在有效主機 ask 為 `off` 時忽略它。

- `off` - 從不提示。
- `on-miss` - 只有在允許清單不符合時提示。
- `always` - 每個命令都提示。當有效 ask 模式為 `always` 時，`allow-always` 的持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但沒有可連線 UI（或提示逾時）時的解決方式。省略時預設為 `deny`。

- `deny` - 封鎖。
- `allowlist` - 只有在允許清單符合時允許。
- `full` - 允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  為 `true` 時，即使直譯器二進位檔本身在允許清單中，也會將行內程式碼 eval 形式視為僅能透過核准。這是針對無法乾淨對應到單一穩定檔案運算元的直譯器載入器的縱深防禦。
</ParamField>

嚴格模式會捕捉的範例：`python -c`、`node -e`/`--eval`/`-p`、
`ruby -e`、`perl -e`/`-E`、`php -r`、`lua -e`、`osascript -e`（也包含 `awk`、
`sed`、`make`、`find -exec` 和 `xargs` 行內形式）。

在嚴格模式中，這些命令仍需要明確核准，且
`allow-always` 不會自動為它們持久化新的允許清單項目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  僅用於呈現：啟用時，OpenClaw 可以附加由剖析器衍生的命令範圍，讓 Web 核准提示能醒目標示命令 token。這**不會**變更 `security`、`ask`、允許清單符合、嚴格行內 eval 行為、核准轉送或命令執行。
</ParamField>

可在 `tools.exec.commandHighlighting` 下全域設定，或在
`agents.list[].tools.exec.commandHighlighting` 下逐代理程式設定。

## YOLO 模式（免核准）

若要在沒有核准提示的情況下執行主機 exec，請開啟**兩個**政策層：
OpenClaw 設定中要求的 exec 政策（`tools.exec.*`）**以及**
執行主機核准檔案中的主機本機核准政策。

省略的 `askFallback` 預設為 `deny`。當無 UI 核准提示應回退為允許時，請明確將主機 `askFallback` 設為 `full`。

| 層級                 | YOLO 設定               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要差異：**

- `tools.exec.host=auto` 選擇 exec 在**哪裡**執行：可用時為 sandbox，否則為 gateway。
- YOLO 選擇主機 exec **如何**被核准：`security=full` 加上 `ask=off`。
- YOLO **不會**在已設定的主機 exec 政策之上新增獨立的啟發式命令混淆核准閘門或指令碼預檢拒絕層。
- `auto` 不會讓閘道路由成為沙箱工作階段中的免費覆寫。`auto` 允許逐次呼叫的 `host=node` 要求；只有在沒有啟用沙箱執行階段時，`auto` 才允許 `host=gateway`。如需穩定的非 auto 預設值，請設定 `tools.exec.host`，或明確使用 `/exec host=...`。

</Warning>

暴露自身非互動權限模式的命令列介面支援提供者可以遵循此政策。當 OpenClaw 的有效 exec 政策為 YOLO 時，Claude 命令列介面會加入
`--permission-mode bypassPermissions`。對於由 OpenClaw 管理的 Claude 即時工作階段，OpenClaw 的有效 exec 政策對 Claude 原生權限模式具有權威性：
YOLO 會將即時啟動正規化為 `--permission-mode bypassPermissions`，而限制性的有效 exec 政策會將即時啟動正規化為
`--permission-mode default`，即使原始 Claude 後端 args 指定了其他模式也是如此。

如果你想要更保守的設定，請把 OpenClaw exec 政策收緊回
`allowlist` / `on-miss` 或 `deny`。

### 持久的閘道主機「永不提示」設定

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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

同時更新本機 `tools.exec.host/security/ask` 與本機核准檔預設值（包括 `askFallback: "full"`）。這是刻意設計為僅限本機。若要遠端變更閘道主機或節點主機核准，請使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node
<id|name|ip>`。

其他內建預設集：`cautious`（`host=gateway`、`security=allowlist`、`ask=on-miss`、`askFallback=deny`）和 `deny-all`（`host=gateway`、`security=deny`、`ask=off`、`askFallback=deny`）。以相同方式套用：
`openclaw exec-policy preset cautious`。

若要設定個別欄位而不是完整預設集，請使用
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>`，並搭配這些旗標的任意子集。

### 節點主機

改在節點上套用相同的核准檔：

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

- `openclaw exec-policy` 不會同步節點核准。
- `openclaw exec-policy set --host node` 會被拒絕。
- 節點 exec 核准會在執行階段從節點擷取，因此針對節點的更新必須使用 `openclaw approvals --node ...`。

</Note>

### 僅限工作階段的捷徑

- `/exec security=full ask=off` 只會變更目前工作階段。
- `/elevated full` 是一個緊急捷徑，只有在要求的政策與主機核准檔都解析為 `security: "full"` 和 `ask: "off"` 時，才會略過 exec 核准。較嚴格的主機檔案，例如 `ask:
"always"`，仍會提示。

如果主機核准檔保持比設定更嚴格，仍以較嚴格的主機政策為準。

## Allowlist（每個代理程式）

Allowlist 是**每個代理程式**各自獨立的。如果有多個代理程式，請在 macOS 應用程式中切換你正在編輯的代理程式。模式是 glob 比對。

模式可以是已解析的二進位路徑 glob，或單純的命令名稱 glob。單純名稱只會比對透過 `PATH` 呼叫的命令，因此當命令是 `rg` 時，`rg` 可以比對 `/opt/homebrew/bin/rg`，但**不會**比對 `./rg` 或 `/tmp/rg`。請使用路徑 glob 來信任某個特定的二進位位置。

舊版 `agents.default` 項目會在載入時遷移到 `agents.main`。像 `echo ok && pwd` 這類 shell 鏈仍需要每個最上層片段都符合 allowlist 規則。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制引數

當 allowlist 項目應該比對某個二進位檔和特定引數形狀時，請加入 `argPattern`。OpenClaw 會針對已解析的命令引數評估正規表示式，並排除可執行檔 token（`argv[0]`）。對於手動撰寫的項目，引數會以單一空格串接，因此當你需要精確比對時，請錨定模式。

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

該項目允許 `python3 safe.py`；`python3 other.py` 會是 allowlist 未命中。如果同一個二進位檔也有僅限路徑的項目，不相符的引數仍可回退到該僅限路徑的項目。若目標是將二進位檔限制為宣告的引數，請省略僅限路徑的項目。

由核准流程儲存的項目會使用內部分隔符格式來進行精確 argv 比對。請優先使用 UI 或核准流程重新產生這些項目，而不是手動編輯編碼後的值。如果 OpenClaw 無法解析某個命令片段的 argv，含有 `argPattern` 的項目不會比對。

每個 allowlist 項目都支援：

| 欄位               | 意義                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二進位路徑 glob 或單純命令名稱 glob                  |
| `argPattern`       | 選用的 argv 正規表示式；省略的項目僅限路徑                   |
| `id`               | 用於 UI 身分識別的穩定 UUID                                  |
| `source`           | 項目來源，例如 `allow-always`                                |
| `commandText`      | 核准流程建立項目時擷取的命令文字                             |
| `lastUsedAt`       | 上次使用時間戳                                                |
| `lastUsedCommand`  | 上次相符的命令                                                |
| `lastResolvedPath` | 上次解析出的二進位路徑                                        |

## 自動允許技能命令列介面

啟用 **Auto-allow skill CLIs**（`autoAllowSkills`）時，已知 Skills 參照的可執行檔會在節點上視為已列入 allowlist（macOS 節點或無頭節點主機）。這會透過閘道 RPC 使用 `skills.bins` 擷取 skill bin 清單。如果你想要嚴格的手動 allowlist，請停用此功能。

<Warning>
- 這是一個**隱含的便利 allowlist**，與手動路徑 allowlist 項目分開。
- 它適用於可信任的操作員環境，其中閘道和節點位於相同信任邊界內。
- 如果你需要嚴格的明確信任，請保持 `autoAllowSkills: false`，並且只使用手動路徑 allowlist 項目。

</Warning>

## 安全 bin 與核准轉送

如需安全 bin（僅限 stdin 的快速路徑）、直譯器繫結詳細資訊，以及如何將核准提示轉送到 Slack/Discord/Telegram（或以原生核准用戶端執行），請參閱
[Exec approvals - advanced](/zh-TW/tools/exec-approvals-advanced)。

## Control UI 編輯

使用 **Control UI -> Nodes -> Exec approvals** 卡片來編輯預設值、每個代理程式覆寫，以及 allowlist。選擇範圍（Defaults 或某個代理程式），調整政策，新增/移除 allowlist 模式，然後按 **Save**。UI 會顯示每個模式的上次使用中繼資料，方便你保持清單整潔。

目標選擇器會選擇**閘道**（本機核准）或**節點**。節點必須宣告 `system.execApprovals.get/set`（macOS 應用程式或無頭節點主機）。如果節點尚未宣告 exec 核准，請直接編輯其本機核准檔。

命令列介面：`openclaw approvals` 支援編輯閘道或節點，請參閱
[Approvals CLI](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，閘道會向操作員用戶端廣播 `exec.approval.requested`。Control UI 和 macOS 應用程式會透過 `exec.approval.resolve` 解析它，然後閘道會將已核准的要求轉送到節點主機。

對於 `host=node`，核准要求會包含標準的 `systemRunPlan` 酬載。閘道會在轉送已核准的 `system.run` 要求時，使用該計畫作為權威的命令/cwd/工作階段脈絡：

- 節點 exec 路徑會預先準備一個標準計畫。
- 核准記錄會儲存該計畫及其繫結中繼資料。
- 一旦核准，最終轉送的 `system.run` 呼叫會重用已儲存的計畫，而不是信任後續呼叫者編輯。
- 如果呼叫者在核准要求建立後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，閘道會將轉送的執行視為核准不符並拒絕。

## 系統事件與拒絕

節點回報完成後，exec 生命週期會將 `Exec finished` 系統訊息發佈到代理程式的工作階段。OpenClaw 也可以在核准授予後，經過 `tools.exec.approvalRunningNoticeMs`（預設 `10000`，`0` 會停用）時發出進行中通知。被拒絕的 exec 核准對主機命令而言是終止狀態：命令不會執行。

- 對於具有來源工作階段的主代理程式非同步核准，OpenClaw 會將拒絕以內部後續訊息發回該工作階段，讓代理程式可以停止等待非同步命令並避免缺少結果修復。
- 如果沒有工作階段，或工作階段無法恢復，OpenClaw 仍可向操作員或直接聊天路由回報簡潔的拒絕。
- 子代理程式和排程工作階段的拒絕不會發回該工作階段。

閘道主機 exec 核准會發出相同的完成生命週期事件。受核准控管的 exec 會重用核准 id，將待處理要求與其完成/拒絕訊息關聯起來（`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`）。

## 影響

- **`full`** 權限強大；可行時請優先使用 allowlist。
- **`ask`** 讓你保持參與，同時仍允許快速核准。
- 每個代理程式的 allowlist 可防止某個代理程式的核准外洩到其他代理程式。
- 核准只會套用於來自**已授權傳送者**的主機 exec 要求。未授權的傳送者無法發出 `/exec`。
- `/exec security=full` 是提供給已授權操作員的工作階段層級便利功能，並且會依設計略過核准。若要強制封鎖主機 exec，請將核准 security 設為 `deny`，或透過工具政策拒絕 `exec` 工具。

## 相關

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全 bin、直譯器繫結，以及將核准轉送到聊天。
  </Card>
  <Card title="Exec tool" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    同樣會略過核准的緊急路徑。
  </Card>
  <Card title="Sandboxing" href="/zh-TW/gateway/sandboxing" icon="box">
    沙箱模式與工作區存取。
  </Card>
  <Card title="Security" href="/zh-TW/gateway/security" icon="lock">
    安全模型與強化。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何時使用各項控制。
  </Card>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="sparkles">
    由 Skills 支援的自動允許行為。
  </Card>
</CardGroup>
