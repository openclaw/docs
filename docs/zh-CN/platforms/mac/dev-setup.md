---
read_when:
    - 设置 macOS 开发环境
summary: 面向开发者的 OpenClaw macOS 应用设置指南
title: macOS 开发设置
x-i18n:
    generated_at: "2026-06-27T02:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 开发者设置

从源码构建并运行 OpenClaw macOS 应用。

## 前置条件

构建应用前，请确保已安装以下内容：

1. **Xcode 26.2+**：Swift 开发所必需。
2. **Node.js 24 和 pnpm**：推荐用于 Gateway 网关、CLI 和打包脚本。Node 22 LTS（目前为 `22.19+`）仍受支持以保持兼容性。

## 1. 安装依赖

安装整个项目的依赖：

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

> **注意**：临时签名的应用可能会触发安全提示。如果应用立即崩溃并显示 "Abort trap 6"，请参阅[故障排除](#troubleshooting)部分。

## 3. 安装 CLI

macOS 应用需要全局安装 `openclaw` CLI 来管理后台任务。

**安装方式（推荐）：**

1. 打开 OpenClaw 应用。
2. 前往**常规**设置标签页。
3. 点击**“安装 CLI”**。

也可以手动安装：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可用。
对于 Gateway 网关运行时，Node 仍是推荐路径。

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

### 授予权限时应用崩溃

如果你尝试允许**语音识别**或**麦克风**访问时应用崩溃，可能是 TCC 缓存损坏或签名不匹配导致的。

**修复：**

1. 重置 TCC 权限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失败，请临时更改 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，以强制 macOS 使用“干净初始状态”。

### Gateway 网关一直显示“正在启动...”

如果 Gateway 网关状态一直停留在“正在启动...”，请检查是否有僵尸进程占用了端口：

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手动运行的进程占用了端口，请停止该进程（Ctrl+C）。最后手段是终止你在上面找到的 PID。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [安装概览](/zh-CN/install)
