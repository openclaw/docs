---
read_when:
    - 你想快速檢查執行中閘道的健康狀態
summary: '`openclaw health` 的命令列介面參考（透過 RPC 取得閘道健康狀態快照）'
title: 健康狀態
x-i18n:
    generated_at: "2026-07-19T13:42:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51cc0e3dd61af3e6fa460dd646bfa1c3e5bd1a52da860eac26c12101151d081d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

透過 WebSocket RPC 從執行中的閘道擷取健康狀態快照（命令列介面不直接連線至頻道通訊端）。

## 選項

| 旗標             | 預設值 | 說明                                                                       |
| ---------------- | ------- | --------------------------------------------------------------------------------- |
| `--json`         | `false` | 列印機器可讀的 JSON，而非文字。                                      |
| `--timeout <ms>` | `10000` | 連線逾時時間（毫秒）。                                               |
| `--verbose`      | `false` | 強制執行即時探測，並展開所有已設定帳號與代理程式的輸出。 |
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

- 未使用 `--verbose` 時，閘道可傳回快取的快照（有效期最長為 60 秒，且與即時頻道執行階段狀態相同），並在背景重新整理，供下一個呼叫端使用。
- `--verbose` 會強制執行即時探測（逐一探測各頻道帳號）、列印閘道連線詳細資訊，並展開所有已設定帳號與代理程式的人類可讀輸出，而非僅顯示預設代理程式。
- `--json` 一律傳回完整快照：頻道、各帳號的探測結果、外掛載入狀態、情境引擎隔離狀態、模型定價快取狀態、事件迴圈健康狀態、傳遞佇列的死信，以及各代理程式的工作階段儲存區。
- 當傳出訊息傳遞或傳入頻道事件被放入死信佇列時，文字輸出會回報其數量及最早失敗事件的經過時間。傳入事件數量會依頻道帳號分組；若要檢查或復原個別事件，請使用 [`openclaw channels dead-letters`](/zh-TW/cli/channels#inbound-dead-letters)。

## 相關資訊

- [命令列介面參考資料](/zh-TW/cli)
- [`openclaw status`](/zh-TW/cli/status) — 不使用完整健康狀態快照進行本機診斷與頻道探測
- [閘道健康狀態](/zh-TW/gateway/health)
