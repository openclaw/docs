---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルトを対話的に調整したい
summary: '`openclaw configure` の CLI リファレンス（対話型設定プロンプト）'
title: 設定
x-i18n:
    generated_at: "2026-06-27T10:53:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

既存のセットアップに対して、認証情報、デバイス、エージェントのデフォルト、Gateway、チャンネル、plugins、skills、ヘルスチェックを対象に変更するための対話型プロンプトです。

初回実行の完全なガイド付き手順には `openclaw onboard`、ベースラインの設定/ワークスペースのみには `openclaw setup`、チャンネルアカウントのセットアップだけが必要な場合は `openclaw channels add` を使用します。

<Note>
**モデル**セクションには、`agents.defaults.models` 許可リスト（`/model` とモデルピッカーに表示されるもの）の複数選択が含まれます。プロバイダー単位のセットアップ選択では、設定内にすでにある無関係なプロバイダーを置き換えるのではなく、選択したモデルを既存の許可リストにマージします。

configure からプロバイダー認証を再実行すると、プロバイダーの認証ステップが独自の推奨デフォルトモデルを含む設定パッチを返す場合でも、既存の `agents.defaults.model.primary` は保持されます。つまり、xAI、OpenRouter、または別のプロバイダーを追加または再認証しても、現在のプライマリモデルを奪うことなく、新しいモデルを利用可能にできます。意図的にデフォルトモデルを変更したい場合は、`openclaw models auth login --provider <id> --set-default` または `openclaw models set <model>` を使用します。
</Note>

configure がプロバイダー認証の選択から開始される場合、デフォルトモデルと許可リストのピッカーはそのプロバイダーを自動的に優先します。Volcengine や BytePlus のようなペアのプロバイダーでは、同じ優先設定がそれぞれのコーディングプランのバリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。優先プロバイダーのフィルターで空のリストになる場合、configure は空のピッカーを表示するのではなく、フィルターなしのカタログにフォールバックします。

<Tip>
サブコマンドなしの `openclaw config` は同じウィザードを開きます。非対話型の編集には `openclaw config get|set|unset` を使用します。
</Tip>

Web 検索では、`openclaw configure --section web` によりプロバイダーを選択し、その認証情報を設定できます。一部のプロバイダーでは、プロバイダー固有の後続プロンプトも表示されます。

- **Grok** は、同じ xAI OAuth プロファイルまたは API キーを使用する任意の `x_search` セットアップを提示し、`x_search` モデルを選択できるようにします。
- **Kimi** は、Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）と、デフォルトの Kimi Web 検索モデルを尋ねる場合があります。

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

- 完全なウィザードと Gateway 関連セクションでは、Gateway をどこで実行するかを尋ね、`gateway.mode` を更新します。`gateway`、`daemon`、または `health` を含まないセクションフィルターは、要求されたセットアップに直接進みます。
- ローカル設定の書き込み後、選択したセットアップ経路で必要な場合、configure は選択されたダウンロード可能な plugins をインストールします。リモート Gateway 設定では、ローカルの plugin パッケージはインストールされません。
- チャンネル向けサービス（Slack/Discord/Matrix/Microsoft Teams）は、セットアップ中にチャンネル/ルームの許可リストを求めます。名前または ID を入力できます。ウィザードは可能な場合、名前を ID に解決します。
- デーモンのインストール手順を実行する場合、トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理されているとき、configure は SecretRef を検証しますが、解決済みの平文トークン値を supervisor サービスの環境メタデータには永続化しません。
- トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、configure は実行可能な修正ガイダンスを表示してデーモンのインストールをブロックします。
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
