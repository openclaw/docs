---
read_when:
    - 你想要管理智能体钩子
    - 你想要检查钩子的可用性，或启用工作区钩子
summary: '`openclaw hooks` 的 CLI 参考（智能体钩子）'
title: hooks
x-i18n:
    generated_at: "2026-04-23T06:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

管理智能体钩子（用于 `/new`、`/reset` 和 Gateway 网关 启动等命令的事件驱动自动化）。

在不带子命令的情况下运行 `openclaw hooks`，等同于 `openclaw hooks list`。

相关内容：

- Hooks：[Hooks](/zh-CN/automation/hooks)
- 插件钩子：[插件钩子](/zh-CN/plugins/architecture#provider-runtime-hooks)

## 列出所有钩子

```bash
openclaw hooks list
```

列出从工作区、托管、额外和内置目录中发现的所有钩子。
Gateway 网关 启动时，除非至少配置了一个内部钩子，否则不会加载内部钩子处理器。

**选项：**

- `--eligible`：仅显示符合条件的钩子（满足要求）
- `--json`：以 JSON 格式输出
- `-v, --verbose`：显示详细信息，包括缺失的要求

**示例输出：**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - 在 Gateway 网关 启动时运行 BOOT.md
  📎 bootstrap-extra-files ✓ - 在智能体引导期间注入额外的工作区引导文件
  📝 command-logger ✓ - 将所有命令事件记录到集中式审计文件
  💾 session-memory ✓ - 在发出 /new 或 /reset 命令时将会话上下文保存到 memory
```

**示例（详细模式）：**

```bash
openclaw hooks list --verbose
```

显示不符合条件钩子的缺失要求。

**示例（JSON）：**

```bash
openclaw hooks list --json
```

返回结构化 JSON，供程序化使用。

## 获取钩子信息

```bash
openclaw hooks info <name>
```

显示特定钩子的详细信息。

**参数：**

- `<name>`：钩子名称或钩子键名（例如 `session-memory`）

**选项：**

- `--json`：以 JSON 格式输出

**示例：**

```bash
openclaw hooks info session-memory
```

**输出：**

```
💾 session-memory ✓ Ready

在发出 /new 或 /reset 命令时将会话上下文保存到 memory

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## 检查钩子符合条件状态

```bash
openclaw hooks check
```

显示钩子符合条件状态的摘要（就绪与未就绪的数量）。

**选项：**

- `--json`：以 JSON 格式输出

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

通过将特定钩子添加到你的配置中来启用它（默认配置文件为 `~/.openclaw/openclaw.json`）。

**注意：** 工作区钩子默认是禁用的，必须在这里或在配置中启用。由插件管理的钩子会在 `openclaw hooks list` 中显示为 `plugin:<id>`，不能在这里启用或禁用。请改为启用或禁用对应插件。

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

**它会执行的操作：**

- 检查钩子是否存在且符合条件
- 在你的配置中更新 `hooks.internal.entries.<name>.enabled = true`
- 将配置保存到磁盘

如果该钩子来自 `<workspace>/hooks/`，则必须完成此显式启用步骤，
Gateway 网关 才会加载它。

**启用后：**

- 重启 Gateway 网关 以重新加载钩子（在 macOS 上重启菜单栏应用，或在开发环境中重启你的 Gateway 网关 进程）。

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

- 重启 Gateway 网关 以重新加载钩子

## 说明

- `openclaw hooks list --json`、`info --json` 和 `check --json` 会将结构化 JSON 直接写入标准输出。
- 由插件管理的钩子不能在这里启用或禁用；请改为启用或禁用其所属插件。

## 安装钩子包

```bash
openclaw plugins install <package>        # 先 ClawHub，后 npm
openclaw plugins install <package> --pin  # 固定版本
openclaw plugins install <path>           # 本地路径
```

通过统一的插件安装器安装钩子包。

`openclaw hooks install` 仍可作为兼容性别名使用，但会打印弃用警告，
然后转发到 `openclaw plugins install`。

npm 规格为**仅注册表**（包名 + 可选的**精确版本**或
**dist-tag**）。Git/URL/文件规格和 semver 范围会被拒绝。出于安全考虑，依赖安装会使用 `--ignore-scripts` 运行。

裸规格和 `@latest` 会保持在稳定轨道上。如果 npm 将其中任一项解析为预发布版本，OpenClaw 会停止并要求你显式选择加入，比如使用
`@beta`/`@rc` 之类的预发布标签，或精确的预发布版本。

**它会执行的操作：**

- 将钩子包复制到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中启用已安装的钩子
- 在 `hooks.internal.installs` 下记录安装信息

**选项：**

- `-l, --link`：链接本地目录而不是复制（将其添加到 `hooks.internal.load.extraDirs`）
- `--pin`：将 npm 安装以精确解析后的 `name@version` 记录到 `hooks.internal.installs`

**支持的归档格式：** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**示例：**

```bash
# 本地目录
openclaw plugins install ./my-hook-pack

# 本地归档
openclaw plugins install ./my-hook-pack.zip

# NPM 包
openclaw plugins install @openclaw/my-hook-pack

# 链接本地目录而不复制
openclaw plugins install -l ./my-hook-pack
```

已链接的钩子包会被视为来自操作员配置目录的托管钩子，
而不是工作区钩子。

## 更新钩子包

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

通过统一的插件更新器更新被跟踪的基于 npm 的钩子包。

`openclaw hooks update` 仍可作为兼容性别名使用，但会打印弃用警告，
然后转发到 `openclaw plugins update`。

**选项：**

- `--all`：更新所有被跟踪的钩子包
- `--dry-run`：显示将会更改的内容，但不写入

当存在已存储的完整性哈希，且获取到的工件哈希发生变化时，
OpenClaw 会打印警告，并在继续之前请求确认。在 CI/非交互式运行中，可使用全局 `--yes` 跳过提示。

## 内置钩子

### session-memory

在你发出 `/new` 或 `/reset` 时，将会话上下文保存到 memory。

**启用：**

```bash
openclaw hooks enable session-memory
```

**输出：** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参见：** [session-memory 文档](/zh-CN/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期间注入额外的引导文件（例如 monorepo 本地的 `AGENTS.md` / `TOOLS.md`）。

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
# 最近的命令
tail -n 20 ~/.openclaw/logs/commands.log

# 美化打印
cat ~/.openclaw/logs/commands.log | jq .

# 按操作筛选
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参见：** [command-logger 文档](/zh-CN/automation/hooks#command-logger)

### boot-md

在 Gateway 网关 启动时运行 `BOOT.md`（在渠道启动之后）。

**事件**：`gateway:startup`

**启用**：

```bash
openclaw hooks enable boot-md
```

**参见：** [boot-md 文档](/zh-CN/automation/hooks#boot-md)
