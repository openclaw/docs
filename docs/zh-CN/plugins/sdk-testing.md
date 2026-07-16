---
read_when:
    - 你正在为插件编写测试
    - 你需要插件 SDK 中的测试工具
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具与模式
title: 插件测试
x-i18n:
    generated_at: "2026-07-16T11:52:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 插件的测试工具、模式和 lint 强制规则参考。

<Tip>
  **正在查找测试示例？** 操作指南中包含完整的测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test)和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

这些子路径是仓库本地的源代码入口点，供 OpenClaw 自身的内置插件测试使用。它们不是面向第三方插件发布的 `package.json` 导出，并且可能会导入 Vitest 或其他仅限仓库使用的测试依赖项。

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

内置插件测试应使用这些聚焦的子路径。以前的 `openclaw/plugin-sdk/testing` barrel 仅供仓库本地使用，未包含在已发布的软件包中，现已移除。旧版 `openclaw/plugin-sdk/test-utils` 别名仍仅供仓库本地使用；`pnpm run lint:plugins:no-extension-test-core-imports`（`scripts/check-no-extension-test-core-imports.ts`）会拒绝在新的扩展测试中导入该别名。

### 可用导出

| 导出项                                               | 用途                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 为直接注册单元测试构建最小化插件 API 模拟。从 `plugin-sdk/plugin-test-api` 导入                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 用于原生 Agent Runtimes 适配器的共享身份验证配置文件契约夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 用于原生 Agent Runtimes 适配器的共享交付抑制契约夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 用于原生 Agent Runtimes 适配器的共享回退分类契约夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入 |
| `createParameterFreeTool`                            | 为原生运行时契约测试构建动态工具架构夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入              |
| `expectChannelInboundContextContract`                | 断言渠道入站上下文结构。从 `plugin-sdk/channel-contract-testing` 导入                                                  |
| `installChannelOutboundPayloadContractSuite`         | 安装渠道出站有效载荷契约用例。从 `plugin-sdk/channel-contract-testing` 导入                                       |
| `createStartAccountContext`                          | 构建渠道账户生命周期上下文。从 `plugin-sdk/channel-test-helpers` 导入                                                  |
| `installChannelActionsContractSuite`                 | 安装通用渠道消息操作契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                     |
| `installChannelSetupContractSuite`                   | 安装通用渠道设置契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                              |
| `installChannelStatusContractSuite`                  | 安装通用渠道状态契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                             |
| `expectDirectoryIds`                                 | 断言目录列表函数返回的渠道目录 ID。从 `plugin-sdk/channel-test-helpers` 导入                               |
| `assertBundledChannelEntries`                        | 断言内置渠道入口点公开预期的公共契约。从 `plugin-sdk/channel-test-helpers` 导入                    |
| `formatEnvelopeTimestamp`                            | 格式化确定性的信封时间戳。从 `plugin-sdk/channel-test-helpers` 导入                                                  |
| `expectPairingReplyText`                             | 断言渠道配对回复文本并提取其代码。从 `plugin-sdk/channel-test-helpers` 导入                                    |
| `describePluginRegistrationContract`                 | 安装插件注册契约检查。从 `plugin-sdk/plugin-test-contracts` 导入                                              |
| `registerSingleProviderPlugin`                       | 在加载器冒烟测试中注册一个提供商插件。从 `plugin-sdk/plugin-test-runtime` 导入                                         |
| `registerProviderPlugin`                             | 捕获一个插件中的所有提供商类型。从 `plugin-sdk/plugin-test-runtime` 导入                                                 |
| `registerProviderPlugins`                            | 捕获多个插件中的提供商注册项。从 `plugin-sdk/plugin-test-runtime` 导入                                     |
| `requireRegisteredProvider`                          | 断言提供商集合包含指定 ID。从 `plugin-sdk/plugin-test-runtime` 导入                                           |
| `createRuntimeEnv`                                   | 构建模拟的 CLI/插件运行时环境。从 `plugin-sdk/plugin-test-runtime` 导入                                              |
| `createPluginRuntimeMock`                            | 构建模拟的插件运行时表面。从 `plugin-sdk/plugin-test-runtime` 导入                                                      |
| `createPluginSetupWizardStatus`                      | 为渠道插件构建设置状态辅助工具。从 `plugin-sdk/plugin-test-runtime` 导入                                             |
| `createTestWizardPrompter`                           | 构建模拟的设置向导提示器。从 `plugin-sdk/plugin-test-runtime` 导入                                                       |
| `createRuntimeTaskFlow`                              | 创建隔离的运行时任务流状态。从 `plugin-sdk/plugin-test-runtime` 导入                                                    |
| `runProviderCatalog`                                 | 使用测试依赖项执行提供商目录钩子。从 `plugin-sdk/plugin-test-runtime` 导入                                     |
| `resolveProviderWizardOptions`                       | 在契约测试中解析提供商设置向导选项。从 `plugin-sdk/plugin-test-runtime` 导入                                    |
| `resolveProviderModelPickerEntries`                  | 在契约测试中解析提供商模型选择器条目。从 `plugin-sdk/plugin-test-runtime` 导入                                    |
| `buildProviderPluginMethodChoice`                    | 构建用于断言的提供商向导选项 ID。从 `plugin-sdk/plugin-test-runtime` 导入                                            |
| `setProviderWizardProvidersResolverForTest`          | 为隔离测试注入提供商向导的提供商。从 `plugin-sdk/plugin-test-runtime` 导入                                        |
| `describeOpenAIProviderRuntimeContract`              | 安装提供商系列运行时契约检查。从 `plugin-sdk/provider-test-contracts` 导入                                        |
| `expectPassthroughReplayPolicy`                      | 断言提供商重放策略会透传提供商自有工具和元数据。从 `plugin-sdk/provider-test-contracts` 导入         |
| `runRealtimeSttLiveTest`                             | 使用共享音频夹具运行实时 STT 提供商的在线测试。从 `plugin-sdk/provider-test-contracts` 导入                       |
| `normalizeTranscriptForMatch`                        | 在模糊断言前规范化在线转录输出。从 `plugin-sdk/provider-test-contracts` 导入                               |
| `expectExplicitVideoGenerationCapabilities`          | 断言视频提供商声明明确的生成模式能力。从 `plugin-sdk/provider-test-contracts` 导入                   |
| `expectExplicitMusicGenerationCapabilities`          | 断言音乐提供商声明明确的生成/编辑能力。从 `plugin-sdk/provider-test-contracts` 导入                   |
| `mockSuccessfulDashscopeVideoTask`                   | 安装成功的 DashScope 兼容视频任务响应。从 `plugin-sdk/provider-test-contracts` 导入                          |
| `getProviderHttpMocks`                               | 访问需选择启用的提供商 HTTP/身份验证 Vitest 模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                                         |
| `installProviderHttpMockCleanup`                     | 在每次测试后重置提供商 HTTP/身份验证模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                                        |
| `installCommonResolveTargetErrorCases`               | 用于目标解析错误处理的共享测试用例。从 `plugin-sdk/channel-target-testing` 导入                                  |
| `shouldAckReaction`                                  | 检查渠道是否应添加确认表情回应。从 `plugin-sdk/channel-feedback` 导入                                            |
| `removeAckReactionAfterReply`                        | 回复交付后移除确认表情回应。从 `plugin-sdk/channel-feedback` 导入                                                      |
| `createTestRegistry`                                 | 构建渠道插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入               |
| `createEmptyPluginRegistry`                          | 构建空插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入                |
| `setActivePluginRegistry`                            | 为插件运行时测试安装注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入   |
| `createRequestCaptureJsonFetch`                      | 在媒体辅助工具测试中捕获 JSON 获取请求。从 `plugin-sdk/test-env` 导入                                                     |
| `withServer`                                         | 使用可随时销毁的本地 HTTP 服务器运行测试。从 `plugin-sdk/test-env` 导入                                                      |
| `createMockIncomingRequest`                          | 构建最小化的入站 HTTP 请求对象。从 `plugin-sdk/test-env` 导入                                                          |
| `withFetchPreconnect`                                | 在安装预连接钩子的情况下运行获取测试。从 `plugin-sdk/test-env` 导入                                                       |
| `withEnv` / `withEnvAsync`                           | 临时修补环境变量。从 `plugin-sdk/test-env` 导入                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 创建隔离的文件系统测试夹具。从 `plugin-sdk/test-env` 导入                                                              |
| `createMockServerResponse`                           | 创建最小化的 HTTP 服务器响应模拟。从 `plugin-sdk/test-env` 导入                                                            |
| `createProviderUsageFetch`                           | 构建提供商用量获取夹具。从 `plugin-sdk/test-env` 导入                                                                   |
| `useFrozenTime` / `useRealTime`                      | 为时间敏感型测试冻结并恢复计时器。从 `plugin-sdk/test-env` 导入                                                    |
| `createCliRuntimeCapture`                            | 在测试中捕获 CLI 运行时输出。从 `plugin-sdk/test-fixtures` 导入                                                              |
| `importFreshModule`                                  | 使用新的查询令牌导入 ESM 模块以绕过模块缓存。从 `plugin-sdk/test-fixtures` 导入                             |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析内置插件源码或分发版夹具路径。从 `plugin-sdk/test-fixtures` 导入                                              |
| `mockNodeBuiltinModule`                              | 安装精确限定范围的 Node 内置模块 Vitest 模拟。从 `plugin-sdk/test-node-mocks` 导入                                                       |
| `createSandboxTestContext`                           | 构建沙箱测试上下文。从 `plugin-sdk/test-fixtures` 导入                                                                      |
| `writeSkill`                                         | 写入技能夹具。从 `plugin-sdk/test-fixtures` 导入                                                                             |
| `makeAgentAssistantMessage`                          | 构建 Agent 记录消息夹具。从 `plugin-sdk/test-fixtures` 导入                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 检查并重置系统事件夹具。从 `plugin-sdk/test-fixtures` 导入                                                          |
| `sanitizeTerminalText`                               | 清理终端输出以供断言使用。从 `plugin-sdk/test-fixtures` 导入                                                          |
| `countLines` / `hasBalancedFences`                   | 断言分块输出结构。从 `plugin-sdk/test-fixtures` 导入                                                                     |
| `typedCases`                                         | 为表驱动测试保留字面量类型。从 `plugin-sdk/test-fixtures` 导入                                                    |

内置插件契约测试套件还使用这些 SDK 测试子路径来提供
仅供测试使用的注册表、清单、公共工件和运行时夹具辅助工具。
依赖内置 OpenClaw 清单的仅核心测试套件则仍位于
`src/plugins/contracts` 下。

### 类型

聚焦测试子路径还会重新导出在测试文件中有用的类型：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为渠道目标解析添加标准错误用例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 你的渠道目标解析逻辑
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 添加渠道特定的测试用例
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## 测试模式

### 测试注册契约

将手写的 `api` 模拟对象传给 `register(api)` 的单元测试不会触发 OpenClaw 加载器的验收关卡。对于插件所依赖的每个注册表面，至少添加一个基于加载器的冒烟测试，尤其是钩子和内存等排他性能力。

如果缺少必需的元数据，或插件调用了不属于它的能力 API，真实加载器会使插件注册失败。例如，`api.registerHook(...)` 要求提供钩子名称，而 `api.registerMemoryCapability(...)` 要求插件清单或导出的入口声明 `kind: "memory"`。

### 测试运行时配置访问

优先使用 `openclaw/plugin-sdk/plugin-test-runtime` 中的共享插件运行时模拟对象。其 `runtime.config.loadConfig()` 和 `runtime.config.writeConfigFile(...)` 模拟对象默认会抛出异常，以便测试捕获对已弃用兼容性 API 的新增使用。仅当测试明确覆盖旧版兼容行为时，才覆盖这些模拟对象。

### 对渠道插件进行单元测试

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
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

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // 不暴露令牌值
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 对提供商插件进行单元测试

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... 上下文
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... 上下文
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### 模拟插件运行时

对于使用 `createPluginRuntimeStore` 的代码，在测试中模拟运行时：

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
    // ... 其他模拟对象
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

### 使用按实例存根进行测试

优先使用按实例存根，而不是修改原型：

```typescript
// 推荐：按实例存根
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：修改原型
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契约测试（仓库内插件）

内置插件包含用于验证注册所有权的契约测试：

```bash
pnpm test src/plugins/contracts/
```

这些测试会断言：

- 哪些插件注册了哪些提供商
- 哪些插件注册了哪些语音提供商
- 注册结构的正确性
- 运行时契约合规性

### 运行限定范围的测试

对于特定插件：

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

仅运行契约测试：

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 强制检查（仓库内插件）

`scripts/run-additional-boundary-checks.mjs` 会在 CI 中运行一组 `lint:plugins:*` 导入边界检查；每项检查也可以在本地单独运行：

| 命令                                                        | 强制规则                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | 内置插件不能导入单体式 `openclaw/plugin-sdk` 根桶文件。             |
| `pnpm run lint:plugins:no-extension-src-imports`               | 生产环境的扩展文件不能直接导入仓库的 `src/**` 目录树（`../../src/...`）。 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 扩展测试文件不能导入 `plugin-sdk/test-utils` 或其他仅供核心使用的测试辅助工具。 |

外部插件不受这些 Lint 规则约束，但建议遵循相同的模式。

## 测试配置

OpenClaw 使用 Vitest 4，并提供信息性的 V8 覆盖率报告。对于插件测试：

```bash
# 运行所有测试
pnpm test

# 运行特定插件测试
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# 使用特定测试名称过滤器运行
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# 运行覆盖率测试
pnpm test:coverage
```

如果本地运行造成内存压力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 导入约定
- [SDK 渠道插件](/zh-CN/plugins/sdk-channel-plugins) -- 渠道插件接口
- [SDK 提供商插件](/zh-CN/plugins/sdk-provider-plugins) -- 提供商插件钩子
- [Building Plugins](/zh-CN/plugins/building-plugins) -- 入门指南
