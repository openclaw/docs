---
read_when:
    - 你需要遠端追蹤閘道日誌（不使用 SSH）
    - 你需要供工具使用的 JSON 日誌行
summary: '`openclaw logs` 的命令列介面參考（透過 RPC 追蹤閘道日誌）'
title: 日誌
x-i18n:
    generated_at: "2026-07-05T11:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

透過 RPC 追蹤閘道檔案日誌。可在遠端模式運作。

## 選項

- `--limit <n>`：要傳回的最大日誌行數（預設 `200`）
- `--max-bytes <n>`：要從日誌檔讀取的最大位元組數（預設 `250000`）
- `--follow`：跟隨日誌串流
- `--interval <ms>`：跟隨時的輪詢間隔（預設 `1000`）
- `--json`：輸出以行分隔的 JSON 事件
- `--plain`：不含樣式格式的純文字輸出
- `--no-color`：停用 ANSI 色彩
- `--local-time`：以你的本機時區呈現時間戳記（預設）
- `--utc`：以 UTC 呈現時間戳記

## 共用閘道 RPC 選項

- `--url <url>`：閘道 WebSocket URL
- `--token <token>`：閘道權杖
- `--timeout <ms>`：逾時時間（毫秒，預設 `30000`）
- `--expect-final`：當閘道呼叫由代理支援時，等待最終回應

傳入 `--url` 會略過自動套用的設定認證；如果目標閘道需要驗證，請明確包含 `--token`。

## 範例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 後援與復原行為

- 如果隱含的 local loopback 閘道要求配對、在連線期間關閉，或在 `logs.tail` 回答前逾時，`openclaw logs` 會自動後援到已設定的閘道檔案日誌。明確指定的 `--url` 目標絕不使用此後援。
- `--follow` 不會在隱含本機閘道 RPC 失敗後後援到該已設定的檔案，因為過期的並列檔案可能誤導即時追蹤。在 Linux 上，它會改用可用時依 PID 選取的作用中使用者 systemd 閘道日誌（會列印選取的來源）；否則會持續重試即時閘道。
- 在 `--follow` 期間，暫時性斷線（WebSocket 關閉、逾時、連線中斷）會觸發自動重新連線並使用指數退避：最多 8 次重試，嘗試之間上限為 30 秒。每次重試都會向 stderr 列印警告，而輪詢成功後會列印一次 `[logs] gateway reconnected` 通知。在 `--json` 模式下，兩者都會以 stderr 上的 `{"type":"notice"}` 記錄輸出。不可復原的錯誤（驗證失敗、錯誤設定）仍會立即結束。
- 在 `--follow --json` 模式下，日誌來源轉換會以 `{"type":"meta"}` 記錄輸出。請依 `sourceKind` 追蹤游標：串流可以從閘道檔案輸出（`sourceKind: "file"`）移至本機日誌後援（`sourceKind: "journal"`、`localFallback: true`，並帶有 `service.pid`/`service.unit`），並在復原後回到閘道檔案輸出。不要假設整個工作階段只有一個穩定來源或游標，並容許復原重播閘道檔案游標時出現重疊行。

## 相關

- [日誌概覽](/zh-TW/logging)
- [閘道命令列介面](/zh-TW/cli/gateway)
- [命令列介面參考](/zh-TW/cli)
- [閘道日誌](/zh-TW/gateway/logging)
