---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-01T15:19:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザを開くが完了しない

CLI はブラウザログイン中に短命のローカルコールバックサーバーを起動します。

- ブラウザが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインします。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認します。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認します。

- `Retry-After`: 再試行前に待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーのリクエスト数が少なくても
匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延時間の後に再試行します。

## 検索またはインストールがプロキシ越しで失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、
`http_proxy` が含まれます。

## Skills が検索に表示されない

- 正確な slug または所有者ページが分かっている場合は確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- 自分が Skills の所有者である場合は、サインインして調査します。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータがないため公開に失敗する

Skills では、`SKILL.md` のフロントマターを確認します。必須の環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

plugins では、`package.json` の互換性メタデータを確認します。code-plugin の公開には
`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの
OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースのエラーで公開に失敗する

ClawHub は GitHub ID とソース帰属を使って、パッケージとその
公開者を結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認します。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使います。

## namespace が要求済みまたは予約済みのため公開に失敗する

所有者ハンドル、org namespace、パッケージスコープ、Skills
slug、またはパッケージ名がすでに要求済みまたは予約済みのため公開に失敗した場合は、まずその namespace と一致する所有者で
公開していることを確認します。Plugin パッケージでは、
`@example-org/example-plugin` のようなスコープ付き名前は、一致する
`example-org` 所有者として公開する必要があります。

自分の org、プロジェクト、またはブランドが正当な namespace 所有者だと考えるが、
現在の ClawHub 所有者を管理できない場合は、公開可能で機密でない証拠を添えて
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠の指針と公開 issue に含めないものについては、
[Org and Namespace Claims](/clawhub/namespace-claims) を参照してください。

## `sync` が Skills が見つからなかったと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更があるため `update` が拒否する

ローカルファイルは ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選びます。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しい slug またはフォークとして公開します。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使います。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認します。
- OpenClaw バージョンがパッケージの提示する
  互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまで
  インストールできない可能性があります。

## 公開 API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リスティングへリンクします。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを
  公開 API サーフェス外にミラーしないでください。

エンドポイントの詳細は [HTTP API](/clawhub/http-api) を参照してください。
