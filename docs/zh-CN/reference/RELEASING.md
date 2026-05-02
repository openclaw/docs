---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-02T04:48:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce380a8277e7c8764359e4ded86d1042dcb250691ac62fbee28651f20aa0580
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：默认发布到 npm `beta` 的带标签版本，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定和稳定修正版本默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升经过验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/package 路径，而
  mac 应用构建/签名/公证仅保留给稳定版，除非明确请求

## 发布节奏

- 发布按 beta 优先推进
- 只有最新 beta 通过验证后，稳定版才会跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  因此发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并且需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者可见

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送，然后在创建分支前再次 rebase/pull。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅当升级路径仍被覆盖时才移除过期
   兼容性，或记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为预期标签更新每个必需的版本位置，然后运行
   本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证
   预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 针对
   发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试箱的唯一手动入口点：
   Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败
   文件、通道、工作流作业、包配置、提供商或模型 allowlist。仅当变更表面使
   之前的证据失效时，才重新运行完整总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的 beta 需要修复，则切出
   下一个 `-beta.N`；不要删除或重写旧 beta。
10. 对于稳定版，只有经过验证的 beta 或候选发布版本具备所需验证证据后才继续。
    稳定版 npm 发布会通过 `preflight_run_id` 复用成功的
    预检工件；稳定版 macOS 发布就绪还要求 `main` 上存在打包后的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；当你需要发布后渠道证明时，可选运行独立的
    published-npm Telegram E2E；按需进行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明；并执行发布公告
    步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外也为绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保预期的 `dist/*` 发布产物和 Control UI 包存在，以供打包验证步骤使用
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布 test boxes。它接受分支、标签或完整提交 SHA，分派手动 `CI`，并分派 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 对等性、Matrix 和 Telegram 通道。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查中的 `release-package-under-test` 产物运行包 Telegram E2E。发布后，如果同一 Telegram E2E 也应验证已发布的 npm 包，请提供 `npm_telegram_package_spec`。如果私有证据报告应证明验证与已发布的 npm 包匹配，但不强制运行 Telegram E2E，请提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时为包候选项提供旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包受信任的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选项解析为 `package-under-test`，复用 Docker E2E 发布调度器针对该 tarball 运行，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当所选 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选项，而 `published_upgrade_survivor_baseline` 选择已发布的基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：面向产物原生的包/更新/插件通道，不包含 OpenWebUI 或实时 ClawHub
  - `product`：包配置加上 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选项的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分派会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 每次打标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock 对等性门禁，以及快速实时 Matrix 配置和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你希望并行运行完整 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨操作系统安装和升级运行时验证属于公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径短小、确定且聚焦产物，同时较慢的实时检查留在自己的通道中，避免它们拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 分派，或从 `main`/发布工作流 ref 分派，以便工作流逻辑和密钥保持受控
- 只要解析后的提交可从 OpenClaw 分支或发布标签访问，`OpenClaw Release Checks` 就接受分支、标签或完整提交 SHA
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，无需推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查通道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正版标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版版本），在全新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享的租赁 Telegram 凭据池，针对已发布 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭据。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行相同的发布后检查。它有意设为仅手动，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - 稳定 npm 发布默认使用 `beta`
  - 稳定 npm 发布可以通过工作流输入显式目标为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 中以提升安全性，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支上但工作流从 `main` 分派时，请设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于 `YYYY.M.D-N` 这样的稳定修正版发布，发布后验证器也会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，确保发布修正不会悄悄让旧的全局安装停留在基础稳定负载上
- npm 发布预检会失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` 负载，避免再次发布空的浏览器仪表板
- 发布后验证还会检查已发布的插件入口点和包元数据是否存在于已安装的注册表布局中。缺少插件运行时负载的发布会导致发布后验证器失败，且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布发布路径前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件时间清单或插件测试矩阵，请在批准前重新生成并审查 `.github/workflows/plugin-prerelease.yml` 中由规划器拥有的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过期的 CI 布局
- 稳定 macOS 发布就绪状态还包括更新器表面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定 zip
  - 打包后的应用必须保留非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布 test boxes

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。对于快速变化分支上的固定提交证明，请使用该 helper，确保每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支分派 `Full Release Validation` 并传入 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这可避免意外证明更新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流 ref 运行它，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，调度带有 `target_ref=<release-ref>` 的手动 `CI`，调度 `OpenClaw Release Checks`，并在 `release_profile=full` 且 `rerun_group=all` 或设置了 `npm_telegram_package_spec` 时调度独立的 Telegram 包 E2E。随后 `OpenClaw Release Checks` 会展开安装冒烟测试、跨 OS 发布检查、实时/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab 对等校验、实时 Matrix 和实时 Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 均成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可查看当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确的工作流作业名称、stable 与 full 配置差异、构件以及聚焦重跑句柄。
子工作流从运行 `Full Release Validation` 的受信任 ref 调度，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择受信任的执行框架。不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 来提供精确提交证明；原始提交 SHA 不能作为工作流调度 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择实时/提供商覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core 实时与 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上更广的 advisory 提供商/媒体覆盖

`OpenClaw Release Checks` 使用受信任的工作流 ref 将目标 ref 解析一次为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该构件。这会让所有面向包的环境使用同一份字节，并避免重复构建包。
跨 OS OpenAI 安装冒烟测试在设置了 repo/org 变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因为该通道用于证明包安装、新手引导、Gateway 网关启动以及一次实时智能体轮次，而不是对最慢的默认模型做基准测试。更广的实时提供商矩阵仍然是模型特定覆盖的位置。

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

不要把完整总控工作流用作聚焦修复后的第一次重跑。如果某个环境失败，请使用失败的子工作流、作业、Docker 通道、包配置、模型提供商或 QA 通道作为下一次证明。只有当修复改变了共享发布编排，或让先前的全环境证据过期时，才再次运行完整总控工作流。该总控工作流的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的父作业 `Verify full validation`。

对于有界恢复，向总控工作流传入 `rerun_group`。`all` 是真正的候选发布运行，`ci` 仅运行普通 CI 子项，`plugin-prerelease` 仅运行发布专用插件子项，`release-checks` 运行每个发布环境，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 运行会使用 release-checks 包构件。

### Vitest

Vitest 环境是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围筛选，并为候选发布强制执行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用此环境回答“源代码树是否通过了完整普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已调度的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上为绿色
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当某次运行需要性能分析时，保留 Vitest 计时构件，例如 `.artifacts/vitest-shard-timings.json`

仅在发布需要确定性的普通 CI、但不需要 Docker、QA Lab、实时、跨 OS 或包环境时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 环境位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式 `install-smoke` 工作流运行。它通过打包的 Docker 环境验证候选发布，而不是只做源码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟测试的完整安装冒烟测试
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并将 QR、root/gateway、installer/Bun 冒烟作业作为独立 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，在 `plugins-runtime-services` 分块中覆盖 OpenWebUI
- 拆分的内置插件安装/卸载通道，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，覆盖实时/E2E 提供商套件和 Docker 实时模型

重跑前先使用 Docker 构件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 环境也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack 将 OpenAI 候选通道与 Opus 4.6 基线进行比较的 mock 对等门禁
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置
- 使用 Convex CI 凭证租约的实时 Telegram QA 通道
- 当发布遥测需要显式本地证明时运行 `pnpm qa:otel:smoke`

使用此环境回答“发布版在 QA 场景和实时渠道流程中是否表现正确？”批准发布时，请保留 parity、Matrix 和 Telegram 通道的构件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键通道。

### Package

Package 环境是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支持。解析器会将候选项规范化为 Docker E2E 消费的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流执行框架 ref 与包来源 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` 执行框架打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布包构件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一个已解析 tarball 保持迁移、更新、陈旧插件依赖清理、离线插件 fixture、插件更新和 Telegram 包 QA。它是 GitHub 原生替代方案，用于取代过去多数需要 Parallels 的包/更新覆盖。跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在判断哪个本地、Docker、Package Acceptance 或 release-check 通道可证明插件安装/更新、Doctor 清理或已发布包迁移变更时，请使用它。
从每个稳定版 `2026.4.23+` 包进行的完整已发布更新迁移是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽松策略是有意限时的。到 `2026.4.25` 为止的包可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失私有 QA 清单条目、缺失 `gateway install --wrapper`、tarball 派生 git fixture 中缺失补丁文件、缺失持久化的 `update.channel`、旧版插件安装记录位置、缺失 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会对已交付的本地构建元数据 stamp 文件发出警告。之后的包必须满足现代包契约；这些同样的缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更广的 Package Acceptance 配置：

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

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：不含实时 ClawHub 的安装/更新/插件包契约；这是 release-check 默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选版本的 Telegram 验证，在包验收中启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会将解析后的 `package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍接受已发布的 npm 规范，用于发布后的检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作者控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必填，以便工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受这些由操作者控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析后的提交可从某个 OpenClaw 分支或发布标签访问。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；工作流会在发布继续之前验证该元数据

## 稳定版 npm 发布流程

切稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release` 并设置 `preflight_only=true`
   - 在标签存在之前，你可以使用当前完整的工作流分支提交 SHA，对预检工作流进行仅验证的试运行
2. 正常的先 beta 后提升流程选择 `npm_dist_tag=beta`，只有在你有意直接发布稳定版时才选择 `latest`
3. 当你希望通过一个手动工作流获得正常 CI 以及实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的正常测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果发布落在 `beta`，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，并且 `beta`
   也应立即跟随同一个稳定版构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或让它的定时自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍然需要
`NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这会让直接发布路径和先 beta 后提升路径都保持有文档记录，并且对操作者可见。

如果维护者必须回退到本地 npm 身份验证，请只在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将它保持在 tmux 内部可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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
