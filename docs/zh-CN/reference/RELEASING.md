---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或包验收
    - 正在查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-02T17:33:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d58ea2416a3c1e129e5167c20b1c8c55eca581c9f811efee5722b5dfd336a85d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有四个公开发布通道：

- 稳定版：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- Alpha：发布到 npm `alpha` 的预发布标签
- Beta：发布到 npm `beta` 的预发布标签
- 开发版：`main` 的移动头部

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Alpha 预发布版本：`YYYY.M.D-alpha.N`
  - Git 标签：`vYYYY.M.D-alpha.N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升的稳定版 npm 发布版本
- `alpha` 表示当前 Alpha 安装目标
- `beta` 表示当前 Beta 安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，也可以稍后提升一个已审核的 Beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  Beta 发布通常会先验证并发布 npm/包路径，
  mac 应用构建/签名/公证默认保留给稳定版，除非明确请求

## 发布节奏

- 发布按 Beta 优先推进
- 只有在最新 Beta 验证通过后，稳定版才会跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  因此发布验证和修复不会阻塞 `main` 上的新开发
- 如果一个 Beta 标签已经被推送或发布并且需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧的 Beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者查看

## 发布操作员清单

此清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚详情保留在
仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 的状态足够绿色，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部的 `CHANGELOG.md` 区段，
   保持条目面向用户，提交并推送，然后在创建分支前再 rebase/pull 一次。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍被覆盖时移除已过期的
   兼容性；否则记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为目标标签更新所有必需的版本位置，运行
   `pnpm plugins:sync`，使可发布插件包共享该发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，用 `Full Release Validation` 启动所有预发布测试。这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、工作流作业、包配置、提供商或模型允许列表。只有当变更面使之前的证据失效时，才重新运行完整总控流程。
9. 对于 Alpha 或 Beta，标记 `vYYYY.M.D-alpha.N` 或 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，
   先将所有可发布插件包发布到 npm，其次将同一批发布到 ClawHub，然后使用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检产物。发布后，针对已发布的 `openclaw@YYYY.M.D-alpha.N`、`openclaw@alpha`、
   `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，切出下一个匹配的预发布编号；
   不要删除或重写旧的预发布。
10. 对于稳定版，只有在已审核的 Beta 或发布候选具备所需验证证据后才继续。稳定版 npm 发布也通过
    `OpenClaw Release Publish` 完成，通过
    `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还要求 `main` 上存在打包后的
    `.zip`、`.dmg`、`.dSYM.zip` 以及更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；
    在需要时进行 dist-tag 提升；基于完整匹配的 `CHANGELOG.md` 区段生成 GitHub 发布/预发布说明；并完成发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 也能在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI 包存在
- 在根版本号提升之后、打标签之前运行 `pnpm plugins:sync`。它会更新可发布插件包版本、OpenClaw 对等/API 兼容性元数据、构建元数据和插件变更日志占位内容，以匹配核心发布版本。`pnpm plugins:sync:check` 是非修改型发布守卫；如果忘记此步骤，发布工作流会在任何注册表变更之前失败。
- 在发布审批前运行手动 `Full Release Validation` 工作流，以便从单一入口点启动所有预发布测试箱。它接受分支、标签或完整提交 SHA，分派手动 `CI`，并为安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道分派 `OpenClaw Release Checks`。当 `release_profile=full` 且 `rerun_group=all` 时，它还会针对来自发布检查的 `release-package-under-test` 产物运行包 Telegram E2E。发布后，如果同一个 Telegram E2E 也应验证已发布的 npm 包，请提供 `npm_telegram_package_spec`。当私有证据报告应证明验证与已发布的 npm 包匹配、但不强制运行 Telegram E2E 时，请提供 `evidence_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续推进的同时为包候选版本提供旁路证明时，运行手动 `Package Acceptance` 工作流。对 `openclaw@alpha`、`openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选版本解析为 `package-under-test`，复用针对该 tarball 的 Docker E2E 发布调度器，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 对同一 tarball 运行 Telegram QA。当所选 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选版本，而 `published_upgrade_survivor_baseline` 会选择已发布基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常见配置档：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：产物原生的包/更新/插件通道，不包含 OpenWebUI 或 live ClawHub
  - `product`：包配置档，加上 MCP 渠道、cron/子智能体清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分派会绕过 changed 作用域，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，不需要 Opik、Langfuse 或其他外部采集器。
- 每次打标签发布前运行 `pnpm release:check`
- 标签存在后，为会产生变更的发布序列运行 `OpenClaw Release Publish`。从 `release/YYYY.M.D` 分派它（或在发布 main 可达标签时从 `main` 分派），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保持默认插件发布范围 `all-publishable`，除非你正在有意执行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会先于其外置插件发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock parity 门禁，以及快速 live Matrix 配置档和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你希望并行获得完整 Matrix 传输、媒体和 E2EE 清单时，请运行手动 `QA-Lab - All Lanes` 工作流，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨操作系统安装和升级运行时验证是公开 `OpenClaw Release Checks` 与 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径简短、确定且聚焦产物，同时让较慢的 live 检查保留在自己的通道中，避免拖慢或阻塞发布
- 携带密钥的发布检查应通过 `Full Release Validation` 分派，或从 `main`/发布工作流引用分派，以便工作流逻辑和密钥保持受控
- 只要解析出的提交可从 OpenClaw 分支或发布标签到达，`OpenClaw Release Checks` 就接受分支、标签或完整提交 SHA
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符的工作流分支提交 SHA，不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都将真实发布和提升路径保持在 GitHub 托管 runner 上，而非修改型验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版本），以在全新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭据池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭据。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行同一项发布后检查。它有意只允许手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - 稳定 npm 发布默认使用 `beta`
  - 稳定 npm 发布可以通过工作流输入显式指定目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，出于安全考虑，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支上但工作流从 `main` 分派时，请设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于 `YYYY.M.D-N` 这样的稳定修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，确保发布修正不会静默地让旧的全局安装停留在基础稳定载荷上
- npm 发布预检默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，这样我们就不会再次发布空浏览器仪表板
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装注册表布局中。发布如果缺少插件运行时载荷，就会使发布后验证器失败，且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布发布路径之前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件计时清单或插件测试矩阵，请在审批前重新生成并审查由规划器拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过期的 CI 布局
- 稳定 macOS 发布就绪性还包括更新器界面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定 zip
  - 打包应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及大于等于该发布版本的规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试箱

`Full Release Validation` 是操作员从单一入口点启动所有预发布测试的方式。对于快速移动分支上的固定提交证明，请使用该 helper，确保每个子工作流都从固定在目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支分派 `Full Release Validation` 并传入 `ref=<sha>`，验证每个子工作流 `headSha` 都匹配目标，然后删除临时分支。这样可以避免意外证明较新的 `main` 子运行。

对于发布分支或标签验证，请从可信的 `main` 工作流引用运行，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，派发带有 `target_ref=<release-ref>` 的手动 `CI`，派发 `OpenClaw Release Checks`，并在 `release_profile=full` 且 `rerun_group=all` 时或设置了 `npm_telegram_package_spec` 时派发独立软件包 Telegram E2E。随后，`OpenClaw Release Checks` 会扇出安装冒烟测试、跨 OS 发布检查、live/E2E Docker 发布路径覆盖、包含 Telegram 软件包 QA 的 Package Acceptance、QA Lab 对等性、live Matrix，以及 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 均成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要会包含每个子运行的最慢任务表，因此发布管理员无需下载日志即可看到当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、确切的工作流任务名称、stable 与 full 配置文件差异、制品，以及聚焦重跑句柄。
子工作流会从运行 `Full Release Validation` 的受信任 ref 派发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择受信任的 harness。不要在移动中的 `main` 上使用 `--ref main -f ref=<sha>` 来证明精确提交；原始提交 SHA 不能作为工作流派发 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/提供商广度：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的 advisory 提供商/媒体覆盖

`OpenClaw Release Checks` 使用受信任工作流 ref 将目标 ref 一次性解析为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该制品。这样可以让所有面向软件包的环境都使用相同字节，并避免重复构建软件包。
当设置了 repo/org 变量时，跨 OS OpenAI 安装冒烟测试使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该 lane 证明的是软件包安装、新手引导、Gateway 网关启动，以及一次 live 智能体轮次，而不是对最慢默认模型进行基准测试。更广泛的 live 提供商矩阵仍然是模型特定覆盖的地方。

根据发布阶段使用这些变体：

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
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
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在聚焦修复后的第一次重跑中使用完整 umbrella。如果某个 box 失败，请使用失败的子工作流、任务、Docker lane、软件包配置文件、模型提供商或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或使较早的全部 box 证据过期时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查已记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父任务。

对于有界恢复，请将 `rerun_group` 传给 umbrella。`all` 是真正的候选发布运行，`ci` 仅运行普通 CI 子项，`plugin-prerelease` 仅运行仅发布插件子项，`release-checks` 运行每个发布 box，较窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行使用 release-checks 软件包制品。

### Vitest

Vitest box 是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并强制对候选发布运行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用这个 box 回答“源代码树是否通过了完整的普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- 显示已派发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色的 `CI` 运行
- 调查回归时来自 CI 任务的失败或缓慢分片名称
- 当运行需要性能分析时，保留 Vitest 计时制品，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或软件包 box 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式 `install-smoke` 工作流运行。它通过打包的 Docker 环境验证候选发布，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟测试的完整安装冒烟测试
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，其中 QR、root/gateway 和 installer/Bun 冒烟任务作为单独 install-smoke 分片运行
- 仓库 E2E lane
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，`plugins-runtime-services` 分块中的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lane：从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live 套件时，包含 live/E2E 提供商套件和 Docker live 模型覆盖

重跑前先使用 Docker 制品。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON，以及重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备 Docker 镜像输入，因此失败的 lane 可以复用同一 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行为和渠道级发布门禁，独立于 Vitest 和 Docker 软件包机制。

发布 QA Lab 覆盖包括：

- 使用 agentic 对等性包，将 OpenAI 候选 lane 与 Opus 4.6 基线进行比较的模拟对等性门禁
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置文件
- 使用 Convex CI 凭据租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用这个 box 回答“发布在 QA 场景和 live 渠道流程中的行为是否正确？”批准发布时，请保留对等性、Matrix 和 Telegram lane 的制品 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键 lane。

### Package

Package box 是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支持。该解析器会将候选项规范化为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将工作流 harness ref 与软件包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会使用 `source=artifact`、已准备的发布软件包制品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一已解析 tarball 保持迁移、更新、过期插件依赖清理、离线插件 fixtures、插件更新，以及 Telegram 软件包 QA。它是大多数先前需要 Parallels 的软件包/更新覆盖的 GitHub 原生替代方案。跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。当决定哪个本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、Doctor 清理或已发布软件包迁移变更时，请使用它。从每个稳定 `2026.4.23+` 软件包进行的穷尽式已发布更新迁移是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽容性会有意设置时间边界。直到 `2026.4.25` 的软件包可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少私有 QA 清单条目，缺少 `gateway install --wrapper`，tarball 派生 git fixture 中缺少补丁文件，缺少持久化的 `update.channel`，旧版插件安装记录位置，缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 软件包可能会对已随包发布的本地构建元数据戳文件发出警告。后续软件包必须满足现代软件包契约；这些相同缺口会导致发布验证失败。

当发布问题与实际可安装软件包有关时，请使用更广泛的 Package Acceptance 配置文件：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见软件包配置文件：

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置热重载 lane
- `package`：不含 live ClawHub 的安装/更新/插件软件包契约；这是 release-check 默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于 package-candidate Telegram 验证，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会将解析后的
`package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍接受已发布的 npm spec，用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它会按照发布所需顺序编排 trusted-publisher 工作流：

1. 签出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 访问。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同的范围和 SHA 调度 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Alpha 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

稳定版发布到默认 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接将稳定版提升到 `latest` 需要显式指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在进行聚焦修复或重新发布工作时，才使用较低层级的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定的插件修复，请将
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`，或者在 OpenClaw 包不得发布时直接调度子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1`，或
  `v2026.4.2-alpha.1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必填，这样工作流会复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Publish` 接受以下由操作员控制的输入：

- `tag`：必填的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；
  当 `publish_openclaw_npm=true` 时必填
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认值为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，为逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认值为 `true`；仅在将该工作流用作仅插件修复编排器时设为 `false`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有 secret 的检查要求解析后的提交可从 OpenClaw 分支或发布标签访问。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Alpha 预发布标签只能发布到 `alpha`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定版 npm 发布流程

切稳定版 npm 发布时：

1. 运行带有 `preflight_only=true` 的 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整的工作流分支提交 SHA，对预检工作流执行仅验证的 dry run
2. 为常规 beta 优先流程选择 `npm_dist_tag=beta`，或者仅在你有意直接发布稳定版时选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加上实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外部化插件发布到 npm 和 ClawHub，再提升 OpenClaw npm 包
7. 如果发布落在 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个稳定构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或者让其定时自愈同步稍后移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然需要 `NPM_TOKEN`，而公共仓库保持仅使用 OIDC 发布。

这样可以让直接发布路径和 beta 优先提升路径都被记录，并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将其保留在 tmux 中，可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

## 公共参考

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
中的私有发布文档作为实际 runbook。

## 相关

- [发布渠道](/zh-CN/install/development-channels)
