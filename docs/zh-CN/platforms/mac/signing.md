---
read_when:
    - 构建或签名 mac 调试构建时
summary: 由打包脚本生成的 macOS 调试构建的签名步骤
title: macOS 签名
x-i18n:
    generated_at: "2026-04-05T08:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac 签名（调试构建）

此应用通常通过 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建，该脚本现在会：

- 设置稳定的调试 bundle 标识符：`ai.openclaw.mac.debug`
- 使用该 bundle id 写入 Info.plist（可通过 `BUNDLE_ID=...` 覆盖）
- 调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 对主二进制文件和应用 bundle 进行签名，以便 macOS 将每次重建视为同一个已签名 bundle，并保留 TCC 权限（通知、辅助功能、屏幕录制、麦克风、语音）。要获得稳定权限，请使用真实的签名身份；ad-hoc 为可选启用，且不稳定（参见 [macOS permissions](/platforms/mac/permissions)）。
- 默认使用 `CODESIGN_TIMESTAMP=auto`；这会为 Developer ID 签名启用可信时间戳。设置 `CODESIGN_TIMESTAMP=off` 可跳过时间戳处理（离线调试构建）。
- 将构建元数据注入 Info.plist：`OpenClawBuildTimestamp`（UTC）和 `OpenClawGitCommit`（短哈希），以便“关于”面板显示构建信息、git 信息以及 debug/release 渠道。
- **打包默认使用 Node 24**：该脚本会运行 TS 构建和 Control UI 构建。Node 22 LTS，目前为 `22.14+`，出于兼容性考虑仍受支持。
- 从环境中读取 `SIGN_IDENTITY`。将 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 证书）添加到你的 shell rc 中，以便始终使用你的证书签名。ad-hoc 签名需要通过 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 显式启用（不建议用于权限测试）。
- 在签名后运行 Team ID 审计；如果应用 bundle 内任何 Mach-O 由不同的 Team ID 签名，则会失败。设置 `SKIP_TEAM_ID_CHECK=1` 可绕过此检查。

## 用法

```bash
# 在仓库根目录运行
scripts/package-mac-app.sh               # 自动选择身份；如果未找到则报错
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 真实证书
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc（权限不会保留）
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 显式 ad-hoc（同样有上述注意事项）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 仅限开发：绕过 Sparkle Team ID 不匹配问题
```

### Ad-hoc 签名说明

当使用 `SIGN_IDENTITY="-"`（ad-hoc）进行签名时，脚本会自动禁用 **Hardened Runtime**（`--options runtime`）。这是为了防止应用尝试加载不共享相同 Team ID 的嵌入式 framework（例如 Sparkle）时发生崩溃。ad-hoc 签名也会破坏 TCC 权限持久性；恢复步骤请参见 [macOS permissions](/platforms/mac/permissions)。

## “关于”中的构建元数据

`package-mac-app.sh` 会为 bundle 写入以下标记：

- `OpenClawBuildTimestamp`：打包时的 ISO8601 UTC 时间
- `OpenClawGitCommit`：简短 git 哈希（如不可用则为 `unknown`）

“关于”标签页会读取这些键，以显示版本、构建日期、git commit，以及它是否为调试构建（通过 `#if DEBUG`）。代码更改后，请运行打包脚本以刷新这些值。

## 原因

TCC 权限与 bundle 标识符 _以及_ 代码签名绑定。带有变化 UUID 的未签名调试构建会导致 macOS 在每次重建后忘记已授予的权限。对二进制文件进行签名（默认使用 ad‑hoc）并保持固定的 bundle id/路径（`dist/OpenClaw.app`）可在各次构建之间保留这些授权，这与 VibeTunnel 的做法一致。
