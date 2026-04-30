---
read_when:
    - 變更儀表板的身分驗證或公開模式
summary: Gateway 儀表板（控制 UI）存取與身分驗證
title: 儀表板
x-i18n:
    generated_at: "2026-04-30T03:49:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 儀表板是預設由 `/` 提供服務的瀏覽器控制 UI
（可用 `gateway.controlUi.basePath` 覆寫）。

快速開啟（本機 Gateway）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 時，請使用 `https://127.0.0.1:18789/`，並將
  `wss://127.0.0.1:18789` 作為 WebSocket 端點。

重要參考：

- [控制 UI](/zh-TW/web/control-ui)：了解用法與 UI 功能。
- [Tailscale](/zh-TW/gateway/tailscale)：了解 Serve/Funnel 自動化。
- [Web 介面](/zh-TW/web)：了解繫結模式與安全性注意事項。

驗證會透過已設定的 gateway 驗證路徑，在 WebSocket 握手時強制執行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時，使用 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時，使用受信任 Proxy 身分標頭

請參閱 [Gateway 設定](/zh-TW/gateway/configuration)中的 `gateway.auth`。

安全性注意事項：控制 UI 是**管理介面**（聊天、設定、執行核准）。
請勿將其公開暴露。UI 會將儀表板 URL 權杖保存在目前瀏覽器分頁工作階段與所選 gateway URL 的 sessionStorage 中，並在載入後從 URL 移除。
建議使用 localhost、Tailscale Serve 或 SSH 通道。

## 快速路徑（建議）

- 完成 onboarding 後，CLI 會自動開啟儀表板，並列印乾淨的（不含權杖）連結。
- 隨時重新開啟：`openclaw dashboard`（複製連結、可行時開啟瀏覽器、在 headless 時顯示 SSH 提示）。
- 如果 UI 提示進行共用密鑰驗證，請將已設定的權杖或
  密碼貼到控制 UI 設定中。

## 驗證基礎（本機與遠端）

- **Localhost**：開啟 `http://127.0.0.1:18789/`。
- **Gateway TLS**：當 `gateway.tls.enabled: true` 時，儀表板/狀態連結會使用
  `https://`，控制 UI WebSocket 連結會使用 `wss://`。
- **共用密鑰權杖來源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可透過 URL fragment 傳遞它以進行一次性 bootstrap，而控制 UI 會將它保存在目前瀏覽器分頁工作階段與所選 gateway URL 的 sessionStorage 中，而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  會依設計列印/複製/開啟不含權杖的 URL。這會避免在 shell 記錄、剪貼簿歷史或瀏覽器啟動引數中暴露外部管理的權杖。
- 如果 `gateway.auth.token` 設定為 SecretRef，且在你目前的
  shell 中尚未解析，`openclaw dashboard` 仍會列印不含權杖的 URL，以及可執行的驗證設定指引。
- **共用密鑰密碼**：使用已設定的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。儀表板不會在重新載入之間保留密碼。
- **帶有身分的模式**：當 `gateway.auth.allowTailscale: true` 時，Tailscale Serve 可透過身分標頭滿足控制 UI/WebSocket 驗證；非 local loopback、具身分感知能力的反向 Proxy 可滿足
  `gateway.auth.mode: "trusted-proxy"`。在這些模式中，儀表板不需要為 WebSocket 貼上共用密鑰。
- **非 localhost**：使用 Tailscale Serve、非 local loopback 的共用密鑰繫結、
  非 local loopback 且具身分感知能力的反向 Proxy 搭配
  `gateway.auth.mode: "trusted-proxy"`，或 SSH 通道。HTTP API 仍會使用
  共用密鑰驗證，除非你有意執行私人 ingress
  `gateway.auth.mode: "none"` 或 trusted-proxy HTTP 驗證。請參閱
  [Web 介面](/zh-TW/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 "unauthorized" / 1008

- 確認 gateway 可以連線（本機：`openclaw status`；遠端：SSH 通道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`）。
- 對於 `AUTH_TOKEN_MISMATCH`，當 gateway 傳回重試提示時，客戶端可使用快取的裝置權杖進行一次受信任重試。該快取權杖重試會重用此權杖快取的已核准範圍；明確的 `deviceToken` / 明確的 `scopes` 呼叫端會保留其要求的範圍集合。如果該次重試後驗證仍失敗，請手動解決權杖漂移。
- 在該重試路徑之外，連線驗證優先順序為：明確的共用權杖/密碼優先，其次是明確的 `deviceToken`，再來是已儲存的裝置權杖，最後是 bootstrap 權杖。
- 在非同步 Tailscale Serve 控制 UI 路徑上，同一個
  `{scope, ip}` 的失敗嘗試會在失敗驗證限制器記錄它們之前被序列化，因此
  第二個並行的錯誤重試可能已經顯示 `retry later`。
- 如需權杖漂移修復步驟，請依照[權杖漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。
- 從 gateway 主機擷取或提供共用密鑰：
  - 權杖：`openclaw config get gateway.auth.token`
  - 密碼：解析已設定的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的權杖：解析外部密鑰提供者，或在此 shell 中匯出
    `OPENCLAW_GATEWAY_TOKEN`，然後重新執行 `openclaw dashboard`
  - 未設定共用密鑰：`openclaw doctor --generate-gateway-token`
- 在儀表板設定中，將權杖或密碼貼到驗證欄位，
  然後連線。
- UI 語言選擇器位於 **Overview -> Gateway Access -> Language**。
  它是存取卡的一部分，不在 Appearance 區段中。

## 相關

- [控制 UI](/zh-TW/web/control-ui)
- [WebChat](/zh-TW/web/webchat)
