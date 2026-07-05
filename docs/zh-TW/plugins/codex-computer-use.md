---
read_when:
    - 你希望 Codex 模式的 OpenClaw agents 使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 與直接使用 cua-driver MCP 之間做決定
    - 你正在 Codex Computer Use 與直接的 cua-driver MCP 設定之間做決定
    - 您正在設定隨附 Codex 外掛的 computerUse
    - 你正在疑難排解 /codex 電腦使用狀態或安裝
summary: 設定 Codex 模式 OpenClaw 代理程式的 Codex Computer Use
title: Codex 電腦使用
x-i18n:
    generated_at: "2026-07-05T11:28:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ce6ef3a14f359b64855fee933425f40fc9f34e94572b68c7dee605ac896983f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是 Codex 原生 MCP 外掛，用於本機桌面控制。OpenClaw
不會內建桌面應用程式、不會自行執行桌面動作，也不會繞過
Codex 權限。隨附的 `codex` 外掛只會準備 Codex app-server：
它會啟用 Codex 外掛支援、尋找或安裝已設定的 Computer Use
外掛、檢查 `computer-use` MCP 伺服器是否可用，接著在 Codex 模式回合期間，讓
Codex 擁有原生 MCP 工具呼叫。

當 OpenClaw 已經使用原生 Codex harness 時，請使用此頁。若要了解
執行階段設定本身，請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

## OpenClaw.app 與 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 分開。這個
macOS 應用程式可以託管 PeekabooBridge socket，讓 `peekaboo` 命令列介面可以重用
應用程式本機的輔助使用與螢幕錄製授權，供 Peekaboo 自身的
自動化工具使用。該橋接不會安裝或代理 Codex Computer Use，而且
Codex Computer Use 不會透過 PeekabooBridge socket 呼叫。

當你希望 OpenClaw.app 作為 Peekaboo 命令列介面自動化的
權限感知主機時，請使用 [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)。當
Codex 模式的 OpenClaw agent 應在回合開始前具備 Codex 原生 `computer-use` MCP 外掛時，請使用此頁。

## iOS 應用程式

iOS 應用程式與 Codex Computer Use 分開。它不會安裝或代理
Codex `computer-use` MCP 伺服器，也不是桌面控制後端。
相反地，iOS 應用程式會作為 OpenClaw 節點連線，並透過
節點命令公開行動裝置功能，例如 `canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*`。

當你希望 agent 透過閘道驅動 iPhone 節點時，請使用 [iOS](/zh-TW/platforms/ios)。當 Codex 模式 agent 應透過 Codex 原生 Computer Use 外掛控制
本機 macOS 桌面時，請使用此頁。

## 直接使用 cua-driver MCP

Codex Computer Use 並不是公開桌面控制的唯一方式。如果你希望
OpenClaw 管理的執行階段直接呼叫 TryCua 的 driver，請透過 OpenClaw 的 MCP registry 使用上游
`cua-driver mcp` 伺服器，而不是
Codex 專屬的 marketplace 流程。

安裝 `cua-driver` 後，可以要求它提供 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或直接註冊 stdio 伺服器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

該路徑會保留上游 MCP 工具介面，包括 driver
schema 與結構化 MCP 回應。當你希望 CUA driver
作為一般 OpenClaw MCP 伺服器可用時，請使用它。當 Codex app-server 應在
Codex 模式回合內擁有外掛安裝、MCP 重新載入與
原生工具呼叫時，請使用此頁的 Codex Computer Use 設定。

CUA 的 driver 僅適用於 macOS，且仍需要其應用程式提示的本機 macOS 權限，
例如輔助使用與螢幕錄製。OpenClaw 不會
安裝 `cua-driver`、授予那些權限，或繞過上游
driver 的安全模型。

## 快速設定

當 Codex 模式回合必須在對話串開始前讓
Computer Use 可用時，請設定 `plugins.entries.codex.config.computerUse`。`autoInstall: true` 會選用
Computer Use，並讓 OpenClaw 在回合開始前安裝或重新啟用它：

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

使用此設定時，OpenClaw 會在每個 Codex 模式
回合前檢查 Codex app-server。如果 Computer Use 缺失，但 Codex app-server 已經探索到
可安裝的 marketplace，OpenClaw 會要求 Codex app-server 安裝或
重新啟用該外掛並重新載入 MCP 伺服器。在 macOS 上，若未註冊相符的
marketplace 且標準 Codex 應用程式 bundle 存在，OpenClaw
也會嘗試從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊隨附的 Codex marketplace，然後才
失敗。如果設定仍無法讓 MCP 伺服器可用，該回合會在
對話串開始前失敗。

變更 Computer Use 設定後，如果既有 Codex 對話串已經開始，請先在受影響的
聊天中使用 `/new` 或 `/reset` 再測試。

在 macOS 受管理的 stdio 啟動中，當
`/Applications/Codex.app/Contents/Resources/codex` 存在時，OpenClaw 會偏好已簽署的桌面 Codex 應用程式
bundle。這會讓 Computer Use 位於擁有本機
桌面控制權限的應用程式 bundle 之下。如果未安裝桌面應用程式，OpenClaw
會退回使用安裝在外掛旁的受管理 Codex binary。如果已安裝的桌面應用程式以不受支援的 app-server 版本初始化，
OpenClaw 會關閉該子程序，並改試下一個受管理 binary 候選，
而不是讓過時的桌面應用程式遮蔽外掛本機 fallback。
明確的 `appServer.command` 設定或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍會
覆寫此受管理選擇。

## 命令

請在任何可使用 `codex` 外掛命令介面的聊天介面中使用
`/codex computer-use` 命令。這些是 OpenClaw 聊天/執行階段
命令，不是 `openclaw codex ...` 命令列介面子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是預設動作且為唯讀：它不會新增 marketplace
來源、安裝外掛，或啟用 Codex 外掛支援。如果沒有設定選用
Computer Use，即使已執行一次性安裝
命令，`status` 也可能回報為停用。

`install` 會啟用 Codex app-server 外掛支援、選擇性新增
已設定的 marketplace 來源、透過 Codex app-server 安裝或重新啟用已設定的外掛、
重新載入 MCP 伺服器，並驗證 MCP
伺服器有公開工具。由於安裝會變更受信任的主機資源，
只有擁有者或 `operator.admin` 閘道 client 可以執行 `install`。其他
已授權傳送者可以繼續使用唯讀的 `status` 命令，
包括搭配覆寫使用。

## Marketplace 選項

OpenClaw 使用與 Codex 本身公開的相同 app-server API。
marketplace 欄位會選擇 Codex 應從何處尋找 `computer-use`。

| 欄位                 | 使用時機                                                        | 安裝支援                                             |
| -------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| 無 marketplace 欄位 | 你希望 Codex app-server 使用它已知的 marketplace。              | 是，當 app-server 回傳本機 marketplace 時。          |
| `marketplaceSource`  | 你有一個 Codex marketplace 來源可供 app-server 新增。           | 是，適用於明確的 `/codex computer-use install`。     |
| `marketplacePath`    | 你已知道主機上的本機 marketplace 檔案路徑。                     | 是，適用於明確安裝與回合開始自動安裝。              |
| `marketplaceName`    | 你想依名稱選取一個已註冊的 marketplace。                        | 僅當選取的 marketplace 具有本機路徑時才支援。       |

全新的 Codex home 可能需要短暫時間來植入其官方
marketplace。安裝期間，OpenClaw 會輪詢 `plugin/list`，最長
`marketplaceDiscoveryTimeoutMs` 毫秒（預設 60 秒）。

如果多個已知 marketplace 包含 Computer Use，OpenClaw 會優先選擇
`openai-bundled`，接著是 `openai-curated`，再來是 `local`。未知且有歧義的
符合項目會失敗關閉，並要求你設定 `marketplaceName` 或
`marketplacePath`。

## 隨附的 macOS marketplace

近期 Codex desktop build 會在此處隨附 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true 且未註冊任何包含
`computer-use` 的 marketplace 時，OpenClaw 會嘗試自動新增標準隨附
marketplace root：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以從 shell 使用 Codex 明確註冊它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非標準 Codex 應用程式路徑，請執行一次 `/codex computer-use install
--source <marketplace-root>`，或將 `computerUse.marketplacePath` 設為
本機 marketplace 檔案路徑。只有在你有
marketplace JSON 檔案路徑時才使用 `--marketplace-path`，而不是隨附的 marketplace root。

## 遠端 catalog 限制

Codex app-server 可以列出並讀取僅遠端的 catalog 項目，但目前
不支援遠端 `plugin/install`。這表示 `marketplaceName`
可以選取僅遠端的 marketplace 進行狀態檢查，但安裝與
重新啟用仍需要透過 `marketplaceSource` 或
`marketplacePath` 使用本機 marketplace。

如果狀態顯示該外掛可在遠端 Codex marketplace 中取得，但
不支援遠端安裝，請使用本機來源或路徑執行安裝：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定參考

| 欄位                            | 預設           | 含義                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推斷           | 要求 Computer Use。當設定另一個 Computer Use 欄位時，預設為 true。             |
| `autoInstall`                   | false          | 在回合開始時，從已探索的 marketplace 安裝或重新啟用。                         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安裝等待 Codex app-server marketplace 探索的時間長度。                         |
| `marketplaceSource`             | 未設定         | 傳遞給 Codex app-server `marketplace/add` 的來源字串。                         |
| `marketplacePath`               | 未設定         | 包含該外掛的本機 Codex marketplace 檔案路徑。                                  |
| `marketplaceName`               | 未設定         | 要選取的已註冊 Codex marketplace 名稱。                                        |
| `pluginName`                    | `computer-use` | Codex marketplace 外掛名稱。                                                   |
| `mcpServerName`                 | `computer-use` | 已安裝外掛公開的 MCP 伺服器名稱。                                             |

回合開始自動安裝會刻意拒絕已設定的 `marketplaceSource`
值。新增新來源是明確的設定操作，因此請先使用
`/codex computer-use install --source <marketplace-source>` 一次，然後讓
`autoInstall` 處理未來從已探索本機 marketplace 重新啟用。
回合開始自動安裝可以使用已設定的 `marketplacePath`，因為那
已經是主機上的本機路徑。

每個欄位也接受環境變數覆寫，會在相符的
設定鍵未設定時檢查：

| 欄位                            | 環境變數                                                       |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw 會檢查什麼

OpenClaw 會在內部回報穩定的設定原因，並為聊天格式化面向使用者的狀態：

| 原因                         | 含義                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。                   | 設定 `enabled` 或另一個 Computer Use 欄位。   |
| `marketplace_missing`        | 沒有可用的相符市集。                                  | 設定來源、路徑或市集名稱。                    |
| `plugin_not_installed`       | 市集存在，但外掛尚未安裝。                            | 執行安裝或啟用 `autoInstall`。                |
| `plugin_disabled`            | 外掛已安裝，但在 Codex 設定中已停用。                 | 執行安裝以重新啟用它。                        |
| `remote_install_unsupported` | 選取的市集僅支援遠端。                                | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 外掛已啟用，但 MCP 伺服器無法使用。                   | 檢查 Codex Computer Use 和作業系統權限。      |
| `ready`                      | 外掛和 MCP 工具可用。                                 | 開始 Codex 模式回合。                         |
| `check_failed`               | 狀態檢查期間，Codex 應用程式伺服器請求失敗。          | 檢查應用程式伺服器連線能力和記錄。            |
| `auto_install_blocked`       | 回合開始設定需要新增來源。                            | 先執行明確安裝。                              |

聊天輸出包含外掛狀態、MCP 伺服器狀態、市集、可用時的工具，以及失敗設定步驟的特定訊息。

## macOS 權限

Computer Use 是 macOS 專用。Codex 擁有的 MCP 伺服器可能需要本機作業系統權限，才能檢查或控制應用程式。如果 OpenClaw 表示 Computer Use 已安裝，但 MCP 伺服器無法使用，請先驗證 Codex 端的 Computer Use 設定：

- Codex 應用程式伺服器正在應該執行桌面控制的同一台主機上執行。
- Computer Use 外掛已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器出現在 Codex 應用程式伺服器 MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前的主機工作階段可以存取受控桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意採用失敗關閉。Codex 模式回合不應在沒有設定要求的原生桌面工具時默默繼續。

## 疑難排解

**狀態顯示未安裝。** 執行 `/codex computer-use install`。如果未探索到市集，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但已停用。** 再次執行 `/codex computer-use install`。Codex 應用程式伺服器安裝會將外掛設定寫回啟用狀態。

**狀態顯示不支援遠端安裝。** 使用本機市集來源或路徑。僅遠端的目錄項目可以被檢查，但無法透過目前的應用程式伺服器 API 安裝。

**狀態顯示 MCP 伺服器無法使用。** 重新執行一次安裝，讓 MCP 伺服器重新載入。如果仍然無法使用，請修正 Codex Computer Use 應用程式、Codex 應用程式伺服器 MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 逾時。** 外掛和 MCP 伺服器存在，但本機 Computer Use 橋接器沒有回應。結束或重新啟動 Codex Computer Use，必要時重新啟動 Codex Desktop，然後在新的 OpenClaw 工作階段中重試。如果主機先前透過較舊的受管理 Codex 應用程式伺服器執行 Computer Use，請從桌面隨附的市集重新整理已安裝的外掛：

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use 工具顯示 `Native hook relay unavailable`。** Codex 原生工具掛鉤無法透過本機橋接器或閘道後援連到作用中的 OpenClaw 中繼。使用 `/new` 或 `/reset` 啟動新的 OpenClaw 工作階段。如果它成功一次，但稍後的工具呼叫又失敗，`/new` 只是在清除目前嘗試；請重新啟動 Codex 應用程式伺服器或 OpenClaw 閘道，讓舊執行緒和掛鉤註冊被丟棄，然後在新的工作階段中重試。

**回合開始自動安裝拒絕來源。** 這是刻意設計。請先使用明確的 `/codex computer-use install --source
<marketplace-source>` 新增來源，之後的回合開始自動安裝就能使用已探索到的本機市集。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)
- [iOS app](/zh-TW/platforms/ios)
