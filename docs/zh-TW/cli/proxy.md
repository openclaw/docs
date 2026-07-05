---
read_when:
    - 您需要在部署前驗證由操作員管理的代理路由
    - 你需要在本機擷取 OpenClaw 傳輸流量以進行除錯
    - 你想要檢查除錯代理工作階段、Blob 或內建查詢預設設定
summary: '`openclaw proxy` 的命令列介面參考，包括由操作員管理的代理驗證，以及本機偵錯代理擷取檢查器'
title: Proxy
x-i18n:
    generated_at: "2026-07-05T11:10:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

驗證由操作員管理的代理路由，或執行本機明確偵錯代理並檢查擷取的流量。

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` 會預先檢查由操作員管理的正向代理。其餘都是用於傳輸層級調查的偵錯工具：啟動本機擷取代理、透過它執行子命令、列出擷取工作階段、查詢流量模式、讀取擷取的 blob，以及清除本機擷取資料。

## 驗證

依序從 `--proxy-url`、設定 (`proxy.proxyUrl`) 或 `OPENCLAW_PROXY_URL` 檢查有效的由操作員管理代理 URL。若未啟用並設定代理，會回報設定問題；傳入 `--proxy-url` 可在不修改設定的情況下執行一次性預先檢查。

受管理的代理 URL 會使用 `http://` 表示純正向代理監聽器；當 OpenClaw 必須先對代理端點本身開啟 TLS，再傳送代理請求時，則使用 `https://`。使用 `--proxy-ca-file` 信任該 TLS 連線的私有 CA。

預設會執行：

- 一項針對 `https://example.com/` 的**允許**檢查（可用 `--allowed-url` 覆寫/新增，可重複）
- 一項針對臨時 loopback canary 的**拒絕**檢查（可用 `--denied-url` 覆寫，可重複）

自訂 `--denied-url` 目標採用失敗即關閉：除非你能獨立驗證特定部署的拒絕訊號，否則 HTTP 回應和模稜兩可的傳輸失敗都會計為失敗。內建 loopback canary 是唯一會將傳輸錯誤視為封鎖證明的目標。

加入 `--apns-reachable` 也會透過代理開啟 APNs HTTP/2 CONNECT 通道，並確認 sandbox APNs 會回應。探測會傳送刻意無效的提供者 token，因此 APNs `403 InvalidProviderToken` 回應會計為成功的可達性訊號（不是失敗）。

### 選項

| 旗標                     | 效果                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--json`                 | 列印機器可讀的 JSON                                                                                        |
| `--proxy-url <url>`      | 驗證這個 `http://`/`https://` 代理 URL，而非設定或環境變數                                              |
| `--proxy-ca-file <path>` | 信任此 PEM CA 檔案，用於 HTTPS 代理端點的 TLS 驗證                                             |
| `--allowed-url <url>`    | 預期可透過代理成功連線的目的地（可重複）                                                     |
| `--denied-url <url>`     | 預期會被代理封鎖的目的地（可重複）                                                       |
| `--apns-reachable`       | 同時驗證 sandbox APNs HTTP/2 可透過代理到達                                                     |
| `--apns-authority <url>` | 要探測的 APNs authority（預設 `https://api.sandbox.push.apple.com`；production 是 `https://api.push.apple.com`） |
| `--timeout-ms <ms>`      | 每個請求的逾時時間                                                                                                |

當代理設定或目的地檢查失敗時，會以代碼 1 結束。

部署指引與拒絕語意請參閱[網路代理](/zh-TW/security/network-proxy)。

## 偵錯代理

`start` 會啟動本機擷取代理，並列印其 URL、CA 憑證路徑和擷取 DB 路徑；使用 Ctrl+C 停止。除非設定 `--host`，否則預設繫結到 `127.0.0.1`。

`run` 會啟動本機偵錯代理，然後在套用代理環境的情況下，於其自己的擷取工作階段中執行 `<cmd...>`（在 `--` 之後）。

偵錯代理的直接上游轉送會為診斷開啟上游 socket。當 OpenClaw 受管理代理模式啟用時，代理請求和 CONNECT 通道的直接轉送預設會停用；僅可針對已核准的本機診斷設定 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。

`coverage` 會列印 JSON 報告（`summary` + 每個傳輸的 `entries`），說明哪些傳輸會被擷取、僅限代理，或未涵蓋。

`sessions` 會列出最近的擷取工作階段（`--limit`，預設 20）。

`query --preset <name>` 會對擷取的流量執行內建查詢，並可選擇以 `--session <id>` 限定範圍。預設集：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` 會列印擷取的 payload blob 原始內容。

`purge` 會刪除所有擷取的流量中繼資料和 blob。擷取內容是本機偵錯資料；完成後請清除。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [網路代理](/zh-TW/security/network-proxy)
- [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)
