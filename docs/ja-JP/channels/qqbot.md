---
read_when:
    - OpenClaw を QQ に接続したい
    - QQ Bot の認証情報設定が必要です
    - QQ Bot のグループチャットまたはプライベートチャット対応が必要な場合
summary: QQ Bot のセットアップ、設定、使用方法
title: QQ ボット
x-i18n:
    generated_at: "2026-06-27T10:40:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot は公式 QQ Bot API（WebSocket gateway）経由で OpenClaw に接続します。この
Plugin は C2C プライベートチャット、グループ @メッセージ、リッチメディア（画像、音声、動画、ファイル）付きのギルドチャンネルメッセージに対応しています。

状態: ダウンロード可能なPlugin。ダイレクトメッセージ、グループチャット、ギルドチャンネル、メディアに対応しています。リアクションとスレッドには対応していません。

## インストール

セットアップ前に QQ Bot をインストールします。

```bash
openclaw plugins install @openclaw/qqbot
```

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) に移動し、スマートフォンの QQ で QR コードをスキャンして
   登録 / ログインします。
2. **Create Bot** をクリックして新しい QQ bot を作成します。
3. bot の設定ページで **AppID** と **AppSecret** を見つけ、コピーします。

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

ファイルに基づく AppSecret:

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

環境変数 SecretRef AppSecret:

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

注記:

- 環境変数のフォールバックは、デフォルトの QQ Bot アカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...` は
  AppSecret のみを提供します。AppID はすでに設定内または `QQBOT_APP_ID` に設定されている必要があります。
- `clientSecret` は平文文字列だけでなく、SecretRef 入力も受け付けます。
- レガシーな `secretref:/...` マーカー文字列は有効な `clientSecret` 値ではありません。
  上の例のような構造化された SecretRef オブジェクトを使用してください。

### マルチアカウントセットアップ

単一の OpenClaw インスタンスで複数の QQ bot を実行します。

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

QQ Bot のグループチャット対応では、表示名ではなく QQ グループ OpenID を使用します。bot を
グループに追加し、メンションするか、メンションなしで実行するようグループを設定します。

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

`groups["*"]` はすべてのグループのデフォルトを設定し、具体的な
`groups.GROUP_OPENID` エントリは 1 つのグループについてそれらのデフォルトを上書きします。グループ
設定には次が含まれます。

- `requireMention`: bot が返信する前に @メンションを必須にします。デフォルト: `true`。
- `commandLevel`: グループ内で実行できる組み込みスラッシュコマンドを制御します。
  デフォルト: `all`。この設定を省略した場合、既存の QQBot グループ動作を維持します。
- `ignoreOtherMentions`: bot ではなく他の誰かにメンションしているメッセージを破棄します。
- `historyLimit`: 次にメンションされたターンのコンテキストとして、最近の非メンショングループメッセージを保持します。無効にするには `0` を設定します。
- `tools`: グループ全体のツールを許可/拒否します。
- `toolsBySender`: 送信者ごとのグループツール上書きです。[グループ](/ja-JP/channels/groups#groupchannel-tool-restrictions-optional) を参照してください。
- `name`: ログとグループコンテキストで使用される分かりやすいラベルです。
- `prompt`: エージェントコンテキストに追加される、グループごとの動作プロンプトです。

`commandLevel` は次を受け付けます。

- `all`: 認識済みの組み込みコマンドを以前どおり利用可能にします。一部のコマンドは
  メニューから非表示のままになる場合がありますが、承認されたユーザーは引き続きグループ内で実行できます。
- `safety`: `/help`、`/btw`、`/stop` などの一般的なコラボレーションコマンドを許可します。
  `/config`、`/tools`、`/bash` などの機密性の高いコマンドは
  プライベートチャットで実行するようユーザーに求めます。
- `strict`: 厳格なグループ運用に必要なグループセッション制御のみを許可します。
  `/stop` は引き続き緊急扱いのため、承認された送信者は
  アクティブな実行を中断できます。

古い QQBot の `toolPolicy` エントリは廃止されています。`openclaw doctor --fix` を実行して `tools` に移行してください。

アクティベーションモードは `mention` と `always` です。`requireMention: true` は
`mention` に対応し、`requireMention: false` は `always` に対応します。セッションレベルのアクティベーション
上書きが存在する場合は、設定より優先されます。

受信キューはピアごとです。グループピアではキュー上限が大きくなり、満杯時には bot 作成のやり取りより人間の
メッセージを優先し、通常の
グループメッセージのバーストを 1 つの帰属付きターンにマージします。スラッシュコマンドは引き続き 1 つずつ実行されます。

### 音声（STT / TTS）

STT と TTS は、優先フォールバック付きの 2 段階設定に対応しています。

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

どちらも無効にするには `enabled: false` を設定します。
アカウントレベルの TTS 上書きは `messages.tts` と同じ形を使用し、チャンネル/グローバル TTS 設定の上に
ディープマージされます。

受信した QQ 音声添付ファイルは、raw 音声ファイルを汎用 `MediaPaths` から除外したまま、
音声メディアメタデータとしてエージェントに公開されます。TTS が
設定されている場合、`[[audio_as_voice]]` のプレーン
テキスト返信は TTS を合成し、ネイティブ QQ 音声メッセージを送信します。

送信音声のアップロード/トランスコード動作は、
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

> 各 bot には独自のユーザー OpenID セットがあります。Bot A が受け取った OpenID は、Bot B 経由でメッセージを送信するために
> 使用することは**できません**。

## スラッシュコマンド

AI キューの前にインターセプトされる組み込みコマンド:

| コマンド       | 説明                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | レイテンシテスト                                                                                         |
| `/bot-version` | OpenClaw フレームワークのバージョンを表示                                                                |
| `/bot-help`    | すべてのコマンドを一覧表示                                                                                |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` セットアップ用に送信者の QQ ユーザー ID（openid）を表示                     |
| `/bot-upgrade` | QQBot アップグレードガイドのリンクを表示                                                                  |
| `/bot-logs`    | 最近の gateway ログをファイルとしてエクスポート                                                           |
| `/bot-approve` | ネイティブフローを通じて、保留中の QQ Bot アクション（たとえば C2C またはグループアップロードの確認）を承認します。 |

使用方法のヘルプを表示するには、任意のコマンドに `?` を追加します（例: `/bot-upgrade ?`）。

管理者コマンド（`/bot-me`、`/bot-upgrade`、`/bot-logs`、`/bot-clear-storage`、`/bot-streaming`、`/bot-approve`）はダイレクトメッセージ専用で、明示的な非ワイルドカード `allowFrom` リストに送信者の openid が含まれている必要があります。ワイルドカード `allowFrom: ["*"]` はチャットを許可しますが、管理者コマンドアクセスは付与しません。グループメッセージは最初に `groupAllowFrom` と照合され、該当しない場合は `allowFrom` にフォールバックします。グループで管理者コマンドを実行すると、黙って破棄するのではなくヒントを返します。

QQ Bot の exec 承認がデフォルトの同一チャットフォールバックを使用する場合、ネイティブ承認
ボタンのクリックは、同じ明示的な非ワイルドカードのコマンド許可リストに従います。より広範なコマンドアクセスなしで
承認専用アクセスを付与するには、
`channels.qqbot.execApprovals.approvers` を設定します。

## エンジンアーキテクチャ

QQ Bot は Plugin 内の自己完結型エンジンとして提供されます。

- 各アカウントは、`appId` をキーにした分離済みリソーススタック（WebSocket 接続、API クライアント、トークンキャッシュ、メディアストレージルート）を所有します。アカウント間で受信/送信状態が共有されることはありません。
- マルチアカウントロガーは、所有アカウントでログ行にタグ付けするため、1 つの gateway で複数の bot を実行しても診断を分離できます。
- 受信、送信、gateway ブリッジの各パスは、`~/.openclaw/media` 配下の単一のメディアペイロードルートを共有するため、アップロード、ダウンロード、トランスコードキャッシュはサブシステムごとのツリーではなく、1 つの保護されたディレクトリ配下に置かれます。
- リッチメディア配信は、C2C とグループターゲットの両方で 1 つの `sendMedia` パスを通ります。大容量ファイルしきい値を超えるローカルファイルとバッファは QQ のチャンクアップロードエンドポイントを使用し、それより小さいペイロードはワンショットメディア API を使用します。
- 認証情報は標準の OpenClaw 認証情報スナップショットの一部としてバックアップおよび復元できます。エンジンは復元時に、新しい QR コードペアを要求せずに各アカウントのリソーススタックを再接続します。

## QR コードオンボーディング

`AppID:AppSecret` を手動で貼り付ける代わりに、エンジンは QQ Bot を OpenClaw にリンクする QR コードオンボーディングフローに対応しています。

1. QQ Bot セットアップパス（例: `openclaw channels add --channel qqbot`）を実行し、プロンプトで QR コードフローを選択します。
2. ターゲットの QQ Bot に紐付いたスマートフォンアプリで、生成された QR コードをスキャンします。
3. スマートフォンでペアリングを承認します。OpenClaw は返された認証情報を、適切なアカウントスコープ配下の `credentials/` に保存します。

bot 自体によって生成された承認プロンプト（たとえば、QQ Bot API によって公開される「このアクションを許可しますか？」フロー）は、raw QQ クライアントで返信するのではなく `/bot-approve` で受け入れられるネイティブ OpenClaw プロンプトとして表示されます。

## トラブルシューティング

- **Bot が「gone to Mars」と返信する:** 認証情報が設定されていないか、Gateway が起動していません。
- **受信メッセージがない:** `appId` と `clientSecret` が正しいこと、および
  bot が QQ Open Platform で有効になっていることを確認してください。
- **自己返信が繰り返される:** OpenClaw は QQ の送信 ref インデックスを
  bot 作成として記録し、現在の `msgIdx` が同じ bot アカウントと一致する受信イベントを無視します。
  これにより、ユーザーが以前の bot メッセージを引用または返信できる状態を保ちながら、プラットフォームのエコーループを防ぎます。
- **`--token-file` でセットアップしても未設定と表示される:** `--token-file` は
  AppSecret のみを設定します。設定内の `appId` または `QQBOT_APP_ID` が引き続き必要です。
- **プロアクティブメッセージが届かない:** ユーザーが最近操作していない場合、QQ が bot 起点のメッセージをインターセプトすることがあります。
- **音声が文字起こしされない:** STT が設定されており、プロバイダーに到達できることを確認してください。

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
