---
read_when:
    - 构建或签名 Mac 调试版本
summary: 由打包脚本生成的 macOS 调试构建的签名步骤
title: macOS 签名
x-i18n:
    generated_at: "2026-07-14T13:48:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac 签名（调试构建）

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建应用并将其打包到固定路径（`dist/OpenClaw.app`），然后调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 对其签名。TCC 权限与软件包 ID 和代码签名绑定；在多次重新构建之间保持两者稳定（并将应用置于固定路径），可防止 macOS 忘记 TCC 授权（通知、辅助功能、屏幕录制、麦克风、语音）。

- 调试软件包标识符默认为 `ai.openclaw.mac.debug`（可使用 `BUNDLE_ID=...` 覆盖）。
- Node：`>=22.22.3 <23`、`>=24.15.0 <25` 或 `>=25.9.0`（仓库 `package.json` `engines`）。打包程序还会构建 Control UI（`pnpm ui:build`）。
- 默认需要真实的签名身份；如果未找到签名身份且未设置 `ALLOW_ADHOC_SIGNING`，代码签名脚本将报错退出。临时签名（`SIGN_IDENTITY="-"`）需要显式选择启用，并且无法在重新构建后保留 TCC 权限。请参阅 [macOS 权限](/zh-CN/platforms/mac/permissions)。
- 从环境中读取 `SIGN_IDENTITY`（例如 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` 或 Developer ID Application 证书）。如果未提供，`codesign-mac-app.sh` 将按以下顺序自动选择身份：Developer ID Application、Apple Distribution、Apple Development，然后是找到的第一个有效代码签名身份。
- `CODESIGN_TIMESTAMP=auto`（默认）仅为 Developer ID Application 签名启用可信时间戳。设置 `on`/`off` 可强制启用或禁用。
- 使用 `OpenClawBuildTimestamp`（ISO8601 UTC）和 `OpenClawGitCommit`（短哈希，不可用时为 `unknown`）标记 Info.plist，使“关于”标签页可以显示构建、git 和调试/发布渠道。
- 签名后执行 Team ID 审计，如果软件包内任何 Mach-O 的 Team ID 不同，则操作失败。设置 `SKIP_TEAM_ID_CHECK=1` 可跳过此检查。

## 用法

```bash
# 从仓库根目录运行
scripts/package-mac-app.sh                                                      # 自动选择身份；如果未找到则报错
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 真实证书
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # 临时签名（权限不会保留）
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # 显式临时签名（同样有上述限制）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # 仅用于开发的 Sparkle Team ID 不匹配规避方法
```

### 临时签名说明

`SIGN_IDENTITY="-"` 会禁用强化运行时（`--options runtime`），以防应用加载 Team ID 不同的嵌入式框架（如 Sparkle）时崩溃。临时签名还会破坏 TCC 权限的持久保留；有关恢复步骤，请参阅 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## “关于”的构建元数据

“关于”标签页从 Info.plist 读取 `OpenClawBuildTimestamp` 和 `OpenClawGitCommit`，以显示版本、构建日期、git 提交，以及该构建是否为 DEBUG（通过 `#if DEBUG` 判断）。代码更改后请重新运行打包程序，以刷新这些值。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
