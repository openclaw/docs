---
read_when:
    - 更改 OpenClaw 更新、Doctor、软件包验收或插件安装行为
    - 准备或批准发布候选版
    - 调试包更新、插件依赖清理或插件安装回归问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何验证更新路径、软件包迁移以及插件安装/更新行为
title: 更新和插件测试
x-i18n:
    generated_at: "2026-05-01T22:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc3cfa7b6a1ede28dfb12940b56d34d3f8ca4d539c26fd818d663d7052f962a8
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

这是更新和插件验证的专用清单。目标很简单：证明可安装包可以更新真实用户状态，通过 `doctor` 修复陈旧的旧版状态，并且仍能从受支持的来源安装、加载、更新和卸载插件。

如需更完整的测试运行器地图，请参见 [测试](/zh-CN/help/testing)。如需实时提供商密钥和触网套件，请参见 [实时测试](/zh-CN/help/testing-live)。

## 我们保护什么

更新和插件测试保护以下契约：

- 软件包 tarball 完整，包含有效的 `dist/postinstall-inventory.json`，并且不依赖未打包的仓库文件。
- 用户可以从较旧的已发布包迁移到候选包，而不会丢失配置、智能体、会话、工作区、插件 allowlist 或渠道配置。
- `openclaw doctor --fix --non-interactive` 负责旧版清理和修复路径。启动流程不应为陈旧的插件状态增加隐藏的兼容性迁移。
- 插件安装可从本地目录、git 仓库、npm 包和 ClawHub 注册表路径正常工作。
- 插件 npm 依赖会安装到托管 npm 根目录中，在信任前被扫描，并在卸载期间通过 npm 移除，避免提升的依赖残留。
- 插件在无变更时更新保持稳定：安装记录、解析后的来源和启用状态保持不变。

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

在任何包 Docker lane 使用 tarball 之前，先证明包产物：

```bash
pnpm release:check
```

`release:check` 会运行配置/文档/API 漂移检查，写入包 dist 清单，运行 `npm pack --dry-run`，拒绝被禁止打包的文件，将 tarball 安装到临时前缀，运行 postinstall，并对内置渠道入口点做冒烟测试。

## Docker lane

Docker lane 是产品级证明。它们会在 Linux 容器内安装或更新真实包，并通过 CLI 命令、Gateway 网关启动、HTTP 探测、RPC Status 和文件系统状态断言行为。

迭代时使用聚焦 lane：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
```

重要 lane：

- `test:docker:plugins` 验证插件安装冒烟、本地文件夹安装、带预安装依赖的本地文件夹、带包依赖的 git 安装、npm 包依赖安装、本地 ClawHub fixture 安装、市场更新行为，以及 Claude bundle 启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可让 ClawHub 区块保持封闭/离线。
- `test:docker:plugin-update` 验证未变更的已安装插件在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 会把候选 tarball 安装到脏的旧用户 fixture 之上，运行包更新和非交互式 Doctor，然后启动 local loopback Gateway 网关并检查状态保留。
- `test:docker:published-upgrade-survivor` 先安装已发布基线，通过烘焙的 `openclaw config set` 配方配置它，再更新到候选 tarball，运行 Doctor，检查旧版清理，启动 Gateway 网关，并探测 `/healthz`、`/readyz` 和 RPC Status。

有用的 published-upgrade survivor 变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景包括 `base`、`feishu-channel`、`bootstrap-persona`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 会扩展为所有已报告问题形态的场景。

## Package Acceptance

Package Acceptance 是 GitHub 原生的包门禁。它会将一个候选包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该精确 tarball 运行可复用的 Docker E2E lane。workflow harness ref 与包来源 ref 分离，因此当前测试逻辑可以验证较旧的受信任版本。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：使用选定的当前 harness 打包受信任的分支、标签或提交。
- `source=url`：验证需要 `package_sha256` 的 HTTPS tarball。
- `source=artifact`：复用另一个 Actions 运行上传的 tarball。

发布检查会用包/更新/插件集合调用 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它们还会传入：

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这会让包迁移、更新渠道切换、陈旧插件依赖清理、离线插件覆盖、插件更新行为和 Telegram 包 QA 使用同一个已解析产物。

在发布前验证候选包时，手动运行包 profile：

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

当发布问题包含 MCP 渠道、cron/subagent 清理、OpenAI web search 或 OpenWebUI 时，使用 `suite_profile=product`。仅在需要完整 Docker 发布路径覆盖时使用 `suite_profile=full`。

## 发布默认项

对于发布候选，默认证明栈是：

1. 针对源码级回归运行 `pnpm check:changed` 和 `pnpm test:changed`。
2. 针对包产物完整性运行 `pnpm release:check`。
3. 针对安装/更新/插件契约运行 Package Acceptance `package` profile 或发布检查自定义包 lane。
4. 针对 OS 特定安装器、新手引导和平台行为运行跨 OS 发布检查。
5. 仅当变更面触及提供商或托管服务行为时运行实时套件。

在维护者机器上，广范围门禁和 Docker/包产品证明应在 Testbox 中运行，除非明确要做本地证明。

## 旧版兼容性

兼容性宽松范围很窄且有时间限制：

- 截至 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可以在 Package Acceptance 中容忍已发布的包元数据缺口。
- 已发布的 `2026.4.26` 包可以对已发布的本地构建元数据戳文件发出警告。
- 之后的包必须满足现代契约。相同缺口会失败，而不是警告或跳过。

不要为这些旧形态添加新的启动迁移。添加或扩展 Doctor 修复，然后用 `upgrade-survivor` 或 `published-upgrade-survivor` 证明它。

## 添加覆盖

更改更新或插件行为时，在能因正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：源旁边的单元测试。
- 包清单或已打包文件行为：`package-dist-inventory` 或 tarball 检查器测试。
- CLI 安装/更新行为：Docker lane 断言或 fixture。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 注册表/包来源行为：`test:docker:plugins` fixture 或 ClawHub fixture 服务器。

让新的 Docker fixture 默认保持封闭。使用本地 fixture 注册表和假包，除非测试重点是实时注册表行为。

## 失败分诊

从产物身份开始：

- Package Acceptance `resolve_package` 摘要：来源、版本、SHA-256 和产物名称。
- Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志和重跑命令。
- Upgrade survivor 摘要：`.artifacts/upgrade-survivor/summary.json`，包括基线版本、候选版本、场景、阶段耗时和配方步骤。

优先使用相同包产物重跑失败的精确 lane，而不是重跑整个发布总括流程。
