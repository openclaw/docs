---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证框、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-12T08:45:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公共发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升的稳定 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定修正版默认发布到 npm `beta`；发布操作者可以明确指定 `latest`，或稍后提升一个已验证的 beta 构建
- 每个稳定 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，
  mac 应用的构建/签名/公证则保留给稳定版，除非明确请求

## 发布节奏

- 发布按 beta 优先推进
- 稳定版只会在最新 beta 验证通过后跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布且需要修复，维护者会切下一个 `-beta.N` 标签，
  而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作者检查清单

此检查清单是发布流程的公共形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够绿色，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送，然后在创建分支前再 rebase/pull 一次。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍被覆盖时才移除过期兼容性，
   或记录为什么要有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为目标标签提升每个必需位置的版本，然后运行
   `pnpm release:prep`。它会按正确顺序刷新插件版本、插件清单、配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。打标签前提交任何生成的漂移。然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 以 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 执行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试盒子的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、工作流任务、包 profile、提供商或模型 allowlist。只有当变更表面让先前证据过期时，才重新运行完整总控。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，
   并行分发所有可发布插件包到 npm 以及同一组到 ClawHub，
   然后在插件 npm 发布成功后立即用匹配的 dist-tag 提升已准备的 OpenClaw npm 预检产物。
   OpenClaw npm 发布子任务成功后，它会从完整匹配的
   `CHANGELOG.md` 章节创建或更新匹配的 GitHub release/prerelease 页面。发布到 npm `latest` 的稳定版会成为 GitHub latest release；保留在 npm `beta` 上的稳定维护版会以 GitHub `latest=false` 创建。
   OpenClaw npm 发布时，ClawHub 发布可能仍在运行，但发布工作流会立即打印子运行 ID。默认情况下，它在分发后不会等待 ClawHub，因此 OpenClaw npm 可用性不会被较慢的 ClawHub 审批或 registry 工作阻塞；当 ClawHub 必须阻塞工作流完成时，设置
   `wait_for_clawhub=true`。ClawHub 路径会重试瞬态 CLI 依赖安装失败，即使某个预览单元偶发失败也会发布预览通过的插件，并以每个预期插件版本的 registry 验证结束，使部分发布保持可见且可重试。发布后，运行
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   通过一条命令验证 GitHub prerelease、npm `beta` dist-tag、npm 完整性、已发布安装路径、ClawHub 精确版本、ClawHub 产物和子工作流结论。当 ClawHub sidecar 仅在可重试任务中失败且应原地重新运行时，添加 `--rerun-failed-clawhub`。
   然后针对已发布的
   `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切下一个匹配的预发布编号；不要删除或重写旧预发布。
10. 对于稳定版，只有在已验证的 beta 或候选发布具备所需验证证据后才继续。
    稳定版 npm 发布同样通过
    `OpenClaw Release Publish`，并通过
    `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还要求 `main` 上存在打包好的 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
    私有 macOS 发布工作流会在发布资产验证通过后自动将已签名 appcast 发布到公共
    `main`；如果分支保护阻止直接推送，它会打开或更新一个 appcast PR。
11. 发布后，运行 npm 发布后验证器；在需要发布后渠道证明时，可选运行独立的已发布 npm Telegram E2E；
    在需要时执行 dist-tag 提升，验证生成的 GitHub 发布页面，
    并运行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外也保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保打包验证步骤所需的 `dist/*` 发布工件和 Control UI 包已存在
- 在根版本号提升之后、打标签之前运行 `pnpm release:prep`。它会运行所有确定性的发布生成器，这些生成器通常会在版本、配置或 API 变更后发生漂移：插件版本、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出，以及插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些防护项，并在运行包发布检查前一次性报告它发现的所有生成漂移失败。
- 在发布审批前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试箱。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并为安装冒烟、包验收、跨 OS 包检查、QA Lab 对等性、Matrix 和 Telegram 通道分发 `OpenClaw Release Checks`。稳定版和默认运行会将穷尽式 live/E2E 与 Docker 发布路径浸泡测试保留在 `run_release_soak=true` 后面；`release_profile=full` 会强制开启浸泡测试。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对来自发布检查的 `release-package-under-test` 工件运行包 Telegram E2E。发布 beta 后提供 `release_package_spec`，即可在发布检查、Package Acceptance 和包 Telegram E2E 中复用已发布的 npm 包，而无需重新构建发布 tarball。仅当 Telegram 应使用不同于其余发布验证的已发布包时，才提供 `npm_telegram_package_spec`。当 Package Acceptance 应使用不同于发布包规格的已发布包时，提供 `package_acceptance_package_spec`。当私有证据报告应证明验证匹配某个已发布 npm 包、但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时为包候选获取旁路证明，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；用 `source=ref` 将受信任的 `package_ref` 分支、标签或 SHA 与当前 `workflow_ref` harness 打包；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或者对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当选定的 Docker 通道包含 `published-upgrade-survivor` 时，包工件就是候选，而 `published_upgrade_survivor_baseline` 选择已发布基线。`update-restart-auth` 会将候选包同时用作已安装 CLI 和 package-under-test，因此会演练候选更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安装、渠道、智能体，Gateway 网关网络，以及配置重载通道
  - `package`：不含 OpenWebUI 或 live ClawHub 的工件原生包、更新、重启、插件通道
  - `product`：包 profile 加上 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器演练 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部采集器。
- 每次打标签发布前运行 `pnpm release:check`
- 标签存在后，运行 `OpenClaw Release Publish` 来执行会产生变更的发布序列。从 `release/YYYY.M.D`（或发布 main 可达标签时从 `main`）分发它，传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保持默认插件发布范围 `all-publishable`，除非你有意运行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会先于其外置插件发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock 对等性通道，以及快速 live Matrix profile 和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。需要并行运行完整 Matrix 传输、媒体和 E2EE 清单时，运行手动 `QA-Lab - All Lanes` 工作流并设置 `matrix_profile=all` 和 `matrix_shards=true`。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 与 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意设计的：让真实 npm 发布路径保持简短、确定且聚焦工件，同时让较慢的 live 检查保留在自己的通道中，避免拖延或阻塞发布
- 带有密钥的发布检查应通过 `Full Release
Validation` 分发，或从 `main`/发布工作流 ref 分发，以确保工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，无需已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都会将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更性验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在本地给发布候选打标签前，运行 `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`。该 helper 会按顺序运行快速发布防护、插件 npm/ClawHub 发布检查、构建、UI 构建和 `release:openclaw:npm:check`，以便在 GitHub 发布工作流启动前捕获常见的审批阻塞错误。
- 审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/修正版本），在全新临时前缀中验证已发布 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  使用共享租约 Telegram 凭证池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 若要从维护者机器运行完整的发布后 beta 冒烟，请使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证，分发 `NPM Telegram Beta E2E`，轮询精确工作流运行，下载工件，并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行同样的发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再提升：
  - 真实 npm 发布必须通过一次成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以提升安全性，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支上但工作流从 `main` 分发时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的工件，而不是再次重建
- 对于 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器还会检查同一临时前缀从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的路径，确保发布修正不会静默地让旧的全局安装停留在基础稳定版负载上
- 除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，否则 npm 发布预检会失败关闭，避免我们再次发布空的浏览器 dashboard
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装的 registry 布局中。如果某个发布缺失插件运行时负载，会导致 postpublish 验证器失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布路径之前捕获意外的包体积膨胀
- 如果发布工作触及 CI 规划、插件 timing 清单或插件测试矩阵，请在审批前重新生成并审查由规划器拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪状态还包括更新器表面：
  - GitHub 发布最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip；私有 macOS 发布工作流会自动提交它，或在直接推送被阻止时打开 appcast PR
  - 打包应用必须保持非 debug bundle id、非空 Sparkle feed URL，以及等于或高于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是运维人员从一个入口启动所有预发布测试的方式。对于快速变化分支上的固定提交证明，请使用这个辅助命令，让每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该辅助命令会推送 `release-ci/<sha>-...`，从该分支分派 `Full Release Validation` 并设置 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这可以避免意外证明较新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流引用运行，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标引用，使用 `target_ref=<release-ref>` 分派手动 `CI`，分派 `OpenClaw Release Checks`，为面向包的检查准备父级 `release-package-under-test` 工件，并在 `release_profile=full` 且 `rerun_group=all` 时，或设置了 `release_package_spec` 或 `npm_telegram_package_spec` 时，分派独立的包 Telegram E2E。随后 `OpenClaw Release Checks` 会展开安装冒烟、跨 OS 发布检查、启用 soak 时的实时/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab 一致性、实时 Matrix 和实时 Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 均成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `release_package_spec` 或 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。完整阶段矩阵、确切的工作流作业名称、stable 与 full 配置差异、工件和定向重跑句柄，请参阅[完整发布验证](/zh-CN/reference/full-release-validation)。子工作流从运行 `Full Release Validation` 的受信任引用分派，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation 工作流引用输入；通过选择工作流运行引用来选择受信任的执行框架。不要使用 `--ref main -f ref=<sha>` 来对移动中的 `main` 做精确提交证明；原始提交 SHA 不能作为工作流分派引用，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择实时/提供商覆盖范围：

- `minimum`：最快的发布关键 OpenAI/核心实时和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的建议性提供商/媒体覆盖

当发布阻断通道都为绿色，并且你希望在推广前执行详尽的实时/E2E、Docker 发布路径以及有界的已发布升级幸存者扫描时，请将 `run_release_soak=true` 与 `stable` 一起使用。该扫描覆盖最新四个 stable 包，以及固定的 `2026.4.23` 和 `2026.5.2` 基线，再加上较旧的 `2026.4.15` 覆盖；重复基线会被移除，并且每个基线都会分片到自己的 Docker runner 作业中。`full` 隐含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的工作流引用将目标引用解析一次为 `release-package-under-test`，并在 soak 运行时在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该工件。这让所有面向包的测试盒使用相同字节，并避免重复包构建。beta 已发布到 npm 后，设置 `release_package_spec=openclaw@YYYY.M.D-beta.N`，让发布检查下载一次已发布包，从 `dist/build-info.json` 提取其构建源 SHA，并为跨 OS、Package Acceptance、发布路径 Docker 和包 Telegram 通道复用该工件。跨 OS OpenAI 安装冒烟在设置了仓库/组织变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该通道证明的是包安装、新手引导、Gateway 网关启动和一次实时 agent 轮次，而不是对最慢默认模型进行基准测试。更广泛的实时提供商矩阵仍然是模型特定覆盖的位置。

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要把完整总括流程用作定向修复后的第一次重跑。如果某个测试盒失败，请使用失败的子工作流、作业、Docker 通道、包配置、模型提供商或 QA 通道来做下一次证明。只有当修复更改了共享发布编排，或让先前的全测试盒证据过期时，才再次运行完整总括流程。总括流程的最终验证器会重新检查记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，请向总括流程传入 `rerun_group`。`all` 是真实的候选发布运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布的插件子项，`release-checks` 运行每个发布测试盒，更窄的发布分组是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。定向 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 运行会使用 release-checks 包工件。定向跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/套件过滤器。QA release-check 失败是建议性的；仅 QA 失败不会阻断发布验证。

### Vitest

Vitest 测试盒是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围，并强制对候选发布运行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个测试盒回答“源码树是否通过了完整的普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已分派的 `CI` 运行 URL
- `CI` 在确切目标 SHA 上绿色通过
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当运行需要性能分析时，保留 `.artifacts/vitest-shard-timings.json` 等 Vitest 计时工件

仅当发布需要确定性的普通 CI，而不需要 Docker、QA Lab、实时、跨 OS 或包测试盒时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 测试盒位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` 工作流运行。它通过打包的 Docker 环境验证候选发布，而不只是源码级测试。

发布 Docker 覆盖包括：

- 启用较慢 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，QR、root/gateway 和 installer/Bun 冒烟作业作为独立 install-smoke 分片运行
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时在 `plugins-runtime-services` 分块内包含 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载通道，范围从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 发布检查包含实时套件时的实时/E2E 提供商套件和 Docker 实时模型覆盖

重跑前先使用 Docker 工件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于定向恢复，请在可复用实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 测试盒也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行为和渠道级发布门禁，与 Vitest 和 Docker 包机制分离。

发布 QA Lab 覆盖包括：

- 使用 agentic 一致性包，对比 OpenAI 候选通道与 Opus 4.6 基线的 mock 一致性通道
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用这个测试盒回答“发布在 QA 场景和实时渠道流程中是否行为正确？”批准发布时，请保留一致性、Matrix 和 Telegram 通道的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键通道。

### 包

Package 测试盒是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支持。解析器会将候选项规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并保持工作流执行框架引用与包源引用分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或确切的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` 执行框架打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会使用 `source=artifact`、已准备好的发布包构件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行软件包验收。软件包验收会针对同一个已解析的 tarball，保留迁移、更新、已配置凭证的更新重启、实时 ClawHub 技能安装、过期插件依赖清理、离线插件 fixture、插件更新，以及 Telegram 软件包 QA。阻塞发布检查使用默认的最新已发布软件包基线；`run_release_soak=true` 或 `release_profile=full` 会扩展到从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，以及已报告问题的 fixture。对已经发布的候选版本使用带 `source=npm` 的软件包验收；在发布前，对有 SHA 支撑的本地 npm tarball 使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，用于替代此前需要 Parallels 的大多数软件包/更新覆盖。跨 OS 发布检查对于特定于 OS 的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用软件包验收。

更新和插件验证的规范检查清单是
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪条本地、Docker、软件包验收或发布检查通道可以证明插件安装/更新、Doctor 清理，或已发布软件包迁移变更时使用它。从每个稳定 `2026.4.23+` 软件包执行穷尽式已发布更新迁移，是单独的手动 `Update Migration` 工作流，不属于完整发布 CI。

旧版软件包验收宽容策略是有意限时的。到 `2026.4.25` 为止的软件包，可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、从 tarball 派生的 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 软件包可能会针对已经发布的本地构建元数据戳记文件发出警告。后续软件包必须满足现代软件包契约；相同缺口会导致发布验证失败。

当发布问题涉及实际可安装的软件包时，使用更广的软件包验收配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见软件包配置：

- `smoke`：快速软件包安装/频道/智能体、Gateway 网关网络和配置重载通道
- `package`：安装/更新/重启/插件软件包契约，以及实时 ClawHub 技能安装证明；这是发布检查默认值
- `product`：`package` 加上 MCP 频道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于软件包候选版本的 Telegram 证明，在软件包验收上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会把已解析的 `package-under-test` tarball 传入 Telegram 通道；独立 Telegram 工作流仍接受已发布的 npm spec，用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它会按发布需要的顺序编排可信发布者工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证标签可从 `main` 或 `release/*` 访问。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同范围和 SHA 分派 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

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

直接提升稳定版到 `latest` 需要显式指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用更底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定插件修复，将 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给 `OpenClaw Release Publish`；或者当不得发布 OpenClaw 软件包时，直接分派子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，这样工作流会复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受这些由操作员控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 软件包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，逗号分隔的 `@openclaw/*` 软件包名称
- `publish_openclaw_npm`：默认为 `true`；仅当把该工作流用作纯插件修复编排器时设为 `false`
- `wait_for_clawhub`：默认为 `false`，因此 npm 可用性不会被 ClawHub sidecar 阻塞；仅当工作流完成必须包括 ClawHub 完成时设为 `true`

`OpenClaw Release Checks` 接受这些由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。携带密钥的检查要求已解析提交可从 OpenClaw 分支或发布标签访问。
- `run_release_soak`：在稳定版/默认发布检查中选择加入穷尽式实时/E2E、Docker 发布路径，以及 all-since upgrade-survivor soak。它会被 `release_profile=full` 强制启用。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定 npm 发布流程

切稳定 npm 版本时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整的工作流分支提交 SHA，对预检工作流执行仅验证的试运行
2. 对常规 beta 优先流程选择 `npm_dist_tag=beta`；仅当你有意直接发布稳定版时才选择 `latest`
3. 当你希望从一个手动工作流获得常规 CI 加实时提示缓存、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，则在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先把外置插件发布到 npm 和 ClawHub，再提升 OpenClaw npm 软件包
7. 如果发布落在 `beta`，使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，把该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta` 应立即跟随同一个稳定构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或让其定时自修复同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍需要 `NPM_TOKEN`，而公共仓库保持仅使用 OIDC 发布。

这样可以让直接发布路径和 beta 优先提升路径都有文档记录，并且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，只能在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其保持在 tmux 内部，可以让提示、警报和 OTP 处理可观察，并避免重复的主机警报。

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

- [发布频道](/zh-CN/install/development-channels)
