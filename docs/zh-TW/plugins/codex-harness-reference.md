---
read_when:
    - 你需要每個 Codex harness 設定欄位
    - 你正在變更 app-server 傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex 執行框架啟動、模型探索或環境隔離
summary: Codex harness 的設定、驗證、探索與應用程式伺服器參考
title: Codex 測試框架參考
x-i18n:
    generated_at: "2026-07-04T20:24:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考涵蓋隨附 `codex` 外掛的詳細設定。如需設定與路由決策，請從
[Codex harness](/zh-TW/plugins/codex-harness) 開始。

## 外掛設定介面

所有 Codex harness 設定都位於 `plugins.entries.codex.config` 之下。

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

支援的頂層欄位：

| 欄位                       | 預設值                   | 含義                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                   | Codex app-server `model/list` 的模型探索設定。                                                                                            |
| `appServer`                | 受管理的 stdio app-server | 傳輸、命令、驗證、核准、沙盒與逾時設定。                                                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具內容脈絡。                                                                     |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                                                                            |
| `codexPlugins`             | 已停用                   | 對已遷移、以原始碼安裝的策展外掛提供原生 Codex 外掛/app 支援。請參閱 [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。                  |
| `computerUse`              | 已停用                   | Codex Computer Use 設定。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)。                                                        |

## App-server 傳輸

預設情況下，OpenClaw 會啟動隨附外掛所附帶的受管理 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

這會讓 app-server 版本綁定到隨附的 `codex` 外掛，而不是本機剛好安裝的任何獨立 Codex 命令列介面。只有在你刻意想執行不同的可執行檔時，才設定
`appServer.command`。

若要使用已在執行的 app-server，請使用 WebSocket 傳輸：

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

支援的 `appServer` 欄位：

| 欄位                                          | 預設值                                                 | 意義                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會為每個 OpenClaw 代理隔離 Codex 狀態。`"user"` 會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的對話串管理。使用者範圍需要 stdio。                                                                                                                                                               |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸的可執行檔。留空即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境後，會從產生的 stdio app-server 程序移除的額外環境變數名稱。                                                                                                                                                                                                                                               |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄，在此遠端根目錄下保留目前 cwd 後綴，並只將最終的 app-server cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會封閉失敗，而不是將閘道本機路徑傳送到遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或在回合範圍的 app-server 請求後，OpenClaw 等待 `turn/completed` 時的靜默時間窗。                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | 在工具交接、原生工具完成、工具後原始助理進度、原始推理完成，或 OpenClaw 等待 `turn/completed` 期間的推理進度後使用的完成閒置與進度防護。對於可信任或繁重的工作負載，若工具後合成可以合理地比最終助理發布預算保持更長時間的靜默，請使用此設定。                                                                                  |
| `mode`                                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO               | YOLO 或 guardian 審查執行的預設集。                                                                                                                                                                                                                                                                                                                                                            |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策                   | 傳送到對話串開始、恢復與回合的原生 Codex 核准政策。                                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙盒          | 傳送到對話串開始與恢復的原生 Codex 沙盒模式。啟用中的 OpenClaw 沙盒會將 `danger-full-access` 回合縮小為 Codex `workspace-write`；回合網路旗標會跟隨 OpenClaw 沙盒輸出。                                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者                      | 在允許時，使用 `"auto_review"` 讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | 目前程序目錄                                           | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                                   |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                           |
| `networkProxy`                                | 已停用                                                 | 選擇為 app-server 命令啟用 Codex 權限設定檔網路。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並以 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選擇加入，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙盒支援的 Codex 環境，讓原生 Codex 執行可以在啟用中的 OpenClaw 沙盒內執行。                                                                                                                                                                                |

`appServer.networkProxy` 是明確設定，因為它會改變 Codex 沙盒
合約。啟用後，OpenClaw 也會在 Codex 對話串設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理的網路。預設情況下，OpenClaw 會從
設定檔內容產生抗碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；只有在需要穩定本機名稱時才使用 `profileName`。

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

如果一般 app-server 執行階段會是 `danger-full-access`，啟用
`networkProxy` 會讓產生的權限設定檔使用工作區式檔案系統存取。Codex 管理的網路強制執行是沙箱化網路，
因此完整存取設定檔無法保護輸出流量。

此外掛會封鎖較舊或未版本化的 app-server 握手。Codex app-server
必須回報穩定版本 `0.125.0` 或更新版本。

OpenClaw 會將非回送 WebSocket app-server URL 視為遠端，並要求透過 `appServer.authToken` 或
`Authorization` 標頭使用帶有身分資訊的 WebSocket 驗證。`appServer.authToken` 和每個 `appServer.headers.*`
值都可以是 SecretInput；secrets 執行階段會在 OpenClaw 建立 app-server 啟動選項之前解析 SecretRefs 和 env
簡寫，而未解析的結構化 SecretRefs 會在任何權杖或標頭送出之前失敗。設定原生 Codex
外掛時，OpenClaw 會使用已連線 app-server 的外掛控制平面來安裝或重新整理這些外掛，接著重新整理 app 清單，讓外掛擁有的 app
能顯示在 Codex thread 中。`app/list` 仍是權威的清單與中繼資料來源，但 OpenClaw 政策會決定是否讓
`thread/start` 對列出的可存取 app 傳送 `config.apps[appId].enabled = true`，即使 Codex
目前將其標記為停用。未知或缺少的 app ids 仍會採取失敗關閉；此路徑只會透過 `plugin/install`
啟用 marketplace 外掛並重新整理清單。只將 OpenClaw 連線到可信任的遠端 app-servers，這些伺服器必須能接受由 OpenClaw 管理的外掛安裝與 app
清單重新整理。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作員姿態，讓無人值守的 OpenClaw turn 和心跳偵測能持續推進，而不會出現沒有人能回答的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、審查者或沙箱值，OpenClaw 會改將隱含預設值視為 guardian
並選擇允許的 guardian 權限。`tools.exec.mode: "auto"`
也會強制使用 guardian 審查的 Codex 核准，且不會保留不安全的舊版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"`
覆寫；若要採用有意的免核准姿態，請設定 `tools.exec.mode: "full"`。
同一需求檔案中符合主機名稱的
`[[remote_sandbox_config]]` 項目會在沙箱預設決策中受到尊重。

設定 `appServer.mode: "guardian"` 以使用 Codex guardian 審查核准：

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

當這些值被允許時，`guardian` 預設集會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。個別政策欄位會覆寫 `mode`。較舊的
`guardian_subagent` 審查者值仍會作為相容別名被接受，但新設定應使用 `auto_review`。

當 OpenClaw 沙箱作用中時，本機 Codex app-server 處理程序仍會在閘道主機上執行。因此 OpenClaw
會在該 turn 停用 Codex 原生 Code Mode、使用者 MCP servers，以及 app 支援的外掛執行，而不是將 Codex 主機端沙箱化視為等同於 OpenClaw
沙箱後端。當一般 exec/process 工具可用時，Shell 存取會透過 OpenClaw 沙箱支援的動態工具公開，例如 `sandbox_exec` 和
`sandbox_process`。

在 Ubuntu/AppArmor 主機上，當你刻意在沒有作用中 OpenClaw 沙箱化的情況下執行原生 Codex
`workspace-write` 時，Codex bwrap 可能會在 shell 指令開始前於 `workspace-write` 下失敗。如果你看到
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，請執行
`openclaw doctor`，並修正針對 OpenClaw 服務使用者回報的主機 namespace 政策，而不是授予更寬鬆的 Docker container 權限。偏好為服務處理程序使用範圍限定的 AppArmor
設定檔；`kernel.apparmor_restrict_unprivileged_userns=0` 備援是主機範圍設定，並有安全性取捨。

## 沙箱化原生執行

穩定預設值是失敗關閉：作用中的 OpenClaw 沙箱化會停用原生 Codex 執行介面，否則那些介面會從 Codex app-server
主機執行。只有在你想用 OpenClaw 的沙箱後端嘗試 Codex 遠端環境支援時，才使用 `appServer.experimental.sandboxExecServer: true`。此預覽路徑需要 Codex app-server 0.132.0 或更新版本。

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

當此旗標開啟且目前 OpenClaw 工作階段已沙箱化時，OpenClaw 會啟動由作用中沙箱支援的 local loopback exec-server，將其註冊到 Codex app-server，並以該 OpenClaw 擁有的環境啟動 Codex thread 和 turn。如果 app-server 無法註冊環境，該 run 會失敗關閉，而不是靜默退回主機執行。

此預覽路徑僅限本機。遠端 WebSocket app-server 無法連到 loopback exec-server，除非它在同一台主機上執行，因此 OpenClaw 會拒絕該組合。

## 驗證與環境隔離

在預設的每 agent home 中，驗證會依照以下順序選取：

1. 該 agent 的明確 OpenClaw Codex 驗證設定檔。
2. 該 agent 的 Codex home 中 app-server 既有帳戶。
3. 僅限本機 stdio app-server 啟動：在沒有 app-server 帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從衍生的 Codex 子處理程序中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓閘道層級的 API keys 仍可用於 embeddings 或直接 OpenAI models，同時避免原生 Codex app-server turns 意外透過 API 計費。

明確的 Codex API-key 設定檔和本機 stdio env-key 備援會使用 app-server login，而不是繼承的子處理程序 env。WebSocket app-server 連線不會收到閘道 env API-key 備援；請使用明確的驗證設定檔或遠端 app-server 自己的帳戶。

Stdio app-server 啟動預設會繼承 OpenClaw 的處理程序環境。OpenClaw 擁有 Codex app-server 帳戶橋接，並將 `CODEX_HOME` 設為該 agent 的 OpenClaw state 下每 agent 的目錄。這會讓 Codex config、accounts、plugin cache/data，以及 thread state 範圍限定於 OpenClaw agent，而不會從操作員個人的 `~/.codex` home 外洩進來。

設定 `appServer.homeScope: "user"` 可與 Codex Desktop 和命令列介面共用原生 Codex state。此僅限本機 stdio 的模式會在已設定時使用 `$CODEX_HOME`，否則使用
`~/.codex`，包括原生 auth、config、plugins，以及 threads。OpenClaw 會略過其 app-server 的 auth-profile bridge。已驗證的 owner turns
可以使用 `codex_threads` 來列出、搜尋、讀取、fork、重新命名、封存及還原這些 threads。請先 fork thread，再在 OpenClaw 中繼續它；獨立 Codex 處理程序不會協調同一 thread 的並行寫入者。

OpenClaw 不會為一般本機 app-server 啟動重寫 `HOME`。Codex 執行的子處理程序，例如 `openclaw`、`gh`、`git`、cloud CLIs
和 shell commands，會看到一般處理程序 home，並能找到 user-home config 和 tokens。Codex 也可能探索 `$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json`；該 `.agents` 探索是刻意與操作員 home 共用，並且與隔離的 `~/.codex` state 分開。

在預設 agent 範圍中，OpenClaw 外掛和 OpenClaw skill 快照仍會透過 OpenClaw 自己的外掛 registry 和 skill loader 流動；個人 Codex
`~/.codex` assets 則不會。如果你有來自 Codex home 的實用 Codex 命令列介面 skills 或 plugins，且應成為隔離 OpenClaw agent 的一部分，請明確清查它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

如果部署需要額外環境隔離，請將那些變數加入
`appServer.clearEnv`：

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

`appServer.clearEnv` 只會影響衍生的 Codex app-server 子處理程序。OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 仍會指向選取的 agent 或 user 範圍，而 `HOME` 仍會被繼承，讓子處理程序可使用一般 user-home state。

## 動態工具

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會公開會重複 Codex 原生 workspace 操作的動態工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

大多數其餘 OpenClaw 整合工具，例如 messaging、media、排程、browser、nodes、閘道、`heartbeat_respond` 和 `web_search`，都可透過 `openclaw` namespace 下的 Codex 工具搜尋使用。這會讓初始 model context 更小。`sessions_yield` 和僅限 message-tool 的 source replies 仍維持 direct，因為那些是 turn-control contracts。`sessions_spawn` 維持 searchable，因此 Codex 原生 `spawn_agent` 仍是主要 Codex subagent 介面，同時仍可透過 `openclaw` 動態工具 namespace 使用明確的 OpenClaw 或 ACP delegation。

只有在連線到無法搜尋延遲動態工具的自訂 Codex app-server，或偵錯完整 tool payload 時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 進行限制。每個 Codex `item/tool/call` request 會依照以下順序使用第一個可用逾時：

- 正值的每次呼叫 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的 image-generation 預設值。
- 對於 media-understanding `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換為毫秒，或 60 秒 media 預設值。對於 image
  understanding，這適用於 request 本身，且不會被較早的準備工作扣減。
- 90 秒 dynamic-tool 預設值。

此 watchdog 是外層動態 `item/tool/call` 預算。Provider-specific
request timeouts 會在該呼叫內執行，並保有自己的逾時語意。動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援處中止 tool signal，並向 Codex
回傳失敗的 dynamic-tool response，讓 turn 可以繼續，而不是讓工作階段停留在 `processing`。

Codex 接受 turn 之後，以及 OpenClaw 回應 turn-scoped
app-server request 之後，harness 會預期 Codex 取得 current-turn 進展，並最終以 `turn/completed` 完成原生 turn。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 期間保持安靜，OpenClaw 會盡力中斷 Codex turn、記錄診斷逾時，並釋放
OpenClaw 工作階段 lane，讓後續聊天訊息不會排在陳舊的原生 turn 後面。

大多數同一回合的非終止通知都會解除這個短 watchdog，
因為 Codex 已證明該回合仍然存活。工具交接使用較長的
工具後閒置預算：在 OpenClaw 回傳 `item/tool/call` 回應後、在
`commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後原始助理
進度、原始推理完成或推理進度之後。此防護在設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘。同一個工具後預算也會延長
Codex 發出下一個目前回合事件前，靜默合成視窗的進度 watchdog。
推理完成、commentary `agentMessage` 完成，以及工具前原始推理或助理進度
後面可能會接著自動最終回覆，因此它們會使用進度後回覆
防護，而不是立即釋放工作階段通道。只有
最終/非 commentary 的已完成 `agentMessage` 項目，以及工具前原始助理
完成，會啟動助理輸出釋放：如果 Codex 接著在沒有
`turn/completed` 的情況下安靜下來，OpenClaw 會以 best-effort 中斷原生回合並釋放
工作階段通道。可安全重播的 stdio 應用程式伺服器失敗，包括
沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，
會在新的應用程式伺服器嘗試中重試一次。不安全的
逾時仍會淘汰卡住的應用程式伺服器用戶端並釋放 OpenClaw
工作階段通道。它們也會清除過期的原生執行緒繫結，而不是
自動重播。完成監看逾時會顯示 Codex 專屬逾時
文字：可安全重播的情況會表示回應可能不完整，而不安全的情況
會告知使用者在重試前驗證目前狀態。公開逾時診斷
包含結構化欄位，例如最後一個應用程式伺服器通知方法、
原始助理回應項目 id/type/role、作用中請求/項目數量，以及已啟動的
監看狀態。當最後一個通知是原始助理回應項目時，也會
包含有界限的助理文字預覽。它們不會包含原始提示或
工具內容。

## 模型探索

預設情況下，Codex 外掛會向應用程式伺服器要求可用模型。模型
可用性由 Codex 應用程式伺服器擁有，因此當 OpenClaw
升級內建的 `@openai/codex` 版本，或部署將
`appServer.command` 指向不同的 Codex binary 時，清單可能會改變。可用性也可能
依帳號範圍而定。在執行中的閘道上使用 `/codex models`，即可查看
該 harness 與帳號的即時 catalog。

如果探索失敗或逾時，OpenClaw 會對以下項目使用內建 fallback catalog：

- GPT-5.5
- GPT-5.4 mini

目前內建 harness 是 `@openai/codex` `0.142.5`。針對該內建應用程式伺服器的
`model/list` 探測回傳了這些公開 picker 列：

| 模型 id               | 輸入模態     | 推理強度                 |
| --------------------- | ------------ | ------------------------ |
| `gpt-5.5`             | 文字, 影像   | low, medium, high, xhigh |
| `gpt-5.4`             | 文字, 影像   | low, medium, high, xhigh |
| `gpt-5.4-mini`        | 文字, 影像   | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | 文字         | low, medium, high, xhigh |

應用程式伺服器 catalog 可能會為內部或特殊流程回傳隱藏模型，
但它們不是一般模型 picker 的選項。

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

當你希望啟動時避免探測 Codex、並只使用 fallback catalog 時，停用探索：

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

## 工作區 bootstrap 檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex 專案文件檔案，也不會依賴 Codex fallback
檔名作為 persona 檔案，因為 Codex fallback 只會在
缺少 `AGENTS.md` 時套用。

為了 OpenClaw 工作區一致性，Codex harness 會解析其他 bootstrap
檔案。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 會作為
OpenClaw Codex 開發者指令轉送，因為它們定義了作用中的 agent、
可用的工作區指引，以及使用者設定檔。精簡的 OpenClaw Skills
清單會作為回合範圍的協作開發者指令轉送。
`HEARTBEAT.md` 內容不會被注入；心跳偵測回合會取得 collaboration-mode
指標，指向該檔案，前提是檔案存在且非空。當該工作區有可用的記憶工具時，
設定的 agent 工作區中的 `MEMORY.md` 內容不會貼到原生 Codex 回合輸入中；
若它存在，harness 會將一小段工作區記憶指標加入回合範圍的協作開發者
指令，而 Codex 應在 durable
memory 相關時使用 `memory_search` 或 `memory_get`。如果工具已停用、記憶搜尋
不可用，或作用中工作區不同於 agent 記憶工作區，`MEMORY.md` 會使用
一般有界限的回合內容路徑。
`BOOTSTRAP.md` 存在時會作為 OpenClaw 回合輸入參考
內容轉送。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN`
會略過受管理的 binary。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於
可重複的部署，較建議使用設定，因為它會將外掛行為保留在
與 Codex harness 其餘設定相同的已審查檔案中。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
