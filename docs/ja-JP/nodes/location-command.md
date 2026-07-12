---
read_when:
    - 位置情報 Node のサポートまたは権限 UI の追加
    - Android の位置情報権限またはフォアグラウンド動作の設計
summary: Node の位置情報コマンド（location.get）、権限モード、Android のフォアグラウンド動作
title: 位置情報コマンド
x-i18n:
    generated_at: "2026-07-11T22:22:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## 要約

- `location.get` は Node コマンドで、`node.invoke` または `openclaw nodes location get` を介して呼び出します。
- デフォルトではオフです。
- Android のサードパーティビルドでは、オフ / 使用中のみ / 常に許可のセレクターを使用します。Play ビルドでは引き続きオフ / 使用中のみとなります。
- 正確な位置情報は別のトグルです。

## 単なるスイッチではなくセレクターを使う理由

OS の位置情報権限には複数のレベルがあります。正確な位置情報も OS で別途許可されます（iOS 14 以降の「正確」、Android の「高精度」と「概略」）。アプリ内のセレクターは要求するモードを指定しますが、実際に付与する権限は引き続き OS が決定します。

## 設定モデル

Node デバイスごとに設定します。

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI の動作:

- `whileUsing` を選択すると、フォアグラウンド権限を要求します。
- Android のサードパーティビルドで `always` を選択すると、最初にフォアグラウンド権限を要求し、バックグラウンドアクセスについて説明してから、別途 **Allow all the time** 権限を付与するための Android アプリ設定を開きます。
- Android Play ビルドでは、バックグラウンド位置情報権限を宣言せず、`always` も表示しません。
- OS が要求されたレベルを拒否した場合、アプリは付与済みのうち最も高いレベルに戻し、ステータスを表示します。

## 権限のマッピング（node.permissions）

任意です。macOS Node は `node.list`/`node.describe` の `permissions` マップを介して `location` を報告します。iOS/Android では省略される場合があります。

## コマンド: `location.get`

`node.invoke` または CLI ヘルパーを介して呼び出します。

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

パラメーター:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

CLI フラグは直接対応します。`--location-timeout` -> `timeoutMs`、`--max-age` -> `maxAgeMs`、`--accuracy` -> `desiredAccuracy`。

レスポンスのペイロード:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

エラー（安定したコード）:

- `LOCATION_DISABLED`: セレクターがオフです。
- `LOCATION_PERMISSION_REQUIRED`: 要求されたモードに必要な権限がありません。
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリがバックグラウンドにありますが、使用中のみの権限しか付与されていません。
- `LOCATION_TIMEOUT`: 時間内に位置情報を取得できませんでした。
- `LOCATION_UNAVAILABLE`: システム障害が発生したか、利用可能なプロバイダーがありません。

## バックグラウンドでの動作

- Android のサードパーティビルドでは、ユーザーが「常に許可」を選択し、Android がバックグラウンド位置情報を許可した場合にのみ、バックグラウンドで `location.get` を受け付けます。既存の常駐 Node サービスは `location` サービスタイプを追加し、アクティブな間は「位置情報: 常に許可」と明示します。
- Android Play ビルドと「使用中のみ」モードでは、バックグラウンド中の `location.get` を拒否します。
- 他の Node プラットフォームでは動作が異なる場合があります。

## モデルおよびツールとの統合

- エージェントツール: `nodes` ツールの `location_get` アクション（Node の指定が必要）。
- CLI: `openclaw nodes location get --node <id>`。
- エージェント向けガイドライン: ユーザーが位置情報を有効にし、その適用範囲を理解している場合にのみ呼び出してください。

## UX 文言（推奨）

- オフ: 「位置情報の共有は無効です。」
- 使用中のみ: 「OpenClaw を開いているときのみ。」
- 常に許可: 「OpenClaw がバックグラウンドにある間も、要求された位置情報の確認を許可します。」
- 正確: 「正確な GPS 位置情報を使用します。おおよその位置情報を共有するにはオフにしてください。」

## 関連項目

- [Node の概要](/ja-JP/nodes)
- [チャンネルの位置情報解析](/ja-JP/channels/location)
- [カメラ撮影](/ja-JP/nodes/camera)
- [トークモード](/ja-JP/nodes/talk)
