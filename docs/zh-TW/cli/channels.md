---
read_when:
    - 你想要新增或移除頻道帳號（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp 等）
    - 你想要檢查通道狀態或持續追蹤通道日誌
    - 你需要檢查或重新提交失敗的傳入頻道事件
summary: '`openclaw channels` 的命令列介面參考（帳號、狀態、無法投遞的訊息、功能、解析、日誌、登入／登出）'
title: 頻道
x-i18n:
    generated_at: "2026-07-19T13:39:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d276a1696aa9308867e5ec447788ffb3f2b8750c4d9744b2e68578b940558e8
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

在閘道上管理聊天頻道帳號及其執行階段狀態。

相關文件：

- 頻道指南：[頻道](/zh-TW/channels)
- 閘道設定：[設定](/zh-TW/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
openclaw channels dead-letters list --channel telegram --account default
```

`channels list` 僅顯示聊天頻道：預設顯示已設定的帳號，每個帳號會附有 `installed`、`configured` 和 `enabled` 狀態標籤（機器可讀輸出使用 `--json`）。傳入 `--all`，還會顯示尚未設定帳號的隨附頻道，以及尚未安裝到磁碟的可安裝目錄頻道。提供者驗證和模型用量位於其他位置：提供者驗證設定檔請使用 `openclaw models auth list`，用量／配額請使用 `openclaw status` 或 `openclaw models list`。

## 狀態／功能／解析／日誌

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`（預設 `10000`）、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（需要 `--channel`）、`--target <dest>`（需要 `--channel`）、`--timeout <ms>`（預設 `10000`，上限為 `30000`）、`--json`
- `channels resolve <entries...>`：`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（預設 `auto`）、`--json`
- `channels logs`：`--channel <name|all>`（預設 `all`）、`--lines <n>`（預設 `200`）、`--json`

`channels status --probe` 是即時路徑：在可連線的閘道上，它會針對每個帳號執行
`probeAccount` 和選用的 `auditAccount` 檢查，因此輸出可包含傳輸
狀態，以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探查結果。
如果無法連線至閘道，`channels status` 會改用僅含設定的摘要，
而非即時探查輸出。

## 傳入死信

已耗盡重試政策的傳入事件，會在佇列現有的失敗項目保留期間內留在共用狀態資料庫中。使用以下命令檢查頻道帳號：

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

文字檢視會顯示事件 ID、失敗原因、嘗試次數和失敗經過時間。JSON 輸出還會包含保留的承載資料、中繼資料、通道和嘗試時間戳記，以供診斷。

修正根本問題後，使用事件原始的事件 ID，將單一事件重新排入佇列：

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

請在閘道主機上執行這些命令，讓它們存取與頻道執行階段相同的共用狀態資料庫。重新提交會保留承載資料、中繼資料和通道，但會重設嘗試計數器和佇列存留時間。它會以不可分割的方式取代該事件的失敗標記，因此當事件正在等待處理或已被認領時重複執行命令，系統會拒絕操作，而不會建立第二次分派。執行中的頻道會在下次清空傳入佇列時取得該事件。已完成的事件維持終止狀態，無法重新提交。在加入承載資料保留功能前建立的失敗資料列仍可能出現在清單中，但由於其承載資料無法取得，系統會拒絕重新提交。

`openclaw health` 會回報每個頻道帳號的死信數量和最早失敗的經過時間。`openclaw doctor` 會列出受影響的帳號，並指向上述檢查命令。

請勿將 `openclaw sessions`、閘道 `sessions.list` 或代理程式
`sessions_list` 工具用作頻道通訊端健康狀態的訊號。這些介面回報的是
已儲存的對話資料列，而非提供者執行階段狀態。Discord 提供者
重新啟動後，已連線但沒有活動的帳號可能仍處於健康狀態，但在下次傳入或傳出對話事件發生前，
不會出現 Discord 工作階段資料列。

## 新增／移除帳號

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 會顯示各頻道的旗標（權杖、私密金鑰、應用程式權杖、signal-cli 路徑等）。
</Tip>

`channels remove` 僅適用於已安裝／已設定的頻道外掛。對於可安裝的目錄頻道，請先使用 `channels add`。若未使用 `--delete`，系統會詢問是否停用帳號並保留其設定；`--delete` 則會直接移除設定項目而不提示。
對於由執行階段支援的頻道外掛，`channels remove` 還會在更新設定前，要求執行中的閘道停止所選帳號，因此停用或刪除帳號後，舊的接聽程式不會持續運作到重新啟動為止。

各頻道共用的非互動式新增旗標：`--account <id>`、`--name <name>`、`--token`、`--token-file`、`--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--http-url`、`--auth-dir` 和 `--use-env`（由環境變數支援的驗證，僅限預設帳號，且僅適用於支援的頻道）。頻道專用旗標包括：

| 頻道        | 旗標                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`                                   |
| iMessage    | `--cli-path`、`--db-path`、`--service`、`--region`                                                   |
| Matrix      | `--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit` |
| Nostr       | `--private-key`、`--relay-urls`                                                                      |
| Signal      | `--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`                          |
| Tlon        | `--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

如果在透過旗標執行新增命令期間需要安裝頻道外掛，OpenClaw 會使用該頻道的預設安裝來源，而不開啟互動式外掛安裝提示。

當你不帶旗標執行 `openclaw channels add` 時，互動式精靈可能會提示：

- 每個所選頻道的帳號 ID
- 這些帳號的選用顯示名稱
- `Route these channel accounts to agents now?`

如果你確認立即繫結，精靈會詢問哪個代理程式應擁有每個已設定的頻道帳號，並寫入帳號範圍的路由繫結。

你也可以稍後使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱[代理程式](/zh-TW/cli/agents)）。

當你將非預設帳號新增至仍使用單一帳號頂層設定的頻道時，OpenClaw 會先將這些頂層值提升至頻道的帳號對應表，再寫入新帳號。當頻道恰好有一個現有的具名帳號，或 `defaultAccount` 指向某個帳號時，提升作業會重複使用該帳號；否則這些值會存入 `channels.<channel>.accounts.default`。

路由行為維持一致：

- 現有的僅限頻道繫結（沒有 `accountId`）會繼續比對預設帳號。
- `channels add` 不會在非互動模式中自動建立或重寫繫結。
- 互動式設定可選擇新增帳號範圍的繫結。

如果你的設定已處於混合狀態（存在具名帳號，但仍設定了頂層單一帳號值），請執行 `openclaw doctor --fix`，將帳號範圍的值移至為該頻道選定的提升帳號。

## 登入和登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--account <id>` 和 `--verbose`；`channels logout` 支援 `--account <id>`。
- 如果只有一個已設定的頻道支援該動作，`channels login` 和 `logout` 可以推斷頻道；若有多個頻道，請傳入 `--channel`。
- `channels logout` 會在閘道可連線時優先使用即時閘道路徑，因此登出會先停止任何作用中的接聽程式，再清除頻道驗證狀態。如果本機閘道無法連線，它會改用本機驗證清理；若使用 `gateway.mode: "remote"`，閘道錯誤會改為讓命令失敗。
- 成功登入後，命令列介面會要求可連線的本機閘道啟動該帳號；在遠端模式中，它會將驗證資訊儲存在本機，並註明遠端執行階段未重新啟動。
- 請從閘道主機上的終端機執行 `channels login`。代理程式 `exec` 會封鎖此互動式登入流程；若有提供頻道原生的代理程式登入工具（例如 `whatsapp_login`），則應從聊天中使用該工具。

## 疑難排解

- 執行 `openclaw status --deep` 以進行廣泛探查。
- 使用 `openclaw doctor` 取得引導式修正。
- 當無法連線至閘道時，`openclaw channels status` 會改用僅含設定的摘要。如果支援的頻道認證資訊是透過 SecretRef 設定，但目前的命令路徑無法取得該資訊，它會將該帳號回報為已設定並附上功能降級註記，而非顯示為未設定。

## 功能探查

擷取提供者功能提示（可用時包含意圖／範圍）及靜態功能支援：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意事項：

- `--channel` 為選用；省略它即可列出所有頻道（包括由外掛提供的頻道）。
- `--account` 僅可與 `--channel` 搭配使用。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且僅適用於 Discord。對於 Discord 語音頻道，權限檢查會標示缺少的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探查依提供者而異：Discord 機器人身分與意圖，以及選用的頻道權限；Slack 機器人與使用者範圍；Telegram 機器人旗標與網路鉤子；Signal 常駐程式版本；Microsoft Teams 應用程式權杖與 Graph 角色／範圍（已知時會加上註解）。沒有探查功能的頻道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用提供者目錄將頻道／使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意事項：

- 使用 `--kind user|group|auto` 強制指定目標類型。
- 當多個項目共用相同名稱時，解析會優先選擇作用中的相符項目。
- `channels resolve` 為唯讀。如果所選帳號是透過 SecretRef 設定，但目前的命令路徑無法取得該認證資訊，命令會傳回附帶註記的功能降級未解析結果，而非中止整次執行。
- `channels resolve` 不會安裝頻道外掛。為可安裝的目錄頻道解析名稱前，請先使用 `channels add --channel <name>`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [頻道概覽](/zh-TW/channels)
