---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-06-28T07:42:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザを開くが完了しない

CLI はブラウザログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を読んでください。

- `Retry-After`: 再試行前に待つ秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが数件のリクエストしか送信していなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## Skills が検索に表示されない

- 正確なスラッグ、または分かっている場合は所有者ページを確認してください。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認してください。
- その Skills を所有している場合は、サインインして検査してください。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断で、スキャン、アップロードゲート、またはモデレーション状態が説明されることがあります。

## 必須メタデータが不足しているため公開に失敗する

Skills の場合は、`SKILL.md` の frontmatter を確認してください。必要な環境変数と
ツールは、ユーザーとスキャナーがパッケージを理解できるように宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースエラーで公開に失敗する

ClawHub は GitHub ID とソース帰属を使用して、パッケージをその
公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- ソース URL が公開されている、または ClawHub からアクセス可能であることを確認してください。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## 名前空間が取得済みまたは予約済みのため公開に失敗する

所有者ハンドル、組織名前空間、パッケージスコープ、Skills
スラッグ、またはパッケージ名がすでに取得済みまたは予約済みであるため公開に失敗する場合は、まず名前空間と一致する所有者で公開していることを確認してください。Plugin パッケージの場合、
`@example-org/example-plugin` のようなスコープ付き名前は、一致する
`example-org` 所有者として公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間所有者であると考えているが、現在の ClawHub 所有者を管理できない場合は、公開可能で非機密の証拠を添えて
[組織 / 名前空間請求 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠の指針と公開 issue に含めないものについては、
[組織と名前空間請求](/ja-JP/clawhub/namespace-claims) を参照してください。

## `sync` が Skills が見つからないと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不確かな場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更があるため `update` が拒否する

ローカルファイルは、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しいスラッグまたはフォークとして公開します。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- スキャン状態と互換性メタデータについて、パッケージ詳細ページを確認してください。
- 使用中の OpenClaw バージョンが、パッケージの提示する
  互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまでインストールできないことがあります。

## パブリック API リクエストが失敗する

- `429` の再試行ヘッダーを尊重し、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リスティングへ戻すリンクを設定してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、パブリック API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/ja-JP/clawhub/http-api) を参照してください。
