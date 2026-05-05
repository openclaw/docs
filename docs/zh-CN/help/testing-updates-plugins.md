---
read_when:
    - 更改 OpenClaw 更新、Doctor、包验收或插件安装行为
    - 准备或批准发布候选版本
    - 调试软件包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、包迁移和插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-05-05T05:04:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是用于更新和插件验证的专用清单。目标很简单：证明可安装包能够更新真实用户状态，通过 `doctor` 修复陈旧的旧版状态，并且仍能从受支持的来源安装、加载、更新和卸载插件。

有关更广泛的测试运行器映射，请参阅[测试](/zh-CN/help/testing)。有关实时提供商密钥和涉及网络的套件，请参阅[实时测试](/zh-CN/help/testing-live)。

## 我们保护的内容

更新和插件测试保护以下契约：

- 包 tarball 是完整的，具有有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布包迁移到候选包，而不会丢失配置、智能体、会话、工作区、插件 allowlist 或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧版清理和修复路径。启动过程不应为陈旧的插件状态新增隐藏的兼容性迁移。
- 插件安装可从本地目录、git 仓库、npm 包和 ClawHub 注册表路径工作。
- 插件 npm 依赖会安装在托管的 npm 根目录中，在信任前被扫描，并在卸载期间通过 npm 移除，以免提升的依赖残留。
- 当没有任何变化时，插件更新是稳定的：安装记录、解析后的来源、已安装依赖布局和启用状态保持不变。

## 开发期间的本地证明

从窄范围开始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

对于插件安装、卸载、依赖或包清单变更，还要运行覆盖已编辑接缝的聚焦测试：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何包 Docker lane 消费 tarball 之前，先证明包构件：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入包 dist 清单，运行 `npm pack --dry-run`，拒绝禁止打包的文件，将 tarball 安装到临时 prefix，运行 postinstall，并对内置渠道入口点做冒烟测试。

## Docker lanes

Docker lanes 是产品级证明。它们会在 Linux 容器中安装或更新真实包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC 状态和文件系统状态断言行为。

迭代时使用聚焦 lanes：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要 lanes：

- `test:docker:plugins` 验证插件安装冒烟测试、本地文件夹安装、本地文件夹更新跳过行为、带有预装依赖的本地文件夹、`file:` 包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升的传递依赖的 npm 注册表安装、npm 更新空操作、本地 ClawHub fixture 安装和更新空操作、marketplace 更新行为，以及 Claude-bundle 启用/inspect。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 块保持 hermetic/离线。
- `test:docker:plugin-lifecycle-matrix` 在裸容器中安装候选包，运行一个 npm 插件，依次执行安装、inspect、disable、enable、显式升级、显式降级，以及删除插件代码后的卸载。它会记录每个阶段的 RSS 和 CPU 指标。
- `test:docker:plugin-update` 验证未变化的已安装插件在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 将候选 tarball 安装到脏的旧用户 fixture 上，运行包更新加非交互式 Doctor，然后启动一个 loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 先安装一个已发布 baseline，通过烘焙的 `openclaw config set` 配方配置它，将其更新到候选 tarball，运行 Doctor，检查旧版清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-restart-auth` 安装候选包，启动托管的 token-auth Gateway 网关，为 `openclaw update --yes --json` 取消设置调用方 Gateway 网关认证环境变量，并要求候选更新命令在常规探测前重启 Gateway 网关。
- `test:docker:update-migration` 是偏重清理的已发布更新 lane。它从已配置的 Discord/Telegram 风格用户状态开始，运行 baseline Doctor，以便已配置插件依赖有机会物化，为已配置的打包插件播种旧版插件依赖残留，更新到候选 tarball，并要求更新后的 Doctor 移除旧版依赖根目录。

有用的已发布升级 survivor 变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会扩展为所有报告问题形态的场景，包括 configured-plugin 安装迁移。

完整更新迁移有意与 Full Release CI 分开。当发布问题是“从 2026.4.23 起每个已发布稳定版本是否都能更新到此候选版本并清理插件依赖残留？”时，使用手动 `Update Migration` 工作流：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 包验收

包验收是 GitHub 原生的包门禁。它会将一个候选包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用的 Docker E2E lanes。工作流 harness ref 与包来源 ref 分开，因此当前测试逻辑可以验证较旧的受信任发布。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：使用选定的当前 harness 打包受信任的分支、标签或提交。
- `source=url`：使用必需的 `package_sha256` 验证 HTTPS tarball。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

Full Release Validation 默认使用 `source=artifact`，从解析后的发布 SHA 构建。对于发布后证明，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`，让同一个升级矩阵改为面向已发货的 npm 包。

发布检查会使用 package/update/restart/plugin 集调用包验收：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

启用发布 soak 时，它们还会传入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这样可以让包迁移、更新渠道切换、陈旧插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 包 QA 使用同一个解析后的构件，而不会让默认发布包门禁遍历每个已发布版本。

`last-stable-4` 会解析为最新的四个已通过 npm 发布的 OpenClaw 稳定版本。发布包验收将 `2026.4.23` 固定为第一个插件更新兼容性边界，将 `2026.5.2` 固定为插件架构 churn 边界，并将 `2026.4.15` 固定为较旧的 2026.4.1x 已发布更新 baseline；解析器会去重已经包含在最新四个版本中的固定版本。若要获得详尽的已发布更新迁移覆盖，请在单独的 Update Migration 工作流中使用 `all-since-2026.4.23`，而不是 Full Release CI。当你也需要旧版更早日期锚点时，`release-history` 仍可用于手动更广采样。

选择多个已发布升级 survivor baseline 时，可复用的 Docker 工作流会将每个 baseline 分片到自己的目标 runner job。每个 baseline 分片仍会运行选定的场景集，但日志和构件保持按 baseline 分隔，墙钟时间由最慢的分片界定，而不是一个大型串行 job。

在发布前验证候选版本时，手动运行包 profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

当发布问题包括 MCP 渠道、cron/subagent 清理、OpenAI web search 或 OpenWebUI 时，使用 `suite_profile=product`。仅在需要完整 Docker 发布路径覆盖时才使用 `suite_profile=full`。

## 发布默认值

对于发布候选版本，默认证明栈是：

1. `pnpm check:changed` 和 `pnpm test:changed`，用于源码级回归。
2. `pnpm release:check`，用于包构件完整性。
3. 包验收 `package` profile 或 release-check 自定义包 lanes，用于安装/更新/重启/插件契约。
4. 跨 OS 发布检查，用于特定 OS 的安装器、新手引导和平台行为。
5. 仅当变更表面触及提供商或托管服务行为时，才运行 live suites。

在维护者机器上，宽范围门禁和 Docker/包产品证明应在 Testbox 中运行，除非明确执行本地证明。

## 旧版兼容性

兼容性宽容范围很窄且有时间限制：

- 截至 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可以容忍包验收中已经发货的包元数据缺口。
- 已发布的 `2026.4.26` 包可以对已发货的本地构建元数据 stamp 文件发出警告。
- 后续包必须满足现代契约。同样的缺口会失败，而不是警告或跳过。

不要为这些旧形态添加新的启动迁移。添加或扩展一个 Doctor 修复，然后在更新命令负责重启时，用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 证明它。

## 添加覆盖

更改更新或插件行为时，在能够因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：源码旁的单元测试。
- 包清单或打包文件行为：`package-dist-inventory` 或 tarball 检查器测试。
- CLI 安装/更新行为：Docker lane 断言或 fixture。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 更新负责的重启行为：`update-restart-auth`。
- 注册表/包来源行为：`test:docker:plugins` fixture 或 ClawHub fixture 服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖可能被提升到托管的 npm 根目录下，因此测试应证明根目录被扫描/清理，而不是假设存在包本地的 `node_modules` 树。

保持新的 Docker fixtures 默认 hermetic。除非测试重点是实时注册表行为，否则使用本地 fixture 注册表和 fake packages。

## 失败分诊

从构件身份开始：

- Package Acceptance `resolve_package` 摘要：来源、版本、SHA-256 和
  构件名称。
- Docker 构件：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane 日志和重跑命令。
- 升级幸存者摘要：`.artifacts/upgrade-survivor/summary.json`，
  包括基线版本、候选版本、场景、阶段耗时和
  recipe 步骤。

优先使用相同的 package 构件重跑失败的精确 lane，而不是
重跑整个发布总括流程。
