---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-28T23:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec4b58de5ec69566ce15536dfc0cf1e08b329293cb84da7aa8436763c017668f
    source_path: tools/plugin.md
    workflow: 16
---

插件为 OpenClaw 扩展新能力：渠道、模型提供商、
Agent harness plugins、工具、Skills、语音、实时转录、实时
语音、媒体理解、图像生成、视频生成、Web 获取、Web
搜索等。部分插件是 **核心**（随 OpenClaw 提供），其他
是 **外部**（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

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
</Steps>

如果你更偏好聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式
`clawhub:<pkg>`、显式 `npm:<pkg>`，或裸包规范（先 ClawHub，然后
回退到 npm）。

如果配置无效，安装通常会故障关闭，并提示你运行
`openclaw doctor --fix`。唯一的恢复例外是一条很窄的内置插件
重装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。
Gateway 网关启动期间，某个插件的无效配置会隔离在该插件范围内：
启动日志会记录 `plugins.entries.<id>.config` 问题，在加载期间跳过该插件，
并保持其他插件和渠道在线。运行 `openclaw doctor --fix`
可通过禁用该插件条目并移除其无效配置载荷来隔离有问题的插件配置；
正常配置备份会保留先前的值。
当渠道配置引用了一个不再可发现的插件，但同一个陈旧插件 ID 仍保留在插件配置或安装记录中时，
Gateway 网关启动会记录警告并跳过该渠道，而不是阻塞所有其他渠道。
运行 `openclaw doctor --fix` 可移除陈旧的渠道/插件条目；没有陈旧插件证据的未知
渠道键仍会验证失败，以便拼写错误保持可见。
如果设置了 `plugins.enabled: false`，陈旧插件引用会被视为非活动：
Gateway 网关启动会跳过插件发现/加载工作，`openclaw doctor` 会保留
已禁用的插件配置，而不是自动移除它。若要移除陈旧插件 ID，请先重新启用插件再运行
doctor 清理。

打包的 OpenClaw 安装不会急切安装每个内置插件的
运行时依赖树。当一个 OpenClaw 拥有的内置插件因
插件配置、旧版渠道配置或默认启用的清单而处于活动状态时，启动只会
在导入该插件前修复该插件声明的运行时依赖。
仅持久化的渠道认证状态不会为 Gateway 网关启动运行时依赖修复
激活内置渠道。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
会阻止该插件/渠道的自动内置运行时依赖修复。
非空的 `plugins.allow` 也会限制默认启用的内置运行时依赖
修复；显式启用内置渠道（`channels.<id>.enabled: true`）仍然可以
修复该渠道的插件依赖。
外部插件和自定义加载路径仍必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式       | 工作方式                                                       | 示例                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行       | 官方插件、社区 npm 包               |
| **Bundle** | Codex/Claude/Cursor 兼容布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会出现在 `openclaw plugins list` 下。参见 [插件 Bundle](/zh-CN/plugins/bundles) 了解 Bundle 详情。

如果你正在编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 包入口点

原生插件 npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个条目都必须位于包目录内，并解析为可读的
运行时文件，或解析为一个 TypeScript 源文件，并带有推断出的已构建 JavaScript
对等文件，例如从 `src/index.ts` 到 `dist/index.js`。

当发布的运行时文件不在与源条目相同的路径时，请使用
`openclaw.runtimeExtensions`。如果存在，`runtimeExtensions` 必须为
每个 `extensions` 条目包含且仅包含一个条目。列表不匹配会导致安装和
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

| 插件          | 包                | 文档                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/zh-CN/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/zh-CN/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/zh-CN/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/zh-CN/plugins/zalouser)   |

### 核心（随 OpenClaw 提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="内存插件">
    - `memory-core` — 内置内存搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 按需安装的长期内存，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）

    参见 [Memory LanceDB](/zh-CN/plugins/memory-lancedb) 了解 OpenAI 兼容的
    嵌入设置、Ollama 示例、召回限制和故障排除。

  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 内置浏览器插件，用于浏览器工具、`openclaw browser` CLI、`browser.request` gateway 方法、浏览器运行时，以及默认浏览器控制服务（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）

  </Accordion>
</AccordionGroup>

在寻找第三方插件？参见 [社区插件](/zh-CN/plugins/community)。

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

| 字段            | 说明                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认：`true`）                           |
| `allow`          | 插件允许列表（可选）                               |
| `deny`           | 插件拒绝列表（可选；拒绝优先）                     |
| `load.paths`     | 额外插件文件/目录                            |
| `slots`          | 独占槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 单个插件的开关 + 配置                               |

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关运行时启用了配置
监听 + 进程内重启（默认的 `openclaw gateway` 路径），该
重启通常会在配置写入落地片刻后自动执行。
原生插件运行时代码或生命周期
钩子没有受支持的热重载路径；在期待更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或
提供商/运行时钩子运行之前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表/配置快照。其中的
`enabled` 插件表示持久化注册表和当前配置允许该
插件参与。它并不能证明一个已经运行的远程 Gateway 网关
子进程已经重启到同一份插件代码。在带有
包装进程的 VPS/容器设置中，请将重启发送到实际的 `openclaw gateway run` 进程，
或针对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会保留。
  - **缺失**：配置引用了发现流程没有找到的插件 ID。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。Gateway 网关启动只会跳过该插件；`openclaw doctor --fix` 可通过禁用无效条目并移除其配置载荷来隔离它。

</Accordion>

## 发现和优先级

OpenClaw 按以下顺序扫描插件（第一个匹配项胜出）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。指回
    OpenClaw 自身打包内置插件目录的路径会被忽略；
    运行 `openclaw doctor --fix` 可移除这些陈旧别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 提供。许多默认启用（模型提供商、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常会从已编译的
`dist/extensions` 树解析内置插件。如果内置插件源目录
被绑定挂载到匹配的打包源路径上，例如
`/app/extensions/synology-chat`，OpenClaw 会将该挂载的源目录
视为内置源覆盖层，并在打包的
`/app/dist/extensions/synology-chat` Bundle 之前发现它。这让维护者容器
循环能够继续工作，而无需把每个内置插件都切回 TypeScript 源。
设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 可强制使用打包的 dist Bundle，
即使存在源覆盖挂载也是如此。

### 启用规则

- `plugins.enabled: false` 会禁用所有插件，并跳过插件发现/加载工作
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内置的默认启用集合，除非被覆盖
- 独占槽位可以强制启用该槽位选中的插件
- 当配置命名某个插件拥有的表面时，一些内置的可选启用插件会自动启用，
  例如提供商模型引用、渠道配置或 harness 运行时
- 当 `plugins.enabled: false` 处于活动状态时，过期插件配置会被保留；
  如果你想移除过期 id，请先重新启用插件再运行 Doctor 清理
- OpenAI 系列 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件由 `agentRuntime.id: "codex"` 或旧版
  `codex/*` 模型引用选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子
没有在实时聊天流量中运行，请先检查这些内容：

- 运行 `openclaw gateway status --deep --require-rpc`，并确认活动的
  Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的那些。
- 在插件安装/配置/代码变更后重启实时 Gateway 网关。在 wrapper
  容器中，PID 1 可能只是 supervisor；请重启或向子
  `openclaw gateway run` 进程发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和
  diagnostics。非内置会话钩子，例如 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型
  解析前运行；`llm_output` 只会在模型尝试产生 assistant 输出后运行。
- 如需证明有效会话模型，请使用 `openclaw sessions` 或
  Gateway 网关会话/Status 表面；调试提供商 payload 时，请用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 渠道或工具归属重复

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些表示多个已启用插件正在尝试拥有同一个渠道、设置流程或工具名称。
最常见的原因是，一个外部渠道插件安装在了现在提供相同渠道 id 的内置插件旁边。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose`，查看每个已启用插件
  及其来源。
- 对每个疑似插件运行 `openclaw plugins inspect <id> --json`，并比较
  `channels`、`channelConfigs`、`tools` 和 diagnostics。
- 安装或移除插件包后，运行 `openclaw plugins registry --refresh`，
  让持久化 metadata 反映当前安装状态。
- 在安装、registry 或配置变更后重启 Gateway 网关。

修复选项：

- 如果一个插件有意替换另一个使用相同渠道 id 的插件，首选插件应声明
  `channelConfigs.<channel-id>.preferOver`，并填入优先级较低的插件 id。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外造成的，请用
  `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除过期的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留该请求并报告冲突。请为该渠道选择一个所有者，或重命名插件拥有的工具，使运行时表面不存在歧义。

## 插件槽位（独占类别）

某些类别是独占的（同一时间只能有一个处于活动状态）：

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
| `memory`        | 活动 memory 插件      | `memory-core`       |
| `contextEngine` | 活动 context engine   | `legacy`（内置）    |

## CLI 参考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多插件默认启用（例如内置模型提供商、
内置语音提供商和内置浏览器插件）。其他内置插件仍需要
`openclaw plugins enable <id>`。

`--force` 会原地覆盖已安装的插件或 hook pack。对于已跟踪 npm
插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，后者会复用源路径，而不是复制到托管安装目标上。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会在启用已安装插件之前，
把该插件 id 添加到该 allowlist。如果同一个插件 id 存在于 `plugins.deny` 中，
install 会移除该过期 deny 条目，使显式安装在重启后可以立即加载。

OpenClaw 会保留一个持久化的本地插件 registry，作为插件清单、contribution
归属和启动规划的冷读取模型。Install、update、uninstall、enable 和 disable
流程会在更改插件状态后刷新该 registry。同一个 `plugins/installs.json` 文件会在
顶层 `installRecords` 中保留持久安装 metadata，并在 `plugins` 中保留可重建的 manifest
metadata。如果 registry 缺失、过期或无效，`openclaw plugins registry
--refresh` 会从安装记录、配置策略和 manifest/package metadata 重建其 manifest 视图，
而不会加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。传入带 dist-tag
或精确版本的 npm 包 spec，会把包名解析回已跟踪的插件记录，并记录新的 spec
供未来更新使用。传入不带版本的包名，会把精确固定的安装移回 registry
的默认发布线。如果已安装的 npm 插件已经匹配解析出的版本和记录的 artifact identity，
OpenClaw 会跳过更新，而不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace source metadata，而不是 npm spec。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的应急覆盖。
它允许插件安装和插件更新在内置 `critical` findings 后继续，但仍不会绕过插件
`before_install` 策略阻断或扫描失败阻断。安装扫描会忽略常见测试文件和目录，
例如 `tests/`、`__tests__/`、`*.test.*` 和 `*.spec.*`，以避免阻断打包的测试 mock；
声明的插件运行时入口点即使使用这些名称之一，仍会被扫描。

此 CLI 标志仅适用于插件 install/update 流程。由 Gateway 网关支持的 skill
依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而
`openclaw skills install` 仍是独立的 ClawHub skill download/install 流程。

如果你发布在 ClawHub 上的插件因扫描被隐藏或阻断，请打开
ClawHub dashboard，或运行 `clawhub package rescan <name>` 请求 ClawHub 重新检查。
`--dangerously-force-unsafe-install` 只影响你自己机器上的安装；它不会请求 ClawHub
重新扫描插件，也不会让被阻断的 release 公开。

兼容 bundle 参与同一个插件 list/inspect/enable/disable 流程。当前运行时支持包括
bundle skills、Claude command-skills、Claude `settings.json` 默认值、Claude
`.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills
以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle capabilities，以及
bundle 支持的插件中受支持或不受支持的 MCP 和 LSP server 条目。

Marketplace sources 可以是来自 `~/.claude/plugins/known_marketplaces.json`
的 Claude known-marketplace 名称、本地 marketplace root 或 `marketplace.json`
路径、像 `owner/repo` 这样的 GitHub shorthand、GitHub repo URL，或 git URL。
对于远程 marketplaces，插件条目必须保留在 cloned marketplace repo 内，并且只使用相对路径 sources。

参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins) 了解详情。

## 插件 API 概览

原生插件会导出一个暴露 `register(api)` 的 entry object。较旧插件可能仍使用
`activate(api)` 作为 legacy alias，但新插件应使用 `register`。

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

OpenClaw 会加载 entry object，并在插件激活期间调用 `register(api)`。
loader 仍会对旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将
`register` 视为公共契约。

`api.registrationMode` 会告诉插件其 entry 被加载的原因：

| 模式            | 含义                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、钩子、服务、命令、路由，以及其他实时副作用。                              |
| `discovery`     | 只读能力设备发现。注册提供商和元数据；可信插件入口代码可以加载，但跳过实时副作用。 |
| `setup-only`    | 通过轻量级设置入口加载渠道设置元数据。                                                                |
| `setup-runtime` | 同时需要运行时入口的渠道设置加载。                                                                         |
| `cli-metadata`  | 仅收集 CLI 命令元数据。                                                                                            |

会打开套接字、数据库、后台工作进程或长生命周期
客户端的插件入口，应使用 `api.registrationMode === "full"`
保护这些副作用。设备发现加载会与激活加载分开缓存，并且不会替换
正在运行的 Gateway 网关注册表。设备发现是非激活的，但并非无需导入：
OpenClaw 可能会求值可信插件入口或渠道插件模块来构建
快照。保持模块顶层轻量且无副作用，并将
网络客户端、子进程、监听器、凭证读取和服务启动
放到完整运行时路径之后。

常见注册方法：

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
| `registerWebFetchProvider`              | 网页获取 / 抓取提供商 |
| `registerWebSearchProvider`             | Web 搜索                  |
| `registerHttpRoute`                     | HTTP 端点               |
| `registerCommand` / `registerCli`       | CLI 命令                |
| `registerContextEngine`                 | 上下文引擎              |
| `registerService`                       | 后台服务          |

类型化生命周期钩子的守卫行为：

- `before_tool_call`：`{ block: true }` 会终止流程；低优先级处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除之前的阻止。
- `before_install`：`{ block: true }` 会终止流程；低优先级处理器会被跳过。
- `before_install`：`{ block: false }` 是空操作，不会清除之前的阻止。
- `message_sending`：`{ cancel: true }` 会终止流程；低优先级处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除之前的取消。

原生 Codex app-server 会将 Codex 原生工具事件桥接回此
钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，
通过 `after_tool_call` 观察结果，并参与 Codex
`PermissionRequest` 批准。该桥接尚不会重写 Codex 原生工具
参数。确切的 Codex 运行时支持边界见
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

完整的类型化钩子行为见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor bundle 兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载管线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
