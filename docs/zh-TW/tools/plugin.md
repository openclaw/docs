---
doc-schema-version: 1
read_when:
    - 安裝或設定外掛
    - 了解外掛探索與載入規則
    - 使用與 Codex/Claude 相容的外掛套件
sidebarTitle: Getting Started
summary: 安裝、設定及管理 OpenClaw 外掛
title: 外掛
x-i18n:
    generated_at: "2026-06-27T20:09:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

外掛透過通道、模型提供者、代理程式框架、工具、Skills、語音、即時轉錄、聲音、媒體理解、生成、網頁擷取、網頁搜尋，以及其他執行階段能力來擴充 OpenClaw。

當你想要安裝外掛、重新啟動閘道、確認執行階段已載入外掛，並排查常見設定失敗時，請使用此頁面。若需要僅含命令的範例，請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。若需要隨附、官方外部與僅原始碼外掛的完整產生清單，請參閱[外掛清單](/zh-TW/plugins/plugin-inventory)。

## 需求

安裝外掛前，請確認你具備：

- 可使用 `openclaw` 命令列介面的 OpenClaw checkout 或安裝
- 對所選來源的網路存取，例如 ClawHub、npm 或 git 主機
- 該外掛設定文件中列出的任何外掛專屬憑證、設定鍵或作業系統工具
- 服務你通道的閘道具備重新載入或重新啟動的權限

## 快速開始

<Steps>
  <Step title="尋找外掛">
    在 [ClawHub](/zh-TW/clawhub) 搜尋公開外掛套件：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是社群外掛的主要探索介面。在啟動切換期間，一般裸套件規格仍會從 npm 安裝，除非它們符合官方外掛 id。符合隨附外掛的原始 `@openclaw/*` 套件規格會使用目前 OpenClaw build 中的隨附副本。當你需要指定某個來源時，請使用明確前綴。

  </Step>

  <Step title="安裝外掛">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    請把安裝外掛視為執行程式碼。當你需要可重現的正式環境安裝時，建議使用固定版本。

  </Step>

  <Step title="設定並啟用它">
    在 `plugins.entries.<id>.config` 下設定外掛專屬設定。若外掛尚未啟用，請啟用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果你的設定使用限制性的 `plugins.allow` 清單，已安裝的外掛 id 必須先出現在其中，外掛才能載入。
    `openclaw plugins install` 會將已安裝的 id 加入既有的 `plugins.allow` 清單，並從 `plugins.deny` 移除相同 id，讓明確安裝的外掛能在重新啟動後載入。

  </Step>

  <Step title="讓閘道重新載入">
    安裝、更新或解除安裝外掛程式碼需要重新啟動閘道。當受管理的閘道已執行且啟用設定重新載入時，OpenClaw 會偵測變更後的外掛安裝記錄，並自動重新啟動閘道。如果閘道未受管理或已停用重新載入，請自行重新啟動：

    ```bash
    openclaw gateway restart
    ```

    啟用與停用操作會更新設定並重新整理冷啟動登錄。執行階段檢查仍是驗證即時執行階段介面的最清楚路徑。

  </Step>

  <Step title="驗證執行階段註冊">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    當你需要證明已註冊的工具、hooks、服務、閘道方法或外掛擁有的命令列介面命令時，請使用 `--runtime`。一般 `inspect` 是冷啟動 manifest 與登錄檢查。

  </Step>
</Steps>

## 設定

### 選擇安裝來源

| 來源        | 使用時機                                                                       | 範例                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | 你需要 OpenClaw 原生的探索、掃描、版本中繼資料與安裝提示                      | `openclaw plugins install clawhub:<package>`                   |
| npm         | 你需要直接使用 npm 登錄或 dist-tag 工作流程                                    | `openclaw plugins install npm:<package>`                       |
| git         | 你需要儲存庫中的分支、標籤或 commit                                           | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本機路徑    | 你正在同一台機器上開發或測試外掛                                               | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | 你正在安裝 Claude 相容的 marketplace 外掛                                      | `openclaw plugins install <plugin> --marketplace <source>`     |

裸套件規格具有特殊相容性行為。如果裸名稱符合隨附外掛 id，OpenClaw 會使用該隨附來源。如果它符合官方外部外掛 id，OpenClaw 會使用官方套件目錄。其他一般裸套件規格會在啟動切換期間透過 npm 安裝。符合隨附外掛的原始 `@openclaw/*` 套件規格也會在 npm fallback 前解析為隨附副本。當你刻意想使用外部 npm 套件，而不是映像擁有的隨附副本時，請使用 `npm:@openclaw/<plugin>@<version>`。當你需要確定性的來源選擇時，請使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`。完整命令合約請參閱 [`openclaw plugins`](/zh-TW/cli/plugins#install)。

對於 npm 安裝，未固定的套件規格與 `@latest` 會選擇宣告與此 OpenClaw build 相容的最新穩定套件。如果 npm 目前的 latest release 宣告較新的 `openclaw.compat.pluginApi` 或 `openclaw.install.minHostVersion`，OpenClaw 會掃描較舊的穩定套件版本，並安裝符合條件的最新版本。精確版本與明確通道標籤（例如 `@beta`）會固定在選定套件，若不相容則失敗。

### 操作者安裝政策

設定 `security.installPolicy`，在外掛安裝或更新繼續前執行受信任的本機政策命令。該政策會接收中繼資料以及暫存來源路徑，並可允許或封鎖安裝。它涵蓋命令列介面與閘道支援的外掛安裝/更新路徑。外掛 `before_install` hooks 只會稍後在已載入外掛 hooks 的 OpenClaw 行程中執行，因此請使用 `security.installPolicy` 處理操作者擁有的安裝決策。已棄用的 `--dangerously-force-unsafe-install` 旗標為了相容性仍會接受，但不會繞過安裝政策或 OpenClaw 內建的外掛相依性拒絕清單。

請參閱 [Skills 設定](/zh-TW/tools/skills-config#operator-install-policy-securityinstallpolicy)，了解 Skills 與外掛共用的 `security.installPolicy` exec schema。

### 設定外掛政策

常見外掛設定形狀如下：

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

- `plugins.enabled: false` 會停用所有外掛，並略過外掛探索/載入工作。啟用期間，過時外掛參照會保持非作用狀態；若你想移除過時 id，請先重新啟用外掛再執行 doctor cleanup。
- `plugins.deny` 優先於 allow 與個別外掛啟用狀態。
- `plugins.allow` 是獨占允許清單。允許清單外的外掛擁有工具會維持不可用，即使 `tools.allow` 包含 `"*"`。
- `plugins.entries.<id>.enabled: false` 會停用單一外掛，同時保留其設定。
- `plugins.load.paths` 會加入明確的本機外掛檔案或目錄。受管理的 `plugins install` 本機路徑必須是外掛目錄或封存檔；獨立外掛檔案請使用 `plugins.load.paths`。
- 來自工作區的外掛預設為停用；使用本機工作區程式碼前，請明確啟用或將其加入允許清單。
- 隨附外掛會遵循其內建的預設開啟/預設關閉中繼資料，除非設定明確覆寫。
- `plugins.slots.<slot>` 會為記憶與情境引擎等獨占類別選擇一個外掛。Slot 選擇會計為明確啟用，因而強制啟用該 slot 所選外掛；即使它原本是 opt-in，也能載入。`plugins.deny` 與 `plugins.entries.<id>.enabled: false` 仍會封鎖它。
- 當設定命名隨附 opt-in 外掛擁有的某個介面時，例如提供者/模型 ref、通道設定、命令列介面後端或代理程式框架執行階段，該外掛可以自動啟用。
- OpenAI 系列 Codex 路由會讓提供者與執行階段外掛邊界保持分離：舊版 Codex 模型 refs 是由 doctor 修復的舊版設定，而隨附的 `codex` 外掛擁有 canonical `openai/*` 代理程式 refs、明確 `agentRuntime.id: "codex"` 與舊版 `codex/*` refs 的 Codex app-server 執行階段。

當 `plugins.allow` 未設定，且非隨附外掛是從工作區或全域外掛根目錄自動探索時，啟動記錄會顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`。警告會包含已探索的外掛 id；若清單較短，還會包含最小的 `plugins.allow` 片段。將受信任外掛複製到 `openclaw.json` 前，請使用列出的外掛 id 執行 [`openclaw plugins list --enabled --verbose`](/zh-TW/cli/plugins#list) 或 [`openclaw plugins inspect <id>`](/zh-TW/cli/plugins#inspect)。當診斷指出某個外掛已 `without install/load-path provenance` 載入時，也適用相同的信任固定指引：檢查該外掛 id，然後將受信任 id 固定在 `plugins.allow`，或從受信任來源重新安裝，讓 OpenClaw 記錄安裝來源。

當設定驗證回報過時外掛 id、允許清單/工具不相符或舊版隨附外掛路徑時，請執行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 了解外掛格式

OpenClaw 可辨識兩種外掛格式：

| 格式                 | 載入方式                                                                     | 使用時機                                                               |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 原生 OpenClaw 外掛   | `openclaw.plugin.json` 加上在行程內載入的執行階段模組                       | 你正在安裝或建置 OpenClaw 專屬執行階段能力                            |
| 相容 bundle          | 對應到 OpenClaw 外掛清單的 Codex、Claude 或 Cursor 外掛版面配置             | 你正在重用相容的 Skills、命令、hooks 或 bundle 中繼資料                |

兩種格式都會出現在 `openclaw plugins list`、`openclaw plugins inspect`、`openclaw plugins enable` 與 `openclaw plugins disable` 中。bundle 相容性邊界請參閱[外掛 bundle](/zh-TW/plugins/bundles)，原生外掛撰寫請參閱[建置外掛](/zh-TW/plugins/building-plugins)。

## 外掛 hooks

外掛可以在執行階段註冊 hooks，但有兩個不同 API，職責也不同。

- 對執行階段生命週期 hooks，請透過 `api.on(...)` 使用型別化 hooks。這是 middleware、政策、訊息重寫、提示塑形與工具控制的建議介面。
- 只有當你想參與 [Hooks](/zh-TW/automation/hooks) 中描述的內部 hook 系統時，才使用 `api.registerHook(...)`。這主要用於粗粒度命令/生命週期副作用，以及與既有 HOOK 風格自動化的相容性。

快速規則：

- 如果 handler 需要優先順序、合併語義或封鎖/取消行為，請使用型別化外掛 hooks。
- 如果 handler 只是回應 `command:new`、`command:reset`、`message:sent` 或類似粗粒度事件，使用 `api.registerHook(...)` 即可。

由外掛管理的內部 hooks 會以 `plugin:<id>` 出現在 `openclaw hooks list` 中。你無法透過 `openclaw hooks` 啟用或停用它們；請改為啟用或停用外掛。

## 驗證作用中的閘道

`openclaw plugins list` 和單純的 `openclaw plugins inspect` 會讀取冷態設定、manifest 與 registry 狀態。它們無法證明已在執行中的閘道已匯入相同的外掛程式碼。

當外掛顯示已安裝，但即時聊天流量沒有使用它時：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

受管理的閘道會在外掛安裝、更新，以及變更外掛來源的解除安裝後自動重新啟動。在 VPS 或容器安裝中，請確認任何手動重新啟動的目標都是實際服務你頻道的 `openclaw gateway run` 子程序，而不只是包裝器或監督程序。

## 疑難排解

| 症狀                                                        | 檢查                                                                                                                                      | 修正                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 外掛出現在 `plugins list` 中，但執行階段 hooks 沒有執行  | 使用 `openclaw plugins inspect <id> --runtime --json`，並透過 `gateway status --deep --require-rpc` 確認作用中的閘道             | 在安裝、更新、設定或來源變更後，重新啟動即時閘道                               |
| 出現重複頻道或工具擁有權診斷         | 執行 `openclaw plugins list --enabled --verbose`，使用 `--runtime --json` 檢查每個可疑外掛，並比較頻道/工具擁有權 | 停用其中一個擁有者、移除過期安裝，或使用 manifest `preferOver` 進行有意替換      |
| 設定指出缺少某個外掛                                | 查看[外掛清單](/zh-TW/plugins/plugin-inventory)，確認它是內建、官方外部，或僅來源形式                           | 安裝外部套件、啟用內建外掛，或移除過期設定                         |
| 安裝期間設定無效                               | 閱讀驗證訊息，並在它指出過期外掛狀態時執行 `openclaw doctor --fix`                                           | Doctor 可以透過停用該項目並移除無效 payload，隔離無效的外掛設定     |
| 外掛路徑因可疑擁有權或權限而遭封鎖 | 在設定錯誤前檢查診斷                                                                                             | 修正檔案系統擁有權/權限，然後執行 `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` 封鎖生命週期命令                | 確認安裝由 Nix 管理                                                                                                      | 在 Nix 來源中變更外掛選擇，而不是使用外掛變更命令                      |
| 相依項匯入在執行階段失敗                             | 檢查外掛是透過 npm/git/ClawHub 安裝，或從本機路徑載入                                                 | 執行 `openclaw plugins update <id>`、重新安裝來源，或自行安裝本機外掛相依項 |

當過期外掛設定仍命名一個已無法探索的頻道外掛時，閘道啟動會略過該外掛支援的頻道，而不是封鎖所有其他頻道。執行 `openclaw doctor --fix` 以移除過期外掛與頻道項目。沒有過期外掛證據的未知頻道鍵仍會導致驗證失敗，讓錯字保持可見。

若是有意替換頻道，偏好的外掛應宣告 `channelConfigs.<channel-id>.preferOver`，並填入舊版或較低優先順序的外掛 id。如果兩個外掛都已明確啟用，OpenClaw 會保留該要求，並回報重複頻道或工具診斷，而不是默默選擇其中一個擁有者。

如果已安裝套件回報它 `requires compiled runtime output for TypeScript entry ...`，表示該套件發佈時缺少 OpenClaw 在執行階段需要的 JavaScript 檔案。請在發佈者提供已編譯的 JavaScript 後更新或重新安裝，或在此之前停用/解除安裝該外掛。

### 遭封鎖的外掛路徑擁有權

如果外掛診斷顯示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
而設定驗證接著顯示 `plugin present but blocked`，表示 OpenClaw 發現外掛檔案的 Unix 使用者擁有者，與載入它們的程序不同。保留外掛設定；修正檔案系統擁有權，或以擁有狀態目錄的同一位使用者執行 OpenClaw。

對於 Docker 安裝，官方映像檔會以 `node`（uid `1000`）執行，因此主機 bind-mounted 的 OpenClaw 設定與工作區目錄通常應由 uid `1000` 擁有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 執行 OpenClaw，請改為將受管理外掛根目錄修復為 root 擁有權：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修正擁有權後，重新執行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，讓持久化外掛 registry 與已修復的檔案一致。

### 緩慢的外掛工具設定

如果代理回合在準備工具時似乎停滯，請啟用 trace 記錄並檢查外掛工具 factory 計時行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

尋找：

```text
[trace:plugin-tools] factory timings ...
```

摘要會列出總 factory 時間與最慢的外掛工具 factories，包括外掛 id、宣告的工具名稱、結果形狀，以及該工具是否為選用。當單一 factory 花費至少 1 秒，或外掛工具 factory 準備總時間至少 5 秒時，緩慢行會提升為警告。

OpenClaw 會針對相同有效請求情境下的重複解析，快取成功的外掛工具 factory 結果。快取鍵包含有效執行階段設定、工作區、代理/工作階段 id、沙箱政策、瀏覽器設定、交付情境、請求者身分，以及擁有權狀態，因此依賴這些受信任欄位的 factories 會在情境變更時重新執行。如果計時仍然偏高，該外掛可能在回傳工具定義前執行昂貴工作。

如果某個外掛主導計時，請檢查它的執行階段註冊：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然後更新、重新安裝或停用該外掛。外掛作者應將昂貴的相依項載入移到工具執行路徑之後，而不是在工具 factory 內執行。

如需相依項根目錄、套件中繼資料驗證、registry 記錄、啟動重新載入行為，以及舊版清理，請參閱[外掛相依項解析](/zh-TW/plugins/dependency-resolution)。

## 相關

- [管理外掛](/zh-TW/plugins/manage-plugins) - list、install、update、uninstall 與 publish 的命令範例
- [`openclaw plugins`](/zh-TW/cli/plugins) - 完整命令列介面參考
- [外掛清單](/zh-TW/plugins/plugin-inventory) - 產生的內建與外部外掛清單
- [外掛參考](/zh-TW/plugins/reference) - 產生的各外掛參考頁面
- [社群外掛](/zh-TW/plugins/community) - ClawHub 探索與文件 PR 政策
- [外掛相依項解析](/zh-TW/plugins/dependency-resolution) - 安裝根目錄、registry 記錄與執行階段邊界
- [建置外掛](/zh-TW/plugins/building-plugins) - 原生外掛撰寫指南
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview) - 執行階段註冊、hooks 與 API 欄位
- [外掛 manifest](/zh-TW/plugins/manifest) - manifest 與套件中繼資料
