---
read_when:
    - 查找操作系统支持或安装路径
    - 决定在哪里运行 Gateway 网关
summary: 平台支持概览（Gateway 网关 + 配套应用）
title: 平台
x-i18n:
    generated_at: "2026-06-27T02:29:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 核心使用 TypeScript 编写。**Node 是推荐的运行时**。
不建议将 Bun 用于 Gateway 网关，因为 WhatsApp 和
Telegram 渠道存在已知问题；详情请参阅 [Bun（实验性）](/zh-CN/install/bun)。

Windows Hub、macOS（菜单栏应用）和移动节点
（iOS/Android）都有配套应用。Linux 配套应用正在规划中，但 Gateway 网关目前已完全
支持。在 Windows 上，如需桌面应用请选择 Windows Hub，如需终端优先使用方式请选择原生
PowerShell 安装，或选择 WSL2 以获得最
兼容 Linux 的 Gateway 网关运行时。

## 选择你的 OS

- macOS：[macOS](/zh-CN/platforms/macos)
- iOS：[iOS](/zh-CN/platforms/ios)
- Android：[Android](/zh-CN/platforms/android)
- Windows：[Windows](/zh-CN/platforms/windows)
- Linux：[Linux](/zh-CN/platforms/linux)

## VPS 和托管

- VPS 中枢：[VPS 托管](/zh-CN/vps)
- Fly.io：[Fly.io](/zh-CN/install/fly)
- Hetzner（Docker）：[Hetzner](/zh-CN/install/hetzner)
- GCP（Compute Engine）：[GCP](/zh-CN/install/gcp)
- Azure（Linux VM）：[Azure](/zh-CN/install/azure)
- exe.dev（VM + HTTPS 代理）：[exe.dev](/zh-CN/install/exe-dev)
- EasyRunner（Podman + Caddy）：[EasyRunner](/zh-CN/platforms/easyrunner)

## 常用链接

- 安装指南：[入门指南](/zh-CN/start/getting-started)
- Windows Hub：[Windows](/zh-CN/platforms/windows)
- Gateway 网关运行手册：[Gateway 网关](/zh-CN/gateway)
- Gateway 网关配置：[配置](/zh-CN/gateway/configuration)
- 服务状态：`openclaw gateway status`

## Gateway 网关服务安装（CLI）

使用以下任一方式（均受支持）：

- 向导（推荐）：`openclaw onboard --install-daemon`
- 直接安装：`openclaw gateway install`
- 配置流程：`openclaw configure` → 选择 **Gateway 网关服务**
- 修复/迁移：`openclaw doctor`（会提示安装或修复服务）

服务目标取决于 OS：

- macOS：LaunchAgent（`ai.openclaw.gateway` 或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*`）
- Linux/WSL2：systemd 用户服务（`openclaw-gateway[-<profile>].service`）
- 原生 Windows：计划任务（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），如果创建任务被拒绝，则回退到按用户的启动文件夹登录项

## 相关

- [安装概览](/zh-CN/install)
- [Windows Hub](/zh-CN/platforms/windows)
- [macOS 应用](/zh-CN/platforms/macos)
- [iOS 应用](/zh-CN/platforms/ios)
