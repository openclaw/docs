---
read_when:
    - 您需要遠端持續追蹤閘道日誌（無需 SSH）
    - 您希望為工具產生 JSON 日誌行
summary: '`openclaw logs` 的命令列介面參考（透過 RPC 追蹤閘道日誌）'
title: 日誌
x-i18n:
    generated_at: "2026-07-11T21:11:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

透過 RPC 追蹤閘道檔案日誌。支援遠端模式。

## 選項

- `--limit <n>`：要傳回的日誌行數上限（預設為 `200`）
- `--max-bytes <n>`：從日誌檔案讀取的位元組數上限（預設為 `250000`）
- `--follow`：持續追蹤日誌串流
- `--interval <ms>`：追蹤期間的輪詢間隔（預設為 `1000`）
- `--json`：輸出以行分隔的 JSON 事件
- `--plain`：不含樣式格式的純文字輸出
- `--no-color`：停用 ANSI 色彩
- `--local-time`：以本機時區顯示時間戳記（預設）
- `--utc`：以 UTC 顯示時間戳記

## 共用閘道 RPC 選項

- `--url <url>`：閘道 WebSocket URL
- `--token <token>`：閘道權杖
- `--timeout <ms>`：逾時時間（毫秒，預設為 `30000`）
- `--expect-final`：當閘道呼叫由代理程式支援時，等待最終回應

傳入 `--url` 會略過自動套用的設定憑證；如果目標閘道需要驗證，請明確加入 `--token`。

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

- 如果隱含的 local loopback 閘道要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動改用已設定的閘道檔案日誌。明確指定的 `--url` 目標絕不會使用此後援機制。
- 隱含的本機閘道 RPC 失敗後，`--follow` 不會改用該已設定的檔案，因為並存的過期檔案可能會誤導即時追蹤。在 Linux 上，如果可用，會改為依 PID 使用作用中的使用者 systemd 閘道日誌（並顯示所選來源）；否則會持續重試即時閘道。
- 使用 `--follow` 期間，暫時性斷線（WebSocket 關閉、逾時、連線中斷）會觸發採用指數退避的自動重新連線：最多重試 8 次，每次嘗試之間最長等待 30 秒。每次重試都會將警告輸出至 stderr，而輪詢成功後會輸出一次 `[logs] gateway reconnected` 通知。在 `--json` 模式中，兩者都會以 `{"type":"notice"}` 記錄輸出至 stderr。不可復原的錯誤（驗證失敗、設定錯誤）仍會立即結束。
- 在 `--follow --json` 模式中，日誌來源轉換會以 `{"type":"meta"}` 記錄輸出。請依各個 `sourceKind` 追蹤游標：串流可以從閘道檔案輸出（`sourceKind: "file"`）切換至本機日誌後援（`sourceKind: "journal"`、`localFallback: true`，並包含 `service.pid`/`service.unit`），在復原後再切回閘道檔案輸出。請勿假設整個工作階段只會使用單一穩定來源或游標；復原過程重新播放閘道檔案游標時，也應能容許重複的日誌行。

## 相關內容

- [日誌記錄概覽](/zh-TW/logging)
- [閘道命令列介面](/zh-TW/cli/gateway)
- [命令列介面參考](/zh-TW/cli)
- [閘道日誌記錄](/zh-TW/gateway/logging)
