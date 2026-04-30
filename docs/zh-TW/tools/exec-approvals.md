---
read_when:
    - 設定 exec 核准或允許清單
    - 在 macOS 應用程式中實作 exec 核准使用者體驗
    - 審查沙盒逃逸提示及其影響
sidebarTitle: Exec approvals
summary: 主機執行核准：政策控制項、允許清單，以及 YOLO/strict 工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-04-30T03:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 核准是**配套應用程式 / node 主機防護機制**，用來允許
沙盒化代理在真實主機（`gateway` 或 `node`）上執行命令。這是一個
安全互鎖：只有在政策 + 允許清單 +（選用）使用者核准都同意時，命令才會被允許。Exec 核准會疊加在
工具政策與提升權限閘控**之上**（除非提升權限設為 `full`，此時會略過核准）。

<Note>
有效政策是 `tools.exec.*` 與核准
預設值中**較嚴格**者；如果省略某個核准欄位，則會使用
`tools.exec` 值。Host exec 也會使用該機器上的本機核准狀態 — 
`~/.openclaw/exec-approvals.json` 中的主機本機 `ask: "always"` 會持續
提示，即使工作階段或設定預設值要求 `ask: "on-miss"` 也一樣。
</Note>

## 檢查有效政策

| 命令                                                             | 顯示內容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的政策、主機政策來源，以及有效結果。                                               |
| `openclaw exec-policy show`                                      | 本機合併後的檢視。                                                                     |
| `openclaw exec-policy set` / `preset`                            | 一次同步本機要求的政策與本機主機核准檔案。                                             |

當本機範圍要求 `host=node` 時，`exec-policy show` 會回報該
範圍在執行階段由 node 管理，而不是假裝本機
核准檔案是真實來源。

如果配套應用程式 UI **不可用**，任何通常會
提示的要求都會由 **ask fallback** 解析（預設：`deny`）。

<Tip>
原生聊天核准用戶端可以在待處理核准訊息上植入特定頻道的操作捷徑。例如，Matrix 會植入反應捷徑
（`✅` 允許一次、`❌` 拒絕、`♾️` 永久允許），同時仍在訊息中保留
`/approve ...` 命令作為備用方式。
</Tip>

## 適用範圍

Exec 核准會在執行主機上本機強制執行：

- **Gateway 主機** → gateway 機器上的 `openclaw` 程序。
- **Node 主機** → node runner（macOS 配套應用程式或無介面 node 主機）。

### 信任模型

- 經 Gateway 驗證的呼叫者是該 Gateway 的受信任操作者。
- 已配對的 nodes 會把該受信任操作者能力延伸到 node 主機。
- Exec 核准會降低意外執行風險，但**不是**每位使用者各自的驗證邊界。
- 已核准的 node 主機執行會綁定標準執行內容：標準 cwd、精確 argv、存在時的 env 綁定，以及適用時釘選的可執行檔路徑。
- 對於 shell 指令碼與直接的直譯器/runtime 檔案叫用，OpenClaw 也會嘗試綁定一個具體的本機檔案運算元。如果該綁定檔案在核准後、執行前變更，這次執行會被拒絕，而不是執行已漂移的內容。
- 檔案綁定刻意採取 best-effort，**不是**每個直譯器/runtime 載入器路徑的完整語意模型。如果核准模式無法精確識別一個要綁定的具體本機檔案，它會拒絕鑄造由核准背書的執行，而不是假裝已完整涵蓋。

### macOS 分流

- **node 主機服務**會透過本機 IPC 將 `system.run` 轉送到 **macOS app**。
- **macOS app** 會強制執行核准，並在 UI 內容中執行命令。

## 設定與儲存

核准存放在執行主機上的本機 JSON 檔案：

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
  - `deny` — 封鎖所有 host exec 要求。
  - `allowlist` — 只允許允許清單中的命令。
  - `full` — 允許所有內容（等同於提升權限）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — 永不提示。
  - `on-miss` — 只有在允許清單不符合時才提示。
  - `always` — 每個命令都提示。當有效 ask 模式為 `always` 時，`allow-always` 的持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但無法連到 UI 時的解析方式。

- `deny` — 封鎖。
- `allowlist` — 只有在允許清單符合時允許。
- `full` — 允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  當為 `true` 時，OpenClaw 會將 inline code-eval 形式視為只能透過核准，
  即使直譯器二進位檔本身已列入允許清單。這是針對無法乾淨對應到單一穩定檔案
  運算元的直譯器載入器所做的縱深防禦。
</ParamField>

嚴格模式會捕捉的範例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在嚴格模式下，這些命令仍需要明確核准，而且
`allow-always` 不會自動為它們持久保存新的允許清單項目。

## YOLO 模式（無核准）

如果你希望 host exec 在沒有核准提示的情況下執行，必須開啟
**兩個**政策層 — OpenClaw 設定中的要求 exec 政策
（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中的主機本機核准政策。

除非你明確收緊，否則 YOLO 是預設主機行為：

| 層級                  | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上為 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要區別：**

- `tools.exec.host=auto` 會選擇 exec 在**哪裡**執行：可用時在沙盒，否則在 gateway。
- YOLO 會選擇 host exec **如何**被核准：`security=full` 加上 `ask=off`。
- 在 YOLO 模式中，OpenClaw **不會**在已設定的 host exec 政策之上另外加入獨立的啟發式命令混淆核准閘，或指令碼預檢拒絕層。
- `auto` 不會讓 gateway 路由成為來自沙盒化工作階段的自由覆寫。從 `auto` 可以允許每次呼叫的 `host=node` 要求；只有在沒有作用中的沙盒 runtime 時，才會從 `auto` 允許 `host=gateway`。若要穩定的非 auto 預設值，請設定 `tools.exec.host` 或明確使用 `/exec host=...`。

</Warning>

暴露自身非互動式權限模式的 CLI 支援 providers 可以遵循此政策。當 OpenClaw 要求的 exec
政策是 YOLO 時，Claude CLI 會加入
`--permission-mode bypassPermissions`。可在
`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 之下使用明確的 Claude args
覆寫該後端行為 — 例如 `--permission-mode default`、`acceptEdits` 或
`bypassPermissions`。

如果你想要更保守的設定，請將任一層收緊回
`allowlist` / `on-miss` 或 `deny`。

### 持久的 Gateway 主機「永不提示」設定

<Steps>
  <Step title="設定要求的 config 政策">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="匹配主機核准檔案">
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

它刻意只適用於本機。若要遠端變更 gateway 主機或 node 主機
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
- `/elevated full` 是 break-glass 捷徑，也會略過該工作階段的 exec 核准。

如果主機核准檔案仍比 config 更嚴格，較嚴格的主機
政策仍會勝出。

## 允許清單（每個代理）

允許清單是**每個代理**各自獨立的。如果存在多個代理，請在 macOS app 中切換你正在編輯的代理。模式是 glob 符合。

模式可以是已解析的二進位檔路徑 glob，也可以是不含路徑的命令名稱 glob。
不含路徑的名稱只會符合透過 `PATH` 叫用的命令，因此當命令為 `rg` 時，`rg` 可以符合
`/opt/homebrew/bin/rg`，但**不能**符合 `./rg` 或
`/tmp/rg`。如果你想信任某個特定二進位檔位置，請使用路徑 glob。

舊版 `agents.default` 項目會在載入時遷移到 `agents.main`。
像 `echo ok && pwd` 這樣的 shell 鏈仍需要每個頂層片段
都滿足允許清單規則。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每個允許清單項目會追蹤：

| 欄位               | 意義                             |
| ------------------ | -------------------------------- |
| `id`               | 用於 UI 身分識別的穩定 UUID      |
| `lastUsedAt`       | 上次使用時間戳記                 |
| `lastUsedCommand`  | 上次符合的命令                   |
| `lastResolvedPath` | 上次解析的二進位檔路徑           |

## 自動允許 skill CLIs

當啟用 **Auto-allow skill CLIs** 時，已知 skills 參照的可執行檔會在 nodes（macOS node 或無介面
node 主機）上被視為允許清單項目。這會透過 Gateway RPC 使用 `skills.bins` 來擷取
skill bin 清單。如果你想要嚴格的手動允許清單，請停用此功能。

<Warning>
- 這是**隱含的便利允許清單**，與手動路徑允許清單項目分開。
- 它適用於 Gateway 與 node 位於相同信任邊界的受信任操作者環境。
- 如果你需要嚴格的明確信任，請保留 `autoAllowSkills: false`，並只使用手動路徑允許清單項目。

</Warning>

## 安全 bins 與核准轉送

如需安全 bins（僅限 stdin 的 fast-path）、直譯器綁定細節，以及
如何將核准提示轉送到 Slack/Discord/Telegram（或將它們作為
原生核准用戶端執行），請參閱
[Exec 核准 — 進階](/zh-TW/tools/exec-approvals-advanced)。

## Control UI 編輯

使用 **Control UI → Nodes → Exec approvals** 卡片來編輯預設值、
每個代理的覆寫，以及允許清單。選擇範圍（Defaults 或代理）、
調整政策、新增/移除允許清單模式，然後按 **Save**。UI
會顯示每個模式的上次使用中繼資料，讓你能保持清單整潔。

目標選擇器會選擇 **Gateway**（本機核准）或 **Node**。
Node 必須宣告 `system.execApprovals.get/set`（macOS app 或
headless node host）。如果 node 尚未宣告 exec 核准，
請直接編輯其本機的 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支援編輯 gateway 或 node，請參閱
[核准 CLI](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，gateway 會向操作員用戶端廣播
`exec.approval.requested`。Control UI 和 macOS
app 會透過 `exec.approval.resolve` 解決它，然後 gateway 會將
已核准的請求轉送給 node host。

對於 `host=node`，核准請求會包含標準的 `systemRunPlan`
酬載。gateway 在轉送已核准的 `system.run`
請求時，會將該 plan 作為具權威性的
command/cwd/session 情境。

這對非同步核准延遲很重要：

- node exec 路徑會預先準備一個標準 plan。
- 核准記錄會儲存該 plan 及其繫結中繼資料。
- 一旦核准，最後轉送的 `system.run` 呼叫會重用已儲存的 plan，而不是信任稍後呼叫端的編輯。
- 如果呼叫端在核准請求建立後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，gateway 會將轉送的執行拒絕為核准不相符。

## 系統事件

Exec 生命週期會以系統訊息顯示：

- `Exec running`（僅在命令超過執行中通知門檻時）。
- `Exec finished`。
- `Exec denied`。

這些訊息會在 node 回報事件後發布到 agent 的工作階段。
當命令完成時，Gateway-host exec 核准會發出相同的生命週期事件
（並且可選擇在執行時間超過門檻時發出）。
受核准控管的 exec 會在這些訊息中重用核准 id 作為 `runId`，
方便關聯。

## 核准遭拒行為

當非同步 exec 核准遭拒時，OpenClaw 會防止 agent
重用同一工作階段中相同命令先前任何執行的輸出。
拒絕原因會附上明確指引，說明沒有可用的命令輸出，
這會阻止 agent 聲稱有新的輸出，或以先前成功執行的舊結果
重複遭拒的命令。

## 影響

- **`full`** 功能強大；可行時請優先使用允許清單。
- **`ask`** 讓你保持參與，同時仍允許快速核准。
- 個別 agent 的允許清單可防止某個 agent 的核准洩漏到其他 agent。
- 核准只適用於來自**授權傳送者**的 host exec 請求。未授權傳送者無法發出 `/exec`。
- `/exec security=full` 是授權操作員的工作階段層級便利功能，且設計上會略過核准。若要硬性封鎖 host exec，請將核准安全性設為 `deny`，或透過 tool policy 拒絕 `exec` 工具。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 核准 — 進階" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全 bins、直譯器繫結，以及將核准轉送到聊天。
  </Card>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="提升權限模式" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    同樣會略過核准的緊急繞行路徑。
  </Card>
  <Card title="沙箱化" href="/zh-TW/gateway/sandboxing" icon="box">
    沙箱模式與工作區存取。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="lock">
    安全模型與強化。
  </Card>
  <Card title="沙箱與 tool policy 與 elevated 的比較" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何時使用各種控制項。
  </Card>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="sparkles">
    Skill 支援的自動允許行為。
  </Card>
</CardGroup>
