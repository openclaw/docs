---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルト設定を対話形式で調整したい場合
summary: '`openclaw configure` の CLI リファレンス（対話形式の設定プロンプト）'
title: 設定する
x-i18n:
    generated_at: "2026-07-11T22:06:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

既存のセットアップに対して、認証情報、デバイス、エージェントのデフォルト、Gateway、チャンネル、Plugin、Skills、ヘルスチェックを対象に変更するための対話形式のプロンプトです。

初回実行時の完全なガイド付き手順には `openclaw onboard` または `openclaw setup`、ベースライン設定とワークスペースのみを作成するには `openclaw setup --baseline`、チャンネルアカウントのセットアップのみが必要な場合は `openclaw channels add` を使用します。

<Tip>
サブコマンドなしで `openclaw config` を実行すると、同じウィザードが開きます。非対話形式で編集するには `openclaw config get|set|unset` を使用します。
</Tip>

## オプション

`--section <section>`：繰り返し指定できるセクションフィルターです。利用可能なセクション：

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

`gateway`、`daemon`、`health` のいずれかを選択した場合（または `--section` なしで完全なウィザードを実行した場合）、Gateway の実行場所を尋ね、`gateway.mode` を更新します。これら3つをすべて除外するセクションフィルターでは、Gateway モードを尋ねず、要求されたセットアップに直接進みます。リモート Gateway モードを選択すると、リモート設定を書き込んですぐに終了します。Plugin のインストールなど、ローカル専用の手順は実行されません。

<Note>
`openclaw configure` には対話型ターミナルが必要です（標準入力と標準出力の両方が TTY でなければなりません）。対話型ターミナルがない場合、途中まで実行する代わりに、同等の非対話形式の `openclaw config get|set|patch|validate` コマンドを表示し、エラーで終了します。
</Note>

## モデルセクション

<Note>
**モデル**には、`agents.defaults.models` 許可リスト（`/model` とモデルピッカーに表示されるモデル）を設定する複数選択があります。プロバイダー単位のセットアップ項目では、選択したモデルを既存の許可リストに統合し、設定にすでに含まれる無関係なプロバイダーを置き換えません。

configure からプロバイダー認証を再実行しても、プロバイダーの認証手順が独自の推奨デフォルトモデルを含む設定パッチを返した場合を含め、既存の `agents.defaults.model.primary` は維持されます。プロバイダーを追加または再認証すると、そのモデルが利用可能になりますが、現在のプライマリモデルは変更されません。意図的にデフォルトモデルを変更するには、`openclaw models auth login --provider <id> --set-default` または `openclaw models set <model>` を使用します。
</Note>

configure をプロバイダー認証の選択肢から開始すると、デフォルトモデルと許可リストのピッカーでは、そのプロバイダーが自動的に優先されます。Volcengine と BytePlus のような対になったプロバイダーでは、同じ優先設定がそれぞれのコーディングプランのバリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも適用されます。優先プロバイダーフィルターによってリストが空になる場合、configure は空のピッカーを表示せず、フィルターなしのカタログにフォールバックします。

## ウェブセクション

`openclaw configure --section web` では、ウェブ検索プロバイダーを選択し、その認証情報を設定します。一部のプロバイダーでは、プロバイダー固有の追加項目が表示されます。

- **Grok**では、同じ xAI OAuth プロファイルまたは API キーを使用する任意の `x_search` セットアップが提示され、`x_search` モデルを選択できます。
- **Kimi**では、Moonshot API のリージョン（`api.moonshot.ai` または `api.moonshot.cn`）と、デフォルトの Kimi ウェブ検索モデルを尋ねられる場合があります。

## その他の注意事項

- ローカル設定の書き込み後、選択したセットアップ手順で必要な場合、configure は選択されたダウンロード可能な Plugin をインストールします。リモート Gateway の設定では、ローカルの Plugin パッケージはインストールされません。
- チャンネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）では、セットアップ中にチャンネルまたはルームの許可リストを尋ねます。名前または ID を入力できます。可能な場合、ウィザードが名前を ID に解決します。
- デーモンのインストール手順を実行する場合、トークン認証にはトークンが必要です。`gateway.auth.token` が SecretRef で管理されている場合、configure は SecretRef を検証しますが、解決された平文のトークン値をスーパーバイザーサービスの環境メタデータには保存しません。SecretRef を解決できない場合、configure は実行可能な修正ガイダンスを表示し、デーモンのインストールを停止します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、モードを明示的に設定するまで configure はデーモンのインストールを停止します。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [設定](/ja-JP/gateway/configuration)
- 設定 CLI：[設定](/ja-JP/cli/config)
