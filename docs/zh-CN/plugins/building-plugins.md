---
doc-schema-version: 1
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一份插件开发快速开始指南
    - 你正在选择渠道、提供商、CLI 后端、工具或钩子文档
sidebarTitle: Getting Started
summary: 几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-07-04T15:08:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

插件无需更改核心即可扩展 OpenClaw。插件可以添加消息
渠道、模型提供商、本地 CLI 后端、智能体工具、钩子、媒体提供商，
或其他由插件拥有的能力。

你不需要把外部插件添加到 OpenClaw 仓库。将包发布到 [ClawHub](/zh-CN/clawhub)，用户可通过以下命令安装：

```bash
openclaw plugins install clawhub:<package-name>
```

在发布切换期间，裸包规格仍会从 npm 安装。当你需要 ClawHub 解析时，请使用
`clawhub:` 前缀。

## 要求

- 使用 Node 22.19+、Node 23.11+ 或 Node 24+，以及 `npm` 或 `pnpm` 等包管理器。
- 熟悉 TypeScript ESM 模块。
- 对于仓库内内置插件开发，请克隆仓库并运行 `pnpm install`。
  源码检出形式的插件开发仅支持 pnpm，因为 OpenClaw 会从 `extensions/*`
  工作区包加载内置插件。

## 选择插件形态

<CardGroup cols={2}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台。
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    添加模型、媒体、搜索、获取、语音或实时提供商。
  </Card>
  <Card title="CLI 后端插件" icon="terminal" href="/zh-CN/plugins/cli-backend-plugins">
    通过 OpenClaw 模型回退运行本地 AI CLI。
  </Card>
  <Card title="工具插件" icon="wrench" href="/zh-CN/plugins/tool-plugins">
    注册智能体工具。
  </Card>
</CardGroup>

## 快速开始

通过注册一个必需的智能体工具来构建一个最小工具插件。这是
最短的可用插件形态，并展示了包、清单、入口点和本地验证。

<Steps>
  <Step title="创建包元数据">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    已发布的外部插件应将运行时入口指向构建后的 JavaScript
    文件。完整入口点合约请参见 [SDK 入口点](/zh-CN/plugins/sdk-entrypoints)。

    每个插件都需要清单，即使它没有配置。运行时工具必须出现在
    `contracts.tools` 中，这样 OpenClaw 才能在不急切加载每个插件运行时的情况下发现所有权。
    请有意设置 `activation.onStartup`。此示例会在 Gateway 网关启动时启动。

    主机信任的插件表面也受清单门控，并且已安装插件需要显式启用。
    如果已安装插件注册了 `api.registerAgentToolResultMiddleware(...)`，
    请在 `contracts.agentToolResultMiddleware` 中声明每个目标运行时。
    如果它注册了 `api.registerTrustedToolPolicy(...)`，请在
    `contracts.trustedToolPolicies` 中声明每个策略 ID。这些声明可让安装时检查和运行时注册保持一致。

    每个清单字段请参见 [插件清单](/zh-CN/plugins/manifest)。

  </Step>

  <Step title="注册工具">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    非渠道插件请使用 `definePluginEntry`。渠道插件使用
    `defineChannelPluginEntry`。

  </Step>

  <Step title="测试运行时">
    对于已安装或外部插件，请检查已加载的运行时：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果插件注册了 CLI 命令，也运行该命令。例如，
    演示命令应有类似 `openclaw demo-plugin ping` 的执行验证。

    对于此仓库中的内置插件，OpenClaw 会从 `extensions/*` 工作区发现源码检出形式的
    插件包。运行最接近的定向测试：

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="测试包安装">
    在发布可打包插件之前，请测试用户会获得的同一种安装形态。
    首先添加构建步骤，将 `openclaw.extensions` 等运行时入口指向
    `./dist/index.js` 这样的构建后 JavaScript，并确保 `npm pack`
    包含该 `dist/` 输出。TypeScript 源码入口仅用于源码检出和本地开发路径。

    然后打包插件，并使用 `npm-pack:` 安装 tarball：

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` 使用 OpenClaw 管理的按插件划分的 npm 项目，因此可以捕捉到
    源码检出测试可能隐藏的运行时依赖错误。它验证包和依赖形态，而不是与目录关联的官方信任。
    运行时导入必须位于 `dependencies` 或 `optionalDependencies` 中；
    仅留在 `devDependencies` 中的依赖不会为托管运行时项目安装。

    不要将原始归档/路径安装用作官方或特权插件行为的最终验证。
    原始源码对本地调试很有用，但无法证明与 npm 或 ClawHub 安装相同的依赖路径。
    如果你的插件依赖可信官方插件状态，请通过目录支持的官方安装或记录官方信任的已发布包路径添加第二份验证。
    安装根和依赖所有权详情请参见
    [插件依赖解析](/zh-CN/plugins/dependency-resolution)。

  </Step>

  <Step title="发布">
    发布前验证包：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    规范的 ClawHub 片段位于 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="安装">
    通过 ClawHub 安装已发布的包：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 注册工具

工具可以是必需或可选的。必需工具在插件启用时始终可用。
可选工具需要用户选择启用。

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

每个通过 `api.registerTool(...)` 注册的工具也必须在插件清单中声明：

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

用户通过 `tools.allow` 选择启用：

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

可选工具控制工具是否暴露给模型。当工具或钩子应在模型选择它之后、动作运行之前请求审批时，请使用
[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

对于有副作用、不常见二进制文件，或默认不应暴露的能力，请使用可选工具。
工具名称不得与核心工具冲突；冲突会被跳过并在插件诊断中报告。
格式错误的注册，包括没有 `parameters` 的工具描述符，也会以相同方式跳过并报告。
已注册的工具是模型可在策略和允许列表检查通过后调用的类型化函数。

工具工厂会接收运行时提供的上下文对象。当工具需要为当前轮次记录、显示或适配活动模型时，请使用
`ctx.activeModel`。该对象可包含 `provider`、`modelId` 和 `modelRef`。
请将它视为信息性运行时元数据，而不是针对本地操作者、已安装插件代码或修改后的 OpenClaw 运行时的安全边界。
敏感的本地工具仍应要求显式的插件或操作者选择启用，并在活动模型元数据缺失或不合适时默认失败关闭。

清单声明所有权和发现；执行仍会调用实时注册的工具实现。
请让 `toolMetadata.<tool>.optional: true` 与
`api.registerTool(..., { optional: true })` 保持一致，这样 OpenClaw 才能避免在工具被显式列入允许列表之前加载该插件运行时。

## 导入约定

从聚焦的 SDK 子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

不要从已弃用的根 barrel 导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

在你的插件包内，使用 `api.ts` 和 `runtime-api.ts` 等本地 barrel 文件进行内部导入。
不要通过 SDK 路径导入你自己的插件。提供商特定的 helper 应保留在提供商包中，除非该边界确实是通用的。

自定义 Gateway 网关 RPC 方法是高级入口点。请将它们保留在插件专用前缀上；
`config.*`、`exec.approvals.*`、`operator.admin.*`、`wizard.*`
和 `update.*` 等核心管理命名空间保持保留，并解析到 `operator.admin`。
`openclaw/plugin-sdk/gateway-method-runtime` 桥接仅保留给声明
`contracts.gatewayMethodDispatch: ["authenticated-request"]` 的插件 HTTP 路由。

完整导入映射请参见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## 针对 beta 发布版本进行测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签类似 `v2026.3.N-beta.1`。你也可以为官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 开启通知，以接收发布公告。
2. Beta 标签一出现，就针对它测试你的插件。稳定版发布前的窗口通常只有几个小时。
3. 测试后，在 `plugin-forum` Discord 频道中你插件的讨论串里发布 `all good` 或说明哪里出问题了。如果还没有讨论串，就创建一个。
4. 如果有东西出问题，打开或更新标题为 `Beta blocker: <plugin-name> - <summary>` 的 issue，并应用 `beta-blocker` 标签。把 issue 链接放到你的讨论串里。
5. 打开一个指向 `main` 的 PR，标题为 `fix(<plugin-id>): beta blocker - <summary>`，并在 PR 和你的 Discord 讨论串中都链接该 issue。贡献者不能给 PR 打标签，所以标题是面向维护者和自动化的 PR 侧信号。有 PR 的阻断问题会被合并；没有 PR 的阻断问题可能仍会随版本发布。维护者会在 Beta 测试期间关注这些讨论串。
6. 沉默表示通过。如果你错过这个窗口，你的修复很可能会进入下一个周期。

## 后续步骤

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    构建消息渠道插件
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    构建模型提供商插件
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/zh-CN/plugins/cli-backend-plugins">
    注册本地 AI CLI 后端
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子智能体
  </Card>
  <Card title="Testing" icon="test-tubes" href="/zh-CN/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-CN/plugins/manifest">
    完整 manifest schema 参考
  </Card>
</CardGroup>

## 相关

- [插件钩子](/zh-CN/plugins/hooks)
- [插件架构](/zh-CN/plugins/architecture)
