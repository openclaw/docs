---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用原生 Codex 外掛
    - 你正在遷移以原始碼安裝的 openai-curated Codex 外掛
    - 你正在疑難排解 codexPlugins、應用程式清單、破壞性動作或外掛應用程式診斷
summary: 設定已遷移的原生 Codex 外掛，用於 Codex 模式的 OpenClaw 代理
title: 原生 Codex 外掛
x-i18n:
    generated_at: "2026-07-06T21:50:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5155cef2ed71ce6f9d8a4a38b98abc36cb72383ec60e1978fb145dfc32cf322
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 外掛支援讓 Codex 模式的 OpenClaw 代理能在處理
OpenClaw 回合的同一個 Codex 執行緒內，使用 Codex
app-server 自身的應用程式與外掛能力。外掛呼叫會保留在原生 Codex 逐字稿中；
Codex app-server 負責應用程式支援的 MCP 執行。OpenClaw 不會將
Codex 外掛轉換成合成的 `codex_plugin_*` OpenClaw 動態工具。

請在基礎 [Codex 控制框架](/zh-TW/plugins/codex-harness) 運作後使用本頁。

## 需求

- 代理執行階段必須是原生 Codex 控制框架。
- `plugins.entries.codex.enabled` 為 `true`。
- `plugins.entries.codex.config.codexPlugins.enabled` 為 `true`。
- 目標 Codex app-server 能看到預期的市集、外掛與應用程式清單。
- V1 僅支援遷移觀察到已在來源 Codex home 中以原始碼方式安裝的 `openai-curated` 外掛。

`codexPlugins` 不會影響 OpenClaw 提供者執行、ACP 對話繫結或其他控制框架，因為這些路徑從不會建立帶有原生 `apps` 設定的 Codex app-server 執行緒。

OpenAI 端的 Codex 帳戶、應用程式可用性，以及工作區應用程式/外掛控制，來自已登入的 Codex 帳戶。請參閱
[搭配你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
了解 OpenAI 帳戶與管理模型。

## 快速開始

從來源 Codex home 預覽遷移：

```bash
openclaw migrate codex --dry-run
```

加入 `--verify-plugin-apps`，讓遷移呼叫來源 `app/list`，並要求每個擁有的應用程式在規劃原生活化前都存在、已啟用且可存取：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

當計畫看起來正確時套用遷移：

```bash
openclaw migrate apply codex --yes
```

遷移會為符合資格的外掛寫入明確的 `codexPlugins` 項目，並對選取的外掛呼叫 Codex app-server `plugin/install`。遷移後的設定看起來如下：

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

在 `codexPlugins` 變更後，新的 Codex 對話會自動取得更新後的應用程式集合。執行 `/new` 或 `/reset` 以重新整理目前對話。啟用/停用外掛變更不需要重新啟動閘道。

## 從聊天管理外掛

`/codex plugins` 會從你操作 Codex 控制框架的同一個聊天中檢查或變更已設定的原生 Codex 外掛：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的別名。清單會顯示每個已設定外掛的鍵、開/關狀態、Codex 外掛名稱，以及來自 `plugins.entries.codex.config.codexPlugins.plugins` 的市集。

`enable`/`disable` 只會寫入 `~/.openclaw/openclaw.json`；它們絕不會編輯 `~/.codex/config.toml` 或安裝新的 Codex 外掛。只有擁有者或具備 `operator.admin` 範圍的閘道用戶端可以執行它們。

啟用已設定的外掛也會開啟全域 `codexPlugins.enabled` 開關。如果外掛因遷移回傳 `auth_required` 而被寫成停用，請先在 Codex 中重新授權應用程式，再於 OpenClaw 中啟用它。

## 原生外掛設定如何運作

此整合會追蹤三種狀態：

| 狀態       | 意義                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已安裝     | Codex 在目標 app-server 執行階段中擁有本機外掛套件。                                                                            |
| 已啟用     | OpenClaw 設定允許外掛用於 Codex 控制框架回合。                                                                                  |
| 可存取     | Codex app-server 確認外掛的應用程式項目可供作用中帳戶使用，且對應至已遷移的外掛身分。                                          |

遷移是持久的安裝/資格步驟：

- 在規劃期間，OpenClaw 會讀取來源 Codex `plugin/read` 詳細資料，並檢查來源 Codex app-server 帳戶是否為 ChatGPT 訂閱帳戶。非 ChatGPT 或缺少帳戶回應時，會以 `codex_subscription_required` 略過應用程式支援的外掛。
- 預設情況下，遷移會略過來源 `app/list` 呼叫：通過帳戶門檻的應用程式支援來源外掛會在沒有來源應用程式可存取性驗證的情況下被規劃，而帳戶查詢傳輸失敗會以 `codex_account_unavailable` 略過。
- 使用 `--verify-plugin-apps` 時，遷移會取得新的來源 `app/list` 快照，並要求每個擁有的應用程式在規劃原生活化前都存在、已啟用且可存取。帳戶查詢傳輸失敗接著會落入來源應用程式清單門檻，而不是直接略過。

執行階段應用程式清單是遷移後執行的目標工作階段可存取性檢查。Codex 控制框架工作階段設定會根據已啟用且可存取的外掛應用程式計算限制性的執行緒應用程式設定；它不會在每個回合重新計算，因此 `/codex plugins enable`/`disable` 只會影響新的 Codex 對話。使用 `/new` 或 `/reset` 讓目前對話取得變更。

## V1 支援邊界

- 只有已安裝在來源 Codex app-server 清單中的 `openai-curated` 外掛符合遷移資格。
- 應用程式支援的來源外掛必須通過遷移時的訂閱門檻。`--verify-plugin-apps` 會加入來源應用程式清單門檻。受訂閱限制的帳戶，以及在驗證模式中無法存取/已停用/缺少的來源應用程式或應用程式清單重新整理失敗，會回報為已略過的手動項目，而不是已啟用的設定項目。無法讀取的外掛詳細資料會在應用程式清單門檻前被略過。
- 遷移會寫入明確的外掛身分（`marketplaceName` 和 `pluginName`）；它不會寫入本機 `marketplacePath` 快取路徑。
- `codexPlugins.enabled` 是唯一的全域啟用開關；沒有 `plugins["*"]` 萬用字元或設定鍵可授予任意安裝權限。
- 不支援的市集、快取的外掛套件、掛鉤，以及 Codex 設定檔會保留在遷移報告中供手動檢閱，不會自動啟用。

## 應用程式清單與擁有權

OpenClaw 透過 app-server `app/list` 讀取 Codex 應用程式清單，將其在記憶體中快取一小時，並以非同步方式重新整理過期或缺少的項目。快取是程序本機的；重新啟動命令列介面或閘道會丟棄它，而 OpenClaw 會從下一次 `app/list` 讀取重建它。

遷移與執行階段使用不同的快取鍵：

- 來源遷移驗證使用來源 Codex home 與啟動選項。它只會搭配 `--verify-plugin-apps` 執行，並會為該次規劃執行強制進行新的來源 `app/list` 周遊。
- 目標執行階段設定在建置執行緒應用程式設定時，使用目標代理的 Codex app-server 身分。外掛活化會使該目標快取鍵失效，然後在 `plugin/install` 後強制重新整理它。

只有當 OpenClaw 能透過穩定擁有權將外掛應用程式對應回已遷移的外掛時，才會公開該應用程式：來自外掛詳細資料的精確應用程式 id、已知的 MCP 伺服器名稱，或唯一的穩定中繼資料。僅顯示名稱或擁有權模糊的項目會被排除，直到下一次清單重新整理證明擁有權。

## 已連結帳戶應用程式

由擁有者操作的代理可以選擇加入其 Codex 帳戶已連結的每個應用程式，而不需要相符的外掛套件：

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

`allow_all_plugins: true` 會在建立新的原生 Codex 執行緒時取得完整的 `app/list` 快照，且只允許標記為該帳戶可存取的應用程式。它不會全域安裝、驗證或啟用應用程式。現有執行緒會保留其已持久化的應用程式集合；使用 `/new`、`/reset` 或重新啟動閘道以取得新連結或已撤銷的應用程式。

帳戶應用程式會繼承全域 `codexPlugins.allow_destructive_actions` 值，該值接受 `true`、`false`、`"auto"` 或 `"ask"`。明確的每外掛政策會覆寫重疊應用程式 id 的全域政策。清單失敗會關閉失敗，而不是退回不受限制的預設值。

## 執行緒應用程式設定

OpenClaw 會為 Codex 執行緒注入限制性的 `config.apps` 修補：
`_default` 會被停用，且只會啟用由已啟用遷移外掛擁有的應用程式，或由 `allow_all_plugins` 准入的可存取帳戶應用程式。

每個應用程式上的 `destructive_enabled` 來自有效的全域或每外掛 `allow_destructive_actions` 政策；`true`、`"auto"` 和 `"ask"` 都會設定 `destructive_enabled: true`，而 `false` 會將其設定為 `false`。Codex 仍會根據其原生應用程式工具註解，強制執行破壞性工具中繼資料。
`_default` 會以 `open_world_enabled: false` 停用；已啟用的外掛應用程式會取得 `open_world_enabled: true`。OpenClaw 不會公開個別的外掛層級開放世界政策旋鈕，也不會維護每外掛的破壞性工具名稱拒絕清單。

工具核准模式對准入的應用程式預設為自動，因此非破壞性的讀取工具會在沒有同執行緒核准提示的情況下執行。破壞性工具仍由每個應用程式的 `destructive_enabled` 政策控制。

## 破壞性動作政策

預設允許已遷移 Codex 外掛的破壞性外掛引出，而不安全的結構描述與模糊的擁有權會關閉失敗：

- 全域 `allow_destructive_actions` 預設為 `true`。
- 每外掛 `allow_destructive_actions` 會覆寫該外掛的全域政策。
- `false`：OpenClaw 會回傳確定性的拒絕。
- `true`：OpenClaw 只會自動接受它能對應至核准回應的安全結構描述，例如布林核准欄位。
- `"auto"`：OpenClaw 會將破壞性外掛動作公開給 Codex，然後在回傳 Codex 核准回應前，將已證明擁有權的 MCP 核准引出轉換成 OpenClaw 外掛核准。
- `"ask"`：OpenClaw 使用與 `"auto"` 相同的 Codex 寫入/破壞性門控，在執行緒開始前清除該應用程式的持久 Codex 每工具核准覆寫，並且只提供一次性核准或拒絕，因此持久核准無法抑制後續寫入動作提示。對於每個使用 `"ask"` 的准入應用程式，OpenClaw 會為該應用程式選取 Codex 的人工核准檢閱者，讓 Codex 將其核准引出傳送給 OpenClaw；其他應用程式與非應用程式執行緒核准會保留其設定的檢閱者與政策。
- 缺少外掛身分、擁有權模糊、缺少或不相符的回合 id，或不安全的引出結構描述，都會拒絕而不是提示。

## 疑難排解

| 代碼                                              | 含義                                                                                                                              | 修正方式                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 遷移已安裝外掛，但其中一個應用程式仍需要驗證。該項目會以停用狀態寫入，直到你重新授權。 | 在 Codex 中重新授權該應用程式，然後在 OpenClaw 中啟用外掛。                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | 使用 `--verify-plugin-apps` 時，來源 Codex 應用程式清單未顯示所有所屬應用程式均存在、已啟用且可存取。         | 在 Codex 中重新授權或啟用該應用程式，然後使用 `--verify-plugin-apps` 重新執行遷移。                              |
| `app_inventory_unavailable`                       | 已要求嚴格的來源應用程式驗證，但來源 Codex 應用程式清單重新整理失敗。                                      | 修正來源 Codex 應用程式伺服器存取權限，或不使用 `--verify-plugin-apps` 重試以接受較快的帳號閘控計畫。   |
| `codex_subscription_required`                     | 來源 Codex 應用程式伺服器帳號不是 ChatGPT 訂閱帳號。                                                          | 使用訂閱驗證登入 Codex 應用程式，然後重新執行遷移。                                                  |
| `codex_account_unavailable`                       | 無法讀取來源 Codex 應用程式伺服器帳號。                                                                               | 修正來源 Codex 應用程式伺服器驗證，或使用 `--verify-plugin-apps` 重新執行，讓來源應用程式清單決定資格。 |
| `marketplace_missing`, `plugin_missing`           | 目標 Codex 應用程式伺服器看不到預期的 `openai-curated` 市集或外掛。                                          | 對目標執行階段重新執行遷移，或檢查 Codex 應用程式伺服器外掛狀態。                                 |
| `app_inventory_missing`, `app_inventory_stale`    | 應用程式就緒狀態來自空的或過期的快取。                                                                                     | OpenClaw 會自動排程非同步重新整理；在所有權與就緒狀態已知之前，外掛應用程式會維持排除狀態。  |
| `app_ownership_ambiguous`                         | 應用程式清單僅依顯示名稱相符。                                                                                          | 在後續重新整理證明所有權之前，該應用程式會對 Codex 執行緒保持隱藏。                                     |

**設定已變更但代理看不到外掛：**執行 `/codex plugins
list` 確認已設定的狀態，然後執行 `/new` 或 `/reset`。現有
Codex 執行緒繫結會保留啟動時的應用程式設定，直到 OpenClaw
建立新的執行框架工作階段或替換過期繫結。

**破壞性動作被拒絕：**檢查全域與各外掛的
`allow_destructive_actions` 值。即使是 `true`、`"auto"` 或 `"ask"`，
不安全的引出結構描述與不明確的外掛身分仍會以失敗關閉處理。

## 相關

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [設定參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [遷移命令列介面](/zh-TW/cli/migrate)
