---
read_when:
    - 查找操作系统支持或安装路径时
    - 决定将 Gateway 网关 运行在哪里时
summary: 平台支持概览（Gateway 网关 + 配套应用）
title: 平台
x-i18n:
    generated_at: "2026-04-05T08:37:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# 平台

OpenClaw 核心使用 TypeScript 编写。**Node 是推荐的运行时**。
不建议对 Gateway 网关 使用 Bun（存在 WhatsApp/Telegram 相关问题）。

macOS（菜单栏应用）和移动节点（iOS/Android）已有配套应用。Windows 和
Linux 配套应用已在计划中，但 Gateway 网关 目前已获得完整支持。
Windows 原生配套应用也已在计划中；建议通过 WSL2 运行 Gateway 网关。

## 选择你的操作系统

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS 与托管

- VPS 中心： [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner（Docker）：[Hetzner](/install/hetzner)
- GCP（Compute Engine）：[GCP](/install/gcp)
- Azure（Linux VM）：[Azure](/install/azure)
- exe.dev（VM + HTTPS 代理）：[exe.dev](/install/exe-dev)

## 常用链接

- 安装指南：[入门指南](/start/getting-started)
- Gateway 网关 运行手册：[Gateway 网关](/gateway)
- Gateway 网关 配置：[Configuration](/gateway/configuration)
- 服务状态：`openclaw gateway status`

## Gateway 网关 服务安装（CLI）

使用以下任一方式（均受支持）：

- 向导（推荐）：`openclaw onboard --install-daemon`
- 直接安装：`openclaw gateway install`
- 配置流程：`openclaw configure` → 选择 **Gateway service**
- 修复/迁移：`openclaw doctor`（会提供安装或修复该服务的选项）

服务目标取决于操作系统：

- macOS：LaunchAgent（`ai.openclaw.gateway` 或 `ai.openclaw.<profile>`；旧版为 `com.openclaw.*`）
- Linux/WSL2：systemd 用户服务（`openclaw-gateway[-<profile>].service`）
- 原生 Windows：计划任务（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），如果任务创建被拒绝，则回退为每用户 Startup 文件夹登录项
