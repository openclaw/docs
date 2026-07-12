---
read_when:
    - 更新设备型号标识符映射或 NOTICE/许可证文件
    - 更改 Instances UI 显示设备名称的方式
summary: OpenClaw 如何在 macOS 应用中内置 Apple 设备型号标识符，以显示易读名称。
title: 设备型号数据库
x-i18n:
    generated_at: "2026-07-11T20:54:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

macOS 配套应用的 **Instances** UI 会将 Apple 型号标识符映射为易读名称（`iPad16,6` -> “iPad Pro 13 英寸（M4）”，`Mac16,6` -> “MacBook Pro（14 英寸，2024）”）。`DeviceModelCatalog` 还会使用标识符前缀（无法使用时回退到设备系列）为每台设备选择一个 SF Symbol。

`apps/macos/Sources/OpenClaw/Resources/DeviceModels/` 中的文件：

| 文件                                   | 用途                                  |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | iOS/iPadOS 标识符 -> 名称映射         |
| `mac-device-identifiers.json`          | Mac 标识符 -> 名称映射                |
| `NOTICE.md`                            | 固定的上游提交 SHA                    |
| `LICENSE.apple-device-identifiers.txt` | 上游 MIT 许可证                       |

## 数据来源

这些文件引入自采用 MIT 许可证的 GitHub 仓库 `kyle-seongwoo-jun/apple-device-identifiers`。JSON 文件固定到 `NOTICE.md` 中记录的提交 SHA，以确保构建具有确定性。

## 更新数据库

1. 选择要固定到的上游提交 SHA（iOS 和 macOS 各一个）。
2. 使用新的 SHA 更新 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`。
3. 重新下载固定到这些提交的 JSON 文件：

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. 确认 `LICENSE.apple-device-identifiers.txt` 仍与上游一致；如果上游许可证已更改，请替换该文件。
5. 验证 macOS 应用能够顺利构建：

```bash
swift build --package-path apps/macos
```

## 相关内容

- [节点](/zh-CN/nodes)
- [节点故障排查](/zh-CN/nodes/troubleshooting)
