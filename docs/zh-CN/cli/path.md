---
read_when:
    - 你想从终端读取或写入工作区文件中的叶节点
    - 你正在针对工作区状态编写脚本，并且想要一种稳定且与类型无关的寻址方案
    - 你正在调试一个 `oc://` 路径（验证语法，查看它解析到什么）
summary: 用于 `openclaw path` 的 CLI 参考（通过 `oc://` 寻址方案检查和编辑工作区文件）
title: 路径
x-i18n:
    generated_at: "2026-07-05T11:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

对 `oc://` 地址方案的 Shell 访问：一种按类型分派的路径语法，用于检查和编辑可寻址的工作区文件（markdown、jsonc、jsonl、yaml/yml/lobster）。自托管用户、插件作者和编辑器扩展可用它读取、查找或更新一个狭窄位置，而无需为每种文件手写解析器。

`path` 由内置的可选 `oc-path` 插件提供。首次使用前先启用它：

```bash
openclaw plugins enable oc-path
```

CLI 动词映射了地址模型：

- `resolve` 是具体且单一匹配的。
- `find` 是用于通配符、并集、谓词和位置展开的多匹配动词。
- `set` 只接受具体路径或插入标记；通配符模式会在写入前被拒绝。
- `validate` 解析路径，不访问文件系统。
- `emit` 通过解析 + 发射对文件做往返处理（字节保真诊断）。

## 为什么使用它

OpenClaw 状态分散在人工编辑的 markdown、带注释的 JSONC 配置、仅追加的 JSONL 日志，以及 YAML workflow/spec 文件中。脚本、钩子和智能体经常只需要这些文件里的一个小值：frontmatter 键、插件设置、日志记录字段、YAML 步骤，或某个命名章节下的项目符号条目。

`openclaw path` 为这些调用方提供稳定地址，而不是针对每种文件类型写一次性的 grep、正则表达式或解析器。同一个 `oc://` 路径可以在终端中验证、解析、搜索、试运行和写入，这让狭窄自动化更容易审查和重放。它会保留文件其余部分，因此写入一个叶子节点不会扰动注释、换行符或附近格式。

当你想操作的对象有逻辑地址，但文件形状各不相同时使用它：

- 钩子从带注释的 JSONC 中读取一个设置，并在写回值时不丢失注释。
- 维护脚本在 JSONL 日志中查找每个匹配的事件字段，而无需把整个日志加载进自定义解析器。
- 编辑器按 slug 跳转到 markdown 章节或项目符号条目，然后渲染它解析到的确切行。
- 智能体在应用小型工作区编辑前先试运行，并让变更字节在审查中可见。

对于普通的整文件编辑、复杂配置迁移或特定记忆写入，请跳过 `openclaw path`；这些应使用所属命令或插件。`path` 适用于小型、可寻址的文件操作，此时可重复的终端命令比又一个定制解析器更合适。

## 使用方式

从人工编辑的配置文件中读取一个值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

预览写入而不触碰磁盘：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在仅追加的 JSONL 日志中查找匹配记录：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

按章节和条目定位 markdown 中的一条指令，而不是按行号定位：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在 CI 或预检脚本中验证路径，然后脚本再读取或写入：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

这些命令设计为可复制到 Shell 脚本中。当调用方需要结构化输出时使用 `--json`，当人员检查结果时使用 `--human`。

## 工作原理

1. 将 `oc://` 地址解析为槽位：文件、章节、条目、字段，以及可选的会话查询。
2. 根据目标扩展名选择文件类型适配器（`.md`、`.jsonc`、`.json`、`.jsonl`、`.ndjson`、`.yaml`、`.yml`、`.lobster`）。
3. 按该文件类型的结构解析槽位：markdown 标题/条目、JSONC 对象键/数组索引、JSONL 行记录，或 YAML 映射/序列节点。
4. 对于 `set`，通过同一个适配器发射编辑后的字节，因此在该类型支持时，文件未触碰部分会保留其注释、换行符和附近格式。

`resolve` 和 `set` 需要一个具体目标。`find` 是探索性动词：它会把通配符、并集、谓词和序数展开为具体匹配，供你在选择一个进行写入前检查。

## 子命令

| 子命令                  | 用途                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| `resolve <oc-path>`     | 打印路径处的具体匹配（或“未找到”）。                                    |
| `find <pattern>`        | 枚举通配符 / 并集 / 谓词路径的匹配。                                    |
| `set <oc-path> <value>` | 在具体路径写入叶子节点或插入目标。支持 `--dry-run`。                    |
| `validate <oc-path>`    | 仅解析；打印结构分解（文件 / 章节 / 条目 / 字段）。                     |
| `emit <file>`           | 通过解析 + 发射对文件做往返处理（字节保真诊断）。                      |

## 全局标志

| 标志            | 适用于                           | 用途                                                                     |
| --------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`、`find`、`set`、`emit` | 针对此目录解析文件槽位（默认：`process.cwd()`）。                        |
| `--file <path>` | `resolve`、`find`、`set`、`emit` | 覆盖文件槽位解析后的路径（绝对访问）。                                   |
| `--json`        | 全部                             | 强制 JSON 输出（stdout 不是 TTY 时的默认值）。                           |
| `--human`       | 全部                             | 强制人工可读输出（stdout 是 TTY 时的默认值）。                           |
| `--value-json`  | `set`                            | 将 `<value>` 作为 JSON 解析，用于 JSON/JSONC/JSONL 叶子节点替换。        |
| `--dry-run`     | `set`                            | 打印将要写入的字节，但不实际写入。                                       |
| `--diff`        | `set`（需要 `--dry-run`）        | 打印统一 diff，而不是完整字节。                                          |

`validate` 只接受 `--json` / `--human`；它不访问文件系统，因此 `--cwd` 和 `--file` 不适用。

## `oc://` 语法

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

槽位规则：`field` 需要 `item`，而 `item` 需要 `section`。跨全部四个槽位：

- **带引号的片段** — `"a/b.c"` 会保留 `/` 和 `.` 分隔符。内容按字节字面量处理；引号内不允许出现 `"` 和 `\`。文件槽位也感知引号：`oc://"skills/email-drafter"/Tools/$last` 会把 `skills/email-drafter` 视为单个文件路径。
- **谓词** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、`[k>=v]`。数值运算符要求两侧都能强制转换为有限数字。
- **并集** — `{a,b,c}` 匹配任一备选项。
- **通配符** — `*`（单个子片段）和 `**`（零个或更多，递归）。`find` 接受这些；`resolve` 和 `set` 会因歧义而拒绝它们。
- **位置** — `$first` / `$last` 解析为第一个 / 最后一个索引或声明的键。
- **序数** — `#N` 表示按文档顺序的第 N 个匹配。
- **插入标记** — `+`、`+key`、`+nnn`，用于键控 / 索引插入（与 `set` 一起使用）。
- **会话作用域** — `?session=cron-daily` 等。与槽位嵌套正交。会话值是原始值，不做百分号解码；它们不得包含控制字符或保留查询分隔符（`?`、`&`、`%`）。

带引号、谓词或并集片段外的保留字符（`?`、`&`、`%`）会被拒绝。控制字符（U+0000-U+001F、U+007F）在任何位置都会被拒绝，包括 `session` 查询值。

对于规范路径，保证 `formatOcPath(parseOcPath(path)) === path`。非规范查询参数会被忽略，但第一个非空 `session=` 值除外。

硬性限制：路径上限为 4096 字节，最多 4 个槽位（文件/章节/条目/字段），每个槽位最多 64 个点分子片段，深层 JSON 路径最多 256 层嵌套遍历。另外，对于任何会加载文件的动词，超过 16 MiB 的 JSONC/JSON 文件输入都会以解析诊断拒绝，而不是被解析。

## 按文件类型寻址

| 类型          | 文件扩展名                  | 寻址模型                                                                                            |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | 按 slug 寻址 H2 章节，按 slug 或 `#N` 寻址项目符号条目，通过 `[frontmatter]` 寻址 frontmatter。      |
| JSONC/JSON    | `.jsonc`、`.json`           | 对象键和数组索引；除非加引号，否则点号会拆分嵌套子片段。                                           |
| JSONL         | `.jsonl`、`.ndjson`         | 顶层行地址（`L1`、`L2`、`$first`、`$last`），然后在该行内按 JSONC 风格向下寻址。                    |
| YAML/.lobster | `.yaml`、`.yml`、`.lobster` | 映射键和序列索引；注释和流式样式由 YAML 文档 API 处理。                                            |

`resolve` 返回结构化匹配：`root`、`node`、`leaf` 或 `insertion-point`，并带有从 1 开始的行号。叶子值会以文本加 `leafType` 的形式暴露，因此插件作者可以渲染预览，而不依赖每种类型的 AST 形状。

## 变更契约

`set` 写入一个具体目标：

- Markdown frontmatter 值和 `- key: value` 条目字段是字符串叶子节点。Markdown 插入会追加章节、frontmatter 键或章节条目，并为变更后的文件渲染规范 markdown 形状。章节正文不能通过 `set` 作为整体写入。
- JSONC 叶子写入会把字符串值强制转换为现有叶子类型（`string`、有限 `number`、`true`/`false` 或 `null`）。当 JSONC/JSON/JSONL 叶子替换应将 `<value>` 作为 JSON 解析且可能改变形状时，使用 `--value-json`，例如将字符串 secret-ref 简写替换为对象。JSONC 对象和数组插入会将 `<value>` 作为 JSON 解析，并为普通叶子写入使用 `jsonc-parser` 编辑路径，保留注释和附近格式。
- JSONL 叶子写入会像 JSONC 一样在行内强制转换。整行替换和追加会将 `<value>` 作为 JSON 解析。渲染后的 JSONL 会保留文件的主导 LF/CRLF 换行约定（按文件中的换行符多数投票，因此一个大多为 CRLF 的文件即使有少量零散 LF，也会保持 CRLF）。
- YAML 叶子写入会强制转换为现有标量类型（`string`、有限 `number`、`true`/`false` 或 `null`）。YAML 插入使用内置 `yaml` 包的文档 API 进行映射/序列更新。带解析器错误的格式错误 YAML 文档会在变更前以 `parse-error` 拒绝。

当确切字节很重要时，请在用户可见写入前使用 `--dry-run`。JSONC 和 YAML 编辑会修补现有文档（通过 `jsonc-parser` 或 `yaml` 文档 API），因此未触碰字节通常会保留；markdown 在任何编辑时都会从其解析结构重建文件，这可能会规范化变更叶子节点之外的偶然格式。当你希望预览以聚焦的前后补丁呈现，而不是完整渲染文件时，添加 `--diff`。

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

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
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

## 按文件类型分类的示例

同样五个动词适用于所有类型；寻址方案会根据文件扩展名分发。

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
通过 slug 匹配 `## Tools` 标题，并且条目叶节点会保留其 slug 形式，
即使源内容使用下划线也是如此（`send_email` 会变成 `send-email`）。

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

JSONC 编辑会通过 `jsonc-parser` 处理，因此注释和空白会在一次
`set` 后保留下来。先使用 `--dry-run` 运行，以便在提交前检查字节内容。
`.json` 文件使用与 `.jsonc` 相同的适配器和编辑路径。

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

每一行都是一条记录。不知道行号时，可以按谓词（`[event=action]`）
寻址；知道行号时，可以按规范的 `LN` 片段寻址。
`.ndjson` 文件使用与 `.jsonl` 相同的适配器。

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

YAML 使用 `yaml` 包的 `Document` API，而不是手写解析器，因此普通的解析/发出往返会保留注释和编写形态，
同时解析后的路径会使用与 JSONC 相同的映射键 / 序列索引模型。
同一个适配器会处理 `.yaml`、`.yml` 和 `.lobster` 文件。

## 子命令参考

### `resolve <oc-path>`

读取单个叶节点或节点。通配符会被拒绝，请使用 `find` 处理通配符。
匹配时退出码为 `0`，干净未命中时为 `1`，解析错误或模式被拒绝时为 `2`。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

枚举通配符 / 谓词 / 联合模式的每个匹配项。至少有一个匹配时退出码为 `0`，零匹配时为 `1`。文件槽通配符会以 `OC_PATH_FILE_WILDCARD_UNSUPPORTED` 拒绝；请传入具体文件（多文件 glob 是后续功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

写入叶子节点。搭配 `--dry-run` 可预览将写入的字节，而不改动文件。添加 `--diff` 可预览统一 diff。写入成功时退出码为 `0`，底层介质拒绝时为 `1`（例如命中哨兵保护），解析错误时为 `2`。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

如果命名子节点尚不存在，`+key` 插入标记会创建它；`+nnn` 和裸 `+` 分别用于索引插入和追加插入。

### `validate <oc-path>`

仅解析检查。不会访问文件系统。当你想在替换变量前确认模板路径格式正确，或想查看结构拆解以便调试时很有用：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有效时退出码为 `0`，无效时为 `1`（带有结构化 `code` 和
`message`），参数错误时为 `2`。

### `emit <file>`

通过按类型的解析器和输出器对文件做往返处理。对于正常文件，输出应与输入
字节级完全相同；出现差异表示解析器 bug 或触发了哨兵。适用于在
真实输入上调试基底行为。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 退出码

| 代码 | 含义                                                                       |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve` / `find`：至少一个匹配项。`set`：写入成功。） |
| `1`  | 无匹配项，或 `set` 被基底拒绝（无系统级错误）。      |
| `2`  | 参数或解析错误。                                                   |

## 输出模式

`openclaw path` 支持 TTY 感知：在终端上输出人类可读内容，当 stdout
被管道传输或重定向时输出 JSON。`--json` 和 `--human` 会覆盖
自动检测。

## 说明

- `set` 通过基底的输出路径写入字节，该路径会自动应用
  密文遮盖哨兵保护。携带
  `__OPENCLAW_REDACTED__`（原样或作为子字符串）的叶节点会在写入
  时被拒绝。
- JSONC 解析和叶节点编辑使用插件本地的 `jsonc-parser`
  依赖，因此普通叶节点写入会保留注释和格式，而不是经过手写解析器/重新渲染路径。
- `path` 不感知最后已知良好（LKG）配置跟踪或恢复；
  该生命周期由其他位置负责。如果你通过 `path` 编辑的文件
  也由 LKG 跟踪，则下一次配置读取会决定是提升它还是恢复它；将
  `path` 编辑视为对该文件的任何其他直接写入。

## 相关

- [CLI 参考](/zh-CN/cli)
