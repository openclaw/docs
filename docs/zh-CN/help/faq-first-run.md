---
read_when:
    - 新安装、新手引导卡住，或首次运行报错
    - 选择凭证和提供商订阅
    - 无法访问 docs.openclaw.ai、无法打开仪表板、安装卡住
summary: 常见问题：快速开始与首次运行设置——安装、新手引导、凭证、订阅、初始故障
title: 常见问题 — 快速开始与首次运行设置
x-i18n:
    generated_at: "2026-04-24T03:40:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ad92a18d304cde8a37459ed02140dec8c2ff0c0c052dadbae7d814af4fae4f4
    source_path: help/faq-first-run.md
    workflow: 15
---

  快速开始与首次运行问答。有关日常操作、模型、凭证、会话和故障排除，请参见主 [常见问题](/zh-CN/help/faq)。

  ## 快速开始与首次运行设置

  <AccordionGroup>
  <Accordion title="我卡住了，最快的解决办法是什么？">
    使用一个能够**看到你的机器**的本地 AI 智能体。与其去 Discord 提问，这样通常更有效，
    因为大多数“我卡住了”的情况其实都是**本地配置或环境问题**，远程协助者无法直接检查。

    - **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你机器级别的
    设置问题（PATH、服务、权限、凭证文件）。请通过可修改的（git）安装方式，
    将**完整源码检出**提供给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码 + 文档，
    并基于你实际运行的精确版本进行分析。之后你随时都可以通过重新运行安装器、
    且不带 `--install-method git`，切换回稳定版。

    提示：让智能体先**规划并监督**修复过程（逐步进行），然后只执行
    必要的命令。这样改动会更小，也更容易审计。

    如果你发现了真实的 bug 或修复，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    建议先运行以下命令（在求助时附上输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：快速查看 Gateway 网关/智能体健康状态 + 基本配置。
    - `openclaw models status`：检查提供商凭证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出现问题，最初的六十秒](#first-60-seconds-if-something-is-broken)。
    安装文档：[Install](/zh-CN/install)、[Installer flags](/zh-CN/install/installer)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。各个跳过原因是什么意思？">
    常见的 Heartbeat 跳过原因：

    - `quiet-hours`：当前不在已配置的活跃时间窗口内
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但当前还没有任何任务达到执行间隔
    - `alerts-disabled`：所有 Heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在一次真实的 Heartbeat 运行完成后，
    到期时间戳才会推进。被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行，并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导也可以自动构建 UI 资源。完成新手引导后，你通常会在 **18789** 端口运行 Gateway 网关。

    从源码开始（贡献者/开发者）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    如果你还没有全局安装，可以通过 `pnpm openclaw onboard` 运行它。

  </Accordion>

  <Accordion title="完成新手引导后，我该如何打开仪表板？">
    向导会在新手引导完成后立即用浏览器打开一个干净的（不带 token 的）仪表板 URL，
    并且也会在摘要中打印该链接。请保持该标签页打开；如果它没有自动启动，
    请在同一台机器上复制粘贴打印出的 URL。
  </Accordion>

  <Accordion title="我该如何在 localhost 和远程环境中为仪表板完成认证？">
    **localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请将已配置的 token 或密码粘贴到 Control UI 设置中。
    - Token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果还没有配置共享密钥，可使用 `openclaw doctor --generate-gateway-token` 生成一个 token。

    **不是 localhost：**

    - **Tailscale Serve**（推荐）：保持绑定到 local loopback，运行 `openclaw gateway --tailscale serve`，然后打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份标头就能满足 Control UI/WebSocket 的认证要求（无需粘贴共享密钥，前提是 Gateway 网关主机受信任）；HTTP API 仍然需要共享密钥认证，除非你明确使用私有入口 `none` 或受信任代理 HTTP 认证。
      来自同一客户端的错误并发 Serve 认证尝试，会在失败认证限流器记录之前被串行化，因此第二次错误重试时可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴匹配的共享密钥。
    - **具备身份感知的反向代理**：将 Gateway 网关置于一个非 loopback 的受信任代理之后，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开该代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。通过隧道时共享密钥认证仍然适用；如果出现提示，请粘贴已配置的 token 或密码。

    有关绑定模式和认证细节，请参见 [Dashboard](/zh-CN/web/dashboard) 和 [Web surfaces](/zh-CN/web)。

  </Accordion>

  <Accordion title="为什么聊天审批会有两个 exec approval 配置？">
    它们控制的是不同层级：

    - `approvals.exec`：将审批提示转发到聊天目的地
    - `channels.<channel>.execApprovals`：让该渠道作为 exec 审批的原生审批客户端

    宿主机 exec 策略仍然是真正的审批门控。聊天配置只控制审批
    提示出现在哪里，以及人们如何作出回应。

    在大多数设置中，你**不需要**同时启用两者：

    - 如果该聊天本身已支持命令和回复，同一聊天中的 `/approve` 会通过共享路径工作。
    - 如果某个受支持的原生渠道能够安全推断审批人，当 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，OpenClaw 现在会自动启用私信优先的原生审批。
    - 当可用原生审批卡片/按钮时，该原生 UI 就是主要路径；只有当工具结果显示聊天审批不可用，或手动审批是唯一途径时，智能体才应包含手动 `/approve` 命令。
    - 只有在提示也必须转发到其他聊天或明确的 ops 房间时，才使用 `approvals.exec`。
    - 只有在你明确希望将审批提示发回原始房间/话题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批又是单独的一层：它们默认使用同一聊天中的 `/approve`，可选 `approvals.plugin` 转发，并且只有部分原生渠道还会在此之上保留原生插件审批处理。

    简而言之：转发用于路由，原生客户端配置用于提供更丰富的渠道特定 UX。
    参见 [Exec Approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。Gateway 网关**不推荐**使用 Bun。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关很轻量——文档中写明，个人使用时 **512MB-1GB RAM**、**1 个核心** 和大约 **500MB**
    磁盘空间就足够，并且还提到 **Raspberry Pi 4 可以运行它**。

    如果你想留出更多余量（日志、媒体、其他服务），建议使用 **2GB**，
    但这不是硬性最低要求。

    提示：你可以用小型 Pi/VPS 托管 Gateway 网关，然后在你的笔记本/手机上配对 **nodes**，
    用于本地屏幕/摄像头/canvas 或命令执行。参见 [Nodes](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议吗？">
    简短回答：可以运行，但要预期会有一些边角问题。

    - 使用 **64 位** 操作系统，并保持 Node >= 22。
    - 优先选择**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 一开始不要启用渠道/Skills，之后再一个个添加。
    - 如果你遇到奇怪的二进制问题，通常都是 **ARM 兼容性** 问题。

    文档：[Linux](/zh-CN/platforms/linux)、[Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding will not hatch 了。现在怎么办？">
    这个界面依赖 Gateway 网关可访问且已完成认证。TUI 也会在首次 hatch 时自动发送
    “Wake up, my friend!”。如果你看到这句话但**没有回复**，
    并且 token 一直是 0，就说明智能体根本没有运行。

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

    3. 如果仍然卡住，请运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关是远程的，请确保隧道/Tailscale 连接已经建立，并且 UI
    指向的是正确的 Gateway 网关。参见 [Remote access](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把现有设置迁移到新机器（Mac mini）而不用重新完成新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor 即可。这样
    你的机器人就能“完全保持原样”（记忆、会话历史、凭证和渠道
    状态），前提是你复制了**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这样会保留配置、凭证配置文件、WhatsApp 凭证、会话和记忆。如果你使用的是
    远程模式，请记住会话存储和工作区属于 Gateway 网关主机。

    **重要：** 如果你只是把工作区提交/推送到 GitHub，你备份的是
    **记忆 + 引导文件**，但**不是**会话历史或凭证。那些内容位于
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容：[Migrating](/zh-CN/install/migrating)、[磁盘上的内容位置](#where-things-live-on-disk)、
    [智能体工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪里可以看到最新版本有哪些新内容？">
    请查看 GitHub 更新日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果顶部章节标记为 **Unreleased**，那么下一个带日期的
    章节就是最近一次已发布版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（在需要时还会包含 docs/other 等部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会因 Xfinity
    Advanced Security 而错误地拦截 `docs.openclaw.ai`。请禁用它，或将 `docs.openclaw.ai` 加入允许列表后重试。
    也请通过这里帮助我们解除拦截：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该网站，文档在 GitHub 上也有镜像：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版与 beta 的区别">
    **稳定版** 和 **beta** 都是 **npm dist-tag**，不是独立的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，稳定版本会先发布到 **beta**，然后通过一个显式的
    提升步骤将同一个版本移动到 `latest`。维护者也可以在需要时
    直接发布到 `latest`。这就是为什么 beta 和稳定版在提升后
    可能会指向**同一个版本**。

    查看变更内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装的一行命令，以及 beta 和 dev 的区别，请参见下方的折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（在提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的持续变动头部版本（git）；发布后，它使用 npm dist-tag `dev`。

    一行命令（macOS/Linux）：

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

  <Accordion title="如何试用最新版本？">
    有两个选项：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支，并从源码更新。

    2. **可修改安装（来自安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会得到一个可本地编辑的仓库，之后可通过 git 更新。

    如果你更喜欢手动进行干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[Update](/zh-CN/cli/update)、[开发渠道](/zh-CN/install/development-channels)、
    [Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多久？">
    大致参考：

    - **安装：** 2-5 分钟
    - **新手引导：** 5-15 分钟，取决于你配置了多少渠道/模型

    如果它卡住了，请使用 [安装器卡住了](#quick-start-and-first-run-setup)
    和 [我卡住了](#quick-start-and-first-run-setup) 中的快速调试循环。

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

    对于可修改的（git）安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）对应方式：

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项：[安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示找不到 git，或无法识别 openclaw">
    两个常见的 Windows 问题：

    **1）npm error spawn git / git not found**

    - 安装 **Git for Windows**，并确保 `git` 已加入你的 PATH。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2）安装后提示 openclaw is not recognized**

    - 你的 npm 全局 bin 目录没有加入 PATH。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH 中（Windows 上不需要 `\bin` 后缀；在大多数系统中它是 `%AppData%\npm`）。
    - 更新 PATH 后，关闭并重新打开 PowerShell。

    如果你想要最顺滑的 Windows 设置，请使用 **WSL2**，而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文——我该怎么办？">
    这通常是原生 Windows shell 的控制台代码页不匹配问题。

    症状：

    - `system.run`/`exec` 输出中的中文显示为乱码
    - 同一条命令在另一个终端配置中看起来正常

    PowerShell 中的快速变通方法：

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

    如果你在最新 OpenClaw 上仍能复现此问题，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题——我该如何获得更好的答案？">
    使用**可修改的（git）安装**，这样你就能在本地拥有完整源码和文档，然后
    在_该目录中_询问你的机器人（或 Claude/Codex），这样它就能读取仓库并给出精确回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节：[Install](/zh-CN/install) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南操作，然后运行新手引导。

    - Linux 快速路径 + 服务安装：[Linux](/zh-CN/platforms/linux)。
    - 完整演练：[入门指南](/zh-CN/start/getting-started)。
    - 安装器 + 更新：[安装与更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。先在服务器上安装，然后使用 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway 远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们有一个**托管中心**，汇总了常见提供商。选择一个并按照指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一个地方）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式是：**Gateway 网关运行在服务器上**，你通过 Control UI
    （或 Tailscale/SSH）从笔记本电脑/手机访问它。你的状态 + 工作区
    存放在服务器上，因此请将主机视为事实来源并做好备份。

    你可以将 **nodes**（Mac/iOS/Android/headless）配对到这个云端 Gateway 网关，
    以访问本地屏幕/摄像头/canvas，或在你的笔记本电脑上运行命令，同时
    将 Gateway 网关保留在云端。

    中心页：[Platforms](/zh-CN/platforms)。远程访问：[Gateway 远程访问](/zh-CN/gateway/remote)。
    Nodes：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自己更新自己吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会中断当前活动会话），可能需要一个干净的 git 检出，
    并且可能要求确认。更安全的做法是：由操作员在 shell 中运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必须从智能体中自动化执行：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[Update](/zh-CN/cli/update)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**下，它会引导你完成：

    - **模型/凭证设置**（提供商 OAuth、API key、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + 引导文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等内置渠道插件）
    - **守护进程安装**（macOS 上为 LaunchAgent；Linux/WSL2 上为 systemd 用户单元）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少凭证，它也会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以使用 **API key**（Anthropic/OpenAI/其他）运行 OpenClaw，也可以使用
    **纯本地模型**，这样你的数据就留在设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）只是这些提供商的可选认证方式。

    对于 OpenClaw 中的 Anthropic，实际区分如下：

    - **Anthropic API key**：普通的 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅认证**：Anthropic 团队成员
      告诉我们，这种用法再次被允许，因此除非 Anthropic 发布新的
      政策，否则 OpenClaw 会将 `claude -p`
      用法视为此集成的已获许可方式

    对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是更
    可预测的设置方式。OpenAI Codex OAuth 明确支持像 OpenClaw 这样的外部
    工具。

    OpenClaw 还支持其他托管型订阅选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**，以及
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [本地模型](/zh-CN/gateway/local-models)、[模型](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API key 的情况下使用 Claude Max 订阅吗？">
    可以。

    Anthropic 团队成员告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    除非 Anthropic 发布新的政策，否则 OpenClaw 会将 Claude 订阅认证和 `claude -p` 用法视为此集成中已获许可的方式。
    如果你想要最可预测的服务端设置，请改用 Anthropic API key。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅认证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 团队成员告诉我们，这种用法再次被允许，因此除非 Anthropic 发布新的政策，否则 OpenClaw 会将
    Claude CLI 复用和 `claude -p` 用法视为此集成中已获许可的方式。

    Anthropic setup-token 仍然是 OpenClaw 支持的 token 路径，但现在 OpenClaw 在可用时更倾向于复用 Claude CLI 和 `claude -p`。
    对于生产环境或多用户工作负载，Anthropic API key 凭证仍然是
    更安全、更可预测的选择。如果你想在 OpenClaw 中使用其他托管型订阅
    选项，请参见 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [GLM
    Models](/zh-CN/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
    这表示你当前时间窗口内的 **Anthropic 配额/速率限制** 已耗尽。如果你
    使用的是 **Claude CLI**，请等待窗口重置或升级你的套餐。如果你
    使用的是 **Anthropic API key**，请检查 Anthropic Console
    中的用量/计费情况，并根据需要提升限额。

    如果消息明确是：
    `Extra usage is required for long context requests`，则表示该请求正在尝试使用
    Anthropic 的 1M 上下文 beta（`context1m: true`）。这只有在你的
    凭证符合长上下文计费条件时才可用（API key 计费，或启用了 Extra Usage 的
    OpenClaw Claude 登录路径）。

    提示：设置一个**回退模型**，这样在某个提供商被限流时，OpenClaw 仍然可以继续回复。
    参见 [模型](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock（Converse）** 提供商。当存在 AWS 环境标记时，OpenClaw 可以自动发现支持流式/文本的 Bedrock 目录，并将其作为隐式 `amazon-bedrock` 提供商合并；否则你也可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或添加手动提供商条目。参见 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [模型提供商](/zh-CN/providers/models)。如果你更喜欢托管式 key 流程，在 Bedrock 前面加一个 OpenAI 兼容代理仍然是可行选项。
  </Accordion>

  <Accordion title="Codex 凭证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code (Codex)**。在默认 PI 运行器中，
    通过 Codex OAuth 使用 `openai-codex/gpt-5.5`。当前直接使用 OpenAI API key 的访问方式请用
    `openai/gpt-5.4`。一旦 OpenAI 在公共 API 中开放 GPT-5.5，就会支持
    GPT-5.5 的直接 API key 访问；目前 GPT-5.5 使用
    `openai-codex/gpt-5.5` 通过订阅/OAuth，或在原生 Codex
    app-server 运行中使用 `openai/gpt-5.5` 和 `embeddedHarness.runtime: "codex"`。
    参见 [模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍然会提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的提供商和 auth-profile id。
    它也是 Codex OAuth 的显式 PI 模型前缀：

    - `openai/gpt-5.4` = 当前在 PI 中直接使用 OpenAI API key 的路径
    - `openai/gpt-5.5` = 一旦 OpenAI 在 API 中启用 GPT-5.5 后的未来直接 API key 路径
    - `openai-codex/gpt-5.5` = PI 中的 Codex OAuth 路径
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = 原生 Codex app-server 路径
    - `openai-codex:...` = auth profile id，不是模型引用

    如果你想要直接使用 OpenAI Platform 计费/限额路径，请设置
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 订阅凭证，请通过
    `openclaw models auth login --provider openai-codex` 登录，并在 PI 运行中使用
    `openai-codex/*` 模型引用。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额会和 ChatGPT 网页版不同？">
    Codex OAuth 使用由 OpenAI 管理、依赖套餐的配额时间窗口。实际中，
    即使两者绑定的是同一个账号，这些限额也可能与 ChatGPT 网站/应用中的体验不同。

    OpenClaw 可以在
    `openclaw models status` 中显示当前可见的提供商用量/配额窗口，但它不会把 ChatGPT 网页版
    权益虚构或规范化成直接 API 访问。如果你想要直接使用 OpenAI Platform
    计费/限额路径，请使用带 API key 的 `openai/*`。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅凭证（Codex OAuth）吗？">
    支持。OpenClaw 完整支持 **OpenAI Code (Codex) 订阅 OAuth**。
    OpenAI 明确允许在像 OpenClaw 这样的外部工具/工作流中
    使用订阅 OAuth。新手引导可以为你执行 OAuth 流程。

    参见 [OAuth](/zh-CN/concepts/oauth)、[模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用的是**插件凭证流程**，而不是在 `openclaw.json` 中配置 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，使 `gemini` 出现在 `PATH` 中
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth token 存储在 Gateway 网关主机上的凭证配置文件中。详情参见：[模型提供商](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常闲聊吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小模型卡会截断并泄漏内容。如果你必须这样做，请在本地（LM Studio）运行你能使用的**最大**模型构建，并参见 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化后的模型会增加提示注入风险——参见 [安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量保持在特定区域内？">
    选择锁定区域的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；请选择美国托管变体，以将数据保留在该区域内。你仍然可以通过使用 `models.mode: "merge"` 将 Anthropic/OpenAI 一起列出，这样在遵守你所选区域化提供商的同时，回退模型仍然可用。
  </Accordion>

  <Accordion title="我必须买一台 Mac Mini 才能安装这个吗？">
    不需要。OpenClaw 可运行在 macOS 或 Linux 上（Windows 通过 WSL2）。Mac mini 是可选的——有些人
    会买一台作为始终在线的主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的设备也可以。

    只有在你需要**仅限 macOS 的工具**时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）——BlueBubbles 服务器可运行在任意 Mac 上，而 Gateway 网关可以运行在 Linux 或其他地方。如果你想使用其他仅限 macOS 的工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS node。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="要支持 iMessage，我需要 Mac mini 吗？">
    你需要**某台 macOS 设备**登录到 Messages。它**不一定**是 Mac mini——
    任何 Mac 都可以。对于 iMessage，请**使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）——BlueBubbles 服务器运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，同时在任意一台已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果你想要最简单的单机设置，也可以将所有内容都运行在 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，我可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，你的 MacBook Pro 可以作为
    **node**（配套设备）连接。Nodes 不运行 Gateway 网关——它们提供额外
    能力，例如该设备上的屏幕/摄像头/canvas 和 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（始终在线）。
    - MacBook Pro 运行 macOS 应用或 node host，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们看到过运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    要获得稳定的 Gateway 网关，请使用 **Node**。

    如果你仍想尝试 Bun，请在非生产 Gateway 网关上进行，
    并且不要启用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 应该填什么？">
    `channels.telegram.allowFrom` 是**人工发送者的 Telegram 用户 ID**（数字）。
    它不是机器人用户名。

    设置时只要求填写数字用户 ID。如果你的配置中已经存在旧版 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全的方法（不使用第三方机器人）：

    - 给你的机器人发私信，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 给你的机器人发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方方式（隐私性较差）：

    - 给 `@userinfobot` 或 `@getidsbot` 发私信。

    参见 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多人能否通过一个 WhatsApp 号码，配合不同的 OpenClaw 实例来使用？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会拥有自己的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账号**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）在每个 WhatsApp 账号层面是全局的。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置其各自的默认模型，然后将入站路由（提供商账号或特定 peers）绑定到对应智能体。示例配置见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。另见 [模型](/zh-CN/concepts/models) 和 [配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上运行吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务的 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样通过 `brew` 安装的工具才能在非登录 shell 中被正确解析。
    较新的构建还会在 Linux systemd 服务中预置常见的用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在已设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安装和 npm install 有什么区别">
    - **可修改的（git）安装：** 完整源码检出，可编辑，最适合贡献者。
      你可以在本地运行构建并修补代码/文档。
    - **npm install：** 全局 CLI 安装，没有仓库，最适合“直接运行”。
      更新来自 npm dist-tag。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="我以后可以在 npm 安装和 git 安装之间切换吗？">
    可以。安装另一种方式后，运行 Doctor，让 Gateway 网关服务指向新的入口点。
    这**不会删除你的数据**——它只会更改 OpenClaw 的代码安装方式。你的状态
    （`~/.openclaw`）和工作区（`~/.openclaw/workspace`）都会保持不变。

    从 npm 切换到 git：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    从 git 切换到 npm：

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor 会检测 Gateway 网关服务入口点不匹配，并提供重写服务配置以匹配当前安装的选项（在自动化中使用 `--repair`）。

    备份提示：参见 [备份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该把 Gateway 网关运行在笔记本电脑上，还是 VPS 上？">
    简短回答：**如果你想要 24/7 的可靠性，请使用 VPS**。如果你想要
    最低摩擦，并且能接受休眠/重启，那就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：** 没有服务器成本，可直接访问本地文件，有实时浏览器窗口。
    - **缺点：** 休眠/网络断开 = 连接中断，操作系统更新/重启会打断服务，而且必须保持唤醒。

    **VPS / 云端**

    - **优点：** 始终在线、网络稳定、没有笔记本休眠问题、更容易持续运行。
    - **缺点：** 通常是无头运行（使用截图），只能远程访问文件，而且你必须通过 SSH 执行更新。

    **OpenClaw 特定说明：** WhatsApp/Telegram/Slack/Mattermost/Discord 在 VPS 上都能正常工作。唯一真正的取舍是**无头浏览器**还是可见窗口。参见 [Browser](/zh-CN/tools/browser)。

    **推荐默认方案：** 如果你之前遇到过 Gateway 网关断连，请优先选择 VPS。如果你正在积极使用 Mac，并且想要本地文件访问或带可见浏览器的 UI 自动化，那么本地运行也很适合。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必须，但**为了可靠性和隔离性，推荐这样做**。

    - **专用主机（VPS/Mac mini/Pi）：** 始终在线，较少受到休眠/重启中断，权限更干净，更容易长期运行。
    - **共享笔记本/台式机：** 用于测试和主动使用完全没问题，但当机器休眠或更新时，预计会出现暂停。

    如果你想两全其美，可以将 Gateway 网关放在专用主机上运行，再把你的笔记本配对为一个 **node**，用于本地屏幕/摄像头/exec 工具。参见 [Nodes](/zh-CN/nodes)。
    有关安全建议，请阅读 [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 配置要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于基础的 Gateway 网关 + 一个聊天渠道：

    - **绝对最低配置：** 1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐配置：** 1-2 vCPU、2GB RAM 或更多余量（日志、媒体、多个渠道）。Node 工具和浏览器自动化可能比较吃资源。

    操作系统：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在虚拟机中运行 OpenClaw 吗？需要什么条件？">
    可以。把虚拟机视作 VPS 即可：它需要始终在线、可访问，并且有足够的
    RAM 来运行 Gateway 网关以及你启用的所有渠道。

    基线建议：

    - **绝对最低配置：** 1 vCPU、1GB RAM。
    - **推荐配置：** 如果你运行多个渠道、浏览器自动化或媒体工具，建议使用 2GB RAM 或更多。
    - **操作系统：** Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用的是 Windows，**WSL2 是最简单的虚拟机式设置**，并且具有最好的工具
    兼容性。参见 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你是在虚拟机中运行 macOS，请参见 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) — 主常见问题（模型、会话、Gateway 网关、安全等）
- [安装概览](/zh-CN/install)
- [入门指南](/zh-CN/start/getting-started)
- [故障排除](/zh-CN/help/troubleshooting)
