---
read_when:
    - 設定 Signal 支援功能
    - 偵錯 Signal 傳送/接收
summary: 透過 signal-cli（JSON-RPC + SSE）支援 Signal、設定路徑與號碼模型
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Status: 外部 CLI 整合。Gateway 透過 `signal-cli` 經由 HTTP JSON-RPC + SSE 通訊。

## 先決條件

- 你的伺服器上已安裝 OpenClaw（以下 Linux 流程已在 Ubuntu 24 測試）。
- Gateway 執行所在主機可使用 `signal-cli`。
- 可接收一則驗證 SMS 的電話號碼（用於 SMS 註冊路徑）。
- 註冊期間可使用瀏覽器存取 Signal captcha（`signalcaptchas.org`）。

## 快速設定（初學者）

1. 為機器人使用**獨立的 Signal 號碼**（建議）。
2. 安裝 `signal-cli`（如果使用 JVM 建置版，需先安裝 Java）。
3. 選擇一種設定路徑：
   - **路徑 A（QR 連結）：** `signal-cli link -n "OpenClaw"`，然後使用 Signal 掃描。
   - **路徑 B（SMS 註冊）：** 使用 captcha + SMS 驗證註冊專用號碼。
4. 設定 OpenClaw 並重新啟動 Gateway。
5. 傳送第一則私訊並核准配對（`openclaw pairing approve signal <CODE>`）。

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
| `account`   | E.164 格式的機器人電話號碼（`+15551234567`）      |
| `cliPath`   | `signal-cli` 的路徑（若在 `PATH` 上則為 `signal-cli`） |
| `dmPolicy`  | 私訊存取政策（建議使用 `pairing`）                |
| `allowFrom` | 允許傳送私訊的電話號碼或 `uuid:<id>` 值           |

## 這是什麼

- 透過 `signal-cli` 提供的 Signal 通道（不是內嵌的 libsignal）。
- 確定性路由：回覆一律送回 Signal。
- 私訊共用代理的主要工作階段；群組會隔離（`agent:<agentId>:signal:group:<groupId>`）。

## 設定寫入

根據預設，Signal 可寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

使用以下設定停用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 號碼模型（重要）

- Gateway 會連線到一個 **Signal 裝置**（`signal-cli` 帳號）。
- 如果你在**個人的 Signal 帳號**上執行機器人，它會忽略你自己的訊息（迴圈保護）。
- 若要「我傳訊息給機器人，然後它回覆」，請使用**獨立的機器人號碼**。

## 設定路徑 A：連結現有 Signal 帳號（QR）

1. 安裝 `signal-cli`（JVM 或原生建置版）。
2. 連結機器人帳號：
   - `signal-cli link -n "OpenClaw"`，然後在 Signal 中掃描 QR。
3. 設定 Signal 並啟動 Gateway。

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

多帳號支援：使用 `channels.signal.accounts` 搭配每個帳號的設定與選用的 `name`。共享模式請參閱 [`gateway/configuration`](/zh-TW/gateway/config-channels#multi-account-all-channels)。

## 設定路徑 B：註冊專用機器人號碼（SMS，Linux）

當你想使用專用機器人號碼，而不是連結現有 Signal app 帳號時，請使用此方式。

1. 取得可接收 SMS 的號碼（或市話可使用語音驗證）。
   - 使用專用機器人號碼，以避免帳號/工作階段衝突。
2. 在 Gateway 主機上安裝 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM 建置版（`signal-cli-${VERSION}.tar.gz`），請先安裝 JRE 25+。
請保持 `signal-cli` 更新；上游說明指出，舊版本可能會因 Signal 伺服器 API 變更而失效。

3. 註冊並驗證號碼：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要 captcha：

1. 開啟 `https://signalcaptchas.org/registration/generate.html`。
2. 完成 captcha，從「Open Signal」複製 `signalcaptcha://...` 連結目標。
3. 盡可能從與瀏覽器工作階段相同的外部 IP 執行。
4. 立即再次執行註冊（captcha token 很快會過期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 設定 OpenClaw、重新啟動 Gateway，並驗證通道：

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. 配對你的私訊傳送者：
   - 傳送任意訊息到機器人號碼。
   - 在伺服器上核准代碼：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 將機器人號碼儲存為手機聯絡人，以避免「Unknown contact」。

<Warning>
使用 `signal-cli` 註冊電話號碼帳號可能會讓該號碼的主要 Signal app 工作階段取消驗證。建議使用專用機器人號碼，或如果需要保留現有手機 app 設定，請使用 QR 連結模式。
</Warning>

上游參考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- Captcha 流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 連結流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部常駐程式模式（httpUrl）

如果你想自行管理 `signal-cli`（JVM 冷啟動緩慢、容器初始化或共享 CPU），請另行執行常駐程式，並將 OpenClaw 指向它：

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

這會略過 OpenClaw 內部的自動產生程序與啟動等待。若自動產生程序時啟動較慢，請設定 `channels.signal.startupTimeoutMs`。

## 存取控制（私訊 + 群組）

私訊：

- 預設：`channels.signal.dmPolicy = "pairing"`。
- 未知傳送者會收到配對代碼；訊息在核准前會被忽略（代碼會在 1 小時後過期）。
- 透過以下方式核准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配對是 Signal 私訊的預設 token 交換方式。詳細資訊：[配對](/zh-TW/channels/pairing)
- 僅 UUID 的傳送者（來自 `sourceUuid`）會以 `uuid:<id>` 儲存在 `channels.signal.allowFrom`。

群組：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom` 控制在設定 `allowlist` 時，哪些群組或傳送者可觸發群組回覆；項目可以是 Signal 群組 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、傳送者電話號碼、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可使用 `requireMention`、`tools` 和 `toolsBySender` 覆寫群組行為。
- 在多帳號設定中，使用 `channels.signal.accounts.<id>.groups` 進行每個帳號的覆寫。
- 透過 `groupAllowFrom` 將 Signal 群組加入允許清單，本身不會停用提及閘控。特別設定的 `channels.signal.groups["<group-id>"]` 項目會處理每則群組訊息，除非設定 `requireMention=true`。
- 執行階段注意事項：如果完全缺少 `channels.signal`，執行階段會針對群組檢查退回到 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

## 運作方式（行為）

- `signal-cli` 會以常駐程式執行；Gateway 透過 SSE 讀取事件。
- 傳入訊息會正規化為共享通道信封。
- 回覆一律路由回相同號碼或群組。

## 媒體 + 限制

- 傳出文字會依 `channels.signal.textChunkLimit` 分段（預設 4000）。
- 選用換行分段：設定 `channels.signal.chunkMode="newline"`，即可在長度分段前先依空白行（段落邊界）切分。
- 支援附件（從 `signal-cli` 擷取 base64）。
- 語音備忘附件會在缺少 `contentType` 時，使用 `signal-cli` 檔名作為 MIME 後援，因此音訊轉錄仍可分類 AAC 語音備忘。
- 預設媒體上限：`channels.signal.mediaMaxMb`（預設 8）。
- 使用 `channels.signal.ignoreAttachments` 跳過媒體下載。
- 群組歷史脈絡使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），並退回到 `messages.groupChat.historyLimit`。設定為 `0` 可停用（預設 50）。

## 輸入狀態 + 已讀回條

- **輸入狀態指示器**：OpenClaw 透過 `signal-cli sendTyping` 傳送輸入狀態訊號，並在回覆執行期間重新整理。
- **已讀回條**：當 `channels.signal.sendReadReceipts` 為 true 時，OpenClaw 會轉送允許私訊的已讀回條。
- Signal-cli 不會公開群組的已讀回條。

## 反應（訊息工具）

- 使用 `message action=react` 搭配 `channel=signal`。
- 目標：傳送者 E.164 或 UUID（使用配對輸出的 `uuid:<id>`；裸 UUID 也可使用）。
- `messageId` 是你要反應之訊息的 Signal 時間戳記。
- 群組反應需要 `targetAuthor` 或 `targetAuthorUuid`。

範例：

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定：

- `channels.signal.actions.reactions`：啟用/停用反應動作（預設 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 會停用代理反應（訊息工具 `react` 會發生錯誤）。
  - `minimal`/`extensive` 會啟用代理反應並設定指引層級。
- 每個帳號的覆寫：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 傳遞目標（CLI/Cron）

- 私訊：`signal:+15551234567`（或純 E.164）。
- UUID 私訊：`uuid:<id>`（或裸 UUID）。
- 群組：`signal:group:<groupId>`。
- 使用者名稱：`username:<name>`（如果你的 Signal 帳號支援）。

## 疑難排解

請先執行這個階梯：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然後視需要確認私訊配對狀態：

```bash
openclaw pairing list signal
```

常見失敗：

- 常駐程式可連線但沒有回覆：驗證帳號/常駐程式設定（`httpUrl`、`account`）和接收模式。
- 私訊被忽略：傳送者正在等待配對核准。
- 群組訊息被忽略：群組傳送者/提及閘控阻擋傳遞。
- 編輯後出現設定驗證錯誤：執行 `openclaw doctor --fix`。
- 診斷中缺少 Signal：確認 `channels.signal.enabled: true`。

額外檢查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分級診斷流程：[/channels/troubleshooting](/zh-TW/channels/troubleshooting)。

## 安全注意事項

- `signal-cli` 會將帳號金鑰儲存在本機（通常是 `~/.local/share/signal-cli/data/`）。
- 伺服器遷移或重建前，請備份 Signal 帳號狀態。
- 除非你明確想要更廣泛的私訊存取，否則請保留 `channels.signal.dmPolicy: "pairing"`。
- SMS 驗證只在註冊或復原流程中需要，但失去該號碼/帳號的控制權可能會讓重新註冊變得複雜。

## 設定參考（Signal）

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.signal.enabled`：啟用/停用頻道啟動。
- `channels.signal.account`：機器人帳號的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路徑。
- `channels.signal.httpUrl`：完整的 daemon URL（覆寫主機/連接埠）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：daemon 綁定（預設 127.0.0.1:8080）。
- `channels.signal.autoStart`：自動產生 daemon（若未設定 `httpUrl`，預設為 true）。
- `channels.signal.startupTimeoutMs`：啟動等待逾時，單位為毫秒（上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：略過附件下載。
- `channels.signal.ignoreStories`：忽略來自 daemon 的限時動態。
- `channels.signal.sendReadReceipts`：轉送已讀回條。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）。
- `channels.signal.allowFrom`：私訊允許清單（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 沒有使用者名稱；請使用電話/UUID ID。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（預設：allowlist）。
- `channels.signal.groupAllowFrom`：群組允許清單；接受 Signal 群組 ID（原始格式、`group:<id>` 或 `signal:group:<id>`）、傳送者 E.164 號碼，或 `uuid:<id>` 值。
- `channels.signal.groups`：依 Signal 群組 ID（或 `"*"`）鍵入的逐群組覆寫。支援欄位：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多帳號設定中 `channels.signal.groups` 的逐帳號版本。
- `channels.signal.historyLimit`：作為上下文納入的群組訊息數量上限（0 會停用）。
- `channels.signal.dmHistoryLimit`：以使用者回合計算的私訊記錄上限。逐使用者覆寫：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：傳出分塊大小（字元）。
- `channels.signal.chunkMode`：`length`（預設）或 `newline`，先依空白行（段落邊界）分割，再依長度分塊。
- `channels.signal.mediaMaxMb`：傳入/傳出媒體上限（MB）。

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支援原生提及）。
- `messages.groupChat.mentionPatterns`（全域備援）。
- `messages.responsePrefix`。

## 相關

- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
