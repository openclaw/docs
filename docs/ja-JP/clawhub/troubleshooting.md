---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、および API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-07-01T05:28:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザを開くが完了しない

CLI はブラウザログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を確認してください。

- `Retry-After`: リトライ前に待機する秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り枠。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても匿名 IP の上限に達することがあります。可能な場合はサインインし、報告された遅延後にリトライしてください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確なスラッグ、または分かっている場合はオーナーページを確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- そのスキルを所有している場合は、サインインして調査してください。

```bash
clawhub inspect @openclaw/demo
```

オーナーに表示される診断情報により、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータがないため公開が失敗する

スキルでは、`SKILL.md` の frontmatter を確認してください。必要な環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認してください。code-plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースのエラーで公開が失敗する

ClawHub は GitHub ID とソース帰属情報を使用して、パッケージを公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認してください。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## namespace が要求済みまたは予約済みのため公開が失敗する

公開が失敗した理由が、オーナーハンドル、組織 namespace、パッケージスコープ、スキルスラッグ、またはパッケージ名がすでに要求済みまたは予約済みであることの場合、まず namespace と一致するオーナーで公開していることを確認してください。Plugin パッケージでは、`@example-org/example-plugin` のようなスコープ付き名前は、一致する `example-org` オーナーとして公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な namespace オーナーであるにもかかわらず、現在の ClawHub オーナーを管理できない場合は、公開可能で機密ではない証拠を添えて [Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) を作成してください。証拠の指針と公開 issue に含めない内容については、[組織と namespace の要求](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルが見つからなかったと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、先にプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更があるため `update` が拒否する

ローカルファイルが ClawHub の認識しているどのバージョンとも一致しません。いずれかを選択してください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しいスラッグまたは fork として公開する。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- OpenClaw のバージョンが、パッケージの公開している互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまでインストールできない可能性があります。

## Public API リクエストが失敗する

- `429` のリトライヘッダーに従い、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リストに戻すリンクを設定してください。
- 非表示、非公開、保留、またはモデレーションでブロックされたコンテンツを public API surface の外部にミラーしないでください。

エンドポイントの詳細については [HTTP API](/clawhub/http-api) を参照してください。
