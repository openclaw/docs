---
read_when:
    - デバイスモデル識別子マッピングまたは NOTICE/ライセンスファイルの更新
    - Instances UI でのデバイス名の表示方法を変更する
summary: OpenClaw が macOS アプリでわかりやすい名前を表示するために Apple デバイスモデル識別子をベンダリングする方法。
title: デバイスモデルデータベース
x-i18n:
    generated_at: "2026-07-05T11:48:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

macOSコンパニオンアプリの **インスタンス** UI は、Appleモデル識別子をわかりやすい名前にマッピングします（`iPad16,6` -> "iPad Pro 13-inch (M4)"、`Mac16,6` -> "MacBook Pro (14-inch, 2024)"）。`DeviceModelCatalog` は識別子のプレフィックス（デバイスファミリーへのフォールバックあり）も使用して、デバイスごとに SF Symbol を選択します。

`apps/macos/Sources/OpenClaw/Resources/DeviceModels/` 内のファイル:

| ファイル                               | 目的                                  |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | iOS/iPadOS 識別子 -> 名前のマッピング |
| `mac-device-identifiers.json`          | Mac 識別子 -> 名前のマッピング        |
| `NOTICE.md`                            | 固定されたアップストリームのコミットSHA |
| `LICENSE.apple-device-identifiers.txt` | アップストリームの MIT ライセンス     |

## データソース

MITライセンスの `kyle-seongwoo-jun/apple-device-identifiers` GitHub リポジトリからベンダリングされています。JSONファイルは、ビルドの決定性を保つために `NOTICE.md` に記録されたコミットSHAに固定されています。

## データベースの更新

1. 固定するアップストリームのコミットSHAを選びます（iOS用に1つ、macOS用に1つ）。
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` を新しいSHAで更新します。
3. それらのコミットに固定されたJSONファイルを再ダウンロードします:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `LICENSE.apple-device-identifiers.txt` が引き続きアップストリームと一致していることを確認します。アップストリームのライセンスが変更されている場合は置き換えます。
5. macOSアプリが問題なくビルドされることを確認します:

```bash
swift build --package-path apps/macos
```

## 関連

- [Node](/ja-JP/nodes)
- [Nodeのトラブルシューティング](/ja-JP/nodes/troubleshooting)
