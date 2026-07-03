---
read_when:
    - 你想要快速將行動節點應用程式與閘道配對
    - 你需要用於遠端/手動分享的設定碼輸出
summary: 命令列介面參考：`openclaw qr`（產生行動配對 QR + 設定代碼）
title: QR
x-i18n:
    generated_at: "2026-07-03T13:15:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
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

- `--remote`：優先使用 `gateway.remote.url`；若未設定，`gateway.tailscale.mode=serve|funnel` 仍可提供遠端公開 URL
- `--url <url>`：覆寫承載資料中使用的閘道 URL
- `--public-url <url>`：覆寫承載資料中使用的公開 URL
- `--token <token>`：覆寫啟動流程用來驗證的閘道權杖
- `--password <password>`：覆寫啟動流程用來驗證的閘道密碼
- `--setup-code-only`：只列印設定碼
- `--no-ascii`：略過 ASCII QR 轉譯
- `--json`：輸出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 注意事項

- `--token` 和 `--password` 互斥。
- 設定碼本身現在攜帶不透明的短效 `bootstrapToken`，而不是共用的閘道權杖/密碼。
- 內建的設定碼啟動會傳回一個主要的 `node` 權杖，帶有 `scopes: []`，另加一個有界的 `operator` 交接權杖，用於受信任的行動裝置初始設定。
- 交接的操作者權杖僅限於 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`；配對變更範圍與 `operator.admin` 仍需要另外核准的操作者配對或權杖流程。
- 行動裝置配對會對 Tailscale/公開 `ws://` 閘道 URL 採取失敗關閉。私有 LAN 位址與 `.local` Bonjour 主機仍支援透過 `ws://` 使用，但 Tailscale/公開行動裝置路由應使用 Tailscale Serve/Funnel 或 `wss://` 閘道 URL。
- 使用 `--remote` 時，OpenClaw 需要 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 時，如果實際作用中的遠端認證設定為 SecretRefs，且你未傳入 `--token` 或 `--password`，此命令會從作用中的閘道快照解析它們。如果閘道無法使用，此命令會快速失敗。
- 未使用 `--remote` 時，若未傳入命令列介面驗證覆寫，會解析本機閘道驗證 SecretRefs：
  - 當權杖驗證可以勝出時，會解析 `gateway.auth.token`（明確的 `gateway.auth.mode="token"`，或在沒有密碼來源勝出的情況下推斷出的模式）。
  - 當密碼驗證可以勝出時，會解析 `gateway.auth.password`（明確的 `gateway.auth.mode="password"`，或在沒有來自 auth/env 的勝出權杖時推斷出的模式）。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），且未設定 `gateway.auth.mode`，設定碼解析會失敗，直到明確設定模式為止。
- 閘道版本差異注意事項：此命令路徑需要支援 `secrets.resolve` 的閘道；較舊的閘道會傳回未知方法錯誤。
- 掃描後，使用以下命令核准裝置配對：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相關

- [命令列介面參考](/zh-TW/cli)
- [配對](/zh-TW/cli/pairing)
