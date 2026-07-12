---
read_when:
    - 更改 OpenClaw 更新、Doctor、包验收或插件安装行为
    - 准备或批准候选发布版本
    - 调试软件包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、软件包迁移以及插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-07-11T20:36:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

更新和插件验证清单：证明可安装的软件包能够更新真实用户状态，通过 `doctor` 修复过时的旧版状态，并且仍能从所有受支持的来源安装、加载、更新和卸载插件。

有关更广泛的测试运行器地图，请参阅[测试](/zh-CN/help/testing)。有关实时提供商密钥和会访问网络的测试套件，请参阅[实时测试](/zh-CN/help/testing-live)。

## 我们保护的内容

- 软件包 tarball 内容完整，具有有效的 `dist/postinstall-inventory.json`，且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布软件包迁移到候选软件包，而不会丢失配置、智能体、会话、工作区、插件允许列表或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧版清理和修复路径。启动过程不应为过时的插件状态增加隐藏的兼容性迁移。
- 插件安装支持本地目录、git 仓库、npm 软件包和 ClawHub 注册表路径。
- 插件的 npm 依赖项在每个插件对应的单个托管 npm 项目中安装，在信任前接受扫描，并在卸载插件期间通过 `npm uninstall` 移除，以免提升到上层的依赖项残留。
- 没有任何变化时，插件更新不执行任何操作：安装记录、解析后的来源、已安装的依赖项布局和启用状态均保持不变。

## 开发期间的本地验证

从小范围开始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

对于插件安装、卸载、依赖项或软件包清单变更，还应运行覆盖所编辑接缝的聚焦测试：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何软件包 Docker 通道使用 tarball 之前，先验证软件包产物：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查（配置 schema、配置文档基线、插件 SDK API 基线和导出、插件版本/清单），写入软件包分发清单，运行 `npm pack --dry-run`，拒绝禁止打包的文件，将 tarball 安装到临时前缀，运行 postinstall，并对内置渠道入口点执行冒烟测试。

## Docker 通道

Docker 通道提供产品级验证。它们在 Linux 容器中安装或更新真实软件包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC 状态和文件系统状态断言行为。

迭代期间使用聚焦通道：

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

- `test:docker:plugins` 覆盖插件安装冒烟测试、本地文件夹安装、本地文件夹更新跳过行为、含预安装依赖项的本地文件夹、`file:` 软件包安装、带 CLI 执行的 git 安装、git 移动引用更新、含提升到上层的传递依赖项的 npm 注册表安装、npm 更新无操作、拒绝格式错误的 npm 软件包元数据、本地 ClawHub 固件安装和更新无操作、市场更新行为，以及 Claude 软件包的启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可使 ClawHub 测试块保持封闭/离线。
- `test:docker:plugin-lifecycle-matrix` 在空白容器中安装候选软件包，使一个 npm 插件依次经历安装、检查、禁用、启用、显式升级、显式降级，以及删除插件代码后的卸载。它会记录每个阶段的 RSS 和 CPU 指标。
- `test:docker:plugin-update` 验证未发生变化的已安装插件在执行 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 将候选 tarball 安装到含有杂乱旧用户状态的固件之上，运行软件包更新和非交互式 Doctor，然后启动 local loopback Gateway 网关并检查状态保留情况。
- `test:docker:published-upgrade-survivor` 首先安装已发布的基线，通过预置的 `openclaw config set` 配方对其进行配置，再将其更新到候选 tarball，运行 Doctor，检查旧版清理情况，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-restart-auth` 安装候选软件包，启动一个托管的令牌身份验证 Gateway 网关，为 `openclaw update --yes --json` 取消设置调用方的 Gateway 网关身份验证环境变量，并要求候选更新命令在执行常规探测前重启 Gateway 网关。
- `test:docker:update-migration` 是重点清理的已发布版本更新通道。它从已配置的 Discord/Telegram 风格用户状态开始，运行基线 Doctor，使已配置的插件依赖项有机会具现化，为已配置的打包插件植入旧版插件依赖项残留，更新到候选 tarball，并要求更新后的 Doctor 移除旧版依赖项根目录。

实用的已发布版本升级存续测试变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景：`base`、`acpx-openclaw-tools-bridge`、`feishu-channel`、`bootstrap-persona`、`channel-post-core-restore`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`（别名 `far-reaching`）会展开为所有场景，包括已配置插件的安装迁移。

完整的更新迁移有意与完整发布 CI 分离。当发布问题是“从 `2026.4.23` 开始的每个已发布稳定版本能否更新到此候选版本并清理插件依赖项残留？”时，请使用手动 `Update Migration` 工作流：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 软件包验收

软件包验收是 GitHub 原生的软件包门禁。它将一个候选软件包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该确切 tarball 运行可复用的 Docker 端到端通道。工作流测试框架引用与软件包来源引用彼此独立，因此当前测试逻辑可以验证较旧的可信版本。

候选来源：

- `source=npm`：验证 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest` 或确切的已发布版本。
- `source=ref`：使用选定的当前测试框架打包可信分支、标签或提交。
- `source=url`：使用必需的 `package_sha256` 验证公开 HTTPS tarball。此路径会拒绝 URL 凭据、非默认 HTTPS 端口、私有/内部主机名或 DNS/IP 结果、特殊用途 IP 空间及不安全的重定向。
- `source=trusted-url`：依据 `.github/package-trusted-sources.json` 中由维护者拥有的策略，使用必需的 `package_sha256` 和 `trusted_source_id` 验证 HTTPS tarball。对于企业/私有镜像，请使用此方式，而不要通过输入级允许私有访问的开关来削弱 `source=url`。按策略配置时，Bearer 身份验证使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密钥。
- `source=artifact`：复用另一次 Actions 运行上传的 tarball。

完整发布验证默认使用 `source=artifact`，并从解析出的发布 SHA 构建。对于发布后的验证，请传入 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`，使同一升级矩阵改为针对已发布的 npm 软件包。

发布检查使用以下软件包/更新/重启/插件集合调用软件包验收：

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

启用发布浸泡测试时（当 `release_profile=stable` 和 `full` 时强制启用），还会传入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这样可使软件包迁移、更新渠道切换、损坏的托管插件容错、过时插件依赖项清理、离线插件覆盖、插件更新行为和 Telegram 软件包 QA 针对同一个解析产物运行，同时避免默认发布软件包门禁遍历每个已发布版本。

`last-stable-4` 解析为 npm 上最新发布的四个 OpenClaw 稳定版本。发布软件包验收将 `2026.4.23` 固定为第一个插件更新兼容性边界，将 `2026.5.2` 固定为插件架构剧烈变动边界，并将 `2026.4.15` 固定为较旧的 2026.4.1x 已发布版本更新基线；解析器会去除已包含在最新四个版本中的重复固定版本。对于全面的已发布版本更新迁移覆盖，请在单独的更新迁移工作流中使用 `all-since-2026.4.23`，而不是使用完整发布 CI。如果还需要较旧日期之前的锚点，仍可使用 `release-history` 进行手动的更广泛抽样。

选择多个已发布版本升级存续测试基线时，可复用 Docker 工作流会将每个基线拆分到各自的定向运行器任务中。每个基线分片仍会运行选定的场景集合，但日志和产物按基线独立保存，总耗时受最慢分片限制，而不是由一个大型串行任务决定。

在发布前验证候选版本时，手动运行软件包配置文件：

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

对于已发布的扩展稳定版金丝雀，请设置 `package_spec=openclaw@extended-stable`。软件包验收会在 Docker 通道运行之前，将该选择器解析为确切的 tarball。

当发布问题涉及 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索或 OpenWebUI 时，使用 `suite_profile=product`。仅在需要完整的 Docker 发布路径覆盖时使用 `suite_profile=full`。

## 发布默认设置

对于候选发布版本，默认验证栈为：

1. 使用 `pnpm check:changed` 和 `pnpm test:changed` 检查源代码级回归。
2. 使用 `pnpm release:check` 检查软件包产物完整性。
3. 使用软件包验收的 `package` 配置文件或发布检查的自定义软件包通道，验证安装/更新/重启/插件契约。
4. 使用跨操作系统发布检查，验证特定于操作系统的安装程序、新手引导和平台行为。
5. 仅当变更的表面涉及提供商或托管服务行为时运行实时测试套件。

在维护者的机器上，除非明确执行本地验证，否则广泛门禁和 Docker/软件包产品验证应在 Testbox 中运行。

## 旧版兼容性

兼容性宽容范围很窄，并且有明确的时限：

- 截至 `2026.4.25` 的软件包（包括 `2026.4.25-beta.*`）可在软件包验收中容忍已发布的软件包元数据缺失。
- 已发布的 `2026.4.26` 软件包可针对已经发布的本地构建元数据戳文件发出警告。
- 后续软件包必须满足现代契约。同样的问题将导致失败，而不是警告或跳过。

不要为这些旧形态添加新的启动迁移。添加或扩展 Doctor 修复，然后使用 `upgrade-survivor`、`published-upgrade-survivor` 或者在更新命令负责重启时使用 `update-restart-auth` 进行验证。

## 添加覆盖范围

更改更新或插件行为时，请在能够因正确原因失败的最低层级添加覆盖：

- 纯路径或元数据逻辑：在源文件旁添加单元测试。
- 软件包清单或打包文件行为：使用 `package-dist-inventory` 或 tarball
  检查器测试。
- CLI 安装/更新行为：使用 Docker 通道断言或测试夹具。
- 已发布版本的迁移行为：使用 `published-upgrade-survivor` 场景。
- 更新流程负责的重启行为：使用 `update-restart-auth`。
- 注册表/软件包源行为：使用 `test:docker:plugins` 测试夹具或 ClawHub
  测试夹具服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖可能会被提升到插件的
  托管 npm 项目中，因此测试应证明该项目会被扫描/清理，而不是假设只处理插件软件包本地的
  `node_modules` 树。

默认情况下，新 Docker 测试夹具应保持完全隔离。除非测试的目的就是验证实时注册表行为，否则应使用本地测试夹具注册表和
伪软件包。

## 故障分类排查

从制品标识开始：

- Package Acceptance 的 `resolve_package` 摘要：来源、版本、SHA-256 和
  制品名称。
- Docker 制品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、通道日志和重新运行命令。
- 升级存续测试摘要：`.artifacts/upgrade-survivor/summary.json`，
  包括基线版本、候选版本、场景、各阶段耗时和配置方案覆盖情况。

优先使用同一软件包制品重新运行失败的确切通道，而不是重新运行整个发布总流程。
