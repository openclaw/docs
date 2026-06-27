---
read_when:
    - 設定 exec 核准或允許清單
    - 實作 macOS 應用程式中的 exec 核准使用者體驗
    - 審查沙盒逃逸提示及其影響
sidebarTitle: Exec approvals
summary: 主機執行核准：政策旋鈕、允許清單，以及 YOLO/嚴格工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-06-27T20:06:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 核准是**伴隨應用程式 / 節點主機防護機制**，用來讓沙箱化代理程式在真實主機（`gateway` 或 `node`）上執行命令。這是一個安全互鎖：只有在政策 + 允許清單 +（可選）使用者核准全都同意時，命令才會被允許。Exec 核准疊加在工具政策與提高權限閘控**之上**（除非 elevated 設為 `full`，這會略過核准）。

如需以模式為主的 `deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian 對應，以及 ACPX harness 權限總覽，請參閱
[權限模式](/zh-TW/tools/permission-modes)。

<Note>
有效政策是 `tools.exec.*` 與核准預設值兩者中**較嚴格**者；如果省略某個核准欄位，會使用 `tools.exec` 值。主機 exec 也會使用該機器上的本機核准狀態 - 執行主機核准檔中的主機本機 `ask: "always"` 會持續提示，即使工作階段或設定預設值要求 `ask: "on-miss"` 也是如此。
</Note>

## 檢查有效政策

| 命令                                                          | 顯示內容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的政策、主機政策來源，以及有效結果。                       |
| `openclaw exec-policy show`                                      | 本機合併檢視。                                                             |
| `openclaw exec-policy set` / `preset`                            | 一次同步本機要求的政策與本機主機核准檔。 |

當本機作用域要求 `host=node` 時，`exec-policy show` 會回報該作用域在執行階段由節點管理，而不是假裝本機核准檔是真實來源。

如果伴隨應用程式 UI **不可用**，任何通常會提示的要求都會由 **ask 後援**處理（預設：`deny`）。

<Tip>
原生聊天核准用戶端可以在待處理核准訊息上植入特定頻道的便利操作。例如，Matrix 會植入反應捷徑（`✅` 允許一次、`❌` 拒絕、`♾️` 永遠允許），同時仍在訊息中保留 `/approve ...` 命令作為後援。
</Tip>

## 適用範圍

Exec 核准會在執行主機本機強制執行：

- **閘道主機** → 閘道機器上的 `openclaw` 程序。
- **節點主機** → 節點執行器（macOS 伴隨應用程式或無頭節點主機）。

### 信任模型

- 經閘道驗證的呼叫者，是該閘道的受信任操作員。
- 已配對節點會將該受信任操作員能力延伸到節點主機。
- Exec 核准會降低意外執行風險，但**不是**每位使用者的驗證邊界或檔案系統唯讀政策。
- 一旦核准，命令可以依所選主機或沙箱檔案系統權限變更檔案。
- 已核准的節點主機執行會綁定標準執行內容：標準 cwd、精確 argv、存在時的 env 綁定，以及適用時釘選的可執行檔路徑。
- 對於 shell 指令碼與直接的直譯器/執行階段檔案叫用，OpenClaw 也會嘗試綁定一個具體本機檔案運算元。如果該綁定檔案在核准後、執行前發生變更，該次執行會被拒絕，而不是執行已漂移的內容。
- 檔案綁定刻意採最佳努力，**不是**每個直譯器/執行階段載入器路徑的完整語意模型。如果核准模式無法識別正好一個要綁定的具體本機檔案，它會拒絕鑄造由核准支援的執行，而不是假裝有完整覆蓋。

### macOS 分離

- **節點主機服務**會透過本機 IPC 將 `system.run` 轉送到 **macOS app**。
- **macOS app** 會強制執行核准，並在 UI 內容中執行命令。

## 設定與儲存

核准會存放在執行主機上的本機 JSON 檔。當設定
`OPENCLAW_STATE_DIR` 時，該檔案會跟隨該狀態目錄；否則會使用預設 OpenClaw 狀態目錄：

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

預設核准 socket 遵循相同根目錄：
`$OPENCLAW_STATE_DIR/exec-approvals.sock`，或在未設定變數時使用
`~/.openclaw/exec-approvals.sock`。

範例 schema：

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

`tools.exec.mode` 是主機 exec 偏好的正規化政策介面。
值如下：

- `deny` - 封鎖主機 exec。
- `allowlist` - 只在不詢問的情況下執行允許清單中的命令。
- `ask` - 使用允許清單政策，並在未命中時詢問。
- `auto` - 使用允許清單政策、直接執行確定性符合項目，並在回退到人工核准路由前，將核准未命中交給 OpenClaw 的原生自動審查器。
- `full` - 不顯示核准提示即執行主機 exec。

舊版 `tools.exec.security` / `tools.exec.ask` 仍受支援，且在較窄的工作階段或代理程式作用域設定時仍會優先。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 封鎖所有主機 exec 要求。
  - `allowlist` - 只允許允許清單中的命令。
  - `full` - 允許所有項目（等同於提高權限）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  已設定的主機 exec 詢問政策。控制來自 `tools.exec.ask` 與主機核准預設值的基準核准提示行為。每次呼叫的 `ask` 工具參數（請參閱 [Exec 工具](/zh-TW/tools/exec#parameters)）只能強化該基準，而且在有效主機 ask 為 `off` 時，來自頻道的模型呼叫會忽略它。

- `off` - 永不提示。
- `on-miss` - 只在允許清單不符合時提示。
- `always` - 每個命令都提示。當有效 ask 模式為 `always` 時，`allow-always` 持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但沒有可連線 UI 時的處理方式。如果省略此欄位，OpenClaw 預設為 `deny`。

- `deny` - 封鎖。
- `allowlist` - 只有在符合允許清單時允許。
- `full` - 允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  當為 `true` 時，即使直譯器二進位檔本身在允許清單中，OpenClaw 也會將內嵌程式碼求值形式視為僅限核准。這是對無法乾淨對應到單一穩定檔案運算元的直譯器載入器所採取的縱深防禦。
</ParamField>

嚴格模式會攔截的範例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在嚴格模式中，這些命令仍需要明確核准，而且 `allow-always` 不會自動為它們保留新的允許清單項目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  只控制 exec 核准提示中的呈現方式。啟用時，OpenClaw 可以附加由剖析器衍生的命令範圍，讓 Web 核准提示能醒目標示命令 token。將它設為 `true` 即可啟用命令文字醒目標示。
</ParamField>

此設定**不會**變更 `security`、`ask`、允許清單比對、嚴格內嵌求值行為、核准轉送或命令執行。
它可以在全域的 `tools.exec.commandHighlighting` 下設定，或針對每個代理程式在 `agents.list[].tools.exec.commandHighlighting` 下設定。

## YOLO 模式（免核准）

如果你希望主機 exec 在沒有核准提示的情況下執行，必須開啟**兩個**政策層 - OpenClaw 設定中的要求 exec 政策
(`tools.exec.*`) **以及**執行主機核准檔中的主機本機核准政策。

OpenClaw 會將省略的 `askFallback` 預設為 `deny`。當沒有 UI 的核准提示應回退為允許時，請明確將主機
`askFallback` 設為 `full`。

| 層級                 | YOLO 設定               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要區別：**

- `tools.exec.host=auto` 選擇 exec **在哪裡**執行：可用時在沙箱中，否則在閘道上。
- YOLO 選擇主機 exec **如何**被核准：`security=full` 加上 `ask=off`。
- 在 YOLO 模式中，OpenClaw **不會**在已設定的主機 exec 政策之上，額外加入獨立的啟發式命令混淆核准閘或指令碼預檢拒絕層。
- `auto` 不會讓閘道路由成為沙箱化工作階段的自由覆寫。從 `auto` 可以允許每次呼叫的 `host=node` 要求；只有在沒有沙箱執行階段作用中時，`host=gateway` 才會從 `auto` 被允許。若要穩定的非 auto 預設值，請設定 `tools.exec.host` 或明確使用 `/exec host=...`。

</Warning>

公開自身非互動式權限模式的 CLI 後端提供者可以遵循此政策。當 OpenClaw 的有效 exec 政策是 YOLO 時，Claude CLI 會加入
`--permission-mode bypassPermissions`。對於由 OpenClaw 管理的 Claude 即時工作階段，OpenClaw 的有效 exec 政策會優先於 Claude 的原生權限模式：
YOLO 會將即時啟動正規化為 `--permission-mode bypassPermissions`，而限制性的有效 exec 政策會將即時啟動正規化為
`--permission-mode default`，即使原始 Claude 後端引數指定另一個模式也是如此。

如果你想要更保守的設定，請將 OpenClaw exec 政策收緊回
`allowlist` / `on-miss` 或 `deny`。

### 持久性閘道主機「永不提示」設定

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

該本機捷徑會同時更新：

- 本機 `tools.exec.host/security/ask`。
- 本機核准檔預設值，包括 `askFallback: "full"`。

它刻意僅限本機。若要遠端變更閘道主機或節點主機核准，請使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

### 節點主機

對於節點主機，請改為在該節點套用相同核准檔：

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
- 節點 exec 核准會在執行階段從節點擷取，因此以節點為目標的更新必須使用 `openclaw approvals --node ...`。

</Note>

### 僅限工作階段的捷徑

- `/exec security=full ask=off` 只會變更目前工作階段。
- `/elevated full` 是一個緊急捷徑，只有在要求的政策和主機核准檔都解析為
  `security: "full"` 和 `ask: "off"` 時，才會略過執行核准。較嚴格的主機檔案，例如
  `ask: "always"`，仍會提示。

如果主機核准檔仍比設定更嚴格，較嚴格的主機
政策仍然優先。

## 允許清單（每個代理程式）

允許清單是**每個代理程式**各自獨立的。如果有多個代理程式，請在 macOS 應用程式中切換正在
編輯的代理程式。模式是 glob 比對。

模式可以是已解析的二進位檔路徑 glob，或裸命令名稱 glob。
裸名稱只會比對透過 `PATH` 呼叫的命令，因此當命令是 `rg` 時，`rg` 可以比對
`/opt/homebrew/bin/rg`，但**不會**比對 `./rg` 或
`/tmp/rg`。如果你想信任某個特定二進位檔
位置，請使用路徑 glob。

舊版 `agents.default` 項目會在載入時遷移到 `agents.main`。
像 `echo ok && pwd` 這樣的 shell 鏈仍需要每個最上層片段
都符合允許清單規則。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制引數

當允許清單項目應比對二進位檔和特定引數形狀時，加入 `argPattern`。OpenClaw 會針對解析後的命令引數評估正規表示式，並排除可執行檔權杖
(`argv[0]`)。對於手動撰寫的項目，引數會以單一空格串接，因此需要精確比對時，請錨定模式。

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

該項目允許 `python3 safe.py`；`python3 other.py` 會是允許清單
未命中。如果同一個二進位檔也有只含路徑的項目，未比對的
引數仍可能回退到該只含路徑的項目。若目標是將二進位檔限制為宣告的引數，請省略只含路徑的
項目。

核准流程儲存的項目可以使用內部分隔符格式來進行
精確 argv 比對。建議使用 UI 或核准流程重新產生這些
項目，而不是手動編輯編碼後的值。如果 OpenClaw 無法
解析命令片段的 argv，含有 `argPattern` 的項目不會比對。

每個允許清單項目都支援：

| 欄位               | 含義                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二進位檔路徑 glob 或裸命令名稱 glob           |
| `argPattern`       | 可選的 argv 正規表示式；省略時項目只比對路徑            |
| `id`               | 用於 UI 識別的穩定 UUID                              |
| `source`           | 項目來源，例如 `allow-always`                          |
| `commandText`      | 核准流程建立項目時擷取的命令文字 |
| `lastUsedAt`       | 上次使用時間戳                                           |
| `lastUsedCommand`  | 上次比對的命令                                     |
| `lastResolvedPath` | 上次解析的二進位檔路徑                                     |

## 自動允許技能命令列介面

啟用**自動允許技能命令列介面**時，已知技能所參照的可執行檔會在節點（macOS 節點或無介面
節點主機）上視為已列入允許清單。這會透過 Gateway RPC 使用 `skills.bins` 擷取
技能 bin 清單。如果你想要嚴格手動允許清單，請停用此功能。

<Warning>
- 這是**隱含的便利允許清單**，與手動路徑允許清單項目分開。
- 它適用於 Gateway 和節點位於同一信任邊界內的受信任操作者環境。
- 如果你需要嚴格明確的信任，請保持 `autoAllowSkills: false`，並且只使用手動路徑允許清單項目。

</Warning>

## 安全 bin 與核准轉送

如需安全 bin（僅 stdin 快速路徑）、直譯器繫結詳細資訊，以及
如何將核准提示轉送到 Slack/Discord/Telegram（或將它們作為
原生核准用戶端執行），請參閱
[執行核准 - 進階](/zh-TW/tools/exec-approvals-advanced)。

## Control UI 編輯

使用 **Control UI → 節點 → 執行核准** 卡片來編輯預設值、
每個代理程式覆寫和允許清單。選取範圍（預設值或某個代理程式）、
調整政策、新增/移除允許清單模式，然後按**儲存**。UI
會顯示每個模式的上次使用中繼資料，方便你維持清單整潔。

目標選擇器會選擇 **Gateway**（本機核准）或**節點**。
節點必須公告 `system.execApprovals.get/set`（macOS 應用程式或
無介面節點主機）。如果節點尚未公告執行核准，
請直接編輯其本機核准檔。

命令列介面：`openclaw approvals` 支援 Gateway 或節點編輯 - 請參閱
[核准命令列介面](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，閘道會向操作者用戶端廣播
`exec.approval.requested`。Control UI 和 macOS
應用程式會透過 `exec.approval.resolve` 解析它，然後閘道將
已核准的要求轉送到節點主機。

對於 `host=node`，核准要求會包含標準 `systemRunPlan`
酬載。閘道會在轉送已核准的 `system.run`
要求時，將該計畫作為權威的
command/cwd/session 情境。

這對非同步核准延遲很重要：

- 節點執行路徑會預先準備一個標準計畫。
- 核准記錄會儲存該計畫及其繫結中繼資料。
- 一旦核准，最終轉送的 `system.run` 呼叫會重複使用已儲存的計畫，而不是信任後續呼叫者編輯。
- 如果呼叫者在核准要求建立後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，閘道會以核准不相符為由拒絕轉送的執行。

## 系統事件

執行生命週期會以系統訊息呈現：

- `Exec running`（只有在命令超過執行中通知臨界值時）。
- `Exec finished`。

這些訊息會在節點回報事件後張貼到代理程式的工作階段。
被拒絕的執行核准對主機命令本身而言是終止狀態：命令
不會執行。對於具有來源工作階段的主代理程式非同步核准，
OpenClaw 會將拒絕作為內部追蹤訊息張貼回該工作階段，讓
代理程式可以停止等待非同步命令，並避免缺少結果的修復。
如果沒有工作階段或工作階段無法恢復，OpenClaw 仍可
向操作者或直接聊天路由回報簡潔的拒絕。子代理程式
工作階段的拒絕不會張貼回子代理程式。
Gateway 主機執行核准會在命令完成時發出相同的生命週期事件
（以及可選地在執行時間長於臨界值時發出）。
受核准控管的執行會在這些訊息中重複使用核准 ID 作為 `runId`，
方便關聯。

## 拒絕核准行為

當非同步執行核准被拒絕時，OpenClaw 會將主機命令視為
終止且預設拒絕。對於主代理程式工作階段，拒絕會作為
內部工作階段追蹤訊息送達，告訴代理程式非同步命令未執行。
這會保留逐字稿連續性，而不暴露過時的命令輸出。如果
工作階段傳遞不可用，OpenClaw 會在存在安全路由時回退到簡潔的操作者或
直接聊天拒絕。

## 影響

- **`full`** 權限強大；請盡可能優先使用允許清單。
- **`ask`** 讓你保留介入權，同時仍允許快速核准。
- 每個代理程式的允許清單可防止某個代理程式的核准外洩到其他代理程式。
- 核准只適用於來自**已授權傳送者**的主機執行要求。未授權傳送者無法發出 `/exec`。
- `/exec security=full` 是授權操作者的工作階段層級便利功能，並且依設計會略過核准。若要硬性封鎖主機執行，請將核准安全性設為 `deny`，或透過工具政策拒絕 `exec` 工具。

## 相關

<CardGroup cols={2}>
  <Card title="執行核准 - 進階" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全 bin、直譯器繫結，以及將核准轉送到聊天。
  </Card>
  <Card title="執行工具" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="提升模式" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    同樣會略過核准的緊急路徑。
  </Card>
  <Card title="沙箱化" href="/zh-TW/gateway/sandboxing" icon="box">
    沙箱模式和工作區存取。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="lock">
    安全模型與強化。
  </Card>
  <Card title="沙箱與工具政策與提升模式" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何時使用各項控制。
  </Card>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="sparkles">
    由 Skill 支援的自動允許行為。
  </Card>
</CardGroup>
