---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルトを対話的に調整したい場合
summary: '`openclaw configure` のCLIリファレンス（対話型設定プロンプト）'
title: 設定する
x-i18n:
    generated_at: "2026-04-24T04:49:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

認証情報、デバイス、エージェントのデフォルトを設定するための対話型プロンプトです。

注: **Model** セクションには、`agents.defaults.models` の許可リスト（`/model` とモデルピッカーに表示される内容）向けの複数選択が追加されました。プロバイダー単位のセットアップ選択では、既存の config にある無関係なプロバイダーを置き換えるのではなく、選択したモデルを既存の許可リストにマージします。

configure がプロバイダー認証の選択から開始された場合、デフォルトモデルと許可リストのピッカーは自動的にそのプロバイダーを優先します。Volcengine/BytePlus のようなペアのプロバイダーでは、この優先設定はその coding-plan バリアント（`volcengine-plan/*`, `byteplus-plan/*`）にも一致します。優先プロバイダーフィルターによって空の一覧になる場合、configure は空白のピッカーを表示するのではなく、フィルターされていないカタログにフォールバックします。

ヒント: サブコマンドなしの `openclaw config` を実行すると、同じウィザードが開きます。非対話型の編集には `openclaw config get|set|unset` を使用してください。

Web 検索では、`openclaw configure --section web` によりプロバイダーを選択して認証情報を設定できます。一部のプロバイダーでは、プロバイダー固有の追加プロンプトも表示されます。

- **Grok** は、同じ `XAI_API_KEY` を使った任意の `x_search` セットアップを提案し、`x_search` モデルを選択させることがあります。
- **Kimi** では、Moonshot API リージョン（`api.moonshot.ai` または `api.moonshot.cn`）と、デフォルトの Kimi Web 検索モデルを尋ねることがあります。

関連:

- Gateway 設定リファレンス: [Configuration](/ja-JP/gateway/configuration)
- Config CLI: [Config](/ja-JP/cli/config)

## オプション

- `--section <section>`: 繰り返し可能なセクションフィルター

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

注:

- Gateway をどこで実行するかを選ぶと、常に `gateway.mode` が更新されます。それだけが必要であれば、他のセクションなしで「Continue」を選択できます。
- チャンネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）では、セットアップ中にチャンネル/ルームの許可リスト入力を求められます。名前または ID を入力でき、可能な場合はウィザードが名前を ID に解決します。
- daemon のインストール手順を実行する場合、トークン認証でトークンが必要であり、`gateway.auth.token` が SecretRef 管理であるとき、configure は SecretRef を検証しますが、解決されたプレーンテキストのトークン値を supervisor サービスの環境メタデータに永続化しません。
- トークン認証でトークンが必要で、設定されたトークン SecretRef が未解決の場合、configure は実行可能な修復ガイダンスを示して daemon インストールをブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、configure は mode が明示的に設定されるまで daemon インストールをブロックします。

## 例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 関連

- [CLI reference](/ja-JP/cli)
- [Configuration](/ja-JP/gateway/configuration)
