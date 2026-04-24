---
read_when:
    - デバイスモデル識別子マッピングまたは NOTICE / ライセンスファイルを更新している場合
    - Instances UI がデバイス名を表示する方法を変更している場合
summary: OpenClaw が macOS アプリで Apple デバイスのモデル識別子を分かりやすい名前にするために、どのようにそれを vendor しているか
title: デバイスモデルデータベース
x-i18n:
    generated_at: "2026-04-24T05:18:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# デバイスモデルデータベース（分かりやすい名前）

macOS コンパニオンアプリは、Apple のモデル識別子（例: `iPad16,6`, `Mac16,6`）を人が読める名前へマッピングすることで、**Instances** UI に分かりやすい Apple デバイスモデル名を表示します。

このマッピングは次の JSON として vendor されています:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## データソース

現在、このマッピングは次の MIT ライセンスのリポジトリから vendor しています:

- `kyle-seongwoo-jun/apple-device-identifiers`

ビルドを決定論的に保つため、JSON ファイルは特定の upstream commit に固定されています（`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` に記録）。

## データベースの更新

1. 固定したい upstream commit を選びます（iOS 用 1 つ、macOS 用 1 つ）。
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` の commit hash を更新します。
3. それらの commit に固定して JSON ファイルを再ダウンロードします:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` が引き続き upstream と一致していることを確認します（upstream ライセンスが変わった場合は置き換えてください）。
5. macOS アプリが警告なしで正常にビルドできることを確認します:

```bash
swift build --package-path apps/macos
```

## 関連

- [Nodes](/ja-JP/nodes)
- [Node troubleshooting](/ja-JP/nodes/troubleshooting)
