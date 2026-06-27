---
read_when:
    - OpenClaw を Raft ワークスペースに接続したい
    - Raft External Agent を設定しています
    - Raft のウェイク配信をデバッグしている
sidebarTitle: Raft
summary: Raft CLI ウェイクブリッジによる Raft External Agent サポート
title: Raft
x-i18n:
    generated_at: "2026-06-27T10:40:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Raft サポートは、OpenClaw エージェントをローカルの
Raft CLI 経由で Raft 外部エージェントに接続します。Raft は認証済みのウェイクヒントを Gateway に送信します。その後、エージェントは
Raft CLI を使ってメッセージを確認し、送信します。

## インストール

Raft は公式の外部Pluginです。Gateway ホストにインストールします。

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

詳細: [Plugin](/ja-JP/tools/plugin)

## 前提条件

- 外部エージェントを持つ Raft ワークスペース。
- OpenClaw Gateway と同じホストにインストールされた Raft CLI。
- すでにサインイン済みで、その外部エージェントに関連付けられている Raft CLI プロファイル。

このPluginは Raft 認証情報を保存しません。Raft CLI はその認証を
自身のプロファイル内に保持します。

## 設定

設定でプロファイルを指定します。

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

デフォルトアカウントの場合は、代わりに Gateway
環境で `RAFT_PROFILE` を設定できます。

```bash
RAFT_PROFILE=openclaw
```

1つの Gateway が複数の Raft 外部エージェントに接続する場合は、名前付きアカウントを使用します。

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

対話型セットアップフローも同じプロファイルを記録します。

```bash
openclaw channels setup raft
```

## 動作の仕組み

Gateway が起動すると、Plugin は次を実行します。

1. エフェメラルポートでループバック専用の HTTP ウェイクエンドポイントを開きます。
2. そのエンドポイントとプロセスごとのトークンを指定して、`raft --profile <profile> agent bridge` を起動します。
3. ローカルブリッジからの、リプレイ識別子を持つ認証済みかつコンテンツを含まないウェイクヒントのみを受け入れます。
4. `eventId`、`attemptId`、`messageId`、`delivery_id`、`wake_id`、または `id` のいずれかを必須にします。
5. Gateway の再起動をまたいで、ブリッジイベント ID により最近再試行されたウェイク配信を重複排除します。
6. 現在のブリッジに対して安定したランタイムセッションと、Raft CLI プロトコル用の空のアクティビティドレインバッチを返します。
7. 受け入れた各ウェイクに対して、直列化された OpenClaw エージェントターンを1つ開始します。

ブリッジは Raft 配信の再試行と再接続を所有します。OpenClaw ターンが受け取るのは
ウェイク通知だけであり、コピーされた Raft メッセージ本文ではありません。保留中のメッセージを読むため、また応答を送信するために CLI を使用します。

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft は通常のプッシュメッセージトランスポートではありません。OpenClaw はモデルの最終テキストをブリッジ経由で自動的に送り返さないため、エージェントはウェイク処理後に
Raft CLI を使用する必要があります。
</Note>

## 検証

OpenClaw が CLI を見つけられ、設定済みプロファイルを持っていることを確認します。

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

次に、Raft 外部エージェントにメッセージを送信します。Gateway ログには
Raft ブリッジの起動に続いて、受信ウェイクが表示されるはずです。エージェントは設定済みの
Raft プロファイルを使って保留中のメッセージを確認する必要があります。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Raft CLI is missing">
    Gateway ホストに Raft CLI をインストールし、サービスの
    `PATH` で `raft` を利用できるようにします。`raft --help` で確認してから、Gateway を再起動します。
  </Accordion>
  <Accordion title="The bridge exits immediately">
    設定済みプロファイルがサインイン済みで、意図した
    Raft 外部エージェントに属していることを確認します。CLI の診断を確認するには、`raft --profile <profile> agent bridge` を直接実行します。
  </Accordion>
  <Accordion title="A wake arrives but no Raft response is sent">
    エージェントが Raft CLI を呼び出していない場合、これは想定どおりです。ウェイクブリッジはメッセージ本文や自動の最終返信を運びません。エージェントのツールポリシーを確認し、`raft --profile <profile> message
    check` と `message send` を実行できることを確認します。
  </Accordion>
</AccordionGroup>

## 参考資料

- [Raft](https://raft.build/)
- [Raft ドキュメント](https://docs.raft.build/welcome/)
- [Hermes Raft 統合](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
