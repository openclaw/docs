---
read_when:
    - 你想要插件安装、列出、更新或卸载的快速示例
    - 你想在 ClawHub 和 npm 插件分发之间做出选择
    - 你正在发布一个插件包
sidebarTitle: Manage plugins
summary: 用于安装、列出、卸载、更新和发布 OpenClaw 插件的快速示例
title: 管理插件
x-i18n:
    generated_at: "2026-05-02T21:57:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

大多数插件工作流只需要几个命令：搜索、安装、重启 Gateway 网关、验证，以及在不再需要插件时卸载。

## 列出插件

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

脚本请使用 `--json`。当插件包声明了 `dependencies` 或 `optionalDependencies` 时，它会包含注册表诊断信息以及每个插件的静态 `dependencyStatus`。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是一次冷态清单检查。它显示 OpenClaw 能从配置、清单和插件注册表中发现的内容；它不能证明已经运行的 Gateway 网关进程已导入该插件运行时。

## 安装插件

```bash
# 在 ClawHub 中搜索插件包。
openclaw plugins search "calendar"

# 裸包规范会先尝试 ClawHub，然后回退到 npm。
openclaw plugins install <package>

# 强制使用一个来源。
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# 安装特定版本或 dist-tag。
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# 从 git 或本地开发检出安装。
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

安装插件代码后，重启为你的渠道提供服务的 Gateway 网关：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

当你需要证明插件已注册运行时表面时，请使用 `inspect --runtime`，例如工具、钩子、服务、Gateway 网关方法，或插件拥有的 CLI 命令。

## 更新插件

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

如果插件是从 npm dist-tag（例如 `@beta`）安装的，后续 `update <plugin-id>` 调用会复用该记录的标签。传入显式 npm 规范会将被跟踪的安装切换到该规范，以供后续更新使用。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

当插件此前固定到精确版本或标签时，第二个命令会将插件移回注册表的默认发布线。

当 `openclaw update` 在 beta 渠道上运行时，默认线 npm 和 ClawHub 插件记录会先尝试匹配的插件 `@beta` 版本。如果该 beta 版本不存在，OpenClaw 会回退到记录的默认/latest 规范。精确版本和显式标签（例如 `@rc` 或 `@beta`）会被保留。

## 卸载插件

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

卸载会移除插件的配置条目、插件索引记录、允许/拒绝列表条目，以及适用时的链接加载路径。除非传入 `--keep-files`，否则托管安装目录会被移除。

## 发布插件

你可以将外部插件发布到 [ClawHub](https://clawhub.ai)、npmjs.com，或同时发布到两者。

### 发布到 ClawHub

ClawHub 是 OpenClaw 插件的主要公开发现表面。它会在安装前向用户提供可搜索的元数据、版本历史和注册表扫描结果。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

用户可通过以下方式从 ClawHub 安装：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸形式仍会先检查 ClawHub。

### 发布到 npmjs.com

原生 npm 插件必须包含插件清单和 `package.json` OpenClaw 入口点元数据。

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
```

用户可通过以下方式安装仅 npm 的插件：

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

如果同一个包也可在 ClawHub 上获得，`npm:` 会跳过 ClawHub 查找，并强制使用 npm 解析。

## 来源选择

- **ClawHub**：当你需要 OpenClaw 原生发现、扫描摘要、版本和安装提示时使用。
- **npmjs.com**：当你已经发布 JavaScript 包，或需要 npm dist-tag/私有注册表工作流时使用。
- **Git**：当你想直接从分支、标签或提交安装时使用。
- **本地路径**：当你正在同一台机器上开发或测试插件时使用。

## 相关内容

- [插件](/zh-CN/tools/plugin) - 概览和故障排除
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整 CLI 参考
- [ClawHub](/zh-CN/tools/clawhub) - 发布和注册表操作
- [构建插件](/zh-CN/plugins/building-plugins) - 创建插件包
- [插件清单](/zh-CN/plugins/manifest) - 清单和包元数据
