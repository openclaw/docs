---
read_when:
    - 调试缺失或卡住的 macOS 权限提示
    - 决定是否向 node 或 CLI 运行时授予辅助功能权限
    - 打包或签名 macOS 应用
    - 更改 bundle ID 或应用安装路径
summary: macOS 权限持久化（TCC）和签名要求
title: macOS 权限
x-i18n:
    generated_at: "2026-06-27T02:32:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 权限授予很脆弱。TCC 会将权限授予与应用的代码签名、bundle identifier 和磁盘路径关联起来。如果其中任何一项发生变化，macOS 会把该应用视为新应用，并且可能丢弃或隐藏提示。

## 稳定权限的要求

- 相同路径：从固定位置运行应用（对于 OpenClaw，是 `dist/OpenClaw.app`）。
- 相同 bundle identifier：更改 bundle ID 会创建新的权限身份。
- 已签名应用：未签名或 ad-hoc 签名的构建不会持久保留权限。
- 一致签名：使用真实的 Apple Development 或 Developer ID 证书，确保签名在重新构建之间保持稳定。

ad-hoc 签名会在每次构建时生成新的身份。macOS 会忘记之前的授权，并且提示可能完全消失，直到清除过期条目。

## Node 和 CLI 运行时的辅助功能授权

优先将辅助功能授予 OpenClaw.app、Peekaboo.app，或另一个带有自身 bundle identifier 的已签名 helper，而不是通用的 `node` 二进制文件。

macOS TCC 会将辅助功能授予它看到的进程代码身份。如果 Homebrew、nvm、pnpm 或 npm 工作流导致共享的 `node` 可执行文件获得辅助功能权限，则通过同一个可执行文件启动的任何 JavaScript 包都可能继承 GUI 自动化权限。

将系统设置中的 `node` 条目视为该 Node 运行时的广泛权限，而不是某个 npm 包的权限。除非你信任通过该确切 Node 安装启动的每个脚本和包，否则不要向 `node` 授予辅助功能权限。

如果你意外向 `node` 授予了辅助功能权限，请从系统设置 -> 隐私与安全性 -> 辅助功能中移除该条目。然后向应拥有 UI 自动化权限的已签名应用或 helper 授权。

## 提示消失时的恢复检查清单

1. 退出应用。
2. 在系统设置 -> 隐私与安全性中移除应用条目。
3. 从相同路径重新启动应用并重新授予权限。
4. 如果提示仍未出现，请使用 `tccutil` 重置 TCC 条目，然后重试。
5. 某些权限只有在完整重启 macOS 后才会重新出现。

重置示例（按需替换 bundle ID）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 文件和文件夹权限（桌面/文稿/下载）

macOS 也可能会对终端/后台进程访问桌面、文稿和下载进行限制。如果文件读取或目录列表挂起，请向执行文件操作的同一进程上下文授予访问权限（例如 Terminal/iTerm、由 LaunchAgent 启动的应用，或 SSH 进程）。

变通方法：如果你想避免逐个文件夹授权，请将文件移入 OpenClaw 工作区（`~/.openclaw/workspace`）。

如果你在测试权限，请始终使用真实证书签名。ad-hoc 构建只适用于不涉及权限的快速本地运行。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 签名](/zh-CN/platforms/mac/signing)
