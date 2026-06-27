---
read_when:
    - 以前の BlueBubbles チャンネルを使用していて、iMessage に移行する必要があります
    - サポート対象の OpenClaw iMessage セットアップを選択しています
    - BlueBubbles の削除についての短い説明が必要です
summary: BlueBubbles のサポートは OpenClaw から削除されました。新規および移行後の iMessage セットアップでは、imsg と同梱の iMessage Plugin を使用してください。
title: BlueBubbles の削除と imsg の iMessage 経路
x-i18n:
    generated_at: "2026-05-11T20:20:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# BlueBubbles の削除と imsg iMessage パス

OpenClaw は BlueBubbles チャンネルを同梱しなくなりました。iMessage サポートは現在、同梱の `imessage` plugin を通じて実行されます。この plugin は [`imsg`](https://github.com/steipete/imsg) をローカルまたは SSH ラッパー経由で起動し、stdin/stdout 上の JSON-RPC で通信します。

設定にまだ `channels.bluebubbles` が含まれている場合は、`channels.imessage` に移行してください。従来の `/channels/bluebubbles` ドキュメント URL は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) にリダイレクトされます。そこには完全な設定変換表と切り替えチェックリストがあります。

## 変更点

- サポート対象の OpenClaw iMessage パスには、BlueBubbles HTTP サーバー、webhook ルート、REST パスワード、BlueBubbles plugin ランタイムはありません。
- OpenClaw は、Messages.app にサインインしている Mac 上の `imsg` を通じて Messages を読み取り、監視します。
- 基本的な送信、受信、履歴、メディアは通常の `imsg` サーフェスと macOS 権限を使用します。
- スレッド返信、tapback、編集、送信取り消し、エフェクト、既読通知、入力インジケーター、グループ管理などの高度なアクションには、プライベート API ブリッジが利用可能な状態での `imsg launch` が必要です。
- Linux および Windows Gateway でも、サインイン済みの Mac で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に設定することで、引き続き iMessage を使用できます。

## 対応方法

1. Messages Mac に `imsg` をインストールして検証します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg` と OpenClaw を実行するプロセスコンテキストにフルディスクアクセスと Automation 権限を付与します。

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

5. 古い BlueBubbles サーバーを削除する前に、DM、グループ、添付ファイル、および依存しているプライベート API アクションをテストします。

## 移行メモ

- `channels.bluebubbles.serverUrl` と `channels.bluebubbles.password` に相当する iMessage の設定はありません。
- `channels.bluebubbles.allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、添付ファイルルート、メディアサイズ制限、チャンク化、アクション切り替えには iMessage 相当の設定があります。
- `channels.imessage.includeAttachments` は引き続きデフォルトでオフです。受信した写真、音声メモ、動画、ファイルがエージェントに届くことを期待する場合は、明示的に設定してください。
- `groupPolicy: "allowlist"` では、`"*"` ワイルドカードエントリを含め、古い `groups` ブロックをコピーしてください。グループ送信者 allowlist とグループレジストリは別々のゲートです。
- `channel: "bluebubbles"` に一致していた ACP バインディングは、`channel: "imessage"` に変更する必要があります。
- 古い BlueBubbles セッションキーは iMessage セッションキーにはなりません。ペアリング承認はハンドル単位で引き継がれますが、BlueBubbles セッションキー配下の会話履歴は引き継がれません。

## 関連項目

- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)
- [iMessage](/ja-JP/channels/imessage)
- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
