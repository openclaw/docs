---
read_when:
    - 設定 exec 核准或允許清單
    - 在 macOS 應用程式中實作 exec 核准使用者體驗
    - 審查沙盒逃逸提示及其影響
sidebarTitle: Exec approvals
summary: 主機執行核准：政策控制項、允許清單，以及 YOLO/嚴格工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-05-11T20:36:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 核准是**配套 app / node 主機護欄**，用來允許
沙箱化代理程式在真實主機（`gateway` 或 `node`）上執行命令。一個
安全互鎖機制：只有在政策 + 允許清單 +
（可選）使用者核准全部同意時，命令才會被允許。Exec 核准會疊加在
工具政策與提升權限閘控**之上**（除非提升權限設為 `full`，此時會
跳過核准）。

<Note>
有效政策是 `tools.exec.*` 與核准預設值中**較嚴格**者；如果省略某個核准欄位，則會
使用 `tools.exec` 的值。主機 exec 也會使用該機器上的本機核准狀態 - 
在 `~/.openclaw/exec-approvals.json` 中的主機本機 `ask: "always"` 會持續
提示，即使工作階段或設定預設值要求 `ask: "on-miss"` 也是如此。
</Note>

## 檢查有效政策

| 命令                                                             | 顯示內容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的政策、主機政策來源，以及有效結果。                                               |
| `openclaw exec-policy show`                                      | 本機合併檢視。                                                                         |
| `openclaw exec-policy set` / `preset`                            | 一步同步本機要求的政策與本機主機核准檔案。                                             |

當本機範圍要求 `host=node` 時，`exec-policy show` 會將該
範圍報告為執行階段由 node 管理，而不是假裝本機
核准檔案是真實來源。

如果配套 app UI **不可用**，任何通常會
提示的要求都會由 **ask fallback** 解析（預設：`deny`）。

<Tip>
原生聊天核准用戶端可以在待處理核准訊息上植入特定頻道的操作方式。
例如，Matrix 會植入反應捷徑
（`✅` 允許一次、`❌` 拒絕、`♾️` 永遠允許），同時仍在訊息中保留
`/approve ...` 命令作為後援。
</Tip>

## 適用位置

Exec 核准會在執行主機上於本機強制執行：

- **Gateway 主機** → gateway 機器上的 `openclaw` 程序。
- **Node 主機** → node runner（macOS 配套 app 或無頭 node 主機）。

### 信任模型

- 通過 Gateway 驗證的呼叫者會被視為該 Gateway 的受信任操作員。
- 已配對的 node 會將該受信任操作員能力延伸到 node 主機。
- Exec 核准會降低意外執行風險，但**不是**每位使用者的驗證邊界或檔案系統唯讀政策。
- 一旦核准，命令可以依照所選主機或沙箱檔案系統權限變更檔案。
- 已核准的 node 主機執行會繫結標準執行環境：標準 cwd、精確 argv、存在時的 env 繫結，以及適用時固定的可執行檔路徑。
- 對於 shell 指令碼和直接的直譯器/執行階段檔案呼叫，OpenClaw 也會嘗試繫結一個具體的本機檔案運算元。如果該繫結檔案在核准後但執行前變更，該執行會被拒絕，而不是執行已漂移的內容。
- 檔案繫結刻意採最佳努力，**不是**每個直譯器/執行階段載入器路徑的完整語意模型。如果核准模式無法精確識別一個具體本機檔案來繫結，它會拒絕鑄造由核准支援的執行，而不是假裝有完整覆蓋。

### macOS 分離

- **node 主機服務**會透過本機 IPC 將 `system.run` 轉送到 **macOS app**。
- **macOS app** 會強制執行核准，並在 UI 環境中執行命令。

## 設定與儲存

核准會存放在執行主機上的本機 JSON 檔案中：

```text
~/.openclaw/exec-approvals.json
```

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

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 封鎖所有主機 exec 要求。
  - `allowlist` - 只允許允許清單中的命令。
  - `full` - 允許所有內容（等同於提升權限）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - 永不提示。
  - `on-miss` - 只有在允許清單不符合時才提示。
  - `always` - 每個命令都提示。當有效 ask 模式為 `always` 時，`allow-always` 持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但無法連上 UI 時的解析方式。

- `deny` - 封鎖。
- `allowlist` - 只有在符合允許清單時才允許。
- `full` - 允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  當為 `true` 時，即使直譯器二進位檔本身在允許清單中，OpenClaw 也會將 inline code-eval 形式視為僅限核准。
  這是針對無法乾淨對應到單一穩定檔案
  運算元的直譯器載入器的縱深防禦。
</ParamField>

嚴格模式會捕捉的範例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在嚴格模式中，這些命令仍需要明確核准，而且
`allow-always` 不會自動為它們持久化新的允許清單項目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  僅控制 exec 核准提示中的呈現。啟用時，
  OpenClaw 可能會附加由剖析器衍生的命令區段，讓 Web 核准
  提示可以醒目提示命令 token。將其設為 `true` 以啟用
  命令文字醒目提示。
</ParamField>

這項設定**不會**變更 `security`、`ask`、允許清單比對、
嚴格 inline-eval 行為、核准轉送或命令執行。
可以在 `tools.exec.commandHighlighting` 下全域設定，或在每個
代理程式的 `agents.list[].tools.exec.commandHighlighting` 下設定。

## YOLO 模式（無需核准）

如果你希望主機 exec 不出現核准提示就執行，必須打開
**兩個**政策層 - OpenClaw 設定中的要求 exec 政策
（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中的主機本機核准政策。

除非你明確收緊，否則 YOLO 是預設主機行為：

| 層                    | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要區別：**

- `tools.exec.host=auto` 會選擇 exec 在**哪裡**執行：有沙箱時在沙箱，否則在 gateway。
- YOLO 會選擇主機 exec **如何**核准：`security=full` 加上 `ask=off`。
- 在 YOLO 模式中，OpenClaw **不會**在設定的主機 exec 政策之上，加入額外的啟發式命令混淆核准閘門或指令碼預檢拒絕層。
- `auto` 不會讓 gateway 路由成為沙箱化工作階段中的免費覆寫。從 `auto` 可允許每次呼叫的 `host=node` 要求；只有在沒有作用中的沙箱執行階段時，`auto` 才允許 `host=gateway`。若要使用穩定的非 auto 預設值，請設定 `tools.exec.host`，或明確使用 `/exec host=...`。

</Warning>

公開自身非互動式權限模式的 CLI 後端提供者
可以遵循此政策。當 OpenClaw 要求的 exec
政策為 YOLO 時，Claude CLI 會加入
`--permission-mode bypassPermissions`。可用
`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下的明確 Claude 引數
覆寫該後端行為 - 例如 `--permission-mode default`、`acceptEdits` 或
`bypassPermissions`。

如果你想要更保守的設定，請將任一層收緊回
`allowlist` / `on-miss` 或 `deny`。

### 持久 gateway 主機「永不提示」設定

<Steps>
  <Step title="設定要求的組態政策">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="比對主機核准檔案">
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
- 本機 `~/.openclaw/exec-approvals.json` 預設值。

它刻意僅限本機。若要遠端變更 gateway 主機或 node 主機
核准，請使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

### Node 主機

對於 node 主機，請改在該 node 上套用相同的核准檔案：

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

- `openclaw exec-policy` 不會同步 node 核准。
- `openclaw exec-policy set --host node` 會被拒絕。
- Node exec 核准會在執行階段從 node 擷取，因此針對 node 的更新必須使用 `openclaw approvals --node ...`。

</Note>

### 僅限工作階段的捷徑

- `/exec security=full ask=off` 只會變更目前工作階段。
- `/elevated full` 是 break-glass 捷徑，也會為該工作階段跳過 exec 核准。

如果主機核准檔案仍比設定更嚴格，較嚴格的主機
政策仍會勝出。

## 允許清單（每個代理程式）

允許清單是**每個代理程式**各自獨立的。如果存在多個代理程式，請在 macOS app 中切換你正在編輯的代理程式。模式是 glob 比對。

模式可以是已解析的二進位路徑 glob，或裸命令名稱 glob。
裸名稱只會比對透過 `PATH` 呼叫的命令，因此當命令是 `rg` 時，`rg` 可以比對
`/opt/homebrew/bin/rg`，但**不能**比對 `./rg` 或
`/tmp/rg`。當你想信任某個特定二進位檔位置時，請使用路徑 glob。

舊版 `agents.default` 項目會在載入時遷移到 `agents.main`。
像 `echo ok && pwd` 這樣的 shell 鏈，仍需要每個頂層區段
都滿足允許清單規則。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制引數

當允許清單項目應比對某個二進位檔與特定引數形狀時，加入 `argPattern`。
OpenClaw 會根據剖析後的命令引數評估正規表示式，排除可執行檔 token
（`argv[0]`）。對於手寫項目，引數會以單一空格串接，因此當你需要精確比對時，請錨定該模式。

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

該項目允許 `python3 safe.py`；`python3 other.py` 是允許清單
未命中。如果同一個二進位檔也存在僅限路徑的項目，未比對的
引數仍可退回到該僅限路徑項目。若目標是將該二進位檔限制為宣告的引數，
請省略僅限路徑項目。

核准流程儲存的項目可以使用內部分隔符格式，以進行
精確的 argv 比對。請優先透過 UI 或核准流程重新產生這些
項目，而不是手動編輯編碼後的值。如果 OpenClaw 無法剖析
命令片段的 argv，含有 `argPattern` 的項目就不會相符。

每個允許清單項目支援：

| 欄位               | 意義                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二進位路徑 glob，或裸命令名稱 glob                   |
| `argPattern`       | 選用 argv regex；省略的項目僅依路徑比對                      |
| `id`               | 用於 UI 身分識別的穩定 UUID                                  |
| `source`           | 項目來源，例如 `allow-always`                                |
| `commandText`      | 核准流程建立項目時擷取的命令文字                             |
| `lastUsedAt`       | 上次使用時間戳                                                |
| `lastUsedCommand`  | 上次相符的命令                                                |
| `lastResolvedPath` | 上次解析出的二進位路徑                                        |

## 自動允許 Skills CLI

啟用 **自動允許 Skills CLI** 時，已知 Skills 參照的可執行檔會在 Node（macOS Node 或無介面 Node 主機）上被視為已列入允許清單。這會透過 Gateway RPC 使用 `skills.bins` 擷取 Skill bin 清單。如果你想要嚴格的手動允許清單，請停用此功能。

<Warning>
- 這是一個**隱含的便利允許清單**，與手動路徑允許清單項目分開。
- 它適用於 Gateway 與 Node 位於相同信任邊界內的受信任操作員環境。
- 如果你需要嚴格的明確信任，請維持 `autoAllowSkills: false`，並僅使用手動路徑允許清單項目。

</Warning>

## 安全 bin 與核准轉送

若要了解安全 bin（僅 stdin 的快速路徑）、直譯器繫結細節，以及如何將核准提示轉送到 Slack/Discord/Telegram（或將它們作為原生核准用戶端執行），請參閱
[Exec 核准 - 進階](/zh-TW/tools/exec-approvals-advanced)。

## Control UI 編輯

使用 **Control UI → Nodes → Exec approvals** 卡片來編輯預設值、各 agent 覆寫與允許清單。選擇範圍（預設值或某個 agent）、調整政策、新增/移除允許清單模式，然後按 **Save**。UI 會顯示每個模式的上次使用中繼資料，方便你維持清單整潔。

目標選擇器會選擇 **Gateway**（本機核准）或 **Node**。Node 必須通告 `system.execApprovals.get/set`（macOS app 或無介面 Node 主機）。如果 Node 尚未通告 exec 核准，請直接編輯其本機 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支援 Gateway 或 Node 編輯 - 請參閱
[核准 CLI](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，Gateway 會向操作員用戶端廣播
`exec.approval.requested`。Control UI 與 macOS app 會透過 `exec.approval.resolve` 解析它，然後 Gateway 會將已核准的請求轉送給 Node 主機。

對於 `host=node`，核准請求會包含標準的 `systemRunPlan`
payload。Gateway 會在轉送已核准的 `system.run`
請求時，將該計畫作為命令/cwd/工作階段內容的權威來源。

這對非同步核准延遲很重要：

- Node exec 路徑會預先準備一個標準計畫。
- 核准記錄會儲存該計畫及其繫結中繼資料。
- 核准後，最終轉送的 `system.run` 呼叫會重複使用已儲存的計畫，而不是信任後續呼叫者的編輯。
- 如果呼叫者在核准請求建立後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 會將轉送的執行拒絕為核准不符。

## 系統事件

Exec 生命週期會以系統訊息呈現：

- `Exec running`（僅在命令超過執行通知門檻時）。
- `Exec finished`。
- `Exec denied`。

這些訊息會在 Node 回報事件後發布到 agent 的工作階段。
Gateway 主機 exec 核准會在命令完成時發出相同的生命週期事件（若執行時間超過門檻，也可選擇在執行中發出）。
受核准控管的 exec 會在這些訊息中重複使用核准 id 作為 `runId`，方便關聯。

## 核准遭拒行為

當非同步 exec 核准遭拒時，OpenClaw 會防止 agent 在該工作階段中重複使用同一命令任何先前執行的輸出。
拒絕原因會連同明確指引一併傳遞，指出沒有可用的命令輸出，這會阻止 agent 宣稱有新的輸出，或用先前成功執行的過期結果重複遭拒的命令。

## 影響

- **`full`** 很強大；可行時請優先使用允許清單。
- **`ask`** 讓你保持在流程中，同時仍允許快速核准。
- 各 agent 的允許清單可防止某個 agent 的核准洩漏到其他 agent。
- 核准僅套用於來自**已授權傳送者**的主機 exec 請求。未授權的傳送者無法發出 `/exec`。
- `/exec security=full` 是供已授權操作員使用的工作階段層級便利功能，依設計會略過核准。若要硬性封鎖主機 exec，請將核准安全性設為 `deny`，或透過工具政策拒絕 `exec` 工具。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 核准 - 進階" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全 bin、直譯器繫結，以及將核准轉送到聊天。
  </Card>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="提權模式" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    也會略過核准的緊急通道。
  </Card>
  <Card title="沙箱化" href="/zh-TW/gateway/sandboxing" icon="box">
    沙箱模式與工作區存取。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="lock">
    安全模型與強化。
  </Card>
  <Card title="沙箱與工具政策與提權" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何時使用各項控制。
  </Card>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="sparkles">
    由 Skills 支援的自動允許行為。
  </Card>
</CardGroup>
