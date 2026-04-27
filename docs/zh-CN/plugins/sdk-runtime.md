---
read_when:
    - 你需要从插件中调用核心辅助函数（TTS、STT、图像生成、网页搜索、子智能体、节点）
    - 你想了解 `api.runtime` 暴露了什么
    - 你正在从插件代码中访问配置、智能体或媒体辅助函数
sidebarTitle: Runtime helpers
summary: api.runtime —— 可供插件使用的注入式运行时辅助函数
title: 插件运行时辅助函数
x-i18n:
    generated_at: "2026-04-27T13:19:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: dfd306203375c1a11e67f7e0e28b3cd7f15924457fa80d801cf99ae6dc8c26fa
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

每个插件在注册期间都会注入 `api.runtime` 对象，本页提供其参考说明。请使用这些辅助函数，而不是直接导入宿主内部实现。

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

## 配置加载与写入

优先使用已经传入当前调用路径的配置，例如注册期间的 `api.config`，或渠道 / 提供商回调中的 `cfg` 参数。这样可以让同一个进程快照贯穿整个工作流程，而不是在热点路径中重复解析配置。

仅当某个长生命周期处理器需要当前进程快照，且该函数未传入配置时，才使用 `api.runtime.config.current()`。返回值为只读；编辑前请先克隆或使用变更辅助函数。

工具工厂会收到 `ctx.runtimeConfig` 和 `ctx.getRuntimeConfig()`。如果某个长生命周期工具的 `execute` 回调中，配置可能在工具定义创建后发生变化，请在回调内部使用这个 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化变更。每次写入都必须选择一个明确的 `afterWrite` 策略：

- `afterWrite: { mode: "auto" }` 让 Gateway 网关重载规划器自行决定。
- `afterWrite: { mode: "restart", reason: "..." }` 当写入方明确知道热重载不安全时，强制执行一次干净重启。
- `afterWrite: { mode: "none", reason: "..." }` 仅当调用方负责后续处理时，才抑制自动重载 / 重启。

这些变更辅助函数会返回 `afterWrite` 以及带类型的 `followUp` 摘要，调用方可以据此记录日志或在测试中判断自己是否请求了重启。但何时真正执行重启，仍由 Gateway 网关控制。

`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 是已弃用的兼容性辅助函数。它们会在运行时警告一次，内置插件不得使用它们；如果生产插件代码调用这些函数，或从插件 SDK 子路径导入这些辅助函数，架构守卫就会失败。

OpenClaw 内部运行时代码也遵循相同方向：在 CLI、Gateway 网关或进程边界处加载一次配置，然后将该值一路传递下去。成功的变更写入会刷新进程运行时快照，并推进其内部修订版本；长生命周期缓存应基于运行时拥有的缓存键，而不是在本地序列化配置。长生命周期运行时模块对环境式 `loadConfig()` 调用采用零容忍扫描；请使用传入的 `cfg`、请求中的 `context.getRuntimeConfig()`，或在明确的进程边界处使用 `getRuntimeConfig()`。

## 运行时命名空间

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    智能体身份、目录和会话管理。

    ```typescript
    // 解析智能体的工作目录
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // 解析 Agent 工作区
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // 获取智能体身份
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // 获取默认思考等级
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // 根据当前提供商配置文件，校验用户提供的思考等级
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // 将 level 传给嵌入式运行
    }

    // 获取智能体超时时间
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // 确保工作区存在
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 运行一次嵌入式智能体轮次
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

    `runEmbeddedAgent(...)` 是一个中立的辅助函数，用于从插件代码中启动一次普通的 OpenClaw 智能体轮次。它使用与渠道触发回复相同的 provider / model 解析逻辑和智能体 harness 选择逻辑。

    `runEmbeddedPiAgent(...)` 仍保留为兼容性别名。

    `resolveThinkingPolicy(...)` 返回 provider / model 支持的思考等级以及可选的默认值。提供商插件通过其思考钩子拥有模型特定配置文件，因此工具插件应调用这个运行时辅助函数，而不是导入或复制提供商列表。

    `normalizeThinkingLevel(...)` 会将用户文本（例如 `on`、`x-high` 或 `extra high`）转换为规范化的已存储等级，然后再根据已解析的策略进行检查。

    **会话存储辅助函数** 位于 `api.runtime.agent.session` 下：

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    默认模型和提供商常量：

    ```typescript
    const model = api.runtime.agent.defaults.model; // 例如 "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // 例如 "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    启动并管理后台子智能体运行。

    ```typescript
    // 启动一个子智能体运行
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // 可选覆盖
      model: "gpt-4.1-mini", // 可选覆盖
      deliver: false,
    });

    // 等待完成
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // 读取会话消息
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // 删除一个会话
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    模型覆盖（`provider` / `model`）需要操作员在配置中通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。不受信任的插件仍可运行子智能体，但覆盖请求会被拒绝。
    </Warning>

    `deleteSession(...)` 可以删除同一个插件通过 `api.runtime.subagent.run(...)` 创建的会话。删除任意用户或操作员会话，仍然需要管理员作用域的 Gateway 网关请求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已连接的节点，并从 Gateway 网关加载的插件代码或插件 CLI 命令中调用节点宿主命令。当插件在已配对设备上拥有本地工作时，请使用此功能，例如另一台 Mac 上的浏览器桥接或音频桥接。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在 Gateway 网关内部，这个运行时在进程内工作。在插件 CLI 命令中，它会通过 RPC 调用已配置的 Gateway 网关，因此像 `openclaw googlemeet recover-tab` 这样的命令可以从终端检查已配对节点。节点命令仍会经过正常的 Gateway 网关节点配对、命令允许列表和节点本地命令处理流程。

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    将 Task Flow 运行时绑定到现有 OpenClaw 会话键或受信任的工具上下文，然后在每次调用时无需传递 owner 也能创建和管理 Task Flows。

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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

    当你已经从自己的绑定层获得一个受信任的 OpenClaw 会话键时，请使用 `bindSession({ sessionKey, requesterOrigin })`。不要从原始用户输入中进行绑定。

  </Accordion>
  <Accordion title="api.runtime.tts">
    文本转语音合成。

    ```typescript
    // 标准 TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // 面向电话场景优化的 TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // 列出可用音色
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
    // 描述图像
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // 转录音频
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // 可选，用于无法推断 MIME 类型时
    });

    // 描述视频
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // 通用文件分析
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    当没有生成输出时（例如输入被跳过），返回 `{ text: undefined }`。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍保留为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容性别名。
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
    网页搜索。

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
    当前运行时配置快照和事务性配置写入。优先使用已经传入当前调用路径的配置；仅当处理器需要直接访问进程快照时，才使用
    `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 会返回一个 `followUp`
    值，例如 `{ mode: "restart", requiresRestart: true, reason }`，用于记录写入方的意图，同时不会从 Gateway 网关手中夺走重启控制权。

  </Accordion>
  <Accordion title="api.runtime.system">
    系统级工具。

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    状态目录解析。

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    Memory 工具工厂和 CLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    渠道特定的运行时辅助函数（在加载渠道插件时可用）。

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

    可用的提及辅助函数：

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` 有意不暴露较旧的 `resolveMentionGating*` 兼容性辅助函数。请优先使用规范化的 `{ facts, policy }` 路径。

  </Accordion>
</AccordionGroup>

## 存储运行时引用

使用 `createPluginRuntimeStore` 来存储运行时引用，以便在 `register` 回调之外使用：

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
  <Step title="连接到入口点">
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
      return store.getRuntime(); // 如果尚未初始化则抛出异常
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 如果尚未初始化则返回 null
    }
    ```

  </Step>
</Steps>

<Note>
运行时存储的标识应优先使用 `pluginId`。更底层的 `key` 形式适用于少见场景：某个插件有意需要多个运行时槽位。
</Note>

## 其他顶层 `api` 字段

除了 `api.runtime` 之外，API 对象还提供：

<ParamField path="api.id" type="string">
  插件 id。
</ParamField>
<ParamField path="api.name" type="string">
  插件显示名称。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  当前配置快照（如果可用，则为当前处于活动状态的内存运行时快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  来自 `plugins.entries.<id>.config` 的插件专用配置。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  作用域日志记录器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  当前加载模式；`"setup-runtime"` 是完整入口启动 / 设置之前的轻量级窗口。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相对于插件根目录的路径。
</ParamField>

## 相关内容

- [插件架构内部机制](/zh-CN/plugins/architecture) — 能力模型和注册表
- [插件入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) — 子路径参考
