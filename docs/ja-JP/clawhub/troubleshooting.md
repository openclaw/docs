---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、同期、更新、API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-05-12T04:10:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に、短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成し、次を実行してください。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認してください。

- `Retry-After`: 再試行まで待機する秒数。
- `RateLimit-Remaining` と `RateLimit-Limit`: 現在の割り当て。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、匿名 IP の制限に達することがあります。可能であればサインインし、報告された遅延時間の後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確なスラッグ、または分かっている場合はオーナーページを確認してください。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認してください。
- そのスキルを所有している場合は、サインインして調べてください。

```bash
clawhub inspect <skill-slug>
```

オーナーに表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータがないため公開に失敗する

スキルの場合は、`SKILL.md` の frontmatter を確認してください。ユーザーとスキャナーがパッケージを理解できるよう、必須の環境変数とツールを宣言する必要があります。

plugins の場合は、`package.json` の互換性メタデータを確認してください。code-plugin の公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースのエラーで公開に失敗する

ClawHub は GitHub ID とソースの帰属情報を使用して、パッケージを公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認してください。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## `sync` がスキルを見つけられなかったと表示する

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

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update <slug> --force
```

- 編集したコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で plugin のインストールに失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- 使用中の OpenClaw バージョンが、パッケージで示されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまでインストールできないことがあります。

## Public API リクエストが失敗する

- `429` 再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リスティングに戻すリンクを設定してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを Public API サーフェスの外部にミラーしないでください。

エンドポイントの詳細は [HTTP API](/ja-JP/clawhub/http-api) を参照してください。
