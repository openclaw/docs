---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-07-06T10:51:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9c40bab337e28cb1e0263a45d2d1de7a515def2492a810de8a150ef1f4fe18d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 当前公开三个面向用户的更新频道：

- stable：现有的已提升发布频道；在独立 CLI/频道里程碑落地前，它仍通过 npm `latest` 解析
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

另外，发布操作员可以将刚完成月份的核心包发布到 npm `extended-stable`，从补丁号 `33` 开始。当前月份的常规最终线继续使用 npm `latest`；这种操作员侧的发布拆分本身不会改变 CLI 更新频道解析。

Tideclaw alpha 构建是单独的内部预发布轨道（npm dist-tag `alpha`），见 [NPM 工作流输入](#npm-workflow-inputs)和[发布测试盒](#release-test-boxes)。

## 版本命名

- 每月 npm extended-stable 发布版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 标签 `vYYYY.M.PATCH`
- 每日/常规最终发布版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 标签 `vYYYY.M.PATCH`
- 常规回退修正发布版本：`YYYY.M.PATCH-N`，git 标签 `vYYYY.M.PATCH-N`
- Beta 预发布版本：`YYYY.M.PATCH-beta.N`，git 标签 `vYYYY.M.PATCH-beta.N`
- Alpha 预发布版本：`YYYY.M.PATCH-alpha.N`，git 标签 `vYYYY.M.PATCH-alpha.N`
- 月份或补丁号永远不要补零
- `PATCH` 是按月发布列车的顺序编号，不是日历日期。常规最终版和 beta 版会推进当前列车；仅 alpha 标签永远不会消耗或推进 beta/常规补丁号，因此选择 beta 或常规列车时，应忽略补丁号更高的旧版仅 alpha 标签。
- Alpha/nightly 构建使用下一个未发布的补丁列车，并且重复构建时只递增 `alpha.N`。一旦该补丁有了 beta，新的 alpha 构建就移动到后续补丁。
- npm 版本不可变：永远不要删除、重新发布或复用已发布的标签。改为切下一个预发布编号或下一个月度补丁。
- `latest` 继续跟随当前常规/每日 npm 线；`beta` 是当前 beta 安装目标
- `extended-stable` 表示受支持的上一个月份 npm 包，从补丁号 `33` 开始；补丁号 `34` 及之后是该月度线上的维护发布
- 常规最终版和常规修正版默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或稍后提升一个已审查的 beta 构建
- 专用的每月 extended-stable 路径会以完全相同的版本发布核心 npm 包以及每个可发布到 npm 的官方插件。它不会将插件发布到 ClawHub，也不会发布 macOS 或 Windows 构件、GitHub Release、私有仓库 dist-tag、Docker 镜像、移动端构件或网站下载项。
- 每个常规最终版都会同时发布 npm 包、macOS 应用和已签名的 Windows Hub 安装器。Beta 版本通常先验证并发布 npm/package 路径，原生应用的构建/签名/公证/提升保留给常规最终版，除非明确要求。

## 发布节奏

- 发布采用 beta 优先；stable 只在最新 beta 验证通过后跟进
- 维护者通常从当前 `main` 创建 `release/YYYY.M.PATCH` 分支来切发布，这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重新创建旧标签
- 详细发布流程、审批、凭证和恢复说明仅限维护者

## 每月仅 npm extended-stable 发布

这是下面常规发布流程的专用例外。对于已完成的月份 `YYYY.M`，创建 `extended-stable/YYYY.M.33`；从同一分支发布 `vYYYY.M.33` 以及之后的维护补丁。发布标签、分支尖端、检出内容、包版本、npm 预检和 Full Release Validation 运行都必须标识同一个提交。受保护的 `main` 必须已经包含严格晚于该日历月份且补丁号低于 `33` 的最终版本；在 `main` 向前推进超过一个月后，维护补丁仍保持符合条件。

在准确的 extended-stable 分支上，将根包提升到 `YYYY.M.P`，运行 `pnpm release:prep`，并验证每个可发布的扩展包都有相同版本。提交并推送所有生成的更改，在该提交上创建并推送不可变的 `vYYYY.M.P` 标签，并记录产生的完整 SHA。工作流会消费这个已准备的树；它们不会替你提升或同步版本。

从该准确的已准备分支尖端运行 npm 预检和 Full Release Validation，然后保存两个运行 ID：

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

`release_profile=stable` 是现有的验证深度配置；它与 npm `extended-stable` dist-tag 是分开的，并且有意保持不变。

两个运行都成功后，从同一个准确的分支尖端发布每个可发布到 npm 的官方插件。补丁号 `P` 必须为 `33` 或更大。将完整发布 SHA 作为 `ref` 传入，等待完整矩阵和注册表回读，然后保存成功的 Plugin NPM Release 运行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

工作流使用常规已准备的 `all-publishable` 包清单，包括源代码未更改的包。它会在成功前验证每个准确包和每个插件 `extended-stable` 标签。如果部分运行失败，请重新运行同一命令：已经发布的包会被复用，缺失或过期的插件标签会在 npm 发布环境下协调修复，最终回读仍覆盖完整包集合。

插件工作流成功且 npm 发布环境准备就绪后，发布准确的核心预检 tarball。核心发布会验证引用的插件运行在同一个规范分支和准确源 SHA 上为 `completed/success`：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

对于有意无法满足每月 `.33` 或受保护 `main` 月份策略的 fork 或非生产演练，请在 npm 预检和发布分发中都添加 `-f bypass_extended_stable_guard=true`。默认值为 `false`。该绕过仅在 `npm_dist_tag=extended-stable` 时接受，并会记录在工作流摘要中。它不会绕过规范的 `extended-stable/YYYY.M.33` 工作流 ref、分支尖端/标签/检出相等性、最终标签语法、包/标签版本相等性、被引用运行和清单身份、tarball 来源、环境审批、注册表回读或选择器修复证据。

发布工作流会验证被引用的预检、验证和插件运行身份、已准备 tarball 摘要以及核心注册表选择器。工作流成功后，请独立确认结果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

两个命令都必须返回 `YYYY.M.P`。如果发布成功但选择器回读失败，不要重新发布不可变的包版本。使用失败工作流始终运行摘要中打印的单条 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修复命令，然后重复两个独立回读。回滚到先前选择器是单独的操作员决策，不是回读修复路径。

公共支持文档最初将 Slack、Discord 和 Codex 指定为涵盖的 extended-stable 插件表面。该列表是支持声明，而不是发布代码允许列表：每个可发布到 npm 的官方插件都遵循相同的准确版本发布路径。

下面的常规清单继续负责 beta、`latest`、GitHub Release、插件、macOS、Windows 以及其他平台发布。不要为这个仅 npm extended-stable 路径运行那些步骤。

## 常规发布操作员清单

此清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认 `main` CI 足够绿色，可以从它创建分支。
2. 根据上一个可达发布标签以来合并的 PR 和所有直接提交生成顶部 `CHANGELOG.md` 章节。保持条目面向用户，去重重叠的 PR/直接提交条目，提交、推送，并在创建分支前再次 rebase/pull。
3. 审查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍被覆盖时移除过期兼容性，或记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.PATCH`。不要直接在 `main` 上做常规发布工作。
5. 为该标签提升每个必需版本位置，然后运行 `pnpm release:prep`。它会按顺序刷新插件版本、npm shrinkwrap、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。在打标签前提交任何生成的漂移，然后运行本地确定性预检：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在前，允许使用完整 40 字符的发布分支 SHA 进行仅验证预检。预检会为准确检出的依赖图生成依赖发布证据，并将其存储在 npm 预检构件中。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。保存 `full_release_validation_run_id`；它是 `OpenClaw NPM Release` 和 `OpenClaw Release Publish` 的必填输入。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、lane、工作流作业、包配置、提供商或模型允许列表。仅当更改表面使先前证据过期时，才重新运行完整总控。
9. 对于带标签的 beta 候选版，从匹配的 `release/YYYY.M.PATCH` 分支运行 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。对于 stable，还要传入必需的 Windows 源发布：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。该辅助程序会运行本地生成发布检查，分发或验证完整发布验证和 npm 预检证据，针对准确已准备 tarball 运行 Parallels 全新/更新证明以及 Telegram 包证明，记录插件 npm 和 ClawHub 计划，并且只在证据包为绿色后打印准确的 `OpenClaw Release Publish` 命令。

   `OpenClaw Release Publish` 会将选定或所有可发布的插件包并行发布到 npm，并将同一组包并行发布到 ClawHub，然后在插件 npm 发布成功后，用匹配的 dist-tag 推送已准备好的 OpenClaw npm 预检工件。OpenClaw npm 发布子任务成功后，它会从完整匹配的 `CHANGELOG.md` 小节创建或更新对应的 GitHub release/prerelease 页面：发布到 npm `latest` 的稳定版本会成为 GitHub 最新 release，保留在 npm `beta` 上的稳定维护版本会以 GitHub `latest=false` 创建。该工作流还会将预检依赖证据、完整验证清单以及发布后 registry 验证证据上传到 GitHub release，用于发布后事件响应。它会立即打印子运行 ID，自动批准工作流 token 允许批准的发布环境门禁，用日志尾部汇总失败的子任务，在 OpenClaw npm 发布成功后立即完成 GitHub release 和依赖证据，在 OpenClaw npm 正在发布时等待 ClawHub，然后运行 `pnpm release:verify-beta`，并为 GitHub release、npm 包、选定的插件 npm 包、选定的 ClawHub 包、子工作流运行 ID，以及可选的 NPM Telegram 运行 ID 上传发布后证据。ClawHub 路径会重试临时 CLI 依赖安装失败，即使某个预览单元偶发失败也会发布通过预览的插件，并以每个预期插件版本的 registry 验证结束，使部分发布保持可见且可重试。

   然后针对已发布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的 prerelease 需要修复，请切出下一个匹配的 prerelease 编号；绝不要删除或重写旧版本。

10. 对于稳定版，只有经过审查的 beta 或 release candidate 已具备所需验证证据后，才能继续。稳定版 npm 发布也通过 `OpenClaw Release Publish` 进行，并通过 `preflight_run_id` 复用成功的预检工件。稳定版 macOS 发布就绪还要求已打包的 `.zip`、`.dmg`、`.dSYM.zip`，以及 `main` 上更新后的 `appcast.xml`；macOS 发布工作流会在发布资产验证通过后自动将已签名的 appcast 发布到公开 `main`，如果分支保护阻止直接推送，则会打开或更新一个 appcast PR。稳定版 Windows Hub 就绪要求 OpenClaw GitHub release 上存在已签名的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 和 `OpenClawCompanion-SHA256SUMS.txt` 资产。将精确签名的 `openclaw/openclaw-windows-node` release tag 作为 `windows_node_tag` 传入，并将其候选版已批准的安装器摘要映射作为 `windows_node_installer_digests` 传入；`OpenClaw Release Publish` 会保留 release 草稿，分发 `Windows Node Release`，并在发布前验证全部三个资产。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时运行可选的独立已发布 npm Telegram E2E；在需要时进行 dist-tag 推进；验证生成的 GitHub release 页面；运行发布公告步骤；然后完成 [稳定版 main 收尾](#stable-main-closeout)，之后才能判定稳定版发布完成。

## 稳定版 main 收尾

稳定版发布只有在 `main` 携带实际已发布的 release 状态后才算完成。

1. 从最新的干净 `main` 开始。对照它审计 `release/YYYY.M.PATCH`，并将 `main` 中缺失的真实修复向前移植。不要盲目把仅 release 分支上的兼容、测试或验证适配器合并到更新的 `main`。
2. 将 `main` 设置为已发布的稳定版本，而不是推测性的下一列车版本。根版本变更后运行 `pnpm release:prep`，再运行 `pnpm deps:shrinkwrap:generate`。
3. 让 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 小节与带 tag 的 release 分支完全一致。如果 mac release 发布了稳定版 `appcast.xml` 更新，也要包含该更新。
4. 在操作员明确启动该 release train 之前，不要向 `main` 添加 `YYYY.M.PATCH+1`、beta 版本，或空的未来 changelog 小节。
5. 运行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送后，在判定稳定版 release 完成前，验证 `origin/main` 包含已发布的版本和 changelog。
6. 每次私有回滚演练后，保持仓库变量 `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE` 为最新。

`OpenClaw Stable Main Closeout` 从稳定版发布后携带已发布版本、changelog 和 appcast 的 `main` 推送开始。它读取不可变的发布后证据，将已发布的 tag 绑定到其 Full Release Validation 和 Publish 运行，然后验证稳定版 main 状态、release、必需的稳定版 soak，以及阻塞性的性能证据。它会把不可变收尾清单和校验和附加到 GitHub release。自动推送触发器会跳过早于不可变发布后证据的旧版 release，并且从不将该跳过视为已完成收尾。

完整收尾需要同时具备资产和匹配的校验和。部分清单会重放其记录的 `main` SHA 和回滚演练，以重新生成相同字节，然后附加缺失的校验和；无效配对，或只有校验和但没有清单，仍会阻塞。没有回滚演练仓库变量的推送触发运行会跳过且不完成收尾；缺失或超过 90 天的演练记录仍会阻塞手动的证据支持收尾。私有恢复命令保留在仅维护者可见的运行手册中。仅使用手动分发来修复或重放有证据支持的稳定版收尾。

旧版 fallback 修正 tag 只有在修正 tag 解析到与基础稳定版 tag 相同的源提交时，才可以复用基础包证据。源不同的修正必须发布并验证其自己的包证据。

## Release preflight

- 在 release preflight 前运行 `pnpm check:test-types`，以便测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也保持覆盖。
- 在 release preflight 前运行 `pnpm check:architecture`，以便更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色。
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，以便包验证步骤所需的 `dist/*` release 工件和 Control UI bundle 存在。
- 在根版本提升后、打 tag 前运行 `pnpm release:prep`。它会运行每个在版本、配置或 API 变更后常见漂移的确定性 release 生成器：插件版本、npm shrinkwrap、插件清单、基础配置 schema、内置渠道配置元数据、配置文档 baseline、插件 SDK 导出，以及插件 SDK API baseline。`pnpm release:check` 会以检查模式重新运行这些守卫（另加插件 SDK 表面预算检查），并在运行包 release 检查前一次性报告每个生成漂移失败。
- 插件版本同步默认会将可发布的 `@openclaw/ai` 运行时包、官方插件包版本，以及现有的 `openclaw.compat.pluginApi` 下限更新为 OpenClaw release 版本。将该字段视为插件 SDK/运行时 API 下限，而不只是包版本的拷贝：对于有意保持与较旧 OpenClaw host 兼容的仅插件 release，请将下限保留为最旧支持的 host API，并在插件 release 证明中记录该选择。
- 在 release 批准前运行手动 `Full Release Validation` 工作流，从单一入口启动所有预发布测试箱。它接受分支、tag 或完整提交 SHA，分发手动 `CI`，并为安装 smoke、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram lane 分发 `OpenClaw Release Checks`。稳定版和完整运行总是包含详尽的 live/E2E 和 Docker release-path soak；`run_release_soak=true` 保留用于显式 beta soak。Package Acceptance 在候选验证期间提供标准包 Telegram E2E，避免第二个并发 live poller。

  发布 beta 后提供 `release_package_spec`，以便在 release checks、Package Acceptance 和包 Telegram E2E 中复用已发布的 npm 包，而无需重新构建 release tarball。仅在 Telegram 应使用与其余 release validation 不同的已发布包时，提供 `npm_telegram_package_spec`。当 Package Acceptance 应使用不同于 release package spec 的已发布包时，提供 `package_acceptance_package_spec`。当 release 证据报告应证明验证匹配某个已发布 npm 包、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 当你希望在 release 工作继续推进的同时，为包候选版本获取侧路证明时，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确 release 版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包受信任的 `package_ref` 分支、tag 或 SHA；使用 `source=url` 处理需要 SHA-256 且遵守严格公开 URL 策略的公开 HTTPS tarball；使用 `source=trusted-url` 处理使用必需 `trusted_source_id` 和 SHA-256 的具名受信任源策略；或使用 `source=artifact` 处理由另一个 GitHub Actions 运行上传的 tarball。

  该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E release scheduler，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当选定的 Docker lane 包含 `published-upgrade-survivor` 时，包工件就是候选，`published_upgrade_survivor_baseline` 选择已发布 baseline。`update-restart-auth` 使用候选包同时作为已安装 CLI 和 package-under-test，因此会演练候选更新命令的托管重启路径。

  示例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常见配置文件：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载 lane
  - `package`：工件原生包/更新/重启/插件 lane，不含 OpenWebUI 或 live ClawHub
  - `product`：package 配置文件，外加 MCP 渠道、cron/子智能体清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker release-path 分块
  - `custom`：为聚焦重跑精确选择 `docker_lanes`

- 当只需要 release candidate 的确定性常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、已构建工件 smoke 检查、文档检查、Python skills、Windows、macOS，以及 Control UI i18n lane。独立手动 CI 运行只有在以 `include_android=true` 分发时才运行 Android；`Full Release Validation` 会为其 CI 子任务传入该输入。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器运行 QA-lab，并验证 trace、metric 和 log 导出，以及有界 trace 属性和内容/标识符脱敏，而无需 Opik、Langfuse 或其他外部采集器。
- 验证采集器兼容性时运行 `pnpm qa:otel:collector-smoke`。它先通过真实的 OpenTelemetry Collector Docker 容器路由相同的 QA-lab OTLP 导出，再执行本地接收器断言。
- 验证受保护的 Prometheus 抓取时运行 `pnpm qa:prometheus:smoke`。它运行 QA-lab，拒绝未认证的抓取，并验证发布关键的 metric family 不包含 prompt 内容、原始标识符、认证 token 和本地路径。
- 运行 `pnpm qa:observability:smoke`，按顺序执行源码 checkout 的 OpenTelemetry 和 Prometheus smoke lanes。
- 每次标记发布前运行 `pnpm release:check`。
- `OpenClaw NPM Release` 预检会在打包 npm tarball 前生成依赖发布证据。npm advisory 漏洞门禁会阻塞发布。传递依赖清单风险、依赖所有权/安装表面以及依赖变更报告仅作为发布证据。依赖变更报告会将发布候选版本与上一个可达的发布 tag 比较。预检会将依赖证据上传为 `openclaw-release-dependency-evidence-<tag>`，并同时嵌入到准备好的 npm 预检 artifact 内的 `dependency-evidence/` 下。真实发布路径会复用该预检 artifact，然后把相同证据作为 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub release。
- tag 存在后，运行 `OpenClaw Release Publish` 执行会产生变更的发布序列。从 `release/YYYY.M.PATCH` 分支 dispatch（发布 main 可达 tag 时可从 `main`），传入 release tag、成功的 OpenClaw npm `preflight_run_id` 和成功的 `full_release_validation_run_id`，并保持默认插件发布范围 `all-publishable`，除非你明确在运行聚焦修复。该 workflow 会串行执行插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会早于其外部化插件发布。
- 稳定版 `OpenClaw Release Publish` 要求在匹配的非预发布版 `openclaw/openclaw-windows-node` release 存在后提供精确的 `windows_node_tag`，以及候选版本已批准的 `windows_node_installer_digests` map。在 dispatch 任何发布子流程前，它会验证源 release 已发布、非预发布、包含所需的 x64/ARM64 installer，并且仍与已批准的 map 匹配。随后它会在 OpenClaw release 仍为草稿时 dispatch `Windows Node Release`，并原样携带固定的 installer digest map。子 workflow 会从该精确 tag 下载已签名的 Windows Hub installer，与固定 digest 匹配，在 Windows runner 上验证其 Authenticode 签名使用预期的 OpenClaw Foundation signer，写入 SHA-256 manifest，并把 installer 和 manifest 上传到规范 OpenClaw GitHub release，然后重新下载已提升的 asset，验证 manifest 成员关系和 hash。父流程会在发布前验证当前 x64、ARM64 和 checksum asset 合约。直接恢复会先拒绝意外的 `OpenClawCompanion-*` asset 名称，再用固定源字节替换预期合约 asset。

  仅在恢复时手动 dispatch `Windows Node Release`，并且始终传入精确 tag，不要传 `latest`，同时传入来自已批准源 release 的显式 `expected_installer_digests` JSON map。网站下载链接应指向当前稳定版 release 的精确 OpenClaw release asset URL，或仅在验证 GitHub 的 latest redirect 指向同一个 release 后使用 `releases/latest/download/...`；不要只链接到 companion repo release 页面。

- 发布检查现在在单独的手动 workflow 中运行：`OpenClaw Release Checks`。它还会在发布批准前运行 QA Lab mock parity lane、快速 live Matrix profile 和 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 还使用 Convex CI 凭证租约。需要并行覆盖完整 Matrix 传输、媒体和 E2EE 清单时，运行手动 `QA-Lab - All Lanes` workflow，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。这种拆分是有意的：让真实 npm 发布路径保持短、确定且以 artifact 为中心，而较慢的 live 检查保留在自己的 lane 中，避免拖慢或阻塞发布。
- 带 secret 的发布检查应通过 `Full Release Validation` dispatch，或从 `main`/release workflow ref dispatch，以确保 workflow 逻辑和 secret 受控。
- `OpenClaw Release Checks` 接受分支、tag 或完整 commit SHA，只要解析后的 commit 可从 OpenClaw 分支或 release tag 到达。
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符 workflow 分支 commit SHA，而不要求已推送 tag。该 SHA 路径仅用于验证，不能提升为真实发布。在 SHA 模式下，该 workflow 仅为 package metadata 检查合成 `v<package.json version>`；真实发布仍要求真实 release tag。
- 两个 workflow 都会把真实发布和提升路径保留在 GitHub-hosted runner 上，而非变更型验证路径可以使用更大的 Blacksmith Linux runner。
- 该 workflow 会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secret。
- npm 发布预检不再等待单独的 release checks lane。
- 在本地标记发布候选版本前，运行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。该 helper 会按能在 GitHub 发布 workflow 启动前捕获常见审批阻断错误的顺序，运行快速发布 guardrail、插件 npm/ClawHub 发布检查、构建、UI 构建和 `release:openclaw:npm:check`。
- 批准前运行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的预发布/修正版 tag）。
- npm 发布后运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或匹配的 beta/修正版 version），以在全新的临时 prefix 中验证已发布 registry 安装路径。
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭证池，验证已安装 package 的 新手引导、Telegram 设置，以及针对已发布 npm package 的真实 Telegram E2E。本地 maintainer 的一次性操作可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 要从 maintainer 机器运行完整的发布后 beta smoke，请使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证、dispatch `NPM Telegram Beta E2E`、轮询精确 workflow run、下载 artifact，并打印 Telegram 报告。
- Maintainer 可以通过手动 `NPM Telegram Beta E2E` workflow 从 GitHub Actions 运行相同的发布后检查。它有意仅支持手动运行，不会在每次 merge 时运行。
- Maintainer 发布自动化使用预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`。
  - 真实发布必须从与成功预检 run 相同的 `main` 或 `release/YYYY.M.PATCH` 分支 dispatch（Tideclaw alpha 分支允许用于 alpha 预发布）。
  - 稳定版 npm release 默认使用 `beta`；稳定版 npm 发布可以通过 workflow input 显式指向 `latest`。
  - 基于 token 的 npm dist-tag 变更位于 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而源码 repo 保持仅 OIDC 发布。
  - 公开 `macOS Release` 仅用于验证；当 tag 只存在于 release 分支但 workflow 从 `main` dispatch 时，设置 `public_release_branch=release/YYYY.M.PATCH`。
  - 真实 macOS 发布必须通过成功的 macOS `preflight_run_id` 和 `validate_run_id`。
  - 真实发布路径会提升已准备的 artifact，而不是再次重建它们。
- 对于 `YYYY.M.PATCH-N` 这样的稳定修正版 release，发布后验证器还会检查从 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的同一临时 prefix 升级路径，确保发布修正不会悄悄让旧的全局安装停留在基础稳定版 payload 上。
- 除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，否则 npm 发布预检会 fail closed，这样我们不会再次发布空的浏览器 dashboard。
- 发布后验证还会检查已发布插件入口点和 package metadata 是否存在于已安装 registry 布局中。缺少插件运行时 payload 的 release 会导致 postpublish verifier 失败，且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此 installer e2e 会在发布路径前捕获意外的 pack 膨胀。
- 如果发布工作触及 CI 规划、扩展 timing manifest 或扩展测试 matrix，请在批准前从 `.github/workflows/plugin-prerelease.yml` 重新生成并审查 planner 拥有的 `plugin-prerelease-extension-shard` matrix 输出，确保发布说明不会描述过期的 CI 布局。
- 稳定版 macOS 发布就绪还包括 updater 表面：GitHub release 最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`；发布后 `main` 上的 `appcast.xml` 必须指向新的稳定版 zip（macOS 发布 workflow 会自动提交它，或在直接 push 被阻止时打开 appcast PR）；打包后的 app 必须保持非 debug bundle id、非空 Sparkle feed URL，以及达到或高于该 release version 规范 Sparkle build floor 的 `CFBundleVersion`。

## 发布测试机器

`Full Release Validation` 是 operator 从单一入口启动所有预发布测试的方式。对于快速变化分支上的固定 commit proof，请使用 helper，让每个子 workflow 都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支 dispatch `Full Release Validation` 并设置 `ref=<sha>`，验证每个子 workflow 的 `headSha` 与目标匹配，然后删除临时分支。这样可以避免意外证明较新的 `main` 子 run。

对于 release 分支或 tag 验证，请从受信任的 `main` workflow ref 运行，并将 release 分支或 tag 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

该工作流解析目标 ref，分发手动 `CI` 并设置 `target_ref=<release-ref>`，然后分发 `OpenClaw Release Checks`。`OpenClaw Release Checks` 会扇出安装冒烟、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、包含规范 Telegram 包 E2E 的 Package Acceptance、QA Lab 一致性、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 均成功时，full/all 运行才可接受，除非聚焦重跑有意跳过了单独的 `Plugin Prerelease` 子项。仅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 进行聚焦的已发布包重跑时，才使用独立的 `npm-telegram` 子项。最终验证器摘要会为每个子运行包含最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。

参见[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确工作流作业名称、stable 与 full 配置差异、工件以及聚焦重跑句柄。

子工作流从运行 `Full Release Validation` 的受信任 ref 分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择受信任的 harness。不要使用 `--ref main -f ref=<sha>` 对移动中的 `main` 做精确提交证明；原始 commit SHA 不能作为工作流分发 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的 advisory 提供商/媒体覆盖

Stable 和 full 验证在推广前始终运行详尽的 live/E2E、Docker 发布路径以及有界的已发布升级幸存者扫测。使用 `run_release_soak=true` 为 beta 请求同一轮扫测。该扫测覆盖最新四个 stable 包，以及固定的 `2026.4.23` 和 `2026.5.2` 基线，再加上较旧的 `2026.4.15` 覆盖；会移除重复基线，并将每个基线分片到各自的 Docker runner 作业中。

`OpenClaw Release Checks` 使用受信任工作流 ref 将目标 ref 一次性解析为 `release-package-under-test`，并在 soak 运行时于跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该工件。这会让所有面向包的环境都使用相同字节，并避免重复构建包。beta 已经发布到 npm 后，设置 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，这样发布检查会下载一次已发布包，从 `dist/build-info.json` 提取其构建源 SHA，并为跨 OS、Package Acceptance、发布路径 Docker 和包 Telegram 线路复用该工件。

跨 OS OpenAI 安装冒烟在设置了 repo/org 变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因为这条线路证明的是包安装、新手引导、Gateway 网关启动和一次 live agent 轮次，而不是对最慢默认模型做基准测试。更广泛的 live 提供商矩阵仍然是模型特定覆盖的位置。

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

不要把完整 umbrella 作为聚焦修复后的首次重跑。如果一个环境失败，下一次证明应使用失败的子工作流、作业、Docker 线路、包 profile、模型提供商或 QA 线路。只有当修复更改了共享发布编排，或使先前所有环境证据过期时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查记录的子工作流运行 ID，因此子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传给 umbrella。`all` 是真正的候选发布运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布使用的插件子项，`release-checks` 运行每个发布环境，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；full/all 运行使用 Package Acceptance 内的规范包 Telegram E2E。聚焦跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/套件过滤器。QA 发布检查失败会阻塞普通发布验证，包括标准层中必需的 OpenClaw 动态工具漂移。Tideclaw alpha 运行仍可将非包安全发布检查线路视为 advisory。当 `live_suite_filter` 明确请求受门控的 QA live 线路（例如 Discord、WhatsApp 或 Slack）时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 变量；否则输入捕获会失败，而不是静默跳过该线路。

### Vitest

Vitest 验证框是手动 `CI` 子工作流。手动 CI 会有意绕过 changed 作用域，并强制候选发布运行普通测试图：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建工件冒烟检查、文档检查、Python skills、Windows、macOS 和 Control UI i18n。Android 会在 `Full Release Validation` 运行该验证框时包含，因为 umbrella 会传入 `include_android=true`；独立手动 CI 需要 `include_android=true` 才能覆盖 Android。

使用此验证框回答“源代码树是否通过了完整普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色的 `CI` 运行
- 调查回归时来自 CI 作业的失败或慢速分片名称
- 当运行需要性能分析时的 Vitest 计时工件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或包验证框时，才直接运行手动 CI。非 Android 直接 CI 使用第一条命令。当直接候选发布 CI 必须覆盖 Android 时，添加 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 验证框位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流运行。它通过打包后的 Docker 环境验证候选发布，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，其中 QR、root/gateway 和 installer/Bun 冒烟作业作为单独的 install-smoke 分片运行
- 仓库 E2E 线路
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`
- 请求时在 `plugins-runtime-services` 分块内覆盖 OpenWebUI
- 拆分的内置插件安装/卸载线路 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live 套件时的 live/E2E 提供商套件和 Docker live 模型覆盖

重跑前先使用 Docker 工件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含线路日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败线路可以复用同一 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 验证框也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- mock parity 线路，使用 agentic parity 包将 OpenAI 候选线路与 `anthropic/claude-opus-4-8` 基线进行比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭证租约的 live Telegram QA 线路
- 当发布遥测需要显式本地证明时，运行 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此验证框回答“发布在 QA 场景和 live 渠道流中是否表现正确？”批准发布时保留 parity、Matrix 和 Telegram 线路的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键线路。

### 包

包验证框是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为 Docker E2E 消费的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流 harness ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整 commit SHA
- `source=url`：下载公共 HTTPS `.tgz`，并要求提供 `package_sha256`；会拒绝 URL 凭证、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析地址，以及不安全重定向
- `source=trusted-url`：从 `.github/package-trusted-sources.json` 中命名策略下载 HTTPS `.tgz`，并要求提供 `package_sha256` 和 `trusted_source_id`；将其用于维护者拥有的企业镜像或私有包仓库，而不是向 `source=url` 添加输入级私有网络绕过
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 运行带有 `source=artifact`、已准备好的发布包制品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 的 Package Acceptance。Package Acceptance 会针对同一个已解析的 tarball 保持迁移、更新、root-managed VPS 升级、已配置凭证的更新重启、实时 ClawHub skill 安装、过期插件依赖清理、离线插件夹具、插件更新、插件命令绑定转义加固，以及 Telegram 包 QA。阻塞性发布检查使用默认的最新已发布包基线；带有 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 配置会将 published-upgrade-survivor 扫描扩展到 `last-stable-4`，再加上固定的 `2026.4.23`、`2026.5.2` 和 `2026.4.15` 基线，并包含 `reported-issues` 场景。对已经发布的候选版本使用带有 `source=npm` 的 Package Acceptance；对发布前由 SHA 支持的本地 npm tarball 使用 `source=ref`；对维护者拥有的企业/私有镜像使用 `source=trusted-url`；对由另一个 GitHub Actions 运行上传的已准备 tarball 使用 `source=artifact`。

它是 GitHub 原生替代方案，可取代过去大多数需要 Parallels 的包/更新覆盖。跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或发布检查通道能证明插件安装/更新、Doctor 清理或已发布包迁移变更时，请使用它。从每个稳定版 `2026.4.23+` 包进行的详尽已发布更新迁移，是单独的手动 `Update Migration` workflow，不属于 Full Release CI。

旧版 package-acceptance 宽松策略有意设置了时间限制。到 `2026.4.25` 为止的包可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少 `gateway install --wrapper`、tarball 派生 git 夹具中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可以对已经发布的本地构建元数据戳文件发出警告。之后的包必须满足现代包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装的包时，使用更广的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包配置：

- `smoke`：快速包安装/频道/智能体、Gateway 网关网络和配置重载通道
- `package`：安装/更新/重启/插件包契约，加上实时 ClawHub skill 安装证明；这是发布检查默认值
- `product`：`package` 加上 MCP 频道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选版本的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该 workflow 会把已解析的 `package-under-test` tarball 传入 Telegram 通道；独立的 Telegram workflow 仍接受已发布的 npm spec，用于发布后检查。

## 常规发布发布自动化

对于 beta、`latest`、插件、GitHub Release 和平台发布，`OpenClaw Release Publish` 是常规的变更入口点。每月 `.33+` npm-only extended-stable 路径不使用此编排器。常规 workflow 会按发布所需顺序编排 trusted-publisher workflow：

1. 检出发布标签并解析其 commit SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达（alpha 预发布则可从 Tideclaw alpha 分支到达）。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 调度 `Plugin ClawHub Release`。
6. 在验证已保存的 `full_release_validation_run_id` 后，使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。
7. 对于稳定版发布，将 GitHub release 创建或更新为草稿，使用显式 `windows_node_tag` 和候选版本已批准的 `windows_node_installer_digests` 调度 `Windows Node Release`，并在发布草稿前验证规范安装器/checksum 资产。

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

仅在聚焦修复或重新发布工作中使用较低层级的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflow。当 `publish_openclaw_npm=true` 时，`OpenClaw Release Publish` 会拒绝 `plugin_publish_scope=selected`，这样核心包就不能在未发布每个可发布官方插件（包括 `@openclaw/diffs-language-pack`）的情况下发出。对于选定插件修复，请设置 `publish_openclaw_npm=false`，并使用 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或直接调度子 workflow。

## NPM workflow 输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符 workflow 分支 commit SHA，用于仅验证 preflight
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：现有成功 preflight 运行 ID；真实发布路径必需，这样 workflow 会复用已准备的 tarball，而不是重新构建
- `full_release_validation_run_id`：此标签/SHA 的成功 `Full Release Validation` 运行 ID；真实发布必需。Beta 发布可以仅基于 preflight 继续并发出警告，但稳定版/`latest` 提升仍然需要它。
- `release_publish_run_id`：已批准的 `OpenClaw Release Publish` 运行 ID；当此 workflow 由该父级调度时必需（bot-actor 真实发布调用）
- `plugin_npm_run_id`：成功的 exact-head `Plugin NPM Release` 运行 ID；真实 `extended-stable` 核心发布必需
- `npm_dist_tag`：发布路径的 npm 目标标签；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，默认值为 `beta`。最终补丁 `33` 及之后必须使用 `extended-stable`；默认情况下，`extended-stable` 会拒绝更早的补丁，并且总是拒绝非最终标签。
- `bypass_extended_stable_guard`：仅测试用布尔值，默认 `false`；当 `npm_dist_tag=extended-stable` 时，绕过每月 extended-stable 资格检查，同时保留发布身份、制品、审批和回读检查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 以使用现有发布行为，或接受 `npm_dist_tag=extended-stable` 以使用受保护的每月路径。extended-stable 选项要求 `publish_scope=all-publishable`、空的 `plugins` 输入、最终补丁大于等于 `33`，以及位于精确 tip 的规范 `extended-stable/YYYY.M.33` 分支。它绝不会移动插件 `latest` 或 `beta`。新包版本会通过 OIDC trusted publication（`npm publish --tag extended-stable`）原子地获得 `extended-stable`；此源 workflow 不使用基于 token 认证的 `npm dist-tag add`。重试会跳过 npm 中已存在的精确版本，然后除非完整回读确认每个精确包和 `extended-stable` 标签已收敛，否则会失败关闭。

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight 运行 ID；当 `publish_openclaw_npm=true` 时必需
- `full_release_validation_run_id`：成功的 `Full Release Validation` 运行 ID；当 `publish_openclaw_npm=true` 时必需
- `windows_node_tag`：精确的非预发布 `openclaw/openclaw-windows-node` 发布标签；稳定版 OpenClaw 发布必需
- `windows_node_installer_digests`：候选版本已批准的紧凑 JSON 映射，将当前 Windows 安装器名称映射到其固定 `sha256:` 摘要；稳定版 OpenClaw 发布必需
- `npm_telegram_run_id`：可选的成功 `NPM Telegram Beta E2E` 运行 ID，用于包含在最终发布证据中
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签，值为 `alpha`、`beta` 或 `latest` 之一
- `plugin_publish_scope`：默认值为 `all-publishable`；仅在使用 `publish_openclaw_npm=false` 进行聚焦的仅插件修复工作时使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认值为 `true`；仅当把该 workflow 用作仅插件修复编排器时设置为 `false`
- `release_profile`：用于发布证据摘要的发布覆盖配置；默认值为 `from-validation`，它会从验证清单读取，也可用 `beta`、`stable` 或 `full` 覆盖
- `wait_for_clawhub`：默认值为 `false`，这样 npm 可用性不会被 ClawHub sidecar 阻塞；仅当 workflow 完成必须包含 ClawHub 完成时设置为 `true`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整 commit SHA。带 secret 的检查要求已解析 commit 可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：选择加入用于 beta 发布检查的详尽实时/E2E、Docker 发布路径和 all-since upgrade-survivor soak。它会被 `release_profile=stable` 和 `release_profile=full` 强制启用。

规则：

- 补丁版本低于 `33` 的常规最终版本和修正版可以发布到 `beta` 或 `latest`。补丁版本为 `33` 或更高的最终版本必须发布到 `extended-stable`，并且该边界上的修正后缀版本会被拒绝。
- Beta 预发布标签只能发布到 `beta`；alpha 预发布标签只能发布到 `alpha`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续之前验证该元数据

## 常规 beta/latest 稳定版发布序列

这个旧版序列用于常规编排发布，它还负责插件、GitHub Release、Windows 和其他平台工作。它不是本页顶部记录的每月 `.33+` 仅 npm 的 extended-stable 路径。

切常规编排稳定版发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，你可以使用当前完整工作流分支的提交 SHA，对预检工作流进行仅验证的试运行。
2. 对普通的 beta 优先流程选择 `npm_dist_tag=beta`，或者仅在你有意直接发布稳定版时选择 `latest`。
3. 当你希望通过一个手动工作流获得普通 CI 以及实时 prompt 缓存、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`。如果你有意只需要确定性的普通测试图，请改为在发布引用上运行手动 `CI` 工作流。
4. 选择准确的非预发布 `openclaw/openclaw-windows-node` 发布标签，其签名 x64 和 ARM64 安装程序应随发布交付。将其保存为 `windows_node_tag`，并将它们经过验证的摘要映射保存为 `windows_node_installer_digests`。发布候选辅助工具会记录两者，并将它们包含在生成的发布命令中。
5. 保存成功的 `preflight_run_id` 和 `full_release_validation_run_id`。
6. 使用相同的 `tag`、相同的 `npm_dist_tag`、选定的 `windows_node_tag`、其已保存的 `windows_node_installer_digests`、已保存的 `preflight_run_id` 和已保存的 `full_release_validation_run_id` 运行 `OpenClaw Release Publish`。它会先将外部化插件发布到 npm 和 ClawHub，然后再提升 OpenClaw npm 包。
7. 如果发布落在 `beta` 上，请使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，将该稳定版本从 `beta` 提升到 `latest`。
8. 如果发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个稳定构建，请使用同一个发布工作流将两个 dist-tag 都指向该稳定版本，或者让其计划的自修复同步稍后移动 `beta`。

dist-tag 变更位于发布账本仓库中，因为它仍然需要 `NPM_TOKEN`，而源仓库保持仅 OIDC 发布。这样可以让直接发布路径和 beta 优先提升路径都被记录，并且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请只在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要从主 Agent shell 直接调用 `op`；将其保留在 tmux 内，可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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

- [发布频道](/zh-CN/install/development-channels)
