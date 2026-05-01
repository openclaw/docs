---
read_when:
    - 正在查找公共发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-01T22:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ebbb0f42ee5f1ea29eb3133fcef7c829f855f5d668d8b8af373a6e148bb56ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：已打标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要给月份或日期补零
- `latest` 表示当前已提升的稳定 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定和稳定修正版发布默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升一个已验证的 beta 构建
- 每个稳定 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，而
  Mac 应用的构建/签名/公证保留给稳定发布，除非明确请求

## 发布节奏

- 发布按 beta 优先推进
- 只有在最新 beta 完成验证后才会跟进稳定发布
- 维护者通常会从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新
  开发
- 如果 beta 标签已经推送或发布且需要修复，维护者会切出
  下一个 `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明
  仅限维护者访问

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅限维护者访问的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够绿色，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送，然后在创建分支前
   再 rebase/pull 一次。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍然被覆盖时才移除已过期的
   兼容性，否则记录为什么要有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上
   做常规发布工作。
5. 为目标标签更新每个必需的版本位置，然后运行
   本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证
   预检。保存成功的 `preflight_run_id`。
7. 对发布分支、标签或完整提交 SHA，使用 `Full Release Validation`
   启动所有预发布测试。这是四个大型发布测试箱
   Vitest、Docker、QA Lab 和 Package 的唯一手动入口点。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的
   最小失败文件、通道、workflow job、包配置、提供商或模型允许列表。
   只有当变更面让之前的证据失效时，才重新运行完整总控流程。
9. 对于 beta，打标签 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，
   然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的 beta 需要修复，
   切出下一个 `-beta.N`；不要删除或重写旧 beta。
10. 对于稳定发布，只有在已验证的 beta 或发布候选具备
    所需验证证据后才继续。稳定 npm 发布会通过 `preflight_run_id`
    复用成功的预检产物；稳定 macOS 发布就绪
    还要求 `main` 上存在已打包的 `.zip`、`.dmg`、`.dSYM.zip`
    以及已更新的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，运行可选的独立
    已发布 npm Telegram E2E；
    按需进行 dist-tag 提升；从完整匹配的 `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明；
    并执行发布公告
    步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 会在较快的本地 `pnpm check` 门禁之外保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会在较快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，这样预期的 `dist/*` 发布产物和 Control UI 包会在打包验证步骤前存在
- 在发布批准前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试箱。它接受分支、标签或完整提交 SHA，调度手动 `CI`，并调度 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 对等性、Matrix 和 Telegram 通道。只有在包已发布且发布后的 Telegram E2E 也应运行时，才提供 `npm_telegram_package_spec`。当私有证据报告应证明验证匹配已发布的 npm 包、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为包候选版本提供旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 将受信任的 `package_ref` 分支/标签/SHA 与当前 `workflow_ref` harness 打包；对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选项解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当选中的 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选项，`published_upgrade_survivor_baseline` 选择已发布基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常见配置档：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：不含 OpenWebUI 或实时 ClawHub 的产物原生包/更新/插件通道
  - `product`：包配置档加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 调度会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器执行 QA-lab，并在无需 Opik、Langfuse 或其他外部收集器的情况下验证导出的跟踪 span 名称、有界属性以及内容/标识符脱敏。
- 每个带标签的发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布批准前运行 QA Lab 模拟对等性门禁，以及快速实时 Matrix 配置档和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 也使用 Convex CI 凭证租约。当你希望并行运行完整 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真实 npm 发布路径保持短小、确定且聚焦产物，而较慢的实时检查保留在自己的通道中，这样它们不会拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 调度，或从 `main`/release 工作流引用调度，这样工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整的 40 字符工作流分支提交 SHA，而不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都会把真实发布和推广路径保持在 GitHub 托管 runner 上，而非变更型验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查通道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正版标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版版本），在新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享的租用 Telegram 凭证池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行同一个发布后检查。它有意只支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再推广：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支调度
  - 稳定 npm 发布默认使用 `beta`
  - 稳定 npm 发布可以通过工作流输入显式指向 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，用于安全控制，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支但工作流从 `main` 调度时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会推广已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的稳定修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，这样发布修正不会静默地让较旧的全局安装停留在基础稳定版载荷上
- 除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，否则 npm 发布预检会默认失败关闭，这样我们不会再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装的注册表布局中。发布版本如果缺少插件运行时载荷，会导致 postpublish 验证器失败，并且不能被推广到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布路径发布前捕获意外的包体积膨胀
- 如果发布工作触及 CI 规划、插件计时清单或插件测试矩阵，请在批准前重新生成并审查来自 `.github/workflows/plugin-prerelease.yml`、由规划器拥有的 `plugin-prerelease-extension-shard` 矩阵输出，这样发布说明不会描述过期的 CI 布局
- 稳定 macOS 发布就绪状态还包括更新器表面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后 `main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试箱

`Full Release Validation` 是操作人员从一个入口点启动所有预发布测试的方式。从受信任的 `main` 工作流引用运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流解析目标引用，使用 `target_ref=<release-ref>` 调度手动 `CI`，调度 `OpenClaw Release Checks`，并在设置了 `npm_telegram_package_spec` 时，可选地调度独立的发布后 Telegram E2E。随后 `OpenClaw Release Checks` 会展开安装冒烟、跨 OS 发布检查、实时/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab 对等性、实时 Matrix 和实时 Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，且任何可选的 `npm_telegram` 子项成功或被有意跳过时，完整运行才可接受。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志就能看到当前关键路径。
请参阅 [完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确工作流作业名称、稳定与完整配置档差异、产物以及聚焦重跑句柄。
子工作流从运行 `Full Release Validation` 的受信任引用调度，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation 工作流引用输入；通过选择工作流运行引用来选择受信任的 harness。

使用 `release_profile` 选择实时/提供商广度：

- `minimum`：最快的发布关键 OpenAI/核心实时和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的建议性提供商/媒体覆盖

`OpenClaw Release Checks` 使用可信工作流 ref 将目标 ref 一次性解析为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该构件。这样可以让所有面向包的检查箱使用相同字节，并避免重复构建包。跨 OS OpenAI 安装冒烟检查在设置了 repo/org 变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因为这个通道验证的是包安装、新手引导、Gateway 网关启动，以及一次实时智能体轮次，而不是对最慢的默认模型做基准测试。更广泛的实时提供商矩阵仍然是模型专项覆盖的地方。

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要把完整总控工作流作为聚焦修复后的首次重跑。如果某个检查箱失败，请使用失败的子工作流、作业、Docker 通道、包配置档、模型提供商或 QA 通道作为下一次证明。只有当修复更改了共享发布编排，或让此前的全检查箱证据过期时，才再次运行完整总控工作流。总控工作流的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，向总控工作流传递 `rerun_group`。`all` 是真正的候选发布运行，`ci` 只运行普通 CI 子工作流，`plugin-prerelease` 只运行仅发布使用的插件子工作流，`release-checks` 运行每个发布检查箱，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供独立包 Telegram 通道时的 `npm-telegram`。

### Vitest

Vitest 检查箱是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围筛选，并为候选发布强制运行正常测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟检查、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用这个检查箱回答“源代码树是否通过了完整的正常测试套件？”它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已分发的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上通过
- 调查回归时来自 CI 作业的失败或慢速分片名称
- 当某次运行需要性能分析时，Vitest 计时构件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的正常 CI，而不需要 Docker、QA Lab、实时、跨 OS 或包检查箱时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 检查箱位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流运行。它通过打包后的 Docker 环境验证候选发布，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟检查的完整安装冒烟检查
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，其中 QR、root/gateway，以及 installer/Bun 冒烟作业作为独立 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，在 `plugins-runtime-services` 分块内包含 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载通道，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，包含实时/E2E 提供商套件和 Docker 实时模型覆盖

重跑前先使用 Docker 构件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON，以及重跑命令。对于聚焦恢复，请在可复用实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含此前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的通道可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 检查箱也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- 使用智能体一致性包，将 OpenAI 候选通道与 Opus 4.6 基线进行比较的模拟一致性门禁
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置档
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要显式本地证明时运行 `pnpm qa:otel:smoke`

使用这个检查箱回答“发布在 QA 场景和实时渠道流中是否行为正确？”批准发布时，请保留一致性、Matrix 和 Telegram 通道的构件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认发布关键通道。

### 包

包检查箱是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选项规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流 harness ref 与包源 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载 HTTPS `.tgz`，并要求提供 `package_sha256`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备好的发布包构件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会让迁移、更新、陈旧插件依赖清理、离线插件夹具、插件更新，以及 Telegram 包 QA 都针对同一个已解析 tarball。它是 GitHub 原生替代方案，用于覆盖过去多数需要 Parallels 的包/更新验证。跨 OS 发布检查对于 OS 专项的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。在判断哪个本地、Docker、Package Acceptance 或发布检查通道能证明插件安装/更新、Doctor 清理或已发布包迁移变更时，请使用它。

旧版 package-acceptance 宽容行为有意设置了时间边界。到 `2026.4.25` 为止的包可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失私有 QA 清单条目、缺失 `gateway install --wrapper`、tarball 派生的 git 夹具中缺失补丁文件、缺失持久化的 `update.channel`、旧版插件安装记录位置、缺失 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会因已随包发布的本地构建元数据戳文件而警告。后续包必须满足现代包契约；同样的缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更广泛的 Package Acceptance 配置档：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包配置档：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：没有实时 ClawHub 的安装/更新/插件包契约；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会把已解析的 `package-under-test` tarball 传入 Telegram 通道；独立 Telegram 工作流仍接受已发布的 npm spec，用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必填，使工作流复用成功预检运行准备的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求已解析提交可从 OpenClaw 分支或发布标签到达。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有当 `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终只做验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定 npm 发布序列

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整工作流分支提交
     SHA，对预检工作流执行仅验证的空运行
2. 为常规 beta 优先流程选择 `npm_dist_tag=beta`；仅当你有意直接发布稳定版时才选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI，以及 live prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，请在发布分支、发布标签或完整
   提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布引用上运行
   手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用 `preflight_only=false`、相同的
   `tag`、相同的 `npm_dist_tag` 以及已保存的 `preflight_run_id`，再次运行 `OpenClaw NPM Release`
7. 如果发布落在 `beta` 上，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta`
   应立即跟随同一个稳定构建，请使用同一个私有
   工作流将两个 dist-tags 都指向该稳定版本，或让其定时
   自愈同步稍后移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这会让直接发布路径和 beta 优先提升路径都
有文档记录并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其保留在 tmux 内部可以让提示、
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
