---
read_when:
    - 使用或修改 exec 工具
    - 偵錯 stdin 或 TTY 行為
summary: Exec 工具使用方式、stdin 模式與 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-05-02T22:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 Shell 命令。透過 `process` 支援前景與背景執行。
如果不允許使用 `process`，`exec` 會同步執行並忽略 `yieldMs`/`background`。
背景工作階段以每個代理為範圍；`process` 只會看到來自同一代理的工作階段。

## 參數

<ParamField path="command" type="string" required>
要執行的 Shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目錄。
</ParamField>

<ParamField path="env" type="object">
合併在繼承環境之上的鍵/值環境覆寫。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延遲時間（毫秒）後自動將命令放入背景。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即將命令放入背景，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆寫此次呼叫設定的 exec 逾時。只有在命令應在沒有 exec 程序逾時限制下執行時，才設定 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用時在虛擬終端機中執行。用於僅限 TTY 的 CLI、編碼代理與終端機 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。當沙箱執行階段處於作用中時，`auto` 會解析為 `sandbox`，否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 執行的強制執行模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 執行的核准提示行為。
</ParamField>

<ParamField path="node" type="string">
`host=node` 時的 Node ID/名稱。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
要求提升模式 — 逃出沙箱到設定的主機路徑。只有在 elevated 解析為 `full` 時，才會強制 `security=full`。
</ParamField>

注意事項：

- `host` 預設為 `auto`：當工作階段的沙箱執行階段處於作用中時使用沙箱，否則使用 Gateway。
- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前遭到拒絕。
- `auto` 是預設路由策略，不是萬用字元。從 `auto` 允許逐次呼叫使用 `host=node`；只有在沒有作用中的沙箱執行階段時，才允許逐次呼叫使用 `host=gateway`。
- 不需要額外設定，`host=auto` 仍然「直接可用」：沒有沙箱時會解析為 `gateway`；有即時沙箱時會留在沙箱中。
- `elevated` 會逃出沙箱到設定的主機路徑：預設為 `gateway`，或在 `tools.exec.host=node`（或工作階段預設為 `host=node`）時為 `node`。只有目前工作階段/供應者啟用提升存取權時才可用。
- `gateway`/`node` 核准由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配對的 Node（配套應用程式或無頭 Node 主機）。
- 如果有多個 Node 可用，請設定 `exec.node` 或 `tools.exec.node` 以選擇其中一個。
- `exec host=node` 是 Node 唯一的 Shell 執行路徑；舊版 `nodes.run` 包裝器已移除。
- `timeout` 適用於前景、背景、`yieldMs`、Gateway、沙箱與 Node `system.run` 執行。如果省略，OpenClaw 會使用 `tools.exec.timeoutSec`；明確設定 `timeout: 0` 會停用該次呼叫的 exec 程序逾時。
- 在非 Windows 主機上，exec 會在設定時使用 `SHELL`；如果 `SHELL` 是 `fish`，它會優先從 `PATH` 使用 `bash`（或 `sh`），以避免與 fish 不相容的指令碼，若兩者都不存在則退回使用 `SHELL`。
- 在 Windows 主機上，exec 會優先探索 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然後是 PATH），接著退回 Windows PowerShell 5.1。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 與載入器覆寫（`LD_*`/`DYLD_*`），以防止二進位檔劫持或注入程式碼。
- OpenClaw 會在衍生的命令環境中（包含 PTY 與沙箱執行）設定 `OPENCLAW_SHELL=exec`，讓 Shell/設定檔規則可偵測 exec 工具情境。
- `openclaw channels login` 會被 `exec` 封鎖，因為它是互動式頻道驗證流程；請在 Gateway 主機上的終端機中執行，或在有頻道原生登入工具時從聊天中使用。
- 重要：沙箱預設為**關閉**。如果沙箱關閉，隱含的 `host=auto` 會解析為 `gateway`。明確的 `host=sandbox` 仍會封閉失敗，而不是靜默地在 Gateway 主機上執行。請啟用沙箱，或搭配核准使用 `host=gateway`。
- 指令碼預檢檢查（針對常見 Python/Node Shell 語法錯誤）只會檢查有效 `workdir` 邊界內的檔案。如果指令碼路徑解析到 `workdir` 之外，該檔案會略過預檢。
- 對於現在開始的長時間執行工作，請啟動一次，並在啟用自動完成喚醒且命令輸出內容或失敗時依賴它。使用 `process` 取得記錄、狀態、輸入或介入；不要用睡眠迴圈、逾時迴圈或重複輪詢來模擬排程。
- 對於應該稍後或按排程發生的工作，請使用 cron，而不是 `exec` 睡眠/延遲模式。

## 設定

- `tools.exec.notifyOnExit`（預設：true）：為 true 時，放入背景的 exec 工作階段會在結束時將系統事件加入佇列並要求 Heartbeat。
- `tools.exec.approvalRunningNoticeMs`（預設：10000）：當受核准控管的 exec 執行時間超過此值時，發出單一「執行中」通知（0 會停用）。
- `tools.exec.timeoutSec`（預設：1800）：每個命令的預設 exec 逾時秒數。逐次呼叫的 `timeout` 會覆寫它；逐次呼叫的 `timeout: 0` 會停用 exec 程序逾時。
- `tools.exec.host`（預設：`auto`；當沙箱執行階段處於作用中時解析為 `sandbox`，否則解析為 `gateway`）
- `tools.exec.security`（預設：沙箱為 `deny`；未設定時，Gateway + Node 為 `full`）
- `tools.exec.ask`（預設：`off`）
- Gateway + Node 預設為不需核准的主機 exec。如果你想要核准/允許清單行為，請同時收緊 `tools.exec.*` 與主機 `~/.openclaw/exec-approvals.json`；請參閱 [Exec 核准](/zh-TW/tools/exec-approvals#yolo-mode-no-approval)。
- YOLO 來自主機政策預設值（`security=full`、`ask=off`），不是來自 `host=auto`。如果你想強制 Gateway 或 Node 路由，請設定 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加上 `ask=off` 模式中，主機 exec 會直接遵循設定的政策；沒有額外的啟發式命令混淆預篩選或指令碼預檢拒絕層。
- `tools.exec.node`（預設：未設定）
- `tools.exec.strictInlineEval`（預設：false）：為 true 時，內嵌直譯器 eval 形式，例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 與 `osascript -e` 一律需要明確核准。`allow-always` 仍可持久保留良性的直譯器/指令碼呼叫，但內嵌 eval 形式每次仍會提示。
- `tools.exec.pathPrepend`：要前置到 exec 執行的 `PATH` 的目錄清單（僅限 Gateway + 沙箱）。
- `tools.exec.safeBins`：可在沒有明確允許清單項目的情況下執行的僅 stdin 安全二進位檔。如需行為詳細資訊，請參閱 [安全二進位檔](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：額外明確信任的目錄，用於 `safeBins` 路徑檢查。`PATH` 項目永遠不會自動受信任。內建預設值為 `/bin` 與 `/usr/bin`。
- `tools.exec.safeBinProfiles`：每個安全二進位檔的可選自訂 argv 政策（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

### `PATH` 處理

- `host=gateway`：將你的登入 Shell `PATH` 合併到 exec 環境中。主機執行會拒絕 `env.PATH` 覆寫。Daemon 本身仍以最小 `PATH` 執行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器內執行 `sh -lc`（登入 Shell），因此 `/etc/profile` 可能會重設 `PATH`。OpenClaw 會在設定檔來源處理後，透過內部環境變數前置 `env.PATH`（無 Shell 插值）；`tools.exec.pathPrepend` 也會在此套用。
- `host=node`：只有你傳入且未被封鎖的 env 覆寫會傳送到 Node。主機執行會拒絕 `env.PATH` 覆寫，且 Node 主機會忽略它們。如果你需要在 Node 上加入其他 PATH 項目，請設定 Node 主機服務環境（systemd/launchd），或將工具安裝到標準位置。

每個代理的 Node 繫結（在設定中使用代理清單索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 分頁包含一個小型「Exec Node 繫結」面板，可設定相同選項。

## 工作階段覆寫（`/exec`）

使用 `/exec` 設定 `host`、`security`、`ask` 與 `node` 的**每個工作階段**預設值。
傳送不含引數的 `/exec` 可顯示目前值。

範例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授權模型

`/exec` 只會對**已授權的傳送者**生效（頻道允許清單/配對加上 `commands.useAccessGroups`）。
它只會更新**工作階段狀態**，不會寫入設定。若要硬性停用 exec，請透過工具政策拒絕它（`tools.deny: ["exec"]` 或逐代理設定）。除非你明確設定 `security=full` 與 `ask=off`，否則主機核准仍會套用。

## Exec 核准（配套應用程式 / Node 主機）

沙箱代理可要求在 `exec` 於 Gateway 或 Node 主機上執行前進行逐次請求核准。
請參閱 [Exec 核准](/zh-TW/tools/exec-approvals) 了解政策、允許清單與 UI 流程。

需要核准時，exec 工具會立即傳回 `status: "approval-pending"` 與核准 ID。一旦核准（或拒絕/逾時），Gateway 會發出系統事件（`Exec finished` / `Exec denied`）。如果命令在 `tools.exec.approvalRunningNoticeMs` 後仍在執行，會發出單一 `Exec running` 通知。在具備原生核准卡片/按鈕的頻道上，代理應先依賴該原生 UI，且只有在工具結果明確表示聊天核准不可用或手動核准是唯一途徑時，才包含手動 `/approve` 命令。

## 允許清單 + 安全二進位檔

手動允許清單強制執行會比對解析後的二進位檔路徑 glob 與裸命令名稱 glob。裸名稱只會比對透過 PATH 呼叫的命令，因此當命令是 `rg` 時，`rg` 可比對 `/opt/homebrew/bin/rg`，但不會比對 `./rg` 或 `/tmp/rg`。當 `security=allowlist` 時，只有在每個管線片段都在允許清單中或是安全二進位檔時，Shell 命令才會自動允許。鏈接（`;`、`&&`、`||`）與重新導向在允許清單模式中會遭到拒絕，除非每個頂層片段都符合允許清單（包含安全二進位檔）。重新導向仍不受支援。持久的 `allow-always` 信任不會繞過該規則：鏈接命令仍需要每個頂層片段都相符。

`autoAllowSkills` 是 exec 核准中的另一個便利路徑。它不等同於手動路徑允許清單項目。若要嚴格明確信任，請保持停用 `autoAllowSkills`。

針對不同工作使用這兩個控制項：

- `tools.exec.safeBins`：小型、僅 stdin 的串流篩選器。
- `tools.exec.safeBinTrustedDirs`：安全二進位檔可執行檔路徑的明確額外信任目錄。
- `tools.exec.safeBinProfiles`：自訂安全二進位檔的明確 argv 政策。
- 允許清單：對可執行檔路徑的明確信任。

請勿將 `safeBins` 視為通用允許清單，也不要加入直譯器/執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。如果需要這些項目，請使用明確的允許清單項目，並保持核准提示啟用。
當直譯器/執行階段的 `safeBins` 項目缺少明確設定檔時，`openclaw security audit` 會發出警告，而 `openclaw doctor --fix` 可以建立缺少的自訂 `safeBinProfiles` 項目骨架。
當你明確將 `jq` 這類廣泛行為的 bin 加回 `safeBins` 時，`openclaw security audit` 和 `openclaw doctor` 也會發出警告。
如果你明確允許列出直譯器，請啟用 `tools.exec.strictInlineEval`，讓內嵌程式碼求值形式仍然需要新的核准。

完整政策詳細資料與範例，請參閱[執行核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)和[安全 bin 與允許清單](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

輪詢用於按需狀態，而不是等待迴圈。如果已啟用自動完成喚醒，命令在輸出內容或失敗時可以喚醒工作階段。

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

貼上（預設使用括號模式）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用於結構化多檔案編輯。
OpenAI 和 OpenAI Codex 模型預設會啟用它。只有在你想停用它，或將它限制為特定模型時才使用設定：

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
- `tools.exec.applyPatch.enabled` 預設為 `true`；將它設為 `false` 可停用 OpenAI 模型的此工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制在工作區內）。只有在你刻意希望 `apply_patch` 寫入/刪除工作區目錄外的內容時，才將它設為 `false`。

## 相關內容

- [執行核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙箱化](/zh-TW/gateway/sandboxing) — 在沙箱環境中執行命令
- [背景程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 和 process 工具
- [安全性](/zh-TW/gateway/security) — 工具政策與提升權限
