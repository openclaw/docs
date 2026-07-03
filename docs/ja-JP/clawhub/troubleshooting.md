---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-03T13:16:24Z"
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

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して次を実行してください。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認してください。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認してください。

- `Retry-After`: 再試行まで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

対応する名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確な slug または所有者ページが分かっている場合は確認してください。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認してください。
- スキルの所有者である場合は、サインインして調査してください。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータが不足しているため公開が失敗する

スキルでは、`SKILL.md` の frontmatter を確認してください。必須の環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースのエラーで公開が失敗する

ClawHub は GitHub の ID とソース帰属を使って、パッケージと公開者を結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使ってください。

## namespace が取得済みまたは予約済みのため公開が失敗する

所有者ハンドル、org namespace、パッケージスコープ、スキル slug、またはパッケージ名がすでに取得済みまたは予約済みであるため公開が失敗した場合は、まず namespace と一致する所有者で公開していることを確認してください。Plugin パッケージでは、`@example-org/example-plugin` のようなスコープ付き名前は、一致する `example-org` 所有者として公開する必要があります。

自分の org、プロジェクト、またはブランドが正当な namespace 所有者だと考えているが、現在の ClawHub 所有者を管理できない場合は、公開可能で機密でない証拠を添えて [Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) を開いてください。証拠のガイダンスと公開 issue に含めない内容については、[Org and Namespace Claims](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルが見つからなかったと表示する

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選んでください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しい slug またはフォークとして公開する。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使ってください。

```bash
openclaw plugins install clawhub:<package>
```

- スキャン状態と互換性メタデータについて、パッケージ詳細ページを確認してください。
- OpenClaw のバージョンが、パッケージで示されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留中、またはブロック中の場合、所有者が問題を解決するまでインストールできないことがあります。

## Public API リクエストが失敗する

- `429` の再試行ヘッダーに従い、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リストに戻すリンクを示してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを Public API サーフェスの外部にミラーしないでください。

エンドポイントの詳細は [HTTP API](/clawhub/http-api) を参照してください。
