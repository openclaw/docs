---
read_when:
    - 你想要新增/移除頻道帳號（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix）
    - 你想檢查通道狀態或追蹤通道日誌
summary: CLI 參考資料：`openclaw channels`（帳戶、狀態、登入/登出、日誌）
title: 通道
x-i18n:
    generated_at: "2026-04-30T02:51:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理 Gateway 上的聊天頻道帳號及其執行階段狀態。

相關文件：

- 頻道指南：[頻道](/zh-TW/channels)
- Gateway 設定：[設定](/zh-TW/gateway/configuration)

## 常用指令

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 狀態 / 能力 / 解析 / 日誌

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（僅能與 `--channel` 搭配使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是即時路徑：在可連線的 Gateway 上，它會針對每個帳號執行
`probeAccount` 與選用的 `auditAccount` 檢查，因此輸出可包含傳輸
狀態以及探測結果，例如 `works`、`probe failed`、`audit ok` 或 `audit failed`。
如果無法連線到 Gateway，`channels status` 會回退為僅根據設定產生的摘要，
而不是即時探測輸出。

## 新增 / 移除帳號

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 會顯示各頻道的旗標（權杖、私密金鑰、應用程式權杖、signal-cli 路徑等）。
</Tip>

常見的非互動式新增介面包括：

- bot-token 頻道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 傳輸欄位：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 欄位：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 欄位：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 欄位：`--private-key`、`--relay-urls`
- Tlon 欄位：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env` 用於支援此功能的預設帳號環境變數後援驗證

如果在以旗標驅動的新增指令期間需要安裝頻道 Plugin，OpenClaw 會使用該頻道的預設安裝來源，而不會開啟互動式 Plugin 安裝提示。

當你在沒有旗標的情況下執行 `openclaw channels add` 時，互動式精靈可提示：

- 每個所選頻道的帳號 ID
- 這些帳號的選用顯示名稱
- `Bind configured channel accounts to agents now?`

如果你確認立即綁定，精靈會詢問哪個 agent 應擁有每個已設定的頻道帳號，並寫入以帳號為範圍的路由繫結。

你也可以稍後使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱 [agents](/zh-TW/cli/agents)）。

當你將非預設帳號新增到仍使用單一帳號頂層設定的頻道時，OpenClaw 會先將以帳號為範圍的頂層值提升到該頻道的帳號對應表，再寫入新帳號。多數頻道會將這些值放入 `channels.<channel>.accounts.default`，但內建頻道可以改為保留現有相符的已提升帳號。Matrix 是目前的範例：如果已存在一個具名帳號，或 `defaultAccount` 指向現有具名帳號，提升程序會保留該帳號，而不是建立新的 `accounts.default`。

路由行為保持一致：

- 現有的僅頻道繫結（沒有 `accountId`）會繼續符合預設帳號。
- `channels add` 不會在非互動模式中自動建立或重寫繫結。
- 互動式設定可選擇性地新增以帳號為範圍的繫結。

如果你的設定已處於混合狀態（存在具名帳號且仍設定頂層單一帳號值），請執行 `openclaw doctor --fix`，將以帳號為範圍的值移到該頻道所選的已提升帳號。多數頻道會提升到 `accounts.default`；Matrix 則可改為保留現有具名/預設目標。

## 登入與登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--verbose`。
- 當只設定了一個支援登入的目標時，`channels login` 和 `logout` 可以推斷頻道。
- 從 Gateway 主機上的終端機執行 `channels login`。Agent `exec` 會阻擋此互動式登入流程；若有可用的頻道原生 agent 登入工具，例如 `whatsapp_login`，應從聊天中使用。

## 疑難排解

- 執行 `openclaw status --deep` 進行廣泛探測。
- 使用 `openclaw doctor` 取得引導式修復。
- `openclaw channels list` 印出 `Claude: HTTP 403 ... user:profile` → 用量快照需要 `user:profile` 範圍。請使用 `--no-usage`，或提供 claude.ai 工作階段金鑰（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或透過 Claude CLI 重新驗證。
- 當無法連線到 Gateway 時，`openclaw channels status` 會回退為僅根據設定產生的摘要。如果支援的頻道認證是透過 SecretRef 設定，但在目前指令路徑中不可用，它會將該帳號回報為已設定並附上降級備註，而不是顯示為未設定。

## 能力探測

擷取提供者能力提示（可用時包含 intents/scopes）以及靜態功能支援：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

備註：

- `--channel` 是選用的；省略它即可列出每個頻道（包括 extensions）。
- `--account` 僅在搭配 `--channel` 時有效。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且僅適用於 Discord。
- 探測會依提供者而異：Discord intents + 選用頻道權限；Slack bot + 使用者範圍；Telegram bot 旗標 + Webhook；Signal daemon 版本；Microsoft Teams 應用程式權杖 + Graph 角色/範圍（在已知處標註）。沒有探測的頻道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用提供者目錄將頻道/使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

備註：

- 使用 `--kind user|group|auto` 強制指定目標類型。
- 當多個項目共用相同名稱時，解析會優先選擇作用中的相符項目。
- `channels resolve` 是唯讀的。如果所選帳號是透過 SecretRef 設定，但該認證在目前指令路徑中不可用，指令會傳回附有備註的降級未解析結果，而不是中止整個執行。

## 相關

- [CLI 參考](/zh-TW/cli)
- [頻道概觀](/zh-TW/channels)
