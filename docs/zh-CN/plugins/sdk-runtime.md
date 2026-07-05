---
read_when:
    - 你需要从插件调用核心辅助功能（TTS、STT、图像生成、Web 搜索、子智能体、节点）
    - 你想了解 api.runtime 暴露了什么
    - 你正在从插件代码访问配置、智能体或媒体辅助函数
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供插件使用的注入式运行时辅助工具
title: 插件运行时辅助工具
x-i18n:
    generated_at: "2026-07-05T11:34:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8341516832d7876e7f1412b443e7582a090b7f94893303560b3713ee7a7e6aa
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Reference，用于说明注册期间注入到每个插件中的 `api.runtime` 对象。请使用这些辅助函数，而不是直接导入宿主内部实现。

<CardGroup cols={2}>
  <Card title="渠道插件" href="/zh-CN/plugins/sdk-channel-plugins">
    逐步指南，在渠道插件的上下文中使用这些辅助函数。
  </Card>
  <Card title="提供商插件" href="/zh-CN/plugins/sdk-provider-plugins">
    逐步指南，在提供商插件的上下文中使用这些辅助函数。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` 是当前 OpenClaw 产品版本，来源于共享版本解析器，因此插件看到的值与 CLI 报告的值相同。

## 配置加载和写入

优先使用已传入活动调用路径的配置，例如注册期间的 `api.config`，或渠道/提供商回调中的 `cfg` 参数。这样可以让一个进程快照贯穿整个工作，而不是在热路径上重新解析配置。

仅当长生命周期处理程序需要当前进程快照，且没有配置传入该函数时，才使用 `api.runtime.config.current()`。返回值是只读的；编辑前请克隆，或使用变更辅助函数。

工具工厂会接收 `ctx.runtimeConfig` 和 `ctx.getRuntimeConfig()`。当配置可能在工具定义创建后发生变化时，请在长生命周期工具的 `execute` 回调中使用该 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化更改。每次写入都必须选择明确的 `afterWrite` 策略：

- `afterWrite: { mode: "auto" }` 让 Gateway 网关重载规划器决定。
- `afterWrite: { mode: "restart", reason: "..." }` 在写入方知道热重载不安全时强制干净重启。
- `afterWrite: { mode: "none", reason: "..." }` 仅当调用方负责后续处理时，才抑制自动重载/重启。

变更辅助函数会返回 `afterWrite` 以及类型化的 `followUp` 摘要，因此调用方可以记录日志或测试是否请求了重启。Gateway 网关仍然负责决定重启实际何时发生。

<Warning>
`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 已弃用。它们会在运行时对每个插件警告一次，并且仅在迁移窗口期间为旧版外部插件保留可用。内置插件不得使用它们：如果插件代码调用它们，或从插件 SDK 子路径导入这些辅助函数，内部配置边界防护会使构建失败。请改用 `current()`、传入的 `cfg`、`mutateConfigFile(...)` 或 `replaceConfigFile(...)`。
</Warning>

对于直接 SDK 导入，请优先使用聚焦的配置子路径，而不是宽泛的 `openclaw/plugin-sdk/config-runtime` 兼容 barrel：`config-contracts` 用于类型，`plugin-config-runtime` 用于已加载配置断言和插件入口查找，`runtime-config-snapshot` 用于当前进程快照，`config-mutation` 用于写入。内置插件测试应直接 mock 这些聚焦子路径，而不是 mock 宽泛的兼容 barrel。

内部 OpenClaw 运行时代码遵循同一方向：在 CLI、Gateway 网关或进程边界加载一次配置，然后传递该值。成功的变更写入会刷新进程运行时快照并推进其内部修订；长生命周期缓存应基于运行时拥有的缓存键，而不是在本地序列化配置。长生命周期运行时模块对环境中的 `loadConfig()` 调用有零容忍扫描器；请使用传入的 `cfg`、请求的 `context.getRuntimeConfig()`，或在明确的进程边界使用 `getRuntimeConfig()`。

提供商和渠道执行路径必须使用活动的运行时配置快照，而不是为配置读回或编辑返回的文件快照。文件快照会保留源值，例如用于 UI 和写入的 SecretRef 标记；提供商回调需要已解析的运行时视图。当某个辅助函数可能接收活动源快照或活动运行时快照时，请先通过 `selectApplicableRuntimeConfig()` 路由，再读取凭据。

## 可复用运行时工具

对由 bot 创作的入站消息使用入站 `botLoopProtection` 事实。核心会在会话记录和分发之前应用共享的内存滑动窗口防护，而不会将策略绑定到某一个渠道。该防护跟踪 `(scopeId, conversationId, participant pair)` 键，将一对参与者的双向事件合并计数，在窗口预算超出后应用冷却，并机会性清理非活动条目。

向操作员暴露此行为的渠道插件，应优先使用共享的 `channels.defaults.botLoopProtection` 形状作为基线预算，然后在其上叠加渠道/提供商特定覆盖。共享配置使用秒作为单位，因为它面向用户：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

将规范化的 bot 对事实随已解析轮次一起传入。核心会解析默认值、单位转换和 `enabled` 语义：

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

仅当自定义双人事件循环不经过共享入站回复 runner 时，才直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

## 运行时命名空间

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent 身份、目录和会话管理。

    ```typescript
    // Resolve the agent's working directory (agentId is required)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

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
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` 是一个中立辅助函数，用于从插件代码启动普通的 OpenClaw Agent 轮次。它使用与渠道触发回复相同的提供商/模型解析和 Agent harness 选择。

    `runEmbeddedPiAgent(...)` 仍作为现有插件的已弃用兼容别名保留。新代码应使用 `runEmbeddedAgent(...)`。

    `resolveThinkingPolicy(...)` 返回提供商/模型支持的思考级别和可选默认值。提供商插件通过其 thinking 钩子拥有模型特定 profile，因此工具插件应调用此运行时辅助函数，而不是导入或复制提供商列表。

    `normalizeThinkingLevel(...)` 会将用户文本（例如 `on`、`x-high` 或 `extra high`）转换为规范存储级别，然后再根据已解析策略检查。

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

    会话工作流优先使用 `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。这些辅助函数按 Agent/会话身份寻址会话，因此插件不依赖旧版 `sessions.json` 存储形状。对于不应刷新会话活动的仅元数据补丁，请使用 `preserveActivity: true`；仅当回调返回完整条目且已删除字段必须保持删除时，才使用 `replaceEntry: true`。

    当插件在持久化会话上启动工作时，请使用 `runWithWorkAdmission(...)`。该回调会拒绝已归档或被并发替换的会话，保持归档/重置/删除变更在完成过程中协调一致，并接收一个必须转发给 Agent 运行的 `AbortSignal`。

    对于转录读取和写入，请导入 `openclaw/plugin-sdk/session-transcript-runtime`，并结合 `{ agentId, sessionKey, sessionId }` 使用 `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)` 或 `withSessionTranscriptWriteLock(...)`。这些 API 让插件能够识别转录、读取其事件、追加消息、发布更新，并在同一个转录写锁下运行相关操作。传入 `sessionFile`、使用 `resolveSessionTranscriptLegacyFileTarget(...)`，或从 `openclaw/plugin-sdk/agent-harness-runtime` 导入低层级的 `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` 已弃用；这些路径仅为已经接收活动转录 artifact 的旧版代码存在。

    `resolveStorePath(...)` 和 `updateSessionStoreEntry(...)` 完善了会话辅助函数：`resolveStorePath` 会解析给定作用域的会话存储路径，而 `updateSessionStoreEntry({ storePath, sessionKey, update })` 会在调用方已知路径时，按存储路径直接修补一个条目。

    `loadSessionStore(...)`、`saveSessionStore(...)`、`updateSessionStore(...)` 和 `resolveSessionFilePath(...)` 是已弃用的兼容辅助函数，仅供仍然有意依赖旧版整库或转录文件形状的插件使用。新插件代码不得使用这些辅助函数，现有调用方应迁移到条目辅助函数和转录身份辅助函数。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    默认模型和提供商常量：

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "gpt-5.5"
    const provider = api.runtime.agent.defaults.provider; // e.g. "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    运行宿主拥有的文本补全，而无需导入提供商内部实现或重复 OpenClaw 模型/认证/base URL 准备。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    该辅助工具使用与 OpenClaw 内置运行时相同的简单补全准备路径，以及宿主拥有的运行时配置快照。上下文引擎会收到绑定到会话的 `llm.complete` 能力，因此模型调用会使用活跃会话的智能体，不会静默回退到默认智能体。结果会在可用时包含提供商/模型/智能体归因，以及规范化的 token、缓存和估算成本用量。

    <Warning>
    模型覆盖需要操作员通过配置中的 `plugins.entries.<id>.llm.allowModelOverride: true` 选择启用。使用 `plugins.entries.<id>.llm.allowedModels` 将可信插件限制到特定的规范 `provider/model` 目标。跨智能体补全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    启动和管理后台子智能体运行。

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-5.5", // optional override
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
    模型覆盖（`provider`/`model`）需要操作员通过配置中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择启用。不可信插件仍可运行子智能体，但覆盖请求会被拒绝。
    </Warning>

    `deleteSession(...)` 可以删除同一插件通过 `api.runtime.subagent.run(...)` 创建的会话。删除任意用户或操作员会话仍需要具备管理员权限范围的 Gateway 网关请求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已连接节点，并从 Gateway 网关加载的插件代码或插件 CLI 命令调用节点宿主命令。当插件拥有已配对设备上的本地工作时使用它，例如另一台 Mac 上的浏览器或音频桥接。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在 Gateway 网关内部，此运行时在进程内运行。在插件 CLI 命令中，它会通过 RPC 调用已配置的 Gateway 网关，因此 `openclaw googlemeet recover-tab` 等命令可以从终端检查已配对节点。节点命令仍会经过常规 Gateway 网关节点配对、命令允许列表、插件节点调用策略和节点本地命令处理。

    暴露危险节点宿主命令的插件应使用 `api.registerNodeInvokePolicy(...)` 注册节点调用策略。该策略在 Gateway 网关中运行，位于命令允许列表检查之后、命令转发到节点之前，因此直接 `node.invoke` 调用和更高层级的插件工具共享同一条强制执行路径。

    <Warning>
    可选的 `scopes` 字段会为此次调用请求 Gateway 网关操作员权限范围。OpenClaw 仅对内置插件和可信官方插件安装项尊重该字段；来自其他插件的请求不会提升调用权限。仅在可信插件必须以更严格的 Gateway 网关权限范围调用节点命令时使用它，例如 `operator.admin`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    将 Task Flow 和 Task Run 状态绑定到现有 OpenClaw 会话键或可信工具上下文。

    - `api.runtime.tasks.managedFlows` 支持变更：创建、推进和取消 Task Flows。
    - `api.runtime.tasks.flows` 和 `api.runtime.tasks.runs` 是只读 DTO 视图，用于列表和状态查询；二者都暴露 `bindSession(...)` / `fromToolContext(...)` 以及 `get`、`list`、`findLatest` 和 `resolve`。
    - `api.runtime.tasks.flow` 是 `managedFlows` 的已弃用别名。

    Task Flow 会跟踪持久的多步骤工作流状态。它不是调度器：
    对未来唤醒使用 Cron 或 `api.session.workflow.scheduleSessionTurn(...)`，然后在该工作需要流状态、子任务、等待或取消时，从已调度轮次使用 `managedFlows`。

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

    使用核心 `messages.tts` 配置和提供商选择。返回 PCM 音频缓冲区 + 采样率。`textToSpeechStream` 也可用于流式合成。

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

    未产生输出时返回 `{ text: undefined }`（例如跳过的输入）。

    `describeImageFileWithModel(...)` 会通过特定提供商/模型描述已知图像，绕过 `describeImageFile(...)` 使用的默认活跃模型解析。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍作为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容性别名保留。
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
  <Accordion title="api.runtime.videoGeneration">
    视频生成，形态与图像生成一致。

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "A drone shot flying over a coastline at sunrise",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    音乐生成，形态与图像生成一致。

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "An upbeat lo-fi track for a coding session",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
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
    低层级媒体实用工具。

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
    当前运行时配置快照和事务性配置写入。优先使用已经传入活跃调用路径的配置；仅在处理程序需要直接使用进程快照时使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 会返回 `followUp` 值，例如 `{ mode: "restart", requiresRestart: true, reason }`，它会记录写入者意图，而不会从 gateway 手中接管重启控制。

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
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` 会立即运行单个 Heartbeat 周期，绕过常规的合并计时器。传入 `{ heartbeat: { target: "last" } }` 可强制投递到上一个活跃渠道，而不是默认的 `target: "none"` 抑制行为。

    `runCommandWithTimeout(...)` 返回捕获的 `stdout` 和 `stderr`、可选的截断计数、`code`、`signal`、`killed`、`termination` 和 `noOutputTimedOut`。当子进程没有提供非零退出码时，超时和无输出超时结果会报告 `code: 124`。非超时的信号退出仍可能返回 `code: null`，因此请使用 `termination` 和 `noOutputTimedOut` 来区分超时原因。

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

    // Request-ready auth, including provider runtime exchanges (e.g. OAuth refresh)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状态目录解析和基于 SQLite 的键值存储。

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

    键值存储会在重启后保留，并按运行时绑定的插件 id 隔离。使用 `registerIfAbsent(...)` 进行原子的去重声明：当键缺失或已过期并完成注册时，它返回 `true`；当已有存活值时，它返回 `false`，且不会覆盖该值、创建时间或 TTL。限制：每个命名空间的 `maxEntries`、每个插件 50,000 个存活行、低于 64KB 的 JSON 值，以及可选的 TTL 过期。当一次写入会超过插件行数上限时，运行时会从正在写入的命名空间中移除最旧的存活行；兄弟命名空间不会因该写入被驱逐；如果该命名空间无法释放足够行数，写入仍会失败。

    `openSyncKeyedStore<T>(...)` 返回相同形态的存储，但使用同步方法（`register`、`registerIfAbsent`、`lookup`、`consume`、`clear` 都直接返回值而不是 promise），供无法使用 await 的调用方使用。

    `openChannelIngressQueue<TPayload>(...)` 会打开一个持久化的入口队列，作用域限定到调用插件，用于缓冲需要跨重启至少处理一次的入站事件。

    <Warning>
    在此版本中，`openKeyedStore`、`openSyncKeyedStore` 和 `openChannelIngressQueue` 仅适用于内置插件和受信任的官方插件安装。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    渠道插件加载时可用的渠道专用运行时辅助工具。按关注点分组：

    | 分组 | 用途 |
    | --- | --- |
    | `text` | 分块（`chunkText`、`chunkMarkdownText`、`resolveChunkMode`）、控制命令检测、Markdown 表格转换。 |
    | `reply` | 缓冲分块回复分发、信封格式化、有效消息/人工延迟配置解析。 |
    | `routing` | `buildAgentSessionKey`、`resolveAgentRoute`。 |
    | `pairing` | `buildPairingReply`、允许列表读取、配对请求 upsert。 |
    | `media` | 远程媒体下载/保存（见下文）。 |
    | `activity` | 记录/读取上一次渠道活动。 |
    | `session` | 来自入站事件的会话元数据、上一路由更新。 |
    | `mentions` | 提及策略辅助工具（见下文）。 |
    | `reactions` | 用于进行中处理指示器的确认表情回应句柄。 |
    | `groups` | 群组策略和需要提及解析。 |
    | `debounce` | 入站消息防抖。 |
    | `commands` | 命令授权和文本命令门控。 |
    | `outbound` | 加载渠道的出站适配器。 |
    | `inbound` | 构建入站事件上下文，并运行共享的入站事件/回复内核。 |
    | `threadBindings` | 调整绑定会话线程的空闲超时/最大年龄。 |
    | `runtimeContexts` | 注册、读取和监听进程本地的按渠道/账号/能力划分的上下文。 |

    `api.runtime.channel.media` 是渠道媒体下载和存储的首选接口：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    当远程 URL 应成为 OpenClaw 媒体时，请使用 `saveRemoteMedia(...)`。当插件已经使用插件自有凭证、重定向或允许列表处理获取了 `Response` 时，请使用 `saveResponseMedia(...)`。仅当插件需要原始字节用于检查、转换、解密或重新上传时，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已弃用兼容别名。

    `api.runtime.channel.mentions` 是使用运行时注入的内置渠道插件共享的入站提及策略接口：

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

    可用的提及辅助工具：

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` 有意不暴露较旧的 `resolveMentionGating*` 兼容辅助工具。优先使用规范化的 `{ facts, policy }` 路径。

    `reply`、`session` 和 `inbound` 下的若干字段带有按字段设置的 `@deprecated` 注释，指向当前的渠道轮次内核或渠道出站适配器；在基于特定辅助工具构建新代码前，请查看其内联 JSDoc。

  </Accordion>
</AccordionGroup>

## 存储运行时引用

使用 `createPluginRuntimeStore` 存储运行时引用，以便在 `register` 回调之外使用：

<Steps>
  <Step title="创建存储">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="接入入口点">
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
  <Step title="从其他文件访问">
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
运行时存储身份优先使用 `pluginId`。较底层的 `key` 形式用于少见场景：一个插件有意需要多个运行时槽位。
</Note>

## 其他顶层 `api` 字段

除 `api.runtime` 外，API 对象还提供：

<ParamField path="api.id" type="string">
  插件 id。
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
  作用域化日志记录器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  当前加载模式：`"full"`（实时激活）、`"discovery"` / `"tool-discovery"`（只读能力发现）、`"setup-only"`（轻量设置入口）、`"setup-runtime"`（还需要运行时渠道入口的设置流程）或 `"cli-metadata"`（CLI 命令元数据收集）。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相对于插件根目录的路径。
</ParamField>

## 相关内容

- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和注册表
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 子路径参考
