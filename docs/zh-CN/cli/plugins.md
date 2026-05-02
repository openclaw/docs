---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容捆绑包
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（列出、安装、插件市场、卸载、启用/禁用、Doctor）'
title: 插件
x-i18n:
    generated_at: "2026-05-02T19:10:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c708f1f9d06bd07ba87ec0d88c98dacccca28422ea1097f98e07b4ee03697508
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容捆绑包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    面向最终用户的插件安装、启用和故障排除指南。
  </Card>
  <Card title="管理插件" href="/zh-CN/plugins/manage-plugins">
    安装、列表、更新、卸载和发布的快速示例。
  </Card>
  <Card title="插件捆绑包" href="/zh-CN/plugins/bundles">
    捆绑包兼容性模型。
  </Card>
  <Card title="插件清单" href="/zh-CN/plugins/manifest">
    清单字段和配置架构。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security">
    插件安装的安全加固。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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

要调查缓慢的安装、检查、卸载或注册表刷新，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行该命令。跟踪会将阶段耗时写入 stderr，并保持 JSON 输出可解析。请参阅[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要使用 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，其中包含内联 JSON Schema（`configSchema`，即使为空）。兼容捆绑包则使用自己的捆绑包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表/信息输出还会显示捆绑包子类型（`codex`、`claude` 或 `cursor`）以及检测到的捆绑包能力。
</Note>

### 安装

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
在发布切换期间，裸包名默认从 npm 安装。对 ClawHub 请使用 `clawhub:<package>`。应像运行代码一样看待插件安装。优先使用固定版本。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的插件包，并打印可直接用于安装的包名。它会搜索代码插件和捆绑插件包，而不是 Skills。请使用 `openclaw skills search` 搜索 ClawHub Skills。

<Note>
ClawHub 是大多数插件的主要分发和发现入口。Npm 仍然是受支持的备用路径和直接安装路径。在迁移到 ClawHub 期间，OpenClaw 仍会在 npm 上发布一些 OpenClaw 所有的 `@openclaw/*` 插件包；在插件发布批次之间，这些包版本可能落后于内置源码。如果 npm 将某个 OpenClaw 所有的插件包报告为已弃用，则该发布版本是旧的外部构件；请使用当前 OpenClaw 内置的插件，或使用本地检出，直到发布更新的 npm 包。
</Note>

<AccordionGroup>
  <Accordion title="配置包含与无效配置恢复">
    如果你的 `plugins` 部分由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该被包含文件，并保持 `openclaw.json` 不变。根包含、包含数组以及带同级覆盖的包含会以关闭方式失败，而不会被展平。支持的形态请参阅[配置包含](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会以关闭方式失败，并提示你先运行 `openclaw doctor --fix`。Gateway 网关启动期间，某个插件的无效配置会被隔离到该插件，因此其他渠道和插件可以继续运行；`openclaw doctor --fix` 可以隔离无效的插件条目。唯一有文档说明的安装时例外，是一个窄范围的内置插件恢复路径，适用于显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

  </Accordion>
  <Accordion title="--force、重新安装与更新">
    `--force` 会复用现有安装目标，并原地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 构件重新安装同一 id 时使用它。对于已被跟踪的 npm 插件的常规升级，请优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已安装的插件 id 运行 `plugins install`，OpenClaw 会停止并提示你使用 `plugins update <id-or-npm-spec>` 进行常规升级，或在确实想从其他来源覆盖当前安装时使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。它不支持 `git:` 安装；当你想固定源码时，请使用显式 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是内置危险代码扫描器误报时使用的应急选项。它允许在内置扫描器报告 `critical` 发现时继续安装，但它**不会**绕过插件 `before_install` 钩子策略阻断，也**不会**绕过扫描失败。

    此 CLI 标志适用于插件安装/更新流程。由 Gateway 网关支持的 skill 依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是单独的 ClawHub skill 下载/安装流程。

    如果你在 ClawHub 发布的插件被注册表扫描阻止，请使用 [ClawHub](/zh-CN/tools/clawhub) 中的发布者步骤。

  </Accordion>
  <Accordion title="钩子包和 npm spec">
    `plugins install` 也是用于安装在 `package.json` 中暴露 `openclaw.hooks` 的钩子包的入口。请使用 `openclaw hooks` 查看经过过滤的钩子可见性和按钩子启用，而不是用于包安装。

    Npm spec **仅限注册表**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。为安全起见，依赖安装会以项目本地方式运行并带上 `--ignore-scripts`，即使你的 shell 中有全局 npm 安装设置。

    当你想让 npm 解析显式化时，请使用 `npm:<package>`。在发布切换期间，裸包 spec 也会直接从 npm 安装。

    裸 spec 和 `@latest` 会留在稳定轨道上。如果 npm 将其中任一项解析到预发布版本，OpenClaw 会停止，并要求你通过预发布标签（例如 `@beta`/`@rc`）或精确预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

    如果裸安装 spec 匹配官方插件 id（例如 `diffs`），OpenClaw 会直接安装目录条目。要安装同名 npm 包，请使用显式作用域 spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 可直接从 git 仓库安装。支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://` 和 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>` 可在安装前检出分支、标签或提交。

    Git 安装会克隆到临时目录，在存在请求的 ref 时将其检出，然后使用普通插件目录安装器。这意味着清单校验、危险代码扫描、包管理器安装工作和安装记录的行为都类似 npm 安装。记录的 git 安装包含源 URL/ref 以及解析出的提交，以便 `openclaw plugins update` 之后可以重新解析来源。

    从 git 安装后，请使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册项，例如 gateway 方法和 CLI 命令。如果插件通过 `api.registerCli` 注册了 CLI 根命令，请直接通过 OpenClaw 根 CLI 执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，裸 npm 安全插件 spec 默认从 npm 安装：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 让仅 npm 解析显式化：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查发布的插件 API / 最低 gateway 兼容性。当选定的 ClawHub 版本发布 ClawPack 构件时，OpenClaw 会下载带版本的 npm-pack `.tgz`，验证 ClawHub 摘要标头和构件摘要，然后通过普通归档路径安装。没有 ClawPack 元数据的旧 ClawHub 版本仍会通过旧版包归档验证路径安装。记录的安装会保留其 ClawHub 源元数据、构件类型、npm integrity、npm shasum、tarball 名称和 ClawPack 摘要事实，以供后续更新使用。
未带版本的 ClawHub 安装会保留未带版本的记录 spec，以便 `openclaw plugins update` 可以跟随更新的 ClawHub 发布；显式版本或标签选择器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）则会保持固定到该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，请使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传入 marketplace 来源时，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="市场源">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市场名称
    - 本地市场根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="远程市场规则">
    对于从 GitHub 或 git 加载的远程市场，插件条目必须保留在克隆的市场仓库内。OpenClaw 接受来自该仓库的相对路径源，并拒绝来自远程清单的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- 兼容 Codex 的包（`.codex-plugin/plugin.json`）
- 兼容 Claude 的包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- 兼容 Cursor 的包（`.cursor-plugin/plugin.json`）

<Note>
兼容包会安装到普通插件根目录，并参与相同的列出/信息/启用/禁用流程。目前支持包 Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skills，以及兼容 Codex 钩子目录；其他检测到的包能力会显示在诊断/信息中，但尚未接入运行时执行。
</Note>

### 列出

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  仅显示已启用的插件。
</ParamField>
<ParamField path="--verbose" type="boolean">
  从表格视图切换为每个插件的详细行，包含源/来源/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单，加上注册表诊断和包依赖安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；当注册表缺失或无效时，会使用仅基于清单派生的回退。它适合检查某个插件是否已安装、已启用，并对冷启动规划可见，但它不是对已经运行中的 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请重启为该渠道提供服务的 Gateway 网关，再期待新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不仅是包装器进程。

`plugins list --json` 会包含每个插件来自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 会检查这些包
名称是否存在于插件正常 Node `node_modules` 查找路径上；它
不会导入插件运行时代码、运行包管理器或修复缺失的
依赖。
</Note>

`plugins search` 是远程 ClawHub 目录查询。它不会检查本地
状态、修改配置、安装包或加载插件运行时代码。搜索
结果包含 ClawHub 包名称、系列、渠道、版本、摘要，以及
安装提示，例如 `openclaw plugins install clawhub:<package>`。

对于打包 Docker 镜像内的内置插件工作，请将插件
源目录绑定挂载到匹配的打包源路径上，例如
`/app/extensions/synology-chat`。OpenClaw 会先发现该挂载的源
覆盖层，再发现 `/app/dist/extensions/synology-chat`；普通复制的源
目录仍不会生效，因此正常打包安装仍会使用编译后的 dist。

对于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示来自模块加载检查过程的已注册钩子和诊断。运行时检查从不安装依赖；使用 `openclaw doctor --fix` 清理旧版依赖状态，或安装缺失的已配置可下载插件。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置对话钩子（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可以避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是覆盖托管安装目标。

在 npm 安装中使用 `--pin` 可以将解析后的精确 spec（`name@version`）保存到托管插件索引中，同时保持默认行为不固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶层 `installRecords` 映射是安装元数据的持久来源，包括损坏或缺失插件清单的记录。`plugins` 数组是从清单派生的冷注册表缓存。该文件包含请勿编辑警告，并由 `openclaw plugins update`、卸载、诊断以及冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，会将其移入插件索引并移除该配置键；如果任一写入失败，配置记录会保留，以免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目，以及适用时的已链接 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，否则卸载还会移除已跟踪的托管安装目录，前提是它位于 OpenClaw 的插件 extensions 根目录内。对于主动记忆插件，记忆槽会重置为 `memory-core`。

<Note>
`--keep-config` 作为 `--keep-files` 的弃用别名受到支持。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管插件索引中已跟踪的插件安装，以及 `hooks.internal.installs` 中已跟踪的钩子包安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm spec">
    当你传入插件 id 时，OpenClaw 会复用为该插件记录的安装 spec。这意味着之前存储的 dist-tag（如 `@beta`）和精确固定版本会在后续 `update <id>` 运行中继续使用。

    对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回已跟踪的插件记录，更新该已安装插件，并记录新的 npm spec 以供未来基于 id 的更新使用。

    传入不带版本或标签的 npm 包名也会解析回已跟踪的插件记录。当某个插件被固定到精确版本，而你想将其移回注册表默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的构件身份已经匹配解析后的目标，更新会跳过，不下载、不重新安装，也不重写 `openclaw.json`。

    当存在已存储的完整性哈希且获取到的构件哈希发生变化时，OpenClaw 会将其视为 npm 构件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新助手会默认关闭失败，除非调用方提供显式继续策略。

  </Accordion>
  <Accordion title="更新时使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的应急覆盖。它仍不会绕过插件 `before_install` 策略阻止或扫描失败阻止，并且只适用于插件更新，不适用于钩子包更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

默认情况下，检查会显示身份、加载状态、源、清单能力、策略标志、诊断、安装元数据、包能力，以及任何检测到的 MCP 或 LSP 服务器支持，而不会导入插件运行时。添加 `--runtime` 会加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖；安装和修复仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 处理。

插件拥有的 CLI 命令会安装为根级 `openclaw` 命令组。`inspect --runtime` 在 `cliCommands` 下显示某个命令后，可用 `openclaw <command> ...` 运行它；例如，注册了 `demo-git` 的插件可用 `openclaw demo-git ping` 验证。

每个插件都会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 仅钩子，没有能力或界面
- **non-capability** — 工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会渲染全量表格，包含形态、能力种类、兼容性通知、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断和兼容性通知。当一切正常时，它会打印 `No plugin issues detected.`

对于缺少 `register`/`activate` 导出等模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 对已安装插件身份、启用状态、源元数据和贡献所有权持久化的冷读模型。正常启动、提供商所有者查找、渠道设置分类和插件清单都可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、最新或过期。使用 `--refresh` 可从持久化插件索引、配置策略以及清单/包元数据重建它。这是修复路径，不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的应急兼容开关，用于注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退仅用于迁移推出期间的紧急启动恢复。
</Warning>

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市场列表接受本地市场路径、`marketplace.json` 路径、GitHub 简写（如 `owner/repo`）、GitHub 仓库 URL 或 git URL。`--json` 会打印解析后的源标签，以及解析后的市场清单和插件条目。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [社区插件](/zh-CN/plugins/community)
