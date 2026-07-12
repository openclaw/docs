---
read_when:
    - 你想要快速將行動節點應用程式與閘道配對
    - 您需要輸出設定代碼，以便遠端／手動分享
summary: '`openclaw qr` 的命令列介面參考（產生行動裝置配對 QR 碼與設定代碼）'
title: QR 碼
x-i18n:
    generated_at: "2026-07-11T21:12:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

從目前的閘道設定產生行動裝置配對 QR 碼和設定碼。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

當官方 OpenClaw iOS 和 Android 應用程式的設定碼中繼資料相符時，會自動連線。如果請求仍處於待處理狀態（例如使用非官方用戶端或中繼資料不符），請檢視並核准該請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 選項

- `--remote`：優先使用 `gateway.remote.url`；如果未設定該 URL，則退回使用 `gateway.tailscale.mode=serve|funnel`。忽略 `device-pair` 外掛的 `publicUrl`。
- `--url <url>`：覆寫承載資料中使用的閘道 URL
- `--public-url <url>`：覆寫承載資料中使用的公開 URL
- `--token <token>`：覆寫引導流程用於驗證的閘道權杖
- `--password <password>`：覆寫引導流程用於驗證的閘道密碼
- `--setup-code-only`：僅印出設定碼
- `--no-ascii`：略過 ASCII QR 碼呈現
- `--json`：輸出 JSON（`setupCode`、`gatewayUrl`、選用的 `gatewayUrls`、`auth`、`urlSource`）

`--token` 和 `--password` 互斥。

## 設定碼內容

設定碼包含不透明且短效的 `bootstrapToken`，而不是共用的閘道權杖／密碼。內建的引導流程會簽發：

- 具有 `scopes: []` 的主要 `node` 權杖
- 有限的 `operator` 移交權杖，僅限於 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`

配對變更範圍和 `operator.admin` 仍需要另外核准的操作員配對或權杖流程。

## 閘道 URL 解析

對於 Tailscale／公開的 `ws://` 閘道 URL，行動裝置配對會以失敗關閉：請為這些 URL 使用 Tailscale Serve/Funnel 或 `wss://` 閘道 URL。私人區域網路位址和 `.local` Bonjour 主機仍支援透過純文字 `ws://` 連線。

當選取的閘道 URL 來自 `gateway.bind=lan` 時，OpenClaw 也會檢查持久化的 `tailscale serve status --json` 路由。任何代理至作用中閘道 local loopback 連接埠的 HTTPS Serve 根路徑，都會納入作為備援。QR 命令僅針對 `lan` 新增此備援；`custom` 和 `tailnet` 會保留其明確宣告的路由。目前的 iOS 用戶端會依序探測宣告的路由，並儲存第一個可連線的路由；舊版 `url` 欄位維持不變，以支援較舊的用戶端。

使用 `--remote` 時，必須提供 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel` 其中之一。

## 驗證解析（不使用 `--remote`）

未傳入命令列介面驗證覆寫時，本機閘道驗證 SecretRef 會依下列方式解析：

| 條件                                                                                                                         | 解析為                                    |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`，或推斷模式中沒有優先採用的密碼來源                                                              | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`，或推斷模式中驗證設定／環境沒有優先採用的權杖                                                 | `gateway.auth.password`                   |
| 同時設定 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），且未設定 `gateway.auth.mode`                     | 失敗；請明確設定 `gateway.auth.mode`      |

## 驗證解析（`--remote`）

如果實際啟用的遠端憑證設定為 SecretRef，且未傳入 `--token` 或 `--password`，此命令會從作用中的閘道快照解析這些憑證。如果閘道無法使用，命令會立即失敗。

<Note>
此命令路徑需要閘道支援 `secrets.resolve` RPC 方法。較舊的閘道會傳回未知方法錯誤。
</Note>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [裝置](/zh-TW/cli/devices)
- [配對](/zh-TW/cli/pairing)
