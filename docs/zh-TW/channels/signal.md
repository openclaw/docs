---
read_when:
    - 設定 Signal 支援
    - 偵錯 Signal 傳送/接收
summary: 透過 signal-cli（原生常駐程式或 bbernhard 容器）支援 Signal、設定路徑和號碼模型
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:19:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

狀態：外部命令列介面整合。閘道透過 HTTP 與 `signal-cli` 通訊，可以是原生 daemon（JSON-RPC + SSE），也可以是 bbernhard/signal-cli-rest-api 容器（REST + WebSocket）。

## 先決條件

- 已在你的伺服器上安裝 OpenClaw（以下 Linux 流程已在 Ubuntu 24 測試）。
- 下列其中之一：
  - 主機上可使用 `signal-cli`（原生模式），**或**
  - `bbernhard/signal-cli-rest-api` Docker 容器（容器模式）。
- 一個可接收一次驗證 SMS 的電話號碼（用於 SMS 註冊路徑）。
- 註冊期間可透過瀏覽器存取 Signal captcha（`signalcaptchas.org`）。

## 快速設定（初學者）

1. 為 Bot 使用**獨立的 Signal 號碼**（建議）。
2. 安裝 OpenClaw 外掛：

```bash
openclaw plugins install @openclaw/signal
```

3. 安裝 `signal-cli`（如果使用 JVM 建置版本，需安裝 Java）。
4. 選擇一種設定路徑：
   - **路徑 A（QR 連結）：** `signal-cli link -n "OpenClaw"`，然後用 Signal 掃描。
   - **路徑 B（SMS 註冊）：** 使用 captcha + SMS 驗證註冊專用號碼。
5. 設定 OpenClaw 並重新啟動閘道。
6. 傳送第一則私訊並核准配對（`openclaw pairing approve signal <CODE>`）。

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

欄位參考：

| 欄位         | 說明                                              |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 格式的 Bot 電話號碼（`+15551234567`）       |
| `cliPath`    | `signal-cli` 的路徑（若在 `PATH` 中則為 `signal-cli`） |
| `configPath` | 作為 `--config` 傳遞的 signal-cli 設定目錄        |
| `dmPolicy`   | 私訊存取政策（建議使用 `pairing`）                |
| `allowFrom`  | 允許傳送私訊的電話號碼或 `uuid:<id>` 值           |

## 這是什麼

- 透過 `signal-cli` 的 Signal 頻道（不是嵌入式 libsignal）。
- 確定性路由：回覆一律回到 Signal。
- 私訊共用代理的主要工作階段；群組會隔離（`agent:<agentId>:signal:group:<groupId>`）。

## 設定寫入

預設情況下，Signal 允許寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

可用以下設定停用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 號碼模型（重要）

- 閘道會連線到一個 **Signal 裝置**（`signal-cli` 帳號）。
- 如果你在**自己的個人 Signal 帳號**上執行 Bot，它會忽略你自己的訊息（迴圈保護）。
- 若要「我傳訊息給 Bot，然後它回覆」，請使用**獨立的 Bot 號碼**。

## 設定路徑 A：連結既有 Signal 帳號（QR）

1. 安裝 `signal-cli`（JVM 或原生建置）。
2. 連結 Bot 帳號：
   - `signal-cli link -n "OpenClaw"`，然後在 Signal 中掃描 QR。
3. 設定 Signal 並啟動閘道。

範例：

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

多帳號支援：使用 `channels.signal.accounts` 搭配個別帳號設定與選用的 `name`。請參閱 [`gateway/configuration`](/zh-TW/gateway/config-channels#multi-account-all-channels) 了解共用模式。

## 設定路徑 B：註冊專用 Bot 號碼（SMS，Linux）

當你想使用專用 Bot 號碼，而不是連結既有 Signal App 帳號時，請使用此方式。

1. 取得可接收 SMS 的號碼（或市話語音驗證）。
   - 使用專用 Bot 號碼可避免帳號/工作階段衝突。
2. 在閘道主機上安裝 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM 建置版本（`signal-cli-${VERSION}.tar.gz`），請先安裝 JRE 25+。
請保持 `signal-cli` 更新；上游指出，隨著 Signal 伺服器 API 變更，舊版本可能會失效。

3. 註冊並驗證號碼：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要 captcha：

1. 開啟 `https://signalcaptchas.org/registration/generate.html`。
2. 完成 captcha，從「Open Signal」複製 `signalcaptcha://...` 連結目標。
3. 可行時，請從與瀏覽器工作階段相同的外部 IP 執行。
4. 立即再次執行註冊（captcha token 很快會過期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 設定 OpenClaw、重新啟動閘道，並驗證頻道：

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. 配對你的私訊傳送者：
   - 傳送任意訊息到 Bot 號碼。
   - 在伺服器上核准代碼：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 將 Bot 號碼儲存為手機聯絡人，以避免「未知聯絡人」。

<Warning>
使用 `signal-cli` 註冊電話號碼帳號，可能會讓該號碼的主要 Signal App 工作階段取消授權。建議使用專用 Bot 號碼；如果你需要保留既有手機 App 設定，請使用 QR 連結模式。
</Warning>

上游參考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- Captcha 流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 連結流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部 daemon 模式（httpUrl）

如果你想自行管理 `signal-cli`（JVM 冷啟動較慢、容器初始化，或共用 CPU），請另外執行 daemon，並將 OpenClaw 指向它：

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

這會略過 OpenClaw 內部的自動產生程序與啟動等待。若自動產生時啟動較慢，請設定 `channels.signal.startupTimeoutMs`。

## 容器模式（bbernhard/signal-cli-rest-api）

除了原生執行 `signal-cli`，你也可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 容器。它會將 `signal-cli` 包裝在 REST API 與 WebSocket 介面後方。

需求：

- 容器**必須**以 `MODE=json-rpc` 執行，才能即時接收訊息。
- 連接 OpenClaw 前，請先在容器內註冊或連結你的 Signal 帳號。

範例 `docker-compose.yml` 服務：

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` 欄位控制 OpenClaw 使用哪個協定：

| 值            | 行為                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （預設）探測兩種傳輸；串流會驗證容器 WebSocket 接收                                  |
| `"native"`    | 強制使用原生 signal-cli（`/api/v1/rpc` 的 JSON-RPC，`/api/v1/events` 的 SSE）         |
| `"container"` | 強制使用 bbernhard 容器（`/v2/send` 的 REST，`/v1/receive/{account}` 的 WebSocket）   |

當 `apiMode` 為 `"auto"` 時，OpenClaw 會快取偵測到的模式 30 秒，以避免重複探測。只有在 `/v1/receive/{account}` 升級為 WebSocket 後，串流才會選取容器接收；這需要 `MODE=json-rpc`。

在容器公開相符 API 的情況下，容器模式支援與原生模式相同的 Signal 頻道操作：傳送、接收、附件、輸入中指示、已讀/已檢視回條、回應、群組，以及樣式化文字。OpenClaw 會將其原生 Signal RPC 呼叫轉換為容器的 REST payload，包括 `group.{base64(internal_id)}` 群組 ID，以及格式化文字使用的 `text_mode: "styled"`。

操作注意事項：

- 容器模式請使用 `autoStart: false`。選取 `apiMode: "container"` 時，OpenClaw 不應產生原生 daemon。
- 接收請使用 `MODE=json-rpc`。`MODE=normal` 可能讓 `/v1/about` 看起來正常，但 `/v1/receive/{account}` 不會升級為 WebSocket，因此 OpenClaw 在 `auto` 模式下不會選取容器接收串流。
- 當你確定 `httpUrl` 指向 bbernhard 的 REST API 時，請設定 `apiMode: "container"`。當你確定它指向原生 `signal-cli` JSON-RPC/SSE 時，請設定 `apiMode: "native"`。若部署可能有所不同，請使用 `"auto"`。
- 容器附件下載遵循與原生模式相同的媒體位元組限制。當伺服器送出 `Content-Length` 時，過大的回應會在完整緩衝前被拒絕；否則會在串流期間拒絕。

## 存取控制（私訊 + 群組）

私訊：

- 預設：`channels.signal.dmPolicy = "pairing"`。
- 未知傳送者會收到配對碼；訊息會被忽略，直到核准為止（代碼 1 小時後過期）。
- 透過以下方式核准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配對是 Signal 私訊的預設 token 交換。詳細資訊：[配對](/zh-TW/channels/pairing)
- 僅 UUID 的傳送者（來自 `sourceUuid`）會在 `channels.signal.allowFrom` 中儲存為 `uuid:<id>`。

群組：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 當設定為 `allowlist` 時，`channels.signal.groupAllowFrom` 控制哪些群組或傳送者可以觸發群組回覆；項目可以是 Signal 群組 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、傳送者電話號碼、`uuid:<id>` 值，或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可用 `requireMention`、`tools` 和 `toolsBySender` 覆寫群組行為。
- 在多帳號設定中，使用 `channels.signal.accounts.<id>.groups` 設定個別帳號覆寫。
- 透過 `groupAllowFrom` 將 Signal 群組加入允許清單，本身不會停用提及門檻。具體設定的 `channels.signal.groups["<group-id>"]` 項目會處理每一則群組訊息，除非設定 `requireMention=true`。
- 執行階段注意事項：如果完全缺少 `channels.signal`，執行階段會在群組檢查時退回 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

## 運作方式（行為）

- 原生模式：`signal-cli` 以 daemon 形式執行；閘道透過 SSE 讀取事件。
- 容器模式：閘道透過 REST API 傳送，並透過 WebSocket 接收。
- 傳入訊息會正規化為共用頻道 envelope。
- 回覆一律路由回相同號碼或群組。

## 媒體 + 限制

- 傳出文字會依 `channels.signal.textChunkLimit` 分段（預設 4000）。
- 選用換行分段：設定 `channels.signal.chunkMode="newline"`，可在長度分段前先依空白行（段落邊界）分割。
- 支援附件（從 `signal-cli` 擷取 base64）。
- 當缺少 `contentType` 時，語音備忘附件會使用 `signal-cli` 檔名作為 MIME 備援，因此音訊轉錄仍可分類 AAC 語音備忘。
- 預設媒體上限：`channels.signal.mediaMaxMb`（預設 8）。
- 使用 `channels.signal.ignoreAttachments` 可略過下載媒體。
- 群組歷史內容使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），並退回 `messages.groupChat.historyLimit`。設定 `0` 可停用（預設 50）。

## 輸入中 + 已讀回條

- **輸入指示器**：OpenClaw 透過 `signal-cli sendTyping` 傳送輸入訊號，並在回覆執行期間持續更新。
- **已讀回條**：當 `channels.signal.sendReadReceipts` 為 true 時，OpenClaw 會轉送允許私訊的已讀回條。
- Signal-cli 不會公開群組的已讀回條。

## 生命週期狀態表情回應

設定 `messages.statusReactions.enabled: true`，即可讓 Signal 在傳入回合上顯示共用的
排隊中/思考中/工具/壓縮/完成/錯誤表情回應生命週期。
Signal 會使用傳入訊息的時間戳作為表情回應目標；群組
表情回應會以 Signal 群組 id 加上原始寄件者作為
目標作者傳送。

狀態表情回應也需要一個 ack 表情回應，以及相符的
`messages.ackReactionScope`（`direct`、`group-all`、`group-mentions` 或 `all`）。
設定 `channels.signal.reactionLevel: "off"` 可停用 Signal 狀態表情回應。
訊息工具的 `react` 動作更嚴格：它需要
`reactionLevel: "minimal"` 或 `"extensive"`。

`messages.removeAckAfterReply: true` 會在設定的保留時間後清除最終狀態表情回應。
否則，Signal 會在最終完成/錯誤狀態後還原初始 ack 表情回應。

## 表情回應（訊息工具）

- 使用 `message action=react` 搭配 `channel=signal`。
- 目標：寄件者 E.164 或 UUID（使用配對輸出的 `uuid:<id>`；裸 UUID 也可）。
- `messageId` 是你要回應的訊息的 Signal 時間戳。
- 群組表情回應需要 `targetAuthor` 或 `targetAuthorUuid`。

範例：

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定：

- `channels.signal.actions.reactions`：啟用/停用表情回應動作（預設為 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 會停用 agent 表情回應（訊息工具 `react` 會出錯）。
  - `minimal`/`extensive` 會啟用 agent 表情回應並設定指引層級。
- 逐帳號覆寫：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 核准表情回應

Signal exec 和外掛核准提示會使用頂層的 `approvals.exec` 和
`approvals.plugin` 路由區塊。Signal 沒有
`channels.signal.execApprovals` 區塊。

- `👍` 核准一次。
- `👎` 拒絕。
- 當請求提供持久核准時，請使用 `/approve <id> allow-always`。

核准表情回應解析需要來自
`channels.signal.allowFrom`、`channels.signal.defaultTo` 或相符帳號層級欄位的明確 Signal 核准者。
直接同聊天室的 exec 核准提示即使沒有明確核准者，仍可抑制重複的本機 `/approve` 後備；
沒有核准者的群組核准會保留顯示本機後備。

## 傳遞目標（命令列介面/排程）

- 私訊：`signal:+15551234567`（或純 E.164）。
- UUID 私訊：`uuid:<id>`（或裸 UUID）。
- 群組：`signal:group:<groupId>`。
- 使用者名稱：`username:<name>`（如果你的 Signal 帳號支援）。

## 別名

當你想為週期性 Signal 目標使用穩定名稱時，請設定別名。
別名只是 OpenClaw 端設定；它們不會建立或編輯 Signal 聯絡人。

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

可在任何接受 Signal 傳遞目標的位置使用別名：

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

逐帳號別名會繼承頂層別名，並可新增或覆寫名稱：

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

`openclaw directory peers list --channel signal` 和
`openclaw directory groups list --channel signal` 會列出設定的別名。Signal
目錄由設定支援；它不會即時查詢 Signal 聯絡人，也不會
修改 Signal 帳號。

## 疑難排解

先執行這個階梯式檢查：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要時再確認私訊配對狀態：

```bash
openclaw pairing list signal
```

常見失敗：

- Daemon 可連線但沒有回覆：確認帳號/daemon 設定（`httpUrl`、`account`）和接收模式。
- 私訊被忽略：寄件者正在等待配對核准。
- 群組訊息被忽略：群組寄件者/提及閘控阻擋傳遞。
- 編輯後出現設定驗證錯誤：執行 `openclaw doctor --fix`。
- 診斷中缺少 Signal：確認 `channels.signal.enabled: true`。

額外檢查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分流流程請見：[/channels/troubleshooting](/zh-TW/channels/troubleshooting)。

## 安全注意事項

- `signal-cli` 會在本機儲存帳號金鑰（通常是 `~/.local/share/signal-cli/data/`）。
- 在伺服器遷移或重建前，請備份 Signal 帳號狀態。
- 除非你明確想要更廣泛的私訊存取權，否則請保留 `channels.signal.dmPolicy: "pairing"`。
- SMS 驗證只在註冊或復原流程中需要，但失去號碼/帳號控制權可能會讓重新註冊變得複雜。

## 設定參考（Signal）

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.signal.enabled`：啟用/停用頻道啟動。
- `channels.signal.apiMode`：`auto | native | container`（預設：auto）。請見[容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：Bot 帳號的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路徑。
- `channels.signal.configPath`：選用的 `signal-cli --config` 目錄。
- `channels.signal.httpUrl`：完整 daemon URL（覆寫 host/port）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：daemon 綁定（預設 127.0.0.1:8080）。
- `channels.signal.autoStart`：自動產生 daemon（如果未設定 `httpUrl`，預設為 true）。
- `channels.signal.startupTimeoutMs`：啟動等待逾時，單位為 ms（上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：略過附件下載。
- `channels.signal.ignoreStories`：忽略來自 daemon 的 stories。
- `channels.signal.sendReadReceipts`：轉送已讀回條。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）。
- `channels.signal.allowFrom`：私訊允許清單（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 沒有使用者名稱；請使用電話/UUID ids。
- `channels.signal.aliases`：用於私訊或群組傳遞目標的 OpenClaw 端別名。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（預設：allowlist）。
- `channels.signal.groupAllowFrom`：群組允許清單；接受 Signal 群組 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、寄件者 E.164 號碼，或 `uuid:<id>` 值。
- `channels.signal.groups`：以 Signal 群組 id（或 `"*"`）作為鍵的逐群組覆寫。支援欄位：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多帳號設定中 `channels.signal.groups` 的逐帳號版本。
- `channels.signal.accounts.<id>.aliases`：逐帳號別名，與頂層別名合併。
- `channels.signal.historyLimit`：作為情境包含的群組訊息上限（0 會停用）。
- `channels.signal.dmHistoryLimit`：以使用者回合計算的私訊歷史限制。逐使用者覆寫：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：傳出區塊大小（字元）。
- `channels.signal.chunkMode`：`length`（預設）或 `newline`，可先依空白行（段落邊界）分割，再依長度分塊。
- `channels.signal.mediaMaxMb`：傳入/傳出媒體上限（MB）。

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支援原生提及）。
- `messages.groupChat.mentionPatterns`（全域後備）。
- `messages.responsePrefix`。

## 相關

- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證和配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為和提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型和強化
