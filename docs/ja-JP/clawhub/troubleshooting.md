---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-06-28T05:09:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に、短時間だけ有効なローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認します。
- API トークンを使用している場合は、web UI で失効されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を確認します。

- `Retry-After`: リトライ前に待機する秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り枠。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

複数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが数件のリクエストしか送っていなくても、匿名 IP の上限に達することがあります。可能な場合はサインインし、報告された遅延後にリトライしてください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` があります。

## スキルが検索に表示されない

- 正確な slug、または分かっている場合はオーナーページを確認します。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認します。
- そのスキルの所有者である場合は、サインインして調査します。

```bash
clawhub inspect @openclaw/demo
```

オーナーに表示される診断で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータが不足しているため公開が失敗する

スキルの場合は、`SKILL.md` の frontmatter を確認します。必須の環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認します。コード Plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースエラーにより公開が失敗する

ClawHub は GitHub ID とソース帰属を使用して、パッケージを公開者に結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認します。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用します。

## namespace が要求済みまたは予約済みのため公開が失敗する

オーナーハンドル、組織 namespace、パッケージスコープ、スキル slug、またはパッケージ名がすでに要求済みまたは予約済みであるために公開が失敗する場合は、まず namespace と一致するオーナーで公開していることを確認します。Plugin パッケージの場合、`@example-org/example-plugin` のような scoped 名は、一致する `example-org` オーナーとして公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な namespace オーナーだと考えているが、現在の ClawHub オーナーを管理できない場合は、公開可能で機密ではない証拠を添えて [Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) を開いてください。証拠のガイダンスと公開 issue に含めない内容については、[組織と namespace の要求](/ja-JP/clawhub/namespace-claims) を参照してください。

## `sync` がスキルを見つけられなかったと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたい root を指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか分からない場合は、まずプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択します。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しい slug または fork として公開します。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認します。
- 使用している OpenClaw バージョンが、パッケージで提示されている互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまでインストールできないことがあります。

## 公開 API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開リストと検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リスティングに戻すリンクを提示します。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、公開 API surface の外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/ja-JP/clawhub/http-api) を参照してください。
