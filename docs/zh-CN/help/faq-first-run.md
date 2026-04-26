---
read_when:
    - 新安装、新手引导卡住或首次运行报错
    - 选择凭证和提供商订阅
    - 无法访问 docs.openclaw.ai、无法打开仪表板、安装卡住
sidebarTitle: First-run FAQ
summary: 常见问题：快速开始和首次运行设置 —— 安装、新手引导、凭证、订阅、初始故障
title: 常见问题：首次运行设置
x-i18n:
    generated_at: "2026-04-26T08:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  快速开始和首次运行问答。关于日常操作、模型、凭证、会话和故障排除，请参阅主 [常见问题](/zh-CN/help/faq)。

  ## 快速开始和首次运行设置

  <AccordionGroup>
  <Accordion title="我卡住了，最快的解决方法是什么">
    使用一个可以**看见你的机器**的本地 AI 智能体。这比在 Discord 里提问有效得多，因为大多数“我卡住了”的情况都是**本地配置或环境问题**，远程协助者无法检查。

    - **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你的机器级设置（`PATH`、服务、权限、凭证文件）。通过可修改的（git）安装方式，把**完整的源代码检出**提供给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码和文档，并基于你正在运行的确切版本进行推理。你之后始终可以通过重新运行安装程序且不带 `--install-method git` 切换回稳定版。

    提示：让智能体先**规划并监督**修复过程（逐步进行），然后只执行必要的命令。这样可以让改动更小，也更容易审计。

    如果你发现了真实的 bug 或修复方案，请提交一个 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    请先从这些命令开始（在求助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：快速查看 Gateway 网关 / 智能体健康状态和基础配置快照。
    - `openclaw models status`：检查提供商凭证和模型可用性。
    - `openclaw doctor`：验证并修复常见的配置 / 状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出现故障，先看最初的六十秒](#first-60-seconds-if-something-is-broken)。
    安装文档：[Install](/zh-CN/install)、[Installer flags](/zh-CN/install/installer)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。跳过原因分别是什么意思？">
    常见的 Heartbeat 跳过原因：

    - `quiet-hours`：不在已配置的活跃时间窗口内
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白 / 仅标题的脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但还没有任何任务间隔到期
    - `alerts-disabled`：所有 Heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在一次真实的 Heartbeat 运行完成后，到期时间戳才会推进。
    被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[Automation & Tasks](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    该仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导也可以自动构建 UI 资源。完成新手引导后，你通常会在端口 **18789** 上运行 Gateway 网关。

    从源码运行（贡献者 / 开发者）：

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

  <Accordion title="完成新手引导后，如何打开仪表板？">
    向导会在新手引导结束后立即在浏览器中打开一个干净的（不带 token 的）仪表板 URL，并且也会在摘要中打印该链接。请保持该标签页打开；如果它没有自动启动，请在同一台机器上复制 / 粘贴打印出的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 与远程环境中为仪表板做认证？">
    **localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请将已配置的 token 或密码粘贴到 Control UI 设置中。
    - Token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置共享密钥，请使用 `openclaw doctor --generate-gateway-token` 生成一个 token。

    **非 localhost：**

    - **Tailscale Serve**（推荐）：保持绑定到 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份头将满足 Control UI / WebSocket 认证要求（无需粘贴共享密钥，假定 Gateway 网关主机可信）；HTTP API 仍然需要共享密钥认证，除非你明确使用私有入口 `none` 或可信代理 HTTP 认证。
      来自同一客户端的错误并发 Serve 认证尝试会在失败认证限流器记录之前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴匹配的共享密钥。
    - **具备身份感知能力的反向代理**：将 Gateway 网关 保持在一个非 loopback 的可信代理后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。共享密钥认证在隧道上仍然适用；如果提示，请粘贴已配置的 token 或密码。

    有关绑定模式和认证细节，请参阅 [Dashboard](/zh-CN/web/dashboard) 和 [Web surfaces](/zh-CN/web)。

  </Accordion>

  <Accordion title="为什么聊天审批会有两个 exec approval 配置？">
    它们控制的是不同层级：

    - `approvals.exec`：将审批提示转发到聊天目标位置
    - `channels.<channel>.execApprovals`：使该渠道充当 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批闸门。聊天配置只控制审批提示出现在哪里，
    以及人们如何进行回应。

    在大多数设置中，你**不**需要同时使用两者：

    - 如果聊天已经支持命令和回复，则同一聊天中的 `/approve` 会通过共享路径生效。
    - 如果某个受支持的原生渠道可以安全推断审批者，OpenClaw 现在会在 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，自动启用私信优先的原生审批。
    - 当原生审批卡片 / 按钮可用时，该原生 UI 是主要路径；只有在工具结果表明聊天审批不可用，或手动审批是唯一途径时，智能体才应包含手动 `/approve` 命令。
    - 只有在提示也必须转发到其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 只有在你明确希望将审批提示发回原始房间 / 主题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批则又是单独的一层：它们默认使用同一聊天中的 `/approve`、可选的 `approvals.plugin` 转发，并且只有某些原生渠道会在此基础上继续保留原生插件审批处理。

    简而言之：转发用于路由，原生客户端配置用于提供更丰富的渠道特定 UX。
    请参阅 [Exec Approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。对于 Gateway 网关，**不推荐**使用 Bun。
  </Accordion>

  <Accordion title="能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关 很轻量——文档列出了个人使用所需配置为 **512MB - 1GB RAM**、**1 个核心** 和约 **500MB** 磁盘空间，并指出 **Raspberry Pi 4 可以运行它**。

    如果你希望有更多余量（日志、媒体、其他服务），建议使用 **2GB**，但这
    不是硬性最低要求。

    提示：一个小型 Pi / VPS 可以托管 Gateway 网关，你还可以在笔记本 / 手机上配对**节点**，用于本地屏幕 / 摄像头 / 画布或命令执行。请参阅 [Nodes](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="对于 Raspberry Pi 安装，有什么建议？">
    简短回答：可以运行，但要预期会有一些粗糙边缘。

    - 使用 **64 位**操作系统，并保持 Node >= 22。
    - 优先使用**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 先不要启用渠道 / Skills，然后逐个添加。
    - 如果你遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding 无法 hatch。现在怎么办？">
    该界面依赖 Gateway 网关可访问且已认证。TUI 也会在第一次 hatch 时自动发送
    “Wake up, my friend!”。如果你看到这一行但**没有回复**，
    并且 token 仍然是 0，那么智能体根本没有运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态和认证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然卡住，请运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关是远程的，请确保隧道 / Tailscale 连接已建立，并且 UI
    指向了正确的 Gateway 网关。请参阅 [Remote access](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把我的设置迁移到新机器（Mac mini）上，而不用重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这会
    保持你的机器人“完全一样”（记忆、会话历史、凭证和渠道
    状态），前提是你复制了**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这样会保留配置、凭证配置文件、WhatsApp 凭据、会话和记忆。如果你使用的是
    远程模式，请记住 gateway 主机拥有会话存储和工作区。

    **重要：**如果你只是把工作区提交 / 推送到 GitHub，你备份的是
    **记忆 + 引导文件**，但**不包括**会话历史或凭证。这些内容位于
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容：[Migrating](/zh-CN/install/migrating)、[磁盘上的文件位置](#where-things-live-on-disk)、
    [智能体工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="去哪里查看最新版本有哪些新内容？">
    请查看 GitHub 更新日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果顶部部分标记为 **Unreleased**，则下一个带日期的
    部分就是最新已发布版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（必要时还会有文档 / 其他部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast / Xfinity 连接会因 Xfinity
    Advanced Security 错误地拦截 `docs.openclaw.ai`。请禁用它或将 `docs.openclaw.ai` 加入允许列表，然后重试。
    也请通过这里帮助我们解除拦截：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该网站，文档也镜像在 GitHub 上：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版和 beta 版的区别">
    **稳定版** 和 **beta 版** 是 **npm dist-tags**，不是独立的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，稳定版发布会先落到 **beta**，然后通过一个显式的
    提升步骤将同一个版本移动到 `latest`。维护者也可以在需要时
    直接发布到 `latest`。这就是为什么 beta 和稳定版在提升之后
    可能指向**同一个版本**。

    查看变更内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装一键命令以及 beta 与 dev 的区别，请参阅下面的折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的移动头部版本（git）；发布时，它使用 npm dist-tag `dev`。

    一键命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装器（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多细节：[Development channels](/zh-CN/install/development-channels) 和 [Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何试用最新版本？">
    有两种方式：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（从安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会得到一个可以编辑的本地仓库，然后可通过 git 更新。

    如果你更喜欢手动进行干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[Update](/zh-CN/cli/update)、[Development channels](/zh-CN/install/development-channels)、
    [Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多长时间？">
    粗略参考：

    - **安装：**2 - 5 分钟
    - **新手引导：**5 - 15 分钟，取决于你配置了多少个渠道 / 模型

    如果卡住了，请参阅 [安装器卡住了](#quick-start-and-first-run-setup)
    和 [我卡住了](#quick-start-and-first-run-setup) 中的快速调试循环。

  </Accordion>

  <Accordion title="安装器卡住了？如何获得更多反馈？">
    使用**详细输出**重新运行安装器：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    使用详细输出安装 beta：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    对于可修改的（git）安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）等效命令：

    ```powershell
    # install.ps1 目前还没有专用的 -Verbose 标志。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项：[Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装时提示 git not found 或 openclaw not recognized">
    两个常见的 Windows 问题：

    **1) npm 错误 spawn git / git not found**

    - 安装 **Git for Windows** 并确保 `git` 在你的 `PATH` 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2) 安装后提示 openclaw is not recognized**

    - 你的 npm 全局 bin 文件夹不在 `PATH` 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 `PATH` 中（Windows 上不需要 `\bin` 后缀；在大多数系统上它是 `%AppData%\npm`）。
    - 更新 `PATH` 后，关闭并重新打开 PowerShell。

    如果你想要最顺畅的 Windows 设置体验，请使用 **WSL2**，而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文——我该怎么办？">
    这通常是原生 Windows shell 中控制台代码页不匹配导致的。

    症状：

    - `system.run` / `exec` 输出中的中文显示为乱码
    - 同样的命令在另一个终端配置中显示正常

    PowerShell 中的快速变通办法：

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

    如果你在最新版本的 OpenClaw 中仍然能复现此问题，请在这里跟踪 / 报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题——如何获得更好的答案？">
    使用**可修改的（git）安装**，这样你就能在本地拥有完整的源码和文档，然后
    在_该文件夹中_向你的机器人（或 Claude / Codex）提问，这样它就可以读取仓库并更准确地回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节：[Install](/zh-CN/install) 和 [Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南操作，然后运行新手引导。

    - Linux 快速路径 + 服务安装：[Linux](/zh-CN/platforms/linux)。
    - 完整演练：[入门指南](/zh-CN/start/getting-started)。
    - 安装器 + 更新：[Install & updates](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。安装到服务器上，然后通过 SSH / Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway remote](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端 / VPS 安装指南在哪里？">
    我们维护了一个**托管中心**，涵盖常见提供商。选择一个并按照指南操作：

    - [VPS hosting](/zh-CN/vps)（所有提供商集中在一个地方）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端中的工作方式是：**Gateway 网关运行在服务器上**，你通过
    Control UI（或 Tailscale / SSH）从你的笔记本 / 手机上访问它。你的状态和工作区
    存储在服务器上，因此应将主机视为事实来源并做好备份。

    你可以将**节点**（Mac / iOS / Android / 无头设备）配对到该云端 Gateway 网关，以访问
    本地屏幕 / 摄像头 / 画布，或在你的笔记本上运行命令，同时将
    Gateway 网关保留在云端。

    中心页：[Platforms](/zh-CN/platforms)。远程访问：[Gateway remote](/zh-CN/gateway/remote)。
    节点：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自行更新吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会断开当前会话），可能需要一个干净的 git 检出，并且
    可能会提示确认。更安全的方式是：由操作人员在 shell 中运行更新。

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

    - **模型 / 凭证设置**（提供商 OAuth、API 密钥、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置和引导文件
    - **Gateway 网关设置**（绑定 / 端口 / 认证 / Tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等内置渠道插件）
    - **守护进程安装**（macOS 上为 LaunchAgent；Linux / WSL2 上为 systemd 用户单元）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少凭证，它也会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以使用 **API 密钥**（Anthropic / OpenAI / 其他）运行 OpenClaw，或者使用
    **纯本地模型**，这样你的数据就会保留在你的设备上。订阅（Claude
    Pro / Max 或 OpenAI Codex）是这些提供商的可选认证方式。

    对于 OpenClaw 中的 Anthropic，实际区分如下：

    - **Anthropic API 密钥**：普通 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅认证**：Anthropic 团队成员
      告诉我们这种用法再次被允许，OpenClaw 因此将 `claude -p`
      用法视为该集成的受认可方式，除非 Anthropic 发布新的
      政策

    对于长期运行的 Gateway 网关主机，Anthropic API 密钥仍然是
    更可预测的设置方式。OpenAI Codex OAuth 已被明确支持用于 OpenClaw 这样的外部
    工具。

    OpenClaw 还支持其他托管式订阅选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 以及
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [Local models](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以不用 API 密钥而使用 Claude Max 订阅吗？">
    可以。

    Anthropic 团队成员告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    OpenClaw 将 Claude 订阅认证和 `claude -p` 用法视为该集成中受认可的方式，
    除非 Anthropic 发布新的政策。如果你想要
    最可预测的服务端设置，请改用 Anthropic API 密钥。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅认证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 团队成员告诉我们这种用法再次被允许，因此 OpenClaw 将
    Claude CLI 复用和 `claude -p` 用法视为该集成中受认可的方式，
    除非 Anthropic 发布新的政策。

    Anthropic setup-token 仍然作为受支持的 OpenClaw token 路径提供，但 OpenClaw 现在在可用时优先使用 Claude CLI 复用和 `claude -p`。
    对于生产环境或多用户工作负载，Anthropic API 密钥认证仍然是
    更安全、更可预测的选择。如果你想在 OpenClaw 中使用其他托管式订阅
    选项，请参阅 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [GLM
    Models](/zh-CN/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
    这意味着你当前窗口中的 **Anthropic 配额 / 速率限制** 已耗尽。如果你
    使用的是 **Claude CLI**，请等待窗口重置或升级你的套餐。如果你
    使用的是 **Anthropic API 密钥**，请检查 Anthropic Console
    中的使用量 / 计费情况，并根据需要提高限制。

    如果消息明确是：
    `Extra usage is required for long context requests`，说明该请求正在尝试使用
    Anthropic 的 1M 上下文测试版（`context1m: true`）。这只有在你的
    凭证符合长上下文计费资格时才可用（API 密钥计费，或启用了 Extra Usage 的
    OpenClaw Claude 登录路径）。

    提示：设置一个**回退模型**，这样当某个提供商受到速率限制时，OpenClaw 仍可继续回复。
    请参阅 [Models](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock（Converse）** 提供商。存在 AWS 环境标记时，OpenClaw 可以自动发现 Bedrock 的流式传输 / 文本模型目录，并将其合并为隐式的 `amazon-bedrock` 提供商；否则你也可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或添加一个手动提供商条目。请参阅 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [Model providers](/zh-CN/providers/models)。如果你更喜欢托管式密钥流程，在 Bedrock 前面使用一个 OpenAI 兼容代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 凭证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。通过默认的 PI runner 使用 Codex OAuth 时，请使用
    `openai-codex/gpt-5.5`。直接通过 OpenAI API 密钥访问时，请使用
    `openai/gpt-5.5`。GPT-5.5 也可以通过 `openai-codex/gpt-5.5` 使用
    订阅 / OAuth，或者通过 `openai/gpt-5.5` 和 `agentRuntime.id: "codex"` 使用原生 Codex app-server
    运行。
    请参阅 [Model providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍然提到 openai-codex？">
    `openai-codex` 是用于 ChatGPT / Codex OAuth 的提供商和 auth-profile id。
    它也是 Codex OAuth 的显式 PI 模型前缀：

    - `openai/gpt-5.5` = PI 中当前直接 OpenAI API 密钥路径
    - `openai-codex/gpt-5.5` = PI 中的 Codex OAuth 路径
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = 原生 Codex app-server 路径
    - `openai-codex:...` = 凭证配置文件 id，不是模型引用

    如果你想使用直接的 OpenAI Platform 计费 / 限额路径，请设置
    `OPENAI_API_KEY`。如果你想使用 ChatGPT / Codex 订阅凭证，请通过
    `openclaw models auth login --provider openai-codex` 登录，并在 PI 运行中使用
    `openai-codex/*` 模型引用。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额可能与 ChatGPT 网页版不同？">
    Codex OAuth 使用 OpenAI 管理的、取决于套餐的配额窗口。实际上，
    这些限制可能与 ChatGPT 网站 / 应用中的体验不同，即使
    两者都绑定到同一个账户。

    OpenClaw 可以在
    `openclaw models status` 中显示当前可见的提供商使用情况 / 配额窗口，但它不会凭空生成，也不会将 ChatGPT 网页版的
    权益标准化为直接 API 访问。如果你想使用直接的 OpenAI Platform
    计费 / 限额路径，请配合 API 密钥使用 `openai/*`。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅凭证（Codex OAuth）吗？">
    支持。OpenClaw 完整支持 **OpenAI Code（Codex）订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这类外部工具 / 工作流中使用订阅 OAuth。
    新手引导可以为你运行 OAuth 流程。

    请参阅 [OAuth](/zh-CN/concepts/oauth)、[Model providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用的是**插件凭证流程**，而不是 `openclaw.json` 中的 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，确保 `gemini` 位于 `PATH` 中
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth token 存储到 gateway 主机上的凭证配置文件中。详情请参阅：[Model providers](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常闲聊吗？">
    通常不适合。OpenClaw 需要大上下文和强安全性；小卡模型会截断且容易泄漏。如果你一定要用，请在本地运行你能承载的**最大**模型构建（LM Studio），并参阅 [/gateway/local-models](/zh-CN/gateway/local-models)。更小 / 量化的模型会增加 prompt injection 风险——请参阅 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量保持在特定区域内？">
    请选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；选择美国托管变体即可将数据保留在该区域内。你仍然可以通过使用 `models.mode: "merge"` 将 Anthropic / OpenAI 一并列出，这样在遵守所选区域提供商限制的同时，回退选项仍然可用。
  </Accordion>

  <Accordion title="我必须买一台 Mac mini 才能安装这个吗？">
    不必。OpenClaw 可运行在 macOS 或 Linux 上（Windows 通过 WSL2）。Mac mini 是可选的——有些人
    会买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的设备也可以。

    只有在你需要**仅限 macOS 的工具**时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）——BlueBubbles 服务器可以运行在任何 Mac 上，而 Gateway 网关可以运行在 Linux 或其他环境。如果你想使用其他仅限 macOS 的工具，请在 Mac 上运行 Gateway 网关或配对一个 macOS 节点。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="要支持 iMessage，我需要一台 Mac mini 吗？">
    你需要**某种已登录 Messages 的 macOS 设备**。它**不必**是 Mac mini——
    任何 Mac 都可以。对于 iMessage，**请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）——BlueBubbles 服务器运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - 在 Linux / VPS 上运行 Gateway 网关，同时在任意已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果你想要最简单的单机设置，可以把所有内容都运行在这台 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，我可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不运行 Gateway 网关——它们提供额外
    能力，例如该设备上的屏幕 / 摄像头 / 画布以及 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（常开）。
    - MacBook Pro 运行 macOS 应用或节点主机，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们观察到运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    对于稳定的 Gateway 网关，请使用 **Node**。

    如果你仍想试验 Bun，请在不带 WhatsApp / Telegram 的非生产 Gateway 网关上进行。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里该填什么？">
    `channels.telegram.allowFrom` 是**人工发送者的 Telegram 用户 ID**（数字）。
    它不是机器人用户名。

    设置时只要求填写数字用户 ID。如果你的配置中已经有旧版 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全的方式（不使用第三方机器人）：

    - 给你的机器人发私信，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 给你的机器人发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方方式（隐私性较低）：

    - 向 `@userinfobot` 或 `@getidsbot` 发送私信。

    请参阅 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人可以使用同一个 WhatsApp 号码连接不同的 OpenClaw 实例吗？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 格式如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会拥有自己的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账户**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）对每个 WhatsApp 账户是全局的。请参阅 [Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置各自的默认模型，然后将入站路由（提供商账户或特定 peer）绑定到各个智能体。示例配置位于 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。另请参阅 [Models](/zh-CN/concepts/models) 和 [Configuration](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上使用吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务的 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样在非登录 shell 中也能解析 `brew` 安装的工具。
    近期构建还会在 Linux systemd 服务中预置常见的用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安装与 npm install 的区别">
    - **可修改的（git）安装：**完整源码检出，可编辑，最适合贡献者。
      你可以在本地构建，并修改代码 / 文档。
    - **npm install：**全局 CLI 安装，不含仓库，最适合“直接运行”。
      更新来自 npm dist-tags。

    文档：[入门指南](/zh-CN/start/getting-started)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后我还能在 npm 和 git 安装之间切换吗？">
    可以。当 OpenClaw 已安装时，使用 `openclaw update --channel ...`。
    这**不会删除你的数据**——它只会更改 OpenClaw 的代码安装方式。
    你的状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）都不会受到影响。

    从 npm 切换到 git：

    ```bash
    openclaw update --channel dev
    ```

    从 git 切换到 npm：

    ```bash
    openclaw update --channel stable
    ```

    添加 `--dry-run` 可先预览计划中的模式切换。更新器会运行
    Doctor 后续操作、为目标渠道刷新插件源，并且
    会重启 gateway，除非你传入 `--no-restart`。

    安装器也可以强制使用任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    备份建议：请参阅 [备份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该在笔记本电脑上运行 Gateway 网关，还是在 VPS 上运行？">
    简短回答：**如果你想要 24/7 的可靠性，请使用 VPS**。如果你希望
    摩擦最小，并且可以接受休眠 / 重启，那就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：**没有服务器成本，可直接访问本地文件，有可见的浏览器窗口。
    - **缺点：**休眠 / 网络中断 = 断连，操作系统更新 / 重启会中断，且必须保持唤醒。

    **VPS / 云端**

    - **优点：**始终在线、网络稳定、没有笔记本休眠问题、更容易持续运行。
    - **缺点：**通常是无头运行（使用截图），只能远程访问文件，你必须通过 SSH 更新。

    **OpenClaw 特定说明：**WhatsApp / Telegram / Slack / Mattermost / Discord 在 VPS 上都能正常工作。唯一真正的权衡是**无头浏览器**与可见窗口之间的区别。请参阅 [Browser](/zh-CN/tools/browser)。

    **推荐默认方案：**如果你之前遇到过 gateway 断连，优先选择 VPS。当你正在主动使用 Mac，并且需要本地文件访问或通过可见浏览器进行 UI 自动化时，本地运行也非常合适。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必须，但为了**可靠性和隔离性**，**建议这样做**。

    - **专用主机（VPS / Mac mini / Pi）：**始终在线，更少受到休眠 / 重启打断，权限更干净，更容易持续运行。
    - **共享笔记本 / 台式机：**用于测试和主动使用完全没问题，但机器休眠或更新时会出现暂停。

    如果你想兼得两者优点，可以将 Gateway 网关保留在专用主机上，并将你的笔记本作为**节点**配对，以提供本地屏幕 / 摄像头 / exec 工具。请参阅 [Nodes](/zh-CN/nodes)。
    关于安全指南，请阅读 [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于基础的 Gateway 网关 + 一个聊天渠道：

    - **绝对最低配置：**1 个 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐配置：**1 - 2 个 vCPU、2GB RAM 或更高，以留出余量（日志、媒体、多个渠道）。Node 工具和浏览器自动化可能比较吃资源。

    操作系统：使用 **Ubuntu LTS**（或任何现代 Debian / Ubuntu）。Linux 安装路径在这些系统上的测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS hosting](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？要求是什么？">
    可以。将 VM 与 VPS 同样对待：它需要始终在线、可访问，并且有足够的
    RAM 用于 Gateway 网关和你启用的任何渠道。

    基线建议：

    - **绝对最低配置：**1 个 vCPU、1GB RAM。
    - **推荐配置：**如果你运行多个渠道、浏览器自动化或媒体工具，建议使用 2GB RAM 或更高。
    - **操作系统：**Ubuntu LTS 或其他现代 Debian / Ubuntu。

    如果你使用 Windows，**WSL2 是最简单的 VM 风格设置**，并且具有最佳的工具
    兼容性。请参阅 [Windows](/zh-CN/platforms/windows)、[VPS hosting](/zh-CN/vps)。
    如果你在 VM 中运行 macOS，请参阅 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) —— 主常见问题（模型、会话、gateway、安全等）
- [安装概览](/zh-CN/install)
- [入门指南](/zh-CN/start/getting-started)
- [故障排除](/zh-CN/help/troubleshooting)
