---
read_when:
    - 你想要新增/移除頻道帳號 (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - 你想檢查通道狀態或追蹤通道日誌
summary: '`openclaw channels` 的 CLI 參考（accounts、status、login/logout、logs）'
title: 通道
x-i18n:
    generated_at: "2026-05-02T02:45:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9cfde99d49d63397756b182a20ae3936a6b23f2455616dc86ceb3f16a205c06
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理 Gateway 上的聊天頻道帳號及其執行階段狀態。

相關文件：

- 頻道指南：[頻道](/zh-TW/channels)
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

## 狀態 / 功能 / 解析 / 日誌

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（僅能搭配 `--channel`）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是即時路徑：在可連線的 Gateway 上，它會對每個帳號執行
`probeAccount` 和選用的 `auditAccount` 檢查，因此輸出可能包含傳輸
狀態，以及例如 `works`、`probe failed`、`audit ok` 或 `audit failed` 的探測結果。
如果無法連線至 Gateway，`channels status` 會改用僅限設定的摘要，
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

`channels remove` 僅會作用於已安裝/已設定的頻道 Plugin。若要使用可安裝目錄頻道，請先使用 `channels add`。
對於由執行階段支援的頻道 Plugin，`channels remove` 也會要求正在執行的 Gateway 在更新設定前停止所選帳號，因此停用或刪除帳號不會讓舊的監聽器持續作用到重新啟動為止。

常見的非互動式新增介面包括：

- 機器人權杖頻道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 傳輸欄位：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 欄位：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 欄位：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 欄位：`--private-key`、`--relay-urls`
- Tlon 欄位：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env` 用於支援處的預設帳號環境變數支援驗證

如果在由旗標驅動的新增命令期間需要安裝頻道 Plugin，OpenClaw 會使用該頻道的預設安裝來源，而不會開啟互動式 Plugin 安裝提示。

當你執行沒有旗標的 `openclaw channels add` 時，互動式精靈可以提示：

- 每個所選頻道的帳號 ID
- 這些帳號的選用顯示名稱
- `Bind configured channel accounts to agents now?`

如果你確認立即繫結，精靈會詢問哪個代理應擁有每個已設定的頻道帳號，並寫入帳號範圍的路由繫結。

你也可以稍後使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱 [代理](/zh-TW/cli/agents)）。

當你將非預設帳號新增到仍在使用單一帳號頂層設定的頻道時，OpenClaw 會先將帳號範圍的頂層值提升到該頻道的帳號對應表，再寫入新帳號。大多數頻道會將這些值放在 `channels.<channel>.accounts.default`，但內建頻道可以改為保留現有相符的已提升帳號。Matrix 是目前的範例：如果已存在一個具名帳號，或 `defaultAccount` 指向現有具名帳號，提升會保留該帳號，而不是建立新的 `accounts.default`。

路由行為會保持一致：

- 現有的僅頻道繫結（沒有 `accountId`）會繼續符合預設帳號。
- `channels add` 不會在非互動模式中自動建立或重寫繫結。
- 互動式設定可以選擇性新增帳號範圍的繫結。

如果你的設定已處於混合狀態（存在具名帳號，且仍設定頂層單一帳號值），請執行 `openclaw doctor --fix`，將帳號範圍的值移到該頻道所選的已提升帳號。大多數頻道會提升到 `accounts.default`；Matrix 可以改為保留現有具名/預設目標。

## 登入與登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--verbose`。
- 當只設定一個支援的登入目標時，`channels login` 和 `logout` 可以推斷頻道。
- `channels logout` 在可連線時會優先使用即時 Gateway 路徑，因此登出會在清除頻道驗證狀態前停止任何作用中的監聽器。如果無法連線至本機 Gateway，它會改用本機驗證清理。
- 從 Gateway 主機上的終端機執行 `channels login`。代理 `exec` 會封鎖這個互動式登入流程；可用時，應從聊天中使用頻道原生代理登入工具，例如 `whatsapp_login`。

## 疑難排解

- 執行 `openclaw status --deep` 進行廣泛探測。
- 使用 `openclaw doctor` 取得引導式修正。
- `openclaw channels list` 印出 `Claude: HTTP 403 ... user:profile` → 用量快照需要 `user:profile` 範圍。請使用 `--no-usage`，或提供 claude.ai 工作階段金鑰（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或透過 Claude CLI 重新驗證。
- 當無法連線至 Gateway 時，`openclaw channels status` 會改用僅限設定的摘要。如果支援的頻道認證是透過 SecretRef 設定，但在目前命令路徑中無法使用，它會回報該帳號已設定並附上降級備註，而不是顯示為未設定。

## 功能探測

擷取提供者功能提示（可用時包含意圖/範圍）以及靜態功能支援：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意事項：

- `--channel` 是選用的；省略它即可列出每個頻道（包含擴充）。
- `--account` 只有搭配 `--channel` 時才有效。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且僅適用於 Discord。
- 探測依提供者而異：Discord 意圖 + 選用頻道權限；Slack 機器人 + 使用者範圍；Telegram 機器人旗標 + Webhook；Signal 常駐程式版本；Microsoft Teams 應用程式權杖 + Graph 角色/範圍（已知處會加註）。沒有探測的頻道會回報 `Probe: unavailable`。

## 將名稱解析為 ID

使用提供者目錄將頻道/使用者名稱解析為 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意事項：

- 使用 `--kind user|group|auto` 強制指定目標類型。
- 當多個項目共用相同名稱時，解析會優先採用作用中相符項目。
- `channels resolve` 是唯讀的。如果所選帳號是透過 SecretRef 設定，但該認證在目前命令路徑中無法使用，命令會傳回帶有備註的降級未解析結果，而不是中止整個執行。
- `channels resolve` 不會安裝頻道 Plugin。請先使用 `channels add --channel <name>`，再解析可安裝目錄頻道的名稱。

## 相關

- [CLI 參考](/zh-TW/cli)
- [頻道概覽](/zh-TW/channels)
