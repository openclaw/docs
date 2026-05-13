---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、同期、更新、API の問題に関するトラブルシューティング。
x-i18n:
    generated_at: "2026-05-13T04:18:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーは開くが完了しない

CLI はブラウザーログイン中に短命のローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認します。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認します。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認します。

- `Retry-After`: 再試行前に待つ秒数。
- `RateLimit-Remaining` と `RateLimit-Limit`: 現在の割り当て。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても匿名 IP の制限に達することがあります。可能な場合はサインインし、報告された遅延時間の後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## Skill が検索に表示されない

- 正確な slug またはオーナーページが分かっている場合は確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- Skill の所有者である場合は、サインインして調べます。

```bash
clawhub inspect <skill-slug>
```

オーナーに表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明されることがあります。

## 必須メタデータがないため publish が失敗する

Skills については、`SKILL.md` の frontmatter を確認します。ユーザーとスキャナーがパッケージを理解できるように、必須の環境変数とツールを宣言する必要があります。

plugins については、`package.json` の互換性メタデータを確認します。コード Plugin の publish には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず publish ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースのエラーで publish が失敗する

ClawHub は GitHub ID とソースの帰属情報を使って、パッケージとその公開者を関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認します。
- GitHub ソースには、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使います。

## `sync` で Skills が見つからないと表示される

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか分からない場合は、まずプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択します。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update <slug> --force
```

- 編集済みコピーを新しい slug またはフォークとして公開します。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使います。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認します。
- 使用中の OpenClaw バージョンが、パッケージで示されている互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまでインストールできないことがあります。

## Public API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リストへ戻すリンクを提供します。
- 非表示、非公開、保留、またはモデレーションでブロックされたコンテンツを Public API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については [HTTP API](/ja-JP/clawhub/http-api) を参照してください。
