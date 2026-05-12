---
read_when:
    - 新安装、新手引导卡住或首次运行错误
    - 选择身份验证和提供商订阅
    - 无法访问 docs.openclaw.ai，无法打开仪表盘，安装卡住
sidebarTitle: First-run FAQ
summary: 常见问题：快速开始和首次运行设置 — 安装、新手引导、凭证、订阅、初始故障
title: 常见问题：首次运行设置
x-i18n:
    generated_at: "2026-05-12T00:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  快速开始和首次运行问答。有关日常操作、模型、凭证、会话和故障排除，请参阅主 [常见问题](/zh-CN/help/faq)。

  ## 快速开始和首次运行设置

  <AccordionGroup>
  <Accordion title="我卡住了，最快解决问题的方法">
    使用一个可以**查看你的机器**的本地 AI 智能体。这比在 Discord 里提问有效得多，因为大多数“我卡住了”的情况都是**本地配置或环境问题**，远程协助者无法检查。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你的机器级设置（PATH、服务、权限、凭证文件）。通过可修改的（git）安装方式，把**完整源代码检出**交给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码 + 文档，并基于你正在运行的确切版本进行推理。之后你随时可以通过不带 `--install-method git` 重新运行安装器，切回稳定版。

    提示：让智能体**规划并监督**修复（一步一步），然后只执行必要的命令。这样改动更小，也更容易审计。

    如果你发现了真实 bug 或修复方案，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    从这些命令开始（请求帮助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：快速查看 Gateway 网关/智能体健康状态 + 基础配置。
    - `openclaw models status`：检查提供商凭证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见的配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、`openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果有什么坏了，最初的六十秒](/zh-CN/help/faq#first-60-seconds-if-something-is-broken)。
    安装文档：[安装](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。跳过原因是什么意思？">
    常见的 Heartbeat 跳过原因：

    - `quiet-hours`：在配置的活跃时段窗口之外
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的脚手架
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式处于活动状态，但还没有任何任务间隔到期
    - `alerts-disabled`：所有 heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 都关闭）

    在任务模式下，到期时间戳只会在一次真实的 heartbeat 运行完成后推进。被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导也可以自动构建 UI 资源。新手引导完成后，你通常会在端口 **18789** 上运行 Gateway 网关。

    从源码安装（贡献者/开发）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    如果你还没有全局安装，请通过 `pnpm openclaw onboard` 运行。

  </Accordion>

  <Accordion title="新手引导完成后，如何打开仪表盘？">
    向导会在新手引导完成后立即用干净的（非令牌化）仪表盘 URL 打开你的浏览器，并在摘要中打印链接。保持该标签页打开；如果它没有启动，请在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 与远程环境中为仪表盘进行身份验证？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求 shared-secret auth，请把配置好的 token 或 password 粘贴到 Control UI 设置中。
    - Token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - Password 来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置 shared secret，请用 `openclaw doctor --generate-gateway-token` 生成 token。

    **不在 localhost 上：**

    - **Tailscale Serve**（推荐）：保持绑定到 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份标头会满足 Control UI/WebSocket auth（无需粘贴 shared secret，前提是假定 Gateway 网关主机可信）；HTTP API 仍然需要 shared-secret auth，除非你有意使用 private-ingress `none` 或 trusted-proxy HTTP auth。
      来自同一客户端的错误并发 Serve auth 尝试会在 failed-auth limiter 记录之前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置 password auth），打开 `http://<tailscale-ip>:18789/`，然后在仪表盘设置中粘贴匹配的 shared secret。
    - **感知身份的反向代理**：将 Gateway 网关放在受信任代理后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。同主机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。shared-secret auth 仍然适用于隧道；如果出现提示，请粘贴配置好的 token 或 password。

    有关绑定模式和 auth 详情，请参阅 [仪表盘](/zh-CN/web/dashboard) 和 [Web 表面](/zh-CN/web)。

  </Accordion>

  <Accordion title="为什么聊天审批有两个 exec 审批配置？">
    它们控制不同层：

    - `approvals.exec`：将审批提示转发到聊天目标
    - `channels.<channel>.execApprovals`：让该渠道作为 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批门禁。聊天配置只控制审批提示出现在哪里，以及人们如何回复。

    在大多数设置中，你**不**需要两者都配置：

    - 如果聊天本身已经支持命令和回复，同一聊天中的 `/approve` 会通过共享路径工作。
    - 如果受支持的原生渠道可以安全地推断审批者，当 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，OpenClaw 现在会自动启用以私信优先的原生审批。
    - 当原生审批卡片/按钮可用时，该原生 UI 是主要路径；只有当工具结果表示聊天审批不可用，或手动审批是唯一路径时，智能体才应包含手动 `/approve` 命令。
    - 只有当提示还必须转发到其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 只有当你明确希望审批提示发布回原始房间/主题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批又是另一套：默认使用同一聊天中的 `/approve`，可选 `approvals.plugin` 转发，并且只有部分原生渠道会在其上保留插件原生审批处理。

    简短版本：转发用于路由，原生客户端配置用于更丰富的渠道特定 UX。
    请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。**不推荐**将 Bun 用于 Gateway 网关。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关很轻量，文档列出的个人使用所需资源为 **512MB-1GB RAM**、**1 核**，以及大约 **500MB** 磁盘，并说明 **Raspberry Pi 4 可以运行它**。

    如果你想要额外余量（日志、媒体、其他服务），**推荐 2GB**，但这不是硬性最低要求。

    提示：小型 Pi/VPS 可以托管 Gateway 网关，你可以在笔记本电脑/手机上配对**节点**，用于本地屏幕/摄像头/canvas 或命令执行。请参阅 [节点](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议？">
    简短版本：可以工作，但可能遇到一些粗糙之处。

    - 使用 **64-bit** OS，并保持 Node >= 22。
    - 优先使用**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 先不启用渠道/Skills，然后逐个添加。
    - 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / 新手引导无法孵化。现在怎么办？">
    该屏幕依赖 Gateway 网关可访问且已通过身份验证。TUI 也会在首次孵化时自动发送“Wake up, my friend!”。如果你看到这一行但**没有回复**，并且 tokens 保持为 0，说明智能体从未运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态 + auth：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然挂起，运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关在远程，请确保隧道/Tailscale 连接已启动，并且 UI 指向正确的 Gateway 网关。请参阅 [远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把设置迁移到新机器（Mac mini）而不用重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。只要你复制**两个**位置，这就会让你的机器人保持“完全相同”（记忆、会话历史、凭证和渠道状态）：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、auth profiles、WhatsApp 凭据、会话和记忆。如果你处于远程模式，请记住 Gateway 网关主机拥有会话存储和工作区。

    **重要：**如果你只是将工作区 commit/push 到 GitHub，你备份的是**记忆 + bootstrap 文件**，但**不是**会话历史或凭证。它们位于 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关：[迁移](/zh-CN/install/migrating)、[磁盘上各类内容的位置](/zh-CN/help/faq#where-things-live-on-disk)、[Agent 工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、[远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="在哪里查看最新版本中的新内容？">
    查看 GitHub changelog：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目在顶部。如果顶部章节标记为 **Unreleased**，下一个带日期的章节就是最新已发布版本。条目按 **Highlights**、**Changes** 和 **Fixes** 分组（需要时还会有 docs/other 等章节）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会因为 Xfinity Advanced Security 错误地阻止 `docs.openclaw.ai`。禁用它或将 `docs.openclaw.ai` 加入允许列表，然后重试。
    请在这里报告，帮助我们解除阻止：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该网站，文档也镜像在 GitHub：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 和 beta 的区别">
    **Stable** 和 **beta** 是 **npm dist-tags**，不是独立的代码线：

    - `latest` = stable
    - `beta` = 用于测试的早期构建

    通常，stable 版本会先发布到 **beta**，然后通过一个明确的
    提升步骤将同一个版本移到 `latest`。维护者也可以在需要时
    直接发布到 `latest`。这就是为什么在提升后，beta 和 stable 可能
    指向**同一个版本**。

    查看变更内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    有关安装一行命令以及 beta 和 dev 的区别，请看下方折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本，beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的移动头部（git）；发布时使用 npm dist-tag `dev`。

    一行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装器（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多细节：[开发频道](/zh-CN/install/development-channels) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何试用最新内容？">
    两个选项：

    1. **Dev 频道（git checkout）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（来自安装器站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会给你一个可编辑的本地仓库，然后可通过 git 更新。

    如果你更喜欢手动干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[更新](/zh-CN/cli/update)、[开发频道](/zh-CN/install/development-channels)、
    [安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多长时间？">
    粗略参考：

    - **安装：** 2-5 分钟
    - **新手引导：** 5-15 分钟，取决于你配置的渠道/模型数量

    如果卡住，请使用[安装器卡住](#quick-start-and-first-run-setup)
    以及[我卡住了](#quick-start-and-first-run-setup)中的快速调试循环。

  </Accordion>

  <Accordion title="安装器卡住了？如何获得更多反馈？">
    使用**详细输出**重新运行安装器：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    带详细输出的 beta 安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    对于可修改（git）安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）等效命令：

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项：[安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示找不到 git 或无法识别 openclaw">
    两个常见 Windows 问题：

    **1) npm 错误 spawn git / 找不到 git**

    - 安装 **Git for Windows**，并确保 `git` 位于你的 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2) 安装后无法识别 openclaw**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH（Windows 上无需 `\bin` 后缀；大多数系统上是 `%AppData%\npm`）。
    - 更新 PATH 后关闭并重新打开 PowerShell。

    如果你想要最顺畅的 Windows 设置，请使用 **WSL2**，而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示中文乱码 - 我该怎么办？">
    这通常是原生 Windows shell 上的控制台代码页不匹配。

    症状：

    - `system.run`/`exec` 输出将中文渲染为乱码
    - 同一命令在另一个终端配置中显示正常

    PowerShell 中的快速解决方法：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    然后重启 Gateway 网关并重试你的命令：

    ```powershell
    openclaw gateway restart
    ```

    如果你在最新 OpenClaw 上仍能复现，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题 - 如何获得更好的答案？">
    使用**可修改（git）安装**，这样你可以在本地获得完整源码和文档，然后
    从该文件夹中询问你的 bot（或 Claude/Codex），以便它读取仓库并给出准确答案。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节：[安装](/zh-CN/install) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南操作，然后运行新手引导。

    - Linux 快速路径 + 服务安装：[Linux](/zh-CN/platforms/linux)。
    - 完整演练：[入门指南](/zh-CN/start/getting-started)。
    - 安装器 + 更新：[安装与更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。在服务器上安装，然后使用 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway 网关远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云/VPS 安装指南在哪里？">
    我们维护了一个包含常见提供商的**托管中心**。选择一个并按照指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一处）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    在云中它的工作方式是：**Gateway 网关在服务器上运行**，你通过控制界面
    （或 Tailscale/SSH）从笔记本电脑/手机访问它。你的状态 + 工作区
    位于服务器上，因此请将该主机视为事实来源并做好备份。

    你可以将**节点**（Mac/iOS/Android/headless）配对到该云端 Gateway 网关，以访问
    本地屏幕/摄像头/canvas，或在笔记本电脑上运行命令，同时将
    Gateway 网关保留在云中。

    中心：[平台](/zh-CN/platforms)。远程访问：[Gateway 网关远程访问](/zh-CN/gateway/remote)。
    节点：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 更新自身吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会断开活动会话），可能需要干净的 git checkout，
    并且可能提示确认。更安全的做法是：由操作者在 shell 中运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必须从智能体自动化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[更新](/zh-CN/cli/update)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**中，它会引导你完成：

    - **模型/凭证设置**（提供商 OAuth、API keys、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + 引导文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等内置渠道插件）
    - **守护进程安装**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 用户单元）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少凭证，它也会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以使用 **API keys**（Anthropic/OpenAI/其他）运行 OpenClaw，或使用
    **仅本地模型**，让你的数据留在你的设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）是用于认证这些提供商的可选方式。

    对于 OpenClaw 中的 Anthropic，实际区别是：

    - **Anthropic API key**：普通 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅凭证**：Anthropic 员工
      告诉我们此用法已再次被允许，因此 OpenClaw 将 `claude -p`
      用法视为针对该集成已获准，除非 Anthropic 发布新
      策略

    对于长期运行的 Gateway 网关主机，Anthropic API keys 仍然是更
    可预测的设置。OpenAI Codex OAuth 明确支持 OpenClaw 等外部
    工具。

    OpenClaw 还支持其他托管订阅式选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [本地模型](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API key 的情况下使用 Claude Max 订阅吗？">
    可以。

    Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法已再次被允许，因此
    OpenClaw 将 Claude 订阅凭证和 `claude -p` 用法视为
    针对此集成已获准，除非 Anthropic 发布新策略。如果你想要
    最可预测的服务器端设置，请改用 Anthropic API key。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅凭证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 员工告诉我们此用法已再次被允许，因此 OpenClaw 将
    Claude CLI 复用和 `claude -p` 用法视为针对该集成
    已获准，除非 Anthropic 发布新策略。

    Anthropic setup-token 仍可作为受支持的 OpenClaw token 路径使用，但 OpenClaw 现在会优先复用 Claude CLI，并在可用时使用 `claude -p`。
    对于生产或多用户工作负载，Anthropic API key 凭证仍然是
    更安全、更可预测的选择。如果你想在 OpenClaw 中使用其他订阅式托管
    选项，请参阅 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [GLM
    Models](/zh-CN/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
    这意味着你的 **Anthropic 配额/速率限制**在当前窗口内已耗尽。如果你
    使用 **Claude CLI**，请等待窗口重置或升级你的套餐。如果你
    使用 **Anthropic API key**，请查看 Anthropic Console
    中的用量/计费，并按需提高限制。

    如果消息具体是：
    `Extra usage is required for long context requests`，则表示请求正在尝试使用
    Anthropic 的 1M 上下文 beta（`context1m: true`）。只有当你的
    凭证符合长上下文计费条件（API key 计费或
    启用 Extra Usage 的 OpenClaw Claude-login 路径）时，它才可用。

    提示：设置一个**备用模型**，这样当某个提供商被限速时，OpenClaw 仍可继续回复。
    参见 [Models](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="是否支持 AWS Bedrock？">
    是。OpenClaw 内置了 **Amazon Bedrock（Converse）** 提供商。当存在 AWS 环境标记时，OpenClaw 可以自动发现流式/文本 Bedrock 目录，并将其合并为隐式的 `amazon-bedrock` 提供商；否则，你可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或添加手动提供商条目。参见 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [模型提供商](/zh-CN/providers/models)。如果你更喜欢托管密钥流程，也可以在 Bedrock 前面使用兼容 OpenAI 的代理。
  </Accordion>

  <Accordion title="Codex 认证如何工作？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。常见设置请使用
    `openai/gpt-5.5`：ChatGPT/Codex 订阅认证加上
    原生 Codex 应用服务器执行。`openai-codex/gpt-*` 模型引用是
    由 `openclaw doctor --fix` 修复的旧版配置。直接 OpenAI API key
    访问仍可用于非 Agent OpenAI API 表面，以及通过有序的
    `openai-codex` API key 配置文件用于 Agent
    模型。
    参见 [模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍然提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的提供商和认证配置文件 ID。
    旧版配置也曾将它用作模型前缀：

    - `openai/gpt-5.5` = 使用原生 Codex 运行时处理 Agent 轮次的 ChatGPT/Codex 订阅认证
    - `openai-codex/gpt-5.5` = 由 `openclaw doctor --fix` 修复的旧版模型路由
    - `openai/gpt-5.5` 加上有序的 `openai-codex` API key 配置文件 = 用于 OpenAI Agent 模型的 API key 认证
    - `openai-codex:...` = 认证配置文件 ID，不是模型引用

    如果你想走直接 OpenAI Platform 计费/限额路径，请设置
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 订阅认证，请通过
    `openclaw models auth login --provider openai-codex` 登录。模型引用保持为
    `openai/gpt-5.5`；`openai-codex/*` 模型引用是旧版配置，
    `openclaw doctor --fix` 会重写它们。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额会不同于 ChatGPT 网页版？">
    Codex OAuth 使用 OpenAI 管理的、依赖套餐的配额窗口。实践中，
    这些限制可能不同于 ChatGPT 网站/应用体验，即使
    两者都绑定到同一个账号。

    OpenClaw 可以在 `openclaw models status` 中显示当前可见的提供商用量/配额窗口，
    但它不会凭空创建或规范化 ChatGPT 网页端
    权益为直接 API 访问。如果你想走直接 OpenAI Platform
    计费/限额路径，请使用带 API key 的 `openai/*`。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅认证（Codex OAuth）吗？">
    支持。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这类外部工具/工作流中使用订阅 OAuth。
    新手引导可以替你运行 OAuth 流程。

    参见 [OAuth](/zh-CN/concepts/oauth)、[模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用**插件认证流程**，不是 `openclaw.json` 中的客户端 ID 或密钥。

    步骤：

    1. 在本地安装 Gemini CLI，确保 `gemini` 位于 `PATH`
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会在 Gateway 网关主机上的认证配置文件中存储 OAuth 令牌。详情：[模型提供商](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合随意聊天吗？">
    通常不适合。OpenClaw 需要大上下文和强安全性；小卡会截断并泄漏。如果必须使用，请在本地运行你能承受的**最大**模型构建（LM Studio），并参见 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化模型会增加提示注入风险 - 参见 [安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量留在特定区域？">
    选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；选择美国托管变体即可让数据留在区域内。你仍然可以通过使用 `models.mode: "merge"` 同时列出 Anthropic/OpenAI，这样在尊重所选区域化提供商的同时，备用模型仍然可用。
  </Accordion>

  <Accordion title="我必须买一台 Mac Mini 才能安装吗？">
    不需要。OpenClaw 可在 macOS 或 Linux（Windows 通过 WSL2）上运行。Mac mini 是可选的 - 有些人
    会买一台作为始终在线的主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的设备也可以。

    只有在使用 **macOS 专用工具**时才需要 Mac。对于 iMessage，请在任何已登录“信息”的 Mac 上将 [iMessage](/zh-CN/channels/imessage) 与 `imsg` 一起使用。如果 Gateway 网关运行在 Linux 或其他地方，请将 `channels.imessage.cliPath` 设置为在那台 Mac 上运行 `imsg` 的 SSH 包装器。如果你想使用其他 macOS 专用工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS 节点。

    文档：[iMessage](/zh-CN/channels/imessage)、[节点](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 支持需要 Mac mini 吗？">
    你需要**某台 macOS 设备**登录“信息”。它**不**一定要是 Mac mini -
    任意 Mac 都可以。**使用带 `imsg` 的 [iMessage](/zh-CN/channels/imessage)**；Gateway 网关可以运行在那台 Mac 上，也可以通过 SSH 包装器 `cliPath` 在别处运行。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，并将 `channels.imessage.cliPath` 设置为在已登录“信息”的 Mac 上运行 `imsg` 的 SSH 包装器。
    - 如果你想要最简单的单机设置，就把所有东西都运行在 Mac 上。

    文档：[iMessage](/zh-CN/channels/imessage)、[节点](/zh-CN/nodes)、
    [Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，能把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不运行 Gateway 网关 - 它们提供该设备上的屏幕/摄像头/画布以及 `system.run` 等额外
    能力。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（始终在线）。
    - MacBook Pro 运行 macOS 应用或节点主机，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们看到过运行时错误，尤其是在 WhatsApp 和 Telegram 上。
    请使用 **Node** 来获得稳定的 Gateway 网关。

    如果你仍想试验 Bun，请在非生产 Gateway 网关上进行，
    并且不要启用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里应该填什么？">
    `channels.telegram.allowFrom` 是**人类发送者的 Telegram 用户 ID**（数字）。它不是机器人用户名。

    设置流程只要求输入数字用户 ID。如果你的配置中已有旧版 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全（无需第三方机器人）：

    - 私信你的机器人，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 私信你的机器人，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方（隐私性较低）：

    - 私信 `@userinfobot` 或 `@getidsbot`。

    参见 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人可以用同一个 WhatsApp 号码连接不同的 OpenClaw 实例吗？">
    可以，通过**多 Agent 路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会获得自己的工作区和会话存储。回复仍来自**同一个 WhatsApp 账号**，并且私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）在每个 WhatsApp 账号上是全局的。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多 Agent 路由：为每个智能体设置自己的默认模型，然后将入站路由（提供商账号或特定 peer）绑定到各个智能体。示例配置位于 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。另请参见 [Models](/zh-CN/concepts/models) 和 [配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可以在 Linux 上使用吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样 `brew` 安装的工具才能在非登录 shell 中解析。
    最近的构建还会在 Linux systemd 服务中前置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置了 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR` 时遵循它们。

  </Accordion>

  <Accordion title="可修改的 git 安装与 npm 安装的区别">
    - **可修改（git）安装：** 完整源码 checkout，可编辑，最适合贡献者。
      你可以在本地运行构建，并修改代码/文档。
    - **npm 安装：** 全局 CLI 安装，无仓库，最适合“直接运行”。
      更新来自 npm dist-tags。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后可以在 npm 和 git 安装之间切换吗？">
    可以。当 OpenClaw 已安装后，使用 `openclaw update --channel ...`。
    这**不会删除你的数据** - 它只会更改 OpenClaw 代码安装。
    你的状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）保持不变。

    从 npm 切换到 git：

    ```bash
    openclaw update --channel dev
    ```

    从 git 切换到 npm：

    ```bash
    openclaw update --channel stable
    ```

    添加 `--dry-run` 可先预览计划的模式切换。更新器会运行
    Doctor 后续步骤，刷新目标渠道的插件源，并
    重启 Gateway 网关，除非你传入 `--no-restart`。

    安装器也可以强制使用任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    备份提示：参见 [备份策略](/zh-CN/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该在笔记本电脑还是 VPS 上运行 Gateway 网关？">
    简短回答：**如果你想要 24/7 可靠性，请使用 VPS**。如果你想要
    最低摩擦，并且能接受睡眠/重启，就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：** 无服务器成本，可直接访问本地文件，有实时浏览器窗口。
    - **缺点：** 睡眠/网络中断 = 断开连接，操作系统更新/重启会中断，必须保持唤醒。

    **VPS / 云**

    - **优点：** 常久在线、网络稳定、没有笔记本睡眠问题，更容易持续运行。
    - **缺点：** 通常以无头方式运行（使用截图），只能远程访问文件，并且必须通过 SSH 更新。

    **OpenClaw 特定说明：** WhatsApp/Telegram/Slack/Mattermost/Discord 都可以在 VPS 上正常工作。唯一真正的取舍是 **无头浏览器** 与可见窗口。参见 [浏览器](/zh-CN/tools/browser)。

    **推荐默认选择：** 如果你之前遇到过 Gateway 网关断连，就使用 VPS。如果你正在主动使用 Mac，并且需要本地文件访问，或需要通过可见浏览器进行 UI 自动化，本地运行很合适。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必需的，但**为了可靠性和隔离性，建议这样做**。

    - **专用主机（VPS/Mac mini/Pi）：** 常久在线、睡眠/重启中断更少、权限更干净，更容易持续运行。
    - **共享笔记本/台式机：** 用于测试和主动使用完全没问题，但机器睡眠或更新时会出现暂停。

    如果你想两者兼得，可以把 Gateway 网关放在专用主机上，并将你的笔记本配对为用于本地屏幕/摄像头/exec 工具的**节点**。参见 [节点](/zh-CN/nodes)。
    安全指南请阅读 [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="VPS 的最低要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于基础 Gateway 网关 + 一个聊天渠道：

    - **绝对最低：** 1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐：** 1-2 vCPU、2GB RAM 或更多以留出余量（日志、媒体、多个渠道）。节点工具和浏览器自动化可能会消耗较多资源。

    操作系统：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？要求是什么？">
    可以。把 VM 当作 VPS 对待：它需要保持常开、可访问，并且有足够的
    RAM 来运行 Gateway 网关和你启用的任何渠道。

    基准指南：

    - **绝对最低：** 1 vCPU、1GB RAM。
    - **推荐：** 如果你运行多个渠道、浏览器自动化或媒体工具，建议 2GB RAM 或更多。
    - **操作系统：** Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最简单的 VM 式设置**，并且工具链
    兼容性最好。参见 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你在 VM 中运行 macOS，请参见 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) — 主常见问题（模型、会话、Gateway 网关、安全等）
- [安装概览](/zh-CN/install)
- [入门指南](/zh-CN/start/getting-started)
- [故障排除](/zh-CN/help/troubleshooting)
