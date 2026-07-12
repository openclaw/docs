---
read_when:
    - 调试缺失或卡住的 macOS 权限提示
    - 决定是否向 Node.js 或 CLI 运行时授予辅助功能权限
    - 打包或签名 macOS 应用
    - 更改 Bundle ID 或应用安装路径
summary: macOS 权限持久性（TCC）和签名要求
title: macOS 权限
x-i18n:
    generated_at: "2026-07-11T20:42:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 权限授予机制较为脆弱。TCC 会将权限授予与应用的代码签名、包标识符和磁盘路径相关联。如果其中任何一项发生变化，macOS 都会将该应用视为新应用，并且可能不再显示或直接隐藏权限提示。

## 保持权限稳定的要求

- 路径相同：从固定位置运行应用（对于 OpenClaw，为 `dist/OpenClaw.app`）。
- 包标识符相同：OpenClaw 的包 ID 是 `ai.openclaw.mac`；更改它会创建新的权限身份。
- 应用已签名：未签名或使用临时签名的构建无法持久保留权限。
- 签名一致：使用真实的 Apple Development 或 Developer ID 证书，确保签名在重新构建后保持稳定。

临时签名会在每次构建时生成新的身份。macOS 会忘记之前授予的权限，并且在清除过期条目之前，权限提示可能完全消失。

## Node 和 CLI 运行时的辅助功能权限

应优先将辅助功能权限授予 OpenClaw.app、Peekaboo.app 或其他具有自身包标识符的已签名辅助程序，而不是通用的 `node` 二进制文件。

macOS TCC 会将辅助功能权限授予其所识别进程的代码身份。如果 Homebrew、nvm、pnpm 或 npm 工作流导致共享的 `node` 可执行文件获得辅助功能权限，则通过同一可执行文件启动的任何 JavaScript 软件包都可能继承 GUI 自动化权限。

应将系统设置中的 `node` 条目视为授予该 Node 运行时的广泛权限，而不是授予某个 npm 软件包的权限。除非你信任通过该 Node 安装启动的所有脚本和软件包，否则应避免向 `node` 授予辅助功能权限。

如果你不慎向 `node` 授予了辅助功能权限，请从 System Settings -> Privacy & Security -> Accessibility 中移除该条目。然后向应负责 UI 自动化的已签名应用或辅助程序授予权限。

## 权限提示消失时的恢复检查清单

1. 退出应用。
2. 在 System Settings -> Privacy & Security 中移除该应用的条目。
3. 从相同路径重新启动应用并重新授予权限。
4. 如果提示仍未出现，请使用 `tccutil` 重置 TCC 条目，然后重试。
5. 某些权限提示只有在完整重启 macOS 后才会重新出现。

重置示例（使用 OpenClaw 的包 ID `ai.openclaw.mac`）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 文件和文件夹权限（桌面/文稿/下载）

macOS 还可能限制终端或后台进程访问桌面、文稿和下载文件夹。如果读取文件或列出目录时卡住，请向实际执行文件操作的同一进程上下文授予访问权限（例如 Terminal/iTerm、由 LaunchAgent 启动的应用或 SSH 进程）。

规避方法：如果你希望避免逐个授予文件夹权限，可以将文件移入 OpenClaw 工作区（`~/.openclaw/workspace`）。

如果你正在测试权限，请始终使用真实证书进行签名。临时签名构建仅适用于权限无关紧要的快速本地运行。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 签名](/zh-CN/platforms/mac/signing)
