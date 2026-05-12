---
read_when:
    - 你想要 Codex 模式的 OpenClaw 代理使用原生 Codex Plugin
    - 您正在遷移從原始碼安裝的 OpenAI 精選 Codex Plugin
    - 你正在疑難排解 codexPlugins、應用程式清單、破壞性動作或 Plugin 應用程式診斷
summary: 為 Codex 模式的 OpenClaw 代理程式設定已遷移的原生 Codex Plugin
title: 原生 Codex Plugin
x-i18n:
    generated_at: "2026-05-12T00:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex Plugin 支援讓 Codex 模式的 OpenClaw 代理能在處理 OpenClaw 回合的同一個 Codex 執行緒中，使用 Codex 應用程式伺服器自身的應用程式與 Plugin 功能。

OpenClaw 不會將 Codex Plugin 轉譯成合成的 `codex_plugin_*` OpenClaw 動態工具。Plugin 呼叫會留在原生 Codex transcript 中，而 Codex 應用程式伺服器負責由應用程式支援的 MCP 執行。

請在基礎 [Codex harness](/zh-TW/plugins/codex-harness) 可運作後使用此頁面。

## 需求

- 選取的 OpenClaw 代理執行階段必須是原生 Codex harness。
- `plugins.entries.codex.enabled` 必須為 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必須為 true。
- V1 僅支援遷移在來源 Codex home 中觀察到以來源方式安裝的 `openai-curated` Plugin。
- 目標 Codex 應用程式伺服器必須能看到預期的 marketplace、Plugin 與應用程式清單。

`codexPlugins` 對 PI 執行、一般 OpenAI provider 執行、ACP 對話繫結或其他 harness 沒有效果，因為這些路徑不會建立具備原生 `apps` 設定的 Codex 應用程式伺服器執行緒。

## 快速開始

從來源 Codex home 預覽遷移：

```bash
openclaw migrate codex --dry-run
```

當計畫看起來正確時套用遷移：

```bash
openclaw migrate apply codex --yes
```

遷移會為符合資格的 Plugin 寫入明確的 `codexPlugins` 項目，並針對所選 Plugin 呼叫 Codex 應用程式伺服器的 `plugin/install`。典型的遷移後設定如下：

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

變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 Gateway，讓未來的 Codex harness 工作階段以更新後的應用程式集合啟動。

## 原生 Plugin 設定的運作方式

整合有三種獨立狀態：

- 已安裝：Codex 在目標應用程式伺服器執行階段中有本機 Plugin bundle。
- 已啟用：OpenClaw 設定願意讓該 Plugin 可供 Codex harness 回合使用。
- 可存取：Codex 應用程式伺服器確認該 Plugin 的應用程式項目可供作用中帳戶使用，且能對應到遷移後的 Plugin 身分。

遷移是持久的安裝與資格步驟。執行階段應用程式清單是可存取性檢查。接著 Codex harness 工作階段設定會為已啟用且可存取的 Plugin 應用程式計算限制性的執行緒應用程式設定。

OpenClaw 建立 Codex harness 工作階段或取代過期的 Codex 執行緒繫結時，會計算執行緒應用程式設定。它不會在每個回合重新計算。

## V1 支援範圍

V1 刻意保持狹窄：

- 只有已安裝在來源 Codex 應用程式伺服器清單中的 `openai-curated` Plugin 符合遷移資格。
- 遷移會以 `marketplaceName` 與 `pluginName` 寫入明確的 Plugin 身分；它不會寫入本機 `marketplacePath` 快取路徑。
- `codexPlugins.enabled` 是全域啟用開關。
- 沒有 `plugins["*"]` 萬用字元，也沒有授予任意安裝權限的設定鍵。
- 不支援的 marketplace、快取的 Plugin bundle、hook 與 Codex 設定檔會保留在遷移報告中，供手動審查。

## 應用程式清單與所有權

OpenClaw 透過應用程式伺服器的 `app/list` 讀取 Codex 應用程式清單，快取一小時，並非同步重新整理過期或缺失的項目。

只有當 OpenClaw 能透過穩定所有權將 Plugin 應用程式對應回遷移後的 Plugin 時，該應用程式才會公開：

- 來自 Plugin 詳細資料的精確應用程式 id
- 已知的 MCP 伺服器名稱
- 唯一穩定的 metadata

僅顯示名稱相符或所有權模糊的項目會被排除，直到下一次清單重新整理證明所有權為止。

## 執行緒應用程式設定

OpenClaw 會為 Codex 執行緒注入限制性的 `config.apps` patch：`_default` 會停用，且只啟用由已啟用遷移 Plugin 擁有的應用程式。

OpenClaw 會依據有效的全域或各 Plugin `allow_destructive_actions` policy 設定應用程式層級的 `destructive_enabled`，並讓 Codex 從其原生應用程式工具註解強制執行破壞性工具 metadata。`_default` 應用程式設定會以 `open_world_enabled: false` 停用。已啟用的 Plugin 應用程式會以 `open_world_enabled: true` 輸出；OpenClaw 不會公開獨立的 Plugin open-world policy 控制項，也不會維護各 Plugin 的破壞性工具名稱 deny list。

Plugin 應用程式的工具核准模式預設為自動，讓非破壞性讀取工具可以在沒有同一執行緒核准 UI 的情況下執行。破壞性工具仍由每個應用程式的 `destructive_enabled` policy 控制。

## 破壞性動作 policy

已遷移 Codex Plugin 預設允許破壞性 Plugin elicitation，而不安全的 schema 與模糊所有權仍會以關閉方式失敗：

- 全域 `allow_destructive_actions` 預設為 `true`。
- 各 Plugin 的 `allow_destructive_actions` 會覆寫該 Plugin 的全域 policy。
- 當 policy 為 `false` 時，OpenClaw 會回傳確定性的拒絕。
- 當 policy 為 `true` 時，OpenClaw 只會自動接受它可對應到核准回應的安全 schema，例如布林 approve 欄位。
- 缺少 Plugin 身分、所有權模糊、缺少回合 id、錯誤的回合 id，或不安全的 elicitation schema，都會拒絕而不是提示。

## 疑難排解

**`auth_required`：** 遷移已安裝該 Plugin，但其中一個應用程式仍需要驗證。明確的 Plugin 項目會以停用狀態寫入，直到你重新授權並啟用它。

**`marketplace_missing` 或 `plugin_missing`：** 目標 Codex 應用程式伺服器看不到預期的 `openai-curated` marketplace 或 Plugin。請針對目標執行階段重新執行遷移，或檢查 Codex 應用程式伺服器的 Plugin 狀態。

**`app_inventory_missing` 或 `app_inventory_stale`：** 應用程式就緒狀態來自空白或過期的快取。OpenClaw 會排程非同步重新整理，並排除 Plugin 應用程式，直到所有權與就緒狀態已知為止。

**`app_ownership_ambiguous`：** 應用程式清單只透過顯示名稱相符，因此該應用程式不會公開給 Codex 執行緒。

**設定已變更但代理看不到 Plugin：** 使用 `/new`、`/reset`，或重新啟動 Gateway。現有的 Codex 執行緒繫結會保留它們啟動時的應用程式設定，直到 OpenClaw 建立新的 harness 工作階段或取代過期繫結為止。

**破壞性動作遭拒：** 檢查全域與各 Plugin 的 `allow_destructive_actions` 值。即使 policy 為 true，不安全的 elicitation schema 與模糊的 Plugin 身分仍會以關閉方式失敗。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [設定參考](/zh-TW/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/zh-TW/cli/migrate)
