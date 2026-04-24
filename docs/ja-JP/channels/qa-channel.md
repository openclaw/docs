---
read_when:
    - 合成 QA トランスポートをローカルまたは CI のテスト実行に組み込んでいる場合
    - 同梱 qa-channel の設定サーフェスが必要な場合
    - エンドツーエンド QA 自動化に取り組んでいる場合
summary: 決定論的な OpenClaw QA シナリオ向けの合成 Slack クラスチャネル Plugin
title: QA チャネル
x-i18n:
    generated_at: "2026-04-24T04:47:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` は、自動化された OpenClaw QA 向けの同梱合成メッセージトランスポートです。

これは本番用チャネルではありません。実際のトランスポートが使うのと同じチャネル Plugin 境界を検証しつつ、状態を決定論的で完全に検査可能なまま保つために存在します。

## 現在できること

- Slack クラスのターゲット文法:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 次を提供する HTTP ベースの合成バス:
  - 受信メッセージ注入
  - 送信トランスクリプト取得
  - スレッド作成
  - リアクション
  - 編集
  - 削除
  - 検索および読み取りアクション
- Markdown レポートを書き出す、同梱のホスト側セルフチェックランナー

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

サポートされるアカウントキー:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## ランナー

現在の垂直スライス:

```bash
pnpm qa:e2e
```

これは現在、同梱の `qa-lab` 拡張を経由してルーティングされます。リポジトリ内の
QA バスを起動し、同梱の `qa-channel` ランタイムスライスを起動し、決定論的な
セルフチェックを実行して、`.artifacts/qa-e2e/` 配下に Markdown レポートを
書き出します。

プライベートデバッガ UI:

```bash
pnpm qa:lab:up
```

この 1 つのコマンドで QA サイトをビルドし、Docker ベースの gateway + QA Lab
スタックを起動し、QA Lab URL を表示します。そのサイトからシナリオを選択し、
モデルレーンを選び、個別の実行を開始し、結果をライブで監視できます。

リポジトリ全体を使う QA スイート:

```bash
pnpm openclaw qa suite
```

これにより、出荷される Control UI バンドルとは別に、ローカル URL で
プライベート QA デバッガが起動します。

## スコープ

現在のスコープは意図的に絞られています:

- バス + Plugin トランスポート
- スレッド化ルーティング文法
- チャネル所有のメッセージアクション
- Markdown レポート
- 実行制御付きの Docker ベース QA サイト

今後の作業で追加予定のもの:

- プロバイダ/モデルのマトリクス実行
- より豊富なシナリオ検出
- 将来的な OpenClaw ネイティブのオーケストレーション

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネル概要](/ja-JP/channels)
