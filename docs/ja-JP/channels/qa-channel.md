---
read_when:
    - 合成 QA トランスポートをローカルまたは CI のテスト実行に組み込んでいる
    - バンドル済みの qa-channel 設定サーフェスが必要です
    - エンドツーエンドのQA自動化を反復改善しています
summary: 決定論的な OpenClaw QA シナリオ用の合成 Slack 級チャンネルPlugin
title: QA チャンネル
x-i18n:
    generated_at: "2026-04-30T05:00:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` は、自動化された OpenClaw QA のためにバンドルされた合成メッセージトランスポートです。本番用チャネルではありません。状態を決定論的かつ完全に検査可能に保ちながら、実際のトランスポートで使われるものと同じチャネル Plugin 境界を実行するために存在します。

## 機能

- Slack クラスのターゲット文法:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 受信メッセージ注入、送信トランスクリプト取得、スレッド作成、リアクション、編集、削除、検索/読み取りアクションのための HTTP ベースの合成バス。
- `.artifacts/qa-e2e/` に Markdown レポートを書き込むホスト側セルフチェックランナー。

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
- `botUserId` — ターゲット文法で使われる Matrix 形式のボットユーザー ID。
- `botDisplayName` — 送信メッセージの表示名。
- `pollTimeoutMs` — ロングポーリングの待機ウィンドウ。100 から 30000 までの整数。
- `allowFrom` — 送信者許可リスト（ユーザー ID または `"*"`）。
- `defaultTo` — 指定がない場合のフォールバックターゲット。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — アクションごとのツールゲーティング。

トップレベルのマルチアカウントキー:

- `accounts` — アカウント ID をキーにした、名前付きアカウントごとのオーバーライドのレコード。
- `defaultAccount` — 複数設定されている場合の優先アカウント ID。

## ランナー

ホスト側セルフチェック（`.artifacts/qa-e2e/` 配下に Markdown レポートを書き込みます）:

```bash
pnpm qa:e2e
```

これは `qa-lab` 経由でルーティングし、リポジトリ内の QA バスを起動し、バンドルされた `qa-channel` ランタイムスライスをブートして、決定論的なセルフチェックを実行します。

リポジトリに基づく完全なシナリオスイート:

```bash
pnpm openclaw qa suite
```

QA Gateway レーンに対してシナリオを並列実行します。シナリオ、プロファイル、プロバイダーモードについては [QA 概要](/ja-JP/concepts/qa-e2e-automation) を参照してください。

Docker ベースの QA サイト（Gateway + QA Lab デバッガー UI を 1 つのスタックに統合）:

```bash
pnpm qa:lab:up
```

QA サイトをビルドし、Docker ベースの Gateway + QA Lab スタックを起動して、QA Lab URL を出力します。そこからシナリオを選択し、モデルレーンを選び、個別の実行を開始して、結果をライブで確認できます。QA Lab デバッガーは、出荷される Control UI バンドルとは別です。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — 全体のスタック、トランスポートアダプター、シナリオ作成
- [Matrix QA](/ja-JP/concepts/qa-matrix) — 実際のチャネルを駆動するライブトランスポートランナーの例
- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネル概要](/ja-JP/channels)
