---
read_when:
    - 你看到了 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 在 OpenClaw 2026.4.25 之前，你使用了 api.registerEmbeddedExtensionFactory
    - 你正在将一个插件更新到现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-06-27T02:55:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，使用聚焦且有文档说明的导入。如果你的插件是在新架构之前构建的，本指南可帮助你迁移。

## 正在变化的内容

旧插件系统提供了两个开放范围很宽的表面，让插件可以从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** - 一个单一导入，会重新导出数十个
  helper。它的引入是为了在新插件架构构建期间保持旧的基于钩子的插件继续工作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一个宽泛的运行时 helper barrel，混合了系统事件、heartbeat 状态、投递队列、fetch/proxy helper、文件 helper、审批类型以及无关工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一个宽泛的配置兼容 barrel，在迁移窗口期间仍携带已弃用的直接加载/写入 helper。
- **`openclaw/extension-api`** - 一个桥接层，让插件能够直接访问宿主侧 helper，例如嵌入式智能体 runner。
- **`api.registerEmbeddedExtensionFactory(...)`** - 一个已移除的仅限嵌入式 runner 的内置扩展钩子，可观察嵌入式 runner 事件，例如
  `tool_result`。

这些宽泛导入表面现在已**弃用**。它们在运行时仍然可用，但新插件不得使用它们，现有插件也应在下一个大版本移除它们之前完成迁移。仅限嵌入式 runner 的扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释有文档说明的插件行为。破坏性契约变更必须先经过兼容适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、清单字段、设置 API、钩子以及运行时注册行为。

<Warning>
  向后兼容层将在未来某个大版本中移除。
  届时仍从这些表面导入的插件将会中断。
  旧版嵌入式扩展工厂注册已经不再加载。
</Warning>

## 为什么发生此变更

旧方案带来了问题：

- **启动缓慢** - 导入一个 helper 会加载数十个无关模块
- **循环依赖** - 宽泛的重新导出很容易造成导入循环
- **API 表面不清晰** - 无法判断哪些导出是稳定的，哪些是内部的

现代插件 SDK 修复了这一点：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含模块，具有清晰用途和有文档说明的契约。

面向内置渠道的旧版提供商便利接缝也已移除。
带有频道品牌的 helper 接缝是私有 monorepo 快捷方式，不是稳定的插件契约。请改用窄范围的通用 SDK 子路径。在内置插件工作区内，将提供商拥有的 helper 保留在该插件自己的 `api.ts` 或
`runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将 Claude 专用流式 helper 保留在自己的 `api.ts` /
  `contract-api.ts` 接缝中
- OpenAI 将提供商 builder、默认模型 helper 和实时提供商
  builder 保留在自己的 `api.ts` 中
- OpenRouter 将提供商 builder 和新手引导/配置 helper 保留在自己的
  `api.ts` 中

## Talk 和实时语音迁移计划

实时语音、电话、会议和浏览器 Talk 代码正在从表面本地的轮次记账迁移到由
`openclaw/plugin-sdk/realtime-voice` 导出的共享 Talk 会话控制器。新控制器负责通用 Talk 事件信封、活动轮次状态、捕获状态、输出音频状态、最近事件历史以及陈旧轮次拒绝。提供商插件应继续拥有厂商专用的实时会话；表面插件应继续拥有捕获、播放、电话和会议的特殊处理。

这次 Talk 迁移有意采用破坏式清理：

1. 将共享控制器/运行时原语保留在
   `plugin-sdk/realtime-voice`。
2. 将内置表面迁移到共享控制器：浏览器 relay、
   managed-room handoff、voice-call realtime、voice-call streaming STT、Google
   Meet realtime，以及原生 push-to-talk。
3. 用最终的 `talk.session.*` 和
   `talk.client.*` API 替换旧的 Talk RPC 系列。
4. 在 Gateway 网关
   `hello-ok.features.events` 中声明一个实时 Talk 事件频道：`talk.event`。
5. 删除旧的实时 HTTP 端点，以及任何请求时指令
   override 路径。

新代码不应直接调用 `createTalkEventSequencer(...)`，除非它正在实现低层适配器或测试 fixture。优先使用共享控制器，这样没有轮次 id 就无法发出轮次作用域事件，陈旧的 `turnEnd` /
`turnCancel` 调用无法清除较新的活动轮次，并且输出音频生命周期事件在电话、会议、浏览器 relay、managed-room
handoff 和原生 Talk 客户端之间保持一致。

目标公共 API 形态如下：

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

浏览器拥有的 WebRTC/提供商 websocket 会话使用 `talk.client.create`，
因为浏览器拥有提供商协商和媒体传输，而
Gateway 网关拥有凭证、指令和工具策略。`talk.session.*` 是用于 gateway-relay 实时、gateway-relay
转录，以及 managed-room 原生 STT/TTS 会话的通用 Gateway 网关托管表面。

将实时选择器放在 `talk.provider` /
`talk.providers` 旁边的旧版配置应使用 `openclaw doctor --fix` 修复；运行时 Talk
不会将 speech/TTS 提供商配置重新解释为实时提供商配置。

受支持的 `talk.session.create` 组合有意保持很小：

| 模式            | 传输       | Brain           | 拥有方              | 说明                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway 网关            | 通过 Gateway 网关桥接的全双工提供商音频；工具调用通过 agent-consult 工具路由。      |
| `transcription` | `gateway-relay` | `none`          | Gateway 网关            | 仅流式 STT；调用方发送输入音频并接收转录事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间 | Push-to-talk 和 walkie-talkie 风格房间，其中客户端拥有捕获/播放，Gateway 网关拥有轮次状态。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间 | 面向可信第一方表面的仅管理员房间模式，可直接执行 Gateway 网关工具动作。                  |

已移除方法映射：

| 旧                              | 新                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` 或 `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

统一控制词汇也有意保持窄范围：

  | 方法                            | 适用于                                                | 契约                                                                                                                                                                                     |
  | ------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 将 base64 PCM 音频块追加到由同一 Gateway 网关连接拥有的提供商会话。                                                                                                                      |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                | 启动托管房间用户轮次。                                                                                                                                                                   |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                | 在过期轮次验证后结束活动轮次。                                                                                                                                                           |
  | `talk.session.cancelTurn`       | 所有 Gateway 网关拥有的会话                           | 取消某个轮次的活动捕获、提供商、智能体和 TTS 工作。                                                                                                                                       |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                              | 停止助手音频输出，不一定结束用户轮次。                                                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                              | 完成由中继发出的提供商工具调用；为中间输出传入 `options.willContinue`，或传入 `options.suppressResponse` 以在不产生另一条助手响应的情况下满足该调用。 |
  | `talk.session.steer`            | 由智能体支持的 Talk 会话                              | 向从 Talk 会话解析出的活动嵌入式运行发送口述 `status`、`steer`、`cancel` 或 `followup` 控制。                                                                                            |
  | `talk.session.close`            | 所有统一会话                                          | 停止中继会话或撤销托管房间状态，然后忘记统一会话 ID。                                                                                                                                    |

  不要为了实现这一点而在核心中引入提供商或平台特殊情况。
  核心拥有 Talk 会话语义。提供商插件拥有供应商会话设置。
  语音通话和 Google Meet 拥有电话/会议适配器。浏览器和原生
  应用拥有设备捕获/播放体验。

  ## 兼容性策略

  对于外部插件，兼容性工作按以下顺序进行：

  1. 添加新契约
  2. 通过兼容性适配器保留旧行为的接线
  3. 发出诊断或警告，点名旧路径和替代项
  4. 在测试中覆盖两条路径
  5. 记录弃用和迁移路径
  6. 仅在已公告的迁移窗口之后移除，通常在主版本发布中移除

  维护者可以使用
  `pnpm plugins:boundary-report` 审计当前迁移队列。使用 `pnpm plugins:boundary-report:summary` 获取
  紧凑计数，使用 `--owner <id>` 查看单个插件或兼容性所有者，并在 CI 门禁需要因到期
  兼容性记录、跨所有者保留 SDK 导入或未使用的保留 SDK
  子路径而失败时使用
  `pnpm plugins:boundary-report:ci`。报告会按移除日期分组已弃用的
  兼容性记录，统计本地代码/文档引用，
  暴露跨所有者保留 SDK 导入，并总结私有
  memory-host SDK 桥接，让兼容性清理保持明确，而不是
  依赖临时搜索。保留 SDK 子路径必须有已跟踪的所有者使用；
  未使用的保留辅助导出应从公共 SDK 中移除。

  如果某个清单字段仍被接受，插件作者可以继续使用它，直到
  文档和诊断说明其他要求。新代码应优先使用已记录的
  替代项，但现有插件不应在普通次版本
  发布期间中断。

  ## 如何迁移

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    内置插件应停止直接调用
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。优先使用已经
    传入活动调用路径的配置。需要当前进程快照的长生命周期处理器可以使用 `api.runtime.config.current()`。长生命周期
    智能体工具应在
    `execute` 内使用工具上下文的 `ctx.getRuntimeConfig()`，这样在配置写入前创建的工具仍能看到已刷新的
    运行时配置。

    配置写入必须通过事务性辅助函数，并选择一个
    写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方知道变更需要干净重启 Gateway 网关时，使用 `afterWrite: { mode: "restart", reason: "..." }`；只有当调用方拥有
    后续处理并且有意想要抑制重载规划器时，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    变更结果包含用于测试和日志的类型化 `followUp` 摘要；
    Gateway 网关仍负责应用或调度重启。
    在迁移窗口期间，`loadConfig` 和 `writeConfigFile` 仍作为已弃用的兼容性
    辅助函数保留给外部插件，并会使用
    `runtime-config-load-write` 兼容性代码发出一次警告。内置插件和仓库
    运行时代码受到扫描器护栏保护，这些护栏位于
    `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config`：新的生产插件用法
    会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用
    请求运行时快照，运行时渠道发送/操作/客户端辅助函数
    必须从其边界接收配置，并且长生命周期运行时模块
    不允许任何环境式 `loadConfig()` 调用。

    新插件代码还应避免导入宽泛的
    `openclaw/plugin-sdk/config-runtime` 兼容性桶。请使用与任务匹配的窄
    SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | `OpenClawConfig` 等配置类型 | `openclaw/plugin-sdk/config-contracts` |
    | 已加载配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储辅助函数 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群组策略运行时辅助函数 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试受到扫描器保护，不能使用宽泛的
    桶，因此导入和 mock 会保持局部于它们需要的行为。宽泛
    桶仍为外部兼容性存在，但新代码不应
    依赖它。

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    内置插件必须将仅限嵌入式运行器的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理器替换为
    运行时中立的中间件。

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同时更新插件清单：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    已安装插件在被显式启用并在
    `contracts.agentToolResultMiddleware` 中声明每个目标运行时时，也可以注册工具结果中间件。未声明的已安装中间件
    注册会被拒绝。

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    具备审批能力的渠道插件现在通过
    `approvalCapability.nativeRuntime` 加共享运行时上下文注册表来暴露原生审批行为。

    关键变更：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用的认证/投递从旧版 `plugin.auth` /
      `plugin.approvals` 接线迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件
      契约中移除；请将投递/native/render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留用于渠道登录/登出流程；核心不再读取其中的审批认证
      钩子
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册渠道拥有的运行时对象，例如客户端、令牌或 Bolt
      应用
    - 不要从原生审批处理器发送插件拥有的重路由通知；
      核心现在基于实际投递结果拥有“已路由到其他位置”的通知
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供
      真实的 `createPluginRuntime().channel` 表面。部分桩会被拒绝。

    参阅 `/plugins/sdk-channel-plugins` 了解当前审批能力
    布局。

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` 包装器现在会失败关闭，除非你显式传入
    `allowShellFallback: true`。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    如果你的调用方并不有意依赖 shell 回退，请不要设置
    `allowShellFallback`，而是处理抛出的错误。

  </Step>

  <Step title="Find deprecated imports">
    在你的插件中搜索来自任一已弃用表面的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    旧表面的每个导出都映射到一个具体的现代导入路径：

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于主机侧辅助函数，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    同一模式也适用于其他旧版桥接辅助函数：

    | 旧导入 | 现代等价项 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 会话存储辅助函数 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性而存在，但新代码应导入它实际需要的聚焦辅助函数表面：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助函数 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 唤醒、事件和可见性辅助函数 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列排空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全本地文件/媒体路径辅助函数 | `openclaw/plugin-sdk/file-access-runtime` |
    | 感知调度器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助函数 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解析类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令辅助函数 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助函数 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌辅助函数 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件受扫描器保护，防止使用 `infra-runtime`，因此仓库代码无法退回到宽泛的桶式导出。

  </Step>

  <Step title="Migrate channel route helpers">
    新的渠道路由代码应使用 `openclaw/plugin-sdk/channel-route`。较旧的 route-key 和 comparable-target 名称在迁移窗口期间仍作为兼容性别名保留，但新插件应使用直接描述行为的路由名称：

    | 旧辅助函数 | 现代辅助函数 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数会在原生审批、回复抑制、入站去重、cron 投递和会话路由中一致规范化 `{ channel, to, accountId, threadId }`。

    不要新增对 `ChannelMessagingAdapter.parseExplicitTarget`、由解析器支持的 loaded-route 辅助函数（`parseExplicitTargetForLoadedChannel` 或 `resolveRouteTargetForLoadedChannel`），或来自 `plugin-sdk/channel-route` 的 `resolveChannelRouteTargetWithParser(...)` 的使用。这些钩子已弃用，仅在迁移窗口期间为较旧插件保留。新的渠道插件应使用 `messaging.targetResolver.resolveTarget(...)` 进行目标 id 规范化和目录未命中回退，在核心需要提前获知对端类型时使用 `messaging.inferTargetChatType(...)`，并使用 `messaging.resolveOutboundSessionRoute(...)` 处理提供商原生会话和线程身份。

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="常用导入路径表">
  | 导入路径 | 用途 | 关键导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义/构建器的旧版总括重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | 设置翻译器、允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助工具 | `createSetupTranslator`、导入安全的设置补丁适配器、查找说明辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已弃用的设置适配器别名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 设置工具链辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账号辅助工具 | 账号列表/配置/操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账号 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账号查找辅助工具 | 账号查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄账号辅助工具 | 账号列表/账号操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入状态和来源投递接线 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和私信访问辅助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置 schema 构建器 | 共享渠道配置 schema 原语和仅通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置 schema | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地 schema |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置 schema | 仅兼容别名；对受维护的内置插件使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述裁剪、重复/冲突校验 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已弃用的兼容门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由 + 信封构建器辅助工具 |
  | `plugin-sdk/channel-inbound` | 入站接收辅助工具 | 上下文构建、格式化、根、runner、预备回复分发和分发谓词 |
  | `plugin-sdk/messaging-targets` | 已弃用的目标解析导入路径 | 将 `plugin-sdk/channel-targets` 用于通用目标解析辅助工具，将 `plugin-sdk/channel-route` 用于路由比较，并将插件自有的 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` 用于特定提供商的目标解析 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 已弃用的兼容门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 出站消息生命周期辅助工具 | 消息适配器、回执、持久发送辅助工具、实时预览/流式传输辅助工具、回复选项、生命周期辅助工具、出站身份和 payload 规划 |
  | `plugin-sdk/channel-streaming` | 已弃用的兼容门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已弃用的兼容门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体 payload 辅助工具 | 用于旧版字段布局的 Agent 媒体 payload 构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容 shim | 仅旧版渠道运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽泛运行时辅助工具 | 运行时/日志/备份/插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 窄运行时环境辅助工具 | 日志记录器/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令/钩子/http/交互式辅助工具 |
  | `plugin-sdk/hook-runtime` | 钩子流水线辅助工具 | 共享 webhook/内部钩子流水线辅助工具 |
  | `plugin-sdk/lazy-runtime` | 懒加载运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端、事件循环就绪启动辅助工具，以及渠道状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容 shim | 优先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当内置 Telegram 契约表面不可用时，提供回退稳定的 Telegram 命令校验辅助工具 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | Exec/插件审批 payload、审批能力/profile 辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批鉴权辅助工具 | 审批者解析、同一聊天操作鉴权 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助工具 | 原生 exec 审批 profile/过滤器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助工具 | 原生审批能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助工具 | 共享审批 Gateway 网关解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助工具 | 面向热路径渠道入口点的轻量原生审批适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助工具 | 更宽泛的审批处理器运行时辅助工具；当更窄的适配器/Gateway 网关接口足够时，优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助工具 | 原生审批目标/账号绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助工具 | Exec/插件审批回复 payload 辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助工具 | 通用渠道运行时上下文注册/get/watch 辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、根边界文件/路径辅助工具、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定 dispatcher、受保护 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 辅助工具 | Heartbeat 唤醒、事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全的本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 审批策略辅助工具 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装 fetch/代理辅助工具 | `resolveFetch`、代理辅助工具、EnvHttpProxyAgent 选项辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略 runner |
  | `plugin-sdk/allow-from` | 允许列表格式化和输入映射 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具，包括动态参数菜单格式化 |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook body 保护辅助工具 | 请求 body 读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、Heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄回复分发辅助工具 | 收尾、提供商分发和对话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `createChannelHistoryWindow`；已弃用的 map 辅助工具兼容导出，例如 `buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + updated-at 辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助工具 | 渠道/账号状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | Slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具负载提取 | 从工具结果对象中提取规范化负载 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助工具 | 共享临时下载路径辅助工具 |
  | `plugin-sdk/logging-core` | 日志辅助工具 | 子系统日志记录器和脱敏辅助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助工具 | Markdown 表格模式辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复负载类型 |
  | `plugin-sdk/provider-setup` | 精选本地/自托管提供商设置辅助工具 | 自托管提供商发现/配置辅助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦 OpenAI 兼容自托管提供商设置辅助工具 | 相同的自托管提供商发现/配置辅助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时凭证辅助工具 | 运行时 API-key 解析辅助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API-key 设置辅助工具 | API-key 新手引导/配置档写入辅助工具 |
  | `plugin-sdk/provider-auth-result` | 提供商凭证结果辅助工具 | 标准 OAuth 凭证结果构建器 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助工具 | 已配置或自动提供商选择，以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助工具 | 提供商凭证环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/重放辅助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助工具，以及模型 ID 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助工具 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助工具 | 通用提供商 HTTP/端点能力辅助工具，包括音频转录 multipart 表单辅助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 辅助工具 | Web-fetch 提供商注册/缓存辅助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置辅助工具 | 面向不需要插件启用接线的提供商的窄 Web 搜索配置/凭证辅助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约辅助工具 | 窄 Web 搜索配置/凭证契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及有作用域的凭证 setter/getter |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索辅助工具 | Web 搜索提供商注册/缓存/运行时辅助工具 |
  | `plugin-sdk/provider-tools` | 提供商工具/schema 兼容辅助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI schema 清理 + 诊断 |
  | `plugin-sdk/provider-usage` | 提供商用量辅助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他提供商用量辅助工具 |
  | `plugin-sdk/provider-stream` | 提供商流包装器辅助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助工具 | 原生提供商传输辅助工具，例如受保护的 fetch、传输消息转换，以及可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取/转换/存储辅助工具、基于 ffprobe 的视频尺寸探测，以及媒体负载构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助工具 | 用于图像/视频/音乐生成的共享故障转移辅助工具、候选选择和缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助工具 | 媒体理解提供商类型，以及面向提供商的图像/音频辅助导出 |
  | `plugin-sdk/text-runtime` | 已弃用的宽泛文本兼容导出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/speech` | 语音辅助工具 | 语音提供商类型，以及面向提供商的指令、注册表、验证辅助工具和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助工具 | 提供商类型、注册表辅助工具，以及共享 WebSocket 会话辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | 提供商类型、注册表/解析辅助工具、桥接会话辅助工具、共享智能体回话队列、活动运行语音控制、转录/事件健康、回声抑制、咨询问题匹配、强制咨询协调、轮次上下文跟踪、输出活动跟踪，以及快速上下文咨询辅助工具 |
  | `plugin-sdk/image-generation` | 图像生成辅助工具 | 图像生成提供商类型，以及图像资产/data URL 辅助工具和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、凭证和注册表辅助工具 |
  | `plugin-sdk/music-generation` | 音乐生成辅助工具 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助工具 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助工具 | 交互式回复负载规范化/约简 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置基元 | 窄渠道配置 schema 基元 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助工具 | 渠道配置写入授权辅助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导 | 共享渠道插件前导导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助工具 | 共享渠道状态快照/摘要辅助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助工具 | 允许列表配置编辑/读取辅助工具 |
  | `plugin-sdk/group-access` | 群组访问辅助工具 | 共享群组访问决策辅助工具 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已弃用的兼容门面 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM 防护辅助工具 | 窄预加密防护策略辅助工具 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助工具 | 被动渠道/状态和环境代理辅助基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助工具 | Webhook 目标注册表和路由安装辅助工具 |
  | `plugin-sdk/webhook-path` | 已弃用的 Webhook 路径别名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助工具 | 远程/本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | 已弃用的 Zod 兼容再导出 | 直接从 `zod` 导入 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助工具 | 记忆管理器/配置/文件/CLI 辅助表面 |
  | `plugin-sdk/memory-core-engine-runtime` | 记忆引擎运行时门面 | 记忆索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 记忆嵌入注册表 | 轻量级记忆嵌入提供商注册表辅助工具 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主 foundation 引擎 | 记忆宿主 foundation 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入引擎 | 记忆嵌入契约、注册表访问、本地提供商，以及通用批处理/远程辅助工具；具体远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎 | 记忆宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎 | 记忆宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态辅助工具 | 记忆宿主多模态辅助工具 |
  | `plugin-sdk/memory-core-host-query` | 记忆宿主查询辅助工具 | 记忆宿主查询辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | 记忆宿主密钥辅助工具 | 记忆宿主密钥辅助工具 |
  | `plugin-sdk/memory-core-host-events` | 已弃用的记忆事件别名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 记忆宿主状态辅助工具 | 记忆宿主状态辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时 | 记忆宿主 CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时 | 记忆宿主核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助工具 | 记忆宿主文件/运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | 记忆宿主核心运行时别名 | 面向厂商中立的记忆宿主核心运行时辅助工具别名 |
  | `plugin-sdk/memory-host-events` | 记忆宿主事件日志别名 | 面向厂商中立的记忆宿主事件日志辅助工具别名 |
  | `plugin-sdk/memory-host-files` | 已弃用的记忆文件/运行时别名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助工具 | 面向记忆相邻插件的共享托管 Markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 主动记忆搜索门面 | 懒加载主动记忆搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 已弃用的记忆宿主状态别名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 测试实用工具 | 仓库本地已弃用的兼容 barrel；使用聚焦的仓库本地测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只列出通用迁移子集，而不是完整的 SDK 表面。编译器入口点清单位于
`scripts/lib/plugin-sdk-entrypoints.json`；包导出会从公共子集生成。

预留的内置插件辅助接缝已从公共 SDK 导出映射中退役，但明确记录的兼容性 facade 除外，例如保留给已发布的
`@openclaw/discord@2026.3.13` 包的已弃用 `plugin-sdk/discord` shim。特定所有者的辅助函数位于所属插件包内部；共享宿主行为应通过通用 SDK 合约迁移，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

使用与任务匹配的最窄导入。如果找不到导出，请检查 `src/plugin-sdk/` 中的源代码，或询问维护者应由哪个通用合约来承载它。

## 当前弃用项

适用于插件 SDK、提供商合约、运行时表面和清单的更窄弃用项。每一项目前仍然可用，但会在未来的主版本中移除。每个条目下方都会把旧 API 映射到其规范替代项。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新（`openclaw/plugin-sdk/command-status`）**：相同签名、相同导出，只是从更窄的子路径导入。`command-auth` 会将它们重新导出为兼容性存根。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助函数 → resolveInboundMentionDecision">
    **旧**：来自 `openclaw/plugin-sdk/channel-inbound` 或 `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveInboundMentionRequirement({ facts, policy })` 和 `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，返回单个决策对象，而不是两个拆分调用。

    下游渠道插件（Slack、Discord、Matrix、MS Teams）已经切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道操作辅助函数">
    `openclaw/plugin-sdk/channel-runtime` 是面向旧版渠道插件的兼容性 shim。新代码不要导入它；请使用 `openclaw/plugin-sdk/channel-runtime-context` 来注册运行时对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助函数已随原始 "actions" 渠道导出一起弃用。请改为通过语义化 `presentation` 表面暴露能力，渠道插件声明它们渲染什么（卡片、按钮、选择器），而不是接受哪些原始操作名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() 辅助函数 → 插件上的 createTool()">
    **旧**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工厂。

    **新**：直接在提供商插件上实现 `createTool(...)`。OpenClaw 不再需要 SDK 辅助函数来注册工具包装器。

  </Accordion>

  <Accordion title="明文渠道信封 → BodyForAgent">
    **旧**：使用 `formatInboundEnvelope(...)`（以及 `ChannelMessageForAgent.channelEnvelope`）从入站渠道消息构建扁平明文提示信封。

    **新**：`BodyForAgent` 加结构化用户上下文块。渠道插件会把路由元数据（线程、主题、回复目标、回应）作为类型化字段附加，而不是把它们拼接进提示字符串。`formatAgentEnvelope(...)` 辅助函数仍支持用于合成面向助手的信封，但入站明文信封正在退出。

    受影响区域：`inbound_claim`、`message_received`，以及任何对 `channelEnvelope` 文本进行后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="deactivate 钩子 → gateway_stop">
    **旧**：`api.on("deactivate", handler)`。

    **新**：`api.on("gateway_stop", handler)`。事件和上下文是相同的关停清理合约；仅钩子名称改变。

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` 会继续作为已弃用的兼容性别名接线，直到 2026-08-16 之后。

  </Accordion>

  <Accordion title="subagent_spawning 钩子 → 核心线程绑定">
    **旧**：`api.on("subagent_spawning", handler)` 返回 `threadBindingReady` 或 `deliveryOrigin`。

    **新**：让核心通过渠道会话绑定适配器准备 `thread: true` 子智能体绑定。仅将 `api.on("subagent_spawned", handler)` 用于启动后的观察。

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、`PluginHookSubagentSpawningResult` 和 `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 仅在外部插件迁移期间继续作为已弃用的兼容性表面保留。

  </Accordion>

  <Accordion title="提供商发现类型 → 提供商目录类型">
    四个发现类型别名现在是目录时代类型之上的轻量包装：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另有旧版 `ProviderCapabilities` 静态包，提供商插件应使用显式提供商钩子，例如 `buildReplayPolicy`、`normalizeToolSchemas` 和 `wrapStreamFn`，而不是静态对象。

  </Accordion>

  <Accordion title="思考策略钩子 → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上的三个独立钩子）：`isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和 `resolveDefaultThinkingLevel(ctx)`。

    **新**：单个 `resolveThinkingProfile(ctx)`，返回 `ProviderThinkingProfile`，其中包含规范 `id`、可选 `label` 和排序后的级别列表。OpenClaw 会按配置档位自动降级过时的已存储值。

    上下文包含 `provider`、`modelId`、可选合并后的 `reasoning`，以及可选合并后的模型 `compat` 事实。提供商插件可以使用这些目录事实，仅在已配置请求合约支持时暴露模型特定配置档。

    实现一个钩子，而不是三个。旧版钩子会在弃用窗口期间继续工作，但不会与配置档结果组合。

  </Accordion>

  <Accordion title="外部认证提供商 → contracts.externalAuthProviders">
    **旧**：实现外部认证钩子，但未在插件清单中声明提供商。

    **新**：在插件清单中声明 `contracts.externalAuthProviders`，**并且**实现 `resolveExternalAuthProfiles(...)`。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供商环境变量查找 → setup.providers[].envVars">
    **旧**清单字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**：把相同的环境变量查找镜像到清单上的 `setup.providers[].envVars`。这会把设置/状态环境元数据整合到一个位置，并避免仅为回答环境变量查找而启动插件运行时。

    `providerAuthEnvVars` 会通过兼容性适配器继续受支持，直到弃用窗口关闭。

  </Accordion>

  <Accordion title="记忆插件注册 → registerMemoryCapability">
    **旧**：三个独立调用：`api.registerMemoryPromptSection(...)`、`api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新**：在记忆状态 API 上调用一次：`registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同插槽，单次注册调用。增量提示和语料库辅助函数（`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）不受影响。

  </Accordion>

  <Accordion title="记忆嵌入提供商 API">
    **旧**：`api.registerMemoryEmbeddingProvider(...)` 加 `contracts.memoryEmbeddingProviders`。

    **新**：`api.registerEmbeddingProvider(...)` 加 `contracts.embeddingProviders`。

    通用嵌入提供商合约可在记忆之外复用，并且是新提供商的受支持路径。记忆专用注册 API 会继续作为已弃用兼容性接线保留，同时现有提供商迁移。插件检查会将非内置用法报告为兼容性债务。

  </Accordion>

  <Accordion title="子智能体会话消息类型已重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，请改用 `getSessionMessages`。签名相同；旧方法会调用新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**：`runtime.tasks.flow`（单数）返回实时任务流访问器。

    **新**：`runtime.tasks.managedFlows` 为需要从流程创建、更新、取消或运行子任务的插件保留托管 TaskFlow 变更运行时。当插件只需要基于 DTO 的读取时，请使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式扩展工厂 → Agent 工具结果中间件">
    已在上方“如何迁移 → 将嵌入式工具结果扩展迁移到中间件”中涵盖。这里为完整性补充：已移除的仅用于嵌入式运行器的 `api.registerEmbeddedExtensionFactory(...)` 路径，由 `api.registerAgentToolResultMiddleware(...)` 替代，并在 `contracts.agentToolResultMiddleware` 中显式列出运行时。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是 `OpenClawConfig` 的单行别名。请优先使用规范名称。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级弃用项（位于 `extensions/` 下的内置渠道/提供商插件内部）会在它们自己的 `api.ts` 和 `runtime-api.ts` barrel 中跟踪。它们不影响第三方插件合约，也未在此列出。如果你直接使用内置插件的本地 barrel，请在升级前阅读该 barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间                   | 发生的情况                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在**                | 已弃用的接口面会发出运行时警告                               |
| **下一个主要版本** | 已弃用的接口面将被移除；仍在使用它们的插件将失败 |

所有核心插件都已迁移。外部插件应在下一个主要版本发布前迁移。

## 临时抑制这些警告

在迁移期间设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时规避手段，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) - 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) - 架构深度解析
- [Plugin Manifest](/zh-CN/plugins/manifest) - 清单架构参考
