---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 寻找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-06T09:50:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的移动头部

## 版本命名

- 稳定发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要对月份或日期补零
- `latest` 表示当前已提升的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定和稳定修正发布版本默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升一个已验证的 beta 构建
- 每个稳定 OpenClaw 发布版本都会同时发布 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/package 路径，mac 应用的构建/签名/公证
  除非明确请求，否则保留给稳定发布

## 发布节奏

- 发布按 beta 优先推进
- 只有在最新 beta 通过验证后，才会跟进稳定发布
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布且需要修复，维护者会切出下一个 `-beta.N` 标签，
  而不是删除或重新创建旧 beta 标签
- 详细的发布流程、审批、凭据和恢复说明仅限维护者查看

## 发布操作员清单

此清单是发布流程的公开形态。私有凭据、签名、公证、dist-tag 恢复和紧急回滚详情保留在
仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够绿色，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 部分，
   保持条目面向用户，提交并推送，然后在创建分支前再次 rebase/pull。
3. 检查 `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍被覆盖时才移除过期兼容性，
   或记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为目标标签更新每个必需的版本位置，运行
   `pnpm plugins:sync`，使可发布插件包共享发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试箱的唯一手动入口点：
   Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败文件、通道、工作流作业、包配置文件、提供商或模型允许列表。
   只有当变更表面使先前证据过期时，才重新运行完整总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的
   `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，
   并行将所有可发布插件包发布到 npm，以及将同一组发布到
   ClawHub，然后在插件 npm 发布成功后，立即使用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检产物。
   在 OpenClaw npm 发布时，ClawHub 发布可能仍在运行，但发布工作流在插件的两个发布路径和
   OpenClaw npm 发布路径全部成功完成之前不会结束。发布后，对已发布的
   `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切出下一个匹配的预发布编号；不要删除或重写旧预发布。
10. 对于稳定发布，只有在已验证的 beta 或候选发布版本拥有所需验证证据后才能继续。
    稳定 npm 发布也通过 `OpenClaw Release Publish` 进行，并通过
    `preflight_run_id` 复用成功的预检产物；稳定 macOS 发布就绪还需要
    `main` 上的已打包 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；
    在需要时进行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 部分撰写 GitHub 发布/预发布说明；
    并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 仍在更快的本地 `pnpm check` 门禁之外获得覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外保持通过
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI 包存在
- 在根版本号提升之后、打标签之前运行 `pnpm plugins:sync`。它会更新可发布的插件包版本、OpenClaw peer/API 兼容性元数据、构建元数据以及插件 changelog 存根，使其与核心发布版本一致。`pnpm plugins:sync:check` 是非变更型发布保护；如果忘记此步骤，发布工作流会在任何注册表变更之前失败。
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，调度手动 `CI`，并调度 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、跨 OS 包检查、QA Lab 一致性、Matrix 和 Telegram 通道。稳定版/默认运行会把详尽的 live/E2E 和 Docker 发布路径浸泡测试保留在 `run_release_soak=true` 之后；`release_profile=full` 会强制开启浸泡测试。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查生成的 `release-package-under-test` 产物运行包 Telegram E2E。发布后提供 `npm_telegram_package_spec`，可让同一 Telegram E2E 也验证已发布的 npm 包。发布后提供 `package_acceptance_package_spec`，可让 Package Acceptance 针对已发布的 npm 包而不是由 SHA 构建的产物运行其包/更新矩阵。提供 `evidence_package_spec` 时，私有证据报告会验证该验证结果匹配已发布的 npm 包，而无需强制运行 Telegram E2E。示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为包候选版本取得旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选项解析为 `package-under-test`，复用面向该 tarball 的 Docker E2E 发布调度器，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当选定的 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选项，`published_upgrade_survivor_baseline` 选择已发布的基线。`update-restart-auth` 将候选包同时用作已安装 CLI 和待测包，因此会覆盖候选更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：产物原生包/更新/重启/插件通道，不包含 OpenWebUI 或 live ClawHub
  - `product`：包配置，加上 MCP 渠道、cron/子智能体清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 调度会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部收集器。
- 每次打标签发布前运行 `pnpm release:check`
- 在标签存在后运行 `OpenClaw Release Publish`，执行会产生变更的发布序列。从 `release/YYYY.M.D` 调度它（或在发布 main 可达标签时从 `main` 调度），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保持默认插件发布范围 `all-publishable`，除非你是在有意执行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会早于其外置插件发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab 模拟一致性通道、快速 live Matrix 配置和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你希望并行获得完整 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真实 npm 发布路径保持短小、确定且聚焦产物，同时让较慢的 live 检查保留在自己的通道中，避免它们拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 或从 `main`/release 工作流 ref 调度，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，前提是解析后的提交可从 OpenClaw 分支或发布标签访问
- `OpenClaw NPM Release` 仅验证预检也接受当前完整的 40 字符工作流分支提交 SHA，而无需推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都会把真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更型验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查通道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正版标签）
- npm 发布后运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版版本），在新的临时前缀中验证已发布注册表安装路径
- beta 发布后运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租赁 Telegram 凭据池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭据。
- 要从维护者机器运行完整的 beta 发布后冒烟，请使用 `pnpm release:beta-smoke -- --beta betaN`。该辅助程序会运行 Parallels npm 更新/全新目标验证，调度 `NPM Telegram Beta E2E`，轮询精确的工作流运行，下载产物，并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行同一发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用“预检后提升”：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支调度
  - 稳定版 npm 发布默认指向 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式指向 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，用于提升安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支上，但工作流从 `main` 调度时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于 `YYYY.M.D-N` 这样的稳定修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，确保发布修正不会静默地让旧版全局安装停留在基础稳定版载荷上
- npm 发布预检会默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` 载荷，这样我们就不会再次发布空的浏览器仪表板
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装的注册表布局中。如果某次发布缺少插件运行时载荷，发布后验证器会失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 能在发布发布路径之前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件 timing manifests 或插件测试矩阵，请在批准前重新生成并审查 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过期的 CI 布局
- 稳定版 macOS 发布就绪性还包括更新器表面：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包的应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作人员从一个入口点启动所有预发布测试的方式。对于快速变化分支上的固定提交证明，请使用辅助程序，确保每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该辅助程序会推送 `release-ci/<sha>-...`，从该分支调度 `Full Release Validation` 并传入 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这样可以避免意外证明较新的 `main` 子运行。

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

该工作流会解析目标 ref，分发带有 `target_ref=<release-ref>` 的手动 `CI`，分发 `OpenClaw Release Checks`，为面向软件包的检查准备父级 `release-package-under-test` 制品，并在 `release_profile=full` 且 `rerun_group=all` 时，或设置了 `npm_telegram_package_spec` 时，分发独立的软件包 Telegram E2E。随后 `OpenClaw Release
Checks` 会扇出安装冒烟测试、跨 OS 发布检查、启用浸泡测试时的实时/E2E Docker 发布路径覆盖、包含 Telegram 软件包 QA 的 Package Acceptance、QA Lab parity、实时 Matrix 和实时 Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子级也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、确切工作流作业名称、stable 与 full 配置文件差异、制品，以及聚焦重跑句柄。
子工作流从运行 `Full Release
Validation` 的可信 ref 分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择可信的 harness。
不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 进行精确提交证明；原始提交 SHA 不能作为工作流分发 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择实时/提供商广度：

- `minimum`：最快的发布关键 OpenAI/核心实时和 Docker 路径
- `stable`：minimum 加上用于发布批准的 stable 提供商/后端覆盖
- `full`：stable 加上广泛的 advisory 提供商/媒体覆盖

当发布阻塞 lanes 已通过且你希望在推广前进行详尽的实时/E2E、Docker 发布路径和有界的已发布升级存活者扫描时，请将 `run_release_soak=true` 与 `stable` 一起使用。该扫描覆盖最新四个 stable 软件包，加上固定的 `2026.4.23` 和 `2026.5.2` 基线，再加上较旧的 `2026.4.15` 覆盖；会移除重复基线，并将每个基线分片到自己的 Docker runner 作业中。`full` 隐含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用可信工作流 ref 将目标 ref 解析一次为 `release-package-under-test`，并在运行浸泡测试时，在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该制品。这会让所有面向软件包的 boxes 使用同一份字节，并避免重复构建软件包。跨 OS OpenAI 安装冒烟测试在设置了 repo/org 变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该 lane 证明的是软件包安装、新手引导、Gateway 网关启动和一次实时智能体轮次，而不是对最慢默认模型进行基准测试。更广泛的实时提供商矩阵仍然是模型特定覆盖的位置。

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

不要把完整 umbrella 作为聚焦修复后的第一次重跑。如果一个 box 失败，请使用失败的子工作流、作业、Docker lane、软件包配置文件、模型提供商或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或使早先的全 box 证据失效时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的父级 `Verify full validation` 作业。

对于有界恢复，请将 `rerun_group` 传给 umbrella。`all` 是真正的发布候选运行，`ci` 只运行普通 CI 子级，`plugin-prerelease` 只运行仅发布插件子级，`release-checks` 运行每个发布 box，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 运行会使用 release-checks 软件包制品。聚焦的跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/套件过滤器。QA release-check 失败是 advisory；仅 QA 失败不会阻塞发布验证。

### Vitest

Vitest box 是手动 `CI` 子工作流。手动 CI 会刻意绕过变更作用域，并为发布候选强制执行常规测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个 box 回答“源代码树是否通过了完整的常规测试套件？”
它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已分发的 `CI` 运行 URL
- `CI` 在确切目标 SHA 上绿色通过
- 调查回归时来自 CI 作业的失败或慢分片名称
- 当某次运行需要性能分析时，保留 Vitest 计时制品，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的常规 CI，但不需要 Docker、QA Lab、实时、跨 OS 或软件包 boxes 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流执行。它通过打包的 Docker 环境验证发布候选，而不仅仅是源码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟测试的完整安装冒烟测试
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并将 QR、根/Gateway 网关、安装器/Bun 冒烟作业作为独立 install-smoke 分片运行
- 仓库 E2E lanes
- 发布路径 Docker chunks：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，在 `plugins-runtime-services` chunk 中提供 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lanes，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当 release checks 包含实时套件时，提供实时/E2E 提供商套件和 Docker 实时模型覆盖

重跑前先使用 Docker 制品。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用的实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布 chunks。生成的重跑命令会在可用时包含之前的 `package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的 lane 可以复用同一 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 软件包机制。

发布 QA Lab 覆盖包括：

- 使用智能体 parity 包，将 OpenAI 候选 lane 与 Opus 4.6 基线比较的 mock parity lane
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置文件
- 使用 Convex CI 凭证租约的实时 Telegram QA lane
- 当发布遥测需要明确的本地证明时，运行 `pnpm qa:otel:smoke`

使用这个 box 回答“发布在 QA 场景和实时渠道流程中是否行为正确？”
批准发布时，请保留 parity、Matrix 和 Telegram lanes 的制品 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键 lane。

### Package

Package box 是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。该解析器会将候选规范化为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将工作流 harness ref 与软件包源码 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或确切的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会使用 `source=artifact`、准备好的发布软件包制品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一个已解析的 tarball 保持迁移、更新、已配置凭证的更新重启、过期插件依赖清理、离线插件夹具、插件更新和 Telegram 软件包 QA。阻塞发布检查使用默认的最新已发布软件包基线；`run_release_soak=true` 或 `release_profile=full` 会扩展到从 `2026.4.23` 到 `latest` 的每个 stable npm 已发布基线，以及已报告问题的夹具。对已经交付的候选使用带 `source=npm` 的 Package Acceptance；发布前，对 SHA 支撑的本地 npm tarball 使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，替代了以前大多数需要 Parallels 的软件包/更新覆盖。跨 OS release checks 对 OS 特定的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪条本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、Doctor 清理或已发布软件包迁移变更时，请使用它。从每个 stable `2026.4.23+` 软件包进行详尽的已发布更新迁移，是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽容策略有意设置了时限。直到
`2026.4.25` 的包可以对已经发布到 npm 的元数据缺口使用兼容路径：
tarball 中缺少的私有 QA 库存条目、缺少的 `gateway install --wrapper`、
tarball 派生的 git fixture 中缺少的补丁文件、缺少的持久化
`update.channel`、旧版插件安装记录位置、缺少的 marketplace 安装记录持久化，
以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可以对
已经随包发布的本地构建元数据戳文件发出警告。后续包必须满足现代包契约；
这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装的包时，请使用更广泛的 Package Acceptance 配置档案：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包配置档案：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置
  重新加载通道
- `package`：安装/更新/重启/插件包契约，不包含实时
  ClawHub；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/子智能体清理、OpenAI web
  搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于定向重跑的精确 `docker_lanes` 列表

对于包候选版 Telegram 验证，请在 Package Acceptance 上启用
`telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将
解析后的 `package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍接受已发布的 npm 规格用于发布后检查。

## 发布发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它会按发布所需顺序编排
可信发布者工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 分派 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和保存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

稳定版发布到默认 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接提升稳定版到 `latest` 需要显式指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在定向修复或重新发布工作中使用较低层级的 `Plugin NPM Release` 和
`Plugin ClawHub Release` 工作流。对于选定插件修复，将
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`，或者在 OpenClaw 包不得发布时直接分派子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前
  工作流分支完整 40 字符提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：真实发布路径必填，这样工作流会复用
  成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必填发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；
  当 `publish_openclaw_npm=true` 时必填
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在定向修复工作中
  使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，逗号分隔的
  `@openclaw/*` 包名
- `publish_openclaw_npm`：默认为 `true`；仅在将该工作流用作仅插件修复
  编排器时设置为 `false`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查
  要求解析后的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查中选择加入完整实时/E2E、Docker 发布路径和
  全量自某版本以来升级幸存 soak。`release_profile=full` 会强制启用它。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许
  输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终
  仅用于验证
- 真实发布路径必须使用预检期间使用的同一 `npm_dist_tag`；
  工作流会在发布继续前验证该元数据

## 稳定版 npm 发布序列

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整工作流分支提交
     SHA，对预检工作流执行仅验证 dry run
2. 为正常的 beta 优先流程选择 `npm_dist_tag=beta`，或仅在你有意直接发布稳定版时
   选择 `latest`
3. 当你想通过一个手动工作流获得常规 CI 加上实时提示缓存、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整
   提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行
   手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和保存的 `preflight_run_id`
   运行 `OpenClaw Release Publish`；它会先将外置插件发布到 npm
   和 ClawHub，然后再提升 OpenClaw npm 包
7. 如果发布落在 `beta`，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta`
   应该立即跟随同一稳定构建，请使用同一私有
   工作流将两个 dist-tag 都指向该稳定版本，或让其定时
   自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全原因，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这会让直接发布路径和 beta 优先提升路径都被文档化，并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话内运行任何 1Password
CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将其保留在 tmux 内可以让提示、
警报和 OTP 处理可观察，并防止重复的主机警报。

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
中的私有发布文档作为实际运行手册。

## 相关

- [发布渠道](/zh-CN/install/development-channels)
