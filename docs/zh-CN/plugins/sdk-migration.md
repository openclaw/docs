---
read_when:
    - 你看到 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告
    - 你会看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在将一个插件更新到现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-07-04T10:28:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，并提供聚焦且有文档说明的导入路径。如果你的插件是在新架构之前构建的，本指南会帮助你迁移。

## 正在变化的内容

旧插件系统提供了两个完全开放的表面，允许插件从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** - 一个单一导入，会重新导出数十个辅助工具。它的引入是为了在新插件架构构建期间，让较旧的基于钩子的插件继续工作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一个宽泛的运行时辅助 barrel，混合了系统事件、Heartbeat 状态、投递队列、fetch/代理辅助工具、文件辅助工具、审批类型和无关实用工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一个宽泛的配置兼容性 barrel，在迁移窗口期间仍携带已弃用的直接加载/写入辅助工具。
- **`openclaw/extension-api`** - 一个桥接层，让插件能够直接访问宿主侧辅助工具，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 一个已移除的仅限嵌入式运行器的内置插件钩子，可观察嵌入式运行器事件，例如 `tool_result`。

这些宽泛的导入表面现在已**弃用**。它们在运行时仍然可用，但新插件不得使用它们，现有插件也应在下一个主版本移除它们之前完成迁移。仅限嵌入式运行器的插件工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一项变更中移除或重新解释有文档说明的插件行为。破坏性契约变更必须先经过兼容性适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、清单字段、设置 API、钩子和运行时注册行为。

<Warning>
  向后兼容层将在未来的主版本中移除。届时仍从这些表面导入的插件将会中断。旧版嵌入式插件工厂注册已经不再加载。
</Warning>

## 为什么做出此变更

旧方法导致了以下问题：

- **启动缓慢** - 导入一个辅助工具会加载数十个无关模块
- **循环依赖** - 宽泛的重新导出很容易产生导入循环
- **API 表面不清晰** - 无法判断哪些导出是稳定的，哪些是内部的

现代插件 SDK 解决了这一点：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含的模块，具有明确用途和有文档说明的契约。

面向内置渠道的旧版提供商便利接缝也已经移除。带有渠道品牌的辅助接缝是私有单仓库快捷方式，不是稳定的插件契约。请改用窄范围的通用 SDK 子路径。在内置插件工作区内，将提供商拥有的辅助工具保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将特定于 Claude 的流辅助工具保留在自己的 `api.ts` / `contract-api.ts` 接缝中
- OpenAI 将提供商构建器、默认模型辅助工具和实时提供商构建器保留在自己的 `api.ts` 中
- OpenRouter 将提供商构建器和新手引导/配置辅助工具保留在自己的 `api.ts` 中

## Talk 和实时语音迁移计划

实时语音、电话、会议和浏览器 Talk 代码正在从表面本地的轮次记账迁移到由 `openclaw/plugin-sdk/realtime-voice` 导出的共享 Talk 会话控制器。新的控制器负责通用 Talk 事件信封、活跃轮次状态、采集状态、输出音频状态、近期事件历史和过期轮次拒绝。提供商插件应继续拥有特定厂商的实时会话；表面插件应继续拥有采集、播放、电话和会议的特殊处理。

这次 Talk 迁移有意采用破坏式清理：

1. 将共享控制器/运行时原语保留在 `plugin-sdk/realtime-voice` 中。
2. 将内置表面迁移到共享控制器：浏览器中继、托管房间交接、语音通话实时、语音通话流式 STT、Google Meet 实时，以及原生按键通话。
3. 将旧 Talk RPC 族替换为最终的 `talk.session.*` 和 `talk.client.*` API。
4. 在 Gateway 网关 `hello-ok.features.events` 中公布一个实时 Talk 事件渠道：`talk.event`。
5. 删除旧的实时 HTTP 端点以及任何请求时指令覆盖路径。

新代码不应直接调用 `createTalkEventSequencer(...)`，除非它正在实现低层适配器或测试夹具。请优先使用共享控制器，这样没有轮次 ID 就无法发出轮次作用域事件，过期的 `turnEnd` / `turnCancel` 调用无法清除较新的活跃轮次，并且输出音频生命周期事件能在电话、会议、浏览器中继、托管房间交接和原生 Talk 客户端之间保持一致。

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

浏览器拥有的 WebRTC/提供商 websocket 会话使用 `talk.client.create`，因为浏览器负责提供商协商和媒体传输，而 Gateway 网关负责凭证、指令和工具策略。`talk.session.*` 是 Gateway 网关托管的通用表面，用于 gateway-relay 实时、gateway-relay 转录和托管房间原生 STT/TTS 会话。

如果旧版配置将实时选择器放在 `talk.provider` / `talk.providers` 旁边，应使用 `openclaw doctor --fix` 进行修复；运行时 Talk 不会将语音/TTS 提供商配置重新解释为实时提供商配置。

支持的 `talk.session.create` 组合有意保持精简：

| 模式            | 传输            | 大脑            | 所有者             | 说明                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway 网关       | 通过 Gateway 网关桥接的全双工提供商音频；工具调用通过 agent-consult 工具路由。                                    |
| `transcription` | `gateway-relay` | `none`          | Gateway 网关       | 仅流式 STT；调用方发送输入音频并接收转录事件。                                                                    |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间    | 按键通话和对讲机风格房间，客户端负责采集/播放，Gateway 网关负责轮次状态。                                         |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间    | 仅限管理员的房间模式，适用于可信的第一方表面，可直接执行 Gateway 网关工具操作。                                   |

已移除方法映射：

| 旧                               | 新                                                       |
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

  | 方法                            | 适用于                                                  | 契约                                                                                                                                                                                     |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 将 base64 PCM 音频块追加到同一 Gateway 网关连接拥有的提供商会话。                                                                                                                        |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 启动 managed-room 用户轮次。                                                                                                                                                            |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在陈旧轮次验证后结束当前轮次。                                                                                                                                                          |
  | `talk.session.cancelTurn`       | 所有 Gateway 网关拥有的会话                             | 取消某个轮次的当前采集、提供商、智能体和 TTS 工作。                                                                                                                                      |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助手音频输出，但不一定结束用户轮次。                                                                                                                                                |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成中继发出的提供商工具调用；传入 `options.willContinue` 表示临时输出，或传入 `options.suppressResponse` 以在不产生另一条助手响应的情况下满足该调用。                                  |
  | `talk.session.steer`            | 由智能体支持的 Talk 会话                                | 将语音 `status`、`steer`、`cancel` 或 `followup` 控制发送到从 Talk 会话解析出的当前嵌入式运行。                                                                                          |
  | `talk.session.close`            | 所有统一会话                                            | 停止中继会话或撤销 managed-room 状态，然后忘记统一会话 ID。                                                                                                                             |

  不要在核心中引入提供商或平台特例来实现这一点。
  核心拥有 Talk 会话语义。提供商插件拥有供应商会话设置。
  语音通话和 Google Meet 拥有电话/会议适配器。浏览器和原生
  应用拥有设备采集/播放 UX。

  ## 兼容性策略

  对于外部插件，兼容性工作遵循以下顺序：

  1. 添加新契约
  2. 通过兼容性适配器保持旧行为接线
  3. 发出诊断或警告，指出旧路径和替代项
  4. 在测试中覆盖两条路径
  5. 记录弃用和迁移路径
  6. 仅在已宣布的迁移窗口之后移除，通常是在主版本发布中

  维护者可以使用
  `pnpm plugins:boundary-report` 审计当前迁移队列。使用 `pnpm plugins:boundary-report:summary` 获取
  紧凑计数，使用 `--owner <id>` 查看一个插件或兼容性所有者，并在 CI 门禁需要因到期的
  兼容性记录、跨所有者保留 SDK 导入或未使用的保留 SDK
  子路径而失败时使用 `pnpm plugins:boundary-report:ci`。该报告按移除日期对已弃用的
  兼容性记录分组，统计本地代码/文档引用，呈现跨所有者保留 SDK 导入，并汇总私有
  memory-host SDK 桥接，使兼容性清理保持显式，而不是
  依赖临时搜索。保留 SDK 子路径必须有已跟踪的所有者使用情况；
  未使用的保留 helper 导出应从公共 SDK 中移除。

  如果清单字段仍被接受，插件作者可以继续使用它，直到
  文档和诊断另有说明。新代码应优先使用有文档记录的
  替代项，但现有插件不应在普通次版本
  发布期间中断。

  ## 如何迁移

  <Steps>
  <Step title="迁移运行时配置加载/写入 helper">
    内置插件应停止直接调用
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。优先使用已经
    传入当前调用路径的配置。需要当前进程快照的长生命周期处理程序
    可以使用 `api.runtime.config.current()`。长生命周期
    智能体工具应在 `execute` 内使用工具上下文的 `ctx.getRuntimeConfig()`，
    这样在配置写入前创建的工具仍能看到刷新的
    运行时配置。

    配置写入必须通过事务型 helper，并选择
    写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方知道更改需要干净的 Gateway 网关重启时，使用
    `afterWrite: { mode: "restart", reason: "..." }`；只有在调用方拥有
    后续处理并且有意想要抑制重载规划器时，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    变更结果包含一个类型化的 `followUp` 摘要，用于测试和日志；
    Gateway 网关仍负责应用或调度重启。
    `loadConfig` 和 `writeConfigFile` 在迁移窗口期间仍作为外部插件的已弃用兼容性
    helper 保留，并使用
    `runtime-config-load-write` 兼容性代码警告一次。内置插件和仓库
    运行时代码受
    `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config` 中的扫描器护栏保护：新的生产插件用法
    会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用
    请求运行时快照，运行时频道发送/操作/客户端 helper
    必须从其边界接收配置，并且长生命周期运行时模块
    不允许任何环境式 `loadConfig()` 调用。

    新插件代码还应避免导入宽泛的
    `openclaw/plugin-sdk/config-runtime` 兼容性 barrel。使用与任务匹配的窄
    SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | `OpenClawConfig` 等配置类型 | `openclaw/plugin-sdk/config-contracts` |
    | 已加载配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储 helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群组策略运行时 helper | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret 输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试受扫描器保护，不允许使用宽泛
    barrel，因此导入和 mock 会保持局限于它们需要的行为。宽泛
    barrel 仍为外部兼容性存在，但新代码不应
    依赖它。

  </Step>

  <Step title="将嵌入式工具结果扩展迁移到中间件">
    内置插件必须将仅限嵌入式运行器的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理程序替换为
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

    已安装的插件也可以在显式启用并在
    `contracts.agentToolResultMiddleware` 中声明每个目标运行时时注册工具结果中间件。
    未声明的已安装中间件注册会被拒绝。

  </Step>

  <Step title="将原生审批处理程序迁移到能力事实">
    具备审批能力的频道插件现在通过
    `approvalCapability.nativeRuntime` 以及共享运行时上下文注册表暴露原生审批行为。

    关键变化：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用 auth/delivery 从旧版 `plugin.auth` /
      `plugin.approvals` 接线迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共频道插件
      契约中移除；将 delivery/native/render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留用于频道登录/登出流程；核心不再读取其中的审批 auth
      钩子
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册频道拥有的运行时对象，
      例如客户端、令牌或 Bolt
      应用
    - 不要从原生审批处理程序发送插件拥有的重路由通知；
      核心现在根据实际递送结果拥有“已路由到其他位置”的通知
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，提供真实的
      `createPluginRuntime().channel` 表面。不接受部分 stub。

    请参阅 `/plugins/sdk-channel-plugins` 了解当前审批能力
    布局。

  </Step>

  <Step title="审计 Windows 包装器回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` 包装器现在会 fail closed，除非你显式传入
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

  <Step title="查找已弃用的导入">
    在你的插件中搜索来自任一已弃用表面的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为聚焦的导入">
    旧表面的每个导出都映射到特定的现代导入路径：

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

    对于主机端 helper，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    同一模式也适用于其他旧版 bridge 辅助函数：

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
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性而存在，但新代码应导入它实际需要的聚焦辅助能力面：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助函数 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 唤醒、事件和可见性辅助函数 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列排空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存中和持久化后端的去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全本地文件/媒体路径辅助函数 | `openclaw/plugin-sdk/file-access-runtime` |
    | 感知 dispatcher 的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助函数 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher 策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解析类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令辅助函数 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助函数 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全 token 辅助函数 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件已通过扫描器防护，禁止使用 `infra-runtime`，因此仓库代码不能回退到这个宽泛 barrel。

  </Step>

  <Step title="Migrate channel route helpers">
    新的渠道路由代码应使用 `openclaw/plugin-sdk/channel-route`。
    旧的 route-key 和 comparable-target 名称在迁移窗口期间仍作为兼容性别名保留，但新插件应使用能直接描述行为的路由名称：

    | 旧辅助函数 | 现代辅助函数 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数会在原生审批、回复抑制、入站去重、cron 投递和会话路由中一致地规范化 `{ channel, to, accountId, threadId }`。

    不要新增对 `ChannelMessagingAdapter.parseExplicitTarget`、基于解析器的 loaded-route 辅助函数（`parseExplicitTargetForLoadedChannel` 或 `resolveRouteTargetForLoadedChannel`），或来自 `plugin-sdk/channel-route` 的 `resolveChannelRouteTargetWithParser(...)` 的使用。
    这些钩子已弃用，仅在迁移窗口期间为较旧插件保留。新的渠道插件应使用 `messaging.targetResolver.resolveTarget(...)` 进行目标 id 规范化和目录未命中回退；当核心需要早期 peer kind 时使用 `messaging.inferTargetChatType(...)`；并使用 `messaging.resolveOutboundSessionRoute(...)` 处理提供商原生会话和线程身份。

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="Common import path table">
  | 导入路径 | 用途 | 关键导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助函数 | `definePluginEntry` |
  | `plugin-sdk/core` | 面向渠道入口定义/构建器的旧版总括重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置架构导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助函数 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助函数 | 设置转换器、允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置阶段运行时辅助函数 | `createSetupTranslator`、导入安全的设置补丁适配器、查找备注辅助函数、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已弃用的设置适配器别名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 设置工具辅助函数 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助函数 | 账户列表/配置/操作门控辅助函数 |
  | `plugin-sdk/account-id` | 账户 ID 辅助函数 | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助函数 | 账户查找 + 默认回退辅助函数 |
  | `plugin-sdk/account-helpers` | 精简账户辅助函数 | 账户列表/账户操作辅助函数 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对基元 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入状态和来源投递接线 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和私信访问辅助函数 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置架构构建器 | 仅共享渠道配置架构基元和通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置架构 | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地架构 |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置架构 | 仅兼容性别名；对维护中的内置插件使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助函数 | 命令名规范化、描述裁剪、重复/冲突校验 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助函数 | 共享路由 + 信封构建器辅助函数 |
  | `plugin-sdk/channel-inbound` | 入站接收辅助函数 | 上下文构建、格式化、根、运行器、预备回复分发和分发谓词 |
  | `plugin-sdk/messaging-targets` | 已弃用的目标解析导入路径 | 对通用目标解析辅助函数使用 `plugin-sdk/channel-targets`，对路由比较使用 `plugin-sdk/channel-route`，对提供商特定目标解析使用插件拥有的 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` |
  | `plugin-sdk/outbound-media` | 出站媒体辅助函数 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 出站消息生命周期辅助函数 | 消息适配器、回执、持久发送辅助函数、实时预览/流式传输辅助函数、回复选项、生命周期辅助函数、出站身份和载荷规划 |
  | `plugin-sdk/channel-streaming` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助函数 | 线程绑定生命周期和适配器辅助函数 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助函数 | 面向旧版字段布局的 Agent 媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅限旧版渠道运行时实用工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽泛运行时辅助函数 | 运行时/日志/备份/插件安装辅助函数 |
  | `plugin-sdk/runtime-env` | 精简运行时环境辅助函数 | 日志器/运行时环境、超时、重试和退避辅助函数 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助函数 | 插件命令/钩子/http/交互式辅助函数 |
  | `plugin-sdk/hook-runtime` | 钩子流水线辅助函数 | 共享 webhook/内部钩子流水线辅助函数 |
  | `plugin-sdk/lazy-runtime` | 懒加载运行时辅助函数 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助函数 | 共享 exec 辅助函数 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助函数 | 命令格式化、等待、版本辅助函数 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助函数 | Gateway 网关客户端、事件循环就绪的启动辅助函数、公告的 LAN 主机解析和渠道状态补丁辅助函数 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性垫片 | 优先使用 `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助函数 | 当内置 Telegram 合约表面不可用时使用的回退稳定 Telegram 命令校验辅助函数 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助函数 | Exec/插件审批载荷、审批能力/配置档辅助函数、原生审批路由/运行时辅助函数，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助函数 | 审批者解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助函数 | 原生 Exec 审批配置档/过滤器辅助函数 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助函数 | 原生审批能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助函数 | 共享审批 Gateway 网关解析辅助函数 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助函数 | 面向热渠道入口点的轻量原生审批适配器加载辅助函数 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助函数 | 更宽泛的审批处理器运行时辅助函数；当更窄的适配器/Gateway 网关接缝足够时优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助函数 | 原生审批目标/账户绑定辅助函数 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助函数 | Exec/插件审批回复载荷辅助函数 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助函数 | 通用渠道运行时上下文注册/get/watch 辅助函数 |
  | `plugin-sdk/security-runtime` | 安全辅助函数 | 共享信任、私信门控、根边界文件/路径辅助函数、外部内容和密钥收集辅助函数 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助函数 | 主机允许列表和私有网络策略辅助函数 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助函数 | 固定 dispatcher、受保护 fetch、SSRF 策略辅助函数 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助函数 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 辅助函数 | Heartbeat 唤醒、事件和可见性辅助函数 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助函数 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助函数 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助函数 | 内存中和持久后端去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助函数 | 安全本地文件/媒体路径辅助函数 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助函数 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 审批策略辅助函数 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助函数 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助函数 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助函数 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助函数 |
  | `plugin-sdk/fetch-runtime` | 包装的 fetch/proxy 辅助函数 | `resolveFetch`、proxy 辅助函数、EnvHttpProxyAgent 选项辅助函数 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助函数 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助函数 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化和输入映射 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助函数 | `resolveControlCommandGate`、发送者授权辅助函数、命令注册表辅助函数，包括动态参数菜单格式化 |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助函数 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助函数 | Webhook 目标实用工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文保护辅助函数 | 请求正文读取/限制辅助函数 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、Heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 精简回复分发辅助函数 | 完成、提供商分发和会话标签辅助函数 |
  | `plugin-sdk/reply-history` | 回复历史辅助函数 | `createChannelHistoryWindow`；已弃用的映射辅助函数兼容性导出，例如 `buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助函数 | 文本/Markdown 分块辅助函数 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助函数 | 存储路径 + 更新时间辅助函数 |
  | `plugin-sdk/state-paths` | 状态路径辅助函数 | 状态和 OAuth 目录辅助函数 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助工具 | 渠道/账号状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | Slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 常用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助工具 | 共享临时下载路径辅助工具 |
  | `plugin-sdk/logging-core` | 日志辅助工具 | 子系统日志记录器和脱敏辅助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助工具 | Markdown 表格模式辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选本地/自托管提供商设置辅助工具 | 自托管提供商设备发现/配置辅助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 兼容自托管提供商设置辅助工具 | 相同的自托管提供商设备发现/配置辅助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时凭证辅助工具 | 运行时 API-key 解析辅助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API-key 设置辅助工具 | API-key 新手引导/资料写入辅助工具 |
  | `plugin-sdk/provider-auth-result` | 提供商凭证结果辅助工具 | 标准 OAuth 凭证结果构建器 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助工具 | 已配置或自动提供商选择与原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助工具 | 提供商凭证环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/重放辅助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助工具，以及模型 ID 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助工具 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助工具 | 通用提供商 HTTP/端点能力辅助工具，包括音频转录 multipart 表单辅助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 辅助工具 | Web-fetch 提供商注册/缓存辅助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置辅助工具 | 面向不需要插件启用接线的提供商的窄 Web 搜索配置/凭证辅助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约辅助工具 | 窄 Web 搜索配置/凭证契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及带作用域的凭证设置器/获取器 |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索辅助工具 | Web 搜索提供商注册/缓存/运行时辅助工具 |
  | `plugin-sdk/provider-tools` | 提供商工具/架构兼容辅助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 架构清理 + 诊断 |
  | `plugin-sdk/provider-usage` | 提供商用量辅助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他提供商用量辅助工具 |
  | `plugin-sdk/provider-stream` | 提供商流包装器辅助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助工具 | 原生提供商传输辅助工具，例如受保护的 fetch、工具结果文本提取、传输消息转换，以及可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取/转换/存储辅助工具、基于 ffprobe 的视频尺寸探测，以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助工具 | 图像/视频/音乐生成的共享故障转移辅助工具、候选选择和缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助工具 | 媒体理解提供商类型，以及面向提供商的图像/音频辅助工具导出 |
  | `plugin-sdk/text-runtime` | 废弃的宽泛文本兼容导出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/speech` | 语音辅助工具 | 语音提供商类型，以及面向提供商的指令、注册表、验证辅助工具和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助工具 | 提供商类型、注册表辅助工具，以及共享 WebSocket 会话辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | 提供商类型、注册表/解析辅助工具、桥接会话辅助工具、共享 Agent 回话队列、活动运行语音控制、转录/事件健康、回声抑制、咨询问题匹配、强制咨询协调、轮次上下文跟踪、输出活动跟踪，以及快速上下文咨询辅助工具 |
  | `plugin-sdk/image-generation` | 图像生成辅助工具 | 图像生成提供商类型，以及图像资产/数据 URL 辅助工具和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、凭证和注册表辅助工具 |
  | `plugin-sdk/music-generation` | 音乐生成辅助工具 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助工具 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助工具 | 交互式回复载荷规范化/归约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 窄渠道配置架构原语 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助工具 | 渠道配置写入授权辅助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前置导出 | 共享渠道插件前置导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助工具 | 共享渠道状态快照/摘要辅助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助工具 | 允许列表配置编辑/读取辅助工具 |
  | `plugin-sdk/group-access` | 群组访问辅助工具 | 共享群组访问决策辅助工具 |
  | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 废弃的兼容门面 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | 直接私信保护辅助工具 | 窄加密前保护策略辅助工具 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助工具 | 被动渠道/状态和环境代理辅助原语 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助工具 | Webhook 目标注册表和路由安装辅助工具 |
  | `plugin-sdk/webhook-path` | 废弃的 Webhook 路径别名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助工具 | 远程/本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | 废弃的 Zod 兼容重新导出 | 直接从 `zod` 导入 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助工具 | 记忆管理器/配置/文件/CLI 辅助工具表面 |
  | `plugin-sdk/memory-core-engine-runtime` | 记忆引擎运行时门面 | 记忆索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 记忆嵌入注册表 | 轻量级记忆嵌入提供商注册表辅助工具 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 记忆主机基础引擎 | 记忆主机基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆主机嵌入引擎 | 记忆嵌入契约、注册表访问、本地提供商，以及通用批处理/远程辅助工具；具体远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 记忆主机 QMD 引擎 | 记忆主机 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 记忆主机存储引擎 | 记忆主机存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 记忆主机多模态辅助工具 | 记忆主机多模态辅助工具 |
  | `plugin-sdk/memory-core-host-query` | 记忆主机查询辅助工具 | 记忆主机查询辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | 记忆主机密钥辅助工具 | 记忆主机密钥辅助工具 |
  | `plugin-sdk/memory-core-host-events` | 废弃的记忆事件别名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 记忆主机状态辅助工具 | 记忆主机状态辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 记忆主机 CLI 运行时 | 记忆主机 CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 记忆主机核心运行时 | 记忆主机核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 记忆主机文件/运行时辅助工具 | 记忆主机文件/运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | 记忆主机核心运行时别名 | 面向供应商中立的记忆主机核心运行时辅助工具别名 |
  | `plugin-sdk/memory-host-events` | 记忆主机事件日志别名 | 面向供应商中立的记忆主机事件日志辅助工具别名 |
  | `plugin-sdk/memory-host-files` | 废弃的记忆文件/运行时别名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助工具 | 面向记忆相邻插件的共享托管 Markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 主动记忆搜索门面 | 延迟加载的主动记忆搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 废弃的记忆主机状态别名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 测试实用工具 | 仓库本地废弃兼容桶导出；使用聚焦的仓库本地测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只列出通用迁移子集，而不是完整 SDK
表面。编译器入口点清单位于
`scripts/lib/plugin-sdk-entrypoints.json`；包导出由
公共子集生成。

预留的内置插件辅助接缝已从公共 SDK
导出映射中移除，但明确记录的兼容性门面除外，例如为已发布的
`@openclaw/discord@2026.3.13` 包保留的已弃用
`plugin-sdk/discord` shim。所有者专用辅助函数位于
所属插件包内部；共享宿主行为应通过通用 SDK
契约迁移，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用与任务匹配的最窄导入。如果找不到导出，
请检查 `src/plugin-sdk/` 中的源代码，或询问维护者应由哪个通用契约
拥有它。

## 活跃弃用项

适用于插件 SDK、提供商契约、运行时表面和清单的更窄弃用项。
每一项目前仍可工作，但会在未来的主要版本中移除。每个条目下方
都会把旧 API 映射到它的规范替代项。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新（`openclaw/plugin-sdk/command-status`）**：相同签名、相同
    导出，只是从更窄的子路径导入。`command-auth`
    会将它们重新导出为兼容性存根。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助函数 → resolveInboundMentionDecision">
    **旧**：来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，返回一个
    单一决策对象，而不是两个拆分调用。

    下游渠道插件（Slack、Discord、Matrix、MS Teams）已经
    完成切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道操作辅助函数">
    `openclaw/plugin-sdk/channel-runtime` 是面向旧版
    渠道插件的兼容性 shim。新代码不要导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 来注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*`
    辅助函数会与原始 “actions” 渠道导出一同弃用。请改为通过语义化的
    `presentation` 表面暴露能力：渠道插件声明它们渲染什么
    （卡片、按钮、选择器），而不是声明它们接受哪些原始
    操作名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() 辅助函数 → 插件上的 createTool()">
    **旧**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工厂。

    **新**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK 辅助函数来注册工具包装器。

  </Accordion>

  <Accordion title="纯文本渠道信封 → BodyForAgent">
    **旧**：使用 `formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`）从入站渠道消息构建扁平的纯文本提示
    信封。

    **新**：`BodyForAgent` 加结构化用户上下文块。渠道
    插件把路由元数据（线程、主题、回复目标、回应）附加为
    类型化字段，而不是拼接进提示字符串。`formatAgentEnvelope(...)`
    辅助函数仍支持合成的面向助手信封，但入站纯文本信封正在
    退出。

    受影响区域：`inbound_claim`、`message_received`，以及任何对
    `channelEnvelope` 文本做后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="deactivate 钩子 → gateway_stop">
    **旧**：`api.on("deactivate", handler)`。

    **新**：`api.on("gateway_stop", handler)`。事件和上下文是相同的
    关停清理契约；只有钩子名称改变。

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

    `deactivate` 会继续作为已弃用的兼容性别名连接到
    2026-08-16 之后。

  </Accordion>

  <Accordion title="subagent_spawning 钩子 → 核心线程绑定">
    **旧**：`api.on("subagent_spawning", handler)` 返回
    `threadBindingReady` 或 `deliveryOrigin`。

    **新**：让核心通过渠道会话绑定适配器准备 `thread: true`
    子智能体绑定。仅将 `api.on("subagent_spawned", handler)`
    用于启动后的观察。

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

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 和
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 仅在外部插件迁移期间
    作为已弃用的兼容性表面保留。

  </Accordion>

  <Accordion title="提供商发现类型 → 提供商目录类型">
    四个发现类型别名现在是目录时代类型之上的薄包装：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另外还有旧版 `ProviderCapabilities` 静态包：提供商插件
    应使用明确的提供商钩子，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是静态对象。

  </Accordion>

  <Accordion title="思考策略钩子 → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上的三个独立钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新**：单个 `resolveThinkingProfile(ctx)`，返回一个
    `ProviderThinkingProfile`，其中包含规范 `id`、可选 `label` 和
    排序后的级别列表。OpenClaw 会按配置文件排名自动降级过时的已存储值。

    上下文包含 `provider`、`modelId`、可选的合并后 `reasoning`，
    以及可选的合并后模型 `compat` 事实。提供商插件可以使用这些
    目录事实，只在已配置请求契约支持时暴露特定于模型的配置文件。

    实现一个钩子，而不是三个。旧版钩子会在弃用窗口期间继续工作，
    但不会与配置文件结果组合。

  </Accordion>

  <Accordion title="外部认证提供商 → contracts.externalAuthProviders">
    **旧**：实现外部认证钩子，但不在插件清单中声明提供商。

    **新**：在插件清单中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。

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

    **新**：在清单的 `setup.providers[].envVars` 中镜像相同的环境变量查找。
    这会把设置/状态环境元数据整合到一个位置，并避免仅为回答环境变量
    查找而启动插件运行时。

    `providerAuthEnvVars` 会通过兼容性适配器继续受到支持，
    直到弃用窗口关闭。

  </Accordion>

  <Accordion title="记忆插件注册 → registerMemoryCapability">
    **旧**：三个独立调用：
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**：在记忆状态 API 上一次调用：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同槽位，单次注册调用。增量提示和语料辅助函数
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）
    不受影响。

  </Accordion>

  <Accordion title="记忆嵌入提供商 API">
    **旧**：`api.registerMemoryEmbeddingProvider(...)` 加
    `contracts.memoryEmbeddingProviders`。

    **新**：`api.registerEmbeddingProvider(...)` 加
    `contracts.embeddingProviders`。

    通用嵌入提供商契约可在记忆之外复用，并且是新提供商支持的路径。
    记忆专用注册 API 会继续作为已弃用的兼容性连接保留，同时现有提供商
    进行迁移。插件检查会将非内置用法报告为兼容性债务。

  </Accordion>

  <Accordion title="子智能体会话消息类型重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，替代项是
    `getSessionMessages`。签名相同；旧方法会调用到新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**：`runtime.tasks.flow`（单数）返回实时任务流访问器。

    **新**：`runtime.tasks.managedFlows` 为会从流程中创建、更新、取消或运行子任务的
    插件保留托管 TaskFlow 变更运行时。当插件只需要基于 DTO 的读取时，
    请使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式扩展工厂 → 智能体工具结果中间件">
    已在上文“如何迁移 → 将嵌入式工具结果扩展迁移到中间件”中涵盖。
    为完整性在此列出：已移除的仅限嵌入式运行器的
    `api.registerEmbeddedExtensionFactory(...)` 路径由
    `api.registerAgentToolResultMiddleware(...)` 替代，并在
    `contracts.agentToolResultMiddleware` 中提供明确的运行时列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是
    `OpenClawConfig` 的单行别名。请优先使用规范名称。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级弃用项（位于 `extensions/` 下的内置渠道/提供商插件内部）
会在它们自己的 `api.ts` 和 `runtime-api.ts` barrel 中跟踪。
它们不会影响第三方插件契约，因此不会在此列出。如果你直接使用
内置插件的本地 barrel，请在升级前阅读该 barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间                   | 会发生什么                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在**                | 已弃用的表面会发出运行时警告                               |
| **下一个主要版本** | 已弃用的表面将被移除；仍在使用它们的插件将失败 |

所有核心插件都已经迁移。外部插件应在下一个主要版本之前迁移。

## 临时抑制警告

在迁移期间设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是一个临时逃生口，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) - 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) - 架构深度解析
- [Plugin Manifest](/zh-CN/plugins/manifest) - 清单架构参考
