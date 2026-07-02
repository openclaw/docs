---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用原生 Codex 外掛
    - 你正在遷移從原始碼安裝的 openai-curated Codex 外掛
    - 你正在疑難排解 codexPlugins、應用程式清單、破壞性動作或外掛應用程式診斷
summary: 為 Codex 模式的 OpenClaw 代理程式設定已遷移的原生 Codex 外掛
title: 原生 Codex 外掛
x-i18n:
    generated_at: "2026-07-02T00:44:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 外掛支援可讓 Codex 模式的 OpenClaw agent，在處理 OpenClaw 回合的同一個 Codex thread 內，使用 Codex app-server 自身的 app 與外掛功能。

OpenClaw 不會把 Codex 外掛轉譯成合成的 `codex_plugin_*` OpenClaw 動態工具。外掛呼叫會保留在原生 Codex transcript 中，而 Codex app-server 負責由 app 支援的 MCP 執行。

請在基礎的 [Codex harness](/zh-TW/plugins/codex-harness) 已可運作後使用本頁。

## 需求

- 選取的 OpenClaw agent runtime 必須是原生 Codex harness。
- `plugins.entries.codex.enabled` 必須為 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必須為 true。
- V1 僅支援 migration 觀察到在來源 Codex home 中以 source-installed 方式安裝的 `openai-curated` 外掛。
- 目標 Codex app-server 必須能看到預期的 marketplace、外掛與 app inventory。

`codexPlugins` 不會影響 OpenClaw runs、一般 OpenAI provider runs、ACP conversation bindings 或其他 harness，因為這些路徑不會以原生 `apps` config 建立 Codex app-server threads。

OpenAI 端的 Codex 存取權、app 可用性，以及 workspace app/外掛控制，都來自已登入的 Codex 帳戶。關於 OpenAI 帳戶與管理模型，請參閱 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速開始

從來源 Codex home 預覽 migration：

```bash
openclaw migrate codex --dry-run
```

當你希望 migration 在規劃原生外掛啟用前檢查來源 app 可存取性時，請使用嚴格來源 app 驗證：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

當計畫看起來正確時套用 migration：

```bash
openclaw migrate apply codex --yes
```

Migration 會為符合資格的外掛寫入明確的 `codexPlugins` entries，並針對選取的外掛呼叫 Codex app-server `plugin/install`。典型的 migrated config 如下：

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

變更 `codexPlugins` 後，新的 Codex conversations 會自動採用更新後的 app set。使用 `/new` 或 `/reset` 重新整理目前的 conversation。啟用或停用外掛變更不需要重新啟動 gateway。

## 從聊天管理外掛

當你想在操作 Codex harness 的同一個聊天中檢查或變更已設定的原生 Codex 外掛時，請使用 `/codex plugins`：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的別名。清單輸出會顯示來自 `plugins.entries.codex.config.codexPlugins.plugins` 的已設定外掛 keys、開關狀態、Codex 外掛名稱與 marketplace。

`enable` 和 `disable` 只會寫入 `~/.openclaw/openclaw.json` 的 OpenClaw config；它們不會編輯 `~/.codex/config.toml` 或安裝新的 Codex 外掛。只有 owner 或具有 `operator.admin` scope 的 gateway client 可以變更外掛狀態。

啟用已設定的外掛也會開啟全域 `codexPlugins.enabled` switch。如果外掛因 migration 回傳 `auth_required` 而被寫入為 disabled，請先在 Codex 中重新授權該 app，再於 OpenClaw 中啟用。

## 原生外掛設定的運作方式

整合有三個獨立狀態：

- 已安裝：Codex 在目標 app-server runtime 中有本機外掛 bundle。
- 已啟用：OpenClaw config 願意讓該外掛可供 Codex harness turns 使用。
- 可存取：Codex app-server 確認該外掛的 app entries 對 active account 可用，且可對應到 migrated plugin identity。

Migration 是持久的安裝/資格步驟。在規劃期間，OpenClaw 會讀取來源 Codex `plugin/read` details，並檢查來源 Codex app-server account response 是 ChatGPT subscription account。非 ChatGPT 或缺少 account responses 的情況，會以 `codex_subscription_required` 略過 app-backed plugins。預設情況下，migration 不會呼叫來源 `app/list`；通過 account gate 的 app-backed source plugins 會在沒有來源 app 可存取性驗證的情況下納入規劃，而 account lookup transport failures 會以 `codex_account_unavailable` 略過。使用 `--verify-plugin-apps` 時，migration 會擷取新的來源 `app/list` snapshot，並要求每個 owned app 都必須存在、啟用且可存取，才會規劃原生啟用。在該模式中，account lookup transport failures 會落到來源 app-inventory gate。Runtime app inventory 是 migration 後的 target-session accessibility check。接著 Codex harness session setup 會為已啟用且可存取的外掛 app 計算 restrictive thread app config。

Thread app config 會在 OpenClaw 建立 Codex harness session 或替換 stale Codex thread binding 時進行計算。它不會在每個 turn 重新計算，因此 `/codex plugins enable` 和 `/codex plugins disable` 會影響新的 Codex conversations。當目前 conversation 應採用更新後的 app set 時，請使用 `/new` 或 `/reset`。

## V1 支援邊界

V1 有意維持狹窄範圍：

- 只有已安裝在來源 Codex app-server inventory 中的 `openai-curated` 外掛符合 migration 資格。
- App-backed source plugins 必須通過 migration-time subscription gate。`--verify-plugin-apps` 會新增來源 app-inventory gate。Subscription-gated accounts，加上在 verification mode 中不可存取、disabled、missing source apps 或 source app-inventory refresh failures，都會回報為 skipped manual items，而不是 enabled config entries。Unreadable plugin details 會在 source app-inventory gate 前被略過。
- Migration 會寫入包含 `marketplaceName` 和 `pluginName` 的明確外掛 identities；它不會寫入本機 `marketplacePath` cache paths。
- `codexPlugins.enabled` 是全域 enablement switch。
- 沒有 `plugins["*"]` wildcard，也沒有授予任意 install authority 的 config key。
- 不支援的 marketplaces、cached plugin bundles、hooks 與 Codex config files 會保留在 migration report 中供手動審查。

## App inventory 與 ownership

OpenClaw 透過 app-server `app/list` 讀取 Codex app inventory，快取一小時，並以非同步方式重新整理 stale 或 missing entries。快取僅存在記憶體中；重新啟動 命令列介面 或 gateway 會清除它，OpenClaw 會從下一次 `app/list` read 重建。

Migration 和 runtime 使用不同的 cache keys：

- Source migration verification 會使用來源 Codex home 與來源 app-server start options。這只會在設定 `--verify-plugin-apps` 時執行，並強制該 planning run 進行新的來源 `app/list` traversal。
- Target runtime setup 在建置 Codex thread app config 時，會使用 target agent 的 Codex app-server identity。外掛啟用會使該 target cache key 失效，然後在 `plugin/install` 後強制重新整理。

只有當 OpenClaw 能透過 stable ownership 將 plugin app 對應回 migrated plugin 時，才會公開該 app：

- 來自 plugin detail 的精確 app id
- 已知 MCP server name
- 唯一穩定 metadata

僅 display-name 或 ownership ambiguous 的項目會被排除，直到下一次 inventory refresh 證明 ownership。

## Thread app config

OpenClaw 會為 Codex thread 注入 restrictive `config.apps` patch：停用 `_default`，且只啟用由已啟用 migrated plugins 擁有的 apps。

OpenClaw 會根據有效的全域或 per-plugin `allow_destructive_actions` policy 設定 app-level `destructive_enabled`，並讓 Codex 依其原生 app tool annotations 強制執行 destructive tool metadata。`true`、`"auto"` 和 `"ask"` 會設定 `destructive_enabled: true`；`false` 會將其設為 false。`_default` app config 會以 `open_world_enabled: false` 停用。已啟用的 plugin apps 會以 `open_world_enabled: true` 輸出；OpenClaw 不會公開獨立的 plugin open-world policy knob，也不會維護 per-plugin destructive tool-name deny lists。

Tool approval mode 對 plugin apps 預設為 automatic，因此 non-destructive read tools 可以在沒有 same-thread approval UI 的情況下執行。Destructive tools 仍由每個 app 的 `destructive_enabled` policy 控制。

## Destructive action policy

預設允許 migrated Codex plugins 的 destructive plugin elicitations，而 unsafe schemas 與 ambiguous ownership 仍會 fail closed：

- 全域 `allow_destructive_actions` 預設為 `true`。
- Per-plugin `allow_destructive_actions` 會覆寫該外掛的全域 policy。
- 當 policy 為 `false` 時，OpenClaw 會回傳 deterministic decline。
- 當 policy 為 `true` 時，OpenClaw 只會 auto-accept 它能對應到 approval response 的 safe schemas，例如 boolean approve field。
- 當 policy 為 `"auto"` 時，OpenClaw 會向 Codex 公開 destructive plugin actions，但會在回傳 Codex approval response 前，將 ownership-proven MCP approval elicitations 轉為 OpenClaw plugin approvals。
- 當 policy 為 `"ask"` 時，OpenClaw 使用與 `"auto"` 相同的 Codex write/destructive gating，在 thread 啟動前清除該 app 的 durable Codex per-tool approval overrides，且只提供 one-shot approval 或 denial，因此 durable approvals 無法抑制後續 write-action prompts。
- 對於每個使用 `"ask"` 的 admitted app，OpenClaw 會為該 app 選取 Codex 的 human approvals reviewer，讓 Codex 將其 approval elicitations 傳送給 OpenClaw。其他 apps 與 non-app thread approvals 會保留其 configured reviewer 與 policy。
- 缺少 plugin identity、ambiguous ownership、缺少 turn id、錯誤 turn id 或 unsafe elicitation schema，都會 decline 而不是 prompting。

## 疑難排解

**`auth_required`：** migration 已安裝外掛，但其某個 app 仍需要 authentication。在你重新授權並啟用之前，明確的 plugin entry 會被寫入為 disabled。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：**
migration 未安裝該外掛，因為設定 `--verify-plugin-apps` 時，來源 Codex app inventory 未顯示所有 owned apps 都存在、啟用且可存取。請在 Codex 中重新授權或啟用該 app，然後使用 `--verify-plugin-apps` 重新執行 migration。

**`app_inventory_unavailable`：** migration 未安裝該外掛，因為已要求嚴格來源 app 驗證，且來源 Codex app inventory refresh 失敗。請修正來源 Codex app-server access，或如果你接受較快的 account-gated plan，請在不使用 `--verify-plugin-apps` 的情況下重試。

**`codex_subscription_required`：** migration 未安裝 app-backed plugin，因為來源 Codex app-server account 未以 ChatGPT subscription account 登入。請使用 subscription auth 登入 Codex app，然後重新執行 migration。

**`codex_account_unavailable`：** migration 未安裝 app-backed plugin，因為無法讀取來源 Codex app-server account。請修正來源 Codex app-server auth，或如果你希望在 account lookup 失敗時由來源 app inventory 決定資格，請使用 `--verify-plugin-apps` 重新執行。

**`marketplace_missing` 或 `plugin_missing`：** 目標 Codex app-server 看不到預期的 `openai-curated` marketplace 或 plugin。請針對目標 runtime 重新執行 migration，或檢查 Codex app-server plugin status。

**`app_inventory_missing` 或 `app_inventory_stale`：** app readiness 來自空白或 stale cache。OpenClaw 會排程 async refresh，並在 ownership 與 readiness 已知前排除 plugin apps。

**`app_ownership_ambiguous`：** app inventory 只以 display name 相符，因此該 app 不會公開給 Codex thread。

**設定已變更，但代理程式看不到外掛：**使用 `/codex plugins
list` 確認已設定的狀態，然後使用 `/new` 或 `/reset`。現有的
Codex 對話串繫結會保留啟動時的應用程式設定，直到 OpenClaw
建立新的執行環境工作階段或取代過期的繫結。

**破壞性動作遭拒：**檢查全域與各外掛的
`allow_destructive_actions` 值。即使政策為 true、`"auto"` 或
`"ask"`，不安全的徵詢結構描述與模糊的外掛身分仍會以封閉方式失敗。

## 相關

- [Codex 執行環境](/zh-TW/plugins/codex-harness)
- [Codex 執行環境參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 執行環境執行階段](/zh-TW/plugins/codex-harness-runtime)
- [設定參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [遷移命令列介面](/zh-TW/cli/migrate)
