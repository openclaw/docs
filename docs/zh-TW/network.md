---
read_when:
    - 您需要網路架構與安全性概覽
    - 正在偵錯本機與 tailnet 存取或配對
    - 您想要網路相關文件的標準清單
summary: 網路樞紐：Gateway 介面、配對、探索與安全性
title: 網路
x-i18n:
    generated_at: "2026-05-06T02:52:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd4afc23d041df1734e730fe5f09eae529a07154d913f9434f7d413136783287
    source_path: network.md
    workflow: 16
---

# 網路中心

此中心連結 OpenClaw 如何在 localhost、LAN 和 tailnet 之間連線、配對及保護裝置的核心文件。

## 核心模型

大多數操作都會透過 Gateway（`openclaw gateway`）流動，這是一個單一的長時間執行程序，負責管理頻道連線與 WebSocket 控制平面。

- **優先使用 loopback**：Gateway WS 預設為 `ws://127.0.0.1:18789`。
  非 loopback 綁定需要有效的 Gateway 驗證路徑：共享密鑰
  token/password 驗證，或正確設定的非 loopback
  `trusted-proxy` 部署。
- **建議每部主機使用一個 Gateway**。若需要隔離，請使用隔離的設定檔與連接埠執行多個 Gateway（[多個 Gateway](/zh-TW/gateway/multiple-gateways)）。
- **Canvas 主機**會在與 Gateway 相同的連接埠上提供服務（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），在綁定超出 loopback 範圍時會受到 Gateway 驗證保護。
- **遠端存取**通常使用 SSH 通道或 Tailscale VPN（[遠端存取](/zh-TW/gateway/remote)）。

主要參考：

- [Gateway 架構](/zh-TW/concepts/architecture)
- [Gateway 通訊協定](/zh-TW/gateway/protocol)
- [Gateway 執行手冊](/zh-TW/gateway)
- [Web 介面 + 綁定模式](/zh-TW/web)

## 配對 + 身分識別

- [配對概覽（DM + 節點）](/zh-TW/channels/pairing)
- [Gateway 管理的節點配對](/zh-TW/gateway/pairing)
- [裝置 CLI（配對 + token 輪替）](/zh-TW/cli/devices)
- [配對 CLI（DM 核准）](/zh-TW/cli/pairing)

本機信任：

- 直接 local loopback 連線可自動核准配對，以維持同主機使用體驗順暢。
- OpenClaw 也有一條狹窄的後端／容器本機自我連線路徑，供受信任的共享密鑰輔助流程使用。
- Tailnet 和 LAN 用戶端，包括同主機 tailnet 綁定，仍需要明確的配對核准。

## 探索 + 傳輸

- [探索與傳輸](/zh-TW/gateway/discovery)
- [Bonjour / mDNS](/zh-TW/gateway/bonjour)
- [遠端存取（SSH）](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)

## 節點 + 傳輸

- [節點概覽](/zh-TW/nodes)
- [Bridge 通訊協定（舊版節點，歷史）](/zh-TW/gateway/bridge-protocol)
- [節點執行手冊：iOS](/zh-TW/platforms/ios)
- [節點執行手冊：Android](/zh-TW/platforms/android)

## 安全性

- [安全性概覽](/zh-TW/gateway/security)
- [Gateway 設定參考](/zh-TW/gateway/configuration)
- [疑難排解](/zh-TW/gateway/troubleshooting)
- [Doctor](/zh-TW/gateway/doctor)

## 相關

- [Gateway 網路模型](/zh-TW/network#core-model)
- [遠端存取](/zh-TW/gateway/remote)
