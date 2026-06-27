---
read_when:
    - 更改 OpenClaw 更新、Doctor、包验收或插件安装行为
    - 准备或批准候选发布版本
    - 调试包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、包迁移和插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-06-27T02:14:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是用于更新和插件验证的专用检查清单。目标很简单：证明可安装包可以更新真实用户状态，通过 `doctor` 修复过时的旧状态，并且仍能从受支持来源安装、加载、更新和卸载插件。

关于更广泛的测试运行器映射，请参阅[测试](/zh-CN/help/testing)。关于实时提供商密钥和会访问网络的套件，请参阅[实时测试](/zh-CN/help/testing-live)。

## 我们保护什么

更新和插件测试保护这些契约：

- 包 tarball 是完整的，具有有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布包迁移到候选包，而不会丢失配置、智能体、会话、工作区、插件允许列表或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧状态清理和修复路径。启动不应为过时的插件状态增加隐藏的兼容性迁移。
- 插件安装可从本地目录、git 仓库、npm 包和 ClawHub 注册表路径正常工作。
- 插件 npm 依赖会安装到每个插件一个受管理的 npm 项目中，在信任前进行扫描，并在卸载期间通过 npm 移除，这样提升安装的依赖不会残留。
- 当没有变化时，插件更新保持稳定：安装记录、已解析来源、已安装依赖布局和启用状态保持不变。

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

在任何包 Docker lane 消费 tarball 之前，先证明包工件：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入包 dist 清单，运行 `npm pack --dry-run`，拒绝禁止打包的文件，将 tarball 安装到临时前缀中，运行 postinstall，并对内置渠道入口点做冒烟测试。

## Docker lanes

Docker lanes 是产品级证明。它们会在 Linux 容器内安装或更新真实包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC 状态和文件系统状态断言行为。

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

- `test:docker:plugins` 验证插件安装冒烟测试、本地文件夹安装、本地文件夹更新跳过行为、带预安装依赖的本地文件夹、`file:` 包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升安装的传递依赖的 npm 注册表安装、npm 更新无操作、畸形 npm 包元数据拒绝、本地 ClawHub fixture 安装和更新无操作、marketplace 更新行为，以及 Claude 包启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 块保持密封/离线。
- `test:docker:plugin-lifecycle-matrix` 会在裸容器中安装候选包，让一个 npm 插件依次完成安装、检查、禁用、启用、显式升级、显式降级，以及删除插件代码后的卸载。它会记录每个阶段的 RSS 和 CPU 指标。
- `test:docker:plugin-update` 验证未变化的已安装插件在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 会把候选 tarball 安装到脏的旧用户 fixture 之上，运行包更新以及非交互式 doctor，然后启动一个 local loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 会先安装一个已发布基线，通过内置的 `openclaw config set` 配方配置它，将其更新到候选 tarball，运行 doctor，检查旧状态清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-restart-auth` 会安装候选包，启动一个受管理的令牌认证 Gateway 网关，为 `openclaw update --yes --json` 取消设置调用方 Gateway 网关认证环境变量，并要求候选更新命令在常规探测之前重启 Gateway 网关。
- `test:docker:update-migration` 是重清理的已发布更新 lane。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 doctor，让已配置插件依赖有机会落地，为已配置的打包插件植入旧插件依赖残留，更新到候选 tarball，并要求更新后 doctor 移除旧依赖根目录。

有用的已发布升级 survivor 变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会扩展为所有报告问题形态的场景，包括已配置插件安装迁移。

完整更新迁移有意与完整发布 CI 分开。当发布问题是“从 2026.4.23 起的每个已发布稳定版本是否都能更新到这个候选版本并清理插件依赖残留？”时，使用手动 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 包验收

包验收是 GitHub 原生的包门禁。它会将一个候选包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用的 Docker E2E lanes。workflow harness ref 与包源 ref 分离，因此当前测试逻辑可以验证较旧的受信任版本。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或一个精确的已发布版本。
- `source=ref`：使用选定的当前 harness 打包受信任分支、标签或提交。
- `source=url`：使用必需的 `package_sha256` 验证公共 HTTPS tarball。此路径会拒绝 URL 凭据、非默认 HTTPS 端口、私有/内部主机名或 DNS/IP 结果、特殊用途 IP 空间和不安全重定向。
- `source=trusted-url`：使用必需的 `package_sha256` 和 `trusted_source_id`，根据 `.github/package-trusted-sources.json` 中维护者拥有的策略验证 HTTPS tarball。对企业/私有镜像使用此项，而不是用输入级允许私有开关削弱 `source=url`。Bearer 认证在由策略配置时使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密钥。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

完整发布验证默认使用 `source=artifact`，由已解析的发布 SHA 构建。对于发布后证明，传入 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`，让相同的升级矩阵改为针对已发布的 npm 包。

发布检查使用包/更新/重启/插件集合调用包验收：

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

当启用发布浸泡测试时，它们还会传入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这会让包迁移、更新渠道切换、损坏受管理插件容错、过时插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 包 QA 使用同一个已解析工件，而不会让默认发布包门禁遍历每个已发布版本。

`last-stable-4` 会解析为最新四个 npm 已发布稳定 OpenClaw 版本。发布包验收将 `2026.4.23` 固定为第一个插件更新兼容性边界，将 `2026.5.2` 固定为插件架构变动边界，将 `2026.4.15` 固定为较旧的 2026.4.1x 已发布更新基线；解析器会去重已包含在最新四个版本中的固定项。对于穷尽式已发布更新迁移覆盖，请在单独的更新迁移 workflow 中使用 `all-since-2026.4.23`，而不是完整发布 CI。当你还需要旧的前置日期锚点时，`release-history` 仍可用于手动的更广泛采样。

选择多个已发布升级 survivor 基线时，可复用 Docker workflow 会将每个基线分片到它自己的定向 runner job。每个基线分片仍会运行所选场景集合，但日志和工件按基线保留，墙钟时间由最慢的分片界定，而不是一个大型串行 job。

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

当发布问题包括 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索或 OpenWebUI 时，使用 `suite_profile=product`。仅在你需要完整 Docker 发布路径覆盖时使用 `suite_profile=full`。

## 发布默认值

对于发布候选，默认证明栈是：

1. 使用 `pnpm check:changed` 和 `pnpm test:changed` 检查源码级回归。
2. 使用 `pnpm release:check` 检查包工件完整性。
3. 使用包验收 `package` profile 或发布检查自定义包 lanes 检查安装/更新/重启/插件契约。
4. 跨 OS 发布检查，用于 OS 特定安装器、新手引导和平台行为。
5. 仅当变更表面触及提供商或托管服务行为时运行实时套件。

在维护者机器上，宽范围门禁和 Docker/包产品证明应在 Testbox 中运行，除非明确在做本地证明。

## 旧版兼容性

兼容性宽松范围很窄且有时间限制：

- 到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以在包验收中容忍已发布的包元数据缺口。
- 已发布的 `2026.4.26` 包可以对已发布的本地构建元数据戳文件发出警告。
- 后续包必须满足现代契约。相同缺口会失败，而不是警告或跳过。

不要为这些旧形状添加新的启动迁移。添加或扩展 doctor 修复，然后在更新命令负责重启时，用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 证明它。

## 添加覆盖

更改更新或插件行为时，在能因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：在源代码旁边添加单元测试。
- 包清单或打包文件行为：`package-dist-inventory` 或 tarball
  检查器测试。
- CLI 安装/更新行为：Docker lane 断言或 fixture。
- 已发布版本的迁移行为：`published-upgrade-survivor` 场景。
- 更新拥有的重启行为：`update-restart-auth`。
- 注册表/包源行为：`test:docker:plugins` fixture 或 ClawHub
  fixture 服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖可能会提升到插件的
  托管 npm 项目内，因此测试应证明扫描/清理的是该项目，
  而不是假设只处理插件包本地的 `node_modules` 树。

默认保持新的 Docker fixture 自包含。除非测试目的就是验证实时注册表行为，
否则使用本地 fixture 注册表和假包。

## 故障分诊

从制品身份开始：

- 包验收 `resolve_package` 摘要：来源、版本、SHA-256 和
  制品名称。
- Docker 制品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane 日志和重跑命令。
- 升级幸存者摘要：`.artifacts/upgrade-survivor/summary.json`，
  包括基线版本、候选版本、场景、阶段耗时和
  recipe 步骤。

优先使用同一个包制品重跑失败的精确 lane，
而不是重跑整个发布总控流程。
