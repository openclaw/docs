---
read_when:
    - OpenClaw を Raft ワークスペースに接続する場合
    - Raft 外部エージェントを設定しています
    - Raft のウェイク配信をデバッグしています
sidebarTitle: Raft
summary: Raft CLI ウェイクブリッジを介した Raft External Agent のサポート
title: Raft
x-i18n:
    generated_at: "2026-07-11T22:02:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft は、ローカルの Raft CLI を介して OpenClaw エージェントを Raft External Agent に接続します。Raft は認証済みのウェイク通知を Gateway に送信します。その後、エージェントは Raft CLI を使用してメッセージを確認し、送信します。ダイレクトチャットのみに対応します（グループには対応しません）。

## インストール

Raft は公式の外部 Plugin です。Gateway ホストにインストールします。

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

詳細：[Plugin](/ja-JP/tools/plugin)

## 前提条件

- External Agent を含む Raft ワークスペース。
- OpenClaw Gateway と同じホストに Raft CLI がインストールされ、サービスの `PATH` に含まれていること。
- すでにサインイン済みで、その External Agent に関連付けられている Raft CLI プロファイル。

Plugin は Raft の認証情報を保存しません。Raft CLI がその認証情報を自身のプロファイルに保持します。

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

1 つの Gateway を複数の Raft External Agent に接続する場合は、名前付きアカウントを使用します。

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

## 動作の仕組み

Gateway が起動すると、Plugin は次の処理を行います。

1. 一時ポート上にループバック専用の HTTP ウェイクエンドポイントを開きます。
2. そのエンドポイントとプロセスごとのトークンを指定して、`raft --profile <profile> agent bridge` を起動します。
3. ローカルブリッジから送信された、リプレイ識別子を持つ認証済みかつコンテンツを含まないウェイク通知のみを受け入れます。
4. すべてのウェイクペイロードに `eventId`、`attemptId`、`messageId`、`delivery_id`、`wake_id`、または `id` のいずれかが含まれていることを必須とします。
5. 再試行されたウェイク配信をブリッジイベント ID に基づいて 24 時間重複排除します。この状態は Gateway の再起動後も維持されます。
6. 現在のブリッジに対して安定したランタイムセッションを返し、Raft CLI プロトコルに対して空のアクティビティドレインバッチを返します。
7. 受け入れたウェイクごとに、直列化された OpenClaw エージェントターンを 1 回開始します。

ブリッジが Raft の配信再試行と再接続を管理します。OpenClaw のターンが受け取るのはウェイク通知のみであり、コピーされた Raft メッセージ本文ではありません。保留中のメッセージの読み取りと応答の送信には CLI を使用します。

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft はプッシュメッセージトランスポートではありません。OpenClaw はモデルの最終テキストをブリッジ経由で自動的に送り返さないため、エージェントはウェイクを処理した後に Raft CLI を使用する必要があります。
</Note>

## 確認

OpenClaw が CLI を検出でき、プロファイルが設定されていることを確認します。

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

次に、Raft External Agent にメッセージを送信します。Gateway ログには Raft ブリッジの起動が表示され、その後に受信ウェイクが表示されます。エージェントは設定された Raft プロファイルを使用して、保留中のメッセージを確認します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Raft CLI が見つからない">
    Gateway ホストに Raft CLI をインストールし、サービスの `PATH` から `raft` を利用できるようにします。`raft --help` で確認してから、Gateway を再起動します。
  </Accordion>
  <Accordion title="ブリッジがすぐに終了する">
    設定されたプロファイルがサインイン済みであり、対象の Raft External Agent に属していることを確認します。CLI の診断情報を確認するには、`raft --profile <profile> agent bridge` を直接実行します。
  </Accordion>
  <Accordion title="ウェイクを受信しても Raft の応答が送信されない">
    エージェントが Raft CLI を呼び出さない場合、これは想定された動作です。ウェイクブリッジはメッセージ本文や自動的な最終応答を伝送しません。エージェントのツールポリシーを確認し、`raft --profile <profile>
    message check` と `message send` を実行できるようにしてください。
  </Accordion>
</AccordionGroup>

## 参考資料

- [Raft](https://raft.build/)
- [Raft ドキュメント](https://docs.raft.build/welcome/)
- [Hermes の Raft 統合](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
