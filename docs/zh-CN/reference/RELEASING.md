---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-29T10:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815c4bffe7930384584533e934996592114af510ebd775fc873086d63c74203f
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
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
- `beta` 表示当前的 beta 安装目标
- 稳定和稳定修正发布版本默认发布到 npm `beta`；发布操作者可以明确指定 `latest`，或稍后提升一个经过验证的 beta 构建
- 每个稳定的 OpenClaw 发布版本都会同时交付 npm 包和 macOS 应用；
  beta 发布通常先验证并发布 npm/包路径，mac 应用构建/签名/公证默认保留给稳定版本，除非明确请求

## 发布节奏

- 发布按 beta 优先推进
- 只有在最新 beta 验证通过后才会进入稳定版本
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布版本，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并且需要修复，维护者会切出下一个 `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作者清单

此清单展示发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认当前 `main` CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，保持条目面向用户，提交它、推送它，并在创建分支前再执行一次 rebase/pull。
3. 审查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍被覆盖时才移除已过期兼容性，或记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为目标标签提升每个必需位置的版本号，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`。在标签存在之前，允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试箱的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败文件、通道、工作流作业、包配置、提供商或模型允许列表。只有当变更表面使先前证据失效时，才重新运行完整总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的 beta 需要修复，切出下一个 `-beta.N`；不要删除或重写旧 beta。
10. 对于稳定版本，只有在经过验证的 beta 或候选发布版本具备所需验证证据后才继续。稳定 npm 发布通过 `preflight_run_id` 复用成功的预检制品；稳定 macOS 发布就绪还要求打包后的 `.zip`、`.dmg`、`.dSYM.zip` 以及更新后的 `appcast.xml` 位于 `main` 上。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；按需执行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布/预发布说明；并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也被覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外也保持通过
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保预期的 `dist/*` 发布产物和 Control UI 包已存在，可供打包验证步骤使用
- 在发布批准前运行手动 `Full Release Validation` workflow，从一个入口点启动所有预发布测试箱。它接受分支、标签或完整提交 SHA，触发手动 `CI`，并触发 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。仅在包已发布且发布后 Telegram E2E 也应运行时，才提供 `npm_telegram_package_spec`。当私有证据报告需要证明验证匹配已发布的 npm 包、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你想在发布工作继续推进的同时，为包候选版本取得旁路证明时，运行手动 `Package Acceptance` workflow。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 可用当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该 workflow 会将候选项解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置热重载通道
  - `package`：artifact 原生的包/更新/插件通道，不包含 OpenWebUI 或 live ClawHub
  - `product`：包配置加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` workflow。手动 CI 触发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，不需要 Opik、Langfuse 或其他外部 collector。
- 每次打标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity 门禁，以及快速 live Matrix 配置和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你想并行运行完整 Matrix 传输、媒体和 E2EE 清单时，用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` workflow。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真正的 npm 发布路径保持短小、确定且聚焦产物，同时较慢的 live 检查保留在自己的通道中，避免拖慢或阻塞发布
- 带有 secret 的发布检查应通过 `Full Release Validation` 触发，或从 `main`/release workflow ref 触发，以便 workflow 逻辑和 secret 保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前 workflow 分支的完整 40 字符提交 SHA，不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真正发布
- 在 SHA 模式下，workflow 只会为包元数据检查合成 `v<package.json version>`；真正发布仍然需要真实发布标签
- 两个 workflow 都将真正发布和提升路径保留在 GitHub 托管 runner 上，而非变更性的验证路径可以使用更大的 Blacksmith Linux runner
- 该 workflow 使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secret
- npm 发布预检不再等待单独的发布检查通道
- 在批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/correction 标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/correction 版本），在新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭证池，针对已发布 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性运行时可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭证。
- 维护者可以通过手动 `NPM Telegram Beta E2E` workflow，从 GitHub Actions 运行相同的发布后检查。它有意仅限手动，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检后提升：
  - 真正的 npm 发布必须通过一次成功的 npm `preflight_run_id`
  - 真正的 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支触发
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可通过 workflow 输入显式指向 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，出于安全原因，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证
  - 真正的私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真正发布路径会提升已准备好的产物，而不是再次重建它们
- 对于 `YYYY.M.D-N` 这样的 stable correction 发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，确保发布修正不会静默地让旧版全局安装停留在基础 stable payload 上
- npm 发布预检默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，以避免再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布注册表安装是否在根 `dist/*` 布局下包含非空的内置插件运行时依赖。若发布缺失或包含空的内置插件依赖 payload，发布后验证器会失败，且不能提升到 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此 installer e2e 会在发布路径前捕获意外的包体积膨胀
- 如果发布工作涉及 CI 规划、插件时序清单或插件测试矩阵，请在批准前重新生成并审查 `.github/workflows/plugin-prerelease.yml` 中 planner 拥有的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- stable macOS 发布就绪性还包括 updater 表面：
  - GitHub 发布最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的 app 必须保留非 debug bundle id、非空 Sparkle feed URL，以及不低于该发布版本 canonical Sparkle 构建下限的 `CFBundleVersion`

## 发布测试箱

`Full Release Validation` 是操作者从一个入口点启动所有预发布测试的方式。从可信的 `main` workflow ref 运行它，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该 workflow 解析目标 ref，使用 `target_ref=<release-ref>` 触发手动 `CI`，触发 `OpenClaw Release Checks`，并在设置 `npm_telegram_package_spec` 时可选地触发独立的发布后 Telegram E2E。随后 `OpenClaw Release Checks` 会扩展运行安装冒烟、跨 OS 发布检查、live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功，且任何可选的 `npm_telegram` 子项成功或有意跳过时，完整运行才可接受。最终验证器摘要包含每个子运行的最慢 job 表，因此发布经理无需下载日志即可看到当前关键路径。
子 workflow 从运行 `Full Release Validation` 的可信 ref 触发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签。没有单独的 Full Release Validation workflow-ref 输入；通过选择 workflow 运行 ref 来选择可信 harness。

使用 `release_profile` 选择 live/provider 覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的 stable provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

`OpenClaw Release Checks` 使用可信 workflow ref 将目标 ref 解析一次为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该 artifact。这会让所有面向包的测试箱使用相同字节，并避免重复构建包。

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

不要在聚焦修复后的第一次重跑中使用完整总流程。如果一个盒子失败，请使用失败的子工作流、作业、Docker 通道、包配置、模型提供商或 QA 通道作为下一次证明。只有当修复更改了共享发布编排，或使之前的所有盒子证据过期时，才再次运行完整总流程。总流程的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，请向总流程传入 `rerun_group`。`all` 是真正的发布候选运行，`ci` 只运行常规 CI 子项，`plugin-prerelease` 只运行仅发布用的插件子项，`release-checks` 运行每个发布盒子，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供独立包 Telegram 通道时的 `npm-telegram`。

### Vitest

Vitest 盒子是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并为发布候选强制运行常规测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建烟雾测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用这个盒子来回答“源代码树是否通过了完整的常规测试套件？”它不同于发布路径的产品验证。需要保留的证据：

- 显示已派发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色通过的 `CI` 运行
- 调查回归时来自 CI 作业的失败或较慢分片名称
- 当某次运行需要性能分析时，保留 `.artifacts/vitest-shard-timings.json` 等 Vitest 计时产物

只有当发布需要确定性的常规 CI，但不需要 Docker、QA Lab、实时、跨 OS 或包盒子时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 盒子通过 `openclaw-live-and-e2e-checks-reusable.yml` 位于 `OpenClaw Release Checks` 中，另外还包括发布模式的 `install-smoke` 工作流。它通过打包后的 Docker 环境验证发布候选，而不只是源码级测试。

发布 Docker 覆盖范围包括：

- 启用较慢 Bun 全局安装烟雾测试的完整安装烟雾测试
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`
- 请求时，`plugins-runtime-services` 分块内的 OpenWebUI 覆盖
- 将内置渠道依赖通道拆分到 channel-smoke、update-target 和 setup/runtime 契约分块，而不是一个大型内置渠道作业
- 拆分内置插件安装/卸载通道 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，包含实时/E2E 提供商套件和 Docker 实时模型覆盖

重跑前先使用 Docker 产物。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 盒子也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖范围包括：

- 使用智能体对等包，将 OpenAI 候选通道与 Opus 4.6 基线进行比较的模拟对等门禁
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置
- 使用 Convex CI 凭证租约的实时 Telegram QA 通道
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用这个盒子来回答“发布在 QA 场景和实时渠道流程中的行为是否正确？”批准发布时，请保留对等、Matrix 和 Telegram 通道的产物 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键通道。

### 包

包盒子是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流 harness ref 与包源码 ref 分开。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：用所选 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、`package_ref=<release-ref>`、`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。发布路径 Docker 分块覆盖重叠的安装、更新和插件更新通道；Package Acceptance 则针对同一个已解析 tarball 保留产物原生的内置渠道兼容性、离线插件 fixture，以及 Telegram 包 QA。它是以前大多数需要 Parallels 的包/更新覆盖的 GitHub 原生替代方案。跨 OS 发布检查对 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

旧版 package-acceptance 宽容路径被有意限定在时间范围内。到 `2026.4.25` 为止的包可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可以对已经发布的本地构建元数据戳文件发出警告。之后的包必须满足现代包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更广泛的 Package Acceptance 配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见包配置：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：不带实时 ClawHub 的安装/更新/插件包契约；这是 release-check 默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将解析后的 `package-under-test` tarball 传入 Telegram 通道；独立 Telegram 工作流仍接受已发布的 npm 规格，用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径上必需，因此工作流会复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签访问。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续之前验证该元数据

## 稳定版 npm 发布流程

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整工作流分支提交 SHA，对预检工作流进行仅验证的试运行
2. 对于常规的先 beta 流程，选择 `npm_dist_tag=beta`；只有当你明确想要直接稳定版发布时，才选择 `latest`
3. 当你想从一个手动工作流获得常规 CI 加实时提示缓存、Docker、QA Lab、Matrix 和 Telegram 覆盖时，请在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并使用 `preflight_only=false`、相同的 `tag`、相同的 `npm_dist_tag` 和保存的 `preflight_run_id`
7. 如果发布落在 `beta` 上，请使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个稳定构建，请使用同一个私有工作流将两个 dist-tags 都指向该稳定版本，或让它的定时自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全原因，因为它仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布。

这会让直接发布路径和先 beta 后提升路径都保持文档化，并对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请只在专用 tmux 会话内运行任何 1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；把它放在 tmux 内可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

## 公开参考资料

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
