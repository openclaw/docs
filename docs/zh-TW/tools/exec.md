---
read_when:
    - 使用或修改 exec 工具
    - 偵錯標準輸入或 TTY 行為
summary: Exec 工具用法、標準輸入模式與 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-07-19T14:06:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 096260e5a5a657682797c00430519f2b664bc7ae9dc682970494fd63a061f227
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 shell 命令。`exec` 是可修改系統的 shell 介面：命令可在所選主機或沙箱檔案系統允許的任何位置建立、編輯或刪除檔案。停用 OpenClaw 檔案系統工具（例如 `write`、`edit` 或 `apply_patch`）不會使 `exec` 變成唯讀。

透過 `process` 支援前景與背景執行。如果不允許 `process`，`exec` 會同步執行，並忽略 `yieldMs`/`background`。背景工作階段的範圍限於各個代理程式；`process` 只能看到同一代理程式的工作階段。

## 參數

<ParamField path="command" type="string" required>
要執行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目錄。
</ParamField>

<ParamField path="env" type="object">
合併至繼承環境之上的鍵值環境覆寫。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
經過此延遲時間（毫秒）後，自動將命令移至背景。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即將命令移至背景，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆寫此呼叫所設定的 exec 逾時秒數。適用於前景、背景、`yieldMs`、閘道、沙箱及節點 `system.run` 執行。`timeout: 0` 會停用該呼叫的 exec 程序逾時。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
在可用時於虛擬終端機中執行。用於僅支援 TTY 的命令列介面、程式設計代理程式及終端介面。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。當沙箱執行環境作用中時，`auto` 解析為 `sandbox`，否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
一般工具呼叫會忽略此參數。`gateway`/`node` 安全性由 `tools.exec.security` 與主機核准檔案控制；只有操作員明確授予提高權限的存取權時，提高權限模式才能強制使用 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基準詢問模式來自 `tools.exec.ask` 與主機核准。對於源自頻道的模型呼叫，當有效的主機詢問模式為 `off` 時，會忽略每次呼叫的 `ask`；否則，它只能強化為更嚴格的模式。以明確 `ask` 值建構 exec 工具的受信任內部/API 呼叫端不受影響。
</ParamField>

<ParamField path="node" type="string">
使用 `host=node` 時的節點 ID/名稱。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
要求提高權限模式：脫離沙箱並進入設定的主機路徑。只有在提高權限解析為 `full` 時，才會強制使用 `security=full`。
</ParamField>

注意事項：

- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前遭到拒絕。
- 每次呼叫的 `host=node` 可從 `auto` 使用；只有在沒有作用中的沙箱執行環境時，才允許每次呼叫的 `host=gateway`。
- 即使沒有額外設定，`host=auto` 仍可「直接運作」：沒有沙箱時會解析為 `gateway`；存在作用中的沙箱時則會留在沙箱內。
- `elevated` 會脫離沙箱並進入設定的主機路徑：預設為 `gateway`，或當 `tools.exec.host=node`（或工作階段預設值為 `host=node`）時使用 `node`。只有目前工作階段/提供者已啟用提高權限的存取權時，才能使用此功能。
- `gateway`/`node` 核准由主機核准檔案控制。
- `node` 需要已配對的節點（隨附應用程式或無頭節點主機）。如果有多個可用節點，請設定 `exec.node` 或 `tools.exec.node` 來選擇其中一個。
- `exec host=node` 是節點唯一的 shell 執行路徑；舊版 `nodes.run` 包裝函式已移除。
- 在非 Windows 主機上，exec 會在已設定時使用 `SHELL`；如果 `SHELL` 為 `fish`，它會優先使用 `PATH` 中的 `bash`（或 `sh`），以避免與 fish 不相容的 bash 語法，若兩者皆不存在，則改用 `SHELL`。
- 在 Windows 主機上，exec 會優先探索 PowerShell 7（`pwsh`）（依序為 Program Files、ProgramW6432，然後是 PATH），再改用 Windows PowerShell 5.1。
- 在非 Windows 閘道主機上，bash 與 zsh exec 命令會使用啟動快照。OpenClaw 會從 shell 啟動檔案擷取可載入的別名/函式及一小組安全的環境設定至 `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，然後在每次執行 exec 命令前載入該快照。疑似包含機密資訊的變數會被排除；沙箱與節點 exec 不使用此快照。請在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`，以停用此快照路徑。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 與載入器覆寫（`LD_*`/`DYLD_*`），以防止二進位檔劫持或程式碼注入。
- OpenClaw 會在產生的命令環境中（包括 PTY 與沙箱執行）設定 `OPENCLAW_SHELL=exec`，讓 shell/設定檔規則能偵測 exec 工具的執行情境。
- 對於源自頻道的執行，若頻道提供了相關 ID，OpenClaw 也會在 `OPENCLAW_CHANNEL_CONTEXT` 中公開範圍受限的傳送者/聊天身分 JSON 承載資料。
- `exec` 無法執行 `openclaw channels login` 或 `/approve` shell 命令：`openclaw channels login` 是互動式頻道驗證流程，而 `/approve` 必須經由核准命令處理常式執行，而非 shell。請在閘道主機的終端機中執行頻道登入，或在有提供時使用頻道專用的登入代理程式工具（例如 `whatsapp_login`）。
- 重要：沙箱功能**預設為關閉**。如果沙箱功能關閉，隱含的 `host=auto` 會解析為 `gateway`。明確指定的 `host=sandbox` 仍會以封閉方式失敗，而不會在閘道主機上默默執行。請啟用沙箱功能，或搭配核准使用 `host=gateway`。
- 指令碼預檢（用於常見的 Python/Node shell 語法錯誤）只會檢查有效 `workdir` 邊界內的檔案。如果指令碼路徑解析至 `workdir` 之外，該檔案會略過預檢。當 `host=gateway` 且有效原則為搭配 `ask=off` 的 `security=full` 時，也會完全略過預檢。
- 對於現在開始的長時間執行工作，請只啟動一次，並在已啟用自動完成喚醒且命令產生輸出或失敗時，依賴該機制。使用 `process` 處理記錄、狀態、輸入或介入；不要以 sleep 迴圈、逾時迴圈或重複輪詢模擬排程。
- 代理程式啟動的背景命令在完成前，會顯示於 Web、iOS 與 Android 的背景工作檢視中。工作帳本會在完成心跳偵測再次喚醒代理程式之前完成最終處理。
- 對於應在稍後或依排程執行的工作，請使用排程，而不要使用 `exec` sleep/延遲模式。

## 設定

| 鍵                                   | 預設值                                                 | 備註                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | 每個命令的預設 exec 逾時秒數。每次呼叫的 `timeout` 會覆寫此值；每次呼叫的 `timeout: 0` 會停用 exec 程序逾時。                  |
| `tools.exec.host`                    | `auto`                                                 | 沙箱執行階段啟用時解析為 `sandbox`，否則解析為 `gateway`。                                                                            |
| `tools.exec.security`                | 沙箱為 `deny`，未設定時閘道／節點為 `full` |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | 未設定                                                  | 正規化的政策控制項。請參閱下方的[模式](#modes)。無法與 `tools.exec.security`/`tools.exec.ask` 結合使用。                                      |
| `tools.exec.reviewer.model`          | 已設定之代理程式的主要模型                               | `mode=auto` 審查所用的選用供應商／模型覆寫。                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | 在改由人工處理之前，審查模型準備與完成各階段的逾時時間。                                                                  |
| `tools.exec.node`                    | 未設定                                                  |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | 為 true 時，轉入背景的 exec 工作階段會在結束時將系統事件排入佇列，並要求進行心跳偵測。                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 受核准閘門控管的 exec 執行超過此時間時，發出一次「執行中」通知（`0` 會停用）。                                                        |
| `tools.exec.strictInlineEval`        | `false`                                                | 請參閱[行內求值](#inline-eval-strictinlineeval)。                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | 為 true 時，核准提示可在命令文字中醒目標示剖析器衍生出的命令範圍。可設定為全域或每個代理程式個別設定；不會變更核准政策。 |
| `tools.exec.pathPrepend`             | 未設定                                                  | 要在 exec 執行時附加至 `PATH` 前方的目錄清單（僅限閘道與沙箱）。                                                                        |
| `tools.exec.safeBins`                | 未設定                                                  | 僅使用 stdin、無須明確允許清單項目即可執行的安全二進位檔。請參閱[安全二進位檔](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | `safeBins` 路徑檢查所信任的其他明確目錄。`PATH` 項目絕不會自動受信任。                                              |
| `tools.exec.safeBinProfiles`         | 未設定                                                  | 每個安全二進位檔的選用自訂 argv 政策（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                                        |

閘道與節點預設允許無須核准的主機 exec（`security=full`、`ask=off`）— 這源自主機政策的預設值，而非 `host=auto`。若要採用核准／允許清單行為，請同時收緊 `tools.exec.*` 與主機核准檔案；請參閱 [Exec 核准](/zh-TW/tools/exec-approvals#yolo-mode-no-approval)。若要不受沙箱狀態影響，強制路由至閘道或節點，請設定 `tools.exec.host` 或使用 `/exec host=...`。

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

`tools.exec.mode` 是正規化的政策控制項。設定此值會衍生 `security`/`ask`，且無法與明確設定的 `tools.exec.security`/`tools.exec.ask` 結合使用。

| 模式        | 安全性      | 詢問      | 行為                                                                                                                           |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | 拒絕執行 exec。                                                                                                                |
| `allowlist` | `allowlist` | `off`     | 僅執行允許清單／安全二進位檔中的命令；其他命令一律不詢問。                                                                 |
| `ask`       | `allowlist` | `on-miss` | 符合允許清單的命令直接執行；其他所有命令均詢問人工。                                                                  |
| `auto`      | `allowlist` | `on-miss` | 符合允許清單／安全二進位檔的命令直接執行；其他命令會先經由 OpenClaw 的原生自動審查器，再詢問人工。 |
| `full`      | `full`      | `off`     | 不設核准閘門。                                                                                                              |

無論模式為何，`ask`/`ask=always` 每次仍會詢問人工。

自動審查核准僅限使用一次。在閘道上，OpenClaw 會將解析後的可執行檔路徑提供給審查器，並將執行固定至同一路徑。無法簡化為單一且可強制執行之執行計畫的命令（例如 heredoc、shell 展開或不支援的包裝器引號方式），即使模型原本會允許，也會改由人工核准。

尚未由明確執行階段或原生政策決定的 Codex app-server 命令核准，會採用人工核准路徑。OpenClaw 不會對這些要求執行其已設定的 exec 審查器，因為 Codex 不會公開可強制執行的已解析可執行檔，使審查決定能綁定至 Codex 實際執行的命令。

### 行內求值（`strictInlineEval`）

當 `tools.exec.strictInlineEval` 為 `true` 時，行內直譯器求值形式需要審查器或明確核准：`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e`，以及其他支援的直譯器與命令載體中的類似形式（`awk`、`find -exec`、`make`、`sed`、`xargs` 等）。在 `mode=auto` 中，一般 exec 核准路徑可讓原生自動審查器允許風險明顯較低的一次性命令；直接呼叫節點主機的 `system.run` 仍需明確核准，因為其無法將命令交給人工核准路徑。若審查器要求詢問，該要求會轉交人工。`allow-always` 仍可保存良性的直譯器／指令碼叫用，但行內求值形式不會成為永久允許規則。

### PATH 處理

- `host=gateway`：將登入 shell 的 `PATH` 合併至 exec 環境。主機執行會拒絕 `env.PATH` 覆寫。守護程式本身仍以最小化的 `PATH` 執行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
  - 為避免使用者 shell 設定（例如 `~/.zshenv` 或 `/etc/zshenv`）在啟動期間覆寫優先路徑，`tools.exec.pathPrepend` 項目會在執行前，於 shell 命令內安全地附加至最終 `PATH` 的前方。
- `host=sandbox`：在容器內執行 `sh -lc`（登入 shell），因此 `/etc/profile` 可能重設 `PATH`。OpenClaw 會在載入設定檔後，透過內部環境變數將 `env.PATH` 附加至前方（不進行 shell 內插）；`tools.exec.pathPrepend` 在此也適用。
- `host=node`：只會將你傳入且未遭封鎖的環境覆寫傳送至節點。主機執行會拒絕 `env.PATH` 覆寫，節點主機也會忽略這些覆寫。若節點需要其他 PATH 項目，請設定節點主機服務環境（systemd/launchd），或將工具安裝至標準位置。

每個代理程式的節點繫結（在設定中使用代理程式清單索引）：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI：**Devices** 頁面包含一個小型的 "Exec node binding" 面板，可設定相同選項。

## 工作階段覆寫（`/exec`）

使用 `/exec` 設定 `host`、`security`、`ask` 與 `node` 的**每個工作階段**預設值。不帶引數傳送 `/exec`，即可顯示目前的值。

範例：

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

只有**已授權的傳送者**（頻道允許清單／配對加上 `commands.useAccessGroups`）才能使用 `/exec`。它只會更新**工作階段狀態**，不會寫入設定。已授權的外部頻道傳送者可設定這些工作階段預設值。內部閘道／網頁聊天用戶端需要 `operator.admin` 才能保存這些值。

若要強制停用 exec，請透過工具政策（`tools.deny: ["exec"]` 或每個代理程式的設定）拒絕它。除非明確設定 `security=full` 與 `ask=off`，否則主機核准仍會套用。

## Exec 核准（配套應用程式／節點主機）

沙箱化代理程式可要求每次請求皆先取得核准，之後才允許 `exec` 在閘道或節點主機上執行。關於政策、允許清單與 UI 流程，請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

需要人工核准時，節點主機與非原生閘道流程會立即傳回 `status: "approval-pending"` 與核准 ID。原生聊天與 Web UI 閘道流程則可改為在行內等候，並於核准後傳回最終命令結果。`approval-pending` 結果表示命令尚未開始，因此只有在已核准的命令確實於行內執行時，才會顯示前景後援警告。已核准的非同步執行會發出命令進度與完成系統事件（`Exec running` / `Exec finished`）；遭拒絕或逾時的核准為終止狀態，不會以拒絕系統事件喚醒代理程式工作階段。

在具有原生核准卡片／按鈕的頻道上，代理程式應優先依賴該原生 UI，且僅當工具結果明確指出聊天核准不可用或手動核准是唯一途徑時，才納入手動 `/approve` 命令。

## 允許清單 + 安全執行檔

手動允許清單強制執行會比對解析後的二進位檔路徑 glob 與純命令名稱 glob。純名稱只會比對透過 PATH 叫用的命令，因此當命令為 `rg` 時，`rg` 可以比對 `/opt/homebrew/bin/rg`，但無法比對 `./rg` 或 `/tmp/rg`。

當 `security=allowlist` 時，只有在每個管線區段皆列於允許清單或屬於安全執行檔的情況下，shell 命令才會自動允許。在允許清單模式下，除非每個頂層區段都符合允許清單（包括安全執行檔），否則串接（`;`、`&&`、`||`）與重新導向都會遭到拒絕。重新導向仍不受支援。永久的 `allow-always` 信任不會繞過此規則：串接命令仍要求每個頂層區段都必須相符。

`autoAllowSkills` 是執行核准中的獨立便利途徑，與手動路徑允許清單項目不同。若要採用嚴格的明確信任，請保持停用 `autoAllowSkills`。

請將這兩種控制項用於不同用途：

- `tools.exec.safeBins`：小型、僅限 stdin 的串流篩選器。
- `tools.exec.safeBinTrustedDirs`：明確指定安全執行檔路徑所信任的額外目錄。
- `tools.exec.safeBinProfiles`：自訂安全執行檔的明確 argv 原則。
- allowlist：對可執行檔路徑的明確信任。

請勿將 `safeBins` 視為通用允許清單，也不要加入直譯器／執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。若需要這些項目，請使用明確的允許清單項目，並保持啟用核准提示。

當直譯器／執行階段的 `safeBins` 項目缺少明確設定檔時，`openclaw security audit` 會發出警告，而 `openclaw doctor --fix` 可為缺少的自訂 `safeBinProfiles` 項目建立初始架構。當你明確將 `jq` 之類具廣泛行為的執行檔重新加入 `safeBins` 時，`openclaw security audit` 與 `openclaw doctor` 也會發出警告（`jq` 可以讀取環境資料，並從模組或啟動檔案載入 jq 程式碼，因此請改用明確的允許清單項目或受核准控管的執行）。即使明確列出，`jq` 仍不得作為安全執行檔。若你明確將直譯器列入允許清單，請啟用 `tools.exec.strictInlineEval`，使行內程式碼求值形式仍需經過審查者或明確核准。

如需完整的原則詳細資訊與範例，請參閱[執行核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)與[安全執行檔與允許清單的比較](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

輪詢用於隨需查詢狀態，而非等待迴圈。若已啟用自動完成喚醒，命令在產生輸出或失敗時可喚醒工作階段。

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

`apply_patch` 是 `exec` 的子工具，用於結構化的多檔案編輯。它預設啟用，且可供任何模型供應商使用；`allowModels` 可加以限制。只有在你想停用它或將其限制為特定模型時，才需使用設定：

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

- 工具原則仍然適用；`allow: ["write"]` 會隱含允許 `apply_patch`。
- `deny: ["write"]` 不會拒絕 `apply_patch`；請明確拒絕 `apply_patch`，或在修補寫入也應遭封鎖時使用 `deny: ["group:fs"]`。
- 設定位於 `tools.exec.applyPatch` 之下。
- `tools.exec.applyPatch.enabled` 預設為 `true`；將其設為 `false` 可停用此工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限於工作區內）。只有在你刻意要讓 `apply_patch` 寫入／刪除工作區目錄以外的內容時，才將其設為 `false`。
- `tools.exec.applyPatch.allowModels` 是選用的模型 ID 允許清單（原始形式，例如 `gpt-5.4`；或完整形式，例如 `openai/gpt-5.4`）。設定後，只有相符的模型可取得此工具；未設定時，所有模型皆可取得。

## 相關內容

- [執行核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙箱化](/zh-TW/gateway/sandboxing) — 在沙箱環境中執行命令
- [背景處理程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 與 process 工具
- [安全性](/zh-TW/gateway/security) — 工具原則與提升權限存取
