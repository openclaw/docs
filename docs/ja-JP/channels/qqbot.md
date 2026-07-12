---
read_when:
    - OpenClawをQQに接続する場合
    - QQ Bot の認証情報を設定する必要があります
    - QQ Botのグループチャットまたはプライベートチャットのサポートが必要な場合
summary: QQ Bot のセットアップ、設定、使用方法
title: QQボット
x-i18n:
    generated_at: "2026-07-12T14:19:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot は、公式 QQ Bot API（WebSocket Gateway）を介して OpenClaw に接続します。
主なチャット形式は C2C プライベートチャットとグループでの `@` メンションで、リッチ
メディア（画像、音声、動画、ファイル）に対応しています。ギルドチャンネルメッセージで
対応しているのはテキストとリモート URL 画像のみです。ギルドチャンネルでは、音声、動画、
ファイルのアップロード、ローカル画像および Base64 画像は利用できません。リアクションと
スレッドは、どの場所でもサポートされていません。

ステータス：公式ダウンロード可能 Plugin。

## インストール

```bash
openclaw plugins install @openclaw/qqbot
```

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) に移動し、スマートフォンの QQ で QR コードを
   スキャンして登録またはログインします。
2. **Create Bot** をクリックして、新しい QQ Bot を作成します。
3. Bot の設定ページで **AppID** と **AppSecret** を見つけ、コピーします。

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

ウィザードでは、AppID/AppSecret を手動入力する代わりに QR コードでバインドすることも
できます。対象の QQ Bot に関連付けられたスマートフォンアプリでコードをスキャンすると、
バインドが完了します。OpenClaw は、返された認証情報をアカウントの設定スコープ内に
永続化します。

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

ファイルに保存した AppSecret：

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

注：

- `openclaw channels add --channel qqbot --token-file ...` が設定するのは AppSecret
  のみです。`appId` は、設定または `QQBOT_APP_ID` にあらかじめ設定されている必要があります。
- `clientSecret` には、平文文字列、ファイルパス（`clientSecretFile`）、
  または構造化された SecretRef オブジェクトを指定できます。
- 従来の `secretref:...` / `secretref-env:...` マーカー文字列は
  `clientSecret` では拒否されます。代わりに構造化された SecretRef オブジェクトを使用してください。

### アクセスポリシー

- `allowFrom` / `groupAllowFrom` は、C2C / グループのコンテキストで Bot と
  チャットできるユーザーを制限します。`dmPolicy` / `groupPolicy`（`open` | `allowlist` | `disabled`）
  は適用モードを制御します。`allowFrom` に具体的な（ワイルドカードではない）エントリが
  ある場合、`dmPolicy` のデフォルトは `allowlist` になり、それ以外の場合は `open` になります。
  `groupAllowFrom` または `allowFrom` のいずれかに具体的なエントリがある場合、
  `groupPolicy` のデフォルトは `allowlist` になり、それ以外の場合は `open` になります。
- 「認証：許可リスト」のスラッシュコマンドには、`dmPolicy` / `groupPolicy` に関係なく、
  `allowFrom`（グループからの呼び出しでは `groupAllowFrom`）にワイルドカードではない
  明示的なエントリが必要です。[スラッシュコマンド](#slash-commands)を参照してください。

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

各アカウントは、`appId` をキーとして分離された WebSocket 接続、API クライアント、
トークンキャッシュを所有します。ログ行には所有アカウント ID が付けられるため、
1 つの Gateway で複数の Bot を実行しても、診断情報を個別に確認できます。

CLI で 2 つ目の Bot を追加します。

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### グループチャット

グループ対応では、表示名ではなく QQ グループの OpenID を使用します。Bot を
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

`groups["*"]` はすべてのグループにデフォルトを設定します。具体的な `groups.GROUP_OPENID`
エントリは、1 つのグループについてそれらのデフォルトを上書きします。グループ設定：

| フィールド            | デフォルト       | 説明                                                                                                       |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Bot が返信する前に `@` メンションを必須にします。                                                         |
| `commandLevel`        | `all`            | グループで実行できる組み込みスラッシュコマンドを指定します（以下を参照）。                               |
| `ignoreOtherMentions` | `false`          | Bot 以外の誰かをメンションし、Bot をメンションしていないメッセージを破棄します。                          |
| `historyLimit`        | `50`             | 次にメンションされたターンのコンテキストとして保持する、メンションなしの最近のメッセージ数です。`0` で履歴を無効にします。 |
| `tools`               | —                | グループ全体でツールを許可または拒否します。                                                             |
| `toolsBySender`       | —                | 送信者ごとのツール上書きです。[グループ](/ja-JP/channels/groups#groupchannel-tool-restrictions-optional)を参照してください。 |
| `name`                | openid の接頭辞  | ログとグループコンテキストで使用される分かりやすいラベルです。                                           |
| `prompt`              | 組み込みデフォルト | エージェントのコンテキストに追加される、グループごとの動作プロンプトです。                               |

`commandLevel` に指定できる値：

| レベル   | 動作                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 既存の組み込みコマンドを引き続き利用できます。一部はメニューに表示されませんが、認可されたユーザーはグループ内で引き続き実行できます。                |
| `safety` | `/help`、`/btw`、`/stop` はグループ内に引き続き表示されます。機密性の高いコマンド（`/config`、`/tools`、`/bash` など）はプライベートチャットで実行する必要があります。 |
| `strict` | 厳格な運用に必要なグループセッション制御のみが許可されます。認可された送信者がアクティブな実行を中断できるよう、`/stop` は引き続き機能します。        |

古い QQBot の `toolPolicy` エントリは廃止されました。`openclaw doctor --fix` を実行して `tools` に移行してください。

アクティベーションモードは `mention` と `always` です。`requireMention: true` は
`mention` に、`requireMention: false` は `always` に対応します。セッションレベルの
アクティベーション上書きが存在する場合は、設定よりも優先されます。

受信キューはピアごとに管理されます。グループピアのキュー上限はダイレクトピアより大きく
（50 対 20）、満杯になると人間が作成したメッセージより先に Bot が作成したメッセージを
削除し、通常のグループメッセージが連続した場合は、送信者情報付きの 1 ターンにまとめます。
スラッシュコマンドは、マージされたバッチとは独立して 1 つずつ実行されます。

### 音声（STT / TTS）

STT と TTS は、優先順位に基づくフォールバックを備えた 2 レベルの設定に対応しています。

| 設定 | Plugin 固有                                             | フレームワークのフォールバック |
| ---- | ------------------------------------------------------- | ------------------------------ |
| STT  | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]`  |
| TTS  | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                 |

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

どちらかを無効にするには `enabled: false` を設定します。アカウントレベルの TTS 上書きは
`messages.tts` と同じ形式を使用し、チャンネルまたはグローバルの TTS 設定にディープマージされます。

STT リクエストは、デフォルトで 60 秒後にタイムアウトします。Plugin 固有の STT は、
選択された `models.providers.<id>.timeoutSeconds` の上書きを使用します。フレームワークの音声 STT
は、`tools.media.audio.models[0].timeoutSeconds`、次に
`tools.media.audio.timeoutSeconds`、最後に選択されたプロバイダーの上書きを使用します。

受信した QQ 音声添付ファイルは、未加工の音声ファイルを汎用の `MediaPaths` に含めずに、
音声メディアのメタデータとしてエージェントに公開されます。TTS が設定されている場合、
プレーンテキストの返信に含まれる `[[audio_as_voice]]` は TTS を合成し、QQ ネイティブの
音声メッセージを送信します。

送信音声のアップロードおよびトランスコードの動作は、
`channels.qqbot.audioFormatPolicy` でも調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## ターゲット形式

| 形式                       | 説明                   |
| -------------------------- | ---------------------- |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット       |
| `qqbot:channel:CHANNEL_ID` | ギルドチャンネル       |

<Note>
各 Bot には、それぞれ固有のユーザー OpenID のセットがあります。Bot A が受信した OpenID を使用して、Bot B 経由でメッセージを送信することは**できません**。
</Note>

## スラッシュコマンド

AI キューに入る前にインターセプトされる組み込みコマンド：

| コマンド             | 認証      | スコープ           | 説明                                                                                 |
| -------------------- | --------- | ------------------ | ------------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | すべて             | レイテンシーテスト                                                                   |
| `/bot-help`          | —         | すべて             | すべてのコマンドを一覧表示                                                           |
| `/bot-me`            | —         | プライベートのみ   | `allowFrom` / `groupAllowFrom` の設定に使用する送信者の QQ ユーザー ID（openid）を表示 |
| `/bot-version`       | —         | プライベートのみ   | OpenClaw フレームワークのバージョンと Plugin のバージョンを表示                      |
| `/bot-upgrade`       | —         | プライベートのみ   | QQBot のアップグレードガイドへのリンクを表示                                         |
| `/bot-approve`       | allowlist | プライベートのみ   | コマンド実行承認の設定を管理（on / off / always / reset / status）                    |
| `/bot-logs`          | allowlist | プライベートのみ   | 最近の Gateway ログをファイルとしてエクスポート                                      |
| `/bot-clear-storage` | allowlist | プライベートのみ   | QQBot メディアディレクトリ内のキャッシュ済みダウンロードを削除                       |
| `/bot-streaming`     | allowlist | プライベートのみ   | C2C ストリーミング返信を切り替え                                                      |
| `/bot-group-allways` | allowlist | プライベートのみ   | デフォルトのグループアクティベーションモード（メンション必須 / 常時オン）を切り替え  |

使用方法のヘルプを表示するには、任意のコマンドに `?` を追加します（例：`/bot-upgrade ?`）。

「認証：許可リスト」のコマンドでは、さらに送信者の openid が、ワイルドカードではない
明示的な `allowFrom` リストに含まれている必要があります（グループから発行されたコマンドでは
`groupAllowFrom` が優先され、該当しない場合は `allowFrom` にフォールバックします）。
ワイルドカードの `allowFrom: ["*"]` はチャットを許可しますが、これらのコマンドは許可しません。
プライベートチャット以外で実行した場合、または認可されていない場合は、メッセージを
黙って破棄するのではなく、ヒントを返します。

`/bot-me`、`/bot-version`、`/bot-upgrade` はプライベートチャット専用ですが、
許可リストは必要ありません。どの C2C 送信者でも実行できます。

QQ Bot の実行承認でデフォルトの同一チャットへのフォールバックを使用する場合、ネイティブ承認
ボタンのクリックにも、同じ明示的な非ワイルドカードのコマンド許可リストが適用されます。より広範なコマンドアクセスを付与せず、
承認のみのアクセスを許可するには、
`channels.qqbot.execApprovals.approvers` を設定します。ネイティブ実行承認はデフォルトで
有効です。

## メディアとストレージ

- 受信、送信、Gateway ブリッジのメディアは、
  `~/.openclaw/media/qqbot` 配下の単一のペイロードルートを共有します（設定されている場合は `OPENCLAW_HOME` に従います）。そのため、アップロード、
  ダウンロード、トランスコードキャッシュは、保護された単一のディレクトリ内に保持されます。
- C2C およびグループターゲットへのリッチメディア配信は、単一の `sendMedia`
  パスを経由します。5&nbsp;MiB 以上のローカルファイルおよびメモリ内バッファには QQ の
  チャンクアップロードエンドポイントを使用し、それより小さいペイロードとリモート URL/Base64 ソースには
  ワンショットアップロード API を使用します。
- ホットアップグレードによって `openclaw.json` の書き込み完了前に Gateway が中断された場合、
  Plugin は次回起動時に、内部スナップショットからそのアカウントの最後に確認された `appId` / `clientSecret`
  を復元します（意図的な設定変更を上書きすることはありません）。そのため、
  QR コードを再スキャンする必要はありません。

## トラブルシューティング

- **Gateway が起動しない / 受信メッセージがない:** `appId` と
  `clientSecret` が正しく、QQ Open Platform でボットが有効になっていることを確認してください。
  認証情報が欠けている場合は、「QQBot not configured (missing appId or
  clientSecret)」と表示されます。
- **`--token-file` を使用してセットアップしても未設定と表示される:** `--token-file` は
  AppSecret のみを設定します。`appId` は引き続き設定ファイルまたは `QQBOT_APP_ID` で設定する必要があります。
- **集中したグループ返信が競合する:** ピアのキューがいっぱいになると、受信キューは人間が作成したメッセージより先に
  ボットが作成したメッセージを削除し、通常の（コマンドではない）グループメッセージの集中を、
  発言者情報付きの 1 回のターンにまとめます。そのため、ボットの大量の会話によって人間のメッセージが
  処理されなくなることはありません。
- **能動的なメッセージが届かない:** ユーザーが最近操作していない場合、
  QQ がボットから開始されたメッセージをブロックすることがあります。
- **音声が文字起こしされない:** STT が設定され、プロバイダーに
  到達できることを確認してください。

## 関連項目

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
