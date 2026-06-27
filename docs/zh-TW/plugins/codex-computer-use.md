---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 與直接使用 cua-driver MCP 之間做決定。
    - 你正在 Codex Computer Use 與直接的 cua-driver MCP 設定之間做選擇
    - 你正在為內建的 Codex 外掛設定 computerUse
    - 你正在疑難排解 /codex computer-use 狀態或安裝
summary: 為 Codex 模式的 OpenClaw 代理程式設定 Codex Computer Use
title: Codex 電腦使用
x-i18n:
    generated_at: "2026-06-27T19:34:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是 Codex 原生的 MCP 外掛，用於本機桌面控制。OpenClaw
不內嵌桌面應用程式、不自行執行桌面動作，也不繞過
Codex 權限。內建的 `codex` 外掛只會準備 Codex app-server：
它會啟用 Codex 外掛支援、尋找或安裝已設定的 Codex
Computer Use 外掛、檢查 `computer-use` MCP 伺服器是否可用，然後
在 Codex 模式回合中，讓 Codex 擁有原生 MCP 工具呼叫。

當 OpenClaw 已經使用原生 Codex harness 時，請使用此頁。若要了解
執行階段設定本身，請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

## OpenClaw.app 與 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 是分開的。這個
macOS 應用程式可以託管 PeekabooBridge socket，讓 `peekaboo` 命令列介面能重用
應用程式本機的「輔助使用」與「螢幕錄製」授權，以供 Peekaboo 自身的
自動化工具使用。該橋接不會安裝或代理 Codex Computer Use，而
Codex Computer Use 也不會透過 PeekabooBridge socket 呼叫。

當你想讓 OpenClaw.app 成為具權限感知能力的 Peekaboo 命令列介面自動化主機時，
請使用 [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)。當
Codex 模式的 OpenClaw 代理需要在回合開始前可用 Codex 原生的 `computer-use` MCP 外掛時，
請使用此頁。

## iOS 應用程式

iOS 應用程式與 Codex Computer Use 是分開的。它不會安裝或代理
Codex `computer-use` MCP 伺服器，也不是桌面控制後端。
相反地，iOS 應用程式會作為 OpenClaw 節點連線，並透過
`canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*` 等節點命令公開行動裝置能力。

當你想讓代理透過閘道驅動 iPhone 節點時，請使用 [iOS](/zh-TW/platforms/ios)。
當 Codex 模式代理應透過 Codex 原生 Computer Use 外掛控制本機
macOS 桌面時，請使用此頁。

## 直接使用 cua-driver MCP

Codex Computer Use 並不是公開桌面控制的唯一方式。如果你想讓
OpenClaw 管理的執行階段直接呼叫 TryCua 的 driver，請透過 OpenClaw 的 MCP 登錄使用上游
`cua-driver mcp` 伺服器，而不是使用 Codex 專用的市集流程。

安裝 `cua-driver` 後，可以向它要求 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或自行註冊 stdio 伺服器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

該路徑會保留上游 MCP 工具表面不變，包括 driver
結構描述和結構化 MCP 回應。當你想讓 CUA driver
作為一般 OpenClaw MCP 伺服器可用時，請使用它。當 Codex app-server 應在
Codex 模式回合內負責外掛安裝、MCP 重新載入
和原生工具呼叫時，請使用本頁的 Codex Computer Use 設定。

CUA 的 driver 僅限 macOS，並且仍需要其應用程式提示的本機 macOS 權限，
例如「輔助使用」和「螢幕錄製」。OpenClaw
不會安裝 `cua-driver`、授予這些權限，或繞過上游
driver 的安全模型。

## 快速設定

當 Codex 模式回合必須在執行緒開始前可用 Computer Use 時，設定
`plugins.entries.codex.config.computerUse`。`autoInstall: true` 會選擇啟用
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
如果缺少 Computer Use，但 Codex app-server 已經發現可安裝的
市集，OpenClaw 會要求 Codex app-server 安裝或重新啟用
該外掛並重新載入 MCP 伺服器。在 macOS 上，當未註冊相符的市集
且標準 Codex 應用程式套件存在時，OpenClaw 也會嘗試從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊內建的 Codex 市集，
然後才會失敗。如果設定仍無法讓 MCP 伺服器可用，該回合會在
執行緒開始前失敗。

變更 Computer Use 設定後，如果既有 Codex 執行緒已經開始，請先在受影響的聊天中使用
`/new` 或 `/reset`，再進行測試。

在 macOS 受管理的 stdio 啟動中，當
`/Applications/Codex.app/Contents/Resources/codex` 存在時，OpenClaw 會優先使用已簽署的桌面 Codex 應用程式
套件。這會讓 Computer Use 保持在擁有本機桌面控制
權限的應用程式套件下。如果未安裝桌面應用程式，OpenClaw 會回退到
安裝在外掛旁的受管理 Codex 二進位檔。如果已安裝的桌面應用程式
以不支援的 app-server 版本初始化，OpenClaw 會關閉該子程序
並改為重試下一個受管理的二進位檔候選，而不是讓過時的
桌面應用程式遮蔽外掛本機的回退項。明確的 `appServer.command`
設定或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍會覆寫此受管理
選擇。

## 命令

在任何可使用 `codex` 外掛命令表面的聊天介面中，使用 `/codex computer-use`
命令。這些是 OpenClaw 聊天/執行階段命令，
不是 `openclaw codex ...` 命令列介面子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是唯讀的。它不會新增市集來源、安裝外掛，或
啟用 Codex 外掛支援。如果沒有設定選擇啟用 Computer Use，即使在一次性安裝命令後，
`status` 仍可能回報已停用。

`install` 會啟用 Codex app-server 外掛支援、選擇性新增已設定的
市集來源、透過 Codex app-server 安裝或重新啟用已設定的外掛、
重新載入 MCP 伺服器，並驗證 MCP 伺服器有公開工具。

## 市集選項

OpenClaw 使用 Codex 本身公開的相同 app-server API。
市集欄位會選擇 Codex 應從何處尋找 `computer-use`。

| 欄位                | 使用時機                                                        | 安裝支援                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 無市集欄位 | 你想讓 Codex app-server 使用它已知的市集。 | 是，當 app-server 傳回本機市集時。        |
| `marketplaceSource`  | 你有可由 Codex app-server 新增的 Codex 市集來源。         | 是，適用於明確的 `/codex computer-use install`。         |
| `marketplacePath`    | 你已經知道主機上的本機市集檔案路徑。   | 是，適用於明確安裝和回合開始自動安裝。   |
| `marketplaceName`    | 你想依名稱選擇一個已註冊的市集。  | 只有在所選市集有本機路徑時才支援。 |

新的 Codex home 可能需要一小段時間來填入其官方市集。
安裝期間，OpenClaw 會輪詢 `plugin/list`，最長
`marketplaceDiscoveryTimeoutMs` 毫秒。預設值為 60 秒。

如果多個已知市集包含 Computer Use，OpenClaw 會優先使用
`openai-bundled`，其次是 `openai-curated`，再來是 `local`。未知且含糊的相符項
會以封閉方式失敗，並要求你設定 `marketplaceName` 或 `marketplacePath`。

## 內建 macOS 市集

近期的 Codex 桌面建置會在此處內建 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true 且未註冊包含
`computer-use` 的市集時，OpenClaw 會嘗試自動新增標準內建
市集根目錄：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以從 shell 使用 Codex 明確註冊它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非標準 Codex 應用程式路徑，請先執行一次 `/codex computer-use install
--source <marketplace-root>`，或將 `computerUse.marketplacePath` 設為
本機市集檔案路徑。只有在你有市集 JSON 檔案路徑時才使用
`--marketplace-path`，不要用於內建市集根目錄。

## 遠端目錄限制

Codex app-server 可以列出和讀取僅遠端的目錄項目，但目前不支援
遠端 `plugin/install`。這表示 `marketplaceName` 可以
選擇僅遠端的市集進行狀態檢查，但安裝和重新啟用
仍需要透過 `marketplaceSource` 或 `marketplacePath` 使用本機市集。

如果狀態顯示該外掛可在遠端 Codex 市集中使用，但不支援遠端
安裝，請使用本機來源或路徑執行安裝：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定參考

| 欄位                           | 預設值        | 含義                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推斷       | 要求 Computer Use。當設定另一個 Computer Use 欄位時，預設為 true。 |
| `autoInstall`                   | false          | 在回合開始時，從已發現的市集安裝或重新啟用。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安裝等待 Codex app-server 市集發現的時間。             |
| `marketplaceSource`             | 未設定          | 傳遞給 Codex app-server `marketplace/add` 的來源字串。                    |
| `marketplacePath`               | 未設定          | 包含該外掛的本機 Codex 市集檔案路徑。                       |
| `marketplaceName`               | 未設定          | 要選擇的已註冊 Codex 市集名稱。                                   |
| `pluginName`                    | `computer-use` | Codex 市集外掛名稱。                                                 |
| `mcpServerName`                 | `computer-use` | 已安裝外掛公開的 MCP 伺服器名稱。                               |

回合開始自動安裝會刻意拒絕已設定的 `marketplaceSource`
值。新增來源是一項明確的設定操作，因此請先使用
`/codex computer-use install --source <marketplace-source>` 一次，然後讓
`autoInstall` 處理之後從已發現的本機市集重新啟用。
回合開始自動安裝可以使用已設定的 `marketplacePath`，因為那已經是
主機上的本機路徑。

## OpenClaw 會檢查什麼

OpenClaw 會在內部回報穩定的設定原因，並為聊天格式化面向使用者的
狀態：

| 原因                         | 含義                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。                  | 設定 `enabled` 或另一個 Computer Use 欄位。   |
| `marketplace_missing`        | 沒有可用的相符 marketplace。                           | 設定來源、路徑或 marketplace 名稱。           |
| `plugin_not_installed`       | marketplace 存在，但外掛尚未安裝。                    | 執行安裝或啟用 `autoInstall`。                |
| `plugin_disabled`            | 外掛已安裝，但在 Codex 設定中已停用。                  | 執行安裝以重新啟用。                          |
| `remote_install_unsupported` | 選取的 marketplace 僅支援遠端。                       | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 外掛已啟用，但 MCP 伺服器無法使用。                    | 檢查 Codex Computer Use 和作業系統權限。      |
| `ready`                      | 外掛和 MCP 工具可用。                                  | 開始 Codex 模式回合。                         |
| `check_failed`               | 狀態檢查期間 Codex app-server 請求失敗。               | 檢查 app-server 連線能力和記錄。              |
| `auto_install_blocked`       | 回合開始設定需要新增來源。                             | 先執行明確安裝。                              |

聊天輸出會包含外掛狀態、MCP 伺服器狀態、marketplace、可用時的工具，
以及失敗設定步驟的特定訊息。

## macOS 權限

Computer Use 僅適用於 macOS。Codex 擁有的 MCP 伺服器可能需要本機作業系統
權限，才能檢查或控制應用程式。如果 OpenClaw 表示 Computer Use
已安裝，但 MCP 伺服器無法使用，請先驗證 Codex 端的 Computer
Use 設定：

- Codex app-server 正在應執行桌面控制的同一主機上執行。
- Computer Use 外掛已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器出現在 Codex app-server MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前的主機工作階段可存取受控制的桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意採取封閉失敗。
Codex 模式回合不應在缺少設定所要求的原生桌面工具時默默繼續。

## 疑難排解

**狀態顯示尚未安裝。** 執行 `/codex computer-use install`。如果未探索到
marketplace，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但已停用。** 再次執行 `/codex computer-use install`。
Codex app-server 安裝會將外掛設定寫回啟用狀態。

**狀態顯示不支援遠端安裝。** 使用本機 marketplace 來源或
路徑。僅遠端的目錄項目可以檢查，但無法透過目前的 app-server API 安裝。

**狀態顯示 MCP 伺服器無法使用。** 重新執行一次安裝，讓 MCP
伺服器重新載入。如果仍然無法使用，請修正 Codex Computer Use app、
Codex app-server MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 逾時。** 外掛和 MCP
伺服器都存在，但本機 Computer Use 橋接未回應。結束或重新啟動
Codex Computer Use，必要時重新啟動 Codex Desktop，然後在新的
OpenClaw 工作階段中重試。如果主機先前透過較舊的受管理 Codex
app-server 執行 Computer Use，請從桌面內建 marketplace 重新整理已安裝的外掛：

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use 工具顯示 `Native hook relay unavailable`。** Codex 原生
工具鉤子無法透過本機橋接或閘道備援連到作用中的 OpenClaw relay。使用
`/new` 或 `/reset` 啟動新的 OpenClaw 工作階段。如果它只成功一次，之後的工具呼叫又再次失敗，`/new` 只是清除目前嘗試；請重新啟動 Codex app-server 或 OpenClaw 閘道，讓舊執行緒和鉤子註冊被丟棄，然後在新的工作階段中重試。

**回合開始自動安裝拒絕來源。** 這是刻意設計。請先使用明確的
`/codex computer-use install --source <marketplace-source>` 新增來源，之後的回合開始自動安裝就能使用已探索到的本機
marketplace。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)
- [iOS app](/zh-TW/platforms/ios)
