---
read_when:
    - 變更儀表板身分驗證或公開模式
summary: Gateway 儀表板（控制 UI）存取與身分驗證
title: 儀表板
x-i18n:
    generated_at: "2026-05-11T20:38:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Gateway 儀表板是預設由 `/` 提供的瀏覽器控制 UI
（可用 `gateway.controlUi.basePath` 覆寫）。

快速開啟（本機 Gateway）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 時，WebSocket 端點請使用 `https://127.0.0.1:18789/` 和
  `wss://127.0.0.1:18789`。

主要參考：

- [控制 UI](/zh-TW/web/control-ui)：用法與 UI 功能。
- [Tailscale](/zh-TW/gateway/tailscale)：Serve/Funnel 自動化。
- [Web 介面](/zh-TW/web)：繫結模式與安全性注意事項。

驗證會透過設定的 gateway 驗證路徑，在 WebSocket 交握時強制執行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- `gateway.auth.mode: "trusted-proxy"` 時的可信 Proxy 身分標頭

請參閱 [Gateway 設定](/zh-TW/gateway/configuration)中的 `gateway.auth`。

安全性注意事項：控制 UI 是一個**管理介面**（聊天、設定、exec 核准）。
請勿公開暴露它。UI 會針對目前的瀏覽器分頁工作階段與所選 gateway URL，將儀表板 URL token 保存在 sessionStorage，
並在載入後從 URL 移除這些 token。
建議使用 localhost、Tailscale Serve 或 SSH 通道。

## 快速路徑（建議）

- 完成入門設定後，CLI 會自動開啟儀表板，並列印一個乾淨的（不含 token）連結。
- 隨時重新開啟：`openclaw dashboard`（複製連結、可行時開啟瀏覽器，若為無頭環境則顯示 SSH 提示）。
- 如果剪貼簿與瀏覽器傳遞都失敗，`openclaw dashboard` 仍會列印乾淨的
  URL，並告訴你使用 `OPENCLAW_GATEWAY_TOKEN` 或
  `gateway.auth.token` 的 token 作為 URL 片段鍵 `token`；它不會在記錄中列印 token
  值。
- 如果 UI 提示需要 shared-secret 驗證，請將設定的 token 或
  password 貼到控制 UI 設定中。

## 驗證基礎（本機與遠端）

- **Localhost**：開啟 `http://127.0.0.1:18789/`。
- **Gateway TLS**：當 `gateway.tls.enabled: true` 時，儀表板/狀態連結會使用
  `https://`，控制 UI WebSocket 連結會使用 `wss://`。
- **Shared-secret token 來源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可透過 URL 片段傳遞它
  以進行一次性啟動，而控制 UI 會針對目前瀏覽器分頁工作階段與所選 gateway URL，將其保存在 sessionStorage，
  而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  會刻意列印/複製/開啟不含 token 的 URL。這可避免將
  外部管理的 token 暴露在 shell 記錄、剪貼簿歷史或瀏覽器啟動
  引數中。
- 如果 `gateway.auth.token` 設定為 SecretRef，且在你目前的
  shell 中無法解析，`openclaw dashboard` 仍會列印不含 token 的 URL，以及
  可操作的驗證設定指引。
- **Shared-secret password**：使用設定的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。儀表板不會在重新載入後保留 password。
- **帶有身分的模式**：當 `gateway.auth.allowTailscale: true` 時，Tailscale Serve 可透過身分標頭滿足控制 UI/WebSocket
  驗證，而非 local loopback、具身分感知的反向 Proxy 可滿足
  `gateway.auth.mode: "trusted-proxy"`。在這些模式中，儀表板不需要
  為 WebSocket 貼上 shared secret。
- **不是 localhost**：請使用 Tailscale Serve、非 local loopback shared-secret 繫結、
  非 local loopback、具身分感知的反向 Proxy 並設定
  `gateway.auth.mode: "trusted-proxy"`，或使用 SSH 通道。HTTP API 仍使用
  shared-secret 驗證，除非你刻意執行私有入口
  `gateway.auth.mode: "none"` 或 trusted-proxy HTTP 驗證。請參閱
  [Web 介面](/zh-TW/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 "unauthorized" / 1008

- 確認 gateway 可連線（本機：`openclaw status`；遠端：SSH 通道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`）。
- 對於 `AUTH_TOKEN_MISMATCH`，當 gateway 回傳重試提示時，client 可以使用快取的裝置 token 執行一次可信重試。該快取 token 重試會重用 token 快取的已核准 scopes；明確的 `deviceToken` / 明確的 `scopes` 呼叫者會保留其要求的 scope 集合。如果該次重試後驗證仍失敗，請手動解決 token 漂移。
- 對於 `AUTH_SCOPE_MISMATCH`，裝置 token 已被識別，但沒有包含儀表板要求的 scopes；請重新配對或核准要求的 scope contract，而不是輪替 shared gateway token。
- 在該重試路徑之外，連線驗證優先順序為明確的 shared token/password 優先，接著是明確的 `deviceToken`，再來是已儲存的裝置 token，最後是 bootstrap token。
- 在非同步 Tailscale Serve 控制 UI 路徑上，來自相同
  `{scope, ip}` 的失敗嘗試會在 failed-auth 限制器記錄它們之前被序列化，因此
  第二個並行的不良重試可能已經顯示 `retry later`。
- 如需 token 漂移修復步驟，請遵循 [Token 漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。
- 從 gateway 主機擷取或提供 shared secret：
  - Token：`openclaw config get gateway.auth.token`
  - Password：解析設定的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的 token：解析外部 secret provider，或在此 shell 中匯出
    `OPENCLAW_GATEWAY_TOKEN`，然後重新執行 `openclaw dashboard`
  - 未設定 shared secret：`openclaw doctor --generate-gateway-token`
- 在儀表板設定中，將 token 或 password 貼到驗證欄位，
  然後連線。
- UI 語言選擇器位於 **Overview -> Gateway Access -> Language**。
  它是存取卡片的一部分，不在 Appearance 區段中。

## 相關

- [控制 UI](/zh-TW/web/control-ui)
- [WebChat](/zh-TW/web/webchat)
