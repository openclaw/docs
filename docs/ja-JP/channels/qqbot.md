---
read_when:
    - OpenClawをQQに接続したい
    - QQ Bot の資格情報設定が必要です
    - QQ Bot のグループチャットまたはプライベートチャット対応が必要な場合
summary: QQ Bot のセットアップ、設定、使用方法
title: QQ ボット
x-i18n:
    generated_at: "2026-04-30T05:00:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot は公式 QQ Bot API（WebSocket gateway）経由で OpenClaw に接続します。この
Plugin は C2C プライベートチャット、グループ @messages、ギルドチャンネルメッセージを
リッチメディア（画像、音声、動画、ファイル）付きでサポートします。

ステータス: バンドル済みPlugin。ダイレクトメッセージ、グループチャット、ギルドチャンネル、
メディアがサポートされています。リアクションとスレッドはサポートされていません。

## バンドル済みPlugin

現在の OpenClaw リリースには QQ Bot がバンドルされているため、通常のパッケージ版ビルドでは
別途 `openclaw plugins install` 手順は不要です。

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) に移動し、スマートフォンの QQ で QR コードをスキャンして
   登録 / ログインします。
2. **Create Bot** をクリックして新しい QQ ボットを作成します。
3. ボットの設定ページで **AppID** と **AppSecret** を見つけ、コピーします。

> AppSecret は平文では保存されません。保存せずにページを離れると、
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

最小設定:

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

注記:

- 環境変数フォールバックはデフォルトの QQ Bot アカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...` は
  AppSecret のみを提供します。AppID は設定または `QQBOT_APP_ID` にすでに設定されている必要があります。
- `clientSecret` は平文文字列だけでなく、SecretRef 入力も受け付けます。

### 複数アカウントのセットアップ

単一の OpenClaw インスタンスで複数の QQ ボットを実行します。

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

CLI で 2 つ目のボットを追加します。

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### グループチャット

QQ Bot のグループチャットサポートでは、表示名ではなく QQ グループ OpenID を使用します。ボットを
グループに追加してから、メンションするか、メンションなしで実行するようにグループを設定します。

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

- `requireMention`: ボットが返信する前に @mention を要求します。デフォルト: `true`。
- `ignoreOtherMentions`: 他の誰かにメンションしているがボットにはメンションしていないメッセージを破棄します。
- `historyLimit`: 次にメンションされたターンのコンテキストとして、最近の非メンショングループメッセージを保持します。無効にするには `0` を設定します。
- `toolPolicy`: グループスコープのツールに対する `full`、`restricted`、または `none`。
- `name`: ログとグループコンテキストで使用される分かりやすいラベル。
- `prompt`: エージェントコンテキストに追加されるグループごとの動作プロンプト。

有効化モードは `mention` と `always` です。`requireMention: true` は
`mention` に対応し、`requireMention: false` は `always` に対応します。セッションレベルの有効化
上書きがある場合は、設定よりも優先されます。

受信キューはピアごとです。グループピアにはより大きなキュー上限が設定され、満杯時には
人間のメッセージがボット作成の雑談より優先され、通常の
グループメッセージのバーストは 1 つの発話者付きターンにマージされます。スラッシュコマンドは引き続き 1 つずつ実行されます。

### 音声（STT / TTS）

STT と TTS は、優先フォールバック付きの 2 段階設定をサポートします。

| 設定 | Plugin 固有                                             | フレームワークフォールバック |
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

どちらも無効にするには `enabled: false` を設定します。
アカウントレベルの TTS 上書きは `messages.tts` と同じ形状を使用し、チャンネル / グローバル TTS 設定に対して
ディープマージされます。

受信 QQ 音声添付は、生の音声ファイルを汎用 `MediaPaths` から除外したまま、
音声メディアメタデータとしてエージェントに公開されます。`[[audio_as_voice]]` 平文
返信は、TTS が設定されている場合に TTS を合成し、ネイティブ QQ 音声メッセージを送信します。

送信音声のアップロード / トランスコード動作も
`channels.qqbot.audioFormatPolicy` で調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## ターゲット形式

| 形式                       | 説明                 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット     |
| `qqbot:channel:CHANNEL_ID` | ギルドチャンネル     |

> 各ボットには独自のユーザー OpenID セットがあります。Bot A が受信した OpenID は、Bot B 経由でメッセージを送信するために
> 使用することは**できません**。

## スラッシュコマンド

AI キューの前にインターセプトされる組み込みコマンド:

| コマンド       | 説明                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | レイテンシテスト                                                                                         |
| `/bot-version` | OpenClaw フレームワークバージョンを表示                                                                  |
| `/bot-help`    | すべてのコマンドを一覧表示                                                                                |
| `/bot-upgrade` | QQBot アップグレードガイドへのリンクを表示                                                                |
| `/bot-logs`    | 最近の gateway ログをファイルとしてエクスポート                                                           |
| `/bot-approve` | ネイティブフローを通じて、保留中の QQ Bot アクション（例: C2C またはグループアップロードの確認）を承認します。 |

使用方法のヘルプを見るには、任意のコマンドに `?` を追加します（例: `/bot-upgrade ?`）。

## エンジンアーキテクチャ

QQ Bot は Plugin 内の自己完結型エンジンとして同梱されています。

- 各アカウントは、`appId` をキーとする分離されたリソーススタック（WebSocket 接続、API クライアント、トークンキャッシュ、メディアストレージルート）を所有します。アカウント間で受信 / 送信状態を共有することはありません。
- 複数アカウントロガーは、ログ行に所有アカウントのタグを付けるため、1 つの gateway で複数のボットを実行している場合でも診断を分離したままにできます。
- 受信、送信、gateway ブリッジのパスは、`~/.openclaw/media` 配下の単一のメディアペイロードルートを共有します。そのため、アップロード、ダウンロード、トランスコードキャッシュはサブシステムごとのツリーではなく、1 つの保護されたディレクトリ配下に配置されます。
- リッチメディア配信は、C2C とグループターゲットに対して 1 つの `sendMedia` パスを通ります。大容量ファイルしきい値を超えるローカルファイルとバッファは QQ のチャンクアップロードエンドポイントを使用し、小さいペイロードはワンショットメディア API を使用します。
- 認証情報は標準の OpenClaw 認証情報スナップショットの一部としてバックアップおよび復元できます。エンジンは復元時に、新しい QR コードペアを要求せずに各アカウントのリソーススタックを再アタッチします。

## QR コードオンボーディング

`AppID:AppSecret` を手動で貼り付ける代替として、エンジンは QQ Bot を OpenClaw にリンクするための QR コードオンボーディングフローをサポートします。

1. QQ Bot セットアップパス（例: `openclaw channels add --channel qqbot`）を実行し、プロンプトが表示されたら QR コードフローを選択します。
2. 対象の QQ Bot に紐づいたスマートフォンアプリで、生成された QR コードをスキャンします。
3. スマートフォンでペアリングを承認します。OpenClaw は返された認証情報を、適切なアカウントスコープの `credentials/` に永続化します。

ボット自体によって生成される承認プロンプト（例: QQ Bot API によって公開される「このアクションを許可しますか？」フロー）は、OpenClaw ネイティブのプロンプトとして表示されます。生の QQ クライアント経由で返信するのではなく、`/bot-approve` で承認できます。

## トラブルシューティング

- **ボットが「火星に行った」と返信する:** 認証情報が設定されていないか、Gateway が開始されていません。
- **受信メッセージがない:** `appId` と `clientSecret` が正しいこと、および
  ボットが QQ Open Platform で有効になっていることを確認します。
- **自己返信が繰り返される:** OpenClaw は QQ の送信参照インデックスを
  ボット作成として記録し、現在の `msgIdx` が同じ
  ボットアカウントと一致する受信イベントを無視します。これにより、ユーザーが以前のボットメッセージを
  引用または返信できる状態を保ちながら、プラットフォームのエコーループを防ぎます。
- **`--token-file` を使ったセットアップでも未設定と表示される:** `--token-file` は
  AppSecret のみを設定します。設定または `QQBOT_APP_ID` に `appId` も必要です。
- **プロアクティブメッセージが届かない:** ユーザーが最近やり取りしていない場合、QQ がボット起点のメッセージを遮断することがあります。
- **音声が文字起こしされない:** STT が設定され、プロバイダーに到達可能であることを確認します。

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
