---
read_when:
    - 正在查找公开发布渠道的定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-07-14T13:54:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 09620a4ba58eb218b0b827a88bd91349bf3b9a6cb2d76fd0c8f0636153809db7
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前提供三个面向用户的更新渠道：

- stable：现有的已推广发布渠道，在独立的 CLI/渠道里程碑完成之前，仍通过 npm `latest` 解析
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的动态最新提交

此外，发布操作员可以将上一个已结束月份的核心
软件包发布到 npm `extended-stable`，从补丁 `33` 开始。当月的
常规正式版本线继续使用 npm `latest`；这种操作员侧的发布
拆分本身不会更改 CLI 更新渠道的解析方式。

Tideclaw alpha 构建是独立的内部预发布轨道（npm dist-tag `alpha`），详见 [NPM 工作流输入](#npm-workflow-inputs)和[发布测试机](#release-test-boxes)。

## 版本命名

- 每月 npm 扩展稳定版发布版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 标签为 `vYYYY.M.PATCH`
- 每日/常规正式发布版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 标签为 `vYYYY.M.PATCH`
- 常规回退修正发布版本：`YYYY.M.PATCH-N`，git 标签为 `vYYYY.M.PATCH-N`
- Beta 预发布版本：`YYYY.M.PATCH-beta.N`，git 标签为 `vYYYY.M.PATCH-beta.N`
- Alpha 预发布版本：`YYYY.M.PATCH-alpha.N`，git 标签为 `vYYYY.M.PATCH-alpha.N`
- 月份或补丁号绝不能补零
- `PATCH` 是按顺序递增的每月发布列车编号，而不是日历日期。常规正式版和 beta 版会推进当前发布列车；仅 alpha 标签绝不会占用或推进 beta/常规补丁号，因此在选择 beta 或常规发布列车时，应忽略补丁号更高的旧版仅 alpha 标签。
- Alpha/每夜构建使用下一个尚未发布的补丁发布列车，重复构建时仅递增 `alpha.N`。该补丁发布 beta 版后，新的 alpha 构建将转移到下一个补丁。
- npm 版本不可变：绝不能删除、重新发布或复用已发布的标签。应改为发布下一个预发布编号或下一个每月补丁。
- `latest` 继续跟随当前常规/每日 npm 版本线；`beta` 是当前 beta 安装目标
- `extended-stable` 表示受支持的上一个月份 npm 软件包，从补丁 `33` 开始；补丁 `34` 及更高版本是该每月版本线上的维护版本
- 常规正式版和常规修正版默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，也可以稍后推广经过审核的 beta 构建
- 专用的每月扩展稳定版路径会以完全相同的版本发布核心 npm 软件包和所有可发布到 npm 的官方插件。它不会将插件发布到 ClawHub，也不会发布 macOS 或 Windows 工件、GitHub Release、私有仓库 dist-tag、Docker 镜像、移动端工件或网站下载内容。
- 每个常规正式版本都会同时发布 npm 软件包、macOS 应用、已签名的独立 Android APK，以及已签名的 Windows Hub 安装程序。Beta 版本通常会先验证并发布 npm/软件包路径；原生应用的构建、签名、公证和推广则保留给常规正式版本，除非明确要求执行。

## 发布节奏

- 发布先推出 beta；只有在最新 beta 通过验证后才推出 stable
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.PATCH` 分支发布版本，使发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已推送或发布但需要修复，维护者会发布下一个 `-beta.N` 标签，而不是删除或重新创建旧标签
- 详细的发布流程、审批、凭据和恢复说明仅供维护者使用

## 仅发布到 npm 的每月扩展稳定版

这是下方常规发布流程的专用例外。对于已结束的月份
`YYYY.M`，创建 `extended-stable/YYYY.M.33`；从同一分支发布
`vYYYY.M.33` 及更高版本的维护补丁。发布
标签、分支顶端、检出内容、软件包版本、npm 预检和 Full Release
Validation 运行必须全部指向同一个提交。受保护的 `main` 必须
已包含补丁号低于
`33`、且日历月份严格更晚的正式版本；当 `main` 推进超过一个
月后，维护补丁仍然符合条件。

在准确的扩展稳定版分支上，将根软件包升级到 `YYYY.M.P`，运行
`pnpm release:prep`，并验证每个可发布扩展软件包的
版本完全相同。提交并推送所有生成的更改，在该提交上创建并推送
不可变的 `vYYYY.M.P` 标签，并记录生成的完整 SHA。
工作流会使用这棵准备好的工作树；它们不会替你升级或同步
版本。

从这一个准确准备好的分支顶端运行 npm 预检和 Full Release Validation，
然后保存两个运行 ID 以及成功的 Full Release Validation
运行尝试次数：

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

`release_profile=stable` 是现有的验证深度配置；它与
npm `extended-stable` dist-tag 相互独立，并且有意
保持不变。

两个运行成功后，从同一个准确的分支顶端发布所有可发布到 npm 的
官方插件。补丁 `P` 必须为 `33` 或更高版本。将完整发布
SHA 作为 `ref` 传入，等待完整矩阵和注册表回读完成，然后保存
成功的 Plugin NPM Release 运行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

该工作流使用常规准备好的 `all-publishable` 软件包清单，
其中包括源代码未发生变化的软件包。它会验证每个准确的软件包
和每个插件的 `extended-stable` 标签，之后才会成功。如果部分运行
失败，请重新运行同一命令：已发布的软件包会被复用，缺失
或陈旧的插件标签会在 npm 发布环境中完成协调，
最终回读仍会覆盖完整的软件包集合。

插件工作流成功且 npm 发布环境准备就绪后，
发布预检生成的准确核心 tarball。核心发布会验证所引用的
插件运行在同一个规范分支和准确的源 SHA 上为 `completed/success`：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

对于有意无法满足每月 `.33` 或受保护
`main` 月份策略的 fork 或非生产演练，请在 npm 预检和发布
调度中都添加 `-f bypass_extended_stable_guard=true`。
默认值为 `false`。只有同时提供
`npm_dist_tag=extended-stable` 时才接受绕过，并会将其记录在工作流摘要中。它
不会绕过规范的 `extended-stable/YYYY.M.33` 工作流引用、
分支顶端/标签/检出内容一致性、正式标签语法、软件包/标签版本
一致性、所引用运行和清单的身份一致性、tarball 来源、
环境审批、注册表回读或选择器修复证据。

发布工作流会验证所引用的预检、验证和插件
运行身份、准备好的 tarball 摘要以及核心注册表选择器。
工作流成功后，还需独立确认结果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

两个命令都必须返回 `YYYY.M.P`。如果发布成功但选择器
回读失败，请勿重新发布不可变的软件包版本。使用失败工作流
始终运行的摘要中打印的唯一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修复命令，
然后重新执行两项独立回读。回滚到先前的选择器属于另一项操作员
决策，而不是回读修复路径。

公共支持文档最初将 Slack、Discord 和 Codex 指定为
扩展稳定版覆盖的插件表面。该列表是支持声明，而不是
发布代码允许列表：所有可发布到 npm 的官方插件都遵循
相同的精确版本发布路径。

下方常规检查清单继续负责 beta、`latest`、GitHub Release、
插件、macOS、Windows 及其他平台的发布。不要为这个
仅发布到 npm 的扩展稳定版路径运行这些步骤。

## 常规发布操作员检查清单

此检查清单展示发布流程的公开形式。私有凭据、签名、公证、dist-tag 恢复和紧急回滚详情保留在仅供维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认 `main` CI 的状态足以从中创建分支。
2. 从该提交创建 `release/YYYY.M.PATCH`。回移植是可选的；仅应用操作员选定的集合。升级每个必需的版本位置，运行 `pnpm release:prep`，完成发布修复和必需的前向移植，并审查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts`。
3. 将产品完备且尚未更新变更日志的提交冻结为 **Code SHA**。运行确定性的源代码预检，然后使用 `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`。这样会固定可信工作流工具，同时让完整的 Vitest、Docker、QA、软件包和性能矩阵针对准确的 Code SHA 运行。
4. 编辑前先对失败进行分类。产品/代码失败会生成新的 Code SHA，并要求该 SHA 通过完整验证。工作流、测试框架、凭据、审批或基础设施失败，应在其所属表面修复，并针对同一个 Code SHA 重新运行。
5. 只有在 Code SHA 通过验证后，才能根据自上一个可达的已发布标签以来合并的 PR 和直接提交，生成顶部的 `CHANGELOG.md` 部分。条目应面向用户并去除重复项。当分叉的已发布标签或后续前向移植重新关联已经发布的 PR 时，通过 `--shipped-ref` 明确传入该标签。
6. 仅提交 `CHANGELOG.md`。此提交即为 **Release SHA**。从 Code SHA 到 Release SHA 的完整差异必须恰好为 `CHANGELOG.md`；任何其他发生变化的路径都会使发布返回第 2 步。
7. 为 Release SHA 运行固定 SHA 且启用证据复用的 Full Release Validation。轻量级父运行必须记录 `changelog-only-release-v1`、指向已通过验证的 Code SHA，并且不调度任何产品子通道。此操作复用产品证据，但不会复用软件包字节。
8. 针对 Release SHA/标签运行带有 `preflight_only=true` 的 `OpenClaw NPM Release`。保存成功的 `preflight_run_id`。这会构建并检查包含最终变更日志的准确软件包字节。
9. 为 Release SHA 添加标签，然后使用成功的 Release-SHA 验证父运行和 npm 预检运行来执行候选版本辅助程序，而不是再次调度其中任何一个：

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   对于稳定版，还需传入 `--windows-node-tag vX.Y.Z`。该辅助工具会验证发布说明来源、npm 预检字节、Parallels 安装/更新证明、Telegram 软件包证明以及插件发布计划，然后输出发布命令。

   `OpenClaw Release Publish` 会将选定的或所有可发布的插件软件包并行分发到 npm，并将同一组软件包分发到 ClawHub；插件成功发布到 npm 后，再使用匹配的 dist-tag 推送准备好的 OpenClaw npm 预检工件。发布检出目录仍作为产品/数据根目录，而规划和最终验证则从完全一致且受信任的工作流源检出目录执行，因此较旧的发布提交无法悄然使用过时的发布工具。在任何发布子任务启动前，它会渲染并缓存完整的 GitHub 发布正文。当完整匹配的 `CHANGELOG.md` 章节符合 GitHub 的 125,000 字符限制和渲染器匹配的 125,000 字节安全上限时，页面会包含该完整的 `## YYYY.M.PATCH` 章节及其标题。当源章节超出限制时，页面会保留完整的分组编辑说明，并将过大的贡献记录替换为指向标签固定的 `CHANGELOG.md` 中完整记录的稳定链接；绝不会发布不完整的记录或截断的项目符号。工作流会先选择完整或精简正文，再添加 `### Release verification`；如果证明尾部会导致超出限制，它会保留规范正文，改为依赖所附的不可变证据。发布到 npm `latest` 的稳定版会成为 GitHub 上的最新发布，而在 npm 上保留为 `beta` 的稳定维护版本则通过 GitHub `latest=false` 创建。该工作流还会将预检依赖项证据、完整验证清单和发布后注册表验证证据上传到 GitHub 发布，以用于发布后的事件响应。它会立即输出子任务运行 ID，自动批准工作流令牌有权批准的发布环境门禁，使用日志尾部汇总失败的子任务作业，预先创建 GitHub 发布草稿页面，并在 OpenClaw 发布到 npm 的同时并发推送 Windows 和 Android 资产；这些阶段成功后，它会完成发布页面和依赖项证据，在发布 OpenClaw npm 时等待 ClawHub 完成，然后运行受信任主分支上的 beta 验证器，并上传 GitHub 发布、npm 软件包、选定的插件 npm 软件包、选定的 ClawHub 软件包、子工作流运行 ID 以及可选 NPM Telegram 运行 ID 的发布后证据。ClawHub 引导验证器要求完全一致且受信任的主分支工作流路径和 SHA、生产者和终止运行尝试、发布 SHA、请求的软件包集合、不可变的软件包工件元组以及终止注册表回读工件；不接受成功的旧版发布引用运行。

   然后针对已发布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 软件包运行发布后软件包验收。如果已推送或已发布的预发布版本需要修复，请发布下一个匹配的预发布编号；绝不要删除或重写旧版本。

10. 发布尝试失败时，请保持发布 SHA 不变，除非该失败证明产品或更新日志存在缺陷。继续使用已成功且不可变的子任务和工件；绝不要重新构建或重新发布已经成功的软件包版本。
11. 对于稳定版，只有经过审核的 beta 或候选发布版本具备所需的验证证据后才能继续。稳定版 npm 发布也通过 `OpenClaw Release Publish` 进行，并通过 `preflight_run_id` 复用成功的预检工件。稳定版 macOS 发布就绪还要求 `main` 上已打包的 `.zip`、`.dmg`、`.dSYM.zip` 以及已更新的 `appcast.xml`；macOS 发布工作流会在发布资产验证通过后，自动将已签名的 appcast 发布到公共 `main`，如果分支保护阻止直接推送，则创建或更新 appcast PR。稳定版 Windows Hub 就绪要求 OpenClaw GitHub 发布中包含已签名的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 和 `OpenClawCompanion-SHA256SUMS.txt` 资产。将准确的已签名 `openclaw/openclaw-windows-node` 发布标签作为 `windows_node_tag` 传入，并将经候选版本批准的安装程序摘要映射作为 `windows_node_installer_digests` 传入；`OpenClaw Release Publish` 会保留发布草稿、分发 `Windows Node Release`，并在发布前验证全部三个资产。
12. 发布后，运行 npm 发布后验证器；需要发布后渠道证明时，运行可选的独立已发布 npm Telegram E2E；在需要时推送 dist-tag；验证生成的 GitHub 发布页面；执行发布公告步骤；然后完成[稳定版主分支收尾](#stable-main-closeout)，之后才能宣布稳定版发布完成。

## 稳定版主分支收尾

只有当 `main` 包含实际已发布的发布状态时，稳定版发布才算完成。

1. 从最新的 `main` 开始。以它为基准审核 `release/YYYY.M.PATCH`，并将 `main` 中缺失的实际修复向前移植。不要盲目地将仅适用于发布的兼容性适配器、测试适配器或验证适配器合并到较新的 `main` 中。
2. 对于常规路径，将 `main` 设置为已发布的稳定版本。延迟收尾时，如果 `main` 已推进到更晚的稳定 OpenClaw CalVer，则可以使用它；不要仅为了完成上一个版本的收尾而降级已经启动的发布序列。验证器仍要求准确的已发布更新日志章节和 appcast 条目，并记录实际的 `main` 版本和 SHA。根版本发生任何更改后，先运行 `pnpm release:prep`，再运行 `pnpm deps:shrinkwrap:generate`。
3. 确保 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 章节与已标记的发布分支完全一致。如果 Mac 发布包含稳定版 `appcast.xml` 更新，也应将其纳入。
4. 在操作员明确启动该发布序列之前，不要向 `main` 添加 `YYYY.M.PATCH+1`、beta 版本或空的未来更新日志章节。
5. 运行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送后，验证 `origin/main` 包含已发布的版本和更新日志，然后才能宣布稳定版发布完成。
6. 每次执行私有回滚演练后，确保仓库变量 `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE` 保持最新。

`OpenClaw Stable Main Closeout` 从稳定版发布后包含已发布版本、更新日志和 appcast 的 `main` 推送开始。它读取不可变的发布后证据，将已发布标签绑定到其完整发布验证和发布运行，然后验证稳定版主分支状态、发布、强制稳定版浸泡测试以及阻塞性性能证据。它会将不可变的收尾清单和校验和附加到 GitHub 发布。自动推送触发器会跳过早于不可变发布后证据的旧版发布，并且绝不会将该跳过视为已完成收尾。

完整收尾需要同时具备两个资产和匹配的校验和。不完整的清单会重放其记录的 `main` SHA 和回滚演练，以重新生成完全相同的字节，然后附加缺失的校验和；无效的配对或只有校验和而没有清单的情况仍会阻塞。缺少回滚演练仓库变量的推送触发运行会跳过且不会完成收尾；缺失或超过 90 天的演练记录仍会阻塞手动的证据支持收尾。私有恢复命令保留在仅限维护者的运行手册中。仅使用手动分发来修复或重放有证据支持的稳定版收尾。

如果发布父任务仅在附加不可变的 npm/插件证据后失败，请先修复并发布所有稳定版平台资产。然后维护者可以使用 `allow_failed_publish_recovery=true` 手动分发收尾；该模式仅接受已完成但失败的父任务，并且除常规 macOS/appcast 检查外，还要求完全一致的 Android 和 Windows 资产契约、GitHub SHA-256 摘要、校验和验证、Android 来源证明，以及由父任务分发且成功的 Windows 推送，其 Authenticode 检查和经候选版本批准的摘要必须与已发布的安装程序匹配。自动推送收尾绝不会启用此恢复模式。

仅当修正标签与基础稳定版标签解析到相同源提交时，旧版回退修正标签才能复用基础软件包证据。其 Android 发布会复用基础标签已验证的 APK，并为修正标签添加来源证明。源代码不同的修正版本必须发布并验证自己的软件包证据，并使用更高的 Android `versionCode`。

## 发布预检

- 在发布预检之前运行 `pnpm check:test-types`，以便测试 TypeScript 在速度更快的本地 `pnpm check` 门禁之外仍得到覆盖。
- 在发布预检之前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在速度更快的本地门禁之外通过。
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布工件和 Control UI 捆绑包已存在。
- 在提升根版本后、创建标签前运行 `pnpm release:prep`。它会运行每个在版本/配置/API 更改后通常发生漂移的确定性发布生成器：插件版本、npm shrinkwrap、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出以及插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些防护措施（外加插件 SDK 表面预算检查），在运行软件包发布检查前，一次性报告所有生成内容漂移失败。
- 默认情况下，插件版本同步会将可发布的 `@openclaw/ai` 运行时软件包、官方插件软件包版本和现有 `openclaw.compat.pluginApi` 下限更新为 OpenClaw 发布版本。应将该字段视为插件 SDK/运行时 API 下限，而不仅仅是软件包版本的副本：对于有意保持与较旧 OpenClaw 主机兼容的仅插件发布，请将下限保持为支持的最旧主机 API，并在插件发布证明中记录该选择。
- 在发布批准之前运行手动 `Full Release Validation` 工作流，以从单个入口点启动所有预发布测试环境。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks` 以执行安装冒烟测试、软件包验收、跨操作系统软件包检查、QA Lab 一致性、Matrix 和 Telegram 测试通道。稳定版和完整运行始终包含全面的实时/E2E 测试和 Docker 发布路径浸泡测试；`run_release_soak=true` 保留用于明确的 beta 浸泡测试。软件包验收在候选版本验证期间提供规范的软件包 Telegram E2E，从而避免第二个并发的实时轮询器。

  发布 beta 后提供 `release_package_spec`，以便在发布检查、软件包验收和软件包 Telegram E2E 中复用已发布的 npm 软件包，而无需重新构建发布 tarball。仅当 Telegram 应使用不同于其余发布验证的软件包时，才提供 `npm_telegram_package_spec`。当软件包验收应使用不同于发布软件包规范的已发布软件包时，提供 `package_acceptance_package_spec`。当发布证据报告应证明验证与已发布 npm 软件包匹配，但不强制执行 Telegram E2E 时，提供 `evidence_package_spec`。

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- 当你希望在发布工作继续进行的同时，为软件包候选版本提供旁路证明时，请运行手动 `Package Acceptance` 工作流。使用 `source=npm` 指定 `openclaw@beta`、`openclaw@latest` 或确切的发布版本；使用 `source=ref`，通过当前 `workflow_ref` 测试框架打包受信任的 `package_ref` 分支/标签/SHA；使用 `source=url` 指定具有必需 SHA-256 且遵循严格公共 URL 策略的公共 HTTPS tarball；使用 `source=trusted-url` 指定命名的受信任来源策略，并提供必需的 `trusted_source_id` 和 SHA-256；或使用 `source=artifact` 指定由另一个 GitHub Actions 运行上传的 tarball。

  该工作流将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当所选 Docker 通道包含 `published-upgrade-survivor` 时，软件包工件是候选版本，而 `published_upgrade_survivor_baseline` 用于选择已发布的基线。`update-restart-auth` 将候选软件包同时用作已安装的 CLI 和待测试软件包，从而测试候选版本更新命令的托管重启路径。

  示例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：不包含 OpenWebUI 或实时 ClawHub 的工件原生软件包/更新/重启/插件通道
  - `product`：软件包配置，另加 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 发布路径分块
  - `custom`：为聚焦重新运行精确选择 `docker_lanes`

- 仅需要为发布候选版本提供确定性的常规 CI 覆盖时，请直接运行手动 `CI` 工作流。手动 CI 调度会绕过变更范围筛选，并强制运行 Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建工件冒烟检查、文档检查、Python Skills、Windows、macOS 和 Control UI 国际化通道。独立手动 CI 运行仅在使用 `include_android=true` 调度时运行 Android；`Full Release Validation` 会将该输入传递给其 CI 子工作流。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 验证发布遥测时，请运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器测试 QA-lab，并验证跟踪、指标和日志导出，以及有界的跟踪属性和内容/标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 验证收集器兼容性时，请运行 `pnpm qa:otel:collector-smoke`。它先通过真实的 OpenTelemetry Collector Docker 容器路由同一份 QA-lab OTLP 导出，然后再执行本地接收器断言。
- 验证受保护的 Prometheus 抓取时，请运行 `pnpm qa:prometheus:smoke`。它会测试 QA-lab、拒绝未经身份验证的抓取，并验证发布关键指标族不包含提示词内容、原始标识符、身份验证令牌和本地路径。
- 运行 `pnpm qa:observability:smoke`，依次执行源代码签出环境中的 OpenTelemetry 和 Prometheus 冒烟通道。
- 在每次带标签的发布前运行 `pnpm release:check`。
- `OpenClaw NPM Release` 预检会在打包 npm tarball 之前生成依赖项发布证据。npm 公告漏洞门禁会阻止发布。传递性清单风险、依赖项所有权/安装面和依赖项变更报告仅用作发布证据。依赖项变更报告会比较发布候选版本与上一个可达的发布标签。预检将依赖项证据上传为 `openclaw-release-dependency-evidence-<tag>`，并将其嵌入已准备的 npm 预检工件内的 `dependency-evidence/` 下。实际发布路径会复用该预检工件，然后将同一证据作为 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub 发布中。
- 标签存在后，运行 `OpenClaw Release Publish` 执行会产生变更的发布序列。从受信任的 `main` 调度常规 beta 和稳定版发布；发布标签仍会选择确切的目标提交，并且可指向 `release/YYYY.M.PATCH`。Tideclaw alpha 发布仍保留在其对应的 alpha 分支上。传入成功的 OpenClaw npm `preflight_run_id`、成功的 `full_release_validation_run_id` 和确切的 `full_release_validation_run_attempt`，并保留默认插件发布范围 `all-publishable`，除非你有意执行聚焦修复。该工作流会依次执行插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，从而避免在外置插件之前发布核心软件包；Windows 和 Android 推广会在草稿发布页面上与核心 npm 发布并行运行。发布重新运行可从中断处继续：如果核心 npm 版本已发布，则在工作流证明注册表 tarball 与该标签的预检工件一致后，会跳过核心调度；当发布已包含经过验证的资源契约时，会跳过 Windows/Android 推广，因此重试仅重新执行失败的阶段。仅修复插件的聚焦操作需要 `plugin_publish_scope=selected` 和非空插件列表。仅插件的 `all-publishable` 运行需要完整且不可变的预检和完整发布验证证据；不接受部分证据。
- 稳定版 `OpenClaw Release Publish` 要求在对应的非预发布 `openclaw/openclaw-windows-node` 发布存在后提供确切的 `windows_node_tag`，以及候选版本批准的 `windows_node_installer_digests` 映射。在调度任何发布子工作流之前，它会验证源发布已发布、不是预发布版本、包含必需的 x64/ARM64 安装程序，并且仍与该批准映射一致。随后，它会在 OpenClaw 发布仍为草稿时调度 `Windows Node Release`，原样传递固定的安装程序摘要映射。子工作流从该确切标签下载已签名的 Windows Hub 安装程序，将它们与固定摘要进行匹配，在 Windows 运行器上验证其 Authenticode 签名使用预期的 OpenClaw Foundation 签名者，写入 SHA-256 清单，并将安装程序及清单上传到规范的 OpenClaw GitHub 发布；随后重新下载已推广的资源，并验证清单成员关系和哈希。父工作流会在发布前验证当前的 x64、ARM64 和校验和资源契约。直接恢复会先拒绝意外的 `OpenClawCompanion-*` 资源名称，然后再使用固定的源字节替换预期的契约资源。

  仅在恢复时手动调度 `Windows Node Release`，并且始终传入确切标签而不是 `latest`，同时传入已批准源发布中的显式 `expected_installer_digests` JSON 映射。网站下载链接应指向当前稳定版的确切 OpenClaw 发布资源 URL；或者仅在验证 GitHub 的最新版本重定向指向同一发布后使用 `releases/latest/download/...`；不要只链接到配套仓库的发布页面。

- 发布检查现在在单独的手动工作流中运行：`OpenClaw Release Checks`。它还会在批准发布前运行 QA Lab 模拟一致性通道，以及快速实时 Matrix 配置和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。如果需要并行执行完整的 Matrix 传输、媒体和 E2EE 清单，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨操作系统安装和升级运行时验证是公共 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。这种拆分是有意为之：让真正的 npm 发布路径保持简短、确定且专注于工件，同时让较慢的实时检查留在各自的通道中，以免拖延或阻塞发布。
- 包含密钥的发布检查应通过 `Full Release Validation` 调度，或从 `main`/release 工作流引用调度，以确保工作流逻辑和密钥始终受控。
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，前提是解析出的提交可从 OpenClaw 分支或发布标签访问。
- `OpenClaw NPM Release` 的仅验证预检还接受当前工作流分支的完整 40 字符提交 SHA，无需已推送的标签。该 SHA 路径仅用于验证，无法提升为真正的发布。在 SHA 模式下，工作流仅为软件包元数据检查合成 `v<package.json version>`；真正的发布仍需要真实的发布标签。
- 两个工作流都在 GitHub 托管的运行器上执行真正的发布和提升路径，而非变更性验证路径可以使用更大的 Blacksmith Linux 运行器。
- 该工作流使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 这两个工作流密钥运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`。
- npm 发布预检不再等待单独的发布检查通道。
- 在本地为候选版本添加标签前，请运行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。该辅助程序会依次运行快速发布防护检查、插件 npm/ClawHub 发布检查、构建、UI 构建和 `release:openclaw:npm:check`，以便在 GitHub 发布工作流启动前发现常见的阻碍审批的错误。
- 批准前请运行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或相应的预发布/修正版标签）。
- npm 发布后，请运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或相应的 beta/修正版）以在全新的临时前缀中验证已发布的软件包注册表安装路径。
- beta 发布后，请运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，以使用共享的租赁式 Telegram 凭据池，针对已发布的 npm 软件包验证已安装软件包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭据。
- 若要从维护者计算机运行完整的发布后 beta 冒烟测试，请使用 `pnpm release:beta-smoke -- --beta betaN`。该辅助程序会运行 Parallels npm 更新/全新目标验证、调度 `NPM Telegram Beta E2E`、轮询精确的工作流运行、下载工件并输出 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行相同的发布后检查。它被有意设置为仅手动运行，不会在每次合并时执行。
- 维护者发布自动化采用“先预检，再提升”：
  - 真正的 npm 发布必须通过成功的 npm `preflight_run_id`。
  - 常规 beta 和稳定版发布编排及预检针对精确的目标标签使用可信的 `main`。Tideclaw alpha 发布和预检使用对应的 alpha 分支。
  - 稳定版 npm 发布默认使用 `beta`；稳定版 npm 发布可通过工作流输入显式指定 `latest`。
  - 基于令牌的 npm dist-tag 变更位于 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 中，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而源代码仓库继续仅使用 OIDC 发布。
  - 公共 `macOS Release` 仅用于验证；如果标签仅存在于发布分支上，但工作流从 `main` 调度，请设置 `public_release_branch=release/YYYY.M.PATCH`。
  - 真正的 macOS 发布必须通过成功的 macOS `preflight_run_id` 和 `validate_run_id`。
  - 真正的发布路径会提升已准备好的工件，而不是再次重新构建。
- 对于 `YYYY.M.PATCH-N` 之类的稳定版修正发布，发布后验证程序还会检查从 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同临时前缀升级路径，以确保发布修正不会悄无声息地让较旧的全局安装继续使用基础稳定版载荷。
- 除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，否则 npm 发布预检将以失败关闭方式终止，以免再次发布空的浏览器仪表板。
- 发布后验证还会检查已发布插件的入口点和软件包元数据是否存在于已安装的注册表布局中。如果发布版本缺少插件运行时载荷，发布后验证程序将失败，并且该版本无法提升至 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，以便安装程序 E2E 在发布路径执行前捕获意外的软件包体积膨胀。
- 如果发布工作涉及 CI 规划、扩展计时清单或扩展测试矩阵，请在批准前从 `.github/workflows/plugin-prerelease.yml` 重新生成并审查由规划器管理的 `plugin-prerelease-extension-shard` 矩阵输出，避免发布说明描述过时的 CI 布局。
- 稳定版 macOS 发布就绪检查还包括更新程序相关表面：GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`；发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip（macOS 发布工作流会自动提交它，若直接推送被阻止，则会创建 appcast PR）；打包后的应用必须保留非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`。

## 发布测试箱

`Full Release Validation` 是操作员从单一入口点启动完整产品矩阵的方式。请使用此辅助程序，以便每个子工作流都从固定于一个可信 `main` 工作流 SHA 的临时分支运行，同时请求的提交仍作为待测候选版本：

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

该辅助程序会获取当前 `origin/main`，在该可信工作流提交上推送 `release-ci/<workflow-sha>-...`，对 alpha/beta 软件包版本推断为 `beta`，其他版本推断为 `stable`，从临时分支使用 `ref=<target-sha>` 调度 `Full Release Validation`，验证每个子工作流的 `headSha` 都与固定的父工作流 SHA 匹配，然后删除临时分支。传入 `-f reuse_evidence=false` 可强制执行全新运行，传入 `-f release_profile=full` 可执行广泛的建议性扫描，传入 `--workflow-sha <trusted-main-sha>` 可固定仍能从当前 `origin/main` 访问的较旧提交。工作流本身绝不会写入仓库引用。这样无需向候选版本添加工具提交，就能使用仅限 main 的发布工具，并避免意外使用更新的 `main` 子运行作为验证依据。

Code SHA 通过所有检查后，仅提交 `CHANGELOG.md`，并使用 Release SHA 运行相同的辅助程序：

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

只有当 GitHub 证明 Release SHA 派生自 Code SHA，且完整的变更路径集恰好为 `CHANGELOG.md` 时，第二个父工作流才会复用产品证据。它会记录 `changelog-only-release-v1`，且不调度任何产品子工作流。npm 预检以及软件包/安装验收仍会在 Release SHA 上运行，因为其 tarball 字节已发生变化。

对于全新的 Code SHA，工作流会解析目标、调度手动 `CI`，然后调度 `OpenClaw Release Checks`。`OpenClaw Release Checks` 会扇出运行安装冒烟测试、跨操作系统发布检查、启用 soak 时的实时/E2E Docker 发布路径覆盖、包含规范 Telegram 软件包 E2E 的 Package Acceptance、QA Lab 一致性、实时 Matrix 和实时 Telegram。仅当 `Full Release Validation` 摘要显示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 均成功时，full/all 运行才可接受；但有意跳过单独 `Plugin Prerelease` 子工作流的聚焦重跑除外。仅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 对已发布软件包进行聚焦重跑时，才使用独立的 `npm-telegram` 子工作流。最终验证程序摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可了解当前关键路径。

在此发布路径中，产品性能子工作流仅生成工件。
总工作流使用 `publish_reports=false` 调度它；除非其仅工件防护检查证明 Clawgrit 报告发布程序保持跳过状态，否则验证将被拒绝。

有关完整阶段矩阵、准确的工作流作业名称、稳定版与完整配置的差异、工件和聚焦重跑操作方式，请参阅[完整发布验证](/zh-CN/reference/full-release-validation)。

子工作流从运行 `Full Release Validation` 的 SHA 固定可信引用调度。每个子运行都必须使用完全相同的父工作流 SHA。不要使用原始 `--ref main -f ref=<sha>` 调度作为发布证明；请使用 `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`。

使用 `release_profile` 选择实时/提供商覆盖范围：

- `beta`：最快的发布关键 OpenAI/核心实时和 Docker 路径
- `stable`：用于发布批准的 beta 加稳定版提供商/后端覆盖
- `full`：稳定版加广泛的建议性提供商/媒体覆盖

稳定版和完整验证在提升前始终运行详尽的实时/E2E、Docker 发布路径和有界的已发布升级存活扫描。使用 `run_release_soak=true` 可为 beta 请求相同的扫描。该扫描覆盖最新四个稳定版软件包、固定的 `2026.4.23` 和 `2026.5.2` 基线，以及更旧的 `2026.4.15` 覆盖；它会移除重复基线，并将每个基线分片到各自的 Docker 运行器作业中。

`OpenClaw Release Checks` 使用可信工作流引用将目标引用一次性解析为 `release-package-under-test`，并在运行 soak 时，在跨操作系统检查、Package Acceptance 和发布路径 Docker 检查中复用该工件。这能让所有面向软件包的测试箱使用完全相同的字节，并避免重复构建软件包。beta 已发布至 npm 后，请设置 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，让发布检查仅下载一次已发布的软件包，从 `dist/build-info.json` 中提取其构建源 SHA，并在跨操作系统检查、Package Acceptance、发布路径 Docker 和软件包 Telegram 通道中复用该工件。

跨操作系统 OpenAI 安装冒烟测试在设置了仓库/组织变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.6-luna`，因为该通道验证的是软件包安装、新手引导、Gateway 网关启动和一次实时智能体轮次，而不是对能力最强的模型进行基准测试。更广泛的实时提供商矩阵仍是执行特定模型覆盖的场所。

请根据发布阶段使用以下变体：

```bash
# 验证产品完整的 Code SHA。
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# 通过复用 Code SHA 产品证据，验证仅含变更日志的 Release SHA。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# 发布 beta 版后，添加已发布软件包的 Telegram E2E。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

在完成针对性修复后，首次重新运行时不要使用完整总流程。如果某个验证框失败，下一次验证应使用失败的子工作流、作业、Docker 通道、软件包配置、模型提供商或 QA 通道。仅当修复更改了共享发布编排，或使先前所有验证框的证据失效时，才再次运行完整总流程。总流程的最终验证器会重新检查已记录的子工作流运行 ID，因此在子工作流成功重新运行后，只需重新运行失败的 `Verify full validation` 父作业。

当发布配置、实际浸泡测试设置和验证输入一致，并且目标 SHA 相同，或者新目标是其后代且完整变更路径集合恰好为 `CHANGELOG.md` 时，`rerun_group=all` 可以复用先前已通过的总流程运行。完全相同的目标复用会记录 `exact-target-full-validation-v1`；验证后的 Release SHA 会记录 `changelog-only-release-v1`。后者仅复用产品验证。Npm 预检、软件包字节、发布说明来源以及安装/更新验收仍必须针对 Release SHA 运行。任何版本、源、生成内容、依赖项、软件包或工作流所拥有目标的变更，都需要新的 Code SHA 和全新的完整验证。对于相同 `release/*` 引用和重新运行组，较新的总流程运行会自动取代进行中的运行。传入 `reuse_evidence=false` 可强制执行全新的完整运行。

对于限定范围的恢复，请向总流程传入 `rerun_group`。`all` 是真正的候选发布版本运行，`ci` 仅运行常规 CI 子流程，`plugin-prerelease` 仅运行发布专用插件子流程，`release-checks` 运行所有发布验证框，而更窄的发布组为 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。针对性的 `npm-telegram` 重新运行需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整/全部运行会使用 Package Acceptance 中的规范软件包 Telegram E2E。针对性的跨操作系统重新运行可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他操作系统/测试套件过滤器。QA 发布检查失败会阻止常规发布验证，包括标准层级中必需的 OpenClaw 动态工具漂移检查。Tideclaw alpha 运行仍可将不涉及软件包安全性的发布检查通道视为建议项。使用 `release_profile=beta` 时，`Run repo/live E2E validation` 实时提供商测试套件为建议项（产生警告，但不阻止）；stable 和 full 配置仍将其作为阻断项。当 `live_suite_filter` 明确请求受门控的 QA 实时通道（如 Discord、WhatsApp 或 Slack）时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 仓库变量；否则输入捕获会失败，而不会静默跳过该通道。

### Vitest

Vitest 验证框是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并强制为候选发布版本运行常规测试图：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物冒烟检查、文档检查、Python Skills、Windows、macOS 和 Control UI 国际化。`Full Release Validation` 运行该验证框时也会包含 Android，因为总流程会传入 `include_android=true`；独立手动 CI 需要 `include_android=true` 才能覆盖 Android。

使用此验证框回答“源代码树是否通过了完整的常规测试套件？”它与发布路径产品验证并不相同。需要保留的证据：

- `Full Release Validation` 摘要，其中显示已分派的 `CI` 运行 URL
- `CI` 在确切目标 SHA 上运行通过
- 调查回归问题时，从 CI 作业中获取失败或缓慢的分片名称
- 当运行需要性能分析时，保留 Vitest 计时工件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的常规 CI，而不需要 Docker、QA Lab、实时、跨操作系统或软件包验证框时，才直接运行手动 CI。直接运行不含 Android 的 CI 时使用第一条命令。当直接候选发布版本 CI 必须覆盖 Android 时，添加 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 验证框位于 `OpenClaw Release Checks` 至 `openclaw-live-and-e2e-checks-reusable.yml`，另加发布模式的 `install-smoke` 工作流。它通过打包后的 Docker 环境验证候选发布版本，而不只是运行源代码级测试。

发布 Docker 覆盖范围包括：

- 完整安装冒烟测试，并启用耗时较长的 Bun 全局安装冒烟测试
- 按目标 SHA 准备/复用根 Dockerfile 冒烟测试镜像，其中 QR、root/gateway 和安装程序/Bun 冒烟作业作为独立的安装冒烟分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`
- 按需在专用大磁盘运行器上执行 OpenWebUI 覆盖测试
- 拆分的内置插件安装/卸载通道 `bundled-plugin-install-uninstall-0` 至 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时测试套件时，执行实时/E2E 提供商测试套件和 Docker 实时模型覆盖测试

重新运行前先使用 Docker 工件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重新运行命令。对于针对性恢复，请在可复用的实时/E2E 工作流中使用 `docker_lanes=<lane[,lane]>`，而不要重新运行所有发布分块。生成的重新运行命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 验证框也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，与 Vitest 和 Docker 软件包机制相互独立。

发布 QA Lab 覆盖范围包括：

- 模拟一致性通道，使用智能体一致性包将 OpenAI 候选通道与 `anthropic/claude-opus-4-8` 基准进行比较
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要明确的本地验证时，使用 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此验证框回答“发布版本在 QA 场景和实时渠道流程中的行为是否正确？”批准发布时，请保留一致性、Matrix 和 Telegram 通道的工件 URL。完整 Matrix 覆盖仍可通过手动分片 QA-Lab 运行获得，而不是作为默认的发布关键通道。

### 软件包

软件包验证框是可安装产品的门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 提供支持。解析器会将候选版本规范化为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并使工作流工具链引用与软件包源引用保持独立。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或确切的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` 工具链，将受信任的 `package_ref` 分支、标签或完整提交 SHA 打包
- `source=url`：下载公共 HTTPS `.tgz`，且必须提供 `package_sha256`；包含 URL 凭据、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析地址以及不安全重定向的请求会被拒绝
- `source=trusted-url`：下载 HTTPS `.tgz`，且必须提供 `package_sha256` 和来自 `.github/package-trusted-sources.json` 中具名策略的 `trusted_source_id`；对于维护者拥有的企业镜像或私有软件包仓库，应使用此方式，而不是向 `source=url` 添加输入级私有网络绕过机制
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布软件包工件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 针对同一个已解析 tarball 执行迁移、更新、由 root 管理的 VPS 升级、已配置身份验证的更新后重启、实时 ClawHub skill 安装、陈旧插件依赖项清理、离线插件固件、插件更新、插件命令绑定转义强化以及 Telegram 软件包 QA。阻断性发布检查默认使用最新已发布软件包作为基准；使用 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 配置会将已发布升级存续性扫描扩展至 `last-stable-4`，以及固定的 `2026.4.23`、`2026.5.2` 和 `2026.4.15` 基准，并使用 `reported-issues` 场景。对于已发布的候选版本，使用带 `source=npm` 的 Package Acceptance；对于发布前基于 SHA 的本地 npm tarball，使用 `source=ref`；对于维护者拥有的企业/私有镜像，使用 `source=trusted-url`；对于由另一个 GitHub Actions 运行上传的已准备 tarball，使用 `source=artifact`。

它是 GitHub 原生的替代方案，可取代此前需要 Parallels 才能完成的大部分软件包/更新覆盖测试。跨操作系统发布检查对于特定于操作系统的新手引导、安装程序和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范检查清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在确定由哪个本地、Docker、Package Acceptance 或发布检查通道验证插件安装/更新、Doctor 清理或已发布软件包迁移变更时，请使用该清单。针对每个 stable `2026.4.23+` 软件包执行的完整已发布更新迁移，是一个独立的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽松策略有意设置了时间限制。`2026.4.25` 及之前的软件包可以针对已发布到 npm 的元数据缺失使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少 `gateway install --wrapper`、从 tarball 派生的 git 固件中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 软件包可能会针对已随版本发布的本地构建元数据标记文件发出警告。后续软件包必须满足现代软件包契约；相同的缺失项会导致发布验证失败。

当发布问题涉及实际可安装的软件包时，请使用更全面的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常用软件包配置：

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：安装/更新/重启/插件软件包契约，以及实时 ClawHub 技能安装验证；这是发布检查的默认选项
- `product`：`package`，外加 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于针对性重新运行的精确 `docker_lanes` 列表

如需对候选软件包进行 Telegram 验证，请在 Package Acceptance 中启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将解析后的 `package-under-test` tarball 传入 Telegram 通道；独立的 Telegram 工作流仍接受已发布的 npm 规范，用于发布后检查。

## 常规发布自动化

对于 beta、`latest`、插件、GitHub Release 和平台发布，
`OpenClaw Release Publish` 是常规的变更入口点。每月一次的
`.33+` 仅 npm 扩展稳定版路径不使用此编排器。常规工作流会按发布所需的顺序编排可信发布者工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 访问（对于 alpha 预发布版本，也可以从 Tideclaw alpha 分支访问）。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同的范围和 SHA 调度 `Plugin ClawHub Release`。
6. 验证已保存的 `full_release_validation_run_id` 和精确运行尝试次数后，使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。
7. 对于稳定版发布，将 GitHub release 创建或更新为草稿，使用显式的 `windows_node_tag` 和候选版本已批准的 `windows_node_installer_digests` 调度 `Windows Node Release`，并验证规范的 Windows 安装程序/校验和资产。同时调度 `Android Release`，构建精确标签对应的已签名 APK、校验和及来源证明。在发布草稿前验证这两项原生资产契约。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

将稳定版发布到默认 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

直接将稳定版提升到 `latest` 必须显式执行：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

仅将较低层级的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流用于针对性修复或重新发布。`OpenClaw Release Publish` 会在 `publish_openclaw_npm=true` 时拒绝 `plugin_publish_scope=selected`，确保核心软件包不会在缺少任何可发布的官方插件（包括 `@openclaw/diffs-language-pack`）时发布。对于选定的插件修复，请设置 `publish_openclaw_npm=false`，并同时设置 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或者直接调度子工作流。

首次发布时的 ClawHub 引导是例外：从可信的 `main` 调度 `Plugin ClawHub New`，并通过 `ref` 传入完整的目标发布 SHA。
切勿从发布标签或分支运行引导工作流本身：

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

标签前验证要求 `dry_run=true`，拒绝发布标签和父级运行输入，并且仅接受可从 `main` 或 `release/*` 访问的精确目标。它不会加载 ClawHub 凭据、发布软件包字节，也不会更改可信发布者配置。该工作流仍会解析实时注册表计划，仅在无密钥作业中检出并打包目标，具体化锁定的 ClawHub 工具链，并在发布标签存在前验证不可变工件和软件包 slug/身份。仅在无密钥打包作业完成后批准 `clawhub-plugin-bootstrap` 环境；此受保护的验证作业不含凭据或变更命令。

获批的试运行或加标签后的实际引导必须包含精确的发布标签，以及父级 `OpenClaw Release Publish` 的运行 ID、尝试次数和分支。父级会证明其自身的工作流 SHA，以及 `Plugin ClawHub New` 的另一个精确可信 `main` SHA；子级运行和每项受保护环境审批都必须与该已批准的子级 SHA 匹配。每次尝试发布和变更可信发布者前，都会重新检查发布标签。

打包作业会上传一个不可变工件，其名称、Actions 工件 ID/摘要、生成者运行/尝试次数、目标 SHA，以及每个软件包 tarball 的 SHA-256/大小，都会传递到验证作业和受保护作业。受保护作业仅检出可信的 `main` 工具，通过 GitHub API 验证工件元组，按精确工件 ID 下载，重新计算每个 tarball 的哈希，并根据固定版本 CLI 的 USTAR 规范化规则验证本地 TAR 路径和软件包身份。随后，每个候选版本都必须通过固定版本 CLI 的发布试运行；该试运行会在注册表查询或身份验证前返回。凭据作业的预筛选将压缩后的 ClawPack 限制为 120 MiB、文件总有效负载限制为 50 MiB、展开后的 TAR 数据限制为 64 MiB、TAR 条目数限制为 10,000。现有软件包的可信发布者修复仍仅执行配置，但它依然会打包目标，并要求请求的标签、精确注册表字节和元数据完全相等，然后才能更改可信发布者配置。发布后验证会下载 ClawHub 工件，并要求 SHA-256 和大小保持相同。仅当精确的生成者作业已成功完成时，重新运行失败后的恢复操作才可以复用先前尝试的软件包工件。最终证据还会绑定锁定的 ClawHub 版本、锁文件 SHA-256 和 npm 完整性值。任何不匹配都需要新的软件包版本。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；当 `preflight_only=true` 时，也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示实际发布路径
- `preflight_run_id`：现有的成功预检运行 ID；实际发布路径必需，以便工作流复用已准备的 tarball，而不是重新构建
- `full_release_validation_run_id`：此标签/SHA 对应的成功 `Full Release Validation` 运行 ID，实际发布时必需。Beta 发布可以仅凭预检并在发出警告后继续，但稳定版/`latest` 提升仍要求提供此项。
- `full_release_validation_run_attempt`：与 `full_release_validation_run_id` 配对的精确正整数运行尝试次数；只要提供了运行 ID，就必须提供此项，以防重新运行在发布过程中更改授权证据。
- `release_publish_run_id`：已批准的 `OpenClaw Release Publish` 运行 ID；当此工作流由该父级调度时必需（机器人执行者的实际发布调用）
- `plugin_npm_run_id`：成功的精确 HEAD `Plugin NPM Release` 运行 ID；实际发布 `extended-stable` 核心软件包时必需
- `npm_dist_tag`：发布路径的 npm 目标标签；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，默认值为 `beta`。最终补丁 `33` 及更高版本必须使用 `extended-stable`；默认情况下，`extended-stable` 会拒绝更早的补丁，并且始终拒绝非最终标签。
- `bypass_extended_stable_guard`：仅测试用布尔值，默认为 `false`；与 `npm_dist_tag=extended-stable` 一起使用时，会绕过每月扩展稳定版资格检查，同时保留发布身份、工件、审批和回读检查。

`Plugin NPM Release` 接受用于现有发布行为的 `npm_dist_tag=default`，或用于受保护每月路径的 `npm_dist_tag=extended-stable`。扩展稳定版选项要求 `publish_scope=all-publishable`、空的 `plugins` 输入、版本不低于 `33` 的最终补丁，以及位于精确分支顶端的规范 `extended-stable/YYYY.M.33` 分支。它绝不会移动插件 `latest` 或 `beta`。新软件包版本通过 OIDC 可信发布（`npm publish --tag extended-stable`）以原子方式获得 `extended-stable`；此源工作流不使用基于令牌身份验证的 `npm dist-tag add`。重试会跳过 npm 中已存在的精确版本；随后将采用失败关闭策略，除非完整回读确认每个精确软件包和 `extended-stable` 标签均已收敛。

`OpenClaw Release Publish` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签；必须已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 时必需
- `full_release_validation_run_id`：成功的 `Full Release Validation` 运行 ID；当 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 时必需
- `full_release_validation_run_attempt`：与 `full_release_validation_run_id` 配对的精确正整数尝试次数；只要提供了运行 ID，就必须提供此项
- `windows_node_tag`：精确的非预发布 `openclaw/openclaw-windows-node` 发布标签；发布稳定版 OpenClaw 时必需
- `windows_node_installer_digests`：由候选版本审批确认的紧凑 JSON 映射，将当前 Windows 安装程序名称映射到其固定的 `sha256:` 摘要；发布稳定版 OpenClaw 时必需
- `npm_telegram_run_id`：可选的成功 `NPM Telegram Beta E2E` 运行 ID，用于纳入最终发布证据
- `npm_dist_tag`：OpenClaw 软件包的 npm 目标标签，可选值为 `alpha`、`beta` 或 `latest`
- `plugin_publish_scope`：默认为 `all-publishable`；仅在使用 `publish_openclaw_npm=false` 进行针对性的仅插件修复工作时使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，以逗号分隔的 `@openclaw/*` 软件包名称
- `publish_openclaw_npm`：默认为 `true`；仅当将该工作流用作仅插件修复编排器时设置 `false`
- `release_profile`：用于发布证据摘要的发布覆盖配置；默认为 `from-validation`，即从验证清单中读取，也可以使用 `beta`、`stable` 或 `full` 覆盖
- `wait_for_clawhub`：默认为 `false`，因此 npm 可用性不会被 ClawHub 辅助流程阻塞；仅当工作流完成必须包含 ClawHub 完成时设置 `true`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。涉及密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签访问。
- `run_release_soak`：为 Beta 发布检查启用全面的实时/E2E、Docker 发布路径和涵盖所有历史版本的升级存活浸泡测试。`release_profile=stable` 和 `release_profile=full` 会强制启用此选项。

规则：

- 补丁版本低于 `33` 的常规最终版本和修正版可以发布到 `beta` 或 `latest`。补丁版本为 `33` 或更高的最终版本必须发布到 `extended-stable`，并且会拒绝处于该边界的带修正后缀版本。
- Beta 预发布标签只能发布到 `beta`；Alpha 预发布标签只能发布到 `alpha`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 实际发布路径必须使用预检期间使用的同一 `npm_dist_tag`；工作流会先验证该元数据，然后再继续发布

## 常规 Beta/最新稳定版发布流程

此旧版流程用于常规编排式发布，该发布还负责插件、GitHub Release、Windows 和其他平台工作。它不是本页顶部记录的每月 `.33+` 仅 npm 扩展稳定版路径。

创建常规编排式稳定版时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。标签尚不存在时，可以使用当前工作流分支的完整提交 SHA，对预检工作流执行仅验证的空运行。
2. 对于常规的 Beta 优先流程，选择 `npm_dist_tag=beta`；仅当有意直接发布稳定版时，才选择 `latest`。
3. 如果希望通过一个手动工作流运行常规 CI，并覆盖实时提示词缓存、Docker、QA Lab、Matrix 和 Telegram，请在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`。如果明确只需要确定性的常规测试图，请改为在发布引用上运行手动 `CI` 工作流。
4. 选择应随附已签名 x64 和 ARM64 安装程序的确切非预发布 `openclaw/openclaw-windows-node` 发布标签。将其保存为 `windows_node_tag`，并将这些安装程序经过验证的摘要映射保存为 `windows_node_installer_digests`。候选发布版辅助工具会记录两者，并将其纳入生成的发布命令。
5. 保存成功的 `preflight_run_id`、`full_release_validation_run_id` 和确切的 `full_release_validation_run_attempt`。
6. 从受信任的 `main` 运行 `OpenClaw Release Publish`，使用同一 `tag`、同一 `npm_dist_tag`、选定的 `windows_node_tag`、已保存的 `windows_node_installer_digests`、已保存的 `preflight_run_id`、`full_release_validation_run_id` 和 `full_release_validation_run_attempt`。它会先将外置插件发布到 npm 和 ClawHub，然后再提升 OpenClaw npm 包。
7. 如果发布落在 `beta` 上，请使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流将该稳定版本从 `beta` 提升到 `latest`。
8. 如果发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一稳定版构建，请使用同一发布工作流，将两个 dist-tag 都指向该稳定版本；也可以让其定时自修复同步稍后移动 `beta`。

dist-tag 变更位于发布账本仓库中，因为它仍然需要 `NPM_TOKEN`，而源代码仓库保持仅使用 OIDC 发布。这样，直接发布路径和 Beta 优先提升路径都有文档记录，并且操作员均可查看。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将其保留在 tmux 中，可使提示、警报和 OTP 处理过程可观察，并防止主机重复发出警报。

## 公开参考资料

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

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
