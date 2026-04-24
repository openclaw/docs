---
read_when:
    - 调试缺失或卡住的 macOS 权限提示框
    - 打包或签名 macOS 应用
    - 更改 bundle ID 或应用安装路径
summary: macOS 权限持久化（TCC）与签名要求
title: macOS 权限
x-i18n:
    generated_at: "2026-04-24T04:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

macOS 权限授予很脆弱。TCC 会将权限授予与应用的
代码签名、bundle identifier 以及磁盘路径关联起来。如果其中任何一项发生变化，
macOS 都会将该应用视为新应用，并可能丢弃或隐藏提示框。

## 稳定权限的要求

- 相同路径：从固定位置运行应用（对于 OpenClaw，即 `dist/OpenClaw.app`）。
- 相同 bundle identifier：更改 bundle ID 会创建新的权限身份。
- 已签名应用：未签名或 ad-hoc 签名的构建不会持久保留权限。
- 一致的签名：使用真实的 Apple Development 或 Developer ID 证书，
  这样签名在多次重建之间才能保持稳定。

ad-hoc 签名每次构建都会生成一个新的身份。macOS 会忘记之前的
授权，而且在清除过期条目之前，提示框甚至可能完全消失。

## 当提示框消失时的恢复清单

1. 退出应用。
2. 在系统设置 -> 隐私与安全性中移除该应用条目。
3. 从相同路径重新启动应用，并重新授予权限。
4. 如果提示框仍未出现，使用 `tccutil` 重置 TCC 条目后再试一次。
5. 某些权限只有在 macOS 完全重启后才会再次出现。

重置示例（根据需要替换 bundle ID）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 文件与文件夹权限（Desktop/Documents/Downloads）

macOS 也可能会对终端/后台进程访问 Desktop、Documents 和 Downloads 进行限制。如果文件读取或目录列举卡住，请将访问权限授予执行文件操作的同一进程上下文（例如 Terminal/iTerm、由 LaunchAgent 启动的应用，或 SSH 进程）。

变通方法：如果你想避免按文件夹分别授权，可将文件移动到 OpenClaw 工作区（`~/.openclaw/workspace`）。

如果你在测试权限，请始终使用真实证书签名。ad-hoc
构建只适用于权限无关的快速本地运行。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 签名](/zh-CN/platforms/mac/signing)
