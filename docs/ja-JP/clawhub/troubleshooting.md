---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-06T21:47:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短命のローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub web UI で API トークンを作成して、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使っている場合は、web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を確認してください。

- `Retry-After`: リトライ前に待機する秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り枠。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、
匿名 IP の制限に達することがあります。可能な場合はサインインし、報告された遅延の後でリトライしてください。

## プロキシ背後で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、
`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確な slug、または分かっている場合は所有者ページを確認してください。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認してください。
- そのスキルを所有している場合は、サインインして調査してください。

```bash
clawhub inspect @openclaw/demo
```

所有者に見える診断情報で、スキャン、アップロードゲート、またはモデレーション状態を説明できる場合があります。

## 必須メタデータがないため公開に失敗する

スキルでは、`SKILL.md` の frontmatter を確認してください。必要な環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認してください。code-plugin の公開には、
`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの
OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースエラーで公開に失敗する

ClawHub は GitHub の ID とソース帰属を使って、パッケージとその
公開者を結び付けます。

- パッケージを所有しているか公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使ってください。

## namespace が取得済みまたは予約済みのため公開に失敗する

所有者ハンドル、org namespace、パッケージスコープ、スキル slug、またはパッケージ名がすでに取得済みまたは予約済みであるため公開に失敗する場合は、まず namespace に一致する所有者として公開していることを確認してください。Plugin パッケージでは、
`@example-org/example-plugin` のようなスコープ付き名前は、一致する
`example-org` 所有者として公開する必要があります。

自分の org、プロジェクト、またはブランドが正当な namespace 所有者であると考えているが、
現在の ClawHub 所有者を管理できない場合は、公開可能で機密でない証拠を添えて
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠のガイダンスと公開 issue に含めないものについては、
[Org and Namespace Claims](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルを見つけられなかったと表示する

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否する

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選んでください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しい slug または fork として公開する。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使ってください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページで、スキャン状態と互換性メタデータを確認してください。
- OpenClaw のバージョンが、パッケージで示されている
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまで
  インストールできないことがあります。

## Public API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リスティングへ戻すリンクを提供してください。
- 非表示、非公開、保留、またはモデレーションでブロックされたコンテンツを、
  Public API サーフェスの外部にミラーしないでください。

エンドポイントの詳細は [HTTP API](/clawhub/http-api) を参照してください。
