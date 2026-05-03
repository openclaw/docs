---
read_when:
    - 你需要遠端追蹤 Gateway 日誌（不使用 SSH）
    - 您想要供工具使用的 JSON 日誌行
summary: '`openclaw logs` 的 CLI 參考（透過 RPC 追蹤 Gateway 日誌）'
title: 日誌
x-i18n:
    generated_at: "2026-05-03T21:28:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

透過 RPC 追蹤 Gateway 檔案日誌（可在遠端模式運作）。

相關：

- 日誌記錄概觀：[日誌記錄](/zh-TW/logging)
- Gateway CLI：[Gateway](/zh-TW/cli/gateway)

## 選項

- `--limit <n>`：要傳回的日誌行數上限（預設 `200`）
- `--max-bytes <n>`：要從日誌檔讀取的位元組上限（預設 `250000`）
- `--follow`：跟隨日誌串流
- `--interval <ms>`：跟隨時的輪詢間隔（預設 `1000`）
- `--json`：輸出以行分隔的 JSON 事件
- `--plain`：不含樣式格式的純文字輸出
- `--no-color`：停用 ANSI 色彩
- `--local-time`：以你的本機時區呈現時間戳記

## 共用 Gateway RPC 選項

`openclaw logs` 也接受標準 Gateway 用戶端旗標：

- `--url <url>`：Gateway WebSocket URL
- `--token <token>`：Gateway token
- `--timeout <ms>`：逾時毫秒數（預設 `30000`）
- `--expect-final`：當 Gateway 呼叫由代理程式支援時，等待最終回應

傳入 `--url` 時，CLI 不會自動套用設定或環境認證。如果目標 Gateway 需要驗證，請明確包含 `--token`。

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
- 如果隱含的 local loopback Gateway 要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回使用已設定的 Gateway 檔案日誌。明確的 `--url` 目標不會使用此備援。
- 使用 `--follow` 時，暫時性的 Gateway 斷線（WebSocket 關閉、逾時、連線中斷）會觸發使用指數退避的自動重新連線（最多 8 次重試，嘗試間隔上限為 30 秒）。每次重試都會將警告列印到 stderr，且一旦輪詢成功，就會列印 `[logs] gateway reconnected` 通知。在 `--json` 模式中，重試警告與重新連線轉換都會以 `{"type":"notice"}` 記錄輸出到 stderr。不可復原的錯誤（驗證失敗、錯誤設定）仍會立即結束。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway 日誌記錄](/zh-TW/gateway/logging)
