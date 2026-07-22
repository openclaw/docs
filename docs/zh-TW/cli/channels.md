---
read_when:
    - 你想要新增或移除頻道帳號（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp 等）
    - 你想要檢查頻道狀態或持續查看頻道日誌
    - 你需要檢查或重新提交失敗的頻道傳入事件
summary: '`openclaw channels` 的命令列介面參考（帳號、狀態、無法投遞的訊息、功能、解析、日誌、登入／登出）'
title: 頻道
x-i18n:
    generated_at: "2026-07-21T22:38:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 858f1f65de9b26dba3be712789141bc42cd0908c3a9284e40c3273c6972a0c65
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

`channels list` 僅顯示聊天頻道：預設顯示已設定的帳號，並為每個帳號附上 `installed`、`configured` 和 `enabled` 狀態標記（使用 `--json` 取得機器可讀輸出）。傳入 `--all`，也會顯示尚未設定帳號的內建頻道，以及尚未安裝到磁碟的可安裝目錄頻道。提供者驗證和模型用量位於其他位置：使用 `openclaw models auth list` 管理提供者驗證設定檔，使用 `openclaw status` 或 `openclaw models list` 查看用量／配額。

## 狀態／功能／解析／記錄

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`（預設為 `10000`）、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（需要 `--channel`）、`--target <dest>`（需要 `--channel`）、`--timeout <ms>`（預設為 `10000`，上限為 `30000`）、`--json`
- `channels resolve <entries...>`：`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（預設為 `auto`）、`--json`
- `channels logs`：`--channel <name|all>`（預設為 `all`）、`--lines <n>`（預設為 `200`）、`--json`

`channels status --probe` 是即時路徑：在可連線的閘道上，它會對每個帳號執行
`probeAccount` 和選用的 `auditAccount` 檢查，因此輸出可包含傳輸層
狀態，以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探測結果。
如果無法連線至閘道，`channels status` 會改用僅依據設定的摘要，
而非即時探測輸出。

## 傳入無法投遞項目

耗盡重試政策的傳入事件，會在佇列現有的失敗項目保留期間內，保留於共用狀態資料庫中。使用以下命令檢查一個頻道帳號：

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

文字檢視會顯示事件 ID、失敗原因、嘗試次數和失敗經過時間。JSON 輸出還會包含保留的承載資料、中繼資料、通道及嘗試時間戳記，以供診斷。

修正根本問題後，使用事件原始的事件 ID，將單一事件重新加入佇列：

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

請在閘道主機上執行這些命令，讓它們存取與頻道執行階段相同的共用狀態資料庫。重新提交會保留承載資料、中繼資料和通道，但會重設嘗試計數器與佇列中經過的時間。它會以不可分割的方式取代該事件的失敗標記，因此若事件仍在等待處理或已被領取時重複執行命令，系統會拒絕操作，而不會建立第二次分派。執行中的頻道會在下一次清空傳入項目時取得該事件。已完成的事件會維持終止狀態，無法重新提交。在加入承載資料保留功能之前建立的失敗資料列仍可能顯示於清單中，但由於其承載資料無法取得，重新提交會遭到拒絕。

`openclaw health` 會回報每個頻道帳號的無法投遞項目數量，以及最早失敗項目的經過時間。`openclaw doctor` 會列出受影響的帳號，並指向上述檢查命令。

請勿將 `openclaw sessions`、閘道 `sessions.list` 或代理程式
`sessions_list` 工具用作頻道通訊端健康狀態的訊號。這些介面回報的是
儲存的對話資料列，而非提供者的執行階段狀態。Discord 提供者
重新啟動後，已連線但沒有活動的帳號可能運作正常，但在下一個傳入或傳出對話事件發生之前，
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
對於由執行階段支援的頻道外掛，`channels remove` 也會要求執行中的閘道先停止所選帳號，再更新設定，因此停用或刪除帳號後，舊的接聽程式不會持續運作至重新啟動為止。

核心擁有的非互動式新增旗標包括 `--account <id>`、`--name <name>`、`--token`、`--token-file` 和 `--use-env`（由環境變數提供驗證資訊、僅限預設帳號，且須頻道支援）。頻道外掛會提供各自的設定旗標，包括 `--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--workspace`、`--http-url` 和 `--auth-dir`。頻道專用旗標包括：

| 頻道        | 旗標                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`                                   |
| iMessage    | `--cli-path`、`--db-path`、`--service`、`--region`                                                   |
| Matrix      | `--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit` |
| Nostr       | `--private-key`、`--relay-urls`                                                                      |
| Signal      | `--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`                          |
| Tlon        | `--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

如果在透過旗標驅動的新增命令期間需要安裝頻道外掛，OpenClaw 會使用該頻道的預設安裝來源，而不會開啟互動式外掛安裝提示。

當你執行 `openclaw channels add`，且未提供任何直接帳號、認證資訊或頻道設定旗標時，互動式精靈可以顯示提示。位置參數中的頻道 ID 和 `--channel <id>` 都會預先選取該頻道，但不會略過引導：

```bash
openclaw channels add telegram
openclaw channels add --channel telegram
```

精靈可以提示輸入：

- 每個所選頻道的帳號 ID
- 這些帳號的選用顯示名稱
- `Route these channel accounts to agents now?`

如果你確認立即繫結，精靈會詢問哪個代理程式應擁有各個已設定的頻道帳號，並寫入帳號範圍的路由繫結。

你之後也可以使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱[代理程式](/zh-TW/cli/agents)）。

當你將非預設帳號新增至仍使用單一帳號頂層設定的頻道時，OpenClaw 會先將這些頂層值提升至頻道的帳號對應表，再寫入新帳號。當頻道剛好有一個現有的具名帳號，或 `defaultAccount` 指向其中一個帳號時，提升作業會重用該帳號；否則這些值會存入 `channels.<channel>.accounts.default`。

路由行為會維持一致：

- 現有僅指定頻道的繫結（沒有 `accountId`）會繼續比對預設帳號。
- `channels add` 在非互動模式下不會自動建立或重寫繫結。
- 互動式設定可選擇新增帳號範圍的繫結。

如果你的設定已處於混合狀態（同時存在具名帳號和頂層單一帳號值），請執行 `openclaw doctor --fix`，將帳號範圍的值移至為該頻道選定的提升帳號。

## 登入與登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--account <id>` 和 `--verbose`；`channels logout` 支援 `--account <id>`。
- 當只有一個已設定的頻道支援該動作時，`channels login` 和 `logout` 可以推斷頻道；若有多個頻道，請傳入 `--channel`。
- 當可連線時，`channels logout` 會優先使用即時閘道路徑，因此登出時會先停止所有作用中的接聽程式，再清除頻道驗證狀態。如果無法連線至本機閘道，則會改用本機驗證清理；若使用 `gateway.mode: "remote"`，閘道錯誤會直接使命令失敗。
- 成功登入後，命令列介面會要求可連線的本機閘道啟動該帳號；在遠端模式下，它會將驗證資訊儲存於本機，並註明遠端執行階段尚未重新啟動。
- 請在閘道主機的終端機中執行 `channels login`。代理程式 `exec` 會封鎖此互動式登入流程；若有可用的頻道原生代理程式登入工具（例如 `whatsapp_login`），應從聊天中使用。

## 疑難排解

- 執行 `openclaw status --deep` 以進行廣泛探測。
- 使用 `openclaw doctor` 取得引導式修正。
- 當無法連線至閘道時，`openclaw channels status` 會改用僅依據設定的摘要。如果受支援的頻道認證資訊是透過 SecretRef 設定，但目前的命令路徑無法取得，系統會將該帳號回報為已設定並附上降級狀態註記，而不會顯示為未設定。

## 功能探測

取得提供者功能提示（可用時包含 intents／scopes）以及靜態功能支援資訊：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意事項：

- `--channel` 為選用；省略即可列出所有頻道（包括由外掛提供的頻道）。
- `--account` 僅能搭配 `--channel` 使用。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且僅適用於 Discord。對於 Discord 語音頻道，權限檢查會標示缺少的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探測依提供者而異：Discord 機器人身分與 intents，以及選用的頻道權限；Slack 機器人與使用者 scopes；Telegram 機器人旗標與網路鉤子；Signal 常駐程式版本；Microsoft Teams 應用程式權杖與 Graph 角色／scopes（已知時會加上註解）。沒有探測功能的頻道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用提供者目錄，將頻道／使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意事項：

- 使用 `--kind user|group|auto` 強制指定目標類型。
- 當多個項目具有相同名稱時，解析會優先採用作用中的相符項目。
- `channels resolve` 為唯讀。如果所選帳號透過 SecretRef 設定，但目前的命令路徑無法取得該認證資訊，命令會傳回附帶註記、功能受限且未解析的結果，而不會中止整次執行。
- `channels resolve` 不會安裝頻道外掛。若要解析可安裝目錄頻道的名稱，請先使用 `channels add --channel <name>`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [頻道概覽](/zh-TW/channels)
