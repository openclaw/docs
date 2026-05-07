---
read_when:
    - 正在查找公共发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-07T15:09:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：默认发布到 npm `beta` 的带标签版本，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升的稳定 npm 版本
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定修正版默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升一个已验证的 beta 构建
- 每个稳定 OpenClaw 版本都会同时发布 npm 包和 macOS 应用；
  beta 版本通常先验证并发布 npm/包路径，而 mac 应用构建/签名/公证保留给稳定版，除非明确请求

## 发布节奏

- 发布按 beta 优先推进
- 只有在最新 beta 验证通过后，稳定版才会跟进
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已推送或发布并且需要修复，维护者会切下一个 `-beta.N` 标签，
  而不是删除或重新创建旧 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者使用

## 发布操作员检查清单

这份检查清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交它，推送它，并在创建分支前再 rebase/pull 一次。
3. 查看
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有当升级路径仍被覆盖时才移除过期兼容性，
   否则记录它被有意保留的原因。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上做常规发布工作。
5. 为预期标签更新所有必需的版本位置，然后运行
   `pnpm release:prep`。它会按正确顺序刷新插件版本、插件清单、配置架构、内置渠道配置元数据、配置文档基线、插件 SDK
   导出和插件 SDK API 基线。打标签前提交任何生成的漂移。然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复的最小失败文件、通道、工作流作业、包配置、提供商或模型允许列表。只有当变更面使先前证据失效时，才重新运行完整总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，
   并行将所有可发布的插件包分发到 npm，并将同一组分发到
   ClawHub，然后在插件 npm 发布成功后立即用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检产物。
   OpenClaw npm 发布时 ClawHub 发布可能仍在运行，但发布工作流会立即打印子运行 ID。默认情况下，它在分发 ClawHub 后不会等待它，
   因此 OpenClaw npm 可用性不会被较慢的 ClawHub 审批或注册表工作阻塞；当 ClawHub 必须阻塞工作流完成时，设置
   `wait_for_clawhub=true`。ClawHub 路径会重试短暂的 CLI 依赖安装失败，即使一个预览单元偶发失败也会发布通过预览的插件，
   并以每个预期插件版本的注册表验证结束，这样部分发布仍然可见且可重试。发布后，针对已发布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切下一个匹配的预发布编号；不要删除或重写旧预发布。
10. 对于稳定版，只有在已验证的 beta 或候选发布版本具备所需验证证据后才继续。稳定版 npm 发布也通过
    `OpenClaw Release Publish` 进行，并通过 `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布准备就绪还要求
    `main` 上有打包好的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器，在需要发布后渠道证明时可选运行独立的已发布 npm Telegram E2E，
    在需要时执行 dist-tag 提升，根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布/预发布说明，
    并执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 在更快的本地 `pnpm check` 门禁之外也会保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，这样 pack 验证步骤所需的 `dist/*` 发布产物和 Control UI 包会存在
- 在根版本号提升之后、打标签之前运行 `pnpm release:prep`。它会运行所有确定性的发布生成器，这些生成器通常会在版本/配置/API 变更后发生漂移：插件版本、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些防护项，并在运行包发布检查之前，用一轮报告它发现的每个生成漂移失败。
- 在发布批准前运行手动 `Full Release Validation` 工作流，以便从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，派发手动 `CI`，并派发 `OpenClaw Release Checks`，用于安装冒烟、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram 跑道。稳定版/默认运行会把详尽的实时/E2E 和 Docker 发布路径 soak 保持在 `run_release_soak=true` 之后；`release_profile=full` 会强制开启 soak。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查中的 `release-package-under-test` 产物运行包 Telegram E2E。发布后提供 `npm_telegram_package_spec`，当同一个 Telegram E2E 也应该证明已发布的 npm 包时使用。发布后提供 `package_acceptance_package_spec`，当 Package Acceptance 应该针对已发布的 npm 包，而不是 SHA 构建产物，运行其包/更新矩阵时使用。提供 `evidence_package_spec`，当私有证据报告应该证明验证匹配已发布的 npm 包，但不强制运行 Telegram E2E 时使用。示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你想在发布工作继续进行的同时为包候选提供旁路证明时，运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包受信任的 `package_ref` 分支/标签/SHA；对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对另一个 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会把候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当所选 Docker 跑道包含 `published-upgrade-survivor` 时，包产物就是候选，`published_upgrade_survivor_baseline` 会选择已发布基线。`update-restart-auth` 会把候选包同时用作已安装 CLI 和 package-under-test，因此它会演练候选更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载跑道
  - `package`：不含 OpenWebUI 或实时 ClawHub 的产物原生包/更新/重启/插件跑道
  - `product`：包配置加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选的完整普通 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 派发会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 跑道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器演练 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部收集器。
- 每次打标签发布前运行 `pnpm release:check`
- 标签存在后，针对会产生变更的发布序列运行 `OpenClaw Release Publish`。从 `release/YYYY.M.D`（或发布 main 可达标签时从 `main`）派发它，传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保留默认插件发布范围 `all-publishable`，除非你是在有意运行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，这样核心包不会在其外部化插件之前发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity 跑道，以及快速实时 Matrix 配置和 Telegram QA 跑道。实时跑道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当你想并行获取完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真正的 npm 发布路径保持短小、确定性和聚焦产物，同时较慢的实时检查保留在自己的跑道中，这样它们不会拖慢或阻塞发布
- 带有 secret 的发布检查应通过 `Full Release Validation` 派发，或从 `main`/release 工作流 ref 派发，这样工作流逻辑和 secret 都保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，不需要已推送标签
- 该 SHA 路径仅用于验证，不能提升为真正发布
- 在 SHA 模式下，工作流只为包元数据检查合成 `v<package.json version>`；真正发布仍然需要真实发布标签
- 两个工作流都把真正发布和提升路径保持在 GitHub 托管 runner 上，而非变更型验证路径可以使用更大的 Blacksmith Linux runner
- 该工作流会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流 secret
- npm 发布预检不再等待单独的发布检查跑道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正标签）
- npm 发布后运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版本），以在全新临时 prefix 中验证已发布 registry 安装路径
- beta 发布后运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租约 Telegram 凭据池，针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭据。
- 要从维护者机器运行完整的发布后 beta 冒烟，使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm 更新/全新目标验证，派发 `NPM Telegram Beta E2E`，轮询精确工作流运行，下载产物，并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流，从 GitHub Actions 运行相同的发布后检查。它有意只支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用预检后提升：
  - 真正的 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真正的 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支派发
  - 稳定版 npm 发布默认发布到 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式目标到 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 中以保证安全，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于 release 分支但工作流从 `main` 派发时，设置 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真正发布路径会提升已准备的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一个临时 prefix 升级路径，这样发布修正不会静默地让旧的全局安装停留在基础稳定版 payload 上
- npm 发布预检会失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` payload，这样我们就不会再次发布空的浏览器 dashboard
- 发布后验证还会检查已发布的插件入口点和包元数据是否存在于已安装 registry 布局中。发布若缺少插件运行时 payload，会导致 postpublish 验证器失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布发布路径之前捕获意外的 pack 膨胀
- 如果发布工作触及 CI 规划、插件 timing 清单或插件测试矩阵，请在批准前重新生成并审查由 planner 拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，这样发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪还包括 updater 表面：
  - GitHub release 最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 已打包应用必须保持非 debug bundle id、非空 Sparkle feed URL，以及大于或等于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作者从一个入口点启动所有预发布测试的方式。要在快速移动分支上获取 pinned commit 证明，请使用该 helper，让每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该 helper 会推送 `release-ci/<sha>-...`，从该分支派发带有 `ref=<sha>` 的 `Full Release Validation`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这可以避免意外证明更新的 `main` 子运行。

对于发布分支或标签验证，请从受信任的 `main` 工作流
ref 运行它，并将发布分支或标签作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

该工作流会解析目标 ref，分派带有
`target_ref=<release-ref>` 的手动 `CI`，分派 `OpenClaw Release Checks`，为面向软件包的检查准备父级 `release-package-under-test` 制品，并在 `release_profile=full` 且 `rerun_group=all` 时，或设置了 `npm_telegram_package_spec` 时，分派独立的软件包 Telegram E2E。随后 `OpenClaw Release
Checks` 会扇出安装冒烟、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。只有当
`Full Release Validation`
摘要显示 `normal_ci` 和 `release_checks` 成功时，一次完整运行才可接受。在 full/all 模式下，
`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终
verifier 摘要会包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、确切工作流作业名称、stable 与 full profile 的差异、制品以及聚焦重跑句柄。
子工作流会从运行 `Full Release
Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择受信任的 harness。
不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 来为确切提交提供证明；
原始提交 SHA 不能作为工作流分派 ref，因此请使用
`pnpm ci:full-release --sha <sha>` 创建已固定的临时分支。

使用 `release_profile` 选择 live/provider 覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定 provider/backend 覆盖
- `full`：stable 加上广泛的 advisory provider/media 覆盖

当发布阻塞 lane 为绿色，并且你希望在推广前执行穷尽的 live/E2E、Docker 发布路径以及有界已发布升级存活 sweep 时，请将 `run_release_soak=true` 与 `stable` 一起使用。该 sweep 覆盖最新四个稳定软件包，加上固定的 `2026.4.23` 和 `2026.5.2`
基线，以及较旧的 `2026.4.15` 覆盖；会移除重复基线，并将每个基线分片到自己的 Docker runner 作业中。`full` 隐含
`run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将目标
ref 解析一次为 `release-package-under-test`，并在运行 soak 时在跨 OS、Package Acceptance 和发布路径 Docker 检查中复用该制品。这会让所有面向软件包的 boxes 使用相同字节，并避免重复构建软件包。
跨 OS OpenAI 安装冒烟在设置了 repo/org 变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为这个 lane 证明的是软件包安装、新手引导、Gateway 网关启动以及一次 live 智能体轮次，而不是 benchmark 最慢的默认模型。更广泛的 live provider
矩阵仍然是模型特定覆盖的地方。

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

不要在聚焦修复后的第一次重跑中使用完整 umbrella。如果一个 box
失败，请使用失败的子工作流、作业、Docker lane、软件包 profile、模型
provider 或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或让早先的全 box 证据过期时，才再次运行完整 umbrella。umbrella 的最终 verifier 会重新检查记录的子工作流运行
id，因此在成功重跑某个子工作流后，只需重跑失败的
`Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传给 umbrella。`all` 是真正的
release-candidate 运行，`ci` 只运行正常 CI 子项，`plugin-prerelease`
只运行仅发布用插件子项，`release-checks` 会运行每个发布
box，更窄的发布组包括 `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行使用 release-checks 软件包制品。聚焦的跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或另一个 OS/suite 过滤器。QA release-check 失败是 advisory；仅 QA 失败不会阻塞发布验证。

### Vitest

Vitest box 是手动 `CI` 子工作流。手动 CI 会有意绕过 changed 作用域，并强制对发布候选运行正常测试图：Linux Node 分片、内置插件分片、频道 contracts、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n。

使用这个 box 回答“源代码树是否通过了完整的正常测试套件？”
它不同于发布路径产品验证。需要保留的证据：

- `Full Release Validation` 摘要，显示已分派的 `CI` 运行 URL
- `CI` 在确切目标 SHA 上绿色
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当一次运行需要性能分析时，保留 Vitest 计时制品，例如 `.artifacts/vitest-shard-timings.json`

只有当发布需要确定性的正常 CI，但不需要 Docker、QA Lab、live、跨 OS 或软件包 boxes 时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及 release-mode
`install-smoke` 工作流运行。它通过打包的 Docker 环境验证发布候选，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用缓慢 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并让 QR、
  root/gateway 和 installer/Bun 冒烟作业作为单独的 install-smoke
  分片运行
- 仓库 E2E lanes
- 发布路径 Docker chunks：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时，`plugins-runtime-services` chunk 内的 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lanes
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live suites 时，覆盖 live/E2E provider suites 和 Docker live model

在重跑前使用 Docker 制品。发布路径 scheduler 会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、
阶段计时、scheduler plan JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布 chunks。生成的重跑命令会在可用时包含先前的
`package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane 可以复用相同 tarball 和 GHCR 镜像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic
行为和频道级发布门禁，独立于 Vitest 和 Docker
软件包机制。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6
  基线进行比较的 mock parity lane
- 使用 `qa-live-shared` 环境的快速 live Matrix QA profile
- 使用 Convex CI 凭证租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用这个 box 回答“发布在 QA 场景和 live 渠道流中是否行为正确？”
批准发布时，请保留 parity、Matrix 和 Telegram
lanes 的制品 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键 lane。

### 软件包

Package box 是可安装产品门禁。它由
`Package Acceptance` 和 resolver
`scripts/resolve-openclaw-package-candidate.mjs` 支撑。resolver 会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证软件包 inventory，记录软件包版本和 SHA-256，并让工作流 harness ref 与软件包源 ref 保持分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或确切的 OpenClaw 发布版本
- `source=ref`：用选定的 `workflow_ref` harness 打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布软件包制品、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会基于同一个已解析的
tarball 保持迁移、更新、已配置 auth 更新重启、陈旧插件依赖清理、离线插件 fixtures、插件更新以及 Telegram 软件包 QA。阻塞发布检查使用默认的最新已发布软件包
基线；`run_release_soak=true` 或
`release_profile=full` 会扩展到从
`2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，加上报告问题 fixtures。对于已经发布的候选，请使用带 `source=npm` 的
Package Acceptance；对于发布前有 SHA 支撑的本地 npm tarball，请使用
`source=ref`/`source=artifact`。它是 GitHub 原生的
替代方案，可覆盖以前需要 Parallels 的大部分软件包/更新覆盖。跨 OS 发布检查对 OS 特定的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范清单是
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、Doctor 清理或已发布软件包迁移变更时，请使用它。
从每个稳定 `2026.4.23+` 软件包进行的穷尽已发布更新迁移是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽容策略被有意限制在一段时间内。到
`2026.4.25` 为止的软件包可以针对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少的私有 QA 清单条目、缺少的
`gateway install --wrapper`、tarball 派生的 git
fixture 中缺少的补丁文件、缺少的持久化 `update.channel`、旧版插件安装记录位置、缺少的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 软件包可以对已经随包发布的本地构建元数据戳文件发出警告。后续软件包必须满足现代软件包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装的软件包时，请使用更广泛的 Package Acceptance 配置：

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

- `smoke`：快速软件包安装/渠道/智能体、Gateway 网关网络和配置
  重载通道
- `package`：不依赖实时
  ClawHub 的安装/更新/重启/插件软件包契约；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI Web
  搜索和 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于候选软件包的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会把解析得到的
`package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍然接受已发布的 npm spec，用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是常规的变更型发布入口点。它会按发布所需顺序编排可信发布者工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同范围和 SHA 调度 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 调度
   `OpenClaw NPM Release`。

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

稳定版直接提升到 `latest` 必须显式执行：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用更底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定的插件修复，请向
`OpenClaw Release Publish` 传入 `plugin_publish_scope=selected` 和
`plugins=@openclaw/name`；或者当不得发布 OpenClaw 软件包时，直接调度子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作者控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，使工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Publish` 接受这些由操作者控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 id；当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 软件包的 npm 目标标签
- `plugin_publish_scope`：默认值为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，逗号分隔的 `@openclaw/*` 软件包名称
- `publish_openclaw_npm`：默认值为 `true`；仅在把该工作流用作纯插件修复编排器时设为 `false`

`OpenClaw Release Checks` 接受这些由操作者控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析出的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查中选择加入详尽的实时/E2E、Docker 发布路径以及 all-since upgrade-survivor soak。它会由 `release_profile=full` 强制开启。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的相同 `npm_dist_tag`；工作流会在发布继续之前验证该元数据

## 稳定版 npm 发布流程

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整的工作流分支提交 SHA，对预检工作流进行仅验证的试运行
2. 对于常规的 beta-first 流程选择 `npm_dist_tag=beta`；只有在你有意直接发布稳定版时才选择 `latest`
3. 当你希望从一个手动工作流获得常规 CI 加实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行
   `OpenClaw Release Publish`；它会先把外部化插件发布到 npm 和
   ClawHub，然后再提升 OpenClaw npm 软件包
7. 如果发布落在 `beta`，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，把该稳定版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta` 应立即跟随同一个稳定构建，请使用同一个私有工作流把两个 dist-tag 都指向该稳定版本，或让它的定时自修复同步稍后移动 `beta`

dist-tag 变更位于私有仓库中以保障安全，因为它仍然需要 `NPM_TOKEN`，而公共仓库保持仅使用 OIDC 发布。

这让直接发布路径和 beta-first 提升路径都有文档说明，并且对操作者可见。

如果维护者必须回退到本地 npm 认证，请只在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；把它保留在 tmux 中可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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
