---
read_when:
    - 你需要每個 Codex 執行框架設定欄位
    - 你正在變更應用程式伺服器的傳輸、驗證、探索或逾時行為
    - 你正在除錯 Codex harness 啟動、模型探索或環境隔離
summary: Codex harness 的設定、驗證、探索與應用程式伺服器參考
title: Codex harness 參考
x-i18n:
    generated_at: "2026-06-27T19:34:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此參考涵蓋內建 `codex`
外掛的詳細設定。如需設定與路由決策，請從
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
| `appServer`                | 受管理的 stdio app-server | 傳輸、命令、驗證、核准、沙箱和逾時設定。                                                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具情境。                                                                         |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                                                                            |
| `codexPlugins`             | 已停用                   | 適用於已遷移、以來源安裝之精選外掛的原生 Codex 外掛/應用程式支援。請參閱 [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。              |
| `computerUse`              | 已停用                   | Codex Computer Use 設定。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)。                                                       |

## App-server 傳輸

預設情況下，OpenClaw 會啟動隨內建
外掛一起提供的受管理 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

這會讓 app-server 版本與內建 `codex` 外掛綁定，而不是與
本機剛好安裝的任何獨立 Codex 命令列介面綁定。只有在你有意執行不同
可執行檔時，才設定
`appServer.command`。

對於已在執行的 app-server，請使用 WebSocket 傳輸：

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

| 欄位                                         | 預設值                                                | 意義                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | 受管理的 Codex 二進位檔                                   | stdio 傳輸的可執行檔。未設定時會使用受管理的二進位檔。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸的 Bearer token。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序中移除的額外環境變數名稱。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex app-server 工作區根目錄。設定時，OpenClaw 會從解析後的 OpenClaw 工作區推斷本機工作區根目錄，保留目前 cwd 在此遠端根目錄下的尾端路徑，並只將最終 app-server cwd 傳送給 Codex。如果 cwd 位於解析後的 OpenClaw 工作區根目錄之外，OpenClaw 會以失敗關閉，而不是將閘道本機路徑傳送給遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或 OpenClaw 等待 `turn/completed` 時在回合範圍 app-server 請求後的安靜時間窗。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度保護。對於受信任或繁重的工作負載，若工具後合成可合理地比最終助理發布預算更久保持安靜，請使用此設定。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO | YOLO 或 guardian-reviewed 執行的預設集。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策       | 傳送到執行緒啟動、恢復與回合的原生 Codex 核准政策。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱  | 傳送到執行緒啟動與恢復的原生 Codex 沙箱模式。作用中的 OpenClaw 沙箱會將 `danger-full-access` 回合縮小為 Codex `workspace-write`；回合網路旗標會遵循 OpenClaw 沙箱輸出規則。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審閱者               | 使用 `"auto_review"` 可在允許時讓 Codex 審閱原生核准提示。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 目前程序目錄                              | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex app-server 服務層級。`"priority"` 會啟用 fast-mode 路由，`"flex"` 會請求 flex 處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇讓 app-server 命令使用 Codex 權限設定檔網路功能。OpenClaw 會定義所選 `permissions.<profile>.network` 設定，並以 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選擇加入設定，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙箱支援的 Codex 環境，使原生 Codex 執行可在作用中的 OpenClaw 沙箱內執行。                                                                                                                                                                                                         |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱
合約。啟用時，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理網路。預設情況下，OpenClaw 會從
設定檔內容產生抗碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；只有在需要穩定的本機名稱時才使用 `profileName`。

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
`networkProxy` 會對產生的
權限設定檔使用工作區樣式的檔案系統存取。Codex 受管理網路強制執行是沙箱化網路，
因此 full-access 設定檔不會保護外送流量。

外掛會封鎖較舊或未版本化的 app-server 交握。Codex app-server
必須回報穩定版本 `0.125.0` 或更新版本。

OpenClaw 會將非 loopback 的 WebSocket 應用程式伺服器 URL 視為遠端，並要求透過 `appServer.authToken` 或 `Authorization` 標頭使用帶有身分資訊的 WebSocket 驗證。`appServer.authToken` 與每個 `appServer.headers.*` 值都可以是 SecretInput；secrets runtime 會在 OpenClaw 建立應用程式伺服器啟動選項之前解析 SecretRefs 與 env 簡寫，而未解析的結構化 SecretRefs 會在任何權杖或標頭送出之前失敗。設定原生 Codex 外掛時，OpenClaw 會使用已連線應用程式伺服器的外掛控制平面來安裝或重新整理這些外掛，然後重新整理應用程式清單，讓外掛擁有的應用程式可在 Codex 執行緒中看見。`app/list` 仍是權威的清單與中繼資料來源，但 OpenClaw 原則會決定是否要讓 `thread/start` 對已列出且可存取的應用程式送出 `config.apps[appId].enabled = true`，即使 Codex 目前將其標示為停用。未知或缺少的應用程式 ID 仍維持失敗關閉；此路徑只會透過 `plugin/install` 啟用市集外掛並重新整理清單。只應將 OpenClaw 連線到你信任會接受 OpenClaw 管理之外掛安裝與應用程式清單重新整理的遠端應用程式伺服器。

## 核准與沙盒模式

本機 stdio 應用程式伺服器工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這種受信任的本機操作者姿態，讓無人值守的 OpenClaw 回合與心跳偵測可以繼續進行，而不會出現沒有人在場可回覆的原生核准提示。

如果 Codex 的本機系統需求檔案不允許隱含的 YOLO 核准、審閱者或沙盒值，OpenClaw 會改將隱含預設值視為 guardian，並選取允許的 guardian 權限。`tools.exec.mode: "auto"` 也會強制使用 guardian 審閱的 Codex 核准，且不會保留不安全的舊版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要採用有意識的免核准姿態，請設定 `tools.exec.mode: "full"`。同一需求檔案中符合主機名稱的 `[[remote_sandbox_config]]` 項目，會在沙盒預設決策中受到採用。

為 Codex guardian 審閱的核准設定 `appServer.mode: "guardian"`：

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

在這些值被允許時，`guardian` 預設集會展開為 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。個別原則欄位會覆寫 `mode`。較舊的 `guardian_subagent` 審閱者值仍會作為相容性別名被接受，但新設定應使用 `auto_review`。

當 OpenClaw 沙盒啟用時，本機 Codex 應用程式伺服器程序仍會在 Gateway 主機上執行。因此 OpenClaw 會在該回合停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及應用程式支援的外掛執行，而不是把 Codex 主機端沙盒視為等同於 OpenClaw 沙盒後端。當一般 exec/process 工具可用時，Shell 存取會透過 OpenClaw 沙盒支援的動態工具公開，例如 `sandbox_exec` 與 `sandbox_process`。

在 Ubuntu/AppArmor 主機上，若你刻意在沒有啟用 OpenClaw 沙盒的情況下執行原生 Codex `workspace-write`，Codex bwrap 可能會在 shell 命令開始前於 `workspace-write` 下失敗。如果看到 `bwrap: setting up uid map: Permission denied` 或 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，請執行 `openclaw doctor`，並修正為 OpenClaw 服務使用者回報的主機命名空間原則，而不是授予更寬鬆的 Docker 容器權限。請優先為服務程序使用範圍限定的 AppArmor 設定檔；`kernel.apparmor_restrict_unprivileged_userns=0` 後援是主機範圍的，並具有安全性取捨。

## 沙盒化原生執行

穩定預設值是失敗關閉：啟用中的 OpenClaw 沙盒會停用原本會從 Codex 應用程式伺服器主機執行的原生 Codex 執行介面。只有當你想用 OpenClaw 的沙盒後端嘗試 Codex 的遠端環境支援時，才使用 `appServer.experimental.sandboxExecServer: true`。此預覽路徑需要 Codex 應用程式伺服器 0.132.0 或更新版本。

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

當此旗標開啟且目前 OpenClaw 工作階段已沙盒化時，OpenClaw 會啟動由作用中沙盒支援的 local loopback exec-server，向 Codex 應用程式伺服器註冊它，並以該 OpenClaw 擁有的環境啟動 Codex 執行緒與回合。如果應用程式伺服器無法註冊環境，執行會失敗關閉，而不是靜默後援到主機執行。

此預覽路徑僅限本機。遠端 WebSocket 應用程式伺服器無法連到 loopback exec-server，除非它在同一台主機上執行，因此 OpenClaw 會拒絕該組合。

## 驗證與環境隔離

驗證會依此順序選取：

1. 該代理程式的明確 OpenClaw Codex 驗證設定檔。
2. 該代理程式 Codex home 中應用程式伺服器既有的帳戶。
3. 僅限本機 stdio 應用程式伺服器啟動時，若不存在應用程式伺服器帳戶且仍需要 OpenAI 驗證，則使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

當 OpenClaw 看見 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從衍生的 Codex 子程序移除 `CODEX_API_KEY` 與 `OPENAI_API_KEY`。這會讓 Gateway 層級的 API 金鑰仍可用於 embeddings 或直接 OpenAI 模型，而不會意外讓原生 Codex 應用程式伺服器回合透過 API 計費。

明確的 Codex API 金鑰設定檔與本機 stdio env-key 後援會使用應用程式伺服器登入，而不是繼承子程序 env。WebSocket 應用程式伺服器連線不會收到 Gateway env API 金鑰後援；請使用明確的驗證設定檔或遠端應用程式伺服器自己的帳戶。

stdio 應用程式伺服器啟動預設會繼承 OpenClaw 的程序環境。OpenClaw 擁有 Codex 應用程式伺服器帳戶橋接，並將 `CODEX_HOME` 設為該代理程式 OpenClaw 狀態下的個別代理程式目錄。這會讓 Codex 設定、帳戶、外掛快取/資料，以及執行緒狀態限定於 OpenClaw 代理程式，而不會從操作者個人的 `~/.codex` home 洩漏進來。

OpenClaw 不會為一般本機應用程式伺服器啟動改寫 `HOME`。Codex 執行的子程序，例如 `openclaw`、`gh`、`git`、雲端命令列介面，以及 shell 命令，會看見一般程序 home，並可找到使用者 home 設定與權杖。Codex 也可能探索 `$HOME/.agents/skills` 與 `$HOME/.agents/plugins/marketplace.json`；該 `.agents` 探索是刻意與操作者 home 共用，且與隔離的 `~/.codex` 狀態分開。

OpenClaw 外掛與 OpenClaw skill 快照仍會透過 OpenClaw 自己的外掛登錄與 skill 載入器流動。個人 Codex `~/.codex` 資產則不會。如果你在 Codex home 中有實用的 Codex 命令列介面 skills 或外掛，且應成為 OpenClaw 代理程式的一部分，請明確盤點它們：

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

`appServer.clearEnv` 只會影響衍生的 Codex 應用程式伺服器子程序。OpenClaw 會在本機啟動正規化期間從此清單移除 `CODEX_HOME` 與 `HOME`：`CODEX_HOME` 維持為個別代理程式，而 `HOME` 維持繼承，讓子程序可以使用一般使用者 home 狀態。

## 動態工具

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會公開會重複 Codex 原生工作區操作的動態工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

其餘大多數 OpenClaw 整合工具，例如 messaging、media、cron、browser、nodes、gateway、`heartbeat_respond`，以及 `web_search`，都可透過 `openclaw` 命名空間下的 Codex 工具搜尋取得。這會讓初始模型脈絡更小。`sessions_yield` 與僅限訊息工具的來源回覆會保持直接，因為那些是回合控制合約。`sessions_spawn` 會保持可搜尋，讓 Codex 的原生 `spawn_agent` 維持主要 Codex 子代理程式介面，同時仍可透過 `openclaw` 動態工具命名空間使用明確的 OpenClaw 或 ACP 委派。

只有在連線到無法搜尋延遲動態工具的自訂 Codex 應用程式伺服器，或偵錯完整工具承載時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會獨立於 `appServer.requestTimeoutMs` 設定界限。每個 Codex `item/tool/call` 請求會依此順序使用第一個可用逾時：

- 正數的每次呼叫 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於未設定逾時的 `image_generate`，使用 120 秒的影像生成預設值。
- 對於媒體理解 `image` 工具，使用轉換為毫秒的 `tools.media.image.timeoutSeconds`，或 60 秒的媒體預設值。對影像理解來說，這適用於請求本身，且不會因較早的準備工作而縮減。
- 90 秒的動態工具預設值。

此看門狗是外層動態 `item/tool/call` 預算。供應商特定的請求逾時會在該呼叫內執行，並保有自己的逾時語意。動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援時中止工具訊號，並將失敗的動態工具回應傳回 Codex，讓回合可以繼續，而不是讓工作階段停留在 `processing`。

Codex 接受回合之後，以及 OpenClaw 回應回合範圍的應用程式伺服器請求之後，harness 會預期 Codex 推進目前回合並最終以 `turn/completed` 完成原生回合。如果應用程式伺服器在 `appServer.turnCompletionIdleTimeoutMs` 期間保持靜默，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的原生回合後面。

大多數同一回合的非終端通知都會解除這個短 watchdog，
因為 Codex 已證明該回合仍在進行。工具交接會使用較長的
工具後閒置預算：在 OpenClaw 回傳 `item/tool/call` 回應後、在
`commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後原始 assistant
進度、原始 reasoning 完成或 reasoning 進度之後。若已設定，守衛會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘。同一個工具後預算也會延長靜默合成視窗的
進度 watchdog，直到 Codex 發出下一個目前回合事件。Reasoning 完成、commentary
`agentMessage` 完成，以及工具前原始 reasoning 或 assistant 進度，
後續可能接著自動最終回覆，因此它們會使用進度後回覆
守衛，而不是立即釋放工作階段通道。只有
最終/非 commentary 的已完成 `agentMessage` 項目，以及工具前原始 assistant
完成會啟動 assistant 輸出釋放：如果 Codex 接著安靜下來且沒有
`turn/completed`，OpenClaw 會盡力中斷原生回合並釋放
工作階段通道。可安全重放的 stdio app-server 失敗，包括沒有 assistant、工具、作用中項目或
副作用證據的回合完成閒置逾時，會在新的 app-server 嘗試上重試一次。不安全的
逾時仍會淘汰卡住的 app-server 用戶端並釋放 OpenClaw
工作階段通道。它們也會清除過期的原生執行緒繫結，而不是自動
重放。完成監看逾時會顯示 Codex 專屬的逾時
文字：可安全重放的情況會表示回應可能不完整，而不安全的情況
會告訴使用者在重試前先驗證目前狀態。公開逾時診斷
會包含結構化欄位，例如最後一個 app-server 通知方法、
原始 assistant 回應項目 id/type/role、作用中 request/item 計數，以及已啟動的
監看狀態。當最後一個通知是原始 assistant 回應項目時，也會
包含有界限的 assistant 文字預覽。它們不會包含原始 prompt 或
工具內容。

## 模型探索

預設情況下，Codex 外掛會向 app-server 詢問可用模型。模型
可用性由 Codex app-server 擁有，因此當 OpenClaw
升級內建的 `@openai/codex` 版本，或部署將
`appServer.command` 指向不同的 Codex binary 時，清單可能會改變。可用性也可能依
帳號範圍而定。請在執行中的閘道上使用 `/codex models`，查看該 harness 與帳號的即時 catalog。

如果探索失敗或逾時，OpenClaw 會對以下項目使用內建 fallback catalog：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

目前內建 harness 是 `@openai/codex` `0.139.0`。針對該內建 app-server 的 `model/list` 探測
回傳：

| 模型 id         | 預設 | 隱藏 | 輸入模態    | Reasoning efforts        |
| --------------- | ---- | ---- | ----------- | ------------------------ |
| `gpt-5.5`       | 是   | 否   | text, image | low, medium, high, xhigh |
| `gpt-5.4`       | 否   | 否   | text, image | low, medium, high, xhigh |
| `gpt-5.4-mini`  | 否   | 否   | text, image | low, medium, high, xhigh |
| `gpt-5.3-codex` | 否   | 否   | text, image | low, medium, high, xhigh |
| `gpt-5.2`       | 否   | 否   | text, image | low, medium, high, xhigh |

隱藏模型可能會由 app-server catalog 為內部或
專門流程回傳，但它們不是一般模型選擇器選項。

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
fallback catalog 時，停用探索：

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
不會寫入合成的 Codex 專案文件檔案，也不會依賴 Codex fallback
檔名作為 persona 檔案，因為 Codex fallback 只會在
`AGENTS.md` 缺失時套用。

為了 OpenClaw 工作區一致性，Codex harness 會解析其他啟動
檔案。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 會作為
OpenClaw Codex 開發者指令轉送，因為它們定義了作用中 agent、
可用的工作區指引與使用者 profile。精簡的 OpenClaw skills
清單會作為回合範圍的協作開發者指令轉送。
`HEARTBEAT.md` 內容不會被注入；心跳偵測回合會取得 collaboration-mode
指標，以便在檔案存在且非空時讀取該檔案。當該工作區有可用的 memory
工具時，來自已設定 agent 工作區的 `MEMORY.md` 內容
不會被貼入原生 Codex 回合輸入；若它存在，harness
會在回合範圍的協作開發者指令中加入一個小型 workspace-memory
指標，而 Codex 應在 durable
memory 相關時使用 `memory_search` 或 `memory_get`。如果工具被停用、memory search 不可用，或
作用中工作區不同於 agent memory 工作區，`MEMORY.md` 會使用
一般有界限的回合情境路徑。
`BOOTSTRAP.md` 存在時，會作為 OpenClaw 回合輸入參考
情境轉送。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，
`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的 binary。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於可重複的部署，
建議使用設定，因為它會把外掛行為與其餘 Codex harness 設定保留在同一個
已審查的檔案中。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [OpenAI provider](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
