---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或包验收
    - 想了解版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证环境、版本命名和节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-03T11:28:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: edfd7d6a17da68c76d7196856702c59d1e3c2749907f591fe18b4f9df2eb097d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- stable：默认发布到 npm `beta` 的标记发布，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要给月份或日期补零
- `latest` 表示当前已提升的稳定 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定修正版默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升经过验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常先验证并发布 npm/包路径，除非明确请求，否则
  mac 应用构建/签名/公证会保留给稳定版

## 发布节奏

- 发布先进入 beta
- 只有在最新 beta 经过验证后才会进入稳定版
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并且需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅限维护者查看

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复和紧急回滚细节保留在仅限维护者的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够稳定，可以从它创建分支。
2. 使用 `/changelog` 基于真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交并推送，然后在创建分支前再 rebase/pull
   一次。
3. 审查
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍然被覆盖时才移除过期兼容性，或记录为什么有意继续保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为预期标签更新所有必需的版本位置，运行
   `pnpm plugins:sync`，让可发布的插件包共享发布版本和兼容性元数据，然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，
   可以使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用发布分支、标签或完整提交 SHA 通过 `Full Release Validation` 启动所有预发布测试。这是四个大型发布测试盒的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明该修复的最小失败文件、通道、工作流作业、包配置、提供商或模型 allowlist。只有在变更表面使之前的证据过期时，才重新运行完整总控流程。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，先将所有可发布的插件包发布到 npm，再将同一批插件发布到 ClawHub，然后使用匹配的 dist-tag 提升已准备好的 OpenClaw npm 预检产物。发布后，对已发布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布版本需要修复，
   切出下一个匹配的预发布编号；不要删除或重写旧的预发布版本。
10. 对于稳定版，只有在经过验证的 beta 或候选发布版本具备所需验证证据后才继续。
    稳定版 npm 发布同样通过 `OpenClaw Release Publish` 进行，并通过
    `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还要求
    `main` 上存在打包后的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器，在需要发布后渠道证明时运行可选的独立
    已发布 npm Telegram E2E，按需执行 dist-tag 提升，根据完整匹配的
    `CHANGELOG.md` 章节创建 GitHub release/prerelease notes，并完成发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 仍会在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会在更快的本地门禁之外保持绿色
- 在 `pnpm release:check` 前运行 `pnpm build && pnpm ui:build`，这样用于打包验证步骤的预期 `dist/*` 发布产物和 Control UI 包会存在
- 在根版本号提升之后、打标签之前运行 `pnpm plugins:sync`。它会更新可发布插件包版本、OpenClaw 对等/API 兼容性元数据、构建元数据和插件变更日志存根，使其匹配核心发布版本。`pnpm plugins:sync:check` 是非变更式发布防护；如果忘记这一步，发布工作流会在任何注册表变更前失败。
- 在发布审批前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有预发布测试盒。它接受分支、标签或完整提交 SHA，分派手动 `CI`，并分派 `OpenClaw Release Checks`，覆盖安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 车道。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查中的 `release-package-under-test` 产物运行包 Telegram E2E。发布后，如果同一个 Telegram E2E 也应证明已发布的 npm 包，请提供 `npm_telegram_package_spec`。发布后，如果 Package Acceptance 应针对已交付的 npm 包而不是 SHA 构建产物运行其包/更新矩阵，请提供 `package_acceptance_package_spec`。如果私有证据报告应证明验证匹配已发布的 npm 包但不强制运行 Telegram E2E，请提供 `evidence_package_spec`。示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你想在发布工作继续进行时为包候选版本提供旁路证明，请运行手动 `Package Acceptance` 工作流。对于 `openclaw@beta`、`openclaw@latest` 或精确发布版本，使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包受信任的 `package_ref` 分支/标签/SHA；对于带有必需 SHA-256 的 HTTPS tarball，使用 `source=url`；或者对于另一个 GitHub Actions 运行上传的 tarball，使用 `source=artifact`。该工作流会将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当选定的 Docker 车道包含 `published-upgrade-survivor` 时，包产物就是候选版本，`published_upgrade_survivor_baseline` 选择已发布基线。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载车道
  - `package`：产物原生的包/更新/插件车道，不包含 OpenWebUI 或实时 ClawHub
  - `product`：包配置加上 MCP 渠道、cron/子智能体清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要为发布候选版本获得完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分派会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 车道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的追踪 span 名称、有界属性以及内容/标识符脱敏，不需要 Opik、Langfuse 或其他外部收集器。
- 每次带标签发布前运行 `pnpm release:check`
- 标签存在后，为变更式发布序列运行 `OpenClaw Release Publish`。从 `release/YYYY.M.D` 分派它（或在发布 main 可达标签时从 `main` 分派），传入发布标签和成功的 OpenClaw npm `preflight_run_id`，并保持默认插件发布范围 `all-publishable`，除非你有意运行聚焦修复。该工作流会串行化插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会在其外置插件之前发布。
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布审批前运行 QA Lab 模拟 parity 车道以及快速实时 Matrix 配置和 Telegram QA 车道。实时车道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。当你想并行获得完整 Matrix 传输、媒体和 E2EE 清单时，请使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证属于公开 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：保持真实 npm 发布路径短小、确定且聚焦产物，同时较慢的实时检查保留在自己的车道中，避免拖慢或阻塞发布
- 携带密钥的发布检查应通过 `Full Release
Validation` 分派，或从 `main`/release 工作流 ref 分派，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析出的提交可从 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证预检也接受当前完整 40 字符工作流分支提交 SHA，不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管运行器上，而非变更式验证路径可以使用更大的 Blacksmith Linux 运行器
- 该工作流会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布预检不再等待单独的发布检查车道
- 审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版本），在全新的临时前缀中验证已发布注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租赁 Telegram 凭证池针对已发布 npm 包验证已安装包新手引导、Telegram 设置和真实 Telegram E2E。本地维护者的一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行同一个发布后检查。它有意仅支持手动运行，不会在每次合并时运行。
- 维护者发布自动化现在使用先预检再提升：
  - 真实 npm 发布必须传入成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式目标为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 中以保障安全，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签只存在于发布分支但工作流从 `main` 分派时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须传入成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，确保发布修正不会静默地让较旧的全局安装停留在基础稳定版载荷上
- npm 发布预检会默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，这样我们就不会再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装的注册表布局中。发布版本如果缺少插件运行时载荷，发布后验证器会失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 也会在候选更新 tarball 上强制执行 npm 包 `unpackedSize` 预算，这样安装器 e2e 会在发布路径之前捕获意外的包体积膨胀
- 如果发布工作触及 CI 规划、插件时序清单或插件测试矩阵，请在审批前重新生成并审查由规划器拥有的 `.github/workflows/plugin-prerelease.yml` 中的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过期的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器表面：
  - GitHub release 最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包应用必须保持非调试 bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作员从一个入口点启动所有预发布测试的方式。对于快速移动分支上的固定提交证明，使用辅助工具，确保每个子工作流都从固定到目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该辅助工具会推送 `release-ci/<sha>-...`，从该分支以 `ref=<sha>` 分派 `Full Release Validation`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这样可以避免意外证明更新的 `main` 子运行。

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

工作流会解析目标 ref，使用
`target_ref=<release-ref>` 调度手动 `CI`，调度 `OpenClaw Release Checks`，为面向软件包的检查准备父级 `release-package-under-test` 构件，并在 `release_profile=full` 且 `rerun_group=all`，或设置了 `npm_telegram_package_spec` 时，调度独立的软件包 Telegram E2E。随后，`OpenClaw Release
Checks` 会展开安装冒烟、跨 OS 发布检查、实时/E2E Docker 发布路径覆盖、带 Telegram 软件包 QA 的 Package Acceptance、QA Lab 对等性、实时 Matrix 和实时 Telegram。只有当
`Full Release Validation`
摘要显示 `normal_ci` 和 `release_checks` 成功时，一次完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，除非提供了已发布的 `npm_telegram_package_spec`，否则会跳过它。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
参见 [完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确的工作流作业名称、stable 与 full 配置的差异、构件以及聚焦重跑句柄。
子工作流从运行 `Full Release
Validation` 的可信 ref 调度，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation workflow-ref 输入；通过选择工作流运行 ref 来选择可信 harness。
不要使用 `--ref main -f ref=<sha>` 在移动的 `main` 上证明精确提交；原始提交 SHA 不能作为工作流调度 ref，因此请使用
`pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择实时/提供商覆盖范围：

- `minimum`：最快的发布关键 OpenAI/core 实时与 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的咨询提供商/媒体覆盖

`OpenClaw Release Checks` 使用可信工作流 ref 将目标 ref 解析一次为 `release-package-under-test`，并在发布路径 Docker 检查和 Package Acceptance 中复用该构件。这会让所有面向软件包的盒子使用相同字节，并避免重复构建软件包。
当设置了 repo/org 变量时，跨 OS OpenAI 安装冒烟使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该 lane 证明的是软件包安装、新手引导、Gateway 网关启动和一次实时智能体回合，而不是对最慢的默认模型做基准测试。更广泛的实时提供商矩阵仍然是进行模型特定覆盖的地方。

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

不要把完整 umbrella 作为聚焦修复后的第一次重跑。如果一个盒子失败，请使用失败的子工作流、作业、Docker lane、软件包配置、模型提供商或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或使之前的全盒子证据过期时，才再次运行完整 umbrella。umbrella 的最终验证器会重新检查记录的子工作流运行 ID，因此在某个子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，将 `rerun_group` 传给 umbrella。`all` 是真正的发布候选运行，`ci` 仅运行普通 CI 子项，`plugin-prerelease` 仅运行发布专用插件子项，`release-checks` 运行每个发布盒子，更窄的发布组是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行会使用 release-checks 软件包构件。

### Vitest

Vitest 盒子是手动 `CI` 子工作流。手动 CI 会有意绕过变更范围限定，并强制为发布候选运行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

用这个盒子回答“源代码树是否通过了完整的普通测试套件？”
它不同于发布路径产品验证。需要保留的证据：

- 显示已调度 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色的 `CI` 运行
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当一次运行需要性能分析时，保留 Vitest 计时构件，例如 `.artifacts/vitest-shard-timings.json`

仅当发布需要确定性的普通 CI，但不需要 Docker、QA Lab、实时、跨 OS 或软件包盒子时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 盒子位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及 release-mode
`install-smoke` 工作流实现。它通过打包后的 Docker 环境验证发布候选，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，其中 QR、root/gateway 和 installer/Bun 冒烟作业作为独立 install-smoke 分片运行
- 仓库 E2E lane
- 发布路径 Docker 分块：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 按请求在 `plugins-runtime-services` 分块内包含 OpenWebUI 覆盖
- 拆分的内置插件安装/卸载 lane
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，包含实时/E2E 提供商套件和 Docker 实时模型覆盖

重跑前先使用 Docker 构件。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含之前的
`package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane 可以复用相同 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 盒子也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门禁，独立于 Vitest 和 Docker 软件包机制。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6 基线比较的 mock 对等性 lane
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置
- 使用 Convex CI 凭据租约的实时 Telegram QA lane
- 当发布遥测需要明确本地证明时，运行 `pnpm qa:otel:smoke`

用这个盒子回答“发布在 QA 场景和实时渠道流中是否行为正确？”批准发布时，保留对等性、Matrix 和 Telegram lane 的构件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认发布关键 lane。

### 软件包

软件包盒子是可安装产品门禁。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为供 Docker E2E 消费的 `package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并让工作流 harness ref 与软件包源 ref 保持分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包可信 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、准备好的发布软件包构件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 会针对同一个已解析 tarball 保持迁移、更新、陈旧插件依赖清理、离线插件 fixture、插件更新和 Telegram 软件包 QA。升级矩阵覆盖从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线；对于已发布的候选，使用带 `source=npm` 的 Package Acceptance；对于发布前由 SHA 支撑的本地 npm tarball，使用 `source=ref`/`source=artifact`。它是之前大多数需要 Parallels 的软件包/更新覆盖的 GitHub 原生替代方案。跨 OS 发布检查对 OS 特定的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范检查清单是
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在决定哪个本地、Docker、Package Acceptance 或 release-check lane 能证明插件安装/更新、Doctor 清理或已发布软件包迁移变更时，请使用它。
从每个稳定 `2026.4.23+` 软件包进行穷尽式已发布更新迁移，是单独的手动 `Update Migration` 工作流，不属于 Full Release CI。

旧版 package-acceptance 宽容策略有意设置了时限。截至
`2026.4.25` 的软件包可以对已发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少私有 QA 清单条目、缺少
`gateway install --wrapper`、tarball 派生的 git fixture 中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 软件包可以对已发布的本地构建元数据戳文件发出警告。之后的软件包必须满足现代软件包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装软件包时，使用更广泛的 Package Acceptance 配置：

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

- `smoke`：快速的软件包安装/渠道/智能体、Gateway 网关网络和配置
  重新加载通道
- `package`：在没有实时 ClawHub 的情况下验证安装/更新/插件软件包契约；这是发布检查的
  默认值
- `product`：`package` 加上 MCP 渠道、cron/子智能体清理、OpenAI web
  search 和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于软件包候选版本的 Telegram 验证，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会将解析出的
`package-under-test` tarball 传入 Telegram 通道；独立的
Telegram 工作流仍接受已发布的 npm 规范，用于发布后检查。

## 发布发布自动化

`OpenClaw Release Publish` 是常规的可变更发布入口点。它会按发布所需顺序
编排受信任发布者工作流：

1. 签出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 分发 `Plugin NPM Release`。
5. 使用相同的范围和 SHA 分发 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和保存的 `preflight_run_id`
   分发 `OpenClaw NPM Release`。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stable 发布到默认 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接提升 Stable 到 `latest` 是显式操作：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作时使用较低层级的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定插件修复，将
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`；或者在不得发布 OpenClaw 软件包时，直接分发子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作者控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前
  完整 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：真实发布路径必需，这样工作流会复用
  成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受这些由操作者控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 id；
  当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 软件包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在
  聚焦修复工作时使用 `selected`
- `plugins`：当
  `plugin_publish_scope=selected` 时，为逗号分隔的 `@openclaw/*` 软件包名称
- `publish_openclaw_npm`：默认为 `true`；仅当使用该
  工作流作为仅插件修复编排器时设为 `false`

`OpenClaw Release Checks` 接受这些由操作者控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查
  要求解析出的提交可从 OpenClaw 分支或
  发布标签到达。

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当
  `preflight_only=true` 时允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终
  仅用于验证
- 真实发布路径必须使用预检期间使用的同一个 `npm_dist_tag`；
  工作流会在发布继续前验证该元数据

## Stable npm 发布顺序

切出 Stable npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在前，你可以使用当前完整工作流分支提交
     SHA，对预检工作流进行仅验证的试运行
2. 对常规 beta 优先流程选择 `npm_dist_tag=beta`，或仅在
   你有意直接发布 Stable 时选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加实时提示缓存、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整
   提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的常规测试图，请改为在发布 ref 上运行
   手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`
   和保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外部化插件发布到 npm
   和 ClawHub，再提升 OpenClaw npm 软件包
7. 如果发布落在 `beta` 上，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 Stable 版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta`
   应立即跟随同一个 Stable 构建，请使用同一个私有
   工作流将两个 dist-tag 都指向该 Stable 版本，或让它的定时
   自愈同步稍后移动 `beta`

dist-tag 变更位于私有仓库中，是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这会让直接发布路径和 beta 优先提升路径都
有文档记录，并对操作者可见。

如果维护者必须回退到本地 npm 认证，请仅在专用 tmux 会话内运行任何 1Password
CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；
将其放在 tmux 内可以让提示、告警和 OTP 处理可观察，并防止重复的主机告警。

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
