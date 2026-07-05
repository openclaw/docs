---
read_when:
    - 构建或签名 mac 调试版本
summary: 由打包脚本生成的 macOS 调试构建的签名步骤
title: macOS 签名
x-i18n:
    generated_at: "2026-07-05T11:28:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 签名（调试构建）

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 会构建应用并将其打包到固定路径（`dist/OpenClaw.app`），然后调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 对其签名。TCC 权限与 bundle ID 和代码签名绑定；在重新构建之间保持二者稳定（并让应用保持在固定路径）可避免 macOS 忘记 TCC 授权（通知、辅助功能、屏幕录制、麦克风、语音）。

- 调试 bundle 标识符默认为 `ai.openclaw.mac.debug`（可用 `BUNDLE_ID=...` 覆盖）。
- Node：`>=22.19.0 <23` 或 `>=23.11.0`（仓库 `package.json` 的 `engines`）。打包器还会构建 Control UI（`pnpm ui:build`）。
- 默认需要真实签名身份；如果未找到签名身份且未设置 `ALLOW_ADHOC_SIGNING`，codesign 脚本会报错退出。Ad-hoc 签名（`SIGN_IDENTITY="-"`）是显式选择启用，并且不会在重新构建之间保留 TCC 权限。参见 [macOS 权限](/zh-CN/platforms/mac/permissions)。
- 从环境读取 `SIGN_IDENTITY`（例如 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`，或 Developer ID Application 证书）。如果没有设置，`codesign-mac-app.sh` 会按以下顺序自动选择身份：Developer ID Application、Apple Distribution、Apple Development，然后是找到的第一个有效代码签名身份。
- `CODESIGN_TIMESTAMP=auto`（默认）仅为 Developer ID Application 签名启用可信时间戳。设置为 `on`/`off` 可强制启用或关闭。
- 在 Info.plist 中写入 `OpenClawBuildTimestamp`（ISO8601 UTC）和 `OpenClawGitCommit`（短哈希；不可用时为 `unknown`），以便 About 标签页显示构建、git 和调试/发布渠道。
- 签名后运行 Team ID 审计；如果 bundle 内任何 Mach-O 的 Team ID 不同，则失败。设置 `SKIP_TEAM_ID_CHECK=1` 可跳过。

## 用法

```bash
# from repo root
scripts/package-mac-app.sh                                                      # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # dev-only Sparkle Team ID mismatch workaround
```

### Ad-hoc 签名说明

`SIGN_IDENTITY="-"` 会禁用 Hardened Runtime（`--options runtime`），以防应用加载未共享相同 Team ID 的嵌入式框架（如 Sparkle）时崩溃。Ad-hoc 签名也会破坏 TCC 权限持久化；恢复步骤请参见 [macOS 权限](/zh-CN/platforms/mac/permissions)。

## About 的构建元数据

About 标签页会从 Info.plist 读取 `OpenClawBuildTimestamp` 和 `OpenClawGitCommit`，用于显示版本、构建日期、git commit，以及该构建是否为 DEBUG（通过 `#if DEBUG`）。代码更改后重新运行打包器以刷新这些值。

## 相关

- [macOS app](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
