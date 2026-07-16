---
read_when:
    - 安装 macOS 应用
    - 在 macOS 上选择本地或远程 Gateway 网关模式
    - 查找 macOS 应用发布版下载文件
summary: 安装并使用 OpenClaw macOS 菜单栏应用
title: macOS 应用
x-i18n:
    generated_at: "2026-07-16T11:45:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

macOS 应用是 OpenClaw 的**菜单栏配套应用**：提供原生托盘 UI、macOS
权限提示、通知、WebChat、语音输入、Canvas，以及
由 Mac 托管的节点工具，例如 `system.run`。

只需要 CLI 和 Gateway 网关？请从[入门指南](/zh-CN/start/getting-started)开始。

## 下载

从 [OpenClaw GitHub 发布页面](https://github.com/openclaw/openclaw/releases)获取 macOS 应用构建版本。
当某个发布版本提供 macOS 应用资产时，请查找：

- `OpenClaw-<version>.dmg`（首选）
- `OpenClaw-<version>.zip`

有些发布版本仅提供 CLI、证据或 Windows 资产。如果最新发布版本
没有 macOS 应用资产，请使用最近一个包含该资产的版本，或按照
[macOS 开发设置](/zh-CN/platforms/mac/dev-setup)从源代码构建。

## 首次运行

1. 安装并启动 **OpenClaw.app**。
2. 选择 **This Mac** 以使用本地 Gateway 网关，或连接到远程 Gateway 网关。
3. 等待应用安装匹配的 CLI 运行时。在本地模式下，它还会
   安装并启动 Gateway 网关。
4. 通过实时模型检查建立推理连接。检查通过后，OpenClaw
   会完成其余设置。
5. 完成 macOS 权限检查清单，并发送新手引导测试消息。

如果应用连接到的现有 Gateway 网关中，默认智能体已配置
模型，它会将该 Gateway 网关视为已设置，跳过提供商新手引导和
OpenClaw，并打开仪表板。如果无法连接 Gateway 网关，或其
默认智能体没有模型，推理新手引导仍可用于
恢复。

对于 CLI/Gateway 网关设置路径，请使用[入门指南](/zh-CN/start/getting-started)。
对于权限恢复，请使用 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## 更新

仪表板更新卡片会说明应用将更新的内容：

- **更新 Mac 应用 + Gateway 网关**表示已签名应用拥有本地 launchd
  Gateway 网关。Sparkle 会先更新应用；应用重新启动后，会自动
  将其 Gateway 网关更新到匹配版本并重启，然后验证
  连接。
- **更新 Gateway 网关**表示应用连接到远程 Gateway 网关、手动
  管理的本地 Gateway 网关，或应用并不拥有的其他安装。该按钮
  会运行该 Gateway 网关的常规更新流程，而不是更改 Mac 应用。

协调更新失败后，应用会停留在其设置样式的窗口中，并提供重试、
[更新指南](/zh-CN/install/updating)和 Discord 操作。自动修复绝不会
降级版本更新的 Gateway 网关，也不会覆盖 `extended-stable` 渠道固定设置。

成功更新后，应用会找到最近由用户使用的
顶层直接会话，并向该智能体发送一次性更新事件。Heartbeat
和 cron 活动不会影响这一选择。随后，智能体可以从你最可能使用的
会话中欢迎你回来。在远程模式下，应用
只更新本地 Mac 节点运行时；当远程 Gateway 网关版本低于应用版本时，
会跳过通知。

Sparkle 遵循 Gateway 网关的 `update.channel` 设置。`beta` 和 `dev` 会启用
测试版应用构建；`stable`、`extended-stable` 以及缺失或未知的值
会继续使用稳定版应用构建。

## 打开仪表板链接

在 macOS 应用的嵌入式仪表板中，点击外部网页链接会在占窗口一半宽度、可调整大小的浏览器侧边栏中打开，同时保持仪表板导航可见。拖动分隔线可选择其他宽度；应用会记住该宽度。每个链接都会在自己的标签页中打开；打开多个页面时会显示标签栏；再次点击同一链接会复用其现有标签页。拖动标签页可重新排序；使用标签页关闭按钮或点击鼠标中键可将其关闭；右键点击标签页可使用 **Open in Default Browser**、**Copy Link**、**Reload**、**Close Tab** 和 **Close Other Tabs**。窗口标题栏中的后退/前进控件和触控板轻扫手势用于浏览仪表板历史记录；侧边栏自身的后退/前进控件用于浏览活动标签页的历史记录。侧边栏还提供重新加载、在默认浏览器中打开和关闭控件。

标题栏控件会随应用侧边栏变化：展开时，后退/前进控件位于侧边栏开关旁的右边缘；折叠时，它们会让位给搜索按钮（打开命令面板）和新建会话按钮。

右键点击外部链接可选择 **Open in Sidebar**、**Open in Default Browser** 或 **Copy Link**。在仪表板中，使用修饰键点击的链接和由用户触发的新窗口链接仍会在默认浏览器中打开；侧边栏中的新窗口链接会作为新的侧边栏标签页打开。由常规浏览器托管的 Control UI 页面会保留浏览器通常的链接和上下文菜单行为。

## 导入浏览器登录信息

当应用连接到本地 Gateway 网关运行时，首次打开浏览器侧边栏时，如果 Mac 上存在带 Cookie 的 Chrome 系浏览器配置文件，仪表板会显示一个可关闭的横幅。该横幅提供将这些 Cookie 复制到隔离的托管配置文件中的选项，智能体会使用该配置文件浏览网页。从其 **Import** 控件中选择配置文件（可能需要 Touch ID）；进度和已导入的 Cookie 数量会内联显示，并且只会复制 Cookie——密码绝不会离开源浏览器。关闭横幅会记录该选择；可随时通过 **Settings → General → Browser login → Import…** 再次显示。有关底层导入流程和 `browser.allowSystemProfileImport` 门控，请参阅[浏览器](/zh-CN/cli/browser)。

## 选择 Gateway 网关模式

| 模式   | 适用场景                                                                       | 详情页面                                           |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 本地   | 此 Mac 应运行 Gateway 网关，并通过 launchd 使其保持运行。                     | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway) |
| 远程   | 另一台主机运行 Gateway 网关；此 Mac 通过 SSH、LAN 或 Tailnet 控制它。          | [远程控制](/zh-CN/platforms/mac/remote)                  |

两种模式都需要安装 `openclaw` CLI，因为应用会复用其节点宿主
运行时。在全新的 Mac 上，应用会自动安装匹配的 CLI；本地
模式随后启动 Gateway 网关向导，而远程模式会连接到所选的
Gateway 网关，而不会启动第二个本地 Gateway 网关。
有关手动恢复，请参阅 [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway)。

## 应用负责的内容

- 菜单栏状态、通知、健康状态和 WebChat。
- 屏幕、麦克风、语音、自动化和辅助功能的 macOS 权限提示。
- 一个 Mac 节点，将原生 Canvas、摄像头/屏幕采集、通知、
  位置和计算机控制功能，与 CLI 节点宿主的系统、浏览器、
  插件、Skills 和 MCP 命令相结合。
- Mac 托管命令的 Exec 审批提示。
- 在应用上下文中执行已批准的 shell 命令，在由 CLI 运行时负责共享节点策略的同时，保留应用的 macOS
  权限归属。
- 远程模式 SSH 隧道或直接 Gateway 网关连接。

应用**不会**取代 Gateway 网关或通用 CLI 文档。Gateway 网关
配置、提供商、插件、渠道、工具和安全性各有
专属文档。

## macOS 详情页面

| 任务                                     | 阅读                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安装或调试 CLI/Gateway 网关服务          | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway)                                   |
| 避免将状态存放在云同步文件夹中           | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway#state-directory-on-macos)          |
| 调试应用发现和连接                       | [macOS 上的 Gateway 网关](/zh-CN/platforms/mac/bundled-gateway#debug-app-connectivity)            |
| 了解 launchd 行为                        | [Gateway 网关生命周期](/zh-CN/platforms/mac/child-process)                                        |
| 修复权限或签名/TCC 问题                  | [macOS 权限](/zh-CN/platforms/mac/permissions)                                                    |
| 检测你最近使用的 Mac                     | [活动计算机在线状态](/zh-CN/nodes/presence)                                                       |
| 连接到远程 Gateway 网关                  | [远程控制](/zh-CN/platforms/mac/remote)                                                           |
| 查看菜单栏状态和健康检查                 | [菜单栏](/zh-CN/platforms/mac/menu-bar)、[健康检查](/zh-CN/platforms/mac/health)                        |
| 使用嵌入式聊天 UI                        | [WebChat](/zh-CN/platforms/mac/webchat)                                                           |
| 使用语音唤醒或按键说话                   | [语音唤醒](/zh-CN/platforms/mac/voicewake)                                                        |
| 使用 Canvas 和 Canvas 深层链接           | [Canvas](/zh-CN/platforms/mac/canvas)                                                             |
| 托管 PeekabooBridge 以进行 UI 自动化     | [Peekaboo bridge](/zh-CN/platforms/mac/peekaboo)                                                  |
| 配置命令审批                             | [Exec 审批](/zh-CN/tools/exec-approvals)、[高级详情](/zh-CN/tools/exec-approvals-advanced)              |
| 检查 Mac 节点命令和应用 IPC              | [macOS IPC](/zh-CN/platforms/mac/xpc)                                                             |
| 采集日志                                 | [macOS 日志](/zh-CN/platforms/mac/logging)                                                        |
| 从源代码构建                             | [macOS 开发设置](/zh-CN/platforms/mac/dev-setup)                                                  |

## 相关内容

- [平台](/zh-CN/platforms)
- [入门指南](/zh-CN/start/getting-started)
- [Gateway 网关](/zh-CN/gateway)
- [Exec 审批](/zh-CN/tools/exec-approvals)
