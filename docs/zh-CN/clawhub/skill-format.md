---
read_when:
    - 发布 Skills
    - 调试发布失败
summary: 技能文件夹格式、必需文件、允许的文件类型、限制。
x-i18n:
    generated_at: "2026-07-01T02:57:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 格式

## 磁盘上

Skill 是一个文件夹。

必需：

- `SKILL.md`（或 `skill.md`；也接受旧版 `skills.md`）

可选：

- 任意辅助的_基于文本_文件（见“允许的文件”）
- `.clawhubignore`（用于发布的忽略模式，旧版 `.clawdhubignore`）
- `.gitignore`（也会遵守）

## GitHub 导入

网页版 GitHub 导入器比本地发布/同步更严格。它只会发现由已登录 GitHub 账号拥有的公开、非 fork 仓库中的 `SKILL.md` 或旧版 `skills.md` 文件。它不会导入私有仓库、fork、已归档/已禁用的仓库，或第三方公开仓库。

本地安装元数据（由 CLI 写入）：

- `<skill>/.clawhub/origin.json`（旧版 `.clawdhub`）

工作目录安装状态（由 CLI 写入）：

- `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）

## `SKILL.md`

- 带可选 YAML frontmatter 的 Markdown。
- 服务器在发布期间从 frontmatter 提取元数据。
- `description` 会用作 UI/搜索中的 Skill 摘要。

## Frontmatter 元数据

Skill 元数据在你的 `SKILL.md` 顶部的 YAML frontmatter 中声明。这会告诉注册表（以及安全分析）你的 Skill 运行需要什么。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### 运行时元数据（`metadata.openclaw`）

在 `metadata.openclaw`（别名：`metadata.clawdbot`、`metadata.clawdis`）下声明你的 Skill 的运行时要求。

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

对于 Skill 运行前必须存在的环境变量，使用 `requires.env`。当你需要每个变量的元数据时，请使用 `envVars`，包括带有 `required: false` 的可选变量。

### 完整字段参考

| 字段               | 类型       | 描述                                                                                                             |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | 你的 Skill 期望的必需环境变量。                                                                                  |
| `requires.bins`    | `string[]` | 必须全部安装的 CLI 二进制文件。                                                                                  |
| `requires.anyBins` | `string[]` | 至少必须存在其中一个的 CLI 二进制文件。                                                                          |
| `requires.config`  | `string[]` | 你的 Skill 读取的配置文件路径。                                                                                  |
| `primaryEnv`       | `string`   | 你的 Skill 的主凭证环境变量。                                                                                    |
| `envVars`          | `array`    | 带有 `name`、可选 `required` 和可选 `description` 的环境变量声明。对可选环境变量设置 `required: false`。          |
| `always`           | `boolean`  | 如果为 `true`，Skill 始终处于活动状态（无需显式安装）。                                                          |
| `skillKey`         | `string`   | 覆盖 Skill 的调用键。                                                                                            |
| `emoji`            | `string`   | Skill 的显示 emoji。                                                                                             |
| `homepage`         | `string`   | Skill 主页或文档的 URL。                                                                                         |
| `os`               | `string[]` | OS 限制（例如 `["macos"]`、`["linux"]`）。                                                                       |
| `install`          | `array`    | 依赖项的安装规范（见下文）。                                                                                     |
| `nix`              | `object`   | Nix 插件规范（见 README）。                                                                                      |
| `config`           | `object`   | Clawdbot 配置规范（见 README）。                                                                                 |

### 安装规范

如果你的 Skill 需要安装依赖项，请在 `install` 数组中声明它们：

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

在 `metadata.openclaw.envVars` 下声明可选环境变量，并设置 `required: false`。不要将可选条目添加到 `requires.env`，因为 `requires.env` 意味着没有它们 Skill 就无法运行。

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

ClawHub 的安全分析会检查你的 Skill 声明的内容是否与其实际行为匹配。如果你的代码引用 `TODOIST_API_KEY`，但你的 frontmatter 没有在 `requires.env`、`primaryEnv` 或 `envVars` 下声明它，分析会标记元数据不匹配。保持声明准确有助于你的 Skill 通过审核，也有助于用户理解他们正在安装什么。

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
- 脚本文件上传后仍会被扫描；PowerShell `.ps1`、`.psm1` 和 `.psd1` 文件会作为文本被接受。
- 以 `text/` 开头的内容类型会被视为文本；另有一个小型允许列表（JSON/YAML/TOML/JS/TS/Markdown/SVG）。

限制（服务器端）：

- 总 bundle 大小：50MB。
- 嵌入文本包括 `SKILL.md` + 最多约 40 个非 `.md` 文件（尽力上限）。

## Slug

- 默认从文件夹名称派生。
- 包作用域必须与 ClawHub 发布者 handle 完全匹配。发布者 handle 可使用小写字母、数字、连字符、点和下划线；必须以小写字母或数字开头和结尾。
- 包 slug 必须为小写且 npm 安全，例如 `@example.tools/demo-plugin` 或 `demo-plugin`。

## 版本控制 + 标签

- 每次发布都会创建一个新版本（semver）。
- 标签是指向版本的字符串指针；常用 `latest`。

## 许可证

- 所有发布到 ClawHub 的 Skills 均在 `MIT-0` 下授权。
- 任何人都可以使用、修改和重新分发已发布的 Skills，包括商业用途。
- 不要求署名。
- 不要在 `SKILL.md` 中添加冲突的许可条款；ClawHub 不支持按 Skill 覆盖许可证。

## 付费 Skills

- ClawHub 不支持付费 Skills、按 Skill 定价、付费墙或收入分成。
- 不要向 `SKILL.md` 添加定价元数据；它不是 Skill 格式的一部分，也不会让已发布的 Skill 变为付费。
- 如果你的 Skill 集成了付费第三方服务，请在 Skill 说明和环境变量声明中清楚记录外部费用和所需账号（必需变量用 `requires.env`，可选变量用带 `required: false` 的 `envVars`）。
