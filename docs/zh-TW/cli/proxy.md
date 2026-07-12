---
read_when:
    - 您需要在部署前驗證由操作人員管理的代理路由
    - 您需要在本機擷取 OpenClaw 的傳輸流量以進行偵錯
    - 你想要檢查偵錯代理伺服器工作階段、Blob 或內建查詢預設集
summary: '`openclaw proxy` 的命令列介面參考資料，包含由操作者管理的代理伺服器驗證，以及本機偵錯代理伺服器擷取檢查器'
title: 代理伺服器
x-i18n:
    generated_at: "2026-07-11T21:14:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

驗證由操作者管理的代理伺服器路由，或執行本機明確指定的偵錯代理伺服器並檢查擷取的流量。

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

`validate` 會預先檢查由操作者管理的正向代理伺服器。其餘命令是用於傳輸層調查的偵錯工具：啟動本機流量擷取代理伺服器、透過它執行子命令、列出擷取工作階段、查詢流量模式、讀取擷取的二進位大型物件，以及清除本機擷取資料。

## 驗證

依下列優先順序檢查有效的操作者管理代理伺服器 URL：`--proxy-url`、設定（`proxy.proxyUrl`）或 `OPENCLAW_PROXY_URL`。若未啟用及設定代理伺服器，便會回報設定問題；若只想進行一次性預先檢查而不變更設定，請傳入 `--proxy-url`。

受管理的代理伺服器 URL 使用 `http://` 連線至純文字正向代理伺服器監聽器；若 OpenClaw 必須先與代理伺服器端點建立 TLS 連線，再傳送代理伺服器要求，則使用 `https://`。使用 `--proxy-ca-file` 可信任該 TLS 連線所使用的私有 CA。

預設會執行：

- 一項針對 `https://example.com/` 的**允許**檢查（可使用可重複指定的 `--allowed-url` 覆寫或新增）
- 一項針對暫時性迴路回送探針的**拒絕**檢查（可使用可重複指定的 `--denied-url` 覆寫）

自訂 `--denied-url` 目標採失敗時關閉原則：HTTP 回應與語意不明的傳輸失敗都會視為檢查失敗，除非你能獨立驗證部署專用的拒絕訊號。只有內建迴路回送探針會將傳輸錯誤視為遭封鎖的證明。

新增 `--apns-reachable`，還可透過代理伺服器開啟 APNs HTTP/2 CONNECT 通道，並確認沙箱 APNs 有所回應。此探測會傳送刻意無效的提供者權杖，因此 APNs 的 `403 InvalidProviderToken` 回應會視為可連線成功的訊號，而非失敗。

### 選項

| 旗標                     | 效果                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--json`                 | 輸出機器可讀的 JSON                                                                                        |
| `--proxy-url <url>`      | 驗證此 `http://`/`https://` 代理伺服器 URL，而非設定或環境變數中的 URL                                              |
| `--proxy-ca-file <path>` | 信任此 PEM CA 檔案，以驗證 HTTPS 代理伺服器端點的 TLS                                             |
| `--allowed-url <url>`    | 預期可透過代理伺服器成功存取的目的地（可重複指定）                                                     |
| `--denied-url <url>`     | 預期遭代理伺服器封鎖的目的地（可重複指定）                                                       |
| `--apns-reachable`       | 另行驗證可透過代理伺服器連線至沙箱 APNs HTTP/2                                                     |
| `--apns-authority <url>` | 要探測的 APNs 授權端點（預設為 `https://api.sandbox.push.apple.com`；正式環境為 `https://api.push.apple.com`） |
| `--timeout-ms <ms>`      | 每項要求的逾時時間                                                                                                |

代理伺服器設定或目的地檢查失敗時，會以代碼 1 結束。

如需部署指引與拒絕語意，請參閱[網路代理伺服器](/zh-TW/security/network-proxy)。

## 偵錯代理伺服器

`start` 會啟動本機流量擷取代理伺服器，並輸出其 URL、CA 憑證路徑及擷取資料庫路徑；按 Ctrl+C 即可停止。除非設定 `--host`，否則預設繫結至 `127.0.0.1`。

`run` 會啟動本機偵錯代理伺服器，接著套用代理伺服器環境變數，在獨立的擷取工作階段中執行 `<cmd...>`（位於 `--` 之後）。

偵錯代理伺服器的直接上游轉送功能會開啟上游通訊端以供診斷。啟用 OpenClaw 受管理代理伺服器模式時，預設會停用代理伺服器要求與 CONNECT 通道的直接轉送；僅可在經核准的本機診斷中設定 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。

`coverage` 會輸出 JSON 報告（`summary` 加上各傳輸方式的 `entries`），說明哪些傳輸方式已擷取、僅透過代理伺服器，或尚未涵蓋。

`sessions` 會列出最近的擷取工作階段（`--limit`，預設為 20）。

`query --preset <name>` 會對擷取的流量執行內建查詢，並可選擇使用 `--session <id>` 限定工作階段。預設查詢：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` 會輸出已擷取承載資料二進位大型物件的原始內容。

`purge` 會刪除所有擷取的流量中繼資料與二進位大型物件。擷取內容屬於本機偵錯資料；完成後請予以清除。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [網路代理伺服器](/zh-TW/security/network-proxy)
- [受信任代理伺服器驗證](/zh-TW/gateway/trusted-proxy-auth)
