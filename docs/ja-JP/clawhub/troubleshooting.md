---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、更新できません
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングする。
x-i18n:
    generated_at: "2026-07-03T00:52:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認してください。

- `Retry-After`: 再試行まで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り割り当て。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、
匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延時間の後に再試行してください。

## プロキシ背後で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確なスラッグまたは所有者ページが分かっている場合は確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- 自分がそのスキルの所有者である場合は、サインインして調べてください。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータがないため公開に失敗する

スキルの場合は、`SKILL.md` のフロントマターを確認してください。必須の環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認してください。code-plugin の公開には、
`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースのエラーで公開に失敗する

ClawHub は GitHub ID とソース帰属情報を使って、パッケージとその
公開者を関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使います。

## 名前空間が取得済みまたは予約済みのため公開に失敗する

所有者ハンドル、組織名前空間、パッケージスコープ、スキル
スラッグ、またはパッケージ名がすでに取得済みまたは予約済みで公開に失敗する場合は、まずその名前空間に一致する所有者で
公開していることを確認してください。Plugin パッケージでは、
`@example-org/example-plugin` のようなスコープ付き名前は、対応する
`example-org` 所有者として公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間所有者だと考えているが、
現在の ClawHub 所有者を管理できない場合は、公開可能で機密でない証拠を添えて
[組織 / 名前空間申請 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠の指針と公開 issue に含めないものについては、
[組織と名前空間の申請](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルは見つからなかったと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不確かな場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否する

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使います。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認してください。
- OpenClaw のバージョンが、パッケージで提示されている
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまで
  インストールできないことがあります。

## 公開 API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub 掲載ページへ戻すリンクを示してください。
- 非表示、非公開、保留、またはモデレーションでブロックされたコンテンツを、公開 API サーフェスの外部に
  ミラーしないでください。

エンドポイントの詳細は [HTTP API](/clawhub/http-api) を参照してください。
