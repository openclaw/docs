---
read_when:
    - 更新裝置型號識別碼對應或 NOTICE／授權檔案
    - 變更執行個體 UI 顯示裝置名稱的方式
summary: OpenClaw 如何在 macOS 應用程式中內建 Apple 裝置型號識別碼，以顯示易於辨識的名稱。
title: 裝置型號資料庫
x-i18n:
    generated_at: "2026-07-11T21:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

macOS 輔助應用程式的 **執行個體** 使用者介面會將 Apple 型號識別碼對應為易於理解的名稱（`iPad16,6` ->「iPad Pro 13 吋（M4）」、`Mac16,6` ->「MacBook Pro（14 吋，2024）」）。`DeviceModelCatalog` 也會使用識別碼前綴（若無法使用則回退至裝置系列），為每部裝置選擇一個 SF Symbol。

`apps/macos/Sources/OpenClaw/Resources/DeviceModels/` 中的檔案：

| 檔案                                   | 用途                                  |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | iOS/iPadOS 識別碼 -> 名稱對應         |
| `mac-device-identifiers.json`          | Mac 識別碼 -> 名稱對應                |
| `NOTICE.md`                            | 固定的上游提交 SHA                    |
| `LICENSE.apple-device-identifiers.txt` | 上游 MIT 授權條款                     |

## 資料來源

從採用 MIT 授權的 GitHub 儲存庫 `kyle-seongwoo-jun/apple-device-identifiers` 引入。JSON 檔案固定至 `NOTICE.md` 中記錄的提交 SHA，以確保建置結果具確定性。

## 更新資料庫

1. 選擇要固定的上游提交 SHA（iOS 與 macOS 各一個）。
2. 使用新的 SHA 更新 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`。
3. 重新下載固定至這些提交的 JSON 檔案：

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. 確認 `LICENSE.apple-device-identifiers.txt` 仍與上游一致；若上游授權條款已有變更，請予以替換。
5. 驗證 macOS 應用程式能順利建置：

```bash
swift build --package-path apps/macos
```

## 相關內容

- [節點](/zh-TW/nodes)
- [節點疑難排解](/zh-TW/nodes/troubleshooting)
