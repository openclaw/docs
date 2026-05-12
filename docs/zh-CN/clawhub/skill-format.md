---
read_when:
    - 发布 Skills
    - 调试发布/同步失败
summary: Skill 文件夹格式、必需文件、允许的文件类型、限制。
x-i18n:
    generated_at: "2026-05-12T08:44:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# 技能格式

## 磁盘上

技能是一个文件夹。

必需：

- `SKILL.md`（或 `skill.md`）

可选：

- 任意支持性的_基于文本_文件（见“允许的文件”）
- `.clawhubignore`（发布/同步的忽略模式，旧版 `.clawdhubignore`）
- `.gitignore`（也会被遵循）

本地安装元数据（由 CLI 写入）：

- `<skill>/.clawhub/origin.json`（旧版 `.clawdhub`）

工作目录安装状态（由 CLI 写入）：

- `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）

## `SKILL.md`

- Markdown，可带可选的 YAML frontmatter。
- 服务器在发布期间从 frontmatter 提取元数据。
- `description` 会在 UI/搜索中用作技能摘要。

## Frontmatter 元数据

技能元数据在你的 `SKILL.md` 顶部的 YAML frontmatter 中声明。这会告诉注册表（以及安全分析）你的技能运行需要什么。

### 基础 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### 运行时元数据（`metadata.openclaw`）

在 `metadata.openclaw` 下声明你的技能运行时要求（别名：`metadata.clawdbot`、`metadata.clawdis`）。

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

对于技能运行前必须存在的环境变量，使用 `requires.env`。当你需要为每个变量提供元数据时，使用 `envVars`，包括带有 `required: false` 的可选变量。

### 完整字段参考

| 字段               | 类型       | 描述                                                                                                                                          |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | 你的技能期望的必需环境变量。                                                                                                                  |
| `requires.bins`    | `string[]` | 必须全部安装的 CLI 二进制文件。                                                                                                               |
| `requires.anyBins` | `string[]` | 至少必须存在一个的 CLI 二进制文件。                                                                                                           |
| `requires.config`  | `string[]` | 你的技能会读取的配置文件路径。                                                                                                                |
| `primaryEnv`       | `string`   | 你的技能的主要凭证环境变量。                                                                                                                  |
| `envVars`          | `array`    | 环境变量声明，包含 `name`、可选的 `required` 和可选的 `description`。对于可选环境变量，设置 `required: false`。                              |
| `always`           | `boolean`  | 如果为 `true`，技能始终处于活动状态（无需显式安装）。                                                                                        |
| `skillKey`         | `string`   | 覆盖技能的调用键。                                                                                                                            |
| `emoji`            | `string`   | 技能的显示 emoji。                                                                                                                            |
| `homepage`         | `string`   | 技能主页或文档的 URL。                                                                                                                        |
| `os`               | `string[]` | OS 限制（例如 `["macos"]`、`["linux"]`）。                                                                                                    |
| `install`          | `array`    | 依赖项的安装规范（见下文）。                                                                                                                  |
| `nix`              | `object`   | Nix 插件规范（见 README）。                                                                                                                   |
| `config`           | `object`   | Clawdbot 配置规范（见 README）。                                                                                                              |

### 安装规范

如果你的技能需要安装依赖项，请在 `install` 数组中声明它们：

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

支持的安装类型：`brew`、`node`、`go`、`uv`。

### 可选环境变量

在 `metadata.openclaw.envVars` 下声明可选环境变量，并设置 `required: false`。不要将可选条目添加到 `requires.env`，因为 `requires.env` 表示没有这些变量时技能无法运行。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### 为什么这很重要

ClawHub 的安全分析会检查你的技能声明的内容是否与其实际行为匹配。如果你的代码引用了 `TODOIST_API_KEY`，但你的 frontmatter 没有在 `requires.env`、`primaryEnv` 或 `envVars` 下声明它，分析会标记元数据不匹配。保持声明准确有助于你的技能通过审核，并帮助用户理解他们正在安装什么。

### 示例：完整 frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 允许的文件

发布只接受“基于文本”的文件。

- 扩展名允许列表位于 `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）。
- 脚本文件上传后仍会被扫描；PowerShell `.ps1`、`.psm1` 和 `.psd1` 文件会作为文本接受。
- 以 `text/` 开头的内容类型会被视为文本；此外还有一个小型允许列表（JSON/YAML/TOML/JS/TS/Markdown/SVG）。

限制（服务器端）：

- 总包大小：50MB。
- 嵌入文本包括 `SKILL.md` + 最多约 40 个非 `.md` 文件（尽力上限）。

## Slug

- 默认从文件夹名称派生。
- 必须为小写且 URL 安全：`^[a-z0-9][a-z0-9-]*$`。

## 版本控制 + 标签

- 每次发布都会创建一个新版本（semver）。
- 标签是指向某个版本的字符串指针；常用 `latest`。

## 许可证

- ClawHub 上发布的所有 Skills 均基于 `MIT-0` 许可。
- 任何人都可以使用、修改和再分发已发布的 Skills，包括商业用途。
- 不需要署名。
- 不要在 `SKILL.md` 中添加冲突的许可条款；ClawHub 不支持按技能覆盖许可证。

## 付费 Skills

- ClawHub 不支持付费 Skills、按技能定价、付费墙或收入分成。
- 不要向 `SKILL.md` 添加定价元数据；它不是技能格式的一部分，也不会让已发布的技能变为付费。
- 如果你的技能集成了付费第三方服务，请在技能说明和环境变量声明中清楚说明外部费用和所需账号（必需变量使用 `requires.env`，可选变量使用带有 `required: false` 的 `envVars`）。
