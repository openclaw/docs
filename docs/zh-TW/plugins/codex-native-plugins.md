---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用原生 Codex Plugin
    - 您正在遷移以原始碼安裝的 openai-curated Codex Plugin
    - 你正在疑難排解 codexPlugins、應用程式清單、破壞性動作或 Plugin 應用程式診斷
summary: 為 Codex 模式的 OpenClaw 代理程式設定已遷移的原生 Codex Plugin
title: 原生 Codex Plugin
x-i18n:
    generated_at: "2026-05-12T23:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex plugin 支援讓 Codex 模式的 OpenClaw agent 可以在處理
OpenClaw 回合的同一個 Codex thread 內，使用 Codex app-server 自身的 app
與 plugin 能力。

OpenClaw 不會把 Codex plugins 轉譯成合成的 `codex_plugin_*`
OpenClaw dynamic tools。Plugin 呼叫會保留在原生 Codex transcript 中，而
Codex app-server 負責 app-backed MCP 執行。

請在基礎 [Codex harness](/zh-TW/plugins/codex-harness) 可運作後使用本頁。

## 需求

- 選取的 OpenClaw agent runtime 必須是原生 Codex harness。
- `plugins.entries.codex.enabled` 必須為 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必須為 true。
- V1 僅支援 migration 觀察到在來源 Codex home 中以 source-installed 狀態存在的
  `openai-curated` plugins。
- 目標 Codex app-server 必須能看到預期的 marketplace、plugin 與 app inventory。

`codexPlugins` 對 PI runs、一般 OpenAI provider runs、ACP
conversation bindings 或其他 harnesses 沒有作用，因為這些路徑不會建立帶有原生
`apps` config 的 Codex app-server threads。

## 快速開始

從來源 Codex home 預覽 migration：

```bash
openclaw migrate codex --dry-run
```

當你希望 migration 在規劃原生 plugin 啟用前檢查來源 app
可存取性時，請使用嚴格的來源 app 驗證：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

當計畫看起來正確時套用 migration：

```bash
openclaw migrate apply codex --yes
```

Migration 會為符合資格的 plugins 寫入明確的 `codexPlugins` entries，並為選取的
plugins 呼叫 Codex app-server `plugin/install`。典型的 migrated config
如下：

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

變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 gateway，讓後續的
Codex harness sessions 以更新後的 app set 啟動。

## 原生 plugin 設定如何運作

整合有三種獨立狀態：

- 已安裝：Codex 在目標 app-server runtime 中有本機 plugin bundle。
- 已啟用：OpenClaw config 願意讓該 plugin 可供 Codex harness 回合使用。
- 可存取：Codex app-server 確認該 plugin 的 app entries 可供作用中帳號使用，並且可對應到 migrated plugin identity。

Migration 是持久化的安裝/資格步驟。規劃期間，OpenClaw 會讀取來源 Codex
`plugin/read` details，並檢查來源 Codex app-server account response
是否為 ChatGPT subscription account。非 ChatGPT 或缺少 account responses
時，app-backed plugins 會以 `codex_subscription_required` 跳過。預設情況下，
migration 不會呼叫來源 `app/list`；通過 account gate 的 app-backed source plugins
會在沒有來源 app 可存取性驗證的情況下被規劃，而 account lookup transport
失敗會以 `codex_account_unavailable` 跳過。使用 `--verify-plugin-apps` 時，
migration 會取得新的來源 `app/list` snapshot，並要求每個 owned app
都必須存在、已啟用且可存取，才會規劃原生啟用。在該模式中，account lookup
transport 失敗會落到來源 app-inventory gate。Runtime app inventory
是 migration 後的目標 session 可存取性檢查。接著 Codex harness session setup
會為已啟用且可存取的 plugin apps 計算限制性的 thread app config。

Thread app config 會在 OpenClaw 建立 Codex harness session 或替換過期的
Codex thread binding 時進行計算。它不會在每個回合重新計算。

## V1 支援邊界

V1 有意保持狹窄：

- 只有已在來源 Codex app-server inventory 中安裝的 `openai-curated` plugins
  符合 migration 資格。
- App-backed source plugins 必須通過 migration 時的 subscription gate。
  `--verify-plugin-apps` 會加入來源 app-inventory gate。受 subscription gate
  限制的 accounts，以及在驗證模式中無法存取、已停用、缺少來源 apps，或來源
  app-inventory refresh 失敗，都會回報為 skipped manual items，而不是啟用的 config
  entries。無法讀取的 plugin details 會在來源 app-inventory gate 前被跳過。
- Migration 會寫入包含 `marketplaceName` 與 `pluginName` 的明確 plugin identities；它不會寫入本機 `marketplacePath` cache paths。
- `codexPlugins.enabled` 是全域啟用開關。
- 沒有 `plugins["*"]` 萬用字元，也沒有可授予任意安裝權限的 config key。
- 不支援的 marketplaces、cached plugin bundles、hooks 與 Codex config files
  會保留在 migration report 中，以供手動檢閱。

## App inventory 與擁有權

OpenClaw 會透過 app-server `app/list` 讀取 Codex app inventory，快取一小時，
並非同步重新整理過期或缺少的 entries。快取僅存在於記憶體中；重新啟動 CLI
或 gateway 會清除它，OpenClaw 會從下一次 `app/list` 讀取重新建立。

Migration 與 runtime 使用不同的 cache keys：

- 來源 migration verification 使用來源 Codex home 與來源 app-server start options。
  這只會在設定 `--verify-plugin-apps` 時執行，並且會針對該次 planning run
  強制進行新的來源 `app/list` traversal。
- 目標 runtime setup 在建置 Codex thread app config 時，會使用目標 agent 的
  Codex app-server identity。Plugin activation 會使該目標 cache key
  失效，然後在 `plugin/install` 後強制重新整理。

只有在 OpenClaw 可透過穩定擁有權將 plugin app 對應回 migrated plugin 時，
才會公開該 plugin app：

- 來自 plugin detail 的精確 app id
- 已知 MCP server name
- 唯一的穩定 metadata

僅 display name 符合或擁有權模糊的項目會被排除，直到下一次 inventory
refresh 證明擁有權為止。

## Thread app config

OpenClaw 會為 Codex thread 注入限制性的 `config.apps` patch：
`_default` 會被停用，且只有由已啟用 migrated plugins 擁有的 apps 會被啟用。

OpenClaw 會根據有效的全域或 per-plugin `allow_destructive_actions`
政策設定 app-level `destructive_enabled`，並讓 Codex 依其原生 app tool annotations
強制執行 destructive tool metadata。`_default` app config 會以
`open_world_enabled: false` 停用。已啟用的 plugin apps 會以
`open_world_enabled: true` 輸出；OpenClaw 不會公開獨立的 plugin open-world
policy knob，也不會維護 per-plugin destructive tool-name deny lists。

Plugin apps 的 tool approval mode 預設為 automatic，因此非破壞性的 read tools
可以在沒有同一 thread approval UI 的情況下執行。Destructive tools
仍由各 app 的 `destructive_enabled` 政策控制。

## 破壞性動作政策

對 migrated Codex plugins 的破壞性 plugin elicitations 預設允許，而 unsafe schemas
與模糊的擁有權仍會 fail closed：

- 全域 `allow_destructive_actions` 預設為 `true`。
- Per-plugin `allow_destructive_actions` 會為該 plugin 覆寫全域政策。
- 當政策為 `false` 時，OpenClaw 會回傳確定性的拒絕。
- 當政策為 `true` 時，OpenClaw 只會自動接受它可以對應到 approval response
  的 safe schemas，例如 boolean approve field。
- 缺少 plugin identity、擁有權模糊、缺少 turn id、錯誤的 turn id，或 unsafe
  elicitation schema 都會拒絕，而不是提示。

## 疑難排解

**`auth_required`：** migration 已安裝 plugin，但其中一個 apps 仍需要驗證。
明確的 plugin entry 會以停用狀態寫入，直到你重新授權並啟用它。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：**
migration 未安裝 plugin，因為在設定 `--verify-plugin-apps` 時，來源 Codex
app inventory 未顯示所有 owned apps 都存在、已啟用且可存取。請在 Codex
中重新授權或啟用 app，然後使用 `--verify-plugin-apps` 重新執行 migration。

**`app_inventory_unavailable`：** migration 未安裝 plugin，因為已要求嚴格的來源
app 驗證，但來源 Codex app inventory refresh 失敗。請修正來源 Codex app-server
存取，或若你接受較快的 account-gated plan，請不使用 `--verify-plugin-apps`
重試。

**`codex_subscription_required`：** migration 未安裝 app-backed plugin，因為來源
Codex app-server account 未以 ChatGPT subscription account 登入。請使用
subscription auth 登入 Codex app，然後重新執行 migration。

**`codex_account_unavailable`：** migration 未安裝 app-backed plugin，因為無法讀取來源
Codex app-server account。請修正來源 Codex app-server auth，或若你希望在 account
lookup 失敗時由來源 app inventory 判定資格，請使用 `--verify-plugin-apps`
重新執行。

**`marketplace_missing` 或 `plugin_missing`：** 目標 Codex app-server
無法看到預期的 `openai-curated` marketplace 或 plugin。請針對目標 runtime
重新執行 migration，或檢查 Codex app-server plugin 狀態。

**`app_inventory_missing` 或 `app_inventory_stale`：** app readiness 來自空白或過期的 cache。
OpenClaw 會排程 async refresh，並在擁有權與 readiness 已知前排除 plugin
apps。

**`app_ownership_ambiguous`：** app inventory 只透過 display name 符合，因此該 app
不會公開給 Codex thread。

**Config 已變更但 agent 看不到 plugin：** 請使用 `/new`、`/reset`，或重新啟動
gateway。既有的 Codex thread bindings 會保留啟動時使用的 app config，直到
OpenClaw 建立新的 harness session 或替換過期 binding。

**破壞性動作遭拒：** 請檢查全域與 per-plugin `allow_destructive_actions`
值。即使政策為 true，unsafe elicitation schemas 與模糊的 plugin identity
仍會 fail closed。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [設定參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/zh-TW/cli/migrate)
