---
read_when:
    - OpenClawをQQに接続する場合
    - QQ Botの認証情報を設定する必要があります
    - QQ Botのグループチャットまたはプライベートチャットのサポートが必要な場合
summary: QQ Bot のセットアップ、設定、使用方法
title: QQ bot
x-i18n:
    generated_at: "2026-07-16T11:21:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot は、公式 QQ Bot API（WebSocket Gateway）を介して OpenClaw に接続します。
C2C プライベートチャットとグループでの `@` メンションが主要なチャット形式であり、画像、音声、動画、ファイルなどのリッチメディアに対応しています。ギルドチャンネルメッセージでは、
テキストとリモート URL の画像のみがサポートされます。音声、動画、ファイルのアップロード、およびローカル/Base64
画像はギルドチャンネルでは利用できません。リアクションとスレッドは
どこでもサポートされていません。

ステータス：公式のダウンロード可能な Plugin。

## インストール

```bash
openclaw plugins install @openclaw/qqbot
```

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) にアクセスし、スマートフォンの
   QQ で QR コードをスキャンして登録またはログインします。
2. **Create Bot** をクリックして、新しい QQ Bot を作成します。
3. Bot の設定ページで **AppID** と **AppSecret** を確認し、コピーします。

<Note>
AppSecret は平文では保存されません。保存せずにページを離れた場合は、新しいものを再生成する必要があります。
</Note>

4. チャンネルを追加します。

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway を再起動します。

対話形式のセットアップ：

```bash
openclaw channels add
```

ウィザードでは、AppID/AppSecret を手動で入力する代わりに QR コードによるバインドも利用できます。
対象の QQ Bot に紐付けられたスマートフォンアプリでコードをスキャンすると、
バインドが完了します。OpenClaw は返された認証情報をアカウントの設定
スコープに保存します。

## 設定

最小構成：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

デフォルトアカウントの環境変数（トップレベルアカウントのみ）：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

ファイルに保存された AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

環境変数 SecretRef の AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

注記：

- `openclaw channels add --channel qqbot --token-file ...` は AppSecret
  のみを設定します。`appId` は設定または `QQBOT_APP_ID` ですでに設定されている必要があります。
- `clientSecret` には平文文字列、ファイルパス（`clientSecretFile`）、
  または構造化された SecretRef オブジェクトを指定できます。
- 従来の `secretref:...` / `secretref-env:...` マーカー文字列は
  `clientSecret` では拒否されます。代わりに構造化された SecretRef オブジェクトを使用してください。

### ストリーミング

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // ブロックストリーミング："partial"（デフォルト）または "off"
        nativeTransport: true, // DM で QQ 公式の C2C stream_messages API を使用
      },
    },
  },
}
```

- `streaming.mode: "off"` は、アカウントのブロックストリーミングを無効にします。
- `streaming.nativeTransport: true` は、QQ 公式の
  `stream_messages` API を介して C2C（DM）の返信をストリーミングします。グループ/チャンネルの対象には影響しません。
- 従来の `streaming: true|false` スカラー値と `streaming.c2cStreamApi` キーは、
  `openclaw doctor --fix` によってこの形式に移行されます。
- `/bot-streaming on|off` は、DM から同じ設定を切り替えます。

### アクセスポリシー

- `allowFrom` / `groupAllowFrom` は、C2C /
  グループのコンテキストで Bot とチャットできるユーザーを制限します。`dmPolicy` / `groupPolicy`（`open` | `allowlist` | `disabled`）
  は適用モードを制御します。`dmPolicy` は、
  `allowFrom` に具体的な（ワイルドカードではない）エントリがある場合は `allowlist`、それ以外の場合は `open` がデフォルトです。
  `groupPolicy` は、`groupAllowFrom` または
  `allowFrom` のいずれかに具体的なエントリがある場合は `allowlist`、それ以外の場合は `open` がデフォルトです。
- 「Auth: allowlist」のスラッシュコマンドでは、
  `dmPolicy` / `groupPolicy` に関係なく、`allowFrom`（グループからの呼び出しの場合は `groupAllowFrom`）に明示的なワイルドカードではないエントリが必要です。[スラッシュコマンド](#slash-commands)を参照してください。

### 複数アカウントのセットアップ

1 つの OpenClaw インスタンスで複数の QQ Bot を実行します。

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

各アカウントは、`appId` をキーとする、分離された WebSocket 接続、API クライアント、トークン
キャッシュを所有します。ログ行には所有元のアカウント ID が付与されるため、
1 つの Gateway で複数の Bot を実行しても診断情報を個別に確認できます。

CLI で 2 つ目の Bot を追加します。

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### グループチャット

グループサポートでは、表示名ではなく QQ グループ OpenID を使用します。Bot を
グループに追加してからメンションするか、メンションなしで実行するようグループを設定します。

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` はすべてのグループのデフォルトを設定します。具体的な `groups.GROUP_OPENID`
エントリは、1 つのグループについてそのデフォルトを上書きします。グループ設定：

| フィールド                 | デフォルト          | 説明                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Bot が返信する前に `@` メンションを必須にします。                                                     |
| `commandLevel`        | `all`            | グループ内で実行できる組み込みスラッシュコマンドを指定します（後述）。                                    |
| `ignoreOtherMentions` | `false`          | Bot 以外の誰かをメンションし、Bot をメンションしていないメッセージを破棄します。                                           |
| `historyLimit`        | `50`             | 次にメンションされたターンのコンテキストとして保持する、メンションなしの直近メッセージ数です。`0` で履歴を無効にします。     |
| `tools`               | —                | グループ全体でツールを許可/拒否します。                                                              |
| `toolsBySender`       | —                | 送信者ごとのツール上書きです。[グループ](/ja-JP/channels/groups#groupchannel-tool-restrictions-optional)を参照してください。 |
| `name`                | openid のプレフィックス    | ログとグループコンテキストで使用される分かりやすいラベルです。                                                     |
| `prompt`              | 組み込みのデフォルト | エージェントのコンテキストに追加されるグループ単位の動作プロンプトです。                                           |

`commandLevel` には以下を指定できます。

| レベル    | 動作                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 既存の組み込みコマンドを引き続き使用できます。一部はメニューに表示されませんが、認可されたユーザーはグループ内で引き続き実行できます。                  |
| `safety` | `/help`、`/btw`、`/stop` はグループ内に引き続き表示されます。機密性の高いコマンド（`/config`、`/tools`、`/bash` など）はプライベートチャットで実行する必要があります。      |
| `strict` | 厳格な運用に必要なグループセッション制御のみが許可されます。認可された送信者が実行中の処理を中断できるよう、`/stop` は引き続き機能します。 |

古い QQBot の `toolPolicy` エントリは廃止されています。`openclaw doctor --fix` を実行して `tools` に移行してください。

アクティベーションモードは `mention` と `always` です。`requireMention: true` は
`mention` に、`requireMention: false` は `always` に対応します。セッションレベルのアクティベーション
上書きが存在する場合は、設定より優先されます。

受信キューはピアごとに管理されます。グループピアにはより大きなキュー上限（ダイレクトピアの 20 に対して 50）が適用され、
満杯になると人間が作成したメッセージより先に Bot が作成したメッセージを削除し、
通常のグループメッセージの連続送信を、送信者情報付きの 1 つのターンにまとめます。スラッシュ
コマンドは、マージバッチとは独立して 1 つずつ実行されます。

### 音声（STT / TTS）

STT と TTS は、優先順位に基づくフォールバックを備えた 2 段階の設定をサポートします。

| 設定 | Plugin 固有                                          | フレームワークのフォールバック            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`、`channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

いずれかに `enabled: false` を設定すると無効になります。アカウントレベルの TTS 上書きは
`messages.tts` と同じ形式を使用し、チャンネル/グローバル TTS 設定にディープマージされます。

STT リクエストはデフォルトで 60 秒後にタイムアウトします。Plugin 固有の STT は、
選択された `models.providers.<id>.timeoutSeconds` 上書きを使用します。フレームワークの音声 STT は
`tools.media.audio.models[0].timeoutSeconds`、次に
`tools.media.audio.timeoutSeconds`、その後に選択されたプロバイダーの上書きを使用します。

受信した QQ 音声添付ファイルは、元の音声ファイルを汎用の `MediaPaths` に含めないまま、
音声メディアのメタデータとしてエージェントに公開されます。プレーンテキストの返信に
`[[audio_as_voice]]` を含めると、TTS が設定されている場合に音声が合成され、QQ ネイティブの音声メッセージとして送信されます。

送信音声のアップロード/トランスコード動作も、
`channels.qqbot.audioFormatPolicy` で調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 対象形式

| 形式                     | 説明        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット         |
| `qqbot:channel:CHANNEL_ID` | ギルドチャンネル      |

<Note>
各 Bot には、それぞれ固有のユーザー OpenID のセットがあります。Bot A が受信した OpenID を使用して Bot B 経由でメッセージを送信することは**できません**。
</Note>

## スラッシュコマンド

AI キューに入る前にインターセプトされる組み込みコマンド：

| コマンド              | 認証      | スコープ        | 説明                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | 任意          | レイテンシーテスト                                                                   |
| `/bot-help`          | —         | 任意          | すべてのコマンドを一覧表示                                                              |
| `/bot-me`            | —         | プライベートのみ | `allowFrom` / `groupAllowFrom` の設定に使用する送信者の QQ ユーザー ID（openid）を表示 |
| `/bot-version`       | —         | プライベートのみ | OpenClaw フレームワークと Plugin のバージョンを表示                         |
| `/bot-upgrade`       | —         | プライベートのみ | QQBot アップグレードガイドへのリンクを表示                                              |
| `/bot-approve`       | 許可リスト | プライベートのみ | コマンド実行承認の設定を管理（オン / オフ / 常時 / リセット / ステータス）  |
| `/bot-logs`          | 許可リスト | プライベートのみ | 最近の Gateway ログをファイルとしてエクスポート                                           |
| `/bot-clear-storage` | 許可リスト | プライベートのみ | QQBot メディアディレクトリ内のキャッシュ済みダウンロードを削除                        |
| `/bot-streaming`     | 許可リスト | プライベートのみ | C2C ストリーミング応答を切り替え                                                   |
| `/bot-group-allways` | 許可リスト | プライベートのみ | デフォルトのグループ有効化モード（メンション必須 / 常時有効）を切り替え      |

使用方法のヘルプを表示するには、任意のコマンドに `?` を追加します（例：`/bot-upgrade ?`）。

「認証: 許可リスト」のコマンドでは、明示的なワイルドカードなしの
`allowFrom` リストに送信者の openid が含まれている必要もあります（グループから発行された
コマンドでは `groupAllowFrom` が優先され、`allowFrom` にフォールバックします）。
ワイルドカード `allowFrom: ["*"]` はチャットを許可しますが、これらのコマンドは許可しません。
プライベートチャット以外で実行した場合、または認証されていない場合は、
メッセージを黙って破棄するのではなく、ヒントを返します。

`/bot-me`、`/bot-version`、`/bot-upgrade` はプライベートチャット専用ですが、
許可リストは必要ありません。どの C2C 送信者でも実行できます。

QQ Bot の実行承認でデフォルトの同一チャットフォールバックを使用する場合、ネイティブ承認
ボタンのクリックにも同じ明示的なワイルドカードなしのコマンド許可リストが適用されます。
より広範なコマンドアクセスを付与せずに承認のみのアクセスを付与するには、
`channels.qqbot.execApprovals.approvers` を設定します。ネイティブ実行承認は
デフォルトで有効です。

## メディアとストレージ

- 受信、送信、および Gateway ブリッジのメディアは、
  `~/.openclaw/media/qqbot` 配下の単一のペイロードルートを共有するため（設定されている場合は `OPENCLAW_HOME` に従います）、
  アップロード、ダウンロード、トランスコードキャッシュが単一の保護されたディレクトリ内に保持されます。
- C2C およびグループターゲットへのリッチメディア配信は、単一の `sendMedia`
  パスを経由します。5&nbsp;MiB 以上のローカルファイルとメモリ内バッファーは QQ の
  チャンクアップロードエンドポイントを使用し、それより小さいペイロードとリモート URL/Base64 ソースは
  ワンショットアップロード API を使用します。
- ホットアップグレードにより、`openclaw.json` の書き込み完了前に Gateway が中断された場合、
  Plugin は次回起動時に内部スナップショットから、そのアカウントの最後に確認された `appId` / `clientSecret`
  を復元します（意図的な設定変更を上書きすることはありません）。そのため、
  QR コードを再スキャンする必要はありません。

## トラブルシューティング

- **Gateway が起動しない / 受信メッセージがない：** `appId` と
  `clientSecret` が正しく、QQ Open Platform でボットが有効になっていることを確認してください。
  認証情報がない場合は、「QQBot not configured (missing appId or
  clientSecret)」と表示されます。
- **`--token-file` で設定しても未設定と表示される：** `--token-file` で
  設定されるのは AppSecret のみです。`appId` は、設定または `QQBOT_APP_ID` で引き続き設定する必要があります。
- **グループ応答が集中すると衝突する：** ピアのキューがいっぱいになった場合、
  受信キューは人間が送信したメッセージより先にボットが送信したメッセージを削除し、
  通常の（コマンドではない）グループメッセージの集中を、送信者情報付きの 1 回のターンにまとめます。そのため、
  ボットの会話が大量に発生しても、人間のメッセージが処理されなくなることはありません。
- **能動的なメッセージが届かない：** ユーザーが最近やり取りしていない場合、
  QQ がボットから開始されたメッセージをブロックすることがあります。
- **音声が文字起こしされない：** STT が設定されており、プロバイダーに
  到達できることを確認してください。

## 関連項目

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
