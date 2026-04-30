---
read_when:
    - 您需要在本機擷取 OpenClaw 傳輸流量以進行偵錯
    - 您想要檢查除錯代理工作階段、二進位大型物件，或內建查詢預設集
summary: '`openclaw proxy` 的 CLI 參考，這是本機偵錯代理與擷取檢查器'
title: 代理
x-i18n:
    generated_at: "2026-04-30T02:55:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

執行本機明確式除錯代理，並檢查擷取的流量。

這是用於傳輸層級調查的除錯命令。它可以啟動本機代理、在啟用擷取的情況下執行子命令、列出擷取工作階段、查詢常見流量模式、讀取擷取的 blob，以及清除本機擷取資料。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 查詢預設集

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 備註

- `start` 預設為 `127.0.0.1`，除非已設定 `--host`。
- `run` 會啟動本機除錯代理，然後執行 `--` 之後的命令。
- 擷取內容是本機除錯資料；完成後請使用 `openclaw proxy purge`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)
