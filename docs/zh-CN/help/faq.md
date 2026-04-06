---
read_when:
    - 回答常见的设置、安装、新手引导或运行时支持问题时
    - 在进行更深入调试之前，对用户报告的问题进行初步排查时
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-04-06T12:48:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 391262b77c6c9b35253fd46b7d6fab324816c3cc25830f322f840fad0c9f58cf
    source_path: help/faq.md
    workflow: 15
---

# 常见问题

简明解答，以及针对真实场景部署（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障切换）的更深入故障排除。关于运行时诊断，请参阅 [故障排除](/zh-CN/gateway/troubleshooting)。关于完整配置参考，请参阅 [Configuration](/zh-CN/gateway/configuration)。

## 如果出现故障，最初的六十秒

1. **快速状态（第一项检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：操作系统 + 更新、Gateway 网关/服务可达性、智能体/会话、提供商配置 + 运行时问题（当 Gateway 网关可达时）。

2. **可粘贴的报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，附带日志尾部（令牌已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示监督器运行状态与 RPC 可达性、探测目标 URL，以及服务可能使用了哪个配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 网关健康探测，包括在支持时的渠道探测
   （需要可达的 Gateway 网关）。参阅 [Health](/zh-CN/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，则退回到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志是分开的；请参阅 [Logging](/zh-CN/logging) 和 [故障排除](/zh-CN/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置与状态 + 运行健康检查。参阅 [Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 出错时显示目标 URL + 配置路径
   ```

   向正在运行的 Gateway 网关请求完整快照（仅 WS）。参阅 [Health](/zh-CN/gateway/health)。

## 快速开始和首次运行设置

<AccordionGroup>
  <Accordion title="我卡住了，最快的脱困方法是什么？">
    使用一个能**看到你的机器**的本地 AI 智能体。这比在 Discord 里提问
    有效得多，因为大多数“我卡住了”的情况其实都是**本地配置或环境问题**，
    远程协助者无法直接检查。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你机器层面的
    设置问题（PATH、服务、权限、认证文件）。通过可修改的（git）安装方式，
    把**完整源代码检出**交给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码 + 文档，
    并准确理解你当前运行的版本。之后你始终可以通过重新运行安装程序并去掉
    `--install-method git` 切回稳定版。

    提示：让智能体先**规划并监督**修复过程（逐步进行），然后只执行
    必要的命令。这样改动会更小，也更容易审计。

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

    - `openclaw status`：快速查看 Gateway 网关/智能体健康状态 + 基础配置。
    - `openclaw models status`：检查提供商认证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见的配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出现故障，最初的六十秒](#first-60-seconds-if-something-is-broken)。
    安装文档：[Install](/zh-CN/install)、[Installer flags](/zh-CN/install/installer)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。各个跳过原因是什么意思？">
    常见的 Heartbeat 跳过原因：

    - `quiet-hours`：当前不在已配置的活跃时间窗口内
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但当前没有任何任务间隔到期
    - `alerts-disabled`：所有 Heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在一次真实的 Heartbeat 运行
    完成后，才会推进到期时间戳。被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[Automation & Tasks](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    该向导还可以自动构建 UI 资源。完成新手引导后，你通常会在 **18789** 端口运行 Gateway 网关。

    从源码安装（贡献者/开发者）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # 首次运行时自动安装 UI 依赖
    openclaw onboard
    ```

    如果你还没有全局安装，可以通过 `pnpm openclaw onboard` 来运行。

  </Accordion>

  <Accordion title="完成新手引导后，我该如何打开仪表板？">
    向导会在新手引导完成后立即使用一个干净的（不带令牌的）仪表板 URL 打开你的浏览器，并且也会在摘要中打印该链接。请保持该标签页打开；如果没有自动启动，就在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="我该如何在 localhost 和远程环境中为仪表板认证？">
    **localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请将已配置的令牌或密码粘贴到 Control UI 设置中。
    - 令牌来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置共享密钥，可以通过 `openclaw doctor --generate-gateway-token` 生成一个令牌。

    **不在 localhost：**

    - **Tailscale Serve**（推荐）：保持绑定 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份头会满足 Control UI/WebSocket 认证要求（无需粘贴共享密钥，假定 Gateway 网关主机可信）；HTTP API 仍然需要共享密钥认证，除非你明确使用私有入口 `none` 或受信任代理 HTTP 认证。
      来自同一客户端的错误并发 Serve 认证尝试会在失败认证限速器记录前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴匹配的共享密钥。
    - **身份感知反向代理**：让 Gateway 网关保持在一个非 loopback 的受信任代理后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。共享密钥认证在隧道上传输时仍然适用；如果出现提示，请粘贴已配置的令牌或密码。

    关于绑定模式和认证细节，请参阅 [Dashboard](/web/dashboard) 和 [Web surfaces](/web)。

  </Accordion>

  <Accordion title="为什么聊天审批会有两种 exec 审批配置？">
    它们控制的是不同层级：

    - `approvals.exec`：将审批提示转发到聊天目标
    - `channels.<channel>.execApprovals`：让该渠道作为 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批门禁。聊天配置只控制审批
    提示出现在哪里，以及人们如何回应。

    在大多数设置中，你**不**需要同时启用两者：

    - 如果聊天本身已经支持命令和回复，那么同一聊天中的 `/approve` 会通过共享路径生效。
    - 如果某个受支持的原生渠道可以安全推断审批人，OpenClaw 现在会在 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时自动启用私信优先的原生审批。
    - 当存在原生审批卡片/按钮时，该原生 UI 是主路径；只有当工具结果表明聊天审批不可用或手动审批是唯一途径时，智能体才应包含手动 `/approve` 命令。
    - 只有当提示还需要转发到其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 只有当你明确希望把审批提示发回原始房间/主题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批则是另外一套：默认使用同一聊天中的 `/approve`，可选 `approvals.plugin` 转发，并且只有部分原生渠道会在其之上保留原生插件审批处理。

    简而言之：转发用于路由，原生客户端配置用于更丰富的渠道特定 UX。
    参阅 [Exec Approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。**不推荐**使用 Bun 运行 Gateway 网关。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关非常轻量——文档中写明个人使用场景下 **512 MB - 1 GB RAM**、**1 个核心** 和大约 **500 MB**
    磁盘空间就足够，并且注明 **Raspberry Pi 4 可以运行它**。

    如果你想留出更多余量（日志、媒体、其他服务），推荐使用 **2 GB**，
    但这不是硬性最低要求。

    提示：小型 Pi/VPS 可以托管 Gateway 网关，而你可以在笔记本/手机上配对**节点**，
    以实现本地屏幕/摄像头/画布或命令执行。参阅 [Nodes](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议吗？">
    简短回答：可以运行，但要预期会遇到一些边角问题。

    - 使用 **64 位**操作系统，并保持 Node >= 22。
    - 优先使用**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 先不要启用 channels/Skills，然后逐个添加。
    - 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding will not hatch。现在怎么办？">
    该界面依赖 Gateway 网关可达且已认证。TUI 也会在首次 hatch 时自动发送
    “Wake up, my friend!”。如果你看到这行字却**没有回复**，
    且 token 仍然为 0，说明智能体从未真正运行。

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
    指向了正确的 Gateway 网关。参阅 [Remote access](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把现有设置迁移到一台新机器（Mac mini）而不用重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这会
    让你的机器人“完全保持一致”（记忆、会话历史、认证和渠道
    状态），前提是你复制了**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、认证档案、WhatsApp 凭据、会话和记忆。如果你处于
    远程模式，请记住会话存储和工作区都由 gateway 主机持有。

    **重要：**如果你只把工作区提交/推送到 GitHub，你备份的是
    **记忆 + 引导文件**，但**不是**会话历史或认证。这些都位于
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容：[Migrating](/zh-CN/install/migrating)、[磁盘上的存储位置](#where-things-live-on-disk)、
    [Agent workspace](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [Remote mode](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我去哪里查看最新版本的新内容？">
    查看 GitHub 更新日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果最顶部的部分标记为 **Unreleased**，则下一节带日期的
    部分就是最新发布版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（必要时还会有 docs/其他部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会被 Xfinity
    Advanced Security 错误地拦截 `docs.openclaw.ai`。请禁用它或将 `docs.openclaw.ai`
    加入允许列表，然后重试。
    也请通过这里帮助我们解除拦截：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档也镜像在 GitHub 上：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版和 beta 版的区别">
    **稳定版**和 **beta** 是 **npm dist-tag**，不是两条独立的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，一个稳定版本会先发布到 **beta**，然后通过一次显式
    提升步骤把同一个版本移动到 `latest`。维护者在需要时也可以
    直接发布到 `latest`。这就是为什么 beta 和稳定版在提升后
    可能指向**同一个版本**。

    查看更改内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装一行命令以及 beta 和 dev 的区别，请参阅下面的折叠项。

  </Accordion>

  <Accordion title="我该如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的滚动头部版本（git）；发布时使用 npm dist-tag `dev`。

    一行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装程序（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多细节：[Development channels](/zh-CN/install/development-channels) 和 [Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="我该如何尝试最新内容？">
    有两个选项：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（来自安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会得到一个本地仓库，可以编辑，然后通过 git 更新。

    如果你更喜欢手动进行干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[Update](/cli/update)、[Development channels](/zh-CN/install/development-channels)、
    [Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多长时间？">
    粗略参考：

    - **安装：**2 - 5 分钟
    - **新手引导：**5 - 15 分钟，取决于你配置了多少渠道/模型

    如果它卡住了，请使用 [Installer stuck](#quick-start-and-first-run-setup)
    以及 [我卡住了](#quick-start-and-first-run-setup) 中的快速调试循环。

  </Accordion>

  <Accordion title="安装程序卡住了？我该如何获取更多反馈？">
    重新运行安装程序，并启用**详细输出**：

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

    Windows（PowerShell）等效方式：

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

    **1）npm 错误 spawn git / git not found**

    - 安装 **Git for Windows**，并确保 `git` 在你的 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装程序。

    **2）安装后 openclaw is not recognized**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH（Windows 上不需要 `\bin` 后缀；在大多数系统中它是 `%AppData%\npm`）。
    - 更新 PATH 后，关闭并重新打开 PowerShell。

    如果你想要最顺滑的 Windows 设置体验，请使用 **WSL2**，而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文 - 我该怎么办？">
    这通常是原生 Windows shell 中控制台代码页不匹配导致的。

    症状：

    - `system.run`/`exec` 输出中的中文显示为乱码
    - 同一命令在另一个终端配置中显示正常

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

    如果你在最新 OpenClaw 上仍能复现该问题，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题 - 我该如何得到更好的答案？">
    使用**可修改的（git）安装**，这样你就可以在本地拥有完整源码和文档，然后
    从该文件夹中向你的机器人（或 Claude/Codex）提问，
    这样它就能读取仓库并给出精确回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节：[Install](/zh-CN/install) 和 [Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="我该如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南，然后运行新手引导。

    - Linux 快速路径 + 服务安装：[Linux](/zh-CN/platforms/linux)。
    - 完整演练：[入门指南](/zh-CN/start/getting-started)。
    - 安装程序 + 更新：[Install & updates](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="我该如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。先在服务器上安装，然后通过 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway remote](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们提供一个**托管中心**，汇总常见提供商。选择一个并按照指南操作：

    - [VPS hosting](/zh-CN/vps)（所有提供商集中在一处）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    在云中它的工作方式是：**Gateway 网关运行在服务器上**，而你通过
    Control UI（或 Tailscale/SSH）从笔记本/手机访问它。你的状态 + 工作区
    都保存在服务器上，因此请将主机视为唯一事实来源并做好备份。

    你可以将**节点**（Mac/iOS/Android/无头）配对到这个云端 Gateway 网关，
    以访问本地屏幕/摄像头/画布，或在笔记本上运行命令，同时让
    Gateway 网关保留在云中。

    中心页：[Platforms](/zh-CN/platforms)。远程访问：[Gateway remote](/zh-CN/gateway/remote)。
    节点：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自行更新吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会中断当前会话），可能需要一个干净的 git 检出，
    还可能提示你确认。更安全的做法是由操作员在 shell 中执行更新。

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

    文档：[Update](/cli/update)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**下，它会引导你完成：

    - **模型/认证设置**（提供商 OAuth、API 密钥、Anthropic 旧版 setup-token，以及 LM Studio 之类的本地模型选项）
    - **工作区**位置 + 引导文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及像 QQ Bot 这样的内置渠道插件）
    - **守护进程安装**（macOS 上为 LaunchAgent；Linux/WSL2 上为 systemd 用户单元）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少认证，它也会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以通过 **API 密钥**（Anthropic/OpenAI/其他）来运行 OpenClaw，
    也可以使用**纯本地模型**，这样你的数据就会保留在设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）只是认证这些提供商的可选方式。

    对于 OpenClaw 中的 Anthropic，实际区别是：

    - **Anthropic API 密钥**：正常的 Anthropic API 计费
    - **OpenClaw 中的 Claude 订阅认证**：Anthropic 于
      **2026 年 4 月 4 日太平洋时间下午 12:00 / 英国夏令时晚上 8:00** 告知 OpenClaw 用户，
      这需要**Extra Usage**，并且会在订阅之外单独计费

    我们的本地复现还表明，`claude -p --append-system-prompt ...` 在附加提示中标识
    OpenClaw 时，也可能触发同样的 Extra Usage 限制；
    而在 Anthropic SDK + API 密钥路径中，使用相同的提示字符串
    则**不会**复现这一阻断。OpenAI Codex OAuth 明确
    支持在 OpenClaw 这样的外部工具中使用。

    OpenClaw 还支持其他托管型订阅选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [Local models](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API 密钥的情况下使用 Claude Max 订阅吗？">
    可以，但请将其视为**带 Extra Usage 的 Claude 订阅认证**。

    Claude Pro/Max 订阅并不包含 API 密钥。在 OpenClaw 中，这
    意味着 Anthropic 针对 OpenClaw 的计费通知仍然适用：订阅
    流量需要 **Extra Usage**。如果你希望使用 Anthropic 且不经过
    这条 Extra Usage 路径，请改用 Anthropic API 密钥。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅认证（Claude Pro 或 Max）吗？">
    支持，但当前支持的理解方式是：

    - 在 OpenClaw 中使用订阅认证 Anthropic，意味着 **Extra Usage**
    - 在 OpenClaw 中不走这条路径使用 Anthropic，则意味着 **API 密钥**

    Anthropic setup-token 仍然可作为 OpenClaw 中的旧版/手动路径使用，
    Anthropic 针对 OpenClaw 的计费通知在该路径中仍然适用。我们
    还在本地使用直接的
    `claude -p --append-system-prompt ...` 时复现了相同的计费限制，
    条件是附加提示中明确标识了 OpenClaw，而相同的提示字符串在
    Anthropic SDK + API 密钥路径中则**不会**复现。

    对于生产环境或多用户工作负载，Anthropic API 密钥认证是
    更安全、更推荐的选择。如果你想在 OpenClaw 中使用其他订阅式托管
    选项，请参阅 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和
    [GLM Models](/zh-CN/providers/glm)。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
这意味着你在当前时间窗口中的 **Anthropic 配额/速率限制** 已耗尽。如果你
使用 **Claude CLI**，请等待该窗口重置，或升级你的套餐。如果你
使用 **Anthropic API 密钥**，请检查 Anthropic Console
中的用量/计费情况，并按需提高限制。

    如果消息明确写着：
    `Extra usage is required for long context requests`，说明该请求正在尝试使用
    Anthropic 的 1M 上下文 beta（`context1m: true`）。这只有在你的
    凭据具备长上下文计费资格时才有效（API 密钥计费或
    启用了 Extra Usage 的 OpenClaw Claude 登录路径）。

    提示：设置一个**后备模型**，这样在某个提供商被限流时，OpenClaw 仍能继续回复。
    参阅 [Models](/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock（Converse）** 提供商。当存在 AWS 环境标记时，OpenClaw 可以自动发现 Bedrock 的流式/文本模型目录，并将其作为隐式 `amazon-bedrock` 提供商合并；否则你也可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled` 或手动添加一个提供商条目。参阅 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [Model providers](/zh-CN/providers/models)。如果你更偏好托管密钥流程，在 Bedrock 前面加一个兼容 OpenAI 的代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 认证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。新手引导可以运行 OAuth 流程，并会在合适时将默认模型设置为 `openai-codex/gpt-5.4`。参阅 [Model providers](/zh-CN/concepts/model-providers) 和 [Onboarding（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅认证（Codex OAuth）吗？">
    支持。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这样的外部工具/工作流中
    使用订阅 OAuth。新手引导可以为你运行该 OAuth 流程。

    参阅 [OAuth](/zh-CN/concepts/oauth)、[Model providers](/zh-CN/concepts/model-providers) 和 [Onboarding（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="我该如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用的是**插件认证流程**，而不是在 `openclaw.json` 中填写 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，使 `gemini` 位于 `PATH` 中
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3.1-pro-preview`
    5. 如果请求失败，请在 gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth 令牌存储在 gateway 主机上的认证档案中。详情： [Model providers](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合轻松闲聊吗？">
    通常不适合。OpenClaw 需要较大的上下文 + 强安全性；小模型容易截断并泄漏信息。如果你一定要这样做，请在本地运行你能承载的**最大**模型构建（LM Studio），并参阅 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化更重的模型会增加提示注入风险——参阅 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="我如何将托管模型流量限制在特定区域？">
    请选择固定区域的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供了美国托管选项；选择美国托管变体即可将数据保留在该区域。你仍然可以通过使用 `models.mode: "merge"` 将 Anthropic/OpenAI 一起列出，这样在遵守所选区域提供商的前提下，也能保留后备选项。
  </Accordion>

  <Accordion title="安装这个一定要买一台 Mac Mini 吗？">
    不需要。OpenClaw 可运行在 macOS 或 Linux 上（Windows 通过 WSL2）。Mac mini 是可选项——有些人
    会买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的机器也能胜任。

    你只在需要**仅限 macOS 的工具**时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）——BlueBubbles 服务器可以运行在任何 Mac 上，而 Gateway 网关可以运行在 Linux 或其他地方。如果你需要其他仅限 macOS 的工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS 节点。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="要支持 iMessage，我需要一台 Mac mini 吗？">
    你需要**某个已登录 Messages 的 macOS 设备**。它**不一定**要是 Mac mini——
    任何 Mac 都可以。对于 iMessage，请**使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）——BlueBubbles 服务器运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，并在任意登录了 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果你想要最简单的单机设置，就把所有内容都运行在 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，我可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不运行 Gateway 网关——它们提供额外
    的能力，比如该设备上的屏幕/摄像头/画布以及 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（始终在线）。
    - MacBook Pro 运行 macOS 应用或节点主机，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看状态。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们观察到运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    稳定的 Gateway 网关请使用 **Node**。

    如果你仍然想尝试 Bun，请仅在非生产 Gateway 网关上
    且不要搭配 WhatsApp/Telegram 使用。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里应该填什么？">
    `channels.telegram.allowFrom` 填的是**人工发送者的 Telegram 用户 ID**（数字）。
    它不是机器人用户名。

    新手引导接受 `@username` 输入，并会将其解析为数字 ID，但 OpenClaw 授权只使用数字 ID。

    更安全的方式（无需第三方机器人）：

    - 给你的机器人发私信，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 给你的机器人发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方方式（隐私性较低）：

    - 给 `@userinfobot` 或 `@getidsbot` 发私信。

    参阅 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个用户可以共用一个 WhatsApp 号码，对应不同的 OpenClaw 实例吗？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**
    （peer `kind: "direct"`，发送者 E.164 例如 `+15551234567`）绑定到不同的 `agentId`，
    这样每个人都会拥有自己的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账号**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）在整个 WhatsApp 账号层面是全局的。参阅 [Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以同时运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置其各自的默认模型，然后将入站路由（提供商账号或特定 peer）绑定到各个智能体。示例配置见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。另请参阅 [Models](/zh-CN/concepts/models) 和 [Configuration](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上使用吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务的 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样 `brew` 安装的工具才能在非登录 shell 中被解析。
    最近的构建也会在 Linux systemd 服务中预置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安装和 npm install 有什么区别">
    - **可修改的（git）安装：**完整源码检出、可编辑，最适合贡献者。
      你需要在本地构建，并可修改代码/文档。
    - **npm install：**全局 CLI 安装，没有仓库，最适合“直接运行”。
      更新来自 npm dist-tag。

    文档：[入门指南](/zh-CN/start/getting-started)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后我可以在 npm 安装和 git 安装之间切换吗？">
    可以。安装另一种形式后，运行 Doctor，使 gateway 服务指向新的入口点。
    这**不会删除你的数据**——它只会更改 OpenClaw 代码安装。你的状态
    （`~/.openclaw`）和工作区（`~/.openclaw/workspace`）都不会被触碰。

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

    Doctor 会检测 gateway 服务入口点不匹配，并提供重写服务配置以匹配当前安装的选项（在自动化中使用 `--repair`）。

    备份建议：参阅 [备份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该在笔记本电脑上运行 Gateway 网关还是放在 VPS 上？">
    简短回答：**如果你想要 24/7 的可靠性，就用 VPS**。如果你想要
    最低使用门槛，并且能接受睡眠/重启，那么就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：**没有服务器成本，可直接访问本地文件，有可见的浏览器窗口。
    - **缺点：**睡眠/网络中断 = 断连，操作系统更新/重启会打断运行，必须保持唤醒。

    **VPS / 云端**

    - **优点：**始终在线，网络稳定，没有笔记本睡眠问题，更容易长期运行。
    - **缺点：**通常是无头运行（使用截图），只能远程访问文件，更新时必须通过 SSH。

    **OpenClaw 特定说明：**WhatsApp/Telegram/Slack/Mattermost/Discord 都可以在 VPS 上良好运行。真正的取舍只有**无头浏览器**与**可见窗口**。参阅 [Browser](/zh-CN/tools/browser)。

    **推荐默认方案：**如果你之前遇到过 gateway 断连，优先用 VPS。本地运行非常适合你正在积极使用 Mac、并希望访问本地文件或通过可见浏览器进行 UI 自动化的场景。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必须，但为了可靠性和隔离性，**推荐这样做**。

    - **专用主机（VPS/Mac mini/Pi）：**始终在线，更少睡眠/重启中断，权限更清晰，更容易持续运行。
    - **共享笔记本/台式机：**非常适合测试和活跃使用，但要预期机器睡眠或更新时会暂停。

    如果你想兼顾两者，请把 Gateway 网关放在专用主机上，并把你的笔记本配对为一个**节点**，用于本地屏幕/摄像头/exec 工具。参阅 [Nodes](/zh-CN/nodes)。
    关于安全指南，请阅读 [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 配置要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于一个基础 Gateway 网关 + 一个聊天渠道：

    - **绝对最低配置：**1 vCPU、1 GB RAM、约 500 MB 磁盘。
    - **推荐配置：**1 - 2 vCPU、2 GB RAM 或更高，以留出余量（日志、媒体、多个渠道）。Node 工具和浏览器自动化可能更耗资源。

    操作系统：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS hosting](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在虚拟机中运行 OpenClaw 吗？需要什么配置？">
    可以。请将虚拟机视为 VPS：它需要始终在线、可被访问，并且拥有足够的
    RAM 来运行 Gateway 网关和你启用的任何渠道。

    基线建议：

    - **绝对最低配置：**1 vCPU、1 GB RAM。
    - **推荐配置：**如果你运行多个渠道、浏览器自动化或媒体工具，则建议 2 GB RAM 或更多。
    - **操作系统：**Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最容易的虚拟机式设置**，并且工具兼容性最好。
    参阅 [Windows](/zh-CN/platforms/windows)、[VPS hosting](/zh-CN/vps)。
    如果你在虚拟机中运行 macOS，请参阅 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段话介绍 OpenClaw 是什么？">
    OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它会在你已经使用的消息界面上回复你（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及像 QQ Bot 这样的内置渠道插件），并且在支持的平台上还可以提供语音 + 实时画布。**Gateway 网关**是始终在线的控制平面；助手本身才是产品。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不是“只是一个 Claude 包装器”。它是一个**本地优先的控制平面**，让你可以在**自己的硬件上**
    运行一个强大的助手，并通过你已经使用的聊天应用访问它，同时具备
    有状态会话、记忆和工具——而不必把工作流控制权交给托管型
    SaaS。

    亮点：

    - **你的设备，你的数据：**在任何你想要的地方运行 Gateway 网关（Mac、Linux、VPS），并将
      工作区 + 会话历史保留在本地。
    - **真实渠道，而不是 Web 沙箱：**WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，
      以及在受支持平台上的移动语音和 Canvas。
    - **与模型无关：**使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由
      及故障切换。
    - **纯本地选项：**运行本地模型，这样**所有数据都可以保留在你的设备上**。
    - **多智能体路由：**按渠道、账号或任务拆分不同智能体，每个都有自己的
      工作区和默认设置。
    - **开源且可改造：**可检查、扩展并自行托管，无供应商锁定。

    文档：[Gateway](/zh-CN/gateway)、[Channels](/zh-CN/channels)、[Multi-agent](/zh-CN/concepts/multi-agent)、
    [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚设置好——接下来应该先做什么？">
    很适合作为第一个项目的内容：

    - 搭建网站（WordPress、Shopify，或简单静态站点）。
    - 制作移动应用原型（大纲、界面、API 计划）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail 并自动生成摘要或跟进事项。

    它可以处理大型任务，但当你把任务拆分成多个阶段，并
    使用子智能体并行工作时，效果通常最好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常用例是什么？">
    日常收益通常体现在：

    - **个人简报：**总结你的收件箱、日历以及你关心的新闻。
    - **研究和起草：**快速研究、总结，以及为邮件或文档生成初稿。
    - **提醒和跟进：**由 cron 或 heartbeat 驱动的提醒和清单。
    - **浏览器自动化：**填写表单、收集数据、重复执行网页任务。
    - **跨设备协作：**从手机发送任务，让 Gateway 网关在服务器上运行，然后在聊天中收到结果。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做获客、外联、广告和博客吗？">
    对于**研究、资格筛选和起草**，可以。它可以扫描网站、建立候选名单、
    总结潜在客户，并撰写外联文案或广告文案草稿。

    对于**外联或广告投放**，请保持人工参与。避免垃圾信息，遵守当地法律和
    平台政策，并在发送前审查所有内容。最安全的模式是让
    OpenClaw 起草，由你审批。

    文档：[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="相比 Claude Code 做 Web 开发，它有什么优势？">
    OpenClaw 是一个**个人助手**和协调层，而不是 IDE 替代品。对于仓库内最快的直接编码循环，
    请使用 Claude Code 或 Codex。使用 OpenClaw 的场景是，当你
    需要持久记忆、跨设备访问和工具编排时。

    优势：

    - **持久记忆 + 工作区**，跨会话保留
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway 网关**（运行在 VPS 上，从任何地方交互）
    - 通过 **Nodes** 实现本地浏览器/屏幕/摄像头/exec

    展示页：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何自定义 Skills 而不让仓库变脏？">
    使用托管覆盖，而不是编辑仓库副本。把你的修改放到 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加一个文件夹）。优先级顺序为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此托管覆盖仍然会优先于内置 Skills，而无需触碰 git。如果你需要全局安装某个 skill，但只希望某些智能体可见，请将共享副本保存在 `~/.openclaw/skills` 中，并通过 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有真正值得上游合并的修改才应保存在仓库中并通过 PR 提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 Skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。如果某个 skill 只应对特定智能体可见，请搭配 `agents.defaults.skills` 或 `agents.list[].skills` 使用。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    当前支持的模式有：

    - **Cron 任务**：隔离作业可为每个作业设置 `model` 覆盖。
    - **子智能体**：将任务路由到默认模型不同的独立智能体。
    - **按需切换**：使用 `/model` 随时切换当前会话模型。

    参阅 [Cron jobs](/zh-CN/automation/cron-jobs)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行重任务时会卡住。如何把这些任务卸载出去？">
    对长任务或并行任务，请使用**子智能体**。子智能体在自己的会话中运行，
    返回摘要，并保持主聊天保持响应。

    你可以让机器人“为这个任务启动一个子智能体”，或者使用 `/subagents`。
    在聊天中使用 `/status` 可查看 Gateway 网关当前正在做什么（以及它是否繁忙）。

    Token 提示：长任务和子智能体都会消耗 token。如果你在意成本，请通过 `agents.defaults.subagents.model`
    为子智能体设置一个更便宜的模型。

    文档：[Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上基于线程绑定的 subagent 会话是如何工作的？">
    使用线程绑定。你可以将一个 Discord 线程绑定到某个子智能体或会话目标，这样该线程中的后续消息就会持续进入那个绑定的会话。

    基本流程：

    - 使用 `sessions_spawn` 并设置 `thread: true` 启动（如果希望持续跟进，也可设置 `mode: "session"`）。
    - 或者通过 `/focus <target>` 手动绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - 使用 `/unfocus` 解除线程绑定。

    所需配置：

    - 全局默认：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 在 spawn 时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档：[Sub-agents](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[Configuration Reference](/zh-CN/gateway/configuration-reference)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="一个 subagent 已完成，但完成更新发到了错误的位置，或者根本没发。该检查什么？">
    先检查解析出的请求方路由：

    - 完成模式下的子智能体投递会优先使用任何已绑定的线程或会话路由（如果存在）。
    - 如果完成来源只携带了一个渠道，OpenClaw 会退回到请求方会话存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），以便直接投递仍然可以成功。
    - 如果既没有绑定路由，也没有可用的存储路由，则直接投递可能失败，结果会退回到排队的会话投递，而不是立即发到聊天中。
    - 无效或过时的目标仍可能导致退回到队列，或最终投递失败。
    - 如果子任务最后一个可见的助手回复正好是静默令牌 `NO_REPLY` / `no_reply`，或正好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制公告，而不是发布先前的陈旧进度。
    - 如果子任务在仅执行工具调用后超时，则公告可能会将其压缩成一个简短的部分进度摘要，而不是回放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)、[Session Tools](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我该检查什么？">
    Cron 在 Gateway 网关进程内部运行。如果 Gateway 网关没有持续运行，
    定时任务就不会执行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`），并且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否正在 24/7 持续运行（没有睡眠/重启）。
    - 验证任务的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 触发了，但什么都没有发到渠道里。为什么？">
    先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不期望任何外部消息。
    - 缺失或无效的公告目标（`channel` / `to`）意味着运行器跳过了对外投递。
    - 渠道认证失败（`unauthorized`、`Forbidden`）意味着运行器尝试投递了，但凭据阻止了它。
    - 静默的隔离结果（只有 `NO_REPLY` / `no_reply`）会被视为有意不投递，因此运行器也会抑制排队回退投递。

    对于隔离的 cron 作业，最终投递由运行器负责。系统期望
    智能体返回一段纯文本摘要供运行器发送。`--no-deliver` 会让
    该结果只保留在内部；它并不会让智能体改为直接通过
    message 工具发送。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么某个隔离的 cron 运行会切换模型或重试一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离的 cron 在活动运行抛出 `LiveSessionModelSwitchError` 时，
    可以持久化一个运行时模型切换并重试。重试会保留切换后的
    提供商/模型；如果切换中带有新的认证档案覆盖，cron
    也会在重试前将其持久化。

    相关选择规则：

    - 如果适用，Gmail hook 模型覆盖优先级最高。
    - 然后是每个作业的 `model`。
    - 然后是任何已存储的 cron 会话模型覆盖。
    - 最后才是正常的智能体/默认模型选择。

    重试循环是有界的。在初始尝试加上 2 次切换重试之后，
    cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或直接将 Skills 放入你的工作区。macOS Skills UI 在 Linux 上不可用。
    浏览 Skills： [https://clawhub.ai](https://clawhub.ai)。

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
    目录。只有当你想发布或
    同步你自己的 Skills 时，才需要另外安装 `clawhub` CLI。对于跨智能体共享安装，请把 skill 放到
    `~/.openclaw/skills` 下，并在你想缩小可见范围时使用 `agents.defaults.skills` 或
    `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划运行任务，或在后台持续运行吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron jobs** 用于定时或周期性任务（跨重启持久化）。
    - **Heartbeat** 用于“主会话”的周期性检查。
    - **隔离作业** 用于自主智能体，它们会发布摘要或投递到聊天中。

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以从 Linux 运行 Apple macOS 专属 Skills 吗？">
    不能直接运行。macOS Skills 受 `metadata.openclaw.os` 和所需二进制文件控制，且只有在它们对**Gateway 主机**满足条件时，Skills 才会出现在系统提示中。在 Linux 上，仅限 `darwin` 的 Skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖这种限制。

    你有三种受支持的模式：

    **选项 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在 macOS 二进制文件所在的地方运行 Gateway 网关，然后从 Linux 通过 [remote mode](#gateway-ports-already-running-and-remote-mode) 或 Tailscale 连接。由于 Gateway 主机是 macOS，这些 Skills 会正常加载。

    **选项 B - 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并将 Mac 上的**Node Run Commands** 设为 “Always Ask” 或 “Always Allow”。当节点上存在所需二进制文件时，OpenClaw 可以将这些仅限 macOS 的 Skills 视为可用。智能体会通过 `nodes` 工具运行这些 Skills。如果你选择 “Always Ask”，并在提示中批准 “Always Allow”，该命令就会被加入允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    Gateway 网关保留在 Linux 上，但让所需的 CLI 二进制文件解析为在 Mac 上执行的 SSH 包装器。然后覆盖该 skill，使其允许 Linux，从而保持其可用。

    1. 为该二进制文件创建一个 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将该包装器放到 Linux 主机的 `PATH` 中（例如 `~/bin/memo`）。
    3. 覆盖 skill 元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动一个新会话，以刷新 Skills 快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    选项：

    - **自定义 skill / plugin：**最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：**无需写代码，但速度更慢、脆弱性更高。

    如果你想为每个客户保留上下文（例如代理机构工作流），一个简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 当前工作）。
    - 让智能体在每次会话开始时获取该页面。

    如果你想要原生集成，请提交功能请求，或者构建一个针对这些 API 的 skill。

    安装 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会落在当前工作区的 `skills/` 目录中。对于跨智能体共享的 Skills，请将它们放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只有某些智能体应该看到共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。某些 Skills 需要通过 Homebrew 安装二进制文件；在 Linux 上这意味着 Linuxbrew（参见上面的 Homebrew Linux FAQ 条目）。参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何在 OpenClaw 中使用我现有的已登录 Chrome？">
    使用内置的 `user` 浏览器配置，它会通过 Chrome DevTools MCP 进行连接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，请创建一个显式 MCP 配置：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    这条路径仅适用于本地主机。如果 Gateway 网关运行在别处，那么要么在浏览器所在机器上运行一个节点主机，要么改用远程 CDP。

    `existing-session` / `user` 当前限制：

    - 操作是基于 ref 驱动，而不是基于 CSS 选择器
    - 上传需要 `ref` / `inputRef`，并且当前一次只支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍然需要托管浏览器或原始 CDP 配置

  </Accordion>
</AccordionGroup>

## 沙箱隔离和记忆

<AccordionGroup>
  <Accordion title="有没有专门的沙箱隔离文档？">
    有。参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。关于 Docker 特定设置（完整 Gateway 网关在 Docker 中运行或沙箱镜像），请参阅 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉功能受限——我该如何启用完整功能？">
    默认镜像以安全优先方式运行，并使用 `node` 用户，因此它
    不包含系统软件包、Homebrew 或内置浏览器。若要获得更完整的设置：

    - 通过 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，使缓存得以保留。
    - 通过 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH`，并确保该路径已持久化。

    文档：[Docker](/zh-CN/install/docker)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以用一个智能体让私信保持私密，而群组公开/沙箱隔离吗？">
    可以——前提是你的私密流量是**私信**，而公开流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/渠道会话（非主键）会在 Docker 中运行，而主私信会话则保留在主机上。然后通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置演练 + 示例配置：[Groups: personal DMs + public groups](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway configuration](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何将主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局和每智能体 bind 会合并；当 `scope: "shared"` 时，每智能体 bind 会被忽略。对任何敏感内容请使用 `:ro`，并记住 bind 会绕过沙箱文件系统边界。

    OpenClaw 会同时依据规范化路径以及通过最深已存在祖先解析出来的规范路径来验证 bind 源。这意味着即便最后一个路径段尚不存在，通过符号链接父级逃逸也会被安全地失败关闭，而且在符号链接解析后，allowed-root 检查仍然会生效。

    关于示例和安全说明，请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts) 和 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="记忆是如何工作的？">
    OpenClaw 的记忆其实就是智能体工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日笔记
    - `MEMORY.md` 中整理过的长期笔记（仅主/私密会话）

    OpenClaw 还会运行一个**静默的预压缩记忆刷新**，提醒模型
    在自动压缩前写下持久笔记。这只会在工作区可写时运行
    （只读沙箱会跳过）。参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="记忆总是忘事。如何让它记住？">
    让机器人**把事实写入记忆**。长期笔记应放在 `MEMORY.md` 中，
    短期上下文则放在 `memory/YYYY-MM-DD.md` 中。

    这是我们仍在持续改进的领域。提醒模型存储记忆会有帮助；
    它知道该怎么做。如果它仍然总忘记，请确认 Gateway 网关每次运行时都在使用同一个
    工作区。

    文档：[Memory](/zh-CN/concepts/memory)、[Agent workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永久保存吗？有什么限制？">
    记忆文件保存在磁盘上，会一直存在，直到你删除它们。限制来自你的
    存储空间，而不是模型。**会话上下文**
    仍然受模型上下文窗口限制，因此长对话可能会被压缩或截断。这就是为什么
    有记忆搜索——它只会把相关部分重新拉回到上下文中。

    文档：[Memory](/zh-CN/concepts/memory)、[Context](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索需要 OpenAI API 密钥吗？">
    只有在你使用**OpenAI embeddings** 时才需要。Codex OAuth 仅涵盖聊天/补全，
    **不**授予 embeddings 访问权限，因此**使用 Codex 登录（OAuth 或
    Codex CLI 登录）**对语义记忆搜索没有帮助。OpenAI embeddings
    仍然需要真实的 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置提供商，只要它
    能解析出 API 密钥，OpenClaw 就会自动选择一个提供商（认证档案、`models.providers.*.apiKey` 或环境变量）。
    如果能解析出 OpenAI 密钥，它会优先选择 OpenAI；否则如果能解析出 Gemini 密钥，
    就选择 Gemini；然后是 Voyage，再然后是 Mistral。如果没有可用的远程密钥，
    记忆搜索会保持禁用状态，直到你完成配置。如果你已经配置并存在本地模型路径，OpenClaw
    会优先使用 `local`。只有在你显式设置
    `memorySearch.provider = "ollama"` 时，才支持 Ollama。

    如果你更倾向于保持本地化，请设置 `memorySearch.provider = "local"`（并可选设置
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embedding
    模型——设置细节参见 [Memory](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 磁盘上的存储位置

<AccordionGroup>
  <Accordion title="OpenClaw 使用的所有数据都会保存在本地吗？">
    不会——**OpenClaw 的状态保存在本地**，但**外部服务仍然会看到你发给它们的内容**。

    - **默认本地：**会话、记忆文件、配置和工作区都保存在 Gateway 网关主机上
      （`~/.openclaw` + 你的工作区目录）。
    - **必须远程：**你发送给模型提供商（Anthropic/OpenAI 等）的消息会进入
      它们的 API，而聊天平台（WhatsApp/Telegram/Slack 等）会在
      它们的服务器上存储消息数据。
    - **你可以控制暴露范围：**使用本地模型会让提示保留在你的机器上，但渠道
      流量仍然会通过对应渠道的服务器。

    相关内容：[Agent workspace](/zh-CN/concepts/agent-workspace)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 把数据存在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                            | 用途                                                              |
    | --------------------------------------------------------------- | ----------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到认证档案中）                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 认证档案（OAuth、API 密钥，以及可选的 `keyRef`/`tokenRef`）      |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供商可选的基于文件的 secret 负载              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目已清理）                        |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每智能体状态（agentDir + sessions）                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史和状态（按智能体区分）                                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（按智能体区分）                                        |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、Skills 等）是分开的，通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于**智能体工作区**中，而不是 `~/.openclaw`。

    - **工作区（按智能体）：**`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`（如果缺少 `MEMORY.md`，则使用旧版回退 `memory.md`）、
      `memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。
    - **状态目录（`~/.openclaw`）：**配置、渠道/提供商状态、认证档案、会话、日志，
      以及共享 Skills（`~/.openclaw/skills`）。

    默认工作区为 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“忘记了”东西，请确认 Gateway 网关每次启动时都在使用同一个
    工作区（并记住：远程模式使用的是**gateway 主机**
    的工作区，而不是你本地笔记本的工作区）。

    提示：如果你想保留某个持久行为或偏好，请让机器人**把它写进
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    参阅 [Agent workspace](/zh-CN/concepts/agent-workspace) 和 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    把你的**智能体工作区**放进一个**私有** git 仓库中，并备份到某个
    私有位置（例如 GitHub 私有仓库）。这样可以保存记忆 + AGENTS/SOUL/USER
    文件，也让你以后可以恢复助手的“思维”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭据、会话、令牌或加密的 secret 负载）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （见上面的迁移问题）。

    文档：[Agent workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何彻底卸载 OpenClaw？">
    请参阅专门指南：[Uninstall](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，而不是硬性沙箱。
    相对路径会在工作区内解析，但绝对路径可以访问主机上的其他
    位置，除非启用了沙箱隔离。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每个智能体的沙箱设置。如果你
    希望某个仓库成为默认工作目录，可以把该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库只是源码；除非你明确想让智能体在其中工作，
    否则请让工作区与其分离。

    示例（以仓库为默认 cwd）：

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

  <Accordion title="远程模式：会话存储在哪里？">
    会话状态由**gateway 主机**持有。如果你处于远程模式，那么你关心的会话存储位于远程机器上，而不是你的本地笔记本。参阅 [Session management](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置文件是什么格式？在哪里？">
    OpenClaw 会从 `$OPENCLAW_CONFIG_PATH` 读取一个可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果该文件不存在，它会使用较为安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何监听 / UI 提示 unauthorized'>
    非 loopback 绑定**需要一个有效的 gateway 认证路径**。实际来说，这意味着：

    - 共享密钥认证：令牌或密码
    - 在配置正确的非 loopback 身份感知反向代理后使用 `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` **本身不会**启用本地 gateway 认证。
    - 仅当 `gateway.auth.*` 未设置时，本地调用路径才可以将 `gateway.remote.*` 作为回退。
    - 对于密码认证，请改为设置 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但无法解析，则解析会失败关闭（不会被远程回退掩盖）。
    - 共享密钥 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（存储在应用/UI 设置中）。像 Tailscale Serve 或 `trusted-proxy` 这样的携带身份模式则使用请求头。避免把共享密钥放进 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机上的 loopback 反向代理仍然**不能**满足 trusted-proxy 认证要求。trusted proxy 必须是一个已配置的非 loopback 来源。

  </Accordion>

  <Accordion title="为什么现在在 localhost 上也需要令牌？">
    OpenClaw 默认强制执行 gateway 认证，包括 loopback。在正常默认路径下，这意味着令牌认证：如果没有显式配置认证路径，gateway 启动时会解析为 token 模式并自动生成一个令牌，将其保存到 `gateway.auth.token` 中，因此**本地 WS 客户端也必须进行认证**。这样可以阻止其他本地进程调用 Gateway 网关。

    如果你偏好其他认证路径，可以显式选择密码模式（或，对非 loopback 身份感知反向代理使用 `trusted-proxy`）。如果你**真的**想开放 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可以随时为你生成令牌：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="修改配置后必须重启吗？">
    Gateway 网关会监控配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：安全改动热应用，关键改动则重启
    - 也支持 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何禁用有趣的 CLI 标语？">
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
    - `default`：始终使用 `All your chats, one OpenClaw.`。
    - `random`：轮换有趣/季节性标语（默认行为）。
    - 如果你希望完全不显示横幅，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（以及 Web 抓取）？">
    `web_fetch` 无需 API 密钥即可使用。`web_search` 取决于你选择的
    提供商：

    - 基于 API 的提供商，如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily，需要按照正常方式配置 API 密钥。
    - Ollama Web 搜索 无需密钥，但它使用你配置的 Ollama 主机，并要求执行 `ollama signin`。
    - DuckDuckGo 无需密钥，但它是一个非官方的基于 HTML 的集成。
    - SearXNG 无需密钥/可自托管；请配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：**运行 `openclaw configure --section web` 并选择一个提供商。
    环境变量替代方式：

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

    提供商特定的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧版 `tools.web.search.*` 提供商路径目前仍会为了兼容性而临时加载，但不应在新配置中继续使用。
    Firecrawl 的 web-fetch 回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用允许列表，请添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非被显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭据中自动检测第一个已就绪的 fetch 回退提供商。目前内置提供商是 Firecrawl。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web tools](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 把我的配置清空了。如何恢复并避免再次发生？">
    `config.apply` 会替换**整个配置**。如果你发送的是部分对象，其他所有内容
    都会被移除。

    恢复方法：

    - 从备份恢复（git 或复制的 `~/.openclaw/openclaw.json`）。
    - 如果没有备份，请重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这是意料之外的行为，请提交 bug，并附上你最后已知的配置或任何备份。
    - 本地编码智能体通常可以根据日志或历史重建一个可工作的配置。

    避免方式：

    - 小改动使用 `openclaw config set`。
    - 交互式编辑使用 `openclaw configure`。
    - 当你不确定精确路径或字段结构时，先用 `config.schema.lookup`；它会返回一个浅层 schema 节点以及直接子项摘要，方便逐层钻取。
    - 对于部分 RPC 编辑，请使用 `config.patch`；仅在需要整体替换完整配置时才使用 `config.apply`。
    - 如果你是在智能体运行中使用仅所有者可用的 `gateway` 工具，它仍然会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会被规范化到相同受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[Config](/cli/config)、[Configure](/cli/configure)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何运行一个中央 Gateway 网关，并让不同设备承担专门工作？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**：

    - **Gateway 网关（中央）：**持有渠道（Signal/WhatsApp）、路由和会话。
    - **节点（设备）：**Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（工作者）：**不同职责的独立“大脑”/工作区（例如“Hetzner 运维”“个人数据”）。
    - **子智能体：**当你想并行处理时，从主智能体中派生后台工作。
    - **TUI：**连接到 Gateway 网关并切换智能体/会话。

    文档：[Nodes](/zh-CN/nodes)、[Remote access](/zh-CN/gateway/remote)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[TUI](/web/tui)。

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

    默认值是 `false`（有头）。无头模式更容易触发某些网站的反机器人检查。参阅 [Browser](/zh-CN/tools/browser)。

    无头模式使用的是**相同的 Chromium 引擎**，适用于大多数自动化场景（表单、点击、抓取、登录）。主要区别是：

    - 没有可见的浏览器窗口（如果需要视觉确认，请使用截图）。
    - 某些网站对无头模式下的自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 通常会阻止无头会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。
    完整配置示例请参阅 [Browser](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="Telegram、gateway 和节点之间的命令是如何传播的？">
    Telegram 消息由**gateway**处理。gateway 运行智能体，
    只有在需要节点工具时才会通过**Gateway WebSocket**
    调用节点：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    节点不会看到入站提供商流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程环境中，我的智能体如何访问我的电脑？">
    简短回答：**把你的电脑配对成一个节点**。Gateway 网关运行在别处，但它可以
    通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在始终在线的主机（VPS/家庭服务器）上运行 Gateway 网关。
    2. 让 Gateway 主机和你的电脑加入同一个 tailnet。
    3. 确保 Gateway WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以**Remote over SSH** 模式（或直接 tailnet）
       连接，使其可以注册为一个节点。
    5. 在 Gateway 网关上批准该节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP bridge；节点通过 Gateway WebSocket 进行连接。

    安全提醒：配对一个 macOS 节点意味着该机器上允许 `system.run`。
    只配对你信任的设备，并阅读 [Security](/zh-CN/gateway/security)。

    文档：[Nodes](/zh-CN/nodes)、[Gateway protocol](/zh-CN/gateway/protocol)、[macOS remote mode](/zh-CN/platforms/mac/remote)、[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到回复。现在怎么办？">
    先检查基础项：

    - Gateway 网关是否正在运行：`openclaw gateway status`
    - Gateway 网关健康状况：`openclaw status`
    - 渠道健康状况：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，确保 `gateway.auth.allowTailscale` 设置正确。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已建立并指向正确端口。
    - 确认你的允许列表（私信或群组）包含你的账号。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[Remote access](/zh-CN/gateway/remote)、[Channels](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例（本地 + VPS）可以互相对话吗？">
    可以。没有内置的“机器人对机器人”桥接，但你可以通过几种
    可靠方式实现：

    **最简单的方式：**使用两个机器人都能访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让 Bot A 给 Bot B 发消息，然后让 Bot B 正常回复。

    **CLI 桥接（通用）：**运行一个脚本，调用另一个 Gateway 网关的
    `openclaw agent --message ... --deliver`，目标是另一个机器人
    正在监听的聊天。如果其中一个机器人在远程 VPS 上，请让你的 CLI 指向那个远程 Gateway 网关，
    可通过 SSH/Tailscale（见 [Remote access](/zh-CN/gateway/remote)）实现。

    示例模式（从一台能访问目标 Gateway 网关的机器上运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：添加一个保护措施，防止两个机器人无限循环（仅回应提及、渠道
    允许列表，或“不要回复机器人消息”的规则）。

    文档：[Remote access](/zh-CN/gateway/remote)、[Agent CLI](/cli/agent)、[Agent send](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要分别使用不同的 VPS 吗？">
    不需要。一个 Gateway 网关可以托管多个智能体，每个智能体都有自己的工作区、默认模型
    和路由。这是正常设置，也比
    每个智能体一个 VPS 便宜且简单得多。

    只有在你需要硬隔离（安全边界）或非常不同、你不想共享的配置时，
    才需要分别使用不同的 VPS。否则，保持一个 Gateway 网关，
    并使用多个智能体或子智能体即可。

  </Accordion>

  <Accordion title="相比从 VPS 上用 SSH，在我的个人笔记本上使用节点有什么好处吗？">
    有——节点是从远程 Gateway 网关访问你笔记本的首选方式，而且它们
    不只是提供 shell 访问。Gateway 网关运行在 macOS/Linux（Windows 通过 WSL2）上，并且
    非常轻量（小型 VPS 或 Raspberry Pi 级别机器就足够；4 GB RAM 已很充足），所以一种常见
    设置是始终在线的主机 + 你的笔记本作为节点。

    - **不需要入站 SSH。**节点主动连接到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。**`system.run` 在那台笔记本上会受到节点允许列表/审批控制。
    - **更多设备工具。**节点除 `system.run` 外，还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。**将 Gateway 网关放在 VPS 上，但通过笔记本上的节点主机在本地运行 Chrome，或通过 Chrome MCP 连接到主机上的本地 Chrome。

    SSH 适合临时 shell 访问，但节点对于持续性的智能体工作流和
    设备自动化更简单。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行一个 gateway 服务吗？">
    不会。除非你是有意运行隔离配置文件（见 [Multiple gateways](/zh-CN/gateway/multiple-gateways)），否则每台主机只应运行**一个 gateway**。节点是连接到
    gateway 的外设（iOS/Android 节点，或菜单栏应用中的 macOS “node mode”）。关于无头节点
    主机和 CLI 控制，请参阅 [Node host CLI](/cli/node)。

    对 `gateway`、`discovery` 和 `canvasHost` 的更改需要完整重启。

  </Accordion>

  <Accordion title="有没有 API / RPC 方式来应用配置？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树，包括其浅层 schema 节点、匹配的 UI 提示和直接子项摘要
    - `config.get`：获取当前快照 + 哈希
    - `config.patch`：安全的局部更新（大多数 RPC 编辑的首选）
    - `config.apply`：校验 + 替换完整配置，然后重启
    - 仅所有者可用的 `gateway` 运行时工具仍然拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会规范化到相同的受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装时最小可用的配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这会设置你的工作区，并限制谁可以触发机器人。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale 并从 Mac 连接？">
    最小步骤：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装并登录**
       - 使用 Tailscale 应用，并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，这样 VPS 就有了稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你希望无需 SSH 也能使用 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这样会让 gateway 保持绑定 loopback，并通过 Tailscale 暴露 HTTPS。参阅 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露**Gateway Control UI + WS**。节点通过同一个 Gateway WS 端点连接。

    推荐设置：

    1. **确保 VPS 和 Mac 在同一个 tailnet 中**。
    2. **在 Remote 模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       应用会将 Gateway 端口建立隧道，并作为一个节点连接。
    3. **在 gateway 上批准该节点**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway protocol](/zh-CN/gateway/protocol)、[Discovery](/zh-CN/gateway/discovery)、[macOS remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该安装到第二台笔记本上，还是只添加一个节点？">
    如果你只需要第二台笔记本上的**本地工具**（屏幕/摄像头/exec），就把它添加为
    **节点**。这样可以保持单个 Gateway 网关，并避免重复配置。当前本地节点工具
    仅支持 macOS，但我们计划扩展到其他操作系统。

    只有在你需要**硬隔离**或两个完全独立的机器人时，
    才应该安装第二个 Gateway 网关。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)、[Multiple gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

    - 当前工作目录中的 `.env`
    - 来自 `~/.openclaw/.env`（即 `$OPENCLAW_STATE_DIR/.env`）的全局回退 `.env`

    这两个 `.env` 文件都不会覆盖现有环境变量。

    你还可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    关于完整优先级和来源，请参阅 [/environment](/zh-CN/help/environment)。

  </Accordion>

  <Accordion title="我通过服务启动了 Gateway 网关，但环境变量不见了。怎么办？">
    两个常见修复方式：

    1. 将缺失的密钥放入 `~/.openclaw/.env`，这样即使服务没有继承你的 shell 环境，它们也会被读取。
    2. 启用 shell 导入（可选的便捷功能）：

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

    这会运行你的登录 shell，并且只导入缺失的预期键名（绝不覆盖已有值）。环境变量等价项：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示 “Shell env: off.”。为什么？'>
    `openclaw models status` 显示的是是否启用了**shell 环境导入**。“Shell env: off”
    **不**意味着你的环境变量缺失——它只是表示 OpenClaw 不会
    自动加载你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。解决方式如下：

    1. 把令牌放到 `~/.openclaw/.env` 中：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将它添加到配置中的 `env` 块里（仅在缺失时应用）。

    然后重启 gateway 并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot 令牌从 `COPILOT_GITHUB_TOKEN` 读取（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）。
    参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多聊天

<AccordionGroup>
  <Accordion title="如何开始一个新的对话？">
    发送 `/new` 或 `/reset` 作为独立消息。参阅 [Session management](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 后过期，但这**默认是禁用的**（默认值为 **0**）。
    将其设置为正值即可启用空闲过期。启用后，在空闲期之后收到的**下一条**
    消息会为该聊天键启动一个新的会话 ID。
    这不会删除对话记录——它只会开启一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法组建一个 OpenClaw 实例团队（一个 CEO 和多个智能体）？">
    可以，通过**多智能体路由**和**子智能体**实现。你可以创建一个协调者
    智能体，以及多个拥有各自工作区和模型的工作智能体。

    不过，这更适合作为一个**有趣的实验**。它很耗 token，而且通常
    不如一个机器人配多个会话高效。我们通常设想的模式是：一个你与之对话的机器人，
    通过不同会话处理并行工作。这个机器人
    也可以在需要时启动子智能体。

    文档：[Multi-agent routing](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文会在任务中途被截断？如何防止？">
    会话上下文受模型窗口限制。长聊天、大量工具输出或许多
    文件都可能触发压缩或截断。

    有帮助的做法：

    - 让机器人总结当前状态并将其写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保存在工作区，并让机器人重新读取。
    - 对长任务或并行工作使用子智能体，这样主聊天会更小。
    - 如果这种情况经常出现，请选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何在保留安装的情况下完全重置 OpenClaw？">
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

    说明：

    - 如果新手引导检测到已有配置，也会提供**重置**选项。参阅 [Onboarding（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了 profile（`--profile` / `OPENCLAW_PROFILE`），请分别重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅开发环境；会清空开发配置 + 凭据 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我收到了 “context too large” 错误——如何重置或压缩？'>
    使用以下方式之一：

    - **压缩**（保留对话，但总结较早轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 来引导摘要方式。

    - **重置**（为同一个聊天键创建新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果这种情况持续发生：

    - 启用或调整**会话修剪**（`agents.defaults.contextPruning`）以裁剪旧工具输出。
    - 使用上下文窗口更大的模型。

    文档：[Compaction](/zh-CN/concepts/compaction)、[Session pruning](/zh-CN/concepts/session-pruning)、[Session management](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到 “LLM request rejected: messages.content.tool_use.input field required”？'>
    这是提供商的校验错误：模型发出了一个缺少必需
    `input` 的 `tool_use` 块。通常意味着会话历史陈旧或已损坏（常见于长线程
    或工具/schema 变更之后）。

    解决方法：发送 `/new` 作为独立消息，开始一个新会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟就会收到一次 heartbeat 消息？">
    Heartbeat 默认每 **30m** 运行一次（使用 OAuth 认证时为 **1h**）。可以调整或禁用它：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或 "0m" 来禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（仅有空行和 markdown
    标题如 `# Heading`），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。
    如果文件不存在，heartbeat 仍会运行，并由模型决定要做什么。

    每智能体覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把一个“bot account”添加到 WhatsApp 群组中吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以如果你在群组里，OpenClaw 就能看到它。
    默认情况下，群组回复会被阻止，直到你允许发送者（`groupPolicy: "allowlist"`）。

    如果你只希望**你自己**能够触发群组回复：

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
    选项 1（最快）：跟踪日志，并在群组中发送一条测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    选项 2（如果已配置/加入允许列表）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[Directory](/cli/directory)、[Logs](/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组里不回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @ 提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups` 但没有包含 `"*"`，并且该群组不在允许列表中。

    参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会与私信共享上下文吗？">
    直接聊天默认会归并到主会话。群组/渠道有各自的会话键，而 Telegram 话题 / Discord 线程则是独立会话。参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性上限。几十个（甚至几百个）都没问题，但请注意：

    - **磁盘增长：**会话 + 转录存放在 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：**智能体越多，模型并发使用越多。
    - **运维开销：**每智能体的认证档案、工作区和渠道路由。

    提示：

    - 每个智能体保持一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增长，请修剪旧会话（删除 JSONL 或 store 条目）。
    - 使用 `openclaw doctor` 发现零散工作区和档案不匹配问题。

  </Accordion>

  <Accordion title="我可以同时运行多个机器人或多个聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**来运行多个隔离的智能体，并按
    渠道/账号/peer 路由入站消息。Slack 作为一个渠道受到支持，并且可以绑定到特定智能体。

    浏览器访问能力很强，但并不等于“做人类能做的一切”——反机器人机制、CAPTCHA 和 MFA
    仍然可能阻止自动化。若要实现最可靠的浏览器控制，请使用主机上的本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 网关主机（VPS/Mac mini）。
    - 每个角色一个智能体（bindings）。
    - 将 Slack 渠道绑定到这些智能体。
    - 需要时通过 Chrome MCP 或节点使用本地浏览器。

    文档：[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [Browser](/zh-CN/tools/browser)、[Nodes](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## 模型：默认值、选择、别名、切换

<AccordionGroup>
  <Accordion title='什么是“默认模型”？'>
    OpenClaw 的默认模型就是你设置在：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 的形式引用（例如：`openai/gpt-5.4`）。如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 唯一匹配的已配置提供商，最后才会退回到已配置默认提供商这一已弃用的兼容路径。如果该提供商已不再暴露已配置的默认模型，OpenClaw 会退回到第一个已配置的提供商/模型，而不是暴露一个陈旧的、已被移除的提供商默认值。你仍然应该**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认选择：**使用你提供商栈中可用的最新一代最强模型。
    **对于启用了工具或要处理不可信输入的智能体：**优先考虑模型能力，而不是成本。
    **对于日常/低风险聊天：**使用更便宜的后备模型，并按智能体角色进行路由。

    MiniMax 有自己的文档：[MiniMax](/zh-CN/providers/minimax) 和
    [Local models](/zh-CN/gateway/local-models)。

    经验法则：对于高风险任务，使用**你能负担得起的最佳模型**；对于日常
    聊天或总结，则使用更便宜的模型。你可以为每个智能体路由模型，并使用子智能体来
    并行处理长任务（每个子智能体都会消耗 token）。参阅 [Models](/zh-CN/concepts/models) 和
    [Sub-agents](/zh-CN/tools/subagents)。

    强烈警告：较弱/过度量化的模型更容易受到提示
    注入和不安全行为的影响。参阅 [Security](/zh-CN/gateway/security)。

    更多背景：[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**，或只编辑**模型**字段。避免整体替换配置。

    安全选项：

    - 在聊天中使用 `/model`（快速、按会话）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你确实打算替换整个配置，否则不要用部分对象调用 `config.apply`。
    对于 RPC 编辑，请先用 `config.schema.lookup` 检查，并优先使用 `config.patch`。lookup 负载会提供规范化路径、浅层 schema 文档/约束以及直接子项摘要，
    适合做局部更新。
    如果你已经覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 进行修复。

    文档：[Models](/zh-CN/concepts/models)、[Configure](/cli/configure)、[Config](/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    可以。对于本地模型，Ollama 是最简单的方案。

    最快捷的设置：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型，例如 `ollama pull glm-4.7-flash`
    3. 如果你还想使用云模型，运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 会同时给你云模型和本地 Ollama 模型
    - 像 `kimi-k2.5:cloud` 这样的云模型不需要本地 pull
    - 如需手动切换，请使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：更小或量化程度很高的模型更容易受到提示
    注入影响。对于任何可使用工具的机器人，我们都强烈建议使用**大模型**。
    如果你仍然想使用小模型，请启用沙箱隔离和严格的工具允许列表。

    文档：[Ollama](/zh-CN/providers/ollama)、[Local models](/zh-CN/gateway/local-models)、
    [Model providers](/zh-CN/concepts/model-providers)、[Security](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能不同，而且会随时间变化；并不存在固定的提供商推荐。
    - 请在每个 gateway 上使用 `openclaw models status` 检查当前运行时设置。
    - 对于安全敏感/启用了工具的智能体，请使用当前可用的最新一代最强模型。
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

    这些是内置别名。可以通过 `agents.defaults.models` 添加自定义别名。

    你可以使用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（以及 `/model list`）会显示一个紧凑的编号选择器。按编号选择：

    ```
    /model 3
    ```

    你还可以为提供商强制指定某个认证档案（按会话）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示当前哪个智能体处于活跃状态、正在使用哪个 `auth-profiles.json` 文件，以及下一个会尝试哪个认证档案。
    还会在可用时显示已配置的提供商端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消通过 @profile 设定的固定档案？**

    重新运行 `/model`，**不要**带 `@profile` 后缀：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到默认值，请从 `/model` 中选择它（或发送 `/model <default provider/model>`）。
    使用 `/model status` 确认当前激活的是哪个认证档案。

  </Accordion>

  <Accordion title="我可以用 GPT 5.2 做日常任务，用 Codex 5.3 做编码吗？">
    可以。将一个设为默认模型，并在需要时切换：

    - **快速切换（按会话）：**日常任务使用 `/model gpt-5.4`，编码时使用 `/model openai-codex/gpt-5.4` 配合 Codex OAuth。
    - **默认值 + 切换：**将 `agents.defaults.model.primary` 设为 `openai/gpt-5.4`，编码时切换到 `openai-codex/gpt-5.4`（或者反过来）。
    - **子智能体：**将编码任务路由到默认模型不同的子智能体。

    参阅 [Models](/zh-CN/concepts/models) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.4 配置 fast mode？">
    你可以使用会话切换或配置默认值：

    - **按会话：**当会话正在使用 `openai/gpt-5.4` 或 `openai-codex/gpt-5.4` 时，发送 `/fast on`。
    - **按模型默认值：**将 `agents.defaults.models["openai/gpt-5.4"].params.fastMode` 设为 `true`。
    - **Codex OAuth 也适用：**如果你也使用 `openai-codex/gpt-5.4`，请在该模型下设置相同标志。

    示例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    对于 OpenAI，fast mode 会在支持的原生 Responses 请求上映射为 `service_tier = "priority"`。会话中的 `/fast` 覆盖优先于配置默认值。

    参阅 [Thinking and fast mode](/zh-CN/tools/thinking) 和 [OpenAI fast mode](/zh-CN/providers/openai#openai-fast-mode)。

  </Accordion>

  <Accordion title='为什么我会看到 “Model ... is not allowed”，然后就没有回复了？'>
    如果设置了 `agents.defaults.models`，它就会成为 `/model` 和任何
    会话覆盖的**允许列表**。选择一个不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    该错误会**代替**正常回复返回。解决方法：将该模型加入
    `agents.defaults.models`，移除允许列表，或从 `/model list` 中选择一个模型。

  </Accordion>

  <Accordion title='为什么我会看到 “Unknown model: minimax/MiniMax-M2.7”？'>
    这意味着**提供商未配置**（未找到 MiniMax 提供商配置或认证
    档案），因此无法解析该模型。

    修复清单：

    1. 升级到当前 OpenClaw 版本（或从源码 `main` 运行），然后重启 gateway。
    2. 确保已配置 MiniMax（通过向导或 JSON），或环境变量/认证档案中
       已存在 MiniMax 认证，以便注入匹配提供商
       （`minimax` 使用 `MINIMAX_API_KEY`，`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或已存储的 MiniMax
       OAuth）。
    3. 为你的认证路径使用精确模型 ID（区分大小写）：
       API 密钥设置使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 设置使用 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       然后从列表中选择（或在聊天中使用 `/model list`）。

    参阅 [MiniMax](/zh-CN/providers/minimax) 和 [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以把 MiniMax 设为默认模型，而在复杂任务中使用 OpenAI 吗？">
    可以。将**MiniMax 设为默认值**，并在需要时**按会话**切换模型。
    后备是为**错误**准备的，而不是“高难任务”，所以请使用 `/model` 或单独的智能体。

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

    **选项 B：分开智能体**

    - 智能体 A 默认：MiniMax
    - 智能体 B 默认：OpenAI
    - 按智能体路由，或使用 `/agent` 切换

    文档：[Models](/zh-CN/concepts/models)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是的。OpenClaw 附带了一些默认简写（仅当模型存在于 `agents.defaults.models` 中时才生效）：

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

    然后 `/model sonnet`（或在支持时使用 `/<alias>`）就会解析到该模型 ID。

  </Accordion>

  <Accordion title="如何添加 OpenRouter 或 Z.AI 等其他提供商的模型？">
    OpenRouter（按 token 计费；模型很多）：

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

    如果你引用了某个 provider/model，但缺少所需的提供商密钥，就会收到运行时认证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后提示 No API key found for provider**

    这通常意味着**新智能体**的认证存储为空。认证是按智能体区分的，
    存储于：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>` 并在向导中配置认证。
    - 或把主智能体 `agentDir` 中的 `auth-profiles.json` 复制到新智能体的 `agentDir` 中。

    **不要**在多个智能体之间复用 `agentDir`；这会导致认证/会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障切换和 “All models failed”

<AccordionGroup>
  <Accordion title="故障切换是如何工作的？">
    故障切换分两个阶段：

    1. 同一提供商内的**认证档案轮换**。
    2. **模型后备**到 `agents.defaults.model.fallbacks` 中的下一个模型。

    对失败的档案会应用冷却时间（指数退避），因此即便某个提供商被限流或暂时失败，OpenClaw 仍能继续响应。

    限流桶不仅包括普通的 `429` 响应。OpenClaw
    还会将诸如 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted` 以及周期性
    用量窗口限制（`weekly/monthly limit reached`）之类的消息视为值得故障切换的
    限流情况。

    某些看似计费相关的响应并不是 `402`，而某些 HTTP `402`
    响应也仍会保留在该瞬时故障桶中。如果提供商在 `401` 或 `403` 上返回了
    明确的计费文本，OpenClaw 仍可将其保留在
    计费类别中，但提供商特定的文本匹配器会保持限定在
    拥有该逻辑的提供商范围内（例如 OpenRouter 的 `Key limit exceeded`）。如果某个 `402`
    消息看起来更像是可重试的用量窗口限制或
    组织/工作区支出上限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会将其视为
    `rate_limit`，而不是长期计费禁用。

    上下文溢出错误则不同：像
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 这样的特征会保留在压缩/重试路径中，而不会推进模型后备。

    通用服务器错误文本的判断范围会刻意比“任何带
    unknown/error 的内容”更窄。OpenClaw 的确会把提供商上下文中的瞬时错误形态
    视为值得故障切换的超时/过载信号，例如 Anthropic 的裸
    `An unknown error occurred`、OpenRouter 的裸
    `Provider returned error`、停止原因错误如 `Unhandled stop reason:
    error`、带瞬时服务器文本的 JSON `api_error` 负载
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及诸如 `ModelNotReadyException` 之类的提供商繁忙错误，只要提供商上下文匹配。
    通用内部回退文本，比如 `LLM request failed with an unknown
    error.`，本身会保持保守，不会单独触发模型后备。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” 是什么意思？'>
    这意味着系统尝试使用认证档案 ID `anthropic:default`，但无法在预期的认证存储中找到对应凭据。

    **修复清单：**

    - **确认认证档案存放位置**（新路径与旧路径）
      - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认 Gateway 网关已加载你的环境变量**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但 Gateway 网关通过 systemd/launchd 运行，它可能不会继承。请将它放入 `~/.openclaw/.env` 或启用 `env.shellEnv`。
    - **确保你编辑的是正确的智能体**
      - 多智能体设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **做一次模型/认证状态检查**
      - 使用 `openclaw models status` 查看已配置模型以及提供商是否已认证。

    **针对 “No credentials found for profile anthropic” 的修复清单**

    这意味着当前运行被固定到了一个 Anthropic 认证档案，但 Gateway 网关
    在其认证存储中找不到它。

    - **使用 Claude CLI**
      - 在 gateway 主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 密钥**
      - 将 `ANTHROPIC_API_KEY` 放入**gateway 主机**上的 `~/.openclaw/.env`。
      - 清除任何强制使用缺失档案的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你是在 gateway 主机上运行命令**
      - 在远程模式下，认证档案位于 gateway 机器上，而不是你的笔记本上。

  </Accordion>

  <Accordion title="为什么它还尝试了 Google Gemini 并失败了？">
    如果你的模型配置将 Google Gemini 作为后备（或你切