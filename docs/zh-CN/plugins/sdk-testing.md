---
read_when:
    - 你正在为一个插件编写测试
    - 你需要来自插件 SDK 的测试工具
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具与模式
title: 插件测试
x-i18n:
    generated_at: "2026-04-28T02:31:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 624b0ea8c50cdb8deaf275654a3ea9211fc8b1b520b596ebebc791e22453689a
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw 插件的测试工具、模式与 lint 强制规则参考。

<Tip>
  **在找测试示例吗？** 操作指南包含可直接参考的测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test) 和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

**插件 API mock 导入：** `openclaw/plugin-sdk/plugin-test-api`

**渠道契约导入：** `openclaw/plugin-sdk/channel-contract-testing`

**渠道测试辅助工具导入：** `openclaw/plugin-sdk/channel-test-helpers`

**渠道目标测试导入：** `openclaw/plugin-sdk/channel-target-testing`

**插件契约导入：** `openclaw/plugin-sdk/plugin-test-contracts`

**插件运行时测试导入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供商契约导入：** `openclaw/plugin-sdk/provider-test-contracts`

**提供商 HTTP mock 导入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**环境/网络测试导入：** `openclaw/plugin-sdk/test-env`

**通用夹具导入：** `openclaw/plugin-sdk/test-fixtures`

**Node 内置模块 mock 导入：** `openclaw/plugin-sdk/test-node-mocks`

为新的插件测试优先使用下面这些更聚焦的子路径。宽泛的
`openclaw/plugin-sdk/testing` barrel 仅用于兼容旧版。

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
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

| 导出 | 用途 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi` | 为直接注册单元测试构建最小化的插件 API mock。从 `plugin-sdk/plugin-test-api` 导入 |
| `expectChannelInboundContextContract` | 断言渠道入站上下文的结构。从 `plugin-sdk/channel-contract-testing` 导入 |
| `installChannelOutboundPayloadContractSuite` | 安装渠道出站负载契约测试用例。从 `plugin-sdk/channel-contract-testing` 导入 |
| `createStartAccountContext` | 构建渠道账户生命周期上下文。从 `plugin-sdk/channel-test-helpers` 导入 |
| `installChannelActionsContractSuite` | 安装通用渠道消息操作契约测试用例。从 `plugin-sdk/channel-test-helpers` 导入 |
| `installChannelSetupContractSuite` | 安装通用渠道设置契约测试用例。从 `plugin-sdk/channel-test-helpers` 导入 |
| `installChannelStatusContractSuite` | 安装通用渠道状态契约测试用例。从 `plugin-sdk/channel-test-helpers` 导入 |
| `expectDirectoryIds` | 从目录列表函数断言渠道目录 ID。从 `plugin-sdk/channel-test-helpers` 导入 |
| `assertBundledChannelEntries` | 断言内置渠道入口点暴露了预期的公开契约。从 `plugin-sdk/channel-test-helpers` 导入 |
| `formatEnvelopeTimestamp` | 格式化确定性的 envelope 时间戳。从 `plugin-sdk/channel-test-helpers` 导入 |
| `expectPairingReplyText` | 断言渠道配对回复文本并提取其中的代码。从 `plugin-sdk/channel-test-helpers` 导入 |
| `describePluginRegistrationContract` | 安装插件注册契约检查。从 `plugin-sdk/plugin-test-contracts` 导入 |
| `registerSingleProviderPlugin` | 在加载器冒烟测试中注册一个 provider 插件。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `registerProviderPlugin` | 从单个插件中捕获所有 provider 类型。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `registerProviderPlugins` | 跨多个插件捕获 provider 注册信息。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `requireRegisteredProvider` | 断言 provider 集合中包含某个 id。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `createRuntimeEnv` | 构建一个带 mock 的 CLI/插件运行时环境。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `createPluginSetupWizardStatus` | 为渠道插件构建设置向导状态辅助工具。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `describeOpenAIProviderRuntimeContract` | 安装 provider 家族运行时契约检查。从 `plugin-sdk/provider-test-contracts` 导入 |
| `expectPassthroughReplayPolicy` | 断言 provider 重放策略会透传 provider 自有工具和元数据。从 `plugin-sdk/provider-test-contracts` 导入 |
| `runRealtimeSttLiveTest` | 使用共享音频夹具运行实时 STT provider 的实时测试。从 `plugin-sdk/provider-test-contracts` 导入 |
| `normalizeTranscriptForMatch` | 在模糊断言前规范化实时转录输出。从 `plugin-sdk/provider-test-contracts` 导入 |
| `expectExplicitVideoGenerationCapabilities` | 断言视频 provider 明确声明生成模式能力。从 `plugin-sdk/provider-test-contracts` 导入 |
| `expectExplicitMusicGenerationCapabilities` | 断言音乐 provider 明确声明生成/编辑能力。从 `plugin-sdk/provider-test-contracts` 导入 |
| `mockSuccessfulDashscopeVideoTask` | 安装一个成功的、兼容 DashScope 的视频任务响应。从 `plugin-sdk/provider-test-contracts` 导入 |
| `getProviderHttpMocks` | 访问按需启用的 provider HTTP/auth Vitest mocks。从 `plugin-sdk/provider-http-test-mocks` 导入 |
| `installProviderHttpMockCleanup` | 在每个测试后重置 provider HTTP/auth mocks。从 `plugin-sdk/provider-http-test-mocks` 导入 |
| `installCommonResolveTargetErrorCases` | 用于目标解析错误处理的共享测试用例。从 `plugin-sdk/channel-target-testing` 导入 |
| `shouldAckReaction` | 检查渠道是否应添加 ack reaction。从 `plugin-sdk/channel-feedback` 导入 |
| `removeAckReactionAfterReply` | 在回复送达后移除 ack reaction。从 `plugin-sdk/channel-feedback` 导入 |
| `createTestRegistry` | 构建渠道插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入 |
| `createEmptyPluginRegistry` | 构建空的插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入 |
| `setActivePluginRegistry` | 为插件运行时测试安装注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入 |
| `createRequestCaptureJsonFetch` | 在媒体辅助工具测试中捕获 JSON fetch 请求。从 `plugin-sdk/test-env` 导入 |
| `withServer` | 使用一次性本地 HTTP 服务器运行测试。从 `plugin-sdk/test-env` 导入 |
| `createMockIncomingRequest` | 构建一个最小化的入站 HTTP 请求对象。从 `plugin-sdk/test-env` 导入 |
| `withFetchPreconnect` | 在安装 preconnect 钩子的情况下运行 fetch 测试。从 `plugin-sdk/test-env` 导入 |
| `withEnv` / `withEnvAsync` | 临时修补环境变量。从 `plugin-sdk/test-env` 导入 |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 创建隔离的文件系统测试夹具。从 `plugin-sdk/test-env` 导入 |
| `createMockServerResponse` | 创建一个最小化的 HTTP 服务器响应 mock。从 `plugin-sdk/test-env` 导入 |
| `createCliRuntimeCapture` | 在测试中捕获 CLI 运行时输出。从 `plugin-sdk/test-fixtures` 导入 |
| `importFreshModule` | 使用新的查询令牌导入一个 ESM 模块，以绕过模块缓存。从 `plugin-sdk/test-fixtures` 导入 |
| `bundledPluginRoot` / `bundledPluginFile` | 解析内置插件源码或 dist 夹具路径。从 `plugin-sdk/test-fixtures` 导入 |
| `mockNodeBuiltinModule` | 安装窄范围的 Node 内置模块 Vitest mocks。从 `plugin-sdk/test-node-mocks` 导入 |
| `createSandboxTestContext` | 构建沙箱测试上下文。从 `plugin-sdk/test-fixtures` 导入 |
| `writeSkill` | 写入 Skills 夹具。从 `plugin-sdk/test-fixtures` 导入 |
| `makeAgentAssistantMessage` | 构建智能体转录消息夹具。从 `plugin-sdk/test-fixtures` 导入 |
| `peekSystemEvents` / `resetSystemEventsForTest` | 检查并重置系统事件夹具。从 `plugin-sdk/test-fixtures` 导入 |
| `sanitizeTerminalText` | 清理终端输出以便断言。从 `plugin-sdk/test-fixtures` 导入 |
| `countLines` / `hasBalancedFences` | 断言分块输出的结构。从 `plugin-sdk/test-fixtures` 导入 |
| `runProviderCatalog` | 使用测试依赖执行 provider catalog 钩子 |
| `resolveProviderWizardOptions` | 在契约测试中解析 provider 设置向导选项 |
| `resolveProviderModelPickerEntries` | 在契约测试中解析 provider 模型选择器条目 |
| `buildProviderPluginMethodChoice` | 为断言构建 provider 向导选项 ID |
| `setProviderWizardProvidersResolverForTest` | 为隔离测试注入 provider 向导提供商 |
| `createProviderUsageFetch` | 构建 provider 用量 fetch 夹具 |
| `useFrozenTime` / `useRealTime` | 为时间敏感测试冻结并恢复计时器。从 `plugin-sdk/test-env` 导入 |
| `createTestWizardPrompter` | 构建一个带 mock 的设置向导提示器 |
| `createRuntimeTaskFlow` | 创建隔离的运行时任务流状态 |
| `typedCases` | 为表驱动测试保留字面量类型。从 `plugin-sdk/test-fixtures` 导入 |

内置插件契约测试套件也会使用 SDK 测试子路径，以获取仅用于测试的注册表、manifest、公共产物和运行时夹具辅助工具。依赖 OpenClaw 内置清单的仅核心测试套件仍保留在 `src/plugins/contracts` 下。
新的扩展测试应放在有文档说明的聚焦型 SDK 子路径上，例如
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/channel-test-helpers`、`plugin-sdk/plugin-test-contracts`、
`plugin-sdk/plugin-test-runtime`、`plugin-sdk/provider-test-contracts`、
`plugin-sdk/provider-http-test-mocks`、`plugin-sdk/test-env` 或
`plugin-sdk/test-fixtures`，而不是直接导入宽泛的 `plugin-sdk/testing`
兼容 barrel、仓库中的 `src/**` 文件，或仓库中的 `test/helpers/plugins/*`
桥接层。

### 类型

聚焦型测试子路径也会重新导出测试文件中有用的类型：

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

将手写的 `api` mock 传给 `register(api)` 的单元测试，并不会覆盖
OpenClaw 加载器的接入门槛。对于你的插件所依赖的每个注册表面，至少添加一个由加载器驱动的冒烟测试，尤其是 hooks 和 memory 这类排他性能力。

真实加载器会在缺少必需元数据，或插件调用了自己并不拥有的能力 API 时，拒绝插件注册。例如，
`api.registerHook(...)` 需要 hook 名称，而
`api.registerMemoryCapability(...)` 则要求插件 manifest 或导出的入口声明 `kind: "memory"`。

### 测试运行时配置访问

测试内置渠道插件时，优先使用来自 `openclaw/plugin-sdk/channel-test-helpers`
的共享插件运行时 mock。其中已弃用的 `runtime.config.loadConfig()` 和
`runtime.config.writeConfigFile(...)` mock 默认会抛错，这样测试就能捕获对兼容性 API 的新增使用。只有当测试明确覆盖旧版兼容行为时，才覆写这些 mocks。

### 对渠道插件进行单元测试

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

### 对 provider 插件进行单元测试

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

  it("在 API key 可用时应返回 catalog", async () => {
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
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 测试后
store.clearRuntime();
```

### 使用实例级 stub 进行测试

优先使用实例级 stub，而不是修改原型：

```typescript
// 推荐：实例级 stub
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

- 哪些插件注册了哪些 provider
- 哪些插件注册了哪些语音 provider
- 注册结构是否正确
- 运行时契约是否合规

### 运行限定范围的测试

针对特定插件：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

仅运行契约测试：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint 强制规则（仓库内插件）

对仓库内插件，`pnpm check` 会强制执行三条规则：

1. **禁止整体式根导入** —— 拒绝使用 `openclaw/plugin-sdk` 根 barrel
2. **禁止直接导入 `src/`** —— 插件不能直接导入 `../../src/`
3. **禁止自导入** —— 插件不能导入自己的 `plugin-sdk/<name>` 子路径

外部插件不受这些 lint 规则约束，但仍建议遵循相同模式。

## 测试配置

OpenClaw 使用 Vitest 和 V8 覆盖率阈值。对于插件测试：

```bash
# 运行所有测试
pnpm test

# 运行特定插件测试
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 使用特定测试名称过滤器运行
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# 运行并收集覆盖率
pnpm test:coverage
```

如果本地运行造成内存压力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 导入约定
- [SDK 渠道插件](/zh-CN/plugins/sdk-channel-plugins) -- 渠道插件接口
- [SDK 提供商插件](/zh-CN/plugins/sdk-provider-plugins) -- provider 插件钩子
- [构建插件](/zh-CN/plugins/building-plugins) -- 入门指南
