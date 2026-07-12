---
read_when:
    - 變更儀表板驗證或公開模式
summary: 閘道儀表板（控制介面）存取與驗證
title: 儀表板
x-i18n:
    generated_at: "2026-07-12T14:52:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

閘道儀表板是預設由 `/` 提供的瀏覽器控制介面（可使用 `gateway.controlUi.basePath` 覆寫）。

快速開啟（本機閘道）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 時，請使用 `https://127.0.0.1:18789/`，WebSocket 端點則使用 `wss://127.0.0.1:18789`。

主要參考資料：

- [控制介面](/zh-TW/web/control-ui)：瞭解使用方式與介面功能。
- [Tailscale](/zh-TW/gateway/tailscale)：瞭解 Serve/Funnel 自動化。
- [Web 介面](/zh-TW/web)：瞭解繫結模式與安全性注意事項。

系統會在 WebSocket 交握期間，透過已設定的閘道驗證路徑強制執行驗證：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 當 `gateway.auth.allowTailscale: true` 時，使用 Tailscale Serve 身分標頭
- 當 `gateway.auth.mode: "trusted-proxy"` 時，使用受信任 Proxy 身分標頭

請參閱[閘道設定](/zh-TW/gateway/configuration)中的 `gateway.auth`。

<Warning>
控制介面是**管理介面**（聊天、設定、執行核准）。請勿將其公開暴露。介面會依目前的瀏覽器分頁與所選閘道 URL，將儀表板 URL 權杖保留在 sessionStorage 中，並在載入後從 URL 移除權杖。建議使用 localhost、Tailscale Serve 或 SSH 通道。
</Warning>

## 快速方式（建議）

- 完成初始設定後，命令列介面會自動開啟儀表板，並輸出不含權杖的簡潔連結。
- 隨時重新開啟：`openclaw dashboard`（複製連結、可行時開啟瀏覽器，若為無頭環境則輸出 SSH 提示）。
- 如果剪貼簿與瀏覽器傳遞都失敗，`openclaw dashboard` 仍會輸出簡潔 URL，並指示你將權杖（來自 `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.token`）以 URL 片段鍵 `token` 附加；它絕不會在記錄中輸出權杖值。
- 如果介面提示輸入共用密鑰驗證，請將已設定的權杖或密碼貼到控制介面設定中。

## 驗證基本概念（本機與遠端）

- **Localhost**：開啟 `http://127.0.0.1:18789/`。
- **閘道 TLS**：當 `gateway.tls.enabled: true` 時，儀表板／狀態連結使用 `https://`，控制介面的 WebSocket 連結則使用 `wss://`。
- **共用密鑰權杖來源**：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` 可透過 URL 片段傳遞權杖，以進行一次性啟動；控制介面會依目前分頁與所選閘道 URL，將權杖保留在 sessionStorage，而非 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard` 會刻意輸出、複製及開啟不含權杖的 URL，避免在 Shell 記錄、剪貼簿歷程或瀏覽器啟動引數中暴露由外部管理的權杖。如果目前 Shell 中的參照尚未解析，它仍會輸出不含權杖的 URL，並提供可採取行動的驗證設定指引。
- **共用密鑰密碼**：使用已設定的 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。儀表板不會在重新載入後保留密碼。
- **帶有身分的模式**：當 `gateway.auth.allowTailscale: true` 時，Tailscale Serve 會透過身分標頭滿足控制介面／WebSocket 驗證；非 Loopback 且可辨識身分的反向 Proxy 則會滿足 `gateway.auth.mode: "trusted-proxy"`。兩者的 WebSocket 都不需要貼上共用密鑰。
- **非 localhost**：請使用 Tailscale Serve、非 Loopback 的共用密鑰繫結、設定了 `gateway.auth.mode: "trusted-proxy"` 的非 Loopback 身分感知反向 Proxy，或 SSH 通道。除非你刻意執行私有輸入的 `gateway.auth.mode: "none"` 或受信任 Proxy HTTP 驗證，否則 HTTP API 仍會使用共用密鑰驗證。請參閱 [Web 介面](/zh-TW/web)。

## 在 Telegram 中開啟

Telegram Bot 可使用 `/dashboard`，將儀表板開啟為 Telegram Mini App。

需求：

- `gateway.tailscale.mode: "serve"` 或 `"funnel"`，讓 Telegram 取得 HTTPS Mini App URL。
- Telegram 傳送者必須是 Bot 擁有者：即 `commands.ownerAllowFrom` 或所選帳號有效的 `channels.telegram.allowFrom` 中所列的數字 Telegram 使用者 ID。
- 在與 Bot 的私人訊息中執行 `/dashboard`。在群組中叫用時，只會提示你在私人訊息中開啟該命令，不會包含按鈕。
- Docker 安裝：Serve/Funnel 模式要求閘道在 `tailscaled` 旁繫結 Loopback，使用已發佈連接埠的橋接網路無法滿足此要求。請以 `network_mode: host` 執行閘道容器，並將主機的 `tailscaled` Socket（`/var/run/tailscale`）及 `tailscale` 命令列介面掛載至容器中。

Mini App 會執行一次性的擁有者移交，並使用短效啟動權杖重新導向至控制介面。它不會在 URL 中暴露共用閘道權杖。

v1 不涵蓋的目標：

- 不支援 Telegram Web iframe。
- Tailscale Serve/Funnel 是唯一支援的已發佈 URL 路徑。

<a id="if-you-see-unauthorized-1008"></a>

## 如果看到「unauthorized」/ 1008

- 確認閘道可連線：本機執行 `openclaw status`；遠端則建立 SSH 通道 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然後開啟 `http://127.0.0.1:18789/`。
- 對於 `AUTH_TOKEN_MISMATCH`，當閘道傳回重試提示時，用戶端可使用快取的裝置權杖進行一次受信任的重試；該次重試會沿用權杖中快取且已核准的範圍（明確指定 `deviceToken`／`scopes` 的呼叫端則保留其要求的範圍集合）。如果重試後驗證仍失敗，請手動解決權杖不一致問題。
- 對於 `AUTH_SCOPE_MISMATCH`，表示裝置權杖已被識別，但不具備要求的範圍；請重新配對或核准新的範圍集合，而非輪替共用閘道權杖。
- 在該重試路徑之外，連線驗證優先順序為：明確指定的共用權杖／密碼、明確指定的 `deviceToken`、已儲存的裝置權杖，最後是啟動權杖。
- 在非同步 Tailscale Serve 路徑上，相同 `{scope, ip}` 的失敗嘗試會在失敗驗證限制器記錄前依序處理，因此第二個同時發生的錯誤重試可能已顯示 `retry later`。
- 如需修復權杖不一致的步驟，請參閱[權杖不一致復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。
- 從閘道主機取得或提供共用密鑰：
  - 權杖：`openclaw config get gateway.auth.token`
  - 密碼：解析已設定的 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的權杖：解析外部密鑰提供者，或在此 Shell 中匯出 `OPENCLAW_GATEWAY_TOKEN`，然後重新執行 `openclaw dashboard`
  - 未設定共用密鑰：`openclaw doctor --generate-gateway-token`
- 在儀表板設定中，將權杖或密碼貼到驗證欄位，然後連線。
- 介面語言選擇器位於 **Settings -> General -> Language**，而非 Appearance 下方。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [WebChat](/zh-TW/web/webchat)
