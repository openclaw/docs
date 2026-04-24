---
read_when:
    - 位置情報 Node サポートまたは権限 UI を追加する場合
    - Android の位置情報権限やフォアグラウンド動作を設計する場合
summary: Node 向けの位置情報コマンド（location.get）、権限モード、Android のフォアグラウンド動作
title: 位置情報コマンド
x-i18n:
    generated_at: "2026-04-24T05:06:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## TL;DR

- `location.get` は Node コマンドです（`node.invoke` 経由）。
- デフォルトではオフです。
- Android アプリ設定ではセレクターを使います: Off / While Using。
- 別トグル: Precise Location。

## なぜスイッチではなくセレクターなのか

OS 権限は複数レベルあります。アプリ内ではセレクターを公開できますが、実際の許可は引き続き OS が決定します。

- iOS/macOS では、システムプロンプト/設定で **While Using** または **Always** が表示されることがあります。
- Android アプリは現在フォアグラウンド位置情報のみをサポートします。
- Precise location は別個の許可です（iOS 14+ の「Precise」、Android の「fine」vs「coarse」）。

UI 上のセレクターは、こちらが要求するモードを決めます。実際の許可は OS 設定側にあります。

## 設定モデル

Node デバイスごと:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 動作:

- `whileUsing` を選ぶと、フォアグラウンド権限を要求します。
- OS が要求レベルを拒否した場合、実際に付与された最高レベルに戻し、状態を表示します。

## 権限マッピング（node.permissions）

任意です。macOS Node は permissions map 経由で `location` を報告します。iOS/Android は省略する場合があります。

## コマンド: `location.get`

`node.invoke` 経由で呼び出します。

パラメータ（推奨）:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

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
- `LOCATION_PERMISSION_REQUIRED`: 要求モードに必要な権限がありません。
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリがバックグラウンドにありますが、While Using のみ許可されています。
- `LOCATION_TIMEOUT`: 時間内に位置が取得できませんでした。
- `LOCATION_UNAVAILABLE`: システム障害 / 利用可能なプロバイダーなし。

## バックグラウンド動作

- Android アプリは、バックグラウンド時に `location.get` を拒否します。
- Android で位置情報を要求するときは OpenClaw を開いたままにしてください。
- 他の Node プラットフォームでは異なる場合があります。

## モデル/ツール統合

- ツールサーフェス: `nodes` ツールに `location_get` アクションを追加します（Node 必須）。
- CLI: `openclaw nodes location get --node <id>`。
- エージェントガイドライン: ユーザーが位置情報を有効にし、スコープを理解している場合にのみ呼び出します。

## UX 文言（推奨）

- Off: 「位置情報共有は無効です。」
- While Using: 「OpenClaw を開いているときのみ。」
- Precise: 「正確な GPS 位置情報を使用します。おおよその位置情報を共有するにはオフにしてください。」

## 関連

- [チャンネル位置情報解析](/ja-JP/channels/location)
- [カメラキャプチャ](/ja-JP/nodes/camera)
- [Talk mode](/ja-JP/nodes/talk)
