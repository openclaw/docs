---
read_when:
    - 首次设置 OpenClaw
    - 查找常见配置模式
    - 导航到特定配置章节
summary: 配置概览：常见任务、快速设置，以及完整参考链接
title: 配置
x-i18n:
    generated_at: "2026-06-27T02:00:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 配置。
活动配置路径必须是常规文件。对于 OpenClaw 拥有的写入，不支持符号链接形式的 `openclaw.json`
布局；原子写入可能会替换该路径，而不是保留符号链接。如果你将配置保存在
默认状态目录之外，请将 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

如果文件缺失，OpenClaw 会使用安全默认值。添加配置的常见原因：

- 连接渠道并控制谁可以给机器人发消息
- 设置模型、工具、沙箱隔离或自动化（cron、钩子）
- 调整会话、媒体、网络或 UI

查看[完整参考](/zh-CN/gateway/configuration-reference)，了解每个可用字段。

智能体和自动化在编辑配置前，应使用 `config.schema.lookup` 获取精确的字段级
文档。使用本页获取面向任务的指导，并使用
[配置参考](/zh-CN/gateway/configuration-reference)了解更完整的
字段映射和默认值。

<Tip>
**刚开始配置？** 从 `openclaw onboard` 开始进行交互式设置，或查看[配置示例](/zh-CN/gateway/configuration-examples)指南，获取完整的可复制粘贴配置。
</Tip>

## 最小配置

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 编辑配置

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789)，并使用 **配置** 标签页。
    Control UI 会根据实时配置架构渲染表单，包括字段
    `title` / `description` 文档元数据，以及可用时的插件和渠道架构，
    并提供 **原始 JSON** 编辑器作为备用入口。对于下钻式
    UI 和其他工具，Gateway 网关还会暴露 `config.schema.lookup`，
    用于获取一个路径范围内的架构节点及其直接子项摘要。
  </Tab>
  <Tab title="Direct edit">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关会监视该文件并自动应用更改（参见[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格验证

<Warning>
OpenClaw 只接受完全匹配架构的配置。未知键名、格式错误的类型或无效值会导致 Gateway 网关**拒绝启动**。唯一的根级例外是 `$schema`（字符串），以便编辑器附加 JSON Schema 元数据。
</Warning>

`openclaw config schema` 会打印 Control UI 和验证使用的规范 JSON Schema。
`config.schema.lookup` 会为下钻工具获取单个路径范围内的节点及
子项摘要。字段 `title`/`description` 文档元数据会贯穿嵌套对象、
通配符（`*`）、数组项（`[]`）以及 `anyOf`/
`oneOf`/`allOf` 分支。加载清单注册表后，运行时插件和渠道架构会合并进来。

验证失败时：

- Gateway 网关不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看精确问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

Gateway 网关会在每次成功启动后保留一个可信的最后已知可用副本，
但启动和热重载不会自动恢复它。如果 `openclaw.json`
验证失败（包括插件本地验证），Gateway 网关启动会失败，或
跳过重载并让当前运行时保留上一次接受的配置。
运行 `openclaw doctor --fix`（或 `--yes`）修复带前缀/被覆盖的配置，或
恢复最后已知可用副本。当候选配置包含诸如 `***` 的已脱敏密钥占位符时，
会跳过提升为最后已知可用副本。

## 常见任务

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    每个渠道在 `channels.<provider>` 下都有自己的配置部分。有关设置步骤，请查看对应的渠道页面：

    - [WhatsApp](/zh-CN/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/zh-CN/channels/telegram) - `channels.telegram`
    - [Discord](/zh-CN/channels/discord) - `channels.discord`
    - [Feishu](/zh-CN/channels/feishu) - `channels.feishu`
    - [Google Chat](/zh-CN/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/zh-CN/channels/msteams) - `channels.msteams`
    - [Slack](/zh-CN/channels/slack) - `channels.slack`
    - [Signal](/zh-CN/channels/signal) - `channels.signal`
    - [iMessage](/zh-CN/channels/imessage) - `channels.imessage`
    - [Mattermost](/zh-CN/channels/mattermost) - `channels.mattermost`

    所有渠道共享同一种私信策略模式：

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choose and configure models">
    设置主模型和可选回退模型：

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` 定义模型目录，并作为 `/model` 的允许列表；`provider/*` 条目会将 `/model`、`/models` 和模型选择器筛选到所选提供商，同时仍然使用动态模型发现。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加允许列表条目，而不会移除现有模型。除非传入 `--replace`，否则会移除条目的普通替换会被拒绝。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制转录/工具图片下采样（默认 `1200`）；较低的值通常会减少截图密集型运行中的视觉 token 使用量。
    - 查看[模型 CLI](/zh-CN/concepts/models)了解如何在聊天中切换模型，并查看[模型故障转移](/zh-CN/concepts/model-failover)了解凭证轮换和回退行为。
    - 对于自定义/自托管提供商，请参阅参考中的[自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="Control who can message the bot">
    私信访问通过 `dmPolicy` 按渠道控制：

    - `"pairing"`（默认）：未知发送者会收到一次性配对码用于批准
    - `"allowlist"`：只允许 `allowFrom` 中的发送者（或已配对允许存储中的发送者）
    - `"open"`：允许所有入站私信（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy` + `groupAllowFrom` 或渠道特定的允许列表。

    查看[完整参考](/zh-CN/gateway/config-channels#dm-and-group-access)，了解每个渠道的详细信息。

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    群组消息默认**需要提及**。按智能体配置触发模式。普通群组/渠道回复会自动发布；对于智能体应自行决定何时发言的共享房间，请选择启用消息工具路径：

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **元数据提及**：原生 @ 提及（WhatsApp 点按提及、Telegram @bot 等）
    - **文本模式**：`mentionPatterns` 中的安全正则模式
    - **可见回复**：`messages.visibleReplies` 可以全局要求使用消息工具发送；`messages.groupChat.visibleReplies` 会为群组/渠道覆盖该设置。
    - 查看[完整参考](/zh-CN/gateway/config-channels#group-chat-mention-gating)，了解可见回复模式、按渠道覆盖和自聊天模式。

  </Accordion>

  <Accordion title="Restrict skills per agent">
    使用 `agents.defaults.skills` 作为共享基线，然后用
    `agents.list[].skills` 覆盖特定智能体：

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills`，默认不限制 Skills。
    - 省略 `agents.list[].skills` 以继承默认值。
    - 将 `agents.list[].skills: []` 设置为不启用 Skills。
    - 查看 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)，以及
      [配置参考](/zh-CN/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    控制 Gateway 网关重启看起来已过期的渠道时的激进程度：

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - 将 `gateway.channelHealthCheckMinutes: 0` 设置为全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled` 可在不禁用全局监控的情况下，禁用某个渠道或账号的自动重启。
    - 查看[健康检查](/zh-CN/gateway/health)了解运维调试，并查看[完整参考](/zh-CN/gateway/configuration-reference#gateway)了解所有字段。

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    为本地客户端提供更多时间，以便在负载较高或低性能主机上完成预认证 WebSocket 握手：

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 默认值为 `15000` 毫秒。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 仍会优先用于一次性的服务或 shell 覆盖。
    - 优先修复启动/事件循环停顿；此旋钮用于预热期间健康但较慢的主机。

  </Accordion>

  <Accordion title="Configure sessions and resets">
    会话控制对话连续性和隔离：

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
```

    - `dmScope`：`main`（共享）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：线程绑定会话路由的全局默认值（Discord 支持 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 有关作用域、身份链接和发送策略，请参阅[会话管理](/zh-CN/concepts/session)。
    - 有关所有字段，请参阅[完整参考](/zh-CN/gateway/config-agents#session)。

  </Accordion>

  <Accordion title="启用沙箱隔离">
    在隔离的沙箱运行时中运行智能体会话：

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    先构建镜像 - 从源码 checkout 运行 `scripts/sandbox-setup.sh`，或从 npm 安装时参阅[沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)中的内联 `docker build` 命令。

    完整指南请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)，所有选项请参阅[完整参考](/zh-CN/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用基于中继的推送">
    公共 App Store/TestFlight 构建的基于中继的推送使用托管 OpenClaw 中继：`https://ios-push-relay.openclaw.ai`。

    自定义中继部署需要刻意分离的 iOS 构建/部署路径，其 relay URL 必须与 Gateway 网关 relay URL 匹配。如果你使用自定义中继构建，请在 Gateway 网关配置中设置：

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    等效 CLI：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    这会做什么：

    - 让 Gateway 网关通过外部中继发送 `push.test`、唤醒提示和重连唤醒。
    - 使用由已配对 iOS 应用转发的注册作用域发送授权。Gateway 网关不需要覆盖整个部署的中继令牌。
    - 将每个基于中继的注册绑定到 iOS 应用配对的 Gateway 网关身份，因此另一个 Gateway 网关无法复用已存储的注册。
    - 让本地/手动 iOS 构建继续使用直接 APNs。基于中继的发送仅适用于通过中继注册的官方分发构建。
    - 必须匹配烘焙到 iOS 构建中的中继基础 URL，确保注册和发送流量到达同一个中继部署。

    端到端流程：

    1. 安装官方/TestFlight iOS 构建。
    2. 可选：仅在使用刻意分离的自定义中继构建时，在 Gateway 网关上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用配对到 Gateway 网关，并让节点和操作员会话都连接。
    4. iOS 应用获取 Gateway 网关身份，使用 App Attest 和应用收据向中继注册，然后将基于中继的 `push.apns.register` 载荷发布到已配对的 Gateway 网关。
    5. Gateway 网关存储中继句柄和发送授权，然后将它们用于 `push.test`、唤醒提示和重连唤醒。

    运维说明：

    - 如果你将 iOS 应用切换到不同的 Gateway 网关，请重新连接应用，以便它可以发布绑定到该 Gateway 网关的新中继注册。
    - 如果你发布的新 iOS 构建指向不同的中继部署，应用会刷新其缓存的中继注册，而不是复用旧的中继来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖使用。
    - 自定义 Gateway 网关 relay URL 必须匹配烘焙到 iOS 构建中的中继基础 URL。公共 App Store 发布通道会拒绝自定义 iOS 中继 URL 覆盖。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是仅限 local loopback 的开发逃生口；不要在配置中持久化 HTTP 中继 URL。

    端到端流程请参阅 [iOS App](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)，中继安全模型请参阅[身份验证和信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="设置 Heartbeat（周期性签到）">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`：持续时间字符串（`30m`、`2h`）。设置为 `0m` 可禁用。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：对于私信风格的 Heartbeat 目标，使用 `allow`（默认）或 `block`
    - 完整指南请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="配置 cron 任务">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`：从 `sessions.json` 中清理已完成的隔离运行会话（默认 `24h`；设置为 `false` 可禁用）。
    - `runLog`：按任务清理保留的 cron 运行历史行。`maxBytes` 对较旧的文件后端运行日志仍然被接受。
    - 功能概览和 CLI 示例请参阅 [Cron 任务](/zh-CN/automation/cron-jobs)。

  </Accordion>

  <Accordion title="设置 webhooks（hooks）">
    在 Gateway 网关上启用 HTTP webhook 端点：

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    安全说明：
    - 将所有 hook/webhook 载荷内容视为不可信输入。
    - 使用专用的 `hooks.token`；不要复用活动 Gateway 网关身份验证密钥（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。
    - Hook 身份验证仅通过标头（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串令牌会被拒绝。
    - `hooks.path` 不能为 `/`；请将 webhook 入口保留在专用子路径上，例如 `/hooks`。
    - 除非进行严格限定范围的调试，否则保持不安全内容绕过标志禁用（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果启用 `hooks.allowRequestSessionKey`，还要设置 `hooks.allowedSessionKeyPrefixes` 来约束调用方选择的会话键。
    - 对于由 hook 驱动的智能体，优先使用强大的现代模型层级和严格工具策略（例如尽可能仅限消息传递并配合沙箱隔离）。

    有关所有映射选项和 Gmail 集成，请参阅[完整参考](/zh-CN/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="配置多智能体路由">
    使用独立工作区和会话运行多个隔离的智能体：

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    有关绑定规则和按智能体配置的访问配置文件，请参阅 [Multi-Agent](/zh-CN/concepts/multi-agent) 和[完整参考](/zh-CN/gateway/config-agents#multi-agent-routing)。

  </Accordion>

  <Accordion title="将配置拆分为多个文件（$include）">
    使用 `$include` 来组织大型配置：

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **单个文件**：替换包含它的对象
    - **文件数组**：按顺序深度合并（后者优先）
    - **同级键**：在 includes 之后合并（覆盖包含的值）
    - **嵌套 includes**：支持最多 10 层深度
    - **相对路径**：相对于包含它的文件解析
    - **路径格式**：include 路径不得包含 null 字节，并且在解析前后都必须严格短于 4096 个字符
    - **OpenClaw 所有的写入**：当写入仅更改一个顶层节，且该节由单文件 include 支持时，例如 `plugins: { $include: "./plugins.json5" }`，OpenClaw 会更新该被包含的文件，并保持 `openclaw.json` 不变
    - **不支持的直写**：对于根 includes、include 数组以及带同级覆盖的 includes，OpenClaw 所有的写入会失败关闭，而不是展平配置
    - **限制范围**：`$include` 路径必须解析到保存 `openclaw.json` 的目录下。若要在机器或用户之间共享一棵目录树，请将 `OPENCLAW_INCLUDE_ROOTS` 设置为附加目录的路径列表（POSIX 上为 `:`，Windows 上为 `;`），includes 可以引用这些目录。符号链接会被解析并重新检查，因此即使某个路径在词法上位于配置目录中，但其真实目标逃逸出每个允许的根，该路径仍会被拒绝。
    - **错误处理**：对缺失文件、解析错误、循环 includes、无效路径格式和长度过长给出清晰错误

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关会监视 `~/.openclaw/openclaw.json` 并自动应用更改 - 对大多数设置无需手动重启。

直接文件编辑在通过验证前会被视为不可信。监视器会等待编辑器临时写入/重命名抖动稳定，读取最终文件，并在不重写 `openclaw.json` 的情况下拒绝无效的外部编辑。OpenClaw 所有的配置写入在写入前使用相同的 schema 闸门；破坏性覆盖（例如删除 `gateway.mode` 或将文件缩小超过一半）会被拒绝，并保存为 `.rejected.*` 以供检查。

如果看到 `config reload skipped (invalid config)`，或启动报告 `Invalid config`，请检查配置，运行 `openclaw config validate`，然后运行 `openclaw doctor --fix` 进行修复。清单请参阅 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-rejected-invalid-config)。

### 重载模式

| 模式                   | 行为                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全更改。对关键更改自动重启。           |
| **`hot`**              | 仅热应用安全更改。需要重启时记录警告 - 由你处理。 |
| **`restart`**          | 任何配置更改都会重启 Gateway 网关，无论安全与否。                                 |
| **`off`**              | 禁用文件监视。更改会在下一次手动重启时生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些会热应用，哪些需要重启

大多数字段可以无停机热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别                | 字段                                                              | 需要重启？      |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 渠道                | `channels.*`、`web` (WhatsApp) - 所有内置渠道和插件渠道          | 否              |
| 智能体和模型        | `agent`、`agents`、`models`、`routing`                            | 否              |
| 自动化              | `hooks`、`cron`、`agent.heartbeat`                                | 否              |
| 会话和消息          | `session`、`messages`                                             | 否              |
| 工具和媒体          | `tools`、`browser`、`skills`、`mcp`、`audio`、`talk`              | 否              |
| UI 和其他           | `ui`、`logging`、`identity`、`bindings`                           | 否              |
| Gateway 服务器      | `gateway.*`（端口、绑定、认证、tailscale、TLS、HTTP）             | **是**          |
| 基础设施            | `discovery`、`plugins`                                            | **是**          |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外 - 更改它们**不会**触发重启。
</Note>

### 重载规划

当你编辑通过 `$include` 引用的源文件时，OpenClaw 会基于源文件编写的布局来规划重载，而不是基于扁平化后的内存视图。
这样即使某个顶层 section 独立存在于自己的 include 文件中，例如
`plugins: { $include: "./plugins.json5" }`，热重载决策（热应用与重启）也能保持可预测。
如果源布局存在歧义，重载规划会以失败关闭方式处理。

## 配置 RPC（程序化更新）

对于通过 Gateway API 写入配置的工具，建议使用此流程：

- 使用 `config.schema.lookup` 检查一个子树（浅层 schema 节点 + 子项摘要）
- 使用 `config.get` 获取当前快照和 `hash`
- 使用 `config.patch` 进行部分更新（JSON merge patch：对象合并，`null`
  删除，数组在条目会被移除时必须用 `replacePaths` 显式确认后才会替换）
- 只有在你打算替换整个配置时才使用 `config.apply`
- 使用 `update.run` 进行显式自更新并重启；如果重启后的会话应运行一个后续轮次，请包含 `continuationMessage`
- 使用 `update.status` 检查最新的更新重启哨兵，并在重启后验证正在运行的版本

智能体应将 `config.schema.lookup` 作为精确字段级文档和约束的第一站。
当它们需要更宽泛的配置映射、默认值或指向专用子系统参考的链接时，使用 [配置参考](/zh-CN/gateway/configuration-reference)。

<Note>
控制面写入（`config.apply`、`config.patch`、`update.run`）会按每个 `deviceId+clientIp` 限制为每 60 秒 3 个请求。
重启请求会合并，然后在重启周期之间强制执行 30 秒冷却时间。
`update.status` 是只读的，但限定为管理员范围，因为重启哨兵可能包含更新步骤摘要和命令输出尾部。
</Note>

部分 patch 示例：

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、`note` 和 `restartDelayMs`。
当配置已存在时，两个方法都必须提供 `baseHash`。

`config.patch` 还接受 `replacePaths`，这是一个配置路径数组，表示这些路径的数组替换是有意的。
如果某个 patch 会用更少的条目替换或删除现有数组，除非该精确路径出现在 `replacePaths` 中，否则 Gateway 会拒绝该写入；数组条目下的嵌套数组使用 `[]`，例如
`agents.list[].skills`。
这可以防止截断的 `config.get` 快照静默覆盖路由或 allowlist 数组。
当你打算替换完整配置时，请使用 `config.apply`。

## 环境变量

OpenClaw 会从父进程以及以下位置读取环境变量：

- 当前工作目录中的 `.env`（如果存在）
- `~/.openclaw/.env`（全局 fallback）

这两个文件都不会覆盖现有环境变量。你也可以在配置中设置内联环境变量：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 环境导入（可选）">
  如果启用且未设置预期键名，OpenClaw 会运行你的登录 shell，并仅导入缺失的键：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

环境变量等价项：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="配置值中的环境变量替换">
  在任何配置字符串值中用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失/空变量会在加载时抛出错误
- 使用 `$${VAR}` 转义以输出字面值
- 可在 `$include` 文件中使用
- 内联替换：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret 引用（环境、文件、exec）">
  对于支持 SecretRef 对象的字段，你可以使用：

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef 详细信息（包括适用于 `env`/`file`/`exec` 的 `secrets.providers`）位于 [Secrets Management](/zh-CN/gateway/secrets)。
支持的凭证路径列在 [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface) 中。
</Accordion>

完整优先级和来源见 [Environment](/zh-CN/help/environment)。

## 完整参考

完整的逐字段参考见 **[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关：[Configuration Examples](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [Configuration examples](/zh-CN/gateway/configuration-examples)
- [Gateway runbook](/zh-CN/gateway)
