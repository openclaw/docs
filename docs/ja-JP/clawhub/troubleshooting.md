---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できません
summary: ClawHub のサインイン、インストール、公開、更新、API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-07-01T07:51:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短時間だけ有効なローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使っている場合は、Web UI で失効されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を読んでください。

- `Retry-After`: 再試行まで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り枠。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、匿名 IP の上限に達することがあります。可能な場合はサインインし、報告された遅延の後で再試行してください。

## 検索またはインストールがプロキシの背後で失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確なスラッグまたはオーナーページが分かる場合は確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- そのスキルの所有者である場合は、サインインして調べてください。

```bash
clawhub inspect @openclaw/demo
```

オーナーに表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータがないため公開に失敗する

スキルでは、`SKILL.md` の frontmatter を確認してください。必須の環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

プラグインでは、`package.json` の互換性メタデータを確認してください。コードプラグインの公開には、`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースのエラーで公開に失敗する

ClawHub は GitHub ID とソース帰属を使って、パッケージを公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使ってください。

## 名前空間が請求済みまたは予約済みのため公開に失敗する

オーナーハンドル、組織名前空間、パッケージスコープ、スキルスラッグ、またはパッケージ名がすでに請求済みまたは予約済みであるため公開に失敗する場合は、まず名前空間と一致するオーナーで公開していることを確認してください。プラグインパッケージでは、
`@example-org/example-plugin` のようなスコープ付き名前は、一致する `example-org` オーナーとして公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間オーナーであると考えているが、
現在の ClawHub オーナーを管理できない場合は、公開可能で機微でない証拠を添えて
[組織 / 名前空間請求 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠のガイダンスと公開 issue に含めないものについては、
[組織と名前空間請求](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルを見つけられなかったと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否する

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選んでください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みのコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw でプラグインのインストールに失敗する

- 明示的な ClawHub ソースを使ってください。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページで、スキャン状態と互換性メタデータを確認してください。
- 使用中の OpenClaw バージョンが、パッケージの提示する
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、オーナーが問題を解決するまで
  インストールできないことがあります。

## 公開 API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リスティングへリンクしてください。
- 非表示、非公開、保留、またはモデレーションでブロックされたコンテンツを、公開 API サーフェスの外に
  ミラーしないでください。

エンドポイントの詳細は [HTTP API](/clawhub/http-api) を参照してください。
