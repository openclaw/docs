---
read_when:
    - 你想要安装或管理 Gateway 网关插件或兼容的捆绑包
    - 你想搭建或验证一个简单的工具插件脚手架
    - 你想要调试插件加载失败问题
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（初始化、构建、验证、列出、安装、市场、卸载、启用/禁用、Doctor）'
title: 插件
x-i18n:
    generated_at: "2026-07-16T11:28:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    关于安装、启用插件及排查插件问题的最终用户指南。
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
openclaw plugins info <id>                    # inspect 的别名
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

若要调查缓慢的安装、检查、卸载或注册表刷新操作，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行命令。跟踪信息会将各阶段耗时写入 stderr，并使 JSON 输出保持可解析状态。请参阅[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，`openclaw.json` 不可变。`install`、`update`、`uninstall`、`enable` 和 `disable` 均会拒绝运行。请改为编辑此安装的 Nix 源（对于 nix-openclaw，为 `programs.openclaw.config` 或 `instances.<name>.config`），然后重新构建。请参阅以智能体为先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
内置插件随 OpenClaw 一起提供。其中一些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件则需要 `plugins enable`。

原生 OpenClaw 插件附带包含内联 JSON Schema 的 `openclaw.plugin.json`（`configSchema`，即使为空）。兼容包则使用各自的包清单。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细的列表/信息输出还会显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
</Note>

## 创作

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

默认情况下，`plugins init` 会创建一个最小化的 TypeScript 工具插件。第一个参数是插件 ID；`--name` 用于设置显示名称。OpenClaw 使用该 ID 作为默认输出目录和包名称。工具脚手架使用 `defineToolPlugin`，并生成 `package.json` 脚本 `plugin:build` 和 `plugin:validate`，它们会先构建，再调用 `openclaw plugins build`/`validate`。

`plugins build` 会导入已构建的入口，读取其静态工具元数据，写入 `openclaw.plugin.json`，并使 `package.json` 的 `openclaw.extensions` 保持一致。`plugins validate` 会检查生成的清单、包元数据和当前入口导出是否仍然一致。有关完整的创作工作流，请参阅[工具插件](/zh-CN/plugins/tool-plugins)。

脚手架会写入 TypeScript 源代码，但从已构建的 `./dist/index.js` 入口生成元数据，因此该工作流也适用于已发布的 CLI。当入口不是默认包入口时，请使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在生成的元数据过期时使检查失败，而不重写文件。

### 提供商脚手架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供商脚手架会创建一个兼容 OpenAI 的通用模型提供商插件，其中包含 API 密钥身份验证机制、运行 `clawhub package validate` 的 `npm run validate` 脚本、ClawHub 包元数据，以及一个需手动触发的 GitHub Actions 工作流，以便将来通过 GitHub OIDC 进行可信发布。提供商脚手架不会生成 Skills，也不使用 `openclaw plugins build`/`validate`；这些命令用于工具脚手架的生成元数据路径。

发布前，请将占位 API 基础 URL、模型目录、文档路由、凭据文本和 README 文案替换为真实的提供商详细信息。首次发布到 ClawHub 和设置可信发布者时，请使用生成的 README。

## 安装

```bash
openclaw plugins search "calendar"                      # 搜索 ClawHub 插件
openclaw plugins install @openclaw/<package>            # 可信官方目录
openclaw plugins install <package>                       # 任意 npm 包
openclaw plugins install clawhub:<package>                # 仅限 ClawHub
openclaw plugins install npm:<package>                    # 仅限 npm
openclaw plugins install npm-pack:<path.tgz>               # 本地 npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git 仓库
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # 本地路径或归档
openclaw plugins install -l <path>                         # 链接而非复制
openclaw plugins install <plugin>@<marketplace>             # 市场简写
openclaw plugins install <plugin> --marketplace <name>      # 市场（显式指定）
openclaw plugins install <package> --force                  # 确认来源/覆盖现有安装
openclaw plugins install <package> --pin                    # 固定解析出的 npm 版本
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

维护者在测试设置期间的安装时，可以使用受保护的环境变量覆盖自动插件安装来源。请参阅[插件安装覆盖](/zh-CN/plugins/install-overrides)。

<Warning>
在启动切换期间，裸包名默认从 npm 安装；但如果它与内置或官方插件 ID 匹配，OpenClaw 会使用对应的本地/官方副本，而不会访问 npm 注册表。如果明确需要外部 npm 包，请改用 `npm:<package>`。对于 ClawHub，请使用 `clawhub:<package>`。应像运行代码一样对待插件安装；优先使用固定版本。
</Warning>

<Warning>
ClawHub 包以及 OpenClaw 的内置/官方目录是可信安装来源。新的任意 npm、`npm-pack:`、git、本地路径/归档或市场来源会发出警告，并在继续前要求确认。以非交互方式安装任意来源时，必须先审查并信任来源，然后传入 `--force`。必要时，同一标志也会覆盖现有安装目标。对已跟踪安装执行常规更新不需要此标志。此确认与 `--acknowledge-clawhub-risk` 相互独立，后者仅适用于存在风险的 ClawHub 版本信任警告。`--force` 不会绕过 `security.installPolicy` 或其余安装安全检查。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的 `code-plugin` 和 `bundle-plugin` 包（不包括 Skills；Skills 请使用 `openclaw skills search`）。`--limit` 的默认值为 20，上限为 100。它只读取远程目录：不会检查本地状态、修改配置、安装包或加载插件运行时。结果包括 ClawHub 包名称、系列、渠道、版本、摘要，以及 `openclaw plugins install clawhub:<package>` 之类的安装提示。

<Note>
ClawHub 是大多数插件的主要分发和发现平台。Npm 仍作为受支持的备用方式和直接安装途径。OpenClaw 自有的 `@openclaw/*` 插件包已再次发布到 npm；请在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[插件清单](/zh-CN/plugins/plugin-inventory)中查看当前列表。稳定版安装使用 `latest`。Beta 渠道的安装和更新会优先使用 npm 的 `beta` dist-tag（如果可用），否则回退到 `latest`。在扩展稳定渠道中，具有裸值/默认值或 `latest` 意图的官方 npm 插件会解析为已安装核心的确切版本。确切固定版本和显式的非 `latest` 标签、第三方包及非 npm 来源不会被重写。
</Note>

<AccordionGroup>
  <Accordion title="配置包含和无效配置修复">
    如果你的 `plugins` 部分由单文件 `$include` 提供支持，`plugins install/update/enable/disable/uninstall` 会直接写入该被包含文件，并保持 `openclaw.json` 不变。根级包含、包含数组以及带同级覆盖项的包含会以关闭方式失败，而不会被扁平化。有关支持的形式，请参阅[配置包含](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会以关闭方式失败，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动和热重载期间，无效的插件配置会像其他无效配置一样以关闭方式失败；`openclaw doctor --fix` 可以隔离无效的插件条目。唯一有文档说明的安装期例外，是一条范围有限的内置插件恢复路径，仅适用于明确选择启用 `openclaw.install.allowInvalidConfigRecovery` 的插件。

  </Accordion>
  <Accordion title="--force 确认以及重新安装与更新的区别">
    `--force` 会在不提示的情况下确认非 ClawHub 来源。它不会绕过 `security.installPolicy` 或其余安装安全检查。当插件或钩子包已安装时，它还会复用现有目标并就地覆盖。在审查任意 npm、本地、归档、git 或市场来源后，或者有意重新安装同一 ID 时，请使用此选项。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果针对已安装的插件 ID 运行 `plugins install`，OpenClaw 会停止操作，并引导你使用 `plugins update <id-or-npm-spec>` 执行常规升级；如果确实希望从不同来源覆盖当前安装，则会引导你使用 `plugins install <package> --force`。任意来源仍会显示交互式来源警告；非交互安装必须在审查后传入 `--force`。可信的 ClawHub 和 OpenClaw 目录来源不需要此标志。使用 `--link` 时，`--force` 会确认来源，但不会更改链接路径安装模式。

  </Accordion>
  <Accordion title="--pin 适用范围">
    `--pin` 仅适用于 npm 安装，并记录解析出的确切 `<name>@<version>`。它不支持 `git:` 安装（请改为在规范中固定 ref，例如 `git:github.com/acme/plugin@v1.2.3`），也不支持 `--marketplace`（市场安装会保留市场来源元数据，而不是 npm 规范）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已弃用，目前不会执行任何操作。OpenClaw 不再对插件安装执行内置的安装期危险代码阻止检查。

    当需要主机专属安装策略时，请使用由操作员拥有的 `security.installPolicy` 接口。插件 `before_install` 钩子是插件运行时生命周期钩子，而不是 CLI 安装的主要策略边界。

    如果你在 ClawHub 上发布的插件因注册表扫描而被隐藏或阻止，请按照 [ClawHub 发布](/zh-CN/clawhub/publishing)中的发布者步骤操作。`--dangerously-force-unsafe-install` 不会请求 ClawHub 重新扫描插件，也不会将被阻止的版本公开。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    下载前，社区 ClawHub 安装会检查所选版本的信任记录。如果 ClawHub 禁止下载该版本、报告恶意扫描发现，或将该版本置于阻止性的审核状态（已隔离、已撤销），无论是否使用此标志，OpenClaw 都会直接拒绝安装。对于非阻止性的风险扫描状态或审核状态，OpenClaw 会显示信任详情，并要求确认后再继续。

    仅在查看 ClawHub 警告并决定不通过交互式提示继续操作后，才使用 `--acknowledge-clawhub-risk`。待处理或过时（尚未确认干净）的扫描结果会发出警告，但不要求确认。ClawHub 官方软件包和 OpenClaw 内置插件源会完全绕过此版本信任检查。

  </Accordion>
  <Accordion title="钩子包和 npm 规范">
    `plugins install` 也是安装钩子包的接口，这些钩子包会在 `package.json` 中公开 `openclaw.hooks`。请使用 `openclaw hooks` 控制经过筛选的钩子可见性和逐钩子启用，而不是安装软件包。

    Npm 规范**仅限注册表**（软件包名称加上可选的**精确版本**或 **dist-tag**）。Git/URL/文件规范和 semver 范围会被拒绝。为确保安全，即使你的 shell 配置了全局 npm 安装设置，每个插件的依赖项安装也会在一个使用 `--ignore-scripts` 的托管 npm 项目中运行。托管插件 npm 项目会继承 OpenClaw 软件包级别的 npm `overrides`，因此主机安全固定规则也适用于提升到顶层的插件依赖项。

    使用 `npm:<package>` 可明确指定 npm 解析。在发布切换期间，裸软件包规范也会直接从 npm 安装，除非它们与某个官方插件 ID 匹配。

    与内置插件匹配的原始 `@openclaw/*` 规范会先解析为镜像所拥有的内置副本，然后才回退到 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 会使用当前 OpenClaw 构建中的内置 Discord 插件，而不会创建托管 npm 覆盖。要强制使用外部 npm 软件包，请使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸规范和 `@latest` 会保留在稳定版本轨道上。对于此检查，`2026.5.3-1` 等带日期戳的 OpenClaw 修正版本视为稳定版本。如果 npm 将任一形式解析为预发布版本，OpenClaw 会停止并要求你通过预发布标签（`@beta`/`@rc`）或精确的预发布版本（`@1.2.3-beta.4`）明确选择加入。

    对于未指定精确版本的 npm 安装（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 会在安装前检查解析后的软件包元数据。如果最新稳定软件包需要更新的 OpenClaw 插件 API 或更高的最低主机版本，OpenClaw 会检查较旧的稳定版本，并改为安装最新的兼容版本。精确版本和显式 dist-tag 仍采用严格模式：不兼容的选择会失败，并要求你升级 OpenClaw 或选择兼容版本。

    如果裸安装规范与某个官方插件 ID 匹配（例如 `diffs`），OpenClaw 会直接安装目录条目。要安装同名 npm 软件包，请使用显式的作用域规范（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 可直接从 git 仓库安装。支持的形式：`git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://` 和 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>`，可在安装前检出分支、标签或提交。

    Git 安装会将仓库克隆到临时目录，在存在所请求引用时将其检出，然后使用常规插件目录安装程序，因此清单验证、操作员安装策略、软件包管理器安装工作和安装记录的行为与 npm 安装相同。记录的 git 安装包含源 URL/引用以及解析后的提交，以便 `openclaw plugins update` 稍后可以重新解析该源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证 Gateway 网关方法和 CLI 命令等运行时注册项。如果插件使用 `api.registerCli` 注册了 CLI 根命令，请直接通过 OpenClaw 根 CLI 运行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档文件">
    支持的归档文件：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档文件必须在解压后的插件根目录中包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档文件会在 OpenClaw 写入安装记录前被拒绝。

    当文件为 npm-pack tarball，并且你希望使用与注册表安装相同的
    逐插件托管 npm 项目路径时，请使用 `npm-pack:<path.tgz>`，
    其中包括 `package-lock.json` 验证、提升到顶层的依赖项扫描
    和 npm 安装记录。普通归档文件路径仍会作为本地
    归档文件安装到插件扩展根目录下。

    还支持从 Claude 市场安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，裸的 npm 安全插件规范默认从 npm 安装，除非它们与某个官方插件 ID 匹配：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明确指定仅从 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查声明的插件 API / 最低 Gateway 网关兼容性。当所选 ClawHub 版本发布了 ClawPack 工件时，OpenClaw 会下载带版本号的 npm-pack `.tgz`，验证 ClawHub 摘要标头和工件摘要，然后通过常规归档文件路径进行安装。没有 ClawPack 元数据的旧版 ClawHub 版本仍通过旧版软件包归档文件验证路径安装。记录的安装会保留其 ClawHub 源元数据、工件类型、npm 完整性值、npm shasum、tarball 名称和 ClawPack 摘要信息，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的记录规范，以便 `openclaw plugins update` 跟随较新的 ClawHub 版本；`clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta` 等显式版本或标签选择器仍会固定到该选择器。

### 市场简写

当 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中存在市场名称时，请使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

使用 `--marketplace` 可显式传递市场源：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="市场源">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市场名称
    - 本地市场根目录或 `marketplace.json` 路径
    - `owner/repo` 等 GitHub 仓库简写
    - `https://github.com/owner/repo` 等 GitHub 仓库 URL
    - git URL

  </Tab>
  <Tab title="远程市场规则">
    对于从 GitHub 或 git 加载的远程市场，插件条目必须位于克隆的市场仓库内。OpenClaw 接受该仓库中的相对路径源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件源。
  </Tab>
</Tabs>

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- 兼容 Codex 的包（`.codex-plugin/plugin.json`）
- 兼容 Claude 的包（`.claude-plugin/plugin.json`，或缺少该清单文件时使用默认 Claude 组件布局）
- 兼容 Cursor 的包（`.cursor-plugin/plugin.json`）

托管本地安装必须是插件目录或归档文件。独立的 `.js`、
`.mjs`、`.cjs` 和 `.ts` 插件文件不会由 `plugins install` 复制到托管插件
根目录中，直接放入
`~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 后也不会被加载；这些
自动发现根目录会加载插件软件包或包目录，并跳过
作为本地辅助文件的顶层脚本文件。请改为在
`plugins.load.paths` 中显式列出独立文件。

<Note>
兼容包会安装到常规插件根目录中，并参与相同的列表/信息/启用/禁用流程。目前支持包中的 Skills、Claude 命令型 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令型 Skills，以及兼容的 Codex 钩子目录；其他检测到的包能力会显示在诊断/信息中，但尚未接入运行时执行。
</Note>

使用 `-l`/`--link` 可指向本地插件目录而不复制该目录（添加
到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支持与 `--marketplace` 或 `git:` 安装配合使用，并且
要求本地路径已经存在。对于非交互式本地链接，
请在检查源后传入 `--force`；它会确认来源，但不会
复制或覆盖链接的目录。

<Note>
从工作区扩展根目录发现的工作区来源插件在
显式启用前不会被导入或执行。进行本地开发时，
请运行 `openclaw plugins enable <plugin-id>` 或设置
`plugins.entries.<plugin-id>.enabled: true`；如果你的配置使用
`plugins.allow`，也请在其中加入相同的插件 ID。此故障关闭规则
同样适用于渠道设置显式指定工作区来源插件进行
仅设置加载的情况，因此当该工作区插件仍处于禁用状态或被排除在允许列表之外时，
本地渠道插件设置代码不会运行。链接安装
和显式 `plugins.load.paths` 条目会针对其
解析后的插件来源遵循常规策略。请参阅
[配置插件策略](/zh-CN/tools/plugin#configure-plugin-policy)
和[配置参考](/zh-CN/gateway/configuration-reference#plugins)。

在 npm 安装中使用 `--pin`，可将解析后的精确规范（`name@version`）保存到托管插件索引中，同时保持默认行为不固定版本。
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
  从表格视图切换为逐插件详细信息行，其中包含格式/来源/源点/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的插件清单，以及注册表诊断信息和软件包依赖项安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；如果注册表缺失或无效，则使用仅根据清单派生的回退。它可用于检查插件是否已安装、已启用，并且对冷启动规划可见，但不能实时探测已在运行的 Gateway 网关进程。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，需要重启为该渠道提供服务的 Gateway 网关，才能让新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认重启的是实际的 `openclaw gateway run` 子进程，而不只是包装进程。

`plugins list --json` 包含每个插件在 `package.json`
`dependencies` 和 `optionalDependencies` 中的 `dependencyStatus`。OpenClaw 会检查这些软件包
名称是否存在于插件的常规 Node `node_modules` 查找路径中；它
不会导入插件运行时代码、运行包管理器或修复缺失的
依赖项。
</Note>

如果启动日志记录了 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
请运行 `openclaw plugins list --enabled --verbose` 或
`openclaw plugins inspect <id>` 并提供列出的插件 ID，以确认插件
ID，然后将可信 ID 复制到 `openclaw.json` 中的 `plugins.allow`。当
警告可以列出所有已发现的插件时，它会输出一段可直接粘贴的
`plugins.allow` 片段，其中已包含这些 ID。如果插件加载时
没有安装/加载路径来源信息，请检查该插件 ID，然后将
可信 ID 固定到 `plugins.allow`，或从可信来源重新安装插件，
以便 OpenClaw 记录安装来源。

在打包的 Docker 镜像中开发内置插件时，请将插件
源目录绑定挂载到对应的打包源路径上，例如
`/app/extensions/synology-chat`。OpenClaw 会先于 `/app/dist/extensions/synology-chat`
发现该挂载的源代码覆盖层；仅复制源目录
不会产生作用，因此常规打包安装仍会使用已编译的 dist。

对于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 显示模块加载检查过程中注册的钩子和诊断信息。运行时检查绝不会安装依赖项；请使用 `openclaw doctor --fix` 清理旧版依赖项状态，或恢复配置中引用但缺失的可下载插件。
- `openclaw gateway status --deep --require-rpc` 确认可访问的 Gateway 网关 URL/配置文件、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置的对话钩子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 插件索引

插件安装元数据是由机器管理的状态，而不是用户配置。安装和更新会将其写入当前 OpenClaw 状态目录下的共享 SQLite 状态数据库。`installed_plugin_index` 行存储持久的 `installRecords` 元数据，包括清单损坏或缺失的插件记录，以及由清单派生、供 `openclaw plugins update`、卸载、诊断和冷插件注册表使用的冷注册表缓存。

当 OpenClaw 在配置中发现已发布的旧版 `plugins.installs` 记录时，运行时读取会将其视为兼容性输入，而不会重写 `openclaw.json`。显式插件写入和 `openclaw doctor --fix` 会将这些记录移入插件索引，并在允许写入配置时删除该配置键；如果任一写入失败，则会保留配置记录，以免丢失安装元数据。

## 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目以及适用时关联的 `plugins.load.paths` 条目中删除插件记录。除非设置了 `--keep-files`，否则卸载还会删除已跟踪的托管安装目录，但仅限该目录解析后位于 OpenClaw 的插件扩展根目录内。如果插件当前占用 `memory` 或 `contextEngine` 槽位，该槽位会重置为默认值（记忆为 `memory-core`，上下文引擎为 `legacy`）。

`uninstall` 会输出将要删除内容的预览，然后在进行更改前提示 `Uninstall plugin "<id>"?`。传入 `--force` 可跳过确认提示（适用于脚本和非交互式运行）；如果未传入，卸载需要交互式 TTY。`--dry-run` 会输出相同的预览，然后退出，不进行提示或任何更改。

<Note>
`--keep-config` 是 `--keep-files` 的已弃用别名，目前仍受支持。
</Note>

## 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管插件索引中已跟踪的插件安装，以及 `hooks.internal.installs` 中已跟踪的钩子包安装。更新会复用用户安装插件时已经选择的来源，因此不需要再次确认来源。

<AccordionGroup>
  <Accordion title="解析插件 ID 与 npm 规范">
    传入插件 ID 时，OpenClaw 会复用为该插件记录的安装规范。这意味着之前存储的 dist-tag（例如 `@beta`）和精确固定版本仍会在后续 `update <id>` 运行中使用。

    在 `update <id> --dry-run` 期间，精确固定的 npm 安装会保持固定。如果 OpenClaw 还能解析该软件包的注册表默认发布线，并且该默认发布线比已安装的固定版本更新，试运行会报告该固定状态，并输出显式的 `@latest` 软件包更新命令，以跟随注册表默认发布线。

    此定向更新规则不同于批量 `openclaw plugins update --all` 维护路径。批量更新仍遵循常规的已跟踪安装规范，但可信的 OpenClaw 官方插件记录可以同步到当前官方目录目标，而不会停留在过时的精确官方软件包上。如果有意保持精确版本或带标签的官方规范不变，请使用定向 `update <id>`。

    对于 npm 安装，还可以传入带 dist-tag 或精确版本的显式 npm 软件包规范。OpenClaw 会将该软件包名称解析回已跟踪的插件记录，更新已安装的插件，并记录新的 npm 规范，供以后基于 ID 的更新使用。

    传入不含版本或标签的 npm 软件包名称，也会解析回已跟踪的插件记录。当插件已固定到某个精确版本，而你希望将其移回注册表默认发布线时，请使用此方式。

  </Accordion>
  <Accordion title="Beta 渠道更新">
    定向 `openclaw plugins update <id-or-npm-spec>` 会复用已跟踪的插件规范，除非传入新规范。批量 `openclaw plugins update --all` 在将可信官方插件记录同步到官方目录目标时，会使用已配置的 `update.channel`，因此 Beta 渠道安装可以继续使用 Beta 发布线，而不会被静默规范化为 stable/latest。

    `openclaw update` 也会识别当前 OpenClaw 更新渠道：在 Beta 渠道上，默认发布线的 npm 和 ClawHub 插件记录会先尝试 `@beta`。如果不存在插件 Beta 版本，则回退到已记录的 default/latest 规范；如果 Beta 软件包存在但未通过安装验证，npm 插件也会回退。该回退会以警告形式报告，不会导致核心更新失败。对于定向更新，精确版本和显式标签仍会固定到相应选择器。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装的软件包版本。如果已安装版本和已记录的工件标识都与解析出的目标匹配，则会跳过更新，不进行下载、重新安装或重写 `openclaw.json`。

    如果存在已存储的完整性哈希，而获取的工件哈希发生变化，OpenClaw 会将其视为 npm 工件漂移。交互式 `openclaw plugins update` 命令会输出预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助程序会默认拒绝继续，除非调用方提供显式的继续策略。

  </Accordion>
  <Accordion title="更新时使用 --dangerously-force-unsafe-install">
    为了兼容性，`plugins update` 仍接受 `--dangerously-force-unsafe-install`，但该选项已弃用，并且不再改变插件更新行为。操作员 `security.installPolicy` 仍可阻止更新；插件 `before_install` 钩子仅适用于已加载插件钩子的进程。
  </Accordion>
  <Accordion title="更新时使用 --acknowledge-clawhub-risk">
    由社区 ClawHub 支持的插件在更新时，会在下载替换软件包之前执行与安装相同的精确版本信任检查。对于已审核的自动化，如果所选 ClawHub 版本存在高风险信任警告但仍应继续，请使用 `--acknowledge-clawhub-risk`。ClawHub 官方软件包和 OpenClaw 内置插件来源会跳过此版本信任提示。
  </Accordion>
</AccordionGroup>

## 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

默认情况下，检查功能无需导入插件运行时，即可显示标识、加载状态、来源、清单能力、策略标志、诊断信息、安装元数据、包能力以及检测到的任何 MCP 或 LSP 服务器支持。JSON 输出包含插件清单契约，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，使操作员能够在启用或重启插件前审核可信表面声明。添加 `--runtime` 可加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖项；安装和修复仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 处理。

插件自有的 CLI 命令通常安装为根级 `openclaw` 命令组，但插件也可以在核心父命令（例如 `openclaw nodes`）下注册嵌套命令。在 `inspect --runtime` 显示 `cliCommands` 下的命令后，请在列出的路径运行该命令；例如，注册了 `demo-git` 的插件可以使用 `openclaw demo-git ping` 进行验证。

每个插件会根据其在运行时实际注册的内容进行分类：

| 形态               | 含义                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 恰好一种能力类型（例如仅提供商插件）         |
| `hybrid-capability` | 多于一种能力类型（例如文本 + 语音 + 图像）       |
| `hook-only`         | 只有钩子，没有能力、工具、命令、服务或路由 |
| `non-capability`    | 有工具/命令/服务，但没有能力                       |

有关能力模型的更多信息，请参阅[插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本处理和审计的机器可读报告。`inspect --all` 会呈现涵盖整个集群的表格，其中包含形态、能力种类、兼容性通知、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断、兼容性通知，以及缺少插件槽位等过期的插件配置引用。当安装树和插件配置均无问题时，它会输出 `No plugin issues detected.`。如果仍有过期配置，但安装树在其他方面运行正常，摘要会如实说明，而不会暗示插件完全正常。

如果已配置的插件存在于磁盘上，但被加载器的路径安全检查阻止，配置验证会保留该插件条目，并将其报告为 `present but blocked`。应修复此前的插件受阻诊断问题，例如路径所有权或全局可写权限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于缺少 `register`/`activate` 导出等模块结构故障，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含简洁的导出结构摘要。

## 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 持久化的冷读取模型，用于记录已安装插件的身份、启用状态、来源元数据和贡献归属。正常启动、提供商所有者查找、渠道设置分类和插件清单均可读取该注册表，而无须导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否为最新或是否已过期。使用 `--refresh` 根据持久化插件索引、配置策略以及清单/软件包元数据重建注册表。这是一条修复路径，而不是运行时激活路径。

`openclaw doctor --fix` 还会修复注册表相关的托管 npm 漂移：如果托管插件 npm 项目下或旧版扁平托管 npm 根目录中的孤立或已恢复 `@openclaw/*` 软件包遮蔽了内置插件，Doctor 会移除该过期软件包并重建注册表，使启动流程根据内置清单进行验证。Doctor 还会将主机的 `openclaw` 软件包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，以便更新或 npm 修复后，`openclaw/plugin-sdk/*` 等软件包本地运行时导入能够正常解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的应急兼容性开关，用于处理注册表读取失败。请优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退仅用于迁移逐步推出期间的紧急启动恢复。
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

`plugins marketplace entries` 会列出已配置 OpenClaw 市场源中的条目。默认情况下，它会尝试访问托管源，并在失败时回退到最新的已接受快照或内置数据。使用 `--feed-profile <name>` 读取指定的已配置配置文件，使用 `--feed-url <url>` 读取明确指定的托管源 URL，使用 `--offline` 在不获取源的情况下读取最新的已接受快照。

`plugins marketplace refresh` 会刷新已配置的托管源快照，并报告 OpenClaw 接受的是托管数据、托管快照还是内置回退数据。当调用方要求命令仅在全新的托管载荷与固定校验和匹配时才能成功，请使用 `--expected-sha256`。

市场 `list` 接受本地市场路径、`marketplace.json` 路径、`owner/repo` 等 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会输出解析后的来源标签，以及解析后的市场清单和插件条目。

市场刷新会加载托管的 OpenClaw 市场源，并将经过验证的响应持久化为本地托管源快照。如果不指定选项，则使用已配置的默认源配置文件。使用 `--feed-profile <name>` 刷新指定的已配置配置文件，使用 `--feed-url <url>` 刷新明确指定的托管源 URL，使用 `--expected-sha256 <sha256>` 要求载荷校验和匹配（`sha256:<hex>` 或不带前缀的 64 字符十六进制摘要），使用 `--json` 获取机器可读输出。明确指定的托管源 URL 不得包含凭据、查询字符串或片段。未固定校验和的刷新可以报告托管快照或内置回退结果，而不会使命令失败。固定校验和的刷新必须接受全新的托管载荷，否则会失败；如果 OpenClaw 无法持久化经过验证的快照，成功获取托管数据的刷新也会失败。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [ClawHub](/zh-CN/clawhub)
