---
read_when:
    - 你需要所有 Codex 控制框架的設定欄位
    - 您正在變更應用程式伺服器的傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex 測試框架啟動、模型探索或環境隔離問題
summary: Codex 測試框架的設定、驗證、探索與應用程式伺服器參考資料
title: Codex 控制框架參考資料
x-i18n:
    generated_at: "2026-07-11T21:33:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考資料涵蓋官方 `codex` 外掛的詳細設定。
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

| 欄位                       | 預設值                     | 含義                                                                                                                                                    |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                     | Codex app-server `model/list` 的模型探索設定。                                                                                                          |
| `appServer`                | 受管理的 stdio app-server | 傳輸、命令、驗證、核准、沙箱及逾時設定。一般控制框架預設使用代理程式範圍的狀態。                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`             | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具內容中。                                                                                    |
| `codexDynamicToolsExclude` | `[]`                       | 要從 Codex app-server 輪次中省略的其他 OpenClaw 動態工具名稱。                                                                                          |
| `codexPlugins`             | 已停用                     | 原生 Codex 外掛／應用程式支援，包括選擇加入後存取已連線帳戶的應用程式。請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。                           |
| `computerUse`              | 已停用                     | Codex 電腦操作設定。請參閱 [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)。                                                                               |
| `supervision`              | 已停用                     | 未封存的原生工作階段目錄、本機分支接續及代理程式工具政策。請參閱 [Codex 監督](/plugins/codex-supervision)。                                               |

## 監督

監督功能會列出閘道電腦及已選擇加入的配對節點中，未封存的 Codex 工作階段。
請將其與代理程式控制框架分開啟用：

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

| 欄位                  | 預設值             | 含義                                                                                                                                                                                                                         |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`            | 公布本機工作階段目錄，並在閘道上彙整已選擇加入的配對節點目錄，以供 Codex 工作階段頁面使用。                                                                                                                                 |
| `endpoints`           | 內建本機端點       | 為保留的 Codex 監督代理程式和獨立 MCP 工具提供相容性與進階端點目標。人工操作的目錄與分支流程會忽略這些目標，改用從 `appServer` 解析出的監督 App Server。                                                                      |
| `allowRawTranscripts` | `false`            | 啟用監督時，允許自主代理程式或獨立 MCP 讀取逐字記錄及其衍生的清單欄位。僅含中繼資料的 `codex_threads` 讀取仍可使用。這不會控制經驗證的控制介面接續作業。                                                                       |
| `allowWriteControls`  | `false`            | 啟用監督時，允許自主 `codex_threads` 分叉、重新命名、封存及取消封存變更，以及獨立 MCP 的傳送、引導和中斷操作。這不會略過其他繫結、主機、狀態或確認檢查。                                                                     |

端點項目接受以下欄位：

| 欄位           | 適用範圍      | 含義                                               |
| -------------- | ------------- | -------------------------------------------------- |
| `id`           | 全部          | 穩定的端點 ID。                                    |
| `label`        | 全部          | 選用的顯示標籤。                                   |
| `transport`    | 全部          | `"stdio-proxy"` 或 `"websocket"`。                 |
| `command`      | `stdio-proxy` | 選用的 App Server 命令。                           |
| `args`         | `stdio-proxy` | 選用的命令引數。                                   |
| `cwd`          | `stdio-proxy` | 選用的子行程工作目錄。                             |
| `url`          | `websocket`   | 必要的 WebSocket 或支援的本機通訊端 URL。          |
| `authTokenEnv` | `websocket`   | 選用的環境變數，其值用於驗證端點。                 |

**Codex 工作階段**頁面使用此外掛的監督 App Server，且只顯示未封存的工作階段。若未明確設定 `appServer` 連線，該連線會使用受管理的使用者主目錄 stdio。已儲存或閒置的本機資料列，可透過截至最後一個終止並已持久儲存的來源輪次之有限使用者與助理歷程，建立模型鎖定的聊天。其私人繫結會將快照分叉、標準 `appServer` 來源分支、歷程注入及後續輪次維持在該連線上。第一次標準啟動會使用分叉所傳回的配對。後續接續會省略 OpenClaw 模型與提供者覆寫，讓 Codex 還原標準執行緒已持久儲存的配對；個別原生變更可以更新該配對，但外層模型與備援鏈絕不會取代它。確認沒有其他執行器後，即可封存已儲存及閒置的資料列；但如果另一個作用中的 OpenClaw 繫結擁有完全相同的目標，或其任一未封存的衍生後代，則不可封存。OpenClaw 會遵循 Codex 的後代分頁機制，並在列舉錯誤、循環或安全上限耗盡時採取封閉失敗。確認程序仍會涵蓋未知的原生用戶端，以及狀態轉為封存之間的競態條件。受監督且模型鎖定的聊天若正在保護原生繫結，就無法刪除。作用中的來源無法建立分支或被封存，但仍可開啟現有的受監督聊天。所有配對節點資料列皆維持唯讀；節點傳輸目前尚未提供控制框架所需的串流生命週期。

僅設定 `appServer.homeScope: "user"` 只會變更受管理控制框架行程所使用的 Codex 主目錄；它不會公布整個節點群的目錄。啟用監督不會變更控制框架的預設值。相反地，若沒有明確的 `appServer` 連線設定，獨立的監督連線會預設使用受管理的使用者主目錄 stdio。該連線會遵循明確設定。待處理及已提交的受監督繫結會在每個輪次中保留該連線；監督停用或連線／生命週期發生漂移時，會採取封閉失敗，而不是退回代理程式主目錄的控制框架。預設連線會與原生 Codex 用戶端共用已儲存的工作階段，但不會共用其行程本機的活動狀態。

舊版 `plugins.entries.codex-supervisor` 設定已停用。執行
`openclaw doctor --fix`，將舊項目、端點定義、政策旗標及外掛允許／拒絕參照遷移至此區塊。發生衝突時，以明確的標準 `codex.config.supervision` 值為準。

## App-server 傳輸

對於一般控制框架輪次，OpenClaw 會啟動官方外掛隨附的受管理 Codex 二進位檔（目前為 `@openai/codex` `0.144.1`）：

```bash
codex app-server --listen stdio://
```

這會使 app-server 版本與官方 `codex` 外掛保持一致，而不是取決於本機另外安裝的 Codex 命令列介面版本。只有在刻意使用不同的可執行檔時，才設定 `appServer.command`。即使已安裝 macOS 桌面應用程式套件，使用預設隔離代理程式主目錄的一般受管理輪次，也會優先使用此鎖定版本的套件。啟用[電腦操作](/zh-TW/plugins/codex-computer-use)時，或 `homeScope` 為 `"user"` 且可載入原生電腦操作狀態時，受管理啟動程序會改為優先使用擁有所需 macOS 權限的桌面應用程式二進位檔。若隔離代理程式主目錄的有效 Codex 設定啟用了原生電腦操作，也會套用相同的桌面優先規則。如果未安裝桌面應用程式套件，OpenClaw 會退回使用鎖定版本的套件二進位檔。

可執行檔交接與原生設定隔離機制，會協調單一執行中閘道行程內的用戶端。其他行程變更原生 Codex 外掛設定後，請重新啟動閘道。

監督功能會解析個別連線。若沒有明確的 `appServer` 連線設定，它會使用 `homeScope: "user"` 的受管理 stdio；一般控制框架則維持使用 `homeScope: "agent"` 的受管理 stdio。兩條路徑都會遵循明確的連線設定。若一般控制框架應與原生用戶端共用 `$CODEX_HOME`（或 `~/.codex`），請明確設定 `homeScope: "user"`。私人受監督繫結無論一般控制框架的預設值為何，都會使用監督連線。各自獨立的 App Server 行程會保留分開的即時狀態與核准狀態。

對於已在執行中的 app-server，請使用 WebSocket 傳輸：

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

| 欄位                                          | 預設值                                                 | 說明                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確指定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                                  |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會為每個 OpenClaw 代理程式隔離一般執行框架狀態。`"user"` 是明確的選擇加入設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機 stdio 或 Unix 傳輸。對於獨立的監督連線，未設定的值在 stdio 或 Unix 下會解析為 `"user"`，在 WebSocket 下則解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                                  |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | 未設定                                                 | WebSocket App Server URL 或 `unix://` URL。明確指定空白 Unix 路徑時，會選用標準的使用者家目錄控制通訊端。                                                                                                                                                                                                                                                                                         |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建構繼承的環境後，從所啟動的 stdio app-server 程序中移除的額外環境變數名稱。                                                                                                                                                                                                                                                                                                           |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會根據解析出的 OpenClaw 工作區推斷本機工作區根目錄、保留目前 cwd 在此遠端根目錄下的後綴，並僅將最終的 app-server cwd 傳送給 Codex。若 cwd 位於解析出的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送給遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或發出回合範圍的 app-server 請求後，OpenClaw 等待 `turn/completed` 時所使用的靜默時間窗口。                                                                                                                                                                                                                                                                                 |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後的原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。適用於受信任或繁重的工作負載，其工具後綜整可合理地維持靜默，時間長於最終助理輸出預算。                                                                                                           |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO               | YOLO 或經守護者審查之執行的預設組態。                                                                                                                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准政策                       | 傳送至執行緒啟動、繼續及回合的原生 Codex 核准政策。                                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙箱              | 傳送至執行緒啟動與繼續的原生 Codex 沙箱模式。啟用中的 OpenClaw 沙箱會將 `danger-full-access` 回合限制為 Codex `workspace-write`；回合的網路旗標會遵循 OpenClaw 沙箱的輸出流量設定。                                                                                                                                                    |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者                          | 使用 `"auto_review"` 可在允許時讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                                     |
| `defaultWorkspaceDir`                         | 目前程序目錄                                           | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                                   |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，而 `null` 會清除覆寫。舊版 `"fast"` 會視為 `"priority"` 接受。                                                                                                                                                                                                                                          |
| `networkProxy`                                | 已停用                                                 | 選擇加入 Codex 權限設定檔網路功能，供 app-server 命令使用。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並透過 `default_permissions` 選取該設定，而非傳送 `sandbox`。                                                                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入功能，會向受支援的 Codex app-server 註冊由 OpenClaw 沙箱支援的 Codex 環境，使原生 Codex 執行可在啟用中的 OpenClaw 沙箱內運作。                                                                                                                                                                                                                                                       |

`appServer.networkProxy` 必須明確設定，因為它會變更 Codex 沙箱
契約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動由 Codex 管理的網路功能。OpenClaw 預設會根據
設定檔內容產生可抵抗名稱衝突的 `openclaw-network-<fingerprint>` 設定檔名稱；僅在
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

如果一般的 app-server 執行階段原本會使用 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會改用工作區式的檔案系統存取。
Codex 管理的網路強制控管採用沙箱化網路，因此完整存取設定檔無法保護
對外流量。

此外掛會封鎖較舊或未提供版本資訊的 app-server 交握：Codex app-server
必須回報穩定版本 `0.143.0` 或更新版本。

OpenClaw 會將非迴環位址的 WebSocket app-server URL 視為遠端，並要求透過
`appServer.authToken` 或 `Authorization` 標頭提供具身分資訊的 WebSocket
驗證。`appServer.authToken` 與每個 `appServer.headers.*` 值都可以是
SecretInput；在 OpenClaw 建立 app-server 啟動選項前，密鑰執行階段會解析
SecretRefs 與環境變數簡寫，而未解析的結構化 SecretRefs 會在傳送任何
權杖或標頭前失敗。設定原生 Codex 外掛後，OpenClaw 會使用已連線
app-server 的外掛控制平面安裝或重新整理這些外掛，接著重新整理應用程式
清單，讓 Codex 執行緒能看見由外掛擁有的應用程式。`app/list` 仍是具權威性
的清單與中繼資料來源，但即使 Codex 目前將某個已列出且可存取的應用程式
標示為停用，OpenClaw 政策仍會決定 `thread/start` 是否傳送
`config.apps[appId].enabled = true`。未知或缺少的應用程式 ID 仍會以封閉
方式失敗；此路徑只會透過 `plugin/install` 啟用市集外掛並重新整理清單。
只將 OpenClaw 連線至受信任、可接受 OpenClaw 管理之外掛安裝與應用程式
清單重新整理的遠端 app-server。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作員模式可讓無人值守的
OpenClaw 回合與心跳偵測持續進行，而不會出現無人在場可回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、審核者或沙箱值，
OpenClaw 會改將隱含預設值視為守護模式，並選取允許的守護模式權限。
`tools.exec.mode: "auto"` 也會強制使用守護模式審核的 Codex 核准，且不會
保留不安全的舊版 `approvalPolicy: "never"` 或
`sandbox: "danger-full-access"` 覆寫；若要刻意採用不需核准的模式，請設定
`tools.exec.mode: "full"`。同一需求檔案中符合主機名稱的
`[[remote_sandbox_config]]` 項目，也會納入沙箱預設值的決策。

設定 `appServer.mode: "guardian"`，以使用 Codex 守護模式審核的核准：

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

當這些值獲允許時，`guardian` 預設組合會展開為
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及
`sandbox: "workspace-write"`。個別政策欄位會覆寫 `mode`。較舊的
`guardian_subagent` 審核者值仍可作為相容性別名使用，但新設定應使用
`auto_review`。

當 OpenClaw 沙箱處於啟用狀態時，本機 Codex app-server 程序仍會在閘道
主機上執行。因此，OpenClaw 會在該回合停用 Codex 原生程式碼模式、使用者
MCP 伺服器，以及由應用程式支援的外掛執行，而不會將 Codex 主機端沙箱化
視為等同於 OpenClaw 沙箱後端。當一般的執行／程序工具可用時，Shell 存取
會透過 OpenClaw 沙箱支援的動態工具公開，例如 `sandbox_exec` 與
`sandbox_process`。

<Note>
在以 Docker 為後端的 OpenClaw 沙箱主機上（`agents.defaults.sandbox.mode`
設為 Docker 後端），`openclaw doctor` 會探測主機是否允許非特權使用者
命名空間，以及當 Docker 沙箱的網路對外連線停用時是否允許網路命名空間；
巢狀 Codex `bwrap` 需要這些命名空間，才能在沙箱容器內執行
`workspace-write` Shell。探測失敗時，在 Ubuntu/AppArmor 主機上通常會
顯示 `bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。請為
OpenClaw 服務使用者修正回報的主機命名空間政策並重新啟動閘道；相較於
主機全域的 `kernel.apparmor_restrict_unprivileged_userns=0` 備援方案，
應優先為服務程序使用限定範圍的 AppArmor 設定檔，且不要只為了滿足巢狀
`bwrap` 而授予 Docker 容器更廣泛的權限。
</Note>

## 沙箱化原生執行

穩定預設行為是以封閉方式失敗：啟用 OpenClaw 沙箱時，會停用原本會從
Codex app-server 主機執行的原生 Codex 執行介面。只有在想要搭配 OpenClaw
沙箱後端試用 Codex 的遠端環境支援時，才使用
`appServer.experimental.sandboxExecServer: true`。此預覽路徑適用於所有
受支援的 Codex app-server 版本。

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

當此旗標開啟且目前的 OpenClaw 工作階段已沙箱化時，OpenClaw 會啟動由作用中
沙箱支援的 local loopback 執行伺服器、向 Codex app-server 註冊該伺服器，
並使用這個由 OpenClaw 擁有的環境啟動 Codex 執行緒與回合。如果 app-server
無法註冊該環境，執行會以封閉方式失敗，而不會悄悄回退到主機執行。

此預覽路徑僅限本機。遠端 WebSocket app-server 無法連線至迴環執行伺服器，
除非兩者在同一部主機上執行，因此 OpenClaw 會拒絕這種組合。

## 驗證與環境隔離

在預設的個別代理程式家目錄中，驗證方式會依下列順序選取：

1. 該代理程式明確指定的 OpenClaw Codex 驗證設定檔。
2. 該代理程式 Codex 家目錄中 app-server 的現有帳戶。
3. 僅限本機 stdio app-server 啟動：當 app-server 不存在帳戶且仍需要
   OpenAI 驗證時，先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱型 Codex 驗證設定檔（OAuth 或權杖憑證
類型）時，會從產生的 Codex 子程序中移除 `CODEX_API_KEY` 與
`OPENAI_API_KEY`。如此可讓閘道層級的 API 金鑰繼續供嵌入或直接 OpenAI
模型使用，同時避免原生 Codex app-server 回合意外透過 API 計費。

明確指定的 Codex API 金鑰設定檔與本機 stdio 環境金鑰備援，會使用
app-server 登入，而不是繼承子程序環境。WebSocket app-server 連線不會收到
閘道環境中的 API 金鑰備援；請使用明確的驗證設定檔或遠端 app-server
自己的帳戶。

stdio app-server 啟動時預設會繼承 OpenClaw 的程序環境。OpenClaw 擁有
Codex app-server 帳戶橋接，並將 `CODEX_HOME` 設為該代理程式 OpenClaw
狀態下的個別代理程式目錄。如此可讓 Codex 設定、帳戶、外掛快取／資料及
執行緒狀態限定於 OpenClaw 代理程式，而不會從操作員個人的 `~/.codex`
家目錄滲入。

設定 `appServer.homeScope: "user"`，即可與 Codex Desktop 和命令列介面
共用原生 Codex 狀態。此本機使用者家目錄模式支援受管理的 stdio 與明確的
Unix 傳輸。若已設定 `$CODEX_HOME`，便使用該目錄，否則使用 `~/.codex`；
其中包含原生驗證、設定、外掛與執行緒。OpenClaw 會略過其 app-server
驗證設定檔橋接。通過驗證的擁有者回合可以使用 `codex_threads` 列出
（可選用 `search` 篩選條件）、讀取、分叉、重新命名、封存及取消封存這些
執行緒。在 OpenClaw 中繼續執行緒前，請先將其分叉；彼此獨立的 Codex
程序不會協調同一執行緒的並行寫入者。

該 `homeScope` 選用設定適用於一般的控管框架工作階段。透過 Codex Sessions
建立的 Chat 會改用其私有監督連線，為標準分支與後續恢復保留原生連線的
驗證及提供者設定。

在鎖定模型的受監督 Chat 中，`codex_threads` 無法附加不同的分支，也無法
封存該 Chat 綁定的原生執行緒。列出與僅限中繼資料的讀取仍然可用。原始
逐字記錄讀取需要 `allowRawTranscripts`；停用時也會拒絕清單搜尋，因為
原生搜尋可能會比對到逐字記錄預覽。若要重新命名、取消封存、建立分離的
分支，或封存不屬於其他 OpenClaw Chat 的無關執行緒，則需要
`allowWriteControls`。這兩個選項都無法繞過鎖定的繫結。

OpenClaw 不會為一般的本機 app-server 啟動重寫 `HOME`。由 Codex 執行的
子程序（例如 `openclaw`、`gh`、`git`、雲端命令列介面與 Shell 命令）
會看到一般的程序家目錄，並可找到使用者家目錄中的設定與權杖。Codex
也可能探索 `$HOME/.agents/skills` 與
`$HOME/.agents/plugins/marketplace.json`；此 `.agents` 探索刻意與操作員
家目錄共用，並與隔離的 `~/.codex` 狀態分開。

在預設的代理程式範圍中，OpenClaw 外掛與 OpenClaw Skills 快照仍會經由
OpenClaw 自己的外掛登錄與 Skills 載入器流動；個人的 Codex `~/.codex`
資產則不會。如果 Codex 家目錄中有實用的 Codex 命令列介面 Skills 或外掛，
且應成為隔離 OpenClaw 代理程式的一部分，請明確清查它們：

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。OpenClaw
會在本機啟動正規化期間從此清單移除 `CODEX_HOME` 與 `HOME`：
`CODEX_HOME` 仍會指向所選的代理程式或使用者範圍，而 `HOME` 仍會繼承，
讓子程序可以使用一般的使用者家目錄狀態。

## 動態工具

Codex 動態工具預設採用 `searchable` 載入，並在 `openclaw` 命名空間下以
`deferLoading: true` 公開。OpenClaw 不會公開與 Codex 原生工作區操作或
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

其餘大多數 OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、
閘道、`heartbeat_respond` 與 `web_search`，都可透過該命名空間下的 Codex
工具搜尋使用。這可縮小初始模型上下文。無論 `codexDynamicToolsLoading`
為何，少數工具都會維持可直接呼叫，因為 Codex 工具搜尋可能無法使用，
或可能解析成僅含連接器的工具集合：`agents_list`、`sessions_spawn` 與
`sessions_yield`。開發人員指示仍會引導一般 Codex 子代理程式使用原生
`spawn_agent` 處理 Codex 原生子代理程式工作，而 `sessions_spawn` 仍可供
明確的 OpenClaw 或 ACP 委派使用。僅使用訊息工具的來源回覆也會保持直接
呼叫，因為這是回合控制合約。

標記為 `catalogMode: "direct-only"` 的工具（包括 OpenClaw 的 `computer`
工具）會歸入 `openclaw_direct`。OpenClaw 會將該命名空間加入 Codex 的
`code_mode.direct_only_tool_namespaces` 清單，而不會取代操作員提供的項目。
因此，Codex 會在一般執行緒與僅限程式碼模式的執行緒中，將這些工具公開為
`DirectModelOnly`，而不是透過巢狀程式碼模式的 `tools.*` 呼叫路由。此邊界
對包含影像的結果至關重要：巢狀程式碼模式序列化會將影像輸出攤平成文字，
導致下一個電腦操作所需的螢幕截圖遭到捨棄。

只有在連線至無法搜尋延遲載入動態工具的自訂 Codex app-server，或偵錯完整
工具承載資料時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫，其限制獨立於
`appServer.requestTimeoutMs`。每個 Codex `item/tool/call` 請求會依下列順序，
採用第一個可用的逾時設定：

- 每次呼叫所傳入的正數 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的
  圖像生成預設值。
- 對於媒體理解的 `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換成的毫秒數，或 60 秒的媒體預設值。對於圖像
  理解，此限制套用於請求本身，不會因先前的準備工作而
  縮短。
- 對於 `message` 工具，使用固定的 120 秒預設值。
- 90 秒的動態工具預設值。

此監控器是外層動態 `item/tool/call` 的時間預算。各供應商專屬的
請求逾時會在該呼叫內執行，並保有各自的逾時語意。
動態工具預算上限為 600000 毫秒。逾時時，OpenClaw 會在支援的情況下中止
工具訊號，並向 Codex 傳回失敗的動態工具回應，
讓該輪次得以繼續，而不會使工作階段停留在
`processing` 狀態。

Codex 接受輪次後，以及 OpenClaw 回應限定於該輪次的
應用程式伺服器請求後，執行框架會預期 Codex 推進目前輪次，
並最終以 `turn/completed` 完成原生輪次。若
應用程式伺服器在 `appServer.turnCompletionIdleTimeoutMs` 期間保持靜默，OpenClaw
會盡力中斷 Codex 輪次、記錄診斷逾時，並
釋放 OpenClaw 工作階段通道，避免後續聊天訊息排在
過期的原生輪次之後。

同一輪次的大多數非終止通知會解除該短期監控器，
因為 Codex 已證明輪次仍在運作。工具交接會使用較長的
工具後閒置預算：在 OpenClaw 傳回 `item/tool/call` 回應後、
在 `commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後的原始助理
進度、原始推理完成或推理進度之後。若有設定，
防護機制會使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘。同一個工具後預算也會延長
Codex 發出下一個目前輪次事件前，靜默彙整期間的進度監控器。
推理完成、評論型 `agentMessage`
完成，以及工具前的原始推理或助理進度，後續都可能接著
自動產生最終回覆，因此它們會使用進度後回覆防護，
而不是立即釋放工作階段通道。只有最終／非評論型的
已完成 `agentMessage` 項目，以及工具前的原始助理完成，才會啟用
助理輸出釋放機制：若 Codex 隨後保持靜默而未發出 `turn/completed`，
OpenClaw 會盡力中斷原生輪次並釋放工作階段
通道。可安全重播的標準輸入輸出應用程式伺服器失敗，包括沒有助理、
工具、作用中項目或副作用證據的輪次完成閒置
逾時，會在全新的應用程式伺服器嘗試中重試一次。不安全的逾時仍會停用
卡住的應用程式伺服器用戶端，並釋放 OpenClaw 工作階段通道。它們也會
清除過期的原生執行緒繫結，而不會自動
重播。完成監控逾時會顯示 Codex 專屬的逾時文字：
可安全重播的情況會指出回應可能不完整，而不安全的情況則會要求
使用者在重試前確認目前狀態。公開的逾時診斷
包含結構化欄位，例如最後一個應用程式伺服器通知方法、
原始助理回應項目的識別碼／類型／角色、作用中請求／項目數量，以及
已啟用的監控狀態。若最後一個通知是原始助理回應
項目，診斷也會包含有長度限制的助理文字預覽。診斷不會
包含原始提示詞或工具內容。

## 模型探索

Codex 外掛預設會向應用程式伺服器查詢可用模型。模型
可用性由 Codex 應用程式伺服器管理，因此當
OpenClaw 升級隨附的 `@openai/codex` 版本，或部署將
`appServer.command` 指向不同的 Codex 二進位檔時，清單可能會改變。可用性也可能
因帳號而異。請在執行中的閘道上使用 `/codex models`，查看該執行框架與帳號的即時
目錄。

若探索失敗或逾時，OpenClaw 會使用隨附的備援目錄：

| 模型識別碼     | 顯示名稱     | 推理強度                 |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
目前隨附的執行框架是 `@openai/codex` `0.144.1`。針對該隨附應用程式伺服器執行
`model/list` 探測後，傳回下列公開選擇器項目：

| 模型識別碼      | 輸入模態    | 推理強度                             |
| --------------- | ----------- | ------------------------------------ |
| `gpt-5.6-sol`   | text, image | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | text, image | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | text, image | low, medium, high, xhigh, max        |
| `gpt-5.5`       | text, image | low, medium, high, xhigh             |
| `gpt-5.4`       | text, image | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | text, image | low, medium, high, xhigh             |
| `gpt-5.2`       | text, image | low, medium, high, xhigh             |

應用程式伺服器目錄可以回報 `ultra`；OpenClaw 的推理控制目前
最高提供到 `max` 層級。

即時選擇器項目會依帳號而異，也可能隨帳號、Codex
目錄或隨附版本而變更；請執行 `/codex models` 取得目前清單，不要
依賴任何特定時間點的表格。隱藏模型也可能出現在
應用程式伺服器目錄中，以供內部或特殊流程使用，而不是一般的
模型選擇器選項。
</Note>

請在 `plugins.entries.codex.config.discovery` 下調整探索設定：

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

若要讓啟動程序避免探測 Codex，並只使用
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
的備援檔名來尋找角色設定檔，因為 Codex 備援機制只會在
缺少 `AGENTS.md` 時套用。

為了與 OpenClaw 工作區保持一致，Codex 執行框架會將其他
啟動檔案作為開發者指示轉送，但處理方式並不完全相同：

- `TOOLS.md` 會作為 Codex **繼承式**開發者指示轉送，因此
  該輪次期間產生的原生 Codex 子代理程式也能看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 會作為**限定於輪次**
  的協作指示轉送。原生 Codex 子代理程式不會繼承它們，
  以避免子代理程式輪次套用父代理程式的角色設定與
  使用者設定檔。
- 精簡載入的 OpenClaw Skills 清單也會作為限定於輪次的
  協作開發者指示轉送，因此原生 Codex 子代理程式同樣不會
  繼承該清單。
- 不會注入 `HEARTBEAT.md` 的內容；當檔案存在且
  非空白時，心跳偵測輪次會取得協作模式指示，要求讀取該檔案。
- 當該工作區可使用記憶工具時，設定之代理程式工作區中的
  `MEMORY.md` 內容不會貼入原生 Codex 輪次輸入；若檔案存在，
  執行框架會在限定於輪次的協作開發者指示中加入簡短的工作區記憶
  指示，而 Codex 應在持久記憶相關時使用 `memory_search` 或
  `memory_get`。若工具已停用、記憶搜尋無法使用，或作用中的
  工作區與代理程式記憶工作區不同，`MEMORY.md` 則會改用
  一般的有限輪次上下文路徑。
- 若存在 `BOOTSTRAP.md`，它會作為 OpenClaw 輪次輸入的參考
  上下文轉送。

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
單次本機測試中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於
可重複的部署，建議使用設定，因為這能讓外掛行為與
Codex 執行框架的其餘設定保存在同一個經過審查的檔案中。

## 相關內容

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督機制](/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
