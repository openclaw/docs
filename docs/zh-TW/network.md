---
read_when:
    - 您需要網路架構與安全性概覽
    - 你正在偵錯本機與 tailnet 存取或配對問題
    - 你想查看網路文件的正式清單
summary: 網路中樞：閘道介面、配對、探索與安全性
title: 網路
x-i18n:
    generated_at: "2026-07-11T21:30:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

此樞紐頁面連結 OpenClaw 如何在 localhost、區域網路與 tailnet 之間連線、配對及保護裝置的核心文件。

## 核心模型

大多數操作都會經由閘道（`openclaw gateway`）；這是單一的長時間執行程序，負責管理頻道連線與 WebSocket 控制平面。

- **優先使用回送介面**：閘道 WS 預設為 `ws://127.0.0.1:18789`。
  若沒有有效的閘道驗證路徑，非回送介面繫結將拒絕啟動：
  共用密鑰權杖／密碼驗證，或正確設定的非回送介面
  `trusted-proxy` 部署。
- 建議**每台主機使用一個閘道**。若要隔離，請使用彼此隔離的設定檔與連接埠來執行多個閘道（[多個閘道](/zh-TW/gateway/multiple-gateways)）。
- **Canvas 主機**透過與閘道相同的連接埠提供服務（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`）；繫結範圍超出回送介面時，會受到閘道驗證保護。
- **遠端存取**通常使用 SSH 通道或 Tailscale VPN（[遠端存取](/zh-TW/gateway/remote)）。

重要參考資料：

- [閘道架構](/zh-TW/concepts/architecture)
- [閘道通訊協定](/zh-TW/gateway/protocol)
- [閘道操作手冊](/zh-TW/gateway)
- [Web 介面與繫結模式](/zh-TW/web)

## 配對與身分

- [配對概觀（私訊與節點）](/zh-TW/channels/pairing)
- [由閘道管理的節點配對](/zh-TW/gateway/pairing)
- [裝置命令列介面（配對與權杖輪替）](/zh-TW/cli/devices)
- [配對命令列介面（私訊核准）](/zh-TW/cli/pairing)

本機信任：

- 直接的本機 local loopback 連線（不含轉送／Proxy 標頭）可自動核准配對，以維持同一主機上的流暢使用體驗。
- OpenClaw 也為受信任的共用密鑰輔助流程提供範圍受限的後端／容器本機自我連線路徑。
- Tailnet 與區域網路用戶端（包括同一主機上的 tailnet 繫結）仍需明確核准配對。

## 探索與傳輸方式

- [探索與傳輸方式](/zh-TW/gateway/discovery)
- [Bonjour／mDNS](/zh-TW/gateway/bonjour)
- [遠端存取（SSH）](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)

## 節點與傳輸方式

- [節點概觀](/zh-TW/nodes)
- [橋接通訊協定（舊版節點，歷史資料）](/zh-TW/gateway/bridge-protocol)
- [節點操作手冊：iOS](/zh-TW/platforms/ios)
- [節點操作手冊：Android](/zh-TW/platforms/android)

## 安全性

- [安全性概觀](/zh-TW/gateway/security)
- [閘道設定參考](/zh-TW/gateway/configuration)
- [疑難排解](/zh-TW/gateway/troubleshooting)
- [診斷工具](/zh-TW/gateway/doctor)

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [遠端存取](/zh-TW/gateway/remote)
