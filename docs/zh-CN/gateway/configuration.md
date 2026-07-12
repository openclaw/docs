---
read_when:
    - 首次设置 OpenClaw
    - 查找常见配置模式
    - 导航到特定配置部分
summary: 配置概览：常见任务、快速设置以及完整参考链接
title: 配置
x-i18n:
    generated_at: "2026-07-12T14:26:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18717d03bb923d90725b263e064f932ac30006d21f4b1b1bd98a4e39f1c92cff
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 支持注释和尾随逗号">**JSON5**</Tooltip> 配置。如果该文件不存在，OpenClaw 将使用安全的默认值。

当前配置路径必须是常规文件。OpenClaw 发起的写入会以原子方式替换该文件（重命名到此路径），因此，如果 `openclaw.json` 是符号链接，其目标会被替换，而不是通过链接写入——请避免使用符号链接配置布局。如果配置位于默认状态目录之外，请将 `OPENCLAW_CONFIG_PATH` 直接指向实际文件。

添加配置的常见原因：

- 连接渠道并控制谁可以向机器人发送消息
- 设置模型、工具、沙箱隔离或自动化（cron、Hooks）
- 调整会话、媒体、网络或 UI

有关所有可用字段，请参阅[完整参考](/zh-CN/gateway/configuration-reference)。

智能体和自动化在编辑配置前，应使用 `config.schema.lookup` 获取精确的字段级文档。使用本页获取面向任务的指导，并使用[配置参考](/zh-CN/gateway/configuration-reference)查看更全面的字段映射和默认值。

<Tip>
**刚开始接触配置？** 使用 `openclaw onboard` 开始交互式设置，或查看[配置示例](/zh-CN/gateway/configuration-examples)指南，获取可直接复制粘贴的完整配置。
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
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789)，然后使用 **配置** 选项卡。
    Control UI 会根据实时配置模式渲染表单，其中包括字段
    `title` / `description` 文档元数据，以及可用的插件和渠道模式，
    并提供 **原始 JSON** 编辑器作为备用方式。对于逐层深入的
    UI 和其他工具，Gateway 网关还会公开 `config.schema.lookup`，
    用于获取一个限定路径的模式节点及其直接子节点摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关会监视该文件并自动应用更改（请参阅[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格验证

<Warning>
OpenClaw 仅接受完全匹配模式的配置。未知键、格式错误的类型或无效值会导致 Gateway 网关**拒绝启动**。唯一的根级例外是 `$schema`（字符串），以便编辑器附加 JSON Schema 元数据。
</Warning>

`openclaw config schema` 会输出 Control UI 和验证所使用的规范 JSON Schema。
`config.schema.lookup` 会获取一个限定路径的节点及其子节点摘要，供逐层深入的工具使用。字段 `title`/`description` 文档元数据
会贯穿嵌套对象、通配符（`*`）、数组项（`[]`）以及 `anyOf`/
`oneOf`/`allOf` 分支。加载清单注册表后，会合并运行时插件和渠道模式。

验证失败时：

- Gateway 网关不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看确切问题
- 运行 `openclaw doctor --fix`（`--repair` 是同一标志；`--yes` 会跳过提示）以应用修复

每次成功启动后，Gateway 网关都会保留一份可信的最近一次有效配置副本，
但启动和热重载不会自动恢复该副本——只有 `openclaw doctor --fix`
会这样做。如果 `openclaw.json` 验证失败（包括插件内部验证），Gateway 网关
将启动失败或跳过重载，而当前运行时会继续使用最近一次接受的
配置。被拒绝的写入也会保存为 `<path>.rejected.<timestamp>`，以供检查。
Gateway 网关会阻止看似意外覆盖的写入——例如删除 `gateway.mode`、
丢失 `meta` 块，或将文件缩小一半以上——除非写入
明确允许破坏性更改。如果候选配置包含 `***` 或 `[redacted]`
等已遮盖的密钥占位符，则不会将其提升为最近一次有效配置。

## 常见任务

<AccordionGroup>
  <Accordion title="设置渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置部分。有关设置步骤，请参阅对应的渠道页面：

    - [Discord](/zh-CN/channels/discord) - `channels.discord`
    - [Feishu](/zh-CN/channels/feishu) - `channels.feishu`
    - [Google Chat](/zh-CN/channels/googlechat) - `channels.googlechat`
    - [iMessage](/zh-CN/channels/imessage) - `channels.imessage`
    - [Mattermost](/zh-CN/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/zh-CN/channels/msteams) - `channels.msteams`
    - [Signal](/zh-CN/channels/signal) - `channels.signal`
    - [Slack](/zh-CN/channels/slack) - `channels.slack`
    - [Telegram](/zh-CN/channels/telegram) - `channels.telegram`
    - [WhatsApp](/zh-CN/channels/whatsapp) - `channels.whatsapp`

    所有渠道都采用相同的私信策略模式：

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // 配对 | 允许列表 | 开放 | 禁用
          allowFrom: ["tg:123"], // 仅用于允许列表/开放模式
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="选择和配置模型">
    设置主要模型和可选的回退模型：

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

    - `agents.defaults.models` 定义模型目录，并充当 `/model` 的允许列表；`provider/*` 条目会将 `/model`、`/models` 和模型选择器筛选为选定的提供商，同时仍使用动态模型发现。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加允许列表条目，而不删除现有模型。如果普通替换会删除条目，除非传入 `--replace`，否则会被拒绝。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制记录文本/工具图像的缩小尺寸（默认值为 `1200`）；在大量使用截图的运行中，较低的值通常会减少视觉令牌用量。
    - 有关在聊天中切换模型的信息，请参阅[模型 CLI](/zh-CN/concepts/models)；有关身份验证轮换和回退行为的信息，请参阅[模型故障转移](/zh-CN/concepts/model-failover)。
    - 对于自定义/自托管提供商，请参阅参考中的[自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以向机器人发送消息">
    私信访问权限通过各渠道的 `dmPolicy` 控制（默认值为 `"pairing"`）：

    - `"pairing"`：未知发送者会收到一个需要审批的一次性配对码
    - `"allowlist"`：仅允许 `allowFrom`（或已配对允许存储）中的发送者
    - `"open"`：允许所有传入私信（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy`（`"allowlist" | "open" | "disabled"`）以及 `groupAllowFrom` 或渠道特定的允许列表。

    有关各渠道的详细信息，请参阅[完整参考](/zh-CN/gateway/config-channels#dm-and-group-access)。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认**要求提及**。为每个智能体配置触发模式。普通群组/渠道回复会自动发布；对于应由智能体决定何时发言的共享房间，可选择使用消息工具路径：

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // 设为 "message_tool" 可在所有位置要求通过消息工具发送
        groupChat: {
          visibleReplies: "message_tool", // 选择启用；可见输出需要 message(action=send)
          unmentionedInbound: "room_event", // 未提及的常驻群聊内容作为静默上下文
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
    - **文本模式**：`mentionPatterns` 中的安全正则表达式模式
    - **可见回复**：`messages.visibleReplies` 可以在全局要求通过消息工具发送；`messages.groupChat.visibleReplies` 会为群组/渠道覆盖该设置。
    - 有关可见回复模式、各渠道覆盖和自聊模式，请参阅[完整参考](/zh-CN/gateway/config-channels#group-chat-mention-gating)。

  </Accordion>

  <Accordion title="按智能体限制 Skills">
    使用 `agents.defaults.skills` 设置共享基线，然后通过
    `agents.list[].skills` 覆盖特定智能体：

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // 继承 github、weather
          { id: "docs", skills: ["docs-search"] }, // 替换默认值
          { id: "locked-down", skills: [] }, // 无 Skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills`，默认不限制 Skills。
    - 省略 `agents.list[].skills` 以继承默认值。
    - 设置 `agents.list[].skills: []` 表示不使用任何 Skills。
    - 请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)和
      [配置参考](/zh-CN/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="调整 Gateway 网关渠道健康监控">
    控制 Gateway 网关以多激进的方式重启看似停滞的渠道：

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

    - 所示值均为默认值。设置 `gateway.channelHealthCheckMinutes: 0` 可在全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可以为单个渠道或账户禁用自动重启，而无需禁用全局监控。
    - 有关运维调试，请参阅[健康检查](/zh-CN/gateway/health)；有关所有字段，请参阅[完整参考](/zh-CN/gateway/configuration-reference#gateway)。

  </Accordion>

  <Accordion title="调整 Gateway 网关 WebSocket 握手超时">
    在负载较高或性能较低的主机上，为本地客户端提供更多时间来完成
    身份验证前的 WebSocket 握手：

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 默认值为 `15000` 毫秒。
    - 对于一次性的服务或 shell 覆盖，`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 仍具有更高优先级。
    - 应优先修复启动/事件循环停顿；此选项适用于运行正常但预热期间速度较慢的主机。

  </Accordion>

  <Accordion title="配置会话和重置">
    会话控制对话的连续性和隔离：

    ```json5
    {
      session: {
    ```
    ```json5
        dmScope: "per-channel-peer",  // 推荐用于多用户场景
    ```
    ```json5
        threadBindings: {
    ```
    ```json5
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
    ```
    ```json5
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```
    - `dmScope`：`main`（共享）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：线程绑定会话路由的全局默认值。`/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age` 可按会话绑定、解绑、列出和调整此设置（Discord 绑定线程，Telegram 绑定话题/对话）。
    - 有关作用域、身份关联和发送策略，请参阅[会话管理](/zh-CN/concepts/session)。
    - 有关所有字段，请参阅[完整参考](/zh-CN/gateway/config-agents#session)。

  </Accordion>

  <Accordion title="Enable sandboxing">
    在隔离的沙箱运行时中运行智能体会话：

    ```json5
    {
      agents: {
        defaults: {
    ```
    ```json5
          sandbox: {
    ```
    ```json5
            mode: "non-main",  // 关闭 | 非主会话 | 全部
    ```
    ```json5
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```
    请先构建镜像——从源代码检出目录运行 `scripts/sandbox-setup.sh`；如果通过 npm 安装，请参阅[沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)中的内联 `docker build` 命令。

    请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)获取完整指南，并参阅[完整参考](/zh-CN/gateway/config-agents#agentsdefaultssandbox)了解所有选项。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用由中继支持的推送">
    面向公共 App Store 构建的中继推送使用托管的 OpenClaw 中继：`https://ios-push-relay.openclaw.ai`。

    自定义中继部署需要使用专门分离的 iOS 构建/部署路径，且其中继 URL 必须与 Gateway 网关的中继 URL 匹配。如果你使用自定义中继构建，请在 Gateway 网关配置中设置以下内容：

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

    等效的 CLI 命令：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    此配置的作用：

    - 允许 Gateway 网关通过外部中继发送 `push.test`、唤醒提示和重连唤醒。
    - 使用由已配对的 iOS 应用转发、限定于注册范围的发送授权。Gateway 网关不需要部署范围的中继令牌。
    - 将每个由中继支持的注册绑定到 iOS 应用所配对的 Gateway 网关身份，因此其他 Gateway 网关无法复用已存储的注册。
    - 本地/手动 iOS 构建继续直接使用 APNs。由中继支持的发送仅适用于通过中继注册的官方分发构建。
    - 必须与内置于 iOS 构建中的中继基础 URL 一致，以便注册和发送流量到达同一中继部署。

    端到端流程：

    1. 安装官方 iOS 应用。
    2. 可选：仅在使用刻意独立的自定义中继构建时，才在 Gateway 网关上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 Gateway 网关配对，并让节点会话和操作员会话均建立连接。
    4. iOS 应用获取 Gateway 网关身份，使用 App Attest 和应用收据向中继注册，然后将由中继支持的 `push.apns.register` 载荷发布到已配对的 Gateway 网关。
    5. Gateway 网关存储中继句柄和发送授权，然后使用它们进行 `push.test`、唤醒提示和重连唤醒。

    运维说明：

    - 如果将 iOS 应用切换到其他 Gateway 网关，请重新连接应用，使其能够发布绑定到该 Gateway 网关的新中继注册。
    - 如果发布的新 iOS 构建指向其他中继部署，应用会刷新其缓存的中继注册，而不是复用旧的中继来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可用作临时环境变量覆盖项。
    - 自定义 Gateway 网关中继 URL 必须与内置于 iOS 构建中的中继基础 URL 一致；公开 App Store 发布通道会拒绝自定义 iOS 中继 URL 覆盖项。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是仅限回环地址的开发应急选项；不要在配置中持久保存 HTTP 中继 URL。

    有关端到端流程，请参阅 [iOS 应用](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)；有关中继安全模型，请参阅[身份验证和信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="设置 Heartbeat（定期检查）">
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

    - `every`：时长字符串（`30m`、`2h`）。设置为 `0m` 可禁用。默认值：`30m`。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：对于私信式 Heartbeat 目标，设为 `allow`（默认）或 `block`
    - 完整指南请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="配置定时任务">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // 默认值；定时任务分派 + 隔离的定时任务智能体轮次执行
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`：从 SQLite 会话行中清理已完成的隔离运行会话（默认 `24h`；设为 `false` 可禁用）。
    - `runLog`：按任务清理保留的定时任务运行历史记录行。历史记录存储在 SQLite 中；保留 `maxBytes`（默认 `2_000_000`）是为了兼容旧版基于文件的运行日志，`keepLines` 默认为 `2000`。
    - 有关功能概览和 CLI 示例，请参阅[定时任务](/zh-CN/automation/cron-jobs)。

  </Accordion>

  <Accordion title="设置 Webhooks（Hooks）">
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

    安全注意事项：
    - 将所有 hook/webhook 载荷内容视为不受信任的输入。
    - 使用专用的 `hooks.token`；不要复用当前有效的 Gateway 网关身份验证密钥（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。
    - Hook 身份验证仅支持请求头（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串中的令牌会被拒绝。
    - `hooks.path` 不能为 `/`；请将 webhook 入口放在 `/hooks` 等专用子路径上。
    - 除非进行严格限定范围的调试，否则请保持不安全内容绕过标志处于禁用状态（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果启用 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes`，以限制调用方选择的会话键。
    - 对于由 hook 驱动的智能体，优先使用强大的现代模型层级和严格的工具策略（例如仅允许消息传递，并尽可能使用沙箱隔离）。

    有关所有映射选项和 Gmail 集成，请参阅[完整参考](/zh-CN/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="配置多智能体路由">
    运行多个具有独立工作区和会话的隔离智能体：

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

    有关绑定规则和每个智能体的访问配置文件，请参阅[多智能体](/zh-CN/concepts/multi-agent)和[完整参考](/zh-CN/gateway/config-agents#multi-agent-routing)。

  </Accordion>

  <Accordion title="将配置拆分到多个文件中（$include）">
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
    - **文件数组**：按顺序深度合并（后者优先），最多嵌套 10 层
    - **同级键**：在 include 后合并（覆盖 include 中的值）
    - **相对路径**：相对于执行 include 的文件解析
    - **路径格式**：include 路径不得包含空字节，并且解析前后的长度都必须严格小于 4096 个字符
    - **OpenClaw 所有的写入**：当一次写入仅更改一个由单文件 include 支持的顶级部分时，例如 `plugins: { $include: "./plugins.json5" }`，
      OpenClaw 会更新该 include 文件，并保持 `openclaw.json` 不变
    - **不支持的写入穿透**：对于根级 include、include 数组以及带有同级覆盖项的 include，OpenClaw 所有的写入会以失败关闭方式处理，而不会
      将配置扁平化
    - **范围限制**：`$include` 路径必须解析到包含
      `openclaw.json` 的目录下。若要在多台机器或多个用户之间共享目录树，请将
      `OPENCLAW_INCLUDE_ROOTS` 设置为由路径组成的列表（POSIX 上使用 `:`，Windows 上使用 `;`），其中包含
      include 可以引用的其他目录。系统会解析符号链接并
      重新检查，因此，即使某路径从字面上看位于配置目录中，只要其
      实际目标逃逸出所有允许的根目录，仍会被拒绝。
    - **错误处理**：针对文件缺失、解析错误、循环 include、无效路径格式和长度超限提供明确错误

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关会监视 `~/.openclaw/openclaw.json` 并自动应用更改——大多数设置无需手动重启。

直接编辑文件在通过验证前会被视为不受信任。监视器会等待
编辑器的临时写入/重命名变动稳定下来，读取最终文件，并拒绝
无效的外部编辑，而不会重写 `openclaw.json`。OpenClaw 所有的配置
写入在写入前使用相同的架构门控（有关适用于每次写入的覆盖/回滚规则，
请参阅[严格验证](#strict-validation)）。

如果看到 `config reload skipped (invalid config)`，或者启动时报告 `Invalid
config`，请检查配置，运行 `openclaw config validate`，然后运行 `openclaw
doctor --fix` 进行修复。有关检查清单，请参阅 [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting#gateway-rejected-invalid-config)。

### 重载模式

| 模式                   | 行为                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全的更改。对关键更改自动重启。           |
| **`hot`**              | 仅热应用安全的更改。需要重启时记录警告——由你自行处理。 |
| **`restart`**          | 任何配置更改都会重启 Gateway 网关，无论是否安全。                                 |
| **`off`**              | 禁用文件监视。更改将在下次手动重启时生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 可热应用的更改与需要重启的更改

大多数字段都可热应用，无需停机；某些热应用的部分只会重启对应的子系统（渠道、cron、Heartbeat、健康监视器），而不是整个 Gateway 网关。在 `hybrid` 模式下，需要重启 Gateway 网关的更改会自动处理。

| 类别                | 字段                                                                    | 是否需要重启 Gateway 网关？    |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| 渠道                | `channels.*`、`web`（WhatsApp）——所有内置渠道和插件渠道                  | 否（重启相应渠道）             |
| 智能体和模型        | `agent`、`agents`、`models`、`routing`                                  | 否                             |
| 自动化              | `hooks`、`cron`、`agent.heartbeat`                                      | 否（重启相应子系统）           |
| 会话和消息          | `session`、`messages`                                                   | 否                             |
| 工具和媒体          | `tools`、`skills`、`mcp`、`audio`、`talk`                               | 否                             |
| 插件配置            | `plugins.entries.*`、`plugins.allow`、`plugins.deny`、`plugins.enabled` | 否（重新加载插件运行时）       |
| UI 和其他           | `ui`、`logging`、`identity`、`bindings`                                 | 否                             |
| Gateway 网关服务器 | `gateway.*`（端口、绑定、身份验证、Tailscale、TLS、HTTP、推送）          | **是**                         |
| 基础设施            | `discovery`、`browser`、`plugins.load`、`plugins.installs`              | **是**                         |

<Note>
`gateway.reload` 和 `gateway.remote` 是 `gateway.*` 下的例外——更改它们**不会**触发重启。各个插件也可以覆盖此表：已加载的插件可以声明其自身会触发重启的配置前缀（例如，内置 Canvas 插件不仅会因其自身的 `plugins.entries.canvas` 而重启 Gateway 网关，也会因 `plugins.enabled`、`plugins.allow` 和 `plugins.deny` 而重启），因此实际行为取决于当前启用了哪些插件。
</Note>

### 重新加载规划

当你编辑通过 `$include` 引用的源文件时，OpenClaw 会根据源文件中编写的布局规划重新加载，而不是根据扁平化的内存视图。这样，即使单个顶层部分位于其单独包含的文件中（例如 `plugins: { $include: "./plugins.json5" }`），热重载决策（热应用还是重启）也仍然可预测。如果源布局存在歧义，重新加载规划将以失败关闭方式处理。

## 配置 RPC（程序化更新）

对于通过 Gateway 网关 API 写入配置的工具，请优先使用以下流程：

- 使用 `config.schema.lookup` 检查一个子树（浅层 schema 节点 + 子项摘要）
- 使用 `config.get` 获取当前快照及 `hash`
- 使用 `config.patch` 进行部分更新（JSON 合并补丁：对象合并，`null` 删除；如果会移除条目，则仅在通过 `replacePaths` 明确确认后替换数组）
- 仅当你打算替换整个配置时使用 `config.apply`
- 使用 `update.run` 执行显式自更新并重启；如果重启后的会话应继续执行一个后续轮次，请包含 `continuationMessage`
- 使用 `update.status` 检查最近的更新重启哨兵，并在重启后验证正在运行的版本

智能体应将 `config.schema.lookup` 作为获取精确字段级文档和约束的首选入口。如果需要更全面的配置映射、默认值或指向专用子系统参考的链接，请使用[配置参考](/zh-CN/gateway/configuration-reference)。

<Note>
控制平面写入（`config.apply`、`config.patch`、`update.run`）按每个 `deviceId+clientIp` 限制为每 60 秒 3 个请求。重启请求会被合并，然后在各次重启周期之间强制执行 30 秒冷却时间。`update.status` 是只读的，但仅限管理员使用，因为重启哨兵可能包含更新步骤摘要和命令输出末尾内容。
</Note>

部分补丁示例：

```bash
openclaw gateway call config.get --params '{}'  # 获取 payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、`note` 和 `restartDelayMs`。一旦配置文件已存在，这两种方法都要求提供 `baseHash`（如果不存在现有配置，则首次写入会跳过此检查）。

`config.patch` 还接受 `replacePaths`，这是一个配置路径数组，用于声明有意进行数组替换。如果补丁会用条目更少的数组替换现有数组，或删除现有数组，除非该确切路径出现在 `replacePaths` 中，否则 Gateway 网关会拒绝此次写入；数组条目下的嵌套数组使用 `[]`，例如 `agents.list[].skills`。这可以防止截断的 `config.get` 快照在没有提示的情况下覆盖路由或允许列表数组。当你打算替换完整配置时，请使用 `config.apply`。

## 环境变量

OpenClaw 会读取父进程中的环境变量，以及以下来源：

- 当前工作目录中的 `.env`（如果存在）
- `~/.openclaw/.env`（全局回退）

这两个文件都不会覆盖现有环境变量。你还可以在配置中设置内联环境变量：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="导入 Shell 环境变量（可选）">
  如果启用此功能，并且预期键名尚未设置，OpenClaw 会运行你的登录 shell，并且仅导入缺失的键：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

等效环境变量：`OPENCLAW_LOAD_SHELL_ENV=1`。默认 `timeoutMs`：`15000`。
</Accordion>

<Accordion title="在配置值中替换环境变量">
  在任何配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失或为空的变量会在加载时引发错误
- 使用 `$${VAR}` 转义，以输出字面量
- 可在 `$include` 文件中使用
- 内联替换：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret 引用（env、file、exec）">
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

SecretRef 的详细信息（包括用于 `env`/`file`/`exec` 的 `secrets.providers`）请参阅[密钥管理](/zh-CN/gateway/secrets)。
受支持的凭据路径列在 [SecretRef 凭据范围](/zh-CN/reference/secretref-credential-surface)中。
</Accordion>

有关完整的优先级和来源，请参阅[环境](/zh-CN/help/environment)。

## 完整参考

有关逐字段的完整参考，请参阅**[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关：[配置示例](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [配置示例](/zh-CN/gateway/configuration-examples)
- [Gateway 网关运行手册](/zh-CN/gateway)
