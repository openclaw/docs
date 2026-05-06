---
read_when:
    - 你需要在插件中调用核心辅助函数（TTS、STT、图像生成、Web 搜索、子智能体、节点）
    - 你想了解 api.runtime 暴露了什么
    - 你正在从插件代码访问配置、智能体或媒体辅助函数
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供插件使用的注入式运行时辅助工具
title: 插件运行时辅助工具
x-i18n:
    generated_at: "2026-05-06T16:28:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ce16325613efc07bccb8baee3fdb46eb28452b760a6c265d3a25d36bfcbcf0f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

这是在注册期间注入到每个插件中的 `api.runtime` 对象参考。请使用这些辅助函数，而不是直接导入主机内部机制。

<CardGroup cols={2}>
  <Card title="渠道插件" href="/zh-CN/plugins/sdk-channel-plugins">
    分步指南，展示在渠道插件上下文中如何使用这些辅助函数。
  </Card>
  <Card title="提供商插件" href="/zh-CN/plugins/sdk-provider-plugins">
    分步指南，展示在提供商插件上下文中如何使用这些辅助函数。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 配置加载和写入

优先使用已经传入当前调用路径的配置，例如注册期间的 `api.config`，或渠道/提供商回调中的 `cfg` 参数。这样可以让一个进程快照贯穿整个工作流，而不是在热路径上重新解析配置。

仅当长生命周期处理程序需要当前进程快照，并且没有向该函数传入配置时，才使用 `api.runtime.config.current()`。返回值是只读的；编辑前请克隆或使用变更辅助函数。

工具工厂会收到 `ctx.runtimeConfig` 和 `ctx.getRuntimeConfig()`。当配置可能在工具定义创建后发生变化时，请在长生命周期工具的 `execute` 回调中使用该 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化更改。每次写入都必须选择明确的 `afterWrite` 策略：

- `afterWrite: { mode: "auto" }` 让 Gateway 网关的重新加载规划器决定。
- `afterWrite: { mode: "restart", reason: "..." }` 在写入方知道热重载不安全时强制干净重启。
- `afterWrite: { mode: "none", reason: "..." }` 仅当调用方自行负责后续操作时，才抑制自动重新加载/重启。

变更辅助函数会返回 `afterWrite` 以及带类型的 `followUp` 摘要，以便调用方记录或测试它们是否请求了重启。Gateway 网关仍然负责决定重启实际发生的时机。

`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 是 `runtime-config-load-write` 下已弃用的兼容性辅助函数。它们会在运行时警告一次，并在迁移窗口期间继续供旧的外部插件使用。内置插件不得使用它们；如果插件代码调用它们，或从插件 SDK 子路径导入这些辅助函数，配置边界保护会失败。

对于直接 SDK 导入，请使用聚焦的配置子路径，而不是宽泛的
`openclaw/plugin-sdk/config-runtime` 兼容性 barrel：`config-types` 用于
类型，`plugin-config-runtime` 用于已加载配置断言和插件
入口查找，`runtime-config-snapshot` 用于当前进程快照，以及
`config-mutation` 用于写入。内置插件测试应直接 mock 这些聚焦的
子路径，而不是 mock 宽泛的兼容性 barrel。

OpenClaw 内部运行时代码也遵循相同方向：在 CLI、Gateway 网关或进程边界加载一次配置，然后传递该值。成功的变更写入会刷新进程运行时快照并推进其内部修订；长生命周期缓存应基于运行时拥有的缓存键，而不是在本地序列化配置。长生命周期运行时模块对环境中的 `loadConfig()` 调用有零容忍扫描器；请使用传入的 `cfg`、请求的 `context.getRuntimeConfig()`，或在明确的进程边界使用 `getRuntimeConfig()`。

提供商和渠道执行路径必须使用当前运行时配置快照，而不是用于配置读回或编辑的文件快照。文件快照会保留源值，例如用于 UI 和写入的 SecretRef 标记；提供商回调需要已解析的运行时视图。当辅助函数可能以当前源快照或当前运行时快照调用时，请在读取凭证前通过 `selectApplicableRuntimeConfig()` 路由。

## 运行时命名空间

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    智能体身份、目录和会话管理。

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

    `runEmbeddedAgent(...)` 是从插件代码启动普通 OpenClaw 智能体轮次的中立辅助函数。它使用与渠道触发回复相同的提供商/模型解析和 agent-harness 选择。

    `runEmbeddedPiAgent(...)` 仍作为兼容性别名保留。

    `resolveThinkingPolicy(...)` 返回该提供商/模型支持的 thinking 级别和可选默认值。提供商插件通过自己的 thinking 钩子拥有特定模型的配置文件，因此工具插件应调用这个运行时辅助函数，而不是导入或复制提供商列表。

    `normalizeThinkingLevel(...)` 会在根据已解析策略检查前，将 `on`、`x-high` 或 `extra high` 等用户文本转换为规范存储级别。

    **会话存储辅助函数**位于 `api.runtime.agent.session` 下：

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    对于运行时写入，优先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`。它们会经过 Gateway 网关拥有的会话存储写入器，保留并发更新，并复用热缓存。`saveSessionStore(...)` 仍可用于兼容性和离线维护式重写。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    默认模型和提供商常量：

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    启动和管理后台 subagent 运行。

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
    模型覆盖（`provider`/`model`）需要操作者通过配置中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择启用。不受信任的插件仍可运行 subagent，但覆盖请求会被拒绝。
    </Warning>

    `deleteSession(...)` 可以删除同一插件通过 `api.runtime.subagent.run(...)` 创建的会话。删除任意用户或操作者会话仍需要管理员范围的 Gateway 网关请求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已连接节点，并从 Gateway 网关加载的插件代码或插件 CLI 命令调用节点主机命令。当插件拥有配对设备上的本地工作时使用它，例如另一台 Mac 上的浏览器或音频桥接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在 Gateway 网关内部，此运行时在进程内。在插件 CLI 命令中，它会通过 RPC 调用已配置的 Gateway 网关，因此 `openclaw googlemeet recover-tab` 等命令可以从终端检查配对节点。节点命令仍会经过常规 Gateway 网关节点配对、命令允许列表、插件节点调用策略和节点本地命令处理。

    暴露危险节点主机命令的插件应使用 `api.registerNodeInvokePolicy(...)` 注册节点调用策略。该策略在 Gateway 网关中运行，位于命令允许列表检查之后、命令转发到节点之前，因此直接 `node.invoke` 调用和更高层级的插件工具共享同一条执行路径。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    将任务流运行时绑定到现有 OpenClaw 会话键或可信工具上下文，然后创建和管理任务流，而无需在每次调用时传入所有者。

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

    当你已经从自己的绑定层获得可信 OpenClaw 会话键时，请使用 `bindSession({ sessionKey, requesterOrigin })`。不要从原始用户输入进行绑定。

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
    ```

    无输出时（例如跳过的输入）返回 `{ text: undefined }`。

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
    底层媒体工具。

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
    当前运行时配置快照和事务性配置写入。优先使用已传入当前活跃调用路径的配置；仅当处理程序需要直接读取进程快照时才使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 会返回一个 `followUp` 值，例如 `{ mode: "restart", requiresRestart: true, reason }`，用于记录写入方意图，同时不会从 Gateway 网关手中接管重启控制权。

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

    键值存储会在重启后保留，并按运行时绑定的插件 id 隔离。使用 `registerIfAbsent(...)` 执行原子去重声明：当键缺失或已过期并完成注册时返回 `true`；当已有有效值存在时返回 `false`，且不会覆盖其值、创建时间或 TTL。限制：每个 namespace 的 `maxEntries`、每个插件 1,000 条有效行、JSON 值小于 64KB，以及可选 TTL 过期。

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
    渠道特定的运行时辅助函数（加载渠道插件时可用）。

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

    可用的提及辅助函数：

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` 有意不公开较旧的 `resolveMentionGating*` 兼容性辅助函数。优先使用规范化的 `{ facts, policy }` 路径。

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
运行时存储身份优先使用 `pluginId`。较低层级的 `key` 形式适用于少见场景，即一个插件有意需要多个运行时槽位。
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
  来自 `plugins.entries.<id>.config` 的插件特定配置。
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

## 相关

- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和注册表
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 子路径参考
