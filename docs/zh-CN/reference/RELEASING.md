---
read_when:
    - 正在查找公共发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-03T18:24:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三条公开发布通道：

- 稳定版：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- 测试版：发布到 npm `beta` 的预发布标签
- 开发版：`main` 的移动头部

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- 测试版预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要给月份或日期补零
- `latest` 表示当前已提升的稳定版 npm 发布版本
- `beta` 表示当前的测试版安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升经过审查的测试版构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  测试版发布通常会先验证并发布 npm/package 路径，
  mac 应用构建/签名/公证默认留给稳定版，除非明确请求

## 发布节奏

- 发布按测试版优先推进
- 只有在最新测试版通过验证后，稳定版才会跟进
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  因此发布验证和修复不会阻塞 `main` 上的新开发
- 如果测试版标签已经推送或发布并且需要修复，维护者会切出
  下一个 `-beta.N` 标签，而不是删除或重新创建旧的测试版标签
- 详细发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作员清单

此清单展示发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅限维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新代码，确认目标提交已推送，
   并确认当前 `main` CI 足够绿色，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 小节，
   保持条目面向用户，提交它，推送它，并在创建分支前再次 rebase/pull。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍被覆盖时移除过期兼容性，
   或记录为什么有意继续保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为预期标签更新每个必需的版本位置，运行
   `pnpm plugins:sync`，让可发布的插件包共享发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 针对发布分支、标签或完整提交 SHA 启动所有预发布测试。
   这是四个大型发布测试环境的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、工作流任务、包配置、
   提供商或模型 allowlist。只有当变更面使先前证据失效时，才重新运行完整总控流程。
9. 对于测试版，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。
   它会验证 `pnpm plugins:sync:check`，先将所有可发布的插件包发布到 npm，
   再将同一组包作为 ClawPack npm-pack tarball 发布到 ClawHub，
   然后使用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检产物。发布后，
   针对已发布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切出下一个匹配的预发布编号；不要删除或重写旧的预发布。
10. 对于稳定版，只有在经过审查的测试版或候选发布具备所需验证证据后才继续。
    稳定版 npm 发布也通过
    `OpenClaw Release Publish`，并通过
    `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还要求
    打包好的 `.zip`、`.dmg`、`.dSYM.zip` 以及 `main` 上更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器，在需要发布后渠道证明时运行可选的独立已发布 npm Telegram E2E，
    在需要时执行 dist-tag 提升，基于完整匹配的 `CHANGELOG.md` 小节创建 GitHub 发布/预发布说明，
    并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 仍在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外保持通过
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保预期的 `dist/*` 发布产物和 Control UI 包存在，可用于打包验证步骤
- 在根版本号提升后、打标签前运行 `pnpm plugins:sync`。它会更新可发布插件包版本、OpenClaw peer/API 兼容性元数据、构建元数据和插件 changelog 存根，使其匹配核心发布版本。`pnpm plugins:sync:check` 是非变更式发布保护；如果忘记此步骤，发布工作流会在任何 registry 变更前失败。
- 在发布批准前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，调度手动 `CI`，并调度 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查生成的 `release-package-under-test` 产物运行包 Telegram E2E。发布后提供 `npm_telegram_package_spec`，当同一个 Telegram E2E 也应验证已发布的 npm 包时使用。发布后提供 `package_acceptance_package_spec`，当 Package Acceptance 应针对已发布的 npm 包而不是 SHA 构建产物运行其包/更新矩阵时使用。提供 `evidence_package_spec`，当私有证据报告应证明验证匹配某个已发布 npm 包、但不强制运行 Telegram E2E 时使用。示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行的同时，为包候选版本获取旁路证明时，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选版本解析为 `package-under-test`，复用 Docker E2E 发布调度器对该 tarball 运行，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 对同一个 tarball 运行 Telegram QA。当选中的 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选版本，而 `published_upgrade_survivor_baseline` 选择已发布基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置热重载通道
  - `package`：产物原生包/更新/插件通道，不包含 OpenWebUI 或 live ClawHub
  - `product`：包 profile 加上 MCP 渠道、cron/子智能体清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 调度会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 每次带标签发布前运行 `pnpm release:check`
- 标签存在后，运行 `OpenClaw Release Publish` 来执行会产生变更的发布序列。从 `release/YYYY.M.D` 调度它（或在发布 main 可达标签时从 `main` 调度），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保留默认插件发布范围 `all-publishable`，除非你有意执行聚焦修复。该工作流会串行执行插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会早于其外部化插件发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity 通道，以及快速 live Matrix profile 和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你希望并行获取完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径简短、确定且聚焦产物，同时让较慢的 live 检查留在自己的通道中，避免拖慢或阻塞发布
- 带密钥的发布检查应通过 `Full Release Validation` 调度，或从 `main`/release 工作流 ref 调度，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从某个 OpenClaw 分支或发布标签访问
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，无需推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都会让真实发布和提升路径保持在 GitHub 托管 runner 上，而非变更式验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/correction 标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/correction 版本），以在新的临时前缀中验证已发布 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭据池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性运行时可省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭据。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，在 GitHub Actions 中运行相同的发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支调度
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，出于安全考虑，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支但工作流从 `main` 调度时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于像 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器还会检查同一临时前缀中从 `YYYY.M.D` 到 `YYYY.M.D-N` 的升级路径，确保发布修正不会悄悄让旧的全局安装停留在基础稳定版载荷上
- npm 发布预检采用失败关闭策略，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` 载荷，以免我们再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装的 registry 布局中。缺少插件运行时载荷的发布会使 postpublish 验证器失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布发布路径前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件时序清单或插件测试矩阵，请在批准前重新生成并审查由 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪状态还包括更新器表面：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及等于或高于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作人员从一个入口点启动所有预发布测试的方式。对于快速变化分支上的固定提交证明，请使用该 helper，让每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支调度 `Full Release Validation` 并传入 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这避免了意外证明较新的 `main` 子运行。

对于发布分支或标签验证，请从可信的 `main` 工作流 ref 运行，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，使用 `target_ref=<release-ref>` 触发手动 `CI`，触发 `OpenClaw Release Checks`，为面向包的检查准备父级 `release-package-under-test` 构件，并在 `release_profile=full` 且 `rerun_group=all` 时，或在设置了 `npm_telegram_package_spec` 时，触发独立的包 Telegram E2E。随后，`OpenClaw Release
Checks` 会展开安装烟雾测试、跨 OS 发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab 奇偶校验、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 均成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则它会被跳过。最终验证器摘要会包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
有关完整阶段矩阵、确切工作流作业名称、stable 与 full 配置差异、构件以及聚焦重运行句柄，请参阅[完整发布验证](/zh-CN/reference/full-release-validation)。
子工作流会从运行 `Full Release
Validation` 的可信 ref（通常是 `--ref main`）触发，即使目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择可信 harness。不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 做精确提交证明；原始提交 SHA 不能作为工作流调度 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的咨询类提供商/媒体覆盖

`OpenClaw Release Checks` 使用可信工作流 ref 将目标 ref 一次性解析为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该构件。这会让所有面向包的环境使用相同字节，并避免重复构建包。
当设置了 repo/org 变量时，跨 OS OpenAI 安装烟雾测试会使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该 lane 证明的是包安装、新手引导、Gateway 网关启动和一次 live 智能体回合，而不是对最慢的默认模型做基准测试。更广泛的 live 提供商矩阵仍然是模型特定覆盖的位置。

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

在聚焦修复后的第一次重运行中，不要使用完整总括工作流。如果某个环境失败，请将失败的子工作流、作业、Docker lane、包配置、模型提供商或 QA lane 用作下一次证明。只有当修复更改了共享发布编排，或让之前的全环境证据变旧时，才再次运行完整总括工作流。总括工作流的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重运行后，只需重运行失败的 `Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传给总括工作流。`all` 是真正的候选发布运行，`ci` 仅运行常规 CI 子项，`plugin-prerelease` 仅运行仅发布插件子项，`release-checks` 运行每个发布环境，而更窄的发布组是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦的 `npm-telegram` 重运行需要 `npm_telegram_package_spec`；带 `release_profile=full` 的 full/all 运行会使用 release-checks 包构件。

### Vitest

Vitest 环境是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并为候选发布强制执行常规测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建烟雾测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个环境回答“源代码树是否通过了完整的常规测试套件？”它不同于发布路径产品验证。需要保留的证据：

- 显示已触发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- `CI` 在确切目标 SHA 上为绿色
- 调查回归时来自 CI 作业的失败或慢速分片名称
- 当运行需要性能分析时的 Vitest 计时构件，例如 `.artifacts/vitest-shard-timings.json`

只有当发布需要确定性的常规 CI，但不需要 Docker、QA Lab、live、跨 OS 或包环境时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 环境位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流实现。它通过打包的 Docker 环境验证候选发布，而不仅仅是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装烟雾测试的完整安装烟雾测试
- 按目标 SHA 准备/复用根 Dockerfile 烟雾镜像，其中 QR、root/gateway 和 installer/Bun 烟雾作业作为独立 install-smoke 分片运行
- 仓库 E2E lane
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时在 `plugins-runtime-services` 分块中的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lane：从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live 套件时的 live/E2E 提供商套件和 Docker live 模型覆盖

重运行前先使用 Docker 构件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重运行命令。对于聚焦恢复，在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重运行所有发布分块。生成的重运行命令会在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane 可以复用相同 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 环境也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- 使用智能体奇偶校验包，将 OpenAI 候选 lane 与 Opus 4.6 基线比较的 mock 奇偶校验 lane
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭据租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时的 `pnpm qa:otel:smoke`

使用这个环境回答“该发布在 QA 场景和 live 渠道流程中是否行为正确？”批准发布时，请保留奇偶校验、Matrix 和 Telegram lane 的构件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认发布关键 lane。

### 包

包环境是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流 harness ref 与包源 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或确切的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布包构件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一个已解析 tarball 保持迁移、更新、陈旧插件依赖清理、离线插件夹具、插件更新和 Telegram 包 QA。升级矩阵覆盖从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线；对已经发布的候选使用带 `source=npm` 的 Package Acceptance，或对发布前有 SHA 支撑的本地 npm tarball 使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，取代了之前大多数需要 Parallels 的包/更新覆盖。跨 OS 发布检查对 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、doctor 清理或已发布包迁移更改时，请使用它。从每个稳定 `2026.4.23+` 包进行穷尽的已发布更新迁移是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽容是有意限时的。到 `2026.4.25` 为止的包，可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少 `gateway install --wrapper`、从 tarball 派生的 git 夹具中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代包契约；同样的缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，请使用更广泛的 Package Acceptance 配置：

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

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置
  重新加载通道
- `package`：在不使用实时 ClawHub 的情况下检查安装/更新/插件软件包契约；这是 release-check
  默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web
  search 和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于软件包候选版本的 Telegram 验证，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会将解析得到的
`package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍接受已发布的 npm 规范用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它会按发布所需顺序
编排 trusted-publisher 工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 访问。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同的作用域和 SHA 调度 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 调度
   `OpenClaw NPM Release`。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

稳定版发布到默认的 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接提升稳定版到 `latest` 是显式操作：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用更底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定的插件修复，请将
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`，或者在不得发布 OpenClaw 软件包时直接调度子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作人员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的
  40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，以便工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Publish` 接受这些由操作人员控制的输入：

- `tag`：必需的发布标签；必须已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 id；
  当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 软件包的 npm 目标标签
- `plugin_publish_scope`：默认值为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，以逗号分隔的
  `@openclaw/*` 软件包名称
- `publish_openclaw_npm`：默认值为 `true`；仅在将该工作流用作仅插件修复编排器时设置为 `false`

`OpenClaw Release Checks` 接受这些由操作人员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签访问。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续之前验证该元数据

## 稳定版 npm 发布序列

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整的工作流分支提交 SHA 对预检工作流进行仅验证的试运行
2. 对于常规的 beta 优先流程，选择 `npm_dist_tag=beta`；仅当你有意直接发布稳定版时才选择 `latest`
3. 当你希望从一个手动工作流获得常规 CI 加实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，请在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外部化插件发布到 npm 和 ClawHub，然后再提升 OpenClaw npm 软件包
7. 如果发布落在 `beta` 上，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta` 应立即跟随同一个稳定版构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或者让它的定时自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布。

这会让直接发布路径和 beta 优先提升路径都被记录，并且对操作人员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话内运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将它保留在 tmux 内可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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
