---
read_when:
    - 设置 macOS 开发环境
summary: OpenClaw macOS 应用开发者设置指南
title: macOS 开发环境设置
x-i18n:
    generated_at: "2026-07-16T11:42:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 开发者设置

从源代码构建并运行 OpenClaw macOS 应用。

## 前置要求

- **Xcode 26.2+**（Swift 6.2 工具链），并运行“软件更新”中
  可用的最新版 macOS。
- **Node.js 24.15+ 和 pnpm**，用于 Gateway 网关、CLI 和打包脚本。Node
  22.22.3+ 也可用。

## 1. 安装依赖项

```bash
pnpm install
```

## 2. 构建并打包应用

```bash
./scripts/package-mac-app.sh
```

输出到 `dist/OpenClaw.app`。如果没有 Apple Developer ID 证书，
脚本将回退到临时签名。

有关开发运行模式、签名标志和 Team ID 故障排查，请参阅
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)。
从仓库根目录启动快速开发循环：`scripts/restart-mac.sh`（临时签名需添加 `--no-sign`；
使用 `--no-sign` 时，TCC 权限不会保留）。

<Note>
临时签名的应用可能会触发安全提示。如果应用立即崩溃并显示
“Abort trap 6”，请参阅[故障排查](#troubleshooting)。
</Note>

## 3. 安装 CLI 和 Gateway 网关

打包后的应用内嵌标准的 `scripts/install-cli.sh` 安装程序。在
新配置中，请在新手引导期间选择 **This Mac**；应用会先安装匹配的
用户空间 CLI 和运行时，然后启动 Gateway 网关向导。

如需手动恢复开发环境，请自行安装匹配的 CLI：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也
可用。对于 Gateway 网关本身，仍建议使用 Node 运行时。

## 故障排查

### 构建失败：工具链或 SDK 不匹配

macOS 应用构建需要最新的 macOS SDK 和 Swift 6.2 工具链
（Xcode 26.2+）。

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不匹配，请更新 macOS/Xcode，然后重新运行构建。

### 授予权限时应用崩溃

如果尝试允许 **Speech Recognition** 或
**Microphone** 访问权限时应用崩溃，原因可能是 TCC 缓存损坏或签名不匹配。

1. 重置调试 bundle id 的 TCC 权限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失败，请暂时更改
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   中的 `BUNDLE_ID`，强制 macOS 使用全新状态。

### Gateway 网关一直显示“Starting...”

检查是否有僵尸进程占用端口：

```bash
openclaw gateway status
openclaw gateway stop

# 如果你未使用 LaunchAgent（开发模式/手动运行），请查找监听进程：
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手动运行的进程占用了端口，请停止它（Ctrl+C）；或者作为最后手段，
终止上面找到的 PID。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [安装概览](/zh-CN/install)
