---
read_when:
    - 設定 Signal 支援
    - 偵錯 Signal 傳送/接收
summary: 透過 signal-cli（原生守護程式或 bbernhard 容器）的 Signal 支援、設定途徑與號碼模型
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

狀態：外部 CLI 整合。Gateway 透過 HTTP 與 `signal-cli` 通訊 — 可以是原生 daemon（JSON-RPC + SSE）或 bbernhard/signal-cli-rest-api container（REST + WebSocket）。

## 先決條件

- 你的伺服器已安裝 OpenClaw（以下 Linux 流程已在 Ubuntu 24 測試）。
- 下列其中之一：
  - 主機上可用 `signal-cli`（原生模式），**或**
  - `bbernhard/signal-cli-rest-api` Docker container（container 模式）。
- 可接收一次驗證簡訊的電話號碼（用於簡訊註冊路徑）。
- 註冊期間可透過瀏覽器存取 Signal captcha（`signalcaptchas.org`）。

## 快速設定（初學者）

1. 為 bot 使用**獨立的 Signal 號碼**（建議）。
2. 安裝 `signal-cli`（如果使用 JVM build，需 Java）。
3. 選擇一種設定路徑：
   - **路徑 A（QR 連結）：** `signal-cli link -n "OpenClaw"`，然後用 Signal 掃描。
   - **路徑 B（簡訊註冊）：** 使用 captcha + 簡訊驗證註冊專用號碼。
4. 設定 OpenClaw 並重新啟動 gateway。
5. 傳送第一則 DM 並核准 pairing（`openclaw pairing approve signal <CODE>`）。

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

| 欄位        | 說明                                              |
| ----------- | ------------------------------------------------- |
| `account`   | E.164 格式的 bot 電話號碼（`+15551234567`）       |
| `cliPath`   | `signal-cli` 的路徑（若在 `PATH` 上則為 `signal-cli`） |
| `dmPolicy`  | DM 存取政策（建議 `pairing`）                     |
| `allowFrom` | 允許傳送 DM 的電話號碼或 `uuid:<id>` 值           |

## 這是什麼

- 透過 `signal-cli` 的 Signal channel（不是嵌入式 libsignal）。
- 確定性路由：回覆一律回到 Signal。
- DM 共用 agent 的主要 session；群組則隔離（`agent:<agentId>:signal:group:<groupId>`）。

## 設定寫入

預設允許 Signal 寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

停用方式：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 號碼模型（重要）

- gateway 連線到一個 **Signal 裝置**（`signal-cli` 帳號）。
- 如果你在**個人 Signal 帳號**上執行 bot，它會忽略你自己的訊息（迴圈保護）。
- 若要「我傳訊息給 bot，然後它回覆」，請使用**獨立的 bot 號碼**。

## 設定路徑 A：連結既有 Signal 帳號（QR）

1. 安裝 `signal-cli`（JVM 或原生 build）。
2. 連結 bot 帳號：
   - `signal-cli link -n "OpenClaw"`，然後在 Signal 中掃描 QR。
3. 設定 Signal 並啟動 gateway。

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

多帳號支援：使用 `channels.signal.accounts` 搭配每帳號設定與選用的 `name`。共用模式請參閱 [`gateway/configuration`](/zh-TW/gateway/config-channels#multi-account-all-channels)。

## 設定路徑 B：註冊專用 bot 號碼（簡訊，Linux）

當你想使用專用 bot 號碼，而不是連結既有 Signal app 帳號時，請使用此方式。

1. 取得可接收簡訊的號碼（或市話可用語音驗證）。
   - 使用專用 bot 號碼以避免帳號/session 衝突。
2. 在 gateway 主機上安裝 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM build（`signal-cli-${VERSION}.tar.gz`），請先安裝 JRE 25+。
請持續更新 `signal-cli`；上游指出，舊版本可能會因 Signal server API 變更而中斷。

3. 註冊並驗證號碼：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要 captcha：

1. 開啟 `https://signalcaptchas.org/registration/generate.html`。
2. 完成 captcha，從「Open Signal」複製 `signalcaptcha://...` 連結目標。
3. 可行時，請從與瀏覽器 session 相同的外部 IP 執行。
4. 立即再次執行註冊（captcha token 很快就會過期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 設定 OpenClaw、重新啟動 gateway，並驗證 channel：

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Pair 你的 DM 傳送者：
   - 傳送任意訊息到 bot 號碼。
   - 在伺服器上核准代碼：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 將 bot 號碼儲存為手機聯絡人，以避免「未知聯絡人」。

<Warning>
使用 `signal-cli` 註冊電話號碼帳號，可能會讓該號碼的主要 Signal app session 取消授權。請優先使用專用 bot 號碼；若你需要保留現有手機 app 設定，請使用 QR 連結模式。
</Warning>

上游參考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- Captcha 流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 連結流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部 daemon 模式（httpUrl）

如果你想自行管理 `signal-cli`（JVM 冷啟動慢、container 初始化或共用 CPU），請另外執行 daemon，並讓 OpenClaw 指向它：

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

這會略過 OpenClaw 內部的自動產生行程與啟動等待。自動產生行程時若啟動較慢，請設定 `channels.signal.startupTimeoutMs`。

## Container 模式（bbernhard/signal-cli-rest-api）

除了原生執行 `signal-cli`，你也可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker container。這會將 `signal-cli` 包裝在 REST API 和 WebSocket 介面後方。

需求：

- container **必須**以 `MODE=json-rpc` 執行，才能即時接收訊息。
- 在連接 OpenClaw 前，請先在 container 內註冊或連結你的 Signal 帳號。

`docker-compose.yml` service 範例：

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

`apiMode` 欄位控制 OpenClaw 使用哪一種 protocol：

| 值            | 行為                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （預設）探測兩種 transport；streaming 會驗證 container WebSocket 接收                |
| `"native"`    | 強制使用原生 signal-cli（`/api/v1/rpc` 的 JSON-RPC，`/api/v1/events` 的 SSE）         |
| `"container"` | 強制使用 bbernhard container（`/v2/send` 的 REST，`/v1/receive/{account}` 的 WebSocket） |

當 `apiMode` 為 `"auto"` 時，OpenClaw 會快取偵測到的模式 30 秒，以避免重複探測。Container receive 只有在 `/v1/receive/{account}` 升級為 WebSocket 後才會被選為 streaming，這需要 `MODE=json-rpc`。

Container 模式支援與原生模式相同的 Signal channel 操作，只要 container 暴露對應 API：傳送、接收、attachments、typing indicators、已讀/已檢視 receipts、reactions、群組與 styled text。OpenClaw 會將其原生 Signal RPC 呼叫轉換為 container 的 REST payload，包括 `group.{base64(internal_id)}` group ID，以及用於格式化文字的 `text_mode: "styled"`。

操作注意事項：

- Container 模式請使用 `autoStart: false`。選擇 `apiMode: "container"` 時，OpenClaw 不應產生原生 daemon。
- 接收請使用 `MODE=json-rpc`。`MODE=normal` 可能讓 `/v1/about` 看起來健康，但 `/v1/receive/{account}` 不會 WebSocket-upgrade，因此 OpenClaw 在 `auto` 模式下不會選擇 container receive streaming。
- 當你知道 `httpUrl` 指向 bbernhard 的 REST API 時，設定 `apiMode: "container"`。當你知道它指向原生 `signal-cli` JSON-RPC/SSE 時，設定 `apiMode: "native"`。部署可能不同時使用 `"auto"`。
- Container attachment 下載會遵守與原生模式相同的媒體位元組限制。當伺服器傳送 `Content-Length` 時，過大的回應會在完整緩衝前遭拒；否則會在 streaming 時拒絕。

## 存取控制（DM + 群組）

DM：

- 預設：`channels.signal.dmPolicy = "pairing"`。
- 未知傳送者會收到 pairing code；在核准前訊息會被忽略（代碼 1 小時後過期）。
- 透過以下方式核准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing 是 Signal DM 預設的 token 交換方式。詳細資訊：[Pairing](/zh-TW/channels/pairing)
- 僅 UUID 的傳送者（來自 `sourceUuid`）會在 `channels.signal.allowFrom` 中儲存為 `uuid:<id>`。

群組：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 設定 `allowlist` 時，`channels.signal.groupAllowFrom` 控制哪些群組或傳送者可以觸發群組回覆；項目可以是 Signal group ID（raw、`group:<id>` 或 `signal:group:<id>`）、傳送者電話號碼、`uuid:<id>` 值，或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可使用 `requireMention`、`tools` 和 `toolsBySender` 覆寫群組行為。
- 多帳號設定中，使用 `channels.signal.accounts.<id>.groups` 進行每帳號覆寫。
- 透過 `groupAllowFrom` allowlist 某個 Signal 群組，本身不會停用 mention gating。除非設定 `requireMention=true`，否則特別設定的 `channels.signal.groups["<group-id>"]` 項目會處理每則群組訊息。
- 執行階段注意事項：如果完全缺少 `channels.signal`，執行階段會在群組檢查時 fallback 至 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

## 運作方式（行為）

- 原生模式：`signal-cli` 以 daemon 形式執行；gateway 透過 SSE 讀取 events。
- Container 模式：gateway 透過 REST API 傳送，並透過 WebSocket 接收。
- 傳入訊息會正規化為共用 channel envelope。
- 回覆一律路由回相同號碼或群組。

## 媒體 + 限制

- 傳出文字會依 `channels.signal.textChunkLimit` 分段（預設 4000）。
- 選用的換行分段：設定 `channels.signal.chunkMode="newline"`，先依空白行（段落邊界）分割，再依長度分段。
- 支援 attachments（從 `signal-cli` 擷取 base64）。
- 當 `contentType` 缺失時，語音筆記 attachment 會使用 `signal-cli` 檔名作為 MIME fallback，因此音訊轉錄仍可分類 AAC 語音備忘錄。
- 預設媒體上限：`channels.signal.mediaMaxMb`（預設 8）。
- 使用 `channels.signal.ignoreAttachments` 跳過下載媒體。
- 群組歷史 context 使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），並 fallback 至 `messages.groupChat.historyLimit`。設定為 `0` 可停用（預設 50）。

## Typing + 已讀 receipts

- **Typing indicators**：OpenClaw 透過 `signal-cli sendTyping` 傳送 typing signals，並在回覆執行期間持續刷新。
- **已讀 receipts**：當 `channels.signal.sendReadReceipts` 為 true 時，OpenClaw 會為允許的 DM 轉送已讀 receipts。
- Signal-cli 不會暴露群組的已讀 receipts。

## Reactions（message tool）

- 使用 `message action=react` 搭配 `channel=signal`。
- 目標：寄件者 E.164 或 UUID（使用配對輸出的 `uuid:<id>`；裸 UUID 也可使用）。
- `messageId` 是你要回應的訊息的 Signal 時間戳記。
- 群組回應需要 `targetAuthor` 或 `targetAuthorUuid`。

範例：

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定：

- `channels.signal.actions.reactions`：啟用/停用回應動作（預設為 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 會停用代理程式回應（訊息工具 `react` 會出錯）。
  - `minimal`/`extensive` 會啟用代理程式回應並設定指引層級。
- 個別帳號覆寫：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 傳遞目標（CLI/cron）

- DM：`signal:+15551234567`（或純 E.164）。
- UUID DM：`uuid:<id>`（或裸 UUID）。
- 群組：`signal:group:<groupId>`。
- 使用者名稱：`username:<name>`（如果你的 Signal 帳號支援）。

## 疑難排解

先執行這個階梯：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

接著視需要確認 DM 配對狀態：

```bash
openclaw pairing list signal
```

常見失敗：

- Daemon 可連線但沒有回覆：確認帳號/daemon 設定（`httpUrl`、`account`）與接收模式。
- DM 被忽略：寄件者正在等待配對核准。
- 群組訊息被忽略：群組寄件者/提及閘控阻擋了傳遞。
- 編輯後出現設定驗證錯誤：執行 `openclaw doctor --fix`。
- 診斷中缺少 Signal：確認 `channels.signal.enabled: true`。

額外檢查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分流流程請見：[/channels/troubleshooting](/zh-TW/channels/troubleshooting)。

## 安全性注意事項

- `signal-cli` 會在本機儲存帳號金鑰（通常位於 `~/.local/share/signal-cli/data/`）。
- 伺服器遷移或重建前，請備份 Signal 帳號狀態。
- 除非你明確想要更廣泛的 DM 存取權，否則請保留 `channels.signal.dmPolicy: "pairing"`。
- SMS 驗證只在註冊或復原流程中需要，但失去號碼/帳號的控制權可能會讓重新註冊變得複雜。

## 設定參考（Signal）

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.signal.enabled`：啟用/停用頻道啟動。
- `channels.signal.apiMode`：`auto | native | container`（預設：auto）。請參閱[容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：機器人帳號的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路徑。
- `channels.signal.httpUrl`：完整 daemon URL（覆寫主機/連接埠）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：daemon 綁定（預設 127.0.0.1:8080）。
- `channels.signal.autoStart`：自動產生 daemon（如果未設定 `httpUrl`，預設為 true）。
- `channels.signal.startupTimeoutMs`：啟動等待逾時，單位為 ms（上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：略過附件下載。
- `channels.signal.ignoreStories`：忽略來自 daemon 的限時動態。
- `channels.signal.sendReadReceipts`：轉送已讀回條。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）。
- `channels.signal.allowFrom`：DM 允許清單（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 沒有使用者名稱；請使用電話/UUID ID。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（預設：allowlist）。
- `channels.signal.groupAllowFrom`：群組允許清單；接受 Signal 群組 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、寄件者 E.164 號碼，或 `uuid:<id>` 值。
- `channels.signal.groups`：依 Signal 群組 ID（或 `"*"`）作為鍵的個別群組覆寫。支援欄位：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多帳號設定中 `channels.signal.groups` 的個別帳號版本。
- `channels.signal.historyLimit`：要作為脈絡納入的群組訊息上限（0 會停用）。
- `channels.signal.dmHistoryLimit`：以使用者回合計算的 DM 歷史記錄限制。個別使用者覆寫：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：傳出區塊大小（字元）。
- `channels.signal.chunkMode`：`length`（預設）或 `newline`，在依長度分塊前先依空白行（段落邊界）分割。
- `channels.signal.mediaMaxMb`：傳入/傳出媒體上限（MB）。

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支援原生提及）。
- `messages.groupChat.mentionPatterns`（全域後援）。
- `messages.responsePrefix`。

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
