---
read_when:
    - 新增會擴大存取權限或自動化範圍的功能
summary: 執行具有命令殼層存取權限的人工智慧 Gateway 時的安全考量與威脅模型
title: 安全性
x-i18n:
    generated_at: "2026-04-30T03:09:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a1733675f30b5eb8a45eae671aaa8cf41323e16d2543a02ed7bda558c4ebad1
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **個人助理信任模型。** 本指南假設每個 Gateway 有一個受信任的
  操作者邊界（單一使用者、個人助理模型）。
  OpenClaw **不是** 供多個
  對抗性使用者共用同一個代理或 Gateway 的敵對多租戶安全邊界。如果你需要混合信任或
  對抗性使用者操作，請拆分信任邊界（獨立的 Gateway +
  憑證，最好也使用獨立的 OS 使用者或主機）。
</Warning>

## 先界定範圍：個人助理安全模型

OpenClaw 安全指南假設採用**個人助理**部署：一個受信任的操作者邊界，可能有多個代理。

- 支援的安全態勢：每個 Gateway 對應一個使用者／信任邊界（建議每個邊界使用一個 OS 使用者／主機／VPS）。
- 不支援作為安全邊界：由彼此不受信任或具對抗性的使用者共用一個 Gateway／代理。
- 如果需要對抗性使用者隔離，請依信任邊界拆分（獨立的 Gateway + 憑證，最好也使用獨立的 OS 使用者／主機）。
- 如果多個不受信任的使用者可以傳訊息給同一個已啟用工具的代理，請將他們視為共用該代理相同的委派工具權限。

本頁說明如何**在該模型內**強化安全。它不宣稱能在一個共用 Gateway 上提供敵對多租戶隔離。

## 快速檢查：`openclaw security audit`

另請參閱：[形式化驗證（安全模型）](/zh-TW/security/formal-verification)

定期執行這些指令（特別是在變更設定或暴露網路表面之後）：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` 會刻意保持狹窄範圍：它會將常見的開放群組
政策切換為允許清單，還原 `logging.redactSensitive: "tools"`，收緊
狀態／設定／include-file 權限，並在 Windows 上執行時使用 Windows ACL 重設，而不是
POSIX `chmod`。

它會標示常見的風險點（Gateway 驗證暴露、瀏覽器控制暴露、提升權限允許清單、檔案系統權限、寬鬆的 exec 核准，以及開放頻道工具暴露）。

OpenClaw 既是產品也是實驗：你正在把前沿模型行為接到真實的訊息介面與真實工具上。**不存在「完全安全」的設定。** 目標是有意識地決定：

- 誰可以跟你的機器人對話
- 機器人可以在哪裡採取動作
- 機器人可以接觸什麼

從仍能正常運作的最小存取權開始，然後在你更有信心後再擴大。

### 部署與主機信任

OpenClaw 假設主機與設定邊界是受信任的：

- 如果有人可以修改 Gateway 主機狀態／設定（`~/.openclaw`，包含 `openclaw.json`），請將他們視為受信任的操作者。
- 對多個彼此不受信任／具對抗性的操作者執行同一個 Gateway **不是建議的設定**。
- 對於混合信任團隊，請使用獨立 Gateway 拆分信任邊界（或至少使用獨立 OS 使用者／主機）。
- 建議預設值：每台機器／主機（或 VPS）一位使用者，該使用者一個 Gateway，並在該 Gateway 中放置一個或多個代理。
- 在同一個 Gateway 執行個體內，已驗證的操作者存取是受信任的控制平面角色，而不是每位使用者各自的租戶角色。
- 工作階段識別碼（`sessionKey`、工作階段 ID、標籤）是路由選擇器，不是授權權杖。
- 如果數個人可以傳訊息給同一個已啟用工具的代理，他們每個人都可以引導同一組權限。每位使用者的工作階段／記憶體隔離有助於隱私，但不會把共用代理轉換成每位使用者各自的主機授權。

### 共用 Slack 工作區：真實風險

如果「Slack 中每個人都可以傳訊息給機器人」，核心風險就是委派工具權限：

- 任何已允許的傳送者都可以在代理的政策內誘發工具呼叫（`exec`、瀏覽器、網路／檔案工具）；
- 來自某位傳送者的提示／內容注入可能導致影響共用狀態、裝置或輸出的動作；
- 如果某個共用代理擁有敏感憑證／檔案，任何已允許的傳送者都可能透過工具使用來驅動外洩。

團隊工作流程請使用工具最少的獨立代理／Gateway；將個人資料代理保持私密。

### 公司共用代理：可接受模式

當所有使用該代理的人都位於同一個信任邊界內（例如同一個公司團隊），且該代理嚴格限定於業務範圍時，這是可接受的。

- 在專用機器／VM／容器上執行它；
- 為該執行環境使用專用 OS 使用者 + 專用瀏覽器／設定檔／帳戶；
- 不要讓該執行環境登入個人 Apple／Google 帳戶或個人密碼管理器／瀏覽器設定檔。

如果你在同一個執行環境上混用個人與公司身分，就會破壞隔離並增加個人資料暴露風險。

## Gateway 與 Node 信任概念

將 Gateway 和 Node 視為同一個操作者信任網域，但角色不同：

- **Gateway** 是控制平面與政策表面（`gateway.auth`、工具政策、路由）。
- **Node** 是配對到該 Gateway 的遠端執行表面（命令、裝置動作、主機本機能力）。
- 已向 Gateway 驗證的呼叫者在 Gateway 範圍內受信任。配對後，Node 動作會被視為該 Node 上受信任的操作者動作。
- 使用共用 Gateway
  權杖／密碼驗證的直接 loopback 後端用戶端，可以在不提供使用者
  裝置身分的情況下進行內部控制平面 RPC。這不是遠端或瀏覽器配對繞過：網路
  用戶端、Node 用戶端、裝置權杖用戶端，以及明確裝置身分
  仍會經過配對與範圍升級強制執行。
- `sessionKey` 是路由／內容選擇，不是每位使用者的驗證。
- Exec 核准（允許清單 + 詢問）是操作者意圖的防護欄，不是敵對多租戶隔離。
- OpenClaw 對受信任單一操作者設定的產品預設值，是允許在 `gateway`／`node` 上執行主機 exec 而不顯示核准提示（`security="full"`、`ask="off"`，除非你收緊設定）。該預設值是有意的使用者體驗，不是本身的漏洞。
- Exec 核准會綁定確切的請求內容與盡力判定的直接本機檔案操作數；它們不會在語意上建模每一條執行環境／直譯器載入器路徑。若需要強邊界，請使用沙箱與主機隔離。

如果你需要敵對使用者隔離，請依 OS 使用者／主機拆分信任邊界並執行獨立 Gateway。

## 信任邊界矩陣

在分級風險時，使用這個快速模型：

| 邊界或控制                                                | 它的意思                                          | 常見誤讀                                                                      |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（權杖／密碼／受信任 Proxy／裝置驗證）      | 驗證 Gateway API 的呼叫者                         | 「每個 frame 都需要每則訊息簽章才安全」                                      |
| `sessionKey`                                              | 用於內容／工作階段選擇的路由鍵                    | 「工作階段金鑰是使用者驗證邊界」                                             |
| 提示／內容防護欄                                         | 降低模型濫用風險                                  | 「僅提示注入就證明驗證繞過」                                                 |
| `canvas.eval` / 瀏覽器 evaluate                          | 啟用時是有意的操作者能力                          | 「任何 JS eval 原語在這個信任模型中都自動是漏洞」                            |
| 本機 TUI `!` shell                                       | 明確由操作者觸發的本機執行                        | 「本機 shell 便利命令是遠端注入」                                            |
| Node 配對與 Node 命令                                    | 已配對裝置上的操作者層級遠端執行                  | 「遠端裝置控制預設應視為不受信任使用者存取」                                 |
| `gateway.nodes.pairing.autoApproveCidrs`                  | 選擇啟用的受信任網路 Node 註冊政策                | 「預設停用的允許清單就是自動配對漏洞」                                       |

## 依設計並非漏洞

<Accordion title="常見但不在範圍內的發現">

這些模式經常被回報；除非證明存在真實邊界繞過，否則通常會以無需處理結案：

- 只有提示注入的鏈，沒有政策、驗證或沙箱繞過。
- 假設在同一個共用主機或設定上進行敵對多租戶操作的主張。
- 將一般操作者讀取路徑存取（例如
  `sessions.list` / `sessions.preview` / `chat.history`）在
  共用 Gateway 設定中分類為 IDOR 的主張。
- 僅限 Localhost 部署的發現（例如僅限 loopback 的
  Gateway 上的 HSTS）。
- 此 repo 中不存在的入站路徑之 Discord 入站 Webhook 簽章發現。
- 將 Node 配對中繼資料視為 `system.run` 的隱藏第二層逐命令
  核准層的報告；實際執行邊界仍然是
  Gateway 的全域 Node 命令政策加上 Node 自己的 exec
  核准。
- 將已設定的 `gateway.nodes.pairing.autoApproveCidrs` 本身視為
  漏洞的報告。此設定預設停用，需要
  明確的 CIDR/IP 項目，只適用於第一次 `role: node` 配對且
  沒有請求範圍的情況，並且不會自動核准操作者／瀏覽器／Control UI、
  WebChat、角色升級、範圍升級、中繼資料變更、公鑰變更，
  或同主機 loopback 受信任 Proxy 標頭路徑，除非已明確啟用 loopback 受信任 Proxy 驗證。
- 將 `sessionKey` 視為
  驗證權杖的「缺少每位使用者授權」發現。

</Accordion>

## 60 秒強化基準

先使用這個基準，然後再依每個受信任代理選擇性重新啟用工具：

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

這會讓 Gateway 僅限本機、隔離 DM，並預設停用控制平面／執行環境工具。

## 共用收件匣快速規則

如果不只一個人可以 DM 你的機器人：

- 設定 `session.dmScope: "per-channel-peer"`（或對多帳戶頻道使用 `"per-account-channel-peer"`）。
- 保持 `dmPolicy: "pairing"` 或嚴格允許清單。
- 絕不要將共用 DM 與廣泛工具存取結合。
- 這會強化合作式／共用收件匣，但當使用者共用主機／設定寫入存取時，它並非設計為敵對共同租戶隔離。

## 內容可見性模型

OpenClaw 區分兩個概念：

- **觸發授權**：誰可以觸發代理（`dmPolicy`、`groupPolicy`、允許清單、提及閘門）。
- **內容可見性**：哪些補充內容會注入模型輸入（回覆正文、引用文字、討論串歷史、轉發中繼資料）。

允許清單會管控觸發與命令授權。`contextVisibility` 設定會控制補充內容（引用回覆、討論串根、擷取的歷史）如何被篩選：

- `contextVisibility: "all"`（預設）會保留收到的補充內容。
- `contextVisibility: "allowlist"` 會將補充內容篩選為主動允許清單檢查所允許的傳送者。
- `contextVisibility: "allowlist_quote"` 行為類似 `allowlist`，但仍會保留一則明確引用的回覆。

請依每個頻道或每個房間／對話設定 `contextVisibility`。設定細節請參閱[群組聊天](/zh-TW/channels/groups#context-visibility-and-allowlists)。

建議分級指南：

- 只聲稱「模型可以看到來自非允許清單寄件者的引用或歷史文字」的報告，是可透過 `contextVisibility` 處理的強化發現；其本身並不構成身分驗證或沙箱邊界繞過。
- 若要具有安全影響，報告仍需要示範信任邊界繞過（身分驗證、政策、沙箱、核准，或另一個已文件化的邊界）。

## 稽核檢查內容（高層次）

- **傳入存取**（DM 政策、群組政策、允許清單）：陌生人能否觸發機器人？
- **工具影響範圍**（提升權限的工具 + 開放聊天室）：提示注入是否可能轉化為 shell/檔案/網路動作？
- **Exec 核准漂移**（`security=full`、`autoAllowSkills`、沒有 `strictInlineEval` 的直譯器允許清單）：主機 exec 護欄是否仍如你預期般運作？
  - `security="full"` 是廣泛的狀態警告，不是錯誤證明。這是受信任個人助理設定的預設選擇；只有在你的威脅模型需要核准或允許清單護欄時，才需收緊它。
- **網路暴露**（Gateway 繫結/身分驗證、Tailscale Serve/Funnel、弱或過短的身分驗證權杖）。
- **瀏覽器控制暴露**（遠端節點、中繼連接埠、遠端 CDP 端點）。
- **本機磁碟衛生**（權限、符號連結、設定 include、「同步資料夾」路徑）。
- **Plugins**（plugins 在沒有明確允許清單的情況下載入）。
- **政策漂移/設定錯誤**（已設定 sandbox docker 設定但沙箱模式關閉；`gateway.nodes.denyCommands` 模式無效，因為比對僅限精確命令名稱（例如 `system.run`），且不檢查 shell 文字；危險的 `gateway.nodes.allowCommands` 項目；全域 `tools.profile="minimal"` 被個別 agent profile 覆寫；plugin 擁有的工具在寬鬆工具政策下可觸及）。
- **執行階段預期漂移**（例如假設隱含 exec 仍表示 `sandbox`，但 `tools.exec.host` 現在預設為 `auto`；或在沙箱模式關閉時明確設定 `tools.exec.host="sandbox"`）。
- **模型衛生**（在已設定的模型看起來是舊版時警告；不是硬性阻擋）。

如果你執行 `--deep`，OpenClaw 也會嘗試盡力進行即時 Gateway 探測。

## 憑證儲存對照表

稽核存取或決定要備份哪些內容時，請使用此表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 機器人權杖**：設定/env 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結）
- **Discord 機器人權杖**：設定/env 或 SecretRef（env/file/exec providers）
- **Slack 權杖**：設定/env（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳戶）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳戶）
- **模型身分驗證 profile**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **檔案支援的祕密承載（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`

## 安全稽核檢查清單

稽核列印發現時，請依此優先順序處理：

1. **任何「開放」+ 已啟用工具**：先鎖定 DM/群組（配對/允許清單），再收緊工具政策/沙箱化。
2. **公開網路暴露**（LAN 繫結、Funnel、缺少身分驗證）：立即修正。
3. **瀏覽器控制遠端暴露**：將其視為操作員存取（僅限 tailnet、謹慎配對節點、避免公開暴露）。
4. **權限**：確認 state/config/credentials/auth 不可由群組/全世界讀取。
5. **Plugins**：只載入你明確信任的內容。
6. **模型選擇**：對任何具有工具的機器人，偏好現代且經指令強化的模型。

## 安全稽核詞彙表

每個稽核發現都由結構化 `checkId` 識別（例如
`gateway.bind_no_auth` 或 `tools.exec.security_full_configured`）。常見的
critical 嚴重性類別：

- `fs.*` — state、config、credentials、auth profiles 的檔案系統權限。
- `gateway.*` — 繫結模式、身分驗證、Tailscale、Control UI、受信任 Proxy 設定。
- `hooks.*`、`browser.*`、`sandbox.*`、`tools.exec.*` — 各介面的強化。
- `plugins.*`、`skills.*` — plugin/skill 供應鏈與掃描發現。
- `security.exposure.*` — 存取政策與工具影響範圍交會處的橫向檢查。

請參閱完整目錄，其中包含嚴重性層級、修正鍵與自動修正支援：
[安全稽核檢查](/zh-TW/gateway/security/audit-checks)。

## 透過 HTTP 使用 Control UI

Control UI 需要**安全內容**（HTTPS 或 localhost）才能產生裝置
身分。`gateway.controlUi.allowInsecureAuth` 是本機相容性切換：

- 在 localhost 上，當頁面透過非安全 HTTP 載入時，它允許沒有裝置身分的 Control UI 身分驗證。
- 它不會繞過配對檢查。
- 它不會放寬遠端（非 localhost）裝置身分要求。

偏好使用 HTTPS（Tailscale Serve），或在 `127.0.0.1` 開啟 UI。

僅限緊急破窗情境使用，`gateway.controlUi.dangerouslyDisableDeviceAuth`
會完全停用裝置身分檢查。這是嚴重的安全降級；除非你正在主動偵錯且能快速還原，否則請保持關閉。

與那些危險旗標分開來看，成功的 `gateway.auth.mode: "trusted-proxy"`
可以在沒有裝置身分的情況下允許**操作員** Control UI 工作階段。這是
刻意的身分驗證模式行為，不是 `allowInsecureAuth` 捷徑，而且它仍然
不會延伸到 node-role Control UI 工作階段。

啟用此設定時，`openclaw security audit` 會發出警告。

## 不安全或危險旗標摘要

已啟用已知不安全/危險偵錯開關時，`openclaw security audit` 會提出
`config.insecure_or_dangerous_flags`。在正式環境中請保持這些設定未設。

<AccordionGroup>
  <Accordion title="稽核目前追蹤的旗標">
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

    頻道名稱比對（內建與 plugin 頻道；在適用情況下也可於個別
    `accounts.<accountId>` 使用）：

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`（plugin 頻道）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（plugin 頻道）
    - `channels.zalouser.dangerouslyAllowNameMatching`（plugin 頻道）
    - `channels.irc.dangerouslyAllowNameMatching`（plugin 頻道）
    - `channels.mattermost.dangerouslyAllowNameMatching`（plugin 頻道）

    網路暴露：

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（也可用於個別帳戶）

    Sandbox Docker（預設 + 個別 agent）：

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## 反向 Proxy 設定

如果你在反向 Proxy（nginx、Caddy、Traefik 等）後方執行 Gateway，請設定
`gateway.trustedProxies`，以正確處理轉送的用戶端 IP。

當 Gateway 從**不在** `trustedProxies` 中的位址偵測到 Proxy 標頭時，它**不會**將連線視為本機用戶端。如果停用 gateway 身分驗證，這些連線會遭拒。這可防止身分驗證繞過，避免經 Proxy 的連線原本看似來自 localhost 並獲得自動信任。

`gateway.trustedProxies` 也會提供給 `gateway.auth.mode: "trusted-proxy"` 使用，但該身分驗證模式更嚴格：

- trusted-proxy auth **預設會對 loopback-source proxies 失敗關閉**
- 同主機 loopback 反向 Proxy 可以使用 `gateway.trustedProxies` 進行本機用戶端偵測與轉送 IP 處理
- 同主機 loopback 反向 Proxy 只有在 `gateway.auth.trustedProxy.allowLoopback = true` 時，才可滿足 `gateway.auth.mode: "trusted-proxy"`；否則請使用權杖/密碼身分驗證

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

設定 `trustedProxies` 時，Gateway 會使用 `X-Forwarded-For` 判斷用戶端 IP。預設會忽略 `X-Real-IP`，除非明確設定 `gateway.allowRealIpFallback: true`。

受信任 Proxy 標頭不會讓 node 裝置配對自動受信任。
`gateway.nodes.pairing.autoApproveCidrs` 是另一個預設停用的
操作員政策。即使啟用，也會將 loopback-source trusted-proxy 標頭路徑
排除於 node 自動核准之外，因為本機呼叫者可以偽造那些
標頭，包括明確啟用 loopback trusted-proxy auth 時也是如此。

良好的反向 Proxy 行為（覆寫傳入的轉送標頭）：

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不良的反向 Proxy 行為（附加/保留不受信任的轉送標頭）：

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 與來源注意事項

- OpenClaw gateway 以本機/local loopback 優先。如果你在反向 Proxy 終止 TLS，請在那裡於面向 Proxy 的 HTTPS 網域設定 HSTS。
- 如果 gateway 本身終止 HTTPS，你可以設定 `gateway.http.securityHeaders.strictTransportSecurity`，從 OpenClaw 回應發出 HSTS 標頭。
- 詳細部署指引位於 [受信任 Proxy Auth](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)。
- 對於非 loopback Control UI 部署，預設需要 `gateway.controlUi.allowedOrigins`。
- `gateway.controlUi.allowedOrigins: ["*"]` 是明確允許所有瀏覽器來源的政策，不是強化的預設值。請避免在嚴格控管的本機測試之外使用。
- 即使啟用一般 loopback 豁免，loopback 上的瀏覽器來源身分驗證失敗仍會受到速率限制，但鎖定鍵會依標準化的 `Origin` 值分開設定，而不是共用一個 localhost 儲存桶。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host 標頭來源備援模式；請將其視為操作員選擇的危險政策。
- 將 DNS rebinding 與 Proxy 主機標頭行為視為部署強化考量；保持 `trustedProxies` 嚴格，並避免將 gateway 直接暴露到公開網際網路。

## 本機工作階段記錄儲存在磁碟上

OpenClaw 會將工作階段逐字記錄儲存在磁碟上的 `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
這是工作階段連續性以及（選用）工作階段記憶索引所需，但也表示
**任何具有檔案系統存取權的程序/使用者都能讀取那些記錄**。請將磁碟存取視為信任
邊界，並鎖定 `~/.openclaw` 的權限（請參閱下方稽核章節）。如果你需要
在 agents 之間有更強的隔離，請讓它們在不同 OS 使用者或不同主機下執行。

## Node 執行（system.run）

如果已配對 macOS node，Gateway 可以在該 node 上叫用 `system.run`。這是在 Mac 上的**遠端程式碼執行**：

- 需要 Node 配對（核准 + token）。
- Gateway Node 配對不是逐命令核准介面。它會建立 Node 身分／信任與 token 發行。
- Gateway 透過 `gateway.nodes.allowCommands` / `denyCommands` 套用粗略的全域 Node 命令政策。
- 在 Mac 上透過 **Settings → Exec approvals**（安全性 + 詢問 + 允許清單）控制。
- 逐 Node 的 `system.run` 政策是 Node 自己的 exec 核准檔案（`exec.approvals.node.*`），可以比 Gateway 的全域命令 ID 政策更嚴格或更寬鬆。
- 以 `security="full"` 和 `ask="off"` 執行的 Node 遵循預設的可信任操作員模型。除非你的部署明確需要更嚴格的核准或允許清單立場，否則應將此視為預期行為。
- 核准模式會綁定精確的請求脈絡，並在可能時綁定一個具體的本機指令碼／檔案操作數。如果 OpenClaw 無法為直譯器／runtime 命令精確識別一個直接本機檔案，則會拒絕以核准支援的執行，而不是承諾完整語意涵蓋。
- 對於 `host=node`，以核准支援的執行也會儲存標準化且已準備好的
  `systemRunPlan`；後續已核准的轉送會重用該儲存計畫，而 Gateway
  驗證會拒絕呼叫者在核准請求建立後對 command/cwd/session 脈絡所做的編輯。
- 如果你不想要遠端執行，請將安全性設為 **deny**，並移除該 Mac 的 Node 配對。

這項區別對分流很重要：

- 重新連線的已配對 Node 宣告不同的命令清單，本身不是漏洞，只要 Gateway 全域政策和 Node 的本機 exec 核准仍然強制執行實際的執行邊界即可。
- 將 Node 配對中繼資料視為第二個隱藏逐命令核准層的回報，通常是政策／UX 混淆，而不是安全邊界繞過。

## 動態 Skills（監看器／遠端 Node）

OpenClaw 可以在工作階段中途重新整理 Skills 清單：

- **Skills 監看器**：`SKILL.md` 的變更可在下一個 agent 回合更新 Skills 快照。
- **遠端 Node**：連線 macOS Node 可讓僅限 macOS 的 Skills 符合資格（依據 bin 探測）。

請將 skill 資料夾視為 **可信任程式碼**，並限制可修改它們的人員。

## 威脅模型

你的 AI 助理可以：

- 執行任意 shell 命令
- 讀取／寫入檔案
- 存取網路服務
- 傳送訊息給任何人（如果你授予它 WhatsApp 存取權）

傳訊給你的人可以：

- 試圖誘騙你的 AI 做壞事
- 透過社交工程取得你的資料存取權
- 探測基礎架構細節

## 核心概念：先做存取控制，再談智慧

這裡多數失敗不是高深的攻擊，而是「有人傳訊給機器人，機器人就照做」。

OpenClaw 的立場：

- **身分優先：**決定誰可以和機器人交談（DM 配對／允許清單／明確「open」）。
- **接著限定範圍：**決定機器人可在哪裡行動（群組允許清單 + 提及門檻、工具、沙箱、裝置權限）。
- **模型最後：**假設模型可能被操縱；設計時讓操縱造成的影響範圍有限。

## 命令授權模型

斜線命令和指令只會對 **已授權傳送者** 生效。授權衍生自
channel 允許清單／配對加上 `commands.useAccessGroups`（請參閱[組態](/zh-TW/gateway/configuration)
和[斜線命令](/zh-TW/tools/slash-commands)）。如果 channel 允許清單為空或包含 `"*"`，
則該 channel 的命令實際上是開放的。

`/exec` 是提供給已授權操作員的工作階段限定便利功能。它**不會**寫入組態或
變更其他工作階段。

## 控制平面工具風險

兩個內建工具可以進行持久性的控制平面變更：

- `gateway` 可以使用 `config.schema.lookup` / `config.get` 檢查組態，並可使用 `config.apply`、`config.patch` 和 `update.run` 進行持久性變更。
- `cron` 可以建立排程工作，讓工作在原始聊天／任務結束後仍持續執行。

僅限擁有者的 `gateway` runtime 工具仍會拒絕重寫
`tools.exec.ask` 或 `tools.exec.security`；舊版 `tools.bash.*` 別名會在寫入前
正規化為相同受保護的 exec 路徑。
Agent 驅動的 `gateway config.apply` 和 `gateway config.patch` 編輯預設採用
失敗關閉：只有一小組 prompt、model 和 mention-gating
路徑可由 agent 調整。因此，新的敏感組態樹會受到保護，
除非它們被有意加入允許清單。

對於任何處理不受信任內容的 agent／介面，預設拒絕這些工具：

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` 只會封鎖重新啟動動作。它不會停用 `gateway` 組態／更新動作。

## Plugin

Plugin 會與 Gateway **在同一程序內**執行。請將它們視為可信任程式碼：

- 只安裝來自你信任來源的 Plugin。
- 優先使用明確的 `plugins.allow` 允許清單。
- 啟用前先檢閱 Plugin 組態。
- Plugin 變更後重新啟動 Gateway。
- 如果你安裝或更新 Plugin（`openclaw plugins install <package>`、`openclaw plugins update <id>`），請將其視同執行不受信任的程式碼：
  - 安裝路徑是作用中 Plugin 安裝根目錄下的逐 Plugin 目錄。
  - OpenClaw 會在安裝／更新前執行內建危險程式碼掃描。`critical` 發現項目預設會封鎖。
  - OpenClaw 使用 `npm pack`，然後在該目錄中執行專案本機的 `npm install --omit=dev --ignore-scripts`。繼承的全域 npm 安裝設定會被忽略，讓相依性留在 Plugin 安裝路徑下。
  - 優先使用鎖定的精確版本（`@scope/pkg@1.2.3`），並在啟用前檢查磁碟上解開的程式碼。
  - `--dangerously-force-unsafe-install` 只是在 Plugin 安裝／更新流程中，針對內建掃描誤報的緊急破例。它不會繞過 Plugin `before_install` hook 政策封鎖，也不會繞過掃描失敗。
  - Gateway 支援的 skill 相依性安裝遵循相同的危險／可疑分流：內建 `critical` 發現項目會封鎖，除非呼叫者明確設定 `dangerouslyForceUnsafeInstall`，而可疑發現項目仍只會警告。`openclaw skills install` 仍是獨立的 ClawHub skill 下載／安裝流程。

詳細資訊：[Plugin](/zh-TW/tools/plugin)

## DM 存取模型：配對、允許清單、開放、停用

所有目前具備 DM 能力的 channel 都支援 DM 政策（`dmPolicy` 或 `*.dm.policy`），會在處理訊息**之前**閘控傳入 DM：

- `pairing`（預設）：未知傳送者會收到簡短配對碼，機器人會忽略他們的訊息直到核准。代碼會在 1 小時後過期；重複 DM 不會重新傳送代碼，直到建立新的請求。待處理請求預設每個 channel 上限為 **3**。
- `allowlist`：未知傳送者會被封鎖（沒有配對交握）。
- `open`：允許任何人 DM（公開）。**要求** channel 允許清單包含 `"*"`（明確選擇加入）。
- `disabled`：完全忽略傳入 DM。

透過 CLI 核准：

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細資訊 + 磁碟上的檔案：[配對](/zh-TW/channels/pairing)

## DM 工作階段隔離（多使用者模式）

預設情況下，OpenClaw 會將**所有 DM 路由到主要工作階段**，讓你的助理可跨裝置和 channel 保持連續性。如果**多人**可 DM 機器人（開放 DM 或多人允許清單），請考慮隔離 DM 工作階段：

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

這可防止跨使用者脈絡外洩，同時保持群組聊天隔離。

這是訊息脈絡邊界，不是主機管理員邊界。如果使用者彼此敵對且共享同一 Gateway 主機／組態，請改為依信任邊界執行不同 Gateway。

### 安全 DM 模式（建議）

請將上方片段視為**安全 DM 模式**：

- 預設：`session.dmScope: "main"`（所有 DM 共用一個工作階段以維持連續性）。
- 本機 CLI onboarding 預設：未設定時寫入 `session.dmScope: "per-channel-peer"`（保留既有明確值）。
- 安全 DM 模式：`session.dmScope: "per-channel-peer"`（每個 channel+sender 配對取得隔離的 DM 脈絡）。
- 跨 channel peer 隔離：`session.dmScope: "per-peer"`（每個傳送者在同類型的所有 channel 中取得一個工作階段）。

如果你在同一 channel 上執行多個帳號，請改用 `per-account-channel-peer`。如果同一人透過多個 channel 聯絡你，請使用 `session.identityLinks` 將那些 DM 工作階段合併為一個標準身分。請參閱[工作階段管理](/zh-TW/concepts/session)和[組態](/zh-TW/gateway/configuration)。

## DM 與群組的允許清單

OpenClaw 有兩個獨立的「誰可以觸發我？」層：

- **DM 允許清單**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；舊版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）：誰可以在直接訊息中和機器人交談。
  - 當 `dmPolicy="pairing"` 時，核准會寫入 `~/.openclaw/credentials/` 下帳號範圍的配對允許清單儲存區（預設帳號為 `<channel>-allowFrom.json`，非預設帳號為 `<channel>-<accountId>-allowFrom.json`），並與組態允許清單合併。
- **群組允許清單**（channel 特定）：機器人究竟會接受哪些群組／channel／guild 的訊息。
  - 常見模式：
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`：逐群組預設值，例如 `requireMention`；設定時，它也會作為群組允許清單（包含 `"*"` 可保留允許全部的行為）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`：限制誰可以在群組工作階段_內_觸發機器人（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`：逐介面允許清單 + 提及預設值。
  - 群組檢查依此順序執行：先執行 `groupPolicy`／群組允許清單，其次是提及／回覆啟動。
  - 回覆機器人訊息（隱含提及）**不會**繞過像 `groupAllowFrom` 這類傳送者允許清單。
  - **安全性注意：**請將 `dmPolicy="open"` 和 `groupPolicy="open"` 視為最後手段設定。它們應該極少使用；除非你完全信任聊天室中的每位成員，否則優先使用配對 + 允許清單。

詳細資訊：[組態](/zh-TW/gateway/configuration)和[群組](/zh-TW/channels/groups)

## Prompt injection（定義與重要性）

Prompt injection 是指攻擊者精心設計訊息，操縱模型做出不安全的行為（「忽略你的指示」、「傾印你的檔案系統」、「追蹤此連結並執行命令」等）。

即使有強力的 system prompt，**prompt injection 仍未被解決**。System prompt 防護只是軟性指引；硬性強制來自工具政策、exec 核准、沙箱和 channel 允許清單（而操作員可依設計停用這些）。實務上有幫助的是：

- 鎖定傳入 DM（配對/允許清單）。
- 在群組中偏好使用提及閘門；避免在公共聊天室使用「永遠開啟」的機器人。
- 預設將連結、附件和貼上的指令視為惡意內容。
- 在沙箱中執行敏感工具；讓秘密不要進入代理可存取的檔案系統。
- 注意：沙箱是選擇性啟用。如果沙箱模式關閉，隱含的 `host=auto` 會解析為 Gateway 主機。明確的 `host=sandbox` 仍會安全失敗，因為沒有可用的沙箱執行環境。如果你希望在設定中明確表示該行為，請設定 `host=gateway`。
- 將高風險工具（`exec`、`browser`、`web_fetch`、`web_search`）限制給受信任代理或明確允許清單。
- 如果你將直譯器（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）加入允許清單，請啟用 `tools.exec.strictInlineEval`，讓內嵌求值形式仍需明確核准。
- Shell 核准分析也會拒絕 **未加引號 heredoc** 內的 POSIX 參數展開形式（`$VAR`、`$?`、`$$`、`$1`、`$@`、`${…}`），因此允許清單中的 heredoc 內容無法把 shell 展開偽裝成純文字來繞過允許清單審查。為 heredoc 結束標記加上引號（例如 `<<'EOF'`）即可選擇使用字面內容語義；原本會展開變數的未加引號 heredoc 會被拒絕。
- **模型選擇很重要：** 較舊/較小/舊世代模型對提示注入和工具誤用的抵抗力明顯較弱。對啟用工具的代理，請使用可用的最強、最新世代且經指令強化的模型。

應視為不受信任的警訊：

- 「讀取這個檔案/URL，並完全照它說的做。」
- 「忽略你的系統提示或安全規則。」
- 「揭露你的隱藏指令或工具輸出。」
- 「貼上 ~/.openclaw 或你的記錄檔的完整內容。」

## 外部內容特殊權杖清理

OpenClaw 會在包裝後的外部內容和中繼資料到達模型之前，移除常見自架 LLM 聊天範本特殊權杖字面值。涵蓋的標記家族包含 Qwen/ChatML、Llama、Gemma、Mistral、Phi，以及 GPT-OSS 角色/回合權杖。

原因：

- 對接自架模型的 OpenAI 相容後端，有時會保留出現在使用者文字中的特殊權杖，而不是遮罩它們。否則，能寫入傳入外部內容（擷取頁面、電子郵件本文、檔案內容工具輸出）的攻擊者，可能注入合成的 `assistant` 或 `system` 角色邊界，並逃逸包裝內容的防護。
- 清理發生在外部內容包裝層，因此會一致套用於擷取/讀取工具和傳入通道內容，而不是逐一依供應者處理。
- 傳出模型回應已經有另一個清理器，會在最終通道交付邊界，從使用者可見回覆中移除洩漏的 `<tool_call>`、`<function_calls>`、`<system-reminder>`、`<previous_response>`，以及類似的內部執行環境支架。外部內容清理器是對應的傳入防護。

這不會取代本頁其他強化措施：`dmPolicy`、允許清單、exec 核准、沙箱和 `contextVisibility` 仍負責主要防護。它會封閉一個特定的權杖器層繞過，該繞過會攻擊原樣轉送含特殊權杖使用者文字的自架堆疊。

## 不安全外部內容繞過旗標

OpenClaw 包含會停用外部內容安全包裝的明確繞過旗標：

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron 酬載欄位 `allowUnsafeExternalContent`

指引：

- 在生產環境中保持未設定/false。
- 只為範圍嚴格限定的偵錯暫時啟用。
- 若已啟用，請隔離該代理（沙箱 + 最少工具 + 專用工作階段命名空間）。

Hooks 風險注意事項：

- Hook 酬載是不受信任內容，即使交付來源是你控制的系統（郵件/文件/網頁內容都可能攜帶提示注入）。
- 較弱的模型層級會提高此風險。對 Hook 驅動的自動化，偏好強大的現代模型層級，並維持嚴格工具政策（`tools.profile: "messaging"` 或更嚴格），且在可行情況下使用沙箱。

### 提示注入不需要公開 DM

即使**只有你**能傳訊息給機器人，提示注入仍可能透過
機器人讀取的任何**不受信任內容**發生（網頁搜尋/擷取結果、瀏覽器頁面、
電子郵件、文件、附件、貼上的記錄/程式碼）。換句話說：傳送者不是
唯一威脅面；**內容本身**也能攜帶對抗性指令。

啟用工具時，典型風險是外洩上下文或觸發
工具呼叫。透過下列方式降低影響範圍：

- 使用唯讀或停用工具的**讀取代理**摘要不受信任內容，
  再將摘要傳給你的主要代理。
- 除非必要，否則對啟用工具的代理關閉 `web_search` / `web_fetch` / `browser`。
- 對 OpenResponses URL 輸入（`input_file` / `input_image`），設定嚴格的
  `gateway.http.endpoints.responses.files.urlAllowlist` 和
  `gateway.http.endpoints.responses.images.urlAllowlist`，並保持低 `maxUrlParts`。
  空允許清單會被視為未設定；若你想完全停用 URL 擷取，請使用 `files.allowUrl: false` / `images.allowUrl: false`。
- 對 OpenResponses 檔案輸入，已解碼的 `input_file` 文字仍會被注入為
  **不受信任的外部內容**。不要只因為 Gateway 在本機解碼檔案文字，就依賴它是受信任的。注入區塊仍會攜帶明確的
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 邊界標記加上 `Source: External`
  中繼資料，即使此路徑省略較長的 `SECURITY NOTICE:` 橫幅。
- 當媒體理解在將文字附加到媒體提示之前，從附加文件中擷取文字時，也會套用相同的標記式包裝。
- 為任何會接觸不受信任輸入的代理啟用沙箱和嚴格工具允許清單。
- 讓秘密不要進入提示；改由 Gateway 主機上的環境變數/設定傳入。

### 自架 LLM 後端

OpenAI 相容的自架後端，例如 vLLM、SGLang、TGI、LM Studio，
或自訂 Hugging Face 權杖器堆疊，處理聊天範本特殊權杖的方式
可能不同於託管供應者。如果後端將像
`<|im_start|>`、`<|start_header_id|>` 或 `<start_of_turn>` 這樣的字面字串，
在使用者內容內權杖化為結構性聊天範本權杖，不受信任文字就可能嘗試在權杖器層偽造角色邊界。

OpenClaw 會在把包裝後的外部內容派送到模型之前，移除常見模型家族的特殊權杖字面值。請保持外部內容包裝啟用，並在可用時偏好會分割或逸出使用者提供內容中特殊權杖的後端設定。OpenAI 和 Anthropic 等託管供應者已經套用自己的請求端清理。

### 模型強度（安全注意事項）

提示注入抵抗力在不同模型層級之間**並不一致**。較小/較便宜的模型通常更容易受到工具誤用和指令劫持影響，尤其是在對抗性提示下。

<Warning>
對啟用工具的代理或讀取不受信任內容的代理，使用較舊/較小模型時的提示注入風險通常過高。不要在弱模型層級上執行這些工作負載。
</Warning>

建議：

- 對任何能執行工具或接觸檔案/網路的機器人，**使用最新世代、最佳層級模型**。
- 對啟用工具的代理或不受信任收件匣，**不要使用較舊/較弱/較小層級**；提示注入風險太高。
- 如果你必須使用較小模型，請**降低影響範圍**（唯讀工具、強沙箱、最小檔案系統存取、嚴格允許清單）。
- 執行小模型時，除非輸入受到嚴格控制，否則請**為所有工作階段啟用沙箱**並**停用 web_search/web_fetch/browser**。
- 對輸入受信任且沒有工具的純聊天個人助理，較小模型通常沒問題。

## 群組中的推理和詳細輸出

`/reasoning`、`/verbose` 和 `/trace` 可能暴露內部推理、工具
輸出，或原本不應出現在公開通道的 Plugin 診斷資訊。在群組設定中，請將它們視為**僅供偵錯**
並保持關閉，除非你明確需要它們。

指引：

- 在公開聊天室中保持 `/reasoning`、`/verbose` 和 `/trace` 停用。
- 如果你啟用它們，請只在受信任的 DM 或嚴格管控的聊天室中啟用。
- 請記住：詳細和追蹤輸出可能包含工具參數、URL、Plugin 診斷資訊，以及模型看到的資料。

## 設定強化範例

### 檔案權限

在 Gateway 主機上保持設定 + 狀態私密：

- `~/.openclaw/openclaw.json`: `600`（只有使用者可讀/寫）
- `~/.openclaw`: `700`（僅使用者）

`openclaw doctor` 可以警告並提出收緊這些權限的選項。

### 網路暴露（繫結、連接埠、防火牆）

Gateway 在單一連接埠上多工處理 **WebSocket + HTTP**：

- 預設：`18789`
- 設定/旗標/環境變數：`gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

此 HTTP 介面包含 Control UI 和 canvas 主機：

- Control UI（SPA 資產）（預設基礎路徑 `/`）
- Canvas 主機：`/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`（任意 HTML/JS；視為不受信任內容）

如果你在一般瀏覽器中載入 canvas 內容，請把它視為任何其他不受信任網頁：

- 不要將 canvas 主機暴露給不受信任的網路/使用者。
- 除非你完全理解其影響，否則不要讓 canvas 內容與具權限的網頁介面共用同一來源。

繫結模式控制 Gateway 監聽的位置：

- `gateway.bind: "loopback"`（預設）：只有本機用戶端可以連線。
- 非 loopback 繫結（`"lan"`、`"tailnet"`、`"custom"`）會擴大攻擊面。只有在搭配 Gateway 驗證（共用權杖/密碼或正確設定的受信任代理）和真正的防火牆時才使用。

經驗法則：

- 偏好 Tailscale Serve 而不是 LAN 繫結（Serve 會讓 Gateway 保持在 loopback，並由 Tailscale 處理存取）。
- 如果你必須繫結到 LAN，請用防火牆將連接埠限制在嚴格的來源 IP 允許清單；不要廣泛轉發連接埠。
- 絕不要在 `0.0.0.0` 上無驗證地暴露 Gateway。

### 搭配 UFW 的 Docker 連接埠發布

如果你在 VPS 上用 Docker 執行 OpenClaw，請記住已發布的容器連接埠
（`-p HOST:CONTAINER` 或 Compose `ports:`）會透過 Docker 的轉發
鏈路路由，而不只是主機 `INPUT` 規則。

為了讓 Docker 流量符合你的防火牆政策，請在
`DOCKER-USER` 中強制套用規則（此鏈路會在 Docker 自己的接受規則之前評估）。
在許多現代發行版上，`iptables`/`ip6tables` 會使用 `iptables-nft` 前端，
並仍將這些規則套用到 nftables 後端。

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

IPv6 有獨立的表格。如果
已啟用 Docker IPv6，請在 `/etc/ufw/after6.rules` 中新增相符政策。

避免在文件片段中硬編碼像 `eth0` 這樣的介面名稱。介面名稱
會因 VPS 映像而異（`ens3`、`enp*` 等），不相符可能會意外
略過你的拒絕規則。

重新載入後快速驗證：

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

預期的外部連接埠應該只包含你有意暴露的項目（對大多數
設定而言：SSH + 你的反向代理連接埠）。

### mDNS/Bonjour 探索

Gateway 會透過 mDNS（連接埠 5353 上的 `_openclaw-gw._tcp`）廣播其存在，以便本機裝置探索。在完整模式下，這包含可能暴露操作細節的 TXT 記錄：

- `cliPath`：CLI 二進位檔的完整檔案系統路徑（會揭露使用者名稱和安裝位置）
- `sshPort`：宣告主機上的 SSH 可用性
- `displayName`, `lanHost`：主機名稱資訊

**作業安全考量：** 廣播基礎架構詳細資訊，會讓本機網路上的任何人更容易進行偵察。即使是像檔案系統路徑和 SSH 可用性這類「無害」資訊，也會幫助攻擊者描繪你的環境。

**建議：**

1. **最小模式**（預設，建議用於暴露的 Gateway）：從 mDNS 廣播中省略敏感欄位：

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **完全停用**，如果你不需要本機裝置探索：

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **完整模式**（選擇啟用）：在 TXT 記錄中包含 `cliPath` + `sshPort`：

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **環境變數**（替代方式）：設定 `OPENCLAW_DISABLE_BONJOUR=1` 即可在不變更設定的情況下停用 mDNS。

在最小模式中，Gateway 仍會廣播足以進行裝置探索的資訊（`role`, `gatewayPort`, `transport`），但會省略 `cliPath` 和 `sshPort`。需要 CLI 路徑資訊的應用程式，可以改透過已驗證的 WebSocket 連線擷取。

### 鎖定 Gateway WebSocket（本機驗證）

Gateway 驗證**預設為必要**。如果沒有設定有效的 Gateway 驗證路徑，
Gateway 會拒絕 WebSocket 連線（故障關閉）。

上線流程預設會產生權杖（即使是用於迴路），因此
本機用戶端必須驗證。

設定權杖，讓**所有** WS 用戶端都必須驗證：

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor 可以為你產生一個：`openclaw doctor --generate-gateway-token`。

<Note>
`gateway.remote.token` 和 `gateway.remote.password` 是用戶端憑證來源。它們本身**不會**保護本機 WS 存取。只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才可以使用 `gateway.remote.*` 作為後援。如果 `gateway.auth.token` 或 `gateway.auth.password` 已透過 SecretRef 明確設定但無法解析，解析會故障關閉（不會用遠端後援掩蓋）。
</Note>
選用：使用 `wss://` 時，可透過 `gateway.remote.tlsFingerprint` 釘選遠端 TLS。
明文 `ws://` 預設僅限迴路。對於受信任的私人網路
路徑，請在用戶端程序上設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
作為破窗手段。這刻意只支援程序環境變數，而不是
`openclaw.json` 設定鍵。
行動裝置配對，以及 Android 手動或掃描的 Gateway 路由更嚴格：
迴路可接受明文，但私人 LAN、鏈路本機、`.local` 和
無點主機名稱必須使用 TLS，除非你明確選擇加入受信任
私人網路明文路徑。

本機裝置配對：

- 針對直接連到 local loopback 的裝置配對會自動核准，讓
  同主機用戶端保持順暢。
- OpenClaw 也有一條狹窄的後端/容器本機自連路徑，用於
  受信任的共享密鑰輔助流程。
- Tailnet 和 LAN 連線，包括同主機 tailnet 繫結，都會被視為
  遠端配對，仍需要核准。
- 迴路請求上的轉送標頭證據，會使其不符合迴路
  本機性。中繼資料升級自動核准的範圍很窄。兩項規則請參閱
  [Gateway 配對](/zh-TW/gateway/pairing)。

驗證模式：

- `gateway.auth.mode: "token"`：共享 bearer 權杖（建議用於大多數設定）。
- `gateway.auth.mode: "password"`：密碼驗證（建議透過環境變數設定：`OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`：信任具身分感知能力的反向代理來驗證使用者，並透過標頭傳遞身分（請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。

輪替檢查清單（權杖/密碼）：

1. 產生/設定新的密鑰（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_PASSWORD`）。
2. 重新啟動 Gateway（或如果 macOS 應用程式監督 Gateway，則重新啟動 macOS 應用程式）。
3. 更新任何遠端用戶端（呼叫 Gateway 的機器上的 `gateway.remote.token` / `.password`）。
4. 驗證你無法再使用舊憑證連線。

### Tailscale Serve 身分標頭

當 `gateway.auth.allowTailscale` 為 `true`（Serve 的預設值）時，OpenClaw
會接受 Tailscale Serve 身分標頭（`tailscale-user-login`）用於 Control
UI/WebSocket 驗證。OpenClaw 會透過本機 Tailscale 常駐程式（`tailscale whois`）
解析 `x-forwarded-for` 位址，並與標頭比對，以驗證身分。這只會在請求命中迴路
並包含由 Tailscale 注入的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host`
時觸發。
對於這條非同步身分檢查路徑，同一個 `{scope, ip}` 的失敗嘗試會在限制器記錄失敗前被序列化。因此，來自同一個 Serve 用戶端的並行錯誤重試，可能會立即鎖定第二次嘗試，而不是以兩個單純不符的請求競速通過。
HTTP API 端點（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不會**使用 Tailscale 身分標頭驗證。它們仍會遵循 Gateway 設定的
HTTP 驗證模式。

重要邊界說明：

- Gateway HTTP bearer 驗證實際上是全有或全無的操作者存取權。
- 將能呼叫 `/v1/chat/completions`、`/v1/responses` 或 `/api/channels/*` 的憑證，視為該 Gateway 的完整存取操作者密鑰。
- 在 OpenAI 相容的 HTTP 介面上，共享密鑰 bearer 驗證會還原完整的預設操作者範圍（`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`）以及代理回合的擁有者語義；較窄的 `x-openclaw-scopes` 值不會縮減該共享密鑰路徑。
- HTTP 上的逐請求範圍語義，只會在請求來自帶有身分的模式時套用，例如受信任代理驗證，或私人入口上的 `gateway.auth.mode="none"`。
- 在這些帶有身分的模式中，省略 `x-openclaw-scopes` 會退回到正常的操作者預設範圍集合；當你想要較窄的範圍集合時，請明確傳送該標頭。
- `/tools/invoke` 遵循相同的共享密鑰規則：權杖/密碼 bearer 驗證在此也會被視為完整操作者存取權，而帶有身分的模式仍會遵循宣告的範圍。
- 不要與不受信任的呼叫方共享這些憑證；建議依信任邊界使用獨立 Gateway。

**信任假設：** 無權杖 Serve 驗證假設 Gateway 主機是受信任的。
不要將它視為可防範惡意同主機程序的保護。如果不受信任的
本機程式碼可能在 Gateway 主機上執行，請停用 `gateway.auth.allowTailscale`
並要求使用 `gateway.auth.mode: "token"` 或 `"password"` 進行明確的共享密鑰驗證。

**安全規則：** 不要從你自己的反向代理轉送這些標頭。如果
你在 Gateway 前方終止 TLS 或代理，請停用
`gateway.auth.allowTailscale`，並改用共享密鑰驗證（`gateway.auth.mode:
"token"` 或 `"password"`）或[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

受信任代理：

- 如果你在 Gateway 前方終止 TLS，請將 `gateway.trustedProxies` 設為你的代理 IP。
- OpenClaw 會信任來自這些 IP 的 `x-forwarded-for`（或 `x-real-ip`），以判定本機配對檢查和 HTTP 驗證/本機檢查的用戶端 IP。
- 確保你的代理會**覆寫** `x-forwarded-for`，並阻擋對 Gateway 連接埠的直接存取。

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 和 [Web 概覽](/zh-TW/web)。

### 透過節點主機控制瀏覽器（建議）

如果你的 Gateway 位於遠端，但瀏覽器在另一台機器上執行，請在瀏覽器機器上執行**節點主機**，
並讓 Gateway 代理瀏覽器動作（請參閱[瀏覽器工具](/zh-TW/tools/browser)）。
將節點配對視為管理員存取權。

建議模式：

- 將 Gateway 和節點主機放在同一個 tailnet（Tailscale）上。
- 有意地配對節點；如果不需要瀏覽器代理路由，請停用它。

避免：

- 透過 LAN 或公用網際網路暴露轉送/控制連接埠。
- 對瀏覽器控制端點使用 Tailscale Funnel（公用暴露）。

### 磁碟上的密鑰

假設 `~/.openclaw/`（或 `$OPENCLAW_STATE_DIR/`）底下的任何內容都可能包含密鑰或私人資料：

- `openclaw.json`：設定可能包含權杖（Gateway、遠端 Gateway）、提供者設定和允許清單。
- `credentials/**`：通道憑證（例如：WhatsApp 憑證）、配對允許清單、舊版 OAuth 匯入。
- `agents/<agentId>/agent/auth-profiles.json`：API 金鑰、權杖設定檔、OAuth 權杖，以及選用的 `keyRef`/`tokenRef`。
- `secrets.json`（選用）：由 `file` SecretRef 提供者使用的檔案支援密鑰承載（`secrets.providers`）。
- `agents/<agentId>/agent/auth.json`：舊版相容性檔案。靜態 `api_key` 項目在發現時會被清除。
- `agents/<agentId>/sessions/**`：工作階段逐字稿（`*.jsonl`）+ 路由中繼資料（`sessions.json`），可能包含私人訊息和工具輸出。
- 內建 Plugin 套件：已安裝的 plugins（以及它們的 `node_modules/`）。
- `sandboxes/**`：工具沙箱工作區；可能累積你在沙箱內讀寫檔案的副本。

強化建議：

- 保持嚴格權限（目錄使用 `700`，檔案使用 `600`）。
- 在 Gateway 主機上使用全磁碟加密。
- 如果主機為共用環境，建議為 Gateway 使用專用 OS 使用者帳號。

### 工作區 `.env` 檔案

OpenClaw 會為代理和工具載入工作區本機 `.env` 檔案，但絕不允許這些檔案默默覆寫 Gateway 執行階段控制。

- 任何以 `OPENCLAW_*` 開頭的鍵，都會被阻止從不受信任的工作區 `.env` 檔案載入。
- Matrix、Mattermost、IRC 和 Synology Chat 的通道端點設定，也會被阻止由工作區 `.env` 覆寫，因此複製下來的工作區無法透過本機端點設定重新導向內建連接器流量。端點環境變數鍵（例如 `MATRIX_HOMESERVER`、`MATTERMOST_URL`、`IRC_HOST`、`SYNOLOGY_CHAT_INCOMING_URL`）必須來自 Gateway 程序環境或 `env.shellEnv`，而不是來自工作區載入的 `.env`。
- 這項阻擋採故障關閉：未來版本新增的執行階段控制變數，無法從已提交或攻擊者提供的 `.env` 繼承；該鍵會被忽略，Gateway 會保留自己的值。
- 受信任的程序/OS 環境變數（Gateway 自己的 shell、launchd/systemd 單元、應用程式套件）仍會套用 — 這只限制 `.env` 檔案載入。

原因：工作區 `.env` 檔案經常與代理程式碼放在一起、意外被提交，或由工具寫入。阻擋整個 `OPENCLAW_*` 前綴，表示日後新增 `OPENCLAW_*` 旗標時，永遠不會退化成從工作區狀態默默繼承。

### 日誌和逐字稿（遮蔽與保留）

即使存取控制正確，日誌和逐字稿仍可能洩漏敏感資訊：

- Gateway 日誌可能包含工具摘要、錯誤和 URL。
- 工作階段逐字稿可能包含貼上的密鑰、檔案內容、命令輸出和連結。

建議：

- 保持啟用日誌和逐字稿遮蔽（`logging.redactSensitive: "tools"`；預設）。
- 透過 `logging.redactPatterns` 為你的環境新增自訂模式（權杖、主機名稱、內部 URL）。
- 分享診斷資訊時，建議使用 `openclaw status --all`（可貼上，密鑰已遮蔽），而不是原始日誌。
- 如果不需要長期保留，請清除舊的工作階段逐字稿和日誌檔案。

詳細資訊：[日誌記錄](/zh-TW/gateway/logging)

### DM：預設配對

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 群組：一律要求提及

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

在群組聊天中，只在被明確提及時回覆。

### 分開的號碼（WhatsApp、Signal、Telegram）

對於以電話號碼為基礎的通道，請考慮讓你的 AI 使用與個人號碼不同的獨立電話號碼：

- 個人號碼：你的對話會保持私密
- Bot 號碼：人工智慧會處理這些對話，並設有適當邊界

### 唯讀模式（透過沙箱與工具）

你可以透過組合以下設定建立唯讀設定檔：

- `agents.defaults.sandbox.workspaceAccess: "ro"`（或使用 `"none"` 表示沒有工作區存取權）
- 阻止 `write`、`edit`、`apply_patch`、`exec`、`process` 等工具的允許/拒絕清單。

其他強化選項：

- `tools.exec.applyPatch.workspaceOnly: true`（預設）：即使沙箱關閉，也確保 `apply_patch` 無法在工作區目錄之外寫入/刪除。只有在你刻意希望 `apply_patch` 觸及工作區之外的檔案時，才設定為 `false`。
- `tools.fs.workspaceOnly: true`（選用）：將 `read`/`write`/`edit`/`apply_patch` 路徑與原生提示圖片自動載入路徑限制在工作區目錄內（如果你目前允許絕對路徑，並且想要單一防護欄，這很有用）。
- 保持檔案系統根目錄範圍狹窄：避免將家目錄之類的寬泛根目錄用於代理工作區/沙箱工作區。寬泛根目錄可能會把敏感本機檔案（例如 `~/.openclaw` 底下的狀態/設定）暴露給檔案系統工具。

### 安全基準（複製/貼上）

以下是一個「安全預設」設定，可讓 Gateway 保持私密、要求私訊配對，並避免永遠開啟的群組 Bot：

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

如果你也想讓工具執行「預設更安全」，請為任何非擁有者代理新增沙箱並拒絕危險工具（範例如下方「每代理存取設定檔」）。

聊天驅動代理回合的內建基準：非擁有者傳送者無法使用 `cron` 或 `gateway` 工具。

## 沙箱化（建議）

專用文件：[沙箱化](/zh-TW/gateway/sandboxing)

兩種互補方法：

- **在 Docker 中執行完整 Gateway**（容器邊界）：[Docker](/zh-TW/install/docker)
- **工具沙箱**（`agents.defaults.sandbox`，主機 Gateway + 沙箱隔離工具；Docker 是預設後端）：[沙箱化](/zh-TW/gateway/sandboxing)

<Note>
若要防止跨代理存取，請將 `agents.defaults.sandbox.scope` 保持在 `"agent"`（預設），或使用 `"session"` 以取得更嚴格的每工作階段隔離。`scope: "shared"` 會使用單一容器或工作區。
</Note>

也請考慮沙箱內的代理工作區存取權：

- `agents.defaults.sandbox.workspaceAccess: "none"`（預設）會讓代理工作區不可存取；工具會針對 `~/.openclaw/sandboxes` 底下的沙箱工作區執行
- `agents.defaults.sandbox.workspaceAccess: "ro"` 會將代理工作區以唯讀方式掛載到 `/agent`（停用 `write`/`edit`/`apply_patch`）
- `agents.defaults.sandbox.workspaceAccess: "rw"` 會將代理工作區以讀寫方式掛載到 `/workspace`
- 額外的 `sandbox.docker.binds` 會依據正規化和標準化後的來源路徑進行驗證。父層符號連結技巧與標準家目錄別名若解析到封鎖根目錄（例如 `/etc`、`/var/run`，或作業系統家目錄底下的憑證目錄），仍會預設封閉並失敗。

<Warning>
`tools.elevated` 是在沙箱外執行 exec 的全域基準逃生口。有效主機預設為 `gateway`，或當 exec 目標設定為 `node` 時為 `node`。請嚴格限制 `tools.elevated.allowFrom`，不要為陌生人啟用它。你可以透過 `agents.list[].tools.elevated` 進一步限制每個代理的提升權限。請參閱[提升模式](/zh-TW/tools/elevated)。
</Warning>

### 子代理委派防護欄

如果你允許工作階段工具，請將委派的子代理執行視為另一個邊界決策：

- 除非代理確實需要委派，否則拒絕 `sessions_spawn`。
- 將 `agents.defaults.subagents.allowAgents` 與任何每代理 `agents.list[].subagents.allowAgents` 覆寫限制為已知安全的目標代理。
- 對於任何必須維持沙箱化的工作流程，請以 `sandbox: "require"` 呼叫 `sessions_spawn`（預設為 `inherit`）。
- 當目標子執行階段未沙箱化時，`sandbox: "require"` 會快速失敗。

## 瀏覽器控制風險

啟用瀏覽器控制會讓模型能夠操控真實瀏覽器。
如果該瀏覽器設定檔已包含登入工作階段，模型就能
存取那些帳號和資料。請將瀏覽器設定檔視為**敏感狀態**：

- 偏好為代理使用專用設定檔（預設 `openclaw` 設定檔）。
- 避免將代理指向你的個人日常使用設定檔。
- 除非你信任沙箱化代理，否則請停用主機瀏覽器控制。
- 獨立的 loopback 瀏覽器控制 API 只接受共享密鑰驗證
  （Gateway token bearer 驗證或 Gateway 密碼）。它不會使用
  受信任代理或 Tailscale Serve 身分標頭。
- 將瀏覽器下載內容視為不受信任的輸入；偏好使用隔離的下載目錄。
- 如可行，請在代理設定檔中停用瀏覽器同步/密碼管理器（降低波及範圍）。
- 對於遠端 Gateway，請假設「瀏覽器控制」等同於對該設定檔可觸及任何內容的「操作者存取」。
- 讓 Gateway 與 Node 主機僅限 tailnet；避免將瀏覽器控制連接埠暴露給 LAN 或公用網際網路。
- 不需要時停用瀏覽器代理路由（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP 既有工作階段模式**並不**「更安全」；它可以在該主機 Chrome 設定檔可觸及的任何地方以你的身分行動。

### 瀏覽器 SSRF 政策（預設嚴格）

OpenClaw 的瀏覽器導覽政策預設嚴格：除非你明確選擇加入，否則私人/內部目的地會保持封鎖。

- 預設：`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 未設定，因此瀏覽器導覽會持續封鎖私人/內部/特殊用途目的地。
- 舊版別名：`browser.ssrfPolicy.allowPrivateNetwork` 仍會被接受以維持相容性。
- 選擇加入模式：設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 以允許私人/內部/特殊用途目的地。
- 在嚴格模式中，使用 `hostnameAllowlist`（例如 `*.example.com` 的模式）與 `allowedHostnames`（精確主機例外，包括像 `localhost` 這類被封鎖的名稱）來設定明確例外。
- 導覽會在請求前檢查，並在導覽後於最終 `http(s)` URL 上盡力重新檢查，以降低基於重新導向的樞紐轉移。

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

## 每代理存取設定檔（多代理）

透過多代理路由，每個代理都可以有自己的沙箱與工具政策：
使用這項能力為每個代理提供**完整存取**、**唯讀**或**無存取**。
完整詳細資訊與優先順序規則，請參閱[多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

常見使用案例：

- 個人代理：完整存取，無沙箱
- 家庭/工作代理：沙箱化 + 唯讀工具
- 公用代理：沙箱化 + 無檔案系統/shell 工具

### 範例：完整存取（無沙箱）

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

### 範例：無檔案系統/shell 存取（允許提供者訊息）

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

如果你的人工智慧做了不當行為：

### 控制

1. **停止它：**停止 macOS 應用程式（如果它監督 Gateway）或終止你的 `openclaw gateway` 程序。
2. **關閉暴露面：**設定 `gateway.bind: "loopback"`（或停用 Tailscale Funnel/Serve），直到你了解發生了什麼。
3. **凍結存取：**將有風險的私訊/群組切換為 `dmPolicy: "disabled"` / 要求提及，並移除你曾設定的 `"*"` 全允許項目。

### 輪替（如果秘密外洩，假設已遭入侵）

1. 輪替 Gateway 驗證（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）並重新啟動。
2. 在任何能呼叫 Gateway 的機器上輪替遠端用戶端秘密（`gateway.remote.token` / `.password`）。
3. 輪替提供者/API 憑證（WhatsApp 憑證、Slack/Discord token、`auth-profiles.json` 中的模型/API 金鑰，以及使用時的加密秘密酬載值）。

### 稽核

1. 檢查 Gateway 記錄：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`）。
2. 檢閱相關逐字稿：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 檢閱最近的設定變更（任何可能擴大存取的項目：`gateway.bind`、`gateway.auth`、私訊/群組政策、`tools.elevated`、Plugin 變更）。
4. 重新執行 `openclaw security audit --deep`，並確認關鍵發現已解決。

### 收集報告資料

- 時間戳記、Gateway 主機作業系統 + OpenClaw 版本
- 工作階段逐字稿 + 簡短記錄尾端（已遮蔽後）
- 攻擊者傳送了什麼 + 代理做了什麼
- Gateway 是否暴露在 loopback 之外（LAN/Tailscale Funnel/Serve）

## 使用 detect-secrets 進行秘密掃描

CI 會在 `secrets` 工作中執行 `detect-secrets` pre-commit hook。
推送到 `main` 一律會執行所有檔案掃描。Pull request 會在可取得基底 commit 時使用已變更檔案的
快速路徑，否則會退回到所有檔案掃描。如果失敗，表示有尚未納入基準的新候選項目。

### 如果 CI 失敗

1. 在本機重現：

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 了解這些工具：
   - pre-commit 中的 `detect-secrets` 會以 repo 的
     基準與排除項執行 `detect-secrets-hook`。
   - `detect-secrets audit` 會開啟互動式檢閱，以將每個基準
     項目標記為真實或誤報。
3. 對於真實秘密：輪替/移除它們，然後重新執行掃描以更新基準。
4. 對於誤報：執行互動式稽核並將它們標記為 false：

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 如果你需要新的排除項，請將它們新增到 `.detect-secrets.cfg`，並使用相符的 `--exclude-files` / `--exclude-lines` 旗標重新產生
   基準（設定檔僅供參考；detect-secrets 不會自動讀取它）。

當更新後的 `.secrets.baseline` 反映預期狀態後，請提交它。

## 回報安全問題

在 OpenClaw 中發現漏洞？請負責任地回報：

1. 電子郵件：[security@openclaw.ai](mailto:security@openclaw.ai)
2. 修復前不要公開發布
3. 我們會致謝你（除非你希望匿名）
