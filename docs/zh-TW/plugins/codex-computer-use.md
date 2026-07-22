---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理使用 Codex 電腦操作功能
    - 你正在 Codex Computer Use、PeekabooBridge 與直接使用 cua-driver MCP 之間進行選擇
    - 你正在為內建的 Codex 外掛設定 computerUse
    - 你正在疑難排解 /codex 電腦操作狀態或安裝問題
summary: 為 Codex 模式的 OpenClaw 代理設定 Codex 電腦操作功能
title: Codex 電腦操作
x-i18n:
    generated_at: "2026-07-22T10:39:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 02836a6bc80bc1bd956db6cb9a7ed9be32d2192c8c95d372a4697dd24deeb2f3
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是 Codex 原生的 MCP 外掛，用於控制本機桌面。OpenClaw
不會內建桌面應用程式、不會自行執行桌面操作，也不會繞過
Codex 權限。隨附的 `codex` 外掛只會準備 Codex app-server：
啟用 Codex 外掛支援、尋找或安裝已設定的 Computer Use
外掛、檢查 `computer-use` MCP 伺服器是否可用，然後讓
Codex 在 Codex 模式的回合中負責原生 MCP 工具呼叫。

當 OpenClaw 已使用原生 Codex 執行框架時，請使用此頁面。若要瞭解
執行階段本身的設定，請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。

這與 OpenClaw 內建的[節點支援電腦工具](/zh-TW/nodes/computer-use)不同。若無論代理程式是在閘道或其他節點上執行，都應由同一份代理程式合約控制已配對的 Mac，請使用內建工具。若應由 Codex app-server 負責本機 MCP 安裝、權限及原生工具呼叫，請使用 Codex Computer Use。

## OpenClaw.app 與 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 分開運作。
macOS 應用程式可以託管 PeekabooBridge 通訊端，讓 `peekaboo` 命令列介面重複使用
應用程式在本機取得的「輔助使用」與「螢幕錄製」授權，以供 Peekaboo 自有的
自動化工具使用。該橋接器不會安裝或代理 Codex Computer Use，而
Codex Computer Use 也不會透過 PeekabooBridge 通訊端呼叫。

若要讓 OpenClaw.app 成為 Peekaboo 命令列介面自動化的
權限感知主機，請使用 [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)。若要讓
Codex 模式的 OpenClaw 代理程式在回合開始前即可使用 Codex 原生的 `computer-use` MCP 外掛，
請使用此頁面。

## iOS 應用程式

iOS 應用程式與 Codex Computer Use 分開運作。它不會安裝或代理
Codex `computer-use` MCP 伺服器，也不是桌面控制後端。
iOS 應用程式會改以 OpenClaw 節點的身分連線，並透過
`canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*` 等節點命令公開行動裝置功能。

若要讓代理程式透過閘道操控 iPhone 節點，請使用 [iOS](/zh-TW/platforms/ios)。
若要讓 Codex 模式的代理程式透過 Codex 原生的 Computer Use 外掛控制
本機 macOS 桌面，請使用此頁面。

## 直接使用 cua-driver MCP

Codex Computer Use 並不是公開桌面控制的唯一方式。如果你希望
由 OpenClaw 管理的執行階段直接呼叫 TryCua 的驅動程式，請透過 OpenClaw 的 MCP 登錄檔使用上游
`cua-driver mcp` 伺服器，而非
Codex 專用的市集流程。

安裝 `cua-driver` 後，可以要求它提供 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或直接登錄 stdio 伺服器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

此路徑會完整保留上游 MCP 工具介面，包括驅動程式
結構描述與結構化 MCP 回應。若要將 CUA 驅動程式當作一般 OpenClaw MCP 伺服器
使用，請採用此方式。若應由 Codex app-server 負責外掛安裝、MCP 重新載入，
以及 Codex 模式回合內的原生工具呼叫，請使用本頁面的 Codex Computer Use 設定。

CUA 驅動程式提供適用於 macOS、Windows（x64 與 ARM64），以及
Linux（x64 與 ARM64，預覽層級）的預發行版本。它仍需要其應用程式提示授予的
本機作業系統權限，例如 macOS 上的「輔助使用」與「螢幕錄製」。
OpenClaw 不會安裝 `cua-driver`、授予這些權限，或
繞過上游驅動程式的安全模型。

## 快速設定

若 Codex 模式的回合必須在討論串開始前即可使用
Computer Use，請設定 `plugins.entries.codex.config.computerUse`。`autoInstall: true` 會
選擇啟用 Computer Use，並允許 OpenClaw 在回合開始前安裝或重新啟用它：

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
回合開始前檢查 Codex app-server。如果缺少 Computer Use，但 Codex app-server 已探索到
可安裝的市集，OpenClaw 會要求 Codex app-server 安裝或
重新啟用外掛，並重新載入 MCP 伺服器。在 macOS 上，若尚未登錄相符的
市集但存在標準桌面應用程式套件，OpenClaw
也會嘗試從 `/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` 登錄隨附的 Codex 市集，
並保留 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
作為舊版獨立安裝的備援。如果設定完成後仍無法讓
MCP 伺服器可用，回合會在討論串開始前失敗。

變更 Computer Use 設定後，如果現有 Codex 討論串已經開始，請先在受影響的
聊天中使用 `/new` 或 `/reset`，再進行測試。

在 macOS 上，Computer Use 的受管理啟動會優先使用
`/Applications/ChatGPT.app/Contents/Resources/codex` 的桌面應用程式二進位檔，然後
針對舊版獨立安裝備援至 `/Applications/Codex.app/Contents/Resources/codex`。
這也適用於會自行啟動用戶端的一次性 Computer Use 狀態與
安裝命令。這可讓桌面控制持續由擁有本機 macOS 權限的
應用程式套件管理。如果未安裝桌面應用程式，OpenClaw 會改用安裝在
外掛旁的受管理 Codex 二進位檔。使用預設隔離代理程式主目錄的一般受管理 Codex 回合，會優先
使用該固定版本的套件，避免較舊的桌面應用程式遮蔽目前的模型
支援。使用者範圍的主目錄仍會優先使用桌面應用程式，因為它們可以載入原生
Computer Use 狀態。有效 Codex 設定已啟用
Computer Use 的隔離代理程式主目錄，也會繼續優先使用桌面應用程式。明確的
`appServer.command` 設定或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍會覆寫
此受管理選擇。

OpenClaw 會在單一執行中的閘道內，依序執行原生 Codex 設定讀取與 Computer Use 安裝。
另一個 Codex 程序或其他閘道不在此互斥範圍內。在閘道外部變更原生 Codex 外掛設定後，
請重新啟動閘道並開始新的聊天，再依賴新的
選擇結果。

## 命令

請從任何可使用 `codex` 外掛命令介面的聊天介面，
使用 `/codex computer-use` 命令。這些是 OpenClaw 聊天／執行階段
命令，而不是 `openclaw codex ...` 命令列介面子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是預設動作且為唯讀：它不會新增市集
來源、安裝外掛，或啟用 Codex 外掛支援。如果沒有設定選擇啟用
Computer Use，即使執行過一次性安裝命令，`status` 仍可能回報為停用。

`install` 會啟用 Codex app-server 外掛支援、選擇性新增
已設定的市集來源、透過 Codex app-server 安裝或重新啟用已設定的外掛、
重新載入 MCP 伺服器，並確認 MCP
伺服器有公開工具。由於安裝會變更受信任的主機資源，
只有擁有者或 `operator.admin` 閘道用戶端可以執行 `install`。其他
已授權的傳送者仍可繼續使用唯讀的 `status` 命令，
包括搭配覆寫值使用。

舊版接受一次性的 `--plugin`、`--server` 和 `--mcp-server`
身分覆寫。請改為持續設定 `computerUse.pluginName` 和
`computerUse.mcpServerName`。使用舊版身分旗標時，
命令會指出要持續儲存的確切設定，並在其遷移指引中重述
所要求的動作及任何受支援的市集旗標。

## 市集選項

OpenClaw 使用 Codex 本身所公開的同一套 app-server API。
市集欄位會選擇 Codex 應從何處尋找 `computer-use`。

| 欄位                 | 適用情境                                                        | 安裝支援                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 無市集欄位           | 你希望 Codex app-server 使用它已知的市集。                      | 是，前提是 app-server 傳回本機市集。                     |
| `marketplaceSource`  | 你有 Codex app-server 可新增的市集來源。                         | 是，適用於明確的 `/codex computer-use install`。         |
| `marketplacePath`    | 你已知道主機上的本機市集檔案路徑。                              | 是，適用於明確安裝及回合開始時的自動安裝。               |
| `marketplaceName`    | 你想依名稱選擇一個已登錄的市集。                                | 僅當所選市集具有本機路徑時才支援。                       |

新的 Codex 主目錄可能需要一小段時間來植入官方
市集。安裝期間，OpenClaw 最多會輪詢 `plugin/list`
`marketplaceDiscoveryTimeoutMs` 毫秒（預設 60 秒）。

如果多個已知市集包含 Computer Use，OpenClaw 會依序優先選擇
`openai-bundled`、`openai-curated`，再來是 `local`。若出現未知且有歧義的
相符項目，系統會採取失敗關閉，並要求你設定 `marketplaceName` 或
`marketplacePath`。

## 隨附的 macOS 市集

目前的 ChatGPT 桌面版會在此位置隨附 Computer Use；舊版獨立
Codex 桌面版則在 `Codex.app` 下使用相同版面配置：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true 且尚未登錄任何包含
`computer-use` 的市集時，OpenClaw 會嘗試新增第一個存在的標準
隨附市集根目錄：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以使用 Codex 從殼層明確登錄：

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非標準的 Codex 應用程式路徑，請執行一次 `/codex computer-use install
--source <marketplace-root>`，或將 `computerUse.marketplacePath` 設為
本機市集檔案路徑。只有在你擁有市集 JSON 檔案路徑時，才能使用 `--marketplace-path`，
而不能使用隨附的市集根目錄。

### 共用外掛快取

預設的 `pluginCacheMode: "independent"` 會讓每個 Codex 主目錄及其
外掛快取維持不受管理。設定 `pluginCacheMode: "shared"`，可在 app-server 啟動前將隨附的
Computer Use 外掛複製到作用中 Codex 主目錄內可探索的外掛快取。
共用模式會保留較舊的快取版本，因為執行中的 Codex 用戶端可能仍參照其版本化外掛目錄；
替換複製失敗時也會保留作用中的快取。明確設定
`marketplaceName` 或 `marketplacePath` 會停用此
調節作業，讓 OpenClaw 不會覆寫該選擇。

## 遠端目錄限制

Codex app-server 可以列出及讀取僅限遠端的目錄項目，但目前
不支援遠端 `plugin/install`。這表示 `marketplaceName`
可以選擇僅限遠端的市集來進行狀態檢查，但安裝和
重新啟用仍需透過 `marketplaceSource` 或
`marketplacePath` 使用本機市集。

如果狀態顯示外掛可在遠端 Codex 市集中取得，但
不支援遠端安裝，請使用本機來源或路徑執行安裝：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定參考

| 欄位                            | 預設值         | 意義                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推斷           | 要求使用電腦。設定其他使用電腦欄位時，預設為 true。 |
| `autoInstall`                   | false          | 每回合開始時，從已探索到的市集安裝或重新啟用。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安裝等待 Codex app-server 探索市集的時間。             |
| `liveTestTimeoutMs`             | 60000          | 暫時就緒執行緒及其清理要求的逾時時間。                |
| `toolCallTimeoutMs`             | 60000          | 使用電腦 `list_apps` 就緒工具呼叫的逾時時間。                  |
| `healthCheckEnabled`            | false          | 所屬的 app-server 用戶端作用期間，定期執行就緒探測。    |
| `healthCheckIntervalMinutes`    | 60             | 探測頻率；接受的值為 30、60、120 或 240 分鐘。                |
| `pluginCacheMode`               | `independent`  | 使用 `shared`，從隨附的桌面外掛重新整理 Codex 主目錄快取。  |
| `strictReadiness`               | false          | 即時探測失敗時停止啟動，而非顯示警告後繼續。      |
| `autoRepair`                    | false          | 終止限定範圍內過時的使用電腦 MCP 子程序，並重試一次失敗的探測。     |
| `marketplaceSource`             | 未設定          | 傳遞給 Codex app-server `marketplace/add` 的來源字串。                    |
| `marketplacePath`               | 未設定          | 包含該外掛的本機 Codex 市集檔案路徑。                       |
| `marketplaceName`               | 未設定          | 要選取的已註冊 Codex 市集名稱。                                   |
| `pluginName`                    | `computer-use` | Codex 市集外掛名稱。                                                 |
| `mcpServerName`                 | `computer-use` | 已安裝外掛公開的 MCP 伺服器名稱。                               |

回合開始時的自動安裝會刻意拒絕已設定的 `marketplaceSource`
值。新增來源是明確的設定操作，因此請執行一次
`/codex computer-use install --source <marketplace-source>`，之後讓
`autoInstall` 處理從已探索到的本機市集重新啟用。
回合開始時的自動安裝可以使用已設定的 `marketplacePath`，因為該值
已是主機上的本機路徑。

每個欄位也接受環境變數覆寫，並會在相符的
設定鍵未設定時檢查：

| 欄位                            | 環境變數                                                        |
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

## OpenClaw 檢查的項目

OpenClaw 會在內部回報穩定的設定原因，並為聊天內容格式化
面向使用者的狀態：

| 原因                         | 意義                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。               | 設定 `enabled` 或其他使用電腦欄位。  |
| `marketplace_missing`        | 沒有可用的相符市集。                                   | 設定來源、路徑或市集名稱。                    |
| `plugin_not_installed`       | 市集存在，但外掛尚未安裝。                             | 執行安裝或啟用 `autoInstall`。          |
| `plugin_disabled`            | 外掛已安裝，但在 Codex 設定中停用。                    | 執行安裝以重新啟用。                          |
| `remote_install_unsupported` | 選取的市集僅支援遠端。                                 | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 外掛已啟用，但 MCP 伺服器無法使用。                    | 檢查 Codex 使用電腦與作業系統權限。          |
| `ready`                      | 外掛和 MCP 工具皆可使用。                              | 開始 Codex 模式回合。                         |
| `check_failed`               | 狀態檢查期間 Codex app-server 要求失敗。               | 檢查 app-server 連線與記錄。                  |
| `auto_install_blocked`       | 回合開始設定需要新增來源。                             | 先執行明確安裝。                              |

聊天輸出會包含外掛狀態、MCP 伺服器狀態、市集、
可用時的工具，以及設定步驟失敗的具體訊息。

## macOS 權限

這個由 Codex 擁有的使用電腦路徑在 macOS 上執行，MCP 伺服器可能需要
本機作業系統權限，才能檢查或控制應用程式。（若要在 Windows 和 Linux 節點主機上
進行跨平台桌面控制，請參閱
[cua-computer 執行器](/zh-TW/nodes/computer-use#windows-and-linux-experimental-via-cua-driver)。）
如果 OpenClaw 表示使用電腦已安裝，但 MCP 伺服器無法使用，
請先確認 Codex 端的使用電腦設定：

- Codex app-server 正在應執行桌面控制的同一部主機上執行。
- 使用電腦外掛已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器出現在 Codex app-server MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前的主機工作階段可以存取受控桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意採取失敗關閉。若設定
要求使用原生桌面工具，Codex 模式回合就不應在缺少這些工具時
無提示地繼續。

## 疑難排解

**狀態顯示尚未安裝。** 執行 `/codex computer-use install`。如果
尚未探索到市集，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但已停用。** 再次執行 `/codex computer-use install`。
Codex app-server 安裝會將外掛設定寫回啟用狀態。

**狀態顯示不支援遠端安裝。** 使用本機市集
來源或路徑。可以檢查僅限遠端的目錄項目，但無法
透過目前的 app-server API 安裝。

**狀態顯示 MCP 伺服器無法使用。** 重新執行一次安裝，讓 MCP
伺服器重新載入。如果仍無法使用，請修正 Codex 使用電腦應用程式、
Codex app-server MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 上逾時。** 外掛和
MCP 伺服器皆存在，但本機使用電腦橋接器沒有回應。
結束或重新啟動 Codex 使用電腦，必要時重新啟動 Codex Desktop，然後
在新的 OpenClaw 工作階段中重試。如果主機先前透過
較舊的受管理 Codex app-server 執行使用電腦，請從
桌面隨附的市集重新整理已安裝的外掛（獨立
Codex 桌面版安裝請使用 `Codex.app` 路徑）：

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**使用電腦工具顯示 `Native hook relay unavailable`。**
Codex 原生工具掛鉤無法透過本機橋接器或閘道備援
連線至作用中的 OpenClaw 轉送器。請使用 `/new`
或 `/reset` 啟動新的 OpenClaw 工作階段。如果首次可正常運作，但之後的工具呼叫又失敗，
`/new` 只會清除目前的嘗試；請重新啟動 Codex app-server 或
OpenClaw 閘道，以捨棄舊執行緒與掛鉤註冊，然後
在新的工作階段中重試。

**回合開始時的自動安裝拒絕來源。** 這是刻意設計。請先使用明確的
`/codex computer-use install --source
<marketplace-source>` 新增來源，之後回合開始時的自動安裝就能使用
已探索到的本機市集。

## 相關內容

- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)
- [iOS 應用程式](/zh-TW/platforms/ios)
