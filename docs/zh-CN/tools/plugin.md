---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用兼容 Codex/Claude 的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-05-06T11:45:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cb1f43f7ccc99889b62648562319d205a13072a93cc9fbc7ca0e00c96e19ed6
    source_path: tools/plugin.md
    workflow: 16
---

插件为 OpenClaw 扩展新的能力：渠道、模型提供商、
智能体 harness、工具、Skills、语音、实时转录、实时
语音、媒体理解、图像生成、视频生成、Web 获取、Web
搜索等。一些插件是 **核心**（随 OpenClaw 一起发布），其他插件是
**外部** 插件。大多数外部插件通过
[ClawHub](/zh-CN/tools/clawhub) 发布和发现。Npm 仍支持直接安装，以及在迁移完成前临时保留的一组 OpenClaw 自有插件包。

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

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>

  <Step title="聊天原生管理">
    在运行中的 Gateway 网关内，仅所有者可用的 `/plugins enable` 和 `/plugins disable`
    会触发 Gateway 网关配置重载器。Gateway 网关会在进程内重新加载插件运行时
    表面，新的智能体轮次会从刷新后的注册表重新构建其工具列表。`/plugins install` 会更改插件源代码，因此
    Gateway 网关会请求重启，而不是假装当前进程可以
    安全地重新加载已导入的模块。

  </Step>

  <Step title="验证插件">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    当你需要证明已注册的工具、服务、gateway
    方法、钩子或插件自有 CLI 命令时，请使用 `--runtime`。普通 `inspect` 是冷
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
显式 `git:<repo>`，或通过 npm 的裸包规范。

如果配置无效，安装通常会失败关闭，并指向
`openclaw doctor --fix`。唯一的恢复例外是一个狭窄的内置插件
重装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。
在 Gateway 网关启动期间，无效插件配置会像任何其他无效
配置一样失败关闭。运行 `openclaw doctor --fix` 可通过
禁用该插件条目并移除其无效配置载荷来隔离有问题的插件配置；普通
配置备份会保留先前的值。
当渠道配置引用的插件已不再可发现，但
同一个过期插件 id 仍留在插件配置或安装记录中时，Gateway 网关启动
会记录警告并跳过该渠道，而不是阻塞所有其他渠道。
运行 `openclaw doctor --fix` 可移除过期的渠道/插件条目；没有过期插件证据的未知
渠道键名仍会验证失败，以便拼写错误保持可见。
如果设置了 `plugins.enabled: false`，过期插件引用会被视为惰性：
Gateway 网关启动会跳过插件发现/加载工作，而 `openclaw doctor` 会保留
已禁用的插件配置，而不是自动移除它。如果你希望移除过期插件 id，请先重新启用插件，再
运行 Doctor 清理。

插件依赖安装只会在显式安装/更新或
Doctor 修复流程中发生。Gateway 网关启动、配置重载和运行时检查不会
运行包管理器或修复依赖树。本地插件必须已经
安装其依赖，而 npm、git 和 ClawHub 插件会
安装到 OpenClaw 管理的插件根目录下。npm 依赖可以在 OpenClaw 管理的 npm 根目录内提升；安装/更新会在信任前扫描该管理根目录，
卸载则通过 npm 移除 npm 管理的包。外部插件
和自定义加载路径仍必须通过 `openclaw plugins install` 安装。
使用 `openclaw plugins list --json` 可在不导入运行时代码或修复依赖的情况下查看每个
可见插件的静态 `dependencyStatus`。
请参阅 [插件依赖解析](/zh-CN/plugins/dependency-resolution) 了解
安装时生命周期。

### 被阻止的插件路径所有权

如果插件诊断提示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
并且配置验证随后显示 `plugin present but blocked`，说明 OpenClaw 发现
插件文件的 Unix 所有者与正在加载
它们的进程不同。保留插件配置；修复文件系统所有权，或以拥有状态目录的同一用户身份运行
OpenClaw。

对于 Docker 安装，官方镜像以 `node`（uid `1000`）运行，因此
宿主机绑定挂载的 OpenClaw 配置和工作区目录通常应由 uid `1000`
拥有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 身份运行 OpenClaw，请改为将管理的插件根目录修复为
root 所有权：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修复所有权后，重新运行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，使持久化的插件注册表与
已修复的文件匹配。

对于 npm 安装，`latest` 或 dist-tag 等可变选择器会在安装前解析，
随后固定为 OpenClaw
管理的 npm 根目录中已验证的精确版本。npm 完成后，OpenClaw 会验证已安装的
`package-lock.json` 条目仍与解析的版本和完整性匹配。如果
npm 写入不同的包元数据，安装会失败，并回滚管理的包，
而不是接受不同的插件产物。
管理的 npm 根目录也会继承 OpenClaw 的包级 npm `overrides`，因此
保护打包主机的安全固定也会应用到提升后的外部
插件依赖。

源码检出是 pnpm 工作区。如果你克隆 OpenClaw 来修改内置
插件，请运行 `pnpm install`；OpenClaw 随后会从
`extensions/<id>` 加载内置插件，因此编辑内容和包本地依赖会被直接使用。
普通 npm 根安装适用于打包版 OpenClaw，而不是源码检出
开发。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式       | 工作方式                                                       | 示例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行       | 官方插件、社区 npm 包               |
| **Bundle** | Codex/Claude/Cursor 兼容布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 下。有关 bundle 详情，请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目必须保持在包目录内，并解析到可读取的
运行时文件，或解析到带有推断构建后 JavaScript
对应项的 TypeScript 源文件，例如从 `src/index.ts` 到 `dist/index.js`。
打包安装必须发布该 JavaScript 运行时输出。TypeScript
源回退用于源码检出和本地开发路径，不用于
安装到 OpenClaw 管理的插件根目录中的 npm 包。

如果管理包警告提示它 `requires compiled runtime output for
TypeScript entry ...`，说明该包发布时缺少 OpenClaw
运行时所需的 JavaScript 文件。这是插件打包问题，不是本地配置
问题。在发布者重新发布编译后的
JavaScript 之后更新或重新安装该插件，或禁用/卸载该插件，直到可用的修复包发布。

当已发布的运行时文件与源条目不在相同路径时，请使用 `openclaw.runtimeExtensions`。存在时，`runtimeExtensions` 必须包含
与每个 `extensions` 条目一一对应的条目。不匹配的列表会导致安装和
插件发现失败，而不是静默回退到源路径。如果你还
发布 `openclaw.setupEntry`，请为其构建后的
JavaScript 对应项使用 `openclaw.runtimeSetupEntry`；声明后该文件是必需的。

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

### 迁移期间 OpenClaw 自有的 npm 包

ClawHub 是大多数插件的主要分发路径。当前打包的
OpenClaw 版本已经内置许多官方插件，因此在常规设置中这些插件不需要
单独 npm 安装。在每个 OpenClaw 自有插件都
迁移到 ClawHub 之前，OpenClaw 仍会在
npm 上发布一些 `@openclaw/*` 插件包，以支持较旧/自定义安装和直接 npm 工作流。

如果 npm 将某个 `@openclaw/*` 插件包报告为已弃用，则该包
版本来自较旧的外部包列车。请使用
当前 OpenClaw 的内置插件或本地检出，直到发布更新的 npm 包。

| 插件          | 包                    | 文档                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/zh-CN/channels/bluebubbles)       |
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

### 核心（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` - 内置记忆搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` - 由 LanceDB 支持、具备自动召回/捕获的长期记忆（设置 `plugins.slots.memory = "memory-lancedb"`）

    有关 OpenAI 兼容的嵌入设置、Ollama 示例、召回限制和故障排除，请参见 [Memory LanceDB](/zh-CN/plugins/memory-lancedb)。

  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` - 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时和默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
    - `copilot-proxy` - VS Code Copilot Proxy 桥接（默认禁用）

  </Accordion>
</AccordionGroup>

在找第三方插件？请参见 [社区插件](/zh-CN/plugins/community)。

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

| 字段               | 说明                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | 主开关（默认值：`true`）                                  |
| `allow`            | 插件允许列表（可选）                                      |
| `bundledDiscovery` | 内置插件发现模式（默认为 `allowlist`）                    |
| `deny`             | 插件拒绝列表（可选；拒绝优先）                            |
| `load.paths`       | 额外的插件文件/目录                                       |
| `slots`            | 独占槽位选择器（例如 `memory`、`contextEngine`）           |
| `entries.\<id\>`   | 每个插件的开关 + 配置                                     |

`plugins.allow` 是排他性的。当它非空时，只有列出的插件可以加载或暴露工具，即使 `tools.allow` 包含 `"*"` 或某个特定插件拥有的工具名称也是如此。如果工具允许列表引用了插件工具，请将拥有这些工具的插件 ID 添加到 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 会对此类结构发出警告。

对于新配置，`plugins.bundledDiscovery` 默认为 `"allowlist"`，因此限制性的 `plugins.allow` 清单也会阻止未列出的内置提供商插件，包括运行时 Web 搜索提供商发现。迁移期间，Doctor 会为较旧的限制性允许列表配置标记 `"compat"`，以便升级保持旧版内置提供商行为，直到操作者选择更严格的模式。空的 `plugins.allow` 仍会被视为未设置/开放。

通过 `/plugins enable` 或 `/plugins disable` 进行的配置更改会触发进程内 Gateway 网关插件重新加载。新的智能体轮次会基于刷新的插件注册表重建其工具列表。安装、更新和卸载等更改源代码的操作仍会重启 Gateway 网关进程，因为已经导入的插件模块无法安全地原地替换。

`openclaw plugins list` 是本地插件注册表/配置快照。其中的 `enabled` 插件表示持久化注册表和当前配置允许该插件参与。它并不证明已经运行的远程 Gateway 网关已重新加载或重启到相同的插件代码。在带有包装进程的 VPS/容器设置中，请向实际的 `openclaw gateway run` 进程发送重启或会触发重新加载的写入，或者在重新加载报告失败时，对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用、缺失与无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会保留。
  - **缺失**：配置引用了一个插件 ID，但发现过程未找到它。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。Gateway 网关启动时只跳过该插件；`openclaw doctor --fix` 可以通过禁用它并移除其配置载荷来隔离无效条目。

</Accordion>

## 发现和优先级

OpenClaw 按以下顺序扫描插件（第一个匹配项优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` - 显式文件或目录路径。指回 OpenClaw 自身打包内置插件目录的路径会被忽略；运行 `openclaw doctor --fix` 可移除这些过时别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。其他插件需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从已编译的 `dist/extensions` 树解析内置插件。如果某个内置插件源目录被 bind mount 覆盖到匹配的打包源路径，例如 `/app/extensions/synology-chat`，OpenClaw 会将该挂载的源目录视为内置源覆盖层，并在打包的 `/app/dist/extensions/synology-chat` bundle 之前发现它。这让维护者容器循环无需将每个内置插件都切回 TypeScript 源码即可工作。设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包的 dist bundle，即使存在源覆盖挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件，并跳过插件发现/加载工作
- `plugins.deny` 始终优先于允许
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内置的默认开启集合，除非被覆盖
- 独占槽位可以强制启用该槽位选定的插件
- 当配置命名了某个插件拥有的表面时，部分内置的选择加入型插件会自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- 当 `plugins.enabled: false` 处于活动状态时，过时插件配置会保留；如果希望移除过时 ID，请先重新启用插件再运行 Doctor 清理
- OpenAI 系 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex 应用服务器插件由 `agentRuntime.id: "codex"` 或旧版 `codex/*` 模型引用选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认活动的 Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的对象。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装容器中，PID 1 可能只是 supervisor；请重启或向子 `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --runtime --json` 确认钩子注册和诊断。非内置会话钩子（如 `before_model_resolve`、`before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 只会在一次模型尝试产生助手输出之后运行。
- 要证明有效会话模型，请使用 `openclaw sessions` 或 Gateway 网关会话/Status 表面；调试提供商载荷时，请使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 插件工具设置缓慢

如果智能体轮次看起来在准备工具时停滞，请启用 trace 日志并检查插件工具工厂计时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出总工厂耗时和最慢的插件工具工厂，包括插件 ID、声明的工具名称、结果形状，以及该工具是否可选。当单个工厂耗时至少 1 秒，或插件工具工厂准备总耗时至少 5 秒时，慢速行会提升为警告。

OpenClaw 会为具有相同有效请求上下文的重复解析缓存成功的插件工具工厂结果。缓存键包括有效运行时配置、工作区、智能体/会话 ID、沙箱策略、浏览器设置、投递上下文、请求者身份和所有权状态，因此依赖这些可信字段的工厂会在上下文变化时重新运行。

如果某个插件占据主要耗时，请检查其运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将昂贵的依赖加载移动到工具执行路径之后，而不是在工具工厂内部执行。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些表示多个已启用插件正试图拥有同一个渠道、设置流程或工具名称。最常见的原因是在现在提供同一渠道 ID 的内置插件旁边安装了外部渠道插件。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --runtime --json`，并比较 `channels`、`channelConfigs`、`tools` 和诊断。
- 安装或移除插件包后，运行 `openclaw plugins registry --refresh`，使持久化元数据反映当前安装。
- 在安装、注册表或配置更改后重启 Gateway 网关。

修复选项：

- 如果某个插件有意替换同一渠道 ID 的另一个插件，首选插件应使用较低优先级插件 ID 声明 `channelConfigs.<channel-id>.preferOver`。请参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请使用 `plugins.entries.<plugin-id>.enabled: false` 禁用一方，或移除过时的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并报告冲突。请为该渠道选择一个所有者，或重命名插件拥有的工具，使运行时表面无歧义。

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

| 槽位            | 控制内容            | 默认值              |
| --------------- | ------------------- | ------------------- |
| `memory`        | 活动记忆插件        | `memory-core`       |
| `contextEngine` | 活动上下文引擎      | `legacy`（内置）    |

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

内置插件随 OpenClaw 一起提供。许多插件默认启用（例如内置模型提供商、内置语音提供商，以及内置浏览器插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖已安装的插件或钩子包。对于已跟踪的 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到托管安装目标上。

当已设置 `plugins.allow` 时，`openclaw plugins install` 会先将已安装插件 ID 添加到该允许列表，然后再启用它。如果同一个插件 ID 存在于 `plugins.deny` 中，安装会移除该过时的拒绝条目，以便显式安装后重启即可加载。

OpenClaw 会保留一个持久化的本地插件注册表，作为插件清单、贡献归属和启动规划的冷读取模型。安装、更新、卸载、启用和禁用流程会在更改插件状态后刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保存持久安装元数据，并在 `plugins` 中保存可重建的清单元数据。如果注册表缺失、过时或无效，`openclaw plugins registry --refresh` 会根据安装记录、配置策略以及清单/包元数据重建其清单视图，而不会加载插件运行时模块。`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带 dist-tag 或精确版本的 npm 包规范，会将包名解析回已跟踪的插件记录，并记录新的规范以供后续更新使用。传入不带版本的包名，会把精确固定的安装移回注册表的默认发布线。如果已安装的 npm 插件已经匹配解析后的版本和记录的工件身份，OpenClaw 会跳过更新，不会下载、重新安装或重写配置。当 `openclaw update` 在 beta 频道运行时，默认线 npm 和 ClawHub 插件记录会先尝试 `@beta`，如果没有插件 beta 版本，则回退到默认/latest。精确版本和显式标签保持固定。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久保存 marketplace 来源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的应急覆盖开关。它允许插件安装和插件更新在遇到内置 `critical` 发现项后继续进行，但仍然不会绕过插件 `before_install` 策略阻断或扫描失败阻断。安装扫描会忽略常见测试文件和目录，例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻断打包的测试 mock；声明的插件运行时入口点即使使用这些名称之一，仍然会被扫描。

此 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的技能依赖安装改用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub 技能下载/安装流程。

如果你发布在 ClawHub 上的插件被扫描隐藏或阻断，请打开 ClawHub 仪表板，或运行 `clawhub package rescan <name>` 请求 ClawHub 重新检查它。`--dangerously-force-unsafe-install` 只影响你自己机器上的安装；它不会请求 ClawHub 重新扫描插件，也不会让被阻断的发布公开。

兼容包参与同一套插件 list/inspect/enable/disable 流程。当前运行时支持包括包技能、Claude 命令技能、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor 命令技能，以及兼容的 Codex 钩子目录。

`openclaw plugins inspect <id>` 还会报告检测到的包能力，以及由包支持的插件中受支持或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内，并且只能使用相对路径来源。

了解详情，请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，该对象暴露 `register(api)`。旧插件可能仍然使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

OpenClaw 会在插件激活期间加载入口对象并调用 `register(api)`。加载器仍会回退到为旧插件调用 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公共契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由和其他实时副作用。 |
| `discovery` | 只读能力发现。注册提供商和元数据；可信插件入口代码可能会加载，但应跳过实时副作用。 |
| `setup-only` | 通过轻量设置入口加载渠道设置元数据。 |
| `setup-runtime` | 还需要运行时入口的渠道设置加载。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

会打开 socket、数据库、后台 worker 或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 保护这些副作用。发现加载会与激活加载分开缓存，并且不会替换正在运行的 Gateway 网关注册表。发现是非激活式的，但并非免导入：OpenClaw 可能会求值可信插件入口或渠道插件模块来构建快照。保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移到完整运行时路径之后。

常见注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供商（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期钩子 |
| `registerSpeechProvider` | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider` | 双工实时语音 |
| `registerMediaUnderstandingProvider` | 图像/音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerMusicGenerationProvider` | 音乐生成 |
| `registerVideoGenerationProvider` | 视频生成 |
| `registerWebFetchProvider` | Web 抓取 / 爬取提供商 |
| `registerWebSearchProvider` | Web 搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 会终止流程；较低优先级的处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除较早的阻断。
- `before_install`：`{ block: true }` 会终止流程；较低优先级的处理器会被跳过。
- `before_install`：`{ block: false }` 是无操作，不会清除较早的阻断。
- `message_sending`：`{ cancel: true }` 会终止流程；较低优先级的处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除较早的取消。

原生 Codex app-server 会将 Codex 原生工具事件桥接回此钩子表面。插件可以通过 `before_tool_call` 阻断原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。该桥接尚不会重写 Codex 原生工具参数。确切的 Codex 运行时支持边界位于 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

如需完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) - 创建你自己的插件
- [插件捆绑包](/zh-CN/plugins/bundles) - Codex/Claude/Cursor 捆绑包兼容性
- [插件清单](/zh-CN/plugins/manifest) - 清单模式
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) - 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) - 能力模型和加载管线
- [社区插件](/zh-CN/plugins/community) - 第三方列表
