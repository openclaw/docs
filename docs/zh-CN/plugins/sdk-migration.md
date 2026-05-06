---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在将一个插件更新到现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-05-06T02:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，采用聚焦且有文档说明的导入。如果你的插件是在新架构之前构建的，本指南可帮助你迁移。

## 变化内容

旧插件系统提供了两个完全开放的表面，让插件可以从单个入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** - 单个导入，重新导出了数十个辅助工具。它的引入是为了在构建新插件架构期间，让较旧的基于钩子的插件继续工作。
- **`openclaw/plugin-sdk/infra-runtime`** - 宽泛的运行时辅助工具桶，混合了系统事件、Heartbeat 状态、投递队列、fetch/proxy 辅助工具、文件辅助工具、审批类型和无关实用工具。
- **`openclaw/plugin-sdk/config-runtime`** - 宽泛的配置兼容性桶，在迁移窗口期间仍携带已弃用的直接加载/写入辅助工具。
- **`openclaw/extension-api`** - 一个桥接层，让插件可以直接访问主机侧辅助工具，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除的仅限 Pi 的内置扩展钩子，可观察嵌入式运行器事件，例如 `tool_result`。

宽泛的导入表面现在已**弃用**。它们在运行时仍然可用，但新插件不得使用它们，现有插件也应在下一个主要版本移除它们之前完成迁移。仅限 Pi 的嵌入式扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释已有文档说明的插件行为。破坏性契约变更必须先经过兼容性适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、清单字段、设置 API、钩子以及运行时注册行为。

<Warning>
  向后兼容层将在未来的主要版本中移除。
  仍从这些表面导入的插件届时会失效。
  仅限 Pi 的嵌入式扩展工厂注册已经不再加载。
</Warning>

## 变更原因

旧方法造成了一些问题：

- **启动缓慢** - 导入一个辅助工具会加载数十个无关模块
- **循环依赖** - 宽泛的重新导出很容易造成导入循环
- **API 表面不清晰** - 无法分辨哪些导出是稳定的，哪些是内部的

现代插件 SDK 解决了这个问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含的模块，目的明确，并有文档说明的契约。

面向内置渠道的旧版提供商便利接缝也已移除。
带渠道品牌的辅助接缝是私有单仓快捷方式，不是稳定的插件契约。请改用窄范围的通用 SDK 子路径。在内置插件工作区内，请将提供商自有辅助工具保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将 Claude 专用的流式传输辅助工具保留在自己的 `api.ts` / `contract-api.ts` 接缝中
- OpenAI 将提供商构建器、默认模型辅助工具和实时提供商构建器保留在自己的 `api.ts` 中
- OpenRouter 将提供商构建器以及新手引导/配置辅助工具保留在自己的 `api.ts` 中

## Talk 和实时语音迁移计划

实时语音、电话、会议和浏览器 Talk 代码正在从表面本地的轮次记账迁移到由 `openclaw/plugin-sdk/realtime-voice` 导出的共享 Talk 会话控制器。新控制器负责通用 Talk 事件信封、活动轮次状态、采集状态、输出音频状态、最近事件历史以及过期轮次拒绝。提供商插件应继续拥有供应商专用实时会话；表面插件应继续拥有采集、播放、电话和会议差异处理。

这次 Talk 迁移有意采用干净的破坏性变更：

1. 将共享控制器/运行时原语保留在 `plugin-sdk/realtime-voice` 中。
2. 将内置表面迁移到共享控制器：浏览器中继、托管房间交接、语音通话实时、语音通话流式 STT、Google Meet 实时以及原生按住说话。
3. 用最终的 `talk.session.*` 和 `talk.client.*` API 替换旧的 Talk RPC 系列。
4. 在 Gateway 网关 `hello-ok.features.events` 中公开一个实时 Talk 事件渠道：`talk.event`。
5. 删除旧的实时 HTTP 端点以及任何请求时指令覆盖路径。

新代码不应直接调用 `createTalkEventSequencer(...)`，除非它正在实现低层适配器或测试夹具。优先使用共享控制器，这样没有轮次 ID 就无法发出轮次范围事件，过期的 `turnEnd` / `turnCancel` 调用无法清除较新的活动轮次，并且输出音频生命周期事件可以在电话、会议、浏览器中继、托管房间交接和原生 Talk 客户端之间保持一致。

目标公共 API 形态是：

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
```

浏览器拥有的 WebRTC/提供商 WebSocket 会话使用 `talk.client.create`，因为浏览器负责提供商协商和媒体传输，而 Gateway 网关负责凭证、指令和工具策略。`talk.session.*` 是 Gateway 网关托管的通用表面，用于 gateway-relay 实时、gateway-relay 转录以及托管房间原生 STT/TTS 会话。

将实时选择器放在 `talk.provider` / `talk.providers` 旁边的旧配置应使用 `openclaw doctor --fix` 修复；运行时 Talk 不会将 speech/TTS 提供商配置重新解释为实时提供商配置。

受支持的 `talk.session.create` 组合有意保持较小范围：

| 模式            | 传输            | Brain           | 所有者             | 备注                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway 网关       | 通过 Gateway 网关桥接的全双工提供商音频；工具调用通过 agent-consult 工具路由。      |
| `transcription` | `gateway-relay` | `none`          | Gateway 网关       | 仅流式 STT；调用方发送输入音频并接收转录事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间    | 按住说话和对讲机风格的房间，其中客户端拥有采集/播放，Gateway 网关拥有轮次状态。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间    | 管理员专用房间模式，用于受信任的第一方表面直接执行 Gateway 网关工具操作。                  |

已移除的方法映射：

| 旧方法                           | 新方法                                                   |
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

| 方法                            | 适用于                                                  | 契约                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 将 base64 PCM 音频块追加到由同一 Gateway 网关连接拥有的提供商会话。 |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 启动托管房间用户轮次。                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在过期轮次验证后结束活动轮次。                                              |
| `talk.session.cancelTurn`       | 所有 Gateway 网关拥有的会话                             | 取消某个轮次的活动采集/提供商/智能体/TTS 工作。                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助手音频输出，但不一定结束用户轮次。                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成由中继发出的提供商工具调用。                                           |
| `talk.session.close`            | 所有统一会话                                            | 停止中继会话或撤销托管房间状态，然后忘记统一会话 ID。         |

不要为了实现这一点而在核心中引入提供商或平台特殊情况。
核心拥有 Talk 会话语义。提供商插件拥有供应商会话设置。
语音通话和 Google Meet 拥有电话/会议适配器。浏览器和原生应用拥有设备采集/播放 UX。

## 兼容性策略

对于外部插件，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容性适配器保持旧行为连通
3. 发出诊断或警告，指出旧路径和替代项
4. 在测试中覆盖两条路径
5. 记录弃用和迁移路径
6. 仅在已公告的迁移窗口之后移除，通常是在主要版本中

  维护者可以使用
  `pnpm plugins:boundary-report` 审计当前迁移队列。使用 `pnpm plugins:boundary-report:summary` 查看紧凑计数，使用 `--owner <id>` 查看单个插件或兼容性所有者，并在 CI gate 应因到期兼容性记录、跨所有者保留 SDK 导入或未使用的保留 SDK 子路径失败时使用
  `pnpm plugins:boundary-report:ci`。该报告按移除日期对已弃用的兼容性记录分组，统计本地代码/文档引用，暴露跨所有者保留 SDK 导入，并汇总私有 memory-host SDK bridge，确保兼容性清理保持明确，而不是依赖临时搜索。保留 SDK 子路径必须有跟踪的所有者使用情况；未使用的保留 helper 导出应从公共 SDK 中移除。

  如果某个清单字段仍被接受，插件作者可以继续使用它，直到文档和诊断另有说明。新代码应优先使用有文档说明的替代项，但现有插件不应在常规小版本发布期间中断。

  ## 如何迁移

  <Steps>
  <Step title="迁移运行时配置加载/写入 helper">
    内置插件应停止直接调用
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。优先使用已经传入活动调用路径的配置。需要当前进程快照的长生命周期处理程序可以使用 `api.runtime.config.current()`。长生命周期的 agent 工具应在
    `execute` 中使用工具上下文的 `ctx.getRuntimeConfig()`，这样在配置写入前创建的工具仍能看到刷新的运行时配置。

    配置写入必须通过事务性 helper，并选择写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方知道该变更需要干净重启 Gateway 网关时，使用 `afterWrite: { mode: "restart", reason: "..." }`；只有当调用方拥有后续处理并且有意抑制 reload planner 时，才使用
    `afterWrite: { mode: "none", reason: "..." }`。变更结果包含用于测试和日志记录的类型化 `followUp` 摘要；Gateway 网关仍负责应用或调度重启。
    `loadConfig` 和 `writeConfigFile` 在迁移窗口期间仍作为外部插件的已弃用兼容性 helper 保留，并使用
    `runtime-config-load-write` 兼容性代码发出一次警告。内置插件和仓库运行时代码受
    `pnpm check:deprecated-internal-config-api` 和
    `pnpm check:no-runtime-action-load-config` 中的扫描器 guardrails 保护：新的生产插件用法会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求运行时快照，运行时 channel send/action/client helper 必须从其边界接收配置，并且长生命周期运行时模块允许的环境 `loadConfig()` 调用数为零。

    新插件代码还应避免导入宽泛的
    `openclaw/plugin-sdk/config-runtime` 兼容性 barrel。使用与任务匹配的窄 SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | `OpenClawConfig` 等配置类型 | `openclaw/plugin-sdk/config-types` |
    | 已加载配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储 helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群组策略运行时 helper | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试受扫描器保护，不能使用宽泛 barrel，因此导入和 mock 会保持局部化，只覆盖所需行为。该宽泛 barrel 仍为外部兼容性存在，但新代码不应依赖它。

  </Step>

  <Step title="将 Pi 工具结果扩展迁移到中间件">
    内置插件必须将仅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理程序替换为运行时中立的中间件。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同时更新插件清单：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部插件不能注册工具结果中间件，因为它可以在模型看到高信任工具输出之前重写该输出。

  </Step>

  <Step title="将原生审批处理程序迁移到能力事实">
    支持审批的渠道插件现在通过
    `approvalCapability.nativeRuntime` 以及共享运行时上下文注册表暴露原生审批行为。

    关键变更：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用的认证/投递从旧版 `plugin.auth` /
      `plugin.approvals` 接线迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件合约中移除；将投递/native/render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留用于渠道登录/登出流程；core 不再读取其中的审批认证钩子
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册渠道拥有的运行时对象，例如客户端、令牌或 Bolt 应用
    - 不要从原生审批处理程序发送插件拥有的改道通知；core 现在根据实际投递结果拥有 routed-elsewhere 通知
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，提供真实的 `createPluginRuntime().channel` surface。不接受部分 stub。

    请参阅 `/plugins/sdk-channel-plugins` 了解当前审批能力布局。

  </Step>

  <Step title="审计 Windows wrapper 回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` wrapper 现在会 fail closed，除非你显式传入
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

    如果你的调用方并非有意依赖 shell 回退，请不要设置
    `allowShellFallback`，而是处理抛出的错误。

  </Step>

  <Step title="查找已弃用导入">
    在你的插件中搜索来自任一已弃用 surface 的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为聚焦导入">
    旧 surface 中的每个导出都映射到一个具体的现代导入路径：

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

    对于 host-side helper，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同一模式适用于其他旧版 bridge helper：

    | 旧导入 | 现代等价项 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 会话存储 helper | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替换宽泛 infra-runtime 导入">
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性存在，但新代码应导入实际需要的聚焦 helper surface：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列 helper | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 事件和可见性 helper | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列 drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全本地文件/媒体路径 helper | `openclaw/plugin-sdk/file-access-runtime` |
    | 感知 dispatcher 的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和 guarded fetch helper | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher 策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解决类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复 payload 和 command helper | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化 helper | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌 helper | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件受扫描器保护，不能使用 `infra-runtime`，因此仓库代码不能回退到宽泛 barrel。

  </Step>

  <Step title="迁移渠道路由 helper">
    新的渠道路由代码应使用 `openclaw/plugin-sdk/channel-route`。
    较旧的 route-key 和 comparable-target 名称在迁移窗口期间仍作为兼容性别名保留，但新插件应使用直接描述行为的 route 名称：

    | 旧 helper | 现代 helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数会在原生审批、回复抑制、入站去重、
    cron 投递和会话路由中一致地规范化 `{ channel, to, accountId, threadId }`。
    如果你的插件拥有自定义目标语法，请使用 `resolveChannelRouteTargetWithParser(...)` 将该
    解析器适配到同一路由目标契约中。

  </Step>

  <Step title="构建和测试">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="常见导入路径表">
  | 导入路径 | 用途 | 关键导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义/构建器的旧版总括再导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置架构导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | 允许列表提示、设置 Status 构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助工具 | 导入安全的设置补丁适配器、查找备注辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账号辅助工具 | 账号列表/配置/操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账号 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账号查找辅助工具 | 账号查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 精简账号辅助工具 | 账号列表/账号操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入状态和源投递接线 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和私信访问辅助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置架构构建器 | 共享渠道配置架构原语和仅通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置架构 | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地架构 |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置架构 | 仅兼容别名；对维护中的内置插件使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述裁剪、重复/冲突验证 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账号 Status 和草稿流生命周期辅助工具 | `createAccountStatusSink`、草稿预览完成辅助工具 |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由 + 信封构建器辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享记录并分发辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 出站发送依赖辅助工具 | 不导入完整出站运行时的轻量级 `resolveOutboundSendDep` 查找 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站投递、身份/发送委托、会话、格式化和载荷规划辅助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助工具 | 用于旧版字段布局的智能体媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容垫片 | 仅旧版渠道运行时实用工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽泛运行时辅助工具 | 运行时/日志/备份/插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 精简运行时环境辅助工具 | 日志记录器/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令/钩子/http/交互辅助工具 |
  | `plugin-sdk/hook-runtime` | 钩子管道辅助工具 | 共享 webhook/内部钩子管道辅助工具 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端、事件循环就绪启动辅助工具和渠道 Status 补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容垫片 | 优先使用 `config-types`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当内置 Telegram 契约表面不可用时使用的回退稳定 Telegram 命令验证辅助工具 |
  | `plugin-sdk/approval-runtime` | 批准提示辅助工具 | Exec/插件批准载荷、批准能力/配置文件辅助工具、原生批准路由/运行时辅助工具，以及结构化批准显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 批准认证辅助工具 | 批准人解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 批准客户端辅助工具 | 原生 exec 批准配置文件/过滤器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 批准投递辅助工具 | 原生批准能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 批准 Gateway 网关辅助工具 | 共享批准 Gateway 网关解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 批准适配器辅助工具 | 用于热渠道入口点的轻量级原生批准适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 批准处理程序辅助工具 | 更宽泛的批准处理程序运行时辅助工具；当更精简的适配器/Gateway 网关接口足够时优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 批准目标辅助工具 | 原生批准目标/账号绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 批准回复辅助工具 | Exec/插件批准回复载荷辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助工具 | 通用渠道运行时上下文注册/get/watch 辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、根边界文件/路径辅助工具、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定调度器、受保护 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 辅助工具 | Heartbeat 事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装 fetch/代理辅助工具 | `resolveFetch`、代理辅助工具、EnvHttpProxyAgent 选项辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具，包括动态参数菜单格式化 |
  | `plugin-sdk/command-status` | 命令 Status/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标实用工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文保护辅助工具 | 请求正文读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、Heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 精简回复分发辅助工具 | 完成、提供商分发和对话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + 更新时间辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道 Status 辅助工具 | 渠道/账号 Status 摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | Slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径助手 | 共享的临时下载路径助手 |
  | `plugin-sdk/logging-core` | 日志助手 | 子系统日志记录器和脱敏助手 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格助手 | Markdown 表格模式助手 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选本地/自托管提供商设置助手 | 自托管提供商发现/配置助手 |
  | `plugin-sdk/self-hosted-provider-setup` | 专用 OpenAI 兼容自托管提供商设置助手 | 相同的自托管提供商发现/配置助手 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证助手 | 运行时 API 密钥解析助手 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API 密钥设置助手 | API 密钥新手引导/配置文件写入助手 |
  | `plugin-sdk/provider-auth-result` | 提供商认证结果助手 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-auth-login` | 提供商交互式登录助手 | 共享的交互式登录助手 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择助手 | 已配置或自动提供商选择以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量助手 | 提供商认证环境变量查找助手 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/回放助手 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享回放策略构建器、提供商端点助手以及模型 ID 规范化助手 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录助手 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置助手 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 助手 | 通用提供商 HTTP/端点能力助手，包括音频转写 multipart 表单助手 |
  | `plugin-sdk/provider-web-fetch` | 提供商 Web 获取助手 | Web 获取提供商注册/缓存助手 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置助手 | 面向不需要插件启用接线的提供商的窄 Web 搜索配置/凭据助手 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约助手 | 窄 Web 搜索配置/凭据契约助手，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 以及带作用域的凭据设置器/获取器 |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索助手 | Web 搜索提供商注册/缓存/运行时助手 |
  | `plugin-sdk/provider-tools` | 提供商工具/架构兼容助手 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini 架构清理 + 诊断，以及 xAI 兼容助手，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供商用量助手 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage` 以及其他提供商用量助手 |
  | `plugin-sdk/provider-stream` | 提供商流包装器助手 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器助手 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输助手 | 原生提供商传输助手，例如带守卫的 fetch、传输消息转换以及可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体助手 | 媒体获取/转换/存储助手、由 ffprobe 支持的视频尺寸探测，以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成助手 | 用于图像/视频/音乐生成的共享故障转移助手、候选选择以及缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解助手 | 媒体理解提供商类型以及面向提供商的图像/音频助手导出 |
  | `plugin-sdk/text-runtime` | 共享文本助手 | 面向助手可见文本的剥离、Markdown 渲染/分块/表格助手、脱敏助手、指令标签助手、安全文本工具以及相关文本/日志助手 |
  | `plugin-sdk/text-chunking` | 文本分块助手 | 出站文本分块助手 |
  | `plugin-sdk/speech` | 语音助手 | 语音提供商类型以及面向提供商的指令、注册表、验证助手和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转写助手 | 提供商类型、注册表助手以及共享 WebSocket 会话助手 |
  | `plugin-sdk/realtime-voice` | 实时语音助手 | 提供商类型、注册表/解析助手、桥接会话助手、共享智能体回话队列、转写/事件健康状态、回声抑制以及快速上下文咨询助手 |
  | `plugin-sdk/image-generation` | 图像生成助手 | 图像生成提供商类型以及图像资源/数据 URL 助手和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和注册表助手 |
  | `plugin-sdk/music-generation` | 音乐生成助手 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移助手、提供商查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成助手 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移助手、提供商查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复助手 | 交互式回复载荷规范化/归约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置基元 | 窄渠道配置架构基元 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入助手 | 渠道配置写入授权助手 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前置导出 | 共享渠道插件前置导出 |
  | `plugin-sdk/channel-status` | 渠道状态助手 | 共享渠道状态快照/摘要助手 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置助手 | 允许列表配置编辑/读取助手 |
  | `plugin-sdk/group-access` | 群组访问助手 | 共享群组访问决策助手 |
  | `plugin-sdk/direct-dm` | 直接私信助手 | 共享直接私信认证/守卫助手 |
  | `plugin-sdk/extension-shared` | 共享插件助手 | 被动渠道/状态和环境代理助手基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目标助手 | Webhook 目标注册表和路由安装助手 |
  | `plugin-sdk/webhook-path` | Webhook 路径助手 | Webhook 路径规范化助手 |
  | `plugin-sdk/web-media` | 共享 Web 媒体助手 | 远程/本地媒体加载助手 |
  | `plugin-sdk/zod` | Zod 重新导出 | 为插件 SDK 使用者重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置记忆核心助手 | 记忆管理器/配置/文件/CLI 助手接口 |
  | `plugin-sdk/memory-core-engine-runtime` | 记忆引擎运行时门面 | 记忆索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎 | 记忆宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入引擎 | 记忆嵌入契约、注册表访问、本地提供商以及通用批处理/远程助手；具体远程提供商位于各自所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎 | 记忆宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎 | 记忆宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态助手 | 记忆宿主多模态助手 |
  | `plugin-sdk/memory-core-host-query` | 记忆宿主查询助手 | 记忆宿主查询助手 |
  | `plugin-sdk/memory-core-host-secret` | 记忆宿主密钥助手 | 记忆宿主密钥助手 |
  | `plugin-sdk/memory-core-host-events` | 记忆宿主事件日志助手 | 记忆宿主事件日志助手 |
  | `plugin-sdk/memory-core-host-status` | 记忆宿主状态助手 | 记忆宿主状态助手 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时 | 记忆宿主 CLI 运行时助手 |
  | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时 | 记忆宿主核心运行时助手 |
  | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时助手 | 记忆宿主文件/运行时助手 |
  | `plugin-sdk/memory-host-core` | 记忆宿主核心运行时别名 | 面向厂商中立的记忆宿主核心运行时助手别名 |
  | `plugin-sdk/memory-host-events` | 记忆宿主事件日志别名 | 面向厂商中立的记忆宿主事件日志助手别名 |
  | `plugin-sdk/memory-host-files` | 记忆宿主文件/运行时别名 | 面向厂商中立的记忆宿主文件/运行时助手别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 助手 | 面向记忆相邻插件的共享托管 Markdown 助手 |
  | `plugin-sdk/memory-host-search` | 主动记忆搜索门面 | 懒加载主动记忆搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 记忆宿主状态别名 | 面向厂商中立的记忆宿主状态助手别名 |
  | `plugin-sdk/testing` | 测试工具 | 旧版宽兼容性桶形导出；优先使用聚焦的测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只列出常见迁移子集，而不是完整 SDK 表面。200 多个入口点的完整列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

预留的内置插件辅助接缝已从公共 SDK 导出映射中退休，但明确记录的兼容门面除外，例如为已发布的 `@openclaw/discord@2026.3.13` 包保留的已弃用 `plugin-sdk/discord` shim。特定所有者的辅助工具位于其所属插件包内部；共享的宿主行为应通过通用 SDK 契约迁移，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

使用与任务匹配的最窄导入。如果找不到导出，请查看 `src/plugin-sdk/` 中的源码，或询问维护者应由哪个通用契约拥有它。

## 活跃弃用项

这些是适用于插件 SDK、提供商契约、运行时表面和清单的更窄弃用项。每一项现在仍可工作，但将在未来的主版本中移除。每个条目下方会把旧 API 映射到其规范替代项。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新（`openclaw/plugin-sdk/command-status`）**：相同签名、相同导出，只是从更窄的子路径导入。`command-auth` 会将它们作为兼容桩重新导出。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助工具 → resolveInboundMentionDecision">
    **旧**：来自 `openclaw/plugin-sdk/channel-inbound` 或 `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveInboundMentionRequirement({ facts, policy })` 和 `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，返回单个决策对象，而不是两个拆分调用。

    下游渠道插件（Slack、Discord、Matrix、MS Teams）已经切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道操作辅助工具">
    `openclaw/plugin-sdk/channel-runtime` 是面向旧渠道插件的兼容性 shim。不要在新代码中导入它；请使用 `openclaw/plugin-sdk/channel-runtime-context` 注册运行时对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助工具会与原始“actions”渠道导出一起弃用。改为通过语义化的 `presentation` 表面暴露能力：渠道插件声明它们会渲染什么（卡片、按钮、选择器），而不是接受哪些原始操作名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() 辅助工具 → 插件上的 createTool()">
    **旧**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工厂。

    **新**：直接在提供商插件上实现 `createTool(...)`。OpenClaw 不再需要 SDK 辅助工具来注册工具包装器。

  </Accordion>

  <Accordion title="纯文本渠道信封 → BodyForAgent">
    **旧**：使用 `formatInboundEnvelope(...)`（以及 `ChannelMessageForAgent.channelEnvelope`）从入站渠道消息构建扁平纯文本提示信封。

    **新**：`BodyForAgent` 加结构化用户上下文块。渠道插件把路由元数据（线程、主题、回复对象、反应）作为类型化字段附加，而不是把它们拼接到提示字符串中。`formatAgentEnvelope(...)` 辅助工具仍支持合成的面向助手的信封，但入站纯文本信封正在退出。

    受影响区域：`inbound_claim`、`message_received`，以及任何对 `channelEnvelope` 文本做后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="提供商发现类型 → 提供商目录类型">
    四个发现类型别名现在是目录时代类型的薄包装：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    以及旧版 `ProviderCapabilities` 静态包：提供商插件应使用明确的提供商钩子，例如 `buildReplayPolicy`、`normalizeToolSchemas` 和 `wrapStreamFn`，而不是静态对象。

  </Accordion>

  <Accordion title="思考策略钩子 → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上的三个独立钩子）：`isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和 `resolveDefaultThinkingLevel(ctx)`。

    **新**：单个 `resolveThinkingProfile(ctx)`，返回一个 `ProviderThinkingProfile`，其中包含规范 `id`、可选 `label` 和按等级排序的级别列表。OpenClaw 会自动按配置文件等级降级过期的已存储值。

    实现一个钩子，而不是三个。旧版钩子在弃用窗口期间仍可工作，但不会与配置文件结果组合。

  </Accordion>

  <Accordion title="外部 OAuth 提供商回退 → contracts.externalAuthProviders">
    **旧**：实现 `resolveExternalOAuthProfiles(...)`，但不在插件清单中声明提供商。

    **新**：在插件清单中声明 `contracts.externalAuthProviders`，**并且**实现 `resolveExternalAuthProfiles(...)`。旧的“auth fallback”路径会在运行时发出警告，并将被移除。

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

    **新**：在清单上将相同的环境变量查找镜像到 `setup.providers[].envVars`。这会把设置/状态环境元数据整合到一个位置，并避免仅为回答环境变量查找而启动插件运行时。

    `providerAuthEnvVars` 会通过兼容适配器继续受支持，直到弃用窗口关闭。

  </Accordion>

  <Accordion title="记忆插件注册 → registerMemoryCapability">
    **旧**：三个独立调用：
    `api.registerMemoryPromptSection(...)`、`api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新**：memory-state API 上的一个调用：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同槽位，单次注册调用。增量式记忆辅助工具（`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、`registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="子智能体会话消息类型已重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，改用 `getSessionMessages`。签名相同；旧方法会转调新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**：`runtime.tasks.flow`（单数）返回实时任务流访问器。

    **新**：`runtime.tasks.managedFlows` 为从流中创建、更新、取消或运行子任务的插件保留托管 TaskFlow 变更运行时。当插件只需要基于 DTO 的读取时，请使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式扩展工厂 → 智能体工具结果中间件">
    已在上文“How to migrate → Migrate Pi tool-result extensions to middleware”中介绍。此处为完整性列出：已移除的仅 Pi 路径 `api.registerEmbeddedExtensionFactory(...)` 会由 `api.registerAgentToolResultMiddleware(...)` 替代，并在 `contracts.agentToolResultMiddleware` 中提供明确的运行时列表。
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
扩展级弃用项（位于 `extensions/` 下的内置渠道/提供商插件内部）会在它们自己的 `api.ts` 和 `runtime-api.ts` barrel 中跟踪。它们不影响第三方插件契约，也未在此列出。如果你直接使用某个内置插件的本地 barrel，请在升级前阅读该 barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间                   | 会发生什么                                                              |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在**               | 已弃用表面会发出运行时警告                                              |
| **下一个主版本**       | 已弃用表面将被移除；仍在使用它们的插件会失败                            |

所有核心插件都已迁移。外部插件应在下一个主版本之前迁移。

## 临时抑制警告

在迁移期间设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时逃生通道，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) - 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) - 架构深入解析
- [插件清单](/zh-CN/plugins/manifest) - 清单架构参考
