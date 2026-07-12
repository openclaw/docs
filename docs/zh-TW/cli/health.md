---
read_when:
    - 你想快速檢查執行中閘道的健康狀態
summary: '`openclaw health` 的命令列介面參考（透過 RPC 取得閘道健康狀態快照）'
title: 健康狀態
x-i18n:
    generated_at: "2026-07-11T21:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

透過 WebSocket RPC 從執行中的閘道擷取健康狀態快照（命令列介面不會直接連線至頻道通訊端）。

## 選項

| 旗標             | 預設值  | 說明                                                                                 |
| ---------------- | ------- | ------------------------------------------------------------------------------------ |
| `--json`         | `false` | 輸出機器可讀的 JSON，而非文字。                                                      |
| `--timeout <ms>` | `10000` | 連線逾時時間，以毫秒為單位。                                                         |
| `--verbose`      | `false` | 強制執行即時探測，並展開輸出以涵蓋所有已設定的帳戶與代理程式。                       |
| `--debug`        | `false` | `--verbose` 的別名。                                                                 |

範例：

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## 行為

- 未使用 `--verbose` 時，閘道可傳回快取的快照（最長 60 秒內視為新鮮，且與即時頻道執行階段狀態一致），並在背景重新整理快照，供下一個呼叫端使用。
- `--verbose` 會強制執行即時探測（逐一探測各頻道帳戶）、輸出閘道連線詳細資料，並將人類可讀的輸出展開至所有已設定的帳戶與代理程式，而非僅顯示預設代理程式。
- `--json` 一律傳回完整快照：頻道、各帳戶探測結果、外掛載入狀態、上下文引擎隔離狀態、模型定價快取狀態、事件迴圈健康狀態，以及各代理程式的工作階段儲存區。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [`openclaw status`](/zh-TW/cli/status) — 不擷取完整健康狀態快照的本機診斷與頻道探測
- [閘道健康狀態](/zh-TW/gateway/health)
