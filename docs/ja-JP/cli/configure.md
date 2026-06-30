---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルトを対話的に調整したい場合
summary: '`openclaw configure` の CLI リファレンス（対話型設定プロンプト）'
title: 設定
x-i18n:
    generated_at: "2026-06-30T22:05:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

既存セットアップに対して対象を絞った変更を行うための対話型プロンプトです。認証情報、デバイス、エージェントのデフォルト、Gateway、チャンネル、plugins、skills、ヘルスチェックを扱います。

初回実行の完全なガイド付き手順には `openclaw onboard` または `openclaw setup` を、ベースラインの設定/ワークスペースのみには `openclaw setup --baseline` を、チャンネルアカウントのセットアップだけが必要な場合は `openclaw channels add` を使用します。

<Note>
**モデル** セクションには、`agents.defaults.models` 許可リスト（`/model` とモデルピッカーに表示されるもの）用の複数選択が含まれます。プロバイダー単位のセットアップ選択では、選択したモデルが既存の許可リストにマージされ、設定内にすでにある無関係なプロバイダーは置き換えられません。

configure からプロバイダー認証を再実行すると、プロバイダーの認証ステップが独自の推奨デフォルトモデルを含む設定パッチを返す場合でも、既存の `agents.defaults.model.primary` が保持されます。つまり、xAI、OpenRouter、または別のプロバイダーを追加または再認証しても、現在のプライマリモデルを置き換えることなく、新しいモデルを利用可能にできます。デフォルトモデルを意図的に変更したい場合は、`openclaw models auth login --provider <id> --set-default` または `openclaw models set <model>` を使用します。
</Note>

configure がプロバイダー認証の選択から開始された場合、デフォルトモデルと許可リストのピッカーはそのプロバイダーを自動的に優先します。Volcengine と BytePlus のようなペアのプロバイダーでは、同じ優先設定がそれぞれのコーディングプラン variants（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。優先プロバイダーのフィルターで空のリストになる場合、configure は空のピッカーを表示する代わりに、フィルターなしのカタログへフォールバックします。

<Tip>
サブコマンドなしの `openclaw config` は同じウィザードを開きます。非対話型の編集には `openclaw config get|set|unset` を使用します。
</Tip>

Web検索では、`openclaw configure --section web` によりプロバイダーを選択し、その認証情報を設定できます。一部のプロバイダーでは、プロバイダー固有の追加プロンプトも表示されます。

- **Grok** では、同じ xAI OAuth プロファイルまたは API キーを使った任意の `x_search` セットアップを提示し、`x_search` モデルを選択できます。
- **Kimi** では、Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）とデフォルトの Kimi Web検索モデルを尋ねることがあります。

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

- 完全なウィザードと Gateway 関連セクションでは、Gateway の実行場所を尋ね、`gateway.mode` を更新します。`gateway`、`daemon`、または `health` を含まないセクションフィルターは、要求されたセットアップへ直接進みます。
- ローカル設定の書き込み後、configure は選択したセットアップパスで必要な場合に、選択されたダウンロード可能な plugins をインストールします。リモート Gateway 設定では、ローカルの plugin パッケージはインストールされません。
- チャンネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）は、セットアップ中にチャンネル/ルームの許可リストを求めます。名前または ID を入力できます。可能な場合、ウィザードは名前を ID に解決します。
- デーモンのインストールステップを実行し、トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、configure は SecretRef を検証しますが、解決済みの平文トークン値を supervisor サービス環境メタデータには永続化しません。
- トークン認証にトークンが必要で、設定済みのトークン SecretRef が未解決の場合、configure は実行可能な修正ガイダンスを示してデーモンのインストールをブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、configure はモードが明示的に設定されるまでデーモンのインストールをブロックします。

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
