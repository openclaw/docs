---
read_when:
    - 在 OpenClaw 中設定 Matrix
    - 設定 Matrix E2EE 與驗證
summary: Matrix 支援狀態、設定與組態範例
title: 矩陣
x-i18n:
    generated_at: "2026-05-06T09:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是 OpenClaw 的可下載頻道 Plugin。
它使用官方 `matrix-js-sdk`，並支援 DM、房間、執行緒、媒體、反應、投票、位置與 E2EE。

## 安裝

設定頻道前先安裝 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

從本機 checkout 安裝：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 會註冊並啟用 Plugin，因此不需要另外執行 `openclaw plugins enable matrix`。在你完成下方頻道設定前，Plugin 仍不會執行任何動作。一般 Plugin 行為與安裝規則請參閱 [Plugin](/zh-TW/tools/plugin)。

## 設定

1. 在你的 homeserver 上建立 Matrix 帳號。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 來設定 `channels.matrix`。
3. 重新啟動 Gateway。
4. 與 bot 開始 DM，或邀請它加入房間（請參閱 [auto-join](#auto-join) - 只有 `autoJoin` 允許時，新邀請才會進入）。

### 互動式設定

```bash
openclaw channels add
openclaw configure --section channels
```

精靈會詢問：homeserver URL、驗證方法（存取權杖或密碼）、使用者 ID（僅密碼驗證）、選用裝置名稱、是否啟用 E2EE，以及是否設定房間存取與 auto-join。

如果相符的 `MATRIX_*` 環境變數已存在，且所選帳號沒有已儲存的驗證資料，精靈會提供環境變數捷徑。若要在儲存允許清單前解析房間名稱，請執行 `openclaw channels resolve --channel matrix "Project Room"`。啟用 E2EE 時，精靈會寫入設定，並執行與 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的 bootstrap。

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

### Auto-join

`channels.matrix.autoJoin` 預設為 `off`。使用預設值時，除非你手動加入，否則 bot 不會出現在新邀請產生的新房間或 DM 中。

OpenClaw 無法在邀請時判斷受邀房間是 DM 還是群組，因此所有邀請 - 包含 DM 形式的邀請 - 都會先經過 `autoJoin`。`dm.policy` 只會在 bot 加入後、且房間已分類後才適用。

<Warning>
設定 `autoJoin: "allowlist"` 搭配 `autoJoinAllowlist`，以限制 bot 接受哪些邀請；或設定 `autoJoin: "always"` 來接受所有邀請。

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

### 允許清單目標格式

DM 與房間允許清單最適合填入穩定 ID：

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。只有 homeserver 目錄剛好回傳一筆相符結果時，顯示名稱才會解析。
- 房間（`groups`、`autoJoinAllowlist`）：使用 `!room:server` 或 `#alias:server`。名稱會盡力依已加入的房間解析；未解析的項目會在執行階段被忽略。

### 帳號 ID 正規化

精靈會將易讀名稱轉換成正規化的帳號 ID。例如，`Ops Bot` 會變成 `ops-bot`。標點符號會在 scoped 環境變數名稱中逸出，讓兩個帳號不會衝突：`-` → `_X2D_`，因此 `ops-prod` 會對應到 `MATRIX_OPS_X2D_PROD_*`。

### 快取認證

Matrix 會將快取認證儲存在 `~/.openclaw/credentials/matrix/` 底下：

- 預設帳號：`credentials.json`
- 具名帳號：`credentials-<account>.json`

當該處存在快取認證時，即使設定檔中沒有存取權杖，OpenClaw 也會將 Matrix 視為已設定 - 這涵蓋設定流程、`openclaw doctor` 與頻道狀態探測。

### 環境變數

在等效設定鍵未設定時使用。預設帳號使用未加前綴的名稱；具名帳號會在 suffix 前插入帳號 ID。

| 預設帳號              | 具名帳號（`<ID>` 是正規化帳號 ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

對於帳號 `ops`，名稱會變成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此類推。recovery-key 環境變數會由具備復原能力的 CLI 流程（`verify backup restore`、`verify device`、`verify bootstrap`）讀取，前提是你透過 `--recovery-key-stdin` pipe 金鑰。

`MATRIX_HOMESERVER` 不能從工作區 `.env` 設定；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

## 設定範例

具備 DM pairing、房間允許清單與 E2EE 的實用基準：

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

Matrix 回覆串流為選擇啟用。`streaming` 控制 OpenClaw 如何傳遞進行中的 assistant 回覆；`blockStreaming` 控制每個已完成的區塊是否保留為自己的 Matrix 訊息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留即時答案預覽，但隱藏中途的工具/進度行，請使用物件形式：

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
| `"off"`（預設） | 等待完整回覆後一次送出。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | 在模型寫入目前區塊時，就地編輯一則一般文字訊息。標準 Matrix 用戶端可能會在第一次預覽時通知，而不是在最終編輯時通知。              |
| `"quiet"`         | 與 `"partial"` 相同，但訊息是非通知的 notice。只有在每位使用者的 push rule 符合已完成編輯時，收件者才會收到通知（見下方）。 |

`blockStreaming` 與 `streaming` 彼此獨立：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（預設）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 目前區塊的即時草稿，已完成區塊保留為訊息 | 目前區塊的即時草稿，並就地完成 |
| `"off"`                 | 每個完成區塊一則會通知的 Matrix 訊息                     | 完整回覆一則會通知的 Matrix 訊息      |

注意事項：

- 如果預覽超過 Matrix 的單一事件大小限制，OpenClaw 會停止預覽串流，並退回只傳遞最終內容。
- 媒體回覆一律正常傳送附件。如果過期預覽已無法安全重用，OpenClaw 會先將其 redact，再傳送最終媒體回覆。
- 當 Matrix 預覽串流啟用時，工具進度預覽更新預設會啟用。設定 `streaming.preview.toolProgress: false` 可保留答案文字的預覽編輯，但讓工具進度走一般傳遞路徑。
- 預覽編輯會耗用額外的 Matrix API 呼叫。如果你想要最保守的速率限制設定檔，請維持 `streaming: "off"`。

## 核准中繼資料

Matrix 原生核准提示是一般 `m.room.message` 事件，並在 `com.openclaw.approval` 底下包含 OpenClaw 特定的自訂事件內容。Matrix 允許自訂事件內容鍵，因此標準用戶端仍會呈現文字 body，而支援 OpenClaw 的用戶端可以讀取結構化核准 id、kind、state、可用決策，以及 exec/Plugin 詳細資料。

當核准提示長到無法放入一個 Matrix 事件時，OpenClaw 會將可見文字分塊，並只把 `com.openclaw.approval` 附加到第一個分塊。允許/拒絕決策的反應會繫結到該第一個事件，因此長提示會與單一事件提示保留相同的核准目標。

### Quiet 最終預覽的自架 push rule

`streaming: "quiet"` 只會在區塊或 turn 完成後通知收件者 - 每位使用者的 push rule 必須符合最終預覽標記。完整作法（收件者權杖、pusher 檢查、規則安裝、各 homeserver 注意事項）請參閱 [quiet 預覽的 Matrix push rule](/zh-TW/channels/matrix-push-rules)。

## Bot 對 bot 房間

預設情況下，來自其他已設定 OpenClaw Matrix 帳號的 Matrix 訊息會被忽略。

當你明確想要代理間 Matrix 流量時，請使用 `allowBots`：

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

- `allowBots: true` 會在允許的房間與 DM 中，接受來自其他已設定 Matrix bot 帳號的訊息。
- `allowBots: "mentions"` 只有在這些訊息於房間中明顯提及此 bot 時才會接受。DM 仍會被允許。
- `groups.<room>.allowBots` 會覆寫單一房間的帳號層級設定。
- OpenClaw 仍會忽略來自相同 Matrix 使用者 ID 的訊息，以避免自我回覆迴圈。
- Matrix 在此不會公開原生 bot 旗標；OpenClaw 將「bot-authored」視為「由此 OpenClaw gateway 上另一個已設定 Matrix 帳號送出」。

在共享房間中啟用 bot 對 bot 流量時，請使用嚴格的房間允許清單與提及需求。

## 加密與驗證

在加密（E2EE）房間中，傳出的圖片事件會使用 `thumbnail_file`，讓圖片預覽與完整附件一同加密。未加密房間仍使用純 `thumbnail_url`。不需要設定 - Plugin 會自動偵測 E2EE 狀態。

所有 `openclaw matrix` 命令都接受 `--verbose`（完整診斷）、`--json`（機器可讀輸出）與 `--account <id>`（多帳號設定）。預設輸出精簡，且內部 SDK 記錄保持安靜。下方範例顯示標準形式；可依需要加入旗標。

### 啟用加密

```bash
openclaw matrix encryption setup
```

初始化秘密儲存與交叉簽署，必要時建立房間金鑰備份，然後列印狀態與後續步驟。實用旗標：

- `--recovery-key <key>` 在初始化前套用復原金鑰（建議使用下方記載的 stdin 形式）
- `--force-reset-cross-signing` 捨棄目前的交叉簽署身分並建立新的身分（僅在有意這麼做時使用）

對於新帳號，請在建立時啟用 E2EE：

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

`verify status` 會回報三個彼此獨立的信任訊號（`--verbose` 會顯示全部）：

- `Locally trusted`：僅受此用戶端信任
- `Cross-signing verified`：SDK 回報已透過交叉簽署驗證
- `Signed by owner`：由你自己的自我簽署金鑰簽署（僅供診斷）

只有在 `Cross-signing verified` 為 `yes` 時，`Verified by owner` 才會變成 `yes`。僅有本機信任或擁有者簽章並不足夠。

`--allow-degraded-local-state` 會在不先準備 Matrix 帳號的情況下傳回盡力而為的診斷；適合離線或部分設定完成的探測。

### 使用復原金鑰驗證此裝置

復原金鑰屬於敏感資訊，請透過 stdin 管線傳入，而不是在命令列上傳遞。設定 `MATRIX_RECOVERY_KEY`（或為具名帳號設定 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

此命令會回報三種狀態：

- `Recovery key accepted`：Matrix 已接受此金鑰，用於秘密儲存或裝置信任。
- `Backup usable`：可用受信任的復原材料載入房間金鑰備份。
- `Device verified by owner`：此裝置具有完整的 Matrix 交叉簽署身分信任。

即使復原金鑰已解鎖備份材料，只要完整身分信任尚未完成，它仍會以非零狀態結束。在這種情況下，請從另一個 Matrix 用戶端完成自我驗證：

```bash
openclaw matrix verify self
```

`verify self` 會等待 `Cross-signing verified: yes`，之後才會成功結束。使用 `--timeout-ms <ms>` 可調整等待時間。

也接受字面金鑰形式 `openclaw matrix verify device "<recovery-key>"`，但金鑰會留在你的 shell 歷史記錄中。

### 初始化或修復交叉簽署

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密帳號的修復與設定命令。它會依序：

- 初始化秘密儲存，並在可能時重用既有復原金鑰
- 初始化交叉簽署並上傳缺少的公開金鑰
- 標記並交叉簽署目前裝置
- 若尚不存在伺服器端房間金鑰備份，則建立一份

如果 homeserver 要求 UIA 才能上傳交叉簽署金鑰，OpenClaw 會先嘗試無驗證，接著嘗試 `m.login.dummy`，再嘗試 `m.login.password`（需要 `channels.matrix.password`）。

實用旗標：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用於捨棄目前的交叉簽署身分（僅限有意這麼做）

### 房間金鑰備份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 會顯示伺服器端備份是否存在，以及此裝置是否能解密它。`backup restore` 會將已備份的房間金鑰匯入本機加密儲存；如果復原金鑰已在磁碟上，可以省略 `--recovery-key-stdin`。

若要以新的基準取代損壞的備份（接受失去無法復原的舊歷史記錄；若目前備份秘密無法載入，也可以重新建立秘密儲存）：

```bash
openclaw matrix verify backup reset --yes
```

只有在你有意讓先前的復原金鑰無法再解鎖新的備份基準時，才加入 `--rotate-recovery-key`。

### 列出、請求與回應驗證

```bash
openclaw matrix verify list
```

列出所選帳號的待處理驗證請求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

從此 OpenClaw 帳號傳送驗證請求。`--own-user` 會請求自我驗證（你要在同一使用者的另一個 Matrix 用戶端接受提示）；`--user-id`/`--device-id`/`--room-id` 會指定其他人為目標。`--own-user` 不能與其他指定目標的旗標合併使用。

若要進行較底層的生命週期處理，通常是在跟隨另一個用戶端的傳入請求時，這些命令會作用於特定請求 `<id>`（由 `verify list` 與 `verify request` 列印）：

| 命令                                       | 用途                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受傳入請求                                                        |
| `openclaw matrix verify start <id>`        | 啟動 SAS 流程                                                       |
| `openclaw matrix verify sas <id>`          | 列印 SAS 表情符號或十進位數字                                      |
| `openclaw matrix verify confirm-sas <id>`  | 確認 SAS 與另一個用戶端顯示的內容相符                              |
| `openclaw matrix verify mismatch-sas <id>` | 當表情符號或十進位數字不相符時拒絕 SAS                             |
| `openclaw matrix verify cancel <id>`       | 取消；可接受選用的 `--reason <text>` 與 `--code <matrix-code>`      |

當驗證錨定到特定直接訊息房間時，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 與 `--room-id` 作為 DM 後續提示。

### 多帳號注意事項

若未指定 `--account <id>`，Matrix CLI 命令會使用隱含的預設帳號。如果你有多個具名帳號且尚未設定 `channels.matrix.defaultAccount`，它們會拒絕猜測並要求你選擇。當具名帳號停用 E2EE 或無法使用 E2EE 時，錯誤會指向該帳號的設定鍵，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="Startup behavior">
    使用 `encryption: true` 時，`startupVerification` 預設為 `"if-unverified"`。啟動時，未驗證的裝置會在另一個 Matrix 用戶端中請求自我驗證，略過重複請求並套用冷卻時間（預設為 24 小時）。可使用 `startupVerificationCooldownHours` 調整，或使用 `startupVerification: "off"` 停用。

    啟動也會執行保守的加密初始化流程，重用目前的秘密儲存與交叉簽署身分。如果初始化狀態損壞，即使沒有 `channels.matrix.password`，OpenClaw 也會嘗試受保護的修復；如果 homeserver 要求密碼 UIA，啟動會記錄警告並保持非致命。已由擁有者簽署的裝置會被保留。

    請參閱 [Matrix 遷移](/zh-TW/channels/matrix-migration) 了解完整升級流程。

  </Accordion>

  <Accordion title="Verification notices">
    Matrix 會以 `m.notice` 訊息將驗證生命週期通知發布到嚴格 DM 驗證房間：請求、就緒（含「透過表情符號驗證」指引）、開始/完成，以及可用時的 SAS（表情符號/十進位）詳細資料。

    來自另一個 Matrix 用戶端的傳入請求會被追蹤並自動接受。對於自我驗證，OpenClaw 會自動啟動 SAS 流程，並在表情符號驗證可用時確認自己的這一端；你仍需要在 Matrix 用戶端中比較並確認「它們相符」。

    驗證系統通知不會轉發到 agent 聊天管線。

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    如果 `verify status` 顯示目前裝置已不再列於 homeserver，請建立新的 OpenClaw Matrix 裝置。密碼登入：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    對於權杖驗證，請在你的 Matrix 用戶端或管理 UI 中建立新的存取權杖，然後更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    將 `assistant` 替換為失敗命令中的帳號 ID，或省略 `--account` 以使用預設帳號。

  </Accordion>

  <Accordion title="Device hygiene">
    舊的 OpenClaw 管理裝置可能會累積。列出並清除：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路徑，並以 `fake-indexeddb` 作為 IndexedDB shim。加密狀態會持久保存到 `crypto-idb-snapshot.json`（限制性檔案權限）。

    加密的執行階段狀態位於 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 底下，包含同步儲存、加密儲存、復原金鑰、IDB 快照、thread 繫結，以及啟動驗證狀態。當權杖變更但帳號身分維持不變時，OpenClaw 會重用最佳的既有 root，讓先前狀態仍可見。

  </Accordion>
</AccordionGroup>

## Profile 管理

更新所選帳號的 Matrix 自我 profile：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在一次呼叫中傳入兩個選項。Matrix 直接接受 `mxc://` avatar URL；當你傳入 `http://` 或 `https://` 時，OpenClaw 會先上傳檔案，並將解析後的 `mxc://` URL 存入 `channels.matrix.avatarUrl`（或每帳號覆寫值）。

## Threads

Matrix 支援原生 Matrix threads，可用於自動回覆與訊息工具傳送。兩個彼此獨立的調整項控制行為：

### 工作階段路由（`sessionScope`）

`dm.sessionScope` 決定 Matrix DM 房間如何對應到 OpenClaw 工作階段：

- `"per-user"`（預設）：與同一個已路由對等方的所有 DM 房間共用一個工作階段。
- `"per-room"`：每個 Matrix DM 房間都取得自己的工作階段鍵，即使對等方相同也一樣。

明確的對話繫結永遠優先於 `sessionScope`，因此已繫結的房間與 threads 會保留其選定的目標工作階段。

### 回覆 threading（`threadReplies`）

`threadReplies` 決定 bot 將回覆張貼到何處：

- `"off"`：回覆位於最上層。傳入的 threaded 訊息會留在父工作階段。
- `"inbound"`：只有在傳入訊息已位於該 thread 中時，才在 thread 內回覆。
- `"always"`：在以觸發訊息為 root 的 thread 中回覆；從第一次觸發開始，該對話會透過相符的 thread 範圍工作階段進行路由。

`dm.threadReplies` 僅針對 DM 覆寫此設定，例如讓房間 threads 保持隔離，同時讓 DM 維持扁平。

### Thread 繼承與斜線命令

- 傳入的執行緒訊息會將執行緒根訊息納入額外的代理脈絡。
- Message-tool 傳送在目標為同一個房間（或同一個 DM 使用者目標）時，會自動繼承目前的 Matrix 執行緒，除非提供明確的 `threadId`。
- 只有在目前工作階段中繼資料證明同一個 Matrix 帳號上的同一位 DM 對象時，才會啟用 DM 使用者目標重用；否則 OpenClaw 會退回一般的使用者範圍路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及繫結執行緒的 `/acp spawn` 都可在 Matrix 房間與 DM 中運作。
- 最上層 `/focus` 會建立新的 Matrix 執行緒，並在啟用 `threadBindings.spawnSessions` 時將它繫結到目標工作階段。
- 在既有 Matrix 執行緒內執行 `/focus` 或 `/acp spawn --thread here`，會就地繫結該執行緒。

當 OpenClaw 偵測到 Matrix DM 房間與同一個共用工作階段上的另一個 DM 房間衝突時，會在該房間張貼一次性的 `m.notice`，指向 `/focus` 這個脫離方式，並建議變更 `dm.sessionScope`。此通知只會在啟用執行緒繫結時出現。

## ACP 對話繫結

Matrix 房間、DM，以及既有 Matrix 執行緒，都可以在不變更聊天介面的情況下轉換為持久的 ACP 工作區。

快速操作流程：

- 在你想要繼續使用的 Matrix DM、房間，或既有執行緒內執行 `/acp spawn codex --bind here`。
- 在最上層 Matrix DM 或房間中，目前的 DM/房間會維持為聊天介面，未來訊息會路由至衍生的 ACP 工作階段。
- 在既有 Matrix 執行緒內，`--bind here` 會就地繫結目前的執行緒。
- `/new` 與 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

注意事項：

- `--bind here` 不會建立子 Matrix 執行緒。
- `threadBindings.spawnSessions` 會控管 `/acp spawn --thread auto|here`，此時 OpenClaw 需要建立或繫結子 Matrix 執行緒。

### 執行緒繫結設定

Matrix 會從 `session.threadBindings` 繼承全域預設值，也支援每個通道的覆寫：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 繫結執行緒的工作階段衍生預設為開啟：

- 設定 `threadBindings.spawnSessions: false`，可阻止最上層 `/focus` 與 `/acp spawn --thread auto|here` 建立/繫結 Matrix 執行緒。
- 當原生子代理執行緒衍生不應分支父層逐字稿時，設定 `threadBindings.defaultSpawnContext: "isolated"`。

## 反應

Matrix 支援外送反應、傳入反應通知，以及確認反應。

外送反應工具由 `channels.matrix.actions.reactions` 控管：

- `react` 會將反應新增到 Matrix 事件。
- `reactions` 會列出 Matrix 事件目前的反應摘要。
- `emoji=""` 會移除機器人在該事件上的自身反應。
- `remove: true` 只會移除機器人的指定表情符號反應。

**解析順序**（第一個已定義的值勝出）：

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 每帳號 → 通道 → `messages.ackReaction` → 代理身分表情符號備援                   |
| `ackReactionScope`      | 每帳號 → 通道 → `messages.ackReactionScope` → 預設 `"group-mentions"` |
| `reactionNotifications` | 每帳號 → 通道 → 預設 `"own"`                                          |

`reactionNotifications: "own"` 會轉送新增的 `m.reaction` 事件，當它們的目標是機器人撰寫的 Matrix 訊息時；`"off"` 會停用反應系統事件。反應移除不會合成為系統事件，因為 Matrix 會將這些呈現為撤回，而不是獨立的 `m.reaction` 移除。

## 歷史脈絡

- `channels.matrix.historyLimit` 控制當 Matrix 房間訊息觸發代理時，要將多少最近的房間訊息作為 `InboundHistory` 納入。會退回 `messages.groupChat.historyLimit`；如果兩者都未設定，實際預設值為 `0`。設定 `0` 可停用。
- Matrix 房間歷史只限房間。DM 仍使用一般工作階段歷史。
- Matrix 房間歷史僅限待處理訊息：OpenClaw 會緩衝尚未觸發回覆的房間訊息，然後在提及或其他觸發到達時快照該視窗。
- 目前的觸發訊息不會納入 `InboundHistory`；它會保留在該回合的主要傳入本文中。
- 同一個 Matrix 事件的重試會重用原始歷史快照，而不是向前漂移到較新的房間訊息。

## 脈絡可見性

Matrix 支援共用的 `contextVisibility` 控制，用於補充房間脈絡，例如擷取到的回覆文字、執行緒根，以及待處理歷史。

- `contextVisibility: "all"` 是預設值。補充脈絡會依接收內容保留。
- `contextVisibility: "allowlist"` 會篩選補充脈絡，只傳送來自主動房間/使用者允許清單檢查所允許的傳送者。
- `contextVisibility: "allowlist_quote"` 的行為類似 `allowlist`，但仍保留一則明確引用的回覆。

此設定會影響補充脈絡可見性，而不是傳入訊息本身是否可以觸發回覆。
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

若要完全讓 DM 靜音，同時讓房間繼續運作，請設定 `dm.enabled: false`：

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

請參閱[群組](/zh-TW/channels/groups)，了解提及門檻與允許清單行為。

Matrix DM 的配對範例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未核准的 Matrix 使用者在核准前持續傳訊息給你，OpenClaw 會重用同一個待處理配對碼，並可能在短暫冷卻後傳送提醒回覆，而不是鑄造新的代碼。

請參閱[配對](/zh-TW/channels/pairing)，了解共用 DM 配對流程與儲存配置。

## 直接房間修復

如果直接訊息狀態不同步，OpenClaw 可能會留下過時的 `m.direct` 對應，指向舊的單人房間，而不是目前有效的 DM。檢查某位對象目前的對應：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

這兩個命令都接受 `--account <id>`，用於多帳號設定。修復流程：

- 偏好已在 `m.direct` 中對應的嚴格 1:1 DM
- 退回與該使用者目前已加入的任何嚴格 1:1 DM
- 如果不存在健康的 DM，則建立新的直接房間並重寫 `m.direct`

它不會自動刪除舊房間。它會選擇健康的 DM 並更新對應，讓未來的 Matrix 傳送、驗證通知，以及其他直接訊息流程都以正確房間為目標。

## 執行核准

Matrix 可以作為原生核准用戶端。請在 `channels.matrix.execApprovals` 下設定（或在 `channels.matrix.accounts.<account>.execApprovals` 下設定每帳號覆寫）：

- `enabled`：透過 Matrix 原生提示傳遞核准。未設定或為 `"auto"` 時，只要至少可解析一位核准者，Matrix 就會自動啟用。設定 `false` 可明確停用。
- `approvers`：允許核准執行請求的 Matrix 使用者 ID（`@owner:example.org`）。選用 - 會退回 `channels.matrix.dm.allowFrom`。
- `target`：提示要送往何處。`"dm"`（預設）會傳送給核准者 DM；`"channel"` 會傳送到來源 Matrix 房間或 DM；`"both"` 會兩者都傳送。
- `agentFilter` / `sessionFilter`：選用允許清單，用於指定哪些代理/工作階段會觸發 Matrix 傳遞。

不同核准種類的授權略有差異：

- **執行核准**使用 `execApprovals.approvers`，並退回 `dm.allowFrom`。
- **Plugin 核准**只透過 `dm.allowFrom` 授權。

兩種類型共用 Matrix 反應快捷方式與訊息更新。核准者會在主要核准訊息上看到反應快捷方式：

- `✅` 允許一次
- `❌` 拒絕
- `♾️` 永遠允許（當有效執行政策允許時）

備援斜線命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的核准者可以核准或拒絕。執行核准的通道傳遞會包含命令文字 - 只在受信任的房間中啟用 `channel` 或 `both`。

相關：[執行核准](/zh-TW/tools/exec-approvals)。

## 斜線命令

斜線命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在 DM 中運作。在房間中，OpenClaw 也會辨識以機器人自身 Matrix 提及作為前綴的命令，因此 `@bot:server /new` 會在沒有自訂提及 regex 的情況下觸發命令路徑。這讓機器人能回應 Element 與類似用戶端在使用者以 Tab 補全機器人後輸入命令時發出的房間風格 `@mention /command` 貼文。

授權規則仍然適用：命令傳送者必須符合與一般訊息相同的 DM 或房間允許清單/擁有者政策。

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

- 除非帳號覆寫，最上層 `channels.matrix` 值會作為具名帳號的預設值。
- 使用 `groups.<room>.account` 將繼承的房間項目限定到特定帳號。沒有 `account` 的項目會在帳號之間共用；當預設帳號在最上層設定時，`account: "default"` 仍可運作。

**預設帳號選擇：**

- 設定 `defaultAccount`，可選取隱含路由、探測與 CLI 命令偏好的具名帳號。
- 如果你有多個帳號，而且其中一個確實名為 `default`，即使未設定 `defaultAccount`，OpenClaw 也會隱含使用它。
- 如果你有多個具名帳號且未選取預設值，CLI 命令會拒絕猜測 - 請設定 `defaultAccount` 或傳入 `--account <id>`。
- 最上層 `channels.matrix.*` 區塊只有在其驗證完整（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`）時，才會被視為隱含的 `default` 帳號。只要快取憑證涵蓋驗證，具名帳號仍可從 `homeserver` + `userId` 探索。

**升級：**

- 當 OpenClaw 在修復或設定期間將單帳號設定升級為多帳號時，如果既有具名帳號存在，或 `defaultAccount` 已經指向某個帳號，就會保留它。只有 Matrix 驗證/啟動鍵會移入升級後的帳號；共用傳遞政策鍵會保留在最上層。

請參閱[設定參考](/zh-TW/gateway/config-channels#multi-account-all-channels)，了解共用多帳號模式。

## 私有/LAN homeserver

依預設，為了 SSRF 防護，OpenClaw 會封鎖私有/內部 Matrix homeserver，除非你
明確為每個帳號選擇加入。

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

此選擇加入設定只允許受信任的私有／內部目標。公開的明文 homeserver（例如
`http://matrix.example.org:8008`）仍會被封鎖。請盡可能優先使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要明確的外送 HTTP(S) 代理，請設定 `channels.matrix.proxy`：

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

具名帳號可以透過 `channels.matrix.accounts.<id>.proxy` 覆寫頂層預設值。
OpenClaw 會將相同的代理設定用於執行階段 Matrix 流量與帳號狀態探查。

## 目標解析

凡是 OpenClaw 要求你提供房間或使用者目標的位置，Matrix 都接受以下目標格式：

- 使用者：`@user:server`、`user:@user:server`，或 `matrix:user:@user:server`
- 房間：`!room:server`、`room:!room:server`，或 `matrix:room:!room:server`
- 別名：`#alias:server`、`channel:#alias:server`，或 `matrix:channel:#alias:server`

Matrix 房間 ID 區分大小寫。設定明確的傳遞目標、cron 工作、繫結或允許清單時，請使用來自 Matrix 的精確房間 ID 大小寫。
OpenClaw 會保留標準化的內部工作階段鍵以供儲存，因此這些小寫鍵不是 Matrix 傳遞 ID 的可靠來源。

即時目錄查詢會使用已登入的 Matrix 帳號：

- 使用者查詢會查詢該 homeserver 上的 Matrix 使用者目錄。
- 房間查詢會直接接受明確的房間 ID 和別名，然後退回搜尋該帳號已加入的房間名稱。
- 已加入房間的名稱查詢是盡力而為。如果房間名稱無法解析成 ID 或別名，執行階段允許清單解析會忽略它。

## 設定參考

允許清單樣式欄位（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 使用者 ID（最安全）。精確的目錄符合項會在啟動時解析，也會在監視器執行期間允許清單變更時解析；無法解析的項目會在執行階段被忽略。基於相同原因，房間允許清單偏好使用房間 ID 或別名。

### 帳號與連線

- `enabled`：啟用或停用此頻道。
- `name`：帳號的選用顯示標籤。
- `defaultAccount`：設定多個 Matrix 帳號時偏好的帳號 ID。
- `accounts`：具名的個別帳號覆寫。頂層 `channels.matrix` 值會作為預設值繼承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允許此帳號連線到 `localhost`、LAN/Tailscale IP，或內部主機名稱。
- `proxy`：Matrix 流量的選用 HTTP(S) 代理 URL。支援個別帳號覆寫。
- `userId`：完整的 Matrix 使用者 ID（`@bot:example.org`）。
- `accessToken`：權杖式驗證的存取權杖。支援透過 env/file/exec 提供者提供純文字和 SecretRef 值（[祕密管理](/zh-TW/gateway/secrets)）。
- `password`：密碼式登入的密碼。支援純文字和 SecretRef 值。
- `deviceId`：明確的 Matrix 裝置 ID。
- `deviceName`：密碼登入時使用的裝置顯示名稱。
- `avatarUrl`：為個人檔案同步和 `profile set` 更新儲存的自我頭像 URL。
- `initialSyncLimit`：啟動同步期間擷取的事件數上限。

### 加密

- `encryption`：啟用 E2EE。預設：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 開啟時的預設值）或 `"off"`。當此裝置尚未驗證時，會在啟動時自動要求自我驗證。
- `startupVerificationCooldownHours`：下次自動啟動要求前的冷卻時間。預設：`24`。

### 存取與政策

- `groupPolicy`：`"open"`、`"allowlist"`，或 `"disabled"`。預設：`"allowlist"`。
- `groupAllowFrom`：房間流量的使用者 ID 允許清單。
- `dm.enabled`：為 `false` 時，忽略所有 DM。預設：`true`。
- `dm.policy`：`"pairing"`（預設）、`"allowlist"`、`"open"`，或 `"disabled"`。在 bot 已加入且將房間分類為 DM 後套用；不影響邀請處理。
- `dm.allowFrom`：DM 流量的使用者 ID 允許清單。
- `dm.sessionScope`：`"per-user"`（預設）或 `"per-room"`。
- `dm.threadReplies`：僅限 DM 的回覆執行緒化覆寫（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受來自其他已設定 Matrix bot 帳號的訊息（`true` 或 `"mentions"`）。
- `allowlistOnly`：為 `true` 時，會強制所有作用中的 DM 政策（除了 `"disabled"`）和 `"open"` 群組政策改為 `"allowlist"`。不會變更 `"disabled"` 政策。
- `autoJoin`：`"always"`、`"allowlist"`，或 `"off"`。預設：`"off"`。套用到每個 Matrix 邀請，包括 DM 樣式邀請。
- `autoJoinAllowlist`：當 `autoJoin` 為 `"allowlist"` 時允許的房間／別名。別名項目會針對 homeserver 解析，而不是針對受邀房間宣稱的狀態解析。
- `contextVisibility`：補充內容可見性（預設 `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 回覆行為

- `replyToMode`：`"off"`、`"first"`、`"all"`，或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"`，或 `"always"`。
- `threadBindings`：執行緒繫結工作階段路由和生命週期的個別頻道覆寫。
- `streaming`：`"off"`（預設）、`"partial"`、`"quiet"`，或物件形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：為 `true` 時，完成的助理區塊會保留為獨立的進度訊息。
- `markdown`：外送文字的選用 Markdown 轉譯設定。
- `responsePrefix`：前置於外送回覆的選用字串。
- `textChunkLimit`：當 `chunkMode: "length"` 時，以字元數計算的外送分塊大小。預設：`4000`。
- `chunkMode`：`"length"`（預設，依字元數分割）或 `"newline"`（在行邊界分割）。
- `historyLimit`：當房間訊息觸發代理時，作為 `InboundHistory` 納入的近期房間訊息數量。退回使用 `messages.groupChat.historyLimit`；有效預設值為 `0`（停用）。
- `mediaMaxMb`：外送傳送和內送處理的媒體大小上限（MB）。

### 反應設定

- `ackReaction`：此頻道／帳號的確認反應覆寫。
- `ackReactionScope`：範圍覆寫（預設 `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：內送反應通知模式（預設 `"own"`、`"off"`）。

### 工具與個別房間覆寫

- `actions`：個別動作工具閘控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：個別房間政策對應表。解析後，工作階段身分會使用穩定的房間 ID。（`rooms` 是舊版別名。）
  - `groups.<room>.account`：將一個繼承的房間項目限制到特定帳號。
  - `groups.<room>.allowBots`：頻道層級設定的個別房間覆寫（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：個別房間傳送者允許清單。
  - `groups.<room>.tools`：個別房間工具允許／拒絕覆寫。
  - `groups.<room>.autoReply`：個別房間提及閘控覆寫。`true` 會停用該房間的提及需求；`false` 會強制重新開啟。
  - `groups.<room>.skills`：個別房間 skill 篩選器。
  - `groups.<room>.systemPrompt`：個別房間系統提示片段。

### Exec 核准設定

- `execApprovals.enabled`：透過 Matrix 原生提示傳遞 exec 核准。
- `execApprovals.approvers`：允許核准的 Matrix 使用者 ID。退回使用 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（預設）、`"channel"`，或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：傳遞用的選用代理／工作階段允許清單。

## 相關

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化設定
