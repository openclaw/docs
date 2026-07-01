---
read_when:
    - 你需要每個 Codex harness 設定欄位
    - 你正在變更 app-server 傳輸、驗證、探索或逾時行為
    - 你正在偵錯 Codex harness 啟動、模型探索或環境隔離
summary: Codex harness 的設定、驗證、探索與應用程式伺服器參考
title: Codex harness 參考
x-i18n:
    generated_at: "2026-07-01T07:51:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

本參考說明隨附 `codex` 外掛的詳細設定。若要進行設定與路由決策，請先參閱
[Codex harness](/zh-TW/plugins/codex-harness)。

## 外掛設定介面

所有 Codex harness 設定都位於 `plugins.entries.codex.config` 底下。

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

| 欄位                       | 預設值                   | 意義                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                   | Codex app-server `model/list` 的模型探索設定。                                                                                            |
| `appServer`                | 受管理的 stdio app-server | 傳輸、命令、驗證、核准、沙盒與逾時設定。                                                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具情境。                                                                         |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                                                                            |
| `codexPlugins`             | 已停用                   | 已遷移、從來源安裝的精選外掛之原生 Codex 外掛/應用程式支援。請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。                    |
| `computerUse`              | 已停用                   | Codex 電腦使用設定。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。                                                                |

## App-server 傳輸

預設情況下，OpenClaw 會啟動隨附外掛提供的受管理 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

這會讓 app-server 版本繫結到隨附的 `codex` 外掛，而不是本機剛好已安裝的任何獨立 Codex 命令列介面。只有在你刻意想執行不同的可執行檔時，才設定
`appServer.command`。

若要使用已在執行中的 app-server，請使用 WebSocket 傳輸：

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

| 欄位                                          | 預設值                                                 | 含義                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                           |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                           |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer 權杖。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境後，會從產生的 stdio app-server 程序中移除的額外環境變數名稱。                                                                                                                                                                                                                                                                                                           |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定時，OpenClaw 會從解析出的 OpenClaw 工作區推斷本機工作區根目錄，保留目前 cwd 在此遠端根目錄下的尾端路徑，並只將最終的 app-server cwd 傳送給 Codex。如果 cwd 位於解析出的 OpenClaw 工作區根目錄之外，OpenClaw 會以失敗關閉處理，而不是將閘道本機路徑傳送到遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或在回合範圍的 app-server 請求後，OpenClaw 等待 `turn/completed` 時使用的靜默視窗。                                                                                                                                                                                                                                                                                         |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。請將此用於受信任或繁重的工作負載，這些負載的工具後綜合可以合理地比最終助理發布預算保持更久的靜默。                                                                                              |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO               | YOLO 或 guardian 審查執行的預設集。                                                                                                                                                                                                                                                                                                                                                              |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策                   | 傳送到執行緒啟動、恢復與回合的原生 Codex 核准政策。                                                                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱          | 傳送到執行緒啟動與恢復的原生 Codex 沙箱模式。啟用中的 OpenClaw 沙箱會將 `danger-full-access` 回合縮小為 Codex `workspace-write`；回合網路旗標會遵循 OpenClaw 沙箱輸出。                                                                                                                                                                                                                           |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者                      | 使用 `"auto_review"` 可在允許時讓 Codex 審查原生核准提示。                                                                                                                                                                                                                                                                                                                                       |
| `defaultWorkspaceDir`                         | 目前程序目錄                                           | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                                     |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會請求彈性處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                                                                                           |
| `networkProxy`                                | 已停用                                                 | 選擇讓 app-server 命令使用 Codex 權限設定檔網路。OpenClaw 會定義選取的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選擇加入選項，會在 Codex app-server 0.132.0 或更新版本中註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行可在啟用中的 OpenClaw 沙箱內執行。                                                                                                                                                                                                                                            |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱
合約。啟用時，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理網路。預設情況下，OpenClaw 會從
設定檔內容產生抗碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；
只有在需要穩定本機名稱時才使用 `profileName`。

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
`networkProxy` 會讓產生的
權限設定檔使用工作區樣式的檔案系統存取。Codex 受管理網路強制執行是沙箱化網路，
因此完整存取設定檔無法保護輸出流量。

此外掛會封鎖較舊或未版本化的 app-server 交握。Codex app-server
必須回報穩定版本 `0.125.0` 或更新版本。

OpenClaw 會將非 loopback 的 WebSocket 應用程式伺服器 URL 視為遠端，並要求
透過 `appServer.authToken` 或 `Authorization` 標頭使用帶有身分資訊的
WebSocket 驗證。`appServer.authToken` 和每個 `appServer.headers.*`
值都可以是 SecretInput；在 OpenClaw 建立應用程式伺服器啟動選項之前，secrets
執行階段會解析 SecretRefs 和 env 簡寫，而未解析的結構化 SecretRefs 會在任何
權杖或標頭送出前失敗。設定原生 Codex 外掛時，OpenClaw 會使用已連線應用程式伺服器的外掛控制平面
安裝或重新整理這些外掛，接著重新整理應用程式清單，讓外掛擁有的應用程式能在 Codex 對話串中可見。`app/list` 仍是
權威的清單和中繼資料來源，但 OpenClaw 政策會決定是否針對列出且可存取的
應用程式，讓 `thread/start` 傳送 `config.apps[appId].enabled = true`，
即使 Codex 目前將其標記為停用。未知或缺少的應用程式 ID 仍會失敗即關閉；此路徑只會透過 `plugin/install`
啟用市集外掛並重新整理清單。只將 OpenClaw 連線到可信任的遠端應用程式伺服器，這些伺服器必須能接受由 OpenClaw 管理的外掛安裝和應用程式清單重新整理。

## 核准與沙盒模式

本機 stdio 應用程式伺服器工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作員姿態，讓
無人值守的 OpenClaw 回合和心跳偵測能持續推進，而不會出現沒有人能回應的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、
審核者或沙盒值，OpenClaw 會改將隱含預設值視為 guardian，
並選取允許的 guardian 權限。`tools.exec.mode: "auto"`
也會強制使用 guardian 審核的 Codex 核准，且不會保留不安全的
舊版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；
若要有意使用不需核准的姿態，請設定 `tools.exec.mode: "full"`。
同一個需求檔案中符合主機名稱的
`[[remote_sandbox_config]]` 項目，會在沙盒預設值決策中受到遵循。

為 Codex guardian 審核的核准設定 `appServer.mode: "guardian"`：

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

當這些值被允許時，`guardian` 預設組合會展開為
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，
以及 `sandbox: "workspace-write"`。個別政策欄位會覆寫 `mode`。較舊的
`guardian_subagent` 審核者值仍會作為相容性別名被接受，
但新設定應使用 `auto_review`。

當 OpenClaw 沙盒啟用時，本機 Codex 應用程式伺服器程序仍會在
閘道主機上執行。因此，OpenClaw 會在該回合停用 Codex 原生 Code Mode、
使用者 MCP 伺服器，以及由應用程式支援的外掛執行，而不是
將 Codex 主機端沙盒化視為等同於 OpenClaw 沙盒
後端。當一般 exec/process 工具可用時，Shell 存取會透過 OpenClaw 沙盒支援的動態工具
公開，例如 `sandbox_exec` 和 `sandbox_process`。

在 Ubuntu/AppArmor 主機上，當你刻意在沒有啟用 OpenClaw 沙盒化的情況下執行原生 Codex
`workspace-write` 時，Codex bwrap 可能會在
Shell 命令開始前於 `workspace-write` 下失敗。如果你看到
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，請執行
`openclaw doctor`，並修正回報的 OpenClaw
服務使用者主機命名空間政策，而不是授予更寬鬆的 Docker 容器權限。建議
為服務程序使用具範圍限制的 AppArmor 設定檔；`kernel.apparmor_restrict_unprivileged_userns=0`
後備方案是整個主機層級的設定，並有安全性取捨。

## 沙盒化原生執行

穩定預設值是失敗即關閉：啟用 OpenClaw 沙盒化時，會停用原本會從 Codex 應用程式伺服器
主機執行的原生 Codex 執行介面。只有在你想要
搭配 OpenClaw 沙盒後端試用 Codex 的遠端環境支援時，才使用
`appServer.experimental.sandboxExecServer: true`。此預覽路徑需要 Codex
應用程式伺服器 0.132.0 或更新版本。

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

當旗標開啟且目前 OpenClaw 工作階段已沙盒化時，OpenClaw
會啟動一個由作用中沙盒支援的 local loopback 執行伺服器，將其
註冊到 Codex 應用程式伺服器，並使用該
由 OpenClaw 擁有的環境啟動 Codex 對話串和回合。如果應用程式伺服器無法註冊環境，
執行會失敗即關閉，而不是靜默退回到主機執行。

此預覽路徑僅限本機。遠端 WebSocket 應用程式伺服器無法連到
loopback 執行伺服器，除非它在同一台主機上執行，因此 OpenClaw 會拒絕
這種組合。

## 驗證與環境隔離

驗證會依下列順序選取：

1. 代理程式的明確 OpenClaw Codex 驗證設定檔。
2. 該代理程式 Codex home 中應用程式伺服器既有的帳戶。
3. 僅限本機 stdio 應用程式伺服器啟動，在沒有應用程式伺服器帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著是
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，它會從
產生的 Codex 子程序中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這能讓
閘道層級的 API 金鑰仍可用於嵌入或直接的 OpenAI 模型，
同時避免原生 Codex 應用程式伺服器回合意外透過 API 計費。

明確的 Codex API 金鑰設定檔和本機 stdio env 金鑰後備會使用應用程式伺服器
登入，而不是繼承子程序 env。WebSocket 應用程式伺服器連線
不會接收閘道 env API 金鑰後備；請使用明確的驗證設定檔或
遠端應用程式伺服器自己的帳戶。

stdio 應用程式伺服器啟動預設會繼承 OpenClaw 的程序環境。
OpenClaw 擁有 Codex 應用程式伺服器帳戶橋接，並將 `CODEX_HOME` 設為
該代理程式 OpenClaw 狀態下的每代理程式目錄。這會讓 Codex 設定、
帳戶、外掛快取/資料和對話串狀態限定在 OpenClaw 代理程式範圍內，
而不是從操作員個人的 `~/.codex` home 洩漏進來。

OpenClaw 不會為一般本機應用程式伺服器啟動改寫 `HOME`。Codex 執行的
子程序，例如 `openclaw`、`gh`、`git`、雲端命令列介面，以及 Shell 命令，會看到
一般程序 home，並能找到使用者 home 設定與權杖。Codex 也可能
發現 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；
該 `.agents` 探索是有意與操作員 home 共享的，並且
與隔離的 `~/.codex` 狀態分開。

OpenClaw 外掛和 OpenClaw Skills 快照仍會透過 OpenClaw 自己的
外掛登錄和 Skills 載入器流動。個人 Codex `~/.codex` 資產則不會。如果
你在 Codex home 中有實用的 Codex 命令列介面 Skills 或外掛，且應成為
OpenClaw 代理程式的一部分，請明確盤點它們：

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

`appServer.clearEnv` 只會影響產生的 Codex 應用程式伺服器子程序。
OpenClaw 會在本機啟動正規化期間，從這份清單中移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 會維持每代理程式設定，而 `HOME` 會維持繼承，讓
子程序能使用一般使用者 home 狀態。

## 動態工具

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會公開
與 Codex 原生工作區操作重複的動態工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

大多數其餘的 OpenClaw 整合工具，例如訊息、媒體、排程、
瀏覽器、節點、閘道、`heartbeat_respond` 和 `web_search`，都可
透過 Codex 工具搜尋在 `openclaw` 命名空間下使用。這會讓初始
模型內容更小。`sessions_yield` 和僅訊息工具來源回覆
仍保持直接，因為它們是回合控制合約。`sessions_spawn` 仍保持
可搜尋，讓 Codex 原生 `spawn_agent` 維持主要 Codex 子代理程式
介面，同時仍可透過 `openclaw` 動態工具命名空間使用明確的 OpenClaw 或 ACP 委派。

只有在連線到無法搜尋延後動態工具的自訂 Codex
應用程式伺服器，或偵錯完整工具酬載時，才設定
`codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制。每個 Codex `item/tool/call` 請求會依下列順序使用第一個
可用的逾時：

- 正數的每次呼叫 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於沒有設定逾時的 `image_generate`，使用 120 秒的
  影像生成預設值。
- 對於媒體理解 `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換為毫秒，或 60 秒媒體預設值。對於影像
  理解，這會套用到請求本身，且不會因為
  先前的準備工作而縮短。
- 90 秒的動態工具預設值。

此看門狗是外層動態 `item/tool/call` 預算。供應商特定的
請求逾時會在該呼叫內執行，並保有自己的逾時語意。
動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援時中止
工具信號，並將失敗的動態工具回應傳回 Codex，
讓回合可以繼續，而不是讓工作階段停留在 `processing`。

在 Codex 接受回合之後，以及 OpenClaw 回應回合範圍的
應用程式伺服器請求之後，harness 會預期 Codex 推進目前回合進度，並
最終以 `turn/completed` 完成原生回合。如果應用程式伺服器在
`appServer.turnCompletionIdleTimeoutMs` 期間沒有動靜，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 工作階段通道，讓後續聊天訊息不會排在過時的
原生回合後面。

同一回合的大多數非終止通知都會解除那個短暫看門狗，
因為 Codex 已證明該回合仍在運作。工具交接會使用較長的
工具後閒置預算：在 OpenClaw 傳回 `item/tool/call` 回應後、在
`commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後的原始助理
進度、原始推理完成或推理進度之後。守衛會在已設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則
預設為五分鐘。這個相同的工具後預算也會延長靜默合成視窗的
進度看門狗，直到 Codex 發出下一個目前回合事件。推理完成、commentary
`agentMessage` 完成，以及工具前的原始推理或助理進度，後續可能會接著自動最終回覆，
因此它們會使用進度後回覆守衛，而不是立即釋放工作階段通道。只有
最終/非 commentary 已完成的 `agentMessage` 項目，以及工具前的原始助理
完成，會啟動助理輸出釋放：如果 Codex 接著在沒有
`turn/completed` 的情況下靜默，OpenClaw 會盡力中斷原生回合並釋放
工作階段通道。可安全重播的 stdio 應用伺服器失敗，包括
沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，
會在全新的應用伺服器嘗試中重試一次。不安全的逾時仍會淘汰卡住的
應用伺服器用戶端，並釋放 OpenClaw 工作階段通道。它們也會清除過期的
原生執行緒繫結，而不是自動重播。完成監看逾時會顯示 Codex 專屬的逾時
文字：可安全重播的情況會說明回應可能不完整，而不安全的情況
會告訴使用者在重試前先驗證目前狀態。公開逾時診斷包含結構化欄位，
例如最後一個應用伺服器通知方法、原始助理回應項目
id/type/role、作用中請求/項目計數，以及已啟動的監看狀態。當最後一個通知是
原始助理回應項目時，也會包含有界限的助理文字預覽。它們不會包含原始提示或
工具內容。

## 模型探索

預設情況下，Codex 外掛會向應用伺服器詢問可用模型。模型
可用性由 Codex 應用伺服器擁有，因此當 OpenClaw
升級內建的 `@openai/codex` 版本，或部署將
`appServer.command` 指向不同的 Codex 二進位檔時，清單可能會改變。可用性也可能受
帳號範圍限制。在執行中的閘道上使用 `/codex models`，即可查看該 harness 與帳號的即時目錄。

如果探索失敗或逾時，OpenClaw 會使用下列內建備援目錄：

- GPT-5.5
- GPT-5.4 mini

目前內建的 harness 是 `@openai/codex` `0.142.4`。在已啟用 GPT-5.6 的工作區中，
針對該內建應用伺服器執行的 `model/list` 探測傳回了下列
公開選擇器列：

| 模型 id               | 輸入模態   | 推理強度                             |
| --------------------- | ---------- | ------------------------------------ |
| `gpt-5.6-sol`         | 文字、影像 | 低、中、高、xhigh、max、ultra        |
| `gpt-5.6-terra`       | 文字、影像 | 低、中、高、xhigh、max、ultra        |
| `gpt-5.6-luna`        | 文字、影像 | 低、中、高、xhigh、max               |
| `gpt-5.5`             | 文字、影像 | 低、中、高、xhigh                    |
| `gpt-5.4`             | 文字、影像 | 低、中、高、xhigh                    |
| `gpt-5.4-mini`        | 文字、影像 | 低、中、高、xhigh                    |
| `gpt-5.4-pro`         | 文字、影像 | 中、高、xhigh                        |
| `gpt-5.3-codex-spark` | 文字       | 低、中、高、xhigh                    |

GPT-5.6 存取權在限量預覽期間受帳號範圍限制。`max` 是模型
推理強度。`ultra` 是獨立的 Codex 多代理協調中繼資料，
不是標準 OpenAI 推理強度。

應用伺服器目錄可能會傳回供內部或專門流程使用的隱藏模型，
但它們不是一般模型選擇器選項。

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

當你希望啟動時避免探測 Codex，且只使用
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
不會寫入合成的 Codex 專案文件檔案，也不依賴 Codex 的備援
persona 檔名，因為 Codex 備援只會在
`AGENTS.md` 遺失時套用。

為了 OpenClaw 工作區一致性，Codex harness 會解析其他啟動
檔案。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 會作為
OpenClaw Codex 開發者指令轉送，因為它們定義了作用中的代理、
可用的工作區指引，以及使用者設定檔。精簡的 OpenClaw skills
清單會作為回合範圍的協作開發者指令轉送。
`HEARTBEAT.md` 內容不會被注入；心跳偵測回合會取得協作模式
指標，在檔案存在且非空時讀取該檔案。當該工作區可使用記憶工具時，
來自已設定代理工作區的 `MEMORY.md` 內容不會貼入原生 Codex 回合輸入；
如果它存在，harness 會將小型工作區記憶指標加入回合範圍的協作開發者
指令，而 Codex 應在耐久記憶相關時使用 `memory_search` 或 `memory_get`。
如果工具已停用、記憶搜尋不可用，或作用中工作區不同於代理記憶工作區，
`MEMORY.md` 會使用一般有界限的回合脈絡路徑。
`BOOTSTRAP.md` 存在時，會作為 OpenClaw 回合輸入參考
脈絡轉送。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN`
會繞過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於
可重複部署，建議使用設定，因為它會將外掛行為保留在
與其餘 Codex harness 設定相同且已審閱的檔案中。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [OpenAI provider](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
