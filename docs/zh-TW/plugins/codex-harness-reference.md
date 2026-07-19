---
read_when:
    - 你需要每個 Codex 控制框架設定欄位
    - 你正在變更應用程式伺服器的傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex 測試框架啟動、模型探索或環境隔離問題
summary: Codex 測試框架的設定、驗證、探索與應用程式伺服器參考資料
title: Codex 控制框架參考資料
x-i18n:
    generated_at: "2026-07-19T13:51:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f55db3e8850c574dd2cbb69ec55fb584ee16055eb4d3751946f0e7fa809a8175
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考文件涵蓋官方 `codex` 外掛的詳細設定。
若要進行設定與路由決策，請先參閱
[Codex 控制框架](/zh-TW/plugins/codex-harness)。

## 外掛設定介面

所有 Codex 控制框架設定都位於 `plugins.entries.codex.config` 下。

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

| 欄位                       | 預設值                    | 說明                                                                                                                                              |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                    | Codex app-server `model/list` 的模型探索設定。                                                                                    |
| `appServer`                | 受管理的 stdio app-server | 傳輸、命令、驗證、核准、沙箱與逾時設定。一般控制框架預設使用以代理程式為範圍的狀態。                        |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具上下文。                                                       |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中略過的其他 OpenClaw 動態工具名稱。                                                                    |
| `codexPlugins`             | 已停用                    | 原生 Codex 外掛／應用程式支援，包括選擇啟用已連結帳號應用程式的存取權。請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。 |
| `computerUse`              | 已停用                    | Codex 電腦操作設定。請參閱 [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)。                                                               |
| `sessionCatalog`           | 已啟用                    | 側邊欄的原生 Codex 工作階段探索。設定 `enabled: false` 可停用探索，而不停用提供者或控制框架。           |
| `supervision`              | 已停用                    | 面向代理程式的原生工作階段逐字稿與寫入控制原則。請參閱 [Codex 監督](/zh-TW/plugins/codex-supervision)。                          |

## 監督

原生工作階段探索預設會列出閘道
電腦及已選擇加入的配對節點上未封存的 Codex 工作階段。若只要停用該目錄，請使用：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` 會另外控制面向代理程式的工具：

| 欄位                  | 預設值                   | 說明                                                                                                                                                                                                                                   |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | 啟用面向代理程式的 Codex 監督工具。這不會控制已驗證的操作員工作階段目錄。                                                                                                                            |
| `endpoints`           | 內建本機端點              | 保留的 Codex 監督代理程式及獨立 MCP 工具所使用的相容性與進階端點目標。人工目錄與分支流程會忽略這些目標，並使用從 `appServer` 解析的監督 App Server。       |
| `allowRawTranscripts` | `false`                 | 啟用監督時，允許自主代理程式或獨立 MCP 讀取逐字稿，以及讀取衍生自逐字稿的清單欄位。僅限 `codex_threads` 中繼資料的讀取仍可使用。不控制已驗證的 Control UI 接續操作。     |
| `allowWriteControls`  | `false`                 | 啟用監督時，允許自主執行 `codex_threads` 分叉、重新命名、封存與取消封存變更，以及獨立 MCP 的傳送、引導和中斷操作。不會略過其他繫結、主機、狀態或確認檢查。 |

端點項目接受以下欄位：

| 欄位           | 適用範圍       | 說明                                                                  |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | 全部           | 穩定的端點 ID。                                                   |
| `label`        | 全部           | 選用的顯示標籤。                                               |
| `transport`    | 全部           | `"stdio-proxy"` 或 `"websocket"`。                                     |
| `command`      | `stdio-proxy` | 選用的 App Server 命令。                                          |
| `args`         | `stdio-proxy` | 選用的命令引數。                                           |
| `cwd`          | `stdio-proxy` | 選用的子處理程序工作目錄。                             |
| `url`          | `websocket`   | 必要的 WebSocket 或受支援的本機通訊端 URL。                     |
| `authTokenEnv` | `websocket`   | 選用的環境變數，其值用於驗證端點。 |

**Codex 工作階段**頁面使用外掛的監督 App Server，且只顯示
未封存的工作階段。在沒有明確的 `appServer` 連線設定時，
該連線會使用受管理的使用者家目錄 stdio。已儲存或閒置的本機資料列可透過最後一個
終止且已持久保存的來源回合為止的有限使用者與助理歷程，建立
模型鎖定的聊天。其私有繫結會讓快照分叉、
標準 `appServer` 來源分支、歷程注入及後續回合維持在該
連線上。第一次標準啟動會使用分叉傳回的配對。後續
繼續時會略過 OpenClaw 模型與提供者覆寫，讓 Codex 還原
標準執行緒已持久保存的配對；另一個原生變更可以更新該
配對，但外層模型與備援鏈絕不會取代它。若沒有其他執行器，已儲存和閒置的
資料列可在確認後封存，除非另一個有效的
OpenClaw 繫結擁有完全相同的目標，或其任一未封存的衍生
後代。OpenClaw 會遵循 Codex 的後代分頁機制，並在
列舉錯誤、循環或耗盡安全限制時以封閉方式失敗。確認仍會
涵蓋未知的原生用戶端，以及狀態轉為封存之間的競態狀況。受監督且
模型鎖定的聊天在保護原生繫結期間無法刪除。
有效來源無法建立分支或被封存，但仍可開啟現有的受監督
聊天。每個配對節點資料列都維持唯讀；節點
傳輸尚未提供控制框架所需的串流生命週期。

只有 `appServer.homeScope: "user"` 會變更受管理控制框架
處理程序使用的 Codex 家目錄；它不會發布機群目錄。啟用監督
不會變更控制框架預設值。相反地，當不存在明確的 `appServer`
連線設定時，獨立的監督連線預設使用受管理的使用者家目錄 stdio。
明確的設定會套用至該連線。待處理及已提交的受監督繫結會在每個回合
保留該連線；停用監督，或連線／生命週期發生漂移時，會以封閉方式失敗，而不會
備援至代理程式家目錄控制框架。預設連線會與原生 Codex 用戶端共用已儲存的
工作階段，但不會共用其處理程序本機活動狀態。

舊版 `plugins.entries.codex-supervisor` 設定已淘汰。請執行
`openclaw doctor --fix`，將舊項目、端點定義、原則
旗標及外掛允許／拒絕參照遷移至此區塊。發生衝突時，以明確的標準
`codex.config.supervision` 值為準。

## App-server 傳輸

對於一般控制框架回合，OpenClaw 會啟動官方外掛隨附的受管理 Codex
二進位檔（目前為 `@openai/codex` `0.144.6`）：

```bash
codex app-server --listen stdio://
```

這會讓 app-server 版本與官方 `codex` 外掛保持一致，而不是取決於
本機另外安裝的 Codex 命令列介面版本。只有在刻意要使用不同的執行檔時，才設定
`appServer.command`。
使用預設隔離代理程式家目錄的一般受管理回合，即使已安裝 macOS 桌面應用程式套件，也會優先使用此固定
套件。啟用
[電腦操作](/zh-TW/plugins/codex-computer-use)時，或 `homeScope` 為
`"user"` 且可載入原生電腦操作狀態時，受管理的啟動流程會改為優先使用
擁有所需 macOS 權限的桌面應用程式二進位檔。當隔離代理程式家目錄的有效 Codex 設定
啟用原生電腦操作時，也會套用相同的桌面優先規則。若未安裝桌面應用程式套件，OpenClaw
會備援至固定套件的二進位檔。

執行檔交接與原生設定隔離會協調同一個執行中
閘道處理程序內的用戶端。當其他處理程序變更原生 Codex 外掛設定後，請重新啟動閘道。

監督會解析獨立的連線。若沒有明確的
`appServer` 連線設定，它會使用搭配 `homeScope: "user"` 的受管理 stdio；
一般控制框架則維持使用搭配 `homeScope: "agent"` 的受管理 stdio。兩條路徑都會採用明確的
連線設定。若一般控制框架應與原生用戶端共用 `$CODEX_HOME`（或 `~/.codex`），
請明確設定 `homeScope: "user"`。私有受監督繫結會使用監督
連線，不受一般控制框架預設值影響。各自獨立的 App Server
處理程序會保有各自的即時狀態與核准狀態。

若要在非正式環境中針對已在執行的 app-server 進行測試，可使用 WebSocket
傳輸：

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

Codex 將 WebSocket 傳輸歸類為實驗性且不受支援。正式環境工作負載應優先使用
受管理的 stdio 或本機 Unix 控制通訊端。

`appServer` 欄位：

| 欄位                                          | 預設值                                                 | 意義                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確指定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依各 OpenClaw 代理程式隔離一般測試框架狀態。`"user"` 是明確選擇加入的設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機標準輸入輸出或 Unix 傳輸。對於獨立的監督連線，未設定的值在標準輸入輸出或 Unix 下會解析為 `"user"`，在 WebSocket 下則會解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                               | 標準輸入輸出傳輸所用的可執行檔。保持未設定即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | 標準輸入輸出傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket 應用程式伺服器 URL 或 `unix://` URL。明確指定空白的 Unix 路徑會選取使用者家目錄中的標準控制通訊端。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承的環境後，要從已啟動的標準輸入輸出應用程式伺服器程序中移除的額外環境變數名稱。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex 應用程式伺服器工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄、保留目前 cwd 在此遠端根目錄下的後綴，並只將最終的應用程式伺服器 cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端應用程式伺服器。 |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | 安裝 Codex `PreToolUse` 子程序，此程序僅用於 OpenClaw 迴圈偵測及其明確的無原則標記。設定 `false` 可減少每項工具的程序分流。工具執行前的外掛掛鉤與受信任工具原則仍會安裝其必要的轉送器。                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | 應用程式伺服器控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或執行回合範圍的應用程式伺服器要求後，OpenClaw 等待 `turn/completed` 時的靜默時窗。                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | 最終／非評論助理項目或工具執行前的原始助理完成項目啟動助理輸出釋放後，OpenClaw 仍在等待 `turn/completed` 時的靜默時窗。提高此值可讓 Codex 有更多時間發出 `turn/completed`，之後 OpenClaw 才會中斷並釋放工作階段通道。                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | 工具交接、原生工具完成、工具執行後的原始助理進度、原始推理完成或推理進度之後，在 OpenClaw 等待 `turn/completed` 時使用的完成閒置與進度防護。適用於受信任或高負載工作，其中工具執行後的綜合處理可合理地維持靜默，時間超過最終助理釋放預算。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO | YOLO 或經守護者審查之執行的預設設定。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准原則       | 傳送至執行緒啟動、繼續及回合的原生 Codex 核准原則。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙箱  | 傳送至執行緒啟動及繼續的原生 Codex 沙箱模式。作用中的 OpenClaw 沙箱會將 `danger-full-access` 回合限縮至 Codex `workspace-write`；回合的網路旗標會依循 OpenClaw 沙箱的出口設定。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者               | 在允許的情況下，使用 `"auto_review"` 讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 目前程序目錄                              | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex 應用程式伺服器服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受並視為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇加入 Codex 權限設定檔網路功能，以供應用程式伺服器命令使用。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選用功能，會向受支援的 Codex app-server 註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行能在作用中的 OpenClaw 沙箱內運作。                                                                                                                                                                                                            |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限設定檔能啟動由 Codex 管理的網路。OpenClaw 預設會根據設定檔內容產生一個抗碰撞的
`openclaw-network-<fingerprint>` 設定檔名稱；只有在需要穩定的本機名稱時，才使用 `profileName`。

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

如果一般 app-server 執行階段原本會是 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會改用工作區式檔案系統存取。由 Codex 管理的網路強制控管屬於沙箱化網路，因此完整存取設定檔無法保護對外流量。

此外掛會封鎖較舊、較新但未經驗證、預發行、帶有建置後綴或未標示版本的 app-server 交握。Codex app-server 必須回報從
`0.143.0` 到隨附 `0.144.6` 範圍內的穩定版本。

OpenClaw 會將非回送位址的 WebSocket app-server URL 視為遠端，並要求透過 `appServer.authToken` 或
`Authorization` 標頭提供帶有身分資訊的 WebSocket 驗證。`appServer.authToken` 和每個 `appServer.headers.*`
值都可以是 SecretInput；在 OpenClaw 建立 app-server 啟動選項之前，機密資料執行階段會解析 SecretRef 和環境變數簡寫，而未解析的結構化 SecretRef 會在傳送任何權杖或標頭之前失敗。設定原生 Codex 外掛時，OpenClaw 會使用已連線 app-server 的外掛控制平面來安裝或重新整理這些外掛，接著重新整理應用程式清冊，讓外掛所擁有的應用程式可供 Codex 執行緒使用。`app/list`
仍是權威的清冊與中繼資料來源，但即使 Codex 目前將某個列出且可存取的應用程式標示為停用，OpenClaw 原則仍會決定
`thread/start` 是否為其傳送 `config.apps[appId].enabled = true`。未知或缺少的應用程式 ID 仍採失敗時關閉；此路徑只會透過
`plugin/install` 啟用市集外掛並重新整理清冊。OpenClaw 只能連線至受信任、可接受由 OpenClaw 管理之外掛安裝與應用程式清冊重新整理的遠端 app-server。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。這種受信任的本機操作員配置，讓無人值守的 OpenClaw 回合與心跳偵測可以持續進行，而不會出現無人能回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、審查者或沙箱值，OpenClaw 會改將隱含預設值視為 guardian，並選取允許的 guardian 權限。`tools.exec.mode: "auto"`
也會強制使用由 guardian 審查的 Codex 核准，且不保留不安全的舊版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若有意採用不需核准的配置，請設定 `tools.exec.mode: "full"`。
同一需求檔案中符合主機名稱的 `[[remote_sandbox_config]]` 項目，也會套用於沙箱預設值的決策。

設定 `appServer.mode: "guardian"`，即可使用由 Codex guardian 審查的核准：

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

在允許這些值時，`guardian` 預設組合會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。個別原則欄位會覆寫
`mode`。較舊的 `guardian_subagent` 審查者值仍可作為相容性別名使用，但新設定應使用
`auto_review`。

當 OpenClaw 沙箱啟用時，本機 Codex app-server 程序仍會在閘道主機上執行。因此，OpenClaw 會在該回合停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及由應用程式支援的外掛執行，而不會將 Codex 主機端沙箱化視為等同於 OpenClaw 沙箱後端。一般 exec/process 工具可用時，Shell 存取會透過由 OpenClaw 沙箱支援的動態工具（例如 `sandbox_exec` 和 `sandbox_process`）提供。

<Note>
在以 Docker 為基礎的 OpenClaw 沙箱主機上（`agents.defaults.sandbox.mode` 設為 Docker 後端），`openclaw doctor` 會探測主機是否允許非特權使用者命名空間，以及在停用 Docker 沙箱網路對外連線時所需的網路命名空間；巢狀 Codex `bwrap` 需要這些命名空間，才能在沙箱容器內執行 `workspace-write` Shell。探測失敗時，在 Ubuntu/AppArmor 主機上通常會顯示為
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。請為 OpenClaw 服務使用者修正所回報的主機命名空間原則，並重新啟動閘道；應優先為服務程序使用限定範圍的 AppArmor 設定檔，而非採用主機全域的
`kernel.apparmor_restrict_unprivileged_userns=0` 備援方案，也不要只是為了滿足巢狀 `bwrap` 而授予更廣泛的 Docker 容器權限。
</Note>

## 沙箱化原生執行

穩定的預設行為是失敗時關閉：啟用 OpenClaw 沙箱後，會停用原本會從 Codex app-server 主機執行的原生 Codex 執行介面。只有在想搭配 OpenClaw 沙箱後端試用 Codex 的遠端環境支援時，才使用
`appServer.experimental.sandboxExecServer: true`。這個預覽路徑適用於所有受支援的 Codex app-server 版本。

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

當此旗標開啟且目前的 OpenClaw 工作階段已沙箱化時，OpenClaw 會啟動由作用中沙箱支援的本機回送 exec-server、將其註冊至 Codex app-server，並使用該 OpenClaw 所擁有的環境啟動 Codex 執行緒與回合。如果 app-server 無法註冊該環境，執行會採失敗時關閉，而不會無提示地退回主機執行。

這個預覽路徑僅限本機使用。除非遠端 WebSocket app-server 與回送 exec-server 在同一台主機上執行，否則無法連線，因此 OpenClaw 會拒絕這種組合。

## 驗證與環境隔離

在預設的個別代理程式主目錄中，驗證會依下列順序選取：

1. 代理程式的明確 OpenClaw Codex 驗證設定檔。
2. 該代理程式 Codex 主目錄中 app-server 的現有帳號。
3. 僅限本機 stdio app-server 啟動：當沒有 app-server 帳號且仍需要 OpenAI 驗證時，先使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 發現 ChatGPT 訂閱型 Codex 驗證設定檔（OAuth 或權杖認證資訊類型）時，會從產生的 Codex 子程序中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。如此可讓閘道層級的 API 金鑰繼續供嵌入或直接 OpenAI 模型使用，同時避免原生 Codex app-server 回合意外透過 API 計費。

明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰備援，會使用 app-server 登入，而非繼承的子程序環境。WebSocket app-server 連線不會收到閘道環境 API 金鑰備援；請使用明確的驗證設定檔，或使用遠端 app-server 自己的帳號。

stdio app-server 啟動預設會繼承 OpenClaw 的程序環境。OpenClaw 擁有 Codex app-server 帳號橋接機制，並將
`CODEX_HOME` 設為該代理程式 OpenClaw 狀態下的個別代理程式目錄。這可將 Codex 設定、帳號、外掛快取／資料與執行緒狀態限制在 OpenClaw 代理程式範圍內，避免從操作員個人的
`~/.codex` 主目錄洩入。

設定 `appServer.homeScope: "user"`，即可與 Codex Desktop 和命令列介面共用原生 Codex 狀態。此本機使用者主目錄模式支援受管理的 stdio 與明確的 Unix 傳輸。若已設定 `$CODEX_HOME`，就會使用它，否則使用 `~/.codex`，包括原生驗證、設定、外掛與執行緒。
OpenClaw 會略過其 app-server 驗證設定檔橋接。已驗證的擁有者回合可使用 `codex_threads` 列出（可選擇搭配 `search` 篩選器）、讀取、分支、重新命名、封存與取消封存這些執行緒。請先分支執行緒，再於 OpenClaw 中繼續使用；彼此獨立的 Codex 程序不會協調同一執行緒的並行寫入者。

該 `homeScope` 選擇啟用設定適用於一般的控制框架工作階段。透過 Codex Sessions 建立的 Chat 會改用其私有監督連線，以保留標準分支及未來繼續工作時原生連線的驗證與供應商設定。

在鎖定模型的受監督 Chat 中，`codex_threads` 無法附加不同的分支，也無法封存 Chat 所繫結的原生執行緒。清單與僅中繼資料讀取仍可使用。讀取原始逐字稿需要 `allowRawTranscripts`；停用時，清單搜尋也會遭拒，因為原生搜尋可能比對到逐字稿預覽。若某個不相關的執行緒並非由其他 OpenClaw Chat 擁有，則對它進行重新命名、取消封存、分離式分支與封存需要
`allowWriteControls`。兩個選項都無法略過鎖定的繫結。

OpenClaw 不會為一般本機 app-server 啟動重寫 `HOME`。
由 Codex 執行的子程序（例如 `openclaw`、`gh`、`git`、雲端命令列介面與 Shell 命令）會看到一般的程序主目錄，並可找到使用者主目錄中的設定與權杖。Codex 也可能探索到
`$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json`；該 `.agents` 探索會刻意與操作員主目錄共用，並與隔離的
`~/.codex` 狀態分開。

在預設代理程式範圍中，OpenClaw 外掛與 OpenClaw Skills 快照仍會透過 OpenClaw 自己的外掛登錄檔與 Skills 載入器流通；個人 Codex `~/.codex` 資產則不會。如果 Codex 主目錄中有實用的 Codex 命令列介面 Skills 或外掛，且應成為隔離 OpenClaw 代理程式的一部分，請明確盤點它們：

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。
OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 會繼續指向所選的代理程式或使用者範圍，而 `HOME` 會繼續繼承，讓子程序可使用一般使用者主目錄狀態。

## 動態工具

Codex 動態工具預設採用 `searchable` 載入，並在 `openclaw` 命名空間下透過
`deferLoading: true` 公開。OpenClaw 通常不會公開與 Codex 原生工作區操作或 Codex 自有工具搜尋介面重複的動態工具：

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

當有限的執行階段允許清單停用原生 Code Mode 時，OpenClaw 會傳送空白的執行環境選項。在這種直接、未沙箱化的情況下，OpenClaw 會保留經其原則篩選的 `exec` 和 `process` 工具，作為 Shell 備援。執行階段允許清單與 `codexDynamicToolsExclude` 仍然適用。

其餘大多數 OpenClaw 整合工具，例如訊息、媒體、排程、
瀏覽器、節點、閘道、`heartbeat_respond` 和 `web_search`，均可
透過該命名空間下的 Codex 工具搜尋使用。這能縮小模型的初始
上下文。無論 `codexDynamicToolsLoading` 為何，少數工具仍可直接呼叫，
因為 Codex 工具搜尋可能無法使用，或僅能解析出連接器範圍內的工具集合：
`agents_list`、`sessions_spawn` 和
`sessions_yield`。開發者指示仍會引導一般 Codex 子代理
針對 Codex 原生子代理工作使用原生 `spawn_agent`，而
`sessions_spawn` 仍可用於明確的 OpenClaw 或 ACP 委派。
僅限訊息工具的來源回覆也仍維持直接呼叫，因為這是
回合控制合約。

標記為 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer`
工具）會歸入 `openclaw_direct`。OpenClaw 會將該命名空間加入
Codex 的 `code_mode.direct_only_tool_namespaces` 清單，而不取代
操作員提供的項目。因此，Codex 會在一般執行緒和僅限程式碼模式的執行緒中，
將這些工具公開為 `DirectModelOnly`，而不是透過巢狀的程式碼模式
`tools.*` 呼叫來路由。含有圖片的結果需要此邊界：
巢狀程式碼模式的序列化會將圖片輸出扁平化為文字，
導致下一個電腦操作所需的螢幕截圖遭到捨棄。

只有在連線至無法搜尋延後載入動態工具的自訂
Codex app-server，或偵錯完整工具承載資料時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會與
`appServer.requestTimeoutMs` 分開限制。每個 Codex `item/tool/call` 要求會依
下列順序採用第一個可用的逾時值：

- 正值的單次呼叫 `timeoutMs` 引數。
- 若為 `image_generate`，則使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 若為未設定逾時的 `image_generate`，則使用 120 秒的
  圖片生成預設值。
- 若為媒體理解 `image` 工具，則使用轉換為毫秒的
  `tools.media.image.timeoutSeconds`，或 60 秒的媒體預設值。對圖片理解而言，
  此值適用於要求本身，不會因先前的準備工作而縮短。
- 若為 `message` 工具，則使用固定的 120 秒預設值。
- 90 秒的動態工具預設值。

此監看器是外層動態 `item/tool/call` 預算。供應商特定的
要求逾時會在該呼叫內執行，並保留各自的逾時語意。
動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援的情況下中止
工具訊號，並將失敗的動態工具回應傳回
Codex，讓回合得以繼續，而不會讓工作階段停留在
`processing`。

Codex 接受回合後，以及 OpenClaw 回應回合範圍的
app-server 要求後，執行框架會預期 Codex 在目前回合中持續推進，
並最終以 `turn/completed` 完成原生回合。如果
app-server 靜默達 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw
會盡力中斷 Codex 回合、記錄診斷逾時，並
釋放 OpenClaw 工作階段通道，避免後續聊天訊息排在
過時的原生回合之後。

同一回合的大多數非終止通知都會解除這個短期監看器，
因為 Codex 已證明該回合仍在運作。工具交接使用更長的
工具後閒置預算：在 OpenClaw 傳回 `item/tool/call` 回應後、
在 `commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後的原始助理
進度、原始推理完成或推理進度之後。此防護機制會在已設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘。相同的工具後預算也會延長
Codex 發出下一個目前回合事件前，靜默彙整期間的進度監看器。
推理完成、註解 `agentMessage` 完成，以及工具前的原始推理或助理進度，
後續可能接著自動最終回覆，因此這些情況會使用進度後回覆防護，
而不會立即釋放工作階段通道。只有最終／非註解的已完成
`agentMessage` 項目和工具前的原始助理完成會啟動
助理輸出釋放：如果 Codex 隨後靜默且未出現 `turn/completed`，
OpenClaw 會盡力中斷原生回合並釋放工作階段
通道。可安全重播的 stdio app-server 失敗，包括沒有助理、
工具、作用中項目或副作用證據的回合完成閒置逾時，
會透過全新的 app-server 嘗試重試一次。不安全的逾時仍會停用
卡住的 app-server 用戶端並釋放 OpenClaw 工作階段通道。這些情況也會
清除過時的原生執行緒繫結，而不會自動
重播。完成監看逾時會顯示 Codex 特定的逾時文字：
可安全重播的情況會指出回應可能不完整，而不安全的情況則會要求
使用者在重試前確認目前狀態。公開的逾時診斷包含結構化欄位，
例如最後一個 app-server 通知方法、原始助理回應項目的 id／type／role、
作用中要求／項目數量，以及已啟用的監看狀態。當最後一個通知是
原始助理回應項目時，診斷也會包含有長度限制的助理文字預覽。
其中不會包含原始提示詞或工具內容。

## 模型探索

Codex 外掛預設會向 app-server 查詢可用模型。模型
可用性由 Codex app-server 管理，因此當 OpenClaw 升級內建的
`@openai/codex` 版本，或部署將 `appServer.command` 指向不同的
Codex 二進位檔時，清單可能會變更。可用性也可能限定於特定帳戶。
在執行中的閘道上使用 `/codex models`，即可查看該執行框架和帳戶的即時
目錄。

如果探索失敗或逾時，OpenClaw 會使用內建的後援目錄：

| 模型 id       | 顯示名稱 | 推理強度               |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | 低、中、高、xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | 低、中、高、xhigh |

<Note>
目前內建的執行框架是 `@openai/codex` `0.144.6`。針對該內建 app-server 執行的 `model/list` 探測
傳回了以下公開選擇器資料列：

| 模型 id        | 輸入模態 | 推理強度                             |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | 文字、圖片      | 低、中、高、xhigh、max、ultra |
| `gpt-5.6-terra` | 文字、圖片      | 低、中、高、xhigh、max、ultra |
| `gpt-5.6-luna`  | 文字、圖片      | 低、中、高、xhigh、max        |
| `gpt-5.5`       | 文字、圖片      | 低、中、高、xhigh             |
| `gpt-5.4`       | 文字、圖片      | 低、中、高、xhigh             |
| `gpt-5.4-mini`  | 文字、圖片      | 低、中、高、xhigh             |
| `gpt-5.2`       | 文字、圖片      | 低、中、高、xhigh             |

app-server 目錄可能會回報 `ultra`；OpenClaw 推理控制目前
公開到 `max` 為止的層級。

即時選擇器資料列限定於特定帳戶，並可能隨帳戶、Codex
目錄或內建版本而變更；請執行 `/codex models` 取得目前清單，
不要依賴任何特定時間點的表格。隱藏模型也可能出現在
app-server 目錄中，以供內部或特殊流程使用，但不屬於一般的
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

若希望啟動時避免探測 Codex，並且只使用
後援目錄，請停用探索：

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

## 工作區啟動載入檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。
OpenClaw 不會寫入合成的 Codex 專案文件，也不會依賴 Codex
後援檔名作為角色設定檔，因為 Codex 後援僅在
`AGENTS.md` 不存在時才會套用。

為了與 OpenClaw 工作區維持一致，Codex 執行框架會將其他
啟動載入檔案作為開發者指示轉送，但轉送方式並不完全相同：

- `TOOLS.md` 會作為**繼承的** Codex 開發者指示轉送，因此
  在回合期間產生的原生 Codex 子代理也能看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 會作為**回合範圍**
  的協作指示轉送。原生 Codex 子代理不會繼承這些指示，
  以避免子代理回合取得父代理的角色設定和
  使用者設定檔。
- 精簡的已載入 OpenClaw Skills 清單也會作為回合範圍的
  協作開發者指示轉送，因此原生 Codex 子代理同樣
  不會繼承該清單。
- 不會注入 `HEARTBEAT.md` 內容；心跳偵測回合會取得
  協作模式指引，在該檔案存在且
  非空白時讀取它。
- 當該工作區可使用記憶工具時，不會將設定之代理工作區中的
  `MEMORY.md` 內容貼入原生 Codex 回合輸入；若該內容存在，
  執行框架會在回合範圍的協作開發者指示中加入簡短的工作區記憶
  指引，而當持久記憶相關時，Codex 應使用 `memory_search` 或
  `memory_get`。
  如果工具已停用、記憶搜尋無法使用，或作用中的
  工作區與代理記憶工作區不同，`MEMORY.md` 會改用
  一般的有限回合上下文路徑。
- 若有 `BOOTSTRAP.md`，則會將其作為 OpenClaw 回合輸入的參考
  上下文轉送。

## 環境覆寫

本機測試仍可使用環境覆寫：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，
`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性的本機測試。對於可重複的部署，
建議使用設定，因為這能讓外掛行為與 Codex 執行框架的其餘設定
保存在同一個經過審查的檔案中。

## 相關內容

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
