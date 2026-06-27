---
read_when:
    - 查找公开发布渠道定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证框、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-06-27T03:12:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定版发布版本：`YYYY.M.PATCH`
  - Git 标签：`vYYYY.M.PATCH`
- 稳定版修正发布版本：`YYYY.M.PATCH-N`
  - Git 标签：`vYYYY.M.PATCH-N`
- Beta 预发布版本：`YYYY.M.PATCH-beta.N`
  - Git 标签：`vYYYY.M.PATCH-beta.N`
- 月份或补丁号不要补零
- 从 2026 年 6 月的发布流程更新开始，第三个组成部分是
  顺序递增的每月发布列车编号，而不是日历日期。稳定版和 beta
  发布决定当前列车；仅 alpha 的标签不会消耗或推进 beta/稳定版补丁号。
  更新前的标签和 npm 版本保留其现有名称并继续有效；发布自动化会继续按
  年、月、补丁、通道以及预发布或修正编号来比较它们。
- Alpha/nightly 构建使用下一个未发布的补丁列车，并且重复构建时只递增
  `alpha.N`。一旦该补丁已有 beta，新 alpha 构建就会移动到下一个补丁。
  选择 beta 或稳定版列车时，忽略补丁号更高的旧版仅 alpha 标签。
- npm 版本是不可变的。如果某个 beta 标签已经发布，不要删除、重新发布或复用它；
  请切下一个 beta 编号或下一个月度补丁。由于 `2026.6.5-beta.1` 已在
  过渡期间发布，2026 年 6 月的发布列车必须使用补丁号 `5` 或更高。
  不要将新的 2026 年 6 月稳定版或 beta 列车发布为 `2026.6.2`、`2026.6.3`
  或 `2026.6.4`。
- 在稳定版 `2026.6.5` 之后，下一个新的 beta 列车是 `2026.6.6-beta.1`，
  即使已经存在补丁号更高的自动化仅 alpha 标签。
- `latest` 表示当前已提升的稳定版 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或稍后提升已验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会一起交付 npm 包、macOS 应用和已签名的
  Windows Hub 安装程序；beta 发布通常先验证并发布 npm/包路径，
  原生应用构建、签名、公证和提升默认保留给稳定版，除非明确请求

## 发布节奏

- 发布按 beta 优先推进
- 稳定版只会在最新 beta 完成验证后跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.PATCH` 分支切发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已推送或发布且需要修复，维护者会切下一个 `-beta.N` 标签，
  而不是删除或重新创建旧 beta 标签
- 详细发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够绿色，可以从它创建分支。
2. 根据上一个可达发布标签以来已合并的 PR 和所有直接提交生成顶部
   `CHANGELOG.md` 小节。保持条目面向用户，去重重叠的 PR/直接提交条目，
   提交重写结果，推送它，并在创建分支前再次 rebase/pull。
3. 查看
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。
   仅当升级路径仍被覆盖时才移除过期兼容性，或者记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.PATCH`；不要直接在 `main` 上做常规发布工作。
5. 为预期标签更新每个必需的版本位置，然后运行
   `pnpm release:prep`。它会按正确顺序刷新插件版本、插件清单、配置
   schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出以及插件 SDK API 基线。
   打标签前提交任何生成的漂移。然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 运行带 `preflight_only=true` 的 `OpenClaw NPM Release`。在标签存在之前，
   可使用完整 40 字符的发布分支 SHA 进行仅验证预检。预检会为
   精确检出的依赖图生成依赖发布证据，并将其存储在 npm 预检工件中。
   保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，用 `Full Release Validation` 启动所有预发布测试。
   这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败文件、通道、
   工作流作业、包配置、提供商或模型允许列表。只有当变更面让既有证据失效时，
   才重新运行完整总括验证。
9. 对于带标签的 beta 候选版本，从匹配的
   `release/YYYY.M.PATCH` 分支运行
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。对于稳定版，
   还要传入所需的 Windows 源发布：
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。
   该辅助程序会运行本地生成发布检查，调度或验证完整发布验证和 npm 预检证据，
   针对精确准备好的 tarball 运行 Parallels 全新/更新证明以及 Telegram 包证明，
   记录插件 npm 和 ClawHub 计划，并且只有在证据包为绿色后才打印精确的
   `OpenClaw Release Publish` 命令。
   `OpenClaw Release Publish` 会并行将选定或所有可发布的插件包分发到 npm，
   并将同一组包分发到 ClawHub，然后在插件 npm 发布成功后立即使用匹配的 dist-tag
   提升已准备好的 OpenClaw npm 预检工件。
   OpenClaw npm 发布子任务成功后，它会根据完整匹配的
   `CHANGELOG.md` 小节创建或更新对应的 GitHub 发布/预发布页面。
   发布到 npm `latest` 的稳定版会成为 GitHub 最新发布；保留在 npm `beta`
   上的稳定维护发布会以 GitHub `latest=false` 创建。该工作流还会把预检依赖证据、
   完整验证清单以及发布后 registry 验证证据上传到 GitHub 发布，用于发布后事件响应。
   发布工作流会立即打印子运行 ID，自动批准工作流令牌允许批准的发布环境门禁，
   用日志尾部汇总失败的子作业，在 OpenClaw npm 发布成功后立即收尾 GitHub 发布和依赖证据，
   当 OpenClaw npm 正在发布时等待 ClawHub，然后运行 `pnpm release:verify-beta`，
   并为 GitHub 发布、npm 包、选定的插件 npm 包、选定的 ClawHub 包、子工作流运行 ID
   以及可选的 NPM Telegram 运行 ID 上传发布后证据。ClawHub 路径会重试瞬态 CLI
   依赖安装失败，即使某个预览单元格偶发失败，也会发布通过预览的插件，并以每个预期插件版本的
   registry 验证结束，使部分发布保持可见且可重试。然后针对已发布的
   `openclaw@YYYY.M.PATCH-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切下一个匹配的预发布编号；不要删除或重写旧预发布。
10. 对于稳定版，只有在已验证的 beta 或发布候选具备所需验证证据后才继续。
    稳定版 npm 发布同样通过 `OpenClaw Release Publish`，通过
    `preflight_run_id` 复用成功的预检工件；稳定版 macOS 发布就绪还要求
    打包好的 `.zip`、`.dmg`、`.dSYM.zip` 以及更新后的 `appcast.xml` 位于 `main` 上。
    macOS 发布工作流会在发布资产验证后自动将已签名 appcast 发布到公共 `main`；
    如果分支保护阻止直接推送，它会打开或更新一个 appcast PR。稳定版 Windows Hub
    就绪要求 OpenClaw GitHub 发布上存在已签名的 `OpenClawCompanion-Setup-x64.exe`、
    `OpenClawCompanion-Setup-arm64.exe` 和
    `OpenClawCompanion-SHA256SUMS.txt` 资产。
    将精确的已签名 `openclaw/openclaw-windows-node` 发布标签作为
    `windows_node_tag` 传入，并将其候选批准的安装程序摘要映射作为
    `windows_node_installer_digests` 传入；`OpenClaw Release Publish` 会保留
    发布草稿，调度 `Windows Node Release`，并在发布前验证全部三个资产。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，运行可选的独立
    已发布 npm Telegram E2E；在需要时执行 dist-tag 提升；验证生成的 GitHub 发布页面；
    运行发布公告步骤；然后完成 [稳定版 main 收尾](#stable-main-closeout)，再将稳定版发布视为完成。

## 稳定版 main 收尾

稳定版发布只有在 `main` 携带实际已交付的发布状态后才算完成。

1. 从最新的全新 `main` 开始。对照它审计 `release/YYYY.M.PATCH`，并
   forward-port `main` 中缺失的真实修复。不要盲目把
   仅发布分支使用的兼容性、测试或验证适配器合并到更新的 `main`。
2. 将 `main` 设置为已发布的稳定版本，而不是推测性的下一列车版本。在根版本变更后运行
   `pnpm release:prep`，然后运行
   `pnpm deps:shrinkwrap:generate`。
3. 让 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 小节与
   打标签的发布分支完全一致。如果 mac
   发布产出了稳定版 `appcast.xml` 更新，也要包含它。
4. 在操作员明确启动对应发布列车之前，不要向 `main` 添加 `YYYY.M.PATCH+1`、beta 版本，或空的未来 changelog
   小节。
5. 运行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和
   `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送，然后在认定稳定版发布
   完成之前，验证 `origin/main`
   包含已发布版本和 changelog。
6. 每次私有回滚演练后，保持仓库变量 `RELEASE_ROLLBACK_DRILL_ID` 和
   `RELEASE_ROLLBACK_DRILL_DATE` 为最新。
   `OpenClaw Stable Main Closeout` 从稳定版发布后携带
   已发布版本、changelog 和 appcast 的 `main` 推送开始。它读取
   不可变的发布后证据，将已发布标签绑定到其 Full Release
   Validation 和 Publish 运行，然后验证稳定版 main 状态、发布、
   强制稳定版浸泡，以及阻塞性的性能证据。它会将一个
   不可变的收尾清单和校验和附加到 GitHub release。自动
   推送触发器会跳过早于不可变发布后
   证据的旧版发布；它绝不会把该跳过视为已完成收尾。完整的
   收尾需要同时具备资产和匹配的校验和。部分清单会
   重放其记录的 `main` SHA 和回滚演练，以重新生成相同的
   字节，然后附加缺失的校验和；无效配对，或只有校验和
   而没有清单，仍然会阻塞。没有回滚
   演练仓库变量的推送触发运行会跳过且不完成收尾；缺失或
   超过 90 天的演练记录仍会阻塞有证据支持的手动
   收尾。私有恢复命令仍保留在仅维护者可见的运行手册中。
   仅使用手动调度来修复或重放有证据支持的稳定版收尾。
   旧版 fallback 修正标签只有在修正标签解析到与基础稳定标签
   相同的源提交时，才可以复用基础包证据。
   源不同的修正必须发布并验证它自己的包
   证据。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 会在更快的本地 `pnpm check` 门控之外继续被覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会在更快的本地门控之外保持通过
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，这样预期的 `dist/*` 发布产物和 Control UI bundle 会存在，供打包验证步骤使用
- 在根版本号提升之后、打标签之前运行 `pnpm release:prep`。它会运行每个确定性的发布生成器，这些生成器通常会在版本/配置/API 变更后发生漂移：插件版本、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出，以及插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些守卫，并在运行包发布检查前，用一次遍历报告它发现的所有生成漂移失败。
- 插件版本同步默认会把官方插件包版本和现有 `openclaw.compat.pluginApi` 下限更新为 OpenClaw 发布版本。把该字段视为插件 SDK/运行时 API 下限，而不只是包版本的副本：对于有意保持兼容旧版 OpenClaw 主机的插件专属发布，请将下限保留为最早支持的主机 API，并在插件发布证明中记录该选择。
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试盒。它接受分支、标签或完整 commit SHA，调度手动 `CI`，并调度 `OpenClaw Release Checks`，用于安装冒烟、包验收、跨 OS 包检查、QA Lab 一致性、Matrix 和 Telegram 测试道。稳定版和完整运行始终包含详尽的 live/E2E 与 Docker 发布路径 soak；`run_release_soak=true` 保留用于显式的 beta soak。Package Acceptance 在候选验证期间提供规范的包 Telegram E2E，避免第二个并发 live 轮询器。
  发布 beta 后提供 `release_package_spec`，以便在发布检查、Package Acceptance 和包 Telegram E2E 中复用已发布的 npm 包，而不重新构建发布 tarball。仅当 Telegram 应使用不同于其余发布验证的已发布包时，才提供 `npm_telegram_package_spec`。当 Package Acceptance 应使用不同于发布包 spec 的已发布包时，提供 `package_acceptance_package_spec`。当发布证据报告应证明验证匹配某个已发布 npm 包、但不强制执行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- 当你希望在发布工作继续进行时，为包候选项获取旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；对受信任的 `package_ref` 分支/标签/SHA 与当前 `workflow_ref` harness 打包使用 `source=ref`；对带有必需 SHA-256 和严格公共 URL 策略的公共 HTTPS tarball 使用 `source=url`；对使用必需 `trusted_source_id` 和 SHA-256 的命名 trusted-source 策略使用 `source=trusted-url`；或者对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会把候选项解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当所选 Docker 测试道包含 `published-upgrade-survivor` 时，包产物就是候选项，而 `published_upgrade_survivor_baseline` 选择已发布的基线。`update-restart-auth` 使用候选包作为已安装 CLI 和 package-under-test，因此它会演练候选项更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载测试道
  - `package`：不含 OpenWebUI 或 live ClawHub 的产物原生包/更新/重启/插件测试道
  - `product`：package profile 加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选项的确定性常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 调度会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、插件和渠道 contract 分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物冒烟检查、文档检查、Python Skills、Windows、macOS 和 Control UI i18n 测试道。独立手动 CI 只有在用 `include_android=true` 调度时才运行 Android；`Full Release Validation` 会为它的 CI 子项传入该输入。
  带 Android 的示例：`gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP receiver 演练 QA-lab，并验证 trace、metric 和日志导出，以及有界 trace 属性和内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部 collector。
- 验证 collector 兼容性时运行 `pnpm qa:otel:collector-smoke`。它会先通过真实 OpenTelemetry Collector Docker 容器路由同一个 QA-lab OTLP 导出，再执行本地 receiver 断言。
- 验证受保护的 Prometheus 抓取时运行 `pnpm qa:prometheus:smoke`。它会演练 QA-lab，拒绝未经身份验证的抓取，并验证发布关键 metric family 不包含 prompt 内容、原始标识符、auth token 和本地路径。
- 当你希望连续运行源码 checkout 的 OpenTelemetry 和 Prometheus 冒烟测试道时，运行 `pnpm qa:observability:smoke`。
- 每次带标签发布前运行 `pnpm release:check`
- `OpenClaw NPM Release` 预检会在打包 npm tarball 前生成依赖发布证据。npm advisory 漏洞门控会阻断发布。传递 manifest 风险、依赖所有权/安装面和依赖变更报告仅作为发布证据。依赖变更报告会把发布候选项与上一个可达发布标签进行比较。
- 预检会把依赖证据上传为 `openclaw-release-dependency-evidence-<tag>`，并且也会把它嵌入已准备好的 npm 预检产物中的 `dependency-evidence/` 下。真实发布路径会复用该预检产物，然后把同一份证据作为 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub release。
- 在标签存在后，运行 `OpenClaw Release Publish` 来执行会产生变更的发布序列。从 `release/YYYY.M.PATCH` 调度它（或在发布 main 可达标签时从 `main` 调度），传入发布标签、成功的 OpenClaw npm `preflight_run_id` 和成功的 `full_release_validation_run_id`，并保留默认插件发布范围 `all-publishable`，除非你是有意运行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，因此核心包不会在其外部化插件之前发布。
- 稳定版 `OpenClaw Release Publish` 要求在匹配的非预发布版 `openclaw/openclaw-windows-node` release 存在后，提供精确的 `windows_node_tag`。它还要求候选项已批准的 `windows_node_installer_digests` map。在调度任何发布子项前，它会验证源 release 已发布、非预发布、包含必需的 x64/ARM64 installer，并且仍匹配该已批准 map。随后它会在 OpenClaw release 仍为草稿时调度 `Windows Node Release`，原样携带固定的 installer digest map。子工作流会从该精确标签下载已签名的 Windows Hub installer，将它们与固定 digest 匹配，在 Windows runner 上验证其 Authenticode 签名使用预期的 OpenClaw Foundation 签名者，写入 SHA-256 manifest，并把 installer 加 manifest 上传到规范的 OpenClaw GitHub release，然后重新下载已提升的资产并验证 manifest 成员和哈希。父工作流会在发布前验证当前 x64、ARM64 和 checksum 资产 contract。直接恢复会在用固定源字节替换预期 contract 资产前，拒绝意外的 `OpenClawCompanion-*` 资产名称。仅为恢复手动调度 `Windows Node Release`，并且始终传入精确标签，绝不要传 `latest`，同时传入来自已批准源 release 的显式 `expected_installer_digests` JSON map。网站下载链接应指向当前稳定版发布的精确 OpenClaw release 资产 URL；或者仅在验证 GitHub 的 latest 重定向指向同一个 release 后，才使用 `releases/latest/download/...`；不要只链接到 companion repo release 页面。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock 一致性测试道，以及快速 live Matrix profile 和 Telegram QA 测试道。live 测试道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你希望并行获取完整 Matrix 传输、媒体和 E2EE 清单时，用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径简短、确定性且聚焦产物，同时较慢的 live 检查保留在自己的测试道中，避免拖慢或阻塞发布
- 带有 secret 的发布检查应通过 `Full Release Validation` 调度，或从 `main`/release 工作流 ref 调度，这样工作流逻辑和 secret 会保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整 commit SHA，只要解析出的 commit 可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支 commit SHA，不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍要求真实发布标签
- 两个工作流都会把真实发布和提升路径保留在 GitHub-hosted runner 上，而非变更验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流 secret
- npm 发布预检不再等待单独的发布检查测试道
- 在本地为发布候选项打标签前，运行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。该 helper 会按能在 GitHub 发布工作流开始前捕获常见批准阻塞错误的顺序，运行快速发布 guardrail、插件 npm/ClawHub 发布检查、构建、UI 构建和 `release:openclaw:npm:check`。
- 批准前运行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  （或匹配的 beta/correction 版本）以在全新的临时前缀中验证已发布注册表
  安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以使用共享租用的 Telegram 凭据池，针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置以及真实 Telegram E2E。
  本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个
  `OPENCLAW_QA_TELEGRAM_*` 环境变量凭据。
- 要从维护者机器运行完整的发布后 beta 冒烟测试，请使用 `pnpm release:beta-smoke -- --beta betaN`。该辅助程序会运行 Parallels npm 更新/全新目标验证，派发 `NPM Telegram Beta E2E`，轮询精确的 workflow run，下载构件，并打印 Telegram 报告。
- 维护者可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` 工作流运行同一发布后检查。它有意设置为仅手动触发，
  不会在每次合并时运行。
- 维护者发布自动化现在使用预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.PATCH` 分支派发
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入显式目标设为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因为
    `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而源仓库保持
    仅 OIDC 发布
  - 公共 `macOS Release` 仅用于验证；当标签只存在于发布分支，
    但工作流从 `main` 派发时，请设置
    `public_release_branch=release/YYYY.M.PATCH`
  - 真实 macOS 发布必须通过成功的 macOS `preflight_run_id` 和
    `validate_run_id`
  - 真实发布路径会提升已准备好的构件，而不是再次重新构建它们
- 对于像 `YYYY.M.PATCH-N` 这样的 stable 修正发布，发布后验证器
  还会检查从 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同临时前缀升级路径，
  因此发布修正不会悄悄让旧的全局安装停留在基础 stable 载荷上
- npm 发布预检会以 fail closed 方式失败，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，
  这样我们就不会再次发布空的浏览器仪表板
- 发布后验证还会检查已发布的插件入口点和包元数据是否存在于已安装的注册表布局中。发布如果缺少插件运行时载荷，会导致发布后验证器失败，并且
  不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，
  因此安装器 e2e 会在发布发布路径之前捕获意外的包体积膨胀
- 如果发布工作触及 CI 规划、插件计时清单或
  插件测试矩阵，请在批准前重新生成并审查由规划器拥有的
  `plugin-prerelease-extension-shard` 矩阵输出，来源为
  `.github/workflows/plugin-prerelease.yml`，这样发布说明就不会描述过时的 CI 布局
- stable macOS 发布就绪还包括更新器表面：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - `main` 上的 `appcast.xml` 必须在发布后指向新的 stable zip；
    macOS 发布工作流会自动提交它，或在直接推送被阻止时打开一个 appcast
    PR
  - 打包应用必须保持非调试 bundle id、非空 Sparkle feed
    URL，以及大于或等于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。对于快速变化分支上的固定提交证明，请使用辅助工具，让每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该辅助工具会推送 `release-ci/<sha>-...`，从该分支以 `ref=<sha>` 分派 `Full Release Validation`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这样可以避免意外证明更新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流 ref 运行它，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

该工作流会解析目标 ref，以 `target_ref=<release-ref>` 分派手动 `CI`，然后分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 会展开安装冒烟、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带有规范 Telegram 包 E2E 的 Package Acceptance、QA Lab 对等性、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 成功时，完整/all 运行才可接受，除非聚焦重跑有意跳过了单独的 `Plugin Prerelease` 子项。独立的 `npm-telegram` 子项仅用于带 `release_package_spec` 或 `npm_telegram_package_spec` 的聚焦已发布包重跑。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。请参阅 [完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、准确的工作流作业名称、stable 与 full 配置档案差异、构件以及聚焦重跑句柄。子工作流会从运行 `Full Release Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择受信任的测试框架。不要使用 `--ref main -f ref=<sha>` 为移动中的 `main` 做精确提交证明；原始提交 SHA 不能作为工作流分派 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/提供商覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的建议性提供商/媒体覆盖

Stable 和 full 验证在晋升前始终运行穷尽的 live/E2E、Docker 发布路径，以及有界的已发布升级幸存者扫描。使用 `run_release_soak=true` 为 beta 请求同一扫描。该扫描覆盖最新四个 stable 包，加上固定的 `2026.4.23` 和 `2026.5.2` 基线，以及较旧的 `2026.4.15` 覆盖；重复基线会被移除，每个基线都会分片到自己的 Docker runner 作业中。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将目标 ref 一次解析为 `release-package-under-test`，并在 soak 运行时在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该构件。这让所有面向包的测试盒使用相同字节，并避免重复构建包。beta 已经发布到 npm 后，设置 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，让发布检查下载已发布包一次，从 `dist/build-info.json` 提取其构建源 SHA，并为跨 OS、Package Acceptance、发布路径 Docker 和包 Telegram 通道复用该构件。当设置了 repo/org 变量时，跨 OS OpenAI 安装冒烟使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该通道证明的是包安装、新手引导、Gateway 网关启动和一次 live 智能体轮次，而不是基准测试最慢的默认模型。更广泛的 live 提供商矩阵仍然是模型特定覆盖的位置。

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

不要把完整总控伞作为聚焦修复后的第一次重跑。如果一个测试盒失败，请使用失败的子工作流、作业、Docker 通道、包配置档案、模型提供商或 QA 通道作为下一次证明。只有当修复更改了共享发布编排，或让先前的全测试盒证据过期时，才再次运行完整总控伞。总控伞的最终验证器会重新检查记录的子工作流运行 ID，因此子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传给总控伞。`all` 是真正的发布候选运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布用的插件子项，`release-checks` 运行每个发布测试盒，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整/all 运行使用 Package Acceptance 内的规范包 Telegram E2E。聚焦跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/套件过滤器。QA 发布检查失败会阻塞普通发布验证，包括标准层级中必需的 OpenClaw 动态工具漂移。Tideclaw alpha 运行仍可将非包安全的发布检查通道视为建议性。当 `live_suite_filter` 显式请求门控 QA live 通道（例如 Discord、WhatsApp 或 Slack）时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 变量；否则输入捕获会失败，而不是静默跳过该通道。

### Vitest

Vitest 测试盒是手动 `CI` 子工作流。手动 CI 有意绕过变更范围限定，并为发布候选强制执行普通测试图：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建构件冒烟检查、文档检查、Python skills、Windows、macOS 和 Control UI i18n。当 `Full Release Validation` 运行该测试盒时会包含 Android，因为总控伞传入 `include_android=true`；独立手动 CI 需要 `include_android=true` 才有 Android 覆盖。

使用此测试盒回答“源代码树是否通过完整普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- 显示已分派 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色的 `CI` 运行
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当运行需要性能分析时，Vitest 计时构件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或包测试盒时，才直接运行手动 CI。非 Android 直接 CI 使用第一条命令。当直接发布候选 CI 必须覆盖 Android 时，添加 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 测试盒通过 `openclaw-live-and-e2e-checks-reusable.yml` 存在于 `OpenClaw Release Checks` 中，外加发布模式的 `install-smoke` 工作流。它通过打包的 Docker 环境验证发布候选，而不仅是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并将 QR、root/gateway 和 installer/Bun 冒烟作业作为单独的 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时在 `plugins-runtime-services` 分块内的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载通道，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live 套件时的 live/E2E 提供商套件和 Docker live 模型覆盖

重跑前使用 Docker 构件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 测试盒也是 `OpenClaw Release Checks` 的一部分。它是智能体式行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- mock 对等性通道，使用智能体式对等性包将 OpenAI 候选通道与 Opus 4.6 基线比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置档案
- 使用 Convex CI 凭据租约的 live Telegram QA 通道
- 当发布遥测需要显式本地证明时的 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此测试盒回答“发布在 QA 场景和 live 渠道流中是否表现正确？”批准发布时保留对等性、Matrix 和 Telegram 通道的构件 URL。完整 Matrix 覆盖仍然可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键通道。

### Package

Package 测试盒是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流测试框架 ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有必需 `package_sha256` 的公开 HTTPS `.tgz`；会拒绝 URL 凭证、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析地址，以及不安全重定向
- `source=trusted-url`：从 `.github/package-trusted-sources.json` 中具名策略下载带有必需 `package_sha256` 和 `trusted_source_id` 的 HTTPS `.tgz`；维护者拥有的企业镜像或私有包仓库应使用此项，而不是向 `source=url` 添加输入级私有网络绕过
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会使用 `source=artifact`、准备好的发布包 artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行包验收。包验收会针对同一个已解析 tarball 保持迁移、更新、已配置凭证的更新后重启、实时 ClawHub 技能安装、过期插件依赖清理、离线插件 fixture、插件更新以及 Telegram 包 QA。阻塞发布检查使用默认的最新已发布包基线；带有 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta profile 会扩展到从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，再加上已报告问题的 fixture。对已经发布的候选版本使用带 `source=npm` 的包验收；发布前对由 SHA 支持的本地 npm tarball 使用 `source=ref`；对维护者拥有的企业/私有镜像使用 `source=trusted-url`；对另一个 GitHub Actions 运行上传的已准备 tarball 使用 `source=artifact`。它是 GitHub 原生替代方案，可取代以前需要 Parallels 的大部分包/更新覆盖。跨 OS 发布检查对 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用包验收。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在判断哪个本地、Docker、包验收或发布检查 lane 能证明插件安装/更新、Doctor 清理或已发布包迁移更改时，请使用它。从每个稳定 `2026.4.23+` 包进行穷尽式已发布更新迁移，是单独的手动 `Update Migration` 工作流，不属于完整发布 CI。

旧版包验收宽容策略有意设置了时间限制。直到 `2026.4.25` 的包可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、从 tarball 派生的 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可以对已经发出的本地构建元数据标记文件给出警告。更晚的包必须满足现代包契约；相同缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，请使用更宽的包验收 profile：

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
- `package`：安装/更新/重启/插件包契约，加上实时 ClawHub 技能安装证明；这是发布检查默认值
- `product`：`package` 加上 MCP 频道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选版本的 Telegram 证明，请在包验收中启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会把已解析的 `package-under-test` tarball 传入 Telegram lane；独立 Telegram 工作流仍接受已发布的 npm spec，用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它按发布所需顺序编排 trusted-publisher 工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分发 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 分发 `Plugin ClawHub Release`。
6. 在验证已保存的 `full_release_validation_run_id` 后，使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 分发 `OpenClaw NPM Release`。
7. 对于稳定版发布，创建或更新 GitHub release 为草稿，使用明确的 `windows_node_tag` 和候选版本已批准的 `windows_node_installer_digests` 分发 `Windows Node Release`，并在发布草稿前验证规范安装器/校验和资产。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

将稳定版发布到默认 beta dist-tag：

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

直接将稳定版提升到 `latest` 是显式操作：

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

仅将底层 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流用于聚焦修复或重新发布工作。当 `publish_openclaw_npm=true` 时，`OpenClaw Release Publish` 会拒绝 `plugin_publish_scope=selected`，这样核心包不能在缺少任何可发布官方插件的情况下发出，包括 `@openclaw/diffs-language-pack`。对于选定插件修复，请设置 `publish_openclaw_npm=false`、`plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或直接分发子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，这样工作流会复用成功预检运行准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认是 `beta`

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 id；当 `publish_openclaw_npm=true` 时必需
- `full_release_validation_run_id`：成功的 `Full Release Validation` 运行 id；当 `publish_openclaw_npm=true` 时必需
- `windows_node_tag`：精确的非预发布 `openclaw/openclaw-windows-node` 发布标签；稳定版 OpenClaw 发布必需
- `windows_node_installer_digests`：候选版本已批准的紧凑 JSON 映射，从当前 Windows 安装器名称映射到其固定 `sha256:` 摘要；稳定版 OpenClaw 发布必需
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认是 `all-publishable`；仅在 `publish_openclaw_npm=false` 的聚焦插件专用修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，以逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认是 `true`；仅在将该工作流作为插件专用修复编排器时设置为 `false`
- `wait_for_clawhub`：默认是 `false`，因此 npm 可用性不会被 ClawHub sidecar 阻塞；仅当工作流完成必须包含 ClawHub 完成时设置为 `true`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求已解析提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：为 beta 发布检查选择加入穷尽式实时/E2E、Docker 发布路径，以及 all-since upgrade-survivor soak。`release_profile=stable` 和 `release_profile=full` 会强制启用它。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有当 `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；该工作流会在发布前继续验证该元数据

## 稳定版 npm 发布序列

切稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签存在之前，你可以使用当前完整工作流分支的提交
     SHA，对预检工作流执行仅验证的 dry run
2. 对于常规的 beta 优先流程，选择 `npm_dist_tag=beta`；只有在你有意直接发布稳定版时，
   才选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI，以及 live prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，请在发布分支、发布标签或完整提交 SHA 上运行
   `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布引用上运行手动 `CI` 工作流
5. 选择确切的非预发布 `openclaw/openclaw-windows-node` 发布标签，其已签名的 x64 和 ARM64 安装器应随版本发布。将其保存为
   `windows_node_tag`，并将它们已验证的摘要映射保存为
   `windows_node_installer_digests`。发布候选辅助工具会记录二者，并将它们包含在生成的发布命令中。
6. 保存成功的 `preflight_run_id` 和 `full_release_validation_run_id`
7. 使用相同的 `tag`、相同的 `npm_dist_tag`、所选的 `windows_node_tag`、已保存的 `windows_node_installer_digests`、
   已保存的 `preflight_run_id` 和已保存的 `full_release_validation_run_id` 运行
   `OpenClaw Release Publish`；它会先将外部化插件发布到 npm 和 ClawHub，然后再提升
   OpenClaw npm 包
8. 如果发布落在 `beta` 上，请使用
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版本从 `beta` 提升到 `latest`
9. 如果发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个稳定构建，请使用同一个发布
   工作流将两个 dist-tag 都指向该稳定版本，或让其定时的自愈同步稍后移动 `beta`

dist-tag 变更位于发布账本仓库中，因为它仍然需要
`NPM_TOKEN`，而源仓库保持仅 OIDC 的发布。

这样可以让直接发布路径和 beta 优先提升路径都保持有文档记录，并且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将其保留在 tmux 内部，可以让提示、
警报和 OTP 处理可观察，并防止重复的主机警报。

## 公共参考资料

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

- [发布频道](/zh-CN/install/development-channels)
