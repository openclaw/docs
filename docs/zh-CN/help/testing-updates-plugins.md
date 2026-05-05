---
read_when:
    - 更改 OpenClaw 更新、Doctor、包验收或插件安装行为
    - 准备或批准候选版本
    - 调试包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、包迁移和插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-05-05T21:23:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是更新和插件验证的专用检查清单。目标很简单：证明可安装的软件包可以更新真实用户状态，通过 `doctor` 修复陈旧的旧版状态，并且仍然可以从受支持的来源安装、加载、更新和卸载插件。

如需更完整的测试运行器地图，请参阅[测试](/zh-CN/help/testing)。如需实时提供商密钥和会触达网络的测试套件，请参阅[实时测试](/zh-CN/help/testing-live)。

## 我们保护什么

更新和插件测试保护以下契约：

- 软件包 tarball 是完整的，具有有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布软件包迁移到候选软件包，而不会丢失配置、智能体、会话、工作区、插件 allowlist 或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧版清理和修复路径。启动过程不应为陈旧插件状态增加隐藏的兼容性迁移。
- 插件可从本地目录、git 仓库、npm 软件包和 ClawHub 注册表路径安装。
- 插件 npm 依赖项会安装在托管的 npm 根目录中，在信任前被扫描，并在卸载期间通过 npm 移除，避免提升的依赖项残留。
- 当没有任何变化时，插件更新保持稳定：安装记录、解析后的来源、已安装依赖布局和启用状态都保持不变。

## 开发期间的本地证明

从窄范围开始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

对于插件安装、卸载、依赖项或软件包 inventory 变更，还要运行覆盖已编辑边界的聚焦测试：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何软件包 Docker 通道消费 tarball 之前，先证明软件包制品：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入软件包 dist inventory，运行 `npm pack --dry-run`，拒绝被禁止的打包文件，将 tarball 安装到临时前缀，运行 postinstall，并对内置渠道入口点执行 smoke 测试。

## Docker 通道

Docker 通道是产品级证明。它们在 Linux 容器内安装或更新真实软件包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC 状态和文件系统状态断言行为。

迭代时使用聚焦通道：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要通道：

- `test:docker:plugins` 验证插件安装 smoke、本地文件夹安装、本地文件夹更新跳过行为、带预装依赖项的本地文件夹、`file:` 软件包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升传递依赖项的 npm 注册表安装、npm 更新空操作、本地 ClawHub fixture 安装和更新空操作、marketplace 更新行为，以及 Claude bundle 启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 区块保持封闭/离线。
- `test:docker:plugin-lifecycle-matrix` 在裸容器中安装候选软件包，让一个 npm 插件依次经历安装、检查、禁用、启用、显式升级、显式降级，以及删除插件代码后的卸载。它会记录每个阶段的 RSS 和 CPU 指标。
- `test:docker:plugin-update` 验证未变化的已安装插件在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 将候选 tarball 安装到脏的旧用户 fixture 之上，运行软件包更新和非交互式 doctor，然后启动一个 local loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 先安装已发布的基线，通过内置的 `openclaw config set` 配方配置它，将其更新到候选 tarball，运行 doctor，检查旧版清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-restart-auth` 安装候选软件包，启动托管的 token-auth Gateway 网关，为 `openclaw update --yes --json` 取消设置调用方网关身份验证环境变量，并要求候选更新命令在常规探测前重启 Gateway 网关。
- `test:docker:update-migration` 是清理密集型的已发布更新通道。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 doctor 以便已配置插件依赖项有机会实例化，为一个已配置的打包插件播种旧版插件依赖残留，更新到候选 tarball，并要求更新后 doctor 移除旧版依赖根目录。

有用的已发布升级 survivor 变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会展开为所有符合已报告 issue 形态的场景，包括已配置插件安装迁移。

完整更新迁移有意独立于完整发布 CI。发布问题是“从 2026.4.23 起的每个已发布稳定版本是否都能更新到此候选版本，并清理插件依赖残留？”时，请使用手动 `Update Migration` 工作流：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生的软件包门禁。它将一个候选软件包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用的 Docker E2E 通道。工作流 harness ref 与软件包来源 ref 分离，因此当前测试逻辑可以验证较旧的受信任发布版本。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：使用所选的当前 harness 打包受信任的分支、标签或提交。
- `source=url`：验证 HTTPS tarball，并要求提供 `package_sha256`。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

完整发布验证默认使用 `source=artifact`，基于解析后的发布 SHA 构建。对于发布后的证明，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`，让同一个升级矩阵目标指向已发布的 npm 软件包。

发布检查会使用 package/update/restart/plugin 集调用 Package Acceptance：

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

启用发布 soak 时，它们还会传入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这会在同一个解析制品上保持软件包迁移、更新渠道切换、损坏托管插件容错、陈旧插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 软件包 QA，而不让默认发布软件包门禁遍历每个已发布版本。

`last-stable-4` 解析为最新的四个稳定 npm 已发布 OpenClaw 版本。发布软件包 acceptance 将 `2026.4.23` 固定为第一个插件更新兼容性边界，将 `2026.5.2` 固定为插件架构变动边界，并将 `2026.4.15` 固定为较旧的 2026.4.1x 已发布更新基线；解析器会去重已经包含在最新四个版本中的固定版本。对于详尽的已发布更新迁移覆盖，请在独立的 Update Migration 工作流中使用 `all-since-2026.4.23`，而不是使用完整发布 CI。当你还需要旧版日期前锚点时，`release-history` 仍可用于手动更广泛抽样。

选择多个已发布升级 survivor 基线时，可复用 Docker 工作流会将每个基线分片到自己的目标 runner 作业中。每个基线分片仍会运行所选场景集，但日志和制品会按基线保留，墙钟时间受最慢分片限制，而不是由一个大型串行作业决定。

在发布前验证候选版本时，手动运行软件包 profile：

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

当发布问题包含 MCP 渠道、cron/subagent 清理、OpenAI web search 或 OpenWebUI 时，使用 `suite_profile=product`。只有在需要完整 Docker 发布路径覆盖时，才使用 `suite_profile=full`。

## 发布默认值

对于发布候选版本，默认证明栈是：

1. `pnpm check:changed` 和 `pnpm test:changed`，用于源码级回归。
2. `pnpm release:check`，用于软件包制品完整性。
3. Package Acceptance `package` profile 或 release-check 自定义软件包通道，用于安装/更新/重启/插件契约。
4. 跨 OS 发布检查，用于特定于 OS 的安装器、新手引导和平台行为。
5. 仅当变更表面触及提供商或托管服务行为时，才运行实时测试套件。

在维护者机器上，除非明确执行本地证明，否则宽范围门禁和 Docker/软件包产品证明应在 Testbox 中运行。

## 旧版兼容性

兼容性宽容范围很窄且有时间限制：

- 截至 `2026.4.25` 的软件包，包括 `2026.4.25-beta.*`，可在 Package Acceptance 中容忍已经发布的软件包元数据缺口。
- 已发布的 `2026.4.26` 软件包可对已经发布的本地构建元数据戳文件发出警告。
- 后续软件包必须满足现代契约。相同缺口会失败，而不是警告或跳过。

不要为这些旧形态添加新的启动迁移。添加或扩展 doctor 修复，然后在更新命令负责重启时，用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 证明它。

## 添加覆盖

更改更新或插件行为时，在能够因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：源代码旁边的单元测试。
- 软件包 inventory 或已打包文件行为：`package-dist-inventory` 或 tarball 检查器测试。
- CLI 安装/更新行为：Docker 通道断言或 fixture。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 更新负责的重启行为：`update-restart-auth`。
- 注册表/软件包来源行为：`test:docker:plugins` fixture 或 ClawHub fixture 服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖项可能会提升到托管的 npm 根目录下，因此测试应证明根目录被扫描/清理，而不是假设存在软件包本地的 `node_modules` 树。

默认保持新的 Docker fixture 封闭。除非测试重点是实时注册表行为，否则使用本地 fixture 注册表和 fake 软件包。

## 失败分诊

从制品身份开始：

- 包验收 `resolve_package` 摘要：来源、版本、SHA-256 和
  构件名称。
- Docker 构件：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane 日志，以及重新运行命令。
- 升级保留项摘要：`.artifacts/upgrade-survivor/summary.json`，
  包括基线版本、候选版本、场景、阶段耗时，以及
  recipe 步骤。

优先使用同一个包构件重新运行失败的精确 lane，而不是
重新运行整个发布总流程。
