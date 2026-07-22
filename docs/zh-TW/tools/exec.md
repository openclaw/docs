---
read_when:
    - 使用或修改 exec 工具
    - 偵錯標準輸入或 TTY 行為
summary: Exec 工具用法、標準輸入模式與 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-07-22T10:49:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c16b5122c527c069a4d1a0c1649726073339e95b9084100c1a0f45ebcae759d
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 shell 命令。`exec` 是可變更內容的 shell 介面：只要所選主機或沙箱檔案系統允許，命令便可建立、編輯或刪除任何位置的檔案。停用 OpenClaw 檔案系統工具（例如 `write`、`edit` 或 `apply_patch`）不會使 `exec` 變成唯讀。

透過 `process` 支援前景與背景執行。如果不允許 `process`，`exec` 會同步執行，並忽略 `yieldMs`/`background`。背景工作階段的範圍限定於各代理程式；`process` 只能看到同一代理程式的工作階段。

## 參數

<ParamField path="command" type="string" required>
要執行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目錄。
</ParamField>

<ParamField path="env" type="object">
合併至繼承環境之上的鍵／值環境覆寫。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
經過此延遲時間（毫秒）後，自動將命令轉至背景執行。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即在背景執行命令，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSeconds">
覆寫此呼叫已設定的 exec 逾時秒數。適用於前景、背景、`yieldMs`、閘道、沙箱和節點 `system.run` 執行。`timeout: 0` 會停用該呼叫的 exec 程序逾時。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用時在虛擬終端機中執行。適用於僅支援 TTY 的命令列介面、程式設計代理程式和終端使用者介面。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。沙箱執行階段啟用時，`auto` 解析為 `sandbox`，否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
一般工具呼叫會忽略此參數。`gateway`/`node` 安全性衍生自 `tools.exec.mode` 和主機核准檔案；只有在操作者明確授予提升存取權時，提升模式才能強制使用完整存取權。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基準詢問模式衍生自 `tools.exec.mode` 和主機核准設定。對於源自頻道的模型呼叫，當有效的主機詢問模式為 `off` 時，會忽略每次呼叫的 `ask`；否則，它只能強化為更嚴格的模式。
</ParamField>

<ParamField path="node" type="string">
使用 `host=node` 時的節點 ID／名稱。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
要求提升模式：離開沙箱並進入設定的主機路徑。只有當提升模式解析為 `full` 時，才會強制使用 `security=full`。
</ParamField>

注意事項：

- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前遭到拒絕。
- 每次呼叫的 `host=node` 可從 `auto` 使用；只有在未啟用沙箱執行階段時，才允許每次呼叫的 `host=gateway`。
- 即使沒有額外設定，`host=auto` 仍可「直接運作」：沒有沙箱時會解析為 `gateway`；有運作中的沙箱時則會留在沙箱內。
- `elevated` 會離開沙箱並進入設定的主機路徑：預設為 `gateway`，若為 `tools.exec.host=node`（或工作階段預設值為 `host=node`），則使用 `node`。只有目前工作階段／提供者已啟用提升存取權時，才能使用此功能。
- `gateway`/`node` 核准由主機核准檔案控制。
- `node` 需要已配對的節點（隨附應用程式或無頭節點主機）。如果有多個可用節點，請設定 `exec.node` 或 `tools.exec.node` 以選取其中一個。
- `exec host=node` 是節點唯一的 shell 執行路徑；舊版 `nodes.run` 包裝函式已移除。
- 在非 Windows 主機上，若已設定 `SHELL`，exec 會使用它；如果 `SHELL` 為 `fish`，則會優先使用 `PATH` 中的 `bash`（或 `sh`），以避免與 fish 不相容的 bash 語法；若兩者都不存在，則退回使用 `SHELL`。
- 在 Windows 主機上，exec 會優先探索 PowerShell 7（`pwsh`）（依序搜尋 Program Files、ProgramW6432，然後是 PATH），再退回使用 Windows PowerShell 5.1。
- 在非 Windows 閘道主機上，bash 和 zsh exec 命令會使用啟動快照。OpenClaw 會從 shell 啟動檔擷取可載入的別名／函式及一小組安全的環境設定至 `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，接著在每個 exec 命令前載入該快照。看似包含秘密資訊的變數會遭排除；沙箱和節點 exec 不使用此快照。在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`，即可停用此快照路徑。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 和載入器覆寫（`LD_*`/`DYLD_*`），以防止二進位檔遭劫持或程式碼遭注入。
- OpenClaw 會在產生的命令環境中設定 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱執行），讓 shell／設定檔規則能偵測 exec 工具情境。
- 對於源自頻道的執行，若頻道提供了相關 ID，OpenClaw 還會在 `OPENCLAW_CHANNEL_CONTEXT` 中提供範圍受限的傳送者／聊天身分 JSON 承載資料。
- `exec` 無法執行 `openclaw channels login` 或 `/approve` shell 命令：`openclaw channels login` 是互動式頻道驗證流程，而 `/approve` 必須經由核准命令處理常式，而非 shell。請在閘道主機的終端機中執行頻道登入，或使用頻道專用的登入代理程式工具（若有，例如 `whatsapp_login`）。
- 重要：沙箱功能**預設為關閉**。如果沙箱功能關閉，隱含的 `host=auto` 會解析為 `gateway`。明確指定 `host=sandbox` 時仍會以封閉方式失敗，而不會悄悄改在閘道主機上執行。請啟用沙箱功能，或搭配核准使用 `host=gateway`。
- 指令碼預檢（用於常見的 Python／Node shell 語法錯誤）只會檢查有效 `workdir` 邊界內的檔案。如果指令碼路徑解析至 `workdir` 之外，則會略過該檔案的預檢。當 `host=gateway`，且有效原則為搭配 `ask=off` 的 `security=full` 時，也會完全略過預檢。
- 對於現在開始的長時間工作，請只啟動一次，並在已啟用自動完成喚醒且命令產生輸出或失敗時，依賴此機制完成喚醒。使用 `process` 查看記錄、狀態、輸入或進行介入；請勿使用 sleep 迴圈、逾時迴圈或重複輪詢來模擬排程。
- 代理程式啟動的背景命令會顯示在 Web、iOS 和 Android 的背景工作檢視中，直到命令完成。工作帳本會在完成心跳偵測再次喚醒代理程式之前完成最終處理。
- 對於應在稍後或依排程執行的工作，請使用排程，而不是 `exec` sleep／延遲模式。

## 設定

| 鍵                                   | 預設值                   | 注意事項                                                                                                                                                |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSeconds`          | `1800`                   | 每個命令的預設 exec 逾時秒數。每次呼叫的 `timeout` 會將其覆寫；每次呼叫的 `timeout: 0` 會停用 exec 程序逾時。                  |
| `tools.exec.host`                    | `auto`                   | 沙箱執行階段啟用時解析為 `sandbox`，否則解析為 `gateway`。                                                                            |
| `tools.exec.mode`                    | 由主機衍生               | 標準原則調整項目。請參閱下方的[模式](#modes)。                                                                                                          |
| `tools.exec.reviewer.model`          | 已設定代理程式的主要項目 | `mode=auto` 審查的選用提供者／模型覆寫。                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                  | 在改由人工處理之前，審查模型準備和完成各階段的逾時。                                                                                                    |
| `tools.exec.node`                    | 未設定                   |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                   | 為 true 時，轉至背景的 exec 工作階段會在結束時將系統事件排入佇列，並要求心跳偵測。                                                                       |
| `tools.exec.approvalRunningNoticeMs` | `10000`                  | 受核准限制的 exec 執行時間超過此值時，發出一次「執行中」通知（`0` 會停用此功能）。                                                        |
| `tools.exec.strictInlineEval`        | `false`                  | 請參閱[行內評估](#inline-eval-strictinlineeval)。                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                  | 為 true 時，核准提示可在命令文字中醒目標示剖析器衍生的命令範圍。可全域或依代理程式設定；不會變更核准原則。 |
| `tools.exec.pathPrepend`             | 未設定                   | 要前置加入 exec 執行之 `PATH` 的目錄清單（僅限閘道與沙箱）。                                                                        |
| `tools.exec.safeBins`                | 未設定                   | 僅從 stdin 讀取、無需明確允許清單項目即可執行的安全二進位檔。請參閱[安全二進位檔](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`       | `safeBins` 路徑檢查額外明確信任的目錄。`PATH` 項目絕不會自動受信任。                                              |
| `tools.exec.safeBinProfiles`         | 未設定                   | 各安全二進位檔的選用自訂 argv 原則（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                                        |

閘道與節點（`mode=full`）預設會在無需核准的情況下於主機上執行，這來自主機原則預設值，而非 `host=auto`。如果需要核准／允許清單行為，請設定 `tools.exec.mode` 並收緊主機核准檔案；請參閱 [Exec 核准](/zh-TW/tools/exec-approvals#yolo-mode-no-approval)。若要無視沙箱狀態，強制路由至閘道或節點，請設定 `tools.exec.host` 或使用 `/exec host=...`。

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

`tools.exec.mode` 是標準的持久化原則調整項目。執行階段安全性與核准行為皆衍生自此設定。

| 模式        | security    | ask       | 行為                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | 拒絕執行。                                                                                                                |
| `allowlist` | `allowlist` | `off`     | 僅執行允許清單／安全執行檔命令；其他命令一律不詢問。                                                                 |
| `ask`       | `allowlist` | `on-miss` | 符合允許清單的命令直接執行；其他所有命令都會詢問人工審核者。                                                                  |
| `auto`      | `allowlist` | `on-miss` | 符合允許清單／安全執行檔的命令直接執行；其他所有命令會先交由 OpenClaw 的原生自動審查器處理，再視需要詢問人工審核者。 |
| `full`      | `full`      | `off`     | 無核准閘門。                                                                                                              |

無論持久化模式為何，每個工作階段的 `/exec ask=always` 仍會每次詢問人工審核者。

自動審查核准僅供單次使用。在閘道上，OpenClaw 會將解析後的可執行檔路徑提供給審查器，並將執行鎖定至同一路徑。若命令無法簡化為單一且可強制執行的計畫（例如 heredoc、shell 展開或不支援的包裝器引號），即使模型原本會允許，也會改由人工核准。

Codex app-server 的命令核准若尚未由明確的執行階段或原生政策決定，會採用人工核准路徑。OpenClaw 不會針對這些請求執行其設定的 exec 審查器，因為 Codex 不會公開可強制執行的已解析可執行檔，因而無法將審查決定繫結至 Codex 實際執行的命令。

### 行內求值 (`strictInlineEval`)

當 `tools.exec.strictInlineEval` 為 `true` 時，行內直譯器求值形式需要審查器或明確核准：`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e`，以及其他受支援直譯器和命令載體中的類似形式（`awk`、`find -exec`、`make`、`sed`、`xargs` 等）。在 `mode=auto` 中，一般 exec 核准路徑可能讓原生自動審查器允許明顯低風險的單次命令；直接節點主機的 `system.run` 呼叫仍需要明確核准，因為它們無法將命令交給人工核准路徑。若審查器要求，請求會轉交人工審核者。`allow-always` 仍可持久保存無害的直譯器／指令碼叫用，但行內求值形式不會成為持久允許規則。

### PATH 處理

- `host=gateway`：將你的登入 shell `PATH` 合併至 exec 環境。主機執行會拒絕 `env.PATH` 覆寫。守護程式本身仍使用最小化的 `PATH`：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
  - 為避免使用者 shell 設定（例如 `~/.zshenv` 或 `/etc/zshenv`）在啟動時覆寫優先路徑，`tools.exec.pathPrepend` 項目會在執行前，於 shell 命令內安全地前置至最終 `PATH`。
- `host=sandbox`：在容器內執行 `sh -lc`（登入 shell），因此 `/etc/profile` 可能會重設 `PATH`。OpenClaw 會在載入設定檔後，透過內部環境變數前置 `env.PATH`（不進行 shell 插值）；`tools.exec.pathPrepend` 也適用於此處。
- `host=node`：僅將你傳入且未遭封鎖的環境覆寫傳送至節點。主機執行會拒絕 `env.PATH` 覆寫，節點主機則會忽略它們。若需要在節點上新增 PATH 項目，請設定節點主機服務環境（systemd/launchd），或將工具安裝於標準位置。

各代理程式的節點繫結（在設定中使用有鍵值的代理程式 ID）：

```bash
openclaw config get agents.entries
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
```

控制介面：**裝置**頁面包含一個小型的「Exec 節點繫結」面板，可設定相同項目。

## 工作階段覆寫 (`/exec`)

使用 `/exec` 設定 `host`、`security`、`ask` 與 `node` 的**各工作階段**預設值。不帶引數傳送 `/exec` 即可顯示目前值。

範例：

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

僅透過頻道允許清單／配對及存取群組的**已授權傳送者**所傳送的 `/exec` 才會生效。存取群組強制執行一律啟用。它只會更新**工作階段狀態**，不會寫入設定。已授權的外部頻道傳送者可以設定這些工作階段預設值。內部閘道／網頁聊天用戶端需要 `operator.admin` 才能持久保存這些值。

若要強制停用 exec，請透過工具政策（`tools.deny: ["exec"]` 或各代理程式設定）拒絕它。除非你明確設定 `security=full` 和 `ask=off`，否則主機核准仍會套用。

## Exec 核准（配套應用程式／節點主機）

沙箱化代理程式可要求在 `exec` 於閘道或節點主機上執行前，逐一核准每個請求。政策、允許清單及介面流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

需要人工核准時，節點主機及非原生閘道流程會立即傳回 `status: "approval-pending"` 與核准 ID。原生聊天和網頁介面閘道流程則可改為在行內等候，並於核准後傳回最終命令結果。`approval-pending` 結果表示命令尚未開始，因此只有經核准的命令確實於行內執行時，才會顯示前景備援警告。經核准的非同步執行會發出命令進度與完成系統事件（`Exec running` / `Exec finished`）；遭拒或逾時的核准屬於終止狀態，不會以拒絕系統事件喚醒代理程式工作階段。

在具備原生核准卡片／按鈕的頻道上，代理程式應優先依賴該原生介面；只有工具結果明確表示聊天核准不可用，或手動核准是唯一途徑時，才應包含手動 `/approve` 命令。

## 允許清單 + 安全執行檔

手動允許清單強制執行會比對已解析的二進位檔路徑 glob 與純命令名稱 glob。純名稱只會比對透過 PATH 叫用的命令，因此當命令為 `rg` 時，`rg` 可比對 `/opt/homebrew/bin/rg`，但不會比對 `./rg` 或 `/tmp/rg`。

當 `security=allowlist` 時，只有管線的每個區段都列於允許清單或屬於安全執行檔，shell 命令才會自動獲准。在允許清單模式下，除非每個頂層區段都符合允許清單（包括安全執行檔），否則會拒絕串接（`;`、`&&`、`||`）與重新導向。重新導向仍不受支援。持久的 `allow-always` 信任不會略過此規則：串接命令仍要求每個頂層區段都符合。

`autoAllowSkills` 是 exec 核准中獨立的便利路徑，與手動路徑允許清單項目不同。如需嚴格的明確信任，請保持停用 `autoAllowSkills`。

這兩類控制項用途不同：

- `tools.exec.safeBins`：小型、僅限 stdin 的串流篩選器。
- `tools.exec.safeBinTrustedDirs`：安全執行檔路徑的明確額外信任目錄。
- `tools.exec.safeBinProfiles`：自訂安全執行檔的明確 argv 政策。
- 允許清單：對可執行檔路徑的明確信任。

請勿將 `safeBins` 視為通用允許清單，也不要加入直譯器／執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。如有需要，請使用明確的允許清單項目，並保持啟用核准提示。

當直譯器／執行階段的 `safeBins` 項目缺少明確設定檔時，`openclaw security audit` 會發出警告；`openclaw doctor --fix` 可建立缺少的自訂 `safeBinProfiles` 項目骨架。當你將 `jq` 等具廣泛行為的執行檔明確加回 `safeBins` 時，`openclaw security audit` 和 `openclaw doctor` 也會發出警告（`jq` 可讀取環境資料，並從模組或啟動檔載入 jq 程式碼，因此建議改用明確允許清單項目或需要核准的執行）。即使明確列出，`jq` 仍會被拒絕作為安全執行檔。若你明確將直譯器加入允許清單，請啟用 `tools.exec.strictInlineEval`，讓行內程式碼求值形式仍須經審查器或明確核准。

完整政策詳情與範例請參閱 [Exec 核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)及[安全執行檔與允許清單的比較](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

輪詢用於隨選取得狀態，而非等候迴圈。若已啟用自動完成喚醒，命令在產生輸出或失敗時可喚醒工作階段。

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

`apply_patch` 是 `exec` 的子工具，用於結構化多檔案編輯。它預設啟用，且可供任何模型供應商使用；`allowModels` 可限制它。只有在你想停用它或將其限制於特定模型時，才需使用設定：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

注意事項：

- 工具政策仍適用；`allow: ["write"]` 會隱含允許 `apply_patch`。
- `deny: ["write"]` 不會拒絕 `apply_patch`；請明確拒絕 `apply_patch`，或在修補寫入也應遭封鎖時使用 `deny: ["group:fs"]`。
- 設定位於 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 預設為 `true`；將其設為 `false` 即可停用工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制於工作區內）。只有在你確實希望 `apply_patch` 寫入／刪除工作區目錄之外的內容時，才將其設為 `false`。
- `tools.exec.applyPatch.allowModels` 是選用的模型 ID 允許清單（原始形式，例如 `gpt-5.4`；或完整形式，例如 `openai/gpt-5.4`）。設定後，只有相符的模型能使用此工具；未設定時，所有模型都能使用。

## 相關內容

- [Exec 核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙箱化](/zh-TW/gateway/sandboxing) — 在沙箱環境中執行命令
- [背景程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 與 process 工具
- [安全性](/zh-TW/gateway/security) — 工具政策與提升權限存取
