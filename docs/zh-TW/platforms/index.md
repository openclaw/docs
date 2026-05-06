---
read_when:
    - 尋找作業系統支援或安裝路徑
    - 決定要在哪裡執行 Gateway
summary: 平台支援概覽（Gateway + 配套應用程式）
title: 平台
x-i18n:
    generated_at: "2026-05-06T02:52:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 核心以 TypeScript 撰寫。**Node 是建議的執行環境**。
不建議將 Bun 用於 Gateway，因為 WhatsApp 和
Telegram 頻道存在已知問題；詳情請參閱 [Bun（實驗性）](/zh-TW/install/bun)。

macOS（選單列 App）和行動 Node（iOS/Android）已有 companion app。Windows 和
Linux companion app 已在規劃中，但 Gateway 目前已完整支援。
Windows 的原生 companion app 也已在規劃中；建議透過 WSL2 使用 Gateway。

## 選擇你的作業系統

- macOS：[macOS](/zh-TW/platforms/macos)
- iOS：[iOS](/zh-TW/platforms/ios)
- Android：[Android](/zh-TW/platforms/android)
- Windows：[Windows](/zh-TW/platforms/windows)
- Linux：[Linux](/zh-TW/platforms/linux)

## VPS 與託管

- VPS 中樞：[VPS 託管](/zh-TW/vps)
- Fly.io：[Fly.io](/zh-TW/install/fly)
- Hetzner（Docker）：[Hetzner](/zh-TW/install/hetzner)
- GCP（Compute Engine）：[GCP](/zh-TW/install/gcp)
- Azure（Linux VM）：[Azure](/zh-TW/install/azure)
- exe.dev（VM + HTTPS Proxy）：[exe.dev](/zh-TW/install/exe-dev)

## 常用連結

- 安裝指南：[Getting Started](/zh-TW/start/getting-started)
- Gateway 作業手冊：[Gateway](/zh-TW/gateway)
- Gateway 設定：[Configuration](/zh-TW/gateway/configuration)
- 服務狀態：`openclaw gateway status`

## Gateway 服務安裝（CLI）

使用以下任一方式（皆受支援）：

- 精靈（建議）：`openclaw onboard --install-daemon`
- 直接安裝：`openclaw gateway install`
- 設定流程：`openclaw configure` → 選取 **Gateway service**
- 修復/遷移：`openclaw doctor`（會提議安裝或修復服務）

服務目標取決於作業系統：

- macOS：LaunchAgent（`ai.openclaw.gateway` 或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*`）
- Linux/WSL2：systemd 使用者服務（`openclaw-gateway[-<profile>].service`）
- 原生 Windows：Scheduled Task（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），若工作建立遭拒，則退回使用每位使用者 Startup 資料夾登入項目

## 相關

- [安裝概覽](/zh-TW/install)
- [macOS App](/zh-TW/platforms/macos)
- [iOS App](/zh-TW/platforms/ios)
