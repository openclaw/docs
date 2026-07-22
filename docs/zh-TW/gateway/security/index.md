---
read_when:
    - 新增擴大存取或自動化範圍的功能
summary: 執行具備 Shell 存取權限的 AI 閘道時的安全性考量與威脅模型
title: 安全性
x-i18n:
    generated_at: "2026-07-22T10:36:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ad2d8904f439cbbddd72861a3445d0c8db94f349f5bec11939bfe8f632331383
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **個人助理信任模型。** 本指引假設每個閘道只有一個受信任的
  操作者邊界（單一使用者、個人助理模型）。
  OpenClaw **並非**供多個敵對使用者共用同一個代理程式或閘道時使用的惡意多租戶安全邊界。
  若要在混合信任或敵對使用者環境中運作，請分割信任邊界：使用不同的閘道與
  認證資訊，最好也使用不同的作業系統使用者或主機。
</Warning>

## 範圍：個人助理安全模型

- 支援：每個閘道一個使用者／信任邊界（每個邊界最好使用一個作業系統使用者／主機／VPS）。
- 不支援：由彼此不信任或敵對的使用者共用同一個閘道／代理程式。
- 隔離敵對使用者需要使用不同的閘道（最好也使用不同的作業系統使用者／主機）。
- 若多名不受信任的使用者可以傳訊給同一個已啟用工具的代理程式，他們就會共用該代理程式被委派的工具權限。
- 若有人可以修改閘道主機的狀態／設定（`~/.openclaw`，包括 `openclaw.json`），請將其視為受信任的操作者。
- 在同一個閘道內，已驗證的操作者存取權是受信任的控制平面角色，而非個別使用者的租戶角色。
- `sessionKey`（工作階段 ID、標籤）是路由選擇器，而非授權權杖。

要託管多名使用者或多個組織嗎？請為每個租戶執行一個隔離的閘道單元，而非共用閘道。請參閱[多租戶託管](/zh-TW/gateway/multi-tenant-hosting)。

在變更遠端存取、私訊政策、反向代理或公開暴露設定前，請先依照[閘道暴露操作手冊](/zh-TW/gateway/security/exposure-runbook)完成事前檢查／復原檢查清單。

## `openclaw security audit`

每次變更設定後，或暴露網路介面前，請執行以下命令：

```bash
openclaw security audit
openclaw security audit --deep    # 嘗試即時探測閘道
openclaw security audit --fix     # 套用安全的修正措施
openclaw security audit --json
```

`--fix` 的範圍刻意限縮：它會將開放的群組政策改為允許清單、還原 `logging.redactSensitive: "tools"`、收緊狀態／設定／引入檔案的權限（`600` 檔案、`700` 目錄），並在 Windows 上使用 ACL 重設，而非 POSIX `chmod`。

### 稽核檢查的項目（概略）

- **傳入存取** - 私訊／群組政策、允許清單：陌生人是否能觸發機器人？
- **工具影響範圍** - 提升權限的工具與開放聊天室：提示注入是否可能轉化為殼層／檔案／網路操作？
- **執行檔案系統偏移** - 禁止會修改檔案系統的工具，但 `exec`／`process` 在不受沙箱限制的情況下仍可使用。
- **執行核准偏移** - `security="full"`、`autoAllowSkills`、缺少 `strictInlineEval` 的直譯器允許清單。單憑 `security="full"` 只代表整體安全態勢警告，並非錯誤的證明——這是受信任個人助理設定所選用的預設值；只有在你的威脅模型需要核准或允許清單防護措施時才應收緊。
- **網路暴露** - 閘道繫結／驗證、Tailscale Serve／Funnel，以及強度不足／過短的驗證權杖。
- **瀏覽器控制暴露** - 遠端節點、轉送連接埠、遠端 CDP 端點。
- **本機磁碟安全維護** - 權限、符號連結、設定引入、同步資料夾路徑。
- **外掛** - 未設定明確允許清單便載入。
- **政策偏移** - 已設定沙箱 Docker 選項，但沙箱模式卻關閉；看似有效、實際上只比對確切命令 ID（例如 `system.run`），而不比對承載內容中殼層文字的 `gateway.nodes.commands.deny` 項目；危險的 `gateway.nodes.commands.allow` 項目；全域 `tools.profile="minimal"` 被各代理程式設定覆寫；在寬鬆政策下可存取外掛所擁有的工具。
- **執行階段預期偏移** - 認為隱含執行仍代表 `sandbox`，但 `tools.exec.host` 現在預設為 `auto`；或在沙箱模式關閉時設定 `tools.exec.host="sandbox"`。
- **模型安全維護** - 對已設定的舊版模型發出警告（軟性警告，而非硬性阻擋）。

每個發現都有結構化的 `checkId`（例如 `gateway.bind_no_auth`、`tools.exec.security_full_configured`）。前綴包括：`fs.*`（權限）、`gateway.*`（繫結／驗證／Tailscale／控制介面／受信任代理）、`hooks.*`／`browser.*`／`sandbox.*`／`tools.exec.*`（各介面強化）、`plugins.*`／`skills.*`（供應鏈）、`security.exposure.*`（存取政策 × 工具影響範圍）。如需包含嚴重性與自動修正支援的完整目錄，請參閱[安全性稽核檢查](/zh-TW/gateway/security/audit-checks)。另請參閱[形式化驗證](/zh-TW/security/formal-verification)。

### 分類處理發現時的優先順序

1. 任何“開放”且啟用工具的項目：先鎖定私訊／群組（配對／允許清單），再收緊工具政策／沙箱。
2. 公開網路暴露（LAN 繫結、Funnel、缺少驗證）：立即修正。
3. 瀏覽器控制的遠端暴露：比照操作者存取權處理（僅限 tailnet、審慎配對節點、不可公開暴露）。
4. 權限：狀態／設定／認證資訊／驗證資料不得允許群組／所有人讀取。
5. 外掛：只載入你明確信任的項目。
6. 模型選擇：任何具備工具的機器人都應優先使用現代且經指令強化的模型。

## 60 秒內完成強化基準設定

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

這會讓閘道僅限本機使用、隔離私訊，並預設停用控制平面／執行階段工具。之後再針對受信任的代理程式選擇性重新啟用工具。

聊天驅動代理程式回合的內建基準：無論設定為何，非擁有者傳送者都無法使用 `cron` 或 `gateway` 工具。

## 信任邊界矩陣

用於分類風險報告的快速模型：

| 邊界或控制措施                                       | 意義                                     | 常見誤解                                                                |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（權杖／密碼／受信任代理／裝置驗證） | 驗證閘道 API 的呼叫者             | “為了安全，每個訊框中的每則訊息都需要簽章”                    |
| `sessionKey`                                              | 用於選擇內容／工作階段的路由鍵         | “工作階段金鑰是使用者驗證邊界”                                         |
| 提示／內容防護措施                                 | 降低模型遭濫用的風險                           | “僅憑提示注入就能證明驗證遭繞過”                                   |
| `canvas.eval`／瀏覽器 evaluate                          | 啟用時屬於刻意提供的操作者能力      | “在此信任模型中，任何 JS eval 原語都會自動構成漏洞”           |
| 本機終端介面 `!` 殼層                                       | 由操作者明確觸發的本機執行       | “本機殼層便利命令就是遠端注入”                         |
| 節點配對與節點命令                            | 在已配對裝置上執行操作者層級的遠端操作 | “遠端裝置控制預設應視為不受信任的使用者存取” |
| `gateway.nodes.pairing.autoApproveCidrs`                  | 選擇啟用的受信任網路節點註冊政策     | “預設停用的允許清單本身就是自動配對漏洞”       |
| `gateway.nodes.pairing.sshVerify`                         | 透過操作者 SSH 進行金鑰驗證的節點註冊    | “預設啟用的自動核准本身就是自動配對漏洞”              |

## 設計上不屬於漏洞的情況

<Accordion title="通常會以無須處理結案的發現">

- 只有提示注入鏈，未繞過政策、驗證或沙箱。
- 假設在一個共用主機或設定上進行惡意多租戶操作的主張。
- 在共用閘道設定中，將一般操作者的讀取路徑存取權（例如 `sessions.list`／`sessions.preview`／`chat.history`）歸類為 IDOR。
- 僅限 localhost 部署的發現（例如僅限回送介面的閘道缺少 HSTS）。
- 針對此存放庫中不存在的傳入路徑提出 Discord 傳入網路鉤子簽章問題。
- 將節點配對中繼資料視為 `system.run` 每個命令的隱藏第二層核准機制；實際的執行邊界是閘道的全域節點命令政策，加上節點本身的執行核准。
- 因 `gateway.nodes.pairing.sshVerify` 預設啟用而將其視為漏洞。它絕不會只根據網路位置或 SSH 可連線性進行核准：閘道會透過 SSH 回讀裝置身分（BatchMode、嚴格主機金鑰），且只有在裝置金鑰與待處理要求完全相符時才會核准；這要求連線金鑰組已存在於操作者所控制主機上的操作者帳號中。探測僅限私有／CGNAT 來源位址，並採用相同的受信任 CIDR 資格下限（僅限新的無範圍 `role: node`），而 `sshVerify: false` 可關閉此功能。
- 僅憑 `gateway.nodes.pairing.autoApproveCidrs` 本身便將其視為漏洞。它預設停用、需要明確的 CIDR／IP 項目、僅適用於首次且未要求範圍的 `role: node` 配對，並且絕不會自動核准操作者／瀏覽器／控制介面、WebChat、角色／範圍升級、中繼資料或公開金鑰變更，以及同主機回送介面的受信任代理標頭路徑（即使已啟用回送介面的受信任代理驗證）。
- 將 `sessionKey` 視為驗證權杖的“缺少個別使用者授權”發現。

</Accordion>

## 閘道與節點信任

將閘道與節點視為具有不同角色、但同屬一個操作者信任網域：

- **閘道**：控制平面與政策介面（`gateway.auth`、工具政策、路由）。
- **節點**：與該閘道配對的遠端執行介面（命令、裝置操作、主機本機能力）。
- 通過閘道驗證的呼叫者在閘道範圍內受信任；配對後，節點操作即為該節點上的受信任操作者操作。請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。
- 使用共用閘道權杖／密碼驗證的直接回送後端用戶端，無須出示使用者裝置身分，即可進行內部控制平面 RPC。這不是遠端或瀏覽器配對繞過——網路用戶端、節點用戶端、裝置權杖用戶端和明確的裝置身分仍須通過配對與範圍升級強制執行。
- 執行核准（允許清單 + 詢問）是操作者意圖的防護措施，而非惡意多租戶隔離。它們會繫結確切的要求內容，以及盡力處理直接的本機檔案運算元；但不會以語意方式模擬每一條執行階段／直譯器載入器路徑。若需要強韌邊界，請使用沙箱與主機隔離。
- 受信任單一操作者的預設值：允許在 `gateway`／`node` 上執行主機命令，且不顯示核准提示（`security="full"`、`ask="off"`）。這是刻意設計的使用者體驗，本身並非漏洞。

若要隔離敵對使用者，請依作業系統使用者／主機分割信任邊界，並執行不同的閘道。

## 威脅模型

你的 AI 助理可以執行任意 Shell 命令、讀寫檔案、存取網路服務，以及向任何人傳送訊息（若已授予頻道存取權）。向它傳送訊息的人可能會試圖誘騙它做壞事、透過社交工程取得你的資料存取權，或探查基礎架構的詳細資訊。

這裡的大多數失敗都不是罕見的漏洞利用，而是「有人向機器人傳送訊息，而機器人照著對方的要求做了」。OpenClaw 的立場依序如下：

1. **身分優先** — 決定誰可以與機器人交談（私訊配對／允許清單／明確設為「開放」）。
2. **接著限制範圍** — 決定機器人可以在哪裡執行動作（群組允許清單 + 提及閘控、工具、沙箱、裝置權限）。
3. **最後才是模型** — 假設模型可能遭到操控；設計時讓操控造成的影響範圍保持有限。

## 私訊存取：配對、允許清單、開放、停用

每個支援私訊的頻道都支援 `dmPolicy`（或 `*.dm.policy`），會在處理訊息前對傳入私訊進行閘控：

| 政策      | 行為                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pairing`   | 預設值。未知傳送者會收到配對碼；在核准前，機器人會忽略他們。配對碼會在 1 小時後到期；在建立新請求前，重複傳送私訊不會再次傳送配對碼。每個頻道最多可有 3 個待處理請求。 |
| `allowlist` | 封鎖未知傳送者，不進行配對交握。                                                                                                                                                                       |
| `open`      | 任何人都可以傳送私訊（公開）。頻道允許清單必須包含 `"*"`（明確選擇加入）。                                                                                                                           |
| `disabled`  | 完全忽略傳入私訊。                                                                                                                                                                                        |

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細資訊與磁碟上的檔案：[配對](/zh-TW/channels/pairing)

將 `dmPolicy="open"` 和 `groupPolicy="open"` 視為最後手段的設定；除非你完全信任聊天室中的每位成員，否則應優先使用配對 + 允許清單。

### 允許清單（兩層）

- **私訊允許清單**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；舊版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）：誰可以向機器人傳送私訊。當 `dmPolicy="pairing"` 時，核准項目會寫入 `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）或 `<channel>-<accountId>-allowFrom.json`（非預設帳號），並與設定中的允許清單合併。
- **群組允許清單**（依頻道而異）：機器人會接受哪些群組／頻道／伺服器。
  - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`：各群組的預設值，例如 `requireMention`；設定後也會作為群組允許清單（包含 `"*"` 可維持全部允許的行為）。使用 `agents.entries.*.groupChat.mentionPatterns` 自訂提及觸發詞（例如 `["@openclaw", "@mybot"]`），讓 `requireMention` 根據你自己的機器人名稱進行閘控。
  - `groupPolicy="allowlist"` + `groupAllowFrom`：限制誰可以在群組工作階段內觸發機器人（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
  - `channels.discord.guilds` / `channels.slack.channels`：各介面的允許清單 + 提及預設值。
  - 檢查順序：先檢查 `groupPolicy`/群組允許清單，再檢查提及／回覆啟用條件。回覆機器人的訊息（隱含提及）**不會**繞過 `groupAllowFrom`。

詳細資訊：[設定](/zh-TW/gateway/configuration)和[群組](/zh-TW/channels/groups)

### 私訊工作階段隔離（多使用者模式）

OpenClaw 預設會將所有私訊導向主要工作階段，以維持跨裝置連續性。如果多人可以向機器人傳送私訊（開放私訊或多人允許清單），請隔離私訊工作階段：

```json5
{ session: { dmScope: "per-channel-peer" } }
```

`session.dmScope` 值：

| 值                      | 範圍                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| `main`（設定預設值）    | 所有私訊共用一個工作階段。                                             |
| `per-channel-peer`         | 每個頻道 + 傳送者組合都會取得隔離的私訊內容脈絡（安全私訊模式）。 |
| `per-account-channel-peer` | 與上述相同，但會進一步依帳號拆分（多帳號頻道）。         |
| `per-peer`                 | 每位傳送者在所有相同類型的頻道中共用一個工作階段。     |

本機命令列介面引導流程會保留明確設定的 `session.dmScope`，否則保持未設定，讓 `"main"` 預設值生效：所有頻道的直接訊息會共用代理程式持續滾動的主要工作階段（個人代理程式的預設值）。對於共用或多使用者收件匣，請設定 `session.dmScope: "per-channel-peer"`；`openclaw security audit` 偵測到多使用者私訊流量時會建議採用隔離。

這是訊息內容脈絡的邊界，不是主機管理員的邊界。如果使用者彼此敵對，卻共用相同的閘道主機／設定，請依信任邊界分別執行不同的閘道。

如果同一個人透過多個頻道聯絡你，請使用 `session.identityLinks` 將這些私訊工作階段合併至同一個標準身分。請參閱[工作階段管理](/zh-TW/concepts/session)和[設定](/zh-TW/gateway/configuration)。

## 內容脈絡可見性與觸發授權

這是兩個不同的概念：

- **觸發授權**：誰可以觸發代理程式（`dmPolicy`、`groupPolicy`、允許清單、提及閘控）。
- **內容脈絡可見性**：哪些補充內容脈絡會傳給模型（回覆本文、引用文字、討論串歷史記錄、轉寄中繼資料）。

`contextVisibility` 控制後者：

- `"all"`（預設值）：依接收時的原貌保留補充內容脈絡。
- `"allowlist"`：補充內容脈絡會篩選為通過目前允許清單檢查的傳送者。
- `"allowlist_quote"`：與 `allowlist` 相同，但仍保留一則明確引用的回覆。

可依頻道或聊天室／對話進行設定，請參閱[群組](/zh-TW/channels/groups#context-visibility-and-allowlists)。如果報告只指出「模型可以看到非允許清單傳送者所提供的引用／歷史文字」，這屬於可透過 `contextVisibility` 處理的強化問題，本身不構成驗證或沙箱繞過；具有安全影響的報告仍必須證明確實能繞過信任邊界。

## 提示詞注入

攻擊者會精心設計訊息，操控模型執行不安全的動作（「忽略你的指示」、「傾印你的檔案系統」、「開啟這個連結並執行命令」）。單靠系統提示詞的防護措施**無法解決**提示詞注入 — 那些措施只是軟性指引；硬性防護來自工具政策、執行核准、沙箱，以及頻道允許清單（操作者仍可依設計停用這些機制）。

提示詞注入不需要公開私訊：即使只有你可以向機器人傳送訊息，它讀取的任何**不受信任內容**（網頁搜尋／擷取結果、瀏覽器頁面、電子郵件、文件、附件、貼上的記錄／程式碼）都可能包含惡意指示。內容本身就是攻擊面，不只是傳送者。

應視為不受信任的警訊：

- 「讀取這個檔案／URL，並完全照著其中的內容執行。」
- 「忽略你的系統提示詞或安全規則。」
- 「揭露你的隱藏指示或工具輸出。」
- 「貼出 ~/.openclaw 或你的記錄檔完整內容。」

實務上有效的做法：

- 嚴格限制傳入私訊（配對／允許清單）；在群組中優先採用提及閘控；避免在公開聊天室中使用永久啟用的機器人。
- 預設將連結、附件和貼上的指示視為惡意內容。
- 在沙箱中執行敏感工具；不要將機密資料放在代理程式可存取的檔案系統中。沙箱為選擇性啟用：如果沙箱模式已關閉，隱含的 `host=auto` 會解析為閘道主機，而明確設定的 `host=sandbox` 仍會以封閉方式失敗（沒有可用的沙箱執行環境）。設定 `host=gateway`，以便在設定中明確表達此行為。
- 將高風險工具（`exec`、`browser`、`web_fetch`、`web_search`）限制為僅供受信任的代理程式或明確允許清單使用。
- 如果將直譯器（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）加入允許清單，請啟用 `tools.exec.strictInlineEval`，確保行內求值形式（`-c`、`-e` 和類似形式）仍需要明確核准。在允許清單模式下，任何 heredoc 區段（`<<`）無論如何引用，都一律需要審查者或明確核准 — 已加入允許清單的命令不能利用 heredoc 本文繞過允許清單審查。
- 使用唯讀或停用工具的**閱讀代理程式**摘要不受信任的內容，再將摘要傳給主要代理程式，以縮小影響範圍。
- 對於 Gmail 網路鉤子，內建的逐訊息工作階段會隔離對話內容脈絡，但不會移除目標代理程式的工具或工作區權限。將不受信任的郵件導向專用的閱讀代理程式、套用[各代理程式的沙箱與工具限制](/zh-TW/tools/multi-agent-sandbox-tools)，並使用 [`tools.agentToAgent`](/zh-TW/gateway/config-tools#toolsagenttoagent) 限制任何交接至主要代理程式的內容。請參閱 [Gmail 整合](/zh-TW/gateway/configuration-reference#gmail-integration)。
- 除非確有需要，否則對已啟用工具的代理程式關閉 `web_search` / `web_fetch` / `browser`。
- 對於 OpenResponses URL 輸入（`input_file` / `input_image`），請設定嚴格的 `gateway.http.endpoints.responses.files.urlAllowlist` / `images.urlAllowlist`，並將 `maxUrlParts` 保持為低值（空的允許清單視為未設定）。使用 `files.allowUrl: false` / `images.allowUrl: false` 可完全停用 URL 擷取。
- 不要在提示詞中放入機密資料；改為透過閘道主機上的環境變數／設定傳遞。

**模型選擇很重要。** 各模型層級抵抗提示詞注入的能力並不一致 — 面對惡意提示詞時，較小／較便宜的模型更容易誤用工具及遭到指示劫持。

<Warning>
對於已啟用工具或會讀取不受信任內容的代理程式，使用較舊／較小模型的提示詞注入風險通常過高。請勿在能力較弱的模型層級上執行這些工作負載。
</Warning>

- 任何能夠執行工具或接觸檔案／網路的機器人，都應使用最新世代、最高層級的模型。
- 請勿對已啟用工具的代理程式或不受信任的收件匣使用較舊／較弱／較小的模型層級。
- 如果必須使用較小的模型，請縮小影響範圍：使用唯讀工具、嚴格的沙箱、最少的檔案系統存取權限，以及嚴格的允許清單。為所有工作階段啟用沙箱，並停用 `web_search`/`web_fetch`/`browser`，除非輸入受到嚴格控制。
- 對於僅供聊天、輸入可信且不使用工具的個人助理，較小的模型通常已足夠。

### 外部內容與不受信任輸入的包裝

OpenResponses `input_file` 文字即使由閘道在本機解碼，仍會被注入為不受信任的外部內容——該區塊包含 `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 邊界標記與 `Source: External` 中繼資料（此路徑省略其他位置所使用、較長的 `SECURITY NOTICE:` 橫幅）。當媒體理解功能從附加文件中擷取文字，再將其附加至媒體提示時，也會套用相同的標記式包裝。

OpenClaw 也會從包裝後的外部內容與中繼資料中移除常見的自架 LLM 聊天範本特殊權杖常值（Qwen/ChatML、Llama、Gemma、Mistral、Phi、GPT-OSS 角色／輪次權杖），避免其抵達模型。自架的 OpenAI 相容後端（vLLM、SGLang、TGI、LM Studio、自訂 Hugging Face tokenizer 堆疊）有時會將使用者內容中的 `<|im_start|>` 或 `<|start_header_id|>` 等常值字串，權杖化為結構性的聊天範本權杖；若沒有此清理措施，所擷取頁面、電子郵件內文或檔案內容工具輸出中的不受信任文字，便可能偽造合成的 `assistant`/`system` 角色邊界。清理作業會在外部內容包裝層進行，因此會一致套用至擷取／讀取工具及傳入的頻道內容。託管供應商（OpenAI、Anthropic）已套用自身的請求端清理；請保持啟用外部內容包裝，並在可用時優先採用會拆分／逸出特殊權杖的後端設定。

傳出的模型回應另有獨立的清理器，會在最終頻道傳遞邊界，從使用者可見的回覆中移除洩漏的 `<tool_call>`、`<function_calls>`、`<system-reminder>`、`<previous_response>` 及類似的內部框架內容。

這不能取代 `dmPolicy`、允許清單、exec 核准、沙箱機制或 `contextVisibility`——它只封閉一個特定的 tokenizer 層繞過途徑。

### 繞過旗標（在正式環境中保持關閉）

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- 排程承載資料欄位 `allowUnsafeExternalContent`

僅可為範圍嚴格受限的偵錯暫時啟用；若已啟用，請隔離該代理程式（沙箱 + 最少工具 + 專用工作階段命名空間）。

即使傳遞來源是你控制的系統，Hook 承載資料仍是不受信任的內容（郵件／文件／網頁內容可能帶有提示詞注入）。能力較弱的模型層級會提高此風險——對於由 Hook 驅動的自動化，請優先採用強大的現代模型層級，並嚴格限制工具原則（`tools.profile: "messaging"` 或更嚴格），同時在可行情況下使用沙箱機制。

### 群組中的推理與詳細輸出

`/reasoning`、`/verbose` 和 `/trace` 可能會揭露不應出現在公開頻道中的內部推理、工具輸出或外掛診斷資訊——其中可能包含工具引數、URL、外掛診斷資訊，以及模型所見的資料。請在公開聊天室中保持停用；僅可在受信任的私訊或嚴格控管的聊天室中啟用。

## 命令授權

只有獲授權傳送者的斜線命令與指令才會生效；授權身分是依據頻道允許清單／配對加上 `commands.useAccessGroups` 得出（請參閱[設定](/zh-TW/gateway/configuration)和[斜線命令](/zh-TW/tools/slash-commands)）。如果頻道允許清單為空或包含 `"*"`，該頻道實際上會對所有人開放命令。

`/exec` 僅是提供給獲授權操作員的工作階段內便利功能——它不會寫入設定，也不會變更其他工作階段。

## 控制平面工具

有兩個內建工具仍涉及控制平面敏感操作：

- `gateway` 使用 `config.schema.lookup` / `config.get` 讀取設定。它無法寫入設定、更新 OpenClaw 或重新啟動閘道。
- `cron` 會建立排程工作，並在原始聊天／任務結束後繼續執行。

`gateway` 工具仍僅限擁有者使用，因為讀取設定可能會揭露祕密與主機拓撲。代理程式會透過 `openclaw` 委派工具請求永久設定或生命週期變更；OpenClaw 會將其對應至具型別的操作，並要求人工核准後才套用。請參閱 [OpenClaw 設定代理程式](/zh-TW/cli/openclaw#operations-and-approval)。

對於任何處理不受信任內容的代理程式／介面，預設拒絕這些工具：

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` 會停用 `/restart` 和外部 `SIGUSR1` 重新啟動請求。`gateway` 代理程式工具沒有重新啟動動作。

## 節點執行（`system.run`）

如果已配對 macOS 節點，閘道便可在該節點上叫用 `system.run`——這等同於在該 Mac 上遠端執行程式碼。

- 需要節點配對（核准 + 權杖）。配對會建立節點身分／信任關係並核發權杖；它不是逐命令核准的介面。
- 閘道會透過 `gateway.nodes.commands.allow` / `gateway.nodes.commands.deny` 套用粗粒度的全域節點命令原則。拒絕清單僅比對確切的節點命令名稱（例如 `system.run`），不會比對命令承載資料中的 shell 文字——若重新連線的節點宣告不同的命令清單，只要閘道的全域原則與節點自身的 exec 核准仍會強制執行邊界，這本身就不構成弱點。
- 各節點的 `system.run` 原則是節點自身的 exec 核准檔案（`exec.approvals.node.*`），可在 Mac 上透過 Settings -> Exec approvals（security + ask + allowlist）控制；它可能比閘道的全域命令 ID 原則更嚴格或更寬鬆。
- 執行 `security="full"` 和 `ask="off"` 的節點遵循預設的受信任操作員模型——除非你的部署需要更嚴格的安全立場，否則這是預期行為，不是錯誤。
- 核准模式會繫結確切的請求內容，並在可行情況下繫結一個具體的本機指令碼／檔案運算元。如果 OpenClaw 無法為直譯器／執行階段命令明確識別唯一一個直接本機檔案，則會拒絕需要核准的執行，而不會宣稱能提供完整的語意涵蓋範圍。
- 對於 `host=node`，需要核准的執行也會儲存一份標準化且已準備好的 `systemRunPlan`；後續獲准的轉送會重複使用該已儲存計畫，而閘道驗證會拒絕呼叫端在核准請求建立後修改命令／cwd／工作階段內容。
- 若要完全停用遠端執行：請將安全性設為 `deny`，並移除該 Mac 的節點配對。

## 動態 Skills（監看程式／遠端節點）

OpenClaw 可以在工作階段進行期間重新整理 Skills 清單：當 `SKILL.md` 變更時，Skills 監看程式會在代理程式下一輪執行時更新快照；連線 macOS 節點也可讓僅限 macOS 的 Skills 符合使用條件（依據二進位檔探測）。請將 Skill 資料夾視為受信任程式碼，並限制可修改者。

## 外掛

外掛會與閘道在同一處理程序中執行——請將其視為受信任程式碼。

- 僅從你信任的來源安裝；優先使用明確的 `plugins.allow` 允許清單；啟用前檢閱外掛設定；外掛變更後重新啟動閘道。
- 安裝／更新外掛會執行可執行程式碼：
  - 安裝路徑是使用中外掛安裝根目錄下各外掛的專屬目錄。
  - ClawHub 套件及 OpenClaw 的內建／官方目錄均屬受信任來源。新的任意 npm、`npm-pack:`、git、本機路徑／封存檔或市集來源會在安裝前發出警告；非互動式安裝要求你檢閱並信任該來源後提供 `--force`。`--force` 會確認來源並允許覆寫；它不會繞過 `security.installPolicy` 或其他安裝安全檢查。更新會重複使用已選取的來源。
  - OpenClaw 在安裝／更新期間不會執行內建的本機危險程式碼封鎖。請使用 `security.installPolicy` 進行由操作員掌控的本機允許／封鎖決策，並使用 `openclaw security audit --deep` 進行診斷掃描。
  - npm 和 git 外掛安裝只會在明確執行安裝／更新流程期間進行套件管理員相依性收斂。本機路徑與封存檔會被視為自含式套件；OpenClaw 會複製／參照它們，而不執行 `npm install`。
  - 優先採用鎖定的確切版本（`@scope/pkg@1.2.3`），並在啟用前檢查解壓縮後的程式碼。
  - `--dangerously-force-unsafe-install` 已棄用，且不再變更安裝／更新行為。
  - `security.installPolicy` 可讓操作員執行受信任的本機命令，針對 Skill 與外掛安裝作出主機特定的允許／封鎖決策。此命令會在來源內容暫存後、安裝繼續前執行，也適用於 ClawHub Skills，且無法由已棄用的不安全旗標繞過。

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 沙箱機制

專門文件：[沙箱機制](/zh-TW/gateway/sandboxing)

兩種互補方法：

- **在 Docker 中執行完整閘道**（容器邊界）：[Docker](/zh-TW/install/docker)
- **工具沙箱**（`agents.defaults.sandbox`；主機閘道 + 沙箱隔離工具；Docker 是預設後端）：[沙箱機制](/zh-TW/gateway/sandboxing)

<Note>
為防止跨代理程式存取，請將 `agents.defaults.sandbox.scope` 保持為 `"agent"`（預設值），或使用 `"session"` 以實施更嚴格的各工作階段隔離。`scope: "shared"` 會使用單一容器或工作區。
</Note>

沙箱內的代理程式工作區存取權（`agents.defaults.sandbox.workspaceAccess`）：

- `"none"`（預設）：工具會看到 `~/.openclaw/sandboxes` 下的沙箱工作區；無法存取代理程式工作區。
- `"ro"`：將代理程式工作區以唯讀方式掛載至 `/agent`（停用 `write`/`edit`/`apply_patch`）。
- `"rw"`：將代理程式工作區以讀寫方式掛載至 `/workspace`。

系統會依據正規化、標準化後的來源路徑驗證額外的 `sandbox.docker.binds`。封鎖路徑拒絕清單涵蓋 `/etc`、`/private/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`，以及通常包含或別名指向 Docker 通訊端的目錄（其下的 `/run`、`/var/run` 和 `docker.sock`），另包括 HOME 認證資訊子路徑（`.aws`、`.cargo`、`.config`、`.docker`、`.gnupg`、`.netrc`、`.npm`、`.ssh`）。系統會透過現有祖先解析父層符號連結技巧與標準化主目錄別名，再重新檢查；因此，若它們解析至遭封鎖的根目錄，仍會以封閉方式失敗。

<Warning>
`tools.elevated` 是在沙箱外執行 exec 的全域基準逃生口。有效主機預設為 `gateway`；若 exec 目標設定為 `node`，則為 `node`。請嚴格限制 `tools.elevated.allowFrom`，切勿對陌生人啟用。可透過 `agents.entries.*.tools.elevated` 進一步限制各代理程式。請參閱[提升權限模式](/zh-TW/tools/elevated)。
</Warning>

### 子代理程式委派防護措施

如果允許工作階段工具，請將委派的子代理程式執行視為另一項邊界決策：

- 除非代理程式確實需要委派，否則拒絕 `sessions_spawn`。
- 將 `agents.defaults.subagents.allowAgents` 及任何各代理程式的 `agents.entries.*.subagents.allowAgents` 覆寫限制於已知安全的目標代理程式。
- 對於必須保持在沙箱中的工作流程，請使用 `sandbox: "require"`（預設為 `"inherit"`）呼叫 `sessions_spawn`；當目標子執行階段未置於沙箱中時，`"require"` 會立即失敗。

### 唯讀模式

若要建立唯讀設定檔，請將 `agents.defaults.sandbox.workspaceAccess: "ro"`（或使用 `"none"` 以禁止工作區存取）與封鎖 `write`、`edit`、`apply_patch`、`exec`、`process` 等項目的工具允許／拒絕清單搭配使用。

- `tools.exec.applyPatch.workspaceOnly: true`（預設）：即使關閉沙箱，也會防止 `apply_patch` 在工作區目錄之外寫入／刪除。只有在你確實希望 `apply_patch` 修改工作區之外的檔案時，才設定 `false`。
- `tools.fs.workspaceOnly: true`（選用）：將 `read`/`write`/`edit`/`apply_patch` 路徑及原生提示詞圖片自動載入路徑限制在工作區目錄內。
- 保持檔案系統根目錄範圍狹窄——避免將你的家目錄等寬泛根目錄用於代理程式／沙箱工作區，否則可能讓檔案系統工具存取敏感的本機檔案（例如 `~/.openclaw` 下的狀態／設定）。

## 各代理程式的存取設定檔（多代理程式）

每個代理程式都可擁有各自的沙箱與工具政策：完整存取、唯讀或無存取權。優先順序規則請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

常見模式：個人代理程式（完整存取、不使用沙箱）、家庭／工作代理程式（沙箱化 + 唯讀工具）、公開代理程式（沙箱化 + 無檔案系統／殼層工具）。

### 完整存取（不使用沙箱）

```json5
{
  agents: {
    list: [
      { id: "personal", workspace: "~/.openclaw/workspace-personal", sandbox: { mode: "off" } },
    ],
  },
}
```

### 唯讀工具 + 唯讀工作區

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### 無檔案系統／殼層存取權（允許供應商訊息功能）

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          // 工作階段工具可能會揭露逐字稿資料。預設範圍是目前工作階段 + 衍生工作階段；
          // 讀取範圍也包含透過環境群組感知所監看的同代理程式群組。
          // 使用 visibility: "self" 可排除這些受監看的工作階段。
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "discord",
            "slack",
            "telegram",
            "whatsapp",
          ],
          deny: [
            "apply_patch",
            "browser",
            "canvas",
            "cron",
            "edit",
            "exec",
            "gateway",
            "image",
            "nodes",
            "process",
            "read",
            "write",
          ],
        },
      },
    ],
  },
}
```

## 瀏覽器控制風險

啟用瀏覽器控制會讓模型取得真實瀏覽器的控制權。如果該設定檔已有登入中的工作階段，模型便可存取這些帳號和資料——請將瀏覽器設定檔視為敏感狀態。

- 建議代理程式使用專用設定檔（預設的 `openclaw` 設定檔）；避免使用你日常使用的個人設定檔。
- 除非你信任沙箱化代理程式，否則應停用其主機瀏覽器控制。
- 獨立的迴送瀏覽器控制 API 僅接受共用密鑰驗證（閘道權杖 Bearer 驗證或閘道密碼）——不會採用受信任 Proxy 或 Tailscale Serve 的身分標頭。
- 將瀏覽器下載內容視為不受信任的輸入；建議使用隔離的下載目錄。
- 如可行，請在代理程式設定檔中停用瀏覽器同步／密碼管理員。
- 對遠端閘道而言，“瀏覽器控制”等同於對該設定檔所能存取的一切擁有“操作員存取權”。
- 僅允許透過 Tailnet 存取閘道和節點主機；避免將瀏覽器控制連接埠暴露給區域網路或公用網際網路。
- 不需要時，請停用瀏覽器 Proxy 路由（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP 的既有工作階段模式並不“更安全”——它可以使用你的身分，操作該主機 Chrome 設定檔所能存取的一切。
- 在瀏覽器所在的電腦上執行**節點主機**，並在閘道與瀏覽器分處不同電腦時，讓閘道代理瀏覽器操作（請參閱[瀏覽器工具](/zh-TW/tools/browser)）；將節點配對視同管理員存取權，讓閘道與節點主機位於同一個 Tailnet，並避免透過區域網路、公用網際網路或 Tailscale Funnel 暴露轉送／控制連接埠。

### 瀏覽器 SSRF 政策（預設嚴格）

除非你明確選擇啟用，否則私人／內部目的地會持續遭到封鎖。

- 預設：未設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`，因此私人／內部／特殊用途目的地會持續遭到封鎖。仍接受舊版別名 `allowPrivateNetwork`。
- 選擇啟用：設定 `dangerouslyAllowPrivateNetwork: true` 以允許這些目的地。
- 在嚴格模式中，使用 `hostnameAllowlist`（例如 `*.example.com` 的模式）與 `allowedHostnames`（確切的主機例外，包括 `localhost` 等原本會遭封鎖的名稱）來明確設定例外。
- 系統會對直接導覽要求進行預檢。在操作期間及有界的操作後寬限期內，受防護的 Playwright 互動（點擊、座標點擊、停留、拖曳、捲動、選取、按鍵、輸入、填寫表單及求值）會在送出 HTTP 要求位元組之前，攔截政策拒絕的頂層與子框架文件載入，然後盡力重新檢查最終的 `http(s)` URL。
- 每次全新啟動受管理的 Chrome 前，OpenClaw 都會盡力停用網路預測，抑制觀察到的 Chromium 對這些遭拒載入進行推測性預先連線。這是縱深防禦措施，而非政策邊界：在控制服務重新啟動期間重複使用的瀏覽器及其他瀏覽器後端，可能不會套用相同的強化措施。頁面路由仍屬於要求層級的攔截，而非網路防火牆：重新導向中的各個節點、彈出式視窗的第一個要求、Service Worker 流量、在有界防護期間結束後執行的頁面程式碼，以及部分背景／子資源路徑，都可能繞過攔截。最終 URL 檢查仍是偵測／隔離防禦；若要完全阻止，必須由擁有者端進行出口隔離，或使用可強制執行政策的 Proxy。

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

## 網路暴露

### 繫結、連接埠、防火牆

閘道會在同一個連接埠上多工處理 WebSocket + HTTP（預設為 `18789`；設定／旗標／環境變數：`gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`）。該 HTTP 介面包括控制介面（SPA 資產，預設基礎路徑為 `/`）及畫布主機（`/__openclaw__/canvas` 和 `/__openclaw__/a2ui`——任意 HTML/JS；在一般瀏覽器中載入時應視為不受信任的內容；請勿將其暴露給不受信任的網路／使用者，也不要與具高權限的網頁介面共用來源）。

`gateway.bind` 控制閘道的監聽位置：

- `"loopback"`（預設）：僅允許本機用戶端連線。
- `"lan"`、`"tailnet"`、`"custom"`：擴大攻擊面。僅可搭配閘道驗證（共用權杖／密碼，或正確設定的受信任 Proxy）及真正的防火牆使用。

經驗法則：優先使用 Tailscale Serve，而非區域網路繫結（Serve 會讓閘道維持在迴送介面上，由 Tailscale 處理存取）；如果必須繫結至區域網路，請使用防火牆將連接埠限制在嚴格的來源 IP 允許清單內，而不要廣泛進行連接埠轉送；絕不可在 `0.0.0.0` 上公開未經驗證的閘道。

### 搭配 UFW 發布 Docker 連接埠

已發布的容器連接埠（`-p HOST:CONTAINER` 或 Compose `ports:`）會經過 Docker 的轉送鏈路由，而非只經過主機的 `INPUT` 規則。請在 `DOCKER-USER` 中強制執行規則（會在 Docker 自身的接受規則之前評估）；多數現代發行版使用 `iptables-nft` 前端，而該前端仍會將這些規則套用至 nftables 後端。

```bash
# /etc/ufw/after.rules（附加為獨立的 *filter 區段）
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

IPv6 使用獨立的資料表——如果已啟用 Docker IPv6，請在 `/etc/ufw/after6.rules` 中加入相符的政策。避免硬式編碼介面名稱（`eth0`），因為它們在不同 VPS 映像檔（`ens3`、`enp*` 等）之間可能有所不同，而不相符可能會讓系統悄悄略過你的拒絕規則。

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

預期的外部連接埠應僅限你刻意公開的連接埠（對多數設定而言：SSH + 反向 Proxy 連接埠）。

### mDNS/Bonjour 探索

啟用內建的 `bonjour` 外掛後，閘道會透過 mDNS（`_openclaw-gw._tcp`，連接埠 5353）廣播其存在，以供本機裝置探索。完整模式包含會暴露操作細節的 TXT 記錄：`cliPath`（會揭露使用者名稱與安裝位置的檔案系統路徑）、`sshPort`（公告 SSH 可用）、`displayName`/`lanHost`（主機名稱資訊）。廣播基礎架構細節會使區域網路偵察更加容易。

- 除非需要區域網路探索，否則請停用 Bonjour——它會在 macOS 主機上自動啟動，在其他環境則需選擇啟用；直接使用閘道 URL、Tailnet、SSH 或廣域 DNS-SD 可避免本機多點傳送。
- **最小模式**（啟用 Bonjour 時的預設模式，建議用於對外暴露的閘道）會省略敏感欄位：

  ```json5
  { discovery: { mdns: { mode: "minimal" } } }
  ```

- **關閉**會抑制本機探索，同時保持外掛啟用：

  ```json5
  { discovery: { mdns: { mode: "off" } } }
  ```

- **完整模式**（選擇啟用）包含 `cliPath` + `sshPort`：

  ```json5
  { discovery: { mdns: { mode: "full" } } }
  ```

- 或者，設定 `OPENCLAW_DISABLE_BONJOUR=1`，無須變更設定即可停用 mDNS。

在最小模式下，閘道會廣播 `role`、`gatewayPort`、`transport`，但省略 `cliPath`/`sshPort`；需要命令列介面路徑的應用程式，可改為透過已驗證的 WebSocket 連線取得該路徑。

### 閘道 WebSocket 驗證

預設要求閘道驗證——若未設定任何有效的驗證途徑，閘道會拒絕 WebSocket 連線（故障時關閉）。初始設定預設會產生權杖（即使使用迴送介面也是如此），因此本機用戶端必須進行驗證。

```json5
{ gateway: { auth: { mode: "token", token: "your-token" } } }
```

`openclaw doctor --generate-gateway-token` 可以為你產生一個權杖。

<Note>
`gateway.remote.token` 和 `gateway.remote.password` 是用戶端認證資訊來源——它們本身不會保護本機 WS 存取。本機呼叫路徑僅在未設定 `gateway.auth.*` 時，才使用 `gateway.remote.*` 作為備援。如果透過 SecretRef 明確設定了 `gateway.auth.token` 或 `gateway.auth.password`，但無法解析，解析程序會以故障時關閉方式失敗（不會以遠端備援掩蓋錯誤）。
</Note>

使用 `wss://` 時，請透過 `gateway.remote.tlsFingerprint` 固定遠端 TLS。迴路、私有 IP 常值、`.local` 和 Tailnet `*.ts.net` 閘道 URL 可接受明文 `ws://`；對於其他受信任的私有 DNS 名稱，請在用戶端程序上設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作為緊急解鎖措施（僅限程序環境，不是 `openclaw.json` 鍵）。行動裝置配對以及 Android 手動／掃描的閘道路由更為嚴格：只有迴路可使用明文，而私有 LAN、鏈路本機、`.local` 和不含點的主機名稱都必須使用 TLS，除非你明確選擇使用受信任私有網路的明文路徑。

直接透過本機迴路連線時，裝置配對會自動核准（另包含一條範圍狹窄的後端／容器本機自我連線路徑，用於受信任的共用密鑰輔助程式流程）；Tailnet 和 LAN 連線（包括同一主機連至 Tailnet 位址的連線）皆視為遠端連線，仍需核准。解析出的 `tailnet` 位址，或 `custom` 位址中除 `127.0.0.1` 或 `0.0.0.0` 以外的位址，會新增一個獨立的 `127.0.0.1` 監聽器；只有連至該本機監聽器的連線才具有迴路語意。迴路要求中若有轉送標頭證據，就不符合迴路本機性的資格；中繼資料升級的自動核准範圍受到嚴格限制。請參閱[閘道配對](/zh-TW/gateway/pairing)。

驗證模式：

- `"token"`：共用持有人權杖（建議用於大多數設定）。
- `"password"`：建議透過 `OPENCLAW_GATEWAY_PASSWORD` 設定。
- `"trusted-proxy"`：信任具身分感知能力的反向代理來驗證使用者，並透過標頭傳遞身分。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

輪替檢查清單（權杖／密碼）：產生／設定新的密鑰（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_PASSWORD`）；重新啟動閘道（若由 macOS 應用程式監管閘道，則重新啟動該應用程式）；更新遠端用戶端（`gateway.remote.token`/`.password`）；確認舊認證資訊已無法使用。

### Tailscale Serve 身分標頭

當 `gateway.auth.allowTailscale` 為 `true`（Serve 的預設值）時，OpenClaw 會接受 Tailscale Serve 身分標頭 `tailscale-user-login`，用於 Control UI/WebSocket 驗證。它會透過本機 Tailscale 常駐程式（`tailscale whois`）解析 `x-forwarded-for` 位址，並將結果與標頭比對以驗證身分——只有攜帶 Tailscale 注入的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 的迴路要求才會觸發此機制。對於這項非同步檢查，同一 `{scope, ip}` 的失敗嘗試會先依序處理，之後限制器才記錄失敗，因此來自同一 Serve 用戶端的並行錯誤重試，可能立即鎖定第二次嘗試。

HTTP API 端點（`/v1/*`、`/tools/invoke`、`/api/channels/*`）不使用 Tailscale 身分標頭驗證——它們遵循閘道所設定的 HTTP 驗證模式。

閘道 HTTP 持有人驗證實際上是全有或全無的操作員存取。能夠呼叫 `/v1/chat/completions`、`/v1/responses`、`/api/v1/admin/rpc` 等外掛路由或 `/api/channels/*` 的認證資訊，都是該閘道的完整存取操作員密鑰：共用密鑰持有人驗證會還原完整的預設操作員範圍（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）以及代理執行回合的擁有者語意，而較窄的 `x-openclaw-scopes` 值不會縮減該共用密鑰路徑。只有當要求來自帶有身分的模式（受信任代理驗證）或明確無驗證的私有入口時，個別要求範圍語意才適用；在這些模式中，省略 `x-openclaw-scopes` 時會退回一般的操作員預設範圍集合，而在縮窄範圍時，`x-openclaw-model` 等擁有者層級標頭需要 `operator.admin`。`/tools/invoke` 和 HTTP 工作階段歷程記錄端點遵循相同的共用密鑰規則。請勿與不受信任的呼叫端共用這些認證資訊；建議為每個信任邊界使用獨立閘道。

無權杖 Serve 驗證假設閘道主機本身可信任——它無法防範同一主機上的惡意程序。如果閘道主機上可能執行不受信任的本機程式碼，請停用 `allowTailscale`，並要求明確的共用密鑰驗證（`token` 或 `password`）。

請勿從你自己的反向代理轉送這些標頭。如果你在閘道前方終止 TLS 或設定代理，請停用 `allowTailscale`，改用共用密鑰驗證或[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 和 [Web 概觀](/zh-TW/web)。

### 反向代理設定

在 nginx/Caddy/Traefik 等反向代理後方，請設定 `gateway.trustedProxies`，以正確處理轉送的用戶端 IP。當閘道從**不在** `trustedProxies` 中的位址偵測到代理標頭時，不會將該連線視為本機連線；如果已停用閘道驗證，則會拒絕該連線。這可避免代理連線看似來自 localhost，因而自動獲得信任。

`trustedProxies` 也會提供給更嚴格的 `gateway.auth.mode: "trusted-proxy"`：預設情況下，對來源為迴路的代理採取失敗時關閉。相同主機上的迴路反向代理可以使用 `trustedProxies` 來偵測本機用戶端及處理轉送 IP，但只有在 `gateway.auth.trustedProxy.allowLoopback = true` 時才能滿足 `trusted-proxy` 驗證模式；否則請使用權杖／密碼驗證。

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # 反向代理 IP
  allowRealIpFallback: false # 預設為 false；僅在代理無法提供 X-Forwarded-For 時啟用
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

設定 `trustedProxies` 後，閘道會使用 `X-Forwarded-For` 判斷用戶端 IP；除非明確設定 `gateway.allowRealIpFallback: true`，否則會忽略 `X-Real-IP`。請確保代理會**覆寫** `X-Forwarded-For`/`X-Real-IP`，而不是附加至其中：

```nginx
# 正確
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;

# 錯誤：保留／附加由不受信任用戶端提供的值
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

受信任代理標頭不會讓節點裝置配對自動獲得信任——`gateway.nodes.pairing.autoApproveCidrs` 是另一項預設停用的操作員原則；即使已啟用迴路受信任代理驗證，來源為迴路的受信任代理標頭路徑仍不會納入節點自動核准（因為本機呼叫端可以偽造這些標頭）。

### HSTS 與來源注意事項

- OpenClaw 的閘道優先供本機／迴路使用。如果你在反向代理終止 TLS，請在該處設定 HSTS。
- 如果由閘道本身終止 HTTPS，`gateway.http.securityHeaders.strictTransportSecurity` 會在 OpenClaw 回應中發出 HSTS 標頭。
- 非迴路 Control UI 部署預設需要 `gateway.controlUi.allowedOrigins`；`allowedOrigins: ["*"]` 是明確允許全部的原則，不是強化安全性的預設值——除非在嚴格控管的本機測試環境中，否則請避免使用。
- 即使已啟用一般迴路豁免，迴路上的瀏覽器來源驗證失敗仍會受到速率限制，但鎖定鍵會依每個正規化的 `Origin` 值劃分範圍，而不是使用單一共用的 localhost 儲存區。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用 Host 標頭來源後援模式；請將其視為由操作員選擇的危險原則。
- 請將 DNS 重新綁定和代理主機標頭行為視為部署強化事項；嚴格限制 `trustedProxies`，並避免將閘道直接公開至公用網際網路。
- 詳細部署指南：[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)。

### 透過 HTTP 使用 Control UI

Control UI 需要安全內容環境（HTTPS 或 localhost）才能產生裝置身分。

- `gateway.controlUi.allowInsecureAuth`：本機相容性切換開關。在 localhost 上，當頁面透過不安全的 HTTP 載入時，允許 Control UI 在沒有裝置身分的情況下進行驗證。不會略過配對檢查，也不會放寬遠端（非 localhost）的裝置身分要求。建議使用 HTTPS（Tailscale Serve），或在 `127.0.0.1` 開啟 UI。
- `gateway.controlUi.dangerouslyDisableDeviceAuth`：僅限緊急解鎖使用，會完全停用裝置身分檢查。這會嚴重降低安全性；除非正在主動偵錯且能迅速還原，否則請保持關閉。
- 除了這些旗標外，成功的 `gateway.auth.mode: "trusted-proxy"` 可在沒有裝置身分的情況下允許**操作員** Control UI 工作階段——這是刻意設計的驗證模式行為，不是 `allowInsecureAuth` 捷徑，也不適用於節點角色的 Control UI 工作階段。

啟用 `allowInsecureAuth` 時，`openclaw security audit` 會發出警告。

### 不安全／危險旗標

`openclaw security audit` 會針對每個已啟用且已知不安全／危險的偵錯開關產生 `config.insecure_or_dangerous_flags`（每個旗標一項發現）。在正式環境中請勿設定這些旗標。如果已設定稽核抑制，即使相符的發現移至 `suppressedFindings`，`security.audit.suppressions.active` 仍會保留在使用中輸出內。

<AccordionGroup>
  <Accordion title="目前稽核追蹤的旗標">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="設定結構描述中的所有 dangerous*/dangerously* 鍵">
    Control UI 與瀏覽器：
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    頻道名稱比對（內建與外掛頻道；適用時也包括各個 `accounts.<accountId>`）：
    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.irc.dangerouslyAllowNameMatching`（外掛頻道）
    - `channels.mattermost.dangerouslyAllowNameMatching`（外掛頻道）
    - `channels.synology-chat.dangerouslyAllowNameMatching`（外掛頻道）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（外掛頻道）
    - `channels.zalouser.dangerouslyAllowNameMatching`（外掛頻道）

    網路公開：
    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（也可依帳號設定）

    沙箱 Docker（預設值與各代理設定）：
    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## 部署與主機信任

- 閘道主機應啟用全磁碟加密；若主機為共用環境，建議為閘道使用專用的作業系統使用者帳號。
- 已發布套件的相依套件鎖定：原始碼簽出版本使用 `pnpm-lock.yaml`；已發布的 `openclaw` npm 套件與 OpenClaw 擁有的 npm 外掛套件包含 `npm-shrinkwrap.json`，因此安裝時會使用發布版本中經審查的遞移相依套件關係圖，而不是在安裝時重新解析新的關係圖。這是供應鏈強化與發布可重現性的邊界，而非沙箱——請參閱 [npm shrinkwrap](/zh-TW/gateway/security/shrinkwrap)。
- 安全檔案作業：OpenClaw 使用 `@openclaw/fs-safe` 進行限制於根目錄範圍內的檔案存取、原子寫入、封存檔解壓縮、暫存工作區，以及機密檔案輔助操作。選用的 POSIX Python 輔助程式預設為**關閉**；只有在你需要額外強化相對於檔案描述元的變更操作，且能支援 Python 執行環境時，才設定 `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` 或 `require`。詳細資訊：[安全檔案作業](/zh-TW/gateway/security/secure-file-operations)。
- 共用 Slack 工作區的風險：如果 Slack 中的所有人都能傳訊息給機器人，核心風險在於委派的工具權限——任何獲允許的傳送者都能在代理程式的原則範圍內觸發工具呼叫（`exec`、瀏覽器、網路／檔案工具），來自某位傳送者的提示詞／內容注入可能影響共用的狀態、裝置及輸出；如果共用代理程式具有敏感的認證資訊或檔案，任何獲允許的傳送者都可能透過工具使用來促使資料外洩。團隊工作流程應使用各自獨立、僅配備必要工具的代理程式／閘道；處理個人資料的代理程式應保持私密。
- 公司共用代理程式（可接受的模式）：如果代理程式的所有使用者都處於相同的信任邊界內（例如同一公司的團隊），且代理程式嚴格限定於業務用途，便可採用此模式。請在專用機器／虛擬機器／容器上執行，使用專用的作業系統使用者、專用瀏覽器／設定檔／帳號，且不要在該執行環境中登入個人 Apple／Google 帳號，或使用個人密碼管理器／瀏覽器設定檔。在同一執行環境中混用個人與公司身分，會破壞彼此的隔離，並增加個人資料暴露的風險。

## 磁碟上的機密資料

請假設 `~/.openclaw/`（或 `$OPENCLAW_STATE_DIR/`）下的任何內容都可能包含機密資料或私人資料：

| 路徑                                           | 內容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.json`                                | 設定可能包含權杖（閘道、遠端閘道）、提供者設定及允許清單。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `credentials/**`                               | 頻道認證資訊（例如 WhatsApp 認證資訊）、配對允許清單、舊版 OAuth 匯入資料。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `state/openclaw.sqlite`                        | 共用執行階段狀態，包括原生 MCP OAuth 存取／重新整理權杖、動態用戶端註冊密鑰及探索狀態。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | 每個代理程式的執行階段狀態，包括模型驗證設定檔。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `agents/<agentId>/agent/auth-profiles.json`    | 舊版模型驗證遷移來源；doctor 會將支援的記錄匯入每個代理程式的 SQLite 資料庫。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `agents/<agentId>/agent/codex-home/**`         | 每個代理程式的 Codex 應用程式伺服器帳號、設定、Skills、外掛、原生執行緒狀態及診斷資料（預設）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `$CODEX_HOME/**` 或 `~/.codex/**`              | 原生 Codex 執行階段狀態。一般控制框架僅在明確指定 `plugins.entries.codex.config.appServer.homeScope: "user"` 時存取。當個別監督連線解析後的主目錄範圍為 `"user"` 時，該連線會存取此狀態；若未設定，這是 stdio 或 Unix 的預設值。包含原生 Codex 帳號、設定、外掛及執行緒儲存區。監督功能會列出來源中繼資料，並在該連線上保留續接 Chat 的標準原生分支及後續對話；建立分支時，會將有限範圍的持久化使用者與助理歷史記錄複製到已驗證且鎖定模型的 OpenClaw Chat。僅限由擁有者控制的閘道啟用。請參閱 [Codex 控制框架](/zh-TW/plugins/codex-harness#share-threads-with-codex-desktop-and-cli)及 [Codex 監督](/zh-TW/plugins/codex-supervision)。 |
| `secrets.json`（選用）                      | 由 `file` SecretRef 提供者（`secrets.providers`）使用的檔案型密鑰承載資料。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `agents/<agentId>/agent/auth.json`             | 舊版相容性檔案；發現靜態 `api_key` 項目時會將其清除。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | 每個代理程式的執行階段狀態，包括可能含有私人訊息及工具輸出的工作階段資料列與逐字記錄。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `agents/<agentId>/sessions/**`                 | 舊版工作階段遷移來源及封存資料，其中可能包含私人訊息與工具輸出。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 隨附的外掛套件                        | 已安裝的外掛（及其 `node_modules/`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sandboxes/**`                                 | 工具沙箱工作區；可能會累積在沙箱內讀取／寫入之檔案的副本。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### 認證資訊儲存位置對照表

也有助於備份決策：

- WhatsApp：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Telegram 機器人權杖：設定／環境變數或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結）
- Discord 機器人權杖：設定／環境變數或 SecretRef（env/file/exec 提供者）
- Slack 權杖：設定／環境變數（`channels.slack.*`）
- 配對允許清單：`~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）／`<channel>-<accountId>-allowFrom.json`（非預設帳號）
- 模型驗證設定檔：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`（`auth_profile_store`）
- MCP OAuth 工作階段：`~/.openclaw/state/openclaw.sqlite`（`mcp_oauth_stores`）
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

強化措施：嚴格限制權限（目錄使用 `700`，檔案使用 `600`）；在閘道主機上使用全磁碟加密；若主機為共用環境，建議使用專用的作業系統使用者帳號。

### 檔案權限

- `~/.openclaw/openclaw.json`：`600`（僅限使用者讀取／寫入）
- `~/.openclaw`：`700`（僅限使用者）

`openclaw doctor` 可以發出警告，並提供收緊這些權限的選項。

### 工作區 `.env` 檔案

OpenClaw 會為代理程式和工具載入工作區本機的 `.env` 檔案，但絕不允許這些檔案在未明示的情況下覆寫閘道執行階段控制項：

- 不受信任的工作區 `.env` 檔案不得設定提供者認證資訊環境變數，例如 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`，以及已安裝之受信任外掛所宣告的提供者驗證金鑰。請改將提供者認證資訊放在閘道程序環境、`~/.openclaw/.env`（`$OPENCLAW_STATE_DIR/.env`）、設定的 `env` 區塊，或選用的登入殼層匯入中。
- 任何以 `OPENCLAW_` 開頭的金鑰，都不得出現在不受信任的工作區 `.env` 檔案中。這會保留整個執行階段命名空間，讓未來的 `OPENCLAW_*` 控制項預設採取失敗關閉，而不會在未明示的情況下繼承簽入版本控制或攻擊者提供的 `.env` 內容。
- 工作區 `.env` 也不得覆寫頻道與提供者的端點路由設定（例如 `MATRIX_HOMESERVER`、`MATTERMOST_URL`、`IRC_HOST`、`SYNOLOGY_CHAT_INCOMING_URL`、`AZURE_SPEECH_ENDPOINT`，以及其他以 `_ENDPOINT` 結尾的金鑰），因此複製的工作區無法透過本機端點設定重新導向內建連接器流量。這些設定必須來自閘道程序環境、全域執行階段 dotenv、明確設定或 `env.shellEnv`。
- 受信任的程序／作業系統環境變數、全域執行階段 dotenv、設定 `env`，以及已啟用的登入殼層匯入仍然有效；此限制僅約束工作區 `.env` 檔案的載入。

工作區 `.env` 檔案經常與代理程式程式碼放在一起、意外提交至版本控制，或由工具寫入；封鎖提供者認證資訊可防止複製的工作區替換成攻擊者控制的提供者帳號。

### 記錄與逐字記錄

OpenClaw 會將工作階段逐字記錄儲存在磁碟的 `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 下，以維持工作階段連續性並支援選用的記憶索引；任何具備檔案系統存取權的程序／使用者都能讀取這些記錄。請將磁碟存取視為信任邊界，並嚴格限制 `~/.openclaw` 的權限；若需要更強的隔離，請讓代理程式使用不同的作業系統使用者或主機執行。

閘道記錄可能包含工具摘要、錯誤和 URL；工作階段逐字記錄可能包含貼上的密鑰、檔案內容、命令輸出和連結。

- 保持啟用記錄／逐字記錄遮蔽（`logging.redactSensitive: "tools"`，預設值）。
- 透過 `logging.redactPatterns` 新增適用於你的環境的自訂模式（權杖、主機名稱、內部 URL）。
- 分享診斷資訊時，建議使用 `openclaw status --all`（可直接貼上，且已遮蔽密鑰），而非原始記錄。
- 若不需要長期保留，請清除舊的工作階段逐字記錄與記錄檔。

詳細資訊：[記錄](/zh-TW/gateway/logging)

## 安全基準（複製／貼上）

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

這會讓閘道保持私有、要求私訊配對，並避免群組機器人持續啟用。若也要讓工具執行更安全，請為任何非擁有者代理程式新增沙箱並拒絕危險工具（請參閱上方的「各代理程式存取設定檔」）。

### 使用不同號碼（WhatsApp、Signal、Telegram）

對於以電話號碼為基礎的頻道，請考慮讓助理使用與個人號碼不同的號碼，使私人對話保持私密，並讓機器人號碼在自身的邊界內處理自動化。

## 事件回應

### 控制影響範圍

1. 停止服務：停止 macOS 應用程式（若由其監管閘道），或終止你的 `openclaw gateway` 程序。
2. 關閉對外暴露：在釐清事件之前，設定 `gateway.bind: "loopback"`（或停用 Tailscale Funnel/Serve）。
3. 凍結存取：將高風險私訊／群組切換為 `dmPolicy: "disabled"`／要求提及，並移除所有 `"*"` 全部允許項目。

### 輪替（若密鑰洩漏，請假設已遭入侵）

1. 輪替閘道驗證資訊（`gateway.auth.token`／`OPENCLAW_GATEWAY_PASSWORD`）並重新啟動。
2. 在任何能呼叫閘道的機器上輪替遠端用戶端密鑰（`gateway.remote.token`／`.password`）。
3. 輪替提供者／API 認證資訊（WhatsApp 認證資訊、Slack／Discord 權杖、`auth-profiles.json` 中的模型／API 金鑰，以及使用加密密鑰承載資料時其中的值）。

### 稽核

1. 檢查閘道記錄：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`）。
2. 檢閱相關逐字記錄：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 檢閱近期可能擴大存取範圍的設定變更：`gateway.bind`、`gateway.auth`、私訊／群組政策、`tools.elevated`、外掛變更。
4. 重新執行 `openclaw security audit --deep`，並確認嚴重發現均已解決。

### 蒐集報告資料

- 時間戳記、閘道主機作業系統與 OpenClaw 版本。
- 工作階段逐字記錄，以及一小段記錄尾端內容（經遮蔽後）。
- 攻擊者傳送了什麼，以及代理程式執行了什麼操作。
- 閘道是否暴露於回送介面以外（區域網路／Tailscale Funnel/Serve）。

## 密鑰掃描

CI 會對儲存庫執行 pre-commit 的 `detect-private-key` 鉤點。如果失敗，請移除或輪替已提交的金鑰資料，然後在本機重現：

```bash
pre-commit run --all-files detect-private-key
```

## 回報安全性問題

發現 OpenClaw 的漏洞嗎？請以負責任的方式回報：

1. 電子郵件：[security@openclaw.ai](mailto:security@openclaw.ai)
2. 在修正之前，請勿公開發布。
3. 我們會列名致謝（除非你希望保持匿名）。
