---
read_when:
    - 以前の BlueBubbles チャネルを使用しており、iMessage に移行する必要があります
    - サポートされている OpenClaw の iMessage セットアップを選択しています
    - BlueBubbles が削除された理由についての簡潔な説明が必要です
summary: BlueBubbles のサポートは OpenClaw から削除されました。iMessage の新規セットアップおよび移行済みセットアップには、imsg を使用する同梱の iMessage Plugin を使用してください。
title: BlueBubbles の削除と imsg iMessage パス
x-i18n:
    generated_at: "2026-07-11T21:55:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles の廃止と imsg による iMessage 経路

OpenClaw には BlueBubbles チャネルが同梱されなくなりました。iMessage のサポートは、同梱の `imessage` Plugin を通じて提供されます。Gateway はローカルまたは SSH ラッパー経由で [`imsg`](https://github.com/steipete/imsg) を子プロセスとして起動し、標準入力／標準出力を介して JSON-RPC で通信します。サーバー、Webhook、ポートはありません。

設定にまだ `channels.bluebubbles` が含まれている場合は、`channels.imessage` に移行してください。従来の `/channels/bluebubbles` ドキュメント URL は、設定の完全な変換表と切り替えチェックリストを掲載した [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) にリダイレクトされます。

## 変更点

- サポートされる iMessage 経路には、BlueBubbles HTTP サーバー、Webhook ルート、REST パスワード、BlueBubbles Plugin ランタイムはありません。
- OpenClaw は、Messages.app にサインインしている Mac 上の `imsg` を通じてメッセージを読み取り、監視します。
- 基本的な送信、受信、履歴、メディアでは、通常の `imsg` インターフェースと macOS の権限を使用します。
- 高度なアクション（スレッド返信、Tapback、編集、送信取り消し、エフェクト、開封確認、入力中インジケーター、グループ管理）にはプライベート API ブリッジが必要です。SIP を無効にしたうえで `imsg launch` を実行してください。
- Linux および Windows の Gateway でも、`channels.imessage.cliPath` に、サインイン済みの Mac 上で `imsg` を実行する SSH ラッパーを指定すれば、引き続き iMessage を使用できます。

## 実施手順

1. Messages を使用する Mac に `imsg` をインストールし、動作を確認します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg` と OpenClaw を実行するプロセスコンテキストに、フルディスクアクセスとオートメーションの権限を付与します。

3. 古い設定を変換します。

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Gateway を再起動して確認します。

   ```bash
   openclaw channels status --probe
   ```

5. 古い BlueBubbles サーバーを削除する前に、DM、グループ、添付ファイル、および利用しているプライベート API アクションをテストします。

## 移行時の注意事項

- `channels.bluebubbles.serverUrl` と `channels.bluebubbles.password` に相当する iMessage の設定はありません。接続先や認証対象となるサーバーが存在しないためです。
- `allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`actions.*` は、`channels.imessage` でも同じ意味を維持します。
- `channels.imessage.includeAttachments` は引き続きデフォルトで無効です。受信した写真、ボイスメモ、動画、ファイルをエージェントに届ける必要がある場合は、明示的に設定してください。
- `groupPolicy: "allowlist"` を使用する場合は、`"*"` ワイルドカードエントリを含め、古い `groups` ブロックをコピーしてください。グループ送信者の許可リストとグループレジストリは別々のゲートです。エントリが存在するものの一致する `chat_id` がない（または `"*"` がない）`groups` ブロックでは、実行時にメッセージが破棄されます。また、空の `groups` ブロックでは、送信者フィルタリングによってメッセージが引き続き通過する場合でも、起動時に警告が記録されます。
- `match.channel: "bluebubbles"` を持つ ACP バインディングは、`"imessage"` に変更する必要があります。
- 古い BlueBubbles のセッションキーが iMessage のセッションキーに変換されることはありません。ペアリングの承認には送信者ハンドルがキーとして使用されるため、コピーした `allowFrom` エントリは引き続き機能しますが、BlueBubbles のセッションキーに紐づく会話履歴は引き継がれません。

## 関連項目

- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)
- [iMessage](/ja-JP/channels/imessage)
- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
