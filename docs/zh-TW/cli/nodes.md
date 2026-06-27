---
read_when:
    - 你正在管理成對的節點（攝影機、螢幕、畫布）
    - 你需要核准請求或叫用節點命令
summary: '`openclaw nodes` 的命令列介面參考（status、pairing、invoke、camera/canvas/screen）'
title: 節點
x-i18n:
    generated_at: "2026-06-27T19:06:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

管理已配對的節點（裝置），並呼叫節點能力。

相關：

- 節點概觀：[節點](/zh-TW/nodes)
- 相機：[相機節點](/zh-TW/nodes/camera)
- 影像：[影像節點](/zh-TW/nodes/images)

常用選項：

- `--url`, `--token`, `--timeout`, `--json`

## 常用命令

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 會印出待處理/已配對表格。已配對列包含最近一次連線距今時間（最近連線）。
使用 `--connected` 僅顯示目前已連線的節點。使用 `--last-connected <duration>`
篩選在一段時間內曾連線的節點（例如 `24h`、`7d`）。
使用 `nodes remove --node <id|name|ip>` 移除節點配對。對於
由裝置支援的節點，這會撤銷該裝置在 `devices/paired.json` 中的 `node` 角色，
並中斷其節點角色工作階段（混合角色裝置會保留其列，且只失去 `node` 角色；
僅節點裝置會被刪除）；它也會清除任何相符的舊版閘道擁有節點配對記錄。
`operator.pairing` 可以移除非操作員節點列；裝置權杖呼叫者若要撤銷
混合角色裝置上自己的節點角色，還需要 `operator.admin`。

核准注意事項：

- `openclaw nodes pending` 只需要配對範圍。
- `gateway.nodes.pairing.autoApproveCidrs` 只能針對明確信任、首次 `role: node`
  裝置配對略過待處理步驟。它預設為關閉，且不會核准升級。
- `openclaw nodes approve <requestId>` 會從待處理請求繼承額外範圍需求：
  - 無命令請求：僅配對
  - 非執行節點命令：配對 + 寫入
  - `system.run` / `system.run.prepare` / `system.which`：配對 + 管理員

## 呼叫

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

呼叫旗標：

- `--params <json>`：JSON 物件字串（預設 `{}`）。
- `--invoke-timeout <ms>`：節點呼叫逾時（預設 `15000`）。
- `--idempotency-key <key>`：選用的冪等鍵。
- `system.run` 和 `system.run.prepare` 在此處會被封鎖；若要執行 shell，請使用帶有 `host=node` 的 `exec` 工具。

若要在節點上執行 shell，請使用帶有 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
`nodes` 命令列介面現在專注於能力：透過 `nodes invoke` 進行直接 RPC，加上配對、相機、
螢幕、位置、Canvas 和通知。Canvas 命令由內建的實驗性 Canvas 外掛實作；核心保留相容性掛鉤，因此它們仍位於 `openclaw nodes canvas` 底下。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)
