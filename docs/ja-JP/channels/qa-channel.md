---
read_when:
    - ローカルまたは CI テスト実行に合成 QA トランスポートを接続しています
    - バンドルされた qa-channel 設定サーフェスが必要です
    - エンドツーエンド QA 自動化を反復改善しています
summary: 決定論的な OpenClaw QA シナリオ用の合成 Slack クラスチャンネル Plugin
title: QA チャネル
x-i18n:
    generated_at: "2026-07-05T11:03:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` は、自動化された OpenClaw QA 用のリポジトリローカルな合成メッセージトランスポートです（`extensions/qa-channel`、非公開パッケージ、パッケージ化されたインストールからは除外）。これは本番用チャンネルではありません。実際のトランスポートで使われるものと同じチャンネル Plugin 境界を実行しつつ、状態を決定的かつ完全に検査可能に保つために存在します。

## 何をするか

- Slack クラスのターゲット文法:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共有 `channel:` と `group:` の会話は、グループ/チャンネルルームのターンとしてエージェントに提示されるため、Discord、Slack、Telegram、および類似のトランスポートで使われるものと同じ可視返信とメッセージツールのルーティングポリシーを実行します。
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

- `enabled` - このアカウントのマスタートグル。
- `name` - 任意の表示ラベル。
- `baseUrl` - 合成バス URL。これが設定されると、アカウントは設定済みとして扱われます。
- `botUserId` - ターゲット文法で使われる合成 bot ユーザー ID（デフォルト: `openclaw`）。
- `botDisplayName` - 送信メッセージの表示名（デフォルト: `OpenClaw QA`）。
- `pollTimeoutMs` - ロングポーリングの待機ウィンドウ。100 から 30000 までの整数（デフォルト: 1000）。
- `allowFrom` - 送信者許可リスト（ユーザー ID または `"*"`、デフォルト: `["*"]`）。DM は
  常に `open` ポリシーです。許可リスト付きグループポリシーも、これらの合成
  送信者 ID を使用します。
- `groupPolicy` - 共有ルームポリシー: `"open"`（デフォルト）、`"allowlist"`、または
  `"disabled"`。
- `groupAllowFrom` - 任意の共有ルーム送信者許可リスト。`"allowlist"` で省略された場合、
  QA Channel は `allowFrom` にフォールバックします。
- `groups.<room>.requireMention` - 特定のグループ/チャンネルルームで返信する前に bot メンションを要求します（デフォルト: false）。`groups."*"` はデフォルトを設定します。
  ルームごとの `tools` / `toolsBySender` はツールポリシーのオーバーライドを設定します。
- `defaultTo` - 何も指定されていない場合のフォールバックターゲット。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - アクションごとのツールゲーティング。

トップレベルのマルチアカウントキー:

- `accounts` - アカウント ID をキーにした、名前付きアカウントごとのオーバーライドのレコード。
- `defaultAccount` - 複数が設定されている場合の優先アカウント ID。

## ランナー

ホスト側セルフチェック（`.artifacts/qa-e2e/` 配下に Markdown レポートを書き込みます）:

```bash
pnpm qa:e2e
```

これは `qa-lab` 経由でルーティングし、リポジトリ内の QA バスを起動し、`qa-channel` ランタイムスライスをブートして、決定的なセルフチェックを実行します。

リポジトリに基づく完全なシナリオスイート:

```bash
pnpm openclaw qa suite
```

QA Gateway レーンに対してシナリオを並列実行します。シナリオ、プロファイル、プロバイダーモードについては [QA 概要](/ja-JP/concepts/qa-e2e-automation) を参照してください。

Docker ベースの QA サイト（Gateway + QA Lab デバッガー UI を 1 つのスタックにまとめたもの）:

```bash
pnpm qa:lab:up
```

QA サイトをビルドし、Docker ベースの Gateway + QA Lab スタックを起動し、QA Lab URL を表示します。そこからシナリオを選択し、モデルレーンを選び、個別の実行を開始し、結果をライブで確認できます。QA Lab デバッガーは、出荷される Control UI バンドルとは別です。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - 全体スタック、トランスポートアダプター、シナリオ作成
- [Matrix QA](/ja-JP/concepts/qa-matrix) - 実際のチャンネルを駆動するライブトランスポートランナーの例
- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネル概要](/ja-JP/channels)
