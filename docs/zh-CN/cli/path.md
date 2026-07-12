---
read_when:
    - 你想从终端读取或写入工作区文件中的叶节点
    - 你正在编写操作工作区状态的脚本，并希望使用一种稳定且不依赖类型的寻址方案
    - 你正在调试一个 `oc://` 路径（验证语法，并查看它解析到什么位置）
summary: '`openclaw path` 的 CLI 参考（通过 `oc://` 寻址方案检查和编辑工作区文件）'
title: 路径
x-i18n:
    generated_at: "2026-07-11T20:27:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

通过 shell 访问 `oc://` 寻址方案：一种按文件类型分派的路径语法，用于检查和编辑可寻址的工作区文件（markdown、jsonc、jsonl、yaml/yml/lobster）。自托管用户、插件作者和编辑器扩展可使用它读取、查找或更新小范围位置，而无需为每种文件手动编写解析器。

`path` 由内置的可选 `oc-path` 插件提供。首次使用前请启用它：

```bash
openclaw plugins enable oc-path
```

CLI 动词与寻址模型对应：

- `resolve` 用于具体路径，仅匹配一个结果。
- `find` 是用于通配符、联合、谓词和位置展开的多结果匹配动词。
- `set` 仅接受具体路径或插入标记；写入前会拒绝通配符模式。
- `validate` 解析路径，不访问文件系统。
- `emit` 通过解析 + 输出对文件进行往返处理（字节保真度诊断）。

## 为什么使用它

OpenClaw 状态分布在人工编辑的 Markdown、带注释的 JSONC 配置、仅追加的 JSONL 日志以及 YAML 工作流/规范文件中。脚本、Hooks 和智能体通常只需要这些文件中的一个小值：frontmatter 键、插件设置、日志记录字段、YAML 步骤，或具名章节下的项目符号条目。

`openclaw path` 为这些调用方提供稳定地址，而不必针对每种文件类型临时编写 grep、正则表达式或解析器。你可以在终端中对同一个 `oc://` 路径执行验证、解析、搜索、试运行和写入，使小范围自动化易于审查和重放。它会保留文件的其余部分，因此写入一个叶节点不会影响其中的注释、换行符或附近格式。

当目标具有逻辑地址但文件结构各不相同时，可以使用它：

- Hook 从带注释的 JSONC 中读取一项设置，并在写回值时保留注释。
- 维护脚本在 JSONL 日志中查找所有匹配的事件字段，而无需用自定义解析器加载整个日志。
- 编辑器通过 slug 跳转到 Markdown 章节或项目符号条目，然后呈现解析到的确切行。
- 智能体先对小范围工作区编辑进行试运行，再应用更改，并在审查中显示发生变化的字节。

对于普通的整文件编辑、复杂配置迁移或记忆专用写入，请勿使用 `openclaw path`；这些操作应使用其所属的命令或插件。`path` 适用于小范围、可寻址的文件操作，在这些场景下，可重复执行的终端命令优于再编写一个专用解析器。

## 使用方式

从人工编辑的配置文件中读取一个值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

在不改动磁盘的情况下预览写入：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在仅追加的 JSONL 日志中查找匹配记录：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

通过 Markdown 中的章节和条目定位指令，而不是使用行号：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在 CI 或预检脚本读取或写入之前验证路径：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

这些命令旨在直接复制到 shell 脚本中。调用方需要结构化输出时使用 `--json`，人工检查结果时使用 `--human`。

## 工作原理

1. 将 `oc://` 地址解析为槽位：文件、章节、条目、字段和可选的会话查询。
2. 根据目标扩展名选择文件类型适配器（`.md`、`.jsonc`、`.json`、`.jsonl`、`.ndjson`、`.yaml`、`.yml`、`.lobster`）。
3. 根据对应文件类型的结构解析槽位：Markdown 标题/条目、JSONC 对象键/数组索引、JSONL 行记录或 YAML 映射/序列节点。
4. 对于 `set`，通过同一个适配器输出编辑后的字节，因此在相应文件类型支持的情况下，文件中未改动的部分会保留其注释、换行符和附近格式。

`resolve` 和 `set` 要求目标具体且唯一。`find` 是探索性动词：它会将通配符、联合、谓词和序数展开为具体匹配项，供你检查并选择一个进行写入。

## 子命令

| 子命令                  | 用途                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 输出路径处的具体匹配项（或“未找到”）。                                      |
| `find <pattern>`        | 枚举通配符/联合/谓词路径的匹配项。                                           |
| `set <oc-path> <value>` | 在具体路径写入叶节点或插入目标。支持 `--dry-run`。                           |
| `validate <oc-path>`    | 仅解析；输出结构分解（文件/章节/条目/字段）。                                |
| `emit <file>`           | 通过解析 + 输出对文件进行往返处理（字节保真度诊断）。                        |

## 全局标志

| 标志            | 适用于                           | 用途                                                                     |
| --------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`、`find`、`set`、`emit` | 相对于此目录解析文件槽位（默认值：`process.cwd()`）。                    |
| `--file <path>` | `resolve`、`find`、`set`、`emit` | 覆盖文件槽位解析出的路径（绝对路径访问）。                               |
| `--json`        | 全部                             | 强制输出 JSON（stdout 不是 TTY 时的默认值）。                            |
| `--human`       | 全部                             | 强制输出便于人工阅读的内容（stdout 是 TTY 时的默认值）。                 |
| `--value-json`  | `set`                            | 对 JSON/JSONC/JSONL 叶节点执行替换时，将 `<value>` 解析为 JSON。         |
| `--dry-run`     | `set`                            | 输出将要写入的字节，但不实际写入。                                       |
| `--diff`        | `set`（需要 `--dry-run`）        | 输出统一 diff，而不是完整字节内容。                                      |

`validate` 仅接受 `--json` / `--human`；它不访问文件系统，因此 `--cwd` 和 `--file` 不适用。

## `oc://` 语法

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

槽位规则：`field` 要求存在 `item`，而 `item` 要求存在 `section`。以下规则适用于全部四个槽位：

- **带引号的片段** — `"a/b.c"` 不受 `/` 和 `.` 分隔符影响。内容按字节原样处理；引号内不允许出现 `"` 和 `\`。文件槽位也识别引号：`oc://"skills/email-drafter"/Tools/$last` 会将 `skills/email-drafter` 视为单个文件路径。
- **谓词** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、`[k>=v]`。数值运算符要求两侧都能转换为有限数值。
- **联合** — `{a,b,c}` 匹配任一备选项。
- **通配符** — `*`（单个子片段）和 `**`（零个或多个，递归）。`find` 接受这些通配符；`resolve` 和 `set` 会因其存在歧义而拒绝它们。
- **位置** — `$first` / `$last` 解析为第一个/最后一个索引或声明的键。
- **序数** — `#N` 表示按文档顺序排列的第 N 个匹配项。
- **插入标记** — `+`、`+key`、`+nnn`，用于按键/索引插入（与 `set` 配合使用）。
- **会话范围** — `?session=cron-daily` 等。它独立于槽位嵌套关系。会话值为原始值，不进行百分号解码；其中不得包含控制字符或保留的查询分隔符（`?`、`&`、`%`）。

带引号、谓词或联合片段之外的保留字符（`?`、`&`、`%`）会被拒绝。控制字符（U+0000-U+001F、U+007F）在任何位置都会被拒绝，包括 `session` 查询值中。

对于规范路径，保证 `formatOcPath(parseOcPath(path)) === path`。除第一个非空的 `session=` 值外，非规范查询参数会被忽略。

硬性限制：路径最大为 4096 字节，最多包含 4 个槽位（文件/章节/条目/字段），每个槽位最多包含 64 个以点号分隔的子片段，深层 JSON 路径最多包含 256 层嵌套遍历。此外，对于任何会加载 JSONC/JSON 文件的动词，如果输入文件超过 16 MiB，系统会拒绝解析并返回解析诊断。

## 按文件类型寻址

| 类型          | 文件扩展名                  | 寻址模型                                                                                             |
| ------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | 通过 slug 寻址 H2 章节，通过 slug 或 `#N` 寻址项目符号条目，通过 `[frontmatter]` 寻址 frontmatter。  |
| JSONC/JSON    | `.jsonc`、`.json`           | 对象键和数组索引；除非使用引号，否则点号会拆分嵌套子片段。                                           |
| JSONL         | `.jsonl`、`.ndjson`         | 先使用顶层行地址（`L1`、`L2`、`$first`、`$last`），再在行内按 JSONC 风格向下寻址。                   |
| YAML/.lobster | `.yaml`、`.yml`、`.lobster` | 映射键和序列索引；注释与流式样式由 YAML 文档 API 处理。                                              |

`resolve` 返回结构化匹配项：`root`、`node`、`leaf` 或 `insertion-point`，并包含从 1 开始的行号。叶节点值以文本形式提供，并附带 `leafType`，使插件作者无需依赖各文件类型的 AST 结构即可呈现预览。

## 修改约定

`set` 写入一个具体目标：

- Markdown frontmatter 值和 `- key: value` 条目字段是字符串叶节点。Markdown 插入操作会追加章节、frontmatter 键或章节条目，并为发生更改的文件呈现规范的 Markdown 结构。无法通过 `set` 将整个章节正文作为一个整体写入。
- JSONC 叶节点写入会将字符串值转换为现有叶节点的类型（`string`、有限 `number`、`true`/`false` 或 `null`）。当 JSONC/JSON/JSONL 叶节点替换操作应将 `<value>` 解析为 JSON 并且可能改变结构时，请使用 `--value-json`，例如将字符串形式的 secret-ref 简写替换为对象。JSONC 对象和数组插入会将 `<value>` 解析为 JSON；普通叶节点写入则使用 `jsonc-parser` 编辑路径，以保留注释和附近格式。
- JSONL 叶节点写入会像 JSONC 一样在行内执行类型转换。整行替换和追加会将 `<value>` 解析为 JSON。呈现后的 JSONL 会保留文件主要使用的 LF/CRLF 换行符约定（根据文件中换行符的多数结果决定，因此即使以 CRLF 为主的文件中夹杂少量 LF，也仍会保留 CRLF）。
- YAML 叶节点写入会转换为现有标量类型（`string`、有限 `number`、`true`/`false` 或 `null`）。YAML 插入使用内置 `yaml` 包的文档 API 更新映射/序列。对于存在解析器错误的格式异常 YAML 文档，系统会在修改前拒绝操作并返回 `parse-error`。

当确切字节内容很重要时，请在面向用户的写入操作前使用 `--dry-run`。JSONC 和 YAML 编辑会修补现有文档（通过 `jsonc-parser` 或 `yaml` 文档 API），因此未改动的字节通常可以保留；Markdown 在任何编辑时都会根据解析后的结构重建文件，这可能会规范化更改叶节点之外的附带格式。如果希望以聚焦的前后对比补丁而不是完整呈现文件的形式预览，请添加 `--diff`。

## 示例

```bash
# 验证路径（不访问文件系统）
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# 读取叶节点
openclaw path resolve 'oc://gateway.jsonc/version'

# 通配符搜索
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# 试运行写入
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# 以统一 diff 形式试运行写入
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# 应用写入
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# 字节保真度往返处理（诊断）
openclaw path emit ./AGENTS.md
```

更多语法示例：

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

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

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## 按文件类型分类的用法示例

相同的五个动词适用于各种文件类型；寻址方案会根据文件扩展名分派操作。

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

`[frontmatter]` 谓词用于寻址 YAML frontmatter 块；`tools` 通过 slug 匹配 `## Tools` 标题，并且条目叶节点会保留其 slug 形式，即使源文本使用下划线也是如此（`send_email` 会变为 `send-email`）。

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

JSONC 编辑通过 `jsonc-parser` 执行，因此执行 `set` 后注释和空白仍会保留。请先使用 `--dry-run` 运行，以便在提交前检查将要写入的字节。`.json` 文件与 `.jsonc` 使用相同的适配器和编辑路径。

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

每一行都是一条记录。不知道行号时，可通过谓词（`[event=action]`）寻址；知道行号时，则使用规范的 `LN` 段。`.ndjson` 文件与 `.jsonl` 使用相同的适配器。

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML 使用 `yaml` 软件包的 `Document` API，而不是自行编写的解析器，因此常规的解析/输出往返过程会保留注释和原始编写格式；同时，解析后的路径使用与 JSONC 相同的映射键/序列索引模型。`.yaml`、`.yml` 和 `.lobster` 文件由同一个适配器处理。

## 子命令参考

### `resolve <oc-path>`

读取单个叶节点或节点。不接受通配符——请改用 `find`。匹配时退出码为 `0`，正常未匹配时为 `1`，解析错误或模式被拒绝时为 `2`。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

枚举通配符/谓词/联合模式的所有匹配项。至少有一个匹配项时退出码为 `0`，没有匹配项时为 `1`。文件槽位通配符会以 `OC_PATH_FILE_WILDCARD_UNSUPPORTED` 错误被拒绝——请传入具体文件（多文件 glob 匹配是后续功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

写入叶节点。与 `--dry-run` 配合使用，可以在不修改文件的情况下预览将要写入的字节。添加 `--diff` 可预览统一格式的差异。成功写入时退出码为 `0`；底层载体拒绝操作时为 `1`（例如触发哨兵防护）；解析错误时为 `2`。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

如果指定名称的子节点尚不存在，`+key` 插入标记会创建该节点；`+nnn` 和单独的 `+` 分别用于按索引插入和追加插入。

### `validate <oc-path>`

仅执行解析检查，不访问文件系统。适用于在替换变量前确认模板路径格式正确，或获取结构分解信息以进行调试：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有效时退出码为 `0`，无效时为 `1`（并提供结构化的 `code` 和 `message`），参数错误时为 `2`。

### `emit <file>`

通过对应文件类型的解析器和输出器对文件执行往返处理。对于有效文件，输出应与输入逐字节相同；若存在差异，则表示解析器存在错误或触发了哨兵防护。适用于使用真实输入调试底层载体行为。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 退出码

| 代码 | 含义                                                                      |
| ---- | ------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve` / `find`：至少有一个匹配项。`set`：写入成功。）         |
| `1`  | 没有匹配项，或底层载体拒绝了 `set` 操作（没有系统级错误）。               |
| `2`  | 参数或解析错误。                                                          |

## 输出模式

`openclaw path` 可感知 TTY：在终端中输出人类可读的内容，在 stdout 通过管道传输或重定向时输出 JSON。`--json` 和 `--human` 可覆盖自动检测结果。

## 注意事项

- `set` 通过底层载体的输出路径写入字节，该路径会自动应用脱敏哨兵防护。如果叶节点包含 `__OPENCLAW_REDACTED__`（完全一致或作为子字符串），写入时将被拒绝。
- JSONC 解析和叶节点编辑使用插件本地的 `jsonc-parser` 依赖项，因此普通叶节点写入会保留注释和格式，而不会经过自行编写的解析器/重新渲染路径。
- `path` 不感知最后已知良好状态（LKG）的配置跟踪或恢复机制；该生命周期由其他组件负责。如果通过 `path` 编辑的文件也受 LKG 跟踪，则下一次读取配置时会决定是提升还是恢复该文件；应将 `path` 编辑视为对该文件的其他任何直接写入操作。

## 相关内容

- [CLI 参考](/zh-CN/cli)
