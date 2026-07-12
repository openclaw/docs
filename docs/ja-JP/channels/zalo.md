---
read_when:
    - Zalo の機能または Webhook に関する作業
summary: Zaloボットのサポート状況、機能、設定
title: Zalo
x-i18n:
    generated_at: "2026-07-11T22:03:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

ステータス: 実験的。ダイレクトメッセージとグループチャットはどちらも実装されています。以下の[機能](#capabilities)表は、Zalo Bot Creator / Marketplace ボットで検証済みの動作を示しています。

## バンドル済み Plugin

現在の OpenClaw リリースには Zalo がバンドル済み Plugin として含まれているため、パッケージ版ビルドでは個別にインストールする必要はありません。

Zalo を含まない古いビルドまたはカスタムインストールでは、npm パッケージを直接インストールします。

- インストール: `openclaw plugins install @openclaw/zalo`
- バージョン固定: `openclaw plugins install @openclaw/zalo@2026.6.11`
- ローカルチェックアウトから: `openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) でボットトークンを作成します（サインインし、ボットを作成して設定を構成します）。トークンの形式は `numeric_id:secret` です。Marketplace ボットの場合、実行時に使用できるトークンがボットのウェルカムメッセージに表示されることがあります。
2. 環境変数 `ZALO_BOT_TOKEN=...`（デフォルトアカウントのみ）または設定でトークンを指定します。
3. Gateway を再起動します。
4. 最初の DM 受信時にペアリングコードを承認します（デフォルトの DM ポリシーはペアリングです）。

最小構成:

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

複数アカウント: `channels.zalo.accounts.<id>` の下にエントリを追加し、それぞれに固有の `botToken`/`name` を指定します。`channels.zalo.botToken`（フラット形式で `accounts` なし）は、従来の単一アカウント用省略記法です。新しい設定では `accounts.<id>.*` を推奨します。

## 概要

Zalo はベトナム市場を中心とするメッセージングアプリです。その Bot API を使用すると、Gateway は1対1の会話とグループチャットの両方でボットを実行でき、応答は決定論的に Zalo へルーティングされます（モデルがチャネルを選択することはありません）。

このページでは **Zalo Bot Creator / Marketplace ボット**を扱います。**Zalo Official Account (OA) ボット**は別の製品領域であり、動作が異なる場合があります。このページでは扱いません。

## 動作の仕組み

- 受信メッセージは、メディアプレースホルダーを含む共有チャネルエンベロープへ正規化されます。
- 応答は常に同じ Zalo チャットへルーティングされます。引用返信は使用されません（`replyToMode` は常に無効です）。
- デフォルトではロングポーリング（`getUpdates`）を使用します。Webhook モードは `channels.zalo.webhookUrl` で利用できます。
- グループでは、ボットを起動するために @メンションが必要です。これはチャネルごとには設定できません。

## 制限

| 制限                           | 値                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------- |
| 送信テキストのチャンクサイズ   | 2000文字（Zalo API の制限）                                                   |
| メディアサイズ（受信/送信）    | `channels.zalo.mediaMaxMb`、デフォルトは `5` MB                               |
| Webhook リクエスト本文          | 1 MB、読み取りタイムアウト30秒                                                |
| Webhook レート制限              | パスとクライアント IP ごとに60秒間で120リクエスト、その後は HTTP 429          |
| Webhook 重複イベント判定期間    | 5分（パス + アカウント + イベント名 + チャット + 送信者 + メッセージ ID をキーとする） |

## アクセス制御

### ダイレクトメッセージ

- `channels.zalo.dmPolicy`: `pairing`（デフォルト）| `allowlist` | `open` | `disabled`。
- ペアリング: 未知の送信者にはペアリングコードが送られ、承認されるまでメッセージは無視されます。コードは1時間後に期限切れになります。
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 詳細: [ペアリング](/ja-JP/channels/pairing)
- `channels.zalo.allowFrom` には数値の Zalo ユーザー ID を指定できます（ユーザー名の検索はありません）。`open` には `"*"` が必要です。

### グループ

グループチャットは Plugin でサポートされており（`chatTypes: ["direct", "group"]`）、メンションとグループポリシーによって制御されます。

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`。
- `channels.zalo.groupAllowFrom` は、グループ内でボットを起動できる送信者 ID を制限します。未設定の場合は `allowFrom` にフォールバックします。
- デフォルトの解決: `channels.zalo` が設定されている場合、未設定の `groupPolicy` は `open` として解決されます。`channels.zalo` 自体が存在しない場合、実行時には安全側に倒して `allowlist` になります。
- 実環境で報告されている注意点: 一部の Marketplace ボット設定では、ボットをグループへまったく追加できないことがあります。この問題が発生した場合は、ボットの Zalo Bot Platform 設定を確認してください。これはプラットフォーム側の制約であり、OpenClaw のポリシーではありません。

## ロングポーリングと Webhook

- デフォルト: ロングポーリング（公開 URL は不要）。
- Webhook モード: `channels.zalo.webhookUrl` と `channels.zalo.webhookSecret` を設定します。
  - Webhook URL は HTTPS を使用する必要があります。
  - Webhook シークレットは8〜256文字である必要があります。
  - Zalo は `X-Bot-Api-Secret-Token` ヘッダーを付けてイベントを送信し、定時間比較で検証されます。
  - Gateway HTTP は `channels.zalo.webhookPath` で Webhook リクエストを処理します（デフォルトは Webhook URL のパス）。
  - リクエストでは `Content-Type: application/json`（または `+json` メディアタイプ）を使用する必要があります。
  - Zalo API ドキュメントによると、getUpdates ポーリングと Webhook は相互排他的です。

## サポートされるメッセージタイプ

- テキスト: 完全にサポートされ、2000文字ごとに分割されます。
- メディア: 受信/送信に対応し、`mediaMaxMb` で上限が設定されます。
- リアクション、スレッド、投票、ネイティブコマンド: Plugin ではサポートされていません。
- ストリーミング: Plugin はブロックストリーミング機能を宣言していますが、Zalo には専用の送信キューやテキスト結合の調整項目がありません（一部の他の地域向けチャネルとは異なります）。ユースケース上重要な場合は、使用環境で現在の動作を確認してください。

## 機能

| 機能                     | ステータス                              |
| ------------------------ | --------------------------------------- |
| ダイレクトメッセージ     | サポート                                |
| グループ                 | サポート（メンションが必要）            |
| メディア（受信/送信）    | サポート、`mediaMaxMb` による上限あり   |
| リアクション             | 未サポート                              |
| スレッド                 | 未サポート                              |
| 投票                     | 未サポート                              |
| ネイティブコマンド       | 未サポート                              |
| 返信先指定 / 引用        | 使用しない（常に無効）                  |

## 配信先（CLI/Cron）

チャット ID を送信先として使用します。

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## トラブルシューティング

**ボットが応答しない場合:**

- トークンを確認します: `openclaw channels status --probe`
- 送信者が承認済みであることを確認します（ペアリングまたは `allowFrom`）
- Gateway のログを確認します: `openclaw logs --follow`

**Webhook がイベントを受信しない場合:**

- Webhook URL が HTTPS を使用していることを確認します
- シークレットが8〜256文字であることを確認します
- Gateway HTTP エンドポイントが設定済みのパスで到達可能であることを確認します
- getUpdates ポーリングが同時に実行されていないことを確認します（両者は相互排他的です）
- リクエストが集中すると HTTP 429 が返されることがあります（パスと IP ごとに60秒間で120リクエスト）。間隔を空けて再試行してください

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

| 設定                                         | 説明                                              | デフォルト               |
| -------------------------------------------- | ------------------------------------------------- | ------------------------ |
| `channels.zalo.enabled`                      | チャネルの起動を有効化/無効化                     | `true`                   |
| `channels.zalo.accounts.<id>.botToken`       | Zalo Bot Platform のボットトークン                | -                        |
| `channels.zalo.accounts.<id>.tokenFile`      | ファイルからトークンを読み取る（シンボリックリンクは拒否） | -                 |
| `channels.zalo.accounts.<id>.name`           | 表示名                                            | -                        |
| `channels.zalo.accounts.<id>.enabled`        | このアカウントを有効化/無効化                     | `true`                   |
| `channels.zalo.accounts.<id>.dmPolicy`       | アカウントごとの DM ポリシー                      | `pairing`                |
| `channels.zalo.accounts.<id>.allowFrom`      | DM 許可リスト（ユーザー ID）                      | -                        |
| `channels.zalo.accounts.<id>.groupPolicy`    | アカウントごとのグループポリシー                  | [グループ](#groups)を参照 |
| `channels.zalo.accounts.<id>.groupAllowFrom` | グループ送信者の許可リスト。`allowFrom` にフォールバック | -                  |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 受信/送信メディアの上限（MB）                     | `5`                      |
| `channels.zalo.accounts.<id>.webhookUrl`     | Webhook モードを有効化（HTTPS 必須）              | -                        |
| `channels.zalo.accounts.<id>.webhookSecret`  | Webhook シークレット（8〜256文字）                | -                        |
| `channels.zalo.accounts.<id>.webhookPath`    | Gateway HTTP サーバー上の Webhook パス            | Webhook URL のパス       |
| `channels.zalo.accounts.<id>.proxy`          | API リクエスト用のプロキシ URL                    | -                        |
| `channels.zalo.accounts.<id>.responsePrefix` | 送信応答プレフィックスの上書き                    | -                        |
| `channels.zalo.defaultAccount`               | 複数設定時のデフォルトアカウント                  | `default`                |

`channels.zalo.botToken`、`channels.zalo.dmPolicy`、およびその他のフラットなトップレベルキーは、上記フィールドの従来の単一アカウント用省略記法です。どちらの形式もサポートされています。

環境変数オプション: `ZALO_BOT_TOKEN=...` はデフォルトアカウントのトークンにのみ適用されます。

## 関連項目

- [チャネルの概要](/ja-JP/channels) - サポートされるすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションによる制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
