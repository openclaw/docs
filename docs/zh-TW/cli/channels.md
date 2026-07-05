---
read_when:
    - 你想要新增或移除通道帳號（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp 等）
    - 你想檢查通道狀態或追蹤通道日誌
summary: '`openclaw channels` 的命令列介面參考（帳戶、狀態、功能、解析、日誌、登入/登出）'
title: 管道
x-i18n:
    generated_at: "2026-07-05T11:08:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理閘道上的聊天頻道帳號及其執行階段狀態。

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
```

`channels list` 只會顯示聊天頻道：預設為已設定的帳號，並針對每個帳號顯示 `installed`、`configured` 和 `enabled` 狀態標籤（使用 `--json` 取得機器可讀輸出）。傳入 `--all` 也會顯示尚未設定帳號的內建頻道，以及尚未在磁碟上的可安裝目錄頻道。提供者驗證與模型用量位於其他位置：使用 `openclaw models auth list` 查看提供者驗證設定檔，使用 `openclaw status` 或 `openclaw models list` 查看用量/配額。

## 狀態 / 功能 / 解析 / 記錄

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`（預設 `10000`）、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（需要 `--channel`）、`--target <dest>`（需要 `--channel`）、`--timeout <ms>`（預設 `10000`，上限為 `30000`）、`--json`
- `channels resolve <entries...>`：`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（預設 `auto`）、`--json`
- `channels logs`：`--channel <name|all>`（預設 `all`）、`--lines <n>`（預設 `200`）、`--json`

`channels status --probe` 是即時路徑：在可連線的閘道上，它會針對每個帳號執行
`probeAccount` 和選用的 `auditAccount` 檢查，因此輸出可包含傳輸
狀態以及探查結果，例如 `works`、`probe failed`、`audit ok` 或 `audit failed`。
如果無法連線到閘道，`channels status` 會退回為僅含設定的摘要，
而非即時探查輸出。

請勿使用 `openclaw sessions`、閘道 `sessions.list` 或代理程式
`sessions_list` 工具作為頻道 socket 健康狀態訊號。這些介面回報的是
已儲存的對話列，而不是提供者執行階段狀態。Discord 提供者
重新啟動後，已連線但安靜的帳號可能是健康的，但直到下一個傳入或傳出對話事件之前，
都不會出現 Discord 工作階段列。

## 新增 / 移除帳號

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 會顯示各頻道旗標（權杖、私密金鑰、應用程式權杖、signal-cli 路徑等）。
</Tip>

`channels remove` 只會作用於已安裝/已設定的頻道外掛。對於可安裝的目錄頻道，請先使用 `channels add`。沒有 `--delete` 時，它會詢問是否停用帳號並保留其設定；`--delete` 會移除設定項目且不提示。
對於有執行階段支援的頻道外掛，`channels remove` 也會在更新設定前，要求正在執行的閘道停止所選帳號，因此停用或刪除帳號不會讓舊的監聽器在重新啟動前保持作用中。

跨頻道共用的非互動式新增旗標：`--account <id>`、`--name <name>`、`--token`、`--token-file`、`--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--http-url`、`--auth-dir` 和 `--use-env`（以環境變數支援的驗證，僅限預設帳號，視支援情況而定）。頻道專屬旗標包括：

| 頻道        | 旗標                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

如果頻道外掛需要在旗標驅動的新增命令期間安裝，OpenClaw 會使用該頻道的預設安裝來源，而不開啟互動式外掛安裝提示。

當你不帶旗標執行 `openclaw channels add` 時，互動式精靈可以提示：

- 每個所選頻道的帳號 ID
- 這些帳號的選用顯示名稱
- `Route these channel accounts to agents now?`

如果你確認立即繫結，精靈會詢問哪個代理程式應擁有每個已設定的頻道帳號，並寫入帳號範圍的路由繫結。

你也可以稍後使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱 [代理程式](/zh-TW/cli/agents)）。

當你將非預設帳號新增到仍在使用單一帳號頂層設定的頻道時，OpenClaw 會先將這些頂層值提升到該頻道的帳號映射，再寫入新帳號。當頻道剛好有一個既有具名帳號，或 `defaultAccount` 指向其中一個帳號時，提升會重用該既有具名帳號；否則這些值會落在 `channels.<channel>.accounts.default`。

路由行為保持一致：

- 既有的僅頻道繫結（沒有 `accountId`）會繼續匹配預設帳號。
- `channels add` 不會在非互動模式中自動建立或改寫繫結。
- 互動式設定可以選擇性新增帳號範圍的繫結。

如果你的設定已經處於混合狀態（存在具名帳號，且頂層單一帳號值仍已設定），請執行 `openclaw doctor --fix`，將帳號範圍的值移到為該頻道選定的已提升帳號。

## 登入與登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--account <id>` 和 `--verbose`；`channels logout` 支援 `--account <id>`。
- 當只有一個已設定頻道支援該動作時，`channels login` 和 `logout` 可以推斷頻道；若有多個，請傳入 `--channel`。
- `channels logout` 在可連線時會優先使用即時閘道路徑，因此登出會在清除頻道驗證狀態前停止任何作用中的監聽器。如果無法連線到本機閘道，它會退回本機驗證清理；若使用 `gateway.mode: "remote"`，閘道錯誤會使命令失敗。
- 成功登入後，命令列介面會要求可連線的本機閘道啟動該帳號；在遠端模式中，它會在本機儲存驗證，並註明遠端執行階段尚未重新啟動。
- 請從閘道主機上的終端機執行 `channels login`。代理程式 `exec` 會阻擋此互動式登入流程；可用時，應從聊天中使用頻道原生的代理程式登入工具，例如 `whatsapp_login`。

## 疑難排解

- 執行 `openclaw status --deep` 進行廣泛探查。
- 使用 `openclaw doctor` 取得引導式修復。
- 當無法連線到閘道時，`openclaw channels status` 會退回為僅含設定的摘要。如果支援的頻道憑證是透過 SecretRef 設定，但在目前命令路徑中無法取得，它會將該帳號回報為已設定並附上降級註記，而不是顯示為未設定。

## 功能探查

擷取提供者功能提示（可用時包括 intents/scopes）以及靜態功能支援：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意事項：

- `--channel` 是選用的；省略它可列出每個頻道（包括外掛提供的頻道）。
- `--account` 只有搭配 `--channel` 時才有效。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且只適用於 Discord。對於 Discord 語音頻道，權限檢查會標記缺少的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探查依提供者而異：Discord Bot 身分 + intents，加上選用的頻道權限；Slack Bot + 使用者 scopes；Telegram Bot 旗標 + 網路鉤子；Signal daemon 版本；Microsoft Teams 應用程式權杖 + Graph 角色/scopes（在已知處加上註解）。沒有探查的頻道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用提供者目錄將頻道/使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意事項：

- 使用 `--kind user|group|auto` 強制指定目標類型。
- 當多個項目共用相同名稱時，解析會偏好作用中的匹配。
- `channels resolve` 是唯讀的。如果所選帳號是透過 SecretRef 設定，但該憑證在目前命令路徑中無法取得，命令會回傳降級的未解析結果並附上註記，而不是中止整次執行。
- `channels resolve` 不會安裝頻道外掛。對於可安裝的目錄頻道，請先使用 `channels add --channel <name>`，再解析名稱。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [頻道總覽](/zh-TW/channels)
