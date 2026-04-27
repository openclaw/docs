---
read_when:
    - 正在查找公开发布渠道定义
    - 正在运行发布验证或软件包验收
    - 正在查找版本命名和发布节奏
summary: 发布流程通道、运维人员检查清单、验证框、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T21:04:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3ff3c7887c59005a977522e3a0e80ea3458e29d12f6976397b0749d8001d914
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布流程通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升为正式版本的 stable npm 发布
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正发布默认发布到 npm `beta`；发布运维人员可以显式指定 `latest`，或在之后提升一个经过验证的 beta 构建
- 每个 stable OpenClaw 发布都会同时发布 npm 软件包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/软件包路径，而 macOS 应用的构建/签名/公证通常保留给 stable，除非有明确要求

## 发布节奏

- 发布采用 beta 优先
- 只有在最新 beta 完成验证后，才会继续 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布但需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布运维人员检查清单

这份检查清单展示了发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复以及紧急回滚细节保留在仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已经推送，
   并确认当前 `main` 的 CI 足够绿色，可以基于它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写 `CHANGELOG.md` 顶部章节，
   保持条目面向用户，提交并推送它，然后在创建分支前再执行一次 rebase/pull。
3. 检查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍被覆盖时才移除已过期的兼容项，否则记录为什么要有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为目标标签更新所有必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签尚不存在时，可以使用完整的 40 位发布分支 SHA 仅进行验证预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，启动 `Full Release Validation` 的所有预发布测试。这是四个大型发布验证框的唯一手动入口：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复有效的最小失败文件、通道、工作流任务、软件包配置、提供商或模型允许列表。只有当变更范围使之前的证据失效时，才重新运行完整的总体验证。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 软件包运行发布后软件包验收。如果已推送或已发布的 beta 需要修复，切下一个 `-beta.N`；不要删除或重写旧的 beta。
10. 对于 stable，只有在经过审查的 beta 或候选发布具备所需验证证据后才能继续。Stable 的 npm 发布会通过 `preflight_run_id` 复用成功的预检产物；stable macOS 发布就绪还要求 `main` 上存在已打包的 `.zip`、`.dmg`、`.dSYM.zip` 以及更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在你需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；然后在需要时进行 dist-tag 提升、基于完整匹配的 `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明，以及执行发布公告步骤。

## 发布预检

- 在发布预检之前运行 `pnpm check:test-types`，以便在更快的本地 `pnpm check` 门禁之外，测试 TypeScript 仍然得到覆盖
- 在发布预检之前运行 `pnpm check:architecture`，以便在更快的本地门禁之外，更广泛的导入循环和架构边界检查保持绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以便打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 在发布审批前运行手动 `Full Release Validation` 工作流，以便通过一个入口点启动所有预发布验证框。它接受分支、标签或完整提交 SHA，会派发手动 `CI`，并派发 `OpenClaw Release Checks`，用于安装冒烟测试、软件包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。只有在软件包已经发布且还需要运行发布后的 Telegram E2E 时，才提供 `npm_telegram_package_spec`。当私有证据报告需要证明验证与某个已发布的 npm 软件包匹配、但又不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为某个候选软件包获得旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 时，会用当前 `workflow_ref` harness 打包一个可信的 `package_ref` 分支/标签/SHA；对带必填 SHA-256 的 HTTPS tarball 使用 `source=url`；对由其他 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置热重载通道
  - `package`：原生产物软件包/更新/插件通道，不包含 OpenWebUI 或 live ClawHub
  - `product`：在 package 配置基础上增加 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes`，用于聚焦重跑
- 当你只需要对发布候选进行完整的常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动触发的 CI 会绕过 changed 范围限制，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部采集器。
- 在每次带标签的发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布审批前运行 QA Lab mock parity 门禁，以及快速 live Matrix 配置和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你希望并行运行完整的 Matrix 传输、媒体和 E2EE 清单时，请运行手动 `QA-Lab - All Lanes` 工作流，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨操作系统的安装和升级运行时验证属于公开的 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、确定性强并聚焦产物，而较慢的 live 检查留在它们自己的通道中，这样就不会拖慢或阻塞发布
- 含有密钥的发布检查应通过 `Full Release Validation` 派发，或者从 `main`/发布工作流引用派发，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从某个 OpenClaw 分支或发布标签到达即可
- `OpenClaw NPM Release` 的仅验证预检也接受当前工作流分支的完整 40 位提交 SHA，而不要求已有推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为软件包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都会将真正的发布和提升路径保留在 GitHub 托管 runner 上，而非变更性的验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版本），以在新的临时前缀中验证已发布的 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以验证针对已发布 npm 软件包的已安装软件包新手引导、Telegram 设置和真实 Telegram E2E，并使用共享租赁的 Telegram 凭证池。本地维护者的一次性运行可省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` 工作流运行相同的发布后检查。它被有意设为仅手动运行，不会在每次合并时执行。
- 维护者发布自动化现在使用“先预检再提升”：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支派发
  - stable npm 发布默认指向 `beta`
  - stable npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 修改现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，出于安全考虑，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，这样发布修正就不会悄悄让旧的全局安装仍停留在基础 stable 负载上
- npm 发布预检会以失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 内容，这样我们就不会再次发布一个空的浏览器仪表盘
- 发布后验证还会检查已发布的 registry 安装是否在根级 `dist/*` 布局下包含非空的内置插件运行时依赖。若某个发布缺少这些依赖负载，或其内容为空，将无法通过发布后验证器，也不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack 的 `unpackedSize` 预算，因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的 planner 管理 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述的是过时的 CI 布局
- stable macOS 发布就绪还包括更新器相关表面：
  - GitHub release 最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle build 基线的 `CFBundleVersion`

## 发布验证框

`Full Release Validation` 是运维人员通过单一入口点启动所有预发布测试的方式。从可信的 `main` 工作流引用运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，使用 `target_ref=<release-ref>` 派发手动 `CI`，派发 `OpenClaw Release Checks`，并且在设置了 `npm_telegram_package_spec` 时可选派发独立的发布后 Telegram E2E。随后，`OpenClaw Release Checks` 会展开安装冒烟测试、跨操作系统发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，并且任何可选的 `npm_telegram` 子任务要么成功、要么被有意跳过时，完整运行才算可接受。
子工作流会从运行 `Full Release Validation` 的可信 ref 派发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择可信 harness。

根据发布阶段使用以下变体：

```bash
# 验证尚未发布的候选发布分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both

# 验证某个已推送的精确提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# beta 发布后，增加针对已发布软件包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在聚焦修复之后，把完整总体验证作为第一次重跑。如果某个验证框失败，请使用失败的子工作流、任务、Docker 通道、软件包配置、模型提供商或 QA 通道来获取下一轮证明。只有当修复改变了共享发布编排，或者让先前的全框证据失效时，才再次运行完整总体验证。总体验证的最终校验器会重新检查已记录的子工作流运行 id，因此在某个子工作流成功重跑后，只需重新运行失败的 `Verify full validation` 父任务。

### Vitest

Vitest 验证框是手动 `CI` 子工作流。手动 CI 会有意绕过 changed 范围限制，并对发布候选强制执行常规测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个验证框来回答“源代码树是否通过了完整的常规测试套件？”它不同于发布路径的产品验证。需要保留的证据：

- 显示已派发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 在精确目标 SHA 上为绿色的 `CI` 运行
- 在调查回归问题时，CI 任务中的失败或缓慢分片名称
- 当某次运行需要性能分析时，保留诸如 `.artifacts/vitest-shard-timings.json` 这样的 Vitest 时序产物

只有当发布需要确定性的常规 CI，但不需要 Docker、QA Lab、live、跨操作系统或 Package 验证框时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 验证框位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流提供。它通过打包后的 Docker 环境来验证发布候选，而不仅仅是源码级测试。

发布 Docker 覆盖包括：

- 启用了慢速 Bun 全局安装冒烟测试的完整安装冒烟测试
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b` 和
  `bundled-channels`
- 在需要时，于 `plugins-runtime-core` 分块内覆盖 OpenWebUI
- 将内置渠道依赖通道拆分到各自的 `bundled-channels` 分块中，
  而不是使用串行的一体化内置渠道通道
- 将内置插件安装/卸载通道拆分为
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-7`
- 当发布检查包含 live 测试套件时，提供商 live/E2E 测试套件和 Docker live 模型覆盖

重跑前先使用 Docker 产物。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON 以及重跑命令。对于聚焦恢复，请在可复用的 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的通道可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 验证框也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级别的发布门禁，与 Vitest 以及 Docker 软件包机制分离。

发布 QA Lab 覆盖包括：

- 使用 agentic parity 包，将 OpenAI 候选通道与 Opus 4.6 基线进行比较的 mock parity 门禁
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭证租约的 live Telegram QA 通道
- 当发布遥测需要明确的本地证明时，运行 `pnpm qa:otel:smoke`

使用这个验证框来回答“该发布在 QA 场景和 live 渠道流程中是否表现正确？”在批准发布时，保留 parity、Matrix 和 Telegram 通道的产物 URL。完整 Matrix 覆盖仍可通过手动分片的 QA-Lab 运行获得，而不是作为默认的发布关键通道。

### Package

Package 验证框是可安装产品的门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 提供支持。该解析器会将候选统一规范为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将工作流 harness ref 与软件包来源 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带必填 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由另一条 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、
`package_ref=<release-ref>`、`suite_profile=custom`、
`docker_lanes=bundled-channel-deps-compat plugins-offline` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker 分块会覆盖重叠的安装、更新和插件更新通道；Package Acceptance 则会针对同一个已解析 tarball，保留原生产物的内置渠道兼容性、离线插件夹具以及 Telegram 软件包 QA。它是 GitHub 原生方案，用于替代此前大多数需要 Parallels 的软件包/更新覆盖。跨操作系统发布检查对于特定操作系统的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽容路径被刻意限制为有时限。直到 `2026.4.25` 的软件包可以使用兼容路径来处理已发布到 npm 的元数据缺口：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、源自 tarball 的 git 夹具中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。`2026.4.25` 之后的软件包必须满足现代软件包契约；这些同样的缺口会导致发布验证失败。

当发布问题涉及真实可安装软件包时，请使用更广范围的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见的软件包配置：

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置热重载通道
- `package`：不包含 live ClawHub 的安装/更新/插件软件包契约；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

若要获取软件包候选的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将已解析的 `package-under-test` tarball 传入 Telegram 通道；独立的 Telegram 工作流仍然接受已发布的 npm 规格用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由运维人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前工作流分支的完整 40 位提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅进行验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径中必填，以便工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受以下由运维人员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。含密钥的检查要求解析出的提交必须可从某个 OpenClaw 分支或发布标签到达。

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检时相同的 `npm_dist_tag`；工作流会在继续发布前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签尚不存在前，你可以使用当前工作流分支的完整提交 SHA，对预检工作流进行仅验证的 dry run
2. 在正常的 beta 优先流程中选择 `npm_dist_tag=beta`，只有在你明确想要直接发布 stable 时才选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加 live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，则改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的 `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果发布落在 `beta` 上，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 stable 版本从 `beta` 提升到 `latest`
8. 如果该发布是有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个 stable 构建，请使用同一个私有工作流将两个 dist-tag 都指向该 stable 版本，或者让其定时自愈同步稍后再更新 `beta`

dist-tag 修改位于私有仓库中以确保安全，因为它仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样既记录了直接发布路径，也记录了 beta 优先提升路径，并且两者都对运维人员可见。

如果维护者必须退回到本地 npm 身份验证，只能在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其限制在 tmux 中可以让提示、警报和 OTP 处理保持可观察，并防止重复的主机警报。

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
