---
doc-schema-version: 1
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一份插件开发快速开始指南
    - 你正在频道、提供商、CLI 后端、工具或钩子文档之间选择
sidebarTitle: Getting Started
summary: 几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-07-05T11:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71634f848091562bb2c1f5d3aa92a2b623beac190e3bd0b56cc01a1e333143b4
    source_path: plugins/building-plugins.md
    workflow: 16
---

插件可以扩展 OpenClaw，而无需更改核心。插件可以添加消息
渠道、模型提供商、本地 CLI 后端、智能体工具、钩子、媒体提供商，
或其他由插件拥有的能力。

你无需将外部插件添加到 OpenClaw 仓库。将包发布到 [ClawHub](/clawhub)，用户可通过以下命令安装：

```bash
openclaw plugins install clawhub:<package-name>
```

在发布切换期间，裸包规范仍会从 npm 安装。当你希望使用 ClawHub 解析时，请使用
`clawhub:` 前缀。

## 要求

- Node 22.19+、Node 23.11+ 或 Node 24+，以及 `npm` 或 `pnpm`。
- TypeScript ESM 模块。
- 对于仓库内内置插件工作，请克隆仓库并运行 `pnpm install`。
  源码检出插件开发仅支持 pnpm，因为 OpenClaw 会从 `extensions/*`
  工作区包发现内置插件。

## 选择插件形态

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台。
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    添加模型、媒体、搜索、抓取、语音或实时提供商。
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/zh-CN/plugins/cli-backend-plugins">
    通过 OpenClaw 模型回退运行本地 AI CLI。
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/zh-CN/plugins/tool-plugins">
    注册智能体工具。
  </Card>
</CardGroup>

## 快速开始

通过注册一个必需的智能体工具来构建最小工具插件。这是最短的实用插件形态，
并覆盖包、清单、入口点和本地验证。

<Steps>
  <Step title="Create package metadata">
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

    已发布的外部插件应将运行时入口指向构建后的 JavaScript 文件。
    完整入口点契约见 [SDK 入口点](/zh-CN/plugins/sdk-entrypoints)。

    每个插件都需要清单，即使没有配置。运行时工具必须出现在
    `contracts.tools` 中，这样 OpenClaw 无需急切加载每个插件运行时即可发现所有权。
    请有意设置 `activation.onStartup`；此示例会在 Gateway 网关启动时加载。

    主机信任的插件表面同样由清单控制，并要求已安装插件显式声明：
    `api.registerAgentToolResultMiddleware(...)` 需要在
    `contracts.agentToolResultMiddleware` 中列出每个目标运行时，
    `api.registerTrustedToolPolicy(...)` 需要在
    `contracts.trustedToolPolicies` 中列出每个策略 ID。这些声明使安装时检查与运行时注册保持一致。

    关于每个清单字段，请参见 [插件清单](/zh-CN/plugins/manifest)。

  </Step>

  <Step title="Register the tool">
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

    对非渠道插件使用 `definePluginEntry`。渠道插件则改用
    `openclaw/plugin-sdk/core` 中的 `defineChannelPluginEntry`。

  </Step>

  <Step title="Test the runtime">
    对于已安装或外部插件，请检查已加载的运行时：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果插件注册了 CLI 命令，也请运行该命令并确认输出，
    例如 `openclaw demo-plugin ping`。

    对于本仓库中的内置插件，OpenClaw 会从 `extensions/*` 工作区发现源码检出插件包。
    运行最接近的定向测试：

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    在发布可打包插件之前，请测试用户将获得的相同安装形态。
    首先添加构建步骤，将 `openclaw.extensions` 等运行时入口指向构建后的
    JavaScript（如 `./dist/index.js`），并确保 `npm pack` 包含该 `dist/` 输出。
    TypeScript 源码入口仅适用于源码检出和本地开发路径。

    然后打包插件，并使用 `npm-pack:` 安装 tarball：

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` 使用 OpenClaw 管理的按插件划分 npm 项目，因此它能捕获源码检出测试可能隐藏的运行时依赖错误。
    它证明的是包和依赖形态，而不是与目录关联的官方信任。
    运行时导入必须位于 `dependencies` 或 `optionalDependencies`；
    仅留在 `devDependencies` 中的依赖不会为托管运行时项目安装。

    不要将原始归档或路径安装作为官方或特权插件行为的最终验证。
    原始源码适合本地调试，但无法证明与 npm 或 ClawHub 安装相同的依赖路径。
    如果你的插件依赖可信官方插件状态，请通过基于目录的官方安装或记录官方信任的已发布包路径添加第二项验证。
    安装根和依赖所有权详情见
    [插件依赖解析](/zh-CN/plugins/dependency-resolution)。

  </Step>

  <Step title="Publish">
    发布前验证包：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    规范的 ClawHub 包片段位于 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="Install">
    通过 ClawHub 安装已发布的包：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 注册工具

工具可以是必需或可选的。插件启用后，必需工具始终可用。
可选工具需要用户显式选择加入后，OpenClaw 才会加载所属插件运行时。

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

通过 `api.registerTool(...)` 注册的每个工具也必须在插件清单中声明：

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

用户通过 `tools.allow` 选择加入：

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

可选工具控制工具是否暴露给模型。当工具或钩子应在模型选择后、动作运行前请求批准时，
请使用 [插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

对具有副作用、不常见二进制文件或默认不应暴露的能力使用可选工具。
工具名称不得与核心工具名称冲突；冲突会被跳过，并在插件诊断中报告。
格式错误的注册也会以相同方式跳过并报告：缺失非空 `name`、非函数 `execute`，
或没有 `parameters` 对象的工具描述符。

工具工厂会接收运行时提供的上下文对象。当工具需要记录、显示或适配当前轮次的活跃模型时，
请使用 `ctx.activeModel`；它可能包含 `provider`、`modelId` 和 `modelRef`。
请将其视为信息性的运行时元数据，而不是对本地操作员、已安装插件代码或被修改的 OpenClaw 运行时的安全边界。
敏感本地工具仍应要求显式的插件或操作员选择加入，并在活跃模型元数据缺失或不适用时 fail closed。

清单声明所有权和发现；执行仍会调用实时注册的工具实现。
请保持 `toolMetadata.<tool>.optional: true` 与
`api.registerTool(..., { optional: true })` 一致，这样 OpenClaw 可以在工具被显式加入允许列表之前避免加载该插件运行时。

## 导入约定

从聚焦的插件 SDK 子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

不要从已弃用的根 barrel 导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

在你的插件包内部，请使用 `api.ts` 和 `runtime-api.ts` 等本地 barrel 文件进行内部导入。
不要通过 SDK 路径导入你自己的插件。提供商特定的辅助函数应保留在提供商包中，除非该边界确实是通用的。

自定义 Gateway 网关 RPC 方法是高级入口点。请将其保持在插件特定前缀下；
核心管理员命名空间（如 `config.*`、`exec.approvals.*`、`operator.admin.*`、`wizard.*` 和 `update.*`）
保持保留，并解析到 `operator.admin`。
`openclaw/plugin-sdk/gateway-method-runtime` 桥接仅保留给声明
`contracts.gatewayMethodDispatch: ["authenticated-request"]` 的插件 HTTP 路由。

完整导入映射见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## 针对 beta 版本测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 发布（`Watch` > `Releases`）。Beta 标签类似 `v2026.3.N-beta.1`。你也可以在 X 上关注 [@openclaw](https://x.com/openclaw) 获取发布公告。
2. Beta 标签一出现，就立即用它测试你的插件。稳定版发布前的窗口通常只有几个小时。
3. 测试后，在 `plugin-forum` Discord 频道（[discord.gg/clawd](https://discord.gg/clawd)）中你的插件线程里发帖，说明 `all good` 或具体哪里坏了。如果还没有线程，就创建一个。
4. 如果有东西坏了，打开或更新一个标题为 `Beta blocker: <plugin-name> - <summary>` 的议题，并应用 `beta-blocker` 标签。在你的线程中链接该议题。
5. 向 `main` 打开一个标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和你的 Discord 线程中链接该议题。贡献者不能给 PR 打标签，所以标题是给维护者和自动化使用的 PR 侧信号。带 PR 的阻塞问题会被合并；没有 PR 的阻塞问题可能仍会照常发布。
6. 沉默表示绿色通过。错过窗口通常意味着你的修复会进入下一个周期。

## 后续步骤

<CardGroup cols={2}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    构建消息渠道插件
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    构建模型提供商插件
  </Card>
  <Card title="CLI 后端插件" icon="terminal" href="/zh-CN/plugins/cli-backend-plugins">
    注册本地 AI CLI 后端
  </Card>
  <Card title="SDK 概览" icon="book-open" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子智能体
  </Card>
  <Card title="测试" icon="test-tubes" href="/zh-CN/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-CN/plugins/manifest">
    完整清单架构参考
  </Card>
</CardGroup>

## 相关内容

- [插件钩子](/zh-CN/plugins/hooks)
- [插件架构](/zh-CN/plugins/architecture)
