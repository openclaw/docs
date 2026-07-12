---
read_when:
    - 你需要所有 Codex 操作框架的設定欄位
    - 你正在變更 app-server 的傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex 控制框架啟動、模型探索或環境隔離問題
summary: Codex 測試框架的設定、驗證、探索與應用程式伺服器參考資料
title: Codex 執行框架參考資料
x-i18n:
    generated_at: "2026-07-12T14:37:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考資料涵蓋官方 `codex` 外掛的詳細設定。
如需設定與路由決策，請先參閱
[Codex 執行框架](/zh-TW/plugins/codex-harness)。

## 外掛設定介面

所有 Codex 執行框架設定都位於 `plugins.entries.codex.config` 下。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

頂層欄位：

| 欄位                       | 預設值                   | 意義                                                                                                                                                      |
| -------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                   | Codex app-server `model/list` 的模型探索設定。                                                                                                            |
| `appServer`                | 受管理的 stdio app-server | 傳輸、命令、驗證、核准、沙箱與逾時設定。一般執行框架預設使用代理程式範圍的狀態。                                                                          |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具情境中。                                                                                      |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                                                                                            |
| `codexPlugins`             | 已停用                   | 原生 Codex 外掛／應用程式支援，包括選擇性存取已連結帳號的應用程式。請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。                               |
| `computerUse`              | 已停用                   | Codex 電腦操作設定。請參閱 [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)。                                                                                 |
| `supervision`              | 已停用                   | 未封存的原生工作階段目錄、本機分支接續，以及代理程式工具政策。請參閱 [Codex 監督](/plugins/codex-supervision)。                                            |

## 監督

監督功能會列出閘道電腦與已選擇加入之配對節點上的未封存 Codex 工作階段。
請與代理程式執行框架分開啟用：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

`supervision` 欄位：

| 欄位                  | 預設值                 | 意義                                                                                                                                                                                                                                               |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                | 公開本機工作階段目錄，並在閘道上彙整已選擇加入之配對節點的目錄，供 Codex Sessions 頁面使用。                                                                                                                                                      |
| `endpoints`           | 內建本機端點           | 供保留的 Codex 監督代理程式與獨立 MCP 工具使用的相容性及進階端點目標。人工操作的目錄與分支流程會忽略這些目標，並使用由 `appServer` 解析的監督 App Server。                                                                                         |
| `allowRawTranscripts` | `false`                | 啟用監督時，允許自主代理程式或獨立 MCP 讀取逐字記錄，以及讀取衍生自逐字記錄的清單欄位。僅讀取中繼資料的 `codex_threads` 仍可使用。不控制已驗證的 Control UI 接續操作。                                                                               |
| `allowWriteControls`  | `false`                | 啟用監督時，允許自主執行 `codex_threads` 的分叉、重新命名、封存及取消封存變更，以及獨立 MCP 的傳送、引導與中斷操作。不會略過其他繫結、主機、狀態或確認檢查。                                                                                         |

端點項目接受以下欄位：

| 欄位           | 適用對象      | 意義                                                       |
| -------------- | ------------- | ---------------------------------------------------------- |
| `id`           | 全部          | 穩定的端點 ID。                                            |
| `label`        | 全部          | 選用的顯示標籤。                                           |
| `transport`    | 全部          | `"stdio-proxy"` 或 `"websocket"`。                         |
| `command`      | `stdio-proxy` | 選用的 App Server 命令。                                   |
| `args`         | `stdio-proxy` | 選用的命令引數。                                           |
| `cwd`          | `stdio-proxy` | 選用的子行程工作目錄。                                     |
| `url`          | `websocket`   | 必填的 WebSocket 或支援的本機通訊端 URL。                  |
| `authTokenEnv` | `websocket`   | 選用的環境變數，其值用於驗證端點。                         |

**Codex Sessions** 頁面使用此外掛的監督 App Server，並且只顯示
未封存的工作階段。若未明確指定 `appServer` 連線設定，
該連線會使用受管理的使用者家目錄 stdio。已儲存或閒置的本機資料列可透過截至最後一個
終止狀態已保存來源回合的有限使用者與助理歷程，建立模型鎖定的聊天。
其私有繫結會在該連線上維持快照分叉、標準 `appServer` 來源分支、
歷程注入，以及後續回合。第一次標準啟動會使用分叉所傳回的組合。
後續繼續執行會省略 OpenClaw 模型與供應商覆寫，讓 Codex 還原
標準執行緒已保存的組合；另一項原生變更可以更新該組合，
但外層模型與後援鏈永遠不會取代它。確認沒有其他執行器之後，
可以封存已儲存及閒置的資料列，除非另一個作用中的 OpenClaw 繫結擁有完全相同的目標，
或其某個未封存的衍生後代。OpenClaw 會遵循 Codex 的後代分頁，
並在列舉錯誤、循環或耗盡安全限制時採取封閉式失敗。
確認作業仍涵蓋未知的原生用戶端，以及從狀態判定到封存之間的競態條件。
受監督且模型鎖定的聊天在保護原生繫結期間無法刪除。
作用中的來源無法建立分支或封存，但仍可開啟既有的受監督聊天。
每個配對節點的資料列都維持唯讀；節點傳輸目前尚未提供執行框架所需的串流生命週期。

僅設定 `appServer.homeScope: "user"` 只會變更受管理執行框架
程序所使用的 Codex 家目錄；它不會公開叢集目錄。啟用監督
不會變更執行框架的預設值。反之，當沒有明確的 `appServer`
連線設定時，獨立的監督連線預設使用受管理的使用者家目錄 stdio。
明確設定會套用於該連線。待處理及已提交的受監督繫結會為每個回合保留該連線；
若監督停用或連線／生命週期發生漂移，則會採取封閉式失敗，
而不會退回代理程式家目錄的執行框架。預設連線會與原生 Codex 用戶端共用
已儲存的工作階段，但不共用其程序本機活動狀態。

舊版 `plugins.entries.codex-supervisor` 設定已停用。請執行
`openclaw doctor --fix`，將舊項目、端點定義、政策旗標，
以及外掛允許／拒絕參照遷移至此區塊。發生衝突時，
明確的標準 `codex.config.supervision` 值優先。

## App-server 傳輸

對於一般執行框架回合，OpenClaw 會啟動官方外掛隨附的受管理 Codex 二進位檔
（目前為 `@openai/codex` `0.144.1`）：

```bash
codex app-server --listen stdio://
```

這會將 app-server 版本繫結至官方 `codex` 外掛，
而不是恰好安裝在本機的其他 Codex 命令列介面。只有在你刻意要使用不同的可執行檔時，
才設定 `appServer.command`。即使已安裝 macOS 桌面應用程式套件，
採用預設隔離代理程式家目錄的一般受管理回合仍會優先使用此固定版本套件。
啟用[電腦操作](/zh-TW/plugins/codex-computer-use)時，或當 `homeScope`
為 `"user"` 且可載入原生電腦操作狀態時，受管理的啟動程序會改為優先使用
擁有所需 macOS 權限的桌面應用程式二進位檔。當隔離代理程式家目錄的有效 Codex 設定
啟用原生電腦操作時，也適用相同的桌面優先規則。若未安裝桌面應用程式套件，
OpenClaw 會退回固定版本套件的二進位檔。

可執行檔交接與原生設定隔離會協調同一個執行中閘道程序內的用戶端。
當另一個程序變更原生 Codex 外掛設定後，請重新啟動閘道。

監督功能會解析獨立的連線。若沒有明確的 `appServer` 連線設定，
它會使用 `homeScope: "user"` 的受管理 stdio；一般執行框架則維持使用
`homeScope: "agent"` 的受管理 stdio。兩條路徑都會遵循明確的連線設定。
當一般執行框架應與原生用戶端共用 `$CODEX_HOME`（或 `~/.codex`）時，
請明確設定 `homeScope: "user"`。私有受監督繫結會使用監督連線，
不受一般執行框架預設值影響。各個獨立 App Server 程序會保留各自的即時狀態與核准狀態。

若要使用已執行中的 app-server，請使用 WebSocket 傳輸：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

`appServer` 欄位：

| 欄位                                          | 預設值                                                 | 含義                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確指定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依每個 OpenClaw 代理隔離一般框架狀態。`"user"` 是明確選用的設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的對話串管理。使用者範圍支援本機 stdio 或 Unix 傳輸。對於獨立的監督連線，未設定的值在 stdio 或 Unix 下會解析為 `"user"`，在 WebSocket 下則解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                                  |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | 未設定                                                 | WebSocket App Server URL 或 `unix://` URL。明確指定空白的 Unix 路徑會選取標準的使用者家目錄控制通訊端。                                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境後，從啟動的 stdio app-server 程序中移除的額外環境變數名稱。                                                                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從解析後的 OpenClaw 工作區推斷本機工作區根目錄，保留目前 cwd 在此遠端根目錄下的後綴，並僅將最終的 app-server cwd 傳送給 Codex。若 cwd 位於解析後的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個輪次後，或執行輪次範圍的 app-server 要求後，OpenClaw 等待 `turn/completed` 時所允許的靜默期間。                                                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具執行後的原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。適用於可信任或繁重的工作負載，其中工具執行後的統整作業可能合理地保持靜默，且時間長於最終助理輸出預算。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO               | YOLO 或經守護者審查之執行的預設組態。                                                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准原則                       | 傳送至對話串啟動、繼續及輪次的原生 Codex 核准原則。                                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙箱              | 傳送至對話串啟動及繼續的原生 Codex 沙箱模式。作用中的 OpenClaw 沙箱會將 `danger-full-access` 輪次限縮為 Codex `workspace-write`；輪次網路旗標會遵循 OpenClaw 沙箱的對外連線設定。                                                                                                                                                                                                                  |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者                          | 若允許，使用 `"auto_review"` 讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | 目前程序目錄                                           | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                                   |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，而 `null` 會清除覆寫設定。舊版 `"fast"` 會視同 `"priority"` 接受。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                                 | 選用 Codex 權限設定檔網路功能以供 app-server 命令使用。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取該設定，而不傳送 `sandbox`。                                                                                                                                                                                                                   |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選用功能，會向支援的 Codex app-server 註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行可在作用中的 OpenClaw 沙箱內運行。                                                                                                                                                                                                                                                            |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱
合約。啟用後，OpenClaw 也會在 Codex 對話串設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動由 Codex 管理的網路功能。OpenClaw 預設會從設定檔
內容產生抗衝突的 `openclaw-network-<fingerprint>` 設定檔名稱；只有在
需要穩定的本機名稱時才使用 `profileName`。

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

如果一般的 app-server 執行階段原本會是 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會改用工作區樣式的檔案系統存取。
Codex 管理的網路強制控管採用沙箱化網路，因此完整存取設定檔無法保護
對外流量。

此外掛會阻擋較舊或未提供版本的 app-server 交握：Codex app-server
必須回報穩定版本 `0.143.0` 或更新版本。

OpenClaw 會將非回送位址的 WebSocket app-server URL 視為遠端，並要求透過
`appServer.authToken` 或 `Authorization` 標頭提供可識別身分的 WebSocket
驗證。`appServer.authToken` 與每個 `appServer.headers.*` 值都可以是
SecretInput；在 OpenClaw 建立 app-server 啟動選項之前，密鑰執行階段會解析
SecretRefs 與環境變數簡寫，且未解析的結構化 SecretRefs 會在傳送任何權杖或
標頭之前失敗。設定原生 Codex 外掛時，OpenClaw 會使用已連線 app-server 的
外掛控制平面來安裝或重新整理這些外掛，接著重新整理應用程式清單，讓 Codex
執行緒可以看見外掛擁有的應用程式。`app/list` 仍是具權威性的清單與中繼資料
來源，但即使 Codex 目前將已列出且可存取的應用程式標示為停用，OpenClaw
原則仍會決定 `thread/start` 是否傳送
`config.apps[appId].enabled = true`。未知或缺少的應用程式 ID 仍會採取
失敗關閉；此路徑只會透過 `plugin/install` 啟用市集外掛並重新整理清單。
只應將 OpenClaw 連線至你信任的遠端 app-server，且該伺服器必須能接受
OpenClaw 管理的外掛安裝與應用程式清單重新整理。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作員模式，能讓無人值守的
OpenClaw 輪次與心跳偵測持續進行，而不會出現無人可以回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、審查者或沙箱值，
OpenClaw 會改將隱含預設值視為 guardian，並選擇允許的 guardian 權限。
`tools.exec.mode: "auto"` 也會強制使用 guardian 審查的 Codex 核准，且不會
保留不安全的舊版 `approvalPolicy: "never"` 或
`sandbox: "danger-full-access"` 覆寫；若要刻意採用無需核准的模式，請設定
`tools.exec.mode: "full"`。同一個需求檔案中，與主機名稱相符的
`[[remote_sandbox_config]]` 項目會納入沙箱預設值的決策。

設定 `appServer.mode: "guardian"` 以使用 Codex guardian 審查的核准：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

當這些值受到允許時，`guardian` 預設組合會展開為
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，
以及 `sandbox: "workspace-write"`。個別原則欄位會覆寫 `mode`。較舊的
`guardian_subagent` 審查者值仍可作為相容性別名接受，但新設定應使用
`auto_review`。

啟用 OpenClaw 沙箱時，本機 Codex app-server 程序仍會在閘道主機上執行。
因此，OpenClaw 會在該輪次停用 Codex 原生 Code Mode、使用者 MCP 伺服器，
以及由應用程式支援的外掛執行，而不會將 Codex 主機端沙箱視為等同於
OpenClaw 沙箱後端。一般 exec/process 工具可用時，Shell 存取會透過
OpenClaw 沙箱後端的動態工具公開，例如 `sandbox_exec` 與
`sandbox_process`。

<Note>
在使用 Docker 後端的 OpenClaw 沙箱主機上（`agents.defaults.sandbox.mode`
設為 Docker 後端），`openclaw doctor` 會探測主機是否允許非特權使用者命名
空間，以及在停用 Docker 沙箱網路輸出時，是否允許巢狀 Codex `bwrap` 在
沙箱容器內執行 `workspace-write` Shell 所需的網路命名空間。探測失敗通常會
在 Ubuntu/AppArmor 主機上顯示為
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。
請為 OpenClaw 服務使用者修正回報的主機命名空間原則，然後重新啟動閘道；
應優先為服務程序使用限定範圍的 AppArmor 設定檔，而非採用影響整台主機的
`kernel.apparmor_restrict_unprivileged_userns=0` 後備方案，也不要只為了
滿足巢狀 `bwrap` 而授予 Docker 容器更廣泛的權限。
</Note>

## 沙箱化原生執行

穩定的預設行為是失敗關閉：啟用 OpenClaw 沙箱時，會停用原本會從 Codex
app-server 主機執行的原生 Codex 執行介面。只有當你想搭配 OpenClaw
沙箱後端試用 Codex 的遠端環境支援時，才使用
`appServer.experimental.sandboxExecServer: true`。這條預覽路徑適用於
所有受支援的 Codex app-server 版本。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

啟用此旗標且目前的 OpenClaw 工作階段已沙箱化時，OpenClaw 會啟動由作用中
沙箱支援的本機回送 exec-server，向 Codex app-server 註冊，並使用該
OpenClaw 擁有的環境啟動 Codex 執行緒與輪次。如果 app-server 無法註冊環境，
執行作業會採取失敗關閉，而不是無聲地後備至主機執行。

這條預覽路徑僅限本機使用。除非遠端 WebSocket app-server 在同一台主機上
執行，否則無法連線至回送 exec-server，因此 OpenClaw 會拒絕這種組合。

## 驗證與環境隔離

在預設的個別代理程式家目錄中，驗證會依下列順序選取：

1. 為該代理程式明確指定的 OpenClaw Codex 驗證設定檔。
2. 該代理程式 Codex 家目錄中 app-server 的現有帳號。
3. 僅限本機 stdio app-server 啟動：若沒有 app-server 帳號且仍需要 OpenAI
   驗證，則先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱樣式的 Codex 驗證設定檔（OAuth 或權杖認證
資訊類型）時，會從產生的 Codex 子程序中移除 `CODEX_API_KEY` 與
`OPENAI_API_KEY`。如此可讓閘道層級的 API 金鑰繼續用於嵌入或直接 OpenAI
模型，同時避免原生 Codex app-server 輪次意外透過 API 計費。

明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰後備會使用 app-server
登入，而不是繼承的子程序環境。WebSocket app-server 連線不會收到閘道環境
API 金鑰後備；請使用明確的驗證設定檔或遠端 app-server 自己的帳號。

stdio app-server 啟動預設會繼承 OpenClaw 的程序環境。OpenClaw 擁有 Codex
app-server 帳號橋接，並將 `CODEX_HOME` 設為該代理程式 OpenClaw 狀態下的
個別代理程式目錄。如此可將 Codex 設定、帳號、外掛快取／資料，以及執行緒
狀態限制在該 OpenClaw 代理程式內，而不會從操作員個人的 `~/.codex` 家目錄
洩漏進來。

設定 `appServer.homeScope: "user"`，即可與 Codex Desktop 和命令列介面共用
原生 Codex 狀態。這種本機使用者家目錄模式支援受管理的 stdio 與明確的 Unix
傳輸。若已設定 `$CODEX_HOME`，它會使用該值，否則使用 `~/.codex`，包括原生
驗證、設定、外掛與執行緒。OpenClaw 會略過 app-server 的驗證設定檔橋接。
經驗證的擁有者輪次可以使用 `codex_threads` 列出（可搭配選用的 `search`
篩選器）、讀取、分叉、重新命名、封存及取消封存這些執行緒。在 OpenClaw
中繼續執行緒之前，請先將其分叉；各自獨立的 Codex 程序不會協調同一執行緒
的並行寫入者。

該 `homeScope` 選擇加入適用於一般執行框架工作階段。透過 Codex Sessions
建立的聊天則會使用其私人監督連線，為標準分支及未來的恢復作業保留原生
連線的驗證與提供者設定。

在鎖定模型的受監督聊天中，`codex_threads` 無法附加不同的分叉，也無法封存
該聊天所繫結的原生執行緒。清單與僅限中繼資料的讀取仍可使用。原始對話記錄
讀取需要 `allowRawTranscripts`；停用時，也會拒絕清單搜尋，因為原生搜尋可能
比對到對話記錄預覽。若要重新命名、取消封存、建立分離式分叉，或封存不屬於
其他 OpenClaw 聊天的無關執行緒，則需要 `allowWriteControls`。這兩個選項都
無法繞過鎖定的繫結。

OpenClaw 不會為一般本機 app-server 啟動改寫 `HOME`。Codex 執行的子程序，
例如 `openclaw`、`gh`、`git`、雲端命令列介面與 Shell 命令，都會看到一般的
程序家目錄，並可找到使用者家目錄中的設定與權杖。Codex 也可能探索
`$HOME/.agents/skills` 與 `$HOME/.agents/plugins/marketplace.json`；
這項 `.agents` 探索會刻意與操作員家目錄共用，且與隔離的 `~/.codex` 狀態
分開。

在預設代理程式範圍內，OpenClaw 外掛與 OpenClaw Skills 快照仍會透過
OpenClaw 自己的外掛登錄檔與 Skills 載入器流通；個人的 Codex `~/.codex`
資產則不會。如果 Codex 家目錄中有實用的 Codex 命令列介面 Skills 或外掛，
且應納入隔離的 OpenClaw 代理程式，請明確盤點它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

如果部署需要額外的環境隔離，請將這些變數加入 `appServer.clearEnv`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。OpenClaw 會在
本機啟動正規化期間，從此清單移除 `CODEX_HOME` 與 `HOME`：
`CODEX_HOME` 會繼續指向選取的代理程式或使用者範圍，而 `HOME` 會維持繼承，
讓子程序可以使用一般的使用者家目錄狀態。

## 動態工具

Codex 動態工具預設使用 `searchable` 載入，並在 `openclaw` 命名空間下公開，
且設有 `deferLoading: true`。OpenClaw 不會公開與 Codex 原生工作區操作或
Codex 自身工具搜尋介面重複的動態工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

其餘大多數 OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、閘道、
`heartbeat_respond` 與 `web_search`，都可透過該命名空間下的 Codex 工具搜尋
使用。如此可縮小初始模型上下文。無論 `codexDynamicToolsLoading` 為何，都有
一小組工具可保持直接呼叫，因為 Codex 工具搜尋可能無法使用，或只解析出
連接器範圍：`agents_list`、`sessions_spawn` 與 `sessions_yield`。開發人員
指示仍會引導一般 Codex 子代理程式在 Codex 原生子代理程式工作中使用原生
`spawn_agent`，而 `sessions_spawn` 則繼續可用於明確的 OpenClaw 或 ACP
委派。僅使用訊息工具的來源回覆也會維持直接呼叫，因為這是輪次控制合約。

標記為 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer` 工具）
會歸入 `openclaw_direct`。OpenClaw 會將該命名空間加入 Codex 的
`code_mode.direct_only_tool_namespaces` 清單，而不會取代操作員提供的項目。
因此，Codex 會在一般執行緒與僅限 Code Mode 的執行緒中，將這些工具公開為
`DirectModelOnly`，而不是透過巢狀 Code Mode `tools.*` 呼叫路由。含有影像
的結果需要此界線：巢狀 Code Mode 序列化會將影像輸出扁平化為文字，因而
捨棄下一個電腦操作所需的螢幕截圖。

只有在連線至無法搜尋延遲載入動態工具的自訂 Codex app-server，或偵錯完整
工具承載資料時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫，其限制獨立於
`appServer.requestTimeoutMs`。每個 Codex `item/tool/call` 請求會依下列
順序使用第一個可用的逾時設定：

- 每次呼叫所提供的正值 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的
  圖像生成預設值。
- 對於媒體理解的 `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換成的毫秒值，或 60 秒的媒體預設值。對於圖像
  理解，此設定適用於請求本身，不會因先前的準備工作
  而縮短。
- 對於 `message` 工具，使用固定的 120 秒預設值。
- 使用 90 秒的動態工具預設值。

此監控機制是外層動態 `item/tool/call` 的時間預算。各供應商專屬的
請求逾時會在該呼叫內執行，並保有各自的逾時語意。
動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援的情況下中止
工具訊號，並將失敗的動態工具回應傳回
Codex，讓該輪可以繼續，而不會使工作階段停留在
`processing` 狀態。

Codex 接受一輪操作後，以及 OpenClaw 回應該輪範圍內的
app-server 請求後，測試框架會預期 Codex 在目前這一輪中持續推進，
最終以 `turn/completed` 完成原生輪次。如果
app-server 在 `appServer.turnCompletionIdleTimeoutMs` 期間沒有動靜，OpenClaw
會盡力中斷 Codex 輪次、記錄診斷逾時，並
釋放 OpenClaw 工作階段通道，使後續聊天訊息不會排在
過時的原生輪次之後。

同一輪的大多數非終止通知都會解除該短期監控，
因為 Codex 已證明該輪仍在運作。工具交接會使用較長的
工具後閒置時間預算：包括 OpenClaw 傳回 `item/tool/call` 回應後、
`commandExecution` 等原生工具項目完成後、原始
`custom_tool_call_output` 完成後，以及工具後的原始助理
進度、原始推理完成或推理進度之後。若有設定，
此防護機制會使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘。同一個工具後時間預算也會延長
Codex 發出下一個目前輪次事件前，靜默整合期間的進度監控時間。
推理完成、註解型 `agentMessage`
完成，以及工具前的原始推理或助理進度之後，可能接續自動最終回覆，
因此它們會使用進度後回覆防護，而不會立即釋放工作階段通道。
只有最終／非註解型的已完成 `agentMessage` 項目，以及工具前的原始助理完成，
會啟用助理輸出釋放機制：如果 Codex 隨後在未發出 `turn/completed`
的情況下沒有動靜，OpenClaw 會盡力中斷原生輪次並釋放工作階段
通道。可安全重播的 stdio app-server 失敗，包括沒有助理、
工具、作用中項目或副作用證據的輪次完成閒置
逾時，會使用全新的 app-server 嘗試重試一次。不安全的逾時仍會淘汰
卡住的 app-server 用戶端並釋放 OpenClaw 工作階段通道。它們也會
清除過時的原生執行緒繫結，而不會自動
重播。完成監控逾時會顯示 Codex 專屬的逾時文字：
可安全重播的情況會說明回應可能不完整，而不安全的情況會要求
使用者在重試前確認目前狀態。公開的逾時診斷資訊
包含結構化欄位，例如最後一個 app-server 通知方法、
原始助理回應項目的 id／type／role、作用中請求／項目數量，以及
已啟用的監控狀態。當最後一個通知是原始助理回應
項目時，也會包含有長度限制的助理文字預覽。這些資訊不會
包含原始提示詞或工具內容。

## 模型探索

Codex 外掛預設會向 app-server 查詢可用模型。模型
可用性由 Codex app-server 管理，因此當
OpenClaw 升級內含的 `@openai/codex` 版本，或部署環境將
`appServer.command` 指向不同的 Codex 二進位檔時，清單可能會變更。可用性也可能
依帳戶而異。在執行中的閘道上使用 `/codex models`，即可查看該測試框架與帳戶的即時
目錄。

如果探索失敗或逾時，OpenClaw 會使用內含的備援目錄：

| 模型 ID       | 顯示名稱 | 推理強度                 |
| ------------- | -------- | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
目前內含的測試框架為 `@openai/codex` `0.144.1`。針對該內含 app-server 執行的
`model/list` 探測，傳回了下列公開模型選擇器資料列：

| 模型 ID        | 輸入模態       | 推理強度                             |
| -------------- | -------------- | ------------------------------------ |
| `gpt-5.6-sol`   | 文字、圖像     | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | 文字、圖像     | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | 文字、圖像     | low, medium, high, xhigh, max        |
| `gpt-5.5`       | 文字、圖像     | low, medium, high, xhigh             |
| `gpt-5.4`       | 文字、圖像     | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | 文字、圖像     | low, medium, high, xhigh             |
| `gpt-5.2`       | 文字、圖像     | low, medium, high, xhigh             |

app-server 目錄可能回報 `ultra`；OpenClaw 推理控制項目前
僅提供到 `max` 等級。

即時模型選擇器資料列依帳戶而異，並可能隨帳戶、Codex
目錄或內含版本而變更；請執行 `/codex models` 取得目前清單，不要
依賴任何特定時間點的表格。隱藏模型也可能出現在
app-server 目錄中，供內部或特殊流程使用，但不屬於一般的
模型選擇器選項。
</Note>

在 `plugins.entries.codex.config.discovery` 下調整探索設定：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

如果你希望啟動時不要探測 Codex，並且只使用
備援目錄，請停用探索：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## 工作區啟動檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。
OpenClaw 不會寫入合成的 Codex 專案文件，也不會依賴 Codex
的備援檔名來處理角色設定檔，因為 Codex 備援只會在
缺少 `AGENTS.md` 時套用。

為了與 OpenClaw 工作區保持一致，Codex 測試框架會將其他
啟動檔案轉送為開發者指示，但方式並不完全相同：

- `TOOLS.md` 會以**繼承式** Codex 開發者指示轉送，因此
  該輪期間產生的原生 Codex 子代理程式也能看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 會以**輪次範圍**
  的協作指示轉送。原生 Codex 子代理程式不會繼承它們，
  以避免子代理程式輪次採用父代理程式的角色設定與
  使用者資料。
- 已載入的精簡 OpenClaw Skills 清單也會以輪次範圍的
  協作開發者指示轉送，因此原生 Codex 子代理程式
  同樣不會繼承它。
- 不會注入 `HEARTBEAT.md` 內容；當該檔案存在且
  非空時，心跳偵測輪次會收到協作模式的指示，要求讀取該檔案。
- 當設定的代理程式工作區具有可用的記憶工具時，不會將該工作區的
  `MEMORY.md` 內容貼入原生 Codex 輪次輸入；當該檔案存在時，測試框架會在
  輪次範圍的協作開發者指示中加入一個簡短的工作區記憶
  指引，而當持久記憶相關時，Codex 應使用 `memory_search` 或 `memory_get`。
  如果工具已停用、記憶搜尋無法使用，或作用中的
  工作區與代理程式記憶工作區不同，`MEMORY.md` 則會改用
  一般的受限輪次內容路徑。
- 如果存在 `BOOTSTRAP.md`，則會將其作為 OpenClaw 輪次輸入的參考
  內容轉送。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當未設定 `appServer.command` 時，`OPENCLAW_CODEX_APP_SERVER_BIN`
會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在
一次性的本機測試中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於
可重複的部署，建議使用設定，因為這能將外掛行為與
Codex 測試框架的其他設定保存在同一份經過審查的檔案中。

## 相關內容

- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督機制](/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
