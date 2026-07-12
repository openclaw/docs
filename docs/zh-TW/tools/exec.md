---
read_when:
    - 使用或修改 exec 工具
    - 偵錯標準輸入或 TTY 行為
summary: Exec 工具用法、標準輸入模式與 TTY 支援
title: 執行工具
x-i18n:
    generated_at: "2026-07-12T14:50:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

在工作區中執行 shell 命令。`exec` 是可變更內容的 shell 操作介面：只要所選主機或沙箱檔案系統允許，命令就能在任何位置建立、編輯或刪除檔案。停用 OpenClaw 檔案系統工具（例如 `write`、`edit` 或 `apply_patch`）不會讓 `exec` 變成唯讀。

透過 `process` 支援前景與背景執行。如果不允許使用 `process`，`exec` 會同步執行，並忽略 `yieldMs`/`background`。背景工作階段的範圍以個別代理程式為限；`process` 只能看到同一代理程式的工作階段。

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
經過此延遲時間（毫秒）後，自動將命令轉為背景執行。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即將命令置於背景執行，不等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆寫此呼叫設定的 exec 逾時秒數。適用於前景、背景、`yieldMs`、閘道、沙箱及節點 `system.run` 執行。`timeout: 0` 會停用該次呼叫的 exec 程序逾時。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用時在虛擬終端機中執行。適用於僅支援 TTY 的命令列介面、程式設計代理程式及終端介面。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
執行位置。沙箱執行環境啟用時，`auto` 解析為 `sandbox`；否則解析為 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
一般工具呼叫會忽略此參數。`gateway`/`node` 安全性由 `tools.exec.security` 和主機核准檔案控制；只有操作員明確授予提升權限時，提升模式才能強制使用 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基準詢問模式來自 `tools.exec.ask` 和主機核准設定。對於源自頻道的模型呼叫，若主機的有效詢問模式為 `off`，則會忽略每次呼叫的 `ask`；否則只能強化為更嚴格的模式。使用明確 `ask` 值建構 exec 工具的受信任內部/API 呼叫端不受影響。
</ParamField>

<ParamField path="node" type="string">
`host=node` 時的節點 ID/名稱。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
請求提升模式：逸出沙箱，進入已設定的主機路徑。只有當提升權限解析為 `full` 時，才會強制使用 `security=full`。
</ParamField>

注意事項：

- `host` 僅接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主機名稱選擇器；類似主機名稱的值會在命令執行前遭到拒絕。
- 從 `auto` 可允許每次呼叫指定 `host=node`；只有在沒有啟用沙箱執行環境時，才允許每次呼叫指定 `host=gateway`。
- 不需額外設定，`host=auto` 仍可「直接運作」：沒有沙箱時解析為 `gateway`；有運作中的沙箱時則留在沙箱內。
- `elevated` 會逸出沙箱，進入已設定的主機路徑：預設為 `gateway`；當 `tools.exec.host=node`（或工作階段預設值為 `host=node`）時則為 `node`。只有目前工作階段/提供者已啟用提升權限存取時才能使用。
- `gateway`/`node` 核准由主機核准檔案控制。
- `node` 需要已配對的節點（伴隨應用程式或無介面節點主機）。如果有多個節點可用，請設定 `exec.node` 或 `tools.exec.node` 來選擇其中一個。
- `exec host=node` 是節點唯一的 shell 執行路徑；舊版 `nodes.run` 包裝器已移除。
- 在非 Windows 主機上，exec 會在已設定時使用 `SHELL`；如果 `SHELL` 是 `fish`，會優先從 `PATH` 使用 `bash`（或 `sh`），以避免與 fish 不相容的 bash 語法，兩者都不存在時才退回使用 `SHELL`。
- 在 Windows 主機上，exec 會優先探索 PowerShell 7（`pwsh`）（依序搜尋 Program Files、ProgramW6432，然後是 PATH），再退回使用 Windows PowerShell 5.1。
- 在非 Windows 閘道主機上，bash 和 zsh exec 命令會使用啟動快照。OpenClaw 會從 shell 啟動檔案中擷取可載入的別名/函式及一小組安全環境設定，存入 `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，然後在每次 exec 命令前載入該快照。看似機密的變數會被排除；沙箱與節點 exec 不使用此快照。若要停用此快照路徑，請在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`。
- 主機執行（`gateway`/`node`）會拒絕 `env.PATH` 和載入器覆寫（`LD_*`/`DYLD_*`），以防止二進位檔劫持或程式碼注入。
- OpenClaw 會在產生的命令環境中（包括 PTY 和沙箱執行）設定 `OPENCLAW_SHELL=exec`，讓 shell/設定檔規則能偵測 exec 工具情境。
- 對於源自頻道的執行，如果頻道有提供這些 ID，OpenClaw 也會在 `OPENCLAW_CHANNEL_CONTEXT` 中公開範圍受限的傳送者/聊天身分 JSON 承載資料。
- `exec` 無法執行 `openclaw channels login` 或 `/approve` shell 命令：`openclaw channels login` 是互動式頻道驗證流程，而 `/approve` 必須經由核准命令處理常式執行，不能透過 shell。請在閘道主機的終端機中執行頻道登入，或使用頻道專屬的登入代理程式工具（如果有，例如 `whatsapp_login`）。
- 重要：沙箱功能**預設為關閉**。如果沙箱功能關閉，隱含的 `host=auto` 會解析為 `gateway`。明確指定 `host=sandbox` 時仍會以失敗關閉，而不會靜默改在閘道主機上執行。請啟用沙箱功能，或搭配核准使用 `host=gateway`。
- 指令碼預檢（用於常見的 Python/Node shell 語法錯誤）只會檢查有效 `workdir` 邊界內的檔案。如果指令碼路徑解析到 `workdir` 之外，就會略過該檔案的預檢。當 `host=gateway` 且有效原則為 `security=full` 搭配 `ask=off` 時，也會完全略過預檢。
- 對於現在開始的長時間工作，只需啟動一次，並在已啟用自動完成喚醒，且命令產生輸出或失敗時，依賴自動完成喚醒。使用 `process` 取得記錄、狀態、輸入或進行介入；不要使用睡眠迴圈、逾時迴圈或重複輪詢來模擬排程。
- 對於應稍後或依排程執行的工作，請使用排程，而不是 `exec` 睡眠/延遲模式。

## 設定

| 鍵                                   | 預設值                                                 | 注意事項                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tools.exec.timeoutSec`              | `1800`                                                 | 每個命令的預設 exec 逾時秒數。每次呼叫的 `timeout` 會覆寫此值；每次呼叫的 `timeout: 0` 會停用 exec 程序逾時。                                                  |
| `tools.exec.host`                    | `auto`                                                 | 沙箱執行環境啟用時解析為 `sandbox`，否則解析為 `gateway`。                                                                                                   |
| `tools.exec.security`                | 沙箱預設為 `deny`，未設定時閘道/節點預設為 `full`      |                                                                                                                                                              |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                              |
| `tools.exec.mode`                    | 未設定                                                 | 正規化原則控制項。請參閱下方的[模式](#modes)。不能與 `tools.exec.security`/`tools.exec.ask` 搭配使用。                                                        |
| `tools.exec.reviewer.model`          | 已設定的代理程式主要模型                               | 用於 `mode=auto` 審查的選用提供者/模型覆寫。                                                                                                                 |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | 在退回人工處理前，審查模型準備與完成各階段的逾時時間。                                                                                                       |
| `tools.exec.node`                    | 未設定                                                 |                                                                                                                                                              |
| `tools.exec.notifyOnExit`            | `true`                                                 | 為 true 時，置於背景的 exec 工作階段會在結束時將系統事件排入佇列，並請求心跳偵測。                                                                            |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 受核准限制的 exec 執行時間超過此值時，發出一次「執行中」通知（`0` 表示停用）。                                                                                |
| `tools.exec.strictInlineEval`        | `false`                                                | 請參閱[內嵌求值](#inline-eval-strictinlineeval)。                                                                                                            |
| `tools.exec.commandHighlighting`     | `false`                                                | 為 true 時，核准提示可在命令文字中醒目顯示由剖析器衍生的命令範圍。可全域或依代理程式設定；不會變更核准原則。                                                   |
| `tools.exec.pathPrepend`             | 未設定                                                 | 要前置至 exec 執行之 `PATH` 的目錄清單（僅限閘道與沙箱）。                                                                                                   |
| `tools.exec.safeBins`                | 未設定                                                 | 僅使用 stdin、可在沒有明確允許清單項目的情況下執行的安全二進位檔。請參閱[安全二進位檔](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)。                    |
| `tools.exec.safeBinTrustedDirs`      | `/bin`、`/usr/bin`                                     | 用於 `safeBins` 路徑檢查的其他明確受信任目錄。永遠不會自動信任 `PATH` 項目。                                                                                  |
| `tools.exec.safeBinProfiles`         | 未設定                                                 | 每個安全二進位檔的選用自訂 argv 原則（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                                                |

閘道與節點預設會在不需核准的情況下執行主機 exec（`security=full`、`ask=off`）——這來自主機原則預設值，而不是 `host=auto`。如果你希望使用核准/允許清單行為，請同時收緊 `tools.exec.*` 與主機核准檔案；請參閱 [Exec 核准](/zh-TW/tools/exec-approvals#yolo-mode-no-approval)。若要無論沙箱狀態為何都強制路由至閘道或節點，請設定 `tools.exec.host` 或使用 `/exec host=...`。

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

`tools.exec.mode` 是正規化原則控制項。設定後會衍生 `security`/`ask`，且不能與明確的 `tools.exec.security`/`tools.exec.ask` 搭配使用。

| 模式        | security    | ask       | 行為                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | 拒絕執行。                                                                                                                |
| `allowlist` | `allowlist` | `off`     | 僅執行允許清單／安全執行檔命令；不會詢問其他命令。                                                                 |
| `ask`       | `allowlist` | `on-miss` | 符合允許清單的命令會直接執行；其他命令都會詢問人工。                                                                  |
| `auto`      | `allowlist` | `on-miss` | 符合允許清單／安全執行檔的命令會直接執行；其他命令會先經過 OpenClaw 的原生自動審查器，再詢問人工。 |
| `full`      | `full`      | `off`     | 無核准閘門。                                                                                                              |

無論模式為何，`ask`／`ask=always` 仍會每次都詢問人工。

自動審查核准僅供單次使用。在閘道上，OpenClaw 會將解析後的可執行檔路徑提供給審查器，並將執行鎖定於同一路徑。無法簡化為單一且可強制執行之計畫的命令（例如 heredoc、shell 展開或不支援的包裝程式引號），即使模型原本會允許，仍會改由人工核准。

尚未由明確執行階段或原生原則決定的 Codex app-server 命令核准，會使用人工核准流程。OpenClaw 不會針對這些要求執行其設定的 exec 審查器，因為 Codex 不會公開可強制執行的已解析可執行檔，因而無法將審查決定繫結至 Codex 實際執行的命令。

### 行內求值（`strictInlineEval`）

當 `tools.exec.strictInlineEval` 為 `true` 時，行內直譯器求值形式需要審查器或明確核准：`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e`，以及其他受支援直譯器和命令載體（`awk`、`find -exec`、`make`、`sed`、`xargs` 等）的類似形式。在 `mode=auto` 中，一般 exec 核准流程可讓原生自動審查器允許明顯低風險的單次命令；直接呼叫節點主機的 `system.run` 仍需要明確核准，因為它們無法將命令交給人工核准流程。如果審查器要求，請求會轉交人工。`allow-always` 仍可永久允許無害的直譯器／指令碼呼叫，但行內求值形式不會成為持久的允許規則。

### PATH 處理

- `host=gateway`：將登入 shell 的 `PATH` 合併到 exec 環境中。主機執行會拒絕 `env.PATH` 覆寫。常駐程式本身仍以最小化的 `PATH` 執行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
  - 為避免使用者 shell 設定（例如 `~/.zshenv` 或 `/etc/zshenv`）在啟動時覆寫優先路徑，`tools.exec.pathPrepend` 項目會在執行前，安全地前置於 shell 命令內的最終 `PATH`。
- `host=sandbox`：在容器內執行 `sh -lc`（登入 shell），因此 `/etc/profile` 可能會重設 `PATH`。OpenClaw 會在載入 profile 後，透過內部環境變數前置 `env.PATH`（不進行 shell 插值）；`tools.exec.pathPrepend` 也適用於此處。
- `host=node`：只會將你傳入且未被封鎖的環境覆寫傳送至節點。主機執行會拒絕 `env.PATH` 覆寫，節點主機也會忽略它們。若需要在節點新增 PATH 項目，請設定節點主機服務環境（systemd／launchd），或將工具安裝於標準位置。

每個代理程式的節點繫結（在設定中使用代理程式清單索引）：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

控制介面：**裝置**頁面包含一個小型的「Exec 節點繫結」面板，可設定相同項目。

## 工作階段覆寫（`/exec`）

使用 `/exec` 設定 `host`、`security`、`ask` 和 `node` 的**每個工作階段**預設值。不帶引數傳送 `/exec` 即可顯示目前值。

範例：

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

只有**已授權的傳送者**（頻道允許清單／配對，加上 `commands.useAccessGroups`）可使用 `/exec`。它只會更新**工作階段狀態**，不會寫入設定。已授權的外部頻道傳送者可設定這些工作階段預設值。內部閘道／網頁聊天用戶端需要 `operator.admin` 才能永久保存這些值。

若要強制停用 exec，請透過工具原則拒絕它（`tools.deny: ["exec"]` 或每個代理程式的設定）。除非你明確設定 `security=full` 和 `ask=off`，否則主機核准仍然適用。

## Exec 核准（伴隨應用程式／節點主機）

沙箱化代理程式可要求在閘道或節點主機上執行 `exec` 前，逐次核准每個請求。如需原則、允許清單及介面流程，請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

需要人工核准時，節點主機和非原生閘道流程會立即傳回 `status: "approval-pending"` 和核准 ID。原生聊天和網頁介面閘道流程則可改為在行內等待，並於核准後傳回最終命令結果。`approval-pending` 結果表示命令尚未開始，因此只有已核准的命令實際在行內執行時，才會出現前景備援警告。已核准的非同步執行會發出命令進度與完成系統事件（`Exec running`／`Exec finished`）；遭拒絕或逾時的核准為終止狀態，不會以拒絕系統事件喚醒代理程式工作階段。

在具有原生核准卡片／按鈕的頻道上，代理程式應優先使用該原生介面；只有工具結果明確指出無法使用聊天核准，或手動核准是唯一途徑時，才應包含手動 `/approve` 命令。

## 允許清單與安全執行檔

手動允許清單強制執行會比對已解析二進位檔路徑 glob 和裸命令名稱 glob。裸名稱只會比對透過 PATH 呼叫的命令，因此當命令為 `rg` 時，`rg` 可比對 `/opt/homebrew/bin/rg`，但不會比對 `./rg` 或 `/tmp/rg`。

當 `security=allowlist` 時，只有每個管線區段都在允許清單中或屬於安全執行檔，shell 命令才會自動獲准。在允許清單模式中，除非每個頂層區段都符合允許清單（包括安全執行檔），否則串接（`;`、`&&`、`||`）和重新導向會遭拒絕。重新導向仍不受支援。持久的 `allow-always` 信任不會略過此規則：串接命令的每個頂層區段仍須符合條件。

`autoAllowSkills` 是 exec 核准中另一條便利途徑，與手動路徑允許清單項目不同。若需嚴格的明確信任，請維持停用 `autoAllowSkills`。

這些控制項各有不同用途：

- `tools.exec.safeBins`：小型、僅限 stdin 的串流篩選器。
- `tools.exec.safeBinTrustedDirs`：安全執行檔可執行路徑額外受信任目錄的明確清單。
- `tools.exec.safeBinProfiles`：自訂安全執行檔的明確 argv 原則。
- 允許清單：對可執行檔路徑的明確信任。

請勿將 `safeBins` 視為通用允許清單，也不要加入直譯器／執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`）。若需要這些項目，請使用明確的允許清單項目，並維持啟用核准提示。

當直譯器／執行階段的 `safeBins` 項目缺少明確 profile 時，`openclaw security audit` 會發出警告，而 `openclaw doctor --fix` 可建立缺少的自訂 `safeBinProfiles` 項目骨架。當你明確將 `jq` 等具有廣泛行為的執行檔加回 `safeBins` 時，`openclaw security audit` 和 `openclaw doctor` 也會發出警告（`jq` 可讀取環境資料，並從模組或啟動檔案載入 jq 程式碼，因此應改用明確的允許清單項目或由核准控管的執行）。即使明確列出，`jq` 仍會被拒絕作為安全執行檔。若你明確允許列出直譯器，請啟用 `tools.exec.strictInlineEval`，以確保行內程式碼求值形式仍需要審查器或明確核准。

如需完整原則詳情與範例，請參閱 [Exec 核准](/zh-TW/tools/exec-approvals-advanced#safe-bins-stdin-only)及[安全執行檔與允許清單的比較](/zh-TW/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

## 範例

前景：

```json
{ "tool": "exec", "command": "ls -la" }
```

背景執行與輪詢：

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

輪詢用於隨選查詢狀態，而不是等待迴圈。如果已啟用自動完成喚醒，命令在輸出內容或失敗時可喚醒工作階段。

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

`apply_patch` 是 `exec` 的子工具，用於結構化的多檔案編輯。預設啟用，且任何模型供應商皆可使用；`allowModels` 可限制其使用。只有在你想停用它或限制特定模型使用時，才需使用設定：

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
- `deny: ["write"]` 不會拒絕 `apply_patch`；若也應封鎖修補寫入，請明確拒絕 `apply_patch`，或使用 `deny: ["group:fs"]`。
- 設定位於 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 預設為 `true`；將其設為 `false` 即可停用工具。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制於工作區內）。只有在你確實想讓 `apply_patch` 在工作區目錄之外寫入／刪除時，才將其設為 `false`。
- `tools.exec.applyPatch.allowModels` 是可選的模型 ID 允許清單（原始格式，例如 `gpt-5.4`；或完整格式，例如 `openai/gpt-5.4`）。設定後，只有相符的模型能取得此工具；未設定時，所有模型皆可取得。

## 相關內容

- [Exec 核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [沙箱化](/zh-TW/gateway/sandboxing) — 在沙箱化環境中執行命令
- [背景程序](/zh-TW/gateway/background-process) — 長時間執行的 exec 與 process 工具
- [安全性](/zh-TW/gateway/security) — 工具原則與提升權限存取
