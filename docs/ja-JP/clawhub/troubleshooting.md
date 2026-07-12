---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-11T22:04:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーが開くが完了しない

CLI はブラウザーでのログイン中に、短時間だけ有効なローカルコールバックサーバーを起動します。

- ブラウザーから `http://127.0.0.1:<port>/callback` にアクセスできることを確認してください。
- コールバックが届かない場合は、ローカルのファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンスに含まれる再試行情報を確認してください。

- `Retry-After`: 再試行するまで待機する秒数。
- `RateLimit-Limit`: このリクエストに適用される上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り割り当て量。`429` の場合は `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多数のユーザーが同じ送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、匿名 IP の上限に達することがあります。可能であればサインインし、通知された待機時間の経過後に再試行してください。

## プロキシ環境で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

対応している変数名には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` があります。

## 検索結果に skill が表示されない

- 正確なスラッグまたは所有者ページが分かる場合は、それを確認してください。
- リリースが公開されており、スキャンやモデレーションによって保留されていないことを確認してください。
- その skill の所有者である場合は、サインインして詳細を確認します。

```bash
clawhub inspect @openclaw/demo
```

所有者にのみ表示される診断情報に、スキャン、アップロードゲート、モデレーションの状態に関する説明が含まれている場合があります。

## 必須メタデータがないため公開に失敗する

skill の場合は、`SKILL.md` のフロントマターを確認してください。ユーザーとスキャナーがパッケージを理解できるように、必要な環境変数とツールを宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub の所有者またはソースに関するエラーで公開に失敗する

ClawHub は GitHub の ID とソース帰属情報を使用して、パッケージとその公開者を関連付けます。

- パッケージを所有しているか、公開権限を持つ GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセスできることを確認してください。
- GitHub ソースには、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## 名前空間が取得済みまたは予約済みのため公開に失敗する

所有者ハンドル、組織の名前空間、パッケージスコープ、skill のスラッグ、またはパッケージ名がすでに取得済みまたは予約済みであるため公開に失敗した場合は、まず名前空間と一致する所有者として公開していることを確認してください。Plugin パッケージでは、`@example-org/example-plugin` のようなスコープ付きの名前は、対応する `example-org` 所有者として公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間所有者であるにもかかわらず、現在の ClawHub 所有者を管理できないと考える場合は、公開可能な機密性のない証明を添えて、[組織／名前空間の取得申請 Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)を作成してください。証拠に関するガイダンスと公開 Issue に含めない情報については、[組織と名前空間の取得申請](/clawhub/namespace-claims)を参照してください。

## `sync` で skill が見つからなかったと表示される

`sync` は、`SKILL.md` または `skill.md` を含むフォルダーを検索します。

スキャンするルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカルの変更があるため `update` が拒否される

ローカルファイルが、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカルの編集を維持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で Plugin のインストールに失敗する

- ClawHub ソースを明示的に指定します。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージの詳細ページで、スキャン状態と互換性メタデータを確認してください。
- 使用している OpenClaw のバージョンが、パッケージで明示されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまでインストールできないことがあります。

## パブリック API リクエストが失敗する

- `429` の再試行ヘッダーに従い、公開リストおよび検索のレスポンスをキャッシュしてください。
- ユーザーを ClawHub の正規掲載ページへ誘導してください。
- 非表示、非公開、保留、またはモデレーションによってブロックされたコンテンツを、パブリック API の範囲外に複製しないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api)を参照してください。
