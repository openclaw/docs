---
read_when:
    - 你需要遠端即時追蹤閘道記錄（不使用 SSH）
    - 你想要供工具使用的 JSON 記錄行
summary: '`openclaw logs` 的命令列介面參考（透過 RPC 追蹤閘道日誌）'
title: 記錄
x-i18n:
    generated_at: "2026-06-27T19:05:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

透過 RPC 追蹤閘道檔案記錄（可在遠端模式中使用）。

相關：

- 記錄概觀：[記錄](/zh-TW/logging)
- 閘道命令列介面：[gateway](/zh-TW/cli/gateway)

## 選項

- `--limit <n>`：要傳回的記錄行數上限（預設 `200`）
- `--max-bytes <n>`：要從記錄檔讀取的位元組上限（預設 `250000`）
- `--follow`：追蹤記錄串流
- `--interval <ms>`：追蹤時的輪詢間隔（預設 `1000`）
- `--json`：輸出以行分隔的 JSON 事件
- `--plain`：不含樣式格式的純文字輸出
- `--no-color`：停用 ANSI 色彩
- `--local-time`：以你的本機時區呈現時間戳記（預設）
- `--utc`：以 UTC 呈現時間戳記

## 共用閘道 RPC 選項

`openclaw logs` 也接受標準閘道用戶端旗標：

- `--url <url>`：閘道 WebSocket URL
- `--token <token>`：閘道 token
- `--timeout <ms>`：逾時時間，以 ms 為單位（預設 `30000`）
- `--expect-final`：當閘道呼叫由代理支援時，等待最終回應

傳入 `--url` 時，命令列介面不會自動套用設定或環境認證。如果目標閘道需要驗證，請明確包含 `--token`。

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

## 備註

- 時間戳記預設會以你的本機時區呈現。使用 `--utc` 可輸出 UTC。
- 如果隱含的 local loopback 閘道要求配對、在連線期間關閉，或在 `logs.tail` 回應前逾時，`openclaw logs` 會自動退回使用已設定的閘道檔案記錄。明確的 `--url` 目標不會使用此退回機制。
- `openclaw logs --follow` 在隱含本機閘道 RPC 失敗後，不會追蹤已設定檔案的退回記錄。在 Linux 上，若可用，它會依 PID 使用作用中的使用者 systemd 閘道 journal，並列印所選的記錄來源；否則它會持續重試即時閘道，而不是追蹤可能已過時的並列檔案。
- 使用 `--follow` 時，暫時性的閘道中斷連線（WebSocket 關閉、逾時、連線中斷）會觸發使用指數退避的自動重新連線（最多 8 次重試，嘗試之間上限為 30 秒）。每次重試都會將警告列印到 stderr，且一旦輪詢成功，會列印 `[logs] gateway reconnected` 通知。在 `--json` 模式中，重試警告和重新連線轉換都會以 `{"type":"notice"}` 記錄輸出到 stderr。不可復原的錯誤（驗證失敗、設定錯誤）仍會立即結束。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [閘道記錄](/zh-TW/gateway/logging)
