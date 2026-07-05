---
read_when:
    - 使用或修改 exec 工具
    - 偵錯 stdin 或 TTY 行為
summary: Exec 工具用法、stdin 模式與 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-07-05T11:50:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64121c1affd7d44ebac49b2cd1986ad393e90a52ddc66d4ddefdfecb4bffa17b
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 shell 命令。`exec` 是可變更的 shell 介面：只要所選主機或沙盒檔案系統允許，命令就可以在任何位置建立、編輯或刪除檔案。停用 OpenClaw 檔案系統工具，例如 `write`、`edit` 或 `apply_patch`，並不會讓 `exec` 變成唯讀。

透過 `process` 支援前景與背景執行。如果 `process` 被禁止，`exec` 會同步執行，並忽略 `yieldMs`/`background`。背景工作階段以每個代理為範圍；`process` 只會看到同一個代理的工作階段。

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
在此延遲後自動將命令移至背景（毫秒）。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即將命令移至背景，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆寫此呼叫已設定的 exec 逾時，以秒為單位。適用於前景、背景、`yieldMs`、閘道、沙盒和節點 `system.run` 執行。`timeout: 0` 會停用該呼叫的 exec 程序逾時。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用時在偽終端機中執行。用於僅限 TTY 的命令列介面、程式代理和終端使用者介面。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。當沙盒執行階段作用中時，`auto` 解析為 `sandbox`，否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
一般工具呼叫會忽略此設定。`gateway`/`node` 安全性由 `tools.exec.security` 和主機核准檔控制；只有在操作員明確授予提升存取權時，提升模式才能強制 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基準詢問模式來自 `tools.exec.ask` 和主機核准。對於源自頻道的模型呼叫，當有效主機詢問為 `off` 時，會忽略每次呼叫的 `ask`；否則它只能收緊為更嚴格的模式。以明確 `ask` 值建構 exec 工具的受信任內部/API 呼叫者不受影響。
</ParamField>

<ParamField path="node" type="string">
當 `host=node` 時的節點 ID/名稱。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
要求提升模式：跳出沙盒到已設定的主機路徑。只有在 elevated 解析為 `full` 時，才會強制 `security=full`。
</ParamField>

注意事項：

- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前被拒絕。
- 每次呼叫的 `host=node` 可從 `auto` 使用；每次呼叫的 `host=gateway` 只有在沒有作用中的沙盒執行階段時才允許。
- 沒有額外設定時，`host=auto` 仍會「直接可用」：沒有沙盒表示它解析為 `gateway`；有執行中的沙盒表示它留在沙盒中。
- `elevated` 會跳出沙盒到已設定的主機路徑：預設為 `gateway`，或當 `tools.exec.host=node`（或工作階段預設為 `host=node`）時為 `node`。只有在目前工作階段/供應者啟用提升存取權時才可用。
- `gateway`/`node` 核准由主機核准檔控制。
- `node` 需要配對的節點（伴隨應用程式或無頭節點主機）。如果有多個節點可用，請設定 `exec.node` 或 `tools.exec.node` 來選擇其中之一。
- `exec host=node` 是節點唯一的 shell 執行路徑；舊版 `nodes.run` 包裝器已移除。
- 在非 Windows 主機上，exec 會在設定 `SHELL` 時使用它；如果 `SHELL` 是 `fish`，它會優先使用 `PATH` 中的 `bash`（或 `sh`）以避免與 fish 不相容的 bash 慣用語法，若兩者皆不存在，則退回使用 `SHELL`。
- 在 Windows 主機上，exec 會優先探索 PowerShell 7 (`pwsh`)（Program Files、ProgramW6432，然後是 PATH），接著退回 Windows PowerShell 5.1。
- 在非 Windows 閘道主機上，bash 和 zsh exec 命令會使用啟動快照。OpenClaw 會從 shell 啟動檔中擷取可 source 的別名/函式與一組小型安全環境到 `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，然後在每個 exec 命令前 source 該快照。看似秘密的變數會被排除；沙盒和節點 exec 不使用此快照。在 Gateway 程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 可停用此快照路徑。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 和載入器覆寫（`LD_*`/`DYLD_*`），以防止二進位劫持或注入程式碼。
- OpenClaw 會在產生的命令環境中設定 `OPENCLAW_SHELL=exec`（包含 PTY 和沙盒執行），讓 shell/profile 規則能偵測 exec 工具情境。
- 對於源自頻道的執行，當頻道提供這些 ID 時，OpenClaw 也會在 `OPENCLAW_CHANNEL_CONTEXT` 中公開窄範圍的傳送者/聊天身分 JSON 酬載。
- `exec` 無法執行 `openclaw channels login` 或 `/approve` shell 命令：`openclaw channels login` 是互動式頻道驗證流程，而 `/approve` 需要透過核准命令處理器，不是 shell。請在閘道主機的終端機中執行頻道登入，或在存在時使用頻道專用登入代理工具（例如 `whatsapp_login`）。
- 重要：沙盒預設為**關閉**。如果沙盒關閉，隱含的 `host=auto` 會解析為 `gateway`。明確的 `host=sandbox` 仍會失敗關閉，而不是默默在閘道主機上執行。請啟用沙盒，或搭配核准使用 `host=gateway`。
- 指令碼預檢查（針對常見 Python/節點 shell 語法錯誤）只會檢查有效 `workdir` 邊界內的檔案。如果指令碼路徑解析到 `workdir` 之外，該檔案會略過預檢。當 `host=gateway` 且有效政策為 `security=full` 搭配 `ask=off` 時，預檢也會完全略過。
- 對於現在開始的長時間工作，請啟動一次，並在啟用自動完成喚醒且命令輸出或失敗時依賴它。使用 `process` 查看記錄、狀態、輸入或介入；不要用 sleep 迴圈、逾時迴圈或重複輪詢來模擬排程。
- 對於應稍後或依排程發生的工作，請使用排程，而不是 `exec` sleep/延遲模式。

## 設定

| 鍵                                   | 預設                                                   | 注意事項                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | 每個命令的預設 exec 逾時，以秒為單位。每次呼叫的 `timeout` 會覆寫它；每次呼叫的 `timeout: 0` 會停用 exec 程序逾時。                  |
| `tools.exec.host`                    | `auto`                                                 | 當沙盒執行階段作用中時解析為 `sandbox`，否則解析為 `gateway`。                                                                            |
| `tools.exec.security`                | 沙盒為 `deny`，未設定時閘道/節點為 `full`             |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | 未設定                                                 | 正規化的政策旋鈕。請參閱下方的[模式](#modes)。不能與 `tools.exec.security`/`tools.exec.ask` 結合使用。                                      |
| `tools.exec.node`                    | 未設定                                                 |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | 為 true 時，背景化的 exec 工作階段會在結束時排入系統事件並要求心跳偵測。                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 當受核准控管的 exec 執行超過此時間時，發出單一「執行中」通知（`0` 會停用）。                                                        |
| `tools.exec.strictInlineEval`        | `false`                                                | 請參閱[內嵌 eval](#inline-eval-strictinlineeval)。                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | 為 true 時，核准提示可以在命令文字中醒目提示剖析器衍生的命令片段。可全域或按代理設定；不會變更核准政策。 |
| `tools.exec.pathPrepend`             | 未設定                                                 | 要前置到 exec 執行 `PATH` 的目錄清單（僅限閘道 + 沙盒）。                                                                        |
| `tools.exec.safeBins`                | 未設定                                                 | 僅限 stdin 的安全二進位檔，可在沒有明確 allowlist 項目的情況下執行。請參閱[安全二進位檔](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | 額外明確信任的目錄，用於 `safeBins` 路徑檢查。`PATH` 項目絕不會自動受信任。                                              |
| `tools.exec.safeBinProfiles`         | 未設定                                                 | 每個安全二進位檔的選用自訂 argv 政策（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                                        |

無需核准的主機 exec 是閘道與節點的預設值（`security=full`、`ask=off`）——這來自主機政策預設，而不是 `host=auto`。如果你想要核准/allowlist 行為，請同時收緊 `tools.exec.*` 和主機核准檔；請參閱 [Exec 核准](/zh-TW/tools/exec-approvals#yolo-mode-no-approval)。若要不受沙盒狀態影響而強制閘道或節點路由，請設定 `tools.exec.host` 或使用 `/exec host=...`。

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

### 模式

`tools.exec.mode` 是正規化的政策旋鈕。設定它會衍生 `security`/`ask`，且不能與明確的 `tools.exec.security`/`tools.exec.ask` 結合使用。

| 模式        | security    | ask       | 行為                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Exec 會被拒絕。                                                                                                                |
| `allowlist` | `allowlist` | `off`     | 只執行已列入允許清單/安全二進位檔的命令；其他一律不詢問。                                                                 |
| `ask`       | `allowlist` | `on-miss` | 符合允許清單的項目會直接執行；其他所有項目都會詢問真人。                                                                  |
| `auto`      | `allowlist` | `on-miss` | 符合允許清單/安全二進位檔的項目會直接執行；其他所有項目會先經由 OpenClaw 的原生自動審閱器，再詢問真人。 |
| `full`      | `full`      | `off`     | 沒有核准閘門。                                                                                                              |

`ask`/`ask=always` 仍會每次都詢問真人，無論模式為何。

### 行內 eval (`strictInlineEval`)

當 `tools.exec.strictInlineEval` 為 `true` 時，行內直譯器 eval 形式需要審閱者或明確核准：`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e`，以及其他支援的直譯器和命令承載器中的類似形式（`awk`、`find -exec`、`make`、`sed`、`xargs` 等）。在 `mode=auto` 中，正常的 exec 核准路徑可能會讓原生自動審閱器允許明確低風險的一次性命令；直接的節點主機 `system.run` 呼叫仍需要明確核准，因為它們無法把命令交給真人核准路徑。如果審閱器要求，請求會送給真人。`allow-always` 仍可持久保存良性的直譯器/腳本叫用，但行內 eval 形式不會變成持久的允許規則。

### PATH 處理

- `host=gateway`：將你的登入 shell `PATH` 合併到 exec 環境中。主機執行會拒絕 `env.PATH` 覆寫。daemon 本身仍以最小 `PATH` 執行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
  - 為了防止使用者 shell 設定（例如 `~/.zshenv` 或 `/etc/zshenv`）在啟動期間覆寫優先路徑，`tools.exec.pathPrepend` 項目會在執行前，於 shell 命令內安全地前置到最終的 `PATH`。
- `host=sandbox`：在容器內執行 `sh -lc`（登入 shell），因此 `/etc/profile` 可能會重設 `PATH`。OpenClaw 會在 profile 載入後，透過內部 env var 前置 `env.PATH`（無 shell 插值）；`tools.exec.pathPrepend` 在此也適用。
- `host=node`：只會把你傳入且未被封鎖的 env 覆寫送到節點。主機執行會拒絕 `env.PATH` 覆寫，且節點主機會忽略它們。如果你需要在節點上加入額外的 PATH 項目，請設定節點主機服務環境（systemd/launchd），或將工具安裝在標準位置。

每個代理的節點繫結（在 config 中使用代理清單索引）：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

控制 UI：Nodes 分頁包含一個小型「Exec 節點繫結」面板，可用於相同設定。

## 工作階段覆寫 (`/exec`)

使用 `/exec` 設定 **每個工作階段** 的 `host`、`security`、`ask` 和 `node` 預設值。傳送不含引數的 `/exec` 可顯示目前值。

範例：

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` 只會對 **已授權的傳送者** 生效（頻道允許清單/配對，加上 `commands.useAccessGroups`）。它只會更新 **工作階段狀態**，不會寫入 config。已授權的外部頻道傳送者可以設定這些工作階段預設值。內部閘道/webchat 用戶端需要 `operator.admin` 才能持久保存它們。

若要硬性停用 exec，請透過工具政策拒絕它（`tools.deny: ["exec"]` 或針對每個代理設定）。除非你明確設定 `security=full` 和 `ask=off`，否則主機核准仍會適用。

## Exec 核准（配套應用程式 / 節點主機）

沙盒代理可以要求在 `exec` 於閘道或節點主機上執行前，先進行每次請求的核准。政策、允許清單和 UI 流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

需要核准時，exec 工具會立即回傳 `status: "approval-pending"` 和核准 ID。一旦核准（或拒絕/逾時），閘道只會針對已核准的執行發出命令進度與完成系統事件（`Exec running` / `Exec finished`）。遭拒絕或逾時的核准屬於終止狀態，且不會以拒絕系統事件喚醒代理工作階段。

在具有原生核准卡片/按鈕的頻道上，代理應優先依賴該原生 UI，且只有在工具結果明確表示聊天核准不可用或手動核准是唯一路徑時，才包含手動 `/approve` 命令。

## 允許清單 + 安全二進位檔

手動允許清單強制執行會比對已解析的二進位檔路徑 glob 和裸命令名稱 glob。裸名稱只會比對透過 PATH 叫用的命令，因此當命令是 `rg` 時，`rg` 可以比對 `/opt/homebrew/bin/rg`，但不會比對 `./rg` 或 `/tmp/rg`。

當 `security=allowlist` 時，只有在每個管線片段都列入允許清單或屬於安全二進位檔時，shell 命令才會自動允許。在允許清單模式中，除非每個頂層片段都符合允許清單（包含安全二進位檔），否則鏈接（`;`、`&&`、`||`）和重新導向會被拒絕。重新導向仍不受支援。持久的 `allow-always` 信任不會繞過該規則：鏈接命令仍需要每個頂層片段都符合。

`autoAllowSkills` 是 exec 核准中的獨立便利路徑，並不等同於手動路徑允許清單項目。若要嚴格的明確信任，請保持停用 `autoAllowSkills`。

針對不同工作使用這兩種控制：

- `tools.exec.safeBins`：小型、僅 stdin 的串流篩選器。
- `tools.exec.safeBinTrustedDirs`：安全二進位檔可執行路徑的明確額外受信任目錄。
- `tools.exec.safeBinProfiles`：自訂安全二進位檔的明確 argv 政策。
- 允許清單：對可執行檔路徑的明確信任。

不要把 `safeBins` 當作通用允許清單，也不要加入直譯器/執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要這些，請使用明確的允許清單項目，並保持啟用核准提示。

當直譯器/執行階段 `safeBins` 項目缺少明確 profile 時，`openclaw security audit` 會發出警告，而 `openclaw doctor --fix` 可以搭建缺少的自訂 `safeBinProfiles` 項目。當你明確將 `jq` 這類廣泛行為的二進位檔加回 `safeBins` 時，`openclaw security audit` 和 `openclaw doctor` 也會發出警告（`jq` 支援廣泛的程式和內建功能，因此請改用明確的允許清單項目或需要核准閘門的執行）。如果你明確允許直譯器，請啟用 `tools.exec.strictInlineEval`，讓行內 code-eval 形式仍需要審閱者或明確核准。

完整政策細節和範例請參閱 [Exec 核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全二進位檔與允許清單](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

輪詢適用於隨選狀態，而不是等待迴圈。如果啟用自動完成喚醒，命令在發出輸出或失敗時可以喚醒工作階段。

傳送按鍵（tmux 風格）：

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交（只傳送 CR）：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上（預設以 bracketed 模式）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用於結構化的多檔案編輯。它預設啟用，且可供任何模型供應商使用；`allowModels` 可以限制它。只有在你想停用它或限制它只供特定模型使用時，才使用 config：

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

- 工具政策仍會套用；`allow: ["write"]` 會隱含允許 `apply_patch`。
- `deny: ["write"]` 不會拒絕 `apply_patch`；若也應封鎖 patch 寫入，請明確拒絕 `apply_patch`，或使用 `deny: ["group:fs"]`。
- Config 位於 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 預設為 `true`；將它設為 `false` 可停用此工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制在 workspace 內）。只有在你有意讓 `apply_patch` 寫入/刪除 workspace 目錄外的內容時，才將它設為 `false`。
- `tools.exec.applyPatch.allowModels` 是可選的模型 ID 允許清單（原始 ID，例如 `gpt-5.4`，或完整 ID，例如 `openai/gpt-5.4`）。設定後，只有符合的模型會取得此工具；未設定時，所有模型都會取得它。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙盒化](/zh-TW/gateway/sandboxing) — 在沙盒環境中執行命令
- [背景程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 和 process 工具
- [安全性](/zh-TW/gateway/security) — 工具政策和提升權限
