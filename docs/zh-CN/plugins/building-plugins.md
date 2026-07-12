---
doc-schema-version: 1
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一份插件开发快速开始指南
    - 你正在选择渠道、提供商、CLI 后端、工具或 Hooks 文档
sidebarTitle: Getting Started
summary: 几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-07-11T20:43:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

插件无需修改核心即可扩展 OpenClaw。插件可以添加消息渠道、模型提供商、本地 CLI 后端、智能体工具、钩子、媒体提供商或其他由插件所有的能力。

你无需将外部插件添加到 OpenClaw 仓库。将软件包发布到 [ClawHub](/clawhub)，用户即可通过以下命令安装：

```bash
openclaw plugins install clawhub:<package-name>
```

在发布切换期间，不带前缀的软件包说明仍会从 npm 安装。如果需要通过 ClawHub 解析，请使用 `clawhub:` 前缀。

## 要求

- Node 22.19+、Node 23.11+ 或 Node 24+，以及 `npm` 或 `pnpm`。
- TypeScript ESM 模块。
- 对于仓库内的内置插件开发，请克隆仓库并运行 `pnpm install`。由于 OpenClaw 从 `extensions/*` 工作区软件包中发现内置插件，因此源码检出环境中的插件开发仅支持 pnpm。

## 选择插件形态

<CardGroup cols={2}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台。
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    添加模型、媒体、搜索、抓取、语音或实时提供商。
  </Card>
  <Card title="CLI 后端插件" icon="terminal" href="/zh-CN/plugins/cli-backend-plugins">
    通过 OpenClaw 模型回退运行本地 AI CLI。
  </Card>
  <Card title="工具插件" icon="wrench" href="/zh-CN/plugins/tool-plugins">
    注册智能体工具。
  </Card>
</CardGroup>

## 快速开始

通过注册一个必需的智能体工具来构建最小工具插件。这是最简短且实用的插件形态，涵盖软件包、清单、入口点和本地验证。

<Steps>
  <Step title="创建软件包元数据">
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

    已发布的外部插件应将运行时入口指向构建后的 JavaScript 文件。完整的入口点契约请参阅 [SDK 入口点](/zh-CN/plugins/sdk-entrypoints)。

    每个插件都需要清单，即使没有配置也不例外。运行时工具必须出现在 `contracts.tools` 中，以便 OpenClaw 无需预先加载每个插件运行时即可发现所有权。请有意设置 `activation.onStartup`；本示例会在 Gateway 网关启动时加载。

    主机信任的插件表面同样受清单约束，已安装的插件必须显式声明：`api.registerAgentToolResultMiddleware(...)` 要求在 `contracts.agentToolResultMiddleware` 中列出每个目标运行时，而 `api.registerTrustedToolPolicy(...)` 要求在 `contracts.trustedToolPolicies` 中列出每个策略 ID。这些声明可使安装时检查与运行时注册保持一致。

    有关每个清单字段，请参阅[插件清单](/zh-CN/plugins/manifest)。

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

    非渠道插件请使用 `definePluginEntry`。渠道插件则使用 `openclaw/plugin-sdk/core` 中的 `defineChannelPluginEntry`。

  </Step>

  <Step title="测试运行时">
    对于已安装或外部插件，请检查已加载的运行时：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果插件注册了 CLI 命令，也请运行该命令并确认输出，例如 `openclaw demo-plugin ping`。

    对于此仓库中的内置插件，OpenClaw 会从 `extensions/*` 工作区发现源码检出环境中的插件软件包。运行最接近目标的测试：

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="测试软件包安装">
    发布已准备好打包的插件之前，请测试用户将获得的相同安装形态。首先添加构建步骤，将 `openclaw.extensions` 等运行时入口指向类似 `./dist/index.js` 的构建后 JavaScript 文件，并确保 `npm pack` 包含该 `dist/` 输出。TypeScript 源码入口仅用于源码检出环境和本地开发路径。

    然后打包插件，并使用 `npm-pack:` 安装 tarball：

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` 使用 OpenClaw 管理的每插件 npm 项目，因此能够发现源码检出测试可能掩盖的运行时依赖错误。它验证软件包和依赖结构，而不是与目录关联的官方信任状态。运行时导入必须位于 `dependencies` 或 `optionalDependencies` 中；仅保留在 `devDependencies` 中的依赖不会为托管运行时项目安装。

    不要将原始归档或路径安装用作官方或特权插件行为的最终验证。原始源代码适合本地调试，但无法验证与 npm 或 ClawHub 安装相同的依赖路径。如果你的插件依赖受信任的官方插件状态，请通过目录支持的官方安装，或通过记录官方信任状态的已发布软件包路径添加第二项验证。有关安装根目录和依赖所有权的详细信息，请参阅[插件依赖解析](/zh-CN/plugins/dependency-resolution)。

  </Step>

  <Step title="发布">
    发布前验证软件包：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    规范的 ClawHub 软件包代码片段位于 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="安装">
    通过 ClawHub 安装已发布的软件包：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 注册工具

工具可以是必需的，也可以是可选的。启用插件后，必需工具始终可用。OpenClaw 加载拥有可选工具的插件运行时之前，需要用户显式选择启用。

工具工厂会接收受信任的运行时上下文，包括 `deliveryContext`、可用时当前平台对话的 `nativeChannelId`，以及 `requesterSenderId`。

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

使用 `api.registerTool(...)` 注册的每个工具还必须在插件清单中声明：

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
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

可选工具用于控制是否向模型公开工具。如果工具或钩子应在模型选择后、操作运行前请求审批，请使用[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

对于具有副作用、使用不常见二进制文件或默认不应公开的能力，请使用可选工具。工具名称不得与核心工具名称冲突；冲突项会被跳过，并在插件诊断中报告。格式错误的注册也会以相同方式跳过并报告：缺少非空 `name`、`execute` 不是函数，或工具描述符缺少 `parameters` 对象。

工具工厂会接收由运行时提供的上下文对象。当工具需要记录、显示或适配当前轮次的活跃模型时，请使用 `ctx.activeModel`；它可能包含 `provider`、`modelId` 和 `modelRef`。请将其视为信息性运行时元数据，而不是防范本地操作员、已安装插件代码或修改后的 OpenClaw 运行时的安全边界。敏感的本地工具仍应要求显式启用插件或由操作员选择启用，并在活跃模型元数据缺失或不适用时采用默认拒绝策略。

清单声明所有权和发现信息；执行时仍会调用实时注册的工具实现。请保持 `toolMetadata.<tool>.optional: true` 与 `api.registerTool(..., { optional: true })` 一致，以便 OpenClaw 在工具被显式加入允许列表之前无需加载该插件运行时。

## 导入约定

从聚焦的插件 SDK 子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

不要从已弃用的根桶文件导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

在你的插件软件包内，内部导入应使用 `api.ts` 和 `runtime-api.ts` 等本地桶文件。不要通过 SDK 路径导入你自己的插件。除非接口确实具有通用性，否则提供商专用辅助函数应保留在提供商软件包中。

自定义 Gateway RPC 方法属于高级入口点。请使用插件专用前缀；`config.*`、`exec.approvals.*`、`operator.admin.*`、`wizard.*` 和 `update.*` 等核心管理命名空间保持保留状态，并解析为 `operator.admin`。`openclaw/plugin-sdk/gateway-method-runtime` 桥接器仅供声明了 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的插件 HTTP 路由使用。

完整导入映射请参阅[插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 提交前检查清单

<Check>**package.json** 包含正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入均使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而非 SDK 自导入</Check>
<Check>测试通过（`pnpm test <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## 针对 Beta 版本进行测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 的发布（`Watch` > `Releases`）。Beta 标签格式类似 `v2026.3.N-beta.1`。你也可以在 X 上关注 [@openclaw](https://x.com/openclaw)，获取发布公告。
2. Beta 标签出现后，立即使用该标签测试你的插件。距离稳定版发布通常只有几个小时。
3. 测试后，在 `plugin-forum` Discord 渠道（[discord.gg/clawd](https://discord.gg/clawd)）中你的插件讨论串里发布 `all good`，或说明出现了哪些问题。如果尚无讨论串，请创建一个。
4. 如果出现问题，请新建或更新标题为 `Beta blocker: <plugin-name> - <summary>` 的议题，并添加 `beta-blocker` 标签。在你的讨论串中链接该议题。
5. 向 `main` 提交标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和 Discord 讨论串中链接该议题。贡献者无法为 PR 添加标签，因此该标题是向维护者和自动化系统发出的 PR 端信号。有 PR 的阻塞问题会被合并；没有 PR 的阻塞问题可能仍会随版本发布。
6. 没有反馈即表示一切正常。错过此时间窗口通常意味着你的修复将在下一个周期合入。

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
    通过 api.runtime 使用 TTS、搜索和子智能体
  </Card>
  <Card title="测试" icon="test-tubes" href="/zh-CN/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-CN/plugins/manifest">
    完整的清单模式参考
  </Card>
</CardGroup>

## 相关内容

- [插件钩子](/zh-CN/plugins/hooks)
- [插件架构](/zh-CN/plugins/architecture)
