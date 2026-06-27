---
read_when:
    - 构建或签名 Mac 调试构建版本
summary: 由打包脚本生成的 macOS 调试构建的签名步骤
title: macOS 签名
x-i18n:
    generated_at: "2026-06-27T02:32:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac 签名（调试构建）

此应用通常通过 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建；它现在会：

- 设置稳定的调试 bundle identifier：`ai.openclaw.mac.debug`
- 使用该 bundle id 写入 Info.plist（可通过 `BUNDLE_ID=...` 覆盖）
- 调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 对主二进制文件和应用 bundle 进行签名，使 macOS 将每次重新构建都视为同一个已签名 bundle，并保留 TCC 权限（通知、辅助功能、屏幕录制、麦克风、语音）。若要获得稳定权限，请使用真实签名身份；ad-hoc 是显式选择启用的，并且很脆弱（见 [macOS 权限](/zh-CN/platforms/mac/permissions)）。
- 默认使用 `CODESIGN_TIMESTAMP=auto`；它会为 Developer ID 签名启用可信时间戳。设置 `CODESIGN_TIMESTAMP=off` 可跳过时间戳（离线调试构建）。
- 将构建元数据注入 Info.plist：`OpenClawBuildTimestamp`（UTC）和 `OpenClawGitCommit`（短哈希），以便“关于”面板显示构建、git 以及调试/发布渠道。
- **打包默认使用 Node 24**：该脚本会运行 TS 构建和 Control UI 构建。Node 22 LTS（当前为 `22.19+`）仍受支持以保持兼容性。
- 从环境中读取 `SIGN_IDENTITY`。将 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 证书）添加到你的 shell rc，即可始终使用你的证书签名。ad-hoc 签名需要通过 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 显式选择启用（不建议用于权限测试）。
- 签名后运行 Team ID 审计；如果应用 bundle 中任何 Mach-O 由不同 Team ID 签名，则失败。设置 `SKIP_TEAM_ID_CHECK=1` 可绕过。

## 用法

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Ad-hoc 签名说明

使用 `SIGN_IDENTITY="-"`（ad-hoc）签名时，脚本会自动禁用 **Hardened Runtime**（`--options runtime`）。这是为了防止应用尝试加载嵌入式 framework（如 Sparkle）时因 Team ID 不一致而崩溃。Ad-hoc 签名还会破坏 TCC 权限持久性；恢复步骤见 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## “关于”的构建元数据

`package-mac-app.sh` 会在 bundle 中写入：

- `OpenClawBuildTimestamp`：打包时的 ISO8601 UTC
- `OpenClawGitCommit`：短 git 哈希（如果不可用则为 `unknown`）

“关于”标签页会读取这些键，以显示版本、构建日期、git commit，以及它是否为调试构建（通过 `#if DEBUG`）。代码变更后运行打包器以刷新这些值。

## 原因

TCC 权限绑定到 bundle identifier _和_ 代码签名。带有变化 UUID 的未签名调试构建会导致 macOS 在每次重新构建后忘记授权。对二进制文件签名（默认 ad-hoc）并保持固定的 bundle id/路径（`dist/OpenClaw.app`）可在构建之间保留授权，与 VibeTunnel 方法一致。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
