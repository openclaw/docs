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
    generated_at: "2026-07-19T14:07:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f210dccab059527192eeb0aa2e780dcea243959273938ffaacc867ec96f5085e
    source_path: tools/plugin.md
    workflow: 16
---

外掛可透過頻道、模型供應商、代理程式執行框架、工具、
Skills、語音、即時轉錄、聲音、媒體理解、生成、
網頁擷取、網頁搜尋及其他執行階段功能來擴充 OpenClaw。

使用此頁面安裝外掛、重新啟動閘道、確認執行階段
已載入該外掛，並排解常見的設定失敗。僅含命令的範例請參閱
[管理外掛](/zh-TW/plugins/manage-plugins)。如需檢視自動產生的
內建、官方外部及僅限原始碼外掛清單，請參閱
[外掛清單](/zh-TW/plugins/plugin-inventory)。

## 需求

- 已安裝 OpenClaw 或具有其簽出內容，且可使用 `openclaw` 命令列介面
- 可透過網路存取所選來源（ClawHub、npm 或 git 主機）
- 具備該外掛設定文件所列的任何外掛專用認證資訊、設定鍵或作業系統工具
- 具有讓提供你頻道服務的閘道重新載入或重新啟動的權限

## 快速開始

<Steps>
  <Step title="尋找外掛">
    在 [ClawHub](/clawhub) 中搜尋公開外掛套件：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是探索社群外掛的主要介面。在
    上線切換期間，一般未加前綴的套件規格仍會從 npm 安裝，除非
    其符合官方外掛 ID。符合內建外掛的原始 `@openclaw/*` 規格會解析為
    該內建副本。需要明確指定來源時，
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

    # 從本機開發簽出內容。
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    請將安裝外掛視同執行程式碼。正式環境安裝建議使用固定版本，
    以確保可重現性。ClawHub 套件與 OpenClaw 的
    內建／官方目錄屬於受信任來源。新的任意 npm、git、
    本機路徑／封存檔、`npm-pack:` 或市集來源，都必須先
    審查並信任來源，才能在非互動式安裝中使用
    `--force`。

  </Step>

  <Step title="設定並啟用外掛">
    在 `plugins.entries.<id>.config` 下設定外掛專用設定。
    如果外掛尚未啟用，請予以啟用：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果已設定 `plugins.allow`，已安裝的外掛 ID 必須先列於其中，
    外掛才能載入。`openclaw plugins install` 會將已安裝的
    ID 加入現有的 `plugins.allow` 清單，並從
    `plugins.deny` 移除相同 ID，讓明確安裝的外掛可在重新啟動後載入。

  </Step>

  <Step title="讓閘道重新載入">
    安裝、更新或解除安裝外掛程式碼後，必須重新啟動閘道。
    已啟用設定重新載入功能的受管理閘道會偵測外掛安裝記錄的變更，
    並自動重新啟動。否則，請自行重新啟動：

    ```bash
    openclaw gateway restart
    ```

    啟用／停用操作會更新設定與冷啟動登錄。若要證明即時執行階段介面，
    執行階段檢查仍是最明確的方式。

  </Step>

  <Step title="驗證執行階段註冊">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    使用 `--runtime` 證明已註冊的工具、鉤子、服務、閘道
    方法或外掛擁有的命令列介面命令。單純的 `inspect` 僅會進行冷啟動資訊清單
    與登錄檢查。

  </Step>
</Steps>

## 設定

### 選擇安裝來源

| 來源        | 適用情況                                                                       | 範例                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | 需要 OpenClaw 原生探索、掃描、版本中繼資料及安裝提示時                         | `openclaw plugins install clawhub:<package>`                                             |
| npm         | 需要直接使用 npm 登錄或 dist-tag 工作流程時                                    | `openclaw plugins install npm:<package>`                                             |
| git         | 需要儲存庫中的分支、標籤或提交時                                               | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>`                                             |
| 本機路徑    | 在同一台機器上開發或測試外掛時                                                 | `openclaw plugins install --link ./my-plugin`                                             |
| 市集        | 安裝與 Claude 相容的市集外掛時                                                 | `openclaw plugins install <plugin> --marketplace <source>`                                             |

未加前綴的套件規格具有特殊的相容行為：若未加前綴的名稱
符合內建外掛 ID，則會使用該內建來源；若符合
官方外部外掛 ID，則會使用官方套件目錄；在上線切換期間，任何其他
未加前綴的規格都會透過 npm 安裝。符合內建外掛的原始 `@openclaw/*`
規格也會先解析為內建副本，才會退回使用 npm。
若要刻意安裝外部 npm 套件而非內建副本，請使用
`npm:@openclaw/<plugin>@<version>`。若要確定性地選擇來源，請使用 `clawhub:`、`npm:`、
`git:` 或 `npm-pack:`。完整的命令合約請參閱
[`openclaw plugins`](/zh-TW/cli/plugins#install)。

對於 npm 安裝，未固定的規格與 `@latest` 會選擇標示
與此 OpenClaw 組建相容的最新穩定套件。如果 npm
目前的最新版本宣告需要比此組建所支援版本更新的 `openclaw.compat.pluginApi` 或
`openclaw.install.minHostVersion`，OpenClaw 會掃描
較舊的穩定版本，並安裝符合條件的最新版本。確切版本
及 `@beta` 等明確的頻道標籤會固定使用所選套件，
並在不相容時失敗。

### 操作者安裝政策

設定 `security.installPolicy`，以便在外掛安裝或更新繼續進行前，
執行受信任的本機政策命令。該政策會接收中繼資料與
暫存來源路徑，並可允許或阻擋安裝。它同時涵蓋命令列介面
與閘道支援的安裝／更新路徑。外掛 `before_install` 鉤子會在
稍後執行，而且僅在已載入外掛鉤子的 OpenClaw 處理程序中執行，因此
操作者擁有的安裝決策應改用 `security.installPolicy`。
已棄用的 `--dangerously-force-unsafe-install` 旗標基於
相容性仍會被接受，但不會執行任何操作：它不會略過安裝政策或 OpenClaw
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
  工作。啟用此設定時，過時的外掛參照會保持停用；如果希望移除過時 ID，
  請先重新啟用外掛，再執行 doctor 清理。
- `plugins.deny` 的優先順序高於允許清單與個別外掛啟用設定。
- `plugins.allow` 是排他性允許清單。允許清單以外由外掛擁有的工具
  仍無法使用，即使 `tools.allow` 包含 `"*"` 亦然。
- `plugins.entries.<id>.enabled: false` 會停用單一外掛，但保留其
  設定。
- `plugins.load.paths` 會新增明確的本機外掛檔案或目錄。
  受管理的 `plugins install` 本機路徑必須是外掛目錄或
  封存檔；獨立外掛檔案請使用 `plugins.load.paths`。
- 源自工作區的外掛預設為停用；使用本機工作區程式碼前，
  請明確啟用外掛或將其加入允許清單。
- 除非設定明確覆寫，否則內建外掛會遵循其內建的預設啟用／預設停用中繼資料。
- `plugins.slots.<slot>`（`memory` 或 `contextEngine`）會為排他性類別選擇一個外掛。
  選擇插槽視為明確啟用，並會為該插槽強制啟用所選外掛，
  即使該外掛原本需要選擇加入。`plugins.deny` 與 `plugins.entries.<id>.enabled: false` 仍會
  阻擋該外掛。
- 當設定指定內建選擇加入外掛所擁有的介面之一時，
  該外掛可以自動啟用，例如供應商／模型參照、頻道設定、命令列介面後端
  或代理程式執行框架執行階段。
- OpenAI 系列的 Codex 路由會將供應商與執行階段外掛邊界
  分開：舊版 Codex 模型參照屬於 doctor 會修復的舊版設定，
  而內建的 `codex` 外掛擁有標準 `openai/*` 代理程式參照、
  明確的 `agentRuntime.id: "codex"` 及舊版 `codex/*` 參照所使用的 Codex
  應用程式伺服器執行階段。

未設定 `plugins.allow`，且從工作區或全域外掛根目錄自動探索到
非內建外掛時，啟動記錄會顯示
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
其中包含探索到的外掛 ID；若清單較短，也會提供最小的 `plugins.allow`
片段。將受信任外掛複製到 `openclaw.json` 前，請針對列出的
外掛 ID 執行 [`openclaw plugins list --enabled --verbose`](/zh-TW/cli/plugins#list)
或 [`openclaw plugins inspect <id>`](/zh-TW/cli/plugins#inspect)。診斷指出外掛載入了
`without install/load-path provenance` 時，也適用相同的信任固定作法：請檢查該外掛 ID，
再將其固定至 `plugins.allow`，或從受信任來源重新安裝，讓 OpenClaw 記錄安裝
來源。

當設定驗證回報過時的外掛 ID、允許清單／工具不相符或舊版內建外掛
路徑時，請執行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 瞭解外掛格式

OpenClaw 可辨識兩種外掛格式：

| 格式                   | 載入方式                                                                     | 適用情況                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 原生 OpenClaw 外掛     | `openclaw.plugin.json` 加上在處理程序中載入的執行階段模組                        | 安裝或建置 OpenClaw 專用執行階段功能時                                 |
| 相容套件組合           | 將 Codex、Claude 或 Cursor 外掛版面配置對應至 OpenClaw 外掛清單               | 重複使用相容的 Skills、命令、鉤子或套件組合中繼資料時                  |

這兩種格式都會出現在 `openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable` 及 `openclaw plugins disable` 中。套件組合相容性邊界請參閱
[外掛套件組合](/zh-TW/plugins/bundles)，原生外掛製作方式請參閱
[建置外掛](/zh-TW/plugins/building-plugins)。

## 外掛鉤子

外掛可透過兩種不同的 API，在執行階段註冊鉤子：

- `api.on(...)`：用於執行階段生命週期事件的具型別鉤子。這是
  中介軟體、政策、訊息改寫、提示詞塑形與工具控制的
  建議介面。
- `api.registerHook(...)`：用於 [鉤子](/zh-TW/automation/hooks) 所述的內部鉤子系統。
  這主要適用於粗粒度的命令／生命週期附帶作用，
  以及與現有 HOOK 樣式自動化的相容性。

簡要原則：如果處理常式需要優先順序、合併語意或
阻擋／取消行為，請使用具型別鉤子。如果只是回應 `command:new`、
`command:reset`、`message:sent` 或類似的粗粒度事件，使用 `api.registerHook`
即可。

由外掛管理的內部鉤子會以 `plugin:<id>` 顯示於
`openclaw hooks list` 中。你無法透過 `openclaw hooks` 啟用或停用這些鉤子；
請改為啟用或停用該外掛。

## 驗證使用中的閘道

`openclaw plugins list` 和一般的 `openclaw plugins inspect` 會讀取冷態設定、
資訊清單與登錄狀態。它們無法證明已在執行中的
閘道已匯入相同的外掛程式碼。

當外掛看似已安裝，但即時聊天流量未使用它時：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

受管理的閘道會在外掛安裝、更新及解除安裝變更造成外掛原始碼改變後
自動重新啟動。在 VPS 或容器安裝中，請確認任何手動重新啟動的目標是實際為
你的頻道提供服務的 `openclaw gateway run` 子程序，而不只是包裝程式或監督程式。

## 疑難排解

| 症狀                                                        | 檢查                                                                                                                                      | 修正                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 外掛出現在 `plugins list` 中，但執行階段鉤子未執行  | 使用 `openclaw plugins inspect <id> --runtime --json`，並透過 `gateway status --deep --require-rpc` 確認作用中的閘道             | 在安裝、更新、設定或原始碼變更後重新啟動即時閘道                               |
| 出現重複的頻道或工具擁有權診斷         | 執行 `openclaw plugins list --enabled --verbose`，使用 `--runtime --json` 檢查每個疑似外掛，並比較頻道／工具擁有權 | 停用其中一個擁有者、移除過時的安裝項目，或使用資訊清單 `preferOver` 進行刻意替換      |
| 設定指出缺少外掛                                | 查看[外掛清單](/zh-TW/plugins/plugin-inventory)，確認它是隨附、官方外部或僅原始碼外掛                           | 安裝外部套件、啟用隨附外掛，或移除過時設定                         |
| 安裝期間設定無效                               | 閱讀驗證訊息；若訊息指出外掛狀態過時，請執行 `openclaw doctor --fix`                                             | Doctor 可停用該項目並移除無效承載資料，以隔離無效的外掛設定     |
| 外掛路徑因可疑的擁有權或權限而遭封鎖 | 在設定錯誤之前檢查診斷訊息                                                                                             | 修正檔案系統擁有權／權限，然後執行 `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` 阻擋生命週期命令                | 確認安裝由 Nix 管理                                                                                                      | 在 Nix 原始碼中變更外掛選擇，而不要使用外掛異動命令                      |
| 執行階段匯入相依套件失敗                             | 確認外掛是透過 npm/git/ClawHub 安裝，還是從本機路徑載入                                                 | 執行 `openclaw plugins update <id>`、重新安裝來源，或自行安裝本機外掛的相依套件 |

當啟用的受管理外掛在閘道啟動期間未通過承載資料驗證時，
OpenClaw 會在此次啟動期間隔離該確切的已安裝外掛根目錄，
並繼續為其他外掛提供服務。`openclaw status --all`、`openclaw health`
和 `openclaw doctor` 會將其回報為 `configured-unavailable`。修正或重新安裝
該外掛，然後重新啟動閘道。使用相同外掛 ID 且狀態正常的明確 `plugins.load.paths`
覆寫，不會因過時且損壞的安裝項目而遭隔離。

當過時的外掛設定仍指定已無法探索到的頻道外掛時，
設定驗證會將該頻道鍵降級為警告，而非硬性失敗，
讓閘道啟動後仍可為其他所有頻道提供服務。執行
`openclaw doctor --fix` 以移除過時的外掛與頻道項目。沒有過時外掛證據的未知
頻道鍵仍會導致驗證失敗，讓拼字錯誤保持可見。

若要刻意替換頻道，偏好的外掛應宣告
`channelConfigs.<channel-id>.preferOver`，並指定舊版或優先順序較低的
外掛 ID。若兩個外掛都明確啟用，OpenClaw 會保留該要求，
並回報重複的頻道／工具診斷，而不是默默選擇其中一個擁有者。

如果已安裝套件回報它 `requires compiled runtime output for
TypeScript entry ...`，表示該套件發佈時未包含
OpenClaw 在執行階段所需的 JavaScript 檔案。請在發佈者提供已編譯的
JavaScript 後更新或重新安裝，或在此之前停用／解除安裝該外掛。

### 外掛路徑擁有權遭封鎖

如果診斷指出
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且隨後的驗證顯示 `plugin present but blocked`，表示 OpenClaw 發現
外掛檔案的 Unix 擁有者與載入這些檔案的程序使用者不同。
請保留外掛設定；修正檔案系統擁有權，或以擁有狀態目錄的相同使用者身分
執行 OpenClaw。

對於 Docker 安裝，官方映像檔會以 `node`（uid `1000`）執行，因此
主機以繫結掛載方式提供的 OpenClaw 設定和工作區目錄通常應由
uid `1000` 擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你刻意以 root 執行 OpenClaw，請改為將受管理外掛根目錄的擁有權
修復為 root：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正擁有權後，重新執行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，讓持久化的外掛登錄
與修復後的檔案一致。

### 外掛工具設定緩慢

如果代理程式回合似乎在準備工具時停滯，請啟用追蹤記錄，
並查看外掛工具工廠的計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] 工廠計時 ...
```

摘要會列出工廠總時間及最慢的外掛工具工廠，
包括外掛 ID、宣告的工具名稱、結果形態，以及工具是否為選用項目。
當單一工廠耗時至少 1s，或外掛工具工廠準備總時間至少為 5s 時，
緩慢的計時行會提升為警告。

OpenClaw 會快取成功的外掛工具工廠結果，供使用相同有效要求內容的
重複解析使用。快取鍵包含有效的執行階段設定、工作區與代理程式 ID、
沙箱原則、瀏覽器設定、傳遞內容、要求者身分及擁有權狀態，
因此依賴這些可信欄位的工廠會在內容變更時重新執行。
如果計時持續偏高，外掛可能在傳回工具定義之前執行了昂貴的工作。

如果某個外掛佔用了大部分時間，請檢查其執行階段註冊項目：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然後更新、重新安裝或停用該外掛。外掛作者應將昂貴的相依套件載入
移至工具執行路徑之後，而不要在工具工廠內執行。

關於相依套件根目錄、套件中繼資料驗證、登錄記錄、啟動時的
重新載入行為及舊版清理，請參閱
[外掛相依套件解析](/zh-TW/plugins/dependency-resolution)。

## 相關內容

- [管理外掛](/zh-TW/plugins/manage-plugins) - 列出、安裝、更新、解除安裝及發佈的命令範例
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整的命令列介面參考
- [外掛清單](/zh-TW/plugins/plugin-inventory) - 產生的隨附與外部外掛清單
- [外掛參考](/zh-TW/plugins/reference) - 產生的各外掛參考頁面
- [社群外掛](/zh-TW/plugins/community) - ClawHub 探索與文件 PR 原則
- [外掛相依套件解析](/zh-TW/plugins/dependency-resolution) - 安裝根目錄、登錄記錄與執行階段邊界
- [建置外掛](/zh-TW/plugins/building-plugins) - 原生外掛編寫指南
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview) - 執行階段註冊、鉤子與 API 欄位
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單與套件中繼資料
