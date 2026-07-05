---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルトを対話的に調整したい
summary: '`openclaw configure` の CLI リファレンス（対話型設定プロンプト）'
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:10:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

既存のセットアップに対する対象を絞った変更のための対話型プロンプト: 認証情報、デバイス、エージェントのデフォルト、Gateway、チャンネル、プラグイン、Skills、ヘルスチェック。

初回実行の完全なガイド付き手順には `openclaw onboard` または `openclaw setup` を、ベースラインの設定/ワークスペースのみには `openclaw setup --baseline` を、チャンネルアカウントのセットアップだけが必要な場合は `openclaw channels add` を使用します。

<Tip>
サブコマンドなしの `openclaw config` は同じウィザードを開きます。非対話型の編集には `openclaw config get|set|unset` を使用します。
</Tip>

## オプション

`--section <section>`: 繰り返し指定できるセクションフィルター。利用可能なセクション:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

`gateway`、`daemon`、または `health` を選択する場合（または `--section` なしで完全なウィザードを実行する場合）、Gateway をどこで実行するかを尋ね、`gateway.mode` を更新します。この3つをすべてスキップするセクションフィルターでは、Gateway モードのプロンプトなしで、要求されたセットアップに直接進みます。リモート Gateway モードを選ぶと、リモート設定を書き込んですぐに終了します。プラグインのインストールなど、ローカル専用の手順は実行しません。

<Note>
`openclaw configure` には対話型ターミナルが必要です（stdin と stdout の両方が TTY である必要があります）。対話型ターミナルがない場合、部分的に実行する代わりに、同等の非対話型 `openclaw config get|set|patch|validate` コマンドを表示してエラーで終了します。
</Note>

## モデルセクション

<Note>
**モデル** には `agents.defaults.models` 許可リスト（`/model` とモデルピッカーに表示されるもの）の複数選択が含まれます。プロバイダー範囲のセットアップ選択では、設定内にすでに存在する無関係なプロバイダーを置き換えるのではなく、選択したモデルを既存の許可リストにマージします。

configure からプロバイダー認証を再実行すると、プロバイダーの認証手順が独自の推奨デフォルトモデルを含む設定パッチを返す場合でも、既存の `agents.defaults.model.primary` が保持されます。プロバイダーを追加または再認証すると、現在のプライマリモデルを奪うことなく、そのプロバイダーのモデルを利用できるようになります。デフォルトモデルを意図的に変更するには、`openclaw models auth login --provider <id> --set-default` または `openclaw models set <model>` を使用します。
</Note>

configure がプロバイダー認証の選択から開始される場合、デフォルトモデルと許可リストのピッカーはそのプロバイダーを自動的に優先します。Volcengine と BytePlus のようなペアのプロバイダーでは、同じ優先設定がそれぞれのコーディングプランのバリアント（`volcengine-plan/*`, `byteplus-plan/*`）にも一致します。優先プロバイダーフィルターの結果が空のリストになる場合、configure は空のピッカーを表示する代わりに、フィルターなしのカタログにフォールバックします。

## Web セクション

`openclaw configure --section web` は Web 検索プロバイダーを選択し、その認証情報を設定します。一部のプロバイダーでは、プロバイダー固有の追加手順が表示されます:

- **Grok** は、同じ xAI OAuth プロファイルまたは API キーを使った任意の `x_search` セットアップを提示し、`x_search` モデルを選択できるようにします。
- **Kimi** は Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）と、デフォルトの Kimi Web 検索モデルを尋ねる場合があります。

## その他の注意事項

- ローカル設定を書き込んだ後、configure は選択されたセットアップパスで必要な場合、選択されたダウンロード可能なプラグインをインストールします。リモート Gateway 設定では、ローカルのプラグインパッケージはインストールされません。
- チャンネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）は、セットアップ中にチャンネル/ルームの許可リストを尋ねます。名前または ID を入力できます。可能な場合、ウィザードは名前を ID に解決します。
- daemon インストール手順を実行する場合、トークン認証にはトークンが必要です。`gateway.auth.token` が SecretRef 管理の場合、configure は SecretRef を検証しますが、解決済みの平文トークン値を supervisor サービス環境メタデータには永続化しません。SecretRef が未解決の場合、configure は実行可能な修復ガイダンスを示して daemon インストールをブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、configure はモードを明示的に設定するまで daemon インストールをブロックします。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [設定](/ja-JP/gateway/configuration)
- 設定 CLI: [設定](/ja-JP/cli/config)
