---
read_when:
    - 更新裝置型號識別碼對應或 NOTICE／授權檔案
    - 變更執行個體使用者介面顯示裝置名稱的方式
summary: OpenClaw 如何在 macOS 應用程式中內建 Apple 裝置型號識別碼，以顯示友善名稱。
title: 裝置型號資料庫
x-i18n:
    generated_at: "2026-04-30T03:36:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 16
---

macOS 輔助應用程式會在 **執行個體** UI 中顯示友善的 Apple 裝置型號名稱，方法是將 Apple 型號識別碼（例如 `iPad16,6`、`Mac16,6`）對應到人類可讀的名稱。

此對應以 JSON 形式內嵌於：

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 資料來源

我們目前從採用 MIT 授權的儲存庫內嵌此對應：

- `kyle-seongwoo-jun/apple-device-identifiers`

為了保持建置可重現，JSON 檔案會釘選到特定的上游提交（記錄於 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`）。

## 更新資料庫

1. 選擇要釘選的上游提交（一個用於 iOS，一個用於 macOS）。
2. 更新 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中的提交雜湊。
3. 重新下載 JSON 檔案，並釘選到這些提交：

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. 確認 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` 仍與上游相符（如果上游授權變更，請替換它）。
5. 驗證 macOS 應用程式能乾淨建置（沒有警告）：

```bash
swift build --package-path apps/macos
```

## 相關

- [Node](/zh-TW/nodes)
- [Node 疑難排解](/zh-TW/nodes/troubleshooting)
