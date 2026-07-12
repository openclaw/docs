---
read_when:
    - デバイスモデル識別子のマッピングまたはNOTICE/ライセンスファイルの更新
    - インスタンス UI でのデバイス名の表示方法を変更する
summary: OpenClaw が macOS アプリでわかりやすい名前を表示するために、Apple デバイスのモデル識別子をベンダリングする方法。
title: デバイスモデルデータベース
x-i18n:
    generated_at: "2026-07-11T22:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

macOSコンパニオンアプリの**インスタンス**UIでは、Appleのモデル識別子をわかりやすい名前に対応付けます（`iPad16,6` -> 「iPad Pro 13インチ（M4）」、`Mac16,6` -> 「MacBook Pro（14インチ、2024）」）。`DeviceModelCatalog`は、デバイスごとのSF Symbolを選択する際にも識別子のプレフィックスを使用し、該当しない場合はデバイスファミリーにフォールバックします。

`apps/macos/Sources/OpenClaw/Resources/DeviceModels/`内のファイル：

| ファイル                               | 用途                                  |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | iOS/iPadOS識別子 -> 名前の対応付け    |
| `mac-device-identifiers.json`          | Mac識別子 -> 名前の対応付け           |
| `NOTICE.md`                            | 固定された上流コミットSHA             |
| `LICENSE.apple-device-identifiers.txt` | 上流のMITライセンス                   |

## データソース

MITライセンスのGitHubリポジトリ`kyle-seongwoo-jun/apple-device-identifiers`からベンダー化しています。ビルドの再現性を確保するため、JSONファイルは`NOTICE.md`に記録されたコミットSHAに固定されています。

## データベースの更新

1. 固定する上流コミットSHAを選択します（iOS用とmacOS用に1つずつ）。
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`を新しいSHAで更新します。
3. それらのコミットに固定されたJSONファイルを再ダウンロードします。

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `LICENSE.apple-device-identifiers.txt`が引き続き上流と一致していることを確認します。上流のライセンスが変更されている場合は置き換えます。
5. macOSアプリが問題なくビルドされることを確認します。

```bash
swift build --package-path apps/macos
```

## 関連項目

- [Node](/ja-JP/nodes)
- [Nodeのトラブルシューティング](/ja-JP/nodes/troubleshooting)
