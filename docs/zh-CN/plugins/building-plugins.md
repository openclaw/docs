---
doc-schema-version: 1
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一份插件开发快速开始
    - 你正在选择渠道、提供商、CLI 后端、工具或钩子文档
sidebarTitle: Getting Started
summary: 几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-06-27T02:36:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

插件无需更改核心即可扩展 OpenClaw。插件可以添加消息
渠道、模型提供商、本地 CLI 后端、智能体工具、钩子、媒体提供商，
或其他由插件拥有的能力。

你不需要把外部插件添加到 OpenClaw 仓库。将
包发布到 [ClawHub](/zh-CN/clawhub)，用户可用以下命令安装：

```bash
openclaw plugins install clawhub:<package-name>
```

在发布切换期间，裸包规格仍会从 npm 安装。当你想使用 ClawHub 解析时，请使用
`clawhub:` 前缀。

## 要求

- 使用 Node 22.19 或更高版本，以及 `npm` 或 `pnpm` 等包管理器。
- 熟悉 TypeScript ESM 模块。
- 对于仓库内内置插件工作，请克隆仓库并运行 `pnpm install`。
  源码检出插件开发仅支持 pnpm，因为 OpenClaw 会从 `extensions/*`
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

通过注册一个必需的智能体工具来构建最小工具插件。这是
最短的实用插件形态，并展示包、清单、入口点和
本地证明。

<Steps>
  <Step title="创建包元数据">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
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
    文件。完整入口点契约请参阅 [SDK 入口点](/zh-CN/plugins/sdk-entrypoints)。

    每个插件都需要清单，即使它没有配置。运行时工具
    必须出现在 `contracts.tools` 中，这样 OpenClaw 才能在不
    急切加载每个插件运行时的情况下发现所有权。请有意设置
    `activation.onStartup`。此示例会在 Gateway 网关启动时启动。

    主机信任的插件表面也受清单约束，并要求已安装插件
    显式启用。如果已安装插件注册
    `api.registerAgentToolResultMiddleware(...)`，请在
    `contracts.agentToolResultMiddleware` 中声明每个目标运行时。如果它注册
    `api.registerTrustedToolPolicy(...)`，请在
    `contracts.trustedToolPolicies` 中声明每个策略 ID。这些声明可保持安装时
    检查与运行时注册一致。

    每个清单字段请参阅 [插件清单](/zh-CN/plugins/manifest)。

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

    非渠道插件使用 `definePluginEntry`。渠道插件使用
    `defineChannelPluginEntry`。

  </Step>

  <Step title="测试运行时">
    对于已安装或外部插件，请检查已加载的运行时：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果插件注册了 CLI 命令，也请运行该命令。例如，
    演示命令应具备执行证明，例如
    `openclaw demo-plugin ping`。

    对于此仓库中的内置插件，OpenClaw 会从 `extensions/*`
    工作区发现源码检出的插件包。运行最接近的定向
    测试：

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

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

工具可以是必需或可选的。当插件启用时，必需工具始终可用。
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

每个用 `api.registerTool(...)` 注册的工具也必须在
插件清单中声明：

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

可选工具控制工具是否暴露给模型。当某个工具
或钩子应在模型选择它之后、动作运行之前请求审批时，请使用
[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

对于副作用、不常见的二进制文件，或不应默认暴露的能力，
请使用可选工具。工具名称不得与核心工具冲突；冲突会被跳过并
在插件诊断中报告。格式错误的注册，包括没有 `parameters` 的工具描述符，
会以相同方式跳过并报告。注册的工具是类型化函数，模型可在
策略和 allowlist 检查通过后调用。

工具工厂会收到运行时提供的上下文对象。当工具需要记录、
显示或适配当前轮次的活跃模型时，请使用 `ctx.activeModel`。
该对象可包含 `provider`、`modelId` 和 `modelRef`。请将其视为
信息性运行时元数据，而不是抵御本地
操作员、已安装插件代码或修改过的 OpenClaw 运行时的安全边界。敏感的本地
工具仍应要求显式的插件或操作员选择启用，并在活跃模型元数据
缺失或不合适时安全失败。

清单声明所有权和发现；执行仍会调用实时
注册的工具实现。保持 `toolMetadata.<tool>.optional: true`
与 `api.registerTool(..., { optional: true })` 一致，这样 OpenClaw 才能避免
在该工具被显式加入 allowlist 之前加载该插件运行时。

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

在你的插件包内，使用 `api.ts` 和
`runtime-api.ts` 等本地 barrel 文件进行内部导入。不要通过
SDK 路径导入你自己的插件。提供商特定的辅助工具应保留在提供商包中，除非
该边界确实是通用的。

自定义 Gateway 网关 RPC 方法是高级入口点。请将它们保留在
插件特定前缀下；`config.*`、
`exec.approvals.*`、`operator.admin.*`、`wizard.*` 和 `update.*` 等核心管理命名空间保持保留，
并解析为 `operator.admin`。
`openclaw/plugin-sdk/gateway-method-runtime` 桥接保留给声明
`contracts.gatewayMethodDispatch: ["authenticated-request"]` 的插件 HTTP
路由。

完整导入映射请参阅 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## 针对 beta 版本测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签类似 `v2026.3.N-beta.1`。你也可以开启官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 的通知以获取发布公告。
2. Beta 标签出现后，请立即针对该标签测试你的插件。稳定版发布前的窗口通常只有几个小时。
3. 测试后，在 `plugin-forum` Discord 频道中你的插件线程里发布 `all good` 或说明损坏内容。如果你还没有线程，请创建一个。
4. 如果某些内容损坏，请打开或更新标题为 `Beta blocker: <plugin-name> - <summary>` 的 issue，并应用 `beta-blocker` 标签。将 issue 链接放到你的线程中。
5. 打开一个指向 `main` 的 PR，标题为 `fix(<plugin-id>): beta blocker - <summary>`，并在 PR 和你的 Discord 线程中都链接该 issue。贡献者无法给 PR 加标签，因此标题是给维护者和自动化的 PR 侧信号。有 PR 的阻塞项会被合并；没有 PR 的阻塞项可能仍会随版本发布。维护者会在 beta 测试期间关注这些线程。
6. 沉默即表示绿色。如果你错过窗口，你的修复很可能会进入下一个周期。

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
    测试实用工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-CN/plugins/manifest">
    完整清单 schema 参考
  </Card>
</CardGroup>

## 相关

- [插件钩子](/zh-CN/plugins/hooks)
- [插件架构](/zh-CN/plugins/architecture)
