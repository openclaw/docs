---
read_when:
    - 你需要在部署前驗證由操作員管理的代理路由
    - 你需要在本機擷取 OpenClaw 傳輸流量以進行偵錯
    - 您想要檢查除錯代理工作階段、二進位大型物件或內建查詢預設集
summary: '`openclaw proxy` 的命令列介面參考，包括由操作員管理的 Proxy 驗證與本機偵錯 Proxy 擷取檢查器'
title: 代理
x-i18n:
    generated_at: "2026-06-27T19:07:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

驗證由操作員管理的代理路由，或執行本機明確的偵錯代理，
並檢查擷取到的流量。

使用 `validate` 在啟用 OpenClaw 代理路由前，預先檢查由操作員管理的轉送代理。其他命令是用於
傳輸層調查的偵錯工具：它們可以啟動本機代理、在啟用擷取的情況下執行子命令、列出擷取工作階段、查詢常見流量模式、讀取
擷取到的 blob，並清除本機擷取資料。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 驗證

`openclaw proxy validate` 會檢查來自
`--proxy-url`、設定或 `OPENCLAW_PROXY_URL` 的有效操作員管理代理 URL。受管理的代理 URL 可以使用
`http://` 作為純轉送代理監聽器，或在 OpenClaw 必須先
對代理端點開啟 TLS 再傳送代理請求時使用 `https://`。當沒有啟用並設定代理時，它會回報
設定問題；在變更設定前，使用 `--proxy-url` 進行
一次性的預先檢查。加入 `--proxy-ca-file`，即可信任用於連線到 HTTPS 代理端點的 TLS 私有 CA。預設情況下，它會
驗證公開目的地可透過代理成功連線，且代理
無法連到暫時的 loopback canary。自訂遭拒目的地採用
失敗關閉：HTTP 回應和模稜兩可的傳輸失敗都會失敗，除非
你可以另外驗證部署專屬的拒絕訊號。加入
`--apns-reachable`，也會透過代理開啟 APNs HTTP/2 CONNECT 通道
並確認沙盒 APNs 有回應；此探測會使用刻意無效的
提供者權杖，因此 APNs `403 InvalidProviderToken` 回應就是成功的
可達性訊號。

選項：

- `--json`：列印機器可讀的 JSON。
- `--proxy-url <url>`：驗證此 `http://` 或 `https://` 代理 URL，而不是設定或環境變數。
- `--proxy-ca-file <path>`：信任此 PEM CA 檔案，以用於 HTTPS 代理端點的 TLS 驗證。
- `--allowed-url <url>`：加入預期可透過代理成功連線的目的地。可重複使用以檢查多個目的地。
- `--denied-url <url>`：加入預期會被代理阻擋的目的地。可重複使用以檢查多個目的地。
- `--apns-reachable`：也驗證沙盒 APNs HTTP/2 可透過代理連線。
- `--apns-authority <url>`：搭配 `--apns-reachable` 探測的 APNs authority（預設為 `https://api.sandbox.push.apple.com`；正式環境為 `https://api.push.apple.com`）。
- `--timeout-ms <ms>`：每個請求的逾時時間，單位為毫秒。

請參閱[網路代理](/zh-TW/security/network-proxy)，了解部署指引和拒絕
語意。

## 查詢預設

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 備註

- 除非設定 `--host`，否則 `start` 預設為 `127.0.0.1`。
- `run` 會啟動本機偵錯代理，然後執行 `--` 之後的命令。
- 偵錯代理的直接上游轉送會開啟上游 socket 以供診斷。當 OpenClaw 受管理代理模式啟用時，代理請求和 CONNECT 通道的直接轉送預設為停用；只有在核准的本機診斷中，才設定 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。
- 當代理設定或目的地檢查失敗時，`validate` 會以代碼 1 結束。
- 擷取內容是本機偵錯資料；完成後請使用 `openclaw proxy purge`。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [網路代理](/zh-TW/security/network-proxy)
- [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)
