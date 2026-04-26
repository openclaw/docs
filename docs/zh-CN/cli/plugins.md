---
read_when:
    - 你想要安装或管理 Gateway 网关插件或兼容的软件包合集
    - 你想要调试插件加载失败问题
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-26T00:16:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: da98084eb695f0180f928475e31c649a6fc45431b59067688d37417b3727f587
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件、hook 软件包，以及兼容的软件包合集。

相关内容：

- 插件系统：[插件](/zh-CN/tools/plugin)
- 软件包兼容性：[插件软件包](/zh-CN/plugins/bundles)
- 插件清单 + schema：[插件清单](/zh-CN/plugins/manifest)
- 安全加固：[安全](/zh-CN/gateway/security)

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

内置插件会随 OpenClaw 一起提供。其中一些默认启用（例如内置模型提供商、内置语音提供商，以及内置浏览器插件）；另一些则需要使用 `plugins enable`。

原生 OpenClaw 插件必须提供 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空也需要）。兼容的软件包合集则改用它们自己的 bundle 清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细的 list/info 输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`），以及检测到的 bundle 能力。

### 安装

```bash
openclaw plugins install <package>                      # 先查找 ClawHub，然后再查找 npm
openclaw plugins install clawhub:<package>              # 仅使用 ClawHub
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

裸包名会先在 ClawHub 中查找，然后再查找 npm。安全提示：安装插件相当于运行代码。建议优先使用固定版本。

如果你的 `plugins` 配置段由单文件 `$include` 提供支持，`plugins install/update/enable/disable/uninstall` 会将更改写入该被包含文件，并保持 `openclaw.json` 不变。根级 includes、include 数组，以及带有同级 override 的 include 都会以安全关闭方式失败，而不会被扁平化处理。支持的形式请参见 [配置 includes](/zh-CN/gateway/configuration)。

如果配置无效，`plugins install` 通常会以安全关闭方式失败，并提示你先运行 `openclaw doctor --fix`。唯一记录在文档中的例外，是一个较窄的内置插件恢复路径，适用于明确启用了 `openclaw.install.allowInvalidConfigRecovery` 的插件。

`--force` 会复用现有安装目标，并原地覆盖一个已安装的插件或 hook 软件包。当你有意从新的本地路径、归档文件、ClawHub 包或 npm 制品重新安装相同 id 时，请使用它。对于已跟踪 npm 插件的常规升级，建议优先使用 `openclaw plugins update <id-or-npm-spec>`。

如果你对一个已安装的插件 id 运行 `plugins install`，OpenClaw 会停止并引导你：正常升级请使用 `plugins update <id-or-npm-spec>`，如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久保存 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是内置危险代码扫描器出现误报时的紧急开关选项。即使内置扫描器报告 `critical` 级发现，它也允许安装继续进行，但它**不会**绕过插件 `before_install` hook 策略拦截，也**不会**绕过扫描失败。

这个 CLI 标志适用于插件安装/更新流程。由 Gateway 网关支持的 Skills 依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载/安装流程。

`plugins install` 也是暴露 `openclaw.hooks` 于 `package.json` 中的 hook 软件包的安装入口。请使用 `openclaw hooks` 来查看经过筛选的 hook 可见性以及按 hook 启用，而不是用于安装软件包。

Npm spec **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围都会被拒绝。为安全起见，依赖安装会在项目本地使用 `--ignore-scripts` 运行，即使你的 shell 配置了全局 npm 安装设置也是如此。

裸 spec 和 `@latest` 会保持在稳定通道上。如果 npm 将它们中的任意一种解析为预发布版本，OpenClaw 会停止，并要求你显式选择加入，例如使用 `@beta`/`@rc` 这样的预发布标签，或像 `@1.2.3-beta.4` 这样的精确预发布版本。

如果一个裸安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw 会直接安装该内置插件。要安装同名的 npm 包，请使用显式作用域 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为裸 npm-safe 插件 spec 使用 ClawHub。只有在 ClawHub 没有该包或该版本时，才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载软件包归档，检查所声明的插件 API / 最低 Gateway 网关兼容性，然后通过常规归档路径安装它。已记录的安装会保留其 ClawHub 来源元数据，以便后续更新。

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，可使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

如果你想显式传递 marketplace 来源，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace 来源可以是：

- 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- GitHub 仓库简写，例如 `owner/repo`
- GitHub 仓库 URL，例如 `https://github.com/owner/repo`
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保持在克隆后的 marketplace 仓库内部。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件来源。

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容的软件包合集（`.codex-plugin/plugin.json`）
- Claude 兼容的软件包合集（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容的软件包合集（`.cursor-plugin/plugin.json`）

兼容的软件包合集会安装到常规插件根目录中，并参与相同的 list/info/enable/disable 流程。目前，已支持 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 由清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录；其他检测到的 bundle 能力会在诊断/info 中显示，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已启用插件。使用 `--verbose` 可从表格视图切换为按插件显示的详细行，其中包含 source/origin/version/activation 元数据。使用 `--json` 可获取适合机器读取的清单以及注册表诊断信息。

`plugins list` 会先读取持久化的本地插件注册表；如果注册表缺失或无效，则回退为仅基于清单推导出的结果。它适用于检查插件是否已安装、已启用，以及对冷启动规划是否可见，但它并不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、hook 策略或 `plugins.load.paths` 后，请重启为该渠道提供服务的 Gateway 网关，然后再期待新的 `register(api)` 代码或 hook 开始运行。对于远程/容器部署，请确认你重启的是真正的 `openclaw gateway run` 子进程，而不只是某个包装进程。

对于运行时 hook 调试：

- `openclaw plugins inspect <id> --json` 会显示已注册的 hook 以及来自模块加载检查过程的诊断信息
- `openclaw gateway status --deep --require-rpc` 会确认可达的 Gateway 网关、服务/进程提示、配置路径以及 RPC 健康状态
- 非内置的会话 hook（`llm_input`、`llm_output`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制覆盖一个受管安装目标。

在 npm 安装中使用 `--pin`，可以把解析后的精确 spec（`name@version`）保存到受管插件索引中，同时保持默认行为不固定版本。

### 插件索引

插件安装元数据是机器管理的状态，而不是用户配置。安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其中顶层 `installRecords` 映射是安装元数据的持久来源，包括损坏或缺失插件清单的记录。`plugins` 数组则是基于清单派生的冷注册表缓存。该文件包含“请勿手动编辑”的警告，并被 `openclaw plugins update`、卸载、诊断以及冷插件注册表使用。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件 allowlist，以及关联的 `plugins.load.paths` 条目中移除插件记录（如适用）。
对于活跃的内存插件，memory 插槽会重置为 `memory-core`。

默认情况下，卸载还会删除活动 state-dir 插件根目录下的插件安装目录。使用 `--keep-files` 可保留磁盘上的文件。

`--keep-config` 作为 `--keep-files` 的已弃用别名仍受支持。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新会应用于受管插件索引中已跟踪的插件安装，以及 `hooks.internal.installs` 中已跟踪的 hook 软件包安装。

当你传入一个插件 id 时，OpenClaw 会复用该插件已记录的安装 spec。这意味着此前存储的 dist-tag（如 `@beta`）和精确固定版本，会在后续运行 `update <id>` 时继续使用。

对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回已跟踪的插件记录，更新该已安装插件，并记录新的 npm spec，以供后续基于 id 的更新使用。

不带版本或标签地传入 npm 包名，也会解析回已跟踪的插件记录。当某个插件被固定到精确版本，而你想让它回到 registry 的默认发布线时，请使用这种方式。

在执行实际的 npm 更新前，OpenClaw 会将已安装的软件包版本与 npm registry 元数据进行比较。如果已安装版本和已记录制品标识已经与解析后的目标一致，则会跳过更新，不会下载、重新安装，也不会重写 `openclaw.json`。

当存在已存储的完整性哈希，而获取到的制品哈希发生变化时，OpenClaw 会将其视为 npm 制品漂移。交互式的 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助工具会以安全关闭方式失败，除非调用方提供显式的继续策略。

`--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新过程中内置危险代码扫描误报时的紧急覆盖选项。它仍然不会绕过插件 `before_install` 策略拦截或扫描失败拦截，并且它只适用于插件更新，不适用于 hook 软件包更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

针对单个插件的深度自省。显示身份信息、加载状态、来源、已注册能力、hook、工具、命令、服务、Gateway 网关方法、HTTP 路由、策略标志、诊断信息、安装元数据、bundle 能力，以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据它在运行时实际注册的内容进行分类：

- **plain-capability** — 单一能力类型（例如仅 provider 的插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 仅有 hook，没有能力或其他表面
- **non-capability** — 有工具/命令/服务，但没有能力

关于能力模型的更多信息，请参见 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适合脚本和审计使用的机器可读报告。

`inspect --all` 会渲染一个面向整组插件的表格，其中包含 shape、capability kinds、兼容性提示、bundle 能力，以及 hook 摘要列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断信息，以及兼容性提示。当一切正常时，它会打印 `No plugin issues detected.`。

对于缺少 `register`/`activate` 导出之类的模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 针对已安装插件身份、启用状态、来源元数据和贡献归属所持久化的冷读模型。正常启动、provider 归属查询、渠道设置分类，以及插件清单，都可以在不导入插件运行时模块的情况下读取它。

使用 `plugins registry` 可检查持久化注册表是否存在、是否最新、是否已过期。使用 `--refresh` 可基于持久化插件索引、配置策略以及清单/软件包元数据重建它。这是修复路径，不是运行时激活路径。

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的紧急兼容开关，用于应对注册表读取失败。更推荐使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；这个环境变量回退仅用于迁移发布期间的紧急启动恢复。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、像 `owner/repo` 这样的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的来源标签，以及已解析的 marketplace 清单和插件条目。

## 相关

- [CLI 参考](/zh-CN/cli)
- [构建插件](/zh-CN/plugins/building-plugins)
- [社区插件](/zh-CN/plugins/community)
