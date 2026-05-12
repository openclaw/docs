---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できません
summary: ClawHub のサインイン、インストール、公開、同期、更新、API に関する問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-05-12T08:44:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーは開くが完了しない

CLI はブラウザーログイン中に短時間だけ有効なローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認します。
- API トークンを使用している場合は、Web UI で失効されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を確認します。

- `Retry-After`: リトライまで待つ秒数。
- `RateLimit-Remaining` と `RateLimit-Limit`: 現在の利用枠。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延後にリトライしてください。

## プロキシの背後で検索またはインストールに失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` があります。

## スキルが検索に表示されない

- 正確な slug または所有者ページが分かる場合は確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- そのスキルの所有者である場合は、サインインして調査します。

```bash
clawhub inspect <skill-slug>
```

所有者に表示される診断で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータが欠落しているため公開に失敗する

スキルの場合は、`SKILL.md` のフロントマターを確認します。必須の環境変数とツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認します。コード Plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースのエラーで公開に失敗する

ClawHub は GitHub ID とソース帰属を使用して、パッケージとその公開者を結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されている、または ClawHub からアクセスできることを確認します。
- GitHub ソースには、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用します。

## `sync` がスキルは見つからなかったと表示する

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、先にプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択します。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update <slug> --force
```

- 編集したコピーを新しい slug またはフォークとして公開します。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認します。
- 使用中の OpenClaw バージョンが、パッケージで提示されている互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留中、またはブロック中の場合、所有者が問題を解決するまでインストールできないことがあります。

## 公開 API リクエストが失敗する

- `429` リトライヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リストへリンクします。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、公開 API サーフェスの外部にミラーしないでください。

エンドポイントの詳細は [HTTP API](/ja-JP/clawhub/http-api) を参照してください。
