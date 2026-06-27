---
read_when:
    - 使用或修改 exec 工具
    - 偵錯 stdin 或 TTY 行為
summary: Exec 工具用法、stdin 模式與 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-06-27T20:06:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 shell 命令。`exec` 是會變更狀態的 shell 介面：命令可以在所選主機或沙盒檔案系統允許的任何位置建立、編輯或刪除檔案。停用 OpenClaw 檔案系統工具，例如 `write`、`edit` 或 `apply_patch`，不會讓 `exec` 變成唯讀。

透過 `process` 支援前景 + 背景執行。如果不允許 `process`，`exec` 會同步執行，並忽略 `yieldMs`/`background`。
背景工作階段以每個代理程式為範圍；`process` 只會看到同一個代理程式的工作階段。

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
覆寫此呼叫已設定的 exec 逾時。只有在命令應在沒有 exec 程序逾時限制下執行時，才設定 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用時在偽終端機中執行。用於僅限 TTY 的命令列介面、程式碼代理程式和終端介面。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。當沙盒執行階段啟用時，`auto` 會解析為 `sandbox`，否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
一般工具呼叫會忽略。`gateway` / `node` 安全性由
`tools.exec.security` 和主機核准檔案控制；只有在操作員明確授予提升權限存取時，提升模式才能
強制 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基準詢問模式來自 `tools.exec.ask` 和主機核准。
對於來自頻道的模型呼叫，當有效主機詢問為 `off` 時，會忽略每次呼叫的 `ask`；否則它只能強化為更嚴格的
模式。以明確 `ask` 值建構 exec 工具的受信任內部/API 呼叫者不受影響。
</ParamField>

<ParamField path="node" type="string">
當 `host=node` 時的節點 id/名稱。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
要求提升模式 — 跳出沙盒到已設定的主機路徑。只有在 elevated 解析為 `full` 時，才會強制 `security=full`。
</ParamField>

注意：

- `host` 預設為 `auto`：工作階段的沙盒執行階段啟用時使用 sandbox，否則使用 gateway。
- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前被拒絕。
- `auto` 是預設路由策略，不是萬用字元。從 `auto` 允許每次呼叫使用 `host=node`；只有在沒有沙盒執行階段啟用時，才允許每次呼叫使用 `host=gateway`。
- `tools.exec.mode` 是正規化的政策旋鈕。值為 `deny`、`allowlist`、`ask`、`auto` 和 `full`。`auto` 會直接執行確定性的允許清單/安全二進位檔比對，並在詢問人類之前，將所有其餘 exec 核准案例路由到 OpenClaw 的原生自動審查器。`ask` / `ask=always` 仍會每次都詢問人類。
- 沒有額外設定時，`host=auto` 仍會「直接可用」：沒有沙盒表示它解析為 `gateway`；即時沙盒表示它留在沙盒中。
- `elevated` 會跳出沙盒到已設定的主機路徑：預設為 `gateway`，或當 `tools.exec.host=node`（或工作階段預設為 `host=node`）時為 `node`。只有在目前工作階段/提供者已啟用提升權限存取時才可用。
- `gateway`/`node` 核准由主機核准檔案控制。
- `node` 需要配對的節點（伴隨應用程式或無頭節點主機）。
- 如果有多個節點可用，請設定 `exec.node` 或 `tools.exec.node` 來選取其中一個。
- `exec host=node` 是節點唯一的 shell 執行路徑；舊版 `nodes.run` 包裝器已移除。
- `timeout` 適用於前景、背景、`yieldMs`、gateway、sandbox 和節點 `system.run` 執行。如果省略，OpenClaw 會使用 `tools.exec.timeoutSec`；明確的 `timeout: 0` 會停用該呼叫的 exec 程序逾時。
- 在非 Windows 主機上，exec 會在設定時使用 `SHELL`；如果 `SHELL` 是 `fish`，它會偏好從 `PATH` 使用 `bash`（或 `sh`）
  以避免 fish 不相容的指令碼，若兩者皆不存在，則退回到 `SHELL`。
- 在 Windows 主機上，exec 會偏好 PowerShell 7 (`pwsh`) 探索（Program Files、ProgramW6432，然後 PATH），
  然後退回到 Windows PowerShell 5.1。
- 在非 Windows gateway 主機上，bash 和 zsh exec 命令會使用啟動快照。OpenClaw 會從 shell 啟動檔案擷取可 source 的
  aliases/functions 和一小組安全環境到
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，然後在每個 exec 命令前 source 該快照。
  類似秘密的變數會被排除；sandbox 和 node exec 不使用此快照。請在 Gateway 程序環境中設定
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 以停用此快照路徑。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 和載入器覆寫（`LD_*`/`DYLD_*`），以
  防止二進位檔劫持或注入程式碼。
- OpenClaw 會在產生的命令環境中設定 `OPENCLAW_SHELL=exec`（包括 PTY 和 sandbox 執行），讓 shell/profile 規則可以偵測 exec 工具情境。
- 對於來自頻道的執行，當頻道提供這些 id 時，OpenClaw 也會在
  `OPENCLAW_CHANNEL_CONTEXT` 中公開狹窄的寄件者/聊天身分 JSON 酬載。
- `openclaw channels login` 會被 `exec` 封鎖，因為它是互動式頻道驗證流程；請在 gateway 主機上的終端機執行它，或在存在時從聊天使用頻道原生登入工具。
- 重要：沙盒預設為**關閉**。如果沙盒關閉，隱含的 `host=auto`
  會解析為 `gateway`。明確的 `host=sandbox` 仍會以失敗關閉，而不是靜默
  在 gateway 主機上執行。請啟用沙盒或使用帶有核准的 `host=gateway`。
- 指令碼預檢查（針對常見 Python/節點 shell 語法錯誤）只檢查有效 `workdir` 邊界內的檔案。如果指令碼路徑解析到 `workdir` 外部，則會略過該檔案的預檢。
- 對於現在開始的長時間工作，請啟動一次，並在啟用時依賴自動
  完成喚醒，以及命令輸出或失敗時的喚醒。
  使用 `process` 取得記錄、狀態、輸入或介入；不要用睡眠迴圈、逾時迴圈或重複輪詢來模擬
  排程。
- 對於稍後或依排程執行的工作，請使用排程，而不是
  `exec` 睡眠/延遲模式。

## 設定

- `tools.exec.notifyOnExit`（預設：true）：為 true 時，移至背景的 exec 工作階段會在結束時將系統事件加入佇列並要求心跳偵測。
- `tools.exec.approvalRunningNoticeMs`（預設：10000）：當受核准限制的 exec 執行時間超過此值時，發出單一「執行中」通知（0 會停用）。
- `tools.exec.timeoutSec`（預設：1800）：每個命令的預設 exec 逾時秒數。每次呼叫的 `timeout` 會覆寫它；每次呼叫的 `timeout: 0` 會停用 exec 程序逾時。
- `tools.exec.host`（預設：`auto`；沙盒執行階段啟用時解析為 `sandbox`，否則解析為 `gateway`）
- `tools.exec.security`（預設：sandbox 為 `deny`，未設定時 gateway + node 為 `full`）
- `tools.exec.ask`（預設：`off`）
- 無需核准的主機 exec 是 gateway + node 的預設值。如果你想要核准/允許清單行為，請收緊 `tools.exec.*` 和主機核准檔案；請參閱 [Exec 核准](/zh-TW/tools/exec-approvals#yolo-mode-no-approval)。
- YOLO 來自主機政策預設值（`security=full`、`ask=off`），不是來自 `host=auto`。如果你想強制 gateway 或 node 路由，請設定 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加上 `ask=off` 模式中，主機 exec 會直接遵循已設定的政策；沒有額外的啟發式命令混淆預篩選或指令碼預檢拒絕層。
- `tools.exec.node`（預設：未設定）
- `tools.exec.strictInlineEval`（預設：false）：為 true 時，內嵌直譯器 eval 形式，例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e` 需要審查者或明確核准。在 `mode=auto` 中，一般 exec 核准路徑可能允許原生自動審查器核准明顯低風險的一次性命令；直接節點主機 `system.run` 呼叫仍需要明確核准，因為它們無法將命令交給人類核准路由。如果審查者要求，請求會送交人類。`allow-always` 仍可持久保留良性的直譯器/指令碼呼叫，但內嵌 eval 形式不會成為持久允許規則。
- `tools.exec.commandHighlighting`（預設：false）：為 true 時，核准提示可以在命令文字中醒目標示由剖析器衍生的命令範圍。設定為全域或每個代理程式的 `true`，即可啟用命令文字醒目標示，而不變更 exec 核准政策。
- `tools.exec.pathPrepend`：要前置到 exec 執行 `PATH` 的目錄清單（僅限 gateway + sandbox）。
- `tools.exec.safeBins`：僅限 stdin 的安全二進位檔，可在沒有明確允許清單項目的情況下執行。行為詳細資料請參閱 [安全二進位檔](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。
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

- `host=gateway`：將你的登入 shell `PATH` 合併到 exec 環境。主機執行會拒絕 `env.PATH` 覆寫。daemon 本身仍會以最小 `PATH` 執行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
    - 為防止使用者 shell 設定（例如 `~/.zshenv` 或 `/etc/zshenv`）在啟動期間覆寫優先路徑，`tools.exec.pathPrepend` 項目會在執行前，於 shell 命令內安全地前置到最終 `PATH`。
- `host=sandbox`：在容器內執行 `sh -lc`（登入 shell），因此 `/etc/profile` 可能會重設 `PATH`。
  OpenClaw 會透過內部環境變數在 profile sourcing 後前置 `env.PATH`（沒有 shell 插值）；
  `tools.exec.pathPrepend` 也適用於此。
- `host=node`：只會將你傳入的未封鎖 env 覆寫送到節點。主機執行會拒絕 `env.PATH` 覆寫，節點主機也會忽略它們。如果你需要節點上的其他 PATH 項目，
  請設定節點主機服務環境（systemd/launchd）或將工具安裝在標準位置。

每個代理程式的節點繫結（在設定中使用代理程式清單索引）：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

控制介面：Nodes 分頁包含一個小型「Exec 節點繫結」面板，用於相同設定。

## 工作階段覆寫（`/exec`）

使用 `/exec` 設定 `host`、`security`、`ask` 和 `node` 的**每個工作階段**預設值。
不帶引數傳送 `/exec` 可顯示目前值。

範例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授權模型

`/exec` 只會對**授權傳送者**生效（通道允許清單/配對加上 `commands.useAccessGroups`）。
它只更新**工作階段狀態**，不會寫入設定。授權的外部通道傳送者可以
設定這些工作階段預設值。內部閘道/webchat 用戶端需要 `operator.admin` 才能持久儲存它們。
若要強制停用 exec，請透過工具政策拒絕它（`tools.deny: ["exec"]` 或依代理設定）。主機核准
仍會套用，除非你明確設定 `security=full` 和 `ask=off`。

## Exec 核准（配套應用程式 / 節點主機）

沙盒化代理可以要求在 `exec` 於閘道或節點主機上執行前，逐次請求核准。
政策、允許清單和 UI 流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

需要核准時，exec 工具會立即傳回
`status: "approval-pending"` 和核准 id。核准後（或被拒絕 / 逾時後），
閘道只會針對已核准的執行發出命令進度和完成系統事件
（`Exec running` / `Exec finished`）。被拒絕或逾時的核准是終止狀態，不會
以拒絕系統事件喚醒代理工作階段。
在支援原生核准卡片/按鈕的通道上，代理應優先依賴該
原生 UI，且只有在工具結果明確表示聊天核准不可用，或手動核准是
唯一途徑時，才包含手動 `/approve` 命令。

## 允許清單 + 安全二進位檔

手動允許清單強制執行會比對解析後的二進位檔路徑 glob 和裸命令名稱
glob。裸名稱只會比對透過 PATH 呼叫的命令，因此當命令是 `rg` 時，`rg` 可以比對
`/opt/homebrew/bin/rg`，但不會比對 `./rg` 或 `/tmp/rg`。
當 `security=allowlist` 時，只有在每個管線
片段都列入允許清單或是安全二進位檔時，shell 命令才會自動允許。串接（`;`、`&&`、`||`）和重新導向
在允許清單模式中會被拒絕，除非每個頂層片段都符合
允許清單（包括安全二進位檔）。重新導向仍不受支援。
持久的 `allow-always` 信任不會繞過該規則：串接命令仍要求每個
頂層片段都符合。

`autoAllowSkills` 是 exec 核准中的另一個便利路徑。它不同於
手動路徑允許清單項目。若要嚴格的明確信任，請保持停用 `autoAllowSkills`。

請將這兩種控制用於不同工作：

- `tools.exec.safeBins`：小型、僅 stdin 的串流過濾器。
- `tools.exec.safeBinTrustedDirs`：安全二進位檔可執行路徑的明確額外信任目錄。
- `tools.exec.safeBinProfiles`：自訂安全二進位檔的明確 argv 政策。
- allowlist：可執行路徑的明確信任。

不要把 `safeBins` 當成通用允許清單，也不要加入直譯器/執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要這些，請使用明確允許清單項目，並保持啟用核准提示。
當直譯器/執行階段 `safeBins` 項目缺少明確設定檔時，`openclaw security audit` 會警告，而 `openclaw doctor --fix` 可以搭建缺少的自訂 `safeBinProfiles` 項目。
當你明確將 `jq` 等寬泛行為二進位檔加回 `safeBins` 時，`openclaw security audit` 和 `openclaw doctor` 也會警告。
如果你明確允許直譯器，請啟用 `tools.exec.strictInlineEval`，使內嵌程式碼求值形式仍需要審查者或明確核准。

完整政策細節與範例請參閱 [Exec 核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全二進位檔與允許清單](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

輪詢用於隨選狀態，而不是等待迴圈。如果已啟用自動完成喚醒，
命令在發出輸出或失敗時可以喚醒工作階段。

傳送按鍵（tmux 樣式）：

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交（只傳送 CR）：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上（預設使用括號貼上模式）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用於結構化多檔案編輯。
它預設為 OpenAI 和 OpenAI Codex 模型啟用。只有在你想停用它，或將它限制於特定模型時，
才需要使用設定：

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
- 工具政策仍會套用；`allow: ["write"]` 會隱含允許 `apply_patch`。
- `deny: ["write"]` 不會拒絕 `apply_patch`；請明確拒絕 `apply_patch`，或在修補寫入也應被封鎖時使用 `deny: ["group:fs"]`。
- 設定位於 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 預設為 `true`；將其設為 `false` 可停用 OpenAI 模型的工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限定於工作區內）。只有在你有意讓 `apply_patch` 寫入/刪除工作區目錄之外的內容時，才將它設為 `false`。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙盒化](/zh-TW/gateway/sandboxing) — 在沙盒化環境中執行命令
- [背景程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 和 process 工具
- [安全性](/zh-TW/gateway/security) — 工具政策和提升權限
