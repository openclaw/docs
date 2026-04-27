---
read_when:
    - 查找公开发布渠道定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T01:05:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9243a71dad2336c737a59df092bfbfc2bdab830bc9a09e558f27e0e168e82f29
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布渠道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要对月份或日期进行零填充
- `latest` 表示当前已提升的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作人员可以显式指定 `latest`，或稍后再将经过验证的 beta 构建提升过去
- 每个 stable OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/package 路径，而 macOS 应用的构建/签名/公证除非明确要求，否则保留给 stable 发布

## 发布节奏

- 发布采用 beta 优先流程
- 只有在最新 beta 完成验证后，才会进行 stable 发布
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布且需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布预检查

- 在发布预检查之前运行 `pnpm check:test-types`，以便在更快的本地 `pnpm check` 关卡之外，测试 TypeScript 仍然得到覆盖
- 在发布预检查之前运行 `pnpm check:architecture`，以便在更快的本地关卡之外，更广泛的导入循环和架构边界检查保持绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 当你需要通过单一入口点运行整套发布验证时，在发布审批前运行手动 `Full Release Validation` 工作流。它接受分支、标签或完整提交 SHA，触发手动 `CI`，并触发 `OpenClaw Release Checks` 来执行安装冒烟、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。只有在包已经发布，并且还需要运行发布后 Telegram E2E 时，才提供 `npm_telegram_package_spec`。
  示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你只需要针对发布候选版本运行完整的常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动触发的 CI 会绕过 changed 范围限制，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器驱动 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部收集器。
- 在每次带标签发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock 一致性关卡，以及 live 的 Matrix 和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方工作流
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  触发，该工作流会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真实的 npm 发布路径保持简短、确定且聚焦于产物，而较慢的 live 检查留在独立通道中，这样它们就不会拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 触发，或从 `main`/发布工作流引用触发，以便工作流逻辑和密钥始终受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从 OpenClaw 分支或发布标签到达即可
- `OpenClaw NPM Release` 的仅验证预检查也接受当前工作流分支的完整 40 字符提交 SHA，而不要求已有推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管的运行器上，而非变更性验证路径则可以使用更大的 Blacksmith Linux 运行器
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检查不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版版本），以在全新的临时前缀中验证已发布的注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以针对已发布的 npm 包，验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E，使用的是共享的租赁 Telegram 凭证池。本地维护者一次性检查可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` 工作流运行同样的发布后检查。该工作流有意仅限手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用“先预检查，再提升”：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检查运行相同的 `main` 或 `release/YYYY.M.D` 分支触发
  - stable npm 发布默认目标为 `beta`
  - stable npm 发布可以通过工作流输入显式指定 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    出于安全原因，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，从而确保发布修正不会悄悄让较旧的全局安装仍停留在基础 stable 负载上
- npm 发布预检查会默认失败，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，这样我们就不会再次发布一个空的浏览器仪表盘
- 发布后验证还会检查已发布的注册表安装在根级 `dist/*` 布局下包含非空的内置插件运行时依赖。若某个发布缺失这些依赖负载，或这些负载为空，发布后验证器将失败，并且该版本不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的、由规划器负责的 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述过时的 CI 布局
- stable macOS 发布就绪还包括更新器相关表面：
  - GitHub Release 最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前工作流分支的完整 40 字符提交 SHA，用于仅验证的预检查
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：在真实发布路径上为必填项，以便工作流复用成功预检查运行中已准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带有密钥的检查要求解析后的提交可从 OpenClaw 分支或发布标签到达。

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检查相同的 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前工作流分支的完整提交 SHA，对预检查工作流进行一次仅验证的 dry run
2. 在正常的 beta 优先流程中选择 `npm_dist_tag=beta`；只有在你有意直接进行 stable 发布时才选择 `latest`
3. 当你希望通过一个手动工作流同时获得常规 CI 加上 live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，请改为在发布引用上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，使用相同的 `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果该发布先落在 `beta` 上，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该 stable 版本从 `beta` 提升到 `latest`
8. 如果该发布是有意直接发布到 `latest`，并且希望 `beta` 立即跟随同一个 stable 构建，使用同一个私有工作流将两个 dist-tag 都指向该 stable 版本，或者让其计划中的自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样就使直接发布路径和 beta 优先提升路径都得到了文档化，并且对操作人员可见。

如果维护者必须回退到本地 npm 身份验证，只能在专用的 tmux 会话内运行任何 1Password CLI（`op`）命令。不要直接从主 agent shell 调用 `op`；将其限制在 tmux 内可以让提示、告警和 OTP 处理保持可观察，并防止主机重复弹出告警。

## 公开参考资料

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际操作手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
