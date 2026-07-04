---
read_when:
    - 你需要从插件调用核心辅助函数（TTS、STT、图像生成、Web 搜索、子智能体、节点）
    - 你想了解 `api.runtime` 暴露了什么
    - 你正在从插件代码访问配置、智能体或媒体辅助函数
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供插件使用的注入式运行时辅助工具
title: 插件运行时辅助工具
x-i18n:
    generated_at: "2026-07-04T20:24:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

OpenClaw 在注册期间注入到每个插件中的 `api.runtime` 对象参考。请使用这些辅助函数，而不是直接导入宿主内部实现。

<CardGroup cols={2}>
  <Card title="渠道插件" href="/zh-CN/plugins/sdk-channel-plugins">
    分步指南，在渠道插件的上下文中使用这些辅助函数。
  </Card>
  <Card title="提供商插件" href="/zh-CN/plugins/sdk-provider-plugins">
    分步指南，在提供商插件的上下文中使用这些辅助函数。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 配置加载和写入

优先使用已经传入当前调用路径的配置，例如注册期间的 `api.config`，或渠道/提供商回调中的 `cfg` 参数。这会让一个进程快照贯穿整个工作流，而不是在热路径上重新解析配置。

仅当长生命周期处理程序需要当前进程快照，并且没有配置传入该函数时，才使用 `api.runtime.config.current()`。返回值是只读的；编辑前请克隆，或使用变更辅助函数。

工具工厂会收到 `ctx.runtimeConfig` 和 `ctx.getRuntimeConfig()`。当配置可能在工具定义创建后发生变化时，请在长生命周期工具的 `execute` 回调中使用该 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化更改。每次写入都必须选择一个显式的 `afterWrite` 策略：

- `afterWrite: { mode: "auto" }` 让 Gateway 网关重载规划器决定。
- `afterWrite: { mode: "restart", reason: "..." }` 在写入方知道热重载不安全时强制干净重启。
- `afterWrite: { mode: "none", reason: "..." }` 仅当调用方拥有后续处理时，才抑制自动重载/重启。

变更辅助函数会返回 `afterWrite` 以及一个类型化的 `followUp` 摘要，以便调用方记录或测试它们是否请求了重启。Gateway 网关仍然负责决定该重启实际何时发生。

`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 是 `runtime-config-load-write` 下已弃用的兼容性辅助函数。它们会在运行时警告一次，并在迁移窗口期间继续可供旧外部插件使用。内置插件不得使用它们；如果插件代码调用它们，或从插件 SDK 子路径导入这些辅助函数，配置边界守卫会失败。

对于直接 SDK 导入，请使用聚焦的配置子路径，而不是宽泛的
`openclaw/plugin-sdk/config-runtime` 兼容性 barrel：`config-contracts` 用于
类型，`plugin-config-runtime` 用于已加载配置断言和插件
入口查找，`runtime-config-snapshot` 用于当前进程快照，而
`config-mutation` 用于写入。内置插件测试应直接 mock 这些聚焦
子路径，而不是 mock 宽泛的兼容性 barrel。

内部 OpenClaw 运行时代码遵循相同方向：在 CLI、Gateway 网关或进程边界加载一次配置，然后将该值继续传递下去。成功的变更写入会刷新进程运行时快照并推进其内部修订版本；长生命周期缓存应基于运行时拥有的缓存键，而不是在本地序列化配置。长生命周期运行时模块对环境中的 `loadConfig()` 调用采用零容忍扫描器；请使用传入的 `cfg`、请求的 `context.getRuntimeConfig()`，或在显式进程边界使用 `getRuntimeConfig()`。

提供商和渠道执行路径必须使用当前运行时配置快照，而不是用于配置读回或编辑的文件快照。文件快照会保留源值，例如用于 UI 和写入的 SecretRef 标记；提供商回调需要解析后的运行时视图。当辅助函数可能接收当前源快照或当前运行时快照时，请先通过 `selectApplicableRuntimeConfig()` 路由，再读取凭证。

## 可复用运行时工具

对由 bot 编写的入站消息使用入站 `botLoopProtection` 事实。Core 会在会话记录和分发之前应用共享的内存滑动窗口守卫，而不会将策略绑定到某一个渠道。该守卫跟踪 `(scopeId, conversationId, participant pair)` 键，将一对参与者的双向事件合并计数，在窗口预算超出后应用冷却，并机会性地清理不活跃条目。

向操作员暴露此行为的渠道插件应优先使用共享的 `channels.defaults.botLoopProtection` 形状作为基线预算，然后在其上叠加渠道/提供商特定覆盖。共享配置使用秒作为单位，因为它面向用户：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

随解析后的轮次传入标准化的 bot 对事实。Core 会解析默认值、单位转换和 `enabled` 语义：

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

仅对不经过共享入站回复 runner 的自定义
双人事件循环，才直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

## 运行时命名空间

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent 身份、目录和会话管理。

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` 是从插件代码启动普通 OpenClaw agent 轮次的中立辅助函数。它使用与渠道触发回复相同的提供商/模型解析和 agent-harness 选择。

    `runEmbeddedPiAgent(...)` 作为现有插件的已弃用兼容性别名保留。新代码应使用 `runEmbeddedAgent(...)`。

    `resolveThinkingPolicy(...)` 返回提供商/模型支持的 thinking 级别以及可选默认值。提供商插件通过其 thinking 钩子拥有模型特定配置文件，因此工具插件应调用这个运行时辅助函数，而不是导入或复制提供商列表。

    `normalizeThinkingLevel(...)` 会将用户文本（如 `on`、`x-high` 或 `extra high`）转换为规范存储级别，然后再根据解析后的策略检查它。

    **会话存储辅助函数** 位于 `api.runtime.agent.session` 下：

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    对于会话工作流，优先使用 `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。这些辅助函数按 agent/会话身份寻址会话，因此插件不依赖旧版 `sessions.json` 存储形状。对于不应刷新会话活动的仅元数据补丁，请使用 `preserveActivity: true`；仅当回调返回完整条目且已删除字段必须保持删除时，才使用 `replaceEntry: true`。

    当插件在持久化会话上启动工作时，请使用 `runWithWorkAdmission(...)`。该回调会拒绝已归档或被并发替换的会话，保持归档/重置/删除变更在完成期间协调一致，并接收一个必须转发给 agent 运行的 `AbortSignal`。

    对于转录读取和写入，请导入 `openclaw/plugin-sdk/session-transcript-runtime`，并结合 `{ agentId, sessionKey, sessionId }` 使用 `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)` 或 `withSessionTranscriptWriteLock(...)`。这些 API 让插件能够识别转录、读取其事件、追加消息、发布更新，并在同一个转录写锁下运行相关操作。传入 `sessionFile`、使用 `resolveSessionTranscriptLegacyFileTarget(...)`，或从 `openclaw/plugin-sdk/agent-harness-runtime` 导入低级 `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` 已弃用；这些路径仅为已经接收活动转录 artifact 的旧代码存在。

    `loadSessionStore(...)`、`saveSessionStore(...)`、`updateSessionStore(...)`、`resolveSessionFilePath(...)` 和 `resolveAndPersistSessionFile(...)` 是已弃用的兼容性辅助函数，面向仍有意依赖旧版整体存储或转录文件形状的插件。新插件代码不得使用这些辅助函数，现有调用方应迁移到条目辅助函数和转录身份辅助函数。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    默认模型和提供商常量：

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    运行宿主拥有的文本补全，而不导入提供商内部实现或
    复制 OpenClaw 模型/认证/base URL 准备逻辑。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    该辅助函数使用与 OpenClaw
    内置运行时相同的简单补全准备路径，以及宿主拥有的运行时配置快照。上下文引擎
    会收到绑定到会话的 `llm.complete` 能力，因此模型调用会使用
    当前会话的 agent，不会静默回退到默认 agent。
    结果会包含提供商/模型/agent 归因，以及在可用时的标准化 token、
    缓存和预估成本用量。

    <Warning>
    模型覆盖需要操作者在配置中通过 `plugins.entries.<id>.llm.allowModelOverride: true` 选择启用。使用 `plugins.entries.<id>.llm.allowedModels` 将可信插件限制到特定的规范 `provider/model` 目标。跨 Agent 补全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    启动并管理后台子智能体运行。

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    模型覆盖（`provider`/`model`）需要操作者在配置中通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择启用。不可信插件仍可运行子智能体，但覆盖请求会被拒绝。
    </Warning>

    `deleteSession(...)` 可以删除同一插件通过 `api.runtime.subagent.run(...)` 创建的会话。删除任意用户或操作者会话仍需要管理员范围的 Gateway 网关请求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已连接节点，并从 Gateway 网关加载的插件代码或插件 CLI 命令调用节点主机命令。当插件拥有配对设备上的本地工作时使用此项，例如另一台 Mac 上的浏览器或音频桥接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在 Gateway 网关内部，此运行时处于进程内。在插件 CLI 命令中，它会通过 RPC 调用已配置的 Gateway 网关，因此 `openclaw googlemeet recover-tab` 等命令可以从终端检查已配对节点。节点命令仍会经过常规 Gateway 网关节点配对、命令允许列表、插件节点调用策略和节点本地命令处理。

    暴露危险节点主机命令的插件应使用 `api.registerNodeInvokePolicy(...)` 注册节点调用策略。该策略会在 Gateway 网关中于命令允许列表检查之后、命令转发到节点之前运行，因此直接 `node.invoke` 调用和更高层插件工具共享同一执行路径。

    <Warning>
    可选 `scopes` 字段会为调用请求 Gateway 网关操作者范围。OpenClaw 仅对内置插件和可信官方插件安装尊重它；来自其他插件的请求不会提升调用权限。仅当可信插件必须以更严格的 Gateway 网关范围（例如 `operator.admin`）调用节点命令时才使用它。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    将任务流运行时绑定到现有 OpenClaw 会话键或可信工具上下文，然后创建和管理任务流，而无需在每次调用中传递所有者。

    任务流会跟踪持久的多步骤工作流状态。它不是调度器：
    对未来唤醒使用 Cron 或 `api.session.workflow.scheduleSessionTurn(...)`，
    然后在计划轮次需要流程状态、子任务、等待或取消时使用 `managedFlows`。

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    当你已经从自己的绑定层获得可信 OpenClaw 会话键时，使用 `bindSession({ sessionKey, requesterOrigin })`。不要从原始用户输入进行绑定。

  </Accordion>
  <Accordion title="api.runtime.tts">
    文本转语音合成。

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    使用核心 `messages.tts` 配置和提供商选择。返回 PCM 音频缓冲区 + 采样率。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    图像、音频和视频分析。

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    未生成输出时（例如跳过输入），返回 `{ text: undefined }`。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍作为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容别名保留。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    图像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Web 搜索。

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    底层媒体实用工具。

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    当前运行时配置快照和事务性配置写入。优先使用
    已传入活动调用路径的配置；仅在处理程序需要直接使用进程快照时
    才使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 返回一个 `followUp`
    值，例如 `{ mode: "restart", requiresRestart: true, reason }`，
    它记录写入方意图，而不会从 Gateway 网关夺走重启控制权。

  </Accordion>
  <Accordion title="api.runtime.system">
    系统级实用工具。

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runCommandWithTimeout(...)` 返回捕获的 `stdout` 和 `stderr`、可选的
    截断计数、`code`、`signal`、`killed`、`termination` 和
    `noOutputTimedOut`。当子进程未提供非零退出码时，超时和无输出超时结果会报告 `code: 124`。
    非超时信号退出仍可能返回 `code: null`，因此请使用 `termination` 和
    `noOutputTimedOut` 来区分超时原因。

  </Accordion>
  <Accordion title="api.runtime.events">
    事件订阅。

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    日志。

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    模型和提供商凭证解析。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状态目录解析和基于 SQLite 的键控存储。

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    键控存储会在重启后保留，并按运行时绑定的插件 ID 隔离。使用 `registerIfAbsent(...)` 进行原子去重声明：当键缺失或已过期并完成注册时，它返回 `true`；当已有存活值存在时，它返回 `false`，且不会覆盖其值、创建时间或 TTL。限制：每个命名空间 `maxEntries`，每个插件 6,000 个存活行，JSON 值小于 64KB，并支持可选 TTL 过期。当一次写入会超过插件行数上限时，运行时可能会从正在写入的命名空间中逐出最旧的存活行；同级命名空间不会因这次写入而被逐出，如果该命名空间无法释放足够行数，写入仍会失败。

    <Warning>
    此版本仅支持内置插件。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    记忆工具工厂和 CLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    渠道专用运行时助手（加载渠道插件时可用）。

    `api.runtime.channel.media` 是渠道媒体下载和存储的首选表面：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    当远程 URL 应成为 OpenClaw 媒体时，使用 `saveRemoteMedia(...)`。当插件已经使用插件自有的鉴权、重定向或允许列表处理获取了 `Response` 时，使用 `saveResponseMedia(...)`。仅当插件需要原始字节用于检查、转换、解密或重新上传时，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已弃用兼容别名。

    `api.runtime.channel.mentions` 是使用运行时注入的内置渠道插件共享的入站提及策略表面：

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    可用的提及助手：

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` 有意不暴露较旧的 `resolveMentionGating*` 兼容助手。请优先使用规范化的 `{ facts, policy }` 路径。

  </Accordion>
</AccordionGroup>

## 存储运行时引用

使用 `createPluginRuntimeStore` 存储运行时引用，以便在 `register` 回调之外使用：

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Access from other files">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
运行时存储身份优先使用 `pluginId`。较低层的 `key` 形式用于少见场景，即一个插件有意需要多个运行时槽位。
</Note>

## 其他顶层 `api` 字段

除 `api.runtime` 外，API 对象还提供：

<ParamField path="api.id" type="string">
  插件 ID。
</ParamField>
<ParamField path="api.name" type="string">
  插件显示名称。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  当前配置快照（可用时为活跃的内存运行时快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  来自 `plugins.entries.<id>.config` 的插件专用配置。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  作用域日志记录器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  当前加载模式；`"setup-runtime"` 是轻量级的完整入口前启动/设置窗口。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相对于插件根目录的路径。
</ParamField>

## 相关内容

- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和注册表
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 子路径参考
