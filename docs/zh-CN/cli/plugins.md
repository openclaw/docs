---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容捆绑包
    - 你想搭建或验证一个简单的工具插件
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-07-05T11:10:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a42d3fa6a60263f3fc2918cd34e6c1e3380b9ecae433a6ed340967c929de4c3c
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    面向最终用户的插件安装、启用和故障排查指南。
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
  <Card title="安全" href="/zh-CN/gateway/security">
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

若要调查缓慢的安装、检查、卸载或 registry 刷新，请在运行命令时设置 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。跟踪会将阶段耗时写入 stderr，并保持 JSON 输出可解析。参见[调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，`openclaw.json` 不可变。`install`、`update`、`uninstall`、`enable` 和 `disable` 都会拒绝运行。请改为编辑此安装的 Nix 源（nix-openclaw 使用 `programs.openclaw.config` 或 `instances.<name>.config`），然后重新构建。参见以 agent 为先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要 `plugins enable`。

原生 OpenClaw 插件随附 `openclaw.plugin.json`，其中包含内联 JSON Schema（`configSchema`，即使为空）。兼容包则使用自己的包清单。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细的 list/info 输出还会显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
</Note>

## 作者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 默认创建一个最小 TypeScript 工具插件。第一个参数是插件 id；`--name` 设置显示名称。OpenClaw 使用该 id 作为默认输出目录和包命名。工具脚手架使用 `defineToolPlugin`，并生成 `package.json` 脚本 `plugin:build` 和 `plugin:validate`，用于构建后调用 `openclaw plugins build`/`validate`。

`plugins build` 会导入构建后的入口，读取其静态工具元数据，写入 `openclaw.plugin.json`，并保持 `package.json` 的 `openclaw.extensions` 对齐。`plugins validate` 会检查生成的清单、包元数据和当前入口导出是否仍然一致。完整的创作工作流请参见[工具插件](/zh-CN/plugins/tool-plugins)。

脚手架会写入 TypeScript 源码，但会从构建后的 `./dist/index.js` 入口生成元数据，因此该工作流也适用于已发布的 CLI。当入口不是默认包入口时，使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在生成的元数据过期时失败而不重写文件。

### 提供商脚手架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供商脚手架会创建一个通用的 OpenAI 兼容模型提供商插件，其中包含 API key 凭证管道、运行 `clawhub package validate` 的 `npm run validate` 脚本、ClawHub 包元数据，以及一个用于未来通过 GitHub OIDC 进行可信发布的手动触发 GitHub Actions 工作流。提供商脚手架不会生成 skills，也不会使用 `openclaw plugins build`/`validate`；这些命令用于工具脚手架的生成元数据路径。

发布前，请将占位 API base URL、模型目录、文档路由、凭据文本和 README 文案替换为真实提供商详情。使用生成的 README 完成首次 ClawHub 发布和可信发布者设置。

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

测试设置阶段安装的维护者可以使用受保护的环境变量覆盖自动插件安装来源。参见[插件安装覆盖](/zh-CN/plugins/install-overrides)。

<Warning>
在发布切换期间，裸包名默认从 npm 安装，除非它们匹配某个内置或官方插件 id；在这种情况下，OpenClaw 会使用该本地/官方副本，而不是访问 npm registry。当你明确想要外部 npm 包时，请使用 `npm:<package>`。ClawHub 使用 `clawhub:<package>`。像运行代码一样对待插件安装；优先使用固定版本。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的 `code-plugin` 和 `bundle-plugin` 包（不是 skills；skills 请使用 `openclaw skills search`）。默认 `--limit` 为 20，最高 100。它只读取远程目录：不会检查本地状态、修改配置、安装包或加载插件运行时。结果包含 ClawHub 包名、系列、频道、版本、摘要，以及类似 `openclaw plugins install clawhub:<package>` 的安装提示。

<Note>
ClawHub 是大多数插件的主要分发和发现界面。Npm 仍然是受支持的后备和直接安装路径。OpenClaw 拥有的 `@openclaw/*` 插件包已重新发布到 npm；请在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[插件清单](/zh-CN/plugins/plugin-inventory)查看当前列表。稳定安装使用 `latest`。Beta 频道安装和更新在可用时优先使用 npm `beta` dist-tag，否则回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="配置 include 和无效配置修复">
    如果你的 `plugins` 部分由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该 include 文件，并保持 `openclaw.json` 不变。根 include、include 数组以及带有同级覆盖的 include 会失败关闭，而不是展平。支持的形状请参见[配置 include](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会失败关闭，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动和热重载期间，无效插件配置会像任何其他无效配置一样失败关闭；`openclaw doctor --fix` 可以隔离无效插件条目。唯一有文档说明的安装时例外，是针对明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的狭窄内置插件恢复路径。

  </Accordion>
  <Accordion title="--force 以及重新安装与更新">
    `--force` 会复用现有安装目标，并就地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 构件重新安装同一 id 时使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并引导你使用 `plugins update <id-or-npm-spec>` 进行正常升级；如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。`--force` 不支持与 `--link` 同用。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装，并记录解析出的精确 `<name>@<version>`。它不支持 `git:` 安装（请改为在 spec 中固定 ref，例如 `git:github.com/acme/plugin@v1.2.3`），也不支持 `--marketplace`（marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已弃用，现在是 no-op。OpenClaw 不再为插件安装运行内置安装时危险代码阻止。

    当需要主机特定安装策略时，请使用操作员拥有的 `security.installPolicy` 界面。插件 `before_install` 钩子是插件运行时生命周期钩子，不是 CLI 安装的主要策略边界。

    如果你在 ClawHub 上发布的插件被 registry 扫描隐藏或阻止，请使用 [ClawHub 发布](/zh-CN/clawhub/publishing)中的发布者步骤。`--dangerously-force-unsafe-install` 不会要求 ClawHub 重新扫描插件，也不会将被阻止的发布设为公开。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社区 ClawHub 安装会在下载前检查所选发布的信任记录。如果 ClawHub 禁用该发布的下载、报告恶意扫描发现，或将该发布置于阻止性的审核状态（已隔离、已撤销），OpenClaw 都会无条件拒绝它，不受此标志影响。对于非阻止性的高风险扫描状态或审核状态，OpenClaw 会显示信任详情，并要求确认后再继续。

    仅在查看 ClawHub 警告并决定不通过交互提示继续后，才使用 `--acknowledge-clawhub-risk`。待处理或过期（尚未清理）的扫描结果会发出警告，但不要求确认。官方 ClawHub 包和内置 OpenClaw 插件源会完全绕过此发布信任检查。

  </Accordion>
  <Accordion title="钩子包和 npm spec">
    `plugins install` 也是安装在 `package.json` 中暴露 `openclaw.hooks` 的钩子包的界面。使用 `openclaw hooks` 查看过滤后的钩子可见性和按钩子启用状态，而不是用于包安装。

    Npm 规范是**仅限注册表**（包名加可选的**精确版本**或 **dist-tag**）。Git/URL/file 规范和 semver 范围会被拒绝。依赖安装会在每个插件一个受管 npm 项目中运行，并出于安全考虑使用 `--ignore-scripts`，即使你的 shell 有全局 npm 安装设置也是如此。受管插件 npm 项目会继承 OpenClaw 包级 npm `overrides`，因此宿主安全固定也适用于提升的插件依赖。

    使用 `npm:<package>` 让 npm 解析显式化。在发布切换期间，裸包规范也会直接从 npm 安装，除非它们匹配官方插件 ID。

    匹配内置插件的原始 `@openclaw/*` 规范会先解析到镜像拥有的内置副本，然后才回退到 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 会使用当前 OpenClaw 构建中的内置 Discord 插件，而不是创建受管 npm override。要强制使用外部 npm 包，请使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸规范和 `@latest` 会保持在稳定轨道上。OpenClaw 的日期戳修正版，例如 `2026.5.3-1`，在此检查中也算作稳定版。如果 npm 将任一形式解析为预发布版本，OpenClaw 会停止并要求你用预发布标签（`@beta`/`@rc`）或精确预发布版本（`@1.2.3-beta.4`）显式选择加入。

    对于没有精确版本的 npm 安装（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 会在安装前检查解析出的包元数据。如果最新稳定包需要更新的 OpenClaw 插件 API 或最低宿主版本，OpenClaw 会检查较旧的稳定版本，并改为安装最新的兼容版本。精确版本和显式 dist-tag 保持严格：不兼容的选择会失败，并要求你升级 OpenClaw 或选择兼容版本。

    如果裸安装规范匹配官方插件 ID（例如 `diffs`），OpenClaw 会直接安装目录条目。要安装同名 npm 包，请使用显式 scoped 规范（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 直接从 git 仓库安装。支持的形式：`git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>` 可在安装前检出分支、标签或提交。

    Git 安装会克隆到临时目录，在存在请求的 ref 时检出该 ref，然后使用常规插件目录安装器，因此清单验证、操作员安装策略、包管理器安装工作以及安装记录的行为都与 npm 安装一致。记录的 git 安装包含源 URL/ref 和解析出的提交，因此 `openclaw plugins update` 之后可以重新解析该来源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册，例如 gateway 方法和 CLI 命令。如果插件使用 `api.registerCli` 注册了 CLI 根命令，请通过 OpenClaw 根 CLI 直接运行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档会在 OpenClaw 写入安装记录前被拒绝。

    当文件是 npm-pack tarball，并且你想使用与注册表安装相同的按插件受管 npm 项目路径时，请使用 `npm-pack:<path.tgz>`，包括 `package-lock.json` 验证、提升依赖扫描和 npm 安装记录。普通归档路径仍会作为本地归档安装到插件 extensions 根目录下。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，裸 npm 安全插件规范默认从 npm 安装，除非它们匹配官方插件 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 让仅 npm 解析显式化：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查公布的插件 API / 最低 Gateway 网关兼容性。当选定的 ClawHub 版本发布 ClawPack 构件时，OpenClaw 会下载带版本的 npm-pack `.tgz`，验证 ClawHub 摘要标头和构件摘要，然后通过常规归档路径安装它。没有 ClawPack 元数据的较旧 ClawHub 版本仍会通过旧版包归档验证路径安装。记录的安装会保留其 ClawHub 来源元数据、构件类型、npm integrity、npm shasum、tarball 名称以及 ClawPack 摘要事实，以供后续更新使用。
未指定版本的 ClawHub 安装会保留未指定版本的记录规范，因此 `openclaw plugins update` 可以跟随更新的 ClawHub 发布；显式版本或标签选择器，例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`，会保持固定到该选择器。

### Marketplace 简写

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

使用 `--marketplace` 显式传入 marketplace 来源：

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
    对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json`，或在该清单文件不存在时使用默认 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

受管本地安装必须是插件目录或归档。独立的 `.js`、`.mjs`、`.cjs` 和 `.ts` 插件文件不会被 `plugins install` 复制到受管插件根目录，也不会因直接放入 `~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 而加载；这些自动发现的根会加载插件包或 bundle 目录，并跳过顶层脚本文件，将其视为本地辅助文件。请改为在 `plugins.load.paths` 中显式列出独立文件。

<Note>
兼容包会安装到常规插件根目录，并参与相同的 list/info/enable/disable 流程。目前支持 bundle skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录；其他检测到的 bundle 能力会显示在 diagnostics/info 中，但尚未接入运行时执行。
</Note>

使用 `-l`/`--link` 指向本地插件目录而不复制它（添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支持与 `--force`（链接插件直接指向源路径，因此没有可原地覆盖的内容）、`--marketplace` 或 `git:` 安装一起使用，并且它要求本地路径已经存在。

<Note>
从工作区 extensions 根目录发现的工作区来源插件，在显式启用前不会被导入或执行。对于本地开发，运行 `openclaw plugins enable <plugin-id>` 或设置 `plugins.entries.<plugin-id>.enabled: true`；如果你的配置使用 `plugins.allow`，也要在那里包含相同的插件 ID。即使频道设置显式针对工作区来源插件进行仅设置加载，这条默认关闭规则也同样适用，因此当该工作区插件仍被禁用或被排除在 allowlist 之外时，本地频道插件设置代码不会运行。链接安装和显式 `plugins.load.paths` 条目会遵循其解析后插件来源的常规策略。请参阅
[配置插件策略](/zh-CN/tools/plugin#configure-plugin-policy)
和[配置参考](/zh-CN/gateway/configuration-reference#plugins)。

在 npm 安装上使用 `--pin`，可在受管插件索引中保存解析出的精确规范（`name@version`），同时保持默认行为为未固定。
</Note>

## 列出

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
  从表格视图切换为每个插件的详情行，包含 format/source/origin/version/activation 元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读清单，加上注册表诊断和包依赖安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件注册表；当注册表缺失或无效时，会回退到仅由清单派生的结果。它适合用于检查插件是否已安装、已启用，并且对冷启动规划可见，但它不是对已经运行的 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、hook 策略或 `plugins.load.paths` 后，请重启为频道提供服务的 Gateway 网关，再期待新的 `register(api)` 代码或 hook 运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不仅是包装进程。

`plugins list --json` 包含每个插件来自 `package.json` `dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 会检查这些包名是否存在于插件常规 Node `node_modules` 查找路径中；它不会导入插件运行时代码、运行包管理器或修复缺失的依赖。
</Note>

如果启动日志显示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，请运行 `openclaw plugins list --enabled --verbose` 或对列出的插件 ID 运行 `openclaw plugins inspect <id>`，以确认插件 ID，并将可信 ID 复制到 `openclaw.json` 中的 `plugins.allow`。当警告可以列出每个已发现插件时，它会打印一个可直接粘贴的 `plugins.allow` 片段，其中已经包含这些 ID。如果某个插件在没有安装/加载路径来源信息的情况下加载，请检查该插件 ID，然后要么在 `plugins.allow` 中固定可信 ID，要么从可信来源重新安装该插件，让 OpenClaw 记录安装来源。

对于打包 Docker 镜像内的内置插件工作，请将插件源目录 bind mount 到匹配的打包源路径上，例如 `/app/extensions/synology-chat`。OpenClaw 会先于 `/app/dist/extensions/synology-chat` 发现该挂载的源覆盖层；普通复制的源目录仍然不会生效，因此常规打包安装仍会使用编译后的 dist。

对于运行时 hook 调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示来自模块加载检查流程的已注册钩子和诊断信息。运行时检查绝不会安装依赖；请使用 `openclaw doctor --fix` 清理旧版依赖状态，或恢复配置中引用的缺失可下载插件。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关 URL/profile、服务/进程提示、配置路径以及 RPC 健康状态。
- 非内置对话钩子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 插件索引

插件安装元数据是由机器管理的状态，不是用户配置。安装和更新会把它写入活动 OpenClaw 状态目录下的共享 SQLite 状态数据库。`installed_plugin_index` 行存储持久的 `installRecords` 元数据，包括损坏或缺失插件清单的记录，以及由清单派生的冷注册表缓存，供 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，运行时读取会把它们作为兼容性输入处理，但不会重写 `openclaw.json`。显式插件写入和 `openclaw doctor --fix` 会把这些记录移动到插件索引中，并在允许写入配置时移除该配置键；如果任一写入失败，配置记录会被保留，以免安装元数据丢失。

## 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 会从 `plugins.entries`、持久化插件索引、插件允许/拒绝列表条目以及适用时关联的 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，卸载还会移除受跟踪的托管安装目录，但仅当它解析到 OpenClaw 的插件扩展根目录内部时才会这样做。如果该插件当前拥有 `memory` 或 `contextEngine` 槽位，该槽位会重置为默认值（memory 为 `memory-core`，context engine 为 `legacy`）。

`uninstall` 会打印将被移除内容的预览，然后在更改前提示 `Uninstall plugin "<id>"?`。传入 `--force` 可跳过确认提示（适用于脚本和非交互式运行）；如果不传入，卸载需要交互式 TTY。`--dry-run` 会打印相同预览并退出，不提示也不更改任何内容。

<Note>
`--keep-config` 作为 `--keep-files` 的弃用别名受支持。
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

更新会应用于托管插件索引中受跟踪的插件安装，以及 `hooks.internal.installs` 中受跟踪的 hook-pack 安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm spec">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装 spec。这意味着之前存储的 dist-tag（例如 `@beta`）和精确固定版本会在后续 `update <id>` 运行中继续使用。

    在 `update <id> --dry-run` 期间，精确固定的 npm 安装会保持固定。如果 OpenClaw 也能解析该包的注册表默认线，并且该默认线比已安装的固定版本更新，dry run 会报告该固定版本，并打印显式的 `@latest` 包更新命令，以跟随注册表默认线。

    该定向更新规则不同于批量 `openclaw plugins update --all` 维护路径。批量更新仍会遵循普通的受跟踪安装 spec，但受信任的官方 OpenClaw 插件记录可以同步到当前官方目录目标，而不是停留在过时的精确官方包上。当你有意保持精确或带标签的官方 spec 不变时，请使用定向 `update <id>`。

    对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会把该包名解析回受跟踪的插件记录，更新该已安装插件，并记录新的 npm spec，供未来基于 id 的更新使用。

    传入不带版本或标签的 npm 包名也会解析回受跟踪的插件记录。当插件被固定到精确版本，而你想把它移回注册表默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="Beta 频道更新">
    定向 `openclaw plugins update <id-or-npm-spec>` 会复用受跟踪的插件 spec，除非你传入新的 spec。批量 `openclaw plugins update --all` 在把受信任的官方插件记录同步到官方目录目标时，会使用配置的 `update.channel`，因此 beta 频道安装可以停留在 beta 发布线，而不会被静默规范化为 stable/latest。

    `openclaw update` 也知道活动的 OpenClaw 更新频道：在 beta 频道上，默认线 npm 和 ClawHub 插件记录会先尝试 `@beta`。如果不存在插件 beta 版本，它们会回退到记录的 default/latest spec；如果 beta 包存在但安装验证失败，npm 插件也会回退。该回退会作为警告报告，并且不会导致核心更新失败。精确版本和显式标签在定向更新中会保持固定到该选择器。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前，OpenClaw 会根据 npm 注册表元数据检查已安装的包版本。如果已安装版本和记录的构件标识已经匹配解析后的目标，更新会被跳过，不下载、不重新安装，也不重写 `openclaw.json`。

    当存在已存储的完整性哈希且获取到的构件哈希发生变化时，OpenClaw 会将其视为 npm 构件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新助手会失败关闭，除非调用方提供显式的继续策略。

  </Accordion>
  <Accordion title="更新中的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也会在 `plugins update` 上被接受以保持兼容，但它已弃用，并且不再改变插件更新行为。操作员 `security.installPolicy` 仍可阻止更新；插件 `before_install` 钩子只会在已加载插件钩子的进程中应用。
  </Accordion>
  <Accordion title="更新中的 --acknowledge-clawhub-risk">
    由社区 ClawHub 支持的插件更新在下载替换包之前，会运行与安装相同的精确发布信任检查。对于已审查的自动化，如果所选 ClawHub 发布存在有风险的信任警告但仍应继续，请使用 `--acknowledge-clawhub-risk`。官方 ClawHub 包和内置 OpenClaw 插件源会绕过此发布信任提示。
  </Accordion>
</AccordionGroup>

## 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

默认情况下，Inspect 会显示身份、加载状态、来源、清单能力、策略标志、诊断信息、安装元数据、包能力，以及任何检测到的 MCP 或 LSP 服务器支持，而不会导入插件运行时。JSON 输出包含插件清单合约，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，因此操作员可以在启用或重启插件前审计受信任表面声明。添加 `--runtime` 可加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖；安装和修复仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 处理。

插件拥有的 CLI 命令通常会作为根级 `openclaw` 命令组安装，但插件也可以在核心父命令下注册嵌套命令，例如 `openclaw nodes`。在 `inspect --runtime` 显示 `cliCommands` 下的命令后，请在列出的路径运行它；例如，注册了 `demo-git` 的插件可通过 `openclaw demo-git ping` 验证。

每个插件都会按其在运行时实际注册的内容分类：

| 形态                | 含义                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 正好一种能力类型（例如仅提供商插件）                              |
| `hybrid-capability` | 多于一种能力类型（例如文本 + 语音 + 图像）                         |
| `hook-only`         | 只有钩子，没有能力、工具、命令、服务或路由                         |
| `non-capability`    | 有工具/命令/服务，但没有能力                                      |

有关能力模型的更多信息，请参阅 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会渲染覆盖整个插件集的表格，其中包含形态、能力种类、兼容性通知、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/设备发现诊断、兼容性通知，以及缺失插件槽位等过时插件配置引用。当安装树和插件配置都干净时，它会打印 `No plugin issues detected.` 如果仍存在过时配置，但安装树在其他方面健康，摘要会说明这一点，而不是暗示插件完全健康。

如果已配置插件存在于磁盘上，但被加载器的路径安全检查阻止，配置验证会保留插件条目并将其报告为 `present but blocked`。请修复前面的已阻止插件诊断，例如路径所有权或 world-writable 权限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于缺失 `register`/`activate` 导出等模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含紧凑的导出形态摘要。

## 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 为已安装插件身份、启用状态、来源元数据和贡献所有权持久化的冷读取模型。正常启动、提供商所有者查找、渠道设置分类和插件清单都可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否当前有效或是否过时。使用 `--refresh` 可从持久化插件索引、配置策略和清单/包元数据重建它。这是修复路径，不是运行时激活路径。

`openclaw doctor --fix` 还会修复注册表相邻的托管 npm 漂移：如果托管插件 npm 项目下的孤立或恢复的 `@openclaw/*` 包，或旧版扁平托管 npm 根目录，遮蔽了内置插件，doctor 会移除该过时包并重建注册表，使启动针对内置清单进行验证。Doctor 还会把宿主 `openclaw` 包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，因此包本地运行时导入（例如 `openclaw/plugin-sdk/*`）可在更新或 npm 修复后解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的破窗兼容性开关，用于注册表读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退仅用于迁移推出期间的紧急启动恢复。
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

`plugins marketplace entries` 会列出已配置的 OpenClaw 市场源中的条目。默认情况下，它会尝试使用托管源，并回退到最新已接受的快照或内置数据。使用 `--feed-profile <name>` 读取特定的已配置配置档，使用 `--feed-url <url>` 读取显式的托管源 URL，并使用 `--offline` 在不获取源的情况下读取最新已接受的快照。

`plugins marketplace refresh` 会刷新已配置的托管源快照，并报告 OpenClaw 接受的是托管数据、托管快照，还是内置回退数据。当调用方需要命令在新托管载荷不匹配固定校验和时失败，请使用 `--expected-sha256`。

市场 `list` 接受本地市场路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的来源标签，以及解析后的市场清单和插件条目。

市场刷新会加载托管的 OpenClaw 市场源，并将已验证的响应持久化为本地托管源快照。未指定选项时，它会使用已配置的默认源配置档。使用 `--feed-profile <name>` 刷新特定的已配置配置档，使用 `--feed-url <url>` 刷新显式的托管源 URL，使用 `--expected-sha256 <sha256>` 要求载荷校验和匹配（`sha256:<hex>` 或裸的 64 字符十六进制摘要），并使用 `--json` 获取机器可读输出。显式的托管源 URL 不得包含凭据、查询字符串或片段。未固定的刷新可以报告托管快照或内置回退结果，而不会使命令失败。固定的刷新必须接受新的托管载荷，否则会失败；如果 OpenClaw 无法持久化已验证的快照，成功的托管刷新也会失败。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [ClawHub](/clawhub)
