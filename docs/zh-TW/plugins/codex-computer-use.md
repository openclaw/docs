---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 和直接使用 cua-driver MCP 之間做選擇
    - 你正在 Codex Computer Use 和直接的 cua-driver MCP 設定之間做選擇
    - 您正在為隨附的 Codex Plugin 設定 computerUse
    - 你正在針對 /codex computer-use 狀態或安裝進行疑難排解
summary: 為 Codex 模式的 OpenClaw 代理設定 Codex Computer Use
title: Codex 電腦使用
x-i18n:
    generated_at: "2026-05-06T09:15:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是 Codex 原生 MCP Plugin，用於本機桌面控制。OpenClaw
不會內含桌面 app、不會自行執行桌面動作，也不會繞過
Codex 權限。隨附的 `codex` Plugin 只會準備 Codex app-server：
它會啟用 Codex Plugin 支援、尋找或安裝已設定的 Codex
Computer Use Plugin、檢查 `computer-use` MCP server 是否可用，然後
在 Codex 模式的回合中，讓 Codex 擁有原生 MCP 工具呼叫。

當 OpenClaw 已經在使用原生 Codex harness 時，請使用此頁。若要設定
runtime 本身，請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

## OpenClaw.app 與 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 是分開的。
macOS app 可以代管 PeekabooBridge socket，讓 `peekaboo` CLI 能重用
app 的本機「輔助使用」與「螢幕錄製」授權，供 Peekaboo 自己的
自動化工具使用。該 bridge 不會安裝或代理 Codex Computer Use，
而 Codex Computer Use 也不會透過 PeekabooBridge socket 呼叫。

當你想讓 OpenClaw.app 成為能感知權限的 Peekaboo CLI 自動化代管端時，
請使用 [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)。當 Codex 模式的
OpenClaw agent 應在回合開始前可用 Codex 原生 `computer-use` MCP Plugin 時，
請使用此頁。

## iOS app

iOS app 與 Codex Computer Use 是分開的。它不會安裝或代理
Codex `computer-use` MCP server，也不是桌面控制後端。
相反地，iOS app 會作為 OpenClaw node 連線，並透過
`canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`
等 node commands 暴露行動裝置能力。

當你想讓 agent 透過 Gateway 驅動 iPhone node 時，請使用
[iOS](/zh-TW/platforms/ios)。當 Codex 模式 agent 應透過 Codex 原生
Computer Use Plugin 控制本機 macOS 桌面時，請使用此頁。

## 直接使用 cua-driver MCP

Codex Computer Use 並不是暴露桌面控制的唯一方式。如果你想讓
OpenClaw 管理的 runtime 直接呼叫 TryCua 的 driver，請透過 OpenClaw 的
MCP registry 使用上游 `cua-driver mcp` server，而不是 Codex 專用的
marketplace 流程。

安裝 `cua-driver` 後，可以要求它提供 OpenClaw command：

```bash
cua-driver mcp-config --client openclaw
```

或自行註冊 stdio server：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

這條路徑會保留完整的上游 MCP 工具表面，包括 driver schema 與
結構化 MCP 回應。當你想讓 CUA driver 作為一般 OpenClaw MCP server
可用時，請使用它。當 Codex app-server 應在 Codex 模式回合內擁有
Plugin 安裝、MCP 重新載入與原生工具呼叫時，請使用此頁的
Codex Computer Use 設定。

CUA 的 driver 僅支援 macOS，且仍需要其 app 提示授權的本機 macOS 權限，
例如「輔助使用」與「螢幕錄製」。OpenClaw 不會安裝 `cua-driver`、
授予那些權限，或繞過上游 driver 的安全模型。

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
如果 Computer Use 遺失，但 Codex app-server 已經探索到可安裝的
marketplace，OpenClaw 會要求 Codex app-server 安裝或重新啟用該 Plugin，
並重新載入 MCP server。在 macOS 上，當沒有註冊相符 marketplace，
且標準 Codex app bundle 存在時，OpenClaw 也會先嘗試從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
註冊隨附的 Codex marketplace，然後才失敗。如果設定仍無法讓 MCP server
可用，該回合會在 thread 開始前失敗。

現有 session 會保留其 runtime 與 Codex thread 綁定。變更
`agentRuntime` 或 Computer Use 設定後，請先在受影響的 chat 中使用
`/new` 或 `/reset`，再進行測試。

## Commands

請在任何可用 `codex` Plugin command 表面的 chat 表面使用
`/codex computer-use` commands。這些是 OpenClaw chat/runtime commands，
不是 `openclaw codex ...` CLI subcommands：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是唯讀的。它不會新增 marketplace source、安裝 Plugin，
或啟用 Codex Plugin 支援。

`install` 會啟用 Codex app-server Plugin 支援、選擇性新增已設定的
marketplace source、透過 Codex app-server 安裝或重新啟用已設定的 Plugin、
重新載入 MCP server，並驗證 MCP server 是否暴露工具。

## Marketplace 選項

OpenClaw 使用 Codex 自身暴露的同一套 app-server API。
marketplace 欄位會選擇 Codex 應從哪裡尋找 `computer-use`。

| 欄位                 | 使用時機                                                        | 安裝支援                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 無 marketplace 欄位  | 你想讓 Codex app-server 使用它已知的 marketplace。              | 支援，當 app-server 回傳本機 marketplace 時。            |
| `marketplaceSource`  | 你有 Codex app-server 可新增的 Codex marketplace source。       | 支援，適用於明確的 `/codex computer-use install`。       |
| `marketplacePath`    | 你已知道 host 上的本機 marketplace 檔案路徑。                   | 支援，適用於明確安裝與回合開始自動安裝。                |
| `marketplaceName`    | 你想依名稱選取一個已註冊 marketplace。                          | 僅當所選 marketplace 有本機路徑時支援。                  |

全新的 Codex home 可能需要短暫時間來建立官方 marketplace。
安裝期間，OpenClaw 會輪詢 `plugin/list`，最多持續
`marketplaceDiscoveryTimeoutMs` 毫秒。預設值為 60 秒。

如果多個已知 marketplace 包含 Computer Use，OpenClaw 會優先選擇
`openai-bundled`，再選擇 `openai-curated`，最後選擇 `local`。
未知的歧義相符項會安全失敗，並要求你設定 `marketplaceName` 或
`marketplacePath`。

## 隨附的 macOS marketplace

近期的 Codex desktop build 會在此處隨附 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true，且未註冊任何包含 `computer-use` 的
marketplace 時，OpenClaw 會嘗試自動新增標準的隨附 marketplace root：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以從 shell 使用 Codex 明確註冊它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非標準 Codex app 路徑，請將 `computerUse.marketplacePath`
設定為本機 marketplace 檔案路徑，或先執行一次
`/codex computer-use install --source <marketplace-source>`。

## 遠端 catalog 限制

Codex app-server 可以列出並讀取僅遠端的 catalog 項目，但目前不支援
遠端 `plugin/install`。這表示 `marketplaceName` 可以選取僅遠端的
marketplace 進行狀態檢查，但安裝與重新啟用仍需要透過
`marketplaceSource` 或 `marketplacePath` 使用本機 marketplace。

如果狀態顯示該 Plugin 可在遠端 Codex marketplace 中使用，但不支援遠端安裝，
請使用本機 source 或 path 執行 install：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 組態參考

| 欄位                            | 預設值         | 意義                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | 要求 Computer Use。當設定了其他 Computer Use 欄位時，預設為 true。            |
| `autoInstall`                   | false          | 在回合開始時，從已探索到的 marketplace 安裝或重新啟用。                       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | install 等待 Codex app-server marketplace 探索的時間長度。                    |
| `marketplaceSource`             | unset          | 傳給 Codex app-server `marketplace/add` 的 source 字串。                       |
| `marketplacePath`               | unset          | 包含該 Plugin 的本機 Codex marketplace 檔案路徑。                              |
| `marketplaceName`               | unset          | 要選取的已註冊 Codex marketplace 名稱。                                        |
| `pluginName`                    | `computer-use` | Codex marketplace Plugin 名稱。                                                |
| `mcpServerName`                 | `computer-use` | 已安裝 Plugin 暴露的 MCP server 名稱。                                         |

回合開始自動安裝會刻意拒絕已設定的 `marketplaceSource` 值。
新增 source 是明確的設定操作，因此請先使用
`/codex computer-use install --source <marketplace-source>` 一次，之後再讓
`autoInstall` 處理從已探索本機 marketplace 重新啟用的情況。
回合開始自動安裝可以使用已設定的 `marketplacePath`，因為那已經是 host 上的
本機路徑。

## OpenClaw 檢查的內容

OpenClaw 會在內部回報穩定的設定原因，並為 chat 格式化面向使用者的狀態：

| 原因                         | 意義                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。                   | 設定 `enabled` 或另一個 Computer Use 欄位。   |
| `marketplace_missing`        | 沒有可用的相符 marketplace。                           | 設定 source、path 或 marketplace name。       |
| `plugin_not_installed`       | marketplace 存在，但 Plugin 尚未安裝。                 | 執行 install 或啟用 `autoInstall`。           |
| `plugin_disabled`            | Plugin 已安裝，但在 Codex config 中停用。              | 執行 install 以重新啟用它。                   |
| `remote_install_unsupported` | 所選 marketplace 僅支援遠端。                          | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | Plugin 已啟用，但 MCP server 不可用。                  | 檢查 Codex Computer Use 與 OS 權限。          |
| `ready`                      | Plugin 與 MCP 工具可用。                               | 開始 Codex 模式回合。                         |
| `check_failed`               | 狀態檢查期間 Codex app-server request 失敗。           | 檢查 app-server 連線能力與 log。              |
| `auto_install_blocked`       | 回合開始設定需要新增 source。                          | 先執行明確的 install。                        |

chat 輸出會包含 Plugin 狀態、MCP server 狀態、marketplace、可用時的工具，
以及失敗設定步驟的具體訊息。

## macOS 權限

Computer Use 僅支援 macOS。Codex 擁有的 MCP server 可能需要本機 OS 權限，
才能檢查或控制 app。如果 OpenClaw 表示 Computer Use 已安裝，但 MCP server
不可用，請先驗證 Codex 端的 Computer Use 設定：

- Codex app-server 正在應執行桌面控制的同一台主機上執行。
- Computer Use Plugin 已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器出現在 Codex app-server 的 MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前的主機工作階段可以存取正在受控的桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意以失敗關閉方式處理。Codex 模式的回合不應在缺少設定要求的原生桌面工具時靜默繼續。

## 疑難排解

**狀態顯示未安裝。** 執行 `/codex computer-use install`。如果未探索到 marketplace，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但已停用。** 再次執行 `/codex computer-use install`。Codex app-server 安裝會將 Plugin 設定寫回為已啟用。

**狀態顯示不支援遠端安裝。** 使用本機 marketplace 來源或路徑。只能檢查僅遠端的目錄項目，但無法透過目前的 app-server API 安裝。

**狀態顯示 MCP 伺服器無法使用。** 重新執行一次安裝，讓 MCP 伺服器重新載入。如果仍無法使用，請修正 Codex Computer Use 應用程式、Codex app-server MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 上逾時。** Plugin 和 MCP 伺服器都存在，但本機 Computer Use 橋接器未回應。結束或重新啟動 Codex Computer Use，必要時重新啟動 Codex Desktop，然後在新的 OpenClaw 工作階段中重試。

**Computer Use 工具顯示 `Native hook relay unavailable`。** Codex 原生工具 hook 無法透過本機橋接器或 Gateway 後援連到作用中的 OpenClaw 轉送。使用 `/new` 或 `/reset` 啟動新的 OpenClaw 工作階段。如果持續發生，請重新啟動 Gateway，讓舊的 app-server 執行緒和 hook 註冊被移除，然後重試。

**回合開始自動安裝拒絕某個來源。** 這是刻意設計。請先使用明確的 `/codex computer-use install --source <marketplace-source>` 新增來源，之後的回合開始自動安裝就可以使用已探索到的本機 marketplace。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)
- [iOS app](/zh-TW/platforms/ios)
