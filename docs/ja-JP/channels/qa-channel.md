---
read_when:
    - ローカルまたは CI のテスト実行に合成 QA トランスポートを組み込んでいます
    - バンドルされた qa-channel の設定サーフェスが必要です
    - エンドツーエンドのQA自動化を反復改善しています
summary: 決定論的な OpenClaw QA シナリオ向けの Slack クラス合成チャネル Plugin
title: QA チャンネル
x-i18n:
    generated_at: "2026-07-16T11:22:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` は、自動化された OpenClaw QA 用のリポジトリローカルな合成メッセージトランスポートです（`extensions/qa-channel`、非公開パッケージ、パッケージ化されたインストールからは除外）。これは本番環境用のチャネルではありません。実際のトランスポートが使用するものと同じチャネル Plugin 境界を実行しながら、状態を決定論的かつ完全に検査可能に保つために存在します。

## 機能

- Slack クラスのターゲット文法:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共有の `channel:` および `group:` 会話は、グループ/チャネルルームのターンとしてエージェントに提示されるため、Discord、Slack、Telegram、および同様のトランスポートで使用されるものと同じ可視返信およびメッセージツールのルーティングポリシーを実行します。
- 受信メッセージの注入、送信トランスクリプトの取得、スレッド作成、リアクション、編集、削除、および検索/読み取りアクションに対応する HTTP ベースの合成バス。
- `.artifacts/qa-e2e/` に Markdown レポートを書き込むホスト側のセルフチェックランナー。

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
- `baseUrl` - 合成バスの URL。これを設定すると、アカウントは設定済みと見なされます。
- `botUserId` - ターゲット文法で使用される合成ボットユーザー ID（デフォルト: `openclaw`）。
- `botDisplayName` - 送信メッセージの表示名（デフォルト: `OpenClaw QA`）。
- `pollTimeoutMs` - ロングポーリングの待機時間枠。100 から 30000 までの整数（デフォルト: 1000）。
- `allowFrom` - 送信者の許可リスト（ユーザー ID または `"*"`、デフォルト: `["*"]`）。DM は
  常に `open` ポリシーです。許可リスト方式のグループポリシーでも、これらの合成
  送信者 ID を使用します。
- `groupPolicy` - 共有ルームポリシー: `"open"`（デフォルト）、`"allowlist"`、または
  `"disabled"`。
- `groupAllowFrom` - 任意の共有ルーム送信者許可リスト。
  `"allowlist"` で省略した場合、QA Channel は `allowFrom` にフォールバックします。
- `groups.<room>.requireMention` - 特定のグループ/チャネルルームで返信する前に
  ボットへのメンションを必須にします（デフォルト: false）。`groups."*"` はデフォルトを設定し、
  ルームごとの `tools` / `toolsBySender` はツールポリシーのオーバーライドを設定します。
- `defaultTo` - ターゲットが指定されていない場合のフォールバックターゲット。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - アクションごとのツール制御。

トップレベルのマルチアカウントキー:

- `accounts` - アカウント ID をキーとする、名前付きのアカウント別オーバーライドのレコード。
- `defaultAccount` - 複数のアカウントが設定されている場合に優先するアカウント ID。

## ランナー

ホスト側のセルフチェック（`.artifacts/qa-e2e/` 配下に Markdown レポートを書き込みます）:

```bash
pnpm qa:e2e
```

これは `qa-lab` を経由してルーティングし、リポジトリ内の QA バスを起動し、`qa-channel` ランタイムスライスをブートして、決定論的なセルフチェックを実行します。

リポジトリ全体を使用するシナリオスイート:

```bash
pnpm openclaw qa suite
```

QA Gateway レーンに対してシナリオを並列実行します。シナリオ、プロファイル、およびプロバイダーモードについては、[QA の概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

Docker ベースの QA サイト（Gateway + QA Lab デバッガー UI を単一スタックで提供）:

```bash
pnpm qa:lab:up
```

QA サイトをビルドし、Docker ベースの Gateway + QA Lab スタックを起動して、QA Lab の URL を表示します。そこからシナリオの選択、モデルレーンの選択、個別実行の開始、結果のリアルタイム監視を行えます。QA Lab デバッガーは、リリース版の Control UI バンドルとは別のものです。

## 関連項目

- [QA の概要](/ja-JP/concepts/qa-e2e-automation) - スタック全体、トランスポートアダプター、Matrix プロファイル、およびシナリオ作成
- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネルの概要](/ja-JP/channels)
