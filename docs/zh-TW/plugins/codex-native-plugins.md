---
read_when:
    - 你希望 Codex 模式的 OpenClaw agent 使用原生 Codex 外掛
    - 你正在遷移從原始碼安裝的 OpenAI 精選 Codex 外掛
    - 你正在疑難排解 `codexPlugins`、應用程式清單、破壞性動作或外掛應用程式診斷
summary: 為 Codex 模式的 OpenClaw 代理設定已遷移的原生 Codex 外掛
title: 原生 Codex 外掛
x-i18n:
    generated_at: "2026-07-05T11:34:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd3e810380b99bb3fffd07eeeeb7bb41583951d4acc4ee28b30c74d27f854148
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 外掛支援讓 Codex 模式的 OpenClaw 代理程式，能在處理 OpenClaw 回合的同一個 Codex 對話串中，使用 Codex app-server 自身的應用程式與外掛能力。外掛呼叫會保留在原生 Codex 逐字稿中；Codex app-server 負責應用程式支援的 MCP 執行。OpenClaw 不會把 Codex 外掛轉譯成合成的 `codex_plugin_*` OpenClaw 動態工具。

請在基礎 [Codex harness](/zh-TW/plugins/codex-harness) 已可運作後使用此頁。

## 需求

- 代理程式執行階段必須是原生 Codex harness。
- `plugins.entries.codex.enabled` 為 `true`。
- `plugins.entries.codex.config.codexPlugins.enabled` 為 `true`。
- 目標 Codex app-server 可以看到預期的 marketplace、外掛與應用程式清單。
- V1 僅支援遷移時觀察到在來源 Codex home 中以原始碼方式安裝的 `openai-curated` 外掛。

`codexPlugins` 對 OpenClaw provider 執行、ACP 對話繫結或其他 harness 沒有效果，因為這些路徑不會建立帶有原生 `apps` 設定的 Codex app-server 對話串。

OpenAI 端的 Codex 帳戶、應用程式可用性，以及工作區應用程式/外掛控制，來自已登入的 Codex 帳戶。請參閱 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) 了解 OpenAI 帳戶與管理模型。

## 快速開始

從來源 Codex home 預覽遷移：

```bash
openclaw migrate codex --dry-run
```

加入 `--verify-plugin-apps`，讓遷移呼叫來源 `app/list`，並在規劃原生活化前，要求每個擁有的應用程式都存在、已啟用且可存取：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

當計畫看起來正確時套用遷移：

```bash
openclaw migrate apply codex --yes
```

遷移會為符合資格的外掛寫入明確的 `codexPlugins` 項目，並針對選取的外掛呼叫 Codex app-server `plugin/install`。遷移後的設定如下：

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

變更 `codexPlugins` 後，新的 Codex 對話會自動取得更新後的應用程式集合。執行 `/new` 或 `/reset` 來重新整理目前對話。啟用/停用外掛變更不需要重新啟動閘道。

## 從聊天管理外掛

`/codex plugins` 可從你操作 Codex harness 的同一個聊天中檢查或變更已設定的原生 Codex 外掛：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的別名。清單會顯示每個已設定外掛的鍵、開/關狀態、Codex 外掛名稱，以及來自 `plugins.entries.codex.config.codexPlugins.plugins` 的 marketplace。

`enable`/`disable` 只會寫入 `~/.openclaw/openclaw.json`；它們永遠不會編輯 `~/.codex/config.toml` 或安裝新的 Codex 外掛。只有擁有者或具備 `operator.admin` 範圍的閘道用戶端可以執行它們。

啟用已設定的外掛也會開啟全域 `codexPlugins.enabled` 開關。如果外掛因為遷移傳回 `auth_required` 而被寫成停用，請先在 Codex 中重新授權應用程式，再於 OpenClaw 中啟用它。

## 原生外掛設定如何運作

整合會追蹤三種狀態：

| 狀態       | 意義                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已安裝     | Codex 在目標 app-server 執行階段中有本機外掛套件。                                                                               |
| 已啟用     | OpenClaw 設定允許該外掛用於 Codex harness 回合。                                                                                 |
| 可存取     | Codex app-server 確認該外掛的應用程式項目可供作用中帳戶使用，且對應到已遷移的外掛身分。                                         |

遷移是持久的安裝/資格步驟：

- 規劃期間，OpenClaw 會讀取來源 Codex `plugin/read` 詳細資料，並檢查來源 Codex app-server 帳戶是否為 ChatGPT 訂閱帳戶。非 ChatGPT 或缺少帳戶回應，會以 `codex_subscription_required` 跳過應用程式支援的外掛。
- 預設情況下，遷移會跳過來源 `app/list` 呼叫：通過帳戶閘門的應用程式支援來源外掛，會在未驗證來源應用程式可存取性的情況下被規劃，而帳戶查詢傳輸失敗會以 `codex_account_unavailable` 跳過。
- 使用 `--verify-plugin-apps` 時，遷移會取得新的來源 `app/list` 快照，並要求每個擁有的應用程式都存在、已啟用且可存取，才會規劃原生活化。此時帳戶查詢傳輸失敗會落入來源應用程式清單閘門，而不是直接跳過。

執行階段應用程式清單是在遷移後執行的目標工作階段可存取性檢查。Codex harness 工作階段設定會根據已啟用且可存取的外掛應用程式計算限制性對話串應用程式設定；它不會在每個回合重新計算，因此 `/codex plugins enable`/`disable` 只會影響新的 Codex 對話。使用 `/new` 或 `/reset` 讓目前對話取得變更。

## V1 支援邊界

- 只有已安裝在來源 Codex app-server 清單中的 `openai-curated` 外掛符合遷移資格。
- 應用程式支援的來源外掛必須通過遷移時的訂閱閘門。`--verify-plugin-apps` 會加入來源應用程式清單閘門。受訂閱限制的帳戶，以及在驗證模式中不可存取/已停用/缺少的來源應用程式或應用程式清單重新整理失敗，會被回報為已跳過的手動項目，而不是已啟用的設定項目。無法讀取的外掛詳細資料會在應用程式清單閘門前被跳過。
- 遷移會寫入明確的外掛身分（`marketplaceName` 與 `pluginName`）；不會寫入本機 `marketplacePath` 快取路徑。
- `codexPlugins.enabled` 是唯一的全域啟用開關；沒有 `plugins["*"]` 萬用字元或設定鍵會授予任意安裝權限。
- 不支援的 marketplace、快取外掛套件、hook 與 Codex 設定檔會保留在遷移報告中供手動審查，不會自動啟用。

## 應用程式清單與所有權

OpenClaw 透過 app-server `app/list` 讀取 Codex 應用程式清單，將它快取在記憶體中一小時，並非同步重新整理過期或缺少的項目。快取是程序本機的；重新啟動命令列介面或閘道會清除它，OpenClaw 會從下一次 `app/list` 讀取重新建立它。

遷移與執行階段使用不同的快取鍵：

- 來源遷移驗證使用來源 Codex home 與啟動選項。它只會在使用 `--verify-plugin-apps` 時執行，並為該次規劃執行強制進行新的來源 `app/list` 走訪。
- 目標執行階段設定在建立對話串應用程式設定時，會使用目標代理程式的 Codex app-server 身分。外掛活化會使該目標快取鍵失效，然後在 `plugin/install` 後強制重新整理。

只有當 OpenClaw 能透過穩定所有權將外掛應用程式映射回已遷移的外掛時，才會公開該外掛應用程式：來自外掛詳細資料的精確應用程式 id、已知 MCP 伺服器名稱，或唯一穩定的中繼資料。僅有顯示名稱或所有權含糊的項目會被排除，直到下一次清單重新整理證明其所有權。

## 對話串應用程式設定

OpenClaw 會為 Codex 對話串注入限制性的 `config.apps` 修補：`_default` 會被停用，且只有已啟用的已遷移外掛所擁有的應用程式會被啟用。

每個應用程式上的 `destructive_enabled` 來自有效的全域或每外掛 `allow_destructive_actions` 政策；`true`、`"auto"` 與 `"ask"` 都會設定 `destructive_enabled: true`，而 `false` 會將它設為 `false`。Codex 仍會依其原生應用程式工具註解強制執行破壞性工具中繼資料。`_default` 會以 `open_world_enabled: false` 停用；已啟用的外掛應用程式會取得 `open_world_enabled: true`。OpenClaw 不會公開獨立的外掛層級開放世界政策旋鈕，也不會維護每外掛的破壞性工具名稱拒絕清單。

工具核准模式對外掛應用程式預設為自動，因此非破壞性的讀取工具會在沒有同一對話串核准提示的情況下執行。破壞性工具仍受每個應用程式的 `destructive_enabled` 政策控制。

## 破壞性動作政策

已遷移 Codex 外掛預設允許破壞性外掛引出，而不安全的 schema 與含糊的所有權會失敗並關閉：

- 全域 `allow_destructive_actions` 預設為 `true`。
- 每外掛 `allow_destructive_actions` 會覆寫該外掛的全域政策。
- `false`：OpenClaw 會傳回確定性的拒絕。
- `true`：OpenClaw 只會自動接受它能映射到核准回應的安全 schema，例如布林 approve 欄位。
- `"auto"`：OpenClaw 會將破壞性外掛動作公開給 Codex，然後在傳回 Codex 核准回應前，把已證明所有權的 MCP 核准引出轉為 OpenClaw 外掛核准。
- `"ask"`：OpenClaw 使用與 `"auto"` 相同的 Codex 寫入/破壞性閘門，在對話串開始前清除該應用程式的持久 Codex 每工具核准覆寫，且只提供一次性核准或拒絕，讓持久核准無法抑制後續寫入動作提示。對每個使用 `"ask"` 的已准入應用程式，OpenClaw 會為該應用程式選取 Codex 的 human approvals reviewer，使 Codex 將其核准引出傳送給 OpenClaw；其他應用程式與非應用程式對話串核准會保留其已設定的 reviewer 與政策。
- 缺少外掛身分、所有權含糊、缺少或不相符的回合 id，或不安全的引出 schema，都會拒絕而不是提示。

## 疑難排解

| Code                                              | 意義                                                                                                                              | 修正                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 遷移已安裝外掛，但其中一個應用程式仍需要驗證。此項目會以停用狀態寫入，直到你重新授權。 | 在 Codex 中重新授權該應用程式，然後在 OpenClaw 中啟用外掛。                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | 使用 `--verify-plugin-apps` 時，來源 Codex 應用程式清單未顯示所有擁有的應用程式皆存在、已啟用且可存取。         | 在 Codex 中重新授權或啟用該應用程式，然後使用 `--verify-plugin-apps` 重新執行遷移。                              |
| `app_inventory_unavailable`                       | 已要求嚴格的來源應用程式驗證，但來源 Codex 應用程式清單重新整理失敗。                                      | 修正來源 Codex 應用程式伺服器存取，或不使用 `--verify-plugin-apps` 重試，以接受較快的帳戶門檻計畫。   |
| `codex_subscription_required`                     | 來源 Codex 應用程式伺服器帳戶不是 ChatGPT 訂閱帳戶。                                                          | 使用訂閱驗證登入 Codex 應用程式，然後重新執行遷移。                                                  |
| `codex_account_unavailable`                       | 無法讀取來源 Codex 應用程式伺服器帳戶。                                                                               | 修正來源 Codex 應用程式伺服器驗證，或使用 `--verify-plugin-apps` 重新執行，讓來源應用程式清單判定資格。 |
| `marketplace_missing`, `plugin_missing`           | 目標 Codex 應用程式伺服器看不到預期的 `openai-curated` 市集或外掛。                                          | 針對目標執行階段重新執行遷移，或檢查 Codex 應用程式伺服器外掛狀態。                                 |
| `app_inventory_missing`, `app_inventory_stale`    | 應用程式就緒狀態來自空白或過期的快取。                                                                                     | OpenClaw 會自動排程非同步重新整理；在擁有權與就緒狀態明確之前，外掛應用程式會維持排除。  |
| `app_ownership_ambiguous`                         | 應用程式清單只依顯示名稱相符。                                                                                          | 在後續重新整理證明擁有權之前，該應用程式會對 Codex 執行緒保持隱藏。                                     |

**設定已變更，但代理看不到外掛：**執行 `/codex plugins
list` 確認已設定的狀態，然後執行 `/new` 或 `/reset`。現有的
Codex 執行緒繫結會保留啟動時使用的應用程式設定，直到 OpenClaw
建立新的執行框架工作階段或取代過期繫結。

**破壞性動作遭拒：**檢查全域與各外掛的
`allow_destructive_actions` 值。即使設定為 `true`、`"auto"` 或 `"ask"`，
不安全的引導結構描述與模糊的外掛身分仍會採取失敗關閉。

## 相關

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [設定參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [遷移命令列介面](/zh-TW/cli/migrate)
