---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API に関する問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-07-16T11:28:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に、短時間だけ稼働するローカルコールバックサーバーを起動します。

- ブラウザーから `http://127.0.0.1:<port>/callback` にアクセスできることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認してください。

- `Retry-After`: 再試行までの待機秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り割り当て量。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが数件のリクエストしか
送信していなくても、匿名 IP の上限に達することがあります。可能であればサインインし、
報告された待機時間の後に再試行してください。

## プロキシ環境で検索またはインストールに失敗する

CLI は標準のプロキシ変数を使用します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、
`http_proxy` があります。

## skill が検索結果に表示されない

- 正確なスラッグまたは所有者ページが分かっている場合は、それを確認してください。
- リリースが公開されており、スキャンまたはモデレーションによって保留されていないことを確認してください。
- skill の所有者である場合は、サインインして調査してください。

```bash
clawhub inspect @openclaw/demo
```

所有者にのみ表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態を確認できる場合があります。

## 必須メタデータが不足しているため公開に失敗する

Skills の場合は、`SKILL.md` の frontmatter を確認してください。ユーザーとスキャナーがパッケージを理解できるように、必要な環境変数と
ツールを宣言する必要があります。

plugins の場合は、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、
`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub の所有者またはソースのエラーにより公開に失敗する

ClawHub は GitHub の ID とソース帰属情報を使用して、パッケージをその
公開者に関連付けます。

- パッケージを所有しているか公開できる GitHub アカウントでサインインしていることを
  確認してください。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## 名前空間が取得済みまたは予約済みのため公開に失敗する

所有者ハンドル、組織の名前空間、パッケージスコープ、skill の
スラッグ、またはパッケージ名がすでに取得済みか予約済みのため公開に失敗した場合は、まず
名前空間と一致する所有者として公開していることを確認してください。Plugin パッケージでは、
`@example-org/example-plugin` のようなスコープ付き名称は、対応する
`example-org` 所有者として公開する必要があります。

自身の組織、プロジェクト、またはブランドが正当な名前空間の所有者であるにもかかわらず、
現在の ClawHub 所有者を管理できない場合は、公開可能かつ機密性のない証拠を添えて
[組織／名前空間の申請に関する issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を作成してください。証拠に関するガイダンスと公開 issue に含めない情報については、
[組織と名前空間の申請](/clawhub/namespace-claims)を参照してください。

## `sync` が Skills が見つからなかったと表示する

`sync` は、`SKILL.md` または `skill.md` を含むフォルダーを検索します。

スキャンするルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか分からない場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## `update` がローカルの変更を理由に拒否する

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカルの編集を保持し、更新をスキップします。
- 公開済みのバージョンで上書きします。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しいスラッグまたはフォークとして公開します。

## OpenClaw で Plugin のインストールに失敗する

- ClawHub ソースを明示的に指定します。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージの詳細ページで、スキャン状態と互換性メタデータを確認してください。
- 使用している OpenClaw のバージョンが、パッケージに示された
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまで
  インストールできないことがあります。

## 公開 API リクエストに失敗する

- `429` の再試行ヘッダーに従い、公開リストや検索のレスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub 掲載ページへ案内してください。
- 非表示、非公開、保留中、またはモデレーションによってブロックされたコンテンツを、公開 API の範囲外に
  ミラーリングしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api)を参照してください。
