---
read_when:
    - 构建或签署 mac 调试构建时
summary: 打包脚本生成的 macOS 调试构建的签名步骤
title: macOS 签名
x-i18n:
    generated_at: "2026-04-24T04:05:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac 签名（调试构建）

此应用通常通过 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建，该脚本现在会：

- 设置一个稳定的调试 bundle identifier：`ai.openclaw.mac.debug`
- 将该 bundle id 写入 Info.plist（可通过 `BUNDLE_ID=...` 覆盖）
- 调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 对主二进制文件和应用 bundle 进行签名，使 macOS 将每次重建视为同一个已签名 bundle，并保留 TCC 权限（通知、辅助功能、屏幕录制、麦克风、语音）。要获得稳定权限，请使用真实签名身份；ad-hoc 需显式选择加入，且不稳定（参见 [macOS 权限](/zh-CN/platforms/mac/permissions)）。
- 默认使用 `CODESIGN_TIMESTAMP=auto`；它会为 Developer ID 签名启用可信时间戳。设置 `CODESIGN_TIMESTAMP=off` 可跳过时间戳（离线调试构建）。
- 将构建元数据注入 Info.plist：`OpenClawBuildTimestamp`（UTC）和 `OpenClawGitCommit`（短哈希），这样 About 面板可以显示构建、git 以及 debug/release 渠道。
- **打包默认使用 Node 24**：该脚本会运行 TS 构建和 Control UI 构建。Node 22 LTS（当前为 `22.14+`）仍受支持以保持兼容性。
- 从环境中读取 `SIGN_IDENTITY`。将 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 证书）加入你的 shell rc，即可始终使用你的证书进行签名。ad-hoc 签名需要通过 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 显式选择加入（不建议用于权限测试）。
- 在签名后运行 Team ID 审计；如果应用 bundle 内任意 Mach-O 由不同的 Team ID 签名，则会失败。设置 `SKIP_TEAM_ID_CHECK=1` 可绕过。

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

当使用 `SIGN_IDENTITY="-"`（ad-hoc）签名时，脚本会自动禁用 **Hardened Runtime**（`--options runtime`）。这是防止应用在尝试加载 Team ID 不同的嵌入式 framework（如 Sparkle）时崩溃所必需的。ad-hoc 签名同样会破坏 TCC 权限持久化；恢复步骤请参阅 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## 用于 About 的构建元数据

`package-mac-app.sh` 会为 bundle 打上以下标记：

- `OpenClawBuildTimestamp`：打包时的 ISO8601 UTC 时间
- `OpenClawGitCommit`：短 git 哈希（如果不可用则为 `unknown`）

About 标签页会读取这些键，以显示版本、构建日期、git commit，以及它是否为调试构建（通过 `#if DEBUG`）。代码更改后，请重新运行打包脚本以刷新这些值。

## 原因

TCC 权限绑定于 bundle identifier _和_ 代码签名。带有不断变化 UUID 的未签名调试构建会导致 macOS 在每次重建后遗忘授权。对二进制文件进行签名（默认是 ad-hoc）并保持固定 bundle id/路径（`dist/OpenClaw.app`），可以在构建之间保留这些授权，与 VibeTunnel 的做法一致。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
