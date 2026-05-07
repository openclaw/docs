---
read_when:
    - 新增會擴大存取權限或自動化範圍的功能
summary: 執行具有殼層存取權限的人工智慧 Gateway 時的安全性考量與威脅模型
title: 安全性
x-i18n:
    generated_at: "2026-05-07T01:52:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 076b3254955a7bec22788b6f11fc69dc17f6fa7f5bcf48def27deaf567526a55
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **個人助理信任模型。** 本指南假設每個 Gateway 有一個受信任的
  操作者邊界（單一使用者、個人助理模型）。
  OpenClaw **不是** 供多個對抗性使用者共用同一個代理或 Gateway 的敵意多租戶安全邊界。
  如果你需要混合信任或對抗性使用者操作，請分割信任邊界（分開的 Gateway +
  憑證，理想情況下也使用分開的 OS 使用者或主機）。
</Warning>

## 先界定範圍：個人助理安全模型

OpenClaw 安全指南假設採用 **個人助理** 部署：一個受信任的操作者邊界，可能有多個代理。

- 支援的安全姿態：每個 Gateway 一個使用者/信任邊界（建議每個邊界使用一個 OS 使用者/主機/VPS）。
- 不支援作為安全邊界：由彼此不受信任或具對抗性的使用者共用一個 Gateway/代理。
- 如果需要對抗性使用者隔離，請依信任邊界分割（分開的 Gateway + 憑證，理想情況下也使用分開的 OS 使用者/主機）。
- 如果多個不受信任的使用者可以傳訊息給同一個啟用工具的代理，請將他們視為共用該代理相同的委派工具權限。

本頁說明如何在**該模型內**強化安全性。它不宣稱在單一共用 Gateway 上提供敵意多租戶隔離。

## 快速檢查：`openclaw security audit`

另請參閱：[形式驗證（安全模型）](/zh-TW/security/formal-verification)

請定期執行這項檢查（尤其是在變更設定或暴露網路介面之後）：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` 會刻意保持狹窄範圍：它會將常見的開放群組
政策切換為允許清單、還原 `logging.redactSensitive: "tools"`、收緊
狀態/設定/include-file 權限，並且在 Windows 上執行時使用 Windows ACL 重設，而不是
POSIX `chmod`。

它會標記常見的踩坑點（Gateway 驗證暴露、瀏覽器控制暴露、提升權限的允許清單、檔案系統權限、寬鬆的 exec 核准，以及開放頻道工具暴露）。

OpenClaw 既是產品也是實驗：你正在把前沿模型行為接到真實訊息介面和真實工具。**不存在「完全安全」的設定。** 目標是有意識地決定：

- 誰可以和你的機器人對話
- 機器人被允許在哪裡行動
- 機器人可以碰觸什麼

從仍能運作的最小存取權限開始，然後隨著信心增加再擴大。

### 部署與主機信任

OpenClaw 假設主機和設定邊界是受信任的：

- 如果有人可以修改 Gateway 主機狀態/設定（`~/.openclaw`，包括 `openclaw.json`），請將他們視為受信任的操作者。
- 為多個彼此不受信任/具對抗性的操作者執行同一個 Gateway **不是建議的設定**。
- 對於混合信任的團隊，請用分開的 Gateway 分割信任邊界（或至少使用分開的 OS 使用者/主機）。
- 建議預設：每台機器/主機（或 VPS）一位使用者，該使用者一個 Gateway，並在該 Gateway 中使用一個或多個代理。
- 在同一個 Gateway 執行個體內，已驗證的操作者存取是一個受信任的控制平面角色，而不是每位使用者的租戶角色。
- 工作階段識別碼（`sessionKey`、工作階段 ID、標籤）是路由選擇器，不是授權權杖。
- 如果數個人可以傳訊息給同一個啟用工具的代理，他們每個人都能操控同一組權限。每位使用者的工作階段/記憶隔離有助於隱私，但不會把共用代理轉換成每位使用者的主機授權。

### 安全檔案操作

OpenClaw 使用 `@openclaw/fs-safe` 進行根目錄邊界檔案存取、原子寫入、封存檔解壓、暫存工作區，以及秘密檔案輔助工具。OpenClaw 預設會將 fs-safe 的選用 POSIX Python 輔助工具設為**關閉**；只有在你需要額外的 fd-relative 變更強化，且能支援 Python 執行環境時，才設定 `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` 或 `require`。

詳細資料：[安全檔案操作](/zh-TW/gateway/security/secure-file-operations)。

### 共用 Slack 工作區：真實風險

如果「Slack 中所有人都可以傳訊息給機器人」，核心風險就是委派工具權限：

- 任何允許的傳送者都可以在代理的政策範圍內誘發工具呼叫（`exec`、瀏覽器、網路/檔案工具）；
- 來自某個傳送者的提示/內容注入可能導致影響共用狀態、裝置或輸出的動作；
- 如果某個共用代理擁有敏感憑證/檔案，任何允許的傳送者都可能透過工具使用來驅動資料外洩。

對團隊工作流程使用工具最小化的分開代理/Gateway；將個人資料代理保持私密。

### 公司共用代理：可接受的模式

當使用該代理的所有人都位於相同信任邊界內（例如同一個公司團隊），且該代理嚴格限定於業務範圍時，這是可接受的。

- 在專用機器/VM/容器上執行它；
- 為該執行環境使用專用 OS 使用者 + 專用瀏覽器/設定檔/帳號；
- 不要讓該執行環境登入個人 Apple/Google 帳號或個人密碼管理器/瀏覽器設定檔。

如果你在同一個執行環境混用個人和公司身分，就會破壞隔離並增加個人資料暴露風險。

## Gateway 與 Node 信任概念

將 Gateway 和 Node 視為同一個操作者信任網域，但角色不同：

- **Gateway** 是控制平面和政策介面（`gateway.auth`、工具政策、路由）。
- **Node** 是配對到該 Gateway 的遠端執行介面（命令、裝置動作、主機本機能力）。
- 驗證到 Gateway 的呼叫者在 Gateway 範圍內受信任。配對後，Node 動作會被視為該 Node 上的受信任操作者動作。
- 操作者範圍層級和核准時檢查摘要於
  [操作者範圍](/zh-TW/gateway/operator-scopes)。
- 使用共用 Gateway 權杖/密碼驗證的 direct loopback 後端用戶端，可以在不呈現使用者
  裝置身分的情況下進行內部控制平面 RPC。這不是遠端或瀏覽器配對繞過：網路
  用戶端、Node 用戶端、裝置權杖用戶端，以及明確的裝置身分
  仍會經過配對與範圍升級強制執行。
- `sessionKey` 是路由/情境選擇，不是每位使用者的驗證。
- Exec 核准（允許清單 + 詢問）是操作者意圖的防護措施，不是敵意多租戶隔離。
- OpenClaw 對受信任單一操作者設定的產品預設，是允許 `gateway`/`node` 上的主機 exec 不顯示核准提示（`security="full"`，`ask="off"`，除非你收緊它）。該預設是有意為之的使用者體驗，本身不是漏洞。
- Exec 核准會綁定精確請求情境與盡力處理的直接本機檔案運算元；它們不會以語意方式建模每一條執行環境/直譯器載入器路徑。若需要強邊界，請使用沙盒化和主機隔離。

如果你需要敵意使用者隔離，請依 OS 使用者/主機分割信任邊界並執行分開的 Gateway。

## 信任邊界矩陣

在分級處理風險時，請將此作為快速模型：

| 邊界或控制                                                | 代表意義                                          | 常見誤讀                                                                      |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（權杖/密碼/受信任代理/裝置驗證）           | 驗證呼叫者存取 Gateway API                        | 「需要在每個框架上都有每則訊息簽章才安全」                                   |
| `sessionKey`                                              | 情境/工作階段選擇的路由鍵                         | 「工作階段金鑰是使用者驗證邊界」                                              |
| 提示/內容防護措施                                         | 降低模型濫用風險                                  | 「光是提示注入就證明驗證繞過」                                                |
| `canvas.eval` / 瀏覽器 evaluate                           | 啟用時是有意提供的操作者能力                      | 「任何 JS eval 原語在這個信任模型中都自動是漏洞」                             |
| 本機 TUI `!` shell                                        | 明確由操作者觸發的本機執行                        | 「本機 shell 便利命令是遠端注入」                                             |
| Node 配對與 Node 命令                                     | 在已配對裝置上的操作者層級遠端執行                | 「遠端裝置控制預設應被視為不受信任使用者存取」                                |
| `gateway.nodes.pairing.autoApproveCidrs`                  | 選擇啟用的受信任網路 Node 登錄政策                | 「預設停用的允許清單是自動配對漏洞」                                          |

## 多代理與子代理邊界

OpenClaw 可以在同一個 Gateway 內執行多個代理，但這些代理仍位於
同一個受信任操作者邊界內，除非你依 Gateway、OS 使用者、主機或沙盒分割部署。
請將子代理委派視為工具政策與沙盒化決策，而不是敵意多租戶授權層。

在同一個受信任 Gateway 內的預期行為：

- 已驗證的操作者可以將工作路由到設定允許其使用的工作階段和代理。
- `sessionKey`、工作階段 id、標籤，以及子代理工作階段金鑰會選擇
  對話情境。它們不是 bearer credentials，也不是每位使用者的
  授權邊界。
- 子代理預設有分開的工作階段。原生 `sessions_spawn` 使用
  隔離情境，除非呼叫者明確要求 `context: "fork"`；
  綁定執行緒的後續工作階段使用 forked 情境，因為它們會繼續該
  對話執行緒。
- forked 子代理可以看到它被刻意提供的逐字記錄情境。
  這是預期行為。只有當它收到政策表示不得接收的情境時，
  才會成為安全問題。
- 工具存取來自有效設定檔、頻道/群組/提供者政策、
  沙盒政策、每個代理的政策，以及子代理限制層。寬泛的
  工具設定檔會有意提供寬泛能力。
- 子代理驗證設定檔會依目標代理 id 解析。除非你分割憑證/部署，
  否則主代理驗證可以作為備援使用；不要只依賴
  子代理身分來實現強秘密隔離。

哪些情況算是真正的邊界繞過：

- 即使有效工具政策拒絕了 `sessions_spawn`，它仍可運作。
- 即使請求者已沙盒化或該呼叫要求 `sandbox: "require"`，子代理仍未受沙盒限制地執行。
- 子代理收到已解析設定拒絕的工作階段工具、系統工具或目標代理存取權。
- 葉節點子代理控制、終止、操控或傳訊息給它未產生的同層工作階段。
- 子代理看到被明確政策或沙盒邊界排除的逐字記錄、記憶、憑證或檔案。
- 沒有所需 Gateway 驗證或受信任代理/裝置身分的 Gateway/API 呼叫者，可以觸發代理或工具執行。

強化旋鈕：

- 除非代理真正需要委派，否則保持拒絕 `sessions_spawn`。
- 對會和外部頻道對話的代理，偏好使用 `tools.profile: "messaging"` 或其他狹窄設定檔。
- 對可能產生工作的代理設定 `agents.list[].subagents.requireAgentId: true`，讓目標選擇明確。
- 保持 `agents.defaults.subagents.allowAgents` 和
  `agents.list[].subagents.allowAgents` 狹窄；對接收不受信任輸入的代理，
  避免使用 `["*"]`。
- 使用 `tools.subagents.tools.allow` 讓子代理工具改為僅允許清單，
  而不是繼承寬泛的父層設定檔。
- 對必須保持沙盒化的工作流程，使用帶有
  `sandbox: "require"` 的 `sessions_spawn`。
- 當代理或使用者彼此不受信任時，請使用分開的 Gateway、OS 使用者、主機、瀏覽器設定檔和憑證。

## 按設計不屬於漏洞

<Accordion title="超出範圍的常見發現">

這些模式經常被回報，通常會在未採取動作的情況下關閉，除非
能證明存在真正的邊界繞過：

- 僅由提示注入組成、且沒有政策、認證或沙盒繞過的鏈。
- 假設在單一共用主機或設定上進行敵意多租戶操作的聲明。
- 將一般操作員讀取路徑存取（例如 `sessions.list` / `sessions.preview` / `chat.history`）在共用 Gateway 設定中分類為 IDOR 的聲明。
- 將預期的 `context: "fork"` 逐字稿繼承視為邊界繞過的聲明，即使請求者明確 fork 了該 context。
- 將廣泛的子代理工具存取視為繞過的聲明，即使設定的 profile 或 allowlist 已刻意授予那些工具。
- 僅限 localhost 部署的發現（例如僅限 loopback Gateway 上的 HSTS）。
- 此 repo 中不存在的 inbound 路徑之 Discord inbound Webhook 簽章發現。
- 將 node 配對中繼資料視為 `system.run` 的隱藏第二層逐命令核准層的報告；實際執行邊界仍然是 Gateway 的全域 node 命令政策加上 node 自身的 exec 核准。
- 將已設定的 `gateway.nodes.pairing.autoApproveCidrs` 本身視為漏洞的報告。此設定預設停用，需要明確的 CIDR/IP 項目，只適用於第一次 `role: node` 配對且沒有要求 scopes，不會自動核准 operator/browser/Control UI、WebChat、角色升級、scope 升級、中繼資料變更、公鑰變更，或同一主機 loopback trusted-proxy header 路徑，除非已明確啟用 loopback trusted-proxy auth。
- 將 `sessionKey` 視為 auth token 的「缺少逐使用者授權」發現。

</Accordion>

## 60 秒內完成加固基準

先使用此基準，然後再按每個受信任代理選擇性重新啟用工具：

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

這會讓 Gateway 僅限本機、隔離 DM，並預設停用控制平面/執行階段工具。

## 共用收件匣快速規則

如果有超過一個人可以 DM 你的機器人：

- 設定 `session.dmScope: "per-channel-peer"`（多帳號 channel 則使用 `"per-account-channel-peer"`）。
- 保持 `dmPolicy: "pairing"` 或嚴格的 allowlist。
- 絕不要將共用 DM 與廣泛工具存取結合。
- 這會加固協作式/共用收件匣，但若使用者共用主機/設定寫入存取權，這並不是為敵意共同租戶隔離而設計。

## Context 可見性模型

OpenClaw 區分兩個概念：

- **觸發授權**：誰可以觸發代理（`dmPolicy`、`groupPolicy`、allowlist、提及閘門）。
- **Context 可見性**：哪些補充 context 會注入模型輸入（回覆內文、引用文字、thread 歷史、轉發中繼資料）。

Allowlist 會管控觸發與命令授權。`contextVisibility` 設定會控制如何篩選補充 context（引用回覆、thread 根、擷取的歷史）：

- `contextVisibility: "all"`（預設）會保留接收到的補充 context。
- `contextVisibility: "allowlist"` 會將補充 context 篩選為 active allowlist 檢查允許的傳送者。
- `contextVisibility: "allowlist_quote"` 行為類似 `allowlist`，但仍會保留一則明確引用的回覆。

可按 channel 或按房間/對話設定 `contextVisibility`。設定細節請參閱[群組聊天](/zh-TW/channels/groups#context-visibility-and-allowlists)。

Advisory 分流指引：

- 只顯示「模型可以看到來自非 allowlist 傳送者的引用或歷史文字」的聲明，是可透過 `contextVisibility` 處理的加固發現，本身不是 auth 或沙盒邊界繞過。
- 若要具備安全影響，報告仍需要展示信任邊界繞過（auth、政策、沙盒、核准，或另一個已記錄的邊界）。

## 稽核檢查內容（高層級）

- **Inbound 存取**（DM 政策、群組政策、allowlist）：陌生人能否觸發機器人？
- **工具爆炸半徑**（elevated 工具 + 開放房間）：提示注入是否可能變成 shell/檔案/網路動作？
- **Exec 核准漂移**（`security=full`、`autoAllowSkills`、沒有 `strictInlineEval` 的 interpreter allowlist）：主機 exec 防護欄是否仍如你所想地運作？
  - `security="full"` 是廣泛姿態警告，不是 bug 的證明。這是受信任個人助理設定所選的預設值；只有在你的威脅模型需要核准或 allowlist 防護欄時才收緊。
- **網路暴露**（Gateway bind/auth、Tailscale Serve/Funnel、弱/短 auth token）。
- **瀏覽器控制暴露**（遠端 node、relay port、遠端 CDP endpoint）。
- **本機磁碟衛生**（權限、symlink、config include、「同步資料夾」路徑）。
- **Plugins**（Plugin 在沒有明確 allowlist 的情況下載入）。
- **政策漂移/錯誤設定**（已設定 sandbox docker 設定但 sandbox 模式關閉；無效的 `gateway.nodes.denyCommands` pattern，因為比對僅限精確命令名稱（例如 `system.run`），且不檢查 shell 文字；危險的 `gateway.nodes.allowCommands` 項目；全域 `tools.profile="minimal"` 被逐代理 profile 覆寫；Plugin 擁有的工具可在寬鬆工具政策下觸及）。
- **執行階段預期漂移**（例如假設隱式 exec 仍表示 `sandbox`，但 `tools.exec.host` 現在預設為 `auto`；或在 sandbox 模式關閉時明確設定 `tools.exec.host="sandbox"`）。
- **模型衛生**（已設定模型看起來像舊版時發出警告；不是硬性阻擋）。

如果你執行 `--deep`，OpenClaw 也會盡力嘗試即時 Gateway probe。

## 憑證儲存對照表

稽核存取或決定要備份什麼時使用此表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：config/env 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕 symlink）
- **Discord bot token**：config/env 或 SecretRef（env/file/exec provider）
- **Slack token**：config/env（`channels.slack.*`）
- **配對 allowlist**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳號）
- **模型 auth profile**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex 執行階段狀態**：`~/.openclaw/agents/<agentId>/agent/codex-home/`
- **檔案後援的 secret payload（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`

## 安全稽核檢查清單

當稽核列印發現時，請按此優先順序處理：

1. **任何「開放」+ 已啟用工具**：先鎖定 DM/群組（配對/allowlist），再收緊工具政策/沙盒化。
2. **公開網路暴露**（LAN bind、Funnel、缺少 auth）：立即修復。
3. **瀏覽器控制遠端暴露**：將其視為操作員存取（僅限 tailnet、審慎配對 node、避免公開暴露）。
4. **權限**：確認 state/config/credentials/auth 不可被群組/全世界讀取。
5. **Plugins**：只載入你明確信任的項目。
6. **模型選擇**：任何帶工具的機器人都偏好現代、經指令加固的模型。

## 安全稽核詞彙表

每個稽核發現都以結構化 `checkId` 標記（例如 `gateway.bind_no_auth` 或 `tools.exec.security_full_configured`）。常見的 critical 嚴重性類別：

- `fs.*` - state、config、credentials、auth profile 的檔案系統權限。
- `gateway.*` - bind 模式、auth、Tailscale、Control UI、trusted-proxy 設定。
- `hooks.*`、`browser.*`、`sandbox.*`、`tools.exec.*` - 各 surface 加固。
- `plugins.*`、`skills.*` - Plugin/skill 供應鏈與掃描發現。
- `security.exposure.*` - 存取政策與工具爆炸半徑交會處的跨領域檢查。

完整目錄（含嚴重性等級、修復 key 與 auto-fix 支援）請見[安全稽核檢查](/zh-TW/gateway/security/audit-checks)。

## 透過 HTTP 使用 Control UI

Control UI 需要**安全 context**（HTTPS 或 localhost）來產生裝置身分。`gateway.controlUi.allowInsecureAuth` 是本機相容性切換：

- 在 localhost 上，頁面透過非安全 HTTP 載入時，它允許 Control UI auth 不使用裝置身分。
- 它不會繞過配對檢查。
- 它不會放寬遠端（非 localhost）裝置身分要求。

偏好使用 HTTPS（Tailscale Serve）或在 `127.0.0.1` 開啟 UI。

僅限緊急破窗情境，`gateway.controlUi.dangerouslyDisableDeviceAuth` 會完全停用裝置身分檢查。這是嚴重的安全降級；除非你正在主動除錯且能快速還原，否則請保持關閉。

與那些危險 flag 分開來看，成功的 `gateway.auth.mode: "trusted-proxy"` 可以在沒有裝置身分的情況下允許 **operator** Control UI session。這是刻意的 auth-mode 行為，不是 `allowInsecureAuth` 捷徑，而且它仍不會延伸到 node-role Control UI session。

啟用此設定時，`openclaw security audit` 會發出警告。

## 不安全或危險 flag 摘要

當已知不安全/危險的 debug switch 啟用時，`openclaw security audit` 會提出 `config.insecure_or_dangerous_flags`。請在 production 中保持這些設定未設定。

<AccordionGroup>
  <Accordion title="目前稽核追蹤的 flag">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="設定 schema 中所有 `dangerous*` / `dangerously*` key">
    Control UI 與瀏覽器：

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Channel 名稱比對（bundled 與 Plugin channel；適用時也可按 `accounts.<accountId>` 使用）：

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`（Plugin channel）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（Plugin channel）
    - `channels.zalouser.dangerouslyAllowNameMatching`（Plugin channel）
    - `channels.irc.dangerouslyAllowNameMatching`（Plugin channel）
    - `channels.mattermost.dangerouslyAllowNameMatching`（Plugin channel）

    網路暴露：

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（也可按帳號設定）

    Sandbox Docker（預設 + 逐代理）：

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## 反向 proxy 設定

如果你在反向 proxy（nginx、Caddy、Traefik 等）後方執行 Gateway，請設定 `gateway.trustedProxies` 以正確處理 forwarded-client IP。

當 Gateway 從**不在** `trustedProxies` 中的位址偵測到 proxy header 時，它**不會**將連線視為本機 client。如果 gateway auth 已停用，這些連線會被拒絕。這可以防止經 proxy 的連線原本可能看似來自 localhost 並取得自動信任所造成的認證繞過。

`gateway.trustedProxies` 也會供 `gateway.auth.mode: "trusted-proxy"` 使用，但該驗證模式更嚴格：

- trusted-proxy 驗證預設會**對 loopback-source 代理 fail closed**
- same-host loopback 反向代理可以使用 `gateway.trustedProxies` 進行本機用戶端偵測與轉送 IP 處理
- same-host loopback 反向代理只有在 `gateway.auth.trustedProxy.allowLoopback = true` 時，才能滿足 `gateway.auth.mode: "trusted-proxy"`；否則請使用 token/password 驗證

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

設定 `trustedProxies` 後，Gateway 會使用 `X-Forwarded-For` 判斷用戶端 IP。除非明確設定 `gateway.allowRealIpFallback: true`，否則預設會忽略 `X-Real-IP`。

受信任的代理標頭不會讓 Node 裝置配對自動成為受信任。
`gateway.nodes.pairing.autoApproveCidrs` 是另一個預設停用的
操作者政策。即使啟用，由 loopback-source trusted-proxy 標頭路徑
也會排除在 Node 自動核准之外，因為本機呼叫者可以偽造這些
標頭，包括明確啟用 loopback trusted-proxy 驗證時也是如此。

良好的反向代理行為（覆寫傳入的轉送標頭）：

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不良的反向代理行為（附加/保留不受信任的轉送標頭）：

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 與來源注意事項

- OpenClaw gateway 以本機/loopback 為優先。如果你在反向代理終止 TLS，請在那裡的代理對外 HTTPS 網域設定 HSTS。
- 如果 gateway 本身終止 HTTPS，你可以設定 `gateway.http.securityHeaders.strictTransportSecurity`，讓 OpenClaw 回應送出 HSTS 標頭。
- 詳細部署指南位於 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)。
- 對於非 loopback 的 Control UI 部署，預設需要 `gateway.controlUi.allowedOrigins`。
- `gateway.controlUi.allowedOrigins: ["*"]` 是明確允許所有瀏覽器來源的政策，不是強化安全的預設值。請避免在嚴格控管的本機測試之外使用。
- 即使啟用一般 loopback 例外，loopback 上的瀏覽器來源驗證失敗仍會受到速率限制，但鎖定鍵會依每個
  正規化的 `Origin` 值限定範圍，而不是共用一個 localhost bucket。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host-header 來源 fallback 模式；請將其視為由操作者選擇的危險政策。
- 將 DNS rebinding 與 proxy-host 標頭行為視為部署強化事項；保持 `trustedProxies` 嚴格，並避免將 gateway 直接暴露到公用網際網路。

## 本機工作階段記錄儲存在磁碟上

OpenClaw 會將工作階段逐字稿儲存在 `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 下的磁碟中。
這是工作階段連續性以及（選用）工作階段記憶索引所必需，但也表示
**任何具有檔案系統存取權的程序/使用者都能讀取這些記錄**。請將磁碟存取視為信任
邊界，並鎖定 `~/.openclaw` 的權限（見下方稽核章節）。如果你需要
在 agent 之間有更強的隔離，請以不同的 OS 使用者或不同主機執行它們。

## Node 執行（system.run）

如果已配對 macOS Node，Gateway 可以在該 Node 上叫用 `system.run`。這是在 Mac 上的**遠端程式碼執行**：

- 需要 Node 配對（核准 + token）。
- Gateway Node 配對不是逐命令核准介面。它建立 Node 身分/信任與 token 核發。
- Gateway 會透過 `gateway.nodes.allowCommands` / `denyCommands` 套用粗略的全域 Node 命令政策。
- 在 Mac 上透過 **Settings → Exec approvals** 控制（security + ask + allowlist）。
- 每個 Node 的 `system.run` 政策是 Node 自己的 exec approvals 檔案（`exec.approvals.node.*`），可以比 gateway 的全域 command-ID 政策更嚴格或更寬鬆。
- 以 `security="full"` 和 `ask="off"` 執行的 Node 正在遵循預設的受信任操作者模型。除非你的部署明確需要更嚴格的核准或 allowlist 立場，否則請將其視為預期行為。
- 核准模式會綁定確切的請求脈絡，並在可行時綁定一個具體的本機 script/file operand。如果 OpenClaw 無法為 interpreter/runtime 命令精確識別一個直接本機檔案，則會拒絕以核准為基礎的執行，而不是承諾完整語意覆蓋。
- 對於 `host=node`，以核准為基礎的執行也會儲存標準化的已準備
  `systemRunPlan`；後續已核准的轉送會重用該已儲存計畫，且 gateway
  驗證會拒絕呼叫者在核准請求建立後對 command/cwd/session 脈絡所做的編輯。
- 如果你不想要遠端執行，請將 security 設為 **deny**，並移除該 Mac 的 Node 配對。

這項區別對 triage 很重要：

- 重新連線的已配對 Node 宣告不同命令清單，本身並不是漏洞，只要 Gateway 全域政策與 Node 的本機 exec approvals 仍強制執行實際執行邊界即可。
- 將 Node 配對中繼資料視為第二層隱藏逐命令核准層的報告，通常是政策/UX 混淆，而非安全邊界繞過。

## 動態 Skills（watcher / 遠端 Node）

OpenClaw 可以在工作階段中途重新整理 Skills 清單：

- **Skills watcher**：對 `SKILL.md` 的變更可在下一次 agent 回合更新 Skills 快照。
- **遠端 Node**：連線 macOS Node 可以讓僅限 macOS 的 Skills 符合資格（根據 bin probing）。

請將 skill 資料夾視為**受信任程式碼**，並限制可修改者。

## 威脅模型

你的 AI 助理可以：

- 執行任意 shell 命令
- 讀取/寫入檔案
- 存取網路服務
- 傳送訊息給任何人（如果你授予 WhatsApp 存取權）

傳訊息給你的人可以：

- 試圖誘騙你的 AI 做壞事
- 以社交工程取得你的資料存取權
- 探測基礎設施詳細資料

## 核心概念：先存取控制，再談智慧

這裡多數失敗不是花俏的 exploit，而是「有人傳訊息給 bot，bot 就照做了」。

OpenClaw 的立場：

- **身分優先：**決定誰可以與 bot 對話（DM 配對 / allowlist / 明確「open」）。
- **範圍其次：**決定 bot 可在哪裡行動（群組 allowlist + mention gating、工具、sandboxing、裝置權限）。
- **模型最後：**假設模型可能被操控；設計上讓操控的 blast radius 有限。

## 命令授權模型

Slash commands 與 directives 只會對**已授權寄件者**生效。授權來自
頻道 allowlist/配對加上 `commands.useAccessGroups`（請參閱 [Configuration](/zh-TW/gateway/configuration)
與 [Slash commands](/zh-TW/tools/slash-commands)）。如果頻道 allowlist 為空或包含 `"*"`，
命令實際上會對該頻道開放。

`/exec` 是供已授權操作者使用的僅限工作階段便利功能。它**不會**寫入設定或
變更其他工作階段。

## 控制平面工具風險

兩個內建工具可以進行持久性控制平面變更：

- `gateway` 可以透過 `config.schema.lookup` / `config.get` 檢查設定，並可透過 `config.apply`、`config.patch` 和 `update.run` 進行持久性變更。
- `cron` 可以建立排程工作，即使原始聊天/任務結束後仍會持續執行。

僅限擁有者的 `gateway` runtime tool 仍會拒絕重寫
`tools.exec.ask` 或 `tools.exec.security`；舊版 `tools.bash.*` alias 會在寫入前
正規化為相同的受保護 exec 路徑。
由 agent 驅動的 `gateway config.apply` 與 `gateway config.patch` 編輯
預設會 fail-closed：只有一小組 prompt、model 與 mention-gating
路徑可由 agent 調整。因此新的敏感設定樹會受到保護，
除非它們被刻意加入 allowlist。

對於任何處理不受信任內容的 agent/介面，預設拒絕這些工具：

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` 只會封鎖 restart 動作。它不會停用 `gateway` config/update 動作。

## Plugins

Plugins 會與 Gateway **同程序**執行。請將它們視為受信任程式碼：

- 只安裝來自你信任來源的 plugins。
- 優先使用明確的 `plugins.allow` allowlist。
- 啟用前審查 plugin 設定。
- Plugin 變更後重新啟動 Gateway。
- 如果你安裝或更新 plugins（`openclaw plugins install <package>`、`openclaw plugins update <id>`），請將其視為執行不受信任程式碼：
  - 安裝路徑是有效 plugin 安裝根目錄下的每個 plugin 目錄。
  - OpenClaw 會在安裝/更新前執行內建危險程式碼掃描。`critical` findings 預設會封鎖。
  - npm 與 git plugin 安裝只會在明確的安裝/更新流程期間執行 package-manager dependency convergence。本機路徑與封存檔會被視為自包含的 plugin packages；OpenClaw 會複製/參照它們，而不執行 `npm install`。
  - 優先使用已固定的精確版本（`@scope/pkg@1.2.3`），並在啟用前檢查磁碟上解開的程式碼。
  - `--dangerously-force-unsafe-install` 只是在 plugin 安裝/更新流程中針對內建掃描誤判的 break-glass 選項。它不會繞過 plugin `before_install` hook 政策封鎖，也不會繞過掃描失敗。
  - Gateway-backed skill dependency 安裝遵循相同的 dangerous/suspicious 分流：除非呼叫者明確設定 `dangerouslyForceUnsafeInstall`，否則內建 `critical` findings 會封鎖；而 suspicious findings 仍只會警告。`openclaw skills install` 仍是另一個 ClawHub skill 下載/安裝流程。

詳細資訊：[Plugins](/zh-TW/tools/plugin)

## DM 存取模型：配對、allowlist、open、disabled

所有目前支援 DM 的頻道都支援 DM 政策（`dmPolicy` 或 `*.dm.policy`），會在訊息處理**之前**閘控傳入 DM：

- `pairing`（預設）：未知寄件者會收到一組短配對碼，且 bot 會忽略其訊息直到核准。代碼會在 1 小時後過期；重複 DM 不會重新傳送代碼，直到建立新請求為止。待處理請求預設上限為**每個頻道 3 個**。
- `allowlist`：未知寄件者會被封鎖（沒有配對握手）。
- `open`：允許任何人 DM（公開）。**需要**頻道 allowlist 包含 `"*"`（明確選擇加入）。
- `disabled`：完全忽略傳入 DM。

透過 CLI 核准：

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細資訊 + 磁碟上的檔案：[Pairing](/zh-TW/channels/pairing)

## DM 工作階段隔離（多使用者模式）

預設情況下，OpenClaw 會將**所有 DM 路由到主要工作階段**，讓你的助理能在裝置與頻道之間保持連續性。如果**多人**可以 DM bot（open DMs 或多人 allowlist），請考慮隔離 DM 工作階段：

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

這可避免跨使用者脈絡外洩，同時保持群組聊天隔離。

這是 messaging-context 邊界，不是 host-admin 邊界。如果使用者彼此敵對且共用同一個 Gateway 主機/設定，請改為依信任邊界執行不同 gateways。

### 安全 DM 模式（建議）

請將上方片段視為**安全 DM 模式**：

- 預設：`session.dmScope: "main"`（所有 DM 共用一個工作階段以保持連續性）。
- 本機 CLI onboarding 預設：未設定時寫入 `session.dmScope: "per-channel-peer"`（保留既有明確值）。
- 安全 DM 模式：`session.dmScope: "per-channel-peer"`（每個頻道+寄件者配對都取得隔離的 DM 脈絡）。
- 跨頻道 peer 隔離：`session.dmScope: "per-peer"`（每位寄件者在所有相同類型頻道中取得一個工作階段）。

如果你在同一個頻道上執行多個帳號，請改用 `per-account-channel-peer`。如果同一個人在多個頻道上聯絡你，請使用 `session.identityLinks` 將那些 DM 工作階段合併為一個標準身分。請參閱[工作階段管理](/zh-TW/concepts/session)與[設定](/zh-TW/gateway/configuration)。

## DM 與群組的允許清單

OpenClaw 有兩個分開的「誰可以觸發我？」層級：

- **DM 允許清單**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；舊版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）：誰可以在直接訊息中與機器人對話。
  - 當 `dmPolicy="pairing"` 時，核准項目會寫入 `~/.openclaw/credentials/` 下以帳號為範圍的配對允許清單儲存區（預設帳號為 `<channel>-allowFrom.json`，非預設帳號為 `<channel>-<accountId>-allowFrom.json`），並與設定允許清單合併。
- **群組允許清單**（頻道專屬）：機器人究竟會接受哪些群組/頻道/伺服器的訊息。
  - 常見模式：
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`：每個群組的預設值，例如 `requireMention`；設定後，它也會作為群組允許清單（包含 `"*"` 以保留全部允許的行為）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`：限制在群組工作階段內誰可以觸發機器人（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`：每個介面的允許清單 + 提及預設值。
  - 群組檢查會依此順序執行：先檢查 `groupPolicy`/群組允許清單，再檢查提及/回覆啟用。
  - 回覆機器人訊息（隱含提及）**不會**繞過像 `groupAllowFrom` 這樣的傳送者允許清單。
  - **安全注意事項：**請將 `dmPolicy="open"` 和 `groupPolicy="open"` 視為最後手段設定。它們應該極少使用；除非你完全信任房間中的每位成員，否則請優先使用配對 + 允許清單。

詳細資訊：[設定](/zh-TW/gateway/configuration)與[群組](/zh-TW/channels/groups)

## 提示注入（它是什麼，為什麼重要）

提示注入是指攻擊者刻意撰寫訊息，操控模型執行不安全的動作（「忽略你的指示」、「傾印你的檔案系統」、「開啟這個連結並執行命令」等）。

即使有強力的系統提示，**提示注入仍未被解決**。系統提示防護欄只是軟性指引；強制執行來自工具政策、執行核准、沙盒化與頻道允許清單（而且操作者可以依設計停用這些機制）。實務上有幫助的做法：

- 鎖定傳入 DM（配對/允許清單）。
- 在群組中優先使用提及門檻；避免在公開房間中使用「永遠開啟」的機器人。
- 預設將連結、附件與貼上的指示視為惡意內容。
- 在沙盒中執行敏感工具；讓祕密資訊遠離代理可存取的檔案系統。
- 注意：沙盒化是選擇加入。如果沙盒模式關閉，隱含的 `host=auto` 會解析到 Gateway 主機。明確的 `host=sandbox` 仍會失敗關閉，因為沒有可用的沙盒執行階段。如果你希望在設定中明確表示該行為，請設定 `host=gateway`。
- 將高風險工具（`exec`、`browser`、`web_fetch`、`web_search`）限制給受信任的代理或明確允許清單。
- 如果你允許清單中包含直譯器（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`），請啟用 `tools.exec.strictInlineEval`，讓行內求值形式仍需要明確核准。
- Shell 核准分析也會拒絕 **未加引號 heredoc** 內的 POSIX 參數展開形式（`$VAR`、`$?`、`$$`、`$1`、`$@`、`${…}`），因此允許清單中的 heredoc 內容無法把 Shell 展開偽裝成純文字來繞過允許清單審查。替 heredoc 結束符加上引號（例如 `<<'EOF'`）以選擇使用字面內容語意；可能展開變數的未加引號 heredoc 會被拒絕。
- **模型選擇很重要：**較舊/較小/舊世代模型對提示注入和工具誤用的抵抗力明顯較弱。對啟用工具的代理，請使用可用的最強、最新世代、經指令強化的模型。

應視為不受信任的危險訊號：

- 「讀取這個檔案/URL，並完全照它說的做。」
- 「忽略你的系統提示或安全規則。」
- 「揭露你的隱藏指示或工具輸出。」
- 「貼上 ~/.openclaw 或你的日誌完整內容。」

## 外部內容特殊 Token 清理

OpenClaw 會在包裝後的外部內容與中繼資料到達模型之前，移除常見自架 LLM 聊天模板特殊 Token 字面值。涵蓋的標記家族包含 Qwen/ChatML、Llama、Gemma、Mistral、Phi，以及 GPT-OSS 角色/輪次 Token。

原因：

- 面向自架模型的 OpenAI 相容後端有時會保留出現在使用者文字中的特殊 Token，而不是遮罩它們。能寫入傳入外部內容（擷取的頁面、電子郵件本文、檔案內容工具輸出）的攻擊者，否則可能注入合成的 `assistant` 或 `system` 角色邊界，並逃出包裝內容的防護欄。
- 清理發生在外部內容包裝層，因此會一致套用於擷取/讀取工具與傳入頻道內容，而不是逐提供者處理。
- 傳出的模型回應已經有另一個清理器，會在最終頻道交付邊界，從使用者可見的回覆中移除外洩的 `<tool_call>`、`<function_calls>`、`<system-reminder>`、`<previous_response>` 以及類似的內部執行階段支架。外部內容清理器是傳入方向的對應機制。

這不會取代本頁其他強化措施 - `dmPolicy`、允許清單、執行核准、沙盒化與 `contextVisibility` 仍負責主要工作。它關閉的是針對自架堆疊的一個特定分詞器層繞過路徑，該繞過會在轉送使用者文字時完整保留特殊 Token。

## 不安全外部內容繞過旗標

OpenClaw 包含明確的繞過旗標，會停用外部內容安全包裝：

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron 承載欄位 `allowUnsafeExternalContent`

指引：

- 在生產環境中保持未設定/false。
- 只為了範圍嚴格的除錯而暫時啟用。
- 如果啟用，請隔離該代理（沙盒 + 最少工具 + 專用工作階段命名空間）。

Hook 風險注意事項：

- Hook 承載是不受信任的內容，即使交付來自你控制的系統（郵件/文件/網頁內容可能攜帶提示注入）。
- 較弱的模型層級會提高此風險。對 Hook 驅動的自動化，請優先使用強力的現代模型層級，並保持工具政策嚴格（`tools.profile: "messaging"` 或更嚴格），且盡可能使用沙盒化。

### 提示注入不需要公開 DM

即使**只有你**能傳訊息給機器人，提示注入仍可能透過
機器人讀取的任何**不受信任內容**發生（網頁搜尋/擷取結果、瀏覽器頁面、
電子郵件、文件、附件、貼上的日誌/程式碼）。換句話說：傳送者並不是
唯一的威脅面；**內容本身**也可能攜帶對抗性指示。

啟用工具時，典型風險是外洩脈絡或觸發
工具呼叫。透過以下方式降低影響範圍：

- 使用唯讀或停用工具的**閱讀器代理**來摘要不受信任內容，
  再將摘要傳給你的主要代理。
- 除非需要，否則對啟用工具的代理關閉 `web_search` / `web_fetch` / `browser`。
- 對 OpenResponses URL 輸入（`input_file` / `input_image`），設定嚴格的
  `gateway.http.endpoints.responses.files.urlAllowlist` 與
  `gateway.http.endpoints.responses.images.urlAllowlist`，並保持 `maxUrlParts` 較低。
  空的允許清單會被視為未設定；如果你想完全停用 URL 擷取，請使用 `files.allowUrl: false` / `images.allowUrl: false`。
- 對 OpenResponses 檔案輸入，解碼後的 `input_file` 文字仍會以
  **不受信任的外部內容**注入。不要因為 Gateway 在本機解碼檔案文字，就依賴它是受信任的。即使此路徑省略較長的 `SECURITY NOTICE:` 橫幅，注入區塊仍會攜帶明確的
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 邊界標記與 `Source: External`
  中繼資料。
- 當媒體理解在將文字附加到媒體提示之前，從附加文件中萃取文字時，也會套用相同的標記式包裝。
- 對任何接觸不受信任輸入的代理啟用沙盒化與嚴格工具允許清單。
- 讓祕密資訊遠離提示；改透過 Gateway 主機上的環境變數/設定傳遞。

### 自架 LLM 後端

OpenAI 相容的自架後端，例如 vLLM、SGLang、TGI、LM Studio，
或自訂 Hugging Face 分詞器堆疊，在處理
聊天模板特殊 Token 的方式上可能與託管提供者不同。如果後端會將
像 `<|im_start|>`、`<|start_header_id|>` 或 `<start_of_turn>` 這樣的字面字串，在使用者內容中分詞為
結構性聊天模板 Token，不受信任文字就可能嘗試在分詞器層
偽造角色邊界。

OpenClaw 會先從包裝後的外部內容移除常見模型家族特殊 Token 字面值，
再將其分派給模型。保持外部內容
包裝啟用，並優先使用可用的後端設定，將使用者提供內容中的特殊
Token 分割或逸出。OpenAI 和 Anthropic 等託管提供者已經套用自己的請求端清理。

### 模型強度（安全注意事項）

提示注入抗性在各模型層級之間**並不**一致。較小/較便宜的模型通常更容易受到工具誤用和指令劫持影響，尤其是在對抗性提示下。

<Warning>
對啟用工具的代理，或會讀取不受信任內容的代理，使用較舊/較小模型時提示注入風險通常過高。不要在弱模型層級上執行這些工作負載。
</Warning>

建議：

- 對任何可以執行工具或接觸檔案/網路的機器人，**使用最新世代、最佳層級模型**。
- 對啟用工具的代理或不受信任的收件匣，**不要使用較舊/較弱/較小的層級**；提示注入風險過高。
- 如果你必須使用較小模型，請**降低影響範圍**（唯讀工具、強力沙盒化、最少檔案系統存取、嚴格允許清單）。
- 執行小型模型時，請**為所有工作階段啟用沙盒化**，並**停用 web_search/web_fetch/browser**，除非輸入受到嚴格控制。
- 對只有聊天、輸入受信任且沒有工具的個人助理，較小模型通常沒問題。

## 群組中的推理與詳細輸出

`/reasoning`、`/verbose` 和 `/trace` 可能暴露內部推理、工具
輸出，或 Plugin 診斷資訊，而這些資訊
並非預期用於公開頻道。在群組設定中，請將它們視為**僅供除錯**，
除非明確需要，否則保持關閉。

指引：

- 在公開房間中保持 `/reasoning`、`/verbose` 和 `/trace` 停用。
- 如果你啟用它們，只應在受信任的 DM 或嚴格控制的房間中這麼做。
- 請記住：詳細與追蹤輸出可能包含工具引數、URL、Plugin 診斷資訊，以及模型看過的資料。

## 設定強化範例

### 檔案權限

在 Gateway 主機上保持設定 + 狀態私密：

- `~/.openclaw/openclaw.json`：`600`（僅使用者可讀/寫）
- `~/.openclaw`：`700`（僅使用者）

`openclaw doctor` 可以警告並提供收緊這些權限的選項。

### 網路暴露（繫結、連接埠、防火牆）

Gateway 會在單一連接埠上多工 **WebSocket + HTTP**：

- 預設：`18789`
- 設定/旗標/環境變數：`gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

此 HTTP 介面包含控制 UI 與畫布主機：

- 控制 UI（SPA 資產）（預設基底路徑 `/`）
- 畫布主機：`/__openclaw__/canvas/` 與 `/__openclaw__/a2ui/`（任意 HTML/JS；請視為不受信任內容）

如果你在一般瀏覽器中載入畫布內容，請將它視為任何其他不受信任的網頁：

- 不要將畫布主機暴露給不受信任的網路/使用者。
- 除非你完全理解其影響，否則不要讓畫布內容與特權網頁介面共用相同來源。

繫結模式會控制 Gateway 監聽的位置：

- `gateway.bind: "loopback"`（預設）：只有本機用戶端可以連線。
- 非 loopback 繫結（`"lan"`、`"tailnet"`、`"custom"`）會擴大攻擊面。只有在搭配 Gateway 驗證（共享 token/password，或正確設定的可信任 proxy）和真正的防火牆時才使用。

經驗法則：

- 優先使用 Tailscale Serve，而不是 LAN 繫結（Serve 會讓 Gateway 維持在 loopback 上，並由 Tailscale 處理存取）。
- 如果必須繫結到 LAN，請用防火牆將連接埠限制在嚴格的來源 IP 允許清單；不要大範圍做連接埠轉送。
- 絕不要在未驗證的情況下將 Gateway 暴露在 `0.0.0.0`。

### 使用 UFW 發布 Docker 連接埠

如果你在 VPS 上用 Docker 執行 OpenClaw，請記得已發布的容器連接埠
（`-p HOST:CONTAINER` 或 Compose `ports:`）會經由 Docker 的轉送
chain 路由，而不只是主機的 `INPUT` 規則。

若要讓 Docker 流量與防火牆政策一致，請在
`DOCKER-USER` 中強制套用規則（此 chain 會在 Docker 自己的 accept 規則之前評估）。
在許多現代發行版中，`iptables`/`ip6tables` 使用 `iptables-nft` 前端，
並且仍會將這些規則套用到 nftables 後端。

最小允許清單範例（IPv4）：

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 有獨立的表格。如果啟用了 Docker IPv6，請在 `/etc/ufw/after6.rules` 中
加入相符的政策。

避免在文件片段中硬編碼像 `eth0` 這樣的介面名稱。介面名稱會因 VPS 映像而異
（`ens3`、`enp*` 等），不相符可能會意外跳過你的拒絕規則。

重新載入後快速驗證：

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

預期的外部連接埠應該只包含你刻意暴露的項目（對多數
設定而言：SSH + 你的反向 proxy 連接埠）。

### mDNS/Bonjour 探索

啟用內建的 `bonjour` Plugin 時，Gateway 會透過 mDNS（`_openclaw-gw._tcp`，連接埠 5353）廣播其存在，用於本機裝置探索。在完整模式中，這會包含可能暴露作業細節的 TXT 記錄：

- `cliPath`：CLI binary 的完整檔案系統路徑（會透露使用者名稱和安裝位置）
- `sshPort`：宣告主機上的 SSH 可用性
- `displayName`、`lanHost`：主機名稱資訊

**作業安全考量：** 廣播基礎設施細節會讓本機網路上的任何人更容易偵察。即使是像檔案系統路徑和 SSH 可用性這類「無害」資訊，也能幫助攻擊者描繪你的環境。

**建議：**

1. **除非需要 LAN 探索，否則保持 Bonjour 停用。** Bonjour 會在 macOS 主機上自動啟動，在其他地方則需選擇啟用；直接 Gateway URL、Tailnet、SSH 或廣域 DNS-SD 可避免本機 multicast。

2. **最小模式**（啟用 Bonjour 時的預設值，建議用於暴露的 Gateway）：從 mDNS 廣播中省略敏感欄位：

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. 如果你想保持 Plugin 啟用但抑制本機裝置探索，請**停用 mDNS 模式**：

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **完整模式**（選擇啟用）：在 TXT 記錄中包含 `cliPath` + `sshPort`：

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **環境變數**（替代方式）：設定 `OPENCLAW_DISABLE_BONJOUR=1`，即可在不變更設定的情況下停用 mDNS。

當 Bonjour 以最小模式啟用時，Gateway 會廣播裝置探索所需的足夠資訊（`role`、`gatewayPort`、`transport`），但省略 `cliPath` 和 `sshPort`。需要 CLI 路徑資訊的應用程式可以改透過已驗證的 WebSocket 連線擷取。

### 鎖定 Gateway WebSocket（本機驗證）

Gateway 驗證**預設為必要**。如果未設定有效的 Gateway 驗證路徑，
Gateway 會拒絕 WebSocket 連線（失敗即關閉）。

Onboarding 預設會產生 token（即使是 loopback），因此
本機用戶端必須驗證。

設定 token，讓**所有** WS 用戶端都必須驗證：

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor 可以為你產生一個：`openclaw doctor --generate-gateway-token`。

<Note>
`gateway.remote.token` 和 `gateway.remote.password` 是用戶端憑證來源。它們本身**不會**保護本機 WS 存取。本機呼叫路徑只有在 `gateway.auth.*` 未設定時，才能使用 `gateway.remote.*` 作為 fallback。如果 `gateway.auth.token` 或 `gateway.auth.password` 已透過 SecretRef 明確設定且無法解析，解析會失敗即關閉（不會用遠端 fallback 掩蓋）。
</Note>
選用：使用 `wss://` 時，可用 `gateway.remote.tlsFingerprint` 釘選遠端 TLS。
明文 `ws://` 預設僅限 loopback。對於可信任的私人網路
路徑，請在用戶端程序上設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
作為 break-glass。這刻意只作為程序環境，而不是
`openclaw.json` 設定鍵。
行動裝置配對以及 Android 手動或掃描的 Gateway 路由更嚴格：
cleartext 可用於 loopback，但 private-LAN、link-local、`.local` 和
無點主機名稱必須使用 TLS，除非你明確選擇加入可信任的
私人網路 cleartext 路徑。

本機裝置配對：

- 直接 local loopback 連線會自動核准裝置配對，以保持同主機用戶端順暢。
- OpenClaw 也有一條狹窄的後端/container-local 自我連線路徑，用於可信任的 shared-secret 輔助流程。
- Tailnet 和 LAN 連線，包括同主機 tailnet 繫結，都會被視為遠端配對，仍需要核准。
- loopback 請求上的 forwarded-header 證據會使 loopback 本地性失效。metadata-upgrade 自動核准範圍很窄。兩項規則請參閱
  [Gateway 配對](/zh-TW/gateway/pairing)。

驗證模式：

- `gateway.auth.mode: "token"`：共享 bearer token（建議用於多數設定）。
- `gateway.auth.mode: "password"`：密碼驗證（建議透過 env 設定：`OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`：信任具身分感知能力的反向 proxy 來驗證使用者，並透過 header 傳遞身分（請參閱[可信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。

輪替檢查清單（token/password）：

1. 產生/設定新的 secret（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_PASSWORD`）。
2. 重新啟動 Gateway（如果是 macOS app 監督 Gateway，則重新啟動 macOS app）。
3. 更新任何遠端用戶端（呼叫 Gateway 的機器上的 `gateway.remote.token` / `.password`）。
4. 驗證你已無法再使用舊憑證連線。

### Tailscale Serve 身分 Header

當 `gateway.auth.allowTailscale` 為 `true`（Serve 的預設值）時，OpenClaw
會接受 Tailscale Serve 身分 header（`tailscale-user-login`）用於 Control
UI/WebSocket 驗證。OpenClaw 會透過本機 Tailscale daemon（`tailscale whois`）解析
`x-forwarded-for` 位址並與 header 比對，以驗證身分。這只會在請求命中 loopback
並包含由 Tailscale 注入的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 時觸發。
對於這條非同步身分檢查路徑，在 limiter 記錄失敗之前，同一個 `{scope, ip}` 的失敗嘗試會被序列化。因此，來自同一個 Serve 用戶端的並行錯誤重試，可能會立即鎖定第二次嘗試，而不是像兩個單純不相符那樣競速通過。
HTTP API 端點（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不會**使用 Tailscale 身分 header 驗證。它們仍會遵循 Gateway
設定的 HTTP 驗證模式。

重要邊界注意事項：

- Gateway HTTP bearer 驗證實際上是全有或全無的操作員存取。
- 將能呼叫 `/v1/chat/completions`、`/v1/responses` 或 `/api/channels/*` 的憑證視為該 Gateway 的完整存取操作員 secret。
- 在 OpenAI 相容的 HTTP 表面上，shared-secret bearer 驗證會恢復完整的預設操作員 scope（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）以及 agent turn 的 owner 語義；較窄的 `x-openclaw-scopes` 值不會降低該 shared-secret 路徑的權限。
- HTTP 上的逐請求 scope 語義只會在請求來自帶有身分的模式時套用，例如 trusted proxy auth，或私人入口上的 `gateway.auth.mode="none"`。
- 在這些帶有身分的模式中，省略 `x-openclaw-scopes` 會 fallback 到一般操作員預設 scope 集；想要較窄的 scope 集時，請明確傳送該 header。
- `/tools/invoke` 遵循相同的 shared-secret 規則：token/password bearer 驗證在那裡也會被視為完整操作員存取，而帶有身分的模式仍會遵守宣告的 scope。
- 不要與不受信任的呼叫者分享這些憑證；每個信任邊界應優先使用獨立 Gateway。

**信任假設：** tokenless Serve auth 假設 Gateway 主機是可信任的。
不要把這當作對抗惡意同主機程序的保護。如果不受信任的
本機程式碼可能在 Gateway 主機上執行，請停用 `gateway.auth.allowTailscale`
並要求使用 `gateway.auth.mode: "token"` 或
`"password"` 進行明確 shared-secret 驗證。

**安全規則：** 不要從你自己的反向 proxy 轉送這些 header。如果
你在 Gateway 前方終止 TLS 或 proxy，請停用
`gateway.auth.allowTailscale`，並改用 shared-secret 驗證（`gateway.auth.mode:
"token"` 或 `"password"`）或[可信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

可信任 proxy：

- 如果你在 Gateway 前方終止 TLS，請將 `gateway.trustedProxies` 設為你的 proxy IP。
- OpenClaw 會信任來自這些 IP 的 `x-forwarded-for`（或 `x-real-ip`），以判斷用於本機配對檢查和 HTTP 驗證/本機檢查的用戶端 IP。
- 確保你的 proxy **覆寫** `x-forwarded-for`，並封鎖對 Gateway 連接埠的直接存取。

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 和 [Web 概覽](/zh-TW/web)。

### 透過 Node 主機控制瀏覽器（建議）

如果你的 Gateway 是遠端的，但瀏覽器在另一台機器上執行，請在瀏覽器機器上執行
**Node 主機**，並讓 Gateway proxy 瀏覽器動作（請參閱[瀏覽器工具](/zh-TW/tools/browser)）。
請將 node 配對視為管理員存取。

建議模式：

- 將 Gateway 和 Node 主機保持在同一個 tailnet（Tailscale）上。
- 有意識地配對 Node；如果不需要，請停用瀏覽器 proxy 路由。

避免：

- 透過 LAN 或公開 Internet 暴露 relay/control 連接埠。
- 將 Tailscale Funnel 用於瀏覽器控制端點（公開暴露）。

### 磁碟上的 Secret

假設 `~/.openclaw/`（或 `$OPENCLAW_STATE_DIR/`）底下的任何內容都可能包含 secret 或私密資料：

- `openclaw.json`：設定可能包含 token（Gateway、遠端 Gateway）、provider 設定和允許清單。
- `credentials/**`：channel 憑證（範例：WhatsApp 憑證）、配對允許清單、舊版 OAuth 匯入。
- `agents/<agentId>/agent/auth-profiles.json`：API key、token profile、OAuth token，以及選用的 `keyRef`/`tokenRef`。
- `agents/<agentId>/agent/codex-home/**`：每個 agent 的 Codex app-server 帳號、設定、skills、plugins、原生 thread 狀態和診斷。
- `secrets.json`（選用）：由 `file` SecretRef provider（`secrets.providers`）使用的檔案後端 secret payload。
- `agents/<agentId>/agent/auth.json`：舊版相容性檔案。靜態 `api_key` 項目會在被發現時清除。
- `agents/<agentId>/sessions/**`：session transcript（`*.jsonl`）+ routing metadata（`sessions.json`），可能包含私人訊息和工具輸出。
- 內建 Plugin 套件：已安裝的 plugins（加上其 `node_modules/`）。
- `sandboxes/**`：工具 sandbox 工作區；可能累積你在 sandbox 內讀取/寫入的檔案副本。

強化提示：

- 保持權限嚴格（目錄設為 `700`，檔案設為 `600`）。
- 在 Gateway 主機上使用全磁碟加密。
- 如果主機是共用的，建議為 Gateway 使用專用的作業系統使用者帳號。

### 工作區 `.env` 檔案

OpenClaw 會為代理與工具載入工作區本機的 `.env` 檔案，但絕不允許這些檔案靜默覆寫 Gateway 執行階段控制。

- 任何以 `OPENCLAW_*` 開頭的鍵，都會從不受信任的工作區 `.env` 檔案中被封鎖。
- Matrix、Mattermost、IRC 和 Synology Chat 的頻道端點設定，也會被封鎖而無法由工作區 `.env` 覆寫，因此複製而來的工作區無法透過本機端點設定重新導向內建連接器流量。端點環境變數鍵（例如 `MATRIX_HOMESERVER`、`MATTERMOST_URL`、`IRC_HOST`、`SYNOLOGY_CHAT_INCOMING_URL`）必須來自 Gateway 行程環境或 `env.shellEnv`，而不是來自工作區載入的 `.env`。
- 封鎖採用封閉失敗：未來版本新增的執行階段控制變數，不能從已提交或攻擊者提供的 `.env` 繼承；該鍵會被忽略，Gateway 會保留自己的值。
- 受信任的行程／作業系統環境變數（Gateway 自己的 shell、launchd/systemd 單元、應用程式套件）仍會套用 - 這只限制 `.env` 檔案載入。

原因：工作區 `.env` 檔案經常與代理程式碼放在一起、意外被提交，或由工具寫入。封鎖整個 `OPENCLAW_*` 前綴，表示日後新增新的 `OPENCLAW_*` 旗標時，永遠不會退化為從工作區狀態靜默繼承。

### 日誌與文字記錄（遮罩與保留）

即使存取控制正確，日誌與文字記錄仍可能洩漏敏感資訊：

- Gateway 日誌可能包含工具摘要、錯誤和 URL。
- 工作階段文字記錄可能包含貼上的祕密、檔案內容、命令輸出和連結。

建議：

- 保持日誌與文字記錄遮罩開啟（`logging.redactSensitive: "tools"`；預設值）。
- 透過 `logging.redactPatterns` 為你的環境新增自訂模式（權杖、主機名稱、內部 URL）。
- 分享診斷資訊時，建議使用 `openclaw status --all`（可貼上，祕密已遮罩），不要使用原始日誌。
- 如果不需要長期保留，請清除舊的工作階段文字記錄與日誌檔案。

詳細資訊：[日誌](/zh-TW/gateway/logging)

### 私訊：預設配對

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 群組：所有地方都需要提及

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

在群組聊天中，只有在明確被提及時才回覆。

### 分開的號碼（WhatsApp、Signal、Telegram）

對於以電話號碼為基礎的頻道，請考慮讓 AI 使用與個人號碼不同的獨立電話號碼：

- 個人號碼：你的對話保持私密
- 機器人號碼：AI 處理這些對話，並有適當邊界

### 唯讀模式（透過沙箱和工具）

你可以結合以下項目建立唯讀設定檔：

- `agents.defaults.sandbox.workspaceAccess: "ro"`（或使用 `"none"` 表示沒有工作區存取權）
- 封鎖 `write`、`edit`、`apply_patch`、`exec`、`process` 等的工具允許／拒絕清單。

其他強化選項：

- `tools.exec.applyPatch.workspaceOnly: true`（預設值）：確保即使沙箱關閉，`apply_patch` 也無法在工作區目錄外寫入／刪除。只有在你有意讓 `apply_patch` 觸及工作區外的檔案時，才設為 `false`。
- `tools.fs.workspaceOnly: true`（選用）：將 `read`／`write`／`edit`／`apply_patch` 路徑與原生提示圖片自動載入路徑限制在工作區目錄內（如果你目前允許絕對路徑，並想要單一防護欄，這會很有用）。
- 保持檔案系統根目錄範圍狹窄：避免將家目錄這類廣泛根目錄用於代理工作區／沙箱工作區。廣泛根目錄可能會讓敏感本機檔案（例如 `~/.openclaw` 下的狀態／設定）暴露給檔案系統工具。

### 安全基準（複製／貼上）

一個「安全預設」設定，可讓 Gateway 保持私密、要求私訊配對，並避免群組機器人永遠開啟：

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

如果你也想要工具執行「預設更安全」，請為任何非擁有者代理新增沙箱並拒絕危險工具（範例見下方「每個代理存取設定檔」）。

聊天驅動代理回合的內建基準：非擁有者傳送者不能使用 `cron` 或 `gateway` 工具。

## 沙箱化（建議）

專用文件：[沙箱化](/zh-TW/gateway/sandboxing)

兩種互補方法：

- **在 Docker 中執行完整 Gateway**（容器邊界）：[Docker](/zh-TW/install/docker)
- **工具沙箱**（`agents.defaults.sandbox`，主機 Gateway + 沙箱隔離的工具；Docker 是預設後端）：[沙箱化](/zh-TW/gateway/sandboxing)

<Note>
若要防止跨代理存取，請將 `agents.defaults.sandbox.scope` 保持在 `"agent"`（預設值），或使用 `"session"` 以取得更嚴格的每工作階段隔離。`scope: "shared"` 會使用單一容器或工作區。
</Note>

也請考慮沙箱內的代理工作區存取：

- `agents.defaults.sandbox.workspaceAccess: "none"`（預設值）讓代理工作區不可存取；工具會針對 `~/.openclaw/sandboxes` 下的沙箱工作區執行
- `agents.defaults.sandbox.workspaceAccess: "ro"` 以唯讀方式將代理工作區掛載到 `/agent`（停用 `write`／`edit`／`apply_patch`）
- `agents.defaults.sandbox.workspaceAccess: "rw"` 以讀寫方式將代理工作區掛載到 `/workspace`
- 額外的 `sandbox.docker.binds` 會根據正規化和標準化的來源路徑驗證。如果父層符號連結技巧和標準家目錄別名解析到受封鎖根目錄，例如 `/etc`、`/var/run` 或作業系統家目錄下的認證目錄，仍會封閉失敗。

<Warning>
`tools.elevated` 是全域基準逃生口，會在沙箱外執行 exec。有效主機預設為 `gateway`，或在 exec 目標設定為 `node` 時為 `node`。請嚴格限制 `tools.elevated.allowFrom`，不要為陌生人啟用。你可以透過 `agents.list[].tools.elevated` 進一步依代理限制提升權限。請參閱[提升權限模式](/zh-TW/tools/elevated)。
</Warning>

### 子代理委派防護欄

如果你允許工作階段工具，請將委派的子代理執行視為另一個邊界決策：

- 除非代理確實需要委派，否則拒絕 `sessions_spawn`。
- 將 `agents.defaults.subagents.allowAgents` 與任何個別代理的 `agents.list[].subagents.allowAgents` 覆寫限制在已知安全的目標代理。
- 對於任何必須維持沙箱化的工作流程，請以 `sandbox: "require"` 呼叫 `sessions_spawn`（預設值為 `inherit`）。
- 當目標子執行階段未沙箱化時，`sandbox: "require"` 會快速失敗。

## 瀏覽器控制風險

啟用瀏覽器控制會讓模型具備操作真實瀏覽器的能力。
如果該瀏覽器設定檔已包含登入中的工作階段，模型就能
存取這些帳號與資料。請將瀏覽器設定檔視為**敏感狀態**：

- 建議為代理使用專用設定檔（預設的 `openclaw` 設定檔）。
- 避免將代理指向你個人日常使用的設定檔。
- 除非你信任沙箱化代理，否則請停用主機瀏覽器控制。
- 獨立的 local loopback 瀏覽器控制 API 只接受共享祕密驗證
  （Gateway 權杖 bearer 驗證或 Gateway 密碼）。它不使用
  受信任代理或 Tailscale Serve 身分標頭。
- 將瀏覽器下載項目視為不受信任的輸入；建議使用隔離的下載目錄。
- 如果可能，請停用代理設定檔中的瀏覽器同步／密碼管理工具（降低影響範圍）。
- 對於遠端 Gateway，請假設「瀏覽器控制」等同於對該設定檔可觸及任何內容的「操作者存取」。
- 讓 Gateway 和節點主機僅限 tailnet；避免將瀏覽器控制連接埠暴露到 LAN 或公用網際網路。
- 不需要時停用瀏覽器代理路由（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP 現有工作階段模式**不是**「更安全」；它可以在該主機 Chrome 設定檔可觸及的任何地方代表你操作。

### 瀏覽器 SSRF 政策（預設嚴格）

OpenClaw 的瀏覽器導覽政策預設為嚴格：除非你明確選擇加入，否則私有／內部目的地會保持封鎖。

- 預設：`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 未設定，因此瀏覽器導覽會持續封鎖私有／內部／特殊用途目的地。
- 舊版別名：為了相容性，仍接受 `browser.ssrfPolicy.allowPrivateNetwork`。
- 選擇加入模式：設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 以允許私有／內部／特殊用途目的地。
- 在嚴格模式中，使用 `hostnameAllowlist`（例如 `*.example.com` 的模式）和 `allowedHostnames`（精確主機例外，包括像 `localhost` 這類被封鎖的名稱）來設定明確例外。
- 導覽會在請求前檢查，並在導覽後對最終 `http(s)` URL 盡力重新檢查，以降低基於重新導向的樞紐轉移。

嚴格政策範例：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## 每個代理存取設定檔（多代理）

透過多代理路由，每個代理都可以有自己的沙箱與工具政策：
使用這點為每個代理提供**完整存取權**、**唯讀**或**無存取權**。
請參閱[多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)以取得完整詳細資訊
與優先順序規則。

常見使用案例：

- 個人代理：完整存取權，沒有沙箱
- 家庭／工作代理：沙箱化 + 唯讀工具
- 公用代理：沙箱化 + 沒有檔案系統／shell 工具

### 範例：完整存取權（沒有沙箱）

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### 範例：唯讀工具 + 唯讀工作區

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### 範例：沒有檔案系統／shell 存取權（允許提供者訊息）

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## 事件回應

如果你的 AI 做了不好的事：

### 控制事態

1. **停止執行：** 停止 macOS App（如果它監管 Gateway）或終止你的 `openclaw gateway` 程序。
2. **收斂暴露範圍：** 將 `gateway.bind: "loopback"`（或停用 Tailscale Funnel/Serve）設定好，直到你了解發生了什麼事。
3. **凍結存取權：** 將有風險的私訊/群組切換為 `dmPolicy: "disabled"` / 要求提及，並移除你原本設定的 `"*"` 全允許項目。

### 輪替（若機密資料外洩，請假設已遭入侵）

1. 輪替 Gateway 驗證（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）並重新啟動。
2. 在任何可呼叫 Gateway 的機器上輪替遠端用戶端機密（`gateway.remote.token` / `.password`）。
3. 輪替提供者/API 憑證（WhatsApp 憑證、Slack/Discord 權杖、`auth-profiles.json` 中的模型/API 金鑰，以及使用時的加密機密 payload 值）。

### 稽核

1. 檢查 Gateway 記錄：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`）。
2. 檢閱相關逐字稿：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 檢閱最近的設定變更（任何可能擴大存取權的項目：`gateway.bind`、`gateway.auth`、私訊/群組政策、`tools.elevated`、Plugin 變更）。
4. 重新執行 `openclaw security audit --deep`，並確認重大發現已解決。

### 收集報告資料

- 時間戳記、Gateway 主機作業系統 + OpenClaw 版本
- 工作階段逐字稿 + 一小段記錄尾端（遮蔽敏感內容後）
- 攻擊者傳送了什麼 + 代理程式做了什麼
- Gateway 是否暴露在 loopback 以外（LAN/Tailscale Funnel/Serve）

## 機密掃描

CI 會對儲存庫執行 pre-commit `detect-private-key` hook。如果它
失敗，請移除或輪替已提交的金鑰材料，然後在本機重現：

```bash
pre-commit run --all-files detect-private-key
```

## 回報安全性問題

在 OpenClaw 發現漏洞？請負責任地回報：

1. 電子郵件：[security@openclaw.ai](mailto:security@openclaw.ai)
2. 修復前請勿公開張貼
3. 我們會列名致謝（除非你偏好匿名）
