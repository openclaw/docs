---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルト設定を対話的に調整したい場合
summary: '`openclaw configure` の CLI リファレンス（対話型設定プロンプト）'
title: 設定
x-i18n:
    generated_at: "2026-04-30T05:03:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

認証情報、デバイス、エージェントのデフォルトを設定するための対話型プロンプトです。

<Note>
**モデル**セクションには、`agents.defaults.models` 許可リスト（`/model` とモデルピッカーに表示されるもの）用の複数選択があります。プロバイダー単位のセットアップ選択は、設定内にすでにある無関係なプロバイダーを置き換えずに、選択したモデルを既存の許可リストへマージします。configure からプロバイダー認証を再実行しても、既存の `agents.defaults.model.primary` は保持されます。意図的にデフォルトモデルを変更したい場合は、`openclaw models auth login --provider <id> --set-default` または `openclaw models set <model>` を使用してください。
</Note>

configure がプロバイダー認証の選択から開始される場合、デフォルトモデルと許可リストのピッカーはそのプロバイダーを自動的に優先します。Volcengine や BytePlus などのペアになったプロバイダーでは、同じ優先設定がそれらのコーディングプランのバリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。優先プロバイダーのフィルターによって空のリストになる場合、configure は空白のピッカーを表示する代わりに、フィルターなしのカタログへフォールバックします。

<Tip>
サブコマンドなしの `openclaw config` は同じウィザードを開きます。非対話型の編集には `openclaw config get|set|unset` を使用してください。
</Tip>

Web 検索では、`openclaw configure --section web` によりプロバイダーを選択し、
その認証情報を設定できます。一部のプロバイダーでは、プロバイダー固有の
追加プロンプトも表示されます。

- **Grok** は同じ `XAI_API_KEY` で任意の `x_search` セットアップを提供し、
  `x_search` モデルを選択できるようにします。
- **Kimi** は Moonshot API リージョン（`api.moonshot.ai` と
  `api.moonshot.cn`）およびデフォルトの Kimi Web 検索モデルを尋ねることがあります。

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

- Gateway を実行する場所を選択すると、常に `gateway.mode` が更新されます。それだけが必要な場合は、他のセクションなしで「続行」を選択できます。
- チャンネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）は、セットアップ中にチャンネル/ルームの許可リストを入力するよう求めます。名前または ID を入力できます。可能な場合、ウィザードは名前を ID に解決します。
- デーモンのインストール手順を実行する場合、トークン認証にはトークンが必要であり、`gateway.auth.token` が SecretRef 管理の場合、configure は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービスの環境メタデータへ永続化しません。
- トークン認証にトークンが必要で、設定済みトークン SecretRef が解決できない場合、configure は実行可能な修復ガイダンスとともにデーモンのインストールをブロックします。
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
