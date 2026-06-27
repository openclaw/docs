---
read_when:
    - OpenClaw を WeChat または Weixin に接続したい
    - openclaw-weixin チャンネル Plugin をインストールまたはトラブルシューティングしています
    - 外部チャネル Plugin が Gateway と並行してどのように実行されるかを理解する必要があります
summary: 外部の openclaw-weixin プラグインを通じた WeChat チャネル設定
title: WeChat
x-i18n:
    generated_at: "2026-05-06T04:59:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClawは、Tencentの外部`@tencent-weixin/openclaw-weixin`チャネルPluginを通じてWeChatに接続します。

ステータス: 外部Plugin。ダイレクトチャットとメディアがサポートされています。グループチャットは、現在のPlugin機能メタデータでは提示されていません。

## 命名

- **WeChat** は、このドキュメントでのユーザー向け名称です。
- **Weixin** は、TencentのパッケージとPlugin IDで使われる名称です。
- `openclaw-weixin` はOpenClawのチャネルIDです。
- `@tencent-weixin/openclaw-weixin` はnpmパッケージです。

CLIコマンドと設定パスでは`openclaw-weixin`を使用してください。

## 仕組み

WeChatのコードはOpenClawコアリポジトリには含まれていません。OpenClawは汎用チャネルPlugin契約を提供し、外部PluginがWeChat固有のランタイムを提供します。

1. `openclaw plugins install` が`@tencent-weixin/openclaw-weixin`をインストールします。
2. GatewayがPluginマニフェストを検出し、Pluginエントリポイントを読み込みます。
3. PluginがチャネルID`openclaw-weixin`を登録します。
4. `openclaw channels login --channel openclaw-weixin` がQRログインを開始します。
5. Pluginがアカウント認証情報をOpenClaw状態ディレクトリに保存します。
6. Gatewayの起動時に、Pluginは設定済みの各アカウントについてWeixinモニターを開始します。
7. 受信したWeChatメッセージはチャネル契約を通じて正規化され、選択されたOpenClawエージェントにルーティングされ、Pluginの送信経路を通じて送り返されます。

この分離は重要です。OpenClawコアはチャネル非依存であるべきです。WeChatログイン、Tencent iLink API呼び出し、メディアのアップロード/ダウンロード、コンテキストトークン、アカウント監視は外部Pluginが所有します。

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

Gatewayを実行している同じマシンでQRログインを実行します。

```bash
openclaw channels login --channel openclaw-weixin
```

スマートフォンのWeChatでQRコードをスキャンし、ログインを確認します。スキャンが成功すると、Pluginはアカウントトークンをローカルに保存します。

別のWeChatアカウントを追加するには、同じログインコマンドをもう一度実行します。複数アカウントの場合は、アカウント、チャネル、送信者ごとにダイレクトメッセージセッションを分離します。

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## アクセス制御

ダイレクトメッセージは、チャネルPlugin向けの通常のOpenClawペアリングと許可リストモデルを使用します。

新しい送信者を承認します。

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

完全なアクセス制御モデルについては、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## 互換性

Pluginは起動時にホストのOpenClawバージョンを確認します。

| Plugin系統 | OpenClawバージョン       | npmタグ  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

PluginがOpenClawのバージョンが古すぎると報告する場合は、OpenClawを更新するか、レガシーPlugin系統をインストールしてください。

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## サイドカープロセス

WeChat Pluginは、Tencent iLink APIを監視しながらGatewayの横でヘルパー作業を実行できます。issue #68451では、そのヘルパー経路により、OpenClawの汎用的な古いGatewayクリーンアップにあるバグが露呈しました。子プロセスが親Gatewayプロセスをクリーンアップしようとし、systemdなどのプロセスマネージャー配下で再起動ループを引き起こす可能性がありました。

現在のOpenClaw起動時クリーンアップでは、現在のプロセスとその祖先が除外されるため、チャネルヘルパーは自分を起動したGatewayを終了してはいけません。この修正は汎用的なものであり、コア内のWeChat固有の経路ではありません。

## トラブルシューティング

インストールとステータスを確認します。

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

チャネルがインストール済みとして表示されるものの接続しない場合は、Pluginが有効になっていることを確認して再起動します。

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

起動時に、インストール済みPluginパッケージが`requires compiled runtime output for TypeScript entry`を報告する場合、そのnpmパッケージはOpenClawが必要とするコンパイル済みJavaScriptランタイムファイルなしで公開されています。Pluginの公開者が修正済みパッケージを出荷した後に更新/再インストールするか、一時的にPluginを無効化/アンインストールしてください。

一時的な無効化:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 関連ドキュメント

- チャネル概要: [チャットチャネル](/ja-JP/channels)
- ペアリング: [ペアリング](/ja-JP/channels/pairing)
- チャネルルーティング: [チャネルルーティング](/ja-JP/channels/channel-routing)
- Pluginアーキテクチャ: [Pluginアーキテクチャ](/ja-JP/plugins/architecture)
- チャネルPlugin SDK: [チャネルPlugin SDK](/ja-JP/plugins/sdk-channel-plugins)
- 外部パッケージ: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
