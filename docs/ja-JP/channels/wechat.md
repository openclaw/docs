---
read_when:
    - OpenClawをWeChatまたはWeixinに接続したい場合
    - openclaw-weixinチャネルPluginをインストールまたはトラブルシューティングしている場合
    - 外部チャネルPluginがGatewayの横でどのように動作するかを理解する必要がある場合
summary: 外部のopenclaw-weixin Pluginを通じたWeChatチャネルのセットアップ
title: WeChat
x-i18n:
    generated_at: "2026-04-24T04:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClawは、Tencentの外部`@tencent-weixin/openclaw-weixin`チャネルPluginを通じてWeChatに接続します。

ステータス: 外部Plugin。ダイレクトチャットとメディアがサポートされています。現在のPlugin機能メタデータでは、グループチャットは公開されていません。

## 命名

- **WeChat**は、このドキュメントでのユーザー向け名称です。
- **Weixin**は、TencentのパッケージおよびPlugin IDで使われる名称です。
- `openclaw-weixin`はOpenClawのチャネルIDです。
- `@tencent-weixin/openclaw-weixin`はnpmパッケージです。

CLIコマンドおよび設定パスでは`openclaw-weixin`を使用してください。

## 仕組み

WeChatのコードはOpenClaw coreリポジトリには存在しません。OpenClawは汎用的なチャネルPluginコントラクトを提供し、外部PluginがWeChat固有のランタイムを提供します。

1. `openclaw plugins install`で`@tencent-weixin/openclaw-weixin`をインストールします。
2. GatewayがPluginマニフェストを検出し、Pluginのエントリーポイントを読み込みます。
3. PluginがチャネルID `openclaw-weixin`を登録します。
4. `openclaw channels login --channel openclaw-weixin`でQRログインを開始します。
5. Pluginがアカウント資格情報をOpenClawの状態ディレクトリ配下に保存します。
6. Gatewayの起動時に、Pluginは設定された各アカウント用にWeixinモニターを起動します。
7. 受信したWeChatメッセージはチャネルコントラクトを通じて正規化され、選択されたOpenClawエージェントへルーティングされ、Pluginの送信パス経由で返送されます。

この分離は重要です。OpenClaw coreはチャネル非依存のままであるべきです。WeChatログイン、Tencent iLink API呼び出し、メディアのアップロード/ダウンロード、コンテキストトークン、アカウント監視は、外部Pluginが担います。

## インストール

クイックインストール:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

手動インストール:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

インストール後にGatewayを再起動します。

```bash
openclaw gateway restart
```

## ログイン

Gatewayを実行しているのと同じマシンでQRログインを実行します。

```bash
openclaw channels login --channel openclaw-weixin
```

スマートフォンのWeChatでQRコードをスキャンし、ログインを確認してください。スキャン成功後、Pluginはアカウントトークンをローカルに保存します。

別のWeChatアカウントを追加するには、同じログインコマンドを再度実行します。複数アカウントでは、アカウント、チャネル、送信者ごとにダイレクトメッセージセッションを分離してください。

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## アクセス制御

ダイレクトメッセージでは、チャネルPlugin向けの通常のOpenClawペアリングおよび許可リストモデルを使用します。

新しい送信者を承認するには:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

完全なアクセス制御モデルについては、[Pairing](/ja-JP/channels/pairing)を参照してください。

## 互換性

Pluginは起動時にホストOpenClawのバージョンを確認します。

| Plugin line | OpenClawバージョン | npm tag  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

PluginがOpenClawのバージョンが古すぎると報告する場合は、OpenClawを更新するか、legacy Pluginラインをインストールしてください。

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## サイドカープロセス

WeChat Pluginは、Tencent iLink APIを監視する間、Gatewayの横で補助処理を実行する場合があります。issue #68451では、その補助パスがOpenClawの汎用的な古いGatewayクリーンアップ処理のバグを露出させました。子プロセスが親Gatewayプロセスをクリーンアップしようとしてしまい、systemdなどのプロセスマネージャー下で再起動ループを引き起こす可能性がありました。

現在のOpenClaw起動時クリーンアップは、現在のプロセスとその祖先を除外するため、チャネルヘルパーがそれを起動したGatewayを終了させることはありません。この修正は汎用的なものであり、core内のWeChat専用パスではありません。

## トラブルシューティング

インストールと状態を確認します。

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

チャネルがインストール済みと表示されても接続しない場合は、Pluginが有効になっていることを確認し、再起動してください。

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChatを有効にした後にGatewayが繰り返し再起動する場合は、OpenClawとPluginの両方を更新してください。

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

一時的に無効化するには:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 関連ドキュメント

- チャネル概要: [Chat Channels](/ja-JP/channels)
- ペアリング: [Pairing](/ja-JP/channels/pairing)
- チャネルルーティング: [Channel Routing](/ja-JP/channels/channel-routing)
- Pluginアーキテクチャ: [Plugin Architecture](/ja-JP/plugins/architecture)
- チャネルPlugin SDK: [Channel Plugin SDK](/ja-JP/plugins/sdk-channel-plugins)
- 外部パッケージ: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
