---
read_when:
    - 查找操作系统支持或安装路径
    - 决定 Gateway 网关的运行位置
summary: 平台支持概览（Gateway 网关 + 配套应用）
title: 平台
x-i18n:
    generated_at: "2026-05-05T23:38:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 核心使用 TypeScript 编写。**Node 是推荐的运行时**。
不推荐将 Bun 用于 Gateway 网关 —— WhatsApp 和
Telegram 渠道存在已知问题；详情见 [Bun（实验性）](/zh-CN/install/bun)。

macOS（菜单栏应用）和移动节点（iOS/Android）已有配套应用。Windows 和
Linux 配套应用已在计划中，但 Gateway 网关目前已完全支持。
Windows 原生配套应用也已在计划中；建议通过 WSL2 使用 Gateway 网关。

## 选择你的操作系统

- macOS: [macOS](/zh-CN/platforms/macos)
- iOS: [iOS](/zh-CN/platforms/ios)
- Android: [Android](/zh-CN/platforms/android)
- Windows: [Windows](/zh-CN/platforms/windows)
- Linux: [Linux](/zh-CN/platforms/linux)

## VPS 和托管

- VPS 中心: [VPS 托管](/zh-CN/vps)
- Fly.io: [Fly.io](/zh-CN/install/fly)
- Hetzner（Docker）: [Hetzner](/zh-CN/install/hetzner)
- GCP（Compute Engine）: [GCP](/zh-CN/install/gcp)
- Azure（Linux VM）: [Azure](/zh-CN/install/azure)
- exe.dev（VM + HTTPS 代理）: [exe.dev](/zh-CN/install/exe-dev)

## 常用链接

- 安装指南: [入门指南](/zh-CN/start/getting-started)
- Gateway 网关运行手册: [Gateway 网关](/zh-CN/gateway)
- Gateway 网关配置: [配置](/zh-CN/gateway/configuration)
- 服务 Status: `openclaw gateway status`

## Gateway 网关服务安装（CLI）

使用以下任一方式（均受支持）：

- 向导（推荐）: `openclaw onboard --install-daemon`
- 直接安装: `openclaw gateway install`
- 配置流程: `openclaw configure` → 选择 **Gateway 网关服务**
- 修复/迁移: `openclaw doctor`（会提供安装或修复服务的选项）

服务目标取决于操作系统：

- macOS: LaunchAgent（`ai.openclaw.gateway` 或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*`）
- Linux/WSL2: systemd 用户服务（`openclaw-gateway[-<profile>].service`）
- 原生 Windows: 计划任务（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），如果任务创建被拒绝，则回退为每用户启动文件夹登录项

## 相关内容

- [安装概览](/zh-CN/install)
- [macOS 应用](/zh-CN/platforms/macos)
- [iOS 应用](/zh-CN/platforms/ios)
