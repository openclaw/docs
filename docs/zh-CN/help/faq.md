---
read_when:
    - 解答常见的设置、安装、新手引导或运行时支持问题
    - 深入调试前先对用户报告的问题进行分流
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-06-27T02:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

快速回答以及面向真实部署（本地开发、VPS、多智能体、OAuth/API keys、模型故障转移）的深入故障排除。有关运行时诊断，请参阅 [故障排除](/zh-CN/gateway/troubleshooting)。有关完整配置参考，请参阅 [配置](/zh-CN/gateway/configuration)。

## 如果出现故障，最初的六十秒

1. **快速状态（第一项检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：OS + 更新、Gateway 网关/服务可达性、智能体/会话、提供商配置 + 运行时问题（当 Gateway 网关可达时）。

2. **可粘贴报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，包含日志尾部（令牌已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用的配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 网关健康探测，包括受支持时的渠道探测
   （需要可达的 Gateway 网关）。请参阅 [健康](/zh-CN/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 关闭，请回退到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志相互独立；请参阅 [日志](/zh-CN/logging) 和 [故障排除](/zh-CN/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置和状态 + 运行健康检查。请参阅 [Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   向正在运行的 Gateway 网关请求完整快照（仅 WS）。请参阅 [健康](/zh-CN/gateway/health)。

## 快速开始和首次运行设置

首次运行问答（安装、新手引导、凭证路由、订阅、初始失败）位于 [首次运行常见问题](/zh-CN/help/faq-first-run)。

## OpenClaw 是什么？

<AccordionGroup>
  <Accordion title="用一段话说明 OpenClaw 是什么？">
    OpenClaw 是一个你在自己设备上运行的个人 AI 助手。它会在你已经使用的消息界面上回复（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等内置渠道插件），并且在受支持的平台上还可以提供语音 + 实时 Canvas。**Gateway 网关**是常驻控制平面；助手才是产品。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不只是“Claude 封装器”。它是一个**本地优先的控制平面**，让你可以在**自己的硬件**上运行能力强的助手，通过你已经使用的聊天应用访问，并拥有有状态会话、记忆和工具，而无需把工作流控制权交给托管 SaaS。

    亮点：

    - **你的设备，你的数据：** 在你想要的地方运行 Gateway 网关（Mac、Linux、VPS），并将工作区 + 会话历史保留在本地。
    - **真实渠道，而不是 Web 沙箱：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等，加上受支持平台上的移动语音和 Canvas。
    - **模型无关：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由和故障转移。
    - **仅本地选项：** 运行本地模型，因此如果你愿意，**所有数据都可以留在你的设备上**。
    - **多智能体路由：** 按渠道、账号或任务划分不同智能体，每个智能体都有自己的工作区和默认设置。
    - **开源且可改造：** 检查、扩展并自托管，无供应商锁定。

    文档：[Gateway 网关](/zh-CN/gateway)、[渠道](/zh-CN/channels)、[多智能体](/zh-CN/concepts/multi-agent)、
    [记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚设置好，第一步应该做什么？">
    适合上手的项目：

    - 构建网站（WordPress、Shopify 或简单静态站点）。
    - 原型化移动应用（大纲、界面、API 计划）。
    - 整理文件和文件夹（清理、命名、标记）。
    - 连接 Gmail 并自动生成摘要或跟进事项。

    它可以处理大型任务，但当你把任务拆成阶段并使用子智能体并行处理时效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常使用场景是什么？">
    日常收益通常包括：

    - **个人简报：** 汇总你关心的收件箱、日历和新闻。
    - **研究和起草：** 为邮件或文档做快速研究、摘要和初稿。
    - **提醒和跟进：** 由 cron 或 Heartbeat 驱动的提醒和清单。
    - **浏览器自动化：** 填写表单、收集数据和重复执行 Web 任务。
    - **跨设备协调：** 从手机发送任务，让 Gateway 网关在服务器上运行，并在聊天中取回结果。

  </Accordion>

  <Accordion title="OpenClaw 可以帮助 SaaS 做线索生成、外联、广告和博客吗？">
    可以，用于**研究、资格筛选和起草**。它可以扫描站点、构建候选清单、总结潜在客户，并编写外联或广告文案草稿。

    对于**外联或广告投放**，请让人类保留在流程中。避免垃圾信息，遵守当地法律和平台政策，并在发送前审核所有内容。最安全的模式是让 OpenClaw 起草，然后由你批准。

    文档：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="相比 Claude Code，OpenClaw 在 Web 开发方面有什么优势？">
    OpenClaw 是一个**个人助手**和协调层，不是 IDE 替代品。在仓库内需要最快的直接编码循环时，请使用 Claude Code 或 Codex。需要持久记忆、跨设备访问和工具编排时，请使用 OpenClaw。

    优势：

    - 跨会话的**持久记忆 + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、钩子）
    - **常驻 Gateway 网关**（在 VPS 上运行，从任何地方交互）
    - 用于本地浏览器/屏幕/摄像头/exec 的 **Nodes**

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何在不让仓库变脏的情况下自定义 Skills？">
    使用托管覆盖，而不是编辑仓库副本。把你的更改放在 `~/.openclaw/skills/<name>/SKILL.md`（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此托管覆盖仍会优先于内置 Skills，而无需触碰 git。如果你需要全局安装该 Skill，但只对部分智能体可见，请将共享副本保留在 `~/.openclaw/skills`，并用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有值得上游合并的编辑才应放在仓库中并通过 PR 发出。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 Skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一次会话中将其视为 `<workspace>/skills`。如果该 Skill 只应对某些智能体可见，请同时配置 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型或设置？">
    目前支持的模式包括：

    - **Cron 作业**：隔离作业可以按作业设置 `model` 覆盖。
    - **智能体**：将任务路由到不同智能体，使用不同的默认模型、思考级别和流参数。
    - **按需切换**：随时使用 `/model` 切换当前会话模型。

    例如，使用同一模型但为不同智能体设置不同配置：

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    将共享的按模型默认值放在 `agents.defaults.models["provider/model"].params` 中，然后将智能体特定覆盖放在扁平的 `agents.list[].params` 中。不要为同一模型定义单独的嵌套 `agents.list[].models["provider/model"].params` 条目；`agents.list[].models` 用于按智能体的模型目录和运行时覆盖。

    请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)、[多智能体路由](/zh-CN/concepts/multi-agent)、[配置](/zh-CN/gateway/config-agents) 和 [斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行繁重工作时卡住。如何把它卸载出去？">
    对长时间或并行任务使用**子智能体**。子智能体在自己的会话中运行，返回摘要，并让你的主聊天保持响应。

    让你的机器人“为这个任务生成一个子智能体”，或使用 `/subagents`。
    在聊天中使用 `/status` 查看 Gateway 网关现在正在做什么（以及它是否忙碌）。

    令牌提示：长任务和子智能体都会消耗令牌。如果担心成本，请通过 `agents.defaults.subagents.model` 为子智能体设置更便宜的模型。

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上绑定线程的子智能体会话如何工作？">
    使用线程绑定。你可以将 Discord 线程绑定到子智能体或会话目标，使该线程中的后续消息保持在绑定的会话上。

    基本流程：

    - 使用 `sessions_spawn` 生成，并设置 `thread: true`（可选设置 `mode: "session"` 以实现持久跟进）。
    - 或使用 `/focus <target>` 手动绑定。
    - 使用 `/agents` 查看绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - 使用 `/unfocus` 分离线程。

    必需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：`channels.discord.threadBindings.spawnSessions` 默认为 `true`；将其设置为 `false` 可禁用绑定线程的会话生成。

    文档：[子智能体](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[配置参考](/zh-CN/gateway/configuration-reference)、[斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="子智能体已完成，但完成更新发到了错误位置或从未发布。我应该检查什么？">
    先检查解析后的请求者路由：

    - 当存在绑定线程或对话路由时，完成模式的子智能体投递会优先使用它。
    - 如果完成来源只携带渠道，OpenClaw 会回退到请求者会话存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），因此直接投递仍可能成功。
    - 如果既没有绑定路由，也没有可用的已存储路由，直接投递可能失败，结果会回退到排队会话投递，而不是立即发布到聊天中。
    - 无效或过期目标仍可能强制队列回退或导致最终投递失败。
    - 如果子智能体最后一条可见助手回复是精确的静默令牌 `NO_REPLY` / `no_reply`，或精确等于 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制通知，而不是发布较早的过期进度。
    - 工具/toolResult 输出不会提升为子智能体结果文本；结果是子智能体最新的可见助手回复。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)、[会话工具](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我应该检查什么？">
    Cron 在 Gateway 网关进程内运行。如果 Gateway 网关没有持续运行，
    定时作业将不会运行。

    检查清单：

    - 确认 Cron 已启用（`cron.enabled`），且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否 24/7 运行（没有睡眠/重启）。
    - 验证作业的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[自动化](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 已触发，但没有任何内容发送到渠道。为什么？">
    先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不会有预期的运行器 fallback 发送。
    - 缺少或无效的公告目标（`channel` / `to`）表示运行器跳过了出站投递。
    - 渠道凭证失败（`unauthorized`、`Forbidden`）表示运行器尝试投递，但凭证阻止了它。
    - 静默的隔离结果（仅 `NO_REPLY` / `no_reply`）会被视为有意不可投递，因此运行器也会抑制排队的 fallback 投递。

    对于隔离 Cron 作业，当聊天路由可用时，agent 仍然可以使用 `message`
    工具直接发送。`--announce` 只控制 agent 尚未发送的最终文本所走的运行器
    fallback 路径。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离 Cron 运行会切换模型或重试一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离 Cron 可以持久化运行时模型交接，并在活动
    运行抛出 `LiveSessionModelSwitchError` 时重试。重试会保留切换后的
    提供商/模型；如果切换携带了新的凭证配置覆盖，Cron
    也会在重试前持久化该覆盖。

    相关选择规则：

    - Gmail 钩子模型覆盖在适用时最先胜出。
    - 然后是每个作业的 `model`。
    - 然后是任何已存储的 Cron 会话模型覆盖。
    - 然后是正常的 agent/默认模型选择。

    重试循环是有界的。在初始尝试加 2 次切换重试之后，
    Cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[cron CLI](/zh-CN/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或将 Skills 放入你的工作区。macOS Skills 界面在 Linux 上不可用。
    在 [https://clawhub.ai](https://clawhub.ai) 浏览 Skills。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    原生 `openclaw skills install` 默认写入活动工作区的 `skills/`
    目录。添加 `--global` 可安装到所有本地智能体共享的托管
    Skills 目录。只有当你想发布或同步自己的 Skills 时，才需要安装单独的 `clawhub` CLI。
    如果你想缩小哪些智能体可以看到共享 Skills，
    请使用 `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划或在后台持续运行任务吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron 作业**用于计划任务或周期性任务（重启后仍保留）。
    - **Heartbeat**用于“主会话”周期性检查。
    - **隔离作业**用于发布摘要或投递到聊天的自治智能体。

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[自动化](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以从 Linux 运行仅限 Apple macOS 的 Skills 吗？">
    不能直接运行。macOS Skills 受 `metadata.openclaw.os` 以及所需二进制文件门控，并且 Skills 只有在 **Gateway 网关主机** 上符合条件时才会出现在系统提示中。在 Linux 上，除非你覆盖门控，否则仅限 `darwin` 的 Skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载。

    你有三种受支持的模式：

    **选项 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在存在 macOS 二进制文件的位置运行 Gateway 网关，然后从 Linux 以[远程模式](#gateway-ports-already-running-and-remote-mode)连接，或通过 Tailscale 连接。由于 Gateway 网关主机是 macOS，Skills 会正常加载。

    **选项 B - 使用 macOS 节点（无 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并在 Mac 上将 **Node Run Commands** 设置为“Always Ask”或“Always Allow”。当所需二进制文件存在于节点上时，OpenClaw 可以将仅限 macOS 的 Skills 视为符合条件。agent 会通过 `nodes` 工具运行这些 Skills。如果你选择“Always Ask”，在提示中批准“Always Allow”会将该命令添加到允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    将 Gateway 网关保留在 Linux 上，但让所需 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。然后覆盖该 Skill 以允许 Linux，使其保持符合条件。

    1. 为该二进制文件创建 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将包装器放到 Linux 主机的 `PATH` 上（例如 `~/bin/memo`）。
    3. 覆盖 Skill 元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动新会话，以刷新 Skills 快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    选项：

    - **自定义 Skill / 插件：**最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：**无需代码即可工作，但速度更慢，也更脆弱。

    如果你想按客户保留上下文（代理机构工作流），一个简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 活跃工作）。
    - 要求 agent 在会话开始时获取该页面。

    如果你想要原生集成，请提交功能请求，或构建一个
    针对这些 API 的 Skill。

    安装 Skills：

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    原生安装会落到活动工作区的 `skills/` 目录。对于所有本地智能体共享的 Skills，请使用 `openclaw skills install @owner/<skill-slug> --global`（或手动放入 `~/.openclaw/skills/<name>/SKILL.md`）。如果只有部分智能体应该看到某个共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。某些 Skills 需要通过 Homebrew 安装二进制文件；在 Linux 上这意味着 Linuxbrew（见上面的 Homebrew Linux 常见问题条目）。请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/clawhub)。

  </Accordion>

  <Accordion title="如何将我现有已登录的 Chrome 与 OpenClaw 搭配使用？">
    使用内置的 `user` 浏览器配置文件，它会通过 Chrome DevTools MCP 附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，请创建显式 MCP 配置文件：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    此路径可以使用本地主机浏览器或已连接的浏览器节点。如果 Gateway 网关在其他地方运行，请在浏览器所在机器上运行节点主机，或改用远程 CDP。

    `existing-session` / `user` 的当前限制：

    - 操作基于 ref，而不是基于 CSS 选择器
    - 上传需要 `ref` / `inputRef`，目前一次支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍需要托管浏览器或原始 CDP 配置文件

  </Accordion>
</AccordionGroup>

## 沙箱隔离和记忆

<AccordionGroup>
  <Accordion title="是否有专门的沙箱隔离文档？">
    有。请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。对于 Docker 专用设置（Docker 中的完整 Gateway 网关或沙箱镜像），请参阅 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉受限，如何启用完整功能？">
    默认镜像优先考虑安全，并以 `node` 用户运行，因此不
    包含系统软件包、Homebrew 或内置浏览器。更完整的设置方式：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，使缓存保留。
    - 使用 `OPENCLAW_IMAGE_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH`，并确保该路径被持久化。

    文档：[Docker](/zh-CN/install/docker)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以让私信保持个人化，同时用一个智能体让群组公开/沙箱隔离吗？">
    可以，只要你的私有流量是**私信**，公共流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/渠道会话（非 main 键）会在配置的沙箱后端中运行，而主私信会话保留在主机上。如果你不选择后端，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置演练 + 示例配置：[群组：个人私信 + 公共群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway 网关配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何将主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局绑定和按智能体绑定会合并；当 `scope: "shared"` 时，按智能体绑定会被忽略。对任何敏感内容使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会同时根据规范化路径，以及通过最深层已存在祖先解析出的规范路径来验证绑定源。这意味着即使最后一个路径段尚不存在，符号链接父级逃逸仍会失败关闭，并且允许根检查仍会在符号链接解析后适用。

    请参阅[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)和[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)获取示例和安全说明。

  </Accordion>

  <Accordion title="记忆是如何工作的？">
    OpenClaw 记忆只是 agent 工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日笔记
    - `MEMORY.md` 中的精选长期笔记（仅限 main/私有会话）

    OpenClaw 还会运行一次**静默的压缩前记忆刷新**，提醒模型
    在自动压缩前写入持久笔记。这只会在工作区
    可写时运行（只读沙箱会跳过）。请参阅[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="记忆总是忘事。怎样让它记住？">
    让机器人**把事实写入记忆**。长期笔记应放在 `MEMORY.md` 中，
    短期上下文放在 `memory/YYYY-MM-DD.md` 中。

    这仍是我们正在改进的领域。提醒模型存储记忆会有帮助；
    它会知道该怎么做。如果它一直忘记，请确认 Gateway 网关在每次运行时都使用同一个
    工作区。

    文档：[记忆](/zh-CN/concepts/memory)、[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永久保留吗？有哪些限制？">
    记忆文件位于磁盘上，并会一直保留，直到你删除它们。限制来自你的
    存储空间，而不是模型。**会话上下文**仍受模型上下文窗口限制，
    因此长对话可能会被压缩或截断。这就是
    记忆搜索存在的原因 - 它只会把相关部分拉回上下文。

    文档：[记忆](/zh-CN/concepts/memory)、[上下文](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索需要 OpenAI API 密钥吗？">
    只有在你使用 **OpenAI 嵌入**时才需要。Codex OAuth 覆盖聊天/补全，
    但**不会**授予嵌入访问权限，因此**使用 Codex 登录（OAuth 或
    Codex CLI 登录）**对语义记忆搜索没有帮助。OpenAI 嵌入
    仍需要真实的 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置提供商，OpenClaw 会使用 OpenAI 嵌入。仍写着
    `memorySearch.provider = "auto"` 的旧配置也会解析为 OpenAI。
    如果没有可用的 OpenAI API 密钥，语义记忆搜索会保持不可用，
    直到你配置密钥或显式选择另一个提供商。

    如果你更想保持本地运行，请设置 `memorySearch.provider = "local"`（并可选择
    设置 `memorySearch.fallback = "none"`）。如果你想使用 Gemini 嵌入，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、OpenAI 兼容、Gemini、
    Voyage、Mistral、Bedrock、Ollama、LM Studio、GitHub Copilot、DeepInfra 或本地**
    嵌入模型 - 设置详情请参阅[记忆](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 内容在磁盘上的位置

<AccordionGroup>
  <Accordion title="OpenClaw 使用的所有数据都会保存在本地吗？">
    不是 - **OpenClaw 的状态是本地的**，但**外部服务仍会看到你发送给它们的内容**。

    - **默认本地：**会话、记忆文件、配置和工作区位于 Gateway 网关主机上
      （`~/.openclaw` + 你的工作区目录）。
    - **必要时远程：**你发送给模型提供商（Anthropic/OpenAI 等）的消息会进入
      它们的 API，聊天平台（WhatsApp/Telegram/Slack 等）会在其
      服务器上存储消息数据。
    - **你控制占用范围：**使用本地模型会让提示留在你的机器上，但频道
      流量仍会经过该频道的服务器。

    相关：[Agent 工作区](/zh-CN/concepts/agent-workspace)、[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 将数据存储在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到认证配置文件）                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 认证配置文件（OAuth、API 密钥，以及可选的 `keyRef`/`tokenRef`）    |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供商的可选文件后备密钥载荷                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目已清理）                          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每个智能体的状态（agentDir + 会话）                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史和状态（按智能体）                                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（按智能体）                                             |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、Skills 等）是独立的，并通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于 **Agent 工作区**，而不是 `~/.openclaw`。

    - **工作区（按智能体）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`，以及可选的 `HEARTBEAT.md`。
      小写根文件 `memory.md` 仅作为旧版修复输入；当两个文件都存在时，
      `openclaw doctor --fix` 可以将其合并到 `MEMORY.md` 中。
    - **状态目录（`~/.openclaw`）**：配置、频道/提供商状态、认证配置文件、会话、日志，
      以及共享 Skills（`~/.openclaw/skills`）。

    默认工作区是 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“忘记”了内容，请确认 Gateway 网关每次启动时都使用同一个
    工作区（并记住：远程模式使用的是 **Gateway 网关主机的**
    工作区，而不是你的本地笔记本电脑）。

    提示：如果你想要持久的行为或偏好，请让机器人**把它写入
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    请参阅 [Agent 工作区](/zh-CN/concepts/agent-workspace) 和[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我可以让 SOUL.md 更大吗？">
    可以。`SOUL.md` 是注入到智能体上下文中的工作区引导文件之一。
    默认单文件注入限制是 `20000` 个字符，
    跨文件的总引导预算是 `60000` 个字符。

    在你的 OpenClaw 配置中更改共享默认值：

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    或者覆盖某个智能体：

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    使用 `/context` 检查原始大小与注入大小，以及是否发生截断。
    让 `SOUL.md` 专注于语气、立场和人格；将操作规则
    放在 `AGENTS.md` 中，将持久事实放在记忆中。

    请参阅[上下文](/zh-CN/concepts/context)和[智能体配置](/zh-CN/gateway/config-agents)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的 **Agent 工作区**放入**私有** git 仓库，并备份到某个
    私有位置（例如 GitHub 私有仓库）。这会捕获记忆 + AGENTS/SOUL/USER
    文件，并让你之后能够恢复助手的“大脑”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、令牌或加密密钥载荷）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （请参见上面的迁移问题）。

    文档：[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全卸载 OpenClaw？">
    请参阅专门指南：[卸载](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，不是硬性沙箱。
    相对路径会在工作区内解析，但除非启用沙箱隔离，否则绝对路径可以访问其他
    主机位置。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或按智能体配置的沙箱设置。如果你
    想让某个仓库成为默认工作目录，请将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库只是源代码；除非你有意让智能体在其中工作，
    否则请保持工作区独立。

    示例（仓库作为默认 cwd）：

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
    会话状态归 **Gateway 网关主机**所有。如果你处于远程模式，你关心的会话存储位于远程机器上，而不是你的本地笔记本电脑。请参阅[会话管理](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH` 读取可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果文件缺失，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何东西监听 / UI 显示未授权'>
    非 loopback 绑定**需要有效的 Gateway 网关认证路径**。实际含义是：

    - 共享密钥认证：令牌或密码
    - `gateway.auth.mode: "trusted-proxy"` 位于正确配置的身份感知反向代理之后

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

    - `gateway.remote.token` / `.password` 本身**不会**启用本地 Gateway 网关认证。
    - 只有在未设置 `gateway.auth.*` 时，本地调用路径才可以将 `gateway.remote.*` 用作兜底。
    - 对于密码认证，请改为设置 `gateway.auth.mode: "password"` 加 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置且无法解析，解析会失败关闭（不会用远程兜底掩盖）。
    - 共享密钥 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 认证（存储在应用/UI 设置中）。Tailscale Serve 或 `trusted-proxy` 等带身份的模式则使用请求头。避免将共享密钥放在 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`，并在 `gateway.trustedProxies` 中添加 loopback 条目。

  </Accordion>

  <Accordion title="为什么现在 localhost 上也需要令牌？">
    OpenClaw 默认强制执行 Gateway 网关认证，包括 loopback。在正常默认路径中，这意味着令牌认证：如果未配置显式认证路径，Gateway 网关启动会解析为令牌模式，并为该次启动生成仅运行时使用的令牌，因此**本地 WS 客户端必须认证**。当客户端需要在重启之间保持稳定密钥时，请显式配置 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。这会阻止其他本地进程调用 Gateway 网关。

    如果你偏好其他认证路径，可以显式选择密码模式（或者，对于具备身份感知能力的反向代理，选择 `trusted-proxy`）。如果你**确实**想开放 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可以随时为你生成令牌：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="更改配置后必须重启吗？">
    Gateway 网关会监视配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：安全变更热应用，关键变更重启
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
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：轮换有趣/季节性标语（默认行为）。
    - 如果你完全不想显示横幅，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（和 Web 抓取）？">
    `web_fetch` 无需 API key 即可工作。`web_search` 取决于你选择的
    提供商：

    - Brave、Exa、Firecrawl、Gemini、Kimi、MiniMax Search、Perplexity 和 Tavily 等 API 支持的提供商需要其常规 API key 设置。
    - Grok 可以复用模型认证中的 xAI OAuth，或回退到 `XAI_API_KEY` / 插件 Web 搜索配置。
    - Ollama Web 搜索无需 key，但它会使用你配置的 Ollama 主机，并且需要 `ollama signin`。
    - DuckDuckGo 无需 key，但它是非官方的基于 HTML 的集成。
    - SearXNG 无需 key/可自托管；配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：**运行 `openclaw configure --section web` 并选择一个提供商。
    环境变量替代项：

    - Brave：`BRAVE_API_KEY`
    - Exa：`EXA_API_KEY`
    - Firecrawl：`FIRECRAWL_API_KEY`
    - Gemini：`GEMINI_API_KEY`
    - Grok：xAI OAuth、`XAI_API_KEY`
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
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    提供商专属的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧版 `tools.web.search.*` 提供商路径仍会临时加载以保持兼容，但不应在新配置中使用。
    Firecrawl Web 抓取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用允许列表，请添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会根据可用凭证自动检测第一个已就绪的抓取回退提供商。官方 Firecrawl 插件提供该回退。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web 工具](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清空了我的配置。如何恢复并避免这种情况？">
    `config.apply` 会替换**整个配置**。如果你发送部分对象，其他所有内容都会被移除。

    当前 OpenClaw 会防护许多意外覆盖：

    - OpenClaw 拥有的配置写入会在写入前验证完整的变更后配置。
    - 无效或破坏性的 OpenClaw 拥有写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑破坏了启动或热重载，Gateway 网关会失败关闭或跳过重载；它不会重写 `openclaw.json`。
    - `openclaw doctor --fix` 负责修复，并可在将被拒绝文件保存为 `openclaw.json.clobbered.*` 的同时恢复最后已知良好配置。

    恢复：

    - 检查 `openclaw logs --follow` 中的 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 查看活动配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 运行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 只用 `openclaw config set` 或 `config.patch` 把预期键名复制回来。
    - 如果没有最后已知良好配置或被拒绝的载荷，请从备份恢复，或重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这出乎意料，请提交 bug，并包含你最后已知的配置或任何备份。
    - 本地编码智能体通常可以从日志或历史记录重建可用配置。

    避免：

    - 小改动使用 `openclaw config set`。
    - 交互式编辑使用 `openclaw configure`。
    - 当你不确定确切路径或字段形状时，先使用 `config.schema.lookup`；它会返回浅层 schema 节点以及用于继续下钻的直接子项摘要。
    - 对部分 RPC 编辑使用 `config.patch`；仅将 `config.apply` 用于完整配置替换。
    - 如果你正在从智能体运行中使用面向智能体的 `gateway` 工具，它仍会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会规范化到相同受保护 Exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[配置](/zh-CN/cli/config)、[Configure](/zh-CN/cli/configure)、[Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何跨设备运行带专用工作器的中心 Gateway 网关？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**：

    - **Gateway 网关（中心）：**拥有渠道（Signal/WhatsApp）、路由和会话。
    - **节点（设备）：**Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（工作器）：**面向特定角色的独立大脑/工作区（例如 “Hetzner ops”、“个人数据”）。
    - **子智能体：**当你需要并行处理时，从主智能体生成后台工作。
    - **TUI：**连接到 Gateway 网关并切换智能体/会话。

    文档：[节点](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[多 Agent 路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[TUI](/zh-CN/web/tui)。

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

    默认是 `false`（有界面）。无头模式更容易触发某些网站的反机器人检查。请参阅[浏览器](/zh-CN/tools/browser)。

    无头模式使用**相同的 Chromium 引擎**，适用于大多数自动化（表单、点击、抓取、登录）。主要差异：

    - 没有可见浏览器窗口（如果需要视觉内容，请使用截图）。
    - 某些网站在无头模式下对自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 经常会阻止无头会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。
    请参阅[浏览器](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)中的完整配置示例。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、Gateway 网关和节点之间传播？">
    Telegram 消息由 **Gateway 网关**处理。Gateway 网关运行智能体，
    只有在需要节点工具时才会通过 **Gateway 网关 WebSocket** 调用节点：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    节点看不到入站提供商流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程，我的智能体如何访问我的电脑？">
    简短回答：**将你的电脑配对为节点**。Gateway 网关在其他地方运行，但它可以
    通过 Gateway 网关 WebSocket 调用你本地机器上的 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在常开主机（VPS/家用服务器）上运行 Gateway 网关。
    2. 将 Gateway 网关主机和你的电脑放在同一个 tailnet 中。
    3. 确保 Gateway 网关 WS 可访问（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以 **Remote over SSH** 模式（或直接 tailnet）
       连接，以便它注册为节点。
    5. 在 Gateway 网关上批准节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP 桥接；节点通过 Gateway 网关 WebSocket 连接。

    安全提醒：配对 macOS 节点会允许在该机器上执行 `system.run`。只
    配对你信任的设备，并查看[安全](/zh-CN/gateway/security)。

    文档：[节点](/zh-CN/nodes)、[Gateway 网关协议](/zh-CN/gateway/protocol)、[macOS 远程模式](/zh-CN/platforms/mac/remote)、[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接但没有回复。现在怎么办？">
    检查基础项：

    - Gateway 网关正在运行：`openclaw gateway status`
    - Gateway 健康：`openclaw status`
    - 渠道健康：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，请确保正确设置了 `gateway.auth.allowTailscale`。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已启动并指向正确端口。
    - 确认你的允许列表（私信或群组）包含你的账号。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[渠道](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以。没有内置的“机器人到机器人”桥接，但你可以用几种
    可靠方式把它接起来：

    **最简单：**使用两个机器人都能访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让机器人 A 给机器人 B 发送消息，然后让机器人 B 照常回复。

    **CLI 桥接（通用）：**运行一个脚本，用 `openclaw agent --message ... --deliver`
    调用另一个 Gateway 网关，目标是另一个机器人监听的聊天。如果一个机器人在远程 VPS 上，请通过 SSH/Tailscale（参见[远程访问](/zh-CN/gateway/remote)）将你的 CLI 指向该远程 Gateway 网关。

    示例模式（从可以访问目标 Gateway 网关的机器运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：添加一道防护，避免两个机器人无休止循环（仅提及、渠道
    允许列表，或“不要回复机器人消息”规则）。

    文档：[远程访问](/zh-CN/gateway/remote)、[智能体 CLI](/zh-CN/cli/agent)、[Agent 发送](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要单独的 VPS 吗？">
    不需要。一个 Gateway 网关可以托管多个智能体，每个智能体都有自己的工作区、模型默认值
    和路由。这是正常设置，而且比每个智能体运行一个 VPS 便宜、简单得多。

    只有在你需要硬隔离（安全边界）或非常
    不同且不想共享的配置时，才使用单独的 VPS。否则，请保留一个 Gateway 网关，
    并使用多个智能体或子智能体。

  </Accordion>

  <Accordion title="使用个人笔记本上的节点而不是从 VPS 通过 SSH 连接有什么好处吗？">
    有，节点是从远程 Gateway 网关访问你的笔记本的一等方式，而且提供的不只是 shell 访问。Gateway 网关运行在 macOS/Linux 上（Windows 通过 WSL2），并且很轻量（小型 VPS 或 Raspberry Pi 级别的设备就可以；4 GB RAM 已经足够），因此常见设置是一个始终在线的主机，加上你的笔记本作为节点。

    - **无需入站 SSH。** 节点会主动连接到 Gateway 网关 WebSocket，并使用设备配对。
    - **更安全的执行控制。** `system.run` 受该笔记本上的节点允许列表/审批控制。
    - **更多设备工具。** 除了 `system.run`，节点还会暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。** 将 Gateway 网关保留在 VPS 上，但通过笔记本上的节点主机在本地运行 Chrome，或通过 Chrome MCP 连接到主机上的本地 Chrome。

    SSH 适合临时 shell 访问，但对于持续的智能体工作流和设备自动化，节点更简单。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行 Gateway 网关服务吗？">
    不会。除非你有意运行隔离的配置档案（见[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)），否则每台主机只应运行**一个 Gateway 网关**。节点是连接到 Gateway 网关的外设（iOS/Android 节点，或菜单栏应用中的 macOS “节点模式”）。有关无头节点主机和 CLI 控制，请参阅[节点主机 CLI](/zh-CN/cli/node)。

    `gateway`、`discovery` 和托管插件表面变更需要完整重启。

  </Accordion>

  <Accordion title="是否有用于应用配置的 API / RPC 方式？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树及其浅层 schema 节点、匹配的 UI 提示和直接子项摘要
    - `config.get`：获取当前快照 + 哈希
    - `config.patch`：安全的局部更新（多数 RPC 编辑的首选）；可行时热重载，必要时重启
    - `config.apply`：验证并替换完整配置；可行时热重载，必要时重启
    - 面向智能体的 `gateway` 运行时工具仍会拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会规范化到相同的受保护 exec 路径

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
    最少步骤：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装并登录**
       - 使用 Tailscale 应用，并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，让 VPS 拥有稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway 网关 WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情况下访问 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这会让 Gateway 网关绑定到 loopback，并通过 Tailscale 暴露 HTTPS。参阅 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露 **Gateway 网关 Control UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接。

    推荐设置：

    1. **确保 VPS + Mac 位于同一个 tailnet**。
    2. **在远程模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       该应用会隧道化 Gateway 网关端口，并作为节点连接。
    3. **在 Gateway 网关上批准节点**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway 网关协议](/zh-CN/gateway/protocol)、[设备发现](/zh-CN/gateway/discovery)、[macOS 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装，还是只添加一个节点？">
    如果你只需要第二台笔记本上的**本地工具**（screen/camera/exec），请将它添加为**节点**。这样可以保留单个 Gateway 网关，并避免重复配置。本地节点工具目前仅支持 macOS，但我们计划将它们扩展到其他操作系统。

    只有在你需要**强隔离**或两个完全独立的机器人时，才安装第二个 Gateway 网关。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)、[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

    - 当前工作目录中的 `.env`
    - 来自 `~/.openclaw/.env` 的全局后备 `.env`（也就是 `$OPENCLAW_STATE_DIR/.env`）

    这两个 `.env` 文件都不会覆盖现有环境变量。
    提供商凭证变量是工作区 `.env` 的例外：诸如
    `GEMINI_API_KEY`、`XAI_API_KEY` 或 `MISTRAL_API_KEY` 这样的键会从工作区
    `.env` 中被忽略，应放在进程环境、`~/.openclaw/.env` 或配置 `env` 中。

    你也可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    有关完整优先级和来源，请参阅 [/environment](/zh-CN/help/environment)。

  </Accordion>

  <Accordion title="我通过服务启动了 Gateway 网关，但我的环境变量消失了。现在怎么办？">
    两个常见修复方法：

    1. 将缺失的键放入 `~/.openclaw/.env`，这样即使服务没有继承你的 shell 环境，也能读取到它们。
    2. 启用 shell 导入（选择性便利功能）：

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

    这会运行你的登录 shell，并且只导入缺失的预期键名（绝不覆盖）。等价环境变量：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但模型状态显示 “Shell env: off.” 为什么？'>
    `openclaw models status` 报告的是是否启用了 **shell 环境导入**。“Shell env: off”
    并不表示你的环境变量缺失，它只是表示 OpenClaw 不会自动加载你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。可通过以下任一方式修复：

    1. 将 token 放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将它添加到你的配置 `env` 块中（仅在缺失时应用）。

    然后重启 Gateway 网关并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot token 会从 `COPILOT_GITHUB_TOKEN` 读取（也包括 `GH_TOKEN` / `GITHUB_TOKEN`）。
    请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多个聊天

<AccordionGroup>
  <Accordion title="如何开始一段全新对话？">
    发送 `/new` 或 `/reset` 作为独立消息。参阅[会话管理](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 之后过期，但这**默认禁用**（默认值为 **0**）。
    将它设置为正值即可启用空闲过期。启用后，空闲期之后的**下一条**
    消息会为该聊天键启动一个新的会话 ID。
    这不会删除转录记录，只是开始一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法组成一个 OpenClaw 实例团队（一个 CEO 和许多智能体）？">
    有，可以通过**多智能体路由**和**子智能体**实现。你可以创建一个协调者
    智能体，以及多个拥有各自工作区和模型的工作智能体。

    不过，这更适合看作一个**有趣的实验**。它会消耗大量 token，而且通常
    不如使用一个带有独立会话的机器人高效。我们设想的典型模型是一个你与之交谈的机器人，并为并行工作使用不同会话。该机器人也可以在需要时生成子智能体。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[智能体 CLI](/zh-CN/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文会在任务中途被截断？如何避免？">
    会话上下文受模型窗口限制。长聊天、大型工具输出或大量
    文件都可能触发压缩或截断。

    有帮助的做法：

    - 让机器人总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保留在工作区中，并让机器人读回。
    - 对长时间或并行工作使用子智能体，让主聊天保持更小。
    - 如果经常发生这种情况，请选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何完全重置 OpenClaw 但保留安装？">
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

    - 如果新手引导检测到现有配置，也会提供**重置**。参阅[新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了配置档案（`--profile` / `OPENCLAW_PROFILE`），请重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅开发；会清除开发配置 + 凭证 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我遇到 “context too large” 错误，如何重置或压缩？'>
    使用以下任一方式：

    - **压缩**（保留对话，但总结较早轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 指导摘要。

    - **重置**（为同一个聊天键创建新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果持续发生：

    - 启用或调整**会话剪枝**（`agents.defaults.contextPruning`）以裁剪旧工具输出。
    - 使用上下文窗口更大的模型。

    文档：[压缩](/zh-CN/concepts/compaction)、[会话剪枝](/zh-CN/concepts/session-pruning)、[会话管理](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到 “LLM request rejected: messages.content.tool_use.input field required”？'>
    这是提供商验证错误：模型发出了缺少必需
    `input` 的 `tool_use` 块。这通常表示会话历史已过期或损坏（经常发生在长线程
    或工具/schema 变更之后）。

    修复：使用 `/new` 开始一个新会话（独立消息）。

  </Accordion>

  <Accordion title="为什么我每 30 分钟收到一次 Heartbeat 消息？">
    Heartbeat 默认每 **30m** 运行一次（使用 OAuth 凭证时为 **1h**）。可调整或禁用它们：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或 "0m" 表示禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（只有空行、
    Markdown/HTML 注释、像 `# Heading` 这样的 Markdown 标题、围栏标记，
    或空的清单占位项），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。
    如果文件缺失，Heartbeat 仍会运行，并由模型决定要做什么。

    按 Agent 覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把“机器人账号”添加到 WhatsApp 群组吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以如果你在群组中，OpenClaw 就能看到它。
    默认情况下，群组回复会被阻止，直到你允许发送者（`groupPolicy: "allowlist"`）。

    如果你只想让**你**能够触发群组回复：

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

    选项 2（如果已配置/已加入允许列表）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[目录](/zh-CN/cli/directory)、[日志](/zh-CN/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 不在群组中回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups`，但没有配置 `"*"`，并且该群组不在允许列表中。

    请参阅[群组](/zh-CN/channels/groups)和[群组消息](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/话题线程会与私信共享上下文吗？">
    直接聊天默认会折叠到主会话。群组/频道有自己的会话键，Telegram 话题 / Discord 线程是单独的会话。请参阅[群组](/zh-CN/channels/groups)和[群组消息](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制。几十个（甚至几百个）都可以，但要注意：

    - **磁盘增长：**会话 + 转录记录位于 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：**更多智能体意味着更多并发模型使用。
    - **运维开销：**每个 Agent 的凭证配置、工作区和频道路由。

    提示：

    - 每个 Agent 保持一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增长，清理旧会话（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 发现游离工作区和配置不匹配。

  </Accordion>

  <Accordion title="我可以同时运行多个机器人或聊天（Slack）吗？应该如何设置？">
    可以。使用**多 Agent 路由**运行多个隔离的智能体，并按
    频道/账号/对端路由传入消息。Slack 作为渠道受支持，并且可以绑定到特定智能体。

    浏览器访问能力很强，但并不是“人能做什么就都能做什么”——反机器人、验证码和 MFA
    仍可能阻止自动化。要获得最可靠的浏览器控制，请在主机上使用本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 常驻 Gateway 网关主机（VPS/Mac mini）。
    - 每个角色一个 Agent（绑定）。
    - Slack 渠道绑定到这些 Agent。
    - 需要时通过 Chrome MCP 或节点使用本地浏览器。

    文档：[多 Agent 路由](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [浏览器](/zh-CN/tools/browser)、[节点](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## Models、故障转移和凭证配置

模型问答——默认值、选择、别名、切换、故障转移、凭证配置——
位于 [Models 常见问题](/zh-CN/help/faq-models)。

## Gateway 网关：端口、“已在运行”和远程模式

<AccordionGroup>
  <Accordion title="Gateway 网关使用哪个端口？">
    `gateway.port` 控制 WebSocket + HTTP（Control UI、钩子等）的单个复用端口。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示“Runtime: running”但“Connectivity probe: failed”？'>
    因为“running”是**监督器**视角（launchd/systemd/schtasks）。连接探测是 CLI 实际连接到 Gateway 网关 WebSocket。

    使用 `openclaw gateway status` 并信任这些行：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（端口上实际绑定的内容）
    - `Last gateway error:`（进程存活但端口未监听时的常见根因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示的“Config (cli)”和“Config (service)”不同？'>
    你正在编辑一个配置文件，而服务正在运行另一个配置文件（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复：

    ```bash
    openclaw gateway install --force
    ```

    从你希望服务使用的同一个 `--profile` / 环境运行它。

  </Accordion>

  <Accordion title='“another gateway instance is already listening”是什么意思？'>
    OpenClaw 会在启动时立即绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`）来强制运行时锁。如果绑定因 `EADDRINUSE` 失败，它会抛出 `GatewayLockError`，表示另一个实例已在监听。

    修复：停止另一个实例、释放端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何以远程模式运行 OpenClaw（客户端连接到其他位置的 Gateway 网关）？">
    设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，可选地使用共享密钥远程凭据：

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

    - `openclaw gateway` 仅在 `gateway.mode` 为 `local` 时启动（或你传入覆盖标志）。
    - macOS 应用会监视配置文件，并在这些值变化时实时切换模式。
    - `gateway.remote.token` / `.password` 只是客户端侧远程凭据；它们本身不会启用本地 Gateway 网关认证。

  </Accordion>

  <Accordion title='Control UI 显示“unauthorized”（或不断重连）。现在怎么办？'>
    你的 Gateway 网关认证路径和 UI 的认证方式不匹配。

    事实（来自代码）：

    - Control UI 会将当前浏览器标签页会话和所选 Gateway 网关 URL 的 token 保存在 `sessionStorage` 中，因此同一标签页刷新后无需恢复长期 localStorage token 持久化即可继续工作。
    - 在 `AUTH_TOKEN_MISMATCH` 时，如果 Gateway 网关返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`），受信任客户端可以尝试使用缓存的设备 token 进行一次有界重试。
    - 该缓存 token 重试现在会复用与设备 token 一起存储的缓存已批准范围。显式 `deviceToken` / 显式 `scopes` 调用者仍会保留其请求的范围集合，而不是继承缓存范围。
    - 在该重试路径之外，连接认证优先级为显式共享 token/password 优先，然后是显式 `deviceToken`，然后是已存储设备 token，最后是 bootstrap token。
    - 内置设置代码 bootstrap 仅适用于节点。批准后，它会返回带有 `scopes: []` 的节点设备 token，不会返回移交的操作员 token。

    修复：

    - 最快：`openclaw dashboard`（打印 + 复制 dashboard URL，尝试打开；如果是无头环境则显示 SSH 提示）。
    - 如果你还没有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是远程，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。
    - 共享密钥模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的密钥。
    - Tailscale Serve 模式：确保 `gateway.auth.allowTailscale` 已启用，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份标头的原始 loopback/tailnet URL。
    - 受信任代理模式：确保你是通过配置的身份感知代理访问，而不是原始 Gateway 网关 URL。同主机 local loopback 代理还需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重试后仍然不匹配，请轮换/重新批准已配对的设备 token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该轮换调用显示被拒绝，请检查两件事：
      - 已配对设备会话只能轮换它们**自己的**设备，除非它们也拥有 `operator.admin`
      - 显式 `--scope` 值不能超过调用者当前的操作员范围
    - 仍然卡住？运行 `openclaw status --all` 并按照[故障排除](/zh-CN/gateway/troubleshooting)操作。有关认证详情，请参阅 [Dashboard](/zh-CN/web/dashboard)。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet，但它无法绑定，也没有任何监听">
    `tailnet` 绑定会从你的网络接口中选择一个 Tailscale IP（100.64.0.0/10）。如果机器不在 Tailscale 上（或接口已关闭），就没有可绑定的地址。

    修复：

    - 在该主机上启动 Tailscale（使其具有 100.x 地址），或
    - 切换到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是显式的。`auto` 优先使用 loopback；当你想要仅 tailnet 绑定时，使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一主机上运行多个 Gateway 网关吗？">
    通常不需要——一个 Gateway 网关可以运行多个消息渠道和智能体。仅在你需要冗余（例如救援机器人）或强隔离时才使用多个 Gateway 网关。

    可以，但必须隔离：

    - `OPENCLAW_CONFIG_PATH`（每实例配置）
    - `OPENCLAW_STATE_DIR`（每实例状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 每个实例使用 `openclaw --profile <name> ...`（自动创建 `~/.openclaw-<name>`）。
    - 在每个 profile 配置中设置唯一的 `gateway.port`（或为手动运行传入 `--port`）。
    - 安装每 profile 服务：`openclaw --profile <name> gateway install`。

    Profile 还会给服务名称添加后缀（`ai.openclaw.<profile>`；旧版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='“invalid handshake”/代码 1008 是什么意思？'>
    Gateway 网关是一个 **WebSocket 服务器**，它期望第一条消息是
    `connect` 帧。如果它收到其他任何内容，就会用
    **代码 1008**（策略违规）关闭连接。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`），而不是使用 WS 客户端。
    - 你使用了错误的端口或路径。
    - 代理或隧道剥离了认证标头，或发送了非 Gateway 网关请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，则使用 `wss://...`）。
    2. 不要在普通浏览器标签页中打开 WS 端口。
    3. 如果启用了认证，请在 `connect` 帧中包含 token/password。

    如果你使用的是 CLI 或 TUI，URL 应如下所示：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志和调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以通过 `logging.file` 设置稳定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快查看日志尾部：

    ```bash
    openclaw logs --follow
    ```

    服务/监督器日志（当 Gateway 网关通过 launchd/systemd 运行时）：

    - macOS launchd stdout：`~/Library/Logs/openclaw/gateway.log`（配置文件使用 `gateway-<profile>.log`；stderr 被抑制）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多信息请参阅[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 网关服务？">
    使用 Gateway 网关辅助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行 Gateway 网关，`openclaw gateway --force` 可以收回端口。请参阅 [Gateway 网关](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端，如何重启 OpenClaw？">
    有**三种 Windows 安装模式**：

    **1) Windows Hub 本地设置：**原生应用管理一个由本地应用拥有的 WSL Gateway 网关。

    从开始菜单或托盘打开 **OpenClaw Companion**，然后使用
    **Gateway Setup** 或 Connections 标签页。

    **2) 手动 WSL2 Gateway 网关：**Gateway 网关在 Linux 内运行。

    打开 PowerShell，进入 WSL，然后重启：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你从未安装服务，请在前台启动它：

    ```bash
    openclaw gateway run
    ```

    **3) 原生 Windows CLI/Gateway 网关：**Gateway 网关直接在 Windows 中运行。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行它（没有服务），请使用：

    ```powershell
    openclaw gateway run
    ```

    文档：[Windows](/zh-CN/platforms/windows)、[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="Gateway 网关已启动，但回复始终没有到达。我应该检查什么？">
    先快速检查健康状态：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - 模型凭证未在 **Gateway 网关主机**上加载（检查 `models status`）。
    - 渠道配对/允许列表阻止回复（检查渠道配置 + 日志）。
    - WebChat/Dashboard 已打开但没有正确的令牌。

    如果你在远程访问，请确认隧道/Tailscale 连接已启动，并且
    Gateway 网关 WebSocket 可访问。

    文档：[Channels](/zh-CN/channels)、[故障排除](/zh-CN/gateway/troubleshooting)、[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 现在怎么办？'>
    这通常意味着 UI 丢失了 WebSocket 连接。请检查：

    1. Gateway 网关是否正在运行？`openclaw gateway status`
    2. Gateway 网关是否健康？`openclaw status`
    3. UI 是否有正确的令牌？`openclaw dashboard`
    4. 如果是远程访问，隧道/Tailscale 链接是否已启动？

    然后查看日志尾部：

    ```bash
    openclaw logs --follow
    ```

    文档：[Dashboard](/zh-CN/web/dashboard)、[远程访问](/zh-CN/gateway/remote)、[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败。我应该检查什么？">
    从日志和渠道状态开始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后匹配错误：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目过多。OpenClaw 已经会裁剪到 Telegram 限制并用更少命令重试，但仍然需要删除一些菜单条目。减少插件/技能/自定义命令，或者如果你不需要菜单，请禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你在 VPS 上或位于代理后面，请确认允许出站 HTTPS，并且 DNS 可解析 `api.telegram.org`。

    如果 Gateway 网关在远程，请确保你查看的是 Gateway 网关主机上的日志。

    文档：[Telegram](/zh-CN/channels/telegram)、[渠道故障排除](/zh-CN/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有显示输出。我应该检查什么？">
    先确认 Gateway 网关可达，并且智能体可以运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你期望在聊天
    渠道中收到回复，请确保已启用投递（`/deliver on`）。

    文档：[TUI](/zh-CN/web/tui)、[斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止然后启动 Gateway 网关？">
    如果你安装了服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这会停止/启动**受监督的服务**（macOS 上的 launchd，Linux 上的 systemd）。
    当 Gateway 网关作为守护进程在后台运行时使用它。

    如果你在前台运行，请用 Ctrl-C 停止，然后：

    ```bash
    openclaw gateway run
    ```

    文档：[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 与 openclaw gateway">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在此终端会话中**以前台方式**运行 Gateway 网关。

    如果你安装了服务，请使用 gateway 命令。当你想要一次性的前台运行时，
    使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出现失败时获取更多细节的最快方法">
    使用 `--verbose` 启动 Gateway 网关，以获取更多控制台细节。然后检查日志文件中的渠道凭证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的技能生成了图像/PDF，但什么也没发送">
    智能体的出站附件必须使用结构化媒体字段，例如 `media`、`mediaUrl`、`path` 或 `filePath`。请参阅 [OpenClaw 助手设置](/zh-CN/start/openclaw)和[智能体发送](/zh-CN/tools/agent-send)。

    CLI 发送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    还要检查：

    - 目标渠道支持出站媒体，并且没有被允许列表阻止。
    - 文件在提供商的大小限制内（图像会调整到最大 2048px）。
    - `tools.fs.workspaceOnly=true` 会将本地路径发送限制在工作区、临时/媒体存储和经过沙箱验证的文件中。
    - `tools.fs.workspaceOnly=false` 允许结构化本地媒体发送使用智能体已经可以读取的主机本地文件，但仅限媒体以及安全文档类型（图像、音频、视频、PDF、Office 文档，以及经过验证的文本文档，例如 Markdown/MD、TXT、JSON、YAML 和 YML）。这不是秘密扫描器：当扩展名和内容验证匹配时，智能体可读的 `secret.txt` 或 `config.json` 可以被附加。将敏感文件放在智能体可读路径之外，或保留 `tools.fs.workspaceOnly=true` 以获得更严格的本地路径发送。

    请参阅[图像](/zh-CN/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全和访问控制

<AccordionGroup>
  <Accordion title="将 OpenClaw 暴露给入站私信安全吗？">
    将入站私信视为不可信输入。默认值旨在降低风险：

    - 支持私信的渠道上的默认行为是**配对**：
      - 未知发送者会收到配对码；机器人不会处理他们的消息。
      - 使用以下命令批准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求上限为**每个渠道 3 个**；如果代码没有到达，请检查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公开开放私信需要显式选择加入（`dmPolicy: "open"` 和允许列表 `"*"`）。

    运行 `openclaw doctor` 以暴露有风险的私信策略。

  </Accordion>

  <Accordion title="提示注入只是公共机器人的问题吗？">
    不是。提示注入关乎**不可信内容**，不只是哪些人可以给机器人发私信。
    如果你的助手读取外部内容（Web 搜索/获取、浏览器页面、电子邮件、
    文档、附件、粘贴的日志），这些内容可能包含试图
    劫持模型的指令。即使**你是唯一发送者**，这也可能发生。

    最大的风险出现在启用工具时：模型可能被诱导
    泄露上下文或代表你调用工具。通过以下方式降低影响范围：

    - 使用只读或禁用工具的“reader”智能体来总结不可信内容
    - 对启用工具的智能体关闭 `web_search` / `web_fetch` / `browser`
    - 也将解码后的文件/文档文本视为不可信内容：OpenResponses
      `input_file` 和媒体附件提取都会将提取文本包裹在
      显式的外部内容边界标记中，而不是传递原始文件文本
    - 使用沙箱隔离和严格的工具允许列表

    详情：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw 使用 TypeScript/Node 而不是 Rust/WASM，会不会更不安全？">
    语言和运行时很重要，但它们不是个人
    智能体的主要风险。OpenClaw 的实际风险是 Gateway 网关暴露、谁可以给
    机器人发消息、提示注入、工具范围、凭证处理、浏览器访问、exec
    访问，以及第三方技能或插件信任。

    Rust 和 WASM 可以为某些代码类别提供更强隔离，但
    它们无法解决提示注入、糟糕的允许列表、公开 Gateway 网关暴露、
    过宽的工具，或已经登录敏感
    账户的浏览器配置文件。将这些视为主要控制项：

    - 保持 Gateway 网关私有或已认证
    - 对私信和群组使用配对和允许列表
    - 对不可信输入拒绝或沙箱隔离风险工具
    - 只安装可信插件和技能
    - 配置变更后运行 `openclaw security audit --deep`

    详情：[安全](/zh-CN/gateway/security)、[沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="我看到了关于暴露的 OpenClaw 实例的报告。我应该检查什么？">
    先检查你的实际部署：

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    更安全的基线是：

    - Gateway 网关绑定到 `loopback`，或仅通过已认证的私有
      访问暴露，例如 tailnet、SSH 隧道、令牌/密码认证，或正确
      配置的受信任代理
    - 私信处于 `pairing` 或 `allowlist` 模式
    - 群组已加入允许列表，并且除非每个成员都可信，否则需要提及才能触发
    - 对读取不可信内容的智能体，拒绝或严格
      限定高风险工具（`exec`、`browser`、`gateway`、`cron`）
    - 在工具执行需要更小影响范围的地方启用沙箱隔离

    无认证的公开绑定、带工具的开放私信/群组，以及暴露的浏览器
    控制，是最先需要修复的问题。详情：
    [安全审计清单](/zh-CN/gateway/security#security-audit-checklist)。

  </Accordion>

  <Accordion title="ClawHub 技能和第三方插件安装起来安全吗？">
    将第三方技能和插件视为你选择信任的代码。
    ClawHub 技能页面会在安装前展示扫描状态，但扫描并不是
    完整的安全边界。OpenClaw 在插件或技能安装/更新流程中不会运行内置本地
    危险代码阻断；请使用
    操作员拥有的 `security.installPolicy` 来做本地允许/阻止决策。

    更安全的模式：

    - 优先选择可信作者和固定版本
    - 启用前阅读技能或插件
    - 保持插件和技能允许列表尽可能窄
    - 在最少工具的沙箱中运行不可信输入工作流
    - 避免授予第三方代码宽泛的文件系统、exec、浏览器或秘密访问权限

    Details: [Skills](/zh-CN/tools/skills), [插件](/zh-CN/tools/plugin),
    [安全](/zh-CN/gateway/security).

  </Accordion>

  <Accordion title="Should my bot have its own email, GitHub account, or phone number?">
    是的，对大多数设置都是如此。用单独的账号和电话号码隔离机器人，
    可以在出问题时降低影响范围。这也让你更容易轮换
    凭证或撤销访问权限，而不影响你的个人账号。

    从小处开始。只授予实际需要的工具和账号访问权限，必要时再
    扩展。

    文档：[安全](/zh-CN/gateway/security)、[配对](/zh-CN/channels/pairing)。

  </Accordion>

  <Accordion title="Can I give it autonomy over my text messages and is that safe?">
    我们**不**建议让它完全自主处理你的个人消息。最安全的模式是：

    - 将私信保持在**配对模式**或严格的允许列表中。
    - 如果你希望它代表你发送消息，请使用**单独的号码或账号**。
    - 让它起草，然后**发送前审批**。

    如果你想实验，请在专用账号上进行并保持隔离。参见
    [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Can I use cheaper models for personal assistant tasks?">
    可以，**前提是**智能体仅用于聊天且输入可信。较小的层级
    更容易受到指令劫持影响，因此请避免将它们用于启用工具的智能体，
    或用于读取不可信内容。如果必须使用较小的模型，请锁定
    工具并在沙箱内运行。参见 [安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="I ran /start in Telegram but did not get a pairing code">
    只有当未知发送者给机器人发消息，并且启用了
    `dmPolicy: "pairing"` 时，才会发送配对码。`/start` 本身不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即访问，请将你的发送者 id 加入允许列表，或为该账号设置
    `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp: will it message my contacts? How does pairing work?">
    不会。默认 WhatsApp 私信策略是**配对**。未知发送者只会收到配对码，其消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或回复你显式触发的发送。

    使用以下命令批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导电话号码提示：它用于设置你的**允许列表/所有者**，以便允许你自己的私信。它不会用于自动发送。如果你在个人 WhatsApp 号码上运行，请使用该号码并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任务以及“它不会停下来”

<AccordionGroup>
  <Accordion title="How do I stop internal system messages from showing in chat?">
    大多数内部消息或工具消息只会在该会话启用 **verbose**、**trace** 或 **reasoning** 时出现。

    在你看到它的聊天中修复：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很嘈杂，请检查 Control UI 中的会话设置，并将 verbose
    设置为**继承**。同时确认你没有使用在配置中将 `verboseDefault` 设置为
    `on` 的机器人配置文件。

    文档：[思考和 verbose](/zh-CN/tools/thinking)、[安全](/zh-CN/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="How do I stop/cancel a running task?">
    将以下任一内容**作为独立消息**发送（不带斜杠）：

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

    这些是中止触发词（不是斜杠命令）。

    对于后台进程（来自 exec 工具），你可以要求智能体运行：

    ```
    process action:kill sessionId:XXX
    ```

    斜杠命令概览：参见 [斜杠命令](/zh-CN/tools/slash-commands)。

    大多数命令必须作为以 `/` 开头的**独立**消息发送，但少数快捷方式（如 `/status`）也可由允许列表中的发送者在行内使用。

  </Accordion>

  <Accordion title='How do I send a Discord message from Telegram? ("Cross-context messaging denied")'>
    OpenClaw 默认阻止**跨提供商**消息传递。如果工具调用绑定到
    Telegram，除非你显式允许，否则它不会发送到 Discord。

    为智能体启用跨提供商消息传递：

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

    编辑配置后重启 Gateway 网关。

  </Accordion>

  <Accordion title='Why does it feel like the bot "ignores" rapid-fire messages?'>
    默认情况下，运行中的提示会被 Steer 到活动运行中。使用 `/queue` 选择活动运行行为：

    - `steer` - 在下一个模型边界引导活动运行
    - `followup` - 将消息排队，并在当前运行结束后逐条运行
    - `collect` - 将兼容消息排队，并在当前运行结束后统一回复一次
    - `interrupt` - 中止当前运行并重新开始

    默认模式是 `steer`。你可以为排队模式添加类似 `debounce:0.5s cap:25 drop:summarize` 的选项。参见 [命令队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 杂项

<AccordionGroup>
  <Accordion title='What is the default model for Anthropic with an API key?'>
    在 OpenClaw 中，凭证和模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在认证配置文件中存储 Anthropic API 密钥）会启用认证，但实际默认模型取决于你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这表示 Gateway 网关无法在正在运行的智能体预期的 `auth-profiles.json` 中找到 Anthropic 凭证。
  </Accordion>
</AccordionGroup>

---

仍然卡住？请在 [Discord](https://discord.com/invite/clawd) 提问，或发起 [GitHub 讨论](https://github.com/openclaw/openclaw/discussions)。

## 相关

- [首次运行常见问题](/zh-CN/help/faq-first-run) — 安装、新手引导、认证、订阅、早期故障
- [模型常见问题](/zh-CN/help/faq-models) — 模型选择、故障转移、认证配置文件
- [故障排除](/zh-CN/help/troubleshooting) — 按症状优先排查
