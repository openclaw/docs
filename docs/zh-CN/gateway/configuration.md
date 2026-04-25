---
read_when:
    - 首次设置 OpenClaw
    - 查找常见配置模式
    - 导航到特定配置章节
summary: 配置概览：常见任务、快速设置，以及完整参考的链接
title: 配置
x-i18n:
    generated_at: "2026-04-25T03:24:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2749fca881115d1d1915271af2d06037cfe87d6c4caf96dc46d8bf893a0669c6
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 支持注释和尾随逗号">**JSON5**</Tooltip> 配置。
生效的配置路径必须是常规文件。对于由 OpenClaw 管理的写入操作，不支持使用符号链接的 `openclaw.json`
布局；原子写入可能会替换该路径，而不是保留符号链接。如果你将配置保存在默认状态目录之外，请将 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

如果文件缺失，OpenClaw 会使用安全默认值。添加配置的常见原因包括：

- 连接渠道并控制谁可以向机器人发送消息
- 设置模型、工具、沙箱隔离或自动化（cron、hooks）
- 调整会话、媒体、网络或 UI

请参阅[完整参考](/zh-CN/gateway/configuration-reference)了解所有可用字段。

<Tip>
**刚接触配置？** 可先使用 `openclaw onboard` 进行交互式设置，或查看[配置示例](/zh-CN/gateway/configuration-examples)指南，获取可直接复制粘贴的完整配置。
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
    openclaw onboard       # 完整的新手引导流程
    openclaw configure     # 配置向导
    ```
  </Tab>
  <Tab title="CLI（单行命令）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789) 并使用 **配置** 标签页。
    Control UI 会根据实时配置 schema 渲染表单，其中包含字段
    `title` / `description` 文档元数据，以及可用时的插件和渠道 schema，
    同时提供 **Raw JSON** 编辑器作为兜底方案。对于下钻式
    UI 和其他工具，Gateway 网关 还提供 `config.schema.lookup`，
    用于获取单个路径范围的 schema 节点及其直接子节点摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关 会监视该文件并自动应用更改（参见[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格校验

<Warning>
OpenClaw 仅接受完全匹配 schema 的配置。未知键名、格式错误的类型或无效值都会导致 Gateway 网关 **拒绝启动**。唯一的根级例外是 `$schema`（字符串），这样编辑器就可以附加 JSON Schema 元数据。
</Warning>

`openclaw config schema` 会打印供 Control UI
和校验使用的规范 JSON Schema。`config.schema.lookup` 会获取单个路径范围节点及其
子节点摘要，用于下钻式工具。字段 `title`/`description` 的文档元数据
会贯穿嵌套对象、通配符（`*`）、数组项（`[]`）以及 `anyOf`/
`oneOf`/`allOf` 分支。运行时插件和渠道 schema 会在
manifest 注册表加载后合并进来。

当校验失败时：

- Gateway 网关 不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看具体问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

Gateway 网关 在每次成功启动后都会保留一份可信的最近一次正常配置副本。
如果之后 `openclaw.json` 校验失败（或丢失 `gateway.mode`、明显缩小、
或前面意外插入了一行日志），OpenClaw 会将损坏的文件保留为
`.clobbered.*`，恢复最近一次正常配置副本，并记录恢复原因。
下一次智能体回合还会收到系统事件警告，这样主智能体就不会盲目重写已恢复的配置。
如果候选配置包含诸如 `***` 之类的已脱敏密钥占位符，则不会将其提升为最近一次正常配置。
当所有校验问题都限定在 `plugins.entries.<id>...` 范围内时，OpenClaw
不会执行整文件恢复。它会保持当前配置继续生效，并显示插件局部失败，
这样插件 schema 或宿主版本不匹配就不会回滚无关的用户设置。

## 常见任务

<AccordionGroup>
  <Accordion title="设置一个渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置章节。设置步骤请参阅对应渠道页面：

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

    所有渠道都共享相同的私信策略模式：

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
    设置主模型以及可选的回退模型：

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

    - `agents.defaults.models` 定义模型目录，并充当 `/model` 的 allowlist。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加 allowlist 条目，而不会移除现有模型。若普通替换会移除条目，则会被拒绝，除非你传入 `--replace`。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制转录/工具图像的缩放下限（默认 `1200`）；较低的值通常会在大量截图的运行中减少视觉 token 使用量。
    - 请参阅[Models CLI](/zh-CN/concepts/models)了解如何在聊天中切换模型，并参阅[模型故障切换](/zh-CN/concepts/model-failover)了解凭证轮换和回退行为。
    - 对于自定义/自托管提供商，请参阅参考中的[自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以向机器人发送消息">
    私信访问权限通过每个渠道的 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者会收到一个一次性配对码以供批准
    - `"allowlist"`：仅允许 `allowFrom` 中的发送者（或已配对的允许存储）
    - `"open"`：允许所有传入私信（要求 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy` + `groupAllowFrom` 或渠道特定的 allowlist。

    请参阅[完整参考](/zh-CN/gateway/config-channels#dm-and-group-access)了解各渠道的详细信息。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认**要求提及**。可按智能体配置模式：

    ```json5
    {
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
    - 请参阅[完整参考](/zh-CN/gateway/config-channels#group-chat-mention-gating)了解各渠道覆盖项和自聊模式。

  </Accordion>

  <Accordion title="按智能体限制 Skills">
    对共享基线使用 `agents.defaults.skills`，然后通过 `agents.list[].skills` 覆盖特定
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

    - 省略 `agents.defaults.skills` 则默认 Skills 不受限制。
    - 省略 `agents.list[].skills` 则继承默认值。
    - 设置 `agents.list[].skills: []` 表示不启用任何 Skills。
    - 请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)，以及
      [配置参考](/zh-CN/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="调整网关渠道健康监控">
    控制网关对看起来已停滞渠道的重启激进程度：

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
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可只为某一个渠道或账户禁用自动重启，而无需关闭全局监控。
    - 请参阅[健康检查](/zh-CN/gateway/health)了解运维调试，并参阅[完整参考](/zh-CN/gateway/configuration-reference#gateway)了解所有字段。

  </Accordion>

  <Accordion title="配置会话与重置">
    会话控制对话连续性和隔离性：

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

    - `dmScope`: `main`（共享） | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：线程绑定会话路由的全局默认值（Discord 支持 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 请参阅[会话管理](/zh-CN/concepts/session)了解作用域、身份关联和发送策略。
    - 请参阅[完整参考](/zh-CN/gateway/config-agents#session)了解所有字段。

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

    请先构建镜像：`scripts/sandbox-setup.sh`

    请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)了解完整指南，并参阅[完整参考](/zh-CN/gateway/config-agents#agentsdefaultssandbox)了解所有选项。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用基于 relay 的推送">
    基于 relay 的推送在 `openclaw.json` 中配置。

    在 Gateway 网关 配置中设置以下内容：

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 可选。默认值：10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    对应的 CLI 写法：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    其作用如下：

    - 让网关可以通过外部 relay 发送 `push.test`、唤醒提示以及重连唤醒。
    - 使用由已配对 iOS 应用转发的、按注册范围限定的发送授权。Gateway 网关 不需要部署范围的 relay token。
    - 将每个基于 relay 的注册绑定到 iOS 应用所配对的 Gateway 网关 身份，因此其他网关无法复用已存储的注册。
    - 本地/手动构建的 iOS 版本仍然直接使用 APNs。基于 relay 的发送仅适用于通过 relay 注册的官方分发版本。
    - 必须与官方/TestFlight iOS 构建中内置的 relay 基础 URL 一致，这样注册和发送流量才能到达同一个 relay 部署。

    端到端流程：

    1. 安装一个使用相同 relay 基础 URL 编译的官方/TestFlight iOS 构建。
    2. 在网关上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与网关配对，并让节点会话和操作员会话都连接成功。
    4. iOS 应用会获取网关身份，使用 App Attest 和应用回执向 relay 注册，然后将基于 relay 的 `push.apns.register` 负载发布到已配对的网关。
    5. Gateway 网关 会存储 relay 句柄和发送授权，然后将它们用于 `push.test`、唤醒提示和重连唤醒。

    运维说明：

    - 如果你将 iOS 应用切换到另一个网关，请重新连接该应用，以便它发布一个绑定到该网关的新 relay 注册。
    - 如果你发布了一个指向不同 relay 部署的新 iOS 构建，应用会刷新其缓存的 relay 注册，而不是复用旧的 relay 来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖项使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍然只是一个仅限 local loopback 的开发兜底方案；不要在配置中持久化 HTTP relay URL。

    请参阅[iOS App](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)了解端到端流程，并参阅[认证与信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)了解 relay 安全模型。

  </Accordion>

  <Accordion title="设置 heartbeat（定期 check-in）">
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

    - `every`：时长字符串（`30m`、`2h`）。设置为 `0m` 可禁用。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：用于私信风格 heartbeat 目标的 `allow`（默认）或 `block`
    - 完整指南请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="配置 cron 作业">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
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
    - 功能概览和 CLI 示例请参阅[cron 作业](/zh-CN/automation/cron-jobs)。

  </Accordion>

  <Accordion title="设置 webhook（hooks）">
    在 Gateway 网关 上启用 HTTP webhook 端点：

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
    - 将所有 hook/webhook 负载内容都视为不受信任输入。
    - 使用专用的 `hooks.token`；不要复用共享的 Gateway 网关 token。
    - Hook 认证仅支持请求头（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串 token 会被拒绝。
    - `hooks.path` 不能是 `/`；请将 webhook 入口保持在专用子路径下，例如 `/hooks`。
    - 保持不安全内容绕过标志关闭（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`），除非你是在进行严格限定范围的调试。
    - 如果你启用了 `hooks.allowRequestSessionKey`，也请设置 `hooks.allowedSessionKeyPrefixes` 来限制调用方可选的会话键。
    - 对于由 hook 驱动的智能体，优先选择更强的现代模型层级和严格的工具策略（例如仅消息传递，并尽可能启用沙箱隔离）。

    所有映射选项和 Gmail 集成请参阅[完整参考](/zh-CN/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="配置多智能体路由">
    运行多个彼此隔离、拥有独立工作区和会话的智能体：

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

    绑定规则和每个智能体的访问配置请参阅[多智能体](/zh-CN/concepts/multi-agent)和[完整参考](/zh-CN/gateway/config-agents#multi-agent-routing)。

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

    - **单文件**：替换所在的整个对象
    - **文件数组**：按顺序深度合并（后者优先）
    - **同级键**：在 include 之后合并（覆盖已包含的值）
    - **嵌套 include**：支持，最多 10 层
    - **相对路径**：相对于包含它的文件解析
    - **由 OpenClaw 管理的写入**：当某次写入仅更改单个顶层部分，
      且该部分由单文件 include 支持，例如 `plugins: { $include: "./plugins.json5" }`，
      OpenClaw 会更新该被包含文件，并保持 `openclaw.json` 不变
    - **不支持的透传写入**：根级 include、include 数组，以及带有
      同级覆盖的 include，在由 OpenClaw 管理的写入中会以失败关闭，而不是
      将配置拍平成单个文件
    - **错误处理**：对缺失文件、解析错误和循环 include 提供明确错误信息

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关 会监视 `~/.openclaw/openclaw.json` 并自动应用更改——大多数设置都不需要手动重启。

直接编辑文件会被视为不受信任，直到通过校验为止。监视器会等待
编辑器临时写入/重命名的抖动稳定下来，读取最终文件，并通过恢复
最近一次正常配置来拒绝无效的外部编辑。由 OpenClaw 管理的
配置写入在写入前也会通过相同的 schema 闸门；像删除 `gateway.mode`
或将文件缩小到原来一半以下这类破坏性覆盖会被拒绝，
并保存为 `.rejected.*` 以供检查。

插件局部校验失败是例外：如果所有问题都位于
`plugins.entries.<id>...` 之下，重载会保持当前配置并报告该插件问题，
而不是恢复 `.last-good`。

如果你在日志中看到 `Config auto-restored from last-known-good` 或
`config reload restored last-known-good config`，请检查 `openclaw.json`
旁边对应的 `.clobbered.*` 文件，修复被拒绝的负载，然后运行
`openclaw config validate`。恢复检查清单请参阅[Gateway 网关 故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

### 重载模式

| 模式 | 行为 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全更改。对于关键更改会自动重启。 |
| **`hot`** | 仅热应用安全更改。需要重启时会记录警告——由你来处理。 |
| **`restart`** | 任何配置更改都会重启 Gateway 网关，无论是否安全。 |
| **`off`** | 禁用文件监视。更改会在下次手动重启时生效。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可以热应用，哪些需要重启

大多数字段都可以无停机热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别 | 字段 | 需要重启？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 渠道 | `channels.*`、`web`（WhatsApp）——所有内置渠道和渠道插件 | 否 |
| 智能体与模型 | `agent`、`agents`、`models`、`routing` | 否 |
| 自动化 | `hooks`、`cron`、`agent.heartbeat` | 否 |
| 会话与消息 | `session`、`messages` | 否 |
| 工具与媒体 | `tools`、`browser`、`skills`、`audio`、`talk` | 否 |
| UI 与杂项 | `ui`、`logging`、`identity`、`bindings` | 否 |
| Gateway 网关 服务器 | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP） | **是** |
| 基础设施 | `discovery`、`canvasHost`、`plugins` | **是** |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外——更改它们**不会**触发重启。
</Note>

### 重载规划

当你编辑一个通过 `$include` 引用的源文件时，OpenClaw 会根据源文件作者编写的布局
来规划重载，而不是根据已拍平的内存视图。
这样即使某个
单独的顶层部分位于其自己的包含文件中，例如
`plugins: { $include: "./plugins.json5" }`，热重载决策（热应用还是重启）也仍然可预测。
如果源布局存在歧义，重载规划会以失败关闭。

## Config RPC（程序化更新）

对于通过 Gateway 网关 API 写入配置的工具，建议优先使用以下流程：

- 使用 `config.schema.lookup` 检查一个子树（浅层 schema 节点 + 子节点
  摘要）
- 使用 `config.get` 获取当前快照以及 `hash`
- 使用 `config.patch` 进行部分更新（JSON merge patch：对象合并，`null`
  删除，数组整体替换）
- 仅当你确实打算替换整个配置时才使用 `config.apply`
- 使用 `update.run` 执行显式自更新并重启

<Note>
控制平面写入（`config.apply`、`config.patch`、`update.run`）会按
每个 `deviceId+clientIp` 在 60 秒内限制为 3 次请求。
重启请求会被合并，然后在两次重启周期之间强制 30 秒冷却时间。
</Note>

部分 patch 示例：

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、
`note` 和 `restartDelayMs`。当配置已存在时，这两种方法都要求提供
`baseHash`。

## 环境变量

OpenClaw 会从父进程读取环境变量，另外还会读取：

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

<Accordion title="导入 shell 环境变量（可选）">
  如果启用且预期键名尚未设置，OpenClaw 会运行你的登录 shell，并且只导入缺失的键名：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

对应的环境变量：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="在配置值中替换环境变量">
  你可以在任意配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失或为空的环境变量会在加载时报错
- 使用 `$${VAR}` 转义以输出字面量
- 在 `$include` 文件中也可用
- 内联替换：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef（env、file、exec）">
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

SecretRef 详情（包括适用于 `env`/`file`/`exec` 的 `secrets.providers`）见[密钥管理](/zh-CN/gateway/secrets)。
支持的凭证路径列于 [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)。
</Accordion>

完整的优先级和来源请参阅[环境](/zh-CN/help/environment)。

## 完整参考

如需完整的逐字段参考，请参阅 **[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关内容：[配置示例](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [配置示例](/zh-CN/gateway/configuration-examples)
- [Gateway 网关 运行手册](/zh-CN/gateway)
