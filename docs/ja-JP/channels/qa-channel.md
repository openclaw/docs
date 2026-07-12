---
read_when:
    - ローカルまたは CI のテスト実行に合成 QA トランスポートを接続しています
    - バンドルされた qa-channel の設定インターフェースが必要です
    - エンドツーエンドのQA自動化を反復改善しています
summary: 決定論的な OpenClaw QA シナリオ向けの合成 Slack クラスチャンネル Plugin
title: QA チャネル
x-i18n:
    generated_at: "2026-07-11T21:58:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` は、自動化された OpenClaw QA 用のリポジトリローカルな合成メッセージトランスポートです（`extensions/qa-channel`、非公開パッケージ、パッケージ化されたインストールからは除外）。これは本番環境向けのチャンネルではありません。状態を決定論的かつ完全に検査可能に保ちながら、実際のトランスポートと同じチャンネル Plugin 境界を検証するために存在します。

## 機能

- Slack と同等のターゲット構文:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共有の `channel:` および `group:` 会話は、グループ／チャンネルルームのターンとしてエージェントに提示されるため、Discord、Slack、Telegram、および同様のトランスポートで使用されるものと同じ、表示される返信とメッセージツールのルーティングポリシーを検証できます。
- 受信メッセージの注入、送信トランスクリプトの取得、スレッドの作成、リアクション、編集、削除、検索／読み取りアクションに対応する HTTP ベースの合成バス。
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

- `enabled` - このアカウント全体の有効／無効を切り替えます。
- `name` - 省略可能な表示ラベル。
- `baseUrl` - 合成バスの URL。これを設定すると、アカウントは設定済みと見なされます。
- `botUserId` - ターゲット構文で使用する合成ボットのユーザー ID（デフォルト: `openclaw`）。
- `botDisplayName` - 送信メッセージの表示名（デフォルト: `OpenClaw QA`）。
- `pollTimeoutMs` - ロングポーリングの待機時間。100～30000 の整数（デフォルト: 1000）。
- `allowFrom` - 送信者の許可リスト（ユーザー ID または `"*"`、デフォルト: `["*"]`）。DM のポリシーは
  常に `open` です。許可リスト方式のグループポリシーでも、これらの合成
  送信者 ID を使用します。
- `groupPolicy` - 共有ルームのポリシー: `"open"`（デフォルト）、`"allowlist"`、または
  `"disabled"`。
- `groupAllowFrom` - 省略可能な共有ルーム送信者の許可リスト。`"allowlist"` で省略した
  場合、QA Channel は `allowFrom` にフォールバックします。
- `groups.<room>.requireMention` - 特定のグループ／チャンネルルームで返信する前に、ボットへのメンションを
  必須にします（デフォルト: false）。`groups."*"` でデフォルトを設定し、
  ルームごとの `tools` / `toolsBySender` でツールポリシーを上書きします。
- `defaultTo` - ターゲットが指定されていない場合のフォールバック先。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - アクションごとのツール利用制御。

トップレベルのマルチアカウント用キー:

- `accounts` - アカウント ID をキーとする、アカウントごとの名前付き上書き設定のレコード。
- `defaultAccount` - 複数のアカウントが設定されている場合に優先するアカウント ID。

## ランナー

ホスト側セルフチェック（`.artifacts/qa-e2e/` 配下に Markdown レポートを書き込みます）:

```bash
pnpm qa:e2e
```

これは `qa-lab` を経由して、リポジトリ内の QA バスを起動し、`qa-channel` のランタイムスライスを立ち上げ、決定論的なセルフチェックを実行します。

リポジトリ全体を使用するシナリオスイート:

```bash
pnpm openclaw qa suite
```

QA Gateway レーンに対してシナリオを並列実行します。シナリオ、プロファイル、プロバイダーモードについては、[QA の概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

Docker ベースの QA サイト（Gateway と QA Lab デバッガー UI を単一スタックで実行）:

```bash
pnpm qa:lab:up
```

QA サイトをビルドし、Docker ベースの Gateway と QA Lab スタックを起動して、QA Lab の URL を表示します。そこからシナリオを選択し、モデルレーンを選び、個別の実行を開始して、結果をリアルタイムで確認できます。QA Lab デバッガーは、リリース版の Control UI バンドルとは別のものです。

## 関連項目

- [QA の概要](/ja-JP/concepts/qa-e2e-automation) - スタック全体、トランスポートアダプター、シナリオの作成
- [Matrix QA](/ja-JP/concepts/qa-matrix) - 実際のチャンネルを駆動するライブトランスポートランナーの例
- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルの概要](/ja-JP/channels)
