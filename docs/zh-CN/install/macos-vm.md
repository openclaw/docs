---
read_when:
    - 你希望 OpenClaw 与你的主 macOS 环境隔离
    - 你希望在沙箱中集成 iMessage（BlueBubbles）
    - 你希望拥有一个可重置、可克隆的 macOS 环境
    - 你希望比较本地和托管的 macOS VM 方案
summary: 当你需要隔离或 iMessage 时，在沙箱化的 macOS VM（本地或托管）中运行 OpenClaw
title: macOS VM
x-i18n:
    generated_at: "2026-04-05T08:27:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# 在 macOS VM 上运行 OpenClaw（沙箱隔离）

## 推荐默认方案（适合大多数用户）

- **小型 Linux VPS**，用于始终在线的 Gateway 网关，成本也较低。参见 [VPS 托管](/vps)。
- **专用硬件**（Mac mini 或 Linux 主机），如果你希望获得完全控制权以及用于浏览器自动化的**住宅 IP**。许多网站会屏蔽数据中心 IP，因此本地浏览通常效果更好。
- **混合方案：** 将 Gateway 网关保留在廉价 VPS 上，并在需要浏览器/UI 自动化时将你的 Mac 连接为一个**节点**。参见 [Nodes](/nodes) 和 [Gateway remote](/gateway/remote)。

当你明确需要 macOS 独有能力（iMessage/BlueBubbles），或希望与你日常使用的 Mac 严格隔离时，再使用 macOS VM。

## macOS VM 方案

### 在你的 Apple Silicon Mac 上运行本地 VM（Lume）

使用 [Lume](https://cua.ai/docs/lume) 在你现有的 Apple Silicon Mac 上的沙箱化 macOS VM 中运行 OpenClaw。

这样你将获得：

- 隔离状态下的完整 macOS 环境（你的宿主机保持干净）
- 通过 BlueBubbles 支持 iMessage（在 Linux/Windows 上无法实现）
- 通过克隆 VM 实现即时重置
- 无需额外硬件或云成本

### 托管 Mac 提供商（云端）

如果你希望在云端使用 macOS，托管 Mac 提供商也可以：

- [MacStadium](https://www.macstadium.com/)（托管 Mac）
- 其他托管 Mac 厂商也同样可行；请遵循它们的 VM + SSH 文档

一旦你获得了 macOS VM 的 SSH 访问权限，就可以从下面的第 6 步继续。

---

## 快速路径（Lume，适合有经验的用户）

1. 安装 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成设置助理，启用 Remote Login（SSH）
4. `lume run openclaw --no-display`
5. SSH 登录，安装 OpenClaw，配置渠道
6. 完成

---

## 所需内容（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- 宿主机运行 macOS Sequoia 或更高版本
- 每个 VM 约 60 GB 可用磁盘空间
- 约 20 分钟

---

## 1）安装 Lume

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

## 2）创建 macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

这会下载 macOS 并创建 VM。VNC 窗口会自动打开。

注意：下载时间可能会根据你的网络连接而有所不同。

---

## 3）完成设置助理

在 VNC 窗口中：

1. 选择语言和地区
2. 跳过 Apple ID（如果你之后想使用 iMessage，也可以登录）
3. 创建一个用户账户（记住用户名和密码）
4. 跳过所有可选功能

设置完成后，启用 SSH：

1. 打开 System Settings → General → Sharing
2. 启用 “Remote Login”

---

## 4）获取 VM IP 地址

```bash
lume get openclaw
```

查找 IP 地址（通常是 `192.168.64.x`）。

---

## 5）通过 SSH 登录到 VM

```bash
ssh youruser@192.168.64.X
```

将 `youruser` 替换为你创建的账户，将 IP 替换为你的 VM IP。

---

## 6）安装 OpenClaw

在 VM 内部：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

按照新手引导提示设置你的模型 provider（Anthropic、OpenAI 等）。

---

## 7）配置渠道

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

## 8）以无头模式运行 VM

停止 VM，然后以无显示模式重新启动：

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM 会在后台运行。OpenClaw 的守护进程会保持 gateway 运行。

检查状态：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 额外加分：iMessage 集成

这是在 macOS 上运行的杀手级功能。使用 [BlueBubbles](https://bluebubbles.app) 将 iMessage 添加到 OpenClaw 中。

在 VM 内部：

1. 从 bluebubbles.app 下载 BlueBubbles
2. 使用你的 Apple ID 登录
3. 启用 Web API 并设置密码
4. 将 BlueBubbles webhook 指向你的 gateway（例如：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）

将以下内容添加到你的 OpenClaw 配置中：

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

重启 gateway。现在你的智能体就可以发送和接收 iMessage 了。

完整设置细节： [BlueBubbles 渠道](/channels/bluebubbles)

---

## 保存黄金镜像

在继续进行更多自定义之前，先为干净状态创建快照：

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

可随时重置：

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 运行

保持 VM 持续运行的方法：

- 让你的 Mac 保持接通电源
- 在 System Settings → Energy Saver 中禁用睡眠
- 如有需要，可使用 `caffeinate`

如果你需要真正始终在线的环境，可以考虑专用 Mac mini 或小型 VPS。参见 [VPS 托管](/vps)。

---

## 故障排除

| 问题                  | 解决方案                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| 无法通过 SSH 登录到 VM        | 检查 VM 的 System Settings 中是否已启用 “Remote Login”                            |
| VM IP 未显示        | 等待 VM 完全启动后，再次运行 `lume get openclaw`                           |
| 找不到 Lume 命令   | 将 `~/.local/bin` 添加到你的 PATH                                                    |
| WhatsApp 二维码无法扫描 | 运行 `openclaw channels login` 时，请确保你登录的是 VM，而不是宿主机 |

---

## 相关文档

- [VPS 托管](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles 渠道](/channels/bluebubbles)
- [Lume 快速开始](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 参考](https://cua.ai/docs/lume/reference/cli-reference)
- [无人值守 VM 设置](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（高级）
- [Docker 沙箱隔离](/install/docker)（另一种隔离方案）
