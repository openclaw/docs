---
read_when:
    - iPhone NodeでHealthKitの概要を有効にする
    - health.summary の呼び出し、またはヘルスメトリクスが欠落している場合のトラブルシューティング
    - iPhone から送信される可能性のあるヘルスケアデータを確認する
summary: iPhone Nodeからプライバシー保護されたHealthKitサマリーを有効化して呼び出す
title: HealthKitの概要
x-i18n:
    generated_at: "2026-07-14T13:51:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit サマリー

OpenClaw は、接続された iPhone Node に現在の暦日の読み取り専用サマリーをリクエストできます。iPhone はデバイス上で集計を計算し、歩数、睡眠時間、平均安静時心拍数、ワークアウトの回数と時間のみを返します。個別の HealthKit サンプル、ソース、メタデータ、臨床記録、バックグラウンドでの取り込み、書き込みはサポートされていません。

この機能はデフォルトで無効です。iPhone での個別の同意と Gateway での承認が必要です。

## 要件

- HealthKit がヘルスデータを利用可能として報告する、OpenClaw iOS アプリを実行している iPhone。
- 接続および承認済みの iPhone Node。[iOS アプリのセットアップ](/ja-JP/platforms/ios)を参照してください。
- iPhone Node に到達可能な最新の Gateway。
- 表示対象の各指標について読み取り可能なヘルスデータ。Apple Watch は iPhone のヘルスストアにデータを提供できますが、HealthKit サマリーに OpenClaw watchOS アプリは必要ありません。

## アクセスを有効にする

### 1. Gateway コマンドを承認する

`openclaw.json` 内の既存の `gateway.nodes.allowCommands` 配列に `health.summary` を追加します。すでに存在するコマンドは保持してください。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` はプライバシーへの影響が大きいものとして分類され、iOS プラットフォームのデフォルトでは決して許可されません。`gateway.nodes.denyCommands` のエントリは許可エントリより優先されます。[Node コマンドポリシー](/ja-JP/nodes#command-policy)を参照してください。

### 2. iPhone で共有を有効にする

iOS アプリで以下を行います。

1. **Settings -> Permissions -> Privacy & Access -> Health Summaries** を開きます。
2. **Enable & Share Summaries** をタップします。
3. 開示内容を確認し、Apple の権限シートで OpenClaw に読み取りを許可する Health カテゴリを選択します。

このスイッチには、OpenClaw と共有することを明示的に選択した旨が記録されます。Apple がリクエストされたすべてのカテゴリを許可したことを示すものではありません。

Health サマリーを有効にすると、Node が宣言するコマンドサーフェスに `health.summary` が追加されます。これによって生じる Node ペアリングの更新を承認します。

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

次に、接続された iPhone が有効な `health.summary` コマンドを公開していることを確認します。

```bash
openclaw nodes describe --node "<iPhone name>"
```

## 今日のサマリーをリクエストする

`today` のみがサポートされています。iPhone の現在のカレンダーとタイムゾーンに基づき、現地時刻の午前 0 時からリクエスト時刻までが対象です。

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

エージェントは `nodes` ツールを使用して同じコマンドを呼び出すことができます。

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

サマリーペイロードには以下が含まれます。

| フィールド                    | 意味                                       |
| ------------------------ | --------------------------------------------- |
| `period`                 | 常に `today`                                |
| `startISO`               | ISO インスタントとしてエンコードされた現地時刻での一日の開始 |
| `endISO`                 | ISO インスタントとしてエンコードされたリクエスト時刻       |
| `timeZoneIdentifier`     | iPhone のタイムゾーン識別子                   |
| `stepCount`              | 丸められた累積歩数                      |
| `sleepDurationMinutes`   | 重複を除去し、今日の範囲に切り詰めた睡眠時間    |
| `restingHeartRateBpm`    | 平均安静時心拍数                    |
| `workoutCount`           | 今日開始されたワークアウト                   |
| `workoutDurationMinutes` | それらのワークアウトの合計時間              |

指標フィールドは任意であり、HealthKit が読み取り可能な値を返さない場合は省略されます。時間を計算する前に睡眠ステージと重複するソースが統合されるため、同じ 1 分間が二重にカウントされることはありません。

## プライバシーに関する動作

- 集計は iPhone 上で行われます。生のサンプルがデバイスの外に出ることはありません。
- リクエストされた集計データは、Gateway を経由して iPhone の外部に送信されます。エージェントがリクエストした場合、集計データは設定済みの AI プロバイダーに渡り、チャット履歴に残ることがあります。CLI から直接呼び出した場合は、CLI オペレーターに返されます。
- OpenClaw がリクエストするのは読み取りアクセスのみです。ヘルスデータの追加や変更はできません。
- OpenClaw が HealthKit を読み取るのは、`health.summary` が呼び出された場合のみです。バックグラウンドでのヘルスデータ取り込みは行われません。
- HealthKit は、読み取りアクセスが拒否されたかどうかを意図的に開示しません。指標が欠けている場合、アクセスの拒否、一致するサンプルがないこと、またはデータ型が利用できないことのいずれかを意味します。OpenClaw はこれらの状況を区別できません。
- このサマリーは個人の健康およびフィットネス状況を把握するためのものであり、診断や医療上の助言を目的としたものではありません。

共有を停止するには、**Health Summaries** に戻って **Disable** をタップします。その後、iPhone は Node サーフェスから Health 機能と `health.summary` コマンドを削除します。`gateway.nodes.allowCommands` から `health.summary` を削除して、Gateway 側のゲートを閉じることもできます。

## トラブルシューティング

### コマンドが Node によって宣言されていない

iOS アプリで Health サマリーが有効になっており、iPhone が接続されていることを確認します。`openclaw nodes pending` を実行し、機能の更新があれば承認してから、`openclaw nodes describe --node "<iPhone name>"` を再度確認します。

### コマンドに明示的なオプトインが必要

`gateway.nodes.allowCommands` に `health.summary` を追加します。また、`gateway.nodes.denyCommands` にこれが含まれていないことも確認してください。拒否リストが優先されます。

### `HEALTH_ACCESS_DISABLED`

アプリ側の共有スイッチがオフになっています。iPhone の **Privacy & Access** にある **Health Summaries** を有効にします。

### サマリーは成功するが指標が欠けている

Apple の Health アプリを開き、今日のデータが存在することを確認します。Apple の Health 設定で OpenClaw のアクセス権を確認してください。ただし、空の結果をアクセス拒否の証拠と見なさないでください。HealthKit は意図的にその違いを隠します。

### 過去の期間を指定すると失敗する

このコマンドが受け付けるのは `{"period":"today"}` のみです。複数日および過去のサマリーはサポートされていません。

## 関連項目

- [iOS アプリ](/ja-JP/platforms/ios)
- [Node](/ja-JP/nodes)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway)
- [セキュリティ監査](/ja-JP/gateway/security)
