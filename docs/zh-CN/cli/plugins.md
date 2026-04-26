---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容的捆绑包。
    - 你想调试插件加载失败问题。
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-26T10:35:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

管理 Gateway 网关插件、hook 包和兼容的捆绑包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    面向终端用户的指南，介绍如何安装、启用和排查插件问题。
  </Card>
  <Card title="插件捆绑包" href="/zh-CN/plugins/bundles">
    捆绑包兼容性模型。
  </Card>
  <Card title="插件清单" href="/zh-CN/plugins/manifest">
    清单字段和配置 schema。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security">
    针对插件安装的安全加固。
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
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商，以及内置浏览器插件）；其他插件则需要执行 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，并且包含内联 JSON Schema（`configSchema`，即使为空也必须提供）。兼容的捆绑包则使用它们自己的 bundle manifest。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细的 list/info 输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`），以及检测到的 bundle 能力。
</Note>

### 安装

```bash
openclaw plugins install <package>                      # 先查 ClawHub，再查 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
裸包名会先在 ClawHub 中检查，然后再检查 npm。请把插件安装视为运行代码。优先选择固定版本。
</Warning>

<AccordionGroup>
  <Accordion title="配置 include 和无效配置恢复">
    如果你的 `plugins` 部分由单文件 `$include` 提供支持，那么 `plugins install/update/enable/disable/uninstall` 会直接写入该被包含文件，而不会修改 `openclaw.json`。根级 include、include 数组，以及带有同级覆盖项的 include 都会以失败关闭的方式处理，而不是被展平。支持的形态请参见 [配置 include](/zh-CN/gateway/configuration)。

    如果配置无效，`plugins install` 通常会以失败关闭的方式终止，并提示你先运行 `openclaw doctor --fix`。唯一有文档说明的例外，是针对那些明确选择启用 `openclaw.install.allowInvalidConfigRecovery` 的插件所提供的一条狭义内置插件恢复路径。

  </Accordion>
  <Accordion title="--force 以及重新安装 vs 更新">
    `--force` 会复用现有安装目标，并原地覆盖已安装的插件或 hook 包。当你有意从新的本地路径、归档文件、ClawHub 包或 npm 制品重新安装相同 id 时，请使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对一个已经安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并提示你使用 `plugins update <id-or-npm-spec>` 进行正常升级；如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 作用范围">
    `--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是一个用于处理内置危险代码扫描器误报的“破玻璃”选项。即使内置扫描器报告 `critical` 级别发现，它也允许安装继续进行，但它**不会**绕过插件 `before_install` hook 策略拦截，也**不会**绕过扫描失败。

    这个 CLI 标志适用于插件 install/update 流程。由 Gateway 网关支持的 Skills 依赖安装会使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍然是单独的 ClawHub Skills 下载/安装流程。

  </Accordion>
  <Accordion title="Hook 包和 npm spec">
    `plugins install` 也是暴露 `openclaw.hooks` 于 `package.json` 中的 hook 包的安装入口。请使用 `openclaw hooks` 查看经过筛选的 hook 可见性和按 hook 启用状态，而不是用于安装包。

    npm spec **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。为安全起见，依赖安装会在项目本地以 `--ignore-scripts` 运行，即使你的 shell 配置了全局 npm 安装设置也是如此。

    裸 spec 和 `@latest` 会保持在稳定轨道上。如果 npm 将其中任一项解析为预发布版本，OpenClaw 会停止，并要求你通过预发布标签（如 `@beta`/`@rc`）或精确的预发布版本（如 `@1.2.3-beta.4`）显式选择加入。

    如果一个裸安装 spec 与内置插件 id 匹配（例如 `diffs`），OpenClaw 会直接安装该内置插件。若要安装同名 npm 包，请使用显式的带作用域 spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="归档文件">
    支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录中包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录之前被拒绝。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为裸的 npm-safe 插件 spec 选择 ClawHub。只有在 ClawHub 没有该包或对应版本时，才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查所声明的插件 API / 最低网关兼容性，然后通过常规归档路径完成安装。记录下来的安装会保留其 ClawHub 来源元数据，以便后续更新。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，可使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

如果你想显式传入 marketplace 来源，请使用 `--marketplace`：

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
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保持在克隆出的 marketplace 仓库内部。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径类插件来源。
  </Tab>
</Tabs>

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- 与 Codex 兼容的捆绑包（`.codex-plugin/plugin.json`）
- 与 Claude 兼容的捆绑包（`.claude-plugin/plugin.json` 或默认的 Claude 组件布局）
- 与 Cursor 兼容的捆绑包（`.cursor-plugin/plugin.json`）

<Note>
兼容捆绑包会安装到常规插件根目录，并参与同一套 list/info/enable/disable 流程。目前，已支持 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录；其他已检测到的 bundle 能力会显示在诊断/info 中，但尚未接入运行时执行。
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
  从表格视图切换为逐插件详情行，显示来源/源头/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单，以及注册表诊断信息。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；如果注册表缺失或无效，则回退到仅基于 manifest 的派生结果。它适合用于检查某个插件是否已安装、已启用，以及在冷启动规划中是否可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。在更改插件代码、启用状态、hook 策略或 `plugins.load.paths` 后，先重启为该渠道提供服务的 Gateway 网关，然后再期待新的 `register(api)` 代码或 hook 开始运行。对于远程/容器部署，请确认你重启的是真正的 `openclaw gateway run` 子进程，而不仅仅是某个包装进程。
</Note>

如果你要在打包好的 Docker 镜像内处理内置插件，请将插件源目录 bind-mount 到对应的打包源路径之上，例如
`/app/extensions/synology-chat`。OpenClaw 会在 `/app/dist/extensions/synology-chat` 之前发现该挂载的源代码覆盖层；而普通复制进去的源目录不会生效，因此常规打包安装仍会使用已编译的 dist。

对于运行时 hook 调试：

- `openclaw plugins inspect <id> --json` 会显示模块加载检查过程中注册的 hook 和诊断信息。
- `openclaw gateway status --deep --require-rpc` 用于确认可到达的 Gateway 网关、服务/进程提示、配置路径以及 RPC 健康状态。
- 非内置的会话 hook（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制到受管理的安装目标上。

在 npm 安装中使用 `--pin`，可将解析后的精确 spec（`name@version`）保存到受管理插件索引中，同时保持默认行为不固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其中顶层 `installRecords` 映射是安装元数据的持久来源，包括针对已损坏或缺失插件清单的记录。`plugins` 数组则是基于 manifest 派生的冷注册表缓存。该文件包含“请勿手动编辑”的警告，并被 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，它会将其迁移到插件索引中，并移除该配置键；如果任一写入失败，则会保留配置记录，以免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件 allow/deny 列表条目，以及适用时的链接 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，否则卸载还会删除已跟踪的受管理安装目录，前提是该目录位于 OpenClaw 的插件扩展根目录内。对于活跃的 memory 插件，memory 插槽会重置为 `memory-core`。

<Note>
`--keep-config` 支持作为 `--keep-files` 的已弃用别名。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于受管理插件索引中已跟踪的插件安装，以及 `hooks.internal.installs` 中已跟踪的 hook 包安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm spec">
    当你传入插件 id 时，OpenClaw 会复用该插件已记录的安装 spec。这意味着先前保存的 dist-tag（如 `@beta`）和精确固定版本，在后续执行 `update <id>` 时仍会继续使用。

    对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回已跟踪的插件记录，更新这个已安装插件，并记录新的 npm spec，供今后基于 id 的更新使用。

    传入不带版本或标签的 npm 包名，也会解析回已跟踪的插件记录。当某个插件已固定到精确版本，而你想将它移回 registry 的默认发布线时，可以使用这种方式。

  </Accordion>
  <Accordion title="版本检查与完整性漂移">
    在执行实际的 npm 更新前，OpenClaw 会根据 npm registry 元数据检查已安装包版本。如果已安装版本和记录的制品身份已与解析出的目标一致，则会跳过更新，不会下载、重新安装，也不会重写 `openclaw.json`。

    当存在已存储的完整性哈希，而拉取到的制品哈希发生变化时，OpenClaw 会将其视为 npm 制品漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助程序会以失败关闭的方式终止，除非调用方提供了显式的继续策略。

  </Accordion>
  <Accordion title="更新时的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 同样可用于 `plugins update`，作为在插件更新期间应对内置危险代码扫描误报的“破玻璃”覆盖选项。它仍然不会绕过插件 `before_install` 策略拦截，也不会绕过扫描失败拦截，并且它只适用于插件更新，不适用于 hook 包更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度内省。显示其身份、加载状态、来源、已注册能力、hooks、工具、命令、服务、网关方法、HTTP 路由、策略标志、诊断、安装元数据、bundle 能力，以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据它在运行时实际注册的内容进行分类：

- **plain-capability** — 单一能力类型（例如仅 provider 的插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有 hooks，没有能力或其他暴露面
- **non-capability** — 有工具/命令/服务，但没有能力

关于能力模型的更多信息，请参见 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计使用的机器可读报告。`inspect --all` 会渲染一个面向整组插件的表格，其中包含 shape、capability kinds、兼容性提示、bundle 能力以及 hook 摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、manifest/设备发现 诊断，以及兼容性提示。如果一切正常，它会打印 `No plugin issues detected.`。

对于缺少 `register`/`activate` 导出之类的模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 针对已安装插件身份、启用状态、来源元数据和贡献归属的持久化冷读模型。正常启动、provider 所有者查找、渠道设置分类以及插件清单都可以在不导入插件运行时模块的情况下读取它。

使用 `plugins registry` 可检查持久化注册表是否存在、是否最新，或者是否已过期。使用 `--refresh` 可根据持久化插件索引、配置策略以及 manifest/package 元数据重建它。这是一条修复路径，而不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的“破玻璃”兼容性开关，用于处理注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；这个环境变量回退仅用于迁移发布期间的紧急启动恢复。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 列表支持本地 marketplace 路径、`marketplace.json` 路径、形如 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的来源标签，以及已解析的 marketplace manifest 和插件条目。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [社区插件](/zh-CN/plugins/community)
