---
doc-schema-version: 1
read_when:
    - 你想在 Control UI 中浏览、安装、启用或禁用插件
    - 你需要快速查看插件列表、安装、更新、检查或卸载的示例
    - 你需要选择插件安装来源
    - 你需要正确的插件包发布参考文档
sidebarTitle: Manage plugins
summary: 从 Control UI 或 CLI 管理 OpenClaw 插件
title: 管理插件
x-i18n:
    generated_at: "2026-07-14T13:56:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dde533c089aba2d4df0a595a6b463437b6a58af821a246f96a9fbb5afdadf593
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI 涵盖常见的发现、安装、启用和禁用工作流。CLI 还支持更新、卸载、高级配置以及显式安装源控制。有关完整的命令约定、标志、源选择规则和边界情况，请参阅 [`openclaw plugins`](/zh-CN/cli/plugins)。

典型的 CLI 工作流：查找软件包，从 ClawHub、npm、git 或本地路径安装，让托管的 Gateway 网关自动重启（或手动重启），然后验证插件的运行时注册项。

## 使用 Control UI

在 Control UI 中打开**插件**，或使用相对于已配置 Control UI 基础路径的 `/settings/plugins`。例如，基础路径为 `/openclaw` 时使用 `/openclaw/settings/plugins`。该页面有两个标签页：

- **已安装**显示按类别分组的完整本地清单（渠道、模型提供商、记忆、工具）。每一行都可打开详细信息视图；其更多操作（`…`）菜单可启用或禁用插件，对于从外部安装的插件，还提供**移除**选项。该标签页还列出已配置的 [MCP 服务器](/zh-CN/cli/mcp)，并提供相同的菜单操作来启用、禁用和移除服务器，同时编辑 Gateway 配置中的 `mcp.servers`。
- **发现**是插件商店：其中包括 OpenClaw 内置的精选插件、官方外部插件和经过筛选的连接器专区。连接器卡片可以一键添加托管的 MCP 服务器（GitHub、Notion、Linear、Sentry、Home Assistant），或跳转到预填充的 ClawHub 搜索。在搜索框中输入内容会直接查询 [ClawHub](https://clawhub.ai/plugins)，并追加一个**来自 ClawHub**分区，其中包含下载次数和来源验证徽章。

内置插件无需安装软件包。其菜单操作为**启用**或**禁用**。例如，Workboard 内置于 OpenClaw 中且默认禁用，因此请选择**启用**来开启它。内置插件无法移除，只能禁用。

访问目录和搜索功能需要 `operator.read`。安装、启用、禁用、移除以及更改 MCP 服务器需要 `operator.admin`。ClawHub 安装由 Gateway 网关执行，并保留其信任、完整性和插件安装策略检查。管理员启用已安装的插件时，还会将所选插件添加到现有的限制性 `plugins.allow` 列表中，从而记录这项显式信任。显式的 `plugins.deny` 条目仍具有最终决定权，必须先将其移除，才能启用该插件。

安装或移除插件代码需要重启 Gateway 网关。如果已安装的插件和当前 Gateway 网关运行时支持，则无需重启即可应用启用状态变更；否则 UI 会提示需要重启。由 OAuth 支持的 MCP 连接器在添加后仍需通过 CLI 执行一次 `openclaw mcp login <name>`。

Control UI 不支持从任意 npm、git 或本地路径源安装，不支持更新插件，也不提供丰富的插件配置。请使用下述 CLI 工作流执行这些操作。

## 列出和搜索插件

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

用于脚本的 `--json`：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是一项冷清单检查：检查 OpenClaw 能从配置、清单和持久化插件注册表中发现哪些内容。它不能证明已在运行的 Gateway 网关导入了插件运行时。JSON 输出包含注册表诊断信息和每个插件的 `dependencyStatus`（声明的 `dependencies`/`optionalDependencies` 是否能在磁盘上解析）。

`plugins search` 会在 ClawHub 中查询可安装的插件软件包，并为每个结果输出安装提示（`openclaw plugins install clawhub:<package>`）。

## 启用和禁用插件

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

切换插件的配置条目，而不改动已安装的文件。某些内置插件（内置模型/语音提供商、内置浏览器插件）默认启用；其他插件在安装后需要执行 `enable`。

## 安装插件

```bash
# 在 ClawHub 中搜索插件软件包。
openclaw plugins search "calendar"

# 从 ClawHub 安装。
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# 从 npm 安装。
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# 从本地 npm-pack 工件安装。
openclaw plugins install npm-pack:<path.tgz>

# 从 git 或本地开发检出目录安装。
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

在启动切换期间，裸软件包说明符会从 npm 安装，除非名称与内置或官方插件 ID 匹配；在这种情况下，OpenClaw 会改用相应的本地/官方副本。使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 可确定性地选择来源。

仅当需要使用其他来源覆盖现有安装目标时，才使用 `--force`。对于由系统跟踪的 npm、ClawHub 或 hook-pack 安装的常规升级，请改用 `openclaw plugins update`；`--force` 不支持与 `--link` 一起使用。

## 重启和检查

启用配置重载的托管 Gateway 网关在安装、更新或卸载插件代码后会自动重启。如果 Gateway 网关未受托管或已禁用重载，请自行重启，然后再检查实时运行时表面：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` 会加载插件模块，并证明它已注册运行时表面（工具、钩子、服务、Gateway 网关方法、HTTP 路由、插件自有的 CLI 命令）。普通的 `inspect` 和 `list` 仅执行冷清单/配置/注册表检查。

## 更新插件

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

传入插件 ID 会复用其跟踪的安装说明符：已存储的 dist-tag（`@beta`）和精确固定版本会沿用到后续的 `update <plugin-id>` 运行中。

`openclaw plugins update --all` 是批量维护路径。它仍会遵循普通的跟踪安装说明符，但受信任的 OpenClaw 官方插件记录会同步到当前官方目录目标，而不是继续固定到过时的精确官方软件包；当 `update.channel` 为 `beta` 时，该同步会优先使用 beta 发布线。若要保持精确或带标签的官方说明符不变，请使用有针对性的 `update <plugin-id>`。

对于 npm 安装，请传入显式软件包说明符以切换跟踪记录：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

如果插件此前固定到精确版本或标签，第二条命令会将其移回注册表的默认发布线。

有关确切的回退和版本固定规则，请参阅 [`openclaw plugins`](/zh-CN/cli/plugins#update)。

## 卸载插件

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

卸载操作会移除插件的配置条目、持久化插件索引记录、允许/拒绝列表条目，以及适用时关联的 `plugins.load.paths` 条目。除非传入 `--keep-files`，否则还会移除托管安装目录。如果卸载更改了插件来源，正在运行的托管 Gateway 网关会自动重启。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，插件安装、更新、卸载、启用和禁用功能均被禁用；请在该安装的 Nix 源中管理这些选项。

## 选择来源

| 来源        | 适用场景                                                                    | 示例                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 需要 OpenClaw 原生的发现、扫描摘要、版本和提示                              | `openclaw plugins install clawhub:<package>`                   |
| git         | 需要仓库中的分支、标签或提交                                                | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本地路径    | 在同一台机器上开发或测试插件                                                | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | 安装与 Claude 兼容的 marketplace 插件                                      | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | 通过 npm 安装语义验证本地软件包工件                                         | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | 已发布 JavaScript 软件包，或需要 npm dist-tag/私有注册表                    | `openclaw plugins install npm:@acme/openclaw-plugin`           |

托管的本地路径安装目标必须是插件目录或归档文件。独立插件文件应放入 `plugins.load.paths`，而不是使用 `plugins install` 安装。

## 发布插件

ClawHub 是 OpenClaw 插件的主要公共发现平台。如果希望用户在安装前找到插件元数据、版本历史、注册表扫描结果和安装提示，请将插件发布到该平台。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm 插件在发布前必须包含插件清单（`openclaw.plugin.json`）和 `package.json` 元数据：

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

请使用以下页面了解完整的发布约定，不要将本页面视为发布参考：

- [ClawHub 发布](/zh-CN/clawhub/publishing)介绍所有者、作用域、发布、审核、软件包验证和软件包转移。
- [构建插件](/zh-CN/plugins/building-plugins)展示完整的插件软件包结构（包括 `openclaw.plugin.json`）和首次发布工作流。
- [插件清单](/zh-CN/plugins/manifest)定义原生插件清单字段。

如果同一个软件包同时可从 ClawHub 和 npm 获取，请使用显式的 `clawhub:` 或 `npm:` 前缀强制选择其中一个来源。

## 相关内容

- [插件](/zh-CN/tools/plugin) - 安装、配置、重启插件以及排查插件问题
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整的 CLI 参考
- [社区插件](/zh-CN/plugins/community) - 公共发现和 ClawHub 发布
- [ClawHub](/zh-CN/clawhub/cli) - 注册表 CLI 操作
- [构建插件](/zh-CN/plugins/building-plugins) - 创建插件软件包
- [插件清单](/zh-CN/plugins/manifest) - 清单和软件包元数据
