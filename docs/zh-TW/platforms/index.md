---
read_when:
    - 尋找作業系統支援或安裝路徑
    - 決定在哪裡執行 Gateway
summary: 平台支援概覽（Gateway + 配套應用程式）
title: 平台
x-i18n:
    generated_at: "2026-04-30T03:19:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 核心以 TypeScript 撰寫。**Node 是建議的執行階段**。
不建議將 Bun 用於 Gateway：WhatsApp 與
Telegram 頻道有已知問題；詳情請參閱 [Bun（實驗性）](/zh-TW/install/bun)。

macOS（選單列應用程式）與行動節點（iOS/Android）有配套應用程式。Windows 與
Linux 配套應用程式已在規劃中，但 Gateway 目前已完整支援。
Windows 的原生配套應用程式也已在規劃中；建議透過 WSL2 使用 Gateway。

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
- exe.dev（VM + HTTPS proxy）：[exe.dev](/zh-TW/install/exe-dev)

## 常用連結

- 安裝指南：[快速入門](/zh-TW/start/getting-started)
- Gateway 作業手冊：[Gateway](/zh-TW/gateway)
- Gateway 設定：[設定](/zh-TW/gateway/configuration)
- 服務狀態：`openclaw gateway status`

## Gateway 服務安裝（CLI）

使用以下任一方式（全都支援）：

- 精靈（建議）：`openclaw onboard --install-daemon`
- 直接安裝：`openclaw gateway install`
- 設定流程：`openclaw configure` → 選取 **Gateway 服務**
- 修復/遷移：`openclaw doctor`（會提供安裝或修復服務的選項）

服務目標取決於作業系統：

- macOS：LaunchAgent（`ai.openclaw.gateway` 或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*`）
- Linux/WSL2：systemd 使用者服務（`openclaw-gateway[-<profile>].service`）
- 原生 Windows：Scheduled Task（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），若工作建立遭拒，則退回使用每位使用者的 Startup 資料夾登入項目

## 相關

- [安裝概覽](/zh-TW/install)
- [macOS 應用程式](/zh-TW/platforms/macos)
- [iOS 應用程式](/zh-TW/platforms/ios)
