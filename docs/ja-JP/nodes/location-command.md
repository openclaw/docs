---
read_when:
    - 位置情報ノードのサポートまたは権限 UI の追加
    - Android の位置情報権限またはフォアグラウンド動作の設計
summary: ノードの位置情報コマンド（location.get）、権限モード、Androidのフォアグラウンド動作
title: 場所コマンド
x-i18n:
    generated_at: "2026-07-05T11:34:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d0a4d3321a9b4d290461742edb63a7829aeacb082bff11f65e217443d755dc29
    source_path: nodes/location-command.md
    workflow: 16
---

## 要約

- `location.get` はノードコマンドで、`node.invoke` または `openclaw nodes location get` 経由で呼び出します。
- デフォルトではオフです。
- Android アプリの設定はセレクターを使用します: オフ / 使用中のみ。
- 正確な位置情報は別のトグルです。

## なぜスイッチだけでなくセレクターなのか

OS の位置情報権限は複数レベルです（iOS/macOS では使用中のみと常に許可が公開され、Android は現在フォアグラウンドのみをサポートします）。正確な位置情報も別の OS 権限です（iOS 14+ の「正確」、Android の「fine」と「coarse」）。アプリ内セレクターは要求するモードを決めますが、実際に付与される権限は引き続き OS が決定します。

## 設定モデル

ノードデバイスごと:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI の動作:

- `whileUsing` を選択すると、フォアグラウンド権限を要求します。
- OS が要求されたレベルを拒否した場合、アプリは付与済みの最上位レベルに戻し、ステータスを表示します。

## 権限マッピング（node.permissions）

任意です。macOS ノードは `node.list`/`node.describe` の `permissions` マップを介して `location` を報告します。iOS/Android では省略される場合があります。

## コマンド: `location.get`

`node.invoke` または CLI ヘルパー経由で呼び出します:

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

CLI フラグは直接対応します: `--location-timeout` -> `timeoutMs`、`--max-age` -> `maxAgeMs`、`--accuracy` -> `desiredAccuracy`。

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

## バックグラウンドでの動作

- Android アプリは、バックグラウンド状態では `location.get` を拒否します。Android で位置情報を要求する場合は OpenClaw を開いたままにしてください。
- 他のノードプラットフォームでは異なる場合があります。

## モデル/ツール連携

- エージェントツール: `nodes` ツールの `location_get` アクション（ノードが必須）。
- CLI: `openclaw nodes location get --node <id>`。
- エージェントガイドライン: ユーザーが位置情報を有効にしており、その範囲を理解している場合にのみ呼び出してください。

## UX コピー（推奨）

- オフ: 「位置情報の共有は無効です。」
- 使用中のみ: 「OpenClaw が開いているときのみ。」
- 正確: 「正確な GPS 位置情報を使用します。おおよその位置情報を共有するにはトグルをオフにします。」

## 関連

- [ノード概要](/ja-JP/nodes)
- [チャンネルの位置情報解析](/ja-JP/channels/location)
- [カメラ撮影](/ja-JP/nodes/camera)
- [トークモード](/ja-JP/nodes/talk)
