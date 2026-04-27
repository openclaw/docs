---
read_when:
    - 安装或配置插件
    - 了解插件发现与加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置并管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-27T23:12:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3465cb1f7e304c0ffd59ae9a4c586237f99f1dc861e93821f9a9d1fea4e371d
    source_path: tools/plugin.md
    workflow: 15
---

插件可通过新增功能来扩展 OpenClaw：渠道、模型提供商、智能体 harness、工具、Skills、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件属于**核心**插件（随 OpenClaw 一起提供），另一些则是**外部**插件（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # 从 npm
    openclaw plugins install @openclaw/voice-call

    # 从本地目录或归档文件
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
</Steps>

如果你更喜欢聊天原生控制方式，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式
`clawhub:<pkg>`、显式 `npm:<pkg>`，或裸包规范（优先 ClawHub，然后回退到
npm）。

如果配置无效，安装通常会以失败关闭，并引导你使用
`openclaw doctor --fix`。唯一的恢复例外是一个狭义的内置插件重装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。
在 Gateway 网关启动期间，某个插件的无效配置只会隔离到该插件本身：
启动会记录 `plugins.entries.<id>.config` 问题，加载时跳过该插件，并保持其他插件和渠道在线。运行 `openclaw doctor --fix`
可通过禁用该插件条目并删除其无效配置负载来隔离有问题的插件配置；常规配置备份会保留先前的值。
当某个渠道配置引用了一个已无法再发现的插件，但插件配置或安装记录中仍保留相同的过期插件 id 时，Gateway 网关启动会记录警告并跳过该渠道，而不是阻塞所有其他渠道。
运行 `openclaw doctor --fix` 可移除这些过期的渠道/插件条目；若未知渠道键没有过期插件证据，则仍会验证失败，从而让拼写错误保持可见。
如果设置了 `plugins.enabled: false`，则过期插件引用会被视为惰性：
Gateway 网关启动会跳过插件发现/加载工作，而 `openclaw doctor` 会保留已禁用的插件配置，而不是自动删除它。如果你希望移除过期插件 id，请先重新启用插件，再运行 doctor 清理。

打包的 OpenClaw 安装不会急切安装每个内置插件的全部运行时依赖树。
当某个由 OpenClaw 拥有的内置插件因插件配置、旧版渠道配置或默认启用的清单而处于激活状态时，启动仅会在导入前修复该插件声明的运行时依赖。
仅存在持久化的渠道认证状态，并不会激活某个内置渠道以进行 Gateway 网关启动时的运行时依赖修复。
显式禁用仍然优先生效：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
都会阻止该插件/渠道的内置运行时依赖自动修复。
非空的 `plugins.allow` 也会限制默认启用的内置运行时依赖修复；
显式启用内置渠道（`channels.<id>.enabled: true`）仍可修复该渠道的插件依赖。
外部插件和自定义加载路径仍必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 bundle 的详细信息，请参见 [插件 Bundle](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目都必须位于包目录内部，并解析到一个可读的
运行时文件，或者解析到一个 TypeScript 源文件，并带有可推断的构建后 JavaScript
对应文件，例如 `src/index.ts` 对应 `dist/index.js`。

当发布的运行时文件与源条目不位于相同路径时，请使用 `openclaw.runtimeExtensions`。
如果存在，`runtimeExtensions` 必须为每个 `extensions` 条目准确包含一个对应项。列表不匹配会导致安装和
插件发现失败，而不是静默回退到源路径。

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

### 可安装（npm）

| 插件 | 包 | 文档 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/zh-CN/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/zh-CN/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/zh-CN/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/zh-CN/plugins/zalouser) |

### 核心（随 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置 Memory 搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 按需安装的长期 Memory，带自动召回/捕获功能（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时和默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
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

| 字段 | 说明 |
| ---------------- | --------------------------------------------------------- |
| `enabled` | 主开关（默认：`true`） |
| `allow` | 插件允许列表（可选） |
| `deny` | 插件拒绝列表（可选；拒绝优先） |
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 排他性插槽选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每插件开关 + 配置 |

配置更改**需要重启 gateway**。如果 Gateway 网关正在以启用了配置监视 + 进程内重启的方式运行（默认的 `openclaw gateway` 路径），则该
重启通常会在配置写入完成后不久自动执行。
原生插件运行时代码或生命周期钩子没有受支持的热重载路径；
在期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或
提供商/运行时钩子开始运行之前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表/配置快照。其中显示某插件
`enabled` 表示持久化注册表和当前配置允许该插件参与运行。
这并不能证明一个已经运行中的远程 Gateway 网关子进程已经重启并载入同一插件代码。在
VPS/容器设置中，如果存在包装进程，请将重启发送给实际的 `openclaw gateway run` 进程，
或对运行中的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了一个插件 id，但发现流程未找到该插件。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。Gateway 网关启动时只会跳过该插件；`openclaw doctor --fix` 可通过禁用该条目并移除其配置负载来隔离无效条目。
</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。指回 OpenClaw 自身打包内置插件目录的路径会被忽略；
    运行 `openclaw doctor --fix` 可移除这些过期别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起提供。许多默认启用（模型提供商、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从已编译的
`dist/extensions` 树解析内置插件。如果某个内置插件源码目录被
绑定挂载到匹配的打包源码路径之上，例如
`/app/extensions/synology-chat`，OpenClaw 会将该挂载的源码目录
视为内置源码覆盖层，并在打包的
`/app/dist/extensions/synology-chat` bundle 之前发现它。这样可以让维护者容器
开发循环继续工作，而无需将每个内置插件都切回 TypeScript 源码。
设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包的 dist bundle，
即使存在源码覆盖挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件，并跳过插件发现/加载工作
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来源于工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认开启集合，除非被覆盖
- 排他性插槽可以为该插槽中选定的插件强制启用
- 某些需主动选择加入的内置插件会在配置命名了某个
  插件拥有的功能面时自动启用，例如提供商模型引用、渠道配置或 harness
  运行时
- 当 `plugins.enabled: false` 处于激活状态时，会保留过期插件配置；
  如果你想移除过期 id，请先重新启用插件，再运行 doctor 清理
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件则由 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 的副作用或钩子
没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc` 并确认活动的
  Gateway 网关 URL、配置文件、配置路径和进程正是你正在编辑的那些。
- 在插件安装/配置/代码变更后重启实时 Gateway 网关。在包装器
  容器中，PID 1 可能只是一个监督进程；请重启或向子
  `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和
  诊断信息。非内置的会话钩子，例如 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体回合的模型解析之前运行；`llm_output` 仅会在某次模型尝试产出助手输出后运行。
- 如需验证实际生效的会话模型，请使用 `openclaw sessions` 或
  Gateway 网关的会话/状态功能面；在调试提供商负载时，请使用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具归属

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这意味着有多个已启用插件正试图拥有同一个渠道、
设置流程或工具名称。最常见的原因是某个外部渠道插件
与一个现已提供相同渠道 id 的内置插件同时安装。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件
  及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --json`，并
  比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 在安装或移除
  插件包后运行 `openclaw plugins registry --refresh`，以便持久化元数据反映当前安装状态。
- 在安装、注册表或配置变更后重启 Gateway 网关。

修复方式：

- 如果某个插件有意替代另一个插件来提供相同渠道 id，则
  优先插件应声明 `channelConfigs.<channel-id>.preferOver`，并指向
  较低优先级的插件 id。请参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请使用
  `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除过期的插件
  安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并
  报告冲突。请为该渠道选择一个唯一归属方，或重命名插件拥有的
  工具，使运行时功能面保持明确无歧义。

## 插件插槽（排他类别）

某些类别是排他的（同一时间只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或用 "none" 禁用
      contextEngine: "legacy", // 或某个插件 id
    },
  },
}
```

| 插槽 | 它控制的内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 活动的 Memory 插件 | `memory-core` |
| `contextEngine` | 活动的上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已启用插件
openclaw plugins list --verbose            # 每插件详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量范围表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 检查持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表
openclaw doctor --fix                      # 修复插件注册表状态

openclaw plugins install <package>         # 安装（优先 ClawHub，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install npm:<pkg>         # 仅从 npm 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm 规范
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置和插件索引记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起提供。许多默认启用（例如
内置模型提供商、内置语音提供商以及内置浏览器
插件）。其他内置插件仍需要执行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖现有已安装插件或 hook 包。对已跟踪的 npm
插件进行常规升级时，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为后者会复用源路径，而不是复制到
受管理的安装目标。

当已经设置 `plugins.allow` 时，`openclaw plugins install` 会在启用插件前，将
已安装插件 id 添加到该允许列表中。如果同一个插件 id 存在于
`plugins.deny` 中，安装会移除这个过期的 deny 条目，从而使该显式安装在重启后立即可加载。

OpenClaw 会保留一个持久化的本地插件注册表，作为
插件清单、贡献归属和启动规划的冷读模型。安装、更新、
卸载、启用和禁用流程会在改变插件状态后刷新该注册表。
同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保存持久安装元数据，并在 `plugins` 中保存可重建的清单元数据。如果
该注册表缺失、过期或无效，`openclaw plugins registry
--refresh` 会根据安装记录、配置策略以及清单/包元数据重建其清单视图，而无需加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。
传入带有 dist-tag 或精确版本的 npm 包规范时，会将包名解析回已跟踪的插件记录，并为未来更新记录新的规范。
传入不带版本的包名时，会将精确固定版本的安装移回
注册表默认的发布线。如果已安装的 npm 插件已经匹配
解析出的版本和记录的制品标识，OpenClaw 会跳过该更新，而不会下载、
重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是一个应急破窗式覆盖开关，用于处理
内置危险代码扫描器的误报。它允许插件安装
和插件更新在内置 `critical` 发现后继续进行，但仍然
不会绕过插件 `before_install` 策略阻止或扫描失败阻止。
安装扫描会忽略常见测试文件和目录，例如 `tests/`、
`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻止打包测试 mock；
已声明的插件运行时入口点即使使用这些名称之一，仍会被扫描。

这个 CLI 标志仅适用于插件安装/更新流程。基于 Gateway 网关的 Skills
依赖安装则会改用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍然是独立的 ClawHub
Skills 下载/安装流程。

兼容的 bundle 会参与同一套插件 list/inspect/enable/disable
流程。当前运行时支持包括 bundle Skills、Claude command-skills、
Claude `settings.json` 默认值、Claude `.lsp.json` 及清单声明的
`lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook
目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及
由 bundle 支持或不支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是来自
`~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、
本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、
GitHub 仓库 URL，或 git URL。对于远程 marketplace，
插件条目必须保留在克隆后的 marketplace 仓库内部，并且仅使用相对路径来源。

完整详情请参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，并暴露 `register(api)`。旧版
插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应
使用 `register`。

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

OpenClaw 会加载该入口对象，并在插件
激活期间调用 `register(api)`。加载器仍会对旧版插件回退使用 `activate(api)`，
但内置插件和新的外部插件都应将 `register` 视为公共契约。

`api.registrationMode` 会告诉插件其入口被加载的原因：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由以及其他实时副作用。 |
| `discovery` | 只读能力发现。注册提供商和元数据；可信插件入口代码可以加载，但应跳过实时副作用。 |
| `setup-only` | 通过轻量级设置入口加载渠道设置元数据。 |
| `setup-runtime` | 加载渠道设置，且同时需要运行时入口。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

打开套接字、数据库、后台工作器或长生命周期
客户端的插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。
发现型加载会与激活型加载分别缓存，并且不会替换正在运行的 Gateway 网关注册表。发现是非激活型的，而不是免导入的：
OpenClaw 可能会求值受信任的插件入口或渠道插件模块，以构建
快照。请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动放到完整运行时路径之后。

常见注册方法：

| 方法 | 它注册的内容 |
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
| `registerWebFetchProvider` | 网页抓取 / 抓取提供商 |
| `registerWebSearchProvider` | 网页搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 为终止态；会跳过更低优先级的处理器。
- `before_tool_call`：`{ block: false }` 为无操作，不会清除更早的阻止。
- `before_install`：`{ block: true }` 为终止态；会跳过更低优先级的处理器。
- `before_install`：`{ block: false }` 为无操作，不会清除更早的阻止。
- `message_sending`：`{ cancel: true }` 为终止态；会跳过更低优先级的处理器。
- `message_sending`：`{ cancel: false }` 为无操作，不会清除更早的取消。

原生 Codex app-server 运行会将 Codex 原生工具事件桥接回这个
钩子功能面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，
通过 `after_tool_call` 观察结果，并参与 Codex
`PermissionRequest` 审批。该桥接目前还不会重写 Codex 原生工具参数。精确的 Codex 运行时支持边界位于
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

有关完整的类型化钩子行为，请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件 Bundle](/zh-CN/plugins/bundles) — Codex/Claude/Cursor bundle 兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型与加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
