---
read_when:
    - 你需要網路架構與安全性概覽
    - 你正在偵錯本機與 tailnet 存取或配對
    - 你想要網路相關文件的權威清單
summary: 網路中樞：Gateway 介面、配對、探索與安全性
title: 網路
x-i18n:
    generated_at: "2026-04-30T03:17:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 16
---

# 網路中心

此中心連結 OpenClaw 如何跨 localhost、LAN 與 tailnet 連線、配對及保護裝置的核心文件。

## 核心模型

多數操作都經由 Gateway（`openclaw gateway`）流動，這是一個單一長時間執行的程序，負責通道連線與 WebSocket 控制平面。

- **Loopback 優先**：Gateway WS 預設為 `ws://127.0.0.1:18789`。
  非 loopback 繫結需要有效的 Gateway 驗證路徑：共享密鑰
  token/password 驗證，或正確設定的非 loopback
  `trusted-proxy` 部署。
- 建議**每台主機一個 Gateway**。若需要隔離，請使用隔離的設定檔與連接埠執行多個 Gateway（[多個 Gateway](/zh-TW/gateway/multiple-gateways)）。
- **Canvas 主機**與 Gateway 使用相同連接埠提供服務（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），在繫結到 loopback 之外時受 Gateway 驗證保護。
- **遠端存取**通常使用 SSH tunnel 或 Tailscale VPN（[遠端存取](/zh-TW/gateway/remote)）。

主要參考資料：

- [Gateway 架構](/zh-TW/concepts/architecture)
- [Gateway 協定](/zh-TW/gateway/protocol)
- [Gateway runbook](/zh-TW/gateway)
- [Web 介面 + 繫結模式](/zh-TW/web)

## 配對 + 身分識別

- [配對概觀（DM + 節點）](/zh-TW/channels/pairing)
- [Gateway 擁有的節點配對](/zh-TW/gateway/pairing)
- [裝置 CLI（配對 + token 輪替）](/zh-TW/cli/devices)
- [配對 CLI（DM 核准）](/zh-TW/cli/pairing)

本機信任：

- 直接 local loopback 連線可以自動核准配對，以維持同主機 UX 順暢。
- OpenClaw 也有一條狹窄的後端/container-local 自我連線路徑，用於可信任的共享密鑰輔助流程。
- Tailnet 與 LAN 用戶端，包括同主機 tailnet 繫結，仍需要明確配對核准。

## 探索 + 傳輸

- [探索與傳輸](/zh-TW/gateway/discovery)
- [Bonjour / mDNS](/zh-TW/gateway/bonjour)
- [遠端存取（SSH）](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)

## 節點 + 傳輸

- [節點概觀](/zh-TW/nodes)
- [橋接協定（舊版節點，歷史）](/zh-TW/gateway/bridge-protocol)
- [節點 runbook：iOS](/zh-TW/platforms/ios)
- [節點 runbook：Android](/zh-TW/platforms/android)

## 安全性

- [安全性概觀](/zh-TW/gateway/security)
- [Gateway 設定參考](/zh-TW/gateway/configuration)
- [疑難排解](/zh-TW/gateway/troubleshooting)
- [Doctor](/zh-TW/gateway/doctor)

## 相關

- [Gateway 網路模型](/zh-TW/gateway/network-model)
- [遠端存取](/zh-TW/gateway/remote)
