---
read_when:
    - 查找公开发布通道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作人员检查清单、验证项、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T06:21:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 166dbb4e3c2772a4bd73fb9d95dfb810036aefc06eb7ca37d6b7cb5ce1c0ec57
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新最新版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已晋升的稳定版 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作人员可以显式指定发布到 `latest`，或稍后再晋升经过验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时发布 npm 软件包和 macOS 应用；
  beta 发布通常先验证并发布 npm/软件包路径，macOS 应用的构建/签名/公证通常保留给稳定版，除非有明确要求

## 发布节奏

- 发布遵循 beta 优先
- 只有在最新 beta 验证通过后才会进行稳定版发布
- 维护者通常从当前 `main` 创建 `release/YYYY.M.D` 分支来进行发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布后需要修复，维护者会创建下一个 `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布操作人员检查清单

此检查清单展示了公开的发布流程形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新代码，确认目标提交已推送，
   并确认当前 `main` 的 CI 绿灯情况足以从其创建分支。
2. 使用 `/changelog` 根据真实提交历史重写 `CHANGELOG.md` 顶部部分，保持条目面向用户，提交并推送，然后在创建分支前再执行一次 rebase/pull。
3. 检查位于
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍被覆盖时移除已过期的兼容性，否则记录为什么要有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为目标标签更新所有必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签尚不存在时，可以使用完整的 40 字符发布分支 SHA 进行仅验证用途的预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，通过 `Full Release Validation` 启动所有发布前测试。这是四个大型发布测试项——Vitest、Docker、QA Lab 和 Package——唯一的手动入口点。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复有效的最小失败文件、lane、workflow job、package profile、provider 或 model allowlist。只有当变更范围使先前证据失效时，才重新运行完整总体验证。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 软件包运行发布后软件包验收。如果一个已推送或已发布的 beta 需要修复，创建下一个 `-beta.N`；不要删除或重写旧的 beta。
10. 对于 stable，只有在已审定的 beta 或候选发布具备所需验证证据后才继续。稳定版 npm 发布会通过 `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布准备就绪还要求 `main` 上具备已打包的 `.zip`、`.dmg`、`.dSYM.zip` 以及更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；在你需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；按需进行 dist-tag 晋升；基于完整匹配的 `CHANGELOG.md` 部分生成 GitHub release/prerelease notes；并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 就能在更快的本地 `pnpm check` gate 之外继续得到覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查就能在更快的本地 gate 之外保持绿灯
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 才会存在
- 在发布审批前运行手动 `Full Release Validation` workflow，从单一入口点启动所有发布前测试项。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，用于安装冒烟、软件包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram lanes。只有在软件包已经发布并且也应运行发布后 Telegram E2E 时，才提供 `npm_telegram_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时为某个软件包候选获得旁路证明，可运行手动 `Package Acceptance` workflow。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本，使用 `source=npm`；使用 `source=ref` 时，可用当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 的 HTTPS tarball，使用 `source=url`；对于由其他 GitHub Actions 运行上传的 tarball，使用 `source=artifact`。该 workflow 会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置文件：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载 lanes
  - `package`：原生产物软件包/更新/插件 lanes，不包含 OpenWebUI 或 live ClawHub
  - `product`：在 package 配置文件基础上增加 MCP channels、cron/subagent cleanup、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes`，用于聚焦重跑
- 当你只需要为发布候选获得完整常规 CI 覆盖时，直接运行手动 `CI` workflow。手动 CI 分发会绕过变更范围限制，并强制运行 Linux Node 分片、bundled-plugin 分片、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python Skills、Windows、macOS、Android 和 Control UI i18n lanes。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP receiver 驱动 QA-lab，并验证导出的 trace span names、有界 attributes，以及内容/标识符脱敏，而无需 Opik、Langfuse 或其他外部收集器。
- 在每次打标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布审批前运行 QA Lab mock 一致性 gate，以及快速 live Matrix profile 和 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 还使用 Convex CI credential leases。当你希望并行运行完整 Matrix 传输、媒体和 E2EE 清单时，运行手动 `QA-Lab - All Lanes` workflow，并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨操作系统安装和升级运行时验证属于公开的
  `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用 workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、确定性强并聚焦于产物，而较慢的 live 检查留在各自的 lane 中，这样它们就不会拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation`
  或从 `main`/release workflow ref 分发，这样 workflow 逻辑和密钥才能保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从某个 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证用途的预检也接受当前 workflow 分支的完整 40 字符提交 SHA，而不要求已有已推送标签
- 该 SHA 路径仅用于验证，不能晋升为真实发布
- 在 SHA 模式下，该 workflow 仅为软件包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个 workflow 都将真实发布和晋升路径保留在 GitHub-hosted runners 上，而不发生变更的验证路径则可以使用更大的 Blacksmith Linux runners
- 该 workflow 会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secrets
- npm 发布预检不再等待单独的发布检查 lane
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版版本），以在全新临时前缀中验证已发布 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以针对已发布 npm 软件包验证已安装软件包的新手引导、Telegram 设置和真实 Telegram E2E，并使用共享租赁的 Telegram 凭证池。本地维护者的一次性检查可省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过手动 `NPM Telegram Beta E2E` workflow 在 GitHub Actions 中运行相同的发布后检查。它刻意仅支持手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用先预检再晋升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认指向 `beta`
  - 稳定版 npm 发布可以通过 workflow 输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 修改现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    出于安全原因，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保留仅使用 OIDC 的发布方式
  - 公开 `macOS Release` 仅用于验证
  - 真实私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会晋升已准备好的产物，而不是再次重新构建
- 对于 `YYYY.M.D-N` 这类稳定版修正版发布，发布后验证器还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的相同临时前缀升级路径，这样发布修正就不会悄悄让旧的全局安装仍停留在基础稳定版负载上
- npm 发布预检默认失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，这样我们就不会再次发布一个空的浏览器仪表板
- 发布后验证还会检查已发布的 registry 安装在根级 `dist/*`
  布局下是否包含非空的内置插件运行时依赖。若某次发布缺少这些内置插件依赖负载，或其内容为空，则发布后验证器会判定失败，并且不能晋升到 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器 e2e 能在发布路径之前捕获意外的打包体积膨胀
- 如果发布工作触及了 CI 规划、扩展 timing manifests 或扩展测试矩阵，请在审批前重新生成并检查来自 `.github/workflows/ci.yml` 的 planner-owned `checks-node-extensions` workflow matrix 输出，这样发布说明就不会描述过时的 CI 布局
- 稳定版 macOS 发布准备就绪还包括更新器相关界面：
  - GitHub release 最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle build floor 的 `CFBundleVersion`

## 发布测试项

`Full Release Validation` 是操作人员从单一入口点启动所有发布前测试的方式。请从可信的 `main` workflow ref 运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

该 workflow 会解析目标 ref，使用
`target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，并在设置了
`npm_telegram_package_spec` 时可选分发独立的发布后 Telegram E2E。随后，`OpenClaw Release Checks` 会展开为安装冒烟、跨操作系统发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab 一致性、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，并且任何可选的 `npm_telegram` 子项要么成功，要么被有意跳过时，完整运行才可接受。

根据发布阶段使用以下变体：

```bash
# 验证尚未发布的发布候选分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 验证某个已推送的精确提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 在 beta 发布后，增加针对已发布软件包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在针对某个聚焦修复的首次重跑时就使用完整总体验证。如果某个测试项失败，应使用失败的子 workflow、job、Docker lane、package profile、model provider 或 QA lane 作为下一次证明。只有当修复改动了共享的发布编排，或使先前所有测试项的证据失效时，才再次运行完整总体验证。

### Vitest

Vitest 测试项是手动 `CI` 子 workflow。手动 CI 会有意绕过变更范围限制，并为发布候选强制运行常规测试图：Linux Node 分片、bundled-plugin 分片、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个测试项来回答“源代码树是否通过了完整的常规测试套件？”这个问题。它不同于发布路径产品验证。需要保留的证据：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上的 `CI` 运行绿灯
- 调查回归时来自 CI jobs 的失败或缓慢分片名称
- 当某次运行需要性能分析时，Vitest 时间产物，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的常规 CI、但不需要 Docker、QA Lab、live、跨操作系统或软件包测试项时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 测试项位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的
`install-smoke` workflow 提供。它通过打包后的 Docker 环境来验证发布候选，而不仅仅是源码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 仓库 E2E lanes
- 发布路径 Docker 分块：`core`、`package-update` 和
  `plugins-integrations`
- 在需要时，于 `plugins-integrations` 分块中包含 OpenWebUI 覆盖
- 在 `plugins-integrations` 中拆分 bundled-channel 依赖 lanes，而不是使用串行的一体化 bundled-channel lane
- 当发布检查包含 live suites 时，包含 live/E2E provider suites 和 Docker live model 覆盖

重跑前先使用 Docker 产物。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、
阶段耗时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用的 live/E2E workflow 上使用
`docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的
`package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的 lane 可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 测试项也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级别的发布 gate，与 Vitest 和 Docker 软件包机制分离。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack，将 OpenAI 候选 lane 与 Opus 4.6 基线进行比较的 mock 一致性 gate
- 使用 `qa-live-shared` environment 的快速 live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- 当发布遥测需要明确的本地证明时运行 `pnpm qa:otel:smoke`

使用这个测试项来回答“该发布在 QA 场景和 live 渠道流程中是否行为正确？”这个问题。批准发布时，请保留 parity、Matrix 和 Telegram lanes 的产物 URL。完整 Matrix 覆盖仍可通过手动分片的 QA-Lab 运行获得，而不是默认的关键发布 lane。

### Package

Package 测试项是可安装产品 gate。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 提供支持。该解析器会将候选标准化为 Docker E2E 消费的
`package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将 workflow harness ref 与软件包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由其他 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会使用 `source=ref`、
`package_ref=<release-ref>`、`suite_profile=package` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。该配置文件涵盖安装、更新、通过离线插件夹具进行的插件软件包契约，以及针对同一解析 tarball 的 Telegram 软件包 QA。它是此前大多数需要 Parallels 的软件包/更新覆盖的 GitHub 原生替代方案。跨操作系统发布检查对于特定操作系统的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先选择 Package Acceptance。

旧版 package-acceptance 宽容性是刻意设定了时间限制的。直到 `2026.4.25` 的软件包仍可使用兼容路径来处理已经发布到 npm 的元数据缺口：tarball 中缺失的私有 QA 清单条目、缺失的
`gateway install --wrapper`、从 tarball 派生的 git 夹具中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件 install-record 位置、缺失的 marketplace install-record 持久化，以及 `plugins update` 期间的配置元数据迁移。`2026.4.25` 之后的软件包必须满足现代软件包契约；上述这些缺口都会导致发布验证失败。

当发布问题涉及真实的可安装软件包时，请使用更广泛的 Package Acceptance 配置文件：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见的软件包配置文件：

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置重载 lanes
- `package`：不含 live ClawHub 的安装/更新/插件软件包契约；这是发布检查的默认值
- `product`：`package` 再加上 MCP channels、cron/subagent cleanup、OpenAI web search 和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：精确的 `docker_lanes` 列表，用于聚焦重跑

对于软件包候选的 Telegram 证明，请在 Package Acceptance 上启用
`telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该 workflow 会将解析后的
`package-under-test` tarball 传递给 Telegram lane；独立的 Telegram workflow 仍然接受已发布的 npm 规范用于发布后检查。

## NPM workflow 输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前 workflow 分支的完整 40 字符提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅执行验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径中必需，这样 workflow 才能复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签到达。

规则：

- 稳定版和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间相同的 `npm_dist_tag`；
  workflow 会在继续发布前验证该元数据

## 稳定版 npm 发布顺序

在进行稳定版 npm 发布时：

1. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签尚不存在之前，你可以使用当前 workflow 分支的完整提交
     SHA 对预检 workflow 执行仅验证的 dry run
2. 对正常的 beta 优先流程选择 `npm_dist_tag=beta`，只有在你明确希望直接发布稳定版时才选择 `latest`
3. 当你希望通过一个手动 workflow 获得常规 CI 加上 live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，对发布分支、发布标签或完整提交 SHA 运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，则改为在发布 ref 上运行手动 `CI` workflow
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果发布落在 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow 将该稳定版本从 `beta` 晋升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且
   `beta` 也应立即跟随同一稳定构建，请使用同一个私有 workflow 将这两个 dist-tag 都指向该稳定版本，或者让其计划中的自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 修改位于私有仓库中，因为它仍然需要
`NPM_TOKEN`，而公开仓库保留仅使用 OIDC 的发布方式。

这使得直接发布路径和 beta 优先晋升路径都被记录下来，并且对操作人员可见。

如果维护者必须回退到本地 npm 身份验证，则只能在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其保留在 tmux 中可以让提示、告警和 OTP 处理保持可观察，并防止重复的主机告警。

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
