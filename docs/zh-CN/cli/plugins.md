---
read_when:
    - 你想要安装或管理 Gateway 网关插件或兼容的软件包
    - 你想搭建或验证一个简单的工具插件
    - 你想调试插件加载失败问题
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（初始化、构建、验证、列出、安装、市场、卸载、启用/禁用、Doctor）'
title: 插件
x-i18n:
    generated_at: "2026-07-11T20:25:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
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
  <Card title="安全性" href="/zh-CN/gateway/security">
    插件安装的安全加固。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

调查缓慢的安装、检查、卸载或注册表刷新操作时，请使用
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行命令。跟踪信息会将各阶段耗时
写入标准错误，同时保持 JSON 输出可解析。请参阅[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，`openclaw.json` 不可变。`install`、`update`、`uninstall`、`enable` 和 `disable` 均会拒绝运行。请改为编辑此安装的 Nix 源（对于 nix-openclaw，使用 `programs.openclaw.config` 或 `instances.<name>.config`），然后重新构建。请参阅 Agent 优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
内置插件随 OpenClaw 一起提供。其中一些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要执行 `plugins enable`。

原生 OpenClaw 插件提供带有内联 JSON Schema 的 `openclaw.plugin.json`（即使为空，也包含 `configSchema`）。兼容包则使用自己的包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表/信息输出还会显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
</Note>

## 编写插件

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

默认情况下，`plugins init` 会创建一个最小化的 TypeScript 工具插件。第一个
参数是插件 ID；`--name` 用于设置显示名称。OpenClaw 使用该
ID 确定默认输出目录和包名。工具脚手架使用
`defineToolPlugin`，并在 `package.json` 中生成 `plugin:build` 和
`plugin:validate` 脚本；这些脚本会先执行构建，然后调用 `openclaw plugins build`/`validate`。

`plugins build` 会导入构建后的入口，读取其静态工具元数据，写入
`openclaw.plugin.json`，并使 `package.json` 中的 `openclaw.extensions` 保持同步。
`plugins validate` 会检查生成的清单、包元数据和
当前入口导出是否仍然一致。完整的编写工作流请参阅[工具插件](/zh-CN/plugins/tool-plugins)。

脚手架会写入 TypeScript 源代码，但从构建后的
`./dist/index.js` 入口生成元数据，因此该工作流也适用于已发布的 CLI。当入口不是默认包入口时，请使用
`--entry <path>`。在 CI 中使用
`plugins build --check`，可在生成的元数据过期时让检查失败，而不会
重写文件。

### 提供商脚手架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供商脚手架会创建一个通用的 OpenAI 兼容模型提供商插件，
其中包含 API 密钥身份验证流程、运行
`clawhub package validate` 的 `npm run validate` 脚本、ClawHub 包元数据，以及一个
可手动触发的 GitHub Actions 工作流，用于将来通过 GitHub
OIDC 进行可信发布。提供商脚手架不会生成 Skills，也不使用
`openclaw plugins build`/`validate`；这些命令用于工具
脚手架的元数据生成路径。

发布前，请将占位 API 基础 URL、模型目录、文档
路由、凭据文本和 README 内容替换为真实的提供商详细信息。首次发布到 ClawHub 和设置可信发布者时，请使用
生成的 README。

## 安装

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

维护者测试设置阶段的安装时，可以使用受保护的环境变量覆盖自动插件安装
来源。请参阅
[插件安装覆盖项](/zh-CN/plugins/install-overrides)。

<Warning>
在发布切换期间，裸包名默认从 npm 安装；但如果它们与内置或官方插件 ID 匹配，OpenClaw 会使用对应的本地/官方副本，而不会访问 npm 注册表。如果你明确需要外部 npm 包，请使用 `npm:<package>`。ClawHub 包请使用 `clawhub:<package>`。应将插件安装视为运行代码；优先使用固定版本。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的 `code-plugin` 和
`bundle-plugin` 包（不包括 Skills；搜索 Skills 请使用 `openclaw skills search`）。
默认 `--limit` 为 20，上限为 100。它只读取远程目录：不会
检查本地状态、修改配置、安装包或加载插件运行时。
结果包括 ClawHub 包名、系列、频道、版本、
摘要，以及类似 `openclaw plugins install clawhub:<package>` 的安装提示。

<Note>
ClawHub 是大多数插件的主要分发和发现界面。npm
仍是受支持的备用方案和直接安装路径。OpenClaw 所有的
`@openclaw/*` 插件包现已重新发布到 npm；当前列表请参阅
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或
[插件清单](/zh-CN/plugins/plugin-inventory)。稳定版安装使用 `latest`。
Beta 频道的安装和更新会优先使用 npm 的 `beta` 分发标签（如果可用），
否则回退到 `latest`。在扩展稳定版频道中，使用裸包名/默认意图或 `latest` 意图的官方 npm 插件
会解析为已安装核心的确切
版本。确切固定版本、显式的非 `latest` 标签、第三方包和
非 npm 来源不会被改写。
</Note>

<AccordionGroup>
  <Accordion title="配置包含项和无效配置修复">
    如果你的 `plugins` 部分由单文件 `$include` 提供，`plugins install/update/enable/disable/uninstall` 会将更改写入该包含文件，并保持 `openclaw.json` 不变。对于根包含项、包含数组以及带有同级覆盖项的包含项，操作会采用安全失败，而不是将其扁平化。受支持的形式请参阅[配置包含项](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会采用安全失败，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动和热重载期间，无效的插件配置会像其他无效配置一样采用安全失败；`openclaw doctor --fix` 可以隔离无效的插件条目。唯一有文档说明的安装阶段例外，是一个范围严格受限的内置插件恢复路径，仅适用于明确选择启用 `openclaw.install.allowInvalidConfigRecovery` 的插件。

  </Accordion>
  <Accordion title="--force、重新安装与更新">
    `--force` 会复用现有安装目标，并原地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 制品重新安装同一 ID 时，请使用此选项。对于已跟踪的 npm 插件的常规升级，请优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已安装的插件 ID 运行 `plugins install`，OpenClaw 会停止操作，并提示你使用 `plugins update <id-or-npm-spec>` 执行常规升级；如果你确实要从其他来源覆盖当前安装，则提示使用 `plugins install <package> --force`。`--force` 不支持与 `--link` 一起使用。

  </Accordion>
  <Accordion title="--pin 的适用范围">
    `--pin` 仅适用于 npm 安装，并记录解析后的确切 `<name>@<version>`。它不支持 `git:` 安装（应改为在规格中固定引用，例如 `git:github.com/acme/plugin@v1.2.3`），也不支持 `--marketplace`（市场安装会持久保存市场来源元数据，而不是 npm 规格）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已弃用，现在不执行任何操作。OpenClaw 不再对插件安装执行内置的安装阶段危险代码阻止检查。

    当需要特定于主机的安装策略时，请使用由操作员管理的 `security.installPolicy` 界面。插件的 `before_install` 钩子是插件运行时生命周期钩子，而不是 CLI 安装的主要策略边界。

    如果你发布到 ClawHub 的插件因注册表扫描而被隐藏或阻止，请按照 [ClawHub 发布](/zh-CN/clawhub/publishing)中的发布者步骤操作。`--dangerously-force-unsafe-install` 不会要求 ClawHub 重新扫描插件，也不会将被阻止的版本公开。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    下载前，社区 ClawHub 安装会检查所选版本的信任记录。如果 ClawHub 禁止下载该版本、报告恶意扫描发现，或将该版本置于阻止性审核状态（已隔离、已撤销），无论是否使用此标志，OpenClaw 都会直接拒绝安装。对于不会阻止安装的风险扫描状态或审核状态，OpenClaw 会显示信任详细信息，并在继续前请求确认。

    仅当你查看了 ClawHub 警告并决定在没有交互式提示的情况下继续时，才应使用 `--acknowledge-clawhub-risk`。待处理或过期（尚未确认干净）的扫描结果会触发警告，但不要求确认风险。官方 ClawHub 包和内置 OpenClaw 插件来源会完全跳过此版本信任检查。

  </Accordion>
  <Accordion title="钩子包和 npm 规格">
    `plugins install` 也是安装在 `package.json` 中公开 `openclaw.hooks` 的钩子包的入口。请使用 `openclaw hooks` 查看经过筛选的钩子并逐个启用钩子，而不是安装包。

    Npm 规范**仅限注册表**（包名加可选的**精确版本**或 **dist-tag**）。Git/URL/文件规范和 semver 范围会被拒绝。为确保安全，依赖安装会针对每个插件在一个托管的 npm 项目中使用 `--ignore-scripts` 执行，即使你的 shell 配置了全局 npm 安装设置也是如此。托管插件的 npm 项目会继承 OpenClaw 包级别的 npm `overrides`，因此宿主的安全版本锁定也适用于提升安装的插件依赖。

    使用 `npm:<package>` 明确指定通过 npm 解析。裸包规范在发布切换期间也会直接从 npm 安装，除非它与官方插件 ID 匹配。

    与内置插件匹配的原始 `@openclaw/*` 规范会先解析到镜像自带的内置副本，然后才回退到 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 会使用当前 OpenClaw 构建中的内置 Discord 插件，而不会创建托管的 npm 覆盖。若要强制使用外部 npm 包，请使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸规范和 `@latest` 会保持在稳定版本轨道。OpenClaw 的日期标记修正版（如 `2026.5.3-1`）在此检查中也视为稳定版本。如果 npm 将其中任一形式解析为预发布版本，OpenClaw 会停止，并要求你使用预发布标签（`@beta`/`@rc`）或精确的预发布版本（`@1.2.3-beta.4`）明确选择加入。

    对于未指定精确版本的 npm 安装（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 会在安装前检查解析出的包元数据。如果最新稳定包要求更新的 OpenClaw 插件 API 或更高的最低宿主版本，OpenClaw 会检查较旧的稳定版本，并改为安装最新的兼容版本。精确版本和显式 dist-tag 仍采用严格模式：不兼容的选择会失败，并要求你升级 OpenClaw 或选择兼容版本。

    如果裸安装规范与官方插件 ID 匹配（例如 `diffs`），OpenClaw 会直接安装目录中的条目。若要安装同名 npm 包，请使用显式的作用域规范（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 直接从 Git 仓库安装。支持的形式包括：`git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>`，即可在安装前检出分支、标签或提交。

    Git 安装会将仓库克隆到临时目录，在提供所请求的引用时将其检出，然后使用常规的插件目录安装程序，因此清单验证、操作员安装策略、包管理器安装工作和安装记录的行为与 npm 安装一致。记录的 Git 安装会包含源 URL/引用以及解析出的提交，以便 `openclaw plugins update` 之后可以重新解析该来源。

    从 Git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证 Gateway 网关方法和 CLI 命令等运行时注册。如果插件使用 `api.registerCli` 注册了 CLI 根命令，请直接通过 OpenClaw 根 CLI 运行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档文件">
    支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录中包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    当文件是 npm-pack tarball，并且你希望使用与注册表安装相同的按插件托管 npm 项目路径时，请使用 `npm-pack:<path.tgz>`，其中包括 `package-lock.json` 验证、提升依赖扫描和 npm 安装记录。普通归档路径仍会作为本地归档安装到插件扩展根目录下。

    也支持从 Claude 市场安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，符合 npm 安全命名规则的裸插件规范默认从 npm 安装，除非它与官方插件 ID 匹配：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明确指定仅通过 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查声明的插件 API / 最低 Gateway 网关兼容性。当选定的 ClawHub 版本发布了 ClawPack 制品时，OpenClaw 会下载带版本号的 npm-pack `.tgz`，验证 ClawHub 摘要标头和制品摘要，然后通过常规归档路径进行安装。没有 ClawPack 元数据的旧版 ClawHub 版本仍会通过旧版包归档验证路径安装。记录的安装会保留其 ClawHub 来源元数据、制品类型、npm 完整性值、npm shasum、tarball 名称和 ClawPack 摘要信息，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的已记录规范，以便 `openclaw plugins update` 可以跟随更新的 ClawHub 版本；显式版本或标签选择器（如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍会固定到该选择器。

### 市场简写

当市场名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，可使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

使用 `--marketplace` 显式传递市场来源：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="市场来源">
    - `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知市场名称
    - 本地市场根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - Git URL

  </Tab>
  <Tab title="远程市场规则">
    对于从 GitHub 或 Git 加载的远程市场，插件条目必须位于克隆的市场仓库内。OpenClaw 接受该仓库中的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、Git、GitHub 和其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json`；如果没有该清单文件，则使用默认的 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

托管的本地安装必须是插件目录或归档。独立的 `.js`、`.mjs`、`.cjs` 和 `.ts` 插件文件不会由 `plugins install` 复制到托管插件根目录中，也不会因为直接放入 `~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 而被加载；这些自动发现根目录会加载插件包或插件包目录，并将顶层脚本文件作为本地辅助文件跳过。请改为在 `plugins.load.paths` 中显式列出独立文件。

<Note>
兼容包会安装到常规插件根目录，并参与相同的列出/信息/启用/禁用流程。目前支持包内 Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skills，以及兼容的 Codex 钩子目录；检测到的其他包能力会显示在诊断/信息中，但尚未接入运行时执行。
</Note>

使用 `-l`/`--link` 指向本地插件目录而不复制该目录（将其添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支持与 `--force`（链接插件直接指向源路径，因此没有可在原位置覆盖的内容）、`--marketplace` 或 `git:` 安装一起使用，并且要求本地路径已存在。

<Note>
从工作区扩展根目录发现的工作区来源插件，在显式启用前不会被导入或执行。进行本地开发时，请运行 `openclaw plugins enable <plugin-id>`，或设置 `plugins.entries.<plugin-id>.enabled: true`；如果你的配置使用 `plugins.allow`，还需将同一插件 ID 加入其中。这条故障关闭规则同样适用于频道设置为仅执行设置而显式指定工作区来源插件的情况，因此当该工作区插件仍处于禁用状态或被排除在允许列表之外时，本地频道插件的设置代码不会运行。链接安装和显式 `plugins.load.paths` 条目遵循其解析后插件来源的常规策略。请参阅[配置插件策略](/zh-CN/tools/plugin#configure-plugin-policy)和[配置参考](/zh-CN/gateway/configuration-reference#plugins)。

在 npm 安装中使用 `--pin`，可将解析出的精确规范（`name@version`）保存到托管插件索引中；默认行为仍为不固定版本。
</Note>

## 列表

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
  从表格视图切换为每个插件一行的详细信息，其中包含格式/来源/起源/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的插件清单，以及注册表诊断和包依赖安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；当注册表缺失或无效时，则回退到仅根据清单派生的数据。它适合检查插件是否已安装、已启用，以及是否对冷启动规划可见，但不能实时探测已经运行的 Gateway 网关进程。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，应重启为该频道提供服务的 Gateway 网关，然后再预期新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不仅仅是包装进程。

`plugins list --json` 会包含根据 `package.json` 的 `dependencies` 和 `optionalDependencies` 得出的每个插件的 `dependencyStatus`。OpenClaw 会检查这些包名是否存在于插件常规的 Node `node_modules` 查找路径中；它不会导入插件运行时代码、运行包管理器或修复缺失的依赖。
</Note>

如果启动日志显示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，请运行 `openclaw plugins list --enabled --verbose`，或使用列出的插件 ID 运行 `openclaw plugins inspect <id>`，以确认插件 ID，并将可信 ID 复制到 `openclaw.json` 的 `plugins.allow` 中。当警告能够列出所有发现的插件时，它会输出一段可直接粘贴的 `plugins.allow` 配置，其中已经包含这些 ID。如果某个插件在没有安装/加载路径来源信息的情况下被加载，请检查该插件 ID，然后在 `plugins.allow` 中固定该可信 ID，或者从可信来源重新安装插件，使 OpenClaw 记录安装来源。

在打包的 Docker 镜像中处理内置插件时，请将插件源目录绑定挂载到对应的打包源路径上，例如 `/app/extensions/synology-chat`。OpenClaw 会优先于 `/app/dist/extensions/synology-chat` 发现该挂载的源码覆盖层；仅复制的源码目录仍不会生效，因此常规的打包安装仍会使用已编译的 dist。

对于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 显示通过模块加载检查流程注册的钩子和诊断信息。运行时检查绝不会安装依赖项；请使用 `openclaw doctor --fix` 清理旧版依赖状态，或恢复配置中引用但缺失的可下载插件。
- `openclaw gateway status --deep --require-rpc` 确认可访问的 Gateway 网关 URL/配置文件、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置的对话钩子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要设置 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 插件索引

插件安装元数据是由系统管理的状态，而不是用户配置。安装和更新操作会将其写入当前 OpenClaw 状态目录下的共享 SQLite 状态数据库。`installed_plugin_index` 行存储持久的 `installRecords` 元数据，其中包括清单损坏或缺失的插件记录，以及由清单派生的冷注册表缓存，供 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中发现已发布的旧版 `plugins.installs` 记录时，运行时读取会将其视为兼容性输入，但不会重写 `openclaw.json`。显式插件写入操作和 `openclaw doctor --fix` 会将这些记录移入插件索引，并在允许写入配置时移除该配置键；如果任一写入失败，则会保留配置记录，以免丢失安装元数据。

## 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目以及适用的关联 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，否则卸载还会移除被跟踪的托管安装目录，但仅限于该目录解析后位于 OpenClaw 的插件扩展根目录内。如果插件当前占用 `memory` 或 `contextEngine` 槽位，该槽位会重置为默认值（记忆使用 `memory-core`，上下文引擎使用 `legacy`）。

`uninstall` 会先输出将被移除内容的预览，然后在进行更改前提示 `Uninstall plugin "<id>"?`。传入 `--force` 可跳过确认提示（适用于脚本和非交互式运行）；如果未传入此参数，卸载需要交互式 TTY。`--dry-run` 会输出相同的预览，然后退出，不显示提示，也不进行任何更改。

<Note>
`--keep-config` 作为 `--keep-files` 的已弃用别名受到支持。
</Note>

## 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管插件索引中被跟踪的插件安装，以及 `hooks.internal.installs` 中被跟踪的钩子包安装。

<AccordionGroup>
  <Accordion title="解析插件 ID 与 npm 规范">
    传入插件 ID 时，OpenClaw 会复用该插件记录的安装规范。这意味着先前存储的 `@beta` 等 dist-tag 和精确固定版本会继续用于后续的 `update <id>` 运行。

    在执行 `update <id> --dry-run` 时，使用精确版本固定的 npm 安装会保持固定。如果 OpenClaw 还能解析该软件包的注册表默认发布线，并且该默认发布线比已安装的固定版本更新，试运行会报告固定版本，并输出显式的 `@latest` 软件包更新命令，以便切换到注册表默认发布线。

    此定向更新规则不同于批量维护路径 `openclaw plugins update --all`。批量更新仍会遵循常规的已跟踪安装规范，但受信任的 OpenClaw 官方插件记录可以同步到当前官方目录目标，而不是停留在过时的官方软件包精确版本上。如果你有意保持某个精确或带标签的官方规范不变，请使用定向的 `update <id>`。

    对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 软件包规范。OpenClaw 会将该软件包名称解析回被跟踪的插件记录，更新已安装的插件，并记录新的 npm 规范，供以后基于 ID 的更新使用。

    传入不带版本或标签的 npm 软件包名称，也会解析回被跟踪的插件记录。当插件被固定到精确版本，而你希望将其移回注册表默认发布线时，请使用此方式。

  </Accordion>
  <Accordion title="Beta 渠道更新">
    除非传入新规范，否则定向的 `openclaw plugins update <id-or-npm-spec>` 会复用被跟踪的插件规范。批量的 `openclaw plugins update --all` 在将受信任的官方插件记录同步到官方目录目标时，会使用配置的 `update.channel`，因此 Beta 渠道安装可以留在 Beta 发布线上，而不会被静默归一化到稳定版/最新版。

    `openclaw update` 也能识别当前 OpenClaw 更新渠道：在 Beta 渠道上，使用默认发布线的 npm 和 ClawHub 插件记录会先尝试 `@beta`。如果不存在插件 Beta 版本，它们会回退到记录的默认/最新规范；如果 npm 插件存在 Beta 软件包但未通过安装验证，也会回退。此回退会作为警告报告，但不会导致核心更新失败。对于定向更新，精确版本和显式标签会继续固定到对应的选择器。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实际执行 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装的软件包版本。如果已安装版本和记录的制品标识均已与解析出的目标匹配，则会跳过更新，不进行下载、重新安装或重写 `openclaw.json`。

    如果存在已存储的完整性哈希，而获取到的制品哈希发生变化，OpenClaw 会将其视为 npm 制品漂移。交互式 `openclaw plugins update` 命令会输出预期哈希和实际哈希，并在继续前请求确认。除非调用方提供显式的继续策略，否则非交互式更新辅助程序会以失败关闭方式处理。

  </Accordion>
  <Accordion title="更新时使用 --dangerously-force-unsafe-install">
    为保持兼容性，`plugins update` 仍接受 `--dangerously-force-unsafe-install`，但该参数已弃用，并且不再改变插件更新行为。操作员的 `security.installPolicy` 仍可阻止更新；插件的 `before_install` 钩子仅适用于已加载插件钩子的进程。
  </Accordion>
  <Accordion title="更新时使用 --acknowledge-clawhub-risk">
    在下载替换软件包之前，由社区 ClawHub 支持的插件更新会执行与安装相同的精确版本信任检查。对于已经过审核的自动化，如果在所选 ClawHub 版本存在高风险信任警告时仍应继续，请使用 `--acknowledge-clawhub-risk`。ClawHub 官方软件包和内置 OpenClaw 插件源会绕过此版本信任提示。
  </Accordion>
</AccordionGroup>

## 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

默认情况下，检查功能无需导入插件运行时，即可显示标识、加载状态、来源、清单能力、策略标志、诊断信息、安装元数据、内置包能力，以及检测到的任何 MCP 或 LSP 服务器支持。JSON 输出包含插件清单契约，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，以便操作员在启用或重启插件之前审核受信任界面声明。添加 `--runtime` 可加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖项；安装和修复仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 负责。

插件自有的 CLI 命令通常作为根级 `openclaw` 命令组安装，但插件也可以在 `openclaw nodes` 等核心父命令下注册嵌套命令。当 `inspect --runtime` 在 `cliCommands` 下显示某个命令后，请在列出的路径运行该命令；例如，可以使用 `openclaw demo-git ping` 验证注册了 `demo-git` 的插件。

每个插件都会根据其在运行时实际注册的内容进行分类：

| 形态                | 含义                                                       |
| ------------------- | ---------------------------------------------------------- |
| `plain-capability`  | 恰好一种能力类型（例如仅提供商插件）                       |
| `hybrid-capability` | 多于一种能力类型（例如文本 + 语音 + 图像）                 |
| `hook-only`         | 仅包含钩子，不包含能力、工具、命令、服务或路由             |
| `non-capability`    | 包含工具/命令/服务，但不包含能力                            |

有关能力模型的更多信息，请参阅[插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志输出适合脚本处理和审计的机器可读报告。`inspect --all` 会呈现覆盖整个插件集合的表格，其中包含形态、能力种类、兼容性通知、内置包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/设备发现诊断、兼容性通知，以及插件槽位缺失等过时的插件配置引用。当安装树和插件配置均无问题时，它会输出 `No plugin issues detected.`。如果仍存在过时配置，但安装树在其他方面健康，摘要会明确说明这一点，而不会暗示插件整体完全健康。

如果已配置的插件存在于磁盘上，但被加载器的路径安全检查阻止，配置验证会保留该插件条目，并将其报告为 `present but blocked`。请修复此前报告的插件阻止诊断问题，例如路径所有权或所有用户可写权限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于缺少 `register`/`activate` 导出等模块形态故障，请设置 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 后重新运行，以在诊断输出中包含简洁的导出形态摘要。

## 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 持久化的冷读取模型，用于保存已安装插件的标识、启用状态、来源元数据和贡献所有权。常规启动、提供商所有者查找、渠道设置分类和插件清单均可读取该注册表，无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否为当前状态或是否已过时。使用 `--refresh` 根据持久化插件索引、配置策略和清单/软件包元数据重建注册表。这是一条修复路径，而不是运行时激活路径。

`openclaw doctor --fix` 还会修复注册表相关的托管 npm 漂移：如果托管插件 npm 项目或旧版扁平托管 npm 根目录下存在孤立或恢复的 `@openclaw/*` 软件包，并且该软件包遮蔽了内置插件，Doctor 会移除这个过时软件包并重建注册表，以便启动过程依据内置清单进行验证。Doctor 还会将宿主 `openclaw` 软件包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，使 `openclaw/plugin-sdk/*` 等软件包本地运行时导入在更新或 npm 修复后能够正常解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的紧急兼容性开关，用于处理注册表读取失败。应优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此环境变量回退仅用于迁移推广期间的紧急启动恢复。
</Warning>

## 市场

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` 列出已配置的 OpenClaw 市场源中的条目。默认情况下，它会尝试使用托管源，并在失败时回退到最近接受的快照或内置数据。使用 `--feed-profile <name>` 读取已配置的特定配置文件，使用 `--feed-url <url>` 读取显式指定的托管源 URL，使用 `--offline` 在不获取源的情况下读取最近接受的快照。

`plugins marketplace refresh` 刷新已配置的托管源快照，并报告 OpenClaw 接受的是托管数据、托管快照还是内置回退数据。当调用方要求仅在新获取的托管载荷与固定校验和匹配时命令才能成功，请使用 `--expected-sha256`。

市场 `list` 接受本地市场路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会输出解析后的源标签，以及解析出的市场清单和插件条目。

市场刷新会加载托管的 OpenClaw 市场源，并将经过验证的响应持久化为本地托管源快照。不带选项时，它使用已配置的默认源配置文件。使用 `--feed-profile <name>` 刷新已配置的特定配置文件，使用 `--feed-url <url>` 刷新显式指定的托管源 URL，使用 `--expected-sha256 <sha256>` 要求载荷校验和匹配（`sha256:<hex>` 或不带前缀的 64 字符十六进制摘要），使用 `--json` 获取机器可读输出。显式指定的托管源 URL 不得包含凭据、查询字符串或片段。未固定校验和的刷新可以报告托管快照或内置回退结果，而不会导致命令失败。固定校验和的刷新必须接受新获取的托管载荷才能成功；成功获取托管数据后，如果 OpenClaw 无法持久化经过验证的快照，刷新也会失败。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [ClawHub](/clawhub)
