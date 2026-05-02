---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容的捆绑包
    - 你想调试插件加载失败问题
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-05-02T00:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092365bc7c841a6211ae86f15e9103994366d83650fed861f305112fb2ad41b7
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容 bundle。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    安装、启用和排查插件问题的最终用户指南。
  </Card>
  <Card title="插件 bundle" href="/zh-CN/plugins/bundles">
    Bundle 兼容性模型。
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

如需调查安装、检查、卸载或 registry 刷新的缓慢问题，请在命令中使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。该 trace 会将各阶段耗时写入 stderr，并保持 JSON 输出可解析。参见[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）；其他插件需要使用 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空）。兼容 bundle 则使用它们自己的 bundle 清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细 list/info 输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`）以及检测到的 bundle 能力。
</Note>

### 安装

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
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
裸包名会先通过 ClawHub 检查，然后再检查 npm。请像运行代码一样对待插件安装。优先使用固定版本。
</Warning>

<Note>
ClawHub 是大多数插件的主要分发和发现入口。Npm 仍然是受支持的回退和直接安装路径。在迁移到 ClawHub 的过程中，OpenClaw 仍会在 npm 上发布一些 OpenClaw 自有的 `@openclaw/*` 插件包；在插件发布批次之间，这些包版本可能会落后于内置源码。如果 npm 将某个 OpenClaw 自有插件包报告为 deprecated，则该已发布版本是旧的外部产物；请使用当前 OpenClaw 内置的插件，或使用本地 checkout，直到发布更新的 npm 包。
</Note>

<AccordionGroup>
  <Accordion title="配置 include 和无效配置恢复">
    如果你的 `plugins` 部分由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该被 include 的文件，并保持 `openclaw.json` 不变。根 include、include 数组以及带同级覆盖项的 include 会封闭失败，而不会被展开。支持的形态见[配置 include](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会封闭失败，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动期间，某个插件的无效配置会被隔离到该插件，因此其他渠道和插件可以继续运行；`openclaw doctor --fix` 可以隔离无效的插件条目。唯一有文档说明的安装时例外，是一个狭窄的内置插件恢复路径，仅适用于显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

  </Accordion>
  <Accordion title="--force 以及重新安装与更新">
    `--force` 会复用现有安装目标，并就地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 产物重新安装同一 id 时使用它。对于已跟踪 npm 插件的常规升级，请优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已安装的插件 id 运行 `plugins install`，OpenClaw 会停止并指引你使用 `plugins update <id-or-npm-spec>` 进行正常升级，或者在你确实想从不同来源覆盖当前安装时使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。它不支持 `git:` 安装；当你想固定来源时，请使用显式 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是一个用于内置危险代码扫描器误报的破窗选项。即使内置扫描器报告 `critical` 发现项，它也允许安装继续，但它**不会**绕过插件 `before_install` 钩子策略阻断，也**不会**绕过扫描失败。

    这个 CLI flag 适用于插件安装/更新流程。由 Gateway 网关支持的 skill 依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍是独立的 ClawHub skill 下载/安装流程。

    如果你在 ClawHub 上发布的插件被 registry 扫描阻断，请使用 [ClawHub](/zh-CN/tools/clawhub) 中的发布者步骤。

  </Accordion>
  <Accordion title="钩子包和 npm specs">
    `plugins install` 也是安装在 `package.json` 中公开 `openclaw.hooks` 的钩子包的入口。使用 `openclaw hooks` 查看筛选后的钩子可见性和逐钩子启用状态，而不是用于包安装。

    Npm specs **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file specs 和 semver 范围都会被拒绝。出于安全考虑，依赖安装会以项目本地方式运行，并带有 `--ignore-scripts`，即使你的 shell 具有全局 npm 安装设置也是如此。

    当你想跳过 ClawHub 查找并直接从 npm 安装时，请使用 `npm:<package>`。裸包 spec 仍会优先使用 ClawHub，并且仅在 ClawHub 没有该包或版本时回退到 npm。

    裸 spec 和 `@latest` 保持在稳定轨道。如果 npm 将其中任一项解析为预发布版本，OpenClaw 会停止，并要求你使用预发布标签（例如 `@beta`/`@rc`）或精确预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

    如果裸安装 spec 匹配官方插件 id（例如 `diffs`），OpenClaw 会直接安装目录条目。若要安装同名 npm 包，请使用显式 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 直接从 git 仓库安装。支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>` 可在安装前 checkout 分支、标签或提交。

    Git 安装会克隆到临时目录，在存在请求的 ref 时 checkout 该 ref，然后使用正常的插件目录安装器。这意味着清单验证、危险代码扫描、包管理器安装工作以及安装记录的行为都类似 npm 安装。记录的 git 安装会包含来源 URL/ref 以及解析得到的提交，以便 `openclaw plugins update` 后续可以重新解析该来源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册项，例如 gateway 方法和 CLI 命令。如果插件使用 `api.registerCli` 注册了 CLI 根命令，请通过 OpenClaw 根 CLI 直接执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的归档会在 OpenClaw 写入安装记录之前被拒绝。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会对裸 npm 安全插件 spec 优先使用 ClawHub。只有在 ClawHub 没有该包或版本时，它才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 强制仅使用 npm 解析，例如当 ClawHub 无法访问，或你知道该包只存在于 npm 上时：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查声明的插件 API / 最低 gateway 兼容性。当选定的 ClawHub 版本发布了 ClawPack 产物时，OpenClaw 会下载带版本的 ClawPack，验证 ClawHub digest header 和产物 digest，然后通过正常归档路径安装它。没有 ClawPack 元数据的旧 ClawHub 版本仍会通过旧版包归档验证路径安装。记录的安装会保留其 ClawHub 来源元数据和 ClawPack digest 事实，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的记录 spec，使 `openclaw plugins update` 可以跟随后续较新的 ClawHub 发布；显式版本或标签选择器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍会固定到该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 本地 registry 缓存 `~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传入 marketplace 来源时，使用 `--marketplace`：

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
    - GitHub repo 简写，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="远程 marketplace 规则">
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆的 marketplace repo 内部。OpenClaw 接受来自该 repo 的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认的 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

<Note>
兼容包会安装到常规插件根目录，并参与同一套列表/信息/启用/禁用流程。目前支持包内 Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skills，以及兼容的 Codex 钩子目录；其他检测到的包能力会显示在诊断/信息中，但尚未接入运行时执行。
</Note>

### 列表

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
  从表格视图切换为按插件显示的详情行，其中包含来源/源头/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单，以及注册表诊断信息。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；当注册表缺失或无效时，会回退到仅由清单派生的结果。它适合用来检查插件是否已安装、已启用，以及是否对冷启动规划可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请先重启服务该渠道的 Gateway 网关，再期待新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不只是包装进程。
</Note>

在打包的 Docker 镜像内处理内置插件时，请将插件源目录绑定挂载到匹配的打包源路径上，例如 `/app/extensions/synology-chat`。OpenClaw 会先于 `/app/dist/extensions/synology-chat` 发现该挂载的源码覆盖层；普通复制的源目录仍然不会生效，因此常规打包安装仍会使用已编译的 dist。

用于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示来自模块加载检查流程的已注册钩子和诊断信息。运行时检查从不安装依赖；请使用 `openclaw doctor --fix` 清理旧依赖状态，或安装缺失的已配置可下载插件。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置的会话钩子（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是覆盖受管理的安装目标。

在 npm 安装中使用 `--pin`，可将解析得到的精确规格（`name@version`）保存到受管理的插件索引中，同时保持默认行为为不固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，而不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶层 `installRecords` 映射是安装元数据的持久来源，包括损坏或缺失插件清单的记录。`plugins` 数组是由清单派生的冷注册表缓存。该文件包含不要编辑的警告，并由 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，会将它们移入插件索引并移除该配置键；如果任一写入失败，配置记录会保留，以免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目，以及适用时链接的 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，卸载还会移除跟踪的受管理安装目录，前提是该目录位于 OpenClaw 的插件 extensions 根目录内。对于主动记忆插件，记忆槽会重置为 `memory-core`。

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

更新适用于受管理插件索引中跟踪的插件安装，以及 `hooks.internal.installs` 中跟踪的钩子包安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm 规格">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装规格。这意味着此前存储的 dist-tag（如 `@beta`）和精确固定版本会在之后的 `update <id>` 运行中继续使用。

    对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm 包规格。OpenClaw 会将该包名解析回被跟踪的插件记录，更新该已安装插件，并记录新的 npm 规格以供未来基于 id 的更新使用。

    传入不带版本或标签的 npm 包名，也会解析回被跟踪的插件记录。当某个插件曾固定到精确版本，而你想将其移回注册表默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的构件身份已经与解析目标匹配，则会跳过更新，不会下载、重新安装或重写 `openclaw.json`。

    当存在已存储的完整性哈希且获取到的构件哈希发生变化时，OpenClaw 会将其视为 npm 构件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前要求确认。非交互式更新助手会默认关闭失败，除非调用方提供显式的继续策略。

  </Accordion>
  <Accordion title="更新时使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的应急覆盖开关。它仍不会绕过插件 `before_install` 策略阻止或扫描失败阻止，并且只适用于插件更新，不适用于钩子包更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

检查会显示身份、加载状态、来源、清单能力、策略标志、诊断、安装元数据、包能力，以及任何检测到的 MCP 或 LSP 服务器支持，默认不会导入插件运行时。添加 `--runtime` 会加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖；安装和修复仍位于 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 中。

插件拥有的 CLI 命令会作为根 `openclaw` 命令组安装。在 `inspect --runtime` 于 `cliCommands` 下显示命令后，请以 `openclaw <command> ...` 运行它；例如，注册了 `demo-git` 的插件可通过 `openclaw demo-git ping` 验证。

每个插件会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有钩子，没有能力或界面
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅[插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会呈现全局表格，其中包含形态、能力种类、兼容性通知、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断和兼容性通知。当一切正常时，它会打印 `No plugin issues detected.`

对于缺少 `register`/`activate` 导出等模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 针对已安装插件身份、启用状态、来源元数据和贡献归属持久化的冷读模型。常规启动、提供商归属查询、渠道设置分类和插件清单都可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否当前有效或是否陈旧。使用 `--refresh` 可根据持久化插件索引、配置策略和清单/包元数据重建它。这是修复路径，不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已弃用的应急兼容性开关，用于处理注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；环境变量回退只用于迁移推出期间的紧急启动恢复。
</Warning>

### 插件市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

插件市场列表接受本地市场路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会打印解析后的来源标签，以及已解析的市场清单和插件条目。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [社区插件](/zh-CN/plugins/community)
