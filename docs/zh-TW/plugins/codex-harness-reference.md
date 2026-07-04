---
read_when:
    - 你需要每個 Codex harness 設定欄位
    - 你正在變更 app-server 傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex 測試框架啟動、模型探索或環境隔離
summary: Codex harness 的設定、驗證、探索與應用程式伺服器參考
title: Codex 測試框架參考
x-i18n:
    generated_at: "2026-07-04T10:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考涵蓋內建 `codex` 外掛的詳細設定。若要了解設定與路由決策，請從
[Codex harness](/zh-TW/plugins/codex-harness) 開始。

## 外掛設定介面

所有 Codex harness 設定位於 `plugins.entries.codex.config` 下。

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
| `appServer`                | managed stdio app-server | 傳輸、命令、驗證、核准、沙盒與逾時設定。                                                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具情境。                                                                         |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                                                                            |
| `codexPlugins`             | 已停用                   | 已遷移之原始碼安裝精選外掛的原生 Codex 外掛/應用程式支援。請參閱 [Native Codex plugins](/zh-TW/plugins/codex-native-plugins)。                 |
| `computerUse`              | 已停用                   | Codex Computer Use 設定。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)。                                                        |

## App-server 傳輸

預設情況下，OpenClaw 會啟動隨內建外掛一起提供的受管理 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

這會讓 app-server 版本與內建的 `codex` 外掛綁定，而不是取決於本機碰巧安裝的任何獨立 Codex 命令列介面。只有在你有意執行不同的可執行檔時，才設定
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

| 欄位                                         | 預設值                                                | 含義                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會為每個 OpenClaw agent 隔離 Codex 狀態。`"user"` 會共用原生 `$CODEX_HOME` 或 `~/.codex`，使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍需要 stdio。                                                                                                                                                                                               |
| `command`                                     | 受管理的 Codex 二進位檔                                   | stdio 傳輸使用的可執行檔。保留未設定即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸使用的 Bearer 權杖。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承環境之後，從產生的 stdio app-server 程序移除的額外環境變數名稱。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄，保留目前 cwd 在此遠端根目錄下的後綴，並只將最終的 app-server cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會封閉失敗，而不是將閘道本機路徑傳送到遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個 turn 之後，或在 turn 範圍的 app-server 請求之後，OpenClaw 等待 `turn/completed` 時的安靜視窗。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始 assistant 進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。對於受信任或繁重的工作負載，若工具後合成可以合理地比最終 assistant 發布預算保持更久的安靜，請使用此項。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO | YOLO 或 guardian 審查執行的預設集。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策       | 傳送到執行緒啟動、恢復與 turn 的原生 Codex 核准政策。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱  | 傳送到執行緒啟動與恢復的原生 Codex 沙箱模式。作用中的 OpenClaw 沙箱會將 `danger-full-access` turn 縮窄為 Codex `workspace-write`；turn 網路旗標會跟隨 OpenClaw 沙箱輸出。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者               | 允許時，使用 `"auto_review"` 讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 目前程序目錄                              | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會請求 flex 處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇對 app-server 命令使用 Codex 權限設定檔網路。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行可以在作用中的 OpenClaw 沙箱內執行。                                                                                                                                                                                                         |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱
合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理網路。預設情況下，OpenClaw 會從
設定檔本體產生具抗碰撞性的 `openclaw-network-<fingerprint>` 設定檔名稱；
只有在需要穩定的本機名稱時才使用 `profileName`。

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
`networkProxy` 會讓產生的權限設定檔使用工作區風格的檔案系統存取。Codex 受管網路強制執行是沙盒化網路，
因此完整存取設定檔無法保護輸出流量。

此外掛會封鎖較舊或未版本化的 app-server 交握。Codex app-server
必須回報穩定版本 `0.125.0` 或更新版本。

OpenClaw 會將非 loopback 的 WebSocket app-server URL 視為遠端，並要求透過 `appServer.authToken` 或
`Authorization` 標頭使用帶有身分的 WebSocket 驗證。`appServer.authToken` 和每個 `appServer.headers.*`
值都可以是 SecretInput；secrets 執行階段會在 OpenClaw 建立 app-server 啟動選項之前解析 SecretRefs 和 env
簡寫，而未解析的結構化 SecretRefs 會在任何 token 或標頭送出前失敗。設定原生 Codex
外掛時，OpenClaw 會使用已連線 app-server 的外掛控制平面來安裝或重新整理那些外掛，接著重新整理 app 清單，讓外掛擁有的 app
可在 Codex thread 中看見。`app/list` 仍然是權威清單與中繼資料來源，但 OpenClaw 政策會決定是否為列出的可存取 app
在 `thread/start` 送出 `config.apps[appId].enabled = true`，即使 Codex 目前將其標示為停用。未知或缺少的 app ids
仍然採取 fail-closed；此路徑只會透過 `plugin/install` 啟用 marketplace 外掛並重新整理清單。只將 OpenClaw
連線到可信任的遠端 app-servers，且它們能接受 OpenClaw 管理的外掛安裝與 app 清單重新整理。

## 核准與沙盒模式

本機 stdio app-server 工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作員姿態，讓無人值守的 OpenClaw 回合與心跳偵測能夠推進，而不會出現無人可回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、reviewer 或沙盒值，OpenClaw 會改將隱含預設視為 guardian，並選擇允許的 guardian 權限。`tools.exec.mode: "auto"`
也會強制使用 guardian-reviewed Codex 核准，且不保留不安全的舊版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；
若要有意採用無核准姿態，請設定 `tools.exec.mode: "full"`。同一需求檔案中符合主機名稱的
`[[remote_sandbox_config]]` 項目會在決定沙盒預設值時被遵循。

將 `appServer.mode: "guardian"` 設為 Codex guardian-reviewed 核准：

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
`guardian_subagent` reviewer 值仍會作為相容性別名接受，但新的設定應使用 `auto_review`。

當 OpenClaw 沙盒啟用時，本機 Codex app-server 程序仍會在閘道主機上執行。因此，OpenClaw 會在該回合停用 Codex
原生 Code Mode、使用者 MCP servers，以及 app-backed 外掛執行，而不是將 Codex 主機端沙盒化視為等同於 OpenClaw 沙盒後端。
當一般 exec/process 工具可用時，shell 存取會透過 OpenClaw 沙盒支援的動態工具公開，例如 `sandbox_exec` 和 `sandbox_process`。

在 Ubuntu/AppArmor 主機上，當你有意在未啟用 OpenClaw 沙盒化的情況下執行原生 Codex
`workspace-write` 時，Codex bwrap 可能會在 shell 命令開始前於 `workspace-write` 下失敗。如果你看到
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，請執行
`openclaw doctor`，並修正針對 OpenClaw 服務使用者回報的主機 namespace 政策，而不是授予更廣泛的 Docker 容器權限。建議為服務程序使用有範圍的 AppArmor 設定檔；
`kernel.apparmor_restrict_unprivileged_userns=0` 備援是整個主機範圍的，並有安全取捨。

## 沙盒化原生執行

穩定預設是 fail-closed：啟用 OpenClaw 沙盒化時，會停用原本會從 Codex app-server 主機執行的原生 Codex 執行介面。
只有在你想用 OpenClaw 的沙盒後端嘗試 Codex 的遠端環境支援時，才使用 `appServer.experimental.sandboxExecServer: true`。
這個預覽路徑需要 Codex app-server 0.132.0 或更新版本。

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

當此旗標開啟且目前的 OpenClaw 工作階段已沙盒化時，OpenClaw
會啟動由作用中沙盒支援的 local loopback exec-server，向 Codex app-server 註冊它，並以該 OpenClaw 擁有的環境啟動 Codex thread
和回合。如果 app-server 無法註冊環境，執行會 fail closed，而不是默默退回主機執行。

這個預覽路徑僅限本機。遠端 WebSocket app-server 無法連到 loopback exec-server，除非它在同一台主機上執行，因此 OpenClaw
會拒絕這種組合。

## 驗證與環境隔離

在預設的每代理 home 中，驗證會依照以下順序選擇：

1. 代理的明確 OpenClaw Codex 驗證設定檔。
2. 該代理 Codex home 中 app-server 的既有帳戶。
3. 僅限本機 stdio app-server 啟動，當沒有 app-server 帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著是
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱風格的 Codex 驗證設定檔時，會從生成的 Codex 子程序移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這讓閘道層級的 API keys 可用於 embeddings 或直接 OpenAI models，而不會意外讓原生 Codex app-server 回合透過 API 計費。

明確的 Codex API-key 設定檔與本機 stdio env-key 備援會使用 app-server 登入，而不是繼承子程序 env。WebSocket app-server
連線不會接收閘道 env API-key 備援；請使用明確驗證設定檔或遠端 app-server 自己的帳戶。

Stdio app-server 啟動預設會繼承 OpenClaw 的程序環境。OpenClaw 擁有 Codex app-server 帳戶橋接，並將 `CODEX_HOME`
設為該代理 OpenClaw state 下的每代理目錄。這會將 Codex 設定、帳戶、外掛快取/資料，以及 thread state 限定在 OpenClaw
代理範圍內，而不會從操作員個人的 `~/.codex` home 洩漏進來。

設定 `appServer.homeScope: "user"` 可與 Codex Desktop 和命令列介面共享原生 Codex 狀態。這個僅限本機 stdio
的模式會在設定時使用 `$CODEX_HOME`，否則使用 `~/.codex`，包括原生驗證、設定、外掛與 threads。OpenClaw 會為 app-server
略過其驗證設定檔橋接。已驗證的 owner 回合可使用 `codex_threads` 來列出、搜尋、讀取、fork、重新命名、封存與還原那些 threads。
在 OpenClaw 中繼續 thread 之前請先 fork；獨立 Codex 程序不會協調同一 thread 的並行寫入者。

OpenClaw 不會為一般本機 app-server 啟動改寫 `HOME`。Codex 執行的子程序，例如 `openclaw`、`gh`、`git`、雲端命令列介面與 shell
命令，會看到一般程序 home，並可找到使用者 home 設定與 token。Codex 也可能探索 `$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json`；這個 `.agents` 探索是刻意與操作員 home 共享，並與隔離的 `~/.codex` 狀態分開。

在預設代理範圍中，OpenClaw 外掛與 OpenClaw skill snapshots 仍會流經 OpenClaw 自己的外掛 registry 與 skill loader；個人 Codex
`~/.codex` 資產不會。如果你有來自 Codex home 且應成為隔離 OpenClaw 代理一部分的實用 Codex 命令列介面 Skills 或外掛，請明確列出它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

如果部署需要額外的環境隔離，請將那些變數加入
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

`appServer.clearEnv` 只會影響生成的 Codex app-server 子程序。OpenClaw
會在本機啟動正規化期間從此清單移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 會保持指向所選代理或使用者範圍，
而 `HOME` 會保持繼承，讓子程序可以使用一般使用者 home 狀態。

## 動態工具

Codex 動態工具預設採用 `searchable` 載入。OpenClaw 不會公開與 Codex 原生工作區操作重複的動態工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

多數其餘 OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、閘道、`heartbeat_respond` 和 `web_search`，
都可透過 `openclaw` namespace 下的 Codex tool search 使用。這能讓初始 model context 更小。`sessions_yield`
和僅限 message-tool 的 source replies 會保持直接，因為那些是 turn-control contracts。`sessions_spawn` 會保持 searchable，
因此 Codex 的原生 `spawn_agent` 仍是主要 Codex subagent 介面，而明確 OpenClaw 或 ACP 委派仍可透過 `openclaw` 動態工具 namespace 使用。

只有在連線到無法搜尋延後動態工具的自訂 Codex app-server，或偵錯完整工具 payload 時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 設定界限。每個 Codex `item/tool/call` 要求會依下列順序使用第一個可用的逾時：

- 正值的每次呼叫 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的影像產生預設值。
- 對於 media-understanding `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換為毫秒，或 60 秒媒體預設值。對於影像理解，這會套用到要求本身，且不會因較早的準備工作而縮短。
- 90 秒的動態工具預設值。

此 watchdog 是外層動態 `item/tool/call` 預算。Provider-specific 要求逾時會在該呼叫內執行，並保留自己的逾時語意。
動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援的情況下中止工具 signal，並向 Codex
回傳失敗的動態工具回應，讓回合可以繼續，而不是讓工作階段停留在 `processing`。

在 Codex 接受回合之後，以及 OpenClaw 回應 turn-scoped app-server 要求之後，harness 預期 Codex 會在目前回合取得進展，並最終以
`turn/completed` 完成原生回合。如果 app-server 在 `appServer.turnCompletionIdleTimeoutMs` 期間保持沉默，OpenClaw
會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段 lane，讓後續聊天訊息不會排在過期的原生回合後面。

同一輪次的大多數非終止通知會解除該短時間看門機制，
因為 Codex 已證明該輪次仍然存活。工具交接使用較長的
工具後閒置預算：在 OpenClaw 回傳 `item/tool/call` 回應後、在
`commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後的原始助理
進度、原始推理完成或推理進度之後。此保護機制在已設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘。同一個工具後預算也會延長進度看門機制，
涵蓋 Codex 發出下一個目前輪次事件前的靜默合成視窗。推理完成、commentary
`agentMessage` 完成，以及工具前的原始推理或助理進度，後續可能
出現自動最終回覆，因此它們會使用進度後回覆保護機制，
而不是立即釋放工作階段通道。只有
最終/非 commentary 的已完成 `agentMessage` 項目，以及工具前的原始助理
完成，才會啟動助理輸出釋放：如果 Codex 接著靜默且沒有
`turn/completed`，OpenClaw 會盡力中斷原生輪次並釋放
工作階段通道。可安全重放的 stdio 應用程式伺服器失敗，包括
沒有助理、工具、作用中項目或副作用證據的輪次完成閒置逾時，
會在新的應用程式伺服器嘗試中重試一次。不安全的
逾時仍會淘汰卡住的應用程式伺服器用戶端，並釋放 OpenClaw
工作階段通道。它們也會清除過期的原生執行緒繫結，而不是
自動重放。完成監看逾時會顯示 Codex 專屬逾時
文字：可安全重放的情況會說回應可能不完整，而不安全的情況
會告知使用者在重試前先確認目前狀態。公開逾時診斷
包含結構化欄位，例如最後一個應用程式伺服器通知方法、
原始助理回應項目 id/type/role、作用中 request/item 計數，以及已啟用的
監看狀態。當最後一個通知是原始助理回應項目時，它們
也會包含有界的助理文字預覽。它們不會包含原始提示或
工具內容。

## 模型探索

預設情況下，Codex 外掛會向應用程式伺服器詢問可用模型。模型
可用性由 Codex 應用程式伺服器擁有，因此當 OpenClaw
升級內建的 `@openai/codex` 版本，或部署將
`appServer.command` 指向不同的 Codex 二進位檔時，清單可能會變更。可用性也可能
依帳號範圍而異。在執行中的閘道上使用 `/codex models`，即可查看
該 harness 和帳號的即時目錄。

如果探索失敗或逾時，OpenClaw 會針對以下項目使用內建備援目錄：

- GPT-5.5
- GPT-5.4 mini

目前內建的 harness 是 `@openai/codex` `0.142.4`。在啟用 GPT-5.6 的工作區中，
對該內建應用程式伺服器執行 `model/list` 探測，回傳了以下
公開選擇器列：

| 模型 id              | 輸入模態 | 推理強度                             |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | 文字、影像       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | 文字、影像       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | 文字、影像       | low, medium, high, xhigh, max        |
| `gpt-5.5`             | 文字、影像       | low, medium, high, xhigh             |
| `gpt-5.4`             | 文字、影像       | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | 文字、影像       | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | 文字、影像       | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | 文字             | low, medium, high, xhigh             |

在限定預覽期間，GPT-5.6 存取權依帳號範圍而定。`max` 是模型
推理強度。`ultra` 是獨立的 Codex 多代理協調中繼資料，
不是標準 OpenAI 推理強度。

應用程式伺服器目錄可能會針對內部或專門流程回傳隱藏模型，
但它們不是一般的模型選擇器選項。

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

當你希望啟動時避免探測 Codex，並且只使用
備援目錄時，請停用探索：

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

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex 專案文件檔案，也不依賴 Codex 對
persona 檔案的備援檔名，因為 Codex 備援只會在
缺少 `AGENTS.md` 時套用。

為了維持 OpenClaw 工作區一致性，Codex harness 會解析其他啟動
檔案。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 會作為
OpenClaw Codex 開發者指令轉送，因為它們定義了作用中的代理、
可用的工作區指引，以及使用者設定檔。精簡的 OpenClaw skills
清單會作為輪次範圍的協作開發者指令轉送。
`HEARTBEAT.md` 內容不會被注入；心跳偵測輪次會取得協作模式
指標，在檔案存在且非空時讀取該檔案。當該工作區可用記憶體工具時，
來自已設定代理工作區的 `MEMORY.md` 內容不會貼入原生 Codex 輪次輸入；
當它存在時，harness 會將小型工作區記憶體指標加入輪次範圍的協作開發者
指令，而 Codex 應在持久記憶體相關時使用 `memory_search` 或 `memory_get`。
如果工具已停用、記憶體搜尋不可用，或作用中工作區不同於代理記憶體工作區，
`MEMORY.md` 會使用一般有界輪次情境路徑。
`BOOTSTRAP.md` 存在時，會作為 OpenClaw 輪次輸入參考
情境轉送。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN`
會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於可重複的部署，
建議使用設定，因為它會將外掛行為保留在與其餘 Codex harness 設定
相同的已審查檔案中。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
