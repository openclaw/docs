---
read_when:
    - 将 OpenClaw 部署到 Upstash Box
    - 你需要一个用于 OpenClaw 的托管 Linux 环境，并通过 SSH 隧道访问仪表板
summary: 在 Upstash Box 上托管 OpenClaw，并启用保活和 SSH 隧道访问
title: Upstash Box
x-i18n:
    generated_at: "2026-07-05T11:25:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

在 Upstash Box 上运行持久化的 OpenClaw Gateway 网关，这是一个托管式 Linux 环境，支持 keep-alive 生命周期。

使用 SSH 隧道访问控制面板。不要将 Gateway 网关端口直接暴露到公网。

## 前提条件

- Upstash 账号
- Keep-alive Upstash Box
- 本地机器上的 SSH 客户端

## 创建 Box

在 Upstash Console 中创建一个 keep-alive Box。记下 Box ID（例如 `right-flamingo-14486`）和你的 Box API key。

Upstash 在以下位置维护当前的 OpenClaw Box 操作指南：
[OpenClaw 设置](https://upstash.com/docs/box/guides/openclaw-setup)。

## 使用 SSH 隧道连接

将 OpenClaw 控制面板端口转发到你的本地机器。出现提示时，使用你的 Box API key 作为 SSH 密码：

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

keepalive 选项可减少新手引导期间空闲隧道断开的情况。

## 安装 OpenClaw

在 Box 内：

```bash
sudo npm install -g openclaw
```

## 运行新手引导

```bash
openclaw onboard --install-daemon
```

按照提示操作。新手引导完成后，复制控制面板 URL 和 token。

## 启动 Gateway 网关

为 Box 网络配置 Gateway 网关，并在后台启动它：

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

在 SSH 隧道处于活动状态时，在本地打开控制面板 URL：

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自动重启

将此命令设置为 Box init 脚本，以便 Gateway 网关在 Box 启动时重新启动：

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 故障排查

如果 SSH 在新手引导期间卡住，请使用干净的 SSH 配置和 keepalive 重新连接：

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

这会绕过过时的本地 `~/.ssh/config` 设置，并在网络空闲期间保持隧道活动。

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [Gateway 网关安全](/zh-CN/gateway/security)
- [更新 OpenClaw](/zh-CN/install/updating)
