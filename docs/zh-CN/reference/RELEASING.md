---
read_when:
    - 查找公开发布渠道的定义
    - 查找版本命名和发布节奏的说明
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T00:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32ec1b74f2f3277bdf92da1874625064d09f21245d99b64c183a8bd08f6d4e4a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布渠道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要对月份或日期补零
- `latest` 表示当前已提升为正式版本的 stable npm 发布
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作人员可以显式指定为 `latest`，或者稍后再提升一个已验证的 beta 构建
- 每个 stable OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm / package 路径，而 macOS 应用的构建 / 签名 / 公证默认保留给 stable，除非明确要求

## 发布节奏

- 发布遵循 beta 优先
- 只有在最新 beta 完成验证后，才会继续 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布且需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅供维护者使用

## 发布前预检

- 在发布前预检之前运行 `pnpm check:test-types`，以便测试 TypeScript 也能在更快的本地 `pnpm check` 检查之外得到覆盖
- 在发布前预检之前运行 `pnpm check:architecture`，以确保更全面的导入循环和架构边界检查在更快的本地检查之外也是绿色状态
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 当你需要对发布候选版本执行完整的常规 CI 覆盖时，请在批准发布前运行手动 `CI` workflow。手动触发的 CI 会绕过变更范围限定，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP / HTTP 接收器运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容 / 标识符脱敏，而不需要 Opik、Langfuse 或其他外部收集器。
- 在每次带标签的发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在批准发布之前运行 QA Lab mock parity gate 以及实时 Matrix 和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方 workflow 触发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公开 workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意设计的：让真正的 npm 发布路径保持简短、可预测并聚焦于产物，而较慢的实时检查则保留在自己的通道中，以免拖慢或阻塞发布
- 发布检查必须从 `main` workflow ref 或 `release/YYYY.M.D` workflow ref 触发，以便 workflow 逻辑和密钥保持受控
- 该 workflow 接受现有发布标签，或当前完整的 40 字符 workflow 分支提交 SHA
- 在提交 SHA 模式下，它只接受当前 workflow 分支的 HEAD；对于较早的发布提交，请使用发布标签
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整的 40 字符 workflow 分支提交 SHA，而无需已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，workflow 仅为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个 workflow 都将真实发布和提升路径保留在 GitHub 托管的 runner 上，而不改变状态的验证路径则可以使用更大的 Blacksmith Linux runner
- 该 workflow 会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow 密钥
- npm 发布预检不再等待单独的发布检查通道
- 在批准之前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta / 修正标签）
- 在 npm 发布之后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta / 修正版版本），以在全新的临时前缀中验证已发布的 registry 安装路径
- 在 beta 发布之后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以便针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置以及真实的 Telegram E2E，使用共享的租赁 Telegram 凭证池。本地维护者的一次性检查可以省略 Convex 变量，改为直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` workflow 运行同样的发布后检查。它有意仅支持手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用“先预检，再提升”的方式：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支触发
  - stable npm 发布默认目标是 `beta`
  - stable npm 发布可以通过 workflow 输入显式指定目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以增强安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真正的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器还会检查相同临时前缀下从 `YYYY.M.D` 到 `YYYY.M.D-N` 的升级路径，以确保发布修正不会悄悄让较旧的全局安装继续停留在基础 stable 载荷上
- npm 发布预检默认采用封闭失败策略，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 内容，否则不会通过，这样我们就不会再次发布一个空的浏览器仪表板
- 发布后验证还会检查已发布的 registry 安装是否在根级 `dist/*` 布局下包含非空的内置插件运行时依赖。若发布时缺少这些依赖载荷或其内容为空，则发布后验证器会失败，且该版本不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在批准前重新生成并审查 `.github/workflows/ci.yml` 中由 planner 管理的 `checks-node-extensions` workflow 矩阵输出，以确保发布说明不会描述过时的 CI 布局
- Stable macOS 发布就绪还包括更新器相关界面：
  - GitHub release 最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保留非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM workflow 输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的
  40 字符 workflow 分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅执行验证 / 构建 / 打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径中必填，以便 workflow 复用成功预检运行准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：现有发布标签，或从 `main` 触发时用于验证的当前完整 40 字符 `main` 提交 SHA；从发布分支触发时，请使用现有发布标签或当前完整 40 字符发布分支提交 SHA

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 始终仅用于验证，并且也接受当前 workflow 分支提交 SHA
- 发布检查的提交 SHA 模式还要求该 SHA 是当前 workflow 分支 HEAD
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；workflow 会在继续发布前验证该元数据

## Stable npm 发布顺序

切一个 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在之前，你可以使用当前完整 workflow 分支提交 SHA，对预检 workflow 进行仅验证的演练
2. 在正常的 beta 优先流程中选择 `npm_dist_tag=beta`；只有当你明确要直接发布 stable 时才选择 `latest`
3. 当你希望获得完整的常规 CI 覆盖，而不是智能范围限定的合并覆盖时，在发布 ref 上运行手动 `CI` workflow
4. 使用相同标签，或相同的当前完整 workflow 分支提交 SHA，单独运行 `OpenClaw Release Checks`，以获得实时 prompt cache、QA Lab parity、Matrix 和 Telegram 覆盖
   - 之所以单独拆分，是为了让实时覆盖持续可用，而不必再次将长时间运行或可能不稳定的检查耦合回发布 workflow
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的 `tag`、相同的 `npm_dist_tag` 以及已保存的 `preflight_run_id`
7. 如果该发布先落在 `beta`，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow 将该 stable 版本从 `beta` 提升到 `latest`
8. 如果该发布是有意直接发布到 `latest`，并且 `beta` 也应立即跟随同一 stable 构建，请使用同一个私有 workflow 将两个 dist-tag 都指向该 stable 版本，或者让其计划中的自愈同步稍后再更新 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然需要
`NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样可以让直接发布路径和 beta 优先的提升路径都具备文档说明，并且对操作人员可见。

如果维护者必须回退到本地 npm 认证，请仅在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接在主智能体 shell 中调用 `op`；将其放在 tmux 中可以让提示、告警和 OTP 处理保持可观察，并防止重复的主机告警。

## 公开参考资料

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际的操作手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
