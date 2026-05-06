---
read_when:
    - 你想快速檢查執行中的 Gateway 健康狀態
summary: CLI 參考：`openclaw health`（透過 RPC 取得 Gateway 健康狀態快照）
title: 健康狀態
x-i18n:
    generated_at: "2026-05-06T09:04:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

從執行中的 Gateway 擷取健康狀態。

選項：

- `--json`：機器可讀輸出
- `--timeout <ms>`：連線逾時時間，單位為毫秒（預設 `10000`）
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
  Gateway 已有新鮮的快取快照時，它可以傳回該快取承載，並在背景重新整理。
- `--verbose` 會強制進行即時探測、列印 Gateway 連線詳細資料，並展開
  所有已設定帳戶與代理程式的人類可讀輸出。
- 設定多個代理程式時，輸出會包含每個代理程式的工作階段儲存。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway 健康狀態](/zh-TW/gateway/health)
