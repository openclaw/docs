---
read_when:
    - 設定 Signal 支援
    - 偵錯 Signal 傳送/接收
summary: 透過 signal-cli 支援 Signal（原生守護程式或 bbernhard 容器）、設定路徑與號碼模型
title: Signal
x-i18n:
    generated_at: "2026-07-05T11:03:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e1095c142a1d5137676f803430826f1b45a70ed41dabf8b17dcdca1605ad2f
    source_path: channels/signal.md
    workflow: 16
---

Signal 是可下載的頻道外掛（`@openclaw/signal`）。閘道透過 HTTP 與 `signal-cli` 通訊：可使用原生守護程式（JSON-RPC + SSE），或 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) 容器（REST + WebSocket）。OpenClaw 不會內嵌 libsignal。

## 號碼模型（請先閱讀）

- 閘道會連線到一個 **Signal 裝置**：也就是 `signal-cli` 帳號。
- 在**你的個人 Signal 帳號**上執行機器人，會讓它忽略你自己的訊息（迴圈保護）。
- 若要「我傳訊息給機器人，然後它回覆」，請使用**獨立的機器人號碼**。

## 安裝

```bash
openclaw plugins install @openclaw/signal
```

裸外掛規格會先嘗試 ClawHub，然後才 fallback 到 npm。可用 `openclaw plugins install clawhub:@openclaw/signal` 或 `npm:@openclaw/signal` 強制指定來源。`plugins install` 會註冊並啟用外掛；不需要另外執行 `enable` 步驟。一般安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 快速設定

<Steps>
  <Step title="Pick a number">
    建議為機器人使用**獨立的 Signal 號碼**。
  </Step>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Run the guided setup">
    ```bash
    openclaw channels add
    ```
    精靈會偵測 `PATH` 上是否有 `signal-cli`，缺少時會提供安裝選項：在 Linux x86-64 下載官方原生 GraalVM 建置，或在 macOS 與其他架構上透過 Homebrew 安裝。接著會提示輸入機器人號碼與 `signal-cli` 路徑。
  </Step>
  <Step title="Link or register the account">
    - **QR 連結（最快）：** `signal-cli link -n "OpenClaw"`，然後用 Signal 掃描。請參閱[路徑 A](#setup-path-a-link-existing-signal-account-qr)。
    - **SMS 註冊：** 使用專用號碼，搭配 captcha + SMS 驗證。請參閱[路徑 B](#setup-path-b-register-dedicated-bot-number-sms-linux)。

  </Step>
  <Step title="Verify and pair">
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

| 欄位         | 說明                                              |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 格式的機器人電話號碼（`+15551234567`）      |
| `cliPath`    | `signal-cli` 的路徑（若在 `PATH` 上則為 `signal-cli`） |
| `configPath` | 傳給 `--config` 的 signal-cli 設定目錄            |
| `dmPolicy`   | 私訊存取政策（建議使用 `pairing`）                |
| `allowFrom`  | 允許傳送私訊的電話號碼或 `uuid:<id>` 值           |

多帳號支援：使用 `channels.signal.accounts` 搭配各帳號設定與選用的 `name`。共享模式請參閱[多帳號頻道](/zh-TW/gateway/config-channels#multi-account-all-channels)。

## 它是什麼

- 確定性路由：回覆一律送回 Signal。
- 私訊共用代理的主要工作階段；群組會隔離（`agent:<agentId>:signal:group:<groupId>`）。
- 預設情況下，Signal 可能會寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。可用 `channels.signal.configWrites: false` 停用。

## 設定路徑 A：連結既有 Signal 帳號（QR）

1. 安裝 `signal-cli`（JVM 或原生建置），或讓 `openclaw channels add` 為你安裝。
2. 連結機器人帳號：`signal-cli link -n "OpenClaw"`，然後在 Signal 中掃描 QR。
3. 設定 Signal 並啟動閘道。

## 設定路徑 B：註冊專用機器人號碼（SMS，Linux）

若要使用專用機器人號碼，而不是連結既有 Signal app 帳號，請使用此方式。以下流程已在 Ubuntu 24 測試。

1. 取得可接收 SMS 的號碼（或市話可用語音驗證）。專用機器人號碼可避免帳號／工作階段衝突。
2. 在閘道主機上安裝 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

若使用 JVM 建置（`signal-cli-${VERSION}.tar.gz`），請先安裝 JRE。請保持 `signal-cli` 更新；上游說明指出，隨著 Signal 伺服器 API 變更，舊版本可能會失效。

3. 註冊並驗證號碼：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

若需要 captcha（此步驟需要瀏覽器存取權限才能完成）：

1. 開啟 `https://signalcaptchas.org/registration/generate.html`。
2. 完成 captcha，從「Open Signal」複製 `signalcaptcha://...` 連結目標。
3. 可行時，請從與瀏覽器工作階段相同的外部 IP 執行（captcha token 很快就會過期）。
4. 立即註冊並驗證：

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
   - 傳送任何訊息到機器人號碼。
   - 在伺服器上核准：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 將機器人號碼儲存為手機聯絡人，以避免顯示「未知聯絡人」。

<Warning>
使用 `signal-cli` 註冊電話號碼帳號，可能會讓該號碼的主要 Signal app 工作階段解除驗證。建議使用專用機器人號碼，或使用 QR 連結模式保留既有手機 app 設定。
</Warning>

上游參考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- Captcha 流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 連結流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守護程式模式（httpUrl）

若要自行管理 `signal-cli`（JVM 冷啟動慢、容器初始化、共享 CPU），請另外執行守護程式並讓 OpenClaw 指向它：

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

這會跳過自動產生程序與 OpenClaw 的啟動等待。若自動產生程序啟動較慢，請設定 `channels.signal.startupTimeoutMs`。

## 容器模式（bbernhard/signal-cli-rest-api）

除了原生執行 `signal-cli`，也可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 容器，將 `signal-cli` 包裝在 REST + WebSocket 介面後方。

需求：

- 容器**必須**以 `MODE=json-rpc` 執行，才能即時接收訊息。
- 在連接 OpenClaw 前，請先於容器內註冊或連結你的 Signal 帳號。

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

`apiMode` 控制 OpenClaw 使用哪種通訊協定：

| 值            | 行為                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （預設）探測兩種傳輸；串流會驗證容器 WebSocket 接收                                  |
| `"native"`    | 強制使用原生 signal-cli（`/api/v1/rpc` 上的 JSON-RPC、`/api/v1/events` 上的 SSE）     |
| `"container"` | 強制使用 bbernhard 容器（`/v2/send` 上的 REST、`/v1/receive/{account}` 上的 WebSocket） |

當 `apiMode` 為 `"auto"` 時，OpenClaw 會針對每個守護程式 URL 快取偵測到的模式 30 秒，以避免重複探測（兩種傳輸都正常時，native 會優先）。只有在 `/v1/receive/{account}` 升級為 WebSocket 後，才會選取容器接收作為串流，這需要 `MODE=json-rpc`。

容器模式支援與原生模式相同的 Signal 操作，只要容器公開相符 API：傳送、接收、附件、輸入指示器、已讀／已檢視回條、反應、群組與樣式文字。OpenClaw 會將原生 Signal RPC 呼叫轉換為容器的 REST payload，包括 `group.{base64(internal_id)}` 群組 ID，以及格式化文字用的 `text_mode: "styled"`。

操作注意事項：

- 搭配容器模式使用 `autoStart: false`；選取 `apiMode: "container"` 時，OpenClaw 不應產生原生守護程式。
- 使用 `MODE=json-rpc` 進行接收。`MODE=normal` 可能會讓 `/v1/about` 看起來正常，但 `/v1/receive/{account}` 不會升級為 WebSocket，因此 OpenClaw 在 `auto` 模式下不會選取容器接收串流。
- 當 `httpUrl` 指向 bbernhard REST API 時設定 `apiMode: "container"`，指向原生 `signal-cli` JSON-RPC/SSE 時設定 `"native"`，部署可能變動時設定 `"auto"`。
- 容器附件下載會遵守與原生模式相同的媒體位元組限制。若伺服器送出 `Content-Length`，過大的回應會在完整緩衝前被拒絕；否則會在串流期間拒絕。

## 存取控制（私訊 + 群組）

私訊：

- 預設：`channels.signal.dmPolicy = "pairing"`。
- 未知傳送者會收到配對碼；在核准前訊息會被忽略（代碼 1 小時後過期）。
- 透過 `openclaw pairing list signal` 和 `openclaw pairing approve signal <CODE>` 核准。
- 配對是 Signal 私訊的預設 token 交換。詳細資訊：[配對](/zh-TW/channels/pairing)
- 僅 UUID 的傳送者（來自 `sourceUuid`）會以 `uuid:<id>` 儲存在 `channels.signal.allowFrom` 中。

群組：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 當設定 `allowlist` 時，`channels.signal.groupAllowFrom` 控制哪些群組或傳送者可以觸發群組回覆；項目可以是 Signal 群組 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、傳送者電話號碼、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可用 `requireMention`、`tools` 和 `toolsBySender` 覆寫群組行為。
- 在多帳號設定中，使用 `channels.signal.accounts.<id>.groups` 進行各帳號覆寫。
- 透過 `groupAllowFrom` 將群組列入允許清單，本身不會停用提及門檻。除非明確設定 `requireMention: true`，否則特別設定的 `channels.signal.groups["<group-id>"]` 項目會處理每則群組訊息。
- 執行階段注意事項：如果完全缺少 `channels.signal`，執行階段會在群組檢查時 fallback 到 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

## 運作方式（行為）

- 原生模式：`signal-cli` 以守護程式執行；閘道透過 SSE 讀取事件。
- 容器模式：閘道透過 REST API 傳送，並透過 WebSocket 接收。
- 傳入訊息會正規化為共享頻道 envelope。
- 回覆一律路由回相同號碼或群組。

## 媒體 + 限制

- 外送文字會依 `channels.signal.textChunkLimit` 分塊（預設 4000）。
- 選用換行分塊：設定 `channels.signal.chunkMode="newline"`，先依空白行（段落邊界）分割，再依長度分塊。
- 支援附件（從 `signal-cli` 擷取 base64）。
- 語音備忘附件在缺少 `contentType` 時，會使用 `signal-cli` 檔名作為 MIME 後備，因此音訊轉錄仍可分類 AAC 語音備忘。
- 預設媒體上限：`channels.signal.mediaMaxMb`（預設 8）。
- 使用 `channels.signal.ignoreAttachments` 跳過媒體下載。
- 群組歷史脈絡使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），並後備至 `messages.groupChat.historyLimit`。設定為 `0` 可停用（預設 50）。

## 輸入狀態 + 已讀回條

- **輸入狀態指示器**：OpenClaw 透過 `signal-cli sendTyping` 傳送輸入狀態訊號，並在回覆執行期間持續重新整理。
- **已讀回條**：當 `channels.signal.sendReadReceipts` 為 true 時，OpenClaw 會為允許的私訊轉送已讀回條。
- `signal-cli` 不會公開群組的已讀回條。

## 生命週期狀態反應

設定 `messages.statusReactions.enabled: true`，讓 Signal 在傳入回合上顯示共用的已佇列/思考中/工具/壓縮/完成/錯誤反應生命週期。Signal 會使用傳入訊息時間戳作為反應目標；群組反應會用 Signal 群組 ID 加上原始寄件者作為目標作者傳送。

狀態反應也需要一個確認反應，以及相符的 `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions` 或 `all`）。設定 `channels.signal.reactionLevel: "off"` 可停用 Signal 狀態反應。

`messages.removeAckAfterReply: true` 會在設定的保留時間後清除最終狀態反應。否則 Signal 會在最終完成/錯誤狀態後還原初始確認反應。

## 反應（訊息工具）

使用 `message action=react` 搭配 `channel=signal`。

- 目標：寄件者 E.164 或 UUID（使用配對輸出的 `uuid:<id>`；裸 UUID 也可使用）。
- `messageId` 是你要反應的訊息的 Signal 時間戳。
- 群組反應需要 `targetAuthor` 或 `targetAuthorUuid`。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定：

- `channels.signal.actions.reactions`：啟用/停用反應動作（預設 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（預設 `minimal`）。
  - `off`/`ack` 會停用代理反應（訊息工具 `react` 會出錯）。
  - `minimal`/`extensive` 會啟用代理反應並設定指引層級。
- 每帳號覆寫：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 核准反應

Signal exec 與外掛核准提示會使用頂層 `approvals.exec` 與 `approvals.plugin` 路由區塊。Signal 沒有 `channels.signal.execApprovals` 區塊。

- `👍` 核准一次。
- `👎` 拒絕。
- 當請求提供持續核准時，使用 `/approve <id> allow-always`。

核准反應解析需要來自 `channels.signal.allowFrom`、`channels.signal.defaultTo` 或相符帳號層級欄位的明確 Signal 核准者。直接同聊天 exec 核准提示即使沒有明確核准者，仍可抑制重複的本機 `/approve` 後備；沒有核准者的群組核准會讓本機後備保持可見。

## 傳遞目標（命令列介面/排程）

- 私訊：`signal:+15551234567`（或純 E.164）。
- UUID 私訊：`uuid:<id>`（或裸 UUID）。
- 群組：`signal:group:<groupId>`。
- 使用者名稱：`username:<name>`（若你的 Signal 帳號支援）。

## 別名

為重複使用的 Signal 目標設定穩定名稱的別名。別名只是 OpenClaw 端設定；不會建立或編輯 Signal 聯絡人。

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

在任何接受 Signal 傳遞目標的位置使用別名：

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

每帳號別名會繼承頂層別名，並可新增或覆寫名稱：

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

`openclaw directory peers list --channel signal` 和 `openclaw directory groups list --channel signal` 會列出已設定的別名。Signal 目錄以設定為基礎；它不會即時查詢 Signal 聯絡人，也不會變更 Signal 帳號。

## 疑難排解

先執行這個階梯：

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

- 常駐程式可連線但沒有回覆：確認帳號/常駐程式設定（`httpUrl`、`account`）和接收模式。
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

分流流程請見：[頻道疑難排解](/zh-TW/channels/troubleshooting)。

## 安全注意事項

- `signal-cli` 會將帳號金鑰儲存在本機（通常是 `~/.local/share/signal-cli/data/`）。
- 在伺服器遷移或重建前備份 Signal 帳號狀態。
- 除非你明確想要更廣泛的私訊存取，否則請保留 `channels.signal.dmPolicy: "pairing"`。
- SMS 驗證只在註冊或復原流程中需要，但失去對號碼/帳號的控制權可能會使重新註冊變得複雜。

## 設定參考（Signal）

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.signal.enabled`：啟用/停用頻道啟動。
- `channels.signal.apiMode`：`auto | native | container`（預設：auto）。請見[容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：機器人帳號的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路徑。
- `channels.signal.configPath`：選用的 `signal-cli --config` 目錄。
- `channels.signal.httpUrl`：完整常駐程式 URL（覆寫主機/連接埠）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：常駐程式綁定（預設 `127.0.0.1:8080`）。
- `channels.signal.autoStart`：自動產生常駐程式（如果未設定 `httpUrl`，預設為 true）。
- `channels.signal.startupTimeoutMs`：啟動等待逾時，單位為毫秒（最小 1000，上限 120000；預設 30000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳過附件下載。
- `channels.signal.ignoreStories`：忽略來自常駐程式的故事。
- `channels.signal.sendReadReceipts`：轉送已讀回條。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）。
- `channels.signal.allowFrom`：私訊允許清單（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 沒有使用者名稱；請使用電話/UUID ID。
- `channels.signal.aliases`：OpenClaw 端用於私訊或群組傳遞目標的別名。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（預設：allowlist）。
- `channels.signal.groupAllowFrom`：群組允許清單；接受 Signal 群組 ID（原始、`group:<id>` 或 `signal:group:<id>`）、寄件者 E.164 號碼，或 `uuid:<id>` 值。
- `channels.signal.groups`：依 Signal 群組 ID（或 `"*"`）鍵控的每群組覆寫。支援欄位：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多帳號設定中 `channels.signal.groups` 的每帳號版本。
- `channels.signal.accounts.<id>.aliases`：每帳號別名，會與頂層別名合併。
- `channels.signal.historyLimit`：要納入作為脈絡的最大群組訊息數（0 會停用）。
- `channels.signal.dmHistoryLimit`：以使用者回合計算的私訊歷史限制。每使用者覆寫：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：外送分塊大小，單位為字元（預設 4000）。
- `channels.signal.chunkMode`：`length`（預設）或 `newline`，用於先依空白行（段落邊界）分割，再依長度分塊。
- `channels.signal.mediaMaxMb`：傳入/外送媒體上限，單位為 MB（預設 8）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（預設 `minimal`）。請見[反應](#reactions-message-tool)。
- `channels.signal.reactionNotifications`：`off | own | all | allowlist`（預設 `own`）- 代理何時會收到他人傳入反應的通知。
- `channels.signal.reactionAllowlist`：當 `reactionNotifications: "allowlist"` 時，其反應會通知代理的寄件者。
- `channels.signal.blockStreaming`、`channels.signal.blockStreamingCoalesce`：跨頻道共用的區塊模式串流控制。請見[串流](/zh-TW/concepts/streaming)。

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支援原生提及）。
- `messages.groupChat.mentionPatterns`（全域後備）。
- `messages.responsePrefix`。

## 相關

- [頻道概觀](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全](/zh-TW/gateway/security) - 存取模型與強化
