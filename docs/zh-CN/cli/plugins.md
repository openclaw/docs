---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容捆绑包
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-05-03T18:43:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    用于安装、启用和排查插件问题的最终用户指南。
  </Card>
  <Card title="管理插件" href="/zh-CN/plugins/manage-plugins">
    安装、列出、更新、卸载和发布的快速示例。
  </Card>
  <Card title="插件包" href="/zh-CN/plugins/bundles">
    包兼容性模型。
  </Card>
  <Card title="插件清单" href="/zh-CN/plugins/manifest">
    清单字段和配置 schema。
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

要调查缓慢的安装、检查、卸载或注册表刷新，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行该命令。跟踪会把阶段耗时写入 stderr，并保持 JSON 输出可解析。请参阅 [调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空）。兼容包则使用自己的包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表/info 输出还会显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
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
在发布切换期间，裸包名默认从 npm 安装。对 ClawHub 使用 `clawhub:<package>`。请像运行代码一样对待插件安装。优先使用固定版本。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的插件包，并打印可直接安装的包名。它搜索代码插件和包插件包，而不是 Skills。对于 ClawHub Skills，请使用 `openclaw skills search`。

<Note>
ClawHub 是大多数插件的主要分发和发现界面。Npm 仍是受支持的回退和直接安装路径。OpenClaw 拥有的 `@openclaw/*` 插件包已重新发布到 npm；请在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[插件清单](/zh-CN/plugins/plugin-inventory)查看当前列表。稳定版安装使用 `latest`。当 npm `beta` dist-tag 可用时，Beta 渠道安装和更新优先使用它，然后回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="配置包含和无效配置修复">
    如果你的 `plugins` 区段由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该被包含文件，并保持 `openclaw.json` 不变。根级包含、包含数组以及带有同级覆盖的包含会失败关闭，而不是展开合并。有关受支持的形状，请参阅[配置包含](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会失败关闭，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动和热重载期间，无效插件配置会像任何其他无效配置一样失败关闭；`openclaw doctor --fix` 可以隔离无效插件条目。唯一有文档记录的安装时例外，是针对显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的窄范围内置插件恢复路径。

  </Accordion>
  <Accordion title="--force 和重新安装与更新">
    `--force` 会复用现有安装目标，并就地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 构件重新安装同一 id 时使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你为已安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并指向 `plugins update <id-or-npm-spec>` 以进行正常升级，或在你确实想从不同来源覆盖当前安装时指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。它不支持 `git:` 安装；当你想固定来源时，请使用显式 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支持 `--marketplace`，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是内置危险代码扫描器误报时的紧急选项。即使内置扫描器报告 `critical` 发现，它也允许安装继续，但它**不会**绕过插件 `before_install` 钩子策略阻断，也**不会**绕过扫描失败。

    此 CLI 标志适用于插件安装/更新流程。由 Gateway 网关支持的 skill 依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍是单独的 ClawHub skill 下载/安装流程。

    如果你发布到 ClawHub 的插件被注册表扫描阻断，请使用 [ClawHub](/zh-CN/tools/clawhub) 中的发布者步骤。

  </Accordion>
  <Accordion title="钩子包和 npm specs">
    `plugins install` 也是安装在 `package.json` 中公开 `openclaw.hooks` 的钩子包的界面。请使用 `openclaw hooks` 查看经过筛选的钩子可见性和按钩子启用，而不是安装包。

    Npm specs **仅限注册表**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file specs 和 semver 范围会被拒绝。为安全起见，依赖安装会以项目本地方式运行并使用 `--ignore-scripts`，即使你的 shell 有全局 npm 安装设置。

    当你想明确使用 npm 解析时，请使用 `npm:<package>`。在发布切换期间，裸包 specs 也会直接从 npm 安装。

    裸 specs 和 `@latest` 会保持在稳定轨道。如果 npm 将其中任一解析为预发布版本，OpenClaw 会停止，并要求你使用预发布标签（例如 `@beta`/`@rc`）或精确预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

    如果裸安装 spec 匹配官方插件 id（例如 `diffs`），OpenClaw 会直接安装目录条目。要安装同名 npm 包，请使用显式 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 直接从 git 仓库安装。受支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>` 可在安装前检出分支、标签或提交。

    Git 安装会克隆到临时目录，在存在请求的 ref 时检出该 ref，然后使用普通插件目录安装器。这意味着清单验证、危险代码扫描、包管理器安装工作和安装记录的行为都类似 npm 安装。记录的 git 安装会包含来源 URL/ref 以及解析后的提交，因此 `openclaw plugins update` 以后可以重新解析该来源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册，例如 gateway 方法和 CLI 命令。如果插件使用 `api.registerCli` 注册了 CLI root，请通过 OpenClaw root CLI 直接执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，裸 npm 安全插件 specs 默认从 npm 安装：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明确只通过 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查声明的插件 API / 最低 gateway 兼容性。当选定的 ClawHub 版本发布了 ClawPack 构件时，OpenClaw 会下载带版本的 npm-pack `.tgz`，验证 ClawHub digest 头和构件 digest，然后通过普通归档路径安装它。没有 ClawPack 元数据的旧版 ClawHub 版本仍会通过旧版包归档验证路径安装。记录的安装会保留其 ClawHub 来源元数据、构件类型、npm integrity、npm shasum、tarball 名称和 ClawPack digest 事实，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的记录 spec，因此 `openclaw plugins update` 可以跟随后续较新的 ClawHub 发布；显式版本或标签选择器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍会固定到该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace` 简写：

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
  <Tab title="Marketplace sources">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市场源名称
    - 本地市场源根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    对于从 GitHub 或 git 加载的远程市场源，插件条目必须保留在克隆的市场源仓库内。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

<Note>
兼容包会安装到常规插件根目录，并参与相同的列表/信息/启用/禁用流程。目前支持包 Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skills，以及兼容的 Codex 钩子目录；其他检测到的包能力会显示在诊断/信息中，但尚未接入运行时执行。
</Note>

### 列表

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
  从表格视图切换到每个插件的详情行，包含来源/源头/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单，加上注册表诊断和包依赖安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；当注册表缺失或无效时，会回退到仅由清单派生的结果。它适合用来检查插件是否已安装、已启用，并且对冷启动规划可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请重启为该渠道提供服务的 Gateway 网关，再预期新的 `register(api)` 代码或钩子会运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不只是包装器进程。

`plugins list --json` 会包含每个插件来自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 会检查这些包名是否存在于插件正常的 Node `node_modules` 查找路径中；它
不会导入插件运行时代码、运行包管理器或修复缺失的
依赖。
</Note>

`plugins search` 是远程 ClawHub 目录查询。它不会检查本地
状态、修改配置、安装包或加载插件运行时代码。搜索
结果包括 ClawHub 包名、系列、渠道、版本、摘要，以及
安装提示，例如 `openclaw plugins install clawhub:<package>`。

对于打包 Docker 镜像内的内置插件工作，请将插件
源目录绑定挂载到匹配的打包源路径上，例如
`/app/extensions/synology-chat`。OpenClaw 会先发现该挂载的源
覆盖层，再发现 `/app/dist/extensions/synology-chat`；单纯复制的源
目录仍然不会生效，因此常规打包安装仍会使用已编译的 dist。

对于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示模块加载式检查过程中注册的钩子和诊断。运行时检查绝不会安装依赖；请使用 `openclaw doctor --fix` 清理旧版依赖状态，或安装缺失的已配置可下载插件。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置对话钩子（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是覆盖托管安装目标。

在 npm 安装中使用 `--pin`，可将解析后的精确 spec（`name@version`）保存到托管插件索引中，同时保留默认的非固定行为。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶层 `installRecords` 映射是安装元数据的持久来源，包括损坏或缺失插件清单的记录。`plugins` 数组是由清单派生的冷注册表缓存。该文件包含请勿编辑警告，并由 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，会将它们移动到插件索引并移除该配置键；如果任一写入失败，会保留配置记录，避免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目，以及适用时链接的 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，否则卸载还会移除已跟踪的托管安装目录，前提是该目录位于 OpenClaw 的插件扩展根目录内。对于主动记忆插件，记忆槽会重置为 `memory-core`。

<Note>
`--keep-config` 作为 `--keep-files` 的已弃用别名受支持。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管插件索引中已跟踪的插件安装，以及 `hooks.internal.installs` 中已跟踪的 hook-pack 安装。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装 spec。这意味着之前存储的 dist-tag（例如 `@beta`）和精确固定版本，会在后续 `update <id>` 运行中继续使用。

    对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回已跟踪的插件记录，更新该已安装插件，并记录新的 npm spec 供未来基于 id 的更新使用。

    传入不带版本或标签的 npm 包名，也会解析回已跟踪的插件记录。当某个插件已固定到精确版本，而你想将其移回注册表默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` 会复用已跟踪的插件 spec，除非你传入新的 spec。`openclaw update` 还知道当前 OpenClaw 更新渠道：在 beta 渠道上，默认线 npm 和 ClawHub 插件记录会先尝试 `@beta`，如果不存在插件 beta 版本，则回退到记录的默认/latest spec。精确版本和显式标签会继续固定到该选择器。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    在执行实时 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的制品身份已经与解析出的目标匹配，则会跳过更新，不下载、不重新安装，也不重写 `openclaw.json`。

    当存在已存储的完整性哈希且获取到的制品哈希发生变化时，OpenClaw 会将其视为 npm 制品漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助程序会默认关闭失败，除非调用方提供显式继续策略。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的紧急覆盖选项。它仍然不会绕过插件 `before_install` 策略阻断或扫描失败阻断，并且只适用于插件更新，不适用于 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

默认情况下，检查会显示身份、加载状态、来源、清单能力、策略标志、诊断、安装元数据、包能力，以及任何检测到的 MCP 或 LSP 服务器支持，而不会导入插件运行时。添加 `--runtime` 可加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖；安装和修复仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 处理。

插件拥有的 CLI 命令会安装为根 `openclaw` 命令组。在 `inspect --runtime` 于 `cliCommands` 下显示某个命令后，以 `openclaw <command> ...` 的形式运行它；例如，注册了 `demo-git` 的插件可通过 `openclaw demo-git ping` 验证。

每个插件都会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 仅钩子，没有能力或界面
- **non-capability** — 工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会呈现全插件表格，包含形态、能力类型、兼容性提示、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断和兼容性提示。当一切正常时，它会打印 `No plugin issues detected.`

如果已配置的插件存在于磁盘上，但被加载器的路径安全检查阻止，配置验证会保留该插件条目，并将其报告为 `present but blocked`。请修复前面的被阻止插件诊断，例如路径所有权或全局可写权限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于缺少 `register`/`activate` 导出等模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 持久化的冷读取模型，用于已安装插件身份、启用状态、来源元数据和贡献所有权。常规启动、提供商所有者查找、渠道设置分类和插件清单都可以在不导入插件运行时模块的情况下读取它。

使用 `plugins registry` 检查持久化注册表是否存在、为最新，或已过时。使用 `--refresh` 可根据持久化插件索引、配置策略以及清单/包元数据重建它。这是修复路径，不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的紧急兼容开关，用于处理注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；环境变量回退只用于迁移推出期间的紧急启动恢复。
</Warning>

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市场列表接受本地市场路径、`marketplace.json` 路径、像 `owner/repo` 这样的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的源标签，以及解析后的市场清单和插件条目。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [社区插件](/zh-CN/plugins/community)
