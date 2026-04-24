---
read_when:
    - 解答常见的设置、安装、新手引导或运行时支持问题
    - 在进行更深入的调试之前，对用户报告的问题进行初步分类和排查
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-04-24T06:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

针对真实环境配置的快速解答与更深入的故障排除（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障切换）。如需运行时诊断，请参阅 [故障排除](/zh-CN/gateway/troubleshooting)。如需完整配置参考，请参阅 [Configuration](/zh-CN/gateway/configuration)。

## 如果出现问题，最初的六十秒

1. **快速状态（第一步检查）**

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

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用的是哪个配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 网关健康探测，包括支持时的渠道探测
   （需要可访问的 Gateway 网关）。请参阅 [Health](/zh-CN/gateway/health)。

5. **查看最新日志**

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

   修复/迁移配置/状态 + 运行健康检查。请参阅 [Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 出错时显示目标 URL + 配置路径
   ```

   向正在运行的 Gateway 网关请求完整快照（仅 WS）。请参阅 [Health](/zh-CN/gateway/health)。

## 快速开始与首次运行设置

首次运行问答——安装、新手引导、认证路径、订阅、初始失败——
位于 [首次运行 FAQ](/zh-CN/help/faq-first-run)。

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段话来说，什么是 OpenClaw？">
    OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它会在你已经使用的消息界面上回复你（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及内置的渠道插件，如 QQ Bot），并且在受支持的平台上还可以提供语音 + 实时 Canvas。**Gateway 网关**是始终在线的控制平面；助手才是产品本身。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不只是“一个 Claude 封装器”。它是一个**本地优先的控制平面**，让你能够在**你自己的硬件上**运行一个
    功能强大的助手，并可通过你已经使用的聊天应用访问，同时具备
    有状态会话、记忆和工具能力——无需把你的工作流控制权交给托管式
    SaaS。

    亮点：

    - **你的设备，你的数据：** 你可以在任意位置运行 Gateway 网关（Mac、Linux、VPS），并将
      工作区 + 会话历史保留在本地。
    - **真实渠道，而不是网页沙箱：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，
      以及在受支持平台上的移动语音和 Canvas。
    - **模型无关：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由
      和故障切换。
    - **仅本地选项：** 运行本地模型，这样**所有数据都可以保留在你的设备上**，如果你愿意的话。
    - **多智能体路由：** 按渠道、账号或任务区分不同智能体，每个智能体都有自己的
      工作区和默认值。
    - **开源且可改造：** 可检查、扩展并自托管，无需受制于供应商锁定。

    文档： [Gateway 网关](/zh-CN/gateway)、[Channels](/zh-CN/channels)、[Multi-agent](/zh-CN/concepts/multi-agent)、
    [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚完成设置——接下来应该先做什么？">
    适合入门的项目：

    - 搭建一个网站（WordPress、Shopify，或一个简单的静态站点）。
    - 制作一个移动应用原型（梳理、大纲、界面、API 方案）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail，并自动生成摘要或跟进事项。

    它可以处理大型任务，但当你把它们拆分成多个阶段，并
    使用子智能体进行并行工作时，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五种日常使用场景是什么？">
    日常收益通常体现在：

    - **个人简报：** 汇总你关心的收件箱、日历和新闻。
    - **研究与草拟：** 快速研究、总结，以及邮件或文档的初稿。
    - **提醒与跟进：** 由 cron 或 heartbeat 驱动的提醒和清单。
    - **浏览器自动化：** 填写表单、收集数据、重复执行网页任务。
    - **跨设备协作：** 从手机发送任务，让 Gateway 网关在服务器上运行，并在聊天中把结果返回给你。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做获客、外联、广告和博客吗？">
    可以，用于**研究、筛选和草拟**。它可以扫描网站、建立候选名单、
    总结潜在客户信息，并撰写外联文案或广告文案草稿。

    对于**外联或广告投放**，请始终让人工参与把关。避免垃圾信息，遵守当地法律和
    平台政策，并在发送前审查所有内容。最安全的模式是让
    OpenClaw 起草，然后由你批准。

    文档： [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比，它在 Web 开发方面有什么优势？">
    OpenClaw 是一个**个人助手**和协作协调层，而不是 IDE 替代品。要在仓库内部获得最快的直接编码循环，请使用
    Claude Code 或 Codex。当你需要持久记忆、跨设备访问和工具编排时，请使用 OpenClaw。

    优势：

    - **跨会话的持久记忆 + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway 网关**（运行在 VPS 上，随时随地交互）
    - 用于本地浏览器/屏幕/相机/执行的 **Nodes**

    展示： [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 与自动化

<AccordionGroup>
  <Accordion title="如何在不让仓库变脏的情况下自定义 skills？">
    使用受管覆盖，而不是直接编辑仓库副本。把你的更改放在 `~/.openclaw/skills/<name>/SKILL.md` 中（或者通过 `~/.openclaw/openclaw.json` 里的 `skills.load.extraDirs` 添加文件夹）。优先级顺序为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此受管覆盖仍然会优先于内置 skills，而无需修改 git。如果你需要全局安装某个 skill，但只希望部分智能体可见，请将共享副本放在 `~/.openclaw/skills` 中，并通过 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有适合上游的修改才应保存在仓库中，并通过 PR 提交出去。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。如果该 skill 只应对某些智能体可见，请同时配合 `agents.defaults.skills` 或 `agents.list[].skills` 使用。
  </Accordion>

  <Accordion title="我如何为不同任务使用不同模型？">
    目前支持的模式包括：

    - **Cron jobs**：隔离任务可以为每个任务设置 `model` 覆盖。
    - **子智能体**：将任务路由到使用不同默认模型的独立智能体。
    - **按需切换**：随时使用 `/model` 切换当前会话模型。

    请参阅 [Cron jobs](/zh-CN/automation/cron-jobs)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在处理重任务时卡住了。我要如何卸载这部分工作？">
    对于长时间运行或可并行的任务，请使用**子智能体**。子智能体会在自己的会话中运行，
    返回摘要，并保持你的主聊天仍然可响应。

    让你的机器人“为这个任务启动一个子智能体”，或者使用 `/subagents`。
    使用聊天中的 `/status` 查看 Gateway 网关当前正在做什么（以及它是否繁忙）。

    令牌提示：长任务和子智能体都会消耗令牌。如果你担心成本，可以通过 `agents.defaults.subagents.model` 为子智能体设置
    更便宜的模型。

    文档： [Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上与线程绑定的 subagent 会话是如何工作的？">
    使用线程绑定。你可以将 Discord 线程绑定到某个 subagent 或会话目标，这样该线程中的后续消息就会保持在该绑定会话上。

    基本流程：

    - 使用 `sessions_spawn` 并设置 `thread: true` 启动（也可以选择设置 `mode: "session"` 以支持持久后续跟进）。
    - 或者使用 `/focus <target>` 手动绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - 使用 `/unfocus` 解除线程绑定。

    必需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 在启动时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档： [Sub-agents](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[Configuration Reference](/zh-CN/gateway/configuration-reference)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="一个 subagent 已完成，但完成更新发到了错误的位置，或者根本没有发出。我应该检查什么？">
    先检查已解析的请求方路由：

    - 完成模式的 subagent 投递会优先使用任何已绑定的线程或会话路由（如果存在）。
    - 如果完成来源只携带渠道，OpenClaw 会回退到请求方会话保存的路由（`lastChannel` / `lastTo` / `lastAccountId`），以便直接投递仍然可以成功。
    - 如果既没有绑定路由，也没有可用的已保存路由，直接投递可能失败，结果会回退为排队的会话投递，而不是立即发布到聊天中。
    - 无效或过期的目标仍可能导致队列回退或最终投递失败。
    - 如果子会话最后一个可见的助手回复恰好是静默令牌 `NO_REPLY` / `no_reply`，或者恰好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制公告，而不是发布更早的过时进度。
    - 如果子会话在仅进行了工具调用后超时，公告可能会将其折叠为简短的部分进度摘要，而不是重放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档： [Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)、[Session Tools](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我应该检查什么？">
    Cron 在 Gateway 网关进程内部运行。如果 Gateway 网关没有持续运行，
    定时任务就不会运行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`），并且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否 24/7 持续运行（没有休眠/重启）。
    - 验证任务的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 已触发，但没有任何内容发送到渠道。为什么？">
    先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不应预期有 runner 回退发送。
    - 缺少或无效的公告目标（`channel` / `to`）表示 runner 跳过了出站投递。
    - 渠道认证失败（`unauthorized`、`Forbidden`）表示 runner 尝试投递了，但凭证阻止了它。
    - 静默的隔离结果（仅有 `NO_REPLY` / `no_reply`）会被视为有意不可投递，因此 runner 也会抑制排队回退投递。

    对于隔离的 cron 任务，如果聊天路由可用，智能体仍然可以通过 `message`
    工具直接发送。`--announce` 只控制 runner 的
    最终文本回退路径，即智能体尚未自行发送的文本。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离的 cron 运行会切换模型或重试一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离的 cron 可以在活动运行抛出 `LiveSessionModelSwitchError` 时，
    持久化运行时模型切换并重试。重试会保留切换后的
    provider/model，如果切换还带有新的认证配置覆盖，cron
    也会在重试前将其持久化。

    相关选择规则：

    - 如果适用，Gmail hook 模型覆盖优先级最高。
    - 然后是每个任务的 `model`。
    - 然后是任何已存储的 cron 会话模型覆盖。
    - 最后是正常的智能体/默认模型选择。

    重试循环是有上限的。在初始尝试加上 2 次切换重试之后，
    cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[cron CLI](/zh-CN/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 skills？">
    使用原生 `openclaw skills` 命令，或将 skills 放入你的工作区。macOS 的 Skills UI 在 Linux 上不可用。
    可在 [https://clawhub.ai](https://clawhub.ai) 浏览 skills。

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
    同步你自己的 skills 时，才需要单独安装 `clawhub` CLI。对于跨智能体共享安装，请将 skill 放在
    `~/.openclaw/skills` 下，并使用 `agents.defaults.skills` 或
    `agents.list[].skills`，如果你想限制哪些智能体可以看到它。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划运行任务，或者持续在后台运行吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron jobs**：用于定时或周期性任务（重启后仍会保留）。
    - **Heartbeat**：用于“主会话”的周期性检查。
    - **隔离任务**：用于会发布摘要或投递到聊天的自主智能体。

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以在 Linux 上运行仅支持 Apple macOS 的 skills 吗？">
    不能直接运行。macOS skills 受 `metadata.openclaw.os` 与所需二进制文件限制，而且 skills 只有在 **Gateway 网关主机** 上符合条件时，才会出现在系统提示中。在 Linux 上，仅限 `darwin` 的 skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖这些限制。

    你有三种受支持的模式：

    **选项 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在存在 macOS 二进制文件的地方运行 Gateway 网关，然后通过 [远程模式](#gateway-ports-already-running-and-remote-mode) 或 Tailscale 从 Linux 连接。由于 Gateway 网关主机是 macOS，这些 skills 会正常加载。

    **选项 B - 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并在 Mac 上将 **Node Run Commands** 设置为 “Always Ask” 或 “Always Allow”。当节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的 skills 视为符合条件。智能体会通过 `nodes` 工具运行这些 skills。如果你选择 “Always Ask”，在提示中批准 “Always Allow” 会将该命令添加到允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    保持 Gateway 网关运行在 Linux 上，但让所需的 CLI 二进制文件解析为通过 SSH 在 Mac 上运行的包装器。然后覆盖该 skill，使其允许 Linux，从而保持其符合条件。

    1. 为该二进制文件创建一个 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将该包装器放到 Linux 主机的 `PATH` 中（例如 `~/bin/memo`）。
    3. 覆盖该 skill 的元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: 通过 macOS 上的 memo CLI 管理 Apple Notes。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动一个新会话，以便刷新 skills 快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    可选方案：

    - **自定义 skill / plugin：** 最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：** 无需编写代码即可使用，但更慢且更脆弱。

    如果你想为每个客户保留上下文（代理工作流），一种简单模式是：

    - 为每个客户创建一个 Notion 页面（上下文 + 偏好 + 当前工作）。
    - 让智能体在会话开始时获取该页面。

    如果你想要原生集成，请提交功能请求，或构建一个
    面向这些 API 的 skill。

    安装 skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会落在当前工作区的 `skills/` 目录中。对于跨智能体共享的 skills，请将它们放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只希望某些智能体看到共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。某些 skills 需要通过 Homebrew 安装的二进制文件；在 Linux 上这意味着 Linuxbrew（参见上面的 Homebrew Linux FAQ 条目）。请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何让 OpenClaw 使用我现有的已登录 Chrome？">
    使用内置的 `user` 浏览器配置文件，它通过 Chrome DevTools MCP 进行连接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，请创建一个显式的 MCP 配置文件：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    此路径可以使用本地主机浏览器或已连接的浏览器节点。如果 Gateway 网关运行在其他地方，请在浏览器所在机器上运行一个节点主机，或改用远程 CDP。

    `existing-session` / `user` 当前限制如下：

    - 操作基于 ref，而不是基于 CSS 选择器
    - 上传需要 `ref` / `inputRef`，并且当前一次只支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍然需要受管浏览器或原始 CDP 配置文件

  </Accordion>
</AccordionGroup>

## 沙箱隔离与内存

<AccordionGroup>
  <Accordion title="有专门的沙箱隔离文档吗？">
    有。请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。对于 Docker 专用设置（Docker 中运行完整 gateway 或沙箱镜像），请参阅 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉功能受限——如何启用完整功能？">
    默认镜像以安全优先，并以 `node` 用户身份运行，因此它
    不包含系统软件包、Homebrew 或内置浏览器。若要获得更完整的配置：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，以便缓存得以保留。
    - 通过 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH` 并确保该路径已持久化。

    文档： [Docker](/zh-CN/install/docker)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以用一个智能体让私信保持私有，同时让群组公开/沙箱隔离吗？">
    可以——前提是你的私有流量是 **私信**，而你的公开流量是 **群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/渠道会话（非主键）会在配置的沙箱后端中运行，而主私信会话则保留在主机上运行。如果你不选择后端，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置演练 + 示例配置： [群组：个人私信 + 公开群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考： [Gateway 网关配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何把主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局绑定和每个智能体的绑定会合并；当 `scope: "shared"` 时，会忽略每个智能体的绑定。对任何敏感内容请使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会根据规范化路径以及通过最深现有父目录解析出的规范路径来验证绑定源。这意味着即使最后一个路径段尚不存在，通过符号链接父目录逃逸仍会以关闭方式失败，并且在解析符号链接后，允许根目录检查仍然适用。

    示例和安全说明请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts) 和 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="内存是如何工作的？">
    OpenClaw 的记忆实际上就是智能体工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日日志
    - `MEMORY.md` 中整理后的长期笔记（仅主/私密会话）

    OpenClaw 还会运行一个**静默的压缩前记忆刷新**，以提醒模型
    在自动压缩之前写入持久笔记。这仅在工作区
    可写时运行（只读沙箱会跳过）。请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="记忆总是忘东西。如何让它真正记住？">
    请让机器人**把这个事实写入记忆**。长期笔记应写入 `MEMORY.md`，
    短期上下文应写入 `memory/YYYY-MM-DD.md`。

    这是我们仍在持续改进的领域。提醒模型存储记忆会有帮助；
    它会知道该怎么做。如果它仍然经常遗忘，请确认 Gateway 网关每次运行时
    使用的是同一个工作区。

    文档： [Memory](/zh-CN/concepts/memory)、[Agent workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永久保存吗？有什么限制？">
    记忆文件保存在磁盘上，除非你删除它们，否则会一直存在。限制来自你的
    存储空间，而不是模型。**会话上下文** 仍然受模型
    上下文窗口限制，因此长对话可能会被压缩或截断。这就是为什么
    存在记忆搜索——它只会将相关部分重新拉回上下文。

    文档： [Memory](/zh-CN/concepts/memory)、[Context](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索是否需要 OpenAI API 密钥？">
    只有在你使用 **OpenAI embeddings** 时才需要。Codex OAuth 仅覆盖 chat/completions，
    **不**授予 embeddings 访问权限，因此**使用 Codex 登录（OAuth 或
    Codex CLI 登录）**并不能帮助启用语义记忆搜索。OpenAI embeddings
    仍然需要真实的 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置 provider，OpenClaw 会在
    能解析出 API 密钥时自动选择 provider（认证配置、`models.providers.*.apiKey` 或环境变量）。
    如果能解析出 OpenAI 密钥，它会优先选择 OpenAI；否则如果能解析出 Gemini 密钥，
    就选择 Gemini；接着是 Voyage，然后是 Mistral。如果没有可用的远程密钥，记忆
    搜索会保持禁用状态，直到你完成配置。如果你已经配置并存在本地模型路径，OpenClaw
    会优先选择 `local`。当你显式设置
    `memorySearch.provider = "ollama"` 时，也支持 Ollama。

    如果你更希望保持本地化，请设置 `memorySearch.provider = "local"`（并可选地
    设置 `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local**
    embedding 模型——设置详情请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 磁盘上的存储位置

<AccordionGroup>
  <Accordion title="使用 OpenClaw 的所有数据都会保存在本地吗？">
    不会——**OpenClaw 的状态在本地**，但**外部服务仍然会看到你发送给它们的内容**。

    - **默认本地：** 会话、记忆文件、配置和工作区都位于 Gateway 网关主机上
      （`~/.openclaw` + 你的工作区目录）。
    - **因需要而远程：** 你发送给模型 provider（Anthropic/OpenAI 等）的消息会发送到
      它们的 API，而聊天平台（WhatsApp/Telegram/Slack 等）会将消息数据存储在其
      服务器上。
    - **你可以控制数据范围：** 使用本地模型可以让提示词留在你的机器上，但渠道
      流量仍会经过对应渠道的服务器。

    相关内容： [Agent workspace](/zh-CN/concepts/agent-workspace)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 把数据存储在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | Path                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到认证配置中）                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 认证配置（OAuth、API 密钥，以及可选的 `keyRef`/`tokenRef`）        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider 的可选文件后端 secret 负载               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目已清理）                          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | provider 状态（例如 `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每个智能体的状态（agentDir + sessions）                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史与状态（每个智能体）                                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（每个智能体）                                           |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、skills 等）是独立的，并通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于**智能体工作区**，而不是 `~/.openclaw`。

    - **工作区（每个智能体）：** `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`，以及可选的 `HEARTBEAT.md`。
      小写根目录 `memory.md` 仅作为旧版修复输入；当两个文件都存在时，`openclaw doctor --fix`
      可以将其合并到 `MEMORY.md` 中。
    - **状态目录（`~/.openclaw`）：** 配置、渠道/provider 状态、认证配置、会话、日志，
      以及共享 skills（`~/.openclaw/skills`）。

    默认工作区为 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“遗忘”了内容，请确认 Gateway 网关每次启动时
    使用的都是同一个工作区（并记住：远程模式使用的是**Gateway 网关主机的**
    工作区，而不是你本地笔记本的）。

    提示：如果你希望某个行为或偏好可以长期保留，请让机器人**把它写入
    AGENTS.md 或 MEMORY.md**，而不要只依赖聊天历史。

    请参阅 [Agent workspace](/zh-CN/concepts/agent-workspace) 和 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的**智能体工作区**放入一个**私有** git 仓库，并将其备份到某个
    私密位置（例如 GitHub 私有仓库）。这样可以保留记忆 + AGENTS/SOUL/USER
    文件，并让你稍后恢复助手的“思维”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、令牌或加密的 secrets 负载）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （参见上面的迁移问题）。

    文档： [Agent workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何彻底卸载 OpenClaw？">
    请参阅专门指南： [Uninstall](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，而不是硬性沙箱。
    相对路径会在工作区内解析，但绝对路径可以访问其他
    主机位置，除非启用了沙箱隔离。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每个智能体的沙箱设置。如果你
    希望某个仓库作为默认工作目录，请将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库本身只是源代码；除非你有意让智能体在其中工作，否则请保持
    工作区与其分离。

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

  <Accordion title="远程模式：会话存储在哪里？">
    会话状态由**Gateway 网关主机**持有。如果你处于远程模式，你需要关心的会话存储位于远程机器上，而不是本地笔记本上。请参阅 [Session management](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？它在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH` 读取一个可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果该文件不存在，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何监听 / UI 显示 unauthorized'>
    非 loopback 绑定**需要有效的 gateway 认证路径**。实际中这意味着：

    - shared-secret 认证：token 或 password
    - `gateway.auth.mode: "trusted-proxy"`，并且位于配置正确的非 loopback 身份感知反向代理之后

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

    - `gateway.remote.token` / `.password` **不会**单独启用本地 gateway 认证。
    - 只有当 `gateway.auth.*` 未设置时，本地调用路径才可以将 `gateway.remote.*` 作为回退。
    - 对于 password 认证，请改为设置 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但无法解析，则解析会以关闭方式失败（不会被远程回退掩盖）。
    - shared-secret Control UI 配置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（存储在 app/UI 设置中）。像 Tailscale Serve 或 `trusted-proxy` 这样的带身份模式则改用请求头。避免将 shared secrets 放入 URL。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机的 loopback 反向代理仍然**不能**满足 trusted-proxy 认证。trusted proxy 必须是已配置的非 loopback 来源。

  </Accordion>

  <Accordion title="为什么我现在在 localhost 上也需要 token？">
    OpenClaw 默认强制启用 gateway 认证，包括 loopback。在正常默认路径中，这意味着 token 认证：如果没有配置显式认证路径，gateway 启动时会解析为 token 模式并自动生成一个 token，将其保存到 `gateway.auth.token`，因此**本地 WS 客户端必须进行认证**。这样可以阻止其他本地进程调用 Gateway 网关。

    如果你希望使用其他认证路径，可以显式选择 password 模式（或者，对于非 loopback 的身份感知反向代理，使用 `trusted-proxy`）。如果你**确实**想要开放的 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可以随时为你生成 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="修改配置后是否必须重启？">
    Gateway 网关会监视配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：安全变更热应用，关键变更则重启
    - 也支持 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何禁用 CLI 里的搞笑标语？">
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
    - `random`：轮换显示有趣/季节性标语（默认行为）。
    - 如果你希望完全不显示横幅，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（以及 Web 抓取）？">
    `web_fetch` 无需 API 密钥即可使用。`web_search` 取决于你选择的
    provider：

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily 等基于 API 的 provider 需要正常配置对应 API 密钥。
    - Ollama Web 搜索无需密钥，但它使用你配置的 Ollama 主机，并需要执行 `ollama signin`。
    - DuckDuckGo 无需密钥，但它是基于 HTML 的非官方集成。
    - SearXNG 无需密钥/可自托管；配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：** 运行 `openclaw configure --section web` 并选择一个 provider。
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

    provider 专属的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧版 `tools.web.search.*` provider 路径目前仍会临时加载以保持兼容，但不应再用于新配置。
    Firecrawl 的 Web 抓取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用允许列表，请添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非你显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭证中自动检测第一个已就绪的抓取回退 provider。当前内置 provider 是 Firecrawl。
    - 守护进程从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档： [Web tools](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 把我的配置清空了。如何恢复并避免再次发生？">
    `config.apply` 会替换**整个配置**。如果你发送的是部分对象，其余所有内容
    都会被移除。

    当前 OpenClaw 会防护许多意外覆盖：

    - OpenClaw 自有的配置写入会在写入前校验完整的变更后配置。
    - 无效或破坏性的 OpenClaw 自有写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑导致启动或热重载失败，Gateway 网关会恢复最后一个已知良好的配置，并将被拒绝的文件保存为 `openclaw.json.clobbered.*`。
    - 恢复后，主智能体会收到启动警告，以避免它再次盲目写入错误配置。

    恢复方法：

    - 检查 `openclaw logs --follow` 中是否有 `Config auto-restored from last-known-good`、`Config write rejected:` 或 `config reload restored last-known-good config`。
    - 检查活动配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 如果恢复后的活动配置可用，就保留它，然后仅通过 `openclaw config set` 或 `config.patch` 复制回你原本想要的键。
    - 运行 `openclaw config validate` 和 `openclaw doctor`。
    - 如果你没有 last-known-good 或被拒绝的负载，请从备份恢复，或重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这属于意外情况，请提交 bug，并附上你最后已知的配置或任何备份。
    - 本地编码智能体通常可以根据日志或历史记录重建可用配置。

    避免方法：

    - 对小改动使用 `openclaw config set`。
    - 交互式编辑使用 `openclaw configure`。
    - 如果你不确定精确路径或字段形状，请先使用 `config.schema.lookup`；它会返回一个浅层 schema 节点以及直接子项摘要，便于逐层深入。
    - 对部分 RPC 编辑使用 `config.patch`；仅在需要完整替换配置时使用 `config.apply`。
    - 如果你在智能体运行中使用仅限 owner 的 `gateway` 工具，它仍然会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会规范化为同一受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档： [配置](/zh-CN/cli/config)、[Configure](/zh-CN/cli/configure)、[Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何在多台设备之间运行一个中央 Gateway 网关，并配合专用工作节点？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**：

    - **Gateway 网关（中央）：** 负责渠道（Signal/WhatsApp）、路由和会话。
    - **节点（设备）：** Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（工作节点）：** 为特定角色提供独立的大脑/工作区（例如 “Hetzner 运维”、“个人数据”）。
    - **子智能体：** 当你需要并行处理时，从主智能体生成后台工作。
    - **TUI：** 连接到 Gateway 网关并切换智能体/会话。

    文档： [Nodes](/zh-CN/nodes)、[Remote access](/zh-CN/gateway/remote)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[TUI](/zh-CN/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 浏览器可以以 headless 模式运行吗？">
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

    默认值为 `false`（有头模式）。在某些网站上，headless 更容易触发反机器人检查。请参阅 [Browser](/zh-CN/tools/browser)。

    Headless 使用**相同的 Chromium 引擎**，适用于大多数自动化任务（表单、点击、抓取、登录）。主要区别是：

    - 没有可见的浏览器窗口（如果你需要可视化，请使用截图）。
    - 有些网站在 headless 模式下对自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 经常会拦截 headless 会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。
    完整配置示例请参阅 [Browser](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关与节点

<AccordionGroup>
  <Accordion title="Telegram、Gateway 网关和节点之间的命令是如何传播的？">
    Telegram 消息由 **Gateway 网关** 处理。Gateway 网关运行智能体，
    只有在需要节点工具时，才会通过 **Gateway WebSocket** 调用节点：

    Telegram → Gateway 网关 → 智能体 → `node.*` → 节点 → Gateway 网关 → Telegram

    节点不会看到入站 provider 流量；它们只会接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程，智能体如何访问我的电脑？">
    简短回答：**把你的电脑配对为一个节点**。Gateway 网关运行在别处，但它可以
    通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在常开主机上运行 Gateway 网关（VPS/家庭服务器）。
    2. 将 Gateway 网关主机和你的电脑加入同一个 tailnet。
    3. 确保 Gateway 网关 WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以**通过 SSH 远程连接**模式（或直接 tailnet）
       连接，以便它可以注册为一个节点。
    5. 在 Gateway 网关上批准该节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP bridge；节点通过 Gateway WebSocket 连接。

    安全提醒：配对 macOS 节点意味着该机器允许执行 `system.run`。只
    配对你信任的设备，并查看 [Security](/zh-CN/gateway/security)。

    文档： [Nodes](/zh-CN/nodes)、[Gateway protocol](/zh-CN/gateway/protocol)、[macOS remote mode](/zh-CN/platforms/mac/remote)、[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到任何回复。接下来怎么办？">
    先检查基础项：

    - Gateway 网关正在运行：`openclaw gateway status`
    - Gateway 网关健康状态：`openclaw status`
    - 渠道健康状态：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，请确认 `gateway.auth.allowTailscale` 已正确设置。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已建立并指向正确端口。
    - 确认你的允许列表（私信或群组）包含你的账号。

    文档： [Tailscale](/zh-CN/gateway/tailscale)、[Remote access](/zh-CN/gateway/remote)、[Channels](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以。虽然没有内置的“机器人到机器人”桥接，但你可以通过几种
    可靠方式将其连接起来：

    **最简单：** 使用两个机器人都能访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让 Bot A 向 Bot B 发送消息，然后让 Bot B 像平常一样回复。

    **CLI 桥接（通用）：** 运行一个脚本，通过
    `openclaw agent --message ... --deliver` 调用另一个 Gateway 网关，并将目标指向另一个机器人
    监听的聊天。如果其中一个机器人运行在远程 VPS 上，请将你的 CLI 指向那个远程 Gateway 网关，
    可通过 SSH/Tailscale（参见 [Remote access](/zh-CN/gateway/remote)）。

    示例模式（在一台可访问目标 Gateway 网关的机器上运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：添加一个护栏，以避免两个机器人无限循环（仅在提及时回复、渠道
    允许列表，或“不要回复机器人消息”的规则）。

    文档： [Remote access](/zh-CN/gateway/remote)、[Agent CLI](/zh-CN/cli/agent)、[Agent send](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要分别使用不同 VPS 吗？">
    不需要。一个 Gateway 网关可以托管多个智能体，每个智能体都有自己的工作区、模型默认值
    和路由。这是标准设置，比为每个智能体分别运行
    一个 VPS 更便宜也更简单。

    只有在你需要硬隔离（安全边界）或非常
    不同且不想共享的配置时，才需要使用独立 VPS。否则，保留一个 Gateway 网关，
    并使用多个智能体或子智能体即可。

  </Accordion>

  <Accordion title="与从 VPS 通过 SSH 访问相比，在我的个人笔记本上使用一个节点有好处吗？">
    有——节点是从远程 Gateway 网关访问你笔记本的一级方式，而且
    它提供的不仅仅是 shell 访问。Gateway 网关运行在 macOS/Linux 上（Windows 通过 WSL2），并且
    很轻量（小型 VPS 或 Raspberry Pi 级设备就足够；4 GB RAM 已很充裕），因此一种常见
    配置是使用一个始终在线的主机，再将你的笔记本作为一个节点。

    - **无需入站 SSH。** 节点会主动连接到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。** `system.run` 在该笔记本上受到节点允许列表/审批机制保护。
    - **更多设备工具。** 除了 `system.run` 之外，节点还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。** 保持 Gateway 网关运行在 VPS 上，但通过笔记本上的节点主机在本地运行 Chrome，或者通过 Chrome MCP 连接到主机上的本地 Chrome。

    对于临时 shell 访问，SSH 没问题，但对于持续性的智能体工作流和
    设备自动化，节点更简单。

    文档： [Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行一个 gateway 服务吗？">
    不会。每台主机上通常应只运行**一个 gateway**，除非你有意运行隔离配置文件（参见 [Multiple gateways](/zh-CN/gateway/multiple-gateways)）。节点是连接到
    gateway 的外设（iOS/Android 节点，或菜单栏应用中的 macOS “node mode”）。关于无头节点
    主机和 CLI 控制，请参阅 [Node host CLI](/zh-CN/cli/node)。

    修改 `gateway`、`discovery` 和 `canvasHost` 后需要完整重启。

  </Accordion>

  <Accordion title="是否有通过 API / RPC 应用配置的方法？">
    有。

    - `config.schema.lookup`：在写入前检查某个配置子树，包括其浅层 schema 节点、匹配到的 UI 提示以及直接子项摘要
    - `config.get`：获取当前快照 + hash
    - `config.patch`：安全的部分更新（大多数 RPC 编辑推荐使用）；可热重载时热重载，必要时重启
    - `config.apply`：校验并替换完整配置；可热重载时热重载，必要时重启
    - 仅限 owner 的 `gateway` 运行时工具仍然拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会规范化为相同的受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这样会设置你的工作区，并限制哪些人可以触发机器人。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale，并从我的 Mac 连接？">
    最小步骤如下：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装并登录**
       - 使用 Tailscale 应用并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，让 VPS 拥有稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway 网关 WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你希望在不使用 SSH 的情况下使用 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这会让 gateway 保持绑定在 loopback 上，并通过 Tailscale 暴露 HTTPS。请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露 **Gateway 网关 Control UI + WS**。节点通过同一个 Gateway WS 端点连接。

    推荐设置：

    1. **确保 VPS 和 Mac 位于同一个 tailnet 中**。
    2. **在 Remote 模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       该应用会隧道转发 Gateway 网关端口，并以节点身份连接。
    3. **在 gateway 上批准该节点**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档： [Gateway protocol](/zh-CN/gateway/protocol)、[设备发现](/zh-CN/gateway/discovery)、[macOS remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装，还是只添加一个节点？">
    如果你只需要第二台笔记本上的**本地工具**（屏幕/摄像头/执行），就把它添加为一个
    **节点**。这样可以保持单一 Gateway 网关，并避免重复配置。本地节点工具
    当前仅支持 macOS，但我们计划扩展到其他操作系统。

    只有当你需要**硬隔离**或两个完全独立的机器人时，才安装第二个 Gateway 网关。

    文档： [Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)、[Multiple gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 `.env` 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

    - 当前工作目录中的 `.env`
    - 来自 `~/.openclaw/.env`（即 `$OPENCLAW_STATE_DIR/.env`）的全局回退 `.env`

    两个 `.env` 文件都不会覆盖已有的环境变量。

    你也可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

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

  <Accordion title="我通过服务启动了 Gateway 网关，然后环境变量消失了。怎么办？">
    常见的两种修复方式：

    1. 将缺失的键放入 `~/.openclaw/.env`，这样即使服务没有继承你的 shell 环境，也会被读取。
    2. 启用 shell 导入（可选便捷功能）：

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

    这会运行你的登录 shell，并且只导入缺失的预期键名（绝不覆盖）。对应的环境变量为：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示 “Shell env: off.”。为什么？'>
    `openclaw models status` 报告的是**shell 环境导入**是否已启用。“Shell env: off”
    **并不**表示你的环境变量丢失了——它只表示 OpenClaw 不会
    自动加载你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。可通过以下任一方式修复：

    1. 将 token 放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将它添加到配置中的 `env` 块（仅在缺失时应用）。

    然后重启 gateway 并再次检查：

    ```bash
    openclaw models status
    ```

    Copilot token 从 `COPILOT_GITHUB_TOKEN` 读取（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）。
    请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话与多个聊天

<AccordionGroup>
  <Accordion title="如何开始一段全新的对话？">
    发送 `/new` 或 `/reset` 作为独立消息。请参阅 [Session management](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 之后过期，但这**默认是禁用的**（默认值为 **0**）。
    将其设置为正数即可启用空闲过期。启用后，空闲期之后的**下一条**
    消息会为该聊天键启动一个全新的会话 ID。
    这不会删除转录记录——它只是开始一个新会话。

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

    不过，最好把这看作一种**有趣的实验**。它会消耗大量令牌，而且通常
    不如使用一个机器人配合多个独立会话高效。我们设想的典型模式
    是你与一个机器人交谈，并通过不同会话进行并行工作。该
    机器人也可以在需要时启动子智能体。

    文档： [多智能体路由](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[Agents CLI](/zh-CN/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文会在任务中途被截断？如何防止？">
    会话上下文受模型窗口限制。长聊天、大量工具输出或很多
    文件都可能触发压缩或截断。

    有帮助的做法：

    - 让机器人总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让机器人重新读取。
    - 对长任务或并行工作使用子智能体，这样主聊天可以保持更小。
    - 如果这种情况经常发生，选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何完全重置 OpenClaw 但保留安装？">
    使用 reset 命令：

    ```bash
    openclaw reset
    ```

    非交互式完全重置：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    然后重新运行设置：

    ```bash
    openclaw onboard --install-daemon
    ```

    说明：

    - 如果新手引导检测到现有配置，也会提供 **Reset**。请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了 profiles（`--profile` / `OPENCLAW_PROFILE`），请重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅开发模式；会清空开发配置 + 凭证 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我收到了 “context too large” 错误——如何重置或压缩？'>
    使用以下任一方式：

    - **压缩**（保留对话，但总结较早的轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 来引导摘要内容。

    - **重置**（为同一聊天键创建新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果这种情况持续发生：

    - 启用或调优**会话修剪**（`agents.defaults.contextPruning`）以裁剪旧的工具输出。
    - 使用上下文窗口更大的模型。

    文档： [Compaction](/zh-CN/concepts/compaction)、[Session pruning](/zh-CN/concepts/session-pruning)、[Session management](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到 “LLM request rejected: messages.content.tool_use.input field required” 这样的错误？'>
    这是 provider 校验错误：模型发出了一个 `tool_use` 块，但缺少必需的
    `input`。这通常意味着会话历史已过期或损坏（常见于长线程
    或工具/schema 变更之后）。

    修复方法：使用 `/new`（独立消息）开始一个全新的会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟都会收到 heartbeat 消息？">
    heartbeat 默认每 **30m** 运行一次（使用 OAuth 认证时为 **1h**）。你可以调整或禁用它：

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

    如果 `HEARTBEAT.md` 存在，但实际上是空的（只有空行和 markdown
    标题，如 `# Heading`），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。
    如果该文件不存在，heartbeat 仍会运行，并由模型决定要做什么。

    每个智能体的覆盖使用 `agents.list[].heartbeat`。文档： [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要向 WhatsApp 群组添加一个“机器人账号”吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以只要你在群里，OpenClaw 就能看到它。
    默认情况下，在你允许发送者之前，群组回复会被阻止（`groupPolicy: "allowlist"`）。

    如果你希望只有**你自己**可以触发群组回复：

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
    方式 1（最快）：查看日志并在群里发送一条测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    方式 2（如果已经配置/加入允许列表）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档： [WhatsApp](/zh-CN/channels/whatsapp)、[Directory](/zh-CN/cli/directory)、[Logs](/zh-CN/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组中不回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @ 提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups` 但没有 `"*"`，而该群组不在允许列表中。

    请参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会与私信共享上下文吗？">
    直接聊天默认会折叠到主会话。群组/渠道有各自独立的会话键，而 Telegram 话题 / Discord 线程也是独立会话。请参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制。几十个（甚至几百个）都没问题，但要注意：

    - **磁盘增长：** 会话 + 转录记录存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **令牌成本：** 智能体越多，并发模型使用也越多。
    - **运维开销：** 每个智能体的认证配置、工作区和渠道路由。

    提示：

    - 为每个智能体保留一个**活动**工作区（`agents.defaults.workspace`）。
    - 如果磁盘持续增长，修剪旧会话（删除 JSONL 或 store 条目）。
    - 使用 `openclaw doctor` 发现零散工作区和 profile 不匹配问题。

  </Accordion>

  <Accordion title="我可以同时运行多个机器人或聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**来运行多个相互隔离的智能体，并按
    渠道/账号/对等方对入站消息进行路由。Slack 支持作为渠道，并且可以绑定到特定智能体。

    浏览器访问功能很强大，但并不等于“人类能做的都能做”——反机器人机制、CAPTCHA 和 MFA
    仍然可能阻止自动化。要获得最可靠的浏览器控制，请在主机上使用本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 网关主机（VPS/Mac mini）。
    - 每个角色一个智能体（bindings）。
    - 将 Slack 渠道绑定到这些智能体。
    - 需要时通过 Chrome MCP 或节点使用本地浏览器。

    文档： [Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [Browser](/zh-CN/tools/browser)、[Nodes](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、故障切换和认证配置

模型问答——默认值、选择、别名、切换、故障切换、认证配置——
位于 [Models FAQ](/zh-CN/help/faq-models)。

## Gateway 网关：端口、“已在运行”和远程模式

<AccordionGroup>
  <Accordion title="Gateway 网关使用哪个端口？">
    `gateway.port` 控制单一复用端口，用于 WebSocket + HTTP（Control UI、hooks 等）。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认值 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示 “Runtime: running”，但 “Connectivity probe: failed”？'>
    因为 “running” 是 **supervisor** 的视角（launchd/systemd/schtasks）。连接探测则是 CLI 实际连接到 gateway WebSocket 的结果。

    使用 `openclaw gateway status` 并重点查看这些行：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（端口上实际绑定的内容）
    - `Last gateway error:`（进程存活但端口未监听时的常见根因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示 “Config (cli)” 和 “Config (service)” 不同？'>
    你正在编辑一个配置文件，而服务运行的是另一个配置文件（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复方法：

    ```bash
    openclaw gateway install --force
    ```

    从你希望服务使用的相同 `--profile` / 环境中运行该命令。

  </Accordion>

  <Accordion title='“another gateway instance is already listening” 是什么意思？'>
    OpenClaw 会在启动时立即绑定 WebSocket 监听器，以强制执行运行时锁（默认 `ws://127.0.0.1:18789`）。如果绑定因 `EADDRINUSE` 失败，它会抛出 `GatewayLockError`，表示另一个实例已经在监听。

    修复方法：停止另一个实例、释放端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何以远程模式运行 OpenClaw（客户端连接到其他地方的 Gateway 网关）？">
    设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，可选地附带 shared-secret 远程凭证：

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    说明：

    - 只有当 `gateway.mode` 为 `local` 时，`openclaw gateway` 才会启动（除非你传入覆盖标志）。
    - macOS 应用会监视配置文件，并在这些值变化时实时切换模式。
    - `gateway.remote.token` / `.password` 仅是客户端侧的远程凭证；它们本身不会启用本地 gateway 认证。

  </Accordion>

  <Accordion title='Control UI 显示 “unauthorized”（或不断重连）。现在怎么办？'>
    你的 gateway 认证路径与 UI 的认证方式不匹配。

    事实（基于代码）：

    - Control UI 会将 token 保存在当前浏览器标签页会话和所选 gateway URL 对应的 `sessionStorage` 中，因此在同一标签页刷新后仍可正常工作，而无需恢复长期 `localStorage` token 持久化。
    - 在 `AUTH_TOKEN_MISMATCH` 时，如果 gateway 返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`），受信任客户端可以使用缓存的设备 token 尝试一次有界重试。
    - 该缓存 token 重试现在会复用与设备 token 一起存储的已批准 scopes。显式 `deviceToken` / 显式 `scopes` 调用方仍会保留其请求的 scope 集，而不会继承缓存 scopes。
    - 在该重试路径之外，连接认证优先级依次为：显式 shared token/password、显式 `deviceToken`、存储的设备 token、bootstrap token。
    - Bootstrap token 的 scope 检查带有角色前缀。内置的 bootstrap operator 允许列表只能满足 operator 请求；node 或其他非 operator 角色仍然需要带其自身角色前缀的 scopes。

    修复方法：

    - 最快方式：`openclaw dashboard`（打印并复制 dashboard URL，尝试打开；如果是无头环境则显示 SSH 提示）。
    - 如果你还没有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是远程环境，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。
    - shared-secret 模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的 secret。
    - Tailscale Serve 模式：确保已启用 `gateway.auth.allowTailscale`，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份头的原始 loopback/tailnet URL。
    - trusted-proxy 模式：确保你是通过已配置的非 loopback 身份感知代理访问，而不是通过同主机 loopback 代理或原始 gateway URL。
    - 如果在那一次重试之后仍然不匹配，请轮换/重新批准已配对的设备 token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该 rotate 调用提示被拒绝，请检查两点：
      - 已配对设备会话只能轮换其**自己的**设备，除非它还具有 `operator.admin`
      - 显式 `--scope` 值不能超出调用方当前的 operator scopes
    - 仍然卡住？运行 `openclaw status --all`，并按照 [故障排除](/zh-CN/gateway/troubleshooting) 操作。认证详情请参阅 [Dashboard](/zh-CN/web/dashboard)。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet，但它无法绑定，也没有任何监听">
    `tailnet` 绑定会从你的网络接口中选择一个 Tailscale IP（100.64.0.0/10）。如果机器未加入 Tailscale（或接口已关闭），就没有可绑定的地址。

    修复方法：

    - 在该主机上启动 Tailscale（使其拥有一个 100.x 地址），或
    - 切换到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是显式设置。`auto` 会优先选择 loopback；如果你想要仅绑定 tailnet，请使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一主机上运行多个 Gateway 网关吗？">
    通常不建议——一个 Gateway 网关可以运行多个消息渠道和智能体。只有在你需要冗余（例如救援机器人）或硬隔离时，才使用多个 Gateway 网关。

    但也可以，只是你必须隔离以下内容：

    - `OPENCLAW_CONFIG_PATH`（每个实例独立配置）
    - `OPENCLAW_STATE_DIR`（每个实例独立状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 每个实例使用 `openclaw --profile <name> ...`（会自动创建 `~/.openclaw-<name>`）。
    - 在每个 profile 配置中设置唯一的 `gateway.port`（或对手动运行传入 `--port`）。
    - 安装按 profile 区分的服务：`openclaw --profile <name> gateway install`。

    Profiles 还会给服务名加后缀（`ai.openclaw.<profile>`；旧版为 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南： [Multiple gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 是什么意思？'>
    Gateway 网关是一个 **WebSocket 服务器**，并且它要求第一条消息
    必须是 `connect` 帧。如果收到的是其他内容，它会以
    **code 1008**（策略违规）关闭连接。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`），而不是使用 WS 客户端。
    - 你使用了错误的端口或路径。
    - 某个代理或隧道剥离了认证头，或发送了非 Gateway 网关请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，则使用 `wss://...`）。
    2. 不要在普通浏览器标签页中打开 WS 端口。
    3. 如果启用了认证，请在 `connect` 帧中包含 token/password。

    如果你使用的是 CLI 或 TUI，URL 应该如下所示：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议详情： [Gateway protocol](/zh-CN/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志与调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以通过 `logging.file` 设置固定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快查看日志尾部的方法：

    ```bash
    openclaw logs --follow
    ```

    服务/supervisor 日志（当 gateway 通过 launchd/systemd 运行时）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；profile 使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多信息请参阅 [故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 网关服务？">
    使用 gateway 辅助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你是手动运行 gateway，`openclaw gateway --force` 可以重新夺回端口。请参阅 [Gateway 网关](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端——如何重启 OpenClaw？">
    Windows 有**两种安装模式**：

    **1）WSL2（推荐）：** Gateway 网关运行在 Linux 内部。

    打开 PowerShell，进入 WSL，然后重启：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你从未安装过服务，请在前台启动它：

    ```bash
    openclaw gateway run
    ```

    **2）原生 Windows（不推荐）：** Gateway 网关直接运行在 Windows 中。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你是手动运行它（无服务），请使用：

    ```powershell
    openclaw gateway run
    ```

    文档： [Windows（WSL2）](/zh-CN/platforms/windows)、[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="Gateway 网关已启动，但回复始终没有到达。我应该检查什么？">
    先进行一次快速健康检查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - 模型认证没有加载到**Gateway 网关主机**上（检查 `models status`）。
    - 渠道配对/允许列表阻止了回复（检查渠道配置 + 日志）。
    - WebChat/Dashboard 在没有正确 token 的情况下打开。

    如果你处于远程环境，请确认隧道/Tailscale 连接正常，并且
    Gateway WebSocket 可达。

    文档： [Channels](/zh-CN/channels)、[故障排除](/zh-CN/gateway/troubleshooting)、[Remote access](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title='“Disconnected from gateway: no reason”——现在怎么办？'>
    这通常表示 UI 丢失了 WebSocket 连接。请检查：

    1. Gateway 网关正在运行吗？`openclaw gateway status`
    2. Gateway 网关健康吗？`openclaw status`
    3. UI 是否有正确的 token？`openclaw dashboard`
    4. 如果是远程环境，隧道/Tailscale 链接是否正常？

    然后查看日志尾部：

    ```bash
    openclaw logs --follow
    ```

    文档： [Dashboard](/zh-CN/web/dashboard)、[Remote access](/zh-CN/gateway/remote)、[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败了。我应该检查什么？">
    先查看日志和渠道状态：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后对照错误信息：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单中的条目过多。OpenClaw 已经会裁剪到 Telegram 限制并用更少命令重试，但有些菜单条目仍需要移除。请减少 plugin/skill/自定义命令，或者如果你不需要菜单，可禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你在 VPS 上或位于代理后面，请确认允许出站 HTTPS，并且对 `api.telegram.org` 的 DNS 解析正常。

    如果 Gateway 网关是远程的，请确保你查看的是 Gateway 网关主机上的日志。

    文档： [Telegram](/zh-CN/channels/telegram)、[渠道故障排除](/zh-CN/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有显示输出。我应该检查什么？">
    先确认 Gateway 网关可达，并且智能体可以运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你希望在聊天
    渠道中收到回复，请确保已启用投递（`/deliver on`）。

    文档： [TUI](/zh-CN/web/tui)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何彻底停止再启动 Gateway 网关？">
    如果你已安装服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这会停止/启动**受监管的服务**（macOS 上是 launchd，Linux 上是 systemd）。
    当 Gateway 网关作为后台守护进程运行时，请使用此方法。

    如果你是在前台运行，使用 Ctrl-C 停止，然后执行：

    ```bash
    openclaw gateway run
    ```

    文档： [Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 和 openclaw gateway 有什么区别？">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在当前终端会话中**前台**运行 gateway。

    如果你安装了服务，请使用 gateway 命令。若你
    想要一次性的前台运行，请使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="当某个操作失败时，最快获得更多细节的方法">
    使用 `--verbose` 启动 Gateway 网关，以获取更多控制台细节。然后检查日志文件中的渠道认证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体与附件

<AccordionGroup>
  <Accordion title="我的 skill 生成了图片/PDF，但没有发送任何内容">
    智能体发出的附件必须包含一行 `MEDIA:<path-or-url>`（单独占一行）。请参阅 [OpenClaw 助手设置](/zh-CN/start/openclaw) 和 [Agent send](/zh-CN/tools/agent-send)。

    CLI 发送：

    ```bash
    openclaw message send --target +15555550123 --message "给你" --media /path/to/file.png
    ```

    还需要检查：

    - 目标渠道支持出站媒体，并且没有被允许列表阻止。
    - 文件在 provider 的大小限制范围内（图片会调整到最大 2048 px）。
    - `tools.fs.workspaceOnly=true` 会将本地路径发送限制在工作区、temp/media-store 和经过沙箱校验的文件内。
    - `tools.fs.workspaceOnly=false` 允许 `MEDIA:` 发送智能体已可读取的主机本地文件，但仅限媒体和安全文档类型（图片、音频、视频、PDF 以及 Office 文档）。纯文本和类似 secret 的文件仍会被阻止。

    请参阅 [Images](/zh-CN/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全与访问控制

<AccordionGroup>
  <Accordion title="将 OpenClaw 暴露给入站私信是否安全？">
    请将入站私信视为不受信任输入。默认设置旨在降低风险：

    - 具备私信能力的渠道默认行为是**配对**：
      - 未知发送者会收到一个配对码；机器人不会处理他们的消息。
      - 使用以下命令批准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求每个渠道最多 **3 个**；如果代码未收到，请检查 `openclaw pairing list --channel <channel> [--account <id>]`
    - 公开开放私信需要显式选择加入（`dmPolicy: "open"` 和允许列表 `"*"`）。

    运行 `openclaw doctor` 以发现有风险的私信策略。

  </Accordion>

  <Accordion title="Prompt injection 只对公共机器人构成威胁吗？">
    不是。Prompt injection 关乎的是**不受信任的内容**，而不仅仅是谁可以给机器人发私信。
    如果你的助手会读取外部内容（Web 搜索/抓取、浏览器页面、邮件、
    文档、附件、粘贴的日志），这些内容都可能包含试图
    劫持模型的指令。即使**只有你自己是发送者**，这也可能发生。

    最大风险出现在启用了工具时：模型可能被诱导
    泄露上下文或代表你调用工具。降低影响范围的方法包括：

    - 使用只读或禁用工具的“reader”智能体来总结不受信任内容
    - 对启用工具的智能体关闭 `web_search` / `web_fetch` / `browser`
    - 同样将解码后的文件/文档文本视为不受信任：OpenResponses
      `input_file` 和媒体附件提取都会将提取出的文本包装在
      明确的外部内容边界标记中，而不是直接传递原始文件文本
    - 使用沙箱隔离和严格的工具允许列表

    详情： [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我的机器人是否应该有自己的邮箱、GitHub 账号或手机号？">
    对大多数配置来说，是的。使用独立账号和手机号来隔离机器人，
    可以在出问题时缩小影响范围。这也更容易轮换
    凭证或撤销访问，而不会影响你的个人账号。

    从小规模开始。只授予它你实际需要的工具和账号访问权限，并在
    以后确有需要时再逐步扩展。

    文档： [Security](/zh-CN/gateway/security)、[Pairing](/zh-CN/channels/pairing)。

  </Accordion>

  <Accordion title="我可以让它自主处理我的短信吗？这样安全吗？">
    我们**不**建议让它完全自主处理你的个人消息。最安全的模式是：

    - 将私信保持在**配对模式**或严格的允许列表模式。
    - 如果你希望它代表你发送消息，请使用**单独的号码或账号**。
    - 让它先起草，然后在发送前**由你审批**。

    如果你想尝试，请在专用账号上进行，并保持隔离。请参阅
    [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我可以为个人助理任务使用更便宜的模型吗？">
    可以，**前提是**该智能体只用于聊天，且输入是可信的。较小档位的模型
    更容易受到指令劫持，因此不要将它们用于启用工具的智能体，
    或用于读取不受信任内容的场景。如果你必须使用较小模型，请锁定
    工具，并在沙箱中运行。请参阅 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中运行了 /start，但没有收到配对码">
    只有当未知发送者给机器人发消息，并且
    `dmPolicy: "pairing"` 已启用时，才会发送配对码。单独发送 `/start` 不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即获得访问权限，请将你的发送者 ID 加入允许列表，或为该账号设置 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会给我的联系人发消息吗？配对是如何工作的？">
    不会。WhatsApp 默认的私信策略是**配对**。未知发送者只会收到一个配对码，而且他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或你显式触发的发送。

    使用以下命令批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导中的手机号提示：它用于设置你的**允许列表/owner**，以便允许你自己的私信。它不会用于自动发送。如果你是在自己的个人 WhatsApp 号码上运行，请使用该号码并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任务与“它停不下来”

<AccordionGroup>
  <Accordion title="如何阻止内部系统消息显示在聊天中？">
    大多数内部或工具消息仅会在该会话启用了 **verbose**、**trace** 或 **reasoning**
    时显示。

    在出现该问题的聊天中执行修复：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，请检查 Control UI 中的会话设置，并将 verbose
    设为 **inherit**。同时确认你没有使用在配置中将 `verboseDefault` 设为
    `on` 的机器人 profile。

    文档： [Thinking and verbose](/zh-CN/tools/thinking)、[Security](/zh-CN/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在运行的任务？">
    将以下任一内容**作为独立消息发送**（不要带斜杠）：

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    这些都是中止触发词（不是 slash 命令）。

    对于后台进程（来自 exec 工具），你可以让智能体运行：

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands 概览：请参阅 [Slash commands](/zh-CN/tools/slash-commands)。

    大多数命令都必须作为**以 `/` 开头的独立消息**发送，但少数快捷方式（如 `/status`）对加入允许列表的发送者也可在内联消息中使用。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（“Cross-context messaging denied”）'>
    OpenClaw 默认会阻止**跨 provider** 消息发送。如果某个工具调用绑定到了
    Telegram，它就不会发送到 Discord，除非你显式允许。

    为该智能体启用跨 provider 消息发送：

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    编辑配置后重启 gateway。

  </Accordion>

  <Accordion title='为什么机器人看起来会“忽略”接连快速发送的消息？'>
    队列模式控制新消息如何与正在进行中的运行交互。使用 `/queue` 更改模式：

    - `steer` - 新消息重定向当前任务
    - `followup` - 按顺序逐条处理消息
    - `collect` - 批量收集消息并统一回复一次（默认）
    - `steer-backlog` - 先重定向当前任务，再处理积压消息
    - `interrupt` - 中止当前运行并重新开始

    你可以为 followup 模式添加选项，如 `debounce:2s cap:25 drop:summarize`。

  </Accordion>
</AccordionGroup>

## 杂项

<AccordionGroup>
  <Accordion title='使用 API 密钥时，Anthropic 的默认模型是什么？'>
    在 OpenClaw 中，凭证与模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在认证配置中存储 Anthropic API 密钥）会启用认证，但实际的默认模型取决于你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 网关无法在正在运行的智能体对应的预期 `auth-profiles.json` 中找到 Anthropic 凭证。
  </Accordion>
</AccordionGroup>

---

仍然卡住？请到 [Discord](https://discord.com/invite/clawd) 提问，或发起一个 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)。

## 相关内容

- [首次运行 FAQ](/zh-CN/help/faq-first-run) — 安装、新手引导、认证、订阅、早期故障
- [Models FAQ](/zh-CN/help/faq-models) — 模型选择、故障切换、认证配置
- [故障排除](/zh-CN/help/troubleshooting) — 按症状优先的初步排查
