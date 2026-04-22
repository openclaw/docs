---
read_when:
    - 首次设置 OpenClaw
    - 查找常见的配置模式
    - 导航到特定配置章节
summary: 配置概览：常见任务、快速设置，以及完整参考的链接
title: 配置
x-i18n:
    generated_at: "2026-04-22T23:04:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39a9f521b124026a32064464b6d0ce1f93597c523df6839fde37d61e597bcce7
    source_path: gateway/configuration.md
    workflow: 15
---

# 配置

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 支持注释和尾随逗号">**JSON5**</Tooltip> 配置。
当前使用的配置路径必须是常规文件。对于由 OpenClaw 管理的写入操作，不支持使用符号链接的 `openclaw.json`
布局；原子写入可能会替换该路径，而不是保留符号链接。如果你将配置保存在默认状态目录之外，请将 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

如果该文件不存在，OpenClaw 会使用安全的默认设置。添加配置的常见原因包括：

- 连接渠道并控制谁可以向机器人发送消息
- 设置模型、工具、沙箱隔离或自动化（cron、hooks）
- 调整会话、媒体、网络或 UI

有关所有可用字段，请参阅[完整参考](/zh-CN/gateway/configuration-reference)。

<Tip>
**刚开始接触配置？** 可先运行 `openclaw onboard` 进行交互式设置，或查看[配置示例](/zh-CN/gateway/configuration-examples)指南，获取可直接复制粘贴的完整配置。
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
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789)，然后使用 **配置** 标签页。
    Control UI 会根据实时配置 schema 渲染表单，其中包括字段
    `title` / `description` 文档元数据，以及在可用时提供的插件和渠道 schema，
    同时还提供 **原始 JSON** 编辑器作为兜底方式。对于下钻式
    UI 和其他工具，Gateway 网关 还会暴露 `config.schema.lookup`，
    以获取单个路径范围内的 schema 节点及其直接子节点摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关 会监视该文件并自动应用更改（参见[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格校验

<Warning>
OpenClaw 仅接受与 schema 完全匹配的配置。未知键名、类型格式错误或无效值都会导致 Gateway 网关 **拒绝启动**。根级别唯一的例外是 `$schema`（字符串），这样编辑器才能附加 JSON Schema 元数据。
</Warning>

Schema 工具说明：

- `openclaw config schema` 会输出与 Control UI 和配置校验所使用的同一套 JSON Schema。
- 将该 schema 输出视为 `openclaw.json` 的规范机器可读契约；本概览和配置参考是对它的总结。
- 字段 `title` 和 `description` 的值会被带入 schema 输出，供编辑器和表单工具使用。
- 嵌套对象、通配符（`*`）和数组项（`[]`）条目在存在对应字段文档时，会继承相同的文档元数据。
- `anyOf` / `oneOf` / `allOf` 组合分支也会继承相同的文档元数据，因此联合 / 交叉变体会保留相同的字段帮助信息。
- `config.schema.lookup` 会返回一个规范化的配置路径，包含一个浅层
  schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界条件
  以及类似的校验字段）、匹配的 UI 提示元数据，以及直接子节点
  摘要，供下钻式工具使用。
- 当 Gateway 网关 能加载当前 manifest 注册表时，会合并运行时插件 / 渠道 schema。
- `pnpm config:docs:check` 会检测面向文档的配置基线工件与当前 schema 表面之间的漂移。

当校验失败时：

- Gateway 网关 不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看具体问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

在成功启动后，Gateway 网关 还会保留一份可信的“最近一次已知正常”副本。如果
之后在 OpenClaw 外部修改了 `openclaw.json`，并导致其不再通过校验，启动
和热重载会将损坏的文件保留为带时间戳的 `.clobbered.*` 快照，
恢复“最近一次已知正常”副本，并以醒目的警告日志记录恢复原因。
启动时的读取恢复也会将文件大小突然明显缩小、缺失配置元数据以及
缺失 `gateway.mode` 视为关键的覆盖损坏特征，前提是“最近一次已知正常”
副本中原本包含这些字段。
如果某条状态 / 日志行被意外地前置到原本有效的 JSON
配置之前，Gateway 网关 启动和 `openclaw doctor --fix` 可以去掉该前缀，
将受污染文件保留为 `.clobbered.*`，并继续使用恢复后的
JSON。
下一次主智能体回合还会收到一条系统事件警告，告知其
配置已被恢复，且不得盲目重写。对于已校验通过的启动以及已接受的热重载，
“最近一次已知正常”副本都会更新，包括由 OpenClaw 管理的配置写入，前提是其持久化
文件哈希仍与已接受写入一致。如果候选副本包含已脱敏的密钥
占位符，例如 `***` 或缩短后的令牌值，则会跳过提升。

## 常见任务

<AccordionGroup>
  <Accordion title="设置一个渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置部分。设置步骤请参阅对应的专用渠道页面：

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
          allowFrom: ["tg:123"], // 仅用于 allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="选择并配置模型">
    设置主模型和可选的回退模型：

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

    - `agents.defaults.models` 定义模型目录，并作为 `/model` 的 allowlist。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 可在不移除现有模型的情况下添加 allowlist 条目。会移除条目的普通替换操作会被拒绝，除非你传入 `--replace`。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制转录 / 工具图像的缩放下限（默认值为 `1200`）；在大量截图的运行中，较低的值通常可减少视觉 token 使用量。
    - 关于在聊天中切换模型，请参阅[模型 CLI](/zh-CN/concepts/models)；关于凭证轮换和回退行为，请参阅[模型故障切换](/zh-CN/concepts/model-failover)。
    - 对于自定义 / 自托管提供商，请参阅参考中的[自定义提供商](/zh-CN/gateway/configuration-reference#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以向机器人发送消息">
    私信访问权限通过每个渠道的 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者会收到一个一次性配对码以供批准
    - `"allowlist"`：仅允许 `allowFrom` 中的发送者（或已配对的允许存储）
    - `"open"`：允许所有入站私信（要求 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy` + `groupAllowFrom` 或渠道特定的 allowlist。

    每个渠道的详细信息请参阅[完整参考](/zh-CN/gateway/configuration-reference#dm-and-group-access)。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认 **要求提及**。可按智能体配置模式：

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
    - 每个渠道的覆盖项和自聊模式请参阅[完整参考](/zh-CN/gateway/configuration-reference#group-chat-mention-gating)。

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
          { id: "writer" }, // 继承 github, weather
          { id: "docs", skills: ["docs-search"] }, // 替换默认值
          { id: "locked-down", skills: [] }, // 无 Skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills` 表示默认不限制 Skills。
    - 省略 `agents.list[].skills` 表示继承默认值。
    - 设置 `agents.list[].skills: []` 表示不启用任何 Skills。
    - 参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)，以及
      [配置参考](/zh-CN/gateway/configuration-reference#agents-defaults-skills)。

  </Accordion>

  <Accordion title="调整 Gateway 网关 渠道健康监控">
    控制 Gateway 网关 对看起来已停滞的渠道执行重启的积极程度：

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
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled` 可为单个渠道或账户禁用自动重启，而无需关闭全局监控。
    - 运行排障请参阅[健康检查](/zh-CN/gateway/health)，所有字段请参阅[完整参考](/zh-CN/gateway/configuration-reference#gateway)。

  </Accordion>

  <Accordion title="配置会话和重置">
    会话控制对话的连续性和隔离性：

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
    - 有关作用域、身份关联和发送策略，请参阅[会话管理](/zh-CN/concepts/session)。
    - 所有字段请参阅[完整参考](/zh-CN/gateway/configuration-reference#session)。

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

    完整指南请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)，所有选项请参阅[完整参考](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)。

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

    对应的 CLI 命令：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    这会带来以下效果：

    - 让 Gateway 网关 能通过外部 relay 发送 `push.test`、唤醒提醒和重连唤醒。
    - 使用由已配对 iOS 应用转发的、按注册范围限定的发送授权。Gateway 网关 不需要部署范围的 relay 令牌。
    - 将每个基于 relay 的注册绑定到 iOS 应用所配对的 Gateway 网关 身份，因此其他 Gateway 网关 无法复用已存储的注册信息。
    - 本地 / 手动构建的 iOS 版本仍使用直接 APNs。基于 relay 的发送仅适用于通过 relay 注册的官方分发构建。
    - 必须与官方 / TestFlight iOS 构建中内置的 relay 基础 URL 一致，这样注册和发送流量才能到达同一个 relay 部署。

    端到端流程：

    1. 安装使用相同 relay 基础 URL 编译的官方 / TestFlight iOS 构建。
    2. 在 Gateway 网关 上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 Gateway 网关 配对，并让节点会话和操作员会话都连接。
    4. iOS 应用获取 Gateway 网关 身份，使用 App Attest 和应用收据向 relay 注册，然后将基于 relay 的 `push.apns.register` 负载发布到已配对的 Gateway 网关。
    5. Gateway 网关 存储 relay 句柄和发送授权，然后将其用于 `push.test`、唤醒提醒和重连唤醒。

    运行说明：

    - 如果你将 iOS 应用切换到另一个 Gateway 网关，请重新连接该应用，以便它发布绑定到新 Gateway 网关 的 relay 注册。
    - 如果你发布了一个指向不同 relay 部署的新 iOS 构建，应用会刷新其缓存的 relay 注册，而不是复用旧的 relay 来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖项使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍然是仅限 local loopback 的开发逃生口；不要在配置中持久化 HTTP relay URL。

    端到端流程请参阅[iOS App](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)，relay 安全模型请参阅[认证与信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="设置 heartbeat（周期性报到）">
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
    - `directPolicy`：用于私信式 heartbeat 目标的 `allow`（默认）或 `block`
    - 完整指南请参阅[Heartbeat](/zh-CN/gateway/heartbeat)。

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
    - 功能概览和 CLI 示例请参阅[Cron 作业](/zh-CN/automation/cron-jobs)。

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
    - 将所有 hook / webhook 负载内容都视为不可信输入。
    - 使用专用的 `hooks.token`；不要复用共享的 Gateway 网关 令牌。
    - Hook 认证仅支持请求头（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串令牌会被拒绝。
    - `hooks.path` 不能为 `/`；应将 webhook 入口保留在专用子路径下，例如 `/hooks`。
    - 保持不安全内容绕过标志为禁用状态（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`），除非是在做严格限定范围的调试。
    - 如果你启用了 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes` 以限制调用方可选的会话键。
    - 对于由 hook 驱动的智能体，优先使用强大的现代模型层级和严格的工具策略（例如仅允许消息传递，并尽可能启用沙箱隔离）。

    所有映射选项和 Gmail 集成请参阅[完整参考](/zh-CN/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="配置多智能体路由">
    运行多个相互隔离的智能体，每个都有独立的工作区和会话：

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

    绑定规则和每个智能体的访问配置文件请参阅[多智能体](/zh-CN/concepts/multi-agent)和[完整参考](/zh-CN/gateway/configuration-reference#multi-agent-routing)。

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

    - **单个文件**：替换所在的对象
    - **文件数组**：按顺序深度合并（后者优先）
    - **同级键**：在 include 之后合并（覆盖 include 中的值）
    - **嵌套 include**：最多支持 10 层嵌套
    - **相对路径**：相对于包含它的文件解析
    - **由 OpenClaw 管理的写入**：当一次写入仅修改由单文件 include 支持的某个顶级部分时，
      例如 `plugins: { $include: "./plugins.json5" }`，
      OpenClaw 会更新该被包含文件，并保持 `openclaw.json` 不变
    - **不支持的透传写入**：对于根 include、include 数组，以及带有同级覆盖项的 include，
      在由 OpenClaw 管理的写入中会采用失败即关闭的策略，而不是
      扁平化配置
    - **错误处理**：对于缺失文件、解析错误和循环 include，会给出清晰错误

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关 会监视 `~/.openclaw/openclaw.json` 并自动应用更改——对于大多数设置，无需手动重启。

直接编辑文件在通过校验之前会被视为不可信。监视器会等待
编辑器临时写入 / 重命名抖动稳定下来，读取最终文件，并通过恢复
“最近一次已知正常”配置来拒绝无效的外部编辑。由 OpenClaw 管理的
配置写入在写入前也会经过相同的 schema 闸门；像删除 `gateway.mode`
或将文件缩小到原来一半以下这类破坏性覆盖会被拒绝，
并保存为 `.rejected.*` 以供检查。

如果你在日志中看到 `Config auto-restored from last-known-good` 或
`config reload restored last-known-good config`，请检查
`openclaw.json` 同目录下对应的 `.clobbered.*` 文件，修复被拒绝的
负载，然后运行 `openclaw config validate`。恢复检查清单请参阅[Gateway 网关 故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

### 重载模式

| 模式 | 行为 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全更改。对关键更改会自动重启。 |
| **`hot`** | 仅热应用安全更改。需要重启时会记录警告——由你自行处理。 |
| **`restart`** | 任何配置更改都会重启 Gateway 网关，无论是否安全。 |
| **`off`** | 禁用文件监视。更改会在下一次手动重启时生效。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可热应用，哪些需要重启

大多数字段都可在不停机的情况下热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别 | 字段 | 需要重启？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 渠道 | `channels.*`、`web`（WhatsApp）— 所有内置和插件渠道 | 否 |
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

## 配置 RPC（程序化更新）

<Note>
控制平面写入 RPC（`config.apply`、`config.patch`、`update.run`）按每个 `deviceId+clientIp` 做速率限制：**每 60 秒 3 个请求**。触发限制时，RPC 会返回带 `retryAfterMs` 的 `UNAVAILABLE`。
</Note>

安全 / 默认流程：

- `config.schema.lookup`：检查单个路径范围内的配置子树，返回一个浅层
  schema 节点、匹配的提示元数据以及直接子节点摘要
- `config.get`：获取当前快照 + 哈希
- `config.patch`：首选的局部更新路径
- `config.apply`：仅用于完整配置替换
- `update.run`：显式执行自更新 + 重启

当你不是要替换整个配置时，优先使用 `config.schema.lookup`
然后再使用 `config.patch`。

<AccordionGroup>
  <Accordion title="config.apply（完整替换）">
    在一步中校验并写入完整配置，同时重启 Gateway 网关。

    <Warning>
    `config.apply` 会替换**整个配置**。局部更新请使用 `config.patch`，单个键请使用 `openclaw config set`。
    </Warning>

    参数：

    - `raw`（字符串）— 整个配置的 JSON5 负载
    - `baseHash`（可选）— 来自 `config.get` 的配置哈希（当配置已存在时为必填）
    - `sessionKey`（可选）— 重启后唤醒 ping 使用的会话键
    - `note`（可选）— 重启哨兵使用的备注
    - `restartDelayMs`（可选）— 重启前延迟（默认 2000）

    当某个重启请求已在等待 / 进行中时，新的重启请求会被合并；并且两次重启周期之间会有 30 秒冷却时间。

    ```bash
    openclaw gateway call config.get --params '{}'  # 获取 payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch（局部更新）">
    将局部更新合并到现有配置中（JSON merge patch 语义）：

    - 对象递归合并
    - `null` 删除键
    - 数组整体替换

    参数：

    - `raw`（字符串）— 仅包含要更改键的 JSON5
    - `baseHash`（必填）— 来自 `config.get` 的配置哈希
    - `sessionKey`、`note`、`restartDelayMs` — 与 `config.apply` 相同

    重启行为与 `config.apply` 一致：等待中的重启会被合并，并且重启周期之间有 30 秒冷却时间。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

OpenClaw 会从父进程读取环境变量，此外还会读取：

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

<Accordion title="Shell 环境变量导入（可选）">
  如果启用，并且预期键名尚未设置，OpenClaw 会运行你的登录 shell，并且仅导入缺失的键：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

环境变量对应项：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="配置值中的环境变量替换">
  你可以在任意配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失 / 为空的变量会在加载时抛出错误
- 使用 `$${VAR}` 可输出字面量
- 在 `$include` 文件中同样可用
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

SecretRef 详情（包括用于 `env` / `file` / `exec` 的 `secrets.providers`）请参阅[Secrets Management](/zh-CN/gateway/secrets)。
支持的凭证路径列在[SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface) 中。
</Accordion>

完整优先级和来源请参阅[环境](/zh-CN/help/environment)。

## 完整参考

如需完整的逐字段参考，请参阅 **[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关内容：[配置示例](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_
