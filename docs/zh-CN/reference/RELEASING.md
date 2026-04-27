---
read_when:
    - 查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证框、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T22:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d007af3cf645d1dd84013e686b7a0513fa97f58a5ad1c5758b70a7c93e2458f4
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的滚动最新版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升为正式版的 stable npm 发布
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正发布默认发布到 npm `beta`；发布操作员也可以显式指定 `latest`，或在之后提升一个已验证的 beta 构建
- 每个 stable OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm / package 路径，而 macOS 应用的构建 / 签名 / 公证通常保留给 stable，除非另有明确要求

## 发布节奏

- 发布采用 beta 优先
- 只有在最新 beta 完成验证后，才会跟进 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来进行发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布且需要修复，维护者会创建下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布操作员检查清单

这份检查清单展示了发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复以及紧急回滚细节保留在
仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已经推送，
   并确认当前 `main` 的 CI 足够绿色，可以从其创建分支。
2. 使用 `/changelog` 根据真实提交历史重写 `CHANGELOG.md` 的顶部章节，
   保持条目面向用户，提交它，推送它，然后在创建分支前再执行一次 rebase / pull。
3. 检查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍然被覆盖时移除已过期的兼容性，
   否则记录为何要有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为预期标签更新所有必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签尚不存在时，
   可以使用完整的 40 位发布分支 SHA 进行仅验证用途的预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，使用 `Full Release Validation` 启动所有预发布测试。这是四个大型发布验证框的唯一手动入口：
   Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复成立的最小失败文件、lane、工作流作业、package 配置、provider 或模型 allowlist。只有在变更范围使先前证据失效时，才重新运行完整总流程。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 包运行发布后的软件包验收。如果已推送或已发布的 beta 需要修复，就创建下一个 `-beta.N`；不要删除或重写旧的 beta。
10. 对于 stable，仅在已验证的 beta 或候选发布具备所需验证证据后继续。Stable 的 npm 发布会复用成功的
    `preflight_run_id` 预检产物；stable 的 macOS 发布就绪还要求 `main` 上具备已打包的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器、在需要发布后渠道证明时可选运行独立的已发布 npm Telegram E2E、在需要时执行 dist-tag 提升、根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub release / prerelease 说明，以及执行发布公告步骤。

## 发布预检

- 在发布预检之前运行 `pnpm check:test-types`，这样测试 TypeScript 就能在更快的本地 `pnpm check` gate 之外继续得到覆盖
- 在发布预检之前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查就能在更快的本地 gate 之外保持绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 就会存在
- 在发布审批前运行手动 `Full Release Validation` 工作流，以便通过一个入口点启动所有预发布测试框。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，用于安装冒烟测试、软件包验收、Docker 发布路径测试套件、live / E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lanes。只有在软件包已经发布且还需要运行发布后的 Telegram E2E 时，才提供 `npm_telegram_package_spec`。当私有证据报告需要证明该验证与已发布的 npm 包一致，但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为某个软件包候选提供旁路证明，就运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本，使用 `source=npm`；使用 `source=ref` 时，会用当前 `workflow_ref` harness 打包一个受信任的 `package_ref` 分支 / 标签 / SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且可以通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置：
  - `smoke`：安装 / 渠道 / 智能体、Gateway 网关网络和配置重载 lanes
  - `package`：原生基于产物的软件包 / 更新 / 插件 lanes，不包含 OpenWebUI 或 live ClawHub
  - `product`：在 package 配置基础上增加 MCP 渠道、cron / subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes`，用于聚焦重跑
- 当你只需要为发布候选获取完整的常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动触发的 CI 会绕过 changed 范围限制，并强制运行 Linux Node 分片、bundled-plugin 分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n lanes。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP / HTTP 接收器驱动 QA-lab，并验证导出的 trace span 名称、有界属性以及内容 / 标识符脱敏，而无需 Opik、Langfuse 或其他外部收集器。
- 在每次带标签发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock parity gate，以及快速 live Matrix 配置和 Telegram QA lane。live lanes 使用 `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。当你需要并行运行完整 Matrix 传输、媒体和 E2EE 清单时，运行手动 `QA-Lab - All Lanes` 工作流，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨操作系统的安装和升级运行时验证属于公开的 `OpenClaw Release Checks` 和 `Full Release Validation`，它们会直接调用可复用工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意设计的：让真实的 npm 发布路径保持简短、确定且聚焦产物，而较慢的 live 检查保留在自己的 lane 中，这样它们就不会拖慢或阻塞发布
- 带有机密的发布检查应通过 `Full Release Validation` 分发，或从 `main` / release 工作流 ref 分发，以便工作流逻辑和机密保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从某个 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前工作流分支的完整 40 位提交 SHA，而不要求已经推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，该工作流只会为软件包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都会将真实发布和提升路径保留在 GitHub-hosted runners 上，而非变更性的验证路径可以使用更大的 Blacksmith Linux runners
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  ，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流机密
- npm 发布预检不再等待单独的发布检查 lane
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta / 修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta / 修正版本），以在一个全新的临时前缀中验证已发布的 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  ，以针对已发布的 npm 包验证已安装软件包的新手引导、Telegram 设置以及真实 Telegram E2E，并使用共享租赁的 Telegram 凭证池。本地维护者的一次性运行可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` 工作流运行相同的发布后检查。它是有意仅限手动运行的，不会在每次合并时运行。
- 维护者发布自动化现在使用 “先预检再提升”：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - stable npm 发布默认指向 `beta`
  - stable npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ，出于安全原因，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正发布，发布后验证器还会检查相同临时前缀中从 `YYYY.M.D` 到 `YYYY.M.D-N` 的升级路径，这样发布修正就不会悄悄让旧的全局安装仍停留在基础 stable 载荷上
- npm 发布预检会在 tarball 不同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷时默认失败，这样我们就不会再次发布一个空的浏览器仪表盘
- 发布后验证还会检查已发布的 registry 安装是否在根级 `dist/*` 布局下包含非空的内置插件运行时依赖。若某个发布携带缺失或为空的内置插件依赖载荷，则该发布会在发布后验证器中失败，且不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 能在发布路径之前捕获意外的软件包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并检查来自 `.github/workflows/ci.yml` 的、由规划器负责的 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述的是过时的 CI 布局
- stable macOS 发布就绪还包括更新器相关表面：
  - GitHub release 最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle build floor 的 `CFBundleVersion`

## 发布测试框

`Full Release Validation` 是操作员用来通过单一入口点启动所有预发布测试的方式。请从受信任的 `main` 工作流 ref 运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，使用
`target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置了 `npm_telegram_package_spec` 时可选分发独立的发布后 Telegram E2E。随后，`OpenClaw Release Checks` 会展开安装冒烟测试、跨操作系统发布检查、live / E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要中 `normal_ci` 和 `release_checks` 显示成功，并且任何可选的 `npm_telegram` 子项要么成功要么被有意跳过时，完整运行才可接受。
子工作流会从运行 `Full Release Validation` 的受信任 ref 分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。不存在单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择受信任的 harness。

根据发布阶段使用以下变体：

```bash
# 验证尚未发布的发布候选分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both

# 验证一个精确的已推送提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 在 beta 发布后，增加针对已发布软件包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

在进行一次聚焦修复后的第一次重跑时，不要使用完整总流程。如果某个框失败，下一次证明应使用失败的子工作流、作业、Docker lane、软件包配置、模型提供商或 QA lane。只有当修复改变了共享发布编排，或让先前的全框证据失效时，才再次运行完整总流程。该总流程的最终验证器会重新检查记录的子工作流运行 id，因此在某个子工作流成功重跑后，只需重新运行失败的 `Verify full validation` 父作业。

对于有界恢复，向总工作流传入 `rerun_group`。`all` 是真实的发布候选运行，`ci` 只运行常规 CI 子项，`release-checks` 运行所有发布验证框，而更窄的发布分组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供独立软件包 Telegram lane 时使用的 `npm-telegram`。

### Vitest

Vitest 验证框是手动 `CI` 子工作流。手动 CI 会有意绕过 changed 范围限制，并为发布候选强制运行常规测试图：Linux Node 分片、bundled-plugin 分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个验证框来回答“源代码树是否通过了完整的常规测试套件？”  
它不同于发布路径的产品验证。需要保留的证据包括：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 在精确目标 SHA 上为绿色的 `CI` 运行
- 在调查回归时，来自 CI 作业的失败或缓慢分片名称
- 当某次运行需要性能分析时，像 `.artifacts/vitest-shard-timings.json` 这样的 Vitest 时序产物

仅当发布需要确定性的常规 CI，而不需要 Docker、QA Lab、live、跨操作系统或软件包验证框时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 验证框位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml`，以及发布模式的
`install-smoke` 工作流。它通过已打包的 Docker 环境来验证发布候选，而不只是源码级测试。

发布 Docker 覆盖包括：

- 启用了较慢 Bun 全局安装冒烟测试的完整安装冒烟测试
- 仓库 E2E lanes
- 发布路径 Docker 分块：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `bundled-channels-core`、`bundled-channels-update-a`、
  `bundled-channels-update-b` 和 `bundled-channels-contracts`
- 在请求时，`plugins-runtime-core` 分块中的 OpenWebUI 覆盖
- 将 bundled-channel 依赖 lanes 拆分为 channel-smoke、update-target，
  以及 setup / runtime contract 分块，而不是一个大型 bundled-channel 作业
- 拆分后的 bundled plugin 安装 / 卸载 lanes：
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-7`
- 当发布检查包含 live 套件时，live / E2E provider 套件和 Docker live 模型覆盖

重跑前先使用 Docker 产物。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、
阶段时序、调度器计划 JSON 和重跑命令。对于聚焦恢复，在可复用的 live / E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的 lane 可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 验证框也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级别的发布 gate，与 Vitest 和 Docker 的软件包机制分开。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack，将 OpenAI 候选 lane 与 Opus 4.6 基线进行比较的 mock parity gate
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭证租约的 live Telegram QA lane
- 当发布遥测需要显式本地证明时，运行 `pnpm qa:otel:smoke`

使用这个验证框来回答“该发布在 QA 场景和 live 渠道流程中是否行为正确？”  
在批准发布时，保留 parity、Matrix 和 Telegram lanes 的产物 URL。完整的 Matrix 覆盖仍然可通过手动分片的 QA-Lab 运行获得，而不是默认的关键发布 lane。

### Package

Package 验证框是可安装产品的 gate。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支持。该解析器会将候选规范化为供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将工作流 harness ref 与软件包来源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、
`package_ref=<release-ref>`、`suite_profile=custom`、
`docker_lanes=bundled-channel-deps-compat plugins-offline` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker 分块覆盖了重叠的安装、更新和插件更新 lanes；Package Acceptance 则保留原生产物的 bundled-channel 兼容性、离线插件 fixtures，以及针对同一个已解析 tarball 的 Telegram 软件包 QA。它是此前多数需要 Parallels 才能完成的软件包 / 更新覆盖的 GitHub 原生替代方案。跨操作系统发布检查对特定操作系统的新手引导、安装器和平台行为仍然重要，但软件包 / 更新的产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽松策略被有意限制在一个时间范围内。直到 `2026.4.25` 的软件包都可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的
`gateway install --wrapper`、从 tarball 派生的 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。`2026.4.25` 之后的软件包必须满足现代软件包契约；这些相同的缺口会导致发布验证失败。

当发布问题与实际可安装软件包有关时，使用更广的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见软件包配置：

- `smoke`：快速的软件包安装 / 渠道 / 智能体、Gateway 网关网络和配置重载 lanes
- `package`：不含 live ClawHub 的安装 / 更新 / 插件软件包契约；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron / subagent 清理、OpenAI web search 和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：精确的 `docker_lanes` 列表，用于聚焦重跑

对于软件包候选的 Telegram 证明，在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将已解析的 `package-under-test` tarball 传入 Telegram lane；独立的 Telegram 工作流仍然接受已发布的 npm 规格，用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前工作流分支的完整 40 位提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅进行验证 / 构建 / 打包，`false` 表示真实发布路径
- `preflight_run_id`：在真实发布路径中必需，以便工作流复用成功预检运行中已准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带机密的检查要求解析后的提交必须可从某个 OpenClaw 分支或发布标签到达。

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前工作流分支的完整提交
     SHA，对预检工作流进行仅验证的 dry run
2. 对常规的 beta 优先流程选择 `npm_dist_tag=beta`，只有在你有意直接发布 stable 时才选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加上 live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，对发布分支、发布标签或完整提交 SHA 运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，则改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，同时使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id`
7. 如果该发布先落在 `beta`，则使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 stable 版本从 `beta` 提升到 `latest`
8. 如果该发布是有意直接发布到 `latest`，并且 `beta`
   应立即跟随同一个 stable 构建，则使用相同的私有工作流让两个 dist-tag 都指向该 stable 版本，或者让其定时自愈同步稍后再移动 `beta`

dist-tag 变更位于私有仓库中，出于安全原因，因为它仍然需要
`NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这使直接发布路径和 beta 优先提升路径都具备文档记录，并且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要直接从主 agent shell 调用 `op`；将其限制在 tmux 内可以让提示、告警和 OTP 处理可观察，并防止重复的主机告警。

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

维护者会使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档作为实际运行手册。

## 相关

- [发布渠道](/zh-CN/install/development-channels)
