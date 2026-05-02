---
read_when:
    - 更改 OpenClaw 更新、Doctor、包验收或插件安装行为
    - 准备或批准发布候选版
    - 排查软件包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、包迁移以及插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-05-02T15:57:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7843767a4acca25ceea62633faa5f4bec954bebf7cc4eeb9f3b0b990313ff946
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是更新和插件验证的专用清单。目标很简单：证明可安装的软件包可以更新真实用户状态，通过 `doctor` 修复过时的旧版状态，并且仍然可以从受支持的来源安装、加载、更新和卸载插件。

更完整的测试运行器地图见 [测试](/zh-CN/help/testing)。实时提供商密钥和会接触网络的测试套件见 [实时测试](/zh-CN/help/testing-live)。

## 我们保护的内容

更新和插件测试保护这些契约：

- 软件包 tarball 是完整的，包含有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布软件包迁移到候选软件包，而不会丢失配置、智能体、会话、工作区、插件允许列表或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧版清理和修复路径。启动过程不应为过时的插件状态增加隐藏的兼容迁移。
- 插件可以从本地目录、git 仓库、npm 软件包和 ClawHub 注册表路径安装。
- 插件 npm 依赖安装在托管 npm root 中，在信任前会被扫描，并且卸载时通过 npm 移除，以免提升安装的依赖残留。
- 当没有任何变化时，插件更新保持稳定：安装记录、解析后的来源、已安装依赖布局和启用状态都保持不变。

## 开发期间的本地证明

从窄范围开始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

对于插件安装、卸载、依赖或软件包清单变更，还要运行覆盖已编辑接缝的聚焦测试：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何软件包 Docker lane 使用 tarball 之前，先证明软件包工件：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入软件包 dist 清单，运行 `npm pack --dry-run`，拒绝禁止打包的文件，将 tarball 安装到临时前缀中，运行 postinstall，并对内置渠道入口点做冒烟测试。

## Docker lanes

Docker lanes 是产品级证明。它们会在 Linux 容器内安装或更新真实软件包，并通过 CLI 命令、Gateway 网关启动、HTTP 探针、RPC 状态和文件系统状态断言行为。

迭代时使用聚焦 lanes：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要 lanes：

- `test:docker:plugins` 验证插件安装冒烟、本地文件夹安装、本地文件夹更新跳过行为、带预安装依赖的本地文件夹、`file:` 软件包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升安装的传递依赖的 npm 注册表安装、npm 更新空操作、本地 ClawHub fixture 安装和更新空操作、marketplace 更新行为，以及 Claude-bundle 启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 代码块保持 hermetic/离线。
- `test:docker:plugin-update` 验证未变化的已安装插件在 `openclaw plugins update` 期间不会重新安装，也不会丢失安装元数据。
- `test:docker:upgrade-survivor` 将候选 tarball 安装到脏的旧用户 fixture 上，运行软件包更新和非交互式 doctor，然后启动 loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 会先安装一个已发布基线，通过内置的 `openclaw config set` 配方配置它，将其更新到候选 tarball，运行 doctor，检查旧版清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-migration` 是清理密集型的已发布更新 lane。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 doctor，让已配置插件依赖有机会实体化，为已配置的打包插件播种旧版插件依赖残留，更新到候选 tarball，并要求更新后的 doctor 移除旧版依赖 root。

有用的已发布升级幸存者变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会展开为所有已报告问题形状的场景，包括已配置插件安装迁移。

完整更新迁移有意与 Full Release CI 分开。当发布问题是“从 2026.4.23 开始的每个已发布稳定版本是否都能更新到此候选版本并清理插件依赖残留？”时，使用手动 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生的软件包关卡。它会将一个候选软件包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用的 Docker E2E lanes。workflow harness 引用与软件包来源引用分离，因此当前测试逻辑可以验证较旧的受信任发布版本。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：用选定的当前 harness 打包受信任分支、标签或提交。
- `source=url`：验证 HTTPS tarball，并要求提供 `package_sha256`。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

发布检查会使用软件包/更新/插件集合调用 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它们还会传入：

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这会让软件包迁移、更新渠道切换、过时插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 软件包 QA 都基于同一个已解析工件运行。

`release-history` 是一个有界发布检查样本：最新六个稳定版本、`2026.4.23`，以及一个更早的日期前锚点。对于穷尽式已发布更新迁移覆盖，请在单独的 Update Migration workflow 中使用 `all-since-2026.4.23`，而不是 Full Release CI。

在发布前验证候选版本时，手动运行软件包配置：

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

当发布问题包含 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索或 OpenWebUI 时，使用 `suite_profile=product`。只有在需要完整 Docker 发布路径覆盖时才使用 `suite_profile=full`。

## 发布默认值

对于候选发布版本，默认证明栈是：

1. `pnpm check:changed` 和 `pnpm test:changed`，用于源代码级回归。
2. `pnpm release:check`，用于软件包工件完整性。
3. Package Acceptance `package` 配置，或发布检查自定义软件包 lanes，用于安装/更新/插件契约。
4. 跨 OS 发布检查，用于特定 OS 的安装器、新手引导和平台行为。
5. 只有当变更表面触及提供商或托管服务行为时，才运行实时测试套件。

在维护者机器上，宽范围关卡和 Docker/软件包产品证明应在 Testbox 中运行，除非明确是在做本地证明。

## 旧版兼容性

兼容性宽容是窄范围且有时间限制的：

- 直到 `2026.4.25` 的软件包，包括 `2026.4.25-beta.*`，可以在 Package Acceptance 中容忍已经发布的软件包元数据缺口。
- 已发布的 `2026.4.26` 软件包可以对已经发布的本地构建元数据戳记文件发出警告。
- 之后的软件包必须满足现代契约。同样的缺口会失败，而不是警告或跳过。

不要为这些旧形状添加新的启动迁移。添加或扩展 doctor 修复，然后用 `upgrade-survivor` 或 `published-upgrade-survivor` 证明它。

## 添加覆盖

更改更新或插件行为时，在能够因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：源代码旁边的单元测试。
- 软件包清单或已打包文件行为：`package-dist-inventory` 或 tarball 检查器测试。
- CLI 安装/更新行为：Docker lane 断言或 fixture。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 注册表/软件包来源行为：`test:docker:plugins` fixture 或 ClawHub fixture 服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖可能提升安装到托管 npm root 下，因此测试应证明该 root 被扫描/清理，而不是假设存在软件包本地 `node_modules` 树。

新的 Docker fixtures 默认保持 hermetic。除非测试重点就是实时注册表行为，否则使用本地 fixture 注册表和假软件包。

## 失败分诊

从工件身份开始：

- Package Acceptance `resolve_package` 摘要：来源、版本、SHA-256 和工件名称。
- Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志和重跑命令。
- 升级幸存者摘要：`.artifacts/upgrade-survivor/summary.json`，包括基线版本、候选版本、场景、阶段耗时和配方步骤。

优先使用相同的软件包工件重跑失败的精确 lane，而不是重跑整个发布总括。
