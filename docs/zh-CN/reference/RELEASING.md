---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-05T01:33:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升的稳定版 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升经过验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，而 mac 应用构建/签名/公证保留给稳定版，除非明确请求

## 发布节奏

- 发布先进入 beta
- 只有在最新 beta 验证通过后，才会进入稳定版
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布并需要修复，维护者会切出下一个 `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚详情保留在
仅限维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` 的 CI 状态足够健康，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送它，然后在创建分支前再次 rebase/pull。
3. 检查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有当升级路径仍被覆盖时才移除过期兼容性，
   或记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为预期标签更新每个必需的版本位置，运行
   `pnpm plugins:sync`，使可发布的插件包共享发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整 40 字符的发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，使用 `Full Release Validation` 启动所有预发布测试。这是四个大型发布测试盒子的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、工作流作业、包配置、提供商或模型允许列表。只有当变更范围使先前证据失效时，才重新运行完整总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，
   先将所有可发布的插件包发布到 npm，再将同一组以 ClawPack npm-pack tarball 的形式发布到 ClawHub，
   然后使用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检产物。发布后，针对已发布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切出下一个匹配的预发布编号；不要删除或重写旧的预发布。
10. 对于稳定版，只有在已验证的 beta 或候选发布具备所需验证证据后才继续。
    稳定版 npm 发布也通过
    `OpenClaw Release Publish`，并通过
    `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还需要 `main` 上的
    打包 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器，在需要发布后渠道证明时运行可选的独立已发布 npm Telegram E2E，
    在需要时进行 dist-tag 提升，根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布/预发布说明，
    并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 会在更快的本地 `pnpm check` 门禁之外继续被覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，这样预期的 `dist/*` 发布产物和 Control UI 包会存在，可供打包验证步骤使用
- 在根版本号提升后、打标签前运行 `pnpm plugins:sync`。它会更新可发布插件包版本、OpenClaw peer/API 兼容性元数据、构建元数据和插件 changelog 存根，使其匹配核心发布版本。`pnpm plugins:sync:check` 是非变更型发布保护检查；如果忘记了此步骤，发布工作流会在任何注册表变更前失败。
- 在发布批准前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，分发手动 `CI`，并为安装冒烟、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram lane 分发 `OpenClaw Release Checks`。稳定版/默认运行会将详尽的 live/E2E 和 Docker 发布路径 soak 保持在 `run_release_soak=true` 之后；`release_profile=full` 会强制启用 soak。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对来自发布检查的 `release-package-under-test` 产物运行包 Telegram E2E。发布后，如果同一个 Telegram E2E 也应验证已发布的 npm 包，请提供 `npm_telegram_package_spec`。发布后，如果 Package Acceptance 应针对已发布的 npm 包而不是按 SHA 构建的产物运行其包/更新矩阵，请提供 `package_acceptance_package_spec`。当私有证据报告应证明验证匹配已发布的 npm 包但不强制运行 Telegram E2E 时，请提供 `evidence_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为包候选版本获取旁路证明，请运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可通过 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当所选 Docker lane 包含 `published-upgrade-survivor` 时，包产物就是候选版本，`published_upgrade_survivor_baseline` 会选择已发布的基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常见配置档：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载 lane
  - `package`：无需 OpenWebUI 或 live ClawHub 的产物原生包/更新/插件 lane
  - `product`：包配置档加上 MCP 渠道、cron/subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分发会绕过 changed 作用域并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n lane。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP receiver 演练 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部 collector。
- 每次打标签发布前运行 `pnpm release:check`
- 标签存在后，运行 `OpenClaw Release Publish` 执行会产生变更的发布序列。从 `release/YYYY.M.D` 分发它（或在发布 main 可达标签时从 `main` 分发），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保留默认插件发布范围 `all-publishable`，除非你在有意执行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会早于其外置插件发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity lane，以及快速 live Matrix 配置档和 Telegram QA lane。live lane 使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你希望并行获取完整 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 此拆分是有意的：保持真实 npm 发布路径简短、确定且聚焦产物，同时将较慢的 live 检查保留在自己的 lane 中，避免它们拖慢或阻塞发布
- 带 secret 的发布检查应通过 `Full Release Validation` 分发，或从 `main`/release workflow ref 分发，这样工作流逻辑和 secret 都保持受控
- 只要解析出的提交可从 OpenClaw 分支或发布标签到达，`OpenClaw Release Checks` 就接受分支、标签或完整提交 SHA
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符 workflow-branch 提交 SHA，无需已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实发布标签
- 两个工作流都会把真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更型验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流 secret
- npm 发布预检不再等待单独的发布检查 lane
- 在批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/correction 标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/correction 版本），以在全新的临时 prefix 中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭证池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 若要从维护者机器运行完整的发布后 beta 冒烟，请使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证，分发 `NPM Telegram Beta E2E`，轮询精确工作流运行，下载产物并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，在 GitHub Actions 中运行同一发布后检查。它有意仅手动运行，不会在每次 merge 时运行。
- 维护者发布自动化现在使用先预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以确保安全，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签仅存在于 release 分支上但工作流从 `main` 分发时，请设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于像 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时 prefix 升级路径，确保发布修正不会静默地让较旧的全局安装停留在基础稳定版 payload 上
- 除非 tarball 同时包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` payload，否则 npm 发布预检会封闭失败，避免我们再次发布空的浏览器 dashboard
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装注册表布局中。缺少插件运行时 payload 的发布会导致 postpublish verifier 失败，且不能提升为 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 执行 npm pack `unpackedSize` 预算限制，因此安装器 e2e 会在发布发布路径前捕获意外的打包膨胀
- 如果发布工作触及 CI planning、插件 timing manifest 或插件测试矩阵，请在批准前重新生成并审查由 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪状态还包括 updater surface：
  - GitHub release 最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的 app 必须保留非 debug bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作者从一个入口点启动所有预发布测试的方式。若要在快速变动分支上获得固定提交证明，请使用 helper，让每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支分发 `Full Release Validation` 并传入 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这可以避免意外证明更新的 `main` 子运行。

对于 release 分支或标签验证，请从可信的 `main` workflow ref 运行，并将 release 分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，调度手动 `CI` 并设置
`target_ref=<release-ref>`，调度 `OpenClaw Release Checks`，为面向包的检查准备一个父级 `release-package-under-test` 工件，并在 `release_profile=full` 且
`rerun_group=all` 时，或在设置了 `npm_telegram_package_spec` 时，调度独立的包 Telegram E2E。随后，`OpenClaw Release
Checks` 会展开安装冒烟、跨 OS 发布检查、启用 soak 时的 live/E2E Docker
发布路径覆盖、带有 Telegram
包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当
`Full Release Validation`
摘要显示 `normal_ci` 和 `release_checks` 均成功时，完整运行才可接受。在 full/all 模式下，
`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要会为每个子运行包含最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确的工作流作业名称、stable 与 full profile 的差异、工件以及聚焦重跑句柄。
子工作流会从运行 `Full Release
Validation` 的受信任 ref 调度，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation
workflow-ref 输入；通过选择工作流运行 ref 来选择受信任 harness。
不要使用 `--ref main -f ref=<sha>` 为移动中的 `main` 提供精确提交证明；
原始提交 SHA 不能作为工作流调度 ref，因此请使用
`pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖广度：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定 provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

当发布阻塞 lane 为绿色，并且你希望在推广前执行详尽的 live/E2E、Docker 发布路径以及
all-since-2026.4.23 upgrade-survivor 扫描时，请将 `run_release_soak=true` 与 `stable` 一起使用。`full` 隐含
`run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任 workflow ref 将目标
ref 一次性解析为 `release-package-under-test`，并在 soak 运行时在 cross-OS、
Package Acceptance 和 release-path Docker 检查中复用该工件。这样能让所有面向包的 box 使用相同字节，并避免重复构建包。
当 repo/org 变量已设置时，cross-OS OpenAI 安装冒烟会使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用
`openai/gpt-5.4`，因为此 lane 要证明的是包安装、新手引导、Gateway 网关启动以及一次 live agent 回合，而不是对最慢的默认模型进行基准测试。更广泛的 live provider
矩阵仍然是执行模型特定覆盖的位置。

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

不要把完整 umbrella 用作聚焦修复后的第一次重跑。如果某个 box 失败，请使用失败的子工作流、作业、Docker lane、包 profile、模型提供商或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或让先前的 all-box 证据过期时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查已记录的子工作流运行 ID，因此在子工作流成功重跑后，只需重跑失败的
`Verify full validation` 父作业。

对于有界恢复，请将 `rerun_group` 传给 umbrella。`all` 是真正的发布候选运行，`ci` 只运行 normal CI 子项，`plugin-prerelease`
只运行仅发布用插件子项，`release-checks` 运行每个发布
box，更窄的发布组为 `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行会使用 release-checks 包工件。聚焦
cross-OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或另一个 OS/suite 过滤器。QA release-check 失败属于 advisory；仅 QA 失败不会阻塞发布验证。

### Vitest

Vitest box 是手动 `CI` 子工作流。手动 CI 会有意绕过 changed scoping，并为发布候选强制执行 normal 测试图：Linux Node 分片、内置插件分片、channel contracts、Node 22
兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python
Skills、Windows、macOS、Android 和 Control UI i18n。

使用此 box 回答“源代码树是否通过了完整 normal 测试套件？”它不同于 release-path 产品验证。需要保留的证据：

- 显示已调度 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色的 `CI` 运行
- 调查回归时来自 CI 作业的失败或慢速分片名称
- 当运行需要性能分析时，保留 Vitest timing 工件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的 normal CI，而不需要 Docker、QA Lab、live、cross-OS 或 package box 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及 release-mode
`install-smoke` 工作流实现。它通过打包的 Docker 环境验证发布候选，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并将 QR、
  root/gateway 和 installer/Bun 冒烟作业作为独立 install-smoke
  分片运行
- 仓库 E2E lanes
- release-path Docker 分块：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，`plugins-runtime-services` 分块中的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lanes：
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 当 release checks 包含 live suites 时，覆盖 live/E2E provider suites 和 Docker live 模型

重跑前先使用 Docker 工件。release-path 调度器会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、
阶段耗时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的
`package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败 lane 可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic
行为和 channel 级发布门禁，与 Vitest 和 Docker
包机制分开。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6
  基线进行比较的 mock parity lane
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭据租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用此 box 回答“发布在 QA 场景和 live channel flows 中行为是否正确？”批准发布时，请保留 parity、Matrix 和 Telegram
lane 的工件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行，而不是默认的发布关键 lane。

### 包

Package box 是可安装产品门禁。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支撑。该解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并让工作流 harness ref 与包源 ref 保持分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 运行 Package Acceptance，并使用 `source=artifact`、已准备的发布包工件、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、
`telegram_mode=mock-openai`。Package Acceptance 会让迁移、更新、过时插件依赖清理、离线插件 fixtures、插件更新和 Telegram
包 QA 都针对同一个已解析 tarball 运行。阻塞发布检查使用默认的最新已发布包基线；`run_release_soak=true` 或
`release_profile=full` 会扩展到从
`2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，以及已报告问题的 fixtures。对已经发布的候选使用
Package Acceptance 且 `source=npm`；对发布前由 SHA 支撑的本地 npm tarball 使用 `source=ref`/`source=artifact`。它是大多数此前需要
Parallels 的 package/update 覆盖的 GitHub 原生替代方案。Cross-OS release checks 对 OS 特定新手引导、安装器和平台行为仍然重要，但 package/update 产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、Doctor 清理或已发布包迁移变更时，请使用它。
从每个稳定 `2026.4.23+` 包执行详尽的已发布更新迁移是一个单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽松策略有意设置了时间限制。截至
`2026.4.25` 的包可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的
`gateway install --wrapper`、tarball 派生 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件 install-record
位置、缺失的 marketplace install-record 持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会对已经发出的本地构建元数据戳文件发出警告。后续包必须满足现代包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，请使用更广泛的 Package Acceptance profile：

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

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置
  重载通道
- `package`：不依赖实时 ClawHub 的安装/更新/插件包契约；这是发布检查的
  默认值
- `product`：`package` 加上 MCP 渠道、cron/子智能体清理、OpenAI Web
  搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

如需包候选版本的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该 workflow 会把解析出的
`package-under-test` tarball 传入 Telegram 通道；独立的
Telegram workflow 仍接受已发布的 npm 规格，用于发布后检查。

## 发布发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它会按发布所需顺序
编排受信发布者 workflow：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 调度 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和
   已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。

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

仅在聚焦修复或重新发布工作中使用更底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflow。对于选定插件修复，将
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`；如果不得发布 OpenClaw 包，则直接调度子 workflow。

## NPM workflow 输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前
  完整 40 字符 workflow 分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：真实发布路径必填，用于让 workflow 复用
  成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受以下由操作员控制的输入：

- `tag`：必填发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；
  当 `publish_openclaw_npm=true` 时必填
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在聚焦修复工作中
  使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时使用的逗号分隔
  `@openclaw/*` 包名
- `publish_openclaw_npm`：默认为 `true`；仅当把该 workflow 用作
  仅插件修复编排器时设置为 `false`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求
  解析出的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查中选择加入穷尽式实时/E2E、Docker 发布路径和
  所有历史版本升级幸存 soak。它会被 `release_profile=full` 强制启用。

规则：

- 稳定版和修正版标签可发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时
  才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终
  仅用于验证
- 真实发布路径必须使用预检期间使用的相同 `npm_dist_tag`；
  workflow 会在发布继续前验证该元数据

## 稳定版 npm 发布顺序

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整 workflow 分支提交
     SHA 对预检 workflow 做一次仅验证试运行
2. 对常规先 beta 流程选择 `npm_dist_tag=beta`，或仅在你有意直接发布稳定版时
   选择 `latest`
3. 当你希望用一个手动 workflow 获取常规 CI 加实时提示缓存、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整
   提交 SHA 上运行 `Full Release Validation`
4. 如果你确实只需要确定性的常规测试图，请改为在发布 ref 上运行
   手动 `CI` workflow
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`
   和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先把外置插件发布到 npm
   和 ClawHub，然后再提升 OpenClaw npm 包
7. 如果发布落在 `beta`，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow 将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta`
   应立即跟随同一稳定构建，请使用同一私有
   workflow 将两个 dist-tag 都指向该稳定版本，或让其定时
   自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这让直接发布路径和先 beta 后提升路径都保持
有文档记录且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password
CLI (`op`) 命令。不要直接从主智能体 shell 调用 `op`；把它放在 tmux 内可以让提示、
告警和 OTP 处理可观察，并防止重复的主机告警。

## 公共参考

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
