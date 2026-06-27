---
read_when:
    - 在 OpenClaw 中設定 Matrix
    - 設定 Matrix E2EE 與驗證
summary: Matrix 支援狀態、設定與設定範例
title: 矩陣
x-i18n:
    generated_at: "2026-06-27T18:56:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是 OpenClaw 的可下載 channel 外掛。
它使用官方的 `matrix-js-sdk`，並支援 DM、房間、執行緒、媒體、反應、投票、位置和 E2EE。

## 安裝

在設定 channel 之前，先從 ClawHub 安裝 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

裸外掛規格會先嘗試 ClawHub，然後才回退到 npm。若要強制指定 registry 來源，請使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

從本機 checkout 安裝：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 會註冊並啟用外掛，因此不需要另外執行 `openclaw plugins enable matrix` 步驟。外掛在你完成下方 channel 設定前仍不會執行任何動作。一般外掛行為與安裝規則請參閱 [外掛](/zh-TW/tools/plugin)。

## 設定

1. 在你的 homeserver 上建立 Matrix 帳號。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 設定 `channels.matrix`。
3. 重新啟動閘道。
4. 與機器人開始 DM，或邀請它加入房間（請參閱 [自動加入](#auto-join) - 新邀請只有在 `autoJoin` 允許時才會生效）。

### 互動式設定

```bash
openclaw channels add
openclaw configure --section channels
```

精靈會詢問：homeserver URL、驗證方式（存取權杖或密碼）、使用者 ID（僅限密碼驗證）、選用的裝置名稱、是否啟用 E2EE，以及是否設定房間存取與自動加入。

如果相符的 `MATRIX_*` 環境變數已存在，且選取的帳號沒有已儲存的驗證資料，精靈會提供環境變數捷徑。若要在儲存允許清單前解析房間名稱，請執行 `openclaw channels resolve --channel matrix "Project Room"`。啟用 E2EE 時，精靈會寫入設定，並執行與 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的 bootstrap。

### 最小設定

以權杖為基礎：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

以密碼為基礎（第一次登入後會快取權杖）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### 自動加入

`channels.matrix.autoJoin` 預設為 `off`。在預設情況下，除非你手動加入，否則機器人不會出現在新邀請建立的新房間或 DM 中。

OpenClaw 無法在邀請時判斷受邀房間是 DM 還是群組，因此所有邀請，包括 DM 形式的邀請，都會先經過 `autoJoin`。`dm.policy` 只會在稍後套用，也就是機器人已加入且房間已分類之後。

<Warning>
設定 `autoJoin: "allowlist"` 加上 `autoJoinAllowlist` 來限制機器人接受哪些邀請，或設定 `autoJoin: "always"` 來接受所有邀請。

`autoJoinAllowlist` 只接受穩定目標：`!roomId:server`、`#alias:server` 或 `*`。純房間名稱會被拒絕；別名項目會根據 homeserver 解析，而不是根據受邀房間宣稱的狀態解析。
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

若要接受所有邀請，請使用 `autoJoin: "always"`。

### 允許清單目標格式

DM 與房間允許清單最適合填入穩定 ID：

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。顯示名稱預設會被忽略，因為它們可變；只有在你明確需要與顯示名稱項目相容時，才設定 `dangerouslyAllowNameMatching: true`。
- 房間允許清單鍵（`groups`、舊版 `rooms`）：使用 `!room:server` 或 `#alias:server`。純房間名稱預設會被忽略；只有在你明確需要與已加入房間名稱查找相容時，才設定 `dangerouslyAllowNameMatching: true`。
- 邀請允許清單（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。純房間名稱會被拒絕。

### 帳號 ID 正規化

精靈會將友善名稱轉換為正規化的帳號 ID。例如，`Ops Bot` 會變成 `ops-bot`。標點符號會在 scoped 環境變數名稱中逸出，讓兩個帳號不會碰撞：`-` → `_X2D_`，因此 `ops-prod` 會對應到 `MATRIX_OPS_X2D_PROD_*`。

### 快取認證

Matrix 會將快取認證儲存在 `~/.openclaw/credentials/matrix/` 下：

- 預設帳號：`credentials.json`
- 具名帳號：`credentials-<account>.json`

當那裡存在快取認證時，即使存取權杖不在設定檔中，OpenClaw 也會將 Matrix 視為已設定，這涵蓋 setup、`openclaw doctor` 和 channel 狀態探測。

### 環境變數

當等效的設定鍵未設定時使用。預設帳號使用不加前綴的名稱；具名帳號會在尾碼前插入帳號 ID。

| 預設帳號              | 具名帳號（`<ID>` 是正規化的帳號 ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

對於帳號 `ops`，名稱會變成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此類推。recovery-key 環境變數會由支援復原的命令列介面流程（`verify backup restore`、`verify device`、`verify bootstrap`）讀取，前提是你透過 `--recovery-key-stdin` 將金鑰 pipe 進去。

`MATRIX_HOMESERVER` 不能從 workspace `.env` 設定；請參閱 [Workspace `.env` 檔案](/zh-TW/gateway/security)。

## 設定範例

包含 DM pairing、房間允許清單與 E2EE 的實用 baseline：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## 串流預覽

Matrix 回覆串流是選擇啟用。`streaming` 控制 OpenClaw 如何傳送進行中的助理回覆；`blockStreaming` 控制每個完成的區塊是否保留為自己的 Matrix 訊息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留即時回答預覽，但隱藏中間的工具/進度行，請使用物件形式：

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | 行為                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（預設） | 等待完整回覆後傳送一次。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | 在模型寫入目前區塊時，就地編輯一則一般文字訊息。Stock Matrix 用戶端可能會在第一次預覽時通知，而不是在最終編輯時通知。              |
| `"quiet"`         | 與 `"partial"` 相同，但訊息是不通知的 notice。接收者只會在每位使用者的 push rule 符合最終編輯時收到一次通知（見下方）。 |

`blockStreaming` 獨立於 `streaming`：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（預設）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 目前區塊的即時草稿，已完成區塊保留為訊息 | 目前區塊的即時草稿，就地完成 |
| `"off"`                 | 每個完成區塊一則會通知的 Matrix 訊息                     | 完整回覆一則會通知的 Matrix 訊息      |

注意事項：

- 如果預覽超過 Matrix 的每事件大小限制，OpenClaw 會停止預覽串流，並回退為僅傳送最終內容。
- 媒體回覆一律正常傳送附件。如果過期預覽無法再安全重用，OpenClaw 會在傳送最終媒體回覆前將其 redact。
- 當 Matrix 預覽串流啟用時，工具進度預覽更新預設啟用。設定 `streaming.preview.toolProgress: false` 可保留回答文字的預覽編輯，但讓工具進度走一般傳送路徑。
- 預覽編輯會增加額外的 Matrix API 呼叫成本。如果你想要最保守的 rate-limit profile，請維持 `streaming: "off"`。

## 語音訊息

傳入的 Matrix 語音 note 會在房間提及 gate 之前轉錄。這讓說出機器人名稱的語音 note 可以在 `requireMention: true` 房間中觸發 agent，並讓 agent 取得逐字稿，而不只是音訊附件 placeholder。

Matrix 使用在 `tools.media.audio` 下設定的共用音訊媒體 provider，例如 OpenAI `gpt-4o-mini-transcribe`。Provider 設定與限制請參閱 [媒體工具總覽](/zh-TW/tools/media-overview)。

行為詳細資訊：

- `m.audio` 事件和帶有 `audio/*` MIME 類型的 `m.file` 事件符合資格。
- 在加密房間中，OpenClaw 會在轉錄前透過現有 Matrix 媒體路徑解密附件。
- 逐字稿會在 agent prompt 中標示為機器產生且不受信任。
- 附件會標示為已轉錄，因此下游媒體工具不會再次轉錄同一則語音 note。
- 設定 `tools.media.audio.enabled: false` 可全域停用音訊轉錄。

## 核准 metadata

Matrix 原生核准 prompt 是一般 `m.room.message` 事件，並在 `com.openclaw.approval` 下帶有 OpenClaw 專屬自訂事件內容。Matrix 允許自訂事件內容鍵，因此 stock 用戶端仍會呈現文字 body，而支援 OpenClaw 的用戶端可以讀取結構化核准 ID、種類、狀態、可用決策，以及 exec/外掛詳細資訊。

當核准 prompt 太長而無法放入單一 Matrix 事件時，OpenClaw 會將可見文字分塊，並只將 `com.openclaw.approval` 附加到第一個區塊。允許/拒絕決策的反應會綁定到第一個事件，因此長 prompt 會與單一事件 prompt 保持相同核准目標。

### 自行託管的安靜最終預覽 push rule

`streaming: "quiet"` 只會在區塊或回合完成時通知接收者 - 每位使用者的 push rule 必須符合最終預覽標記。完整做法（接收者權杖、pusher 檢查、規則安裝、每個 homeserver 注意事項）請參閱 [安靜預覽的 Matrix push rule](/zh-TW/channels/matrix-push-rules)。

## 機器人對機器人房間

預設情況下，來自其他已設定 OpenClaw Matrix 帳號的 Matrix 訊息會被忽略。

當你有意使用 agent 間 Matrix 流量時，請使用 `allowBots`：

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` 會接受來自其他已設定 Matrix 機器人帳號、且位於允許的聊天室與私訊中的訊息。
- `allowBots: "mentions"` 只會在這些訊息於聊天室中明確提及此機器人時接受。私訊仍然允許。
- `groups.<room>.allowBots` 會覆寫單一聊天室的帳號層級設定。
- 已接受的已設定機器人訊息會使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。先設定 `channels.defaults.botLoopProtection`，當某個聊天室需要不同額度時，再以 `channels.matrix.botLoopProtection` 或 `channels.matrix.groups.<room>.botLoopProtection` 覆寫。
- OpenClaw 仍會忽略來自相同 Matrix 使用者 ID 的訊息，以避免自我回覆迴圈。
- Matrix 在此不會公開原生機器人標記；OpenClaw 會將「由機器人撰寫」視為「由此 OpenClaw 閘道上的另一個已設定 Matrix 帳號傳送」。

在共用聊天室中啟用機器人對機器人的流量時，請使用嚴格的聊天室允許清單與提及要求。

## 加密與驗證

在加密（E2EE）聊天室中，傳出的圖片事件會使用 `thumbnail_file`，因此圖片預覽會與完整附件一同加密。未加密聊天室仍使用一般的 `thumbnail_url`。不需要任何設定；外掛會自動偵測 E2EE 狀態。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整診斷）、`--json`（機器可讀輸出），以及 `--account <id>`（多帳號設定）。預設輸出精簡，且內部 SDK 記錄保持安靜。以下範例顯示標準形式；請視需要加入旗標。

### 啟用加密

```bash
openclaw matrix encryption setup
```

會啟動秘密儲存與交叉簽署，必要時建立聊天室金鑰備份，然後列印狀態與後續步驟。實用旗標：

- `--recovery-key <key>` 在啟動前套用復原金鑰（建議使用下方文件說明的 stdin 形式）
- `--force-reset-cross-signing` 捨棄目前的交叉簽署身分並建立新的身分（僅在有意這麼做時使用）

若為新帳號，請在建立時啟用 E2EE：

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` 是 `--enable-e2ee` 的別名。

等效的手動設定：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### 狀態與信任訊號

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` 會回報三個獨立的信任訊號（`--verbose` 會顯示全部）：

- `Locally trusted`：僅受此用戶端信任
- `Cross-signing verified`：SDK 回報已透過交叉簽署驗證
- `Signed by owner`：由你自己的自我簽署金鑰簽署（僅供診斷）

只有當 `Cross-signing verified` 為 `yes` 時，`Verified by owner` 才會變成 `yes`。僅有本機信任或擁有者簽章並不足夠。

`--allow-degraded-local-state` 會在不先準備 Matrix 帳號的情況下回傳盡力而為的診斷；適合離線或部分設定的探測。

### 使用復原金鑰驗證此裝置

復原金鑰屬於敏感資訊；請透過 stdin 傳入，而不是在命令列上傳入。設定 `MATRIX_RECOVERY_KEY`（或針對具名帳號設定 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

此命令會回報三種狀態：

- `Recovery key accepted`：Matrix 已接受用於秘密儲存或裝置信任的金鑰。
- `Backup usable`：可使用受信任的復原資料載入聊天室金鑰備份。
- `Device verified by owner`：此裝置具備完整的 Matrix 交叉簽署身分信任。

當完整身分信任尚未完成時，即使復原金鑰已解鎖備份資料，也會以非零狀態結束。遇到這種情況，請從另一個 Matrix 用戶端完成自我驗證：

```bash
openclaw matrix verify self
```

`verify self` 會等待 `Cross-signing verified: yes` 後才成功結束。使用 `--timeout-ms <ms>` 調整等待時間。

也接受字面金鑰形式 `openclaw matrix verify device "<recovery-key>"`，但金鑰會留在你的 shell 歷史記錄中。

### 啟動或修復交叉簽署

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密帳號的修復與設定命令。依序會：

- 啟動秘密儲存，並在可行時重用既有復原金鑰
- 啟動交叉簽署並上傳缺少的公開金鑰
- 標記並交叉簽署目前裝置
- 若尚不存在，則建立伺服器端聊天室金鑰備份

如果 homeserver 要求 UIA 才能上傳交叉簽署金鑰，OpenClaw 會先嘗試無驗證，接著嘗試 `m.login.dummy`，再嘗試 `m.login.password`（需要 `channels.matrix.password`）。

實用旗標：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用於捨棄目前的交叉簽署身分（僅限有意這麼做；需要已儲存有效的復原金鑰，或透過 `--recovery-key-stdin` 提供）

### 聊天室金鑰備份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 會顯示伺服器端備份是否存在，以及此裝置是否能解密它。`backup restore` 會將已備份的聊天室金鑰匯入本機加密儲存；如果復原金鑰已在磁碟上，可以省略 `--recovery-key-stdin`。

若要以新的基準取代損壞的備份（接受遺失不可復原的舊歷史；若目前備份秘密無法載入，也可重新建立秘密儲存）：

```bash
openclaw matrix verify backup reset --yes
```

只有在你有意讓先前的復原金鑰停止解鎖新的備份基準時，才加入 `--rotate-recovery-key`。

### 列出、請求與回應驗證

```bash
openclaw matrix verify list
```

列出所選帳號的待處理驗證請求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

從此 OpenClaw 帳號傳送驗證請求。`--own-user` 會請求自我驗證（你在同一使用者的另一個 Matrix 用戶端中接受提示）；`--user-id`/`--device-id`/`--room-id` 會指定其他人。`--own-user` 不能與其他目標旗標合併使用。

對於較低層級的生命週期處理，通常是在跟隨另一個用戶端傳入請求時使用，這些命令會作用於特定請求 `<id>`（由 `verify list` 和 `verify request` 列印）：

| 命令                                       | 用途                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受傳入請求                                                        |
| `openclaw matrix verify start <id>`        | 啟動 SAS 流程                                                       |
| `openclaw matrix verify sas <id>`          | 列印 SAS 表情符號或數字                                             |
| `openclaw matrix verify confirm-sas <id>`  | 確認 SAS 與另一個用戶端顯示的內容相符                               |
| `openclaw matrix verify mismatch-sas <id>` | 當表情符號或數字不相符時拒絕 SAS                                    |
| `openclaw matrix verify cancel <id>`       | 取消；可選擇附加 `--reason <text>` 和 `--code <matrix-code>`         |

當驗證錨定到特定私訊聊天室時，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 與 `--room-id` 作為私訊後續提示。

### 多帳號注意事項

若未提供 `--account <id>`，Matrix 命令列介面命令會使用隱含的預設帳號。如果你有多個具名帳號且未設定 `channels.matrix.defaultAccount`，它們會拒絕猜測並要求你選擇。當具名帳號停用或無法使用 E2EE 時，錯誤會指向該帳號的設定鍵，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="啟動行為">
    使用 `encryption: true` 時，`startupVerification` 預設為 `"if-unverified"`。啟動時，未驗證的裝置會在另一個 Matrix 用戶端請求自我驗證，略過重複請求並套用冷卻時間（預設 24 小時）。可使用 `startupVerificationCooldownHours` 調整，或使用 `startupVerification: "off"` 停用。

    啟動時也會執行保守的加密啟動程序，重用目前的秘密儲存與交叉簽署身分。如果啟動狀態損壞，OpenClaw 即使沒有 `channels.matrix.password` 也會嘗試受保護的修復；如果 homeserver 要求密碼 UIA，啟動會記錄警告並保持非致命。已由擁有者簽署的裝置會保留。

    請參閱 [Matrix 遷移](/zh-TW/channels/matrix-migration)以了解完整升級流程。

  </Accordion>

  <Accordion title="驗證通知">
    Matrix 會以 `m.notice` 訊息將驗證生命週期通知發布到嚴格的私訊驗證聊天室：請求、就緒（含「透過表情符號驗證」指引）、開始/完成，以及可用時的 SAS（表情符號/十進位）詳細資訊。

    來自另一個 Matrix 用戶端的傳入請求會被追蹤並自動接受。對於自我驗證，OpenClaw 會自動啟動 SAS 流程，並在表情符號驗證可用後確認自己這一端；你仍需要在 Matrix 用戶端中比較並確認「它們相符」。

    驗證系統通知不會轉送到 agent 聊天管線。

  </Accordion>

  <Accordion title="已刪除或無效的 Matrix 裝置">
    如果 `verify status` 表示目前裝置不再列於 homeserver 上，請建立新的 OpenClaw Matrix 裝置。若使用密碼登入：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    若使用權杖驗證，請在你的 Matrix 用戶端或管理 UI 中建立新的存取權杖，然後更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    將 `assistant` 替換為失敗命令中的帳號 ID，或省略 `--account` 以使用預設帳號。

  </Accordion>

  <Accordion title="裝置維護">
    舊的 OpenClaw 管理裝置可能會累積。列出並修剪：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密儲存">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路徑，並以 `fake-indexeddb` 作為 IndexedDB shim。加密狀態會持久化到 `crypto-idb-snapshot.json`（限制性檔案權限）。

    加密執行階段狀態位於 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`，並包含同步儲存、加密儲存、復原金鑰、IDB 快照、執行緒綁定，以及啟動驗證狀態。當權杖變更但帳號身分保持相同時，OpenClaw 會重用最佳的既有根目錄，因此先前狀態仍可見。

  </Accordion>
</AccordionGroup>

## 個人檔案管理

更新所選帳號的 Matrix 自我個人檔案：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次呼叫中同時傳入這兩個選項。Matrix 會直接接受 `mxc://` 頭像 URL；當你傳入 `http://` 或 `https://` 時，OpenClaw 會先上傳檔案，並將解析後的 `mxc://` URL 儲存到 `channels.matrix.avatarUrl`（或每個帳號的覆寫設定）。

## 執行緒

Matrix 支援原生 Matrix 執行緒，可用於自動回覆與訊息工具傳送。兩個彼此獨立的旋鈕控制其行為：

### 工作階段路由（`sessionScope`）

`dm.sessionScope` 決定 Matrix DM 房間如何對應到 OpenClaw 工作階段：

- `"per-user"`（預設）：所有具有相同路由對等方的 DM 房間共用一個工作階段。
- `"per-room"`：每個 Matrix DM 房間都取得自己的工作階段金鑰，即使對等方相同也是如此。

明確的對話繫結一律優先於 `sessionScope`，因此已繫結的房間與執行緒會保留其選定的目標工作階段。

### 回覆執行緒（`threadReplies`）

`threadReplies` 決定機器人在哪裡發布回覆：

- `"off"`：回覆為頂層訊息。傳入的執行緒訊息會留在父工作階段。
- `"inbound"`：只有當傳入訊息已在該執行緒中時，才在執行緒內回覆。
- `"always"`：在以觸發訊息為根的執行緒內回覆；該對話會從第一次觸發起，透過相符的執行緒範圍工作階段進行路由。

`dm.threadReplies` 只會覆寫 DM 的此設定，例如讓房間執行緒保持隔離，同時讓 DM 保持扁平。

### 執行緒繼承與斜線命令

- 傳入的執行緒訊息會將執行緒根訊息包含為額外的代理程式脈絡。
- 當目標是同一個房間（或同一個 DM 使用者目標）時，訊息工具傳送會自動繼承目前的 Matrix 執行緒，除非提供了明確的 `threadId`。
- 只有當目前工作階段中繼資料證明是同一個 Matrix 帳號上的同一位 DM 對等方時，才會啟用 DM 使用者目標重用；否則 OpenClaw 會退回到一般的使用者範圍路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及執行緒繫結的 `/acp spawn` 都可在 Matrix 房間與 DM 中運作。
- 當 `threadBindings.spawnSessions` 啟用時，頂層 `/focus` 會建立新的 Matrix 執行緒，並將其繫結到目標工作階段。
- 在現有 Matrix 執行緒內執行 `/focus` 或 `/acp spawn --thread here`，會就地繫結該執行緒。

當 OpenClaw 偵測到某個 Matrix DM 房間與同一個共用工作階段上的另一個 DM 房間衝突時，會在該房間發布一次性的 `m.notice`，指向 `/focus` 逃生路徑，並建議變更 `dm.sessionScope`。此通知只會在啟用執行緒繫結時出現。

## ACP 對話繫結

Matrix 房間、DM 和現有 Matrix 執行緒都可以轉換為持久的 ACP 工作區，而不必變更聊天表面。

快速操作員流程：

- 在你想繼續使用的 Matrix DM、房間或現有執行緒內執行 `/acp spawn codex --bind here`。
- 在頂層 Matrix DM 或房間中，目前的 DM/房間會保留為聊天表面，未來訊息會路由到產生的 ACP 工作階段。
- 在現有 Matrix 執行緒內，`--bind here` 會就地繫結目前執行緒。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

注意事項：

- `--bind here` 不會建立子 Matrix 執行緒。
- `threadBindings.spawnSessions` 會控管 `/acp spawn --thread auto|here`，此時 OpenClaw 需要建立或繫結子 Matrix 執行緒。

### 執行緒繫結設定

Matrix 會繼承來自 `session.threadBindings` 的全域預設值，也支援每個通道的覆寫：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 執行緒繫結工作階段產生預設為開啟：

- 設定 `threadBindings.spawnSessions: false`，以阻止頂層 `/focus` 和 `/acp spawn --thread auto|here` 建立/繫結 Matrix 執行緒。
- 當原生子代理程式執行緒產生不應分叉父逐字稿時，設定 `threadBindings.defaultSpawnContext: "isolated"`。

## 回應

Matrix 支援傳出回應、傳入回應通知與確認回應。

傳出回應工具由 `channels.matrix.actions.reactions` 控管：

- `react` 會為 Matrix 事件新增回應。
- `reactions` 會列出 Matrix 事件目前的回應摘要。
- `emoji=""` 會移除該事件上機器人自己的回應。
- `remove: true` 只會從機器人移除指定的 emoji 回應。

**解析順序**（第一個已定義的值勝出）：

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 每帳號 → 通道 → `messages.ackReaction` → 代理程式身分 emoji 後援                |
| `ackReactionScope`      | 每帳號 → 通道 → `messages.ackReactionScope` → 預設 `"group-mentions"`            |
| `reactionNotifications` | 每帳號 → 通道 → 預設 `"own"`                                                     |

`reactionNotifications: "own"` 會在新增的 `m.reaction` 事件目標為機器人撰寫的 Matrix 訊息時轉發；`"off"` 會停用回應系統事件。回應移除不會合成為系統事件，因為 Matrix 會將這些呈現為修訂刪除，而不是獨立的 `m.reaction` 移除。

## 歷史脈絡

- `channels.matrix.historyLimit` 控制當 Matrix 房間訊息觸發代理程式時，有多少最近的房間訊息會作為 `InboundHistory` 納入。會退回到 `messages.groupChat.historyLimit`；如果兩者都未設定，實際預設值為 `0`。設定 `0` 可停用。
- Matrix 房間歷史僅限房間。DM 會繼續使用一般工作階段歷史。
- Matrix 房間歷史僅限待處理：OpenClaw 會緩衝尚未觸發回覆的房間訊息，然後在提及或其他觸發到達時擷取該視窗的快照。
- 目前觸發訊息不會包含在 `InboundHistory` 中；它會留在該回合的主要傳入本文中。
- 同一個 Matrix 事件的重試會重用原始歷史快照，而不會向前漂移到較新的房間訊息。

## 脈絡可見性

Matrix 支援共用的 `contextVisibility` 控制，用於補充房間脈絡，例如擷取的回覆文字、執行緒根與待處理歷史。

- `contextVisibility: "all"` 是預設值。補充脈絡會依接收內容保留。
- `contextVisibility: "allowlist"` 會篩選補充脈絡，只傳送通過作用中房間/使用者允許清單檢查的傳送者。
- `contextVisibility: "allowlist_quote"` 的行為類似 `allowlist`，但仍會保留一個明確引用的回覆。

此設定影響補充脈絡的可見性，而不是傳入訊息本身是否能觸發回覆。
觸發授權仍來自 `groupPolicy`、`groups`、`groupAllowFrom` 與 DM 原則設定。

## DM 與房間原則

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

若要完全靜音 DM 但保持房間可用，請設定 `dm.enabled: false`：

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

請參閱 [群組](/zh-TW/channels/groups)，了解提及控管與允許清單行為。

Matrix DM 的配對範例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未核准的 Matrix 使用者在核准前持續傳訊息給你，OpenClaw 會重用同一個待處理配對代碼，並可能在短暫冷卻後傳送提醒回覆，而不是產生新代碼。

請參閱 [配對](/zh-TW/channels/pairing)，了解共用 DM 配對流程與儲存版面配置。

## 直接房間修復

如果直接訊息狀態不同步，OpenClaw 可能會留下過時的 `m.direct` 對應，指向舊的單人房間，而不是作用中的 DM。檢查某位對等方目前的對應：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

這兩個命令都接受 `--account <id>`，用於多帳號設定。修復流程：

- 優先使用已在 `m.direct` 中對應的嚴格 1:1 DM
- 退回到目前已加入且包含該使用者的任何嚴格 1:1 DM
- 如果沒有健康的 DM，則建立新的直接房間並重寫 `m.direct`

它不會自動刪除舊房間。它會選擇健康的 DM 並更新對應，讓未來的 Matrix 傳送、驗證通知與其他直接訊息流程都以正確的房間為目標。

## Exec 核准

Matrix 可以作為原生核准用戶端。在 `channels.matrix.execApprovals`（或每帳號覆寫的 `channels.matrix.accounts.<account>.execApprovals`）底下設定：

- `enabled`：透過 Matrix 原生提示傳送核准。未設定或為 `"auto"` 時，只要至少能解析一位核准者，Matrix 就會自動啟用。設定 `false` 可明確停用。
- `approvers`：允許核准 exec 請求的 Matrix 使用者 ID（`@owner:example.org`）。選填，會退回到 `channels.matrix.dm.allowFrom`。
- `target`：提示傳送的位置。`"dm"`（預設）會傳送給核准者 DM；`"channel"` 會傳送到原始 Matrix 房間或 DM；`"both"` 會兩者都傳送。
- `agentFilter` / `sessionFilter`：選填的允許清單，用於決定哪些代理程式/工作階段會觸發 Matrix 傳送。

不同核准種類的授權略有差異：

- **Exec 核准**使用 `execApprovals.approvers`，並退回到 `dm.allowFrom`。
- **外掛核准**僅透過 `dm.allowFrom` 授權。

兩種類型共用 Matrix 回應捷徑與訊息更新。核准者會在主要核准訊息上看到回應捷徑：

- `✅` 允許一次
- `❌` 拒絕
- `♾️` 永遠允許（當有效 exec 原則允許時）

後援斜線命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的核准者可以核准或拒絕。Exec 核准的通道傳送會包含命令文字，只有在受信任的房間中才啟用 `channel` 或 `both`。

相關：[Exec 核准](/zh-TW/tools/exec-approvals)。

## 斜線命令

斜線命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在 DM 中運作。在房間中，OpenClaw 也會辨識以機器人自己的 Matrix 提及為前綴的命令，因此 `@bot:server /new` 會觸發命令路徑，而不需要自訂提及 regex。這會讓機器人能回應 Element 與類似用戶端在使用者先以 tab 補全機器人、再輸入命令時發出的房間風格 `@mention /command` 貼文。

授權規則仍然適用：命令傳送者必須滿足與普通訊息相同的 DM 或房間允許清單/擁有者原則。

## 多帳號

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**繼承：**

- 頂層 `channels.matrix` 值會作為具名帳號的預設值，除非帳號覆寫它們。
- 使用 `groups.<room>.account` 將繼承的房間項目限定到特定帳號。沒有 `account` 的項目會在所有帳號間共用；當預設帳號設定在頂層時，`account: "default"` 仍然可用。

**預設帳號選擇：**

- 設定 `defaultAccount`，以選擇隱含路由、探測與命令列介面命令偏好的具名帳號。
- 如果你有多個帳號，且其中一個確實命名為 `default`，即使未設定 `defaultAccount`，OpenClaw 也會隱含使用它。
- 如果你有多個具名帳號且未選取預設帳號，命令列介面命令會拒絕猜測 - 請設定 `defaultAccount` 或傳入 `--account <id>`。
- 只有在其驗證資訊完整時（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），頂層 `channels.matrix.*` 區塊才會被視為隱含的 `default` 帳號。具名帳號只要有 `homeserver` + `userId`，且快取憑證涵蓋驗證，仍可被探索。

**升級：**

- 當 OpenClaw 在修復或設定期間將單帳號設定升級為多帳號時，如果既有具名帳號存在，或 `defaultAccount` 已指向某個帳號，它會保留該既有具名帳號。只有 Matrix 驗證/啟動鍵會移入升級後的帳號；共用的傳遞政策鍵會保留在頂層。

請參閱[設定參考](/zh-TW/gateway/config-channels#multi-account-all-channels)，了解共用的多帳號模式。

## 私有/LAN 主伺服器

預設情況下，OpenClaw 會封鎖私有/內部 Matrix 主伺服器以提供 SSRF 保護，除非你
明確針對每個帳號選擇啟用。

如果你的主伺服器執行於 localhost、LAN/Tailscale IP，或內部主機名稱，請為該 Matrix 帳號啟用
`network.dangerouslyAllowPrivateNetwork`：

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

命令列介面設定範例：

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

此選擇啟用只允許受信任的私有/內部目標。公開的明文主伺服器，例如
`http://matrix.example.org:8008`，仍會被封鎖。請盡可能偏好使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要明確的輸出 HTTP(S) 代理，請設定 `channels.matrix.proxy`：

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

具名帳號可以使用 `channels.matrix.accounts.<id>.proxy` 覆寫頂層預設值。
OpenClaw 會對執行階段 Matrix 流量與帳號狀態探測使用相同的代理設定。

## 目標解析

在 OpenClaw 要求你提供房間或使用者目標的任何位置，Matrix 都接受這些目標形式：

- 使用者：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房間：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 別名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房間 ID 區分大小寫。設定明確傳遞目標、排程工作、繫結或允許清單時，
請使用 Matrix 中的精確房間 ID 大小寫。
OpenClaw 會將內部工作階段鍵維持為儲存用的標準形式，因此那些小寫
鍵不是 Matrix 傳遞 ID 的可靠來源。

即時目錄查詢會使用已登入的 Matrix 帳號：

- 使用者查詢會查詢該主伺服器上的 Matrix 使用者目錄。
- 房間查詢會直接接受明確房間 ID 與別名。已加入房間的名稱查詢是盡力而為，且只有在設定 `dangerouslyAllowNameMatching: true` 時，才會套用於執行階段房間允許清單。
- 如果房間名稱無法解析為 ID 或別名，執行階段允許清單解析會忽略它。

## 設定參考

允許清單風格的使用者欄位（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整 Matrix 使用者 ID（最安全）。非 ID 使用者項目預設會被忽略。如果你設定 `dangerouslyAllowNameMatching: true`，精確的 Matrix 目錄顯示名稱相符項會在啟動時解析，並在監視器執行期間允許清單變更時解析；無法解析的項目會在執行階段被忽略。

房間允許清單鍵（`groups`、舊版 `rooms`）應為房間 ID 或別名。純房間名稱鍵預設會被忽略；`dangerouslyAllowNameMatching: true` 會恢復針對已加入房間名稱的盡力而為查詢。

### 帳號與連線

- `enabled`：啟用或停用此頻道。
- `name`：帳號的選用顯示標籤。
- `defaultAccount`：設定多個 Matrix 帳號時偏好的帳號 ID。
- `accounts`：具名的逐帳號覆寫。頂層 `channels.matrix` 值會作為預設值繼承。
- `homeserver`：主伺服器 URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允許此帳號連線到 `localhost`、LAN/Tailscale IP 或內部主機名稱。
- `proxy`：Matrix 流量的選用 HTTP(S) 代理 URL。支援逐帳號覆寫。
- `userId`：完整 Matrix 使用者 ID（`@bot:example.org`）。
- `accessToken`：權杖式驗證的存取權杖。支援跨 env/file/exec 提供者使用純文字與 SecretRef 值（[秘密管理](/zh-TW/gateway/secrets)）。
- `password`：密碼式登入的密碼。支援純文字與 SecretRef 值。
- `deviceId`：明確 Matrix 裝置 ID。
- `deviceName`：密碼登入時使用的裝置顯示名稱。
- `avatarUrl`：用於個人檔案同步與 `profile set` 更新的已儲存自我頭像 URL。
- `initialSyncLimit`：啟動同步期間擷取的最大事件數。

### 加密

- `encryption`：啟用 E2EE。預設：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 開啟時的預設值）或 `"off"`。當此裝置未驗證時，會在啟動時自動要求自我驗證。
- `startupVerificationCooldownHours`：下一次自動啟動要求前的冷卻時間。預設：`24`。

### 存取與政策

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。預設：`"allowlist"`。
- `groupAllowFrom`：房間流量的使用者 ID 允許清單。
- `dm.enabled`：當為 `false` 時，忽略所有 DM。預設：`true`。
- `dm.policy`：`"pairing"`（預設）、`"allowlist"`、`"open"` 或 `"disabled"`。在機器人加入並將房間分類為 DM 後套用；不影響邀請處理。
- `dm.allowFrom`：DM 流量的使用者 ID 允許清單。
- `dm.sessionScope`：`"per-user"`（預設）或 `"per-room"`。
- `dm.threadReplies`：僅限 DM 的回覆串接覆寫（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受來自其他已設定 Matrix 機器人帳號的訊息（`true` 或 `"mentions"`）。
- `allowlistOnly`：當為 `true` 時，會強制所有作用中的 DM 政策（`"disabled"` 除外）與 `"open"` 群組政策改為 `"allowlist"`。不會變更 `"disabled"` 政策。
- `dangerouslyAllowNameMatching`：當為 `true` 時，允許針對使用者允許清單項目進行 Matrix 顯示名稱目錄查詢，並針對房間允許清單鍵進行已加入房間名稱查詢。請偏好使用完整 `@user:server` ID，以及房間 ID 或別名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。預設：`"off"`。套用於每個 Matrix 邀請，包括 DM 風格邀請。
- `autoJoinAllowlist`：當 `autoJoin` 為 `"allowlist"` 時允許的房間/別名。別名項目會針對主伺服器解析，而不是針對受邀房間宣稱的狀態解析。
- `contextVisibility`：補充內容脈絡可見性（`"all"` 預設、`"allowlist"`、`"allowlist_quote"`）。

### 回覆行為

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：針對執行緒繫結工作階段路由與生命週期的逐頻道覆寫。
- `streaming`：`"off"`（預設）、`"partial"`、`"quiet"`，或物件形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：當為 `true` 時，完成的助理區塊會保留為獨立的進度訊息。
- `markdown`：輸出文字的選用 Markdown 算繪設定。
- `responsePrefix`：附加到輸出回覆前方的選用字串。
- `textChunkLimit`：當 `chunkMode: "length"` 時，以字元為單位的輸出分塊大小。預設：`4000`。
- `chunkMode`：`"length"`（預設，依字元數分割）或 `"newline"`（依行邊界分割）。
- `historyLimit`：當房間訊息觸發代理程式時，作為 `InboundHistory` 納入的最近房間訊息數量。會退回到 `messages.groupChat.historyLimit`；有效預設值為 `0`（停用）。
- `mediaMaxMb`：輸出傳送與輸入處理的媒體大小上限，單位為 MB。

### 反應設定

- `ackReaction`：此頻道/帳號的確認反應覆寫。
- `ackReactionScope`：範圍覆寫（`"group-mentions"` 預設、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：輸入反應通知模式（`"own"` 預設、`"off"`）。

### 工具與逐房間覆寫

- `actions`：逐動作工具閘控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：逐房間政策映射。工作階段身分會在解析後使用穩定房間 ID。（`rooms` 是舊版別名。）
  - `groups.<room>.account`：將一個繼承的房間項目限制為特定帳號。
  - `groups.<room>.allowBots`：頻道層級設定的逐房間覆寫（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：逐房間傳送者允許清單。
  - `groups.<room>.tools`：逐房間工具允許/拒絕覆寫。
  - `groups.<room>.autoReply`：逐房間提及閘控覆寫。`true` 會停用該房間的提及要求；`false` 會強制重新啟用。
  - `groups.<room>.skills`：逐房間 skill 篩選器。
  - `groups.<room>.systemPrompt`：逐房間系統提示片段。

### Exec 核准設定

- `execApprovals.enabled`：透過 Matrix 原生提示傳遞 exec 核准。
- `execApprovals.approvers`：允許核准的 Matrix 使用者 ID。會退回到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（預設）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用於傳遞的選用代理程式/工作階段允許清單。

## 相關

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
