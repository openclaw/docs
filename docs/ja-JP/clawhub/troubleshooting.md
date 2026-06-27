---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-06-27T17:10:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザは開くが完了しない

CLI はブラウザログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックがまったく届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成し、次を実行してください。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認してください。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を読んでください。

- `Retry-After`: 再試行するまで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り割り当て。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが数件のリクエストしか送っていなくても、匿名 IP の上限に達することがあります。可能な場合はサインインし、報告された遅延時間の後で再試行してください。

## プロキシ背後で検索またはインストールに失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## skill が検索に表示されない

- 正確な slug またはオーナーページが分かっている場合は確認してください。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認してください。
- その skill の所有者である場合は、サインインして調査してください。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断情報で、スキャン、アップロードゲート、モデレーションの状態が説明される場合があります。

## 必須メタデータがないため publish に失敗する

Skills では、`SKILL.md` のフロントマターを確認してください。必要な環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず publish ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースのエラーで publish に失敗する

ClawHub は GitHub の ID とソース帰属を使って、パッケージを公開者に接続します。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認してください。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使ってください。

## 名前空間が取得済みまたは予約済みのため publish に失敗する

オーナーハンドル、組織の名前空間、パッケージスコープ、skill slug、またはパッケージ名がすでに取得済みまたは予約済みであるため publish に失敗する場合は、まずその名前空間に一致するオーナーで公開していることを確認してください。Plugin パッケージでは、`@example-org/example-plugin` のようなスコープ付き名前は、一致する `example-org` オーナーとして公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間の所有者であると考えているものの、現在の ClawHub オーナーを管理できない場合は、公開可能で機密ではない証拠を添えて [組織 / 名前空間の請求 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) を開いてください。証拠のガイダンスと、公開 issue に含めないものについては、[組織と名前空間の請求](/ja-JP/clawhub/namespace-claims) を参照してください。

## `sync` が skill が見つからないと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか分からない場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選んでください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しい slug またはフォークとして公開する。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使ってください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページで、スキャン状態と互換性メタデータを確認してください。
- 使用している OpenClaw バージョンが、パッケージで告知されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまでインストールできない可能性があります。

## 公開 API リクエストに失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リスティングへ戻すリンクを示してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを公開 API サーフェスの外部にミラーしないでください。

エンドポイントの詳細は [HTTP API](/ja-JP/clawhub/http-api) を参照してください。
