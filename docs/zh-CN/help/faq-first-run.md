---
read_when:
    - 全新安装、新手引导卡住或首次运行错误
    - 选择凭证和提供商订阅
    - 无法访问 docs.openclaw.ai、无法打开仪表板、安装卡住
sidebarTitle: First-run FAQ
summary: 常见问题：快速开始和首次运行设置 — 安装、引导设置、凭证、订阅、初始故障
title: 常见问题：首次运行设置
x-i18n:
    generated_at: "2026-07-05T11:22:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d84968e13ae48ff730e0107363d4d44abc644b9dccf12d05888f1c51ed1ed5
    source_path: help/faq-first-run.md
    workflow: 16
---

  快速开始和首次运行问答。关于日常操作、模型、凭证、会话和故障排除，请参阅主 [常见问题](/zh-CN/help/faq)。

  ## 快速开始和首次运行设置

  <AccordionGroup>
  <Accordion title="我卡住了，最快的解决问题方法">
    使用一个可以**看到你的机器**的本地 AI 智能体。大多数“我卡住了”的情况都是远程帮助者无法检查的**本地配置或环境问题**，所以这比在 Discord 中提问更有效。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    通过可修改的（git）安装把完整源码检出交给智能体，这样它就能读取代码 + 文档，并根据你运行的确切版本进行推理：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    让智能体逐步规划并监督修复，然后只执行必要的命令 - 更小的 diff 更容易审计。

    请求帮助时（在 Discord 或 GitHub issue 中）请分享这些输出：

    | 命令 | 显示内容 |
    | --- | --- |
    | `openclaw status` | Gateway 网关/智能体健康 + 基础配置快照 |
    | `openclaw status --all` | 完整只读诊断，可直接粘贴 |
    | `openclaw models status` | 提供商凭证 + 模型可用性 |
    | `openclaw doctor` | 验证并修复常见配置/状态问题 |
    | `openclaw logs --follow` | 实时日志尾部 |
    | `openclaw gateway status --deep` | 深度 Gateway 网关/配置/插件健康检查 |
    | `openclaw health --verbose` | 详细健康报告 |

    发现了真实 bug 或修复？提交 issue 或发送 PR：
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls)。

    快速调试循环：[如果有什么坏了，最初的六十秒](/zh-CN/help/faq#first-60-seconds-if-something-is-broken)。
    安装文档：[Install](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。跳过原因是什么意思？">
    | 跳过原因 | 含义 |
    | --- | --- |
    | `quiet-hours` | 不在已配置的活跃时段窗口内 |
    | `empty-heartbeat-file` | `HEARTBEAT.md` 存在，但只包含空白、注释、标题、围栏或空清单脚手架 |
    | `no-tasks-due` | 任务模式已启用，但还没有到期的任务间隔 |
    | `alerts-disabled` | 所有 Heartbeat 可见性都已关闭（`showOk`、`showAlerts` 和 `useIndicator` 都已禁用） |

    在任务模式下，到期时间戳只会在一次真实的 Heartbeat 运行完成后推进。
    被跳过的运行不会把任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化](/zh-CN/automation)。

  </Accordion>

  <Accordion title="推荐的 OpenClaw 安装和设置方式">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    从源码安装（贡献者/开发）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    还没有全局安装？改运行 `pnpm openclaw onboard`。如果缺少 Control UI 资源，新手引导会尝试自行构建它们，并回退到 `pnpm ui:build`。

  </Accordion>

  <Accordion title="新手引导后如何打开仪表盘？">
    新手引导会在设置完成后立即把浏览器打开到一个干净的（非 token 化）仪表盘 URL，并在摘要中打印链接。保持该标签页打开；如果它没有启动，请在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 和远程环境中认证仪表盘？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请把已配置的 token 或密码粘贴到 Control UI 设置中。
    - Token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 还没有配置共享密钥？运行 `openclaw doctor --generate-gateway-token`（或 `openclaw doctor --fix --generate-gateway-token`）。

    **不在 localhost 上：**

    - **Tailscale Serve**（推荐）：保持绑定到 local loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。在 `gateway.auth.allowTailscale: true` 下，身份标头会满足 Control UI/WebSocket 认证（无需粘贴共享密钥，前提是假设 Gateway 网关主机可信）；除非你有意使用 private-ingress `none` 或 trusted-proxy HTTP 认证，否则 HTTP API 仍需要共享密钥认证。
      来自同一客户端的并发错误认证 Serve 尝试会在失败认证限制器记录它们之前被串行化，所以第二次错误重试可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，在仪表盘设置中粘贴匹配的共享密钥。
    - **身份感知反向代理**：把 Gateway 网关放在可信代理后面，设置 `gateway.auth.mode: "trusted-proxy"`，打开代理 URL。同主机 local loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback: true`。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然后打开 `http://127.0.0.1:18789/`。共享密钥认证仍然适用于隧道；如果出现提示，请粘贴已配置的 token 或密码。

    有关绑定模式和认证详情，请参阅 [仪表盘](/zh-CN/web/dashboard) 和 [Web 表面](/zh-CN/web)。

  </Accordion>

  <Accordion title="为什么聊天审批有两个 exec 审批配置？">
    它们控制不同层：

    - `approvals.exec` - 将审批提示转发到聊天目标。
    - `channels.<channel>.execApprovals` - 让该渠道成为 exec 审批的原生审批客户端。

    主机 exec 策略仍然是真正的审批门禁；聊天配置只控制提示出现在哪里，以及人们如何回答。

    你很少需要两者同时使用：

    - 如果聊天已经支持命令和回复，同一聊天中的 `/approve` 会通过共享路径工作。
    - 当受支持的原生渠道可以安全推断审批人时，如果 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`，OpenClaw 会自动启用 DM 优先的原生审批。
    - 当原生审批卡片/按钮可用时，该 UI 是主要方式；只有在工具结果说明聊天审批不可用时，才提及手动 `/approve` 命令。
    - 只有当提示还必须到达其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 只有当你希望审批提示发回原始房间/主题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批是独立的：默认同一聊天 `/approve`，可选 `approvals.plugin` 转发，并且只有部分原生渠道也会保留这些审批的原生处理。

    简短版本：转发用于路由，原生客户端配置用于更丰富的渠道特定用户体验。
    参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **22.19+**（推荐 Node 24）。`pnpm` 是仓库包管理器。
    不推荐将 Bun 用于 Gateway 网关。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以，但先检查 RAM：Pi 5 和 Pi 4（2 GB+）最合适；Pi 3B+（1 GB）可用但较慢；不推荐 Pi Zero 2 W（512 MB）。

    | 型号 | RAM | 适配度 |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | 最佳 |
    | Pi 4 | 4 GB | 良好 |
    | Pi 4 | 2 GB | 可以，添加 swap |
    | Pi 4 | 1 GB | 紧张 |
    | Pi 3B+ | 1 GB | 较慢 |
    | Pi Zero 2 W | 512 MB | 不推荐 |

    绝对最低要求：1 GB RAM、1 个核心、500 MB 可用磁盘、64 位 OS。由于 Pi 只运行 Gateway 网关（模型会调用云 API），即使普通的 Pi 也能承受负载。

    小型 Pi/VPS 也可以只托管 Gateway 网关，同时你可以在笔记本/手机上配对**节点**，用于本地屏幕/摄像头/canvas 或命令执行。参阅 [节点](/zh-CN/nodes)。

    完整设置演练：[Raspberry Pi](/zh-CN/install/raspberry-pi)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么提示？">
    - 使用 **64 位** OS；不要使用 32 位 Raspberry Pi OS。
    - 在 2 GB 或更小的板子上添加 swap。
    - 优先使用 **USB SSD** 而不是 SD 卡，以获得更好的性能和寿命。
    - 优先使用可修改的（git）安装，这样你可以查看日志并快速更新。
    - 开始时不要启用渠道/Skills，逐个添加。
    - 奇怪的二进制失败（“exec format error”）通常是可选 Skills 工具缺少 ARM64 构建。

    完整指南：[Raspberry Pi](/zh-CN/install/raspberry-pi)。另见 [Linux](/zh-CN/platforms/linux)。

  </Accordion>

  <Accordion title="它卡在“唤醒我的朋友”/新手引导无法孵化。现在怎么办？">
    该屏幕依赖 Gateway 网关可达并已认证。TUI 也会在第一次孵化时自动发送“醒醒，我的朋友！”。如果你看到这一行但**没有回复**，并且 token 保持为 0，说明智能体从未运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态 + 凭证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 仍然挂起？运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关在远程，请确认隧道/Tailscale 连接已启动，并且 UI 指向正确的 Gateway 网关。参阅 [远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把设置迁移到新机器而不重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、凭证配置文件、WhatsApp 凭据、会话和记忆 - 只要你复制**两个**位置，它就会让你的机器人保持完全相同。在远程模式下，Gateway 网关主机拥有会话存储和工作区。

    **重要：**如果你只把工作区提交/推送到 GitHub，你备份的是**记忆 + 引导文件**，但不是会话历史或凭证。它们位于 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关：[迁移](/zh-CN/install/migrating)、[磁盘上各内容的位置](/zh-CN/help/faq#where-things-live-on-disk)、
    [Agent 工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="在哪里查看最新版本的新内容？">
    查看 GitHub 变更日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果顶部章节是 **Unreleased**，则下一个带日期的章节就是最新已发布版本。条目分组在 **Highlights**、**Changes** 和 **Fixes** 下（需要时还会包含文档/其他章节）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    一些 Comcast/Xfinity 连接会通过 Xfinity Advanced Security 错误地阻止 `docs.openclaw.ai`。禁用它或将 `docs.openclaw.ai` 加入允许列表，然后重试。帮助我们解除阻止：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    仍然被阻止？文档已镜像到 GitHub：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 和 beta 的区别">
    **Stable** 和 **beta** 是 **npm dist-tags**，不是独立的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建（当 beta 缺失或比当前稳定版本更旧时，会回退到 `latest`）

    稳定版通常会先发布到 **beta**，然后通过一个明确的提升步骤，
    将同一版本移动到 `latest`，且不更改版本号。维护者
    也可以直接发布到 `latest`。因此，在提升之后，beta 和 stable 可能指向
    **同一版本**。

    查看变更内容：[CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)。

    关于安装一行命令，以及 beta 和 dev 的区别，请看下一个折叠面板。

  </Accordion>

  <Accordion title="如何安装 beta 版本，beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的移动头（git）；发布到 npm 时使用 dist-tag `dev`。

    一行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装器（PowerShell）：`iwr -useb https://openclaw.ai/install.ps1 | iex`

    更多细节：[开发渠道](/zh-CN/install/development-channels) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何尝试最新内容？">
    两个选项：

    1. **Dev 渠道（现有安装）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 的 git checkout，在 upstream 上 rebase、构建，并从该 checkout
    安装 CLI。

    2. **可修改（git）安装（新机器）：**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更推荐手动 clone：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[Update](/zh-CN/cli/update)、[开发渠道](/zh-CN/install/development-channels)、[安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多久？">
    粗略参考：

    - **安装：** 2-5 分钟。
    - **QuickStart 新手引导：** 几分钟（loopback gateway、自动 token、默认工作区）。
    - **高级/完整新手引导：** 当提供商登录、渠道配对、daemon 安装、网络下载或 skills 需要额外设置时会更久。

    向导会在开始时显示这个时间线。你可以跳过可选步骤，稍后用
    `openclaw configure` 返回继续。

    卡住了？请看上面的 [我卡住了](#quick-start-and-first-run-setup)。

  </Accordion>

  <Accordion title="安装器卡住了？如何获取更多反馈？">
    使用 `--verbose` 重新运行：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` 没有专用的 verbose 开关；请改用 `Set-PSDebug -Trace 1` /
    `-Trace 0` 包裹它。完整标志参考：[安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示找不到 git，或无法识别 openclaw">
    两个常见的 Windows 问题：

    **1) npm error spawn git / git not found**

    - 安装 **Git for Windows**，确保 `git` 位于 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2) 安装后无法识别 openclaw**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查它：`npm config get prefix`。
    - 将该目录添加到你的用户 PATH（不需要 `\bin` 后缀；在大多数系统上是 `%AppData%\npm`）。
    - 关闭并重新打开 PowerShell。

    更喜欢桌面应用？使用 **Windows Hub**。仅终端设置：PowerShell
    安装器和 WSL2 Gateway 网关路径都受支持。文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文 - 我该怎么办？">
    这通常是原生 Windows shell 的控制台代码页不匹配。

    症状：`system.run`/`exec` 输出将中文渲染为乱码；同一命令
    在另一个终端配置文件中显示正常。

    PowerShell 中的解决方法：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    然后重启 Gateway 网关并重试：

    ```powershell
    openclaw gateway restart
    ```

    在最新 OpenClaw 上仍能复现？跟踪/报告它：[Issue #30640](https://github.com/openclaw/openclaw/issues/30640)。

  </Accordion>

  <Accordion title="文档没有回答我的问题 - 如何获得更好的答案？">
    使用可修改（git）安装，这样你就能在本地获得完整源码和文档，然后
    从该文件夹让你的 bot（或 Claude/Codex）回答，这样它可以读取 repo 并给出精确答案。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节：[安装](/zh-CN/install) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    - Linux 快速路径 + 服务安装：[Linux](/zh-CN/platforms/linux)。
    - 完整演练：[入门指南](/zh-CN/start/getting-started)。
    - 安装器 + 更新：[安装与更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。安装到服务器上，然后通过 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway 远程](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云/VPS 安装指南在哪里？">
    包含常见提供商的托管中心：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一处）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    在云端，**Gateway 网关运行在服务器上**，你通过 Control UI（或 Tailscale/SSH）
    从笔记本电脑/手机访问它。你的状态 + 工作区位于服务器上，因此
    请将该主机视为事实来源并进行备份。

    将 **节点**（Mac/iOS/Android/headless）配对到该云端 Gateway 网关，用于在 Gateway 网关
    保持在云端时，在你的笔记本电脑上执行本地屏幕/相机/canvas 或命令执行。

    中心：[平台](/zh-CN/platforms)。远程访问：[Gateway 远程](/zh-CN/gateway/remote)。
    节点：[节点](/zh-CN/nodes)，[节点 CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="可以让 OpenClaw 更新自己吗？">
    可以，但不推荐。更新流程可能会重启 Gateway 网关（导致活动
    会话断开），可能需要干净的 git checkout，并且可能提示确认。
    更安全的做法是由操作员从 shell 运行更新。

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    从智能体自动化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[Update](/zh-CN/cli/update)，[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际会做什么？">
    `openclaw onboard` 是推荐的设置路径。在 **本地模式** 中，它会依次完成：

    1. **模型/凭证** - 提供商 OAuth、API key 或手动凭证（包括 LM Studio 这类本地选项）；选择默认模型。
    2. **工作区** - 位置 + 引导文件。
    3. **Gateway 网关** - 端口、绑定地址、凭证模式、Tailscale 暴露。
    4. **渠道** - 内置和官方插件聊天渠道：iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
    5. **Daemon** - LaunchAgent（macOS）、systemd 用户单元（Linux/WSL2）或原生 Windows Scheduled Task。
    6. **健康检查** - 启动 Gateway 网关并验证它正在运行。
    7. **Skills** - 安装推荐的 skills 和可选依赖。

    它会在开始时设置时长预期，并在配置的模型未知或缺少凭证时发出警告。
    完整拆解：[新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。使用 **API key**（Anthropic/OpenAI/其他）或 **仅本地模型**
    运行 OpenClaw，这样你的数据会留在你的设备上。订阅（Claude Pro/Max、ChatGPT/Codex）
    是认证这些提供商的可选方式。

    对 Anthropic 而言：**API key** 提供标准按量付费；**Claude CLI**
    会复用同一主机上的现有 Claude Code 登录。Anthropic 目前将
    Claude CLI 的非交互式 `claude -p` 路径视为 Agent SDK/程序化使用，
    仍会消耗你订阅方案的限额 - 在依赖订阅行为前，请查看当前 Anthropic 计费
    文档。对于长期运行的 Gateway 网关主机和共享
    自动化，Anthropic API key 是更可预测的选择。

    OpenAI Codex OAuth（ChatGPT/Codex 订阅）完全支持用于智能体模型。
    OpenClaw 也支持托管的订阅式选项，包括 **Qwen Cloud
    Coding Plan**、**MiniMax Coding Plan** 和 **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax)、[Z.AI (GLM)](/zh-CN/providers/zai)、
    [本地模型](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="可以不用 API key 而使用 Claude Max 订阅吗？">
    可以。OpenClaw 支持为 Pro/Max/Team/Enterprise 方案复用 Claude CLI。Anthropic
    目前将 OpenClaw 使用的 `claude -p` 路径视为受你的方案限额约束的订阅方案使用，
    而不是单独的免费额度 - 请看
    [Anthropic](/zh-CN/providers/anthropic)，了解当前计费细节和指向
    Anthropic 自己支持文章的链接。对于最可预测的服务器端设置，请改用
    Anthropic API key。
  </Accordion>

  <Accordion title="支持 Claude 订阅凭证（Claude Pro 或 Max）吗？">
    支持，通过复用 Claude CLI。Anthropic 对 `claude -p`/Agent SDK 使用的计费处理
    曾随时间变化；在依赖特定计费行为之前，请看 [Anthropic](/zh-CN/providers/anthropic)
    了解当前状态，以及指向 Anthropic 支持文章的带日期链接。

    Anthropic setup-token 凭证仍然也是受支持的 token 路径，但 OpenClaw 更推荐
    在可用时复用 Claude CLI 和 `claude -p`。对于生产或多用户
    工作负载，Anthropic API key 仍然是更安全、更可预测的选择。其他
    订阅式托管选项：[OpenAI](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[Z.AI (GLM)](/zh-CN/providers/zai)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="为什么会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
    你当前窗口的 **Anthropic 配额/速率限制** 已耗尽。在 **Claude
    CLI** 上，请等待窗口重置或升级你的方案。在 **Anthropic API key** 上，
    请在 Anthropic Console 中检查用量/计费，并按需提高限制。

    如果消息明确是 `Extra usage is required for long context requests`，
    表示该请求正在尝试使用 Anthropic 的 1M 上下文窗口（具备 GA 能力的 1M Claude 4.x
    模型，或旧版 `params.context1m: true` 配置），而你当前的凭证不符合长上下文计费资格。

    设置一个**回退模型**，这样当某个提供商受到速率限制时，OpenClaw 仍会继续回复。
    请参阅 [Models](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [Anthropic 429 长上下文需要额外用量](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="是否支持 AWS Bedrock？">
    支持。OpenClaw 内置了 **Amazon Bedrock (Converse)** 提供商。当存在 AWS 环境
    标记（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、`AWS_BEARER_TOKEN_BEDROCK`）时，
    OpenClaw 会自动启用隐式 Bedrock 提供商用于模型发现；否则请设置
    `plugins.entries.amazon-bedrock.config.discovery.enabled: true`，或添加手动
    提供商条目。请参阅 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [模型提供商](/zh-CN/providers/models)。
    如果你偏好托管式密钥流程，在 Bedrock 前面使用兼容 OpenAI 的代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 凭证如何工作？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Codex**。默认设置使用 `openai/gpt-5.5`：
    ChatGPT/Codex 订阅凭证加原生 Codex 应用服务器执行。旧版带 Codex 前缀的模型引用属于旧版配置，
    可由 `openclaw doctor --fix` 修复。直接 OpenAI API 密钥访问仍可用于非 Agent 的
    OpenAI API 表面，并且通过有序的 `openai` API 密钥配置文件，也可用于 Agent 模型。
    请参阅 [模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍会提到旧版 OpenAI Codex 前缀？">
    `openai` 是当前用于 OpenAI API 密钥和 ChatGPT/Codex OAuth 的提供商与凭证配置文件 id -
    OpenAI Codex 已合并其中。你可能仍会在较旧配置和迁移警告中看到旧版
    `openai-codex` 前缀：

    - `openai/gpt-5.5` = 使用原生 Codex runtime 处理 Agent 轮次的 ChatGPT/Codex 订阅凭证。
    - 旧版 `openai-codex/*` 模型引用 = 由 `openclaw doctor --fix` 修复的旧版路由。
    - `openai/gpt-5.5` 加有序的 `openai` API 密钥配置文件 = OpenAI Agent 模型的 API 密钥凭证。
    - 旧版 `openai-codex` 凭证配置文件 id = 由 `openclaw doctor --fix` 迁移的旧版 id。

    想使用直接 OpenAI Platform 计费？设置 `OPENAI_API_KEY`。想使用 ChatGPT/Codex
    订阅凭证？运行 `openclaw models auth login --provider openai`。保持模型引用为
    `openai/gpt-5.5`；旧版带 Codex 前缀的引用正是 `openclaw doctor --fix` 会重写的内容。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额会不同于 ChatGPT 网页版？">
    Codex OAuth 使用由 OpenAI 管理、依套餐而定的配额窗口，这些窗口可能不同于同一账户下
    ChatGPT 网站/应用的体验。

    `openclaw models status` 会显示当前可见的提供商用量/配额窗口，但不会虚构或规范化
    ChatGPT 网页版权益为直接 API 访问。对于直接 OpenAI Platform 计费/限制路径，请使用带 API 密钥的 `openai/*`。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅凭证（Codex OAuth）吗？">
    支持，完整支持。OpenAI 明确允许在 OpenClaw 这类外部工具/工作流中使用订阅 OAuth。
    新手引导可以为你运行 OAuth 流程。

    请参阅 [OAuth](/zh-CN/concepts/oauth)、[模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用**插件凭证流程**，而不是 `openclaw.json` 中的客户端 id 或密钥。

    1. 在本地安装 Gemini CLI，使 `gemini` 位于 `PATH`：
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google/gemini-3.1-pro-preview`（运行时 `google-gemini-cli`）
    5. 登录后请求失败？在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`，然后重试。

    OAuth 令牌存储在 Gateway 网关主机上的凭证配置文件中。详情：[Google](/zh-CN/providers/google)、[模型提供商](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合随意聊天吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小显存卡会截断上下文，并跳过提供商侧安全过滤器。
    如果必须使用，请在本地运行你能运行的**最大**模型构建（LM Studio）- 参阅 [本地模型](/zh-CN/gateway/local-models)。
    更小/量化模型会提高提示注入风险 - 参阅 [安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何将托管模型流量限制在特定区域？">
    选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；选择美国托管变体即可将数据保留在区域内。
    你仍然可以用 `models.mode: "merge"` 同时列出 Anthropic/OpenAI，这样在尊重你所选区域化提供商的同时，
    回退仍保持可用。
  </Accordion>

  <Accordion title="我必须买一台 Mac Mini 才能安装吗？">
    不需要。OpenClaw 可在 macOS 或 Linux 上运行（Windows 通过 WSL2）。Mac mini 是常见的
    常开主机选择，但小型 VPS、家用服务器或 Raspberry Pi 级别的设备也可以。

    你只在使用 **macOS 专属工具**时需要 Mac。对于 iMessage，请在任何已登录 Messages 的 Mac 上将
    [iMessage](/zh-CN/channels/imessage) 与 `imsg` 搭配使用 - 如果 Gateway 网关运行在 Linux 或其他地方，
    请将 `channels.imessage.cliPath` 设置为在该 Mac 上运行 `imsg` 的 SSH 包装器。对于其他
    macOS 专属工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS 节点。

    文档：[iMessage](/zh-CN/channels/imessage)、[节点](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 支持需要 Mac mini 吗？">
    你需要**某台 macOS 设备**已登录 Messages - 不一定是 Mac mini，任何 Mac 都可以。
    将 [iMessage](/zh-CN/channels/imessage) 与 `imsg` 搭配使用；Gateway 网关可以运行在那台
    Mac 上，也可以在其他地方运行并使用 SSH 包装器 `cliPath`。

    常见设置：

    - Gateway 网关在 Linux/VPS 上运行，`channels.imessage.cliPath` 设置为一个 SSH 包装器，该包装器会在已登录 Messages 的 Mac 上运行 `imsg`。
    - 为获得最简单的单机设置，将所有内容都放在一台 Mac 上。

    文档：[iMessage](/zh-CN/channels/imessage)、[节点](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，你的 MacBook Pro 则作为**节点**
    （配套设备）连接。节点不运行 Gateway 网关 - 它们会添加诸如
    screen/camera/canvas 和该设备上的 `system.run` 等能力。

    常见模式：Gateway 网关运行在常开的 Mac mini 上；MacBook Pro 运行 macOS 应用或
    节点主机，并与 Gateway 网关配对。使用 `openclaw nodes status` / `openclaw nodes list` 检查。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 吗？">
    不推荐 - Bun 存在运行时错误，尤其是 WhatsApp 和 Telegram 相关问题。稳定的 Gateway 网关请使用
    **Node**。如果你仍想试验，请在不含 WhatsApp/Telegram 的非生产 Gateway 网关上进行。
  </Accordion>

  <Accordion title="Telegram：allowFrom 中应该填什么？">
    `channels.telegram.allowFrom` 是**真人发送者的 Telegram 用户 ID**（数字），
    不是 bot 用户名。设置过程只会要求数字用户 ID；`openclaw doctor --fix`
    可以尝试解析旧版 `@username` 条目。

    更安全（无第三方 bot）：给你的 bot 发私信，运行 `openclaw logs --follow`，读取 `from.id`。

    官方 Bot API：给你的 bot 发私信，调用 `https://api.telegram.org/bot<bot_token>/getUpdates`，读取 `message.from.id`。

    第三方（隐私性较低）：给 `@userinfobot` 或 `@getidsbot` 发私信。

    请参阅 [Telegram 访问控制](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人可以用同一个 WhatsApp 号码搭配不同的 OpenClaw 实例吗？">
    可以，通过**多 Agent 路由**实现。将每个发送者的 WhatsApp 私信（`peer: { kind: "direct", id: "+15551234567" }`）
    绑定到不同的 `agentId`，让每个人拥有自己的工作区和会话存储。回复仍会来自**同一个 WhatsApp 账号**；
    私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）按账号全局生效。
    请参阅 [多 Agent 路由](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以运行一个“快速聊天”Agent 和一个“用于编码的 Opus”Agent 吗？'>
    可以。使用多 Agent 路由：为每个 Agent 设置自己的默认模型，然后将入站
    路由（提供商账号或特定对端）绑定到各个 Agent。配置示例：
    [多 Agent 路由](/zh-CN/concepts/multi-agent)。另请参阅 [Models](/zh-CN/concepts/models) 和
    [配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上工作吗？">
    可以，通过 Linuxbrew：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    通过 systemd 运行 OpenClaw：确保服务 PATH 包含
    `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），以便 `brew` 安装的工具
    能在非登录 shell 中解析。近期构建还会在 Linux systemd 服务上预置常见用户 bin 目录
    （例如 `~/.local/bin`、`~/.npm-global/bin`、
    `~/.local/share/pnpm`、`~/.bun/bin`），并在设置了
    `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR` 时遵循它们。

  </Accordion>

  <Accordion title="可修改的 git 安装与 npm 安装的区别">
    - **可修改（git）安装：**完整源码 checkout，可编辑，最适合贡献者。你可以在本地构建并修补代码/文档。
    - **npm 安装：**全局 CLI 安装，无仓库，最适合“直接运行”。更新来自 npm dist-tags。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="以后可以在 npm 和 git 安装之间切换吗？">
    可以，在现有安装上使用 `openclaw update --channel ...`。这**不会删除你的数据** -
    只会更改 OpenClaw 代码安装。状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）保持不变。

    npm 到 git：

    ```bash
    openclaw update --channel dev
    ```

    git 到 npm：

    ```bash
    openclaw update --channel stable
    ```

    添加 `--dry-run` 可先预览计划的模式切换。更新器会运行 Doctor
    后续操作，刷新目标频道的插件源，并重启 Gateway 网关，除非你传入 `--no-restart`。

    安装器也可以强制使用任一模式：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    备份提示：[磁盘上的内容位置](/zh-CN/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="应该在我的笔记本电脑还是 VPS 上运行 Gateway 网关？">
    想要 24/7 可靠性？使用 **VPS**。想要最低摩擦，并且你可以接受
    睡眠/重启？在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：**无服务器成本，可直接访问本地文件，有实时浏览器窗口。
    - **缺点：**睡眠/网络中断会使其断开连接，操作系统更新/重启会打断它，必须保持唤醒。

    **VPS / 云**

    - **优点：** 始终在线、网络稳定、没有笔记本睡眠问题、更容易保持运行。
    - **缺点：** 通常是无头环境（使用截图）、只能远程访问文件、更新需要 SSH。

    WhatsApp/Telegram/Slack/Mattermost/Discord 都可以从 VPS 正常工作，真正的
    取舍在于无头浏览器还是可见窗口。请参阅 [浏览器](/zh-CN/tools/browser)。

    默认建议：如果你以前遇到过 Gateway 网关断连，请使用 VPS；当你正在主动使用 Mac，并且需要本地文件访问或可见浏览器 UI
    自动化时，本地运行很适合。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必需的，但为了可靠性和隔离性，建议这样做。

    - **专用主机（VPS/Mac mini/Raspberry Pi）：** 始终在线、睡眠/重启中断更少、权限更清晰、更容易保持运行。
    - **共享笔记本/台式机：** 适合测试和主动使用，但机器睡眠或更新时会出现暂停。

    两全其美的做法：将 Gateway 网关放在专用主机上，并将你的笔记本配对为一个
    **节点**，用于本地屏幕/摄像头/exec 工具。请参阅 [节点](/zh-CN/nodes) 和 [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="VPS 的最低要求和推荐 OS 是什么？">
    - **绝对最低要求：** 1 vCPU、1 GB RAM、约 500 MB 磁盘。
    - **推荐：** 1-2 vCPU、2 GB+ RAM，以留出余量（日志、媒体、多个渠道）。节点工具和浏览器自动化可能会占用较多资源。

    OS：**Ubuntu LTS**（或任何现代 Debian/Ubuntu）- 这是经过最多测试的 Linux 安装路径。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？要求是什么？">
    可以。把 VM 当作 VPS 处理：它需要始终在线、可访问，并且有足够的 RAM
    供 Gateway 网关和你启用的任何渠道使用。

    - **绝对最低要求：** 1 vCPU、1 GB RAM。
    - **推荐：** 2 GB+ RAM，用于多个渠道、浏览器自动化或媒体工具。
    - **OS：** Ubuntu LTS 或其他现代 Debian/Ubuntu。

    在 Windows 上，使用 **Windows Hub** 进行桌面设置，或使用 WSL2 作为 Linux 风格的 Gateway 网关 VM，
    以获得广泛的工具兼容性。请参阅 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    在 VM 中运行 macOS：请参阅 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) - 主常见问题（模型、会话、Gateway 网关、安全等）
- [安装概览](/zh-CN/install)
- [入门指南](/zh-CN/start/getting-started)
- [故障排查](/zh-CN/help/troubleshooting)
