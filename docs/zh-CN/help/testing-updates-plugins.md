---
read_when:
    - 更改 OpenClaw 更新、Doctor、软件包验收或插件安装行为
    - 准备或批准候选发布版本
    - 调试包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、软件包迁移以及插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-05-01T23:38:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d4b52047b9b80273e2d93b97e647e5e9c93d93910828fdce010568f3ea81390
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是更新和插件验证的专用清单。目标很简单：证明可安装软件包可以更新真实用户状态，通过 `doctor` 修复陈旧的遗留状态，并且仍能从支持的来源安装、加载、更新和卸载插件。

关于更广泛的测试运行器映射，请参见 [测试](/zh-CN/help/testing)。关于实时提供商密钥和会触网的套件，请参见 [实时测试](/zh-CN/help/testing-live)。

## 我们保护的内容

更新和插件测试保护这些契约：

- 软件包 tarball 是完整的，包含有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布软件包迁移到候选软件包，而不会丢失配置、智能体、会话、工作区、插件 allowlist 或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责遗留清理和修复路径。启动流程不应为陈旧插件状态增加隐藏的兼容性迁移。
- 插件安装可从本地目录、git 仓库、npm 软件包和 ClawHub 注册表路径运行。
- 插件 npm 依赖会安装到托管的 npm 根目录，在信任前进行扫描，并在卸载期间通过 npm 移除，避免提升的依赖残留。
- 插件更新在没有变化时保持稳定：安装记录、解析后的来源和启用状态保持不变。

## 开发期间的本地证明

从窄范围开始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

对于插件安装、卸载、依赖或软件包 inventory 变更，还要运行覆盖已编辑接缝的聚焦测试：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何软件包 Docker lane 使用 tarball 之前，先证明软件包构件：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入软件包 dist inventory，运行 `npm pack --dry-run`，拒绝禁止打包的文件，将 tarball 安装到临时前缀，运行 postinstall，并对内置渠道入口点做冒烟测试。

## Docker lanes

Docker lanes 是产品级证明。它们在 Linux 容器内安装或更新真实软件包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC 状态和文件系统状态断言行为。

迭代时使用聚焦 lanes：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要 lanes：

- `test:docker:plugins` 验证插件安装冒烟、本地文件夹安装、带预安装依赖的本地文件夹、带软件包依赖的 git 安装、npm 软件包依赖安装、本地 ClawHub fixture 安装、marketplace 更新行为，以及 Claude bundle 启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 区块保持 hermetic/offline。
- `test:docker:plugin-update` 验证未变化的已安装插件在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 将候选 tarball 安装到脏的旧用户 fixture 之上，运行软件包更新和非交互式 Doctor，然后启动 local loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 首先安装已发布基线，通过内置的 `openclaw config set` 配方配置它，将其更新到候选 tarball，运行 Doctor，检查遗留清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-migration` 是重清理的已发布更新 lane。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 Doctor，使已配置的插件依赖有机会实体化，为已配置的打包插件播种遗留插件依赖碎片，更新到候选 tarball，并要求更新后的 Doctor 移除遗留依赖根目录。

有用的已发布升级幸存者变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会展开为所有已报告问题形态的场景。

完整更新迁移有意与 Full Release CI 分离。当发布问题是“从 2026.4.23 起的每个已发布稳定版本是否都能更新到此候选版本并清理插件依赖碎片？”时，使用手动 `Update Migration` 工作流：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生的软件包门禁。它将一个候选软件包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用的 Docker E2E lanes。工作流 harness ref 与软件包源 ref 分离，因此当前测试逻辑可以验证较旧的受信任发布版本。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：使用选定的当前 harness 打包受信任的分支、标签或提交。
- `source=url`：验证 HTTPS tarball，并要求 `package_sha256`。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

发布检查使用软件包/更新/插件集合调用 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它们还传递：

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这使软件包迁移、更新渠道切换、陈旧插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 软件包 QA 都在同一个解析后的构件上运行。

`release-history` 是有边界的发布检查样本：最新六个稳定版本、`2026.4.23`，以及一个更早的日期前锚点。对于详尽的已发布更新迁移覆盖，请在单独的 Update Migration 工作流中使用 `all-since-2026.4.23`，而不是 Full Release CI。

在发布前验证候选版本时，手动运行软件包 profile：

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

当发布问题包括 MCP 渠道、cron/subagent 清理、OpenAI web 搜索或 OpenWebUI 时，使用 `suite_profile=product`。仅在需要完整 Docker 发布路径覆盖时使用 `suite_profile=full`。

## 发布默认值

对于候选发布版本，默认证明栈是：

1. `pnpm check:changed` 和 `pnpm test:changed` 用于源代码级回归。
2. `pnpm release:check` 用于软件包构件完整性。
3. Package Acceptance `package` profile 或 release-check 自定义软件包 lanes，用于安装/更新/插件契约。
4. Cross-OS 发布检查，用于特定 OS 的安装器、新手引导和平台行为。
5. 仅当变更表面触及提供商或托管服务行为时，运行实时套件。

在维护者机器上，广泛门禁和 Docker/软件包产品证明应在 Testbox 中运行，除非明确执行本地证明。

## 遗留兼容性

兼容性宽容范围很窄且有时间限制：

- 到 `2026.4.25` 为止的软件包，包括 `2026.4.25-beta.*`，可以在 Package Acceptance 中容忍已发布的软件包元数据缺口。
- 已发布的 `2026.4.26` 软件包可以对已发布的本地构建元数据戳文件发出警告。
- 后续软件包必须满足现代契约。相同缺口会失败，而不是警告或跳过。

不要为这些旧形态添加新的启动迁移。添加或扩展 Doctor 修复，然后用 `upgrade-survivor` 或 `published-upgrade-survivor` 证明它。

## 添加覆盖

更改更新或插件行为时，在能因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：在源码旁边添加单元测试。
- 软件包 inventory 或打包文件行为：`package-dist-inventory` 或 tarball 检查器测试。
- CLI 安装/更新行为：Docker lane 断言或 fixture。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 注册表/软件包来源行为：`test:docker:plugins` fixture 或 ClawHub fixture 服务器。

默认保持新的 Docker fixtures hermetic。除非测试重点是实时注册表行为，否则使用本地 fixture 注册表和假软件包。

## 失败分诊

从构件身份开始：

- Package Acceptance `resolve_package` 摘要：来源、版本、SHA-256 和构件名称。
- Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志和重跑命令。
- 升级幸存者摘要：`.artifacts/upgrade-survivor/summary.json`，包括基线版本、候选版本、场景、阶段计时和配方步骤。

优先使用相同的软件包构件重跑失败的精确 lane，而不是重跑整个发布总括流程。
