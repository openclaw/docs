---
read_when:
    - 发布技能
    - 调试发布失败
summary: Skills 文件夹格式、必需文件、允许的文件类型和限制。
x-i18n:
    generated_at: "2026-07-12T21:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 格式

## 磁盘上的结构

Skill 是一个文件夹。

必需：

- `SKILL.md`（或 `skill.md`；也接受旧版 `skills.md`）

可选：

- 任意辅助的_文本类_文件（参见“允许的文件”）
- `.clawhubignore`（发布时使用的忽略模式，旧版为 `.clawdhubignore`）
- `.gitignore`（同样会生效）

## GitHub 导入

Web 端 GitHub 导入器比本地发布/同步更严格。它仅会在已登录 GitHub 账户所拥有的公开、非复刻仓库中发现
`SKILL.md` 或旧版 `skills.md` 文件。它不会导入私有仓库、复刻仓库、
已归档/已禁用仓库或第三方公开仓库。

本地安装元数据（由 CLI 写入）：

- `<skill>/.clawhub/origin.json`（旧版为 `.clawdhub`）

工作目录安装状态（由 CLI 写入）：

- `<workdir>/.clawhub/lock.json`（旧版为 `.clawdhub`）

## `SKILL.md`

- 使用 Markdown，可包含可选的 YAML frontmatter。
- 发布时，服务器会从 frontmatter 中提取元数据。
- `description` 用作 UI/搜索中的 Skill 摘要。

为了保证 Agent Skills 的可移植性，`name` 应与父目录名称匹配，并使用
1–64 个小写字母、数字或连字符。ClawHub 会将可路由的 slug 与
目录显示名称分开保存，因此来自其他客户端的现有名称仍可发布，
且不会被静默改写。目录列表可能会在视觉上缩短过长的名称，
但不会更改存储的名称。

## Frontmatter 元数据

Skill 元数据在 `SKILL.md` 顶部的 YAML frontmatter 中声明。它会告知注册表（以及安全分析）你的 Skill 运行时需要哪些条件。

### 基础 frontmatter

```yaml
---
name: my-skill
description: 此 Skill 功能的简短摘要。
version: 1.0.0
---
```

### 运行时元数据（`metadata.openclaw`）

在 `metadata.openclaw` 下声明 Skill 的运行时要求（别名：`metadata.clawdbot`、`metadata.clawdis`）。

```yaml
---
name: my-skill
description: 通过 Todoist API 管理任务。
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

使用 `requires.env` 声明 Skill 运行前必须存在的环境变量。当你需要为每个变量提供元数据时（包括带有 `required: false` 的可选变量），请使用 `envVars`。

### 完整字段参考

| 字段               | 类型       | 描述                                                                                                                                              |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill 所需的环境变量。                                                                                                                            |
| `requires.bins`    | `string[]` | 必须全部安装的 CLI 二进制文件。                                                                                                                   |
| `requires.anyBins` | `string[]` | 至少必须存在一个的 CLI 二进制文件。                                                                                                               |
| `requires.config`  | `string[]` | Skill 读取的配置文件路径。                                                                                                                        |
| `primaryEnv`       | `string`   | Skill 使用的主要凭据环境变量。                                                                                                                    |
| `envVars`          | `array`    | 环境变量声明，包含 `name`、可选的 `required` 和可选的 `description`。对于可选环境变量，请设置 `required: false`。                                  |
| `always`           | `boolean`  | 如果为 `true`，Skill 将始终处于活动状态（无需显式安装）。                                                                                         |
| `skillKey`         | `string`   | 覆盖 Skill 的调用键。                                                                                                                             |
| `emoji`            | `string`   | Skill 的显示 emoji。                                                                                                                              |
| `homepage`         | `string`   | Skill 主页或文档的 URL。                                                                                                                          |
| `os`               | `string[]` | 操作系统限制（例如 `["macos"]`、`["linux"]`）。                                                                                                   |
| `install`          | `array`    | 依赖项的安装规范（见下文）。                                                                                                                      |
| `nix`              | `object`   | Nix 插件规范（参见 README）。                                                                                                                     |
| `config`           | `object`   | Clawdbot 配置规范（参见 README）。                                                                                                                |

### 安装规范

如果 Skill 需要安装依赖项，请在 `install` 数组中声明：

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

在 `metadata.openclaw.envVars` 下声明可选环境变量，并设置 `required: false`。不要将可选项添加到 `requires.env`，因为 `requires.env` 表示缺少这些变量时 Skill 无法运行。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: 用于已验证请求的 Todoist API 令牌。
      - name: TODOIST_PROJECT_ID
        required: false
        description: 用户未指定项目时使用的可选默认项目 ID。
```

### 这为何重要

ClawHub 的安全分析会检查 Skill 的声明是否与其实际行为一致。如果代码引用了 `TODOIST_API_KEY`，但 frontmatter 未在 `requires.env`、`primaryEnv` 或 `envVars` 下声明它，分析将标记元数据不匹配。保持声明准确有助于 Skill 通过审核，也能帮助用户了解他们正在安装的内容。

### 示例：完整 frontmatter

```yaml
---
name: todoist-cli
description: 从命令行管理 Todoist 任务、项目和标签。
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
        description: Todoist API 令牌。
      - name: TODOIST_PROJECT_ID
        required: false
        description: 可选的默认项目 ID。
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 允许的文件

发布仅接受“文本类”文件。

- 扩展名允许列表位于 `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）。
- 脚本文件上传后仍会被扫描；PowerShell `.ps1`、`.psm1` 和 `.psd1` 文件会作为文本接受。
- 以 `text/` 开头的内容类型会被视为文本；此外还有一小部分允许的类型（JSON/YAML/TOML/JS/TS/Markdown/SVG）。

限制（服务器端）：

- 包总大小：50MB。
- 嵌入文本包括 `SKILL.md` + 最多约 40 个非 `.md` 文件（尽力限制）。

## Slug

- 默认从文件夹名称派生。
- 包作用域必须与 ClawHub 发布者用户名完全匹配。发布者用户名可使用小写字母、数字、连字符、点和下划线；必须以小写字母或数字开头和结尾。
- 包 slug 必须为小写并符合 npm 安全命名规则，例如 `@example.tools/demo-plugin` 或 `demo-plugin`。

## 版本控制 + 标签

- 每次发布都会创建一个新版本（semver）。
- 标签是指向某个版本的字符串指针；通常使用 `latest`。

## 许可证

- 在 ClawHub 上发布的所有 Skills 均采用 `MIT-0` 许可证。
- 任何人都可以使用、修改和再分发已发布的 Skills，包括商业用途。
- 无需署名。
- 不要在 `SKILL.md` 中添加相冲突的许可条款；ClawHub 不支持为单个 Skill 覆盖许可证。

## 付费 Skills

- ClawHub 不支持付费 Skills、按 Skill 定价、付费墙或收入分成。
- 不要向 `SKILL.md` 添加定价元数据；它不是 Skill 格式的一部分，也不会让已发布的 Skill 变为付费 Skill。
- 如果 Skill 集成了付费第三方服务，请在 Skill 说明和环境变量声明中明确记录外部费用和所需账户（必需变量使用 `requires.env`，可选变量使用带有 `required: false` 的 `envVars`）。
