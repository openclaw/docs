---
read_when:
    - 更改 OpenClaw 更新、Doctor、软件包验收或插件安装行为
    - 准备或批准发布候选版本
    - 调试包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、包迁移以及插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-05-04T20:59:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是更新和插件验证的专用检查清单。目标很简单：证明可安装包能够更新真实用户状态，通过 `doctor` 修复过时的旧版状态，并且仍然能从受支持来源安装、加载、更新和卸载插件。

如需更广泛的测试运行器映射，请参阅[测试](/zh-CN/help/testing)。如需实时提供商密钥和会触达网络的套件，请参阅[实时测试](/zh-CN/help/testing-live)。

## 我们保护什么

更新和插件测试保护这些契约：

- 包 tarball 完整，包含有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布包迁移到候选包，而不会丢失配置、智能体、会话、工作区、插件允许列表或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧版清理和修复路径。启动过程不应为过时插件状态增加隐藏的兼容性迁移。
- 插件安装可从本地目录、git 仓库、npm 包和 ClawHub 注册表路径正常工作。
- 插件 npm 依赖安装在受管理的 npm 根目录中，在信任前会被扫描，并在卸载期间通过 npm 移除，因此提升安装的依赖不会残留。
- 当没有任何变化时，插件更新保持稳定：安装记录、解析后的来源、已安装依赖布局和启用状态都保持完整。

## 开发期间的本地证明

从窄范围开始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

对于插件安装、卸载、依赖或包清单变更，还要运行覆盖已编辑边界的聚焦测试：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何包 Docker 通道消费 tarball 之前，先证明包构件：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入包 dist 清单，运行 `npm pack --dry-run`，拒绝被禁止打包的文件，将 tarball 安装到临时前缀中，运行 postinstall，并对内置渠道入口点执行冒烟测试。

## Docker 通道

Docker 通道是产品级证明。它们会在 Linux 容器内安装或更新真实包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC Status 和文件系统状态断言行为。

迭代时使用聚焦通道：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要通道：

- `test:docker:plugins` 验证插件安装冒烟测试、本地文件夹安装、本地文件夹更新跳过行为、带预安装依赖的本地文件夹、`file:` 包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升传递依赖的 npm 注册表安装、npm 更新空操作、本地 ClawHub fixture 安装和更新空操作、marketplace 更新行为，以及 Claude 包启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 区块保持封闭/离线。
- `test:docker:plugin-lifecycle-matrix` 在裸容器中安装候选包，让一个 npm 插件经过安装、检查、禁用、启用、显式升级、显式降级，以及删除插件代码后的卸载。它会记录每个阶段的 RSS 和 CPU 指标。
- `test:docker:plugin-update` 验证未变更的已安装插件在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 将候选 tarball 安装到脏的旧用户 fixture 之上，运行包更新和非交互式 Doctor，然后启动 local loopback Gateway 网关并检查状态保留情况。
- `test:docker:published-upgrade-survivor` 首先安装一个已发布基线，通过内置的 `openclaw config set` 配方对其进行配置，将其更新到候选 tarball，运行 Doctor，检查旧版清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC Status。
- `test:docker:update-migration` 是清理密集型的已发布更新通道。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 Doctor，让已配置的插件依赖有机会落地，为已配置的打包插件植入旧版插件依赖残留，更新到候选 tarball，并要求更新后的 Doctor 移除旧版依赖根目录。

有用的已发布升级幸存者变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会展开为所有呈现为已报告问题形态的场景，包括已配置插件安装迁移。

完整更新迁移有意与完整发布 CI 分离。当发布问题是“从 `2026.4.23` 起每个已发布稳定版本是否都能更新到此候选版本并清理插件依赖残留？”时，请使用手动 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 包验收

包验收是 GitHub 原生包门禁。它会将一个候选包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用 Docker E2E 通道。workflow harness 引用与包源码引用分离，因此当前测试逻辑可以验证较旧的受信任版本。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：使用选定的当前 harness 打包受信任的分支、标签或提交。
- `source=url`：验证 HTTPS tarball，并要求提供 `package_sha256`。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

完整发布验证默认使用 `source=artifact`，基于解析后的发布 SHA 构建。对于发布后证明，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`，让同一升级矩阵以已发布的 npm 包为目标。

发布检查会用包/更新/插件集合调用包验收：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它们还会传入：

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这会让包迁移、更新渠道切换、过时插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 包 QA 使用同一个解析后的构件。

`all-since-2026.4.23` 是完整发布 CI 升级样本：从 `2026.4.23` 到 `latest` 的每个已发布到 npm 的稳定版本。对于穷尽式已发布更新迁移覆盖，请在单独的更新迁移 workflow 中使用 `all-since-2026.4.23`，而不是完整发布 CI。`release-history` 仍可用于手动更宽采样，适用于你还想包含旧版日期前锚点的情况。

在发布前验证候选包时，手动运行包 profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

当发布问题包含 MCP 渠道、cron/subagent 清理、OpenAI web search 或 OpenWebUI 时，使用 `suite_profile=product`。只有在需要完整 Docker 发布路径覆盖时，才使用 `suite_profile=full`。

## 发布默认值

对于候选发布版本，默认证明栈是：

1. `pnpm check:changed` 和 `pnpm test:changed`，用于源码级回归。
2. `pnpm release:check`，用于包构件完整性。
3. 包验收 `package` profile 或发布检查自定义包通道，用于安装/更新/插件契约。
4. 跨 OS 发布检查，用于特定 OS 的安装器、新手引导和平台行为。
5. 只有当变更表面触及提供商或托管服务行为时，才运行实时套件。

在维护者机器上，宽范围门禁和 Docker/包产品证明应在 Testbox 中运行，除非明确要做本地证明。

## 旧版兼容性

兼容宽容范围很窄并且有时限：

- 到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，在包验收中可以容忍已经发布的包元数据缺口。
- 已发布的 `2026.4.26` 包可以对已经发布的本地构建元数据戳文件发出警告。
- 后续包必须满足现代契约。同样的缺口会失败，而不是警告或跳过。

不要为这些旧形态添加新的启动迁移。添加或扩展 Doctor 修复，然后用 `upgrade-survivor` 或 `published-upgrade-survivor` 证明它。

## 添加覆盖

更改更新或插件行为时，在能因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：源码旁的单元测试。
- 包清单或打包文件行为：`package-dist-inventory` 或 tarball 检查器测试。
- CLI 安装/更新行为：Docker 通道断言或 fixture。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 注册表/包来源行为：`test:docker:plugins` fixture 或 ClawHub fixture 服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖可能会被提升到受管理的 npm 根目录下，因此测试应证明该根目录被扫描/清理，而不是假设存在包本地的 `node_modules` 树。

默认保持新的 Docker fixture 封闭。除非测试目的就是实时注册表行为，否则使用本地 fixture 注册表和假包。

## 失败分诊

从构件身份开始：

- 包验收 `resolve_package` 摘要：来源、版本、SHA-256 和构件名称。
- Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志和重新运行命令。
- 升级幸存者摘要：`.artifacts/upgrade-survivor/summary.json`，包括基线版本、候选版本、场景、阶段耗时和配方步骤。

优先使用同一个包构件重新运行失败的精确通道，而不是重新运行整个发布总括任务。
