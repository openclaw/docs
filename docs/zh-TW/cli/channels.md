---
read_when:
    - 你想要新增/移除通道帳號（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix）
    - 你想檢查頻道狀態或即時追蹤頻道日誌
summary: '`openclaw channels` 的 CLI 參考（帳戶、狀態、登入/登出、日誌）'
title: 通道
x-i18n:
    generated_at: "2026-05-10T19:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

在 Gateway 上管理聊天頻道帳戶及其執行階段狀態。

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

`channels list` 只顯示聊天頻道：預設顯示已設定的帳戶，並為每個帳戶標示 `installed`、`configured` 和 `enabled` 狀態標籤。傳入 `--all` 也會顯示尚未設定帳戶的內建頻道，以及尚未存在於磁碟上的可安裝目錄頻道。這裡不再列印驗證提供者（OAuth + API 金鑰）和模型提供者使用量/配額快照；請使用 `openclaw models auth list` 查看提供者驗證設定檔，並使用 `openclaw status` 或 `openclaw models list` 查看使用量。

## 狀態 / 功能 / 解析 / 記錄

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（僅可搭配 `--channel`）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是即時路徑：在可連線的 Gateway 上，它會逐帳戶執行
`probeAccount` 和選用的 `auditAccount` 檢查，因此輸出可能包含傳輸
狀態，以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探測結果。
如果無法連線至 Gateway，`channels status` 會退回只根據設定的摘要，
而不是即時探測輸出。

請不要使用 `openclaw sessions`、Gateway `sessions.list` 或代理程式
`sessions_list` 工具作為頻道 socket 健康狀態訊號。這些介面回報的是
已儲存的對話資料列，而不是提供者執行階段狀態。Discord 提供者
重新啟動後，已連線但安靜的帳戶可能是健康的，但在下一個傳入或傳出對話事件前，
不會出現 Discord 工作階段資料列。

## 新增 / 移除帳戶

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 會顯示各頻道旗標（權杖、私鑰、應用程式權杖、signal-cli 路徑等）。
</Tip>

`channels remove` 只會對已安裝/已設定的頻道 Plugin 操作。對於可安裝的目錄頻道，請先使用 `channels add`。
對於由執行階段支援的頻道 Plugin，`channels remove` 也會要求執行中的 Gateway 在更新設定前停止選取的帳戶，因此停用或刪除帳戶後，舊的監聽器不會持續作用到重新啟動為止。

常見的非互動式新增介面包括：

- 機器人權杖頻道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 傳輸欄位：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 欄位：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 欄位：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 欄位：`--private-key`、`--relay-urls`
- Tlon 欄位：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env` 用於支援的預設帳戶環境變數驗證

如果在透過旗標驅動的新增命令中需要安裝頻道 Plugin，OpenClaw 會使用該頻道的預設安裝來源，而不會開啟互動式 Plugin 安裝提示。

當你在沒有旗標的情況下執行 `openclaw channels add`，互動式精靈可能會提示：

- 每個已選頻道的帳戶 ID
- 這些帳戶的選用顯示名稱
- `Route these channel accounts to agents now?`

如果你確認立即繫結，精靈會詢問哪個代理程式應擁有每個已設定的頻道帳戶，並寫入帳戶範圍的路由繫結。

你也可以稍後使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱 [agents](/zh-TW/cli/agents)）。

當你將非預設帳戶新增到仍使用單帳戶頂層設定的頻道時，OpenClaw 會先將帳戶範圍的頂層值提升到該頻道的帳戶對應表，再寫入新帳戶。大多數頻道會將這些值放入 `channels.<channel>.accounts.default`，但內建頻道可以改為保留現有相符的已提升帳戶。Matrix 是目前的範例：如果已存在一個具名帳戶，或 `defaultAccount` 指向現有具名帳戶，提升會保留該帳戶，而不是建立新的 `accounts.default`。

路由行為會保持一致：

- 現有的僅頻道繫結（沒有 `accountId`）會繼續匹配預設帳戶。
- `channels add` 不會在非互動模式中自動建立或重寫繫結。
- 互動式設定可以選擇性新增帳戶範圍的繫結。

如果你的設定已經處於混合狀態（存在具名帳戶，且仍設定了頂層單帳戶值），請執行 `openclaw doctor --fix`，將帳戶範圍的值移到為該頻道選取的已提升帳戶。大多數頻道會提升到 `accounts.default`；Matrix 則可以改為保留現有具名/預設目標。

## 登入與登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--verbose`。
- 當只設定了一個受支援的登入目標時，`channels login` 和 `logout` 可以推斷頻道。
- `channels logout` 在可連線時會優先使用即時 Gateway 路徑，因此登出會先停止任何作用中的監聽器，再清除頻道驗證狀態。如果無法連線至本機 Gateway，則會退回本機驗證清理。
- 請在 Gateway 主機上的終端機執行 `channels login`。代理程式 `exec` 會阻擋這個互動式登入流程；可用時，應從聊天中使用頻道原生的代理程式登入工具，例如 `whatsapp_login`。

## 疑難排解

- 執行 `openclaw status --deep` 以進行廣泛探測。
- 使用 `openclaw doctor` 取得引導式修復。
- `openclaw channels list` 不再列印模型提供者使用量/配額快照。若要查看這些資訊，請使用 `openclaw status`（概覽）或 `openclaw models list`（依提供者）。
- 當無法連線至 Gateway 時，`openclaw channels status` 會退回只根據設定的摘要。如果支援的頻道憑證是透過 SecretRef 設定，但在目前命令路徑中無法取得，系統會將該帳戶回報為已設定並附上降級備註，而不是顯示為未設定。

## 功能探測

擷取提供者功能提示（可用時包含意圖/範圍）以及靜態功能支援：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

備註：

- `--channel` 是選用的；省略它可列出每個頻道（包括 extensions）。
- `--account` 只在搭配 `--channel` 時有效。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且只適用於 Discord。對於 Discord 語音頻道，權限檢查會標示缺少的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探測是提供者特定的：Discord 意圖 + 選用頻道權限；Slack 機器人 + 使用者範圍；Telegram 機器人旗標 + Webhook；Signal 常駐程式版本；Microsoft Teams 應用程式權杖 + Graph 角色/範圍（在已知處加註）。沒有探測的頻道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用提供者目錄將頻道/使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

備註：

- 使用 `--kind user|group|auto` 強制指定目標類型。
- 當多個項目共用相同名稱時，解析會優先選擇作用中的匹配項。
- `channels resolve` 是唯讀的。如果選取的帳戶是透過 SecretRef 設定，但該憑證在目前命令路徑中無法取得，命令會回傳附有備註的降級未解析結果，而不是中止整個執行。
- `channels resolve` 不會安裝頻道 Plugin。解析可安裝目錄頻道的名稱前，請先使用 `channels add --channel <name>`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [頻道概覽](/zh-TW/channels)
