---
read_when:
    - 将 OpenClaw 部署到 Upstash Box
    - 你需要一个用于 OpenClaw 的托管式 Linux 环境，并通过 SSH 隧道访问仪表盘
summary: 在 Upstash Box 上托管 OpenClaw，并启用保活和 SSH 隧道访问
title: Upstash Box
x-i18n:
    generated_at: "2026-06-27T02:20:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

在 Upstash Box 上运行持久化的 OpenClaw Gateway 网关，这是一个托管 Linux 环境，支持保活生命周期。

使用 SSH 隧道访问仪表盘。不要将 Gateway 网关端口直接暴露到公共互联网。

## 前提条件

- Upstash 账号
- 保活 Upstash Box
- 本地机器上的 SSH 客户端

## 创建 Box

在 Upstash Console 中创建一个保活 Box。记下 Box ID，例如
`right-flamingo-14486`，以及你的 Box API key。

Upstash 在以下位置维护当前的 OpenClaw Box 演练：
[OpenClaw Setup](https://upstash.com/docs/box/guides/openclaw-setup)。

## 使用 SSH 隧道连接

将 OpenClaw 仪表盘端口转发到你的本地机器。提示时使用你的 Box API key
作为 SSH 密码：

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

这些 keepalive 选项可以减少新手引导期间空闲隧道断开。

## 安装 OpenClaw

在 Box 内部：

```bash
sudo npm install -g openclaw
```

## 运行新手引导

```bash
openclaw onboard --install-daemon
```

按照提示操作。新手引导完成后，复制仪表盘 URL 和令牌。

## 启动 Gateway 网关

为 Box 网络配置 Gateway 网关，并在后台启动它：

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

保持 SSH 隧道处于活动状态，在本地打开仪表盘 URL：

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自动重启

将此命令设置为 Box init script，以便 Gateway 网关在 Box 启动时重启：

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 故障排除

如果 SSH 在新手引导期间卡住，请使用干净的 SSH 配置和 keepalive 重新连接：

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

这会绕过过期的本地 `~/.ssh/config` 设置，并在网络空闲期间保持隧道处于活动状态。

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [Gateway 网关安全](/zh-CN/gateway/security)
- [更新 OpenClaw](/zh-CN/install/updating)
