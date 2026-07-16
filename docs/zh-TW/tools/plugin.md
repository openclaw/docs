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
    generated_at: "2026-07-16T12:04:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

外掛可為 OpenClaw 擴充頻道、模型提供者、代理程式執行框架、工具、
Skills、語音、即時轉錄、聲音、媒體理解、生成、
網頁擷取、網頁搜尋及其他執行階段功能。

使用本頁安裝外掛、重新啟動閘道、確認執行階段
已載入外掛，並處理常見的設定失敗問題。如需僅含命令的範例，請參閱
[管理外掛](/zh-TW/plugins/manage-plugins)。如需隨附、官方外部及僅原始碼
外掛的產生式清單，請參閱
[外掛清單](/zh-TW/plugins/plugin-inventory)。

## 需求

- 已安裝 OpenClaw 或具有 OpenClaw 原始碼檢出，且可使用 `openclaw` 命令列介面
- 可透過網路存取所選來源（ClawHub、npm 或 git 主機）
- 具備該外掛設定文件所列的任何外掛專用認證資訊、設定鍵或作業系統工具
- 具備讓提供頻道服務的閘道重新載入或重新啟動的權限

## 快速開始

<Steps>
  <Step title="尋找外掛">
    在 [ClawHub](/zh-TW/clawhub) 搜尋公開外掛套件：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是探索社群外掛的主要介面。在
    啟動切換期間，一般未加前綴的套件規格仍會從 npm 安裝，除非
    它們符合官方外掛 ID。符合隨附外掛的原始 `@openclaw/*` 規格會解析為
    該隨附副本。需要指定某個來源時，
    請使用明確的來源前綴。

  </Step>

  <Step title="安裝外掛">
    ```bash
    # 從 ClawHub。
    openclaw plugins install clawhub:<package>

    # 從 npm。
    openclaw plugins install npm:<package>

    # 從 git。
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # 從本機開發原始碼檢出。
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    安裝外掛應視同執行程式碼。為使正式環境安裝結果
    可重現，建議使用固定版本。ClawHub 套件及 OpenClaw 的
    隨附／官方目錄均為信任來源。新的任意 npm、git、
    本機路徑／封存檔、`npm-pack:` 或市集來源，在你
    審查並信任來源後，非互動式安裝需要
    `--force`。

  </Step>

  <Step title="設定並啟用外掛">
    在 `plugins.entries.<id>.config` 下設定外掛專用設定。
    如果外掛尚未啟用，請啟用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果已設定 `plugins.allow`，已安裝的外掛 ID 必須位於該清單中，
    外掛才能載入。`openclaw plugins install` 會將已安裝的
    ID 加入現有的 `plugins.allow` 清單，並從
    `plugins.deny` 移除相同 ID，讓明確安裝的外掛可在重新啟動後載入。

  </Step>

  <Step title="讓閘道重新載入">
    安裝、更新或解除安裝外掛程式碼時，需要重新啟動閘道。
    啟用設定重新載入的受管理閘道會偵測外掛安裝記錄的變更，
    並自動重新啟動。否則，請自行重新啟動：

    ```bash
    openclaw gateway restart
    ```

    啟用／停用會更新設定及冷啟動登錄。執行階段檢查
    仍是證明即時執行階段介面最清楚的方式。

  </Step>

  <Step title="驗證執行階段註冊">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    使用 `--runtime` 證明已註冊的工具、掛鉤、服務、閘道
    方法或外掛擁有的命令列介面命令。單純的 `inspect` 僅執行冷啟動資訊清單
    與登錄檢查。

  </Step>
</Steps>

## 設定

### 選擇安裝來源

| 來源        | 適用情況                                                                       | 範例                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | 需要 OpenClaw 原生的探索、掃描、版本中繼資料及安裝提示                         | `openclaw plugins install clawhub:<package>`                                             |
| npm         | 需要直接使用 npm 登錄或 dist-tag 工作流程                                      | `openclaw plugins install npm:<package>`                                             |
| git         | 需要儲存庫中的分支、標籤或提交                                                  | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>`                                             |
| 本機路徑    | 正在同一部機器上開發或測試外掛                                                  | `openclaw plugins install --link ./my-plugin`                                             |
| 市集        | 正在安裝與 Claude 相容的市集外掛                                                | `openclaw plugins install <plugin> --marketplace <source>`                                             |

未加前綴的套件規格具有特殊相容行為：符合隨附外掛 ID 的未加前綴名稱
會使用該隨附來源；符合官方外部外掛 ID 的未加前綴名稱會使用官方套件目錄；
其他任何未加前綴的規格在啟動切換期間都會透過 npm 安裝。符合隨附外掛的原始 `@openclaw/*`
規格也會先解析為隨附副本，之後才回退至 npm。使用 `npm:@openclaw/<plugin>@<version>` 可刻意安裝
外部 npm 套件，而非隨附副本。使用 `clawhub:`、`npm:`、
`git:` 或 `npm-pack:` 可確定性地選擇來源。完整命令合約請參閱
[`openclaw plugins`](/zh-TW/cli/plugins#install)。

對於 npm 安裝，未固定版本的規格及 `@latest` 會選擇宣告與此 OpenClaw 組建
相容的最新穩定套件。如果 npm 目前的最新版本宣告的 `openclaw.compat.pluginApi` 或
`openclaw.install.minHostVersion` 高於此組建支援的版本，OpenClaw 會掃描
較舊的穩定版本，並安裝其中最新的相容版本。確切版本
及明確的頻道標籤（例如 `@beta`）會固定至所選套件，
並在不相容時失敗。

### 操作人員安裝政策

設定 `security.installPolicy`，以便在外掛安裝或更新繼續之前
執行受信任的本機政策命令。該政策會收到中繼資料及
暫存來源路徑，並可允許或封鎖安裝。它同時涵蓋命令列介面
及閘道支援的安裝／更新路徑。外掛 `before_install` 掛鉤
會在稍後執行，且僅在已載入外掛掛鉤的 OpenClaw 程序中執行，因此
操作人員擁有的安裝決策應改用 `security.installPolicy`。
已棄用的 `--dangerously-force-unsafe-install` 旗標會基於相容性而被接受，
但不會執行任何操作：它不會繞過安裝政策或 OpenClaw
內建的外掛相依性拒絕清單。

如需 Skills 與外掛共用的 `security.installPolicy` 執行結構描述，請參閱
[Skills 設定](/zh-TW/tools/skills-config#operator-install-policy-securityinstallpolicy)。

### 設定外掛政策

常見的外掛設定結構如下：

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

- `plugins.enabled: false` 會停用所有外掛，並略過探索／載入
  工作。啟用此設定時，過時的外掛參照會維持非作用狀態；如果要移除過時的 ID，
  請先重新啟用外掛，再執行 doctor 清理。
- `plugins.deny` 的優先順序高於允許清單及個別外掛啟用設定。
- `plugins.allow` 是排他性允許清單。即使 `tools.allow` 包含 `"*"`，
  不在允許清單中的外掛所擁有工具仍無法使用。
- `plugins.entries.<id>.enabled: false` 會停用單一外掛，同時保留其
  設定。
- `plugins.load.paths` 會加入明確的本機外掛檔案或目錄。
  受管理的 `plugins install` 本機路徑必須是外掛目錄或
  封存檔；獨立外掛檔案請使用 `plugins.load.paths`。
- 源自工作區的外掛預設為停用；使用本機工作區程式碼前，
  請明確啟用外掛或將其加入允許清單。
- 隨附外掛會遵循其內建的預設啟用／預設停用中繼資料，
  除非設定明確覆寫。
- `plugins.slots.<slot>`（`memory` 或 `contextEngine`）會為排他類別選擇一個外掛。
  選取插槽即視為明確啟用，並強制啟用為該插槽選取的外掛，
  即使它原本需要選擇加入。`plugins.deny` 和 `plugins.entries.<id>.enabled: false` 仍會
  封鎖它。
- 當設定指定隨附的選擇加入型外掛所擁有的某個介面時，
  這類外掛可自動啟用，例如提供者／模型參照、頻道設定、命令列介面後端
  或代理程式執行框架的執行階段。
- OpenAI 系列的 Codex 路由會將提供者與執行階段外掛邊界
  分開：舊版 Codex 模型參照屬於 doctor 會修復的舊版設定，
  而隨附的 `codex` 外掛負責標準 `openai/*` 代理程式參照、
  明確的 `agentRuntime.id: "codex"` 及舊版 `codex/*` 參照所使用的 Codex app-server 執行階段。

當未設定 `plugins.allow`，且從工作區或全域外掛根目錄自動探索到
非隨附外掛時，啟動記錄會輸出
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
以及探索到的外掛 ID；若清單較短，還會輸出最精簡的 `plugins.allow`
片段。將受信任的外掛複製到 `openclaw.json` 前，請對列出的
外掛 ID 執行 [`openclaw plugins list --enabled --verbose`](/zh-TW/cli/plugins#list)
或 [`openclaw plugins inspect <id>`](/zh-TW/cli/plugins#inspect)。當診斷指出外掛是以
`without install/load-path provenance` 載入時，也適用相同的信任固定方式：檢查該外掛 ID，
再將其固定於 `plugins.allow`，或從信任來源重新安裝，
讓 OpenClaw 記錄安裝來源。

當設定驗證回報過時的外掛 ID、允許清單／工具不符，
或舊版隨附外掛路徑時，請執行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 瞭解外掛格式

OpenClaw 可辨識兩種外掛格式：

| 格式                 | 載入方式                                                                     | 適用情況                                                               |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 原生 OpenClaw 外掛   | `openclaw.plugin.json` 加上程序內載入的執行階段模組                              | 正在安裝或建置 OpenClaw 專用的執行階段功能                             |
| 相容套件組合         | 將 Codex、Claude 或 Cursor 外掛配置映射至 OpenClaw 外掛清單                   | 正在重複使用相容的 Skills、命令、掛鉤或套件組合中繼資料                |

兩種格式都會出現在 `openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable` 及 `openclaw plugins disable` 中。如需套件組合相容性邊界，請參閱
[外掛套件組合](/zh-TW/plugins/bundles)；如需原生外掛編寫方式，請參閱
[建置外掛](/zh-TW/plugins/building-plugins)。

## 外掛掛鉤

外掛可透過兩種不同的 API 在執行階段註冊掛鉤：

- `api.on(...)`：用於執行階段生命週期事件的型別化掛鉤。這是
  中介軟體、政策、訊息重寫、提示詞塑形及工具控制的
  建議介面。
- `api.registerHook(...)`：用於[掛鉤](/zh-TW/automation/hooks)中所述的內部掛鉤系統。
  這主要用於粗粒度命令／生命週期副作用，
  以及與現有 HOOK 風格自動化的相容性。

簡單規則：如果處理常式需要優先順序、合併語意或
封鎖／取消行為，請使用型別化掛鉤。如果只是回應 `command:new`、
`command:reset`、`message:sent` 或類似的粗粒度事件，使用 `api.registerHook`
即可。

由外掛管理的內部掛鉤會在 `openclaw hooks list` 中顯示，並帶有
`plugin:<id>`。你無法透過 `openclaw hooks` 啟用或停用它們；
請改為啟用或停用外掛。

## 驗證作用中的閘道

`openclaw plugins list` 和一般的 `openclaw plugins inspect` 會讀取冷態設定、
資訊清單與登錄狀態。它們無法證明已在執行中的
閘道已匯入相同的外掛程式碼。

當外掛看似已安裝，但即時聊天流量並未使用它時：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

受管理的閘道會在外掛安裝、更新和解除安裝變更造成外掛原始碼異動後
自動重新啟動。在 VPS 或容器安裝環境中，請確保任何手動重新啟動都以實際為
頻道提供服務的 `openclaw gateway run` 子程序為目標，而不只是包裝程式或監督程式。

## 疑難排解

| 症狀                                                        | 檢查                                                                                                                                      | 修正                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 外掛出現在 `plugins list` 中，但執行階段鉤子未執行  | 使用 `openclaw plugins inspect <id> --runtime --json`，並透過 `gateway status --deep --require-rpc` 確認使用中的閘道             | 在安裝、更新、設定或原始碼變更後重新啟動即時閘道                               |
| 出現重複的頻道或工具擁有權診斷         | 執行 `openclaw plugins list --enabled --verbose`、使用 `--runtime --json` 檢查每個疑似外掛，並比較頻道／工具擁有權 | 停用其中一個擁有者、移除過時的安裝項目，或使用資訊清單的 `preferOver` 進行刻意替換      |
| 設定指出缺少某個外掛                                | 查看[外掛清單](/zh-TW/plugins/plugin-inventory)，確認它是內建、官方外部或僅提供原始碼                           | 安裝外部套件、啟用內建外掛，或移除過時設定                         |
| 安裝期間設定無效                               | 閱讀驗證訊息；若它指出外掛狀態過時，請執行 `openclaw doctor --fix`                                             | Doctor 可停用該項目並移除無效承載資料，以隔離無效的外掛設定     |
| 外掛路徑因可疑的擁有權或權限而遭封鎖 | 檢查設定錯誤之前的診斷                                                                                             | 修正檔案系統的擁有權／權限，然後執行 `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` 封鎖生命週期命令                | 確認此安裝由 Nix 管理                                                                                                      | 在 Nix 原始碼中變更外掛選擇，而不要使用外掛修改命令                      |
| 執行階段的相依套件匯入失敗                             | 檢查外掛是透過 npm／git／ClawHub 安裝，還是從本機路徑載入                                                 | 執行 `openclaw plugins update <id>`、重新安裝來源，或自行安裝本機外掛的相依套件 |

當過時的外掛設定仍指定已無法探索的頻道外掛時，
設定驗證會將該頻道鍵降級為警告，而非硬性
失敗，使閘道啟動後仍可為其他所有頻道提供服務。執行
`openclaw doctor --fix` 以移除過時的外掛與頻道項目。沒有
過時外掛證據的未知頻道鍵仍會導致驗證失敗，讓拼字錯誤
維持可見。

若要刻意替換頻道，偏好的外掛應使用舊版或優先順序較低的
外掛 ID 宣告
`channelConfigs.<channel-id>.preferOver`。如果兩個外掛都已明確啟用，OpenClaw 會保留該要求，
並回報重複的頻道／工具診斷，而不會默默選擇
其中一個擁有者。

如果已安裝的套件回報它 `requires compiled runtime output for
TypeScript entry ...`，表示套件發布時未包含 OpenClaw
執行階段所需的 JavaScript 檔案。請在發布者提供
已編譯的 JavaScript 後更新或重新安裝，或在此之前停用／解除安裝該外掛。

### 外掛路徑擁有權遭封鎖

如果診斷指出
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且接著出現驗證訊息 `plugin present but blocked`，表示 OpenClaw 發現
外掛檔案的 Unix 擁有者與載入它們的程序使用者不同。
請保留外掛設定；修正檔案系統擁有權，或以擁有狀態目錄的
相同使用者身分執行 OpenClaw。

對於 Docker 安裝，官方映像檔會以 `node`（uid `1000`）執行，因此主機上透過繫結掛載的
OpenClaw 設定與工作區目錄通常應由 uid `1000`
擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你刻意以 root 身分執行 OpenClaw，則應改為將受管理外掛根目錄的
擁有權修復為 root：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正擁有權後，請重新執行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，使持久保存的外掛登錄
與修復後的檔案一致。

### 外掛工具設定緩慢

如果代理程式輪次在準備工具時似乎停滯，請啟用追蹤記錄，
並檢查外掛工具工廠的計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出工廠總耗時與最慢的外掛工具工廠，
包括外掛 ID、宣告的工具名稱、結果形態，以及工具
是否為選用。當單一工廠耗時
至少 1s，或外掛工具工廠準備總耗時至少 5s 時，緩慢行會提升為警告。

OpenClaw 會快取成功的外掛工具工廠結果，以供使用相同有效要求情境時
重複解析。快取鍵包含
有效的執行階段設定、工作區和代理程式 ID、沙箱原則、瀏覽器
設定、遞送情境、要求者身分與擁有權狀態，因此
依賴這些受信任欄位的工廠會在情境
變更時重新執行。如果耗時持續偏高，外掛可能在
傳回工具定義前執行了高成本工作。

如果某個外掛占據大部分耗時，請檢查其執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

接著更新、重新安裝或停用該外掛。外掛作者應將
高成本的相依套件載入移至工具執行路徑之後，而不要在
工具工廠內執行。

如需相依套件根目錄、套件中繼資料驗證、登錄記錄、啟動時
重新載入行為與舊版項目清理的資訊，請參閱
[外掛相依套件解析](/zh-TW/plugins/dependency-resolution)。

## 相關內容

- [管理外掛](/zh-TW/plugins/manage-plugins) - 列出、安裝、更新、解除安裝與發布的命令範例
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整的命令列介面參考
- [外掛清單](/zh-TW/plugins/plugin-inventory) - 產生的內建與外部外掛清單
- [外掛參考](/zh-TW/plugins/reference) - 產生的各外掛參考頁面
- [社群外掛](/zh-TW/plugins/community) - ClawHub 探索與文件 PR 原則
- [外掛相依套件解析](/zh-TW/plugins/dependency-resolution) - 安裝根目錄、登錄記錄與執行階段邊界
- [建置外掛](/zh-TW/plugins/building-plugins) - 原生外掛撰寫指南
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview) - 執行階段註冊、鉤子與 API 欄位
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單與套件中繼資料
