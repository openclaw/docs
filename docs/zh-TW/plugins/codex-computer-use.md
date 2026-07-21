---
read_when:
    - 你希望 Codex 模式的 OpenClaw 代理程式使用 Codex 電腦操作功能
    - 你正在 Codex Computer Use、PeekabooBridge 與直接使用 cua-driver MCP 之間做選擇
    - 你正在為內建的 Codex 外掛設定 computerUse
    - 你正在疑難排解 `/codex` 電腦操作狀態或安裝問題
summary: 為 Codex 模式的 OpenClaw 代理程式設定 Codex 電腦操作功能
title: Codex 電腦操作
x-i18n:
    generated_at: "2026-07-21T09:00:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 268fc5659f776eff4cfb9bec8a95cd7ab5c6cbdf13793914409444da72f9e98e
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是 Codex 原生的 MCP 外掛，用於控制本機桌面。OpenClaw
不會內建桌面應用程式、不會自行執行桌面操作，也不會繞過
Codex 權限。隨附的 `codex` 外掛只會準備 Codex app-server：
它會啟用 Codex 外掛支援、尋找或安裝已設定的 Computer Use
外掛、檢查 `computer-use` MCP 伺服器是否可用，然後在 Codex 模式回合期間
讓 Codex 負責原生 MCP 工具呼叫。

當 OpenClaw 已使用原生 Codex 控制框架時，請使用本頁。如需
執行階段本身的設定，請參閱 [Codex 控制框架](/zh-TW/plugins/codex-harness)。

這與 OpenClaw 內建的[節點支援電腦工具](/zh-TW/nodes/computer-use)不同。如果無論代理程式是在閘道還是其他節點上執行，都應由同一份代理程式合約控制已配對的 Mac，請使用內建工具。如果應由 Codex app-server 負責本機 MCP 安裝、權限和原生工具呼叫，請使用 Codex Computer Use。

## OpenClaw.app 與 Peekaboo

OpenClaw.app 的 Peekaboo 整合與 Codex Computer Use 分開運作。
macOS 應用程式可以託管 PeekabooBridge 通訊端，讓 `peekaboo` 命令列介面重複使用
應用程式的本機「輔助使用」和「螢幕錄製」授權，以供 Peekaboo 自己的
自動化工具使用。該橋接器不會安裝或代理 Codex Computer Use，而
Codex Computer Use 也不會透過 PeekabooBridge 通訊端呼叫。

如果你希望 OpenClaw.app 成為可感知權限的 Peekaboo 命令列介面自動化主機，
請使用 [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)。如果 Codex 模式的
OpenClaw 代理程式應在回合開始前即可使用 Codex 的原生 `computer-use` MCP 外掛，
請使用本頁。

## iOS 應用程式

iOS 應用程式與 Codex Computer Use 分開運作。它不會安裝或代理
Codex `computer-use` MCP 伺服器，也不是桌面控制後端。
iOS 應用程式會改以 OpenClaw 節點身分連線，並透過 `canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*` 等節點命令公開行動裝置
功能。

如果你希望代理程式透過閘道操控 iPhone 節點，請使用 [iOS](/zh-TW/platforms/ios)。
如果 Codex 模式代理程式應透過 Codex 的原生 Computer Use 外掛控制
本機 macOS 桌面，請使用本頁。

## 直接使用 cua-driver MCP

Codex Computer Use 並非公開桌面控制的唯一方式。如果你希望
由 OpenClaw 管理的執行階段直接呼叫 TryCua 的驅動程式，請透過 OpenClaw 的
MCP 登錄檔使用上游 `cua-driver mcp` 伺服器，而不要使用
Codex 專用市集流程。

安裝 `cua-driver` 後，請讓它提供 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或直接註冊 stdio 伺服器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

此路徑會完整保留上游 MCP 工具介面，包括驅動程式
結構描述和結構化 MCP 回應。如果你希望將 CUA 驅動程式
用作一般 OpenClaw MCP 伺服器，請使用此方式。如果應由 Codex app-server 負責
外掛安裝、MCP 重新載入，以及 Codex 模式回合內的原生工具呼叫，
請使用本頁的 Codex Computer Use 設定。

CUA 的驅動程式為 macOS、Windows（x64 和 ARM64）以及
Linux（x64 和 ARM64，預覽層級）提供預發行版本。它仍需要應用程式提示授予的
本機作業系統權限，例如 macOS 上的「輔助使用」和「螢幕錄製」。
OpenClaw 不會安裝 `cua-driver`、授予這些權限，也不會
繞過上游驅動程式的安全模型。

## 快速設定

當 Codex 模式回合必須在討論串開始前即可使用
Computer Use 時，請設定 `plugins.entries.codex.config.computerUse`。`autoInstall: true` 會選用
Computer Use，並允許 OpenClaw 在回合前安裝或重新啟用它：

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
回合前檢查 Codex app-server。如果缺少 Computer Use，但 Codex app-server 已探索到
可安裝的市集，OpenClaw 會要求 Codex app-server 安裝或
重新啟用外掛，並重新載入 MCP 伺服器。在 macOS 上，若未註冊相符的
市集且存在標準桌面應用程式套件，OpenClaw
也會嘗試從 `/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` 註冊隨附的 Codex 市集，並保留
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
作為舊版獨立安裝的後援。如果設定後仍無法讓
MCP 伺服器可用，回合會在討論串開始前失敗。

變更 Computer Use 設定後，如果現有 Codex 討論串已開始，請先在受影響的
聊天中使用 `/new` 或 `/reset`，再進行測試。

在 macOS 上，Computer Use 的受管理啟動會優先使用
`/Applications/ChatGPT.app/Contents/Resources/codex` 的桌面應用程式二進位檔，然後
後援至 `/Applications/Codex.app/Contents/Resources/codex`，以支援舊版
獨立安裝。這也適用於會啟動自有用戶端的一次性 Computer Use 狀態和
安裝命令。這會讓桌面控制維持在擁有本機 macOS 權限的
應用程式套件之下。如果未安裝桌面應用程式，OpenClaw 會後援至安裝在
外掛旁的受管理 Codex 二進位檔。使用預設隔離代理程式主目錄的一般受管理 Codex 回合會優先
使用該固定套件，避免舊版桌面應用程式遮蔽目前的模型
支援。使用者範圍的主目錄仍優先使用桌面應用程式，因為它們可以載入原生
Computer Use 狀態。若隔離代理程式主目錄的有效 Codex 設定啟用了
Computer Use，也會繼續優先使用桌面應用程式。明確的
`appServer.command` 設定或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍會覆寫
此受管理選擇。

OpenClaw 會在同一個執行中的閘道內，依序處理原生 Codex 設定讀取和 Computer Use 安裝。
另一個 Codex 程序或另一個閘道不在此互斥範圍內。在
閘道之外變更原生 Codex 外掛設定後，請重新啟動閘道並開始新的聊天，
再依賴新的選擇。

## 命令

請從任何提供 `codex` 外掛命令介面的聊天表面使用
`/codex computer-use` 命令。這些是 OpenClaw 聊天／執行階段
命令，不是 `openclaw codex ...` 命令列介面子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是預設且唯讀的動作：它不會新增市集
來源、不會安裝外掛，也不會啟用 Codex 外掛支援。如果沒有任何設定選用
Computer Use，即使執行過一次性安裝命令，`status` 仍可能回報為停用。

`install` 會啟用 Codex app-server 外掛支援、選擇性新增
已設定的市集來源、透過 Codex app-server 安裝或重新啟用已設定的外掛、
重新載入 MCP 伺服器，並確認 MCP
伺服器有公開工具。由於安裝會變更受信任的主機資源，
只有擁有者或 `operator.admin` 閘道用戶端可以執行 `install`。其他
已授權傳送者仍可繼續使用唯讀的 `status` 命令，
包括搭配覆寫值使用。

較舊版本接受一次性的 `--plugin`、`--server` 和 `--mcp-server`
身分覆寫。請改為持續設定 `computerUse.pluginName` 和
`computerUse.mcpServerName`。使用舊版身分旗標時，
命令會指出需要保存的確切設定，並在移轉指引中重述
要求的動作及任何受支援的市集旗標。

## 市集選項

OpenClaw 使用 Codex 本身公開的相同 app-server API。
市集欄位會選擇 Codex 應從何處尋找 `computer-use`。

| 欄位                 | 適用情況                                                        | 安裝支援                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 無市集欄位           | 你希望 Codex app-server 使用它已知的市集。                      | 是，當 app-server 傳回本機市集時。                       |
| `marketplaceSource`  | 你有一個 app-server 可以新增的 Codex 市集來源。                 | 是，適用於明確的 `/codex computer-use install`。         |
| `marketplacePath`    | 你已知道主機上的本機市集檔案路徑。                              | 是，支援明確安裝和回合開始時自動安裝。                   |
| `marketplaceName`    | 你希望依名稱選取已註冊的市集。                                  | 僅當所選市集具有本機路徑時才支援。                       |

全新的 Codex 主目錄可能需要短暫等待，才能植入官方
市集。安裝期間，OpenClaw 會輪詢 `plugin/list`，最長
`marketplaceDiscoveryTimeoutMs` 毫秒（預設 60 秒）。

如果多個已知市集包含 Computer Use，OpenClaw 會依序優先選擇
`openai-bundled`、`openai-curated`，然後是 `local`。未知且無法判定的
相符項目會以失敗關閉，並要求你設定 `marketplaceName` 或
`marketplacePath`。

## 隨附的 macOS 市集

目前的 ChatGPT 桌面版組建會將 Computer Use 隨附於此；舊版獨立
Codex 桌面版組建則在 `Codex.app` 下使用相同配置：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

當 `computerUse.autoInstall` 為 true 且未註冊任何包含
`computer-use` 的市集時，OpenClaw 會嘗試新增第一個存在的標準
隨附市集根目錄：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以透過 Codex 從殼層明確註冊：

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非標準 Codex 應用程式路徑，請執行一次 `/codex computer-use install
--source <marketplace-root>`，或將 `computerUse.marketplacePath` 設為
本機市集檔案路徑。只有在你擁有
市集 JSON 檔案路徑時才使用 `--marketplace-path`，不要傳入隨附市集根目錄。

### 共用外掛快取

預設的 `pluginCacheMode: "independent"` 不會管理各 Codex 主目錄及其
外掛快取。設定 `pluginCacheMode: "shared"`，可在 app-server 啟動前將隨附的
Computer Use 外掛複製到目前 Codex 主目錄中可探索的外掛快取。
共用模式會保留較舊的快取版本，因為執行中的 Codex 用戶端仍可能參照
其具有版本號的外掛目錄；若替換複製失敗，也會保留作用中的快取。明確的
`marketplaceName` 或 `marketplacePath` 設定會停用此
協調作業，讓 OpenClaw 不會覆寫該選擇。

## 遠端目錄限制

Codex app-server 可以列出並讀取僅存在於遠端的目錄項目，但目前
不支援遠端 `plugin/install`。這表示 `marketplaceName`
可以選取僅存在於遠端的市集進行狀態檢查，但安裝和
重新啟用仍需要透過 `marketplaceSource` 或
`marketplacePath` 使用本機市集。

如果狀態顯示外掛可從遠端 Codex 市集取得，但
不支援遠端安裝，請使用本機來源或路徑執行安裝：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定參考

| 欄位                           | 預設值        | 說明                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推斷       | 要求使用 Computer Use。設定另一個 Computer Use 欄位時，預設為 true。 |
| `autoInstall`                   | false          | 每輪開始時，從已探索到的市集安裝或重新啟用。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安裝等待 Codex app-server 探索市集的時間。             |
| `liveTestTimeoutMs`             | 60000          | 暫時就緒執行緒及其清理要求的逾時時間。           |
| `toolCallTimeoutMs`             | 60000          | Computer Use `list_apps` 就緒工具呼叫的逾時時間。                  |
| `healthCheckEnabled`            | false          | 當所屬 app-server 用戶端處於作用中時，定期執行就緒探測。    |
| `healthCheckIntervalMinutes`    | 60             | 探測頻率；接受的值為 30、60、120 或 240 分鐘。                |
| `pluginCacheMode`               | `independent`  | 使用 `shared`，從隨附的桌面外掛重新整理 Codex 主目錄快取。  |
| `strictReadiness`               | false          | 即時探測失敗時停止啟動，而非顯示警告後繼續。      |
| `autoRepair`                    | false          | 終止過時且限定範圍的 Computer Use MCP 子程序，並重試失敗的探測一次。     |
| `marketplaceSource`             | 未設定          | 傳遞至 Codex app-server `marketplace/add` 的來源字串。                    |
| `marketplacePath`               | 未設定          | 包含此外掛的本機 Codex 市集檔案路徑。                       |
| `marketplaceName`               | 未設定          | 要選取的已註冊 Codex 市集名稱。                                   |
| `pluginName`                    | `computer-use` | Codex 市集外掛名稱。                                                 |
| `mcpServerName`                 | `computer-use` | 已安裝外掛所公開的 MCP 伺服器名稱。                               |

每輪開始時的自動安裝會刻意拒絕已設定的 `marketplaceSource`
值。新增來源是一項明確的設定作業，因此請先使用
`/codex computer-use install --source <marketplace-source>` 一次，之後再讓
`autoInstall` 處理從已探索到的本機市集重新啟用外掛。
每輪開始時的自動安裝可以使用已設定的 `marketplacePath`，因為它
已是主機上的本機路徑。

每個欄位也接受環境變數覆寫；當對應的設定鍵未設定時，
會檢查該環境變數：

| 欄位                           | 環境變數                                                        |
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

## OpenClaw 會檢查的項目

OpenClaw 會在內部回報穩定的設定原因，並為聊天格式化
面向使用者的狀態：

| 原因                       | 說明                                                | 下一步                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析為 false。               | 設定 `enabled` 或其他 Computer Use 欄位。  |
| `marketplace_missing`        | 沒有可用的相符市集。                 | 設定來源、路徑或市集名稱。  |
| `plugin_not_installed`       | 市集存在，但外掛尚未安裝。   | 執行安裝或啟用 `autoInstall`。          |
| `plugin_disabled`            | 外掛已安裝，但在 Codex 設定中停用。      | 執行安裝以重新啟用。                  |
| `remote_install_unsupported` | 選取的市集僅支援遠端。                   | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 外掛已啟用，但 MCP 伺服器無法使用。  | 檢查 Codex Computer Use 與作業系統權限。  |
| `ready`                      | 外掛與 MCP 工具均可使用。                    | 開始 Codex 模式的回合。                    |
| `check_failed`               | Codex app-server 要求在狀態檢查期間失敗。 | 檢查 app-server 連線與記錄。       |
| `auto_install_blocked`       | 每輪開始時的設定需要新增來源。       | 請先執行明確安裝。                   |

聊天輸出包含外掛狀態、MCP 伺服器狀態、市集、可用時的
工具，以及設定步驟失敗的具體訊息。

## macOS 權限

Computer Use 僅適用於 macOS。Codex 所擁有的 MCP 伺服器可能需要本機作業系統
權限，才能檢查或控制應用程式。如果 OpenClaw 顯示 Computer
Use 已安裝，但 MCP 伺服器無法使用，請先驗證 Codex 端的
Computer Use 設定：

- Codex app-server 正在應執行桌面控制的同一部主機上執行。
- Computer Use 外掛已在 Codex 設定中啟用。
- `computer-use` MCP 伺服器出現在 Codex app-server MCP 狀態中。
- macOS 已授予桌面控制應用程式所需的權限。
- 目前的主機工作階段可以存取受控制的桌面。

當 `computerUse.enabled` 為 true 時，OpenClaw 會刻意採取失敗關閉。若設定要求
原生桌面工具，Codex 模式的回合就不應在缺少這些工具時
悄悄繼續。

## 疑難排解

**狀態顯示尚未安裝。** 執行 `/codex computer-use install`。如果
未探索到市集，請傳入 `--source` 或 `--marketplace-path`。

**狀態顯示已安裝但已停用。** 再次執行 `/codex computer-use install`。
Codex app-server 安裝會將外掛設定寫回啟用狀態。

**狀態顯示不支援遠端安裝。** 使用本機市集
來源或路徑。可以檢查僅限遠端的目錄項目，但無法
透過目前的 app-server API 安裝。

**狀態顯示 MCP 伺服器無法使用。** 重新執行安裝一次，讓 MCP
伺服器重新載入。如果仍然無法使用，請修正 Codex Computer Use 應用程式、
Codex app-server MCP 狀態或 macOS 權限。

**狀態或探測在 `computer-use.list_apps` 上逾時。** 外掛與
MCP 伺服器都存在，但本機 Computer Use 橋接器沒有回應。
結束或重新啟動 Codex Computer Use，必要時重新啟動 Codex Desktop，然後
在新的 OpenClaw 工作階段中重試。如果主機先前透過較舊的受管理
Codex app-server 執行 Computer Use，請從桌面隨附的市集重新整理已安裝的外掛
（獨立 Codex 桌面安裝請使用 `Codex.app` 路徑）：

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use 工具顯示 `Native hook relay unavailable`。**
Codex 原生工具掛鉤無法透過本機橋接器或閘道後援連線至作用中的 OpenClaw 轉送器。
使用 `/new` 或 `/reset` 啟動新的 OpenClaw 工作階段。
如果它成功一次，但之後的工具呼叫又再次失敗，
`/new` 只會清除目前的嘗試；請重新啟動 Codex app-server 或
OpenClaw 閘道，以捨棄舊執行緒與掛鉤註冊，然後
在新的工作階段中重試。

**每輪開始時的自動安裝拒絕來源。** 這是刻意的行為。請先使用明確的
`/codex computer-use install --source
<marketplace-source>` 新增來源，之後每輪開始時的自動安裝即可使用
已探索到的本機市集。

## 相關內容

- [Codex 控制框架](/zh-TW/plugins/codex-harness)
- [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)
- [iOS 應用程式](/zh-TW/platforms/ios)
