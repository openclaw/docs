---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-29T21:36:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：已打标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- stable 修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- stable 和 stable 修正发布版本默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升一个已验证的 beta 构建
- 每个 stable OpenClaw 发布版本都会同时交付 npm 包和 macOS 应用；
  beta 发布版本通常先验证并发布 npm/包路径，除非明确请求，否则
  mac 应用构建/签名/公证仅保留给 stable

## 发布节奏

- 发布按 beta 优先推进
- 只有最新 beta 通过验证后才会发布 stable
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布版本，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布且需要修复，维护者会切出下一个 `-beta.N` 标签，
  而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者查看

## 发布操作员清单

此清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够绿，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交它，推送它，并在创建分支前再次 rebase/pull。
3. 检查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍被覆盖时才移除过期兼容性，
   否则记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为预期标签更新每个必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整 40 字符的发布分支 SHA 进行仅验证预检。
   保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。
   这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败
   文件、通道、workflow job、package profile、provider 或 model allowlist。
   只有当变更范围让先前证据过期时，才重新运行完整 umbrella。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的 beta 需要修复，
   切出下一个 `-beta.N`；不要删除或重写旧 beta。
10. 对于 stable，只有在已验证的 beta 或发布候选具备所需验证证据后才继续。
    stable npm 发布会通过 `preflight_run_id` 复用成功的
    预检工件；stable macOS 发布就绪还要求 `main` 上存在已打包的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器，需要发布后渠道证明时可选运行独立的
    published-npm Telegram E2E，按需进行 dist-tag 提升，根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub release/prerelease notes，
    并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外为绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，确保预期的 `dist/*` 发布产物和控制 UI 包存在，供打包验证步骤使用
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，用于安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 线路。仅在包已发布且发布后的 Telegram E2E 也应运行时，才提供 `npm_telegram_package_spec`。当私有证据报告应证明验证匹配已发布的 npm 包、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行的同时，为包候选项获取侧信道证明时，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选项解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载线路
  - `package`：不含 OpenWebUI 或 live ClawHub 的产物原生包/更新/插件线路
  - `product`：包配置加 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选项的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和控制 UI i18n 线路。示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器运行 QA-lab，并验证导出的跟踪 span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部采集器。
- 每次打标签发布前运行 `pnpm release:check`
- 发布检查现在在一个单独的手动工作流中运行：`OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab 模拟一致性门禁、快速 live Matrix 配置和 Telegram QA 线路。live 线路使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你希望并行获取完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨操作系统安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径短、确定且聚焦产物，同时让较慢的 live 检查留在自己的线路中，避免拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 分发，或从 `main`/release 工作流引用分发，以保持工作流逻辑和密钥受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，无需已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更性验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查线路
- 在批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正版标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版版本），在全新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭证池，针对已发布的 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭证。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行同一个发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - 稳定 npm 发布默认使用 `beta`
  - 稳定 npm 发布可以通过工作流输入显式目标为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，出于安全考虑，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于类似 `YYYY.M.D-N` 的稳定修正版本，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，确保发布修正不会静默地让较旧的全局安装停留在基础稳定载荷上
- npm 发布预检会默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，避免再次发布空的浏览器仪表板
- 发布后验证还会检查已发布注册表安装是否在根 `dist/*` 布局下包含非空的内置插件运行时依赖。若发布版本缺少或带有空的内置插件依赖载荷，发布后验证器会失败，且无法提升为 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布发布路径前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件计时清单或插件测试矩阵，请在批准前重新生成并审查由规划器拥有的 `plugin-prerelease-extension-shard` 矩阵输出，来源于 `.github/workflows/plugin-prerelease.yml`，确保发布说明不会描述过时的 CI 布局
- 稳定 macOS 发布就绪还包括更新器表面：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定 zip
  - 打包后的应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及等于或高于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。从可信的 `main` 工作流引用运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标引用，使用 `target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置了 `npm_telegram_package_spec` 时可选地分发独立的发布后 Telegram E2E。随后，`OpenClaw Release Checks` 会扇出安装冒烟、跨操作系统发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab 一致性、live Matrix 和 live Telegram。完整运行只有在 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，且任何可选的 `npm_telegram` 子项成功或被有意跳过时才可接受。最终验证器摘要会包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。子工作流从运行 `Full Release Validation` 的可信引用分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签。不存在单独的 Full Release Validation 工作流引用输入；通过选择工作流运行引用来选择可信 harness。

使用 `release_profile` 选择 live/提供商覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的建议提供商/媒体覆盖

`OpenClaw Release Checks` 使用可信工作流引用将目标引用一次性解析为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该产物。这会让所有面向包的测试盒使用相同字节，并避免重复构建包。当设置了仓库/组织变量时，跨操作系统 OpenAI 安装冒烟使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因为此线路证明的是包安装、新手引导、Gateway 网关启动和一次 live 智能体轮次，而不是基准测试最慢的默认模型。更广泛的 live 提供商矩阵仍然是模型特定覆盖的位置。

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

不要把完整总控流程用作聚焦修复后的第一次重跑。如果某个盒子失败，
下一次证明请使用失败的子 workflow、job、Docker 通道、包配置文件、模型
提供商或 QA 通道。只有当修复更改了共享发布编排，或使此前所有盒子的
证据过期时，才再次运行完整总控流程。总控流程的最终验证器会重新检查
已记录的子 workflow 运行 ID，因此在子 workflow 成功重跑后，只需重跑
失败的父级 `Verify full validation` job。

对于有界恢复，请向总控流程传入 `rerun_group`。`all` 是真正的
候选发布运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行
仅发布插件子项，`release-checks` 会运行每个发布盒子，更窄的发布组包括
`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、
`qa-live`，以及在提供独立包 Telegram 通道时的 `npm-telegram`。

### Vitest

Vitest 盒子是手动 `CI` 子 workflow。手动 CI 会有意绕过变更范围限定，
并为候选发布强制运行普通测试图：Linux Node 分片、内置插件分片、渠道
契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、
Python skills、Windows、macOS、Android，以及 Control UI i18n。

使用这个盒子回答“源代码树是否通过了完整的普通测试套件？”它与发布路径
产品验证不同。需要保留的证据：

- `Full Release Validation` 摘要，显示已调度的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上为绿色
- 调查回归时来自 CI job 的失败或缓慢分片名称
- 当一次运行需要性能分析时，保留 `.artifacts/vitest-shard-timings.json`
  等 Vitest 计时产物

仅当发布需要确定性的普通 CI，而不需要 Docker、QA Lab、live、cross-OS
或 package 盒子时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 盒子位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 提供，另有发布模式的
`install-smoke` workflow。它通过打包后的 Docker 环境验证候选发布，而不
只是源码级测试。

发布 Docker 覆盖范围包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，QR、root/gateway 和
  installer/Bun 冒烟 job 作为独立的 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g`、`plugins-runtime-install-h`、
  `bundled-channels-core`、`bundled-channels-update-a`、
  `bundled-channels-update-discord`、`bundled-channels-update-b`，以及
  `bundled-channels-contracts`
- 按需在 `plugins-runtime-services` 分块内覆盖 OpenWebUI
- 将内置渠道依赖通道拆分到 channel-smoke、update-target 以及
  setup/runtime 契约分块，而不是一个大型 bundled-channel job
- 拆分内置插件安装/卸载通道，从 `bundled-plugin-install-uninstall-0`
  到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live 套件时，覆盖 live/E2E 提供商套件和 Docker live
  模型覆盖

重跑前先使用 Docker 产物。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、
`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，
请在可复用 live/E2E workflow 上使用 `docker_lanes=<lane[,lane]>`，
而不是重跑所有发布分块。生成的重跑命令会在可用时包含此前的
`package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以
复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 盒子也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和
渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖范围包括：

- mock parity gate，使用 agentic parity pack 将 OpenAI 候选通道与
  Opus 4.6 基线进行比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭据租约的 live Telegram QA 通道
- 当发布遥测需要明确的本地证明时运行 `pnpm qa:otel:smoke`

使用这个盒子回答“该发布在 QA 场景和 live 渠道流程中是否行为正确？”
批准发布时保留 parity、Matrix 和 Telegram 通道的产物 URL。完整 Matrix
覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认发布关键通道。

### Package

Package 盒子是可安装产品门禁。它由 `Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支持。该解析器会将候选项
规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，
记录包版本和 SHA-256，并让 workflow harness ref 与包源码 ref 保持分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw
  发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包受信任的
  `package_ref` 分支、标签或完整 commit SHA
- `source=url`：下载 HTTPS `.tgz`，并要求提供 `package_sha256`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、`package_ref=<release-ref>`、
`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline`
和 `telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker
分块覆盖重叠的安装、更新和插件更新通道；Package Acceptance 则针对同一
已解析 tarball 保留产物原生的内置渠道兼容性、离线插件夹具和 Telegram
包 QA。它是过去大部分需要 Parallels 的包/更新覆盖的 GitHub 原生替代。
Cross-OS 发布检查对特定 OS 的新手引导、安装器和平台行为仍然重要，但
包/更新产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽容策略有意设置了时间边界。直到 `2026.4.25`
的包都可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少
私有 QA 清单条目、缺少 `gateway install --wrapper`、tarball 派生的 git
夹具中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录
位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的
配置元数据迁移。已发布的 `2026.4.26` 包可以对已经随版本发布的本地构建
元数据 stamp 文件发出警告。之后的包必须满足现代包契约；这些相同缺口
会导致发布验证失败。

当发布问题涉及实际可安装包时，请使用更广的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见包配置：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置热重载通道
- `package`：不含 live ClawHub 的安装/更新/插件包契约；这是 release-check
  默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web
  search 和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，请在 Package Acceptance 上启用
`telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该 workflow
会把已解析的 `package-under-test` tarball 传入 Telegram 通道；独立
Telegram workflow 仍接受已发布的 npm spec，用于发布后检查。

## NPM workflow 输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整
  40 字符 workflow 分支 commit SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，这样 workflow 会复用成功预检运行
  准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整 commit SHA。带密钥的检查要求解析后的
  commit 可从 OpenClaw 分支或发布标签访问。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入
  完整 commit SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；workflow 会
  在发布继续前验证该元数据

## 稳定版 npm 发布序列

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在前，可以使用当前完整 workflow 分支 commit SHA，对预检
     workflow 做一次仅验证的 dry run
2. 普通 beta-first 流程选择 `npm_dist_tag=beta`；只有在有意直接发布稳定版时
   才选择 `latest`
3. 当你想从一个手动 workflow 获得普通 CI 加 live prompt cache、Docker、
   QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整 commit SHA
   上运行 `Full Release Validation`
4. 如果你有意只需要确定性的普通测试图，则改为在发布 ref 上运行手动 `CI`
   workflow
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并使用 `preflight_only=false`、相同的
   `tag`、相同的 `npm_dist_tag`，以及已保存的 `preflight_run_id`
7. 如果发布落在 `beta`，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow 将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个稳定构建，
   请使用同一个私有 workflow 将两个 dist-tag 指向该稳定版本，或让其计划式
   自修复同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍然需要 `NPM_TOKEN`，
而公共仓库保持仅 OIDC 发布。

这样可以让直接发布路径和 beta-first 提升路径都得到记录，并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，只能在专用的 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将它保留在 tmux 内可以让提示、
警报和 OTP 处理可观察，并防止重复的主机警报。

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

## 相关

- [发布渠道](/zh-CN/install/development-channels)
