---
read_when:
    - 更改 OpenClaw 更新、Doctor、包验收或插件安装行为
    - 准备或批准候选版本
    - 调试软件包更新、插件依赖清理或插件安装回归
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、包迁移以及插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-07-05T11:23:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

更新和插件验证清单：证明可安装的软件包能够更新真实用户状态，通过 `doctor` 修复陈旧的旧版状态，并且仍然可以从每个受支持来源安装、加载、更新和卸载插件。

有关更广泛的测试运行器地图，请参阅 [测试](/zh-CN/help/testing)。有关实时提供商密钥和会触碰网络的套件，请参阅 [实时测试](/zh-CN/help/testing-live)。

## 我们保护的内容

- 软件包 tarball 是完整的，具有有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布软件包迁移到候选软件包，而不会丢失配置、智能体、会话、工作区、插件允许列表或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧版清理和修复路径。启动过程不应为陈旧插件状态增加隐藏的兼容性迁移。
- 插件安装可从本地目录、git 仓库、npm 软件包和 ClawHub 注册表路径正常工作。
- 插件 npm 依赖会安装到每个插件一个受管理的 npm 项目中，在信任前接受扫描，并在插件卸载期间通过 `npm uninstall` 移除，以免提升的依赖残留。
- 当没有任何变化时，插件更新是空操作：安装记录、解析后的来源、已安装依赖布局和启用状态保持不变。

## 开发期间的本地验证

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

在任何软件包 Docker 测试通道消费 tarball 之前，先证明软件包制品：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查（配置 schema、配置文档基线、插件 SDK API 基线和导出、插件版本/清单），写入软件包 dist 清单，运行 `npm pack --dry-run`，拒绝被禁止的打包文件，将 tarball 安装到临时前缀，运行 postinstall，并冒烟测试内置渠道入口点。

## Docker 测试通道

Docker 测试通道是产品级验证。它们在 Linux 容器内安装或更新真实软件包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC 状态和文件系统状态断言行为。

迭代时使用聚焦测试通道：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要测试通道：

- `test:docker:plugins` 覆盖插件安装冒烟、本地文件夹安装、本地文件夹更新跳过行为、带有预安装依赖的本地文件夹、`file:` 软件包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升的传递依赖的 npm 注册表安装、npm 更新空操作、格式错误的 npm 软件包元数据拒绝、本地 ClawHub fixture 安装和更新空操作、市场更新行为，以及 Claude 包启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可保持 ClawHub 块密封/离线。
- `test:docker:plugin-lifecycle-matrix` 在裸容器中安装候选软件包，运行一个 npm 插件完成安装、检查、禁用、启用、显式升级、显式降级，以及在删除插件代码后的卸载。它会按阶段记录 RSS 和 CPU 指标。
- `test:docker:plugin-update` 验证未变化的已安装插件不会在 `openclaw plugins update` 期间重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 将候选 tarball 安装到脏的旧用户 fixture 上，运行软件包更新以及非交互式 Doctor，然后启动 local loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 先安装已发布基线，通过内置的 `openclaw config set` 配方配置它，将其更新到候选 tarball，运行 Doctor，检查旧版清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-restart-auth` 安装候选软件包，启动受管理的令牌认证 Gateway 网关，为 `openclaw update --yes --json` 取消设置调用方 Gateway 网关认证环境变量，并要求候选更新命令在正常探测前重启 Gateway 网关。
- `test:docker:update-migration` 是以清理为重点的已发布更新测试通道。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 Doctor，让已配置的插件依赖有机会物化，为已配置的打包插件植入旧版插件依赖残留，更新到候选 tarball，并要求更新后 Doctor 移除旧版依赖根目录。

有用的已发布升级幸存者变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景：`base`、`acpx-openclaw-tools-bridge`、`feishu-channel`、`bootstrap-persona`、`channel-post-core-restore`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`（别名 `far-reaching`）会展开为所有场景，包括已配置插件安装迁移。

完整更新迁移有意与完整发布 CI 分开。当发布问题是“从 2026.4.23 起的每个已发布稳定版本是否都能更新到此候选版本并清理插件依赖残留？”时，使用手动 `Update Migration` 工作流：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 软件包验收

软件包验收是 GitHub 原生的软件包门禁。它会将一个候选软件包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用的 Docker E2E 测试通道。工作流 harness ref 与软件包来源 ref 分离，因此当前测试逻辑可以验证较旧的受信任版本。

候选来源：

- `source=npm`：验证 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：使用选定的当前 harness 打包受信任的分支、标签或提交。
- `source=url`：验证带有所需 `package_sha256` 的公共 HTTPS tarball。此路径会拒绝 URL 凭据、非默认 HTTPS 端口、私有/内部主机名或 DNS/IP 结果、特殊用途 IP 空间和不安全重定向。
- `source=trusted-url`：根据 `.github/package-trusted-sources.json` 中维护者拥有的策略，验证带有所需 `package_sha256` 和 `trusted_source_id` 的 HTTPS tarball。将此用于企业/私有镜像，而不是用输入级 allow-private 开关削弱 `source=url`。当策略配置 Bearer auth 时，会使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

完整发布验证默认使用 `source=artifact`，由解析后的发布 SHA 构建。对于发布后验证，传入 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`，使同一个升级矩阵改为目标已发布的 npm 软件包。

发布检查会使用 package/update/restart/plugin 集调用软件包验收：

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

启用发布 soak 时（对 `release_profile=stable` 和 `full` 强制开启），它们还会传入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这会让软件包迁移、更新频道切换、损坏的受管理插件容忍度、陈旧插件依赖清理、离线插件覆盖、插件更新行为，以及 Telegram 软件包 QA 使用同一个已解析制品，而无需让默认发布软件包门禁遍历每个已发布版本。

`last-stable-4` 会解析为最近四个稳定的 npm 已发布 OpenClaw 版本。发布软件包验收将 `2026.4.23` 固定为第一个插件更新兼容性边界，将 `2026.5.2` 固定为插件架构变动边界，并将 `2026.4.15` 固定为较旧的 2026.4.1x 已发布更新基线；解析器会对已包含在最新四个版本中的固定版本去重。对于详尽的已发布更新迁移覆盖，请在单独的更新迁移工作流中使用 `all-since-2026.4.23`，而不是使用完整发布 CI。当你还想要旧版日期前锚点时，`release-history` 仍可用于手动更广采样。

选择多个已发布升级幸存者基线时，可复用 Docker 工作流会将每个基线分片到自己的目标 runner job。每个基线分片仍会运行选定的场景集，但日志和制品会按基线保留，墙钟时间由最慢的分片限制，而不是由一个大型串行 job 限制。

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

对于已发布的 extended-stable 金丝雀版本，设置 `package_spec=openclaw@extended-stable`。软件包验收会在 Docker 测试通道运行前，将该选择器解析为精确 tarball。

当发布问题包含 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索或 OpenWebUI 时，使用 `suite_profile=product`。仅当你需要完整 Docker 发布路径覆盖时，才使用 `suite_profile=full`。

## 发布默认值

对于候选发布版本，默认验证栈是：

1. `pnpm check:changed` 和 `pnpm test:changed`，用于源代码级回归。
2. `pnpm release:check`，用于软件包制品完整性。
3. 软件包验收 `package` profile 或 release-check 自定义软件包测试通道，用于安装/更新/重启/插件契约。
4. 跨 OS 发布检查，用于特定 OS 的安装器、新手引导和平台行为。
5. 仅当变更表面触及提供商或托管服务行为时，运行实时套件。

在维护者机器上，广泛门禁和 Docker/软件包产品验证应在 Testbox 中运行，除非明确执行本地验证。

## 旧版兼容性

兼容性宽容范围很窄且有时间限制：

- 截至 `2026.4.25` 的软件包，包括 `2026.4.25-beta.*`，可以在软件包验收中容忍已经发布的软件包元数据缺口。
- 已发布的 `2026.4.26` 软件包可以对已经发布的本地构建元数据戳文件发出警告。
- 后续软件包必须满足现代契约。同样的缺口会失败，而不是警告或跳过。

不要为这些旧形状添加新的启动迁移。添加或扩展 Doctor 修复，然后在更新命令负责重启时，通过 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 证明它。

## 添加覆盖

更改更新或插件行为时，在能因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：在源码旁添加单元测试。
- 包清单或打包文件行为：`package-dist-inventory` 或 tarball
  检查器测试。
- CLI 安装/更新行为：Docker lane 断言或 fixture。
- 已发布版本的迁移行为：`published-upgrade-survivor` 场景。
- 更新所拥有的重启行为：`update-restart-auth`。
- 注册表/包源行为：`test:docker:plugins` fixture 或 ClawHub
  fixture 服务器。
- 依赖布局或清理行为：同时断言运行时执行和
  文件系统边界。npm 依赖可能会被提升到插件的
  托管 npm 项目内部，因此测试应证明会扫描/清理该项目，
  而不是假设只存在插件包本地的 `node_modules` 树。

默认保持新的 Docker fixture 密闭。使用本地 fixture 注册表和
假包，除非测试重点是实时注册表行为。

## 失败分诊

从工件身份开始：

- Package Acceptance `resolve_package` 摘要：来源、版本、SHA-256，以及
  工件名称。
- Docker 工件：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane 日志，以及重新运行命令。
- 升级 survivor 摘要：`.artifacts/upgrade-survivor/summary.json`，
  包括基线版本、候选版本、场景、阶段耗时，以及
  配置配方覆盖范围。

优先使用同一个包工件重新运行失败的精确 lane，
而不是重新运行整个发布总伞。
