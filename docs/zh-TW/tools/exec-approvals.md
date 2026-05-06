---
read_when:
    - 設定 exec 核准或允許清單
    - 在 macOS 應用程式中實作 exec 核准 UX
    - 檢視沙箱逃逸提示及其影響
sidebarTitle: Exec approvals
summary: 主機 exec 核准：政策設定選項、允許清單，以及 YOLO/嚴格工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-05-06T02:59:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30733fe6580e7c10e3e61c5d050a60939512e67a6dc8b279adf703b30ec344ea
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec approvals 是**伴隨 app / node 主機防護欄**，用來允許
沙盒化代理程式在真實主機（`gateway` 或 `node`）上執行命令。這是一個
安全互鎖機制：只有在 policy + allowlist +
（選用）使用者核准全部一致時，才允許命令執行。Exec approvals 疊加在
工具 policy 與 elevated gating **之上**（除非 elevated 設為 `full`，此時會
略過 approvals）。

<Note>
有效 policy 是 `tools.exec.*` 與 approvals
預設值之中**較嚴格**者；如果省略 approvals 欄位，會使用 `tools.exec` 值。
主機 exec 也會使用該機器上的本機 approvals 狀態，也就是說，
`~/.openclaw/exec-approvals.json` 中主機本機的 `ask: "always"` 即使在 session 或 config 預設值要求 `ask: "on-miss"` 時，仍會持續提示。
</Note>

## 檢查有效 policy

| 命令                                                          | 顯示內容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的 policy、主機 policy 來源，以及有效結果。                       |
| `openclaw exec-policy show`                                      | 本機合併後的視圖。                                                             |
| `openclaw exec-policy set` / `preset`                            | 一次同步本機要求的 policy 與本機主機 approvals 檔案。 |

當本機 scope 要求 `host=node` 時，`exec-policy show` 會回報該
scope 在執行階段由 node 管理，而不是假裝本機
approvals 檔案是真相來源。

如果伴隨 app UI **不可用**，任何通常會
提示的要求都會由 **ask fallback**（預設：`deny`）解析。

<Tip>
原生聊天核准用戶端可以在待處理核准訊息上預先填入 channel 專屬操作。
例如，Matrix 會預先填入反應捷徑
（`✅` 允許一次、`❌` 拒絕、`♾️` 永遠允許），同時仍在訊息中保留
`/approve ...` 命令作為 fallback。
</Tip>

## 適用範圍

Exec approvals 會在執行主機上於本機強制執行：

- **Gateway 主機** → gateway 機器上的 `openclaw` 程序。
- **Node 主機** → node runner（macOS 伴隨 app 或 headless node 主機）。

### 信任模型

- 經 Gateway 驗證的呼叫者是該 Gateway 的受信任操作者。
- 已配對 nodes 會將該受信任操作者能力延伸到 node 主機。
- Exec approvals 可降低意外執行風險，但**不是**逐使用者的 auth 邊界。
- 已核准的 node 主機執行會綁定標準執行內容：標準 cwd、精確 argv、存在時的 env 綁定，以及適用時固定的可執行檔路徑。
- 對於 shell scripts 以及直接的 interpreter/runtime 檔案呼叫，OpenClaw 也會嘗試綁定一個具體的本機檔案運算元。如果該綁定檔案在核准後、執行前變更，這次執行會被拒絕，而不是執行已漂移的內容。
- 檔案綁定刻意採 best-effort，**不是**每個 interpreter/runtime loader 路徑的完整語意模型。如果 approval mode 無法識別剛好一個具體本機檔案來綁定，它會拒絕產生由 approval 支援的執行，而不是假裝具備完整涵蓋。

### macOS 分離

- **node 主機服務**會透過 local IPC 將 `system.run` 轉送到 **macOS app**。
- **macOS app**會強制執行 approvals，並在 UI context 中執行命令。

## 設定與儲存

Approvals 存放在執行主機上的本機 JSON 檔案：

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

## Policy 旋鈕

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — 封鎖所有主機 exec 要求。
  - `allowlist` — 只允許列入 allowlist 的命令。
  - `full` — 允許所有內容（等同於 elevated）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — 永不提示。
  - `on-miss` — 只有 allowlist 不符合時才提示。
  - `always` — 每個命令都提示。當有效 ask mode 為 `always` 時，`allow-always` 持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但無法連線到 UI 時的解析方式。

- `deny` — 封鎖。
- `allowlist` — 只有 allowlist 符合時才允許。
- `full` — 允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  當為 `true` 時，即使 interpreter binary 本身已列入 allowlist，
  OpenClaw 仍會將 inline code-eval 形式視為只可透過 approval。
  這是對無法乾淨對應到單一穩定檔案運算元的 interpreter loaders 的縱深防禦。
</ParamField>

strict mode 會捕捉的範例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在 strict mode 中，這些命令仍需要明確 approval，而且
`allow-always` 不會自動為它們持久化新的 allowlist entries。

## YOLO mode（無 approval）

如果你希望 host exec 在沒有 approval prompts 的情況下執行，你必須開啟
**兩個** policy 層：OpenClaw config
（`tools.exec.*`）中的 requested exec policy，**以及**
`~/.openclaw/exec-approvals.json` 中的 host-local approvals policy。

除非你明確收緊，否則 YOLO 是預設的主機行為：

| 層級                 | YOLO 設定               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要區別：**

- `tools.exec.host=auto` 選擇 exec 在**哪裡**執行：有 sandbox 時在 sandbox，否則在 gateway。
- YOLO 選擇 host exec **如何**被核准：`security=full` 加上 `ask=off`。
- 在 YOLO mode 中，OpenClaw **不會**在已設定的 host exec policy 之上加入另一層啟發式命令混淆 approval gate 或 script-preflight 拒絕層。
- `auto` 不會讓 gateway routing 成為來自 sandboxed session 的免費 override。`auto` 允許逐次呼叫的 `host=node` 要求；只有在沒有啟用 sandbox runtime 時，`auto` 才允許 `host=gateway`。若要穩定的非 auto 預設值，請設定 `tools.exec.host`，或明確使用 `/exec host=...`。

</Warning>

公開自己非互動式 permission mode 的 CLI-backed providers
可以遵循此 policy。當 OpenClaw requested exec
policy 為 YOLO 時，Claude CLI 會加入
`--permission-mode bypassPermissions`。若要 override 該 backend 行為，請在
`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下設定明確 Claude args，
例如 `--permission-mode default`、`acceptEdits` 或
`bypassPermissions`。

如果你想要更保守的設定，請將任一層收緊回
`allowlist` / `on-miss` 或 `deny`。

### 持久 Gateway 主機「永不提示」設定

<Steps>
  <Step title="設定要求的 config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="比對主機 approvals 檔案">
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
- 本機 `~/.openclaw/exec-approvals.json` defaults。

它刻意只限本機。若要遠端變更 gateway-host 或 node-host
approvals，請使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

### Node 主機

對於 node 主機，請改在該 node 上套用相同的 approvals 檔案：

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

- `openclaw exec-policy` 不會同步 node approvals。
- `openclaw exec-policy set --host node` 會被拒絕。
- Node exec approvals 會在 runtime 從 node 擷取，因此以 node 為目標的更新必須使用 `openclaw approvals --node ...`。

</Note>

### 僅限 session 的捷徑

- `/exec security=full ask=off` 只會變更目前 session。
- `/elevated full` 是 break-glass 捷徑，也會略過該 session 的 exec approvals。

如果主機 approvals 檔案比 config 更嚴格，較嚴格的主機
policy 仍然優先。

## Allowlist（每個 agent）

Allowlists 是**每個 agent**各自獨立。如果存在多個 agents，請在 macOS app 中切換你正在編輯的 agent。
Patterns 是 glob matches。

Patterns 可以是已解析的 binary path globs，或 bare command-name globs。
Bare names 只會符合透過 `PATH` 呼叫的命令，因此當命令是 `rg` 時，`rg` 可以符合
`/opt/homebrew/bin/rg`，但**不會**符合 `./rg` 或
`/tmp/rg`。當你想信任某個特定 binary
位置時，請使用 path glob。

Legacy `agents.default` entries 會在 load 時遷移到 `agents.main`。
Shell chains 例如 `echo ok && pwd` 仍需要每個 top-level segment
都符合 allowlist rules。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制引數

當 allowlist entry 應符合某個 binary 與特定 argument shape 時，加入 `argPattern`。OpenClaw 會針對已解析的命令引數評估 regular expression，並排除 executable token
（`argv[0]`）。對於手寫 entries，引數會用單一空格連接，因此當你需要 exact match 時，請錨定 pattern。

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

該 entry 允許 `python3 safe.py`；`python3 other.py` 會是 allowlist
miss。如果同一個 binary 也存在 path-only entry，未符合的
arguments 仍可 fallback 到該 path-only entry。當目標是將 binary 限制為宣告的 arguments 時，請省略 path-only
entry。

由 approval flows 儲存的 entries 可以使用內部 separator format 來進行
exact argv matching。請優先使用 UI 或 approval flow 重新產生這些
entries，而不是手動編輯 encoded value。如果 OpenClaw 無法
parse 某個 command segment 的 argv，帶有 `argPattern` 的 entries 不會 match。

每個 allowlist entry 支援：

| 欄位              | 意義                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二進位路徑 glob 或裸命令名稱 glob           |
| `argPattern`       | 選用的 argv regex；省略的項目僅比對路徑            |
| `id`               | 用於 UI 識別的穩定 UUID                              |
| `source`           | 項目來源，例如 `allow-always`                          |
| `commandText`      | 核准流程建立項目時擷取的命令文字 |
| `lastUsedAt`       | 上次使用時間戳                                           |
| `lastUsedCommand`  | 上次相符的命令                                     |
| `lastResolvedPath` | 上次解析的二進位路徑                                     |

## 自動允許 Skills CLI

啟用 **自動允許 Skills CLI** 時，已知 Skills 參照的可執行檔會在節點（macOS 節點或無頭節點主機）上視為已列入允許清單。這會透過 Gateway RPC 使用 `skills.bins` 來擷取 Skills bin 清單。如果你想要嚴格的手動允許清單，請停用此功能。

<Warning>
- 這是**隱含的便利允許清單**，與手動路徑允許清單項目分開。
- 它適用於 Gateway 與節點位於同一信任邊界內的受信任操作員環境。
- 如果你需要嚴格的明確信任，請維持 `autoAllowSkills: false`，並只使用手動路徑允許清單項目。

</Warning>

## 安全 bin 與核准轉送

若要了解安全 bin（僅 stdin 的快速路徑）、直譯器繫結細節，以及如何將核准提示轉送到 Slack/Discord/Telegram（或以原生核准用戶端執行），請參閱
[Exec 核准 — 進階](/zh-TW/tools/exec-approvals-advanced)。

## Control UI 編輯

使用 **Control UI → 節點 → Exec 核准** 卡片來編輯預設值、各 agent 覆寫與允許清單。選擇範圍（預設值或 agent）、調整政策、新增/移除允許清單模式，然後按 **儲存**。UI 會顯示每個模式的上次使用中繼資料，讓你能保持清單整潔。

目標選擇器會選擇 **Gateway**（本機核准）或 **Node**。節點必須宣告 `system.execApprovals.get/set`（macOS app 或無頭節點主機）。如果節點尚未宣告 exec 核准，請直接編輯其本機 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支援 Gateway 或節點編輯 — 請參閱
[核准 CLI](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，Gateway 會向操作員用戶端廣播 `exec.approval.requested`。Control UI 和 macOS app 會透過 `exec.approval.resolve` 解析它，然後 Gateway 將已核准的請求轉送到節點主機。

對於 `host=node`，核准請求會包含標準的 `systemRunPlan` 承載。Gateway 會在轉送已核准的 `system.run` 請求時，使用該計畫作為權威的 command/cwd/session 內容。

這對非同步核准延遲很重要：

- 節點 exec 路徑會預先準備一個標準計畫。
- 核准記錄會儲存該計畫及其繫結中繼資料。
- 核准後，最終轉送的 `system.run` 呼叫會重用已儲存的計畫，而不是信任後續呼叫端編輯。
- 如果呼叫端在核准請求建立後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 會因核准不相符而拒絕轉送執行。

## 系統事件

Exec 生命週期會以系統訊息呈現：

- `Exec running`（僅在命令超過執行通知門檻時）。
- `Exec finished`。
- `Exec denied`。

這些訊息會在節點回報事件後張貼到 agent 的工作階段。Gateway 主機 exec 核准會在命令完成時發出相同的生命週期事件（也可在執行時間超過門檻時發出）。受核准控管的 exec 會在這些訊息中重用核准 ID 作為 `runId`，方便關聯。

## 被拒核准的行為

當非同步 exec 核准遭拒時，OpenClaw 會防止 agent 在工作階段中重用同一命令任何先前執行的輸出。拒絕原因會附上明確指引，指出沒有可用的命令輸出，這會阻止 agent 聲稱有新的輸出，或使用先前成功執行的過期結果重複被拒絕的命令。

## 影響

- **`full`** 功能強大；可行時請偏好允許清單。
- **`ask`** 讓你保持在流程中，同時仍允許快速核准。
- 各 agent 允許清單可防止一個 agent 的核准洩漏到其他 agent。
- 核准只套用於來自**已授權傳送者**的主機 exec 請求。未授權的傳送者無法發出 `/exec`。
- `/exec security=full` 是供已授權操作員使用的工作階段層級便利功能，並且會按設計略過核准。若要硬性封鎖主機 exec，請將核准安全性設為 `deny`，或透過工具政策拒絕 `exec` 工具。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 核准 — 進階" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全 bin、直譯器繫結，以及將核准轉送到聊天。
  </Card>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="提升模式" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    也會略過核准的緊急通道。
  </Card>
  <Card title="沙盒" href="/zh-TW/gateway/sandboxing" icon="box">
    沙盒模式與工作區存取。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security" icon="lock">
    安全模型與強化。
  </Card>
  <Card title="沙盒 vs 工具政策 vs 提升模式" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何時使用各項控制。
  </Card>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="sparkles">
    Skills 支援的自動允許行為。
  </Card>
</CardGroup>
