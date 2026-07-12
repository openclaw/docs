---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理程式使用原生 Codex 外掛
    - 您正在遷移從原始碼安裝的 OpenAI 精選 Codex 外掛
    - 您正在設定現有工作區目錄中的 Codex 外掛
    - 您正在對 codexPlugins、應用程式清單、破壞性操作或外掛應用程式診斷進行疑難排解
summary: 為 Codex 模式的 OpenClaw 代理程式設定原生 Codex 外掛
title: 原生 Codex 外掛
x-i18n:
    generated_at: "2026-07-11T21:34:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 外掛支援可讓 Codex 模式的 OpenClaw 代理，在處理 OpenClaw 輪次的同一個 Codex 對話串中，使用 Codex app-server 本身的應用程式與外掛功能。外掛呼叫會保留在原生 Codex 逐字記錄中；由 Codex app-server 負責執行應用程式支援的 MCP。OpenClaw 不會將 Codex 外掛轉換成合成的 `codex_plugin_*` OpenClaw 動態工具。

請在基礎 [Codex 控制框架](/zh-TW/plugins/codex-harness)正常運作後使用本頁。

## 需求

- 代理執行階段必須是原生 Codex 控制框架。
- `plugins.entries.codex.enabled` 必須為 `true`。
- `plugins.entries.codex.config.codexPlugins.enabled` 必須為 `true`。
- 目標 Codex app-server 必須能看見預期的市集、外掛與應用程式清單。
- 遷移僅支援在來源 Codex 主目錄中觀察到以原始碼方式安裝的 `openai-curated` 外掛。
- 手動設定的 `workspace-directory` 外掛需要 Codex app-server 的 `plugin/list` 接受 `marketplaceKinds`，且無路徑的工作區摘要包含 `remotePluginId`。此外掛必須已安裝並啟用，且其所屬應用程式必須可透過 `app/list` 存取。

`codexPlugins` 不會影響 OpenClaw 提供者執行、ACP 對話繫結或其他控制框架，因為這些路徑不會使用原生 `apps` 設定建立 Codex app-server 對話串。

OpenAI 端的 Codex 帳戶、應用程式可用性，以及工作區應用程式／外掛控制，均來自已登入的 Codex 帳戶。如需瞭解 OpenAI 帳戶與管理模型，請參閱[搭配 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速開始

從來源 Codex 主目錄預覽遷移：

```bash
openclaw migrate codex --dry-run
```

加入 `--verify-plugin-apps`，讓遷移呼叫來源的 `app/list`，並要求每個所屬應用程式都存在、已啟用且可存取，之後才規劃原生啟用：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

確認規劃無誤後套用遷移：

```bash
openclaw migrate apply codex --yes
```

遷移會為符合資格的外掛寫入明確的 `codexPlugins` 項目，並為選定的外掛呼叫 Codex app-server 的 `plugin/install`。遷移後的設定如下：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

遷移仍僅限於 `openai-curated`。若要使用現有的 `workspace-directory` 外掛，請使用 `plugin/list` 傳回、包含完整市集限定資訊的確切 `summary.id` 手動加入。例如，若 Codex 傳回 `example-plugin@workspace-directory`，請設定此完整值，而不是其顯示名稱：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw 不會為 `workspace-directory` 外掛呼叫 `plugin/install` 或開始驗證。請先在 Codex 中安裝、啟用並完成驗證，再新增或啟用 OpenClaw 原則。若回應省略確切市集、外掛 ID、詳細資料 ID 或應用程式就緒證據，OpenClaw 會保持隱藏應用程式。若 Codex 拒絕明確的工作區 `plugin/list` 請求，OpenClaw 會為每個已啟用的工作區外掛回報 `marketplace_missing`，並維持任何獨立探索到的精選外掛可用。

變更 `codexPlugins` 後，新的 Codex 對話會自動採用更新後的應用程式集合。執行 `/new` 或 `/reset` 以重新整理目前的對話。啟用或停用外掛不需要重新啟動閘道。

## 從聊天管理外掛

`/codex plugins` 可讓你從操作 Codex 控制框架的同一個聊天中，檢查或變更已設定的原生 Codex 外掛：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的別名。此清單會顯示 `plugins.entries.codex.config.codexPlugins.plugins` 中每個已設定外掛的索引鍵、開啟／關閉狀態、Codex 外掛名稱及市集。

`enable`／`disable` 僅會寫入 `~/.openclaw/openclaw.json`；絕不會編輯 `~/.codex/config.toml` 或安裝新的 Codex 外掛。只有擁有者或具備 `operator.admin` 範圍的閘道用戶端可以執行這些命令。

啟用已設定的外掛也會開啟全域 `codexPlugins.enabled` 開關。若精選外掛因遷移傳回 `auth_required` 而被寫入為停用狀態，請先在 Codex 中重新授權該應用程式，再於 OpenClaw 中啟用。對於 `workspace-directory` 項目，在此啟用只會變更 OpenClaw 原則；該外掛與應用程式必須已在 Codex 中啟用。

## 原生外掛設定的運作方式

此整合會追蹤三種狀態：

| 狀態     | 意義                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| 已安裝   | Codex 已在目標 app-server 執行階段中安裝外掛套件。                                                                |
| 已啟用   | Codex 回報此外掛已啟用，且 OpenClaw 設定允許 Codex 控制框架輪次使用此外掛。                                        |
| 可存取   | Codex app-server 確認此外掛的應用程式項目可供使用中的帳戶存取，且可對應至已設定的外掛身分。                        |

對於 `openai-curated` 外掛，遷移是持久的安裝／資格判定步驟：

- 在規劃期間，OpenClaw 會讀取來源 Codex 的 `plugin/read` 詳細資料，並檢查來源 Codex app-server 帳戶是否為 ChatGPT 訂閱帳戶。若回應指出非 ChatGPT 帳戶或缺少帳戶，則會以 `codex_subscription_required` 略過應用程式支援的外掛。
- 預設情況下，遷移會略過來源 `app/list` 呼叫：通過帳戶門檻的應用程式支援來源外掛，會在不驗證來源應用程式可存取性的情況下納入規劃；帳戶查詢傳輸失敗則會以 `codex_account_unavailable` 略過。
- 使用 `--verify-plugin-apps` 時，遷移會取得全新的來源 `app/list` 快照，並要求每個所屬應用程式都存在、已啟用且可存取，之後才規劃原生啟用。帳戶查詢傳輸失敗時，將改由來源應用程式清單門檻處理，而非直接略過。

對於 `workspace-directory` 外掛，設定是在 OpenClaw 外部完成。只有在至少設定一個已啟用的工作區項目時，OpenClaw 才會查詢該市集；它會依確切的 `summary.id` 解析每個外掛，並重用現有的 `plugin/read` 所有權與 `app/list` 就緒檢查。未安裝、已停用、無法存取或未驗證的外掛不會公開任何應用程式；OpenClaw 不會嘗試安裝或驗證。

執行階段應用程式清單是遷移後的精選外掛與手動設定工作區外掛的目標工作階段可存取性檢查。Codex 控制框架工作階段設定會根據已啟用且可存取的外掛應用程式，計算限制性的對話串應用程式設定；不會在每個輪次重新計算，因此 `/codex plugins enable`／`disable` 僅影響新的 Codex 對話。使用 `/new` 或 `/reset`，讓目前對話套用變更。

## V1 支援範圍

- 只有已安裝在來源 Codex app-server 清單中的 `openai-curated` 外掛符合遷移資格。
- 執行階段也支援明確的 `workspace-directory` 項目，但 app-server 組建的 `plugin/list` 必須實作 `marketplaceKinds`，並為無路徑的工作區摘要傳回 `remotePluginId`。這些項目必須使用包含市集限定資訊的確切 `summary.id`，且必須已安裝、已啟用，並可存取應用程式。遭拒絕的工作區清單請求會產生現有的每外掛 `marketplace_missing` 診斷；缺少市集、外掛、詳細資料或應用程式證據時，不會公開任何工作區應用程式。預設清單請求中的精選清單仍可使用。
- 應用程式支援的來源外掛必須通過遷移時的訂閱門檻。`--verify-plugin-apps` 會加入來源應用程式清單門檻。受訂閱限制的帳戶，以及在驗證模式下無法存取／已停用／缺少來源應用程式或應用程式清單重新整理失敗的情況，會回報為已略過的手動項目，而非已啟用的設定項目。無法讀取的外掛詳細資料會在應用程式清單門檻前略過。
- 遷移會寫入明確的外掛身分（`marketplaceName` 與 `pluginName`）；不會寫入本機 `marketplacePath` 快取路徑。
- `codexPlugins.enabled` 是唯一的全域啟用開關；不存在授予任意安裝權限的 `plugins["*"]` 萬用字元或設定索引鍵。
- 非精選市集、已快取的外掛套件、掛鉤與 Codex 設定檔會保留在遷移報告中供手動審查，不會自動啟用。執行階段接受手動設定的 `workspace-directory` 項目；其他市集仍不受支援。

## 應用程式清單與所有權

OpenClaw 透過 app-server 的 `app/list` 讀取 Codex 應用程式清單，將其在記憶體中快取一小時，並以非同步方式重新整理過期或缺少的項目。此快取僅限處理程序本機；重新啟動命令列介面或閘道會清除快取，OpenClaw 會從下一次 `app/list` 讀取重建快取。

遷移與執行階段使用不同的快取索引鍵：

- 來源遷移驗證會使用來源 Codex 主目錄與啟動選項。它只會搭配 `--verify-plugin-apps` 執行，並為該次規劃執行強制進行全新的來源 `app/list` 走訪。
- 目標執行階段設定會在建構對話串應用程式設定時，使用目標代理的 Codex app-server 身分。精選外掛啟用會使該目標快取索引鍵失效，接著在 `plugin/install` 後強制重新整理。`workspace-directory` 設定絕不會執行此啟用路徑。

只有在 OpenClaw 能透過穩定的所有權，將外掛應用程式對應回已設定的外掛時，才會公開該應用程式：來自外掛詳細資料的確切應用程式 ID、已知的 MCP 伺服器名稱，或唯一且穩定的中繼資料。僅有顯示名稱或所有權不明確的項目會被排除，直到下一次清單重新整理能證明所有權。

## 已連線帳戶的應用程式

由擁有者操作的代理可以選擇使用其 Codex 帳戶中已連線的所有應用程式，而不需要對應的外掛套件：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

建立新的原生 Codex 對話串時，`allow_all_plugins: true` 會取得完整的 `app/list` 快照，且只允許標記為該帳戶可存取的應用程式。它不會全域安裝、驗證或啟用應用程式。現有對話串會保留其持久化的應用程式集合；請使用 `/new`、`/reset` 或重新啟動閘道，以套用新連線或已撤銷的應用程式。

帳戶應用程式會繼承全域 `codexPlugins.allow_destructive_actions` 值，其接受 `true`、`false`、`"auto"` 或 `"ask"`。對於重疊的應用程式 ID，明確的每外掛原則會覆寫全域原則。清單取得失敗時會採取封閉失敗，而不是退回不受限制的預設值。

## 對話串應用程式設定

OpenClaw 會為 Codex 執行緒注入限制性的 `config.apps` 修補：
`_default` 會停用，且只啟用由已設定並啟用之外掛所擁有的應用程式，或由 `allow_all_plugins` 准許且帳戶可存取的應用程式。

每個應用程式的 `destructive_enabled` 取決於有效的全域或各外掛 `allow_destructive_actions` 政策；`true`、`"auto"` 和 `"ask"` 都會設定 `destructive_enabled: true`，而 `false` 會將其設為 `false`。Codex 仍會依據其原生應用程式工具註解，強制執行破壞性工具中繼資料。
停用 `_default` 時會設定 `open_world_enabled: false`；已啟用的外掛應用程式則會取得 `open_world_enabled: true`。OpenClaw 不會公開獨立的外掛層級開放世界政策控制項，也不會維護各外掛的破壞性工具名稱拒絕清單。

對於獲准的應用程式，工具核准模式預設為自動，因此非破壞性的讀取工具無須在同一執行緒中顯示核准提示即可執行。破壞性工具仍由每個應用程式的 `destructive_enabled` 政策控制。

## 破壞性動作政策

對於已設定的 Codex 外掛，預設允許破壞性外掛資訊請求；但不安全的結構描述和歸屬不明的情況會採取封閉式拒絕：

- 全域 `allow_destructive_actions` 預設為 `true`。
- 各外掛的 `allow_destructive_actions` 會覆寫該外掛的全域政策。
- `false`：OpenClaw 會傳回確定性的拒絕。
- `true`：OpenClaw 僅會自動接受可對應至核准回應的安全結構描述，例如布林核准欄位。
- `"auto"`：OpenClaw 會向 Codex 公開破壞性外掛動作，接著將已證實歸屬的 MCP 核准資訊請求轉換為 OpenClaw 外掛核准，再傳回 Codex 核准回應。
- `"ask"`：OpenClaw 使用與 `"auto"` 相同的 Codex 寫入／破壞性閘控，在執行緒啟動前清除該應用程式的永久 Codex 各工具核准覆寫，且只提供單次核准或拒絕，避免永久核准抑制後續的寫入動作提示。對於每個使用 `"ask"` 的獲准應用程式，OpenClaw 會為該應用程式選取 Codex 的人工核准審核者，讓 Codex 將其核准資訊請求傳送給 OpenClaw；其他應用程式以及非應用程式的執行緒核准，則保留其已設定的審核者與政策。
- 缺少外掛身分、歸屬不明、缺少或不相符的回合 ID，或不安全的資訊請求結構描述，都會直接拒絕而不顯示提示。

## 疑難排解

| 代碼                                              | 意義                                                                                                                              | 修正方式                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 遷移已安裝外掛，但其某個應用程式仍需要驗證。該項目會以停用狀態寫入，直到你重新授權為止。 | 在 Codex 中重新授權該應用程式，然後在 OpenClaw 中啟用此外掛。                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | 使用 `--verify-plugin-apps` 時，來源 Codex 應用程式清冊未顯示所有所屬應用程式皆存在、已啟用且可存取。         | 在 Codex 中重新授權或啟用該應用程式，然後使用 `--verify-plugin-apps` 重新執行遷移。                              |
| `app_inventory_unavailable`                       | 已要求嚴格驗證來源應用程式，但重新整理來源 Codex 應用程式清冊失敗。                                      | 修復來源 Codex 應用程式伺服器的存取，或不使用 `--verify-plugin-apps` 重試，以接受速度較快、由帳戶閘控的方案。   |
| `codex_subscription_required`                     | 來源 Codex 應用程式伺服器帳戶不是 ChatGPT 訂閱帳戶。                                                          | 使用訂閱驗證登入 Codex 應用程式，然後重新執行遷移。                                                  |
| `codex_account_unavailable`                       | 無法讀取來源 Codex 應用程式伺服器帳戶。                                                                               | 修復來源 Codex 應用程式伺服器的驗證，或使用 `--verify-plugin-apps` 重新執行，讓來源應用程式清冊判定資格。 |
| `marketplace_missing`, `plugin_missing`           | 市集或指定外掛無法使用；明確的工作區目錄請求可能遭到拒絕；工作區應用程式會採取封閉式拒絕。  | 驗證下方所述相容的應用程式伺服器合約和確切 ID。                                                |
| `plugin_detail_unavailable`                       | OpenClaw 無法讀取外掛歸屬詳細資料。                                                                                    | 檢查目標應用程式伺服器的 `plugin/list` 和 `plugin/read` 回應。                                             |
| `plugin_disabled`                                 | Codex 回報外掛已安裝但已停用。                                                                                     | 精選啟用流程或許能修復此問題；重試前，請先在 Codex 中啟用工作區外掛。                                  |
| `plugin_activation_failed`                        | 外掛啟用未完成。                                                                                                  | 使用隨附的診斷資訊，區分市集、驗證、重新整理或工作區就緒狀態失敗。                |
| `app_inventory_missing`, `app_inventory_stale`    | 應用程式就緒狀態來自空白或過期的快取。                                                                                     | OpenClaw 會自動排程非同步重新整理；在歸屬和就緒狀態確定之前，外掛應用程式會維持排除狀態。  |
| `app_ownership_ambiguous`                         | 應用程式清冊僅依顯示名稱相符。                                                                                          | 在後續重新整理證實歸屬之前，該應用程式會保持不向 Codex 執行緒顯示。                                     |

**工作區外掛已安裝但不可見：**確認工作區
`plugin/list` 結果將設定的確切 ID 回報為已安裝且已啟用，
接著確認 `app/list` 回報同一個 Codex 帳戶可存取其擁有的每個應用程式。
即使帳戶清冊目前回報該應用程式已停用，OpenClaw 仍可為執行緒啟用可存取的應用程式。如果你在閘道快取應用程式清冊後變更了該狀態，請等待一小時的快取重新整理或重新啟動閘道，然後使用
`/new` 或 `/reset`。OpenClaw 不會修復工作區外掛或為其進行驗證。
如果明確的工作區清單請求遭到拒絕，每個已啟用的工作區項目都會回報 `marketplace_missing`；不相關的精選項目仍會依預設清單回應繼續處理。

針對 `plugin_detail_unavailable`，不含路徑的工作區摘要必須包含
`remotePluginId`；當該選取器或後續的 `plugin/read` 結果無法使用時，OpenClaw 會繼續隱藏所屬應用程式。針對
`plugin_activation_failed`，精選外掛可能會回報市集、驗證或安裝後重新整理失敗。工作區外掛在尚未啟用時會回報此代碼；請在 OpenClaw 之外安裝、啟用並驗證該外掛。

**設定已變更，但代理程式看不到外掛：**執行 `/codex plugins
list` 以確認設定狀態，然後執行 `/new` 或 `/reset`。現有的
Codex 執行緒繫結會保留啟動時的應用程式設定，直到 OpenClaw
建立新的執行框架工作階段或取代過期的繫結。

**破壞性動作遭到拒絕：**檢查全域和各外掛的
`allow_destructive_actions` 值。即使設為 `true`、`"auto"` 或 `"ask"`，
不安全的資訊請求結構描述和歸屬不明的外掛身分仍會採取封閉式拒絕。

## 相關內容

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [設定參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [遷移命令列介面](/zh-TW/cli/migrate)
