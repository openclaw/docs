---
read_when:
    - 你正在为一个插件编写测试
    - 你需要来自插件 SDK 的测试工具
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具与模式
title: 插件测试
x-i18n:
    generated_at: "2026-04-28T02:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 976d106b636ee0e18aafdd5c970dd7de4b498773e607e7b3be60b23cecadd81f
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw 插件的测试工具、模式和 lint 强制规则参考。

<Tip>
  **在找测试示例？** 操作指南中包含了完整的测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test) 和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

**插件 API mock 导入：** `openclaw/plugin-sdk/plugin-test-api`

**Agent 运行时契约导入：** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**渠道契约导入：** `openclaw/plugin-sdk/channel-contract-testing`

**渠道测试辅助导入：** `openclaw/plugin-sdk/channel-test-helpers`

**渠道目标测试导入：** `openclaw/plugin-sdk/channel-target-testing`

**插件契约导入：** `openclaw/plugin-sdk/plugin-test-contracts`

**插件运行时测试导入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供商契约导入：** `openclaw/plugin-sdk/provider-test-contracts`

**提供商 HTTP mock 导入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**环境/网络测试导入：** `openclaw/plugin-sdk/test-env`

**通用 fixture 导入：** `openclaw/plugin-sdk/test-fixtures`

**Node 内置模块 mock 导入：** `openclaw/plugin-sdk/test-node-mocks`

新插件测试优先使用下面这些更聚焦的子路径。较宽泛的
`openclaw/plugin-sdk/testing` barrel 仅用于旧版兼容。

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### 可用导出

| 导出项 | 用途 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi` | 为直接注册单元测试构建最小化的插件 API mock。导入自 `plugin-sdk/plugin-test-api` |
| `AUTH_PROFILE_RUNTIME_CONTRACT` | 用于原生智能体运行时适配器的共享认证配置契约 fixture。导入自 `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT` | 用于原生智能体运行时适配器的共享投递抑制契约 fixture。导入自 `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT` | 用于原生智能体运行时适配器的共享回退分类契约 fixture。导入自 `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool` | 为原生运行时契约测试构建动态工具 schema fixture。导入自 `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract` | 断言渠道入站上下文的结构。导入自 `plugin-sdk/channel-contract-testing` |
| `installChannelOutboundPayloadContractSuite` | 安装渠道出站负载契约测试套件。导入自 `plugin-sdk/channel-contract-testing` |
| `createStartAccountContext` | 构建渠道账户生命周期上下文。导入自 `plugin-sdk/channel-test-helpers` |
| `installChannelActionsContractSuite` | 安装通用渠道消息操作契约测试套件。导入自 `plugin-sdk/channel-test-helpers` |
| `installChannelSetupContractSuite` | 安装通用渠道设置契约测试套件。导入自 `plugin-sdk/channel-test-helpers` |
| `installChannelStatusContractSuite` | 安装通用渠道 Status 契约测试套件。导入自 `plugin-sdk/channel-test-helpers` |
| `expectDirectoryIds` | 从目录列表函数中断言渠道目录 id。导入自 `plugin-sdk/channel-test-helpers` |
| `assertBundledChannelEntries` | 断言内置渠道入口点暴露了预期的公开契约。导入自 `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp` | 格式化确定性的信封时间戳。导入自 `plugin-sdk/channel-test-helpers` |
| `expectPairingReplyText` | 断言渠道配对回复文本并提取其中的代码。导入自 `plugin-sdk/channel-test-helpers` |
| `describePluginRegistrationContract` | 安装插件注册契约检查。导入自 `plugin-sdk/plugin-test-contracts` |
| `registerSingleProviderPlugin` | 在加载器冒烟测试中注册一个提供商插件。导入自 `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugin` | 从单个插件中捕获所有提供商类型。导入自 `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugins` | 跨多个插件捕获提供商注册。导入自 `plugin-sdk/plugin-test-runtime` |
| `requireRegisteredProvider` | 断言提供商集合中包含某个 id。导入自 `plugin-sdk/plugin-test-runtime` |
| `createRuntimeEnv` | 构建一个 mock 的 CLI/插件运行时环境。导入自 `plugin-sdk/plugin-test-runtime` |
| `createPluginSetupWizardStatus` | 为渠道插件构建设置向导 Status 辅助工具。导入自 `plugin-sdk/plugin-test-runtime` |
| `describeOpenAIProviderRuntimeContract` | 安装提供商家族运行时契约检查。导入自 `plugin-sdk/provider-test-contracts` |
| `expectPassthroughReplayPolicy` | 断言提供商重放策略会透传由提供商拥有的工具和元数据。导入自 `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest` | 使用共享音频 fixture 运行实时 STT 提供商的实时测试。导入自 `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch` | 在模糊断言前标准化实时转录输出。导入自 `plugin-sdk/provider-test-contracts` |
| `expectExplicitVideoGenerationCapabilities` | 断言视频提供商声明了明确的生成模式能力。导入自 `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities` | 断言音乐提供商声明了明确的生成/编辑能力。导入自 `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask` | 安装一个成功的 DashScope 兼容视频任务响应。导入自 `plugin-sdk/provider-test-contracts` |
| `getProviderHttpMocks` | 访问按需启用的提供商 HTTP/认证 Vitest mock。导入自 `plugin-sdk/provider-http-test-mocks` |
| `installProviderHttpMockCleanup` | 在每个测试后重置提供商 HTTP/认证 mock。导入自 `plugin-sdk/provider-http-test-mocks` |
| `installCommonResolveTargetErrorCases` | 目标解析错误处理的共享测试用例。导入自 `plugin-sdk/channel-target-testing` |
| `shouldAckReaction` | 检查渠道是否应添加 ack 反应。导入自 `plugin-sdk/channel-feedback` |
| `removeAckReactionAfterReply` | 在回复送达后移除 ack 反应。导入自 `plugin-sdk/channel-feedback` |
| `createTestRegistry` | 构建渠道插件注册表 fixture。导入自 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` |
| `createEmptyPluginRegistry` | 构建空插件注册表 fixture。导入自 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` |
| `setActivePluginRegistry` | 为插件运行时测试安装注册表 fixture。导入自 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch` | 在媒体辅助工具测试中捕获 JSON fetch 请求。导入自 `plugin-sdk/test-env` |
| `withServer` | 在可销毁的本地 HTTP 服务器上运行测试。导入自 `plugin-sdk/test-env` |
| `createMockIncomingRequest` | 构建最小化的入站 HTTP 请求对象。导入自 `plugin-sdk/test-env` |
| `withFetchPreconnect` | 在安装了 preconnect 钩子的情况下运行 fetch 测试。导入自 `plugin-sdk/test-env` |
| `withEnv` / `withEnvAsync` | 临时修改环境变量。导入自 `plugin-sdk/test-env` |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 创建隔离的文件系统测试 fixture。导入自 `plugin-sdk/test-env` |
| `createMockServerResponse` | 创建最小化的 HTTP 服务器响应 mock。导入自 `plugin-sdk/test-env` |
| `createCliRuntimeCapture` | 在测试中捕获 CLI 运行时输出。导入自 `plugin-sdk/test-fixtures` |
| `importFreshModule` | 使用全新的查询令牌导入一个 ESM 模块，以绕过模块缓存。导入自 `plugin-sdk/test-fixtures` |
| `bundledPluginRoot` / `bundledPluginFile` | 解析内置插件源码或 dist fixture 路径。导入自 `plugin-sdk/test-fixtures` |
| `mockNodeBuiltinModule` | 安装窄范围的 Node 内置模块 Vitest mock。导入自 `plugin-sdk/test-node-mocks` |
| `createSandboxTestContext` | 构建沙箱测试上下文。导入自 `plugin-sdk/test-fixtures` |
| `writeSkill` | 写入 Skills fixture。导入自 `plugin-sdk/test-fixtures` |
| `makeAgentAssistantMessage` | 构建智能体转录消息 fixture。导入自 `plugin-sdk/test-fixtures` |
| `peekSystemEvents` / `resetSystemEventsForTest` | 检查并重置系统事件 fixture。导入自 `plugin-sdk/test-fixtures` |
| `sanitizeTerminalText` | 清理终端输出以便断言。导入自 `plugin-sdk/test-fixtures` |
| `countLines` / `hasBalancedFences` | 断言分块输出的结构。导入自 `plugin-sdk/test-fixtures` |
| `runProviderCatalog` | 使用测试依赖执行提供商目录钩子 |
| `resolveProviderWizardOptions` | 在契约测试中解析提供商设置向导选项 |
| `resolveProviderModelPickerEntries` | 在契约测试中解析提供商模型选择器条目 |
| `buildProviderPluginMethodChoice` | 为断言构建提供商向导选择 id |
| `setProviderWizardProvidersResolverForTest` | 为隔离测试注入提供商向导提供商 |
| `createProviderUsageFetch` | 构建提供商用量 fetch fixture |
| `useFrozenTime` / `useRealTime` | 为时间敏感测试冻结并恢复计时器。导入自 `plugin-sdk/test-env` |
| `createTestWizardPrompter` | 构建一个 mock 的设置向导提示器 |
| `createRuntimeTaskFlow` | 创建隔离的运行时任务流状态 |
| `typedCases` | 为表驱动测试保留字面量类型。导入自 `plugin-sdk/test-fixtures` |

内置插件契约测试套件也会使用 SDK 测试子路径中的仅测试用注册表、manifest、公共产物和运行时 fixture 辅助工具。依赖 OpenClaw 内置清单的仅核心测试套件仍保留在 `src/plugins/contracts` 下。
新的扩展测试应放在有文档说明的聚焦 SDK 子路径上，例如
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是导入宽泛的
`plugin-sdk/testing` 兼容 barrel、仓库的 `src/**` 文件，或直接导入仓库的
`test/helpers/*` 桥接层。

### 类型

聚焦的测试子路径也会重新导出对测试文件有用的类型：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为渠道目标解析添加标准错误用例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel 目标解析", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 你的渠道目标解析逻辑
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 添加渠道特定的测试用例
  it("应解析 @username 目标", () => {
    // ...
  });
});
```

## 测试模式

### 测试注册契约

把手写的 `api` mock 传给 `register(api)` 的单元测试，并不会覆盖
OpenClaw 加载器的接入门槛检查。对于你的插件依赖的每个注册表面，至少添加一个基于加载器的冒烟测试，尤其是钩子和诸如 memory 这类独占能力。

真实加载器会在缺少必需元数据时拒绝插件注册，或者在插件调用了并不归它所有的能力 API 时拒绝注册。例如，
`api.registerHook(...)` 需要提供钩子名称，而
`api.registerMemoryCapability(...)` 则要求插件 manifest 或导出的入口声明
`kind: "memory"`。

### 测试运行时配置访问

在测试内置渠道插件时，优先使用来自 `openclaw/plugin-sdk/channel-test-helpers`
的共享插件运行时 mock。其已弃用的 `runtime.config.loadConfig()` 和
`runtime.config.writeConfigFile(...)` mock 默认会抛错，这样测试就能捕获对兼容 API 的新使用。只有当测试明确覆盖旧版兼容行为时，才应重写这些 mock。

### 渠道插件的单元测试

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel 插件", () => {
  it("应从配置中解析账户", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("应在不实体化密钥的情况下检查账户", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // 不暴露 token 值
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 提供商插件的单元测试

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider 插件", () => {
  it("应解析动态模型", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("在 API key 可用时应返回目录", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mock 插件运行时

对于使用 `createPluginRuntimeStore` 的代码，在测试中 mock 运行时：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// 在测试设置中
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 其他 mock
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... 其他命名空间
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 测试后
store.clearRuntime();
```

### 使用按实例 stub 进行测试

优先使用按实例 stub，而不是修改原型：

```typescript
// 推荐：按实例 stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：修改原型
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契约测试（仓库内插件）

内置插件带有用于验证注册归属的契约测试：

```bash
pnpm test -- src/plugins/contracts/
```

这些测试会断言：

- 哪些插件注册了哪些提供商
- 哪些插件注册了哪些语音提供商
- 注册结构是否正确
- 是否符合运行时契约

### 运行特定范围的测试

针对某个特定插件：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

仅运行契约测试：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## lint 强制规则（仓库内插件）

对仓库内插件，`pnpm check` 会强制执行三条规则：

1. **禁止整体根导入** —— 会拒绝 `openclaw/plugin-sdk` 根 barrel
2. **禁止直接导入 `src/`** —— 插件不能直接导入 `../../src/`
3. **禁止自导入** —— 插件不能导入自己的 `plugin-sdk/<name>` 子路径

外部插件不受这些 lint 规则约束，但仍建议遵循相同模式。

## 测试配置

OpenClaw 使用 Vitest，并基于 V8 覆盖率阈值。对于插件测试：

```bash
# 运行所有测试
pnpm test

# 运行特定插件测试
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 使用特定测试名称过滤器运行
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# 带覆盖率运行
pnpm test:coverage
```

如果本地运行导致内存压力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 导入约定
- [SDK 渠道插件](/zh-CN/plugins/sdk-channel-plugins) -- 渠道插件接口
- [SDK 提供商插件](/zh-CN/plugins/sdk-provider-plugins) -- 提供商插件钩子
- [构建插件](/zh-CN/plugins/building-plugins) -- 入门指南
