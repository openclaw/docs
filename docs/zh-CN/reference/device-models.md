---
read_when:
    - 更新设备型号标识符映射或 NOTICE / 许可证文件
    - 更改 Instances UI 显示设备名称的方式
summary: OpenClaw 如何在 macOS 应用中内置 Apple 设备型号标识符，以显示友好名称。
title: 设备型号数据库
x-i18n:
    generated_at: "2026-04-24T18:10:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
    postprocess_version: locale-links-v1
---

macOS 配套应用会在 **Instances** UI 中显示友好的 Apple 设备型号名称，方法是将 Apple 型号标识符（例如 `iPad16,6`、`Mac16,6`）映射为人类可读的名称。

该映射以 JSON 形式内置在以下位置：

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 数据来源

我们当前从以下 MIT 许可仓库内置该映射：

- `kyle-seongwoo-jun/apple-device-identifiers`

为了保持构建的确定性，这些 JSON 文件被固定到特定的上游提交（记录在 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中）。

## 更新数据库

1. 选择你要固定的上游提交（一个用于 iOS，一个用于 macOS）。
2. 更新 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中的提交哈希。
3. 重新下载这些 JSON 文件，并固定到这些提交：

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. 确保 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` 仍与上游一致（如果上游许可证变更，请替换它）。
5. 验证 macOS 应用能够干净构建（无警告）：

```bash
swift build --package-path apps/macos
```

## 相关内容

- [节点](/zh-CN/nodes)
- [节点故障排除](/zh-CN/nodes/troubleshooting)
