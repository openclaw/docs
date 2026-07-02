---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-02T07:58:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短命のローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認します。
- API トークンを使っている場合は、それが Web UI で取り消されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認します。

- `Retry-After`: 再試行するまで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り枠。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、匿名 IP の上限に達することがあります。可能な場合はサインインし、報告された遅延時間の後で再試行します。

## 検索またはインストールがプロキシ越しで失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確なスラッグ、または分かっている場合はオーナーページを確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- そのスキルのオーナーである場合は、サインインして調べます。

```bash
clawhub inspect @openclaw/demo
```

オーナーに表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータがないため公開に失敗する

スキルでは、`SKILL.md` のフロントマターを確認します。必須の環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認します。コードPlugin の公開には、
`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースのエラーで公開に失敗する

ClawHub は GitHub のアイデンティティとソース帰属を使って、パッケージをその公開者に結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認します。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使います。

## 名前空間が請求済みまたは予約済みのため公開に失敗する

オーナーハンドル、組織の名前空間、パッケージスコープ、スキル
スラッグ、またはパッケージ名がすでに請求済みまたは予約済みであるため公開に失敗する場合は、まず、その名前空間に一致するオーナーで公開していることを確認します。Plugin パッケージでは、
`@example-org/example-plugin` のようなスコープ付き名前を、対応する
`example-org` オーナーとして公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間オーナーであると考えているが、現在の ClawHub オーナーを管理できない場合は、公開可能で機微でない証拠を添えて
[組織 / 名前空間の請求 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開きます。証拠の指針と公開 issue に含めないものについては、
[組織と名前空間の請求](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルが見つからないと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか分からない場合は、まずプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否する

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。いずれかを選びます。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しいスラッグまたはフォークとして公開します。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使います。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認します。
- 使用中の OpenClaw バージョンが、パッケージで示されている
  互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留中、またはブロック中の場合は、オーナーが問題を解決するまでインストールできないことがあります。

## 公開 API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リストおよび検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リスティングに戻すリンクを提示します。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、公開 API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api) を参照してください。
