---
read_when:
    - 設定 exec 核准或允許清單
    - 在 macOS 應用程式中實作 exec 核准使用者體驗
    - 檢視沙箱逃逸提示詞及其影響
sidebarTitle: Exec approvals
summary: 主機執行核准：政策控制項、允許清單與 YOLO/嚴格工作流程
title: 執行核准
x-i18n:
    generated_at: "2026-05-10T19:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 核可是讓沙盒化 agent 在真實主機（`gateway` 或 `node`）上執行指令的 **配套應用程式 / Node 主機防護機制**。這是一道安全互鎖：只有當政策 + 允許清單 +（選用）使用者核可全部一致時，才允許指令執行。Exec 核可會疊加在工具政策與提升權限閘控**之上**（除非提升權限設為 `full`，此時會略過核可）。

<Note>
有效政策是 `tools.exec.*` 與核可預設值兩者中**較嚴格**的一個；如果省略某個核可欄位，會使用 `tools.exec` 值。主機執行也會使用該機器上的本機核可狀態 - `~/.openclaw/exec-approvals.json` 中的主機本機 `ask: "always"` 會持續提示，即使 session 或設定預設值要求 `ask: "on-miss"` 也一樣。
</Note>

## 檢查有效政策

| 指令                                                             | 顯示內容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求的政策、主機政策來源，以及有效結果。                                               |
| `openclaw exec-policy show`                                      | 本機合併後的檢視。                                                                     |
| `openclaw exec-policy set` / `preset`                            | 一次同步本機要求的政策與本機主機核可檔案。                                             |

當本機範圍要求 `host=node` 時，`exec-policy show` 會回報該範圍在執行階段由 Node 管理，而不是假裝本機核可檔案是事實來源。

如果配套應用程式 UI **無法使用**，任何通常會提示的要求都會由 **ask fallback** 解決（預設：`deny`）。

<Tip>
原生聊天核可用戶端可以在待核可訊息上預先放入通道特定的操作捷徑。例如，Matrix 會預先放入反應捷徑（`✅` 允許一次、`❌` 拒絕、`♾️` 永遠允許），同時仍在訊息中保留 `/approve ...` 指令作為 fallback。
</Tip>

## 適用位置

Exec 核可會在執行主機上於本機強制執行：

- **Gateway 主機** → Gateway 機器上的 `openclaw` 程序。
- **Node 主機** → Node 執行器（macOS 配套應用程式或無頭 Node 主機）。

### 信任模型

- 經 Gateway 驗證的呼叫者是該 Gateway 的受信任操作者。
- 已配對的 Node 會把該受信任操作者能力延伸到 Node 主機上。
- Exec 核可能降低意外執行風險，但**不是**每位使用者的驗證邊界，也不是檔案系統唯讀政策。
- 一旦核可，指令就可以依照所選主機或沙盒檔案系統權限修改檔案。
- 已核可的 Node 主機執行會綁定標準執行情境：標準 cwd、精確 argv、存在時的 env 綁定，以及適用時釘選的可執行檔路徑。
- 對於 shell 指令碼與直接直譯器/執行階段檔案呼叫，OpenClaw 也會嘗試綁定一個具體的本機檔案運算元。如果該綁定檔案在核可後、執行前發生變更，該次執行會被拒絕，而不是執行已漂移的內容。
- 檔案綁定刻意採取盡力而為，**不是**每個直譯器/執行階段載入器路徑的完整語意模型。如果核可模式無法識別剛好一個可綁定的具體本機檔案，它會拒絕發出由核可背書的執行，而不是假裝具備完整覆蓋。

### macOS 分離

- **Node 主機服務**會透過本機 IPC 將 `system.run` 轉送到 **macOS 應用程式**。
- **macOS 應用程式**會強制執行核可，並在 UI 情境中執行指令。

## 設定與儲存

核可會存放在執行主機上的本機 JSON 檔案：

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
  - `deny` - 封鎖所有主機執行要求。
  - `allowlist` - 只允許允許清單中的指令。
  - `full` - 允許所有項目（等同於提升權限）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - 永不提示。
  - `on-miss` - 只有在允許清單不符合時才提示。
  - `always` - 每個指令都提示。當有效 ask 模式為 `always` 時，`allow-always` 持久信任**不會**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但沒有可到達的 UI 時的解決方式。

- `deny` - 封鎖。
- `allowlist` - 只有允許清單符合時才允許。
- `full` - 允許。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  當為 `true` 時，即使直譯器二進位本身在允許清單中，OpenClaw 也會將內嵌程式碼 eval 形式視為僅能透過核可執行。這是針對無法乾淨對應到單一穩定檔案運算元的直譯器載入器所做的縱深防禦。
</ParamField>

嚴格模式會捕捉的範例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在嚴格模式下，這些指令仍需要明確核可，而且 `allow-always` 不會自動為它們持久化新的允許清單項目。

## YOLO 模式（無核可）

如果你希望主機執行在沒有核可提示的情況下執行，必須開放**兩個**政策層 - OpenClaw 設定中要求的 exec 政策（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中的主機本機核可政策。

除非你明確收緊，否則 YOLO 是預設主機行為：

| 層級                  | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                      |
| 主機 `askFallback`    | `full`                     |

<Warning>
**重要區別：**

- `tools.exec.host=auto` 選擇 exec **在哪裡**執行：可用時在沙盒，否則在 Gateway。
- YOLO 選擇主機 exec **如何**被核可：`security=full` 加上 `ask=off`。
- 在 YOLO 模式中，OpenClaw **不會**在設定好的主機 exec 政策之上，加入額外的啟發式指令混淆核可閘門或指令碼預檢拒絕層。
- `auto` 不會讓 Gateway 路由變成沙盒 session 的免費覆寫。從 `auto` 可允許每次呼叫的 `host=node` 要求；只有在沒有作用中的沙盒執行階段時，才允許從 `auto` 使用 `host=gateway`。若要穩定的非 auto 預設值，請設定 `tools.exec.host`，或明確使用 `/exec host=...`。

</Warning>

公開自身非互動式權限模式的 CLI 支援提供者可以遵循此政策。當 OpenClaw 要求的 exec 政策是 YOLO 時，Claude CLI 會加入 `--permission-mode bypassPermissions`。若要覆寫該後端行為，請在 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下使用明確的 Claude 引數 - 例如 `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。

如果你想要更保守的設定，請將任一層收緊回 `allowlist` / `on-miss` 或 `deny`。

### 持久 Gateway 主機「永不提示」設定

<Steps>
  <Step title="設定要求的設定政策">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="匹配主機核可檔案">
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

它刻意只限本機。若要遠端變更 Gateway 主機或 Node 主機核可，請使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

### Node 主機

對於 Node 主機，請改為在該 Node 上套用相同的核可檔案：

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

- `openclaw exec-policy` 不會同步 Node 核可。
- `openclaw exec-policy set --host node` 會被拒絕。
- Node exec 核可會在執行階段從 Node 擷取，因此針對 Node 的更新必須使用 `openclaw approvals --node ...`。

</Note>

### 僅限 session 的捷徑

- `/exec security=full ask=off` 只會變更目前 session。
- `/elevated full` 是 break-glass 捷徑，也會略過該 session 的 exec 核可。

如果主機核可檔案仍比設定更嚴格，較嚴格的主機政策仍會勝出。

## 允許清單（每個 agent）

允許清單是**每個 agent**各自獨立的。如果存在多個 agent，請在 macOS 應用程式中切換你正在編輯的 agent。模式是 glob 比對。

模式可以是已解析的二進位路徑 glob，或單純的指令名稱 glob。單純名稱只會比對透過 `PATH` 呼叫的指令，因此當指令是 `rg` 時，`rg` 可以比對 `/opt/homebrew/bin/rg`，但**不會**比對 `./rg` 或 `/tmp/rg`。若你想信任某個特定二進位位置，請使用路徑 glob。

舊版 `agents.default` 項目會在載入時遷移到 `agents.main`。像 `echo ok && pwd` 這類 shell 鏈仍需要每個頂層片段都符合允許清單規則。

範例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制引數

當允許清單項目應比對二進位與特定引數形狀時，加入 `argPattern`。OpenClaw 會針對解析後的指令引數評估正規表示式，並排除可執行檔 token（`argv[0]`）。對於手寫項目，引數會以單一空格串接，因此在需要精確比對時請錨定模式。

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

該項目允許 `python3 safe.py`；`python3 other.py` 則是允許清單未命中。如果同一個二進位也存在僅路徑項目，未符合的引數仍可 fallback 到該僅路徑項目。若目標是將該二進位限制為宣告的引數，請省略僅路徑項目。

核可流程儲存的項目可以使用內部分隔符格式來精確比對 argv。請優先透過 UI 或核可流程重新產生這些項目，而不是手動編輯編碼後的值。如果 OpenClaw 無法解析某個指令片段的 argv，含有 `argPattern` 的項目就不會符合。

每個允許清單項目支援：

| 欄位               | 意義                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二進位路徑 glob，或單純的命令名稱 glob                |
| `argPattern`       | 選用的 argv regex；省略的項目僅比對路徑                      |
| `id`               | 用於 UI 身分識別的穩定 UUID                                  |
| `source`           | 項目來源，例如 `allow-always`                                 |
| `commandText`      | 核准流程建立項目時擷取的命令文字                              |
| `lastUsedAt`       | 上次使用時間戳                                                |
| `lastUsedCommand`  | 上次符合的命令                                                |
| `lastResolvedPath` | 上次解析的二進位路徑                                          |

## 自動允許 skill CLI

啟用 **自動允許 skill CLI** 時，已知 skills 參照的可執行檔會在 nodes（macOS node 或 headless node 主機）上被視為允許清單項目。這會透過 Gateway RPC 使用 `skills.bins` 來擷取 skill bin 清單。如果你需要嚴格的手動允許清單，請停用此功能。

<Warning>
- 這是一個**隱含的便利允許清單**，與手動路徑允許清單項目分開。
- 它適用於 Gateway 和 node 位於同一信任邊界內的受信任操作員環境。
- 如果你需要嚴格的明確信任，請保持 `autoAllowSkills: false`，並只使用手動路徑允許清單項目。

</Warning>

## 安全 bins 與核准轉送

如需了解安全 bins（僅 stdin 的快速路徑）、直譯器繫結細節，以及如何將核准提示轉送至 Slack/Discord/Telegram（或以原生核准用戶端執行），請參閱
[Exec 核准 - 進階](/zh-TW/tools/exec-approvals-advanced)。

## 控制 UI 編輯

使用 **控制 UI → Nodes → Exec 核准** 卡片來編輯預設值、個別 agent 覆寫，以及允許清單。選擇範圍（Defaults 或某個 agent）、調整政策、新增/移除允許清單模式，然後按 **儲存**。UI 會顯示每個模式的上次使用中繼資料，讓你能保持清單整潔。

目標選擇器會選擇 **Gateway**（本機核准）或 **Node**。Nodes 必須宣告 `system.execApprovals.get/set`（macOS app 或 headless node 主機）。如果某個 node 尚未宣告 exec 核准，請直接編輯其本機 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支援 gateway 或 node 編輯 - 請參閱
[核准 CLI](/zh-TW/cli/approvals)。

## 核准流程

需要提示時，gateway 會將 `exec.approval.requested` 廣播給操作員用戶端。控制 UI 和 macOS app 會透過 `exec.approval.resolve` 解析它，然後 gateway 將已核准的請求轉送給 node 主機。

對於 `host=node`，核准請求會包含標準的 `systemRunPlan` payload。gateway 會在轉送已核准的 `system.run` 請求時，使用該 plan 作為具權威性的 command/cwd/session 內容。

這對非同步核准延遲很重要：

- node exec 路徑會預先準備一個標準 plan。
- 核准記錄會儲存該 plan 及其繫結中繼資料。
- 核准後，最終轉送的 `system.run` 呼叫會重用已儲存的 plan，而不是信任後續呼叫者編輯。
- 如果呼叫者在建立核准請求後變更 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，gateway 會因核准不相符而拒絕轉送的執行。

## 系統事件

Exec 生命週期會顯示為系統訊息：

- `Exec running`（僅在命令超過執行通知閾值時）。
- `Exec finished`。
- `Exec denied`。

這些訊息會在 node 回報事件後發布到 agent 的 session。Gateway 主機 exec 核准會在命令完成時發出相同的生命週期事件（並可選擇在執行時間超過閾值時發出）。受核准控管的 exec 會在這些訊息中重用核准 id 作為 `runId`，以便輕鬆關聯。

## 拒絕核准行為

當非同步 exec 核准遭到拒絕時，OpenClaw 會防止 agent 重用同一 session 中相同命令先前任何執行的輸出。拒絕原因會附帶明確指引，說明沒有可用的命令輸出，這會阻止 agent 宣稱有新輸出，或使用先前成功執行的陳舊結果來重複遭拒的命令。

## 影響

- **`full`** 功能強大；盡可能優先使用允許清單。
- **`ask`** 讓你保持參與，同時仍允許快速核准。
- 個別 agent 允許清單可防止某個 agent 的核准外洩到其他 agent。
- 核准只適用於來自**已授權傳送者**的主機 exec 請求。未授權傳送者無法發出 `/exec`。
- `/exec security=full` 是供已授權操作員使用的 session 層級便利功能，並且設計上會略過核准。若要硬性封鎖主機 exec，請將核准安全性設為 `deny`，或透過工具政策拒絕 `exec` 工具。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 核准 - 進階" href="/zh-TW/tools/exec-approvals-advanced" icon="gear">
    安全 bins、直譯器繫結，以及將核准轉送到聊天。
  </Card>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    Shell 命令執行工具。
  </Card>
  <Card title="提權模式" href="/zh-TW/tools/elevated" icon="shield-exclamation">
    同樣會略過核准的緊急處理路徑。
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
    Skill 支援的自動允許行為。
  </Card>
</CardGroup>
