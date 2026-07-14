---
read_when:
    - 你需要从插件调用核心辅助函数（TTS、STT、图像生成、Web 搜索、Gateway 网关、子智能体、节点）
    - 你想了解 `api.runtime` 公开了哪些内容
    - 你正在从插件代码中访问配置、智能体或媒体辅助函数
sidebarTitle: Runtime helpers
summary: api.runtime -- 插件可用的注入式运行时辅助函数
title: 插件运行时辅助函数
x-i18n:
    generated_at: "2026-07-14T13:57:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5126ad814597ce5c23232624d4ea38d188f3a7efac39607312546476e6964e6f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

注入到每个插件注册过程中的 `api.runtime` 对象参考。请使用这些辅助函数，而不是直接导入宿主内部模块。

<CardGroup cols={2}>
  <Card title="渠道插件" href="/zh-CN/plugins/sdk-channel-plugins">
    分步指南，说明如何在渠道插件的上下文中使用这些辅助函数。
  </Card>
  <Card title="提供商插件" href="/zh-CN/plugins/sdk-provider-plugins">
    分步指南，说明如何在提供商插件的上下文中使用这些辅助函数。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` 是当前的 OpenClaw 产品版本，取自共享版本解析器，因此插件看到的值与 CLI 报告的值相同。

## 配置加载和写入

优先使用已经传入当前调用路径的配置，例如注册期间的 `api.config`，或渠道/提供商回调中的 `cfg` 参数。这样可以让同一份进程快照贯穿整个工作流程，而不必在热路径上重新解析配置。

仅当长生命周期处理程序需要当前进程快照，且没有向该函数传入配置时，才使用 `api.runtime.config.current()`。返回值为只读；编辑前请克隆它或使用变更辅助函数。

工具工厂会接收 `ctx.runtimeConfig` 和 `ctx.getRuntimeConfig()`。如果创建工具定义后配置仍可能发生变化，请在长生命周期工具的 `execute` 回调中使用该 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化更改。每次写入都必须选择明确的 `afterWrite` 策略：

- `afterWrite: { mode: "auto" }` 由 Gateway 网关重新加载规划器决定。
- `afterWrite: { mode: "restart", reason: "..." }` 当写入方知道热重载不安全时，强制执行干净重启。
- `afterWrite: { mode: "none", reason: "..." }` 仅当调用方负责后续处理时，才抑制自动重新加载/重启。

变更辅助函数会返回 `afterWrite` 和类型化的 `followUp` 摘要，因此调用方可以记录或测试是否请求了重启。实际何时重启仍由 Gateway 网关负责。

<Warning>
`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 已弃用。它们在运行时为每个插件警告一次，并且仅在迁移窗口期间继续供旧版外部插件使用。内置插件不得使用它们：如果插件代码调用这些函数，或从插件 SDK 子路径导入这些辅助函数，内部配置边界守卫会导致构建失败。请改用 `current()`、传入的 `cfg`、`mutateConfigFile(...)` 或 `replaceConfigFile(...)`。
</Warning>

对于直接 SDK 导入，优先使用专用配置子路径，而不是宽泛的 `openclaw/plugin-sdk/config-runtime` 兼容性桶文件：使用 `config-contracts` 获取类型，使用 `plugin-config-runtime` 执行已加载配置断言、插件入口查找和规范配置合并，使用 `runtime-config-snapshot` 获取当前进程快照，并使用 `config-mutation` 执行写入。内置插件测试应直接模拟这些专用子路径，而不是模拟宽泛的兼容性桶文件。

OpenClaw 内部运行时代码也遵循同一方向：在 CLI、Gateway 网关或进程边界加载一次配置，然后将该值向下传递。成功的变更写入会刷新进程运行时快照，并推进其内部修订版本；长生命周期缓存应以运行时拥有的缓存键为依据，而不是在本地序列化配置。针对长生命周期运行时模块，系统使用零容忍扫描器检测环境式 `loadConfig()` 调用；请改用传入的 `cfg`、请求中的 `context.getRuntimeConfig()`，或在明确的进程边界使用 `getRuntimeConfig()`。

提供商和渠道执行路径必须使用当前运行时配置快照，而不是为配置回读或编辑而返回的文件快照。文件快照会保留 SecretRef 标记等源值，以供 UI 和写入使用；提供商回调需要已解析的运行时视图。当辅助函数可能接收到当前源快照或当前运行时快照时，请先通过 `selectApplicableRuntimeConfig()` 路由，再读取凭据。

## 可复用的运行时实用程序

对机器人生成的入站消息使用入站 `botLoopProtection` 事实。核心会在记录会话和分发前应用共享的内存滑动窗口守卫，而不会将该策略绑定到单一渠道。该守卫跟踪 `(scopeId, conversationId, participant pair)` 键，将一对实体双向的事件合并计数，在超过窗口预算后应用冷却期，并择机清理不活跃的条目。

向操作员公开此行为的渠道插件应优先使用共享的 `channels.defaults.botLoopProtection` 结构作为基准预算，然后在其上叠加渠道/提供商特定的覆盖值。共享配置使用秒，因为它面向用户：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

随已解析的轮次传入规范化的机器人配对事实。核心负责解析默认值、单位转换和 `enabled` 语义：

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

仅对于不经过共享入站回复运行器的自定义
双方事件循环，才直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

## 运行时命名空间

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent 身份、目录和会话管理。

    ```typescript
    // 解析 Agent 的工作目录（必须提供 agentId）
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // 解析 Agent 工作区
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // 获取 Agent 身份
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // 获取默认思考级别
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // 根据当前提供商配置文件验证用户提供的思考级别
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // 将级别传递给嵌入式运行
    }

    // 获取 Agent 超时时间
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // 确保工作区存在
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 运行嵌入式 Agent 轮次
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "总结最新更改",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` 是从插件代码启动普通 OpenClaw Agent 轮次的中立辅助函数。它使用与渠道触发的回复相同的提供商/模型解析和 Agent harness 选择方式。

    `runEmbeddedPiAgent(...)` 仍作为现有插件的已弃用兼容性别名保留。新代码应使用 `runEmbeddedAgent(...)`。

    `resolveThinkingPolicy(...)` 返回提供商/模型支持的思考级别及可选默认值。提供商插件通过其思考钩子拥有模型特定配置文件，因此工具插件应调用此运行时辅助函数，而不是导入或复制提供商列表。

    `normalizeThinkingLevel(...)` 会将 `on`、`x-high` 或 `extra high` 等用户文本转换为规范的存储级别，然后再根据已解析策略进行检查。

    **会话存储辅助函数**位于 `api.runtime.agent.session` 下：

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // 在不依赖旧版 sessions.json 结构的情况下遍历会话行。
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // 创建或更新会话，然后将 signal 传递给已准入的 Agent 运行。
      },
    );
    ```

    会话工作流应优先使用 `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。这些辅助函数通过 Agent/会话身份定位会话，因此插件不依赖旧版 `sessions.json` 存储结构。对于不应刷新会话活动的纯元数据补丁，请使用 `preserveActivity: true`；仅当回调返回完整条目且已删除字段必须保持删除状态时，才使用 `replaceEntry: true`。Doctor 和迁移路径可以组合使用 `fallbackEntry`、`skipMaintenance` 和 `requireWriteSuccess`，以原子方式完成一次规范存储修复。

    `createSessionEntry(...)` 会创建新的规范会话行和对话记录。其可信的 `initialEntry` 接口刻意保持精简：一个非空的 `agentHarnessId`、可选的 `modelSelectionLocked: true` 和可选的 `pluginExtensions`。通过 `registerAgentHarness(...)`，注入的运行时仅接受调用插件拥有的 harness ID；这是所有权不变量，而不是进程内插件之间的沙箱。它会拒绝已存在的行；`label` 和 `spawnedCwd` 是独立的创建字段，而不是可信条目补丁。

    创建过程通过 `afterCreate` 持有会话生命周期变更栅栏，因此新工作会等待插件拥有的初始化完成，而预先存在的已准入工作会导致创建失败。回调会接收到已创建状态的克隆。如果回调返回补丁，该补丁只能包含 `pluginExtensions`，且其值是完整的最终 `pluginExtensions` 字段。回调或最终持久化失败会回滚未发生变化的新行和对话记录；受保护的回滚会保留被并发更改或认领的行。`recoverMatchingInitialEntry: true` 仅用于在持久化的可信字段完全匹配时重试中断的初始化，并且恢复要求 `afterCreate` 返回最终补丁。

    当插件开始处理持久化会话时，请使用 `runWithWorkAdmission(...)`。该回调会拒绝已归档或被并发替换的会话，使归档/重置/删除变更在完成前保持协调，并接收必须转发给 Agent 运行的 `AbortSignal`。harness 可以通过其实验性 `delegatedExecutionPluginIds` 注册字段明确指定可信执行委托方。委托方只能准入并运行完全匹配的、已存在且模型锁定的会话；所有会话变更仍仅限于 harness 所有者。请参阅 [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness#delegated-execution)。

    维护和修复插件可以对单个限定范围的会话条目使用 `deleteSessionEntry(...)`，对生命周期拥有的临时会话使用 `cleanupSessionLifecycleArtifacts(...)`，并在变更存储前使用 `resolveSessionStoreBackupPaths(...)`。这些辅助函数是精简的修复/生命周期接口，并非通用的存储删除 API。

    `resolveStorePath(...)` 和 `updateSessionStoreEntry(...)` 补全了会话辅助函数：`resolveStorePath` 可解析给定作用域的会话存储路径，而当调用方已知存储路径时，`updateSessionStoreEntry({ storePath, sessionKey, update })` 可直接修补其中一个条目。

    `loadTranscriptEventsSync(...)` 可用于无法使用异步转录运行时的同步 Doctor 和修复路径。它返回原始 `SessionStoreTranscriptEvent` 记录。常规插件运行时代码应优先使用 `openclaw/plugin-sdk/session-transcript-runtime`。

    `formatSqliteSessionFileMarker(...)`、`parseSqliteSessionFileMarker(...)` 和 `sqliteSessionFileMarkerMatchesSession(...)` 是过渡辅助函数，适用于仍接收名为 `sessionFile` 的旧字段的代码。解析后的 SQLite 标记标识一个实时 SQLite 转录目标；它不是文件系统路径。新 API 应传递类型化的会话身份，而不是标记字符串。

    对于转录读写，请导入 `openclaw/plugin-sdk/session-transcript-runtime`，并将 `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`readVisibleSessionTranscriptMessageEntries(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)` 或 `withSessionTranscriptWriteLock(...)` 与 `{ agentId, sessionKey, sessionId }` 配合使用。这些 API 让插件无需依赖活动转录文件路径，即可标识转录、读取原始事件或对分支安全的可见消息条目、追加消息、发布更新，并在同一转录写入锁下执行相关操作。`readVisibleSessionTranscriptMessageEntries(...)` 返回有序的读取元数据；其 `seq` 字段不是可恢复游标。

    旧版完整存储和活动转录文件辅助函数不再从插件 SDK 导出。会话元数据应使用作用域条目辅助函数，活动转录操作应使用转录身份辅助函数。需要文件工件的归档/支持工作流应使用其专用归档接口，而不是活动会话运行时 API。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    默认模型和提供商常量：

    ```typescript
    const model = api.runtime.agent.defaults.model; // 例如 "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // 例如 "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    运行由宿主拥有的文本补全，无需导入提供商内部实现，也无需
    重复 OpenClaw 的模型/身份验证/基础 URL 准备逻辑。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "总结此转录。" }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    在发出 HTTP 请求之前，提供商编排还可以获取已配置本地服务的
    生命周期：

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // 发送并完整消费提供商请求。
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` 是稳定、通用的提供商服务 SDK
    契约。宿主从
    `models.providers.<providerId>.localService` 解析进程配置；调用方不能提供
    命令、参数、环境或生命周期策略。进程生成、
    就绪状态、诊断和空闲停止策略仍由宿主内部管理。

    传入准确的已配置提供商 ID 和解析后的请求基础 URL。不要
    将别名替换为适配器 ID：不同别名可能指向不同的
    本地 GPU 主机。除 Ollama 和 LM
    Studio 适配器使用的 `/v1` 规范化外，宿主会拒绝与已配置
    提供商基础 URL 不匹配的端点。启动串行化、就绪探测、
    请求租约、中止处理和空闲关闭均由宿主管理。

    此辅助函数使用与 OpenClaw
    内置运行时相同的简单补全准备路径和宿主拥有的运行时配置快照。上下文引擎
    会接收绑定到会话的 `llm.complete` 能力，因此模型调用使用
    活动会话的智能体，而不会静默回退到默认智能体。在可用时，
    结果包含提供商/模型/智能体归属，以及规范化的 token、
    缓存和预估成本用量。

    <Warning>
    模型覆盖需要操作员通过配置中的 `plugins.entries.<id>.llm.allowModelOverride: true` 明确启用。使用 `plugins.entries.<id>.llm.allowedModels` 将可信插件限制为特定的规范 `provider/model` 目标。跨智能体补全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    在进程内调用另一个 Gateway 网关方法，同时保留当前插件的可信运行时
    身份。此功能面向内置或可信的官方插件，让它们能够组合插件拥有的
    Gateway 网关能力，而无需建立 local loopback WebSocket 连接。

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    请求使用 `operator.write` 权限范围，且不会授予管理员权限范围。来自任意外部
    插件的调用会被拒绝。方法失败时会抛出 `GatewayClientRequestError`，并保留结构化的
    `details`、重试元数据和 Gateway 网关错误代码，以供恢复流程使用。对于也能在独立智能体进程中运行的工具，请先使用 `isAvailable()`
    再选择此路径。

  </Accordion>
  <Accordion title="api.runtime.subagent">
    启动和管理后台子智能体运行。

    ```typescript
    // 启动子智能体运行
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "将此查询扩展为重点明确的后续搜索。",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // 可选覆盖
      model: "gpt-5.6-sol", // 可选覆盖
      deliver: false,
    });

    // 等待完成
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // 读取会话消息
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // 删除会话
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    模型覆盖（`provider`/`model`）需要操作员通过配置中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 明确启用。不可信插件仍可运行子智能体，但覆盖请求会被拒绝。
    </Warning>

    `toolsAlsoAllow` 会将调用插件注册且由其唯一拥有的精确工具添加到工作进程的常规工具接口中。运行时会拒绝核心工具以及与其他插件共享名称的工具。配置文件和操作员工具策略仍然适用，包括显式允许列表和拒绝规则。

    `deleteSession(...)` 可以删除同一插件通过 `api.runtime.subagent.run(...)` 创建的会话。删除任意用户或操作员会话仍需要具有管理员权限范围的 Gateway 网关请求。

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    检查智能体会话的有效沙箱工作区权限。

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    结果会报告此会话是否经过沙箱隔离、其工作区是否
    不可用、只读或可写，以及当有效的 Docker、工具、会话、浏览器或提升权限策略可以
    逃逸该工作区时提供可选的 `confinementError`。
    对于必须确保不向工作进程授予高于调用方权限的宿主委派决策，请使用此辅助函数。
    它是证明辅助函数，不能替代对调用方自身授权的检查。

    `prepareWorkspaceAuthority(...)` 执行相同的策略检查，并且还会
    为 `workspaceDir` 准备 Docker 沙箱。如果热容器的
    实时配置哈希与请求的挂载或策略不匹配，它会拒绝该容器。仅传入由调用插件
    限制其注册实现的精确工具名称；
    通配符前缀不能证明工具所有权。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    从 Gateway 网关加载的插件代码或插件 CLI 命令中列出已连接节点并调用节点宿主命令。当插件拥有配对设备上的本地工作时使用此功能，例如另一台 Mac 上的浏览器或音频桥接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    当节点向智能体公开由插件或 MCP 支持的
    工具时，`nodes.list(...)` 会包含每个已连接节点公布的
    `nodePluginTools` 描述符。这些描述符是实时连接状态：节点
    断开连接时，Gateway 网关会丢弃它们；本地插件/MCP 清单发生变化后，节点可以通过
    `node.pluginTools.update` 替换它们。

    在 Gateway 网关内部，此运行时位于进程内。在插件 CLI 命令中，它通过 RPC 调用已配置的 Gateway 网关，因此 `openclaw googlemeet recover-tab` 等命令可以从终端检查已配对节点。节点命令仍会经过常规的 Gateway 网关节点配对、命令允许列表、插件节点调用策略以及节点本地命令处理。

    公开节点托管智能体工具的插件可以为应默认加入允许列表的非危险命令设置 `agentTool.defaultPlatforms`。如果必须由操作员通过 `gateway.nodes.allowCommands` 明确启用，请省略它。危险的节点宿主命令应使用 `api.registerNodeInvokePolicy(...)` 注册节点调用策略；该策略在 Gateway 网关中运行，执行时机是在命令允许列表检查之后、命令转发到节点之前，因此直接 `node.invoke` 调用、节点托管的插件工具和更高层插件工具会共享同一执行路径。

    <Warning>
    可选的 `scopes` 字段为调用请求 Gateway 网关操作员权限范围。OpenClaw 仅对内置插件和可信的官方插件安装执行此请求；其他插件的请求不会提升调用权限。仅当可信插件必须使用更严格的 Gateway 网关权限范围（例如 `operator.admin`）调用节点命令时才使用它。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    将 Task Flow 和 Task Run 状态绑定到现有 OpenClaw 会话键或可信工具上下文。

    - `api.runtime.tasks.managedFlows` 支持变更操作：创建、推进和取消 Task Flow。
    - `api.runtime.tasks.flows` 和 `api.runtime.tasks.runs` 是用于列表和状态查询的只读 DTO 视图；两者均公开 `bindSession(...)` / `fromToolContext(...)`，以及 `get`、`list`、`findLatest` 和 `resolve`。
    - `api.runtime.tasks.flow` 是 `managedFlows` 的已弃用别名。

    Task Flow 跟踪持久化的多步骤工作流状态。它不是调度器：
    对未来的
    唤醒使用 Cron 或 `api.session.workflow.scheduleSessionTurn(...)`，然后当相应工作
    需要流程状态、子任务、等待或取消时，在计划轮次中使用 `managedFlows`。

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "审查新的拉取请求",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "审查 PR #123",
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

    当你已从自己的绑定层获得可信的 OpenClaw 会话密钥时，请使用 `bindSession({ sessionKey, requesterOrigin })`。不要根据原始用户输入进行绑定。

  </Accordion>
  <Accordion title="api.runtime.tts">
    文本转语音合成。

    ```typescript
    // 标准 TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "来自 OpenClaw 的问候",
      cfg: api.config,
    });

    // 针对电话场景优化的 TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "来自 OpenClaw 的问候",
      cfg: api.config,
    });

    // 列出可用语音
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    使用核心 `messages.tts` 配置和提供商选择。返回 PCM 音频缓冲区和采样率。`textToSpeechStream` 也可用于流式合成。

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
      mime: "audio/ogg", // 可选，用于无法推断 MIME 的情况
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

    // 通过指定的提供商/模型进行结构化图像提取。
    // 至少包含一张图像；文本输入作为补充上下文。
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "优先采用打印的总额，而不是手写备注。" },
      ],
      instructions: "提取商家、总额和可搜索的标签。",
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

    未产生输出时（例如跳过了输入），返回 `{ text: undefined }`。

    `describeImageFileWithModel(...)` 通过指定的提供商/模型描述已知图像，并绕过 `describeImageFile(...)` 使用的默认活动模型解析。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍作为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容性别名保留。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    图像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "一个正在绘制日落的机器人",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    视频生成，其结构与图像生成相同。

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "日出时分飞越海岸线的无人机镜头",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    音乐生成，其结构与图像生成相同。

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "适合编程时聆听的欢快 lo-fi 曲目",
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
      args: { query: "OpenClaw 插件 SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    底层媒体工具。

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "图像"
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
    当前运行时配置快照和事务式配置写入。优先使用
    已传入活动调用路径的配置；仅当处理程序需要直接获取进程快照时，
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
    它会记录写入者的意图，而不会从 Gateway 网关手中夺走重启控制权。

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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // 已弃用的兼容性别名。
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` 会立即运行单个 Heartbeat 周期，绕过常规的合并计时器。传入 `{ heartbeat: { target: "last" } }` 可强制将内容投递到最后一个活动渠道，而不是采用默认的 `target: "none"` 抑制行为。

    `runCommandWithTimeout(...)` 返回捕获的 `stdout` 和 `stderr`、可选的
    截断计数、`code`、`signal`、`killed`、`termination` 和
    `noOutputTimedOut`。当子进程未提供非零退出代码时，超时和无输出超时结果会报告 `code: 124`。
    非超时的信号退出仍可能返回 `code: null`，因此请使用 `termination` 和
    `noOutputTimedOut` 区分超时原因。

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
    模型和提供商身份验证解析。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // 可直接用于请求的身份验证，包括提供商运行时交换（例如 OAuth 刷新）
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状态目录解析和由 SQLite 支持的键控存储。

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "你好" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "第一个" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    键控存储可跨重启保留，并按运行时绑定的插件 ID 隔离。使用 `registerIfAbsent(...)` 进行原子去重声明：如果键不存在或已过期并成功注册，则返回 `true`；如果已存在有效值，则返回 `false`，且不会覆盖其值、创建时间或 TTL。限制：每个命名空间 `maxEntries`，每个插件 50,000 个有效行，JSON 值小于 64KB，并支持可选的 TTL 到期。默认情况下，在达到任一行数限制时进行写入，会从正在写入的命名空间中移除最旧的有效行；该次写入不会驱逐同级命名空间中的行，如果命名空间无法释放足够的行，写入仍会失败。对于绝不能被驱逐的持久所有权记录，请设置 `overflowPolicy: "reject-new"`：达到任一限制时，新键会写入失败，而现有键仍可更新。

    `openSyncKeyedStore<T>(...)` 返回具有同步方法的相同存储结构（`register`、`registerIfAbsent`、`lookup`、`consume`、`clear` 均直接返回值，而不是 Promise），供无法使用 await 的调用方使用。

    `openChannelIngressQueue<TPayload>(...)` 会打开一个限定于调用插件的持久化入口队列，用于缓冲需要在重启后进行至少一次处理的入站事件。当过期声明恢复使用 `shouldRecover` 时，如果损坏的已声明载荷应被隔离，还需提供 `shouldRecoverCorrupt`：其独立于载荷的声明标识可让插件在队列将该行标记为墓碑之前，保留有效的所有者和通道策略。

    <Warning>
    在此版本中，`openKeyedStore`、`openSyncKeyedStore` 和 `openChannelIngressQueue` 仅适用于内置插件和受信任的官方插件安装。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    渠道专用运行时辅助函数（加载渠道插件后可用）。按关注点分组：

    | 分组 | 用途 |
    | --- | --- |
    | `text` | 分块（`chunkText`、`chunkMarkdownText`、`resolveChunkMode`）、控制命令检测、Markdown 表格转换。 |
    | `reply` | 缓冲块回复分发、信封格式化、有效消息/人类延迟配置解析。 |
    | `routing` | `buildAgentSessionKey`、`resolveAgentRoute`。 |
    | `pairing` | `buildPairingReply`、允许列表读取、配对请求更新插入。 |
    | `media` | 远程媒体下载/保存（见下文）。 |
    | `activity` | 记录/读取最近的渠道活动。 |
    | `session` | 从入站事件获取会话元数据、更新最近路由。 |
    | `mentions` | 提及策略辅助函数（见下文）。 |
    | `reactions` | 用于进行中处理指示器的确认表情回应句柄。 |
    | `groups` | 群组策略和必须提及解析。 |
    | `debounce` | 入站消息防抖。 |
    | `commands` | 命令授权和文本命令门控。 |
    | `outbound` | 加载渠道的出站适配器。 |
    | `inbound` | 构建入站事件上下文并运行共享的入站事件/回复内核。 |
    | `threadBindings` | 调整绑定会话线程的空闲超时/最大存续时间。 |
    | `runtimeContexts` | 注册、读取和监视进程本地的按渠道/账户/能力划分的上下文。 |

    `api.runtime.channel.media` 是渠道媒体下载和存储的首选接口：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    当远程 URL 应转换为 OpenClaw 媒体时，使用 `saveRemoteMedia(...)`。当插件已使用插件自有的身份验证、重定向或允许列表处理获取 `Response` 时，使用 `saveResponseMedia(...)`。仅当插件需要原始字节以进行检查、转换、解密或重新上传时，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已弃用兼容别名。

    `api.runtime.channel.mentions` 是使用运行时注入的内置渠道插件所共享的入站提及策略接口：

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

    `api.runtime.channel.mentions` 有意不公开旧版 `resolveMentionGating*` 兼容辅助函数。应优先使用规范化的 `{ facts, policy }` 路径。

    `reply`、`session` 和 `inbound` 下的多个字段带有按字段设置的 `@deprecated` 注释，指向当前的渠道轮次内核或渠道出站适配器；在基于某个辅助函数构建新代码前，请查看该辅助函数的内联 JSDoc。

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
运行时存储标识应优先使用 `pluginId`。较底层的 `key` 形式适用于一个插件有意需要多个运行时槽位的少见情况。
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
  当前配置快照（可用时为内存中活动的运行时快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  来自 `plugins.entries.<id>.config` 的插件专用配置。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  作用域限定的日志记录器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  当前加载模式：`"full"`（实时激活）、`"discovery"` / `"tool-discovery"`（只读能力发现）、`"setup-only"`（轻量级设置入口）、`"setup-runtime"`（还需要运行时渠道入口的设置流程），或 `"cli-metadata"`（CLI 命令元数据收集）。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相对于插件根目录的路径。
</ParamField>

## 相关内容

- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和注册表
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 子路径参考
