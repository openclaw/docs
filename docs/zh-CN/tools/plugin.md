---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用兼容 Codex/Claude 的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-05-01T10:03:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1efa91ac4d78c6707a1e9e5cd5a5958642128a61b5873e169f66c7c2b954adb9
    source_path: tools/plugin.md
    workflow: 16
---

插件为 OpenClaw 扩展新能力：渠道、模型提供商、
agent harnesses、工具、Skills、语音、实时转写、实时
语音、媒体理解、图像生成、视频生成、网页获取、网页
搜索等。有些插件是**核心**插件（随 OpenClaw 一起发布），其他
是**外部**插件。大多数外部插件通过
[ClawHub](/zh-CN/tools/clawhub) 发布和发现。Npm 仍然支持直接安装，也支持
一组临时的 OpenClaw 自有插件包，直到该迁移完成。

## 快速开始

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下配置。

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    当你需要证明已注册的工具、服务、Gateway 网关
    方法、钩子，或插件自有的 CLI 命令时，请使用 `--runtime`。普通的
    `inspect` 是冷态清单/注册表检查，并且会有意避免导入插件运行时。

  </Step>
</Steps>

如果你偏好聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式
`clawhub:<pkg>`、显式 `npm:<pkg>`、显式 `git:<repo>`，或裸包
规范（先 ClawHub，再回退到 npm）。

如果配置无效，安装通常会失败关闭，并指向
`openclaw doctor --fix`。唯一的恢复例外是一个狭窄的内置插件
重装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。
在 Gateway 网关启动期间，某个插件的无效配置会被隔离到该插件：
启动会记录 `plugins.entries.<id>.config` 问题，在加载期间跳过该插件，
并让其他插件和渠道保持在线。运行 `openclaw doctor --fix`
可通过禁用该插件条目并移除其无效配置载荷来隔离损坏的插件配置；
常规配置备份会保留先前的值。
当某个渠道配置引用了一个不再可发现的插件，但同一个过期插件 id
仍留在插件配置或安装记录中时，Gateway 网关启动会记录警告并跳过该渠道，
而不是阻塞所有其他渠道。运行 `openclaw doctor --fix`
以移除过期的渠道/插件条目；没有过期插件证据的未知渠道键仍会验证失败，
因此拼写错误仍然可见。
如果设置了 `plugins.enabled: false`，过期插件引用会被视为惰性：
Gateway 网关启动会跳过插件发现/加载工作，并且 `openclaw doctor`
会保留已禁用的插件配置，而不是自动移除它。如果你想移除过期插件 id，
请先重新启用插件再运行 Doctor 清理。

打包的 OpenClaw 安装不会急切安装每个内置插件的
运行时依赖树。当一个 OpenClaw 自有的内置插件因
插件配置、旧版渠道配置，或默认启用的清单而处于活动状态时，启动
只会在导入该插件前修复该插件声明的运行时依赖。
仅有持久化的渠道认证状态不会为 Gateway 网关启动运行时依赖修复
激活内置渠道。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
会阻止该插件/渠道的自动内置运行时依赖修复。
非空的 `plugins.allow` 也会限制默认启用的内置运行时依赖
修复；显式的内置渠道启用（`channels.<id>.enabled: true`）仍可
修复该渠道的插件依赖。
外部插件和自定义加载路径仍必须通过
`openclaw plugins install` 安装。
参见[插件依赖解析](/zh-CN/plugins/dependency-resolution)，了解完整的
规划和暂存生命周期。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式       | 工作方式                                                           | 示例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生**   | `openclaw.plugin.json` + 运行时模块；在进程内执行                  | 官方插件、社区 npm 包                                  |
| **Bundle** | Codex/Claude/Cursor 兼容布局；映射到 OpenClaw 功能                 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

二者都会显示在 `openclaw plugins list` 下。参见 [Plugin Bundles](/zh-CN/plugins/bundles) 了解 Bundle 详情。

如果你正在编写原生插件，请从[构建插件](/zh-CN/plugins/building-plugins)
和[插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目都必须位于包目录内，并解析到可读取的
运行时文件，或解析到一个 TypeScript 源文件，该源文件具有可推断的已构建 JavaScript
对应文件，例如从 `src/index.ts` 到 `dist/index.js`。

当发布的运行时文件与源条目路径不相同时，请使用 `openclaw.runtimeExtensions`。
存在时，`runtimeExtensions` 必须为每个 `extensions` 条目包含
恰好一个条目。不匹配的列表会导致安装和
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

### 迁移期间 OpenClaw 自有的 npm 包

ClawHub 是大多数插件的主要分发路径。当前打包的
OpenClaw 版本已经内置许多官方插件，因此在正常设置中这些插件不需要
单独 npm 安装。在每个 OpenClaw 自有插件都
迁移到 ClawHub 之前，OpenClaw 仍会在
npm 上发布一些 `@openclaw/*` 插件包，用于较旧/自定义安装和直接 npm 工作流。

如果 npm 将某个 `@openclaw/*` 插件包报告为已弃用，则该包
版本来自较旧的外部包序列。请使用当前 OpenClaw 中的内置插件，
或使用本地检出，直到发布更新的 npm 包。

| 插件            | 包                         | 文档                                       |
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
  <Accordion title="Model providers (enabled by default)">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — 内置记忆搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 按需安装的长期记忆，支持自动回忆/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）

    参见 [Memory LanceDB](/zh-CN/plugins/memory-lancedb)，了解 OpenAI 兼容的
    嵌入设置、Ollama 示例、回忆限制和故障排除。

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时，以及默认浏览器控制服务的内置浏览器插件（默认启用；替换前请禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）

  </Accordion>
</AccordionGroup>

正在寻找第三方插件？参见[社区插件](/zh-CN/plugins/community)。

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

| 字段             | 描述                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认：`true`）                                    |
| `allow`          | 插件允许列表（可选）                                      |
| `deny`           | 插件拒绝列表（可选；拒绝优先）                            |
| `load.paths`     | 额外的插件文件/目录                                       |
| `slots`          | 独占槽位选择器（例如 `memory`、`contextEngine`）           |
| `entries.\<id\>` | 每个插件的开关 + 配置                                     |

`plugins.allow` 是排他的。当它非空时，只有列出的插件才能加载
或暴露工具，即使 `tools.allow` 包含 `"*"` 或特定插件自有的
工具名称。如果工具允许列表引用插件工具，请将所属插件 id
加入 `plugins.allow`，或移除 `plugins.allow`；`openclaw doctor` 会对此
形态发出警告。

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关正在以配置
监听 + 进程内重启启用的方式运行（默认的 `openclaw gateway` 路径），那么
该重启通常会在配置写入落地后片刻自动执行。
原生插件运行时代码或生命周期
钩子没有受支持的热重载路径；在期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务，或
提供商/运行时钩子运行之前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表/配置快照。其中的
`enabled` 插件表示持久化注册表和当前配置允许该
插件参与。它不能证明已经运行的远程 Gateway 网关
子进程已重启到同一份插件代码。在 VPS/容器设置中使用
包装进程时，请将重启发送到实际的 `openclaw gateway run` 进程，
或对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了设备发现未找到的插件 id。
  - **无效**：插件存在，但其配置与声明的架构不匹配。Gateway 网关启动时只会跳过该插件；`openclaw doctor --fix` 可以通过禁用它并移除其配置载荷来隔离该无效条目。

</Accordion>

## 设备发现和优先级

OpenClaw 按以下顺序扫描插件（首个匹配项生效）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。指向
    OpenClaw 自身打包内置插件目录的路径会被忽略；
    运行 `openclaw doctor --fix` 可移除这些过期别名。
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

打包安装和 Docker 镜像通常会从已编译的 `dist/extensions` 树中解析内置插件。如果内置插件源码目录被
bind-mounted 到匹配的打包源码路径上，例如
`/app/extensions/synology-chat`，OpenClaw 会将该挂载的源码目录
视为内置源码覆盖层，并在打包的
`/app/dist/extensions/synology-chat` bundle 之前发现它。这样可以让维护者容器
循环继续工作，而无需把每个内置插件切回 TypeScript 源码。
设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包的 dist bundles，
即使存在源码覆盖挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件，并跳过插件设备发现/加载工作
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内置的默认开启集合，除非被覆盖
- 独占槽位可以强制启用该槽位选中的插件
- 某些需要选择加入的内置插件会在配置命名某个
  插件拥有的表面时自动启用，例如提供商模型引用、渠道配置或 harness
  运行时
- 当 `plugins.enabled: false` 处于活动状态时，过期插件配置会被保留；
  如果你想移除过期 id，请先重新启用插件再运行 Doctor 清理
- OpenAI 系列 Codex 路由保持单独的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件由 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子
没有在实时聊天流量中运行，请先检查这些项：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认活动的
  Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的对象。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在 wrapper
  容器中，PID 1 可能只是 supervisor；请重启或向子
  `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --runtime --json` 确认钩子注册和
  诊断信息。非内置会话钩子，例如 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型
  解析之前运行；`llm_output` 只会在一次模型尝试
  生成 assistant 输出后运行。
- 要证明有效的会话模型，请使用 `openclaw sessions` 或
  Gateway 网关会话/Status 表面；调试提供商载荷时，请使用
  `--raw-stream --raw-stream-path <path>` 启动
  Gateway 网关。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些表示超过一个已启用插件正在尝试拥有同一个渠道、
设置流程或工具名称。最常见的原因是外部渠道插件
与现在提供相同渠道 id 的内置插件并排安装。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用插件
  及其来源。
- 对每个疑似插件运行 `openclaw plugins inspect <id> --runtime --json`，
  并比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 安装或移除
  插件包后，运行 `openclaw plugins registry --refresh`，让持久化元数据反映当前安装。
- 在安装、registry 或配置更改后重启 Gateway 网关。

修复选项：

- 如果一个插件有意替换另一个使用相同渠道 id 的插件，
  首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并填入
  较低优先级的插件 id。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外的，请使用
  `plugins.entries.<plugin-id>.enabled: false` 禁用一侧，或移除过期的插件
  安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并
  报告冲突。为该渠道选择一个所有者，或重命名插件拥有的
  工具，使运行时表面明确无歧义。

## 插件槽位（独占类别）

某些类别是独占的（同一时间只有一个处于活动状态）：

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

| 槽位            | 控制内容              | 默认值              |
| --------------- | --------------------- | ------------------- |
| `memory`        | 主动记忆插件          | `memory-core`       |
| `contextEngine` | 活动上下文引擎        | `legacy` (built-in) |

## CLI 参考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

内置插件随 OpenClaw 一起发布。许多默认启用（例如
内置模型提供商、内置语音提供商和内置浏览器
插件）。其他内置插件仍然需要 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装插件或 hook pack。对已跟踪的 npm
插件进行常规升级时，请使用
`openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，后者会复用源码路径，而不是
复制到托管安装目标上。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会先把
已安装的插件 id 添加到该 allowlist，然后再启用它。如果同一插件 id
存在于 `plugins.deny` 中，install 会移除该过期 deny 条目，使
显式安装在重启后立即可加载。

OpenClaw 会保留一个持久化的本地插件 registry，作为插件清单、
贡献所有权和启动规划的冷读取模型。install、update、
uninstall、enable 和 disable 流程会在更改插件状态后刷新该 registry。
同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保存持久安装元数据，
并在 `plugins` 中保存可重建的 manifest 元数据。如果
registry 缺失、过期或无效，`openclaw plugins registry
--refresh` 会从安装记录、配置策略和
manifest/package 元数据重建其 manifest 视图，而不会加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。传入
带 dist-tag 或精确版本的 npm package spec 会将包名
解析回已跟踪插件记录，并记录新的 spec 以供未来更新。
传入不带版本的包名会把精确 pinned 安装移回
registry 的默认发布线。如果已安装的 npm 插件已经匹配
解析出的版本和记录的 artifact 标识，OpenClaw 会跳过更新，
不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace source 元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用于处理内置危险代码扫描器
误报的应急覆盖。它允许插件安装
和插件更新在遇到内置 `critical` 发现后继续，但仍然
不会绕过插件 `before_install` 策略阻止或扫描失败阻止。
安装扫描会忽略常见测试文件和目录，例如 `tests/`、
`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻止打包的测试 mock；
声明的插件运行时入口点仍会被扫描，即使它们使用这些
名称之一。

此 CLI 标志仅适用于插件 install/update 流程。Gateway 网关支持的 skill
依赖安装会改用匹配的 `dangerouslyForceUnsafeInstall` 请求
覆盖，而 `openclaw skills install` 仍是单独的 ClawHub
skill 下载/安装流程。

如果你发布到 ClawHub 的插件因扫描而被隐藏或阻止，请打开
ClawHub dashboard，或运行 `clawhub package rescan <name>` 请求 ClawHub 再次检查
它。`--dangerously-force-unsafe-install` 只影响你自己
机器上的安装；它不会要求 ClawHub 重新扫描插件，也不会让被阻止的发布
公开。

兼容的捆绑包会参与同一套插件 list/inspect/enable/disable 流程。当前运行时支持包括捆绑包 Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的捆绑包能力，以及由捆绑包支持的插件中受支持或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内，并且只能使用相对路径来源。

了解详情，请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个暴露 `register(api)` 的入口对象。较旧的插件可能仍使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。加载器仍会回退到为较旧插件调用 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公开契约。

`api.registrationMode` 会告诉插件其入口为什么被加载：

| 模式            | 含义                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由和其他实时副作用。                              |
| `discovery`     | 只读能力发现。注册提供商和元数据；可信插件入口代码可以加载，但应跳过实时副作用。 |
| `setup-only`    | 通过轻量级设置入口加载渠道设置元数据。                                                                |
| `setup-runtime` | 也需要运行时入口的渠道设置加载。                                                                         |
| `cli-metadata`  | 仅收集 CLI 命令元数据。                                                                                            |

会打开套接字、数据库、后台 worker 或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 保护这些副作用。发现加载会与激活加载分开缓存，并且不会替换正在运行的 Gateway 网关注册表。发现是非激活式的，但不是免导入的：OpenClaw 可能会执行可信插件入口或渠道插件模块来构建快照。让模块顶层保持轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移到完整运行时路径之后。

常用注册方法：

| 方法                                  | 注册内容           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM）        |
| `registerChannel`                       | 聊天渠道                |
| `registerTool`                          | 智能体工具                  |
| `registerHook` / `on(...)`              | 生命周期钩子             |
| `registerSpeechProvider`                | 文本转语音 / STT        |
| `registerRealtimeTranscriptionProvider` | 流式 STT               |
| `registerRealtimeVoiceProvider`         | 双工实时语音       |
| `registerMediaUnderstandingProvider`    | 图像/音频分析        |
| `registerImageGenerationProvider`       | 图像生成            |
| `registerMusicGenerationProvider`       | 音乐生成            |
| `registerVideoGenerationProvider`       | 视频生成            |
| `registerWebFetchProvider`              | Web fetch / scrape 提供商 |
| `registerWebSearchProvider`             | Web 搜索                  |
| `registerHttpRoute`                     | HTTP 端点               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | 上下文引擎              |
| `registerService`                       | 后台服务          |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 是终止性的；较低优先级的处理程序会被跳过。
- `before_tool_call`：`{ block: false }` 是无操作，并且不会清除更早的阻止。
- `before_install`：`{ block: true }` 是终止性的；较低优先级的处理程序会被跳过。
- `before_install`：`{ block: false }` 是无操作，并且不会清除更早的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的；较低优先级的处理程序会被跳过。
- `message_sending`：`{ cancel: false }` 是无操作，并且不会清除更早的取消。

原生 Codex app-server 会将 Codex 原生工具事件桥接回这个钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。该桥接目前还不会重写 Codex 原生工具参数。确切的 Codex 运行时支持边界位于 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件捆绑包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor 捆绑包兼容性
- [插件 manifest](/zh-CN/plugins/manifest) — manifest schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
