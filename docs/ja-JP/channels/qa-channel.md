---
read_when:
    - 合成 QA トランスポートをローカルまたは CI のテスト実行に接続しています
    - 同梱の qa-channel 設定インターフェイスが必要です
    - エンドツーエンドQA自動化を反復改善しています
summary: 決定論的な OpenClaw QA シナリオ向けの合成 Slack クラスチャネル Plugin
title: QAチャンネル
x-i18n:
    generated_at: "2026-05-06T04:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` は、自動化された OpenClaw QA のために同梱された合成メッセージトランスポートです。これは本番用チャネルではありません。実際のトランスポートで使われるものと同じチャネル Plugin 境界を、状態を決定論的かつ完全に検査可能に保ちながら実行するために存在します。

## 何をするか

- Slack クラスのターゲット文法:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共有された `channel:` と `group:` の会話は、エージェントにはグループ/チャネルルームのターンとして提示されるため、Discord、Slack、Telegram、および類似のトランスポートで使われるものと同じ表示返信とメッセージツールのルーティングポリシーを実行します。
- 受信メッセージの注入、送信トランスクリプトのキャプチャ、スレッド作成、リアクション、編集、削除、検索/読み取りアクションのための HTTP バックエンドの合成バス。
- Markdown レポートを `.artifacts/qa-e2e/` に書き込むホスト側セルフチェックランナー。

## 設定

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

アカウントキー:

- `enabled` - このアカウントのマスタートグル。
- `name` - 任意の表示ラベル。
- `baseUrl` - 合成バス URL。
- `botUserId` - ターゲット文法で使われる Matrix 形式のボットユーザー ID。
- `botDisplayName` - 送信メッセージの表示名。
- `pollTimeoutMs` - ロングポーリングの待機ウィンドウ。100 から 30000 までの整数。
- `allowFrom` - 送信者許可リスト（ユーザー ID または `"*"`）。
- `defaultTo` - 指定がない場合のフォールバックターゲット。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - アクションごとのツールゲート。

トップレベルのマルチアカウントキー:

- `accounts` - アカウント ID をキーにした、名前付きアカウントごとのオーバーライドのレコード。
- `defaultAccount` - 複数設定されている場合に優先されるアカウント ID。

## ランナー

ホスト側セルフチェック（Markdown レポートを `.artifacts/qa-e2e/` 配下に書き込みます）:

```bash
pnpm qa:e2e
```

これは `qa-lab` を経由し、リポジトリ内の QA バスを起動し、同梱の `qa-channel` ランタイムスライスを起動して、決定論的なセルフチェックを実行します。

完全なリポジトリバックエンドのシナリオスイート:

```bash
pnpm openclaw qa suite
```

QA Gateway レーンに対してシナリオを並列実行します。シナリオ、プロファイル、プロバイダーモードについては [QA 概要](/ja-JP/concepts/qa-e2e-automation) を参照してください。

Docker バックエンドの QA サイト（Gateway + QA Lab デバッガー UI を 1 つのスタックにまとめたもの）:

```bash
pnpm qa:lab:up
```

QA サイトをビルドし、Docker バックエンドの Gateway + QA Lab スタックを起動して、QA Lab URL を出力します。そこからシナリオを選択し、モデルレーンを選び、個別の実行を起動し、結果をライブで確認できます。QA Lab デバッガーは、出荷される Control UI バンドルとは別のものです。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - スタック全体、トランスポートアダプター、シナリオ作成
- [Matrix QA](/ja-JP/concepts/qa-matrix) - 実際のチャネルを駆動するライブトランスポートランナーの例
- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネル概要](/ja-JP/channels)
