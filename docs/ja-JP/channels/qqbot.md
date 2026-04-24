---
read_when:
    - OpenClawをQQに接続したい
    - QQ Botの認証情報セットアップが必要です
    - QQ Botのグループチャットまたはプライベートチャットのサポートが必要です
summary: QQ Botのセットアップ、設定、使用方法
title: QQボット
x-i18n:
    generated_at: "2026-04-24T04:47:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Botは、公式QQ Bot API（WebSocket Gateway）を介してOpenClawに接続します。このPluginは、C2Cプライベートチャット、グループの@メッセージ、ギルドチャネルメッセージを、リッチメディア（画像、音声、動画、ファイル）とともにサポートします。

ステータス: バンドル済みPlugin。ダイレクトメッセージ、グループチャット、ギルドチャネル、メディアをサポートしています。リアクションとスレッドはサポートしていません。

## バンドル済みPlugin

現在のOpenClawリリースにはQQ Botがバンドルされているため、通常のパッケージ版ビルドでは別途 `openclaw plugins install` を実行する必要はありません。

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) にアクセスし、スマートフォンのQQでQRコードをスキャンして登録 / ログインします。
2. **Create Bot** をクリックして、新しいQQボットを作成します。
3. ボットの設定ページで **AppID** と **AppSecret** を見つけてコピーします。

> AppSecretは平文では保存されません。保存せずにこのページを離れると、新しいものを再生成する必要があります。

4. チャネルを追加します:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gatewayを再起動します。

対話型セットアップ手順:

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

ファイルベースのAppSecret:

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

- 環境変数フォールバックは、デフォルトのQQ Botアカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...` はAppSecretのみを提供します。AppIDは、すでに設定または `QQBOT_APP_ID` に設定されている必要があります。
- `clientSecret` は平文文字列だけでなく、SecretRef入力も受け付けます。

### 複数アカウント設定

1つのOpenClawインスタンスで複数のQQボットを実行できます:

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

各アカウントは独自のWebSocket接続を起動し、独立したトークンキャッシュ（`appId` ごとに分離）を維持します。

CLIで2つ目のボットを追加するには:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 音声（STT / TTS）

STTとTTSは、優先フォールバック付きの2段階設定をサポートします:

| 設定 | Plugin固有 | フレームワークのフォールバック |
| ------- | -------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

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
    },
  },
}
```

無効にするには、いずれかに `enabled: false` を設定します。

送信音声のアップロード/トランスコード動作は、`channels.qqbot.audioFormatPolicy` でも調整できます:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 対象フォーマット

| フォーマット | 説明 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット |
| `qqbot:channel:CHANNEL_ID` | ギルドチャネル |

> 各ボットは独自のユーザーOpenIDセットを持ちます。Bot Aが受け取ったOpenIDは、Bot B経由でメッセージ送信に**使えません**。

## スラッシュコマンド

AIキューの前にインターセプトされる組み込みコマンド:

| コマンド | 説明 |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | レイテンシテスト |
| `/bot-version` | OpenClawフレームワークのバージョンを表示 |
| `/bot-help`    | すべてのコマンドを一覧表示 |
| `/bot-upgrade` | QQBotアップグレードガイドへのリンクを表示 |
| `/bot-logs`    | 最近のGatewayログをファイルとしてエクスポート |
| `/bot-approve` | 保留中のQQ Botアクション（たとえば、C2Cまたはグループアップロードの確認）をネイティブフローで承認します。 |

使用方法ヘルプを表示するには、任意のコマンドに `?` を付けます（例: `/bot-upgrade ?`）。

## エンジンアーキテクチャ

QQ Botは、Plugin内の自己完結型エンジンとして提供されます:

- 各アカウントは、`appId` をキーとする分離されたリソーススタック（WebSocket接続、APIクライアント、トークンキャッシュ、メディア保存ルート）を所有します。アカウント間で受信/送信状態が共有されることはありません。
- 複数アカウントロガーは、実行元アカウントのタグをログ行に付けるため、1つのGatewayで複数ボットを実行していても診断結果を分離できます。
- 受信、送信、Gatewayブリッジの経路は、`~/.openclaw/media` 配下の単一のメディアペイロードルートを共有するため、アップロード、ダウンロード、トランスコードキャッシュは、サブシステムごとのツリーではなく、1つの保護されたディレクトリに配置されます。
- 認証情報は標準のOpenClaw認証情報スナップショットの一部としてバックアップおよび復元できます。復元時、エンジンは新たなQRコードペアリングを必要とせずに各アカウントのリソーススタックを再接続します。

## QRコードによるオンボーディング

`AppID:AppSecret` を手動で貼り付ける代わりに、エンジンはQQ BotをOpenClawにリンクするためのQRコードによるオンボーディングフローをサポートしています:

1. QQ Botセットアップ手順（たとえば `openclaw channels add --channel qqbot`）を実行し、プロンプトが表示されたらQRコードフローを選択します。
2. 対象のQQ Botに紐付いたスマートフォンアプリで、生成されたQRコードをスキャンします。
3. スマートフォンでペアリングを承認します。OpenClawは、返された認証情報を正しいアカウントスコープの `credentials/` に永続化します。

ボット自体によって生成される承認プロンプト（たとえば、QQ Bot APIが公開する「このアクションを許可しますか？」フロー）は、生のQQクライアント経由で返信する代わりに、`/bot-approve` で受諾できるネイティブなOpenClawプロンプトとして表示されます。

## トラブルシューティング

- **ボットが「gone to Mars」と返信する:** 認証情報が設定されていないか、Gatewayが起動していません。
- **受信メッセージが来ない:** `appId` と `clientSecret` が正しいこと、およびボットがQQ Open Platformで有効になっていることを確認してください。
- **`--token-file` でセットアップしても未設定と表示される:** `--token-file` はAppSecretのみを設定します。引き続き、設定または `QQBOT_APP_ID` に `appId` が必要です。
- **能動的に送ったメッセージが届かない:** ユーザーが最近やり取りしていない場合、QQがボット発のメッセージを遮断することがあります。
- **音声が文字起こしされない:** STTが設定されており、プロバイダに到達可能であることを確認してください。

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネルトラブルシューティング](/ja-JP/channels/troubleshooting)
