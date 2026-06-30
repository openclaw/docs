---
read_when:
    - 使用 ClawHub CLI
    - 调试安装、更新或发布
summary: CLI 参考：命令、标志、配置和锁文件行为。
x-i18n:
    generated_at: "2026-06-30T13:45:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
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

环境变量对应项：

- `CLAWHUB_SITE`（旧版 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（旧版 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（旧版 `CLAWDHUB_WORKDIR`）

### HTTP 代理

CLI 会遵循标准 HTTP 代理环境变量，适用于位于企业代理或受限网络后的系统：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

设置这些变量中的任意一个时，CLI 会通过指定代理路由出站请求。`HTTPS_PROXY` 用于 HTTPS 请求，`HTTP_PROXY` 用于普通 HTTP。`NO_PROXY` / `no_proxy` 会被遵循，用于绕过特定主机或域名的代理。

这在直接出站连接被阻止的系统上是必需的（例如 Docker 容器、仅能通过代理联网的 Hetzner VPS、企业防火墙）。

示例：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

未设置代理变量时，行为不变（直接连接）。

## 配置文件

存储你的 API 令牌和缓存的 registry URL。

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`
- 旧版回退：如果 `clawhub/config.json` 尚不存在但 `clawdhub/config.json` 存在，CLI 会复用旧版路径
- 覆盖：`CLAWHUB_CONFIG_PATH`（旧版 `CLAWDHUB_CONFIG_PATH`）

## 命令

### `login` / `auth login`

- 默认：打开浏览器到 `<site>/cli/auth`，并通过 loopback 回调完成。
- 无头模式：`clawhub login --token clh_...`
- 远程/无头交互式：`clawhub login --device` 会打印一个代码，并在你于 `<site>/cli/device` 授权时等待。

### `whoami`

- 通过 `/api/v1/whoami` 验证已存储的令牌。

### `token`

- 将已存储的 API 令牌打印到 stdout。
- 适用于将本地登录令牌通过管道传入 CI secret 设置命令。

### `star <skill>` / `unstar <skill>`

- 将技能添加到你的高亮列表，或从中移除。
- 调用 `POST /api/v1/stars/<slug>` 和 `DELETE /api/v1/stars/<slug>`。
- `--yes` 跳过确认。

### `search <query...>`

- 调用 `/api/v1/search?q=...`。
- 输出包含技能 slug、所有者 handle、显示名称和相关性分数。
- 搜索会优先考虑精确的 slug/name 令牌匹配，然后才考虑下载热度。像 `map` 这样的独立 slug 令牌会比 `amap` 内部的子字符串更强地匹配 `personal-map`。
- 热度只是一个很小的排序先验，不保证排在最前。
- 如果某个技能应该出现但没有出现，请在登录状态下运行 `clawhub inspect @owner/slug`，先检查所有者可见的审核诊断信息，再重命名元数据。

### `explore`

- 通过 `/api/v1/skills?limit=...&sort=createdAt` 列出最新技能（按 `createdAt` 降序排序）。
- 标志：
  - `--limit <n>`（1-200，默认：25）
  - `--sort newest|updated|rating|downloads|trending`（默认：newest）。旧版安装排序别名仍可用于兼容。
  - `--json`（机器可读输出）
- 输出：`<slug>  v<version>  <age>  <summary>`（summary 截断为 50 个字符）。

### `inspect @owner/slug`

- 获取技能元数据和版本文件，但不安装。
- `--version <version>`：检查指定版本（默认：latest）。
- `--tag <tag>`：检查带标签的版本（例如 `latest`）。
- `--versions`：列出版本历史（第一页）。
- `--limit <n>`：要列出的最大版本数（1-200）。
- `--files`：列出所选版本的文件。
- `--file <path>`：获取原始文件内容（仅限文本文件；200KB 限制）。
- `--json`：机器可读输出。

### `install @owner/slug`

- 解析指定所有者和技能的最新版本。
- 通过 `/api/v1/download` 下载 zip。
- 解压到 `<workdir>/<dir>/<slug>`。
- 拒绝覆盖已固定的技能；请先运行 `clawhub unpin <skill>`。
- 写入：
  - `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（旧版 `.clawdhub`）

### `uninstall <skill>`

- 移除 `<workdir>/<dir>/<slug>` 并删除 lockfile 条目。
- 在登录状态下尽力发送遥测，以便停用当前安装计数。
- 交互式：请求确认。
- 非交互式（`--no-input`）：需要 `--yes`。

### `list`

- 读取 `<workdir>/.clawhub/lock.json`（旧版 `.clawdhub`）。
- 对通过 `clawhub pin` 冻结的技能显示 `pinned`，包括可选原因。

### `pin <skill>`

- 在 lockfile 中将已安装的技能标记为固定。
- `--reason <text>` 记录技能被冻结的原因。
- 固定的技能会被 `update --all` 跳过，并会拒绝直接 `update <skill>`。
- 固定的技能也会拒绝 `install --force`，因此本地字节不会被意外替换。

### `unpin <skill>`

- 从已安装技能中移除 lockfile 固定状态，使未来更新可以修改它。

### `update [@owner/slug]` / `update --all`

- 根据本地文件计算指纹。
- 如果指纹匹配某个已知版本：不提示。
- 如果指纹不匹配：
  - 默认拒绝
  - 使用 `--force` 覆盖（或在交互式时提示）
- 固定的技能永远不会被 `--force` 更新。
- `update <skill>` 会对固定的技能快速失败，并提示你先运行 `clawhub unpin <skill>`。
- `update --all` 会跳过已固定的 slug，并打印哪些保持冻结的摘要。

### `skill publish <path>`

- 将本地 bundle 指纹与 ClawHub 比较，如果内容已经发布则成功退出。
- 新技能默认使用 `1.0.0`；已更改的技能默认使用下一个补丁版本。
- `--version <version>` 会显式选择一个版本，并且即使内容匹配现有版本也会发布。
- `--dry-run` 会解析发布但不上传；`--json` 会打印机器可读结果。
- `--owner <handle>` 在执行者拥有发布者访问权限时，以组织/用户发布者 handle 发布。
- `--migrate-owner` 会在发布新版本时将现有技能移动到 `--owner`。需要两个发布者上的 admin/owner 访问权限。
- 所有者和审核行为在 `docs/publishing.md` 中说明。
- 发布技能表示它在 ClawHub 上以 `MIT-0` 发布。
- 已发布的技能可自由使用、修改和再分发，无需署名。
- ClawHub 不支持付费技能或按技能定价。
- 旧版别名：`publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub 的可复用 [`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) 工作流会对一个 `skill_path` 调用 `skill publish`，或者对 `root`（默认：`skills`）下的每个直接技能文件夹调用。它会跳过未更改的技能，并使用相同的自动补丁版本行为。

设置 `dry_run: true` 可在没有令牌的情况下预览。真实发布需要 `clawhub_token` secret。

### `sync`

- 扫描当前 workdir、已配置的 Skills 目录，以及任何 `--root <dir>` 文件夹，查找包含 `SKILL.md` 或 `skill.md` 的本地技能文件夹。
- 将每个本地技能指纹与 ClawHub 比较，并且只发布新增或已更改的技能。
- 新技能发布为 `1.0.0`；已更改的技能默认发布下一个补丁版本。对需要移动更大 semver 步长的更新批次，使用 `--bump minor|major`。
- `--dry-run` 显示发布计划但不上传；`--json` 打印机器可读计划。
- `--all` 会发布每个新增或已更改的技能而不提示。如果没有 `--all`，交互式终端会让你选择要发布的技能。
- `--owner <handle>` 在执行者拥有发布者访问权限时，以组织/用户发布者 handle 发布。
- `sync` 只是单向发布。它不会安装、更新、下载，也不会报告安装/下载遥测。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- 需要 `clawhub login`。
- 通过 `POST /api/v1/skills/-/scan` 运行 ClawHub ClawScan，然后轮询直到扫描进入终态。
- 扫描是异步的，可能需要一些时间才能完成。排队期间，终端 spinner 会显示当前优先级扫描位置以及前方还有多少扫描。
- 已发布扫描需要所有权或发布者管理访问权限。版主/admin 可以通过 `clawhub-admin` 使用同一后端。
- `--update` 仅在与 `--slug` 一起使用时有效；它会将成功的已发布扫描结果写回所选版本。
- `--output <file.zip>` 下载完整报告归档，其中包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。
- `--json` 打印完整轮询响应以供自动化使用。
- 不再支持本地路径扫描。上传新版本，然后使用 `scan download` 检索该提交版本的已存储扫描结果。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- 需要 `clawhub login`。
- 下载已提交技能或插件版本的已存储扫描报告 ZIP，包括被 ClawHub 安全检查阻止或隐藏的版本。
- 技能下载使用技能 slug，并默认使用 `--kind skill`。
- 插件下载使用包名，并需要 `--kind plugin`。
- `--version` 是必需的，以便作者检查 ClawHub 阻止的确切提交版本。
- `--output <file.zip>` 选择目标路径。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub 在 [`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml) 提供官方可复用工作流，供技能仓库和目录仓库使用。

典型目录设置：

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

- `root` 对目录仓库默认是 `skills`。
- 传入 `skill_path: skills/review-helper` 可处理一个技能文件夹。
- `owner` 映射到 CLI `--owner` 标志；省略它则以已认证用户身份发布。
- V1 技能发布使用 `clawhub_token`；GitHub OIDC 可信发布目前仅适用于包。

### `delete <skill>`

- 不带 `--version` 时，软删除一个技能（所有者、版主或管理员）。
- 调用 `DELETE /api/v1/skills/{slug}`。
- 所有者发起的软删除会为该 slug 保留 30 天；该命令会打印到期时间。
- `--version <version>` 通过失败关闭的、
  特定版本路由永久删除一个自己拥有的非最新版本。
  已删除的版本无法恢复或重新发布。删除当前最新版本前，请先发布替代版本。
  平台工作人员不会在此仅限版本的流程中绕过所有权。
- `--reason <text>` 会在整项技能软删除和审计日志中记录一条审核备注。
- `--note <text>` 是 `--reason` 的别名。
- `--yes` 跳过确认。

### `undelete <skill>`

- 恢复一个已隐藏的技能（所有者、版主或管理员）。
- 不存在版本级取消删除；永久删除的版本无法恢复。
- 调用 `POST /api/v1/skills/{slug}/undelete`。
- `--reason <text>` 会在技能和审计日志中记录一条审核备注。
- `--note <text>` 是 `--reason` 的别名。
- `--yes` 跳过确认。

### `hide <skill>`

- 隐藏一个技能（所有者、版主或管理员）。
- `delete` 的别名。

### `unhide <skill>`

- 取消隐藏一个技能（所有者、版主或管理员）。
- `undelete` 的别名。

### `skill rename <skill> <new-name>`

- 重命名一个自己拥有的技能，并将之前的 slug 保留为重定向别名。
- 调用 `POST /api/v1/skills/{slug}/rename`。
- `--yes` 跳过确认。

### `skill merge <source> <target>`

- 将一个自己拥有的技能合并到另一个自己拥有的技能中。
- 源 slug 将停止公开列出，并成为指向目标的重定向别名。
- 调用 `POST /api/v1/skills/{sourceSlug}/merge`。
- `--yes` 跳过确认。

### `transfer`

- 所有权转移工作流。
- 转移到用户 handle 会创建一个待处理请求，由接收方接受。
- 转移到组织/发布者 handle 时，只有当执行者同时拥有当前所有者和目标发布者的
  管理员访问权限，才会立即生效。
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

- 通过 `GET /api/v1/packages` 和 `GET /api/v1/packages/search` 浏览或搜索统一软件包目录。
- 将此命令用于插件和其他软件包族条目；顶层 `search` 仍是技能搜索界面。
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

- 获取软件包元数据而不安装。
- 将此命令用于插件元数据、兼容性、验证、来源以及版本/文件检查。
- `--version <version>`：检查指定版本（默认：最新）。
- `--tag <tag>`：检查带标签的版本（例如 `latest`）。
- `--versions`：列出版本历史（第一页）。
- `--limit <n>`：要列出的最大版本数（1-100）。
- `--files`：列出所选版本的文件。
- `--file <path>`：获取原始文件内容（仅文本文件；200KB 限制）。
- `--json`：机器可读输出。

### `package download <name>`

- 通过
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
  解析软件包版本。
- 从解析器的 `downloadUrl` 下载 artifact。
- 对所有 artifact 验证 ClawHub SHA-256。
- 对 ClawPack npm-pack artifact，还会验证 npm `sha512` 完整性、
  npm shasum，以及 tarball 的 `package.json` 名称/版本。
- 旧版 ZIP 版本通过旧版 ZIP 路由下载。
- 标志：
  - `--version <version>`：下载指定版本。
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

- 为本地 artifact 计算 ClawHub SHA-256、npm `sha512` 完整性和 npm shasum。
- 搭配 `--package` 时，会从 ClawHub 解析预期元数据，并将
  本地文件与已发布 artifact 元数据进行比较。
- 搭配直接摘要标志时，无需网络查找即可验证。
- 标志：
  - `--package <name>`：用于解析预期 artifact 元数据的软件包名称。
  - `--version <version>` 或 `--tag <tag>`：预期软件包版本。
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

- 针对本地插件软件包文件夹运行 ClawHub CLI 内置的插件检查器。
- 默认使用离线/静态验证，不会定位或导入本地 OpenClaw checkout。
- 硬性兼容性错误会以非零状态退出。仅警告的发现会打印出来，但
  以零状态退出。
- 标志：
  - `--out <dir>`：将插件检查器报告写入此目录。
  - `--openclaw <path>`：针对显式指定的本地 OpenClaw checkout 进行检查。
  - `--runtime`：启用运行时捕获；会导入插件代码。
  - `--allow-execute`：允许在隔离工作区中进行运行时捕获。
  - `--no-mock-sdk`：在运行时捕获期间禁用模拟的 OpenClaw SDK。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package validate ./example-plugin
```

如果验证报告软件包、清单、SDK 导入或 artifact 发现，请参阅
[插件验证修复](/clawhub/plugin-validation-fixes)，然后重新运行该命令。

### `package delete <name>`

- 不带 `--version` 时，软删除一个软件包及其所有 release。
- `--version <version>` 通过失败关闭的、
  特定版本路由永久删除一个自己拥有的非最新 release。
  已删除的版本无法恢复或重新发布。删除当前最新版本前，请先发布替代版本。
  此仅限版本的流程要求软件包所有者或组织发布者管理员；平台工作人员不会绕过软件包所有权。
- 整个软件包软删除要求软件包所有者、组织发布者所有者/管理员、平台
  版主或平台管理员。
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

- 恢复一个已软删除的软件包及其 release。
- 不存在版本级取消删除；永久删除的版本无法恢复。
- 要求软件包所有者、组织发布者所有者/管理员、平台版主
  或平台管理员。
- 调用 `POST /api/v1/packages/{name}/undelete`。
- 标志：
  - `--yes`：跳过确认。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- 将软件包转移给另一个发布者。
- 除非由平台管理员执行，否则需要同时拥有当前软件包所有者和目标
  发布者的管理员访问权限。
- 带 scope 的软件包名称必须转移给匹配的 scope 所有者。
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

- 用于向版主举报软件包的已认证命令。
- 调用 `POST /api/v1/packages/{name}/report`。
- 举报属于软件包级别，可选择关联到某个版本，并会对
  版主可见以供审核。
- 举报本身不会自动隐藏软件包或阻止下载。
- 标志：
  - `--version <version>`：要附加到举报的可选软件包版本。
  - `--reason <text>`：必填的举报原因。
  - `--json`：机器可读输出。

示例：

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- 用于检查软件包审核可见性的所有者命令。
- 调用 `GET /api/v1/packages/{name}/moderation`。
- 显示当前软件包扫描状态、未处理举报数量、最新 release 手动
  审核状态、下载阻止状态和审核原因。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- 检查软件包是否已准备好供未来 OpenClaw 使用。
- 调用 `GET /api/v1/packages/{name}/readiness`。
- 报告官方状态、ClawPack 可用性、artifact 摘要、
  来源出处、OpenClaw 兼容性、主机目标、环境元数据
  和扫描状态方面的阻塞项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 显示面向操作者的迁移状态，用于可能替换
  内置 OpenClaw 插件的软件包。
- 调用与 `package readiness` 相同的计算型 readiness 端点，但会打印
  聚焦迁移的状态、最新版本、官方软件包状态、检查项和
  阻塞项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 创建一个由已认证用户拥有的组织发布者。
- handle 会规范化为小写，并且可以带或不带 `@` 传入。
- 新创建的组织发布者默认不是受信任/官方发布者。
- 如果该 handle 已被现有发布者、用户或保留路由使用，则会失败。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- 通过 `POST /api/v1/packages` 发布代码插件或 bundle 插件。
- `<source>` 接受：
  - 本地文件夹路径：`./my-plugin`
  - 本地 ClawPack npm-pack tarball：`./my-plugin-1.2.3.tgz`
  - GitHub 仓库：`owner/repo` 或 `owner/repo@ref`
  - GitHub URL：`https://github.com/owner/repo`
- 元数据会从 `package.json`、`openclaw.plugin.json` 以及真实的 OpenClaw bundle 标记自动检测，例如 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json` 和 `.cursor-plugin/plugin.json`。
- `.tgz` 来源会被视为 ClawPack。CLI 会上传精确的 npm-pack 字节，并仅将提取出的 `package/` 内容用于验证和元数据预填。
- 代码插件文件夹会在上传前打包为 ClawPack npm tarball，以便 OpenClaw 安装可以验证精确产物。bundle 插件文件夹仍使用提取文件发布路径。
- 对于 GitHub 来源，来源归属会从仓库、解析后的提交、ref 和子路径自动填充。
- 对于本地文件夹，当 origin remote 指向 GitHub 时，来源归属会从本地 git 自动检测。
- 外部代码插件必须显式声明 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
  顶层 `package.json.version` 不会作为发布验证的回退值。
- `--dry-run` 会预览解析后的发布载荷而不上传。
- `--json` 会为 CI 输出机器可读内容。
- 当执行者具有发布者访问权限时，`--owner <handle>` 会在用户或组织发布者 handle 下发布。
- Scoped package 名称必须匹配所选 owner。请参阅 `docs/publishing.md`。
- 现有标志（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）仍可作为覆盖项使用。
- 私有 GitHub 仓库需要 `GITHUB_TOKEN`。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 推荐的本地流程

先使用 `--dry-run`，这样你可以在创建实际发布前确认解析后的包元数据和来源归属：

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### 本地文件夹流程

对于代码插件，文件夹发布会从包文件夹构建并上传 ClawPack 产物：

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

说明：

- `package.json.version` 是你的包发布版本，但它不会作为 OpenClaw 兼容性/构建验证的回退值。
- `openclaw.hostTargets` 和 `openclaw.environment` 是可选元数据。
  ClawHub 可能会在它们存在时展示它们，但发布并不要求它们。
- 如果你想发布更详细的兼容性元数据，`openclaw.compat.minGatewayVersion` 和 `openclaw.build.pluginSdkVersion` 是可选补充项。
- 如果你使用的是较旧的 `clawhub` CLI 版本，请在发布前升级，以便本地预检在上传前运行。
- 如果验证报告了修复代码，请参阅
  [插件验证修复](/clawhub/plugin-validation-fixes)。

#### GitHub Actions

ClawHub 还为插件仓库提供了官方可复用 workflow：
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)。

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

- 可复用 workflow 默认将 `source` 设置为调用方仓库。
- 对于 monorepo，传入 `source_path`，以便 workflow 发布插件包文件夹，例如 `source_path: extensions/codex`。
- 将可复用 workflow 固定到稳定标签或完整提交 SHA。不要从 `@main` 运行发布。
- `pull_request` 应使用 `dry_run: true`，以便 CI 保持无污染。
- 真实发布应限制为可信事件，例如 `workflow_dispatch` 或标签推送。
- 无密钥可信发布仅适用于 `workflow_dispatch`；标签推送仍需要 `clawhub_token`。
- 保留可用的 `clawhub_token`，用于首次发布、不可信包或应急发布。
- workflow 会将 JSON 结果作为产物上传，并将其公开为 workflow 输出。

### `package trusted-publisher get <name>`

- 显示包的 GitHub Actions 可信发布者配置。
- 设置配置后使用此命令确认仓库、workflow 文件名和可选的 environment 固定项。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 为现有包附加或替换 GitHub Actions 可信发布者配置。
- 必须先通过常规手动或 token 认证的 `clawhub package publish` 创建包。
- 配置设置后，未来受支持的 GitHub Actions 发布可以使用 OIDC/可信发布，而无需长期有效的 ClawHub token。
- `--repository <repo>` 必须为 `owner/repo`。
- `--workflow-filename <file>` 必须匹配 `.github/workflows/` 中的 workflow 文件名。
- `--environment <name>` 是可选项。配置后，OIDC claim 中的 GitHub Actions environment 必须精确匹配。
- 运行此命令时，ClawHub 会验证配置的 GitHub 仓库。
  公共仓库可以通过公开 GitHub 元数据验证。私有仓库要求 ClawHub 对该仓库具有 GitHub 访问权限，例如通过未来的 ClawHub GitHub App 安装或其他已授权的 GitHub 集成。
- 标志：
  - `--repository <repo>`：GitHub 仓库，例如 `openclaw/example-plugin`。
  - `--workflow-filename <file>`：workflow 文件名，例如 `package-publish.yml`。
  - `--environment <name>`：可选的精确匹配 GitHub Actions environment。
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
- 如果需要禁用或重新创建 workflow、仓库或 environment 固定项，请将此命令用作回滚。
- 在重新设置配置前，未来的真实发布必须使用常规认证发布。
- 标志：
  - `--json`：机器可读输出。

示例：

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### 安装遥测

- 登录后运行 `clawhub install <slug>` 时发送，除非设置了 `CLAWHUB_DISABLE_TELEMETRY=1`。
- 上报采用尽力而为方式。如果遥测不可用，安装命令不会失败。
- 详情：`docs/telemetry.md`。
