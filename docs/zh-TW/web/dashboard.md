---
read_when:
    - 變更儀表板驗證或公開模式
summary: 閘道儀表板（控制介面）存取與驗證
title: 儀表板
x-i18n:
    generated_at: "2026-07-05T11:53:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e60ae8273560295fa2670af8ba3a26eea5b07fe2f8b07813460850785305f0b
    source_path: web/dashboard.md
    workflow: 16
---

閘道儀表板是預設由 `/` 提供的瀏覽器控制介面（可用 `gateway.controlUi.basePath` 覆寫）。

快速開啟（本機閘道）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 時，WebSocket 端點請使用 `https://127.0.0.1:18789/` 和 `wss://127.0.0.1:18789`。

重要參考：

- [控制介面](/zh-TW/web/control-ui)：用法與介面功能。
- [Tailscale](/zh-TW/gateway/tailscale)：Serve/Funnel 自動化。
- [網頁介面](/zh-TW/web)：繫結模式與安全性注意事項。

驗證會透過已設定的閘道驗證路徑，在 WebSocket 交握時強制執行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時的 Tailscale Serve 身分標頭
- `gateway.auth.mode: "trusted-proxy"` 時的受信任 Proxy 身分標頭

請參閱 [閘道設定](/zh-TW/gateway/configuration)中的 `gateway.auth`。

<Warning>
控制介面是**管理介面**（聊天、設定、執行核准）。請勿公開暴露。介面會將儀表板 URL Token 保存在目前瀏覽器分頁與所選閘道 URL 的 sessionStorage 中，並在載入後從 URL 移除。建議使用 localhost、Tailscale Serve 或 SSH 通道。
</Warning>

## 快速路徑（建議）

- 完成 onboarding 後，命令列介面會自動開啟儀表板，並印出乾淨（不含 Token）的連結。
- 隨時重新開啟：`openclaw dashboard`（複製連結、可行時開啟瀏覽器，若為無頭環境則印出 SSH 提示）。
- 如果剪貼簿與瀏覽器傳遞都失敗，`openclaw dashboard` 仍會印出乾淨 URL，並告知你將 Token（來自 `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.token`）作為 URL 片段鍵 `token` 附加；它絕不會在記錄中印出 Token 值。
- 如果介面提示共享密鑰驗證，請將已設定的 Token 或密碼貼到控制介面設定中。

## 驗證基礎（本機 vs 遠端）

- **Localhost**：開啟 `http://127.0.0.1:18789/`。
- **閘道 TLS**：當 `gateway.tls.enabled: true` 時，儀表板/狀態連結會使用 `https://`，控制介面 WebSocket 連結會使用 `wss://`。
- **共享密鑰 Token 來源**：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` 可透過 URL 片段傳遞它以進行一次性 bootstrap；控制介面會將它保存在目前分頁與所選閘道 URL 的 sessionStorage 中，而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard` 依設計會印出/複製/開啟不含 Token 的 URL，以避免將外部管理的 Token 暴露在 Shell 記錄、剪貼簿歷史或瀏覽器啟動參數中。如果該參照在你目前的 Shell 中無法解析，它仍會印出不含 Token 的 URL，以及可執行的驗證設定指引。
- **共享密鑰密碼**：使用已設定的 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。儀表板不會在重新載入後保留密碼。
- **帶有身分的模式**：當 `gateway.auth.allowTailscale: true` 時，Tailscale Serve 會透過身分標頭滿足控制介面/WebSocket 驗證；具身分感知能力的非 loopback 反向 Proxy 會滿足 `gateway.auth.mode: "trusted-proxy"`。兩者都不需要為 WebSocket 貼上共享密鑰。
- **非 localhost**：使用 Tailscale Serve、非 loopback 共享密鑰繫結、搭配 `gateway.auth.mode: "trusted-proxy"` 的非 loopback 身分感知反向 Proxy，或 SSH 通道。HTTP API 仍會使用共享密鑰驗證，除非你刻意執行私人入口 `gateway.auth.mode: "none"` 或受信任 Proxy HTTP 驗證。請參閱[網頁介面](/zh-TW/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到「unauthorized」/ 1008

- 確認閘道可連線：本機執行 `openclaw status`；遠端則建立 SSH 通道 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然後開啟 `http://127.0.0.1:18789/`。
- 對於 `AUTH_TOKEN_MISMATCH`，當閘道傳回重試提示時，客戶端可以使用已快取的裝置 Token 進行一次受信任重試；該重試會重用 Token 的已快取核准範圍（明確的 `deviceToken`/`scopes` 呼叫端會保留其請求的範圍集合）。如果該次重試後驗證仍失敗，請手動解決 Token 漂移。
- 對於 `AUTH_SCOPE_MISMATCH`，裝置 Token 已被辨識，但不包含請求的範圍；請重新配對或核准新的範圍集合，而不是輪替共享閘道 Token。
- 在該重試路徑之外，連線驗證優先順序為：明確的共享 Token/密碼、明確的 `deviceToken`、已儲存的裝置 Token，然後是 bootstrap Token。
- 在非同步 Tailscale Serve 路徑上，相同 `{scope, ip}` 的失敗嘗試會先被序列化，才由驗證失敗限制器記錄，因此第二個同時發生的不良重試可能已經顯示 `retry later`。
- Token 漂移修復步驟請參閱 [Token 漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。
- 從閘道主機擷取或提供共享密鑰：
  - Token：`openclaw config get gateway.auth.token`
  - 密碼：解析已設定的 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的 Token：解析外部秘密提供者，或在此 Shell 中匯出 `OPENCLAW_GATEWAY_TOKEN` 並重新執行 `openclaw dashboard`
  - 未設定共享密鑰：`openclaw doctor --generate-gateway-token`
- 在儀表板設定中，將 Token 或密碼貼到驗證欄位，然後連線。
- 介面語言選擇器位於 **概覽 -> 閘道存取 -> 語言**，不在外觀底下。

## 相關

- [控制介面](/zh-TW/web/control-ui)
- [WebChat](/zh-TW/web/webchat)
