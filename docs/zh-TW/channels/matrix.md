---
read_when:
    - 在 OpenClaw 中設定 Matrix
    - 設定 Matrix E2EE 與驗證
summary: Matrix 支援狀態、設定與組態範例
title: 矩陣
x-i18n:
    generated_at: "2026-05-11T20:21:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是 OpenClaw 的可下載 channel Plugin。
它使用官方的 `matrix-js-sdk`，並支援 DM、房間、執行緒、媒體、回應、投票、位置與 E2EE。

## 安裝

設定 channel 前，先從 ClawHub 安裝 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

裸 Plugin 規格會先嘗試 ClawHub，然後再 fallback 到 npm。若要強制指定 registry 來源，請使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

從本機 checkout 安裝：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 會註冊並啟用 Plugin，因此不需要另外執行 `openclaw plugins enable matrix` 步驟。不過在你設定下方的 channel 之前，Plugin 仍然不會執行任何動作。請參閱 [Plugins](/zh-TW/tools/plugin) 了解一般 Plugin 行為與安裝規則。

## 設定

1. 在你的 homeserver 上建立 Matrix 帳號。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 設定 `channels.matrix`。
3. 重新啟動 Gateway。
4. 與 bot 開始 DM，或邀請它加入房間（請參閱 [自動加入](#auto-join) - 只有在 `autoJoin` 允許時，新的邀請才會加入）。

### 互動式設定

```bash
openclaw channels add
openclaw configure --section channels
```

精靈會詢問：homeserver URL、驗證方法（access token 或密碼）、使用者 ID（僅密碼驗證）、可選的裝置名稱、是否啟用 E2EE，以及是否設定房間存取與自動加入。

如果相符的 `MATRIX_*` 環境變數已存在，且所選帳號沒有已儲存的驗證資料，精靈會提供環境變數捷徑。若要在儲存 allowlist 前解析房間名稱，請執行 `openclaw channels resolve --channel matrix "Project Room"`。啟用 E2EE 時，精靈會寫入設定，並執行與 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的 bootstrap。

### 最小設定

Token 型：

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

密碼型（首次登入後會快取 token）：

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

`channels.matrix.autoJoin` 預設為 `off`。使用預設值時，bot 不會因新邀請而出現在新房間或 DM 中，直到你手動加入為止。

OpenClaw 無法在邀請時判斷受邀房間是 DM 還是群組，因此所有邀請，包括 DM 樣式的邀請，都會先經過 `autoJoin`。`dm.policy` 只會在稍後套用，也就是 bot 已加入且房間已分類之後。

<Warning>
設定 `autoJoin: "allowlist"` 加上 `autoJoinAllowlist` 以限制 bot 接受哪些邀請，或設定 `autoJoin: "always"` 以接受所有邀請。

`autoJoinAllowlist` 只接受穩定目標：`!roomId:server`、`#alias:server` 或 `*`。純房間名稱會被拒絕；alias 項目會針對 homeserver 解析，而不是針對受邀房間宣稱的狀態解析。
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

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。顯示名稱預設會被忽略，因為它們可變；只有在你明確需要與顯示名稱項目相容時，才設定 `dangerouslyAllowNameMatching: true`。
- 房間 allowlist 鍵（`groups`，舊版 `rooms`）：使用 `!room:server` 或 `#alias:server`。純房間名稱預設會被忽略；只有在你明確需要與已加入房間的名稱查詢相容時，才設定 `dangerouslyAllowNameMatching: true`。
- 邀請 allowlist（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。純房間名稱會被拒絕。

### 帳號 ID 正規化

精靈會將易讀名稱轉換為正規化的帳號 ID。例如，`Ops Bot` 會變成 `ops-bot`。標點符號會在 scoped 環境變數名稱中被逸出，讓兩個帳號無法衝突：`-` → `_X2D_`，因此 `ops-prod` 會對應到 `MATRIX_OPS_X2D_PROD_*`。

### 快取憑證

Matrix 會將快取憑證儲存在 `~/.openclaw/credentials/matrix/` 底下：

- 預設帳號：`credentials.json`
- 命名帳號：`credentials-<account>.json`

當那裡存在快取憑證時，即使 access token 不在設定檔中，OpenClaw 也會將 Matrix 視為已設定；這涵蓋設定、`openclaw doctor` 與 channel-status probe。

### 環境變數

在對等設定鍵未設定時使用。預設帳號使用未加前綴的名稱；命名帳號會在 suffix 前插入帳號 ID。

| 預設帳號              | 命名帳號（`<ID>` 是正規化帳號 ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

對於帳號 `ops`，名稱會變成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此類推。recovery-key 環境變數會由可感知復原的 CLI 流程（`verify backup restore`、`verify device`、`verify bootstrap`）讀取，前提是你透過 `--recovery-key-stdin` 將 key pipe 進去。

`MATRIX_HOMESERVER` 不能從 workspace `.env` 設定；請參閱 [Workspace `.env` 檔案](/zh-TW/gateway/security)。

## 設定範例

一個實用基準，包含 DM 配對、房間 allowlist 與 E2EE：

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

Matrix 回覆串流是選擇加入。`streaming` 控制 OpenClaw 如何傳送進行中的助理回覆；`blockStreaming` 控制每個完成的區塊是否保留為自己的 Matrix 訊息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留即時回答預覽，但隱藏中途的工具/進度行，請使用物件
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

| `streaming`       | 行為                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（預設） | 等待完整回覆，然後傳送一次。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | 在模型寫入目前區塊時，就地編輯一則一般文字訊息。標準 Matrix 用戶端可能會在首次預覽時通知，而不是在最終編輯時通知。              |
| `"quiet"`         | 與 `"partial"` 相同，但訊息是不發送通知的 notice。收件者只會在每位使用者的 push rule 符合最終編輯時收到通知（見下方）。 |

`blockStreaming` 獨立於 `streaming`：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（預設）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 目前區塊的即時草稿，完成的區塊保留為訊息 | 目前區塊的即時草稿，就地定稿 |
| `"off"`                 | 每個完成區塊一則發送通知的 Matrix 訊息                     | 完整回覆一則發送通知的 Matrix 訊息      |

注意事項：

- 如果預覽超過 Matrix 的每事件大小限制，OpenClaw 會停止預覽串流，並 fallback 到僅最終傳送。
- 媒體回覆一律正常傳送附件。如果過期預覽已無法安全重複使用，OpenClaw 會在傳送最終媒體回覆前 redacts 它。
- 當 Matrix 預覽串流啟用時，工具進度預覽更新預設也會啟用。設定 `streaming.preview.toolProgress: false` 可保留回答文字的預覽編輯，但讓工具進度走一般傳送路徑。
- 預覽編輯會增加額外 Matrix API 呼叫。如果你想要最保守的 rate-limit profile，請保留 `streaming: "off"`。

## 核准中繼資料

Matrix 原生核准提示是一般 `m.room.message` 事件，其中 OpenClaw 專屬的自訂事件內容位於 `com.openclaw.approval` 底下。Matrix 允許自訂事件內容鍵，因此標準用戶端仍會呈現文字本文，而支援 OpenClaw 的用戶端可以讀取結構化的核准 id、kind、state、可用決策，以及 exec/Plugin 詳細資料。

當核准提示太長，無法放入單一 Matrix 事件時，OpenClaw 會將可見文字分塊，並只把 `com.openclaw.approval` 附加到第一個區塊。允許/拒絕決策的回應會繫結到該第一個事件，因此長提示會與單事件提示保持相同的核准目標。

### 自架 push rule，用於安靜的最終預覽

`streaming: "quiet"` 只會在區塊或 turn 定稿後通知收件者 - 每位使用者的 push rule 必須符合最終預覽標記。完整作法請參閱 [Matrix push rule，用於安靜預覽](/zh-TW/channels/matrix-push-rules)（收件者 token、pusher 檢查、規則安裝、每個 homeserver 注意事項）。

## Bot 對 bot 房間

預設情況下，來自其他已設定 OpenClaw Matrix 帳號的 Matrix 訊息會被忽略。

當你刻意想要 inter-agent Matrix 流量時，請使用 `allowBots`：

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

- `allowBots: true` 會接受允許房間與 DM 中來自其他已設定 Matrix bot 帳號的訊息。
- `allowBots: "mentions"` 只會在這些訊息於房間中明顯提及此 bot 時接受。DM 仍然允許。
- `groups.<room>.allowBots` 會覆寫單一房間的帳號層級設定。
- OpenClaw 仍會忽略來自相同 Matrix 使用者 ID 的訊息，以避免自我回覆迴圈。
- Matrix 在這裡不會公開原生 bot flag；OpenClaw 將「bot 撰寫」視為「由此 OpenClaw Gateway 上另一個已設定 Matrix 帳號傳送」。

在共用房間中啟用 bot 對 bot 流量時，請使用嚴格的房間 allowlist 與提及要求。

## 加密與驗證

在加密（E2EE）房間中，傳出的圖片事件會使用 `thumbnail_file`，因此圖片預覽會與完整附件一起加密。未加密房間仍使用純文字 `thumbnail_url`。不需要任何設定 - Plugin 會自動偵測 E2EE 狀態。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整診斷）、`--json`（機器可讀輸出）和 `--account <id>`（多帳號設定）。預設輸出精簡，並採用安靜的內部 SDK 記錄。以下範例顯示標準形式；依需要加入旗標。

### 啟用加密

```bash
openclaw matrix encryption setup
```

啟動秘密儲存和交叉簽署，視需要建立房間金鑰備份，然後印出狀態與後續步驟。實用旗標：

- `--recovery-key <key>` 在啟動前套用復原金鑰（建議使用下方記載的 stdin 形式）
- `--force-reset-cross-signing` 捨棄目前的交叉簽署身分並建立新的身分（僅在有意如此時使用）

若是新帳號，請在建立時啟用 E2EE：

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
- `Signed by owner`：由你自己的自簽金鑰簽署（僅供診斷）

只有當 `Cross-signing verified` 為 `yes` 時，`Verified by owner` 才會變成 `yes`。僅有本機信任或擁有者簽章並不足夠。

`--allow-degraded-local-state` 會在不先準備 Matrix 帳號的情況下回傳最佳努力診斷；適用於離線或部分設定的探測。

### 使用復原金鑰驗證此裝置

復原金鑰是敏感資訊 - 請透過 stdin 管線傳入，而不是在命令列上傳遞。設定 `MATRIX_RECOVERY_KEY`（或針對具名帳號使用 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

此命令會回報三種狀態：

- `Recovery key accepted`：Matrix 已接受此金鑰，用於秘密儲存或裝置信任。
- `Backup usable`：可使用受信任的復原素材載入房間金鑰備份。
- `Device verified by owner`：此裝置具備完整的 Matrix 交叉簽署身分信任。

當完整身分信任尚未完成時，即使復原金鑰已解鎖備份素材，命令也會以非零狀態結束。在這種情況下，請從另一個 Matrix 用戶端完成自我驗證：

```bash
openclaw matrix verify self
```

`verify self` 會等待 `Cross-signing verified: yes` 後才成功結束。使用 `--timeout-ms <ms>` 可調整等待時間。

也接受字面金鑰形式 `openclaw matrix verify device "<recovery-key>"`，但金鑰會留在你的 shell 歷史記錄中。

### 啟動或修復交叉簽署

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密帳號的修復與設定命令。它會依序：

- 啟動秘密儲存，並在可能時重用既有復原金鑰
- 啟動交叉簽署並上傳缺少的公開金鑰
- 標記並交叉簽署目前裝置
- 若尚不存在，建立伺服器端房間金鑰備份

如果 homeserver 需要 UIA 才能上傳交叉簽署金鑰，OpenClaw 會先嘗試無驗證，接著嘗試 `m.login.dummy`，再嘗試 `m.login.password`（需要 `channels.matrix.password`）。

實用旗標：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用於捨棄目前的交叉簽署身分（僅在有意如此時使用）

### 房間金鑰備份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 會顯示伺服器端備份是否存在，以及此裝置是否能解密它。`backup restore` 會將已備份的房間金鑰匯入本機加密儲存；如果復原金鑰已在磁碟上，可以省略 `--recovery-key-stdin`。

若要用新的基準取代損壞的備份（接受失去無法復原的舊歷史；若目前的備份秘密無法載入，也可重新建立秘密儲存）：

```bash
openclaw matrix verify backup reset --yes
```

只有在你有意讓先前的復原金鑰停止解鎖新的備份基準時，才加入 `--rotate-recovery-key`。

### 列出、要求與回應驗證

```bash
openclaw matrix verify list
```

列出所選帳號的待處理驗證要求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

從此 OpenClaw 帳號送出驗證要求。`--own-user` 要求自我驗證（你會在同一使用者的另一個 Matrix 用戶端接受提示）；`--user-id`/`--device-id`/`--room-id` 會鎖定其他人。`--own-user` 不能與其他目標旗標合併使用。

對於較低階的生命週期處理 - 通常是在跟隨來自另一個用戶端的傳入要求時 - 這些命令會作用於特定要求 `<id>`（由 `verify list` 和 `verify request` 印出）：

| 命令                                       | 用途                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受傳入要求                                                        |
| `openclaw matrix verify start <id>`        | 啟動 SAS 流程                                                       |
| `openclaw matrix verify sas <id>`          | 印出 SAS 表情符號或十進位數字                                      |
| `openclaw matrix verify confirm-sas <id>`  | 確認 SAS 與另一個用戶端顯示的內容相符                              |
| `openclaw matrix verify mismatch-sas <id>` | 當表情符號或十進位數字不相符時拒絕 SAS                             |
| `openclaw matrix verify cancel <id>`       | 取消；可選擇接受 `--reason <text>` 和 `--code <matrix-code>`        |

當驗證錨定到特定直接訊息房間時，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id` 作為 DM 後續提示。

### 多帳號注意事項

若未使用 `--account <id>`，Matrix CLI 命令會使用隱含的預設帳號。如果你有多個具名帳號，且尚未設定 `channels.matrix.defaultAccount`，它們會拒絕猜測並要求你選擇。當具名帳號的 E2EE 已停用或無法使用時，錯誤會指向該帳號的設定鍵，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="啟動行為">
    使用 `encryption: true` 時，`startupVerification` 預設為 `"if-unverified"`。啟動時，未驗證裝置會在另一個 Matrix 用戶端要求自我驗證，略過重複項目並套用冷卻時間（預設為 24 小時）。可使用 `startupVerificationCooldownHours` 調整，或使用 `startupVerification: "off"` 停用。

    啟動時也會執行保守的加密啟動流程，重用目前的秘密儲存和交叉簽署身分。如果啟動狀態損壞，OpenClaw 會即使沒有 `channels.matrix.password` 也嘗試受控修復；如果 homeserver 需要密碼 UIA，啟動會記錄警告並保持非致命。已由擁有者簽署的裝置會保留。

    請參閱 [Matrix 遷移](/zh-TW/channels/matrix-migration) 以了解完整升級流程。

  </Accordion>

  <Accordion title="驗證通知">
    Matrix 會將驗證生命週期通知作為 `m.notice` 訊息張貼到嚴格 DM 驗證房間中：要求、就緒（包含「透過表情符號驗證」指引）、開始/完成，以及可用時的 SAS（表情符號/十進位）詳細資訊。

    來自另一個 Matrix 用戶端的傳入要求會被追蹤並自動接受。對於自我驗證，OpenClaw 會自動啟動 SAS 流程，並在表情符號驗證可用後確認自己這一端 - 你仍需要在 Matrix 用戶端中比較並確認「它們相符」。

    驗證系統通知不會轉送到代理聊天管線。

  </Accordion>

  <Accordion title="已刪除或無效的 Matrix 裝置">
    如果 `verify status` 表示目前裝置已不再列於 homeserver，請建立新的 OpenClaw Matrix 裝置。若使用密碼登入：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    若使用權杖驗證，請在你的 Matrix 用戶端或管理介面中建立新的存取權杖，然後更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    將 `assistant` 替換為失敗命令中的帳號 ID，或省略 `--account` 以使用預設帳號。

  </Accordion>

  <Accordion title="裝置衛生">
    舊的 OpenClaw 管理裝置可能會累積。列出並清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密儲存">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路徑，並以 `fake-indexeddb` 作為 IndexedDB shim。加密狀態會持久化到 `crypto-idb-snapshot.json`（限制性檔案權限）。

    加密執行階段狀態位於 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 之下，並包含同步儲存、加密儲存、復原金鑰、IDB 快照、執行緒繫結和啟動驗證狀態。當權杖變更但帳號身分維持相同時，OpenClaw 會重用最佳的既有根目錄，讓先前狀態仍可見。

  </Accordion>
</AccordionGroup>

## 個人檔案管理

更新所選帳號的 Matrix 自我個人檔案：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次呼叫中傳入兩個選項。Matrix 可直接接受 `mxc://` 頭像 URL；當你傳入 `http://` 或 `https://` 時，OpenClaw 會先上傳檔案，並將解析後的 `mxc://` URL 儲存到 `channels.matrix.avatarUrl`（或每帳號覆寫值）。

## 執行緒

Matrix 支援原生 Matrix 執行緒，用於自動回覆和訊息工具傳送。兩個獨立旋鈕控制行為：

### 工作階段路由（`sessionScope`）

`dm.sessionScope` 決定 Matrix DM 房間如何對應到 OpenClaw 工作階段：

- `"per-user"`（預設）：與同一個已路由對等方的所有 DM 房間共用一個工作階段。
- `"per-room"`：每個 Matrix DM 房間都有自己的工作階段鍵，即使對等方相同也一樣。

明確的對話繫結永遠優先於 `sessionScope`，因此已繫結的房間和執行緒會保留其選定的目標工作階段。

### 回覆執行緒（`threadReplies`）

`threadReplies` 決定 Bot 要將回覆張貼到哪裡：

- `"off"`：回覆是頂層訊息。傳入的執行緒訊息會留在父工作階段。
- `"inbound"`：只有當傳入訊息已在該執行緒中時，才在執行緒內回覆。
- `"always"`：在以觸發訊息為根的執行緒內回覆；該對話會從第一次觸發開始，透過相符的執行緒範圍工作階段路由。

`dm.threadReplies` 僅針對 DM 覆寫此設定 - 例如，讓房間執行緒保持隔離，同時讓 DM 維持扁平。

### 執行緒繼承與斜線命令

- 傳入的對話串訊息會將對話串根訊息納入為額外代理上下文。
- 訊息工具傳送在目標為同一個聊天室（或相同的 DM 使用者目標）時，會自動繼承目前的 Matrix 對話串，除非明確提供 `threadId`。
- 只有當目前工作階段中繼資料證明同一個 Matrix 帳號上的同一位 DM 對象時，DM 使用者目標重用才會啟用；否則 OpenClaw 會退回一般的使用者範圍路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及繫結對話串的 `/acp spawn` 都可在 Matrix 聊天室和 DM 中運作。
- 當 `threadBindings.spawnSessions` 啟用時，頂層 `/focus` 會建立新的 Matrix 對話串，並將其繫結至目標工作階段。
- 在既有 Matrix 對話串內執行 `/focus` 或 `/acp spawn --thread here`，會就地繫結該對話串。

當 OpenClaw 偵測到某個 Matrix DM 聊天室與同一個共用工作階段上的另一個 DM 聊天室衝突時，會在該聊天室張貼一次性 `m.notice`，指向 `/focus` 逃生出口並建議變更 `dm.sessionScope`。此通知只會在啟用對話串綁定時出現。

## ACP 對話綁定

Matrix 聊天室、DM，以及既有 Matrix 對話串，都可以轉換成持久的 ACP 工作區，而不需要變更聊天介面。

快速操作流程：

- 在你想繼續使用的 Matrix DM、聊天室或既有對話串內執行 `/acp spawn codex --bind here`。
- 在頂層 Matrix DM 或聊天室中，目前的 DM/聊天室會保留為聊天介面，未來訊息會路由至產生的 ACP 工作階段。
- 在既有 Matrix 對話串內，`--bind here` 會就地繫結目前對話串。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除綁定。

注意事項：

- `--bind here` 不會建立子 Matrix 對話串。
- `threadBindings.spawnSessions` 會控管 `/acp spawn --thread auto|here`，此時 OpenClaw 需要建立或繫結子 Matrix 對話串。

### 對話串綁定設定

Matrix 會從 `session.threadBindings` 繼承全域預設值，也支援每個通道覆寫：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 繫結對話串的工作階段產生預設為開啟：

- 設定 `threadBindings.spawnSessions: false`，可阻止頂層 `/focus` 和 `/acp spawn --thread auto|here` 建立/繫結 Matrix 對話串。
- 當原生子代理對話串產生不應分叉父層轉錄時，設定 `threadBindings.defaultSpawnContext: "isolated"`。

## 表情回應

Matrix 支援傳出表情回應、傳入表情回應通知，以及確認表情回應。

傳出表情回應工具由 `channels.matrix.actions.reactions` 控管：

- `react` 會為 Matrix 事件加入表情回應。
- `reactions` 會列出 Matrix 事件目前的表情回應摘要。
- `emoji=""` 會移除機器人在該事件上的自身表情回應。
- `remove: true` 只會移除機器人的指定 emoji 表情回應。

**解析順序**（第一個已定義的值勝出）：

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 每帳號 → 通道 → `messages.ackReaction` → 代理身分 emoji 後援                     |
| `ackReactionScope`      | 每帳號 → 通道 → `messages.ackReactionScope` → 預設 `"group-mentions"`            |
| `reactionNotifications` | 每帳號 → 通道 → 預設 `"own"`                                                     |

`reactionNotifications: "own"` 會在新增的 `m.reaction` 事件以機器人撰寫的 Matrix 訊息為目標時轉送這些事件；`"off"` 會停用表情回應系統事件。表情回應移除不會合成為系統事件，因為 Matrix 會將其呈現為修訂刪除，而不是獨立的 `m.reaction` 移除。

## 歷史上下文

- `channels.matrix.historyLimit` 控制當 Matrix 聊天室訊息觸發代理時，會有多少最近聊天室訊息以 `InboundHistory` 納入。會退回 `messages.groupChat.historyLimit`；如果兩者都未設定，有效預設值為 `0`。設定 `0` 可停用。
- Matrix 聊天室歷史只限聊天室。DM 會繼續使用一般工作階段歷史。
- Matrix 聊天室歷史僅限待處理：OpenClaw 會緩衝尚未觸發回覆的聊天室訊息，然後在提及或其他觸發到達時快照該視窗。
- 目前的觸發訊息不會包含在 `InboundHistory` 中；它會保留在該回合的主要傳入本文中。
- 同一個 Matrix 事件的重試會重用原始歷史快照，而不是向前漂移到較新的聊天室訊息。

## 上下文可見性

Matrix 支援共用的 `contextVisibility` 控制，用於補充聊天室上下文，例如擷取的回覆文字、對話串根訊息，以及待處理歷史。

- `contextVisibility: "all"` 是預設值。補充上下文會照收到的樣子保留。
- `contextVisibility: "allowlist"` 會將補充上下文篩選為作用中聊天室/使用者允許清單檢查所允許的傳送者。
- `contextVisibility: "allowlist_quote"` 的行為類似 `allowlist`，但仍會保留一則明確引用的回覆。

此設定影響補充上下文可見性，而不是傳入訊息本身是否可以觸發回覆。
觸發授權仍來自 `groupPolicy`、`groups`、`groupAllowFrom`，以及 DM 政策設定。

## DM 與聊天室政策

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

若要完全靜音 DM，同時保留聊天室運作，請設定 `dm.enabled: false`：

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

如果未核准的 Matrix 使用者在核准前持續傳訊息給你，OpenClaw 會重用同一個待處理配對碼，並可能在短暫冷卻後傳送提醒回覆，而不是鑄造新代碼。

請參閱 [配對](/zh-TW/channels/pairing)，了解共用 DM 配對流程和儲存配置。

## 直接聊天室修復

如果直接訊息狀態不同步，OpenClaw 可能會留下過時的 `m.direct` 對應，指向舊的單人聊天室，而不是即時 DM。檢查某位對象目前的對應：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

兩個命令都接受 `--account <id>`，用於多帳號設定。修復流程：

- 優先使用已在 `m.direct` 中對應的嚴格 1:1 DM
- 退回任何目前已加入且包含該使用者的嚴格 1:1 DM
- 如果沒有健康的 DM，則建立新的直接聊天室並重寫 `m.direct`

它不會自動刪除舊聊天室。它會選擇健康的 DM 並更新對應，讓未來的 Matrix 傳送、驗證通知，以及其他直接訊息流程都以正確聊天室為目標。

## Exec 核准

Matrix 可以作為原生核准用戶端。在 `channels.matrix.execApprovals` 下設定（或用 `channels.matrix.accounts.<account>.execApprovals` 作為每帳號覆寫）：

- `enabled`：透過 Matrix 原生提示傳遞核准。未設定或為 `"auto"` 時，只要至少可解析一位核准者，Matrix 就會自動啟用。設定 `false` 可明確停用。
- `approvers`：允許核准 exec 要求的 Matrix 使用者 ID（`@owner:example.org`）。選用，會退回 `channels.matrix.dm.allowFrom`。
- `target`：提示要送往的位置。`"dm"`（預設）會傳送至核准者 DM；`"channel"` 會傳送至來源 Matrix 聊天室或 DM；`"both"` 會同時傳送至兩者。
- `agentFilter` / `sessionFilter`：選用的允許清單，用於指定哪些代理/工作階段會觸發 Matrix 傳遞。

授權在不同核准類型之間略有差異：

- **Exec 核准**使用 `execApprovals.approvers`，並退回 `dm.allowFrom`。
- **Plugin 核准**只透過 `dm.allowFrom` 授權。

兩種類型共用 Matrix 表情回應捷徑和訊息更新。核准者會在主要核准訊息上看到表情回應捷徑：

- `✅` 允許一次
- `❌` 拒絕
- `♾️` 一律允許（當有效 exec 政策允許時）

後援斜線命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的核准者可以核准或拒絕。exec 核准的通道傳遞包含命令文字，只有在受信任的聊天室中才啟用 `channel` 或 `both`。

相關：[Exec 核准](/zh-TW/tools/exec-approvals)。

## 斜線命令

斜線命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在 DM 中運作。在聊天室中，OpenClaw 也會辨識以機器人自己的 Matrix 提及作為前綴的命令，因此 `@bot:server /new` 會觸發命令路徑，而不需要自訂提及 regex。這讓機器人能回應 Element 和類似用戶端在使用者輸入命令前以 Tab 補全機器人時發出的聊天室風格 `@mention /command` 貼文。

授權規則仍然適用：命令傳送者必須符合與一般訊息相同的 DM 或聊天室允許清單/擁有者政策。

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
- 使用 `groups.<room>.account` 將繼承的聊天室項目限制在特定帳號。沒有 `account` 的項目會在帳號之間共用；當預設帳號在頂層設定時，`account: "default"` 仍會運作。

**預設帳號選擇：**

- 設定 `defaultAccount`，以選擇隱含路由、探測和 CLI 命令偏好的具名帳號。
- 如果你有多個帳號，且其中一個實際命名為 `default`，即使未設定 `defaultAccount`，OpenClaw 也會隱含使用它。
- 如果你有多個具名帳號且未選取預設值，CLI 命令會拒絕猜測，請設定 `defaultAccount` 或傳入 `--account <id>`。
- 只有當頂層 `channels.matrix.*` 區塊的驗證資訊完整時（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），才會被視為隱含的 `default` 帳號。一旦快取憑證涵蓋驗證，具名帳號仍可從 `homeserver` + `userId` 探索。

**提升：**

- 當 OpenClaw 在修復或設定期間將單帳號設定提升為多帳號時，如果既有具名帳號存在，或 `defaultAccount` 已指向某個帳號，它會保留該帳號。只有 Matrix 驗證/啟動程序鍵會移入提升後的帳號；共用的傳遞政策鍵會保留在頂層。

請參閱 [設定參考](/zh-TW/gateway/config-channels#multi-account-all-channels)，了解共用的多帳號模式。

## 私有/LAN homeserver

預設情況下，OpenClaw 會阻擋私有/內部 Matrix homeserver 以提供 SSRF 保護，除非你
明確按帳號選擇加入。

如果你的 homeserver 執行於 localhost、LAN/Tailscale IP，或內部主機名稱，請為該 Matrix 帳號啟用
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

CLI 設定範例：

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

此選擇加入只允許受信任的私人／內部目標。公開的明文 homeserver，例如
`http://matrix.example.org:8008` 仍會被封鎖。請盡可能偏好使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要明確的外連 HTTP(S) Proxy，請設定 `channels.matrix.proxy`：

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

具名帳戶可以使用 `channels.matrix.accounts.<id>.proxy` 覆寫頂層預設值。
OpenClaw 會對執行階段 Matrix 流量和帳戶狀態探測使用相同的 Proxy 設定。

## 目標解析

在 OpenClaw 要求你提供房間或使用者目標的任何地方，Matrix 都接受以下目標格式：

- 使用者：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房間：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 別名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房間 ID 區分大小寫。在設定明確的傳遞目標、Cron 工作、繫結或允許清單時，請使用 Matrix 中完全相同大小寫的房間 ID。
OpenClaw 會讓內部工作階段金鑰保持標準化以供儲存，因此這些小寫金鑰不能作為 Matrix 傳遞 ID 的可靠來源。

即時目錄查詢會使用已登入的 Matrix 帳戶：

- 使用者查詢會查詢該 homeserver 上的 Matrix 使用者目錄。
- 房間查詢會直接接受明確的房間 ID 和別名。已加入房間的名稱查詢是盡力而為，而且只有在設定 `dangerouslyAllowNameMatching: true` 時，才會套用到執行階段房間允許清單。
- 如果房間名稱無法解析為 ID 或別名，執行階段允許清單解析會忽略它。

## 設定參考

允許清單樣式的使用者欄位（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 使用者 ID（最安全）。預設會忽略非 ID 使用者項目。如果你設定 `dangerouslyAllowNameMatching: true`，會在啟動時，以及監視器執行期間允許清單變更時，解析完全符合的 Matrix 目錄顯示名稱；無法解析的項目會在執行階段被忽略。

房間允許清單鍵 (`groups`，舊版 `rooms`) 應為房間 ID 或別名。純房間名稱鍵預設會被忽略；`dangerouslyAllowNameMatching: true` 會恢復針對已加入房間名稱的盡力查找。 

### 帳戶與連線

- `enabled`：啟用或停用此頻道。
- `name`：帳戶的可選顯示標籤。
- `defaultAccount`：設定多個 Matrix 帳戶時偏好的帳戶 ID。
- `accounts`：具名的每帳戶覆寫。頂層 `channels.matrix` 值會作為預設值繼承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允許此帳戶連線到 `localhost`、LAN/Tailscale IP 或內部主機名稱。
- `proxy`：Matrix 流量的可選 HTTP(S) 代理 URL。支援每帳戶覆寫。
- `userId`：完整 Matrix 使用者 ID（`@bot:example.org`）。
- `accessToken`：權杖式驗證的存取權杖。支援跨 env/file/exec 提供者的純文字與 SecretRef 值（[密鑰管理](/zh-TW/gateway/secrets)）。
- `password`：密碼式登入的密碼。支援純文字與 SecretRef 值。
- `deviceId`：明確的 Matrix 裝置 ID。
- `deviceName`：密碼登入時使用的裝置顯示名稱。
- `avatarUrl`：為個人資料同步與 `profile set` 更新儲存的自身頭像 URL。
- `initialSyncLimit`：啟動同步期間擷取的最大事件數。

### 加密

- `encryption`：啟用 E2EE。預設：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 開啟時的預設值）或 `"off"`。當此裝置尚未驗證時，啟動時會自動要求自我驗證。
- `startupVerificationCooldownHours`：下一次自動啟動要求前的冷卻時間。預設：`24`。

### 存取與政策

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。預設：`"allowlist"`。
- `groupAllowFrom`：房間流量的使用者 ID 允許清單。
- `dm.enabled`：當為 `false` 時，忽略所有 DM。預設：`true`。
- `dm.policy`：`"pairing"`（預設）、`"allowlist"`、`"open"` 或 `"disabled"`。在 bot 已加入並將房間分類為 DM 後套用；不影響邀請處理。
- `dm.allowFrom`：DM 流量的使用者 ID 允許清單。
- `dm.sessionScope`：`"per-user"`（預設）或 `"per-room"`。
- `dm.threadReplies`：僅限 DM 的回覆串接覆寫（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受來自其他已設定 Matrix bot 帳戶的訊息（`true` 或 `"mentions"`）。
- `allowlistOnly`：當為 `true` 時，強制所有作用中的 DM 政策（除了 `"disabled"`）與 `"open"` 群組政策改為 `"allowlist"`。不變更 `"disabled"` 政策。
- `dangerouslyAllowNameMatching`：當為 `true` 時，允許針對使用者允許清單項目進行 Matrix 顯示名稱目錄查找，以及針對房間允許清單鍵進行已加入房間名稱查找。偏好使用完整 `@user:server` ID 以及房間 ID 或別名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。預設：`"off"`。套用於每個 Matrix 邀請，包括 DM 風格邀請。
- `autoJoinAllowlist`：當 `autoJoin` 為 `"allowlist"` 時允許的房間/別名。別名項目會依據 homeserver 解析，而不是依據受邀房間宣稱的狀態。
- `contextVisibility`：補充內容可見性（`"all"` 預設、`"allowlist"`、`"allowlist_quote"`）。

### 回覆行為

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：針對執行緒綁定工作階段路由與生命週期的每頻道覆寫。
- `streaming`：`"off"`（預設）、`"partial"`、`"quiet"`，或物件形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：當為 `true` 時，完成的助理區塊會保留為獨立進度訊息。
- `markdown`：輸出文字的可選 Markdown 算繪設定。
- `responsePrefix`：附加到輸出回覆前方的可選字串。
- `textChunkLimit`：當 `chunkMode: "length"` 時，輸出分塊大小，以字元計。預設：`4000`。
- `chunkMode`：`"length"`（預設，依字元數分割）或 `"newline"`（在行邊界分割）。
- `historyLimit`：當房間訊息觸發 agent 時，作為 `InboundHistory` 包含的近期房間訊息數量。會回退到 `messages.groupChat.historyLimit`；有效預設值為 `0`（停用）。
- `mediaMaxMb`：輸出傳送與輸入處理的媒體大小上限，以 MB 計。

### 反應設定

- `ackReaction`：此頻道/帳戶的確認反應覆寫。
- `ackReactionScope`：範圍覆寫（`"group-mentions"` 預設、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：輸入反應通知模式（`"own"` 預設、`"off"`）。

### 工具與每房間覆寫

- `actions`：每動作工具閘控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：每房間政策對應。工作階段身分在解析後使用穩定的房間 ID。（`rooms` 是舊版別名。）
  - `groups.<room>.account`：將一個繼承的房間項目限制到特定帳戶。
  - `groups.<room>.allowBots`：頻道層級設定的每房間覆寫（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：每房間傳送者允許清單。
  - `groups.<room>.tools`：每房間工具允許/拒絕覆寫。
  - `groups.<room>.autoReply`：每房間提及閘控覆寫。`true` 會停用該房間的提及要求；`false` 會強制重新開啟。
  - `groups.<room>.skills`：每房間技能篩選器。
  - `groups.<room>.systemPrompt`：每房間系統提示片段。

### Exec 核准設定

- `execApprovals.enabled`：透過 Matrix 原生提示送出 exec 核准。
- `execApprovals.approvers`：允許核准的 Matrix 使用者 ID。會回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（預設）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用於傳遞的可選 agent/工作階段允許清單。

## 相關內容

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
