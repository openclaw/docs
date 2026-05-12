---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、同期、更新、API に関する問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-05-12T00:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短時間だけ動作するローカルコールバックサーバーを開始します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使用している場合は、それが Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を読んでください。

- `Retry-After`: リトライ前に待機する秒数。
- `RateLimit-Remaining` と `RateLimit-Limit`: 現在の割り当て。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多数のユーザーが 1 つの出口 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、
匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延の後にリトライしてください。

## 検索またはインストールがプロキシ環境で失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確なスラッグまたはオーナーページが分かっている場合は確認してください。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認してください。
- そのスキルを所有している場合は、サインインして調査してください。

```bash
clawhub inspect <skill-slug>
```

オーナーに表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明されることがあります。

## 必須メタデータが不足しているため公開が失敗する

スキルの場合は、`SKILL.md` の frontmatter を確認してください。ユーザーとスキャナーがパッケージを理解できるように、
必須の環境変数とツールを宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認してください。code-plugin の公開には、
`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub のオーナーまたはソースのエラーで公開が失敗する

ClawHub は GitHub の ID とソース帰属情報を使用して、パッケージを公開者に結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されている、または ClawHub からアクセスできることを確認してください。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## `sync` がスキルを検出しなかったと表示する

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更があるため `update` が拒否する

ローカルファイルが ClawHub の既知のどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update <slug> --force
```

- 編集済みのコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- スキャン状態と互換性メタデータについて、パッケージの詳細ページを確認してください。
- OpenClaw のバージョンが、パッケージで提示されている
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留中、またはブロック中の場合、オーナーが問題を解決するまでインストールできないことがあります。

## Public API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リスティングへ戻すリンクを示してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、
  Public API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/ja-JP/clawhub/http-api) を参照してください。
