---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できません
summary: ClawHubのサインイン、インストール、公開、更新、APIの問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-04T10:26:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーが開くが完了しない

CLI はブラウザーログイン中に短時間だけ有効なローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認します。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認します。

- `Retry-After`: 再試行まで待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り割り当て。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送っていなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延時間の後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確な slug または所有者ページが分かっている場合は確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- そのスキルを所有している場合は、サインインして調べます。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータが不足しているため公開に失敗する

スキルでは、`SKILL.md` の frontmatter を確認します。必須の環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin では、`package.json` の互換性メタデータを確認します。コードPluginの公開には、
`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースエラーにより公開に失敗する

ClawHub は、GitHub ID とソース帰属を使用してパッケージとその
公開者を結び付けます。

- パッケージを所有しているか公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されているか、ClawHub からアクセス可能であることを確認します。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用します。

## namespace が要求済みまたは予約済みのため公開に失敗する

所有者ハンドル、組織 namespace、パッケージ scope、スキル
slug、またはパッケージ名がすでに要求済みまたは予約済みであるため公開に失敗する場合は、まず
namespace と一致する所有者で公開していることを確認します。Plugin パッケージでは、
`@example-org/example-plugin` のような scoped name は、一致する
`example-org` 所有者として公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な namespace 所有者だと考えているものの、
現在の ClawHub 所有者を管理できない場合は、公開可能で機密ではない証拠を添えて
[組織 / namespace 要求 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠の指針と公開 issue に含めないものについては、
[組織と namespace の要求](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルを見つけられなかったと表示する

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否する

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択します。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しい slug またはフォークとして公開する。

## OpenClaw で Plugin のインストールが失敗する

- 明示的な ClawHub ソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

- スキャン状態と互換性メタデータについて、パッケージ詳細ページを確認します。
- 使用中の OpenClaw バージョンが、パッケージで示されている
  互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまで
  インストールできないことがあります。

## Public API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リストへリンクします。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを
  Public API サーフェスの外にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api) を参照してください。
