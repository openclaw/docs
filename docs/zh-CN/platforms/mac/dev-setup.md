---
read_when:
    - 设置 macOS 开发环境
summary: OpenClaw macOS 应用开发者设置指南
title: macOS 开发设置
x-i18n:
    generated_at: "2026-04-24T04:05:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# macOS 开发者设置

本指南介绍从源码构建并运行 OpenClaw macOS 应用所需的步骤。

## 前置条件

在构建应用之前，请确保你已安装以下内容：

1. **Xcode 26.2+**：Swift 开发所必需。
2. **Node.js 24 和 pnpm**：推荐用于 Gateway 网关、CLI 和打包脚本。Node 22 LTS（当前为 `22.14+`）出于兼容性考虑仍受支持。

## 1. 安装依赖

安装整个项目范围的依赖：

```bash
pnpm install
```

## 2. 构建并打包应用

要构建 macOS 应用并将其打包到 `dist/OpenClaw.app`，请运行：

```bash
./scripts/package-mac-app.sh
```

如果你没有 Apple Developer ID 证书，该脚本会自动使用**临时签名**（`-`）。

有关 dev 运行模式、签名标志和 Team ID 故障排除，请参阅 macOS 应用 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：使用临时签名的应用可能会触发安全提示。如果应用立即因 “Abort trap 6” 崩溃，请参阅[故障排除](#故障排除)部分。

## 3. 安装 CLI

macOS 应用依赖全局安装的 `openclaw` CLI 来管理后台任务。

**安装方式（推荐）：**

1. 打开 OpenClaw 应用。
2. 前往**常规**设置标签页。
3. 点击 **“Install CLI”**。

或者，也可以手动安装：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可以。
对于 Gateway 网关运行时，Node 仍然是推荐方案。

## 故障排除

### 构建失败：工具链或 SDK 不匹配

macOS 应用构建要求使用最新的 macOS SDK 和 Swift 6.2 工具链。

**系统依赖（必需）：**

- **Software Update 中可用的最新 macOS 版本**（Xcode 26.2 SDK 所必需）
- **Xcode 26.2**（Swift 6.2 工具链）

**检查命令：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不匹配，请更新 macOS/Xcode，然后重新运行构建。

### 应用在授予权限时崩溃

如果你在允许**语音识别**或**麦克风**访问时应用崩溃，可能是因为 TCC 缓存损坏或签名不匹配。

**修复方法：**

1. 重置 TCC 权限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失败，请临时修改 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，以强制 macOS 生成一个“全新状态”。

### Gateway 网关一直显示 “Starting...”

如果 gateway 状态始终停留在 “Starting...”，请检查是否有僵尸进程占用了端口：

```bash
openclaw gateway status
openclaw gateway stop

# 如果你没有使用 LaunchAgent（dev 模式 / 手动运行），请查找监听进程：
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果是手动运行的进程占用了端口，请停止该进程（Ctrl+C）。作为最后手段，可以终止上面找到的 PID。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [安装概览](/zh-CN/install)
