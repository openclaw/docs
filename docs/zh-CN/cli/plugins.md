---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容 bundle
    - 你想调试插件加载失败
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: plugins
x-i18n:
    generated_at: "2026-04-05T08:20:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件/扩展、hook 包和兼容 bundle。

相关内容：

- 插件系统：[Plugins](/tools/plugin)
- Bundle 兼容性：[Plugin bundles](/plugins/bundles)
- 插件清单 + schema：[Plugin manifest](/plugins/manifest)
- 安全加固：[Security](/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

内置插件随 OpenClaw 一起提供。其中一些默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）；另一些则需要运行 `plugins enable`。

原生 OpenClaw 插件必须提供带内联 JSON
Schema（即使为空也要有 `configSchema`）的 `openclaw.plugin.json`。兼容 bundle 则使用它们自己的 bundle 清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细 list/info
输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`）以及检测到的 bundle
能力。

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

裸包名会先在 ClawHub 中检查，再检查 npm。安全说明：
请将插件安装视为运行代码。优先使用固定版本。

如果配置无效，`plugins install` 通常会以安全关闭方式失败，并提示你先运行
`openclaw doctor --fix`。唯一有文档说明的例外是一个狭窄的
内置插件恢复路径，适用于显式选择启用
`openclaw.install.allowInvalidConfigRecovery` 的插件。

`--force` 会复用现有安装目标，并原地覆盖已安装的
插件或 hook 包。当你有意从新的本地路径、归档、ClawHub 包或 npm 制品重新安装相同 ID 时，请使用它。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，
因为 marketplace 安装会持久化 marketplace 源元数据，而不是
npm spec。

`--dangerously-force-unsafe-install` 是内置危险代码扫描器出现误报时的紧急开关选项。
即使内置扫描器报告 `critical` 发现，它也允许安装继续进行，但它**不会**
绕过插件 `before_install` hook 策略阻止，也**不会**绕过扫描
失败。

此 CLI 标志适用于插件 install/update 流程。由 Gateway 网关支持的 Skills
依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是一个独立的 ClawHub Skills
下载/安装流程。

`plugins install` 也是暴露
`package.json` 中 `openclaw.hooks` 的 hook 包的安装入口。请使用 `openclaw hooks` 查看过滤后的 hook
可见性和按 hook 启用，而不是用于包安装。

Npm spec **仅支持 registry**（包名 + 可选的**精确版本**或
**dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。出于安全考虑，
依赖安装会使用 `--ignore-scripts` 运行。

裸 spec 和 `@latest` 会保持在稳定通道上。如果 npm 将其中任一解析到预发布版，
OpenClaw 会停止并要求你显式选择加入，例如使用预发布标签
`@beta`/`@rc`，或精确的预发布版本，例如
`@1.2.3-beta.4`。

如果一个裸安装 spec 匹配某个内置插件 ID（例如 `diffs`），OpenClaw
会直接安装该内置插件。若要安装同名的 npm 包，
请使用显式带作用域的 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先对裸的 npm-safe 插件 spec 使用 ClawHub。只有在
ClawHub 不存在该包或该版本时，它才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查其声明的
插件 API / 最低 Gateway 网关兼容性，然后通过常规
归档路径安装它。记录下来的安装会保留其 ClawHub 源元数据，以便后续更新。

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，
请使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

如果你想显式传入 marketplace 源，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace 源可以是：

- 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- GitHub 仓库简写，例如 `owner/repo`
- GitHub 仓库 URL，例如 `https://github.com/owner/repo`
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆后的 marketplace 仓库内部。OpenClaw 接受来自该仓库的相对路径源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件源。

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容 bundle（`.codex-plugin/plugin.json`）
- Claude 兼容 bundle（`.claude-plugin/plugin.json` 或默认的 Claude
  组件布局）
- Cursor 兼容 bundle（`.cursor-plugin/plugin.json`）

兼容 bundle 会安装到常规扩展根目录，并参与同样的 list/info/enable/disable 流程。目前，已支持 bundle Skills、Claude
command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` /
清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的
Codex hook 目录；其他检测到的 bundle 能力会显示在诊断/info 中，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已加载的插件。使用 `--verbose` 可从表格视图切换为每插件详情行，显示 source/origin/version/activation
元数据。使用 `--json` 可获取机器可读的清单以及注册表
诊断信息。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用
源路径，而不是复制到托管安装目标中。

在 npm 安装中使用 `--pin` 可将解析后的精确 spec（`name@version`）保存到
`plugins.installs` 中，同时保持默认行为不固定版本。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、`plugins.installs`、
插件允许列表以及关联的 `plugins.load.paths` 条目中删除插件记录（如适用）。
对于活动内存插件，内存槽位会重置为 `memory-core`。

默认情况下，卸载还会删除活动
state-dir 插件根目录下的插件安装目录。使用
`--keep-files` 可保留磁盘上的文件。

`--keep-config` 作为 `--keep-files` 的已弃用别名仍受支持。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新会应用到 `plugins.installs` 中跟踪的安装项，以及 `hooks.internal.installs` 中跟踪的 hook 包安装项。

当你传入插件 ID 时，OpenClaw 会复用该插件记录下来的安装 spec。
这意味着先前存储的 dist-tag（例如 `@beta`）和精确固定版本会在之后的
`update <id>` 运行中继续使用。

对于 npm 安装，你也可以传入带 dist-tag
或精确版本的显式 npm 包 spec。OpenClaw 会将该包名回解析到受跟踪的插件
记录，更新该已安装插件，并记录新的 npm spec 以供之后基于 ID 的更新使用。

当已存储完整性哈希且抓取到的制品哈希发生变化时，
OpenClaw 会打印警告并在继续前请求确认。在 CI/非交互式运行中，
可使用全局 `--yes` 跳过提示。

`--dangerously-force-unsafe-install` 在 `plugins update` 中也可用，作为内置危险代码扫描在插件更新期间误报时的紧急覆盖开关。它仍不会绕过插件 `before_install` 策略阻止
或扫描失败阻止，并且它仅适用于插件更新，不适用于 hook 包更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度检查。显示身份、加载状态、来源、
已注册能力、hooks、工具、命令、服务、Gateway 网关方法、
HTTP 路由、策略标志、诊断、安装元数据、bundle 能力，
以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据它在运行时实际注册的内容进行分类：

- **plain-capability** — 单一能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 仅 hooks，无能力或表面
- **non-capability** — 有工具/命令/服务，但无能力

有关能力模型的更多信息，请参阅 [Plugin shapes](/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适合脚本处理和审计的机器可读报告。

`inspect --all` 会渲染全局表格，包含 shape、capability kinds、
兼容性提示、bundle capabilities 和 hook 摘要列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断信息以及
兼容性提示。当一切正常时，它会打印 `No plugin issues
detected.`

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、
类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json`
会打印解析后的源标签以及已解析的 marketplace 清单和
插件条目。
