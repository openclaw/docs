---
read_when:
    - 您希望 Codex 模式的 OpenClaw 代理程式使用原生 Codex Plugin
    - 你正在遷移以原始碼安裝的 openai-curated Codex Plugin
    - 你正在疑難排解 codexPlugins、應用程式清單、破壞性操作或 Plugin 應用程式診斷
summary: 為 Codex 模式的 OpenClaw 代理設定已遷移的原生 Codex Plugin
title: 原生 Codex Plugin
x-i18n:
    generated_at: "2026-05-10T19:42:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex Plugin 支援可讓 Codex 模式的 OpenClaw agent，在處理 OpenClaw 回合的同一個 Codex thread 中，使用 Codex app-server 自身的 app 與 Plugin 能力。

OpenClaw 不會將 Codex Plugin 轉譯成合成的 `codex_plugin_*` OpenClaw 動態工具。Plugin 呼叫會保留在原生 Codex transcript 中，而 Codex app-server 負責 app-backed MCP 執行。

請在基礎 [Codex harness](/zh-TW/plugins/codex-harness) 可正常運作後使用本頁。

## 需求

- 所選的 OpenClaw agent runtime 必須是原生 Codex harness。
- `plugins.entries.codex.enabled` 必須為 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必須為 true。
- V1 僅支援 migration 觀察到已在來源 Codex home 中以 source-installed 形式安裝的 `openai-curated` Plugin。
- 目標 Codex app-server 必須能看見預期的 marketplace、Plugin 與 app inventory。

`codexPlugins` 對 PI 執行、一般 OpenAI provider 執行、ACP conversation binding 或其他 harness 沒有效果，因為這些路徑不會建立帶有原生 `apps` config 的 Codex app-server thread。

## 快速開始

從來源 Codex home 預覽 migration：

```bash
openclaw migrate codex --dry-run
```

當計畫看起來正確時套用 migration：

```bash
openclaw migrate apply codex --yes
```

Migration 會為符合資格的 Plugin 寫入明確的 `codexPlugins` entries，並為所選 Plugin 呼叫 Codex app-server `plugin/install`。典型的已 migration config 如下：

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

變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 gateway，讓未來的 Codex harness session 以更新後的 app set 啟動。

## 原生 Plugin 設定如何運作

整合包含三種獨立狀態：

- 已安裝：Codex 在目標 app-server runtime 中有本機 Plugin bundle。
- 已啟用：OpenClaw config 願意讓該 Plugin 可用於 Codex harness 回合。
- 可存取：Codex app-server 確認該 Plugin 的 app entries 可供目前帳號使用，且可對應到已 migration 的 Plugin identity。

Migration 是持久的安裝與資格判定步驟。Runtime app inventory 是可存取性檢查。接著 Codex harness session 設定會為已啟用且可存取的 Plugin app 計算限制性的 thread app config。

Thread app config 會在 OpenClaw 建立 Codex harness session，或取代過期的 Codex thread binding 時運算。不會在每個回合重新運算。

## V1 支援邊界

V1 刻意保持狹窄：

- 只有已安裝在來源 Codex app-server inventory 中的 `openai-curated` Plugin 符合 migration 資格。
- Migration 會以 `marketplaceName` 和 `pluginName` 寫入明確的 Plugin identity；不會寫入本機 `marketplacePath` cache path。
- `codexPlugins.enabled` 是全域啟用開關。
- 沒有 `plugins["*"]` 萬用字元，也沒有授予任意安裝權限的 config key。
- 不支援的 marketplace、已快取的 Plugin bundle、hook 與 Codex config file 會保留在 migration report 中，供手動審查。

## App inventory 與 ownership

OpenClaw 會透過 app-server `app/list` 讀取 Codex app inventory，快取一小時，並非同步重新整理過期或遺失的 entries。

只有當 OpenClaw 能透過穩定 ownership 將 Plugin app 對應回已 migration 的 Plugin 時，才會公開該 app：

- 來自 Plugin detail 的精確 app id
- 已知的 MCP server name
- 唯一的穩定 metadata

僅 display-name 或 ownership 模糊的項目會被排除，直到下一次 inventory 重新整理證明 ownership 為止。

## Thread app config

OpenClaw 會為 Codex thread 注入限制性的 `config.apps` patch：停用 `_default`，且只啟用由已啟用且已 migration 的 Plugin 所擁有的 app。

OpenClaw 會依有效的全域或個別 Plugin `allow_destructive_actions` policy 設定 app 層級的 `destructive_enabled`，並讓 Codex 透過其原生 app tool annotation 強制執行 destructive tool metadata。`_default` app config 會以 `open_world_enabled: false` 停用。已啟用的 Plugin app 會以 `open_world_enabled: true` 輸出；OpenClaw 不會公開獨立的 Plugin open-world policy knob，也不會維護個別 Plugin 的 destructive tool-name deny list。

Plugin app 的 tool approval mode 預設為 prompted，因為 OpenClaw 在這條同 thread 路徑中沒有互動式 app-elicitation UI。

## 破壞性動作 policy

Destructive Plugin elicitation 預設會封閉失敗：

- 全域 `allow_destructive_actions` 預設為 `false`。
- 個別 Plugin 的 `allow_destructive_actions` 會覆寫該 Plugin 的全域 policy。
- 當 policy 為 `false` 時，OpenClaw 會回傳決定性的拒絕。
- 當 policy 為 `true` 時，OpenClaw 只會自動接受可對應到 approval response 的安全 schema，例如 boolean approve field。
- 遺失 Plugin identity、ownership 模糊、缺少 turn id、錯誤的 turn id 或不安全的 elicitation schema 都會拒絕，而不是提示。

## 疑難排解

**`auth_required`：** migration 已安裝 Plugin，但其中一個 app 仍需要 authentication。明確的 Plugin entry 會以 disabled 寫入，直到你重新授權並啟用它。

**`marketplace_missing` 或 `plugin_missing`：** 目標 Codex app-server 無法看見預期的 `openai-curated` marketplace 或 Plugin。請針對目標 runtime 重新執行 migration，或檢查 Codex app-server Plugin 狀態。

**`app_inventory_missing` 或 `app_inventory_stale`：** app readiness 來自空白或過期的 cache。OpenClaw 會排程 async refresh，並排除 Plugin app，直到 ownership 與 readiness 已知為止。

**`app_ownership_ambiguous`：** app inventory 只依 display name 匹配，因此該 app 不會公開給 Codex thread。

**Config 已變更但 agent 看不到 Plugin：** 請使用 `/new`、`/reset`，或重新啟動 gateway。現有 Codex thread binding 會保留其啟動時的 app config，直到 OpenClaw 建立新的 harness session 或取代過期 binding 為止。

**破壞性動作遭拒絕：** 請檢查全域與個別 Plugin 的 `allow_destructive_actions` 值。即使 policy 為 true，不安全的 elicitation schema 與模糊的 Plugin identity 仍會封閉失敗。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [Configuration 參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/zh-TW/cli/migrate)
