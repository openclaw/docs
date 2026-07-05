---
read_when:
    - 在 OpenClaw 中設定 Matrix
    - 設定 Matrix E2EE 與驗證
summary: 矩陣支援狀態、設定與組態範例
title: 矩陣
x-i18n:
    generated_at: "2026-07-05T11:02:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是可下載的頻道外掛（`@openclaw/matrix`），建構於官方的 `matrix-js-sdk`。它支援私訊、房間、討論串、媒體、回應、投票、位置和 E2EE。

## 安裝

```bash
openclaw plugins install @openclaw/matrix
```

裸外掛規格會先嘗試 ClawHub，接著退回 npm。使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `npm:@openclaw/matrix` 強制指定來源。從本機 checkout 安裝：`openclaw plugins install ./path/to/local/matrix-plugin`。

`plugins install` 會註冊並啟用外掛；不需要另外執行 `enable` 步驟。頻道在完成下方設定前仍不會做任何事。一般安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 設定

1. 在你的 homeserver 上建立 Matrix 帳號。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 設定 `channels.matrix`。
3. 重新啟動閘道。
4. 與 bot 開始私訊，或邀請它加入房間。只有 [`autoJoin`](#auto-join) 允許時，新的邀請才會生效。

### 互動式設定

```bash
openclaw channels add
openclaw configure --section channels
```

精靈會詢問 homeserver URL、驗證方式（token 或密碼）、使用者 ID（僅密碼驗證）、選用的裝置名稱、是否啟用 E2EE，以及房間存取/自動加入。如果相符的 `MATRIX_*` 環境變數已存在且帳號沒有已儲存的驗證，精靈會提供環境變數捷徑。儲存 allowlist 前，請先使用 `openclaw channels resolve --channel matrix "Project Room"` 解析房間名稱。在精靈中啟用 E2EE 會執行與 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的 bootstrap。

### 最小設定

以 token 為基礎：

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

以密碼為基礎（首次登入後會快取 token）：

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

`channels.matrix.autoJoin` 預設為 `"off"`：在你手動加入前，bot 不會出現在新邀請建立的新房間或私訊中。OpenClaw 無法在邀請當下判斷邀請是私訊還是群組，因此每個邀請都會先經過 `autoJoin`；`dm.policy` 只會在之後套用，也就是 bot 已加入且房間已分類之後。

<Warning>
設定 `autoJoin: "allowlist"` 加上 `autoJoinAllowlist` 以限制接受的邀請，或設定 `autoJoin: "always"` 接受每個邀請。

`autoJoinAllowlist` 只接受 `!roomId:server`、`#alias:server` 或 `*`。純房間名稱會被拒絕；別名會依 homeserver 解析，而不是依受邀房間宣稱的狀態解析。
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

### Allowlist 目標格式

- 私訊（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。預設會忽略顯示名稱（可變）；只有在明確需要顯示名稱相容性時，才設定 `dangerouslyAllowNameMatching: true`。
- 房間 allowlist 鍵（`groups`，舊版別名 `rooms`）：使用 `!room:server` 或 `#alias:server`。除非設定 `dangerouslyAllowNameMatching: true`，否則會忽略純名稱。
- 邀請 allowlist（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。純名稱一律會被拒絕。

### 帳號 ID 正規化

精靈會將易讀名稱轉換為正規化帳號 ID（`Ops Bot` -> `ops-bot`）。標點符號會在具範圍的環境變數名稱中以十六進位逸出，因此帳號不會碰撞：`-`（0x2D）會變成 `_X2D_`，所以 `ops-prod` 會對應到環境變數前綴 `MATRIX_OPS_X2D_PROD_`。

### 快取的憑證

Matrix 會將憑證快取在 `~/.openclaw/credentials/matrix/` 下：預設帳號使用 `credentials.json`，具名帳號使用 `credentials-<account>.json`。當快取的憑證存在時，即使設定檔中沒有 `accessToken`，OpenClaw 也會將 Matrix 視為已設定；這涵蓋設定流程、`openclaw doctor` 和頻道狀態探測。

### 環境變數

由設定鍵支援的環境變數，會在等效設定鍵未設定時使用。預設帳號使用無前綴名稱；具名帳號會在後綴前插入帳號 token（請參閱[正規化](#account-id-normalization)）。

| 預設帳號              | 具名帳號（`<ID>` = 帳號 token） |
| --------------------- | -------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`         |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`       |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`            |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`           |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`          |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`        |

對於帳號 `ops`，名稱會變成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，以此類推。`MATRIX_HOMESERVER`（以及任何具範圍的 `*_HOMESERVER` 變體）不能從工作區 `.env` 設定；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

<Note>
復原金鑰不是由設定支援的環境變數：OpenClaw 永遠不會自行從環境讀取它。命令列介面指引文字會建議透過名為 `MATRIX_RECOVERY_KEY` 的 shell 變數傳入預設帳號的復原金鑰，或對具名帳號使用 `MATRIX_RECOVERY_KEY_<ID>`（純大寫帳號 ID，無十六進位逸出）- 請參閱[使用復原金鑰驗證此裝置](#verify-this-device-with-a-recovery-key)。
</Note>

## 設定範例

包含私訊配對、房間 allowlist 和 E2EE 的實用基準設定：

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

Matrix 回覆串流是選擇啟用的。`streaming` 控制 OpenClaw 如何傳送進行中的助理回覆；`blockStreaming` 控制每個完成的區塊是否保留為自己的 Matrix 訊息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留即時答案預覽，但隱藏中途工具/進度行，請使用物件形式：

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

- `progress.label`：自訂標籤，`"auto"`/未設定時會選擇已設定或內建標籤，或使用 `false` 隱藏它。
- `progress.labels`：只有當 `label` 為 `"auto"` 或未設定時使用的候選項。
- `progress.maxLines`：草稿中保留的最大滾動進度行數；超過後會裁剪較舊的行。
- `progress.maxLineChars`：截斷前每行精簡進度的最大字元數。
- `progress.toolProgress`：為 `true`（預設）時，即時工具/進度活動會出現在草稿中。

| `streaming`       | 行為                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（預設）   | 等待完整回覆後一次傳送。`true` <-> `"partial"`，`false` <-> `"off"`。                                                                                |
| `"partial"`       | 模型撰寫目前區塊時，就地編輯一則一般文字訊息。標準用戶端可能會在第一次預覽時通知，而不是在最後編輯時通知。                                         |
| `"quiet"`         | 與 `"partial"` 相同，但訊息是非通知型 notice。當每位使用者的推播規則符合最終編輯時，收件者會收到一次通知（見下方）。                              |
| `"progress"`      | 使用進度草稿傳送個別精簡進度行。                                                                                                                     |

`blockStreaming`（預設 `false`）與 `streaming` 獨立：

| `streaming`             | `blockStreaming: true`                            | `blockStreaming: false`（預設）                 |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `"partial"` / `"quiet"` | 目前區塊使用即時草稿，已完成區塊保留為訊息        | 目前區塊使用即時草稿，並在原處最終化            |
| `"off"`                 | 每個完成區塊各傳送一則會通知的 Matrix 訊息        | 完整回覆傳送一則會通知的 Matrix 訊息            |

注意事項：

- 如果預覽超過 Matrix 的每事件大小限制，OpenClaw 會停止預覽串流並退回只傳送最終內容。
- 媒體回覆一律正常傳送附件；如果過期預覽無法安全重用，OpenClaw 會在傳送最終媒體回覆前將其撤回。
- 啟用預覽串流時，工具進度預覽更新預設為開啟。設定 `streaming.preview.toolProgress: false` 可保留答案文字的預覽編輯，但讓工具進度走一般傳送路徑。
- 預覽編輯會產生額外 Matrix API 呼叫。若要最保守的速率限制設定，請維持 `streaming: "off"`。

## 語音訊息

傳入的 Matrix 語音備註會在房間提及閘門前先轉錄，因此在 `requireMention: true` 房間中，說出 bot 名稱的語音備註可以觸發代理，而代理取得的是逐字稿，不只是音訊附件佔位符。

Matrix 使用 `tools.media.audio` 下的共用音訊媒體提供者，例如 OpenAI `gpt-4o-mini-transcribe`。提供者設定與限制請參閱[媒體工具總覽](/zh-TW/tools/media-overview)。

- `m.audio` 事件和 MIME 類型為 `audio/*` 的 `m.file` 事件符合資格。
- 在加密房間中，OpenClaw 會先透過現有 Matrix 媒體路徑解密附件，再進行轉錄。
- 逐字稿會在代理提示中標記為機器產生且不受信任。
- 附件會標記為已轉錄，因此下游媒體工具不會再次轉錄它。
- 設定 `tools.media.audio.enabled: false` 可全域停用音訊轉錄。

## 核准中繼資料

Matrix 原生核准提示是一般 `m.room.message` 事件，OpenClaw 專屬內容位於 `com.openclaw.approval` 鍵下。標準用戶端仍會呈現文字本文；支援 OpenClaw 的用戶端可以讀取結構化的核准 ID、種類、狀態、決策和 exec/外掛詳細資料。

當提示太長而無法放入單一 Matrix 事件時，OpenClaw 會分割可見文字，並只將 `com.openclaw.approval` 附加到第一個分段。允許/拒絕回應會綁定到第一個事件，因此長提示會與單一事件提示保留相同的核准目標。

### 安靜最終預覽的自架推播規則

`streaming: "quiet"` 只會在區塊或回合最終確定後通知收件者 - 每位使用者的推播規則必須符合最終預覽標記。完整作法請參閱 [Matrix 安靜預覽推播規則](/zh-TW/channels/matrix-push-rules)。

## 機器人對機器人聊天室

預設情況下，來自其他已設定 OpenClaw Matrix 帳號的 Matrix 訊息會被忽略。使用 `allowBots` 可刻意允許代理之間的流量：

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

- `allowBots: true` 會接受來自允許聊天室與私訊中其他已設定 Matrix 機器人帳號的訊息。
- `allowBots: "mentions"` 只會在聊天室中可見地提及此機器人時接受這些訊息；私訊仍一律允許。
- `groups.<room>.allowBots` 會覆寫單一聊天室的帳號層級設定。
- 已接受的已設定機器人訊息會使用共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。設定 `channels.defaults.botLoopProtection`，再用 `channels.matrix.botLoopProtection` 依帳號覆寫，或用 `channels.matrix.groups.<room>.botLoopProtection` 依聊天室覆寫。
- OpenClaw 仍會忽略來自相同 Matrix 使用者 ID 的訊息，以避免自我回覆迴圈。
- Matrix 沒有原生機器人旗標；OpenClaw 會把「機器人撰寫」視為「由此 OpenClaw 閘道上的另一個已設定 Matrix 帳號傳送」。

在共用聊天室中啟用機器人對機器人流量時，請使用嚴格的聊天室允許清單與提及需求。

## 加密與驗證

在加密（E2EE）聊天室中，外送圖片事件會使用 `thumbnail_file`，因此圖片預覽會與完整附件一起加密；未加密聊天室則使用一般的 `thumbnail_url`。不需要任何設定 - 外掛會自動偵測 E2EE 狀態。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整診斷）、`--json`（機器可讀輸出），以及 `--account <id>`（多帳號設定）。預設輸出會保持精簡。

### 啟用加密

```bash
openclaw matrix encryption setup
```

會啟動秘密儲存與交叉簽署，必要時建立聊天室金鑰備份，接著列印狀態與後續步驟。實用旗標：

- `--recovery-key <key>` 在啟動前套用復原金鑰（建議使用下方的 stdin 形式）
- `--force-reset-cross-signing` 捨棄目前的交叉簽署身分並建立新的身分（僅限刻意使用）

對於新帳號，請在建立時啟用 E2EE：

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

`verify status` 會回報三個獨立的信任訊號（`--verbose` 會顯示全部）：

- `Locally trusted`：僅受此用戶端信任
- `Cross-signing verified`：SDK 回報已透過交叉簽署驗證
- `Signed by owner`：由你自己的自簽署金鑰簽署（僅供診斷）

只有在 `Cross-signing verified` 為 `yes` 時，`Verified by owner` 才會是 `yes`；僅有本機信任或擁有者簽章並不足夠。

`--allow-degraded-local-state` 會在不先準備 Matrix 帳號的情況下回傳盡力而為的診斷；適合離線或部分設定的探測。

### 使用復原金鑰驗證此裝置

請透過 stdin 管線傳入復原金鑰，而不是在命令列上傳入：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

此命令會回報三種狀態：

- `Recovery key accepted`：Matrix 已接受此金鑰，用於秘密儲存或裝置信任。
- `Backup usable`：聊天室金鑰備份可用受信任的復原材料載入。
- `Device verified by owner`：此裝置具有完整的 Matrix 交叉簽署身分信任。

當完整身分信任尚未完成時，即使復原金鑰已解鎖備份材料，也會以非零狀態結束。此時請從另一個 Matrix 用戶端完成自我驗證：

```bash
openclaw matrix verify self
```

`verify self` 會等待 `Cross-signing verified: yes` 後才成功結束。使用 `--timeout-ms <ms>` 可調整等待時間。

字面金鑰形式 `openclaw matrix verify device "<recovery-key>"` 也可以使用，但金鑰會進入 shell 歷史紀錄。

### 啟動或修復交叉簽署

```bash
openclaw matrix verify bootstrap
```

這是加密帳號的修復/設定命令。依序會：

- 啟動秘密儲存，並在可能時重用既有復原金鑰
- 啟動交叉簽署並上傳缺少的公開金鑰
- 標記並交叉簽署目前裝置
- 若尚不存在，建立伺服器端聊天室金鑰備份

如果 homeserver 需要 UIA 才能上傳交叉簽署金鑰，OpenClaw 會先嘗試無驗證，接著嘗試 `m.login.dummy`，再嘗試 `m.login.password`（需要 `channels.matrix.password`）。

實用旗標：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用於捨棄目前的交叉簽署身分（僅限刻意使用；需要已儲存或透過 `--recovery-key-stdin` 提供的有效復原金鑰）

### 聊天室金鑰備份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 會顯示是否存在伺服器端備份，以及此裝置是否可以解密它。`backup restore` 會將已備份的聊天室金鑰匯入本機加密儲存區；若復原金鑰已在磁碟上，則省略 `--recovery-key-stdin`。

若要以新的基準取代損壞的備份（接受失去不可復原的舊歷史；若目前備份秘密無法載入，也可重新建立秘密儲存）：

```bash
openclaw matrix verify backup reset --yes
```

只有在先前的復原金鑰應刻意停止解鎖新的備份基準時，才加入 `--rotate-recovery-key`。

### 列出、要求與回應驗證

```bash
openclaw matrix verify list
```

列出所選帳號的待處理驗證要求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

從此帳號傳送驗證要求。`--own-user` 會要求自我驗證（在同一使用者的另一個 Matrix 用戶端接受提示）；`--user-id`/`--device-id`/`--room-id` 會指定其他人。`--own-user` 不能與其他目標旗標組合使用。

針對較低層級的生命週期處理 - 通常是在跟隨來自另一個用戶端的傳入要求時 - 這些命令會作用於特定要求 `<id>`（由 `verify list` 與 `verify request` 列印）：

| 命令                                       | 用途                                            |
| ------------------------------------------ | ----------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受傳入要求                                    |
| `openclaw matrix verify start <id>`        | 啟動 SAS 流程                                   |
| `openclaw matrix verify sas <id>`          | 列印 SAS 表情符號或十進位數字                   |
| `openclaw matrix verify confirm-sas <id>`  | 確認 SAS 與另一個用戶端顯示的內容相符           |
| `openclaw matrix verify mismatch-sas <id>` | 當表情符號或十進位數字不相符時拒絕 SAS          |
| `openclaw matrix verify cancel <id>`       | 取消；可選用 `--reason <text>` 與 `--code <matrix-code>` |

當驗證錨定到特定私訊聊天室時，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 與 `cancel` 都接受 `--user-id` 與 `--room-id` 作為私訊後續提示。

### 多帳號注意事項

若未使用 `--account <id>`，Matrix 命令列介面命令會使用隱含的預設帳號。若有多個具名帳號且沒有 `channels.matrix.defaultAccount`，命令會拒絕猜測並要求你選擇。當具名帳號停用或無法使用 E2EE 時，錯誤會指向該帳號的設定鍵，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="Startup behavior">
    使用 `encryption: true` 時，`startupVerification` 預設為 `"if-unverified"`。啟動時，未驗證裝置會在另一個 Matrix 用戶端要求自我驗證，並略過重複要求且套用冷卻時間（預設為 24 小時）。可用 `startupVerificationCooldownHours` 調整，或用 `startupVerification: "off"` 停用。

    啟動時也會執行保守的加密啟動流程，重用目前的秘密儲存與交叉簽署身分。若啟動狀態損壞，OpenClaw 即使沒有 `channels.matrix.password` 也會嘗試受保護的修復；若 homeserver 需要密碼 UIA，啟動會記錄警告並保持非致命。已由擁有者簽署的裝置會被保留。

    完整升級流程請參閱 [Matrix 遷移](/zh-TW/channels/matrix-migration)。

  </Accordion>

  <Accordion title="Verification notices">
    Matrix 會將驗證生命週期通知以 `m.notice` 訊息張貼到嚴格的私訊驗證聊天室中：要求、就緒（含「以表情符號驗證」指引）、開始/完成，以及可用時的 SAS（表情符號/十進位）詳細資訊。

    來自另一個 Matrix 用戶端的傳入要求會被追蹤並自動接受。對於自我驗證，OpenClaw 會自動啟動 SAS 流程，並在表情符號驗證可用後確認自己這一端 - 你仍需要在 Matrix 用戶端中比較並確認「相符」。

    驗證系統通知不會轉送到代理聊天管線。

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    如果 `verify status` 表示目前裝置已不再列於 homeserver，請建立新的 OpenClaw Matrix 裝置。對於密碼登入：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    對於權杖驗證，請在你的 Matrix 用戶端或管理介面建立新的存取權杖，然後更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    將 `assistant` 替換為失敗命令中的帳號 ID，或對預設帳號省略 `--account`。

  </Accordion>

  <Accordion title="Device hygiene">
    舊的 OpenClaw 管理裝置可能會累積。列出並修剪：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路徑，並以 `fake-indexeddb` 作為 IndexedDB shim。加密狀態會持久化到 `crypto-idb-snapshot.json`（限制性檔案權限）。

    加密執行階段狀態位於 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，並包含同步儲存區、加密儲存區、復原金鑰、IDB 快照、執行緒繫結，以及啟動驗證狀態。當權杖變更但帳號身分維持相同時，OpenClaw 會重用最佳的既有根目錄，因此先前狀態仍可見。

    單一較舊的權杖雜湊根目錄可能是正常的權杖輪替連續性路徑。如果 OpenClaw 記錄 `matrix: multiple populated token-hash storage roots detected`，請檢查帳戶目錄，並且只在確認所選的作用中根目錄狀態正常後，才封存過時的同層根目錄。建議將過時根目錄移到 `_archive/` 目錄，而不是立即刪除。

  </Accordion>
</AccordionGroup>

## 設定檔管理

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

在一次呼叫中傳入這兩個選項。Matrix 直接接受 `mxc://` 頭像 URL；傳入 `http://`/`https://` 會先上傳檔案，並將解析後的 `mxc://` URL 儲存到 `channels.matrix.avatarUrl`（或每帳戶覆寫值）。

## 執行緒

Matrix 支援自動回覆和訊息工具傳送的原生執行緒。兩個獨立控制項會控制行為：

### 工作階段路由（`sessionScope`）

`dm.sessionScope` 決定 Matrix DM 房間如何對應到 OpenClaw 工作階段：

- `"per-user"`（預設）：具有相同路由對等方的所有 DM 房間共用一個工作階段。
- `"per-room"`：每個 Matrix DM 房間都有自己的工作階段金鑰，即使是相同對等方也一樣。

明確的對話繫結一律優先於 `sessionScope`；已繫結的房間和執行緒會保留其選定的目標工作階段。

### 回覆執行緒化（`threadReplies`）

`threadReplies` 決定機器人在哪裡張貼回覆：

- `"off"`：回覆為頂層。傳入的執行緒訊息會留在父工作階段。
- `"inbound"`：只有在傳入訊息原本已在該執行緒中時，才在執行緒內回覆。
- `"always"`：在以觸發訊息為根的執行緒內回覆；該對話從第一次觸發開始，會透過相符的執行緒範圍工作階段路由。

`dm.threadReplies` 僅針對 DM 覆寫此設定，例如讓房間執行緒保持隔離，同時讓 DM 維持扁平。

### 執行緒繼承和斜線命令

- 傳入的執行緒訊息會包含執行緒根訊息作為額外的代理程式脈絡。
- 訊息工具傳送在鎖定相同房間（或相同 DM 使用者目標）時，會自動繼承目前的 Matrix 執行緒，除非提供了明確的 `threadId`。
- DM 使用者目標重用只會在目前工作階段中繼資料證明同一個 Matrix 帳戶上的相同 DM 對等方時啟用；否則 OpenClaw 會退回到一般的使用者範圍路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和繫結執行緒的 `/acp spawn` 都可在 Matrix 房間和 DM 中運作。
- 當 `threadBindings.spawnSessions` 啟用時，頂層 `/focus` 會建立新的 Matrix 執行緒，並將其繫結到目標工作階段。
- 在既有 Matrix 執行緒內執行 `/focus` 或 `/acp spawn --thread here`，會就地繫結該執行緒。

當 OpenClaw 偵測到 Matrix DM 房間與同一共用工作階段上的另一個 DM 房間衝突時，會張貼一次性的 `m.notice`，指向 `/focus` 逃生路徑並建議變更 `dm.sessionScope`。只有在執行緒繫結啟用時才會顯示此通知。

## ACP 對話繫結

Matrix 房間、DM 和既有 Matrix 執行緒可以成為持久 ACP 工作區，而不需要變更聊天介面。

快速操作員流程：

- 在要繼續使用的 Matrix DM、房間或既有執行緒內執行 `/acp spawn codex --bind here`。
- 在頂層 DM 或房間中，目前的 DM/房間會保留為聊天介面，未來訊息會路由到產生的 ACP 工作階段。
- 在既有執行緒內，`--bind here` 會就地繫結該目前執行緒。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

`--bind here` 不會建立子 Matrix 執行緒。`threadBindings.spawnSessions` 會控管 `/acp spawn --thread auto|here`，此時 OpenClaw 需要建立或繫結子執行緒。

### 執行緒繫結設定

Matrix 會繼承 `session.threadBindings` 的全域預設值，並支援每頻道覆寫：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`：控管子代理程式和 ACP 執行緒產生。
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`：針對僅子代理程式或僅 ACP 產生的較窄覆寫。
- `threadBindings.defaultSpawnContext`

Matrix 繫結執行緒的工作階段產生預設為開啟。設定 `threadBindings.spawnSessions: false` 可阻止頂層 `/focus` 和 `/acp spawn --thread auto|here` 建立/繫結 Matrix 執行緒。當原生子代理程式執行緒產生不應分叉父逐字稿時，設定 `threadBindings.defaultSpawnContext: "isolated"`。

## 反應

Matrix 支援傳出反應、傳入反應通知和確認反應。

傳出反應工具由 `channels.matrix.actions.reactions` 控管：

- `react` 會將反應新增到 Matrix 事件。
- `reactions` 會列出 Matrix 事件目前的反應摘要。
- `emoji=""` 會移除該事件上機器人自己的反應。
- `remove: true` 只會移除機器人指定的表情符號反應。

**解析順序**（第一個已定義的值勝出）：

| 設定                    | 順序                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | 每帳戶 -> 頻道 -> `messages.ackReaction` -> 代理程式身分表情符號後援               |
| `ackReactionScope`      | 每帳戶 -> 頻道 -> `messages.ackReactionScope` -> 預設 `"group-mentions"`           |
| `reactionNotifications` | 每帳戶 -> 頻道 -> 預設 `"own"`                                                      |

`reactionNotifications: "own"` 會在新增的 `m.reaction` 事件以機器人撰寫的 Matrix 訊息為目標時轉送；`"off"` 會停用反應系統事件。反應移除不會合成為系統事件，Matrix 會將這些呈現為撤回，而不是獨立的 `m.reaction` 移除。

## 歷史脈絡

- `channels.matrix.historyLimit` 控制房間訊息觸發代理程式時，會以 `InboundHistory` 納入多少最近的房間訊息。會退回到 `messages.groupChat.historyLimit`；如果兩者皆未設定，有效預設值為 `0`（停用）。
- Matrix 房間歷史僅限房間；DM 會繼續使用一般工作階段歷史。
- 房間歷史僅限待處理：OpenClaw 會緩衝尚未觸發回覆的房間訊息，然後在提及或其他觸發到達時擷取該視窗快照。
- 目前的觸發訊息不會包含在 `InboundHistory` 中；它會保留在該回合的主要傳入本文中。
- 相同 Matrix 事件的重試會重用原始歷史快照，而不是向前漂移到較新的房間訊息。

## 脈絡可見性

Matrix 支援共享的 `contextVisibility` 控制項，用於擷取的回覆文字、執行緒根和待處理歷史等補充房間脈絡。

- `contextVisibility: "all"` 是預設值。補充脈絡會依接收狀態保留。
- `contextVisibility: "allowlist"` 會篩選補充脈絡，只傳送作用中房間/使用者允許清單檢查所允許的傳送者。
- `contextVisibility: "allowlist_quote"` 的行為類似 `allowlist`，但仍會保留一則明確引用的回覆。

這只影響補充脈絡可見性，不影響傳入訊息本身是否能觸發回覆。觸發授權仍來自 `groupPolicy`、`groups`、`groupAllowFrom` 和 DM 原則設定。

## DM 和房間原則

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

若要讓 DM 完全靜音，同時保持房間運作，請設定 `dm.enabled: false`：

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

請參閱[群組](/zh-TW/channels/groups)，了解提及控管和允許清單行為。

Matrix DM 的配對範例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未核准的 Matrix 使用者在核准前持續傳訊息，OpenClaw 會重用相同的待處理配對碼，並可能在短暫冷卻後傳送提醒回覆，而不是鑄造新的代碼。

請參閱[配對](/zh-TW/channels/pairing)，了解共享的 DM 配對流程和儲存配置。

## 直接房間修復

如果直接訊息狀態漂移，OpenClaw 最終可能會有過時的 `m.direct` 對應，指向舊的單人房間，而不是即時 DM。檢查對等方目前的對應：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

這兩個命令都接受 `--account <id>` 以支援多帳戶設定。修復流程：

- 優先使用已在 `m.direct` 中對應的嚴格 1:1 DM
- 退回到目前已加入且包含該使用者的任何嚴格 1:1 DM
- 如果沒有健康的 DM，則建立新的直接房間並重寫 `m.direct`

它不會自動刪除舊房間。它會選擇健康的 DM 並更新對應，讓未來的 Matrix 傳送、驗證通知和其他直接訊息流程鎖定正確房間。

## Exec 核准

Matrix 可以作為原生核准用戶端。在 `channels.matrix.execApprovals` 下設定（或使用 `channels.matrix.accounts.<account>.execApprovals` 作為每帳戶覆寫）：

- `enabled`：透過 Matrix 原生提示傳送核准。未設定或 `"auto"` 會在至少可解析一位核准者後自動啟用；設定 `false` 可明確停用。
- `approvers`：允許核准 exec 要求的 Matrix 使用者 ID（`@owner:example.org`）。會退回到 `channels.matrix.dm.allowFrom`。
- `target`：提示傳送位置。`"dm"`（預設）傳送到核准者 DM；`"channel"` 傳送到來源房間或 DM；`"both"` 傳送到兩者。
- `agentFilter` / `sessionFilter`：可選允許清單，用於指定哪些代理程式/工作階段觸發 Matrix 傳送。

不同核准類型的授權略有不同：

- **Exec 核准**使用 `execApprovals.approvers`，並退回到 `dm.allowFrom`。
- **外掛核准**僅透過 `dm.allowFrom` 授權。

兩種類型共用 Matrix 反應捷徑和訊息更新。核准者會在主要核准訊息上看到反應捷徑：

- ✅ 允許一次
- ❌ 拒絕
- ♾️ 永遠允許（當有效 exec 原則允許時）

後援斜線命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的核准者可以核准或拒絕。Exec 核准的頻道傳送會包含命令文字；只在受信任房間中啟用 `channel` 或 `both`。

相關：[Exec 核准](/zh-TW/tools/exec-approvals)。

## 斜線命令

斜線命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在 DM 中運作。在房間中，OpenClaw 也會辨識以機器人自己的 Matrix 提及為前綴的命令，因此 `@bot:server /new` 會觸發命令路徑，而不需要自訂提及 regex；這讓機器人能回應 Element 和類似用戶端在使用者輸入命令前以 Tab 補全機器人時發出的房間風格 `@mention /command` 貼文。

授權規則仍然適用：命令傳送者必須符合與一般訊息相同的 DM 或房間允許清單/擁有者原則。

## 多帳戶

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

- 除非帳號覆寫，頂層 `channels.matrix` 值會作為具名帳號的預設值。
- 使用 `groups.<room>.account` 將繼承的聊天室項目限定到特定帳號。沒有 `account` 的項目會跨帳號共用；當預設帳號在頂層設定時，`account: "default"` 仍可運作。

**預設帳號選擇：**

- 設定 `defaultAccount` 以選擇隱含路由、探測和命令列介面命令偏好的具名帳號。
- 如果你有多個帳號，且其中一個確實命名為 `default`，即使未設定 `defaultAccount`，OpenClaw 也會隱含使用它。
- 如果有多個具名帳號且未選擇預設值，命令列介面命令會拒絕猜測 - 請設定 `defaultAccount` 或傳入 `--account <id>`。
- 只有在頂層 `channels.matrix.*` 區塊的驗證資訊完整時（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），它才會被視為隱含的 `default` 帳號。一旦快取的憑證涵蓋驗證，具名帳號仍可透過 `homeserver` + `userId` 被探索到。

**升級：**

- 當 OpenClaw 在修復或設定期間將單帳號設定升級為多帳號時，若現有具名帳號存在，或 `defaultAccount` 已指向某個帳號，它會保留該帳號。只有 Matrix 驗證/啟動鍵會移入升級後的帳號；共用的傳遞政策鍵會留在頂層。

請參閱[設定參考](/zh-TW/gateway/config-channels#multi-account-all-channels)以了解共用的多帳號模式。

## 私人/LAN 主伺服器

依預設，OpenClaw 會封鎖私人/內部 Matrix 主伺服器以提供 SSRF 保護，除非你針對每個帳號選擇加入。

如果你的主伺服器執行於 localhost、LAN/Tailscale IP 或內部主機名稱，請為該帳號啟用 `network.dangerouslyAllowPrivateNetwork`：

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

此選擇加入只允許受信任的私人/內部目標。公開的明文主伺服器（例如 `http://matrix.example.org:8008`）仍會被封鎖。盡可能偏好使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要明確的對外 HTTP(S) 代理，請設定 `channels.matrix.proxy`：

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

具名帳號可以使用 `channels.matrix.accounts.<id>.proxy` 覆寫頂層預設值。OpenClaw 會對執行階段 Matrix 流量和帳號狀態探測使用相同的代理設定。

## 目標解析

在 OpenClaw 要求聊天室或使用者目標的任何位置，Matrix 都接受這些目標形式：

- 使用者：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 聊天室：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 別名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房間 ID 區分大小寫。設定明確的傳遞目標、排程工作、綁定或允許清單時，請使用 Matrix 中完全相同大小寫的房間 ID。OpenClaw 會將內部工作階段鍵正規化後用於儲存，因此這些小寫鍵不能作為 Matrix 傳遞 ID 的可靠來源。

即時目錄查詢會使用已登入的 Matrix 帳號：

- 使用者查詢會查詢該 homeserver 上的 Matrix 使用者目錄。
- 房間查詢會直接接受明確的房間 ID 和別名。已加入房間的名稱查詢採盡力而為，且只有在設定 `dangerouslyAllowNameMatching: true` 時，才會套用到執行階段房間允許清單。
- 如果房間名稱無法解析為 ID 或別名，執行階段允許清單解析會忽略它。

## 設定參考

允許清單樣式的使用者欄位（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 使用者 ID（最安全）。非 ID 項目預設會被忽略。如果設定 `dangerouslyAllowNameMatching: true`，系統會在啟動時，以及監視器執行期間允許清單變更時，解析完全相符的 Matrix 目錄顯示名稱；無法解析的項目會在執行階段被忽略。

房間允許清單鍵（`groups`、舊版 `rooms`）應該是房間 ID 或別名。純房間名稱鍵預設會被忽略；`dangerouslyAllowNameMatching: true` 會恢復針對已加入房間名稱的盡力而為查詢。

### 帳號與連線

- `enabled`：啟用或停用此頻道。
- `name`：帳號的選用顯示標籤。
- `defaultAccount`：設定多個 Matrix 帳號時偏好的帳號 ID。
- `accounts`：具名的個別帳號覆寫。頂層 `channels.matrix` 值會作為預設值繼承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允許此帳號連線到 `localhost`、LAN/Tailscale IP 或內部主機名稱。
- `proxy`：Matrix 流量的選用 HTTP(S) Proxy URL。支援個別帳號覆寫。
- `userId`：完整 Matrix 使用者 ID（`@bot:example.org`）。
- `accessToken`：權杖式驗證的存取權杖。跨 env/file/exec 提供者支援純文字與 SecretRef 值（[祕密管理](/zh-TW/gateway/secrets)）。
- `password`：密碼式登入的密碼。支援純文字與 SecretRef 值。
- `deviceId`：明確的 Matrix 裝置 ID。
- `deviceName`：密碼登入時使用的裝置顯示名稱。
- `avatarUrl`：用於個人檔案同步與 `profile set` 更新的已儲存自我頭像 URL。
- `initialSyncLimit`：啟動同步期間擷取的事件數量上限。

### 加密

- `encryption`：啟用 E2EE。預設：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 開啟時的預設值）或 `"off"`。當此裝置尚未驗證時，會在啟動時自動要求自我驗證。
- `startupVerificationCooldownHours`：下一次自動啟動要求前的冷卻時間。預設：`24`。

### 存取與政策

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。預設：`"allowlist"`。
- `groupAllowFrom`：房間流量的使用者 ID 允許清單。
- `mentionPatterns`：房間提及的範圍化 regex 模式。物件格式為 `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`。控制已設定的 `agents.list[].groupChat.mentionPatterns` 是否依房間套用。
- `dm.enabled`：設為 `false` 時，忽略所有 DM。預設：`true`。
- `dm.policy`：`"pairing"`（預設）、`"allowlist"`、`"open"` 或 `"disabled"`。在 Bot 已加入並將房間分類為 DM 之後套用；不影響邀請處理。
- `dm.allowFrom`：DM 流量的使用者 ID 允許清單。
- `dm.sessionScope`：`"per-user"`（預設）或 `"per-room"`。
- `dm.threadReplies`：僅限 DM 的回覆串接覆寫（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受來自其他已設定 Matrix Bot 帳號的訊息（`true` 或 `"mentions"`）。
- `allowlistOnly`：設為 `true` 時，強制所有作用中的 DM 政策（`"disabled"` 除外）與 `"open"` 群組政策改為 `"allowlist"`。不會變更 `"disabled"` 政策。
- `dangerouslyAllowNameMatching`：設為 `true` 時，允許對使用者允許清單項目進行 Matrix 顯示名稱目錄查詢，並允許對房間允許清單鍵進行已加入房間名稱查詢。建議使用完整的 `@user:server` ID，以及房間 ID 或別名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。預設：`"off"`。套用於每個 Matrix 邀請，包括 DM 樣式邀請。
- `autoJoinAllowlist`：當 `autoJoin` 為 `"allowlist"` 時允許的房間/別名。別名項目會針對 homeserver 解析，而不是針對受邀房間宣稱的狀態解析。
- `contextVisibility`：補充內容可見性（預設 `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 回覆行為

- `replyToMode`：`"off"`（預設）、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`（除非明確設定，否則頂層預設會解析為 `"inbound"`）、`"inbound"` 或 `"always"`。
- `threadBindings`：執行緒綁定工作階段路由與生命週期的個別頻道覆寫。
- `streaming`：`"off"`（預設）、`"partial"`、`"quiet"`、`"progress"`，或物件形式 `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`true` <-> `"partial"`，`false` <-> `"off"`。
- `blockStreaming`：設為 `true` 時，已完成的助理區塊會保留為獨立的進度訊息。預設：`false`。
- `markdown`：外送文字的選用 Markdown 算繪設定。
- `responsePrefix`：附加在外送回覆前方的選用字串。
- `textChunkLimit`：當 `chunkMode: "length"` 時，以字元數計算的外送分段大小。預設：`4000`。
- `chunkMode`：`"length"`（預設，依字元數分割）或 `"newline"`（依行邊界分割）。
- `historyLimit`：當房間訊息觸發代理時，作為 `InboundHistory` 納入的近期房間訊息數量。會回退至 `messages.groupChat.historyLimit`；有效預設值為 `0`（停用）。
- `mediaMaxMb`：外送與內送處理的媒體大小上限，單位為 MB。預設：`20`。

### 反應設定

- `ackReaction`：此頻道/帳號的確認反應覆寫。
- `ackReactionScope`：範圍覆寫（預設 `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：內送反應通知模式（預設 `"own"`、`"off"`）。

### 工具與個別房間覆寫

- `actions`：個別動作的工具門控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：個別房間政策對應。工作階段身分會在解析後使用穩定的房間 ID。（`rooms` 是舊版別名。）
  - `groups.<room>.account`：將一個繼承的房間項目限制為特定帳號。
  - `groups.<room>.enabled`：個別房間切換。設為 `false` 時，該房間會被忽略，如同不在對應中。
  - `groups.<room>.requireMention`：頻道層級提及要求的個別房間覆寫。
  - `groups.<room>.allowBots`：頻道層級設定的個別房間覆寫（`true` 或 `"mentions"`）。
  - `groups.<room>.botLoopProtection`：Bot 對 Bot 迴圈保護預算的個別房間覆寫。
  - `groups.<room>.users`：個別房間寄件者允許清單。
  - `groups.<room>.tools`：個別房間工具允許/拒絕覆寫。
  - `groups.<room>.autoReply`：個別房間提及門控覆寫。`true` 會停用該房間的提及要求；`false` 會強制重新啟用。
  - `groups.<room>.skills`：個別房間 Skills 篩選器。
  - `groups.<room>.systemPrompt`：個別房間系統提示片段。

### Exec 核准設定

- `execApprovals.enabled`：透過 Matrix 原生提示傳遞 exec 核准。
- `execApprovals.approvers`：允許核准的 Matrix 使用者 ID。會回退至 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（預設）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：傳遞用的選用代理/工作階段允許清單。

## 相關

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及門控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
