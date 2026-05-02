---
read_when:
    - 你想新增/移除頻道帳號（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（Plugin）/Signal/iMessage/Matrix）
    - 你想檢查通道狀態，或即時追蹤通道日誌
summary: CLI 參考文件，適用於 `openclaw channels`（帳戶、狀態、登入/登出、日誌）
title: 頻道
x-i18n:
    generated_at: "2026-05-02T20:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理 Gateway 上的聊天通道帳戶及其執行階段狀態。

相關文件：

- 通道指南：[通道](/zh-TW/channels)
- Gateway 設定：[設定](/zh-TW/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 狀態 / 功能 / 解析 / 記錄

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`（僅可與 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` 是即時路徑：在可連線的 gateway 上，它會針對每個帳戶執行
`probeAccount` 以及選用的 `auditAccount` 檢查，因此輸出可以包含傳輸
狀態，以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探測結果。
如果 gateway 無法連線，`channels status` 會退回使用僅根據設定的摘要，
而不是即時探測輸出。

不要使用 `openclaw sessions`、Gateway `sessions.list` 或 agent
`sessions_list` 工具作為通道 socket 健康狀態訊號。這些介面回報的是
已儲存的對話資料列，而不是 provider 執行階段狀態。在 Discord provider
重新啟動後，已連線但安靜的帳戶可能是健康的，但在下一個傳入或傳出對話事件前，
不會出現 Discord session 資料列。

## 新增 / 移除帳戶

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 會顯示各通道的旗標（token、私鑰、app token、signal-cli 路徑等）。
</Tip>

`channels remove` 只會操作已安裝/已設定的通道 Plugin。對於可安裝目錄通道，請先使用 `channels add`。
對於由執行階段支援的通道 Plugin，`channels remove` 也會要求正在執行的 Gateway 在更新設定前停止所選帳戶，因此停用或刪除帳戶不會讓舊 listener 持續作用到重新啟動為止。

常見的非互動式新增介面包括：

- bot-token 通道：`--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage 傳輸欄位：`--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat 欄位：`--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix 欄位：`--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr 欄位：`--private-key`, `--relay-urls`
- Tlon 欄位：`--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` 用於支援預設帳戶環境變數式驗證的地方

如果通道 Plugin 需要在由旗標驅動的新增命令期間安裝，OpenClaw 會使用該通道的預設安裝來源，而不會開啟互動式 Plugin 安裝提示。

當你執行不帶旗標的 `openclaw channels add` 時，互動式精靈可以提示：

- 每個所選通道的帳戶 ID
- 這些帳戶的選用顯示名稱
- `Bind configured channel accounts to agents now?`

如果你確認現在綁定，精靈會詢問每個已設定的通道帳戶應由哪個 agent 擁有，並寫入帳戶範圍的路由綁定。

你也可以稍後使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱 [agents](/zh-TW/cli/agents)）。

當你將非預設帳戶新增至仍在使用單帳戶頂層設定的通道時，OpenClaw 會先將帳戶範圍的頂層值提升到通道的帳戶對應中，再寫入新帳戶。大多數通道會將這些值落在 `channels.<channel>.accounts.default`，但 bundled channels 可以改為保留現有的相符已提升帳戶。Matrix 是目前的範例：如果已有一個命名帳戶，或 `defaultAccount` 指向現有的命名帳戶，提升會保留該帳戶，而不是建立新的 `accounts.default`。

路由行為會保持一致：

- 現有的僅通道綁定（沒有 `accountId`）會繼續符合預設帳戶。
- `channels add` 不會在非互動模式中自動建立或重寫綁定。
- 互動式設定可以選擇性新增帳戶範圍的綁定。

如果你的設定已處於混合狀態（存在命名帳戶且仍設定了頂層單帳戶值），請執行 `openclaw doctor --fix`，將帳戶範圍的值移入該通道所選的已提升帳戶。大多數通道會提升至 `accounts.default`；Matrix 可以改為保留現有的命名/預設目標。

## 登入和登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--verbose`。
- 當只設定了一個受支援的登入目標時，`channels login` 和 `logout` 可以推斷通道。
- `channels logout` 在可連線時會優先使用即時 Gateway 路徑，因此登出會先停止任何作用中的 listener，再清除通道驗證狀態。如果本機 Gateway 無法連線，則退回使用本機驗證清理。
- 從 gateway 主機上的終端機執行 `channels login`。Agent `exec` 會阻擋此互動式登入流程；可用時，應從聊天中使用通道原生 agent 登入工具，例如 `whatsapp_login`。

## 疑難排解

- 執行 `openclaw status --deep` 進行廣泛探測。
- 使用 `openclaw doctor` 取得引導式修復。
- `openclaw channels list` 印出 `Claude: HTTP 403 ... user:profile` → 使用情況快照需要 `user:profile` scope。使用 `--no-usage`，或提供 claude.ai session key（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或透過 Claude CLI 重新驗證。
- 當 gateway 無法連線時，`openclaw channels status` 會退回使用僅根據設定的摘要。如果受支援的通道憑證是透過 SecretRef 設定，但在目前命令路徑中不可用，它會將該帳戶回報為已設定並附上降級備註，而不是顯示為未設定。

## 功能探測

擷取 provider 功能提示（可用時包含 intents/scopes）以及靜態功能支援：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意事項：

- `--channel` 是選用的；省略它即可列出每個通道（包含 extensions）。
- `--account` 只有與 `--channel` 一起使用時才有效。
- `--target` 接受 `channel:<id>` 或原始數字通道 ID，且只適用於 Discord。
- 探測是 provider 特定的：Discord intents + 選用的通道權限；Slack bot + user scopes；Telegram bot flags + webhook；Signal daemon version；Microsoft Teams app token + Graph roles/scopes（已知處會加註）。沒有探測的通道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用 provider directory 將通道/使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意事項：

- 使用 `--kind user|group|auto` 強制目標類型。
- 當多個項目共用相同名稱時，解析會偏好作用中的相符項目。
- `channels resolve` 是唯讀的。如果所選帳戶是透過 SecretRef 設定，但該憑證在目前命令路徑中不可用，命令會傳回帶有備註的降級未解析結果，而不是中止整個執行。
- `channels resolve` 不會安裝通道 Plugin。對於可安裝目錄通道，請先使用 `channels add --channel <name>`，再解析名稱。

## 相關

- [CLI 參考](/zh-TW/cli)
- [通道總覽](/zh-TW/channels)
