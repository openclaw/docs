---
read_when:
    - 使用 ClawHub CLI
    - 调试安装、更新、发布或同步
summary: CLI 参考：命令、标志、配置、锁定文件、同步行为。
x-i18n:
    generated_at: "2026-05-12T00:56:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 852c15f48e414364303f77873b0c531d2b80478a99cb816719c00972c4ae2203
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI 包：`clawhub`，bin：`clawhub`。

使用 npm 或 pnpm 全局安装：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

然后验证它：

```bash
clawhub --help
clawhub login
clawhub whoami
```

## 全局标志

- `--workdir <dir>`：工作目录（默认：cwd；如果已配置，则回退到 Clawdbot 工作区）
- `--dir <dir>`：workdir 下的安装目录（默认：`skills`）
- `--site <url>`：浏览器登录的基础 URL（默认：`https://clawhub.ai`）
- `--registry <url>`：API 基础 URL（默认：自动发现，否则为 `https://clawhub.ai`）
- `--no-input`：禁用提示

环境变量等价项：

- `CLAWHUB_SITE`（旧版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（旧版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（旧版 `CLAWDHUB_WORKDIR`）

### HTTP 代理

CLI 会遵循标准 HTTP 代理环境变量，适用于位于企业代理或受限网络后的系统：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

设置这些变量中的任意一个时，CLI 会通过指定代理路由出站请求。`HTTPS_PROXY` 用于 HTTPS 请求，`HTTP_PROXY` 用于普通 HTTP。`NO_PROXY` / `no_proxy` 会用于对特定主机或域名绕过代理。

这在直接出站连接被阻止的系统上是必需的（例如 Docker 容器、仅能通过代理联网的 Hetzner VPS、企业防火墙）。

示例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未设置代理变量时，行为不变（直接连接）。

## 配置文件

存储你的 API 令牌 + 缓存的注册表 URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 旧版回退：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，CLI 会复用旧版路径
- 覆盖：`CLAWHUB_CONFIG_PATH`（旧版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 默认：打开浏览器到 `<site>/cli/auth`，并通过 loopback 回调完成。
- 无头模式：`clawhub login --token clh_...`
- 远程/无头交互式：`clawhub login --device` 会打印一个代码，并在你前往 `<site>/cli/device` 授权时等待。

### `whoami`

- 通过 `/api/v1/whoami` 验证已存储的令牌。

### `star <slug>` / `unstar <slug>`

- 从你的精选中添加/移除一个技能。
- 调用 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 跳过确认。

### `search <query...>`

- 调用 `/api/v1/search?q=...`。
- 搜索会先偏好精确的 slug/名称 token 匹配，然后才考虑下载热度。像 `map` 这样的独立 slug token，比 `amap` 内部的子字符串更强地匹配 `personal-map`。
- 下载量只是一个较小的人气先验，不保证排在前面。
- 如果某个技能应该出现但没有出现，请在已登录状态下运行 `clawhub inspect <slug>`，在重命名元数据之前检查所有者可见的审核诊断信息。

### `explore`

- 通过 `/api/v1/skills?limit=...&sort=createdAt` 列出最新技能（按 `createdAt` 降序排序）。
- 标志：
  - `--limit <n>`（1-200，默认：25）
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending`（默认：newest）
  - `--json`（机器可读输出）
- 输出：`<slug>  v<version>  <age>  <summary>`（摘要截断为 50 个字符）。

### `inspect <slug>`

- 获取技能元数据和版本文件，但不安装。
- `--version <version>`：检查指定版本（默认：latest）。
- `--tag <tag>`：检查带标签的版本（例如 `latest`）。
- `--versions`：列出版本历史（第一页）。
- `--limit <n>`：要列出的最大版本数（1-200）。
- `--files`：列出所选版本的文件。
- `--file <path>`：获取原始文件内容（仅文本文件；200KB 限制）。
- `--json`：机器可读输出。

### `install <slug>`

- 通过 `/api/v1/skills/<slug>` 解析最新版本。
- 通过 `/api/v1/download` 下载 zip。
- 解压到 `<workdir>/<dir>/<slug>`。
- 拒绝覆盖已固定的技能；请先运行 `clawhub unpin <slug>`。
- 写入：
  - `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（旧版 `.clawdhub`）

### `uninstall <slug>`

- 移除 `<workdir>/<dir>/<slug>` 并删除 lockfile 条目。
- 交互式：请求确认。
- 非交互式（`--no-input`）：需要 `--yes`。

### `list`

- 读取 `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）。
- 在通过 `clawhub pin` 冻结的技能旁显示 `pinned`，包括可选原因。

### `pin <slug>`

- 在锁文件中将已安装的技能标记为已固定。
- `--reason <text>` 记录该技能被冻结的原因。
- 已固定的技能会被 `update --all` 跳过，并且会拒绝直接 `update <slug>`。
- 已固定的技能也会拒绝 `install --force`，因此本地字节不会被意外替换。

### `unpin <slug>`

- 从已安装技能中移除锁文件固定项，让后续更新可以修改它。

### `update [slug]` / `update --all`

- 从本地文件计算指纹。
- 如果指纹匹配已知版本：不提示。
- 如果指纹不匹配：
  - 默认拒绝
  - 使用 `--force` 覆盖（如果是交互式，则提示）
- 已固定的技能永远不会被 `--force` 更新。
- `update <slug>` 会对已固定的 slug 快速失败，并提示你先运行 `clawhub unpin <slug>`。
- `update --all` 会跳过已固定的 slug，并打印保留冻结项的摘要。

### `skill publish <path>`

- 通过 `POST /api/v1/skills`（multipart）发布。
- 需要 semver：`--version 1.2.3`。
- 当执行者拥有发布者访问权限时，`--owner <handle>` 会在组织/用户发布者 handle 下发布。
- `--migrate-owner` 会在发布新版本时将现有技能移动到 `--owner`。需要同时拥有两个发布者的管理员/所有者访问权限。
- 所有者和审核行为在 `docs/publishing.md` 中说明。
- 发布技能表示它在 ClawHub 上以 `MIT-0` 发布。
- 已发布技能可免费使用、修改和再分发，无需署名。
- ClawHub 不支持付费技能或按技能定价。
- `--clawscan-note <text>` 添加一条 ClawScan 备注。此备注会向 ClawScan 提供上下文，用于说明可能看起来异常的行为，例如网络访问、原生主机访问或提供商专用凭证。该备注会存储在已发布版本上。
- 旧版别名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- 软删除技能（所有者、版主或管理员）。
- 调用 `DELETE /api/v1/skills/{slug}`。
- 所有者发起的软删除会保留该 slug 30 天；命令会打印到期时间。
- `--reason <text>` 会在技能和审计日志上记录一条管理备注。
- `--note <text>` 是 `--reason` 的别名。
- `--yes` 跳过确认。

### `undelete <slug>`

- 恢复隐藏的技能（所有者、版主或管理员）。
- 调用 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 会在技能和审计日志上记录一条管理备注。
- `--note <text>` 是 `--reason` 的别名。
- `--yes` 跳过确认。

### `hide <slug>`

- 隐藏技能（所有者、版主或管理员）。
- `delete` 的别名。

### `unhide <slug>`

- 取消隐藏技能（所有者、版主或管理员）。
- `undelete` 的别名。

### `skill rename <slug> <new-slug>`

- 重命名拥有的技能，并将之前的 slug 保留为重定向别名。
- 调用 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 跳过确认。

### `skill merge <source-slug> <target-slug>`

- 将一个拥有的技能合并到另一个拥有的技能中。
- 源 slug 停止公开列出，并成为指向目标的重定向别名。
- 调用 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 跳过确认。

### `transfer`

- 所有权转移工作流。
- 转移到用户 handle 会创建一个待处理请求，由接收者接受。
- 只有当执行者同时拥有当前所有者和目标发布者的管理员访问权限时，转移到组织/发布者 handle 才会立即生效。
- 子命令：
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- 端点：
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- 通过 `GET /api/v1/packages` 和 `GET /api/v1/packages/search` 浏览或搜索统一包目录。
- 将其用于插件和其他包族条目；顶层 `search` 仍然是技能搜索界面。
- 标志：
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>`（1-100，默认：25）
  - `--json`

示例：

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- 获取包元数据而不安装。
- 将其用于插件元数据、兼容性、验证、来源以及版本/文件检查。
- `--version <version>`：检查特定版本（默认：latest）。
- `--tag <tag>`：检查带标签的版本（例如 `latest`）。
- `--versions`：列出版本历史（第一页）。
- `--limit <n>`：要列出的最大版本数（1-100）。
- `--files`：列出所选版本的文件。
- `--file <path>`：获取原始文件内容（仅文本文件；200KB 限制）。
- `--json`：机器可读输出。

### `package download <name>`

- 通过 `GET /api/v1/packages/{name}/versions/{version}/artifact` 解析包版本。
- 从解析器的 `downloadUrl` 下载构件。
- 验证所有构件的 ClawHub SHA-256。
- 对于 ClawPack npm-pack 构件，还会验证 npm `sha512` integrity、npm shasum，以及 tarball 的 `package.json` 名称/版本。
- 旧版 ZIP 版本通过旧版 ZIP 路由下载。
- 标志：
  - `--version <version>`：下载特定版本。
  - `--tag <tag>`：下载带标签的版本（默认：`latest`）。
  - `-o, --output <path>`：输出文件或目录。
  - `--force`：覆盖现有输出文件。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 为本地构件计算 ClawHub SHA-256、npm `sha512` integrity 和 npm shasum。
- 使用 `--package` 时，会从 ClawHub 解析预期元数据，并将本地文件与已发布构件元数据进行比较。
- 使用直接摘要标志时，无需网络查询即可验证。
- 标志：
  - `--package <name>`：用于解析预期构件元数据的包名称。
  - `--version <version>` 或 `--tag <tag>`：预期包版本。
  - `--sha256 <hex>`：预期 ClawHub SHA-256。
  - `--npm-integrity <sri>`：预期 npm integrity。
  - `--npm-shasum <sha1>`：预期 npm shasum。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- 软删除一个包及其所有版本。
- 需要包所有者、组织发布者所有者/管理员、平台审核员或平台管理员权限。
- 标志：
  - `--yes`：跳过确认。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- 恢复一个已软删除的包及其版本。
- 需要包所有者、组织发布者所有者/管理员、平台审核员或平台管理员权限。
- 调用 `POST /api/v1/packages/{name}/undelete`。
- 标志：
  - `--yes`：跳过确认。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 将包转移给另一个发布者。
- 需要同时拥有当前包所有者和目标发布者的管理员访问权限，除非由平台管理员执行。
- 带作用域的包名必须转移给匹配的作用域所有者。
- 调用 `POST /api/v1/packages/{name}/transfer`。
- 标志：
  - `--to <owner>`：目标发布者 handle。
  - `--reason <text>`：可选审计原因。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- 用于向审核员举报包的已认证命令。
- 调用 `POST /api/v1/packages/{name}/report`。
- 举报在包级别，可选择关联到某个版本，并会对审核员可见以供审查。
- 举报本身不会自动隐藏包或阻止下载。
- 标志：
  - `--version <version>`：可选的包版本，用于附加到举报。
  - `--reason <text>`：必填的举报原因。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 用于检查包审核可见性的所有者命令。
- 调用 `GET /api/v1/packages/{name}/moderation`。
- 显示当前包扫描状态、未处理举报数量、最新版本的人工审核状态、下载阻止状态和审核原因。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 检查包是否已为将来被 OpenClaw 使用做好准备。
- 调用 `GET /api/v1/packages/{name}/readiness`。
- 报告官方状态、ClawPack 可用性、构件摘要、来源出处、OpenClaw 兼容性、主机目标、环境元数据和扫描状态的阻塞项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 显示面向操作者的迁移状态，用于可能替换内置 OpenClaw 插件的包。
- 调用与 `package readiness` 相同的计算型就绪端点，但打印以迁移为重点的状态、最新版本、官方包状态、检查项和阻塞项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- 通过 `POST /api/v1/packages` 发布代码插件或捆绑插件。
- `<source>` 接受：
  - 本地文件夹路径：`./my-plugin`
  - 本地 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub 仓库：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 元数据会从 `package.json`、`openclaw.plugin.json` 以及真实 OpenClaw 捆绑标记自动检测，例如 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` 源会被视为 ClawPack。CLI 会上传确切的 npm-pack 字节，并且只使用提取出的 `package/` 内容进行验证和元数据预填。
- 代码插件文件夹会在上传前打包成 ClawPack npm tarball，以便 OpenClaw 安装可以验证确切构件。捆绑插件文件夹仍使用提取文件发布路径。
- 对于 GitHub 源，来源归属会从仓库、解析后的 commit、ref 和子路径自动填充。
- 对于本地文件夹，当 origin remote 指向 GitHub 时，会从本地 git 自动检测来源归属。
- 外部代码插件必须显式声明 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
  顶层 `package.json.version` 不会被用作发布验证的回退。
- `--dry-run` 会预览解析后的发布 payload 而不上传。
- `--json` 会为 CI 发出机器可读输出。
- 当操作者拥有发布者访问权限时，`--owner <handle>` 会在用户或组织发布者 handle 下发布。
- `--clawscan-note <text>` 添加一条 ClawScan 备注。此备注为 ClawScan 提供上下文，用于说明否则可能看起来异常的行为，例如网络访问、原生主机访问或特定提供商的凭据。该备注会存储在已发布版本上。
- 带作用域的包名必须匹配所选所有者。请参阅 `docs/publishing.md`。
- 现有标志（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作为覆盖项使用。
- 私有 GitHub 仓库需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### 推荐本地流程

先使用 `--dry-run`，这样你可以在创建实时版本前确认解析后的包元数据和来源归属：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本地文件夹流程

对于代码插件，文件夹发布会从包文件夹构建并上传 ClawPack 构件：

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### 用于 `--family code-plugin` 的最小 `package.json`

外部代码插件需要在 `package.json` 中包含少量 OpenClaw 元数据。这个最小清单足以成功发布：

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

必填字段：

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

注：

- `package.json.version` 是你的包发布版本，但它不会被用作 OpenClaw 兼容性/构建验证的回退。
- `openclaw.hostTargets` 和 `openclaw.environment` 是可选元数据。
  ClawHub 可能会在它们存在时显示它们，但发布不要求提供。
- `openclaw.compat.minGatewayVersion` 和
  `openclaw.build.pluginSdkVersion` 是可选附加项，如果你想发布更详细的兼容性元数据，可以使用它们。
- 如果你使用的是较旧的 `clawhub` CLI 版本，请在发布前升级，以便本地预检在上传前运行。

#### GitHub Actions

ClawHub 还为插件仓库提供一个官方可复用工作流：
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/426a2a78792b7ebcf5aa2a08c595cc618a197c66/.github/workflows/package-publish.yml)。

典型调用方设置：

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

注：

- 可复用工作流默认将 `source` 设为调用方仓库。
- 对于 monorepo，请传入 `source_path`，以便工作流发布插件包文件夹，例如 `source_path: extensions/codex`。
- 将可复用工作流固定到稳定 tag 或完整 commit SHA。不要从 `@main` 运行发布。
- `pull_request` 应使用 `dry_run: true`，这样 CI 不会产生污染。
- 真实发布应限制在可信事件中，例如 `workflow_dispatch` 或 tag push。
- 无需 secret 的可信发布只适用于 `workflow_dispatch`；tag push 仍需要 `clawhub_token`。
- 保持 `clawhub_token` 可用，用于首次发布、不受信任的包或 break-glass 发布。
- 工作流会将 JSON 结果作为构件上传，并将其公开为工作流输出。

### `sync`

- 扫描本地技能文件夹并发布新增或已更改的技能。
- 根目录可以是任何文件夹：技能目录，或带有 `SKILL.md` 的单个技能文件夹。
- 当存在 `~/.clawdbot/clawdbot.json` 时，自动添加 Clawdbot 技能根目录：
  - `agent.workspace/skills`（主智能体）
  - `routing.agents.*.workspace/skills`（每个智能体）
  - `~/.clawdbot/skills`（共享）
  - `skills.load.extraDirs`（共享包）
- 遵循 `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` 和 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`。
- 标志：
  - `--root <dir...>` 额外扫描根目录
  - `--all` 不提示直接上传
  - `--dry-run` 仅显示计划
  - `--bump patch|minor|major`（默认：patch）
  - `--changelog <text>`（非交互式）
  - `--tags a,b,c`（默认：latest）
  - `--concurrency <n>`（默认：4）

遥测：

- 登录时会在 `sync` 期间发送，除非设置了 `CLAWHUB_DISABLE_TELEMETRY=1`（旧版 `CLAWDHUB_DISABLE_TELEMETRY=1`）。
- 详情：`docs/telemetry.md`。
