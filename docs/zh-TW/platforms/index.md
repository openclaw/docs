---
read_when:
    - 尋找作業系統支援或安裝路徑
    - 決定在哪裡執行閘道
summary: 平台支援概覽（閘道 + 配套應用程式）
title: 平台
x-i18n:
    generated_at: "2026-07-05T11:26:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 核心以 TypeScript 撰寫。**節點是建議的執行階段**。
不建議將 Bun 用於閘道 — WhatsApp 和 Telegram 頻道有已知問題；
詳情請參閱 [Bun（實驗性）](/zh-TW/install/bun)。

Windows Hub、macOS（選單列應用程式）和行動節點
（iOS/Android）都有配套應用程式。Linux 配套應用程式已在規劃中，但閘道目前已完全
支援。在 Windows 上，若要使用桌面應用程式，請選擇 Windows Hub；若偏好終端機優先使用，
請選擇原生 PowerShell 安裝；若需要最相容 Linux 的閘道執行階段，請選擇 WSL2。

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
- EasyRunner（Podman + Caddy）：[EasyRunner](/zh-TW/platforms/easyrunner)

## 常用連結

- 安裝指南：[開始使用](/zh-TW/start/getting-started)
- Windows Hub：[Windows](/zh-TW/platforms/windows)
- 閘道操作手冊：[閘道](/zh-TW/gateway)
- 閘道設定：[設定](/zh-TW/gateway/configuration)
- 服務狀態：`openclaw gateway status`

## 閘道服務安裝（命令列介面）

使用以下任一方式（皆受支援）：

- 精靈（建議）：`openclaw onboard --install-daemon`
- 直接安裝：`openclaw gateway install`
- 設定流程：`openclaw configure` → 選取 **閘道服務**
- 修復/遷移：`openclaw doctor`（會提供安裝或修復服務的選項）

服務目標取決於作業系統：

- macOS：LaunchAgent（`ai.openclaw.gateway`，或命名設定檔使用 `ai.openclaw.<profile>`）
- Linux/WSL2：systemd 使用者服務（`openclaw-gateway[-<profile>].service`）
- 原生 Windows：排程工作（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），若工作建立遭拒，則退回使用每位使用者的 Startup 資料夾登入項目

## 相關

- [安裝概覽](/zh-TW/install)
- [Windows Hub](/zh-TW/platforms/windows)
- [macOS 應用程式](/zh-TW/platforms/macos)
- [iOS 應用程式](/zh-TW/platforms/ios)
