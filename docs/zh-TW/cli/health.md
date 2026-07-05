---
read_when:
    - 你想要快速檢查正在執行的閘道健康狀態
summary: '`openclaw health` 的命令列介面參考（透過 RPC 取得閘道健康狀態快照）'
title: 健康
x-i18n:
    generated_at: "2026-07-05T11:11:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

透過 WebSocket RPC 從執行中的閘道擷取健康狀態快照（命令列介面不直接連接通道 socket）。

## 選項

| 旗標             | 預設值 | 說明                                                                       |
| ---------------- | ------- | --------------------------------------------------------------------------------- |
| `--json`         | `false` | 輸出機器可讀的 JSON，而不是文字。                                      |
| `--timeout <ms>` | `10000` | 連線逾時時間，單位為毫秒。                                               |
| `--verbose`      | `false` | 強制執行即時探測，並展開所有已設定帳號與代理的輸出。 |
| `--debug`        | `false` | `--verbose` 的別名。                                                            |

範例：

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## 行為

- 未使用 `--verbose` 時，閘道可以回傳快取快照（最長 60 秒內為新鮮，且與即時通道執行階段狀態相同），並在背景重新整理，供下一個呼叫者使用。
- `--verbose` 會強制執行即時探測（逐通道帳號探測）、列印閘道連線詳細資訊，並將人類可讀輸出展開到所有已設定帳號與代理，而不只是預設代理。
- `--json` 一律回傳完整快照：通道、逐帳號探測、外掛載入狀態、情境引擎隔離狀態、模型定價快取狀態、事件迴圈健康狀態，以及逐代理工作階段儲存。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [`openclaw status`](/zh-TW/cli/status) — 不含完整健康狀態快照的本機診斷與通道探測
- [閘道健康狀態](/zh-TW/gateway/health)
