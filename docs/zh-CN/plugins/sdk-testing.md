---
read_when:
    - 你正在为插件编写测试
    - 你需要插件 SDK 中的测试工具
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具与模式
title: 插件测试
x-i18n:
    generated_at: "2026-07-12T14:40:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 插件测试工具、模式和 lint 强制规则参考。

<Tip>
  **想查找测试示例？** 操作指南包含完整的测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test)和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

这些子路径是 OpenClaw 自有内置插件测试所使用的仓库本地源码入口点。它们不是为第三方插件发布的 `package.json` 导出，并且可能会导入 Vitest 或其他仅限仓库使用的测试依赖项。

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

为新的内置插件测试优先使用这些专用子路径。宽泛的 `openclaw/plugin-sdk/testing` barrel 和 `openclaw/plugin-sdk/test-utils` 别名仅用于旧版兼容：`pnpm run lint:plugins:no-extension-test-core-imports`
（`scripts/check-no-extension-test-core-imports.ts`）会拒绝扩展测试文件中新引入其中任一项，并且两者都仅为兼容性记录测试而保留。

### 可用导出

| 导出项                                               | 用途                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 为直接注册单元测试构建最小化插件 API 模拟。从 `plugin-sdk/plugin-test-api` 导入                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 用于原生智能体运行时适配器的共享身份验证配置文件契约固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 用于原生智能体运行时适配器的共享禁止投递回复契约固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 用于原生智能体运行时适配器的共享回退分类契约固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入 |
| `createParameterFreeTool`                            | 为原生运行时契约测试构建动态工具架构固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入              |
| `expectChannelInboundContextContract`                | 断言渠道入站上下文结构。从 `plugin-sdk/channel-contract-testing` 导入                                                  |
| `installChannelOutboundPayloadContractSuite`         | 安装渠道出站有效载荷契约用例。从 `plugin-sdk/channel-contract-testing` 导入                                       |
| `createStartAccountContext`                          | 构建渠道账户生命周期上下文。从 `plugin-sdk/channel-test-helpers` 导入                                                  |
| `installChannelActionsContractSuite`                 | 安装通用渠道消息操作契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                     |
| `installChannelSetupContractSuite`                   | 安装通用渠道设置契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                              |
| `installChannelStatusContractSuite`                  | 安装通用渠道状态契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                             |
| `expectDirectoryIds`                                 | 断言目录列表函数返回的渠道目录 ID。从 `plugin-sdk/channel-test-helpers` 导入                               |
| `assertBundledChannelEntries`                        | 断言内置渠道入口点公开预期的公共契约。从 `plugin-sdk/channel-test-helpers` 导入                    |
| `formatEnvelopeTimestamp`                            | 格式化确定性的信封时间戳。从 `plugin-sdk/channel-test-helpers` 导入                                                  |
| `expectPairingReplyText`                             | 断言渠道配对回复文本并提取其中的代码。从 `plugin-sdk/channel-test-helpers` 导入                                    |
| `describePluginRegistrationContract`                 | 安装插件注册契约检查。从 `plugin-sdk/plugin-test-contracts` 导入                                              |
| `registerSingleProviderPlugin`                       | 在加载器冒烟测试中注册一个提供商插件。从 `plugin-sdk/plugin-test-runtime` 导入                                         |
| `registerProviderPlugin`                             | 从一个插件中捕获所有提供商类型。从 `plugin-sdk/plugin-test-runtime` 导入                                                 |
| `registerProviderPlugins`                            | 捕获多个插件的提供商注册信息。从 `plugin-sdk/plugin-test-runtime` 导入                                     |
| `requireRegisteredProvider`                          | 断言提供商集合包含指定 ID。从 `plugin-sdk/plugin-test-runtime` 导入                                           |
| `createRuntimeEnv`                                   | 构建模拟的 CLI/插件运行时环境。从 `plugin-sdk/plugin-test-runtime` 导入                                              |
| `createPluginRuntimeMock`                            | 构建模拟的插件运行时接口。从 `plugin-sdk/plugin-test-runtime` 导入                                                      |
| `createPluginSetupWizardStatus`                      | 为渠道插件构建设置状态辅助函数。从 `plugin-sdk/plugin-test-runtime` 导入                                             |
| `createTestWizardPrompter`                           | 构建模拟的设置向导提示器。从 `plugin-sdk/plugin-test-runtime` 导入                                                       |
| `createRuntimeTaskFlow`                              | 创建隔离的运行时 Task Flow 状态。从 `plugin-sdk/plugin-test-runtime` 导入                                                    |
| `runProviderCatalog`                                 | 使用测试依赖执行提供商目录钩子。从 `plugin-sdk/plugin-test-runtime` 导入                                     |
| `resolveProviderWizardOptions`                       | 在契约测试中解析提供商设置向导选项。从 `plugin-sdk/plugin-test-runtime` 导入                                    |
| `resolveProviderModelPickerEntries`                  | 在契约测试中解析提供商模型选择器条目。从 `plugin-sdk/plugin-test-runtime` 导入                                    |
| `buildProviderPluginMethodChoice`                    | 构建用于断言的提供商向导选项 ID。从 `plugin-sdk/plugin-test-runtime` 导入                                            |
| `setProviderWizardProvidersResolverForTest`          | 为隔离测试注入提供商向导提供商。从 `plugin-sdk/plugin-test-runtime` 导入                                        |
| `describeOpenAIProviderRuntimeContract`              | 安装提供商系列运行时契约检查。从 `plugin-sdk/provider-test-contracts` 导入                                        |
| `expectPassthroughReplayPolicy`                      | 断言提供商重放策略会透传提供商自有工具和元数据。从 `plugin-sdk/provider-test-contracts` 导入         |
| `runRealtimeSttLiveTest`                             | 使用共享音频固件运行实时 STT 提供商实时测试。从 `plugin-sdk/provider-test-contracts` 导入                       |
| `normalizeTranscriptForMatch`                        | 在模糊断言前规范化实时转录输出。从 `plugin-sdk/provider-test-contracts` 导入                               |
| `expectExplicitVideoGenerationCapabilities`          | 断言视频提供商声明明确的生成模式能力。从 `plugin-sdk/provider-test-contracts` 导入                   |
| `expectExplicitMusicGenerationCapabilities`          | 断言音乐提供商声明明确的生成/编辑能力。从 `plugin-sdk/provider-test-contracts` 导入                   |
| `mockSuccessfulDashscopeVideoTask`                   | 安装成功的 DashScope 兼容视频任务响应。从 `plugin-sdk/provider-test-contracts` 导入                          |
| `getProviderHttpMocks`                               | 访问选择启用的提供商 HTTP/身份验证 Vitest 模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                                         |
| `installProviderHttpMockCleanup`                     | 在每次测试后重置提供商 HTTP/身份验证模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                                        |
| `installCommonResolveTargetErrorCases`               | 用于目标解析错误处理的共享测试用例。从 `plugin-sdk/channel-target-testing` 导入                                  |
| `shouldAckReaction`                                  | 检查渠道是否应添加确认表情回应。从 `plugin-sdk/channel-feedback` 导入                                            |
| `removeAckReactionAfterReply`                        | 回复投递后移除确认表情回应。从 `plugin-sdk/channel-feedback` 导入                                                      |
| `createTestRegistry`                                 | 构建渠道插件注册表固件。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入               |
| `createEmptyPluginRegistry`                          | 构建空插件注册表固件。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入                |
| `setActivePluginRegistry`                            | 为插件运行时测试安装注册表固件。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入   |
| `createRequestCaptureJsonFetch`                      | 在媒体辅助函数测试中捕获 JSON fetch 请求。从 `plugin-sdk/test-env` 导入                                                     |
| `withServer`                                         | 针对一次性本地 HTTP 服务器运行测试。从 `plugin-sdk/test-env` 导入                                                      |
| `createMockIncomingRequest`                          | 构建最小化入站 HTTP 请求对象。从 `plugin-sdk/test-env` 导入                                                          |
| `withFetchPreconnect`                                | 在安装预连接钩子的情况下运行 fetch 测试。从 `plugin-sdk/test-env` 导入                                                       |
| `withEnv` / `withEnvAsync`                           | 临时修改环境变量。从 `plugin-sdk/test-env` 导入                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 创建隔离的文件系统测试固件。从 `plugin-sdk/test-env` 导入                                                              |
| `createMockServerResponse`                           | 创建最小化 HTTP 服务器响应模拟。从 `plugin-sdk/test-env` 导入                                                            |
| `createProviderUsageFetch`                           | 构建提供商用量 fetch 固件。从 `plugin-sdk/test-env` 导入                                                                   |
| `useFrozenTime` / `useRealTime`                      | 为时间敏感测试冻结和恢复计时器。从 `plugin-sdk/test-env` 导入                                                    |
| `createCliRuntimeCapture`                            | 在测试中捕获 CLI 运行时输出。从 `plugin-sdk/test-fixtures` 导入                                                              |
| `importFreshModule`                                  | 使用全新查询令牌导入 ESM 模块，以绕过模块缓存。从 `plugin-sdk/test-fixtures` 导入                             |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析内置插件源码或 dist 固件路径。从 `plugin-sdk/test-fixtures` 导入                                              |
| `mockNodeBuiltinModule`                              | 安装范围有限的 Node 内置模块 Vitest 模拟。从 `plugin-sdk/test-node-mocks` 导入                                                       |
| `createSandboxTestContext`                           | 构建沙箱测试上下文。从 `plugin-sdk/test-fixtures` 导入                                                                      |
| `writeSkill`                                         | 写入 Skills 固件。从 `plugin-sdk/test-fixtures` 导入                                                                             |
| `makeAgentAssistantMessage`                          | 构建智能体转录消息固件。从 `plugin-sdk/test-fixtures` 导入                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 检查并重置系统事件固件。从 `plugin-sdk/test-fixtures` 导入                                                          |
| `sanitizeTerminalText`                               | 清理终端输出以用于断言。从 `plugin-sdk/test-fixtures` 导入                                                          |
| `countLines` / `hasBalancedFences`                   | 断言分块输出的结构。从 `plugin-sdk/test-fixtures` 导入                                                                     |
| `typedCases`                                         | 为表驱动测试保留字面量类型。从 `plugin-sdk/test-fixtures` 导入                                                    |

内置插件契约测试套件还会使用这些 SDK 测试子路径，获取仅供测试使用的注册表、清单、公共工件和运行时固件辅助函数。
依赖内置 OpenClaw 清单的纯核心测试套件则仍位于
`src/plugins/contracts` 下。

### 类型

针对性测试子路径还会重新导出测试文件中有用的类型：

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

describe("my-channel 目标解析", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 你的渠道目标解析逻辑
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 添加渠道特定测试用例
  it("应解析 @username 目标", () => {
    // ...
  });
});
```

## 测试模式

### 测试注册契约

将手写的 `api` 模拟对象传给 `register(api)` 的单元测试不会
触发 OpenClaw 的加载器验收门槛。插件依赖的每个注册表面都应至少添加一个
由加载器驱动的冒烟测试，尤其是钩子和内存等独占能力。

如果缺少必需的元数据，或插件调用了不归其所有的能力 API，真实加载器会使插件注册失败。例如，
`api.registerHook(...)` 需要钩子名称，而
`api.registerMemoryCapability(...)` 要求插件清单或导出的
入口声明 `kind: "memory"`。

### 测试运行时配置访问

优先使用 `openclaw/plugin-sdk/plugin-test-runtime` 中的共享插件运行时模拟对象。
其 `runtime.config.loadConfig()` 和 `runtime.config.writeConfigFile(...)`
模拟默认会抛出异常，因此测试可以捕获对已弃用兼容性
API 的新增使用。仅当测试明确覆盖旧版
兼容行为时才覆盖这些模拟。

### 对渠道插件进行单元测试

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel 插件", () => {
  it("应从配置解析账户", () => {
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

  it("应在不具体化密钥的情况下检查账户", () => {
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

describe("my-provider 插件", () => {
  it("应解析动态模型", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... 上下文
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("API 密钥可用时应返回目录", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... 上下文
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### 模拟插件运行时

对于使用 `createPluginRuntimeStore` 的代码，请在测试中模拟运行时：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "测试运行时未设置",
});

// 在测试设置中
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 其他模拟
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

### 使用实例级存根进行测试

优先使用实例级存根，而非修改原型：

```typescript
// 推荐：实例级存根
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：修改原型
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契约测试（仓库内插件）

内置插件具有用于验证注册所有权的契约测试：

```bash
pnpm test src/plugins/contracts/
```

这些测试会断言：

- 哪些插件注册了哪些提供商
- 哪些插件注册了哪些语音提供商
- 注册结构的正确性
- 是否符合运行时契约

### 运行限定范围的测试

针对特定插件：

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

`scripts/run-additional-boundary-checks.mjs` 会在 CI 中运行一组 `lint:plugins:*`
导入边界检查；每项检查也可在本地单独运行：

| 命令                                                        | 强制规则                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | 内置插件不能导入单体式 `openclaw/plugin-sdk` 根入口文件。                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | 生产扩展文件不能直接导入仓库的 `src/**` 目录树（`../../src/...`）。                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 扩展测试文件不能导入 `openclaw/plugin-sdk/testing`、`plugin-sdk/test-utils` 或其他仅限核心使用的测试辅助函数。 |

外部插件不受这些 Lint 规则约束，但建议遵循相同
模式。

## 测试配置

OpenClaw 使用 Vitest 4，并提供仅供参考的 V8 覆盖率报告。对于插件测试：

```bash
# 运行所有测试
pnpm test

# 运行特定插件测试
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# 使用特定测试名称筛选器运行
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# 运行并生成覆盖率
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
