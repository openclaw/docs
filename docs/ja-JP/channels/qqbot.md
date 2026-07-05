---
read_when:
    - OpenClaw を QQ に接続したい
    - QQ Bot の認証情報設定が必要です
    - QQ Bot のグループまたはプライベートチャット対応が必要です
summary: QQ Bot のセットアップ、設定、使用方法
title: QQ ボット
x-i18n:
    generated_at: "2026-07-05T11:05:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a63f31014c376573456157d5268b9828ce4c0ae8337e4f6428bb57322dd10916
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot は公式 QQ Bot API（WebSocket gateway）経由で OpenClaw に接続します。
C2C プライベートチャットとグループ `@` メンションが主なチャット種別で、リッチ
メディア（画像、音声、動画、ファイル）に対応します。ギルドチャンネルメッセージは
テキストとリモート URL 画像のみ対応しています。音声、動画、ファイルアップロード、ローカル/Base64
画像はギルドチャンネルでは利用できません。リアクションとスレッドは
どこでもサポートされていません。

ステータス: 公式ダウンロード可能 Plugin。

## インストール

```bash
openclaw plugins install @openclaw/qqbot
```

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) に移動し、スマートフォンの QQ で QR コードをスキャンして登録 / ログインします。
2. **Create Bot** をクリックして新しい QQ bot を作成します。
3. bot の設定ページで **AppID** と **AppSecret** を見つけ、コピーします。

<Note>
AppSecret は平文では保存されません。保存せずにページを離れると、新しいものを再生成する必要があります。
</Note>

4. チャンネルを追加します。

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway を再起動します。

対話式セットアップ:

```bash
openclaw channels add
```

ウィザードでは、AppID/AppSecret を手動で入力する代替として QR コードによるバインドも提供されます。
対象の QQ Bot に紐づいたスマートフォンアプリでコードをスキャンして、バインドを完了します。
OpenClaw は返された認証情報をアカウントの config スコープに永続化します。

## 設定

最小 config:

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

デフォルトアカウントの env vars（トップレベルアカウントのみ）:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

ファイル backed AppSecret:

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

Env SecretRef AppSecret:

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

- `openclaw channels add --channel qqbot --token-file ...` は AppSecret
  のみ設定します。`appId` は config または `QQBOT_APP_ID` にすでに設定されている必要があります。
- `clientSecret` は平文文字列、ファイルパス（`clientSecretFile`）、
  または構造化された SecretRef オブジェクトを受け付けます。
- 従来の `secretref:...` / `secretref-env:...` マーカー文字列は
  `clientSecret` では拒否されます。代わりに構造化された SecretRef オブジェクトを使用してください。

### アクセスポリシー

- `allowFrom` / `groupAllowFrom` は、C2C /
  グループコンテキストで bot とチャットできる相手を制限します。`dmPolicy` / `groupPolicy`（`open` | `allowlist` | `disabled`）
  は適用モードを制御します。`dmPolicy` は、`allowFrom` に具体的な（ワイルドカードでない）エントリがあると
  `allowlist` にデフォルト設定され、それ以外は `open` になります。
  `groupPolicy` は、`groupAllowFrom` または
  `allowFrom` のいずれかに具体的なエントリがあると `allowlist` にデフォルト設定され、それ以外は `open` になります。
- 「Auth: allowlist」の slash commands には、
  `dmPolicy` / `groupPolicy` に関係なく、`allowFrom`（またはグループ呼び出しでは `groupAllowFrom`）に明示的な非ワイルドカードのエントリが必要です。
  [slash commands](#slash-commands) を参照してください。

### 複数アカウントのセットアップ

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

各アカウントは `appId` をキーとして、分離された WebSocket 接続、API client、token
cache を所有します。複数の bot を 1 つの Gateway で実行するときに診断を分離しやすいように、ログ行には所有アカウント ID が付与されます。

CLI で 2 つ目の bot を追加します。

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### グループチャット

グループサポートは、表示名ではなく QQ グループ OpenID を使用します。bot を
グループに追加してから、メンションするか、メンションなしで実行するようグループを設定します。

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
エントリは、1 つのグループについてそれらのデフォルトを上書きします。グループ設定:

| フィールド            | デフォルト       | 説明                                                                                                  |
| --------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | bot が返信する前に `@` メンションを必須にします。                                                     |
| `commandLevel`        | `all`            | グループ内で実行できる組み込み slash commands（下記参照）。                                           |
| `ignoreOtherMentions` | `false`          | bot ではなく他の誰かをメンションしているメッセージを破棄します。                                      |
| `historyLimit`        | `50`             | 次のメンションされたターンのコンテキストとして保持する最近の非メンションメッセージ。`0` は履歴を無効にします。 |
| `tools`               | —                | グループ全体のツールを許可/拒否します。                                                               |
| `toolsBySender`       | —                | 送信者ごとのツール上書き。[Groups](/ja-JP/channels/groups#groupchannel-tool-restrictions-optional) を参照してください。 |
| `name`                | openid prefix    | ログとグループコンテキストで使用されるわかりやすいラベル。                                           |
| `prompt`              | 組み込みデフォルト | エージェントコンテキストに追加されるグループごとの動作プロンプト。                                   |

`commandLevel` は次を受け付けます。

| レベル   | 動作                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 既存の組み込みコマンドは引き続き利用できます。一部はメニューには表示されませんが、認可されたユーザーはグループ内で引き続き実行できます。      |
| `safety` | `/help`、`/btw`、`/stop` はグループ内で表示されたままです。機密コマンド（`/config`、`/tools`、`/bash` など）はプライベートチャットで実行する必要があります。 |
| `strict` | 厳格な運用に必要なグループセッション制御のみが許可されます。認可された送信者がアクティブな実行を中断できるよう、`/stop` は引き続き動作します。 |

古い QQBot `toolPolicy` エントリは廃止されました。`openclaw doctor --fix` を実行して `tools` に移行してください。

アクティベーションモードは `mention` と `always` です。`requireMention: true` は
`mention` にマップされ、`requireMention: false` は `always` にマップされます。セッションレベルのアクティベーション
上書きが存在する場合は、config より優先されます。

インバウンドキューはピアごとです。グループピアには直接ピアより大きいキュー上限（50 対 20）
があり、満杯時は人間のメッセージより先に bot 作成メッセージを退避し、
通常のグループメッセージのバーストを、1 つの属性付きターンにマージします。Slash
commands はマージバッチとは独立して 1 つずつ実行されます。

### 音声（STT / TTS）

STT と TTS は、優先 fallback 付きの 2 レベル設定に対応しています。

| 設定 | Plugin 固有                                             | フレームワーク fallback       |
| ---- | ------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

無効にするには、どちらかに `enabled: false` を設定します。アカウントレベルの TTS 上書きは
`messages.tts` と同じ形を使用し、チャンネル/グローバル TTS config に deep-merge されます。

インバウンド QQ 音声添付ファイルは、生の音声ファイルを汎用 `MediaPaths` から除外したまま、
音声メディアメタデータとしてエージェントに公開されます。プレーンテキスト返信内の `[[audio_as_voice]]`
は、TTS が設定されている場合に TTS を合成し、ネイティブ QQ 音声メッセージを送信します。

アウトバウンド音声のアップロード/トランスコード動作も
`channels.qqbot.audioFormatPolicy` で調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## ターゲット形式

| 形式                       | 説明                     |
| -------------------------- | ------------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット         |
| `qqbot:channel:CHANNEL_ID` | ギルドチャンネル         |

<Note>
各 bot には独自のユーザー OpenID セットがあります。Bot A が受信した OpenID を使用して Bot B 経由でメッセージを送信することは**できません**。
</Note>

## Slash commands

AI キューの前にインターセプトされる組み込みコマンド:

| コマンド             | 認証      | スコープ       | 説明                                                                            |
| -------------------- | --------- | -------------- | ------------------------------------------------------------------------------- |
| `/bot-ping`          | —         | 任意           | レイテンシーテスト                                                              |
| `/bot-help`          | —         | 任意           | すべてのコマンドを一覧表示                                                      |
| `/bot-me`            | —         | private only   | `allowFrom` / `groupAllowFrom` セットアップ用に送信者の QQ ユーザー ID（openid）を表示 |
| `/bot-version`       | —         | private only   | OpenClaw フレームワークバージョンと plugin バージョンを表示                    |
| `/bot-upgrade`       | —         | private only   | QQBot アップグレードガイドのリンクを表示                                        |
| `/bot-approve`       | allowlist | private only   | コマンド実行承認 config を管理（on / off / always / reset / status）            |
| `/bot-logs`          | allowlist | private only   | 最近の gateway ログをファイルとしてエクスポート                                 |
| `/bot-clear-storage` | allowlist | private only   | QQBot メディアディレクトリ配下のキャッシュ済みダウンロードを削除                |
| `/bot-streaming`     | allowlist | private only   | C2C streaming 返信を切り替え                                                    |
| `/bot-group-allways` | allowlist | private only   | デフォルトのグループアクティベーションモード（メンション必須 vs. 常時オン）を切り替え |

使用方法のヘルプを表示するには任意のコマンドに `?` を追加します（例: `/bot-upgrade ?`）。

「Auth: allowlist」コマンドでは、さらに送信者の openid が
明示的な非ワイルドカードの `allowFrom` リストに含まれている必要があります（グループ発行コマンドでは `groupAllowFrom` が優先され、
`allowFrom` に fallback します）。ワイルドカード
`allowFrom: ["*"]` はチャットを許可しますが、これらのコマンドは許可しません。これらのいずれかを
プライベートチャット外で実行した場合、または認可なしで実行した場合は、
メッセージを黙って破棄するのではなくヒントを返します。

`/bot-me`、`/bot-version`、`/bot-upgrade` はプライベートチャット専用ですが、
allowlist は不要です。任意の C2C 送信者が実行できます。

QQ Bot の exec 承認でデフォルトの同一チャットフォールバックを使う場合、ネイティブ承認ボタンのクリックは同じ明示的な非ワイルドカードコマンド許可リストに従います。より広いコマンドアクセスなしで承認専用アクセスを付与するには、`channels.qqbot.execApprovals.approvers` を設定します。ネイティブ exec 承認はデフォルトで有効です。

## メディアとストレージ

- 受信、送信、Gateway ブリッジのメディアは、`~/.openclaw/media/qqbot`（`OPENCLAW_HOME` が設定されている場合はそれに従う）配下の 1 つのペイロードルートを共有するため、アップロード、ダウンロード、トランスコードキャッシュは 1 つの保護されたディレクトリ配下に保たれます。
- C2C とグループターゲットへのリッチメディア配信は、1 つの `sendMedia` パスを通ります。5&nbsp;MiB 以上のローカルファイルとメモリ内バッファは QQ のチャンクアップロードエンドポイントを使い、それより小さいペイロードとリモート URL/Base64 ソースはワンショットアップロード API を使います。
- ホットアップグレードによって、`openclaw.json` の書き込みが完了する前に Gateway が中断された場合、Plugin は次回起動時に内部スナップショットからそのアカウントの直近の既知の `appId` / `clientSecret` を復元します（意図的な設定変更は上書きしません）。そのため、QR コードを再スキャンする必要はありません。

## トラブルシューティング

- **Gateway が起動しない / 受信メッセージがない:** `appId` と `clientSecret` が正しく、QQ Open Platform でボットが有効になっていることを確認してください。認証情報が欠けている場合は「QQBot not configured (missing appId or clientSecret)」として表示されます。
- **`--token-file` でセットアップしても未設定と表示される:** `--token-file` は AppSecret のみを設定します。`appId` は引き続き設定または `QQBOT_APP_ID` で設定する必要があります。
- **バースト的なグループ返信が衝突する:** ピアのキューがいっぱいになると、受信キューは人間のメッセージより先にボット作成のメッセージを退避し、通常の（コマンドではない）グループメッセージのバーストを 1 つの帰属付きターンにマージします。そのため、ボットの大量の会話で人間のメッセージが処理されなくなることはありません。
- **プロアクティブメッセージが届かない:** ユーザーが最近対話していない場合、QQ がボット起点のメッセージをブロックすることがあります。
- **音声が文字起こしされない:** STT が設定され、プロバイダーに到達できることを確認してください。

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
