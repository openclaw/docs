---
read_when:
    - スキルまたはPluginの公開
    - 所有者またはパッケージのスコープエラーをデバッグする
    - 公開用 UI、CLI、またはバックエンド動作の追加
summary: Skills、Plugin、所有者、スコープ、リリース、レビューに関する ClawHub での公開の仕組み。
x-i18n:
    generated_at: "2026-07-11T22:04:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# 公開

公開すると、Skill フォルダーまたは Plugin パッケージが、選択した所有者のものとして ClawHub に送信されます。ClawHub は、トークンにその所有者として公開する権限があることを確認し、メタデータ、名前、バージョン、ファイル、ソース情報を検証してから、リリースを保存し、自動セキュリティチェックを開始します。

検証に失敗した場合、何も公開されません。また、新しいリリースは、レビューが完了するまで通常のインストールおよびダウンロード画面に表示されないことがあります。

## Skills

最も簡単な公開方法は CLI です。サインインしてから、ローカルの Skill フォルダーを公開します。

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

組織の所有者として公開する場合は `--owner <handle>` を使用します。認証済みユーザーとして公開する場合は省略します。公開時には変更のない内容がスキップされます。新しい Skill は `1.0.0` から始まり、それ以降の変更では次のパッチバージョンが自動的に公開されます。明示的なバージョンが必要な場合にのみ `--version` を指定してください。

カタログリポジトリでは、ClawHub の再利用可能な [`skill-publish.yml` ワークフロー](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)を使用します。このワークフローは、`root`（デフォルト: `skills`）直下の各 Skill フォルダー、または `skill_path` として指定されたフォルダーのみに対して `skill publish` を呼び出します。

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

公開せずに新規および変更済みの Skills をプレビューするには、`dry_run: true` を使用します。

## Plugins

Plugins は npm 形式のパッケージ名を使用します。スコープ付きパッケージ名では、名前の先頭部分に所有者が含まれます。

```text
@owner/package-name
```

スコープは、選択した公開所有者と一致する必要があります。パッケージ名が `@openclaw/dronzer` の場合、`@openclaw` としてのみ公開できます。`@vintageayu` として公開する場合は、パッケージ名を `@vintageayu/dronzer` に変更してください。

これにより、公開者が管理していない組織の名前空間をパッケージが使用することを防ぎます。

ClawHub ですでに使用または予約されている組織、ブランド、パッケージスコープ、所有者ハンドル、名前空間の正当な所有者である場合は、公開可能で機密性のない証明を添えて [組織／名前空間の申請 Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)を作成してください。記載すべき内容と公開 Issue に記載してはならない内容については、[組織と名前空間の申請](/clawhub/namespace-claims)を参照してください。

### Plugin を公開する前に

- パッケージスコープと一致する所有者を選択します。
- `openclaw.plugin.json` を含めます。コード Plugin には、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む `package.json` も必要です。
- カスタムの Plugin カードアイコンを表示するには、任意の HTTPS 画像 URL を指定した `icon` を `openclaw.plugin.json` に追加します。
- ソースリポジトリと正確なコミットのメタデータを含めるか、GitHub を基盤とするチェックアウトから CLI を使用して、それらを検出できるようにします。
- 公開前に `clawhub package validate <source>` を実行します。パッケージ、マニフェスト、SDK インポート、アーティファクトに関する検出事項については、[Plugin 検証エラーの修正](/clawhub/plugin-validation-fixes)を参照してください。
- リリースを作成する前に `clawhub package publish <source> --dry-run` を実行します。
- 自動セキュリティチェックと検証が完了するまで、新しいリリースは公開インストール画面に表示されないものと想定してください。

### パッケージの信頼された公開

パッケージの信頼された公開は、次の 2 段階で設定します。

1. 通常の手動またはトークン認証による `clawhub package publish` を使用して、パッケージを一度公開します。これによりパッケージ行が作成され、信頼された公開者の設定を変更できるパッケージ管理者が確立されます。
2. パッケージ管理者が GitHub Actions の信頼された公開者設定を行います。

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

設定後、以降の対応する GitHub Actions による公開では、長期間有効な ClawHub トークンをリポジトリに保存せずに、OIDC／信頼された公開を使用できます。設定したリポジトリとワークフローファイル名は、GitHub Actions の OIDC クレームと一致する必要があります。`--environment <name>` も指定した場合、GitHub Actions の環境クレームはその名前と完全に一致する必要があります。

ClawHub は、信頼された公開者の設定時に、設定された GitHub リポジトリを検証します。公開リポジトリは、公開されている GitHub メタデータを通じて検証できます。非公開リポジトリでは、将来の ClawHub GitHub App のインストールや、承認済みの別の GitHub 連携などを通じて、ClawHub がそのリポジトリへの GitHub アクセス権を持っている必要があります。

現在の再利用可能なパッケージ公開ワークフローは、`id-token: write` が利用可能な場合、`workflow_dispatch` による公開でシークレットを使用しない信頼された公開に対応しています。タグのプッシュによる実際の公開には引き続き `clawhub_token` が必要なため、タグリリース、初回公開、信頼されていないパッケージ、または緊急時の公開に備えて `CLAWHUB_TOKEN` を利用可能な状態にしてください。

次のコマンドで設定を確認または削除できます。

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

信頼された公開者の設定を削除することが、ロールバック手段です。パッケージ管理者が設定を再度行うまで、以降の信頼された公開用トークンの発行が無効になります。

## よくある質問

### パッケージスコープは選択した所有者と一致する必要がある

パッケージスコープと選択した所有者が一致しない場合、ClawHub は公開を拒否します。

```text
パッケージスコープ「@openclaw」は、選択した所有者「@vintageayu」と一致する必要があります。
「@openclaw」として公開するか、このパッケージの名前を「@vintageayu/dronzer」に変更してください。
```

修正するには、パッケージスコープで指定されている所有者を選択するか、公開可能な所有者とスコープが一致するようにパッケージ名を変更します。

パッケージ名のスコープがすでに正しいものの、誤った公開者がパッケージを所有している場合は、代わりに所有権を移管します。

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

パッケージまたは Skill の移管は、現在の所有者と移管先の公開者の両方に対する管理者アクセス権がある場合にのみ使用してください。パッケージを移管しても、管理できないスコープへの公開はできません。

現在の所有者へのアクセス権はないものの、自分の組織、プロジェクト、またはブランドが正当な名前空間所有者であると考える場合は、スタッフによるレビューのため、公開可能で機密性のない証明を添えて [組織／名前空間の申請 Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)を作成してください。申請前に[組織と名前空間の申請](/clawhub/namespace-claims)を参照してください。

これにより、組織の名前空間が保護されます。`@openclaw/dronzer` という名前のパッケージは `@openclaw` 名前空間を使用するため、`@openclaw` 所有者へのアクセス権を持つ公開者のみが公開できます。
