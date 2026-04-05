---
read_when:
    - 回答常见的设置、安装、新手引导或运行时支持问题时
    - 在深入调试前分诊用户报告的问题时
summary: 关于 OpenClaw 设置、配置和使用的常见问题解答
title: 常见问题
x-i18n:
    generated_at: "2026-04-05T10:11:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# 常见问题

快速解答，以及针对真实环境设置（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障切换）的更深入故障排除。有关运行时诊断，请参阅 [故障排除](/zh-CN/gateway/troubleshooting)。有关完整配置参考，请参阅 [Configuration](/zh-CN/gateway/configuration)。

## 如果出了问题，先看最初的六十秒

1. **快速状态（第一项检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：操作系统 + 更新、Gateway 网关/服务可达性、智能体/会话、提供商配置 + 运行时问题（当 Gateway 网关可达时）。

2. **可粘贴报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，包含日志尾部（令牌已打码）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示监督器运行时与 RPC 可达性、探测目标 URL，以及服务可能使用了哪个配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 网关健康探测，包括在支持时的渠道探测
   （需要可达的 Gateway 网关）。请参阅 [Health](/zh-CN/gateway/health)。

5. **查看最新日志尾部**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，则退回到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志分开；请参阅 [Logging](/zh-CN/logging) 和 [故障排除](/zh-CN/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置和状态 + 运行健康检查。请参阅 [Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 出错时显示目标 URL + 配置路径
   ```

   向正在运行的 Gateway 网关请求完整快照（仅 WS）。请参阅 [Health](/zh-CN/gateway/health)。

## 快速开始和首次运行设置

<AccordionGroup>
  <Accordion title="我卡住了，最快的脱困方法是什么？">
    使用一个能**看到你的机器**的本地 AI 智能体。这比去 Discord 提问有效得多，
    因为大多数“我卡住了”的情况都是**本地配置或环境问题**，
    远程协助者无法直接检查。

    - **Claude Code**： [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**： [https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你的机器级设置
    （PATH、服务、权限、认证文件）。通过可修改的（git）安装方式，
    将**完整源代码检出**提供给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码 + 文档，
    并针对你当前运行的确切版本进行分析。你之后随时可以通过重新运行安装器，
    且不带 `--install-method git`，切回稳定版本。

    提示：让智能体先**规划并监督**修复过程（逐步执行），然后只执行
    必要的命令。这样改动更小，也更容易审计。

    如果你发现了真实的 bug 或修复，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    先从这些命令开始（在求助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：Gateway 网关/智能体健康状况 + 基本配置的快速快照。
    - `openclaw models status`：检查提供商认证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出了问题，先看最初的六十秒](#如果出了问题先看最初的六十秒)。
    安装文档：[Install](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。跳过原因是什么意思？">
    常见的 heartbeat 跳过原因：

    - `quiet-hours`：不在已配置的 active-hours 时间窗口内
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但当前没有任何任务间隔到期
    - `alerts-disabled`：所有 heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在真正的 heartbeat 运行
    完成后，才会推进到期时间戳。跳过的运行不会把任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导还可以自动构建 UI 资源。完成新手引导后，你通常会在 **18789** 端口运行 Gateway 网关。

    从源码运行（贡献者/开发者）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # 首次运行时自动安装 UI 依赖
    openclaw onboard
    ```

    如果你还没有全局安装，可以通过 `pnpm openclaw onboard` 运行它。

  </Accordion>

  <Accordion title="新手引导后如何打开控制面板？">
    向导会在新手引导完成后立即用浏览器打开一个干净的（不带 token 的）控制面板 URL，并且也会在摘要中打印该链接。请保持该标签页打开；如果它没有自动启动，就在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 与远程环境中对控制面板进行认证？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请将已配置的 token 或密码粘贴到 Control UI 设置中。
    - Token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置共享密钥，可使用 `openclaw doctor --generate-gateway-token` 生成一个 token。

    **不在 localhost 上：**

    - **Tailscale Serve**（推荐）：保持绑定为 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份头会满足 Control UI/WebSocket 认证（无需粘贴共享密钥，前提是信任 Gateway 网关主机）；HTTP API 仍然需要共享密钥认证，除非你特意使用 private-ingress `none` 或 trusted-proxy HTTP 认证。
      来自同一客户端的错误并发 Serve 认证尝试会在失败认证限速器记录之前被串行化，因此第二次错误重试就可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，然后在控制面板设置中粘贴匹配的共享密钥。
    - **支持身份感知的反向代理**：将 Gateway 网关放在非 loopback 的 trusted proxy 后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。共享密钥认证在隧道中仍然生效；如有提示，请粘贴已配置的 token 或密码。

    有关绑定模式和认证详情，请参阅 [Dashboard](/web/dashboard) 和 [Web surfaces](/web)。

  </Accordion>

  <Accordion title="为什么聊天审批有两个 exec 审批配置？">
    它们控制的是不同层级：

    - `approvals.exec`：将审批提示转发到聊天目标
    - `channels.<channel>.execApprovals`：让该渠道充当 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批关卡。聊天配置只控制审批
    提示显示在哪里，以及人们如何响应它们。

    在大多数设置中，你**不需要**同时启用两者：

    - 如果聊天本身已经支持命令和回复，则同一聊天中的 `/approve` 会通过共享路径工作。
    - 如果支持的原生渠道能够安全推断审批人，OpenClaw 现在会在 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时自动启用私信优先的原生审批。
    - 当提供原生审批卡片/按钮时，这个原生 UI 是主要路径；只有当工具结果表明聊天审批不可用或手动审批是唯一途径时，智能体才应包含手动 `/approve` 命令。
    - 仅当提示也必须转发到其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 仅当你明确希望将审批提示回发到原始房间/主题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批又是另一套：默认使用同一聊天中的 `/approve`，可选 `approvals.plugin` 转发，并且只有部分原生渠道会在此之上保留插件审批原生处理。

    简而言之：转发用于路由，原生客户端配置用于提供更丰富的渠道特定 UX。
    请参阅 [Exec Approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。Gateway 网关**不推荐**使用 Bun。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关很轻量——文档列出个人使用需要 **512MB-1GB RAM**、**1 个核心**，以及大约 **500MB**
    磁盘空间，并注明 **Raspberry Pi 4 可以运行它**。

    如果你想要更多余量（日志、媒体、其他服务），**推荐 2GB**，但这
    不是硬性最低要求。

    提示：小型 Pi/VPS 可以托管 Gateway 网关，而你可以在笔记本/手机上配对**节点**，
    用于本地屏幕/摄像头/canvas 或命令执行。请参阅 [Nodes](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议吗？">
    简短回答：可以运行，但预计会有一些粗糙边缘。

    - 使用 **64 位**操作系统，并保持 Node >= 22。
    - 优先使用**可修改的（git）安装**，这样你可以看到日志并快速更新。
    - 一开始不要启用渠道/Skills，然后逐个添加。
    - 如果你碰到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding will not hatch。现在怎么办？">
    该界面依赖 Gateway 网关可达并已通过认证。TUI 还会在首次 hatch 时自动发送
    “Wake up, my friend!”。如果你看到这一行却**没有回复**，
    且 token 仍为 0，则说明智能体根本没有运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态 + 认证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然卡住，运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关是远程的，请确保隧道/Tailscale 连接正常，并且 UI
    指向了正确的 Gateway 网关。请参阅 [Remote access](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我能把设置迁移到新机器（Mac mini）上而无需重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这样
    你的机器人可以保持“完全一致”（记忆、会话历史、认证和渠道
    状态），前提是你复制了**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这样会保留配置、认证配置文件、WhatsApp 凭据、会话和记忆。如果你使用的是
    remote 模式，请记住 session 存储和工作区由 gateway 主机负责。

    **重要：**如果你只把工作区提交/推送到 GitHub，你备份的是
    **记忆 + 引导文件**，但**不是**会话历史或认证。那些内容位于
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容：[迁移](/zh-CN/install/migrating)、[磁盘上的文件位置](#磁盘上的文件位置)、
    [智能体工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [Remote mode](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪里可以查看最新版本有哪些新内容？">
    查看 GitHub 变更日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果顶部部分标记为 **Unreleased**，则下一个带日期的
    部分就是最新已发布版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（必要时还会有文档/其他部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会因 Xfinity
    Advanced Security 错误地屏蔽 `docs.openclaw.ai`。请禁用它或将 `docs.openclaw.ai` 加入允许列表，然后重试。
    也请通过这里帮我们解除屏蔽： [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档在 GitHub 上也有镜像：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版与测试版的区别">
    **稳定版**和**测试版**是 **npm dist-tag**，不是不同的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，一个稳定版本会先发布到 **beta**，然后通过一个明确的
    提升步骤将同一版本移到 `latest`。维护者也可以在需要时
    直接发布到 `latest`。这就是为什么 beta 和稳定版在提升后可以
    指向**同一版本**。

    查看变更内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装单行命令以及 beta 与 dev 的区别，请查看下面的折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 一样）。
    **Dev** 是不断移动的 `main` 头部（git）；发布时使用 npm dist-tag `dev`。

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

  <Accordion title="如何尝试最新功能？">
    有两个选项：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（通过安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会得到一个可编辑的本地仓库，然后可以通过 git 更新。

    如果你更喜欢手动进行干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[Update](/cli/update)、[开发渠道](/zh-CN/install/development-channels)、
    [Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多久？">
    粗略估计：

    - **安装：**2-5 分钟
    - **新手引导：**5-15 分钟，取决于你配置了多少渠道/模型

    如果卡住了，请使用 [安装器卡住了](#快速开始和首次运行设置)
    和 [我卡住了](#快速开始和首次运行设置) 中的快速调试循环。

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

    Windows（PowerShell）等价方式：

    ```powershell
    # install.ps1 还没有专用的 -Verbose 标志。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项：[安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示 git not found 或 openclaw not recognized">
    两个常见的 Windows 问题：

    **1）npm 错误 spawn git / git not found**

    - 安装 **Git for Windows**，并确保 `git` 已加入 PATH。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2）安装后 openclaw is not recognized**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH 中（Windows 上无需 `\bin` 后缀；大多数系统上为 `%AppData%\npm`）。
    - 更新 PATH 后关闭并重新打开 PowerShell。

    如果你想要最顺滑的 Windows 设置，请使用 **WSL2**，而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文——我该怎么做？">
    这通常是原生 Windows shell 中控制台代码页不匹配导致的。

    症状：

    - `system.run`/`exec` 输出中的中文显示为乱码
    - 同一条命令在另一个终端配置中显示正常

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

    如果在最新版本的 OpenClaw 中仍能复现，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题——如何获得更好的答案？">
    使用**可修改的（git）安装**，这样你就能在本地拥有完整源码和文档，然后
    在_该目录中_向你的机器人（或 Claude/Codex）提问，这样它就能读取仓库并给出精确回答。

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
    任何 Linux VPS 都可以。在服务器上安装，然后通过 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway remote](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们维护了一个**托管中心**，汇总常见提供商。选择其中一个并按照指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一个地方）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式是：**Gateway 网关运行在服务器上**，而你通过
    Control UI（或 Tailscale/SSH）从笔记本/手机访问它。你的状态 + 工作区
    也存储在服务器上，因此应将该主机视为事实来源并做好备份。

    你可以将**节点**（Mac/iOS/Android/headless）配对到该云端 Gateway 网关，
    以访问本地屏幕/摄像头/canvas，或在笔记本上运行命令，同时把
    Gateway 网关保留在云端。

    中心：[Platforms](/zh-CN/platforms)。远程访问：[Gateway remote](/zh-CN/gateway/remote)。
    节点：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自己更新自己吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会断开当前活动会话），可能需要一个干净的 git 检出，并且
    可能会提示确认。更安全的方式：由操作员在 shell 中运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必须从智能体中自动化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[Update](/cli/update)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**下，它会引导你完成：

    - **模型/认证设置**（支持提供商 OAuth、Claude CLI 复用和 API 密钥，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + 引导文件
    - **Gateway 网关设置**（绑定/端口/认证/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及像 QQ Bot 这样的内置渠道插件）
    - **守护进程安装**（macOS 上为 LaunchAgent；Linux/WSL2 上为 systemd 用户单元）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少认证，它还会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以通过**API 密钥**（Anthropic/OpenAI/其他）运行 OpenClaw，或者使用
    **纯本地模型**，让你的数据保留在设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）只是对这些提供商进行认证的可选方式。

    我们认为，根据 Anthropic 公开的 CLI 文档，Claude Code CLI 回退方案
    对于本地、用户自主管理的自动化可能是被允许的。尽管如此，
    Anthropic 针对外部产品中订阅支持使用场景的第三方 harness 政策
    仍存在足够多的歧义，因此我们不建议将其用于生产环境。
    此外，Anthropic 已于 **2026 年 4 月 4 日
    太平洋时间 12:00 / 英国夏令时 20:00** 通知 OpenClaw 用户，
    **OpenClaw** 的 Claude 登录路径
    属于第三方 harness 使用，现在需要单独计费的 **Extra Usage**。
    OpenAI Codex OAuth 则明确支持像 OpenClaw 这样的外部工具。

    OpenClaw 还支持其他托管型订阅选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [本地模型](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API 密钥的情况下使用 Claude Max 订阅吗？">
    可以，通过 gateway 主机上的本地 **Claude CLI** 登录实现。

    Claude Pro/Max 订阅**不包含 API 密钥**，因此在 OpenClaw 中，Claude CLI
    复用是本地回退路径。我们认为，根据
    Anthropic 公开的 CLI 文档，Claude Code CLI 回退方案
    对于本地、用户自主管理的自动化可能是被允许的。尽管如此，Anthropic 的第三方 harness
    政策对于外部产品中的订阅支持使用场景仍存在足够的歧义，因此我们
    不建议将其用于生产环境。我们建议
    使用 Anthropic API 密钥。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅认证（Claude Pro 或 Max）吗？">
    支持。使用 `openclaw models auth login --provider anthropic --method cli --set-default` 在 gateway 主机上复用本地 **Claude CLI** 登录。

    Anthropic setup-token 也再次可作为旧版/手动 OpenClaw 路径使用。Anthropic 针对 OpenClaw 的计费通知在该路径下仍然适用，因此使用时应预期 Anthropic 要求 **Extra Usage**。请参阅 [Anthropic](/zh-CN/providers/anthropic) 和 [OAuth](/zh-CN/concepts/oauth)。

    重要说明：我们认为，根据 Anthropic 公开的 CLI 文档，Claude Code CLI 回退方案
    对于本地、用户自主管理的自动化可能是被允许的。尽管如此，
    Anthropic 针对外部产品中订阅支持使用场景的第三方 harness
    政策仍存在足够多的歧义，因此我们不建议将其用于
    生产环境。Anthropic 还在 **2026 年 4 月 4 日
    太平洋时间 12:00 / 英国夏令时 20:00** 告知 OpenClaw 用户，
    **OpenClaw** Claude 登录路径
    需要单独计费的 **Extra Usage**。

    对于生产环境或多用户工作负载，Anthropic API 密钥认证是
    更安全且推荐的选择。如果你想在 OpenClaw 中使用其他订阅式托管
    选项，请参阅 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和
    [GLM Models](/zh-CN/providers/glm)。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
这意味着你当前时间窗口内的 **Anthropic 配额/速率限制** 已耗尽。如果你
使用的是 **Claude CLI**，请等待窗口重置或升级套餐。如果你
使用的是 **Anthropic API 密钥**，请检查 Anthropic Console
中的使用/计费情况，并按需提高限制。

    如果消息具体为：
    `Extra usage is required for long context requests`，说明该请求正在尝试使用
    Anthropic 的 1M 上下文测试版（`context1m: true`）。这仅在你的
    凭证符合长上下文计费条件时可用（API 密钥计费，或
    启用了 Extra Usage 的 OpenClaw Claude 登录路径）。

    提示：设置一个**回退模型**，这样当某个提供商被限速时，OpenClaw 仍可继续回复。
    请参阅 [Models](/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock (Converse)** 提供商。当存在 AWS 环境标记时，OpenClaw 可以自动发现支持流式传输/文本的 Bedrock 目录，并将其作为隐式 `amazon-bedrock` 提供商合并；否则你可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled` 或添加手动提供商条目。请参阅 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [Model providers](/zh-CN/providers/models)。如果你更喜欢托管密钥流程，在 Bedrock 前面使用 OpenAI 兼容代理仍然是可行方案。
  </Accordion>

  <Accordion title="Codex 认证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code (Codex)**。新手引导可以运行 OAuth 流程，并在适当时将默认模型设置为 `openai-codex/gpt-5.4`。请参阅 [Model providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅认证（Codex OAuth）吗？">
    支持。OpenClaw 完整支持 **OpenAI Code (Codex) 订阅 OAuth**。
    OpenAI 明确允许在像 OpenClaw 这样的外部工具/工作流中
    使用订阅 OAuth。新手引导可以为你运行这个 OAuth 流程。

    请参阅 [OAuth](/zh-CN/concepts/oauth)、[Model providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用的是**插件认证流程**，而不是在 `openclaw.json` 中配置 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，使 `gemini` 可在 `PATH` 中使用
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3.1-pro-preview`
    5. 如果请求失败，请在 gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth token 存储在 gateway 主机的认证配置文件中。详情请参阅：[Model providers](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常聊天吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小模型容易截断并泄漏。如果你一定要用，请在本地运行你能承受的**最大**模型构建（LM Studio），并查看 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化更强的模型会增加提示注入风险——请参阅 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量保持在特定区域内？">
    选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供了美国托管选项；选择美国托管变体即可将数据保留在该区域内。你仍然可以通过使用 `models.mode: "merge"` 同时列出 Anthropic/OpenAI，这样在尊重你所选区域化提供商的同时，回退模型仍然可用。
  </Accordion>

  <Accordion title="我必须买一台 Mac Mini 才能安装这个吗？">
    不需要。OpenClaw 可运行于 macOS 或 Linux（Windows 通过 WSL2）。Mac mini 只是可选项——有些人
    会买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的机器也可以。

    只有在需要**仅限 macOS 的工具**时，你才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）——BlueBubbles 服务器运行在任意 Mac 上，而 Gateway 网关可以运行在 Linux 或其他地方。如果你需要其他仅限 macOS 的工具，请在 Mac 上运行 Gateway 网关或配对一个 macOS 节点。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 支持一定需要 Mac mini 吗？">
    你需要**某个已登录 Messages 的 macOS 设备**。它**不一定**非得是 Mac mini——
    任何 Mac 都可以。对于 iMessage，**请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）——BlueBubbles 服务器运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，并在任意已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果你想要最简单的单机设置，也可以把所有内容都运行在 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，我能把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不运行 Gateway 网关——它们提供额外的
    能力，例如该设备上的 screen/camera/canvas 和 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（始终在线）。
    - MacBook Pro 运行 macOS 应用或 node host，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们看到过运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    稳定的 Gateway 网关请使用 **Node**。

    如果你仍然想尝试 Bun，请在非生产 Gateway 网关上进行，
    并且不要启用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里应该填什么？">
    `channels.telegram.allowFrom` 是**人类发送者的 Telegram 用户 ID**（数字）。不是机器人用户名。

    新手引导接受 `@username` 输入并将其解析为数字 ID，但 OpenClaw 授权只使用数字 ID。

    更安全的方式（不使用第三方机器人）：

    - 给你的机器人发私信，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 给你的机器人发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方方式（隐私性较差）：

    - 给 `@userinfobot` 或 `@getidsbot` 发私信。

    请参阅 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人能使用同一个 WhatsApp 号码配合不同的 OpenClaw 实例吗？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 形如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会拥有自己的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账户**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）是该 WhatsApp 账户全局共享的。请参阅 [Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以同时运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置各自的默认模型，然后将入站路由（提供商账户或特定 peer）绑定到各自智能体。示例配置见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。另请参阅 [Models](/zh-CN/concepts/models) 和 [Configuration](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上运行吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），以便 `brew` 安装的工具在非登录 shell 中可被解析。
    最新构建还会在 Linux systemd 服务中预置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安装与 npm install 的区别">
    - **可修改的（git）安装：**完整源码检出，可编辑，最适合贡献者。
      你可以在本地运行构建并修改代码/文档。
    - **npm install：**全局 CLI 安装，不含仓库，最适合“直接运行”。
      更新来自 npm dist-tag。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后可以在 npm 安装与 git 安装之间切换吗？">
    可以。安装另一种方式，然后运行 Doctor，使 gateway 服务指向新的入口点。
    这**不会删除你的数据**——它只会更改 OpenClaw 的代码安装方式。你的状态
    （`~/.openclaw`）和工作区（`~/.openclaw/workspace`）保持不变。

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

    Doctor 会检测 gateway 服务入口点不匹配，并提供将服务配置重写为当前安装方式的选项（在自动化中使用 `--repair`）。

    备份建议：请参阅 [备份策略](#磁盘上的文件位置)。

  </Accordion>

  <Accordion title="我应该把 Gateway 网关运行在笔记本上还是 VPS 上？">
    简短回答：**如果你想要 24/7 的可靠性，请使用 VPS**。如果你希望
    低摩擦，并且能接受休眠/重启，那么就在本地运行。

    **笔记本（本地 Gateway 网关）**

    - **优点：**没有服务器成本，直接访问本地文件，可见的浏览器窗口。
    - **缺点：**休眠/网络中断 = 断开连接，系统更新/重启会中断，必须保持唤醒。

    **VPS / 云端**

    - **优点：**始终在线，网络稳定，没有笔记本休眠问题，更容易持续运行。
    - **缺点：**通常是无头运行（用截图），只能远程访问文件，你必须通过 SSH 更新。

    **OpenClaw 特定说明：**WhatsApp/Telegram/Slack/Mattermost/Discord 都可以在 VPS 上正常运行。唯一真正的取舍是**无头浏览器**与可见窗口。请参阅 [Browser](/zh-CN/tools/browser)。

    **推荐默认选择：**如果你以前遇到过 gateway 断连，请用 VPS。当你正在主动使用 Mac，并希望访问本地文件或使用带可见浏览器的 UI 自动化时，本地运行也很好。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必须，但**为了可靠性和隔离性，推荐这样做**。

    - **专用主机（VPS/Mac mini/Pi）：**始终在线，更少受到休眠/重启干扰，权限更干净，更容易持续运行。
    - **共用笔记本/台式机：**非常适合测试和活跃使用，但机器休眠或更新时会有暂停。

    如果你想兼顾两者，可以将 Gateway 网关放在专用主机上，再把笔记本配对为**节点**以提供本地 screen/camera/exec 工具。请参阅 [Nodes](/zh-CN/nodes)。
    关于安全指导，请阅读 [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 配置和推荐操作系统是什么？">
    OpenClaw 很轻量。对于基础 Gateway 网关 + 一个聊天渠道：

    - **绝对最低配置：**1 vCPU，1GB RAM，约 500MB 磁盘。
    - **推荐配置：**1-2 vCPU，2GB RAM 或更多余量（日志、媒体、多个渠道）。Node 工具和浏览器自动化可能比较吃资源。

    操作系统：使用 **Ubuntu LTS**（或任意现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="可以在 VM 中运行 OpenClaw 吗？需要什么配置？">
    可以。把 VM 当作 VPS 即可：它需要始终在线、可达，并且有足够的
    RAM 来运行 Gateway 网关以及你启用的所有渠道。

    基线建议：

    - **绝对最低配置：**1 vCPU，1GB RAM。
    - **推荐配置：**如果你运行多个渠道、浏览器自动化或媒体工具，建议 2GB RAM 或更多。
    - **操作系统：**Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最简单的 VM 风格设置**，并且具有最佳的工具兼容性。
    请参阅 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你在 VM 中运行 macOS，请参阅 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段话说明，什么是 OpenClaw？">
    OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它会在你已经使用的消息界面上回复（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及如 QQ Bot 这类内置渠道插件），并且在支持的平台上还能提供语音 + 实时 Canvas。**Gateway 网关**是始终在线的控制平面；这个助手才是产品本身。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不只是“Claude 的一个包装壳”。它是一个**本地优先的控制平面**，让你能够在**自己的硬件**上运行一个
    强大的助手，并通过你已经在使用的聊天应用访问它，同时具备
    有状态会话、记忆和工具——而不必把你的工作流控制权交给托管式
    SaaS。

    亮点：

    - **你的设备，你的数据：**在你想要的任何地方运行 Gateway 网关（Mac、Linux、VPS），并将
      工作区 + 会话历史保留在本地。
    - **真实渠道，而不是 Web 沙箱：**WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，
      以及在支持平台上的移动语音和 Canvas。
    - **模型无关：**可使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由
      和故障切换。
    - **纯本地选项：**运行本地模型，这样**所有数据都可以保留在你的设备上**。
    - **多智能体路由：**按渠道、账户或任务拆分智能体，每个都有自己的
      工作区和默认设置。
    - **开源且可修改：**可检查、扩展并自行托管，而不受供应商锁定。

    文档：[Gateway 网关](/zh-CN/gateway)、[Channels](/zh-CN/channels)、[多智能体](/zh-CN/concepts/multi-agent)、
    [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚完成设置——我应该先做什么？">
    很适合作为起点的项目有：

    - 构建网站（WordPress、Shopify 或简单静态站点）。
    - 制作移动应用原型（大纲、界面、API 计划）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail，并自动生成摘要或后续跟进。

    它可以处理大型任务，但当你将任务拆分为多个阶段并
    使用子智能体并行工作时，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常使用场景是什么？">
    日常收益通常像这样：

    - **个人简报：**总结你关心的收件箱、日历和新闻。
    - **研究与起草：**快速调研、摘要，以及邮件或文档的初稿。
    - **提醒与跟进：**由 cron 或 heartbeat 驱动的提示和清单。
    - **浏览器自动化：**填写表单、收集数据、重复 Web 任务。
    - **跨设备协作：**从手机发送任务，让 Gateway 网关在服务器上运行，并将结果发回聊天中。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做获客、外联、广告和博客吗？">
    可以，用于**研究、筛选和起草**。它可以扫描网站、构建候选名单、
    总结潜在客户，并撰写外联或广告文案草稿。

    对于**外联或广告投放**，请保留人工参与。避免垃圾信息，遵守当地法律和
    平台政策，并在发送前审核任何内容。最安全的模式是让
    OpenClaw 起草，由你批准。

    文档：[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比，在 Web 开发方面有哪些优势？">
    OpenClaw 是一个**个人助手**和协作编排层，而不是 IDE 替代品。想要在仓库中获得最快的直接编码循环，请使用
    Claude Code 或 Codex。当你
    需要持久记忆、跨设备访问和工具编排时，请使用 OpenClaw。

    优势：

    - 跨会话的**持久记忆 + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway 网关**（可运行于 VPS，从任何地方交互）
    - 用于本地 browser/screen/camera/exec 的 **Nodes**

    展示页：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何在不让仓库变脏的情况下自定义技能？">
    请使用托管覆盖，而不是直接编辑仓库副本。将你的改动放到 `~/.openclaw/skills/<name>/SKILL.md`（或者通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此托管覆盖仍会在不触碰 git 的情况下优先生效于内置技能。如果你需要在全局安装该技能但只让部分智能体可见，请将共享副本放在 `~/.openclaw/skills` 中，并通过 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有值得上游合并的修改才应放在仓库中并以 PR 形式提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载技能吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一次会话中将其视为 `<workspace>/skills`。如果该技能只应对某些智能体可见，请搭配 `agents.defaults.skills` 或 `agents.list[].skills` 使用。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    当前支持的模式有：

    - **Cron 作业**：隔离作业可以为每个作业设置 `model` 覆盖。
    - **子智能体**：将任务路由到具有不同默认模型的独立智能体。
    - **按需切换**：使用 `/model` 随时切换当前会话模型。

    请参阅 [Cron jobs](/zh-CN/automation/cron-jobs)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行重任务时卡住了。如何卸载这类负载？">
    对于长时间或并行任务，请使用**子智能体**。子智能体在自己的会话中运行，
    返回摘要，并保持你的主聊天响应流畅。

    可以让你的机器人“为这个任务生成一个子智能体”，或者使用 `/subagents`。
    在聊天中使用 `/status` 查看 Gateway 网关当前正在做什么（以及它是否繁忙）。

    Token 提示：长任务和子智能体都会消耗 token。如果你关心成本，可通过 `agents.defaults.subagents.model` 为子智能体设置
    更便宜的模型。

    文档：[Sub-agents](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上绑定线程的 subagent 会话是如何工作的？">
    使用线程绑定。你可以将 Discord 线程绑定到某个子智能体或会话目标，这样该线程中的后续消息都会保留在这个已绑定的会话上。

    基本流程：

    - 使用 `sessions_spawn` 并设置 `thread: true` 启动（如需持久后续跟进，可再加上 `mode: "session"`）。
    - 或通过 `/focus <target>` 手动绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消焦点。
    - 使用 `/unfocus` 解除线程绑定。

    必需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档：[Sub-agents](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[Configuration Reference](/zh-CN/gateway/configuration-reference)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="一个 subagent 已完成，但完成更新发到了错误的地方，或根本没发出来。我该检查什么？">
    先检查解析出的请求方路由：

    - 完成模式下的子智能体投递会优先使用任何已绑定的线程或会话路由。
    - 如果完成来源只携带渠道，OpenClaw 会回退到请求方会话中存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），以便直接投递仍然可以成功。
    - 如果既没有已绑定路由，也没有可用的存储路由，则直接投递可能失败，结果会退回到排队会话投递，而不是立即发到聊天中。
    - 无效或过期的目标仍可能导致回退到队列，或最终投递失败。
    - 如果子任务最后一个可见的 assistant 回复正好是静默 token `NO_REPLY` / `no_reply`，或正好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制公告，而不是发布较早的陈旧进度。
    - 如果子任务在只进行了工具调用后超时，公告可能会将其折叠为简短的部分进度摘要，而不是回放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Sub-agents](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)、[Session Tools](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我该检查什么？">
    Cron 在 Gateway 网关进程内运行。如果 Gateway 网关不是持续运行，
    定时作业就不会执行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`），且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否全天候运行（没有休眠/重启）。
    - 验证作业的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 触发了，但什么都没有发送到渠道。为什么？">
    先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不期望发送任何外部消息。
    - 缺少或无效的 announce 目标（`channel` / `to`）表示运行器跳过了出站投递。
    - 渠道认证失败（`unauthorized`、`Forbidden`）表示运行器尝试投递了，但被凭证阻止。
    - 静默的隔离结果（只有 `NO_REPLY` / `no_reply`）会被视为有意不投递，因此运行器也会抑制排队回退投递。

    对于隔离的 cron 作业，运行器负责最终投递。系统期望
    智能体返回纯文本摘要，供运行器发送。`--no-deliver` 会将
    结果保留在内部；它并不允许智能体改为直接通过
    message 工具发送。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么一次隔离的 cron 运行会切换模型或重试一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离的 cron 可以在活跃运行抛出 `LiveSessionModelSwitchError` 时，
    持久化一个运行时模型切换并进行重试。该重试会保留切换后的
    provider/model，如果该切换还携带了新的认证配置文件覆盖，cron
    也会在重试前一并持久化。

    相关选择规则：

    - 如适用，Gmail hook 模型覆盖优先级最高。
    - 然后是每作业的 `model`。
    - 然后是任何已存储的 cron 会话模型覆盖。
    - 最后才是常规的智能体/默认模型选择。

    重试循环是有上限的。在初始尝试加上 2 次切换重试之后，
    cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或将 Skills 放入你的工作区。macOS 的 Skills UI 在 Linux 上不可用。
    可在 [https://clawhub.ai](https://clawhub.ai) 浏览 Skills。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    原生 `openclaw skills install` 会写入当前工作区的 `skills/`
    目录。只有当你想发布或同步自己的技能时，才需要单独安装 `clawhub` CLI。
    若要在多个智能体间共享安装，请将技能放到
    `~/.openclaw/skills` 下，并使用 `agents.defaults.skills` 或
    `agents.list[].skills`（如果你想限制可见的智能体范围）。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划运行任务，或在后台持续运行吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron 作业**：用于计划任务或重复任务（重启后仍会保留）。
    - **Heartbeat**：用于“主会话”的周期性检查。
    - **隔离作业**：用于自主智能体，它们会发布摘要或投递到聊天。

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[自动化与任务](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我能从 Linux 运行仅限 Apple macOS 的技能吗？">
    不能直接运行。macOS 技能受 `metadata.openclaw.os` 以及所需二进制文件控制，并且只有在 **Gateway 网关主机** 上符合条件时，技能才会出现在系统提示词中。在 Linux 上，`darwin` 专属技能（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖这些门控条件。

    你有三种支持的模式：

    **选项 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在存在 macOS 二进制文件的地方运行 Gateway 网关，然后通过 [远程模式](#gateway-端口已在运行和远程模式) 或 Tailscale 从 Linux 连接。因为 Gateway 网关主机是 macOS，所以这些技能会正常加载。

    **选项 B - 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并将 Mac 上的 **Node Run Commands** 设置为 “Always Ask” 或 “Always Allow”。如果节点上存在所需二进制文件，OpenClaw 可以将这些仅限 macOS 的技能视为符合条件。智能体会通过 `nodes` 工具运行这些技能。如果你选择 “Always Ask”，并在提示中批准 “Always Allow”，则该命令会加入允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    保持 Gateway 网关运行在 Linux 上，但让所需 CLI 二进制文件解析为 SSH 包装器，以便在 Mac 上运行。然后覆盖该技能以允许 Linux，使其保持符合条件。

    1. 为该二进制文件创建一个 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将该包装器加入 Linux 主机的 `PATH`（例如 `~/bin/memo`）。
    3. 覆盖技能元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动一个新会话以刷新技能快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    选项：

    - **自定义技能 / 插件：**最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：**无需写代码，但更慢也更脆弱。

    如果你想为每个客户保留上下文（例如代理机构工作流），一个简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 当前工作）。
    - 让智能体在会话开始时获取该页面。

    如果你想要原生集成，请提交功能请求，或者构建一个面向这些 API 的技能。

    安装技能：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会进入当前工作区的 `skills/` 目录。对于跨智能体共享技能，请将其放在 `~/.openclaw/skills/<name>/SKILL.md` 中。如果只希望部分智能体看到共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。某些技能要求通过 Homebrew 安装二进制文件；在 Linux 上则意味着 Linuxbrew（见上面的 Homebrew Linux 常见问题条目）。请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何让 OpenClaw 使用我当前已登录的 Chrome？">
    使用内置的 `user` 浏览器配置，它通过 Chrome DevTools MCP 附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想用自定义名称，请创建一个显式 MCP 配置：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    这条路径是主机本地的。如果 Gateway 网关运行在别处，那么请在浏览器所在机器上运行 node host，或者改用远程 CDP。

    `existing-session` / `user` 当前限制：

    - 操作是基于 ref 的，而不是基于 CSS 选择器
    - 上传需要 `ref` / `inputRef`，并且目前一次只支持一个文件
    - `responsebody`、PDF 导出、下载拦截以及批量操作仍然需要托管浏览器或原始 CDP 配置

  </Accordion>
</AccordionGroup>

## 沙箱隔离和记忆

<AccordionGroup>
  <Accordion title="有专门的沙箱隔离文档吗？">
    有。请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。关于 Docker 特定设置（完整 Gateway 网关运行于 Docker 或沙箱镜像），请参阅 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉受限——如何启用完整功能？">
    默认镜像以安全优先，并以 `node` 用户身份运行，因此它不
    包含系统包、Homebrew 或内置浏览器。要获得更完整的设置：

    - 持久化 `/home/node`，使用 `OPENCLAW_HOME_VOLUME`，以便缓存保留。
    - 用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH`，并确保该路径是持久化的。

    文档：[Docker](/zh-CN/install/docker)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我能用一个智能体，让私信保持私密，但让群组公开/沙箱化吗？">
    可以——前提是你的私密流量是**私信**，而公开流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/频道会话（非主键）会在 Docker 中运行，而主私信会话仍在主机上运行。然后通过 `tools.sandbox.tools` 限制沙箱会话中可用的工具。

    设置演练 + 示例配置：[Groups: personal DMs + public groups](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway configuration](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何将主机文件夹绑定到沙箱中？">
    设置 `agents.defaults.sandbox.docker.binds` 为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局与每智能体绑定会合并；当 `scope: "shared"` 时，每智能体绑定会被忽略。对于敏感内容请使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会根据规范化路径以及通过最深已存在祖先解析出来的规范路径来验证绑定源。这意味着即使最后一个路径段尚不存在，经由符号链接父路径逃逸的情况也仍会以关闭方式失败，并且在符号链接解析后仍会应用允许根路径检查。

    请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts) 和 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) 了解示例和安全说明。

  </Accordion>

  <Accordion title="记忆是如何工作的？">
    OpenClaw 的记忆只是智能体工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日笔记
    - `MEMORY.md` 中整理过的长期笔记（仅主/私密会话）

    OpenClaw 还会运行一个**静默的压缩前记忆刷新**，提醒模型
    在自动压缩前写入持久笔记。这仅在工作区
    可写时运行（只读沙箱会跳过）。请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="记忆总是忘事。如何让它记住？">
    告诉机器人**把这个事实写入记忆**。长期笔记应放入 `MEMORY.md`，
    短期上下文则放到 `memory/YYYY-MM-DD.md` 中。

    这是我们仍在改进的领域。提醒模型去存储记忆会有帮助；
    它知道该怎么做。如果它总是忘记，请确认 Gateway 网关每次运行都使用相同的
    工作区。

    文档：[Memory](/zh-CN/concepts/memory)、[智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永远保留吗？限制是什么？">
    记忆文件存储在磁盘上，并会一直保留，直到你删除它们。限制来自你的
    存储空间，而不是模型。**会话上下文**
    仍然受模型上下文窗口限制，因此长对话可能会被压缩或截断。这就是
    为什么存在记忆搜索——它只会将相关部分拉回上下文。

    文档：[Memory](/zh-CN/concepts/memory)、[Context](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索是否需要 OpenAI API 密钥？">
    只有在你使用 **OpenAI embeddings** 时才需要。Codex OAuth 仅覆盖聊天/补全，
    **不**授予 embeddings 访问权限，因此**使用 Codex 登录（OAuth 或
    Codex CLI 登录）**对语义记忆搜索没有帮助。OpenAI embeddings
    仍然需要真实 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你未显式设置提供商，OpenClaw 会在它
    能解析出 API 密钥（认证配置文件、`models.providers.*.apiKey` 或环境变量）时自动选择提供商。
    如果能解析到 OpenAI 密钥，它会优先选择 OpenAI；否则若能解析到 Gemini 密钥，
    则选择 Gemini；然后是 Voyage，再然后是 Mistral。如果没有可用的远程密钥，记忆
    搜索会保持禁用，直到你完成配置。如果你已配置并存在本地模型路径，OpenClaw
    会优先选择 `local`。在你显式设置
    `memorySearch.provider = "ollama"` 时，也支持 Ollama。

    如果你更想保持本地化，请设置 `memorySearch.provider = "local"`（并可选设置
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local**
    的 embedding 模型——具体设置详情请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 磁盘上的文件位置

<AccordionGroup>
  <Accordion title="OpenClaw 使用的所有数据都保存在本地吗？">
    不是——**OpenClaw 的状态是本地的**，但**外部服务仍然会看到你发送给它们的内容**。

    - **默认本地：**会话、记忆文件、配置和工作区都位于 Gateway 网关主机上
      （`~/.openclaw` + 你的工作区目录）。
    - **因需求而远程：**你发送给模型提供商（Anthropic/OpenAI 等）的消息会进入
      它们的 API，而聊天平台（WhatsApp/Telegram/Slack 等）会在
      它们的服务器上存储消息数据。
    - **你可以控制暴露面：**使用本地模型会让提示词保留在你的机器上，但渠道
      流量仍然会经过该渠道自己的服务器。

    相关内容：[智能体工作区](/zh-CN/concepts/agent-workspace)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 把数据存储在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到 auth profiles 中）               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys，以及可选的 `keyRef`/`tokenRef`）   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供商的可选文件型 secret 负载                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目已清理）                          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每智能体状态（agentDir + sessions）                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史与状态（按智能体区分）                                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（按智能体区分）                                         |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、Skills 等）是分开的，并通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于**智能体工作区**，而不是 `~/.openclaw` 中。

    - **工作区（按智能体）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`（如果没有 `MEMORY.md`，则回退到旧版 `memory.md`），
      `memory/YYYY-MM-DD.md`，以及可选的 `HEARTBEAT.md`。
    - **状态目录（`~/.openclaw`）**：配置、渠道/提供商状态、auth profiles、sessions、logs，
      和共享技能（`~/.openclaw/skills`）。

    默认工作区是 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“忘记”了内容，请确认 Gateway 网关每次启动都使用相同的
    工作区（并记住：remote 模式使用的是**gateway 主机的**
    工作区，而不是你本地笔记本的工作区）。

    提示：如果你希望某个行为或偏好能够持久保留，请让机器人**把它写进
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    请参阅 [智能体工作区](/zh-CN/concepts/agent-workspace) 和 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的**智能体工作区**放入一个**私有** git 仓库，并备份到
    私有位置（例如 GitHub 私有仓库）。这样可以保存记忆 + AGENTS/SOUL/USER
    文件，并让你之后恢复助手的“心智”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、令牌或加密 secret 负载）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （参见上面的迁移问题）。

    文档：[智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何彻底卸载 OpenClaw？">
    请参阅专门指南：[Uninstall](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，而不是硬性沙箱。
    相对路径会在工作区内解析，但绝对路径仍然可以访问主机上的其他
    位置，除非启用了沙箱隔离。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每智能体沙箱设置。如果你
    希望某个仓库成为默认工作目录，请将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库只是源代码；除非你有意让智能体在其中工作，否则应将
    工作区与其分开。

    示例（将仓库作为默认 cwd）：

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote mode：session store 在哪里？">
    会话状态由**gateway 主机**负责。如果你处于 remote 模式，你关心的会话存储位于远程机器上，而不是本地笔记本。请参阅 [会话管理](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH` 读取一个可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果该文件不存在，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何监听 / UI 显示 unauthorized'>
    非 loopback 绑定**需要有效的 gateway 认证路径**。在实际中这意味着：

    - 共享密钥认证：token 或 password
    - 在正确配置的非 loopback 身份感知反向代理后使用 `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    说明：

    - `gateway.remote.token` / `.password` 本身**不会**启用本地 gateway 认证。
    - 只有当 `gateway.auth.*` 未设置时，本地调用路径才可将 `gateway.remote.*` 作为回退。
    - 对于密码认证，请设置 `gateway.auth.mode: "password"` 并配合 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）使用。
    - 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但未成功解析，则解析会以关闭方式失败（不会由远程回退掩盖）。
    - 共享密钥 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（保存在 app/UI 设置中）。像 Tailscale Serve 或 `trusted-proxy` 这样的携带身份模式则改用请求头。避免将共享密钥放入 URL。
    - 当 `gateway.auth.mode: "trusted-proxy"` 时，同主机上的 loopback 反向代理**仍然不能**满足 trusted-proxy 认证。trusted proxy 必须是已配置的非 loopback 来源。

  </Accordion>

  <Accordion title="为什么现在在 localhost 上也需要 token？">
    OpenClaw 默认强制启用 gateway 认证，包括 loopback。在常规默认路径下，这意味着 token 认证：如果没有显式配置认证路径，gateway 启动时会解析为 token 模式并自动生成一个 token，保存到 `gateway.auth.token` 中，因此**本地 WS 客户端也必须认证**。这可以阻止其他本地进程调用 Gateway 网关。

    如果你更偏好其他认证方式，可以显式选择密码模式（或者对于非 loopback 的身份感知反向代理，选择 `trusted-proxy`）。如果你**真的**想开放 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 随时都可以帮你生成 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="更改配置后必须重启吗？">
    Gateway 网关会监视配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：对安全变更热应用，对关键变更重启
    - 也支持 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何关闭有趣的 CLI 标语？">
    在配置中设置 `cli.banner.taglineMode`：

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`：隐藏标语文本，但保留横幅标题/版本行。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：轮换有趣/季节性标语（默认行为）。
    - 如果你想完全不显示横幅，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（以及 Web 抓取）？">
    `web_fetch` 无需 API 密钥即可使用。`web_search` 取决于你选择的
    提供商：

    - 基于 API 的提供商（如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily）需要按正常方式配置 API 密钥。
    - Ollama Web 搜索无需密钥，但它会使用你配置的 Ollama 主机，并要求执行 `ollama signin`。
    - DuckDuckGo 无需密钥，但它是一个基于 HTML 的非官方集成。
    - SearXNG 无需密钥/可自行托管；配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：**运行 `openclaw configure --section web` 并选择一个提供商。
    环境变量替代方案：

    - Brave：`BRAVE_API_KEY`
    - Exa：`EXA_API_KEY`
    - Firecrawl：`FIRECRAWL_API_KEY`
    - Gemini：`GEMINI_API_KEY`
    - Grok：`XAI_API_KEY`
    - Kimi：`KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
    - MiniMax Search：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`
    - Perplexity：`PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
    - SearXNG：`SEARXNG_BASE_URL`
    - Tavily：`TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // 可选；省略则自动检测
            },
          },
        },
    }
    ```

    提供商特定的 web-search 配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧版 `tools.web.search.*` 提供商路径暂时仍可为兼容性而加载，但不应用于新配置。
    Firecrawl web-fetch 回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用允许列表，请加入 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非明确禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭证中自动检测首个就绪的 fetch 回退提供商。当前内置提供商是 Firecrawl。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web 工具](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 把我的配置清空了。如何恢复并避免再次发生？">
    `config.apply` 会替换**整个配置**。如果你发送的是部分对象，其他所有内容
    都会被移除。

    恢复方法：

    - 从备份恢复（git 或复制的 `~/.openclaw/openclaw.json`）。
    - 如果没有备份，请重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这出乎意料，请提交 bug，并附上你最后已知的配置或任何备份。
    - 本地编码智能体通常可以根据日志或历史重建一个可工作的配置。

    避免方法：

    - 小改动请使用 `openclaw config set`。
    - 交互式编辑请使用 `openclaw configure`。
    - 当你不确定确切路径或字段形状时，先使用 `config.schema.lookup`；它会返回一个浅层 schema 节点以及直接子项摘要，便于逐步深入。
    - 对部分 RPC 编辑请使用 `config.patch`；仅在需要完全替换整份配置时才使用 `config.apply`。
    - 如果你在智能体运行中使用仅所有者可用的 `gateway` 工具，它仍会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会规范化到同一受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[Config](/cli/config)、[Configure](/cli/configure)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何在多设备间运行一个中心 Gateway 网关和专门化工作节点？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**：

    - **Gateway 网关（中心）：**负责渠道（Signal/WhatsApp）、路由和会话。
    - **Nodes（设备）：**Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **Agents（工作节点）：**针对特殊角色（例如“Hetzner 运维”、“个人数据”）使用独立的大脑/工作区。
    - **子智能体：**当你需要并行处理时，从主智能体生成后台工作。
    - **TUI：**连接到 Gateway 网关并切换智能体/会话。

    文档：[Nodes](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[TUI](/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 浏览器可以无头运行吗？">
    可以。这是一个配置选项：

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    默认值为 `false`（有头模式）。无头模式在某些站点上更容易触发反机器人检查。请参阅 [Browser](/zh-CN/tools/browser)。

    无头模式使用的是**同一个 Chromium 引擎**，适用于大多数自动化场景（表单、点击、抓取、登录）。主要区别是：

    - 没有可见的浏览器窗口（如果需要视觉反馈，可用截图）。
    - 某些网站在无头模式下对自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 经常会阻止无头会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。
    完整配置示例请参阅 [Browser](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、gateway 和 nodes 之间传播？">
    Telegram 消息由**gateway** 处理。gateway 运行智能体，
    只有在需要 node 工具时才会通过**Gateway WebSocket**
    调用节点：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    节点看不到入站提供商流量；它们只接收 node RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关远程托管，我的智能体如何访问我的电脑？">
    简短回答：**把你的电脑配对为节点**。Gateway 网关运行在别处，但它可以
    通过 Gateway WebSocket 调用你本地机器上的 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在始终在线的主机上运行 Gateway 网关（VPS/家庭服务器）。
    2. 让 Gateway 网关主机和你的电脑位于同一个 tailnet 中。
    3. 确保 Gateway WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以**Remote over SSH** 模式连接（或直接通过 tailnet）
       ，以便它注册为一个节点。
    5. 在 Gateway 网关上批准该节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    无需单独的 TCP bridge；节点通过 Gateway WebSocket 连接。

    安全提醒：配对 macOS 节点允许在该机器上运行 `system.run`。只
    配对你信任的设备，并查看 [Security](/zh-CN/gateway/security)。

    文档：[Nodes](/zh-CN/nodes)、[Gateway protocol](/zh-CN/gateway/protocol)、[macOS remote mode](/zh-CN/platforms/mac/remote)、[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到回复。怎么办？">
    先检查基础项：

    - Gateway 网关是否正在运行：`openclaw gateway status`
    - Gateway 网关健康状态：`openclaw status`
    - 渠道健康状态：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，请确保 `gateway.auth.allowTailscale` 设置正确。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已建立并指向正确端口。
    - 确认你的允许列表（私信或群组）包含你的账户。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[Channels](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例能互相通信吗（本地 + VPS）？">
    可以。虽然没有内置的“机器人对机器人”桥接功能，但你可以通过几种
    可靠方式把它们连接起来：

    **最简单的方法：**使用两个机器人都可访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让 Bot A 给 Bot B 发消息，然后让 Bot B 像平常一样回复。

    **CLI 桥接（通用）：**运行一个脚本，使用
    `openclaw agent --message ... --deliver` 调用另一侧的 Gateway 网关，并将目标设为另一个机器人正在监听的聊天。
    如果其中一个机器人位于远程 VPS，请让你的 CLI 指向那个远程 Gateway 网关，
    通过 SSH/Tailscale 连接（参见 [远程访问](/zh-CN/gateway/remote)）。

    示例模式（在可访问目标 Gateway 网关的机器上运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加一道护栏，避免两个机器人无限循环回复（例如仅限提及、渠道
    允许列表，或“不要回复机器人消息”的规则）。

    文档：[远程访问](/zh-CN/gateway/remote)、[Agent CLI](/cli/agent)、[Agent send](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要分别使用不同 VPS 吗？">
    不需要。一个 Gateway 网关可以托管多个智能体，每个智能体都有自己的工作区、模型默认值
    和路由。这是正常的设置，而且比为每个智能体运行
    一台独立 VPS 更便宜、更简单。

    只有在你需要硬隔离（安全边界）或非常
    不同、且不想共享的配置时，才使用多个 VPS。否则，请保留一个 Gateway 网关，
    并使用多个智能体或子智能体。

  </Accordion>

  <Accordion title="与从 VPS 通过 SSH 访问相比，在我的个人笔记本上使用一个节点有优势吗？">
    有——节点是从远程 Gateway 网关访问你的笔记本的首选方式，而且
    它们提供的不仅仅是 shell 访问。Gateway 网关可运行在 macOS/Linux（Windows 通过 WSL2），并且
    非常轻量（小型 VPS 或 Raspberry Pi 级别的机器即可；4 GB RAM 就很充足），因此一种常见
    的设置是：始终在线的主机 + 你的笔记本作为一个节点。

    - **无需入站 SSH。**节点会主动连接到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。**`system.run` 由该笔记本上的节点允许列表/审批机制控制。
    - **更多设备工具。**节点除了 `system.run` 外，还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。**你可以把 Gateway 网关放在 VPS 上，但通过笔记本上的 node host 在本地运行 Chrome，或者通过 Chrome MCP 连接主机上的本地 Chrome。

    SSH 适合临时 shell 访问，但对于持续的智能体工作流和
    设备自动化，节点更简单。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行 gateway 服务吗？">
    不会。每台主机通常只应运行**一个 gateway**，除非你有意运行隔离配置文件（参见 [Multiple gateways](/zh-CN/gateway/multiple-gateways)）。节点是连接到 gateway 的外设
    （iOS/Android 节点，或菜单栏应用中的 macOS “node mode”）。对于无头 node
    主机和 CLI 控制，请参阅 [Node host CLI](/cli/node)。

    对 `gateway`、`discovery` 和 `canvasHost` 的更改都需要完整重启。

  </Accordion>

  <Accordion title="有没有 API / RPC 方式来应用配置？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树及其浅层 schema 节点、匹配的 UI 提示和直接子项摘要
    - `config.get`：获取当前快照 + 哈希
    - `config.patch`：安全的部分更新（大多数 RPC 编辑推荐使用）
    - `config.apply`：验证 + 替换完整配置，然后重启
    - 仅所有者可用的 `gateway` 运行时工具仍会拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会规范化到同一受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这会设置你的工作区，并限制谁可以触发机器人。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale 并从我的 Mac 连接？">
    最小步骤：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装并登录**
       - 使用 Tailscale 应用并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，以便 VPS 拥有稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情况下访问 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这样会让 gateway 保持绑定在 loopback 上，并通过 Tailscale 暴露 HTTPS。请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露**Gateway Control UI + WS**。节点通过同一个 Gateway WS 端点连接。

    推荐设置：

    1. **确保 VPS 和 Mac 位于同一个 tailnet**。
    2. **在 macOS 应用中使用 Remote 模式**（SSH 目标可以是 tailnet 主机名）。
       应用会转发 Gateway 端口并作为节点连接。
    3. **在 gateway 上批准该节点**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway protocol](/zh-CN/gateway/protocol)、[Discovery](/zh-CN/gateway/discovery)、[macOS remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装，还是只添加一个节点？">
    如果你只需要第二台笔记本上的**本地工具**（screen/camera/exec），就把它添加为一个
    **节点**。这样可以保留单一 Gateway 网关，并避免重复配置。本地节点工具
    目前仅支持 macOS，但我们计划扩展到其他操作系统。

    只有当你需要**硬隔离**或两个完全独立的机器人时，才安装第二个 Gateway 网关。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)、[Multiple gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

    - 当前工作目录中的 `.env`
    - `~/.openclaw/.env`（即 `$OPENCLAW_STATE_DIR/.env`）中的全局回退 `.env`

    两个 `.env` 文件都不会覆盖现有环境变量。

    你还可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完整优先级和来源请参阅 [/environment](/zh-CN/help/environment)。

  </Accordion>

  <Accordion title="我通过服务启动 Gateway 网关后，环境变量消失了。怎么办？">
    两个常见修复方法：

    1. 将缺失的键放入 `~/.openclaw/.env`，这样即使服务没有继承你的 shell 环境，也能被读取。
    2. 启用 shell 导入（可选便利功能）：

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    这会运行你的登录 shell，并且只导入缺失的预期键名（绝不覆盖）。等效环境变量：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示 "Shell env: off."。为什么？'>
    `openclaw models status` 报告的是**shell 环境导入**是否启用。“Shell env: off”
    **并不**意味着你的环境变量缺失——它只是表示 OpenClaw 不会自动
    加载你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。可通过以下任一方式修复：

    1. 将 token 放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将其加入配置的 `env` 块（仅在缺失时应用）。

    然后重启 gateway 并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot token 会从 `COPILOT_GITHUB_TOKEN` 读取（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）。
    请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多个聊天

<AccordionGroup>
  <Accordion title="如何开始一段全新的对话？">
    将 `/new` 或 `/reset` 作为独立消息发送。请参阅 [会话管理](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 之后过期，但这**默认关闭**（默认值为 **0**）。
    将其设置为正值即可启用空闲过期。启用后，在空闲期之后发送的**下一条**
    消息会为该聊天键启动一个新的会话 ID。
    这不会删除转录记录——它只是开启一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法组建一个 OpenClaw 实例团队（一个 CEO 和多个智能体）？">
    可以，通过**多智能体路由**和**子智能体**。你可以创建一个协调者
    智能体，以及多个拥有各自工作区和模型的工作智能体。

    不过，这更适合作为一个**有趣的实验**。它会消耗大量 token，而且通常
    不如使用一个机器人配合多个独立会话高效。我们设想的典型模式是：
    你只与一个机器人交流，但用不同会话处理并行工作。这个
    机器人在需要时也可以生成子智能体。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="为什么任务进行到一半时上下文被截断了？如何避免？">
    会话上下文受模型窗口限制。长聊天、大量工具输出或许多
    文件都可能触发压缩或截断。

    有帮助的做法：

    - 让机器人总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让机器人重新读取。
    - 对于长时间或并行工作，使用子智能体，以保持主聊天更精简。
    - 如果这种情况经常发生，请选用上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何彻底重置 OpenClaw 但保留安装？">
    使用 reset 命令：

    ```bash
    openclaw reset
    ```

    非交互式完整重置：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    然后重新运行设置：

    ```bash
    openclaw onboard --install-daemon
    ```

    注意：

    - 如果新手引导检测到已有配置，也会提供**Reset**。请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了 profiles（`--profile` / `OPENCLAW_PROFILE`），请分别重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅开发环境；会清空开发配置 + 凭证 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我遇到了 "context too large" 错误——如何重置或压缩？'>
    使用以下任一方式：

    - **压缩**（保留对话，但总结较早的轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 来指导摘要内容。

    - **重置**（对同一聊天键创建新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果这种情况持续发生：

    - 启用或调整**会话修剪**（`agents.defaults.contextPruning`）以裁剪旧工具输出。
    - 使用上下文窗口更大的模型。

    文档：[Compaction](/zh-CN/concepts/compaction)、[会话修剪](/zh-CN/concepts/session-pruning)、[会话管理](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到 "LLM request rejected: messages.content.tool_use.input field required"？'>
    这是提供商验证错误：模型发出了一个缺少必要
    `input` 的 `tool_use` 块。通常意味着会话历史陈旧或损坏（常见于长线程
    或工具/schema 变更之后）。

    解决方法：将 `/new` 作为独立消息发送以开启新会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟都会收到 heartbeat 消息？">
    Heartbeat 默认每 **30m** 运行一次（使用 OAuth 认证时为 **1h**）。你可以调节或禁用它们：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或 "0m" 以禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 Markdown
    标题，如 `# Heading`），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。
    如果该文件缺失，heartbeat 仍会运行，由模型自行决定该怎么做。

    每智能体覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把“机器人账号”加入 WhatsApp 群组吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以只要你在群里，OpenClaw 就能看到它。
    默认情况下，群组回复会被阻止，直到你允许发送者（`groupPolicy: "allowlist"`）。

    如果你只希望**自己**能触发群组回复：

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="如何获取 WhatsApp 群组的 JID？">
    选项 1（最快）：查看日志尾部，并在群组中发送一条测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    选项 2（如果已配置/已加入允许列表）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[Directory](/cli/directory)、[Logs](/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组中不回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups`，但没有包含 `"*"`，且该群组未加入允许列表。

    请参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会与私信共享上下文吗？">
    直接聊天默认会折叠到主会话。群组/频道有各自的会话键，而 Telegram 主题 / Discord 线程则是独立会话。请参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制。几十个（甚至上百个）都没问题，但请注意：

    - **磁盘增长：**会话 + 转录存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：**更多智能体意味着更多并发模型使用。
    - **运维开销：**每智能体 auth profiles、工作区和渠道路由。

    提示：

    - 每个智能体保留一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增长，修剪旧会话（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 发现零散工作区和配置文件不匹配。

  </Accordion>

  <Accordion title="我可以同时运行多个机器人或多个聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**运行多个相互隔离的智能体，并按
    渠道/账户/peer 路由入站消息。Slack 作为渠道受支持，也可绑定到特定智能体。

    浏览器访问很强大，但并不是“凡是人能做的都能做”——反机器人、CAPTCHA 和 MFA
    仍然可能阻止自动化。若要获得最可靠的浏览器控制，请在主机上使用本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 网关主机（VPS/Mac mini）。
    - 每个角色一个智能体（bindings）。
    - 将 Slack 渠道绑定到这些智能体。
    - 在需要时使用本地浏览器，通过 Chrome MCP 或节点访问。

    文档：[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [Browser](/zh-CN/tools/browser)、[Nodes](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## 模型：默认值、选择、别名、切换

<AccordionGroup>
  <Accordion title='什么是“默认模型”？'>
    OpenClaw 的默认模型就是你设置在以下位置的模型：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 的形式引用（例如：`openai/gpt-5.4`）。如果省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 唯一匹配的已配置提供商，最后才会回退到已配置的默认提供商作为一个已弃用的兼容路径。如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是继续沿用已经过时的已移除提供商默认值。你仍应**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认值：**使用你提供商栈中可用的最新一代最强模型。
    **对于启用了工具或存在不可信输入的智能体：**模型能力应优先于成本。
    **对于日常/低风险聊天：**使用更便宜的回退模型，并按智能体角色进行路由。

    MiniMax 有自己的文档：[MiniMax](/zh-CN/providers/minimax) 和
    [本地模型](/zh-CN/gateway/local-models)。

    经验法则：对于高风险工作，请使用你负担得起的**最佳模型**；而对于日常
    聊天或摘要，可使用更便宜的模型。你可以按智能体路由模型，并使用子智能体来
    并行化长任务（每个子智能体都会消耗 token）。请参阅 [Models](/zh-CN/concepts/models) 和
    [Sub-agents](/zh-CN/tools/subagents)。

    强烈警告：较弱/过度量化的模型更容易受到提示注入和不安全行为的影响。请参阅 [Security](/zh-CN/gateway/security)。

    更多背景：[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**，或仅编辑**模型**字段。避免整份配置替换。

    安全选项：

    - 在聊天中使用 `/model`（快速、按会话）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你有意替换整个配置，否则不要对部分对象使用 `config.apply`。
    对于 RPC 编辑，请先用 `config.schema.lookup` 检查，并优先使用 `config.patch`。lookup 负载会提供规范化路径、浅层 schema 文档/约束以及直接子项摘要，
    以便进行部分更新。
    如果你确实覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 进行修复。

    文档：[Models](/zh-CN/concepts/models)、[Configure](/cli/configure)、[Config](/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    可以。Ollama 是使用本地模型最简单的路径。

    最快设置方式：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型，例如 `ollama pull glm-4.7-flash`
    3. 如果你还想使用云模型，请运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 可同时获得云模型和你的本地 Ollama 模型
    - `kimi-k2.5:cloud` 这样的云模型无需本地拉取
    - 手动切换时，请使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：较小或高度量化的模型更容易受到提示
    注入影响。对于任何可以使用工具的机器人，我们强烈推荐使用**大模型**。
    如果你仍想使用小模型，请启用沙箱隔离和严格的工具允许列表。

    文档：[Ollama](/zh-CN/providers/ollama)、[本地模型](/zh-CN/gateway/local-models)、
    [Model providers](/zh-CN/concepts/model-providers)、[Security](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能各不相同，并且会随时间变化；没有固定的提供商推荐。
    - 请在每个 gateway 上使用 `openclaw models status` 检查当前运行时设置。
    - 对于安全敏感/启用工具的智能体，请使用当前可用的最新一代最强模型。
  </Accordion>

  <Accordion title="如何动态切换模型（无需重启）？">
    将 `/model` 命令作为独立消息发送：

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    这些是内置别名。自定义别名可通过 `agents.defaults.models` 添加。

    你可以使用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（以及 `/model list`）会显示一个紧凑的编号选择器。按编号选择：

    ```
    /model 3
    ```

    你也可以为提供商强制指定特定 auth profile（按会话）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示当前活跃的是哪个智能体、正在使用哪个 `auth-profiles.json` 文件，以及下一个将尝试哪个 auth profile。
    在可用时，它还会显示已配置的提供商端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消我通过 @profile 固定的 profile？**

    重新运行 `/model`，但**不要带** `@profile` 后缀：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想返回默认值，请从 `/model` 中选择默认项（或发送 `/model <default provider/model>`）。
    使用 `/model status` 确认当前活跃的是哪个 auth profile。

  </Accordion>

  <Accordion title="我可以用 GPT 5.2 处理日常任务，用 Codex 5.3 做编码吗？">
    可以。设置一个为默认值，并在需要时切换：

    - **快速切换（按会话）：**日常任务用 `/model gpt-5.4`，编码时用 `/model openai-codex/gpt-5.4` 配合 Codex OAuth。
    - **默认值 + 切换：**将 `agents.defaults.model.primary` 设为 `openai/gpt-5.4`，编码时再切换到 `openai-codex/gpt-5.4`（或反过来）。
    - **子智能体：**把编码任务路由给具有不同默认模型的子智能体。

    请参阅 [Models](/zh-CN/concepts/models) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title='为什么我会看到 "Model ... is not allowed"，然后就没有回复了？'>
    如果设置了 `agents.defaults.models`，它就会成为 `/model` 和任何
    会话覆盖的**允许列表**。选择不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    该错误会**代替**正常回复返回。修复方式：将该模型加入
    `agents.defaults.models`，移除允许列表，或从 `/model list` 中选择一个模型。

  </Accordion>

  <Accordion title='为什么我会看到 "Unknown model: minimax/MiniMax-M2.7"？'>
    这意味着**提供商未配置**（未找到 MiniMax 提供商配置或
    auth profile），因此无法解析该模型。

    修复清单：

    1. 升级到当前 OpenClaw 版本（或从源码 `main` 运行），然后重启 gateway。
    2. 确保已配置 MiniMax（通过向导或 JSON），或者环境变量/auth profiles 中存在 MiniMax 认证，
       以便能够注入匹配的提供商
       （`minimax` 使用 `MINIMAX_API_KEY`，`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或已存储的 MiniMax
       OAuth）。
    3. 使用适用于你认证路径的确切模型 ID（区分大小写）：
       API 密钥设置使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 设置使用 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       然后从列表中选择（或在聊天中使用 `/model list`）。

    请参阅 [MiniMax](/zh-CN/providers/minimax) 和 [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以把 MiniMax 设为默认模型，并在复杂任务时使用 OpenAI 吗？">
    可以。将 **MiniMax 设为默认值**，并在需要时**按会话**切换模型。
    回退用于处理**错误**，而不是“困难任务”，所以请使用 `/model` 或单独的智能体。

    **选项 A：按会话切换**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后：

    ```
    /model gpt
    ```

    **选项 B：独立智能体**

    - 智能体 A 默认：MiniMax
    - 智能体 B 默认：OpenAI
    - 按智能体路由，或使用 `/agent` 切换

    文档：[Models](/zh-CN/concepts/models)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是的。OpenClaw 提供了一些默认简写（仅当模型存在于 `agents.defaults.models` 中时才会应用）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你设置了同名自定义别名，则以你的值为准。

  </Accordion>

  <Accordion title="如何定义/覆盖模型快捷方式（别名）？">
    别名来自 `agents.defaults.models.<modelId>.alias`。示例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    然后 `/model sonnet`（或在支持时 `/<alias>`）就会解析为该模型 ID。

  </Accordion>

  <Accordion title="如何添加 OpenRouter 或 Z.AI 等其他提供商的模型？">
    OpenRouter（按 token 付费；模型众多）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM 模型）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    如果你引用了某个 provider/model，但缺少所需的提供商密钥，就会看到运行时认证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后显示 No API key found for provider**

    这通常意味着**新智能体**拥有一个空的 auth store。认证是按智能体隔离的，
    存储位置为：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>`，并在向导中配置认证。
    - 或者将主智能体 `agentDir` 中的 `auth-profiles.json` 复制到新智能体的 `agentDir` 中。

    **不要**在多个智能体之间复用 `agentDir`；这会导致认证/会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障切换和“All models failed”

<AccordionGroup>
  <Accordion title="故障切换是如何工作的？">
    故障切换分两个阶段：

    1. **同一提供商内部的 auth profile 轮换。**
    2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

    对失败的 profile 会应用冷却时间（指数退避），因此即使提供商受到速率限制或暂时失败，OpenClaw 也能继续响应。

    速率限制桶不仅包括普通的 `429` 响应。OpenClaw
    还会将诸如 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`，以及周期性
    使用窗口限制（`weekly/monthly limit reached`）这类消息视为
    值得进行故障切换的速率限制。

    一些看似计费类的响应并不是 `402`，而一些 HTTP `402`
    响应也会保留在那个瞬态桶中。如果某个提供商在 `401` 或 `403` 上返回了
    明确的计费文本，OpenClaw 仍可以将其保留在
    计费通道中，但提供商特定的文本匹配器仍然只作用于
    拥有它们的提供商（例如 OpenRouter 的 `Key limit exceeded`）。如果 `402`
    消息看起来像可重试的使用窗口或
    组织/工作区支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会将其视为
    `rate_limit`，而不是长期计费停用。

    上下文溢出错误则不同：诸如
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 这类特征会走压缩/重试路径，而不是推进模型回退。

    通用服务器错误文本的范围也刻意比“任何包含
    unknown/error 的内容”更窄。OpenClaw 确实会将提供商范围内的瞬态模式
    视为值得故障切换的超时/过载信号，例如 Anthropic 的裸
    `An unknown error occurred`、OpenRouter 的裸
    `Provider returned error`、停止原因错误如 `Unhandled stop reason:
    error`、带有瞬态服务器文本的 JSON `api_error` 负载
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及诸如 `ModelNotReadyException` 这样的 provider-busy 错误，
    只要提供商上下文匹配即可。
    而通用内部回退文本如 `LLM request failed with an unknown
    error.` 则会保持保守，不会仅凭这一条就触发模型回退。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” 是什么意思？'>
    这表示系统尝试使用 auth profile ID `anthropic:default`，但无法在预期的 auth store 中找到与之对应的凭证。

    **修复清单：**

    - **确认 auth profiles 存放位置**（新路径 vs 旧路径）
      - 当前路径：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认你的环境变量已被 Gateway 网关加载**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但通过 systemd/launchd 运行 Gateway 网关，它可能不会继承。请把它放到 `~/.openclaw/.env` 中，或启用 `env.shellEnv`。
    - **确保你编辑的是正确的智能体**
      - 多智能体设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **做一次模型/认证状态的完整检查**
      - 使用 `openclaw models status` 查看已配置模型以及提供商是否已认证。

    **针对 “No credentials found for profile anthropic” 的修复清单**

    这意味着当前运行固定到了一个 Anthropic auth profile，但 Gateway 网关
    无法在其 auth store 中找到它。

    - **使用 Claude CLI**
      - 在 gateway 主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 密钥**
      - 在**gateway 主机**上的 `~/.openclaw/.env` 中放入 `ANTHROPIC_API_KEY`。
      - 清除任何强制使用缺失 profile 的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你是在 gateway 主机上运行命令**
      - 在 remote 模式下，auth profiles 存储在 gateway 机器上，而不是你的笔记本上。

  </Accordion>

  <Accordion title="为什么它还会尝试 Google Gemini 并失败？">
    如果你的模型配置将 Google Gemini 包含为回退项（或你切换到了 Gemini 简写），OpenClaw 就会在模型回退期间尝试它。如果你尚未配置 Google 凭证，就会看到 `No API key found for provider "google"`。

    修复方法：要么提供 Google 认证，要么在 `agents.defaults.model.fallbacks` / aliases 中移除或避免使用 Google 模型，这样回退就不会路由到那里。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因：会话历史中包含**没有签名的 thinking blocks**（通常来自
    已中止/部分流式输出）。Google Antigravity 要求 thinking blocks 带有签名。

    修复：OpenClaw 现在会为 Google Antigravity Claude 去除未签名的 thinking blocks。如果仍然出现，请开始一个**新会话**，或为该智能体设置 `/thinking off`。

  </Accordion>
</AccordionGroup>

## Auth profiles：它们是什么，以及如何管理

相关内容：[/concepts/oauth](/zh-CN/concepts/oauth)（OAuth 流程、token 存储、多账户模式）

<AccordionGroup>
  <Accordion title="什么是 auth profile？">
    Auth profile 是一个与提供商绑定的、具名的凭证记录（OAuth 或 API 密钥）。Profiles 存放在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的 profile ID 是什么样的？">
    OpenClaw 使用