---
read_when:
    - 變更儀表板的身分驗證或公開模式
summary: Gateway 儀表板（控制介面）的存取與身分驗證
title: 儀表板
x-i18n:
    generated_at: "2026-05-05T01:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 儀表板是預設由 `/` 提供的瀏覽器版控制 UI
（可用 `gateway.controlUi.basePath` 覆寫）。

快速開啟（本機 Gateway）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 時，請使用 `https://127.0.0.1:18789/`，並將
  `wss://127.0.0.1:18789` 作為 WebSocket 端點。

主要參考：

- [控制 UI](/zh-TW/web/control-ui)：使用方式與 UI 功能。
- [Tailscale](/zh-TW/gateway/tailscale)：Serve/Funnel 自動化。
- [Web 介面](/zh-TW/web)：綁定模式與安全性注意事項。

驗證會透過已設定的 gateway
驗證路徑，在 WebSocket 握手時強制執行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- `gateway.auth.mode: "trusted-proxy"` 時的 trusted-proxy 身分標頭

請參閱 [Gateway 設定](/zh-TW/gateway/configuration)中的 `gateway.auth`。

安全性注意事項：控制 UI 是**管理介面**（聊天、設定、exec 核准）。
請勿公開曝露。UI 會針對目前瀏覽器分頁工作階段與所選 gateway URL，將儀表板 URL token 保存在 sessionStorage，
並在載入後從 URL 中移除它們。
建議使用 localhost、Tailscale Serve 或 SSH 通道。

## 快速路徑（建議）

- 完成 onboarding 後，CLI 會自動開啟儀表板，並印出乾淨的（未 token 化）連結。
- 隨時重新開啟：`openclaw dashboard`（複製連結，可能時開啟瀏覽器，若為 headless 則顯示 SSH 提示）。
- 如果剪貼簿與瀏覽器傳遞都失敗，`openclaw dashboard` 仍會印出
  乾淨的 URL，並告訴你使用 `OPENCLAW_GATEWAY_TOKEN` 或
  `gateway.auth.token` 中的 token 作為 URL fragment key `token`；它不會在日誌中印出 token
  值。
- 如果 UI 提示 shared-secret 驗證，請將已設定的 token 或
  password 貼到控制 UI 設定中。

## 驗證基礎（本機與遠端）

- **Localhost**：開啟 `http://127.0.0.1:18789/`。
- **Gateway TLS**：當 `gateway.tls.enabled: true` 時，儀表板/狀態連結會使用
  `https://`，控制 UI WebSocket 連結會使用 `wss://`。
- **Shared-secret token 來源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可透過 URL fragment 傳遞它
  以進行一次性 bootstrap，而控制 UI 會針對目前瀏覽器分頁工作階段與所選 gateway URL，將其保存在 sessionStorage，
  而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  會依設計印出/複製/開啟未 token 化的 URL。這可避免將
  外部管理的 token 暴露在 shell 日誌、剪貼簿歷史或瀏覽器啟動
  引數中。
- 如果 `gateway.auth.token` 設定為 SecretRef，且在你
  目前的 shell 中未解析，`openclaw dashboard` 仍會印出未 token 化的 URL，以及
  可執行的驗證設定指引。
- **Shared-secret password**：使用已設定的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。儀表板不會在重新載入後保留 password。
- **帶有身分的模式**：當 `gateway.auth.allowTailscale: true` 時，Tailscale Serve 可透過身分標頭滿足控制 UI/WebSocket
  驗證，而具備身分感知能力的非 loopback 反向代理可滿足
  `gateway.auth.mode: "trusted-proxy"`。在這些模式中，儀表板不需要
  貼上的 shared secret 即可使用 WebSocket。
- **非 localhost**：使用 Tailscale Serve、非 loopback shared-secret 綁定、
  具備身分感知能力且使用
  `gateway.auth.mode: "trusted-proxy"` 的非 loopback 反向代理，或 SSH 通道。HTTP API 仍會使用
  shared-secret 驗證，除非你刻意執行 private-ingress
  `gateway.auth.mode: "none"` 或 trusted-proxy HTTP 驗證。請參閱
  [Web 介面](/zh-TW/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到「unauthorized」/ 1008

- 確認 gateway 可連線（本機：`openclaw status`；遠端：SSH 通道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`）。
- 對於 `AUTH_TOKEN_MISMATCH`，當 gateway 回傳重試提示時，client 可以使用快取的裝置 token 進行一次受信任重試。該快取 token 重試會重用 token 的快取已核准 scope；明確 `deviceToken` / 明確 `scopes` 的呼叫者會保留其請求的 scope 集合。如果該次重試後驗證仍失敗，請手動解決 token 漂移。
- 在該重試路徑之外，連線驗證優先順序為先使用明確 shared token/password，接著是明確 `deviceToken`，再來是已儲存的裝置 token，最後是 bootstrap token。
- 在非同步 Tailscale Serve 控制 UI 路徑上，相同
  `{scope, ip}` 的失敗嘗試會在 failed-auth limiter 記錄之前被序列化，因此
  第二個並行的不良重試可能已經顯示 `retry later`。
- 如需 token 漂移修復步驟，請依照 [Token 漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。
- 從 gateway 主機擷取或提供 shared secret：
  - Token：`openclaw config get gateway.auth.token`
  - Password：解析已設定的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的 token：解析外部 secret provider，或在此 shell 中匯出
    `OPENCLAW_GATEWAY_TOKEN`，然後重新執行 `openclaw dashboard`
  - 未設定 shared secret：`openclaw doctor --generate-gateway-token`
- 在儀表板設定中，將 token 或 password 貼到驗證欄位，
  然後連線。
- UI 語言選擇器位於 **Overview -> Gateway Access -> Language**。
  它是存取卡片的一部分，不是 Appearance 區段。

## 相關

- [控制 UI](/zh-TW/web/control-ui)
- [WebChat](/zh-TW/web/webchat)
