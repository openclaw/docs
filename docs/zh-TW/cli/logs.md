---
read_when:
    - 你需要遠端追蹤閘道記錄（不使用 SSH）
    - 你需要供工具使用的 JSON 記錄行
summary: '`openclaw logs` 的命令列介面參考（透過 RPC 追蹤閘道日誌）'
title: 記錄
x-i18n:
    generated_at: "2026-07-01T15:19:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

透過 RPC 追蹤閘道檔案日誌（可在遠端模式運作）。

相關：

- 記錄概覽：[記錄](/zh-TW/logging)
- 閘道命令列介面：[gateway](/zh-TW/cli/gateway)

## 選項

- `--limit <n>`：要回傳的日誌行數上限（預設 `200`）
- `--max-bytes <n>`：要從日誌檔讀取的位元組上限（預設 `250000`）
- `--follow`：持續追蹤日誌串流
- `--interval <ms>`：追蹤時的輪詢間隔（預設 `1000`）
- `--json`：輸出以行分隔的 JSON 事件
- `--plain`：不含樣式格式的純文字輸出
- `--no-color`：停用 ANSI 色彩
- `--local-time`：以你的本機時區呈現時間戳記（預設）
- `--utc`：以 UTC 呈現時間戳記

## 共用閘道 RPC 選項

`openclaw logs` 也接受標準閘道用戶端旗標：

- `--url <url>`：閘道 WebSocket URL
- `--token <token>`：閘道權杖
- `--timeout <ms>`：逾時時間，單位為 ms（預設 `30000`）
- `--expect-final`：當閘道呼叫由代理支援時，等待最終回應

當你傳入 `--url` 時，命令列介面不會自動套用設定或環境認證。如果目標閘道需要驗證，請明確包含 `--token`。

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 注意事項

- 時間戳記預設會以你的本機時區呈現。使用 `--utc` 可輸出 UTC。
- 如果隱含的本機 local loopback 閘道要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回使用已設定的閘道檔案日誌。明確的 `--url` 目標不會使用此退回機制。
- `openclaw logs --follow` 在隱含的本機閘道 RPC 失敗後，不會追蹤已設定檔案的退回來源。在 Linux 上，若可用，它會依 PID 使用作用中 user-systemd 閘道 journal，並印出所選的日誌來源；否則它會持續重試即時閘道，而不是追蹤可能已過期的並列檔案。
- 使用 `--follow` 時，暫時性的閘道中斷連線（WebSocket 關閉、逾時、連線中斷）會觸發以指數退避進行的自動重新連線（最多 8 次重試，嘗試間隔上限為 30 秒）。每次重試都會將警告印到 stderr，而一旦輪詢成功，會印出 `[logs] gateway reconnected` 通知。在 `--json` 模式中，重試警告與重新連線轉換都會以 `{"type":"notice"}` 記錄輸出到 stderr。不可復原的錯誤（驗證失敗、不正確的設定）仍會立即結束。
- 在 `--follow --json` 模式中，日誌來源轉換會以 `{"type":"meta"}` 記錄輸出。消費者應依每個 `sourceKind` 追蹤游標：串流可以從閘道檔案輸出（`sourceKind: "file"`）移動到本機 journal 退回來源（`sourceKind: "journal"`、`localFallback: true`，並帶有 `service.pid`/`service.unit`），並在復原後回到閘道檔案輸出。不要假設整個追蹤工作階段只有一個穩定來源或游標，且在復原重播閘道檔案游標時，應容許重疊的行。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [閘道記錄](/zh-TW/gateway/logging)
