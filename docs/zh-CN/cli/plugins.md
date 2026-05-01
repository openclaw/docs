---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容的捆绑包
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、deps、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-05-01T10:03:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7aebe4ee647d7821b881cdb9d5af01d70508c38b36462ff7b57fb44769dc2f
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    面向最终用户的插件安装、启用和故障排除指南。
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

如果要调查安装、检查、卸载或 registry 刷新速度慢的问题，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行该命令。trace 会将阶段耗时写入 stderr，并保持 JSON 输出可解析。参见[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要使用 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，其中包含内联 JSON Schema（`configSchema`，即使为空也需要）。兼容包则使用自己的包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细 list/info 输出还会显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
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
裸包名会先在 ClawHub 中检查，然后再检查 npm。请像运行代码一样看待插件安装。优先使用固定版本。
</Warning>

<Note>
ClawHub 是大多数插件的主要分发和发现界面。Npm 仍然是受支持的兜底方案和直接安装路径。在迁移到 ClawHub 期间，OpenClaw 仍会在 npm 上发布一些 OpenClaw 自有的 `@openclaw/*` 插件包；在不同插件发布批次之间，这些包版本可能落后于内置源码。如果 npm 将某个 OpenClaw 自有插件包报告为已弃用，则该已发布版本是旧的外部制品；请使用当前 OpenClaw 内置的插件或本地 checkout，直到发布更新的 npm 包。
</Note>

<AccordionGroup>
  <Accordion title="配置 include 与无效配置恢复">
    如果你的 `plugins` 段由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该 include 文件，并保持 `openclaw.json` 不变。根 include、include 数组以及带有同级覆盖项的 include 会封闭失败，而不是展开。有关支持的形状，请参见[配置 include](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会封闭失败，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动期间，某个插件的无效配置会隔离到该插件，因此其他渠道和插件可以继续运行；`openclaw doctor --fix` 可以隔离无效的插件条目。唯一有文档说明的安装时例外，是一个针对明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的窄范围内置插件恢复路径。

  </Accordion>
  <Accordion title="--force、重新安装与更新">
    `--force` 会复用现有安装目标，并就地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 制品重新安装同一 id 时使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已经安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并提示你使用 `plugins update <id-or-npm-spec>` 执行正常升级；如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。它不支持 `git:` 安装；当你需要固定源码时，请使用显式 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支持 `--marketplace`，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是用于内置危险代码扫描器误报的破窗选项。即使内置扫描器报告 `critical` 发现项，它也允许安装继续，但它**不会**绕过插件 `before_install` 钩子策略拦截，也**不会**绕过扫描失败。

    此 CLI 标志适用于插件 install/update 流程。由 Gateway 网关支持的 skill 依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub skill 下载/安装流程。

    如果你发布在 ClawHub 上的插件被 registry 扫描拦截，请使用 [ClawHub](/zh-CN/tools/clawhub) 中的发布者步骤。

  </Accordion>
  <Accordion title="钩子包和 npm spec">
    `plugins install` 也是安装在 `package.json` 中暴露 `openclaw.hooks` 的钩子包的界面。请使用 `openclaw hooks` 查看筛选后的钩子可见性和按钩子启用，而不是用于包安装。

    Npm spec **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。为安全起见，即使你的 shell 有全局 npm 安装设置，依赖安装也会在项目本地使用 `--ignore-scripts` 运行。

    当你想跳过 ClawHub 查找并直接从 npm 安装时，请使用 `npm:<package>`。裸包 spec 仍会优先使用 ClawHub，并且只有在 ClawHub 没有该包或版本时才回退到 npm。

    裸 spec 和 `@latest` 保持在稳定轨道。如果 npm 将两者之一解析为预发布版本，OpenClaw 会停止，并要求你使用预发布标签（例如 `@beta`/`@rc`）或精确的预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

    如果裸安装 spec 匹配内置插件 id（例如 `diffs`），OpenClaw 会直接安装内置插件。要安装同名 npm 包，请使用显式 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 可直接从 git 仓库安装。支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。添加 `@<ref>` 或 `#<ref>` 可在安装前 checkout 分支、标签或 commit。

    Git 安装会 clone 到临时目录，在存在请求的 ref 时将其 checkout，然后使用常规插件目录安装器。这意味着清单校验、危险代码扫描、运行时依赖 staging 和安装记录的行为都与本地路径安装一致。记录的 git 安装包含来源 URL/ref 以及解析后的 commit，因此 `openclaw plugins update` 稍后可以重新解析来源。

    从 git 安装后，请使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册，例如 gateway 方法和 CLI 命令。如果插件通过 `api.registerCli` 注册了 CLI 根，请直接通过 OpenClaw 根 CLI 执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    同时支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为裸 npm 安全插件 spec 使用 ClawHub。只有在 ClawHub 没有该包或版本时，才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可强制仅通过 npm 解析，例如当 ClawHub 不可访问，或你知道该包只存在于 npm 上时：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会从 ClawHub 下载包归档，检查其声明的插件 API / 最低 gateway 兼容性，然后通过常规归档路径安装。记录的安装会保留其 ClawHub 来源元数据，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的记录 spec，因此 `openclaw plugins update` 可以跟随后续的 ClawHub 新版本；显式版本或标签选择器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍固定到该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 的本地 registry 缓存 `~/.claude/plugins/known_marketplaces.json` 中时，请使用 `plugin@marketplace` 简写：

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
  <Tab title="Marketplace 来源">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称
    - 本地 marketplace 根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="远程 marketplace 规则">
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在 clone 的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认的 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

<Note>
兼容包会安装到普通插件根目录，并参与同一套列表/信息/启用/禁用流程。目前支持包内 Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skills，以及兼容的 Codex 钩子目录；其他检测到的包能力会显示在诊断/信息中，但尚未接入运行时执行。
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
  从表格视图切换为每个插件一行的详细信息，包含来源/源头/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单加注册表诊断信息。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；当注册表缺失或无效时，使用仅基于清单派生的回退。它适合检查插件是否已安装、已启用，并且对冷启动规划可见，但它不是对已经运行的 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请重启为该渠道提供服务的 Gateway 网关，再期待新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不只是包装进程。
</Note>

在打包的 Docker 镜像内处理内置插件时，将插件源目录绑定挂载到匹配的打包源路径上，例如 `/app/extensions/synology-chat`。OpenClaw 会先发现这个挂载的源码覆盖层，再发现 `/app/dist/extensions/synology-chat`；单纯复制进去的源码目录会保持不生效，因此普通打包安装仍会使用编译后的 dist。

用于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示来自一次模块加载检查过程的已注册钩子和诊断信息。运行时检查绝不会下载缺失的内置运行时依赖；需要修复时使用 `openclaw plugins deps --repair`。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、服务/进程提示、配置路径以及 RPC 健康状态。
- 非内置会话钩子（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接式安装会复用源路径，而不是覆盖托管安装目标。

在 npm 安装中使用 `--pin`，可以将解析后的精确规格（`name@version`）保存到托管插件索引中，同时保持默认行为为不固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，而不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶层 `installRecords` 映射是安装元数据的持久来源，包括损坏或缺失插件清单的记录。`plugins` 数组是从清单派生的冷注册表缓存。该文件包含请勿编辑警告，并被 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，会将它们移动到插件索引，并移除该配置键；如果任一写入失败，配置记录会被保留，以免安装元数据丢失。

### 运行时依赖

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` 会检查由插件配置、已启用/已配置渠道、已配置模型提供商或内置清单默认值选中的 OpenClaw 自有内置插件的打包运行时依赖阶段。它不是第三方 npm 或 ClawHub 插件的安装/更新路径。

当打包安装在 Gateway 网关启动或 `plugins doctor` 期间报告缺失内置运行时依赖时，使用 `--repair`。修复只会在禁用生命周期脚本的情况下安装缺失的已启用内置插件依赖。使用 `--prune` 可移除旧版打包布局遗留的陈旧未知外部运行时依赖根目录。

有关完整计划、暂存和修复生命周期，请参阅 [插件依赖解析](/zh-CN/plugins/dependency-resolution)。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会在适用时从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目以及链接的 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，否则卸载还会在被跟踪的托管安装目录位于 OpenClaw 插件扩展根目录内时移除该目录。对于主动记忆插件，记忆槽会重置为 `memory-core`。

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

更新会应用于托管插件索引中被跟踪的插件安装，以及 `hooks.internal.installs` 中被跟踪的钩子包安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm 规格">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装规格。这意味着之前存储的 dist-tags（例如 `@beta`）和精确固定版本，会在后续 `update <id>` 运行中继续使用。

    对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm 包规格。OpenClaw 会将该包名解析回被跟踪的插件记录，更新该已安装插件，并记录新的 npm 规格，供以后基于 id 的更新使用。

    传入不带版本或标签的 npm 包名，也会解析回被跟踪的插件记录。当某个插件已固定到精确版本，而你想把它移回注册表默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的工件身份已经匹配解析后的目标，更新会被跳过，不会下载、重新安装或重写 `openclaw.json`。

    当存在已存储的完整性哈希且获取到的工件哈希发生变化时，OpenClaw 会将其视为 npm 工件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助工具会默认失败关闭，除非调用方提供显式的继续策略。

  </Accordion>
  <Accordion title="更新时使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的破窗覆盖。它仍然不会绕过插件 `before_install` 策略阻断或扫描失败阻断，并且它只适用于插件更新，不适用于钩子包更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

默认情况下，检查会显示身份、加载状态、来源、清单能力、策略标志、诊断、安装元数据、包能力，以及任何检测到的 MCP 或 LSP 服务器支持，而不会导入插件运行时。添加 `--runtime` 可加载插件模块，并包含已注册钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。当缺少内置运行时依赖时，运行时检查会失败并给出修复提示；使用 `openclaw plugins deps --repair` 可显式修复它们。

插件拥有的 CLI 命令会作为根级 `openclaw` 命令组安装。当 `inspect --runtime` 在 `cliCommands` 下显示某个命令后，将其作为 `openclaw <command> ...` 运行；例如，注册了 `demo-git` 的插件可以用 `openclaw demo-git ping` 验证。

每个插件都会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有钩子，没有能力或界面
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会渲染一个全量表格，其中包含形态、能力种类、兼容性通知、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/设备发现诊断以及兼容性通知。当一切正常时，它会打印 `No plugin issues detected.`

对于缺失 `register`/`activate` 导出等模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 为已安装插件身份、启用状态、来源元数据和贡献归属持久化的冷读取模型。普通启动、提供商所有者查找、渠道设置分类和插件清单都可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否最新或是否陈旧。使用 `--refresh` 可基于持久化插件索引、配置策略以及清单/包元数据重建它。这是修复路径，而不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已弃用的破窗兼容开关，用于注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退仅用于迁移推出期间的紧急启动恢复。
</Warning>

### 插件市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

插件市场列表接受本地插件市场路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的来源标签，以及解析出的插件市场清单和插件条目。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [社区插件](/zh-CN/plugins/community)
