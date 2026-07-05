---
read_when:
    - 查找公开发布渠道定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-07-05T11:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed09e292495a0597fa72d32ad0a17428cf38dcb2d2e11dd77ff60b773a73bf35
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 当前公开三个面向用户的更新频道：

- stable：现有的已提升发布频道，在单独的 CLI/频道里程碑落地前，仍通过 npm `latest` 解析
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

另外，发布操作员可以将上一个已完成月份的核心包发布到 npm `extended-stable`，从补丁号 `33` 开始。当月常规最终线继续使用 npm `latest`；这个操作员侧的发布拆分本身不会改变 CLI 更新频道解析。

Tideclaw alpha 构建是单独的内部预发布轨道（npm dist-tag `alpha`），在 [NPM 工作流输入](#npm-workflow-inputs) 和 [发布测试盒](#release-test-boxes) 中说明。

## 版本命名

- 每月 npm extended-stable 发布版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 标签 `vYYYY.M.PATCH`
- 每日/常规最终发布版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 标签 `vYYYY.M.PATCH`
- 常规回退修正发布版本：`YYYY.M.PATCH-N`，git 标签 `vYYYY.M.PATCH-N`
- Beta 预发布版本：`YYYY.M.PATCH-beta.N`，git 标签 `vYYYY.M.PATCH-beta.N`
- Alpha 预发布版本：`YYYY.M.PATCH-alpha.N`，git 标签 `vYYYY.M.PATCH-alpha.N`
- 月份或补丁号绝不补零
- `PATCH` 是按月发布列车的顺序号，不是日历日期。常规最终版和 beta 版会推进当前列车；仅 alpha 的标签绝不会占用或推进 beta/常规补丁号，因此在选择 beta 或常规列车时，忽略补丁号更高的旧版仅 alpha 标签。
- Alpha/nightly 构建使用下一个未发布的补丁列车，并且重复构建时只递增 `alpha.N`。一旦该补丁已有 beta，新 alpha 构建就移动到后续补丁。
- npm 版本不可变：绝不删除、重新发布或复用已发布标签。改为切下一个预发布编号或下一个月度补丁。
- `latest` 继续跟随当前常规/每日 npm 线；`beta` 是当前 beta 安装目标
- `extended-stable` 表示受支持的上一个月份 npm 包，从补丁号 `33` 开始；补丁号 `34` 及以后是该月度线上的维护发布
- 常规最终版和常规修正版默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或稍后提升一个已验证的 beta 构建
- 专用的每月 extended-stable 路径只发布核心 npm 包。它不会发布插件、macOS 或 Windows 制品、GitHub Release、私有仓库 dist-tag、Docker 镜像、移动端制品或网站下载。
- 每个常规最终发布都会同时交付 npm 包、macOS 应用和签名的 Windows Hub 安装器。Beta 发布通常先验证并发布 npm/package 路径，原生应用构建/签名/公证/提升保留给常规最终版，除非明确要求。

## 发布节奏

- 发布先进入 beta；只有在最新 beta 验证通过后，stable 才会跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.PATCH` 分支切发布，这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布且需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重建旧标签
- 详细发布流程、审批、凭据和恢复说明仅面向维护者

## 每月仅 npm 的 extended-stable 发布

这是下面常规发布流程的专用例外。对于已完成月份 `YYYY.M`，创建 `extended-stable/YYYY.M.33`；从同一分支发布 `vYYYY.M.33` 及后续维护补丁。发布标签、分支尖端、检出、包版本、npm 预检和完整发布验证运行都必须标识同一个提交。受保护的 `main` 必须已经包含严格晚于该日历月份且补丁号低于 `33` 的最终版本；即使 `main` 向前推进超过一个月，维护补丁仍保持符合条件。

从精确的 extended-stable 分支运行 npm 预检和完整发布验证，然后保存两个运行 ID：

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

`release_profile=stable` 是现有的验证深度配置；它与 npm `extended-stable` dist-tag 分离，并且有意保持不变。

两个运行都成功且 npm 发布环境准备就绪后，提升精确的预检 tarball。补丁号 `P` 必须为 `33` 或更大：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

对于 fork 或非生产演练，如果有意无法满足每月 `.33` 或受保护 `main` 月份策略，请向 npm 预检和发布 dispatch 都添加 `-f bypass_extended_stable_guard=true`。默认值为 `false`。此绕过仅在 `npm_dist_tag=extended-stable` 时接受，并记录在工作流摘要中。它不会绕过规范的 `extended-stable/YYYY.M.33` 工作流 ref、分支尖端/标签/检出一致性、最终标签语法、包/标签版本一致性、引用运行与清单身份、tarball 来源、环境审批、注册表回读或选择器修复证据。

发布工作流会验证引用的运行身份、已准备 tarball 摘要以及两个 npm 注册表选择器。工作流成功后，单独确认结果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

两个命令都必须返回 `YYYY.M.P`。如果发布成功但选择器回读失败，不要重新发布不可变的包版本。使用失败工作流始终运行摘要中打印的单个 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修复命令，然后重复两个独立回读。回滚到上一个选择器是单独的操作员决策，不是回读修复路径。

下面的常规清单继续负责 beta、`latest`、GitHub Release、插件、macOS、Windows 和其他平台发布。不要为这个仅 npm 的 extended-stable 路径运行这些步骤。

## 常规发布操作员清单

此清单是发布流程的公开形态。私有凭据、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认 `main` CI 足够健康，可以从它创建分支。
2. 从上一个可达发布标签以来合并的 PR 和所有直接提交生成顶部 `CHANGELOG.md` 小节。保持条目面向用户，去重重叠的 PR/直接提交条目，提交、推送，并在创建分支前再 rebase/pull 一次。
3. 审查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍然覆盖时才移除已过期兼容性，或者记录为什么有意继续保留它。
4. 从当前 `main` 创建 `release/YYYY.M.PATCH`。不要直接在 `main` 上做常规发布工作。
5. 为该标签更新每个必需的版本位置，然后运行 `pnpm release:prep`。它会按顺序刷新插件版本、npm shrinkwrap、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。打标签前提交所有生成漂移，然后运行本地确定性预检：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在前，允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。预检会为精确检出的依赖图生成依赖发布证据，并将其存储在 npm 预检制品中。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。保存 `full_release_validation_run_id`；它是 `OpenClaw NPM Release` 和 `OpenClaw Release Publish` 的必需输入。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败文件、lane、工作流 job、package profile、提供商或模型 allowlist。只有当变更表面使先前证据过期时，才重新运行完整 umbrella。
9. 对于带标签的 beta 候选版，从匹配的 `release/YYYY.M.PATCH` 分支运行 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。对于 stable，还要传入必需的 Windows 源发布：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。该助手会运行本地生成发布检查，dispatch 或验证完整发布验证和 npm 预检证据，针对精确准备好的 tarball 运行 Parallels fresh/update proof 加 Telegram package proof，记录插件 npm 和 ClawHub 计划，并且只在证据包为绿色后打印精确的 `OpenClaw Release Publish` 命令。

   `OpenClaw Release Publish` 会将选定的或所有可发布的插件包并行 dispatch 到 npm 和同一组 ClawHub，然后在插件 npm 发布成功后，用匹配的 dist-tag 提升已准备的 OpenClaw npm 预检制品。OpenClaw npm 发布子流程成功后，它会从完整匹配的 `CHANGELOG.md` 小节创建或更新匹配的 GitHub release/prerelease 页面：发布到 npm `latest` 的 stable 版本会成为 GitHub latest release，保留在 npm `beta` 上的 stable 维护发布会以 GitHub `latest=false` 创建。该工作流还会将预检依赖证据、完整验证清单和发布后注册表验证证据上传到 GitHub release，以便发布后事件响应。它会立即打印子运行 ID，自动批准工作流令牌允许批准的发布环境门禁，用日志尾部汇总失败的子 job，在 OpenClaw npm 发布成功后立即完成 GitHub release 和依赖证据收尾，在发布 OpenClaw npm 时等待 ClawHub，然后运行 `pnpm release:verify-beta`，并上传 GitHub release、npm 包、选定插件 npm 包、选定 ClawHub 包、子工作流运行 ID 和可选 NPM Telegram 运行 ID 的发布后证据。ClawHub 路径会重试瞬时 CLI 依赖安装失败，即使某个预览单元不稳定也会发布通过预览的插件，并以每个预期插件版本的注册表验证结束，让部分发布保持可见且可重试。

   然后针对已发布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 包运行发布后 package acceptance。如果已推送或已发布的预发布需要修复，切下一个匹配的预发布编号；绝不删除或重写旧编号。

10. 对于稳定版，只有在经过审核的 beta 或候选发布版本具备所需验证证据后，才继续推进。稳定版 npm 发布也通过 `OpenClaw Release Publish` 完成，并通过 `preflight_run_id` 复用成功的预检产物。稳定版 macOS 发布就绪还要求 `main` 上已有打包的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`；macOS 发布工作流会在发布资产验证后自动将已签名的 appcast 发布到公开 `main`，如果分支保护阻止直接推送，则打开或更新一个 appcast PR。稳定版 Windows Hub 就绪要求 OpenClaw GitHub release 上已有已签名的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 和 `OpenClawCompanion-SHA256SUMS.txt` 资产。将确切已签名的 `openclaw/openclaw-windows-node` release 标签作为 `windows_node_tag` 传入，并将其候选版本已批准的安装器摘要映射作为 `windows_node_installer_digests` 传入；`OpenClaw Release Publish` 会保留 release 草稿，调度 `Windows Node Release`，并在发布前验证全部三个资产。
11. 发布后，运行 npm 发布后验证器；当你需要发布后的渠道证明时，运行可选的独立已发布 npm Telegram E2E；在需要时提升 dist-tag；验证生成的 GitHub release 页面；运行发布公告步骤；然后完成[稳定版 main 收尾](#stable-main-closeout)，再将稳定版发布视为完成。

## 稳定版 main 收尾

稳定版发布只有在 `main` 携带实际已发布的 release 状态后才算完成。

1. 从最新干净的 `main` 开始。对照它审计 `release/YYYY.M.PATCH`，并将 `main` 中缺失的真实修复向前移植。不要盲目地把仅用于 release 的兼容性、测试或验证适配器合并到较新的 `main`。
2. 将 `main` 设置为已发布的稳定版版本，而不是推测性的下一条发布列车。在根版本变更后运行 `pnpm release:prep`，然后运行 `pnpm deps:shrinkwrap:generate`。
3. 让 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 部分与已打标签的 release 分支完全一致。当 mac release 发布了稳定版 `appcast.xml` 更新时，也要包含该更新。
4. 在操作员明确启动该发布列车之前，不要向 `main` 添加 `YYYY.M.PATCH+1`、beta 版本或空的未来 changelog 部分。
5. 运行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送后，在将稳定版 release 标记为完成前，验证 `origin/main` 包含已发布版本和 changelog。
6. 每次私有回滚演练后，保持仓库变量 `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE` 为最新。

`OpenClaw Stable Main Closeout` 从稳定版发布后携带已发布版本、changelog 和 appcast 的 `main` 推送开始。它读取不可变的发布后证据，将已发布标签绑定到其 Full Release Validation 和 Publish 运行，然后验证稳定版 main 状态、release、强制稳定版浸泡测试以及阻塞性的性能证据。它会把不可变的收尾清单和校验和附加到 GitHub release。自动推送触发器会跳过早于不可变发布后证据的旧版 release，并且绝不会把该跳过视为已完成的收尾。

完整收尾需要同时具备资产和匹配的校验和。部分清单会重放其记录的 `main` SHA 和回滚演练以重新生成相同字节，然后附加缺失的校验和；无效配对，或只有校验和而没有清单，仍会阻塞。没有回滚演练仓库变量的推送触发运行会跳过且不完成收尾；缺失或超过 90 天的演练记录仍会阻塞有证据支撑的手动收尾。私有恢复命令保留在仅维护者可见的运行手册中。仅使用手动调度来修复或重放有证据支撑的稳定版收尾。

旧版回退修正标签只有在修正标签解析到与基础稳定版标签相同的源提交时，才可以复用基础包证据。源不同的修正必须发布并验证自己的包证据。

## 发布预检

- 在 release 预检前运行 `pnpm check:test-types`，以便测试 TypeScript 在更快的本地 `pnpm check` 门禁之外仍被覆盖。
- 在 release 预检前运行 `pnpm check:architecture`，以便更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色。
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，以便预期的 `dist/*` release 产物和 Control UI bundle 存在，可用于打包验证步骤。
- 在根版本 bump 后、打标签前运行 `pnpm release:prep`。它会运行每个在版本、配置或 API 变更后常见漂移的确定性 release 生成器：插件版本、npm shrinkwrap、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK exports，以及插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些守卫（外加插件 SDK 表面预算检查），并在运行包 release 检查前一次性报告所有生成内容漂移失败。
- 插件版本同步默认会将可发布的 `@openclaw/ai` 运行时包、官方插件包版本，以及现有 `openclaw.compat.pluginApi` 下限更新为 OpenClaw release 版本。将该字段视为插件 SDK/运行时 API 下限，而不仅仅是包版本的拷贝：对于有意保持兼容较旧 OpenClaw host 的仅插件 release，请将下限保留为支持的最旧 host API，并在插件 release 证明中记录该选择。
- 在 release 批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，调度手动 `CI`，并调度 `OpenClaw Release Checks` 来执行安装 smoke、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram lane。稳定版和完整运行始终包含穷尽的实时/E2E 和 Docker release 路径浸泡测试；`run_release_soak=true` 保留用于显式 beta 浸泡测试。Package Acceptance 在候选验证期间提供规范的包 Telegram E2E，避免第二个并发实时轮询器。

  发布 beta 后提供 `release_package_spec`，以便在 release 检查、Package Acceptance 和包 Telegram E2E 中复用已发布的 npm 包，而无需重新构建 release tarball。只有当 Telegram 应使用不同于 release 验证其余部分的已发布包时，才提供 `npm_telegram_package_spec`。当 Package Acceptance 应使用不同于 release 包规格的已发布包时，提供 `package_acceptance_package_spec`。当 release 证据报告应证明验证匹配某个已发布 npm 包、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 当你希望在 release 工作继续期间为包候选提供旁路证明时，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或确切 release 版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或 SHA；对需要 SHA-256 和严格公开 URL 策略的公开 HTTPS tarball 使用 `source=url`；对使用必需 `trusted_source_id` 和 SHA-256 的命名可信来源策略使用 `source=trusted-url`；或对由另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。

  该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E release 调度器，并且可以通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当选中的 Docker lane 包含 `published-upgrade-survivor` 时，包产物就是候选，而 `published_upgrade_survivor_baseline` 会选择已发布的基线。`update-restart-auth` 将候选包同时用作已安装 CLI 和 package-under-test，从而覆盖候选更新命令的托管式重启路径。

  示例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用 profile：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载 lane
  - `package`：不含 OpenWebUI 或实时 ClawHub 的产物原生包/更新/重启/插件 lane
  - `product`：package profile 加上 MCP 渠道、cron/子智能体清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker release 路径分块
  - `custom`：用于聚焦重跑的确切 `docker_lanes` 选择

- 当你只需要 release 候选的确定性常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 调度会绕过变更范围判定，并强制运行 Linux Node shard、内置插件 shard、插件和渠道契约 shard、Node 22 兼容性、`check-*`、`check-additional-*`、已构建产物 smoke 检查、文档检查、Python Skills、Windows、macOS 和 Control UI i18n lane。独立手动 CI 只有在通过 `include_android=true` 调度时才运行 Android；`Full Release Validation` 会为它的 CI 子运行传入该输入。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 验证发布遥测时，运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器演练 QA-lab，并验证 trace、metric 和 log 导出，以及有界 trace 属性和内容/标识符脱敏，而无需 Opik、Langfuse 或其他外部收集器。
- 验证 collector 兼容性时，运行 `pnpm qa:otel:collector-smoke`。它会先通过真实的 OpenTelemetry Collector Docker 容器路由相同的 QA-lab OTLP 导出，再执行本地接收器断言。
- 验证受保护的 Prometheus 抓取时，运行 `pnpm qa:prometheus:smoke`。它会演练 QA-lab，拒绝未认证的抓取，并验证发布关键 metric family 不包含 prompt 内容、原始标识符、auth token 和本地路径。
- 运行 `pnpm qa:observability:smoke`，连续执行源代码 checkout 的 OpenTelemetry 和 Prometheus smoke lane。
- 每次打标签发布前运行 `pnpm release:check`。
- `OpenClaw NPM Release` preflight 会在打包 npm tarball 前生成依赖发布证据。npm advisory 漏洞门禁会阻断发布。传递性 manifest 风险、依赖所有权/安装表面和依赖变更报告仅作为发布证据。依赖变更报告会将候选发布与上一个可达发布标签进行比较。preflight 会将依赖证据上传为 `openclaw-release-dependency-evidence-<tag>`，并同时把它嵌入已准备好的 npm preflight artifact 的 `dependency-evidence/` 下。真实发布路径会复用该 preflight artifact，然后把相同证据作为 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub release。
- 标签存在后，为会修改状态的发布序列运行 `OpenClaw Release Publish`。从 `release/YYYY.M.PATCH`（或发布 main 可达标签时用 `main`）dispatch 它，传入发布标签、成功的 OpenClaw npm `preflight_run_id` 和成功的 `full_release_validation_run_id`，并保持默认插件发布范围 `all-publishable`，除非你是在有意运行聚焦修复。该 workflow 会串行执行插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保 core package 不会在其外部化插件之前发布。
- 稳定版 `OpenClaw Release Publish` 要求在匹配的非 prerelease `openclaw/openclaw-windows-node` release 存在后提供精确的 `windows_node_tag`，以及候选版本已批准的 `windows_node_installer_digests` map。在 dispatch 任何 publish child 之前，它会验证源 release 已发布、不是 prerelease、包含所需的 x64/ARM64 installer，并且仍然匹配该已批准的 map。随后它会在 OpenClaw release 仍为 draft 时 dispatch `Windows Node Release`，原样携带固定的 installer digest map。child workflow 会从该精确标签下载已签名的 Windows Hub installer，对照固定 digest 校验它们，验证其 Authenticode 签名在 Windows runner 上使用预期的 OpenClaw Foundation signer，写入 SHA-256 manifest，并把 installer 和 manifest 上传到 canonical OpenClaw GitHub release，然后重新下载已提升的 asset，并验证 manifest 成员关系和 hash。parent 会在发布前验证当前 x64、ARM64 和 checksum asset contract。直接恢复会先拒绝意外的 `OpenClawCompanion-*` asset name，再用固定源字节替换预期 contract asset。

  仅在恢复时手动 dispatch `Windows Node Release`，并且始终传入精确标签，绝不要传 `latest`，同时传入来自已批准源 release 的显式 `expected_installer_digests` JSON map。网站下载链接应指向当前稳定版 release 的精确 OpenClaw release asset URL，或仅在验证 GitHub 的 latest redirect 指向同一 release 后使用 `releases/latest/download/...`；不要只链接到 companion repo release 页面。

- 发布检查现在在单独的手动 workflow 中运行：`OpenClaw Release Checks`。它还会在发布批准前运行 QA Lab mock parity lane，以及快速 live Matrix profile 和 Telegram QA lane。live lane 使用 `qa-live-shared` environment；Telegram 还使用 Convex CI 凭证 lease。当你需要并行获取完整 Matrix transport、media 和 E2EE inventory 时，运行手动 `QA-Lab - All Lanes` workflow，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨 OS 安装和升级运行时验证是公共 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。这种拆分是有意的：让真实 npm 发布路径保持短小、确定并聚焦 artifact，同时较慢的 live check 留在自己的 lane 中，避免拖慢或阻塞发布。
- 带 secret 的发布检查应通过 `Full Release Validation` dispatch，或从 `main`/release workflow ref dispatch，以确保 workflow 逻辑和 secret 保持受控。
- `OpenClaw Release Checks` 接受分支、标签或完整 commit SHA，只要解析出的 commit 可从 OpenClaw 分支或 release tag 到达。
- `OpenClaw NPM Release` validation-only preflight 也接受当前完整 40 字符 workflow 分支 commit SHA，而不要求已推送标签。该 SHA 路径仅用于验证，不能提升为真实发布。在 SHA 模式下，workflow 只会为 package metadata check 合成 `v<package.json version>`；真实发布仍需要真实 release tag。
- 两个 workflow 都让真实发布和提升路径留在 GitHub-hosted runner 上，而非修改性的验证路径可以使用更大的 Blacksmith Linux runner。
- 该 workflow 会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secret。
- npm release preflight 不再等待单独的 release checks lane。
- 在本地为候选发布打标签前，运行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。该 helper 会按顺序运行快速发布 guardrail、插件 npm/ClawHub 发布检查、build、UI build 和 `release:openclaw:npm:check`，以便在 GitHub publish workflow 启动前捕获常见的阻塞批准错误。
- 批准前运行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 prerelease/correction 标签）。
- npm publish 后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或匹配的 beta/correction 版本），在全新临时 prefix 中验证已发布 registry 安装路径。
- beta publish 后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租赁的 Telegram 凭证池，针对已发布 npm package 验证已安装 package 的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性操作可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 要从维护者机器运行完整的 post-publish beta smoke，请使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm update/fresh-target 验证，dispatch `NPM Telegram Beta E2E`，轮询精确的 workflow run，下载 artifact，并打印 Telegram report。
- 维护者可以通过手动 `NPM Telegram Beta E2E` workflow 从 GitHub Actions 运行相同的 post-publish check。它有意仅支持手动运行，不会在每次 merge 时运行。
- 维护者发布自动化使用 preflight-then-promote：
  - 真实 npm publish 必须通过成功的 npm `preflight_run_id`。
  - 真实 publish 必须从与成功 preflight run 相同的 `main` 或 `release/YYYY.M.PATCH` 分支 dispatch（alpha prerelease 允许使用 Tideclaw alpha 分支）。
  - 稳定版 npm release 默认使用 `beta`；稳定版 npm publish 可以通过 workflow input 显式目标到 `latest`。
  - 基于 token 的 npm dist-tag 修改位于 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而源 repo 保持仅 OIDC 发布。
  - 公共 `macOS Release` 仅用于验证；当标签只存在于 release 分支但 workflow 从 `main` dispatch 时，设置 `public_release_branch=release/YYYY.M.PATCH`。
  - 真实 macOS publish 必须通过成功的 macOS `preflight_run_id` 和 `validate_run_id`。
  - 真实 publish 路径会提升已准备好的 artifact，而不是再次重建它们。
- 对于类似 `YYYY.M.PATCH-N` 的稳定版 correction release，post-publish verifier 还会检查从 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同临时 prefix 升级路径，确保 release correction 不会静默地让旧的全局安装停留在基础稳定版 payload 上。
- npm release preflight 会 fail closed，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，这样我们就不会再次发布空的浏览器 dashboard。
- Post-publish verification 还会检查已发布插件 entrypoint 和 package metadata 是否存在于已安装 registry layout 中。发布缺失插件运行时 payload 的 release 会导致 postpublish verifier 失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选 update tarball 强制执行 npm pack `unpackedSize` budget，因此 installer e2e 会在 release publish 路径前捕获意外的 pack 膨胀。
- 如果发布工作触及 CI 规划、extension timing manifest 或 extension test matrix，请在批准前重新生成并审查由 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` matrix 输出，确保发布说明不会描述过时的 CI layout。
- 稳定版 macOS 发布就绪还包括 updater 表面：GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`；发布后 `main` 上的 `appcast.xml` 必须指向新的稳定版 zip（macOS publish workflow 会自动提交它，或在直接 push 被阻止时打开 appcast PR）；打包 app 必须保持非 debug bundle id、非空 Sparkle feed URL，以及大于等于该 release 版本 canonical Sparkle build floor 的 `CFBundleVersion`。

## 发布测试机器

`Full Release Validation` 是 operator 从单一入口启动所有预发布测试的方式。对于快速变动分支上的固定 commit 证明，使用 helper，让每个 child workflow 都从固定在目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支 dispatch `Full Release Validation` 并设置 `ref=<sha>`，验证每个 child workflow 的 `headSha` 都匹配目标，然后删除临时分支。这可以避免意外证明更新的 `main` child run。

对于 release 分支或 tag 验证，请从受信任的 `main` workflow ref 运行它，并将 release 分支或 tag 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

该工作流会解析目标 ref，分发手动 `CI` 并设置 `target_ref=<release-ref>`，然后分发 `OpenClaw Release Checks`。`OpenClaw Release Checks` 会展开安装冒烟测试、跨 OS 发布检查、启用浸泡测试时的 live/E2E Docker 发布路径覆盖、包含规范 Telegram 包 E2E 的 Package Acceptance、QA Lab 对等性、live Matrix 和 live Telegram。完整/all 运行只有在 `Full Release Validation` 摘要显示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 均成功时才可接受，除非某次聚焦重跑有意跳过了单独的 `Plugin Prerelease` 子项。仅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 进行聚焦已发布包重跑时，才使用独立的 `npm-telegram` 子项。最终验证器摘要会包含每个子运行的最慢作业表，因此发布经理无需下载日志就能看到当前关键路径。

请参阅 [Full release validation](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确的工作流作业名称、stable 与 full 配置差异、构件以及聚焦重跑句柄。

子工作流会从运行 `Full Release Validation` 的可信 ref 分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择可信 harness。不要使用 `--ref main -f ref=<sha>` 为移动中的 `main` 提供精确提交证明；原始提交 SHA 不能作为工作流分发 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖广度：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定 provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

Stable 和 full 验证在发布前始终运行详尽的 live/E2E、Docker 发布路径和有界的已发布升级幸存者扫描。使用 `run_release_soak=true` 为 beta 请求同样的扫描。该扫描覆盖最新四个 stable 包，加上固定的 `2026.4.23` 和 `2026.5.2` 基线以及较旧的 `2026.4.15` 覆盖，会移除重复基线，并将每个基线分片到自己的 Docker runner 作业中。

`OpenClaw Release Checks` 使用可信工作流 ref 将目标 ref 一次性解析为 `release-package-under-test`，并在运行浸泡测试时，在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该构件。这会让所有面向包的机器使用相同字节，并避免重复构建包。beta 已经发布到 npm 后，设置 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，这样发布检查会下载一次已发布包，从 `dist/build-info.json` 提取其构建源 SHA，并为跨 OS、Package Acceptance、发布路径 Docker 和包 Telegram 通道复用该构件。

跨 OS OpenAI 安装冒烟测试在设置了 repo/org 变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因为该通道验证的是包安装、新手引导、Gateway 网关启动以及一次 live agent 轮次，而不是基准测试最慢的默认模型。更广泛的 live provider 矩阵仍然是模型特定覆盖的位置。

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

不要把完整 umbrella 作为聚焦修复后的第一次重跑。如果一台机器失败，请使用失败的子工作流、作业、Docker 通道、包配置、模型提供商或 QA 通道作为下一次证明。只有当修复更改了共享发布编排，或使之前的全机器证据过时时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，向 umbrella 传递 `rerun_group`。`all` 是真正的发布候选运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布用的插件子项，`release-checks` 运行每个发布机器，更窄的发布组是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整/all 运行使用 Package Acceptance 内的规范包 Telegram E2E。聚焦跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或另一个 OS/套件过滤器。QA 发布检查失败会阻塞普通发布验证，包括标准层级中必需的 OpenClaw 动态工具漂移。Tideclaw alpha 运行仍可将非包安全的发布检查通道视为 advisory。当 `live_suite_filter` 显式请求有门控的 QA live 通道，例如 Discord、WhatsApp 或 Slack 时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 变量；否则输入捕获会失败，而不是静默跳过该通道。

### Vitest

Vitest 机器是手动 `CI` 子工作流。手动 CI 有意绕过变更范围限定，并强制对发布候选运行普通测试图：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建构件冒烟检查、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。当 `Full Release Validation` 运行该机器时会包含 Android，因为 umbrella 会传递 `include_android=true`；独立手动 CI 需要 `include_android=true` 才能获得 Android 覆盖。

使用这台机器回答“源代码树是否通过了完整普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已分发的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上为绿色
- 调查回归时，来自 CI 作业的失败或慢分片名称
- 当运行需要性能分析时，Vitest 计时构件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或包机器时，才直接运行手动 CI。非 Android 直接 CI 使用第一个命令。当直接发布候选 CI 必须覆盖 Android 时，添加 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 机器通过 `openclaw-live-and-e2e-checks-reusable.yml` 位于 `OpenClaw Release Checks` 中，另有发布模式的 `install-smoke` 工作流。它通过打包的 Docker 环境验证发布候选，而不只是在源码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟测试的完整安装冒烟测试
- 按目标 SHA 准备/复用 root Dockerfile 冒烟镜像，QR、root/gateway 和 installer/Bun 冒烟作业作为单独的 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`
- 请求时，`plugins-runtime-services` 分块内的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载通道 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live 套件时的 live/E2E provider 套件和 Docker live 模型覆盖

重跑前先使用 Docker 构件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 机器也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- mock 对等性通道，使用 agentic 对等性包比较 OpenAI 候选通道与 `anthropic/claude-opus-4-8` 基线
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭证租约的 live Telegram QA 通道
- 当发布遥测需要明确本地证明时，运行 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用这台机器回答“发布在 QA 场景和 live 渠道流中是否行为正确？”批准发布时，请保留对等性、Matrix 和 Telegram 通道的构件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认发布关键通道。

### Package

Package 机器是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并保持工作流 harness ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有必需 `package_sha256` 的公共 HTTPS `.tgz`；会拒绝 URL 凭证、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析地址，以及不安全重定向
- `source=trusted-url`：从 `.github/package-trusted-sources.json` 中命名策略对应的 `trusted_source_id` 下载带有必需 `package_sha256` 的 HTTPS `.tgz`；将其用于维护者拥有的企业镜像或私有包仓库，而不是向 `source=url` 添加输入级私有网络绕过
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会使用 `source=artifact`、准备好的发布包工件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一个已解析 tarball 保持迁移、更新、root-managed VPS 升级、已配置凭证的更新重启、实时 ClawHub 技能安装、陈旧插件依赖清理、离线插件夹具、插件更新、插件命令绑定转义加固，以及 Telegram 包 QA。阻塞发布检查使用默认的最新已发布包基线；带有 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 配置文件会把 published-upgrade-survivor 扫描扩展到 `last-stable-4`，再加上固定的 `2026.4.23`、`2026.5.2` 和 `2026.4.15` 基线，并包含 `reported-issues` 场景。对已经发布的候选包使用带 `source=npm` 的 Package Acceptance；对发布前由 SHA 支持的本地 npm tarball 使用 `source=ref`；对维护者拥有的企业/私有镜像使用 `source=trusted-url`；对由另一个 GitHub Actions 运行上传的已准备 tarball 使用 `source=artifact`。

它是 GitHub 原生替代方案，用于覆盖此前大多需要 Parallels 的包/更新验证。跨操作系统发布检查对特定操作系统的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或发布检查通道能证明插件安装/更新、Doctor 清理或已发布包迁移变更时，请使用它。对每个稳定版 `2026.4.23+` 包进行穷尽式已发布更新迁移是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽松策略有意设置了时间边界。到 `2026.4.25` 为止的包，可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少 `gateway install --wrapper`、tarball 派生 git 夹具中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可以对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代包合约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更广泛的 Package Acceptance 配置文件：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包配置文件：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：安装/更新/重启/插件包合约，加上实时 ClawHub 技能安装证明；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会把已解析的 `package-under-test` tarball 传入 Telegram 通道；独立 Telegram 工作流仍接受已发布的 npm 规格用于发布后检查。

## 常规发布自动化

对于 beta、`latest`、插件、GitHub Release 和平台发布，`OpenClaw Release Publish` 是常规的变更入口点。每月 `.33+` 的仅 npm extended-stable 路径不使用此编排器。常规工作流会按发布所需的顺序编排 trusted-publisher 工作流：

1. 签出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达（alpha 预发布则可从 Tideclaw alpha 分支到达）。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同范围和 SHA 调度 `Plugin ClawHub Release`。
6. 在验证已保存的 `full_release_validation_run_id` 后，使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。
7. 对于稳定版发布，将创建或更新 GitHub release 为草稿，使用显式 `windows_node_tag` 和候选批准的 `windows_node_installer_digests` 调度 `Windows Node Release`，并在发布草稿前验证规范安装器/校验和资产。

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

直接提升稳定版到 `latest` 是显式操作：

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

仅在聚焦修复或重新发布工作中使用较低层级的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。当 `publish_openclaw_npm=true` 时，`OpenClaw Release Publish` 会拒绝 `plugin_publish_scope=selected`，因此核心包不能在未包含每个可发布官方插件的情况下发布，包括 `@openclaw/diffs-language-pack`。对于选定插件修复，设置 `publish_openclaw_npm=false`、`plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或直接调度子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：现有成功预检运行 ID，在真实发布路径上必需，以便工作流重用已准备的 tarball 而不是重新构建
- `full_release_validation_run_id`：此标签/SHA 的成功 `Full Release Validation` 运行 ID，真实发布必需。Beta 发布可以仅凭预检继续并发出警告，但稳定版/`latest` 提升仍然需要它。
- `release_publish_run_id`：已批准的 `OpenClaw Release Publish` 运行 ID；当此工作流由该父工作流调度时必需（bot-actor 真实发布调用）
- `npm_dist_tag`：发布路径的 npm 目标标签；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，默认值为 `beta`。最终补丁 `33` 及之后版本必须使用 `extended-stable`；默认情况下，`extended-stable` 会拒绝更早的补丁，并且始终拒绝非最终标签。
- `bypass_extended_stable_guard`：仅用于测试的布尔值，默认为 `false`；配合 `npm_dist_tag=extended-stable` 时，会绕过每月 extended-stable 资格检查，同时保留发布身份、工件、审批和回读检查。

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必需
- `full_release_validation_run_id`：成功的 `Full Release Validation` 运行 ID；当 `publish_openclaw_npm=true` 时必需
- `windows_node_tag`：精确的非预发布 `openclaw/openclaw-windows-node` 发布标签；稳定版 OpenClaw 发布必需
- `windows_node_installer_digests`：候选批准的紧凑 JSON 映射，将当前 Windows 安装器名称映射到其固定 `sha256:` 摘要；稳定版 OpenClaw 发布必需
- `npm_telegram_run_id`：可选的成功 `NPM Telegram Beta E2E` 运行 ID，用于纳入最终发布证据
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签，取值为 `alpha`、`beta` 或 `latest`
- `plugin_publish_scope`：默认为 `all-publishable`；仅在配合 `publish_openclaw_npm=false` 进行聚焦的仅插件修复工作时使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，以逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认为 `true`；仅当把该工作流用作仅插件修复编排器时设置为 `false`
- `release_profile`：用于发布证据摘要的发布覆盖配置文件；默认为 `from-validation`，它会从验证清单读取，也可以用 `beta`、`stable` 或 `full` 覆盖
- `wait_for_clawhub`：默认为 `false`，因此 npm 可用性不会被 ClawHub sidecar 阻塞；仅当工作流完成必须包含 ClawHub 完成时设置为 `true`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。携带密钥的检查要求已解析提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：选择加入针对 beta 发布检查的穷尽式实时/E2E、Docker 发布路径和 all-since upgrade-survivor soak。它会被 `release_profile=stable` 和 `release_profile=full` 强制启用。

规则：

- 补丁 `33` 以下的常规最终版本和修正版本可以发布到 `beta` 或 `latest`。补丁 `33` 或以上的最终版本必须发布到 `extended-stable`，该边界处的 correction-suffix 版本会被拒绝。
- Beta 预发布标签只能发布到 `beta`；alpha 预发布标签只能发布到 `alpha`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布前验证该元数据仍然一致

## 常规 beta/latest 稳定版发布序列

此旧版序列用于常规编排发布，它也拥有插件、GitHub Release、Windows 和其他平台工作。它不是本页顶部记录的每月 `.33+` 仅 npm extended-stable 路径。

切出常规编排稳定版发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`。在标签存在之前，你可以使用当前完整工作流分支的提交 SHA，对预检工作流进行仅验证的 dry run。
2. 正常的 beta 优先流程选择 `npm_dist_tag=beta`；只有在你明确想直接发布稳定版时才选择 `latest`。
3. 当你希望通过一个手动工作流获得正常 CI，加上实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`。如果你明确只需要确定性的正常测试图，请改为在发布 ref 上运行手动 `CI` 工作流。
4. 选择确切的非预发布 `openclaw/openclaw-windows-node` 发布标签，该标签对应应发布的已签名 x64 和 ARM64 安装程序。将其保存为 `windows_node_tag`，并将它们已验证的摘要映射保存为 `windows_node_installer_digests`。候选发布辅助工具会记录两者，并将它们包含在生成的发布命令中。
5. 保存成功的 `preflight_run_id` 和 `full_release_validation_run_id`。
6. 使用相同的 `tag`、相同的 `npm_dist_tag`、选定的 `windows_node_tag`、其保存的 `windows_node_installer_digests`、保存的 `preflight_run_id` 和保存的 `full_release_validation_run_id` 运行 `OpenClaw Release Publish`。它会先将外部化插件发布到 npm 和 ClawHub，然后再提升 OpenClaw npm 包。
7. 如果发布落在 `beta` 上，请使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，将该稳定版本从 `beta` 提升到 `latest`。
8. 如果发布是有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个稳定构建，请使用同一个发布工作流将两个 dist-tags 都指向该稳定版本，或让其计划中的自愈同步稍后移动 `beta`。

dist-tag 变更位于发布账本仓库中，因为它仍然需要 `NPM_TOKEN`，而源仓库仅保留 OIDC 发布。这让直接发布路径和 beta 优先提升路径都保持有文档记录，并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请只在专用 tmux 会话内运行任何 1Password CLI（`op`）命令。不要从主 agent shell 直接调用 `op`；将其保持在 tmux 内，可以让提示、警报和 OTP 处理可观察，并避免重复的主机警报。

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

维护者使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私有发布文档作为实际运行手册。

## 相关

- [发布渠道](/zh-CN/install/development-channels)
