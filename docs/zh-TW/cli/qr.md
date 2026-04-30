---
read_when:
    - 您想快速將行動 Node 應用程式與 Gateway 配對
    - 你需要 setup-code 輸出以進行遠端／手動分享
summary: '`openclaw qr` 的 CLI 參考（產生行動裝置配對 QR 碼 + 設定碼）'
title: QR 碼
x-i18n:
    generated_at: "2026-04-30T02:55:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

從目前的 Gateway 設定產生行動裝置配對 QR 和設定碼。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 選項

- `--remote`：偏好使用 `gateway.remote.url`；如果未設定，`gateway.tailscale.mode=serve|funnel` 仍可提供遠端公開 URL
- `--url <url>`：覆寫酬載中使用的 Gateway URL
- `--public-url <url>`：覆寫酬載中使用的公開 URL
- `--token <token>`：覆寫 bootstrap 流程用來驗證的 Gateway 權杖
- `--password <password>`：覆寫 bootstrap 流程用來驗證的 Gateway 密碼
- `--setup-code-only`：只列印設定碼
- `--no-ascii`：略過 ASCII QR 算繪
- `--json`：輸出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 注意事項

- `--token` 和 `--password` 互斥。
- 設定碼本身現在帶有不透明、短效的 `bootstrapToken`，而不是共用的 Gateway 權杖/密碼。
- 在內建的節點/操作員 bootstrap 流程中，主要節點權杖仍會以 `scopes: []` 落地。
- 如果 bootstrap 交接也簽發操作員權杖，它會持續受限於 bootstrap 允許清單：`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- Bootstrap 範圍檢查具有角色前綴。該操作員允許清單只滿足操作員請求；非操作員角色仍需要其自身角色前綴下的範圍。
- 行動裝置配對會對 Tailscale/公開 `ws://` Gateway URL 採取失敗關閉。私人 LAN `ws://` 仍受支援，但 Tailscale/公開行動裝置路由應使用 Tailscale Serve/Funnel 或 `wss://` Gateway URL。
- 使用 `--remote` 時，OpenClaw 需要 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 時，如果實際作用中的遠端憑證設定為 SecretRefs，且你未傳入 `--token` 或 `--password`，此命令會從作用中的 Gateway 快照解析它們。如果 Gateway 無法使用，此命令會快速失敗。
- 未使用 `--remote` 時，若未傳入 CLI 驗證覆寫，會解析本機 Gateway 驗證 SecretRefs：
  - 當權杖驗證可以勝出時（明確的 `gateway.auth.mode="token"` 或沒有密碼來源勝出的推斷模式），會解析 `gateway.auth.token`。
  - 當密碼驗證可以勝出時（明確的 `gateway.auth.mode="password"` 或沒有來自 auth/env 的勝出權杖的推斷模式），會解析 `gateway.auth.password`。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），且未設定 `gateway.auth.mode`，設定碼解析會失敗，直到明確設定模式為止。
- Gateway 版本偏差注意事項：此命令路徑需要支援 `secrets.resolve` 的 Gateway；較舊的 Gateway 會傳回未知方法錯誤。
- 掃描後，使用以下命令核准裝置配對：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相關

- [CLI 參考](/zh-TW/cli)
- [配對](/zh-TW/cli/pairing)
