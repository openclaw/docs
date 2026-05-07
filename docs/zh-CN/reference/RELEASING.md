---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或包验收
    - 查找版本命名和发布节奏
    - 规划月度支持或 LTS 发布线
summary: 发布通道、操作员检查清单、验证环境、版本命名、计划的月度支持线和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-07T01:53:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 旧版 stable 修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要给月份或日期补零
- `latest` 表示当前已提升的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- stable 和旧版修正发布版本默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或之后提升一个已验证的 beta 构建
- 每个 stable OpenClaw 发布版本都会同时发布 npm 包和 macOS 应用；
  beta 发布版本通常会先验证并发布 npm/包路径，mac 应用的构建/签名/公证留给 stable，除非明确请求

### 计划中的月度支持版本控制

OpenClaw 还没有 LTS 或月度支持渠道。维护者正在朝兼容 SemVer 的月度支持线推进，但今天已发布的更新渠道仍然是 `stable`、`beta` 和 `dev`。

计划的版本形态是 `YYYY.M.PATCH`：

- `YYYY` 是年份。
- `M` 是月度发布线，不带前导零。
- `PATCH` 在该月度线内递增，并且可以按需增长到任意高度。

例如，`2026.6.0`、`2026.6.1` 和 `2026.6.2` 都会属于 2026 年 6 月线。未来的月度支持 dist-tag，例如 `stable-2026-6` 或 `lts-2026-6`，可能指向该线，而 `latest` 会继续快速移动。

这个未来模型会取代新增 `YYYY.M.D-N` 修正发布版本的需求。现有旧版修正版本仍会被识别，以便旧包和升级路径继续工作。

## 发布节奏

- 发布按 beta 优先推进
- stable 只会在最新 beta 验证完成后跟进
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布版本，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已推送或发布并且需要修复，维护者会切出下一个 `-beta.N` 标签，而不是删除或重新创建旧 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作员清单

此清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认当前 `main` CI 足够绿色，可以从它创建分支。
2. 使用 `/changelog` 从真实提交历史重写顶部 `CHANGELOG.md` 章节，保持条目面向用户，提交并推送，然后在创建分支前再次 rebase/pull。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。仅在升级路径仍有覆盖时移除已过期兼容性，否则记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为目标标签更新所有必需的版本位置，运行
   `pnpm plugins:sync`，让可发布插件包共享发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 运行带有 `preflight_only=true` 的 `OpenClaw NPM Release`。在标签存在之前，允许使用完整的 40 字符发布分支 SHA 做仅验证预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，用 `Full Release Validation` 启动所有预发布测试。这是四个大型发布测试盒子的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、workflow job、包配置文件、提供商或模型 allowlist。只有当变更表面使先前证据过期时，才重新运行完整总括流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，并行分发所有可发布插件包到 npm 和同一组到 ClawHub，然后在插件 npm 发布成功后，立即使用匹配的 dist-tag 提升准备好的 OpenClaw npm 预检产物。OpenClaw npm 发布时，ClawHub 发布可能仍在运行，但 release publish workflow 只有在两个插件发布路径和 OpenClaw npm 发布路径都成功完成后才会结束。发布后，针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布版本需要修复，切出下一个匹配的预发布编号；不要删除或重写旧预发布版本。
10. 对于 stable，只有在已验证的 beta 或候选发布版本具备所需验证证据后才继续。stable npm 发布也通过 `OpenClaw Release Publish`，并通过 `preflight_run_id` 复用成功的预检产物；stable macOS 发布就绪还要求 `main` 上有打包后的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；当你需要发布后渠道证明时，可选择运行独立的 published-npm Telegram E2E；按需执行 dist-tag 提升；根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub release/prerelease 说明；并完成发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，确保测试 TypeScript 仍在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布预检前运行 `pnpm check:architecture`，确保更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，确保预期的 `dist/*` 发布产物和 Control UI 包存在，以供打包验证步骤使用
- 在根版本号提升之后、打标签之前运行 `pnpm plugins:sync`。它会更新可发布的插件包版本、OpenClaw peer/API 兼容性元数据、构建元数据和插件变更日志存根，使其匹配核心发布版本。`pnpm plugins:sync:check` 是非修改性的发布守卫；如果忘记此步骤，发布工作流会在任何注册表修改之前失败。
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并分发 `OpenClaw Release Checks`，覆盖安装烟测、包验收、跨 OS 包检查、QA Lab 对等性、Matrix 和 Telegram 通道。稳定版/默认运行会将详尽的 live/E2E 和 Docker 发布路径浸泡测试放在 `run_release_soak=true` 之后；`release_profile=full` 会强制开启浸泡测试。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对来自发布检查的 `release-package-under-test` 产物运行包 Telegram E2E。发布后提供 `npm_telegram_package_spec`，当同一个 Telegram E2E 也应证明已发布的 npm 包时使用。发布后提供 `package_acceptance_package_spec`，当 Package Acceptance 应针对已发出的 npm 包而不是 SHA 构建产物运行其包/更新矩阵时使用。提供 `evidence_package_spec`，当私有证据报告应证明验证匹配已发布的 npm 包但不强制运行 Telegram E2E 时使用。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时为包候选版本提供旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包受信任的 `package_ref` 分支/标签/SHA；对需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当选定的 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选版本，而 `published_upgrade_survivor_baseline` 选择已发布的基线。`update-restart-auth` 会把候选包同时用作已安装 CLI 和 package-under-test，因此它会演练候选更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常见配置档：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：不含 OpenWebUI 或 live ClawHub 的产物原生包/更新/重启/插件通道
  - `product`：包配置档加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建烟测、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器演练 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 每次打标签发布前运行 `pnpm release:check`
- 标签存在后运行 `OpenClaw Release Publish`，执行会产生修改的发布序列。从 `release/YYYY.M.D` 分发它（或在发布 main 可达标签时从 `main` 分发），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保留默认插件发布范围 `all-publishable`，除非你是在有意执行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会在其外置插件之前发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock 对等性通道，以及快速 live Matrix 配置档和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 也使用 Convex CI 凭证租约。当你想并行获取完整 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真实 npm 发布路径保持简短、确定且专注于产物，而较慢的 live 检查留在自己的通道中，避免拖慢或阻塞发布
- 携带密钥的发布检查应通过 `Full Release
Validation` 分发，或从 `main`/发布工作流 ref 分发，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，无需已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都会把真实发布和提升路径保留在 GitHub 托管 runner 上，而非修改性的验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正版标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版版本），以在全新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭证池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 若要从维护者机器运行完整发布后 beta 烟测，请使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证，分发 `NPM Telegram Beta E2E`，轮询精确工作流运行，下载产物，并打印 Telegram 报告。
- 维护者也可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行同一个发布后检查。它有意仅限手动，不会在每次合并时运行。
- 维护者发布自动化现在使用预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可通过工作流输入显式指向 `latest`
  - 基于令牌的 npm dist-tag 修改现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，这是出于安全原因，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支但工作流从 `main` 分发时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于像 `YYYY.M.D-N` 这样的旧版稳定修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，确保发布修正不会静默地让较旧的全局安装停留在基础稳定负载上
- npm 发布预检默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，这样我们就不会再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布注册表布局中是否存在已发布插件入口点和包元数据。如果某个发布缺少插件运行时负载，postpublish 验证器会失败，并且该发布不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 能在发布发布路径之前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件计时清单或插件测试矩阵，请在批准前重新生成并审查由规划器拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过期的 CI 布局
- 稳定版 macOS 发布就绪状态还包括更新器表面：
  - GitHub release 最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保留非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。对于快速移动分支上的固定提交证明，请使用该 helper，使每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支分发带 `ref=<sha>` 的 `Full Release Validation`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这避免了意外证明更新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流 ref 运行它，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，调度带有
`target_ref=<release-ref>` 的手动 `CI`，调度 `OpenClaw Release Checks`，为面向包的检查准备一个父级 `release-package-under-test` 工件，并且在 `release_profile=full` 且
`rerun_group=all` 时，或在设置了 `npm_telegram_package_spec` 时，调度独立的包 Telegram E2E。随后，`OpenClaw Release
Checks` 会展开安装冒烟、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带有 Telegram 包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当
`Full Release Validation`
摘要显示 `normal_ci` 和 `release_checks` 成功时，完整运行才可接受。在 full/all 模式下，
`npm_telegram` 子项也必须成功；在 full/all 之外会跳过它，除非提供了已发布的 `npm_telegram_package_spec`。最终验证器摘要会包含每个子运行的最慢作业表，因此发布经理无需下载日志也能看到当前关键路径。
完整阶段矩阵、精确的工作流作业名称、stable 与 full profile 差异、工件以及聚焦 rerun handle，请参见[完整发布验证](/zh-CN/reference/full-release-validation)。
子工作流会从运行 `Full Release
Validation` 的受信任 ref 调度，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation
workflow-ref 输入；通过选择工作流运行 ref 来选择受信任的 harness。
不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 来证明精确提交；
原始提交 SHA 不能作为 workflow dispatch ref，因此请使用
`pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖广度：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定 provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

当发布阻塞 lane 已经为绿色，并且你希望在提升前进行详尽的 live/E2E、Docker 发布路径以及有界的已发布 upgrade-survivor 扫描时，请将 `run_release_soak=true` 与 `stable` 一起使用。该扫描覆盖最新四个稳定包，加上固定的 `2026.4.23` 和 `2026.5.2`
基线，以及较旧的 `2026.4.15` 覆盖；会移除重复基线，并将每个基线分片到自己的 Docker runner 作业中。`full` 隐含
`run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将目标
ref 一次性解析为 `release-package-under-test`，并在 soak 运行时，在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该工件。这样所有面向包的机器都会使用相同字节，并避免重复构建包。
跨 OS OpenAI 安装冒烟会在 repo/org 变量已设置时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为这条 lane 证明的是包安装、新手引导、Gateway 网关启动和一次 live agent 轮次，而不是对最慢默认模型做基准测试。更广泛的 live provider
矩阵仍然是提供模型特定覆盖的地方。

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

不要把完整 umbrella 作为聚焦修复后的第一次 rerun。如果某个 box
失败，请使用失败的子工作流、作业、Docker lane、包 profile、模型
provider 或 QA lane 进行下一次证明。只有当修复更改了共享发布编排，或使先前的 all-box 证据过期时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查记录的子工作流运行 id，因此在子工作流成功 rerun 后，只需 rerun 失败的
`Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传给 umbrella。`all` 是真正的发布候选运行，`ci` 只运行普通 CI 子项，`plugin-prerelease`
只运行仅发布用的插件子项，`release-checks` 运行每个发布
box，更窄的发布组是 `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` rerun 需要 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行会使用 release-checks 包工件。聚焦的跨 OS rerun 可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/suite 过滤器。QA release-check 失败是 advisory；仅 QA 失败不会阻塞发布验证。

### Vitest

Vitest box 是手动 `CI` 子工作流。手动 CI 会有意绕过 changed scoping，并为发布候选强制运行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22
兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python
skills、Windows、macOS、Android 和 Control UI i18n。

使用这个 box 回答“源代码树是否通过了完整的普通测试套件？”
它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已调度的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上为绿色
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当运行需要性能分析时，保留 Vitest timing 工件，例如 `.artifacts/vitest-shard-timings.json`

只有当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或包 box 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及 release-mode
`install-smoke` 工作流运行。它通过打包后的 Docker 环境验证发布候选，而不只是进行源码级测试。

发布 Docker 覆盖包括：

- 启用较慢 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，其中 QR、
  root/gateway 和 installer/Bun 冒烟作业会作为单独的 install-smoke
  分片运行
- 仓库 E2E lane
- 发布路径 Docker chunk：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，在 `plugins-runtime-services` chunk 内的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lane
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live suite 时，包含 live/E2E provider suite 和 Docker live 模型覆盖

rerun 前先使用 Docker 工件。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、
阶段耗时、调度器计划 JSON 和 rerun 命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是 rerun 所有发布 chunk。生成的 rerun 命令会在可用时包含先前的
`package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane
可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic
行为和渠道级发布 gate，与 Vitest 和 Docker
包机制分离。

发布 QA Lab 覆盖包括：

- mock parity lane，使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6
  基线进行比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭据租约的 live Telegram QA lane
- 当发布 telemetry 需要明确的本地证明时，运行 `pnpm qa:otel:smoke`

使用这个 box 回答“发布版在 QA 场景和 live 渠道流程中行为是否正确？”
批准发布时，请保留 parity、Matrix 和 Telegram
lane 的工件 URL。完整 Matrix 覆盖仍然可以作为手动分片 QA-Lab 运行使用，而不是默认的发布关键 lane。

### 包

Package box 是可安装产品 gate。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支持。解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并保持工作流 harness ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布包工件、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会让迁移、更新、已配置认证的更新重启、过时插件依赖清理、离线插件 fixture、插件更新和 Telegram 包 QA 都针对同一个已解析的
tarball。阻塞发布检查使用默认的最新已发布包基线；`run_release_soak=true` 或
`release_profile=full` 会扩展到从
`2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，以及已报告问题的 fixture。对于已经交付的候选，请使用带 `source=npm` 的
Package Acceptance；对于发布前带 SHA 依据的本地 npm tarball，请使用 `source=ref`/`source=artifact`。它是 GitHub 原生方案，可替代过去大多数需要
Parallels 的包/更新覆盖。跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范检查清单是
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在判断哪条本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、Doctor 清理或已发布包迁移变更时，请使用它。
从每个稳定 `2026.4.23+` 包进行的详尽已发布更新迁移，是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽容策略被有意限定了时间范围。直到 `2026.4.25` 的包可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、由 tarball 派生的 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会对已经随包发布的本地构建元数据戳文件发出警告。之后的包必须满足现代包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装的包时，请使用更宽的 Package Acceptance 配置档案：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包配置档案：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：安装/更新/重启/插件包契约，不包含实时 ClawHub；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于包候选版 Telegram 验证，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将解析后的 `package-under-test` tarball 传入 Telegram 通道；独立 Telegram 工作流仍接受已发布的 npm 规格用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是常规的可变更发布入口点。它按发布所需顺序编排可信发布者工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 分派 `Plugin ClawHub Release`。
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

稳定版直接提升到 `latest` 需要显式指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用较底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定的插件修复，请将 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给 `OpenClaw Release Publish`，或者在不得发布 OpenClaw 包时直接分派子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作者控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必填，使工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受以下由操作者控制的输入：

- `tag`：必填发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必填
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，为逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认为 `true`；仅在将该工作流用作插件专用修复编排器时设置为 `false`

`OpenClaw Release Checks` 接受以下由操作者控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查上选择加入详尽的实时/E2E、Docker 发布路径和 all-since upgrade-survivor soak。`release_profile=full` 会强制启用它。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定版 npm 发布流程

发布稳定版 npm 版本时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整工作流分支提交 SHA，对预检工作流执行仅验证的空运行
2. 对于常规 beta 优先流程选择 `npm_dist_tag=beta`，或者仅在你有意直接发布稳定版时选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加实时提示缓存、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外部化插件发布到 npm 和 ClawHub，然后再提升 OpenClaw npm 包
7. 如果发布落在 `beta` 上，请使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta` 应立即跟随同一稳定构建，请使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或者让它的定时自修复同步稍后移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍需要 `NPM_TOKEN`，而公共仓库保持仅使用 OIDC 发布。

这让直接发布路径和 beta 优先提升路径都得到文档化，并且对操作者可见。

如果维护者必须回退到本地 npm 认证，请只在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将其保留在 tmux 内可让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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

维护者使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际运行手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
