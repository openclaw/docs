---
read_when:
    - 设置 macOS 开发环境
summary: 面向开发 OpenClaw macOS 应用的开发者的设置指南
title: macOS 开发环境设置
x-i18n:
    generated_at: "2026-05-07T13:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 开发者设置

从源码构建并运行 OpenClaw macOS 应用程序。

## 前提条件

在构建应用前，请确保已安装以下内容：

1. **Xcode 26.2+**：Swift 开发所需。
2. **Node.js 24 和 pnpm**：推荐用于 Gateway 网关、CLI 和打包脚本。为保持兼容性，仍支持 Node 22 LTS，目前为 `22.16+`。

## 1. 安装依赖项

安装整个项目的依赖项：

```bash
pnpm install
```

## 2. 构建并打包应用

要构建 macOS 应用并将其打包到 `dist/OpenClaw.app`，运行：

```bash
./scripts/package-mac-app.sh
```

如果你没有 Apple Developer ID 证书，该脚本会自动使用 **ad-hoc 签名**（`-`）。

关于开发运行模式、签名标志和 Team ID 故障排除，请参阅 macOS 应用 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：ad-hoc 签名的应用可能会触发安全提示。如果应用立即崩溃并显示 "Abort trap 6"，请参阅[故障排除](#troubleshooting)部分。

## 3. 安装 CLI

macOS 应用需要全局安装 `openclaw` CLI 来管理后台任务。

**安装方式（推荐）：**

1. 打开 OpenClaw 应用。
2. 前往 **General** 设置标签页。
3. 点击 **“安装 CLI”**。

或者，也可以手动安装：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可以使用。
对于 Gateway 网关运行时，Node 仍是推荐路径。

## 故障排除

### 构建失败：工具链或 SDK 不匹配

macOS 应用构建需要最新的 macOS SDK 和 Swift 6.2 工具链。

**系统依赖项（必需）：**

- **Software Update 中可用的最新 macOS 版本**（Xcode 26.2 SDK 必需）
- **Xcode 26.2**（Swift 6.2 工具链）

**检查：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不匹配，请更新 macOS/Xcode，然后重新运行构建。

### 授予权限时应用崩溃

如果你尝试允许 **Speech Recognition** 或 **Microphone** 访问权限时应用崩溃，可能是 TCC 缓存损坏或签名不匹配导致的。

**修复：**

1. 重置 TCC 权限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失败，请临时更改 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，以强制 macOS 从“干净状态”开始。

### Gateway 网关一直停留在 "Starting..."

如果 Gateway 网关状态一直停留在 "Starting..."，请检查是否有僵尸进程占用了端口：

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手动运行的进程占用了端口，请停止该进程（Ctrl+C）。作为最后手段，请终止上面找到的 PID。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [安装概览](/zh-CN/install)
