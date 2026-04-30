---
read_when:
    - 你需要遠端追蹤 Gateway 日誌（不使用 SSH）
    - 你需要供工具使用的 JSON 記錄行
summary: CLI 參考：`openclaw logs`（透過 RPC 追蹤 Gateway 日誌）
title: 日誌
x-i18n:
    generated_at: "2026-04-30T02:54:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

透過 RPC 即時追蹤 Gateway 檔案日誌（可在遠端模式使用）。

相關：

- 日誌記錄概觀：[日誌記錄](/zh-TW/logging)
- Gateway CLI：[gateway](/zh-TW/cli/gateway)

## 選項

- `--limit <n>`：要傳回的日誌行數上限（預設 `200`）
- `--max-bytes <n>`：要從日誌檔案讀取的位元組數上限（預設 `250000`）
- `--follow`：追蹤日誌串流
- `--interval <ms>`：追蹤時的輪詢間隔（預設 `1000`）
- `--json`：輸出以行分隔的 JSON 事件
- `--plain`：不含樣式格式的純文字輸出
- `--no-color`：停用 ANSI 色彩
- `--local-time`：以你的本機時區呈現時間戳記

## 共用 Gateway RPC 選項

`openclaw logs` 也接受標準的 Gateway 用戶端旗標：

- `--url <url>`：Gateway WebSocket URL
- `--token <token>`：Gateway token
- `--timeout <ms>`：逾時時間，以毫秒為單位（預設 `30000`）
- `--expect-final`：當 Gateway 呼叫由代理支援時，等待最終回應

當你傳入 `--url` 時，CLI 不會自動套用設定或環境憑證。如果目標 Gateway 需要驗證，請明確包含 `--token`。

## 範例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 注意事項

- 使用 `--local-time` 以你的本機時區呈現時間戳記。
- 如果隱含的 local loopback Gateway 要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回到已設定的 Gateway 檔案日誌。明確的 `--url` 目標不會使用這個退回機制。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway 日誌記錄](/zh-TW/gateway/logging)
