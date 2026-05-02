---
read_when:
    - 更改 OpenClaw 更新、Doctor、包验收或插件安装行为
    - 准备或批准发布候选版本
    - 调试包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、包迁移和插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-05-02T02:01:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是更新和插件验证的专用检查清单。目标很简单：证明可安装包可以更新真实用户状态，通过 `doctor` 修复过时的遗留状态，并且仍能从受支持来源安装、加载、更新和卸载插件。

如需更完整的测试运行器映射，请参阅 [测试](/zh-CN/help/testing)。如需实时提供商密钥和涉及网络的套件，请参阅 [实时测试](/zh-CN/help/testing-live)。

## 我们保护什么

更新和插件测试保护以下契约：

- 包 tarball 是完整的，包含有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布包迁移到候选包，而不会丢失配置、智能体、会话、工作区、插件允许列表或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责遗留清理和修复路径。启动流程不应为过时的插件状态增加隐藏的兼容性迁移。
- 插件安装可从本地目录、git 仓库、npm 包和 ClawHub 注册表路径工作。
- 插件 npm 依赖会安装到托管 npm 根目录，在信任前接受扫描，并在卸载时通过 npm 移除，因此提升的依赖不会残留。
- 当没有变化时，插件更新保持稳定：安装记录、解析后的来源、已安装依赖布局和启用状态都保持不变。

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

在任何包 Docker 跑道消费 tarball 之前，先证明包制品：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入包 dist 清单，运行 `npm pack --dry-run`，拒绝禁止打包的文件，将 tarball 安装到临时前缀，运行 postinstall，并对内置渠道入口点进行冒烟测试。

## Docker 跑道

Docker 跑道是产品级证明。它们在 Linux 容器内安装或更新真实包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC 状态和文件系统状态断言行为。

迭代时使用聚焦跑道：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要跑道：

- `test:docker:plugins` 验证插件安装冒烟、本地文件夹安装、本地文件夹更新跳过行为、带预安装依赖的本地文件夹、`file:` 包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升传递依赖的 npm 注册表安装、npm 更新空操作、本地 ClawHub fixture 安装和更新空操作、marketplace 更新行为，以及 Claude bundle 启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 区块保持密封/离线。
- `test:docker:plugin-update` 验证未变化的已安装插件在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 在脏的旧用户 fixture 上安装候选 tarball，运行包更新加非交互式 doctor，然后启动 local loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 先安装已发布基线，通过内置的 `openclaw config set` 配方配置它，将它更新到候选 tarball，运行 doctor，检查遗留清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-migration` 是清理密集型的已发布更新跑道。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 doctor，让已配置的插件依赖有机会实体化，为已配置的打包插件播种遗留插件依赖残留，更新到候选 tarball，并要求更新后的 doctor 移除遗留依赖根目录。

有用的已发布升级 survivor 变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会展开为所有已报告的问题形态场景。

完整更新迁移有意与 Full Release CI 分离。当发布问题是“从 2026.4.23 起的每个已发布稳定版本是否都能更新到此候选版本并清理插件依赖残留？”时，请使用手动 `Update Migration` 工作流：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生包门禁。它将一个候选包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该确切 tarball 运行可复用 Docker E2E 跑道。工作流 harness ref 与包来源 ref 分离，因此当前测试逻辑可以验证较旧的受信任发布。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或确切的已发布版本。
- `source=ref`：使用所选当前 harness 打包受信任分支、标签或提交。
- `source=url`：验证带必需 `package_sha256` 的 HTTPS tarball。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

发布检查会使用 package/update/plugin 集调用 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它们还会传递：

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这会让包迁移、更新渠道切换、过时插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 包 QA 使用同一个已解析制品。

`release-history` 是有边界的发布检查样本：最新六个稳定版本、`2026.4.23`，以及一个更早的日期前锚点。对于详尽的已发布更新迁移覆盖，请在单独的 Update Migration 工作流中使用 `all-since-2026.4.23`，而不是 Full Release CI。

在发布前验证候选版本时，手动运行包 profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

当发布问题包含 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索或 OpenWebUI 时，使用 `suite_profile=product`。仅在需要完整 Docker 发布路径覆盖时使用 `suite_profile=full`。

## 发布默认值

对于候选发布版本，默认证明栈是：

1. `pnpm check:changed` 和 `pnpm test:changed`，用于源码级回归。
2. `pnpm release:check`，用于包制品完整性。
3. Package Acceptance `package` profile 或发布检查自定义包跑道，用于安装/更新/插件契约。
4. 跨 OS 发布检查，用于 OS 特定安装器、新手引导和平台行为。
5. 仅当变更表面触及提供商或托管服务行为时运行 live 套件。

在维护者机器上，宽门禁和 Docker/包产品证明应在 Testbox 中运行，除非明确在做本地证明。

## 遗留兼容性

兼容性宽容范围很窄且有时间限制：

- 到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以在 Package Acceptance 中容忍已经发布的包元数据缺口。
- 已发布的 `2026.4.26` 包可能会对已经发布的本地构建元数据戳文件发出警告。
- 后续包必须满足现代契约。同样的缺口会失败，而不是警告或跳过。

不要为这些旧形态添加新的启动迁移。添加或扩展 doctor 修复，然后用 `upgrade-survivor` 或 `published-upgrade-survivor` 证明它。

## 添加覆盖

更改更新或插件行为时，在能够因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：源码旁的单元测试。
- 包清单或已打包文件行为：`package-dist-inventory` 或 tarball 检查器测试。
- CLI 安装/更新行为：Docker 跑道断言或 fixture。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 注册表/包来源行为：`test:docker:plugins` fixture 或 ClawHub fixture 服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖可能被提升到托管 npm 根目录下，因此测试应证明该根目录会被扫描/清理，而不是假设存在包本地的 `node_modules` 树。

默认保持新的 Docker fixture 密封。使用本地 fixture 注册表和假包，除非测试重点是实时注册表行为。

## 失败分诊

从制品身份开始：

- Package Acceptance `resolve_package` 摘要：来源、版本、SHA-256 和制品名称。
- Docker 制品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、跑道日志和重跑命令。
- Upgrade survivor 摘要：`.artifacts/upgrade-survivor/summary.json`，包括基线版本、候选版本、场景、阶段耗时和配方步骤。

优先使用同一个包制品重跑失败的确切跑道，而不是重跑整个发布总括流程。
