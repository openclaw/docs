---
read_when:
    - Zalo の機能または Webhook に取り組む
summary: Zalo ボットのサポート状況、機能、設定
title: Zalo
x-i18n:
    generated_at: "2026-07-05T11:07:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

状態: 実験的。ダイレクトメッセージとグループチャットはどちらも実装済みです。下の [機能](#capabilities) 表は、Zalo Bot Creator / Marketplace ボットで検証済みの動作を反映しています。

## バンドル済み Plugin

Zalo は現在の OpenClaw リリースではバンドル済み Plugin として提供されるため、パッケージ版ビルドでは個別のインストールは不要です。

古いビルド、または Zalo を除外したカスタムインストールでは、npm パッケージを直接インストールします。

- インストール: `openclaw plugins install @openclaw/zalo`
- 固定バージョン: `openclaw plugins install @openclaw/zalo@2026.6.11`
- ローカルチェックアウトから: `openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) でボットトークンを作成します（サインインし、ボットを作成して設定を構成します）。トークンは `numeric_id:secret` です。Marketplace ボットでは、利用可能なランタイムトークンがボットのウェルカムメッセージに表示される場合があります。
2. トークンを、env `ZALO_BOT_TOKEN=...`（デフォルトアカウントのみ）または設定で指定します。
3. Gateway を再起動します。
4. 初回 DM 接触時にペアリングコードを承認します（デフォルトの DM ポリシーはペアリングです）。

最小設定:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

複数アカウント: `channels.zalo.accounts.<id>` の下に追加のエントリを追加し、それぞれに独自の `botToken`/`name` を指定します。`channels.zalo.botToken`（フラットで `accounts` なし）はレガシーの単一アカウント省略形です。新しい設定では `accounts.<id>.*` を推奨します。

## 概要

Zalo はベトナム向けのメッセージングアプリです。その Bot API により、Gateway は 1:1 の会話とグループチャットの両方でボットを実行でき、Zalo への決定的なルーティングを行います（モデルがチャンネルを選ぶことはありません）。

このページでは **Zalo Bot Creator / Marketplace ボット**を扱います。**Zalo Official Account (OA) ボット**は別の製品サーフェスであり、動作が異なる場合があります。このページでは扱いません。

## 仕組み

- 受信メッセージは、メディアプレースホルダー付きの共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ Zalo チャットへルーティングされます。引用返信は使用されません（`replyToMode` は固定でオフです）。
- デフォルトはロングポーリング（`getUpdates`）です。Webhook モードは `channels.zalo.webhookUrl` で利用できます。
- グループではボットを起動するために @mention が必要です。これはチャンネルごとには設定できません。

## 制限

| 制限                           | 値                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------- |
| 送信テキストのチャンクサイズ   | 2000 文字（Zalo API の制限）                                                  |
| メディアサイズ（受信/送信）    | `channels.zalo.mediaMaxMb`、デフォルトは `5` MB                               |
| Webhook リクエスト本文         | 1 MB、読み取りタイムアウト 30 秒                                              |
| Webhook レート制限             | パス+クライアント IP ごとに 60 秒あたり 120 リクエスト、その後 HTTP 429       |
| Webhook 重複イベントウィンドウ | 5 分（パス + アカウント + イベント名 + チャット + 送信者 + メッセージ ID がキー） |

## アクセス制御

### ダイレクトメッセージ

- `channels.zalo.dmPolicy`: `pairing`（デフォルト） | `allowlist` | `open` | `disabled`。
- ペアリング: 不明な送信者にはペアリングコードが送られます。承認されるまでメッセージは無視されます。コードは 1 時間後に期限切れになります。
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 詳細: [ペアリング](/ja-JP/channels/pairing)
- `channels.zalo.allowFrom` は数値の Zalo ユーザー ID を受け付けます（ユーザー名検索はありません）。`open` には `"*"` が必要です。

### グループ

グループチャットは Plugin によってサポートされ（`chatTypes: ["direct", "group"]`）、メンションとグループポリシーで制御されます。

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`。
- `channels.zalo.groupAllowFrom` は、グループ内でボットを起動できる送信者 ID を制限します。未設定の場合は `allowFrom` にフォールバックします。
- デフォルト解決: `channels.zalo` が設定されている場合、未設定の `groupPolicy` は `open` に解決されます。`channels.zalo` がまったくない場合、ランタイムはフェイルクローズして `allowlist` になります。
- 報告されている実環境の注意点: 一部の Marketplace ボット設定では、ボットをグループにまったく追加できない場合があります。この問題に遭遇した場合は、ボットの Zalo Bot Platform 設定で確認してください。これはプラットフォーム側の制約であり、OpenClaw のポリシーではありません。

## ロングポーリングと Webhook

- デフォルト: ロングポーリング（公開 URL は不要）。
- Webhook モード: `channels.zalo.webhookUrl` と `channels.zalo.webhookSecret` を設定します。
  - Webhook URL は HTTPS を使用する必要があります。
  - Webhook シークレットは 8-256 文字である必要があります。
  - Zalo は `X-Bot-Api-Secret-Token` ヘッダー付きでイベントを送信し、定数時間比較でチェックされます。
  - Gateway HTTP は `channels.zalo.webhookPath` で Webhook リクエストを処理します（デフォルトは Webhook URL のパス）。
  - リクエストは `Content-Type: application/json`（または `+json` メディアタイプ）を使用する必要があります。
  - getUpdates ポーリングと Webhook は、Zalo API ドキュメント上、Zalo API ごとに相互排他的です。

## サポートされるメッセージタイプ

- テキスト: 完全サポート、2000 文字ごとに分割。
- メディア: 受信/送信、`mediaMaxMb` で上限設定。
- リアクション、スレッド、投票、ネイティブコマンド: Plugin ではサポートされません。
- ストリーミング: Plugin はブロックストリーミング機能を宣言しますが、Zalo には専用の送信キュー/テキスト結合の調整ノブはありません（一部の他の地域向けチャンネルとは異なります）。これがユースケースに重要な場合は、現在の動作を自分の環境で確認してください。

## 機能

| 機能                     | 状態                              |
| ------------------------ | --------------------------------- |
| ダイレクトメッセージ     | サポート済み                      |
| グループ                 | サポート済み（メンション制御）    |
| メディア（受信/送信）    | サポート済み、`mediaMaxMb` で上限 |
| リアクション             | 未サポート                        |
| スレッド                 | 未サポート                        |
| 投票                     | 未サポート                        |
| ネイティブコマンド       | 未サポート                        |
| 返信先 / 引用            | 使用されません（固定でオフ）      |

## 配信ターゲット（CLI/cron）

ターゲットとしてチャット ID を使用します。

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## トラブルシューティング

**ボットが応答しない:**

- トークンを確認します: `openclaw channels status --probe`
- 送信者が承認済みであることを確認します（ペアリングまたは `allowFrom`）
- Gateway ログを確認します: `openclaw logs --follow`

**Webhook がイベントを受信しない:**

- Webhook URL が HTTPS を使用していることを確認します
- シークレットが 8-256 文字であることを確認します
- Gateway HTTP エンドポイントが設定済みパスで到達可能であることを確認します
- getUpdates ポーリングも同時に実行されていないことを確認します（これらは相互排他的です）
- リクエストのバーストは HTTP 429 を返す場合があります（パス+IP ごとに 60 秒あたり 120 リクエスト）。バックオフして再試行してください

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

| 設定                                         | 説明                                              | デフォルト            |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | チャンネル起動を有効/無効にする                  | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Zalo Bot Platform からのボットトークン            | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | ファイルからトークンを読み取る（シンボリックリンクは拒否） | -                     |
| `channels.zalo.accounts.<id>.name`           | 表示名                                            | -                     |
| `channels.zalo.accounts.<id>.enabled`        | このアカウントを有効/無効にする                  | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | アカウントごとの DM ポリシー                     | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | DM 許可リスト（ユーザー ID）                     | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | アカウントごとのグループポリシー                 | [グループ](#groups) を参照 |
| `channels.zalo.accounts.<id>.groupAllowFrom` | グループ送信者の許可リスト。`allowFrom` にフォールバック | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 受信/送信メディア上限（MB）                      | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Webhook モードを有効にする（HTTPS 必須）          | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Webhook シークレット（8-256 文字）                | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Gateway HTTP サーバー上の Webhook パス            | Webhook URL パス      |
| `channels.zalo.accounts.<id>.proxy`          | API リクエスト用 Proxy URL                        | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | 送信応答プレフィックスの上書き                   | -                     |
| `channels.zalo.defaultAccount`               | 複数設定されている場合のデフォルトアカウント     | `default`             |

`channels.zalo.botToken`、`channels.zalo.dmPolicy`、その他のフラットなトップレベルキーは、上記フィールドのレガシーの単一アカウント省略形です。どちらの形式もサポートされています。

env オプション: `ZALO_BOT_TOKEN=...` はデフォルトアカウントのトークンだけを解決します。

## 関連

- [チャンネル概要](/ja-JP/channels) - サポートされるすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
