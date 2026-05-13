---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、同期、更新、API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-05-13T05:33:29Z"
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
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成し、次を実行します。

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
- `RateLimit-Remaining` と `RateLimit-Limit`: 現在の予算。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延時間の後に再試行してください。

## プロキシの背後で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` があります。

## スキルが検索に表示されない

- 正確なスラッグまたは所有者ページが分かっている場合は確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- 自分がそのスキルの所有者である場合は、サインインして調査してください。

```bash
clawhub inspect <skill-slug>
```

所有者に表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明されていることがあります。

## 必須メタデータが不足しているため公開に失敗する

スキルの場合は、`SKILL.md` のフロントマターを確認してください。必要な環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースのエラーで公開に失敗する

ClawHub は GitHub の ID とソース帰属を使って、パッケージを公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## `sync` がスキルが見つからないと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、先にプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更があるため `update` が拒否される

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。いずれかを選んでください。

- ローカル編集を保持して更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update <slug> --force
```

- 編集済みのコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- 使用している OpenClaw バージョンが、パッケージで提示されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留中、またはブロック中の場合、所有者が問題を解決するまでインストールできないことがあります。

## パブリック API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リストに戻してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、パブリック API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/ja-JP/clawhub/http-api) を参照してください。
