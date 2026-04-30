---
read_when:
    - 你正在管理配對的節點（攝影機、螢幕、畫布）
    - 你需要核准請求或叫用 Node 命令
summary: '`openclaw nodes` 的 CLI 參考（狀態、配對、叫用、相機/畫布/螢幕）'
title: Node
x-i18n:
    generated_at: "2026-04-30T02:55:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

管理已配對節點（裝置）並呼叫節點功能。

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

`nodes list` 會列印待處理/已配對表格。已配對列包含最近一次連線距今時間（上次連線）。
使用 `--connected` 只顯示目前已連線的節點。使用 `--last-connected <duration>` 可
篩選在一段時間內曾連線的節點（例如 `24h`、`7d`）。
使用 `nodes remove --node <id|name|ip>` 可刪除過時且由 Gateway 擁有的節點配對記錄。

核准注意事項：

- `openclaw nodes pending` 只需要配對權限範圍。
- `gateway.nodes.pairing.autoApproveCidrs` 只能針對明確信任、首次 `role: node` 裝置配對
  跳過待處理步驟。它預設為關閉，且不會核准升級。
- `openclaw nodes approve <requestId>` 會從待處理請求繼承額外的權限範圍要求：
  - 無命令請求：僅配對
  - 非 exec 節點命令：配對 + 寫入
  - `system.run` / `system.run.prepare` / `system.which`：配對 + 管理員

## 呼叫

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

呼叫旗標：

- `--params <json>`：JSON 物件字串（預設 `{}`）。
- `--invoke-timeout <ms>`：節點呼叫逾時（預設 `15000`）。
- `--idempotency-key <key>`：選用的等冪鍵。
- `system.run` 和 `system.run.prepare` 在此處會被封鎖；請使用帶有 `host=node` 的 `exec` 工具進行 shell 執行。

若要在節點上執行 shell，請使用帶有 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
`nodes` CLI 現在專注於功能：透過 `nodes invoke` 進行直接 RPC，以及配對、相機、
螢幕、位置、canvas 和通知。

## 相關

- [CLI 參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)
