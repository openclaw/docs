---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 與直接 cua-driver MCP 之間做決定
    - 你正在 Codex 電腦使用與直接的 cua-driver MCP 設定之間做決定
    - 你正在為內建的 Codex 外掛設定 computerUse
    - 你正在疑難排解 /codex 電腦使用狀態或安裝
summary: 設定供 Codex 模式 OpenClaw 代理使用的 Codex Computer Use
title: Codex 電腦使用
x-i18n:
    generated_at: "2026-06-30T13:47:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是 Codex 原生 MCP 外掛，用於本機桌面控制。OpenClaw
不會隨附桌面應用程式、自己執行桌面動作，或繞過
Codex 權限。內建的 `codex` 外掛只會準備 Codex app-server：
它會啟用 Codex 外掛支援、尋找或安裝已設定的 Codex
Computer Use 外掛、檢查 `computer-use` MCP 伺服器是否可用，然後
在 Codex 模式回合期間讓 Codex 擁有原生 MCP 工具呼叫。

當 OpenClaw 已經使用原生 Codex harness 時，請使用此頁面。如需
執行階段設定本身，請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 分開。此
macOS 應用程式可以託管 PeekabooBridge socket，讓 `peekaboo` 命令列介面可重用
應用程式本機的「輔助使用」與「螢幕錄製」授權，用於 Peekaboo 自己的
自動化工具。該橋接不會安裝或代理 Codex Computer Use，而
Codex Computer Use 也不會透過 PeekabooBridge socket 呼叫。

當你希望 OpenClaw.app 成為 Peekaboo 命令列介面自動化的
權限感知主機時，請使用 [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)。當
Codex 模式的 OpenClaw agent 應該在回合開始前可用 Codex 原生 `computer-use` MCP 外掛
時，請使用此頁面。

## iOS 應用程式

iOS 應用程式與 Codex Computer Use 分開。它不會安裝或代理
Codex `computer-use` MCP 伺服器，也不是桌面控制後端。
相反地，iOS 應用程式會作為 OpenClaw 節點連線，並透過
`canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*` 等節點命令公開行動功能。

當你希望 agent 透過閘道驅動 iPhone 節點時，請使用 [iOS](/zh-TW/platforms/ios)。
當 Codex 模式 agent 應透過 Codex 原生 Computer Use 外掛控制本機
macOS 桌面時，請使用此頁面。

## 直接 cua-driver MCP

Codex Computer Use 不是公開桌面控制的唯一方式。如果你希望
OpenClaw 管理的執行階段直接呼叫 TryCua 的 driver，請透過 OpenClaw 的 MCP registry 使用上游
`cua-driver mcp` 伺服器，而不是 Codex 專用的 marketplace 流程。

安裝 `cua-driver` 後，可以要求它提供 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或自行註冊 stdio 伺服器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

該路徑會保留上游 MCP 工具介面，包括 driver schema 和結構化 MCP 回應。
當你希望 CUA driver 作為一般 OpenClaw MCP 伺服器可用時，請使用它。
當 Codex app-server 應該在 Codex 模式回合內擁有外掛安裝、MCP 重新載入
與原生工具呼叫時，請使用本頁的 Codex Computer Use 設定。

CUA 的 driver 只適用於 macOS，且仍需要其應用程式提示的本機 macOS 權限，
例如「輔助使用」與「螢幕錄製」。OpenClaw
不會安裝 `cua-driver`、授予這些權限，或繞過上游
driver 的安全模型。

## 快速設定

當 Codex 模式回合必須在 thread 開始前可用
Computer Use 時，設定 `plugins.entries.codex.config.computerUse`。`autoInstall: true` 會選擇啟用
Computer Use，並讓 OpenClaw 在回合前安裝或重新啟用它：

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
    },
  },
}
```

使用此設定時，OpenClaw 會在每個 Codex 模式回合前檢查 Codex app-server。
如果缺少 Computer Use，但 Codex app-server 已經發現可安裝的 marketplace，
OpenClaw 會要求 Codex app-server 安裝或重新啟用該外掛並重新載入 MCP 伺服器。
在 macOS 上，當沒有註冊相符的 marketplace 且標準 Codex 應用程式 bundle 存在時，
OpenClaw 也會先嘗試從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊內建 Codex marketplace，
然後才失敗。如果設定仍然無法讓 MCP 伺服器可用，回合會在 thread 開始前失敗。

變更 Computer Use 設定後，如果既有 Codex thread 已經開始，請在測試前於受影響的聊天中使用
`/new` 或 `/reset`。

在 macOS 受管理的 stdio 啟動中，當
`/Applications/Codex.app/Contents/Resources/codex` 存在時，OpenClaw 會優先使用簽署的桌面 Codex 應用程式 bundle。
這會讓 Computer Use 保持在擁有本機桌面控制權限的應用程式 bundle 下。
如果未安裝桌面應用程式，OpenClaw 會退回使用安裝在外掛旁的受管理 Codex binary。
如果已安裝的桌面應用程式使用不支援的 app-server 版本初始化，OpenClaw 會關閉該 child
並重試下一個受管理的 binary 候選，而不是讓過時的桌面應用程式遮蔽外掛本機 fallback。
明確的 `appServer.command` 設定或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍會覆寫此受管理的選擇。

## 命令

在任何可用 `codex` 外掛命令介面的聊天表面使用 `/codex computer-use` 命令。
這些是 OpenClaw 聊天/執行階段命令，
不是 `openclaw codex ...` 命令列介面子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是唯讀的。它不會新增 marketplace 來源、安裝外掛，或
啟用 Codex 外掛支援。如果沒有設定選擇啟用 Computer Use，`status` 即使在一次性 install 命令後
仍可能回報 disabled。

`install` 會啟用 Codex app-server 外掛支援、選擇性新增已設定的
marketplace 來源、透過 Codex app-server 安裝或重新啟用已設定的外掛、
重新載入 MCP 伺服器，並驗證 MCP 伺服器公開工具。
由於安裝會變更受信任的主機資源，只有 owner 或
`operator.admin` 閘道 client 可以執行 `install`。其他已授權的 sender 可以
繼續使用唯讀 `status` 命令，包括搭配 overrides。

## Marketplace 選擇

OpenClaw 使用 Codex 自身公開的相同 app-server API。
marketplace 欄位會選擇 Codex 應該在哪裡尋找 `computer-use`。

| 欄位                 | 使用時機                                                        | 安裝支援                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 無 marketplace 欄位 | 你希望 Codex app-server 使用它已知的 marketplaces。 | 是，當 app-server 回傳本機 marketplace 時。 |
| `marketplaceSource`  | 你有 Codex marketplace 來源可供 app-server 新增。 | 是，用於明確的 `/codex computer-use install`。 |
| `marketplacePath`    | 你已知道主機上的本機 marketplace 檔案路徑。 | 是，用於明確安裝與回合開始自動安裝。 |
| `marketplaceName`    | 你想依名稱選擇一個已註冊的 marketplace。 | 只有當選定的 marketplace 有本機路徑時才支援。 |

全新的 Codex homes 可能需要一小段時間來建立官方 marketplaces。
安裝期間，OpenClaw 會輪詢 `plugin/list`，最多等待
`marketplaceDiscoveryTimeoutMs` 毫秒。預設值是 60 秒。

如果多個已知 marketplaces 包含 Computer Use，OpenClaw 會優先選擇
`openai-bundled`，接著是 `openai-curated`，再來是 `local`。未知的 ambiguous matches
會 fail closed，並要求你設定 `marketplaceName` 或 `marketplacePath`。

## 內建 macOS marketplace

近期的 Codex 桌面版 build 會在此處內建 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true 且沒有註冊包含
`computer-use` 的 marketplace 時，OpenClaw 會嘗試自動新增標準內建
marketplace root：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以從 shell 使用 Codex 明確註冊它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非標準 Codex app 路徑，請執行一次 `/codex computer-use install
--source <marketplace-root>`，或將 `computerUse.marketplacePath` 設定為
本機 marketplace 檔案路徑。只有在你有 marketplace JSON 檔案路徑時才使用
`--marketplace-path`，不要用於內建 marketplace root。

## 遠端 catalog 限制

Codex app-server 可以列出並讀取 remote-only catalog entries，但目前不支援
remote `plugin/install`。這表示 `marketplaceName` 可以為 status 檢查選擇
remote-only marketplace，但安裝與重新啟用仍需要透過 `marketplaceSource` 或
`marketplacePath` 使用本機 marketplace。

如果 status 表示外掛在遠端 Codex marketplace 中可用，但不支援遠端安裝，
請使用本機來源或路徑執行 install：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定參考

| 欄位                            | 預設值         | 意義                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | 要求 Computer Use。當設定了另一個 Computer Use 欄位時，預設為 true。 |
| `autoInstall`                   | false          | 在回合開始時從已發現的 marketplaces 安裝或重新啟用。 |
| `marketplaceDiscoveryTimeoutMs` | 60000          | install 等待 Codex app-server marketplace discovery 的時間。 |
| `marketplaceSource`             | unset          | 傳遞給 Codex app-server `marketplace/add` 的來源字串。 |
| `marketplacePath`               | unset          | 包含該外掛的本機 Codex marketplace 檔案路徑。 |
| `marketplaceName`               | unset          | 要選擇的已註冊 Codex marketplace 名稱。 |
| `pluginName`                    | `computer-use` | Codex marketplace 外掛名稱。 |
| `mcpServerName`                 | `computer-use` | 已安裝外掛公開的 MCP 伺服器名稱。 |

回合開始自動安裝會刻意拒絕已設定的 `marketplaceSource` 值。
新增來源是明確的設定操作，因此請先使用
`/codex computer-use install --source <marketplace-source>` 一次，之後讓
`autoInstall` 從已發現的本機 marketplaces 處理未來的重新啟用。
回合開始自動安裝可以使用已設定的 `marketplacePath`，因為那已經是
主機上的本機路徑。

## OpenClaw 檢查的內容

OpenClaw 會在內部回報穩定的設定原因，並為聊天格式化面向使用者的
status：

| 原因                         | 意義                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。                   | 設定 `enabled` 或其他 Computer Use 欄位。     |
| `marketplace_missing`        | 沒有可用的相符市集。                                  | 設定來源、路徑或市集名稱。                   |
| `plugin_not_installed`       | 市集存在，但外掛尚未安裝。                            | 執行安裝或啟用 `autoInstall`。               |
| `plugin_disabled`            | 外掛已安裝，但在 Codex 設定中停用。                   | 執行安裝以重新啟用它。                       |
| `remote_install_unsupported` | 選取的市集僅支援遠端。                                | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 外掛已啟用，但 MCP 伺服器無法使用。                   | 檢查 Codex Computer Use 和作業系統權限。      |
| `ready`                      | 外掛和 MCP 工具可用。                                 | 開始 Codex 模式回合。                        |
| `check_failed`               | 狀態檢查期間 Codex app-server 請求失敗。              | 檢查 app-server 連線能力和記錄。             |
| `auto_install_blocked`       | 回合開始設定需要新增來源。                            | 先執行明確安裝。                             |

聊天輸出會包含外掛狀態、MCP 伺服器狀態、市集、可用時的工具，以及失敗設定步驟的特定訊息。

## macOS 權限

Computer Use 是 macOS 專用。Codex 擁有的 MCP 伺服器可能需要本機作業系統權限，才能檢查或控制應用程式。如果 OpenClaw 顯示 Computer Use 已安裝，但 MCP 伺服器無法使用，請先驗證 Codex 端的 Computer Use 設定：

- Codex app-server 正在應執行桌面控制的同一部主機上執行。
- Computer Use 外掛已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器會出現在 Codex app-server MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前主機工作階段可以存取受控制的桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意採取封閉式失敗。Codex 模式回合不應在缺少設定所要求的原生桌面工具時默默繼續。

## 疑難排解

**狀態顯示尚未安裝。** 執行 `/codex computer-use install`。如果未發現市集，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但停用。** 再次執行 `/codex computer-use install`。Codex app-server 安裝會將外掛設定寫回啟用狀態。

**狀態顯示不支援遠端安裝。** 使用本機市集來源或路徑。僅限遠端的目錄項目可以檢查，但無法透過目前的 app-server API 安裝。

**狀態顯示 MCP 伺服器無法使用。** 重新執行一次安裝，讓 MCP 伺服器重新載入。如果仍無法使用，請修正 Codex Computer Use 應用程式、Codex app-server MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 逾時。** 外掛和 MCP 伺服器存在，但本機 Computer Use 橋接沒有回應。結束或重新啟動 Codex Computer Use，必要時重新啟動 Codex Desktop，然後在新的 OpenClaw 工作階段中重試。如果主機先前透過較舊的受管理 Codex app-server 執行 Computer Use，請從桌面隨附市集重新整理已安裝的外掛：

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use 工具顯示 `Native hook relay unavailable`。** Codex 原生工具鉤子無法透過本機橋接或閘道備援連上有效的 OpenClaw 轉送。使用 `/new` 或 `/reset` 啟動新的 OpenClaw 工作階段。如果它成功一次，但稍後工具呼叫又再次失敗，表示 `/new` 只清除了目前嘗試；請重新啟動 Codex app-server 或 OpenClaw 閘道，讓舊執行緒和鉤子註冊被移除，然後在新的工作階段中重試。

**回合開始自動安裝拒絕來源。** 這是刻意設計。先使用明確的 `/codex computer-use install --source <marketplace-source>` 新增來源，之後回合開始自動安裝就能使用已發現的本機市集。

## 相關

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Peekaboo 橋接](/zh-TW/platforms/mac/peekaboo)
- [iOS 應用程式](/zh-TW/platforms/ios)
