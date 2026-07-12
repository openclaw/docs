---
read_when:
    - 你想要新增或移除頻道帳號（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp 等）
    - 你想要檢查頻道狀態或持續追蹤頻道日誌
summary: '`openclaw channels` 的命令列介面參考（帳號、狀態、功能、解析、日誌、登入/登出）'
title: 頻道
x-i18n:
    generated_at: "2026-07-11T21:12:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理聊天頻道帳號及其在閘道上的執行階段狀態。

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

`channels list` 僅顯示聊天頻道：預設列出已設定的帳號，並為每個帳號顯示 `installed`、`configured` 與 `enabled` 狀態標記（使用 `--json` 產生機器可讀輸出）。傳入 `--all` 後，也會顯示尚未設定帳號的隨附頻道，以及尚未安裝到磁碟的可安裝目錄頻道。提供者驗證與模型用量位於其他命令：使用 `openclaw models auth list` 查看提供者驗證設定檔；使用 `openclaw status` 或 `openclaw models list` 查看用量／配額。

## 狀態／功能／解析／日誌

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`（預設為 `10000`）、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（需要 `--channel`）、`--target <dest>`（需要 `--channel`）、`--timeout <ms>`（預設為 `10000`，上限為 `30000`）、`--json`
- `channels resolve <entries...>`：`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（預設為 `auto`）、`--json`
- `channels logs`：`--channel <name|all>`（預設為 `all`）、`--lines <n>`（預設為 `200`）、`--json`

`channels status --probe` 是即時路徑：在可連線的閘道上，它會逐一對帳號執行
`probeAccount`，並視需要執行 `auditAccount` 檢查，因此輸出可包含傳輸層
狀態，以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探測結果。
若無法連線至閘道，`channels status` 會改為顯示僅依據設定產生的摘要，
而不是即時探測輸出。

請勿使用 `openclaw sessions`、閘道的 `sessions.list` 或代理程式的
`sessions_list` 工具作為頻道通訊端健康狀態的判斷依據。這些介面回報的是
已儲存的對話資料列，而非提供者的執行階段狀態。Discord 提供者重新啟動後，
已連線但暫無活動的帳號可能仍然運作正常，但在下一個傳入或傳出對話事件發生前，
可能不會出現 Discord 工作階段資料列。

## 新增／移除帳號

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 會顯示各頻道專用的旗標（權杖、私密金鑰、應用程式權杖、signal-cli 路徑等）。
</Tip>

`channels remove` 僅能操作已安裝／已設定的頻道外掛。對於可安裝的目錄頻道，請先使用 `channels add`。未指定 `--delete` 時，它會詢問是否停用帳號並保留其設定；`--delete` 則會直接移除設定項目而不提示。
對於由執行階段支援的頻道外掛，`channels remove` 還會在更新設定前，要求執行中的閘道停止所選帳號，因此停用或刪除帳號後，舊的監聽器不會持續運作到重新啟動為止。

各頻道共用的非互動式新增旗標：`--account <id>`、`--name <name>`、`--token`、`--token-file`、`--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--http-url`、`--auth-dir`，以及 `--use-env`（使用環境變數提供驗證資料；僅適用於預設帳號，且須頻道支援）。頻道專用旗標包括：

| 頻道        | 旗標                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`                                   |
| iMessage    | `--cli-path`、`--db-path`、`--service`、`--region`                                                   |
| Matrix      | `--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit` |
| Nostr       | `--private-key`、`--relay-urls`                                                                      |
| Signal      | `--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`                          |
| Tlon        | `--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

若以旗標執行新增命令時需要安裝頻道外掛，OpenClaw 會使用該頻道的預設安裝來源，而不會開啟互動式外掛安裝提示。

不帶旗標執行 `openclaw channels add` 時，互動式精靈可能會提示：

- 每個所選頻道的帳號 ID
- 這些帳號的選填顯示名稱
- `Route these channel accounts to agents now?`

若確認立即繫結，精靈會詢問每個已設定頻道帳號應由哪個代理程式負責，並寫入帳號範圍的路由繫結。

之後也可使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由規則（請參閱[代理程式](/zh-TW/cli/agents)）。

當你將非預設帳號新增至仍使用單一帳號頂層設定的頻道時，OpenClaw 會先將這些頂層值提升至該頻道的帳號映射，再寫入新帳號。當頻道恰好有一個具名帳號，或 `defaultAccount` 指向某個具名帳號時，提升程序會沿用該帳號；否則，這些值會存入 `channels.<channel>.accounts.default`。

路由行為會保持一致：

- 現有僅限頻道的繫結（沒有 `accountId`）會繼續比對預設帳號。
- 在非互動模式下，`channels add` 不會自動建立或改寫繫結。
- 互動式設定可選擇新增帳號範圍的繫結。

若設定已處於混合狀態（已有具名帳號，但仍設定了頂層單一帳號值），請執行 `openclaw doctor --fix`，將帳號範圍的值移至為該頻道選定的提升帳號中。

## 登入與登出（互動式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支援 `--account <id>` 與 `--verbose`；`channels logout` 支援 `--account <id>`。
- 當只有一個已設定頻道支援該操作時，`channels login` 與 `logout` 可推斷頻道；若有多個，請傳入 `--channel`。
- 當可連線至即時閘道時，`channels logout` 會優先使用閘道路徑，讓登出作業在清除頻道驗證狀態前停止所有作用中的監聽器。若無法連線至本機閘道，則會改用本機驗證清理；若設定為 `gateway.mode: "remote"`，閘道錯誤反而會使命令失敗。
- 成功登入後，命令列介面會要求可連線的本機閘道啟動該帳號；在遠端模式下，它會將驗證資料儲存在本機，並註明遠端執行階段並未重新啟動。
- 請從閘道主機上的終端機執行 `channels login`。代理程式的 `exec` 會封鎖此互動式登入流程；若有提供頻道原生的代理程式登入工具（例如 `whatsapp_login`），則應在聊天中使用。

## 疑難排解

- 執行 `openclaw status --deep` 進行廣泛探測。
- 使用 `openclaw doctor` 取得引導式修正。
- 無法連線至閘道時，`openclaw channels status` 會改為顯示僅依據設定產生的摘要。若受支援頻道的憑證透過 SecretRef 設定，但目前命令路徑無法取得該憑證，則會將該帳號回報為已設定並附上降級註記，而不會顯示為未設定。

## 功能探測

取得提供者功能提示（若有則包括意圖／範圍）以及靜態功能支援資訊：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意事項：

- `--channel` 為選填；省略時會列出所有頻道（包括由外掛提供的頻道）。
- `--account` 僅能與 `--channel` 一起使用。
- `--target` 接受 `channel:<id>` 或原始數字頻道 ID，且僅適用於 Discord。對於 Discord 語音頻道，權限檢查會標示缺少的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探測依提供者而異：Discord 機器人身分與意圖，以及選填的頻道權限；Slack 機器人與使用者範圍；Telegram 機器人旗標與網路鉤子；Signal 常駐程式版本；Microsoft Teams 應用程式權杖與 Graph 角色／範圍（已知時會加上註解）。不支援探測的頻道會回報 `Probe: unavailable`。

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
- `channels resolve` 是唯讀操作。若所選帳號透過 SecretRef 設定，但目前命令路徑無法取得該憑證，命令會傳回附有註記的降級未解析結果，而不會中止整個執行程序。
- `channels resolve` 不會安裝頻道外掛。若要解析可安裝目錄頻道的名稱，請先使用 `channels add --channel <name>`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [頻道概覽](/zh-TW/channels)
