---
read_when:
    - 在 OpenClaw 中設定 Matrix
    - 設定 Matrix 端對端加密與驗證
summary: Matrix 支援狀態、設定與組態範例
title: 矩陣
x-i18n:
    generated_at: "2026-07-11T21:06:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是以官方 `matrix-js-sdk` 為基礎建置、可下載的頻道外掛（`@openclaw/matrix`）。它支援私訊、聊天室、討論串、媒體、回應、投票、位置資訊和端對端加密。

## 安裝

```bash
openclaw plugins install @openclaw/matrix
```

未指定來源的外掛規格會先嘗試 ClawHub，再改用 npm。若要強制指定來源，請使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `npm:@openclaw/matrix`。若從本機簽出版本安裝，請使用：`openclaw plugins install ./path/to/local/matrix-plugin`。

`plugins install` 會註冊並啟用外掛，不需要另外執行 `enable` 步驟。在完成下方設定之前，此頻道仍不會執行任何動作。一般安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 設定

1. 在你的主伺服器上建立 Matrix 帳號。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 設定 `channels.matrix`。
3. 重新啟動閘道。
4. 開始與機器人私訊，或邀請它加入聊天室。只有在 [`autoJoin`](#auto-join) 允許時，新的邀請才會生效。

### 互動式設定

```bash
openclaw channels add
openclaw configure --section channels
```

精靈會詢問主伺服器 URL、驗證方式（權杖或密碼）、使用者 ID（僅限密碼驗證）、選用的裝置名稱、是否啟用端對端加密，以及聊天室存取權限／自動加入設定。如果相符的 `MATRIX_*` 環境變數已存在，且帳號沒有已儲存的驗證資料，精靈會提供使用環境變數的捷徑。請先使用 `openclaw channels resolve --channel matrix "Project Room"` 解析聊天室名稱，再儲存允許清單。在精靈中啟用端對端加密時，會執行與 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的初始化程序。

### 最小設定

以權杖驗證：

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

以密碼驗證（首次登入後會快取權杖）：

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

`channels.matrix.autoJoin` 預設為 `"off"`：在你手動加入之前，機器人不會因新邀請而出現在新的聊天室或私訊中。OpenClaw 無法在收到邀請時判斷該邀請是私訊還是群組，因此每個邀請都會先經過 `autoJoin`；只有在機器人加入且聊天室完成分類後，`dm.policy` 才會套用。

<Warning>
設定 `autoJoin: "allowlist"` 與 `autoJoinAllowlist` 可限制接受的邀請，設定 `autoJoin: "always"` 則會接受所有邀請。

`autoJoinAllowlist` 僅接受 `!roomId:server`、`#alias:server` 或 `*`。一般聊天室名稱會被拒絕；別名會依主伺服器進行解析，而不是依受邀聊天室所宣告的狀態解析。
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

### 允許清單目標格式

- 私訊（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。預設會忽略顯示名稱（因其可變動）；只有在明確需要相容顯示名稱時，才設定 `dangerouslyAllowNameMatching: true`。
- 聊天室允許清單鍵（`groups`，舊版別名為 `rooms`）：使用 `!room:server` 或 `#alias:server`。除非設定 `dangerouslyAllowNameMatching: true`，否則一般名稱會被忽略。
- 邀請允許清單（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。一般名稱一律會被拒絕。

### 帳號 ID 正規化

精靈會將易讀名稱轉換成正規化的帳號 ID（`Ops Bot` -> `ops-bot`）。在具範圍的環境變數名稱中，標點符號會以十六進位跳脫，避免帳號發生衝突：`-`（0x2D）會變成 `_X2D_`，因此 `ops-prod` 會對應到環境變數前綴 `MATRIX_OPS_X2D_PROD_`。

### 快取的憑證

Matrix 會將憑證快取於 `~/.openclaw/credentials/matrix/`：預設帳號使用 `credentials.json`，具名帳號使用 `credentials-<account>.json`。存在快取憑證時，即使設定檔中沒有 `accessToken`，OpenClaw 仍會將 Matrix 視為已設定；這適用於設定程序、`openclaw doctor` 和頻道狀態探查。

### 環境變數

以下環境變數以設定鍵為基礎，會在對應設定鍵未設定時使用。預設帳號使用不帶前綴的名稱；具名帳號會在後綴前插入帳號權杖（請參閱[正規化](#account-id-normalization)）。

| 預設帳號              | 具名帳號（`<ID>` = 帳號權杖）          |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

對於帳號 `ops`，名稱會變成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此類推。`MATRIX_HOMESERVER`（以及任何具範圍的 `*_HOMESERVER` 變體）無法從工作區的 `.env` 設定；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

<Note>
復原金鑰不是由設定支援的環境變數：OpenClaw 絕不會自行從環境中讀取它。命令列介面的指引文字建議，預設帳號可透過名為 `MATRIX_RECOVERY_KEY` 的 shell 變數以管線傳入；具名帳號則使用 `MATRIX_RECOVERY_KEY_<ID>`（直接將帳號 ID 轉為大寫，不進行十六進位跳脫）——請參閱[使用復原金鑰驗證此裝置](#verify-this-device-with-a-recovery-key)。
</Note>

## 設定範例

以下是包含私訊配對、聊天室允許清單和端對端加密的實用基準設定：

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

Matrix 回覆串流必須選擇啟用。`streaming` 控制 OpenClaw 如何傳送尚在生成中的助理回覆；`blockStreaming` 控制是否將每個已完成的區塊保留為獨立的 Matrix 訊息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留即時回答預覽，但隱藏過渡期間的工具／進度行，請使用物件形式：

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

完整物件形式接受 `{ mode, preview, progress }`：

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`：自訂標籤；使用 `"auto"`／未設定可選取已設定或內建的標籤，使用 `false` 則隱藏標籤。
- `progress.labels`：僅在 `label` 為 `"auto"` 或未設定時使用的候選項目。
- `progress.maxLines`：草稿中保留的捲動進度行數上限；超過後會裁除較舊的行。
- `progress.maxLineChars`：每個精簡進度行在截斷前允許的字元數上限。
- `progress.toolProgress`：設為 `true`（預設值）時，草稿中會顯示即時工具／進度活動。

| `streaming`       | 行為                                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（預設）   | 等候完整回覆後一次傳送。`true` <-> `"partial"`，`false` <-> `"off"`。                                                                                    |
| `"partial"`       | 模型撰寫目前區塊時，會就地編輯一則一般文字訊息。標準用戶端可能會在首次預覽時通知，而非在最終編輯時通知。                                                  |
| `"quiet"`         | 與 `"partial"` 相同，但訊息是不發送通知的公告。當每位使用者的推播規則與最終編輯相符時，收件者會收到一次通知（請參閱下文）。                               |
| `"progress"`      | 使用進度草稿傳送個別的精簡進度行。                                                                                                                       |

`blockStreaming`（預設為 `false`）與 `streaming` 各自獨立：

| `streaming`             | `blockStreaming: true`                                  | `blockStreaming: false`（預設）               |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `"partial"` / `"quiet"` | 顯示目前區塊的即時草稿，並將已完成區塊保留為訊息        | 顯示目前區塊的即時草稿，並就地完成最終版本     |
| `"off"`                 | 每個已完成區塊各傳送一則會通知的 Matrix 訊息            | 為完整回覆傳送一則會通知的 Matrix 訊息         |

注意事項：

- 如果預覽超過 Matrix 的單一事件大小限制，OpenClaw 會停止預覽串流，並改為只傳送最終結果。
- 媒體回覆一律會正常傳送附件；如果無法安全地重複使用過時的預覽，OpenClaw 會先將其遮蔽，再傳送最終媒體回覆。
- 啟用預覽串流時，工具進度預覽更新預設為開啟。設定 `streaming.preview.toolProgress: false` 可保留回答文字的預覽編輯，但讓工具進度繼續透過一般傳送路徑處理。
- 預覽編輯會增加 Matrix API 呼叫次數。若要採用最保守的速率限制設定，請保持 `streaming: "off"`。

## 語音訊息

傳入的 Matrix 語音留言會在聊天室提及條件檢查前先轉錄，因此在 `requireMention: true` 的聊天室中，若語音留言說出機器人名稱，即可觸發代理程式；代理程式取得的會是轉錄文字，而不只是音訊附件預留位置。

Matrix 使用 `tools.media.audio` 下的共用音訊媒體提供者，例如 OpenAI `gpt-4o-mini-transcribe`。提供者設定與限制請參閱[媒體工具概覽](/zh-TW/tools/media-overview)。

- `m.audio` 事件和 MIME 類型為 `audio/*` 的 `m.file` 事件可進行轉錄。
- 在加密聊天室中，OpenClaw 會先透過現有的 Matrix 媒體路徑解密附件，再進行轉錄。
- 在代理程式提示詞中，轉錄文字會標示為由機器產生且不受信任。
- 附件會標示為已完成轉錄，讓下游媒體工具不會再次轉錄。
- 設定 `tools.media.audio.enabled: false` 可全域停用音訊轉錄。

## 核准中繼資料

Matrix 原生核准提示是一般的 `m.room.message` 事件，其 OpenClaw 專用內容位於 `com.openclaw.approval` 鍵下。標準用戶端仍會呈現文字本文；支援 OpenClaw 的用戶端則可讀取結構化的核准 ID、種類、狀態、決策，以及執行／外掛詳細資訊。

當提示過長、無法放入單一 Matrix 事件時，OpenClaw 會將可見文字分段，並只在第一個分段附加 `com.openclaw.approval`。允許／拒絕回應會繫結至第一個事件，因此長提示會與單一事件提示使用相同的核准目標。

### 用於安靜最終預覽的自架推播規則

`streaming: "quiet"` 只會在區塊或回合完成後通知收件者——必須有符合最終預覽標記的個別使用者推播規則。完整設定方式請參閱 [Matrix 安靜預覽推播規則](/zh-TW/channels/matrix-push-rules)。

## 機器人對機器人聊天室

依預設，系統會忽略來自其他已設定 OpenClaw Matrix 帳號的 Matrix 訊息。使用 `allowBots` 可刻意允許代理程式之間的流量：

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

- `allowBots: true` 會接受允許聊天室和私訊中，來自其他已設定 Matrix 機器人帳號的訊息。
- `allowBots: "mentions"` 只會在聊天室中的訊息明確提及此機器人時接受；無論是否提及，私訊仍會接受。
- `groups.<room>.allowBots` 會覆寫單一聊天室的帳號層級設定。
- 已接受的已設定機器人訊息會使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。先設定 `channels.defaults.botLoopProtection`，再透過 `channels.matrix.botLoopProtection` 覆寫個別帳號，或透過 `channels.matrix.groups.<room>.botLoopProtection` 覆寫個別聊天室。
- OpenClaw 仍會忽略來自相同 Matrix 使用者 ID 的訊息，以避免自我回覆迴圈。
- Matrix 沒有原生的機器人標記；OpenClaw 將「由機器人傳送」視為「由此 OpenClaw 閘道上另一個已設定的 Matrix 帳號傳送」。

在共用聊天室中啟用機器人對機器人流量時，請使用嚴格的聊天室允許清單和提及要求。

## 加密與驗證

在加密（E2EE）聊天室中，外送圖片事件使用 `thumbnail_file`，讓圖片預覽與完整附件一併加密；未加密聊天室則使用純文字 `thumbnail_url`。不需要任何設定——外掛會自動偵測 E2EE 狀態。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整診斷）、`--json`（機器可讀輸出）和 `--account <id>`（多帳號設定）。預設輸出簡潔。

### 啟用加密

```bash
openclaw matrix encryption setup
```

啟動秘密儲存空間和交叉簽署、視需要建立聊天室金鑰備份，然後輸出狀態和後續步驟。實用旗標：

- `--recovery-key <key>` 在啟動前套用復原金鑰（建議使用下方的標準輸入形式）
- `--force-reset-cross-signing` 捨棄目前的交叉簽署身分並建立新身分（僅限刻意使用）

若為新帳號，請在建立時啟用 E2EE：

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` 是 `--enable-e2ee` 的別名。等效的手動設定：

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

`verify status` 會回報三個彼此獨立的信任訊號（`--verbose` 會顯示全部訊號）：

- `Locally trusted`：僅受此用戶端信任
- `Cross-signing verified`：SDK 回報已透過交叉簽署驗證
- `Signed by owner`：由您自己的自我簽署金鑰簽署（僅供診斷）

只有當 `Cross-signing verified` 為 `yes` 時，`Verified by owner` 才會是 `yes`；僅有本機信任或擁有者簽章並不足夠。

`--allow-degraded-local-state` 可在不先準備 Matrix 帳號的情況下，回傳盡力而為的診斷資訊；適合用於離線或只完成部分設定的探測。

### 使用復原金鑰驗證此裝置

請透過標準輸入傳送復原金鑰，而不是在命令列上傳遞：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

此命令會回報三種狀態：

- `Recovery key accepted`：Matrix 已接受此金鑰，用於秘密儲存空間或裝置信任。
- `Backup usable`：可使用受信任的復原資料載入聊天室金鑰備份。
- `Device verified by owner`：此裝置具備完整的 Matrix 交叉簽署身分信任。

即使復原金鑰已解鎖備份資料，只要完整身分信任仍未完成，命令便會以非零狀態結束。此時，請從另一個 Matrix 用戶端完成自我驗證：

```bash
openclaw matrix verify self
```

`verify self` 會等待 `Cross-signing verified: yes` 後才成功結束。使用 `--timeout-ms <ms>` 可調整等待時間。

也可以使用字面金鑰形式 `openclaw matrix verify device "<recovery-key>"`，但金鑰會留在殼層歷史記錄中。

### 啟動或修復交叉簽署

```bash
openclaw matrix verify bootstrap
```

這是加密帳號的修復／設定命令。它會依序：

- 啟動秘密儲存空間，並盡可能重複使用現有復原金鑰
- 啟動交叉簽署並上傳缺少的公開金鑰
- 標記目前裝置並對其進行交叉簽署
- 若伺服器端尚無聊天室金鑰備份，則建立一份

若主伺服器要求透過 UIA 上傳交叉簽署金鑰，OpenClaw 會先嘗試無驗證，接著嘗試 `m.login.dummy`，最後嘗試 `m.login.password`（需要 `channels.matrix.password`）。

實用旗標：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用於捨棄目前的交叉簽署身分（僅限刻意使用；必須已儲存有效的復原金鑰，或透過 `--recovery-key-stdin` 提供）

### 聊天室金鑰備份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 會顯示伺服器端備份是否存在，以及此裝置能否將其解密。`backup restore` 會將已備份的聊天室金鑰匯入本機密碼學儲存區；若復原金鑰已存在磁碟上，請省略 `--recovery-key-stdin`。

若要以全新基準取代損壞的備份（接受遺失無法復原的舊歷史記錄；若目前的備份秘密無法載入，也可重新建立秘密儲存空間）：

```bash
openclaw matrix verify backup reset --yes
```

只有在刻意讓先前的復原金鑰無法再解鎖全新備份基準時，才加入 `--rotate-recovery-key`。

### 列出、請求及回應驗證

```bash
openclaw matrix verify list
```

列出所選帳號待處理的驗證請求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

從此帳號傳送驗證請求。`--own-user` 會請求自我驗證（請在同一使用者的另一個 Matrix 用戶端中接受提示）；`--user-id`／`--device-id`／`--room-id` 則以其他人為目標。`--own-user` 無法與其他目標旗標合併使用。

若要進行較低階的生命週期處理——通常是在追蹤來自另一個用戶端的傳入請求時——這些命令會針對特定請求 `<id>` 執行動作（由 `verify list` 和 `verify request` 輸出）：

| 命令                                       | 用途                                                   |
| ------------------------------------------ | ------------------------------------------------------ |
| `openclaw matrix verify accept <id>`       | 接受傳入請求                                           |
| `openclaw matrix verify start <id>`        | 啟動 SAS 流程                                          |
| `openclaw matrix verify sas <id>`          | 輸出 SAS 表情符號或數字                                |
| `openclaw matrix verify confirm-sas <id>`  | 確認 SAS 與另一個用戶端顯示的內容相符                  |
| `openclaw matrix verify mismatch-sas <id>` | 當表情符號或數字不符時拒絕 SAS                         |
| `openclaw matrix verify cancel <id>`       | 取消；可選擇接受 `--reason <text>` 和 `--code <matrix-code>` |

當驗證繫結至特定私訊聊天室時，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 全都接受 `--user-id` 和 `--room-id`，作為私訊後續處理的提示。

### 多帳號注意事項

若未指定 `--account <id>`，Matrix 命令列介面命令會使用隱含的預設帳號。若存在多個具名帳號，但未設定 `channels.matrix.defaultAccount`，命令會拒絕猜測並要求您選擇。若具名帳號已停用 E2EE 或無法使用 E2EE，錯誤會指向該帳號的設定鍵，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="啟動行為">
    使用 `encryption: true` 時，`startupVerification` 預設為 `"if-unverified"`。啟動時，未驗證的裝置會在另一個 Matrix 用戶端中請求自我驗證，同時跳過重複請求並套用冷卻時間（預設為 24 小時）。可使用 `startupVerificationCooldownHours` 調整，或透過 `startupVerification: "off"` 停用。

    啟動時也會執行保守的密碼學啟動程序，重複使用目前的秘密儲存空間和交叉簽署身分。若啟動狀態損壞，即使沒有 `channels.matrix.password`，OpenClaw 仍會嘗試受保護的修復；若主伺服器要求密碼 UIA，啟動程序會記錄警告，但不會視為致命錯誤。已由擁有者簽署的裝置會予以保留。

    完整升級流程請參閱 [Matrix 遷移](/zh-TW/channels/matrix-migration)。

  </Accordion>

  <Accordion title="驗證通知">
    Matrix 會將驗證生命週期通知以 `m.notice` 訊息發布到嚴格的私訊驗證聊天室中：包括請求、就緒（附有 "Verify by emoji" 指引）、開始／完成，以及可用時的 SAS（表情符號／數字）詳細資料。

    系統會追蹤並自動接受來自另一個 Matrix 用戶端的傳入請求。進行自我驗證時，OpenClaw 會自動啟動 SAS 流程，並在表情符號驗證可用後確認自己的驗證端——您仍需在 Matrix 用戶端中比較內容，並確認 "They match"。

    驗證系統通知不會轉送至代理程式聊天管線。

  </Accordion>

  <Accordion title="已刪除或無效的 Matrix 裝置">
    若 `verify status` 顯示目前裝置已不在主伺服器的清單中，請建立新的 OpenClaw Matrix 裝置。若使用密碼登入：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    若使用權杖驗證，請在 Matrix 用戶端或管理介面中建立新的存取權杖，然後更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    請將 `assistant` 替換為失敗命令中的帳號 ID，若為預設帳號則省略 `--account`。

  </Accordion>

  <Accordion title="裝置維護">
    舊的 OpenClaw 管理裝置可能會逐漸累積。列出並清除：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="密碼學儲存區">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 密碼學路徑，並以 `fake-indexeddb` 作為 IndexedDB 轉接層。密碼學狀態會持久儲存至 `crypto-idb-snapshot.json`（採用嚴格的檔案權限）。

    加密的執行階段狀態位於 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`，其中包含同步儲存區、密碼學儲存區、復原金鑰、IDB 快照、討論串繫結及啟動驗證狀態。當權杖變更但帳號身分維持不變時，OpenClaw 會重複使用最佳的現有根目錄，讓先前的狀態仍保持可見。

    單一較舊的權杖雜湊根目錄可能是正常的權杖輪替延續路徑。如果 OpenClaw 記錄 `matrix: multiple populated token-hash storage roots detected`，請檢查帳號目錄，並僅在確認選定的作用中根目錄狀況正常後，才封存過時的同層根目錄。建議將過時的根目錄移至 `_archive/` 目錄，而不要立即刪除。

  </Accordion>
</AccordionGroup>

## 個人資料管理

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

請在一次呼叫中同時傳入這兩個選項。Matrix 可直接接受 `mxc://` 頭像 URL；傳入 `http://`/`https://` 時，會先上傳檔案，再將解析後的 `mxc://` URL 儲存至 `channels.matrix.avatarUrl`（或各帳號的覆寫設定）。

## 討論串

Matrix 對自動回覆與訊息工具傳送都支援原生討論串。兩個彼此獨立的設定控制其行為：

### 工作階段路由（`sessionScope`）

`dm.sessionScope` 決定如何將 Matrix 私訊聊天室對應至 OpenClaw 工作階段：

- `"per-user"`（預設）：與同一個路由對象的所有私訊聊天室共用一個工作階段。
- `"per-room"`：每個 Matrix 私訊聊天室都有自己的工作階段鍵，即使對象相同也一樣。

明確的對話綁定一律優先於 `sessionScope`；已綁定的聊天室與討論串會維持其選定的目標工作階段。

### 回覆討論串（`threadReplies`）

`threadReplies` 決定機器人要在哪裡發佈回覆：

- `"off"`：回覆位於頂層。傳入的討論串訊息仍留在父工作階段。
- `"inbound"`：僅當傳入訊息原本已位於該討論串中時，才在討論串內回覆。
- `"always"`：在以觸發訊息為根的討論串內回覆；從第一次觸發開始，該對話會經由相符的討論串範圍工作階段進行路由。

`dm.threadReplies` 僅針對私訊覆寫此設定，例如讓聊天室討論串彼此隔離，同時讓私訊保持非討論串形式。

### 討論串繼承與斜線命令

- 傳入的討論串訊息會將討論串根訊息納入額外的代理程式情境。
- 訊息工具傳送至相同聊天室（或相同私訊使用者目標）時，會自動繼承目前的 Matrix 討論串，除非明確提供 `threadId`。
- 僅當目前工作階段中繼資料證明是同一個 Matrix 帳號上的同一位私訊對象時，才會重用私訊使用者目標；否則 OpenClaw 會退回一般的使用者範圍路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及綁定討論串的 `/acp spawn`，皆可在 Matrix 聊天室和私訊中使用。
- 當 `threadBindings.spawnSessions` 啟用時，頂層 `/focus` 會建立新的 Matrix 討論串，並將其綁定至目標工作階段。
- 在現有 Matrix 討論串內執行 `/focus` 或 `/acp spawn --thread here`，會直接綁定該討論串。

當 OpenClaw 偵測到某個 Matrix 私訊聊天室與同一共用工作階段上的另一個私訊聊天室發生衝突時，會發佈一次性的 `m.notice`，指出可使用 `/focus` 作為避開方式，並建議變更 `dm.sessionScope`。此通知僅在啟用討論串綁定時出現。

## ACP 對話綁定

Matrix 聊天室、私訊和現有 Matrix 討論串都可成為持久的 ACP 工作區，且不需變更聊天介面。

快速操作流程：

- 在要繼續使用的 Matrix 私訊、聊天室或現有討論串內執行 `/acp spawn codex --bind here`。
- 在頂層私訊或聊天室中，目前的私訊／聊天室會維持為聊天介面，之後的訊息會路由至新建立的 ACP 工作階段。
- 在現有討論串內，`--bind here` 會直接綁定目前討論串。
- `/new` 和 `/reset` 會直接重設同一個已綁定的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除綁定。

`--bind here` 不會建立子 Matrix 討論串。`threadBindings.spawnSessions` 會控管 `/acp spawn --thread auto|here`，因為在這些情況下 OpenClaw 需要建立或綁定子討論串。

### 討論串綁定設定

Matrix 會繼承 `session.threadBindings` 的全域預設值，並支援各頻道覆寫：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`：同時控管子代理程式與 ACP 討論串工作階段的建立。
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`：僅針對子代理程式或僅針對 ACP 建立的較窄範圍覆寫。
- `threadBindings.defaultSpawnContext`

Matrix 綁定討論串的工作階段建立功能預設為啟用。設定 `threadBindings.spawnSessions: false`，可阻止頂層 `/focus` 和 `/acp spawn --thread auto|here` 建立或綁定 Matrix 討論串。當原生子代理程式討論串建立作業不應分支父對話記錄時，請設定 `threadBindings.defaultSpawnContext: "isolated"`。

## 回應

Matrix 支援傳出回應、傳入回應通知和確認回應。

傳出回應工具由 `channels.matrix.actions.reactions` 控管：

- `react` 會對 Matrix 事件新增回應。
- `reactions` 會列出 Matrix 事件目前的回應摘要。
- `emoji=""` 會移除機器人在該事件上的所有自身回應。
- `remove: true` 只會移除機器人的指定表情符號回應。

**解析順序**（最先定義的值優先）：

| 設定                    | 順序                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | 各帳號 -> 頻道 -> `messages.ackReaction` -> 代理程式身分表情符號備援                |
| `ackReactionScope`      | 各帳號 -> 頻道 -> `messages.ackReactionScope` -> 預設 `"group-mentions"`            |
| `reactionNotifications` | 各帳號 -> 頻道 -> 預設 `"own"`                                                      |

當新增的 `m.reaction` 事件以機器人撰寫的 Matrix 訊息為目標時，`reactionNotifications: "own"` 會轉送這些事件；`"off"` 會停用回應系統事件。移除回應不會合成為系統事件，因為 Matrix 會將其呈現為撤銷，而不是獨立的 `m.reaction` 移除事件。

## 歷史記錄情境

- 當聊天室訊息觸發代理程式時，`channels.matrix.historyLimit` 控制要將多少則最近的聊天室訊息納入 `InboundHistory`。若未設定，則退回 `messages.groupChat.historyLimit`；若兩者皆未設定，有效預設值為 `0`（停用）。
- Matrix 聊天室歷史記錄僅限聊天室；私訊仍使用一般工作階段歷史記錄。
- 聊天室歷史記錄僅包含待處理訊息：OpenClaw 會緩衝尚未觸發回覆的聊天室訊息，然後在提及或其他觸發條件出現時，擷取該視窗的快照。
- 目前的觸發訊息不會納入 `InboundHistory`；在該輪中，它仍保留於主要傳入內容。
- 重試相同的 Matrix 事件時，會重用原始歷史記錄快照，而不會向前漂移至較新的聊天室訊息。

## 情境可見性

Matrix 支援共用的 `contextVisibility` 控制項，用於擷取的回覆文字、討論串根訊息和待處理歷史記錄等補充聊天室情境。

- `contextVisibility: "all"` 是預設值。補充情境會依收到的內容保留。
- `contextVisibility: "allowlist"` 會將補充情境篩選為通過作用中聊天室／使用者允許清單檢查的傳送者。
- `contextVisibility: "allowlist_quote"` 的行為與 `allowlist` 相同，但仍會保留一則明確引用的回覆。

這只影響補充情境的可見性，不影響傳入訊息本身是否能觸發回覆。觸發授權仍來自 `groupPolicy`、`groups`、`groupAllowFrom` 和私訊原則設定。

## 私訊與聊天室原則

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

若要完全停用私訊，同時讓聊天室繼續運作，請設定 `dm.enabled: false`：

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

如需提及控管和允許清單行為，請參閱[群組](/zh-TW/channels/groups)。

Matrix 私訊的配對範例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未核准的 Matrix 使用者在核准前持續傳送訊息，OpenClaw 會重用同一個待處理配對碼，並可能在短暫冷卻時間後傳送提醒回覆，而不是產生新的配對碼。

如需共用私訊配對流程和儲存配置，請參閱[配對](/zh-TW/channels/pairing)。

## 直接聊天室修復

如果直接訊息狀態發生偏移，OpenClaw 最終可能會留下過時的 `m.direct` 對應，指向舊的單人聊天室，而不是目前使用中的私訊。檢查某個對象目前的對應：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

進行修復：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

兩個命令皆接受 `--account <id>`，以支援多帳號設定。修復流程會：

- 優先使用已在 `m.direct` 中對應的嚴格一對一私訊
- 若無，則退回使用目前已加入、且與該使用者之間的任何嚴格一對一私訊
- 如果不存在狀況正常的私訊，則建立新的直接聊天室並重寫 `m.direct`

此流程不會自動刪除舊聊天室。它會選取狀況正常的私訊並更新對應，讓之後的 Matrix 傳送、驗證通知和其他直接訊息流程指向正確的聊天室。

## 執行核准

Matrix 可作為原生核准用戶端。請在 `channels.matrix.execApprovals` 下設定（或使用 `channels.matrix.accounts.<account>.execApprovals` 進行各帳號覆寫）：

- `enabled`：透過 Matrix 原生提示傳送核准要求。未設定或設為 `"auto"` 時，只要能解析出至少一位核准者，就會自動啟用；設為 `false` 則明確停用。
- `approvers`：允許核准執行要求的 Matrix 使用者 ID（`@owner:example.org`）。若未設定，則退回 `channels.matrix.dm.allowFrom`。
- `target`：提示的傳送位置。`"dm"`（預設）傳送至核准者私訊；`"channel"` 傳送至來源聊天室或私訊；`"both"` 則兩者都傳送。
- `agentFilter` / `sessionFilter`：選用的允許清單，用於指定哪些代理程式／工作階段會觸發 Matrix 傳送。

不同核准類型的授權方式略有差異：

- **執行核准**使用 `execApprovals.approvers`，若未設定則退回 `dm.allowFrom`。
- **外掛核准**僅透過 `dm.allowFrom` 授權。

兩種核准類型共用 Matrix 回應捷徑和訊息更新。核准者會在主要核准訊息上看到回應捷徑：

- ✅ 允許一次
- ❌ 拒絕
- ♾️ 永遠允許（當有效的執行原則允許時）

備援斜線命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的核准者可以核准或拒絕。執行核准的頻道傳送會包含命令文字，因此只應在受信任的聊天室中啟用 `channel` 或 `both`。

相關資訊：[執行核准](/zh-TW/tools/exec-approvals)。

## 斜線命令

斜線命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在私訊中使用。在聊天室中，OpenClaw 也能辨識以機器人自身 Matrix 提及為前綴的命令，因此 `@bot:server /new` 無需自訂提及規則運算式即可觸發命令路徑。這可讓機器人回應 Element 和類似用戶端所發出的聊天室式 `@mention /command` 貼文；這些貼文通常是在使用者輸入命令前，使用 Tab 鍵自動完成機器人名稱時產生。

授權規則仍然適用：命令傳送者必須符合與一般訊息相同的私訊或聊天室允許清單／擁有者原則。

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

- 除非具名帳戶覆寫設定，否則頂層的 `channels.matrix` 值會作為具名帳戶的預設值。
- 使用 `groups.<room>.account` 將繼承的房間項目限定至特定帳戶。未設定 `account` 的項目會在各帳戶間共用；若預設帳戶是在頂層設定，`account: "default"` 仍然有效。

**預設帳戶選擇：**

- 設定 `defaultAccount`，以選擇隱含路由、探測及命令列介面指令優先使用的具名帳戶。
- 如果你有多個帳戶，且其中一個帳戶的名稱確實是 `default`，即使未設定 `defaultAccount`，OpenClaw 也會隱含使用該帳戶。
- 若有多個具名帳戶但未選擇預設帳戶，命令列介面指令會拒絕猜測——請設定 `defaultAccount` 或傳入 `--account <id>`。
- 只有在頂層 `channels.matrix.*` 區塊的驗證資訊完整時（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），該區塊才會被視為隱含的 `default` 帳戶。一旦快取的憑證足以完成驗證，具名帳戶仍可透過 `homeserver` + `userId` 被探索。

**提升：**

- 當 OpenClaw 在修復或設定期間將單一帳戶設定提升為多帳戶設定時，若已有具名帳戶，或 `defaultAccount` 已指向某個帳戶，便會保留該帳戶。只有 Matrix 驗證／啟動設定鍵會移至提升後的帳戶；共用的傳遞政策設定鍵會保留在頂層。

共用的多帳戶模式請參閱[設定參考](/zh-TW/gateway/config-channels#multi-account-all-channels)。

## 私有／區域網路主伺服器

為了防範 SSRF，OpenClaw 預設會封鎖私有／內部 Matrix 主伺服器，除非你為各帳戶明確啟用。

如果你的主伺服器在 localhost、區域網路／Tailscale IP 或內部主機名稱上執行，請為該帳戶啟用 `network.dangerouslyAllowPrivateNetwork`：

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

此明確啟用僅允許受信任的私有／內部目標。像 `http://matrix.example.org:8008` 這類公用明文主伺服器仍會遭到封鎖。請盡可能優先使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要明確的對外 HTTP(S) Proxy，請設定 `channels.matrix.proxy`：

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

具名帳戶可以使用 `channels.matrix.accounts.<id>.proxy` 覆寫頂層預設值。OpenClaw 會將相同的 Proxy 設定用於執行階段 Matrix 流量及帳戶狀態探測。

## 目標解析

凡是 OpenClaw 要求提供房間或使用者目標之處，Matrix 都接受以下目標格式：

- 使用者：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房間：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 別名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房間 ID 區分大小寫。設定明確的傳遞目標、排程工作、綁定或允許清單時，請使用 Matrix 中完全相同的房間 ID 大小寫。OpenClaw 會將內部工作階段金鑰正規化後儲存，因此這些小寫金鑰並非 Matrix 傳遞 ID 的可靠來源。

即時目錄查詢會使用已登入的 Matrix 帳號：

- 使用者查詢會查詢該家伺服器上的 Matrix 使用者目錄。
- 房間查詢可直接接受明確的房間 ID 與別名。依已加入房間的名稱查詢僅盡力而為，而且只有在設定 `dangerouslyAllowNameMatching: true` 時，才會套用於執行階段的房間允許清單。
- 如果房間名稱無法解析為 ID 或別名，執行階段解析允許清單時會忽略該名稱。

## 設定參考

允許清單型的使用者欄位（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 使用者 ID（最安全）。預設會忽略非 ID 項目。如果設定 `dangerouslyAllowNameMatching: true`，系統會在啟動時，以及監控程式執行期間允許清單變更時，解析與 Matrix 目錄顯示名稱完全相符的項目；無法解析的項目會在執行階段遭到忽略。

房間允許清單金鑰（`groups`、舊版 `rooms`）應為房間 ID 或別名。預設會忽略純房間名稱金鑰；`dangerouslyAllowNameMatching: true` 會恢復針對已加入房間名稱的盡力查詢。

### 帳號與連線

- `enabled`：啟用或停用此頻道。
- `name`：帳號的選用顯示標籤。
- `defaultAccount`：設定多個 Matrix 帳號時偏好的帳號 ID。
- `accounts`：具名的各帳號覆寫設定。頂層 `channels.matrix` 值會繼承為預設值。
- `homeserver`：家伺服器 URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允許此帳號連線至 `localhost`、區域網路/Tailscale IP 或內部主機名稱。
- `proxy`：Matrix 流量所用的選用 HTTP(S) Proxy URL。支援各帳號覆寫。
- `userId`：完整的 Matrix 使用者 ID（`@bot:example.org`）。
- `accessToken`：權杖式驗證所用的存取權杖。環境變數/檔案/執行提供者皆支援純文字與 SecretRef 值（[密鑰管理](/zh-TW/gateway/secrets)）。
- `password`：密碼式登入所用的密碼。支援純文字與 SecretRef 值。
- `deviceId`：明確的 Matrix 裝置 ID。
- `deviceName`：密碼登入時使用的裝置顯示名稱。
- `avatarUrl`：為個人資料同步與 `profile set` 更新而儲存的本人頭像 URL。
- `initialSyncLimit`：啟動同步期間擷取的事件數量上限。

### 加密

- `encryption`：啟用端對端加密。預設值：`false`。
- `startupVerification`：`"if-unverified"`（啟用端對端加密時的預設值）或 `"off"`。當此裝置尚未驗證時，啟動時自動要求自我驗證。
- `startupVerificationCooldownHours`：下次自動啟動要求之前的冷卻時間。預設值：`24`。

### 存取與政策

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。預設值：`"allowlist"`。
- `groupAllowFrom`：房間流量的使用者 ID 允許清單。
- `mentionPatterns`：房間提及的限定範圍正規表示式模式。物件格式為 `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`。控制已設定的 `agents.list[].groupChat.mentionPatterns` 是否套用至各房間。
- `dm.enabled`：設為 `false` 時，忽略所有私訊。預設值：`true`。
- `dm.policy`：`"pairing"`（預設）、`"allowlist"`、`"open"` 或 `"disabled"`。在機器人加入房間並將其分類為私訊後套用；不影響邀請處理。
- `dm.allowFrom`：私訊流量的使用者 ID 允許清單。
- `dm.sessionScope`：`"per-user"`（預設）或 `"per-room"`。
- `dm.threadReplies`：僅限私訊的回覆討論串覆寫設定（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受其他已設定 Matrix 機器人帳號傳送的訊息（`true` 或 `"mentions"`）。
- `allowlistOnly`：設為 `true` 時，強制將所有使用中的私訊政策（`"disabled"` 除外）及 `"open"` 群組政策改為 `"allowlist"`。不會變更 `"disabled"` 政策。
- `dangerouslyAllowNameMatching`：設為 `true` 時，允許對使用者允許清單項目執行 Matrix 顯示名稱目錄查詢，並對房間允許清單金鑰執行已加入房間名稱查詢。建議使用完整的 `@user:server` ID，以及房間 ID 或別名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。預設值：`"off"`。套用至每個 Matrix 邀請，包括私訊形式的邀請。
- `autoJoinAllowlist`：當 `autoJoin` 為 `"allowlist"` 時允許的房間/別名。別名項目會依家伺服器解析，而非依受邀房間宣告的狀態解析。
- `contextVisibility`：補充內容可見性（預設為 `"all"`，另有 `"allowlist"`、`"allowlist_quote"`）。

### 回覆行為

- `replyToMode`：`"off"`（預設）、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`（除非明確設定，否則頂層預設值會解析為 `"inbound"`）、`"inbound"` 或 `"always"`。
- `threadBindings`：討論串綁定工作階段路由與生命週期的各頻道覆寫設定。
- `streaming`：`"off"`（預設）、`"partial"`、`"quiet"`、`"progress"`，或物件格式 `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`true` <-> `"partial"`，`false` <-> `"off"`。
- `blockStreaming`：設為 `true` 時，已完成的助理區塊會保留為個別的進度訊息。預設值：`false`。
- `markdown`：外送文字的選用 Markdown 轉譯設定。
- `responsePrefix`：附加至外送回覆前方的選用字串。
- `textChunkLimit`：當 `chunkMode: "length"` 時，外送分段的字元數。預設值：`4000`。
- `chunkMode`：`"length"`（預設，依字元數分割）或 `"newline"`（於行邊界分割）。
- `historyLimit`：房間訊息觸發代理程式時，作為 `InboundHistory` 納入的近期房間訊息數量。若未設定則使用 `messages.groupChat.historyLimit`；實際預設值為 `0`（停用）。
- `mediaMaxMb`：外送與傳入處理的媒體大小上限，以 MB 為單位。預設值：`20`。

### 回應設定

- `ackReaction`：此頻道/帳號的確認回應覆寫設定。
- `ackReactionScope`：範圍覆寫設定（預設為 `"group-mentions"`，另有 `"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：傳入回應通知模式（預設為 `"own"`，另有 `"off"`）。

### 工具與各房間覆寫設定

- `actions`：各動作的工具管制（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：各房間政策對照表。解析後，工作階段識別會使用穩定的房間 ID。（`rooms` 是舊版別名。）
  - `groups.<room>.account`：將一個繼承的房間項目限制為特定帳號。
  - `groups.<room>.enabled`：各房間開關。設為 `false` 時，會忽略該房間，如同它不在對照表中。
  - `groups.<room>.requireMention`：各房間對頻道層級提及要求的覆寫設定。
  - `groups.<room>.allowBots`：各房間對頻道層級設定的覆寫（`true` 或 `"mentions"`）。
  - `groups.<room>.botLoopProtection`：各房間對機器人之間迴圈保護額度的覆寫設定。
  - `groups.<room>.users`：各房間傳送者允許清單。
  - `groups.<room>.tools`：各房間工具允許/拒絕覆寫設定。
  - `groups.<room>.autoReply`：各房間提及管制覆寫設定。`true` 會停用該房間的提及要求；`false` 則會強制重新啟用。
  - `groups.<room>.skills`：各房間 Skills 篩選器。
  - `groups.<room>.systemPrompt`：各房間系統提示詞片段。

### 執行核准設定

- `execApprovals.enabled`：透過 Matrix 原生提示傳遞執行核准要求。
- `execApprovals.approvers`：允許核准的 Matrix 使用者 ID。若未設定則使用 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（預設）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用於傳遞的選用代理程式/工作階段允許清單。

## 相關內容

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及管制
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
