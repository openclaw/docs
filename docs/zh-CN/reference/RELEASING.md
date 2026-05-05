---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作者检查清单、验证环境、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-05T05:04:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
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
- 不要为月份或日期补零
- `latest` 表示当前已提升的稳定版 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作者可以明确指定 `latest`，或稍后提升一个已审查的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，除非明确请求，否则 mac 应用的构建/签名/公证会保留到稳定版

## 发布节奏

- 发布先经过 beta
- 只有在最新 beta 验证通过后才会发布稳定版
- 维护者通常会从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并且需要修复，维护者会切下一个 `-beta.N` 标签，
  而不是删除或重新创建旧的 beta 标签
- 详细发布流程、审批、凭证和恢复说明仅限维护者查看

## 发布操作者检查清单

此检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在
仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够绿色，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交它，推送它，并在创建分支前再次 rebase/pull。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍被覆盖时才移除过期兼容性，
   否则记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 为目标标签提升每个必需位置的版本，运行
   `pnpm plugins:sync`，让可发布的插件包共享发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 运行 `OpenClaw NPM Release` 并设置 `preflight_only=true`。在标签存在之前，
   允许使用完整 40 字符的发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。
   这是四个大型发布测试盒子的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、工作流作业、包配置、
   提供商或模型允许列表。只有当变更表面使先前证据过时时，才重新运行完整总控验证。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。
   它会验证 `pnpm plugins:sync:check`，
   先将所有可发布的插件包发布到 npm，再将同一组作为 ClawPack npm-pack tarball 发布到 ClawHub，
   然后使用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检产物。发布后，针对已发布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切下一个匹配的预发布编号；不要删除或重写旧的预发布。
10. 对于稳定版，只有在已审查的 beta 或候选发布具备所需验证证据后才继续。
    稳定版 npm 发布同样通过
    `OpenClaw Release Publish`，并通过
    `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还要求 `main` 上有打包好的
    `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；当你需要发布后渠道证明时，可选择运行独立的已发布 npm Telegram E2E；
    在需要时进行 dist-tag 提升；基于完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布/预发布说明；
    并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，让测试 TypeScript 在更快的本地 `pnpm check` 门禁之外仍保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，让更广泛的导入循环和架构边界检查在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，让预期的 `dist/*` 发布产物和 Control UI 包存在，供打包验证步骤使用
- 在根版本升级后、打标签前运行 `pnpm plugins:sync`。它会更新可发布插件包版本、OpenClaw peer/API 兼容性元数据、构建元数据和插件 changelog 存根，使其匹配核心发布版本。`pnpm plugins:sync:check` 是非变更式发布守卫；如果忘记此步骤，发布工作流会在任何 registry 变更前失败。
- 在发布审批前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试箱。它接受分支、标签或完整提交 SHA，分派手动 `CI`，并分派 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram 通道。稳定版/默认运行会把详尽的 live/E2E 和 Docker 发布路径 soak 放在 `run_release_soak=true` 后面；`release_profile=full` 会强制开启 soak。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查生成的 `release-package-under-test` 产物运行包 Telegram E2E。发布后，如果同一个 Telegram E2E 也应验证已发布的 npm 包，请提供 `npm_telegram_package_spec`。发布后，如果 Package Acceptance 应针对已发布的 npm 包而不是 SHA 构建产物运行它的包/更新矩阵，请提供 `package_acceptance_package_spec`。如果私有证据报告应证明验证匹配某个已发布的 npm 包，但不强制运行 Telegram E2E，请提供 `evidence_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你想在发布工作继续时为包候选提供旁路证明，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；用 `source=ref` 将受信任的 `package_ref` 分支/标签/SHA 与当前 `workflow_ref` harness 一起打包；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当所选 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选，`published_upgrade_survivor_baseline` 选择已发布基线。`update-restart-auth` 将候选包同时用作已安装 CLI 和 package-under-test，因此会验证候选更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用配置档：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：无 OpenWebUI 或 live ClawHub 的产物原生包/更新/重启/插件通道
  - `product`：包配置档加上 MCP 渠道、cron/subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分派会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器验证 QA-lab，并校验导出的 trace span 名称、有界属性以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 每次带标签发布前运行 `pnpm release:check`
- 标签存在后，运行 `OpenClaw Release Publish` 执行会产生变更的发布序列。从 `release/YYYY.M.D`（或发布 main 可达标签时从 `main`）分派它，传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保留默认插件发布范围 `all-publishable`，除非你是在有意执行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会早于其外部化插件发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布审批前运行 QA Lab mock parity 通道，以及快速 live Matrix 配置档和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你想并行获得完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公共 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真实 npm 发布路径保持短小、确定且聚焦产物，而较慢的 live 检查保留在自己的通道中，避免拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 分派，或从 `main`/release 工作流 ref 分派，以确保工作流逻辑和密钥保持受控
- 只要解析出的提交可从 OpenClaw 分支或发布标签到达，`OpenClaw Release Checks` 就接受分支、标签或完整提交 SHA
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，无需已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只为包元数据检查合成 `v<package.json version>`；真实发布仍要求真实发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更式验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流 secret
- npm 发布预检不再等待单独的发布检查通道
- 审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/correction 标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/correction 版本），在全新的临时 prefix 中验证已发布 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  使用共享的租约 Telegram 凭证池，针对已发布 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 若要从维护者机器运行完整的发布后 beta 冒烟，使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证，分派 `NPM Telegram Beta E2E`，轮询精确工作流运行，下载产物，并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行相同的发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用“预检后提升”：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，出于安全考虑，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布
  - 公共 `macOS Release` 仅用于验证；当标签只存在于发布分支但工作流从 `main` 分派时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备的产物，而不是再次重新构建它们
- 对于 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器还会检查同一个临时 prefix 中从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的路径，确保发布修正不会静默地让旧的全局安装继续停留在基础稳定版 payload 上
- npm 发布预检会默认失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` payload，避免再次发布空的浏览器 dashboard
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装 registry 布局中。缺少插件运行时 payload 的发布会让 postpublish 验证器失败，且不能提升为 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布发布路径之前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件时序清单或插件测试矩阵，请在审批前重新生成并审核 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过期的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器表面：
  - GitHub 发布最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非 debug bundle id、非空 Sparkle feed URL，以及等于或高于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试箱

`Full Release Validation` 是操作者从一个入口点启动所有预发布测试的方式。对于快速移动分支上的固定提交证明，使用 helper，让每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支分派 `Full Release Validation` 并设置 `ref=<sha>`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这样可以避免意外证明较新的 `main` 子运行。

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

该 workflow 会解析目标 ref，分派带有 `target_ref=<release-ref>` 的手动 `CI`，分派 `OpenClaw Release Checks`，为面向包的检查准备父级 `release-package-under-test` artifact，并在 `release_profile=full` 且 `rerun_group=all` 或设置了 `npm_telegram_package_spec` 时分派独立的包 Telegram E2E。随后 `OpenClaw Release Checks` 会展开安装 smoke、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 均成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要包含每个子运行的最慢 job 表，因此发布经理无需下载日志即可查看当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、确切 workflow job 名称、stable 与 full profile 差异、artifact 以及聚焦 rerun 句柄。
子 workflow 会从运行 `Full Release Validation` 的可信 ref 分派，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation workflow-ref 输入；通过选择 workflow 运行 ref 来选择可信 harness。
不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 做精确提交证明；原始提交 SHA 不能作为 workflow dispatch ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖广度：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定 provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

当发布阻塞 lane 为绿色，并且你希望在 promotion 前运行详尽的 live/E2E、Docker 发布路径以及有界的已发布升级幸存者 sweep 时，请将 `run_release_soak=true` 与 `stable` 一起使用。该 sweep 覆盖最新四个稳定包，加上固定的 `2026.4.23` 和 `2026.5.2` baseline，以及较旧的 `2026.4.15` 覆盖；会移除重复 baseline，并将每个 baseline 分片到各自的 Docker runner job 中。`full` 隐含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用可信 workflow ref 将目标 ref 解析一次为 `release-package-under-test`，并在 soak 运行时在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该 artifact。这让所有面向包的 box 使用相同字节，并避免重复构建包。跨 OS OpenAI 安装 smoke 在设置了 repo/org 变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该 lane 验证的是包安装、新手引导、Gateway 网关启动以及一个 live agent 回合，而不是 benchmark 最慢的默认模型。更广泛的 live provider 矩阵仍然是模型特定覆盖的位置。

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

不要把完整 umbrella 作为聚焦修复后的第一次 rerun。如果一个 box 失败，请使用失败的子 workflow、job、Docker lane、包 profile、模型提供商或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或使先前的 all-box 证据过期时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查记录的子 workflow run id，因此在子 workflow 成功 rerun 后，只需 rerun 失败的 `Verify full validation` 父 job。

对于有界恢复，请将 `rerun_group` 传给 umbrella。`all` 是真正的发布候选运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布用的插件子项，`release-checks` 运行每个发布 box，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦的 `npm-telegram` rerun 需要 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行使用 release-checks 包 artifact。聚焦的跨 OS rerun 可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/suite 过滤器。QA release-check 失败属于 advisory；仅 QA 失败不会阻塞发布验证。

### Vitest

Vitest box 是手动 `CI` 子 workflow。手动 CI 会有意绕过 changed scoping，并为发布候选强制运行普通测试图：Linux Node 分片、内置插件分片、channel contract、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n。

使用这个 box 回答“源代码树是否通过了完整普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已分派的 `CI` 运行 URL
- `CI` 在确切目标 SHA 上为绿色
- 调查回归时来自 CI job 的失败或较慢分片名称
- 当运行需要性能分析时，保留 `.artifacts/vitest-shard-timings.json` 等 Vitest 计时 artifact

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、live、跨 OS 或包 box 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的 `install-smoke` workflow 运行。它通过打包的 Docker 环境验证发布候选，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装 smoke 的完整安装 smoke
- 按目标 SHA 准备/复用根 Dockerfile smoke 镜像，并将 QR、root/gateway 和 installer/Bun smoke job 作为独立的 install-smoke 分片运行
- 仓库 E2E lane
- 发布路径 Docker chunk：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，在 `plugins-runtime-services` chunk 内覆盖 OpenWebUI
- 拆分的内置插件安装/卸载 lane，从 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live suite 时，覆盖 live/E2E provider suite 和 Docker live 模型

rerun 前先使用 Docker artifact。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和 rerun 命令。对于聚焦恢复，请在可复用 live/E2E workflow 上使用 `docker_lanes=<lane[,lane]>`，而不是 rerun 所有发布 chunk。生成的 rerun 命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane 可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行为和 channel 级发布门禁，独立于 Vitest 和 Docker 包机制。

发布 QA Lab 覆盖包括：

- mock parity lane，使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6 baseline 比较
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭据租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用这个 box 回答“该发布在 QA 场景和 live channel 流程中的行为是否正确？”批准发布时，请保留 parity、Matrix 和 Telegram lane 的 artifact URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行提供，而不是默认发布关键 lane。

### 包

包 box 是可安装产品门禁。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选归一化为 Docker E2E 使用的 `package-under-test` tarball，验证包 inventory，记录包版本和 SHA-256，并保持 workflow harness ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或确切的 OpenClaw 发布版本
- `source=ref`：使用选定的 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布包 artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一个已解析 tarball 保持迁移、更新、已配置 auth 的更新重启、陈旧插件依赖清理、离线插件 fixture、插件更新和 Telegram 包 QA。阻塞发布检查使用默认的最新已发布包 baseline；`run_release_soak=true` 或 `release_profile=full` 会扩展为从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布 baseline 加上已报告 issue 的 fixture。对于已发货的候选，使用带 `source=npm` 的 Package Acceptance；对于发布前由 SHA 支撑的本地 npm tarball，使用 `source=ref`/`source=artifact`。它是 GitHub 原生的替代方案，可替代过去大多数需要 Parallels 的包/更新覆盖。跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、doctor 清理或已发布包迁移更改时，请使用它。针对每个稳定 `2026.4.23+` 包的详尽已发布更新迁移是一个单独的手动 `Update Migration` workflow，不属于完整发布 CI。

旧版 package-acceptance 宽限有意设置了时间限制。截至 `2026.4.25` 的软件包可针对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺失的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 软件包可能会针对已经发布的本地构建元数据戳文件发出警告。后续软件包必须满足现代软件包契约；相同缺口会导致发布验证失败。

当发布问题涉及实际可安装的软件包时，使用更广的 Package Acceptance 配置档：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见软件包配置档：

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：不依赖实时 ClawHub 的安装/更新/重启/插件软件包契约；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于软件包候选版本的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。该工作流会将解析出的 `package-under-test` tarball 传入 Telegram 通道；独立的 Telegram 工作流仍接受已发布的 npm 规格用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是常规的可变更发布入口点。它会按发布所需顺序编排 trusted-publisher 工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 调度 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。

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

稳定版直接提升到 `latest` 需要显式执行：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用较低层级的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定插件修复，请向 `OpenClaw Release Publish` 传入 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或在 OpenClaw 软件包不得发布时直接调度子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作者控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，使工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受以下由操作者控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 软件包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时的逗号分隔 `@openclaw/*` 软件包名称
- `publish_openclaw_npm`：默认为 `true`；仅当将工作流用作仅插件修复编排器时设置为 `false`

`OpenClaw Release Checks` 接受以下由操作者控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查上选择加入详尽的实时/E2E、Docker 发布路径，以及所有历史版本升级幸存 soak。它会由 `release_profile=full` 强制开启。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有当 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定版 npm 发布顺序

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整工作流分支提交 SHA，对预检工作流进行仅验证 dry run
2. 对常规先 beta 流程选择 `npm_dist_tag=beta`，或仅在你有意直接发布稳定版时选择 `latest`
3. 当你希望从一个手动工作流获得常规 CI 加上实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同 `tag`、相同 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外置插件发布到 npm 和 ClawHub，再提升 OpenClaw npm 软件包
7. 如果发布落在 `beta`，使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，且 `beta` 应立即跟随同一稳定构建，请使用同一私有工作流将两个 dist-tag 都指向稳定版本，或让其定时自修复同步稍后移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布。

这使直接发布路径和先 beta 后提升路径都保持有文档记录并对操作者可见。

如果维护者必须回退到本地 npm 认证，请只在专用 tmux 会话中运行任何 1Password CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将其保留在 tmux 内可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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
