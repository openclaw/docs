---
read_when:
    - 您需要在部署前驗證由操作員管理的代理路由
    - 您需要在本機擷取 OpenClaw 傳輸流量以進行偵錯
    - 您想要檢查除錯代理工作階段、大型二進位物件，或內建查詢預設集
summary: '`openclaw proxy` 的 CLI 參考，包括由操作員管理的代理驗證，以及本機偵錯代理擷取檢查器'
title: 代理
x-i18n:
    generated_at: "2026-05-04T18:23:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

驗證由操作員管理的代理路由，或執行本機明確偵錯代理
並檢查已擷取的流量。

使用 `validate` 在啟用 OpenClaw 代理路由前，預先檢查由操作員管理的轉送代理。其他命令則是用於傳輸層級調查的偵錯工具：它們可以啟動本機代理、在啟用擷取的情況下執行子命令、列出擷取工作階段、查詢常見流量模式、讀取已擷取的 blob，以及清除本機擷取資料。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 驗證

`openclaw proxy validate` 會從 `--proxy-url`、設定或 `OPENCLAW_PROXY_URL` 檢查有效的由操作員管理的代理 URL。當沒有啟用並設定代理時，它會回報設定問題；請使用 `--proxy-url` 在變更設定前進行一次性預先檢查。預設情況下，它會驗證可透過代理成功連線至公開目的地，且代理無法連線至暫時的 loopback canary。自訂拒絕目的地採失敗關閉模式：HTTP 回應和不明確的傳輸失敗都會視為失敗，除非你可以另外驗證部署專屬的拒絕訊號。加入 `--apns-reachable` 也會透過代理開啟 APNs HTTP/2 CONNECT 通道，並確認沙盒 APNs 有回應；此探測會使用刻意無效的提供者權杖，因此 APNs `403 InvalidProviderToken` 回應即代表可達性訊號成功。

選項：

- `--json`：列印機器可讀的 JSON。
- `--proxy-url <url>`：驗證此代理 URL，而非設定或環境變數。
- `--allowed-url <url>`：加入預期可透過代理成功連線的目的地。可重複使用以檢查多個目的地。
- `--denied-url <url>`：加入預期會被代理封鎖的目的地。可重複使用以檢查多個目的地。
- `--apns-reachable`：也驗證沙盒 APNs HTTP/2 可透過代理連線。
- `--apns-authority <url>`：搭配 `--apns-reachable` 探測的 APNs authority（預設為 `https://api.sandbox.push.apple.com`；正式環境為 `https://api.push.apple.com`）。
- `--timeout-ms <ms>`：每個請求的逾時時間，單位為毫秒。

請參閱[網路代理](/zh-TW/security/network-proxy)以取得部署指引和拒絕語意。

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
- `run` 會啟動本機偵錯代理，然後執行 `--` 之後的命令。
- 偵錯代理的直接上游轉送會開啟上游 socket 以供診斷使用。當 OpenClaw 管理代理模式啟用時，代理請求和 CONNECT 通道的直接轉送預設為停用；只有在核准的本機診斷中，才設定 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。
- `validate` 會在代理設定或目的地檢查失敗時，以代碼 1 結束。
- 擷取內容是本機偵錯資料；完成後請使用 `openclaw proxy purge`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [網路代理](/zh-TW/security/network-proxy)
- [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)
