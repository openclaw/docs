---
read_when:
    - 查找公开发布通道定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T12:56:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 344606e845ab48966188b5031572dcbb827001b5c0e0f9be657f3a0e6d307835
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续前进头部版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份和日期不要补零
- `latest` 表示当前已提升的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或在之后提升经过验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，而 mac 应用构建/签名/公证仅保留给稳定版，除非明确要求

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 验证完成后，才会进入稳定版
- 维护者通常会从当前 `main` 创建的 `release/YYYY.M.D` 分支切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经被推送或发布后仍需修复，维护者会切下一个
  `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细发布流程、审批、凭证和恢复说明仅面向维护者

## 发布操作员检查清单

这份检查清单描述的是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅面向维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新代码，确认目标提交已推送，
   并确认当前 `main` 的 CI 足够绿色，可以从它切分支。
2. 使用 `/changelog` 根据真实提交历史重写 `CHANGELOG.md` 顶部部分，
   保持条目面向用户，提交它、推送它，然后在分支前再 rebase/pull 一次。
3. 审查以下文件中的发布兼容性记录：
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts`。仅在升级路径仍有保障时移除已过期兼容项，或记录为何有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为预期标签更新所有必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整 40 字符的发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 针对发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试环境（Vitest、Docker、QA Lab 和 Package）的唯一手动入口点。
8. 如果验证失败，在发布分支上修复，并重新运行最小范围的失败文件、lane、工作流作业、包配置、提供商或模型允许列表，以证明修复有效。仅当变更表面使之前的证据失效时，才重新运行完整总验证。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果一个已推送或已发布的 beta 需要修复，就切下一个 `-beta.N`；不要删除或重写旧 beta。
10. 对于稳定版，仅在经过验证的 beta 或发布候选版本具备所需验证证据后继续。稳定版 npm 发布会通过 `preflight_run_id` 复用成功的预检制品；稳定版 macOS 发布就绪还要求 `main` 上具备已打包的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；在需要时执行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明；并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 就能在更快的本地 `pnpm check` gate 之外继续得到覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查就能在更快的本地 gate 之外保持绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样 pack 验证步骤所需的 `dist/*` 发布制品和 Control UI bundle 才会存在
- 在发布审批之前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试环境。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，以执行安装 smoke、包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lane。只有在包已经发布，且还需要运行发布后 Telegram E2E 时，才提供 `npm_telegram_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为某个包候选版本获取侧通道证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或某个精确发布版本，使用 `source=npm`；用 `source=ref` 可用当前 `workflow_ref` harness 打包一个受信任的 `package_ref` 分支/标签/SHA；用 `source=url` 可提供带必需 SHA-256 的 HTTPS tarball；用 `source=artifact` 可使用由其他 GitHub Actions 运行上传的 tarball。该工作流会将候选版本解析为 `package-under-test`，对该 tarball 复用 Docker E2E 发布调度器，并可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 对同一 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见 profile：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载 lane
  - `package`：原生制品包/更新/插件 lane，不含 OpenWebUI 或 live ClawHub
  - `product`：在 package profile 基础上增加 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes` 以便聚焦重跑
- 当你只需要发布候选版本具备完整的常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过 changed scoping，并强制执行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n lane。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部采集器。
- 在每次带标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布审批前运行 QA Lab mock parity gate，以及快速 live Matrix profile 和 Telegram QA lane。live lane 使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你需要并行运行完整 Matrix 传输、媒体和 E2EE 清单时，请运行手动 `QA-Lab - All Lanes` 工作流，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨操作系统的安装和升级运行时验证属于公开的
  `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：保持真实 npm 发布路径简短、确定且聚焦制品，而较慢的 live 检查保留在各自 lane 中，以免拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 进行分发，或从 `main`/release 工作流 ref 进行分发，以保持工作流逻辑和密钥处于受控状态
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从某个 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，而不要求已推送标签
- 这条 SHA 路径仅用于验证，不能被提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个工作流都会将真实发布和提升路径保留在 GitHub-hosted runner 上，而非变更型验证路径则可以使用更大的 Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布预检不再等待单独的发布检查 lane
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/修正版版本），以在全新临时前缀中验证已发布 registry 安装路径
- 在 beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以针对已发布 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E，并使用共享的租赁 Telegram 凭证池。维护者在本地一次性运行时可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` 工作流运行相同的发布后检查。它被有意设计为仅手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用先预检再提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认指向 `beta`
  - 稳定版 npm 发布可通过工作流输入显式指定 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    出于安全原因，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公共仓库保留仅 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的制品，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的稳定版修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，这样发布修正就不会悄悄让旧的全局安装仍停留在基础稳定版载荷上
- npm 发布预检会以失败关闭方式终止，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，这样我们就不会再次发布空的浏览器仪表板
- 发布后验证还会检查已发布 registry 安装是否在根 `dist/*`
  布局下包含非空的内置插件运行时依赖。若某次发布携带缺失或为空的内置插件依赖载荷，则发布后验证器会失败，且不能被提升为 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果发布工作修改了 CI 规划、扩展计时清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的、由规划器拥有的 `checks-node-extensions` 工作流矩阵输出，这样发布说明就不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪性还包括更新器表面：
  - GitHub release 最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试环境

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。请从受信任的 `main` 工作流 ref 运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both
```

该工作流会解析目标 ref，使用 `target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置了 `npm_telegram_package_spec` 时可选分发独立的发布后 Telegram E2E。然后，`OpenClaw Release Checks` 会进一步扇出安装 smoke、跨操作系统发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 均成功，且任意可选 `npm_telegram` 子任务也成功或被有意跳过时，整轮运行才算可接受。  
子工作流会从运行 `Full Release Validation` 的受信任 ref 分发，通常是 `--ref main`，即便目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择受信任的 harness。

根据发布阶段使用以下变体：

```bash
# 验证尚未发布的发布候选分支。
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

# 在 beta 发布后，加入已发布包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

在聚焦修复之后，不要把完整总验证作为第一次重跑。如果某个测试环境失败，请使用失败的子工作流、作业、Docker lane、包 profile、模型提供商或 QA lane 作为下一次证明。只有当修复改动了共享发布编排，或使之前所有测试环境的证据失效时，才重新运行完整总验证。总验证的最终验证器会重新检查已记录的子工作流运行 id，因此在某个子工作流成功重跑后，只需重新运行失败的 `Verify full validation` 父作业。

### Vitest

Vitest 测试环境是手动 `CI` 子工作流。手动 CI 会有意绕过 changed scoping，并强制对发布候选版本执行正常测试图谱：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个测试环境来回答“源码树是否通过了完整的常规测试套件？”  
它并不等同于发布路径产品验证。需要保留的证据：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 针对精确目标 SHA 呈绿色的 `CI` 运行
- 在调查回归时，记录 CI 作业中的失败或较慢分片名称
- 当运行需要性能分析时，记录诸如 `.artifacts/vitest-shard-timings.json` 这样的 Vitest 计时制品

只有当发布需要确定性的常规 CI，而不需要 Docker、QA Lab、live、跨操作系统或 package 测试环境时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 测试环境位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流提供。它通过打包好的 Docker 环境来验证发布候选版本，而不仅仅是源码级测试。

发布 Docker 覆盖范围包括：

- 启用了慢速 Bun 全局安装 smoke 的完整安装 smoke
- 仓库 E2E lane
- 发布路径 Docker 分块：`core`、`package-update`、`plugins-runtime` 和 `bundled-channels`
- 在请求时，于 `plugins-runtime` 分块中覆盖 OpenWebUI
- 将内置渠道依赖 lane 拆分到它们自己的 `bundled-channels` 分块中，而不是串行的全合一内置渠道 lane
- 拆分后的内置插件安装/卸载 lane：
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-7`
- 当发布检查包含 live suite 时，运行 live/E2E provider 套件和 Docker live 模型覆盖

重跑前请先使用 Docker 制品。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的 `package_artifact_run_id` 和预制 Docker 镜像输入，因此失败的 lane 可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 测试环境也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布 gate，与 Vitest 和 Docker 包机制分离。

发布 QA Lab 覆盖范围包括：

- mock parity gate：使用智能体 parity 包，将 OpenAI 候选 lane 与 Opus 4.6 基线进行比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭证租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时，运行 `pnpm qa:otel:smoke`

使用这个测试环境来回答“该发布在 QA 场景和 live 渠道流程中是否行为正确？”  
在批准发布时，请保留 parity、Matrix 和 Telegram lane 的制品 URL。完整 Matrix 覆盖仍可通过手动分片 QA-Lab 运行获得，而不是默认的发布关键 lane。

### Package

Package 测试环境是可安装产品 gate。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支持。该解析器会将候选版本规范化为 Docker E2E 消费的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流 harness ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或某个精确 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包一个受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载一个带必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一条 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、`package_ref=<release-ref>`、`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker 分块覆盖了重叠的安装、更新和插件更新 lane；Package Acceptance 则保留了原生制品的内置渠道兼容性、离线插件 fixture，以及针对同一解析 tarball 的 Telegram 包 QA。它是 GitHub 原生方式下，大多数过去需要 Parallels 的 package/update 覆盖的替代方案。跨操作系统发布检查对于操作系统特定的新手引导、安装器和平台行为仍然重要，但 package/update 产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽松策略被有意限定在时间范围内。到 `2026.4.25` 为止的包可以使用兼容路径来处理已发布到 npm 的元数据缺口：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。`2026.4.25` 之后的包必须满足现代包契约；这些缺口都会导致发布验证失败。

当发布问题涉及真实可安装包时，请使用更广泛的 Package Acceptance profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见 package profile：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载 lane
- `package`：安装/更新/插件包契约，不含 live ClawHub；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：精确的 `docker_lanes` 列表，用于聚焦重跑

如需 package 候选版本的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流会将解析后的 `package-under-test` tarball 传入 Telegram lane；独立的 Telegram 工作流仍接受已发布的 npm spec，用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整 40 字符工作流分支提交 SHA，用于仅验证预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径中必填，以便工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带密钥的检查要求解析后的提交必须可从某个 OpenClaw 分支或发布标签到达。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许使用完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定版 npm 发布顺序

在切稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在之前，你可以使用当前完整工作流分支提交
     SHA，对预检工作流进行仅验证的 dry run
2. 在常规的 beta-first 流程中选择 `npm_dist_tag=beta`；仅当你明确想直接发布稳定版时才选择 `latest`
3. 当你希望通过一个手动工作流同时获得常规 CI、live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，请针对发布分支、发布标签或完整提交 SHA 运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图谱，则改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，同时传入相同的 `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果该发布落在 `beta` 上，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta`
   也应立即跟随同一个稳定构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或者让其计划中的自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这样可以让直接发布路径和 beta-first 提升路径都被文档化，并对操作员可见。

如果维护者必须回退到本地 npm 认证，请仅在专用 tmux 会话内运行任何 1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其限制在 tmux 中可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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

- [发布通道](/zh-CN/install/development-channels)
