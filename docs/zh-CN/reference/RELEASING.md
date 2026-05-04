---
read_when:
    - 正在查找公共发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-04T22:29:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc9b8f82deb90c57c7777480013a5ee956d1123e0b16134daf90a94bc82952cb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- 稳定版：带标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta 版：发布到 npm `beta` 的预发布标签
- 开发版：`main` 的移动头部

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月或日不要补零
- `latest` 表示当前已提升的稳定版 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版发布默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或稍后提升经过审核的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，除非明确请求，否则
  Mac 应用构建/签名/公证仅保留给稳定版

## 发布节奏

- 发布先进入 beta
- 只有在最新 beta 验证通过后才进入稳定版
- 维护者通常会从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布且需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧 beta 标签
- 详细发布流程、审批、凭证和恢复说明仅供维护者使用

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚详情保留在
仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交它，推送它，并在创建分支前再 rebase/pull
   一次。
3. 检查以下文件中的发布兼容性记录：
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts`。只有在升级路径仍被覆盖时
   才移除过期兼容性，否则记录为什么有意继续保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为目标标签更新每个必需的版本位置，运行
   `pnpm plugins:sync`，让可发布的插件包共享发布版本和兼容性元数据，
   然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的
   `preflight_run_id`。
7. 对发布分支、标签或完整提交 SHA 运行 `Full Release Validation`，
   启动所有预发布测试。这是四个大型发布测试环境的唯一手动入口点：
   Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败
   文件、通道、工作流作业、包配置文件、提供商或模型允许列表。
   只有当变更表面使先前证据过期时，才重新运行完整总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的
   `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证
   `pnpm plugins:sync:check`，先将所有可发布插件包发布到 npm，
   再将同一组以 ClawPack npm-pack tarball 的形式发布到 ClawHub，
   然后使用匹配的 dist-tag 提升准备好的 OpenClaw npm 预检产物。
   发布后，针对已发布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切出下一个匹配的预发布编号；不要删除或重写旧预发布。
10. 对于稳定版，只有在经过审核的 beta 或候选发布具备所需验证证据后
    才继续。稳定版 npm 发布也通过 `OpenClaw Release Publish` 进行，
    并通过 `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还要求
    `main` 上存在已打包的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器、在需要发布后渠道证明时可选运行独立的
    已发布 npm Telegram E2E、在需要时提升 dist-tag、从完整匹配的
    `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明，并执行发布公告
    步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也被覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外也保持通过
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI 包存在
- 在根版本提升之后、打标签之前运行 `pnpm plugins:sync`。它会更新可发布的插件包版本、OpenClaw peer/API 兼容性元数据、构建元数据和插件 changelog 存根，使其匹配核心发布版本。`pnpm plugins:sync:check` 是非变更式发布保护；如果忘记此步骤，发布工作流会在任何 registry 变更前失败。
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试箱。它接受分支、标签或完整提交 SHA，调度手动 `CI`，并为安装 smoke、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram 车道调度 `OpenClaw Release Checks`。稳定版/默认运行会把详尽的 live/E2E 和 Docker 发布路径 soak 保留在 `run_release_soak=true` 之后；`release_profile=full` 会强制启用 soak。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查中的 `release-package-under-test` 产物运行包 Telegram E2E。发布后提供 `npm_telegram_package_spec`，可让同一个 Telegram E2E 也验证已发布的 npm 包。发布后提供 `package_acceptance_package_spec`，可让 Package Acceptance 针对已交付的 npm 包而不是按 SHA 构建的产物运行包/更新矩阵。提供 `evidence_package_spec`，可让私有证据报告证明验证匹配已发布的 npm 包，而不强制运行 Telegram E2E。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时为包候选版本获取旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包受信任的 `package_ref` 分支/标签/SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选解析为 `package-under-test`，复用 Docker E2E 发布调度器来验证该 tarball，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当所选 Docker 车道包含 `published-upgrade-survivor` 时，包产物就是候选版本，而 `published_upgrade_survivor_baseline` 会选择已发布的基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置 reload 车道
  - `package`：不包含 OpenWebUI 或 live ClawHub 的产物原生包/更新/插件车道
  - `product`：包 profile 加上 MCP 渠道、cron/子智能体清理、OpenAI web 搜索和 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 调度会绕过 changed 作用域，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、docs 检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 车道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布 telemetry 时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP receiver 运行 QA-lab，并在不需要 Opik、Langfuse 或其他外部 collector 的情况下验证导出的 trace span 名称、有界属性，以及内容/标识符脱敏。
- 每次带标签发布前运行 `pnpm release:check`
- 在标签存在后运行 `OpenClaw Release Publish`，执行会产生变更的发布序列。从 `release/YYYY.M.D` 调度它（或在发布 main 可达标签时从 `main` 调度），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保留默认插件发布作用域 `all-publishable`，除非你明确在运行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会先于其外部化插件发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity 车道，以及快速 live Matrix profile 和 Telegram QA 车道。live 车道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你需要并行覆盖完整 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真实 npm 发布路径保持短、确定且聚焦产物，同时较慢的 live 检查留在自己的车道中，避免拖慢或阻塞发布
- 携带 secret 的发布检查应通过 `Full Release Validation` 调度，或从 `main`/发布工作流 ref 调度，以便工作流逻辑和 secret 保持受控
- 只要解析出的提交可从 OpenClaw 分支或发布标签到达，`OpenClaw Release Checks` 就接受分支、标签或完整提交 SHA
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都会把真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更式验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流 secret 来运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 发布预检不再等待单独的发布检查车道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/correction 标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/correction 版本），在全新的临时前缀中验证已发布 registry 的安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租赁 Telegram 凭据池，针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性运行时可省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭据。
- 若要从维护者机器运行完整的发布后 beta smoke，请使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证，调度 `NPM Telegram Beta E2E`，轮询精确工作流运行，下载产物，并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行同一个发布后检查。它有意设为仅手动，不会在每次 merge 时运行。
- 维护者发布自动化现在使用预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支调度
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可通过工作流输入显式目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以保证安全，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开 repo 保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支但工作流从 `main` 调度时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 Mac 发布必须通过成功的私有 Mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升准备好的产物，而不是重新构建它们
- 对于 `YYYY.M.D-N` 这样的稳定版 correction 发布，发布后 verifier 还会检查同一个临时前缀从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的路径，确保发布 correction 不会静默地让较旧的全局安装停留在基础稳定版 payload 上
- 除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，否则 npm 发布预检会失败关闭，避免我们再次交付空的浏览器 dashboard
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于安装后的 registry 布局中。缺少插件运行时 payload 的发布会让 postpublish verifier 失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此 installer e2e 会在发布路径前捕获意外的 pack 膨胀
- 如果发布工作触及 CI 规划、插件 timing manifests 或插件测试矩阵，请在批准前重新生成并审查 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪还包括 updater surfaces：
  - GitHub release 最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的 app 必须保留非 debug bundle id、非空 Sparkle feed URL，并且 `CFBundleVersion` 不低于该发布版本的规范 Sparkle build floor

## 发布测试箱

`Full Release Validation` 是操作员从单个入口点启动所有预发布测试的方式。对于快速移动分支上的固定提交证明，请使用 helper，确保每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支调度 `Full Release Validation` 并传入 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这样可避免意外证明较新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流 ref 运行，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，使用 `target_ref=<release-ref>` 触发手动 `CI`，触发 `OpenClaw Release Checks`，为面向包的检查准备父级 `release-package-under-test` 工件，并在 `release_profile=full` 且 `rerun_group=all`，或设置了 `npm_telegram_package_spec` 时，触发独立的包 Telegram E2E。随后，`OpenClaw Release Checks` 会扇出安装 smoke、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要会包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确工作流作业名称、stable 与 full 配置文件差异、工件以及聚焦重跑句柄。
子工作流从运行 `Full Release Validation` 的受信任 ref 触发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择受信任的 harness。
不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 作为精确提交证明；原始提交 SHA 不能作为工作流触发 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖广度：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定 provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

当发布阻塞 lane 为绿色，并且你希望在晋级前执行详尽的 live/E2E、Docker 发布路径以及 all-since-2026.4.23 upgrade-survivor 扫描时，对 `stable` 使用 `run_release_soak=true`。`full` 隐含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将目标 ref 一次性解析为 `release-package-under-test`，并在 soak 运行时，在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该工件。这会让所有面向包的盒子使用相同字节，并避免重复构建包。当设置了 repo/org 变量时，跨 OS OpenAI 安装 smoke 使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为此 lane 证明的是包安装、新手引导、Gateway 网关启动和一次 live 智能体轮次，而不是对最慢默认模型进行基准测试。更广泛的 live provider 矩阵仍然是模型特定覆盖的位置。

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要把完整 umbrella 作为聚焦修复后的第一次重跑。如果一个盒子失败，请将失败的子工作流、作业、Docker lane、包配置文件、模型提供商或 QA lane 用作下一次证明。只有当修复更改了共享发布编排，或使先前的全盒证据过期时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传递给 umbrella。`all` 是真正的发布候选运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布的插件子项，`release-checks` 会运行每个发布盒子，较窄的发布组是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行会使用 release-checks 包工件。

### Vitest

Vitest 盒子是手动 `CI` 子工作流。手动 CI 会有意绕过 changed 作用域，并为发布候选强制执行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 和 Control UI i18n。

使用这个盒子回答“源代码树是否通过了完整的普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已触发的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上运行绿色
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当运行需要性能分析时，保留 Vitest 时间工件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或包盒子时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 盒子存在于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml`，以及发布模式 `install-smoke` 工作流。它通过打包的 Docker 环境验证发布候选，而不仅仅是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装 smoke 的完整安装 smoke
- 按目标 SHA 准备/复用根 Dockerfile smoke 镜像，其中 QR、root/gateway 和 installer/Bun smoke 作业作为单独的 install-smoke 分片运行
- 仓库 E2E lane
- 发布路径 Docker chunk：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时在 `plugins-runtime-services` chunk 内的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lane，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当 release checks 包含 live 套件时的 live/E2E provider 套件和 Docker live 模型覆盖

重跑前先使用 Docker 工件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段时间、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布 chunk。生成的重跑命令在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane 可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 盒子也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- mock parity lane，使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6 基线进行比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置文件
- 使用 Convex CI 凭据租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用这个盒子回答“发布在 QA 场景和 live 渠道流程中是否行为正确？”批准发布时保留 parity、Matrix 和 Telegram lane 的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键 lane。

### Package

Package 盒子是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支持。解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并保持工作流 harness ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、准备好的发布包工件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对相同解析出的 tarball 保持迁移、更新、陈旧插件依赖清理、离线插件 fixture、插件更新和 Telegram 包 QA。阻塞发布检查使用默认的最新已发布包基线；`run_release_soak=true` 或 `release_profile=full` 会扩展到从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，以及 reported-issue fixture。对于已经发布的候选，请使用带 `source=npm` 的 Package Acceptance；对于发布前由 SHA 支持的本地 npm tarball，请使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，用来覆盖此前大多需要 Parallels 的包/更新验证。跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、Doctor 清理或已发布包迁移更改时使用它。从每个稳定 `2026.4.23+` 包进行的详尽已发布更新迁移是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽松策略是有意限时的。到 `2026.4.25` 为止的包可以针对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可以对已经发布的本地构建元数据 stamp 文件发出警告。更晚的包必须满足现代包契约；这些相同缺口会导致发布验证失败。

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

- `smoke`：快速的包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：不依赖实时 ClawHub 的安装/更新/插件包契约；这是发布检查的默认项
- `product`：`package` 加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于候选包的 Telegram 验证，在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会把解析出的 `package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍然接受已发布的 npm 规格用于发布后检查。

## 发布发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它会按发布所需的顺序编排受信任发布者工作流：

1. 签出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分发 `Plugin NPM Release`。
5. 使用相同范围和 SHA 分发 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和保存的 `preflight_run_id` 分发 `OpenClaw NPM Release`。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

稳定版发布到默认 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接提升稳定版到 `latest` 是显式操作：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作时使用较低层级的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定插件修复，将
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`；或者当不得发布 OpenClaw 包时，直接分发子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，使工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签；必须已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认值为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认值为 `true`；仅在把该工作流用作仅插件修复编排器时设置为 `false`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析出的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查中选择加入完整的实时/E2E、Docker 发布路径和所有既往升级幸存者 soak。`release_profile=full` 会强制启用它。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布前验证该元数据仍然一致

## 稳定版 npm 发布序列

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整的工作流分支提交 SHA，对预检工作流进行仅验证的试运行
2. 对于常规的 beta 优先流程，选择 `npm_dist_tag=beta`；仅在你有意直接发布稳定版时选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外部化插件发布到 npm 和 ClawHub，然后再提升 OpenClaw npm 包
7. 如果发布落在 `beta` 上，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta` 应立即跟随相同稳定构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或让其定时自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍然需要 `NPM_TOKEN`，而公共仓库保留仅 OIDC 的发布。

这让直接发布路径和 beta 优先提升路径都保持有文档记录，并对操作员可见。

如果维护者必须回退到本地 npm 认证，请仅在专用 tmux 会话内运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其放在 tmux 内可以让提示、告警和 OTP 处理可观察，并防止重复的主机告警。

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

维护者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档作为实际运行手册。

## 相关

- [发布渠道](/zh-CN/install/development-channels)
