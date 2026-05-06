---
read_when:
    - 构建或签名 Mac 调试构建
summary: 打包脚本生成的 macOS 调试构建的签名步骤
title: macOS 签名
x-i18n:
    generated_at: "2026-05-06T06:16:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 签名（调试构建）

此应用通常通过 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建，该脚本现在会：

- 设置稳定的调试包标识符：`ai.openclaw.mac.debug`
- 使用该包 ID 写入 Info.plist（可通过 `BUNDLE_ID=...` 覆盖）
- 调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 对主二进制文件和应用包进行签名，使 macOS 将每次重建都视为同一个已签名包，并保留 TCC 权限（通知、辅助功能、屏幕录制、麦克风、语音）。若要获得稳定权限，请使用真实签名身份；临时签名需要显式选择启用，且较脆弱（参见 [macOS 权限](/zh-CN/platforms/mac/permissions)）。
- 默认使用 `CODESIGN_TIMESTAMP=auto`；它会为 Developer ID 签名启用可信时间戳。设置 `CODESIGN_TIMESTAMP=off` 可跳过时间戳（离线调试构建）。
- 将构建元数据注入 Info.plist：`OpenClawBuildTimestamp`（UTC）和 `OpenClawGitCommit`（短哈希），以便“关于”面板显示构建、git 以及调试/发布渠道。
- **打包默认使用 Node 24**：脚本会运行 TS 构建和 Control UI 构建。Node 22 LTS（当前为 `22.14+`）仍受支持以保持兼容性。
- 从环境读取 `SIGN_IDENTITY`。将 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 证书）添加到 shell rc 中，即可始终使用你的证书签名。临时签名需要通过 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 显式选择启用（不建议用于权限测试）。
- 签名后运行团队 ID 审核，如果应用包内任何 Mach-O 由不同团队 ID 签名，则失败。设置 `SKIP_TEAM_ID_CHECK=1` 可绕过。

## 用法

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### 临时签名说明

使用 `SIGN_IDENTITY="-"`（临时签名）签名时，脚本会自动禁用 **强化运行时**（`--options runtime`）。这是必要的，可防止应用尝试加载未共享同一团队 ID 的嵌入式框架（如 Sparkle）时发生崩溃。临时签名也会破坏 TCC 权限持久性；恢复步骤见 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## “关于”的构建元数据

`package-mac-app.sh` 会使用以下内容标记包：

- `OpenClawBuildTimestamp`：打包时的 ISO8601 UTC
- `OpenClawGitCommit`：短 git 哈希（不可用时为 `unknown`）

“关于”标签页会读取这些键，以显示版本、构建日期、git 提交，以及它是否为调试构建（通过 `#if DEBUG`）。代码更改后运行打包器以刷新这些值。

## 原因

TCC 权限绑定到包标识符和代码签名。带有变化 UUID 的未签名调试构建会导致 macOS 在每次重建后忘记授权。签署二进制文件（默认使用临时签名）并保持固定的包 ID/路径（`dist/OpenClaw.app`）可在构建之间保留授权，与 VibeTunnel 方法一致。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
