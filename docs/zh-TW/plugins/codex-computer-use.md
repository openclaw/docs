---
read_when:
    - 您希望 Codex 模式的 OpenClaw 代理程式使用 Codex Computer Use
    - 您正在 Codex Computer Use、PeekabooBridge 與直接使用 cua-driver MCP 之間做選擇
    - 你正在 Codex Computer Use 與直接的 cua-driver MCP 設定之間做選擇
    - 您正在為隨附的 Codex Plugin 設定 computerUse
    - 你正在疑難排解 /codex computer-use status 或 install
summary: 為 Codex 模式的 OpenClaw 代理設定 Codex Computer Use
title: Codex 電腦使用
x-i18n:
    generated_at: "2026-05-03T21:37:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是 Codex 原生的 MCP Plugin，用於本機桌面控制。OpenClaw
不會內建桌面應用程式、自己執行桌面動作，或繞過
Codex 權限。隨附的 `codex` Plugin 只會準備 Codex app-server：
它會啟用 Codex Plugin 支援、尋找或安裝已設定的 Codex
Computer Use Plugin、檢查 `computer-use` MCP 伺服器是否可用，然後
讓 Codex 在 Codex 模式回合中擁有原生 MCP 工具呼叫。

當 OpenClaw 已經在使用原生 Codex harness 時，請使用本頁。若要設定
runtime 本身，請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

## OpenClaw.app 與 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 是分開的。這個
macOS 應用程式可以託管 PeekabooBridge socket，讓 `peekaboo` CLI 能重用
應用程式的本機 Accessibility 與 Screen Recording 授權，用於 Peekaboo 自己的
自動化工具。該 bridge 不會安裝或代理 Codex Computer Use，且
Codex Computer Use 不會透過 PeekabooBridge socket 呼叫。

當你希望 OpenClaw.app 成為 Peekaboo CLI 自動化的權限感知主機時，請使用
[Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)。當 Codex 模式的 OpenClaw agent
應在回合開始前可用 Codex 原生的 `computer-use` MCP Plugin 時，請使用本頁。

## iOS 應用程式

iOS 應用程式與 Codex Computer Use 是分開的。它不會安裝或代理
Codex `computer-use` MCP 伺服器，也不是桌面控制後端。
相反地，iOS 應用程式會作為 OpenClaw Node 連線，並透過
`canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`
等 Node 指令公開行動裝置能力。

當你希望 agent 透過 Gateway 驅動 iPhone Node 時，請使用 [iOS](/zh-TW/platforms/ios)。
當 Codex 模式 agent 應透過 Codex 原生 Computer Use Plugin 控制本機
macOS 桌面時，請使用本頁。

## 直接使用 cua-driver MCP

Codex Computer Use 不是公開桌面控制的唯一方式。如果你希望
OpenClaw 管理的 runtime 直接呼叫 TryCua 的 driver，請透過 OpenClaw 的
MCP registry 使用上游 `cua-driver mcp` 伺服器，而不是 Codex 專用的
marketplace 流程。

安裝 `cua-driver` 後，請讓它輸出 OpenClaw 指令：

```bash
cua-driver mcp-config --client openclaw
```

或自行註冊 stdio 伺服器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

這條路徑會保留完整的上游 MCP 工具介面，包括 driver schema 和結構化
MCP 回應。當你希望 CUA driver 作為一般 OpenClaw MCP 伺服器可用時，請使用它。
當 Codex app-server 應在 Codex 模式回合內負責 Plugin 安裝、MCP 重新載入
和原生工具呼叫時，請使用本頁的 Codex Computer Use 設定。

CUA 的 driver 僅適用於 macOS，且仍需要其應用程式提示授予的本機 macOS 權限，
例如 Accessibility 和 Screen Recording。OpenClaw 不會安裝 `cua-driver`、
授予這些權限，或繞過上游 driver 的安全模型。

## 快速設定

當 Codex 模式回合必須在 thread 開始前可用 Computer Use 時，請設定
`plugins.entries.codex.config.computerUse`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

使用此設定時，OpenClaw 會在每個 Codex 模式回合前檢查 Codex app-server。
如果缺少 Computer Use，但 Codex app-server 已經發現可安裝的 marketplace，
OpenClaw 會要求 Codex app-server 安裝或重新啟用該 Plugin，並重新載入
MCP 伺服器。在 macOS 上，若沒有註冊相符的 marketplace 且標準 Codex
應用程式套件存在，OpenClaw 也會先嘗試從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊隨附的
Codex marketplace，然後才失敗。如果設定仍無法讓 MCP 伺服器可用，該回合會在
thread 開始前失敗。

既有 session 會保留其 runtime 與 Codex thread 綁定。變更 `agentRuntime` 或
Computer Use 設定後，請在受影響的聊天中使用 `/new` 或 `/reset` 再進行測試。

## 指令

在任何提供 `codex` Plugin 指令介面的聊天表面，都可以使用
`/codex computer-use` 指令。這些是 OpenClaw 聊天/runtime 指令，
不是 `openclaw codex ...` CLI 子指令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是唯讀的。它不會新增 marketplace source、安裝 Plugin，或
啟用 Codex Plugin 支援。

`install` 會啟用 Codex app-server Plugin 支援、選擇性新增已設定的
marketplace source、透過 Codex app-server 安裝或重新啟用已設定的 Plugin、
重新載入 MCP 伺服器，並驗證該 MCP 伺服器公開工具。

## Marketplace 選項

OpenClaw 使用 Codex 自身公開的同一套 app-server API。
marketplace 欄位會選擇 Codex 應該在哪裡尋找 `computer-use`。

| 欄位                 | 使用時機                                                        | 安裝支援                                                |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 無 marketplace 欄位  | 你希望 Codex app-server 使用它已經知道的 marketplace。          | 是，當 app-server 回傳本機 marketplace 時。             |
| `marketplaceSource`  | 你有 Codex marketplace source，可供 app-server 新增。           | 是，用於明確的 `/codex computer-use install`。          |
| `marketplacePath`    | 你已經知道主機上的本機 marketplace 檔案路徑。                  | 是，用於明確安裝與回合開始時自動安裝。                 |
| `marketplaceName`    | 你想依名稱選取一個已註冊的 marketplace。                       | 僅在所選 marketplace 有本機路徑時支援。                |

新的 Codex home 可能需要一小段時間來建立其官方 marketplace。
安裝期間，OpenClaw 會輪詢 `plugin/list` 最多
`marketplaceDiscoveryTimeoutMs` 毫秒。預設值是 60 秒。

如果多個已知 marketplace 都包含 Computer Use，OpenClaw 會優先選擇
`openai-bundled`，其次是 `openai-curated`，再來是 `local`。未知且有歧義的
相符項目會關閉失敗，並要求你設定 `marketplaceName` 或 `marketplacePath`。

## 隨附的 macOS marketplace

近期 Codex 桌面版建置會在這裡隨附 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true 且沒有已註冊包含 `computer-use` 的
marketplace 時，OpenClaw 會嘗試自動新增標準隨附的 marketplace root：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以從 shell 使用 Codex 明確註冊它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非標準的 Codex 應用程式路徑，請將 `computerUse.marketplacePath` 設為
本機 marketplace 檔案路徑，或先執行一次 `/codex computer-use install --source
<marketplace-source>`。

## 遠端 catalog 限制

Codex app-server 可以列出和讀取僅遠端的 catalog 項目，但目前不支援遠端
`plugin/install`。這表示 `marketplaceName` 可以選取僅遠端的 marketplace
用於狀態檢查，但安裝與重新啟用仍需要透過 `marketplaceSource` 或
`marketplacePath` 使用本機 marketplace。

如果狀態顯示該 Plugin 可在遠端 Codex marketplace 中使用，但不支援遠端安裝，
請用本機 source 或 path 執行 install：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定參考

| 欄位                            | 預設值         | 意義                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | 要求 Computer Use。當設定另一個 Computer Use 欄位時，預設為 true。            |
| `autoInstall`                   | false          | 在回合開始時，從已發現的 marketplace 安裝或重新啟用。                         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安裝等待 Codex app-server marketplace 探索的時間長度。                        |
| `marketplaceSource`             | unset          | 傳給 Codex app-server `marketplace/add` 的 source 字串。                       |
| `marketplacePath`               | unset          | 包含該 Plugin 的本機 Codex marketplace 檔案路徑。                              |
| `marketplaceName`               | unset          | 要選取的已註冊 Codex marketplace 名稱。                                        |
| `pluginName`                    | `computer-use` | Codex marketplace Plugin 名稱。                                                |
| `mcpServerName`                 | `computer-use` | 已安裝 Plugin 公開的 MCP 伺服器名稱。                                         |

回合開始時自動安裝會刻意拒絕已設定的 `marketplaceSource` 值。新增 source 是明確的設定作業，
因此請先使用 `/codex computer-use install --source <marketplace-source>` 一次，
再讓 `autoInstall` 從已發現的本機 marketplace 處理未來的重新啟用。
回合開始時自動安裝可以使用已設定的 `marketplacePath`，因為那已經是主機上的本機路徑。

## OpenClaw 會檢查什麼

OpenClaw 會在內部回報穩定的設定原因，並為聊天格式化面向使用者的狀態：

| 原因                         | 意義                                                   | 下一步                                      |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。                   | 設定 `enabled` 或另一個 Computer Use 欄位。 |
| `marketplace_missing`        | 沒有可用的相符 marketplace。                           | 設定 source、path 或 marketplace 名稱。     |
| `plugin_not_installed`       | marketplace 存在，但該 Plugin 尚未安裝。               | 執行 install 或啟用 `autoInstall`。         |
| `plugin_disabled`            | Plugin 已安裝，但在 Codex 設定中停用。                 | 執行 install 以重新啟用它。                |
| `remote_install_unsupported` | 選取的 marketplace 僅限遠端。                          | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | Plugin 已啟用，但 MCP 伺服器不可用。                   | 檢查 Codex Computer Use 與 OS 權限。        |
| `ready`                      | Plugin 和 MCP 工具可用。                               | 開始 Codex 模式回合。                      |
| `check_failed`               | 狀態檢查期間 Codex app-server 請求失敗。               | 檢查 app-server 連線與記錄。               |
| `auto_install_blocked`       | 回合開始設定需要新增 source。                          | 先執行明確安裝。                           |

聊天輸出會包含 Plugin 狀態、MCP 伺服器狀態、marketplace、可用時的工具，
以及失敗設定步驟的具體訊息。

## macOS 權限

Computer Use 僅適用於 macOS。Codex 擁有的 MCP 伺服器在能檢查或控制應用程式前，
可能需要本機 OS 權限。如果 OpenClaw 表示 Computer Use 已安裝但 MCP 伺服器不可用，
請先驗證 Codex 端的 Computer Use 設定：

- Codex app-server 正在應該進行桌面控制的同一台主機上執行。
- Computer Use Plugin 已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器出現在 Codex app-server MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前的主機工作階段可以存取受控制的桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意採用失敗關閉。Codex 模式的回合不應在缺少設定所要求的原生桌面工具時默默繼續。

## 疑難排解

**狀態顯示未安裝。** 執行 `/codex computer-use install`。如果未探索到市集，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但已停用。** 再次執行 `/codex computer-use install`。Codex app-server 安裝會將 Plugin 設定寫回啟用狀態。

**狀態顯示不支援遠端安裝。** 使用本機市集來源或路徑。僅限遠端的目錄項目可以檢視，但無法透過目前的 app-server API 安裝。

**狀態顯示 MCP 伺服器不可用。** 重新執行一次安裝，讓 MCP 伺服器重新載入。如果仍然不可用，請修正 Codex Computer Use 應用程式、Codex app-server MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 上逾時。** Plugin 和 MCP 伺服器都存在，但本機 Computer Use 橋接器未回應。結束或重新啟動 Codex Computer Use，必要時重新啟動 Codex Desktop，然後在新的 OpenClaw 工作階段中重試。

**Computer Use 工具顯示 `Native hook relay unavailable`。** Codex 原生工具 hook 無法透過本機橋接器或 Gateway 備援連線到作用中的 OpenClaw relay。使用 `/new` 或 `/reset` 啟動新的 OpenClaw 工作階段。如果持續發生，請重新啟動 Gateway，讓舊的 app-server 執行緒和 hook 註冊被移除，然後重試。

**回合開始自動安裝拒絕某個來源。** 這是刻意設計。請先使用明確的 `/codex computer-use install --source <marketplace-source>` 加入來源，之後的回合開始自動安裝就能使用已探索到的本機市集。
