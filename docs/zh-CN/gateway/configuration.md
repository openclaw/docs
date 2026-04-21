---
read_when:
    - 首次设置 OpenClaw
    - 查找常见配置模式
    - 前往特定配置部分
summary: 配置概览：常见任务、快速设置以及完整参考的链接
title: 配置
x-i18n:
    generated_at: "2026-04-21T21:40:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# 配置

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 支持注释和尾随逗号">**JSON5**</Tooltip> 配置。

如果该文件缺失，OpenClaw 会使用安全的默认值。添加配置的常见原因包括：

- 连接渠道并控制谁可以给机器人发消息
- 设置模型、工具、沙箱隔离或自动化（cron、hooks）
- 调整会话、媒体、网络或 UI

查看[完整参考](/zh-CN/gateway/configuration-reference)以了解所有可用字段。

<Tip>
**刚接触配置？** 从 `openclaw onboard` 开始进行交互式设置，或者查看[配置示例](/zh-CN/gateway/configuration-examples)指南，获取可直接复制粘贴的完整配置。
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
  <Tab title="控制 UI">
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789) 并使用 **配置** 选项卡。
    控制 UI 会根据实时配置 schema 渲染表单，包括字段
    `title` / `description` 文档元数据，以及在可用时的插件和渠道 schema，
    同时提供 **Raw JSON** 编辑器作为兜底方式。对于逐层深入的
    UI 和其他工具，Gateway 网关还会公开 `config.schema.lookup`，
    用于获取单个路径范围的 schema 节点及其直接子项摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关会监视该文件并自动应用更改（参见[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格校验

<Warning>
OpenClaw 只接受与 schema 完全匹配的配置。未知键名、格式错误的类型或无效值都会导致 Gateway 网关**拒绝启动**。唯一的根级例外是 `$schema`（字符串），这样编辑器就可以附加 JSON Schema 元数据。
</Warning>

Schema 工具说明：

- `openclaw config schema` 会打印与控制 UI
  和配置校验使用的同一组 JSON Schema。
- 将该 schema 输出视为
  `openclaw.json` 的权威机器可读契约；本概览和配置参考只是对其进行总结。
- 字段 `title` 和 `description` 的值会被带入 schema 输出，
  供编辑器和表单工具使用。
- 嵌套对象、通配符（`*`）和数组项（`[]`）条目会在存在匹配字段文档时
  继承相同的文档元数据。
- `anyOf` / `oneOf` / `allOf` 组合分支同样会继承相同的文档
  元数据，因此联合 / 交叉变体会保留相同的字段帮助信息。
- `config.schema.lookup` 会返回一个标准化配置路径，以及一个浅层
  schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界
  和类似校验字段）、匹配的 UI 提示元数据，以及其直接子项的
  摘要，供逐层深入工具使用。
- 当 Gateway 网关能够加载当前 manifest 注册表时，会合并运行时插件 / 渠道 schema。
- `pnpm config:docs:check` 会检测面向文档的配置基线产物
  与当前 schema 表面之间的漂移。

当校验失败时：

- Gateway 网关不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看确切问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

Gateway 网关还会在成功启动后保留一份受信任的最近一次有效副本。如果
`openclaw.json` 之后在 OpenClaw 外部被修改且不再通过校验，启动
和热重载会将损坏的文件保留为带时间戳的 `.clobbered.*` 快照，
恢复最近一次有效副本，并记录一条醒目的警告，说明恢复原因。
下一次主智能体回合也会收到一条系统事件警告，告诉它
配置已被恢复，且不得盲目重写。最近一次有效副本的提升
会在通过校验的启动后，以及在接受的热重载后更新，包括
由 OpenClaw 自身发起且其持久化文件哈希仍与已接受写入匹配的配置写入。
当候选内容包含已脱敏的密钥占位符
例如 `***` 或截短的 token 值时，不会进行提升。

## 常见任务

<AccordionGroup>
  <Accordion title="设置一个渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置部分。设置步骤请参见对应的专用渠道页面：

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

    - `agents.defaults.models` 定义模型目录，并作为 `/model` 的允许列表。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制转录 / 工具图像缩放下采样（默认值为 `1200`）；对于大量截图的运行，较低的值通常会减少视觉 token 使用量。
    - 请参阅[模型 CLI](/zh-CN/concepts/models) 了解如何在聊天中切换模型，并参阅[模型故障切换](/zh-CN/concepts/model-failover) 了解凭证轮换和回退行为。
    - 对于自定义 / 自托管提供商，请参阅参考中的[自定义提供商](/zh-CN/gateway/configuration-reference#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以给机器人发消息">
    私信访问权限通过每个渠道的 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者会收到一个一次性配对码以获得批准
    - `"allowlist"`：仅允许 `allowFrom` 中的发送者（或已配对允许存储中的发送者）
    - `"open"`：允许所有入站私信（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy` + `groupAllowFrom` 或渠道专用允许列表。

    请参阅[完整参考](/zh-CN/gateway/configuration-reference#dm-and-group-access)了解每个渠道的详细信息。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群消息默认设置为**需要提及**。可为每个智能体配置模式：

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
    - 请参阅[完整参考](/zh-CN/gateway/configuration-reference#group-chat-mention-gating)了解每个渠道的覆盖项和自聊模式。

  </Accordion>

  <Accordion title="按智能体限制 Skills">
    使用 `agents.defaults.skills` 作为共享基线，然后通过 `agents.list[].skills` 覆盖特定
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

    - 默认情况下，省略 `agents.defaults.skills` 表示 Skills 不受限制。
    - 省略 `agents.list[].skills` 表示继承默认值。
    - 设置 `agents.list[].skills: []` 表示不启用任何 Skills。
    - 请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 以及
      [配置参考](/zh-CN/gateway/configuration-reference#agents-defaults-skills)。

  </Accordion>

  <Accordion title="调整 Gateway 网关渠道健康监控">
    控制 Gateway 网关对看起来已陈旧的渠道执行重启的积极程度：

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

    - 设置 `gateway.channelHealthCheckMinutes: 0` 以全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可以在不禁用全局监控器的情况下，仅为某个渠道或账户禁用自动重启。
    - 请参阅[健康检查](/zh-CN/gateway/health)了解运维调试信息，并参阅[完整参考](/zh-CN/gateway/configuration-reference#gateway)了解所有字段。

  </Accordion>

  <Accordion title="配置会话和重置">
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

    - `dmScope`：`main`（共享）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：线程绑定会话路由的全局默认值（Discord 支持 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 请参阅[会话管理](/zh-CN/concepts/session)了解作用域、身份关联和发送策略。
    - 请参阅[完整参考](/zh-CN/gateway/configuration-reference#session)了解所有字段。

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

    请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)获取完整指南，并参阅[完整参考](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)了解所有选项。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用基于 relay 的推送">
    基于 relay 的推送在 `openclaw.json` 中配置。

    在 Gateway 网关配置中设置以下内容：

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

    等效的 CLI：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    作用如下：

    - 允许 Gateway 网关通过外部 relay 发送 `push.test`、唤醒提示和重连唤醒。
    - 使用由已配对 iOS 应用转发的、按注册范围生效的发送授权。Gateway 网关不需要部署范围的 relay token。
    - 将每个基于 relay 的注册绑定到 iOS 应用所配对的 Gateway 网关身份，因此其他 Gateway 网关无法复用已存储的注册信息。
    - 让本地 / 手动构建的 iOS 版本继续使用直接 APNs。基于 relay 的发送仅适用于通过 relay 注册的官方分发版本。
    - 必须与官方 / TestFlight iOS 构建中内置的 relay 基础 URL 匹配，这样注册和发送流量才能到达同一个 relay 部署。

    端到端流程：

    1. 安装一个使用相同 relay 基础 URL 编译的官方 / TestFlight iOS 构建。
    2. 在 Gateway 网关上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 Gateway 网关配对，并让节点和操作员会话都连接上。
    4. iOS 应用获取 Gateway 网关身份，使用 App Attest 加上应用回执向 relay 注册，然后将基于 relay 的 `push.apns.register` 负载发布到已配对的 Gateway 网关。
    5. Gateway 网关存储 relay 句柄和发送授权，然后将它们用于 `push.test`、唤醒提示和重连唤醒。

    运行说明：

    - 如果你将 iOS 应用切换到另一个 Gateway 网关，请重新连接应用，以便它发布一个绑定到该 Gateway 网关的新 relay 注册。
    - 如果你发布了一个指向不同 relay 部署的新 iOS 构建，应用会刷新其缓存的 relay 注册，而不是复用旧的 relay 来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖项使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍然只是一个仅限 loopback 的开发逃生舱；不要在配置中持久保存 HTTP relay URL。

    请参阅[iOS 应用](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)了解端到端流程，并参阅[认证与信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)了解 relay 安全模型。

  </Accordion>

  <Accordion title="设置 heartbeat（定期报到）">
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

    - `every`：时长字符串（`30m`、`2h`）。设为 `0m` 可禁用。
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

    - `sessionRetention`：从 `sessions.json` 中清理已完成的隔离运行会话（默认 `24h`；设为 `false` 可禁用）。
    - `runLog`：按大小和保留行数清理 `cron/runs/<jobId>.jsonl`。
    - 功能概览和 CLI 示例请参阅[cron 作业](/zh-CN/automation/cron-jobs)。

  </Accordion>

  <Accordion title="设置 webhook（hooks）">
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
    - 将所有 hook / webhook 负载内容都视为不受信任的输入。
    - 使用专用的 `hooks.token`；不要复用共享的 Gateway 网关 token。
    - Hook 认证仅支持请求头（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串 token 会被拒绝。
    - `hooks.path` 不能为 `/`；请将 webhook 入口保持在专用子路径上，例如 `/hooks`。
    - 保持不安全内容绕过标志为禁用状态（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`），除非你是在进行严格限定范围的调试。
    - 如果你启用了 `hooks.allowRequestSessionKey`，也要设置 `hooks.allowedSessionKeyPrefixes`，以限制调用方可选的会话键。
    - 对于由 hook 驱动的智能体，优先使用强大的现代模型层级和严格的工具策略（例如尽可能仅允许消息发送并启用沙箱隔离）。

    请参阅[完整参考](/zh-CN/gateway/configuration-reference#hooks)了解所有映射选项和 Gmail 集成。

  </Accordion>

  <Accordion title="配置多智能体路由">
    运行多个隔离的智能体，并分别使用独立的工作区和会话：

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

    绑定规则和每个智能体的访问配置请参阅[多智能体](/zh-CN/concepts/multi-agent)和[完整参考](/zh-CN/gateway/configuration-reference#multi-agent-routing)。

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

    - **单个文件**：替换其所在的对象
    - **文件数组**：按顺序深度合并（后者优先）
    - **同级键**：在 include 之后合并（覆盖 include 的值）
    - **嵌套 include**：支持，最多 10 层深度
    - **相对路径**：相对于包含它的文件解析
    - **错误处理**：对缺失文件、解析错误和循环 include 提供清晰错误信息

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关会监视 `~/.openclaw/openclaw.json` 并自动应用更改 —— 对于大多数设置，无需手动重启。

直接编辑文件在通过校验前会被视为不受信任。监视器会等待
编辑器临时写入 / 重命名抖动稳定下来，读取最终文件，并通过恢复
最近一次有效配置来拒绝无效的外部编辑。由 OpenClaw 发起的
配置写入在写入前也会经过同样的 schema 检查；具有破坏性的覆盖
例如删除 `gateway.mode` 或将文件缩小到原来一半以下，都会被拒绝，
并另存为 `.rejected.*` 以供检查。

如果你在日志中看到 `Config auto-restored from last-known-good` 或
`config reload restored last-known-good config`，请检查位于
`openclaw.json` 旁边的对应 `.clobbered.*` 文件，修复被拒绝的负载，然后运行
`openclaw config validate`。恢复检查清单请参阅[Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

### 重载模式

| 模式 | 行为 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全更改。对于关键更改会自动重启。 |
| **`hot`** | 仅热应用安全更改。当需要重启时记录警告 —— 由你处理。 |
| **`restart`** | 对任何配置更改都重启 Gateway 网关，不论是否安全。 |
| **`off`** | 禁用文件监视。更改会在下一次手动重启时生效。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可以热应用，哪些需要重启

大多数字段都可以在不停机的情况下热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别 | 字段 | 需要重启？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 渠道 | `channels.*`、`web`（WhatsApp）—— 所有内置和插件渠道 | 否 |
| 智能体和模型 | `agent`、`agents`、`models`、`routing` | 否 |
| 自动化 | `hooks`、`cron`、`agent.heartbeat` | 否 |
| 会话和消息 | `session`、`messages` | 否 |
| 工具和媒体 | `tools`、`browser`、`skills`、`audio`、`talk` | 否 |
| UI 和杂项 | `ui`、`logging`、`identity`、`bindings` | 否 |
| Gateway 网关服务器 | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP） | **是** |
| 基础设施 | `discovery`、`canvasHost`、`plugins` | **是** |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外 —— 更改它们**不会**触发重启。
</Note>

## 配置 RPC（程序化更新）

<Note>
控制平面写入 RPC（`config.apply`、`config.patch`、`update.run`）对每个 `deviceId+clientIp` 会限流为**每 60 秒 3 次请求**。被限流时，RPC 会返回带有 `retryAfterMs` 的 `UNAVAILABLE`。
</Note>

安全 / 默认流程：

- `config.schema.lookup`：检查单个路径范围的配置子树，包含一个浅层
  schema 节点、匹配的提示元数据以及直接子项摘要
- `config.get`：获取当前快照 + hash
- `config.patch`：推荐的部分更新路径
- `config.apply`：仅用于完整配置替换
- `update.run`：显式自更新 + 重启

当你不是替换整个配置时，优先使用 `config.schema.lookup`
然后使用 `config.patch`。

<AccordionGroup>
  <Accordion title="config.apply（完整替换）">
    在一步内校验并写入完整配置，然后重启 Gateway 网关。

    <Warning>
    `config.apply` 会替换**整个配置**。部分更新请使用 `config.patch`，单个键请使用 `openclaw config set`。
    </Warning>

    参数：

    - `raw`（字符串）— 整个配置的 JSON5 负载
    - `baseHash`（可选）— 来自 `config.get` 的配置 hash（配置已存在时必需）
    - `sessionKey`（可选）— 用于重启后唤醒 ping 的会话键
    - `note`（可选）— 用于重启哨兵的备注
    - `restartDelayMs`（可选）— 重启前的延迟（默认 2000）

    当已有重启处于待处理 / 进行中状态时，重启请求会被合并，并且两次重启周期之间会应用 30 秒冷却时间。

    ```bash
    openclaw gateway call config.get --params '{}'  # 获取 payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch（部分更新）">
    将部分更新合并到现有配置中（JSON merge patch 语义）：

    - 对象递归合并
    - `null` 删除键
    - 数组整体替换

    参数：

    - `raw`（字符串）— 仅包含要更改键名的 JSON5
    - `baseHash`（必需）— 来自 `config.get` 的配置 hash
    - `sessionKey`、`note`、`restartDelayMs` — 与 `config.apply` 相同

    重启行为与 `config.apply` 一致：会合并待处理的重启请求，并在两次重启周期之间应用 30 秒冷却时间。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

OpenClaw 会从父进程读取环境变量，另外还会读取：

- 当前工作目录中的 `.env`（如果存在）
- `~/.openclaw/.env`（全局兜底）

这两个文件都不会覆盖已存在的环境变量。你也可以在配置中内联设置环境变量：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 环境导入（可选）">
  如果已启用且预期键名未设置，OpenClaw 会运行你的登录 shell，并且只导入缺失的键名：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

环境变量等效项：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="在配置值中替换环境变量">
  你可以在任何配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 只匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失 / 为空的变量会在加载时抛出错误
- 使用 `$${VAR}` 可输出字面值
- 在 `$include` 文件中同样有效
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

SecretRef 详情（包括适用于 `env` / `file` / `exec` 的 `secrets.providers`）见[密钥管理](/zh-CN/gateway/secrets)。
支持的凭证路径列在 [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface) 中。
</Accordion>

完整的优先级和来源请参阅[环境](/zh-CN/help/environment)。

## 完整参考

如需完整的逐字段参考，请参阅 **[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关内容：[配置示例](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_
