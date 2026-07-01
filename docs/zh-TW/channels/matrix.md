---
read_when:
    - 在 OpenClaw 中設定 Matrix
    - 設定 Matrix E2EE 與驗證
summary: 矩陣支援狀態、設定與組態範例
title: 矩陣
x-i18n:
    generated_at: "2026-07-01T12:47:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是 OpenClaw 的可下載頻道外掛。
它使用官方的 `matrix-js-sdk`，並支援 DM、房間、執行緒、媒體、回應、投票、位置與 E2EE。

## 安裝

設定頻道前，先從 ClawHub 安裝 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

裸外掛規格會先嘗試 ClawHub，接著才 fallback 到 npm。若要強制指定 registry 來源，請使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

從本機 checkout 安裝：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 會註冊並啟用外掛，因此不需要另外執行 `openclaw plugins enable matrix` 步驟。不過外掛在你完成下方頻道設定前仍不會執行任何動作。一般外掛行為與安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 設定

1. 在你的 homeserver 上建立 Matrix 帳號。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 來設定 `channels.matrix`。
3. 重新啟動閘道。
4. 與 bot 開始 DM，或邀請它加入房間（請參閱 [auto-join](#auto-join) - 只有 `autoJoin` 允許時，新邀請才會進入）。

### 互動式設定

```bash
openclaw channels add
openclaw configure --section channels
```

精靈會詢問：homeserver URL、驗證方法（存取權杖或密碼）、使用者 ID（僅限密碼驗證）、選用的裝置名稱、是否啟用 E2EE，以及是否設定房間存取與自動加入。

如果相符的 `MATRIX_*` 環境變數已存在，且選取的帳號沒有儲存的驗證資料，精靈會提供環境變數捷徑。若要在儲存 allowlist 前解析房間名稱，請執行 `openclaw channels resolve --channel matrix "Project Room"`。啟用 E2EE 時，精靈會寫入設定，並執行與 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的 bootstrap。

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

以密碼為基礎（首次登入後會快取權杖）：

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

`channels.matrix.autoJoin` 預設為 `off`。使用預設值時，除非你手動加入，否則 bot 不會出現在新邀請產生的新房間或 DM 中。

OpenClaw 無法在邀請時判斷受邀房間是 DM 還是群組，因此所有邀請，包括 DM 形式的邀請，都會先經過 `autoJoin`。`dm.policy` 只會在之後套用，也就是 bot 已加入並且房間已分類之後。

<Warning>
設定 `autoJoin: "allowlist"` 加上 `autoJoinAllowlist` 以限制 bot 接受哪些邀請，或設定 `autoJoin: "always"` 以接受所有邀請。

`autoJoinAllowlist` 只接受穩定目標：`!roomId:server`、`#alias:server` 或 `*`。純房間名稱會被拒絕；alias 項目會依 homeserver 解析，而不是依受邀房間宣稱的狀態解析。
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

### Allowlist 目標格式

DM 與房間 allowlist 最好填入穩定 ID：

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。預設會忽略顯示名稱，因為它們可被變更；只有在你明確需要與顯示名稱項目相容時，才設定 `dangerouslyAllowNameMatching: true`。
- 房間 allowlist 鍵（`groups`、舊版 `rooms`）：使用 `!room:server` 或 `#alias:server`。預設會忽略純房間名稱；只有在你明確需要與已加入房間的名稱查詢相容時，才設定 `dangerouslyAllowNameMatching: true`。
- 邀請 allowlist（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。純房間名稱會被拒絕。

### 帳號 ID 正規化

精靈會將易讀名稱轉換為正規化帳號 ID。例如，`Ops Bot` 會變成 `ops-bot`。在 scoped 環境變數名稱中，標點符號會被跳脫，讓兩個帳號無法互相衝突：`-` → `_X2D_`，因此 `ops-prod` 會對應到 `MATRIX_OPS_X2D_PROD_*`。

### 快取憑證

Matrix 會將快取憑證儲存在 `~/.openclaw/credentials/matrix/` 底下：

- 預設帳號：`credentials.json`
- 命名帳號：`credentials-<account>.json`

當快取憑證存在於該位置時，即使存取權杖不在設定檔中，OpenClaw 也會將 Matrix 視為已設定。這涵蓋設定、`openclaw doctor` 與頻道狀態探測。

### 環境變數

當對應的設定鍵未設定時使用。預設帳號使用無前綴名稱；命名帳號會在 suffix 前插入帳號 ID。

| 預設帳號              | 命名帳號（`<ID>` 是正規化帳號 ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

對帳號 `ops` 而言，名稱會變成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此類推。復原金鑰環境變數會由具復原意識的命令列介面流程（`verify backup restore`、`verify device`、`verify bootstrap`）讀取，前提是你透過 `--recovery-key-stdin` 將金鑰 pipe 進去。

`MATRIX_HOMESERVER` 不能從 workspace `.env` 設定；請參閱 [Workspace `.env` 檔案](/zh-TW/gateway/security)。

## 設定範例

包含 DM 配對、房間 allowlist 與 E2EE 的實用基準：

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

Matrix 回覆串流是 opt-in。`streaming` 控制 OpenClaw 如何傳送進行中的 assistant 回覆；`blockStreaming` 控制每個完成的區塊是否保留為自己的 Matrix 訊息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留即時答案預覽，但隱藏暫時性的工具／進度行，請使用物件
形式：

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

- `progress.label`：自訂標籤、`"auto"` 或未設定以從已設定或內建標籤中選擇，或使用 `false` 隱藏標籤行。
- `progress.labels`：僅在 `label` 為 `"auto"` 或未設定時使用的候選標籤。未設定則使用內建預設值。
- `progress.maxLines`：草稿中保留的最大 rolling 進度行數。超過此限制後，較舊的行會被修剪。
- `progress.maxLineChars`：截斷前每個精簡進度行的最大字元數。
- `progress.toolProgress`：當為 `true`（預設）時，即時工具／進度活動會出現在草稿中。

| `streaming`       | 行為                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（預設） | 等待完整回覆後一次傳送。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | 在模型寫入目前區塊時，就地編輯一則一般文字訊息。標準 Matrix 用戶端可能會在第一次預覽時通知，而不是在最終編輯時通知。              |
| `"quiet"`         | 與 `"partial"` 相同，但訊息是不發送通知的 notice。收件者只有在個別使用者的 push 規則符合最終編輯時，才會收到一次通知（見下方）。 |
| `"progress"`      | 使用進度草稿傳送個別精簡進度行。                                                                                                     |

`blockStreaming` 獨立於 `streaming`：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（預設）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 目前區塊使用即時草稿，完成的區塊保留為訊息 | 目前區塊使用即時草稿，並就地 finalized |
| `"off"`                 | 每個完成的區塊各傳送一則會通知的 Matrix 訊息                     | 完整回覆傳送一則會通知的 Matrix 訊息      |

注意事項：

- 如果預覽超過 Matrix 的每事件大小限制，OpenClaw 會停止預覽串流，並 fallback 到僅最終傳送。
- 媒體回覆一律正常傳送附件。如果 stale 預覽無法再安全重用，OpenClaw 會在傳送最終媒體回覆前將其 redact。
- Matrix 預覽串流啟用時，工具進度預覽更新預設為啟用。設定 `streaming.preview.toolProgress: false` 可保留答案文字的預覽編輯，但讓工具進度維持在一般傳送路徑。
- 預覽編輯會產生額外的 Matrix API 呼叫。如果你想要最保守的 rate-limit profile，請保留 `streaming: "off"`。

## 語音訊息

傳入的 Matrix 語音 note 會在房間提及 gate 前先轉錄。這讓提到 bot 名稱的語音 note 能在 `requireMention: true` 的房間中觸發代理，並讓代理取得 transcript，而不是只有音訊附件 placeholder。

Matrix 使用在 `tools.media.audio` 底下設定的共用音訊媒體 provider，例如 OpenAI `gpt-4o-mini-transcribe`。Provider 設定與限制請參閱[媒體工具概觀](/zh-TW/tools/media-overview)。

行為詳細資訊：

- `m.audio` 事件，以及 MIME 類型為 `audio/*` 的 `m.file` 事件符合資格。
- 在加密房間中，OpenClaw 會先透過現有 Matrix 媒體路徑解密附件，再進行轉錄。
- 轉錄內容會在代理提示中標記為機器產生且不受信任。
- 附件會標記為已轉錄，因此下游媒體工具不會再次轉錄同一則語音備忘。
- 設定 `tools.media.audio.enabled: false` 可全域停用音訊轉錄。

## 核准中繼資料

Matrix 原生核准提示是一般的 `m.room.message` 事件，並在 `com.openclaw.approval` 下包含 OpenClaw 專用的自訂事件內容。Matrix 允許自訂事件內容鍵，因此一般用戶端仍會轉譯文字本文，而支援 OpenClaw 的用戶端可以讀取結構化的核准 ID、種類、狀態、可用決策，以及 exec/外掛詳細資料。

當核准提示太長，無法放入單一 Matrix 事件時，OpenClaw 會將可見文字分塊，並只將 `com.openclaw.approval` 附加到第一個分塊。允許/拒絕決策的反應會繫結到該第一個事件，因此長提示會與單一事件提示保有相同的核准目標。

### 用於安靜完成預覽的自架推播規則

`streaming: "quiet"` 只會在區塊或回合完成時通知收件者 - 每位使用者的推播規則必須符合完成預覽標記。完整做法請參閱 [安靜預覽的 Matrix 推播規則](/zh-TW/channels/matrix-push-rules)（收件者權杖、pusher 檢查、規則安裝、各 homeserver 注意事項）。

## 機器人對機器人房間

預設會忽略來自其他已設定 OpenClaw Matrix 帳戶的 Matrix 訊息。

當你刻意需要代理之間的 Matrix 流量時，請使用 `allowBots`：

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

- `allowBots: true` 會接受允許房間與私訊中，來自其他已設定 Matrix 機器人帳戶的訊息。
- `allowBots: "mentions"` 只會在房間中可見地提及此機器人時接受那些訊息。私訊仍然允許。
- `groups.<room>.allowBots` 會覆寫單一房間的帳戶層級設定。
- 已接受的已設定機器人訊息會使用共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。設定 `channels.defaults.botLoopProtection`，然後在單一房間需要不同額度時，用 `channels.matrix.botLoopProtection` 或 `channels.matrix.groups.<room>.botLoopProtection` 覆寫。
- OpenClaw 仍會忽略來自相同 Matrix 使用者 ID 的訊息，以避免自我回覆迴圈。
- Matrix 在這裡不會公開原生機器人旗標；OpenClaw 會將「機器人作者」視為「由此 OpenClaw 閘道上另一個已設定的 Matrix 帳戶傳送」。

在共用房間中啟用機器人對機器人流量時，請使用嚴格的房間允許清單與提及要求。

## 加密與驗證

在加密（E2EE）房間中，傳出圖片事件會使用 `thumbnail_file`，因此圖片預覽會與完整附件一起加密。未加密房間仍會使用純文字 `thumbnail_url`。不需要設定 - 外掛會自動偵測 E2EE 狀態。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整診斷）、`--json`（機器可讀輸出），以及 `--account <id>`（多帳戶設定）。預設輸出簡潔，且內部 SDK 記錄安靜。以下範例顯示標準形式；請依需要加入旗標。

### 啟用加密

```bash
openclaw matrix encryption setup
```

啟動秘密儲存與交叉簽署，必要時建立房間金鑰備份，然後列印狀態與後續步驟。實用旗標：

- `--recovery-key <key>` 在啟動前套用復原金鑰（建議使用下方文件中的 stdin 形式）
- `--force-reset-cross-signing` 捨棄目前的交叉簽署身分並建立新的身分（僅在刻意需要時使用）

對於新帳戶，請在建立時啟用 E2EE：

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

`--allow-degraded-local-state` 會在不先準備 Matrix 帳戶的情況下回傳盡力而為的診斷；適用於離線或部分設定的探查。

### 使用復原金鑰驗證此裝置

復原金鑰很敏感 - 請透過 stdin 傳入，而不要在命令列上傳遞。設定 `MATRIX_RECOVERY_KEY`（或針對命名帳戶設定 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

此命令會回報三種狀態：

- `Recovery key accepted`：Matrix 已接受該金鑰，用於秘密儲存或裝置信任。
- `Backup usable`：可以使用受信任的復原材料載入房間金鑰備份。
- `Device verified by owner`：此裝置具有完整的 Matrix 交叉簽署身分信任。

當完整身分信任尚未完成時，即使復原金鑰已解鎖備份材料，也會以非零狀態結束。在該情況下，請從另一個 Matrix 用戶端完成自我驗證：

```bash
openclaw matrix verify self
```

`verify self` 會等待 `Cross-signing verified: yes`，然後才成功結束。使用 `--timeout-ms <ms>` 可調整等待時間。

也接受字面金鑰形式 `openclaw matrix verify device "<recovery-key>"`，但金鑰會進入你的 shell 歷史紀錄。

### 啟動或修復交叉簽署

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密帳戶的修復與設定命令。依序會：

- 啟動秘密儲存，並在可能時重用現有復原金鑰
- 啟動交叉簽署並上傳缺少的公開金鑰
- 標記並交叉簽署目前裝置
- 如果尚不存在伺服器端房間金鑰備份，則建立一個

如果 homeserver 需要 UIA 才能上傳交叉簽署金鑰，OpenClaw 會先嘗試無驗證，再嘗試 `m.login.dummy`，然後嘗試 `m.login.password`（需要 `channels.matrix.password`）。

實用旗標：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 可捨棄目前的交叉簽署身分（僅限刻意需要；需要已儲存的作用中復原金鑰，或透過 `--recovery-key-stdin` 提供）

### 房間金鑰備份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 會顯示是否存在伺服器端備份，以及此裝置是否可以解密它。`backup restore` 會將備份的房間金鑰匯入本機加密儲存；如果復原金鑰已在磁碟上，可以省略 `--recovery-key-stdin`。

若要用全新基準取代損壞的備份（接受遺失無法復原的舊歷史；如果目前備份秘密無法載入，也可以重新建立秘密儲存）：

```bash
openclaw matrix verify backup reset --yes
```

只有在你刻意希望先前復原金鑰停止解鎖全新備份基準時，才加入 `--rotate-recovery-key`。

### 列出、請求與回應驗證

```bash
openclaw matrix verify list
```

列出所選帳戶的待處理驗證請求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

從此 OpenClaw 帳戶傳送驗證請求。`--own-user` 會請求自我驗證（你在相同使用者的另一個 Matrix 用戶端中接受提示）；`--user-id`/`--device-id`/`--room-id` 會指定其他人。`--own-user` 不能與其他目標旗標合併使用。

對於較低階的生命週期處理 - 通常是在跟隨另一個用戶端的傳入請求時 - 這些命令會作用於特定請求 `<id>`（由 `verify list` 與 `verify request` 列印）：

| 命令                                       | 用途                                                          |
| ------------------------------------------ | ------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受傳入請求                                                  |
| `openclaw matrix verify start <id>`        | 啟動 SAS 流程                                                 |
| `openclaw matrix verify sas <id>`          | 列印 SAS emoji 或十進位數字                                   |
| `openclaw matrix verify confirm-sas <id>`  | 確認 SAS 與另一個用戶端顯示的內容相符                         |
| `openclaw matrix verify mismatch-sas <id>` | 當 emoji 或十進位數字不相符時拒絕 SAS                         |
| `openclaw matrix verify cancel <id>`       | 取消；接受選用的 `--reason <text>` 與 `--code <matrix-code>`   |

當驗證錨定到特定直接訊息房間時，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 與 `cancel` 都接受 `--user-id` 與 `--room-id` 作為私訊後續提示。

### 多帳戶注意事項

如果沒有 `--account <id>`，Matrix 命令列介面命令會使用隱含的預設帳戶。如果你有多個命名帳戶且尚未設定 `channels.matrix.defaultAccount`，它們會拒絕猜測並要求你選擇。當某個命名帳戶停用或無法使用 E2EE 時，錯誤會指向該帳戶的設定鍵，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="Startup behavior">
    使用 `encryption: true` 時，`startupVerification` 預設為 `"if-unverified"`。啟動時，未驗證的裝置會在另一個 Matrix 用戶端中請求自我驗證，略過重複項並套用冷卻時間（預設為 24 小時）。使用 `startupVerificationCooldownHours` 調整，或用 `startupVerification: "off"` 停用。

    啟動時也會執行保守的加密啟動流程，重用目前的秘密儲存與交叉簽署身分。如果啟動狀態損壞，即使沒有 `channels.matrix.password`，OpenClaw 也會嘗試受保護的修復；如果 homeserver 需要密碼 UIA，啟動會記錄警告並保持非致命。已由擁有者簽署的裝置會被保留。

    完整升級流程請參閱 [Matrix 遷移](/zh-TW/channels/matrix-migration)。

  </Accordion>

  <Accordion title="Verification notices">
    Matrix 會將驗證生命週期通知以 `m.notice` 訊息形式發布到嚴格的私訊驗證房間中：請求、就緒（包含「透過 emoji 驗證」指引）、開始/完成，以及可用時的 SAS（emoji/十進位）詳細資料。

    來自另一個 Matrix 用戶端的傳入請求會被追蹤並自動接受。對於自我驗證，OpenClaw 會自動啟動 SAS 流程，並在 emoji 驗證可用後確認自己的這一端 - 你仍需要在你的 Matrix 用戶端中比較並確認「它們相符」。

    驗證系統通知不會轉發到代理聊天管線。

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    如果 `verify status` 表示目前裝置不再列於 homeserver 上，請建立新的 OpenClaw Matrix 裝置。對於密碼登入：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    若使用權杖驗證，請在你的 Matrix 用戶端或管理介面建立新的存取權杖，然後更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    將 `assistant` 替換為失敗命令中的帳戶 ID，或省略 `--account` 以使用預設帳戶。

  </Accordion>

  <Accordion title="Device hygiene">
    舊的 OpenClaw 管理裝置可能會累積。列出並清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路徑，並以 `fake-indexeddb` 作為 IndexedDB shim。加密狀態會持久保存到 `crypto-idb-snapshot.json`（限制性檔案權限）。

    加密的執行階段狀態位於 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 底下，包含同步儲存、加密儲存、復原金鑰、IDB 快照、執行緒綁定，以及啟動驗證狀態。當權杖變更但帳戶身分維持不變時，OpenClaw 會重用最佳的既有根目錄，讓先前狀態仍可見。

    單一較舊的權杖雜湊根目錄可能是正常的權杖輪替連續性路徑。如果 OpenClaw 記錄 `matrix: multiple populated token-hash storage roots detected`，請檢查帳戶目錄，並且只在確認選定的作用中根目錄健康後，才封存過時的同層根目錄。建議先將過時根目錄移到 `_archive/` 目錄，而不是立即刪除。

  </Accordion>
</AccordionGroup>

## 設定檔管理

更新所選帳戶的 Matrix 自我設定檔：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次呼叫中傳入兩個選項。Matrix 會直接接受 `mxc://` 頭像 URL；當你傳入 `http://` 或 `https://` 時，OpenClaw 會先上傳檔案，並將解析後的 `mxc://` URL 儲存到 `channels.matrix.avatarUrl`（或每個帳戶的覆寫設定）。

## 執行緒

Matrix 支援原生 Matrix 執行緒，可用於自動回覆與訊息工具傳送。兩個獨立旋鈕控制其行為：

### 工作階段路由（`sessionScope`）

`dm.sessionScope` 決定 Matrix DM 房間如何對應到 OpenClaw 工作階段：

- `"per-user"`（預設）：所有與同一個路由對象相關的 DM 房間共享一個工作階段。
- `"per-room"`：每個 Matrix DM 房間都有自己的工作階段鍵，即使對象相同也是如此。

明確的對話綁定一律優先於 `sessionScope`，因此已綁定的房間與執行緒會保留其選定的目標工作階段。

### 回覆執行緒（`threadReplies`）

`threadReplies` 決定機器人將回覆發佈到哪裡：

- `"off"`：回覆位於最上層。傳入的執行緒訊息會留在父工作階段。
- `"inbound"`：只有當傳入訊息已在該執行緒中時，才在執行緒內回覆。
- `"always"`：在以觸發訊息為根的執行緒內回覆；該對話會從第一次觸發開始，透過相符的執行緒範圍工作階段路由。

`dm.threadReplies` 只會覆寫 DM 的此設定，例如可讓房間執行緒保持隔離，同時讓 DM 維持扁平。

### 執行緒繼承與斜線命令

- 傳入的執行緒訊息會將執行緒根訊息作為額外的代理程式上下文。
- 訊息工具傳送在目標為同一房間（或同一 DM 使用者目標）時，會自動繼承目前的 Matrix 執行緒，除非提供明確的 `threadId`。
- 只有當目前工作階段中繼資料證明同一 Matrix 帳戶上的同一 DM 對象時，才會啟用 DM 使用者目標重用；否則 OpenClaw 會退回正常的使用者範圍路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及執行緒綁定的 `/acp spawn` 都可在 Matrix 房間與 DM 中運作。
- 當 `threadBindings.spawnSessions` 啟用時，最上層 `/focus` 會建立新的 Matrix 執行緒，並將其綁定到目標工作階段。
- 在既有 Matrix 執行緒內執行 `/focus` 或 `/acp spawn --thread here`，會就地綁定該執行緒。

當 OpenClaw 偵測到 Matrix DM 房間與同一共享工作階段上的另一個 DM 房間發生衝突時，會在該房間發佈一次性 `m.notice`，指向 `/focus` 逃生路徑，並建議變更 `dm.sessionScope`。此通知只會在執行緒綁定啟用時出現。

## ACP 對話綁定

Matrix 房間、DM，以及既有 Matrix 執行緒，都可以轉換為持久的 ACP 工作區，而不需變更聊天介面。

快速操作員流程：

- 在你想繼續使用的 Matrix DM、房間或既有執行緒內執行 `/acp spawn codex --bind here`。
- 在最上層 Matrix DM 或房間中，目前的 DM/房間會保留為聊天介面，後續訊息會路由到產生的 ACP 工作階段。
- 在既有 Matrix 執行緒內，`--bind here` 會就地綁定目前執行緒。
- `/new` 和 `/reset` 會就地重設同一個已綁定 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除綁定。

注意事項：

- `--bind here` 不會建立子 Matrix 執行緒。
- `threadBindings.spawnSessions` 會控管 `/acp spawn --thread auto|here`，此時 OpenClaw 需要建立或綁定子 Matrix 執行緒。

### 執行緒綁定設定

Matrix 會繼承 `session.threadBindings` 的全域預設值，也支援每個頻道的覆寫設定：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 執行緒綁定工作階段產生預設為開啟：

- 設定 `threadBindings.spawnSessions: false`，以阻止最上層 `/focus` 和 `/acp spawn --thread auto|here` 建立/綁定 Matrix 執行緒。
- 當原生子代理程式執行緒產生不應分叉父轉錄時，設定 `threadBindings.defaultSpawnContext: "isolated"`。

## 回應

Matrix 支援傳出回應、傳入回應通知，以及確認回應。

傳出回應工具由 `channels.matrix.actions.reactions` 控管：

- `react` 會對 Matrix 事件加入回應。
- `reactions` 會列出 Matrix 事件目前的回應摘要。
- `emoji=""` 會移除機器人在該事件上的自身回應。
- `remove: true` 只會從機器人移除指定的表情符號回應。

**解析順序**（第一個已定義的值勝出）：

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 每帳戶 → 頻道 → `messages.ackReaction` → 代理程式身分表情符號後備               |
| `ackReactionScope`      | 每帳戶 → 頻道 → `messages.ackReactionScope` → 預設 `"group-mentions"`           |
| `reactionNotifications` | 每帳戶 → 頻道 → 預設 `"own"`                                                     |

`reactionNotifications: "own"` 會在新增的 `m.reaction` 事件目標是機器人撰寫的 Matrix 訊息時轉送；`"off"` 會停用回應系統事件。回應移除不會合成為系統事件，因為 Matrix 會將其呈現為刪訂，而不是獨立的 `m.reaction` 移除。

## 歷史上下文

- `channels.matrix.historyLimit` 控制當 Matrix 房間訊息觸發代理程式時，要將多少則最近房間訊息納入 `InboundHistory`。會退回 `messages.groupChat.historyLimit`；如果兩者都未設定，實際預設值為 `0`。設定 `0` 可停用。
- Matrix 房間歷史僅限房間。DM 會繼續使用正常工作階段歷史。
- Matrix 房間歷史僅限待處理：OpenClaw 會緩衝尚未觸發回覆的房間訊息，然後在提及或其他觸發到達時，快照該視窗。
- 目前觸發訊息不會包含在 `InboundHistory` 中；它會保留在該回合的主要傳入本文中。
- 同一 Matrix 事件的重試會重用原始歷史快照，而不會向前漂移到較新的房間訊息。

## 上下文可見性

Matrix 支援共享的 `contextVisibility` 控制，用於補充房間上下文，例如擷取的回覆文字、執行緒根，以及待處理歷史。

- `contextVisibility: "all"` 是預設值。補充上下文會依收到時保留。
- `contextVisibility: "allowlist"` 會篩選補充上下文，只傳送作用中房間/使用者允許清單檢查所允許的傳送者。
- `contextVisibility: "allowlist_quote"` 的行為類似 `allowlist`，但仍會保留一則明確引用的回覆。

此設定影響補充上下文的可見性，而非傳入訊息本身是否可以觸發回覆。
觸發授權仍來自 `groupPolicy`、`groups`、`groupAllowFrom`，以及 DM 政策設定。

## DM 與房間政策

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

若要完全靜音 DM 但保留房間運作，請設定 `dm.enabled: false`：

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

請參閱[群組](/zh-TW/channels/groups)，了解提及閘控與允許清單行為。

Matrix DM 的配對範例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未核准的 Matrix 使用者在核准前持續傳訊給你，OpenClaw 會重用同一個待處理配對碼，並可能在短暫冷卻後傳送提醒回覆，而不是鑄造新的代碼。

請參閱[配對](/zh-TW/channels/pairing)，了解共享 DM 配對流程與儲存配置。

## 直接房間修復

如果直接訊息狀態不同步，OpenClaw 可能會留下過時的 `m.direct` 對應，指向舊的單人房間，而不是目前的 DM。檢查某個對象目前的對應：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

兩個命令都接受 `--account <id>`，用於多帳戶設定。修復流程：

- 優先使用已在 `m.direct` 中對應的嚴格 1:1 DM
- 退回使用目前已加入、且與該使用者相關的任何嚴格 1:1 DM
- 如果沒有健康的 DM，則建立新的直接房間並重寫 `m.direct`

它不會自動刪除舊房間。它會選取健康的 DM 並更新對應，讓未來的 Matrix 傳送、驗證通知，以及其他直接訊息流程都能以正確房間為目標。

## Exec 核准

Matrix 可以作為原生核准用戶端。請在 `channels.matrix.execApprovals` 下設定（或使用 `channels.matrix.accounts.<account>.execApprovals` 作為每帳戶覆寫）：

- `enabled`：透過 Matrix 原生提示傳遞核准。未設定或為 `"auto"` 時，只要至少可解析一位核准者，Matrix 就會自動啟用。設定 `false` 可明確停用。
- `approvers`：允許核准 exec 請求的 Matrix 使用者 ID（`@owner:example.org`）。可選，會退回 `channels.matrix.dm.allowFrom`。
- `target`：提示要送往哪裡。`"dm"`（預設）會送到核准者 DM；`"channel"` 會送到來源 Matrix 房間或 DM；`"both"` 會同時送到兩者。
- `agentFilter` / `sessionFilter`：可選的允許清單，用於指定哪些代理程式/工作階段會觸發 Matrix 傳遞。

不同核准類型的授權略有差異：

- **Exec 核准**使用 `execApprovals.approvers`，並退回 `dm.allowFrom`。
- **外掛核准**只透過 `dm.allowFrom` 授權。

兩種類型共享 Matrix 回應捷徑與訊息更新。核准者會在主要核准訊息上看到回應捷徑：

- `✅` 允許一次
- `❌` 拒絕
- `♾️` 永遠允許（當有效 exec 政策允許時）

備援斜線命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的核准者可以核准或拒絕。exec 核准的頻道傳遞包含命令文字 - 只在受信任的房間中啟用 `channel` 或 `both`。

相關：[Exec 核准](/zh-TW/tools/exec-approvals)。

## 斜線命令

斜線命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在 DM 中使用。在房間中，OpenClaw 也會辨識以 Bot 自身 Matrix 提及為前綴的命令，因此 `@bot:server /new` 會觸發命令路徑，而不需要自訂提及 regex。這讓 Bot 能回應 Element 與類似用戶端在使用者輸入命令前以 Tab 補全 Bot 時送出的房間樣式 `@mention /command` 貼文。

授權規則仍然適用：命令傳送者必須符合與一般訊息相同的 DM 或房間 allowlist/擁有者政策。

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

- 除非帳戶覆寫，否則頂層 `channels.matrix` 值會作為具名帳戶的預設值。
- 使用 `groups.<room>.account` 將繼承的房間項目限定到特定帳戶。沒有 `account` 的項目會在帳戶之間共用；當預設帳戶在頂層設定時，`account: "default"` 仍然有效。

**預設帳戶選擇：**

- 設定 `defaultAccount`，以選擇隱式路由、探測與命令列介面命令偏好的具名帳戶。
- 如果你有多個帳戶，且其中一個真的命名為 `default`，即使未設定 `defaultAccount`，OpenClaw 也會隱式使用它。
- 如果你有多個具名帳戶且未選擇預設帳戶，命令列介面命令會拒絕猜測 - 請設定 `defaultAccount` 或傳入 `--account <id>`。
- 頂層 `channels.matrix.*` 區塊只有在其 auth 完整時（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），才會被視為隱式 `default` 帳戶。具名帳戶只要有 `homeserver` + `userId`，且快取的憑證涵蓋 auth，仍可被探索。

**升級：**

- 當 OpenClaw 在修復或設定期間將單帳戶設定升級為多帳戶時，如果既有具名帳戶存在，或 `defaultAccount` 已指向某個帳戶，它會保留該帳戶。只有 Matrix auth/bootstrap 鍵會移入升級後的帳戶；共用的傳遞政策鍵會留在頂層。

請參閱[設定參考](/zh-TW/gateway/config-channels#multi-account-all-channels)，了解共用的多帳戶模式。

## 私有/LAN homeserver

依預設，OpenClaw 會封鎖私有/內部 Matrix homeserver 以提供 SSRF 保護，除非你
明確為每個帳戶選擇啟用。

如果你的 homeserver 執行於 localhost、LAN/Tailscale IP 或內部主機名稱，請為該 Matrix 帳戶啟用
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

此選擇啟用只允許受信任的私有/內部目標。公開的明文 homeserver，例如
`http://matrix.example.org:8008`，仍會被封鎖。請盡可能偏好使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要明確的外送 HTTP(S) Proxy，請設定 `channels.matrix.proxy`：

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

具名帳戶可以透過 `channels.matrix.accounts.<id>.proxy` 覆寫頂層預設值。
OpenClaw 會對執行階段 Matrix 流量與帳戶狀態探測使用相同的 Proxy 設定。

## 目標解析

在 OpenClaw 要求你提供房間或使用者目標的任何位置，Matrix 都接受下列目標形式：

- 使用者：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房間：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 別名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房間 ID 區分大小寫。設定明確傳遞目標、排程工作、繫結或 allowlist 時，
請使用 Matrix 中完全相同大小寫的房間 ID。
OpenClaw 會讓內部工作階段鍵以標準形式儲存，因此那些小寫
鍵並不是 Matrix 傳遞 ID 的可靠來源。

即時目錄查詢會使用已登入的 Matrix 帳戶：

- 使用者查詢會查詢該 homeserver 上的 Matrix 使用者目錄。
- 房間查詢會直接接受明確的房間 ID 與別名。已加入房間的名稱查詢是盡力而為，且只有在設定 `dangerouslyAllowNameMatching: true` 時，才會套用到執行階段房間 allowlist。
- 如果房間名稱無法解析為 ID 或別名，執行階段 allowlist 解析會忽略它。

## 設定參考

allowlist 樣式的使用者欄位（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整 Matrix 使用者 ID（最安全）。非 ID 使用者項目預設會被忽略。如果你設定 `dangerouslyAllowNameMatching: true`，系統會在啟動時，以及監控器執行期間 allowlist 變更時，解析精確的 Matrix 目錄顯示名稱相符項目；無法解析的項目會在執行階段被忽略。

房間 allowlist 鍵（`groups`、舊版 `rooms`）應為房間 ID 或別名。純房間名稱鍵預設會被忽略；`dangerouslyAllowNameMatching: true` 會恢復針對已加入房間名稱的盡力查詢。

### 帳戶與連線

- `enabled`：啟用或停用此頻道。
- `name`：帳戶的可選顯示標籤。
- `defaultAccount`：設定多個 Matrix 帳戶時偏好的帳戶 ID。
- `accounts`：具名的每帳戶覆寫。頂層 `channels.matrix` 值會作為預設值繼承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允許此帳戶連線到 `localhost`、LAN/Tailscale IP 或內部主機名稱。
- `proxy`：Matrix 流量的可選 HTTP(S) Proxy URL。支援每帳戶覆寫。
- `userId`：完整 Matrix 使用者 ID（`@bot:example.org`）。
- `accessToken`：Token 型 auth 的存取 Token。支援跨 env/file/exec providers 的明文與 SecretRef 值（[Secrets Management](/zh-TW/gateway/secrets)）。
- `password`：密碼型登入的密碼。支援明文與 SecretRef 值。
- `deviceId`：明確的 Matrix 裝置 ID。
- `deviceName`：密碼登入時使用的裝置顯示名稱。
- `avatarUrl`：為個人檔案同步與 `profile set` 更新儲存的自我頭像 URL。
- `initialSyncLimit`：啟動同步期間擷取的最大事件數。

### 加密

- `encryption`：啟用 E2EE。預設：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 啟用時的預設值）或 `"off"`。當此裝置未驗證時，在啟動時自動要求自我驗證。
- `startupVerificationCooldownHours`：下一次自動啟動要求之前的冷卻時間。預設：`24`。

### 存取與政策

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。預設：`"allowlist"`。
- `groupAllowFrom`：房間流量的使用者 ID allowlist。
- `mentionPatterns`：房間提及的範圍化 regex 模式。物件格式為 `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`。控制已設定的 `agents.list[].groupChat.mentionPatterns` 是否按房間套用。
- `dm.enabled`：為 `false` 時，忽略所有 DM。預設：`true`。
- `dm.policy`：`"pairing"`（預設）、`"allowlist"`、`"open"` 或 `"disabled"`。會在 Bot 加入並將房間分類為 DM 之後套用；不影響邀請處理。
- `dm.allowFrom`：DM 流量的使用者 ID allowlist。
- `dm.sessionScope`：`"per-user"`（預設）或 `"per-room"`。
- `dm.threadReplies`：僅限 DM 的回覆串覆寫（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受來自其他已設定 Matrix Bot 帳戶的訊息（`true` 或 `"mentions"`）。
- `allowlistOnly`：為 `true` 時，強制所有作用中的 DM 政策（除了 `"disabled"`）與 `"open"` 房間政策改為 `"allowlist"`。不會變更 `"disabled"` 政策。
- `dangerouslyAllowNameMatching`：為 `true` 時，允許 Matrix 顯示名稱目錄查詢用於使用者 allowlist 項目，並允許已加入房間名稱查詢用於房間 allowlist 鍵。偏好使用完整 `@user:server` ID，以及房間 ID 或別名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。預設：`"off"`。套用到每個 Matrix 邀請，包括 DM 樣式邀請。
- `autoJoinAllowlist`：`autoJoin` 為 `"allowlist"` 時允許的房間/別名。別名項目會對 homeserver 解析，而不是對受邀房間宣稱的狀態解析。
- `contextVisibility`：補充脈絡可見性（`"all"` 預設、`"allowlist"`、`"allowlist_quote"`）。

### 回覆行為

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：針對執行緒繫結的工作階段路由與生命週期的每頻道覆寫。
- `streaming`：`"off"`（預設）、`"partial"`、`"quiet"`、`"progress"`，或物件形式 `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：為 `true` 時，已完成的 assistant 區塊會保留為個別進度訊息。
- `markdown`：外送文字的可選 Markdown 算繪設定。
- `responsePrefix`：前置到外送回覆的可選字串。
- `textChunkLimit`：`chunkMode: "length"` 時，以字元計算的外送區塊大小。預設：`4000`。
- `chunkMode`：`"length"`（預設，依字元數分割）或 `"newline"`（在行邊界分割）。
- `historyLimit`：當房間訊息觸發 agent 時，作為 `InboundHistory` 納入的最近房間訊息數量。回退至 `messages.groupChat.historyLimit`；有效預設值為 `0`（停用）。
- `mediaMaxMb`：外送傳送與傳入處理的媒體大小上限，單位為 MB。

### 回應設定

- `ackReaction`：此頻道/帳戶的 ack 回應覆寫。
- `ackReactionScope`：範圍覆寫（`"group-mentions"` 預設、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：傳入回應通知模式（`"own"` 預設、`"off"`）。

### 工具與每房間覆寫

- `actions`：逐動作工具閘控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：逐聊天室政策對應表。會話身分會在解析後使用穩定的聊天室 ID。（`rooms` 是舊版別名。）
  - `groups.<room>.account`：將一個繼承的聊天室項目限制為特定帳號。
  - `groups.<room>.enabled`：逐聊天室開關。當為 `false` 時，該聊天室會被忽略，就像不在對應表中一樣。
  - `groups.<room>.requireMention`：頻道層級提及要求的逐聊天室覆寫。
  - `groups.<room>.allowBots`：頻道層級設定的逐聊天室覆寫（`true` 或 `"mentions"`）。
  - `groups.<room>.botLoopProtection`：機器人對機器人迴圈保護預算的逐聊天室覆寫。
  - `groups.<room>.users`：逐聊天室寄件者允許清單。
  - `groups.<room>.tools`：逐聊天室工具允許/拒絕覆寫。
  - `groups.<room>.autoReply`：逐聊天室提及閘控覆寫。`true` 會停用該聊天室的提及要求；`false` 會強制重新啟用。
  - `groups.<room>.skills`：逐聊天室 Skills 篩選器。
  - `groups.<room>.systemPrompt`：逐聊天室系統提示片段。

### 執行核准設定

- `execApprovals.enabled`：透過 Matrix 原生提示傳遞執行核准。
- `execApprovals.approvers`：允許核准的 Matrix 使用者 ID。會回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（預設）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用於傳遞的選用代理/會話允許清單。

## 相關

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的會話路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
