---
read_when:
    - 你想快速將行動 Node 應用程式與 Gateway 配對
    - 你需要 setup-code 輸出，才能進行遠端/手動分享
summary: '`openclaw qr` 的 CLI 參考（產生行動裝置配對 QR + 設定代碼）'
title: QR
x-i18n:
    generated_at: "2026-05-06T02:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

從目前的 Gateway 設定產生行動裝置配對 QR 與設定碼。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 選項

- `--remote`：優先使用 `gateway.remote.url`；若未設定，`gateway.tailscale.mode=serve|funnel` 仍可提供遠端公開 URL
- `--url <url>`：覆寫承載資料中使用的 Gateway URL
- `--public-url <url>`：覆寫承載資料中使用的公開 URL
- `--token <token>`：覆寫啟動流程用來驗證的 Gateway 權杖
- `--password <password>`：覆寫啟動流程用來驗證的 Gateway 密碼
- `--setup-code-only`：只列印設定碼
- `--no-ascii`：略過 ASCII QR 算繪
- `--json`：輸出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 注意事項

- `--token` 和 `--password` 互斥。
- 設定碼本身現在攜帶不透明且短效的 `bootstrapToken`，而不是共用的 Gateway 權杖/密碼。
- 在內建的 Node/操作者啟動流程中，主要 Node 權杖仍會以 `scopes: []` 落地。
- 如果啟動交接也簽發操作者權杖，該權杖會維持限制在啟動允許清單中：`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- 啟動範圍檢查具有角色前綴。該操作者允許清單只滿足操作者請求；非操作者角色仍需要其自身角色前綴下的範圍。
- 行動裝置配對會對 Tailscale/公開 `ws://` Gateway URL 採取失敗關閉。私人 LAN 位址和 `.local` Bonjour 主機仍支援透過 `ws://` 使用，但 Tailscale/公開行動路由應使用 Tailscale Serve/Funnel 或 `wss://` Gateway URL。
- 使用 `--remote` 時，OpenClaw 需要 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 時，如果實際作用中的遠端憑證設定為 SecretRefs，且你沒有傳入 `--token` 或 `--password`，此命令會從作用中的 Gateway 快照解析它們。如果 Gateway 無法使用，此命令會快速失敗。
- 不使用 `--remote` 時，若未傳入 CLI 驗證覆寫，會解析本機 Gateway 驗證 SecretRefs：
  - 當權杖驗證可勝出時，會解析 `gateway.auth.token`（明確的 `gateway.auth.mode="token"`，或在沒有密碼來源勝出的情況下推斷出的模式）。
  - 當密碼驗證可勝出時，會解析 `gateway.auth.password`（明確的 `gateway.auth.mode="password"`，或在沒有來自驗證/環境的權杖勝出的情況下推斷出的模式）。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），且未設定 `gateway.auth.mode`，設定碼解析會失敗，直到明確設定模式為止。
- Gateway 版本偏差注意事項：此命令路徑需要支援 `secrets.resolve` 的 Gateway；較舊的 Gateway 會傳回未知方法錯誤。
- 掃描後，使用以下命令核准裝置配對：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相關內容

- [CLI 參考](/zh-TW/cli)
- [配對](/zh-TW/cli/pairing)
