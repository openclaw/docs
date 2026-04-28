---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容包
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: CLI 参考：`openclaw plugins`（list、install、marketplace、uninstall、enable/disable、doctor）
title: 插件
x-i18n:
    generated_at: "2026-04-28T11:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b458b67b905941f8f1424db7127640a3ae033dde5092daafd9926567d1bfc6cb
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容包。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/zh-CN/tools/plugin">
    面向最终用户的插件安装、启用和故障排除指南。
  </Card>
  <Card title="Plugin bundles" href="/zh-CN/plugins/bundles">
    包兼容性模型。
  </Card>
  <Card title="Plugin manifest" href="/zh-CN/plugins/manifest">
    清单字段和配置模式。
  </Card>
  <Card title="Security" href="/zh-CN/gateway/security">
    插件安装的安全加固。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
内置插件随 OpenClaw 一起提供。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要使用 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空）。兼容包改用自己的包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表/info 输出还会显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
</Note>

### 安装

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
裸包名会先在 ClawHub 中检查，然后再检查 npm。请像运行代码一样对待插件安装。优先使用固定版本。
</Warning>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    如果你的 `plugins` 部分由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该被包含的文件，并保持 `openclaw.json` 不变。根包含、包含数组，以及带同级覆盖的包含会关闭失败，而不是展平。支持的形态见 [配置包含](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会关闭失败，并提示你先运行 `openclaw doctor --fix`。Gateway 网关启动期间，某个插件的无效配置会被隔离到该插件，因此其他渠道和插件可以继续运行；`openclaw doctor --fix` 可以隔离无效的插件条目。唯一有文档说明的安装时例外，是面向显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的窄范围内置插件恢复路径。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` 会复用现有安装目标，并就地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 工件重新安装相同 id 时使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你为已安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并指向 `plugins update <id-or-npm-spec>` 用于常规升级，或者在你确实想从不同来源覆盖当前安装时，指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm 规范。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是内置危险代码扫描器出现误报时的应急选项。即使内置扫描器报告 `critical` 发现，它也允许安装继续，但它**不会**绕过插件 `before_install` 钩子策略阻止，也**不会**绕过扫描失败。

    此 CLI 标志适用于插件安装/update 流程。由 Gateway 网关支持的 skill 依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍是单独的 ClawHub skill 下载/安装流程。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` 也是安装钩子包的入口，这些钩子包会在 `package.json` 中暴露 `openclaw.hooks`。使用 `openclaw hooks` 查看经过筛选的钩子可见性和逐钩子启用，不要用于包安装。

    Npm 规范**仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file 规范和 semver 范围会被拒绝。为安全起见，依赖安装会以项目本地方式运行并使用 `--ignore-scripts`，即使你的 shell 中有全局 npm 安装设置也是如此。

    当你想跳过 ClawHub 查找并直接从 npm 安装时，使用 `npm:<package>`。裸包规范仍优先使用 ClawHub，并且只有在 ClawHub 没有该包或版本时才回退到 npm。

    裸规范和 `@latest` 会停留在稳定轨道。如果 npm 将其中任一项解析为预发布版本，OpenClaw 会停止并要求你使用预发布标签（例如 `@beta`/`@rc`）或精确的预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

    如果裸安装规范匹配内置插件 id（例如 `diffs`），OpenClaw 会直接安装内置插件。若要安装同名 npm 包，请使用显式作用域规范（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Archives">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录中包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先将 ClawHub 用于裸 npm 安全插件规范。只有在 ClawHub 没有该包或版本时，它才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 强制仅使用 npm 解析，例如当 ClawHub 无法访问，或你知道该包只存在于 npm 上时：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会从 ClawHub 下载包归档，检查声明的插件 API / 最低 Gateway 网关兼容性，然后通过普通归档路径安装它。记录的安装会保留其 ClawHub 源元数据，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的记录规范，因此 `openclaw plugins update` 可以跟随后续较新的 ClawHub 发布；显式版本或标签选择器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）会保持固定到该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 的本地 registry 缓存 `~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传入 marketplace 源时，使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称
    - 本地 marketplace 根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径源，并拒绝来自远程清单的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

<Note>
兼容包会安装到普通插件根目录，并参与同一套 list/info/enable/disable 流程。目前支持包 Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex 钩子目录；其他检测到的包能力会显示在诊断/info 中，但尚未接入运行时执行。
</Note>

### 列出

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  仅显示已启用的插件。
</ParamField>
<ParamField path="--verbose" type="boolean">
  从表格视图切换到逐插件详细行，包含 source/origin/version/activation 元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单，以及 registry 诊断。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件 registry；如果 registry 缺失或无效，则使用仅由清单派生的回退结果。它适合检查插件是否已安装、已启用，并且对冷启动规划可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请重启服务该渠道的 Gateway 网关，再期待新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不只是包装进程。
</Note>

对于打包 Docker 镜像内的内置插件工作，请将插件
源目录绑定挂载到匹配的打包源路径上，例如
`/app/extensions/synology-chat`。OpenClaw 会先发现该挂载的源
覆盖层，再发现 `/app/dist/extensions/synology-chat`；普通复制的源
目录仍不会生效，因此常规打包安装仍会使用编译后的 dist。

对于运行时钩子调试：

- `openclaw plugins inspect <id> --json` 显示模块加载检查过程中注册的钩子和诊断信息。
- `openclaw gateway status --deep --require-rpc` 确认可访问的 Gateway 网关、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置对话钩子（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制到托管安装目标上。

在 npm 安装中使用 `--pin`，可将解析后的精确规格（`name@version`）保存到托管插件索引中，同时保持默认行为为不固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶层 `installRecords` 映射是安装元数据的持久来源，包括损坏或缺失插件清单的记录。`plugins` 数组是从清单派生的冷注册表缓存。该文件包含请勿编辑警告，并由 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，会将它们移动到插件索引中并移除该配置键；如果任一写入失败，会保留配置记录，避免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目以及适用时链接的 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，卸载还会移除跟踪的托管安装目录，前提是它位于 OpenClaw 的插件扩展根目录内。对于活动的内存插件，内存槽会重置为 `memory-core`。

<Note>
`--keep-config` 作为 `--keep-files` 的已弃用别名受支持。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管插件索引中跟踪的插件安装，以及 `hooks.internal.installs` 中跟踪的钩子包安装。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装规格。这意味着先前存储的 dist-tag（例如 `@beta`）和精确固定版本会在之后的 `update <id>` 运行中继续使用。

    对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包规格。OpenClaw 会将该包名解析回被跟踪的插件记录，更新该已安装插件，并记录新的 npm 规格以供未来基于 id 的更新使用。

    传入不带版本或标签的 npm 包名，也会解析回被跟踪的插件记录。当某个插件被固定到精确版本，而你想将其移回注册表默认发布线时使用此方式。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    在实时 npm 更新之前，OpenClaw 会对照 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的构件身份已与解析后的目标匹配，则会跳过更新，不下载、不重新安装，也不重写 `openclaw.json`。

    当存在已存储的完整性哈希且获取到的构件哈希发生变化时，OpenClaw 会将其视为 npm 构件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助工具会默认关闭失败，除非调用方提供显式继续策略。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的应急覆盖。它仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止，并且只适用于插件更新，不适用于钩子包更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度自省。显示身份、加载状态、来源、已注册能力、钩子、工具、命令、服务、Gateway 网关方法、HTTP 路由、策略标志、诊断信息、安装元数据、包能力，以及检测到的任何 MCP 或 LSP 服务器支持。

每个插件会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有钩子，没有能力或表面
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会渲染一张全局表格，包含形态、能力种类、兼容性通知、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 报告插件加载错误、清单/设备发现诊断信息和兼容性通知。当一切正常时，会打印 `No plugin issues detected.`

对于模块形态失败，例如缺少 `register`/`activate` 导出，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 的持久化冷读取模型，用于已安装插件的身份、启用状态、来源元数据和贡献归属。正常启动、提供商所有者查找、渠道设置分类和插件清单都可以在不导入插件运行时模块的情况下读取它。

使用 `plugins registry` 检查持久化注册表是否存在、是否为当前版本或是否已过期。使用 `--refresh` 可根据持久化插件索引、配置策略和清单/包元数据重建它。这是修复路径，不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的应急兼容性开关，用于注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；环境变量回退仅用于迁移推出期间的紧急启动恢复。
</Warning>

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市场列表接受本地市场路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的来源标签，以及解析出的市场清单和插件条目。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [社区插件](/zh-CN/plugins/community)
