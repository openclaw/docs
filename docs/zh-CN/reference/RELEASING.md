---
read_when:
    - 正在查找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布通道、操作员检查清单、验证框、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-05-11T20:33:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三个公开发布通道：

- 稳定版：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 的移动头部

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要给月份或日期补零
- `latest` 表示当前已提升的稳定版 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或稍后提升经过审核的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，除非明确请求，否则
  mac 应用构建、签名和公证会保留给稳定版

## 发布节奏

- 发布先进入 beta
- 只有在最新 beta 通过验证后，稳定版才会跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布，
  这样发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布并且需要修复，维护者会切出下一个
  `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅供维护者使用

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭证、签名、公证、dist-tag 恢复
和紧急回滚细节保留在仅维护者可见的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` CI 足够健康，可以从它创建分支。
2. 使用 `/changelog` 根据真实提交历史重写顶部 `CHANGELOG.md` 章节，
   保持条目面向用户，提交、推送，并在分支前再次 rebase/pull。
3. 查看
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有在升级路径仍然被覆盖时才移除过期兼容性，
   或记录为什么有意继续保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为目标标签更新所有必需的版本位置，然后运行
   `pnpm release:prep`。它会按正确顺序刷新插件版本、插件清单、配置
   schema、内置渠道配置元数据、配置文档基线、插件 SDK
   导出和插件 SDK API 基线。打标签前提交任何生成的差异。然后运行本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`。在标签存在之前，
   允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有预发布测试。
   这是四个大型发布测试盒的唯一手动入口：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能够证明修复的最小失败
   文件、通道、工作流作业、包 profile、提供商或模型 allowlist。
   只有在变更面会让既有证据失效时，才重新运行完整总入口。
9. 对于 beta，标记 `vYYYY.M.D-beta.N`，然后从匹配的
   `release/YYYY.M.D` 分支运行 `OpenClaw Release Publish`。它会验证 `pnpm plugins:sync:check`，
   将所有可发布的插件包并行发布到 npm，并将同一组发布到
   ClawHub，然后在插件 npm 发布成功后，立即用匹配的 dist-tag
   提升准备好的 OpenClaw npm 预检产物。
   OpenClaw npm 发布子流程成功后，它会从完整匹配的
   `CHANGELOG.md` 章节创建或更新对应的 GitHub release/prerelease 页面。
   发布到 npm `latest` 的稳定版发布会成为 GitHub 最新发布；保留在 npm `beta`
   上的稳定维护发布会以 GitHub `latest=false` 创建。
   OpenClaw npm 发布时，ClawHub 发布可能仍在运行，但发布发布工作流会立即打印子流程运行 ID。
   默认情况下，它在调度 ClawHub 后不会等待它，因此 OpenClaw npm 可用性
   不会被较慢的 ClawHub 审批或注册表工作阻塞；当 ClawHub 必须阻塞工作流完成时，设置
   `wait_for_clawhub=true`。ClawHub 路径会重试临时 CLI 依赖安装失败，
   即使一个 preview 单元出现波动，也会发布通过 preview 的插件，并以每个预期插件版本的
   注册表验证结束，因此部分发布会保持可见且可重试。发布后，针对已发布的
   `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 包运行发布后包验收。如果已推送或已发布的预发布需要修复，
   切出下一个匹配的预发布编号；不要删除或重写旧预发布。
10. 对于稳定版，只有在经过审核的 beta 或候选发布具备所需验证证据后才继续。
    稳定版 npm 发布也通过
    `OpenClaw Release Publish` 执行，并通过
    `preflight_run_id` 复用成功的预检产物；稳定版 macOS 发布就绪还需要
    `main` 上的打包 `.zip`、`.dmg`、`.dSYM.zip` 和更新后的 `appcast.xml`。
    私有 macOS 发布工作流会在发布资产验证后自动将已签名的 appcast 发布到公开
    `main`；如果分支保护阻止直接推送，它会创建或更新一个 appcast PR。
11. 发布后，运行 npm 发布后验证器，在需要发布后渠道证明时运行可选的独立已发布 npm
    Telegram E2E，根据需要执行 dist-tag 提升，验证生成的 GitHub 发布页面，
    并运行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 会在更快的本地 `pnpm check` 门禁之外保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会在更快的本地门禁之外保持通过
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 会存在
- 在根版本号提升之后、打 tag 之前运行 `pnpm release:prep`。它会运行所有确定性的发布生成器，这些生成器通常会在版本、配置或 API 变更后发生漂移：插件版本、插件清单、基础配置 schema、内置渠道配置元数据、配置文档基线、插件 SDK 导出，以及插件 SDK API 基线。`pnpm release:check` 会以检查模式重新运行这些守卫，并在运行包发布检查前一次性报告它发现的所有生成内容漂移失败。
- 在发布批准前运行手动 `Full Release Validation` workflow，从一个入口点启动所有预发布测试盒。它接受 branch、tag 或完整 commit SHA，会调度手动 `CI`，并调度 `OpenClaw Release Checks` 来运行安装 smoke、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram 通道。稳定版/默认运行会把详尽的 live/E2E 和 Docker 发布路径 soak 放在 `run_release_soak=true` 后面；`release_profile=full` 会强制开启 soak。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查中的 `release-package-under-test` 产物运行包 Telegram E2E。发布 beta 后提供 `release_package_spec`，可以在发布检查、Package Acceptance 和包 Telegram E2E 中复用已发布的 npm 包，而无需重新构建发布 tarball。仅当 Telegram 应使用与其余发布验证不同的已发布包时，才提供 `npm_telegram_package_spec`。当 Package Acceptance 应使用与发布包 spec 不同的已发布包时，提供 `package_acceptance_package_spec`。当私有证据报告应证明验证匹配某个已发布 npm 包，但不强制运行 Telegram E2E 时，提供 `evidence_package_spec`。
  示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续推进的同时为包候选版本获得旁路证明时，运行手动 `Package Acceptance` workflow。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 以当前 `workflow_ref` harness 打包受信任的 `package_ref` branch/tag/SHA；对带必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对其他 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该 workflow 会将候选版本解析为 `package-under-test`，复用针对该 tarball 的 Docker E2E 发布调度器，并且可以用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一个 tarball 运行 Telegram QA。当所选 Docker 通道包含 `published-upgrade-survivor` 时，包产物就是候选版本，`published_upgrade_survivor_baseline` 用于选择已发布的基线。`update-restart-auth` 会将候选包同时用作已安装 CLI 和 package-under-test，因此会覆盖候选更新命令的托管重启路径。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用配置档：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络，以及配置热重载通道
  - `package`：不含 OpenWebUI 或 live ClawHub 的产物原生包/更新/重启/插件通道
  - `product`：package 配置档，加上 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：用于聚焦重跑的精确 `docker_lanes` 选择
- 当你只需要发布候选版本的完整常规 CI 覆盖时，直接运行手动 `CI` workflow。手动 CI 调度会绕过 changed 范围限定，并强制运行 Linux Node shards、内置插件 shards、渠道 contracts、Node 22 兼容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器执行 QA-lab，并验证导出的 trace span 名称、有界属性，以及内容/标识符脱敏，无需 Opik、Langfuse 或其他外部采集器。
- 每个带 tag 的发布前运行 `pnpm release:check`
- 在 tag 存在后运行 `OpenClaw Release Publish`，执行会产生变更的发布序列。从 `release/YYYY.M.D` 调度它（或在发布 main 可达 tag 时从 `main` 调度），传入发布 tag 和成功的 OpenClaw npm `preflight_run_id`，并保持默认插件发布范围 `all-publishable`，除非你有意运行聚焦修复。该 workflow 会串行执行插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布，确保核心包不会在其外置插件之前发布。
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布批准前运行 QA Lab mock parity 通道，以及快速 live Matrix 配置档和 Telegram QA 通道。live 通道使用 `qa-live-shared` environment；Telegram 还会使用 Convex CI 凭证租约。当你希望并行获得完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` workflow。
- 跨 OS 安装和升级运行时验证属于公开的 `OpenClaw Release Checks` 和 `Full Release Validation`，它们会直接调用可复用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意的：让真实 npm 发布路径保持短小、确定性且聚焦产物，而较慢的 live 检查保留在自己的通道中，避免拖慢或阻塞发布
- 含 secret 的发布检查应通过 `Full Release
Validation` 调度，或从 `main`/release workflow ref 调度，以确保 workflow 逻辑和 secret 受控
- `OpenClaw Release Checks` 接受 branch、tag 或完整 commit SHA，只要解析出的 commit 可从 OpenClaw branch 或发布 tag 到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整 40 字符 workflow branch commit SHA，而不要求已推送 tag
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，workflow 只会为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实发布 tag
- 两个 workflow 都将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更性的验证路径可以使用更大的 Blacksmith Linux runner
- 该 workflow 会使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 运行，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secret
- npm 发布预检不再等待单独的发布检查通道
- 批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/correction tag）
- npm publish 后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/correction 版本），以在全新的临时 prefix 中验证已发布 registry 的安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，用共享租约 Telegram 凭证池针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性运行可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 若要从维护者机器运行完整的发布后 beta smoke，使用 `pnpm release:beta-smoke -- --beta betaN`。该 helper 会运行 Parallels npm update/fresh-target 验证，调度 `NPM Telegram Beta E2E`，轮询精确 workflow run，下载 artifact，并打印 Telegram 报告。
- 维护者也可以通过 GitHub Actions 的手动 `NPM Telegram Beta E2E` workflow 运行相同的发布后检查。它被有意设置为仅手动运行，不会在每次 merge 时运行。
- 维护者发布自动化现在使用预检后提升：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` branch 调度
  - 稳定版 npm 发布默认目标为 `beta`
  - 稳定版 npm 发布可以通过 workflow input 显式目标到 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，用于安全隔离，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开 repo 保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当 tag 只存在于 release branch，但 workflow 从 `main` 调度时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实私有 mac 发布必须通过成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时 prefix 升级路径，确保发布修正不会悄悄让较旧的全局安装停留在基础稳定版 payload 上
- npm 发布预检会失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，这样我们就不会再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布插件入口点和包元数据是否存在于已安装 registry 布局中。发布版本如果缺少插件运行时 payload，会使 postpublish 验证器失败，并且不能提升到 `latest`。
- `pnpm test:install:smoke` 也会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布发布路径之前捕获意外的打包膨胀
- 如果发布工作触及 CI 规划、插件计时清单或插件测试矩阵，请在批准前重新生成并审查 `.github/workflows/plugin-prerelease.yml` 中 planner 拥有的 `plugin-prerelease-extension-shard` 矩阵输出，确保发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪还包括 updater 相关表面：
  - GitHub release 最终必须带有打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip；私有 macOS 发布 workflow 会自动提交它，或在直接 push 被阻止时打开 appcast PR
  - 打包后的 app 必须保持非 debug bundle id、非空 Sparkle feed URL，以及不低于该发布版本规范 Sparkle build 下限的 `CFBundleVersion`

## 发布测试盒

`Full Release Validation` 是操作者从一个入口点启动所有预发布测试的方式。对于快速变化 branch 上的固定 commit 证明，使用该 helper，让每个子 workflow 都从临时 branch 运行，该 branch 固定在目标 SHA：

```bash
pnpm ci:full-release --sha <full-sha>
```

该辅助工具会推送 `release-ci/<sha>-...`，从该分支以 `ref=<sha>` 分发 `Full Release Validation`，验证每个子工作流的 `headSha` 都匹配目标，然后删除临时分支。这样可以避免意外证明较新的 `main` 子运行。

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

该工作流会解析目标 ref，分发带有 `target_ref=<release-ref>` 的手动 `CI`，分发 `OpenClaw Release Checks`，为面向包的检查准备父级 `release-package-under-test` 构件，并在 `release_profile=full` 且 `rerun_group=all` 时，或在设置了 `release_package_spec` 或 `npm_telegram_package_spec` 时，分发独立包 Telegram E2E。随后 `OpenClaw Release
Checks` 会展开安装冒烟、跨 OS 发布检查、启用 soak 时的 live/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的包验收、QA Lab 对等性、live Matrix 和 live Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 成功时，完整运行才可接受。在 full/all 模式下，`npm_telegram` 子项也必须成功；在 full/all 之外，它会被跳过，除非提供了已发布的 `release_package_spec` 或 `npm_telegram_package_spec`。最终验证器摘要包含每个子运行的最慢作业表，因此发布经理无需下载日志即可看到当前关键路径。
请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解完整阶段矩阵、精确的工作流作业名称、stable 与 full 配置差异、构件，以及聚焦重跑句柄。
子工作流会从运行 `Full Release
Validation` 的受信任 ref 分发，通常是 `--ref main`，即使目标 `ref` 指向较旧的发布分支或标签也是如此。没有单独的 Full Release Validation 工作流 ref 输入；通过选择工作流运行 ref 来选择受信任的框架。
不要在移动的 `main` 上使用 `--ref main -f ref=<sha>` 进行精确提交证明；原始提交 SHA 不能作为工作流分发 ref，因此请使用 `pnpm ci:full-release --sha <sha>` 创建固定的临时分支。

使用 `release_profile` 选择 live/提供商覆盖广度：

- `minimum`：最快的发布关键 OpenAI/核心 live 和 Docker 路径
- `stable`：minimum 加上用于发布批准的稳定提供商/后端覆盖
- `full`：stable 加上广泛的顾问提供商/媒体覆盖

当发布阻塞 lane 已经为绿色，并且你希望在推广前执行详尽的 live/E2E、Docker 发布路径，以及有界的已发布升级幸存者 sweep 时，请将 `run_release_soak=true` 与 `stable` 一起使用。该 sweep 覆盖最新四个稳定包，以及固定的 `2026.4.23` 和 `2026.5.2` 基线，再加上较旧的 `2026.4.15` 覆盖，同时移除重复基线，并将每个基线分片到自己的 Docker runner 作业中。`full` 隐含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将目标 ref 解析一次为 `release-package-under-test`，并在 soak 运行时，在跨 OS、包验收和发布路径 Docker 检查中复用该构件。这样所有面向包的环境都会使用相同字节，并避免重复构建包。
beta 已经发布到 npm 后，请设置 `release_package_spec=openclaw@YYYY.M.D-beta.N`，这样发布检查会下载一次已发布的包，从 `dist/build-info.json` 提取其构建源 SHA，并在跨 OS、包验收、发布路径 Docker 和包 Telegram lane 中复用该构件。
当 repo/org 变量已设置时，跨 OS OpenAI 安装冒烟会使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为该 lane 证明的是包安装、新手引导、Gateway 网关启动和一次 live 智能体轮次，而不是对最慢默认模型进行基准测试。更广泛的 live 提供商矩阵仍然是模型特定覆盖所在的位置。

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

不要把完整总括工作流用作聚焦修复后的第一次重跑。如果某个环境失败，请使用失败的子工作流、作业、Docker lane、包配置、模型提供商或 QA lane 作为下一次证明。只有当修复更改了共享发布编排，或使先前的全环境证据过期时，才再次运行完整总括工作流。总括工作流的最终验证器会重新检查记录的子工作流运行 id，因此在子工作流成功重跑后，只需重跑失败的 `Verify full validation` 父作业。

对于有界恢复，请将 `rerun_group` 传给总括工作流。`all` 是真正的候选发布运行，`ci` 只运行普通 CI 子项，`plugin-prerelease` 只运行仅发布插件子项，`release-checks` 运行每个发布环境，更窄的发布组包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；带有 `release_profile=full` 的 full/all 运行会使用 release-checks 包构件。聚焦的跨 OS 重跑可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/suite 过滤器。QA 发布检查失败属于顾问性质；仅 QA 失败不会阻塞发布验证。

### Vitest

Vitest 环境是手动 `CI` 子工作流。手动 CI 有意绕过变更范围限定，并强制候选发布运行普通测试图：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。

使用此环境回答“源代码树是否通过了完整普通测试套件？”它不同于发布路径产品验证。需要保留的证据：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 精确目标 SHA 上绿色的 `CI` 运行
- 调查回归时来自 CI 作业的失败或缓慢分片名称
- 当运行需要性能分析时，Vitest 计时构件，例如 `.artifacts/vitest-shard-timings.json`

只有当发布需要确定性的普通 CI，而不需要 Docker、QA Lab、live、跨 OS 或包环境时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 环境位于 `OpenClaw Release Checks` 中，通过 `openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式 `install-smoke` 工作流实现。它通过打包的 Docker 环境验证候选发布，而不只是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 按目标 SHA 准备/复用根 Dockerfile 冒烟镜像，并将 QR、root/gateway 和 installer/Bun 冒烟作业作为单独的 install-smoke 分片运行
- 仓库 E2E lane
- 发布路径 Docker 分块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 请求时在 `plugins-runtime-services` 分块内覆盖 OpenWebUI
- 拆分的内置插件安装/卸载 lane：
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 当发布检查包含 live 套件时，覆盖 live/E2E 提供商套件和 Docker live 模型

重跑前先使用 Docker 构件。发布路径调度器会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON 和重跑命令。对于聚焦恢复，请在可复用 live/E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有发布分块。生成的重跑命令会在可用时包含先前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的 lane 可以复用相同 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 环境也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行为和渠道级发布门禁，与 Vitest 和 Docker 包机制分离。

发布 QA Lab 覆盖包括：

- 使用 agentic parity pack 将 OpenAI 候选 lane 与 Opus 4.6 基线比较的 mock parity lane
- 使用 `qa-live-shared` 环境的快速 live Matrix QA 配置
- 使用 Convex CI 凭证租约的 live Telegram QA lane
- 当发布遥测需要明确本地证明时运行 `pnpm qa:otel:smoke`

使用此环境回答“发布在 QA 场景和 live 渠道流中是否表现正确？”批准发布时，请保留 parity、Matrix 和 Telegram lane 的构件 URL。完整 Matrix 覆盖仍可作为手动分片 QA-Lab 运行使用，而不是默认的发布关键 lane。

### 包

包环境是可安装产品门禁。它由包验收和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支撑。解析器会将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流框架 ref 与包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` 框架打包受信任的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布包构件、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 运行包验收。包验收会针对同一个已解析 tarball 保持迁移、更新、已配置凭证的更新重启、live ClawHub 技能安装、陈旧插件依赖清理、离线插件 fixture、插件更新和 Telegram 包 QA。阻塞性发布检查使用默认的最新已发布包基线；`run_release_soak=true` 或 `release_profile=full` 会扩展到从 `2026.4.23` 到 `latest` 的每个稳定 npm 已发布基线，以及已报告问题的 fixture。对于已发布候选，请使用带 `source=npm` 的包验收；对于发布前由 SHA 支撑的本地 npm tarball，请使用 `source=ref`/`source=artifact`。它是大多数过去需要 Parallels 的包/更新覆盖的 GitHub 原生替代方案。跨 OS 发布检查对于 OS 特定新手引导、安装器和平台行为仍然重要，但包/更新产品验证应优先使用包验收。

更新和插件验证的规范清单是
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。在判断哪个本地、Docker、Package Acceptance 或发布检查通道可以证明插件安装/更新、Doctor 清理或已发布包迁移变更时，请使用它。
从每个稳定版 `2026.4.23+` 包执行穷尽式已发布更新迁移，是一个单独的手动 `Update Migration` 工作流，不属于完整发布 CI。

旧版包验收的宽松处理是有意限时的。到 `2026.4.25` 为止的包，可以对已经发布到 npm 的元数据缺口使用兼容路径：tarball 中缺少的私有 QA 清单条目、缺少 `gateway install --wrapper`、从 tarball 派生的 git fixture 中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能会对已经发出的本地构建元数据戳文件给出警告。后续包必须满足现代包契约；这些相同缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更宽泛的 Package Acceptance 配置档：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常见包配置档：

- `smoke`：快速包安装/渠道/智能体、Gateway 网关网络和配置重载通道
- `package`：安装/更新/重启/插件包契约，加上实时 ClawHub 技能安装证明；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于候选包 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该工作流会把解析出的 `package-under-test` tarball 传入 Telegram 通道；独立的 Telegram 工作流仍然接受已发布的 npm 规格，用于发布后检查。

## 发布自动化

`OpenClaw Release Publish` 是正常的可变更发布入口点。它按发布所需顺序编排 trusted-publisher 工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证该标签可从 `main` 或 `release/*` 到达。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 调度 `Plugin NPM Release`。
5. 使用相同的范围和 SHA 调度 `Plugin ClawHub Release`。
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

直接将稳定版提升到 `latest` 需要显式执行：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅在聚焦修复或重新发布工作中使用更底层的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定插件修复，请将 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传给
`OpenClaw Release Publish`，或者当 OpenClaw 包不得发布时直接调度子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必需，以便工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签；必须已经存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅在聚焦修复工作中使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时使用的逗号分隔 `@openclaw/*` 包名称
- `publish_openclaw_npm`：默认为 `true`；仅当把该工作流用作仅插件修复编排器时设为 `false`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析出的提交可从 OpenClaw 分支或发布标签到达。
- `run_release_soak`：在稳定版/默认发布检查中选择加入穷尽式实时/E2E、Docker 发布路径和全量以来升级幸存者浸泡测试。它会由 `release_profile=full` 强制开启。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当 `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的相同 `npm_dist_tag`；工作流会验证该元数据后再继续发布

## 稳定版 npm 发布顺序

切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，你可以使用当前完整的工作流分支提交 SHA，对预检工作流执行仅验证的演练
2. 对于正常的先 beta 流程选择 `npm_dist_tag=beta`；仅当你有意直接发布稳定版时才选择 `latest`
3. 当你想从一个手动工作流获得正常 CI 加实时 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你有意只需要确定性的正常测试图，请改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它会先将外部化插件发布到 npm 和 ClawHub，再提升 OpenClaw npm 包
7. 如果发布落在 `beta` 上，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版本从 `beta` 提升到 `latest`
8. 如果发布有意直接发布到 `latest`，并且 `beta` 应该立即跟随相同的稳定构建，请使用同一个私有工作流把两个 dist-tag 都指向稳定版本，或者让其定时自愈同步稍后移动 `beta`

出于安全考虑，dist-tag 变更位于私有仓库中，因为它仍然需要 `NPM_TOKEN`，而公共仓库保持仅使用 OIDC 发布。

这样，直接发布路径和先 beta 后提升路径都会被记录，并且对操作员可见。

如果维护者必须回退到本地 npm 认证，请只在专用 tmux 会话内运行任何 1Password CLI（`op`）命令。不要从主智能体 shell 直接调用 `op`；将其保留在 tmux 内可以让提示、警报和 OTP 处理可观察，并防止重复的主机警报。

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
