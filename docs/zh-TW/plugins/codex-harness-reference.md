---
read_when:
    - 你需要每個 Codex 測試框架設定欄位
    - 你正在變更 app-server 傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex 測試框架啟動、模型探索或環境隔離
summary: Codex 測試框架的設定、驗證、探索與應用程式伺服器參考
title: Codex 測試框架參考
x-i18n:
    generated_at: "2026-07-06T21:51:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed382bb5585cf9ca54fe7d6607cfac923dea2f2636de98fc4b621bdaa47cb1d1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考涵蓋內建 `codex` 外掛的詳細設定。
如需設定與路由決策，請從
[Codex harness](/zh-TW/plugins/codex-harness) 開始。

## 外掛設定介面

所有 Codex harness 設定位於 `plugins.entries.codex.config` 之下。

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

| 欄位                       | 預設值                   | 含義                                                                                                                                           |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                   | Codex 應用伺服器 `model/list` 的模型探索設定。                                                                                                |
| `appServer`                | 受管理的 stdio 應用伺服器 | 傳輸、命令、驗證、核准、沙盒與逾時設定。                                                                                                      |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 可將 OpenClaw 動態工具直接放入初始 Codex 工具情境。                                                                           |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex 應用伺服器回合中省略的額外 OpenClaw 動態工具名稱。                                                                                |
| `codexPlugins`             | 已停用                   | 原生 Codex 外掛/應用程式支援，包括選擇加入已連線帳戶應用程式的存取權。請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。               |
| `computerUse`              | 已停用                   | Codex Computer Use 設定。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)。                                                           |

## 應用伺服器傳輸

OpenClaw 預設會啟動內建外掛隨附的受管理 Codex 二進位檔
（目前為 `@openai/codex` `0.142.5`）：

```bash
codex app-server --listen stdio://
```

這會讓應用伺服器版本與內建 `codex` 外掛綁定，而不是與本機剛好安裝的
任何獨立 Codex 命令列介面綁定。只有在你有意使用不同可執行檔時，才設定
`appServer.command`。

若要使用已在執行的應用伺服器，請使用 WebSocket 傳輸：

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

| 欄位                                          | 預設值                                                 | 意義                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會為每個 OpenClaw 代理隔離 Codex 狀態。`"user"` 會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍需要 stdio。                                                                                                                                                                 |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸的可執行檔。保留未設定即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸的 Bearer 權杖。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境後，會從產生的 stdio app-server 程序移除的額外環境變數名稱。                                                                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄，在此遠端根目錄下保留目前 cwd 後綴，並只將最終 app-server cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會以失敗關閉，而不是將閘道本機路徑傳送到遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                                |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受回合後，或 OpenClaw 等待 `turn/completed` 時，回合範圍的 app-server 請求之後的靜默視窗。                                                                                                                                                                                                                                                                                              |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始助理進度、原始推理完成，或推理進度之後使用的完成閒置與進度防護。請將此用於受信任或繁重的工作負載，在這些情況下，工具後合成可以合理地比最終助理釋出預算保持更久的靜默。                                                                                       |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO               | YOLO 或 guardian 審查執行的預設設定。                                                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策                   | 傳送到執行緒啟動、繼續和回合的原生 Codex 核准政策。                                                                                                                                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙盒          | 傳送到執行緒啟動和繼續的原生 Codex 沙盒模式。作用中的 OpenClaw 沙盒會將 `danger-full-access` 回合縮小為 Codex `workspace-write`；回合網路旗標會遵循 OpenClaw 沙盒輸出。                                                                                                                                                              |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者                      | 在允許時，使用 `"auto_review"` 讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | 目前程序目錄                                           | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                                   |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 啟用快速模式路由，`"flex"` 要求彈性處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                                |
| `networkProxy`                                | 已停用                                                 | 選擇為 app-server 命令啟用 Codex 權限設定檔網路。OpenClaw 會定義選取的 `permissions.<profile>.network` 設定，並以 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選擇加入，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙盒支援的 Codex 環境，讓原生 Codex 執行可以在作用中的 OpenClaw 沙盒內執行。                                                                                                                                                                                   |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙盒
合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定
`features.network_proxy.enabled` 和 `default_permissions`，讓產生的權限
設定檔可以啟動 Codex 管理的網路。OpenClaw 預設會從設定檔主體產生
抗碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；只有在需要穩定的本機名稱時
才使用 `profileName`。

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
`networkProxy` 會改為針對產生的權限設定檔使用工作區式檔案系統存取。
Codex 管理的網路強制執行是沙箱化網路，因此 full-access 設定檔無法保護外送流量。

此外掛會封鎖較舊或未版本化的 app-server 握手：Codex app-server
必須回報穩定版本 `0.125.0` 或更新版本。

OpenClaw 會將非 loopback WebSocket app-server URL 視為遠端，並要求透過 `appServer.authToken` 或
`Authorization` 標頭使用帶有身分的 WebSocket 驗證。`appServer.authToken` 和每個 `appServer.headers.*`
值都可以是 SecretInput；secrets 執行階段會在 OpenClaw 建立 app-server 啟動選項之前解析 SecretRefs 和 env
簡寫，未解析的結構化 SecretRefs 會在任何 token 或標頭送出前失敗。設定原生
Codex 外掛時，OpenClaw 會使用已連線 app-server 的外掛控制平面來安裝或重新整理這些外掛，接著重新整理 app
清單，讓外掛擁有的 app 對 Codex thread 可見。`app/list` 仍然是權威清單與中繼資料來源，但 OpenClaw
政策會決定即使 Codex 目前將其標記為停用，`thread/start` 是否仍會針對列出的可存取 app 傳送
`config.apps[appId].enabled = true`。未知或缺少的 app id 仍會 fail-closed；此路徑只會透過
`plugin/install` 啟用 marketplace 外掛並重新整理清單。只將 OpenClaw 連線到你信任可接受
OpenClaw 管理的外掛安裝和 app 清單重新整理的遠端 app-server。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作者姿態，能讓無人值守的 OpenClaw turn 和心跳偵測持續進展，而不需要沒人在場可回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、
reviewer 或沙箱值，OpenClaw 會改將隱含預設值視為 guardian
並選取允許的 guardian 權限。`tools.exec.mode: "auto"`
也會強制使用 guardian-reviewed Codex 核准，而且不會保留不安全的舊版
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要刻意採用無核准姿態，請設定
`tools.exec.mode: "full"`。同一需求檔案中符合主機名稱的 `[[remote_sandbox_config]]`
項目會用於沙箱預設決策。

設定 `appServer.mode: "guardian"` 以使用 Codex guardian-reviewed 核准：

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

當這些值被允許時，`guardian` preset 會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
個別政策欄位會覆寫 `mode`。較舊的 `guardian_subagent` reviewer 值仍會作為相容別名接受，
但新設定應使用 `auto_review`。

當 OpenClaw 沙箱啟用時，本機 Codex app-server 程序仍會在閘道主機上執行。因此 OpenClaw 會在該 turn
停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及 app-backed 外掛執行，而不是將 Codex 主機端沙箱化視為等同於
OpenClaw 沙箱後端。當一般 exec/process 工具可用時，shell 存取會透過 OpenClaw 沙箱支援的動態工具公開，例如
`sandbox_exec` 和 `sandbox_process`。

<Note>
在 Docker-backed OpenClaw 沙箱主機上（`agents.defaults.sandbox.mode` 設為
Docker 後端），`openclaw doctor` 會探測主機是否允許非特權使用者（以及當 Docker 沙箱網路輸出停用時，也包含
network）namespaces，這是巢狀 Codex `bwrap` 在沙箱容器內進行 `workspace-write`
shell 執行所需。探測失敗通常會在 Ubuntu/AppArmor 主機上呈現為
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。請修正回報的 OpenClaw
服務使用者主機 namespace 政策並重新啟動 gateway；優先為服務程序使用範圍限定的 AppArmor 設定檔，而不是主機全域的
`kernel.apparmor_restrict_unprivileged_userns=0` 後援，且不要只為了滿足巢狀 `bwrap` 而授予更廣泛的 Docker 容器權限。
</Note>

## 沙箱化原生執行

穩定預設值是 fail-closed：啟用中的 OpenClaw 沙箱化會停用原生
Codex 執行介面，這些介面原本會從 Codex app-server
主機執行。只有在你想嘗試搭配 OpenClaw 沙箱後端使用 Codex 的遠端環境支援時，才使用
`appServer.experimental.sandboxExecServer: true`。此 preview 路徑需要 Codex app-server 0.132.0 或更新版本。

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

當此旗標開啟且目前 OpenClaw 工作階段已沙箱化時，OpenClaw
會啟動由啟用中沙箱支援的 local loopback exec-server，將其註冊到
Codex app-server，並使用該 OpenClaw 擁有的環境啟動 Codex thread 和 turn。如果 app-server 無法註冊該環境，
執行會 fail closed，而不是靜默後援到主機執行。

此 preview 路徑僅限本機。遠端 WebSocket app-server 無法連到
loopback exec-server，除非它執行在同一台主機上，因此 OpenClaw
會拒絕該組合。

## 驗證與環境隔離

在預設的每 agent home 中，驗證會依下列順序選取：

1. 該 agent 的明確 OpenClaw Codex 驗證設定檔。
2. 該 agent 的 Codex home 中 app-server 既有帳號。
3. 僅限本機 stdio app-server 啟動：當沒有 app-server 帳號且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱型 Codex 驗證設定檔（OAuth 或
token credential type）時，會從衍生的 Codex 子程序中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓閘道層級 API 金鑰仍可用於 embeddings 或直接 OpenAI models，而不會讓原生 Codex app-server
turn 意外透過 API 計費。

明確的 Codex API-key 設定檔和本機 stdio env-key 後援會使用
app-server login，而不是繼承的子程序 env。WebSocket app-server
連線不會收到閘道 env API-key 後援；請使用明確的驗證設定檔，或使用遠端 app-server 自己的帳號。

Stdio app-server 啟動預設會繼承 OpenClaw 的程序環境。
OpenClaw 擁有 Codex app-server 帳號橋接，並將 `CODEX_HOME` 設為該 agent 的 OpenClaw state
下的每 agent 目錄。這會將 Codex
設定、帳號、外掛快取/資料，以及 thread state 限定在 OpenClaw
agent，而不是從操作者個人的 `~/.codex` home 洩漏進來。

設定 `appServer.homeScope: "user"` 以與 Codex
Desktop 和命令列介面共用原生 Codex state。這個僅限本機 stdio 的模式會在設定時使用 `$CODEX_HOME`，
否則使用 `~/.codex`，包含原生驗證、設定、外掛和 threads。
OpenClaw 會為 app-server 略過其驗證設定檔橋接。已驗證的 owner
turn 可以使用 `codex_threads` 列出（可選用 `search` 篩選器）、
讀取、fork、重新命名、封存和取消封存這些 threads。在 OpenClaw 中繼續 thread 前，請先 fork 該 thread；獨立的 Codex 程序不會協調同一 thread 的並行寫入者。

OpenClaw 不會為一般本機 app-server 啟動重寫 `HOME`。
Codex-run 子程序，例如 `openclaw`、`gh`、`git`、cloud CLIs 和 shell
命令，會看見一般程序 home，並可找到 user-home 設定和
tokens。Codex 也可能發現 `$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json`；該 `.agents` discovery
刻意與操作者 home 共用，且與隔離的 `~/.codex` state 分開。

在預設 agent 範圍中，OpenClaw 外掛和 OpenClaw skill snapshots
仍會流經 OpenClaw 自己的外掛 registry 和 skill loader；個人
Codex `~/.codex` assets 則不會。如果你有來自 Codex home、應該成為隔離 OpenClaw
agent 一部分的實用 Codex 命令列介面 skills 或外掛，請明確盤點它們：

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

`appServer.clearEnv` 只會影響衍生的 Codex app-server 子程序。
OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 會持續指向所選的 agent 或 user 範圍，
`HOME` 會持續繼承，讓子程序可使用一般 user-home state。

## 動態工具

Codex 動態工具預設使用 `searchable` 載入，在
`openclaw` namespace 下公開並搭配 `deferLoading: true`。OpenClaw 不會公開與 Codex 原生 workspace 操作或 Codex 自己 tool-search
介面重複的動態工具：

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

多數其餘 OpenClaw integration tools，例如 messaging、media、排程、
browser、節點、閘道、`heartbeat_respond` 和 `web_search`，可透過該 namespace 下的 Codex tool search 使用。這能讓初始模型上下文更小。有一小組工具無論
`codexDynamicToolsLoading` 為何都維持可直接呼叫，因為 Codex tool search 可能無法使用或解析成僅 connector 的 universe：
`agents_list`、`sessions_spawn` 和
`sessions_yield`。Developer instructions 仍會引導一般 Codex subagents
針對 Codex-native subagent work 使用原生 `spawn_agent`，而
`sessions_spawn` 仍可用於明確的 OpenClaw 或 ACP 委派。
Message-tool-only source replies 也維持直接，因為那是 turn-control contract。

只有在連線到無法搜尋 deferred dynamic tools 的自訂
Codex app-server，或偵錯完整工具 payload 時，才設定
`codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 設定界限。每個 Codex `item/tool/call` request
會依下列順序使用第一個可用逾時：

- 正數的 per-call `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的 image-generation 預設值。
- 對於 media-understanding `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換為毫秒，或 60 秒 media 預設值。對於 image
  understanding，這會套用到 request 本身，且不會因先前的準備工作而縮短。
- 對於 `message` 工具，使用固定 120 秒預設值。
- 90 秒的 dynamic-tool 預設值。

此 watchdog 是外層 dynamic `item/tool/call` budget。Provider-specific
request timeouts 會在該呼叫內執行，並保留自己的 timeout semantics。
Dynamic tool budgets 上限為 600000 ms。逾時時，OpenClaw 會在支援時中止工具 signal，並回傳失敗的 dynamic-tool response 給
Codex，讓 turn 可以繼續，而不是讓工作階段停留在
`processing`。

在 Codex 接受一個回合之後，以及 OpenClaw 回應回合範圍的應用程式伺服器請求之後，框架會預期 Codex 在目前回合取得進展，並最終以 `turn/completed` 完成原生回合。如果應用程式伺服器在 `appServer.turnCompletionIdleTimeoutMs` 期間保持靜默，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階通道，避免後續聊天訊息排在過期的原生回合後方。

同一回合的大多數非終止通知都會解除這個短期監看器，因為 Codex 已證明該回合仍然存活。工具交接使用較長的工具後閒置預算：在 OpenClaw 回傳 `item/tool/call` 回應之後、在 `commandExecution` 等原生工具項目完成之後、在原始 `custom_tool_call_output` 完成之後，以及在工具後原始助理進度、原始推理完成或推理進度之後。此防護在已設定時使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘。同一個工具後預算也會延長進度監看器，涵蓋 Codex 發出下一個目前回合事件之前的靜默合成窗口。推理完成、評論 `agentMessage` 完成，以及工具前原始推理或助理進度，後續可能會接上自動最終回覆，因此它們使用進度後回覆防護，而不是立即釋放工作階通道。只有最終/非評論的已完成 `agentMessage` 項目，以及工具前原始助理完成，才會啟動助理輸出釋放：如果 Codex 接著在沒有 `turn/completed` 的情況下保持靜默，OpenClaw 會盡力中斷原生回合並釋放工作階通道。可安全重播的 stdio 應用程式伺服器失敗，包括沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，會在新的應用程式伺服器嘗試上重試一次。不安全的逾時仍會淘汰卡住的應用程式伺服器用戶端，並釋放 OpenClaw 工作階通道。它們也會清除過期的原生執行緒繫結，而不是自動重播。完成監看逾時會顯示 Codex 專屬的逾時文字：可安全重播的情況會說明回應可能不完整，而不安全的情況會要求使用者在重試前確認目前狀態。公開逾時診斷包含結構化欄位，例如最後一個應用程式伺服器通知方法、原始助理回應項目 id/type/role、作用中請求/項目數量，以及已啟動的監看狀態。當最後一個通知是原始助理回應項目時，也會包含有界限的助理文字預覽。它們不包含原始提示或工具內容。

## 模型探索

預設情況下，Codex 外掛會向應用程式伺服器要求可用模型。模型可用性由 Codex 應用程式伺服器擁有，因此當 OpenClaw 升級內建的 `@openai/codex` 版本，或部署將 `appServer.command` 指向不同的 Codex 二進位檔時，清單可能會變更。可用性也可能以帳戶為範圍。請在執行中的閘道上使用 `/codex models`，查看該框架與帳戶的即時目錄。

如果探索失敗或逾時，OpenClaw 會使用內建的備援目錄：

| 模型 ID        | 顯示名稱     | 推理強度                 |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
目前內建框架是 `@openai/codex` `0.142.5`。針對該內建應用程式伺服器的 `model/list` 探測，回傳了備援目錄以外的這些公開選擇器列：

| 模型 ID               | 輸入模態   | 推理強度                 |
| --------------------- | ---------- | ------------------------ |
| `gpt-5.5`             | 文字、影像 | low, medium, high, xhigh |
| `gpt-5.4`             | 文字、影像 | low, medium, high, xhigh |
| `gpt-5.4-mini`        | 文字、影像 | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | 文字       | low, medium, high, xhigh |

即時選擇器列以帳戶為範圍，且可能隨帳戶、Codex 目錄或內建版本而變更；請執行 `/codex models` 取得目前清單，而不是依賴任何特定時間點的表格。隱藏模型也可能出現在應用程式伺服器目錄中，用於內部或特殊流程，而不是一般模型選擇器選項。
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

當你希望啟動時避免探測 Codex，並且只使用備援目錄時，請停用探索：

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

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw 不會寫入合成的 Codex 專案文件檔案，也不依賴 Codex 的人格檔備援檔名，因為 Codex 備援只會在缺少 `AGENTS.md` 時套用。

為了維持 OpenClaw 工作區一致性，Codex 框架會將其他啟動檔案作為開發者指示轉送，但方式並不完全相同：

- `TOOLS.md` 會作為**繼承的** Codex 開發者指示轉送，因此在該回合中產生的原生 Codex 子代理也會看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 會作為**回合範圍**的協作指示轉送。原生 Codex 子代理不會繼承它們，這可避免子代理回合取得父代理的人格與使用者設定檔。
- 精簡載入的 OpenClaw Skills 清單也會作為回合範圍的協作開發者指示轉送，因此原生 Codex 子代理同樣不會繼承它。
- 不會注入 `HEARTBEAT.md` 內容；心跳偵測回合會取得協作模式指標，在檔案存在且非空時讀取該檔案。
- 當該工作區有可用的記憶工具時，設定的代理工作區中的 `MEMORY.md` 內容不會貼入原生 Codex 回合輸入；當它存在時，框架會在回合範圍的協作開發者指示中加入一個小型工作區記憶指標，而 Codex 應在持久記憶相關時使用 `memory_search` 或 `memory_get`。如果工具已停用、記憶搜尋不可用，或作用中工作區不同於代理記憶工作區，`MEMORY.md` 會改用一般的有界回合上下文路徑。
- `BOOTSTRAP.md` 若存在，會作為 OpenClaw 回合輸入參考上下文轉送。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當未設定 `appServer.command` 時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會繞過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本機測試中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，偏好使用設定，因為它會將外掛行為與其餘 Codex 框架設定保存在同一個已審查的檔案中。

## 相關

- [Codex 框架](/zh-TW/plugins/codex-harness)
- [Codex 框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
