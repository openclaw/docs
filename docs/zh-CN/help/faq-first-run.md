---
read_when:
    - 新安装、新手引导卡住或首次运行错误
    - 选择认证方式和提供商订阅
    - 无法访问 docs.openclaw.ai，无法打开仪表板，安装卡住
sidebarTitle: First-run FAQ
summary: 常见问题：快速开始和首次运行设置 — 安装、新手引导、认证、订阅、初始故障
title: 常见问题：首次运行设置
x-i18n:
    generated_at: "2026-05-02T02:37:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  快速开始和首次运行问答。日常操作、模型、凭证、会话和故障排除请参阅主 [常见问题](/zh-CN/help/faq)。

  ## 快速开始和首次运行设置

  <AccordionGroup>
  <Accordion title="我卡住了，最快的解决问题方式">
    使用一个能**查看你的机器**的本地 AI 智能体。这比在 Discord 中询问有效得多，因为大多数“我卡住了”的情况都是**本地配置或环境问题**，远程协助者无法检查。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你的机器级设置（PATH、服务、权限、凭证文件）。通过可修改的（git）安装方式，把**完整源码检出**交给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码和文档，并根据你正在运行的确切版本进行推理。你之后随时可以通过不带 `--install-method git` 重新运行安装器切回稳定版。

    提示：让智能体**规划并监督**修复（一步一步），然后只执行必要命令。这样改动更小，也更容易审计。

    如果你发现了真实 bug 或修复，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    从这些命令开始（求助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：Gateway 网关/智能体健康状况 + 基本配置的快速快照。
    - `openclaw models status`：检查提供商凭证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果某些东西坏了，最初的六十秒](#first-60-seconds-if-something-is-broken)。
    安装文档：[安装](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。跳过原因是什么意思？">
    常见 Heartbeat 跳过原因：

    - `quiet-hours`：不在配置的活跃时间窗口内
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题脚手架
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式处于启用状态，但任务间隔尚未到期
    - `alerts-disabled`：所有 Heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 都关闭）

    在任务模式中，到期时间戳只会在一次真实 Heartbeat 运行完成后推进。被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装并设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导也可以自动构建 UI 资产。完成新手引导后，你通常会在端口 **18789** 上运行 Gateway 网关。

    从源码运行（贡献者/开发者）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    如果你还没有全局安装，请通过 `pnpm openclaw onboard` 运行它。

  </Accordion>

  <Accordion title="新手引导后如何打开仪表板？">
    向导会在新手引导后立即用干净的（非令牌化）仪表板 URL 打开你的浏览器，并且也会在摘要中打印链接。保持该标签页打开；如果没有启动，请在同一台机器上复制/粘贴打印出来的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 与远程环境中验证仪表板身份？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥身份验证，请把配置的令牌或密码粘贴到控制 UI 设置中。
    - 令牌来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果还没有配置共享密钥，请用 `openclaw doctor --generate-gateway-token` 生成令牌。

    **不在 localhost 上：**

    - **Tailscale Serve**（推荐）：保持绑定到 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份标头会满足控制 UI/WebSocket 身份验证（无需粘贴共享密钥，前提是假定 Gateway 网关主机可信）；HTTP API 仍然需要共享密钥身份验证，除非你有意使用 private-ingress `none` 或 trusted-proxy HTTP 身份验证。
      来自同一客户端的并发错误 Serve 身份验证尝试会在失败身份验证限流器记录之前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码身份验证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴匹配的共享密钥。
    - **身份感知反向代理**：把 Gateway 网关放在可信代理后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。同主机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。共享密钥身份验证仍然适用于该隧道；如果出现提示，请粘贴配置的令牌或密码。

    请参阅[仪表板](/zh-CN/web/dashboard)和 [Web 界面](/zh-CN/web)，了解绑定模式和身份验证详情。

  </Accordion>

  <Accordion title="为什么聊天审批有两个 exec 审批配置？">
    它们控制不同层级：

    - `approvals.exec`：把审批提示转发到聊天目的地
    - `channels.<channel>.execApprovals`：让该渠道作为 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批关口。聊天配置只控制审批提示出现在哪里，以及人们可以如何回应。

    在大多数设置中，你**不**需要两者：

    - 如果聊天已经支持命令和回复，同一聊天中的 `/approve` 会通过共享路径工作。
    - 如果受支持的原生渠道可以安全地推断审批人，当 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，OpenClaw 现在会自动启用 DM 优先的原生审批。
    - 当原生审批卡片/按钮可用时，该原生 UI 是主要路径；只有当工具结果说明聊天审批不可用或手动审批是唯一路径时，智能体才应包含手动 `/approve` 命令。
    - 仅当提示还必须转发到其他聊天或显式运维房间时，才使用 `approvals.exec`。
    - 仅当你明确希望审批提示发回原始房间/主题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批又是独立的：默认使用同一聊天中的 `/approve`，可选使用 `approvals.plugin` 转发，并且只有部分原生渠道在其上保留插件审批原生处理。

    简短版本：转发用于路由，原生客户端配置用于更丰富的渠道特定用户体验。
    请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。**不推荐**将 Bun 用于 Gateway 网关。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关很轻量，文档列出的个人使用足够配置为 **512MB-1GB RAM**、**1 个核心**，以及约 **500MB** 磁盘，并说明 **Raspberry Pi 4 可以运行它**。

    如果你想要更多余量（日志、媒体、其他服务），**推荐 2GB**，但这不是硬性最低要求。

    提示：一台小型 Pi/VPS 可以托管 Gateway 网关，你也可以在笔记本电脑/手机上配对**节点**，用于本地屏幕/摄像头/canvas 或命令执行。请参阅[节点](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议？">
    简短版本：它可以工作，但可能会遇到一些边缘问题。

    - 使用 **64 位** OS，并保持 Node >= 22。
    - 优先使用**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 先不启用渠道/Skills，随后逐个添加。
    - 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / 新手引导无法孵化。现在怎么办？">
    该屏幕依赖 Gateway 网关可访问且已通过身份验证。TUI 也会在首次孵化时自动发送 “Wake up, my friend!”。如果你看到该行但**没有回复**，且令牌数保持为 0，则智能体从未运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查 Status + 凭证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然挂起，请运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关是远程的，请确保隧道/Tailscale 连接已开启，并且 UI 指向正确的 Gateway 网关。请参阅[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把设置迁移到新机器（Mac mini）而不重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。只要你复制**两个**位置，这会让你的机器人保持“完全相同”（记忆、会话历史、凭证和渠道状态）：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、凭证配置文件、WhatsApp 凭据、会话和记忆。如果你处于远程模式，请记住 Gateway 网关主机拥有会话存储和工作区。

    **重要：**如果你只把工作区提交/推送到 GitHub，你备份的是**记忆 + bootstrap 文件**，但**不是**会话历史或凭证。它们位于 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关：[迁移](/zh-CN/install/migrating)、[内容在磁盘上的位置](#where-things-live-on-disk)、
    [Agent 工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="在哪里查看最新版本的新内容？">
    查看 GitHub 变更日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果顶部部分标记为 **Unreleased**，则下一个带日期的部分就是最新已发布版本。条目按 **Highlights**、**Changes** 和 **Fixes** 分组（需要时还会有文档/其他部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会通过 Xfinity Advanced Security 错误地阻止 `docs.openclaw.ai`。请禁用它或将 `docs.openclaw.ai` 加入允许列表，然后重试。
    请在这里报告，帮助我们解除阻止：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档也镜像在 GitHub：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版和 beta 的区别">
    **稳定版** 和 **beta** 是 **npm dist-tags**，不是不同的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，稳定版本会先发布到 **beta**，然后通过一个明确的
    提升步骤把同一个版本移动到 `latest`。维护者也可以在需要时
    直接发布到 `latest`。这就是为什么提升后 beta 和稳定版可能
    指向 **同一个版本**。

    查看变更：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    如需安装一行命令以及 beta 和 dev 的区别，请查看下面的折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本，以及 beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的移动头部（git）；发布时，它使用 npm dist-tag `dev`。

    一行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装器（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多详情：[开发渠道](/zh-CN/install/development-channels) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何试用最新构建？">
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

    这会给你一个可以编辑的本地仓库，然后通过 git 更新。

    如果你更喜欢手动干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[更新](/zh-CN/cli/update)、[开发渠道](/zh-CN/install/development-channels)、
    [安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多久？">
    粗略指南：

    - **安装：** 2-5 分钟
    - **新手引导：** 5-15 分钟，取决于你配置了多少渠道/模型

    如果卡住，请使用 [安装器卡住](#quick-start-and-first-run-setup)
    以及 [我卡住了](#quick-start-and-first-run-setup) 中的快速调试循环。

  </Accordion>

  <Accordion title="安装器卡住？如何获得更多反馈？">
    使用 **详细输出** 重新运行安装器：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    带详细输出的 beta 安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    可修改（git）安装：

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

    **1）npm 错误 spawn git / 找不到 git**

    - 安装 **Git for Windows**，并确保 `git` 在你的 PATH 上。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2）安装后无法识别 openclaw**

    - 你的 npm 全局 bin 文件夹不在 PATH 上。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH（Windows 上不需要 `\bin` 后缀；在大多数系统上是 `%AppData%\npm`）。
    - 更新 PATH 后关闭并重新打开 PowerShell。

    如果你想要最顺畅的 Windows 设置，请使用 **WSL2** 而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文文本 - 我该怎么办？">
    这通常是原生 Windows shell 上的控制台代码页不匹配。

    症状：

    - `system.run`/`exec` 输出把中文渲染成乱码
    - 同一条命令在另一个终端配置文件中显示正常

    PowerShell 中的快速绕过方法：

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

    如果你仍能在最新 OpenClaw 上复现此问题，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题 - 如何获得更好的答案？">
    使用 **可修改（git）安装**，这样你就可以在本地拥有完整源代码和文档，然后
    从该文件夹让你的机器人（或 Claude/Codex）提问，这样它就能读取仓库并精确回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多详情：[安装](/zh-CN/install) 和 [安装器标志](/zh-CN/install/installer)。

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
    远程访问：[Gateway 网关远程](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们维护一个包含常见提供商的 **托管中心**。选择一个并按照指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一处）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式：**Gateway 网关运行在服务器上**，你通过 Control UI
    （或 Tailscale/SSH）从笔记本/手机访问它。你的状态 + 工作区
    存在服务器上，因此请将主机视为真实来源并做好备份。

    你可以将 **节点**（Mac/iOS/Android/headless）配对到该云端 Gateway 网关，以访问
    本地屏幕/摄像头/canvas，或在你的笔记本上运行命令，同时让
    Gateway 网关保留在云端。

    中心：[平台](/zh-CN/platforms)。远程访问：[Gateway 网关远程](/zh-CN/gateway/remote)。
    节点：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自行更新吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会断开活动会话），可能需要干净的 git checkout，并且
    可能提示确认。更安全的做法：由操作者从 shell 运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果必须从智能体自动化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[更新](/zh-CN/cli/update)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际会做什么？">
    `openclaw onboard` 是推荐的设置路径。在 **本地模式** 中，它会引导你完成：

    - **模型/凭证设置**（提供商 OAuth、API key、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区** 位置 + 引导文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等内置渠道插件）
    - **守护进程安装**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 用户单元）
    - **健康检查** 和 **skills** 选择

    如果你配置的模型未知或缺少凭证，它也会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以用 **API key**（Anthropic/OpenAI/其他）运行 OpenClaw，或者用
    **纯本地模型**，让你的数据留在你的设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）是这些提供商的可选认证方式。

    对 OpenClaw 中的 Anthropic，实际区分是：

    - **Anthropic API key**：正常的 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅凭证**：Anthropic 员工
      告诉我们这种用法再次被允许，并且 OpenClaw 会将 `claude -p`
      用法视为对此集成已获准，除非 Anthropic 发布新的
      策略

    对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是更
    可预测的设置。OpenAI Codex OAuth 明确支持 OpenClaw 这样的外部
    工具。

    OpenClaw 还支持其他托管订阅式选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [本地模型](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="可以在没有 API key 的情况下使用 Claude Max 订阅吗？">
    可以。

    Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    OpenClaw 会将 Claude 订阅凭证和 `claude -p` 用法视为
    对此集成已获准，除非 Anthropic 发布新的策略。如果你想要
    最可预测的服务端设置，请改用 Anthropic API key。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅凭证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 员工告诉我们这种用法再次被允许，因此 OpenClaw 会将
    Claude CLI 复用和 `claude -p` 用法视为对此集成已获准，
    除非 Anthropic 发布新的策略。

    Anthropic setup-token 仍可作为受支持的 OpenClaw token 路径使用，但 OpenClaw 现在在可用时更偏向 Claude CLI 复用和 `claude -p`。
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
    这意味着你的 **Anthropic 配额/速率限制** 已在当前窗口耗尽。如果你
    使用 **Claude CLI**，请等待窗口重置或升级你的套餐。如果你
    使用 **Anthropic API key**，请在 Anthropic Console
    检查使用量/账单，并按需提高限制。

    如果消息具体是：
    `Extra usage is required for long context requests`，则请求正在尝试使用
    Anthropic 的 1M 上下文 beta（`context1m: true`）。这只有在你的
    凭证具备长上下文计费资格时才有效（API key 计费，或启用 Extra Usage 的
    OpenClaw Claude-login 路径）。

    提示：设置一个**备用模型**，这样当某个提供商受到速率限制时，OpenClaw 仍可继续回复。
    请参阅 [Models](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    是的。OpenClaw 内置了 **Amazon Bedrock (Converse)** 提供商。存在 AWS 环境标记时，OpenClaw 可以自动发现流式/文本 Bedrock 目录，并将其合并为隐式的 `amazon-bedrock` 提供商；否则，你可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或添加手动提供商条目。请参阅 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [模型提供商](/zh-CN/providers/models)。如果你偏好托管式密钥流程，在 Bedrock 前面使用 OpenAI 兼容代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 凭证如何工作？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code (Codex)**。常见设置使用
    `openai/gpt-5.5` 并设置 `agentRuntime.id: "codex"`：
    ChatGPT/Codex 订阅凭证加原生 Codex 应用服务器执行。仅当你希望通过默认
    PI 运行器使用 Codex OAuth 时，才使用 `openai-codex/gpt-5.5`。不带 Codex 运行时覆盖时，使用
    `openai/gpt-5.5` 可直接通过 OpenAI API key 访问。
    请参阅 [模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍会提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的提供商和凭证配置文件 id。
    它也是 Codex OAuth 的显式 PI 模型前缀：

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = 使用原生 Codex 运行时的 ChatGPT/Codex 订阅凭证
    - `openai-codex/gpt-5.5` = PI 中的 Codex OAuth 路由
    - 不带 Codex 运行时覆盖的 `openai/gpt-5.5` = PI 中的直接 OpenAI API key 路由
    - `openai-codex:...` = 凭证配置文件 id，不是模型引用

    如果你想使用直接的 OpenAI Platform 计费/限额路径，请设置
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 订阅凭证，请通过
    `openclaw models auth login --provider openai-codex` 登录。对于原生 Codex
    运行时，请保持模型引用为 `openai/gpt-5.5`，并设置
    `agentRuntime.id: "codex"`。仅在 PI
    运行中使用 `openai-codex/*` 模型引用。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额可能不同于 ChatGPT 网页版？">
    Codex OAuth 使用 OpenAI 管理的、依赖套餐的配额窗口。实际使用中，
    这些限额可能不同于 ChatGPT 网站/应用体验，即使二者绑定到同一账户。

    OpenClaw 可以在 `openclaw models status` 中显示当前可见的提供商用量/配额窗口，
    但它不会虚构或规范化 ChatGPT 网页版权益为直接 API 访问。如果你想使用直接的 OpenAI Platform
    计费/限额路径，请使用带 API key 的 `openai/*`。

  </Accordion>

  <Accordion title="支持 OpenAI 订阅凭证（Codex OAuth）吗？">
    是的。OpenClaw 完全支持 **OpenAI Code (Codex) 订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这类外部工具/工作流中使用订阅 OAuth。
    新手引导可以替你运行 OAuth 流程。

    请参阅 [OAuth](/zh-CN/concepts/oauth)、[模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用**插件凭证流程**，而不是 `openclaw.json` 中的客户端 id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，确保 `gemini` 位于 `PATH`
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会把 OAuth 令牌存储在 Gateway 网关主机上的凭证配置文件中。详情：[模型提供商](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常聊天吗？">
    通常不适合。OpenClaw 需要大上下文和强安全性；小显存卡会截断并泄漏。如果必须使用，请在本地运行你能运行的**最大**模型构建（LM Studio），并参阅 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化模型会增加提示注入风险 - 请参阅 [安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何把托管模型流量限制在特定区域？">
    选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；选择美国托管变体可让数据保留在区域内。你仍可通过使用 `models.mode: "merge"` 同时列出 Anthropic/OpenAI，使备用模型在尊重你选择的区域化提供商的同时保持可用。
  </Accordion>

  <Accordion title="我必须购买 Mac Mini 才能安装吗？">
    不需要。OpenClaw 可在 macOS 或 Linux 上运行（Windows 通过 WSL2）。Mac mini 是可选的 - 有些人会
    买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别设备也可以。

    只有在使用 **macOS 专用工具**时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）- BlueBubbles 服务器可在任意 Mac 上运行，而 Gateway 网关可以在 Linux 或其他位置运行。如果你想使用其他 macOS 专用工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS 节点。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[节点](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 支持需要 Mac mini 吗？">
    你需要**某台 macOS 设备**登录 Messages。它**不一定**必须是 Mac mini -
    任意 Mac 都可以。对于 iMessage，**使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）- BlueBubbles 服务器在 macOS 上运行，而 Gateway 网关可以在 Linux 或其他位置运行。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，并在任意已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果想要最简单的单机设置，可以把所有内容都运行在 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[节点](/zh-CN/nodes)、
    [Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不运行 Gateway 网关 - 它们提供额外
    能力，例如该设备上的屏幕/摄像头/canvas 和 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（常开）。
    - MacBook Pro 运行 macOS 应用或节点主机，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们发现了运行时错误，尤其是在 WhatsApp 和 Telegram 中。
    使用 **Node** 可获得稳定的 Gateway 网关。

    如果你仍想试验 Bun，请在非生产 Gateway 网关上进行，
    且不要使用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 中应该填什么？">
    `channels.telegram.allowFrom` 是**真人发送者的 Telegram 用户 ID**（数字）。它不是机器人用户名。

    设置流程只要求数字用户 ID。如果你的配置中已有旧版 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全（无需第三方机器人）：

    - 私信你的机器人，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 私信你的机器人，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方（隐私性较低）：

    - 私信 `@userinfobot` 或 `@getidsbot`。

    请参阅 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人可以用同一个 WhatsApp 号码连接不同的 OpenClaw 实例吗？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都有自己的工作区和会话存储。回复仍来自**同一个 WhatsApp 账户**，并且私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）对每个 WhatsApp 账户是全局的。请参阅 [多智能体路由](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='可以运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置自己的默认模型，然后把入站路由（提供商账户或特定 peer）绑定到每个智能体。示例配置位于 [多智能体路由](/zh-CN/concepts/multi-agent)。另请参阅 [Models](/zh-CN/concepts/models) 和 [配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可以在 Linux 上使用吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样非登录 shell 中也能解析 `brew` 安装的工具。
    最新构建还会在 Linux systemd 服务中预置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置了 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR` 时尊重它们。

  </Accordion>

  <Accordion title="可改造的 git 安装和 npm 安装有什么区别">
    - **可改造（git）安装：**完整源码检出，可编辑，最适合贡献者。
      你可以在本地运行构建并修补代码/文档。
    - **npm 安装：**全局 CLI 安装，无仓库，最适合“只想运行它”的场景。
      更新来自 npm dist-tags。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="以后可以在 npm 和 git 安装之间切换吗？">
    可以。OpenClaw 已安装时，使用 `openclaw update --channel ...`。
    这**不会删除你的数据** - 它只会更改 OpenClaw 代码安装。
    你的状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）会保持不变。

    从 npm 切换到 git：

    ```bash
    openclaw update --channel dev
    ```

    从 git 切换到 npm：

    ```bash
    openclaw update --channel stable
    ```

    添加 `--dry-run` 可先预览计划中的模式切换。更新器会运行
    Doctor 后续操作，为目标渠道刷新插件源，并
    重启 gateway，除非你传入 `--no-restart`。

    安装器也可以强制使用任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    备份提示：请参阅 [备份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="应该把 Gateway 网关运行在我的笔记本电脑上还是 VPS 上？">
    简短回答：**如果你想要 24/7 可靠性，请使用 VPS**。如果你想要
    最低操作成本，并且可以接受睡眠/重启，就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：**无服务器成本，可直接访问本地文件，实时浏览器窗口。
    - **缺点：**睡眠/网络中断 = 断开连接，操作系统更新/重启会中断，必须保持唤醒。

    **VPS / 云**

    - **优点：** 始终在线、网络稳定、没有笔记本休眠问题，更容易持续运行。
    - **缺点：** 通常以无头模式运行（使用截图），只能远程访问文件，你必须通过 SSH 更新。

    **OpenClaw 专属说明：** WhatsApp/Telegram/Slack/Mattermost/Discord 都可以很好地在 VPS 上运行。唯一真正的取舍是 **无头浏览器** 与可见窗口。参见 [浏览器](/zh-CN/tools/browser)。

    **推荐默认选择：** 如果你以前遇到过 Gateway 网关断连，请使用 VPS。本地运行适合你正在主动使用 Mac，并且需要本地文件访问或带可见浏览器的 UI 自动化时。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必需的，但**为了可靠性和隔离性，建议这样做**。

    - **专用主机（VPS/Mac mini/Pi）：** 始终在线，休眠/重启中断更少，权限更清晰，更容易持续运行。
    - **共用笔记本/台式机：** 用于测试和主动使用完全没问题，但机器休眠或更新时会暂停。

    如果你想兼顾两者，请将 Gateway 网关放在专用主机上，并将你的笔记本配对为本地屏幕/摄像头/执行工具的**节点**。参见 [节点](/zh-CN/nodes)。
    如需安全指南，请阅读 [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="VPS 的最低要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于基础 Gateway 网关 + 一个聊天渠道：

    - **绝对最低要求：** 1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐：** 1-2 vCPU、2GB RAM 或更多，以留出余量（日志、媒体、多个渠道）。节点工具和浏览器自动化可能会消耗较多资源。

    操作系统：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？需要什么要求？">
    可以。将 VM 视同 VPS：它需要始终在线、可访问，并且有足够的
    RAM 来运行 Gateway 网关和你启用的任何渠道。

    基线指南：

    - **绝对最低要求：** 1 vCPU、1GB RAM。
    - **推荐：** 如果你运行多个渠道、浏览器自动化或媒体工具，请使用 2GB RAM 或更多。
    - **操作系统：** Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最简单的 VM 风格设置**，并且工具链
    兼容性最好。参见 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你在 VM 中运行 macOS，请参见 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) — 主要常见问题（模型、会话、Gateway 网关、安全等）
- [安装概览](/zh-CN/install)
- [入门指南](/zh-CN/start/getting-started)
- [故障排除](/zh-CN/help/troubleshooting)
