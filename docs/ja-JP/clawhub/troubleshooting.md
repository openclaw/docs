---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できません
summary: ClawHubのサインイン、インストール、公開、更新、APIの問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-03T23:26:18Z"
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
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使っている場合は、Web UI で失効されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を確認してください。

- `Retry-After`: リトライ前に待機する秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り枠。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、匿名 IP 上限に達することがあります。可能な場合はサインインし、報告された遅延後に再試行してください。

## プロキシの背後で検索またはインストールが失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## Skills が検索に表示されない

- 正確なスラッグまたはオーナーページが分かっている場合は確認してください。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認してください。
- Skills の所有者である場合は、サインインして調査してください。

```bash
clawhub inspect @openclaw/demo
```

オーナーに表示される診断情報で、スキャン、アップロードゲート、モデレーションの状態が説明される場合があります。

## 必須メタデータが不足しているため公開に失敗する

Skills の場合は、`SKILL.md` の frontmatter を確認してください。必須の環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースのエラーで公開に失敗する

ClawHub は GitHub の ID とソース帰属を使用して、パッケージを公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセスできることを確認してください。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## 名前空間が要求済みまたは予約済みのため公開に失敗する

オーナーハンドル、組織の名前空間、パッケージスコープ、Skills のスラッグ、またはパッケージ名がすでに要求済みまたは予約済みであるため公開に失敗した場合は、まずその名前空間に一致するオーナーとして公開していることを確認してください。Plugin パッケージでは、`@example-org/example-plugin` のようなスコープ付き名前は、対応する `example-org` オーナーとして公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間オーナーであると考えているものの、現在の ClawHub オーナーを管理できない場合は、公開可能で機密性のない証拠を添えて
[組織 / 名前空間要求の issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠のガイダンスと公開 issue に含めるべきでない内容については、
[組織と名前空間の要求](/clawhub/namespace-claims) を参照してください。

## `sync` が Skills が見つからなかったと表示する

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

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- OpenClaw のバージョンが、パッケージで示されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまでインストールできない可能性があります。

## Public API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開リストおよび検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リストへ戻すリンクを用意してください。
- 非表示、非公開、保留、またはモデレーションでブロックされたコンテンツを、Public API サーフェスの外部でミラーしないでください。

エンドポイントの詳細は [HTTP API](/clawhub/http-api) を参照してください。
