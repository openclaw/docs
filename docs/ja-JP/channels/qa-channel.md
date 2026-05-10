---
read_when:
    - 合成 QA トランスポートをローカルまたは CI のテスト実行に組み込んでいます
    - 同梱の qa-channel 設定サーフェスが必要です
    - エンドツーエンドの QA 自動化を反復改善しています
summary: 決定論的な OpenClaw QA シナリオ向けの合成 Slack クラスのチャネル Plugin
title: QA チャネル
x-i18n:
    generated_at: "2026-05-10T19:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` は、自動化された OpenClaw QA 用にバンドルされた合成メッセージトランスポートです。これは本番用チャネルではありません。状態を決定的かつ完全に検査可能に保ちながら、実際のトランスポートで使われるものと同じチャネル Plugin 境界を動作させるために存在します。

## 何をするか

- Slack クラスのターゲット文法:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共有 `channel:` と `group:` の会話は、エージェントにはグループ/チャネルルームのターンとして表示されるため、Discord、Slack、Telegram、および同様のトランスポートで使われるものと同じ、可視返信とメッセージツールのルーティングポリシーを動作させます。
- 受信メッセージ注入、送信トランスクリプト取得、スレッド作成、リアクション、編集、削除、検索/読み取りアクションのための、HTTP ベースの合成バス。
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

- `enabled` - このアカウントのマスタートグル。
- `name` - 任意の表示ラベル。
- `baseUrl` - 合成バス URL。
- `botUserId` - ターゲット文法で使われる Matrix 形式の bot ユーザー ID。
- `botDisplayName` - 送信メッセージの表示名。
- `pollTimeoutMs` - ロングポーリングの待機時間枠。100 から 30000 までの整数。
- `allowFrom` - 送信者許可リスト（ユーザー ID または `"*"`）。ダイレクトメッセージと
  許可リスト付きグループポリシーは、どちらもこれらの合成送信者 ID を使います。
- `groupPolicy` - 共有ルームポリシー: `"open"`（デフォルト）、`"allowlist"`、または
  `"disabled"`。
- `groupAllowFrom` - 任意の共有ルーム送信者許可リスト。`"allowlist"` の下で省略された場合、
  QA Channel は `allowFrom` にフォールバックします。
- `groups.<room>.requireMention` - 特定のグループ/チャネルルームで返信する前に bot メンションを要求します。`groups."*"` はデフォルトを設定します。
- `defaultTo` - 指定がない場合のフォールバックターゲット。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - アクションごとのツールゲーティング。

トップレベルのマルチアカウントキー:

- `accounts` - アカウント ID をキーにした、名前付きアカウント別オーバーライドのレコード。
- `defaultAccount` - 複数が設定されている場合の優先アカウント ID。

## ランナー

ホスト側セルフチェック（`.artifacts/qa-e2e/` の下に Markdown レポートを書き込みます）:

```bash
pnpm qa:e2e
```

これは `qa-lab` を経由し、リポジトリ内の QA バスを開始し、バンドルされた `qa-channel` ランタイムスライスを起動して、決定的なセルフチェックを実行します。

完全なリポジトリベースのシナリオスイート:

```bash
pnpm openclaw qa suite
```

QA Gateway レーンに対してシナリオを並列に実行します。シナリオ、プロファイル、プロバイダーモードについては [QA 概要](/ja-JP/concepts/qa-e2e-automation) を参照してください。

Docker ベースの QA サイト（Gateway + QA Lab デバッガー UI を 1 つのスタックにまとめたもの）:

```bash
pnpm qa:lab:up
```

QA サイトをビルドし、Docker ベースの Gateway + QA Lab スタックを開始して、QA Lab URL を表示します。そこからシナリオを選択し、モデルレーンを選び、個別の実行を開始して、結果をライブで確認できます。QA Lab デバッガーは、出荷される Control UI バンドルとは別です。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - スタック全体、トランスポートアダプター、シナリオ作成
- [Matrix QA](/ja-JP/concepts/qa-matrix) - 実際のチャネルを駆動するライブトランスポートランナーの例
- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネル概要](/ja-JP/channels)
