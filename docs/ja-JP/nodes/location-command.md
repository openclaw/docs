---
read_when:
    - 位置情報 Node のサポートまたは権限 UI の追加
    - Androidの位置情報権限またはフォアグラウンド動作の設計
summary: Node の位置情報コマンド、プラットフォームの権限モード、Linux GeoClue のセットアップ
title: 位置情報コマンド
x-i18n:
    generated_at: "2026-07-16T11:58:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## 要約

- `location.get` は Node コマンドであり、`node.invoke` または `openclaw nodes location get` を介して呼び出されます。
- デフォルトではオフです。
- Android のサードパーティビルドでは、セレクターとして「オフ / 使用中のみ / 常に」を使用します。Play ビルドでは引き続き「オフ / 使用中のみ」となります。
- 正確な位置情報は別のトグルです。

## 単なるスイッチではなくセレクターを使用する理由

OS の位置情報権限には複数のレベルがあります。正確な位置情報も別個の OS 権限です（iOS 14 以降の「正確」、Android の「高精度」と「おおよそ」）。アプリ内セレクターによって要求するモードが決まりますが、実際に付与する権限は引き続き OS が決定します。

## 設定モデル

Node デバイスごと:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI の動作:

- `whileUsing`を選択すると、フォアグラウンド権限を要求します。
- Android のサードパーティビルドで`always`を選択すると、まずフォアグラウンド権限を要求し、バックグラウンドアクセスについて説明した後、個別の **Allow all the time** 権限を付与するために Android のアプリ設定を開きます。
- Android Play ビルドでは、バックグラウンド位置情報権限を宣言せず、`always`も表示しません。
- OS が要求されたレベルを拒否した場合、アプリは付与済みの最高レベルに戻し、ステータスを表示します。

## 権限のマッピング（node.permissions）

任意です。macOS Node は、`node.list`/`node.describe`の`permissions`マップを介して`location`を報告します。iOS/Android では省略される場合があります。

## コマンド: `location.get`

`node.invoke`または CLI ヘルパーを介して呼び出します:

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

エラー（安定したコード）:

- `LOCATION_DISABLED`: セレクターがオフです。
- `LOCATION_PERMISSION_REQUIRED`: 要求されたモードに必要な権限がありません。
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリはバックグラウンドにありますが、「使用中のみ」の権限しか付与されていません。
- `LOCATION_TIMEOUT`: 時間内に位置情報を取得できませんでした。
- `LOCATION_UNAVAILABLE`: システム障害が発生したか、プロバイダーがありません。

## バックグラウンドでの動作

- Android のサードパーティビルドは、ユーザーが`Always`を選択し、Android がバックグラウンド位置情報を許可した場合にのみ、バックグラウンドでの`location.get`を受け付けます。既存の常駐 Node サービスは、アクティブな間、`location`サービスタイプを追加し、`Location: Always`を明示します。
- Android Play ビルドと`While Using`モードでは、バックグラウンド時の`location.get`を拒否します。
- 他の Node プラットフォームでは動作が異なる場合があります。

## Linux Node ホスト

同梱の Linux Node Plugin は、Linux デスクトップアプリがないヘッドレスホストを含む CLI `openclaw node`サービスに`location.get`を追加します。位置情報はデフォルトでオフです。Plugin エントリで有効にしてから、Node サービスを再起動します:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

GeoClue2 とその`where-am-i`デモ（Debian および Ubuntu では`geoclue-2-demo`）をインストールします。Node サービスのユーザーは、ホストの GeoClue ポリシーと認可エージェントによって許可されている必要があります。

この Plugin は、一連の`busctl`呼び出しの代わりに`where-am-i`を使用します。GeoClue は、クライアントの作成、プロパティ、開始、更新、停止を単一の D-Bus クライアント接続に結び付けます。デモではこのライフサイクルをまとめて維持しますが、個別の`busctl`サブプロセスでは維持されません。npm 依存関係は追加されません。

Linux は、`coarse`、`balanced`、`precise`を、それぞれ GeoClue の精度レベル`4`、`6`、`8`に対応付けます。返されたタイムスタンプに対して`maxAgeMs`を検証します。GeoClue のデモは選択されたプロバイダーを公開しないため、`source`は`unknown`です。`isPrecise`が true になるのは、報告された精度が 100 メートル以下の場合のみです。

Linux では、同じ安定したエラーである`LOCATION_DISABLED`、`LOCATION_TIMEOUT`、`LOCATION_UNAVAILABLE`を使用します。

## モデルおよびツールとの統合

- エージェントツール: `nodes`ツールの`location_get`アクション（Node が必要）。
- CLI: `openclaw nodes location get --node <id>`。
- エージェント向けガイドライン: ユーザーが位置情報を有効にし、その範囲を理解している場合にのみ呼び出します。

## UX 文言（推奨）

- オフ: 「位置情報の共有は無効です。」
- 使用中のみ: 「OpenClaw が開いているときのみ。」
- 常に: 「OpenClaw がバックグラウンドにある間も、要求された位置情報の確認を許可します。」
- 正確: 「正確な GPS 位置情報を使用します。おおよその位置情報を共有するにはオフに切り替えます。」

## 関連項目

- [Node の概要](/ja-JP/nodes)
- [チャンネルの位置情報解析](/ja-JP/channels/location)
- [カメラ撮影](/ja-JP/nodes/camera)
- [トークモード](/ja-JP/nodes/talk)
