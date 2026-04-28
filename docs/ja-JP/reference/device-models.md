---
read_when:
    - デバイス model identifier のマッピング、または NOTICE/license ファイルを更新する
    - Instances UI でデバイス名の表示方法を変更する
summary: OpenClaw が macOS アプリで Apple デバイスの model identifier を分かりやすい名前として表示するために、どのように vendor しているか。
title: デバイス model データベース
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:58:23Z"
  model: gpt-5.4
  provider: openai
  source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
  source_path: reference/device-models.md
  workflow: 15
---

macOS コンパニオンアプリは、Apple の model identifier（例: `iPad16,6`、`Mac16,6`）を人間が読みやすい名前へマッピングすることで、**Instances** UI に分かりやすい Apple デバイス model 名を表示します。

このマッピングは JSON として次に vendor されています。

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## データソース

現在、このマッピングは MIT ライセンスの次のリポジトリから vendor しています。

- `kyle-seongwoo-jun/apple-device-identifiers`

ビルドを決定的に保つため、JSON ファイルは特定の upstream commit に pin されています（`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` に記録）。

## データベースを更新する

1. pin したい upstream commit を選びます（iOS 用 1 つ、macOS 用 1 つ）。
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` の commit hash を更新します。
3. その commit に pin した JSON ファイルを再ダウンロードします。

```bash
IOS_COMMIT="<ios-device-identifiers.json 用の commit sha>"
MAC_COMMIT="<mac-device-identifiers.json 用の commit sha>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` が引き続き upstream と一致していることを確認してください（upstream のライセンスが変わっていたら置き換えてください）。
5. macOS アプリが警告なしでビルドできることを確認してください。

```bash
swift build --package-path apps/macos
```

## 関連

- [Nodes](/ja-JP/nodes)
- [Node troubleshooting](/ja-JP/nodes/troubleshooting)
