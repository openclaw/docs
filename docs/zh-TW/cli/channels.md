---
read_when:
    - 你想要新增/移除頻道帳戶（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（Plugin）/Signal/iMessage/Matrix）
    - 你想檢查頻道狀態或即時追蹤頻道日誌
summary: '`openclaw channels` 的 CLI 參考（帳戶、狀態、登入/登出、記錄）'
title: 通道
x-i18n:
    generated_at: "2026-05-11T20:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理 Gateway 上的聊天頻道帳戶及其執行階段狀態。

相關文件：

- 頻道指南：[頻道](/zh-TW/channels)
- Gateway 設定：[設定](/zh-TW/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` 只顯示聊天頻道：預設顯示已設定的帳戶，並為每個帳戶顯示 `installed`、`configured` 和 `enabled` 狀態標籤。傳入 `--all` 也會顯示尚未設定帳戶的內建頻道，以及尚未在磁碟上的可安裝目錄頻道。Auth 提供者（OAuth + API 金鑰）與模型提供者用量/配額快照不再於此列印；請使用 `openclaw models auth list` 查看提供者驗證設定檔，並使用 `openclaw status` 或 `openclaw models list` 查看用量。

## 狀態 / 功能 / 解析 / 記錄

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（只能與 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是即時路徑：在可連線的 Gateway 上，它會逐帳戶執行
`probeAccount` 和選用的 `auditAccount` 檢查，因此輸出可包含傳輸
狀態，以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探測結果。
如果無法連線到 Gateway，`channels status` 會退回只基於設定的摘要，
而非即時探測輸出。

請勿使用 `openclaw sessions`、Gateway `sessions.list` 或代理程式
`sessions_list` 工具作為頻道 socket 健康狀態訊號。這些介面回報的是
已儲存的對話列，而不是提供者執行階段狀態。Discord 提供者
重新啟動後，已連線但安靜的帳戶可能是健康的，但在下一個傳入或傳出對話事件前，
不會出現 Discord session
列。

## 新增 / 移除帳戶

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 會顯示各頻道的旗標（token、私鑰、app token、signal-cli 路徑等）。
</Tip>

`channels remove` 只會作用於已安裝/已設定的頻道 Plugin。對於可安裝目錄頻道，請先使用 `channels add`。
對於由執行階段支援的頻道 Plugin，`channels remove` 也會在更新設定前要求正在執行的 Gateway 停止所選帳戶，因此停用或刪除帳戶不會讓舊 listener 持續作用到重新啟動為止。

常見的非互動式新增介面包括：

- bot-token 頻道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 傳輸欄位：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 欄位：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 欄位：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 欄位：`--private-key`、`--relay-urls`
- Tlon 欄位：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env` 用於支援的預設帳戶環境變數驗證

如果在由旗標驅動的新增命令期間需要安裝頻道 Plugin，OpenClaw 會使用該頻道的預設安裝來源，而不開啟互動式 Plugin 安裝提示。

當你在沒有旗標的情況下執行 `openclaw channels add`，互動式精靈可能會提示：

- 每個所選頻道的帳戶 ID
- 這些帳戶的選用顯示名稱
- `Route these channel accounts to agents now?`

如果你確認立即繫結，精靈會詢問每個已設定頻道帳戶應由哪個代理程式擁有，並寫入帳戶範圍的路由繫結。

你也可以稍後使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱 [agents](/zh-TW/cli/agents)）。

當你將非預設帳戶新增到仍使用單帳戶頂層設定的頻道時，OpenClaw 會先將帳戶範圍的頂層值提升到該頻道的帳戶對應表，再寫入新帳戶。大多數頻道會將這些值落在 `channels.<channel>.accounts.default`，但內建頻道可以改為保留現有相符的已提升帳戶。Matrix 是目前的例子：如果已有一個具名帳戶存在，或 `defaultAccount` 指向現有具名帳戶，提升會保留該帳戶，而不是建立新的 `accounts.default`。

路由行為會保持一致：

- 現有僅限頻道的繫結（沒有 `accountId`）會繼續符合預設帳戶。
- `channels add` 在非互動模式中不會自動建立或重寫繫結。
- 互動式設定可選擇性新增帳戶範圍的繫結。

如果你的設定已處於混合狀態（具名帳戶已存在，且頂層單帳戶值仍已設定），請執行 `openclaw doctor --fix`，將帳戶範圍的值移入為該頻道選定的已提升帳戶。大多數頻道會提升到 `accounts.default`；Matrix 則可以改為保留現有的具名/預設目標。

## 登入與登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--verbose`。
- 當只設定一個受支援的登入目標時，`channels login` 和 `logout` 可以推斷頻道。
- `channels logout` 在可連線時會優先使用即時 Gateway 路徑，因此登出會在清除頻道驗證狀態前停止任何作用中的 listener。如果無法連線到本機 Gateway，則會退回本機驗證清理。
- 請從 Gateway 主機上的終端機執行 `channels login`。代理程式 `exec` 會阻塞這個互動式登入流程；可用時，應從聊天中使用頻道原生的代理程式登入工具，例如 `whatsapp_login`。

## 疑難排解

- 執行 `openclaw status --deep` 進行廣泛探測。
- 使用 `openclaw doctor` 取得引導式修復。
- `openclaw channels list` 不再列印模型提供者用量/配額快照。若要查看這些資訊，請使用 `openclaw status`（概觀）或 `openclaw models list`（依提供者）。
- 當 Gateway 無法連線時，`openclaw channels status` 會退回只基於設定的摘要。如果受支援的頻道憑證是透過 SecretRef 設定，但在目前命令路徑中無法使用，它會將該帳戶回報為已設定並附上降級說明，而不是顯示為未設定。

## 功能探測

擷取提供者功能提示（可用時包含 intents/scopes）以及靜態功能支援：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

備註：

- `--channel` 是選用的；省略它即可列出每個頻道（包括 extensions）。
- `--account` 只能與 `--channel` 一起使用。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且只適用於 Discord。對於 Discord 語音頻道，權限檢查會標記缺少的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探測因提供者而異：Discord intents + 選用頻道權限；Slack bot + user scopes；Telegram bot 旗標 + Webhook；Signal daemon 版本；Microsoft Teams app token + Graph roles/scopes（在已知處加註）。沒有探測的頻道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用提供者目錄將頻道/使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

備註：

- 使用 `--kind user|group|auto` 強制指定目標類型。
- 當多個項目共用相同名稱時，解析會偏好作用中的相符項目。
- `channels resolve` 是唯讀的。如果所選帳戶透過 SecretRef 設定，但該憑證在目前命令路徑中無法使用，命令會回傳降級的未解析結果並附上說明，而不是中止整個執行。
- `channels resolve` 不會安裝頻道 Plugin。對可安裝目錄頻道解析名稱前，請先使用 `channels add --channel <name>`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [頻道概觀](/zh-TW/channels)
