---
read_when:
    - 你正在管理配對節點（攝影機、螢幕、畫布）
    - 你需要核准請求或叫用節點命令
summary: '`openclaw nodes` 的命令列介面參考（狀態、配對、叫用、相機/畫布/螢幕/位置/通知）'
title: 節點
x-i18n:
    generated_at: "2026-07-05T11:09:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2542d7cba45fd4db7480baee48370aea5980dc03d683ea28b65c11fef1007c03
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

管理已配對的節點（裝置）並呼叫節點能力。

相關：[節點概觀](/zh-TW/nodes) - [相機節點](/zh-TW/nodes/camera) - [影像節點](/zh-TW/nodes/images)

每個子命令的常用選項：`--url <url>`、`--token <token>`、`--timeout <ms>`（預設 `10000`）、`--json`。

## 狀態

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` 和 `list` 都接受 `--connected`（僅已連線的節點）和 `--last-connected <duration>`（例如 `24h`、`7d`；僅包含在該期間內曾連線的節點）。`list` 會以不同表格顯示待處理與已配對節點，已配對列會包含最近連線距今時間（上次連線）；`status` 會顯示一個合併表格，包含每個節點的能力與版本詳細資料。`describe` 會列印單一節點的能力、權限，以及有效/待處理的呼叫命令。

## 配對

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

這些命令會驅動由閘道擁有的 `node.pair.*` 儲存區，並與裝置配對（`openclaw devices approve`）分開；後者會控管節點的 WS `connect` 握手。請參閱[節點](/zh-TW/nodes)了解兩者的關係。

- `remove` 會撤銷節點的已配對角色項目。對於由裝置支援的節點，這會撤銷裝置配對儲存區中的 `node` 角色，並中斷其節點角色工作階段：混合角色裝置會保留其列，且只失去 `node` 角色；僅節點的裝置列會被刪除。它也會清除任何相符的舊版閘道擁有節點配對記錄。
- `pending` 只需要 `operator.pairing` 範圍。
- `gateway.nodes.pairing.autoApproveCidrs` 可以針對明確信任、首次的 `role: node` 裝置配對跳過待處理步驟。預設為關閉；不會核准角色升級。
- `approve` 範圍需求會依待處理請求宣告的命令而定：
  - 無命令請求：`operator.pairing`
  - 非執行節點命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`
- `remove` 範圍：`operator.pairing` 可移除非 operator 節點列；在混合角色裝置上，使用裝置權杖的呼叫者若要撤銷自己的節點角色，還需要 `operator.admin`。

## 呼叫

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"name":"uname"}'
```

旗標：

- `--command <command>`（必要）：例如 `canvas.eval`。
- `--params <json>`：JSON 物件字串（預設 `{}`）。
- `--invoke-timeout <ms>`：節點呼叫逾時（預設 `15000`）。
- `--idempotency-key <key>`：選用的冪等性金鑰。

`system.run` 和 `system.run.prepare` 在此會被封鎖；請改用 `host=node` 的 `exec` 工具執行 shell。`system.which` 可透過 `invoke` 使用。

## 通知、推送、位置、螢幕

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` 會在節點上傳送本機通知（僅限 macOS）。需要 `--title` 或 `--body`。選項：`--sound <name>`、`--priority <passive|active|timeSensitive>`、`--delivery <system|overlay|auto>`（預設 `system`）、`--invoke-timeout <ms>`（預設 `15000`）。
- `push` 會將 APNs 測試推送傳送至 iOS 節點。選項：`--title <text>`（預設 `OpenClaw`）、`--body <text>`、`--environment <sandbox|production>`，用於覆寫偵測到的 APNs 環境。
- `location get` 會取得節點目前的位置。選項：`--max-age <ms>`（重用快取定位）、`--accuracy <coarse|balanced|precise>`、`--location-timeout <ms>`（預設 `10000`）、`--invoke-timeout <ms>`（預設 `20000`）。
- `screen record` 會擷取一段短片並列印儲存路徑（或搭配 `--json` 寫入 JSON）。選項：`--screen <index>`（預設 `0`）、`--duration <ms|10s>`（預設 `10000`）、`--fps <fps>`（預設 `10`）、`--no-audio`、`--out <path>`、`--invoke-timeout <ms>`（預設 `120000`）。

相機與 Canvas 命令有各自的文件：[相機節點](/zh-TW/nodes/camera)、[Canvas](/zh-TW/platforms/mac/canvas)。Canvas 由隨附的實驗性 Canvas 外掛實作；核心會保留 `openclaw nodes canvas` 作為相容性掛載點。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)
