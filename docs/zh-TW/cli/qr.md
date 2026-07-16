---
read_when:
    - 你想快速將行動節點應用程式與閘道配對
    - 你需要輸出設定代碼，以便遠端／手動分享
summary: '`openclaw qr` 的命令列介面參考（產生行動裝置配對 QR Code + 設定代碼）'
title: QR
x-i18n:
    generated_at: "2026-07-16T11:35:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

從目前的閘道設定產生行動裝置配對 QR Code 與設定碼。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

當官方 OpenClaw iOS 與 Android 應用程式的設定碼中繼資料相符時，會自動連線。若要求持續處於待處理狀態（例如使用非官方用戶端或中繼資料不符），請檢視並核准該要求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 選項

- `--remote`：優先使用 `gateway.remote.url`；若未設定該 URL，則改用 `gateway.tailscale.mode=serve|funnel`。忽略 `device-pair` 外掛的 `publicUrl`。
- `--url <url>`：覆寫承載內容中使用的閘道 URL
- `--public-url <url>`：覆寫承載內容中使用的公開 URL
- `--token <token>`：覆寫啟動流程用於驗證身分的閘道權杖
- `--password <password>`：覆寫啟動流程用於驗證身分的閘道密碼
- `--limited`：從交接的操作員權杖中省略閘道管理存取權
- `--setup-code-only`：僅列印設定碼
- `--no-ascii`：略過 ASCII QR Code 轉譯
- `--json`：輸出 JSON（`setupCode`、`gatewayUrl`、選用的 `gatewayUrls`、`auth`、`access`、選用的 `accessDowngraded`、`urlSource`）

`--token` 與 `--password` 互斥。

## 設定碼內容

設定碼攜帶不透明且短效的 `bootstrapToken`，而非共用的閘道權杖／密碼。對於 `wss://` 端點（或同一主機的回送位址），預設啟動流程會發出：

- 具有 `scopes: []` 的主要 `node` 權杖
- 完整的原生行動裝置 `operator` 交接權杖，具有 `operator.admin`、`operator.approvals`、`operator.read`、`operator.talk.secrets` 與 `operator.write`

使用 `--limited` 可保留相同的節點權杖，同時從操作員交接中省略 `operator.admin`。設定碼絕不會交接配對變更範圍。

純文字 LAN `ws://` 設定仍可使用，但 OpenClaw 會自動使用受限設定檔，因為網路觀察者可能擷取並搶先使用持有人啟動權杖。設定 `wss://` 或 Tailscale Serve，然後產生新代碼以取得完整存取權。

## 閘道 URL 解析

行動裝置配對遇到 Tailscale／公開 `ws://` 閘道 URL 時會採取失敗關閉：請改用 Tailscale Serve／Funnel 或 `wss://` 閘道 URL。私人 LAN 位址與 `.local` Bonjour 主機仍支援透過純 `ws://` 連線，操作員存取權會如上所述受到限制。

當所選的閘道 URL 來自 `gateway.bind=lan` 時，OpenClaw 也會檢查持久化的 `tailscale serve status --json` 路由。任何代理至作用中閘道回送連接埠的 HTTPS Serve 根路徑，都會納入作為備援。QR 命令只會為 `lan` 新增此備援；`custom` 與 `tailnet` 會保留其明確公告的路由。目前的 iOS 用戶端會依序探測公告的路由，並儲存第一個可連線的路由；舊版 `url` 欄位則維持不變，以供較舊的用戶端使用。

使用 `--remote` 時，必須提供 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel` 其中之一。

## 驗證解析（無 `--remote`）

未傳入命令列介面驗證覆寫時，本機閘道驗證 SecretRefs 的解析方式如下：

| 條件                                                                                                                    | 解析為                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`，或推斷模式下沒有優先採用的密碼來源                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`，或推斷模式下沒有來自驗證／環境的優先採用權杖                                         | `gateway.auth.password`                   |
| 同時設定 `gateway.auth.token` 與 `gateway.auth.password`（包括 SecretRefs），且未設定 `gateway.auth.mode` | 失敗；請明確設定 `gateway.auth.mode` |

## 驗證解析（`--remote`）

若實際啟用的遠端認證資訊設定為 SecretRefs，且未傳入 `--token` 或 `--password`，此命令會從作用中的閘道快照解析這些資訊。若閘道無法使用，此命令會快速失敗。

<Note>
此命令路徑需要支援 `secrets.resolve` RPC 方法的閘道。較舊的閘道會傳回未知方法錯誤。
</Note>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [裝置](/zh-TW/cli/devices)
- [配對](/zh-TW/cli/pairing)
