---
read_when:
    - 你想讓 Codex 模式的 OpenClaw 代理使用原生 Codex Plugin
    - 您正在遷移以原始碼安裝的 openai-curated Codex Plugin
    - 你正在疑難排解 codexPlugins、應用程式清查、破壞性動作或 Plugin 應用程式診斷
summary: 設定 Codex 模式 OpenClaw 代理的已遷移原生 Codex Plugin
title: 原生 Codex Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex Plugin 支援可讓 Codex 模式的 OpenClaw agent，在處理 OpenClaw 回合的同一個 Codex thread 內，使用 Codex app-server 自身的 app 與 Plugin 能力。

OpenClaw 不會把 Codex plugins 轉譯成合成的 `codex_plugin_*` OpenClaw dynamic tools。Plugin 呼叫會留在原生 Codex transcript 中，且由 Codex app-server 擁有 app-backed MCP 執行。

請在基礎 [Codex harness](/zh-TW/plugins/codex-harness) 已可運作後使用本頁。

## 需求

- 所選的 OpenClaw agent runtime 必須是原生 Codex harness。
- `plugins.entries.codex.enabled` 必須為 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必須為 true。
- V1 僅支援 migration 觀察到已在來源 Codex home 中以 source-installed 形式安裝的 `openai-curated` plugins。
- 目標 Codex app-server 必須能看到預期的 marketplace、Plugin 與 app inventory。

`codexPlugins` 對 PI runs、一般 OpenAI provider runs、ACP conversation bindings，或其他 harnesses 沒有效果，因為那些路徑不會建立帶有原生 `apps` config 的 Codex app-server threads。

## 快速開始

從來源 Codex home 預覽 migration：

```bash
openclaw migrate codex --dry-run
```

當計畫看起來正確時套用 migration：

```bash
openclaw migrate apply codex --yes
```

Migration 會為符合資格的 plugins 寫入明確的 `codexPlugins` entries，並對所選 plugins 呼叫 Codex app-server `plugin/install`。典型的 migrated config 如下：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 gateway，讓未來的 Codex harness sessions 以更新後的 app set 啟動。

## 原生 Plugin 設定如何運作

整合有三個獨立狀態：

- 已安裝：Codex 在目標 app-server runtime 中具有本機 Plugin bundle。
- 已啟用：OpenClaw config 願意讓 Plugin 可供 Codex harness turns 使用。
- 可存取：Codex app-server 確認 Plugin 的 app entries 可供作用中帳號使用，且可對應到 migrated Plugin identity。

Migration 是持久的安裝/資格步驟。Runtime app inventory 是可存取性檢查。Codex harness session setup 接著會為已啟用且可存取的 Plugin apps 計算限制式 thread app config。

Thread app config 會在 OpenClaw 建立 Codex harness session，或替換 stale Codex thread binding 時進行計算。它不會在每個 turn 重新計算。

## V1 支援邊界

V1 刻意保持狹窄：

- 只有已安裝在來源 Codex app-server inventory 中的 `openai-curated` plugins 符合 migration 資格。
- Migration 會以 `marketplaceName` 和 `pluginName` 寫入明確的 Plugin identities；不會寫入本機 `marketplacePath` cache paths。
- `codexPlugins.enabled` 是全域啟用開關。
- 沒有 `plugins["*"]` wildcard，也沒有授予任意 install authority 的 config key。
- 不受支援的 marketplaces、cached Plugin bundles、hooks，以及 Codex config files 會保留在 migration report 中供人工檢閱。

## App inventory 與所有權

OpenClaw 會透過 app-server `app/list` 讀取 Codex app inventory，快取一小時，並非同步重新整理 stale 或 missing entries。

只有當 OpenClaw 能透過穩定所有權將 Plugin app 對應回 migrated Plugin 時，該 app 才會公開：

- 來自 Plugin detail 的 exact app id
- 已知的 MCP server name
- 唯一且穩定的 metadata

僅 display-name 或所有權模糊的項目會被排除，直到下一次 inventory refresh 證明所有權。

## Thread app config

OpenClaw 會為 Codex thread 注入限制式 `config.apps` patch：`_default` 會被停用，且只啟用由已啟用 migrated plugins 擁有的 apps。

OpenClaw 會根據有效的全域或每個 Plugin `allow_destructive_actions` policy 設定 app-level `destructive_enabled`，並讓 Codex 透過其原生 app tool annotations 強制執行 destructive tool metadata。`_default` app config 會以 `open_world_enabled: false` 停用。已啟用的 Plugin apps 會以 `open_world_enabled: true` 輸出；OpenClaw 不會公開獨立的 Plugin open-world policy knob，也不會維護每個 Plugin 的 destructive tool-name deny lists。

Tool approval mode 預設會對 Plugin apps 自動啟用，因此非破壞性的 read tools 可在沒有 same-thread approval UI 的情況下執行。Destructive tools 仍由每個 app 的 `destructive_enabled` policy 控制。

## 破壞性動作政策

Destructive Plugin elicitations 預設採 fail closed：

- 全域 `allow_destructive_actions` 預設為 `false`。
- 每個 Plugin 的 `allow_destructive_actions` 會覆寫該 Plugin 的全域 policy。
- 當 policy 為 `false` 時，OpenClaw 會回傳確定性的拒絕。
- 當 policy 為 `true` 時，OpenClaw 只會自動接受其可對應至 approval response 的安全 schemas，例如 boolean approve field。
- 缺少 Plugin identity、所有權模糊、missing turn id、wrong turn id，或不安全的 elicitation schema，都會拒絕而非提示。

## 疑難排解

**`auth_required`：** migration 已安裝 Plugin，但其其中一個 app 仍需要驗證。明確的 Plugin entry 會以 disabled 寫入，直到你重新授權並啟用它。

**`marketplace_missing` 或 `plugin_missing`：** 目標 Codex app-server 無法看到預期的 `openai-curated` marketplace 或 Plugin。請針對目標 runtime 重新執行 migration，或檢查 Codex app-server Plugin 狀態。

**`app_inventory_missing` 或 `app_inventory_stale`：** app readiness 來自空的或 stale cache。OpenClaw 會排程 async refresh，並排除 Plugin apps，直到所有權與 readiness 已知。

**`app_ownership_ambiguous`：** app inventory 只透過 display name 符合，因此該 app 不會公開給 Codex thread。

**Config 已變更但 agent 看不到 Plugin：** 請使用 `/new`、`/reset`，或重新啟動 gateway。現有 Codex thread bindings 會保留其啟動時的 app config，直到 OpenClaw 建立新的 harness session，或替換 stale binding。

**Destructive action 被拒絕：** 檢查全域與每個 Plugin 的 `allow_destructive_actions` 值。即使 policy 為 true，不安全的 elicitation schemas 和模糊的 Plugin identity 仍會 fail closed。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness reference](/zh-TW/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [Configuration reference](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/zh-TW/cli/migrate)
