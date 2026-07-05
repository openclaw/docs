---
read_when:
    - 解答常见的设置、安装、新手引导或运行时支持问题
    - 在深入调试前对用户报告的问题进行分诊
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-07-05T11:23:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ad033bbe300af0c0f769fc2729ee17f0fbab9facdb3c640be23f9e9a5bd01ab
    source_path: help/faq.md
    workflow: 16
---

面向真实环境设置（本地开发、VPS、多 Agent、OAuth/API keys、模型故障转移）的快速答案和深入故障排查。运行时诊断见 [故障排查](/zh-CN/gateway/troubleshooting)。完整配置参考见 [配置](/zh-CN/gateway/configuration)。

## 最初的六十秒：如果出现故障

<Steps>
  <Step title="快速状态">
    ```bash
    openclaw status
    ```
    快速本地摘要：OS + 更新、Gateway 网关/服务可达性、智能体/会话、提供商配置 + 运行时问题（当 Gateway 网关可达时）。
  </Step>
  <Step title="可粘贴报告（可安全分享）">
    ```bash
    openclaw status --all
    ```
    只读诊断，包含日志尾部（令牌已脱敏）。
  </Step>
  <Step title="守护进程 + 端口状态">
    ```bash
    openclaw gateway status
    ```
    显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用的配置。
  </Step>
  <Step title="深度探测">
    ```bash
    openclaw status --deep
    ```
    实时 Gateway 网关健康探测，包括受支持时的渠道探测（需要可达的 Gateway 网关）。见 [健康](/zh-CN/gateway/health)。
  </Step>
  <Step title="跟踪最新日志">
    ```bash
    openclaw logs --follow
    ```
    如果 RPC 已关闭，回退到：
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    文件日志与服务日志分开；见 [日志](/zh-CN/logging) 和 [故障排查](/zh-CN/gateway/troubleshooting)。
  </Step>
  <Step title="运行 Doctor（修复）">
    ```bash
    openclaw doctor
    ```
    修复/迁移配置和状态，然后运行健康检查。见 [Doctor](/zh-CN/gateway/doctor)。
  </Step>
  <Step title="Gateway 网关快照（仅 WS）">
    ```bash
    openclaw health --json
    openclaw health --verbose   # shows the target URL + config path on errors
    ```
    向正在运行的 Gateway 网关请求完整快照。见 [健康](/zh-CN/gateway/health)。
  </Step>
</Steps>

## 快速开始和首次运行设置

首次运行问答 - 安装、引导设置、凭证路由、订阅、初始失败 - 位于 [首次运行常见问题](/zh-CN/help/faq-first-run)。

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段话说明 OpenClaw 是什么？">
    OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它会在你已经使用的消息界面中回复（Discord、Google Chat、iMessage、Mattermost、Signal、Slack、Telegram、WebChat、WhatsApp，以及 QQ Bot 等内置渠道插件），并且在受支持的平台上还可以提供语音和实时 Canvas。**Gateway 网关** 是常驻控制平面；助手才是产品。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不是“只是一个 Claude 包装器”。它是一个 **local-first 控制平面**，在 **你的自有硬件** 上运行能力完善的助手，可从你已经使用的聊天应用访问，具备有状态会话、记忆和工具，并且不会把你的工作流交给托管 SaaS。

    - **你的设备，你的数据**：在任何你想要的位置运行 Gateway 网关（Mac、Linux、VPS），并让工作区和会话历史保留在本地。
    - **真实渠道，而不是 Web 沙箱**：Discord/iMessage/Signal/Slack/Telegram/WhatsApp/等等，加上受支持平台上的移动语音和 Canvas。
    - **模型无关**：使用 Anthropic、MiniMax、OpenAI、OpenRouter 等，并支持按智能体路由和故障转移。
    - **仅本地选项**：运行本地模型，让所有数据都能留在你的设备上。
    - **多 Agent 路由**：按渠道、账号或任务拆分独立智能体，每个都有自己的工作区和默认值。
    - **开源且可改造**：无需供应商锁定即可检查、扩展和自托管。

    文档：[Gateway 网关](/zh-CN/gateway)、[渠道](/zh-CN/channels)、[多 Agent](/zh-CN/concepts/multi-agent)、[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚设置好，第一步应该做什么？">
    适合的第一个项目：构建网站（WordPress、Shopify 或静态站点）；制作移动应用原型（大纲、界面、API 计划）；整理文件和文件夹；连接 Gmail 并自动化摘要或后续跟进。

    它可以处理大型任务，但最好拆成多个阶段，并用子智能体并行工作。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常用例是什么？">
    - **个人简报**：汇总你关心的收件箱、日历和新闻。
    - **研究和起草**：快速研究、摘要，以及邮件或文档的初稿。
    - **提醒和后续跟进**：由 cron 或 Heartbeat 驱动的提醒和清单。
    - **浏览器自动化**：填写表单、收集数据、重复执行 Web 任务。
    - **跨设备协作**：从手机发送任务，让 Gateway 网关在服务器上运行，并在聊天中取回结果。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做获客、外联、广告和博客吗？">
    可以，用于 **研究、筛选和起草**：扫描网站、构建候选名单、总结潜在客户、撰写外联或广告文案草稿。

    对于 **外联或广告投放**，请保留人工审核。避免垃圾信息，遵守当地法律和平台政策，并在发送前审查所有内容。让 OpenClaw 起草；由你批准。

    文档：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比，OpenClaw 在 Web 开发方面有哪些优势？">
    OpenClaw 是 **个人助手** 和协调层，不是 IDE 替代品。若要在仓库中获得最快的直接编码循环，请使用 Claude Code 或 Codex。使用 OpenClaw 获得持久记忆、跨设备访问和工具编排。

    - 跨会话持久记忆和工作区。
    - 多平台访问（Telegram、WhatsApp、TUI、WebChat）。
    - 工具编排（浏览器、文件、调度、Hooks）。
    - 常驻 Gateway 网关（运行在 VPS 上，可从任何地方交互）。
    - 用于本地浏览器/屏幕/摄像头/exec 的节点。

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)。

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何在不让仓库变脏的情况下自定义 Skills？">
    使用托管覆盖，而不是编辑仓库副本。把更改放在 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级：`<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> 内置 -> `skills.load.extraDirs`，因此托管覆盖会优先于内置 Skills，且不触碰 git。若要全局安装但仅让部分智能体可见，请将共享副本保留在 `~/.openclaw/skills` 中，并用 `agents.defaults.skills` / `agents.list[].skills` 控制可见性。只有值得上游合并的编辑才应作为 PR 提交到仓库副本。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 Skills 吗？">
    可以：通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加目录（在上述顺序中优先级最低）。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。若要限制某些智能体的可见性，请搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型或设置？">
    支持的模式：

    - **Cron 作业**：隔离作业可以按作业设置 `model` 覆盖。
    - **智能体**：将任务路由到不同的智能体，这些智能体具有不同的默认模型、思考级别和流参数。
    - **按需切换**：`/model` 可随时切换当前会话模型。

    示例 - 相同模型，不同的按智能体设置：

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

    将共享的按模型默认值放在 `agents.defaults.models["provider/model"].params` 中，然后将特定智能体覆盖放在扁平的 `agents.list[].params` 中。不要在嵌套的 `agents.list[].models["provider/model"].params` 下重复相同模型；该路径用于按智能体的模型目录和运行时覆盖。

    见 [Cron 作业](/zh-CN/automation/cron-jobs)、[多 Agent 路由](/zh-CN/concepts/multi-agent)、[配置](/zh-CN/gateway/config-agents)、[斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="Bot 在执行繁重工作时卡住。如何卸载这类任务？">
    对长任务或并行任务使用 **子智能体**：它们在自己的会话中运行，返回摘要，并保持你的主聊天响应正常。让 Bot “为此任务生成一个子智能体”，或使用 `/subagents`。使用 `/status` 查看 Gateway 网关当前是否忙碌。

    长任务和子智能体都会消耗令牌；如果成本很重要，可通过 `agents.defaults.subagents.model` 为子智能体设置更便宜的模型。

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上绑定线程的子智能体会话如何工作？">
    将 Discord 线程绑定到子智能体或会话目标，这样该处的后续消息会保留在绑定的会话上。

    - 使用 `sessions_spawn` 并设置 `thread: true` 来生成（可选设置 `mode: "session"` 以便持久后续跟进）。
    - 或使用 `/focus <target>` 手动绑定。
    - `/agents` 检查绑定状态。
    - `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - `/unfocus` 分离该线程。

    配置：`session.threadBindings.enabled`（全局开关）、`session.threadBindings.idleHours`（默认 `24`，`0` 表示禁用）、`session.threadBindings.maxAgeHours`（默认 `0` = 无硬上限），以及按渠道覆盖 `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`。`channels.discord.threadBindings.spawnSessions` 控制生成时自动绑定（默认 `true`）。

    文档：[子智能体](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[配置参考](/zh-CN/gateway/configuration-reference)、[斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="子智能体已完成，但完成更新发到了错误位置或从未发布。我应该检查什么？">
    检查解析后的请求者路由：

    - 完成模式的子智能体交付会优先使用已绑定线程或会话路由（如果存在）。
    - 如果完成来源只携带渠道，OpenClaw 会回退到请求者会话的已存储路由（`lastChannel` / `lastTo` / `lastAccountId`），因此直接交付仍可成功。
    - 没有绑定路由且没有可用的已存储路由：直接交付可能失败，结果会回退到排队会话交付，而不是立即发布。
    - 无效或过期目标也可能强制队列回退或导致最终交付失败。
    - 如果子会话最后一条可见助手回复正好是 `NO_REPLY` / `no_reply` 或 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制公告，而不是发布过期的早期进度。

    调试：`openclaw tasks show <lookup>`，其中 `<lookup>` 是任务 id、运行 id 或会话键。

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)、[会话工具](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我应该检查什么？">
    Cron 在 Gateway 网关进程内运行；如果 Gateway 网关没有持续运行，它不会触发。

    - 确认 cron 已启用（`cron.enabled`）且未设置 `OPENCLAW_SKIP_CRON`。
    - 确认 Gateway 网关 24/7 运行（没有休眠/重启）。
    - 验证作业时区（`--tz` 与主机时区）。

    调试：
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[自动化](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 已触发，但没有向渠道发送任何内容。为什么？">
    检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"`：预期不会有运行器回退发送。
    - 缺失或无效的公告目标（`channel` / `to`）：运行器跳过了出站投递。
    - 渠道认证失败（`unauthorized`、`Forbidden`）：运行器尝试投递，但凭证阻止了它。
    - 静默的隔离结果（仅 `NO_REPLY` / `no_reply`）会被视为有意不可投递，因此排队的回退投递也会被抑制。

    对于隔离的 Cron 作业，当聊天路由可用时，智能体仍然可以使用 `message` 工具直接发送。`--announce` 只控制运行器对智能体尚未自行发送的最终文本进行回退投递。

    调试：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离的 Cron 运行会切换模型或重试一次？">
    这是实时模型切换路径，不是重复调度。隔离 Cron 会持久化运行时模型移交，并在活动运行抛出 `LiveSessionModelSwitchError` 时重试，在重试前保留已切换的提供商/模型（以及任何已切换的认证配置文件覆盖）。

    模型选择优先级：先是 Gmail 钩子模型覆盖（`hooks.gmail.model`），然后是每个作业的 `model`，再是任何已存储的 Cron 会话模型覆盖，最后是普通的智能体/默认模型选择。

    重试循环限制为初始尝试加 2 次切换重试；随后 Cron 会中止，而不是无限循环。

    调试：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[Cron CLI](/zh-CN/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或将 Skills 放入你的工作区；macOS Skills UI 在 Linux 上不可用。可在 [https://clawhub.ai](https://clawhub.ai) 浏览 Skills。

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

    原生 `openclaw skills install` 默认写入活动工作区的 `skills/` 目录。添加 `--global` 可安装到供所有本地智能体使用的共享托管 Skills 目录。仅在发布或同步你自己的 Skills 时，才安装单独的 `clawhub` CLI。使用 `agents.defaults.skills` 或 `agents.list[].skills` 来限定哪些智能体可以看到共享 Skills。

  </Accordion>

  <Accordion title="OpenClaw 能否按计划或在后台持续运行任务？">
    可以，通过 Gateway 网关调度器：

    - **Cron 作业**用于计划任务或周期性任务（重启后仍会保留）。
    - **Heartbeat** 用于主会话的周期性检查。
    - **隔离作业**用于发布摘要或投递到聊天的自主智能体。

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[自动化](/zh-CN/automation)、[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以从 Linux 运行仅限 Apple macOS 的 Skills 吗？">
    不能直接运行。macOS Skills 受 `metadata.openclaw.os` 和必需二进制文件限制，并且只有在 **Gateway 网关主机**上符合条件时才会加载。在 Linux 上，除非你覆盖限制，否则仅限 `darwin` 的 Skills（`apple-notes`、`apple-reminders`、`things-mac`）不会加载。

    三种受支持的模式：

    **选项 A - 在 Mac 上运行 Gateway 网关（最简单）**。在存在 macOS 二进制文件的位置运行 Gateway 网关，然后从 Linux 以[远程模式](#gateway-ports-already-running-and-remote-mode)或通过 Tailscale 连接。因为 Gateway 网关主机是 macOS，Skills 会正常加载。

    **选项 B - 使用 macOS 节点（无需 SSH）**。在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并在 Mac 上将 **节点运行命令**设为“始终询问”或“始终允许”。当节点上存在必需二进制文件时，OpenClaw 会将仅限 macOS 的 Skills 视为符合条件；智能体会通过 `nodes` 工具运行它们。使用“始终询问”时，在提示中批准“始终允许”会将该命令添加到允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）**。将 Gateway 网关保留在 Linux 上，但让必需的 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器，然后覆盖 Skill 以允许 Linux，使其保持符合条件。

    1. 为二进制文件创建 SSH 包装器（示例：Apple Notes 的 `memo`）：
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. 将包装器放到 Linux 主机上的 `PATH` 中（例如 `~/bin/memo`）。
    3. 覆盖 Skill 元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：
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
    目前没有内置。选项：

    - **自定义 Skill / 插件**：最适合可靠的 API 访问（两者都有 API）。
    - **浏览器自动化**：无需代码也能工作，但更慢且更脆弱。

    对于代理机构风格的按客户上下文：为每个客户保留一个 Notion 页面（上下文 + 偏好 + 活跃工作），并让智能体在会话开始时获取该页面。

    对于原生集成，可以提交功能请求，或基于这些 API 构建 Skill。

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    原生安装会落到活动工作区的 `skills/` 目录；使用 `--global` 可面向所有本地智能体，或配置 `agents.defaults.skills` / `agents.list[].skills` 来限制可见性。有些 Skills 需要通过 Homebrew 安装的二进制文件；在 Linux 上这意味着 Linuxbrew。

    参见 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)、[ClawHub](/zh-CN/clawhub)。

  </Accordion>

  <Accordion title="如何让 OpenClaw 使用我现有的已登录 Chrome？">
    使用内置的 `user` 浏览器配置文件，它通过 Chrome DevTools MCP 连接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如需自定义名称，请创建显式 MCP 配置文件：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    这可以使用本地主机浏览器或已连接的浏览器节点。如果 Gateway 网关在其他位置运行，请在浏览器所在机器上运行节点主机，或改用远程 CDP。

    与托管的 `openclaw` 配置文件相比，`existing-session` / `user` 配置文件当前的限制：

    - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照引用，而不是 CSS 选择器。
    - 上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。
    - `responsebody`、PDF 导出、下载拦截和批量操作仍然需要托管浏览器路径。

    完整对比见[浏览器](/zh-CN/tools/browser#existing-session-via-chrome-devtools-mcp)。

  </Accordion>
</AccordionGroup>

## 沙箱隔离和记忆

<AccordionGroup>
  <Accordion title="有专门的沙箱隔离文档吗？">
    有：[沙箱隔离](/zh-CN/gateway/sandboxing)。Docker 专用设置（在 Docker 中运行完整 Gateway 网关或使用沙箱镜像）见 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉受限，如何启用完整功能？">
    默认镜像以安全优先，并以 `node` 用户运行，因此不包含系统软件包、Homebrew 和内置浏览器。如需更完整的设置：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，让缓存保留。
    - 使用 `OPENCLAW_IMAGE_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：`node /app/node_modules/playwright-core/cli.js install chromium`。
    - 设置 `PLAYWRIGHT_BROWSERS_PATH` 并持久化该路径。

    文档：[Docker](/zh-CN/install/docker)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我能否用一个智能体让私信保持私密，同时让群组公开/沙箱隔离？">
    可以，前提是私密流量是**私信**，公开流量是**群组**。设置 `agents.defaults.sandbox.mode: "non-main"`，使群组/渠道会话（非主键）在配置的沙箱后端中运行，而主私信会话保留在主机上。启用沙箱隔离后，Docker 是默认后端。通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置演练：[群组：个人私信 + 公开群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)。关键参考：[Gateway 配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="如何将主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:container:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局绑定和按智能体绑定会合并；当 `scope: "shared"` 时，按智能体绑定会被忽略。对任何敏感内容使用 `:ro`；绑定会绕过沙箱文件系统边界。

    OpenClaw 会同时根据规范化路径，以及通过最深已存在祖先解析出的规范路径来验证绑定源，因此即使最终路径段尚不存在，通过符号链接父级逃逸也会失败关闭。

    参见[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)和[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="记忆如何工作？">
    OpenClaw 记忆是智能体工作区中的 Markdown 文件：每日笔记位于 `memory/YYYY-MM-DD.md`，精选长期笔记位于 `MEMORY.md`（仅主会话/私密会话）。

    OpenClaw 还会在压缩总结对话前运行静默的**压缩前记忆刷新**，提醒模型先写入持久笔记。它只会在工作区可写时运行（只读沙箱会跳过）；可用 `agents.defaults.compaction.memoryFlush.enabled: false` 禁用。参见[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="记忆总是忘事。如何让它记住？">
    要求机器人**将事实写入记忆**：长期笔记放在 `MEMORY.md`，短期上下文放在 `memory/YYYY-MM-DD.md`。提醒模型存储记忆通常可以解决问题。如果它仍然忘记，请验证 Gateway 网关每次运行都使用同一个工作区。

    文档：[记忆](/zh-CN/concepts/memory)、[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永久保留吗？有什么限制？">
    记忆文件保存在磁盘上，并会一直保留直到被删除；限制来自你的存储空间，而不是模型。**会话上下文**仍受模型上下文窗口限制，因此长对话可能会压缩或截断 - 这就是记忆搜索存在的原因，它只会把相关部分拉回上下文。

    文档：[记忆](/zh-CN/concepts/memory)、[上下文](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索是否需要 OpenAI API key？">
    只有在你使用 **OpenAI embeddings** 时才需要，而这是默认提供商。Codex OAuth 覆盖聊天/补全，并**不会**授予 embeddings 访问权限，因此使用 Codex 登录（OAuth 或 Codex CLI 登录）不会启用语义记忆搜索。OpenAI embeddings 仍然需要真实的 API key（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    若要保持本地运行，请设置 `agents.defaults.memorySearch.provider: "local"`（GGUF/llama.cpp）。其他受支持的提供商：Bedrock、DeepInfra、Gemini（`GEMINI_API_KEY` 或 `memorySearch.remote.apiKey`）、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI 兼容接口和 Voyage。设置详情见 [记忆](/zh-CN/concepts/memory) 和 [记忆搜索](/zh-CN/concepts/memory-search)。

  </Accordion>
</AccordionGroup>

## 这些内容在磁盘上的位置

<AccordionGroup>
  <Accordion title="与 OpenClaw 一起使用的所有数据都会保存在本地吗？">
    不会：**OpenClaw 自身的状态是本地的**，但**外部服务仍会看到你发送给它们的内容**。

    - **默认本地**：会话、记忆文件、配置和工作区位于 Gateway 网关主机上（`~/.openclaw` 加上你的工作区目录）。
    - **必要时远程**：发送给模型提供商（Anthropic/OpenAI 等）的消息会进入它们的 API，聊天平台（Slack/Telegram/WhatsApp 等）会在它们的服务器上存储消息数据。
    - **你控制占用范围**：本地模型会把提示词留在你的机器上，但渠道流量仍会经过该渠道的服务器。

    相关：[Agent 工作区](/zh-CN/concepts/agent-workspace)、[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 将数据存储在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                             | 用途                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | 主配置（JSON5）                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | 旧版 OAuth 导入（首次使用时复制到认证配置文件）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | 认证配置文件（OAuth、API key、可选 `keyRef`/`tokenRef`）        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef 提供商的可选文件后端密钥载荷   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | 旧版兼容文件（静态 `api_key` 条目已清理）        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | 每个智能体的状态（agentDir + 会话）                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | 对话历史和状态（每个智能体）                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`       | 会话元数据（每个智能体）                                        |

    旧版单智能体路径 `~/.openclaw/agent/*` 会由 `openclaw doctor` 迁移。

    你的**工作区**（AGENTS.md、记忆文件、Skills 等）是独立的，通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于 **Agent 工作区**，而不是 `~/.openclaw`。

    - **工作区（每个智能体）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。小写根文件 `memory.md` 仅作为旧版修复输入；当两者同时存在时，`openclaw doctor --fix` 可以将它合并到 `MEMORY.md`。
    - **状态目录（`~/.openclaw`）**：配置、渠道/提供商状态、认证配置文件、会话、日志、共享 Skills（`~/.openclaw/skills`）。

    默认工作区是 `~/.openclaw/workspace`，可配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“忘记”内容，请确认每次启动时 Gateway 网关都使用同一个工作区（远程模式使用的是 **gateway 主机的**工作区，而不是你的本地笔记本电脑）。

    提示：对于持久行为或偏好，请让机器人**将其写入 AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    见 [Agent 工作区](/zh-CN/concepts/agent-workspace) 和 [记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我可以让 SOUL.md 更大吗？">
    可以。`SOUL.md` 是注入智能体上下文的工作区引导文件之一。默认单文件注入限制是 `20000` 个字符；所有文件的总引导预算是 `60000` 个字符。

    更改共享默认值：

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

    或在 `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` 下覆盖某个智能体。

    使用 `/context` 检查原始大小与注入大小，以及是否发生截断。让 `SOUL.md` 聚焦于语气、立场和人格；将操作规则放在 `AGENTS.md`，将持久事实放在记忆中。

    见 [上下文](/zh-CN/concepts/context) 和 [Agent 配置](/zh-CN/gateway/config-agents)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的 **Agent 工作区**放入一个**私有** git 仓库，并备份到某个私有位置（例如 GitHub private）。这会捕获记忆以及 AGENTS/SOUL/USER 文件，并让你稍后恢复助手的“思维”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、令牌、加密的密钥载荷）。如需完整恢复，请分别备份工作区和状态目录。

    文档：[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何彻底卸载 OpenClaw？">
    见 [卸载](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，不是硬性沙箱。相对路径会在工作区内解析；除非启用沙箱隔离，否则绝对路径可以访问其他主机位置。如需隔离，请使用 [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每智能体沙箱设置。要将某个仓库设为默认工作目录，请将该智能体的 `workspace` 指向仓库根目录 - OpenClaw 仓库本身只是源代码，因此除非你有意让智能体在其中工作，否则请保持工作区独立。

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
    会话状态归 **gateway 主机**所有。在远程模式下，你关心的会话存储位于远程机器上，而不是你的本地笔记本电脑。见 [会话管理](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH`（默认：`~/.openclaw/openclaw.json`）读取可选的 **JSON5** 配置。如果文件缺失，它会使用相对安全的默认值，包括默认工作区 `~/.openclaw/workspace`。
  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何监听 / UI 显示未授权'>
    非 loopback 绑定**需要有效的 gateway 认证路径**：共享密钥认证（令牌或密码），或位于正确配置的身份感知反向代理之后的 `gateway.auth.mode: "trusted-proxy"`。

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

    - `gateway.remote.token` / `.password` 本身**不会**启用本地 gateway 认证；只有在未设置 `gateway.auth.*` 时，本地调用路径才可以将 `gateway.remote.*` 作为回退使用。
    - 对于密码认证，请设置 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `.password` 但无法解析，解析会失败关闭（不会用远程回退掩盖问题）。
    - 共享密钥 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（存储在应用/UI 设置中）。Tailscale Serve 或 `trusted-proxy` 等带身份的模式改用请求标头 - 避免将共享密钥放入 URL。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`，并在 `gateway.trustedProxies` 中加入 loopback 条目。

  </Accordion>

  <Accordion title="为什么现在 localhost 也需要令牌？">
    OpenClaw 默认强制执行 gateway 认证，包括 loopback。如果没有配置显式认证路径，启动会解析为令牌模式，并为该次启动生成仅运行时令牌，因此本地 WS 客户端必须认证。这会阻止其他本地进程调用 Gateway 网关。

    当客户端需要在重启之间使用稳定密钥时，请显式配置 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。你也可以选择密码模式，或为身份感知反向代理选择 `trusted-proxy`。如需开放 loopback，请显式设置 `gateway.auth.mode: "none"`。`openclaw doctor --generate-gateway-token` 可随时生成令牌。

  </Accordion>

  <Accordion title="更改配置后必须重启吗？">
    Gateway 网关会监视配置并支持热重载：`gateway.reload.mode: "hybrid"`（默认）会热应用安全更改，并针对关键更改重启。也支持 `hot`、`restart` 和 `off`。大多数 `tools.*`、`agents.*` 策略、`session.*` 和 `messages.*` 更改会立即生效，无需任何重载操作；`gateway.*` 绑定/端口更改需要重启。
  </Accordion>

  <Accordion title="如何禁用有趣的 CLI 标语？">
    设置 `cli.banner.taglineMode`：

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
    - 如需完全不显示横幅，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（和 Web 抓取）？">
    `web_fetch` 无需 API key 即可工作。`web_search` 取决于你选择的提供商：

    | 提供商 | 无需 key | 环境变量 |
    | --- | --- | --- |
    | Brave | 否 | `BRAVE_API_KEY` |
    | DuckDuckGo | 是（非官方 HTML 方式） | - |
    | Exa | 否 | `EXA_API_KEY` |
    | Firecrawl | 否 | `FIRECRAWL_API_KEY` |
    | Gemini | 否 | `GEMINI_API_KEY` |
    | Grok | 否（xAI OAuth 或 key） | `XAI_API_KEY` |
    | Kimi | 否 | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |
    | MiniMax Search | 否 | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY` |
    | Ollama Web 搜索 | 是（需要 `ollama signin`） | - |
    | Perplexity | 否 | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY` |
    | SearXNG | 是（自托管） | `SEARXNG_BASE_URL` |
    | Tavily | 否 | `TAVILY_API_KEY` |

    Grok 也可以复用模型认证中的 xAI OAuth（`openclaw onboard --auth-choice xai-oauth`）。

    **推荐**：运行 `openclaw configure --section web` 并选择一个提供商。

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

    提供商特定的 Web 搜索配置位于 `plugins.entries.<plugin>.config.webSearch.*` 下。旧版 `tools.web.search.*` 提供商路径仍会为兼容性加载，但不应在新配置中使用。Firecrawl Web 抓取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    - 允许列表：添加 `web_search`/`web_fetch`/`x_search`，或为全部三项添加 `group:web`。
    - `web_fetch` 默认启用。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭证中自动检测第一个就绪的抓取回退提供商；官方 Firecrawl 插件提供该回退。
    - 守护进程从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web 工具](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清除了我的配置。如何恢复并避免这种情况？">
    `config.apply` 会替换**整个配置**；传入部分对象会移除其他所有内容。

    当前 OpenClaw 会防止大多数意外覆盖：

    - OpenClaw 所有的配置写入会在写入前验证完整的变更后配置。
    - 无效或具有破坏性的 OpenClaw 所有写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑导致启动或热重载失败，Gateway 网关会故障关闭或跳过重载；它不会重写 `openclaw.json`。
    - `openclaw doctor --fix` 负责修复，可以恢复最近一次已知可用配置，并将被拒绝的文件保存为 `openclaw.json.clobbered.*`。

    恢复：

    - 检查 `openclaw logs --follow` 中的 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 查看活动配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 运行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 仅使用 `openclaw config set` 或 `config.patch` 复制回预期键名。
    - 没有最近一次已知可用配置或被拒绝的载荷：从备份恢复，或重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 意外丢失：使用你的最近已知配置或备份提交 bug。本地编码智能体通常可以从日志或历史记录重建可用配置。

    避免方法：小改动使用 `openclaw config set`，交互式编辑使用 `openclaw configure`，检查不熟悉路径时使用 `config.schema.lookup`（返回浅层 schema 节点和直接子项摘要），部分 RPC 编辑使用 `config.patch`，仅将 `config.apply` 用于完整配置替换。面向智能体的 `gateway` 运行时工具即使通过旧版 `tools.bash.*` 别名，也会拒绝重写 `tools.exec.ask` / `tools.exec.security`。

    文档：[配置](/zh-CN/cli/config)、[Configure](/zh-CN/cli/configure)、[Gateway 故障排查](/zh-CN/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何跨设备运行一个带专用工作节点的中央 Gateway 网关？">
    常见模式：**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**。

    - **Gateway 网关（中央）**：拥有渠道（Signal/WhatsApp）、路由、会话。
    - **节点（设备）**：Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（工作节点）**：为特殊角色提供独立大脑/工作区（例如运维与个人数据）。
    - **子智能体**：从主智能体派生后台工作以实现并行。
    - **TUI**：连接到 Gateway 网关并切换智能体/会话。

    文档：[节点](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[多 Agent 路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[TUI](/zh-CN/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 浏览器可以无头运行吗？">
    可以：

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

    默认值为 `false`（有头）。无头模式更容易触发某些网站的反机器人检查（X/Twitter 通常会阻止无头会话）。它使用相同的 Chromium 引擎，适用于大多数自动化；主要区别是没有可见的浏览器窗口（使用截图查看视觉效果）。参见[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。参见[浏览器](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、Gateway 网关和节点之间传播？">
    Telegram 消息由 **Gateway 网关**处理，它运行智能体，并且仅在需要节点工具时才通过 **Gateway WebSocket** 调用节点：

    Telegram -> Gateway 网关 -> 智能体 -> `node.*` -> 节点 -> Gateway 网关 -> Telegram

    节点看不到入站提供商流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远端，我的智能体如何访问我的电脑？">
    将你的电脑配对为**节点**。Gateway 网关在其他位置运行，但可以通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、系统）。

    1. 在始终在线的主机（VPS/家庭服务器）上运行 Gateway 网关。
    2. 将 Gateway 网关主机和你的电脑放在同一个 tailnet 中。
    3. 确保 Gateway WS 可访问（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以 **Remote over SSH** 模式（或直接 tailnet）连接，使其注册为节点。
    5. 批准节点：
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP 桥接；节点通过 Gateway WebSocket 连接。

    安全提醒：配对 macOS 节点会允许在该机器上执行 `system.run`。只配对你信任的设备；查看[安全](/zh-CN/gateway/security)。

    文档：[节点](/zh-CN/nodes)、[Gateway 协议](/zh-CN/gateway/protocol)、[macOS 远程模式](/zh-CN/platforms/mac/remote)、[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接但我收不到回复。现在该怎么办？">
    检查基础项：

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    然后验证认证和路由：如果你使用 Tailscale Serve，确认 `gateway.auth.allowTailscale` 设置正确；如果你通过 SSH 隧道连接，确认隧道已启动并指向正确端口；确认你的私信/群组允许列表包含你的账号。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[渠道](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以，不过没有内置的 bot 到 bot 桥接。

    **最简单**：使用两个 bot 都能访问的普通聊天渠道（Slack/Telegram/WhatsApp）。让 Bot A 给 Bot B 发消息，然后让 Bot B 像平常一样回复。

    **CLI 桥接（通用）**：运行一个脚本，用 `openclaw agent --message ... --deliver` 调用另一个 Gateway 网关，并以另一个 bot 监听的聊天为目标。如果一个 bot 在远程 VPS 上，通过 SSH/Tailscale 将你的 CLI 指向那个远程 Gateway 网关（参见[远程访问](/zh-CN/gateway/remote)）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    添加防护栏，避免两个 bot 无限循环（仅提及时回复、渠道允许列表，或“不回复 bot 消息”的规则）。

    文档：[远程访问](/zh-CN/gateway/remote)、[Agent CLI](/zh-CN/cli/agent)、[Agent 发送](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要单独的 VPS 吗？">
    不需要。一个 Gateway 网关托管多个智能体，每个智能体都有自己的工作区、模型默认值和路由，这是正常设置，并且比每个智能体一个 VPS 便宜且简单得多。只有在需要强隔离（安全边界）或非常不同且不想共享的配置时，才使用单独的 VPS。
  </Accordion>

  <Accordion title="相比从 VPS SSH 到我的个人笔记本，使用节点有什么好处？">
    有：节点是从远程 Gateway 网关访问你的笔记本的一等方式，并且解锁的不只是 shell 访问。Gateway 网关运行在 macOS/Linux 上（Windows 通过 WSL2），且很轻量（小型 VPS 或 Raspberry Pi 级别机器即可；4 GB RAM 已足够），因此常见设置是一个始终在线的主机加上作为节点的笔记本。

    - **无需入站 SSH** - 节点通过设备配对主动连接到 Gateway WebSocket。
    - **更安全的执行控制** - `system.run` 受该笔记本上的节点允许列表/审批保护。
    - **更多设备工具** - 除了 `system.run`，节点还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化** - 将 Gateway 网关保留在 VPS 上，但通过节点主机在本地运行 Chrome，或通过 Chrome MCP 连接到本地 Chrome。

    SSH 适合临时 shell 访问；对于持续的智能体工作流和设备自动化，节点更简单。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行 Gateway 网关服务吗？">
    不会。除非你有意运行隔离配置文件（参见[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)），否则每台主机只应运行**一个 Gateway 网关**。节点是连接到 Gateway 网关的外设（iOS/Android 节点，或菜单栏应用中的 macOS “节点模式”）。对于无头节点主机和 CLI 控制，参见[节点主机 CLI](/zh-CN/cli/node)。

    对 `gateway`、`discovery` 和托管插件表面的更改需要完整重启。

  </Accordion>

  <Accordion title="是否有 API / RPC 方式应用配置？">
    有：

    - `config.schema.lookup`：在写入前检查一个配置子树，包括其浅层 schema 节点、匹配的 UI 提示和直接子项摘要。
    - `config.get`：获取当前快照和哈希。
    - `config.patch`：安全的部分更新（大多数 RPC 编辑的首选）；可行时热重载，必要时重启。
    - `config.apply`：验证并替换完整配置；可行时热重载，必要时重启。
    - 面向智能体的 `gateway` 运行时工具仍会拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会规范化到相同的受保护路径。

  </Accordion>

  <Accordion title="首次安装的最低合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    设置你的工作区，并限制谁可以触发 bot。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale 并从我的 Mac 连接？">
    1. **在 VPS 上安装 + 登录**：
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **在你的 Mac 上安装 + 登录**，使用同一个 tailnet。
    3. **启用 MagicDNS**，在 Tailscale 管理控制台中启用，让 VPS 拥有稳定名称。
    4. **使用 tailnet 主机名**：SSH `ssh user@your-vps.tailnet-xxxx.ts.net`；Gateway WS `ws://your-vps.tailnet-xxxx.ts.net:18789`。

    如需不通过 SSH 使用 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这会让 Gateway 网关绑定到 loopback，并通过 Tailscale 暴露 HTTPS。参见 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露 **Gateway 网关 Control UI + WS**；节点通过同一个 Gateway 网关 WS 端点连接。

    1. 确保 VPS 和 Mac 在同一个 tailnet 中。
    2. 在远程模式下使用 macOS 应用（SSH 目标可以是 tailnet 主机名）- 它会隧道转发 Gateway 网关端口，并作为节点连接。
    3. 批准节点：
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway 网关协议](/zh-CN/gateway/protocol)、[设备发现](/zh-CN/gateway/discovery)、[macOS 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本电脑上安装，还是只添加一个节点？">
    如果第二台笔记本电脑只需要使用**本地工具**（屏幕/摄像头/exec），请将它添加为**节点** - 一个 Gateway 网关，无重复配置。本地节点工具目前仅支持 macOS。只有在需要**强隔离**或两个完全独立的 bot 时，才安装第二个 Gateway 网关。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)、[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

    - 当前工作目录中的 `.env`。
    - `~/.openclaw/.env`（`$OPENCLAW_STATE_DIR/.env`）中的全局后备 `.env`。

    两个 `.env` 文件都不会覆盖现有环境变量。提供商凭据键是工作区 `.env` 的例外：`GEMINI_API_KEY`、`XAI_API_KEY` 或 `MISTRAL_API_KEY` 等键（以及其他内置提供商认证环境变量）会从工作区 `.env` 中被忽略，应该放在进程环境、`~/.openclaw/.env` 或配置 `env` 中。

    配置中的内联环境变量只有在进程环境缺失时才会生效：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    请参阅 [/environment](/zh-CN/help/environment) 了解完整优先级和来源。

  </Accordion>

  <Accordion title="我通过服务启动了 Gateway 网关，但我的环境变量消失了。现在该怎么办？">
    两种修复方式：

    1. 将缺失的键放入 `~/.openclaw/.env`，这样即使服务没有继承你的 shell 环境也能加载。
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
       这会运行你的登录 shell，并且只导入缺失的预期键名（绝不覆盖）。等效环境变量：`OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但模型状态显示 “Shell env: off.” 为什么？'>
    `openclaw models status` 报告的是是否启用了 **shell 环境导入**。“Shell env: off” **并不**表示你的环境变量缺失 - 它只表示 OpenClaw 不会自动加载你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell 环境。修复方法是将 token 放入 `~/.openclaw/.env`，启用 `env.shellEnv.enabled: true`，或将其添加到配置 `env`（仅在缺失时生效），然后重启 Gateway 网关并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot token 按以下顺序解析：`OPENCLAW_GITHUB_TOKEN`，然后是 `COPILOT_GITHUB_TOKEN`，然后是 `GH_TOKEN`，然后是 `GITHUB_TOKEN`。

    请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多个聊天

<AccordionGroup>
  <Accordion title="如何开始一段新对话？">
    发送 `/new` 或 `/reset` 作为独立消息。请参阅[会话管理](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会。默认重置策略是**每天**：会话会在 Gateway 网关主机上配置的本地小时（`session.reset.atHour`，默认 `4`，0-23）滚动更新，基于当前会话的开始时间。也可以改用基于空闲时间的重置，设置 `mode: "idle"` 和 `session.reset.idleMinutes`，它会在一段不活动时间后使会话过期（基于最后一次真实交互，而不是 heartbeat/cron/exec 系统事件）。

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` 支持 `direct`（旧版别名 `dm`）、`group` 和 `thread`。当未设置 `session.reset`/`resetByType` 块时，旧版顶层 `session.idleMinutes` 仍可作为空闲模式默认值的兼容别名使用。具有活跃的提供商所拥有 CLI 会话的会话，不会被隐式每日默认值截断。请参阅[会话管理](/zh-CN/concepts/session)了解完整生命周期。

  </Accordion>

  <Accordion title="有没有办法组成一个 OpenClaw 实例团队（一个 CEO 和许多智能体）？">
    有，可以通过**多 Agent 路由**和**子智能体**实现：一个协调智能体，加上多个拥有各自工作区和模型的工作智能体。

    这更适合作为有趣的实验 - 它会消耗大量 token，并且通常不如一个带有独立会话的 bot 高效。典型模式是一个你与之对话的 bot，为并行工作使用不同会话，并在需要时生成子智能体。

    文档：[多 Agent 路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[智能体 CLI](/zh-CN/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文会在任务中途被截断？如何防止？">
    会话上下文受模型窗口限制。长聊天、大型工具输出或大量文件可能触发压缩或截断。

    - 让 bot 总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让 bot 读回。
    - 对长时间或并行工作使用子智能体，让主聊天保持更小。
    - 如果这种情况经常发生，请选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何在保留安装的情况下完全重置 OpenClaw？">
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

    如果新手引导检测到已有配置，也会提供**重置**；请参阅[新手引导（CLI）](/zh-CN/start/wizard)。如果你使用了 profiles（`--profile` / `OPENCLAW_PROFILE`），请重置每个状态目录（默认 `~/.openclaw-<profile>`）。仅开发用重置：`openclaw gateway --dev --reset` 会清除开发配置、凭据、会话和工作区。

  </Accordion>

  <Accordion title='我遇到 “context too large” 错误 - 如何重置或压缩？'>
    - **压缩**（保留对话，总结较早轮次）：使用 `/compact` 或 `/compact <instructions>` 来引导总结。
    - **重置**（为同一个聊天键创建新会话 ID）：`/new` 或 `/reset`。

    如果持续发生，请调优**会话剪枝**（`agents.defaults.contextPruning`）以裁剪旧工具输出，或使用上下文窗口更大的模型。

    文档：[压缩](/zh-CN/concepts/compaction)、[会话剪枝](/zh-CN/concepts/session-pruning)、[会话管理](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我看到 “LLM request rejected: messages.content.tool_use.input field required”？'>
    提供商验证错误：模型发出了缺少必需 `input` 的 `tool_use` 块。通常意味着会话历史已过期或损坏（常见于长线程后，或工具/架构变更后）。

    修复：使用 `/new`（独立消息）开始一个新会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟都会收到 heartbeat 消息？">
    Heartbeat 默认每 **30m** 运行一次；当解析出的认证模式是 Anthropic OAuth/token 认证（包括 Claude CLI 复用）且未设置 `heartbeat.every` 时，默认每 **1h** 运行一次。可调优或禁用：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（只有空行、Markdown/HTML 注释、ATX 标题、围栏标记或空列表项占位），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。如果文件缺失，heartbeat 仍会运行，由模型决定要做什么。

    每智能体覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要向 WhatsApp 群组添加一个 “bot account” 吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上 - 如果你在群组里，OpenClaw 就能看到它。默认情况下，群组回复会被阻止，直到你允许发送者（`groupPolicy: "allowlist"`）。

    要将群组回复限制为只回复你：

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
    最快方式：跟踪日志，并在群组里发送一条测试消息。

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如 `1234567890-1234567890@g.us`。

    如果已经配置/加入允许列表，可以从配置列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[目录](/zh-CN/cli/directory)、[日志](/zh-CN/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组里不回复？">
    两个常见原因：默认启用了提及门控（你必须 @ 提及 bot，或匹配 `mentionPatterns`），或者你配置了 `channels.whatsapp.groups` 但没有配置 `"*"`，并且该群组不在允许列表中。

    请参阅[群组](/zh-CN/channels/groups)和[群组消息](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会与私信共享上下文吗？">
    默认情况下，直接聊天会折叠到主会话。群组/频道有自己的会话键，Telegram 话题 / Discord 线程是独立会话。请参阅[群组](/zh-CN/channels/groups)和[群组消息](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制 - 几十个甚至几百个都可以，但请注意：

    - **磁盘增长**：会话和转录记录位于 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本**：更多智能体意味着更多并发模型使用。
    - **运维开销**：每智能体认证 profiles、工作区和渠道路由。

    为每个智能体保留一个**活跃**工作区（`agents.defaults.workspace`），如果磁盘增长就修剪旧会话，并使用 `openclaw doctor` 发现零散工作区和 profile 不匹配。

  </Accordion>

  <Accordion title="我可以同时运行多个 bot 或聊天（Slack）吗？应该如何设置？">
    可以，通过 **Multi-Agent Routing**：运行多个隔离智能体，并按渠道/账号/对端路由入站消息。Slack 作为渠道受支持，并且可以绑定到特定智能体。

    浏览器访问能力很强，但并不是“能做人类能做的任何事” - 反 bot、CAPTCHA 和 MFA 仍可能阻止自动化。若要获得最可靠的控制，请在主机上使用本地 Chrome MCP，或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：常开 Gateway 网关主机（VPS/Mac mini），每个角色一个智能体（绑定），Slack 渠道绑定到这些智能体，并在需要时通过 Chrome MCP 或节点使用本地浏览器。

    Docs：[多 Agent 路由](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、[浏览器](/zh-CN/tools/browser)、[节点](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## Models、故障转移和认证配置文件

模型问答 - 默认值、选择、别名、切换、故障转移、认证配置文件 - 位于 [Models 常见问题](/zh-CN/help/faq-models)。

## Gateway 网关：端口、“已在运行”和远程模式

<AccordionGroup>
  <Accordion title="Gateway 网关使用哪个端口？">
    `gateway.port` 控制用于 WebSocket + HTTP（Control UI、Hooks 等）的单个复用端口。优先级：

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示 “Runtime: running” 但显示 “Connectivity probe: failed”？'>
    “Running” 是**监督进程**的视角（launchd/systemd/schtasks）；连接探测是 CLI 实际连接到 Gateway 网关 WebSocket。请信任 `openclaw gateway status` 中的这些行：`Probe target:`（探测使用的 URL）、`Listening:`（端口上实际绑定的内容）、`Last gateway error:`（进程仍存活但端口未监听时的常见根因）。
  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示的 “Config (cli)” 和 “Config (service)” 不同？'>
    你正在编辑一个配置文件，而服务运行的是另一个配置文件（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复：从你希望服务使用的同一个 `--profile` / 环境运行：

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='“another gateway instance is already listening” 是什么意思？'>
    OpenClaw 会在启动时立即绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`）来强制执行运行时锁。如果绑定因 `EADDRINUSE` 失败，它会抛出 `GatewayLockError`（“another gateway instance is already listening”）。

    修复：停止另一个实例、释放端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何以远程模式运行 OpenClaw（客户端连接到其他位置的 Gateway 网关）？">
    设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，也可以选择使用共享密钥远程凭据：

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

    - `openclaw gateway` 仅在 `gateway.mode` 为 `local` 时启动（或你传入覆盖标志时启动）。
    - macOS 应用会监听配置文件，并在这些值变化时实时切换模式。
    - `gateway.remote.token` / `.password` 只是客户端侧的远程凭据；它们本身不会启用本地 Gateway 网关认证。

  </Accordion>

  <Accordion title='Control UI 显示 “unauthorized”（或持续重连）。现在怎么办？'>
    你的 Gateway 网关认证路径和 UI 的认证方法不匹配。

    事实（来自代码）：

    - Control UI 将令牌保存在 `sessionStorage` 中，作用域限定为当前浏览器标签页和选中的 Gateway 网关 URL，因此同标签页刷新可以继续工作，而无需持久保存长期 `localStorage` 令牌。
    - 遇到 `AUTH_TOKEN_MISMATCH` 时，当 Gateway 网关返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）时，受信任客户端可以使用缓存的设备令牌尝试一次有界重试。
    - 该缓存令牌重试会复用随设备令牌存储的已批准缓存权限范围；显式 `deviceToken` / 显式 `scopes` 调用方会保留其请求的权限范围集合，而不是继承缓存权限范围。
    - 在该重试路径之外，连接认证优先级是显式共享令牌/密码优先，其次是显式 `deviceToken`，然后是已存储设备令牌，最后是引导令牌。
    - 内置设置码引导会返回一个带有 `scopes: []` 的节点设备令牌，以及一个面向受信任移动端新手引导的有界操作员交接令牌。操作员交接可以读取设置期间的原生配置，但不会授予配对变更权限范围或 `operator.admin`。

    修复：

    - 最快方式：`openclaw dashboard`（打印并复制仪表板 URL，尝试打开；如果是无头环境，会显示 SSH 提示）。
    - 还没有令牌：`openclaw doctor --generate-gateway-token`。
    - 远程：先用 `ssh -N -L 18789:127.0.0.1:18789 user@host` 建立隧道，然后打开 `http://127.0.0.1:18789/`。
    - 共享密钥模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的密钥。
    - Tailscale Serve 模式：确认已启用 `gateway.auth.allowTailscale`，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份标头的原始 loopback/tailnet URL。
    - 受信任代理模式：确认你是通过已配置的身份感知代理进入。同主机 loopback 代理还需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 一次重试后仍不匹配：轮换/重新批准已配对设备令牌：
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - 轮换被拒绝：已配对设备会话只能轮换其**自己的**设备，除非它们也拥有 `operator.admin`；并且显式 `--scope` 值不能超过调用方当前的操作员权限范围。
    - 仍然卡住：`openclaw status --all` 加上[故障排查](/zh-CN/gateway/troubleshooting)。认证详情见[仪表板](/zh-CN/web/dashboard)。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet，但它无法绑定且没有任何监听">
    `tailnet` 绑定会从你的网络接口中选择一个 Tailscale IP（100.64.0.0/10）。如果机器不在 Tailscale 上（或接口已关闭），就没有可绑定的地址。

    修复：在该主机上启动 Tailscale，或切换到 `gateway.bind: "loopback"` / `"lan"`。

    `tailnet` 是显式设置；`auto` 会优先选择 loopback。使用 `gateway.bind: "tailnet"` 可进行仅 tailnet 绑定。

  </Accordion>

  <Accordion title="我可以在同一主机上运行多个 Gateway 网关吗？">
    通常不可以 - 一个 Gateway 网关可以运行多个消息渠道和智能体。仅为冗余（例如救援 Bot）或强隔离使用多个 Gateway 网关，并为每个实例隔离其自己的 `OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`agents.defaults.workspace` 和唯一的 `gateway.port`。

    推荐：每个实例使用 `openclaw --profile <name> ...`（自动创建 `~/.openclaw-<name>`）、每个配置文件配置唯一的 `gateway.port`（或手动运行时使用 `--port`），并使用 `openclaw --profile <name> gateway install` 为每个配置文件创建服务。

    配置文件还会为服务名称添加后缀：launchd `ai.openclaw.<profile>`、systemd `openclaw-gateway-<profile>.service`、Windows `OpenClaw Gateway (<profile>)`。未限定的 `openclaw-gateway` systemd 单元仅用于默认配置文件；旧版重命名前的 systemd 单元名 `clawdbot-gateway` 会自动迁移。

    完整指南：[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 是什么意思？'>
    Gateway 网关是一个 **WebSocket 服务器**，并期望第一条消息是 `connect` 帧。其他任何内容都会以 **code 1008**（策略违规）关闭连接。

    常见原因：你在浏览器中打开了 **HTTP** URL，而不是使用 WS 客户端；使用了错误的端口/路径；或代理/隧道剥离了认证标头，或发送了非 Gateway 网关请求。

    修复：使用 WS URL（`ws://<host>:18789`，或通过 HTTPS 使用 `wss://...`），不要在普通浏览器标签页中打开 WS 端口，并在启用认证时在 `connect` 帧中包含令牌/密码。CLI/TUI 示例：

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志和调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。通过 `logging.file` 设置稳定路径；通过 `logging.level` 设置文件日志级别；通过 `--verbose` 和 `logging.consoleLevel` 设置控制台详细程度。

    最快 tail：

    ```bash
    openclaw logs --follow
    ```

    服务/监督进程日志（当 Gateway 网关通过 launchd/systemd 运行时）：

    - macOS launchd stdout：`~/Library/Logs/openclaw/gateway.log`（配置文件使用 `gateway-<profile>.log`；stderr 会被抑制）。
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`。
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`。

    更多内容见[故障排查](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 网关服务？">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行 Gateway 网关，`openclaw gateway --force` 可以收回端口。见 [Gateway 网关](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端 - 如何重启 OpenClaw？">
    三种 Windows 安装模式：

    **1) Windows Hub 本地设置**：原生应用会管理一个由本地应用拥有的 WSL Gateway 网关。从开始菜单或托盘打开 **OpenClaw Companion**，然后使用 **Gateway Setup** 或 Connections 标签页。

    **2) 手动 WSL2 Gateway 网关**：Gateway 网关在 Linux 内运行。
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    如果你从未安装服务，请在前台启动：`openclaw gateway run`。

    **3) 原生 Windows CLI/Gateway 网关**：直接在 Windows 中运行。
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    如果你手动运行它（没有服务）：`openclaw gateway run`。

    文档：[Windows](/zh-CN/platforms/windows)、[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="Gateway 网关已启动，但回复始终没有到达。我应该检查什么？">
    快速健康检查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：模型认证未在 **Gateway 网关主机**上加载（检查 `models status`）、渠道配对/允许列表阻止回复（检查渠道配置和日志），或 WebChat/仪表板打开时没有正确令牌。如果是远程模式，请确认隧道/Tailscale 连接已启动，并且 Gateway 网关 WebSocket 可达。

    文档：[渠道](/zh-CN/channels)、[故障排查](/zh-CN/gateway/troubleshooting)、[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title='“Disconnected from gateway: no reason” - 现在怎么办？'>
    通常意味着 UI 丢失了 WebSocket 连接。检查：Gateway 网关是否正在运行（`openclaw gateway status`）？是否健康（`openclaw status`）？UI 是否有正确令牌（`openclaw dashboard`）？如果是远程模式，隧道/Tailscale 链接是否已启动？

    然后 tail 日志：

    ```bash
    openclaw logs --follow
    ```

    文档：[仪表板](/zh-CN/web/dashboard)、[远程访问](/zh-CN/gateway/remote)、[故障排查](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败。我应该检查什么？">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后匹配错误：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目太多。OpenClaw 已经会裁剪到 Telegram 限制并使用更少命令重试，但某些菜单条目仍可能被丢弃。减少插件/skill/自定义命令，或在不需要菜单时禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：在 VPS 上或位于代理之后时，请确认允许出站 HTTPS，并且 `api.telegram.org` 的 DNS 可用。

    如果 Gateway 网关是远程的，请检查 Gateway 网关主机上的日志。

    文档：[Telegram](/zh-CN/channels/telegram)、[渠道故障排查](/zh-CN/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 不显示输出。我应该检查什么？">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你期望在聊天渠道中收到回复，请确认已启用投递（`/deliver on`）。

    文档：[TUI](/zh-CN/web/tui)，[斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何彻底停止然后启动 Gateway 网关？">
    如果你安装了服务（macOS 上的 launchd，Linux 上的 systemd）：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    在前台运行时，使用 Ctrl-C 停止，然后运行 `openclaw gateway run`。

    文档：[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 与 openclaw gateway">
    `openclaw gateway restart` 会重启**后台服务**（launchd/systemd）。`openclaw gateway` 会在此终端会话中**前台**运行 Gateway 网关。如果你已安装服务，请使用 gateway 子命令；一次性运行则使用裸前台命令。
  </Accordion>

  <Accordion title="某些内容失败时最快获取更多详细信息的方式">
    使用 `--verbose` 启动 Gateway 网关以获得更多控制台详细信息，然后检查日志文件中的渠道认证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的 skill 生成了图片/PDF，但没有发送任何内容">
    来自智能体的出站附件必须使用结构化媒体字段，例如 `media`、`mediaUrl`、`path` 或 `filePath`。请参阅 [OpenClaw 助手设置](/zh-CN/start/openclaw) 和 [Agent 发送](/zh-CN/tools/agent-send)。

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    还要检查：目标渠道支持出站媒体且未被允许列表阻止；文件在提供商的大小限制内（图片会调整为最长边不超过 2048px）；`tools.fs.workspaceOnly=true` 会将本地路径发送限制在工作区、临时/媒体存储和经沙箱验证的文件内；`tools.fs.workspaceOnly=false`（默认）允许结构化本地媒体发送使用智能体已可读取的主机本地文件，适用于媒体以及安全文档类型（图片、音频、视频、PDF、Office 文档，以及经过验证的文本文件，例如 Markdown/MD、TXT、JSON、YAML/YML）。这不是秘密扫描器 - 当扩展和内容验证匹配时，智能体可读取的 `secret.txt` 或 `config.json` 可以作为附件发送。请将敏感文件放在智能体可读取路径之外，或保持 `tools.fs.workspaceOnly=true` 以获得更严格的本地路径发送限制。

    请参阅[图片](/zh-CN/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全和访问控制

<AccordionGroup>
  <Accordion title="将 OpenClaw 暴露给入站私信安全吗？">
    将入站私信视为不受信任的输入。默认值会降低风险：

    - 支持私信的渠道上的默认行为是**配对**：未知发送者会收到配对代码，其消息不会被处理。使用 `openclaw pairing approve --channel <channel> [--account <id>] <code>` 批准。待处理请求上限为**每个渠道 3 个**；如果代码未送达，请检查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公开开放私信需要显式选择启用（`dmPolicy: "open"` 和允许列表 `"*"`）。

    运行 `openclaw doctor` 以显示有风险的私信策略。

  </Accordion>

  <Accordion title="提示注入是否只是公共 Bot 需要担心的问题？">
    不是。提示注入关乎**不受信任的内容**，而不仅仅是谁可以给 Bot 发私信。如果你的助手会读取外部内容（Web 搜索/抓取、浏览器页面、电子邮件、文档、附件、粘贴的日志），这些内容可能携带试图劫持模型的指令 - 即使你是唯一发送者。

    最大的风险出现在启用工具时：模型可能被诱导泄露上下文或代表你调用工具。降低影响范围：

    - 使用只读或禁用工具的“阅读器”智能体来总结不受信任的内容
    - 对启用工具的智能体关闭 `web_search` / `web_fetch` / `browser`
    - 同样将解码后的文件/文档文本视为不受信任：OpenResponses `input_file` 和媒体附件提取都会将提取出的文本包裹在明确的外部内容边界标记中，而不是传递原始文件文本
    - 使用沙箱并采用严格的工具允许列表

    详情：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw 使用 TypeScript/Node 而不是 Rust/WASM，是否因此更不安全？">
    语言和运行时很重要，但不是个人智能体的主要风险。实际风险包括 Gateway 网关暴露、谁可以给 Bot 发消息、提示注入、工具权限范围、凭证处理、浏览器访问、exec 访问，以及第三方 skill/插件信任。

    Rust 和 WASM 可以为某些代码类别提供更强隔离，但无法解决提示注入、糟糕的允许列表、公共 Gateway 网关暴露、过宽的工具权限，或已登录敏感账户的浏览器配置文件。将以下内容视为主要控制措施：保持 Gateway 网关私有或经认证访问，对私信/群组使用配对和允许列表，对不受信任输入拒绝或沙箱隔离高风险工具，仅安装受信任的插件和 Skills，并在配置更改后运行 `openclaw security audit --deep`。

    详情：[安全](/zh-CN/gateway/security)，[沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="我看到有关暴露的 OpenClaw 实例的报告。我应该检查什么？">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    更安全的基线：Gateway 网关绑定到 `loopback`，或仅通过经过认证的私有访问暴露（tailnet、SSH 隧道、令牌/密码认证，或配置正确的受信任代理）；私信处于 `pairing` 或 `allowlist` 模式；群组加入允许列表，并且除非每个成员都受信任，否则需要提及触发；对读取不受信任内容的智能体拒绝或严格限定高风险工具（`exec`、`browser`、`gateway`、`cron`）；在工具执行需要更小影响范围时启用沙箱隔离。

    没有认证的公共绑定、开启工具的开放私信/群组，以及暴露的浏览器控制，是需要优先修复的问题。详情：[openclaw security audit](/zh-CN/gateway/security#openclaw-security-audit)。

  </Accordion>

  <Accordion title="ClawHub Skills 和第三方插件安装安全吗？">
    将第三方 Skills 和插件视为你选择信任的代码。ClawHub skill 页面会在安装前展示扫描状态，但扫描并不是完整的安全边界。OpenClaw 在插件/skill 安装或更新期间不会运行内置的本地危险代码阻止；请使用操作员拥有的 `security.installPolicy` 进行本地允许/阻止决策。

    更安全的模式：优先选择受信任作者和固定版本，在启用前阅读 skill/插件，保持插件/skill 允许列表收窄，在具备最少工具的沙箱中运行不受信任输入工作流，并避免授予第三方代码过宽的文件系统、exec、浏览器或秘密访问权限。

    详情：[Skills](/zh-CN/tools/skills)，[插件](/zh-CN/tools/plugin)，[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我的 Bot 应该拥有自己的电子邮件、GitHub 账户或电话号码吗？">
    对大多数设置来说，是的。用单独账户和电话号码隔离 Bot，可以在出问题时降低影响范围，并让你更容易轮换凭证或撤销访问，而不会影响你的个人账户。

    从小范围开始：只授予你实际需要的工具和账户访问权限，必要时再扩展。

    文档：[安全](/zh-CN/gateway/security)，[配对](/zh-CN/channels/pairing)。

  </Accordion>

  <Accordion title="我可以让它自主处理我的短信吗？这样安全吗？">
    我们**不**建议对你的个人消息授予完全自主权。最安全的模式：让私信保持在**配对模式**或严格允许列表中；如果它需要代表你发送消息，请使用**单独的号码或账户**；并让它起草消息，而你在**发送前批准**。

    如需实验，请在专用、隔离的账户上进行。请参阅[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我可以为个人助手任务使用更便宜的模型吗？">
    可以，**前提是**智能体仅用于聊天且输入受信任。较小层级的模型更容易受到指令劫持，因此请避免将其用于启用工具的智能体或读取不受信任内容的场景。如果必须使用较小模型，请锁定工具并在沙箱内运行。请参阅[安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中运行了 /start，但没有收到配对代码">
    配对代码**只会**在未知发送者给 Bot 发消息且启用 `dmPolicy: "pairing"` 时发送；`/start` 本身不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如需立即访问，请将你的发送者 id 加入允许列表，或为该账户设置 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会给我的联系人发消息吗？配对如何工作？">
    不会。默认 WhatsApp 私信策略是**配对**。未知发送者只会收到配对代码；他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或回复你显式触发的发送。

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    向导中的电话号码提示会设置你的**允许列表/所有者**，从而允许你自己的私信 - 它不会用于自动发送。在你的个人 WhatsApp 号码上，请使用该号码并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任务和“它不会停止”

<AccordionGroup>
  <Accordion title="如何阻止内部系统消息显示在聊天中？">
    大多数内部/工具消息只会在该会话启用 **verbose**、**trace** 或 **reasoning** 时出现。

    在你看到它的聊天中修复：

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    仍然嘈杂：检查 Control UI 中的会话设置，并将 verbose 设置为**继承**；确认你没有使用配置中带有 `verboseDefault: "on"` 的 Bot 配置文件。

    文档：[思考与 verbose](/zh-CN/tools/thinking)，[安全](/zh-CN/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在运行的任务？">
    将以下任一内容**作为独立消息**（不要带斜杠）发送以触发中止：`stop`、`stop action`、`stop current action`、`stop run`、`stop current run`、`stop agent`、`stop the agent`、`stop openclaw`、`openclaw stop`、`stop don't do anything`、`stop do not do anything`、`stop doing anything`、`do not do that`、`please stop`、`stop please`、`abort`、`esc`、`wait`、`exit`、`interrupt`、`halt`。常见的非英语触发词（法语、德语、西班牙语、中文、日语、印地语、阿拉伯语、俄语）也可用。

    对于由 exec 工具启动的后台进程，请让智能体运行：

    ```text
    process action:kill sessionId:XXX
    ```

    大多数斜杠命令必须作为以 `/` 开头的**独立**消息发送，但少数快捷方式（例如 `/status`）也可由允许列表发送者在行内使用。请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（“跨上下文消息被拒绝”）'>
    OpenClaw 默认阻止**跨提供商**消息。如果工具调用绑定到 Telegram，它不会发送到 Discord，除非你明确允许 - 且此设置会立即生效，不需要重启 Gateway 网关：

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

  </Accordion>

  <Accordion title='为什么感觉机器人“忽略”了快速连续消息？'>
    默认情况下，运行中的提示会被 Steer 到活跃运行中。使用 `/queue` 选择活跃运行行为：

    - `steer`（默认）- 在下一个模型边界引导活跃运行。
    - `followup` - 将消息加入队列，并在当前运行结束后逐条运行。
    - `collect` - 将兼容消息加入队列，并在当前运行结束后统一回复一次。
    - `interrupt` - 中止当前运行并重新开始。

    向队列模式添加选项，例如 `debounce:0.5s cap:25 drop:summarize`。参见 [命令队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='使用 API key 时 Anthropic 的默认模型是什么？'>
    凭证和模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在身份验证配置文件中存储 Anthropic API key）会启用身份验证，但实际的默认模型取决于你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` 表示 Gateway 网关在运行中智能体预期的 `auth-profiles.json` 中找不到 Anthropic 凭证。
  </Accordion>
</AccordionGroup>

---

仍然卡住？在 [Discord](https://discord.com/invite/clawd) 提问，或发起 [GitHub 讨论](https://github.com/openclaw/openclaw/discussions)。

## 相关

- [首次运行常见问题](/zh-CN/help/faq-first-run) - 安装、引导设置、身份验证、订阅、早期失败
- [模型常见问题](/zh-CN/help/faq-models) - 模型选择、故障转移、身份验证配置文件
- [故障排查](/zh-CN/help/troubleshooting) - 按症状优先的分诊
