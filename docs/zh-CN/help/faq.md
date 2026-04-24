---
read_when:
    - 回答常见的设置、安装、新手引导或运行时支持问题
    - 在进行更深入调试之前，对用户报告的问题进行初步排查
summary: 有关 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-04-24T03:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85dccdcbba0a3bfc8bd69396db7192a84e4b4f9aa4917623988fd47116269179
    source_path: help/faq.md
    workflow: 15
---

快速回答加上更深入的故障排除，适用于真实世界的设置场景（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障转移）。有关运行时诊断，请参阅 [故障排除](/zh-CN/gateway/troubleshooting)。有关完整配置参考，请参阅 [配置](/zh-CN/gateway/configuration)。

## 如果出了问题，先看最初的六十秒

1. **快速状态（第一步检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：操作系统 + 更新、gateway/服务可达性、智能体/会话、提供商配置 + 运行时问题（当 gateway 可达时）。

2. **可粘贴的报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，包含日志尾部（token 已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用的是哪个配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 gateway 健康探测，包括支持时的渠道探测  
   （需要可达的 gateway）。请参阅 [Health](/zh-CN/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，则回退为：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志是分开的；请参阅 [Logging](/zh-CN/logging) 和 [故障排除](/zh-CN/gateway/troubleshooting)。

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

   向正在运行的 gateway 请求完整快照（仅 WS）。请参阅 [Health](/zh-CN/gateway/health)。

## 快速开始和首次运行设置

首次运行设置问答——安装、新手引导、认证路径、订阅、初始失败——已移到专门页面：  
[FAQ — 快速开始和首次运行设置](/zh-CN/help/faq-first-run)。

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段话说明 OpenClaw 是什么？">
    OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它会在你已经使用的消息界面上回复你（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及诸如 QQ Bot 这样的内置渠道插件），并且在受支持的平台上还可以提供语音 + 实时 Canvas。**Gateway 网关** 是始终在线的控制平面；助手本身才是产品。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不是“只是一个 Claude 包装器”。它是一个**本地优先的控制平面**，让你可以在**自己的硬件**上运行一个强大的助手，并通过你已经在使用的聊天应用访问它，同时拥有有状态会话、记忆和工具——而不必把你的工作流控制权交给托管式 SaaS。

    亮点：

    - **你的设备，你的数据：** 你可以在任何你想要的地方运行 Gateway 网关（Mac、Linux、VPS），并让工作区 + 会话历史保留在本地。
    - **真实渠道，而不是网页沙箱：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，以及在受支持平台上的移动语音和 Canvas。
    - **模型无关：** 可使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由和故障转移。
    - **纯本地选项：** 运行本地模型，这样**所有数据都可以保留在你的设备上**，如果你愿意的话。
    - **多智能体路由：** 按渠道、账号或任务拆分不同智能体，每个都有自己的工作区和默认设置。
    - **开源且可改造：** 可检查、扩展并自托管，而不受厂商锁定。

    文档：[Gateway 网关](/zh-CN/gateway)、[Channels](/zh-CN/channels)、[Multi-agent](/zh-CN/concepts/multi-agent)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚完成设置——接下来先做什么？">
    很好的起步项目包括：

    - 搭建一个网站（WordPress、Shopify 或简单静态站点）。
    - 制作一个移动应用原型（大纲、界面、API 方案）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail 并自动生成摘要或跟进事项。

    它可以处理大型任务，但当你把任务拆分成多个阶段，并使用子智能体并行工作时，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常使用场景是什么？">
    日常最有价值的场景通常包括：

    - **个人简报：** 汇总你关心的收件箱、日历和新闻。
    - **研究与起草：** 快速研究、生成摘要，以及为邮件或文档生成初稿。
    - **提醒与跟进：** 由 cron 或 heartbeat 驱动的提示和检查清单。
    - **浏览器自动化：** 填表、收集数据、重复执行网页任务。
    - **跨设备协作：** 从手机发送一个任务，让 Gateway 网关在服务器上执行，然后把结果返回到聊天里。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做获客、外联、广告和博客吗？">
    可以用于**研究、筛选和起草**。它可以扫描网站、建立候选清单、总结潜在客户信息，并撰写外联或广告文案草稿。

    对于**外联或广告投放**，请让人工参与审核。避免垃圾信息，遵守当地法律和平台政策，并在发送前审查所有内容。最安全的模式是让 OpenClaw 起草，由你批准。

    文档：[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比，它在 Web 开发方面有什么优势？">
    OpenClaw 是一个**个人助手**和协作层，而不是 IDE 替代品。在仓库内的最快直接编码循环场景下，请使用 Claude Code 或 Codex。当你需要持久记忆、跨设备访问和工具编排时，请使用 OpenClaw。

    优势：

    - **持久记忆 + 工作区**，可跨会话使用
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway 网关**（可运行在 VPS 上，随时随地交互）
    - 用于本地浏览器/屏幕/摄像头/exec 的 **Nodes**

    展示页：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何在不弄脏仓库的情况下自定义 skills？">
    使用托管覆盖，而不是直接编辑仓库副本。将你的更改放到 `~/.openclaw/skills/<name>/SKILL.md` 中（或者通过 `~/.openclaw/openclaw.json` 里的 `skills.load.extraDirs` 添加一个文件夹）。优先级顺序为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此托管覆盖仍然会优先于内置 skills，而无需改动 git。如果你需要全局安装某个 skill，但只希望部分智能体可见，请将共享副本保留在 `~/.openclaw/skills` 中，并通过 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有值得上游合并的修改才应该放在仓库中并通过 PR 提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。如果某个 skill 只应对特定智能体可见，请同时结合 `agents.defaults.skills` 或 `agents.list[].skills` 使用。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    当前支持的模式包括：

    - **Cron jobs**：隔离作业可以为每个作业设置 `model` 覆盖。
    - **子智能体**：将任务路由到使用不同默认模型的独立智能体。
    - **按需切换**：使用 `/model` 可随时切换当前会话模型。

    请参阅 [Cron jobs](/zh-CN/automation/cron-jobs)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行重任务时会卡住。如何把这些工作卸载出去？">
    对于长时间运行或并行任务，请使用**子智能体**。子智能体在自己的会话中运行，返回摘要，并保持你的主聊天保持响应。

    你可以让机器人“为这个任务生成一个子智能体”，或者使用 `/subagents`。  
    使用聊天中的 `/status` 查看 Gateway 网关当前在做什么（以及它是否正忙）。

    token 提示：长任务和子智能体都会消耗 token。如果你关心成本，可通过 `agents.defaults.subagents.model` 为子智能体设置更便宜的模型。

    文档：[Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上绑定到线程的子智能体会话是如何工作的？">
    使用线程绑定。你可以将 Discord 线程绑定到某个子智能体或会话目标，这样该线程中的后续消息就会继续停留在该已绑定会话上。

    基本流程：

    - 使用 `sessions_spawn` 并设置 `thread: true` 生成（也可以选择 `mode: "session"` 以便持久跟进）。
    - 或者手动使用 `/focus <target>` 进行绑定。
    - 使用 `/agents` 查看绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - 使用 `/unfocus` 解除线程绑定。

    所需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档：[Sub-agents](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[Configuration Reference](/zh-CN/gateway/configuration-reference)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="子智能体已经完成了，但完成更新发到了错误的位置，或者根本没有发出来。我该检查什么？">
    先检查已解析的请求者路由：

    - 当存在已绑定线程或会话路由时，完成模式的子智能体发送会优先使用它们。
    - 如果完成来源只携带渠道信息，OpenClaw 会回退到请求者会话存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），这样直接发送仍有可能成功。
    - 如果既没有已绑定路由，也没有可用的已存储路由，则直接发送可能失败，结果会回退到排队的会话发送，而不是立即发到聊天中。
    - 无效或过期的目标仍可能导致回退到队列发送或最终发送失败。
    - 如果子任务最后一条可见 assistant 回复恰好是静默 token `NO_REPLY` / `no_reply`，或恰好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制公告，而不是发布陈旧的早前进度。
    - 如果子任务仅在工具调用后超时，则公告可能会将其折叠为一条简短的部分进度摘要，而不是回放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)、[Session Tools](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我该检查什么？">
    Cron 运行在 Gateway 网关进程内部。如果 Gateway 网关没有持续运行，
    定时作业就不会执行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`），且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否 24/7 持续运行（没有休眠/重启）。
    - 验证作业的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 已触发，但没有发送任何内容到渠道。为什么？">
    先检查发送模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不应有 runner 回退发送。
    - 缺失或无效的公告目标（`channel` / `to`）意味着 runner 跳过了出站发送。
    - 渠道认证失败（`unauthorized`、`Forbidden`）表示 runner 尝试发送了，但被凭证阻止。
    - 静默的隔离结果（只有 `NO_REPLY` / `no_reply`）会被视为有意不发送，因此 runner 也会抑制排队回退发送。

    对于隔离的 cron 作业，只要聊天路由可用，智能体仍然可以通过 `message`
    工具直接发送。`--announce` 只控制 runner 的回退路径，用于发送智能体尚未直接发送的最终文本。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么某个隔离的 cron 运行切换了模型，或者重试了一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离的 cron 可以在活动运行抛出 `LiveSessionModelSwitchError` 时，持久化运行时模型切换并重试。重试会保留切换后的提供商/模型；如果切换还携带了新的认证配置文件覆盖，cron 也会在重试前将其持久化。

    相关选择规则：

    - 如果适用，Gmail hook 模型覆盖优先级最高。
    - 然后是每作业的 `model`。
    - 然后是任何已存储的 cron 会话模型覆盖。
    - 最后是正常的智能体/默认模型选择。

    重试循环是有边界的。在初次尝试加 2 次切换重试之后，
    cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[cron CLI](/zh-CN/cli/cron)。

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

    原生 `openclaw skills install` 会写入当前活动工作区的 `skills/`
    目录。只有在你想发布或同步自己的 Skills 时，才需要单独安装 `clawhub` CLI。对于跨智能体共享安装，请将 skill 放在
    `~/.openclaw/skills` 下，并在你想限制哪些智能体可见时使用 `agents.defaults.skills` 或
    `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划运行任务，或持续在后台运行吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron jobs**：用于定时或周期性任务（重启后仍会保留）。
    - **Heartbeat**：用于“主会话”的周期性检查。
    - **隔离作业**：用于会发布摘要或发送到聊天的自治智能体。

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以在 Linux 上运行 Apple 的仅 macOS Skills 吗？">
    不能直接运行。macOS Skills 受 `metadata.openclaw.os` 和所需二进制文件控制，且只有当这些 Skills 在 **Gateway 网关宿主机** 上符合条件时，才会出现在 system prompt 中。在 Linux 上，`darwin` 专用的 Skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖该门控。

    你有三种受支持的模式：

    **方案 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在存在 macOS 二进制文件的地方运行 Gateway 网关，然后通过[远程模式](#gateway-ports-already-running-and-remote-mode)或 Tailscale 从 Linux 连接。由于 Gateway 网关宿主机是 macOS，这些 Skills 会正常加载。

    **方案 B - 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并将 **Node Run Commands** 设置为“Always Ask”或“Always Allow”。当节点上存在所需二进制文件时，OpenClaw 可以将仅 macOS 的 Skills 视为符合条件。智能体会通过 `nodes` 工具运行这些 Skills。如果你选择“Always Ask”，在提示中批准“Always Allow”会将该命令加入允许列表。

    **方案 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    保持 Gateway 网关运行在 Linux 上，但让所需的 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。然后覆盖该 skill 以允许 Linux，这样它就会保持符合条件。

    1. 为该二进制文件创建一个 SSH 包装器（示例：用于 Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将该包装器放到 Linux 宿主机的 `PATH` 上（例如 `~/bin/memo`）。
    3. 覆盖 skill 元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: 通过 macOS 上的 memo CLI 管理 Apple Notes。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动一个新会话，以便刷新 Skills 快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    可选方案：

    - **自定义 skill / plugin**：最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化**：无需写代码即可工作，但更慢，也更脆弱。

    如果你想为每个客户保留上下文（代理机构工作流），一个简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 当前工作）。
    - 让智能体在会话开始时获取该页面。

    如果你想要原生集成，请提交功能请求，或构建一个针对这些 API 的 skill。

    安装 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会落在当前活动工作区的 `skills/` 目录中。对于跨智能体共享的 Skills，请将它们放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只希望部分智能体看到某个共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。某些 Skills 预期通过 Homebrew 安装二进制文件；在 Linux 上这意味着 Linuxbrew（见上面的 Homebrew Linux FAQ 条目）。请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何让 OpenClaw 使用我当前已登录的 Chrome？">
    使用内置的 `user` 浏览器配置文件，它通过 Chrome DevTools MCP 进行连接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，请创建一个显式 MCP 配置文件：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    这种方式可以使用本地主机浏览器，也可以使用已连接的浏览器节点。如果 Gateway 网关运行在其他地方，请在浏览器所在机器上运行一个节点宿主机，或改用远程 CDP。

    当前 `existing-session` / `user` 的限制：

    - 操作是基于 ref 驱动的，而不是基于 CSS selector
    - 上传需要 `ref` / `inputRef`，并且当前一次只支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍然需要托管浏览器或原始 CDP 配置文件

  </Accordion>
</AccordionGroup>

## 沙箱隔离和内存

<AccordionGroup>
  <Accordion title="有单独的沙箱隔离文档吗？">
    有。请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。有关 Docker 专用设置（在 Docker 中运行完整 gateway 或沙箱镜像），请参阅 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉功能受限——如何启用完整功能？">
    默认镜像以安全优先方式运行，并使用 `node` 用户，因此它不
    包含系统包、Homebrew 或内置浏览器。若要获得更完整的设置：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，让缓存得以保留。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH`，并确保该路径会被持久化。

    文档：[Docker](/zh-CN/install/docker)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以让私信保持私人，但让群组公开/沙箱隔离，并只使用一个智能体吗？">
    可以——前提是你的私有流量是**私信**，公开流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/渠道会话（非主键）会在已配置的沙箱后端中运行，而主私信会话仍保留在宿主机上。如果你不选择后端，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置演练 + 示例配置：[Groups：私有私信 + 公开群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway 网关配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何将宿主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局和每智能体绑定会合并；当 `scope: "shared"` 时，每智能体绑定会被忽略。对任何敏感内容请使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会根据标准化路径以及通过最深已存在祖先解析得到的规范路径来验证绑定源。这意味着即使最后一个路径段尚不存在，经由符号链接父路径逃逸的情况仍会以失败关闭；并且在符号链接解析后，允许根路径检查仍然适用。

    示例和安全说明请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts) 和 [沙箱 vs 工具策略 vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="内存是如何工作的？">
    OpenClaw 的内存其实就是智能体工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日日志
    - `MEMORY.md` 中整理过的长期笔记（仅主/私有会话）

    OpenClaw 还会运行一次**静默的压缩前内存刷新**，以提醒模型
    在自动压缩前写入持久笔记。这仅在工作区可写时运行
    （只读沙箱会跳过）。请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="内存总是忘东西。怎样才能让它记住？">
    告诉机器人**把这个事实写入内存**。长期笔记应写入 `MEMORY.md`，
    短期上下文应写入 `memory/YYYY-MM-DD.md`。

    这仍然是我们正在持续改进的领域。提醒模型存储记忆会有帮助；
    它会知道该怎么做。如果它还是不断遗忘，请确认 Gateway 网关每次运行都在使用相同的
    工作区。

    文档：[Memory](/zh-CN/concepts/memory)、[Agent workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="内存会永久保存吗？它的限制是什么？">
    内存文件存储在磁盘上，除非你删除，否则会一直保留。限制来自你的
    存储空间，而不是模型。**会话上下文** 仍然受模型上下文窗口
    限制，因此长对话可能会被压缩或截断。这就是为什么
    需要内存搜索——它只会把相关部分拉回上下文中。

    文档：[Memory](/zh-CN/concepts/memory)、[Context](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义内存搜索需要 OpenAI API key 吗？">
    只有在你使用 **OpenAI embeddings** 时才需要。Codex OAuth 只覆盖 chat/completions，
    **不**授予 embeddings 访问权限，因此**使用 Codex 登录（OAuth 或
    Codex CLI 登录）** 对语义内存搜索没有帮助。OpenAI embeddings
    仍然需要真实的 API key（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置 provider，OpenClaw 会在
    能解析到 API key 时自动选择一个 provider（auth profiles、`models.providers.*.apiKey` 或环境变量）。
    如果能解析到 OpenAI key，它会优先选择 OpenAI；否则如果能解析到 Gemini key，
    就选择 Gemini；然后是 Voyage；再然后是 Mistral。如果没有可用的远程 key，
    内存搜索会保持禁用，直到你完成配置。如果你已配置并存在本地模型路径，OpenClaw
    会优先选择 `local`。当你显式设置
    `memorySearch.provider = "ollama"` 时，也支持 Ollama。

    如果你希望保持本地运行，可设置 `memorySearch.provider = "local"`（并可选设置
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embedding
    模型——具体设置细节请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 磁盘上的内容位置

<AccordionGroup>
  <Accordion title="OpenClaw 使用的所有数据都会保存在本地吗？">
    不会——**OpenClaw 的状态保存在本地**，但**外部服务仍然会看到你发送给它们的内容**。

    - **默认本地：** 会话、内存文件、配置和工作区都位于 Gateway 网关宿主机上
      （`~/.openclaw` + 你的工作区目录）。
    - **因需求而远程：** 你发送给模型提供商（Anthropic/OpenAI 等）的消息会发送到
      它们的 API，而聊天平台（WhatsApp/Telegram/Slack 等）会在它们自己的
      服务器上存储消息数据。
    - **足迹由你控制：** 使用本地模型可以让 prompt 保留在你的机器上，但渠道
      流量仍然会经过对应渠道的服务器。

    相关内容：[Agent workspace](/zh-CN/concepts/agent-workspace)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 把数据存在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径 | 用途 |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json` | 主配置（JSON5） |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json` | 旧版 OAuth 导入（首次使用时复制到 auth profiles） |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys，以及可选的 `keyRef`/`tokenRef`） |
    | `$OPENCLAW_STATE_DIR/secrets.json` | 用于 `file` SecretRef 提供商的可选文件后备 secret 负载 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json` | 旧版兼容文件（静态 `api_key` 条目已清理） |
    | `$OPENCLAW_STATE_DIR/credentials/` | 提供商状态（例如 `whatsapp/<accountId>/creds.json`） |
    | `$OPENCLAW_STATE_DIR/agents/` | 每智能体状态（agentDir + sessions） |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` | 对话历史和状态（每智能体） |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json` | 会话元数据（每智能体） |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、内存文件、Skills 等）是独立的，并通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于**智能体工作区**中，而不是 `~/.openclaw`。

    - **工作区（每智能体）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。
      小写根级 `memory.md` 仅作为旧版修复输入；当两个文件都存在时，`openclaw doctor --fix`
      可以将其合并到 `MEMORY.md` 中。
    - **状态目录（`~/.openclaw`）**：配置、渠道/提供商状态、auth profiles、sessions、logs，
      以及共享 Skills（`~/.openclaw/skills`）。

    默认工作区是 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“忘事了”，请确认 Gateway 网关在每次启动时都使用同一个
    工作区（并记住：远程模式使用的是**gateway 宿主机**的工作区，
    不是你的本地笔记本）。

    提示：如果你希望某种行为或偏好是持久的，请让机器人**把它写入
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    请参阅 [Agent workspace](/zh-CN/concepts/agent-workspace) 和 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的**智能体工作区**放入一个**私有** git 仓库中，并备份到某个
    私有位置（例如 GitHub 私有仓库）。这样可以捕获内存 + AGENTS/SOUL/USER
    文件，并让你之后能够恢复助手的“心智”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、token 或加密的 secrets 负载）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （见上面的迁移问题）。

    文档：[Agent workspace](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何彻底卸载 OpenClaw？">
    请参阅专门指南：[Uninstall](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是默认的 **cwd** 和内存锚点，而不是硬性沙箱。
    相对路径会在工作区内解析，但绝对路径可以访问宿主机上的其他
    位置，除非启用了沙箱隔离。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每智能体沙箱设置。如果你
    希望某个仓库成为默认工作目录，请将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库本身只是源代码；除非你明确希望智能体在其中工作，否则应将
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

  <Accordion title="远程模式：session store 在哪里？">
    会话状态归**gateway 宿主机**所有。如果你使用的是远程模式，你关心的 session store 在远程机器上，而不是你的本地笔记本。请参阅 [Session management](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？它在哪里？">
    OpenClaw 会从 `$OPENCLAW_CONFIG_PATH` 读取可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果文件不存在，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何监听 / UI 提示 unauthorized'>
    非 loopback 绑定**需要有效的 gateway 认证路径**。实际中这意味着：

    - shared-secret 认证：token 或 password
    - `gateway.auth.mode: "trusted-proxy"`，并位于已正确配置的非 loopback 身份感知反向代理之后

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
    - 只有在 `gateway.auth.*` 未设置时，本地调用路径才可以将 `gateway.remote.*` 用作回退。
    - 对于 password 认证，请改为设置 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但无法解析，解析会以失败关闭（不会用远程回退进行掩盖）。
    - 使用 shared-secret 的 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（保存在 app/UI 设置中）。像 Tailscale Serve 或 `trusted-proxy` 这样的携带身份模式则改用请求头。避免将 shared secret 放入 URL。
    - 当使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机 loopback 反向代理仍然**不**满足 trusted-proxy 认证要求。trusted proxy 必须是已配置的非 loopback 来源。

  </Accordion>

  <Accordion title="为什么现在在 localhost 上也需要 token？">
    OpenClaw 默认强制启用 gateway 认证，包括 loopback。在正常的默认路径中，这意味着 token 认证：如果没有显式配置认证路径，gateway 启动时会解析为 token 模式并自动生成一个 token，保存到 `gateway.auth.token`，因此**本地 WS 客户端也必须进行认证**。这样可以阻止其他本地进程调用 Gateway 网关。

    如果你更希望使用其他认证路径，可以显式选择 password 模式（或者，对于非 loopback 的身份感知反向代理，使用 `trusted-proxy`）。如果你**确实**想要开放的 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 随时都可以为你生成 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="修改配置后必须重启吗？">
    Gateway 网关会监视配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：安全更改热应用，关键更改则重启
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

    - `off`：隐藏标语文本，但保留 banner 标题/版本行。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：轮换的搞笑/季节性标语（默认行为）。
    - 如果你想完全不显示 banner，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（以及 Web 抓取）？">
    `web_fetch` 无需 API key 即可工作。`web_search` 取决于你选择的
    provider：

    - 依赖 API 的提供商，如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily，需要按各自常规方式配置 API key。
    - Ollama Web 搜索 不需要 key，但它使用你配置的 Ollama host，并要求执行 `ollama signin`。
    - DuckDuckGo 不需要 key，但它是一个非官方、基于 HTML 的集成。
    - SearXNG 不需要 key/可自托管；请配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：** 运行 `openclaw configure --section web` 并选择一个 provider。
    可选环境变量：

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
              provider: "firecrawl", // 可选；省略时自动检测
            },
          },
        },
    }
    ```

    特定 provider 的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。  
    旧版 `tools.web.search.*` provider 路径目前仍会临时加载以保持兼容，但不应再用于新配置。  
    Firecrawl Web 抓取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用允许列表，请添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭证中自动检测第一个可用的抓取回退 provider。目前内置 provider 是 Firecrawl。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web tools](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 把我的配置清空了。我该如何恢复并避免再次发生？">
    `config.apply` 会替换**整个配置**。如果你发送的是部分对象，其他所有内容
    都会被移除。

    当前 OpenClaw 会保护许多意外覆盖场景：

    - OpenClaw 自有配置写入会在写入前验证变更后的完整配置。
    - 无效或具有破坏性的 OpenClaw 自有写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑导致启动或热重载失败，Gateway 网关会恢复最后一次已知正常配置，并将被拒绝的文件保存为 `openclaw.json.clobbered.*`。
    - 恢复后，主智能体会收到启动警告，以避免再次盲目写入错误配置。

    恢复方法：

    - 检查 `openclaw logs --follow` 中是否有 `Config auto-restored from last-known-good`、`Config write rejected:` 或 `config reload restored last-known-good config`。
    - 检查活动配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 如果恢复后的活动配置可正常工作，就保留它，然后仅使用 `openclaw config set` 或 `config.patch` 将你原本想改的键复制回去。
    - 运行 `openclaw config validate` 和 `openclaw doctor`。
    - 如果没有最后一次已知正常配置或被拒绝的负载，请从备份恢复，或者重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这是意料之外的行为，请提交 bug，并附上你最后已知的配置或任何备份。
    - 本地编码智能体通常可以根据日志或历史记录重建一个可用配置。

    避免方法：

    - 对小改动使用 `openclaw config set`。
    - 对交互式编辑使用 `openclaw configure`。
    - 当你不确定确切路径或字段形状时，先使用 `config.schema.lookup`；它会返回一个浅层 schema 节点及其直接子节点摘要，便于逐层查看。
    - 对部分 RPC 编辑使用 `config.patch`；只有在确实要整体替换配置时才使用 `config.apply`。
    - 如果你在智能体运行中使用仅限所有者的 `gateway` 工具，它仍会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会标准化为相同受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[配置](/zh-CN/cli/config)、[Configure](/zh-CN/cli/configure)、[Gateway 故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何在多设备之间运行一个中心 Gateway 网关，并配合专用工作节点？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）配合 **nodes** 和 **agents**：

    - **Gateway 网关（中心）：** 负责渠道（Signal/WhatsApp）、路由和会话。
    - **Nodes（设备）：** Mac/iOS/Android 作为外围设备连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **Agents（工作节点）：** 针对特殊职责的独立“大脑”/工作区（例如“Hetzner 运维”“个人数据”）。
    - **子智能体：** 当你需要并行处理时，从主智能体中生成后台工作。
    - **TUI：** 连接到 Gateway 网关并切换智能体/会话。

    文档：[Nodes](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[TUI](/zh-CN/web/tui)。

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

    默认值是 `false`（有头模式）。无头模式在某些网站上更容易触发反机器人检查。请参阅 [Browser](/zh-CN/tools/browser)。

    无头模式使用**相同的 Chromium 引擎**，适用于大多数自动化场景（表单、点击、抓取、登录）。主要区别：

    - 没有可见的浏览器窗口（如果你需要视觉内容，请使用截图）。
    - 某些网站对无头模式下的自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 经常会阻止无头会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制路径（或任意基于 Chromium 的浏览器），然后重启 Gateway 网关。  
    完整配置示例请参阅 [Browser](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、gateway 和节点之间传播？">
    Telegram 消息由 **gateway** 处理。gateway 运行智能体，
    只有在需要节点工具时才会通过 **Gateway WebSocket**
    调用节点：

    Telegram → Gateway → 智能体 → `node.*` → 节点 → Gateway → Telegram

    节点看不到入站 provider 流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程位置，我的智能体如何访问我的电脑？">
    简短回答：**将你的电脑配对为一个节点**。Gateway 网关运行在别处，但它可以
    通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、system）。

    典型设置：

    1. 在始终在线的主机上运行 Gateway 网关（VPS/家用服务器）。
    2. 将 Gateway 网关宿主机和你的电脑放在同一个 tailnet 中。
    3. 确保 Gateway WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以**通过 SSH 远程连接**模式（或直接 tailnet）
       连接，这样它就可以注册为一个节点。
    5. 在 Gateway 网关上批准该节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP bridge；节点通过 Gateway WebSocket 连接。

    安全提醒：配对 macOS 节点意味着该机器上允许 `system.run`。只
    配对你信任的设备，并查看 [Security](/zh-CN/gateway/security)。

    文档：[Nodes](/zh-CN/nodes)、[Gateway protocol](/zh-CN/gateway/protocol)、[macOS 远程模式](/zh-CN/platforms/mac/remote)、[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到回复。现在怎么办？">
    先检查基础项：

    - Gateway 网关是否正在运行：`openclaw gateway status`
    - Gateway 网关健康状态：`openclaw status`
    - 渠道健康状态：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，请确认 `gateway.auth.allowTailscale` 设置正确。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已启动，并指向正确端口。
    - 确认你的允许列表（私信或群组）包含你的账号。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[Channels](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以。没有内置的“bot-to-bot”桥接，但你可以通过几种
    可靠方式将它们连起来：

    **最简单：** 使用两个机器人都可访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让 Bot A 向 Bot B 发送消息，然后让 Bot B 按正常方式回复。

    **CLI 桥接（通用）：** 运行一个脚本，通过
    `openclaw agent --message ... --deliver` 调用另一个 Gateway 网关，并将目标指向另一个机器人正在监听的聊天。如果其中一个机器人在远程 VPS 上，请将你的 CLI 指向该远程 Gateway 网关，
    可通过 SSH/Tailscale（参见[远程访问](/zh-CN/gateway/remote)）。

    示例模式（在能访问目标 Gateway 网关的机器上运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：添加护栏，避免两个机器人无限循环（仅提及时回应、渠道
    允许列表，或“不要回复机器人消息”规则）。

    文档：[远程访问](/zh-CN/gateway/remote)、[智能体 CLI](/zh-CN/cli/agent)、[智能体发送](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要多个独立 VPS 吗？">
    不需要。一个 Gateway 网关可以托管多个智能体，每个智能体都有自己的工作区、模型默认值
    和路由。这是正常设置，而且比为每个智能体运行
    一个独立 VPS 更便宜也更简单。

    只有在你需要硬隔离（安全边界）或非常
    不同且不想共享的配置时，才使用独立 VPS。否则，请保留一个 Gateway 网关，
    并使用多个智能体或子智能体。

  </Accordion>

  <Accordion title="与其从 VPS 通过 SSH 访问，在我的个人笔记本上使用一个节点有好处吗？">
    有——节点是从远程 Gateway 网关访问你的笔记本的一等方式，而且
    它们带来的不仅仅是 shell 访问。Gateway 网关运行在 macOS/Linux（Windows 通过 WSL2）上，并且
    很轻量（小型 VPS 或 Raspberry Pi 级别的设备就足够；4 GB RAM 就很多了），因此一种常见
    设置是始终在线的主机 + 你的笔记本作为节点。

    - **不需要入站 SSH。** 节点主动连接到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。** `system.run` 在该笔记本上受节点允许列表/审批控制。
    - **更多设备工具。** 除了 `system.run`，节点还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。** 让 Gateway 网关运行在 VPS 上，但通过笔记本上的节点宿主机在本地运行 Chrome，或者通过 Chrome MCP 连接到宿主机上的本地 Chrome。

    SSH 适合临时 shell 访问，但对于持续性的智能体工作流和
    设备自动化，节点更简单。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行一个 gateway 服务吗？">
    不会。除非你有意运行隔离配置文件（参见 [Multiple gateways](/zh-CN/gateway/multiple-gateways)），否则每台主机上只应运行**一个 gateway**。节点是连接到
    gateway 的外围设备（iOS/Android 节点，或菜单栏应用中的 macOS“节点模式”）。对于无头节点
    宿主机和 CLI 控制，请参阅 [Node host CLI](/zh-CN/cli/node)。

    `gateway`、`discovery` 和 `canvasHost` 的更改需要完整重启。

  </Accordion>

  <Accordion title="有没有通过 API / RPC 应用配置的方法？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树，包括其浅层 schema 节点、匹配的 UI 提示和直接子节点摘要
    - `config.get`：获取当前快照 + hash
    - `config.patch`：安全的部分更新（大多数 RPC 编辑推荐使用）；在可能时热重载，在需要时重启
    - `config.apply`：验证并替换整个配置；在可能时热重载，在需要时重启
    - 仅限所有者的 `gateway` 运行时工具仍会拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会标准化为相同的受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这会设置你的工作区，并限制哪些人可以触发机器人。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale，并从我的 Mac 连接？">
    最小步骤：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装并登录**
       - 使用 Tailscale 应用，并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，这样 VPS 就会拥有一个稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你希望无需 SSH 就能使用 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这样会让 gateway 保持绑定到 loopback，并通过 Tailscale 暴露 HTTPS。请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将一个 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露 **Gateway Control UI + WS**。节点通过同一个 Gateway WS 端点进行连接。

    推荐设置：

    1. **确保 VPS 和 Mac 位于同一个 tailnet 中**。
    2. **在远程模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       该应用会为 Gateway 端口建立隧道，并作为一个节点连接。
    3. **在 gateway 上批准该节点**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway protocol](/zh-CN/gateway/protocol)、[Discovery](/zh-CN/gateway/discovery)、[macOS 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装，还是只添加一个节点？">
    如果你只是需要在第二台笔记本上使用**本地工具**（screen/camera/exec），请将它添加为一个
    **节点**。这样可以保持只有一个 Gateway 网关，并避免重复配置。本地节点工具
    当前仅支持 macOS，但我们计划将其扩展到其他操作系统。

    只有当你需要**硬隔离**或两个完全独立的机器人时，才安装第二个 Gateway 网关。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)、[Multiple gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 `.env` 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

    - 当前工作目录中的 `.env`
    - 来自 `~/.openclaw/.env`（即 `$OPENCLAW_STATE_DIR/.env`）的全局回退 `.env`

    两个 `.env` 文件都不会覆盖现有环境变量。

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

  <Accordion title="我是通过服务启动 Gateway 网关的，结果环境变量消失了。怎么办？">
    两种常见修复方式：

    1. 将缺失的键放到 `~/.openclaw/.env` 中，这样即使服务没有继承你的 shell 环境，它们也会被读取。
    2. 启用 shell 导入（选择启用的便捷功能）：

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

    这会运行你的登录 shell，并且只导入缺失的预期键名（绝不覆盖）。对应环境变量：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示 “Shell env: off.”。为什么？'>
    `openclaw models status` 报告的是**shell 环境变量导入**是否启用。“Shell env: off”
    **不**表示你的环境变量缺失——它只是表示 OpenClaw 不会
    自动加载你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。可通过以下方式修复：

    1. 将 token 放到 `~/.openclaw/.env` 中：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将其添加到配置的 `env` 块中（仅在缺失时应用）。

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
  <Accordion title="如何开始一个新的对话？">
    发送 `/new` 或 `/reset` 作为独立消息。请参阅 [Session management](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 之后过期，但这项功能**默认禁用**（默认值为 **0**）。
    将其设置为正值即可启用空闲过期。启用后，在空闲期之后发送的**下一条**
    消息会为该聊天键开启一个新的会话 ID。
    这不会删除转录内容——它只是开始一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法组建一个 OpenClaw 实例团队（一个 CEO 和很多智能体）？">
    有，可以通过**多智能体路由**和**子智能体**实现。你可以创建一个协调型
    智能体，以及若干拥有各自工作区和模型的工作型智能体。

    不过，这更适合作为一个**有趣的实验**。它会消耗很多 token，而且通常
    不如用一个机器人配合不同会话更高效。我们更典型设想的模型是：一个你与之交流的机器人，
    使用不同会话进行并行工作。该机器人也可以在需要时生成子智能体。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[Agents CLI](/zh-CN/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文会在任务中途被截断？我该如何避免？">
    会话上下文受模型上下文窗口限制。长聊天、大量工具输出或很多
    文件都可能触发压缩或截断。

    有帮助的方法：

    - 让机器人总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让机器人重新读取。
    - 对长时间或并行工作使用子智能体，这样主聊天会保持更小。
    - 如果这种情况经常发生，请选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何彻底重置 OpenClaw，但保留安装？">
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

    - 如果新手引导检测到现有配置，也会提供**重置**选项。请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了 profiles（`--profile` / `OPENCLAW_PROFILE`），请分别重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅开发模式；会清除开发配置 + 凭证 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我遇到了 “context too large” 错误——如何重置或压缩？'>
    使用以下任一方式：

    - **压缩**（保留对话，但总结较早轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 来引导总结内容。

    - **重置**（为相同聊天键创建全新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果问题持续发生：

    - 启用或调整**会话修剪**（`agents.defaults.contextPruning`）以裁剪旧工具输出。
    - 使用上下文窗口更大的模型。

    文档：[压缩](/zh-CN/concepts/compaction)、[会话修剪](/zh-CN/concepts/session-pruning)、[Session management](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到 “LLM request rejected: messages.content.tool_use.input field required” 这样的错误？'>
    这是一个 provider 验证错误：模型发出了一个缺少必需
    `input` 的 `tool_use` block。通常这意味着会话历史已过时或损坏（常见于长线程
    或工具/schema 更改之后）。

    修复方式：使用 `/new` 开始一个新会话（独立消息）。

  </Accordion>

  <Accordion title="为什么我每 30 分钟会收到一次 heartbeat 消息？">
    heartbeat 默认每 **30m** 运行一次（使用 OAuth 认证时为 **1h**）。可调整或禁用：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或设为 "0m" 以禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 Markdown
    标题如 `# Heading`），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。
    如果该文件不存在，heartbeat 仍会运行，并由模型决定如何处理。

    每智能体覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把一个“机器人账号”加入 WhatsApp 群组吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以只要你在群里，OpenClaw 就能看到它。
    默认情况下，在你允许发送者之前，群组回复会被阻止（`groupPolicy: "allowlist"`）。

    如果你希望只有**你自己**能够触发群组回复：

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
    方案 1（最快）：跟踪日志，并在群里发送一条测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    方案 2（如果已经配置/加入允许列表）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[Directory](/zh-CN/cli/directory)、[Logs](/zh-CN/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组里不回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @ 提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups`，但没有 `"*"`，而该群组不在允许列表中。

    请参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会和私信共享上下文吗？">
    默认情况下，直聊会折叠到主会话。群组/渠道拥有各自的会话键，而 Telegram 话题 / Discord 线程则是独立会话。请参阅 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制。几十个（甚至几百个）都没问题，但请注意：

    - **磁盘增长：** 会话 + 转录内容位于 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **token 成本：** 更多智能体意味着更多并发模型使用。
    - **运维开销：** 每智能体 auth profiles、工作区和渠道路由。

    提示：

    - 为每个智能体保留一个**活动**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增大，请清理旧会话（删除 JSONL 或 store 条目）。
    - 使用 `openclaw doctor` 发现零散工作区和 profile 不匹配问题。

  </Accordion>

  <Accordion title="我可以同时运行多个机器人或多个聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**来运行多个隔离的智能体，并按
    渠道/账号/对端路由入站消息。Slack 作为渠道受支持，也可以绑定到特定智能体。

    浏览器访问功能很强大，但并不意味着“能做任何人类能做的事”——反机器人机制、CAPTCHA 和 MFA
    仍然可能阻止自动化。若要获得最可靠的浏览器控制，请在宿主机上使用本地 Chrome MCP，
    或在真正运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 网关宿主机（VPS/Mac mini）。
    - 每个角色一个智能体（bindings）。
    - 将 Slack 渠道绑定到这些智能体。
    - 在需要时通过 Chrome MCP 或节点访问本地浏览器。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [Browser](/zh-CN/tools/browser)、[Nodes](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、故障转移和 auth profiles

模型问答——默认值、选择、别名、切换、故障转移、auth profiles——
已移到专门页面：
[FAQ — 模型和 auth profiles](/zh-CN/help/faq-models)。

## Gateway 网关：端口、“已在运行”和远程模式

<AccordionGroup>
  <Accordion title="Gateway 网关使用哪个端口？">
    `gateway.port` 控制单个复用端口，用于 WebSocket + HTTP（Control UI、hooks 等）。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认值 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示 “Runtime: running”，但 “Connectivity probe: failed”？'>
    因为“running”是 **supervisor** 的视角（launchd/systemd/schtasks）。而 connectivity probe 是 CLI 实际去连接 gateway WebSocket 的结果。

    使用 `openclaw gateway status`，并重点看这些行：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（端口上实际绑定的内容）
    - `Last gateway error:`（进程存活但端口未监听时的常见根因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 中 “Config (cli)” 和 “Config (service)” 不同？'>
    你编辑的是一个配置文件，而服务运行的是另一个（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复：

    ```bash
    openclaw gateway install --force
    ```

    在你希望服务使用的同一 `--profile` / 环境下运行该命令。

  </Accordion>

  <Accordion title='“another gateway instance is already listening” 是什么意思？'>
    OpenClaw 会在启动时立即绑定 WebSocket 监听器来强制执行运行时锁（默认 `ws://127.0.0.1:18789`）。如果绑定因 `EADDRINUSE` 失败，就会抛出 `GatewayLockError`，表示已有另一个实例正在监听。

    修复：停止另一个实例、释放该端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何让 OpenClaw 运行在远程模式（客户端连接到别处的 Gateway 网关）？">
    设置 `gateway.mode: "remote"`，并指向远程 WebSocket URL，可选附带 shared-secret 远程凭证：

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

    - 只有当 `gateway.mode` 为 `local`（或你传入覆盖标志）时，`openclaw gateway` 才会启动。
    - macOS 应用会监视配置文件，并在这些值变化时实时切换模式。
    - `gateway.remote.token` / `.password` 只是客户端侧的远程凭证；它们本身不会启用本地 gateway 认证。

  </Accordion>

  <Accordion title='Control UI 显示 “unauthorized”（或者一直重连）。怎么办？'>
    你的 gateway 认证路径与 UI 使用的认证方法不匹配。

    事实（来自代码）：

    - Control UI 会将 token 保存在 `sessionStorage` 中，作用范围是当前浏览器标签页会话和选中的 gateway URL，因此在同一标签页刷新时仍可继续工作，而无需恢复长期的 localStorage token 持久化。
    - 在发生 `AUTH_TOKEN_MISMATCH` 时，当 gateway 返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）时，受信任客户端可以使用缓存的设备 token 进行一次有界重试。
    - 该缓存 token 重试现在会复用与该设备 token 一起存储的已批准 scopes。显式传入 `deviceToken` / 显式传入 `scopes` 的调用方仍会保留自己请求的 scope 集，而不会继承缓存 scope。
    - 在该重试路径之外，连接认证优先级依次为：显式 shared token/password、显式 `deviceToken`、已存储设备 token、bootstrap token。
    - bootstrap token 的 scope 检查采用角色前缀。内置 bootstrap 操作员允许列表只满足操作员请求；节点或其他非操作员角色仍然需要自己角色前缀下的 scopes。

    修复：

    - 最快方式：`openclaw dashboard`（打印并复制 dashboard URL，尝试打开；如果无头则显示 SSH 提示）。
    - 如果你还没有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是远程连接，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。
    - shared-secret 模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`，或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的 secret。
    - Tailscale Serve 模式：确保已启用 `gateway.auth.allowTailscale`，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份头的原始 loopback/tailnet URL。
    - trusted-proxy 模式：确保你是通过已配置的非 loopback 身份感知代理访问，而不是同主机 loopback 代理或原始 gateway URL。
    - 如果一次重试后仍然不匹配，请轮换/重新批准已配对设备 token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该轮换命令提示被拒绝，请检查两点：
      - 已配对设备会话只能轮换它们**自己的**设备，除非它们还拥有 `operator.admin`
      - 显式 `--scope` 值不能超过调用方当前的 operator scopes
    - 仍然卡住？运行 `openclaw status --all`，并按照 [故障排除](/zh-CN/gateway/troubleshooting) 继续排查。认证细节请参阅 [Dashboard](/zh-CN/web/dashboard)。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet，但它无法绑定，也没有任何监听">
    `tailnet` 绑定会从你的网络接口中选择一个 Tailscale IP（100.64.0.0/10）。如果这台机器不在 Tailscale 上（或该接口已关闭），就没有可绑定的地址。

    修复：

    - 在该主机上启动 Tailscale（让它获取一个 100.x 地址），或者
    - 切换为 `gateway.bind: "loopback"` / `"lan"`。

    说明：`tailnet` 是显式设置。`auto` 会优先选择 loopback；当你希望只绑定 tailnet 时，请使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主机上运行多个 Gateway 网关吗？">
    通常不需要——一个 Gateway 网关可以运行多个消息渠道和智能体。只有在你需要冗余（例如救援机器人）或硬隔离时，才使用多个 Gateway 网关。

    可以，但你必须隔离：

    - `OPENCLAW_CONFIG_PATH`（每实例配置）
    - `OPENCLAW_STATE_DIR`（每实例状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 每个实例使用 `openclaw --profile <name> ...`（会自动创建 `~/.openclaw-<name>`）。
    - 在每个 profile 配置中设置唯一的 `gateway.port`（或在手动运行时传入 `--port`）。
    - 安装按 profile 区分的服务：`openclaw --profile <name> gateway install`。

    Profiles 还会为服务名添加后缀（`ai.openclaw.<profile>`；旧版为 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[Multiple gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 是什么意思？'>
    Gateway 网关是一个 **WebSocket server**，并且它期望收到的第一条消息
    是一个 `connect` 帧。如果收到其他内容，它就会以
    **code 1008**（策略违规）关闭连接。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`），而不是使用 WS 客户端。
    - 你用了错误的端口或路径。
    - 某个代理或隧道剥离了认证头，或发送了非 Gateway 网关请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，则使用 `wss://...`）。
    2. 不要在普通浏览器标签页中打开 WS 端口。
    3. 如果启用了认证，请在 `connect` 帧中包含 token/password。

    如果你使用的是 CLI 或 TUI，URL 应该类似：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议细节：[Gateway protocol](/zh-CN/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志和调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以通过 `logging.file` 设置一个稳定路径。文件日志级别由 `logging.level` 控制。控制台详细级别由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快的日志跟踪方式：

    ```bash
    openclaw logs --follow
    ```

    服务/supervisor 日志（当 gateway 通过 launchd/systemd 运行时）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；profiles 使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多内容请参阅 [故障排除](/zh-CN/gateway/troubleshooting)。

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
    Windows 上有**两种安装模式**：

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

    **2）原生 Windows（不推荐）：** Gateway 网关直接在 Windows 中运行。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你是手动运行（没有服务），请使用：

    ```powershell
    openclaw gateway run
    ```

    文档：[Windows（WSL2）](/zh-CN/platforms/windows)、[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="Gateway 网关已经启动，但始终收不到回复。我该检查什么？">
    先做一次快速健康检查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - 模型认证未在**gateway 宿主机**上加载（检查 `models status`）。
    - 渠道配对/允许列表阻止了回复（检查渠道配置 + 日志）。
    - WebChat/Dashboard 已打开，但使用了错误的 token。

    如果你在远程环境中，请确认隧道/Tailscale 连接已建立，并且
    Gateway WebSocket 可达。

    文档：[Channels](/zh-CN/channels)、[故障排除](/zh-CN/gateway/troubleshooting)、[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title='“Disconnected from gateway: no reason”——怎么办？'>
    这通常表示 UI 失去了 WebSocket 连接。请检查：

    1. Gateway 网关是否正在运行？`openclaw gateway status`
    2. Gateway 网关是否健康？`openclaw status`
    3. UI 是否使用了正确的 token？`openclaw dashboard`
    4. 如果是远程连接，隧道/Tailscale 链路是否已建立？

    然后跟踪日志：

    ```bash
    openclaw logs --follow
    ```

    文档：[Dashboard](/zh-CN/web/dashboard)、[远程访问](/zh-CN/gateway/remote)、[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram 的 setMyCommands 失败了。我该检查什么？">
    先看日志和渠道状态：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后根据错误匹配：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目太多。OpenClaw 已经会裁剪到 Telegram 限制并用更少命令重试，但某些菜单条目仍需要进一步删除。减少 plugin/skill/自定义命令，或者如果你不需要菜单，可禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你运行在 VPS 上或位于代理后面，请确认允许出站 HTTPS，并且 `api.telegram.org` 的 DNS 解析正常。

    如果 Gateway 网关是远程的，请确保你查看的是 Gateway 网关宿主机上的日志。

    文档：[Telegram](/zh-CN/channels/telegram)、[渠道故障排除](/zh-CN/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有任何输出。我该检查什么？">
    先确认 Gateway 网关可达，且智能体可以运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你希望在聊天
    渠道中收到回复，请确保已启用发送（`/deliver on`）。

    文档：[TUI](/zh-CN/web/tui)、[斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何彻底停止然后重新启动 Gateway 网关？">
    如果你安装了服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这会停止/启动**受监管服务**（macOS 上为 launchd，Linux 上为 systemd）。
    当 Gateway 网关作为后台守护进程运行时，请使用这种方式。

    如果你是在前台运行，请使用 Ctrl-C 停止，然后执行：

    ```bash
    openclaw gateway run
    ```

    文档：[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="用最简单的话解释：openclaw gateway restart 和 openclaw gateway 有什么区别？">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在当前终端会话中**前台运行** gateway。

    如果你安装了服务，请使用 gateway 命令。  
    当你想进行一次性的前台运行时，使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="当某个操作失败时，最快获得更多细节的方法">
    使用 `--verbose` 启动 Gateway 网关，以获得更多控制台细节。然后检查日志文件，查看渠道认证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的 skill 生成了一张图片/PDF，但什么都没有发送">
    智能体发出的出站附件必须包含一行 `MEDIA:<path-or-url>`（单独占一行）。请参阅 [OpenClaw assistant setup](/zh-CN/start/openclaw) 和 [Agent send](/zh-CN/tools/agent-send)。

    CLI 发送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    还请检查：

    - 目标渠道支持出站媒体，且没有被允许列表阻止。
    - 文件未超过 provider 的大小限制（图片会被调整为最大 2048px）。
    - `tools.fs.workspaceOnly=true` 会将本地路径发送限制在工作区、temp/media-store 以及通过沙箱验证的文件中。
    - `tools.fs.workspaceOnly=false` 允许 `MEDIA:` 发送智能体已能读取的宿主机本地文件，但仅限媒体和安全文档类型（图片、音频、视频、PDF 和 Office 文档）。纯文本和疑似 secret 文件仍然会被阻止。

    请参阅 [Images](/zh-CN/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全和访问控制

<AccordionGroup>
  <Accordion title="将 OpenClaw 暴露给传入私信安全吗？">
    请将传入私信视为不受信任输入。默认设置的设计目标就是降低风险：

    - 支持私信的渠道默认行为是**配对**：
      - 未知发送者会收到一个配对码；机器人不会处理他们的消息。
      - 批准方式：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求在**每个渠道最多 3 个**；如果没有收到代码，请检查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 若要公开开放私信，必须显式选择启用（`dmPolicy: "open"` 且允许列表为 `"*"`）。

    运行 `openclaw doctor` 可发现高风险的私信策略。

  </Accordion>

  <Accordion title="Prompt 注入只是公共机器人需要担心的问题吗？">
    不是。Prompt 注入关乎的是**不受信任内容**，而不仅仅是谁可以给机器人发私信。
    如果你的助手会读取外部内容（Web 搜索/抓取、浏览器页面、邮件、
    文档、附件、粘贴的日志），这些内容都可能包含试图
    劫持模型的指令。即使**你是唯一发送者**，这种情况也可能发生。

    当启用了工具时，风险最大：模型可能被诱导
    窃取上下文或代表你调用工具。降低影响面的方式包括：

    - 使用只读或禁用工具的“reader”智能体来总结不受信任内容
    - 对启用了工具的智能体关闭 `web_search` / `web_fetch` / `browser`
    - 同样将解码后的文件/文档文本视为不受信任：OpenResponses
      `input_file` 和媒体附件提取都会将提取出的文本包裹在
      显式的外部内容边界标记中，而不是直接传递原始文件文本
    - 使用沙箱隔离和严格的工具允许列表

    详情请参阅：[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我的机器人应该有自己的邮箱、GitHub 账号或电话号码吗？">
    对于大多数设置来说，应该有。使用独立的账号和电话号码来隔离机器人，
    可以在发生问题时降低影响范围。这样也更容易轮换
    凭证或撤销访问，而不会影响你的个人账号。

    从小范围开始。只授予你实际需要的工具和账号访问权限，
    如果后续确有需要，再逐步扩大。

    文档：[Security](/zh-CN/gateway/security)、[Pairing](/zh-CN/channels/pairing)。

  </Accordion>

  <Accordion title="我可以让它自主处理我的短信吗？这安全吗？">
    我们**不**建议让它完全自主处理你的个人消息。最安全的模式是：

    - 保持私信为**配对模式**或使用严格允许列表。
    - 如果你希望它代表你发送消息，请使用**单独的号码或账号**。
    - 让它起草，然后**在发送前进行批准**。

    如果你想做实验，请在专用账号上进行，并保持隔离。请参阅
    [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="对于个人助手任务，我可以使用更便宜的模型吗？">
    可以，**前提是**智能体只用于聊天，且输入是可信的。较小的模型层级
    更容易受到指令劫持，因此不要将它们用于启用了工具的智能体，
    或用于读取不受信任内容的场景。如果你必须使用较小模型，请锁紧
    工具权限，并在沙箱中运行。请参阅 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中运行了 /start，但没有收到配对码">
    只有当未知发送者向机器人发送消息，并且
    `dmPolicy: "pairing"` 已启用时，才会发送配对码。单独的 `/start` 不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你希望立即访问，请将你的发送者 ID 加入允许列表，或为该账号设置 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会给我的联系人发消息吗？配对是如何工作的？">
    不会。WhatsApp 默认私信策略是**配对**。未知发送者只会收到一个配对码，他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或者你明确触发的发送操作。

    批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    查看待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导中的电话号码提示：它用于设置你的**允许列表/所有者**，以便允许你自己的私信通过。它不会用于自动发送。如果你运行在自己的 WhatsApp 号码上，请使用该号码，并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、终止任务，以及“它停不下来”

<AccordionGroup>
  <Accordion title="如何阻止内部系统消息显示在聊天中？">
    大多数内部消息或工具消息只有在该会话启用了 **verbose**、**trace** 或 **reasoning**
    时才会显示。

    在出现问题的聊天中执行以下操作：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，请检查 Control UI 中的会话设置，并将 verbose
    设为 **inherit**。同时确认你没有使用某个在配置中将 `verboseDefault` 设为
    `on` 的机器人配置文件。

    文档：[Thinking and verbose](/zh-CN/tools/thinking)、[Security](/zh-CN/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消一个正在运行的任务？">
    将以下任意内容**作为独立消息发送**（不要加斜杠）：

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

    这些都是中止触发词（不是斜杠命令）。

    对于后台进程（来自 exec 工具），你可以让智能体运行：

    ```
    process action:kill sessionId:XXX
    ```

    斜杠命令概览：请参阅 [斜杠命令](/zh-CN/tools/slash-commands)。

    大多数命令必须作为**独立**消息发送，并且以 `/` 开头，但少数快捷方式（如 `/status`）对于在允许列表中的发送者也可内联使用。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（“Cross-context messaging denied”）'>
    OpenClaw 默认会阻止**跨 provider** 消息发送。如果某个工具调用绑定
    到 Telegram，它就不会发送到 Discord，除非你显式允许。

    为该智能体启用跨 provider 消息：

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

    编辑配置后请重启 gateway。

  </Accordion>

  <Accordion title='为什么机器人对快速连续发送的消息看起来像是“无视”了？'>
    队列模式控制新消息如何与正在进行中的运行交互。使用 `/queue` 更改模式：

    - `steer` - 新消息会重定向当前任务
    - `followup` - 一次处理一条消息
    - `collect` - 批量收集消息并统一回复一次（默认）
    - `steer-backlog` - 先重定向当前任务，再处理积压消息
    - `interrupt` - 中止当前运行并重新开始

    对于 followup 模式，你还可以添加类似 `debounce:2s cap:25 drop:summarize` 的选项。

  </Accordion>
</AccordionGroup>

## 杂项

<AccordionGroup>
  <Accordion title='Anthropic 使用 API key 时的默认模型是什么？'>
    在 OpenClaw 中，凭证和模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在 auth profiles 中存储 Anthropic API key）会启用认证，但实际的默认模型取决于你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 网关无法在当前运行智能体所对应的 `auth-profiles.json` 中找到 Anthropic 凭证。
  </Accordion>
</AccordionGroup>

---

还是卡住了？请到 [Discord](https://discord.com/invite/clawd) 提问，或发起一个 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)。
