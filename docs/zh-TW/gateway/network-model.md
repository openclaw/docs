---
read_when:
    - 你想要簡明了解 Gateway 網路模型
summary: Gateway、Node 與畫布主機如何連線。
title: 網路模型
x-i18n:
    generated_at: "2026-04-30T03:07:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 16
---

> 此內容已合併至 [Network](/zh-TW/network#core-model)。請參閱該頁面的目前指南。

大多數作業都會流經 Gateway (`openclaw gateway`)，這是一個長時間執行的單一
程序，負責管理頻道連線和 WebSocket 控制平面。

## 核心規則

- 建議每台主機使用一個 Gateway。它是唯一允許擁有 WhatsApp Web 工作階段的程序。若需救援機器人或嚴格隔離，請使用隔離的設定檔和連接埠執行多個 Gateway。請參閱 [多個 Gateway](/zh-TW/gateway/multiple-gateways)。
- 優先使用迴送：Gateway WS 預設為 `ws://127.0.0.1:18789`。精靈預設會建立 shared-secret 驗證，而且通常會產生權杖，即使是迴送也一樣。若要進行非迴送存取，請使用有效的 Gateway 驗證路徑：shared-secret 權杖/密碼驗證，或正確設定的非迴送 `trusted-proxy` 部署。Tailnet/行動裝置設定通常最適合透過 Tailscale Serve 或其他 `wss://` 端點運作，而不是原始 tailnet `ws://`。
- Node 會視需要透過 LAN、tailnet 或 SSH 連線到 Gateway WS。
  舊版 TCP 橋接已移除。
- Canvas 主機由 Gateway HTTP 伺服器在與 Gateway **相同的連接埠**上提供服務（預設 `18789`）：
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    當已設定 `gateway.auth` 且 Gateway 綁定到迴送以外的位址時，這些路由會受到 Gateway 驗證保護。Node 用戶端會使用與其作用中 WS 工作階段繫結、具 Node 範圍的功能 URL。請參閱 [Gateway 設定](/zh-TW/gateway/configuration)（`canvasHost`、`gateway`）。
- 遠端使用通常透過 SSH 通道或 tailnet VPN。請參閱 [遠端存取](/zh-TW/gateway/remote) 和 [探索](/zh-TW/gateway/discovery)。

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)
- [Gateway 通訊協定](/zh-TW/gateway/protocol)
