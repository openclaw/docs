---
read_when:
    - ClawHub CLI または OpenClaw registry コマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、APIの問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-07-04T03:35:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーは開くが完了しない

CLI はブラウザーログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認します。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認します。

- `Retry-After`: 再試行まで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確なスラッグ、または分かっている場合はオーナーページを確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- 自分がそのスキルを所有している場合は、サインインして調査します。

```bash
clawhub inspect @openclaw/demo
```

オーナーに表示される診断情報により、スキャン、アップロードゲート、またはモデレーション状態を説明できる場合があります。

## 必須メタデータがないため公開に失敗する

スキルの場合は、`SKILL.md` のフロントマターを確認します。ユーザーとスキャナーがパッケージを理解できるように、必須の環境変数とツールを宣言する必要があります。

プラグインの場合は、`package.json` の互換性メタデータを確認します。コードプラグインの公開には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub オーナーまたはソースエラーで公開に失敗する

ClawHub は GitHub の ID とソース属性を使用して、パッケージを公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されている、または ClawHub からアクセスできることを確認します。
- GitHub ソースの場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用します。

## 名前空間が要求済みまたは予約済みのため公開に失敗する

オーナーハンドル、組織名前空間、パッケージスコープ、スキルスラッグ、またはパッケージ名がすでに要求済みまたは予約済みであるため公開に失敗する場合は、まず名前空間と一致するオーナーで公開していることを確認してください。プラグインパッケージの場合、`@example-org/example-plugin` のようなスコープ付き名前は、一致する `example-org` オーナーとして公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間オーナーであると考えているが、現在の ClawHub オーナーを管理できない場合は、公開可能で機密ではない証拠を添えて [組織 / 名前空間要求の issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) を開いてください。証拠のガイダンスと、公開 issue に含めない内容については、[組織と名前空間の要求](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルが見つからないと表示する

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

ローカルファイルは、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択します。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しいスラッグまたはフォークとして公開します。

## OpenClaw でプラグインのインストールが失敗する

- 明示的な ClawHub ソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページでスキャン状態と互換性メタデータを確認します。
- 使用中の OpenClaw バージョンが、パッケージで提示されている互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留中、またはブロックされている場合、オーナーが問題を解決するまでインストールできない可能性があります。

## パブリック API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リストへ戻すリンクを示します。
- 非表示、プライベート、保留中、またはモデレーションでブロックされたコンテンツを、パブリック API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api) を参照してください。
