---
read_when:
    - 安装 macOS 应用
    - 在 macOS 上选择本地或远程 Gateway 网关模式
    - 查找 macOS 应用发布版本下载地址
summary: 安装和使用 OpenClaw macOS 菜单栏应用
title: macOS 应用
x-i18n:
    generated_at: "2026-07-12T14:36:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

macOS 应用是 OpenClaw 的**菜单栏配套应用**：提供原生托盘 UI、macOS
权限提示、通知、WebChat、语音输入、Canvas，以及
`system.run` 等由 Mac 托管的节点工具。

只需要 CLI 和 Gateway 网关？请从[入门指南](/zh-CN/start/getting-started)开始。

## 下载

从 [OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases) 获取 macOS 应用构建版本。
当某个版本包含 macOS 应用资源时，请查找：

- `OpenClaw-<version>.dmg`（首选）
- `OpenClaw-<version>.zip`

某些版本仅包含 CLI、证据或 Windows 资源。如果最新版本
没有 macOS 应用资源，请使用包含该资源的最新版本，或按照
[macOS 开发环境设置](/zh-CN/platforms/mac/dev-setup)从源代码构建。

## 首次运行

1. 安装并启动 **OpenClaw.app**。
2. 为本地 Gateway 网关选择 **This Mac**，或连接到远程 Gateway 网关。
3. 本地模式：等待应用安装其用户空间运行时和 Gateway 网关。
4. 通过实时模型检查建立推理能力。检查通过后，Crestodian
   会处理其余设置。
5. 完成 macOS 权限检查清单，并发送新手引导测试消息。

如果应用连接到的现有 Gateway 网关，其默认智能体已配置
模型，则应用会将该 Gateway 网关视为已完成设置，跳过提供商新手引导和
Crestodian，并打开仪表板。如果无法连接 Gateway 网关，或其
默认智能体未配置模型，则仍可使用推理新手引导进行
恢复。

对于 CLI/Gateway 网关设置流程，请参阅[入门指南](/zh-CN/start/getting-started)。
对于权限恢复，请参阅 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## 更新

仪表板更新卡片会先通过 Sparkle 更新已签名的 macOS 应用。
应用重新启动后，它会自动更新并重启匹配的、
由应用管理的本地 Gateway 网关。Homebrew 和其他由用户管理的 CLI 安装仍使用
常规 Gateway 网关更新流程（卡片会直接运行 Gateway 网关更新），
并且自动修复绝不会将较新的 Gateway 网关降级，也不会覆盖
`extended-stable` 渠道固定设置。

Sparkle 遵循 Gateway 网关的 `update.channel` 设置。`beta` 和 `dev` 会选择加入
Beta 应用构建；`stable`、`extended-stable` 以及缺失或未知的值
仍使用稳定版应用构建。

## 打开仪表板链接

在 macOS 应用的嵌入式仪表板中，点击外部网页链接会在可调整大小的浏览器侧边栏中打开该链接。每个链接会在独立标签页中打开；再次点击同一链接会复用其现有标签页。拖动标签页可调整顺序，使用标签页关闭按钮或鼠标中键点击可将其关闭，右键点击标签页可使用 **Open in Default Browser**、**Copy Link**、**Reload**、**Close Tab** 和 **Close Other Tabs**。窗口标题栏中的后退/前进控件和触控板轻扫手势用于浏览仪表板历史记录；侧边栏自身的后退/前进控件用于浏览当前标签页的历史记录。侧边栏还提供重新加载、在默认浏览器中打开和关闭控件，并会记住其宽度。

标题栏控件会随应用侧边栏变化：侧边栏展开时，后退/前进控件位于其右侧边缘，紧邻侧边栏切换按钮；侧边栏折叠时，这些控件会让位于搜索按钮（用于打开命令面板）和新建会话按钮。

右键点击外部链接可选择 **Open in Sidebar**、**Open in Default Browser** 或 **Copy Link**。在仪表板中使用修饰键点击，以及由用户操作触发的新窗口链接，仍会在默认浏览器中打开；侧边栏内的新窗口链接则会作为新的侧边栏标签页打开。由常规浏览器托管的 Control UI 页面继续使用浏览器的正常链接和上下文菜单行为。

## 导入浏览器登录信息

当应用连接本地 Gateway 网关运行，且 Mac 上存在带 Cookie 的 Chrome 系浏览器配置文件时，仪表板窗口会显示一条可关闭的横幅，提示将这些 Cookie 复制到供智能体浏览使用的隔离托管配置文件中。通过横幅中的 **Import** 控件选择配置文件（可能需要 Touch ID）；进度和已导入的 Cookie 数量会内联显示，并且只会复制 Cookie——密码绝不会离开源浏览器。关闭横幅会记录该选择；你可以随时通过 **Settings → General → Browser login → Import…** 再次使用此功能。有关底层导入流程和 `browser.allowSystemProfileImport` 门控，请参阅[浏览器](/zh-CN/cli/browser)。

## 选择 Gateway 网关模式

| 模式   | 适用场景                                                                    | 详情页面                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 本地  | 由这台 Mac 运行 Gateway 网关，并通过 launchd 保持其运行。                | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway) |
| 远程 | 由另一台主机运行 Gateway 网关；这台 Mac 通过 SSH、LAN 或 Tailnet 控制它。 | [远程控制](/zh-CN/platforms/mac/remote)            |

本地模式需要已安装 `openclaw` CLI。在全新的 Mac 上，应用会在启动 Gateway 网关向导前
自动安装匹配的 CLI 和运行时。
有关手动恢复，请参阅 [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway)。

## 应用负责的功能

- 菜单栏状态、通知、健康状况和 WebChat。
- 针对屏幕、麦克风、语音、自动化和辅助功能的 macOS 权限提示。
- 本地节点工具：Canvas、摄像头/屏幕捕获、通知和 `system.run`。
- 针对由 Mac 托管的命令显示 Exec 审批提示。
- 远程模式 SSH 隧道或直接 Gateway 网关连接。

该应用**不会**取代 Gateway 网关或通用 CLI 文档。Gateway 网关
配置、提供商、插件、渠道、工具和安全性均在各自的
文档中说明。

## macOS 详情页面

| 任务                                     | 阅读                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安装或调试 CLI/Gateway 网关服务 | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway)                                          |
| 避免将状态存放在云同步文件夹中   | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 调试应用发现和连接问题     | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| 了解 launchd 行为              | [Gateway 网关生命周期](/zh-CN/platforms/mac/child-process)                                           |
| 修复权限或签名/TCC 问题    | [macOS 权限](/zh-CN/platforms/mac/permissions)                                             |
| 检测你最近使用的 Mac    | [活跃计算机在线状态](/zh-CN/nodes/presence)                                                 |
| 连接到远程 Gateway 网关              | [远程控制](/zh-CN/platforms/mac/remote)                                                     |
| 查看菜单栏状态和健康检查   | [菜单栏](/zh-CN/platforms/mac/menu-bar)、[健康检查](/zh-CN/platforms/mac/health)                 |
| 使用嵌入式聊天 UI                 | [WebChat](/zh-CN/platforms/mac/webchat)                                                           |
| 使用语音唤醒或按键说话           | [语音唤醒](/zh-CN/platforms/mac/voicewake)                                                      |
| 使用 Canvas 和 Canvas 深层链接         | [Canvas](/zh-CN/platforms/mac/canvas)                                                             |
| 托管 PeekabooBridge 以进行 UI 自动化    | [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)                                                  |
| 配置命令审批              | [Exec 审批](/zh-CN/tools/exec-approvals)、[高级详情](/zh-CN/tools/exec-approvals-advanced) |
| 检查 Mac 节点命令和应用 IPC    | [macOS IPC](/zh-CN/platforms/mac/xpc)                                                             |
| 捕获日志                             | [macOS 日志](/zh-CN/platforms/mac/logging)                                                     |
| 从源代码构建                        | [macOS 开发环境设置](/zh-CN/platforms/mac/dev-setup)                                                 |

## 相关内容

- [平台](/zh-CN/platforms)
- [入门指南](/zh-CN/start/getting-started)
- [Gateway 网关](/zh-CN/gateway)
- [Exec 审批](/zh-CN/tools/exec-approvals)
