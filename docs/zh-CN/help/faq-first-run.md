---
read_when:
    - 全新安装、新手引导卡住或首次运行错误
    - 选择凭证和提供商订阅
    - 无法访问 docs.openclaw.ai，无法打开仪表盘，安装卡住
sidebarTitle: First-run FAQ
summary: 常见问题：快速开始和首次运行设置 — 安装、新手引导、认证、订阅、初始失败
title: 常见问题：首次运行设置
x-i18n:
    generated_at: "2026-05-02T20:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  快速开始和首次运行问答。日常操作、模型、凭证、会话和故障排除请参阅主 [常见问题](/zh-CN/help/faq)。

  ## 快速开始和首次运行设置

  <AccordionGroup>
  <Accordion title="我卡住了，最快的解决问题方法">
    使用可以**查看你的机器**的本地 AI 智能体。这比在 Discord 上提问有效得多，因为大多数“我卡住了”的情况都是**本地配置或环境问题**，远程协助者无法检查。

    - **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你的机器级设置（PATH、服务、权限、凭证文件）。通过可修改（git）安装，把**完整源码检出**交给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码 + 文档，并基于你正在运行的确切版本进行推理。之后你随时可以不带 `--install-method git` 重新运行安装器，切回稳定版。

    提示：让智能体**规划并监督**修复（一步一步），然后只执行必要命令。这样能让变更更小，也更容易审计。

    如果你发现了真实 bug 或修复方案，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    从这些命令开始（寻求帮助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：快速快照，显示 gateway/agent 健康状况 + 基础配置。
    - `openclaw models status`：检查提供商凭证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、`openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出现故障，最初的六十秒](/zh-CN/help/faq#first-60-seconds-if-something-is-broken)。
    安装文档：[安装](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。跳过原因是什么意思？">
    常见的 Heartbeat 跳过原因：

    - `quiet-hours`：不在配置的活跃时间窗口内
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但还没有到期的任务间隔
    - `alerts-disabled`：所有 Heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有真正的 Heartbeat 运行完成后，才会推进到期时间戳。被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="推荐的 OpenClaw 安装和设置方式">
    仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导也可以自动构建 UI 资源。新手引导完成后，你通常会在端口 **18789** 上运行 Gateway 网关。

    从源码运行（贡献者/开发）：

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

  <Accordion title="新手引导后如何打开控制面板？">
    新手引导完成后，向导会立即用干净的（不含令牌的）控制面板 URL 打开你的浏览器，并在摘要中打印链接。保持该标签页打开；如果没有启动，请在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 和远程环境中验证控制面板？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥凭证，请将配置的令牌或密码粘贴到 Control UI 设置中。
    - 令牌来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置共享密钥，请用 `openclaw doctor --generate-gateway-token` 生成令牌。

    **不在 localhost 上：**

    - **Tailscale Serve**（推荐）：保持绑定 local loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份标头会满足 Control UI/WebSocket 身份验证（无需粘贴共享密钥，前提是假定 Gateway 网关主机可信）；HTTP API 仍需要共享密钥身份验证，除非你有意使用 private-ingress `none` 或 trusted-proxy HTTP 身份验证。
      来自同一客户端的错误并发 Serve 身份验证尝试会在失败身份验证限流器记录它们之前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码身份验证），打开 `http://<tailscale-ip>:18789/`，然后在控制面板设置中粘贴匹配的共享密钥。
    - **具备身份感知能力的反向代理**：将 Gateway 网关放在可信代理后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。同主机 local loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。共享密钥身份验证仍适用于隧道；如果提示，请粘贴配置的令牌或密码。

    有关绑定模式和身份验证详情，请参阅[控制面板](/zh-CN/web/dashboard)和 [Web 界面](/zh-CN/web)。

  </Accordion>

  <Accordion title="为什么聊天审批有两套 exec 审批配置？">
    它们控制不同层级：

    - `approvals.exec`：将审批提示转发到聊天目的地
    - `channels.<channel>.execApprovals`：让该渠道充当 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批关口。聊天配置只控制审批提示出现的位置，以及人们如何回答它们。

    大多数设置中你**不**需要两者都用：

    - 如果聊天已经支持命令和回复，同一聊天中的 `/approve` 会通过共享路径工作。
    - 如果受支持的原生渠道可以安全推断审批者，当 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，OpenClaw 现在会自动启用以私信优先的原生审批。
    - 当原生审批卡片/按钮可用时，该原生 UI 是主路径；只有当工具结果显示聊天审批不可用或手动审批是唯一路径时，智能体才应包含手动 `/approve` 命令。
    - 只有当提示还必须转发到其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 只有当你明确希望审批提示发回到来源房间/话题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批又是单独的：它们默认使用同一聊天中的 `/approve`，可选使用 `approvals.plugin` 转发，并且只有部分原生渠道会在其上保留插件审批原生处理。

    简短版本：转发用于路由，原生客户端配置用于更丰富的渠道特定体验。
    请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。Gateway 网关**不推荐**使用 Bun。
  </Accordion>

  <Accordion title="它可以在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关很轻量，文档列出 **512MB-1GB RAM**、**1 个核心**和大约 **500MB** 磁盘就足够个人使用，并说明 **Raspberry Pi 4 可以运行它**。

    如果你需要额外余量（日志、媒体、其他服务），**推荐 2GB**，但这不是硬性最低要求。

    提示：小型 Pi/VPS 可以托管 Gateway 网关，你可以在笔记本/手机上配对**节点**，用于本地屏幕/摄像头/canvas 或命令执行。请参阅[节点](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么提示？">
    简短版本：它能用，但可能会遇到一些粗糙边缘。

    - 使用 **64 位**操作系统，并保持 Node >= 22。
    - 优先使用**可修改（git）安装**，这样你可以查看日志并快速更新。
    - 先不启用渠道/Skills，然后逐个添加。
    - 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / 新手引导无法孵化。现在怎么办？">
    该屏幕依赖 Gateway 网关可访问且已通过身份验证。TUI 也会在首次孵化时自动发送 “Wake up, my friend!”。如果你看到这行但**没有回复**，且 token 保持为 0，说明智能体从未运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查 Status + 身份验证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然挂起，运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关在远程，请确保隧道/Tailscale 连接已建立，并且 UI 指向正确的 Gateway 网关。请参阅[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把设置迁移到新机器（Mac mini）而不重新做新手引导吗？">
    可以。复制**状态目录**和 **workspace**，然后运行一次 Doctor。只要你复制**这两个**位置，就能让你的 bot 保持“完全相同”（记忆、会话历史、凭证和渠道状态）：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的 workspace（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、凭证配置文件、WhatsApp 凭据、会话和记忆。如果你处于远程模式，请记住 Gateway 网关主机拥有会话存储和 workspace。

    **重要：**如果你只是将 workspace 提交/推送到 GitHub，你备份的是**记忆 + bootstrap 文件**，但**不是**会话历史或凭证。它们位于 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关：[迁移](/zh-CN/install/migrating)、[磁盘上的存放位置](/zh-CN/help/faq#where-things-live-on-disk)、[Agent 工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、[远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="在哪里查看最新版本的新内容？">
    查看 GitHub changelog：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果顶部章节标记为 **Unreleased**，则下一个带日期的章节就是最新已发布版本。条目按 **Highlights**、**Changes** 和 **Fixes** 分组（需要时还会有文档/其他章节）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    一些 Comcast/Xfinity 连接会被 Xfinity Advanced Security 错误拦截 `docs.openclaw.ai`。请禁用它或将 `docs.openclaw.ai` 加入允许列表，然后重试。
    请在此处报告，帮助我们解除拦截：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档在 GitHub 上有镜像：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 与 beta 的区别">
    **Stable** 和 **beta** 是 **npm dist-tags**，不是独立的代码线：

    - `latest` = stable
    - `beta` = 用于测试的早期构建

    通常，稳定版本会先发布到 **beta**，然后通过一个明确的提升步骤把同一版本移动到 `latest`。维护者也可以在需要时直接发布到 `latest`。这就是为什么提升之后 beta 和 stable 可能指向**同一个版本**。

    查看变更：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装单行命令以及 beta 和 dev 的区别，请参阅下面的折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本，以及 beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 匹配）。
    **Dev** 是 `main`（git）的移动头；发布时，它使用 npm dist-tag `dev`。

    单行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装器（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多细节：[开发渠道](/zh-CN/install/development-channels) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何尝试最新内容？">
    两个选项：

    1. **Dev 渠道（git checkout）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源代码更新。

    2. **可修改安装（来自安装器站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会给你一个可编辑的本地仓库，然后通过 git 更新。

    如果你更喜欢手动进行干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[更新](/zh-CN/cli/update)、[开发渠道](/zh-CN/install/development-channels)、
    [安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多长时间？">
    粗略指南：

    - **安装：** 2-5 分钟
    - **新手引导：** 5-15 分钟，取决于你配置了多少渠道/模型

    如果它卡住了，请使用 [安装器卡住](#quick-start-and-first-run-setup)
    以及 [我卡住了](#quick-start-and-first-run-setup) 中的快速调试循环。

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
    两个常见的 Windows 问题：

    **1) npm 错误 spawn git / 找不到 git**

    - 安装 **Git for Windows**，并确保 `git` 在你的 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2) 安装后无法识别 openclaw**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH（Windows 上不需要 `\bin` 后缀；在大多数系统上它是 `%AppData%\npm`）。
    - 更新 PATH 后关闭并重新打开 PowerShell。

    如果你想获得最顺畅的 Windows 设置体验，请使用 **WSL2** 而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示中文乱码 - 我该怎么办？">
    这通常是原生 Windows shell 上的控制台代码页不匹配。

    症状：

    - `system.run`/`exec` 输出将中文渲染为乱码
    - 同一命令在另一个终端配置文件中看起来正常

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

    如果你在最新的 OpenClaw 上仍然能复现此问题，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题 - 如何获得更好的答案？">
    使用**可修改（git）安装**，这样你就能在本地拥有完整源代码和文档，然后从该文件夹中询问
    你的 bot（或 Claude/Codex），这样它就可以读取仓库并精确回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节：[安装](/zh-CN/install) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南操作，然后运行新手引导。

    - Linux 快速路径 + 服务安装：[Linux](/zh-CN/platforms/linux)。
    - 完整演练：[入门指南](/zh-CN/start/getting-started)。
    - 安装器 + 更新：[安装和更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。在服务器上安装，然后使用 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway 网关远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们维护了一个包含常见提供商的**托管中心**。选择一个并按照指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一个地方）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式：**Gateway 网关在服务器上运行**，你通过 Control UI（或 Tailscale/SSH）
    从笔记本电脑/手机访问它。你的状态 + 工作区位于服务器上，因此请把主机视为事实来源并进行备份。

    你可以将**节点**（Mac/iOS/Android/headless）配对到该云端 Gateway 网关，以访问
    本地屏幕/摄像头/canvas，或在笔记本电脑上运行命令，同时将
    Gateway 网关保留在云端。

    中心：[平台](/zh-CN/platforms)。远程访问：[Gateway 网关远程访问](/zh-CN/gateway/remote)。
    节点：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 更新自身吗？">
    简短回答：**可以，但不建议**。更新流程可能会重启
    Gateway 网关（这会断开活动会话），可能需要干净的 git checkout，并且
    可能会提示确认。更安全的做法是：由操作者从 shell 运行更新。

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

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**中，它会引导你完成：

    - **模型/凭证设置**（提供商 OAuth、API key、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + 启动文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等内置渠道插件）
    - **Daemon 安装**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd user unit）
    - **健康检查**和 **skills** 选择

    如果你配置的模型未知或缺少凭证，它也会发出警告。

  </Accordion>

  <Accordion title="我需要 Claude 或 OpenAI 订阅才能运行它吗？">
    不需要。你可以使用 **API key**（Anthropic/OpenAI/其他）或
    **仅本地模型**运行 OpenClaw，让你的数据留在你的设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）是验证这些提供商身份的可选方式。

    对于 OpenClaw 中的 Anthropic，实际区别是：

    - **Anthropic API key**：普通 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅凭证**：Anthropic 工作人员
      告诉我们这种用法再次被允许，因此 OpenClaw 将 `claude -p`
      用法视为此集成的已批准用法，除非 Anthropic 发布新的
      策略

    对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是更
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

    Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    OpenClaw 将 Claude 订阅凭证和 `claude -p` 用法视为
    此集成的已批准用法，除非 Anthropic 发布新的策略。如果你想要
    最可预测的服务端设置，请改用 Anthropic API key。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅凭证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 工作人员告诉我们这种用法再次被允许，因此 OpenClaw 将
    Claude CLI 复用和 `claude -p` 用法视为此集成
    的已批准用法，除非 Anthropic 发布新的策略。

    Anthropic setup-token 仍然可作为受支持的 OpenClaw 令牌路径使用，但 OpenClaw 现在在可用时优先选择 Claude CLI 复用和 `claude -p`。
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
    这意味着你的**Anthropic 配额/速率限制**在当前窗口内已耗尽。如果你
    使用 **Claude CLI**，请等待窗口重置或升级你的计划。如果你
    使用 **Anthropic API key**，请在 Anthropic Console 中检查
    使用量/账单，并按需提高限制。

    如果消息明确是：
    `Extra usage is required for long context requests`，说明该请求正在尝试使用
    Anthropic 的 1M 上下文 beta（`context1m: true`）。只有当你的
    凭证符合长上下文计费资格（API key 计费，或启用了 Extra Usage 的
    OpenClaw Claude 登录路径）时才可用。

    提示：设置一个**备用模型**，这样当某个提供商受到速率限制时，OpenClaw 仍可继续回复。
    请参阅 [Models](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth)，以及
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="是否支持 AWS Bedrock？">
    是。OpenClaw 内置了 **Amazon Bedrock (Converse)** 提供商。当存在 AWS 环境标记时，OpenClaw 可以自动发现 Bedrock 流式传输/文本目录，并将其作为隐式 `amazon-bedrock` 提供商合并；否则你可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或添加手动提供商条目。请参阅 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [模型提供商](/zh-CN/providers/models)。如果你偏好托管密钥流程，在 Bedrock 前面使用 OpenAI 兼容代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 凭证如何工作？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code (Codex)**。常见设置使用
    `openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`：
    ChatGPT/Codex 订阅凭证加原生 Codex 应用服务器执行。只有当你想通过默认
    PI runner 使用 Codex OAuth 时，才使用 `openai-codex/gpt-5.5`。在不使用 Codex 运行时覆盖的情况下使用
    `openai/gpt-5.5`，则表示直接通过 OpenAI API key 访问。
    请参阅 [模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍会提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的提供商和 auth-profile id。
    它也是 Codex OAuth 的显式 PI 模型前缀：

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = 使用原生 Codex 运行时的 ChatGPT/Codex 订阅凭证
    - `openai-codex/gpt-5.5` = PI 中的 Codex OAuth 路由
    - `openai/gpt-5.5` 不带 Codex 运行时覆盖 = PI 中的直接 OpenAI API key 路由
    - `openai-codex:...` = 凭证配置 id，不是模型引用

    如果你想使用直接的 OpenAI Platform 计费/限制路径，请设置
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 订阅凭证，请使用
    `openclaw models auth login --provider openai-codex` 登录。对于原生 Codex
    运行时，请保留模型引用为 `openai/gpt-5.5`，并设置
    `agentRuntime.id: "codex"`。仅在 PI
    运行时使用 `openai-codex/*` 模型引用。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限制可能不同于 ChatGPT 网页版？">
    Codex OAuth 使用由 OpenAI 管理、依赖套餐的配额窗口。实际使用中，
    这些限制可能不同于 ChatGPT 网站/应用体验，即使
    两者绑定到同一个账号。

    OpenClaw 可以在 `openclaw models status` 中显示当前可见的提供商用量/配额窗口，
    但它不会凭空创建 ChatGPT 网页版权益，也不会将其规范化为直接 API 访问。如果你想使用直接的 OpenAI Platform
    计费/限制路径，请使用带 API key 的 `openai/*`。

  </Accordion>

  <Accordion title="是否支持 OpenAI 订阅凭证（Codex OAuth）？">
    是。OpenClaw 完全支持 **OpenAI Code (Codex) 订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这类外部工具/工作流中使用订阅 OAuth。
    新手引导可以为你运行 OAuth 流程。

    请参阅 [OAuth](/zh-CN/concepts/oauth)、[模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用**插件凭证流程**，而不是 `openclaw.json` 中的 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，使 `gemini` 位于 `PATH` 上
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth 令牌存储在 gateway 主机上的凭证配置中。详情：[模型提供商](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常聊天吗？">
    通常不适合。OpenClaw 需要大上下文和强安全能力；小卡片会截断并泄漏。如果必须使用，请在本地运行你能运行的**最大**模型构建（LM Studio），并查看 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化的模型会增加提示注入风险 - 请参阅 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何将托管模型流量限定在特定区域？">
    选择固定区域的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；选择美国托管变体即可让数据留在该区域内。你仍可通过使用 `models.mode: "merge"` 同时列出 Anthropic/OpenAI，这样在尊重你选择的区域化提供商的同时，仍可保留备用模型。
  </Accordion>

  <Accordion title="我必须买一台 Mac Mini 才能安装这个吗？">
    不需要。OpenClaw 可在 macOS 或 Linux（Windows 通过 WSL2）上运行。Mac mini 是可选的 - 有些人
    会买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的设备也可以。

    只有在使用 **macOS 专用工具**时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）- BlueBubbles 服务器可在任何 Mac 上运行，而 Gateway 网关可在 Linux 或其他地方运行。如果你想使用其他 macOS 专用工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS 节点。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我需要 Mac mini 才能支持 iMessage 吗？">
    你需要**某台 macOS 设备**登录 Messages。它**不必**是 Mac mini -
    任意 Mac 都可以。对于 iMessage，**使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）- BlueBubbles 服务器在 macOS 上运行，而 Gateway 网关可以在 Linux 或其他地方运行。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，并在任意已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果你想要最简单的单机设置，就在 Mac 上运行所有内容。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不运行 Gateway 网关 - 它们提供额外
    能力，例如屏幕/摄像头/canvas，以及该设备上的 `system.run`。

    常见模式：

    - Mac mini 上运行 Gateway 网关（常开）。
    - MacBook Pro 运行 macOS 应用或节点主机，并配对到 Gateway 网关。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们观察到运行时 bug，尤其是在 WhatsApp 和 Telegram 中。
    请使用 **Node** 来获得稳定的网关。

    如果你仍想尝试 Bun，请在非生产网关上进行，
    且不要使用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 中应填写什么？">
    `channels.telegram.allowFrom` 是**人类发送者的 Telegram 用户 ID**（数字）。它不是机器人用户名。

    设置流程只会要求输入数字用户 ID。如果你的配置中已有旧版 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全（不使用第三方机器人）：

    - 私信你的机器人，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 私信你的机器人，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方（隐私性较低）：

    - 私信 `@userinfobot` 或 `@getidsbot`。

    请参阅 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人能否用同一个 WhatsApp 号码连接不同的 OpenClaw 实例？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会获得自己的工作区和会话存储。回复仍来自**同一个 WhatsApp 账号**，并且私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）在每个 WhatsApp 账号内是全局的。请参阅 [多智能体路由](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体指定自己的默认模型，然后将入站路由（提供商账号或特定 peer）绑定到对应智能体。示例配置见 [多智能体路由](/zh-CN/concepts/multi-agent)。另请参阅 [Models](/zh-CN/concepts/models) 和 [配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 在 Linux 上可用吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样 `brew` 安装的工具才能在非登录 shell 中解析。
    近期构建还会在 Linux systemd 服务中前置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置了 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR` 时尊重这些变量。

  </Accordion>

  <Accordion title="可修改的 git 安装与 npm 安装的区别">
    - **可修改（git）安装：**完整源码 checkout，可编辑，最适合贡献者。
      你可以在本地运行构建，并修补代码/文档。
    - **npm 安装：**全局 CLI 安装，无仓库，最适合“只想运行它”的场景。
      更新来自 npm dist-tags。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后可以在 npm 和 git 安装之间切换吗？">
    可以。当 OpenClaw 已安装时，使用 `openclaw update --channel ...`。
    这**不会删除你的数据** - 它只会更改 OpenClaw 代码安装方式。
    你的状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）会保持不变。

    从 npm 切换到 git：

    ```bash
    openclaw update --channel dev
    ```

    从 git 切换到 npm：

    ```bash
    openclaw update --channel stable
    ```

    添加 `--dry-run` 可先预览计划的模式切换。更新器会运行
    Doctor 后续步骤、刷新目标渠道的插件来源，并
    重启网关，除非你传入 `--no-restart`。

    安装器也可以强制使用任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    备份提示：请参阅 [备份策略](/zh-CN/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该在笔记本电脑还是 VPS 上运行 Gateway 网关？">
    简短回答：**如果你想要 24/7 可靠性，请使用 VPS**。如果你想要
    最低的使用阻力，并且可以接受睡眠/重启，就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：**无服务器成本、可直接访问本地文件、可见的实时浏览器窗口。
    - **缺点：**睡眠/网络中断 = 断开连接，OS 更新/重启会打断运行，必须保持唤醒。

    **VPS / 云服务器**

    - **优点：**始终在线、网络稳定、没有笔记本睡眠问题、更容易持续运行。
    - **缺点：**通常以无头模式运行（使用截图），只能远程访问文件，必须通过 SSH 更新。

    **OpenClaw 专属说明：**WhatsApp/Telegram/Slack/Mattermost/Discord 都可以在 VPS 上正常工作。唯一真正的取舍是**无头浏览器**与可见窗口。见[浏览器](/zh-CN/tools/browser)。

    **推荐默认方案：**如果你之前遇到过 Gateway 网关断开连接，使用 VPS。本地运行很适合你正在主动使用 Mac，并且想要本地文件访问或带可见浏览器的 UI 自动化时。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必需的，但**建议这样做，以获得可靠性和隔离性**。

    - **专用主机（VPS/Mac mini/Pi）：**始终在线，睡眠/重启中断更少，权限更清晰，更容易持续运行。
    - **共享笔记本/台式机：**完全适合测试和主动使用，但机器睡眠或更新时会出现暂停。

    如果你想兼顾两者，请将 Gateway 网关放在专用主机上，并将你的笔记本配对为一个**节点**，用于本地屏幕/摄像头/执行工具。见[节点](/zh-CN/nodes)。
    如需安全指导，请阅读[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 要求和推荐 OS 是什么？">
    OpenClaw 很轻量。对于一个基础 Gateway 网关 + 一个聊天渠道：

    - **绝对最低要求：**1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐：**1-2 vCPU、2GB RAM 或更多，以留出余量（日志、媒体、多个渠道）。节点工具和浏览器自动化可能会占用较多资源。

    OS：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在那里测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？要求是什么？">
    可以。将 VM 视作 VPS：它需要始终在线、可访问，并有足够的
    RAM 供 Gateway 网关和你启用的任何渠道使用。

    基准建议：

    - **绝对最低要求：**1 vCPU、1GB RAM。
    - **推荐：**如果你运行多个渠道、浏览器自动化或媒体工具，请使用 2GB RAM 或更多。
    - **OS：**Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最简单的 VM 风格设置**，并且工具
    兼容性最好。见 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你在 VM 中运行 macOS，请参阅 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关

- [常见问题](/zh-CN/help/faq) — 主要常见问题（模型、会话、Gateway 网关、安全等）
- [安装概览](/zh-CN/install)
- [入门指南](/zh-CN/start/getting-started)
- [故障排除](/zh-CN/help/troubleshooting)
