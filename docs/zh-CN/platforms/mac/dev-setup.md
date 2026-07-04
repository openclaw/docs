---
read_when:
    - 设置 macOS 开发环境
summary: 面向开发 OpenClaw macOS 应用的开发者设置指南
title: macOS 开发设置
x-i18n:
    generated_at: "2026-07-04T06:22:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 开发者设置

从源代码构建并运行 OpenClaw macOS 应用。

## 先决条件

构建应用前，请确保已安装以下内容：

1. **Xcode 26.2+**：Swift 开发所需。
2. **Node.js 24 和 pnpm**：推荐用于 Gateway 网关、CLI 和打包脚本。Node 22 LTS（当前为 `22.19+`）仍受支持，以保持兼容性。

## 1. 安装依赖

安装项目范围的依赖：

```bash
pnpm install
```

## 2. 构建并打包应用

要构建 macOS 应用并将其打包到 `dist/OpenClaw.app`，请运行：

```bash
./scripts/package-mac-app.sh
```

如果你没有 Apple Developer ID 证书，该脚本会自动使用**临时签名**（`-`）。

有关开发运行模式、签名标志和 Team ID 故障排除，请参阅 macOS 应用 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：临时签名的应用可能会触发安全提示。如果应用立即崩溃并显示 “Abort trap 6”，请参阅[故障排除](#troubleshooting)部分。

## 3. 安装 CLI 和 Gateway 网关

打包后的应用内嵌规范的 `scripts/install-cli.sh` 安装器。在全新的配置档中，在新手引导期间选择**这台 Mac**；应用会在启动 Gateway 网关向导前安装匹配的用户空间 CLI 和运行时。

对于手动开发恢复，请自行安装匹配的 CLI：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可用。对于 Gateway 网关运行时，Node 仍是推荐路径。

## 故障排除

### 构建失败：工具链或 SDK 不匹配

macOS 应用构建需要最新的 macOS SDK 和 Swift 6.2 工具链。

**系统依赖（必需）：**

- **Software Update 中可用的最新 macOS 版本**（Xcode 26.2 SDK 所需）
- **Xcode 26.2**（Swift 6.2 工具链）

**检查：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不匹配，请更新 macOS/Xcode，然后重新运行构建。

### 应用在授予权限时崩溃

如果你尝试允许**语音识别**或**麦克风**访问时应用崩溃，可能是因为 TCC 缓存损坏或签名不匹配。

**修复：**

1. 重置 TCC 权限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失败，请临时更改 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，以强制 macOS 从“全新状态”开始。

### Gateway 网关无限期显示“正在启动...”

如果 Gateway 网关状态一直停留在“正在启动...”，请检查是否有僵尸进程占用了端口：

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果某个手动运行的进程占用了端口，请停止该进程（Ctrl+C）。作为最后手段，终止你在上面找到的 PID。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [安装概览](/zh-CN/install)
