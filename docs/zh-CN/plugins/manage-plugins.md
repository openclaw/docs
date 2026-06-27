---
doc-schema-version: 1
read_when:
    - 你需要快速查看插件列表、安装、更新、检查或卸载示例
    - 你想选择一个插件安装来源
    - 你需要用于发布插件包的正确参考
sidebarTitle: Manage plugins
summary: 用于列出、安装、更新、检查和卸载 OpenClaw 插件的快速示例
title: 管理插件
x-i18n:
    generated_at: "2026-06-27T02:42:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

使用本页查看常见插件管理命令。有关完整的命令契约、标志、源选择规则和边界情况，请参阅 [`openclaw plugins`](/zh-CN/cli/plugins)。

大多数安装工作流如下：

1. 查找包
2. 从 ClawHub、npm、git 或本地路径安装它
3. 让托管的 Gateway 网关自动重启，或在非托管时手动重启
4. 验证插件的运行时注册

## 列出和搜索插件

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

将 `--json` 用于脚本：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷清单检查。它会显示 OpenClaw 可以从配置、清单和插件注册表中发现的内容；它不能证明已经运行的 Gateway 网关导入了插件运行时。JSON 输出包含注册表诊断信息，以及当插件包声明 `dependencies` 或 `optionalDependencies` 时每个插件的静态 `dependencyStatus`。

`plugins search` 会查询 ClawHub 中可安装的插件包，并打印安装提示，例如 `openclaw plugins install clawhub:<package>`。

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

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

裸包规格会在发布切换期间从 npm 安装。当你需要确定性的源选择时，请使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`。如果裸名称匹配官方插件 ID，OpenClaw 可以直接安装目录条目。

仅在你有意覆盖现有安装目标时使用 `--force`。对于已跟踪的 npm、ClawHub 或 hook-pack 安装的常规升级，请使用 `openclaw plugins update`。

## 重启和检查

安装、更新或卸载插件代码后，启用了配置重新加载的运行中托管 Gateway 网关会自动重启。如果 Gateway 网关未受托管或已禁用重新加载，请先自行重启，再检查实时运行时表面：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

当你需要证明插件已注册工具、钩子、服务、Gateway 网关方法、HTTP 路由或插件自有 CLI 命令等运行时表面时，请使用 `inspect --runtime`。普通的 `inspect` 和 `list` 是冷清单、配置和注册表检查。

## 更新插件

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

当你传入插件 ID 时，OpenClaw 会复用已跟踪的安装规格。存储的 dist-tag（例如 `@beta`）和精确固定版本会继续用于后续的 `update <plugin-id>` 运行。

`openclaw plugins update --all` 是批量维护路径。它仍会遵循普通的已跟踪安装规格，但受信任的官方 OpenClaw 插件记录可以同步到当前官方目录目标，而不是停留在过时的精确官方包上。如果 `update.channel` 设置为 `beta`，该批量官方同步会使用 beta 频道上下文。当你有意保持某个精确或带标签的官方规格不变时，请使用定向的 `update <plugin-id>`。

对于 npm 安装，你可以传入显式包规格来切换跟踪记录：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

当插件此前固定到精确版本或标签时，第二个命令会将插件移回注册表的默认发布线。

当 `openclaw update` 在 beta 频道上运行时，插件记录可以优先使用匹配的 `@beta` 发布。有关精确的回退和固定规则，请参阅 [`openclaw plugins`](/zh-CN/cli/plugins#update)。

## 卸载插件

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

卸载会移除插件的配置条目、持久化插件索引记录、允许/拒绝列表条目，以及适用时的链接加载路径。除非你传入 `--keep-files`，否则托管安装目录会被移除。当卸载更改插件源时，运行中的托管 Gateway 网关会自动重启。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，插件安装、更新、卸载、启用和禁用命令会被禁用。请改为在该安装的 Nix 源中管理这些选择。

## 选择源

| 源          | 适用场景                                                                    | 示例                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 你需要 OpenClaw 原生发现、扫描摘要、版本和提示                              | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | 你已经发布 JavaScript 包，或需要 npm dist-tag/私有注册表                    | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | 你需要仓库中的分支、标签或提交                                               | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本地路径    | 你正在同一台机器上开发或测试插件                                             | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | 你正在通过 npm 安装语义验证本地包产物                                        | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | 你正在安装 Claude 兼容的 marketplace 插件                                    | `openclaw plugins install <plugin> --marketplace <source>`     |

托管本地路径安装必须是插件目录或归档。请将独立插件文件放入 `plugins.load.paths`，而不是用 `plugins install` 安装它们。

## 发布插件

ClawHub 是 OpenClaw 插件的主要公共发现表面。当你希望用户在安装前找到插件元数据、版本历史、注册表扫描结果和安装提示时，请在那里发布。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm 插件在发布前必须包含插件清单和包元数据：

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

请使用这些页面作为完整发布契约，而不是将本页当作发布参考：

- [ClawHub 发布](/zh-CN/clawhub/publishing) 说明所有者、作用域、发布、审核、包验证和包转移。
- [构建插件](/zh-CN/plugins/building-plugins) 展示插件包形状和首次发布工作流。
- [插件清单](/zh-CN/plugins/manifest) 定义原生插件清单字段。

如果同一个包同时在 ClawHub 和 npm 上可用，当你需要强制指定某个源时，请使用显式的 `clawhub:` 或 `npm:` 前缀。

## 相关

- [插件](/zh-CN/tools/plugin) - 安装、配置、重启和故障排除
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整 CLI 参考
- [社区插件](/zh-CN/plugins/community) - 公共发现和 ClawHub 发布
- [ClawHub](/zh-CN/clawhub/cli) - 注册表 CLI 操作
- [构建插件](/zh-CN/plugins/building-plugins) - 创建插件包
- [插件清单](/zh-CN/plugins/manifest) - 清单和包元数据
