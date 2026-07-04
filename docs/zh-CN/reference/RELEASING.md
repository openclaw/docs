---
read_when:
    - 查找公开发布频道定义
    - 运行发布验证或软件包验收
    - 寻找版本命名和发布节奏
summary: 发布通道、操作员清单、验证框、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-07-04T17:50:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 当前公开三个面向用户的更新频道：

- stable：现有的已提升发布频道，在单独的 CLI/频道里程碑落地前，它仍通过
  npm `latest` 解析
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

另外，发布操作员可以从补丁 `33` 开始，将刚结束月份的核心
包发布到 npm `extended-stable`。当前月份的常规
最终线继续使用 npm `latest`；这个操作员侧的发布拆分本身
不会改变 CLI 更新频道解析。

## 版本命名

- 每月 npm extended-stable 发布版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`
  - Git 标签：`vYYYY.M.PATCH`
- 每日/常规最终发布版本：`YYYY.M.PATCH`，其中 `PATCH < 33`
  - Git 标签：`vYYYY.M.PATCH`
- 常规回退修正发布版本：`YYYY.M.PATCH-N`
  - Git 标签：`vYYYY.M.PATCH-N`
- Beta 预发布版本：`YYYY.M.PATCH-beta.N`
  - Git 标签：`vYYYY.M.PATCH-beta.N`
- 不要对月份或补丁号补零
- 从 2026 年 6 月发布流程更新开始，第三个组成部分是一个
  顺序递增的月度发布列车编号，而不是日历日期。Stable 和 beta
  发布决定当前列车；仅 alpha 标签不会消耗或
  推进 beta/stable 补丁号。更新前的标签和 npm 版本保留
  其现有名称并继续有效；发布自动化继续按
  年、月、补丁、频道以及预发布或修正
  编号比较它们。
- Alpha/nightly 构建使用下一个尚未发布的补丁列车，并且对重复构建只递增
  `alpha.N`。一旦该补丁已有 beta，新的 alpha 构建
  会移动到下一个补丁。选择 beta 或 stable 列车时，忽略补丁号
  更高的旧版仅 alpha 标签。
- npm 版本不可变。如果某个 beta 标签已经发布，不要
  删除、重新发布或复用它；改为切下一个 beta 编号或下一个月度
  补丁。由于 `2026.6.5-beta.1` 已在
  过渡期间发布，2026 年 6 月发布列车必须使用补丁 `5` 或更高版本。不要
  将新的 2026 年 6 月 stable 或 beta 列车发布为 `2026.6.2`、`2026.6.3` 或
  `2026.6.4`。
- 在常规最终版 `2026.6.5` 之后，下一个新的 beta 列车是
  `2026.6.6-beta.1`，即使
  已经存在补丁号更高的自动化仅 alpha 标签。
- `latest` 继续跟随当前常规/每日 npm 线
- `beta` 表示当前 beta 安装目标
- `extended-stable` 表示受支持的上一月份 npm 包，从补丁
  `33` 开始；补丁 `34` 及之后是该月度线上的维护发布
- 专用的月度 extended-stable 路径只发布核心 npm 包。它
  不发布插件、macOS 或 Windows 构件、GitHub Release、
  私有仓库 dist-tag、Docker 镜像、移动端构件或网站
  下载内容。

## 发布节奏

- 发布先进入 beta
- Stable 只在最新 beta 验证完成后跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.PATCH` 分支切发布，
  因此发布验证和修复不会阻塞 `main` 上的新
  开发
- 如果某个 beta 标签已经推送或发布并且需要修复，维护者会切
  下一个 `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭据和恢复说明
  仅限维护者

## 每月仅 npm extended-stable 发布

这是下方常规发布流程的专用例外。对于一个
已结束月份 `YYYY.M`，创建 `extended-stable/YYYY.M.33`；从同一分支发布 `vYYYY.M.33` 和
之后的维护补丁。发布标签、分支尖端、
检出、包版本、npm 预检和 Full Release Validation 运行必须
全部指向同一个提交。受保护的 `main` 必须已经包含严格晚于该月份的
日历月份最终版本，且补丁号低于 `33`；在 `main` 前进超过一个月后，
维护补丁仍保持符合条件。

从确切的 extended-stable 分支运行 npm 预检和 Full Release Validation，
然后保存两个运行 ID：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` 是现有的验证深度配置文件；它与
npm `extended-stable` dist-tag 分离，并且有意保持不变。

两个运行都成功且 npm 发布环境就绪后，提升
确切的预检 tarball。补丁 `P` 必须为 `33` 或更大：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

对于有意无法满足
月度 `.33` 或受保护 `main` 月份策略的 fork 或非生产演练，请向 npm 预检和发布调度都添加
`-f bypass_extended_stable_guard=true`。默认值是 `false`。该绕过只在 `npm_dist_tag=extended-stable` 时被接受，并且
会记录在工作流摘要中。它不会绕过规范的
`extended-stable/YYYY.M.33` 工作流 ref、分支尖端/标签/检出相等性、最终标签
语法、包/标签版本相等性、引用的运行和清单身份、
tarball 来源、环境审批、注册表回读或选择器
修复证据。

发布工作流会验证引用的运行身份、准备好的
tarball 摘要以及两个 npm 注册表选择器。工作流成功后，请独立确认
结果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

两个命令都必须返回 `YYYY.M.P`。如果发布成功但选择器
回读失败，不要重新发布不可变的包版本。使用失败工作流的 always-run 摘要中打印的单个
`npm dist-tag add openclaw@YYYY.M.P extended-stable` 修复命令，
然后重复两个独立回读。回滚到先前选择器是单独的操作员决策，不是
回读修复路径。

下方常规检查清单继续负责 beta、`latest`、GitHub Release、
插件、macOS、Windows 以及其他平台发布。不要为这个仅 npm 的 extended-stable 路径
运行这些步骤。

## 常规发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭据、
签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` 的 CI 绿到足以从它切出分支。
2. 根据自上一个可达发布标签以来已合并的 PR 和所有直接
   提交生成顶部 `CHANGELOG.md` 章节。保持条目面向用户，
   对重叠的 PR/直接提交条目去重，提交重写结果，推送它，
   并在切分支前再次 rebase/pull。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍被覆盖时移除过期
   兼容性，否则记录为什么要有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.PATCH`；不要直接在 `main` 上做常规发布工作。
5. 为目标标签提升每个必需位置的版本，然后运行
   `pnpm release:prep`。它会按正确顺序刷新插件版本、插件清单、配置
   schema、内置渠道配置元数据、配置文档基线、插件 SDK
   导出和插件 SDK API 基线。打标签前提交所有生成的
   漂移。然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证
   预检。预检会为确切检出的依赖图生成依赖发布证据，
   并将其存储在 npm 预检制品中。保存成功的
   `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，使用 `Full Release Validation`
   启动所有预发布测试。这是四个大型发布测试箱的唯一手动入口：
   Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败
   文件、lane、工作流 job、包 profile、提供商或模型 allowlist。
   仅当变更表面使既有证据过期时，才重新运行完整总入口。
9. 对于已打标签的 beta 候选版本，从匹配的
   `release/YYYY.M.PATCH` 分支运行
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。对于稳定版，还要传入必需的 Windows 源
   发布：
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。
   该 helper 会运行本地生成发布检查，分发或验证完整发布验证和 npm
   预检证据，针对确切准备好的 tarball 运行 Parallels 全新/更新证明以及 Telegram 包
   证明，记录插件 npm 和 ClawHub 计划，并且只在证据包为绿色后打印确切的
   `OpenClaw Release Publish` 命令。
   `OpenClaw Release Publish` 会并行将选定的或所有可发布的插件
   包分发到 npm，并将同一组发布到 ClawHub；然后在插件 npm 发布成功后，
   立即使用匹配的 dist-tag 提升准备好的 OpenClaw npm 预检制品。
   OpenClaw npm 发布子任务成功后，它会根据完整匹配的
   `CHANGELOG.md` 章节创建或更新匹配的 GitHub release/prerelease 页面。
   发布到 npm `latest` 的稳定版会成为 GitHub latest release；保留在 npm `beta` 上的
   稳定维护版会以 GitHub `latest=false` 创建。该工作流还会把预检
   依赖证据、完整验证 manifest 和发布后 registry
   验证证据上传到 GitHub release，以便发布后事件响应。发布工作流会立即打印子 run ID，自动批准工作流 token
   被允许批准的发布环境 gate，用日志尾部汇总失败的子 job，在 OpenClaw npm 发布成功后立即收尾 GitHub release 和依赖
   证据，在发布 OpenClaw npm 时等待 ClawHub，然后运行 `pnpm release:verify-beta`，
   并为 GitHub release、npm 包、选定的插件 npm 包、选定的
   ClawHub 包、子工作流 run ID 和可选的 NPM Telegram run ID 上传发布后证据。ClawHub 路径会重试瞬时 CLI
   依赖安装失败，即使一个 preview 单元 flaky 也会发布 preview 通过的插件，
   并以对每个预期插件版本的 registry 验证结束，从而让部分发布保持可见且可重试。然后针对已发布的
   `openclaw@YYYY.M.PATCH-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的 prerelease 需要修复，
   切下一个匹配的 prerelease 编号；不要删除或重写旧的
   prerelease。
10. 对于稳定版，仅在经过审查的 beta 或 release candidate 拥有所需验证证据后继续。
    稳定版 npm 发布也通过
    `OpenClaw Release Publish`，并通过
    `preflight_run_id` 复用成功的预检制品；稳定版 macOS 发布就绪还需要
    `main` 上的已打包 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
    macOS 发布工作流会在发布资产验证后自动将已签名的 appcast 发布到公共 `main`；
    如果分支保护阻止直接推送，它会打开或更新一个 appcast PR。稳定版 Windows Hub
    就绪需要 OpenClaw GitHub release 上的已签名 `OpenClawCompanion-Setup-x64.exe`、
    `OpenClawCompanion-Setup-arm64.exe` 和
    `OpenClawCompanion-SHA256SUMS.txt` 资产。
    将确切已签名的 `openclaw/openclaw-windows-node` release 标签作为
    `windows_node_tag` 传入，并将其候选版本已批准的安装程序摘要映射作为
    `windows_node_installer_digests` 传入；`OpenClaw Release Publish` 会保留
    release 草稿，分发 `Windows Node Release`，并在发布前验证全部三个
    资产。
11. 发布后，运行 npm 发布后验证器；当需要发布后渠道证明时，运行可选的独立
    已发布 npm Telegram E2E；在需要时执行 dist-tag 提升；验证生成的 GitHub release 页面；
    运行发布公告步骤；然后完成[稳定版 main 收尾](#stable-main-closeout)，再将稳定版发布称为完成。

## 稳定版 main 收尾

稳定版发布在 `main` 携带实际已发布
发布状态之前并不完整。

1. 从全新最新的 `main` 开始。将 `release/YYYY.M.PATCH` 与它对照审计，并
   forward-port `main` 中缺失的真实修复。不要盲目把
   仅发布用的兼容性、测试或验证 adapter 合并到更新的 `main`。
2. 将 `main` 设置为已发布的稳定版本，而不是推测的下一趟发布列车。在根版本变更后运行
   `pnpm release:prep`，然后运行
   `pnpm deps:shrinkwrap:generate`。
3. 让 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 章节与已打标签的
   发布分支完全一致。如果 mac
   发布产生了稳定版 `appcast.xml` 更新，也要包含它。
4. 在 operator 明确启动那趟发布列车之前，不要向 `main` 添加
   `YYYY.M.PATCH+1`、beta 版本或空的未来 changelog
   章节。
5. 运行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和
   `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送，然后在将稳定版发布称为完成前，
   验证 `origin/main` 包含已发布版本和 changelog。
6. 每次私有 rollback drill 后，保持仓库变量 `RELEASE_ROLLBACK_DRILL_ID` 和
   `RELEASE_ROLLBACK_DRILL_DATE` 为最新。
   `OpenClaw Stable Main Closeout` 从稳定版发布后携带已发布版本、changelog 和 appcast 的
   `main` 推送开始。它读取不可变发布后证据，将已发布标签绑定到其 Full Release
   Validation 和 Publish run，然后验证稳定版 main 状态、release、
   强制稳定版 soak 和阻塞性性能证据。它会向 GitHub release 附加不可变
   closeout manifest 和 checksum。自动
   push 触发器会跳过早于不可变发布后
   证据的旧版 release；它绝不会把该跳过视为已完成 closeout。完整
   closeout 需要同时具备资产和匹配的 checksum。部分 manifest
   会重放其记录的 `main` SHA 和 rollback drill 以重新生成相同
   字节，然后附加缺失的 checksum；无效配对，或只有 checksum
   没有 manifest，都会继续阻塞。没有 rollback
   drill 仓库变量的 push-triggered run 会跳过且不完成 closeout；缺失或
   超过 90 天的 drill 记录仍会阻塞手动的证据支持
   closeout。私有恢复命令保留在仅限维护者的 runbook 中。
   仅使用手动分发来修复或重放有证据支持的稳定版 closeout。
   旧版 fallback 修正标签只有在修正标签解析到与基础稳定版标签相同的源提交时，
   才可以复用基础包证据。
   使用不同源的修正必须发布并验证自己的包
   证据。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，让测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，让更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，让预期的 `dist/*` 发布产物和 Control UI 包存在，以供打包验证步骤使用
- 在根版本号提升后、打标签前运行 `pnpm release:prep`。它会运行所有确定性的发布生成器，这些生成器通常会在版本/配置/API 变更后产生漂移：插件版本、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出以及插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些保护项，并在运行包发布检查前一次性报告它发现的所有生成漂移失败。
- 插件版本同步默认会把官方插件包版本和现有 `openclaw.compat.pluginApi` 下限更新为 OpenClaw 发布版本。将该字段视为插件 SDK/运行时 API 下限，而不只是包版本的副本：对于有意继续兼容较旧 OpenClaw 主机的仅插件发布，请将下限保持为最旧受支持的主机 API，并在插件发布证明中记录这一选择。
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并为安装冒烟、包验收、跨 OS 包检查、QA Lab 对等性、Matrix 和 Telegram 通道分发 `OpenClaw Release Checks`。稳定版和完整运行始终包含详尽的实时/E2E 和 Docker 发布路径浸泡测试；`run_release_soak=true` 保留用于显式 beta 浸泡测试。Package Acceptance 在候选验证期间提供规范的包 Telegram E2E，避免第二个并发实时轮询器。
  发布 beta 后提供 `release_package_spec`，即可在发布检查、Package Acceptance 和包 Telegram E2E 中复用已发布的 npm 包，而无需重新构建发布 tarball。仅当 Telegram 应使用与其余发布验证不同的已发布包时，才提供 `npm_telegram_package_spec`。当 Package Acceptance 应使用与发布包 spec 不同的已发布包时，提供 `package_acceptance_package_spec`。当发布证据报告应证明验证匹配已发布的 npm 包、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- 当你希望在发布工作继续进行时为包候选提供旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` 测试框架打包受信任的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 和严格公共 URL 策略的公共 HTTPS tarball 使用 `source=url`；对使用必需 `trusted_source_id` 和 SHA-256 的命名受信源策略使用 `source=trusted-url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当所选 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选，而 `published_upgrade_survivor_baseline` 会选择已发布的基线。`update-restart-auth` 使用候选包同时作为已安装 CLI 和 package-under-test，因此会演练候选更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：无 OpenWebUI 或实时 ClawHub 的产物原生包/更新/重启/插件通道
  - `product`：包配置，加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选的确定性常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物冒烟检查、文档检查、Python Skills、Windows、macOS 和 Control UI i18n 通道。独立手动 CI 只有在使用 `include_android=true` 分发时才运行 Android；`Full Release Validation` 会为其 CI 子项传递该输入。
  带 Android 的示例：`gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器演练 QA-lab，并验证 trace、metric 和日志导出，以及有界 trace 属性和内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部采集器。
- 验证采集器兼容性时运行 `pnpm qa:otel:collector-smoke`。它先通过真实 OpenTelemetry Collector Docker 容器路由相同的 QA-lab OTLP 导出，再执行本地接收器断言。
- 验证受保护的 Prometheus 抓取时运行 `pnpm qa:prometheus:smoke`。它会演练 QA-lab，拒绝未认证的抓取，并验证发布关键 metric family 不包含提示内容、原始标识符、认证 token 和本地路径。
- 当你希望连续运行源代码检出的 OpenTelemetry 和 Prometheus 冒烟通道时，运行 `pnpm qa:observability:smoke`。
- 在每个带标签发布前运行 `pnpm release:check`
- `OpenClaw NPM Release` 预检会在打包 npm tarball 前生成依赖发布证据。npm advisory 漏洞门禁会阻塞发布。传递性清单风险、依赖所有权/安装面以及依赖变更报告仅作为发布证据。依赖变更报告会将发布候选与上一个可达发布标签进行比较。
- 预检会将依赖证据上传为 `openclaw-release-dependency-evidence-<tag>`，并同时嵌入到准备好的 npm 预检产物内的 `dependency-evidence/` 下。真实发布路径会复用该预检产物，然后将相同证据作为 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub 发布。
- 标签存在后，运行 `OpenClaw Release Publish` 执行会产生变更的发布序列。从 `release/YYYY.M.PATCH` 分发它（或在发布 main 可达标签时从 `main` 分发），传入发布标签、成功的 OpenClaw npm `preflight_run_id` 和成功的 `full_release_validation_run_id`，并保持默认插件发布范围 `all-publishable`，除非你有意运行聚焦修复。该工作流会串行执行插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会在其外部化插件之前发布。
- 稳定版 `OpenClaw Release Publish` 要求在匹配的非预发布 `openclaw/openclaw-windows-node` 发布存在后提供精确的 `windows_node_tag`。它还要求候选已批准的 `windows_node_installer_digests` 映射。在分发任何发布子项前，它会验证源发布已发布、非预发布、包含必需的 x64/ARM64 安装器，并且仍匹配该已批准映射。然后它会在 OpenClaw 发布仍为草稿时分发 `Windows Node Release`，并原样携带固定的安装器摘要映射。子工作流会从该精确标签下载已签名的 Windows Hub 安装器，将其与固定摘要匹配，在 Windows runner 上验证其 Authenticode 签名使用预期的 OpenClaw Foundation 签名者，写入 SHA-256 清单，并将安装器加清单上传到规范 OpenClaw GitHub 发布，然后重新下载已提升的资产并验证清单成员和哈希。父工作流会在发布前验证当前 x64、ARM64 和校验和资产契约。直接恢复会在替换预期契约资产为固定源字节前拒绝意外的 `OpenClawCompanion-*` 资产名。仅在恢复时手动分发 `Windows Node Release`，并且始终传入精确标签，绝不要传 `latest`，同时传入来自已批准源发布的显式 `expected_installer_digests` JSON 映射。网站下载链接应指向当前稳定版发布的精确 OpenClaw 发布资产 URL，或仅在验证 GitHub 的 latest 重定向指向同一发布后使用 `releases/latest/download/...`；不要只链接到 companion 仓库发布页。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock 对等通道，以及快速实时 Matrix 配置和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你希望并行获得完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径短、确定性且聚焦产物，同时让较慢的实时检查留在自己的通道中，避免拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 或从 `main`/发布工作流 ref 分发，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，而不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只为包元数据检查合成 `v<package.json version>`；真实发布仍要求真实发布标签
- 两个工作流都会让真实发布和提升路径保持在 GitHub 托管 runner 上，而非变更性验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查通道
- 在本地给发布候选打标签前，运行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。该辅助工具会按能在 GitHub 发布工作流启动前捕获常见审批阻塞错误的顺序，运行快速发布护栏、插件 npm/ClawHub 发布检查、构建、UI 构建和 `release:openclaw:npm:check`。
- 在批准前运行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  （或匹配的 beta/修正版版本）以在新的临时前缀中验证已发布注册表的
  安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以使用共享租用的 Telegram 凭证池，针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。
  本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个
  `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 要从维护者机器运行完整的发布后 beta 冒烟测试，请使用 `pnpm release:beta-smoke -- --beta betaN`。该辅助工具会运行 Parallels npm 更新/全新目标验证，分派 `NPM Telegram Beta E2E`，轮询精确的工作流运行，下载产物，并打印 Telegram 报告。
- 维护者可以通过 GitHub Actions 中的手动
  `NPM Telegram Beta E2E` 工作流运行相同的发布后检查。它刻意只支持手动触发，
  不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再提升：
  - 真实 npm 发布必须通过一次成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.PATCH` 分支分派
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因为
    `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而源仓库保持仅使用
    OIDC 发布
  - 公开的 `macOS Release` 仅用于验证；当标签只存在于
    release 分支但工作流从 `main` 分派时，设置
    `public_release_branch=release/YYYY.M.PATCH`
  - 真实 macOS 发布必须通过成功的 macOS `preflight_run_id` 和
    `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.PATCH-N` 这样的稳定版修正发布，发布后验证器
  还会检查从 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同临时前缀升级路径，
  这样发布修正就不能悄悄地让较旧的全局安装停留在基础稳定版载荷上
- npm 发布预检会失败关闭，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，
  这样我们就不会再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布插件入口点和
  包元数据是否存在于已安装的注册表布局中。缺少插件运行时载荷的发布会使 postpublish 验证器失败，
  并且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，
  因此安装器 e2e 会在发布路径执行前捕获意外的 pack 膨胀
- 如果发布工作触及了 CI 规划、插件计时清单或
  插件测试矩阵，请在批准前重新生成并审查由规划器拥有的
  `.github/workflows/plugin-prerelease.yml` 中的
  `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明
  不会描述过期的 CI 布局
- 稳定版 macOS 发布就绪状态还包括更新器表面：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip；
    macOS 发布工作流会自动提交它，或者在直接推送被阻止时打开一个 appcast
    PR
  - 打包应用必须保持非调试 bundle id、非空 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作员从一个入口启动所有预发布测试的方式。对于快速变动分支上的固定提交证明，请使用该辅助工具，让每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该辅助工具会推送 `release-ci/<sha>-...`，从该分支分派 `Full Release Validation` 并设置 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这样可以避免意外证明较新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流引用运行，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

该工作流会解析目标引用，使用 `target_ref=<release-ref>` 分派手动 `CI`，然后分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 会扇出安装冒烟测试、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带规范 Telegram 包 E2E 的 Package Acceptance、QA Lab 对等性、实时 Matrix 和实时 Telegram。完整/all 运行只有在 `Full Release Validation` 摘要显示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 成功时才可接受，除非聚焦重跑有意跳过了单独的 `Plugin Prerelease` 子项。仅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 进行已发布包的聚焦重跑时，才使用独立的 `npm-telegram` 子项。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。参见 [完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确工作流作业名称、stable 与 full 配置差异、工件以及聚焦重跑句柄。子工作流会从运行 `Full Release Validation` 的受信任引用分派，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation 工作流引用输入；通过选择工作流运行引用来选择受信任的测试框架。不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 做精确提交证明；原始提交 SHA 不能作为工作流分派引用，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/提供商覆盖广度：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的建议性提供商/媒体覆盖

Stable 和 full 验证在推广前始终运行详尽的 live/E2E、Docker 发布路径以及有界的已发布升级幸存者扫描。使用 `run_release_soak=true` 为 beta 请求相同扫描。该扫描覆盖最新四个 stable 包，加上固定的 `2026.4.23` 和 `2026.5.2` 基线，以及更旧的 `2026.4.15` 覆盖；重复基线会被移除，并且每个基线都会分片到自己的 Docker runner 作业中。

`OpenClaw Release Checks` 使用受信任的工作流引用将目标引用解析一次为 `release-package-under-test`，并在 soak 运行时在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该工件。这样所有面向包的盒子都使用相同字节，并避免重复构建包。beta 已发布到 npm 后，设置 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，让发布检查下载已发布包一次，从 `dist/build-info.json` 提取其构建源 SHA，并为跨 OS、Package Acceptance、发布路径 Docker 和包 Telegram 通道复用该工件。当设置了 repo/org 变量时，跨 OS OpenAI 安装冒烟测试使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为此通道证明的是包安装、新手引导、Gateway 网关启动和一次实时 Agent 轮次，而不是基准测试最慢的默认模型。更广泛的实时提供商矩阵仍然是模型特定覆盖的位置。

根据发布阶段使用这些变体：

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要把完整伞形流程用作聚焦修复后的第一次重跑。如果一个盒子失败，请使用失败的子工作流、作业、Docker 通道、包配置、模型提供商或 QA 通道作为下一次证明。只有当修复更改了共享发布编排，或使先前所有盒子的证据过期时，才再次运行完整伞形流程。伞形流程的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，请向伞形流程传入 `rerun_group`。`all` 是真实的发布候选运行，`ci` 仅运行普通 CI 子项，`plugin-prerelease` 仅运行仅发布插件子项，`release-checks` 运行每个发布盒子，更窄的发布分组是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦的 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整/all 运行使用 Package Acceptance 内的规范包 Telegram E2E。聚焦的跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/套件过滤器。QA 发布检查失败会阻塞正常发布验证，包括标准层中所需的 OpenClaw 动态工具漂移。Tideclaw alpha 运行仍可将非包安全发布检查通道视为建议性通道。当 `live_suite_filter` 显式请求受门控的 QA live 通道（如 Discord、WhatsApp 或 Slack）时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 变量；否则输入捕获会失败，而不是静默跳过该通道。

### Vitest

Vitest 盒子是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并强制运行发布候选的普通测试图：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建工件冒烟检查、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。当 `Full Release Validation` 运行该盒子时会包含 Android，因为伞形流程会传入 `include_android=true`；独立手动 CI 需要 `include_android=true` 才能覆盖 Android。

使用此盒子回答“源代码树是否通过了完整普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- 显示已分派 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上为绿色的 `CI` 运行
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当运行需要性能分析时，保留 `.artifacts/vitest-shard-timings.json` 等 Vitest 计时工件

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或包盒子时，才直接运行手动 CI。非 Android 直接 CI 使用第一条命令。当直接发布候选 CI 必须覆盖 Android 时，添加 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 盒子通过 `openclaw-live-and-e2e-checks-reusable.yml` 存在于 `OpenClaw Release Checks` 中，外加发布模式的 `install-smoke` 工作流。它通过打包的 Docker 环境验证发布候选，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用较慢 Bun 全局安装冒烟测试的完整安装冒烟测试
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，其中 QR、root/gateway 和 installer/Bun 冒烟作业作为单独的 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，在 `plugins-runtime-services` 分块内覆盖 OpenWebUI
- 拆分的内置插件安装/卸载通道，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，覆盖 live/E2E 提供商套件和 Docker 实时模型

重跑前先使用 Docker 工件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 盒子也是 `OpenClaw Release Checks` 的一部分。它是 Agent 行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- 使用 Agent 对等性包，将 OpenAI 候选通道与 Opus 4.6 基线比较的 mock 对等性通道
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要明确本地证明时，运行 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此盒子回答“发布在 QA 场景和实时渠道流中行为是否正确？”批准发布时，请保留对等性、Matrix 和 Telegram 通道的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认发布关键通道。

### 包

Package 盒子是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为 Docker E2E 消费的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流测试框架引用与包源引用分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或确切的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载公共 HTTPS `.tgz`，并要求提供 `package_sha256`；URL 凭证、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析地址，以及不安全重定向都会被拒绝
- `source=trusted-url`：从 `.github/package-trusted-sources.json` 中具名策略下载 HTTPS `.tgz`，并要求提供 `package_sha256` 和 `trusted_source_id`；对于维护者拥有的企业镜像或私有包仓库，使用此项，而不是向 `source=url` 添加输入级私有网络绕过
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、准备好的发布包 artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一个已解析的 tarball 保持迁移、更新、已配置凭证的更新后重启、live ClawHub 技能安装、过期插件依赖清理、离线插件 fixture、插件更新，以及 Telegram 包 QA。阻塞性发布检查使用默认的最新已发布包基线；带有 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta profile 会扩展到从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，外加已报告问题的 fixture。对于已经发布的候选版本，使用带 `source=npm` 的 Package Acceptance；对于发布前由 SHA 支撑的本地 npm tarball，使用 `source=ref`；对于维护者拥有的企业/私有镜像，使用 `source=trusted-url`；对于另一个 GitHub Actions 运行上传的已准备 tarball，使用 `source=artifact`。它是 GitHub 原生的替代方案，用于覆盖过去大多数需要 Parallels 才能完成的包/更新覆盖范围。跨 OS 发布检查对于特定 OS 的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或发布检查 lane 能证明插件安装/更新、Doctor 清理，或已发布包迁移变更时，请使用它。从每个稳定版 `2026.4.23+` 包进行的穷尽式已发布更新迁移是单独的手动 `Update Migration` workflow，不属于 Full Release CI。

旧版 package-acceptance 宽容策略被有意设定了时间边界。到 `2026.4.25` 为止的包，可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少 `gateway install --wrapper`、从 tarball 派生的 git fixture 中缺少 patch 文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代包契约；同样的缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，请使用更广的 Package Acceptance profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包 profile：

- `smoke`：快速包安装/频道/智能体、Gateway 网关网络和配置重载 lane
- `package`：安装/更新/重启/插件包契约，加上 live ClawHub 技能安装证明；这是发布检查默认值
- `product`：`package` 加上 MCP 频道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的确切 `docker_lanes` 列表

对于包候选版本的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该 workflow 会把已解析的 `package-under-test` tarball 传入 Telegram lane；独立 Telegram workflow 仍接受用于发布后检查的已发布 npm spec。

## 常规发布发布自动化

对于 beta、`latest`、插件、GitHub Release 和平台发布，`OpenClaw Release Publish` 是常规的变更型入口点。每月 `.33+` 的仅 npm extended-stable 路径不使用此编排器。常规 workflow 会按发布所需顺序编排 trusted-publisher workflow：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 访问。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 分派 `Plugin ClawHub Release`。
6. 在验证已保存的 `full_release_validation_run_id` 后，使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。
7. 对于稳定发布，创建或更新 GitHub release 为草稿，使用显式 `windows_node_tag` 和候选已批准的 `windows_node_installer_digests` 分派 `Windows Node Release`，并在发布草稿前验证规范安装器/校验和 asset。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

稳定版发布到默认 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

直接提升稳定版到 `latest` 需要显式指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用较底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflow。当 `publish_openclaw_npm=true` 时，`OpenClaw Release Publish` 会拒绝 `plugin_publish_scope=selected`，因此核心包不能在没有每个可发布官方插件的情况下发布，包括 `@openclaw/diffs-language-pack`。对于选定插件修复，请设置 `publish_openclaw_npm=false`，并使用 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或直接分派子 workflow。

## NPM workflow 输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整 40 字符 workflow 分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径上必填，使 workflow 复用成功预检运行准备好的 tarball
- `full_release_validation_run_id`：真实的每月 extended-stable 和常规非 beta 发布所必需，使 workflow 验证确切的验证运行
- `npm_dist_tag`：发布路径的 npm 目标标签；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，默认值为 `beta`。最终 patch `33` 及之后必须使用 `extended-stable`；默认情况下，`extended-stable` 会拒绝更早的 patch，并且始终拒绝非最终标签。
- `bypass_extended_stable_guard`：仅测试用布尔值，默认 `false`；当 `npm_dist_tag=extended-stable` 时，绕过每月 extended-stable 资格检查，同时保留发布身份、artifact、审批和回读检查。

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必填发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必填
- `full_release_validation_run_id`：成功的 `Full Release Validation` 运行 ID；当 `publish_openclaw_npm=true` 时必填
- `windows_node_tag`：确切的非预发布 `openclaw/openclaw-windows-node` 发布标签；稳定版 OpenClaw 发布时必填
- `windows_node_installer_digests`：候选已批准的紧凑 JSON 映射，将当前 Windows 安装器名称映射到其固定的 `sha256:` 摘要；稳定版 OpenClaw 发布时必填
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认值为 `all-publishable`；仅在配合 `publish_openclaw_npm=false` 进行聚焦的仅插件修复工作时使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，以逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认值为 `true`；仅当将该 workflow 用作仅插件修复编排器时设置为 `false`
- `wait_for_clawhub`：默认值为 `false`，这样 npm 可用性不会被 ClawHub sidecar 阻塞；仅当 workflow 完成必须包括 ClawHub 完成时设置为 `true`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。携带 secret 的检查要求已解析提交可从 OpenClaw 分支或发布标签访问。
- `run_release_soak`：为 beta 发布检查选择加入穷尽式 live/E2E、Docker 发布路径，以及 all-since upgrade-survivor soak。它会被 `release_profile=stable` 和 `release_profile=full` 强制开启。

规则：

- patch `33` 以下的常规最终版和修正版可以发布到 `beta` 或 `latest`。patch `33` 或以上的最终版本必须发布到 `extended-stable`，该边界处带修正后缀的版本会被拒绝。
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；workflow 会在发布继续前验证该元数据

## 常规 beta/latest 稳定发布序列

此旧版序列用于也负责插件、GitHub Release、Windows 和其他平台工作的常规编排式发布。它不是本页顶部记录的每月 `.33+` 仅 npm extended-stable 路径。

切出常规编排式稳定发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整工作流分支提交
     SHA，对预检工作流执行仅验证的试运行
2. 对正常的先 beta 流程选择 `npm_dist_tag=beta`，只有在你有意直接发布稳定版时才选择 `latest`
3. 当你想通过一个手动工作流获得正常 CI 加上实时提示缓存、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整
   提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的正常测试图，请改为在发布引用上运行
   手动 `CI` 工作流
5. 选择准确的非预发布 `openclaw/openclaw-windows-node` 发布标签，
   其签名的 x64 和 ARM64 安装程序应被发布。将其保存为
   `windows_node_tag`，并将它们经过验证的摘要映射保存为
   `windows_node_installer_digests`。候选发布辅助工具会记录两者，
   并将它们包含在生成的发布命令中。
6. 保存成功的 `preflight_run_id` 和 `full_release_validation_run_id`
7. 使用相同的 `tag`、相同的 `npm_dist_tag`、选定的 `windows_node_tag`、
   已保存的 `windows_node_installer_digests`、已保存的 `preflight_run_id`
   和已保存的 `full_release_validation_run_id` 运行 `OpenClaw Release Publish`；
   它会在提升 OpenClaw npm 包之前，将外部化插件发布到 npm 和 ClawHub
8. 如果发布落在 `beta` 上，请使用
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版本从 `beta` 提升到 `latest`
9. 如果发布有意直接发布到 `latest`，并且 `beta`
   应立即跟随同一个稳定构建，请使用同一个发布
   工作流将两个 dist-tags 都指向该稳定版本，或让它的定时
   自愈同步稍后移动 `beta`

dist-tag 变更位于发布账本仓库中，因为它仍然需要
`NPM_TOKEN`，而源仓库保留仅 OIDC 发布。

这会让直接发布路径和先 beta 后提升路径都保持
已文档化且对操作员可见。

如果维护者必须回退到本地 npm 认证，请仅在专用 tmux 会话中运行任何 1Password
CLI (`op`) 命令。不要直接从主 agent shell 调用 `op`；将其保留在 tmux 中可以让提示、
警报和 OTP 处理可观察，并防止重复的主机警报。

## 公开参考

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档作为实际运行手册。

## 相关

- [发布渠道](/zh-CN/install/development-channels)
