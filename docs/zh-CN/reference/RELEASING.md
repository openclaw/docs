---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或包验收
    - 想了解版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-29T07:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84c8dcd13f247b5d136d8a675ce53ef12c68a7f7242d485fe4b55570105ef180
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- 稳定版：带标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- 测试版：发布到 npm `beta` 的预发布标签
- 开发版：`main` 的移动 HEAD

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- 测试版预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要给月份或日期补零
- `latest` 表示当前已提升的稳定版 npm 发布
- `beta` 表示当前测试版安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升一个已验证的测试版构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  测试版发布通常会先验证并发布 npm/包路径，而 mac 应用的构建/签名/公证默认保留给稳定版，除非明确请求

## 发布节奏

- 发布按测试版优先推进
- 只有在最新测试版验证通过后，才会发布稳定版
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果测试版标签已经推送或发布后需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧的测试版标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作员清单

此清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新代码，确认目标提交已经推送，
   并确认当前 `main` 的 CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送，然后在创建分支前再次 rebase/pull。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍被覆盖时才移除过期兼容性，或记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为目标标签更新每个必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   可以使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，使用 `Full Release Validation`
   启动所有预发布测试。这是四个大型发布测试箱的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败文件、通道、workflow job、包 profile、提供商或模型 allowlist。只有当变更范围使先前证据失效时，才重新运行完整总括流程。
9. 对于测试版，标记 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的测试版需要修复，切出下一个 `-beta.N`；不要删除或重写旧测试版。
10. 对于稳定版，只有在已验证的测试版或发布候选版本具备所需验证证据后才继续。稳定版 npm 发布会通过 `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还要求 `main` 上有已打包的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；当需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；在需要时执行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布/预发布说明；并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也有覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外也为绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保预期的 `dist/*` 发布产物和 Control UI 包已存在，可供打包验证步骤使用
- 在发布审批前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试箱。它接受分支、标签或完整提交 SHA，会派发手动 `CI`，并派发 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。仅在包已经发布且发布后的 Telegram E2E 也应运行时，才提供 `npm_telegram_package_spec`。当私有证据报告应证明验证匹配已发布的 npm 包，但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你想在发布工作继续进行时为包候选版本获取旁路证明，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：不含 OpenWebUI 或 live ClawHub 的产物原生包/更新/插件通道
  - `product`：包配置，加上 MCP 渠道、cron/子智能体清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 派发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而无需 Opik、Langfuse 或其他外部收集器。
- 在每个带标签的发布前运行 `pnpm release:check`
- 发布检查现在运行在单独的手动工作流中：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock parity 门禁，以及快速 live Matrix 配置和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你需要并行获取完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨操作系统安装和升级运行时验证属于公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径短小、确定且聚焦产物，同时让较慢的 live 检查留在自己的通道中，避免拖慢或阻塞发布
- 带密钥的发布检查应通过 `Full Release Validation` 派发，或从 `main`/release 工作流 ref 派发，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，前提是解析出的提交可从 OpenClaw 分支或发布标签访问
- `OpenClaw NPM Release` 仅验证预检也接受当前完整的 40 字符工作流分支提交 SHA，而无需已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更性验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版本），在全新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用的 Telegram 凭证池，针对已发布 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭证。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行同一个发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再提升：
  - 真实 npm 发布必须通过一次成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支派发
  - 稳定 npm 发布默认使用 `beta`
  - 稳定 npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，出于安全考虑，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于类似 `YYYY.M.D-N` 的稳定修正发布，发布后验证器还会检查同一个临时前缀从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的路径，确保发布修正不会静默地让旧的全局安装停留在基础稳定 payload 上
- npm 发布预检会失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，避免再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布注册表安装是否在根 `dist/*` 布局下包含非空的内置插件运行时依赖。发布版本如果缺失或带有空的内置插件依赖 payload，会导致发布后验证器失败，且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 能在发布路径前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件 timing manifest 或插件测试矩阵，请在审批前重新生成并审阅 `.github/workflows/plugin-prerelease.yml` 中由规划器拥有的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- 稳定 macOS 发布就绪性还包括更新器表面：
  - GitHub 发布最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定 zip
  - 打包应用必须保留非调试 bundle id、非空 Sparkle feed URL，以及等于或高于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试箱

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。请从可信的 `main` 工作流 ref 运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，使用 `target_ref=<release-ref>` 派发手动 `CI`，派发 `OpenClaw Release Checks`，并在设置了 `npm_telegram_package_spec` 时可选地派发独立的发布后 Telegram E2E。随后 `OpenClaw Release Checks` 会展开安装冒烟、跨操作系统发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，且任何可选的 `npm_telegram` 子项成功或被有意跳过时，完整运行才可接受。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志也能看到当前关键路径。
子工作流从运行 `Full Release Validation` 的可信 ref 派发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签。不存在单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择可信 harness。

使用 `release_profile` 选择 live/提供商覆盖范围：

- `minimum`：最快的发布关键 OpenAI/核心 live 和 Docker 路径
- `stable`：minimum 加上用于发布审批的稳定提供商/后端覆盖
- `full`：stable 加上广泛的 advisory 提供商/媒体覆盖

`OpenClaw Release Checks` 使用可信工作流 ref 将目标 ref 解析一次为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该产物。这会让所有面向包的测试箱使用相同字节，并避免重复构建包。

根据发布阶段使用这些变体：

```bash
# 验证未发布的发布候选分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# 验证精确的已推送提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 发布 beta 后，加入已发布包 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在聚焦修复后的第一次重跑中使用完整总控流程。如果某个 box
失败，请使用失败的子工作流、job、Docker lane、package profile、模型
提供商或 QA lane 作为下一次验证。只有当修复更改了共享发布编排，或让早前的全 box 证据
失效时，才再次运行完整总控流程。总控流程的最终验证器会重新检查已记录的子工作流运行
ID，因此在子工作流成功重跑后，只重跑失败的
`Verify full validation` 父 job。

对于有界恢复，请向总控流程传递 `rerun_group`。`all` 是真正的
候选发布运行，`ci` 只运行常规 CI 子流程，`plugin-prerelease`
只运行仅发布使用的插件子流程，`release-checks` 运行每个发布
box，更窄的发布分组包括 `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供
独立 package Telegram lane 时使用的 `npm-telegram`。

### Vitest

Vitest box 是手动 `CI` 子工作流。手动 CI 有意绕过变更范围限定，并为候选发布强制运行常规测试图：Linux Node shards、内置插件 shards、渠道 contracts、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n。

使用这个 box 回答“源代码树是否通过了完整的常规测试套件？”
它不同于发布路径的产品验证。需要保留的证据：

- `Full Release Validation` 摘要，其中显示已调度的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上为绿色
- 调查回归时，来自 CI jobs 的失败或较慢 shard 名称
- 当某次运行需要性能分析时，保留 Vitest 计时工件，例如 `.artifacts/vitest-shard-timings.json`

只有当发布需要确定性的常规 CI，但不需要 Docker、QA Lab、live、cross-OS 或 package box 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 提供，并包含发布模式的
`install-smoke` 工作流。它通过打包后的 Docker 环境验证候选发布，而不是只做源代码级测试。

发布 Docker 覆盖范围包括：

- 启用较慢 Bun 全局安装 smoke 的完整安装 smoke
- 仓库 E2E lanes
- 发布路径 Docker chunks：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `bundled-channels-core`、`bundled-channels-update-a`、
  `bundled-channels-update-b` 和 `bundled-channels-contracts`
- 请求时，在 `plugins-runtime-core` chunk 中覆盖 OpenWebUI
- 将内置渠道依赖 lanes 拆分到 channel-smoke、update-target
  和 setup/runtime contract chunks，而不是一个大型 bundled-channel job
- 拆分内置插件安装/卸载 lanes
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-7`
- 当发布检查包含 live suites 时，覆盖 live/E2E 提供商套件和 Docker live 模型

重跑前先使用 Docker 工件。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、
阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，在可复用 live/E2E 工作流上使用
`docker_lanes=<lane[,lane]>`，而不是重跑所有发布 chunks。生成的重跑命令会在可用时包含之前的
`package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的 lane 可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic
行为和渠道级发布门禁，独立于 Vitest 和 Docker package 机制。

发布 QA Lab 覆盖范围包括：

- mock parity gate，使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6
  基线进行比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭据租约的 live Telegram QA lane
- 当发布遥测需要显式本地证据时，运行 `pnpm qa:otel:smoke`

使用这个 box 回答“该发布在 QA 场景和 live 渠道流程中是否行为正确？”
批准发布时，请保留 parity、Matrix 和 Telegram lanes 的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行提供，而不是默认的发布关键 lane。

### Package

Package box 是可安装产品门禁。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选项规范化为 Docker E2E 消费的 `package-under-test` tarball，验证 package 清单，记录 package 版本和 SHA-256，并将工作流 harness ref 与 package source ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包受信任的 `package_ref` 分支、tag 或完整 commit SHA
- `source=url`：下载 HTTPS `.tgz`，并要求提供 `package_sha256`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=ref`、
`package_ref=<release-ref>`、`suite_profile=custom`、
`docker_lanes=bundled-channel-deps-compat plugins-offline` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker chunks 覆盖重叠的安装、更新和 plugin-update lanes；Package Acceptance 针对同一个已解析 tarball 保留工件原生的内置渠道兼容性、离线插件 fixtures 和 Telegram package QA。它是 GitHub 原生替代方案，用于取代过去大多数需要 Parallels 的 package/update 覆盖。Cross-OS 发布检查对于特定操作系统的新手引导、安装器和平台行为仍然重要，但 package/update 产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽容策略有意设置了时间边界。到
`2026.4.25` 为止的 package 可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的
`gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件 install-record
位置、缺失的 marketplace install-record 持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` package 可以对已经发布的本地构建元数据 stamp 文件发出警告。之后的 package 必须满足现代 package contract；同样的缺口会导致发布验证失败。

当发布问题涉及实际可安装 package 时，使用更广的 Package Acceptance profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见 package profiles：

- `smoke`：快速 package 安装/channel/agent、Gateway 网关网络和配置重载 lanes
- `package`：不含 live ClawHub 的安装/更新/插件 package contracts；这是 release-check 的默认值
- `product`：`package` 加上 MCP channels、cron/subagent 清理、OpenAI web
  search 和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径 chunks
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于 package-candidate Telegram 证据，请在 Package Acceptance 上启用
`telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会将已解析的 `package-under-test` tarball 传入 Telegram lane；独立 Telegram 工作流仍接受已发布的 npm spec，用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作者控制的输入：

- `tag`：必填发布 tag，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前
  完整 40 字符工作流分支 commit SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/package，`false` 表示真正的发布路径
- `preflight_run_id`：真正发布路径必填，这样工作流可以复用成功预检运行准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标 tag；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作者控制的输入：

- `ref`：要验证的分支、tag 或完整 commit SHA。带有密钥的检查要求解析后的 commit 可从 OpenClaw 分支或发布 tag 访问。

规则：

- Stable 和 correction tags 可以发布到 `beta` 或 `latest`
- Beta prerelease tags 只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许输入完整 commit SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真正发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## Stable npm 发布流程

切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在 tag 存在之前，你可以使用当前完整工作流分支 commit
     SHA 对预检工作流做仅验证 dry run
2. 对于常规 beta-first 流程，选择 `npm_dist_tag=beta`；只有在你有意直接发布 stable 时，才选择 `latest`
3. 当你想通过一个手动工作流获得常规 CI 加 live prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布 tag 或完整
   commit SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在 release ref 上运行手动
   `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`、相同的
   `tag`、相同的 `npm_dist_tag`，以及保存的 `preflight_run_id`
7. 如果发布落在 `beta`，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该 stable 版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，并且 `beta`
   应立即跟随同一个 stable build，请使用同一个私有
   工作流将两个 dist-tags 指向该 stable 版本，或让它的定时
   自修复同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全原因，因为它仍需要
`NPM_TOKEN`，而公共仓库保持仅使用 OIDC 发布。

这样可以让直接发布路径和 beta-first 提升路径都得到文档化，并且对操作者可见。

如果维护者必须回退到本地 npm 认证，请只在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要从主 agent shell 直接调用 `op`；将它放在 tmux 中可让提示、警报和 OTP 处理保持可观察，并避免重复的主机警报。

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
