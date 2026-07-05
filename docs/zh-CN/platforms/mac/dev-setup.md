---
read_when:
    - 设置 macOS 开发环境
summary: 面向开发 OpenClaw macOS 应用的开发者设置指南
title: macOS 开发环境设置
x-i18n:
    generated_at: "2026-07-05T11:26:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 开发者设置

从源码构建并运行 OpenClaw macOS 应用。

## 先决条件

- **Xcode 26.2+**（Swift 6.2 工具链），运行 Software Update 中可用的最新 macOS。
- **Node.js 24 和 pnpm**，用于 Gateway 网关、CLI 和打包脚本。Node 22.19+ 也可使用。

## 1. 安装依赖

```bash
pnpm install
```

## 2. 构建并打包应用

```bash
./scripts/package-mac-app.sh
```

输出 `dist/OpenClaw.app`。如果没有 Apple Developer ID 证书，该脚本会回退到 ad-hoc 签名。

关于开发运行模式、签名标志和 Team ID 故障排查，请参阅
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)。
从仓库根目录启动快速开发循环：`scripts/restart-mac.sh`（添加 `--no-sign` 可使用
ad-hoc 签名；TCC 权限不会随 `--no-sign` 保留）。

<Note>
ad-hoc 签名的应用可能会触发安全提示。如果应用立即崩溃并显示 "Abort trap 6"，请参阅[故障排查](#troubleshooting)。
</Note>

## 3. 安装 CLI 和 Gateway 网关

打包后的应用内嵌规范的 `scripts/install-cli.sh` 安装器。在全新配置文件中，在新手引导期间选择**这台 Mac**；应用会先安装匹配的用户空间 CLI 和运行时，然后启动 Gateway 网关向导。

如需手动开发恢复，请自行安装匹配的 CLI：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可使用。Node 仍然是 Gateway 网关本身推荐的运行时。

## 故障排查

### 构建失败：工具链或 SDK 不匹配

macOS 应用构建需要最新的 macOS SDK 和 Swift 6.2 工具链（Xcode 26.2+）。

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不匹配，请更新 macOS/Xcode 并重新运行构建。

### 应用在授予权限时崩溃

如果你尝试允许**语音识别**或**麦克风**访问时应用崩溃，原因可能是 TCC 缓存损坏或签名不匹配。

1. 重置调试 bundle id 的 TCC 权限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失败，请临时更改
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   中的 `BUNDLE_ID`，以强制 macOS 使用全新状态。

### Gateway 网关一直停留在“Starting...”

检查是否有僵尸进程占用了端口：

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果某次手动运行占用了端口，请停止它（Ctrl+C），或在万不得已时终止上面找到的 PID。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [安装概览](/zh-CN/install)
