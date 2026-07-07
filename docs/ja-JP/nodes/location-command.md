---
read_when:
    - 位置情報ノードのサポートまたは権限 UI の追加
    - Android の位置情報権限またはフォアグラウンド動作の設計
summary: ノードの位置情報コマンド（location.get）、権限モード、および Android のフォアグラウンド動作
title: 場所コマンド
x-i18n:
    generated_at: "2026-07-06T21:48:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## 要約

- `location.get` はノードコマンドで、`node.invoke` または `openclaw nodes location get` 経由で呼び出します。
- デフォルトではオフです。
- Androidのサードパーティビルドではセレクターを使います: オフ / 使用中のみ / 常に。Playビルドではオフ / 使用中のみのままです。
- 正確な位置情報は別のトグルです。

## セレクターを使う理由（単なるスイッチではない理由）

OSの位置情報権限は複数レベルです。正確な位置情報も別のOS許可です（iOS 14以降の「正確」、Androidの「高精度」と「概略」）。アプリ内セレクターは要求するモードを制御しますが、実際の許可は引き続きOSが決定します。

## 設定モデル

ノードデバイスごと:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UIの動作:

- `whileUsing` を選択すると、フォアグラウンド権限を要求します。
- Androidのサードパーティビルドで `always` を選択すると、まずフォアグラウンド権限を要求し、バックグラウンドアクセスを説明してから、別個の**常に許可**の許可を得るためにAndroidアプリ設定を開きます。
- Android Playビルドでは、バックグラウンド位置情報権限を宣言せず、`always` も表示しません。
- OSが要求されたレベルを拒否した場合、アプリは許可済みの最高レベルに戻り、ステータスを表示します。

## 権限マッピング（node.permissions）

任意です。macOSノードは `node.list`/`node.describe` の `permissions` マップ経由で `location` を報告します。iOS/Androidでは省略される場合があります。

## コマンド: `location.get`

`node.invoke` 経由、またはCLIヘルパーで呼び出します:

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

CLIフラグは直接対応します: `--location-timeout` -> `timeoutMs`、`--max-age` -> `maxAgeMs`、`--accuracy` -> `desiredAccuracy`。

レスポンスペイロード:

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

エラー（安定コード）:

- `LOCATION_DISABLED`: セレクターがオフです。
- `LOCATION_PERMISSION_REQUIRED`: 要求されたモードに必要な権限がありません。
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリはバックグラウンド状態ですが、使用中のみの権限しか付与されていません。
- `LOCATION_TIMEOUT`: 時間内に位置を取得できませんでした。
- `LOCATION_UNAVAILABLE`: システム障害、またはプロバイダーがありません。

## バックグラウンド動作

- Androidのサードパーティビルドは、ユーザーが「常に」を選択し、Androidがバックグラウンド位置情報を許可している場合にのみ、バックグラウンドの `location.get` を受け付けます。既存の永続ノードサービスは `location` サービスタイプを追加し、アクティブな間は `Location: Always` を開示します。
- Android Playビルドと「使用中のみ」モードでは、バックグラウンド中の `location.get` を拒否します。
- 他のノードプラットフォームでは異なる場合があります。

## モデル/ツール連携

- エージェントツール: `nodes` ツールの `location_get` アクション（ノードが必須）。
- CLI: `openclaw nodes location get --node <id>`。
- エージェントガイドライン: ユーザーが位置情報を有効にし、スコープを理解している場合にのみ呼び出します。

## UX文言（推奨）

- オフ: 「位置情報の共有は無効です。」
- 使用中のみ: 「OpenClawが開いているときのみ。」
- 常に: 「OpenClawがバックグラウンドにある間も、要求された位置確認を許可します。」
- 正確: 「正確なGPS位置情報を使用します。オフにすると、おおよその位置情報を共有します。」

## 関連

- [ノード概要](/ja-JP/nodes)
- [チャンネル位置情報解析](/ja-JP/channels/location)
- [カメラキャプチャ](/ja-JP/nodes/camera)
- [トークモード](/ja-JP/nodes/talk)
