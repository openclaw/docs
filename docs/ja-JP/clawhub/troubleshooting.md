---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できません
summary: ClawHub のサインイン、インストール、公開、同期、更新、API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-05-11T22:20:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短命のローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックがまったく届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成して、次を実行してください。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を読んでください。

- `Retry-After`: リトライ前に待機する秒数。
- `RateLimit-Remaining` と `RateLimit-Limit`: 現在の割り当て。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、
匿名 IP の制限に達することがあります。可能な場合はサインインし、報告された遅延後にリトライしてください。

## 検索またはインストールがプロキシ配下で失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、
`http_proxy` があります。

## skill が検索に表示されない

- 正確な slug または owner ページがわかる場合は確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- その skill の owner である場合は、サインインして調べてください。

```bash
clawhub inspect <skill-slug>
```

owner に表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明されることがあります。

## 必須メタデータがないため公開に失敗する

Skills の場合は、`SKILL.md` の frontmatter を確認してください。必要な環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

plugins の場合は、`package.json` の互換性メタデータを確認してください。code-plugin の公開には、
`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub owner または source エラーで公開に失敗する

ClawHub は GitHub ID と source の帰属情報を使用して、パッケージをその
公開者に結び付けます。

- パッケージを所有しているか公開できる GitHub アカウントでサインインしていることを確認してください。
- source URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub source の場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## `sync` が Skills が見つからないと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるかわからない場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選んでください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update <slug> --force
```

- 編集済みコピーを新しい slug または fork として公開する。

## Plugin のインストールが OpenClaw で失敗する

- 明示的な ClawHub source を使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- 使用中の OpenClaw バージョンが、パッケージで示されている
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、owner が問題を解決するまで
  インストールできないことがあります。

## Public API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リストへ戻すリンクを示してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを
  Public API surface の外部にミラーしないでください。

エンドポイントの詳細は [HTTP API](/ja-JP/clawhub/http-api) を参照してください。
