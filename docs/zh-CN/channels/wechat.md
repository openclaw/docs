---
read_when:
    - 你想将 OpenClaw 连接到微信
    - 你正在安装或排查 openclaw-weixin 渠道插件的问题
    - 你需要了解外部渠道插件如何与 Gateway 网关并行运行
summary: 通过外部 openclaw-weixin 插件设置微信渠道
title: 微信
x-i18n:
    generated_at: "2026-07-11T20:21:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw 通过腾讯的外部渠道插件
`@tencent-weixin/openclaw-weixin` 连接到微信。

状态：外部插件，由腾讯微信团队维护。支持私聊和媒体。该插件的能力元数据未声明支持群聊（仅声明支持私聊）。

## 命名

- **微信**是本文档中面向用户的名称。
- **Weixin** 是腾讯软件包和插件 ID 使用的名称。
- `openclaw-weixin` 是 OpenClaw 渠道 ID（`weixin` 和 `wechat` 可用作别名）。
- `@tencent-weixin/openclaw-weixin` 是 npm 软件包。

在 CLI 命令和配置路径中使用 `openclaw-weixin`。

## 工作原理

微信相关代码并不位于 OpenClaw 核心仓库中。OpenClaw 提供通用渠道插件契约，外部插件则提供微信专用运行时：

1. `openclaw plugins install` 安装 `@tencent-weixin/openclaw-weixin`。
2. Gateway 网关发现插件清单并加载插件入口点。
3. 插件注册渠道 ID `openclaw-weixin`。
4. `openclaw channels login --channel openclaw-weixin` 启动二维码登录。
5. 插件将账号凭据存储在 OpenClaw 状态目录下（默认为 `~/.openclaw`）。
6. Gateway 网关启动时，插件会为每个已配置的账号启动其 Weixin 监控器。
7. 入站微信消息通过渠道契约进行标准化，路由到所选 OpenClaw 智能体，并通过插件的出站路径发回。

这种分离非常重要：OpenClaw 核心保持与渠道无关。微信登录、腾讯 iLink API 调用、媒体上传和下载、上下文令牌以及账号监控均由外部插件负责。

## 安装

快速安装：

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

手动安装：

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

安装后重启 Gateway 网关：

```bash
openclaw gateway restart
```

## 登录

在运行 Gateway 网关的同一台机器上执行二维码登录：

```bash
openclaw channels login --channel openclaw-weixin
```

使用手机微信扫描二维码并确认登录。扫描成功后，插件会将账号令牌保存在本地。

如需添加另一个微信账号，请再次运行相同的登录命令。使用多个账号时，请按账号、渠道和发送者隔离私信会话：

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 访问控制

私信使用渠道插件通用的 OpenClaw 配对和允许列表模型。

批准新的发送者：

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

有关完整的访问控制模型，请参阅[配对](/zh-CN/channels/pairing)。

## 兼容性

插件会在启动时检查宿主 OpenClaw 的版本。

| 插件版本系列 | OpenClaw 版本                                                | npm 标签  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12`（当前为 2.4.6；早期 2.x 接受 `>=2026.3.22`） | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

如果插件报告你的 OpenClaw 版本过旧，请更新 OpenClaw，或安装旧版插件系列：

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## 辅助进程

微信插件监控腾讯 iLink API 时，可以在 Gateway 网关旁运行辅助任务。在问题 #68451 中，该辅助路径暴露了 OpenClaw 通用过期 Gateway 网关清理机制中的一个错误：子进程可能会尝试清理父 Gateway 网关进程，导致在 systemd 等进程管理器下反复重启。

当前的 OpenClaw 启动清理会排除当前进程及其祖先进程，因此渠道辅助进程无法终止启动它的 Gateway 网关。此修复是通用修复，并非核心中的微信专用路径。

## 故障排查

检查安装和状态：

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

如果渠道显示已安装但无法连接，请确认插件已启用并重启：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

如果启用微信后 Gateway 网关反复重启，请同时更新 OpenClaw 和插件：

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

如果启动时报告已安装的插件软件包 `requires compiled runtime
output for TypeScript entry`，则该 npm 软件包发布时缺少 OpenClaw 所需的已编译 JavaScript 运行时文件。请等待插件发布者发布修复后的软件包，再进行更新或重新安装；也可以暂时禁用或卸载该插件。

暂时禁用：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 相关文档

- 渠道概览：[聊天渠道](/zh-CN/channels)
- 配对：[配对](/zh-CN/channels/pairing)
- 渠道路由：[频道路由](/zh-CN/channels/channel-routing)
- 插件架构：[插件架构](/zh-CN/plugins/architecture)
- 渠道插件 SDK：[渠道插件 SDK](/zh-CN/plugins/sdk-channel-plugins)
- 外部软件包：[@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
