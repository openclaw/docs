---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容捆绑包
    - 你想要搭建或验证一个简单的工具插件
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-06-27T01:41:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容 bundle。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    面向最终用户的插件安装、启用和故障排除指南。
  </Card>
  <Card title="管理插件" href="/zh-CN/plugins/manage-plugins">
    安装、列出、更新、卸载和发布的快速示例。
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

对于安装、检查、卸载或刷新 registry 较慢的调查，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行该命令。跟踪会将阶段耗时写入 stderr，并保持 JSON 输出可解析。请参阅[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，插件生命周期修改命令会被禁用。请改用此安装对应的 Nix source，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；对于 nix-openclaw，请使用 agent-first [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要执行 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空）。兼容 bundle 改用自己的 bundle 清单。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细列表/信息输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`）以及检测到的 bundle 能力。
</Note>

### 作者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 默认创建一个最小 TypeScript 工具插件。第一个参数是插件 id；传入 `--name` 作为显示名称。OpenClaw 使用该 id 作为默认输出目录和包命名。工具脚手架使用 `defineToolPlugin`。
`plugins build` 导入构建后的入口，读取其静态工具元数据，写入 `openclaw.plugin.json`，并保持 `package.json` 的 `openclaw.extensions` 对齐。
`plugins validate` 检查生成的清单、包元数据和当前入口导出是否仍然一致。完整的工具创作工作流请参阅[工具插件](/zh-CN/plugins/tool-plugins)。

脚手架会写入 TypeScript 源码，但会从构建后的 `./dist/index.js` 入口生成元数据，因此该工作流也适用于已发布的 CLI。当入口不是默认包入口时，请使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在生成的元数据过期时失败而不重写文件。

### 提供商脚手架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供商脚手架会创建一个通用文本/模型提供商插件，包含 OpenAI 兼容的 API key 接线、用于 `clawhub package validate` 的内置 `npm run validate` 脚本、ClawHub 包元数据，以及一个手动触发的 GitHub workflow，用于未来通过 GitHub Actions OIDC 进行可信发布。提供商脚手架不会生成 skills，也不会使用 `openclaw plugins build` 或 `openclaw plugins validate`；这些命令用于工具脚手架的生成元数据路径。

发布前，请将占位 API base URL、模型目录、文档路由、凭证文本和 README 文案替换为真实提供商详情。使用生成的 README 进行首次 ClawHub 发布和可信发布者设置。

### 安装

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

维护者测试设置时安装时，可以用受保护的环境变量覆盖自动插件安装来源。请参阅[插件安装覆盖](/zh-CN/plugins/install-overrides)。

<Warning>
在发布切换期间，裸包名默认从 npm 安装，除非它们匹配官方插件 id。与内置插件匹配的原始 `@openclaw/*` 包 spec 会使用当前 OpenClaw build 随附的内置副本。当你明确想使用外部 npm 包时，请使用 `npm:<package>`。对于 ClawHub，请使用 `clawhub:<package>`。像运行代码一样对待插件安装。优先使用固定版本。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的插件包，并打印可直接安装的包名。它搜索 code-plugin 和 bundle-plugin 包，而不是 skills。对于 ClawHub skills，请使用 `openclaw skills search`。

<Note>
ClawHub 是大多数插件的主要分发和发现入口。Npm 仍然是受支持的回退和直接安装路径。OpenClaw 自有的 `@openclaw/*` 插件包已重新发布到 npm；请在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[插件清单](/zh-CN/plugins/plugin-inventory)查看当前列表。稳定版安装使用 `latest`。当 npm `beta` dist-tag 可用时，beta channel 安装和更新优先使用该标签，然后回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="配置 include 和无效配置修复">
    如果你的 `plugins` section 由单文件 `$include` 支撑，`plugins install/update/enable/disable/uninstall` 会写入该 included file，并保持 `openclaw.json` 不变。Root includes、include arrays，以及带 sibling overrides 的 includes 会 fail closed，而不是 flattening。支持的形状请参阅[配置 includes](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会 fail closed，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动和热重载期间，无效插件配置会像任何其他无效配置一样 fail closed；`openclaw doctor --fix` 可以隔离无效插件条目。唯一记录在文档中的安装时例外，是一个较窄的内置插件恢复路径，仅适用于显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

  </Accordion>
  <Accordion title="--force 和重新安装 vs 更新">
    `--force` 会复用现有安装目标，并原地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 构件重新安装同一 id 时使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对一个已安装插件 id 运行 `plugins install`，OpenClaw 会停止，并提示你使用 `plugins update <id-or-npm-spec>` 进行正常升级；如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。不支持与 `git:` 安装一起使用；当你想要固定来源时，请使用显式 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已弃用，现在是 no-op。OpenClaw 不再为插件安装运行内置的安装时危险代码阻断。

    当需要特定主机的安装策略时，请使用共享的、由 operator 拥有的 `security.installPolicy` 表面。插件 `before_install` 钩子是插件运行时生命周期钩子，不是 CLI 安装的主要策略边界。

    如果你发布到 ClawHub 的插件被 registry scan 隐藏或阻断，请使用 [ClawHub 发布](/zh-CN/clawhub/publishing)中的发布者步骤。`--dangerously-force-unsafe-install` 不会要求 ClawHub 重新扫描插件，也不会让被阻断的 release 公开。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社区 ClawHub 安装会在下载包之前检查所选 release trust record。如果 ClawHub 禁用该 release 的下载、报告恶意扫描发现，或将 release 置于 quarantine 等阻断性审核状态，OpenClaw 会拒绝该 release。对于非阻断性的高风险扫描状态、高风险审核状态或 registry 原因，OpenClaw 会显示信任详情，并在继续之前要求确认。

    只有在查看 ClawHub 警告并决定在没有交互式提示的情况下继续后，才使用 `--acknowledge-clawhub-risk`。Pending 或 stale 的 clean trust records 会发出警告，但不需要确认。官方 ClawHub 包和内置 OpenClaw 插件来源会绕过此 release-trust 提示。

  </Accordion>
  <Accordion title="钩子包和 npm specs">
    `plugins install` 也是安装在 `package.json` 中暴露 `openclaw.hooks` 的钩子包的入口。使用 `openclaw hooks` 查看过滤后的钩子可见性和逐钩子启用状态，而不是用于包安装。

    Npm specs **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file specs 和 semver ranges 会被拒绝。为了安全，即使你的 shell 配有全局 npm install 设置，依赖安装也会在每个插件一个托管 npm project 中运行，并带上 `--ignore-scripts`。托管插件 npm projects 会继承 OpenClaw 的 package-level npm `overrides`，因此主机安全 pin 也会应用到 hoisted 插件依赖。

    当你想明确使用 npm 解析时，请使用 `npm:<package>`。在发布切换期间，裸包 specs 也会直接从 npm 安装，除非它们匹配官方插件 id。

    匹配内置插件的原始 `@openclaw/*` 包规格会先解析到镜像拥有的内置副本，然后才回退到 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 会使用当前 OpenClaw 构建中的内置 Discord 插件，而不是创建一个受管的 npm 覆盖。若要强制使用外部 npm 包，请使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸规格和 `@latest` 会留在稳定轨道上。OpenClaw 日期戳修正版，例如 `2026.5.3-1`，在此检查中属于稳定发布。如果 npm 将其中任一项解析为预发布版本，OpenClaw 会停止并要求你使用预发布标签（例如 `@beta`/`@rc`）或精确的预发布版本（例如 `@1.2.3-beta.4`）来显式选择加入。

    对于没有精确版本的 npm 安装（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 会在安装前检查已解析的包元数据。如果最新稳定包需要更新的 OpenClaw 插件 API 或最低主机版本，OpenClaw 会检查较旧的稳定版本，并改为安装最新的兼容发布。精确版本和显式 dist-tags（例如 `@beta`）仍然严格：如果所选包不兼容，命令会失败，并要求你升级 OpenClaw 或选择兼容版本。

    如果裸安装规格匹配官方插件 ID（例如 `diffs`），OpenClaw 会直接安装目录条目。若要安装同名 npm 包，请使用显式带作用域规格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 直接从 git 仓库安装。支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://` 和 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>` 可在安装前检出分支、标签或提交。

    Git 安装会克隆到临时目录，在存在请求的 ref 时将其检出，然后使用普通插件目录安装器。这意味着清单验证、操作员安装策略、包管理器安装工作和安装记录的行为都类似 npm 安装。记录的 git 安装包含源 URL/ref 以及解析后的提交，因此 `openclaw plugins update` 稍后可以重新解析该源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册，例如 Gateway 网关方法和 CLI 命令。如果插件使用 `api.registerCli` 注册了 CLI 根命令，请通过 OpenClaw 根 CLI 直接执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    当文件是 npm-pack tarball，并且你想测试与 registry 安装相同的每插件受管 npm 项目路径时，请使用 `npm-pack:<path.tgz>`，包括 `package-lock.json` 验证、提升依赖扫描和 npm 安装记录。普通归档路径仍会作为本地归档安装到插件 extensions 根目录下。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，裸 npm 安全插件规格默认从 npm 安装，除非它们匹配官方插件 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可以显式指定仅 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查声明的插件 API / 最低 Gateway 网关兼容性。当所选 ClawHub 版本发布了 ClawPack 工件时，OpenClaw 会下载带版本的 npm-pack `.tgz`，验证 ClawHub 摘要标头和工件摘要，然后通过普通归档路径安装。没有 ClawPack 元数据的较旧 ClawHub 版本仍会通过旧版包归档验证路径安装。记录的安装会保留其 ClawHub 源元数据、工件类型、npm 完整性、npm shasum、tarball 名称和 ClawPack 摘要事实，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的记录规格，因此 `openclaw plugins update` 可以跟随较新的 ClawHub 发布；显式版本或标签选择器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍固定到该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 位于 `~/.claude/plugins/known_marketplaces.json` 的本地 registry 缓存中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传入 marketplace 源时，使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称
    - 本地 marketplace 根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须留在克隆的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容 bundle（`.codex-plugin/plugin.json`）
- Claude 兼容 bundle（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容 bundle（`.cursor-plugin/plugin.json`）

受管本地安装必须是插件目录或归档。独立 `.js`、`.mjs`、`.cjs` 和 `.ts` 插件文件不会被 `plugins install` 复制到受管插件根目录；请改为在 `plugins.load.paths` 中显式列出它们。

<Note>
兼容 bundle 会安装到普通插件根目录，并参与相同的列表/信息/启用/禁用流程。当前支持 bundle skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor command-skills 和兼容 Codex hook 目录；其他检测到的 bundle 能力会显示在诊断/信息中，但尚未接入运行时执行。
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
  从表格视图切换到每插件详细行，显示源/来源/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读清单，以及 registry 诊断和包依赖安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件 registry；当 registry 缺失或无效时，使用仅从清单派生的回退。它适合检查插件是否已安装、已启用并对冷启动规划可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、hook 策略或 `plugins.load.paths` 后，请重启服务该渠道的 Gateway 网关，然后再期望新的 `register(api)` 代码或 hook 运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不仅是包装进程。

`plugins list --json` 包含每个插件来自 `package.json` `dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 会检查这些包名是否存在于插件正常 Node `node_modules` 查找路径中；它不会导入插件运行时代码、运行包管理器或修复缺失的依赖。
</Note>

如果启动日志显示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，请运行 `openclaw plugins list --enabled --verbose`，或对列出的插件 ID 运行 `openclaw plugins inspect <id>`，以确认插件 ID，并将受信任 ID 复制到 `openclaw.json` 中的 `plugins.allow`。当警告可以列出每个已发现插件时，它会打印一段可直接粘贴的 `plugins.allow` 片段，其中已包含这些 ID。如果某个插件在没有安装/加载路径来源的情况下加载，请检查该插件 ID，然后将受信任 ID 固定到 `plugins.allow`，或从受信任源重新安装该插件，以便 OpenClaw 记录安装来源。

`plugins search` 是远程 ClawHub 目录查找。它不会检查本地状态、修改配置、安装包或加载插件运行时代码。搜索结果包含 ClawHub 包名、系列、渠道、版本、摘要，以及安装提示，例如 `openclaw plugins install clawhub:<package>`。

对于打包 Docker 镜像中的内置插件工作，请将插件源目录 bind-mount 到匹配的打包源路径上，例如 `/app/extensions/synology-chat`。OpenClaw 会先发现该挂载的源覆盖，再发现 `/app/dist/extensions/synology-chat`；普通复制的源目录仍保持惰性，因此正常打包安装仍使用编译后的 dist。

用于运行时 hook 调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示来自模块加载检查过程的已注册 hook 和诊断。运行时检查永远不会安装依赖；使用 `openclaw doctor --fix` 清理旧版依赖状态，或恢复配置引用的缺失可下载插件。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关 URL/profile、服务/进程提示、配置路径和 RPC 健康。
- 非内置 conversation hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 避免复制本地插件目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

独立插件文件必须列在 `plugins.load.paths` 中，而不是使用 `plugins install` 安装，或直接放在 `~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 中。这些自动发现的根目录会加载插件包或 bundle 目录，而顶层脚本文件会被视为本地 helper 并跳过。

<Note>
从工作区 `extensions` 根目录发现的工作区来源插件，只有在显式启用后才会被
导入或执行。对于本地开发，请运行 `openclaw plugins enable <plugin-id>`，或设置
`plugins.entries.<plugin-id>.enabled: true`；如果你的配置使用
`plugins.allow`，也要在那里包含同一个插件 id。即使渠道设置显式指向一个工作区来源插件并仅用于设置加载，
这条默认关闭规则同样适用，因此只要该工作区插件仍处于禁用状态或被排除在允许列表之外，本地渠道插件设置代码就不会运行。链接安装
和显式 `plugins.load.paths` 条目会按其解析出的插件来源遵循常规策略。请参阅
[配置插件策略](/zh-CN/tools/plugin#configure-plugin-policy)
和 [配置参考](/zh-CN/gateway/configuration-reference#plugins)。

`--force` 不支持与 `--link` 搭配使用，因为链接安装会复用源路径，而不是覆盖某个托管安装目标。

在 npm 安装中使用 `--pin`，可将解析出的精确规格（`name@version`）保存到托管插件索引中，同时保持默认行为为未固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，不是用户配置。安装和更新会把它写入活动 OpenClaw 状态目录下的共享 SQLite 状态数据库。`installed_plugin_index` 行存储持久的 `installRecords` 元数据，包括损坏或缺失插件清单的记录，以及一个由清单派生的冷注册表缓存，供 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，运行时读取会把它们当作兼容性输入，而不会重写 `openclaw.json`。显式插件写入和 `openclaw doctor --fix` 会把这些记录移动到插件索引中，并在允许写入配置时移除该配置键；如果任一写入失败，配置记录会保留，以免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目，以及适用时的链接 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，卸载还会移除位于 OpenClaw 插件 `extensions` 根目录内、受跟踪的托管安装目录。对于主动记忆插件，记忆槽会重置为 `memory-core`。

<Note>
`--keep-config` 作为 `--keep-files` 的已弃用别名受支持。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管插件索引中受跟踪的插件安装，以及 `hooks.internal.installs` 中受跟踪的钩子包安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm 规格">
    当你传入插件 id 时，OpenClaw 会复用该插件已记录的安装规格。这意味着之前存储的 dist-tag（例如 `@beta`）和精确固定版本会在后续 `update <id>` 运行中继续使用。

    这条定向更新规则不同于批量 `openclaw plugins update --all` 维护路径。批量更新仍会遵循普通的受跟踪安装规格，但受信任的官方 OpenClaw 插件记录可以同步到当前官方目录目标，而不是停留在过时的精确官方包上。当你有意保持某个精确或带标签的官方规格不变时，请使用定向 `update <id>`。

    对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm 包规格。OpenClaw 会把该包名解析回受跟踪的插件记录，更新该已安装插件，并记录新的 npm 规格，供以后基于 id 的更新使用。

    传入不带版本或标签的 npm 包名也会解析回受跟踪的插件记录。当某个插件已固定到精确版本，而你想把它移回注册表的默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="Beta 渠道更新">
    定向 `openclaw plugins update <id-or-npm-spec>` 会复用受跟踪的插件规格，除非你传入新的规格。批量 `openclaw plugins update --all` 在将受信任的官方插件记录同步到官方目录目标时，会使用配置的 `update.channel`，因此 beta 渠道安装可以留在 beta 发布线上，而不会被静默规范化为 stable/latest。

    `openclaw update` 也知道活动的 OpenClaw 更新渠道：在 beta 渠道上，默认线 npm 和 ClawHub 插件记录会先尝试 `@beta`。如果不存在插件 beta 版本，它们会回退到已记录的 default/latest 规格；如果 beta 包存在但安装校验失败，npm 插件也会回退。该回退会以警告形式报告，并且不会导致核心更新失败。精确版本和显式标签在定向更新中会继续固定到该选择器。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在执行实时 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的构件身份已经与解析出的目标匹配，更新会跳过，不下载、不重新安装，也不重写 `openclaw.json`。

    当存在已存储的完整性哈希，而获取到的构件哈希发生变化时，OpenClaw 会将其视为 npm 构件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助工具会默认关闭，除非调用方提供显式继续策略。

  </Accordion>
  <Accordion title="更新中的 --dangerously-force-unsafe-install">
    为了兼容性，`--dangerously-force-unsafe-install` 也可用于 `plugins update`，但它已弃用，且不再改变插件更新行为。操作员 `security.installPolicy` 仍可阻止更新；插件 `before_install` 钩子只会在已加载插件钩子的进程中应用。
  </Accordion>
  <Accordion title="更新中的 --acknowledge-clawhub-risk">
    由社区 ClawHub 支持的插件更新在下载替换包之前，会运行与安装相同的精确发布信任检查。对于经过审查的自动化，如果在所选 ClawHub 发布存在有风险的信任警告时仍应继续，请使用 `--acknowledge-clawhub-risk`。官方 ClawHub 包和内置 OpenClaw 插件源会绕过此发布信任提示。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 默认不会导入插件运行时，而是显示身份、加载状态、来源、清单能力、策略标志、诊断、安装元数据、捆绑能力，以及任何检测到的 MCP 或 LSP 服务器支持。JSON 输出包含插件清单契约，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，因此操作员可以在启用或重启插件之前审计受信任表面声明。添加 `--runtime` 可加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖；安装和修复仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 处理。

插件拥有的 CLI 命令通常会安装为根级 `openclaw` 命令组，但插件也可以在核心父级下注册嵌套命令，例如 `openclaw nodes`。在 `inspect --runtime` 显示 `cliCommands` 下的命令后，请在列出的路径运行它；例如，注册 `demo-git` 的插件可以用 `openclaw demo-git ping` 验证。

每个插件会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有钩子，没有能力或表面
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会渲染一张全局表格，包含形态、能力种类、兼容性通知、捆绑能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断、兼容性通知，以及缺失插件槽等过时的插件配置引用。当安装树和插件配置都干净时，它会打印 `No plugin issues detected.` 如果过时配置仍然存在，但安装树除此之外是健康的，摘要会说明这一点，而不会暗示完整的插件健康状态。

如果已配置的插件存在于磁盘上，但被加载器的路径安全检查阻止，配置校验会保留该插件条目，并将其报告为 `present but blocked`。请修复前面的被阻止插件诊断，例如路径所有权或全局可写权限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于缺失 `register`/`activate` 导出等模块形态故障，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 为已安装插件身份、启用状态、来源元数据和贡献所有权持久化的冷读模型。正常启动、提供商所有者查找、渠道设置分类和插件清单可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否为当前状态或是否过时。使用 `--refresh` 可基于持久化插件索引、配置策略和清单/包元数据重建它。这是修复路径，不是运行时激活路径。

`openclaw doctor --fix` 还会修复注册表相邻的托管 npm 漂移：如果托管插件 npm 项目下或旧版扁平托管 npm 根目录中的孤立或恢复的 `@openclaw/*` 包遮蔽了内置插件，Doctor 会移除该过时包并重建注册表，以便启动时根据内置清单进行校验。Doctor 还会把宿主 `openclaw` 包重新链接到声明 `peerDependencies.openclaw` 的托管 npm 插件中，使 `openclaw/plugin-sdk/*` 等包本地运行时导入在更新或 npm 修复后可以解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的应急兼容开关，用于注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退仅用于迁移推出期间的紧急启动恢复。
</Warning>

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地市场路径、`marketplace.json` 路径、形如 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会打印解析后的来源标签，以及解析出的市场清单和插件条目。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [ClawHub](/zh-CN/clawhub)
