---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルト設定を対話形式で調整したい場合
summary: '`openclaw configure` の CLI リファレンス（対話型設定プロンプト）'
title: 設定
x-i18n:
    generated_at: "2026-05-02T04:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

認証情報、デバイス、エージェントのデフォルトを設定する対話型プロンプト。

<Note>
**モデル**セクションには、`agents.defaults.models` 許可リスト（`/model` とモデルピッカーに表示されるもの）用の複数選択があります。プロバイダー単位のセットアップの選択肢は、設定にすでにある無関係なプロバイダーを置き換えるのではなく、選択したモデルを既存の許可リストにマージします。

configure からプロバイダー認証を再実行すると、プロバイダーの認証ステップが独自の推奨デフォルトモデルを含む設定パッチを返す場合でも、既存の `agents.defaults.model.primary` が保持されます。つまり、xAI、OpenRouter、または別のプロバイダーを追加または再認証すると、現在のプライマリモデルを引き継がずに新しいモデルを利用可能にできます。デフォルトモデルを意図的に変更したい場合は、`openclaw models auth login --provider <id> --set-default` または `openclaw models set <model>` を使用してください。
</Note>

configure がプロバイダー認証の選択から開始される場合、デフォルトモデルと許可リストのピッカーはそのプロバイダーを自動的に優先します。Volcengine と BytePlus のようなペアのプロバイダーでは、同じ優先設定がそれらの coding-plan バリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。優先プロバイダーフィルターによってリストが空になる場合、configure は空のピッカーを表示する代わりに、フィルターなしのカタログにフォールバックします。

<Tip>
サブコマンドなしの `openclaw config` は同じウィザードを開きます。非対話的な編集には `openclaw config get|set|unset` を使用してください。
</Tip>

Web 検索では、`openclaw configure --section web` を使ってプロバイダーを選択し、その認証情報を設定できます。一部のプロバイダーでは、プロバイダー固有の後続プロンプトも表示されます。

- **Grok** は、同じ `XAI_API_KEY` を使った任意の `x_search` セットアップを提示し、`x_search` モデルを選択できるようにします。
- **Kimi** は、Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）とデフォルトの Kimi Web 検索モデルを尋ねることがあります。

関連:

- Gateway 設定リファレンス: [設定](/ja-JP/gateway/configuration)
- 設定 CLI: [設定](/ja-JP/cli/config)

## オプション

- `--section <section>`: 繰り返し指定できるセクションフィルター

利用可能なセクション:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

注記:

- Gateway を実行する場所を選択すると、常に `gateway.mode` が更新されます。必要なのがそれだけであれば、他のセクションなしで「続行」を選択できます。
- ローカル設定の書き込み後、選択したセットアップパスで必要な場合、configure は選択されたダウンロード可能な plugins をインストールします。リモート Gateway 設定では、ローカル Plugin パッケージはインストールされません。
- チャネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）は、セットアップ中にチャネル/ルームの許可リストを尋ねます。名前または ID を入力できます。可能な場合、ウィザードは名前を ID に解決します。
- デーモンのインストール手順を実行する場合、トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、configure は SecretRef を検証しますが、解決済みの平文トークン値を supervisor サービスの環境メタデータに保存しません。
- トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、configure は実行可能な修復ガイダンスを示してデーモンのインストールをブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、configure はモードが明示的に設定されるまでデーモンのインストールをブロックします。

## 例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [設定](/ja-JP/gateway/configuration)
