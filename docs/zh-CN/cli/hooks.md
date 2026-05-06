---
read_when:
    - 你想要管理智能体钩子
    - 你想检查钩子可用性或启用工作区钩子
summary: '`openclaw hooks`（智能体钩子）的 CLI 参考'
title: 钩子
x-i18n:
    generated_at: "2026-05-06T16:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

管理智能体钩子（用于 `/new`、`/reset` 和 Gateway 网关启动等命令的事件驱动自动化）。

不带子命令运行 `openclaw hooks` 等同于 `openclaw hooks list`。

相关内容：

- 钩子：[钩子](/zh-CN/automation/hooks)
- 插件钩子：[插件钩子](/zh-CN/plugins/hooks)

## 列出所有钩子

```bash
openclaw hooks list
```

列出从工作区、托管目录、额外目录和内置目录发现的所有钩子。
Gateway 网关启动时不会加载内部钩子处理程序，除非至少配置了一个内部钩子。

**选项：**

- `--eligible`：仅显示符合条件的钩子（满足要求）
- `--json`：以 JSON 输出
- `-v, --verbose`：显示详细信息，包括缺失的要求

**示例输出：**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**示例（详细）：**

```bash
openclaw hooks list --verbose
```

显示不符合条件的钩子缺失的要求。

**示例（JSON）：**

```bash
openclaw hooks list --json
```

返回用于程序化使用的结构化 JSON。

## 获取钩子信息

```bash
openclaw hooks info <name>
```

显示特定钩子的详细信息。

**参数：**

- `<name>`：钩子名称或钩子键（例如 `session-memory`）

**选项：**

- `--json`：以 JSON 输出

**示例：**

```bash
openclaw hooks info session-memory
```

**输出：**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## 检查钩子资格

```bash
openclaw hooks check
```

显示钩子资格状态摘要（多少已就绪、多少未就绪）。

**选项：**

- `--json`：以 JSON 输出

**示例输出：**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 启用钩子

```bash
openclaw hooks enable <name>
```

通过将特定钩子添加到你的配置中来启用它（默认是 `~/.openclaw/openclaw.json`）。

**注意：** 工作区钩子默认处于禁用状态，直到在这里或配置中启用。由插件管理的钩子会在 `openclaw hooks list` 中显示 `plugin:<id>`，不能在这里启用或禁用。请改为启用或禁用对应插件。

**参数：**

- `<name>`：钩子名称（例如 `session-memory`）

**示例：**

```bash
openclaw hooks enable session-memory
```

**输出：**

```
✓ Enabled hook: 💾 session-memory
```

**它会做什么：**

- 检查钩子是否存在且符合条件
- 在你的配置中更新 `hooks.internal.entries.<name>.enabled = true`
- 将配置保存到磁盘

如果钩子来自 `<workspace>/hooks/`，则必须先执行此选择启用步骤，
Gateway 网关才会加载它。

**启用后：**

- 重启 Gateway 网关以重新加载钩子（在 macOS 上重启菜单栏应用，或在开发环境中重启你的 Gateway 网关进程）。

## 禁用钩子

```bash
openclaw hooks disable <name>
```

通过更新你的配置来禁用特定钩子。

**参数：**

- `<name>`：钩子名称（例如 `command-logger`）

**示例：**

```bash
openclaw hooks disable command-logger
```

**输出：**

```
⏸ Disabled hook: 📝 command-logger
```

**禁用后：**

- 重启 Gateway 网关以重新加载钩子

## 备注

- `openclaw hooks list --json`、`info --json` 和 `check --json` 会将结构化 JSON 直接写入 stdout。
- 由插件管理的钩子不能在这里启用或禁用；请改为启用或禁用所属插件。

## 安装钩子包

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

通过统一的插件安装器安装钩子包。

`openclaw hooks install` 仍可作为兼容别名使用，但它会打印弃用警告，
并转发到 `openclaw plugins install`。

npm 规范**仅限注册表**（包名 + 可选的**精确版本**或
**dist-tag**）。Git/URL/file 规范和 semver 范围会被拒绝。为了安全，即使你的
shell 配置了全局 npm 安装设置，依赖安装也会以项目本地方式运行，并带上 `--ignore-scripts`。

裸规范和 `@latest` 会留在稳定轨道上。如果 npm 将其中任何一种解析为预发布版本，
OpenClaw 会停止并要求你使用 `@beta`/`@rc` 等预发布标签或精确预发布版本来显式选择加入。

**它会做什么：**

- 将钩子包复制到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中启用已安装的钩子
- 在 `hooks.internal.installs` 下记录安装

**选项：**

- `-l, --link`：链接本地目录而不是复制（将其添加到 `hooks.internal.load.extraDirs`）
- `--pin`：将 npm 安装记录为 `hooks.internal.installs` 中解析后的精确 `name@version`

**支持的归档格式：** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**示例：**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

已链接的钩子包会被视为来自操作员配置目录的托管钩子，
而不是工作区钩子。

## 更新钩子包

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

通过统一的插件更新器更新已跟踪的基于 npm 的钩子包。

`openclaw hooks update` 仍可作为兼容别名使用，但它会打印弃用警告，
并转发到 `openclaw plugins update`。

**选项：**

- `--all`：更新所有已跟踪的钩子包
- `--dry-run`：显示会发生什么变化但不写入

当已存储完整性哈希且获取到的制品哈希发生变化时，
OpenClaw 会打印警告并在继续之前请求确认。在 CI/非交互式运行中使用
全局 `--yes` 可绕过提示。

## 内置钩子

### session-memory

当你发出 `/new` 或 `/reset` 时，将会话上下文保存到记忆中。

**启用：**

```bash
openclaw hooks enable session-memory
```

**输出：** 默认写入 `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`。设置 `hooks.internal.entries.session-memory.llmSlug: true` 可使用模型生成的文件名 slug。

**参见：** [session-memory 文档](/zh-CN/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期间注入额外的启动文件（例如 monorepo 本地的 `AGENTS.md` / `TOOLS.md`）。

**启用：**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参见：** [bootstrap-extra-files 文档](/zh-CN/automation/hooks#bootstrap-extra-files)

### command-logger

将所有命令事件记录到集中式审计文件。

**启用：**

```bash
openclaw hooks enable command-logger
```

**输出：** `~/.openclaw/logs/commands.log`

**查看日志：**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参见：** [command-logger 文档](/zh-CN/automation/hooks#command-logger)

### boot-md

Gateway 网关启动时（在渠道启动后）运行 `BOOT.md`。

**事件**：`gateway:startup`

**启用**：

```bash
openclaw hooks enable boot-md
```

**参见：** [boot-md 文档](/zh-CN/automation/hooks#boot-md)

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [自动化钩子](/zh-CN/automation/hooks)
