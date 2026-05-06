---
read_when:
    - 設定 exec 核准或允許清單
    - 在 macOS 應用程式中實作 exec 核准使用者體驗
    - 審閱沙盒逃逸提示及其影響
sidebarTitle: Exec approvals
summary: 主機執行核准：政策調整選項、允許清單，以及 YOLO/嚴格工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-05-06T09:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 核准是**配套 App / Node 主機防護機制**，用於讓沙盒化代理在真實主機（`gateway` 或 `node`）上執行命令。一個安全聯鎖機制：只有在政策 + 允許清單 +（選用）使用者核准全都一致同意時，才允許命令執行。Exec 核准會疊加在工具政策與提升權限閘控**之上**（除非 elevated 設為 `full`，這會略過核准）。

<Note>
有效政策是 `tools.exec.*` 與核准預設值中**較嚴格**的一方；如果省略某個核准欄位，會使用 `tools.exec` 的值。主機 exec 也會使用該機器上的本機核准狀態 - `~/.openclaw/exec-approvals.json` 中主機本機的 `ask: "always"`，即使工作階段或設定預設要求 `ask: "on-miss"`，仍會持續提示。
</Note>

## 檢查有效政策

| 命令                                                             | 顯示內容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的政策、主機政策來源，以及有效結果。                                               |
| `openclaw exec-policy show`                                      | 本機合併檢視。                                                                         |
| `openclaw exec-policy set` / `preset`                            | 一次同步本機要求的政策與本機主機核准檔案。                                             |

當本機範圍要求 `host=node` 時，`exec-policy show` 會將該範圍回報為執行階段由 Node 管理，而不是假裝本機核准檔案就是事實來源。

如果配套 App UI **不可用**，任何通常會提示的要求都會由 **ask 後援**解析（預設：`deny`）。

<Tip>
原生聊天核准用戶端可以在待處理核准訊息上植入特定頻道的便利用法。例如，Matrix 會植入反應捷徑（`✅` 允許一次、`❌` 拒絕、`♾️` 永遠允許），同時仍在訊息中保留 `/approve ...` 命令作為後援。
</Tip>

## 適用位置

Exec 核准會在執行主機本機強制執行：

- **Gateway 主機** → Gateway 機器上的 `openclaw` 程序。
- **Node 主機** → Node 執行器（macOS 配套 App 或無頭 Node 主機）。

### 信任模型

- Gateway 驗證的呼叫者是該 Gateway 的受信任操作者。
- 已配對的 Node 會將該受信任操作者能力延伸到 Node 主機。
- Exec 核准可降低意外執行風險，但**不是**每位使用者的驗證邊界。
- 已核准的 Node 主機執行會綁定標準執行內容：標準 cwd、精確 argv、存在時的 env 綁定，以及適用時釘選的可執行檔路徑。
- 對於 shell 指令碼與直接的直譯器/執行階段檔案呼叫，OpenClaw 也會嘗試綁定一個具體的本機檔案運算元。如果該綁定檔案在核准後、執行前發生變更，該次執行會被拒絕，而不是執行已漂移的內容。
- 檔案綁定刻意採取最佳努力，**不是**每個直譯器/執行階段載入器路徑的完整語意模型。如果核准模式無法識別出剛好一個要綁定的具體本機檔案，它會拒絕簽發由核准支援的執行，而不是假裝有完整涵蓋。

### macOS 分流

- **Node 主機服務**會透過本機 IPC 將 `system.run` 轉送到 **macOS App**。
- **macOS App**會強制執行核准，並在 UI 內容中執行命令。

## 設定與儲存

核准資料位於執行主機上的本機 JSON 檔案：

```text
~/.openclaw/exec-approvals.json
```

結構範例：

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
  - `full` - 允許所有內容（等同於 elevated）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - 永不提示。
  - `on-miss` - 只有允許清單不相符時才提示。
  - `always` - 每個命令都提示。當有效 ask 模式為 `always` 時，`allow-always` 的持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但無法觸及 UI 時的解析方式。

- `deny` - 封鎖。
- `allowlist` - 只有允許清單相符時才允許。
- `full` - 允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  當為 `true` 時，OpenClaw 會將內嵌程式碼 eval 形式視為只能透過核准執行，即使直譯器二進位檔本身已在允許清單中。這是針對無法乾淨對應到一個穩定檔案運算元的直譯器載入器所做的縱深防禦。
</ParamField>

strict 模式會攔截的範例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在 strict 模式中，這些命令仍需要明確核准，而且 `allow-always` 不會自動為它們保留新的允許清單項目。

## YOLO 模式（無需核准）

如果你想讓主機 exec 不經核准提示即可執行，必須開放**兩個**政策層 - OpenClaw 設定中的要求 exec 政策（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中的主機本機核准政策。

除非你明確收緊，否則 YOLO 是預設主機行為：

| 層級                  | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上為 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要區別：**

- `tools.exec.host=auto` 會選擇 exec 在**哪裡**執行：可用時使用沙盒，否則使用 Gateway。
- YOLO 會選擇主機 exec **如何**獲得核准：`security=full` 加上 `ask=off`。
- 在 YOLO 模式中，OpenClaw **不會**在已設定的主機 exec 政策之上，另外加入啟發式命令混淆核准閘或指令碼預檢拒絕層。
- `auto` 不會讓 Gateway 路由成為沙盒化工作階段可自由覆寫的選項。從 `auto` 允許每次呼叫的 `host=node` 要求；只有在沒有沙盒執行階段啟用時，才允許從 `auto` 使用 `host=gateway`。若要穩定的非 auto 預設值，請設定 `tools.exec.host`，或明確使用 `/exec host=...`。

</Warning>

公開自身非互動式權限模式的 CLI 後端提供者可以遵循此政策。當 OpenClaw 要求的 exec 政策為 YOLO 時，Claude CLI 會加入 `--permission-mode bypassPermissions`。可在 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下使用明確的 Claude 引數覆寫該後端行為 - 例如 `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。

如果你想要更保守的設定，請將任一層收緊回 `allowlist` / `on-miss` 或 `deny`。

### 持久 Gateway 主機「永不提示」設定

<Steps>
  <Step title="設定要求的 config 政策">
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

它刻意僅限本機。若要遠端變更 Gateway 主機或 Node 主機核准，請使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

### Node 主機

對於 Node 主機，請改為在該 Node 上套用相同的核准檔案：

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

- `openclaw exec-policy` 不會同步 Node 核准。
- `openclaw exec-policy set --host node` 會被拒絕。
- Node exec 核准會在執行階段從 Node 擷取，因此針對 Node 的更新必須使用 `openclaw approvals --node ...`。

</Note>

### 僅限工作階段的捷徑

- `/exec security=full ask=off` 只會變更目前工作階段。
- `/elevated full` 是一個緊急捷徑，也會在該工作階段略過 exec 核准。

如果主機核准檔案仍比設定更嚴格，較嚴格的主機政策仍會勝出。

## 允許清單（每個代理）

允許清單是**每個代理**各自獨立的。如果存在多個代理，請在 macOS App 中切換你正在編輯的代理。模式是 glob 比對。

模式可以是解析後的二進位檔路徑 glob，也可以是不含路徑的命令名稱 glob。不含路徑的名稱只會比對透過 `PATH` 呼叫的命令，因此當命令是 `rg` 時，`rg` 可以比對 `/opt/homebrew/bin/rg`，但**不會**比對 `./rg` 或 `/tmp/rg`。當你想信任某個特定二進位檔位置時，請使用路徑 glob。

舊版 `agents.default` 項目會在載入時遷移到 `agents.main`。像 `echo ok && pwd` 這類 shell 鏈仍需要每個頂層區段都符合允許清單規則。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制引數

當允許清單項目應比對二進位檔與特定引數形狀時，請加入 `argPattern`。OpenClaw 會針對剖析後的命令引數評估規則運算式，但排除可執行檔 token（`argv[0]`）。對於手寫項目，引數會以單一空格串接，因此需要精確比對時請錨定模式。

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

該項目允許 `python3 safe.py`；`python3 other.py` 會是允許清單未命中。如果同一個二進位檔也存在只含路徑的項目，未相符的引數仍可退回到該只含路徑的項目。當目標是將二進位檔限制為宣告的引數時，請省略只含路徑的項目。

核准流程儲存的項目可以使用內部分隔符格式進行精確 argv 比對。請優先使用 UI 或核准流程重新產生這些項目，而不是手動編輯編碼值。如果 OpenClaw 無法剖析某個命令區段的 argv，含有 `argPattern` 的項目不會相符。

每個允許清單項目支援：

| 欄位               | 意義                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二進位檔路徑 glob 或裸命令名稱 glob                  |
| `argPattern`       | 選用的 argv regex；省略的項目僅比對路徑                      |
| `id`               | 用於 UI 身分識別的穩定 UUID                                  |
| `source`           | 項目來源，例如 `allow-always`                                |
| `commandText`      | 核准流程建立項目時擷取的命令文字                             |
| `lastUsedAt`       | 上次使用時間戳                                                |
| `lastUsedCommand`  | 上次相符的命令                                                |
| `lastResolvedPath` | 上次解析出的二進位檔路徑                                      |

## 自動允許 Skills CLI

啟用 **自動允許 Skills CLI** 時，已知 Skills 參照的可執行檔會在節點（macOS 節點或無介面節點主機）上被視為列入允許清單。這會透過 Gateway RPC 使用 `skills.bins` 來擷取 Skills bin 清單。如果你想使用嚴格的手動允許清單，請停用此選項。

<Warning>
- 這是**隱含的便利允許清單**，與手動路徑允許清單項目分開。
- 它適用於受信任的操作員環境，其中 Gateway 和節點位於同一個信任邊界內。
- 如果你需要嚴格明確的信任，請保持 `autoAllowSkills: false`，並且只使用手動路徑允許清單項目。

</Warning>

## 安全 bin 與核准轉發

如需安全 bin（僅 stdin 快速路徑）、直譯器繫結詳細資訊，以及如何將核准提示轉發到 Slack/Discord/Telegram（或將它們作為原生核准用戶端執行），請參閱[Exec 核准 - 進階](/zh-TW/tools/exec-approvals-advanced)。

## Control UI 編輯

使用 **Control UI → 節點 → Exec 核准** 卡片來編輯預設值、個別代理覆寫和允許清單。選擇範圍（預設值或某個代理）、調整政策、新增/移除允許清單模式，然後按 **儲存**。UI 會顯示每個模式的上次使用中繼資料，方便你保持清單整潔。

目標選擇器會選擇 **Gateway**（本機核准）或 **Node**。節點必須公告 `system.execApprovals.get/set`（macOS app 或無介面節點主機）。如果某個節點尚未公告 exec 核准，請直接編輯其本機 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支援 Gateway 或節點編輯 - 請參閱[核准 CLI](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，Gateway 會向操作員用戶端廣播 `exec.approval.requested`。Control UI 和 macOS app 會透過 `exec.approval.resolve` 解析它，然後 Gateway 會將已核准的請求轉發給節點主機。

對於 `host=node`，核准請求會包含標準 `systemRunPlan` 酬載。Gateway 會在轉發已核准的 `system.run` 請求時，使用該計畫作為權威的 command/cwd/session 情境。

這對非同步核准延遲很重要：

- 節點 exec 路徑會預先準備一個標準計畫。
- 核准記錄會儲存該計畫及其繫結中繼資料。
- 一旦核准，最終轉發的 `system.run` 呼叫會重用已儲存的計畫，而不是信任後續呼叫端的編輯。
- 如果呼叫端在核准請求建立後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 會因核准不相符而拒絕轉發的執行。

## 系統事件

Exec 生命週期會顯示為系統訊息：

- `Exec running`（僅在命令超過執行中通知閾值時）。
- `Exec finished`。
- `Exec denied`。

這些會在節點回報事件後發布到代理的工作階段。Gateway 主機 exec 核准會在命令完成時（以及選擇性地在執行時間超過閾值時）發出相同的生命週期事件。受核准控管的 exec 會在這些訊息中重用核准 ID 作為 `runId`，方便關聯追蹤。

## 核准遭拒的行為

非同步 exec 核准遭拒時，OpenClaw 會防止代理重用同一工作階段中相同命令先前任何執行的輸出。拒絕原因會搭配明確指引傳遞，說明沒有可用的命令輸出，這會阻止代理聲稱有新輸出，或以先前成功執行的舊結果重複遭拒的命令。

## 影響

- **`full`** 功能強大；可行時請優先使用允許清單。
- **`ask`** 讓你仍在流程中，同時仍允許快速核准。
- 個別代理允許清單會防止某個代理的核准外洩到其他代理。
- 核准只套用於來自**已授權傳送者**的主機 exec 請求。未授權的傳送者無法發出 `/exec`。
- `/exec security=full` 是授權操作員的工作階段層級便利功能，依設計會略過核准。若要硬性封鎖主機 exec，請將核准安全性設為 `deny`，或透過工具政策拒絕 `exec` 工具。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 核准 - 進階" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全 bin、直譯器繫結，以及將核准轉發到聊天。
  </Card>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="提升模式" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    同樣會略過核准的緊急路徑。
  </Card>
  <Card title="沙箱化" href="/zh-TW/gateway/sandboxing" icon="box">
    沙箱模式和工作區存取。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="lock">
    安全模型和強化。
  </Card>
  <Card title="沙箱與工具政策與提升模式" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何時使用各項控制。
  </Card>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="sparkles">
    由 Skills 支援的自動允許行為。
  </Card>
</CardGroup>
