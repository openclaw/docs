---
read_when:
    - 回答常见的设置、安装、新手引导或运行时支持问题
    - 在深入调试前分诊用户报告的问题
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-05-06T12:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

快速答案，以及面向真实设置（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障转移）的深入故障排除。有关运行时诊断，请参阅[故障排除](/zh-CN/gateway/troubleshooting)。有关完整配置参考，请参阅[配置](/zh-CN/gateway/configuration)。

## 出现故障时的最初的六十秒

1. **快速状态（首次检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：操作系统 + 更新、Gateway 网关/服务可达性、智能体/会话、提供商配置 + 运行时问题（当 Gateway 网关可达时）。

2. **可粘贴报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，包含日志尾部（令牌已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用了哪个配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 网关健康探测，包括受支持时的渠道探测
   （需要可达的 Gateway 网关）。请参阅[健康](/zh-CN/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，请回退到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志是分开的；请参阅[日志](/zh-CN/logging)和[故障排除](/zh-CN/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置/状态 + 运行健康检查。请参阅[Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   向正在运行的 Gateway 网关请求完整快照（仅 WS）。请参阅[健康](/zh-CN/gateway/health)。

## 快速开始和首次运行设置

首次运行问答——安装、新手引导、凭证路径、订阅、初始故障——
位于[首次运行常见问题](/zh-CN/help/faq-first-run)。

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="什么是 OpenClaw？用一段话说明">
    OpenClaw 是在你自己的设备上运行的个人 AI 助手。它会在你已经使用的消息界面上回复（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等内置渠道插件），还可以在受支持的平台上提供语音 + 实时 Canvas。**Gateway 网关**是常驻控制平面；助手才是产品本身。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不是“只是一个 Claude 包装器”。它是一个**本地优先的控制平面**，让你可以在**自己的硬件**上运行
    能力强大的助手，通过你已经使用的聊天应用访问，并具备
    有状态会话、记忆和工具，而无需把工作流的控制权交给托管式
    SaaS。

    亮点：

    - **你的设备，你的数据：**在任何你想要的位置运行 Gateway 网关（Mac、Linux、VPS），并将
      工作区 + 会话历史保存在本地。
    - **真实渠道，而不是 Web 沙箱：**WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等，
      以及受支持平台上的移动语音和 Canvas。
    - **模型无关：**使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由
      和故障转移。
    - **仅本地选项：**运行本地模型；如果你愿意，**所有数据都可以留在你的设备上**。
    - **多智能体路由：**按渠道、账号或任务分配不同智能体，每个智能体都有自己的
      工作区和默认值。
    - **开源且可改造：**无需供应商锁定即可检查、扩展和自托管。

    文档：[Gateway 网关](/zh-CN/gateway)、[渠道](/zh-CN/channels)、[多智能体](/zh-CN/concepts/multi-agent)、
    [记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚完成设置，第一步应该做什么？">
    适合先做的项目：

    - 构建网站（WordPress、Shopify 或简单静态站点）。
    - 原型设计移动应用（大纲、界面、API 计划）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail 并自动生成摘要或跟进。

    它可以处理大型任务，但当你把任务拆成多个阶段，并
    使用子智能体并行工作时，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 日常最常见的五个用例是什么？">
    日常收益通常包括：

    - **个人简报：**汇总收件箱、日历和你关注的新闻。
    - **研究和起草：**快速研究、摘要，以及邮件或文档的初稿。
    - **提醒和跟进：**由 cron 或 Heartbeat 驱动的提醒和清单。
    - **浏览器自动化：**填写表单、收集数据，并重复执行 Web 任务。
    - **跨设备协同：**从手机发送任务，让 Gateway 网关在服务器上运行，并在聊天中取回结果。

  </Accordion>

  <Accordion title="OpenClaw 可以帮助 SaaS 做潜在客户开发、外联、广告和博客吗？">
    可以，用于**研究、筛选和起草**。它可以扫描网站、构建候选清单、
    总结潜在客户，并撰写外联或广告文案草稿。

    对于**外联或广告投放**，请保留人工审核环节。避免垃圾信息，遵守当地法律和
    平台政策，并在发送前审查所有内容。最安全的模式是让
    OpenClaw 起草，由你批准。

    文档：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比，OpenClaw 在 Web 开发方面有哪些优势？">
    OpenClaw 是**个人助手**和协调层，不是 IDE 替代品。若要在仓库内获得最快的直接编码循环，请使用
    Claude Code 或 Codex。当你
    需要持久记忆、跨设备访问和工具编排时，请使用 OpenClaw。

    优势：

    - 跨会话的**持久记忆 + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、钩子）
    - **常驻 Gateway 网关**（运行在 VPS 上，从任何地方交互）
    - 用于本地浏览器/屏幕/摄像头/执行的**节点**

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何自定义技能而不让仓库变脏？">
    使用托管覆盖，而不是编辑仓库副本。把你的更改放在 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此托管覆盖仍会在不触碰 git 的情况下优先于内置 Skills。如果你需要全局安装该 skill，但只让部分智能体可见，请将共享副本保留在 `~/.openclaw/skills` 中，并使用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有适合上游合入的编辑才应放在仓库中并以 PR 形式提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 Skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。如果该 skill 只应对特定智能体可见，请配合使用 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    目前支持的模式包括：

    - **Cron 作业**：隔离作业可以为每个作业设置 `model` 覆盖。
    - **子智能体**：将任务路由到具有不同默认模型的独立智能体。
    - **按需切换**：随时使用 `/model` 切换当前会话模型。

    请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)、[多智能体路由](/zh-CN/concepts/multi-agent) 和 [Slash 命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行繁重工作时卡住了。如何将其卸载出去？">
    对长任务或并行任务使用**子智能体**。子智能体在自己的会话中运行，
    返回摘要，并让你的主聊天保持响应。

    让你的机器人“为此任务生成一个子智能体”，或使用 `/subagents`。
    在聊天中使用 `/status` 查看 Gateway 网关 当前正在做什么（以及它是否繁忙）。

    Token 提示：长任务和子智能体都会消耗 token。如果担心成本，请通过
    `agents.defaults.subagents.model` 为子智能体设置更便宜的模型。

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上绑定线程的子智能体会话如何工作？">
    使用线程绑定。你可以将 Discord 线程绑定到子智能体或会话目标，使该线程中的后续消息保持在绑定的会话上。

    基本流程：

    - 使用带有 `thread: true` 的 `sessions_spawn` 生成（并可选使用 `mode: "session"` 以便持久后续跟进）。
    - 或使用 `/focus <target>` 手动绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - 使用 `/unfocus` 分离线程。

    所需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖项：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：`channels.discord.threadBindings.spawnSessions` 默认为 `true`；将其设置为 `false` 可禁用绑定线程的会话生成。

    文档：[子智能体](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[配置参考](/zh-CN/gateway/configuration-reference)、[Slash 命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="子智能体已完成，但完成更新发到了错误位置或从未发布。我应该检查什么？">
    先检查解析后的请求者路由：

    - 完成模式的子智能体投递会优先使用任何已绑定的线程或对话路由（如果存在）。
    - 如果完成来源只携带渠道，OpenClaw 会回退到请求者会话存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），这样直接投递仍可成功。
    - 如果既没有绑定路由，也没有可用的已存储路由，直接投递可能失败，结果会回退到排队会话投递，而不是立即发布到聊天中。
    - 无效或过期的目标仍可能强制回退到队列，或导致最终投递失败。
    - 如果子会话最后一条可见的助手回复正好是静默 token `NO_REPLY` / `no_reply`，或正好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制公告，而不是发布过期的早期进度。
    - 如果子会话在只有工具调用后超时，公告可以将其折叠为简短的部分进度摘要，而不是重放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)、[会话工具](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我应该检查什么？">
    Cron 在 Gateway 网关 进程内运行。如果 Gateway 网关 没有持续运行，
    定时作业将不会运行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`），并且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关 是否 24/7 运行（没有睡眠/重启）。
    - 验证作业的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[自动化和任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 已触发，但没有任何内容发送到渠道。为什么？">
    先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示预期不会有运行器回退发送。
    - 缺少或无效的通知目标（`channel` / `to`）表示运行器跳过了出站投递。
    - 渠道认证失败（`unauthorized`、`Forbidden`）表示运行器曾尝试投递，但凭证阻止了它。
    - 静默的隔离结果（仅 `NO_REPLY` / `no_reply`）会被视为有意不可投递，因此运行器也会抑制已排队的回退投递。

    对于隔离的 cron 作业，只要有可用的聊天路由，智能体仍然可以使用 `message`
    工具直接发送。`--announce` 只控制运行器回退路径，用于智能体尚未自行发送的最终文本。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离的 cron 运行切换了模型或重试了一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离的 cron 可以持久化运行时模型交接，并在活动
    运行抛出 `LiveSessionModelSwitchError` 时重试。重试会保留切换后的
    提供商/模型；如果切换携带了新的认证配置覆盖，cron
    也会在重试前持久化它。

    相关选择规则：

    - 适用时，Gmail 钩子模型覆盖优先。
    - 然后是每个作业的 `model`。
    - 然后是任何已存储的 cron 会话模型覆盖。
    - 然后是正常的智能体/默认模型选择。

    重试循环有边界。初始尝试加上 2 次切换重试后，
    cron 会中止，而不是永远循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[cron CLI](/zh-CN/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或将 Skills 放入你的工作区。macOS Skills UI 在 Linux 上不可用。
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

    原生 `openclaw skills install` 会写入活动工作区的 `skills/`
    目录。仅当你想发布或同步自己的 Skills 时，才安装单独的 `clawhub` CLI。
    若要在多个智能体之间共享安装，请将 skill 放在
    `~/.openclaw/skills` 下；如果想限制哪些智能体可以看到它，请使用
    `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划或在后台持续运行任务吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron 作业**用于计划任务或重复任务（重启后仍会保留）。
    - **Heartbeat** 用于“主会话”的周期性检查。
    - **隔离作业**用于会发布摘要或投递到聊天的自主智能体。

    文档：[Cron 作业](/zh-CN/automation/cron-jobs)、[自动化与任务](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以从 Linux 运行仅限 Apple macOS 的 Skills 吗？">
    不能直接运行。macOS Skills 会受到 `metadata.openclaw.os` 以及所需二进制文件的限制，并且只有在 **Gateway 网关主机** 上符合条件时，Skills 才会出现在系统提示中。在 Linux 上，除非你覆盖门控，否则仅限 `darwin` 的 Skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载。

    你有三种受支持的模式：

    **选项 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在存在 macOS 二进制文件的位置运行 Gateway 网关，然后从 Linux 通过[远程模式](#gateway-ports-already-running-and-remote-mode)或 Tailscale 连接。由于 Gateway 网关主机是 macOS，Skills 会正常加载。

    **选项 B - 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并在 Mac 上将 **Node Run Commands** 设置为“Always Ask”或“Always Allow”。当节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的 Skills 视为符合条件。智能体会通过 `nodes` 工具运行这些 Skills。如果选择“Always Ask”，在提示中批准“Always Allow”会将该命令添加到允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    将 Gateway 网关保留在 Linux 上，但让所需的 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。然后覆盖 skill 以允许 Linux，使其保持符合条件。

    1. 为该二进制文件创建 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将包装器放到 Linux 主机的 `PATH` 上（例如 `~/bin/memo`）。
    3. 覆盖 skill 元数据（工作区或 `~/.openclaw/skills`），以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动一个新会话，让 Skills 快照刷新。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    选项：

    - **自定义 skill / 插件：**最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：**无需代码即可使用，但速度更慢，也更脆弱。

    如果你想按客户保留上下文（代理机构工作流），一个简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 当前工作）。
    - 要求智能体在会话开始时获取该页面。

    如果你想要原生集成，请提交功能请求，或构建一个
    面向这些 API 的 skill。

    安装 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会落在活动工作区的 `skills/` 目录中。若要在多个智能体之间共享 Skills，请将它们放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只有部分智能体应该看到共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。一些 Skills 需要通过 Homebrew 安装的二进制文件；在 Linux 上，这意味着 Linuxbrew（参见上面的 Homebrew Linux 常见问题条目）。请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何将我已登录的 Chrome 与 OpenClaw 搭配使用？">
    使用内置的 `user` 浏览器配置文件，它通过 Chrome DevTools MCP 附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，请创建一个显式 MCP 配置文件：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    这一路径可以使用本地主机浏览器或已连接的浏览器节点。如果 Gateway 网关在其他地方运行，请在浏览器所在机器上运行节点主机，或改用远程 CDP。

    `existing-session` / `user` 当前限制：

    - 操作由 ref 驱动，而不是由 CSS 选择器驱动
    - 上传需要 `ref` / `inputRef`，且目前一次支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍需要托管浏览器或原始 CDP 配置文件

  </Accordion>
</AccordionGroup>

## 沙箱隔离和记忆

<AccordionGroup>
  <Accordion title="有专门的沙箱隔离文档吗？">
    有。请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。关于 Docker 专用设置（Docker 中的完整 Gateway 网关或沙箱镜像），请参阅 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉受限，如何启用完整功能？">
    默认镜像以安全优先，并以 `node` 用户运行，因此它不
    包含系统包、Homebrew 或内置浏览器。若要获得更完整的设置：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，让缓存保留下来。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH`，并确保该路径已持久化。

    文档：[Docker](/zh-CN/install/docker)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以用一个智能体让私信保持个人化，但让群组公开/沙箱隔离吗？">
    可以，前提是你的私人流量是**私信**，公开流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，让群组/渠道会话（非主键）在配置的沙箱后端中运行，而主私信会话保留在主机上。如果你没有选择后端，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置步骤 + 示例配置：[群组：个人私信 + 公开群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway 网关配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何将主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局绑定与每个智能体的绑定会合并；当 `scope: "shared"` 时，每个智能体的绑定会被忽略。对任何敏感内容使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会同时根据规范化路径，以及通过最深层已存在祖先解析得到的规范路径来验证绑定来源。这意味着即使最后一个路径段尚不存在，符号链接父级逃逸仍会关闭失败，并且在符号链接解析后仍会应用允许根检查。

    请参阅[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)和[沙箱 vs 工具策略 vs 提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)，查看示例和安全说明。

  </Accordion>

  <Accordion title="记忆如何工作？">
    OpenClaw 记忆只是智能体工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日笔记
    - `MEMORY.md` 中的精选长期笔记（仅主会话/私人会话）

    OpenClaw 还会运行**静默的压缩前记忆刷新**，提醒模型
    在自动压缩前写入持久笔记。它只会在工作区
    可写时运行（只读沙箱会跳过）。请参阅[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="记忆总是忘事。如何让它记住？">
    要求机器人**将事实写入记忆**。长期笔记应放在 `MEMORY.md` 中，
    短期上下文应放入 `memory/YYYY-MM-DD.md`。

    这仍是我们正在改进的领域。提醒模型存储记忆会有帮助；
    它会知道该怎么做。如果它仍然忘记，请确认 Gateway 网关每次运行都使用同一个
    工作区。

    文档：[记忆](/zh-CN/concepts/memory)、[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永久保留吗？有哪些限制？">
    记忆文件位于磁盘上，会一直保留，直到你删除它们。限制来自你的
    存储空间，而不是模型。**会话上下文**仍受模型
    上下文窗口限制，因此长对话可能会被压缩或截断。这就是
    记忆搜索存在的原因，它只会把相关部分拉回上下文。

    文档：[记忆](/zh-CN/concepts/memory)、[上下文](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索是否需要 OpenAI API key？">
    仅当你使用 **OpenAI 嵌入**时才需要。Codex OAuth 覆盖聊天/补全，并且
    **不会**授予嵌入访问权限，因此**使用 Codex 登录（OAuth 或
    Codex CLI 登录）**对语义记忆搜索没有帮助。OpenAI 嵌入
    仍然需要真正的 API key（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置提供商，OpenClaw 会在能够解析到 API key（认证配置文件、`models.providers.*.apiKey` 或环境变量）时自动选择一个提供商。
    如果解析到 OpenAI key，它会优先使用 OpenAI；否则如果解析到 Gemini key，
    则使用 Gemini，然后是 Voyage，再然后是 Mistral。如果没有可用的远程 key，记忆
    搜索会保持禁用，直到你配置它。如果你配置并提供了本地模型路径，
    OpenClaw
    会优先使用 `local`。当你显式设置
    `memorySearch.provider = "ollama"` 时支持 Ollama。

    如果你更想保持本地运行，请设置 `memorySearch.provider = "local"`（并可选择设置
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini 嵌入，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或本地**嵌入
    模型 - 请参阅 [Memory](/zh-CN/concepts/memory) 了解设置详情。

  </Accordion>
</AccordionGroup>

## 内容在磁盘上的位置

<AccordionGroup>
  <Accordion title="与 OpenClaw 一起使用的所有数据都会保存在本地吗？">
    不会 - **OpenClaw 的状态是本地的**，但**外部服务仍然会看到你发送给它们的内容**。

    - **默认本地：** 会话、记忆文件、配置和工作区位于 Gateway 网关主机
      （`~/.openclaw` + 你的工作区目录）。
    - **必要时远程：** 你发送给模型提供商（Anthropic/OpenAI 等）的消息会进入
      它们的 API，聊天平台（WhatsApp/Telegram/Slack 等）会把消息数据存储在
      它们的服务器上。
    - **你控制足迹：** 使用本地模型会把提示词保留在你的机器上，但渠道
      流量仍然会经过该渠道的服务器。

    相关内容：[Agent 工作区](/zh-CN/concepts/agent-workspace)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 将数据存储在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                            | 用途                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到认证配置文件）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 认证配置文件（OAuth、API key，以及可选的 `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供商的可选文件后备 secret 载荷 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目会被清除）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每智能体状态（agentDir + 会话）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史和状态（按智能体）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（按智能体）                                       |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、skills 等）是独立的，并通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于 **agent 工作区**中，而不是 `~/.openclaw`。

    - **工作区（按智能体）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`，以及可选的 `HEARTBEAT.md`。
      小写根目录 `memory.md` 只是旧版修复输入；当两个文件都存在时，`openclaw doctor --fix`
      可以将它合并到 `MEMORY.md` 中。
    - **状态目录（`~/.openclaw`）**：配置、渠道/提供商状态、认证配置文件、会话、日志，
      以及共享 Skills（`~/.openclaw/skills`）。

    默认工作区是 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“忘记”了，请确认 Gateway 网关每次启动时都使用同一个
    工作区（并记住：远程模式使用的是 **gateway 主机的**
    工作区，而不是你的本地笔记本电脑）。

    提示：如果你想要持久的行为或偏好，请让机器人**将其写入
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    请参阅 [Agent 工作区](/zh-CN/concepts/agent-workspace) 和 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的 **agent 工作区**放入**私有** git 仓库，并备份到某个
    私有位置（例如 GitHub private）。这会捕获记忆 + AGENTS/SOUL/USER
    文件，并允许你稍后恢复助手的“心智”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭据、会话、令牌或加密的 secret 载荷）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （请参阅上面的迁移问题）。

    文档：[Agent 工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全卸载 OpenClaw？">
    请参阅专门指南：[卸载](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体能在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，而不是硬性沙箱。
    相对路径会在工作区内解析，但除非启用沙箱隔离，否则绝对路径可以访问其他
    主机位置。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每智能体沙箱设置。如果你
    想让某个仓库成为默认工作目录，请将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库只是源代码；请保持
    工作区分离，除非你有意让智能体在其中工作。

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
    会话状态由 **gateway 主机**拥有。如果你处于远程模式，你关心的会话存储位于远程机器上，而不是你的本地笔记本电脑。请参阅[会话管理](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH` 读取一个可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果文件缺失，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何监听 / UI 显示未授权'>
    非 loopback 绑定**需要有效的 gateway 认证路径**。实际含义是：

    - 共享 secret 认证：令牌或密码
    - 正确配置的身份感知反向代理后面的 `gateway.auth.mode: "trusted-proxy"`

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

    注意：

    - `gateway.remote.token` / `.password` 本身**不会**启用本地 gateway 认证。
    - 只有在未设置 `gateway.auth.*` 时，本地调用路径才可以使用 `gateway.remote.*` 作为后备。
    - 对于密码认证，请改为设置 `gateway.auth.mode: "password"` 加 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但未解析，解析会失败关闭（不会用远程后备掩盖）。
    - 共享 secret Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password`（存储在应用/UI 设置中）进行认证。Tailscale Serve 或 `trusted-proxy` 等携带身份的模式改用请求标头。避免在 URL 中放置共享 secret。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`，并在 `gateway.trustedProxies` 中添加 loopback 条目。

  </Accordion>

  <Accordion title="为什么现在 localhost 上需要令牌？">
    OpenClaw 默认强制执行 gateway 认证，包括 loopback。在正常默认路径中，这意味着令牌认证：如果未配置显式认证路径，gateway 启动会解析为令牌模式，并为该次启动生成仅运行时有效的令牌，因此**本地 WS 客户端必须认证**。当客户端需要跨重启稳定的 secret 时，请显式配置 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。这会阻止其他本地进程调用 Gateway 网关。

    如果你更喜欢其他认证路径，可以显式选择密码模式（或者，对于身份感知反向代理，选择 `trusted-proxy`）。如果你**确实**想开放 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可随时为你生成令牌：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="更改配置后必须重启吗？">
    Gateway 网关会监视配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：热应用安全更改，对关键更改重启
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
    - `default`：每次使用 `All your chats, one OpenClaw.`。
    - `random`：轮换有趣/季节性标语（默认行为）。
    - 如果你完全不想显示横幅，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（以及 Web 抓取）？">
    `web_fetch` 无需 API key 即可工作。`web_search` 取决于你选择的
    提供商：

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily 等 API 后备提供商需要其正常的 API key 设置。
    - Ollama Web 搜索无需 key，但它会使用你配置的 Ollama 主机，并且需要 `ollama signin`。
    - DuckDuckGo 无需 key，但它是基于 HTML 的非官方集成。
    - SearXNG 无需 key/可自托管；配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：** 运行 `openclaw configure --section web` 并选择一个提供商。
    环境替代项：

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

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

    特定于提供商的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧版 `tools.web.search.*` 提供商路径仍会暂时加载以保持兼容性，但不应再用于新配置。
    Firecrawl Web 获取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    注意事项：

    - 如果你使用 allowlist，请添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭证中自动检测第一个就绪的获取回退提供商。目前内置的提供商是 Firecrawl。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web 工具](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 擦除了我的配置。如何恢复并避免这种情况？">
    `config.apply` 会替换**整个配置**。如果你发送部分对象，其他所有内容
    都会被移除。

    当前 OpenClaw 会防止许多意外覆盖：

    - OpenClaw 拥有的配置写入会在写入前验证变更后的完整配置。
    - 无效或破坏性的 OpenClaw 拥有写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑导致启动或热重载失败，Gateway 网关会失败关闭或跳过重载；它不会重写 `openclaw.json`。
    - `openclaw doctor --fix` 负责修复，并可以恢复上一个已知可用配置，同时将被拒绝的文件保存为 `openclaw.json.clobbered.*`。

    恢复：

    - 查看 `openclaw logs --follow` 中是否有 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 检查活动配置旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 运行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 只用 `openclaw config set` 或 `config.patch` 把需要的键复制回去。
    - 如果你没有上一个已知可用配置或被拒绝的载荷，请从备份恢复，或重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这是意外情况，请提交 bug，并包含你最后已知的配置或任何备份。
    - 本地编码智能体通常可以从日志或历史记录中重建可用配置。

    避免：

    - 使用 `openclaw config set` 进行小改动。
    - 使用 `openclaw configure` 进行交互式编辑。
    - 当你不确定确切路径或字段形状时，先使用 `config.schema.lookup`；它会返回浅层 schema 节点以及用于深入查看的直接子项摘要。
    - 使用 `config.patch` 进行部分 RPC 编辑；`config.apply` 只用于完整配置替换。
    - 如果你在一次智能体运行中使用仅所有者可用的 `gateway` 工具，它仍会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会归一化到相同受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[配置](/zh-CN/cli/config)、[配置](/zh-CN/cli/configure)、[Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何在多台设备上运行带专用 worker 的中心 Gateway 网关？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**：

    - **Gateway 网关（中心）：**拥有渠道（Signal/WhatsApp）、路由和会话。
    - **节点（设备）：**Mac/iOS/Android 作为外围设备连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（worker）：**用于特殊角色的独立大脑/工作区（例如“Hetzner 运维”、“个人数据”）。
    - **子智能体：**当你需要并行处理时，从主智能体生成后台工作。
    - **TUI：**连接到 Gateway 网关并切换智能体/会话。

    文档：[节点](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[TUI](/zh-CN/web/tui)。

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

    默认值是 `false`（有界面）。无头模式在某些站点上更容易触发反机器人检查。请参阅[浏览器](/zh-CN/tools/browser)。

    无头模式使用**相同的 Chromium 引擎**，适用于大多数自动化任务（表单、点击、抓取、登录）。主要差异：

    - 没有可见的浏览器窗口（如果需要视觉内容，请使用截图）。
    - 某些站点对无头模式下的自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 经常会阻止无头会话。

  </Accordion>

  <Accordion title="如何使用 Brave 控制浏览器？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。
    请参阅[浏览器](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)中的完整配置示例。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、Gateway 网关和节点之间传播？">
    Telegram 消息由 **Gateway 网关**处理。Gateway 网关运行智能体，
    只有在需要节点工具时，才会通过 **Gateway WebSocket** 调用节点：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    节点看不到入站提供商流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程，我的智能体如何访问我的电脑？">
    简短答案：**将你的电脑配对为节点**。Gateway 网关在别处运行，但它可以
    通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在始终在线的主机（VPS/家用服务器）上运行 Gateway 网关。
    2. 将 Gateway 网关主机和你的电脑放在同一个 tailnet 中。
    3. 确保 Gateway WS 可访问（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以 **Remote over SSH** 模式（或直接 tailnet）
       连接，这样它就能注册为节点。
    5. 在 Gateway 网关上批准节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP 桥接；节点通过 Gateway WebSocket 连接。

    安全提醒：配对 macOS 节点允许在该机器上运行 `system.run`。只
    配对你信任的设备，并查看[安全](/zh-CN/gateway/security)。

    文档：[节点](/zh-CN/nodes)、[Gateway 网关协议](/zh-CN/gateway/protocol)、[macOS 远程模式](/zh-CN/platforms/mac/remote)、[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到回复。现在怎么办？">
    检查基础项：

    - Gateway 网关正在运行：`openclaw gateway status`
    - Gateway 网关健康状态：`openclaw status`
    - 渠道健康状态：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，请确保 `gateway.auth.allowTailscale` 设置正确。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已启动，并指向正确端口。
    - 确认你的 allowlist（私信或群组）包含你的账号。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[渠道](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以。没有内置的“bot 到 bot”桥接，但你可以用几种
    可靠方式连接起来：

    **最简单：**使用两个 bot 都能访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让 Bot A 向 Bot B 发送消息，然后让 Bot B 像往常一样回复。

    **CLI 桥接（通用）：**运行一个脚本，用
    `openclaw agent --message ... --deliver` 调用另一个 Gateway 网关，目标是另一个 bot
    正在监听的聊天。如果某个 bot 在远程 VPS 上，请通过 SSH/Tailscale 将你的 CLI 指向该远程 Gateway 网关
    （参见[远程访问](/zh-CN/gateway/remote)）。

    示例模式（从可以访问目标 Gateway 网关的机器运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：添加防护规则，避免两个 bot 无限循环（仅提及时回复、渠道
    allowlist，或“不要回复 bot 消息”规则）。

    文档：[远程访问](/zh-CN/gateway/remote)、[Agent CLI](/zh-CN/cli/agent)、[智能体发送](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要单独的 VPS 吗？">
    不需要。一个 Gateway 网关可以托管多个智能体，每个智能体都有自己的工作区、模型默认值
    和路由。这是常规设置，而且比每个智能体运行一个 VPS 便宜、简单得多。

    只有在你需要强隔离（安全边界）或非常不同且不想共享的
    配置时，才使用单独的 VPS。否则，保留一个 Gateway 网关并
    使用多个智能体或子智能体。

  </Accordion>

  <Accordion title="相比从 VPS 通过 SSH 连接，在我的个人笔记本上使用节点有什么好处吗？">
    有，节点是从远程 Gateway 网关访问你笔记本的一等方式，并且
    解锁的不只是 shell 访问。Gateway 网关运行在 macOS/Linux（Windows 通过 WSL2）上，并且
    很轻量（小型 VPS 或 Raspberry Pi 级别设备即可；4 GB RAM 足够），所以常见
    设置是一个始终在线的主机加上作为节点的笔记本。

    - **不需要入站 SSH。**节点会向外连接到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。**`system.run` 受该笔记本上的节点 allowlist/批准限制。
    - **更多设备工具。**除了 `system.run`，节点还会暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。**将 Gateway 网关保留在 VPS 上，但通过笔记本上的节点主机在本地运行 Chrome，或通过 Chrome MCP 附加到主机上的本地 Chrome。

    SSH 适合临时 shell 访问，但对于持续的智能体工作流和
    设备自动化，节点更简单。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行 Gateway 网关服务吗？">
    不会。除非你有意运行隔离的 profile（参见[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)），否则每台主机应该只运行**一个 Gateway 网关**。节点是连接
    到 Gateway 网关的外围设备（iOS/Android 节点，或菜单栏应用中的 macOS“节点模式”）。对于无头节点
    主机和 CLI 控制，请参阅[节点主机 CLI](/zh-CN/cli/node)。

    对 `gateway`、`discovery` 和 `canvasHost` 的更改需要完整重启。

  </Accordion>

  <Accordion title="是否有 API / RPC 方式应用配置？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树及其浅层 schema 节点、匹配的 UI 提示和直接子项摘要
    - `config.get`：获取当前快照 + 哈希
    - `config.patch`：安全的部分更新（大多数 RPC 编辑首选）；可行时热重载，必要时重启
    - `config.apply`：验证 + 替换完整配置；可行时热重载，必要时重启
    - 仅所有者可用的 `gateway` 运行时工具仍拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会规范化到相同的受保护 exec 路径

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

    1. **在 VPS 上安装 + 登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装 + 登录**
       - 使用 Tailscale 应用，并登录同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，让 VPS 拥有稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway 网关 WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情况下访问控制 UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这会让 Gateway 网关绑定到 loopback，并通过 Tailscale 暴露 HTTPS。请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将一个 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露 **Gateway 网关控制 UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接。

    推荐设置：

    1. **确保 VPS + Mac 位于同一个 tailnet**。
    2. **在远程模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       该应用会隧道转发 Gateway 网关端口，并作为节点连接。
    3. **在 Gateway 网关上批准该节点**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway 网关协议](/zh-CN/gateway/protocol)、[设备发现](/zh-CN/gateway/discovery)、[macOS 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装，还是只添加一个节点？">
    如果你只需要在第二台笔记本上使用**本地工具**（屏幕/摄像头/exec），请将它添加为
    **节点**。这样可以保留单个 Gateway 网关，并避免重复配置。本地节点工具
    目前仅支持 macOS，但我们计划将它们扩展到其他操作系统。

    只有在需要**强隔离**或两个完全独立的机器人时，才安装第二个 Gateway 网关。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)、[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会读取父进程（shell、launchd/systemd、CI 等）的环境变量，并额外加载：

    - 当前工作目录中的 `.env`
    - 来自 `~/.openclaw/.env` 的全局后备 `.env`（也就是 `$OPENCLAW_STATE_DIR/.env`）

    这两个 `.env` 文件都不会覆盖现有环境变量。

    你也可以在配置中定义内联环境变量（仅在进程环境缺失时应用）：

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

  <Accordion title="我通过服务启动 Gateway 网关后，环境变量不见了。现在怎么办？">
    两个常见修复方式：

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

    这会运行你的登录 shell，并只导入缺失的预期键名（绝不覆盖）。对应的环境变量：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但模型状态显示 “Shell env: off.”，为什么？'>
    `openclaw models status` 会报告是否启用了 **shell 环境导入**。“Shell env: off”
    并不表示你的环境变量缺失，只表示 OpenClaw 不会自动加载
    你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。任选其一修复：

    1. 将令牌放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将它添加到你的配置 `env` 块中（仅在缺失时应用）。

    然后重启 Gateway 网关并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot 令牌会从 `COPILOT_GITHUB_TOKEN`（也包括 `GH_TOKEN` / `GITHUB_TOKEN`）读取。
    请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多个聊天

<AccordionGroup>
  <Accordion title="如何开始一段全新对话？">
    以独立消息发送 `/new` 或 `/reset`。请参阅 [会话管理](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 后过期，但这**默认禁用**（默认值为 **0**）。
    将其设置为正值即可启用空闲过期。启用后，空闲期之后的**下一条**
    消息会为该聊天键启动一个新的会话 ID。
    这不会删除转录记录，只是启动一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法组建一组 OpenClaw 实例（一个 CEO 和多个智能体）？">
    可以，通过**多智能体路由**和**子智能体**实现。你可以创建一个协调
    智能体和多个工作智能体，它们各自拥有自己的工作区和模型。

    话虽如此，这最好被视为一个**有趣的实验**。它消耗大量 token，而且通常
    不如使用一个带独立会话的机器人高效。我们设想的典型模型是一个与你对话的
    机器人，并通过不同会话并行处理工作。该机器人也可以在需要时生成子智能体。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[智能体 CLI](/zh-CN/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文在任务中途被截断？如何防止？">
    会话上下文受模型窗口限制。长聊天、大量工具输出或许多
    文件都可能触发压缩或截断。

    有帮助的做法：

    - 让机器人总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，在切换主题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让机器人回读。
    - 对长任务或并行工作使用子智能体，让主聊天保持更小。
    - 如果这种情况经常发生，请选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何完全重置 OpenClaw 但保留安装？">
    使用重置命令：

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

    - 如果新手引导发现已有配置，也会提供**重置**。请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了 profile（`--profile` / `OPENCLAW_PROFILE`），请重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅限开发；会清除开发配置 + 凭证 + 会话 + 工作区）。

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

    - 启用或调整**会话裁剪**（`agents.defaults.contextPruning`）来裁剪旧工具输出。
    - 使用上下文窗口更大的模型。

    文档：[压缩](/zh-CN/concepts/compaction)、[会话裁剪](/zh-CN/concepts/session-pruning)、[会话管理](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我看到 “LLM request rejected: messages.content.tool_use.input field required”？'>
    这是提供商验证错误：模型发出了一个缺少必需
    `input` 的 `tool_use` 块。这通常表示会话历史过旧或已损坏（经常发生在长线程
    或工具/schema 变更之后）。

    修复：用 `/new`（独立消息）开始一个新会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟收到一次 Heartbeat 消息？">
    Heartbeat 默认每 **30m** 运行一次（使用 OAuth 凭证时为 **1h**）。可以调整或禁用：

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

    如果 `HEARTBEAT.md` 存在但实际为空（只有空行和类似
    `# Heading` 的 markdown 标题），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。
    如果文件缺失，Heartbeat 仍会运行，并由模型决定做什么。

    每个智能体的覆盖项使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要向 WhatsApp 群组添加一个“机器人账号”吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以如果你在群组中，OpenClaw 就能看到它。
    默认情况下，群组回复会被阻止，直到你允许发送者（`groupPolicy: "allowlist"`）。

    如果你只希望**你**能触发群组回复：

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
    选项 1（最快）：跟踪日志并在群组中发送一条测试消息：

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

    - 提及门控已开启（默认）。你必须 @ 提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups`，但没有配置 `"*"`，并且该群组未加入允许列表。

    请参阅 [群组](/zh-CN/channels/groups) 和 [群组消息](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会和私信共享上下文吗？">
    默认情况下，直接聊天会折叠到主会话。群组/频道有自己的会话键，Telegram 话题 / Discord 线程是独立会话。请参阅 [群组](/zh-CN/channels/groups) 和 [群组消息](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制。几十个（甚至几百个）都可以，但请注意：

    - **磁盘增长：**会话 + 转录记录位于 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：**更多智能体意味着更多并发模型使用。
    - **运维开销：**每个智能体都有凭证配置文件、工作区和渠道路由。

    建议：

    - 每个智能体保留一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增长，清理旧会话（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 查找多余工作区和配置文件不匹配。

  </Accordion>

  <Accordion title="我可以同时运行多个 bot 或聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**来运行多个隔离的智能体，并按
    渠道/账号/对端路由入站消息。Slack 支持作为一个渠道，并可绑定到指定智能体。

    浏览器访问能力很强，但并不是“人能做什么它就能做什么”——反 bot、CAPTCHA 和 MFA 仍然可能
    阻止自动化。若要获得最可靠的浏览器控制，请在主机上使用本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 常驻 Gateway 网关主机（VPS/Mac mini）。
    - 每个角色一个智能体（绑定）。
    - Slack 渠道绑定到这些智能体。
    - 需要时通过 Chrome MCP 或节点使用本地浏览器。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [浏览器](/zh-CN/tools/browser)、[节点](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## Models、故障转移和凭证配置文件

模型问答——默认值、选择、别名、切换、故障转移、凭证配置文件——
位于 [Models 常见问题](/zh-CN/help/faq-models)。

## Gateway 网关：端口、“已在运行”和远程模式

<AccordionGroup>
  <Accordion title="Gateway 网关使用哪个端口？">
    `gateway.port` 控制 WebSocket + HTTP（控制界面、钩子等）的单个多路复用端口。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示“Runtime: running”，但显示“Connectivity probe: failed”？'>
    因为“running”是**监督器**视角（launchd/systemd/schtasks）。连接性探测是 CLI 实际连接到 Gateway 网关 WebSocket。

    使用 `openclaw gateway status` 并以这些行可信：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（端口上实际绑定的内容）
    - `Last gateway error:`（进程存活但端口未监听时的常见根因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示的“Config (cli)”和“Config (service)”不同？'>
    你正在编辑一个配置文件，而服务正在使用另一个配置文件运行（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复：

    ```bash
    openclaw gateway install --force
    ```

    请从你希望服务使用的同一个 `--profile` / 环境运行该命令。

  </Accordion>

  <Accordion title='“another gateway instance is already listening”是什么意思？'>
    OpenClaw 会通过在启动时立即绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`）来强制执行运行时锁。如果绑定因 `EADDRINUSE` 失败，它会抛出 `GatewayLockError`，表示另一个实例已在监听。

    修复：停止另一个实例，释放端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何以远程模式运行 OpenClaw（客户端连接到别处的 Gateway 网关）？">
    设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，也可以选择使用共享密钥远程凭证：

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

    注意：

    - `openclaw gateway` 仅在 `gateway.mode` 为 `local` 时启动（或你传入覆盖标志时）。
    - macOS 应用会监视配置文件，并在这些值变化时实时切换模式。
    - `gateway.remote.token` / `.password` 只是客户端侧远程凭证；它们本身不会启用本地 Gateway 网关凭证。

  </Accordion>

  <Accordion title='控制界面显示“unauthorized”（或持续重新连接）。现在怎么办？'>
    你的 Gateway 网关凭证路径和界面的凭证方法不匹配。

    事实（来自代码）：

    - 控制界面会将当前浏览器标签页会话和所选 Gateway 网关 URL 的 token 保存在 `sessionStorage` 中，因此同一标签页刷新时无需恢复长期 localStorage token 持久化也能继续工作。
    - 遇到 `AUTH_TOKEN_MISMATCH` 时，受信任客户端可以在 Gateway 网关返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）时，使用缓存的设备 token 尝试一次有界重试。
    - 该缓存 token 重试现在会复用与设备 token 一起存储的已批准缓存作用域。显式 `deviceToken` / 显式 `scopes` 调用方仍会保留其请求的作用域集，而不是继承缓存作用域。
    - 在该重试路径之外，连接凭证优先级为：显式共享 token/password 优先，其次是显式 `deviceToken`，然后是已存储设备 token，最后是 bootstrap token。
    - Bootstrap token 作用域检查带有角色前缀。内置 bootstrap 操作员允许列表只满足操作员请求；节点或其他非操作员角色仍需要其自身角色前缀下的作用域。

    修复：

    - 最快：`openclaw dashboard`（打印 + 复制仪表板 URL，尝试打开；如果是无头环境，会显示 SSH 提示）。
    - 如果你还没有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是远程，先建隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。
    - 共享密钥模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在控制界面设置中粘贴匹配的密钥。
    - Tailscale Serve 模式：确保 `gateway.auth.allowTailscale` 已启用，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份标头的原始 loopback/tailnet URL。
    - 受信任代理模式：确保你是通过已配置的身份感知代理进入，而不是原始 Gateway 网关 URL。同主机 loopback 代理还需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重试后仍不匹配，请轮换/重新批准已配对设备 token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该轮换调用显示被拒绝，请检查两件事：
      - 已配对设备会话只能轮换其**自己的**设备，除非它们还拥有 `operator.admin`
      - 显式 `--scope` 值不能超出调用方当前的操作员作用域
    - 仍然卡住？运行 `openclaw status --all` 并按照[故障排除](/zh-CN/gateway/troubleshooting)操作。凭证详情见[仪表板](/zh-CN/web/dashboard)。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet，但它无法绑定且没有任何监听">
    `tailnet` 绑定会从你的网络接口中选择一个 Tailscale IP（100.64.0.0/10）。如果该机器不在 Tailscale 上（或接口已关闭），就没有可绑定的内容。

    修复：

    - 在该主机上启动 Tailscale（使其拥有 100.x 地址），或
    - 切换到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是显式设置。`auto` 优先选择 loopback；当你想要仅 tailnet 绑定时，请使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一主机上运行多个 Gateway 网关吗？">
    通常不需要——一个 Gateway 网关可以运行多个消息渠道和智能体。只有在需要冗余（例如救援 bot）或强隔离时才使用多个 Gateway 网关。

    可以，但你必须隔离：

    - `OPENCLAW_CONFIG_PATH`（每个实例的配置）
    - `OPENCLAW_STATE_DIR`（每个实例的状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 每个实例使用 `openclaw --profile <name> ...`（自动创建 `~/.openclaw-<name>`）。
    - 在每个 profile 配置中设置唯一的 `gateway.port`（或手动运行时传入 `--port`）。
    - 安装每个 profile 的服务：`openclaw --profile <name> gateway install`。

    Profile 还会给服务名称加后缀（`ai.openclaw.<profile>`；旧版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='“invalid handshake” / 代码 1008 是什么意思？'>
    Gateway 网关是一个 **WebSocket 服务器**，它期望第一条消息就是
    `connect` 帧。如果收到其他任何内容，它会以 **代码 1008**（策略违规）
    关闭连接。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`），而不是使用 WS 客户端。
    - 你使用了错误的端口或路径。
    - 代理或隧道剥离了凭证标头，或发送了非 Gateway 网关请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，则使用 `wss://...`）。
    2. 不要在普通浏览器标签页中打开 WS 端口。
    3. 如果启用了凭证，请在 `connect` 帧中包含 token/password。

    如果你使用 CLI 或 TUI，URL 应如下所示：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志记录和调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以通过 `logging.file` 设置稳定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快的日志跟踪：

    ```bash
    openclaw logs --follow
    ```

    服务/监督器日志（当 Gateway 网关通过 launchd/systemd 运行时）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；profile 使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多信息见[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 网关服务？">
    使用 Gateway 网关辅助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行 Gateway 网关，`openclaw gateway --force` 可以重新占用端口。见 [Gateway 网关](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端——如何重启 OpenClaw？">
    有**两种 Windows 安装模式**：

    **1) WSL2（推荐）：**Gateway 网关在 Linux 内运行。

    打开 PowerShell，进入 WSL，然后重启：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你从未安装服务，请以前台方式启动：

    ```bash
    openclaw gateway run
    ```

    **2) 原生 Windows（不推荐）：**Gateway 网关直接在 Windows 中运行。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行它（没有服务），请使用：

    ```powershell
    openclaw gateway run
    ```

    文档：[Windows（WSL2）](/zh-CN/platforms/windows)、[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="Gateway 网关已启动，但回复始终不到达。我应该检查什么？">
    先做一次快速健康检查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - 模型凭证未加载到 **Gateway 网关主机**（检查 `models status`）。
    - 频道配对/允许列表阻止回复（检查频道配置 + 日志）。
    - WebChat/Dashboard 已打开，但没有正确的令牌。

    如果你在远程环境，请确认隧道/Tailscale 连接已启动，并且
    Gateway 网关 WebSocket 可访问。

    文档：[频道](/zh-CN/channels)、[故障排除](/zh-CN/gateway/troubleshooting)、[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title='“Disconnected from gateway: no reason” - 现在怎么办？'>
    这通常表示 UI 失去了 WebSocket 连接。请检查：

    1. Gateway 网关是否正在运行？`openclaw gateway status`
    2. Gateway 网关是否健康？`openclaw status`
    3. UI 是否有正确的令牌？`openclaw dashboard`
    4. 如果是远程环境，隧道/Tailscale 链接是否已启动？

    然后跟踪日志：

    ```bash
    openclaw logs --follow
    ```

    文档：[Dashboard](/zh-CN/web/dashboard)、[远程访问](/zh-CN/gateway/remote)、[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败。我该检查什么？">
    从日志和频道状态开始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后匹配错误：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目过多。OpenClaw 已经会裁剪到 Telegram 限制并用更少的命令重试，但仍需要删除一些菜单条目。减少插件/技能/自定义命令，或者如果你不需要菜单，请禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`，或类似网络错误：如果你在 VPS 上或位于代理后面，请确认允许出站 HTTPS，并且 `api.telegram.org` 的 DNS 正常工作。

    如果 Gateway 网关在远程环境，请确保你查看的是 Gateway 网关主机上的日志。

    文档：[Telegram](/zh-CN/channels/telegram)、[频道故障排除](/zh-CN/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有显示输出。我该检查什么？">
    先确认 Gateway 网关可访问，并且智能体可以运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你期望在聊天
    渠道中收到回复，请确保已启用投递（`/deliver on`）。

    文档：[TUI](/zh-CN/web/tui)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止然后启动 Gateway 网关？">
    如果你安装了服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这会停止/启动**受监管服务**（macOS 上的 launchd，Linux 上的 systemd）。
    当 Gateway 网关作为守护进程在后台运行时使用此方式。

    如果你是在前台运行，请用 Ctrl-C 停止，然后运行：

    ```bash
    openclaw gateway run
    ```

    文档：[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="五岁也能懂：openclaw gateway restart 与 openclaw gateway">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在当前终端会话中**以前台方式**运行 Gateway 网关。

    如果你安装了服务，请使用 gateway 命令。当你想进行一次性前台运行时，
    使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出现故障时获取更多详情的最快方式">
    使用 `--verbose` 启动 Gateway 网关，以获取更多控制台详情。然后检查日志文件中的频道凭证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的技能生成了图片/PDF，但没有发送任何内容">
    智能体的出站附件必须包含一行 `MEDIA:<path-or-url>`（单独占一行）。参见 [OpenClaw 助手设置](/zh-CN/start/openclaw)和[智能体发送](/zh-CN/tools/agent-send)。

    CLI 发送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    另请检查：

    - 目标频道支持出站媒体，并且未被允许列表阻止。
    - 文件在提供商的大小限制内（图片会调整到最大 2048px）。
    - `tools.fs.workspaceOnly=true` 会将本地路径发送限制在工作区、临时/媒体存储，以及通过沙箱验证的文件中。
    - `tools.fs.workspaceOnly=false` 允许 `MEDIA:` 发送智能体已经可读取的主机本地文件，但仅限媒体和安全文档类型（图片、音频、视频、PDF 和 Office 文档）。纯文本和类似密钥的文件仍会被阻止。

    参见[图片](/zh-CN/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全和访问控制

<AccordionGroup>
  <Accordion title="把 OpenClaw 暴露给入站私信安全吗？">
    将入站私信视为不受信任的输入。默认设置旨在降低风险：

    - 支持私信的频道上的默认行为是**配对**：
      - 未知发送者会收到配对码；机器人不会处理他们的消息。
      - 使用以下命令批准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求上限为**每个频道 3 个**；如果没有收到代码，请检查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公开开放私信需要显式选择加入（`dmPolicy: "open"` 和允许列表 `"*"`）。

    运行 `openclaw doctor` 以显示有风险的私信策略。

  </Accordion>

  <Accordion title="提示词注入只需要关注公共机器人吗？">
    不是。提示词注入关注的是**不受信任的内容**，而不只是哪些人可以私信机器人。
    如果你的助手会读取外部内容（Web 搜索/获取、浏览器页面、电子邮件、
    文档、附件、粘贴的日志），这些内容可能包含试图劫持模型的指令。
    即使**只有你一个发送者**，这种情况也可能发生。

    最大的风险出现在启用工具时：模型可能被诱导代表你泄露上下文或调用工具。通过以下方式降低影响范围：

    - 使用只读或禁用工具的 “reader” 智能体来总结不受信任的内容
    - 对启用工具的智能体关闭 `web_search` / `web_fetch` / `browser`
    - 同样将解码后的文件/文档文本视为不受信任：OpenResponses
      `input_file` 和媒体附件提取都会用显式外部内容边界标记包裹提取的文本，
      而不是传递原始文件文本
    - 使用沙箱隔离和严格的工具允许列表

    详情：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我的机器人应该有自己的电子邮件、GitHub 账号或电话号码吗？">
    对大多数设置来说，是的。用独立账号和电话号码隔离机器人，
    能在出问题时降低影响范围。这也让你更容易轮换
    凭证或撤销访问权限，而不会影响个人账号。

    从小范围开始。只授予实际需要的工具和账号访问权限，如有需要再逐步扩展。

    文档：[安全](/zh-CN/gateway/security)、[配对](/zh-CN/channels/pairing)。

  </Accordion>

  <Accordion title="我可以让它自主处理我的短信吗，这安全吗？">
    我们**不**建议让它完全自主处理你的个人消息。最安全的模式是：

    - 将私信保持在**配对模式**或严格允许列表中。
    - 如果你想让它代表你发送消息，请使用**单独的号码或账号**。
    - 让它先起草，然后**发送前批准**。

    如果你想实验，请在专用账号上进行并保持隔离。参见
    [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我可以用更便宜的模型处理个人助手任务吗？">
    可以，**前提是**智能体仅用于聊天且输入可信。较小档位
    更容易受到指令劫持影响，因此避免将它们用于启用工具的智能体，
    或读取不受信任内容的场景。如果必须使用较小模型，请锁定
    工具并在沙箱中运行。参见[安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中运行了 /start，但没有收到配对码">
    仅当未知发送者向机器人发送消息且启用
    `dmPolicy: "pairing"` 时，才会发送配对码。单独运行 `/start` 不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即访问，请将你的发送者 ID 加入允许列表，或为该账号设置 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会给我的联系人发消息吗？配对如何工作？">
    不会。默认 WhatsApp 私信策略是**配对**。未知发送者只会收到配对码，他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或回复你显式触发的发送。

    使用以下命令批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导电话号码提示：它用于设置你的**允许列表/所有者**，从而允许你自己的私信。它不会用于自动发送。如果你在个人 WhatsApp 号码上运行，请使用该号码并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任务以及“它不会停止”

<AccordionGroup>
  <Accordion title="如何阻止内部系统消息显示在聊天中？">
    大多数内部消息或工具消息只会在该会话启用 **verbose**、**trace** 或 **reasoning** 时出现。

    在你看到它的聊天中修复：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很嘈杂，请检查 Control UI 中的会话设置，并将 verbose
    设置为**继承**。还要确认你没有使用在配置中将 `verboseDefault` 设置
    为 `on` 的机器人配置文件。

    文档：[思考与详细输出](/zh-CN/tools/thinking)、[安全](/zh-CN/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在运行的任务？">
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

    斜杠命令概览：参见 [Slash commands](/zh-CN/tools/slash-commands)。

    大多数命令必须作为以 `/` 开头的**独立**消息发送，但少数快捷方式（如 `/status`）也适用于允许列表中的发送者的行内消息。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（“Cross-context messaging denied”）'>
    OpenClaw 默认阻止**跨提供商**消息。如果工具调用绑定到
    Telegram，除非你显式允许，否则它不会发送到 Discord。

    为智能体启用跨提供商消息：

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

  <Accordion title='为什么感觉机器人会“忽略”快速连续发送的消息？'>
    队列模式控制新消息如何与正在进行的运行交互。使用 `/queue` 更改模式：

    - `steer` - 将所有待处理 Steering queue 排入当前运行中下一个模型边界
    - `queue` - 旧版逐条 Steering queue
    - `followup` - 逐条运行消息
    - `collect` - 批量收集消息并回复一次
    - `steer-backlog` - 立即 Steer，然后处理积压消息
    - `interrupt` - 中止当前运行并重新开始

    默认模式是 `steer`。你可以为后续模式添加类似 `debounce:0.5s cap:25 drop:summarize` 的选项。请参阅 [命令队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='使用 API key 时，Anthropic 的默认模型是什么？'>
    在 OpenClaw 中，凭证和模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在身份验证配置文件中存储 Anthropic API key）会启用身份验证，但实际的默认模型取决于你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 网关无法在正在运行的智能体预期的 `auth-profiles.json` 中找到 Anthropic 凭证。
  </Accordion>
</AccordionGroup>

---

仍然卡住？请在 [Discord](https://discord.com/invite/clawd) 中提问，或发起 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)。

## 相关内容

- [首次运行常见问题](/zh-CN/help/faq-first-run) — 安装、新手引导、身份验证、订阅、初期故障
- [模型常见问题](/zh-CN/help/faq-models) — 模型选择、故障转移、身份验证配置文件
- [故障排除](/zh-CN/help/troubleshooting) — 按症状优先的分诊
