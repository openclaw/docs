---
read_when:
    - 首次设置 OpenClaw
    - 查找常见配置模式
    - 导航到特定配置章节
summary: 配置概览：常见任务、快速设置以及完整参考的链接
title: Configuration
x-i18n:
    generated_at: "2026-04-05T08:24:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuration

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 支持注释和尾随逗号">**JSON5**</Tooltip> 配置。

如果该文件不存在，OpenClaw 会使用安全的默认值。添加配置的常见原因包括：

- 连接渠道并控制谁可以向 bot 发送消息
- 设置模型、工具、沙箱隔离或自动化（cron、hooks）
- 调整会话、媒体、网络或 UI

有关所有可用字段，请参阅[完整参考](/gateway/configuration-reference)。

<Tip>
**刚接触配置？** 可以先从 `openclaw onboard` 开始进行交互式设置，或查看 [Configuration Examples](/gateway/configuration-examples) 指南，获取可直接复制粘贴的完整配置。
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
    openclaw onboard       # 完整新手引导流程
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
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789) 并使用 **Config** 标签页。
    Control UI 会基于实时配置 schema 渲染表单，其中包括字段
    `title` / `description` 文档元数据，以及可用时的插件和渠道 schema，
    同时提供 **Raw JSON** 编辑器作为逃生出口。对于下钻式
    UI 和其他工具，gateway 还会暴露 `config.schema.lookup`，
    用于获取一个按路径限定的 schema 节点及其直接子项摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关会监视该文件并自动应用更改（参见 [热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格校验

<Warning>
OpenClaw 只接受完全匹配 schema 的配置。未知键、类型格式错误或无效值都会导致 Gateway 网关**拒绝启动**。唯一的根级例外是 `$schema`（字符串），以便编辑器附加 JSON Schema 元数据。
</Warning>

schema 工具说明：

- `openclaw config schema` 会打印与 Control UI
  和配置校验相同的 JSON Schema 系列。
- 字段 `title` 和 `description` 值会带入 schema 输出中，供
  编辑器和表单工具使用。
- 嵌套对象、通配符（`*`）和数组项（`[]`）条目会在存在匹配字段文档时继承相同的
  文档元数据。
- `anyOf` / `oneOf` / `allOf` 组合分支也会继承相同的文档
  元数据，因此 union/intersection 变体会保留相同的字段帮助说明。
- `config.schema.lookup` 会返回一个标准化配置路径，其中包含浅层
  schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界
  以及类似的校验字段）、匹配到的 UI 提示元数据以及直接子项
  摘要，供下钻式工具使用。
- 当 gateway 能够加载当前 manifest registry 时，会合并运行时插件/渠道 schema。

当校验失败时：

- Gateway 网关不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看确切问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

## 常见任务

<AccordionGroup>
  <Accordion title="设置渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置章节。设置步骤请参阅专门的渠道页面：

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Feishu](/channels/feishu) — `channels.feishu`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/channels/msteams) — `channels.msteams`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`

    所有渠道共享相同的私信策略模式：

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // 仅用于 allowlist/open
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

    - `agents.defaults.models` 定义模型目录，并充当 `/model` 的允许列表。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制转录/工具图像的降采样（默认 `1200`）；较低的值通常可减少截图较多运行中的视觉 token 使用量。
    - 参见 [Models CLI](/concepts/models) 了解如何在聊天中切换模型，参见 [Model Failover](/concepts/model-failover) 了解认证轮换和回退行为。
    - 对于自定义/自托管提供商，请参阅参考中的 [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以向 bot 发送消息">
    私信访问按渠道通过 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者会收到一次性配对码，等待批准
    - `"allowlist"`：仅允许 `allowFrom`（或已配对允许存储）中的发送者
    - `"open"`：允许所有入站私信（要求 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy` + `groupAllowFrom` 或渠道专用允许列表。

    有关按渠道区分的详细信息，请参阅[完整参考](/gateway/configuration-reference#dm-and-group-access)。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认**需要提及**。按智能体配置模式：

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
    - 有关按渠道覆盖和自聊模式，请参阅[完整参考](/gateway/configuration-reference#group-chat-mention-gating)。

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
          { id: "writer" }, // 继承 github, weather
          { id: "docs", skills: ["docs-search"] }, // 替换默认值
          { id: "locked-down", skills: [] }, // 无 Skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills` 可使默认情况下 Skills 不受限制。
    - 省略 `agents.list[].skills` 将继承默认值。
    - 将 `agents.list[].skills: []` 设为空表示不启用 Skills。
    - 参见 [Skills](/tools/skills)、[Skills 配置](/tools/skills-config) 以及
      [Configuration Reference](/gateway/configuration-reference#agentsdefaultsskills)。

  </Accordion>

  <Accordion title="调整 gateway 渠道健康监控">
    控制 gateway 对看起来已停滞渠道的重启激进程度：

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

    - 将 `gateway.channelHealthCheckMinutes: 0` 设为 0 可全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可在不禁用全局监控的情况下，为单个渠道或账户禁用自动重启。
    - 参见 [Health Checks](/gateway/health) 获取运行调试说明，参见 [完整参考](/gateway/configuration-reference#gateway) 查看所有字段。

  </Accordion>

  <Accordion title="配置会话与重置">
    会话控制对话连续性和隔离性：

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 推荐用于多用户
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
    - 参见 [Session Management](/concepts/session) 了解作用域、身份链接和发送策略。
    - 参见[完整参考](/gateway/configuration-reference#session)查看所有字段。

  </Accordion>

  <Accordion title="启用沙箱隔离">
    在隔离的 Docker 容器中运行智能体会话：

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

    完整指南请参阅 [沙箱隔离](/gateway/sandboxing)，所有选项请参阅[完整参考](/gateway/configuration-reference#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用 relay 支持的推送">
    relay 支持的推送在 `openclaw.json` 中配置。

    在 gateway 配置中设置：

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

    这会带来以下效果：

    - 允许 gateway 通过外部 relay 发送 `push.test`、唤醒 nudges 和重连唤醒。
    - 使用由已配对 iOS 应用转发的、按注册范围授予的发送授权。gateway 不需要部署范围的 relay token。
    - 将每个 relay 支持的注册绑定到 iOS 应用配对时使用的 gateway 身份，因此其他 gateway 无法复用已存储的注册。
    - 本地/手动 iOS 构建仍使用直接 APNs。relay 支持的发送仅适用于通过 relay 注册的官方分发构建。
    - 必须与官方/TestFlight iOS 构建中内置的 relay base URL 匹配，这样注册和发送流量才会到达同一 relay 部署。

    端到端流程：

    1. 安装使用相同 relay base URL 编译的官方/TestFlight iOS 构建。
    2. 在 gateway 上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 gateway 配对，并让 node 和 operator 会话都连接起来。
    4. iOS 应用会获取 gateway 身份，使用 App Attest 和应用收据向 relay 注册，然后将 relay 支持的 `push.apns.register` 负载发布到已配对的 gateway。
    5. gateway 存储 relay handle 和发送授权，然后将其用于 `push.test`、唤醒 nudges 和重连唤醒。

    运行说明：

    - 如果你将 iOS 应用切换到另一个 gateway，请重新连接该应用，以便它发布一个绑定到新 gateway 的 relay 注册。
    - 如果你发布了一个指向不同 relay 部署的新 iOS 构建，应用会刷新其缓存的 relay 注册，而不是复用旧的 relay 来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍然是仅限 loopback 的开发逃生出口；不要在配置中持久保存 HTTP relay URL。

    有关端到端流程，请参阅 [iOS App](/platforms/ios#relay-backed-push-for-official-builds)；有关 relay 安全模型，请参阅 [Authentication and trust flow](/platforms/ios#authentication-and-trust-flow)。

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

    - `every`：时长字符串（`30m`、`2h`）。设为 `0m` 可禁用。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：针对私信式 heartbeat 目标，使用 `allow`（默认）或 `block`
    - 完整指南请参阅 [Heartbeat](/gateway/heartbeat)。

  </Accordion>

  <Accordion title="配置 cron jobs">
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

    - `sessionRetention`：从 `sessions.json` 中修剪已完成的隔离运行会话（默认 `24h`；设为 `false` 可禁用）。
    - `runLog`：按大小和保留行数修剪 `cron/runs/<jobId>.jsonl`。
    - 功能概览和 CLI 示例请参阅 [Cron jobs](/automation/cron-jobs)。

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
    - 将所有 hook/webhook 负载内容都视为不可信输入。
    - 使用专用的 `hooks.token`；不要复用共享 Gateway 网关 token。
    - hook 认证仅支持 header（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串中的 token 会被拒绝。
    - `hooks.path` 不能为 `/`；请将 webhook 入口保留在专用子路径下，例如 `/hooks`。
    - 除非是在做严格限定范围的调试，否则应保持不安全内容绕过标志关闭（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果你启用了 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes` 来限制调用方可选的 session key。
    - 对于由 hook 驱动的智能体，优先使用强力的现代模型层级和严格工具策略（例如仅限消息发送，并尽可能结合沙箱隔离）。

    所有映射选项和 Gmail 集成请参阅[完整参考](/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="配置 multi-agent 路由">
    运行多个隔离的智能体，每个都有独立工作区和会话：

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

    有关绑定规则和按智能体划分的访问 profiles，请参阅 [Multi-Agent](/concepts/multi-agent) 和[完整参考](/gateway/configuration-reference#multi-agent-routing)。

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

    - **单个文件**：替换所在的容器对象
    - **文件数组**：按顺序深度合并（后者优先）
    - **同级键**：在 includes 之后合并（覆盖已包含的值）
    - **嵌套 includes**：支持，最多 10 层
    - **相对路径**：相对于包含它的文件解析
    - **错误处理**：对缺失文件、解析错误和循环 include 提供清晰错误

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关会监视 `~/.openclaw/openclaw.json` 并自动应用更改——大多数设置无需手动重启。

### 重载模式

| 模式 | 行为 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全更改。对关键更改会自动重启。 |
| **`hot`** | 仅热应用安全更改。需要重启时会记录警告——由你自行处理。 |
| **`restart`** | 任意配置更改都会重启 Gateway 网关，无论是否安全。 |
| **`off`** | 禁用文件监视。更改会在下次手动重启时生效。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些能热应用，哪些需要重启

大多数字段都能在不停机的情况下热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别 | 字段 | 需要重启？ |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| 渠道 | `channels.*`、`web`（WhatsApp）——所有内置和扩展渠道 | 否 |
| 智能体与模型 | `agent`、`agents`、`models`、`routing` | 否 |
| 自动化 | `hooks`、`cron`、`agent.heartbeat` | 否 |
| 会话与消息 | `session`、`messages` | 否 |
| 工具与媒体 | `tools`、`browser`、`skills`、`audio`、`talk` | 否 |
| UI 与其他 | `ui`、`logging`、`identity`、`bindings` | 否 |
| Gateway 网关服务器 | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP） | **是** |
| 基础设施 | `discovery`、`canvasHost`、`plugins` | **是** |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外——更改它们**不会**触发重启。
</Note>

## 配置 RPC（程序化更新）

<Note>
控制平面写入 RPC（`config.apply`、`config.patch`、`update.run`）按 `deviceId+clientIp` 限速：**每 60 秒 3 次请求**。被限速时，RPC 会返回 `UNAVAILABLE` 并附带 `retryAfterMs`。
</Note>

安全/默认流程：

- `config.schema.lookup`：检查一个按路径限定的配置子树，包含浅层
  schema 节点、匹配到的提示元数据和直接子项摘要
- `config.get`：获取当前快照 + hash
- `config.patch`：首选的部分更新路径
- `config.apply`：仅用于完整配置替换
- `update.run`：显式自更新 + 重启

当你不是替换整个配置时，优先使用 `config.schema.lookup`
然后 `config.patch`。

<AccordionGroup>
  <Accordion title="config.apply（完整替换）">
    在一个步骤中校验 + 写入完整配置并重启 Gateway 网关。

    <Warning>
    `config.apply` 会替换**整个配置**。部分更新请使用 `config.patch`，单个键请使用 `openclaw config set`。
    </Warning>

    参数：

    - `raw`（字符串）——整个配置的 JSON5 负载
    - `baseHash`（可选）——来自 `config.get` 的配置 hash（配置存在时必需）
    - `sessionKey`（可选）——用于重启后唤醒 ping 的 session key
    - `note`（可选）——重启哨兵的备注
    - `restartDelayMs`（可选）——重启前延迟（默认 2000）

    当已有重启在挂起/进行中时，重启请求会被合并，并且两次重启周期之间有 30 秒冷却时间。

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

    - `raw`（字符串）——仅包含要更改键的 JSON5
    - `baseHash`（必填）——来自 `config.get` 的配置 hash
    - `sessionKey`、`note`、`restartDelayMs` —— 与 `config.apply` 相同

    重启行为与 `config.apply` 相同：挂起中的重启会被合并，并且两次重启周期之间有 30 秒冷却。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

OpenClaw 会读取来自父进程的环境变量，另外还包括：

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
  如果启用且预期键名未设置，OpenClaw 会运行你的登录 shell，并且只导入缺失键名：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

环境变量等价写法：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="在配置值中替换环境变量">
  可在任意配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失/空变量会在加载时抛出错误
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

有关 SecretRef 的详细信息（包括用于 `env`/`file`/`exec` 的 `secrets.providers`），请参阅 [Secrets Management](/gateway/secrets)。
支持的凭证路径列在 [SecretRef Credential Surface](/reference/secretref-credential-surface) 中。
</Accordion>

完整的优先级和来源请参阅 [Environment](/help/environment)。

## 完整参考

如需按字段逐项查看的完整参考，请参阅 **[Configuration Reference](/gateway/configuration-reference)**。

---

_相关内容：[Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
