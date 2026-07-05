---
read_when:
    - 你需要網路架構與安全性概覽
    - 你正在偵錯本機與 tailnet 存取或配對
    - 你想要網路文件的標準清單
summary: 網路中樞：閘道介面、配對、探索與安全性
title: 網路
x-i18n:
    generated_at: "2026-07-05T11:27:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

此中心連結 OpenClaw 如何在 localhost、LAN 與 tailnet 之間連線、配對及保護裝置的核心文件。

## 核心模型

大多數操作都會流經閘道（`openclaw gateway`），這是一個單一的長時間執行程序，負責通道連線與 WebSocket 控制平面。

- **優先使用 Loopback**：閘道 WS 預設為 `ws://127.0.0.1:18789`。
  非 loopback 繫結若沒有有效的閘道驗證路徑，將拒絕啟動：
  共享密鑰 token/密碼驗證，或正確設定的非 loopback
  `trusted-proxy` 部署。
- **建議每台主機一個閘道**。若需隔離，請使用隔離的設定檔與連接埠執行多個閘道（[多個閘道](/zh-TW/gateway/multiple-gateways)）。
- **Canvas 主機**會在與閘道相同的連接埠上提供服務（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），在繫結到 loopback 以外時受閘道驗證保護。
- **遠端存取**通常是 SSH 通道或 Tailscale VPN（[遠端存取](/zh-TW/gateway/remote)）。

重要參考：

- [閘道架構](/zh-TW/concepts/architecture)
- [閘道協定](/zh-TW/gateway/protocol)
- [閘道執行手冊](/zh-TW/gateway)
- [Web 介面 + 繫結模式](/zh-TW/web)

## 配對 + 身分

- [配對概覽（DM + 節點）](/zh-TW/channels/pairing)
- [閘道擁有的節點配對](/zh-TW/gateway/pairing)
- [裝置命令列介面（配對 + token 輪換）](/zh-TW/cli/devices)
- [配對命令列介面（DM 核准）](/zh-TW/cli/pairing)

本機信任：

- 直接 local loopback 連線（沒有轉送/proxy 標頭）可以自動核准配對，以維持同主機使用體驗順暢。
- OpenClaw 也有一條狹窄的後端/容器本機自我連線路徑，用於受信任的共享密鑰輔助流程。
- Tailnet 與 LAN 用戶端，包括同主機 tailnet 繫結，仍需要明確的配對核准。

## 探索 + 傳輸

- [探索與傳輸](/zh-TW/gateway/discovery)
- [Bonjour / mDNS](/zh-TW/gateway/bonjour)
- [遠端存取（SSH）](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)

## 節點 + 傳輸

- [節點概覽](/zh-TW/nodes)
- [橋接協定（舊版節點，歷史性）](/zh-TW/gateway/bridge-protocol)
- [節點執行手冊：iOS](/zh-TW/platforms/ios)
- [節點執行手冊：Android](/zh-TW/platforms/android)

## 安全性

- [安全性概覽](/zh-TW/gateway/security)
- [閘道設定參考](/zh-TW/gateway/configuration)
- [疑難排解](/zh-TW/gateway/troubleshooting)
- [Doctor](/zh-TW/gateway/doctor)

## 相關

- [閘道執行手冊](/zh-TW/gateway)
- [遠端存取](/zh-TW/gateway/remote)
