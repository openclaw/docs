---
read_when:
    - 在 OpenClaw 中設定 Matrix
    - 設定 Matrix E2EE 與驗證
summary: Matrix 支援狀態、設定與組態範例
title: 矩陣
x-i18n:
    generated_at: "2026-05-10T19:22:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix 是 OpenClaw 的可下載頻道 Plugin。
它使用官方 `matrix-js-sdk`，並支援 DM、聊天室、討論串、媒體、回應、投票、位置與 E2EE。

## 安裝

在設定頻道前，先從 ClawHub 安裝 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

裸 Plugin 規格會先嘗試 ClawHub，接著才退回 npm。若要強制指定 registry 來源，請使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

從本機 checkout 安裝：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 會註冊並啟用 Plugin，因此不需要另外執行 `openclaw plugins enable matrix` 步驟。Plugin 仍會在你完成下方頻道設定前不做任何事。一般 Plugin 行為與安裝規則請參閱 [Plugins](/zh-TW/tools/plugin)。

## 設定

1. 在你的 homeserver 建立 Matrix 帳號。
2. 使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password` 設定 `channels.matrix`。
3. 重新啟動 Gateway。
4. 與 Bot 開始 DM，或邀請它加入聊天室（請參閱 [自動加入](#auto-join) - 只有 `autoJoin` 允許的新邀請才會生效）。

### 互動式設定

```bash
openclaw channels add
openclaw configure --section channels
```

精靈會詢問：homeserver URL、驗證方式（存取權杖或密碼）、使用者 ID（僅限密碼驗證）、選用的裝置名稱、是否啟用 E2EE，以及是否設定聊天室存取與自動加入。

如果相符的 `MATRIX_*` 環境變數已存在，且所選帳號沒有已儲存的驗證資訊，精靈會提供環境變數捷徑。若要在儲存 allowlist 前解析聊天室名稱，請執行 `openclaw channels resolve --channel matrix "Project Room"`。啟用 E2EE 時，精靈會寫入設定，並執行與 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的 bootstrap。

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

`channels.matrix.autoJoin` 預設為 `off`。使用預設值時，在你手動加入前，Bot 不會出現在來自新邀請的新聊天室或 DM 中。

OpenClaw 無法在邀請時判斷受邀聊天室是 DM 還是群組，因此所有邀請，包括 DM 形式的邀請，都會先經過 `autoJoin`。`dm.policy` 只會在之後套用，也就是 Bot 已加入且聊天室已完成分類之後。

<Warning>
設定 `autoJoin: "allowlist"` 加上 `autoJoinAllowlist` 以限制 Bot 接受哪些邀請，或設定 `autoJoin: "always"` 以接受所有邀請。

`autoJoinAllowlist` 只接受穩定目標：`!roomId:server`、`#alias:server` 或 `*`。純聊天室名稱會被拒絕；別名項目會依 homeserver 解析，而不是依受邀聊天室宣稱的狀態解析。
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

DM 與聊天室 allowlist 最好填入穩定 ID：

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。只有在 homeserver 目錄剛好回傳一個相符項目時，顯示名稱才會解析。
- 聊天室（`groups`、`autoJoinAllowlist`）：使用 `!room:server` 或 `#alias:server`。名稱會盡力依已加入聊天室解析；未解析的項目會在執行時被忽略。

### 帳號 ID 正規化

精靈會將易讀名稱轉換成正規化帳號 ID。例如，`Ops Bot` 會變成 `ops-bot`。標點符號會在具範圍的環境變數名稱中逸出，讓兩個帳號不會衝突：`-` → `_X2D_`，因此 `ops-prod` 會對應到 `MATRIX_OPS_X2D_PROD_*`。

### 快取憑證

Matrix 會將快取憑證儲存在 `~/.openclaw/credentials/matrix/` 下：

- 預設帳號：`credentials.json`
- 具名帳號：`credentials-<account>.json`

當該處存在快取憑證時，即使存取權杖不在設定檔中，OpenClaw 也會將 Matrix 視為已設定，這涵蓋設定流程、`openclaw doctor` 與頻道狀態探測。

### 環境變數

當等效設定鍵未設定時使用。預設帳號使用未加前綴的名稱；具名帳號會將帳號 ID 插入後綴前。

| 預設帳號              | 具名帳號（`<ID>` 是正規化帳號 ID）         |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

對帳號 `ops` 來說，名稱會變成 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`，依此類推。當你透過 `--recovery-key-stdin` pipe 輸入金鑰時，recovery-aware CLI 流程（`verify backup restore`、`verify device`、`verify bootstrap`）會讀取復原金鑰環境變數。

`MATRIX_HOMESERVER` 不能從工作區 `.env` 設定；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

## 設定範例

包含 DM 配對、聊天室 allowlist 與 E2EE 的實用基準：

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

Matrix 回覆串流是選擇性啟用。`streaming` 控制 OpenClaw 如何傳遞進行中的助理回覆；`blockStreaming` 控制每個完成區塊是否保留為自己的 Matrix 訊息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

若要保留即時答案預覽但隱藏中繼工具/進度行，請使用物件
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
| `"off"`（預設） | 等待完整回覆後一次送出。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | 在模型寫入目前區塊時，就地編輯一則普通文字訊息。一般 Matrix 用戶端可能會在第一次預覽時通知，而不是在最終編輯時通知。              |
| `"quiet"`         | 與 `"partial"` 相同，但訊息是不發送通知的 notice。收件者只有在 per-user push rule 符合最終編輯時，才會收到通知（見下方）。 |

`blockStreaming` 與 `streaming` 彼此獨立：

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（預設）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 目前區塊的即時草稿，已完成區塊保留為訊息 | 目前區塊的即時草稿，就地完成 |
| `"off"`                 | 每個完成區塊一則會通知的 Matrix 訊息                     | 完整回覆一則會通知的 Matrix 訊息      |

注意事項：

- 如果預覽超過 Matrix 的 per-event 大小限制，OpenClaw 會停止預覽串流，並退回只傳送最終內容。
- 媒體回覆一律照常傳送附件。如果過期預覽無法再安全重用，OpenClaw 會在傳送最終媒體回覆前 redacts 它。
- 當 Matrix 預覽串流啟用時，工具進度預覽更新會預設啟用。設定 `streaming.preview.toolProgress: false` 可保留答案文字的預覽編輯，但讓工具進度走一般傳遞路徑。
- 預覽編輯會增加額外 Matrix API 呼叫。如果你想要最保守的速率限制配置，請保持 `streaming: "off"`。

## 核准中繼資料

Matrix 原生核准提示是一般 `m.room.message` 事件，並在 `com.openclaw.approval` 下帶有 OpenClaw 專用的自訂事件內容。Matrix 允許自訂事件內容鍵，因此一般用戶端仍會顯示文字本文，而 OpenClaw-aware 用戶端可以讀取結構化的核准 ID、種類、狀態、可用決策，以及 exec/Plugin 詳細資料。

當核准提示太長而無法放進單一 Matrix 事件時，OpenClaw 會將可見文字分塊，並只把 `com.openclaw.approval` 附加到第一個分塊。允許/拒絕決策的回應會綁定到該第一個事件，因此長提示會與單一事件提示保留相同核准目標。

### Quiet 最終預覽的自架 push rule

`streaming: "quiet"` 只會在區塊或 turn 最終確定時通知收件者，必須有 per-user push rule 符合最終預覽標記。完整做法（收件者權杖、pusher 檢查、規則安裝、每個 homeserver 的注意事項）請參閱 [Quiet 預覽的 Matrix push rule](/zh-TW/channels/matrix-push-rules)。

## Bot 對 Bot 聊天室

預設情況下，來自其他已設定 OpenClaw Matrix 帳號的 Matrix 訊息會被忽略。

當你有意要啟用代理之間的 Matrix 流量時，請使用 `allowBots`：

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

- `allowBots: true` 會接受來自其他已設定 Matrix Bot 帳號，且位於允許聊天室與 DM 中的訊息。
- `allowBots: "mentions"` 只會在這些訊息於聊天室中明顯提及此 Bot 時接受。DM 仍會允許。
- `groups.<room>.allowBots` 會覆寫單一聊天室的帳號層級設定。
- OpenClaw 仍會忽略來自相同 Matrix 使用者 ID 的訊息，以避免自我回覆迴圈。
- Matrix 在此不公開原生 Bot 旗標；OpenClaw 將「bot-authored」視為「由此 OpenClaw Gateway 上另一個已設定 Matrix 帳號傳送」。

在共享聊天室中啟用 Bot 對 Bot 流量時，請使用嚴格的聊天室 allowlist 與提及要求。

## 加密與驗證

在加密（E2EE）聊天室中，傳出的圖片事件會使用 `thumbnail_file`，讓圖片預覽與完整附件一同加密。未加密聊天室仍會使用純 `thumbnail_url`。不需要任何設定，Plugin 會自動偵測 E2EE 狀態。

所有 `openclaw matrix` 指令都接受 `--verbose`（完整診斷）、`--json`（機器可讀輸出）以及 `--account <id>`（多帳號設定）。輸出預設精簡，並使用安靜的內部 SDK 記錄。下方範例顯示標準形式；視需要加入這些旗標。

### 啟用加密

```bash
openclaw matrix encryption setup
```

啟動祕密儲存與交叉簽署，必要時建立房間金鑰備份，接著列印狀態與後續步驟。實用旗標：

- `--recovery-key <key>` 在啟動前套用復原金鑰（建議使用下方記錄的 stdin 形式）
- `--force-reset-cross-signing` 捨棄目前的交叉簽署身分並建立新的身分（僅在有意為之時使用）

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

`verify status` 會回報三個獨立信任訊號（`--verbose` 會顯示全部）：

- `Locally trusted`：僅受此用戶端信任
- `Cross-signing verified`：SDK 回報已透過交叉簽署驗證
- `Signed by owner`：由你自己的自我簽署金鑰簽署（僅供診斷）

只有在 `Cross-signing verified` 為 `yes` 時，`Verified by owner` 才會變成 `yes`。僅有本機信任或擁有者簽章並不足夠。

`--allow-degraded-local-state` 會在不先準備 Matrix 帳號的情況下回傳盡力而為的診斷；適用於離線或部分設定的探查。

### 使用復原金鑰驗證此裝置

復原金鑰很敏感，請透過 stdin 傳入，不要在命令列傳遞。設定 `MATRIX_RECOVERY_KEY`（或具名帳號使用 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

此指令會回報三種狀態：

- `Recovery key accepted`：Matrix 已接受該金鑰用於祕密儲存或裝置信任。
- `Backup usable`：可使用受信任的復原材料載入房間金鑰備份。
- `Device verified by owner`：此裝置具備完整的 Matrix 交叉簽署身分信任。

當完整身分信任尚未完成時，即使復原金鑰已解鎖備份材料，也會以非零狀態結束。遇到這種情況，請從另一個 Matrix 用戶端完成自我驗證：

```bash
openclaw matrix verify self
```

`verify self` 會等到 `Cross-signing verified: yes` 後才成功結束。使用 `--timeout-ms <ms>` 調整等待時間。

也支援文字金鑰形式 `openclaw matrix verify device "<recovery-key>"`，但金鑰會出現在你的 shell 歷史記錄中。

### 啟動或修復交叉簽署

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密帳號的修復與設定指令。依序會：

- 啟動祕密儲存，並在可行時重用現有復原金鑰
- 啟動交叉簽署並上傳缺少的公開金鑰
- 標記並交叉簽署目前裝置
- 若伺服器端房間金鑰備份尚不存在，則建立一個

如果 homeserver 需要 UIA 才能上傳交叉簽署金鑰，OpenClaw 會先嘗試無驗證，再嘗試 `m.login.dummy`，接著嘗試 `m.login.password`（需要 `channels.matrix.password`）。

實用旗標：

- `--recovery-key-stdin`（搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 用於捨棄目前的交叉簽署身分（僅限有意為之）

### 房間金鑰備份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 會顯示伺服器端備份是否存在，以及此裝置是否可解密它。`backup restore` 會將已備份的房間金鑰匯入本機加密儲存；如果復原金鑰已在磁碟上，可以省略 `--recovery-key-stdin`。

若要以新的基準取代損壞的備份（接受遺失無法復原的舊歷史；若目前的備份祕密無法載入，也可重新建立祕密儲存）：

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

從此 OpenClaw 帳號傳送驗證請求。`--own-user` 會請求自我驗證（你在同一使用者的另一個 Matrix 用戶端接受提示）；`--user-id`/`--device-id`/`--room-id` 則鎖定其他人。`--own-user` 不能與其他目標旗標合併使用。

對於較低階的生命週期處理，通常是在跟隨來自另一個用戶端的傳入請求時，這些指令會作用於特定請求 `<id>`（由 `verify list` 和 `verify request` 列印）：

| 指令                                       | 用途                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 接受傳入請求                                                        |
| `openclaw matrix verify start <id>`        | 啟動 SAS 流程                                                       |
| `openclaw matrix verify sas <id>`          | 列印 SAS 表情符號或十進位數字                                      |
| `openclaw matrix verify confirm-sas <id>`  | 確認 SAS 與另一個用戶端顯示的內容相符                              |
| `openclaw matrix verify mismatch-sas <id>` | 當表情符號或十進位數字不相符時拒絕 SAS                             |
| `openclaw matrix verify cancel <id>`       | 取消；接受選用的 `--reason <text>` 與 `--code <matrix-code>`        |

當驗證錨定到特定直接訊息房間時，`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 與 `--room-id` 作為 DM 後續提示。

### 多帳號注意事項

若未使用 `--account <id>`，Matrix CLI 指令會使用隱含的預設帳號。如果你有多個具名帳號，且尚未設定 `channels.matrix.defaultAccount`，它們會拒絕猜測並要求你選擇。當具名帳號停用或無法使用 E2EE 時，錯誤會指向該帳號的設定鍵，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="啟動行為">
    使用 `encryption: true` 時，`startupVerification` 預設為 `"if-unverified"`。啟動時，未驗證裝置會在另一個 Matrix 用戶端請求自我驗證，並略過重複請求且套用冷卻時間（預設 24 小時）。使用 `startupVerificationCooldownHours` 調整，或使用 `startupVerification: "off"` 停用。

    啟動時也會執行保守的加密啟動流程，重用目前的祕密儲存與交叉簽署身分。如果啟動狀態損壞，即使沒有 `channels.matrix.password`，OpenClaw 也會嘗試受保護的修復；如果 homeserver 需要密碼 UIA，啟動會記錄警告並保持非致命。已由擁有者簽署的裝置會被保留。

    請參閱 [Matrix 遷移](/zh-TW/channels/matrix-migration) 以了解完整升級流程。

  </Accordion>

  <Accordion title="驗證通知">
    Matrix 會將驗證生命週期通知作為 `m.notice` 訊息張貼到嚴格 DM 驗證房間：請求、就緒（含「透過表情符號驗證」指引）、開始/完成，以及可用時的 SAS（表情符號/十進位）詳細資料。

    來自另一個 Matrix 用戶端的傳入請求會被追蹤並自動接受。對於自我驗證，OpenClaw 會自動啟動 SAS 流程，並在表情符號驗證可用後確認自己的端點；你仍需要在 Matrix 用戶端中比較並確認「它們相符」。

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

    若使用權杖驗證，請在你的 Matrix 用戶端或管理 UI 中建立新的存取權杖，然後更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    將 `assistant` 替換為失敗指令中的帳號 ID，或省略 `--account` 以使用預設帳號。

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

    加密的執行階段狀態位於 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，包含同步儲存、加密儲存、復原金鑰、IDB 快照、執行緒繫結與啟動驗證狀態。當權杖改變但帳號身分維持相同時，OpenClaw 會重用最佳現有根目錄，讓先前狀態保持可見。

  </Accordion>
</AccordionGroup>

## 個人資料管理

更新所選帳號的 Matrix 自我個人資料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

你可以在同一次呼叫中傳入兩個選項。Matrix 直接接受 `mxc://` 頭像 URL；當你傳入 `http://` 或 `https://` 時，OpenClaw 會先上傳檔案，並將解析後的 `mxc://` URL 儲存到 `channels.matrix.avatarUrl`（或每帳號覆寫）。

## 執行緒

Matrix 支援原生 Matrix 執行緒，可用於自動回覆與訊息工具傳送。兩個獨立開關控制行為：

### 工作階段路由（`sessionScope`）

`dm.sessionScope` 決定 Matrix DM 房間如何對應到 OpenClaw 工作階段：

- `"per-user"`（預設）：與同一路由對象相關的所有 DM 房間共用一個工作階段。
- `"per-room"`：每個 Matrix DM 房間都有自己的工作階段鍵，即使對象相同亦然。

明確對話繫結一律優先於 `sessionScope`，因此已繫結的房間與執行緒會保留其選定的目標工作階段。

### 回覆執行緒（`threadReplies`）

`threadReplies` 決定機器人將回覆張貼到何處：

- `"off"`：回覆為頂層訊息。傳入的執行緒訊息會保留在父工作階段。
- `"inbound"`：只有在傳入訊息已位於該執行緒中時，才在執行緒內回覆。
- `"always"`：在以觸發訊息為根的執行緒內回覆；該對話從第一次觸發開始，就會透過相符的執行緒範圍工作階段進行路由。

`dm.threadReplies` 僅對 DM 覆寫此設定，例如讓房間執行緒保持隔離，同時讓 DM 維持扁平。

### 執行緒繼承與斜線指令

- 傳入的執行緒訊息會將執行緒根訊息納入額外的代理程式情境。
- 訊息工具傳送時，若目標是同一個房間（或同一個 DM 使用者目標），會自動繼承目前的 Matrix 執行緒，除非明確提供 `threadId`。
- DM 使用者目標重用只會在目前工作階段中繼資料證明同一個 Matrix 帳號上的同一個 DM 對象時啟用；否則 OpenClaw 會退回一般的使用者範圍路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及繫結執行緒的 `/acp spawn` 都可在 Matrix 房間和 DM 中使用。
- 當 `threadBindings.spawnSessions` 啟用時，頂層 `/focus` 會建立新的 Matrix 執行緒，並將其繫結到目標工作階段。
- 在既有 Matrix 執行緒中執行 `/focus` 或 `/acp spawn --thread here`，會就地繫結該執行緒。

當 OpenClaw 偵測到某個 Matrix DM 房間與同一個共享工作階段上的另一個 DM 房間衝突時，會在該房間發布一次性的 `m.notice`，指向 `/focus` 這個退出方式，並建議變更 `dm.sessionScope`。此通知只會在執行緒繫結啟用時出現。

## ACP 對話繫結

Matrix 房間、DM 和既有 Matrix 執行緒都可轉換為持久的 ACP 工作區，而不需要變更聊天介面。

快速操作流程：

- 在你想繼續使用的 Matrix DM、房間或既有執行緒中執行 `/acp spawn codex --bind here`。
- 在頂層 Matrix DM 或房間中，目前的 DM/房間會保留為聊天介面，未來訊息會路由到產生的 ACP 工作階段。
- 在既有 Matrix 執行緒中，`--bind here` 會就地繫結目前執行緒。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

注意事項：

- `--bind here` 不會建立子 Matrix 執行緒。
- `threadBindings.spawnSessions` 會控管 `/acp spawn --thread auto|here`，在這些情況下 OpenClaw 需要建立或繫結子 Matrix 執行緒。

### 執行緒繫結設定

Matrix 會從 `session.threadBindings` 繼承全域預設值，也支援每個頻道的覆寫：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 繫結執行緒的工作階段產生預設為啟用：

- 設定 `threadBindings.spawnSessions: false`，即可阻止頂層 `/focus` 和 `/acp spawn --thread auto|here` 建立/繫結 Matrix 執行緒。
- 當原生子代理程式執行緒產生不應分叉父轉錄時，設定 `threadBindings.defaultSpawnContext: "isolated"`。

## 反應

Matrix 支援傳出反應、傳入反應通知，以及確認反應。

傳出反應工具由 `channels.matrix.actions.reactions` 控管：

- `react` 會將反應新增到 Matrix 事件。
- `reactions` 會列出 Matrix 事件目前的反應摘要。
- `emoji=""` 會移除該事件上機器人自己的反應。
- `remove: true` 只會移除機器人的指定表情符號反應。

**解析順序**（先定義的值優先）：

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 每帳號 → 頻道 → `messages.ackReaction` → 代理程式身分表情符號備援               |
| `ackReactionScope`      | 每帳號 → 頻道 → `messages.ackReactionScope` → 預設 `"group-mentions"`           |
| `reactionNotifications` | 每帳號 → 頻道 → 預設 `"own"`                                                     |

`reactionNotifications: "own"` 會在新增的 `m.reaction` 事件以機器人撰寫的 Matrix 訊息為目標時轉送這些事件；`"off"` 會停用反應系統事件。反應移除不會合成為系統事件，因為 Matrix 會將它們呈現為撤回，而不是獨立的 `m.reaction` 移除。

## 歷史情境

- `channels.matrix.historyLimit` 控制 Matrix 房間訊息觸發代理程式時，要有多少則最近的房間訊息納入 `InboundHistory`。會退回使用 `messages.groupChat.historyLimit`；如果兩者都未設定，有效預設值為 `0`。設定為 `0` 可停用。
- Matrix 房間歷史僅限房間。DM 會繼續使用一般工作階段歷史。
- Matrix 房間歷史僅限待處理訊息：OpenClaw 會緩衝尚未觸發回覆的房間訊息，然後在提及或其他觸發抵達時快照該視窗。
- 目前的觸發訊息不會包含在 `InboundHistory` 中；它會保留在該回合的主要傳入本文中。
- 同一個 Matrix 事件的重試會重用原始歷史快照，而不會向前漂移到較新的房間訊息。

## 情境可見性

Matrix 支援共享的 `contextVisibility` 控制項，用於補充房間情境，例如擷取的回覆文字、執行緒根，以及待處理歷史。

- `contextVisibility: "all"` 是預設值。補充情境會依接收時保留。
- `contextVisibility: "allowlist"` 會篩選補充情境，只傳送來自作用中房間/使用者允許清單檢查所允許的傳送者。
- `contextVisibility: "allowlist_quote"` 的行為類似 `allowlist`，但仍會保留一則明確引用的回覆。

此設定影響補充情境的可見性，而不是傳入訊息本身是否可以觸發回覆。
觸發授權仍來自 `groupPolicy`、`groups`、`groupAllowFrom` 和 DM 原則設定。

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

若要完全靜音 DM 但維持房間正常運作，請設定 `dm.enabled: false`：

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

請參閱 [群組](/zh-TW/channels/groups)，了解提及控管和允許清單行為。

Matrix DM 的配對範例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未核准的 Matrix 使用者在核准前持續傳訊給你，OpenClaw 會重用同一個待處理配對碼，並可能在短暫冷卻後傳送提醒回覆，而不是產生新代碼。

請參閱 [配對](/zh-TW/channels/pairing)，了解共享的 DM 配對流程和儲存配置。

## 直接房間修復

如果直接訊息狀態不同步，OpenClaw 可能會留下過時的 `m.direct` 對應，指向舊的單人房間而不是目前有效的 DM。檢查某個對象目前的對應：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

這兩個命令都接受 `--account <id>`，可用於多帳號設定。修復流程：

- 優先使用已在 `m.direct` 中對應的嚴格 1:1 DM
- 退回使用目前已加入、與該使用者的任何嚴格 1:1 DM
- 如果沒有健康的 DM 存在，會建立全新的直接房間並重寫 `m.direct`

它不會自動刪除舊房間。它會選取健康的 DM 並更新對應，讓未來的 Matrix 傳送、驗證通知，以及其他直接訊息流程都能以正確房間為目標。

## Exec 核准

Matrix 可作為原生核准用戶端。在 `channels.matrix.execApprovals` 下設定（或在 `channels.matrix.accounts.<account>.execApprovals` 下設定每帳號覆寫）：

- `enabled`：透過 Matrix 原生提示傳遞核准。未設定或為 `"auto"` 時，只要至少能解析出一位核准者，Matrix 就會自動啟用。設定 `false` 可明確停用。
- `approvers`：允許核准 exec 請求的 Matrix 使用者 ID（`@owner:example.org`）。選用 - 會退回使用 `channels.matrix.dm.allowFrom`。
- `target`：提示傳送的位置。`"dm"`（預設）會傳送到核准者 DM；`"channel"` 會傳送到來源 Matrix 房間或 DM；`"both"` 會同時傳送到兩者。
- `agentFilter` / `sessionFilter`：選用允許清單，用於指定哪些代理程式/工作階段會觸發 Matrix 傳遞。

不同核准種類的授權略有差異：

- **Exec 核准** 使用 `execApprovals.approvers`，並退回使用 `dm.allowFrom`。
- **Plugin 核准** 只透過 `dm.allowFrom` 授權。

這兩種核准共用 Matrix 反應捷徑和訊息更新。核准者會在主要核准訊息上看到反應捷徑：

- `✅` 允許一次
- `❌` 拒絕
- `♾️` 永遠允許（當有效 exec 原則允許時）

備援斜線命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的核准者可以核准或拒絕。Exec 核准的頻道傳遞會包含命令文字 - 只應在受信任房間中啟用 `channel` 或 `both`。

相關：[Exec 核准](/zh-TW/tools/exec-approvals)。

## 斜線命令

斜線命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）可直接在 DM 中使用。在房間中，OpenClaw 也會辨識以機器人自己的 Matrix 提及作為前綴的命令，因此 `@bot:server /new` 會觸發命令路徑，而不需要自訂提及 regex。這讓機器人能回應 Element 和類似用戶端在使用者先以 Tab 補全機器人再輸入命令時所發出的房間風格 `@mention /command` 貼文。

授權規則仍然適用：命令傳送者必須符合與一般訊息相同的 DM 或房間允許清單/擁有者原則。

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

- 頂層 `channels.matrix` 值會作為已命名帳號的預設值，除非帳號覆寫它們。
- 使用 `groups.<room>.account` 將繼承的房間項目限定到特定帳號。沒有 `account` 的項目會在帳號之間共享；當預設帳號在頂層設定時，`account: "default"` 仍可運作。

**預設帳號選擇：**

- 設定 `defaultAccount`，即可選取隱含路由、探測和 CLI 命令偏好的已命名帳號。
- 如果你有多個帳號，且其中一個真的命名為 `default`，即使未設定 `defaultAccount`，OpenClaw 也會隱含使用它。
- 如果你有多個已命名帳號且沒有選取預設帳號，CLI 命令會拒絕猜測 - 請設定 `defaultAccount` 或傳入 `--account <id>`。
- 頂層 `channels.matrix.*` 區塊只會在其驗證資訊完整時（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`），被視為隱含的 `default` 帳號。只要快取憑證涵蓋驗證，已命名帳號仍可從 `homeserver` + `userId` 探索。

**提升：**

- 當 OpenClaw 在修復或設定期間將單帳號設定提升為多帳號時，如果既有的已命名帳號存在，或 `defaultAccount` 已經指向某個帳號，它會保留該帳號。只有 Matrix 驗證/啟動金鑰會移入提升後的帳號；共享的傳遞原則金鑰會保留在頂層。

請參閱 [設定參考](/zh-TW/gateway/config-channels#multi-account-all-channels)，了解共享的多帳號模式。

## 私有/LAN homeserver

預設情況下，為了 SSRF 保護，OpenClaw 會封鎖私有/內部 Matrix homeserver，除非你
明確為每個帳號選擇加入。

如果你的 homeserver 執行在 localhost、LAN/Tailscale IP，或內部主機名稱上，請為該 Matrix 帳號啟用
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

此選擇加入設定只允許受信任的私人／內部目標。公開的明文 homeserver，例如
`http://matrix.example.org:8008`，仍會遭到封鎖。請盡可能優先使用 `https://`。

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
OpenClaw 會對執行階段 Matrix 流量和帳號狀態探測使用相同的代理設定。

## 目標解析

在 OpenClaw 要求你提供房間或使用者目標的任何地方，Matrix 接受以下目標形式：

- 使用者：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房間：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 別名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房間 ID 區分大小寫。設定明確的傳送目標、Cron 作業、綁定或允許清單時，請使用 Matrix 中確切的房間 ID 大小寫。
OpenClaw 會將內部工作階段金鑰維持為適合儲存的標準形式，因此這些小寫金鑰並不是 Matrix 傳送 ID 的可靠來源。

即時目錄查詢會使用已登入的 Matrix 帳號：

- 使用者查詢會在該 homeserver 上查詢 Matrix 使用者目錄。
- 房間查詢會先直接接受明確的房間 ID 和別名，然後再退回搜尋該帳號已加入的房間名稱。
- 已加入房間名稱查詢是盡力而為。如果房間名稱無法解析為 ID 或別名，執行階段允許清單解析會忽略它。

## 設定參考

允許清單樣式的欄位（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 使用者 ID（最安全）。精確的目錄相符項會在啟動時解析，也會在監控器執行期間允許清單變更時解析；無法解析的項目會在執行階段被忽略。基於相同原因，房間允許清單偏好使用房間 ID 或別名。

### 帳戶與連線

- `enabled`：啟用或停用此頻道。
- `name`：帳戶的選用顯示標籤。
- `defaultAccount`：設定多個 Matrix 帳戶時偏好的帳戶 ID。
- `accounts`：具名的個別帳戶覆寫。頂層 `channels.matrix` 值會繼承為預設值。
- `homeserver`：家伺服器 URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允許此帳戶連線到 `localhost`、LAN/Tailscale IP 或內部主機名稱。
- `proxy`：Matrix 流量的選用 HTTP(S) Proxy URL。支援個別帳戶覆寫。
- `userId`：完整的 Matrix 使用者 ID（`@bot:example.org`）。
- `accessToken`：權杖式驗證的存取權杖。支援透過環境變數/檔案/執行提供者使用純文字和 SecretRef 值（[祕密管理](/zh-TW/gateway/secrets)）。
- `password`：密碼式登入的密碼。支援純文字和 SecretRef 值。
- `deviceId`：明確的 Matrix 裝置 ID。
- `deviceName`：密碼登入時使用的裝置顯示名稱。
- `avatarUrl`：為個人資料同步和 `profile set` 更新儲存的自我頭像 URL。
- `initialSyncLimit`：啟動同步期間擷取的事件數上限。

### 加密

- `encryption`：啟用 E2EE。預設值：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 開啟時的預設值）或 `"off"`。當此裝置未驗證時，啟動時自動請求自我驗證。
- `startupVerificationCooldownHours`：下一次自動啟動請求前的冷卻時間。預設值：`24`。

### 存取與政策

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。預設值：`"allowlist"`。
- `groupAllowFrom`：房間流量的使用者 ID 允許清單。
- `dm.enabled`：為 `false` 時，忽略所有私訊。預設值：`true`。
- `dm.policy`：`"pairing"`（預設值）、`"allowlist"`、`"open"` 或 `"disabled"`。在機器人已加入並將房間分類為私訊後套用；不影響邀請處理。
- `dm.allowFrom`：私訊流量的使用者 ID 允許清單。
- `dm.sessionScope`：`"per-user"`（預設值）或 `"per-room"`。
- `dm.threadReplies`：僅限私訊的回覆執行緒覆寫（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受來自其他已設定 Matrix 機器人帳戶的訊息（`true` 或 `"mentions"`）。
- `allowlistOnly`：為 `true` 時，強制所有作用中的私訊政策（除了 `"disabled"`）和 `"open"` 群組政策使用 `"allowlist"`。不會變更 `"disabled"` 政策。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。預設值：`"off"`。套用至每個 Matrix 邀請，包括私訊樣式的邀請。
- `autoJoinAllowlist`：當 `autoJoin` 為 `"allowlist"` 時允許的房間/別名。別名項目會對家伺服器解析，而不是對受邀房間聲稱的狀態解析。
- `contextVisibility`：補充內容可見性（預設為 `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 回覆行為

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：執行緒綁定的工作階段路由和生命週期的個別頻道覆寫。
- `streaming`：`"off"`（預設值）、`"partial"`、`"quiet"`，或物件形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：為 `true` 時，已完成的助理區塊會保留為獨立的進度訊息。
- `markdown`：外寄文字的選用 Markdown 算繪設定。
- `responsePrefix`：附加到外寄回覆前方的選用字串。
- `textChunkLimit`：當 `chunkMode: "length"` 時，以字元計算的外寄區塊大小。預設值：`4000`。
- `chunkMode`：`"length"`（預設值，依字元數分割）或 `"newline"`（在行邊界分割）。
- `historyLimit`：房間訊息觸發代理程式時，作為 `InboundHistory` 包含的近期房間訊息數。回退為 `messages.groupChat.historyLimit`；有效預設值為 `0`（停用）。
- `mediaMaxMb`：外寄傳送和傳入處理的媒體大小上限，以 MB 為單位。

### 反應設定

- `ackReaction`：此頻道/帳戶的確認反應覆寫。
- `ackReactionScope`：範圍覆寫（預設為 `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：傳入反應通知模式（預設為 `"own"`、`"off"`）。

### 工具與個別房間覆寫

- `actions`：個別動作的工具控管（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：個別房間政策對應。工作階段身分會在解析後使用穩定的房間 ID。（`rooms` 是舊版別名。）
  - `groups.<room>.account`：將一個繼承的房間項目限制為特定帳戶。
  - `groups.<room>.allowBots`：頻道層級設定的個別房間覆寫（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：個別房間的傳送者允許清單。
  - `groups.<room>.tools`：個別房間的工具允許/拒絕覆寫。
  - `groups.<room>.autoReply`：個別房間的提及控管覆寫。`true` 會停用該房間的提及要求；`false` 會強制重新開啟。
  - `groups.<room>.skills`：個別房間的 Skills 篩選器。
  - `groups.<room>.systemPrompt`：個別房間的系統提示片段。

### 執行核准設定

- `execApprovals.enabled`：透過 Matrix 原生提示傳遞執行核准。
- `execApprovals.approvers`：允許核准的 Matrix 使用者 ID。回退為 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（預設值）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：用於傳遞的選用代理程式/工作階段允許清單。

## 相關

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及控管
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
