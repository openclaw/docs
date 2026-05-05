---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-05T04:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5f380b106fb304c932715d7b2ec5f92715b2572e7c582d7cfa9786a766730fd
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的移动头部

## 版本命名

- 稳定发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升的稳定 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定修正版默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升一个已验证的 beta 构建
- 每个稳定 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常先验证并发布 npm/包路径，Mac 应用构建/签名/公证保留给稳定版，除非明确请求

## 发布节奏

- 发布按 beta 优先推进
- 只有在最新 beta 验证通过后才跟进稳定版
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送，然后在创建分支前再 rebase/pull 一次。
3. 查看
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍然被覆盖时才移除过期兼容性，否则记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上做常规发布工作。
5. 为目标标签更新所有必需的版本位置，运行
   `pnpm plugins:sync`，让可发布的插件包共享发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 运行带 `preflight_only=true` 的 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 对发布分支、标签或完整提交 SHA 运行 `Full Release Validation`，启动所有预发布测试。这是四个大型发布测试盒子的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、工作流作业、包配置、提供商或模型 allowlist。只有当变更表面让先前证据失效时，才重新运行完整总控流程。
9. 对 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，先将所有可发布的插件包发布到 npm，再将同一组包作为 ClawPack npm-pack tarball 发布到 ClawHub，随后用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检制品。发布后，针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，切出下一个匹配的预发布编号；不要删除或重写旧预发布。
10. 对稳定版，只有在已验证的 beta 或发布候选版本具备所需验证证据后才继续。稳定版 npm 发布也通过
    `OpenClaw Release Publish` 进行，并通过
    `preflight_run_id` 复用成功的预检制品；稳定版 macOS 发布就绪还要求 `main` 上有打包后的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；在需要时进行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布/预发布说明；并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，以便测试 TypeScript 在更快的本地 `pnpm check` 门禁之外仍保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，以便更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，以便打包验证步骤所需的 `dist/*` 发布产物和 Control UI 包存在
- 在根版本提升之后、打标签之前运行 `pnpm plugins:sync`。它会更新可发布插件包版本、OpenClaw peer/API 兼容性元数据、构建元数据和插件变更日志存根，使其与核心发布版本匹配。`pnpm plugins:sync:check` 是非变更式发布守卫；如果忘记此步骤，发布工作流会在任何 registry 变更之前失败。
- 在发布批准前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，覆盖安装 smoke、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram 通道。稳定版/默认运行会把详尽的 live/E2E 和 Docker 发布路径 soak 保留在 `run_release_soak=true` 后面；`release_profile=full` 会强制启用 soak。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查中的 `release-package-under-test` 产物运行包 Telegram E2E。发布后提供 `npm_telegram_package_spec`，当同一个 Telegram E2E 也应验证已发布的 npm 包时使用。发布后提供 `package_acceptance_package_spec`，当 Package Acceptance 应针对已发货的 npm 包而非按 SHA 构建的产物运行其包/更新矩阵时使用。提供 `evidence_package_spec`，当私有证据报告应证明验证匹配已发布的 npm 包，而不强制运行 Telegram E2E 时使用。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你想在发布工作继续进行时为包候选项获取旁路证明，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；用 `source=ref` 通过当前 `workflow_ref` harness 打包受信任的 `package_ref` 分支/标签/SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选项解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当选中的 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选项，`published_upgrade_survivor_baseline` 选择已发布的基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常见配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：产物原生的包/更新/插件通道，不含 OpenWebUI 或 live ClawHub
  - `product`：包配置加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选项的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布 telemetry 时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP receiver 运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部 collector。
- 每次打标签发布前运行 `pnpm release:check`
- 标签存在后，运行 `OpenClaw Release Publish` 执行会产生变更的发布序列。从 `release/YYYY.M.D` 分发它（或在发布 main 可达标签时从 `main` 分发），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保持默认插件发布范围 `all-publishable`，除非你是在有意运行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会在其外部化插件之前发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity 通道，以及快速 live Matrix 配置和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你想并行获取完整 Matrix 传输、媒体和 E2EE 清单时，运行手动 `QA-Lab - All Lanes` 工作流，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 此拆分是有意的：让真实 npm 发布路径保持短、确定且聚焦产物，同时较慢的 live 检查保留在自己的通道中，避免拖慢或阻塞发布
- 带密钥的发布检查应通过 `Full Release Validation` 分发，或从 `main`/release 工作流 ref 分发，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，无需已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都把真实发布和提升路径保留在 GitHub-hosted runners 上，而非变更式验证路径可以使用更大的 Blacksmith Linux runners
- 该工作流会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正版标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版版本），以在全新的临时前缀中验证已发布 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭证池，针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者临时单次运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 要从维护者机器运行完整的发布后 beta smoke，请使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证，分发 `NPM Telegram Beta E2E`，轮询精确工作流运行，下载产物，并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行同样的发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，出于安全原因，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支上，但工作流从 `main` 分发时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于类似 `YYYY.M.D-N` 的稳定修正版发布，发布后验证器还会检查同一临时前缀下从 `YYYY.M.D` 到 `YYYY.M.D-N` 的升级路径，确保发布修正不会悄悄让旧的全局安装停留在基础稳定版 payload 上
- npm 发布预检默认失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` payload，以避免再次发布空的浏览器 dashboard
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装的 registry 布局中。缺少插件运行时 payload 的发布会导致 postpublish 验证器失败，且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布路径发布前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件时序清单或插件测试矩阵，请在批准前重新生成并审查由规划器拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪还包括 updater 表面：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作者从一个入口点启动所有预发布测试的方式。对于快速移动分支上的固定提交证明，使用该 helper，确保每个子工作流都从固定在目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支分发 `Full Release Validation` 并传入 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这可以避免意外证明较新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流 ref 运行，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流解析目标 ref，使用 `target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，为面向软件包的检查准备父级 `release-package-under-test` 工件，并在 `release_profile=full` 且 `rerun_group=all`，或设置了 `npm_telegram_package_spec` 时，分发独立的软件包 Telegram E2E。随后，`OpenClaw Release Checks` 会扩展到安装冒烟测试、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 均成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确工作流作业名称、stable 与 full profile 的差异、工件以及聚焦重跑句柄。
子工作流从运行 `Full Release Validation` 的可信 ref 分发，通常为 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择可信 harness。
不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 做精确提交证明；原始提交 SHA 不能作为 workflow dispatch ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的 stable provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

当发布阻断 lane 均为绿色，并且你希望在推广前执行详尽的 live/E2E、Docker 发布路径以及有界的已发布升级幸存者 sweep 时，请将 `stable` 与 `run_release_soak=true` 一起使用。该 sweep 覆盖最新四个 stable 软件包，加上固定的 `2026.4.23` 和 `2026.5.2` 基线以及较旧的 `2026.4.15` 覆盖，会移除重复基线，并将每个基线分片到自己的 Docker runner 作业中。`full` 隐含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用可信工作流 ref 将目标 ref 解析一次为 `release-package-under-test`，并在运行 soak 时，在 cross-OS、Package Acceptance 和 release-path Docker 检查中复用该工件。这会让所有面向软件包的机器使用相同字节，并避免重复构建软件包。cross-OS OpenAI 安装冒烟测试在 repo/org 变量已设置时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该 lane 证明的是软件包安装、新手引导、Gateway 网关启动以及一次 live agent 轮次，而不是对最慢默认模型做基准测试。更广泛的 live provider 矩阵仍然是模型特定覆盖的位置。

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

不要把完整总括工作流用作聚焦修复后的第一次重跑。如果一个 box 失败，请使用失败的子工作流、作业、Docker lane、软件包 profile、模型提供商或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或让先前的全 box 证据过期时，才再次运行完整总括工作流。总括工作流的最终验证器会重新检查已记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，请将 `rerun_group` 传给总括工作流。`all` 是真正的候选发布运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布使用的插件子项，`release-checks` 运行每个发布 box，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；带 `release_profile=full` 的 full/all 运行会使用 release-checks 软件包工件。聚焦 cross-OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/suite 过滤器。QA release-check 失败是 advisory；仅 QA 失败不会阻断发布验证。

### Vitest

Vitest box 是手动 `CI` 子工作流。手动 CI 会有意绕过 changed scoping，并强制候选发布使用普通测试图：Linux Node 分片、内置插件分片、渠道合约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用此 box 回答“源代码树是否通过完整的普通测试套件？”它不同于 release-path 产品验证。需要保留的证据：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色的 `CI` 运行
- 调查回归时来自 CI 作业的失败或较慢分片名称
- 当运行需要性能分析时，保留 `.artifacts/vitest-shard-timings.json` 等 Vitest timing 工件

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、cross-OS 或 package box 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及 release-mode 的 `install-smoke` 工作流运行。它通过打包的 Docker 环境验证候选发布，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟测试的完整安装冒烟测试
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，其中 QR、root/gateway 和 installer/Bun 冒烟作业作为独立的 install-smoke 分片运行
- 仓库 E2E lane
- release-path Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，`plugins-runtime-services` 分块内的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lane，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当 release checks 包含 live suite 时，包含 live/E2E provider suite 和 Docker live model 覆盖

重跑前请先使用 Docker 工件。release-path 调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段计时、scheduler plan JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane 可以复用相同 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，与 Vitest 和 Docker 软件包机制分开。

发布 QA Lab 覆盖包括：

- mock parity lane，使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6 基线比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭证租约的 live Telegram QA lane
- 当发布遥测需要显式本地证明时运行 `pnpm qa:otel:smoke`

使用此 box 回答“发布在 QA 场景和 live channel 流程中是否表现正确？”批准发布时，请保留 parity、Matrix 和 Telegram lane 的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认发布关键 lane。

### 软件包

Package box 是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选项规范化为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将工作流 harness ref 与软件包源 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载一个需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布软件包工件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会让迁移、更新、过期插件依赖清理、离线插件 fixture、插件更新和 Telegram 软件包 QA 都针对同一个已解析 tarball。阻断性 release checks 使用默认的最新已发布软件包基线；`run_release_soak=true` 或 `release_profile=full` 会扩展到从 `2026.4.23` 到 `latest` 的每个 stable npm 已发布基线，以及已报告问题的 fixture。对于已经发布的候选项，请使用带 `source=npm` 的 Package Acceptance；对于发布前有 SHA 支撑的本地 npm tarball，请使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，可替代过去大多数需要 Parallels 的 package/update 覆盖。cross-OS release checks 对 OS 特定的新手引导、安装器和平台行为仍然重要，但 package/update 产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或 release-check lane 可以证明插件安装/更新、Doctor 清理或已发布软件包迁移更改时，请使用它。从每个 stable `2026.4.23+` 软件包执行详尽的已发布更新迁移，是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版包验收宽松规则被有意限定在一段时间内。直到
`2026.4.25` 的包可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 库存条目、缺失的
`gateway install --wrapper`、从 tarball 派生的 git
fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录
位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据
迁移。已发布的 `2026.4.26` 包可能会针对已经发布的本地构建元数据标记文件发出
警告。后续包必须满足现代包契约；这些相同缺口会导致发布
验证失败。

当发布问题涉及实际可安装包时，请使用更广的 Package Acceptance 配置档：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常用包配置档：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络，以及配置
  重载通道
- `package`：安装/更新/插件包契约，不包含 live ClawHub；这是发布检查的
  默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web
  search，以及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选版本的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会将解析后的
`package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍然接受已发布的 npm spec，用于发布后检查。

## 发布发布自动化

`OpenClaw Release Publish` 是常规的可变更发布入口点。它会按发布所需的顺序
编排 trusted-publisher 工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同的 scope 和 SHA 调度 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和
   已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。

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

直接提升稳定版到 `latest` 是显式操作：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用较底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定插件修复，请将
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`，或者当不得发布 OpenClaw 包时直接调度子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整 40 字符工作流分支提交 SHA，用于仅验证预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：真实发布路径必需，这样工作流会复用
  成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 id；
  当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在
  聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，以逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认为 `true`；仅在将该
  工作流用作仅插件修复编排器时设为 `false`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。携带 secret 的检查
  要求解析出的提交可从 OpenClaw 分支或
  发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查中选择启用详尽的 live/E2E、Docker 发布路径，以及
  all-since upgrade-survivor soak。`release_profile=full` 会强制启用它。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终
  仅执行验证
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；
  工作流会在发布继续前验证该元数据

## 稳定版 npm 发布顺序

当发布稳定版 npm 版本时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在前，你可以使用当前完整的工作流分支提交
     SHA，对预检工作流执行仅验证 dry run
2. 对于常规 beta-first 流程，选择 `npm_dist_tag=beta`；仅在
   你有意直接发布稳定版时才选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加上 live prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，请在发布分支、发布标签或完整
   提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行
   手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`
   和保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外部化插件发布到 npm
   和 ClawHub，然后再提升 OpenClaw npm 包
7. 如果发布落在 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，且 `beta`
   应立即跟随同一个稳定构建，请使用同一个私有
   工作流让两个 dist-tag 都指向该稳定版本，或让其定时
   自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这样可以让直接发布路径和 beta-first 提升路径都
有文档记录，并且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请只在专用 tmux 会话中运行任何 1Password
CLI (`op`) 命令。不要直接从主智能体 shell 调用 `op`；将其保持在 tmux 内可以让提示、
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
