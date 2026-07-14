---
read_when:
    - 查找操作系统支持或安装路径
    - 决定在哪里运行 Gateway 网关
summary: 平台支持概览（Gateway 网关 + 配套应用）
title: 平台
x-i18n:
    generated_at: "2026-07-14T13:51:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 核心使用 TypeScript 编写。**Node 是必需的运行时**，因为
规范状态存储使用 `node:sqlite`。Bun 仍可用于
安装依赖项和运行包脚本；请参阅 [Bun](/zh-CN/install/bun)。

Windows Hub、macOS（菜单栏应用）和移动节点
（iOS/Android）均有配套应用。Linux 配套应用尚在规划中，但 Gateway 网关目前已
获得完整支持。在 Windows 上，可选择 Windows Hub 作为桌面应用，选择原生
PowerShell 安装以便优先通过终端使用，或选择 WSL2 以获得与 Linux
最兼容的 Gateway 网关运行时。

## 选择你的操作系统

- macOS：[macOS](/zh-CN/platforms/macos)
- iOS：[iOS](/zh-CN/platforms/ios)
- Android：[Android](/zh-CN/platforms/android)
- Windows：[Windows](/zh-CN/platforms/windows)
- Linux：[Linux](/zh-CN/platforms/linux)

## VPS 和托管

- VPS 中心：[VPS 托管](/zh-CN/vps)
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
- Gateway 配置：[配置](/zh-CN/gateway/configuration)
- 服务状态：`openclaw gateway status`

## 安装 Gateway 网关服务（CLI）

使用以下任一方式（均受支持）：

- 向导（推荐）：`openclaw onboard --install-daemon`
- 直接安装：`openclaw gateway install`
- 配置流程：`openclaw configure` → 选择 **Gateway service**
- 修复/迁移：`openclaw doctor`（可选择安装或修复服务）

服务目标取决于操作系统：

- macOS：LaunchAgent（`ai.openclaw.gateway`，或对命名配置文件使用 `ai.openclaw.<profile>`）
- Linux/WSL2：systemd 用户服务（`openclaw-gateway[-<profile>].service`）
- 原生 Windows：计划任务（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`）；如果任务创建被拒绝，则回退到每用户“启动”文件夹中的登录项

## 相关内容

- [安装概览](/zh-CN/install)
- [Windows Hub](/zh-CN/platforms/windows)
- [macOS 应用](/zh-CN/platforms/macos)
- [iOS 应用](/zh-CN/platforms/ios)
