---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容包
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-28T23:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a27d62f78692da7744af28cb5427f43004063e7b5721a945232c995bc405186d
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

若要调查安装、检查、卸载或 registry 刷新速度慢的问题，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行该命令。跟踪信息会将阶段耗时写入 stderr，并保持 JSON 输出可解析。参见[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，其中包含内联 JSON Schema（`configSchema`，即使为空）。兼容包改用它们自己的包清单。

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
裸包名会先针对 ClawHub 检查，然后检查 npm。请像运行代码一样对待插件安装。优先使用固定版本。
</Warning>

<AccordionGroup>
  <Accordion title="配置 include 和无效配置恢复">
    如果你的 `plugins` 区段由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该被 include 的文件，并保持 `openclaw.json` 不变。根 include、include 数组以及带同级覆盖项的 include 会关闭失败，而不是扁平化。有关支持的形状，请参见[配置 include](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会关闭失败，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动期间，某个插件的无效配置会隔离到该插件，以便其他渠道和插件可以继续运行；`openclaw doctor --fix` 可以隔离无效插件条目。唯一有文档说明的安装时例外，是针对明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的狭窄内置插件恢复路径。

  </Accordion>
  <Accordion title="--force 和重新安装对比 update">
    `--force` 会复用现有安装目标，并就地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 工件重新安装同一 id 时使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并指向 `plugins update <id-or-npm-spec>` 进行常规升级，或者在你确实想从其他来源覆盖当前安装时指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的应急选项。即使内置扫描器报告 `critical` 发现，它也允许安装继续，但它**不会**绕过插件 `before_install` 钩子策略阻止，也**不会**绕过扫描失败。

    此 CLI 标志适用于插件 install/update 流程。由 Gateway 网关支持的 skill 依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是单独的 ClawHub skill 下载/安装流程。

    如果你发布在 ClawHub 上的插件被 registry 扫描阻止，请使用 [ClawHub](/zh-CN/tools/clawhub) 中的发布者步骤。

  </Accordion>
  <Accordion title="钩子包和 npm specs">
    `plugins install` 也是安装在 `package.json` 中暴露 `openclaw.hooks` 的钩子包的界面。请使用 `openclaw hooks` 查看经过筛选的钩子可见性和按钩子启用，而不是安装包。

    Npm specs **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file specs 和 semver 范围会被拒绝。为了安全，依赖安装会在项目本地使用 `--ignore-scripts` 运行，即使你的 shell 有全局 npm 安装设置也是如此。

    当你想跳过 ClawHub 查找并直接从 npm 安装时，请使用 `npm:<package>`。裸包 specs 仍优先使用 ClawHub，只有在 ClawHub 没有该包或版本时才回退到 npm。

    裸 specs 和 `@latest` 会留在 stable 轨道。如果 npm 将其中任一项解析为 prerelease，OpenClaw 会停止并要求你使用 prerelease 标签（如 `@beta`/`@rc`）或精确 prerelease 版本（如 `@1.2.3-beta.4`）显式选择加入。

    如果裸安装 spec 匹配内置插件 id（例如 `diffs`），OpenClaw 会直接安装内置插件。要安装同名 npm 包，请使用显式 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="归档">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录之前被拒绝。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为裸 npm 安全插件 specs 使用 ClawHub。只有在 ClawHub 没有该包或版本时，才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 强制仅通过 npm 解析，例如当 ClawHub 不可达，或你知道该包仅存在于 npm 上时：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会从 ClawHub 下载包归档，检查声明的插件 API / 最低 gateway 兼容性，然后通过常规归档路径安装它。记录的安装会保留其 ClawHub 来源元数据，以便后续更新。
未指定版本的 ClawHub 安装会保留未指定版本的记录 spec，因此 `openclaw plugins update` 可以跟随较新的 ClawHub 发布；显式版本或标签选择器（如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍固定到该选择器。

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
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="远程 marketplace 规则">
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认 Claude component 布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

<Note>
兼容包会安装到常规插件根目录，并参与相同的 list/info/enable/disable 流程。目前支持包 skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex 钩子目录；其他检测到的包能力会显示在 diagnostics/info 中，但尚未接入运行时执行。
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
  从表格视图切换到按插件显示的详细行，其中包含来源/origin/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单加 registry diagnostics。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件 registry；当 registry 缺失或无效时，会使用仅基于清单推导的 fallback。它适合用于检查插件是否已安装、已启用，并且对冷启动规划可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请在期待新的 `register(api)` 代码或钩子运行之前，重启服务该渠道的 Gateway 网关。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不仅是包装器进程。
</Note>

对于打包 Docker 镜像内的内置插件工作，请将插件源目录 bind-mount 到匹配的打包源路径上，例如 `/app/extensions/synology-chat`。OpenClaw 会先发现该挂载的源码 overlay，再发现 `/app/dist/extensions/synology-chat`；普通复制的源码目录仍保持惰性，因此正常的打包安装仍会使用编译后的 dist。

用于运行时钩子调试：

- `openclaw plugins inspect <id> --json` 会显示来自模块加载检查过程的已注册钩子和诊断信息。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、服务/进程提示、配置路径以及 RPC 健康状态。
- 非内置的会话钩子（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制到托管安装目标上。

在 npm 安装中使用 `--pin`，可以将解析后的精确 spec（`name@version`）保存到托管插件索引中，同时保持默认行为为未固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶层 `installRecords` map 是安装元数据的持久来源，包括损坏或缺失插件 manifest 的记录。`plugins` 数组是从 manifest 派生的冷注册表缓存。该文件包含请勿编辑警告，并由 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，会将它们移动到插件索引中，并移除该配置键；如果任一写入失败，则会保留配置记录，确保安装元数据不会丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目，以及适用时的链接 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，卸载还会移除已跟踪的托管安装目录，前提是该目录位于 OpenClaw 的插件 extensions 根目录内。对于活动的 Memory 插件，Memory 槽位会重置为 `memory-core`。

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

更新会应用于托管插件索引中已跟踪的插件安装，以及 `hooks.internal.installs` 中已跟踪的 hook-pack 安装。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装 spec。这意味着先前存储的 dist-tags（例如 `@beta`）和精确固定版本，会继续用于之后的 `update <id>` 运行。

    对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm package spec。OpenClaw 会将该 package 名称解析回已跟踪的插件记录，更新已安装的插件，并记录新的 npm spec 供以后基于 id 的更新使用。

    传入不带版本或标签的 npm package 名称，也会解析回已跟踪的插件记录。当插件已固定到精确版本，而你想将其移回注册表的默认发布线时，请使用此方式。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    在执行实时 npm 更新前，OpenClaw 会根据 npm 注册表元数据检查已安装 package 版本。如果已安装版本和记录的 artifact 身份已经匹配解析后的目标，则会跳过更新，不下载、不重新安装，也不重写 `openclaw.json`。

    当存在已存储的 integrity 哈希且获取到的 artifact 哈希发生变化时，OpenClaw 会将其视为 npm artifact 漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助程序会失败关闭，除非调用方提供显式的继续策略。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的紧急覆盖。它仍不会绕过插件 `before_install` 策略阻断或扫描失败阻断，并且只适用于插件更新，不适用于 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

用于单个插件的深度内省。显示身份、加载状态、来源、已注册能力、钩子、工具、命令、服务、Gateway 网关方法、HTTP 路由、策略标志、诊断、安装元数据、bundle 能力，以及检测到的任何 MCP 或 LSP server 支持。

每个插件会按其运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅 provider 的插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有钩子，没有能力或 surface
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会渲染一个全局表格，包含形态、能力种类、兼容性通知、bundle 能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、manifest/设备发现诊断和兼容性通知。当一切正常时，它会打印 `No plugin issues detected.`

对于缺少 `register`/`activate` 导出等模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 为已安装插件身份、启用状态、来源元数据和贡献归属持久化的冷读模型。正常启动、provider owner 查找、渠道设置分类和插件清单可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、当前是否最新或是否过期。使用 `--refresh` 可从持久化插件索引、配置策略和 manifest/package 元数据重建它。这是修复路径，不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的紧急兼容性开关，用于注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退仅用于迁移推出期间的紧急启动恢复。
</Warning>

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市场列表接受本地市场路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub repo URL 或 git URL。`--json` 会打印解析后的来源标签，以及已解析的市场 manifest 和插件条目。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [社区插件](/zh-CN/plugins/community)
