---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-05-12T08:46:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

插件为 OpenClaw 扩展新能力：渠道、模型提供商、Agent harnesses、工具、Skills、语音、实时转写、实时
语音、媒体理解、图像生成、视频生成、Web 抓取、Web
搜索等。有些插件是**核心**插件（随 OpenClaw 发布），其他则是**外部**插件。大多数外部插件通过
[ClawHub](/zh-CN/clawhub) 发布和发现。Npm 仍支持直接安装，并在迁移完成前支持一组临时的 OpenClaw 所有插件包。

## 快速开始

如需可复制粘贴的安装、列出、卸载、更新和发布示例，请参阅
[管理插件](/zh-CN/plugins/manage-plugins)。

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下配置。

  </Step>

  <Step title="聊天原生管理">
    在运行中的 Gateway 网关里，仅所有者可用的 `/plugins enable` 和 `/plugins disable`
    会触发 Gateway 网关配置重载器。Gateway 网关会在进程内重新加载插件运行时
    表面，新 Agent 轮次会从刷新后的注册表重建其工具列表。`/plugins install` 会更改插件源代码，因此
    Gateway 网关会请求重启，而不是假装当前进程可以
    安全地重新加载已经导入的模块。

  </Step>

  <Step title="验证插件">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    当你需要证明已注册的工具、服务、Gateway 网关
    方法、钩子或插件拥有的 CLI 命令时，请使用 `--runtime`。普通的 `inspect` 是一次冷
    清单/注册表检查，并且有意避免导入插件运行时。

  </Step>
</Steps>

如果你更偏好聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式
`clawhub:<pkg>`、显式 `npm:<pkg>`、显式 `npm-pack:<path.tgz>`、
显式 `git:<repo>`，或通过 npm 解析的裸包规范。

如果配置无效，安装通常会失败关闭，并提示你使用
`openclaw doctor --fix`。唯一的恢复例外是一条很窄的内置插件
重装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。
在 Gateway 网关启动期间，无效的插件配置会像任何其他无效
配置一样失败关闭。运行 `openclaw doctor --fix` 可通过
禁用该插件条目并移除其无效配置载荷来隔离错误的插件配置；正常的
配置备份会保留之前的值。
当渠道配置引用了不再可发现的插件，但同一个过期插件 ID 仍留在插件配置或安装记录中时，Gateway 网关启动
会记录警告并跳过该渠道，而不是阻塞所有其他渠道。
运行 `openclaw doctor --fix` 可移除过期的渠道/插件条目；没有过期插件证据的未知
渠道键仍会验证失败，因此拼写错误仍然可见。
如果设置了 `plugins.enabled: false`，过期插件引用会被视为惰性：
Gateway 网关启动会跳过插件发现/加载工作，且 `openclaw doctor` 会保留
已禁用的插件配置，而不是自动移除它。如果你希望移除过期插件 ID，请先重新启用插件，再运行
doctor 清理。

插件依赖安装只会发生在显式安装/更新或
doctor 修复流程中。Gateway 网关启动、配置重载和运行时检查
不会运行包管理器，也不会修复依赖树。本地插件必须已经
安装好其依赖，而 npm、git 和 ClawHub 插件会
安装到 OpenClaw 的托管插件根目录下。npm 依赖可以在
OpenClaw 的托管 npm 根目录内提升；安装/更新会先扫描该托管根目录再
信任，卸载会通过 npm 移除 npm 托管的包。外部插件
和自定义加载路径仍必须通过 `openclaw plugins install` 安装。
使用 `openclaw plugins list --json` 可查看每个
可见插件的静态 `dependencyStatus`，无需导入运行时代码或修复依赖。
有关安装时生命周期，请参阅[插件依赖解析](/zh-CN/plugins/dependency-resolution)。

### 被阻止的插件路径所有权

如果插件诊断显示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
并且配置验证随后显示 `plugin present but blocked`，则表示 OpenClaw 发现
插件文件归属于与加载它们的进程不同的 Unix 用户。
保留插件配置；修复文件系统所有权，或以拥有该状态目录的同一用户身份运行
OpenClaw。

对于 Docker 安装，官方镜像以 `node`（uid `1000`）运行，因此
主机绑定挂载的 OpenClaw 配置和工作区目录通常应
归 uid `1000` 所有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 运行 OpenClaw，请改为将托管插件根目录修复为
root 所有权：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修复所有权后，重新运行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，使持久化的插件注册表匹配
已修复的文件。

对于 npm 安装，`latest` 或 dist-tag 等可变选择器会在
安装前解析，然后固定为 OpenClaw
托管 npm 根目录中精确验证过的版本。npm 完成后，OpenClaw 会验证已安装的
`package-lock.json` 条目仍匹配已解析版本和完整性。如果
npm 写入了不同的包元数据，安装会失败，托管包会
回滚，而不是接受不同的插件构件。
托管 npm 根目录还会继承 OpenClaw 包级别的 npm `overrides`，因此
保护打包宿主的安全固定同样适用于提升后的外部
插件依赖。

源码检出是 pnpm 工作区。如果你克隆 OpenClaw 来修改内置
插件，请运行 `pnpm install`；随后 OpenClaw 会从
`extensions/<id>` 加载内置插件，因此编辑内容和包本地依赖会被直接使用。
普通 npm 根目录安装用于打包版 OpenClaw，而不是源码检出
开发。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式       | 工作方式                                                           | 示例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行       | 官方插件、社区 npm 包               |
| **Bundle** | 兼容 Codex/Claude/Cursor 的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会出现在 `openclaw plugins list` 下。有关 bundle 详情，请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从[构建插件](/zh-CN/plugins/building-plugins)
和[插件 SDK 概览](/zh-CN/plugins/sdk-overview)开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目必须保持在包目录内，并解析到一个可读的
运行时文件，或解析到一个带有推断构建后 JavaScript
对等文件的 TypeScript 源文件，例如从 `src/index.ts` 到 `dist/index.js`。
打包安装必须包含该 JavaScript 运行时输出。TypeScript
源回退用于源码检出和本地开发路径，不用于
安装到 OpenClaw 托管插件根目录中的 npm 包。

放入全局扩展根目录的未跟踪目录会被视为
本地源码检出，并且可以直接加载 TypeScript 条目。仍然
由安装记录命名的目录，包括 `installPath` 或 `sourcePath`，会保持
托管状态，并保留编译输出要求，即使全局扫描看见了
它们。如果你有意将托管安装转换为未跟踪的本地
检出，请先通过卸载或 doctor 清理移除过期安装记录。

如果托管包警告说它 `requires compiled runtime output for
TypeScript entry ...`，说明该包发布时缺少 OpenClaw
运行时所需的 JavaScript 文件。这是插件打包问题，不是本地配置
问题。发布者重新发布已编译的
JavaScript 后，更新或重新安装该插件；或者在修复包可用前禁用/卸载该插件。

当已发布的运行时文件与源条目不在
相同路径时，请使用 `openclaw.runtimeExtensions`。存在时，`runtimeExtensions` 必须包含
与每个 `extensions` 条目一一对应的条目。列表不匹配会导致安装和
插件发现失败，而不是静默回退到源路径。如果你还
发布 `openclaw.setupEntry`，请为其构建后的
JavaScript 对等文件使用 `openclaw.runtimeSetupEntry`；声明后该文件是必需的。

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 官方插件

### 迁移期间 OpenClaw 所有的 npm 包

ClawHub 是大多数插件的主要分发路径。当前打包的
OpenClaw 版本已经内置许多官方插件，因此在常规设置中无需
单独 npm 安装。在每个 OpenClaw 所有插件都
迁移到 ClawHub 之前，OpenClaw 仍会在 npm 上发布一些 `@openclaw/*` 插件包，
用于旧版/自定义安装和直接 npm 工作流。

如果 npm 报告某个 `@openclaw/*` 插件包已弃用，该包
版本来自较旧的外部包列车。请使用
当前 OpenClaw 的内置插件或本地检出，直到发布更新的 npm 包。

| 插件          | 包                    | 文档                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| Discord         | `@openclaw/discord`        | [Discord](/zh-CN/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/zh-CN/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/zh-CN/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/zh-CN/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/zh-CN/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/zh-CN/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/zh-CN/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/zh-CN/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/zh-CN/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/zh-CN/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/zh-CN/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/zh-CN/plugins/zalouser)         |

### 核心（随 OpenClaw 发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="记忆插件">
    - `memory-core` - 内置记忆搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` - 基于 LanceDB 的长期记忆，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）

    请参阅 [Memory LanceDB](/zh-CN/plugins/memory-lancedb)，了解 OpenAI 兼容的
    嵌入设置、Ollama 示例、召回限制和故障排除。

  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` - 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时以及默认浏览器控制服务的内置浏览器插件（默认启用；替换它之前请禁用）
    - `copilot-proxy` - VS Code Copilot Proxy 桥接器（默认禁用）

  </Accordion>
</AccordionGroup>

正在寻找第三方插件？请参阅 [ClawHub](/zh-CN/clawhub)。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 字段               | 描述                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | 主开关（默认：`true`）                                   |
| `allow`            | 插件允许列表（可选）                                     |
| `bundledDiscovery` | 内置插件发现模式（默认为 `allowlist`）                   |
| `deny`             | 插件拒绝列表（可选；拒绝优先）                           |
| `load.paths`       | 额外插件文件/目录                                        |
| `slots`            | 独占槽位选择器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>`   | 按插件配置的开关 + 配置                                  |

`plugins.allow` 是独占的。当它非空时，只有列出的插件可以加载或暴露工具，即使 `tools.allow` 包含 `"*"` 或某个插件拥有的特定工具名称。如果工具允许列表引用插件工具，请将所属插件 id 添加到 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 会对此形态发出警告。

对于新配置，`plugins.bundledDiscovery` 默认为 `"allowlist"`，因此限制性的 `plugins.allow` 清单也会阻止被省略的内置提供商插件，包括运行时 Web 搜索提供商发现。Doctor 会在迁移期间为较旧的限制性允许列表配置标记 `"compat"`，这样升级会保留旧版内置提供商行为，直到操作者选择更严格的模式。空的 `plugins.allow` 仍会被视为未设置/开放。

通过 `/plugins enable` 或 `/plugins disable` 做出的配置更改会触发进程内 Gateway 网关插件重新加载。新的 Agent 轮次会从刷新的插件注册表重建其工具列表。安装、更新和卸载等会更改源的操作仍会重启 Gateway 网关进程，因为已导入的插件模块无法安全地就地替换。

`openclaw plugins list` 是本地插件注册表/配置快照。其中的 `enabled` 插件表示持久化注册表和当前配置允许该插件参与。它不能证明已在运行的远程 Gateway 网关已经重新加载或重启到相同的插件代码。在带有包装进程的 VPS/容器设置中，请将重启或触发重新加载的写入发送给实际的 `openclaw gateway run` 进程，或在重新加载报告失败时，对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会保留。
  - **缺失**：配置引用了发现未找到的插件 id。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。Gateway 网关启动时只会跳过该插件；`openclaw doctor --fix` 可以通过禁用无效条目并移除其配置负载来隔离该条目。

</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（第一个匹配项获胜）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` - 显式文件或目录路径。指回
    OpenClaw 自身打包内置插件目录的路径会被忽略；
    运行 `openclaw doctor --fix` 可移除这些过时别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。
    其他插件需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从已编译的 `dist/extensions` 树解析内置插件。如果一个内置插件源目录被绑定挂载到匹配的打包源路径之上，例如 `/app/extensions/synology-chat`，OpenClaw 会将该挂载的源目录视为内置源覆盖，并在打包的 `/app/dist/extensions/synology-chat` bundle 之前发现它。这样可以让维护者容器循环继续工作，而无需将每个内置插件都切回 TypeScript 源。设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包的 dist bundle，即使存在源覆盖挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件，并跳过插件发现/加载工作
- `plugins.deny` 始终优先于允许
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 除非被覆盖，否则内置插件遵循内建的默认启用集合
- 独占槽位可以强制启用为该槽位选定的插件
- 当配置命名插件拥有的界面时，一些内置的选择加入插件会自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- 当 `plugins.enabled: false` 处于活动状态时，过时的插件配置会保留；如果你想移除过时 id，请在运行 Doctor 清理前重新启用插件
- OpenAI 系列 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件由规范的 `openai/*` agent 引用、显式的
  provider/model `agentRuntime.id: "codex"`，或旧版 `codex/*` model 引用选择

## 排查运行时钩子

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子没有在实时聊天流量中运行，请先检查这些项：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认活动的
  Gateway 网关 URL、配置文件、配置路径和进程就是你正在编辑的对象。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装容器中，PID 1 可能只是 supervisor；请重启或向子级 `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --runtime --json` 确认钩子注册和诊断。非内置会话钩子，例如 `before_model_resolve`、`before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`，需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在 Agent 轮次的模型解析前运行；`llm_output` 只会在一次模型尝试产出 assistant 输出后运行。
- 要证明有效的会话模型，请使用 `openclaw sessions` 或 Gateway 网关 session/status 界面；调试提供商负载时，请用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 插件工具设置缓慢

如果 Agent 轮次在准备工具时似乎停滞，请启用 trace 日志并检查插件工具工厂耗时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出总工厂耗时和最慢的插件工具工厂，包括插件 id、声明的工具名称、结果形态，以及该工具是否可选。当单个工厂至少耗时 1 秒，或总插件工具工厂准备至少耗时 5 秒时，慢速行会提升为警告。

OpenClaw 会为具有相同有效请求上下文的重复解析缓存成功的插件工具工厂结果。缓存键包括有效运行时配置、工作区、agent/session id、沙箱策略、浏览器设置、交付上下文、请求者身份和所有权状态，因此依赖这些可信字段的工厂会在上下文变化时重新运行。

如果某个插件主导耗时，请检查其运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将昂贵的依赖加载移动到工具执行路径之后，而不是在工具工厂内部执行。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些表示有多个已启用插件试图拥有相同的渠道、设置流程或工具名称。最常见的原因是外部渠道插件安装在一个现在已提供相同渠道 id 的内置插件旁边。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件及其来源。
- 对每个疑似插件运行 `openclaw plugins inspect <id> --runtime --json`，并比较 `channels`、`channelConfigs`、`tools` 和诊断。
- 安装或移除插件包后，运行 `openclaw plugins registry --refresh`，使持久化元数据反映当前安装。
- 在安装、注册表或配置更改后重启 Gateway 网关。

修复选项：

- 如果一个插件有意替换另一个同渠道 id 的插件，首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并填入较低优先级的插件 id。请参阅 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外的，请使用 `plugins.entries.<plugin-id>.enabled: false` 禁用一侧，或移除过时的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并报告冲突。请为该渠道选择一个所有者，或重命名插件拥有的工具，使运行时界面明确无歧义。

## 插件槽位（独占类别）

某些类别是独占的（一次只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| 槽位            | 控制内容              | 默认值             |
| --------------- | --------------------- | ------------------ |
| `memory`        | 活跃记忆插件          | `memory-core`      |
| `contextEngine` | 活跃上下文引擎        | `legacy`（内建）   |

## CLI 参考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多插件默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）。其他内置插件仍需要 `openclaw plugins enable <id>`。

`--force` 会原地覆盖已安装的插件或钩子包。对已跟踪的 npm 插件进行常规升级时，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用；`--link` 会复用源路径，而不是复制到托管安装目标。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会先把已安装插件的 id 添加到该允许列表，然后启用它。如果同一个插件 id 存在于 `plugins.deny` 中，安装会移除这条过期的拒绝项，这样显式安装的插件在重启后即可立即加载。

OpenClaw 会保留一个持久化的本地插件注册表，作为插件清单、贡献所有权和启动规划的冷读模型。安装、更新、卸载、启用和禁用流程在更改插件状态后都会刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保存持久安装元数据，并在 `plugins` 中保存可重建的清单元数据。如果注册表缺失、过期或无效，`openclaw plugins registry --refresh` 会基于安装记录、配置策略以及清单/包元数据重建其清单视图，而不会加载插件运行时模块。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，插件生命周期变更命令会被禁用。请改为通过该安装的 Nix 源来管理插件包选择和配置；对于 nix-openclaw，请从 Agent 优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)开始。`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带 dist-tag 或精确版本的 npm 包规格时，会把包名解析回已跟踪的插件记录，并记录新的规格以供未来更新。传入不带版本的包名会把精确固定的安装移回注册表的默认发布线。如果已安装的 npm 插件已匹配解析后的版本和记录的构件身份，OpenClaw 会跳过更新，不会下载、重新安装或重写配置。
当 `openclaw update` 在 beta 频道运行时，默认线的 npm 和 ClawHub 插件记录会先尝试 `@beta`，如果不存在插件 beta 版本，则回退到默认/latest。精确版本和显式标签会保持固定。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为市场安装会持久化市场源元数据，而不是 npm 规格。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的应急覆盖开关。它允许插件安装和插件更新在内置 `critical` 发现项之后继续执行，但仍不会绕过插件 `before_install` 策略阻断或扫描失败阻断。安装扫描会忽略常见测试文件和目录，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻断打包的测试 mock；声明的插件运行时入口点即使使用这些名称之一，仍会被扫描。

此 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的技能依赖安装会改用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub 技能下载/安装流程。

如果你在 ClawHub 发布的插件被扫描隐藏或阻断，请打开 ClawHub 仪表板，或运行 `clawhub package rescan <name>` 请求 ClawHub 重新检查。`--dangerously-force-unsafe-install` 只影响你自己机器上的安装；它不会请求 ClawHub 重新扫描插件，也不会让被阻断的发布变为公开。

兼容包会参与同一个插件列表/检查/启用/禁用流程。当前运行时支持包括包内 Skills、Claude 命令技能、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor 命令技能，以及兼容的 Codex 钩子目录。

`openclaw plugins inspect <id>` 还会报告检测到的包能力，以及由包支持的插件中受支持或不受支持的 MCP 和 LSP 服务器条目。

市场源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知市场名称、本地市场根目录或 `marketplace.json` 路径、形如 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程市场，插件条目必须保留在克隆的市场仓库内，并且只能使用相对路径源。

参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)了解详情。

## 插件 API 概览

Native plugins 会导出一个入口对象，该对象暴露 `register(api)`。旧插件可能仍将 `activate(api)` 用作遗留别名，但新插件应使用 `register`。

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公共契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式            | 含义                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由和其他实时副作用。                              |
| `discovery`     | 只读能力发现。注册提供商和元数据；可信插件入口代码可以加载，但应跳过实时副作用。 |
| `setup-only`    | 通过轻量级设置入口加载频道设置元数据。                                                                |
| `setup-runtime` | 也需要运行时入口的频道设置加载。                                                                         |
| `cli-metadata`  | 仅收集 CLI 命令元数据。                                                                                            |

会打开套接字、数据库、后台工作线程或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 保护这些副作用。发现加载与激活加载分开缓存，并且不会替换正在运行的 Gateway 网关注册表。发现是非激活的，但不是免导入的：OpenClaw 可能会求值可信插件入口或频道插件模块来构建快照。保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移到完整运行时路径之后。

常见注册方法：

| 方法                                  | 注册内容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM）        |
| `registerChannel`                       | 聊天渠道                |
| `registerTool`                          | Agent 工具                  |
| `registerHook` / `on(...)`              | 生命周期钩子             |
| `registerSpeechProvider`                | 文本转语音 / STT        |
| `registerRealtimeTranscriptionProvider` | 流式 STT               |
| `registerRealtimeVoiceProvider`         | 双工实时语音       |
| `registerMediaUnderstandingProvider`    | 图像/音频分析        |
| `registerImageGenerationProvider`       | 图像生成            |
| `registerMusicGenerationProvider`       | 音乐生成            |
| `registerVideoGenerationProvider`       | 视频生成            |
| `registerWebFetchProvider`              | Web 获取 / 抓取提供商 |
| `registerWebSearchProvider`             | Web 搜索                  |
| `registerHttpRoute`                     | HTTP 端点               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | 上下文引擎              |
| `registerService`                       | 后台服务          |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 是终止性的；较低优先级的处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除更早的阻断。
- `before_install`：`{ block: true }` 是终止性的；较低优先级的处理器会被跳过。
- `before_install`：`{ block: false }` 是空操作，不会清除更早的阻断。
- `message_sending`：`{ cancel: true }` 是终止性的；较低优先级的处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除更早的取消。

Codex 原生 app-server 会将桥接后的 Codex 原生工具事件运行回此钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。该桥接目前还不会重写 Codex 原生工具参数。确切的 Codex 运行时支持边界见 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)。

有关完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins) - 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) - Codex/Claude/Cursor 包兼容性
- [插件清单](/zh-CN/plugins/manifest) - 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) - 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) - 能力模型和加载流水线
- [ClawHub](/zh-CN/clawhub) - 第三方插件发现
