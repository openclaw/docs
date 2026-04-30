---
read_when:
    - 您想快速檢查執行中 Gateway 的健康狀態
summary: '`openclaw health` 的 CLI 參考（透過 RPC 取得 Gateway 健康狀態快照）'
title: 健康狀態
x-i18n:
    generated_at: "2026-04-30T02:53:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

從執行中的 Gateway 擷取健康狀態。

選項：

- `--json`：機器可讀輸出
- `--timeout <ms>`：連線逾時時間，以毫秒為單位（預設 `10000`）
- `--verbose`：詳細記錄
- `--debug`：`--verbose` 的別名

範例：

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

注意事項：

- 預設的 `openclaw health` 會向執行中的 Gateway 要求其健康狀態快照。當
  Gateway 已有新鮮的快取快照時，它可以回傳該快取酬載，並在背景
  重新整理。
- `--verbose` 會強制執行即時探測、列印 Gateway 連線詳細資訊，並展開
  所有已設定帳戶和代理的可讀輸出。
- 設定多個代理時，輸出會包含每個代理的工作階段儲存區。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway 健康狀態](/zh-TW/gateway/health)
