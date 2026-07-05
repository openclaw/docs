---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-07-05T01:54:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーが開くが完了しない

CLI はブラウザーログイン中に短命のローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインします。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を読んでください。

- `Retry-After`: 再試行するまで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延後に再試行してください。

## プロキシ背後で検索またはインストールが失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## skill が検索に表示されない

- 正確な slug または owner ページがわかる場合は確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- その skill の所有者である場合は、サインインして検査してください。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断情報により、スキャン、アップロードゲート、またはモデレーション状態が説明される場合があります。

## 必須メタデータがないため publish が失敗する

skills の場合は、`SKILL.md` の frontmatter を確認してください。必須の環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

プラグインの場合は、`package.json` の互換性メタデータを確認してください。code-plugin の publish には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず publish ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub owner または source エラーで publish が失敗する

ClawHub は GitHub の ID とソース帰属を使用して、パッケージを公開者に結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認してください。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## namespace が要求済みまたは予約済みのため publish が失敗する

owner handle、org namespace、package scope、skill slug、または package name がすでに要求済みまたは予約済みであるため publish が失敗する場合は、まず namespace と一致する owner で公開していることを確認してください。プラグインパッケージの場合、`@example-org/example-plugin` のような scoped names は、一致する `example-org` owner として公開する必要があります。

自分の org、プロジェクト、またはブランドが正当な namespace owner であると考えているが、現在の ClawHub owner を管理できない場合は、公開可能で機密ではない証拠を添えて [Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) を開いてください。証拠のガイダンスと、公開 issue に含めないものについては、[Org and Namespace Claims](/clawhub/namespace-claims) を参照してください。

## `sync` が skills が見つからないと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が publish されるかわからない場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しい slug または fork として公開する。

## OpenClaw でプラグインのインストールが失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- 使用している OpenClaw バージョンが、パッケージで示されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留中、またはブロック中の場合、所有者が問題を解決するまでインストールできない場合があります。

## パブリック API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リストおよび検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リスティングへリンクしてください。
- 非表示、プライベート、保留中、またはモデレーションでブロックされたコンテンツを、パブリック API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api) を参照してください。
