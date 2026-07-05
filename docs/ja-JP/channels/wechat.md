---
read_when:
    - OpenClaw を WeChat または Weixin に接続したい
    - openclaw-weixin チャンネルPluginをインストールまたはトラブルシューティングしている
    - Gateway の横で外部チャネル Plugin がどのように実行されるかを理解する必要があります。
summary: WeChat チャンネルを外部 openclaw-weixin plugin 経由でセットアップする
title: WeChat
x-i18n:
    generated_at: "2026-07-05T11:07:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw は Tencent の外部
`@tencent-weixin/openclaw-weixin` チャネルプラグインを通じて WeChat に接続します。

ステータス: 外部プラグイン。Tencent Weixin チームが保守しています。ダイレクトチャットと
メディアがサポートされています。グループチャットはプラグインの機能
メタデータでは公開されていません（ダイレクトチャットのみを宣言しています）。

## 命名

- **WeChat** は、このドキュメントでのユーザー向けの名前です。
- **Weixin** は、Tencent のパッケージとプラグイン ID で使われる名前です。
- `openclaw-weixin` は OpenClaw のチャネル ID です（`weixin` と `wechat` はエイリアスとして動作します）。
- `@tencent-weixin/openclaw-weixin` は npm パッケージです。

CLI コマンドと設定パスでは `openclaw-weixin` を使ってください。

## 仕組み

WeChat のコードは OpenClaw コアリポジトリにはありません。OpenClaw は
汎用チャネルプラグイン契約を提供し、外部プラグインが
WeChat 固有のランタイムを提供します。

1. `openclaw plugins install` は `@tencent-weixin/openclaw-weixin` をインストールします。
2. Gateway がプラグインマニフェストを検出し、プラグインエントリポイントを読み込みます。
3. プラグインがチャネル ID `openclaw-weixin` を登録します。
4. `openclaw channels login --channel openclaw-weixin` が QR ログインを開始します。
5. プラグインは OpenClaw 状態ディレクトリの下にアカウント資格情報を保存します
   （デフォルトは `~/.openclaw`）。
6. Gateway が起動すると、プラグインは設定済みアカウントごとに Weixin モニターを開始します。
7. 受信した WeChat メッセージはチャネル契約を通じて正規化され、
   選択された OpenClaw エージェントへルーティングされ、プラグインの送信パスを通じて返信されます。

この分離は重要です。OpenClaw コアはチャネルに依存しないままです。WeChat ログイン、
Tencent iLink API 呼び出し、メディアのアップロード/ダウンロード、コンテキストトークン、アカウント
監視は外部プラグインが所有します。

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

インストール後に Gateway を再起動します。

```bash
openclaw gateway restart
```

## ログイン

Gateway を実行しているのと同じマシンで QR ログインを実行します。

```bash
openclaw channels login --channel openclaw-weixin
```

スマートフォンの WeChat で QR コードをスキャンし、ログインを確認します。スキャンに成功すると、
プラグインはアカウントトークンをローカルに保存します。

別の WeChat アカウントを追加するには、同じログインコマンドを再度実行します。複数の
アカウントでは、アカウント、チャネル、送信者ごとにダイレクトメッセージセッションを分離します。

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## アクセス制御

ダイレクトメッセージは、チャネルプラグイン向けの通常の OpenClaw ペアリングと許可リストモデルを使います。

新しい送信者を承認します。

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

完全なアクセス制御モデルについては、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## 互換性

プラグインは起動時にホストの OpenClaw バージョンを確認します。

| プラグイン系統 | OpenClaw バージョン                                           | npm タグ |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12`（現在は 2.4.6。初期の 2.x は `>=2026.3.22` を受け入れました） | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

プラグインが OpenClaw バージョンが古すぎると報告する場合は、OpenClaw を更新するか、
レガシーのプラグイン系統をインストールしてください。

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## サイドカープロセス

WeChat プラグインは Tencent iLink API を監視している間、Gateway の横でヘルパー処理を実行できます。
issue #68451 では、このヘルパーパスによって OpenClaw の
汎用的な古い Gateway クリーンアップのバグが露呈しました。子プロセスが親の
Gateway プロセスをクリーンアップしようとして、systemd などのプロセスマネージャー下で再起動ループが発生する可能性がありました。

現在の OpenClaw 起動時クリーンアップは現在のプロセスとその祖先を除外するため、
チャネルヘルパーがそれを起動した Gateway を強制終了することはできません。この修正は
汎用的なものであり、コア内の WeChat 固有パスではありません。

## トラブルシューティング

インストールとステータスを確認します。

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

チャネルがインストール済みとして表示されるのに接続しない場合は、プラグインが
有効化されていることを確認して再起動します。

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChat を有効化した後に Gateway が繰り返し再起動する場合は、OpenClaw と
プラグインの両方を更新します。

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

起動時にインストール済みプラグインパッケージが `requires compiled runtime
output for TypeScript entry` と報告する場合、その npm パッケージは OpenClaw が必要とするコンパイル済み
JavaScript ランタイムファイルなしで公開されています。プラグイン
公開元が修正済みパッケージを出荷した後に更新/再インストールするか、一時的にプラグインを無効化/アンインストールしてください。

一時的な無効化:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 関連ドキュメント

- チャネル概要: [チャットチャネル](/ja-JP/channels)
- ペアリング: [ペアリング](/ja-JP/channels/pairing)
- チャネルルーティング: [チャネルルーティング](/ja-JP/channels/channel-routing)
- プラグインアーキテクチャ: [Plugin アーキテクチャ](/ja-JP/plugins/architecture)
- チャネルプラグイン SDK: [チャネル Plugin SDK](/ja-JP/plugins/sdk-channel-plugins)
- 外部パッケージ: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
