---
read_when:
    - 您需要網路架構與安全性概覽
    - 你正在偵錯本機與 Tailscale 網路存取或配對問題
    - 你需要網路相關文件的權威清單
summary: 網路樞紐：Gateway 介面、配對、探索與安全性
title: 網路
x-i18n:
    generated_at: "2026-05-06T09:12:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

此中心連結 OpenClaw 如何連線、配對，以及在 localhost、LAN 與 tailnet 之間保護裝置安全的核心文件。

## 核心模型

大多數操作都會流經 Gateway（`openclaw gateway`），這是一個長時間執行的單一程序，負責通道連線與 WebSocket 控制平面。

- **優先使用 Loopback**：Gateway WS 預設為 `ws://127.0.0.1:18789`。
  非 loopback 繫結需要有效的 gateway 驗證路徑：shared-secret
  token/password 驗證，或正確設定的非 loopback
  `trusted-proxy` 部署。
- 建議每台主機使用 **一個 Gateway**。若需要隔離，請使用隔離的設定檔與連接埠執行多個 gateway（[多個 Gateway](/zh-TW/gateway/multiple-gateways)）。
- **Canvas 主機**會在與 Gateway 相同的連接埠提供服務（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），在繫結超出 loopback 範圍時由 Gateway 驗證保護。
- **遠端存取**通常使用 SSH tunnel 或 Tailscale VPN（[遠端存取](/zh-TW/gateway/remote)）。

主要參考：

- [Gateway 架構](/zh-TW/concepts/architecture)
- [Gateway 協定](/zh-TW/gateway/protocol)
- [Gateway 執行手冊](/zh-TW/gateway)
- [Web 介面 + 繫結模式](/zh-TW/web)

## 配對 + 身分

- [配對概覽（DM + Node）](/zh-TW/channels/pairing)
- [Gateway 擁有的 Node 配對](/zh-TW/gateway/pairing)
- [裝置 CLI（配對 + token 輪換）](/zh-TW/cli/devices)
- [配對 CLI（DM 核准）](/zh-TW/cli/pairing)

本機信任：

- 直接的 local loopback 連線可以自動核准配對，以維持同主機使用體驗順暢。
- OpenClaw 也有一條範圍很窄的 backend/container-local 自我連線路徑，用於受信任的 shared-secret 輔助流程。
- Tailnet 與 LAN 用戶端，包括同主機 tailnet 繫結，仍需要明確的配對核准。

## 探索 + 傳輸

- [探索與傳輸](/zh-TW/gateway/discovery)
- [Bonjour / mDNS](/zh-TW/gateway/bonjour)
- [遠端存取（SSH）](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)

## Node + 傳輸

- [Node 概覽](/zh-TW/nodes)
- [Bridge 協定（舊版 Node，歷史資訊）](/zh-TW/gateway/bridge-protocol)
- [Node 執行手冊：iOS](/zh-TW/platforms/ios)
- [Node 執行手冊：Android](/zh-TW/platforms/android)

## 安全性

- [安全性概覽](/zh-TW/gateway/security)
- [Gateway 設定參考](/zh-TW/gateway/configuration)
- [疑難排解](/zh-TW/gateway/troubleshooting)
- [Doctor](/zh-TW/gateway/doctor)

## 相關

- [Gateway 執行手冊](/zh-TW/gateway)
- [遠端存取](/zh-TW/gateway/remote)
