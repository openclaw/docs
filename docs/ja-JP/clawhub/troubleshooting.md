---
read_when:
    - ClawHub CLI または OpenClaw registry コマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-06T10:48:06Z"
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
- コールバックが到着しない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して、次を実行してください。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を読んでください。

- `Retry-After`: 再試行する前に待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが数件のリクエストしか送っていなくても、匿名 IP 制限に達することがあります。可能であればサインインし、報告された遅延後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## skill が検索に表示されない

- 正確な slug または所有者ページがわかっている場合は確認してください。
- リリースが公開されていて、スキャンまたはモデレーションで保留されていないことを確認してください。
- skill を所有している場合は、サインインして調査してください。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断により、スキャン、アップロードゲート、またはモデレーション状態が説明される場合があります。

## 必須メタデータがないため publish が失敗する

Skills では、`SKILL.md` の frontmatter を確認してください。必須の環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず publish ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースエラーで publish が失敗する

ClawHub は GitHub ID とソース帰属を使って、パッケージを公開者に結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## namespace が要求済みまたは予約済みのため publish が失敗する

所有者ハンドル、org namespace、パッケージスコープ、skill
slug、またはパッケージ名がすでに要求済みまたは予約済みで publish が失敗する場合は、まず namespace に一致する所有者で公開していることを確認してください。Plugin パッケージでは、
`@example-org/example-plugin` のような scoped name は、一致する `example-org` 所有者として公開する必要があります。

自分の org、プロジェクト、またはブランドが正当な namespace 所有者だと考えているが、現在の ClawHub 所有者を管理できない場合は、公開されても問題のない非機密の証拠を添えて
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を作成してください。証拠のガイダンスと、公開 issue に含めないものについては
[Org and Namespace Claims](/clawhub/namespace-claims) を参照してください。

## `sync` が skill が見つからなかったと言う

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

ローカルファイルは ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選んでください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しい slug またはフォークとして公開する。

## OpenClaw で Plugin インストールが失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- OpenClaw のバージョンが、パッケージで明示されている
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留中、またはブロック中の場合、所有者が問題を解決するまでインストールできないことがあります。

## Public API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リストに戻すリンクを設置してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを Public API サーフェスの外部でミラーしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api) を参照してください。
