---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容的捆绑包
    - 你想调试插件加载失败问题
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-05-10T19:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    面向最终用户的插件安装、启用和故障排除指南。
  </Card>
  <Card title="管理插件" href="/zh-CN/plugins/manage-plugins">
    安装、列出、更新、卸载和发布的快速示例。
  </Card>
  <Card title="插件包" href="/zh-CN/plugins/bundles">
    包兼容性模型。
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

要调查安装、检查、卸载或注册表刷新较慢的问题，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行该命令。跟踪信息会将各阶段耗时写入 stderr，并保持 JSON 输出可解析。请参阅[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，插件生命周期变更命令会被禁用。请使用此安装的 Nix 源，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；对于 nix-openclaw，请使用智能体优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他则需要 `plugins enable`。

原生 OpenClaw 插件必须附带 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空）。兼容包则使用自己的包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表/信息输出还会显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
</Note>

### 安装

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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

维护者测试设置期安装时，可以使用受保护的环境变量覆盖自动插件安装源。请参阅[插件安装覆盖](/zh-CN/plugins/install-overrides)。

<Warning>
裸包名在发布切换期间默认从 npm 安装。对于 ClawHub，请使用 `clawhub:<package>`。像运行代码一样对待插件安装。优先使用固定版本。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的插件包，并打印可直接安装的包名。它搜索代码插件和包插件包，而不是 Skills。使用 `openclaw skills search` 搜索 ClawHub Skills。

<Note>
ClawHub 是大多数插件的主要分发和发现界面。Npm 仍然是受支持的回退和直接安装路径。OpenClaw 拥有的 `@openclaw/*` 插件包已重新发布到 npm；请在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[插件清单](/zh-CN/plugins/plugin-inventory)查看当前列表。稳定安装使用 `latest`。Beta 渠道安装和更新会在 npm `beta` dist-tag 可用时优先使用该标签，然后回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="配置包含和无效配置修复">
    如果你的 `plugins` 部分由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该被包含的文件，并保持 `openclaw.json` 不变。根包含、包含数组以及带有同级覆盖的包含会关闭失败，而不是展平。请参阅[配置包含](/zh-CN/gateway/configuration)了解受支持的形态。

    如果安装期间配置无效，`plugins install` 通常会关闭失败，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动和热重载期间，无效的插件配置会像其他任何无效配置一样关闭失败；`openclaw doctor --fix` 可以隔离无效的插件条目。唯一记录在案的安装期例外是一个很窄的内置插件恢复路径，仅适用于明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

  </Accordion>
  <Accordion title="--force 以及重新安装与更新">
    `--force` 会复用现有安装目标，并就地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 构件重新安装同一 id 时使用它。对于已跟踪的 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已经安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并指向 `plugins update <id-or-npm-spec>` 进行常规升级；如果你确实想从不同来源覆盖当前安装，则指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。不支持与 `git:` 安装一起使用；如果你想要固定来源，请使用显式 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是内置危险代码扫描器误报时的应急选项。即使内置扫描器报告 `critical` 发现项，它也允许安装继续，但它**不会**绕过插件 `before_install` 钩子策略阻断，也**不会**绕过扫描失败。

    此 CLI 标志适用于插件安装/更新流程。由 Gateway 网关支持的技能依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub 技能下载/安装流程。

    如果你在 ClawHub 发布的插件被注册表扫描阻止，请使用 [ClawHub](/zh-CN/clawhub/security) 中的发布者步骤。

  </Accordion>
  <Accordion title="钩子包和 npm spec">
    `plugins install` 也是安装在 `package.json` 中公开 `openclaw.hooks` 的钩子包的入口。使用 `openclaw hooks` 查看筛选后的钩子可见性和逐钩子启用状态，而不是用于包安装。

    Npm spec **仅限注册表**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。为安全起见，即使你的 shell 有全局 npm 安装设置，依赖安装也会在项目本地使用 `--ignore-scripts` 运行。受管插件 npm 根会继承 OpenClaw 包级 npm `overrides`，因此主机安全固定版本也会应用于提升的插件依赖。

    当你想让 npm 解析显式化时，请使用 `npm:<package>`。在发布切换期间，裸包 spec 也会直接从 npm 安装。

    裸 spec 和 `@latest` 保持在稳定轨道上。OpenClaw 日期戳修正版本（例如 `2026.5.3-1`）在此检查中属于稳定版本。如果 npm 将其中任一解析为预发布版本，OpenClaw 会停止并要求你使用预发布标签（例如 `@beta`/`@rc`）或精确预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

    如果裸安装 spec 匹配官方插件 id（例如 `diffs`），OpenClaw 会直接安装目录条目。要安装同名 npm 包，请使用显式作用域 spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 直接从 git 仓库安装。受支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://` 以及 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>`，即可在安装前检出分支、标签或提交。

    Git 安装会克隆到临时目录，在存在请求的 ref 时将其检出，然后使用常规插件目录安装器。这意味着清单验证、危险代码扫描、包管理器安装工作和安装记录的行为都与 npm 安装类似。记录的 git 安装包含源 URL/ref 以及解析后的提交，因此 `openclaw plugins update` 稍后可以重新解析该来源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册，例如 gateway 方法和 CLI 命令。如果插件通过 `api.registerCli` 注册了 CLI 根，请直接通过 OpenClaw 根 CLI 执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    当文件是 npm-pack tarball，并且你想测试与注册表安装相同的受管 npm 根安装路径时，请使用 `npm-pack:<path.tgz>`，包括 `package-lock.json` 验证、提升依赖扫描和 npm 安装记录。普通归档路径仍会作为本地归档安装在插件 extensions 根下。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，裸 npm 安全插件 spec 默认从 npm 安装：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 让仅限 npm 的解析显式化：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查声明的插件 API / 最低 Gateway 网关兼容性。当所选 ClawHub 版本发布 ClawPack 工件时，OpenClaw 会下载带版本的 npm-pack `.tgz`，验证 ClawHub 摘要标头和工件摘要，然后通过正常归档路径安装它。没有 ClawPack 元数据的旧版 ClawHub 版本仍会通过旧版包归档验证路径安装。已记录的安装会保留其 ClawHub 来源元数据、工件类型、npm 完整性、npm shasum、tarball 名称和 ClawPack 摘要事实，以供后续更新使用。
未带版本的 ClawHub 安装会保留未带版本的记录 spec，因此 `openclaw plugins update` 可以跟随后续 ClawHub 版本；显式版本或标签选择器（如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍会固定到该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 在 `~/.claude/plugins/known_marketplaces.json` 的本地注册表缓存中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传递 marketplace 来源时，使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace 来源">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称
    - 本地 marketplace 根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="远程 marketplace 规则">
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须留在克隆的 marketplace 仓库内。OpenClaw 接受该仓库中的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

<Note>
兼容包会安装到正常插件根目录，并参与相同的 list/info/enable/disable 流程。目前支持包 Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor command-skills 和兼容的 Codex 钩子目录；其他检测到的包能力会显示在诊断/info 中，但尚未接入运行时执行。
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
  从表格视图切换到每个插件的详情行，包含来源/origin/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单，以及注册表诊断和包依赖安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；当注册表缺失或无效时，使用仅由清单派生的后备数据。它适用于检查插件是否已安装、已启用，并且对冷启动规划可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请先重启为该渠道提供服务的 Gateway 网关，再期待新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不只是包装进程。

`plugins list --json` 会包含每个插件来自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 会检查这些包
名称是否存在于插件正常 Node `node_modules` 查找路径上；它
不会导入插件运行时代码、运行包管理器或修复缺失
依赖。
</Note>

`plugins search` 是远程 ClawHub 目录查询。它不会检查本地
状态、修改配置、安装包或加载插件运行时代码。搜索
结果包括 ClawHub 包名、系列、渠道、版本、摘要，以及
安装提示，例如 `openclaw plugins install clawhub:<package>`。

对于打包 Docker 镜像内的内置插件工作，请将插件
源目录 bind-mount 到匹配的打包源路径上，例如
`/app/extensions/synology-chat`。OpenClaw 会先发现该挂载源
覆盖层，再发现 `/app/dist/extensions/synology-chat`；普通复制的源
目录仍然不会生效，因此正常打包安装仍会使用编译后的 dist。

对于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示来自模块加载检查流程的已注册钩子和诊断。运行时检查绝不会安装依赖；使用 `openclaw doctor --fix` 清理旧版依赖状态，或恢复配置中引用的缺失可下载插件。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置会话钩子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是覆盖托管安装目标。

在 npm 安装中使用 `--pin`，可将解析后的精确 spec（`name@version`）保存到托管插件索引中，同时保持默认行为不固定。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶层 `installRecords` 映射是安装元数据的持久来源，包括已损坏或缺失插件清单的记录。`plugins` 数组是由清单派生的冷注册表缓存。该文件包含不要编辑的警告，并供 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到随版本交付的旧版 `plugins.installs` 记录时，运行时读取会将其视为兼容性输入，而不会重写 `openclaw.json`。显式插件写入和 `openclaw doctor --fix` 会在允许配置写入时，将这些记录移动到插件索引并移除配置键；如果任一写入失败，则会保留配置记录，避免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目，以及适用时的链接 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，否则卸载还会在被跟踪的托管安装目录位于 OpenClaw 的插件扩展根目录内时移除该目录。对于主动记忆插件，记忆槽会重置为 `memory-core`。

<Note>
`--keep-config` 作为 `--keep-files` 的弃用别名受支持。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新会应用到托管插件索引中跟踪的插件安装，以及 `hooks.internal.installs` 中跟踪的 hook-pack 安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm spec">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装 spec。这意味着先前存储的 dist-tag（例如 `@beta`）和精确固定版本，会在后续 `update <id>` 运行中继续使用。

    对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回被跟踪的插件记录，更新该已安装插件，并记录新的 npm spec，以供未来基于 id 的更新使用。

    传入不带版本或标签的 npm 包名也会解析回被跟踪的插件记录。当插件固定到精确版本，而你想将其移回注册表默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="Beta 渠道更新">
    `openclaw plugins update` 会复用被跟踪的插件 spec，除非你传入新的 spec。`openclaw update` 还知道活动的 OpenClaw 更新渠道：在 beta 渠道上，默认线 npm 和 ClawHub 插件记录会先尝试 `@beta`，如果没有插件 beta 版本，则回退到记录的默认/latest spec。精确版本和显式标签会继续固定到该选择器。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新前，OpenClaw 会根据 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的工件身份已经与解析目标匹配，则会跳过更新，不下载、不重新安装，也不重写 `openclaw.json`。

    当已存储的完整性哈希存在且获取到的工件哈希发生变化时，OpenClaw 会将其视为 npm 工件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新帮助程序会默认失败关闭，除非调用方提供显式继续策略。

  </Accordion>
  <Accordion title="更新时使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的应急覆盖。它仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止，并且只适用于插件更新，不适用于 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 默认不导入插件运行时，会显示身份、加载状态、来源、清单能力、策略标志、诊断、安装元数据、包能力，以及任何检测到的 MCP 或 LSP 服务器支持。添加 `--runtime` 会加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖；安装和修复仍留在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 中。

插件拥有的 CLI 命令通常会安装为根 `openclaw` 命令组，但插件也可以在核心父命令下注册嵌套命令，例如 `openclaw nodes`。当 `inspect --runtime` 在 `cliCommands` 下显示命令后，请在列出的路径运行它；例如，注册了 `demo-git` 的插件可以用 `openclaw demo-git ping` 验证。

每个插件会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如，仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如，文本 + 语音 + 图像）
- **hook-only** — 只有钩子，没有能力或界面
- **non-capability** — 工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计使用的机器可读报告。`inspect --all` 会呈现一张覆盖整个插件集的表格，其中包含形态、能力种类、兼容性通知、内置能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断和兼容性通知。当一切正常时，它会打印 `No plugin issues detected.`

如果已配置的插件存在于磁盘上，但被加载器的路径安全检查阻止，配置验证会保留该插件条目，并将其报告为 `present but blocked`。修复前面的被阻止插件诊断，例如路径所有权或全局可写权限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于缺少 `register`/`activate` 导出等模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 持久化的冷读取模型，用于记录已安装插件的身份、启用状态、来源元数据和贡献所有权。正常启动、提供商所有者查找、渠道设置分类和插件清单都可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否最新或是否过期。使用 `--refresh` 从持久化插件索引、配置策略和清单/包元数据重建它。这是一条修复路径，不是运行时激活路径。

`openclaw doctor --fix` 还会修复与注册表相邻的托管 npm 漂移：如果托管插件 npm 根目录下的孤立或恢复的 `@openclaw/*` 包遮蔽了内置插件，Doctor 会移除该过期包并重建注册表，以便启动时根据内置清单进行验证。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的应急兼容性开关，用于注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退只用于迁移推出期间的紧急启动恢复。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会打印解析后的来源标签，以及解析后的 marketplace 清单和插件条目。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [ClawHub](/zh-CN/clawhub)
