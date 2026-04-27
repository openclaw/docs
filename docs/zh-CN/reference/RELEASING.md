---
read_when:
    - 查找公开发布通道的定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证项目、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T06:15:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f0fe282a3d266cf1f26a70dbfa0f6315c5dae5162fb1e5e539d995150e60846
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的当前最新提交

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要对月份或日期进行零填充
- `latest` 表示当前已提升为正式版的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 Stable 修正版发布默认发布到 npm `beta`；发布操作员也可以显式指定发布到 `latest`，或在之后将经过验证的 beta 构建提升过去
- 每个 stable OpenClaw 发布都会同时交付 npm 软件包和 macOS 应用；
  beta 发布通常会先验证并发布 npm / package 路径，mac 应用的构建 / 签名 / 公证通常保留给 stable，除非有明确要求

## 发布节奏

- 发布采用 beta 优先的方式推进
- 只有在最新 beta 完成验证后，才会继续 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来进行发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布后需要修复，维护者会创建下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布操作员检查清单

此检查清单展示的是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复以及紧急回滚细节保留在仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新代码，确认目标提交已推送，
   并确认当前 `main` 的 CI 结果足够绿色，可以从其分支出去。
2. 根据真实提交历史使用 `/changelog` 重写 `CHANGELOG.md` 顶部章节，保持条目面向用户，提交并推送，然后在分支前再执行一次 rebase / pull。
3. 审查 `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍然被覆盖时移除已过期的兼容性，或者记录为何有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为预定标签更新所有必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签尚不存在时，可以使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，启动 `Full Release Validation` 以运行所有发布前测试。这是四个大型发布测试项——Vitest、Docker、QA Lab 和 Package——唯一的手动入口点。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复有效的最小失败文件、lane、工作流任务、软件包配置、provider 或模型 allowlist。只有在变更范围使先前证据失效时，才重新运行完整总体验证。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 软件包运行发布后软件包验收。如果已推送或已发布的 beta 需要修复，创建下一个 `-beta.N`；不要删除或重写旧 beta。
10. 对于 stable，只有在经过审查的 beta 或候选发布具备所需验证证据后才继续。Stable npm 发布会通过 `preflight_run_id` 复用成功的预检产物；stable macOS 发布准备状态还要求 `main` 上提供已打包的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在你需要发布后渠道证明时，可选择运行独立的、基于已发布 npm 的 Telegram E2E；按需进行 dist-tag 提升；根据完整且匹配的 `CHANGELOG.md` 章节生成 GitHub release / prerelease 说明；并执行发布公告步骤。

## 发布预检

- 在发布预检之前运行 `pnpm check:test-types`，这样测试 TypeScript 就能在更快的本地 `pnpm check` 检查之外继续得到覆盖
- 在发布预检之前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查就能在更快的本地检查之外保持绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 才会存在
- 在发布审批之前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有发布前测试项。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks` 以执行安装冒烟测试、软件包验收、Docker 发布路径测试套件、live / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。只有在软件包已经发布且也需要运行发布后 Telegram E2E 时，才提供 `npm_telegram_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为某个软件包候选版本获取侧通道证明，可运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包可信的 `package_ref` 分支 / 标签 / SHA；使用 `source=url` 处理带必需 SHA-256 的 HTTPS tarball；或使用 `source=artifact` 处理由其他 GitHub Actions 运行上传的 tarball。该工作流会将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置：
  - `smoke`：安装 / 渠道 / 智能体、Gateway 网关网络和配置重载通道
  - `package`：原生产物软件包 / 更新 / 插件通道，不包含 OpenWebUI 或 live ClawHub
  - `product`：在 package 配置基础上增加 MCP 渠道、cron / subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes` 以进行聚焦重跑
- 当你只需要对发布候选版本进行完整的常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过 changed 范围限制，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP / HTTP 接收器驱动 QA-lab，并验证导出的 trace span 名称、有界属性以及内容 / 标识符脱敏，而无需 Opik、Langfuse 或其他外部收集器。
- 在每次带标签发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布审批前运行 QA Lab mock 一致性检查、快速 live Matrix 配置和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你希望并行获得完整 Matrix 传输、媒体和 E2EE 清单时，运行手动 `QA-Lab - All Lanes` 工作流，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨操作系统的安装和升级运行时验证属于公开的 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、确定且聚焦于产物，而较慢的 live 检查保留在各自独立的通道中，这样它们就不会拖慢或阻塞发布
- 带有机密的发布检查应通过 `Full Release Validation` 分发，或从 `main` / release 工作流 ref 分发，以确保工作流逻辑和机密始终处于受控状态
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从 OpenClaw 分支或发布标签访问到
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，而无需已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为软件包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个工作流都会将真实发布和提升路径保留在 GitHub-hosted runners 上，而不发生变更的验证路径则可以使用更大的 Blacksmith Linux runners
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流机密
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta / 修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta / 修正版版本）以在全新的临时前缀中验证已发布的 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以针对已发布的 npm 软件包验证已安装软件包的新手引导、Telegram 设置和真实 Telegram E2E，并使用共享租赁的 Telegram 凭证池。本地维护者的临时一次性运行可以省略 Convex 变量，改为直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过手动 `NPM Telegram Beta E2E` 工作流在 GitHub Actions 中运行相同的发布后检查。它刻意只支持手动触发，不会在每次合并时运行。
- 维护者发布自动化现在采用先预检再提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - stable npm 发布默认指向 `beta`
  - stable npm 发布可以通过工作流输入显式指定为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以增强安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，这样发布修正就不会悄悄让旧的全局安装仍停留在基础 stable 载荷上
- npm 发布预检采用失败即关闭策略，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，这样我们就不会再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布的 registry 安装是否在根级 `dist/*` 布局下包含非空的内置插件运行时依赖。若发布版本携带缺失或为空的内置插件依赖载荷，则发布后验证器会失败，且该版本不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，这样安装器 e2e 就能在发布路径之前捕获意外的软件包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的由规划器管理的 `checks-node-extensions` 工作流矩阵输出，以确保发布说明不会描述过时的 CI 布局
- Stable macOS 发布准备状态还包括更新器相关表面：
  - GitHub release 最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 已打包应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试项

`Full Release Validation` 是操作员从一个入口点启动所有发布前测试的方式。从可信的 `main` 工作流 ref 运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

该工作流会解析目标 ref，使用 `target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置了 `npm_telegram_package_spec` 时可选地分发独立的发布后 Telegram E2E。随后，`OpenClaw Release Checks` 会扩展运行安装冒烟测试、跨操作系统发布检查、live / E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab 一致性、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，且任何可选的 `npm_telegram` 子项要么成功要么被有意跳过时，完整运行才可接受。

根据发布阶段使用以下变体：

```bash
# 验证尚未发布的发布候选分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 验证一个精确的已推送提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 在 beta 发布后，增加基于已发布软件包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

在一次聚焦修复后，不要把完整总体验证作为第一次重跑。如果某个测试项失败，请使用失败的子工作流、任务、Docker 通道、软件包配置、模型提供商或 QA 通道作为下一轮证明。只有在修复更改了共享发布编排，或使早先的全项证据失效时，才再次运行完整总体验证。

### Vitest

Vitest 测试项是手动 `CI` 子工作流。手动 CI 会有意绕过 changed 范围限制，并对发布候选版本强制运行常规测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个测试项来回答“源代码树是否通过了完整的常规测试套件？”  
它并不等同于发布路径的产品验证。应保留的证据包括：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上为绿色的 `CI` 运行
- 在调查回归问题时，来自 CI 任务的失败或缓慢分片名称
- 在运行需要性能分析时，诸如 `.artifacts/vitest-shard-timings.json` 之类的 Vitest 计时产物

只有当发布需要确定性的常规 CI、但不需要 Docker、QA Lab、live、跨操作系统或软件包测试项时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 测试项位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的
`install-smoke` 工作流来运行。它通过已打包的 Docker 环境验证发布候选版本，
而不仅仅是源码级测试。

发布 Docker 覆盖包括：

- 启用了慢速 Bun 全局安装冒烟测试的完整安装冒烟测试
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update` 和
  `plugins-integrations`
- 在请求时，于 `plugins-integrations` 分块内提供 OpenWebUI 覆盖
- 当发布检查包含 live 套件时，提供 live / E2E provider 套件和 Docker live 模型覆盖

在重跑之前先使用 Docker 产物。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、
阶段耗时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用的
live / E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。
生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和准备好的 Docker 镜像输入，
这样失败的通道就可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 测试项也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级别的发布门禁，
与 Vitest 和 Docker 软件包机制分开。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack，将 OpenAI 候选通道与 Opus 4.6 基线进行比较的 mock 一致性门禁
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭证租约的 live Telegram QA 通道
- 当发布遥测需要明确的本地证明时，运行 `pnpm qa:otel:smoke`

使用这个测试项来回答“该发布在 QA 场景和 live 渠道流程中是否行为正确？”
在批准发布时，保留一致性、Matrix 和 Telegram 通道的产物 URL。
完整的 Matrix 覆盖仍然可以通过手动分片的 QA-Lab 运行获得，而不是默认的发布关键通道。

### Package

Package 测试项是可安装产品的门禁。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 提供支持。该解析器会将候选版本标准化为
供 Docker E2E 使用的 `package-under-test` tarball，验证软件包清单，
记录软件包版本和 SHA-256，并使工作流 harness ref 与软件包来源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由其他 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、
`package_ref=<release-ref>`、`suite_profile=package` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。该配置覆盖安装、更新、
通过离线插件夹具进行的插件软件包契约，以及针对同一个已解析 tarball 的 Telegram 软件包 QA。
这是对过去大多数需要 Parallels 的软件包 / 更新覆盖的 GitHub 原生替代方案。
跨操作系统发布检查对于特定操作系统的新手引导、安装器和平台行为仍然很重要，
但软件包 / 更新产品验证应优先选择 Package Acceptance。

旧版 package-acceptance 宽松策略被有意设定为有时限。直到
`2026.4.25` 的软件包，都可以对已经发布到 npm 的元数据缺口使用兼容路径：
tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、
从 tarball 派生的 git 夹具中缺失的补丁文件、缺失的持久化 `update.channel`、
旧版插件 install-record 位置、缺失的 marketplace install-record 持久化，
以及 `plugins update` 期间的配置元数据迁移。`2026.4.25` 之后的软件包必须满足现代软件包契约；
这些相同的缺口会导致发布验证失败。

当发布问题涉及实际可安装的软件包时，请使用更广泛的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见的软件包配置：

- `smoke`：快速软件包安装 / 渠道 / 智能体、Gateway 网关网络和配置重载通道
- `package`：不含 live ClawHub 的安装 / 更新 / 插件软件包契约；这是发布检查的默认配置
- `product`：`package` 加上 MCP 渠道、cron / subagent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

如需软件包候选版本的 Telegram 证明，请在 Package Acceptance 上启用
`telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。
该工作流会将已解析的 `package-under-test` tarball 传入 Telegram 通道；
独立的 Telegram 工作流仍然接受已发布的 npm spec 用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前工作流分支提交的完整 40 字符 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅执行验证 / 构建 / 打包，`false` 表示真实发布路径
- `preflight_run_id`：在真实发布路径中必填，用于让工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。包含机密的检查要求解析后的提交必须可从 OpenClaw 分支或发布标签访问到。

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；工作流会在继续发布前验证该元数据

## Stable npm 发布顺序

在进行 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在之前，你可以使用当前工作流分支提交的完整 SHA，作为预检工作流的仅验证 dry run
2. 选择 `npm_dist_tag=beta` 以遵循常规的 beta 优先流程，或仅在你有意直接发布 stable 时选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加上 live prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，则改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果该发布落在 `beta` 上，则使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该 stable 版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta`
   应立即跟随相同的 stable 构建，则使用相同的私有工作流将两个 dist-tag 都指向该 stable 版本，
   或让其计划的自愈同步稍后移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然需要
`NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样既保留了直接发布路径，也保留了 beta 优先提升路径，且二者都已文档化并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其限制在 tmux 内，
可以让提示、警报和 OTP 处理保持可观察，并防止主机重复发出警报。

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

## 相关内容

- [发布通道](/zh-CN/install/development-channels)
