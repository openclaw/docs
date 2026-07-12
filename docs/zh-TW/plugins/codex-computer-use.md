---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用 Codex 電腦操作功能
    - 你正在 Codex Computer Use、PeekabooBridge 與直接使用 cua-driver MCP 之間做選擇
    - 你正在為隨附的 Codex 外掛設定 computerUse
    - 你正在疑難排解 /codex 電腦操作狀態或安裝問題
summary: 為 Codex 模式的 OpenClaw 代理程式設定 Codex 電腦操作功能
title: Codex 電腦操作
x-i18n:
    generated_at: "2026-07-11T21:32:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是用於本機桌面控制的 Codex 原生 MCP 外掛。OpenClaw
不會內建桌面應用程式、不會自行執行桌面操作，也不會繞過
Codex 權限。隨附的 `codex` 外掛只會準備 Codex app-server：
啟用 Codex 外掛支援、尋找或安裝已設定的 Computer Use
外掛、檢查 `computer-use` MCP 伺服器是否可用，然後在 Codex 模式的回合中
讓 Codex 負責原生 MCP 工具呼叫。

當 OpenClaw 已使用原生 Codex 執行框架時，請使用本頁。若要瞭解
執行階段本身的設定，請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。

這與 OpenClaw 內建的[節點支援電腦工具](/zh-TW/nodes/computer-use)不同。當相同的代理契約需要控制已配對的 Mac，無論代理是在閘道或其他節點上執行時，請使用內建工具。當 Codex app-server 應負責本機 MCP 安裝、權限與原生工具呼叫時，請使用 Codex Computer Use。

## OpenClaw.app 與 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 分開運作。
macOS 應用程式可託管 PeekabooBridge 通訊端，讓 `peekaboo` 命令列介面重複使用
應用程式的本機「輔助使用」與「螢幕錄製」授權，以供 Peekaboo 自己的
自動化工具使用。該橋接器不會安裝或代理 Codex Computer Use，而
Codex Computer Use 也不會透過 PeekabooBridge 通訊端進行呼叫。

當您希望 OpenClaw.app 成為具權限感知能力的 Peekaboo 命令列介面自動化
主機時，請使用 [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)。當
Codex 模式的 OpenClaw 代理應在回合開始前使用 Codex 原生的 `computer-use` MCP 外掛
時，請使用本頁。

## iOS 應用程式

iOS 應用程式與 Codex Computer Use 分開運作。它不會安裝或代理
Codex `computer-use` MCP 伺服器，也不是桌面控制後端。
相反地，iOS 應用程式會作為 OpenClaw 節點連線，並透過
`canvas.*`、`camera.*`、`screen.*`、
`location.*` 與 `talk.*` 等節點命令公開行動裝置功能。

當您希望代理透過閘道驅動 iPhone 節點時，請使用 [iOS](/zh-TW/platforms/ios)。
當 Codex 模式代理應透過 Codex 原生 Computer Use 外掛控制
本機 macOS 桌面時，請使用本頁。

## 直接使用 cua-driver MCP

Codex Computer Use 並非公開桌面控制功能的唯一方式。如果您希望
由 OpenClaw 管理的執行階段直接呼叫 TryCua 的驅動程式，請透過 OpenClaw 的 MCP 登錄檔使用上游
`cua-driver mcp` 伺服器，而非
Codex 專用的市集流程。

安裝 `cua-driver` 後，可以要求它提供 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或直接註冊 stdio 伺服器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

此路徑會保持上游 MCP 工具介面不變，包括驅動程式
結構描述與結構化 MCP 回應。當您希望 CUA 驅動程式
可作為一般 OpenClaw MCP 伺服器使用時，請採用此方式。當 Codex app-server 應在 Codex 模式回合內負責外掛安裝、MCP 重新載入
與原生工具呼叫時，請使用本頁的 Codex Computer Use 設定。

CUA 的驅動程式僅適用於 macOS，且仍需要其應用程式提示授予的
本機 macOS 權限，例如「輔助使用」與「螢幕錄製」。OpenClaw 不會
安裝 `cua-driver`、授予這些權限，或繞過上游
驅動程式的安全模型。

## 快速設定

當 Codex 模式回合必須在對話串開始前使用 Computer Use 時，請設定 `plugins.entries.codex.config.computerUse`。
`autoInstall: true` 會選擇啟用 Computer Use，並讓 OpenClaw 在回合前安裝或重新啟用它：

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

使用此設定時，OpenClaw 會在每個 Codex 模式
回合前檢查 Codex app-server。如果缺少 Computer Use，但 Codex app-server 已發現
可安裝的市集，OpenClaw 會要求 Codex app-server 安裝或
重新啟用該外掛，並重新載入 MCP 伺服器。在 macOS 上，若未註冊相符的
市集且存在標準桌面應用程式套件，OpenClaw
也會嘗試從
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` 註冊隨附的 Codex 市集，
並保留
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
作為舊版獨立安裝的備援。如果設定後仍無法讓
MCP 伺服器可用，回合會在對話串開始前失敗。

變更 Computer Use 設定後，如果現有 Codex 對話串已開始，
請先在受影響的聊天中使用 `/new` 或 `/reset`，再進行測試。

在 macOS 上，Computer Use 的受管理啟動會優先使用
`/Applications/ChatGPT.app/Contents/Resources/codex` 的桌面應用程式二進位檔，
然後針對舊版獨立安裝
退回使用 `/Applications/Codex.app/Contents/Resources/codex`。
這也適用於會啟動自身用戶端的一次性 Computer Use 狀態與
安裝命令。這能讓桌面控制維持在
擁有本機 macOS 權限的應用程式套件下。如果未安裝桌面應用程式，
OpenClaw 會退回使用安裝於外掛旁的受管理 Codex 二進位檔。
使用預設隔離代理主目錄的一般受管理 Codex 回合會優先使用
該固定版本套件，避免較舊的桌面應用程式遮蔽目前的模型
支援。使用者範圍的主目錄仍會優先使用桌面應用程式，因為它們可以載入原生
Computer Use 狀態。有效 Codex 設定已啟用
Computer Use 的隔離代理主目錄也會繼續優先使用桌面應用程式。明確的
`appServer.command` 設定或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍會覆寫
此受管理選擇。

OpenClaw 會在單一執行中的閘道內，將原生 Codex 設定讀取與 Computer Use 安裝
依序執行。獨立的 Codex 處理程序或另一個閘道不在
此互斥範圍內。在閘道外變更原生 Codex 外掛設定後，
請重新啟動閘道並開始新的聊天，再依賴新的
選擇結果。

## 命令

可從任何提供 `codex` 外掛命令介面的聊天介面使用
`/codex computer-use` 命令。這些是 OpenClaw 聊天／執行階段
命令，而不是 `openclaw codex ...` 命令列介面子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是預設操作且為唯讀：它不會新增市集
來源、安裝外掛，或啟用 Codex 外掛支援。如果沒有任何設定選擇啟用
Computer Use，即使執行過一次性安裝
命令，`status` 仍可能回報停用。

`install` 會啟用 Codex app-server 外掛支援、選擇性新增
已設定的市集來源、透過 Codex app-server 安裝或重新啟用已設定的外掛、
重新載入 MCP 伺服器，並驗證 MCP
伺服器是否公開工具。由於安裝會變更受信任的主機資源，
只有擁有者或 `operator.admin` 閘道用戶端可以執行 `install`。其他
已授權的傳送者仍可繼續使用唯讀的 `status` 命令，
包括搭配覆寫選項使用。

較舊版本接受一次性的 `--plugin`、`--server` 與 `--mcp-server`
身分覆寫。請改為持續設定 `computerUse.pluginName` 與
`computerUse.mcpServerName`。使用舊版身分旗標時，
命令會指出需要持續儲存的確切設定，並在移轉指引中重複列出
所要求的操作及任何受支援的市集旗標。

## 市集選項

OpenClaw 使用 Codex 本身公開的相同 app-server API。
市集欄位會選擇 Codex 應從何處尋找 `computer-use`。

| 欄位                 | 適用情況                                                        | 安裝支援                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 無市集欄位           | 您希望 Codex app-server 使用它已知的市集。                      | 是，當 app-server 傳回本機市集時。                       |
| `marketplaceSource`  | 您有可由 app-server 新增的 Codex 市集來源。                     | 是，適用於明確執行的 `/codex computer-use install`。     |
| `marketplacePath`    | 您已知道主機上的本機市集檔案路徑。                              | 是，適用於明確安裝與回合開始時的自動安裝。               |
| `marketplaceName`    | 您希望依名稱選取已註冊的市集。                                  | 僅當所選市集具有本機路徑時支援。                         |

全新的 Codex 主目錄可能需要一點時間來初始化其官方
市集。安裝期間，OpenClaw 會輪詢 `plugin/list`，最長持續
`marketplaceDiscoveryTimeoutMs` 毫秒（預設為 60 秒）。

如果多個已知市集包含 Computer Use，OpenClaw 會依序優先選擇
`openai-bundled`、`openai-curated`，最後是 `local`。未知且有歧義的
相符項目會採取封閉式失敗，並要求您設定 `marketplaceName` 或
`marketplacePath`。

## 隨附的 macOS 市集

目前的 ChatGPT 桌面版會在此處隨附 Computer Use；舊版獨立
Codex 桌面版則在 `Codex.app` 下使用相同的配置：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true，且未註冊任何包含
`computer-use` 的市集時，OpenClaw 會嘗試新增第一個存在的標準
隨附市集根目錄：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

您也可以從殼層使用 Codex 明確註冊：

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

如果您使用非標準的 Codex 應用程式路徑，請執行一次 `/codex computer-use install
--source <marketplace-root>`，或將 `computerUse.marketplacePath` 設為
本機市集檔案路徑。只有在您持有
市集 JSON 檔案路徑時才使用 `--marketplace-path`，不要傳入隨附市集根目錄。

### 共用外掛快取

預設的 `pluginCacheMode: "independent"` 會讓每個 Codex 主目錄及其
外掛快取不受管理。設定 `pluginCacheMode: "shared"`，可在 app-server 啟動前將隨附的
Computer Use 外掛複製到使用中 Codex 主目錄可探索的外掛快取。
共用模式會保留較舊的快取版本，因為
執行中的 Codex 用戶端仍可能參照其帶版本號的外掛目錄；若
替換複製失敗，也會保留使用中的快取。明確設定
`marketplaceName` 或 `marketplacePath` 會停用此
調整流程，避免 OpenClaw 覆寫該選擇。

## 遠端目錄限制

Codex app-server 可以列出並讀取僅限遠端的目錄項目，但目前
不支援遠端 `plugin/install`。這表示 `marketplaceName`
可以選取僅限遠端的市集進行狀態檢查，但安裝與
重新啟用仍需透過 `marketplaceSource` 或
`marketplacePath` 使用本機市集。

如果狀態指出該外掛可在遠端 Codex 市集中取得，但
不支援遠端安裝，請使用本機來源或路徑執行安裝：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定參考

| 欄位                            | 預設值         | 說明                                                                         |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推斷           | 要求使用電腦操作。設定其他任何電腦操作欄位時，預設為 true。                   |
| `autoInstall`                   | false          | 每次對話輪次開始時，從已探索到的市集安裝或重新啟用。                           |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安裝等待 Codex app-server 探索市集的時間。                                     |
| `liveTestTimeoutMs`             | 60000          | 暫時就緒執行緒及其清理請求的逾時時間。                                         |
| `toolCallTimeoutMs`             | 60000          | 電腦操作 `list_apps` 就緒工具呼叫的逾時時間。                                  |
| `healthCheckEnabled`            | false          | 當所屬的 app-server 用戶端處於作用中時，定期執行就緒探測。                      |
| `healthCheckIntervalMinutes`    | 60             | 探測頻率；可接受的值為 30、60、120 或 240 分鐘。                               |
| `pluginCacheMode`               | `independent`  | 使用 `shared` 從隨附的桌面外掛重新整理 Codex 主目錄快取。                       |
| `strictReadiness`               | false          | 即時探測失敗時停止啟動，而非發出警告後繼續。                                   |
| `autoRepair`                    | false          | 終止範圍內已失效的電腦操作 MCP 子程序，並重試失敗的探測一次。                   |
| `marketplaceSource`             | 未設定         | 傳遞給 Codex app-server `marketplace/add` 的來源字串。                          |
| `marketplacePath`               | 未設定         | 包含該外掛的本機 Codex 市集檔案路徑。                                          |
| `marketplaceName`               | 未設定         | 要選取的已註冊 Codex 市集名稱。                                                 |
| `pluginName`                    | `computer-use` | Codex 市集外掛名稱。                                                           |
| `mcpServerName`                 | `computer-use` | 已安裝外掛公開的 MCP 伺服器名稱。                                              |

對話輪次開始時的自動安裝會刻意拒絕已設定的 `marketplaceSource`
值。新增來源是明確的設定操作，因此請先執行一次
`/codex computer-use install --source <marketplace-source>`，之後再讓
`autoInstall` 從已探索到的本機市集處理重新啟用。對話輪次開始時的自動安裝
可以使用已設定的 `marketplacePath`，因為它已是主機上的本機路徑。

每個欄位也接受環境變數覆寫；當對應的設定鍵未設定時會檢查該環境變數：

| 欄位                            | 環境變數                                                       |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw 會檢查什麼

OpenClaw 會在內部回報穩定的設定原因，並為聊天格式化
面向使用者的狀態：

| 原因                         | 說明                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。                   | 設定 `enabled` 或其他電腦操作欄位。           |
| `marketplace_missing`        | 沒有可用的相符市集。                                   | 設定來源、路徑或市集名稱。                    |
| `plugin_not_installed`       | 市集存在，但未安裝外掛。                               | 執行安裝或啟用 `autoInstall`。                |
| `plugin_disabled`            | 外掛已安裝，但在 Codex 設定中停用。                    | 執行安裝以重新啟用。                          |
| `remote_install_unsupported` | 選取的市集僅限遠端。                                   | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 外掛已啟用，但 MCP 伺服器無法使用。                    | 檢查 Codex 電腦操作與作業系統權限。           |
| `ready`                      | 外掛與 MCP 工具皆可使用。                              | 開始 Codex 模式的對話輪次。                   |
| `check_failed`               | 狀態檢查期間 Codex app-server 請求失敗。               | 檢查 app-server 連線與日誌。                  |
| `auto_install_blocked`       | 對話輪次開始時的設定需要新增來源。                     | 先執行明確安裝。                              |

聊天輸出包含外掛狀態、MCP 伺服器狀態、市集、可用時的工具，
以及設定失敗步驟的特定訊息。

## macOS 權限

電腦操作僅適用於 macOS。Codex 所擁有的 MCP 伺服器在檢查或控制應用程式前，
可能需要本機作業系統權限。如果 OpenClaw 表示電腦操作已安裝，但 MCP
伺服器無法使用，請先確認 Codex 端的電腦操作設定：

- Codex app-server 正在應進行桌面控制的同一台主機上執行。
- 電腦操作外掛已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器出現在 Codex app-server MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前的主機工作階段可以存取受控制的桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意採取失敗即關閉策略。
若缺少設定所要求的原生桌面工具，Codex 模式的對話輪次不應在未提示的情況下繼續。

## 疑難排解

**狀態顯示尚未安裝。** 執行 `/codex computer-use install`。如果未探索到
市集，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但已停用。** 再次執行 `/codex computer-use install`。
Codex app-server 安裝會將外掛設定寫回啟用狀態。

**狀態顯示不支援遠端安裝。** 使用本機市集來源或路徑。僅限遠端的目錄項目
可供檢查，但無法透過目前的 app-server API 安裝。

**狀態顯示 MCP 伺服器無法使用。** 重新執行一次安裝，使 MCP
伺服器重新載入。如果仍無法使用，請修正 Codex 電腦操作應用程式、
Codex app-server MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 上逾時。** 外掛與 MCP
伺服器皆已存在，但本機電腦操作橋接器沒有回應。結束或重新啟動 Codex
電腦操作，並視需要重新啟動 Codex Desktop，然後在新的 OpenClaw
工作階段中重試。如果主機先前透過較舊的受管理 Codex app-server 執行
電腦操作，請從桌面應用程式隨附的市集重新整理已安裝的外掛（獨立 Codex
桌面安裝請使用 `Codex.app` 路徑）：

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**電腦操作工具顯示 `Native hook relay unavailable`。** Codex 原生工具掛鉤
無法透過本機橋接器或閘道後援連線至作用中的 OpenClaw 中繼。請使用 `/new`
或 `/reset` 啟動新的 OpenClaw 工作階段。如果它成功一次，但後續工具呼叫
又再次失敗，`/new` 只會清除目前這次嘗試；請重新啟動 Codex app-server
或 OpenClaw 閘道，使舊執行緒與掛鉤註冊被移除，然後在新的工作階段中重試。

**對話輪次開始時的自動安裝拒絕某個來源。** 這是刻意設計。請先使用明確的
`/codex computer-use install --source <marketplace-source>` 新增來源，
之後對話輪次開始時的自動安裝即可使用已探索到的本機市集。

## 相關內容

- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)
- [iOS 應用程式](/zh-TW/platforms/ios)
