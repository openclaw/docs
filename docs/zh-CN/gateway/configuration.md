---
read_when:
    - 首次设置 OpenClaw
    - 正在查找常见配置模式
    - 导航到特定配置部分
summary: 配置概览：常见任务、快速设置，以及完整参考链接
title: 配置
x-i18n:
    generated_at: "2026-04-28T11:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 432209fd9b8570a75639bc21b1611899d30a78217e55bb2a45bf3555988e3f40
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 配置。
活动配置路径必须是常规文件。对于 OpenClaw 自有写入，不支持符号链接形式的 `openclaw.json`
布局；原子写入可能会替换该路径，而不是保留符号链接。如果你把配置保存在
默认状态目录之外，请将 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

如果文件缺失，OpenClaw 会使用安全默认值。添加配置的常见原因：

- 连接渠道并控制谁可以给机器人发消息
- 设置模型、工具、沙箱隔离或自动化（cron、钩子）
- 调整会话、媒体、网络或 UI

查看[完整参考](/zh-CN/gateway/configuration-reference)，了解每个可用字段。

智能体和自动化在编辑配置前，应使用 `config.schema.lookup` 查看精确的字段级
文档。本页提供面向任务的指导，[配置参考](/zh-CN/gateway/configuration-reference) 提供更完整的
字段地图和默认值。

<Tip>
**刚开始配置？** 使用 `openclaw onboard` 进行交互式设置，或查看 [配置示例](/zh-CN/gateway/configuration-examples)指南以获取完整的可复制粘贴配置。
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
  <Tab title="交互式向导">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI（单行命令）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="控制 UI">
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789)，使用 **配置** 标签页。
    控制 UI 会根据实时配置 schema 渲染表单，其中包含字段
    `title` / `description` 文档元数据，并在可用时包含插件和渠道 schema，
    同时提供 **Raw JSON** 编辑器作为兜底入口。对于下钻
    UI 和其他工具，Gateway 网关还会暴露 `config.schema.lookup`，用于
    获取一个路径范围内的 schema 节点及其直接子项摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关会监视该文件并自动应用更改（参见[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格校验

<Warning>
OpenClaw 只接受完全匹配 schema 的配置。未知键名、格式错误的类型或无效值会导致 Gateway 网关**拒绝启动**。唯一的根级例外是 `$schema`（字符串），以便编辑器附加 JSON Schema 元数据。
</Warning>

`openclaw config schema` 会打印控制 UI 和校验使用的规范 JSON Schema。
`config.schema.lookup` 会获取单个路径范围内的节点以及用于下钻工具的
子项摘要。字段 `title`/`description` 文档元数据会贯穿嵌套对象、通配符（`*`）、
数组项（`[]`）以及 `anyOf`/
`oneOf`/`allOf` 分支。加载 manifest registry 后，运行时插件和渠道 schema 会合并进来。

校验失败时：

- Gateway 网关不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看精确问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

Gateway 网关会在每次成功启动后保留一份可信的最后已知良好副本。
如果 `openclaw.json` 后续校验失败（或丢失 `gateway.mode`、体积
急剧缩小，或前面被误加一行日志），OpenClaw 会将损坏文件保留为
`.clobbered.*`，恢复最后已知良好副本，并记录恢复
原因。下一个智能体轮次也会收到系统事件警告，避免主
智能体盲目重写已恢复的配置。当候选内容包含已打码的密钥占位符（例如 `***`）时，
会跳过提升为最后已知良好副本。当所有校验问题都限定在 `plugins.entries.<id>...` 范围内时，
OpenClaw 不会执行整文件恢复。它会保持当前配置处于活动状态，并
暴露插件本地失败，以免插件 schema 或主机版本不匹配
回滚无关的用户设置。

## 常见任务

<AccordionGroup>
  <Accordion title="设置渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置段。设置步骤请查看对应的渠道页面：

    - [WhatsApp](/zh-CN/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/zh-CN/channels/telegram) — `channels.telegram`
    - [Discord](/zh-CN/channels/discord) — `channels.discord`
    - [Feishu](/zh-CN/channels/feishu) — `channels.feishu`
    - [Google Chat](/zh-CN/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/zh-CN/channels/msteams) — `channels.msteams`
    - [Slack](/zh-CN/channels/slack) — `channels.slack`
    - [Signal](/zh-CN/channels/signal) — `channels.signal`
    - [iMessage](/zh-CN/channels/imessage) — `channels.imessage`
    - [Mattermost](/zh-CN/channels/mattermost) — `channels.mattermost`

    所有渠道共享相同的私信策略模式：

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

  <Accordion title="选择并配置模型">
    设置主模型和可选回退：

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

    - `agents.defaults.models` 定义模型目录，并作为 `/model` 的允许列表。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加允许列表条目，而不移除现有模型。如果普通替换会移除条目，则会被拒绝，除非你传入 `--replace`。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制 transcript/工具图片降采样（默认 `1200`）；较低值通常会减少截图密集运行中的视觉 token 用量。
    - 参见 [Models CLI](/zh-CN/concepts/models) 了解如何在聊天中切换模型，并参见[模型故障转移](/zh-CN/concepts/model-failover)了解身份验证轮换和回退行为。
    - 对于自定义/自托管提供商，请参见参考中的[自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以给机器人发消息">
    私信访问按渠道通过 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者会获得一次性配对码以供批准
    - `"allowlist"`：仅允许 `allowFrom` 中的发送者（或已配对允许存储中的发送者）
    - `"open"`：允许所有入站私信（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，使用 `groupPolicy` + `groupAllowFrom` 或渠道专用允许列表。

    查看[完整参考](/zh-CN/gateway/config-channels#dm-and-group-access)，了解每个渠道的详细信息。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认**需要提及**。按智能体配置触发模式，并让可见房间回复保持在默认消息工具路径上，除非你明确需要旧版自动最终回复：

    ```json5
    {
      messages: {
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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
    - **可见回复**：`message_tool` 会保持普通最终回复为私密；智能体必须调用 `message(action=send)` 才能在群组/渠道中可见发帖。
    - 查看[完整参考](/zh-CN/gateway/config-channels#group-chat-mention-gating)，了解可见回复模式、每渠道覆盖和自聊模式。

  </Accordion>

  <Accordion title="按智能体限制 Skills">
    使用 `agents.defaults.skills` 作为共享基线，然后用 `agents.list[].skills` 覆盖特定
    智能体：

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
    - 设置 `agents.list[].skills: []` 表示没有 Skills。
    - 参见 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和
      [配置参考](/zh-CN/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="调整 Gateway 网关渠道健康监控">
    控制 Gateway 网关重启疑似停滞渠道的积极程度：

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

    - 设置 `gateway.channelHealthCheckMinutes: 0` 可全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled` 可为单个渠道或账号禁用自动重启，而不禁用全局监控。
    - 参见[健康检查](/zh-CN/gateway/health)进行运维调试，并参见[完整参考](/zh-CN/gateway/configuration-reference#gateway)了解所有字段。

  </Accordion>

  <Accordion title="配置会话和重置">
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
    - 参见[会话管理](/zh-CN/concepts/session)，了解范围、身份链接和发送策略。
    - 参见[完整参考](/zh-CN/gateway/config-agents#session)，了解所有字段。

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

    先构建镜像：`scripts/sandbox-setup.sh`

    请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)获取完整指南，并参阅[完整参考](/zh-CN/gateway/config-agents#agentsdefaultssandbox)了解所有选项。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用 relay 后端推送">
    relay 后端推送在 `openclaw.json` 中配置。

    在 Gateway 网关配置中设置：

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

    这会执行以下操作：

    - 让 Gateway 网关通过外部 relay 发送 `push.test`、唤醒提醒和重连唤醒。
    - 使用由已配对 iOS 应用转发的注册作用域发送授权。Gateway 网关不需要部署范围的 relay 令牌。
    - 将每个 relay 后端注册绑定到 iOS 应用配对的 Gateway 网关身份，因此另一个 Gateway 网关无法复用已存储的注册。
    - 让本地/手动 iOS 构建继续使用直接 APNs。relay 后端发送仅适用于通过 relay 注册的官方分发构建。
    - 必须匹配内置到官方/TestFlight iOS 构建中的 relay 基础 URL，确保注册和发送流量到达同一个 relay 部署。

    端到端流程：

    1. 安装使用相同 relay 基础 URL 编译的官方/TestFlight iOS 构建。
    2. 在 Gateway 网关上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 Gateway 网关配对，并让节点和 operator 会话都连接。
    4. iOS 应用获取 Gateway 网关身份，使用 App Attest 加应用收据向 relay 注册，然后将 relay 后端 `push.apns.register` 载荷发布到已配对的 Gateway 网关。
    5. Gateway 网关存储 relay handle 和发送授权，然后将它们用于 `push.test`、唤醒提醒和重连唤醒。

    运维说明：

    - 如果你将 iOS 应用切换到另一个 Gateway 网关，请重新连接应用，以便它可以发布绑定到该 Gateway 网关的新 relay 注册。
    - 如果你发布指向不同 relay 部署的新 iOS 构建，应用会刷新其缓存的 relay 注册，而不是复用旧的 relay 来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖项使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是仅限 loopback 的开发逃生口；不要在配置中持久化 HTTP relay URL。

    请参阅 [iOS 应用](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)了解端到端流程，并参阅[身份验证和信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)了解 relay 安全模型。

  </Accordion>

  <Accordion title="设置 heartbeat（定期签到）">
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
    - `directPolicy`：对于私信风格的 heartbeat 目标，使用 `allow`（默认）或 `block`
    - 请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)获取完整指南。

  </Accordion>

  <Accordion title="配置 cron 任务">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`：从 `sessions.json` 中清理已完成的隔离运行会话（默认 `24h`；设置为 `false` 可禁用）。
    - `runLog`：按大小和保留行数清理 `cron/runs/<jobId>.jsonl`。
    - 请参阅 [Cron 任务](/zh-CN/automation/cron-jobs)了解功能概览和 CLI 示例。

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
    - 将所有 hook/webhook 载荷内容都视为不可信输入。
    - 使用专用的 `hooks.token`；不要复用共享的 Gateway 网关令牌。
    - Hook 认证仅通过 header（`Authorization: Bearer ...` 或 `x-openclaw-token`）；query-string 令牌会被拒绝。
    - `hooks.path` 不能是 `/`；请将 webhook 入口放在专用子路径上，例如 `/hooks`。
    - 除非进行严格限定范围的调试，否则保持不安全内容绕过标志禁用（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果启用 `hooks.allowRequestSessionKey`，还要设置 `hooks.allowedSessionKeyPrefixes`，以约束调用方选择的会话键。
    - 对于 hook 驱动的智能体，优先使用强大的现代模型层级和严格的工具策略（例如仅消息传递，并在可行时加上沙箱隔离）。

    请参阅[完整参考](/zh-CN/gateway/configuration-reference#hooks)了解所有映射选项和 Gmail 集成。

  </Accordion>

  <Accordion title="配置多智能体路由">
    运行多个隔离智能体，每个智能体拥有独立的工作区和会话：

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

    请参阅 [Multi-Agent](/zh-CN/concepts/multi-agent) 和[完整参考](/zh-CN/gateway/config-agents#multi-agent-routing)，了解绑定规则和每个智能体的访问配置档案。

  </Accordion>

  <Accordion title="将配置拆分为多个文件（$include）">
    使用 `$include` 组织大型配置：

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

    - **单个文件**：替换所在对象
    - **文件数组**：按顺序深度合并（后者优先）
    - **同级键**：在 include 之后合并（覆盖已 include 的值）
    - **嵌套 includes**：最多支持 10 层
    - **相对路径**：相对于执行 include 的文件解析
    - **OpenClaw 拥有的写入**：当一次写入只更改一个顶层 section，
      且该 section 由单文件 include 支持（例如 `plugins: { $include: "./plugins.json5" }`）时，
      OpenClaw 会更新该 include 文件，并保持 `openclaw.json` 不变
    - **不支持的写穿透**：root includes、include 数组以及带同级覆盖的 includes
      对 OpenClaw 拥有的写入会 fail closed，而不是
      将配置扁平化
    - **错误处理**：针对缺失文件、解析错误和循环 includes 提供清晰错误

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关会监视 `~/.openclaw/openclaw.json` 并自动应用更改，大多数设置无需手动重启。

直接文件编辑在通过验证前会被视为不可信。监视器会等待
编辑器临时写入/重命名抖动稳定，读取最终文件，并通过恢复
last-known-good 配置来拒绝无效的外部编辑。OpenClaw 拥有的
配置写入在写入前使用相同的 schema gate；破坏性覆盖
（例如删除 `gateway.mode` 或将文件缩小超过一半）会被拒绝，
并保存为 `.rejected.*` 以供检查。

插件本地验证失败是例外：如果所有问题都位于
`plugins.entries.<id>...` 下，重载会保留当前配置并报告插件
问题，而不是恢复 `.last-good`。

如果你在日志中看到 `Config auto-restored from last-known-good` 或
`config reload restored last-known-good config`，请检查 `openclaw.json`
旁边匹配的 `.clobbered.*` 文件，修复被拒绝的载荷，然后运行
`openclaw config validate`。请参阅 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)
获取恢复检查清单。

### 重载模式

| 模式                   | 行为                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全更改。对关键更改自动重启。           |
| **`hot`**              | 仅热应用安全更改。需要重启时记录警告，由你处理。 |
| **`restart`**          | 对任何配置更改都重启 Gateway 网关，无论是否安全。                                 |
| **`off`**              | 禁用文件监视。更改会在下一次手动重启时生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可热应用，哪些需要重启

大多数字段都可以无停机热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别            | 字段                                                            | 需要重启？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 渠道            | `channels.*`、`web`（WhatsApp）— 所有内置渠道和插件渠道 | 否              |
| 智能体和模型      | `agent`、`agents`、`models`、`routing`                            | 否              |
| 自动化          | `hooks`、`cron`、`agent.heartbeat`                                | 否              |
| 会话和消息 | `session`、`messages`                                             | 否              |
| 工具和媒体       | `tools`、`browser`、`skills`、`mcp`、`audio`、`talk`              | 否              |
| UI 和其他           | `ui`、`logging`、`identity`、`bindings`                           | 否              |
| Gateway 网关服务器      | `gateway.*`（端口、绑定、认证、tailscale、TLS、HTTP）              | **是**         |
| 基础设施      | `discovery`、`canvasHost`、`plugins`                              | **是**         |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外 — 更改它们**不会**触发重启。
</Note>

### 重载规划

当你编辑通过 `$include` 引用的源文件时，OpenClaw 会从源文件编写的布局
规划重载，而不是从扁平化的内存视图规划。这会让热重载决策
（热应用还是重启）保持可预测，即使单个顶层 section 位于自己的
include 文件中，例如 `plugins: { $include: "./plugins.json5" }`。
如果源布局存在歧义，重载规划会 fail closed。

## 配置 RPC（程序化更新）

对于通过 Gateway 网关 API 写入配置的工具，优先使用此流程：

- `config.schema.lookup` 检查一个子树（浅层 schema 节点 + 子项
  摘要）
- `config.get` 获取当前快照和 `hash`
- `config.patch` 用于部分更新（JSON merge patch：对象合并，`null`
  删除，数组替换）
- `config.apply` 仅在你打算替换整个配置时使用
- `update.run` 用于显式自更新并重启
- `update.status` 检查最新的更新重启 sentinel，并在重启后验证正在运行的版本

智能体应将 `config.schema.lookup` 作为查看精确字段级文档和约束的第一站。当需要更完整的配置映射、默认值或指向专用子系统参考的链接时，请使用[配置参考](/zh-CN/gateway/configuration-reference)。

<Note>
控制平面写入（`config.apply`、`config.patch`、`update.run`）按 `deviceId+clientIp` 每 60 秒最多 3 个请求进行速率限制。重启请求会合并，然后在重启周期之间强制执行 30 秒冷却时间。`update.status` 是只读的，但限定为管理员范围，因为重启哨兵可能包含更新步骤摘要和命令输出尾部。
</Note>

部分补丁示例：

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、`note` 和 `restartDelayMs`。当配置已存在时，这两种方法都要求提供 `baseHash`。

## 环境变量

OpenClaw 会从父进程以及以下位置读取环境变量：

- 当前工作目录中的 `.env`（如果存在）
- `~/.openclaw/.env`（全局回退）

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

等效环境变量：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="配置值中的环境变量替换">
  在任意配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失或为空的变量会在加载时抛出错误
- 使用 `$${VAR}` 转义以输出字面值
- 在 `$include` 文件中也可用
- 内联替换：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="密钥引用（env、file、exec）">
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

SecretRef 详情（包括用于 `env`/`file`/`exec` 的 `secrets.providers`）见[密钥管理](/zh-CN/gateway/secrets)。
支持的凭证路径列在 [SecretRef 凭证范围](/zh-CN/reference/secretref-credential-surface)中。
</Accordion>

有关完整优先级和来源，请参阅[环境](/zh-CN/help/environment)。

## 完整参考

如需完整的逐字段参考，请参阅 **[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关：[配置示例](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [配置示例](/zh-CN/gateway/configuration-examples)
- [Gateway 网关运行手册](/zh-CN/gateway)
