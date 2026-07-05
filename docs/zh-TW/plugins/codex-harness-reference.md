---
read_when:
    - 你需要每個 Codex 測試框架設定欄位
    - 你正在變更 app-server 傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex harness 啟動、模型探索或環境隔離
summary: Codex 測試框架的設定、驗證、探索與應用程式伺服器參考
title: Codex 測試框架參考
x-i18n:
    generated_at: "2026-07-05T11:34:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7da4aa4ef7dc26bb7325d195309b9f608ecc645e515907d52306fcc419a94081
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考涵蓋內建 `codex` 外掛的詳細設定。
若要設定與做出路由決策，請從
[Codex 測試框架](/zh-TW/plugins/codex-harness)開始。

## 外掛設定表面

所有 Codex 測試框架設定都位於 `plugins.entries.codex.config` 之下。

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

| 欄位                       | 預設值                   | 意義                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                   | Codex 應用程式伺服器 `model/list` 的模型探索設定。                                                                                       |
| `appServer`                | 受管 stdio 應用程式伺服器 | 傳輸、命令、驗證、核准、沙箱與逾時設定。                                                                                                 |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具情境。                                                                        |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex 應用程式伺服器回合省略的其他 OpenClaw 動態工具名稱。                                                                          |
| `codexPlugins`             | 已停用                   | 對已遷移、從原始碼安裝的精選外掛提供原生 Codex 外掛/應用程式支援。請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。              |
| `computerUse`              | 已停用                   | Codex Computer Use 設定。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)。                                                       |

## 應用程式伺服器傳輸

預設情況下，OpenClaw 會啟動隨內建外掛一併提供的受管 Codex 二進位檔
（目前為 `@openai/codex` `0.142.5`）：

```bash
codex app-server --listen stdio://
```

這會讓應用程式伺服器版本繫結到內建的 `codex` 外掛，而不是
本機剛好另外安裝的任何 Codex 命令列介面。只有在你刻意想使用不同可執行檔時，才設定
`appServer.command`。

對於已經在執行的應用程式伺服器，請使用 WebSocket 傳輸：

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
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會為每個 OpenClaw agent 隔離 Codex 狀態。`"user"` 會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍需要 stdio。                                                                                                                                                           |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸的可執行檔。留空即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境後，會從產生的 stdio app-server 程序中移除的額外環境變數名稱。                                                                                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從解析出的 OpenClaw 工作區推斷本機工作區根目錄，保留此遠端根目錄下目前 cwd 的尾碼，且只將最終 app-server cwd 傳送給 Codex。如果 cwd 位於解析出的 OpenClaw 工作區根目錄之外，OpenClaw 會保守失敗，而不是將閘道本機路徑傳送給遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                                |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個 turn 後，或 OpenClaw 等待 `turn/completed` 時發生 turn 範圍 app-server 請求後的靜默視窗。                                                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始 assistant 進度、原始推理完成或推理進度後使用的完成閒置與進度防護。將此用於可信或繁重的工作負載，其中工具後合成可以合理地比最終 assistant 發布預算保持更長靜默。                                                                                       |
| `mode`                                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO               | YOLO 或 guardian 審查執行的預設集。                                                                                                                                                                                                                                                                                                                                                            |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策                   | 傳送到執行緒啟動、恢復與 turn 的原生 Codex 核准政策。                                                                                                                                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙盒          | 傳送到執行緒啟動與恢復的原生 Codex 沙盒模式。啟用中的 OpenClaw 沙盒會將 `danger-full-access` turn 縮限為 Codex `workspace-write`；turn 網路旗標會跟隨 OpenClaw 沙盒對外連線。                                                                                                                                                    |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者                      | 在允許時，使用 `"auto_review"` 讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                                     |
| `defaultWorkspaceDir`                         | 目前程序目錄                                           | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                                   |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會請求 flex 處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                      |
| `networkProxy`                                | 已停用                                                 | 選擇讓 app-server 命令使用 Codex 權限設定檔網路。OpenClaw 會定義所選 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選用設定，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙盒支援的 Codex 環境，讓原生 Codex 執行可在啟用中的 OpenClaw 沙盒內執行。                                                                                                                                                                                |

`appServer.networkProxy` 是明確的，因為它會改變 Codex 沙盒
契約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 管理的網路。OpenClaw 預設會從
設定檔本文產生防碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；只有在需要穩定的本機名稱時才使用 `profileName`。

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
`networkProxy` 時，產生的權限設定檔會改用 workspace 風格的檔案系統存取。Codex 管理的網路強制執行是沙箱化網路，因此 full-access 設定檔無法保護對外流量。

此外掛會封鎖較舊或未版本化的 app-server 握手：Codex app-server
必須回報穩定版本 `0.125.0` 或更新版本。

OpenClaw 會將非 loopback 的 WebSocket app-server URL 視為遠端，並要求透過 `appServer.authToken` 或
`Authorization` 標頭使用帶有身分資訊的 WebSocket 驗證。`appServer.authToken` 與每個 `appServer.headers.*`
值都可以是 SecretInput；secrets 執行階段會在 OpenClaw 建立 app-server 啟動選項之前解析 SecretRefs 與 env
簡寫，而未解析的結構化 SecretRefs 會在任何 token 或標頭送出之前失敗。設定原生
Codex 外掛時，OpenClaw 會使用已連線 app-server 的外掛控制平面來安裝或重新整理那些外掛，然後重新整理 app
清單，讓外掛擁有的 app 對 Codex thread 可見。`app/list` 仍是權威清單與中繼資料來源，但 OpenClaw
政策會決定即使 Codex 目前將列出的可存取 app 標記為停用，`thread/start` 是否仍送出
`config.apps[appId].enabled = true`。未知或缺少的 app id 仍會 fail-closed；此路徑只會透過
`plugin/install` 啟用 marketplace 外掛並重新整理清單。只應將 OpenClaw 連線到受信任、可接受 OpenClaw
管理之外掛安裝與 app 清單重新整理的遠端 app-server。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作員姿態，讓無人值守的 OpenClaw turn 與心跳偵測能夠繼續推進，而不會出現無人可回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、reviewer 或沙箱值，OpenClaw 會改將隱含預設值視為 guardian
並選擇允許的 guardian 權限。`tools.exec.mode: "auto"` 也會強制使用 guardian-reviewed Codex 核准，且不保留不安全的舊版
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要有意使用免核准姿態，請設定
`tools.exec.mode: "full"`。同一需求檔案中符合主機名稱的 `[[remote_sandbox_config]]` 項目，會用於沙箱預設值決策。

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

當這些值被允許時，`guardian` 預設會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。個別 policy 欄位會覆寫
`mode`。較舊的 `guardian_subagent` reviewer 值仍作為相容性別名被接受，但新設定應使用 `auto_review`。

當 OpenClaw 沙箱處於作用中時，本機 Codex app-server 程序仍在閘道主機上執行。因此，OpenClaw 會在該 turn 停用
Codex 原生 Code Mode、使用者 MCP 伺服器，以及由 app 支援的外掛執行，而不是把 Codex 主機端沙箱視為等同於
OpenClaw 沙箱後端。當一般 exec/process 工具可用時，shell 存取會透過 OpenClaw 沙箱支援的動態工具公開，例如
`sandbox_exec` 與 `sandbox_process`。

<Note>
在 Docker 支援的 OpenClaw 沙箱主機上（`agents.defaults.sandbox.mode` 設為
Docker 後端），`openclaw doctor` 會探測主機是否允許未特權使用者命名空間，以及在 Docker 沙箱網路對外流量停用時允許網路命名空間；這些是巢狀 Codex
`bwrap` 在沙箱容器內執行 `workspace-write` shell 所需。探測失敗通常會在
Ubuntu/AppArmor 主機上呈現為 `bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。請為 OpenClaw
服務使用者修正回報的主機命名空間政策並重新啟動閘道；相較於主機全域的
`kernel.apparmor_restrict_unprivileged_userns=0` fallback，請優先為服務程序使用作用範圍受限的 AppArmor 設定檔，且不要只是為了滿足巢狀
`bwrap` 而授予更廣泛的 Docker 容器權限。
</Note>

## 沙箱化原生執行

穩定預設值是 fail-closed：作用中的 OpenClaw 沙箱會停用原生 Codex 執行介面，否則這些介面會從 Codex app-server
主機執行。只有在你想使用 OpenClaw 沙箱後端嘗試 Codex 的遠端環境支援時，才使用
`appServer.experimental.sandboxExecServer: true`。此預覽路徑需要 Codex app-server 0.132.0 或更新版本。

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

當旗標開啟且目前的 OpenClaw 工作階段已沙箱化時，OpenClaw 會啟動由作用中沙箱支援的 local loopback
exec-server，將其註冊到 Codex app-server，並使用該 OpenClaw 擁有的環境啟動 Codex thread 與 turn。如果 app-server
無法註冊環境，執行會 fail closed，而不會靜默 fallback 到主機執行。

此預覽路徑僅限本機使用。遠端 WebSocket app-server 無法連到 loopback exec-server，除非它在同一部主機上執行，因此
OpenClaw 會拒絕該組合。

## 驗證與環境隔離

在預設的每代理程式 home 中，驗證會依此順序選取：

1. 該代理程式的明確 OpenClaw Codex 驗證設定檔。
2. app-server 在該代理程式 Codex home 中的現有帳戶。
3. 僅限本機 stdio app-server 啟動，在沒有 app-server 帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱風格的 Codex 驗證設定檔（OAuth 或 token credential type）時，會從產生的 Codex
子程序中移除 `CODEX_API_KEY` 與 `OPENAI_API_KEY`。這讓閘道層級 API key 仍可用於 embeddings 或直接 OpenAI
模型，而不會意外讓原生 Codex app-server turn 透過 API 計費。

明確的 Codex API-key 設定檔與本機 stdio env-key fallback 會使用 app-server 登入，而不是繼承的子程序 env。WebSocket
app-server 連線不會接收閘道 env API-key fallback；請使用明確的驗證設定檔或遠端 app-server 自己的帳戶。

Stdio app-server 啟動預設會繼承 OpenClaw 的程序環境。OpenClaw 擁有 Codex app-server 帳戶橋接，並將 `CODEX_HOME`
設為該代理程式 OpenClaw 狀態底下的每代理程式目錄。這會讓 Codex 設定、帳戶、外掛快取/資料，以及 thread 狀態限定在
OpenClaw 代理程式範圍，而不會從操作員個人的 `~/.codex` home 洩漏進來。

設定 `appServer.homeScope: "user"` 可與 Codex Desktop 和命令列介面共用原生 Codex 狀態。此僅限本機 stdio 的模式會在設定時使用
`$CODEX_HOME`，否則使用 `~/.codex`，包含原生驗證、設定、外掛與 threads。OpenClaw 會略過 app-server 的驗證設定檔橋接。已驗證的 owner
turn 可使用 `codex_threads` 列出（可搭配選用的 `search` 篩選器）、讀取、fork、重新命名、封存及取消封存那些 threads。在
OpenClaw 中繼續 thread 前，請先 fork 該 thread；獨立 Codex 程序不會協調同一 thread 的並行寫入者。

OpenClaw 不會為一般本機 app-server 啟動重寫 `HOME`。Codex 執行的子程序，例如 `openclaw`、`gh`、`git`、雲端
命令列介面，以及 shell 命令，會看到一般程序 home，並可找到使用者 home 設定與 tokens。Codex 也可能發現
`$HOME/.agents/skills` 與 `$HOME/.agents/plugins/marketplace.json`；該 `.agents` 探索會刻意與操作員 home 共用，且與隔離的
`~/.codex` 狀態分開。

在預設代理程式範圍中，OpenClaw 外掛與 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的外掛 registry 與 skill
loader 流動；個人 Codex `~/.codex` assets 不會。如果你有實用的 Codex 命令列介面 skills 或外掛來自 Codex home，且應成為隔離
OpenClaw 代理程式的一部分，請明確盤點它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

如果部署需要額外的環境隔離，請將那些變數加入 `appServer.clearEnv`：

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

`appServer.clearEnv` 只影響產生的 Codex app-server 子程序。OpenClaw 會在本機啟動正規化期間從此清單移除
`CODEX_HOME` 與 `HOME`：`CODEX_HOME` 會保持指向所選代理程式或使用者範圍，而 `HOME` 會保持繼承，讓子程序可使用一般使用者 home
狀態。

## 動態工具

Codex 動態工具預設採用 `searchable` 載入，在 `openclaw` 命名空間下公開，並使用
`deferLoading: true`。OpenClaw 不會公開與 Codex 原生 workspace 操作或 Codex 自己的工具搜尋介面重複的動態工具：

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

大多數其餘 OpenClaw 整合工具，例如 messaging、media、排程、browser、nodes、閘道、`heartbeat_respond` 與
`web_search`，都可透過該命名空間下的 Codex 工具搜尋使用。這會讓初始模型上下文更小。有一小組工具不論
`codexDynamicToolsLoading` 為何都會保持可直接呼叫，因為 Codex 工具搜尋可能不可用，或可能解析為僅 connector 的 universe：
`agents_list`、`sessions_spawn` 與
`sessions_yield`。Developer instructions 仍會引導一般 Codex subagents 將原生 `spawn_agent` 用於 Codex-native
subagent 工作，而 `sessions_spawn` 仍可用於明確的 OpenClaw 或 ACP 委派。僅 message-tool 的來源回覆也會保持直接，因為那是
turn-control 合約。

只有在連線到無法搜尋延遲動態工具的自訂 Codex app-server，或除錯完整工具 payload 時，才設定
`codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 設定界限。每個 Codex `item/tool/call` 請求會依此順序使用第一個可用的逾時：

- 正值的每次呼叫 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的圖片產生預設值。
- 對於 media-understanding `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換為毫秒，或 60 秒的 media 預設值。對於圖片理解，這會套用到請求本身，且不會因先前的準備工作而減少。
- 對於 `message` 工具，使用固定 120 秒預設值。
- 90 秒的動態工具預設值。

此 watchdog 是外層動態 `item/tool/call` 預算。Provider-specific
請求逾時會在該呼叫內執行，並保留自己的逾時語意。動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援時中止工具 signal，並向
Codex 回傳失敗的動態工具回應，讓 turn 可以繼續，而不是讓工作階段停留在
`processing`。

在 Codex 接受一個回合後，以及 OpenClaw 回應一個回合範圍的
應用程式伺服器請求後，控制框架會預期 Codex 推進目前回合的進度，
並最終以 `turn/completed` 結束原生回合。如果應用程式伺服器在
`appServer.turnCompletionIdleTimeoutMs` 期間保持靜默，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續
聊天訊息不會排在過期的原生回合後面。

同一回合的大多數非終止通知都會解除這個短看門狗，因為 Codex 已證明
該回合仍然存活。工具交接會使用較長的工具後閒置預算：在 OpenClaw
回傳 `item/tool/call` 回應後、在 `commandExecution` 等原生工具項目完成後、
在原始 `custom_tool_call_output` 完成後，以及在工具後原始助理進度、原始推理完成，
或推理進度之後。此防護在已設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘。
同一個工具後預算也會延長進度看門狗，用於 Codex 發出下一個目前回合事件前的
靜默合成視窗。推理完成、commentary `agentMessage` 完成，以及工具前原始推理或助理進度
後面可能接著自動最終回覆，因此它們會使用進度後回覆防護，而不是立即釋放工作階段通道。
只有最終/非 commentary 的已完成 `agentMessage` 項目和工具前原始助理完成
會啟用助理輸出釋放：如果 Codex 接著在沒有 `turn/completed` 的情況下保持靜默，
OpenClaw 會盡力中斷原生回合並釋放工作階段通道。可安全重播的 stdio 應用程式伺服器失敗，
包括沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，
會在新的應用程式伺服器嘗試上重試一次。不安全的逾時仍會淘汰卡住的
應用程式伺服器用戶端並釋放 OpenClaw 工作階段通道。它們也會清除過期的原生執行緒繫結，
而不是自動重播。完成監看逾時會顯示 Codex 專屬逾時文字：
可安全重播的情況會說回應可能不完整，而不安全的情況會告訴使用者在重試前驗證目前狀態。
公開逾時診斷包含結構化欄位，例如最後一個應用程式伺服器通知方法、
原始助理回應項目 ID/類型/角色、作用中請求/項目計數，以及已啟用的監看狀態。
當最後一個通知是原始助理回應項目時，它們也會包含有界限的助理文字預覽。
它們不包含原始提示或工具內容。

## 模型探索

預設情況下，Codex 外掛會向應用程式伺服器詢問可用模型。模型可用性由 Codex
應用程式伺服器擁有，因此當 OpenClaw 升級內建的 `@openai/codex` 版本，
或部署將 `appServer.command` 指向不同的 Codex 二進位檔時，清單可能會變更。
可用性也可能依帳戶而定。在執行中的閘道上使用 `/codex models`，
即可查看該控制框架和帳戶的即時目錄。

如果探索失敗或逾時，OpenClaw 會使用內建的後備目錄：

| 模型 ID        | 顯示名稱     | 推理強度                 |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
目前內建控制框架是 `@openai/codex` `0.142.5`。針對該內建應用程式伺服器的
`model/list` 探測，回傳了下列超出後備目錄的公開選取器列：

| 模型 ID               | 輸入模態    | 推理強度                 |
| --------------------- | ----------- | ------------------------ |
| `gpt-5.5`             | text, image | low, medium, high, xhigh |
| `gpt-5.4`             | text, image | low, medium, high, xhigh |
| `gpt-5.4-mini`        | text, image | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text        | low, medium, high, xhigh |

即時選取器列會依帳戶而定，並且可能隨帳戶、Codex 目錄或內建版本而變更；
請執行 `/codex models` 取得目前清單，而不是依賴任何時間點表格。
隱藏模型也可能出現在應用程式伺服器目錄中，用於內部或特殊流程，
但不是一般模型選取器選項。
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

如果你希望啟動時避免探測 Codex 並且只使用後備目錄，請停用探索：

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

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw 不會寫入
合成的 Codex 專案文件檔案，也不會依賴 Codex 後備檔名作為 persona 檔案，
因為 Codex 後備只會在 `AGENTS.md` 缺少時套用。

為了維持 OpenClaw 工作區一致性，Codex 控制框架會將其他啟動檔案轉發為開發者指示，
但方式不完全相同：

- `TOOLS.md` 會轉發為 Codex **繼承的**開發者指示，因此在回合期間產生的
  原生 Codex 子代理程式也會看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 會轉發為**回合範圍的**
  協作指示。原生 Codex 子代理程式不會繼承它們，
  這可避免子代理程式回合取得父代理程式的 persona 和使用者個人資料。
- 精簡載入的 OpenClaw Skills 清單也會轉發為回合範圍的協作開發者指示，
  因此原生 Codex 子代理程式也不會繼承它。
- `HEARTBEAT.md` 內容不會注入；心跳偵測回合會取得一個協作模式指標，
  在檔案存在且非空時讀取該檔案。
- 當該工作區可用記憶工具時，來自已設定代理程式工作區的 `MEMORY.md` 內容
  不會貼到原生 Codex 回合輸入中；當它存在時，控制框架會將一個小型工作區記憶指標
  加到回合範圍的協作開發者指示中，且 Codex 應在持久記憶相關時使用
  `memory_search` 或 `memory_get`。如果工具已停用、記憶搜尋不可用，
  或作用中工作區不同於代理程式記憶工作區，`MEMORY.md` 會改用一般的
  有界回合內容路徑。
- `BOOTSTRAP.md` 存在時，會轉發為 OpenClaw 回合輸入參考內容。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對可重複的部署而言，建議使用設定，
因為它會讓外掛行為與 Codex 控制框架設定的其餘部分保留在同一個已審查檔案中。

## 相關

- [Codex 控制框架](/zh-TW/plugins/codex-harness)
- [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
