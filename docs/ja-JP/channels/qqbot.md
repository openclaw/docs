---
read_when:
    - OpenClaw を QQ に接続したい
    - QQ Bot の認証情報のセットアップが必要です
    - QQ Bot のグループチャットまたはプライベートチャットのサポートが必要な場合
summary: QQ Bot のセットアップ、設定、使用方法
title: QQ ボット
x-i18n:
    generated_at: "2026-05-02T04:49:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot は、公式 QQ Bot API（WebSocket gateway）経由で OpenClaw に接続します。この
Plugin は、C2C プライベートチャット、グループ @messages、ギルドチャンネルメッセージと、
リッチメディア（画像、音声、動画、ファイル）をサポートします。

状態: ダウンロード可能なPlugin。ダイレクトメッセージ、グループチャット、ギルドチャンネル、
メディアがサポートされています。リアクションとスレッドはサポートされていません。

## インストール

セットアップの前に QQ Bot をインストールします。

```bash
openclaw plugins install @openclaw/qqbot
```

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) にアクセスし、スマートフォンの QQ で QR コードをスキャンして
   登録 / ログインします。
2. **Create Bot** をクリックして新しい QQ bot を作成します。
3. bot の設定ページで **AppID** と **AppSecret** を探してコピーします。

> AppSecret は平文では保存されません。保存せずにページを離れた場合は、
> 新しいものを再生成する必要があります。

4. チャンネルを追加します。

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway を再起動します。

対話型セットアップのパス:

```bash
openclaw channels add
openclaw configure --section channels
```

## 設定

最小構成:

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

デフォルトアカウントの環境変数:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

ファイルベースの AppSecret:

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

注:

- 環境変数フォールバックは、デフォルトの QQ Bot アカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...` は
  AppSecret のみを提供します。AppID は config または `QQBOT_APP_ID` にすでに設定されている必要があります。
- `clientSecret` は平文文字列だけでなく、SecretRef 入力も受け付けます。

### 複数アカウントのセットアップ

単一の OpenClaw インスタンス配下で複数の QQ bot を実行します。

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

各アカウントは独自の WebSocket 接続を起動し、独立した
トークンキャッシュ（`appId` で分離）を維持します。

CLI で 2 つ目の bot を追加します。

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### グループチャット

QQ Bot のグループチャットサポートは、表示名ではなく QQ グループ OpenID を使用します。bot を
グループに追加し、メンションするか、メンションなしで実行するようにグループを設定します。

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` はすべてのグループのデフォルトを設定し、具体的な
`groups.GROUP_OPENID` エントリは 1 つのグループについてそれらのデフォルトを上書きします。グループ
設定には次が含まれます。

- `requireMention`: bot が返信する前に @mention を要求します。デフォルト: `true`。
- `ignoreOtherMentions`: bot ではなく他の人にメンションしているメッセージを破棄します。
- `historyLimit`: 次にメンションされたターンのコンテキストとして、最近の非メンショングループメッセージを保持します。無効にするには `0` を設定します。
- `toolPolicy`: グループスコープのツールに対する `full`、`restricted`、または `none`。
- `name`: ログとグループコンテキストで使用されるわかりやすいラベル。
- `prompt`: エージェントコンテキストに追加される、グループごとの動作プロンプト。

アクティベーションモードは `mention` と `always` です。`requireMention: true` は
`mention` に対応し、`requireMention: false` は `always` に対応します。セッションレベルのアクティベーション
上書きが存在する場合は、config より優先されます。

受信キューはピアごとです。グループピアにはより大きなキュー上限があり、満杯時には bot が書いた雑談よりも
人間のメッセージを優先し、通常の
グループメッセージのバーストを 1 つの発言者付きターンに結合します。スラッシュコマンドは引き続き 1 つずつ実行されます。

### 音声（STT / TTS）

STT と TTS は、優先度フォールバック付きの 2 レベル設定をサポートします。

| 設定 | Plugin 固有                                            | フレームワークフォールバック |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
        qq-main: {
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

いずれかを無効にするには `enabled: false` を設定します。
アカウントレベルの TTS 上書きは `messages.tts` と同じ形を使用し、チャンネル / グローバルの TTS config に
ディープマージされます。

受信 QQ 音声添付は、raw 音声ファイルを汎用の `MediaPaths` から除外したまま、
音声メディアメタデータとしてエージェントに公開されます。TTS が
設定されている場合、`[[audio_as_voice]]` 平文返信は TTS を合成し、ネイティブ QQ 音声メッセージを送信します。

送信音声のアップロード / トランスコード動作は、
`channels.qqbot.audioFormatPolicy` でも調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## ターゲット形式

| 形式                       | 説明               |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット   |
| `qqbot:channel:CHANNEL_ID` | ギルドチャンネル   |

> 各 bot には独自のユーザー OpenID セットがあります。Bot A が受信した OpenID は、Bot B 経由でメッセージを送信するために
> 使用することは**できません**。

## スラッシュコマンド

AI キューの前にインターセプトされる組み込みコマンド:

| コマンド       | 説明                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | レイテンシテスト                                                                                         |
| `/bot-version` | OpenClaw フレームワークのバージョンを表示                                                                |
| `/bot-help`    | すべてのコマンドを一覧表示                                                                               |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` セットアップ用に送信者の QQ ユーザー ID（openid）を表示                     |
| `/bot-upgrade` | QQBot アップグレードガイドのリンクを表示                                                                 |
| `/bot-logs`    | 最近の gateway ログをファイルとしてエクスポート                                                          |
| `/bot-approve` | ネイティブフローを通じて、保留中の QQ Bot アクション（例: C2C またはグループアップロードの確認）を承認します。 |

使用方法のヘルプを表示するには、任意のコマンドに `?` を追加します（例: `/bot-upgrade ?`）。

管理者コマンド（`/bot-me`、`/bot-upgrade`、`/bot-logs`、`/bot-clear-storage`、`/bot-streaming`、`/bot-approve`）はダイレクトメッセージ専用で、送信者の openid が明示的な非ワイルドカードの `allowFrom` リストに含まれている必要があります。ワイルドカード `allowFrom: ["*"]` はチャットを許可しますが、管理者コマンドアクセスは付与しません。グループメッセージはまず `groupAllowFrom` と照合され、該当しない場合は `allowFrom` にフォールバックします。グループで管理者コマンドを実行すると、黙って破棄されるのではなくヒントが返されます。

## エンジンアーキテクチャ

QQ Bot は、Plugin 内の自己完結型エンジンとして提供されます。

- 各アカウントは、`appId` をキーとする分離されたリソーススタック（WebSocket 接続、API クライアント、トークンキャッシュ、メディアストレージルート）を所有します。アカウント間で受信 / 送信状態が共有されることはありません。
- 複数アカウントロガーは、所有アカウントでログ行にタグを付けるため、1 つの gateway 配下で複数の bot を実行している場合でも診断を分離しておけます。
- 受信、送信、gateway ブリッジのパスは、`~/.openclaw/media` 配下の単一のメディアペイロードルートを共有します。そのため、アップロード、ダウンロード、トランスコードキャッシュは、サブシステムごとのツリーではなく、1 つの保護されたディレクトリ配下に配置されます。
- リッチメディア配信は、C2C とグループターゲットに対して単一の `sendMedia` パスを通ります。大容量ファイルしきい値を超えるローカルファイルとバッファは QQ のチャンクアップロードエンドポイントを使用し、小さいペイロードはワンショットメディア API を使用します。
- 認証情報は、標準の OpenClaw 認証情報スナップショットの一部としてバックアップおよび復元できます。エンジンは復元時に、各アカウントのリソーススタックを新しい QR コードペアなしで再接続します。

## QR コードオンボーディング

`AppID:AppSecret` を手動で貼り付ける代替として、このエンジンは QQ Bot を OpenClaw にリンクするための QR コードオンボーディングフローをサポートします。

1. QQ Bot セットアップパス（例: `openclaw channels add --channel qqbot`）を実行し、プロンプトで QR コードフローを選択します。
2. ターゲット QQ Bot に関連付けられたスマートフォンアプリで生成された QR コードをスキャンします。
3. スマートフォンでペアリングを承認します。OpenClaw は返された認証情報を、適切なアカウントスコープ配下の `credentials/` に永続化します。

bot 自体によって生成された承認プロンプト（例: QQ Bot API で公開される「このアクションを許可するか?」フロー）は、raw QQ クライアント経由で返信するのではなく、`/bot-approve` で承認できるネイティブ OpenClaw プロンプトとして表示されます。

## トラブルシューティング

- **bot が「gone to Mars」と返信する:** 認証情報が設定されていないか、Gateway が起動していません。
- **受信メッセージがない:** `appId` と `clientSecret` が正しいこと、また
  bot が QQ Open Platform で有効になっていることを確認してください。
- **自己返信が繰り返される:** OpenClaw は QQ 送信 ref インデックスを
  bot 作成として記録し、現在の `msgIdx` が同じ bot アカウントと一致する受信イベントを無視します。
  これにより、プラットフォームのエコーループを防ぎながら、ユーザーが過去の bot メッセージを
  引用または返信することは引き続き可能になります。
- **`--token-file` でセットアップしても未設定と表示される:** `--token-file` は
  AppSecret のみを設定します。config または `QQBOT_APP_ID` に `appId` が必要です。
- **プロアクティブメッセージが届かない:** ユーザーが最近やり取りしていない場合、QQ が bot 起点のメッセージをインターセプトすることがあります。
- **音声が文字起こしされない:** STT が設定され、プロバイダーに到達可能であることを確認してください。

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
