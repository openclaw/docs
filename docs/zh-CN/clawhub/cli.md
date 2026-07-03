---
read_when:
    - 使用 ClawHub CLI
    - 调试安装、更新或发布
summary: CLI 参考：命令、标志、配置和锁文件行为。
x-i18n:
    generated_at: "2026-07-03T09:21:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI 包：`clawhub`，二进制文件：`clawhub`。

使用 npm 或 pnpm 全局安装：

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

然后验证：

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

对应的环境变量：

- `CLAWHUB_SITE`（旧版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（旧版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（旧版 `CLAWDHUB_WORKDIR`）

### HTTP 代理

CLI 会遵循标准 HTTP 代理环境变量，适用于位于企业代理或受限网络后的系统：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

设置这些变量中的任意一个后，CLI 会通过指定代理路由出站请求。`HTTPS_PROXY` 用于 HTTPS 请求，`HTTP_PROXY` 用于普通 HTTP。`NO_PROXY` / `no_proxy` 会被遵循，用于对特定主机或域名绕过代理。

在直接出站连接被阻止的系统上，这是必需的（例如 Docker 容器、仅允许代理联网的 Hetzner VPS、企业防火墙）。

示例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未设置代理变量时，行为保持不变（直接连接）。

## 配置文件

存储你的 API token + 缓存的注册表 URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 旧版回退：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，CLI 会复用旧版路径
- 覆盖：`CLAWHUB_CONFIG_PATH`（旧版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 默认：打开浏览器到 `<site>/cli/auth`，并通过 loopback 回调完成。
- 无头模式：`clawhub login --token clh_...`
- 远程/无头交互模式：`clawhub login --device` 会打印一个代码，并在你前往 `<site>/cli/device` 授权时等待。

### `whoami`

- 通过 `/api/v1/whoami` 验证已存储的 token。

### `token`

- 将已存储的 API token 打印到 stdout。
- 适合把本地登录 token 通过管道传入 CI secret 设置命令。

### `star <skill>` / `unstar <skill>`

- 从你的高亮列表中添加/移除一个 skill。
- 调用 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 跳过确认。

### `search <query...>`

- 调用 `/api/v1/search?q=...`。
- 输出包含 skill slug、所有者 handle、显示名称和相关性分数。
- 搜索会先偏好精确的 slug/name token 匹配，然后才考虑下载热度。像 `map` 这样的独立 slug token 匹配 `personal-map` 的强度高于匹配 `amap` 内部的子字符串。
- 热度只是一个很小的排序先验，并不保证排在最前。
- 如果某个 skill 应该出现但没有出现，请在登录状态下运行 `clawhub inspect @owner/slug`，先检查所有者可见的审核诊断信息，再重命名元数据。

### `explore`

- 通过 `/api/v1/skills?limit=...&sort=createdAt` 列出最新 skills（按 `createdAt` 降序排序）。
- 标志：
  - `--limit <n>`（1-200，默认：25）
  - `--sort newest|updated|rating|downloads|trending`（默认：newest）。旧版安装排序别名仍可用于兼容。
  - `--json`（机器可读输出）
- 输出：`<slug>  v<version>  <age>  <summary>`（摘要截断为 50 个字符）。

### `inspect @owner/slug`

- 获取 skill 元数据和版本文件，但不安装。
- `--version <version>`：检查指定版本（默认：latest）。
- `--tag <tag>`：检查带标签的版本（例如 `latest`）。
- `--versions`：列出版本历史（第一页）。
- `--limit <n>`：要列出的最大版本数（1-200）。
- `--files`：列出所选版本的文件。
- `--file <path>`：获取原始文件内容（仅文本文件；200KB 限制）。
- `--json`：机器可读输出。

### `install @owner/slug`

- 解析指定所有者和 skill 的最新版本。
- 通过 `/api/v1/download` 下载 zip。
- 解压到 `<workdir>/<dir>/<slug>`。
- 拒绝覆盖已固定的 skills；请先运行 `clawhub unpin <skill>`。
- 写入：
  - `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（旧版 `.clawdhub`）

### `uninstall <skill>`

- 移除 `<workdir>/<dir>/<slug>` 并删除 lockfile 条目。
- 登录状态下会尽力发送遥测，以便停用当前安装计数。
- 交互模式：请求确认。
- 非交互模式（`--no-input`）：需要 `--yes`。

### `list`

- 读取 `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）。
- 对使用 `clawhub pin` 冻结的 skills 显示 `pinned`，包括可选原因。

### `pin <skill>`

- 在 lockfile 中将已安装的 skill 标记为 pinned。
- `--reason <text>` 记录该 skill 被冻结的原因。
- Pinned skills 会被 `update --all` 跳过，并会拒绝直接 `update <skill>`。
- Pinned skills 也会拒绝 `install --force`，避免本地字节被意外替换。

### `unpin <skill>`

- 从已安装 skill 的 lockfile 中移除 pin，使未来更新可以修改它。

### `update [@owner/slug]` / `update --all`

- 根据本地文件计算 fingerprint。
- 如果 fingerprint 匹配已知版本：不提示。
- 如果 fingerprint 不匹配：
  - 默认拒绝
  - 使用 `--force` 覆盖（或在交互模式下提示）
- Pinned skills 永远不会被 `--force` 更新。
- `update <skill>` 对 pinned skills 会快速失败，并提示你先运行 `clawhub unpin <skill>`。
- `update --all` 会跳过 pinned slugs，并打印哪些保持冻结的摘要。

### `skill publish <path>`

- 将本地 bundle fingerprint 与 ClawHub 比较；当内容已发布时成功退出。
- 新 skills 默认使用 `1.0.0`；已变更的 skills 默认使用下一个 patch 版本。
- `--version <version>` 显式选择版本，即使内容匹配现有版本也会发布。
- `--dry-run` 解析发布但不上传；`--json` 打印机器可读结果。
- `--owner <handle>` 在执行者拥有 publisher 访问权限时，使用 org/user publisher handle 发布。
- `--migrate-owner` 在发布新版本时，将现有 skill 迁移到 `--owner`。需要对两个 publisher 都拥有 admin/owner 访问权限。
- 所有者和审核行为在 `docs/publishing.md` 中说明。
- 发布 skill 意味着它在 ClawHub 上以 `MIT-0` 发布。
- 已发布的 skills 可自由使用、修改和再分发，无需署名。
- ClawHub 不支持付费 skills 或按 skill 定价。
- 旧版别名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub 的可复用 [`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) workflow 会为一个 `skill_path` 调用 `skill publish`，或为 `root` 下每个直接的 skill 文件夹调用（默认：`skills`）。它会跳过未变更的 skills，并使用相同的自动 patch 版本行为。

设置 `dry_run: true` 可在没有 token 的情况下预览。真实发布需要 `clawhub_token` secret。

### `sync`

- 扫描当前 workdir、已配置的 skills 目录，以及任何包含 `SKILL.md` 或 `skill.md` 的本地 skill 文件夹所在的 `--root <dir>` 文件夹。
- 将每个本地 skill fingerprint 与 ClawHub 比较，只发布新的或已变更的 skills。
- 新 skills 以 `1.0.0` 发布；已变更的 skills 默认发布下一个 patch 版本。对于应按更大 semver 步长移动的更新批次，请使用 `--bump minor|major`。
- `--dry-run` 显示发布计划但不上传；`--json` 打印机器可读计划。
- `--all` 会发布每个新的或已变更的 skill 且不提示。没有 `--all` 时，交互式终端会让你选择要发布的 skills。
- `--owner <handle>` 在执行者拥有 publisher 访问权限时，使用 org/user publisher handle 发布。
- `sync` 仅用于单向发布。它不会安装、更新、下载或报告安装/下载遥测。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- 需要 `clawhub login`。
- 通过 `POST /api/v1/skills/-/scan` 运行 ClawHub ClawScan，然后轮询直到扫描进入终态。
- 扫描是异步的，可能需要一些时间才能完成。排队期间，终端 spinner 会显示当前优先级扫描位置，以及前方还有多少个扫描。
- 已发布扫描需要所有权或 publisher 管理访问权限。moderators/admins 可以通过 `clawhub-admin` 使用同一个后端。
- `--update` 仅与 `--slug` 一起有效；它会把成功的已发布扫描结果写回所选版本。
- `--output <file.zip>` 下载完整报告归档，其中包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。
- `--json` 打印完整轮询响应，供自动化使用。
- 不再支持本地路径扫描。请上传新版本，然后使用 `scan download` 取回该提交版本存储的扫描结果。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- 需要 `clawhub login`。
- 下载已提交 skill 或 plugin 版本存储的扫描报告 ZIP，包括被 ClawHub 安全检查阻止或隐藏的版本。
- Skill 下载使用 skill slug，并默认使用 `--kind skill`。
- Plugin 下载使用 package name，并需要 `--kind plugin`。
- `--version` 是必需的，以便作者检查被 ClawHub 阻止的确切提交版本。
- `--output <file.zip>` 选择目标路径。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub 在 [`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml) 提供官方可复用 workflow，适用于 skill repos 和 catalog repos。

典型 catalog 设置：

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

说明：

- `root` 对 catalog repos 默认是 `skills`。
- 传入 `skill_path: skills/review-helper` 可处理一个 skill 文件夹。
- `owner` 映射到 CLI `--owner` 标志；省略它则以已认证用户身份发布。
- V1 skill 发布使用 `clawhub_token`；GitHub OIDC trusted publishing 目前仅适用于 package。

### `delete <skill>`

- 不带 `--version` 时，软删除一个技能（所有者、版主或管理员）。
- 调用 `DELETE /api/v1/skills/{slug}`。
- 所有者发起的软删除会保留该 slug 30 天；命令会打印过期时间。
- `--version <version>` 通过故障关闭的版本专属路由，永久删除一个归属自己的非最新版本。
  已删除的版本无法恢复或重新发布。删除当前最新版本之前，请先发布替代版本。平台工作人员不会在这个仅限版本的流程中绕过所有权。
- `--reason <text>` 在整个技能的软删除和审计日志中记录一条审核备注。
- `--note <text>` 是 `--reason` 的别名。
- `--yes` 跳过确认。

### `undelete <skill>`

- 恢复一个已隐藏的技能（所有者、版主或管理员）。
- 不支持版本恢复；永久删除的版本无法恢复。
- 调用 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 在技能和审计日志中记录一条审核备注。
- `--note <text>` 是 `--reason` 的别名。
- `--yes` 跳过确认。

### `hide <skill>`

- 隐藏一个技能（所有者、版主或管理员）。
- `delete` 的别名。

### `unhide <skill>`

- 取消隐藏一个技能（所有者、版主或管理员）。
- `undelete` 的别名。

### `skill rename <skill> <new-name>`

- 重命名一个归属自己的技能，并将之前的 slug 保留为重定向别名。
- 调用 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 跳过确认。

### `skill merge <source> <target>`

- 将一个归属自己的技能合并到另一个归属自己的技能中。
- 源 slug 会停止公开列出，并成为指向目标的重定向别名。
- 调用 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 跳过确认。

### `transfer`

- 所有权转移工作流。
- 转移到用户 handle 会创建一个待处理请求，由接收者接受。
- 只有当执行者同时拥有当前所有者和目标发布者的管理员访问权限时，转移到组织/发布者 handle 才会立即生效。
- 子命令：
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- 端点：
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- 通过 `GET /api/v1/packages` 和 `GET /api/v1/packages/search` 浏览或搜索统一包目录。
- 将它用于插件和其他包系列条目；顶层 `search` 仍然是技能搜索界面。
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
  - `--limit <n>`（1-100，默认值：25）
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
- 将它用于检查插件元数据、兼容性、验证、来源以及版本/文件。
- `--version <version>`：检查特定版本（默认值：最新版本）。
- `--tag <tag>`：检查带标签的版本（例如 `latest`）。
- `--versions`：列出版本历史（第一页）。
- `--limit <n>`：要列出的最大版本数（1-100）。
- `--files`：列出所选版本的文件。
- `--file <path>`：获取原始文件内容（仅限文本文件；200KB 限制）。
- `--json`：机器可读输出。

### `package download <name>`

- 通过
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
  解析包版本。
- 从解析器的 `downloadUrl` 下载构件。
- 验证所有构件的 ClawHub SHA-256。
- 对于 ClawPack npm-pack 构件，还会验证 npm `sha512` 完整性、npm shasum，以及 tarball 的 `package.json` 名称/版本。
- 旧版 ZIP 版本通过旧版 ZIP 路由下载。
- 标志：
  - `--version <version>`：下载特定版本。
  - `--tag <tag>`：下载带标签的版本（默认值：`latest`）。
  - `-o, --output <path>`：输出文件或目录。
  - `--force`：覆盖已有输出文件。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- 为本地构件计算 ClawHub SHA-256、npm `sha512` 完整性和 npm shasum。
- 使用 `--package` 时，会从 ClawHub 解析预期元数据，并将本地文件与已发布的构件元数据进行比较。
- 使用直接摘要标志时，无需网络查找即可验证。
- 标志：
  - `--package <name>`：用于解析预期构件元数据的包名。
  - `--version <version>` 或 `--tag <tag>`：预期包版本。
  - `--sha256 <hex>`：预期 ClawHub SHA-256。
  - `--npm-integrity <sri>`：预期 npm 完整性。
  - `--npm-shasum <sha1>`：预期 npm shasum。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- 针对本地插件包文件夹运行 ClawHub CLI 内置的 Plugin Inspector。
- 默认进行离线/静态验证，不定位或导入本地 OpenClaw checkout。
- 硬性兼容性错误会以非零状态退出。仅警告的问题会打印出来，但以零状态退出。
- 标志：
  - `--out <dir>`：将 Plugin Inspector 报告写入此目录。
  - `--openclaw <path>`：针对显式指定的本地 OpenClaw checkout 检查。
  - `--runtime`：启用运行时捕获；会导入插件代码。
  - `--allow-execute`：允许在隔离工作区中进行运行时捕获。
  - `--no-mock-sdk`：在运行时捕获期间禁用模拟的 OpenClaw SDK。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package validate ./example-plugin
```

如果验证报告了包、清单、SDK 导入或构件问题，请参阅
[插件验证修复](/clawhub/plugin-validation-fixes)，然后重新运行该命令。

### `package delete <name>`

- 不带 `--version` 时，软删除一个包及其所有发布版本。
- `--version <version>` 通过故障关闭的版本专属路由，永久删除一个归属自己的非最新发布版本。
  已删除的版本无法恢复或重新发布。删除当前最新版本之前，请先发布替代版本。这个仅限版本的流程需要包所有者或组织发布者管理员；平台工作人员不会绕过包所有权。
- 整包软删除需要包所有者、组织发布者所有者/管理员、平台版主或平台管理员权限。
- 标志：
  - `--version <version>`：永久删除一个非最新版本。
  - `--yes`：跳过确认。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 恢复一个已软删除的包及其发布版本。
- 不支持版本恢复；永久删除的版本无法恢复。
- 需要包所有者、组织发布者所有者/管理员、平台版主或平台管理员权限。
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
- 作用域包名必须转移给匹配的作用域所有者。
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

- 用于向版主举报包的已认证命令。
- 调用 `POST /api/v1/packages/{name}/report`。
- 举报是包级别的，也可以选择关联到某个版本，并会对版主可见以供审核。
- 举报本身不会自动隐藏包或阻止下载。
- 标志：
  - `--version <version>`：要附加到举报的可选包版本。
  - `--reason <text>`：必需的举报原因。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 用于检查包审核可见性的所有者命令。
- 调用 `GET /api/v1/packages/{name}/moderation`。
- 显示当前包扫描状态、未处理举报数量、最新发布版本的人工审核状态、下载阻止状态和审核原因。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 检查包是否已准备好供未来 OpenClaw 使用。
- 调用 `GET /api/v1/packages/{name}/readiness`。
- 报告官方状态、ClawPack 可用性、构件摘要、来源出处、OpenClaw 兼容性、宿主目标、环境元数据和扫描状态的阻塞项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 显示某个可能替代内置 OpenClaw 插件的包的面向操作员迁移状态。
- 调用与 `package readiness` 相同的计算型 readiness 端点，但会打印迁移相关状态、最新版本、官方包状态、检查项和阻塞项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 创建一个由已认证用户拥有的组织发布者。
- handle 会规范化为小写，并且可以带或不带 `@` 传入。
- 新创建的组织发布者默认不受信任/非官方。
- 如果 handle 已被现有发布者、用户或保留路由使用，则失败。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- 通过 `POST /api/v1/packages` 发布代码插件或包插件。
- `<source>` 接受：
  - 本地文件夹路径：`./my-plugin`
  - 本地 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub 仓库：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 元数据会从 `package.json`、`openclaw.plugin.json` 以及真实 OpenClaw 包标记（例如 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`）自动检测。
- `.tgz` 源会被视为 ClawPack。CLI 会上传准确的 npm-pack 字节，并仅将提取出的 `package/` 内容用于验证和元数据预填充。
- 代码插件文件夹会在上传前打包为 ClawPack npm tarball，以便 OpenClaw 安装可以验证准确的构件。包插件文件夹仍使用提取文件发布路径。
- 对于 GitHub 源，来源归属会根据仓库、解析后的提交、ref 和子路径自动填充。
- 对于本地文件夹，当 origin remote 指向 GitHub 时，来源归属会从本地 git 自动检测。
- 外部代码插件必须显式声明 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
  顶层 `package.json.version` 不会作为发布验证的后备值。
- `--dry-run` 会预览解析后的发布载荷而不上传。
- `--json` 为 CI 输出机器可读结果。
- 当操作者具有发布者访问权限时，`--owner <handle>` 会在用户或组织发布者 handle 下发布。
- Scoped 包名称必须匹配所选 owner。请参阅 `docs/publishing.md`。
- 现有标志（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作为覆盖项使用。
- 私有 GitHub 仓库需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 推荐的本地流程

先使用 `--dry-run`，以便在创建实时发布前确认解析后的包元数据和来源归属：

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

#### `--family code-plugin` 的最小 `package.json`

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

说明：

- `package.json.version` 是你的包发布版本，但它不会作为 OpenClaw 兼容性/构建验证的后备值。
- `openclaw.hostTargets` 和 `openclaw.environment` 是可选元数据。
  ClawHub 可能会在它们存在时展示，但发布并不要求它们。
- 如果你想发布更详细的兼容性元数据，`openclaw.compat.minGatewayVersion` 和 `openclaw.build.pluginSdkVersion` 是可选额外项。
- 如果你使用较旧的 `clawhub` CLI 版本，请先升级再发布，以便本地预检检查在上传前运行。
- 如果验证报告了修复代码，请参阅
  [插件验证修复](/clawhub/plugin-validation-fixes)。

#### GitHub Actions

ClawHub 还为插件仓库提供官方可复用工作流：
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)。

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

说明：

- 可复用工作流默认将 `source` 设为调用方仓库。
- 对于 monorepo，传入 `source_path`，让工作流发布插件包文件夹，例如 `source_path: extensions/codex`。
- 将可复用工作流固定到稳定 tag 或完整提交 SHA。不要从 `@main` 运行发布流程。
- `pull_request` 应使用 `dry_run: true`，使 CI 保持非污染性。
- 真实发布应仅限于受信任事件，例如 `workflow_dispatch` 或 tag push。
- 不带 secret 的可信发布仅适用于 `workflow_dispatch`；tag push 仍需要 `clawhub_token`。
- 保持 `clawhub_token` 可用，以便首次发布、不受信任包或应急发布使用。
- 工作流会将 JSON 结果作为构件上传，并将其作为工作流输出公开。

### `package trusted-publisher get <name>`

- 显示包的 GitHub Actions 可信发布者配置。
- 设置配置后使用此命令确认仓库、工作流文件名和可选环境固定项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 为现有包附加或替换 GitHub Actions 可信发布者配置。
- 必须先通过普通手动发布或 token 认证的 `clawhub package publish` 创建包。
- 配置设置后，未来受支持的 GitHub Actions 发布可以使用 OIDC/可信发布，而无需长期有效的 ClawHub token。
- `--repository <repo>` 必须是 `owner/repo`。
- `--workflow-filename <file>` 必须匹配 `.github/workflows/` 中的工作流文件名。
- `--environment <name>` 是可选的。配置后，OIDC claim 中的 GitHub Actions 环境必须完全匹配。
- ClawHub 会在运行此命令时验证已配置的 GitHub 仓库。
  公共仓库可以通过公开 GitHub 元数据验证。私有仓库要求 ClawHub 拥有对该 GitHub 仓库的访问权限，例如通过未来的 ClawHub GitHub App 安装或其他授权的 GitHub 集成。
- 标志：
  - `--repository <repo>`：GitHub 仓库，例如 `openclaw/example-plugin`。
  - `--workflow-filename <file>`：工作流文件名，例如 `package-publish.yml`。
  - `--environment <name>`：可选的精确匹配 GitHub Actions 环境。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- 从包中移除可信发布者配置。
- 如果工作流、仓库或环境固定项需要禁用或重新创建，请将此作为回滚使用。
- 未来真实发布必须使用普通认证发布，直到再次设置配置。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 安装遥测

- 登录后运行 `clawhub install <slug>` 时发送，除非设置了 `CLAWHUB_DISABLE_TELEMETRY=1`。
- 报告是尽力而为的。如果遥测不可用，安装命令不会失败。
- 详情：`docs/telemetry.md`。
