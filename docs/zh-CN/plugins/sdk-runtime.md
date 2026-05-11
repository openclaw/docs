---
read_when:
    - 你需要从插件中调用核心辅助函数（TTS、STT、图像生成、Web 搜索、子智能体、节点）
    - 你想了解 api.runtime 暴露了什么
    - 你正在从插件代码访问配置、智能体或媒体辅助函数
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供插件使用的注入式运行时辅助工具
title: 插件运行时辅助工具
x-i18n:
    generated_at: "2026-05-11T20:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Reference for the `api.runtime` 对象会在注册期间注入到每个插件中。使用这些辅助函数，而不是直接导入主机内部实现。

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

优先使用已经传入当前调用路径的配置，例如注册期间的 `api.config`，或渠道/提供商回调中的 `cfg` 参数。这样可以让一个进程快照贯穿整个工作过程，而不是在热路径上重新解析配置。

只有当长生命周期处理程序需要当前进程快照，并且没有配置传入该函数时，才使用 `api.runtime.config.current()`。返回值是只读的；编辑前请克隆它，或使用变更辅助函数。

工具工厂会接收 `ctx.runtimeConfig` 和 `ctx.getRuntimeConfig()`。当工具定义创建后配置可能发生变化时，在长生命周期工具的 `execute` 回调中使用该 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化更改。每次写入都必须选择一个显式的 `afterWrite` 策略：

- `afterWrite: { mode: "auto" }` 让 Gateway 网关重载规划器决定。
- `afterWrite: { mode: "restart", reason: "..." }` 在写入方知道热重载不安全时强制干净重启。
- `afterWrite: { mode: "none", reason: "..." }` 仅当调用方负责后续处理时，才抑制自动重载/重启。

变更辅助函数会返回 `afterWrite` 以及一个类型化的 `followUp` 摘要，以便调用方记录或测试它们是否请求了重启。Gateway 网关仍然负责决定该重启实际何时发生。

`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 是 `runtime-config-load-write` 下已弃用的兼容性辅助函数。它们会在运行时警告一次，并在迁移窗口期间继续供旧的外部插件使用。内置插件不得使用它们；如果插件代码调用这些函数，或从插件 SDK 子路径导入这些辅助函数，配置边界守卫会失败。

对于直接 SDK 导入，请使用聚焦的配置子路径，而不是宽泛的
`openclaw/plugin-sdk/config-runtime` 兼容性 barrel：`config-contracts` 用于
类型，`plugin-config-runtime` 用于已加载配置断言和插件
入口查找，`runtime-config-snapshot` 用于当前进程快照，`config-mutation`
用于写入。内置插件测试应直接 mock 这些聚焦
子路径，而不是 mock 宽泛的兼容性 barrel。

OpenClaw 内部运行时代码也遵循同一方向：在 CLI、Gateway 网关或进程边界加载一次配置，然后传递该值。成功的变更写入会刷新进程运行时快照，并推进其内部修订版本；长生命周期缓存应基于运行时拥有的缓存键，而不是在本地序列化配置。长生命周期运行时模块对环境中的 `loadConfig()` 调用采用零容忍扫描器；请使用传入的 `cfg`、请求的 `context.getRuntimeConfig()`，或在显式进程边界使用 `getRuntimeConfig()`。

提供商和渠道执行路径必须使用当前运行时配置快照，而不是用于配置读回或编辑的文件快照。文件快照会保留源值，例如供 UI 和写入使用的 SecretRef 标记；提供商回调需要已解析的运行时视图。当某个辅助函数可能以当前源快照或当前运行时快照调用时，请先通过 `selectApplicableRuntimeConfig()` 路由，再读取凭证。

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
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` 是从插件代码启动普通 OpenClaw 智能体轮次的中性辅助函数。它使用与渠道触发回复相同的提供商/模型解析和 agent harness 选择。

    `runEmbeddedPiAgent(...)` 仍作为兼容性别名保留。

    `resolveThinkingPolicy(...)` 返回提供商/模型支持的 thinking level 以及可选默认值。提供商插件通过其 thinking 钩子拥有特定于模型的 profile，因此工具插件应调用这个运行时辅助函数，而不是导入或复制提供商列表。

    `normalizeThinkingLevel(...)` 会在根据已解析策略检查用户文本前，将 `on`、`x-high` 或 `extra high` 等用户文本转换为规范的存储级别。

    **会话存储辅助函数** 位于 `api.runtime.agent.session` 下：

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    运行时写入优先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`。它们会通过 Gateway 网关拥有的会话存储写入器路由，保留并发更新，并复用热缓存。`saveSessionStore(...)` 仍可用于兼容性和离线维护式重写。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    默认模型和提供商常量：

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    运行主机拥有的文本补全，而无需导入提供商内部实现或
    复制 OpenClaw 的模型/身份验证/base URL 准备逻辑。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    该辅助函数使用与 OpenClaw 内置运行时相同的简单补全准备路径，以及主机拥有的运行时配置快照。上下文引擎会接收绑定到会话的 `llm.complete` 能力，因此模型调用会使用当前会话的智能体，不会静默回退到默认智能体。结果包含提供商/模型/智能体归因，以及可用时的规范化 token、缓存和估算成本用量。

    <Warning>
    模型覆盖需要操作者在配置中通过 `plugins.entries.<id>.llm.allowModelOverride: true` 选择启用。使用 `plugins.entries.<id>.llm.allowedModels` 将受信任插件限制到特定的规范 `provider/model` 目标。跨智能体补全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
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
    模型覆盖（`provider`/`model`）需要操作者在配置中通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择启用。不受信任的插件仍可运行子智能体，但覆盖请求会被拒绝。
    </Warning>

    `deleteSession(...)` 可以删除同一插件通过 `api.runtime.subagent.run(...)` 创建的会话。删除任意用户或操作者会话仍需要具有管理员范围的 Gateway 网关请求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已连接的节点，并从 Gateway 网关加载的插件代码或插件 CLI 命令调用节点主机命令。当插件拥有配对设备上的本地工作时使用它，例如另一台 Mac 上的浏览器或音频 bridge。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在 Gateway 网关内部，此运行时是进程内的。在插件 CLI 命令中，它会通过 RPC 调用已配置的 Gateway 网关，因此 `openclaw googlemeet recover-tab` 等命令可以从终端检查已配对节点。节点命令仍会经过正常的 Gateway 网关节点配对、命令 allowlist、插件节点调用策略以及节点本地命令处理。

    暴露危险节点主机命令的插件应使用 `api.registerNodeInvokePolicy(...)` 注册节点调用策略。该策略会在 Gateway 网关中运行，位于命令 allowlist 检查之后、命令转发到节点之前，因此直接的 `node.invoke` 调用和更高层插件工具共享同一强制执行路径。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    将 Task Flow 运行时绑定到现有 OpenClaw 会话键或受信任工具上下文，然后创建和管理 Task Flows，而无需在每次调用时传递所有者。

    Task Flow 跟踪持久的多步骤工作流状态。它不是调度器：
    对未来唤醒使用 Cron 或 `api.session.workflow.scheduleSessionTurn(...)`，
    然后在已调度轮次中使用 `managedFlows`，当该工作需要
    flow 状态、子任务、等待或取消时。

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

    当你已经从自己的绑定层获得可信的 OpenClaw 会话键时，使用 `bindSession({ sessionKey, requesterOrigin })`。不要从原始用户输入进行绑定。

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

    使用核心 `messages.tts` 配置和提供商选择。返回 PCM 音频缓冲区和采样率。

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
    低级媒体工具。

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
    当前运行时配置快照和事务性配置写入。优先使用已传入活动调用路径的配置；只有在处理器需要直接使用进程快照时才使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 返回 `followUp` 值，例如 `{ mode: "restart", requiresRestart: true, reason }`，用于记录写入方意图，而不会从 Gateway 网关手中接管重启控制。

  </Accordion>
  <Accordion title="api.runtime.system">
    系统级工具。

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
    日志记录。

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    模型和提供商身份验证解析。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
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

    键值存储会在重启后保留，并按运行时绑定的插件 ID 隔离。使用 `registerIfAbsent(...)` 进行原子去重声明：当键缺失或已过期并完成注册时返回 `true`；当已有有效值存在时返回 `false`，且不会覆盖其值、创建时间或 TTL。限制：每个命名空间 `maxEntries`，每个插件 1,000 条有效行，JSON 值小于 64KB，并支持可选的 TTL 过期。

    <Warning>
    此版本仅限内置插件。
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
    渠道专用运行时辅助工具（在加载渠道插件时可用）。

    `api.runtime.channel.mentions` 是供使用运行时注入的内置渠道插件共享的入站提及策略接口：

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
优先使用 `pluginId` 作为 runtime-store 标识。较低级的 `key` 形式用于少见场景，即一个插件有意需要多个运行时槽位。
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
  当前配置快照（可用时为活跃的内存中运行时快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  来自 `plugins.entries.<id>.config` 的插件专属配置。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  作用域日志记录器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  当前加载模式；`"setup-runtime"` 是轻量级的完整入口启动/设置前窗口。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相对于插件根目录的路径。
</ParamField>

## 相关

- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和注册表
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 子路径参考
