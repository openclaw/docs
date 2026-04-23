---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルト設定を対話的に調整したい場合
summary: '`openclaw configure` の CLI リファレンス（対話型の設定プロンプト）'
title: 設定する
x-i18n:
    generated_at: "2026-04-23T14:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

認証情報、デバイス、およびエージェントのデフォルト設定を行うための対話型プロンプトです。

注: **Model** セクションには、`agents.defaults.models` の allowlist（`/model` と model picker に表示されるもの）用の
複数選択が含まれるようになりました。
provider スコープのセットアップ選択では、選択した model を既存の
allowlist にマージし、config 内の無関係な provider を置き換えません。

configure が provider 認証の選択から開始された場合、
default-model と allowlist の picker は自動的にその provider を優先します。Volcengine/BytePlus のような
ペアになった provider では、この同じ優先設定はその coding-plan
variant（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。preferred-provider
filter によって空のリストになる場合、configure は空の picker を表示する代わりに
filter なしの catalog にフォールバックします。

ヒント: サブコマンドなしの `openclaw config` でも同じウィザードが開きます。
非対話型の編集には `openclaw config get|set|unset` を使用してください。

Web 検索については、`openclaw configure --section web` で provider を選択し、
その認証情報を設定できます。一部の provider では、provider 固有の
追加プロンプトも表示されます:

- **Grok** では、同じ `XAI_API_KEY` を使った任意の `x_search` セットアップを提供し、
  `x_search` model を選択できます。
- **Kimi** では、Moonshot API リージョン（`api.moonshot.ai` と
  `api.moonshot.cn`）およびデフォルトの Kimi Web 検索 model を確認できます。

関連:

- Gateway 設定リファレンス: [Configuration](/ja-JP/gateway/configuration)
- Config CLI: [Config](/ja-JP/cli/config)

## オプション

- `--section <section>`: 繰り返し指定可能な section filter

使用可能な sections:

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

- Gateway の実行場所を選ぶと、常に `gateway.mode` が更新されます。それだけが必要な場合は、他のセクションを選ばずに「続行」を選択できます。
- チャネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）では、セットアップ中にチャネル/ルーム allowlist の入力が求められます。名前または ID を入力でき、可能な場合はウィザードが名前を ID に解決します。
- daemon のインストール手順を実行する場合、token 認証には token が必要で、`gateway.auth.token` が SecretRef 管理であるとき、configure は SecretRef を検証しますが、解決済みの平文 token 値を supervisor service environment metadata に永続化しません。
- token 認証に token が必要で、設定された token SecretRef が未解決の場合、configure は実行可能な対処ガイダンスとともに daemon のインストールをブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、configure は mode が明示的に設定されるまで daemon のインストールをブロックします。

## 例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
