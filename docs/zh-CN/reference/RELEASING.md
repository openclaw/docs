---
read_when:
    - 正在查找公开发布渠道的定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-07-11T20:54:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前提供三个面向用户的更新渠道：

- stable：现有的已推广发布渠道，在独立的 CLI/渠道里程碑落地之前，仍通过 npm `latest` 解析
- beta：发布到 npm `beta` 的预发布标签
- dev：持续移动的 `main` 分支最新提交

此外，发布操作员可以将上一个已结束月份的核心包发布到 npm `extended-stable`，补丁版本从 `33` 开始。当月的常规最终版本线继续使用 npm `latest`；这种操作员侧的发布拆分本身不会改变 CLI 更新渠道的解析方式。

Tideclaw alpha 构建属于独立的内部预发布轨道（npm dist-tag `alpha`），详见 [NPM 工作流输入](#npm-workflow-inputs)和[发布测试环境](#release-test-boxes)。

## 版本命名

- 每月 npm extended-stable 发布版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 标签为 `vYYYY.M.PATCH`
- 每日/常规最终发布版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 标签为 `vYYYY.M.PATCH`
- 常规回退修正发布版本：`YYYY.M.PATCH-N`，git 标签为 `vYYYY.M.PATCH-N`
- Beta 预发布版本：`YYYY.M.PATCH-beta.N`，git 标签为 `vYYYY.M.PATCH-beta.N`
- Alpha 预发布版本：`YYYY.M.PATCH-alpha.N`，git 标签为 `vYYYY.M.PATCH-alpha.N`
- 月份或补丁版本绝不补零
- `PATCH` 是每月发布列车的连续编号，而不是日历日期。常规最终版本和 beta 版本会推进当前发布列车；仅含 alpha 的标签绝不会占用或推进 beta/常规补丁编号，因此在选择 beta 或常规发布列车时，应忽略补丁编号更高的旧版纯 alpha 标签。
- Alpha/每夜构建使用下一个尚未发布的补丁列车，重复构建时仅递增 `alpha.N`。一旦该补丁已有 beta 版本，新的 alpha 构建就移至下一个补丁版本。
- npm 版本不可变：绝不删除、重新发布或重复使用已发布的标签。应改为发布下一个预发布编号或下一个月度补丁版本。
- `latest` 继续跟随当前的常规/每日 npm 版本线；`beta` 是当前的 beta 安装目标
- `extended-stable` 表示受支持的上一个月 npm 包，从补丁 `33` 开始；补丁 `34` 及更高版本是该月度版本线上的维护版本
- 常规最终版本和常规修正版本默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，也可以稍后推广已经过验证的 beta 构建
- 专用的每月 extended-stable 路径会以完全相同的版本发布核心 npm 包以及所有可发布到 npm 的官方插件。它不会将插件发布到 ClawHub，也不会发布 macOS 或 Windows 构件、GitHub Release、私有仓库 dist-tag、Docker 镜像、移动端构件或网站下载项。
- 每个常规最终版本都会同时发布 npm 包、macOS 应用、已签名的独立 Android APK，以及已签名的 Windows Hub 安装程序。Beta 版本通常先验证并发布 npm/包路径；原生应用的构建、签名、公证和推广保留给常规最终版本，除非明确要求执行。

## 发布节奏

- 发布先进入 beta；只有在最新 beta 通过验证后，stable 才会跟进
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.PATCH` 分支发布版本，这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布但需要修复，维护者会创建下一个 `-beta.N` 标签，而不是删除或重新创建旧标签
- 详细的发布流程、审批、凭据和恢复说明仅供维护者使用

## 每月仅限 npm 的 extended-stable 发布

这是下方常规发布流程的一个专用例外。对于已结束的月份 `YYYY.M`，创建 `extended-stable/YYYY.M.33`；从同一分支发布 `vYYYY.M.33` 及后续维护补丁。发布标签、分支顶端、检出内容、包版本、npm 预检以及完整发布验证运行必须全部指向同一个提交。受保护的 `main` 必须已经包含一个日历月份严格更晚且补丁版本低于 `33` 的最终版本；即使 `main` 已前进超过一个月，维护补丁仍然符合发布条件。

在准确的 extended-stable 分支上，将根包版本提升到 `YYYY.M.P`，运行 `pnpm release:prep`，并验证每个可发布的扩展包都使用相同版本。提交并推送所有生成的变更，在该提交上创建并推送不可变的 `vYYYY.M.P` 标签，并记录生成的完整 SHA。工作流使用这棵已准备好的源代码树；它们不会替你提升或同步版本。

从该准确的已准备分支顶端运行 npm 预检和完整发布验证，然后保存两个运行 ID 以及成功的完整发布验证运行尝试编号：

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

`release_profile=stable` 是现有的验证深度配置，与 npm `extended-stable` dist-tag 相互独立，并有意保持不变。

两个运行均成功后，从同一个准确的分支顶端发布所有可发布到 npm 的官方插件。补丁 `P` 必须为 `33` 或更高。将完整发布 SHA 作为 `ref` 传入，等待整个矩阵和注册表回读完成，然后保存成功的 Plugin NPM Release 运行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

该工作流使用常规的已准备 `all-publishable` 包清单，其中包括源代码未发生变化的包。成功前，它会验证每个准确版本的包和每个插件的 `extended-stable` 标签。如果部分运行失败，请重新运行同一命令：已发布的包会被复用，缺失或过期的插件标签会在 npm 发布环境中得到协调修复，最终回读仍会覆盖完整的包集合。

插件工作流成功且 npm 发布环境就绪后，发布预检生成的准确核心 tarball。核心发布会验证所引用的插件运行在同一规范分支和准确源 SHA 上处于 `completed/success` 状态：

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

对于有意无法满足每月 `.33` 或受保护 `main` 月份策略的分叉仓库或非生产演练，请在 npm 预检和发布调度中都添加 `-f bypass_extended_stable_guard=true`。默认值为 `false`。仅当 `npm_dist_tag=extended-stable` 时才接受该绕过选项，并会将其记录在工作流摘要中。它不会绕过规范的 `extended-stable/YYYY.M.33` 工作流引用、分支顶端/标签/检出内容一致性、最终标签语法、包/标签版本一致性、所引用运行与清单身份一致性、tarball 来源、环境审批、注册表回读或选择器修复证据。

发布工作流会验证所引用的预检、验证和插件运行的身份、已准备 tarball 的摘要，以及核心注册表选择器。工作流成功后，还需独立确认结果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

两个命令都必须返回 `YYYY.M.P`。如果发布成功但选择器回读失败，不要重新发布不可变的包版本。使用失败工作流的始终运行摘要中打印的单条 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修复命令，然后重复两次独立回读。回滚到之前的选择器是另一项独立的操作员决策，不属于回读修复路径。

公开支持文档最初将 Slack、Discord 和 Codex 指定为 extended-stable 覆盖的插件表面。该列表是一项支持声明，而不是发布代码中的允许列表：每个可发布到 npm 的官方插件都遵循完全相同版本的发布路径。

下方的常规检查清单继续负责 beta、`latest`、GitHub Release、插件、macOS、Windows 和其他平台的发布。不要为这个仅限 npm 的 extended-stable 路径运行这些步骤。

## 常规发布操作员检查清单

此检查清单展示了发布流程的公开结构。私有凭据、签名、公证、dist-tag 恢复和紧急回滚的详细信息保留在仅供维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认 `main` 的 CI 状态足够正常，可以从中创建分支。
2. 根据自上一个可达发布标签以来已合并的 PR 和所有直接提交，生成 `CHANGELOG.md` 顶部章节。条目应面向用户，去除重叠的 PR/直接提交条目，提交并推送，然后在创建分支前再次变基/拉取。当存在分叉的已发布标签，或后续前向移植重新关联了已经发布的 PR 时，通过 `--shipped-ref` 显式传入该标签；验证器会使用标签快照中编号章节内完整贡献记录里的显式 PR 行，忽略 `Unreleased`，并记录被排除 PR 的准确清单和数量。
3. 审查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅当升级路径仍有保障时才移除已过期的兼容性支持，否则记录有意保留它的原因。
4. 从当前 `main` 创建 `release/YYYY.M.PATCH`。不要直接在 `main` 上进行常规发布工作。
5. 为该标签更新所有必需位置的版本，然后运行 `pnpm release:prep`。它会依次刷新插件版本、npm shrinkwrap、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。在打标签前提交所有生成内容的偏差，然后运行本地确定性预检：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。标签尚不存在时，允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。预检会为检出的确切依赖图生成依赖发布证据，并将其存储在 npm 预检制品中。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，使用 `Full Release Validation` 启动所有发布前测试。这是四个大型发布测试环境的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。保存 `full_release_validation_run_id` 和准确的 `full_release_validation_run_attempt`；两者都是 `OpenClaw NPM Release` 和 `OpenClaw Release Publish` 的必需输入。
8. 如果验证失败，请在发布分支上修复，并重新运行能够证明修复有效的最小失败文件、通道、工作流作业、软件包配置、提供商或模型允许列表。仅当变更的范围使先前证据失效时，才重新运行完整的总括验证。
9. 对于已打标签的 beta 候选版本，请从匹配的 `release/YYYY.M.PATCH` 分支运行 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。对于稳定版，还需传入必需的 Windows 源版本：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。该辅助工具使用受信任的 `main` 作为工作流源，同时让每个工作流以准确标签为目标。它会在 `.artifacts/release-candidate/<tag>/release-candidate-state.json` 中检查点记录不可变的候选版本/工具身份和已分派的运行 ID；重新运行相同命令会恢复这些准确的运行，而候选版本、工具、配置或选项出现任何偏差都会以失败关闭。在分派完整验证矩阵前，该辅助工具会确定性渲染准确标签的 GitHub 发布正文，并拒绝缺失版本标题、超出限制且无法使用规范紧凑形式的正文，或从标签无法访问其贡献记录基础/目标来源的情况。它还会根据引用的累积标签记录验证所有显式的已发布基线排除元数据。随后，它会运行本地生成发布检查、分派或验证完整发布验证和 npm 预检证据，针对准确的已准备 tarball 运行 Parallels 全新安装/更新证明以及 Telegram 软件包证明，记录插件 npm 和 ClawHub 计划，并且仅在证据包全部通过后输出准确的 `OpenClaw Release Publish` 命令。

   `OpenClaw Release Publish` 会将选定或所有可发布的插件软件包并行发布到 npm，并将同一组软件包并行发布到 ClawHub；插件 npm 发布成功后，再使用匹配的 dist-tag 推广已准备好的 OpenClaw npm 预检制品。发布检出内容仍作为产品/数据根目录，而规划和最终验证会从准确且受信任的工作流源检出内容执行，防止旧发布提交静默使用过时的发布工具。在任何发布子任务启动前，它会渲染并缓存准确的 GitHub 发布正文。当完整匹配的 `CHANGELOG.md` 章节同时符合 GitHub 的 125,000 字符限制和渲染器匹配的 125,000 字节安全上限时，页面会包含准确的 `## YYYY.M.PATCH` 章节及其标题。当源章节无法容纳时，页面会保留准确的分组编辑说明，并将过大的贡献记录替换为指向标签固定版本 `CHANGELOG.md` 中完整记录的稳定链接；绝不会发布不完整记录或被截断的项目符号条目。工作流会在添加 `### 发布验证` 前选择完整或紧凑正文；如果证明尾部会导致超出限制，它会保留规范正文，并依赖附加的不可变证据。发布到 npm `latest` 的稳定版本会成为 GitHub 最新版本，而保留在 npm `beta` 上的稳定维护版本会以 GitHub `latest=false` 创建。工作流还会将预检依赖证据、完整验证清单和发布后注册表验证证据上传到 GitHub 发布，以供发布后事件响应使用。它会立即输出子任务运行 ID，自动批准工作流令牌有权批准的发布环境关卡，使用日志尾部汇总失败的子任务作业，预先创建 GitHub 发布草稿页面，并在发布 OpenClaw npm 软件包的同时并发推广 Windows 和 Android 制品；这些阶段成功后，它会完成发布页面和依赖证据，发布 OpenClaw npm 软件包时等待 ClawHub 完成，然后运行受信任 `main` 上的 beta 验证器，并为 GitHub 发布、npm 软件包、选定的插件 npm 软件包、选定的 ClawHub 软件包、子工作流运行 ID 和可选的 NPM Telegram 运行 ID 上传发布后证据。ClawHub 引导验证器要求准确且受信任的 `main` 工作流路径和 SHA、生产者和终止运行尝试次数、发布 SHA、请求的软件包集合、不可变软件包制品元组，以及终止注册表回读制品；不接受成功的旧版 release-ref 运行。

   然后针对已发布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 软件包运行发布后软件包验收。如果已推送或已发布的预发布版本需要修复，请发布下一个匹配的预发布编号；绝不要删除或重写旧版本。

10. 对于稳定版，仅在经过审查的 beta 或发布候选版本具备所需验证证据后才能继续。稳定版 npm 发布同样通过 `OpenClaw Release Publish` 进行，并通过 `preflight_run_id` 复用成功的预检制品。稳定版 macOS 发布就绪还要求 `main` 上存在已打包的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`；macOS 发布工作流会在发布制品验证通过后自动将已签名的 appcast 发布到公共 `main`，如果分支保护阻止直接推送，则会创建或更新 appcast PR。稳定版 Windows Hub 就绪要求 OpenClaw GitHub 发布中存在已签名的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 和 `OpenClawCompanion-SHA256SUMS.txt` 制品。将准确的已签名 `openclaw/openclaw-windows-node` 发布标签作为 `windows_node_tag` 传入，并将候选版本已批准的安装程序摘要映射作为 `windows_node_installer_digests` 传入；`OpenClaw Release Publish` 会保留发布草稿、分派 `Windows Node Release`，并在发布前验证全部三个制品。
11. 发布后，运行 npm 发布后验证器；需要发布后渠道证明时，运行可选的独立已发布 npm Telegram E2E；必要时推广 dist-tag；验证生成的 GitHub 发布页面；执行发布公告步骤；然后在宣布稳定版发布完成前，完成[稳定版 main 收尾](#stable-main-closeout)。

## 稳定版 main 收尾

在 `main` 包含实际已发布版本状态之前，稳定版发布尚未完成。

1. 从最新的全新 `main` 开始。对照它审查 `release/YYYY.M.PATCH`，并前向移植 `main` 中缺少的实际修复。不要盲目地将仅用于发布的兼容性、测试或验证适配器合并到更新的 `main` 中。
2. 将 `main` 设置为已发布的稳定版本，而不是推测性的下一发布序列。更改根版本后运行 `pnpm release:prep`，然后运行 `pnpm deps:shrinkwrap:generate`。
3. 使 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 章节与已打标签的发布分支完全一致。如果 mac 发布生成了稳定版 `appcast.xml` 更新，也要将其包含在内。
4. 在操作员显式启动该发布序列之前，不要向 `main` 添加 `YYYY.M.PATCH+1`、beta 版本或空的未来变更日志章节。
5. 运行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送，然后确认 `origin/main` 包含已发布的版本和变更日志，再宣布稳定版发布完成。
6. 每次执行私有回滚演练后，保持仓库变量 `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE` 为最新状态。

`OpenClaw Stable Main Closeout` 从稳定版发布后包含已发布版本、变更日志和 appcast 的 `main` 推送开始。它读取不可变的发布后证据，将已发布标签绑定到对应的 Full Release Validation 和 Publish 运行，然后验证稳定版 main 状态、发布、必需的稳定版浸泡期以及阻断性性能证据。它会将不可变的收尾清单及校验和附加到 GitHub 发布。自动推送触发器会跳过早于不可变发布后证据的旧版发布，并且绝不会将该跳过视为已完成收尾。

完整收尾需要同时具备两个制品及匹配的校验和。不完整的清单会重放其中记录的 `main` SHA 和回滚演练，以重新生成完全一致的字节，然后附加缺失的校验和；无效的配对，或只有校验和而没有清单，仍会造成阻断。由推送触发且缺少回滚演练仓库变量的运行会跳过，但不会完成收尾；缺失或超过 90 天的演练记录仍会阻断手动的证据支持收尾。私有恢复命令保留在仅限维护者使用的运行手册中。仅使用手动分派来修复或重放有证据支持的稳定版收尾。

旧版后备修正标签仅在修正标签解析到与基础稳定版标签相同的源提交时，才能复用基础软件包证据。其 Android 发布会复用基础标签已验证的 APK，并添加修正标签的来源证明。源不同的修正必须发布并验证自身的软件包证据，并使用更高的 Android `versionCode`。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在速度更快的本地 `pnpm check` 门禁之外仍得到覆盖。
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在速度更快的本地门禁之外也全部通过。
- 在运行 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI 包已存在。
- 在根版本号提升后、打标签前运行 `pnpm release:prep`。它会运行所有在版本、配置或 API 变更后通常容易发生偏移的确定性发布生成器：插件版本、npm shrinkwrap、插件清单、基础配置架构、内置渠道配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些防护检查（并额外执行插件 SDK 表面积预算检查），在运行软件包发布检查前一次性报告所有生成内容偏移失败。
- 默认情况下，插件版本同步会将可发布的 `@openclaw/ai` 运行时软件包、官方插件软件包版本以及现有 `openclaw.compat.pluginApi` 下限更新为 OpenClaw 发布版本。应将该字段视为插件 SDK/运行时 API 下限，而不只是软件包版本的副本：对于有意保持与较旧 OpenClaw 主机兼容的仅插件发布，应将下限保持为支持的最旧主机 API，并在插件发布证明中记录这一选择。
- 在批准发布前运行手动 `Full Release Validation` 工作流，从单一入口启动所有发布前测试环境。它接受分支、标签或完整提交 SHA，分派手动 `CI`，并分派 `OpenClaw Release Checks`，执行安装冒烟测试、软件包验收、跨操作系统软件包检查、QA Lab 一致性检查、Matrix 和 Telegram 通道。稳定版和完整运行始终包含详尽的实时/E2E 及 Docker 发布路径浸泡测试；保留 `run_release_soak=true`，用于显式执行 beta 浸泡测试。Package Acceptance 在候选版本验证期间提供规范的软件包 Telegram E2E，避免同时运行第二个实时轮询器。

  发布 beta 后提供 `release_package_spec`，以便在发布检查、Package Acceptance 和软件包 Telegram E2E 中复用已发布的 npm 软件包，而无需重新构建发布 tarball。仅当 Telegram 应使用与其余发布验证不同的已发布软件包时，才提供 `npm_telegram_package_spec`。当 Package Acceptance 应使用不同于发布软件包规范的已发布软件包时，提供 `package_acceptance_package_spec`。当发布证据报告需要证明验证结果与已发布的 npm 软件包一致、但不强制执行 Telegram E2E 时，提供 `evidence_package_spec`。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 当发布工作继续进行，而你希望为软件包候选版本取得旁路证明时，运行手动 `Package Acceptance` 工作流。对于 `openclaw@beta`、`openclaw@latest` 或确切发布版本，使用 `source=npm`；要使用当前 `workflow_ref` 测试框架打包受信任的 `package_ref` 分支、标签或 SHA，使用 `source=ref`；对于具有必需 SHA-256 和严格公共 URL 策略的公共 HTTPS tarball，使用 `source=url`；对于使用必需 `trusted_source_id` 和 SHA-256 的具名受信任来源策略，使用 `source=trusted-url`；对于由另一个 GitHub Actions 运行上传的 tarball，使用 `source=artifact`。

  该工作流将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当选定的 Docker 通道包含 `published-upgrade-survivor` 时，软件包产物是候选版本，而 `published_upgrade_survivor_baseline` 用于选择已发布的基线。`update-restart-auth` 将候选软件包同时用作已安装的 CLI 和待测试软件包，从而测试候选版本更新命令的托管重启路径。

  示例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：不包含 OpenWebUI 或实时 ClawHub 的产物原生软件包/更新/重启/插件通道
  - `product`：软件包配置，加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes`，用于聚焦重新运行

- 当你只需要对发布候选版本执行确定性的常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分派会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、已构建产物冒烟检查、文档检查、Python Skills、Windows、macOS 和 Control UI 国际化通道。独立的手动 CI 运行仅在使用 `include_android=true` 分派时运行 Android；`Full Release Validation` 会将该输入传递给其 CI 子工作流。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器运行 QA Lab，并验证跟踪、指标和日志导出，以及受限的跟踪属性和内容/标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 验证收集器兼容性时运行 `pnpm qa:otel:collector-smoke`。它先通过真实的 OpenTelemetry Collector Docker 容器路由同一份 QA Lab OTLP 导出，再执行本地接收器断言。
- 验证受保护的 Prometheus 抓取时运行 `pnpm qa:prometheus:smoke`。它会运行 QA Lab、拒绝未经身份验证的抓取，并验证发布关键指标系列不包含提示词内容、原始标识符、身份验证令牌和本地路径。
- 运行 `pnpm qa:observability:smoke`，依次执行源码检出环境中的 OpenTelemetry 和 Prometheus 冒烟测试通道。
- 在每次带标签的发布前运行 `pnpm release:check`。
- `OpenClaw NPM Release` 预检会在打包 npm tarball 前生成依赖项发布证据。npm 公告漏洞门禁会阻止发布。传递性清单风险、依赖项所有权/安装表面积以及依赖项变更报告仅作为发布证据。依赖项变更报告会比较发布候选版本与上一个可达的发布标签。预检将依赖项证据上传为 `openclaw-release-dependency-evidence-<tag>`，并将其嵌入已准备的 npm 预检产物内的 `dependency-evidence/` 下。真实发布路径会复用该预检产物，然后将同一份证据以 `openclaw-<version>-dependency-evidence.zip` 的形式附加到 GitHub 发布中。
- 标签存在后，运行 `OpenClaw Release Publish` 执行会产生变更的发布序列。从受信任的 `main` 分派常规 beta 和稳定版发布；发布标签仍用于选择确切的目标提交，并且可以指向 `release/YYYY.M.PATCH`。Tideclaw alpha 发布仍保留在对应的 alpha 分支上。传入成功的 OpenClaw npm `preflight_run_id`、成功的 `full_release_validation_run_id` 和确切的 `full_release_validation_run_attempt`，并保持默认插件发布范围 `all-publishable`，除非你有意执行聚焦修复。该工作流会依次执行插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心软件包不会早于其外置插件发布；Windows 和 Android 推广会与针对发布草稿页面的核心 npm 发布并发运行。发布重新运行可断点续作：对于已发布的核心 npm 版本，在工作流证明注册表中的 tarball 与标签的预检产物匹配后，会跳过核心分派；当发布已包含经过验证的产物契约时，也会跳过 Windows/Android 推广，因此重试只会重新执行失败的阶段。聚焦的仅插件修复需要设置 `plugin_publish_scope=selected`，并提供非空插件列表。仅插件的 `all-publishable` 运行要求完整且不可变的预检和 Full Release Validation 证据；不接受部分证据。
- 稳定版 `OpenClaw Release Publish` 要求在对应的非预发布 `openclaw/openclaw-windows-node` 发布存在后提供确切的 `windows_node_tag`，以及候选版本已批准的 `windows_node_installer_digests` 映射。在分派任何发布子工作流前，它会验证源发布已发布、不是预发布版本、包含所需的 x64/ARM64 安装程序，并且仍与已批准的映射匹配。随后，它会在 OpenClaw 发布仍处于草稿状态时分派 `Windows Node Release`，并原样携带固定的安装程序摘要映射。子工作流会从该确切标签下载已签名的 Windows Hub 安装程序，将其与固定摘要进行匹配，在 Windows 运行器上验证其 Authenticode 签名使用预期的 OpenClaw Foundation 签名者，写入 SHA-256 清单，并将安装程序和清单上传至规范的 OpenClaw GitHub 发布；然后重新下载已推广的产物，并验证清单成员关系和哈希值。父工作流会在发布前验证当前的 x64、ARM64 和校验和产物契约。直接恢复会先拒绝意外的 `OpenClawCompanion-*` 产物名称，再使用固定的源字节替换预期的契约产物。

  仅在恢复时手动分派 `Windows Node Release`，并始终传入确切标签，绝不能传入 `latest`；同时传入来自已批准源发布的显式 `expected_installer_digests` JSON 映射。网站下载链接应指向当前稳定版发布的确切 OpenClaw 发布产物 URL，或者仅在确认 GitHub 的最新版本重定向指向同一发布后使用 `releases/latest/download/...`；不要只链接到配套仓库的发布页面。

- 发布检查现在通过一个单独的手动工作流运行：`OpenClaw Release Checks`。它还会在发布审批前运行 QA Lab 模拟一致性通道、快速实时 Matrix 配置，以及 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你希望并行运行完整的 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨操作系统安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。这种拆分是有意为之：让真实的 npm 发布路径保持简短、确定且专注于制品，同时将较慢的实时检查留在其独立通道中，使其不会拖延或阻塞发布。
- 涉及机密信息的发布检查应通过 `Full Release Validation` 调度，或从 `main`/发布工作流引用调度，以确保工作流逻辑和机密信息始终受控。
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，前提是解析出的提交可从 OpenClaw 分支或发布标签访问。
- `OpenClaw NPM Release` 的仅验证预检也接受当前工作流分支完整的 40 字符提交 SHA，无需已推送的标签。此 SHA 路径仅用于验证，不能升级为真实发布。在 SHA 模式下，工作流仅为软件包元数据检查合成 `v<package.json version>`；真实发布仍需要真实的发布标签。
- 两个工作流都将真实发布和推广路径保留在 GitHub 托管的运行器上，而非变更型验证路径可以使用规格更大的 Blacksmith Linux 运行器。
- 该工作流使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 这两个工作流机密信息运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`。
- npm 发布预检不再等待单独的发布检查通道。
- 在本地为候选版本打标签之前，运行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此辅助工具会依次运行快速发布防护检查、插件 npm/ClawHub 发布检查、构建、UI 构建和 `release:openclaw:npm:check`，以便在 GitHub 发布工作流启动前发现常见的审批阻塞错误。
- 在审批前运行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或对应的预发布/修正版标签）。
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或对应的 beta/修正版版本），以在全新的临时前缀中验证已发布注册表软件包的安装路径。
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约式 Telegram 凭据池，针对已发布的 npm 软件包验证已安装软件包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭据。
- 要从维护者机器运行完整的发布后 beta 冒烟测试，请使用 `pnpm release:beta-smoke -- --beta betaN`。此辅助工具会运行 Parallels npm 更新/全新目标验证，调度 `NPM Telegram Beta E2E`，轮询对应的工作流运行，下载制品，并输出 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行相同的发布后检查。该工作流特意仅允许手动运行，不会在每次合并时运行。
- 维护者发布自动化采用“先预检，再推广”的方式：
  - 真实 npm 发布必须提供成功的 npm `preflight_run_id`。
  - 常规 beta 和稳定版发布编排及预检使用可信的 `main`，并针对确切的目标标签运行。Tideclaw alpha 发布和预检使用对应的 alpha 分支。
  - 稳定版 npm 发布默认使用 `beta`；可通过工作流输入显式指定稳定版 npm 发布以 `latest` 为目标。
  - 基于令牌的 npm dist-tag 变更位于 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而源代码仓库继续仅使用 OIDC 发布。
  - 公开的 `macOS Release` 仅用于验证；当标签仅存在于发布分支上、但工作流从 `main` 调度时，请设置 `public_release_branch=release/YYYY.M.PATCH`。
  - 真实 macOS 发布必须提供成功的 macOS `preflight_run_id` 和 `validate_run_id`。
  - 真实发布路径会推广已准备好的制品，而不是再次重新构建。
- 对于 `YYYY.M.PATCH-N` 这样的稳定修正版发布，发布后验证器还会检查从 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同临时前缀升级路径，从而防止发布修正悄然使旧的全局安装继续使用基础稳定版载荷。
- 除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，否则 npm 发布预检会以关闭方式失败，以免再次发布空白的浏览器仪表板。
- 发布后验证还会检查已安装的注册表布局中是否存在已发布的插件入口点和软件包元数据。若某个版本缺少插件运行时载荷，发布后验证器将失败，且该版本无法推广为 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack 的 `unpackedSize` 预算，从而让安装器 E2E 在发布流程开始前捕获意外的软件包体积膨胀。
- 如果发布工作涉及 CI 规划、扩展计时清单或扩展测试矩阵，请在审批前重新生成并审查 `.github/workflows/plugin-prerelease.yml` 中由规划器负责的 `plugin-prerelease-extension-shard` 矩阵输出，以免发布说明描述过时的 CI 布局。
- 稳定版 macOS 发布就绪检查还包括更新器相关表面：GitHub 发布最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`；发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip（macOS 发布工作流会自动提交此更改，或在无法直接推送时创建 appcast PR）；已打包的应用必须保留非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`。

## 发布测试环境

`Full Release Validation` 是操作员从单一入口启动所有发布前测试的方式。要在快速变化的分支上提供固定提交证明，请使用辅助工具，使每个子工作流都从一个临时分支运行；该分支固定在某个可信的 `main` 工作流 SHA，而请求的提交仍作为待测试候选版本：

```bash
pnpm ci:full-release --sha <full-sha>
```

此辅助工具会获取当前的 `origin/main`，在该可信工作流提交上推送 `release-ci/<workflow-sha>-...`，从临时分支调度 `Full Release Validation` 并传入 `ref=<target-sha>`，在可用时复用严格匹配目标的证据，验证每个子工作流的 `headSha` 都与固定的父工作流 SHA 匹配，然后删除临时分支。传入 `-f reuse_evidence=false` 可强制全新运行，或传入 `--workflow-sha <trusted-main-sha>` 固定到仍可从当前 `origin/main` 访问的旧提交。工作流本身绝不会写入仓库引用。这样既能使用仅存在于 `main` 的发布工具，又无需向候选版本添加工具提交，并且可以避免意外使用较新的 `main` 子工作流运行作为证明。

对于发布分支或标签验证，请从可信的 `main` 工作流引用运行，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

该工作流解析目标引用，使用 `target_ref=<release-ref>` 调度手动 `CI`，然后调度 `OpenClaw Release Checks`。`OpenClaw Release Checks` 会扇出运行安装冒烟测试、跨操作系统发布检查、启用浸泡测试时的实时/E2E Docker 发布路径覆盖、包含规范 Telegram 软件包 E2E 的 Package Acceptance、QA Lab 一致性检查、实时 Matrix 和实时 Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 均成功时，完整/全部运行才可接受；但有意跳过独立 `Plugin Prerelease` 子工作流的聚焦重跑除外。仅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 聚焦重跑已发布软件包时，才使用独立的 `npm-telegram` 子工作流。最终验证器摘要包含每个子工作流运行的最慢作业表，因此发布经理无需下载日志即可查看当前关键路径。

在此发布路径中，product-performance 子工作流仅生成制品。总控工作流使用 `publish_reports=false` 调度它；除非其“仅制品”防护检查证明 Clawgrit 报告发布器保持跳过状态，否则验证将被拒绝。

有关完整阶段矩阵、确切的工作流作业名称、稳定版与完整配置之间的差异、制品和聚焦重跑参数，请参阅[完整发布验证](/zh-CN/reference/full-release-validation)。

子工作流从运行 `Full Release Validation` 的可信引用调度，通常为 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。每个子工作流运行都必须使用与父工作流完全相同的 SHA；如果 `main` 在子工作流调度解析完成前已推进，总控工作流会以关闭方式失败。`Full Release Validation` 没有单独的工作流引用输入；应通过选择工作流运行引用来选择可信的测试框架。不要使用 `--ref main -f ref=<sha>` 对不断变化的 `main` 进行精确提交证明；原始提交 SHA 不能作为工作流调度引用，因此请使用 `pnpm ci:full-release --sha <target-sha>` 在可信 `origin/main` 上创建临时分支，同时将目标 SHA 保留为候选输入。

使用 `release_profile` 选择实时测试/提供商覆盖范围：

- `minimum`：速度最快的发布关键 OpenAI/核心实时及 Docker 路径
- `stable`：在 minimum 基础上增加用于发布审批的稳定提供商/后端覆盖
- `full`：在 stable 基础上增加广泛的建议性提供商/媒体覆盖

稳定版和完整验证在推广前始终运行详尽的实时/E2E、Docker 发布路径及有界的已发布版本升级存活扫描。对于 beta，可使用 `run_release_soak=true` 请求运行同一组扫描。该扫描覆盖最新四个稳定版软件包、固定的 `2026.4.23` 和 `2026.5.2` 基线，以及更早的 `2026.4.15` 覆盖；它会移除重复基线，并将每个基线分片到各自独立的 Docker 运行器作业中。

`OpenClaw Release Checks` 使用可信工作流引用，将目标引用一次性解析为 `release-package-under-test`，并在运行浸泡测试时，于跨操作系统检查、Package Acceptance 和发布路径 Docker 检查中复用该制品。这样可以确保所有面向软件包的测试环境使用完全相同的字节，并避免重复构建软件包。beta 已发布到 npm 后，设置 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，使发布检查仅下载一次已发布的软件包，从 `dist/build-info.json` 提取其构建源 SHA，并在跨操作系统检查、Package Acceptance、发布路径 Docker 和软件包 Telegram 通道中复用该制品。

当设置了仓库/组织变量时，跨操作系统 OpenAI 安装冒烟测试使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.6-luna`，因为该通道旨在验证软件包安装、新手引导、Gateway 网关启动和一次实时智能体轮次，而不是对最强大的模型进行基准测试。更广泛的实时提供商矩阵仍是进行特定模型覆盖的场所。

请根据发布阶段使用以下变体：

```bash
# 验证未发布的候选发布分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# 验证已推送的确切提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 发布 beta 版本后，添加基于已发布软件包的 Telegram E2E。
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

针对性修复后的首次重新运行不要使用完整总控流程。如果某个验证箱失败，下一次验证应使用失败的子工作流、作业、Docker 通道、软件包配置、模型提供商或 QA 通道。只有当修复更改了共享发布编排，或导致之前所有验证箱的证据失效时，才再次运行完整总控流程。总控流程的最终验证器会重新检查已记录的子工作流运行 ID，因此成功重新运行子工作流后，只需重新运行失败的 `Verify full validation` 父作业。

仅当先前成功的总控流程运行验证了完全相同的目标 SHA、发布配置、实际浸泡测试设置和验证输入时，`rerun_group=all` 才可以复用该运行。这是一种用于重新运行同一候选版本的有限恢复机制，而不是跨 SHA 复用证据。对于发生更改的候选版本，包括仅更改变更日志或版本的提交，应重新运行受更改路径或产物哈希影响的每个软件包、产物、安装、Docker 或提供商门禁。同一 `release/*` 引用和重新运行组的较新总控流程运行会自动取代仍在进行的旧运行。传入 `reuse_evidence=false` 可强制执行全新的完整运行。

进行有限恢复时，将 `rerun_group` 传给总控流程。`all` 是真正的候选发布运行，`ci` 仅运行常规 CI 子工作流，`plugin-prerelease` 仅运行发布专用插件子工作流，`release-checks` 运行所有发布验证箱，而更细分的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。针对性的 `npm-telegram` 重新运行需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整运行和 `all` 运行使用 Package Acceptance 中的规范软件包 Telegram E2E。针对性的跨操作系统重新运行可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他操作系统/测试套件过滤器。QA 发布检查失败会阻止常规发布验证，包括标准层级中必需的 OpenClaw 动态工具漂移检查。Tideclaw alpha 运行仍可将不涉及软件包安全的发布检查通道视为建议性检查。使用 `release_profile=beta` 时，`Run repo/live E2E validation` 的实时提供商测试套件属于建议性检查（产生警告，但不阻断）；stable 和 full 配置仍将其视为阻断项。当 `live_suite_filter` 明确请求受门禁控制的 QA 实时通道（例如 Discord、WhatsApp 或 Slack）时，必须启用相应的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 仓库变量；否则输入捕获会失败，而不是静默跳过该通道。

### Vitest

Vitest 验证箱是手动 `CI` 子工作流。手动 CI 会有意绕过更改范围限定，并为候选发布版本强制运行常规测试图：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物冒烟检查、文档检查、Python Skills、Windows、macOS 以及 Control UI 国际化。当 `Full Release Validation` 运行该验证箱时会包含 Android，因为总控流程会传入 `include_android=true`；独立手动 CI 需要设置 `include_android=true` 才能覆盖 Android。

使用此验证箱回答“源代码树是否通过了完整的常规测试套件？”它与发布路径的产品验证并不相同。应保留以下证据：

- 显示已分派 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 针对确切目标 SHA 成功完成的 `CI` 运行
- 调查回归时 CI 作业中失败或缓慢的分片名称
- 运行需要性能分析时，`.artifacts/vitest-shard-timings.json` 等 Vitest 计时产物

仅当发布需要确定性的常规 CI，而不需要 Docker、QA Lab、实时、跨操作系统或软件包验证箱时，才直接运行手动 CI。非 Android 的直接 CI 使用第一条命令。当直接候选发布 CI 必须覆盖 Android 时，添加 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 验证箱位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 运行，并包括发布模式的 `install-smoke` 工作流。它通过打包后的 Docker 环境验证候选发布版本，而不仅仅执行源代码级测试。

发布版 Docker 覆盖范围包括：

- 启用较慢 Bun 全局安装冒烟测试的完整安装冒烟测试
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并将二维码、根目录/Gateway 网关以及安装程序/Bun 冒烟作业作为独立的 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`
- 请求时在专用大磁盘运行器上执行 OpenWebUI 覆盖
- 拆分后的内置插件安装/卸载通道 `bundled-plugin-install-uninstall-0` 至 `bundled-plugin-install-uninstall-23`
- 发布检查包含实时测试套件时的实时/E2E 提供商测试套件和 Docker 实时模型覆盖

重新运行前先使用 Docker 产物。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重新运行命令。进行针对性恢复时，在可复用的实时/E2E 工作流中使用 `docker_lanes=<lane[,lane]>`，而不是重新运行所有发布分块。生成的重新运行命令会在可用时包含之前的 `package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 验证箱也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，与 Vitest 和 Docker 软件包机制相互独立。

发布版 QA Lab 覆盖范围包括：

- 使用智能体一致性测试包，将 OpenAI 候选通道与 `anthropic/claude-opus-4-8` 基线进行比较的模拟一致性通道
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要明确的本地验证时，运行 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此验证箱回答“该发布版本在 QA 场景和实时渠道流程中是否行为正确？”批准发布时，应保留一致性、Matrix 和 Telegram 通道的产物 URL。完整 Matrix 覆盖仍可通过手动分片 QA-Lab 运行获得，而不是作为默认的发布关键通道。

### 软件包

软件包验证箱是可安装产品的门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选版本规范化为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将工作流工具链引用与软件包源引用分开保存。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或确切的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` 工具链打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载公共 HTTPS `.tgz`，并要求提供 `package_sha256`；URL 凭据、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析地址，以及不安全的重定向都会被拒绝
- `source=trusted-url`：下载 HTTPS `.tgz`，并要求提供 `package_sha256`，以及来自 `.github/package-trusted-sources.json` 中命名策略的 `trusted_source_id`；对于维护者拥有的企业镜像或私有软件包仓库，应使用此来源，而不是向 `source=url` 添加输入级私有网络绕过机制
- `source=artifact`：复用由另一次 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布软件包产物、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 针对同一个已解析 tarball 保留迁移、更新、根用户管理的 VPS 升级、已配置身份验证的更新重启、实时 ClawHub 技能安装、陈旧插件依赖清理、离线插件固件、插件更新、插件命令绑定转义加固和 Telegram 软件包 QA。阻断式发布检查使用默认的最新已发布软件包基线；设置 `run_release_soak=true` 的 beta 配置、`release_profile=stable` 或 `release_profile=full` 会将已发布版本升级存活测试扩展到 `last-stable-4`，以及固定的 `2026.4.23`、`2026.5.2` 和 `2026.4.15` 基线，并包含 `reported-issues` 场景。对于已发布的候选版本，使用带有 `source=npm` 的 Package Acceptance；对于发布前基于 SHA 的本地 npm tarball，使用 `source=ref`；对于维护者拥有的企业/私有镜像，使用 `source=trusted-url`；对于由另一次 GitHub Actions 运行上传的已准备 tarball，使用 `source=artifact`。

它是 GitHub 原生的替代方案，可取代此前大部分需要 Parallels 的软件包/更新覆盖。跨操作系统发布检查对于特定操作系统的新手引导、安装程序和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范检查清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定使用哪个本地、Docker、Package Acceptance 或发布检查通道来验证插件安装/更新、Doctor 清理或已发布软件包迁移更改时，请使用该清单。针对从每个稳定版 `2026.4.23+` 软件包进行的全面已发布更新迁移，使用单独的手动 `Update Migration` 工作流，它不属于 Full Release CI。

旧版 package-acceptance 宽松规则有意设置了时间限制。直至 `2026.4.25` 的软件包可以针对已经发布到 npm 的元数据缺失使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少 `gateway install --wrapper`、从 tarball 派生的 git 固件中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少市场安装记录持久化，以及在 `plugins update` 期间进行配置元数据迁移。已发布的 `2026.4.26` 软件包可以针对已经交付的本地构建元数据标记文件发出警告。后续软件包必须满足现代软件包契约；同样的问题会导致发布验证失败。

当发布问题涉及实际可安装的软件包时，使用范围更广的 Package Acceptance 配置：

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

- `smoke`：快速的软件包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：安装/更新/重启/插件软件包契约，以及实时 ClawHub Skill 安装证明；这是发布检查的默认选项
- `product`：`package`，加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于定向重新运行的精确 `docker_lanes` 列表

对于候选软件包的 Telegram 验证，请在 Package Acceptance 中启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将解析后的 `package-under-test` tarball 传入 Telegram 通道；独立的 Telegram 工作流仍接受已发布的 npm 规格，用于发布后检查。

## 常规发布自动化

对于 beta、`latest`、插件、GitHub Release 和平台发布，`OpenClaw Release Publish` 是常规的变更入口点。每月 `.33+` 的仅 npm 扩展稳定版路径不使用此编排器。常规工作流按发布所需顺序编排可信发布者工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达（对于 alpha 预发布，也可从 Tideclaw alpha 分支到达）。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同的范围和 SHA 分派 `Plugin ClawHub Release`。
6. 验证已保存的 `full_release_validation_run_id` 及精确的运行尝试次数后，使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。
7. 对于稳定版发布，将 GitHub Release 创建或更新为草稿，使用显式的 `windows_node_tag` 和候选版本已批准的 `windows_node_installer_digests` 分派 `Windows Node Release`，并验证规范的 Windows 安装程序/校验和资产。同时分派 `Android Release`，构建与精确标签对应的已签名 APK、校验和及来源证明。在发布草稿前验证这两项原生资产契约。

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

将稳定版发布到默认的 beta dist-tag：

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

仅在定向修复或重新发布时使用较底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。当 `publish_openclaw_npm=true` 时，`OpenClaw Release Publish` 会拒绝 `plugin_publish_scope=selected`，以防核心软件包在未包含所有可发布的官方插件（包括 `@openclaw/diffs-language-pack`）时发布。对于指定插件的修复，请设置 `publish_openclaw_npm=false`、`plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或者直接分派子工作流。

首次发布时的 ClawHub 引导是例外：从可信的 `main` 分派 `Plugin ClawHub New`，并通过 `ref` 传入完整的目标发布 SHA。绝不要从发布标签或分支运行引导工作流本身：

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

标签前验证要求 `dry_run=true`，拒绝发布标签和父运行输入，并且仅接受可从 `main` 或 `release/*` 到达的精确目标。它不会加载 ClawHub 凭据、发布软件包字节或更改可信发布者配置。该工作流仍会解析实时注册表计划，仅在无密钥作业中检出并打包目标，具现化锁定的 ClawHub 工具链，并在发布标签存在前验证不可变制品及软件包 slug/身份。仅在无密钥打包作业完成后才批准 `clawhub-plugin-bootstrap` 环境；这个受保护的验证作业没有凭据或变更命令。

已批准的试运行或标签创建后的实际引导必须包含精确的发布标签，以及父级 `OpenClaw Release Publish` 的运行 ID、尝试次数和分支。父级会证明自身的工作流 SHA，以及用于 `Plugin ClawHub New` 的另一个精确可信 `main` SHA；子运行和每项受保护环境审批都必须与该已批准的子级 SHA 匹配。每次发布尝试和可信发布者变更前，都会重新检查发布标签。

打包作业会上传一个不可变制品，其名称、Actions 制品 ID/摘要、生产者运行/尝试次数、目标 SHA，以及每个软件包 tarball 的 SHA-256/大小都会传递到验证作业和受保护作业中。受保护作业只检出可信的 `main` 工具，通过 GitHub API 验证制品元组，按精确制品 ID 下载，重新计算每个 tarball 的哈希值，并使用固定版本 CLI 的 USTAR 规范化规则验证本地 TAR 路径和软件包身份。随后，每个候选项都必须通过固定版本 CLI 的发布试运行；该试运行会在查询注册表或进行身份验证前返回。凭据作业的预筛选将压缩后的 ClawPack 限制为 120 MiB、文件载荷总量限制为 50 MiB、展开后的 TAR 数据限制为 64 MiB，TAR 条目数限制为 10,000。现有软件包的可信发布者修复仍仅执行配置，但它依然会打包目标，并要求请求的标签与注册表中的精确字节和元数据完全一致，之后才更改可信发布者配置。发布后验证会下载 ClawHub 制品，并要求 SHA-256 和大小保持一致。仅当精确的生产者作业成功完成时，重新运行失败作业的恢复流程才能复用较早尝试中的软件包制品。最终证据还会绑定锁定的 ClawHub 版本、锁文件 SHA-256 和 npm 完整性值。任何不匹配都要求使用新的软件包版本。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；当 `preflight_only=true` 时，它也可以是当前工作流分支的完整 40 字符提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅执行验证/构建/打包，`false` 表示执行实际发布路径
- `preflight_run_id`：现有的成功预检运行 ID；实际发布路径必须提供，以便工作流复用已准备的 tarball，而不是重新构建
- `full_release_validation_run_id`：此标签/SHA 对应的成功 `Full Release Validation` 运行 ID，实际发布时必需。Beta 发布可以仅凭预检继续并发出警告，但稳定版/`latest` 提升仍然要求提供此项。
- `full_release_validation_run_attempt`：与 `full_release_validation_run_id` 配对的精确正整数运行尝试次数；只要提供了运行 ID，就必须提供此项，以防重新运行在发布期间更改授权证据。
- `release_publish_run_id`：已批准的 `OpenClaw Release Publish` 运行 ID；当此工作流由该父级分派时（机器人操作者的实际发布调用）必须提供
- `plugin_npm_run_id`：成功且与精确头部提交对应的 `Plugin NPM Release` 运行 ID；实际发布 `extended-stable` 核心软件包时必须提供
- `npm_dist_tag`：发布路径的 npm 目标标签；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，默认为 `beta`。最终补丁版本 `33` 及以上必须使用 `extended-stable`；默认情况下，`extended-stable` 会拒绝更早的补丁版本，并且始终拒绝非最终标签。
- `bypass_extended_stable_guard`：仅用于测试的布尔值，默认为 `false`；与 `npm_dist_tag=extended-stable` 一起使用时，会绕过每月扩展稳定版资格检查，同时保留发布身份、制品、审批和回读检查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 以使用现有发布行为，或接受 `npm_dist_tag=extended-stable` 以使用受保护的每月发布路径。扩展稳定版选项要求 `publish_scope=all-publishable`、`plugins` 输入为空、最终补丁版本不低于 `33`，并且规范的 `extended-stable/YYYY.M.33` 分支必须正好位于其精确顶端。它绝不会移动插件的 `latest` 或 `beta` 标签。新软件包版本会通过 OIDC 可信发布以原子方式获得 `extended-stable`（`npm publish --tag extended-stable`）；此源工作流不使用基于令牌身份验证的 `npm dist-tag add`。重试会跳过 npm 中已存在的精确版本，然后保持失败关闭状态，除非完整回读确认每个精确软件包及其 `extended-stable` 标签均已收敛。

`OpenClaw Release Publish` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 时必须提供
- `full_release_validation_run_id`：成功的 `Full Release Validation` 运行 ID；当 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 时必须提供
- `full_release_validation_run_attempt`：与 `full_release_validation_run_id` 配对的精确正整数尝试次数；只要提供了运行 ID，就必须提供
- `windows_node_tag`：精确的非预发布 `openclaw/openclaw-windows-node` 发布标签；发布 OpenClaw 稳定版时必须提供
- `windows_node_installer_digests`：候选版本已批准的紧凑 JSON 映射，将当前 Windows 安装程序名称映射到其固定的 `sha256:` 摘要；发布 OpenClaw 稳定版时必须提供
- `npm_telegram_run_id`：可选的成功 `NPM Telegram Beta E2E` 运行 ID，用于纳入最终发布证据
- `npm_dist_tag`：OpenClaw 软件包的 npm 目标标签，可选值为 `alpha`、`beta` 或 `latest`
- `plugin_publish_scope`：默认为 `all-publishable`；仅在 `publish_openclaw_npm=false` 的定向纯插件修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，以逗号分隔的 `@openclaw/*` 软件包名称
- `publish_openclaw_npm`：默认为 `true`；仅在将该工作流用作纯插件修复编排器时设为 `false`
- `release_profile`：用于发布证据摘要的发布覆盖配置；默认为 `from-validation`，即从验证清单中读取，也可使用 `beta`、`stable` 或 `full` 覆盖
- `wait_for_clawhub`：默认为 `false`，因此 npm 可用性不会被 ClawHub 辅助流程阻塞；仅当工作流完成必须包括 ClawHub 完成时才设为 `true`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。包含密钥的检查要求解析出的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：为 beta 发布检查启用详尽的实时/E2E、Docker 发布路径，以及覆盖所有历史版本的升级存活浸泡测试。当 `release_profile=stable` 或 `release_profile=full` 时会强制启用。

规则：

- 补丁版本低于 `33` 的常规正式版本和修正版可以发布到 `beta` 或 `latest`。补丁版本为 `33` 或更高的正式版本必须发布到 `extended-stable`，达到该边界时带修正后缀的版本会被拒绝。
- Beta 预发布标签只能发布到 `beta`；alpha 预发布标签只能发布到 `alpha`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 实际发布路径必须使用预检期间使用的同一 `npm_dist_tag`；工作流会在继续发布前验证该元数据

## 常规 beta/latest 稳定版发布流程

此旧版流程适用于常规编排式发布，该发布还负责插件、GitHub Release、Windows 和其他平台工作。它不是本页顶部所述的每月 `.33+` 仅 npm 扩展稳定版发布路径。

创建常规编排式稳定版时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。标签尚不存在时，可以使用当前完整的工作流分支提交 SHA，对预检工作流执行仅用于验证的试运行。
2. 对于常规的 beta 优先流程，选择 `npm_dist_tag=beta`；仅当你有意直接发布稳定版时才选择 `latest`。
3. 如果你希望通过一个手动工作流运行常规 CI，并覆盖实时提示词缓存、Docker、QA Lab、Matrix 和 Telegram，请在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`。如果你有意只需要确定性的常规测试图，请改为在发布引用上运行手动 `CI` 工作流。
4. 选择确切的非预发布 `openclaw/openclaw-windows-node` 发布标签，其已签名的 x64 和 ARM64 安装程序将随版本发布。将其保存为 `windows_node_tag`，并将这些安装程序经过验证的摘要映射保存为 `windows_node_installer_digests`。候选发布版辅助工具会记录两者，并将其包含在生成的发布命令中。
5. 保存成功的 `preflight_run_id`、`full_release_validation_run_id` 和确切的 `full_release_validation_run_attempt`。
6. 从受信任的 `main` 运行 `OpenClaw Release Publish`，传入相同的 `tag`、相同的 `npm_dist_tag`、所选的 `windows_node_tag`、已保存的 `windows_node_installer_digests`、`preflight_run_id`、`full_release_validation_run_id` 和 `full_release_validation_run_attempt`。它会先将外置插件发布到 npm 和 ClawHub，然后再提升 OpenClaw npm 软件包。
7. 如果版本发布到了 `beta`，请使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，将该稳定版本从 `beta` 提升到 `latest`。
8. 如果该版本有意直接发布到 `latest`，并且 `beta` 应立即指向同一个稳定构建，请使用同一发布工作流，将两个 dist-tag 都指向该稳定版本；也可以等待其定时自愈同步稍后移动 `beta`。

dist-tag 变更位于发布账本仓库中，因为它仍然需要 `NPM_TOKEN`，而源代码仓库只保留基于 OIDC 的发布。这样，直接发布路径和 beta 优先提升路径都会有文档记录，并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其保留在 tmux 中可让提示、警报和 OTP 处理过程保持可观察，并防止主机重复发出警报。

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
