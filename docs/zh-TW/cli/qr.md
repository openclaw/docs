---
read_when:
    - 你想要快速將行動節點應用程式與閘道配對
    - 你需要 setup-code 輸出以進行遠端/手動分享
summary: '`openclaw qr` 的命令列介面參考（產生行動裝置配對 QR 碼 + 設定碼）'
title: QR
x-i18n:
    generated_at: "2026-07-05T17:41:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc8e1781b654f281f53beea8ec684c743fb585f65a0ecc9823a20a0180b4ca4c
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

從目前的閘道設定產生行動配對 QR 與設定碼。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

官方 OpenClaw iOS 與 Android 應用程式會在其設定碼中繼資料相符時自動連線。如果請求仍處於待處理狀態（例如非官方用戶端或中繼資料不相符），請檢查並核准它：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 選項

- `--remote`：優先使用 `gateway.remote.url`；如果該 URL 未設定，則退回到 `gateway.tailscale.mode=serve|funnel`。忽略 `device-pair` 外掛的 `publicUrl`。
- `--url <url>`：覆寫承載資料中使用的閘道 URL
- `--public-url <url>`：覆寫承載資料中使用的公開 URL
- `--token <token>`：覆寫 bootstrap 流程用來驗證的閘道權杖
- `--password <password>`：覆寫 bootstrap 流程用來驗證的閘道密碼
- `--setup-code-only`：只列印設定碼
- `--no-ascii`：略過 ASCII QR 轉譯
- `--json`：輸出 JSON（`setupCode`、`gatewayUrl`、選用的 `gatewayUrls`、`auth`、`urlSource`）

`--token` 和 `--password` 互斥。

## 設定碼內容

設定碼攜帶的是不透明、短效的 `bootstrapToken`，而不是共用的閘道權杖/密碼。內建的 bootstrap 流程會發出：

- 主要的 `node` 權杖，含 `scopes: []`
- 有界的 `operator` 交接權杖，限制於 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`

配對變更範圍和 `operator.admin` 仍需要另行核准的 operator 配對或權杖流程。

## 閘道 URL 解析

行動配對會對 Tailscale/公開 `ws://` 閘道 URL 失敗關閉：請對這些 URL 使用 Tailscale Serve/Funnel 或 `wss://` 閘道 URL。私有 LAN 位址和 `.local` Bonjour 主機仍支援透過純 `ws://` 使用。

當選取的閘道 URL 來自 `gateway.bind=lan` 時，OpenClaw 也會檢查持久的 `tailscale serve status --json` 路由。任何代理作用中閘道迴送連接埠的 HTTPS Serve 根路徑，都會作為備援納入。特定介面的 `custom` 和 `tailnet` 繫結不會收到該備援，因為迴送 Serve 代理無法連到那些監聽器。目前的 iOS 用戶端會依序探測公告的路由，並儲存第一個可連線的路由；舊版用戶端的既有 `url` 欄位保持不變。

使用 `--remote` 時，必須具備 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel` 其中之一。

## 驗證解析（無 `--remote`）

未傳入命令列介面驗證覆寫時，本機閘道驗證 SecretRefs 會依下列方式解析：

| 條件                                                                                                                    | 解析為                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`，或推斷模式且沒有勝出的密碼來源                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`，或推斷模式且沒有來自驗證/env 的勝出權杖                                         | `gateway.auth.password`                   |
| 同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），且未設定 `gateway.auth.mode` | 失敗；請明確設定 `gateway.auth.mode` |

## 驗證解析（`--remote`）

如果有效啟用的遠端認證設定為 SecretRefs，且未傳入 `--token` 或 `--password`，此命令會從作用中的閘道快照解析它們。如果閘道無法使用，此命令會快速失敗。

<Note>
此命令路徑需要支援 `secrets.resolve` RPC 方法的閘道。較舊的閘道會傳回未知方法錯誤。
</Note>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [裝置](/zh-TW/cli/devices)
- [配對](/zh-TW/cli/pairing)
