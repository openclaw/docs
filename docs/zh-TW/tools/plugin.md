---
doc-schema-version: 1
read_when:
    - 安裝或設定外掛
    - 瞭解外掛探索與載入規則
    - 使用與 Codex/Claude 相容的外掛套件組合
sidebarTitle: Getting Started
summary: 安裝、設定及管理 OpenClaw 外掛
title: 外掛
x-i18n:
    generated_at: "2026-07-11T21:52:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

外掛可擴充 OpenClaw，加入頻道、模型供應商、代理程式執行框架、工具、
Skills、語音、即時轉錄、語音功能、媒體理解、生成、
網頁擷取、網頁搜尋及其他執行階段功能。

使用本頁安裝外掛、重新啟動閘道、確認執行階段已載入外掛，
並處理常見的設定失敗問題。如需僅含命令的範例，請參閱
[管理外掛](/zh-TW/plugins/manage-plugins)。如需查看隨附、官方外部及僅原始碼外掛的
自動產生清單，請參閱
[外掛清單](/zh-TW/plugins/plugin-inventory)。

## 需求

- 已有 OpenClaw 原始碼工作區或安裝，且可使用 `openclaw` 命令列介面
- 可存取所選來源的網路（ClawHub、npm 或 git 主機）
- 該外掛設定文件中指定的所有外掛專用憑證、設定鍵或作業系統工具
- 具備讓提供頻道服務的閘道重新載入或重新啟動的權限

## 快速開始

<Steps>
  <Step title="尋找外掛">
    在 [ClawHub](/clawhub) 搜尋公開外掛套件：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是探索社群外掛的主要管道。在啟用切換期間，
    一般未加前綴的套件規格仍會從 npm 安裝，除非它符合官方外掛 ID。
    符合隨附外掛的原始 `@openclaw/*` 規格會解析至該隨附副本。
    若需要指定特定來源，請使用明確的來源前綴。

  </Step>

  <Step title="安裝外掛">
    ```bash
    # 從 ClawHub。
    openclaw plugins install clawhub:<package>

    # 從 npm。
    openclaw plugins install npm:<package>

    # 從 git。
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # 從本機開發原始碼工作區。
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    應將安裝外掛視同執行程式碼。正式環境安裝宜使用固定版本，
    以確保結果可重現。

  </Step>

  <Step title="設定並啟用外掛">
    在 `plugins.entries.<id>.config` 下設定外掛專用選項。
    如果外掛尚未啟用，請啟用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    若已設定 `plugins.allow`，安裝的外掛 ID 必須列在其中，
    外掛才能載入。`openclaw plugins install` 會將安裝的
    ID 加入現有的 `plugins.allow` 清單，並從 `plugins.deny`
    移除相同 ID，讓明確安裝的外掛可在重新啟動後載入。

  </Step>

  <Step title="讓閘道重新載入">
    安裝、更新或解除安裝外掛程式碼後，必須重新啟動閘道。
    已啟用設定重新載入功能的受管理閘道會偵測外掛安裝紀錄的變更，
    並自動重新啟動。否則請自行重新啟動：

    ```bash
    openclaw gateway restart
    ```

    啟用或停用操作會更新設定與冷態登錄。執行階段檢查
    仍是證明即時執行階段介面的最明確方式。

  </Step>

  <Step title="確認執行階段註冊">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    使用 `--runtime` 證明工具、掛鉤、服務、閘道方法或外掛擁有的
    命令列介面命令已註冊。一般的 `inspect` 僅檢查冷態資訊清單與登錄。

  </Step>
</Steps>

## 設定

### 選擇安裝來源

| 來源        | 適用情況                                                                         | 範例                                                           |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 您需要 OpenClaw 原生的探索、掃描、版本中繼資料及安裝提示                         | `openclaw plugins install clawhub:<package>`                   |
| npm         | 您需要直接使用 npm 登錄或發行標籤工作流程                                        | `openclaw plugins install npm:<package>`                       |
| git         | 您需要儲存庫中的分支、標籤或提交                                                  | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本機路徑    | 您正在同一台機器上開發或測試外掛                                                  | `openclaw plugins install --link ./my-plugin`                  |
| 市集        | 您正在安裝相容於 Claude 的市集外掛                                                | `openclaw plugins install <plugin> --marketplace <source>`     |

未加前綴的套件規格具有特殊相容行為：符合隨附外掛 ID 的名稱會使用
該隨附來源；符合官方外部外掛 ID 的名稱會使用官方套件目錄；在啟用切換期間，
其他未加前綴的規格皆透過 npm 安裝。符合隨附外掛的原始 `@openclaw/*`
規格也會在退回 npm 前先解析至隨附副本。若要刻意安裝外部 npm 套件，
而非隨附副本，請使用 `npm:@openclaw/<plugin>@<version>`。
若要確定性地選擇來源，請使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`。
如需完整命令契約，請參閱
[`openclaw plugins`](/zh-TW/cli/plugins#install)。

對於 npm 安裝，未固定版本的規格與 `@latest` 會選擇宣告與此 OpenClaw
版本相容的最新穩定套件。若 npm 目前的最新版本宣告的
`openclaw.compat.pluginApi` 或 `openclaw.install.minHostVersion`
高於此版本所支援的值，OpenClaw 會掃描較舊的穩定版本，並安裝其中
最新且相容的版本。確切版本與 `@beta` 等明確頻道標籤會固定使用
所選套件，若不相容則失敗。

### 操作者安裝政策

設定 `security.installPolicy`，以便在繼續安裝或更新外掛前，
執行受信任的本機政策命令。該政策會接收中繼資料及暫存來源路徑，
並可允許或封鎖安裝。它同時涵蓋命令列介面與閘道支援的安裝／更新路徑。
外掛的 `before_install` 掛鉤會在之後執行，而且只會在已載入外掛掛鉤的
OpenClaw 程序中執行，因此操作者擁有的安裝決策應改用
`security.installPolicy`。已淘汰的 `--dangerously-force-unsafe-install`
旗標基於相容性仍會接受，但不會產生任何作用：它無法略過安裝政策，
也無法略過 OpenClaw 內建的外掛相依套件拒絕清單。

如需 Skills 與外掛共用的 `security.installPolicy` 執行結構描述，
請參閱 [Skills 設定](/zh-TW/tools/skills-config#operator-install-policy-securityinstallpolicy)。

### 設定外掛政策

一般的外掛設定結構如下：

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

主要政策規則：

- `plugins.enabled: false` 會停用所有外掛，並略過探索／載入工作。
  啟用此設定期間，過時的外掛參照會維持非作用狀態；若希望移除過時 ID，
  請先重新啟用外掛，再執行 doctor 清理。
- `plugins.deny` 的優先順序高於允許清單及各外掛的啟用設定。
- `plugins.allow` 是排他性的允許清單。不在允許清單中的外掛自有工具
  即使 `tools.allow` 包含 `"*"`，仍無法使用。
- `plugins.entries.<id>.enabled: false` 會停用單一外掛，但保留其設定。
- `plugins.load.paths` 會加入明確指定的本機外掛檔案或目錄。
  由 `plugins install` 管理的本機路徑必須是外掛目錄或封存檔；
  獨立外掛檔案請使用 `plugins.load.paths`。
- 來自工作區的外掛預設為停用；使用本機工作區程式碼前，
  請明確啟用或將其加入允許清單。
- 隨附外掛會遵循其內建的預設啟用／預設停用中繼資料，
  除非設定明確覆寫。
- `plugins.slots.<slot>`（`memory` 或 `contextEngine`）會為排他類別選擇
  一個外掛。選擇插槽視為明確啟用，即使所選外掛原本需要選擇加入，
  仍會針對該插槽強制啟用。`plugins.deny` 與
  `plugins.entries.<id>.enabled: false` 仍會封鎖它。
- 當設定指定隨附選擇加入外掛所擁有的其中一個介面時，該外掛可以自動啟用，
  例如供應商／模型參照、頻道設定、命令列介面後端或代理程式執行框架執行階段。
- OpenAI 系列的 Codex 路由會將供應商與執行階段外掛的邊界分開：
  舊版 Codex 模型參照屬於 doctor 會修復的舊版設定，
  而隨附的 `codex` 外掛負責標準 `openai/*` 代理程式參照、
  明確的 `agentRuntime.id: "codex"` 及舊版 `codex/*` 參照所使用的
  Codex 應用程式伺服器執行階段。

當未設定 `plugins.allow`，且從工作區或全域外掛根目錄自動探索到
非隨附外掛時，啟動記錄會輸出
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
其中包含探索到的外掛 ID；若清單較短，還會包含最精簡的 `plugins.allow`
片段。將受信任的外掛複製至 `openclaw.json` 前，請針對列出的外掛 ID
執行 [`openclaw plugins list --enabled --verbose`](/zh-TW/cli/plugins#list)
或 [`openclaw plugins inspect <id>`](/zh-TW/cli/plugins#inspect)。
當診斷指出外掛是在
`without install/load-path provenance` 的情況下載入時，也應採用相同的
信任固定方式：檢查該外掛 ID，然後將其固定於 `plugins.allow`，
或從受信任來源重新安裝，讓 OpenClaw 記錄安裝來源證明。

當設定驗證回報過時的外掛 ID、允許清單／工具不符，或舊版隨附外掛路徑時，
請執行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 瞭解外掛格式

OpenClaw 可辨識兩種外掛格式：

| 格式                    | 載入方式                                                                     | 適用情況                                                               |
| ----------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| OpenClaw 原生外掛       | `openclaw.plugin.json` 加上於程序內載入的執行階段模組                        | 您正在安裝或建置 OpenClaw 專用的執行階段功能                           |
| 相容套件組合            | 將 Codex、Claude 或 Cursor 外掛配置映射至 OpenClaw 外掛清單                  | 您正在重複使用相容的 Skills、命令、掛鉤或套件組合中繼資料              |

這兩種格式都會出現在 `openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable` 與 `openclaw plugins disable` 中。套件組合的
相容性邊界請參閱[外掛套件組合](/zh-TW/plugins/bundles)，原生外掛的製作方式請參閱
[建置外掛](/zh-TW/plugins/building-plugins)。

## 外掛掛鉤

外掛可在執行階段透過兩種不同的 API 註冊掛鉤：

- `api.on(...)` 型別化掛鉤用於執行階段生命週期事件。這是中介軟體、
  政策、訊息改寫、提示詞塑形及工具控制的首選介面。
- `api.registerHook(...)` 用於[掛鉤](/zh-TW/automation/hooks)中所述的內部掛鉤系統。
  它主要用於粗粒度命令／生命週期副作用，以及與現有 HOOK 風格自動化的相容性。

簡要原則：若處理常式需要優先順序、合併語意或封鎖／取消行為，
請使用型別化掛鉤。若只需回應 `command:new`、`command:reset`、
`message:sent` 或類似的粗粒度事件，則可使用 `api.registerHook`。

由外掛管理的內部掛鉤會以 `plugin:<id>` 顯示於 `openclaw hooks list`。
您無法透過 `openclaw hooks` 啟用或停用它們；請改為啟用或停用外掛。

## 確認作用中的閘道

`openclaw plugins list` 與一般的 `openclaw plugins inspect` 會讀取
冷態設定、資訊清單及登錄狀態。它們無法證明已在執行中的閘道
已匯入相同的外掛程式碼。

當外掛看似已安裝，但即時聊天流量未使用它時：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

受管理的閘道會在外掛安裝、更新及解除安裝變更導致外掛來源改變後自動重新啟動。在 VPS 或容器安裝環境中，請確保任何手動重新啟動的目標是實際為頻道提供服務的 `openclaw gateway run` 子程序，而不只是包裝程式或監督程式。

## 疑難排解

| 症狀                                                        | 檢查                                                                                                                                      | 修正                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 外掛出現在 `plugins list` 中，但執行階段鉤子未執行  | 使用 `openclaw plugins inspect <id> --runtime --json`，並透過 `gateway status --deep --require-rpc` 確認作用中的閘道             | 在安裝、更新、設定或來源變更後，重新啟動目前運作中的閘道                               |
| 出現重複的頻道或工具擁有權診斷         | 執行 `openclaw plugins list --enabled --verbose`，使用 `--runtime --json` 檢查每個疑似外掛，並比較頻道／工具擁有權 | 停用其中一個擁有者、移除過時的安裝項目，或使用資訊清單的 `preferOver` 進行有意替換      |
| 設定指出缺少外掛                                | 查看[外掛清單](/zh-TW/plugins/plugin-inventory)，確認它是內建外掛、官方外部外掛，還是僅有原始碼的外掛                           | 安裝外部套件、啟用內建外掛，或移除過時設定                         |
| 安裝期間設定無效                               | 閱讀驗證訊息；若訊息指出外掛狀態過時，請執行 `openclaw doctor --fix`                                             | Doctor 可透過停用該項目並移除無效內容，隔離無效的外掛設定     |
| 外掛路徑因可疑擁有權或權限而遭封鎖 | 檢查設定錯誤之前的診斷訊息                                                                                             | 修正檔案系統擁有權／權限，然後執行 `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` 封鎖生命週期命令                | 確認安裝是由 Nix 管理                                                                                                      | 在 Nix 來源中變更外掛選擇，而非使用外掛修改命令                      |
| 執行階段無法匯入相依套件                             | 檢查外掛是透過 npm/git/ClawHub 安裝，還是從本機路徑載入                                                 | 執行 `openclaw plugins update <id>`、重新安裝來源，或自行安裝本機外掛的相依套件 |

當過時的外掛設定仍指定已無法探索到的頻道外掛時，設定驗證會將該頻道鍵降級為警告，而不是硬性失敗，因此閘道啟動後仍可為所有其他頻道提供服務。執行 `openclaw doctor --fix` 以移除過時的外掛和頻道項目。若未知頻道鍵沒有過時外掛的證據，驗證仍會失敗，讓拼寫錯誤保持可見。

若要有意替換頻道，偏好的外掛應透過 `channelConfigs.<channel-id>.preferOver` 宣告舊版或優先順序較低的外掛 ID。如果兩個外掛都被明確啟用，OpenClaw 會保留該要求並回報重複的頻道／工具診斷，而不會默默選擇其中一個擁有者。

如果已安裝的套件回報其 `requires compiled runtime output for
TypeScript entry ...`，表示發佈的套件未包含 OpenClaw 在執行階段所需的 JavaScript 檔案。請在發佈者提供已編譯的 JavaScript 後更新或重新安裝；在此之前，也可以停用或解除安裝該外掛。

### 外掛路徑擁有權遭封鎖

如果診斷訊息顯示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
，且後續驗證顯示 `plugin present but blocked`，表示 OpenClaw 發現外掛檔案的擁有者與載入這些檔案的程序所屬 Unix 使用者不同。請保留外掛設定；修正檔案系統擁有權，或以擁有狀態目錄的同一使用者身分執行 OpenClaw。

對於 Docker 安裝，官方映像檔以 `node`（uid `1000`）身分執行，因此從主機繫結掛載的 OpenClaw 設定與工作區目錄通常應由 uid `1000` 擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果您刻意以 root 身分執行 OpenClaw，則改為將受管理外掛根目錄的擁有權修正為 root：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正擁有權後，請重新執行 `openclaw doctor --fix` 或 `openclaw plugins registry --refresh`，讓持久化的外掛登錄與修復後的檔案一致。

### 外掛工具設定緩慢

如果代理程式回合在準備工具時似乎停滯，請啟用追蹤記錄，並檢查外掛工具工廠的計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出工廠總耗時及最慢的外掛工具工廠，包括外掛 ID、宣告的工具名稱、結果形式，以及工具是否為選用。當單一工廠耗時至少 1 秒，或外掛工具工廠的總準備時間至少為 5 秒時，緩慢的記錄行會提升為警告。

對於使用相同有效要求內容的重複解析，OpenClaw 會快取成功的外掛工具工廠結果。快取鍵包含有效的執行階段設定、工作區與代理程式 ID、沙箱原則、瀏覽器設定、傳遞內容、要求者身分及擁有權狀態，因此依賴這些受信任欄位的工廠會在內容變更時重新執行。如果耗時持續偏高，該外掛可能在傳回工具定義前執行了成本高昂的工作。

如果某個外掛佔用了大部分時間，請檢查其執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然後更新、重新安裝或停用該外掛。外掛作者應將高成本的相依套件載入延後到工具執行路徑，而不是在工具工廠內執行。

如需瞭解相依套件根目錄、套件中繼資料驗證、登錄記錄、啟動重新載入行為及舊版清理，請參閱[外掛相依套件解析](/zh-TW/plugins/dependency-resolution)。

## 相關內容

- [管理外掛](/zh-TW/plugins/manage-plugins) - 列出、安裝、更新、解除安裝及發佈的命令範例
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整命令列介面參考
- [外掛清單](/zh-TW/plugins/plugin-inventory) - 產生的內建及外部外掛清單
- [外掛參考](/zh-TW/plugins/reference) - 產生的各外掛參考頁面
- [社群外掛](/zh-TW/plugins/community) - ClawHub 探索與文件 PR 原則
- [外掛相依套件解析](/zh-TW/plugins/dependency-resolution) - 安裝根目錄、登錄記錄及執行階段邊界
- [建置外掛](/zh-TW/plugins/building-plugins) - 原生外掛編寫指南
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview) - 執行階段註冊、鉤子及 API 欄位
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單與套件中繼資料
