---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-29T11:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc944cc72f61226363cd6684c1b4830c518874da21bcf8127d365772275f17f7
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
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
- 稳定版和稳定修正发布版本默认发布到 npm `beta`；发布操作者可以明确指定 `latest`，也可以稍后提升经过验证的 beta 构建
- 每个稳定的 OpenClaw 发布版本都会同时交付 npm 软件包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/软件包路径，除非明确请求，
  否则 mac 应用的构建、签名和公证保留给稳定版

## 发布节奏

- 发布按 beta 优先推进
- 只有最新 beta 验证通过后才会发布稳定版
- 维护者通常会从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布版本，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并且需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧 beta 标签
- 详细发布流程、审批、凭证和恢复说明仅限维护者

## 发布操作者清单

此清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚详情保留在仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` 的 CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交它，推送它，并在创建分支前再 rebase/pull 一次。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅当升级路径仍然被覆盖时才移除过期兼容性，或者记录为什么要有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为预期标签提升每个必需位置的版本，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。
   保存成功的 `preflight_run_id`。
7. 对发布分支、标签或完整提交 SHA 使用 `Full Release Validation` 启动所有预发布测试。
   这是四个大型发布测试箱的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败文件、通道、工作流作业、软件包配置、提供商或模型 allowlist。只有当变更表面让之前证据失效时，才重新运行完整的总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，
   然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 软件包运行发布后软件包验收。如果已推送或已发布的 beta 需要修复，
   切出下一个 `-beta.N`；不要删除或重写旧 beta。
10. 对于稳定版，只有经过验证的 beta 或候选发布版本具备所需验证证据后才能继续。稳定版 npm 发布会通过 `preflight_run_id` 复用成功的预检工件；稳定版 macOS 发布就绪还要求 `main` 上存在打包好的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器，在你需要发布后渠道证明时可选择运行独立的已发布 npm Telegram E2E，按需提升 dist-tag，根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明，并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外仍被覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 在发布批准前运行手动 `Full Release Validation` workflow，从一个入口启动所有预发布 test boxes。它接受分支、标签或完整 commit SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，用于安装 smoke、package acceptance、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 线。仅在 package 已发布且也应运行发布后 Telegram E2E 时提供 `npm_telegram_package_spec`。当私有证据报告应证明验证匹配已发布的 npm package、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为 package 候选项获取旁路证明，请运行手动 `Package Acceptance` workflow。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions run 上传的 tarball 使用 `source=artifact`。该 workflow 会将候选项解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且可以用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载线
  - `package`：不含 OpenWebUI 或 live ClawHub 的 artifact-native package/update/plugin 线
  - `product`：package profile 外加 MCP 渠道、cron/subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分片
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选项的完整普通 CI 覆盖时，直接运行手动 `CI` workflow。手动 CI 分发会绕过 changed scoping，并强制运行 Linux Node 分片、内置插件分片、渠道 contract、Node 22 兼容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 和 Control UI i18n 线。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布 telemetry 时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP receiver 运行 QA-lab，并验证导出的 trace span 名称、有界 attributes，以及内容/标识符脱敏；不需要 Opik、Langfuse 或其他外部 collector。
- 每次带标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock 一致性门禁，以及快速 live Matrix profile 和 Telegram QA 线。live 线使用 `qa-live-shared` environment；Telegram 还使用 Convex CI credential leases。当你希望并行获取完整 Matrix 传输、媒体和 E2EE inventory 时，运行手动 `QA-Lab - All Lanes` workflow，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真实 npm 发布路径保持简短、确定且专注于 artifact，同时让较慢的 live 检查留在自己的线中，避免它们拖慢或阻塞发布
- 带 secret 的发布检查应通过 `Full Release Validation` 分发，或从 `main`/release workflow ref 分发，以便 workflow 逻辑和 secrets 保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整 commit SHA，只要解析出的 commit 可从 OpenClaw 分支或 release tag 到达
- `OpenClaw NPM Release` validation-only 预检也接受当前完整 40 字符 workflow 分支 commit SHA，无需推送 tag
- 该 SHA 路径仅用于验证，不能升级为真实发布
- 在 SHA 模式下，workflow 只为 package metadata check 合成 `v<package.json version>`；真实发布仍需要真实 release tag
- 两个 workflow 都将真实 publish 和 promotion 路径保留在 GitHub-hosted runners 上，而非变更性 validation 路径可以使用更大的 Blacksmith Linux runners
- 该 workflow 使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secrets 运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查线
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/correction tag）
- npm publish 后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/correction version），在全新的临时 prefix 中验证已发布 registry 安装路径
- beta publish 后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以使用共享租赁 Telegram credential pool，针对已发布 npm package 验证 installed-package 新手引导、Telegram 设置和真实 Telegram E2E。本地 maintainer 一次性操作可以省略 Convex vars，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- Maintainers 可以通过手动 `NPM Telegram Beta E2E` workflow 从 GitHub Actions 运行相同的发布后检查。它有意仅允许手动运行，不会在每次 merge 时运行。
- Maintainer 发布自动化现在使用 preflight-then-promote：
  - 真实 npm publish 必须通过成功的 npm `preflight_run_id`
  - 真实 npm publish 必须从与成功 preflight run 相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - stable npm releases 默认指向 `beta`
  - stable npm publish 可以通过 workflow input 明确指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以保障安全，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而 public repo 保持 OIDC-only publish
  - 公开 `macOS Release` 仅用于验证
  - 真实私有 mac publish 必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实 publish 路径会提升已准备好的 artifacts，而不是再次 rebuild 它们
- 对于 `YYYY.M.D-N` 这样的 stable correction releases，发布后 verifier 还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同 temp-prefix 升级路径，确保 release corrections 不会静默地让旧的 global installs 停留在 base stable payload 上
- npm 发布预检会 fail closed，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，以免我们再次发布空的浏览器 dashboard
- 发布后验证还会检查已发布 registry install 是否在根 `dist/*` 布局下包含非空的内置插件 runtime deps。若某个发布缺失或包含空的内置插件依赖 payload，则 postpublish verifier 会失败，且不能 promoted 到 `latest`。
- `pnpm test:install:smoke` 还会对候选 update tarball 强制执行 npm pack `unpackedSize` 预算，因此 installer e2e 会在 release publish 路径前捕获意外的 pack bloat
- 如果发布工作触及 CI planning、extension timing manifests 或 extension test matrices，请在批准前重新生成并审查由 planner 拥有的 `plugin-prerelease-extension-shard` matrix outputs，来源为 `.github/workflows/plugin-prerelease.yml`，确保 release notes 不会描述过时的 CI 布局
- Stable macOS 发布就绪性还包括 updater surfaces：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - publish 后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的 app 必须保留非 debug bundle id、非空 Sparkle feed URL，以及对该 release version 而言不低于 canonical Sparkle build floor 的 `CFBundleVersion`

## 发布 test boxes

`Full Release Validation` 是 operators 从一个入口启动所有预发布测试的方式。请从可信的 `main` workflow ref 运行它，并将 release branch、tag 或完整 commit SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该 workflow 会解析目标 ref，使用 `target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置 `npm_telegram_package_spec` 时可选地分发独立的发布后 Telegram E2E。`OpenClaw Release Checks` 随后会扇出安装 smoke、跨 OS 发布检查、live/E2E Docker 发布路径覆盖、带 Telegram package QA 的 Package Acceptance、QA Lab 一致性、live Matrix 和 live Telegram。仅当 `Full Release Validation` summary 显示 `normal_ci` 和 `release_checks` 成功，并且任何可选的 `npm_telegram` child 成功或有意跳过时，完整 run 才可接受。最终 verifier summary 包含每个 child run 的最慢 job 表格，因此 release manager 可以在不下载日志的情况下看到当前关键路径。
Child workflows 从运行 `Full Release Validation` 的可信 ref 分发，通常为 `--ref main`，即使目标 `ref` 指向较旧的 release branch 或 tag。没有单独的 Full Release Validation workflow-ref input；请通过选择 workflow run ref 来选择可信 harness。

使用 `release_profile` 选择 live/provider 覆盖广度：

- `minimum`：最快的 release-critical OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于 release approval 的 stable provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

`OpenClaw Release Checks` 使用可信 workflow ref 将目标 ref 解析一次为 `release-package-under-test`，并在 release-path Docker checks 和 Package Acceptance 中复用该 artifact。这让所有面向 package 的 boxes 使用相同字节，并避免重复 package builds。
当 repo/org variable 已设置时，跨 OS OpenAI install smoke 使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因为这条线证明的是 package install、新手引导、gateway startup 和一次 live 智能体 turn，而不是对最慢默认模型进行 benchmark。更广泛的 live provider matrix 仍然是进行 model-specific 覆盖的地方。

请根据 release stage 使用这些 variants：

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

不要把完整总控工作流作为聚焦修复后的首次重跑。如果某个检查盒失败，请使用失败的子工作流、作业、Docker 通道、包配置文件、模型提供商或 QA 通道作为下一次验证。只有当修复更改了共享发布编排，或让之前的全检查盒证据变得过期时，才再次运行完整总控工作流。总控工作流的最终验证器会重新检查记录的子工作流运行 ID，因此当某个子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有边界的恢复，请将 `rerun_group` 传给总控工作流。`all` 是真正的候选发布运行，`ci` 只运行常规 CI 子工作流，`plugin-prerelease` 只运行仅发布用的插件子工作流，`release-checks` 运行所有发布检查盒，而更窄的发布分组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供独立包 Telegram 通道时的 `npm-telegram`。

### Vitest

Vitest 检查盒是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并为候选发布强制运行常规测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用此检查盒回答“源代码树是否通过了完整的常规测试套件？”它不同于发布路径的产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已调度的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上通过
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当运行需要性能分析时，保留 Vitest 计时产物，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的常规 CI，但不需要 Docker、QA Lab、实时、跨 OS 或包检查盒时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 检查盒位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 运行，并包含发布模式的 `install-smoke` 工作流。它通过打包后的 Docker 环境验证候选发布，而不只是源代码级测试。

发布 Docker 覆盖范围包括：

- 启用较慢 Bun 全局安装冒烟的完整安装冒烟
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`
- 按需在 `plugins-runtime-services` 分块中覆盖 OpenWebUI
- 将内置渠道依赖通道拆分到 channel-smoke、update-target 和 setup/runtime 契约分块中，而不是放在一个大型内置渠道作业里
- 拆分内置插件安装/卸载通道 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，覆盖 live/E2E 提供商套件和 Docker 实时模型

重跑前先使用 Docker 产物。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 检查盒也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖范围包括：

- 使用 agentic parity pack，将 OpenAI 候选通道与 Opus 4.6 基线进行比较的模拟一致性门禁
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置文件
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要明确的本地证明时运行 `pnpm qa:otel:smoke`

使用此检查盒回答“发布在 QA 场景和实时渠道流程中是否行为正确？”批准发布时保留 parity、Matrix 和 Telegram 通道的产物 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键通道。

### Package

Package 检查盒是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选项规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流 harness ref 与包源 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载 HTTPS `.tgz`，并要求提供 `package_sha256`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=ref`、`package_ref=<release-ref>`、`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker 分块覆盖重叠的安装、更新和插件更新通道；Package Acceptance 保留面向同一已解析 tarball 的产物原生内置渠道兼容性、离线插件 fixture 和 Telegram 包 QA。它是此前大部分需要 Parallels 的包/更新覆盖的 GitHub 原生替代方案。跨 OS 发布检查对 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽松规则是有意限时的。直到 `2026.4.25` 的包，可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失私有 QA 清单条目、缺失 `gateway install --wrapper`、tarball 派生 git fixture 中缺失补丁文件、缺失持久化的 `update.channel`、旧版插件安装记录位置、缺失 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可以对已发布的本地构建元数据戳文件发出警告。之后的包必须满足现代包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，请使用更宽的 Package Acceptance 配置文件：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见包配置文件：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：不含实时 ClawHub 的安装/更新/插件包契约；这是 release-check 默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web search 和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会把已解析的 `package-under-test` tarball 传入 Telegram 通道；独立 Telegram 工作流仍接受已发布的 npm spec，用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，以便工作流复用成功预检运行准备的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带密钥的检查要求已解析提交可从 OpenClaw 分支或发布标签访问。

规则：

- 稳定标签和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终只做验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定 npm 发布流程

切稳定 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整工作流分支提交 SHA，对预检工作流进行仅验证的空运行
2. 对常规 beta 优先流程选择 `npm_dist_tag=beta`，或者仅在你有意直接发布稳定版时选择 `latest`
3. 当你希望从一个手动工作流获得常规 CI 加上实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并使用 `preflight_only=false`、相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id`
7. 如果发布落在 `beta`，使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta` 应立即跟随同一个稳定构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或者让它的计划自修复同步稍后移动 `beta`

dist-tag 变更位于私有仓库中，是出于安全原因，因为它仍然需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这会让直接发布路径和 beta 优先提升路径都保持已文档化，并对操作员可见。

如果维护者必须回退到本地 npm 认证，请仅在专用 tmux 会话内运行任何 1Password
CLI (`op`) 命令。不要直接从主智能体 shell 调用 `op`；将其保持在 tmux 内可以让提示、
警报和 OTP 处理过程可观察，并防止重复的主机警报。

## 公共参考资料

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

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
