---
read_when:
    - ローカルまたは CI のテスト実行に合成 QA トランスポートを組み込んでいます
    - バンドルされた qa-channel 設定サーフェスが必要です
    - エンドツーエンドQA自動化の改善を繰り返しています
summary: 決定論的な OpenClaw QA シナリオ用の合成 Slack 系チャネルPlugin
title: QA チャンネル
x-i18n:
    generated_at: "2026-05-02T04:49:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` は、自動化された OpenClaw QA 向けに同梱されている合成メッセージトランスポートです。これは本番用チャネルではありません。状態を決定的に保ち、完全に検査可能にしながら、実際のトランスポートで使われるものと同じチャネル Plugin 境界を実行するために存在します。

## 機能

- Slack 系ターゲット文法:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共有 `channel:` および `group:` 会話は、グループ/チャネルルームターンとしてエージェントに提示されるため、Discord、Slack、Telegram、および類似のトランスポートで使われるものと同じ可視返信とメッセージツールのルーティングポリシーを実行します。
- 受信メッセージ注入、送信トランスクリプト取得、スレッド作成、リアクション、編集、削除、検索/読み取りアクションのための HTTP バックの合成バス。
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

- `enabled` — このアカウントのマスタートグル。
- `name` — 任意の表示ラベル。
- `baseUrl` — 合成バス URL。
- `botUserId` — ターゲット文法で使われる Matrix 形式の bot ユーザー ID。
- `botDisplayName` — 送信メッセージの表示名。
- `pollTimeoutMs` — ロングポーリングの待機ウィンドウ。100 から 30000 までの整数。
- `allowFrom` — 送信者許可リスト（ユーザー ID または `"*"`）。
- `defaultTo` — 指定がない場合のフォールバックターゲット。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — アクション単位のツールゲート。

トップレベルのマルチアカウントキー:

- `accounts` — アカウント ID をキーにした、名前付きアカウントごとの上書きのレコード。
- `defaultAccount` — 複数設定されている場合の優先アカウント ID。

## ランナー

ホスト側セルフチェック（Markdown レポートを `.artifacts/qa-e2e/` 配下に書き込みます）:

```bash
pnpm qa:e2e
```

これは `qa-lab` 経由でルーティングし、リポジトリ内 QA バスを起動し、同梱の `qa-channel` ランタイムスライスを起動して、決定的なセルフチェックを実行します。

完全なリポジトリバックのシナリオスイート:

```bash
pnpm openclaw qa suite
```

QA Gateway レーンに対してシナリオを並列実行します。シナリオ、プロファイル、プロバイダーモードについては [QA 概要](/ja-JP/concepts/qa-e2e-automation) を参照してください。

Docker バックの QA サイト（Gateway + QA Lab デバッガー UI を 1 つのスタックにまとめたもの）:

```bash
pnpm qa:lab:up
```

QA サイトをビルドし、Docker バックの Gateway + QA Lab スタックを起動して、QA Lab URL を出力します。そこからシナリオを選び、モデルレーンを選択し、個別の実行を開始して、結果をライブで確認できます。QA Lab デバッガーは、出荷される Control UI バンドルとは別です。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — 全体スタック、トランスポートアダプター、シナリオ作成
- [Matrix QA](/ja-JP/concepts/qa-matrix) — 実際のチャネルを駆動するライブトランスポートランナーの例
- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネル概要](/ja-JP/channels)
