---
read_when:
    - 古いBlueBubblesチャンネルを使用していて、iMessageへ移行する必要があります
    - サポート対象の OpenClaw iMessage セットアップを選択しています
    - BlueBubbles の削除について短い説明が必要です
summary: BlueBubbles サポートは OpenClaw から削除されました。新規および移行済みの iMessage セットアップには、imsg 付きの同梱 iMessage Plugin を使用してください。
title: BlueBubbles の削除と imsg iMessage パス
x-i18n:
    generated_at: "2026-07-05T11:00:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles の削除と imsg iMessage 経路

OpenClaw は BlueBubbles チャンネルを同梱しなくなりました。iMessage サポートは同梱の `imessage` Plugin を通じて動作します。Gateway は [`imsg`](https://github.com/steipete/imsg) をローカルまたは SSH ラッパー経由で子プロセスとして起動し、stdin/stdout 上で JSON-RPC をやり取りします。サーバーなし、Webhook なし、ポートなし。

設定にまだ `channels.bluebubbles` が含まれている場合は、`channels.imessage` に移行してください。従来の `/channels/bluebubbles` ドキュメント URL は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) にリダイレクトされます。そこには完全な設定変換表と切り替えチェックリストがあります。

## 変更点

- サポートされる iMessage 経路には、BlueBubbles HTTP サーバー、Webhook ルート、REST パスワード、BlueBubbles Plugin ランタイムがありません。
- OpenClaw は Messages.app にサインインしている Mac 上の `imsg` を通じて Messages を読み取り、監視します。
- 基本的な送信、受信、履歴、メディアは通常の `imsg` サーフェスと macOS 権限を使用します。
- 高度な操作（スレッド返信、タップバック、編集、送信取り消し、エフェクト、開封確認、入力インジケーター、グループ管理）には private API ブリッジが必要です。`imsg launch` を実行してください。これには SIP の無効化が必要です。
- Linux と Windows の Gateway でも、サインイン済みの Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に指定すれば iMessage を使用できます。

## 対応内容

1. Messages Mac に `imsg` をインストールして検証します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg` と OpenClaw を実行するプロセスコンテキストに、フルディスクアクセスとオートメーション権限を付与します。

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

4. Gateway を再起動して検証します。

   ```bash
   openclaw channels status --probe
   ```

5. 古い BlueBubbles サーバーを削除する前に、DM、グループ、添付ファイル、依存している private API 操作をテストします。

## 移行メモ

- `channels.bluebubbles.serverUrl` と `channels.bluebubbles.password` に相当する iMessage 設定はありません。到達または認証するサーバーがないためです。
- `allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`actions.*` は `channels.imessage` 配下でも意味を維持します。
- `channels.imessage.includeAttachments` は引き続きデフォルトでオフです。受信した写真、ボイスメモ、動画、ファイルをエージェントに届けたい場合は、明示的に設定してください。
- `groupPolicy: "allowlist"` の場合は、`"*"` ワイルドカードエントリを含めて古い `groups` ブロックをコピーしてください。グループ送信者の許可リストとグループレジストリは別々のゲートです。エントリがある `groups` ブロックでも、一致する `chat_id` がない（または `"*"` がない）場合、実行時にメッセージは破棄されます。また、空の `groups` ブロックは、送信者フィルタリングによってメッセージが通過する場合でも、起動時に警告をログ出力します。
- `match.channel: "bluebubbles"` を持つ ACP バインディングは `"imessage"` に変更する必要があります。
- 古い BlueBubbles セッションキーは iMessage セッションキーにはなりません。ペアリング承認は送信者ハンドルをキーにするため、コピーした `allowFrom` エントリは引き続き機能しますが、BlueBubbles セッションキー配下の会話履歴は引き継がれません。

## 関連項目

- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)
- [iMessage](/ja-JP/channels/imessage)
- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
