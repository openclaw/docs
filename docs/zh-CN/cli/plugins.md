---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容捆绑包
    - 你想要为一个简单的工具插件生成脚手架或进行验证
    - 你想调试插件加载失败
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 参考（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-06-28T22:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway 网关插件、钩子包和兼容捆绑包。

<CardGroup cols={2}>
  <Card title="插件系统" href="/zh-CN/tools/plugin">
    面向最终用户的插件安装、启用和故障排除指南。
  </Card>
  <Card title="管理插件" href="/zh-CN/plugins/manage-plugins">
    安装、列出、更新、卸载和发布的快速示例。
  </Card>
  <Card title="插件捆绑包" href="/zh-CN/plugins/bundles">
    捆绑包兼容性模型。
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

对于安装、检查、卸载或注册表刷新较慢的调查，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行命令。跟踪会将阶段耗时写入 stderr，并保持 JSON 输出可解析。参见 [调试](/zh-CN/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，插件生命周期变更命令会被禁用。对此安装请使用 Nix 源，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；对于 nix-openclaw，请使用 agent-first [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
内置插件随 OpenClaw 一起发布。有些默认启用（例如内置模型提供商、内置语音提供商和内置浏览器插件）；其他插件需要 `plugins enable`。

原生 OpenClaw 插件必须随附包含内联 JSON Schema 的 `openclaw.plugin.json`（`configSchema`，即使为空）。兼容捆绑包则使用自己的捆绑包清单。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细 list/info 输出还会显示捆绑包子类型（`codex`、`claude` 或 `cursor`）以及检测到的捆绑包能力。
</Note>

### 作者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 默认创建一个最小 TypeScript 工具插件。第一个参数是插件 id；传入 `--name` 可设置显示名称。OpenClaw 使用该 id 作为默认输出目录和包命名。工具脚手架使用 `defineToolPlugin`。
`plugins build` 会导入已构建的入口、读取其静态工具元数据、写入 `openclaw.plugin.json`，并保持 `package.json` 的 `openclaw.extensions` 对齐。
`plugins validate` 会检查生成的清单、包元数据和当前入口导出是否仍然一致。完整的工具创作工作流请参见 [工具插件](/zh-CN/plugins/tool-plugins)。

脚手架会写入 TypeScript 源码，但会从已构建的 `./dist/index.js` 入口生成元数据，因此该工作流也适用于已发布的 CLI。当入口不是默认包入口时，请使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在生成的元数据过期时失败且不重写文件。

### 提供商脚手架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供商脚手架会创建一个通用文本/模型提供商插件，包含 OpenAI 兼容的 API 密钥接线、用于 `clawhub package validate` 的内置 `npm run validate` 脚本、ClawHub 包元数据，以及一个可手动触发、用于未来通过 GitHub Actions OIDC 进行可信发布的 GitHub 工作流。提供商脚手架不会生成 Skills，也不使用 `openclaw plugins build` 或 `openclaw plugins validate`；这些命令用于工具脚手架的生成元数据路径。

发布前，请将占位 API 基础 URL、模型目录、文档路由、凭据文本和 README 文案替换为真实的提供商详细信息。使用生成的 README 进行首次 ClawHub 发布和可信发布者设置。

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

维护者测试设置时安装流程时，可以使用受保护的环境变量覆盖自动插件安装来源。参见 [插件安装覆盖](/zh-CN/plugins/install-overrides)。

<Warning>
在发布切换期间，裸包名默认从 npm 安装，除非它们匹配官方插件 id。匹配内置插件的原始 `@openclaw/*` 包规范会使用当前 OpenClaw 构建随附的内置副本。当你明确想要外部 npm 包时，请使用 `npm:<package>`。ClawHub 请使用 `clawhub:<package>`。请像运行代码一样对待插件安装。优先使用固定版本。
</Warning>

`plugins search` 会查询 ClawHub 中可安装的插件包，并打印可直接安装的包名。它搜索代码插件和捆绑包插件，而不是 Skills。ClawHub Skills 请使用 `openclaw skills search`。

<Note>
ClawHub 是大多数插件的主要分发和发现入口。Npm 仍然是受支持的回退和直接安装路径。OpenClaw 拥有的 `@openclaw/*` 插件包已重新发布到 npm；请在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或 [插件清单](/zh-CN/plugins/plugin-inventory) 查看当前列表。稳定安装使用 `latest`。Beta 频道安装和更新会在 npm `beta` dist-tag 可用时优先使用它，然后回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="配置包含和无效配置修复">
    如果你的 `plugins` 部分由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该被包含的文件，并保持 `openclaw.json` 不变。根包含、包含数组以及带同级覆盖的包含会失败关闭，而不是被展平。支持的形状请参见 [配置包含](/zh-CN/gateway/configuration)。

    如果安装期间配置无效，`plugins install` 通常会失败关闭，并提示你先运行 `openclaw doctor --fix`。在 Gateway 网关启动和热重载期间，无效插件配置会像任何其他无效配置一样失败关闭；`openclaw doctor --fix` 可以隔离无效插件条目。唯一有文档说明的安装时例外，是一个狭窄的内置插件恢复路径，适用于明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

  </Accordion>
  <Accordion title="--force 和重新安装与更新">
    `--force` 会复用现有安装目标，并原地覆盖已安装的插件或钩子包。当你有意从新的本地路径、归档、ClawHub 包或 npm 构件重新安装同一 id 时使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你对已安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并指向 `plugins update <id-or-npm-spec>` 以进行正常升级，或在你确实想从不同来源覆盖当前安装时指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。它不支持 `git:` 安装；当你需要固定来源时，请使用显式 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支持 `--marketplace`，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 规范。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已弃用，现在不执行任何操作。OpenClaw 不再为插件安装运行内置的安装时危险代码阻断。

    当需要特定主机的安装策略时，请使用共享的、由操作员拥有的 `security.installPolicy` 表面。插件 `before_install` 钩子是插件运行时生命周期钩子，并不是 CLI 安装的主要策略边界。

    如果你在 ClawHub 上发布的插件被注册表扫描隐藏或阻止，请使用 [ClawHub 发布](/zh-CN/clawhub/publishing) 中的发布者步骤。`--dangerously-force-unsafe-install` 不会要求 ClawHub 重新扫描插件，也不会让被阻止的发布版本公开。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社区 ClawHub 安装会在下载包之前检查所选发布版本的信任记录。如果 ClawHub 禁用该发布版本的下载、报告恶意扫描发现，或将该发布版本置于隔离等阻断性审核状态，OpenClaw 会拒绝该发布版本。对于非阻断性的风险扫描状态、风险审核状态或注册表原因，OpenClaw 会显示信任详情，并在继续前请求确认。

    仅在查看 ClawHub 警告并决定在没有交互式提示的情况下继续后，才使用 `--acknowledge-clawhub-risk`。待处理或过期的干净信任记录会发出警告，但不要求确认。官方 ClawHub 包和内置 OpenClaw 插件来源会绕过此发布信任提示。

  </Accordion>
  <Accordion title="钩子包和 npm 规范">
    `plugins install` 也是安装钩子包的入口，这些钩子包在 `package.json` 中暴露 `openclaw.hooks`。请使用 `openclaw hooks` 查看筛选后的钩子可见性和按钩子启用，而不是用于包安装。

    Npm 规格是**仅限 registry**（软件包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file 规格和 semver 范围会被拒绝。为安全起见，依赖安装会在每个插件的一个托管 npm 项目中使用 `--ignore-scripts` 运行，即使你的 shell 设置了全局 npm install 设置也是如此。托管插件 npm 项目会继承 OpenClaw 软件包级 npm `overrides`，因此主机安全 pin 也会应用到提升安装的插件依赖。

    当你想明确使用 npm 解析时，请使用 `npm:<package>`。在发布切换期间，裸包规格也会直接从 npm 安装，除非它们匹配官方插件 id。

    匹配内置插件的原始 `@openclaw/*` 软件包规格会先解析到镜像拥有的内置副本，然后才回退到 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 会使用当前 OpenClaw 构建中的内置 Discord 插件，而不是创建托管 npm override。若要强制使用外部 npm 软件包，请使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸规格和 `@latest` 会留在稳定轨道。OpenClaw 带日期戳的修正版本（例如 `2026.5.3-1`）在此检查中属于稳定版本。如果 npm 将其中任一项解析为预发布版本，OpenClaw 会停止并要求你使用预发布标签（例如 `@beta`/`@rc`）或精确预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

    对于没有精确版本的 npm 安装（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 会在安装前检查解析得到的软件包元数据。如果最新稳定软件包要求更新的 OpenClaw 插件 API 或最低主机版本，OpenClaw 会检查较旧的稳定版本，并改为安装最新的兼容版本。精确版本和显式 dist-tag（例如 `@beta`）保持严格：如果所选软件包不兼容，命令会失败，并要求你升级 OpenClaw 或选择兼容版本。

    如果裸安装规格匹配官方插件 id（例如 `diffs`），OpenClaw 会直接安装目录条目。若要安装同名 npm 软件包，请使用显式带 scope 的规格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 直接从 git 仓库安装。支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://` 和 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>` 可在安装前检出分支、标签或提交。

    Git 安装会克隆到临时目录，在存在请求的 ref 时检出该 ref，然后使用常规插件目录安装器。这意味着清单验证、操作员安装策略、包管理器安装工作和安装记录的行为都类似 npm 安装。记录的 git 安装包含源 URL/ref 以及解析后的提交，因此 `openclaw plugins update` 之后可以重新解析该源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册，例如 Gateway 网关方法和 CLI 命令。如果插件使用 `api.registerCli` 注册了 CLI 根命令，请直接通过 OpenClaw 根 CLI 执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档文件">
    支持的归档文件：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件归档文件必须在解压后的插件根目录包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的归档文件会在 OpenClaw 写入安装记录前被拒绝。

    当文件是 npm-pack tarball，并且你想测试与 registry 安装相同的每插件托管 npm 项目路径时，请使用 `npm-pack:<path.tgz>`，包括 `package-lock.json` 验证、提升安装的依赖扫描和 npm 安装记录。普通归档路径仍会作为本地归档安装到插件 extensions 根目录下。

    也支持 Claude 市场安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在发布切换期间，裸 npm 安全插件规格默认从 npm 安装，除非它们匹配官方插件 id：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明确仅使用 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 会在安装前检查声明的插件 API / 最低 Gateway 网关兼容性。当所选 ClawHub 版本发布 ClawPack 构件时，OpenClaw 会下载带版本的 npm-pack `.tgz`，验证 ClawHub 摘要标头和构件摘要，然后通过常规归档路径安装。没有 ClawPack 元数据的较旧 ClawHub 版本仍会通过旧版软件包归档验证路径安装。记录的安装会保留其 ClawHub 源元数据、构件类型、npm integrity、npm shasum、tarball 名称和 ClawPack 摘要信息，以供后续更新使用。
未带版本的 ClawHub 安装会保留未带版本的记录规格，因此 `openclaw plugins update` 可以跟随后续的 ClawHub 版本；显式版本或标签选择器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）仍会 pin 到该选择器。

#### 市场简写

当市场名称存在于 Claude 的本地 registry 缓存 `~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传入市场源时，请使用 `--marketplace`：

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
    - GitHub 仓库简写，例如 `owner/repo`
    - GitHub 仓库 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="远程市场规则">
    对于从 GitHub 或 git 加载的远程市场，插件条目必须保持在克隆的市场仓库内。OpenClaw 接受来自该仓库的相对路径源，并拒绝来自远程清单的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件源。
  </Tab>
</Tabs>

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

托管本地安装必须是插件目录或归档文件。独立的 `.js`、`.mjs`、`.cjs` 和 `.ts` 插件文件不会被 `plugins install` 复制到托管插件根目录；请改为在 `plugins.load.paths` 中显式列出它们。

<Note>
兼容包会安装到常规插件根目录，并参与相同的 list/info/enable/disable 流程。目前支持包 Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skills，以及兼容的 Codex 钩子目录；其他检测到的包能力会显示在 diagnostics/info 中，但尚未接入运行时执行。
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
  从表格视图切换到每个插件的详情行，其中包含源/来源/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的清单，加上 registry 诊断和软件包依赖安装状态。
</ParamField>

<Note>
`plugins list` 会先读取持久化的本地插件 registry；当 registry 缺失或无效时，会使用仅由清单派生的回退。它适合检查插件是否已安装、已启用，并且对冷启动规划可见，但它不是对已经运行的 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、钩子策略或 `plugins.load.paths` 后，请重启服务于该渠道的 Gateway 网关，然后再期待新的 `register(api)` 代码或钩子运行。对于远程/容器部署，请确认你重启的是实际的 `openclaw gateway run` 子进程，而不仅仅是包装进程。

`plugins list --json` 会包含每个插件来自 `package.json` `dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 会检查这些软件包名称是否存在于插件的常规 Node `node_modules` 查找路径上；它不会导入插件运行时代码、运行包管理器或修复缺失依赖。
</Note>

如果启动日志显示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，请运行 `openclaw plugins list --enabled --verbose`，或使用列出的插件 id 运行 `openclaw plugins inspect <id>`，以确认插件 id，并将可信 id 复制到 `openclaw.json` 中的 `plugins.allow`。当警告可以列出每个已发现插件时，它会打印一段可直接粘贴的 `plugins.allow` 片段，其中已包含这些 id。如果插件在没有安装/加载路径来源的情况下加载，请检查该插件 id，然后要么将可信 id pin 到 `plugins.allow`，要么从可信来源重新安装该插件，让 OpenClaw 记录安装来源。

`plugins search` 是远程 ClawHub 目录查找。它不会检查本地状态、修改配置、安装软件包或加载插件运行时代码。搜索结果包含 ClawHub 软件包名称、系列、渠道、版本、摘要，以及安装提示，例如 `openclaw plugins install clawhub:<package>`。

对于打包 Docker 镜像内的内置插件工作，请将插件源目录 bind-mount 到匹配的打包源路径上，例如 `/app/extensions/synology-chat`。OpenClaw 会先发现该挂载的源覆盖层，然后才是 `/app/dist/extensions/synology-chat`；普通复制的源目录仍然不会生效，因此常规打包安装仍会使用编译后的 dist。

用于运行时钩子调试：

- `openclaw plugins inspect <id> --runtime --json` 会显示来自模块加载检查过程的已注册钩子和诊断。运行时检查绝不会安装依赖；使用 `openclaw doctor --fix` 清理旧版依赖状态，或恢复配置引用的缺失可下载插件。
- `openclaw gateway status --deep --require-rpc` 会确认可达的 Gateway 网关 URL/profile、服务/进程提示、配置路径和 RPC 健康状态。
- 非内置对话钩子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 避免复制本地插件目录（添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

独立插件文件必须列在 `plugins.load.paths` 中，而不是使用 `plugins install` 安装，或直接放在 `~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 中。这些自动发现的根目录会加载插件软件包或包目录，而顶层脚本文件会被视为本地 helper 并跳过。

<Note>
从工作区 extensions 根目录发现的工作区来源插件，在显式启用之前不会被导入或执行。对于本地开发，请运行 `openclaw plugins enable <plugin-id>` 或设置 `plugins.entries.<plugin-id>.enabled: true`；如果你的配置使用 `plugins.allow`，也要在那里包含同一个插件 id。这个默认关闭规则也适用于频道设置显式以工作区来源插件作为仅设置加载目标的情况，因此只要该工作区插件仍处于禁用状态或被排除在 allowlist 之外，本地频道插件设置代码就不会运行。链接安装和显式 `plugins.load.paths` 条目会遵循其已解析插件来源的常规策略。参见 [配置插件策略](/zh-CN/tools/plugin#configure-plugin-policy) 和 [配置参考](/zh-CN/gateway/configuration-reference#plugins)。

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是覆盖托管安装目标。

在 npm 安装中使用 `--pin`，可将已解析的精确规格（`name@version`）保存到托管插件索引中，同时保持默认行为为不固定版本。
</Note>

### 插件索引

插件安装元数据是机器管理的状态，而不是用户配置。安装和更新会将它写入活动 OpenClaw 状态目录下的共享 SQLite 状态数据库。`installed_plugin_index` 行存储持久的 `installRecords` 元数据，包括损坏或缺失的插件清单记录，以及一个由清单派生的冷注册表缓存，供 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 在配置中看到已发布的旧版 `plugins.installs` 记录时，运行时读取会将它们作为兼容性输入处理，而不会重写 `openclaw.json`。显式插件写入和 `openclaw doctor --fix` 会在允许写入配置时，将这些记录移入插件索引并移除该配置键；如果任一写入失败，配置记录会保留，以免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会在适用时从 `plugins.entries`、持久化插件索引、插件 allow/deny 列表条目以及链接的 `plugins.load.paths` 条目中移除插件记录。除非设置了 `--keep-files`，卸载还会移除被跟踪的托管安装目录，前提是该目录位于 OpenClaw 的插件 extensions 根目录内。对于主动记忆插件，记忆槽会重置为 `memory-core`。

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

更新会应用于托管插件索引中被跟踪的插件安装，以及 `hooks.internal.installs` 中被跟踪的 hook-pack 安装。

<AccordionGroup>
  <Accordion title="解析插件 id 与 npm 规格">
    当你传入插件 id 时，OpenClaw 会复用该插件记录的安装规格。这意味着之前存储的 dist-tag（例如 `@beta`）和精确固定版本，会在后续 `update <id>` 运行中继续使用。

    在 `update <id> --dry-run` 期间，精确固定的 npm 安装会保持固定。如果 OpenClaw 还可以解析该包的注册表默认发布线，并且该默认发布线比已安装的固定版本更新，试运行会报告该 pin，并打印显式的 `@latest` 包更新命令，用于跟随注册表默认发布线。

    这种定向更新规则不同于批量 `openclaw plugins update --all` 维护路径。批量更新仍会遵守普通的被跟踪安装规格，但受信任的官方 OpenClaw 插件记录可以同步到当前官方目录目标，而不是停留在陈旧的精确官方包上。当你有意保持某个精确或带标签的官方规格不变时，请使用定向 `update <id>`。

    对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm 包规格。OpenClaw 会将该包名解析回被跟踪的插件记录，更新该已安装插件，并记录新的 npm 规格以供未来基于 id 的更新使用。

    传入不带版本或标签的 npm 包名也会解析回被跟踪的插件记录。当某个插件被固定到精确版本，而你想把它移回注册表默认发布线时，请使用这种方式。

  </Accordion>
  <Accordion title="Beta 频道更新">
    定向 `openclaw plugins update <id-or-npm-spec>` 会复用被跟踪的插件规格，除非你传入新的规格。批量 `openclaw plugins update --all` 在将受信任的官方插件记录同步到官方目录目标时，会使用配置的 `update.channel`，因此 beta 频道安装可以停留在 beta 发布线，而不会被静默规范化为 stable/latest。

    `openclaw update` 也知道活动的 OpenClaw 更新频道：在 beta 频道上，默认发布线 npm 和 ClawHub 插件记录会先尝试 `@beta`。如果不存在插件 beta 版本，它们会回退到记录的默认/latest 规格；如果 beta 包存在但安装验证失败，npm 插件也会回退。该回退会报告为警告，并且不会让核心更新失败。精确版本和显式标签在定向更新中会保持固定到该选择器。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前，OpenClaw 会对照 npm 注册表元数据检查已安装包版本。如果已安装版本和记录的产物身份已经与已解析目标匹配，更新会被跳过，不会下载、重新安装或重写 `openclaw.json`。

    当存在已存储的完整性哈希且拉取到的产物哈希发生变化时，OpenClaw 会将其视为 npm 产物漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续之前请求确认。非交互式更新辅助工具会默认关闭，除非调用方提供显式继续策略。

  </Accordion>
  <Accordion title="更新中的 --dangerously-force-unsafe-install">
    为了兼容性，`--dangerously-force-unsafe-install` 也可用于 `plugins update`，但它已被弃用，并且不再改变插件更新行为。操作员 `security.installPolicy` 仍然可以阻止更新；插件 `before_install` 钩子只会在已加载插件钩子的进程中应用。
  </Accordion>
  <Accordion title="更新中的 --acknowledge-clawhub-risk">
    由社区 ClawHub 支持的插件更新在下载替换包之前，会运行与安装相同的精确版本信任检查。对于经过审核的自动化，如果选中的 ClawHub 版本带有高风险信任警告但仍应继续，请使用 `--acknowledge-clawhub-risk`。官方 ClawHub 包和内置 OpenClaw 插件源会绕过此版本信任提示。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 默认不会导入插件运行时，它会显示身份、加载状态、来源、清单能力、策略标志、诊断、安装元数据、包能力，以及任何检测到的 MCP 或 LSP 服务器支持。JSON 输出包含插件清单契约，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，以便操作员在启用或重启插件之前审计受信任表面声明。添加 `--runtime` 会加载插件模块，并包含已注册的钩子、工具、命令、服务、Gateway 网关方法和 HTTP 路由。运行时检查会直接报告缺失的插件依赖；安装和修复仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 处理。

插件拥有的 CLI 命令通常会作为根级 `openclaw` 命令组安装，但插件也可以在核心父命令下注册嵌套命令，例如 `openclaw nodes`。在 `inspect --runtime` 显示 `cliCommands` 下的命令后，请按列出的路径运行它；例如，注册了 `demo-git` 的插件可以通过 `openclaw demo-git ping` 验证。

每个插件会按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有钩子，没有能力或表面
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参见 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志会输出适合脚本和审计的机器可读报告。`inspect --all` 会渲染一个覆盖全部插件的表格，包含形态、能力种类、兼容性通知、包能力和钩子摘要列。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断、兼容性通知，以及缺失插件槽等陈旧插件配置引用。当安装树和插件配置干净时，它会打印 `No plugin issues detected.` 如果仍有陈旧配置，但安装树在其他方面健康，摘要会说明这一点，而不会暗示插件完全健康。

如果已配置插件存在于磁盘上，但被加载器的路径安全检查阻止，配置验证会保留插件条目，并将其报告为 `present but blocked`。请修复前面的被阻止插件诊断，例如路径所有权或全局可写权限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于模块形态失败，例如缺少 `register`/`activate` 导出，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 为已安装插件身份、启用状态、来源元数据和贡献所有权持久化的冷读取模型。正常启动、提供商所有者查找、频道设置分类和插件清单都可以读取它，而无需导入插件运行时模块。

使用 `plugins registry` 检查持久化注册表是否存在、是否为当前版本或是否陈旧。使用 `--refresh` 可从持久化插件索引、配置策略以及清单/包元数据重建它。这是修复路径，不是运行时激活路径。

`openclaw doctor --fix` 也会修复与注册表相邻的托管 npm 漂移：如果托管插件 npm 项目下或旧版扁平托管 npm 根目录中的孤立或已恢复 `@openclaw/*` 包遮蔽了内置插件，Doctor 会移除该陈旧包并重建注册表，使启动过程根据内置清单进行验证。Doctor 还会将主机 `openclaw` 包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm 插件中，因此包本地运行时导入（例如 `openclaw/plugin-sdk/*`）会在更新或 npm 修复后正常解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的紧急兼容性开关，用于注册表读取失败。请优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；该环境变量回退仅用于迁移推出期间的紧急启动恢复。
</Warning>

### Marketplace

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

`plugins marketplace entries` 会列出已配置的 OpenClaw 市场源中的条目。默认情况下，它会尝试使用托管源，并回退到最新已接受的快照或内置数据。使用 `--feed-profile <name>` 读取特定的已配置配置档，使用 `--feed-url <url>` 读取显式的托管源 URL，使用 `--offline` 在不获取源的情况下读取最新已接受的快照。

`plugins marketplace refresh` 会刷新已配置的托管源快照，并报告 OpenClaw 接受的是托管数据、托管快照，还是内置回退数据。当调用方需要命令在新鲜托管有效负载不匹配固定校验和时失败，请使用 `--expected-sha256`。

市场 `list` 接受本地市场路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的来源标签，以及解析出的市场清单和插件条目。

市场刷新会加载托管的 OpenClaw 市场源，并将经过验证的响应持久化为本地托管源快照。不带选项时，它使用已配置的默认源配置档。使用 `--feed-profile <name>` 刷新特定的已配置配置档，使用 `--feed-url <url>` 刷新显式的托管源 URL，使用 `--expected-sha256 <sha256>` 要求有效负载校验和匹配（`sha256:<hex>` 或裸 64 字符十六进制摘要），并使用 `--json` 获取机器可读输出。显式的托管源 URL 不得包含凭据、查询字符串或片段。未固定校验和的刷新可以报告托管快照或内置回退结果，而不会使命令失败。固定校验和的刷新必须接受新鲜的托管有效负载，否则会失败；如果 OpenClaw 无法持久化经过验证的快照，成功的托管刷新也会失败。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [CLI 参考](/zh-CN/cli)
- [ClawHub](/zh-CN/clawhub)
