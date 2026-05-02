---
read_when:
    - 你需要在部署前驗證由操作員管理的代理路由
    - 你需要在本機擷取 OpenClaw 傳輸流量以進行偵錯
    - 你想檢查偵錯代理工作階段、Blob 或內建查詢預設
summary: '`openclaw proxy` 的 CLI 參考，包括由操作員管理的代理驗證，以及本機偵錯代理擷取檢查器'
title: 代理
x-i18n:
    generated_at: "2026-05-02T02:46:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

驗證由操作者管理的代理路由，或執行本機明確除錯代理並檢查擷取的流量。

使用 `validate` 在啟用 OpenClaw 代理路由之前，預先檢查由操作者管理的正向代理。其他命令是用於傳輸層級調查的除錯工具：它們可以啟動本機代理、在啟用擷取的情況下執行子命令、列出擷取工作階段、查詢常見流量模式、讀取擷取的 blob，以及清除本機擷取資料。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 驗證

`openclaw proxy validate` 會檢查來自 `--proxy-url`、設定或 `OPENCLAW_PROXY_URL` 的有效操作者管理代理 URL。未啟用且設定代理時，它會回報設定問題；在變更設定前，請使用 `--proxy-url` 進行一次性預先檢查。預設情況下，它會驗證公開目的地可透過代理成功連線，且代理無法連到暫時性迴環 canary。自訂拒絕目的地採取失敗即關閉：HTTP 回應與不明確的傳輸失敗都會視為失敗，除非你能另外驗證特定部署的拒絕訊號。

選項：

- `--json`：列印機器可讀的 JSON。
- `--proxy-url <url>`：驗證此代理 URL，而不是設定或環境變數。
- `--allowed-url <url>`：新增預期可透過代理成功連線的目的地。可重複使用以檢查多個目的地。
- `--denied-url <url>`：新增預期會被代理封鎖的目的地。可重複使用以檢查多個目的地。
- `--timeout-ms <ms>`：每個請求的逾時時間，以毫秒為單位。

請參閱[網路代理](/zh-TW/security/network-proxy)，了解部署指引與拒絕語義。

## 查詢預設

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注意事項

- `start` 預設為 `127.0.0.1`，除非設定了 `--host`。
- `run` 會啟動本機除錯代理，然後執行 `--` 之後的命令。
- `validate` 會在代理設定或目的地檢查失敗時以代碼 1 結束。
- 擷取內容是本機除錯資料；完成後請使用 `openclaw proxy purge`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [網路代理](/zh-TW/security/network-proxy)
- [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)
