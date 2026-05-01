---
read_when:
    - 正在查找公共发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-01T03:00:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- 稳定版：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- 测试版：发布到 npm `beta` 的预发布标签
- 开发版：`main` 的移动最新提交

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- 测试版预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要为月份或日期补零
- `latest` 表示当前已提升的稳定版 npm 发布版本
- `beta` 表示当前的测试版安装目标
- 稳定版和稳定版修正发布版本默认发布到 npm `beta`；发布操作者可以明确指定 `latest`，或稍后提升经过验证的测试版构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  测试版发布通常会先验证并发布 npm/包路径，除非明确请求，否则
  mac 应用构建/签名/公证会保留给稳定版

## 发布节奏

- 发布先进入测试版
- 只有在最新测试版通过验证后，稳定版才会跟进
- 维护者通常会从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果测试版标签已经推送或发布但需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧的测试版标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者访问

## 发布操作者检查清单

此检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅限维护者访问的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送，然后在创建分支前再次 rebase/pull。
3. 查看
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅当升级路径仍被覆盖时才移除已过期的
   兼容性，或记录为什么有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为目标标签更新每个必需的版本位置，然后运行
   本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。
   这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败
   文件、通道、工作流作业、包配置、提供商或模型允许列表。仅当变更表面使
   先前证据失效时，才重新运行完整总入口。
9. 对于测试版，标记 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的测试版需要修复，
   切出下一个 `-beta.N`；不要删除或重写旧测试版。
10. 对于稳定版，仅在经过验证的测试版或发布候选版具备
    所需验证证据后继续。稳定版 npm 发布会通过 `preflight_run_id` 复用成功的
    预检工件；稳定版 macOS 发布就绪还需要 `main` 上的打包 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，运行可选的独立
    已发布 npm Telegram E2E；在需要时进行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布/预发布说明；
    并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也被覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外也是绿色的
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 在发布批准前运行手动 `Full Release Validation` workflow，从一个入口点启动所有预发布测试盒。它接受分支、标签或完整 commit SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，用于安装 smoke、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 对齐性、Matrix 和 Telegram 通道。仅在包已发布且发布后 Telegram E2E 也应运行时提供 `npm_telegram_package_spec`。当私有证据报告应证明验证与已发布 npm 包匹配、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行的同时，为包候选版本获取旁路证明时，运行手动 `Package Acceptance` workflow。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 将受信任的 `package_ref` 分支/标签/SHA 与当前 `workflow_ref` harness 打包；对需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或对由另一个 GitHub Actions run 上传的 tarball 使用 `source=artifact`。该 workflow 将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且可以用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当选定的 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选版本，而 `published_upgrade_survivor_baseline` 选择已发布基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：产物原生的包/更新/插件通道，不包含 OpenWebUI 或 live ClawHub
  - `product`：package profile 加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` workflow。手动 CI 分发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布 telemetry 时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部 collector。
- 在每次带标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock 对齐性门禁，以及快速 live Matrix profile 和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 也使用 Convex CI 凭证租约。当你想并行获取完整 Matrix 传输、媒体和 E2EE inventory 时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` workflow。
- 跨操作系统安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真实 npm 发布路径保持短、确定且聚焦产物，而较慢的 live 检查保留在自己的通道中，避免拖慢或阻塞发布
- 带 secret 的发布检查应通过 `Full Release Validation` 分发，或从 `main`/release workflow ref 分发，以便 workflow 逻辑和 secret 保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整 commit SHA，只要解析出的 commit 可从 OpenClaw 分支或发布标签访问
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符 workflow 分支 commit SHA，不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，workflow 只会为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个 workflow 都将真实发布和推广路径保留在 GitHub-hosted runner 上，而非变更性的验证路径可以使用更大的 Blacksmith Linux runner
- 该 workflow 会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secret
- npm 发布预检不再等待单独的发布检查通道
- 在批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正版标签）
- npm publish 后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版版本），在全新的临时 prefix 中验证已发布 registry 安装路径
- beta publish 后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭证池，针对已发布 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性运行可以省略 Convex vars，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭证。
- 维护者可以通过手动 `NPM Telegram Beta E2E` workflow 从 GitHub Actions 运行同一个发布后检查。它有意仅限手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再推广：
  - 真实 npm publish 必须通过成功的 npm `preflight_run_id`
  - 真实 npm publish 必须从与成功预检 run 相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - stable npm 发布默认使用 `beta`
  - stable npm publish 可以通过 workflow input 显式目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，这是出于安全考虑，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC publish
  - 公开 `macOS Release` 仅用于验证；当标签只存在于 release 分支但 workflow 从 `main` 分发时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac publish 必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会推广准备好的产物，而不是再次重建它们
- 对于 `YYYY.M.D-N` 这样的 stable 修正发布，发布后 verifier 也会检查同一临时 prefix 从 `YYYY.M.D` 到 `YYYY.M.D-N` 的升级路径，确保发布修正不会静默地让较旧的全局安装停留在基础 stable payload 上
- npm 发布预检默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，这样我们就不会再次发布空的浏览器 dashboard
- 发布后验证还会检查已发布 registry 安装在根 `dist/*` 布局下包含非空的内置插件运行时依赖。若某个发布缺少内置插件依赖 payload，或该 payload 为空，则 postpublish verifier 会失败，且无法推广到 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此 installer e2e 可以在发布 publish 路径前捕获意外的 pack 膨胀
- 如果发布工作触及 CI 规划、插件 timing manifest 或插件测试矩阵，请在批准前重新生成并审查由 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- stable macOS 发布就绪性也包括 updater 表面：
  - GitHub release 最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - publish 后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非 debug bundle id、非空 Sparkle feed URL，以及对该发布版本而言不低于规范 Sparkle build 下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。从受信任的 `main` workflow ref 运行它，并将发布分支、标签或完整 commit SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该 workflow 会解析目标 ref，使用 `target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置了 `npm_telegram_package_spec` 时可选地分发独立的发布后 Telegram E2E。随后 `OpenClaw Release Checks` 会分发安装 smoke、跨操作系统发布检查、live/E2E Docker 发布路径覆盖、带 Telegram package QA 的 Package Acceptance、QA Lab 对齐性、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，且任何可选 `npm_telegram` 子项成功或有意跳过时，完整运行才可接受。最终 verifier 摘要会包含每个子 run 的最慢 job 表，因此发布经理无需下载日志就能看到当前关键路径。
参见 [完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确 workflow job 名称、stable 与 full profile 差异、产物以及聚焦重跑句柄。
子 workflow 从运行 `Full Release Validation` 的受信任 ref 分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签。没有单独的 Full Release Validation workflow-ref input；通过选择 workflow run ref 来选择受信任的 harness。

使用 `release_profile` 选择 live/provider 覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的 stable provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

`OpenClaw Release Checks` 使用受信任的工作流引用，将目标引用一次解析为 `release-package-under-test`，并在 release-path Docker 检查和 Package Acceptance 中复用该工件。这会让所有面向包的盒子使用相同字节，并避免重复构建包。跨 OS OpenAI 安装冒烟测试会在设置了仓库/组织变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因为此通道验证的是包安装、新手引导、Gateway 网关启动和一次实时智能体轮次，而不是对最慢的默认模型做基准测试。更广泛的实时提供商矩阵仍然负责模型特定覆盖。

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

不要在一次聚焦修复后把完整总控作为首次重跑。如果一个盒子失败，请使用失败的子工作流、作业、Docker 通道、包配置文件、模型提供商或 QA 通道作为下一次证明。只有当修复更改了共享发布编排，或让之前的全盒子证据过期时，才再次运行完整总控。总控的最终验证器会重新检查已记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传给总控。`all` 是真正的候选发布运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布的插件子项，`release-checks` 运行每个发布盒子，更窄的发布分组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供独立包 Telegram 通道时的 `npm-telegram`。

### Vitest

Vitest 盒子是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并强制对候选发布运行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

用这个盒子回答“源代码树是否通过了完整的普通测试套件？”它不同于 release-path 产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已分派的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上为绿色
- 调查回归时来自 CI 作业的失败或慢速分片名称
- 运行需要性能分析时的 Vitest 计时工件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、实时、跨 OS 或包盒子时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 盒子位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流提供。它通过打包后的 Docker 环境验证候选发布，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并将 QR、root/gateway 和 installer/Bun 冒烟作业作为独立 install-smoke 分片运行
- 仓库 E2E 通道
- release-path Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`
- 按请求在 `plugins-runtime-services` 分块内提供 OpenWebUI 覆盖
- 将内置渠道依赖通道拆分到 channel-smoke、update-target 和 setup/runtime contract 分块，而不是一个大型 bundled-channel 作业
- 拆分内置插件安装/卸载通道 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，包含 live/E2E 提供商套件和 Docker 实时模型覆盖

重跑前先使用 Docker 工件。release-path 调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用相同 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 盒子也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- 使用智能体 parity 包对比 OpenAI 候选通道与 Opus 4.6 基线的 mock parity gate
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置文件
- 使用 Convex CI 凭证租约的实时 Telegram QA 通道
- 发布遥测需要显式本地证明时的 `pnpm qa:otel:smoke`

用这个盒子回答“发布在 QA 场景和实时渠道流程中是否行为正确？”批准发布时保留 parity、Matrix 和 Telegram 通道的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键通道。

### 包

包盒子是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选项规范化为供 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流 harness 引用与包源引用分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载 HTTPS `.tgz`，并要求提供 `package_sha256`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=ref`、`package_ref=<release-ref>`、`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。release-path Docker 分块覆盖重叠的安装、更新和插件更新通道；Package Acceptance 针对同一个已解析 tarball 保留工件原生的内置渠道兼容性、离线插件夹具和 Telegram 包 QA。它是 GitHub 原生替代方案，用来替代以前大多数需要 Parallels 的包/更新覆盖。跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽松策略有意设置了时间边界。到 `2026.4.25` 为止的包，可以针对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少 `gateway install --wrapper`、tarball 派生 git 夹具中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会对已经发布的本地构建元数据戳文件发出警告。之后的包必须满足现代包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更广泛的 Package Acceptance 配置文件：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包配置文件：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：没有实时 ClawHub 的安装/更新/插件包契约；这是 release-check 默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker release-path 分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将已解析的 `package-under-test` tarball 传入 Telegram 通道；独立 Telegram 工作流仍接受已发布的 npm 规格用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作者控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，这样工作流可以复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受这些由操作者控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签访问。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会验证发布前的元数据仍然一致

## 稳定 npm 发布顺序

切割稳定 npm 发布时：

1. 运行 `OpenClaw NPM Release` 并设置 `preflight_only=true`
   - 在标签存在之前，你可以使用当前完整工作流分支的 commit
     SHA，对预检工作流进行仅验证的试运行
2. 为常规 beta 优先流程选择 `npm_dist_tag=beta`，只有在你明确想要直接发布稳定版时才选择 `latest`
3. 当你想通过一个手动工作流获得常规 CI，以及实时提示缓存、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整
   commit SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，请改为在发布 ref 上运行手动
   `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`、相同的
   `tag`、相同的 `npm_dist_tag`，以及保存的 `preflight_run_id`
7. 如果发布落在 `beta` 上，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，并且 `beta`
   应立即跟随同一个稳定构建，请使用同一个私有
   工作流让两个 dist-tag 都指向该稳定版本，或让它的定时
   自修复同步稍后移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这会让直接发布路径和 beta 优先提升路径都保持
已文档化且对操作者可见。

如果维护者必须回退到本地 npm 身份验证，请只在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将它保留在 tmux 内可以让提示、
警报和 OTP 处理可观测，并防止重复的主机警报。

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
