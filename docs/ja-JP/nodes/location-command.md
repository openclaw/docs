---
read_when:
    - location ノードのサポートまたは権限 UI の追加
    - Android の位置情報権限またはフォアグラウンド動作を設計する
summary: ノードの位置情報コマンド（location.get）、権限モード、Android のフォアグラウンド動作
title: 位置情報コマンド
x-i18n:
    generated_at: "2026-05-06T05:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## 要約

- `location.get` はノードコマンドです（`node.invoke` 経由）。
- デフォルトではオフです。
- Android アプリ設定ではセレクターを使います: オフ / 使用中のみ。
- 別のトグル: 正確な位置情報。

## セレクターを使う理由（単なるスイッチではない理由）

OS の権限は複数レベルです。アプリ内でセレクターを表示できますが、実際の許可は引き続き OS が決定します。

- iOS/macOS では、システムプロンプト/設定に **使用中のみ** または **常に許可** が表示される場合があります。
- Android アプリは現在、フォアグラウンドの位置情報のみをサポートしています。
- 正確な位置情報は別の許可です（iOS 14+ の「正確」、Android の「fine」と「coarse」）。

UI のセレクターは要求モードを制御します。実際の許可は OS 設定にあります。

## 設定モデル

ノードデバイスごと:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI の動作:

- `whileUsing` を選択すると、フォアグラウンド権限を要求します。
- OS が要求レベルを拒否した場合は、許可済みの最上位レベルに戻し、ステータスを表示します。

## 権限マッピング（node.permissions）

任意です。macOS ノードは権限マップ経由で `location` を報告します。iOS/Android では省略される場合があります。

## コマンド: `location.get`

`node.invoke` 経由で呼び出します。

パラメーター（推奨）:

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリがバックグラウンドにありますが、使用中のみが許可されています。
- `LOCATION_TIMEOUT`: 時間内に位置を取得できませんでした。
- `LOCATION_UNAVAILABLE`: システム障害 / プロバイダーがありません。

## バックグラウンド動作

- Android アプリは、バックグラウンド中の `location.get` を拒否します。
- Android で位置情報を要求するときは、OpenClaw を開いたままにしてください。
- 他のノードプラットフォームでは異なる場合があります。

## モデル/ツール統合

- ツールサーフェス: `nodes` ツールは `location_get` アクションを追加します（ノードが必須）。
- CLI: `openclaw nodes location get --node <id>`。
- エージェントガイドライン: ユーザーが位置情報を有効にしており、そのスコープを理解している場合にのみ呼び出します。

## UX コピー（推奨）

- オフ: 「位置情報共有は無効です。」
- 使用中のみ: 「OpenClaw が開いているときのみ。」
- 正確: 「正確な GPS 位置情報を使用します。おおよその位置情報を共有するにはトグルをオフにします。」

## 関連

- [チャンネル位置情報の解析](/ja-JP/channels/location)
- [カメラキャプチャ](/ja-JP/nodes/camera)
- [トークモード](/ja-JP/nodes/talk)
