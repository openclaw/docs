---
read_when:
    - 使用或修改 exec 工具
    - 偵錯 stdin 或 TTY 的行為
summary: Exec 工具使用方式、stdin 模式與 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-05-03T21:43:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 shell 命令。支援透過 `process` 進行前景 + 背景執行。
如果不允許使用 `process`，`exec` 會同步執行，並忽略 `yieldMs`/`background`。
背景工作階段依代理限定範圍；`process` 只會看到來自同一代理的工作階段。

## 參數

<ParamField path="command" type="string" required>
要執行的 Shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目錄。
</ParamField>

<ParamField path="env" type="object">
合併到繼承環境之上的鍵/值環境覆寫。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延遲後自動將命令轉入背景（毫秒）。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即將命令轉入背景，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆寫此呼叫的已設定 exec 逾時。只有在命令應該不受 exec 程序逾時限制執行時，才設定 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用時在偽終端機中執行。用於僅限 TTY 的 CLI、編碼代理，以及終端機 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。當沙箱執行階段啟用時，`auto` 會解析為 `sandbox`，否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 執行的強制模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 執行的核准提示行為。
</ParamField>

<ParamField path="node" type="string">
當 `host=node` 時的 Node id/名稱。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
要求提升模式 — 逃離沙箱到已設定的主機路徑。只有在提升解析為 `full` 時，才會強制 `security=full`。
</ParamField>

注意事項：

- `host` 預設為 `auto`：當工作階段的沙箱執行階段啟用時使用沙箱，否則使用 Gateway。
- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前被拒絕。
- `auto` 是預設路由策略，不是萬用字元。允許從 `auto` 逐次呼叫 `host=node`；只有在沒有沙箱執行階段啟用時，才允許逐次呼叫 `host=gateway`。
- 沒有額外設定時，`host=auto` 仍會「直接可用」：沒有沙箱表示它解析為 `gateway`；有即時沙箱表示它留在沙箱中。
- `elevated` 會逃離沙箱到已設定的主機路徑：預設為 `gateway`，或當 `tools.exec.host=node`（或工作階段預設為 `host=node`）時為 `node`。它只有在目前工作階段/提供者已啟用提升存取權時才可用。
- `gateway`/`node` 核准由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配對的 Node（伴隨應用程式或無頭 Node 主機）。
- 如果有多個 Node 可用，請設定 `exec.node` 或 `tools.exec.node` 來選取一個。
- `exec host=node` 是 Node 唯一的 shell 執行路徑；舊版 `nodes.run` 包裝器已移除。
- `timeout` 適用於前景、背景、`yieldMs`、Gateway、沙箱和 Node `system.run` 執行。如果省略，OpenClaw 會使用 `tools.exec.timeoutSec`；明確的 `timeout: 0` 會停用該呼叫的 exec 程序逾時。
- 在非 Windows 主機上，exec 會在設定時使用 `SHELL`；如果 `SHELL` 是 `fish`，它會優先使用來自 `PATH` 的 `bash`（或 `sh`）
  以避免 fish 不相容的指令碼，若兩者都不存在，才回退到 `SHELL`。
- 在 Windows 主機上，exec 會優先探索 PowerShell 7 (`pwsh`)（Program Files、ProgramW6432，然後是 PATH），
  然後回退到 Windows PowerShell 5.1。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 和載入器覆寫（`LD_*`/`DYLD_*`），以
  防止二進位劫持或注入程式碼。
- OpenClaw 會在產生的命令環境中設定 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱執行），讓 shell/profile 規則可以偵測 exec 工具情境。
- `openclaw channels login` 會從 `exec` 中被封鎖，因為它是互動式頻道驗證流程；請在 Gateway 主機上的終端機執行它，或在存在頻道原生登入工具時從聊天中使用該工具。
- 重要：沙箱預設為**關閉**。如果沙箱關閉，隱含的 `host=auto`
  會解析為 `gateway`。明確的 `host=sandbox` 仍會封閉失敗，而不是靜默地
  在 Gateway 主機上執行。請啟用沙箱，或搭配核准使用 `host=gateway`。
- 指令碼預檢查（用於常見 Python/Node shell 語法錯誤）只會檢查有效
  `workdir` 邊界內的檔案。如果指令碼路徑解析到 `workdir` 外部，則會略過該
  檔案的預檢查。
- 對於現在開始的長時間執行工作，請啟動一次，並在啟用時依賴自動
  完成喚醒，前提是命令輸出內容或失敗。
  對於記錄、狀態、輸入或介入，請使用 `process`；不要用睡眠迴圈、逾時迴圈或重複輪詢來模擬
  排程。
- 對於應稍後或按排程發生的工作，請使用 cron，而不是
  `exec` 睡眠/延遲模式。

## 設定

- `tools.exec.notifyOnExit`（預設：true）：為 true 時，轉入背景的 exec 工作階段會在結束時排入系統事件並要求 Heartbeat。
- `tools.exec.approvalRunningNoticeMs`（預設：10000）：當受核准控管的 exec 執行超過此時間時，發出單一「執行中」通知（0 會停用）。
- `tools.exec.timeoutSec`（預設：1800）：每個命令的預設 exec 逾時秒數。逐次呼叫的 `timeout` 會覆寫它；逐次呼叫的 `timeout: 0` 會停用 exec 程序逾時。
- `tools.exec.host`（預設：`auto`；當沙箱執行階段啟用時解析為 `sandbox`，否則解析為 `gateway`）
- `tools.exec.security`（預設：沙箱為 `deny`，未設定時 Gateway + Node 為 `full`）
- `tools.exec.ask`（預設：`off`）
- 免核准主機 exec 是 Gateway + Node 的預設值。如果你想要核准/允許清單行為，請同時收緊 `tools.exec.*` 和主機 `~/.openclaw/exec-approvals.json`；請參閱 [Exec 核准](/zh-TW/tools/exec-approvals#yolo-mode-no-approval)。
- YOLO 來自主機政策預設值（`security=full`、`ask=off`），不是來自 `host=auto`。如果你想強制 Gateway 或 Node 路由，請設定 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加上 `ask=off` 模式中，主機 exec 會直接遵循已設定的政策；沒有額外的啟發式命令混淆預篩選或指令碼預檢查拒絕層。
- `tools.exec.node`（預設：未設定）
- `tools.exec.strictInlineEval`（預設：false）：為 true 時，內嵌直譯器 eval 形式，例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e` 一律需要明確核准。`allow-always` 仍可持久保存良性的直譯器/指令碼呼叫，但內嵌 eval 形式每次仍會提示。
- `tools.exec.pathPrepend`：要前置到 exec 執行 `PATH` 的目錄清單（僅 Gateway + 沙箱）。
- `tools.exec.safeBins`：僅限 stdin 的安全二進位檔，可在沒有明確允許清單項目的情況下執行。行為詳情請參閱 [安全二進位檔](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：額外明確信任的目錄，用於 `safeBins` 路徑檢查。`PATH` 項目永遠不會自動受信任。內建預設值為 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：每個安全二進位檔的選用自訂 argv 政策（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

範例：

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH 處理

- `host=gateway`：將你的登入 shell `PATH` 合併到 exec 環境中。主機執行會拒絕 `env.PATH` 覆寫。Daemon 本身仍以最小 `PATH` 執行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器內執行 `sh -lc`（登入 shell），因此 `/etc/profile` 可能會重設 `PATH`。
  OpenClaw 會在 profile 載入後，透過內部 env var 前置 `env.PATH`（沒有 shell 插值）；
  `tools.exec.pathPrepend` 也會在此套用。
- `host=node`：只有你傳入的未封鎖 env 覆寫會傳送到 Node。主機執行會拒絕 `env.PATH` 覆寫，Node 主機也會忽略它。如果你需要在 Node 上加入額外 PATH 項目，
  請設定 Node 主機服務環境（systemd/launchd），或將工具安裝在標準位置。

每個代理的 Node 繫結（在設定中使用代理清單索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 分頁包含一個小型「Exec Node 繫結」面板，用於相同設定。

## 工作階段覆寫（`/exec`）

使用 `/exec` 設定 `host`、`security`、`ask` 和 `node` 的**每個工作階段**預設值。
傳送沒有引數的 `/exec` 可顯示目前值。

範例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授權模型

`/exec` 只會對**授權寄件者**生效（頻道允許清單/配對，加上 `commands.useAccessGroups`）。
它只會更新**工作階段狀態**，不會寫入設定。若要硬性停用 exec，請透過工具
政策拒絕它（`tools.deny: ["exec"]` 或每個代理設定）。除非你明確設定
`security=full` 和 `ask=off`，否則主機核准仍會套用。

## Exec 核准（伴隨應用程式 / Node 主機）

沙箱化代理在 `exec` 於 Gateway 或 Node 主機上執行前，可能需要逐次要求核准。
政策、允許清單和 UI 流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

需要核准時，exec 工具會立即傳回
`status: "approval-pending"` 和核准 id。一旦核准（或拒絕 / 逾時），
Gateway 會發出系統事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 之後仍在執行，會發出單一 `Exec running` 通知。
在具有原生核准卡片/按鈕的頻道上，代理應優先依賴該
原生 UI，且只有在工具結果明確表示聊天核准不可用，或手動核准是唯一
路徑時，才包含手動 `/approve` 命令。

## 允許清單 + 安全二進位檔

手動允許清單強制會比對已解析的二進位路徑 glob 和裸命令名稱
glob。裸名稱只會比對透過 PATH 呼叫的命令，因此當命令為 `rg` 時，`rg` 可比對
`/opt/homebrew/bin/rg`，但不會比對 `./rg` 或 `/tmp/rg`。
當 `security=allowlist` 時，只有在每個管線
片段都在允許清單中或是安全二進位檔時，shell 命令才會自動允許。鏈接（`;`、`&&`、`||`）和重新導向
在允許清單模式中會被拒絕，除非每個最上層片段都符合
允許清單（包括安全二進位檔）。重新導向仍不受支援。
持久的 `allow-always` 信任不會繞過該規則：鏈接命令仍需要每個
最上層片段都相符。

`autoAllowSkills` 是 exec 核准中的獨立便利路徑。它不同於
手動路徑允許清單項目。若要嚴格明確信任，請保持 `autoAllowSkills` 停用。

針對不同工作使用這兩種控制：

- `tools.exec.safeBins`：小型、僅限 stdin 的串流篩選器。
- `tools.exec.safeBinTrustedDirs`：安全二進位檔可執行路徑的明確額外受信任目錄。
- `tools.exec.safeBinProfiles`：自訂安全二進位檔的明確 argv 政策。
- 允許清單：對可執行路徑的明確信任。

不要將 `safeBins` 視為通用允許清單，也不要加入直譯器/執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要這些，請使用明確的允許清單項目，並保持核准提示啟用。
當直譯器/執行階段 `safeBins` 項目缺少明確設定檔時，`openclaw security audit` 會發出警告，而 `openclaw doctor --fix` 可以搭建缺少的自訂 `safeBinProfiles` 項目。
當你明確將 `jq` 等具廣泛行為的二進位檔加回 `safeBins` 時，`openclaw security audit` 和 `openclaw doctor` 也會發出警告。
如果你明確允許列出直譯器，請啟用 `tools.exec.strictInlineEval`，讓內嵌程式碼求值形式仍需要新的核准。

如需完整政策詳情與範例，請參閱 [Exec 核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全二進位檔與允許清單](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

## 範例

前景：

```json
{ "tool": "exec", "command": "ls -la" }
```

背景 + 輪詢：

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

輪詢是用於隨需狀態查詢，不是等待迴圈。如果啟用了自動完成喚醒，命令在輸出內容或失敗時可以喚醒工作階段。

傳送按鍵（tmux 風格）：

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交（僅傳送 CR）：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上（預設使用括號貼上模式）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用於結構化的多檔案編輯。
它預設會為 OpenAI 和 OpenAI Codex 模型啟用。只有在你想停用它或將它限制到特定模型時，才需要使用設定：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

注意事項：

- 僅適用於 OpenAI/OpenAI Codex 模型。
- 工具政策仍然適用；`allow: ["write"]` 會隱含允許 `apply_patch`。
- `deny: ["write"]` 不會拒絕 `apply_patch`；請明確拒絕 `apply_patch`，或在修補寫入也應該被阻擋時使用 `deny: ["group:fs"]`。
- 設定位於 `tools.exec.applyPatch` 之下。
- `tools.exec.applyPatch.enabled` 預設為 `true`；將它設為 `false` 可為 OpenAI 模型停用此工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制在工作區內）。只有在你有意讓 `apply_patch` 寫入/刪除工作區目錄外的內容時，才將它設為 `false`。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙箱化](/zh-TW/gateway/sandboxing) — 在沙箱環境中執行命令
- [背景程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 和 process 工具
- [安全性](/zh-TW/gateway/security) — 工具政策與提升權限
