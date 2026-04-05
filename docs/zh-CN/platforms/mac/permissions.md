---
read_when:
    - 调试缺失或卡住的 macOS 权限提示
    - 打包或签名 macOS 应用
    - 更改 bundle ID 或应用安装路径
summary: macOS 权限持久性（TCC）和签名要求
title: macOS 权限
x-i18n:
    generated_at: "2026-04-05T08:37:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# macOS 权限（TCC）

macOS 的权限授予机制比较脆弱。TCC 会将某项权限授予与应用的
代码签名、bundle 标识符以及磁盘路径关联起来。如果其中任何一项发生变化，
macOS 就会将该应用视为新应用，并可能丢弃或隐藏权限提示。

## 保持权限稳定的要求

- 路径一致：从固定位置运行应用（对于 OpenClaw，为 `dist/OpenClaw.app`）。
- bundle 标识符一致：更改 bundle ID 会创建新的权限身份。
- 已签名的应用：未签名或使用 ad-hoc 签名的构建不会持久保存权限。
- 签名一致：使用真实的 Apple Development 或 Developer ID 证书，
  以便签名在每次重建之间保持稳定。

ad-hoc 签名会在每次构建时生成新的身份。macOS 会忘记之前的
权限授予，提示甚至可能完全消失，直到清除过期条目为止。

## 当提示消失时的恢复检查清单

1. 退出应用。
2. 在系统设置 -> 隐私与安全性中移除该应用条目。
3. 从相同路径重新启动应用，并重新授予权限。
4. 如果提示仍未出现，使用 `tccutil` 重置 TCC 条目后再试一次。
5. 某些权限只有在 macOS 完全重启后才会重新出现。

重置示例（根据需要替换 bundle ID）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 文件和文件夹权限（桌面 / 文稿 / 下载）

对于终端 / 后台进程，macOS 也可能会限制对桌面、文稿和下载文件夹的访问。如果读取文件或列出目录时发生卡顿，请为执行文件操作的同一进程上下文授予访问权限（例如 Terminal / iTerm、由 LaunchAgent 启动的应用，或 SSH 进程）。

解决方法：如果你想避免逐个文件夹授权，可以将文件移到 OpenClaw 工作区（`~/.openclaw/workspace`）。

如果你在测试权限，请始终使用真实证书进行签名。ad-hoc
构建只适用于不关心权限的快速本地运行场景。
