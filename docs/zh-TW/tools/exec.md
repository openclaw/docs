---
read_when:
    - 使用或修改 exec 工具
    - 偵錯 stdin 或 TTY 行為
summary: Exec 工具用法、stdin 模式和 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-04-30T03:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 shell 命令。透過 `process` 支援前景與背景執行。
如果不允許使用 `process`，`exec` 會同步執行並忽略 `yieldMs`/`background`。
背景工作階段以每個代理為範圍；`process` 只會看到同一代理的工作階段。

## 參數

<ParamField path="command" type="string" required>
要執行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目錄。
</ParamField>

<ParamField path="env" type="object">
合併到繼承環境之上的鍵/值環境覆寫。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延遲（毫秒）後自動將命令移至背景。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即將命令移至背景，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆寫此呼叫設定的 exec 逾時。只有在命令應該不受 exec 處理程序逾時限制執行時，才設定 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用時在偽終端機中執行。用於僅支援 TTY 的 CLI、編碼代理和終端機 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。當 sandbox runtime 啟用時，`auto` 解析為 `sandbox`，否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 執行的強制執行模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 執行的核准提示行為。
</ParamField>

<ParamField path="node" type="string">
當 `host=node` 時的 Node id/name。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
要求 elevated mode — 逃逸 sandbox 到設定的主機路徑。只有當 elevated 解析為 `full` 時才會強制 `security=full`。
</ParamField>

注意事項：

- `host` 預設為 `auto`：工作階段的 sandbox runtime 啟用時使用 sandbox，否則使用 gateway。
- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前被拒絕。
- `auto` 是預設路由策略，不是萬用字元。允許從 `auto` 逐次呼叫使用 `host=node`；只有在沒有 sandbox runtime 啟用時，才允許逐次呼叫使用 `host=gateway`。
- 沒有額外設定時，`host=auto` 仍然「直接可用」：沒有 sandbox 時解析為 `gateway`；有即時 sandbox 時則留在 sandbox 中。
- `elevated` 會逃逸 sandbox 到設定的主機路徑：預設為 `gateway`，或在 `tools.exec.host=node`（或工作階段預設為 `host=node`）時為 `node`。只有目前工作階段/提供者啟用 elevated access 時才可用。
- `gateway`/`node` 核准由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配對的 node（companion app 或 headless node host）。
- 如果有多個 nodes 可用，請設定 `exec.node` 或 `tools.exec.node` 以選取其中一個。
- `exec host=node` 是 nodes 唯一的 shell 執行路徑；舊版 `nodes.run` 包裝器已移除。
- `timeout` 套用於前景、背景、`yieldMs`、gateway、sandbox 和 node `system.run` 執行。若省略，OpenClaw 會使用 `tools.exec.timeoutSec`；明確的 `timeout: 0` 會停用該次呼叫的 exec 處理程序逾時。
- 在非 Windows 主機上，exec 會在設定時使用 `SHELL`；如果 `SHELL` 是 `fish`，它會優先使用 `PATH` 中的 `bash`（或 `sh`）
  以避免 fish 不相容的 scripts，若兩者都不存在，才回退到 `SHELL`。
- 在 Windows 主機上，exec 會優先探索 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然後 PATH），
  接著回退到 Windows PowerShell 5.1。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 和載入器覆寫（`LD_*`/`DYLD_*`），以
  防止二進位檔劫持或注入程式碼。
- OpenClaw 會在產生的命令環境中設定 `OPENCLAW_SHELL=exec`（包含 PTY 和 sandbox 執行），讓 shell/profile 規則可以偵測 exec 工具情境。
- `openclaw channels login` 會被 `exec` 阻擋，因為它是互動式 channel-auth 流程；請在 gateway 主機上的終端機中執行，或在可用時從聊天使用 channel 原生登入工具。
- 重要：sandboxing **預設關閉**。如果 sandboxing 關閉，隱含的 `host=auto`
  會解析為 `gateway`。明確的 `host=sandbox` 仍會以失敗關閉，而不是悄悄
  在 gateway 主機上執行。請啟用 sandboxing，或使用需要核准的 `host=gateway`。
- Script 預檢查（針對常見 Python/Node shell 語法錯誤）只會檢查有效 `workdir` 邊界內的檔案。
  如果 script 路徑解析到 `workdir` 之外，該檔案會略過預檢。
- 對於現在開始的長時間執行工作，請只啟動一次，並在啟用時依賴自動
  完成喚醒，以及命令輸出或失敗。
  使用 `process` 查看日誌、狀態、輸入或介入；不要用 sleep 迴圈、timeout 迴圈或重複輪詢來模擬
  排程。
- 對於稍後或按排程執行的工作，請使用 Cron，而不是
  `exec` sleep/delay 模式。

## 設定

- `tools.exec.notifyOnExit`（預設：true）：為 true 時，移至背景的 exec 工作階段會在結束時排入系統事件並要求 Heartbeat。
- `tools.exec.approvalRunningNoticeMs`（預設：10000）：當受核准閘控的 exec 執行時間超過此值時，發出單一「running」通知（0 停用）。
- `tools.exec.timeoutSec`（預設：1800）：每個命令的預設 exec 逾時秒數。逐次呼叫的 `timeout` 會覆寫它；逐次呼叫的 `timeout: 0` 會停用 exec 處理程序逾時。
- `tools.exec.host`（預設：`auto`；sandbox runtime 啟用時解析為 `sandbox`，否則解析為 `gateway`）
- `tools.exec.security`（預設：sandbox 為 `deny`，未設定時 gateway + node 為 `full`）
- `tools.exec.ask`（預設：`off`）
- 無核准主機 exec 是 gateway + node 的預設值。如果你想要核准/allowlist 行為，請同時收緊 `tools.exec.*` 和主機 `~/.openclaw/exec-approvals.json`；請參閱 [Exec approvals](/zh-TW/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 來自主機政策預設值（`security=full`、`ask=off`），不是來自 `host=auto`。如果你想強制 gateway 或 node 路由，請設定 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加上 `ask=off` 模式中，主機 exec 會直接遵循設定的政策；沒有額外的啟發式命令混淆預篩選或 script 預檢拒絕層。
- `tools.exec.node`（預設：未設定）
- `tools.exec.strictInlineEval`（預設：false）：為 true 時，內嵌直譯器 eval 形式，例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e` 一律需要明確核准。`allow-always` 仍可持久化良性的直譯器/script 呼叫，但 inline-eval 形式每次仍會提示。
- `tools.exec.pathPrepend`：要為 exec 執行前置到 `PATH` 的目錄清單（僅限 gateway + sandbox）。
- `tools.exec.safeBins`：僅 stdin 的安全二進位檔，可在沒有明確 allowlist 項目的情況下執行。行為詳細資訊請參閱 [Safe bins](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：受信任以進行 `safeBins` 路徑檢查的其他明確目錄。`PATH` 項目永遠不會自動受信任。內建預設值為 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：每個 safe bin 的選用自訂 argv 政策（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`：將你的 login-shell `PATH` 合併到 exec 環境中。主機執行會拒絕 `env.PATH` 覆寫。Daemon 本身仍以最小 `PATH` 執行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器內執行 `sh -lc`（login shell），因此 `/etc/profile` 可能會重設 `PATH`。
  OpenClaw 會透過內部 env var 在 profile sourcing 後前置 `env.PATH`（無 shell interpolation）；
  `tools.exec.pathPrepend` 也會套用於此。
- `host=node`：只有你傳入且未被阻擋的 env 覆寫會傳送至 node。主機執行會拒絕 `env.PATH` 覆寫，node hosts 也會忽略它們。如果你需要在 node 上增加 PATH 項目，
  請設定 node host 服務環境（systemd/launchd），或將工具安裝到標準位置。

每個代理的 node 綁定（在 config 中使用 agent list 索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI：Nodes 分頁包含一個小型「Exec node binding」面板，用於相同設定。

## 工作階段覆寫（`/exec`）

使用 `/exec` 設定 `host`、`security`、`ask` 和 `node` 的**每工作階段**預設值。
不帶引數傳送 `/exec` 可顯示目前值。

範例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授權模型

`/exec` 只會對**已授權的傳送者**生效（channel allowlists/pairing 加上 `commands.useAccessGroups`）。
它只會更新**工作階段狀態**，不會寫入 config。若要硬性停用 exec，請透過工具
政策（`tools.deny: ["exec"]` 或每代理設定）拒絕它。除非你明確設定
`security=full` 和 `ask=off`，否則主機核准仍會套用。

## Exec approvals（companion app / node host）

沙箱化代理可以在 `exec` 於 gateway 或 node host 上執行前，要求每次請求核准。
請參閱 [Exec approvals](/zh-TW/tools/exec-approvals)，了解政策、allowlist 和 UI 流程。

需要核准時，exec 工具會立即回傳
`status: "approval-pending"` 和一個 approval id。核准後（或拒絕 / 逾時後），
Gateway 會發出系統事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 後仍在執行，會發出單一 `Exec running` 通知。
在具備原生核准卡片/按鈕的 channels 上，代理應優先依賴該
原生 UI，且只有當工具
結果明確表示聊天核准不可用，或手動核准是唯一途徑時，才包含手動 `/approve` 命令。

## Allowlist + safe bins

手動 allowlist 強制執行會比對解析後的二進位檔路徑 glob 和裸命令名稱
glob。裸名稱只會比對透過 PATH 呼叫的命令，因此當命令是 `rg` 時，`rg` 可以比對
`/opt/homebrew/bin/rg`，但不會比對 `./rg` 或 `/tmp/rg`。
當 `security=allowlist` 時，只有每個 pipeline
segment 都在 allowlist 中或是 safe bin 時，shell 命令才會自動允許。鏈接（`;`、`&&`、`||`）和重新導向
會在 allowlist 模式中被拒絕，除非每個頂層 segment 都符合
allowlist（包含 safe bins）。重新導向仍不受支援。
持久的 `allow-always` 信任不會繞過該規則：鏈接命令仍需要每個
頂層 segment 都符合。

`autoAllowSkills` 是 exec approvals 中獨立的便利路徑。它與
手動路徑 allowlist 項目不同。若要嚴格的明確信任，請保持停用 `autoAllowSkills`。

將這兩個控制項用於不同工作：

- `tools.exec.safeBins`：小型、僅 stdin 的串流篩選器。
- `tools.exec.safeBinTrustedDirs`：safe-bin 可執行檔路徑的明確額外受信任目錄。
- `tools.exec.safeBinProfiles`：自訂 safe bins 的明確 argv 政策。
- allowlist：可執行檔路徑的明確信任。

請勿將 `safeBins` 視為通用允許清單，也不要新增直譯器/執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要這些項目，請使用明確的允許清單項目，並保持啟用核准提示。
當直譯器/執行階段的 `safeBins` 項目缺少明確設定檔時，`openclaw security audit` 會發出警告，而 `openclaw doctor --fix` 可以替缺少的自訂 `safeBinProfiles` 項目建立骨架。
當你明確將 `jq` 等具有廣泛行為的二進位檔加回 `safeBins` 時，`openclaw security audit` 和 `openclaw doctor` 也會發出警告。
如果你明確將直譯器加入允許清單，請啟用 `tools.exec.strictInlineEval`，讓內嵌程式碼求值形式仍需要新的核准。

如需完整政策細節與範例，請參閱 [Exec 核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全二進位檔與允許清單](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

輪詢用於隨選狀態查詢，而不是等待迴圈。如果已啟用自動完成喚醒，命令在輸出內容或失敗時可以喚醒工作階段。

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
它預設對 OpenAI 和 OpenAI Codex 模型啟用。只有在你想停用它，或限制它只能用於特定模型時，才需要使用設定：

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
- 設定位於 `tools.exec.applyPatch` 底下。
- `tools.exec.applyPatch.enabled` 預設為 `true`；將它設為 `false` 可對 OpenAI 模型停用此工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限於工作區內）。只有在你有意讓 `apply_patch` 在工作區目錄之外寫入/刪除時，才將它設為 `false`。

## 相關內容

- [Exec 核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙箱化](/zh-TW/gateway/sandboxing) — 在沙箱化環境中執行命令
- [背景程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 和 process 工具
- [安全性](/zh-TW/gateway/security) — 工具政策與提升權限存取
