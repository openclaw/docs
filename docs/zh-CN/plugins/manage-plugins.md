---
doc-schema-version: 1
read_when:
    - 你需要快速查看插件列表、安装、更新、检查或卸载示例
    - 你想选择一个插件安装来源
    - 你需要用于发布插件包的正确参考文档
sidebarTitle: Manage plugins
summary: 用于列出、安装、更新、检查和卸载 OpenClaw 插件的快速示例
title: 管理插件
x-i18n:
    generated_at: "2026-07-05T11:32:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44170a7bdcac24bd1f39ea5a1d22af9af219f4c979cc18d839d0cf29bdb7c38
    source_path: plugins/manage-plugins.md
    workflow: 16
---

常用插件管理命令。有关完整命令契约、标志、
源选择规则和边缘情况，请参阅 [`openclaw plugins`](/zh-CN/cli/plugins)。

典型工作流：查找软件包，从 ClawHub、npm、git 或
本地路径安装，让托管式 Gateway 网关自动重启（或手动重启），
然后验证插件的运行时注册。

## 列出和搜索插件

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` 用于脚本：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷清单检查：OpenClaw 可以从
配置、清单和持久化插件注册表中发现的内容。它不能证明
已经运行的 Gateway 网关导入了插件运行时。JSON 输出包括
注册表诊断信息以及每个插件的 `dependencyStatus`（声明的
`dependencies`/`optionalDependencies` 是否能在磁盘上解析）。

`plugins search` 会查询 ClawHub 中可安装的插件软件包，并为
每个结果打印安装提示（`openclaw plugins install clawhub:<package>`）。

## 启用和停用插件

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

切换插件的配置条目，而不触碰已安装文件。一些
内置插件（内置模型/语音提供商、内置浏览器插件）
默认启用；其他插件在安装后需要执行 `enable`。

## 安装插件

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm-pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

裸包规格会在启动切换期间从 npm 安装，除非该
名称匹配内置或官方插件 ID，在这种情况下 OpenClaw 会改用
该本地/官方副本。使用 `clawhub:`、`npm:`、`git:` 或
`npm-pack:` 来进行确定性的源选择。

仅在要用不同来源覆盖现有安装目标时使用 `--force`。
对于跟踪中的 npm、ClawHub 或 hook-pack 安装的常规升级，
请改用 `openclaw plugins update`；`--force` 不支持与
`--link` 一起使用。

## 重启和检查

启用配置重载的运行中托管式 Gateway 网关会在安装、更新或卸载
插件代码后自动重启。如果 Gateway 网关未托管或重载已停用，
请在检查实时运行时表面之前自行重启：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` 会加载插件模块，并证明它注册了运行时
表面（工具、钩子、服务、Gateway 网关方法、HTTP 路由、插件自有的
CLI 命令）。普通 `inspect` 和 `list` 仅是冷清单/配置/注册表
检查。

## 更新插件

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

传入插件 ID 会复用其跟踪的安装规格：已存储的 dist-tags
（`@beta`）和精确锁定版本会延续到之后的 `update <plugin-id>`
运行。

`openclaw plugins update --all` 是批量维护路径。它仍然
遵循普通的跟踪安装规格，但受信任的官方 OpenClaw
插件记录会同步到当前官方目录目标，而不是继续锁定在过时的精确官方软件包；
当 `update.channel` 为 `beta` 时，该同步会优先使用 beta 发布线。
使用定向的 `update <plugin-id>` 可以保持精确或带标签的官方规格不变。

对于 npm 安装，请传入显式软件包规格以切换跟踪的
记录：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

第二个命令会在插件之前锁定到精确版本或标签时，将其移回注册表的默认发布线。

有关准确的回退和锁定规则，请参阅 [`openclaw plugins`](/zh-CN/cli/plugins#update)。

## 卸载插件

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

卸载会移除插件的配置条目、持久化插件索引记录、
允许/拒绝列表条目，以及适用时链接的 `plugins.load.paths` 条目。
除非传入 `--keep-files`，否则托管式安装目录会被移除。运行中的托管式
Gateway 网关会在卸载更改插件来源时自动重启。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，插件安装、更新、卸载、
启用和停用都会被禁用；请改在该安装的 Nix 源中管理这些选择。

## 选择来源

| 来源      | 适用场景                                                                    | 示例                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 你想要 OpenClaw 原生发现、扫描摘要、版本和提示     | `openclaw plugins install clawhub:<package>`                   |
| git         | 你想要仓库中的分支、标签或提交                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本地路径  | 你正在同一台机器上开发或测试插件                  | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | 你正在安装 Claude 兼容的 marketplace 插件                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | 你正在通过 npm install 语义验证本地软件包产物      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | 你已经发布 JavaScript 软件包，或需要 npm dist-tags/私有注册表 | `openclaw plugins install npm:@acme/openclaw-plugin`           |

托管式本地路径安装必须是插件目录或归档文件。请将
独立插件文件放入 `plugins.load.paths`，而不是用
`plugins install` 安装它们。

## 发布插件

ClawHub 是 OpenClaw 插件的主要公开发现表面。当你希望用户在安装前
找到插件元数据、版本历史、注册表扫描结果和安装提示时，请发布到那里。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm 插件在发布前必须随附插件清单（`openclaw.plugin.json`）以及
`package.json` 元数据：

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

请使用这些页面了解完整发布契约，而不是将本页视为发布参考：

- [ClawHub 发布](/zh-CN/clawhub/publishing) 说明所有者、作用域、
  发布、评审、软件包验证和软件包转移。
- [构建插件](/zh-CN/plugins/building-plugins) 展示完整插件
  软件包形态（包括 `openclaw.plugin.json`）和首次发布
  工作流。
- [插件清单](/zh-CN/plugins/manifest) 定义原生插件清单
  字段。

如果同一个软件包同时在 ClawHub 和 npm 上可用，请使用显式的
`clawhub:` 或 `npm:` 前缀来强制指定一个来源。

## 相关

- [插件](/zh-CN/tools/plugin) - 安装、配置、重启和故障排除
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整 CLI 参考
- [社区插件](/zh-CN/plugins/community) - 公开发现和 ClawHub 发布
- [ClawHub](/zh-CN/clawhub/cli) - 注册表 CLI 操作
- [构建插件](/zh-CN/plugins/building-plugins) - 创建插件软件包
- [插件清单](/zh-CN/plugins/manifest) - 清单和软件包元数据
