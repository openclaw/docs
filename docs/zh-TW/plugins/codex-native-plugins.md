---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用原生 Codex 外掛
    - 你正在遷移從原始碼安裝的 OpenAI 精選 Codex 外掛
    - 你正在疑難排解 codexPlugins、應用程式清單、破壞性動作，或外掛應用程式診斷
summary: 為 Codex 模式的 OpenClaw 代理程式設定已遷移的原生 Codex 外掛
title: 原生 Codex 外掛
x-i18n:
    generated_at: "2026-06-27T19:35:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 外掛支援可讓 Codex 模式的 OpenClaw 代理，在處理 OpenClaw 回合的同一個 Codex 執行緒內，使用 Codex app-server 自身的應用程式與外掛能力。

OpenClaw 不會將 Codex 外掛轉譯成合成的 `codex_plugin_*` OpenClaw 動態工具。外掛呼叫會保留在原生 Codex 逐字稿中，而 Codex app-server 負責應用程式支援的 MCP 執行。

請在基礎 [Codex harness](/zh-TW/plugins/codex-harness) 可運作後使用本頁。

## 需求

- 選取的 OpenClaw 代理執行階段必須是原生 Codex harness。
- `plugins.entries.codex.enabled` 必須為 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必須為 true。
- V1 僅支援遷移觀察到已在來源 Codex home 中以來源安裝的 `openai-curated` 外掛。
- 目標 Codex app-server 必須能看見預期的 marketplace、外掛與應用程式清單。

`codexPlugins` 對 OpenClaw 執行、一般 OpenAI 提供者執行、ACP 對話繫結或其他 harness 沒有效果，因為這些路徑不會建立帶有原生 `apps` 設定的 Codex app-server 執行緒。

OpenAI 端的 Codex 存取權、應用程式可用性，以及工作區應用程式/外掛控制，來自已登入的 Codex 帳戶。關於 OpenAI 帳戶與管理員模型，請參閱 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速開始

從來源 Codex home 預覽遷移：

```bash
openclaw migrate codex --dry-run
```

當你希望遷移在規劃原生外掛啟用前檢查來源應用程式可存取性時，請使用嚴格來源應用程式驗證：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

當計畫看起來正確時套用遷移：

```bash
openclaw migrate apply codex --yes
```

遷移會為符合資格的外掛寫入明確的 `codexPlugins` 項目，並對選取的外掛呼叫 Codex app-server `plugin/install`。典型的已遷移設定如下：

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

變更 `codexPlugins` 後，新的 Codex 對話會自動取得更新後的應用程式集合。使用 `/new` 或 `/reset` 重新整理目前對話。啟用或停用外掛變更不需要重新啟動閘道。

## 從聊天管理外掛

當你想要在操作 Codex harness 的同一個聊天中檢查或變更已設定的原生 Codex 外掛時，請使用 `/codex plugins`：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的別名。清單輸出會顯示已設定的外掛鍵、開啟/關閉狀態、Codex 外掛名稱，以及來自 `plugins.entries.codex.config.codexPlugins.plugins` 的 marketplace。

`enable` 和 `disable` 只會寫入位於 `~/.openclaw/openclaw.json` 的 OpenClaw 設定；它們不會編輯 `~/.codex/config.toml` 或安裝新的 Codex 外掛。只有擁有者或具有 `operator.admin` 範圍的閘道用戶端可以變更外掛狀態。

啟用已設定的外掛也會開啟全域 `codexPlugins.enabled` 開關。如果外掛因為遷移傳回 `auth_required` 而寫入為停用，請先在 Codex 中重新授權應用程式，再於 OpenClaw 中啟用它。

## 原生外掛設定的運作方式

整合有三個獨立狀態：

- 已安裝：Codex 在目標 app-server 執行階段中有本機外掛套件。
- 已啟用：OpenClaw 設定願意讓該外掛可供 Codex harness 回合使用。
- 可存取：Codex app-server 確認外掛的應用程式項目可供作用中帳戶使用，且可對應至已遷移的外掛身分。

遷移是持久的安裝/資格步驟。在規劃期間，OpenClaw 會讀取來源 Codex `plugin/read` 詳細資料，並檢查來源 Codex app-server 帳戶回應是 ChatGPT 訂閱帳戶。非 ChatGPT 或缺少帳戶回應會以 `codex_subscription_required` 略過應用程式支援的外掛。預設情況下，遷移不會呼叫來源 `app/list`；通過帳戶閘門的應用程式支援來源外掛，會在未驗證來源應用程式可存取性的情況下被規劃，而帳戶查詢傳輸失敗會以 `codex_account_unavailable` 略過。使用 `--verify-plugin-apps` 時，遷移會取得新的來源 `app/list` 快照，並要求每個擁有的應用程式在規劃原生啟用前都存在、已啟用且可存取。在該模式中，帳戶查詢傳輸失敗會落到來源應用程式清單閘門。執行階段應用程式清單是遷移後的目標工作階段可存取性檢查。接著 Codex harness 工作階段設定會為已啟用且可存取的外掛應用程式計算限制性的執行緒應用程式設定。

當 OpenClaw 建立 Codex harness 工作階段或取代過期的 Codex 執行緒繫結時，會計算執行緒應用程式設定。它不會在每個回合重新計算，因此 `/codex plugins enable` 和 `/codex plugins disable` 會影響新的 Codex 對話。當目前對話應取得更新後的應用程式集合時，請使用 `/new` 或 `/reset`。

## V1 支援邊界

V1 有意保持狹窄：

- 只有已安裝在來源 Codex app-server 清單中的 `openai-curated` 外掛符合遷移資格。
- 應用程式支援的來源外掛必須通過遷移時訂閱閘門。`--verify-plugin-apps` 會加入來源應用程式清單閘門。受訂閱限制的帳戶，加上在驗證模式中不可存取、已停用、缺少的來源應用程式，或來源應用程式清單重新整理失敗，都會回報為已略過的手動項目，而不是已啟用的設定項目。無法讀取的外掛詳細資料會在來源應用程式清單閘門前略過。
- 遷移會寫入帶有 `marketplaceName` 和 `pluginName` 的明確外掛身分；它不會寫入本機 `marketplacePath` 快取路徑。
- `codexPlugins.enabled` 是全域啟用開關。
- 沒有 `plugins["*"]` 萬用字元，也沒有授予任意安裝權限的設定鍵。
- 不支援的 marketplace、快取外掛套件、hooks，以及 Codex 設定檔會保留在遷移報告中供手動審查。

## 應用程式清單與所有權

OpenClaw 透過 app-server `app/list` 讀取 Codex 應用程式清單，快取一小時，並以非同步方式重新整理過期或缺少的項目。快取僅在記憶體中；重新啟動命令列介面或閘道會清除它，而 OpenClaw 會從下一次 `app/list` 讀取重建它。

遷移與執行階段使用不同的快取鍵：

- 來源遷移驗證使用來源 Codex home 與來源 app-server 啟動選項。這只會在設定 `--verify-plugin-apps` 時執行，且會強制該次規劃執行走訪新的來源 `app/list`。
- 目標執行階段設定在建構 Codex 執行緒應用程式設定時，使用目標代理的 Codex app-server 身分。外掛啟用會使該目標快取鍵失效，然後在 `plugin/install` 後強制重新整理它。

只有當 OpenClaw 能透過穩定所有權將外掛應用程式對應回已遷移外掛時，才會公開該應用程式：

- 來自外掛詳細資料的精確應用程式 id
- 已知 MCP 伺服器名稱
- 唯一穩定中繼資料

僅符合顯示名稱或所有權模糊的項目會被排除，直到下一次清單重新整理證明所有權為止。

## 執行緒應用程式設定

OpenClaw 會為 Codex 執行緒注入限制性的 `config.apps` 修補：
`_default` 會停用，且只會啟用由已啟用已遷移外掛擁有的應用程式。

OpenClaw 會從有效的全域或個別外掛 `allow_destructive_actions` 政策設定應用程式層級的 `destructive_enabled`，並讓 Codex 從其原生應用程式工具註解強制執行破壞性工具中繼資料。`true`、`"auto"` 和 `"always"` 會設定 `destructive_enabled: true`；`false` 會將其設為 false。`_default` 應用程式設定會以 `open_world_enabled: false` 停用。已啟用的外掛應用程式會以 `open_world_enabled: true` 發出；OpenClaw 不會公開單獨的外掛開放世界政策旋鈕，也不會維護個別外掛的破壞性工具名稱拒絕清單。

外掛應用程式的工具核准模式預設為自動，因此非破壞性讀取工具可以在沒有同執行緒核准 UI 的情況下執行。破壞性工具仍由每個應用程式的 `destructive_enabled` 政策控制。

## 破壞性動作政策

已遷移 Codex 外掛預設允許破壞性外掛 elicitation，而不安全 schema 與模糊所有權仍會失敗關閉：

- 全域 `allow_destructive_actions` 預設為 `true`。
- 個別外掛 `allow_destructive_actions` 會覆寫該外掛的全域政策。
- 當政策為 `false` 時，OpenClaw 會傳回確定性的拒絕。
- 當政策為 `true` 時，OpenClaw 只會自動接受可對應至核准回應的安全 schema，例如布林核准欄位。
- 當政策為 `"auto"` 時，OpenClaw 會將破壞性外掛動作公開給 Codex，但會在傳回 Codex 核准回應前，將已證明所有權的 MCP 核准 elicitation 轉換成 OpenClaw 外掛核准。
- 當政策為 `"always"` 時，OpenClaw 會使用與 `"auto"` 相同的 Codex 寫入/破壞性閘控，在執行緒啟動前清除應用程式的持久 Codex 個別工具核准覆寫，並只提供一次性核准或拒絕，因此持久核准無法抑制後續寫入動作提示。
- 缺少外掛身分、所有權模糊、缺少回合 id、錯誤的回合 id，或不安全的 elicitation schema，都會拒絕而不是提示。

## 疑難排解

**`auth_required`：** 遷移已安裝外掛，但它的其中一個應用程式仍需要驗證。明確外掛項目會寫入為停用，直到你重新授權並啟用它。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：**
遷移未安裝外掛，因為在設定 `--verify-plugin-apps` 時，來源 Codex 應用程式清單沒有顯示所有擁有的應用程式都存在、已啟用且可存取。請在 Codex 中重新授權或啟用應用程式，然後使用 `--verify-plugin-apps` 重新執行遷移。

**`app_inventory_unavailable`：** 遷移未安裝外掛，因為已要求嚴格來源應用程式驗證，且來源 Codex 應用程式清單重新整理失敗。請修復來源 Codex app-server 存取權，或如果你接受較快的帳戶閘控計畫，請不使用 `--verify-plugin-apps` 重試。

**`codex_subscription_required`：** 遷移未安裝應用程式支援的外掛，因為來源 Codex app-server 帳戶未以 ChatGPT 訂閱帳戶登入。請使用訂閱驗證登入 Codex 應用程式，然後重新執行遷移。

**`codex_account_unavailable`：** 遷移未安裝應用程式支援的外掛，因為無法讀取來源 Codex app-server 帳戶。請修復來源 Codex app-server 驗證，或如果你希望在帳戶查詢失敗時由來源應用程式清單決定資格，請使用 `--verify-plugin-apps` 重新執行。

**`marketplace_missing` 或 `plugin_missing`：** 目標 Codex app-server 無法看見預期的 `openai-curated` marketplace 或外掛。請針對目標執行階段重新執行遷移，或檢查 Codex app-server 外掛狀態。

**`app_inventory_missing` 或 `app_inventory_stale`：** 應用程式就緒狀態來自空白或過期的快取。OpenClaw 會排程非同步重新整理，並在所有權與就緒狀態已知前排除外掛應用程式。

**`app_ownership_ambiguous`：** 應用程式清單只依顯示名稱相符，因此該應用程式不會公開給 Codex 執行緒。

**設定已變更但代理看不到外掛：** 使用 `/codex plugins
list` 確認已設定狀態，然後使用 `/new` 或 `/reset`。現有 Codex 執行緒繫結會保留啟動時的應用程式設定，直到 OpenClaw 建立新的 harness 工作階段或取代過期繫結。

**破壞性動作遭到拒絕：** 請檢查全域與個別外掛的
`allow_destructive_actions` 值。即使政策為 true、`"auto"` 或
`"always"`，不安全的引出結構描述與模糊的外掛身分仍會以關閉狀態失敗。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [設定參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [遷移命令列介面](/zh-TW/cli/migrate)
