---
read_when:
    - Skill または Plugin の公開
    - 所有者またはパッケージスコープのエラーをデバッグする
    - 公開 UI、CLI、またはバックエンドの動作を追加する
summary: ClawHub の公開が、Skills、Plugin、所有者、スコープ、リリース、レビューに対してどのように機能するか。
x-i18n:
    generated_at: "2026-06-27T10:50:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# 公開

公開すると、選択した所有者の下で skill フォルダーまたは Plugin パッケージが ClawHub に送信されます。ClawHub は、その所有者として公開できるトークンであることを確認し、メタデータ、名前、バージョン、ファイル、ソース情報を検証してから、リリースを保存し、自動セキュリティチェックを開始します。

検証に失敗した場合、何も公開されません。新しいリリースは、レビューが完了するまで通常のインストールおよびダウンロードの表示面に出ない場合もあります。

## Skills

最も単純な公開経路は CLI です。サインインしてから、ローカルの skill フォルダーを公開します。

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

組織所有者に公開する場合は `--owner <handle>` を使用します。認証済みユーザーとして公開する場合は省略します。公開では未変更のコンテンツはスキップされます。新しい skill は `1.0.0` から始まり、以後の変更では次のパッチバージョンが自動的に公開されます。明示的なバージョンが必要な場合にのみ `--version` を渡します。

カタログリポジトリでは、ClawHub の再利用可能な
[`skill-publish.yml` ワークフロー](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
を使用します。これは、`root` 配下の直下の各 skill フォルダー（デフォルト:
`skills`）に対して、または `skill_path` として指定されたフォルダーのみに対して `skill publish` を呼び出します。

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

公開せずに新規および変更された Skills をプレビューするには `dry_run: true` を使用します。

## Plugin

Plugin は npm 形式のパッケージ名を使用します。スコープ付きパッケージ名では、名前の最初の部分に所有者が含まれます。

```text
@owner/package-name
```

スコープは、選択した公開所有者と一致している必要があります。パッケージ名が `@openclaw/dronzer` の場合、`@openclaw` としてのみ公開できます。`@vintageayu` として公開する場合は、パッケージ名を `@vintageayu/dronzer` に変更してください。

これにより、公開者が管理していない組織名前空間をパッケージが主張することを防ぎます。

ClawHub ですでに請求済みまたは予約済みの組織、ブランド、パッケージスコープ、所有者ハンドル、または名前空間の正当な所有者である場合は、公開可能で機密でない証拠を添えて
[組織 / 名前空間の請求 Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。含める内容と公開 Issue に含めない内容については、
[組織と名前空間の請求](/ja-JP/clawhub/namespace-claims)を参照してください。

### Plugin を公開する前に

- パッケージスコープと一致する所有者を選択します。
- `openclaw.plugin.json` を含めます。コード Plugin では、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む `package.json` も必要です。
- カスタムの Plugin カードアイコンを表示するには、任意の HTTPS 画像 URL を指定して `openclaw.plugin.json` に `icon` を追加します。
- ソースリポジトリと正確なコミットメタデータを含めるか、それらを検出できるように GitHub に基づくチェックアウトから CLI を使用します。
- 公開前に `clawhub package validate <source>` を実行します。パッケージ、マニフェスト、SDK インポート、またはアーティファクトに関する検出事項については、
  [Plugin 検証の修正](/ja-JP/clawhub/plugin-validation-fixes)を参照してください。
- リリースを作成する前に `clawhub package publish <source> --dry-run` を実行します。
- 新しいリリースは、自動セキュリティチェックと検証が完了するまで公開インストール面に出ないものと想定してください。

### パッケージの信頼済み公開

パッケージの信頼済み公開は 2 段階の設定です。

1. 通常の手動またはトークン認証済みの `clawhub package publish` で、パッケージを一度公開します。これによりパッケージ行が作成され、信頼済み公開者設定を変更できるパッケージ管理者が確立されます。
2. パッケージ管理者が GitHub Actions の信頼済み公開者設定を行います。

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

設定後は、今後サポートされる GitHub Actions の公開で、長期有効な ClawHub トークンをリポジトリに保存せずに OIDC/信頼済み公開を使用できます。設定されたリポジトリとワークフローファイル名は、GitHub Actions の OIDC クレームと一致している必要があります。`--environment <name>` も渡す場合、GitHub Actions の環境クレームはその名前と完全に一致している必要があります。

ClawHub は、信頼済み公開者設定が行われると、設定された GitHub リポジトリを検証します。公開リポジトリは、公開 GitHub メタデータを通じて検証できます。非公開リポジトリでは、たとえば将来の ClawHub GitHub App インストールや別の承認済み GitHub 連携を通じて、ClawHub がそのリポジトリへの GitHub アクセスを持つ必要があります。

現在の再利用可能なパッケージ公開ワークフローは、`id-token: write` が利用可能な場合、`workflow_dispatch` 公開でシークレットなしの信頼済み公開をサポートします。タグプッシュによる実際の公開では引き続き `clawhub_token` が必要なため、タグリリース、初回公開、信頼されていないパッケージ、または緊急時の公開のために `CLAWHUB_TOKEN` を利用可能な状態にしておいてください。

設定を確認または削除するには、次を使用します。

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

信頼済み公開者設定の削除がロールバック経路です。これにより、パッケージ管理者が再度設定するまで、今後の信頼済み公開トークンの発行が無効になります。

## FAQ

### パッケージスコープは選択した所有者と一致している必要があります

パッケージスコープと選択した所有者が一致しない場合、ClawHub は公開を拒否します。

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

修正するには、パッケージスコープで示されている所有者を選択するか、自分が公開できる所有者とスコープが一致するようにパッケージ名を変更します。

パッケージ名のスコープは正しいが、パッケージが誤った公開者に所有されている場合は、代わりに所有権を移転します。

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

パッケージまたは skill の移転は、現在の所有者と移転先公開者の両方に対する管理者アクセスがある場合にのみ使用してください。パッケージ移転によって、管理できないスコープに公開できるようになるわけではありません。

現在の所有者へのアクセス権がないものの、自分の組織、プロジェクト、またはブランドが正当な名前空間所有者であると考える場合は、スタッフレビュー用に公開可能で機密でない証拠を添えて
[組織 / 名前空間の請求 Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。提出前に
[組織と名前空間の請求](/ja-JP/clawhub/namespace-claims)を参照してください。

これは組織名前空間を保護します。`@openclaw/dronzer` という名前のパッケージは `@openclaw` 名前空間を主張するため、`@openclaw` 所有者へのアクセス権を持つ公開者だけが公開できます。
