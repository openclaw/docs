---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 正在查找版本命名和节奏
summary: 发布通道、操作员检查清单、验证框、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T19:38:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ad73d75e54bd21cb740b64af0b33cc9d38283de8917544d5795990d3f0aacb6
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布通道：

- stable：打标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续移动头部版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要为月份或日期补零
- `latest` 表示当前已提升的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或稍后再提升经过验证的 beta 构建
- 每个 stable OpenClaw 发布都会同时交付 npm 软件包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/软件包路径，而 macOS 应用的构建/签名/公证通常保留给 stable，除非有明确请求

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 完成验证后，才会进入 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来进行发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布且需要修复，维护者会切出下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅面向维护者

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复以及紧急回滚细节保留在
仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新代码，确认目标提交已推送，
   并确认当前 `main` 的 CI 足够绿色，可以从它切分支。
2. 使用 `/changelog` 基于真实提交历史重写 `CHANGELOG.md` 的顶部章节，
   保持条目面向用户，提交它，推送它，并在分支前再执行一次 rebase/pull。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts`
   中的发布兼容性记录。只有在升级路径仍有保障时才移除已过期的兼容性，
   否则要记录为什么仍需保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为目标标签更新所有必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签尚不存在时，
   可以使用完整的 40 字符发布分支 SHA 进行仅验证用途的预检。保存成功的
   `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，使用 `Full Release Validation`
   启动所有预发布测试。这是四个大型发布验证框的唯一手动入口：
   Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复有效的最小失败范围，
   比如单个文件、通道、workflow 作业、软件包配置、提供商或模型 allowlist。
   只有在改动范围使先前证据失效时，才重新运行完整总流程。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，
   然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 软件包运行发布后软件包验收。如果已推送或已发布的 beta 需要修复，
   则切出下一个 `-beta.N`；不要删除或改写旧的 beta。
10. 对于 stable，只有在经过验证的 beta 或候选发布已具备所需验证证据后才继续。
    Stable 的 npm 发布会通过 `preflight_run_id` 复用成功的预检产物；stable 的 macOS 发布就绪
    还要求 `main` 上存在已打包的 `.zip`、`.dmg`、`.dSYM.zip` 以及更新后的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；当你需要发布后的渠道证明时，可选择运行独立的
    已发布 npm Telegram E2E；并在需要时执行 dist-tag 提升、基于完整匹配
    `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明，以及发布公告步骤。

## 发布预检

- 在发布预检之前运行 `pnpm check:test-types`，这样测试 TypeScript 也能在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布预检之前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查也能在更快的本地门禁之外保持绿色
- 在运行 `pnpm release:check` 之前执行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 就会存在
- 在发布审批之前运行手动 `Full Release Validation` workflow，从一个入口点启动所有预发布测试框。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，用于安装冒烟测试、软件包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。只有在软件包已经发布且还需要运行发布后 Telegram E2E 时，才提供 `npm_telegram_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行的同时，为某个软件包候选版本获得旁路证明时，运行手动 `Package Acceptance` workflow。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 时，可用当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；对由其他 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该 workflow 会将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 对同一个 tarball 运行 Telegram QA。示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置热重载通道
  - `package`：原生制品软件包/更新/插件通道，不含 OpenWebUI 或 live ClawHub
  - `product`：在 package 配置基础上增加 MCP 渠道、cron/subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes`，用于聚焦重跑
- 当你只需要发布候选版本具备完整常规 CI 覆盖时，直接运行手动 `CI` workflow。手动 CI 分发会绕过 changed 范围限制，并强制运行 Linux Node 分片、bundled-plugin 分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器驱动 QA-lab，并验证导出的 trace span 名称、受限属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 在每次打标签发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批之前运行 QA Lab mock 一致性门禁，以及快速 live Matrix 配置和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。若你想并行运行完整的 Matrix 传输、媒体和 E2EE 清单，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` workflow。
- 跨操作系统的安装和升级运行时验证属于公开的 `OpenClaw Release Checks` 和 `Full Release Validation`，它们会直接调用可复用 workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：保持真实 npm 发布路径简短、确定性强，并聚焦于制品；而较慢的 live 检查则保留在独立通道中，这样它们就不会拖慢或阻塞发布
- 含有秘密信息的发布检查应通过 `Full Release Validation` 分发，或从 `main`/release workflow ref 分发，以确保 workflow 逻辑和 secrets 受到控制
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从某个 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整的 40 字符 workflow 分支提交 SHA，而不要求已有已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，workflow 仅为软件包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个 workflow 都会将真实发布和提升路径保留在 GitHub-hosted runners 上，而非变更性的验证路径则可使用更大的 Blacksmith Linux runners
- 该 workflow 会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个 workflow secrets
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/修正版版本），以在全新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  来验证基于已发布 npm 软件包的已安装软件包新手引导、Telegram 设置以及真实 Telegram E2E，使用共享的租赁 Telegram 凭证池。本地维护者的一次性运行可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` workflow 运行相同的发布后检查。它有意仅支持手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用先预检再提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - stable npm 发布默认指向 `beta`
  - stable npm 发布可以通过 workflow 输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以增强安全性，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库则保持仅使用 OIDC 的发布方式
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的制品，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，这样发布修正就不会悄悄让较旧的全局安装仍停留在基础 stable 载荷上
- npm 发布预检默认失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，这样我们就不会再次发布一个空的浏览器仪表板
- 发布后验证还会检查已发布注册表安装在根 `dist/*` 布局下是否包含非空的内置插件运行时依赖。若发布产物缺失或内置插件依赖载荷为空，发布后验证器就会失败，且不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器 e2e 能在发布路径之前捕获意外的软件包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的、由规划器拥有的 `checks-node-extensions` workflow 矩阵输出，以免发布说明描述了过时的 CI 布局
- stable macOS 发布就绪还包括更新器相关界面：
  - GitHub release 最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建底线的 `CFBundleVersion`

## 发布测试框

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。从可信的 `main` workflow ref 运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both
```

该 workflow 会解析目标 ref，使用
`target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置了
`npm_telegram_package_spec` 时可选择分发独立的发布后 Telegram E2E。随后，`OpenClaw Release Checks` 会进一步展开安装冒烟测试、跨操作系统发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab 一致性、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要中 `normal_ci` 和 `release_checks` 均显示成功，且任何可选的 `npm_telegram` 子任务要么成功要么被有意跳过时，完整运行才可接受。
子 workflow 会从运行 `Full Release Validation` 的可信 ref 分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation workflow-ref 输入；通过选择 workflow 运行 ref 来选择可信 harness。

根据发布阶段使用以下变体：

```bash
# 验证尚未发布的候选发布分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both

# 验证一个已推送的精确提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 发布 beta 后，增加针对已发布软件包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在针对某个聚焦修复的首次重跑时使用完整总流程。如果某个测试框失败，请使用失败的子 workflow、作业、Docker 通道、软件包配置、模型提供商或 QA 通道作为下一次证明。只有当修复更改了共享发布编排，或使早先的全框证据失效时，才再次运行完整总流程。总流程的最终验证器会重新检查已记录的子 workflow 运行 id，因此在某个子 workflow 成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

### Vitest

Vitest 测试框是手动 `CI` 子 workflow。手动 CI 会有意绕过 changed 范围限制，并对发布候选版本强制运行常规测试图：Linux Node 分片、bundled-plugin 分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用此测试框来回答“源码树是否通过了完整的常规测试套件？”这个问题。它不同于发布路径产品验证。需要保留的证据：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 在精确目标 SHA 上呈绿色的 `CI` 运行
- 在调查回归时，CI 作业中的失败或缓慢分片名称
- 当某次运行需要性能分析时，像 `.artifacts/vitest-shard-timings.json` 这样的 Vitest 计时产物

只有当发布需要确定性的常规 CI，而不需要 Docker、QA Lab、live、跨操作系统或软件包测试框时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 测试框位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的
`install-smoke` workflow 提供。它会通过已打包的 Docker 环境来验证发布候选版本，而不仅仅是源码级测试。

发布 Docker 覆盖包括：

- 启用了较慢 Bun 全局安装冒烟测试的完整安装冒烟测试
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b` 和
  `bundled-channels`
- 在请求时，于 `plugins-runtime-core` 分块中包含 OpenWebUI 覆盖
- 将 bundled-channel 依赖通道拆分到独立的 `bundled-channels` 分块中，
  而不是串行的一体式 bundled-channel 通道
- 拆分后的 bundled plugin 安装/卸载通道
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-7`
- 当发布检查包含 live 套件时，live/E2E provider 套件和 Docker live 模型覆盖

重跑前先使用 Docker 产物。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、
阶段计时、调度器计划 JSON 和重跑命令。若要进行聚焦恢复，请在可复用的 live/E2E workflow 上使用
`docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的
`package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 测试框也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级别的发布门禁，与 Vitest 和 Docker 软件包机制分开。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack，将 OpenAI 候选通道与 Opus 4.6 基线进行比较的 mock 一致性门禁
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭证租约的 live Telegram QA 通道
- 当发布遥测需要显式本地证明时运行 `pnpm qa:otel:smoke`

使用这个测试框来回答“该发布在 QA 场景和 live 渠道流程中的行为是否正确？”批准发布时，请保留 parity、Matrix 和 Telegram 通道的产物 URL。完整的 Matrix 覆盖仍可作为手动分片 QA-Lab 运行来获得，而不是默认的发布关键通道。

### Package

Package 测试框是可安装产品门禁。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支持。该解析器会将候选版本标准化为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将 workflow harness ref 与软件包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由其他 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、
`package_ref=<release-ref>`、`suite_profile=custom`、
`docker_lanes=bundled-channel-deps-compat plugins-offline` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker 分块覆盖了其中重叠的安装、更新和插件更新通道；Package Acceptance 则保留了原生制品的 bundled-channel 兼容性、离线插件夹具，以及针对同一个已解析 tarball 的 Telegram 软件包 QA。它是 GitHub 原生方案，用来替代此前大多数依赖 Parallels 的软件包/更新覆盖。跨操作系统发布检查对特定操作系统的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 的宽松处理被有意限制了时效。直到 `2026.4.25` 的软件包，仍可对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA inventory 条目、缺失的 `gateway install --wrapper`、tarball 派生 git 夹具中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。`2026.4.25` 之后的软件包必须满足现代软件包契约；同样的缺口会导致发布验证失败。

当发布问题涉及实际可安装的软件包时，请使用更广泛的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见软件包配置：

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置热重载通道
- `package`：不含 live ClawHub 的安装/更新/插件软件包契约；这是发布检查默认值
- `product`：在 `package` 基础上增加 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

若要获取软件包候选版本的 Telegram 证明，请在 Package Acceptance 上启用
`telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该 workflow 会将已解析的
`package-under-test` tarball 传入 Telegram 通道；独立的 Telegram workflow 仍然接受已发布的 npm 规格以进行发布后检查。

## NPM workflow 输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的 40 字符 workflow 分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径上必需，以便 workflow 复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。含 secrets 的检查要求解析后的提交可从某个 OpenClaw 分支或发布标签到达。

规则：

- Stable 和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；workflow 会在继续发布前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签尚不存在时，你可以使用当前完整 workflow 分支提交 SHA，对预检 workflow 进行仅验证的演练
2. 对于正常的 beta 优先流程，选择 `npm_dist_tag=beta`；只有在你有意直接发布 stable 时，才选择 `latest`
3. 当你希望从一个手动 workflow 获得常规 CI 加上 live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，对发布分支、发布标签或完整提交 SHA 运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，则改为在发布 ref 上运行手动 `CI` workflow
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 和保存的 `preflight_run_id`
7. 如果发布落在 `beta` 上，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow 将该 stable 版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个 stable 构建，则使用同一个私有 workflow 将两个 dist-tag 都指向该 stable 版本，或者让其计划的自愈同步稍后再移动 `beta`

dist-tag 变更位于私有仓库中以保证安全，因为它仍需要
`NPM_TOKEN`，而公开仓库保持仅使用 OIDC 的发布方式。

这使得直接发布路径和 beta 优先提升路径都得到了文档记录，并且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其限制在 tmux 内可以让提示、警报和 OTP 处理保持可观察，并防止重复的主机警报。

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

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际运行手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
