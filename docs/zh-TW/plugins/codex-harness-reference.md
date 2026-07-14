---
read_when:
    - 你需要所有 Codex 執行框架設定欄位
    - 你正在變更應用程式伺服器的傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex 執行框架啟動、模型探索或環境隔離問題
summary: Codex 測試框架的設定、驗證、探索與應用程式伺服器參考資料
title: Codex 控制框架參考資料
x-i18n:
    generated_at: "2026-07-14T13:55:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c74ff6892d0d57a29849c7a1d760ddce4624903daa41cea063af8e39ad125cb8
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考文件涵蓋官方 `codex` 外掛的詳細設定。
如需設定與路由決策，請先參閱
[Codex 控制框架](/zh-TW/plugins/codex-harness)。

## 外掛設定介面

所有 Codex 控制框架設定都位於 `plugins.entries.codex.config` 之下。

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

| 欄位                       | 預設值                    | 意義                                                                                                                                           |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                   | Codex app-server `model/list` 的模型探索設定。                                                                                           |
| `appServer`                | 受管理的 stdio app-server | 傳輸、命令、驗證、核准、沙箱及逾時設定。一般控制框架預設使用代理程式範圍的狀態。                                                               |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具情境中。                                                                   |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中略過的其他 OpenClaw 動態工具名稱。                                                                                 |
| `codexPlugins`             | 已停用                   | 原生 Codex 外掛／應用程式支援，包括選擇性存取已連結帳號的應用程式。請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。                    |
| `computerUse`              | 已停用                   | Codex Computer Use 設定。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)。                                                            |
| `sessionCatalog`           | 已啟用                   | 側邊欄的原生 Codex 工作階段探索。設定 `enabled: false` 可停用探索，而不停用提供者或控制框架。                                                 |
| `supervision`              | 已停用                   | 面向代理程式的原生工作階段逐字稿與寫入控制政策。請參閱 [Codex 監督](/zh-TW/plugins/codex-supervision)。                                              |

## 監督

原生工作階段探索預設會列出閘道電腦以及已選擇加入的配對節點中，所有未封存的 Codex 工作階段。若只要停用該目錄，請使用：

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

`supervision` 會另行控制面向代理程式的工具：

| 欄位                  | 預設值                  | 意義                                                                                                                                                                                                                                      |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | 啟用面向代理程式的 Codex 監督工具。這不會控制已驗證的操作員工作階段目錄。                                                                                                                            |
| `endpoints`           | 內建本機端點            | 保留的 Codex 監督代理程式與獨立 MCP 工具所使用的相容性及進階端點目標。人員目錄與分支流程會忽略這些目標，並使用從 `appServer` 解析出的監督 App Server。                    |
| `allowRawTranscripts` | `false`                 | 啟用監督時，允許自主代理程式或獨立 MCP 讀取逐字稿及衍生自逐字稿的清單欄位。僅限 `codex_threads` 中繼資料的讀取仍可使用。不控制已驗證的 Control UI 接續操作。                    |
| `allowWriteControls`  | `false`                 | 啟用監督時，允許自主執行 `codex_threads` 的分叉、重新命名、封存與取消封存變更，以及獨立 MCP 的傳送、引導和中斷操作。不會略過其他綁定、主機、狀態或確認檢查。                 |

端點項目接受下列欄位：

| 欄位           | 適用於         | 意義                                                                  |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | 全部          | 穩定的端點 ID。                                                       |
| `label`        | 全部          | 選用的顯示標籤。                                                      |
| `transport`    | 全部          | `"stdio-proxy"` 或 `"websocket"`。                            |
| `command`      | `stdio-proxy` | 選用的 App Server 命令。                                              |
| `args`         | `stdio-proxy` | 選用的命令引數。                                                      |
| `cwd`          | `stdio-proxy` | 選用的子程序工作目錄。                                                |
| `url`          | `websocket`   | 必填的 WebSocket 或受支援的本機通訊端 URL。                           |
| `authTokenEnv` | `websocket`   | 選用的環境變數，其值用於驗證端點。                                    |

**Codex 工作階段**頁面使用外掛的監督 App Server，且只顯示未封存的工作階段。若未明確設定 `appServer` 連線，該連線會由使用者家目錄的 stdio 管理。已儲存或閒置的本機資料列，可以使用截至最後一個已保存終止來源回合為止、長度受限的使用者與助理歷程建立模型鎖定的聊天。其私有綁定會讓快照分叉、標準 `appServer` 來源分支、歷程注入及後續回合維持在該連線上。第一次標準啟動會使用分叉傳回的配對。之後繼續時會略過 OpenClaw 模型與提供者覆寫，使 Codex 還原標準執行緒已保存的配對；另一項原生變更可以更新該配對，但外層模型與備援鏈絕不會取代它。確認沒有其他執行器後，可以封存已儲存和閒置的資料列，除非另一個作用中的 OpenClaw 綁定擁有完全相同的目標，或擁有其某個未封存的衍生後代。OpenClaw 會遵循 Codex 的後代分頁，並在列舉錯誤、循環或耗盡安全限制時採取封閉式失敗。確認仍會涵蓋未知的原生用戶端，以及從狀態判定到封存之間的競爭條件。受監督且模型鎖定的聊天在保護原生綁定期間無法刪除。作用中的來源無法建立分支或封存，但仍可開啟既有的受監督聊天。所有配對節點資料列一律維持唯讀；節點傳輸尚未提供控制框架所需的串流生命週期。

單獨設定 `appServer.homeScope: "user"` 只會變更受管理控制框架程序所使用的 Codex 家目錄；不會發布機群目錄。啟用監督不會變更控制框架的預設值。相反地，若沒有明確的 `appServer` 連線設定，獨立的監督連線預設會使用受管理的使用者家目錄 stdio。該連線會遵循明確設定。待處理與已提交的受監督綁定會在每個回合保留該連線；若監督已停用，或連線／生命週期發生漂移，則會採取封閉式失敗，而不是退回代理程式家目錄的控制框架。預設連線會與原生 Codex 用戶端共用已儲存的工作階段，但不共用其程序本機的活動狀態。

舊版 `plugins.entries.codex-supervisor` 設定已淘汰。執行
`openclaw doctor --fix`，將舊項目、端點定義、政策旗標及外掛允許／拒絕參照遷移至此區塊。發生衝突時，以明確的標準 `codex.config.supervision` 值為準。

## App-server 傳輸

對於一般控制框架回合，OpenClaw 會啟動隨官方外掛提供的受管理 Codex 二進位檔（目前為 `@openai/codex` `0.144.3`）：

```bash
codex app-server --listen stdio://
```

這會將 app-server 版本繫結至官方 `codex` 外掛，而非本機可能另外安裝的任意 Codex 命令列介面。僅在刻意要使用不同的可執行檔時，才設定 `appServer.command`。即使已安裝 macOS 桌面應用程式套件，使用預設隔離代理程式家目錄的一般受管理回合仍會優先使用此固定版本套件。啟用 [Computer Use](/zh-TW/plugins/codex-computer-use) 時，或當 `homeScope` 為 `"user"` 且可載入原生 Computer Use 狀態時，受管理的啟動程序會改為優先使用擁有所需 macOS 權限的桌面應用程式二進位檔。當隔離代理程式家目錄的有效 Codex 設定啟用原生 Computer Use 時，也會套用相同的桌面優先規則。若未安裝桌面應用程式套件，OpenClaw 會退回固定版本套件的二進位檔。

可執行檔移交與原生設定隔離機制，會協調同一個執行中閘道程序內的用戶端。其他程序變更原生 Codex 外掛設定後，請重新啟動閘道。

監督會解析獨立的連線。若沒有明確的 `appServer` 連線設定，它會使用搭配 `homeScope: "user"` 的受管理 stdio；一般控制框架則仍使用搭配 `homeScope: "agent"` 的受管理 stdio。兩條路徑都會遵循明確連線設定。若一般控制框架應與原生用戶端共用 `$CODEX_HOME`（或 `~/.codex`），請明確設定 `homeScope: "user"`。無論一般控制框架的預設值為何，私有受監督綁定都會使用監督連線。各個獨立 App Server 程序會分別保留即時狀態與核准狀態。

若 app-server 已在執行，請使用 WebSocket 傳輸：

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

| 欄位                                         | 預設值                                                | 意義                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確設定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依各 OpenClaw 代理程式隔離一般的測試框架狀態。`"user"` 是明確的選擇加入設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機標準輸入輸出或 Unix 傳輸。對於獨立的監督連線，未設定的值在使用標準輸入輸出或 Unix 時會解析為 `"user"`，使用 WebSocket 時則會解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                   | 標準輸入輸出傳輸所使用的可執行檔。保留未設定即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | 標準輸入輸出傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket App Server URL 或 `unix://` URL。明確指定空白的 Unix 路徑會選取使用者家目錄中的標準控制通訊端。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承的環境後，要從已啟動的標準輸入輸出 App Server 程序中移除的額外環境變數名稱。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex App Server 工作區根目錄。設定後，OpenClaw 會從解析後的 OpenClaw 工作區推斷本機工作區根目錄、在此遠端根目錄下保留目前 cwd 的後綴，並只將最終的 App Server cwd 傳送給 Codex。若 cwd 位於解析後的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端 App Server。 |
| `requestTimeoutMs`                            | `60000`                                                | App Server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或在回合範圍的 App Server 要求之後，OpenClaw 等待 `turn/completed` 時所使用的靜默時間窗。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具使用後的原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護機制。適用於可信任或高負載的工作，其中工具使用後的整合處理可合理地維持靜默，且時間長於最終助理回覆的時間預算。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO | YOLO 或經 guardian 審查執行的預設集。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准原則       | 傳送至執行緒啟動、繼續及回合的原生 Codex 核准原則。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱  | 傳送至執行緒啟動及繼續的原生 Codex 沙箱模式。作用中的 OpenClaw 沙箱會將 `danger-full-access` 回合限縮為 Codex `workspace-write`；回合的網路旗標會遵循 OpenClaw 沙箱的輸出流量設定。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者               | 在允許的情況下，使用 `"auto_review"` 讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 目前程序目錄                              | 省略 `--cwd` 時，`/codex bind` 所使用的工作區。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex App Server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，而 `null` 會清除覆寫值。舊版 `"fast"` 會被接受並視為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇加入 Codex 權限設定檔網路功能，以供 App Server 命令使用。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並以 `default_permissions` 選取該設定，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入功能，會向支援的 Codex App Server 註冊由 OpenClaw 沙箱支援的 Codex 環境，使原生 Codex 執行能在作用中的 OpenClaw 沙箱內運作。                                                                                                                                                                                                            |

`appServer.networkProxy` 採用明確設定，因為它會變更 Codex 沙箱
合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定
`features.network_proxy.enabled` 和 `default_permissions`，讓產生的權限
設定檔可以啟動由 Codex 管理的網路功能。OpenClaw 預設會根據
設定檔內容產生具抗碰撞性的 `openclaw-network-<fingerprint>` 設定檔名稱；
只有需要穩定的本機名稱時，才使用 `profileName`。

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

如果一般的 app-server 執行階段會是 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會改用工作區型檔案系統存取。
Codex 管理的網路強制措施採用沙箱化網路，因此完整存取設定檔無法保護對外流量。

此外掛會封鎖較舊或未標示版本的 app-server 交握：Codex app-server
必須回報穩定版本 `0.143.0` 或更新版本。

OpenClaw 會將非迴路位址的 WebSocket app-server URL 視為遠端，並要求
透過 `appServer.authToken` 或 `Authorization` 標頭提供帶有身分資訊的
WebSocket 驗證。`appServer.authToken` 和每個 `appServer.headers.*`
值都可以是 SecretInput；在 OpenClaw 建立 app-server 啟動選項之前，
密鑰執行階段會解析 SecretRef 和環境變數簡寫，而未解析的結構化 SecretRef
會在傳送任何權杖或標頭前失敗。設定原生 Codex 外掛時，OpenClaw 會使用
已連線 app-server 的外掛控制平面安裝或重新整理這些外掛，接著重新整理
應用程式清單，讓 Codex 執行緒能看見外掛擁有的應用程式。`app/list`
仍是具權威性的清單與中繼資料來源，但即使 Codex 目前將某個列出的可存取
應用程式標示為停用，OpenClaw 原則仍會決定 `thread/start` 是否傳送
`config.apps[appId].enabled = true`。未知或缺少的應用程式 ID 仍會以失敗關閉；此路徑只會
透過 `plugin/install` 啟用市集外掛並重新整理清單。只將 OpenClaw 連線至
你信任其可接受 OpenClaw 管理之外掛安裝與應用程式清單重新整理的遠端
app-server。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。這種受信任的本機操作者模式，能讓無人值守的
OpenClaw 回合與心跳偵測持續進行，而不會出現無人在場回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、審查者或沙箱值，
OpenClaw 會改將隱含預設值視為 guardian，並選取允許的 guardian 權限。
`tools.exec.mode: "auto"` 也會強制採用 guardian 審查的 Codex 核准，且不會保留
不安全的舊版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；
若要刻意採用不需核准的模式，請設定 `tools.exec.mode: "full"`。
同一需求檔案中符合主機名稱的 `[[remote_sandbox_config]]` 項目，也會套用於
沙箱預設值的決策。

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

當這些值獲允許時，`guardian` 預設集會展開為
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
個別原則欄位會覆寫 `mode`。較舊的 `guardian_subagent`
審查者值仍可作為相容性別名接受，但新設定應使用 `auto_review`。

啟用 OpenClaw 沙箱時，本機 Codex app-server 程序仍會在閘道主機上執行。
因此，OpenClaw 會在該回合停用 Codex 原生 Code Mode、使用者 MCP 伺服器
及由應用程式支援的外掛執行，而不會將 Codex 主機端沙箱視為等同於
OpenClaw 沙箱後端。當一般的 exec/process 工具可用時，Shell 存取會透過
OpenClaw 沙箱支援的動態工具公開，例如 `sandbox_exec` 和
`sandbox_process`。

<Note>
在以 Docker 為基礎的 OpenClaw 沙箱主機上（`agents.defaults.sandbox.mode` 設為
Docker 後端），`openclaw doctor` 會探測主機是否允許非特權使用者命名空間，
以及在停用 Docker 沙箱網路輸出時所需的網路命名空間；沙箱容器內巢狀的
Codex `bwrap` 需要這些命名空間才能執行 `workspace-write`
Shell。探測失敗通常會在 Ubuntu/AppArmor 主機上顯示為
`bwrap: setting up uid map: Permission denied` 或 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。請修正回報的 OpenClaw
服務使用者主機命名空間原則，並重新啟動閘道；相較於主機全域的
`kernel.apparmor_restrict_unprivileged_userns=0` 備援方案，應優先為服務程序使用範圍受限的 AppArmor
設定檔，且不要只為滿足巢狀 `bwrap` 而授予更廣泛的 Docker
容器權限。
</Note>

## 沙箱化原生執行

穩定預設行為是以失敗關閉：啟用 OpenClaw 沙箱會停用原本會從 Codex
app-server 主機執行的原生 Codex 執行介面。只有在你想嘗試將 Codex
遠端環境支援搭配 OpenClaw 沙箱後端使用時，才使用
`appServer.experimental.sandboxExecServer: true`。此預覽路徑適用於所有支援的 Codex app-server 版本。

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

啟用此旗標且目前的 OpenClaw 工作階段位於沙箱中時，OpenClaw 會啟動一個
由作用中沙箱支援的本機迴路 exec-server，向 Codex app-server 註冊，
並使用該 OpenClaw 擁有的環境啟動 Codex 執行緒與回合。如果 app-server
無法註冊環境，該次執行會以失敗關閉，而不會無提示地退回主機執行。

此預覽路徑僅限本機使用。除非遠端 WebSocket app-server 與迴路
exec-server 在同一部主機上執行，否則無法連線，因此 OpenClaw 會拒絕
這種組合。

## 驗證與環境隔離

在預設的每代理程式主目錄中，驗證會依下列順序選取：

1. 代理程式的明確 OpenClaw Codex 驗證設定檔。
2. 該代理程式 Codex 主目錄中 app-server 的現有帳號。
3. 僅限本機 stdio app-server 啟動：當 app-server 帳號
   不存在且仍需要 OpenAI 驗證時，依序使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱型 Codex 驗證設定檔（OAuth 或權杖認證資訊
類型）時，會從產生的 Codex 子程序中移除 `CODEX_API_KEY` 和
`OPENAI_API_KEY`。這樣能讓閘道層級的 API 金鑰繼續供嵌入或直接
OpenAI 模型使用，同時避免原生 Codex app-server 回合意外透過 API 計費。

明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰備援會使用 app-server
登入，而非繼承子程序環境。WebSocket app-server 連線不會收到閘道環境的
API 金鑰備援；請使用明確的驗證設定檔或遠端 app-server 自己的帳號。

stdio app-server 啟動預設會繼承 OpenClaw 的程序環境。OpenClaw 擁有
Codex app-server 帳號橋接，並將 `CODEX_HOME` 設為該代理程式
OpenClaw 狀態下的每代理程式目錄。如此可將 Codex 設定、帳號、外掛快取／
資料及執行緒狀態限制於 OpenClaw 代理程式範圍內，而不會從操作者個人的
`~/.codex` 主目錄滲入。

設定 `appServer.homeScope: "user"`，即可與 Codex Desktop 和命令列介面共用原生
Codex 狀態。此本機使用者主目錄模式支援受管理的 stdio 和明確的 Unix
傳輸。若已設定 `$CODEX_HOME`，便使用該值，否則使用
`~/.codex`；其中包括原生驗證、設定、外掛及執行緒。
OpenClaw 會略過 app-server 的驗證設定檔橋接。經驗證的擁有者回合可使用
`codex_threads` 列出（可搭配選用的 `search` 篩選器）、
讀取、分支、重新命名、封存及取消封存這些執行緒。在 OpenClaw 中繼續執行
某個執行緒前，請先建立分支；獨立的 Codex 程序不會協調同一執行緒的並行
寫入者。

該 `homeScope` 選用設定適用於一般工具框架工作階段。透過 Codex
Sessions 建立的 Chat 會改用其私有監督連線，這會為標準分支及未來恢復保留
原生連線的驗證與提供者設定。

在模型鎖定的受監督 Chat 中，`codex_threads` 無法附加其他分支，也無法
封存該 Chat 綁定的原生執行緒。清單與僅限中繼資料的讀取仍可使用。原始逐字稿
讀取需要 `allowRawTranscripts`；停用時也會拒絕清單搜尋，因為原生搜尋可能
比對逐字稿預覽。若要重新命名、取消封存、建立分離分支，或封存不屬於其他
OpenClaw Chat 的無關執行緒，則需要 `allowWriteControls`。兩個選項都無法
略過鎖定的綁定。

OpenClaw 不會針對一般本機 app-server 啟動重寫 `HOME`。
Codex 執行的子程序（例如 `openclaw`、`gh`、
`git`、雲端命令列介面及 Shell 命令）會看到一般程序主目錄，
並能找到使用者主目錄中的設定與權杖。Codex 也可能探索到
`$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；該 `.agents`
探索刻意與操作者主目錄共用，並與隔離的 `~/.codex` 狀態分開。

在預設代理程式範圍內，OpenClaw 外掛和 OpenClaw skill 快照仍會透過
OpenClaw 自己的外掛登錄與 skill 載入器傳遞；個人的 Codex
`~/.codex` 資產則不會。如果 Codex 主目錄中有實用的 Codex
命令列介面 skills 或外掛，且應納入隔離的 OpenClaw 代理程式，請明確盤點：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

如果部署需要額外的環境隔離，請將這些變數新增至 `appServer.clearEnv`：

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。OpenClaw
會在本機啟動正規化期間，從此清單中移除 `CODEX_HOME` 和
`HOME`：`CODEX_HOME` 會繼續指向選定的代理程式或
使用者範圍，而 `HOME` 會繼續被繼承，讓子程序可使用一般
使用者主目錄狀態。

## 動態工具

Codex 動態工具預設採用 `searchable` 載入，並透過
`openclaw` 命名空間與 `deferLoading: true` 公開。OpenClaw
不會公開與 Codex 原生工作區操作或 Codex 自身工具搜尋介面重複的動態工具：

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
`heartbeat_respond` 和 `web_search`，都可透過該命名空間中的 Codex
工具搜尋使用。這能縮小初始模型脈絡。無論 `codexDynamicToolsLoading` 為何，仍有
一小組工具可直接呼叫，因為 Codex 工具搜尋可能無法使用，或只解析出連接器
範圍：`agents_list`、`sessions_spawn` 和
`sessions_yield`。開發人員指示仍會引導一般 Codex 子代理程式使用原生
`spawn_agent` 處理 Codex 原生子代理程式工作，而
`sessions_spawn` 仍可用於明確的 OpenClaw 或 ACP 委派。
僅使用訊息工具的來源回覆也會保持直接呼叫，因為這是回合控制合約。

標記為 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer`
工具）會歸入 `openclaw_direct`。OpenClaw 會將該命名空間新增至
Codex 的 `code_mode.direct_only_tool_namespaces` 清單，而不取代
操作員提供的項目。因此，Codex 會在一般及僅限程式碼模式的執行緒中，將這些工具公開為
`DirectModelOnly`，而不是透過巢狀的 Code Mode `tools.*` 呼叫
來路由。此界線是包含影像的結果所必需：巢狀 Code Mode 序列化會將影像輸出攤平成
文字，導致下一個電腦操作所需的螢幕截圖遺失。

只有在連線至無法搜尋延遲動態工具的自訂
Codex app-server，或偵錯完整工具承載資料時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 所擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制。每個 Codex `item/tool/call` 要求會依照
以下順序使用第一個可用的逾時：

- 正值的逐次呼叫 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的
  影像生成預設值。
- 對於媒體理解 `image` 工具，使用轉換為毫秒的 `tools.media.image.timeoutSeconds`，
  或 60 秒的媒體預設值。對於影像理解，此值套用於要求本身，且不會因
  先前的準備工作而縮短。
- 對於 `message` 工具，使用固定的 120 秒預設值。
- 90 秒的動態工具預設值。

此看門狗是外層動態 `item/tool/call` 預算。供應商特定的
要求逾時會在該呼叫內執行，並保有各自的逾時語意。
動態工具預算上限為 600000 ms。發生逾時時，OpenClaw 會在支援的情況下中止
工具訊號，並向 Codex 傳回失敗的動態工具回應，讓該回合可以繼續，而不是讓工作階段停留在
`processing`。

Codex 接受一個回合後，以及 OpenClaw 回應回合範圍的
app-server 要求後，執行框架預期 Codex 會推進目前回合，
並最終以 `turn/completed` 完成原生回合。如果
app-server 靜默達 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw
會盡力中斷 Codex 回合、記錄診斷逾時，並
釋放 OpenClaw 工作階段通道，避免後續聊天訊息排在過時的原生回合
之後。

同一回合的大多數非終止通知會解除該短期看門狗，
因為 Codex 已證明該回合仍在運作。工具交接使用較長的
工具後閒置預算：在 OpenClaw 傳回 `item/tool/call` 回應後、
在 `commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及工具後的原始助理
進度、原始推理完成或推理進度之後。此防護會在有設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘。相同的工具後預算也會延長
進度看門狗，涵蓋 Codex 發出下一個目前回合事件之前的靜默整合期間。
推理完成、commentary `agentMessage`
完成，以及工具前的原始推理或助理進度之後，可能接續
自動最終回覆，因此會使用進度後回覆防護，
而不是立即釋放工作階段通道。只有最終／非 commentary
已完成的 `agentMessage` 項目，以及工具前的原始助理完成，才會啟動
助理輸出釋放：如果 Codex 隨後靜默且未發出 `turn/completed`，
OpenClaw 會盡力中斷原生回合並釋放工作階段
通道。可安全重播的 stdio app-server 失敗，包括在沒有助理、
工具、作用中項目或副作用證據時發生的回合完成閒置
逾時，會在全新的 app-server 嘗試中重試一次。不安全的逾時仍會淘汰
卡住的 app-server 用戶端，並釋放 OpenClaw 工作階段通道。它們也會
清除過時的原生執行緒繫結，而不會自動
重播。完成監看逾時會顯示 Codex 特定的逾時文字：
可安全重播的情況會指出回應可能不完整，而不安全的情況會要求
使用者先驗證目前狀態再重試。公開逾時診斷
包含結構化欄位，例如最後一個 app-server 通知方法、
原始助理回應項目的 id/type/role、作用中的要求／項目數量，以及
已啟動的監看狀態。當最後一個通知是原始助理回應
項目時，也會包含長度受限的助理文字預覽。這些診斷不會
包含原始提示或工具內容。

## 模型探索

Codex 外掛預設會向 app-server 查詢可用模型。模型
可用性由 Codex app-server 管理，因此當
OpenClaw 升級隨附的 `@openai/codex` 版本，或部署將
`appServer.command` 指向不同的 Codex 二進位檔時，清單可能會變更。可用性也可能
依帳號而異。請在執行中的閘道上使用 `/codex models`，以查看該執行框架與帳號的即時
目錄。

如果探索失敗或逾時，OpenClaw 會使用隨附的備援目錄：

| 模型 ID       | 顯示名稱 | 推理強度                 |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
目前隨附的執行框架是 `@openai/codex` `0.144.3`。針對該隨附 app-server 的 `model/list` 探測
傳回下列公開選擇器資料列：

| 模型 ID        | 輸入模態 | 推理強度                             |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | text, image      | low, medium, high, xhigh             |
| `gpt-5.2`       | text, image      | low, medium, high, xhigh             |

app-server 目錄可能會回報 `ultra`；OpenClaw 推理控制目前
公開到 `max` 為止的層級。

即時選擇器資料列依帳號而異，且可能隨帳號、Codex
目錄或隨附版本而變更；請執行 `/codex models` 取得目前清單，而不要
依賴任何特定時間點的表格。隱藏模型也可能出現在
app-server 目錄中，用於內部或專門流程，而不是一般的
模型選擇器選項。
</Note>

在 `plugins.entries.codex.config.discovery` 下調整探索：

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

如果你希望啟動時避免探測 Codex，並僅使用
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
OpenClaw 不會寫入合成的 Codex 專案文件檔案，也不會依賴 Codex
的備援檔名作為角色設定檔，因為 Codex 備援只有在
`AGENTS.md` 缺少時才會套用。

為了與 OpenClaw 工作區保持一致，Codex 執行框架會將其他
啟動檔案轉送為開發者指示，但方式並不完全相同：

- `TOOLS.md` 會作為**繼承的** Codex 開發者指示轉送，因此
  該回合期間產生的原生 Codex 子代理程式也能看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 會作為**回合範圍**
  的協作指示轉送。原生 Codex 子代理程式不會繼承這些指示，
  以避免子代理程式回合取得父代理程式的角色設定與
  使用者設定檔。
- 精簡的已載入 OpenClaw Skills 清單也會作為回合範圍的
  協作開發者指示轉送，因此原生 Codex 子代理程式同樣不會
  繼承它。
- 不會注入 `HEARTBEAT.md` 內容；若該檔案存在且
  非空白，心跳偵測回合會取得一個協作模式指標，要求讀取該檔案。
- 當該工作區可使用記憶工具時，已設定代理程式工作區中的 `MEMORY.md` 內容
  不會貼入原生 Codex 回合輸入；若其存在，執行框架會在回合範圍的協作開發者指示中
  新增一個簡短的工作區記憶指標，而 Codex 應在需要持久記憶時使用
  `memory_search` 或 `memory_get`。
  如果工具已停用、記憶搜尋不可用，或作用中的
  工作區與代理程式記憶工作區不同，`MEMORY.md` 會改用
  一般的受限回合內容路徑。
- 如果存在 `BOOTSTRAP.md`，則會將其作為 OpenClaw 回合輸入參考
  內容轉送。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，
`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，建議使用設定，
因為這能讓外掛行為與 Codex 執行框架的其餘設定保存在
同一個經過審查的檔案中。

## 相關內容

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
