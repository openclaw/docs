---
read_when:
    - 你想从终端读取或写入工作区文件中的某个叶节点
    - 你正在针对工作区状态编写脚本，并且需要一种稳定、与类型无关的寻址方案
    - 你正在调试一个 `oc://` 路径（验证语法，查看它解析成什么）
summary: 用于 `openclaw path` 的 CLI 参考（通过 `oc://` 寻址方案检查并编辑工作区文件）
title: 路径
x-i18n:
    generated_at: "2026-05-10T19:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

由插件提供的 shell 访问能力，用于访问 `oc://` 寻址底层机制：一种按类型分派的路径方案，用于检查和编辑可寻址的工作区文件（markdown、jsonc、jsonl）。自托管用户、插件作者和编辑器扩展可以用它读取、查找或更新狭窄位置，而无需为每种文件手写解析器。

CLI 映射底层机制的公开动词：

- `resolve` 是具体且单匹配的。
- `find` 是用于通配符、联合、谓词和位置展开的多匹配动词。
- `set` 只接受具体路径或插入标记；通配符模式会在写入前被拒绝。

`path` 由内置可选 `oc-path` 插件提供。首次使用前请启用它：

```bash
openclaw plugins enable oc-path
```

## 为什么使用它

OpenClaw 状态分散在人工编辑的 markdown、带注释的 JSONC 配置，以及仅追加的 JSONL 日志中。Shell 脚本、钩子和智能体经常需要这些文件中的一个小值：frontmatter 键、插件设置、日志记录字段，或命名章节下的项目符号条目。

`openclaw path` 为这些调用方提供稳定地址，而不是为每种文件类型使用一次性的 grep、正则表达式或解析器。同一个 `oc://` 路径可以在终端中验证、解析、搜索、dry-run 和写入，这让狭窄的自动化更容易审查，也更安全地重放。当你想更新一个叶子节点，同时保留文件其余部分的注释、换行符和周围格式时，它尤其有用。

当你想要的内容有逻辑地址，但物理文件形态各不相同时，可以使用它：

- 钩子想从带注释的 JSONC 中读取一个设置，并在写回该值时不丢失注释。
- 维护脚本想在 JSONL 日志中查找每个匹配的事件字段，而不用把整个日志加载到自定义解析器中。
- 编辑器扩展想按 slug 跳转到 markdown 章节或项目符号条目，然后渲染它解析到的确切行。
- 智能体想在应用一个很小的工作区编辑前先 dry-run，并让变更字节在审查中可见。

普通的整文件编辑、丰富的配置迁移，或特定于记忆的写入，通常不需要 `openclaw path`。这些应使用所有者命令或插件。`path` 适用于小型、可寻址的文件操作，其中可重复的终端命令比另一个定制解析器更清晰。

## 使用方式

从人工编辑的配置文件中读取一个值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

预览一次写入而不触碰磁盘：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在仅追加的 JSONL 日志中查找匹配记录：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

按章节和条目来定位 markdown 中的一条指令，而不是按行号：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在 CI 或预检脚本中验证路径，然后脚本再读取或写入：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

这些命令旨在可复制到 shell 脚本中。当调用方需要结构化输出时使用 `--json`，当人要检查结果时使用 `--human`。

## 工作原理

`openclaw path` 做四件事：

1. 将 `oc://` 地址解析为槽位：文件、章节、条目、字段，以及可选会话。
2. 根据目标扩展名（`.md`、`.jsonc`、`.jsonl` 及相关别名）选择文件类型适配器。
3. 针对该文件类型的 AST 解析槽位：markdown 标题/条目、JSONC 对象键/数组索引，或 JSONL 行记录。
4. 对于 `set`，通过同一个适配器发出编辑后的字节，因此在该类型支持的情况下，文件未触碰的部分会保留其注释、换行符和邻近格式。

`resolve` 和 `set` 需要一个具体目标。`find` 是探索性动词：它会把通配符、联合、谓词和序号展开为可检查的具体匹配项，然后你可以选择其中一个来写入。

## 子命令

| 子命令                  | 用途                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 打印路径处的具体匹配项（或“未找到”）。                                       |
| `find <pattern>`        | 枚举通配符 / 联合 / 谓词路径的匹配项。                                       |
| `set <oc-path> <value>` | 在具体路径写入叶子节点或插入目标。支持 `--dry-run`。                         |
| `validate <oc-path>`    | 仅解析；打印结构拆解（文件 / 章节 / 条目 / 字段）。                          |
| `emit <file>`           | 通过 `parseXxx` + `emitXxx` 往返处理文件（字节保真诊断）。                   |

## 全局标志

| 标志            | 用途                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| `--cwd <dir>`   | 相对此目录解析文件槽位（默认：`process.cwd()`）。                          |
| `--file <path>` | 覆盖文件槽位解析出的路径（绝对访问）。                                     |
| `--json`        | 强制 JSON 输出（stdout 不是 TTY 时的默认值）。                             |
| `--human`       | 强制人类可读输出（stdout 是 TTY 时的默认值）。                             |
| `--dry-run`     | （仅用于 `set`）打印将要写入的字节而不实际写入。                           |

## `oc://` 语法

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

槽位规则：`field` 需要 `item`，而 `item` 需要 `section`。在全部四个槽位中：

- **带引号的片段** — `"a/b.c"` 会保留 `/` 和 `.` 分隔符。
  内容是字节字面量；引号内不允许出现 `"` 和 `\`。
  文件槽位也识别引号：`oc://"skills/email-drafter"/Tools/$last`
  会将 `skills/email-drafter` 视为单个文件路径。
- **谓词** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、
  `[k>=v]`。数值操作要求两边都能强制转换为有限数字。
- **联合** — `{a,b,c}` 匹配任意替代项。
- **通配符** — `*`（单个子片段）和 `**`（零个或多个，递归）。
  `find` 接受这些；`resolve` 和 `set` 会因歧义拒绝它们。
- **位置** — `$last` 解析为最后一个索引 / 最后声明的键。
- **序号** — `#N` 表示按文档顺序的第 N 个匹配项。
- **插入标记** — `+`、`+key`、`+nnn` 用于按键 / 按索引插入（与 `set` 一起使用）。
- **会话作用域** — `?session=cron-daily` 等。它与槽位嵌套正交。
  会话值是原始值，不会做百分号解码；其中不得包含控制字符或保留查询分隔符（`?`、`&`、`%`）。

在带引号、谓词或联合片段之外的保留字符（`?`、`&`、`%`）会被拒绝。控制字符（U+0000-U+001F、U+007F）在任何位置都会被拒绝，包括 `session` 查询值。

对于规范路径，保证 `formatOcPath(parseOcPath(path)) === path`。除第一个非空 `session=` 值外，非规范查询参数会被忽略。

## 按文件类型寻址

| 类型       | 寻址模型                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | 通过 slug 定位 H2 章节，通过 slug 或 `#N` 定位项目符号条目，通过 `[frontmatter]` 定位 frontmatter。 |
| JSONC/JSON | 对象键和数组索引；点号会拆分嵌套子片段，除非带引号。                                      |
| JSONL      | 顶层行地址（`L1`、`L2`、`$last`），然后在行内使用 JSONC 风格下钻。                         |

`resolve` 返回结构化匹配项：`root`、`node`、`leaf` 或
`insertion-point`，并带有从 1 开始的行号。叶子值会作为文本加 `leafType` 暴露，因此插件作者可以渲染预览，而无需依赖每种文件类型的 AST 形态。

## 变更契约

`set` 写入一个具体目标：

- Markdown frontmatter 值和 `- key: value` 条目字段是字符串叶子节点。
  Markdown 插入会追加章节、frontmatter 键或章节条目，并为变更后的文件渲染规范 markdown 形态。
- JSONC 叶子写入会把字符串值强制转换为现有叶子类型
  （`string`、有限 `number`、`true`/`false` 或 `null`）。JSONC 对象和数组插入会将 `<value>` 解析为 JSON，并对普通叶子写入使用 `jsonc-parser` 编辑路径，从而保留注释和邻近格式。
- JSONL 叶子写入会像 JSONC 一样在行内强制转换。整行替换和追加会将 `<value>` 解析为 JSON。渲染后的 JSONL 会保留文件中占主导的 LF/CRLF 换行约定。

当确切字节很重要时，请在用户可见写入前使用 `--dry-run`。底层机制会为解析/发出往返处理保留字节完全相同的输出，但变更可能会根据文件类型规范化被编辑区域或文件。

## 示例

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

更多语法示例：

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## 按文件类型的用法示例

同样五个动词可跨类型使用；寻址方案会按文件扩展名分派。下面的示例使用 PR 描述中的 fixtures。

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

`[frontmatter]` 谓词用于寻址 YAML frontmatter 块；`tools`
通过 slug 匹配 `## Tools` 标题，并且条目叶子节点会保留其 slug 形式，即使源使用下划线（`send_email` → `send-email`）。

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC 编辑会通过 `jsonc-parser`，因此注释和空白会在 `set` 后保留下来。先使用 `--dry-run` 运行，以便在提交前检查字节内容。

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

每一行都是一条记录。当你不知道行号时，可以通过谓词（`[event=action]`）寻址；知道行号时，也可以通过规范的 `LN` 段寻址。

## 子命令参考

### `resolve <oc-path>`

读取单个叶子或节点。通配符会被拒绝，请对这类路径使用 `find`。匹配成功时退出码为 `0`，明确未命中时为 `1`，解析错误或被拒绝的模式为 `2`。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

枚举通配符、谓词或联合模式的所有匹配项。至少有一个匹配项时退出码为 `0`，零匹配时为 `1`。文件槽位通配符会被拒绝并返回 `OC_PATH_FILE_WILDCARD_UNSUPPORTED`，请传入具体文件（多文件 glob 匹配是后续功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

写入一个叶子。配合 `--dry-run` 使用，可以预览将要写入的字节，而不会触碰文件。成功写入时退出码为 `0`；如果底层实现拒绝写入（例如命中了哨兵保护），则为 `1`；解析错误时为 `2`。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

如果命名子项尚不存在，`+key` 插入标记会创建它；`+nnn` 和裸 `+` 分别用于按索引插入和追加插入。

### `validate <oc-path>`

仅解析检查。不访问文件系统。适用于在替换变量前确认模板路径格式正确，或在调试时查看结构拆解：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有效时退出码为 `0`，无效时为 `1`（并带有结构化的 `code` 和 `message`），参数错误时为 `2`。

### `emit <file>`

通过按类型的解析器和输出器对文件做往返处理。对于一个有效文件，输出应与输入按字节完全相同；差异表示解析器缺陷或命中了哨兵。可用于在真实输入上调试底层实现行为。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 退出码

| 代码 | 含义                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve` / `find`：至少一个匹配项。`set`：写入成功。） |
| `1`  | 未匹配，或 `set` 被底层实现拒绝（没有系统级错误）。      |
| `2`  | 参数或解析错误。                                                   |

## 输出模式

`openclaw path` 支持 TTY 感知：在终端上输出人类可读内容，在 stdout 被管道传输或重定向时输出 JSON。`--json` 和 `--human` 会覆盖自动检测。

## 注意事项

- `set` 通过底层实现的 emit 路径写入字节，该路径会自动应用脱敏哨兵保护。携带 `__OPENCLAW_REDACTED__`（逐字内容或作为子串）的叶子会在写入时被拒绝。
- JSONC 解析和叶子编辑使用插件本地的 `jsonc-parser` 依赖，因此普通叶子写入会保留注释和格式，而不是经过手写解析器或重新渲染路径。
- `path` 不知道 LKG。如果文件受 LKG 跟踪，下一次 observe 调用会决定是提升还是恢复。计划将用于通过 LKG 提升/恢复生命周期执行原子多项设置的 `set --batch` 与 LKG 恢复底层实现一起提供。

## 相关

- [CLI 参考](/zh-CN/cli)
