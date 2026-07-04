---
read_when:
    - 你想要快速將行動節點應用程式與閘道配對
    - 你需要 setup-code 輸出以便遠端/手動分享
summary: '`openclaw qr` 的命令列介面參考（產生行動裝置配對 QR + 設定碼）'
title: QR
x-i18n:
    generated_at: "2026-07-04T17:48:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

從目前的閘道設定產生行動裝置配對 QR 與設定碼。

## 使用方式

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 選項

- `--remote`：偏好使用 `gateway.remote.url`；若未設定，`gateway.tailscale.mode=serve|funnel` 仍可提供遠端公開 URL
- `--url <url>`：覆寫酬載中使用的閘道 URL
- `--public-url <url>`：覆寫酬載中使用的公開 URL
- `--token <token>`：覆寫 bootstrap 流程用於驗證的閘道權杖
- `--password <password>`：覆寫 bootstrap 流程用於驗證的閘道密碼
- `--setup-code-only`：只列印設定碼
- `--no-ascii`：略過 ASCII QR 轉譯
- `--json`：輸出 JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## 注意事項

- `--token` 與 `--password` 互斥。
- 設定碼本身現在攜帶不透明且短效的 `bootstrapToken`，而不是共用的閘道權杖/密碼。
- 內建設定碼 bootstrap 會回傳一個主要的 `node` 權杖，帶有 `scopes: []`，以及一個有界限的 `operator` 交接權杖，用於受信任的行動裝置 onboarding。
- 交接的 operator 權杖僅限於 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`；配對變更範圍與 `operator.admin` 仍需要另一個已核准的 operator 配對或權杖流程。
- 對於 Tailscale/公開 `ws://` 閘道 URL，行動裝置配對會以安全關閉方式失敗。私有 LAN 位址與 `.local` Bonjour 主機仍支援透過 `ws://` 使用，但 Tailscale/公開行動裝置路由應使用 Tailscale Serve/Funnel 或 `wss://` 閘道 URL。
- 使用 `--remote` 時，OpenClaw 需要 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 時，如果實際啟用的遠端認證設定為 SecretRefs，且你未傳入 `--token` 或 `--password`，此命令會從作用中的閘道快照解析它們。若閘道無法使用，命令會快速失敗。
- 未使用 `--remote` 時，若未傳入命令列介面驗證覆寫，會解析本機閘道驗證 SecretRefs：
  - 當權杖驗證可勝出時，會解析 `gateway.auth.token`（明確的 `gateway.auth.mode="token"`，或沒有密碼來源勝出的推斷模式）。
  - 當密碼驗證可勝出時，會解析 `gateway.auth.password`（明確的 `gateway.auth.mode="password"`，或沒有來自 auth/env 的勝出權杖之推斷模式）。
- 如果同時設定 `gateway.auth.token` 與 `gateway.auth.password`（包括 SecretRefs），且未設定 `gateway.auth.mode`，設定碼解析會失敗，直到明確設定 mode。
- 閘道版本偏差注意事項：此命令路徑需要支援 `secrets.resolve` 的閘道；較舊的閘道會回傳 unknown-method 錯誤。
- 官方 OpenClaw iOS 與 Android 應用程式會在其
  設定碼 metadata 符合時自動連線。若請求維持待處理狀態（例如非官方用戶端或 metadata 不符），請使用以下命令檢閱並核准：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相關

- [命令列介面參考](/zh-TW/cli)
- [配對](/zh-TW/cli/pairing)
