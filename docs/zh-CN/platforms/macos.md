---
read_when:
    - 安装 macOS 应用
    - 在 macOS 上选择本地或远程 Gateway 网关模式
    - 正在查找 macOS App 发布下载
summary: 安装并使用 OpenClaw macOS 菜单栏应用
title: macOS 应用
x-i18n:
    generated_at: "2026-07-05T11:28:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b34bade53181819a32edf6eefb075b38ba92cf1ae739da4d497c31c410ce0edb
    source_path: platforms/macos.md
    workflow: 16
---

OpenClaw **菜单栏配套应用** 是 macOS 应用：原生托盘界面、macOS
权限提示、通知、WebChat、语音输入、Canvas，以及
Mac 托管的节点工具，例如 `system.run`。

只需要 CLI 和 Gateway 网关？从[入门指南](/zh-CN/start/getting-started)开始。

## 下载

从 [OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases) 获取 macOS 应用构建。
当某个发布版本包含 macOS 应用资源时，查找：

- `OpenClaw-<version>.dmg`（推荐）
- `OpenClaw-<version>.zip`

有些发布版本只包含 CLI、证据或 Windows 资源。如果最新发布版本
没有 macOS 应用资源，请使用包含该资源的最新版本，或通过
[macOS 开发设置](/zh-CN/platforms/mac/dev-setup)从源码构建。

## 首次运行

1. 安装并启动 **OpenClaw.app**。
2. 为本地 Gateway 网关选择 **This Mac**，或连接到远程 Gateway 网关。
3. 本地模式：等待应用安装其用户空间运行时和 Gateway 网关。
4. 完成提供商设置和 macOS 权限检查清单。
5. 发送新手引导测试消息。

对于 CLI/Gateway 网关设置路径，请使用[入门指南](/zh-CN/start/getting-started)。
对于权限恢复，请使用 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## 选择 Gateway 网关模式

| 模式   | 适用场景                                                                    | 详情页面                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 本地  | 这台 Mac 应运行 Gateway 网关，并通过 launchd 保持其运行。                | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway) |
| 远程 | 另一台主机运行 Gateway 网关；这台 Mac 通过 SSH、局域网或 Tailnet 控制它。 | [远程控制](/zh-CN/platforms/mac/remote)            |

本地模式需要已安装的 `openclaw` CLI。在全新的 Mac 上，应用会在启动 Gateway 网关向导前
自动安装匹配的 CLI 和运行时。
如需手动恢复，请参阅 [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway)。

## 应用负责什么

- 菜单栏状态、通知、健康状态和 WebChat。
- 用于屏幕、麦克风、语音、自动化和辅助功能的 macOS 权限提示。
- 本地节点工具：Canvas、摄像头/屏幕捕获、通知和 `system.run`。
- Mac 托管命令的 Exec 审批提示。
- 远程模式 SSH 隧道或直接 Gateway 网关连接。

该应用**不会**替代 Gateway 网关或通用 CLI 文档。Gateway 网关
配置、提供商、插件、渠道、工具和安全性都有各自的文档。

## macOS 详情页面

| 任务                                     | 阅读                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安装或调试 CLI/Gateway 网关服务 | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway)                                          |
| 避免状态进入云同步文件夹   | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 调试应用发现和连接能力     | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| 了解 launchd 行为              | [Gateway 网关生命周期](/zh-CN/platforms/mac/child-process)                                           |
| 修复权限或签名/TCC 问题    | [macOS 权限](/zh-CN/platforms/mac/permissions)                                             |
| 连接到远程 Gateway 网关              | [远程控制](/zh-CN/platforms/mac/remote)                                                     |
| 读取菜单栏状态和健康检查   | [菜单栏](/zh-CN/platforms/mac/menu-bar), [健康检查](/zh-CN/platforms/mac/health)                 |
| 使用嵌入式聊天界面                 | [WebChat](/zh-CN/platforms/mac/webchat)                                                           |
| 使用语音唤醒或按住说话           | [语音唤醒](/zh-CN/platforms/mac/voicewake)                                                      |
| 使用 Canvas 和 Canvas 深层链接         | [Canvas](/zh-CN/platforms/mac/canvas)                                                             |
| 托管 PeekabooBridge 以进行 UI 自动化    | [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)                                                  |
| 配置命令审批              | [Exec 审批](/zh-CN/tools/exec-approvals), [高级详情](/zh-CN/tools/exec-approvals-advanced) |
| 检查 Mac 节点命令和应用 IPC    | [macOS IPC](/zh-CN/platforms/mac/xpc)                                                             |
| 捕获日志                             | [macOS 日志](/zh-CN/platforms/mac/logging)                                                     |
| 从源码构建                        | [macOS 开发设置](/zh-CN/platforms/mac/dev-setup)                                                 |

## 相关

- [平台](/zh-CN/platforms)
- [入门指南](/zh-CN/start/getting-started)
- [Gateway 网关](/zh-CN/gateway)
- [Exec 审批](/zh-CN/tools/exec-approvals)
