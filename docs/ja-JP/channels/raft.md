---
read_when:
    - OpenClaw を Raft ワークスペースに接続したい
    - Raft 外部エージェントを構成しています
    - Raft のウェイク配信をデバッグしています
sidebarTitle: Raft
summary: Raft CLI ウェイクブリッジ経由の Raft External Agent サポート
title: Raft
x-i18n:
    generated_at: "2026-07-05T11:05:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft は、ローカルの Raft CLI を通じて OpenClaw エージェントを Raft 外部エージェントに接続します。Raft は認証済みのウェイクヒントを Gateway に送信し、その後エージェントは Raft CLI を使用してメッセージの確認と送信を行います。ダイレクトチャットのみ対応します（グループは非対応）。

## インストール

Raft は公式外部 Plugin です。Gateway ホストにインストールします。

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

詳細: [Plugin](/ja-JP/tools/plugin)

## 前提条件

- 外部エージェントを持つ Raft ワークスペース。
- OpenClaw Gateway と同じホストにインストールされ、サービスの `PATH` 上にある Raft CLI。
- すでにサインイン済みで、その外部エージェントに関連付けられている Raft CLI プロファイル。

この Plugin は Raft 認証情報を保存しません。Raft CLI がその認証を自身のプロファイルに保持します。

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

デフォルトアカウントでは、代わりに Gateway 環境で `RAFT_PROFILE` を設定できます。

```bash
RAFT_PROFILE=openclaw
```

1 つの Gateway が複数の Raft 外部エージェントに接続する場合は、名前付きアカウントを使用します。

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

対話型セットアップでも同じプロファイルが記録されます。

```bash
openclaw channels add --channel raft
```

## 仕組み

Gateway の起動時に、この Plugin は次を行います。

1. エフェメラルポートでループバック専用の HTTP ウェイクエンドポイントを開きます。
2. そのエンドポイントとプロセスごとのトークンを使って `raft --profile <profile> agent bridge` を起動します。
3. ローカルブリッジからの、認証済みで内容を含まない、リプレイ識別子付きのウェイクヒントのみを受け入れます。
4. すべてのウェイクペイロードに `eventId`、`attemptId`、`messageId`、`delivery_id`、`wake_id`、または `id` のいずれかを必須とします。
5. Gateway の再起動をまたいで、ブリッジイベント ID により再試行されたウェイク配信を 24 時間重複排除します。
6. 現在のブリッジ用の安定したランタイムセッションと、Raft CLI プロトコル用の空の activity-drain バッチを返します。
7. 受け入れたウェイクごとに、直列化された OpenClaw エージェントターンを 1 つ開始します。

ブリッジは Raft の配信再試行と再接続を担当します。OpenClaw ターンが受け取るのはウェイク通知だけであり、コピーされた Raft メッセージ本文ではありません。保留中のメッセージを読み取り、応答を送信するために CLI を使用します。

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft はプッシュメッセージトランスポートではありません。OpenClaw はモデルの最終テキストをブリッジ経由で自動送信しないため、エージェントはウェイクの処理後に Raft CLI を使用する必要があります。
</Note>

## 検証

OpenClaw が CLI を検出でき、プロファイルが設定されていることを確認します。

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

次に、Raft 外部エージェントへメッセージを送信します。Gateway ログには Raft ブリッジの起動に続いて、受信ウェイクが表示されるはずです。エージェントは設定された Raft プロファイルを使って保留中のメッセージを確認するはずです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Raft CLI が見つからない">
    Gateway ホストに Raft CLI をインストールし、サービスの `PATH` で `raft` を利用可能にします。`raft --help` で確認してから、Gateway を再起動します。
  </Accordion>
  <Accordion title="ブリッジがすぐに終了する">
    設定されたプロファイルがサインイン済みで、意図した Raft 外部エージェントに属していることを確認します。CLI 診断を確認するには、`raft --profile <profile> agent bridge` を直接実行します。
  </Accordion>
  <Accordion title="ウェイクは届くが Raft 応答が送信されない">
    エージェントが Raft CLI を呼び出していない場合、これは想定される動作です。ウェイクブリッジはメッセージ本文や自動の最終返信を運びません。エージェントのツールポリシーを確認し、`raft --profile <profile>
    message check` と `message send` を実行できることを確認します。
  </Accordion>
</AccordionGroup>

## 参考資料

- [Raft](https://raft.build/)
- [Raft ドキュメント](https://docs.raft.build/welcome/)
- [Hermes Raft インテグレーション](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
