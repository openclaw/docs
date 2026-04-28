---
read_when:
- 你想将 OpenClaw 连接到 WeChat 或微信
- 你正在安装或排查 openclaw-weixin 渠道插件的问题
- 你需要了解外部渠道插件如何与 Gateway 网关协同运行
summary: 通过外部 openclaw-weixin 插件设置微信渠道
title: 微信
x-i18n:
  generated_at: '2026-04-23T20:42:28Z'
  model: gpt-5.4
  provider: openai
  source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
  source_path: channels/wechat.md
  workflow: 15
---
OpenClaw 通过腾讯提供的外部 `@tencent-weixin/openclaw-weixin` 渠道插件连接到微信。

状态：外部插件。支持私聊和媒体。当前插件能力元数据未声明支持群聊。

## 命名

- **微信** 是这些文档中的面向用户名称。
- **Weixin** 是腾讯包名和插件 id 中使用的名称。
- `openclaw-weixin` 是 OpenClaw 渠道 id。
- `@tencent-weixin/openclaw-weixin` 是 npm 包。

在 CLI 命令和配置路径中使用 `openclaw-weixin`。

## 工作原理

微信代码并不位于 OpenClaw 核心仓库中。OpenClaw 提供通用的渠道插件契约，而外部插件提供微信专用运行时：

1. `openclaw plugins install` 安装 `@tencent-weixin/openclaw-weixin`。
2. Gateway 网关发现插件清单并加载插件入口点。
3. 插件注册渠道 id `openclaw-weixin`。
4. `openclaw channels login --channel openclaw-weixin` 启动二维码登录。
5. 插件将账户凭证存储在 OpenClaw 状态目录下。
6. 当 Gateway 网关启动时，插件会为每个已配置账户启动其 Weixin 监控器。
7. 入站微信消息会通过渠道契约进行规范化，路由到选定的 OpenClaw 智能体，并通过插件的出站路径发回。

这种分离很重要：OpenClaw 核心应保持渠道无关。微信登录、腾讯 iLink API 调用、媒体上传/下载、上下文令牌和账户监控都由外部插件负责。

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

使用手机上的微信扫描二维码并确认登录。扫码成功后，插件会将账户令牌保存在本地。

要添加另一个微信账户，请再次运行相同的登录命令。对于多账户，请按账户、渠道和发送方隔离私信会话：

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 访问控制

私信使用渠道插件的常规 OpenClaw 配对和 allowlist 模型。

批准新发送方：

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

完整访问控制模型请参阅 [配对](/zh-CN/channels/pairing)。

## 兼容性

插件会在启动时检查宿主 OpenClaw 版本。

| 插件版本线 | OpenClaw 版本 | npm tag |
| ----------- | ----------------------- | -------- |
| `2.x` | `>=2026.3.22` | `latest` |
| `1.x` | `>=2026.1.0 <2026.3.22` | `legacy` |

如果插件报告你的 OpenClaw 版本过旧，请升级 OpenClaw，或安装 legacy 插件版本线：

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar 进程

微信插件在监控腾讯 iLink API 时，可以在 Gateway 网关旁运行辅助工作。在 issue #68451 中，这条辅助路径暴露了 OpenClaw 通用陈旧 Gateway 网关清理逻辑中的一个 bug：子进程可能会尝试清理父 Gateway 网关进程，从而在 systemd 等进程管理器下导致重启循环。

当前 OpenClaw 启动清理逻辑会排除当前进程及其祖先进程，因此渠道辅助进程不得终止启动它的 Gateway 网关。这个修复是通用的；它不是核心中的微信专用路径。

## 故障排除

检查安装和状态：

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

如果渠道显示已安装但未连接，请确认插件已启用并重启：

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

临时禁用：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 相关文档

- 渠道概览：[聊天渠道](/zh-CN/channels)
- 配对：[配对](/zh-CN/channels/pairing)
- 渠道路由：[渠道路由](/zh-CN/channels/channel-routing)
- 插件架构：[插件架构](/zh-CN/plugins/architecture)
- 渠道插件 SDK：[渠道插件 SDK](/zh-CN/plugins/sdk-channel-plugins)
- 外部包：[@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
