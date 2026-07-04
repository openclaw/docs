---
read_when:
    - 安装 macOS 应用
    - 在 macOS 上选择本地或远程 Gateway 网关模式
    - 正在查找 macOS 应用发布下载
summary: 安装并使用 OpenClaw macOS 菜单栏应用
title: macOS 应用
x-i18n:
    generated_at: "2026-07-04T06:21:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

macOS 应用是 OpenClaw **菜单栏配套应用**。当你需要原生托盘 UI、macOS 权限提示、通知、WebChat、语音输入、Canvas，或 Mac 托管的节点工具（如 `system.run`）时使用它。

如果你只需要 CLI 和 Gateway 网关，请从[入门指南](/zh-CN/start/getting-started)开始。

## 下载

从 [OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases) 下载 macOS 应用构建。
当某个发布包含 macOS 应用资产时，请查找：

- `OpenClaw-<version>.dmg`（首选）
- `OpenClaw-<version>.zip`

有些发布只包含 CLI、证据或 Windows 资产。如果最新发布没有 macOS 应用资产，请使用包含该资产的最新发布，或通过 [macOS dev setup](/zh-CN/platforms/mac/dev-setup) 从源代码构建应用。

## 首次运行

1. 安装并启动 **OpenClaw.app**。
2. 为本地 Gateway 网关选择 **This Mac**，或连接到远程 Gateway 网关。
3. 在本地模式下，等待应用安装其用户空间运行时和 Gateway 网关。
4. 完成提供商设置和 macOS 权限检查清单。
5. 发送新手引导测试消息。

对于 CLI/Gateway 网关设置路径，请使用[入门指南](/zh-CN/start/getting-started)。
对于权限恢复，请使用 [macOS permissions](/zh-CN/platforms/mac/permissions)。

## 选择 Gateway 网关模式

| 模式 | 适用场景 | 详情页面 |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 本地 | 这台 Mac 应运行 Gateway 网关，并通过 launchd 保持其运行。 | [Gateway on macOS](/zh-CN/platforms/mac/bundled-gateway) |
| 远程 | 另一台主机运行 Gateway 网关，而这台 Mac 应通过 SSH、LAN 或 Tailnet 控制它。 | [Remote control](/zh-CN/platforms/mac/remote) |

本地模式需要安装 `openclaw` CLI。在全新的 Mac 上，应用会在启动 Gateway 网关向导之前，自动安装匹配的 CLI 和运行时。
请参阅 [Gateway on macOS](/zh-CN/platforms/mac/bundled-gateway) 进行手动恢复。

## 应用负责的内容

- 菜单栏状态、通知、健康状态和 WebChat。
- 屏幕、麦克风、语音、自动化和辅助功能的 macOS 权限提示。
- 本地节点工具，例如 Canvas、摄像头/屏幕捕获、通知和 `system.run`。
- Mac 托管命令的 Exec 审批提示。
- 远程模式 SSH 隧道或直接 Gateway 网关连接。

该应用**不会**取代 OpenClaw Gateway 网关或通用 CLI 文档。核心 Gateway 网关配置、提供商、插件、渠道、工具和安全性位于各自的文档中。

## macOS 详情页面

| 任务 | 阅读 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安装或调试 CLI/Gateway 网关服务 | [Gateway on macOS](/zh-CN/platforms/mac/bundled-gateway) |
| 避免将状态放入云同步文件夹 | [Gateway on macOS](/zh-CN/platforms/mac/bundled-gateway#state-directory-on-macos) |
| 调试应用发现和连接性 | [Gateway on macOS](/zh-CN/platforms/mac/bundled-gateway#debug-app-connectivity) |
| 了解 launchd 行为 | [Gateway lifecycle](/zh-CN/platforms/mac/child-process) |
| 修复权限或签名/TCC 问题 | [macOS permissions](/zh-CN/platforms/mac/permissions) |
| 连接到远程 Gateway 网关 | [Remote control](/zh-CN/platforms/mac/remote) |
| 读取菜单栏状态和健康检查 | [Menu bar](/zh-CN/platforms/mac/menu-bar)、[Health checks](/zh-CN/platforms/mac/health) |
| 使用嵌入式聊天 UI | [WebChat](/zh-CN/platforms/mac/webchat) |
| 使用语音唤醒或按键通话 | [Voice wake](/zh-CN/platforms/mac/voicewake) |
| 使用 Canvas 和 Canvas 深层链接 | [Canvas](/zh-CN/platforms/mac/canvas) |
| 托管 PeekabooBridge 以进行 UI 自动化 | [Peekaboo bridge](/zh-CN/platforms/mac/peekaboo) |
| 配置命令审批 | [Exec approvals](/zh-CN/tools/exec-approvals)、[advanced details](/zh-CN/tools/exec-approvals-advanced) |
| 检查 Mac 节点命令和应用 IPC | [macOS IPC](/zh-CN/platforms/mac/xpc) |
| 捕获日志 | [macOS logging](/zh-CN/platforms/mac/logging) |
| 从源代码构建 | [macOS dev setup](/zh-CN/platforms/mac/dev-setup) |

## 相关

- [平台](/zh-CN/platforms)
- [入门指南](/zh-CN/start/getting-started)
- [Gateway 网关](/zh-CN/gateway)
- [Exec 审批](/zh-CN/tools/exec-approvals)
