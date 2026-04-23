---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容的捆绑包
    - 你想调试插件加载失败
summary: '`openclaw plugins` 的 CLI 参考（列出、安装、市场、卸载、启用 / 禁用、Doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-23T06:18:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad76a8068054d145db578ed01f1fb0726fff884c48d256ad8c0b708a516cd727
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件、hook 包和兼容捆绑包。

相关内容：

- 插件系统：[插件](/zh-CN/tools/plugin)
- 捆绑包兼容性：[插件捆绑包](/zh-CN/plugins/bundles)
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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

内置插件随 OpenClaw 一起提供。其中一些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；另一些则需要执行 `plugins enable`。

原生 OpenClaw 插件必须提供带有内联 JSON Schema 的 `openclaw.plugin.json`（即使为空也要有 `configSchema`）。兼容捆绑包则使用它们自己的捆绑包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表 / info 输出还会显示捆绑包子类型（`codex`、`claude` 或 `cursor`）以及检测到的捆绑包能力。

### 安装

```bash
openclaw plugins install <package>                      # 先查 ClawHub，再查 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # 市场
openclaw plugins install <plugin> --marketplace <name>  # 市场（显式）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

不带前缀的包名会先在 ClawHub 中查找，再回退到 npm。安全提示：请像对待可执行代码一样对待插件安装。优先固定版本。

如果配置无效，`plugins install` 通常会以失败关闭，并提示你先运行 `openclaw doctor --fix`。唯一记录在案的例外，是针对显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件所提供的一条受限的内置插件恢复路径。

`--force` 会复用现有安装目标，并原地覆盖已安装的插件或 hook 包。当你有意从新的本地路径、归档文件、ClawHub 包或 npm 工件重新安装相同 id 时，请使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为市场安装会保存市场来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是一个紧急破玻璃选项，用于处理内置危险代码扫描器的误报。即使内置扫描器报告 `critical` 级别发现，它也允许安装继续，但它**不会**绕过插件 `before_install` hook 策略拦截，也**不会**绕过扫描失败。

这个 CLI 标志适用于插件安装 / 更新流程。由 Gateway 网关支持的 skill 依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub skill 下载 / 安装流程。

`plugins install` 也是安装在 `package.json` 中暴露 `openclaw.hooks` 的 hook 包的安装界面。对于过滤后的 hook 可见性和按 hook 启用，请使用 `openclaw hooks`，而不是包安装。

npm spec **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git / URL / 文件 spec 和 semver 范围都会被拒绝。出于安全考虑，依赖安装会使用 `--ignore-scripts` 运行。

不带版本的 spec 和 `@latest` 会停留在稳定通道上。如果 npm 将其中任意一种解析为预发布版本，OpenClaw 会停止并要求你通过预发布标签（例如 `@beta` / `@rc`）或精确的预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

如果一个不带前缀的安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw 会直接安装该内置插件。要安装同名的 npm 包，请使用显式带作用域的 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude 市场安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为安全的裸 npm 插件 spec 使用 ClawHub。只有当 ClawHub 没有该包或该版本时，才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查声明的插件 API / 最低 Gateway 网关兼容性，然后通过常规归档路径进行安装。记录的安装会保留其 ClawHub 来源元数据，以供后续更新使用。

当市场名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传递市场来源时，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

市场来源可以是：

- 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市场名称
- 本地市场根目录或 `marketplace.json` 路径
- 形如 `owner/repo` 的 GitHub 仓库简写
- 形如 `https://github.com/owner/repo` 的 GitHub 仓库 URL
- git URL

对于从 GitHub 或 git 加载的远程市场，插件条目必须保留在克隆下来的市场仓库内部。OpenClaw 接受该仓库中的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件来源。

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- 兼容 Codex 的捆绑包（`.codex-plugin/plugin.json`）
- 兼容 Claude 的捆绑包（`.claude-plugin/plugin.json` 或默认的 Claude 组件布局）
- 兼容 Cursor 的捆绑包（`.cursor-plugin/plugin.json`）

兼容捆绑包会安装到常规扩展根目录中，并参与相同的 list / info / enable / disable 流程。目前，支持捆绑包 Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录；其他检测到的捆绑包能力会显示在诊断 / info 中，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已加载的插件。使用 `--verbose` 可从表格视图切换到按插件显示详细行，包括来源 / 起源 / 版本 / 激活元数据。使用 `--json` 获取机器可读的清单和注册表诊断。

使用 `--link` 避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制到受管理的安装目标上。

在 npm 安装中使用 `--pin`，可将解析得到的精确 spec（`name@version`）保存到 `plugins.installs` 中，而默认行为则保持不固定版本。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、`plugins.installs`、插件允许列表以及链接的 `plugins.load.paths` 条目中移除插件记录（如适用）。对于活跃的内存插件，memory 槽位会重置为 `memory-core`。

默认情况下，卸载还会删除活动 state-dir 插件根目录下的插件安装目录。使用 `--keep-files` 可保留磁盘上的文件。

`--keep-config` 作为 `--keep-files` 的废弃别名仍然受支持。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新会应用到 `plugins.installs` 中已跟踪的安装，以及 `hooks.internal.installs` 中已跟踪的 hook 包安装。

当你传入插件 id 时，OpenClaw 会复用为该插件记录的安装 spec。这意味着先前保存的 dist-tag（例如 `@beta`）和精确固定版本在后续执行 `update <id>` 时会继续被使用。

对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回已跟踪的插件记录，更新该已安装插件，并为未来基于 id 的更新记录新的 npm spec。

传入不带版本或标签的 npm 包名，同样会解析回已跟踪的插件记录。当某个插件被固定到精确版本，而你想让它回到 registry 的默认发布线时，请使用这种方式。

在执行实际的 npm 更新之前，OpenClaw 会根据 npm registry 元数据检查已安装包版本。如果已安装版本和记录的工件标识已经与解析后的目标一致，则会跳过更新，不会下载、重新安装，也不会重写 `openclaw.json`。

当存在已保存的完整性哈希，而获取到的工件哈希发生变化时，OpenClaw 会将其视为 npm 工件漂移。交互式 `openclaw plugins update` 命令会打印预期和实际哈希，并在继续之前请求确认。非交互式更新辅助工具会以失败关闭，除非调用方提供显式的继续策略。

`--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为在插件更新期间处理内置危险代码扫描误报的紧急覆盖选项。它仍然不会绕过插件 `before_install` 策略拦截或扫描失败拦截，并且它只适用于插件更新，不适用于 hook 包更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

用于单个插件的深度内省。显示身份信息、加载状态、来源、已注册能力、hooks、工具、命令、服务、Gateway 网关方法、HTTP 路由、策略标志、诊断、安装元数据、捆绑包能力，以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据其在运行时实际注册的内容进行分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有 hooks，没有能力或界面
- **non-capability** — 有工具 / 命令 / 服务，但没有能力

关于能力模型的更多信息，请参见 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适合脚本和审计使用的机器可读报告。

`inspect --all` 会渲染一个面向整个集群的表格，其中包含形态、能力种类、兼容性提示、捆绑包能力和 hook 摘要列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单 / 发现诊断以及兼容性提示。当一切正常时，它会打印 `No plugin issues
detected.`

对于诸如缺少 `register` / `activate` 导出之类的模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含精简的导出形态摘要。

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市场列表接受本地市场路径、`marketplace.json` 路径、形如 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会打印解析后的来源标签，以及已解析的市场清单和插件条目。
