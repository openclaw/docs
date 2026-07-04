---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-07-04T06:21:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーが開くが完了しない

CLI はブラウザーログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認します。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を確認します。

- `Retry-After`: リトライ前に待機する秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、匿名 IP の上限に達することがあります。可能な場合はサインインし、報告された遅延の後にリトライしてください。

## 検索またはインストールがプロキシの背後で失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

対応する名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## skill が検索に表示されない

- 正確なスラッグ、または分かっている場合はオーナーページを確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- その skill のオーナーである場合は、サインインして確認します。

```bash
clawhub inspect @openclaw/demo
```

オーナーに表示される診断により、スキャン、アップロードゲート、またはモデレーション状態を説明できる場合があります。

## 必須メタデータがないため公開に失敗する

Skills では、`SKILL.md` の frontmatter を確認します。ユーザーとスキャナーがパッケージを理解できるように、必須の環境変数とツールを宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認します。code-plugin の公開には、`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

先に公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースエラーで公開に失敗する

ClawHub は GitHub ID とソース帰属を使って、パッケージとその公開者を結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認します。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使います。

## namespace が要求済みまたは予約済みのため公開に失敗する

オーナーハンドル、org namespace、パッケージスコープ、skill スラッグ、またはパッケージ名がすでに要求済みまたは予約済みであるため公開に失敗する場合は、まず namespace と一致するオーナーで公開していることを確認します。Plugin パッケージでは、
`@example-org/example-plugin` のようなスコープ付き名前を、一致する `example-org` オーナーとして公開する必要があります。

自分の org、プロジェクト、またはブランドが正当な namespace オーナーだと考えているが、現在の ClawHub オーナーを管理できない場合は、公開可能で機密ではない証拠を添えて
[org / namespace 要求 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠のガイダンスと公開 issue に含めないものについては、
[org と namespace の要求](/clawhub/namespace-claims) を参照してください。

## `sync` で skill が見つからないと表示される

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不確かな場合は、先にプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否する

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選びます。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使います。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認します。
- OpenClaw のバージョンが、パッケージで提示されている互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまでインストールできないことがあります。

## 公開 API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub 掲載ページに戻すリンクを示します。
- 非表示、非公開、保留、またはモデレーションでブロックされたコンテンツを公開 API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api) を参照してください。
