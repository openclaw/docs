---
read_when:
    - 設定 Signal 支援
    - 偵錯 Signal 的傳送與接收
summary: 透過 signal-cli（原生常駐程式或 bbernhard 容器）支援 Signal、設定路徑與號碼模型
title: Signal
x-i18n:
    generated_at: "2026-07-14T13:29:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f4702a4bea94e28326892e9c12223fb768166470da3c3627209403d6231188d
    source_path: channels/signal.md
    workflow: 16
---

Signal 是可下載的頻道外掛（`@openclaw/signal`）。閘道透過 HTTP 與 `signal-cli` 通訊：可使用原生守護程序（JSON-RPC + SSE），或 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) 容器（REST + WebSocket）。OpenClaw 不內嵌 libsignal。

## 號碼模型（請先閱讀）

- 閘道會連線至一部 **Signal 裝置**：即 `signal-cli` 帳號。
- 在**你的個人 Signal 帳號**上執行機器人，會使其忽略你自己的訊息（迴圈保護）。
- 若要實現「我傳訊息給機器人，它便回覆」，請使用**獨立的機器人號碼**。

## 安裝

```bash
openclaw plugins install @openclaw/signal
```

未指定來源的外掛規格會先嘗試 ClawHub，再以 npm 作為備援。使用 `openclaw plugins install clawhub:@openclaw/signal` 或 `npm:@openclaw/signal` 強制指定來源。`plugins install` 會註冊並啟用外掛；不需要另外執行 `enable` 步驟。一般安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 快速設定

<Steps>
  <Step title="選擇號碼">
    請為機器人使用**獨立的 Signal 號碼**（建議）。
  </Step>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="執行引導式設定">
    ```bash
    openclaw channels add
    ```
    精靈會偵測 `signal-cli` 是否位於 `PATH`；若不存在，便會提供安裝選項：在 Linux x86-64 上下載官方原生 GraalVM 組建，或在 macOS 與其他架構上透過 Homebrew 安裝。接著會提示輸入機器人號碼與 `signal-cli` 路徑。
  </Step>
  <Step title="連結或註冊帳號">
    - **QR 連結（最快）：**`signal-cli link -n "OpenClaw"`，接著使用 Signal 掃描。請參閱[路徑 A](#setup-path-a-link-existing-signal-account-qr)。
    - **SMS 註冊：**使用具備驗證碼與 SMS 驗證的專用號碼。請參閱[路徑 B](#setup-path-b-register-dedicated-bot-number-sms-linux)。

  </Step>
  <Step title="驗證並配對">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    傳送第一則私訊並核准配對：`openclaw pairing approve signal <CODE>`。
  </Step>
</Steps>

最小設定：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| 欄位        | 說明                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 格式的機器人電話號碼（`+15551234567`） |
| `cliPath`    | `signal-cli` 的路徑（若位於 `PATH`，則為 `signal-cli`）  |
| `configPath` | 以 `--config` 傳入的 signal-cli 設定目錄        |
| `dmPolicy`   | 私訊存取原則（建議使用 `pairing`）          |
| `allowFrom`  | 允許傳送私訊的電話號碼或 `uuid:<id>` 值 |

多帳號支援：使用 `channels.signal.accounts` 設定各帳號，並可選擇設定 `name`。共用模式請參閱[多帳號頻道](/zh-TW/gateway/config-channels#multi-account-all-channels)。

## 功能說明

- 確定性路由：回覆一律傳回 Signal。
- 私訊共用代理程式的主要工作階段；群組則彼此隔離（`agent:<agentId>:signal:group:<groupId>`）。
- Signal 預設可以寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。使用 `channels.signal.configWrites: false` 停用。

## 設定路徑 A：連結現有 Signal 帳號（QR）

1. 安裝 `signal-cli`（JVM 或原生組建），或讓 `openclaw channels add` 為你安裝。
2. 連結機器人帳號：`signal-cli link -n "OpenClaw"`，接著在 Signal 中掃描 QR 碼。
3. 設定 Signal 並啟動閘道。

## 設定路徑 B：註冊專用機器人號碼（SMS、Linux）

若要使用專用機器人號碼，而不是連結現有的 Signal 應用程式帳號，請使用此方法。以下流程已在 Ubuntu 24 上測試。

1. 取得可接收 SMS 的號碼（市話則可使用語音驗證）。專用機器人號碼可避免帳號或工作階段衝突。
2. 在閘道主機上安裝 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

若使用 JVM 組建（`signal-cli-${VERSION}.tar.gz`），請先安裝 JRE。請保持 `signal-cli` 為最新版本；上游指出，隨著 Signal 伺服器 API 變更，舊版可能會失效。

3. 註冊並驗證號碼：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

若需要驗證碼（此步驟需要瀏覽器存取）：

1. 開啟 `https://signalcaptchas.org/registration/generate.html`。
2. 完成驗證碼，並從 "Open Signal" 複製 `signalcaptcha://...` 連結目標。
3. 可以的話，請從與瀏覽器工作階段相同的外部 IP 執行（驗證碼權杖很快就會過期）。
4. 立即註冊並驗證：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 設定 OpenClaw、重新啟動閘道，並驗證頻道：

```bash
# 如果你以使用者 systemd 服務執行閘道：
systemctl --user restart openclaw-gateway.service

# 接著驗證：
openclaw doctor
openclaw channels status --probe
```

5. 配對你的私訊傳送者：
   - 傳送任意訊息至機器人號碼。
   - 在伺服器上核准：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 將機器人號碼儲存為手機聯絡人，以免顯示 "Unknown contact"。

<Warning>
使用 `signal-cli` 註冊電話號碼帳號，可能會使該號碼的主要 Signal 應用程式工作階段取消驗證。建議使用專用機器人號碼，或使用 QR 連結模式保留現有的手機應用程式設定。
</Warning>

上游參考資料：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 驗證碼流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 連結流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守護程序模式（httpUrl）

若要自行管理 `signal-cli`（JVM 冷啟動緩慢、容器初始化、共用 CPU），請另外執行守護程序，並將 OpenClaw 指向該程序：

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

這會略過自動產生程序及 OpenClaw 的啟動等待。若自動產生程序的啟動速度較慢，請設定 `channels.signal.startupTimeoutMs`。

## 容器模式（bbernhard/signal-cli-rest-api）

除了以原生方式執行 `signal-cli`，也可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 容器；此容器會將 `signal-cli` 包裝在 REST + WebSocket 介面之後。

需求：

- 容器**必須**以 `MODE=json-rpc` 執行，才能即時接收訊息。
- 連線至 OpenClaw 前，請先在容器內註冊或連結你的 Signal 帳號。

`docker-compose.yml` 服務範例：

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw 設定：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // 或使用 "auto" 自動偵測
    },
  },
}
```

`apiMode` 控制 OpenClaw 使用的通訊協定：

| 值         | 行為                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （預設）探測兩種傳輸方式；串流會驗證容器的 WebSocket 接收功能    |
| `"native"`    | 強制使用原生 signal-cli（`/api/v1/rpc` 上的 JSON-RPC、`/api/v1/events` 上的 SSE）         |
| `"container"` | 強制使用 bbernhard 容器（`/v2/send` 上的 REST、`/v1/receive/{account}` 上的 WebSocket） |

當 `apiMode` 為 `"auto"` 時，OpenClaw 會依每個守護程序 URL 快取偵測到的模式 30 秒，以避免重複探測（兩種傳輸方式都正常時，以原生模式優先）。只有在 `/v1/receive/{account}` 升級為 WebSocket 後，串流才會選用容器接收；這需要 `MODE=json-rpc`。

只要容器公開相符的 API，容器模式便支援與原生模式相同的 Signal 操作：傳送、接收、附件、輸入狀態指示、已讀／已檢視回條、回應、群組及樣式化文字。OpenClaw 會將原生 Signal RPC 呼叫轉換為容器的 REST 承載資料，包括 `group.{base64(internal_id)}` 群組 ID 與用於格式化文字的 `text_mode: "styled"`。

操作注意事項：

- 在容器模式中使用 `autoStart: false`；選取 `apiMode: "container"` 時，OpenClaw 不應產生原生守護程序。
- 使用 `MODE=json-rpc` 接收訊息。`MODE=normal` 可能使 `/v1/about` 看似正常，但 `/v1/receive/{account}` 不會升級至 WebSocket，因此 OpenClaw 不會在 `auto` 模式中選取容器接收串流。
- 當 `httpUrl` 指向 bbernhard REST API 時，請設定 `apiMode: "container"`；指向原生 `signal-cli` JSON-RPC/SSE 時，請設定 `"native"`；部署方式可能不同時，則設定 `"auto"`。
- 容器附件下載會遵守與原生模式相同的媒體位元組限制。伺服器傳送 `Content-Length` 時，過大的回應會在完整緩衝前遭拒絕；否則會在串流期間拒絕。

## 存取控制（私訊與群組）

私訊：

- 預設：`channels.signal.dmPolicy = "pairing"`。
- 未知傳送者會收到配對碼；核准前會忽略其訊息（配對碼將於 1 小時後過期）。
- 透過 `openclaw pairing list signal` 與 `openclaw pairing approve signal <CODE>` 核准。
- 配對是 Signal 私訊的預設權杖交換方式。詳細資訊請參閱：[配對](/zh-TW/channels/pairing)
- 僅有 UUID 的傳送者（來自 `sourceUuid`）會以 `uuid:<id>` 儲存在 `channels.signal.allowFrom` 中。

群組：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 設定 `allowlist` 時，`channels.signal.groupAllowFrom` 控制哪些群組或傳送者可以觸發群組回覆；項目可以是 Signal 群組 ID（原始格式、`group:<id>` 或 `signal:group:<id>`）、傳送者電話號碼、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可透過 `requireMention`、`tools` 與 `toolsBySender` 覆寫群組行為。
- 在多帳號設定中，使用 `channels.signal.accounts.<id>.groups` 進行各帳號的覆寫。
- 透過 `groupAllowFrom` 將 Signal 群組加入允許清單，本身不會停用提及閘控。除非設定 `requireMention=true`，否則明確設定的 `channels.signal.groups["<group-id>"]` 項目會處理每一則群組訊息。
- 使用 `requireMention=true` 時，會根據結構化提及中繼資料，將 Signal 原生 @提及與機器人帳號的電話號碼或 `accountUuid` 比對。已設定的 `mentionPatterns` 仍會作為純文字備援。
- 執行階段注意事項：若完全缺少 `channels.signal`，執行階段會回退使用 `groupPolicy="allowlist"` 進行群組檢查（即使已設定 `channels.defaults.groupPolicy`）。

具有限定上下文的提及閘控群組：

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

允許的群組訊息若未提及機器人，系統會保持靜默，並僅將這些訊息保留在有界的待處理歷史記錄視窗中。之後原生 @提及或備援文字提及觸發機器人時，OpenClaw 會納入近期情境並回覆至同一群組。系統不會下載略過的附件內容；這些附件可能只會以精簡的媒體預留位置出現在待處理情境中。

## 運作方式（行為）

- 原生模式：`signal-cli` 以常駐程式執行；閘道透過 SSE 讀取事件。
- 容器模式：閘道透過 REST API 傳送，並透過 WebSocket 接收。
- 傳入訊息會正規化為共用的頻道封套。
- 回覆一律路由回相同的號碼或群組。
- 當後端接受傳入訊息的時間戳記與作者時，對傳入訊息的回覆會包含原生 Signal 引用中繼資料；若引用中繼資料缺失或遭拒，OpenClaw 會將回覆作為一般訊息傳送。
- 使用 `channels.signal.replyToMode = off | first | all | batched` 設定原生引用方式，或使用 `channels.signal.replyToModeByChatType.direct/group` 依聊天類型覆寫。`channels.signal.accounts.<id>` 下的帳號層級值優先適用。

## 媒體與限制

- 傳出文字會依 `channels.signal.textChunkLimit` 分段（預設為 4000）。
- 選用換行分段：設定 `channels.signal.streaming.chunkMode="newline"`，先依空白行（段落邊界）分割，再依長度分段。
- 支援附件（從 `signal-cli` 擷取 base64）。
- 當 `contentType` 缺失時，語音備忘錄附件會使用 `signal-cli` 檔名作為 MIME 備援，讓音訊轉錄仍可辨識 AAC 語音備忘錄。
- 預設媒體上限：`channels.signal.mediaMaxMb`（預設為 8）。
- 使用 `channels.signal.ignoreAttachments` 略過媒體下載。
- 群組歷史情境使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），並以 `messages.groupChat.historyLimit` 作為備援。設定 `0` 可停用（預設為 50）。

## 輸入狀態與已讀回條

- **輸入狀態指示器**：OpenClaw 透過 `signal-cli sendTyping` 傳送輸入狀態訊號，並在回覆執行期間持續重新整理。
- **已讀回條**：當 `channels.signal.sendReadReceipts` 為 true 時，OpenClaw 會轉送允許之私訊的已讀回條。
- `signal-cli` 不會提供群組的已讀回條。

## 生命週期狀態反應

設定 `messages.statusReactions.enabled: true`，讓 Signal 在傳入回合中顯示共用的已排入佇列／思考中／工具／壓縮／完成／錯誤反應生命週期。Signal 使用傳入訊息的時間戳記作為反應目標；群組反應會使用 Signal 群組 ID，並以原始傳送者作為目標作者來傳送。

狀態反應也需要確認反應，以及相符的 `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions` 或 `all`）。設定 `channels.signal.reactionLevel: "off"` 可停用 Signal 狀態反應。

`messages.removeAckAfterReply: true` 會在設定的保留時間後清除最終狀態反應。否則，Signal 會在最終完成／錯誤狀態後還原初始確認反應。

## 反應（訊息工具）

搭配 `channel=signal` 使用 `message action=react`。

- 目標：傳送者的 E.164 或 UUID（使用配對輸出中的 `uuid:<id>`；單獨使用 UUID 也可）。
- `messageId` 是要回應之訊息的 Signal 時間戳記。
- 群組反應需要 `targetAuthor` 或 `targetAuthorUuid`。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定：

- `channels.signal.actions.reactions`：啟用／停用反應動作（預設為 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（預設為 `minimal`）。
  - `off`/`ack` 會停用代理程式反應（訊息工具 `react` 會發生錯誤）。
  - `minimal`/`extensive` 會啟用代理程式反應並設定指引層級。
- 各帳號覆寫：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 核准反應

Signal 的 exec 與外掛核准提示使用頂層 `approvals.exec` 和 `approvals.plugin` 路由區塊。Signal 沒有 `channels.signal.execApprovals` 區塊。

- `👍` 核准一次。
- `👎` 拒絕。
- 當要求提供持續核准選項時，使用 `/approve <id> allow-always`。

核准反應的解析需要來自 `channels.signal.allowFrom`、`channels.signal.defaultTo` 或相符帳號層級欄位的明確 Signal 核准者。相同聊天中的直接 exec 核准提示，即使沒有明確核准者，仍可隱藏重複的本機 `/approve` 備援；沒有核准者的群組核准會保持顯示本機備援。

## 傳送目標（命令列介面／排程）

- 私訊：`signal:+15551234567`（或純 E.164）。
- UUID 私訊：`uuid:<id>`（或單獨的 UUID）。
- 群組：`signal:group:<groupId>`。
- 使用者名稱：`username:<name>`（若你的 Signal 帳號支援）。

## 別名

為經常使用的 Signal 目標設定別名，以使用穩定的名稱。別名僅為 OpenClaw 端的設定；不會建立或編輯 Signal 聯絡人。

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

可在任何接受 Signal 傳送目標的位置使用別名：

```bash
openclaw message send --channel signal --target signal:ops --message "部署已完成"
```

各帳號別名會繼承頂層別名，並可新增或覆寫名稱：

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` 和 `openclaw directory groups list --channel signal` 會列出已設定的別名。Signal 目錄以設定為基礎；它不會即時查詢 Signal 聯絡人，也不會修改 Signal 帳號。

## 疑難排解

先依序執行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

接著視需要確認私訊配對狀態：

```bash
openclaw pairing list signal
```

常見失敗：

- 常駐程式可連線但沒有回覆：確認帳號／常駐程式設定（`httpUrl`、`account`）與接收模式。
- 私訊遭忽略：傳送者正在等待配對核准。
- 群組訊息遭忽略：群組傳送者／提及閘控阻擋了傳送。
- 編輯後發生設定驗證錯誤：執行 `openclaw doctor --fix`。
- 診斷中缺少 Signal：確認 `channels.signal.enabled: true`。

其他檢查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分流處理流程請參閱：[頻道疑難排解](/zh-TW/channels/troubleshooting)。

## 安全性注意事項

- `signal-cli` 會在本機儲存帳號金鑰（通常位於 `~/.local/share/signal-cli/data/`）。
- 在遷移或重建伺服器前，請備份 Signal 帳號狀態。
- 除非你明確希望擴大私訊存取範圍，否則請保留 `channels.signal.dmPolicy: "pairing"`。
- 只有註冊或復原流程需要 SMS 驗證，但若失去對該號碼／帳號的控制權，重新註冊可能會更複雜。

## 設定參考（Signal）

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.signal.enabled`：啟用／停用頻道啟動。
- `channels.signal.apiMode`：`auto | native | container`（預設：自動）。請參閱[容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：機器人帳號的 E.164。
- `channels.signal.accountUuid`：選用的機器人帳號 UUID，用於原生 @提及偵測與迴圈防護。
- `channels.signal.cliPath`：`signal-cli` 的路徑。
- `channels.signal.configPath`：選用的 `signal-cli --config` 目錄。
- `channels.signal.httpUrl`：完整常駐程式 URL（覆寫主機／連接埠）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：常駐程式繫結（預設為 `127.0.0.1:8080`）。
- `channels.signal.autoStart`：自動產生常駐程式（若未設定 `httpUrl`，預設為 true）。
- `channels.signal.startupTimeoutMs`：啟動等待逾時，單位為 ms（最小值 1000、上限 120000；預設為 30000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：略過附件下載。
- `channels.signal.ignoreStories`：忽略來自常駐程式的限時動態。
- `channels.signal.sendReadReceipts`：轉送已讀回條。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（預設：配對）。
- `channels.signal.allowFrom`：私訊允許清單（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 沒有使用者名稱；請使用電話號碼／UUID ID。
- `channels.signal.aliases`：OpenClaw 端用於私訊或群組傳送目標的別名。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（預設：允許清單）。
- `channels.signal.groupAllowFrom`：群組允許清單；接受 Signal 群組 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、傳送者的 E.164 號碼或 `uuid:<id>` 值。
- `channels.signal.groups`：以 Signal 群組 ID（或 `"*"`）為鍵的各群組覆寫。支援的欄位：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多帳號設定中 `channels.signal.groups` 的各帳號版本。
- `channels.signal.accounts.<id>.aliases`：各帳號別名，會與頂層別名合併。
- `channels.signal.replyToMode`：原生回覆引用模式，`off | first | all | batched`（預設：`all`）。
- `channels.signal.replyToModeByChatType.direct`、`channels.signal.replyToModeByChatType.group`：依聊天類型覆寫原生回覆引用。
- `channels.signal.accounts.<id>.replyToMode`、`channels.signal.accounts.<id>.replyToModeByChatType.direct`、`channels.signal.accounts.<id>.replyToModeByChatType.group`：各帳號回覆引用覆寫。
- `channels.signal.historyLimit`：作為情境納入的群組訊息數量上限（0 表示停用）。
- `channels.signal.dmHistoryLimit`：以使用者回合計算的私訊歷史記錄上限。各使用者覆寫：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：傳出內容的字元分段大小（預設為 4000）。
- `channels.signal.streaming.chunkMode`：`length`（預設），或使用 `newline` 先依空白行（段落邊界）分割，再依長度分段。
- `channels.signal.mediaMaxMb`：傳入／傳出媒體上限，單位為 MB（預設為 8）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（預設為 `minimal`）。請參閱[反應](#reactions-message-tool)。
- `channels.signal.reactionNotifications`：`off | own | all | allowlist`（預設為 `own`）—代理程式收到他人傳入反應通知的時機。
- `channels.signal.reactionAllowlist`：當 `reactionNotifications: "allowlist"` 時，其反應會通知代理程式的傳送者。
- `channels.signal.streaming.block.enabled`、`channels.signal.streaming.block.coalesce`：跨頻道共用的區塊模式串流控制項。請參閱[串流](/zh-TW/concepts/streaming)。

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（純文字備援；設定機器人帳號身分後，會從結構化中繼資料偵測 Signal 原生 @提及）。
- `messages.groupChat.mentionPatterns`（全域備援）。
- `messages.responsePrefix`。

## 相關內容

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
