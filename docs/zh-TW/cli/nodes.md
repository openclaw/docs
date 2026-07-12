---
read_when:
    - 你正在管理已配對的節點（相機、螢幕、畫布）
    - 你需要核准請求或呼叫節點命令
summary: '`openclaw nodes` 的命令列介面參考（狀態、配對、叫用、相機／畫布／螢幕／位置／通知）'
title: 節點
x-i18n:
    generated_at: "2026-07-12T14:26:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

管理已配對的節點（裝置），並叫用節點功能。

相關內容：[節點概覽](/zh-TW/nodes) - [電腦目前活動狀態](/zh-TW/nodes/presence) - [相機節點](/zh-TW/nodes/camera) - [影像節點](/zh-TW/nodes/images)

每個子命令的通用選項：`--url <url>`、`--token <token>`、`--timeout <ms>`（預設為 `10000`）、`--json`。

## 狀態

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` 和 `list` 都接受 `--connected`（僅顯示已連線的節點）與 `--last-connected <duration>`（例如 `24h`、`7d`；僅顯示在指定期間內曾連線的節點）。`list` 會在不同表格中顯示待處理與已配對的節點，已配對的資料列包含最近一次連線距今時間（Last Connect）；`status` 則會顯示一個合併表格，其中包含各節點的功能、版本及最近輸入詳細資訊。已連線的 macOS 節點僅會在獲得「輔助使用」權限時回報最近輸入，最新的資料列會標示為 `active`；請參閱[電腦目前活動狀態](/zh-TW/nodes/presence)。`describe` 會輸出單一節點的功能、權限、活動狀態，以及有效與待核准的叫用命令。

## 配對

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

這些命令會操作由閘道管理的 `node.pair.*` 儲存區；它與裝置配對（`openclaw devices approve`）不同，後者會管控節點的 WS `connect` 交握。請參閱[節點](/zh-TW/nodes)，了解兩者之間的關係。

- `remove` 會撤銷節點的已配對角色項目。對於以裝置為基礎的節點，這會撤銷裝置配對儲存區中的 `node` 角色，並中斷其節點角色工作階段：多角色裝置會保留其資料列，且只失去 `node` 角色；僅具有節點角色的裝置資料列則會遭到刪除。它也會清除所有相符的舊版閘道管理節點配對記錄。
- `pending` 僅需要 `operator.pairing` 範圍。
- `gateway.nodes.pairing.autoApproveCidrs` 可讓明確信任且首次進行的 `role: node` 裝置配對略過待處理步驟。預設為關閉；不會核准角色升級。
- `gateway.nodes.pairing.sshVerify`（預設為開啟）會在閘道能透過 SSH 連線至節點主機，並驗證裝置金鑰時，自動核准首次進行的 `role: node` 裝置配對；第一個功能介面會在同一步驟中獲得核准。請參閱[節點配對](/zh-TW/gateway/pairing#ssh-verified-device-auto-approval-default)。
- `approve` 的範圍要求取決於待處理請求所宣告的命令：
  - 不含命令的請求：`operator.pairing`
  - 非執行類節點命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`
- `remove` 範圍：`operator.pairing` 可移除非操作員節點資料列；使用裝置權杖的呼叫端若要撤銷其在多角色裝置上的節點角色，還需要 `operator.admin`。

## 叫用

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

旗標：

- `--command <command>`（必要）：例如 `canvas.eval`。
- `--params <json>`：JSON 物件字串（預設為 `{}`）。
- `--invoke-timeout <ms>`：節點叫用逾時時間（預設為 `15000`）。
- `--idempotency-key <key>`：選用的冪等性金鑰。

此處會封鎖 `system.run` 和 `system.run.prepare`；若要執行 shell，請改用 `host=node` 的 `exec` 工具。`system.which` 可透過 `invoke` 使用。

## 通知、推播、位置、螢幕

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` 會在宣告 `system.notify` 的節點上傳送本機通知，包括 macOS、iOS、Android，以及直接連線的 watchOS 節點。直接傳送至 watchOS 時，OpenClaw 必須處於活動狀態。需要 `--title` 或 `--body`。選項：`--sound <name>`、`--priority <passive|active|timeSensitive>`、`--delivery <system|overlay|auto>`（預設為 `system`）、`--invoke-timeout <ms>`（預設為 `15000`）。
- `push` 會將 APNs 測試推播傳送至 iOS 節點。選項：`--title <text>`（預設為 `OpenClaw`）、`--body <text>`、`--environment <sandbox|production>`，用於覆寫偵測到的 APNs 環境。
- `location get` 會擷取節點的目前位置。選項：`--max-age <ms>`（重複使用快取的位置結果）、`--accuracy <coarse|balanced|precise>`、`--location-timeout <ms>`（預設為 `10000`）、`--invoke-timeout <ms>`（預設為 `20000`）。
- `screen record` 會擷取短片，並輸出儲存路徑（或使用 `--json` 寫入 JSON）。選項：`--screen <index>`（預設為 `0`）、`--duration <ms|10s>`（預設為 `10000`）、`--fps <fps>`（預設為 `10`）、`--no-audio`、`--out <path>`、`--invoke-timeout <ms>`（預設為 `120000`）。

相機與 Canvas 命令各有專屬文件：[相機節點](/zh-TW/nodes/camera)、[Canvas](/zh-TW/platforms/mac/canvas)。Canvas 由隨附的實驗性 Canvas 外掛實作；核心保留 `openclaw nodes canvas` 作為相容性掛載點。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)
