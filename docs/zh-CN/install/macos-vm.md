---
read_when:
    - 你希望 OpenClaw 与你的主要 macOS 环境隔离
    - 你想在沙箱中集成 iMessage
    - 你想要一个可重置、可克隆的 macOS 环境
    - 你想比较本地与托管的 macOS VM 选项
summary: 需要隔离或 iMessage 时，在沙箱隔离的 macOS 虚拟机（本地或托管）中运行 OpenClaw
title: macOS 虚拟机
x-i18n:
    generated_at: "2026-06-27T02:18:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## 推荐默认方案（适合大多数用户）

- **小型 Linux VPS**，用于常开 Gateway 网关且成本低。参见 [VPS 托管](/zh-CN/vps)。
- 如果你想要完全控制，并为浏览器自动化使用**住宅 IP**，请选择**专用硬件**（Mac mini 或 Linux 主机）。许多网站会屏蔽数据中心 IP，因此本地浏览通常效果更好。
- **混合方案：**将 Gateway 网关放在便宜的 VPS 上，并在需要浏览器/UI 自动化时将你的 Mac 连接为**节点**。参见 [节点](/zh-CN/nodes) 和 [Gateway 网关远程](/zh-CN/gateway/remote)。

当你明确需要 iMessage 等仅限 macOS 的能力，或想与你日常使用的 Mac 严格隔离时，请使用 macOS VM。

## macOS VM 选项

### 在你的 Apple Silicon Mac 上运行本地 VM（Lume）

使用 [Lume](https://cua.ai/docs/lume)，在你现有的 Apple Silicon Mac 上的沙箱隔离 macOS VM 中运行 OpenClaw。

这会给你：

- 隔离的完整 macOS 环境（你的宿主机保持干净）
- 通过 `imsg` 支持 iMessage（默认本地路径在 Linux/Windows 上不可用）
- 通过克隆 VM 即时重置
- 无需额外硬件或云成本

### 托管 Mac 提供商（云）

如果你想在云端使用 macOS，托管 Mac 提供商也可以：

- [MacStadium](https://www.macstadium.com/)（托管 Mac）
- 其他托管 Mac 供应商也可使用；按照他们的 VM + SSH 文档操作

获得 macOS VM 的 SSH 访问权限后，从下面的第 6 步继续。

---

## 快速路径（Lume，适合有经验的用户）

1. 安装 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成设置助理，启用远程登录（SSH）
4. `lume run openclaw --no-display`
5. 通过 SSH 登录，安装 OpenClaw，配置渠道
6. 完成

---

## 你需要准备什么（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- 宿主机运行 macOS Sequoia 或更高版本
- 每个 VM 约 60 GB 可用磁盘空间
- 约 20 分钟

---

## 1) 安装 Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

如果 `~/.local/bin` 不在你的 PATH 中：

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

验证：

```bash
lume --version
```

文档：[Lume 安装](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) 创建 macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

这会下载 macOS 并创建 VM。VNC 窗口会自动打开。

<Note>
下载可能需要一段时间，具体取决于你的网络连接。
</Note>

---

## 3) 完成设置助理

在 VNC 窗口中：

1. 选择语言和地区
2. 跳过 Apple ID（如果你之后想使用 iMessage，也可以登录）
3. 创建用户帐户（记住用户名和密码）
4. 跳过所有可选功能

设置完成后：

1. 启用 SSH：打开系统设置 -> 通用 -> 共享，并启用“远程登录”。
2. 如需无头 VM 使用，启用自动登录：打开系统设置 -> 用户与群组，选择“自动登录为：”，并选择 VM 用户。

---

## 4) 获取 VM IP 地址

```bash
lume get openclaw
```

查找 IP 地址（通常是 `192.168.64.x`）。

---

## 5) 通过 SSH 登录 VM

```bash
ssh youruser@192.168.64.X
```

将 `youruser` 替换为你创建的帐户，并将 IP 替换为你的 VM 的 IP。

---

## 6) 安装 OpenClaw

在 VM 内：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

按照新手引导提示设置你的模型提供商（Anthropic、OpenAI 等）。

---

## 7) 配置渠道

编辑配置文件：

```bash
nano ~/.openclaw/openclaw.json
```

添加你的渠道：

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

然后登录 WhatsApp（扫描二维码）：

```bash
openclaw channels login
```

---

## 8) 无头运行 VM

停止 VM 并在无显示模式下重启：

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM 会在后台运行。OpenClaw 的守护进程会保持 Gateway 网关运行。

检查状态：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 附加：iMessage 集成

这是在 macOS 上运行的核心优势。使用带 `imsg` 的 [iMessage](/zh-CN/channels/imessage)，将信息添加到 OpenClaw。

在 VM 内：

1. 登录信息。
2. 安装 `imsg`。
3. 为运行 OpenClaw/`imsg` 的进程授予完全磁盘访问权限和自动化权限。
4. 使用 `imsg rpc --help` 验证 RPC 支持。

添加到你的 OpenClaw 配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

重启 Gateway 网关。现在你的智能体可以发送和接收 iMessage。

完整设置详情：[iMessage 渠道](/zh-CN/channels/imessage)

---

## 保存黄金镜像

在进一步自定义之前，快照保存你的干净状态：

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

随时重置：

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 运行

通过以下方式保持 VM 运行：

- 让你的 Mac 保持接通电源
- 在系统设置 → 节能中禁用睡眠
- 如有需要，使用 `caffeinate`

如需真正常开，可以考虑专用 Mac mini 或小型 VPS。参见 [VPS 托管](/zh-CN/vps)。

---

## 故障排除

| 问题                  | 解决方案                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| 无法通过 SSH 登录 VM        | 检查 VM 的系统设置中是否已启用“远程登录”                            |
| VM IP 未显示        | 等待 VM 完全启动，然后再次运行 `lume get openclaw`                           |
| 找不到 Lume 命令   | 将 `~/.local/bin` 添加到你的 PATH                                                    |
| WhatsApp 二维码无法扫描 | 运行 `openclaw channels login` 时，确保你已登录 VM（不是宿主机） |

---

## 相关文档

- [VPS 托管](/zh-CN/vps)
- [节点](/zh-CN/nodes)
- [Gateway 网关远程](/zh-CN/gateway/remote)
- [iMessage 渠道](/zh-CN/channels/imessage)
- [Lume 快速入门](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 参考](https://cua.ai/docs/lume/reference/cli-reference)
- [无人值守 VM 设置](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（高级）
- [Docker 沙箱隔离](/zh-CN/install/docker)（替代隔离方案）
